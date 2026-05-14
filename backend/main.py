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

# Importar motores de procesamiento y base de datos
from core.database import init_db, get_db
from core.apa_rules import procesar_con_reglas
from core.apa_ai import procesar_con_ia
from core.auth import get_password_hash, verify_password, create_access_token
from core.models import User, Plan, TokenBalance
from core.token_service import (
    get_available_tokens,
    consume_tokens,
    groq_tokens_to_docai,
    assign_monthly_tokens,
    add_extra_tokens,
)
from core.paypal import create_order, capture_order
from sqlalchemy.orm import Session
from sqlalchemy import text  # <-- Importación necesaria para el diagnóstico
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from core.auth import SECRET_KEY, ALGORITHM
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

# --- RUTAS DE DIAGNÓSTICO ---
@app.get("/prueba-rapida")
def prueba_rapida():
    return {"status": "¡FastAPI está vivo y responde en milisegundos!"}

@app.get("/diagnostico-db")
def diagnostico_db(db: Session = Depends(get_db)):
    try:
        # 1. Probar que las credenciales del .env funcionan
        db.execute(text("SELECT 1"))
        
        # 2. Forzar la creación de las tablas de forma manual
        init_db()
        
        return {
            "status": "success", 
            "mensaje": "✅ Conexión a MySQL exitosa y tablas creadas/verificadas correctamente."
        }
    except Exception as e:
        return {
            "status": "error", 
            "mensaje": "🚨 Falla al conectar con MySQL o al crear tablas", 
            "error_real": str(e)
        }

# --- MIDDLEWARE Y SEGURIDAD ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",           # Desarrollo local
        "http://127.0.0.1:5173",           # Desarrollo local (alternativo)
        "https://docai.teleredtv.com",     # Producción
        "http://docai.teleredtv.com",      # Producción (sin SSL por si acaso)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

# Inicializar base de datos al arrancar
@app.on_event("startup")
async def startup_event():
    logger.info("🛠️ Intentando inicializar base de datos...")
    try:
        # init_db()  <-- Si ya tienes las tablas creadas, COMENTA esta línea temporalmente
        # para probar si es lo que está trabando el inicio.
        logger.info("✅ Chequeo de inicio completado.")
    except Exception as e:
        logger.error(f"❌ Error en startup: {e}")

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
    country: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

@app.post("/register")
def register(user_data: UserCreate, db: Session = Depends(get_db)): # 👈 QUITA EL ASYNC
    # 1. Verificar si el usuario (correo) ya existe
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="El correo electrónico ya está registrado.")
        
    # 2. Verificar si el teléfono ya existe
    if user_data.phone:
        existing_phone = db.query(User).filter(User.phone == user_data.phone).first()
        if existing_phone:
            raise HTTPException(status_code=400, detail="Este número de teléfono ya está asociado a otra cuenta.")
    
    # 3. Crear nuevo usuario
    new_user = User(
        first_name=user_data.firstName,
        last_name=user_data.lastName,
        email=user_data.email,
        phone=user_data.phone,
        country=user_data.country,
        password_hash=get_password_hash(user_data.password), # 👈 Esto ya no bloqueará el servidor
        plan_id=1 
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # 4. Crear token de acceso
    access_token = create_access_token(data={"sub": new_user.email})
    return {
        "status": "success", 
        "access_token": access_token, 
        "token_type": "bearer", 
        "user": {
            "email": new_user.email, 
            "firstName": new_user.first_name,
            "plan": new_user.plan.name if new_user.plan else "free"
        }
    }

@app.post("/login")
def login(credentials: UserLogin, db: Session = Depends(get_db)): # 👈 QUITA EL ASYNC
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos.")
    
    access_token = create_access_token(data={"sub": user.email})
    return {
        "status": "success", 
        "access_token": access_token, 
        "token_type": "bearer", 
        "user": {
            "email": user.email, 
            "firstName": user.first_name,
            "plan": user.plan.name if user.plan else "free"
        }
    }

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
    plan: str = Form("free"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
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
    
    logger.info(f"🚀 Procesando: {file.filename} (Plan: {plan}, Edición: {edicion}, Usuario: {current_user.id})")

    if plan == "pro":
        # ── Verificar tokens disponibles ──────────────────────────────────
        balance = get_available_tokens(current_user.id, db)
        if balance["total"] <= 0:
            raise HTTPException(status_code=402, detail="No tienes tokens disponibles. Por favor, actualiza tu plan o compra un paquete.")
            
        logger.info("🤖 Usando motor de IA (Groq Llama 3.3)")
        resultado = procesar_con_ia(doc.paragraphs)
        
        # Consumir tokens
        groq_tokens = resultado.get('groq_tokens', 0)
        docai_tokens = groq_tokens_to_docai(groq_tokens)
        consume_tokens(current_user.id, groq_tokens, file.filename, db)
        
        logger.info(f"💡 Tokens consumidos: {docai_tokens} DocAI tokens ({groq_tokens} Groq)")
    else:
        logger.info("⚖️ Usando motor de reglas (Free — sin IA)")
        resultado = procesar_con_reglas(doc.paragraphs)
        resultado["groq_tokens"] = 0

    logger.info(f"✅ Procesamiento finalizado. Párrafos: {len(resultado['detalles'])}")
    return {
        "status": "success",
        "plan": plan,
        "resumen": resultado["stats"],
        "detalles": resultado["detalles"],
        "tokens_consumed": groq_tokens_to_docai(resultado.get("groq_tokens", 0)),
    }

@app.get("/tokens/balance")
async def mis_tokens(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Retorna el saldo actual de tokens del usuario."""
    balance = get_available_tokens(current_user.id, db)
    return {"status": "success", **balance}

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
        pass  # Sin marca de agua en ningún plan

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


# ═══════════════════════════════════════════════════════════
# ENDPOINTS DE PAGO — PAYPAL
# ═══════════════════════════════════════════════════════════

# Precios de suscripción por duración
SUBSCRIPTION_PRICES = {
    1:  12.00,
    3:  33.00,   # $11/mes
    6:  60.00,   # $10/mes
    12: 108.00,  # $9/mes
}
TOKENS_PER_MONTH_PRO = 1000

class SuscripcionRequest(BaseModel):
    months: int  # 1, 3, 6 o 12

class ConfirmarPagoRequest(BaseModel):
    order_id: str
    months: int

class PackRequest(BaseModel):
    pack_id: int

class ConfirmarPackRequest(BaseModel):
    order_id: str
    pack_id: int

@app.post("/pago/suscripcion")
async def crear_orden_suscripcion(
    data: SuscripcionRequest, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Crea una orden PayPal para suscripción Pro."""
    if data.months not in SUBSCRIPTION_PRICES:
        raise HTTPException(status_code=400, detail="Duración no válida. Usa 1, 3, 6 o 12.")

    amount = SUBSCRIPTION_PRICES[data.months]
    description = f"DocAI Pro — {data.months} mes(es) | {TOKENS_PER_MONTH_PRO} tokens/mes"
    custom_id = f"sub:{current_user.id}:{data.months}"

    try:
        order = create_order(amount=amount, description=description, custom_id=custom_id)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error con PayPal: {str(e)}")

    return {
        "status": "success",
        "order_id": order["order_id"],
        "approval_url": order["approval_url"],
        "amount": amount,
        "months": data.months,
    }


@app.post("/pago/confirmar-suscripcion")
async def confirmar_suscripcion(
    data: ConfirmarPagoRequest, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Captura el pago y activa la suscripción Pro del usuario."""
    from datetime import datetime
    from dateutil.relativedelta import relativedelta
    from core.models import Subscription

    try:
        result = capture_order(data.order_id)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error capturando pago: {str(e)}")

    if result.get("status") != "COMPLETED":
        raise HTTPException(status_code=402, detail="El pago no fue completado por PayPal.")

    pro_plan = db.query(Plan).filter(Plan.name == "pro").first()
    current_user.plan_id = pro_plan.id

    # Registrar suscripción
    now = datetime.utcnow()
    sub = Subscription(
        user_id=current_user.id,
        paypal_order_id=data.order_id,
        months_paid=data.months,
        tokens_per_month=TOKENS_PER_MONTH_PRO,
        started_at=now,
        ends_at=now + relativedelta(months=data.months),
        status="active",
    )
    db.add(sub)
    db.commit()

    # Asignar tokens del primer mes
    assign_monthly_tokens(current_user.id, TOKENS_PER_MONTH_PRO, db)

    logger.info(f"🎉 Suscripción Pro activada: user={current_user.id}, meses={data.months}")
    return {
        "status": "success",
        "message": f"Suscripción Pro activada por {data.months} mes(es).",
        "tokens_assigned": TOKENS_PER_MONTH_PRO,
    }


@app.post("/pago/pack-tokens")
async def crear_orden_pack(
    data: PackRequest, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Crea una orden PayPal para comprar un paquete de tokens extra."""
    from core.models import TokenPack

    pack = db.query(TokenPack).filter(
        TokenPack.id == data.pack_id, TokenPack.is_active == True
    ).first()
    if not pack:
        raise HTTPException(status_code=404, detail="Paquete no encontrado.")

    description = f"DocAI — {pack.name} ({pack.tokens} tokens extra)"
    custom_id = f"pack:{current_user.id}:{pack.id}"

    try:
        order = create_order(
            amount=float(pack.price),
            description=description,
            custom_id=custom_id,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error con PayPal: {str(e)}")

    return {
        "status": "success",
        "order_id": order["order_id"],
        "approval_url": order["approval_url"],
        "pack": {"name": pack.name, "tokens": pack.tokens, "price": float(pack.price)},
    }


@app.post("/pago/confirmar-pack")
async def confirmar_pack(
    data: ConfirmarPackRequest, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Captura el pago y añade tokens extra al usuario."""
    from core.models import TokenPack

    try:
        result = capture_order(data.order_id)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error capturando pago: {str(e)}")

    if result.get("status") != "COMPLETED":
        raise HTTPException(status_code=402, detail="El pago no fue completado por PayPal.")

    pack = db.query(TokenPack).filter(TokenPack.id == data.pack_id).first()
    if not pack:
        raise HTTPException(status_code=404, detail="Paquete no encontrado.")

    add_extra_tokens(current_user.id, pack.tokens, db)

    logger.info(f"📦 Pack aplicado: user={current_user.id}, tokens=+{pack.tokens}")
    return {
        "status": "success",
        "message": f"+{pack.tokens} tokens extra añadidos a tu cuenta.",
        "pack": pack.name,
    }


@app.get("/packs")
async def listar_packs(db: Session = Depends(get_db)):
    """Retorna el catálogo de paquetes de tokens disponibles."""
    from core.models import TokenPack
    packs = db.query(TokenPack).filter(TokenPack.is_active == True).all()
    return [
        {"id": p.id, "name": p.name, "price": float(p.price), "tokens": p.tokens}
        for p in packs
    ]

# ═══════════════════════════════════════════════════════════
# INTEGRACIÓN DE FRONTEND (REACT) DENTRO DE FASTAPI
# ═══════════════════════════════════════════════════════════
from fastapi.responses import FileResponse
import os

@app.get("/{catchall:path}")
def serve_react_app(catchall: str):
    # Ruta absoluta donde están los archivos compilados de tu React
    frontend_dir = "/home2/teleredt/public_html/docai.teleredtv.com"
    file_path = os.path.join(frontend_dir, catchall)
    
    # 1. Si el navegador pide un archivo físico (como /assets/index.js, un logo, etc)
    if catchall and os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)
    
    # 2. Si el usuario entra a una ruta como "/" o "/login", le damos la app de React
    index_path = os.path.join(frontend_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
        
    return {"detail": "Error crítico: El archivo index.html no está en la carpeta public_html."}