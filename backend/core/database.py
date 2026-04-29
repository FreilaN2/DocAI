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
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_NAME = os.getenv("DB_NAME", "docai_db")
DB_PORT = os.getenv("DB_PORT", "3306")

DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def _run_safe_migrations(conn):
    """
    Ejecuta migraciones seguras: agrega columnas nuevas sin tocar las existentes.
    Cada ALTER TABLE está envuelto en un try/except para no fallar si la columna ya existe.
    """
    migrations = [
        # plans: agregar tokens_per_month si no existe
        "ALTER TABLE plans ADD COLUMN tokens_per_month INT DEFAULT 0",
        # plans: agregar has_watermark si no existe (venía como has_watermark en la BD original)
        "ALTER TABLE plans ADD COLUMN has_watermark BOOLEAN DEFAULT FALSE",
        # plans: agregar has_ai_analysis si no existe
        "ALTER TABLE plans ADD COLUMN has_ai_analysis BOOLEAN DEFAULT FALSE",
    ]
    for sql in migrations:
        try:
            conn.execute(text(sql))
            conn.commit()
            logger.info(f"✅ Migración aplicada: {sql[:60]}...")
        except Exception:
            # La columna ya existe — ignorar silenciosamente
            conn.rollback()


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
