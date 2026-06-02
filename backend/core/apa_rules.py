import re
import logging

logger = logging.getLogger(__name__)

COMMON_TESIS_SECTIONS = {
    "N1": [
        "resumen", "abstract", "capítulo", "capitulo", "apéndice", "apendice",
        "anexo", "índice", "indice", "referencias", "bibliografía", "bibliografia",
        "bibliografía complementaria", "agradecimientos", "dedicatoria"
    ],
    "N2": [
        "introducción", "antecedentes", "marco teórico", "marco teorico", "planteamiento del problema",
        "objetivos", "objetivo general", "objetivos específicos", "justificación",
        "metodología", "metodologia", "resultados", "discusión", "consulta", "conclusiones",
        "trabajo futuro", "limitaciones", "materiales y métodos", "metodología y métodos",
        "antecedentes de la automatización", "metodología de la investigación", "resultados y discusión",
        "análisis de integración con odoo", "fase de recolección de datos", "fases de recolección de datos"
    ],
}

HEADING_SHORT_MAX_WORDS = 14
HEADING_LONG_MAX_CHARS = 100


SMALL_WORDS = {
    "a", "ante", "bajo", "con", "contra", "de", "del", "desde",
    "durante", "e", "el", "la", "las", "los", "para", "por",
    "sin", "sobre", "y", "o", "u", "en", "al", "aun", "una", "un",
    "su", "sus", "se", "sin", "sobre"
}


def _normalizar_texto(texto: str) -> str:
    return re.sub(r"\s+", " ", texto.strip()).lower()


def _normalizar_encabezado(texto: str) -> str:
    texto_limpio = re.sub(r"[\s\-:]+$", "", texto.strip())
    texto_limpio = re.sub(r"\s+", " ", texto_limpio)
    return texto_limpio.lower()


def _coincide_encabezado_con_lista(texto: str, candidatos: list[str]) -> bool:
    texto_limpio = _normalizar_encabezado(texto)
    for candidato in candidatos:
        if texto_limpio == candidato:
            return True
    return False


def _es_referencia_apa(texto: str) -> bool:
    patron_referencia = r'^[A-ZÁÉÍÓÚÑÜÇ][\wÁÉÍÓÚÑÜÇ\'-]+,\s+[A-ZÁÉÍÓÚÑÜÇ]\.\s*\(\d{4}\)'
    return re.match(patron_referencia, texto) is not None


def _es_bloque_cita(texto: str) -> bool:
    palabras = texto.strip().split()
    return len(palabras) >= 40 and not texto.strip().startswith(('"', '“', '”'))


def _es_titulo_corto(texto: str) -> bool:
    texto_limpio = texto.strip()
    if not texto_limpio or texto_limpio.endswith(('.', '?', '!')):
        return False
    palabras = texto_limpio.split()
    if len(palabras) > HEADING_SHORT_MAX_WORDS:
        return False
    if len(texto_limpio) > HEADING_LONG_MAX_CHARS:
        return False
    capitalizadas = 0
    relevantes = 0
    for palabra in palabras:
        limpia = re.sub(r"[^\wÁÉÍÓÚÑÜÇ'-]", "", palabra)
        if not limpia:
            continue
        if limpia.lower() in SMALL_WORDS:
            continue
        relevantes += 1
        if limpia[0].isupper():
            capitalizadas += 1
    if relevantes == 0:
        return False
    return capitalizadas >= max(1, int(relevantes * 0.6))


def _es_titulo_por_formato(texto: str) -> bool:
    texto_limpio = texto.strip()
    if not texto_limpio:
        return False
    if texto_limpio.isupper() and len(texto_limpio) <= HEADING_LONG_MAX_CHARS:
        return True
    if len(texto_limpio.split()) <= HEADING_SHORT_MAX_WORDS and _es_titulo_corto(texto_limpio):
        return True
    if re.match(r'^(cap[ií]tulo|anexo|ap[eé]ndice|apendice|figura|tabla)\b', texto_limpio, re.IGNORECASE):
        return True
    if re.match(r'^(introducción|antecedentes|metodología|metodologia|resultados|discusión|discusion|conclusiones|análisis|analisis|evaluación|fase|fases|marco|objetivos|justificación|justificacion)\b', texto_limpio, re.IGNORECASE):
        return True
    return False


def _es_primer_titulo_principal(texto: str) -> bool:
    texto_limpio = texto.strip()
    if not texto_limpio or texto_limpio.endswith(('.', '?', '!')):
        return False
    palabras = texto_limpio.split()
    if len(palabras) < 4 or len(palabras) > 22:
        return False
    if '\n' not in texto and len(palabras) < 6:
        return False
    capitalizadas = sum(1 for palabra in palabras if palabra and palabra[0].isupper())
    if capitalizadas < max(2, int(len(palabras) * 0.4)):
        return False
    if 'de la' in texto_limpio.lower() or 'en la' in texto_limpio.lower() or 'de los' in texto_limpio.lower():
        return True
    if texto_limpio.endswith(' de') or texto_limpio.endswith(' en'):
        return False
    return True


def _nivel_titulo_por_texto(texto: str) -> str | None:
    texto_limpio = _normalizar_texto(texto)
    if _coincide_encabezado_con_lista(texto, COMMON_TESIS_SECTIONS["N1"]):
        return "TITULO_N1"
    if _coincide_encabezado_con_lista(texto, COMMON_TESIS_SECTIONS["N2"]):
        return "TITULO_N2"
    if re.match(r'^(cap[ií]tulo|anexo|ap[eé]ndice|apendice)\b', texto_limpio):
        return "TITULO_N1"
    if re.match(r'^(tabla|figura|apartado|sección|seccion|subsección|subseccion)\b', texto_limpio):
        return "TITULO_N4"
    if re.match(r'^[0-9]+(\.[0-9]+)*\s+[A-ZÁÉÍÓÚÑÜÇ]', texto_limpio):
        return "TITULO_N3"
    if _es_titulo_por_formato(texto) and len(texto_limpio.split()) <= 18:
        return "TITULO_N2"
    return None


def clasificar_parrafo_reglas(texto, posicion=0):
    """Clasifica un párrafo usando reglas heurísticas y regex (Plan Free)"""
    texto_limpio = texto.strip()
    if not texto_limpio:
        return "PARRAFO_NORMAL"

    if _es_referencia_apa(texto_limpio):
        return "REFERENCIA"

    if _es_bloque_cita(texto_limpio):
        return "CITA_LARGA"

    nivel_titulo = _nivel_titulo_por_texto(texto_limpio)
    if nivel_titulo:
        return nivel_titulo

    if posicion == 0 and _es_primer_titulo_principal(texto):
        return "TITULO_N1"

    if texto_limpio.isupper() and len(texto_limpio) <= 80:
        return "TITULO_N1"

    if _es_titulo_por_formato(texto_limpio):
        return "TITULO_N2"

    return "PARRAFO_NORMAL"


def procesar_con_reglas(doc_paragraphs):
    """Procesa una lista de párrafos usando el motor de reglas"""
    stats = {
        "TITULO_N1": 0,
        "TITULO_N2": 0,
        "TITULO_N3": 0,
        "TITULO_N4": 0,
        "TITULO_N5": 0,
        "REFERENCIA": 0,
        "CITA_LARGA": 0,
        "PARRAFO_NORMAL": 0,
    }
    detalles = []

    total = len(doc_paragraphs)
    for index, paragraph in enumerate(doc_paragraphs):
        texto = paragraph.text.strip()
        if not texto:
            continue

        logger.info(f"⚡ Procesando párrafo {index + 1}/{total} (Reglas)...")
        categoria = clasificar_parrafo_reglas(texto, posicion=index)
        stats[categoria] = stats.get(categoria, 0) + 1
        detalles.append({"id": index, "texto": texto, "categoria": categoria})

    return {"stats": stats, "detalles": detalles}
