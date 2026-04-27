import os
import logging
import time
from groq import Groq
from dotenv import load_dotenv
from core.apa_rules import clasificar_parrafo_reglas

logger = logging.getLogger(__name__)

load_dotenv()
groq_key = os.getenv("GROQ_API_KEY")
client = Groq(api_key=groq_key) if groq_key else None

def clasificar_lote_ia(lista_textos):
    """Clasifica un lote de párrafos con reintentos y fallback"""
    if not client or not lista_textos:
        return ["PARRAFO_NORMAL"] * len(lista_textos)

    prompt_párrafos = "\n".join([f"{i+1}. {txt[:300]}" for i, txt in enumerate(lista_textos)])
    prompt = f"""Analiza estos {len(lista_textos)} fragmentos y clasifícalos según APA 7.
    FRAGMENTOS:
    {prompt_párrafos}
    RESPONDE ÚNICAMENTE CON UNA LISTA SEPARADA POR COMAS DE LAS ETIQUETAS: TITULO_N1, TITULO_N2, TITULO_N3, REFERENCIA, PARRAFO_NORMAL"""
    
    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": "Eres un experto en normas APA 7ma edición. Tu tarea es clasificar párrafos de documentos académicos."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
            )
            resultado_raw = response.choices[0].message.content.strip().upper()
            etiquetas = [tag.strip() for tag in resultado_raw.split(",") if any(cat in tag for cat in ["TITULO", "REFERENCIA", "PARRAFO"])]
            
            while len(etiquetas) < len(lista_textos):
                etiquetas.append("PARRAFO_NORMAL")
            return etiquetas[:len(lista_textos)]
            
        except Exception as e:
            if "429" in str(e) and attempt < max_retries - 1:
                wait_time = (attempt + 1) * 10 
                logger.warning(f"⚠️ Cuota de Groq excedida. Reintentando en {wait_time}s...")
                time.sleep(wait_time)
                continue
            
            logger.error(f"❌ Error definitivo en Groq: {e}. Usando motor de reglas como respaldo.")
            return [clasificar_parrafo_reglas(txt) for txt in lista_textos]

def procesar_con_ia(doc_paragraphs):
    """Procesa una lista de párrafos usando el motor de IA"""
    stats = {"TITULO_N1": 0, "TITULO_N2": 0, "REFERENCIA": 0, "PARRAFO_NORMAL": 0}
    detalles = []
    
    total = len(doc_paragraphs)
    BATCH_SIZE = 10
    
    textos_validos = []
    indices_originales = []
    
    # Filtrar párrafos vacíos y guardar sus índices
    for index, paragraph in enumerate(doc_paragraphs):
        texto = paragraph.text.strip()
        if texto:
            textos_validos.append(texto)
            indices_originales.append(index)
    
    total_validos = len(textos_validos)
    logger.info(f"🤖 Iniciando clasificación por lotes ({total_validos} párrafos con texto)")

    for i in range(0, total_validos, BATCH_SIZE):
        lote_textos = textos_validos[i:i+BATCH_SIZE]
        logger.info(f"🔍 Procesando lote {i//BATCH_SIZE + 1} ({i+1} a {min(i+BATCH_SIZE, total_validos)})...")
        
        etiquetas_lote = clasificar_lote_ia(lote_textos)
        
        for j, categoria in enumerate(etiquetas_lote):
            idx_original = indices_originales[i + j]
            stats[categoria] = stats.get(categoria, 0) + 1
            detalles.append({
                "id": idx_original, 
                "texto": lote_textos[j], 
                "categoria": categoria
            })
            logger.info(f"   🏷️ [{idx_original}] -> {categoria}")
            
    return {"stats": stats, "detalles": detalles}
