import os
import shutil
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
import time
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from docx import Document
from docx.shared import Inches, Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from pydantic import BaseModel
from typing import List
import io
from core.database import init_db

# Importar motores de procesamiento
from core.apa_rules import procesar_con_reglas
from core.apa_ai import procesar_con_ia
from core.auth import get_password_hash, verify_password, create_access_token
from core.database import get_db
from core.models import User, Plan
from sqlalchemy.orm import Session
from fastapi import Depends
import logging

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializar base de datos al arrancar
@app.on_event("startup")
async def startup_event():
    logger.info("🛠️ Inicializando base de datos en MySQL (XAMPP)...")
    try:
        init_db()
        logger.info("✅ Base de datos y tablas listas.")
    except Exception as e:
        logger.error(f"❌ Error al inicializar la base de datos: {e}")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
PROCESSED_DIR = os.path.join(BASE_DIR, "processed")
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)

storage = {}

def limpiar_archivos_antiguos():
    """Elimina archivos con más de 24 horas de antigüedad"""
    ahora = time.time()
    segundos_en_24h = 86400
    
    for carpeta in [UPLOAD_DIR, PROCESSED_DIR]:
        if not os.path.exists(carpeta):
            continue
            
        for archivo in os.listdir(carpeta):
            ruta_completa = os.path.join(carpeta, archivo)
            # No borrar archivos ocultos o carpetas
            if os.path.isfile(ruta_completa):
                mtime = os.path.getmtime(ruta_completa)
                if ahora - mtime > segundos_en_24h:
                    try:
                        os.remove(ruta_completa)
                        logger.info(f"🧹 Limpieza: Archivo antiguo eliminado: {archivo}")
                    except Exception as e:
                        logger.error(f"❌ Error al limpiar {archivo}: {e}")

# Diccionario de Reglas APA
NORMAS_APA = {
    "6ta": {
        "fuente": "Times New Roman",
        "tamano": 12,
        "interlineado": 2.0,
        "margen": 1.0,
        "sangria_primera_linea": 0.5,
        "sangria_francesa": 0.5,
        "títulos": {
            "N1": {"bold": True, "italic": False, "align": "center"},
            "N2": {"bold": True, "italic": False, "align": "left"},
            "N3": {"bold": True, "italic": False, "align": "indent"},
            "N4": {"bold": True, "italic": True, "align": "indent"},
            "N5": {"bold": False, "italic": True, "align": "indent"}
        }
    },
    "7ma": {
        "fuente": "Times New Roman",
        "tamano": 12,
        "interlineado": 2.0,
        "margen": 1.0,
        "sangria_primera_linea": 0.5,
        "sangria_francesa": 0.5,
        "títulos": {
            "N1": {"bold": True, "italic": False, "align": "center"},
            "N2": {"bold": True, "italic": False, "align": "left"},
            "N3": {"bold": True, "italic": True, "align": "left"},
            "N4": {"bold": True, "italic": False, "align": "indent"},
            "N5": {"bold": True, "italic": True, "align": "indent"}
        }
    }
}

class ParrafoCorregido(BaseModel):
    texto: str
    categoria: str

class DatosFinales(BaseModel):
    edicion: str
    parrafos: List[ParrafoCorregido]
    filename: str
    plan: str = "free"
    incluir_indice: bool = False

class UserCreate(BaseModel):
    firstName: str
    lastName: str
    email: str
    phone: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

@app.post("/register")
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    # Verificar si el usuario ya existe
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="El correo electrónico ya está registrado.")
    
    # Crear nuevo usuario
    new_user = User(
        first_name=user_data.firstName,
        last_name=user_data.lastName,
        email=user_data.email,
        phone=user_data.phone,
        password_hash=get_password_hash(user_data.password),
        plan_id=1 # Plan Free por defecto
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Crear token de acceso
    access_token = create_access_token(data={"sub": new_user.email})
    return {"status": "success", "access_token": access_token, "token_type": "bearer", "user": {"email": new_user.email, "firstName": new_user.first_name}}

@app.post("/login")
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos.")
    
    access_token = create_access_token(data={"sub": user.email})
    return {"status": "success", "access_token": access_token, "token_type": "bearer", "user": {"email": user.email, "firstName": user.first_name}}

def añadir_marca_de_agua(doc):
    """Añade una marca de agua en el pie de página para el plan Free"""
    for section in doc.sections:
        footer = section.footer
        p = footer.paragraphs[0] if footer.paragraphs else footer.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run("Generado con DocAI Free — Formateador Automático APA")
        run.font.size = Pt(8)
        run.font.name = "Arial"

def configurar_parrafo_estilo(paragraph, categoria, reglas):
    paragraph.paragraph_format.line_spacing_rule = WD_LINE_SPACING.DOUBLE
    
    if "TITULO" in categoria:
        nivel = categoria.split("_")[-1]
        config = reglas["títulos"].get(nivel, reglas["títulos"]["N1"])
        
        paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER if config["align"] == "center" else WD_ALIGN_PARAGRAPH.LEFT
        paragraph.paragraph_format.first_line_indent = Inches(reglas["sangria_primera_linea"]) if config["align"] == "indent" else Inches(0)

        for run in paragraph.runs:
            run.bold = config["bold"]
            run.font.italic = config["italic"]
            run.font.name = reglas["fuente"]
            run.font.size = Pt(reglas["tamano"])

    elif categoria == "REFERENCIA":
        paragraph.alignment = WD_ALIGN_PARAGRAPH.LEFT
        paragraph.paragraph_format.first_line_indent = Inches(-reglas["sangria_francesa"])
        paragraph.paragraph_format.left_indent = Inches(reglas["sangria_francesa"])
        for run in paragraph.runs:
            run.font.name = reglas["fuente"]
            run.font.size = Pt(reglas["tamano"])
    else:
        paragraph.alignment = WD_ALIGN_PARAGRAPH.LEFT
        paragraph.paragraph_format.first_line_indent = Inches(reglas["sangria_primera_linea"])
        for run in paragraph.runs:
            run.font.name = reglas["fuente"]
            run.font.size = Pt(reglas["tamano"])

@app.post("/procesar-apa/")
async def procesar_documento(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...), 
    edicion: str = Form("7ma"), 
    plan: str = Form("free")
):
    # Ejecutar limpieza en segundo plano
    background_tasks.add_task(limpiar_archivos_antiguos)
    
    input_path = os.path.join(UPLOAD_DIR, file.filename)
    
    # Leer contenido asíncronamente y guardar
    contents = await file.read()
    with open(input_path, "wb") as f:
        f.write(contents)
    
    # Verificar que el archivo realmente existe y tiene contenido
    if not os.path.exists(input_path):
        logger.error(f"❌ Error crítico: El archivo no se creó en {input_path}")
        raise HTTPException(status_code=500, detail="Error al guardar el archivo")
        
    size = os.path.getsize(input_path)
    logger.info(f"📂 Archivo guardado: {input_path} ({size} bytes)")

    try:
        # Usar BytesIO para evitar problemas de rutas en disco
        doc = Document(io.BytesIO(contents))
    except Exception as e:
        logger.error(f"❌ Error al abrir .docx con BytesIO: {e}")
        raise HTTPException(status_code=400, detail=f"No se pudo procesar el contenido del archivo .docx: {str(e)}")
    
    logger.info(f"🚀 Iniciando procesamiento de documento: {file.filename} (Plan: {plan}, Edición: {edicion})")
    
    if plan == "pro":
        logger.info("🤖 Usando motor de IA (Gemini)")
        resultado = procesar_con_ia(doc.paragraphs)
    else:
        logger.info("⚖️ Usando motor de reglas heurísticas")
        resultado = procesar_con_reglas(doc.paragraphs)
        
    logger.info(f"✅ Procesamiento finalizado. Párrafos procesados: {len(resultado['detalles'])}")
    return {
        "status": "success", 
        "plan": plan,
        "resumen": resultado["stats"], 
        "detalles": resultado["detalles"]
    }

@app.post("/generar-final/")
async def generar_final(datos: DatosFinales):
    output_filename = f"FINAL_{datos.edicion}_{datos.filename}"
    output_path = os.path.join(PROCESSED_DIR, output_filename)
    doc = Document()
    reglas = NORMAS_APA.get(datos.edicion, NORMAS_APA["7ma"])
    
    for section in doc.sections:
        section.top_margin = section.bottom_margin = section.left_margin = section.right_margin = Inches(reglas["margen"])

    # --- Generación de Índice si se solicita ---
    if datos.incluir_indice:
        logger.info(f"📚 Generando Tabla de Contenidos para {len(datos.parrafos)} párrafos...")
        doc.add_paragraph("Índice", style=None).alignment = WD_ALIGN_PARAGRAPH.CENTER
        # Aplicar estilo al título del índice
        for p in doc.paragraphs:
            if p.text == "Índice":
                for run in p.runs:
                    run.bold = True
                    run.font.name = reglas["fuente"]
                    run.font.size = Pt(16)
        
        titulos_encontrados = 0
        for p in datos.parrafos:
            cat = p.categoria.upper()
            if "TITULO" in cat:
                titulos_encontrados += 1
                # Extraer nivel (ej: de TITULO_N1 extrae 1)
                try:
                    nivel_str = cat.split("_")[-1].replace("N", "")
                    nivel = int(nivel_str) if nivel_str.isdigit() else 1
                except:
                    nivel = 1
                
                indent = (nivel - 1) * 0.3
                item = doc.add_paragraph(p.texto)
                item.paragraph_format.left_indent = Inches(indent)
                item.paragraph_format.space_before = Pt(2)
                item.paragraph_format.space_after = Pt(2)
                for run in item.runs:
                    run.font.name = reglas["fuente"]
                    run.font.size = Pt(11)
        
        logger.info(f"📍 Se encontraron {titulos_encontrados} títulos para el índice.")
        doc.add_page_break()

    # --- Generación del Cuerpo del Documento ---
    for p in datos.parrafos:
        paragraph = doc.add_paragraph(p.texto)
        configurar_parrafo_estilo(paragraph, p.categoria, reglas)

    if datos.plan == "free":
        añadir_marca_de_agua(doc)

    doc.save(output_path)
    file_id = str(hash(output_path))
    storage[file_id] = output_path
    return {"file_id": file_id}

@app.get("/descargar/{file_id}")
async def descargar_archivo(file_id: str):
    path = storage.get(file_id)
    if path and os.path.exists(path):
        return FileResponse(path=path, filename=os.path.basename(path))
    raise HTTPException(status_code=404, detail="No encontrado")