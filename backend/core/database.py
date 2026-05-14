import os
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import logging

load_dotenv()
logger = logging.getLogger(__name__)

DB_USER = os.getenv("DB_USER", "root")
DB_PASS = os.getenv("DB_PASS", "")

# BLINDAJE 1: Forzamos la conexión por IP interna en cPanel
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
if DB_HOST == "localhost":
    DB_HOST = "127.0.0.1"

DB_NAME = os.getenv("DB_NAME", "docai_db")
DB_PORT = os.getenv("DB_PORT", "3306")

DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# BLINDAJE 2: Parámetros anti-congelamiento para cPanel
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,      # Verifica que la conexión esté viva antes de usarla
    pool_recycle=280,        # Reinicia la conexión antes de que cPanel la mate (300s)
    pool_size=5,             # Límite de conexiones simultáneas
    max_overflow=10          # Margen de seguridad
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
                TokenPack(name="Starter Pack",  price=3.00,  tokens=200),
                TokenPack(name="Standard Pack", price=6.00,  tokens=500),
                TokenPack(name="Power Pack",    price=10.00, tokens=1000),
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