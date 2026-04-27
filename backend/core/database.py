import os
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import pymysql

load_dotenv()

# Configuración de la URL de la base de datos
DB_USER = os.getenv("DB_USER", "root")
DB_PASS = os.getenv("DB_PASS", "")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_NAME = os.getenv("DB_NAME", "docai_db")
DB_PORT = os.getenv("DB_PORT", "3306")

DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Crear el motor de la base de datos
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def init_db():
    # Intentar crear la base de datos si no existe
    temp_engine = create_engine(f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}")
    with temp_engine.connect() as conn:
        conn.execute(text(f"CREATE DATABASE IF NOT EXISTS {DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))
        conn.commit()
    
    # Crear tablas basadas en los modelos
    from . import models
    Base.metadata.create_all(bind=engine)
    
    # Insertar planes iniciales si la tabla está vacía
    db = SessionLocal()
    try:
        from .models import Plan
        if db.query(Plan).count() == 0:
            free_plan = Plan(name="free", price=0.0, max_docs_per_month=3, has_ai_analysis=False, has_watermark=True)
            pro_plan = Plan(name="pro", price=12.0, max_docs_per_month=-1, has_ai_analysis=True, has_watermark=False)
            db.add(free_plan)
            db.add(pro_plan)
            db.commit()
    finally:
        db.close()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
