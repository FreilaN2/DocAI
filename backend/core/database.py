import os
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import logging
import time
from tenacity import retry, stop_after_attempt, wait_fixed, retry_if_exception_type

load_dotenv()
logger = logging.getLogger(__name__)

DB_USER = os.getenv("DB_USER", "root")
DB_PASS = os.getenv("DB_PASS", "")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_NAME = os.getenv("DB_NAME", "docai_db")
DB_PORT = os.getenv("DB_PORT", "3306")

DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def _add_column_if_not_exists(conn, table_name, column_name, column_definition):
    """
    Verifica de manera segura en MySQL si una columna existe antes de intentar crearla.
    Esto evita errores ocultos y funciona perfecto tanto en BD nuevas como viejas.
    """
    check_sql = text("""
        SELECT COUNT(*) 
        FROM information_schema.columns 
        WHERE table_schema = :db_name 
        AND table_name = :table_name 
        AND column_name = :column_name
    """)
    # Pasamos los parámetros de forma segura para evitar inyecciones SQL
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
    Si levantan el proyecto desde cero, SQLAlchemy ya habrá creado estas columnas
    y esta función simplemente las ignorará. Si tienen la BD vieja, esto agregará lo que falta.
    """
    # ── Migraciones para la tabla 'plans' ──
    _add_column_if_not_exists(conn, "plans", "tokens_per_month", "INT DEFAULT 0")
    _add_column_if_not_exists(conn, "plans", "has_watermark", "BOOLEAN DEFAULT FALSE")
    _add_column_if_not_exists(conn, "plans", "has_ai_analysis", "BOOLEAN DEFAULT FALSE")

    # ── Migraciones para la tabla 'users' (Seguridad y Auditoría) ──
    _add_column_if_not_exists(conn, "users", "country", "VARCHAR(100)")
    _add_column_if_not_exists(conn, "users", "is_email_verified", "BOOLEAN DEFAULT FALSE")
    _add_column_if_not_exists(conn, "users", "is_active", "BOOLEAN DEFAULT TRUE")
    _add_column_if_not_exists(conn, "users", "last_login_at", "DATETIME")
    _add_column_if_not_exists(conn, "users", "last_login_ip", "VARCHAR(45)")
    _add_column_if_not_exists(conn, "users", "failed_login_attempts", "INT DEFAULT 0")
    _add_column_if_not_exists(conn, "users", "account_locked_until", "DATETIME")

    # ── BLINDAJE DE DUPLICADOS EN CALIENTE ──
    # Nota: El UNIQUE en phone se define en models.py vía SQLAlchemy.
    # En MySQL, múltiples NULLs sí están permitidos en UNIQUE, pero
    # strings vacíos ('') NO. El validador en schemas.py convierte
    # phone vacío → None para evitar conflictos.
    #
    # Migración: convertir phone='' existentes a NULL para evitar
    # choques con el UNIQUE constraint.
    try:
        conn.execute(text("UPDATE users SET phone = NULL WHERE phone = ''"))
        conn.commit()
    except Exception:
        conn.rollback()


@retry(
    stop=stop_after_attempt(10),
    wait=wait_fixed(5),
    retry=retry_if_exception_type(Exception),
    before_sleep=lambda retry_state: logger.info(f"⏳ Esperando a MySQL... (Intento {retry_state.attempt_number})")
)
def init_db():
    # 1. Crear la base de datos si no existe
    temp_engine = create_engine(f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}")
    with temp_engine.connect() as conn:
        conn.execute(text(
            f"CREATE DATABASE IF NOT EXISTS {DB_NAME} "
            "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
        ))
        conn.commit()
    temp_engine.dispose()

    # 2. Crear todas las tablas según los modelos (solo crea las que no existen)
    from . import models
    Base.metadata.create_all(bind=engine)

    # 3. Migraciones seguras para columnas nuevas en tablas existentes
    with engine.connect() as conn:
        _run_safe_migrations(conn)

    # 4. Poblar datos iniciales
    db = SessionLocal()
    try:
        from .models import Plan, TokenPack

        # ── Planes ──────────────────────────────────────────
        if db.query(Plan).count() == 0:
            db.add_all([
                Plan(
                    name="free",
                    price=0.0,
                    tokens_per_month=0,
                    has_ai_analysis=False,
                    has_watermark=False,
                ),
                Plan(
                    name="pro",
                    price=12.0,
                    tokens_per_month=1000,
                    has_ai_analysis=True,
                    has_watermark=False,
                ),
            ])
            db.commit()
            logger.info("✅ Planes iniciales insertados.")

        # ── Paquetes de tokens extra ─────────────────────────
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