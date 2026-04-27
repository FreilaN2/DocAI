import re
import logging

logger = logging.getLogger(__name__)

def clasificar_parrafo_reglas(texto):
    """Clasifica un párrafo usando reglas heurísticas y regex (Plan Free)"""
    texto_limpio = texto.strip()
    if not texto_limpio:
        return "PARRAFO_NORMAL"
    
    # 1. Títulos N1 (Mayúsculas, Bold/Largos, Cortos)
    # Por ahora, si es todo mayúsculas y corto, asumimos N1
    if texto_limpio.isupper() and len(texto_limpio) < 100:
        return "TITULO_N1"
    
    # 2. Títulos N2 (Title Case, Cortos)
    if len(texto_limpio) < 80 and not texto_limpio.endswith('.') and any(c.isupper() for c in texto_limpio):
        return "TITULO_N2"
    
    # 3. Referencias APA (Patrón común: Autor, A. (Año)...)
    patron_referencia = r'^[A-Z][a-z]+,\s[A-Z]\.\s\(\d{4}\)'
    if re.match(patron_referencia, texto_limpio):
        return "REFERENCIA"
        
    return "PARRAFO_NORMAL"

def procesar_con_reglas(doc_paragraphs):
    """Procesa una lista de párrafos usando el motor de reglas"""
    stats = {"TITULO_N1": 0, "TITULO_N2": 0, "REFERENCIA": 0, "PARRAFO_NORMAL": 0}
    detalles = []
    
    total = len(doc_paragraphs)
    for index, paragraph in enumerate(doc_paragraphs):
        texto = paragraph.text.strip()
        if not texto:
            continue
        
        logger.info(f"⚡ Procesando párrafo {index + 1}/{total} (Reglas)...")
        categoria = clasificar_parrafo_reglas(texto)
        
        stats[categoria] = stats.get(categoria, 0) + 1
        detalles.append({"id": index, "texto": texto, "categoria": categoria})
        
    return {"stats": stats, "detalles": detalles}
