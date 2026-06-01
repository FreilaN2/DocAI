import os
import traceback
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import logging

load_dotenv()
logger = logging.getLogger(__name__)

DB_USER = os.getenv("DB_USER", "root")
DB_PASS = os.getenv("DB_PASS", "")
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
if DB_HOST == "localhost":
    DB_HOST = "127.0.0.1"
# DB_NAME: intentar múltiples variables que Railway puede usar
DB_NAME = (
    os.getenv("DB_NAME")
    or os.getenv("MYSQLDATABASE")       # Railway: sin guion bajo
    or os.getenv("MYSQL_DATABASE")      # Railway: con guion bajo
    or "railway"                        # Nombre por defecto en Railway
)
DB_PORT = os.getenv("DB_PORT", "3306") or "3306"

logger.info(f"📋 DB config → host={DB_HOST}:{DB_PORT} db={DB_NAME} user={DB_USER}")

# Railway provee MYSQL_URL directamente — usarla si está disponible
RAILWAY_MYSQL_URL = os.getenv("MYSQL_URL", "")
if RAILWAY_MYSQL_URL:
    # Railway usa mysql:// pero SQLAlchemy necesita mysql+pymysql://
    DATABASE_URL = RAILWAY_MYSQL_URL.replace("mysql://", "mysql+pymysql://", 1)
    logger.info(f"🚂 Usando MYSQL_URL de Railway")
else:
    DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    logger.info(f"🗄️ Usando variables DB_* individuales: host={DB_HOST}:{DB_PORT}")

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=280,
    pool_size=5,
    max_overflow=10
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def _add_column_if_not_exists(conn, table_name, column_name, column_definition):
    """
    Verifica de manera segura en MySQL si una columna existe antes de intentar crearla.
    """
    check_sql = text("""
        SELECT COUNT(*) 
        FROM information_schema.columns 
        WHERE table_schema = :db_name 
        AND table_name = :table_name 
        AND column_name = :column_name
    """)
    result = conn.execute(check_sql, {
        "db_name": DB_NAME, 
        "table_name": table_name, 
        "column_name": column_name
    }).scalar()
    
    if result == 0:
        try:
            alter_sql = text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_definition}")
            conn.execute(alter_sql)
            conn.commit()
            logger.info(f"✅ Columna '{column_name}' agregada a la tabla '{table_name}'.")
        except Exception as e:
            conn.rollback()
            logger.error(f"❌ Error al agregar {column_name} a {table_name}: {e}")


def _run_safe_migrations(conn):
    """
    Migraciones seguras para columnas faltantes.
    """
    _add_column_if_not_exists(conn, "plans", "tokens_per_month", "INT DEFAULT 0")
    _add_column_if_not_exists(conn, "plans", "has_watermark", "BOOLEAN DEFAULT FALSE")
    _add_column_if_not_exists(conn, "plans", "has_ai_analysis", "BOOLEAN DEFAULT FALSE")

    _add_column_if_not_exists(conn, "users", "country", "VARCHAR(100)")
    _add_column_if_not_exists(conn, "users", "is_email_verified", "BOOLEAN DEFAULT FALSE")
    _add_column_if_not_exists(conn, "users", "is_active", "BOOLEAN DEFAULT TRUE")
    _add_column_if_not_exists(conn, "users", "last_login_at", "DATETIME")
    _add_column_if_not_exists(conn, "users", "last_login_ip", "VARCHAR(45)")
    _add_column_if_not_exists(conn, "users", "failed_login_attempts", "INT DEFAULT 0")
    _add_column_if_not_exists(conn, "users", "account_locked_until", "DATETIME")

    try:
        conn.execute(text("CREATE UNIQUE INDEX idx_unique_users_phone ON users(phone)"))
        conn.commit()
        logger.info("✅ Restricción UNIQUE agregada a la columna 'phone' en la tabla 'users'.")
    except Exception:
        conn.rollback()


def init_db():
    # BLINDAJE 3: Eliminado el CREATE DATABASE porque cPanel no lo permite.
    # Conectamos directo a las tablas.
    
    from . import models
    Base.metadata.create_all(bind=engine)

    with engine.connect() as conn:
        _run_safe_migrations(conn)

    db = SessionLocal()
    try:
        from .models import Plan, TokenPack

        if db.query(Plan).count() == 0:
            db.add_all([
                Plan(name="free", price=0.0, tokens_per_month=0, has_ai_analysis=False, has_watermark=False),
                Plan(name="pro", price=12.0, tokens_per_month=1000, has_ai_analysis=True, has_watermark=False),
            ])
            db.commit()
            logger.info("✅ Planes iniciales insertados.")

        if db.query(TokenPack).count() == 0:
            db.add_all([
                TokenPack(name="Starter Pack",  price=2.00,  tokens=100),
                TokenPack(name="Standard Pack", price=5.00,  tokens=300),
                TokenPack(name="Power Pack",    price=7.00, tokens=500),
            ])
            db.commit()
            logger.info("✅ Paquetes de tokens insertados.")

    finally:
        db.close()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()