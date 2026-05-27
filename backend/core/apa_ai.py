"""
apa_ai.py
Motor de IA para clasificación de párrafos académicos.
Usa un pool de API keys de Groq con selección inteligente de modelo
según el tamaño del documento y hace fallback al motor de reglas si
todas las keys están agotadas.
"""
import asyncio
import logging
import time
from typing import AsyncGenerator

from core.groq_pool import pool, MODELO_LIGERO, MODELO_PESADO
from core.apa_rules import clasificar_parrafo_reglas

logger = logging.getLogger(__name__)

# ── Configuración ────────────────────────────────────────────────────────────
UMBRAL_MODELO_SCOUT = 80   # Párrafos: si el doc tiene más, se usa el modelo pesado
BATCH_SIZE = 10            # Párrafos por lote de clasificación
DELAY_ENTRE_LOTES = 1      # Segundos de respiro entre peticiones a Groq


# ── Selección de modelo ──────────────────────────────────────────────────────
def seleccionar_modelo(total_parrafos: int) -> str:
    """
    Elige el modelo IA según el tamaño del documento.
      ≤ UMBRAL_MODELO_SCOUT → llama-3.3-70b  (ensayos, informes cortos)
      >  UMBRAL_MODELO_SCOUT → llama-4-scout  (tesis, documentos extensos)
    """
    if total_parrafos > UMBRAL_MODELO_SCOUT:
        logger.info(
            f"📊 Documento extenso ({total_parrafos} párrs.) → usando {MODELO_PESADO}"
        )
        return MODELO_PESADO
    else:
        logger.info(
            f"📄 Documento corto ({total_parrafos} párrs.) → usando {MODELO_LIGERO}"
        )
        return MODELO_LIGERO


# ── Clasificación de un lote ─────────────────────────────────────────────────
def clasificar_lote_ia(lista_textos: list, modelo: str) -> tuple[list, int]:
    """
    Clasifica un lote de párrafos con la IA.
    Retorna (lista_etiquetas, tokens_groq_consumidos).

    Fallback chain:
      1. Modelo solicitado (via pool)
      2. Modelo alternativo (via pool)
      3. Motor de reglas (sin consumo de API)
    """
    if not lista_textos:
        return [], 0

    prompt_parrafos = "\n".join(
        [f"{i+1}. {txt[:300]}" for i, txt in enumerate(lista_textos)]
    )
    prompt = (
        f"Analiza estos {len(lista_textos)} fragmentos y clasifícalos según APA 7.\n"
        f"FRAGMENTOS:\n{prompt_parrafos}\n"
        "RESPONDE ÚNICAMENTE CON UNA LISTA SEPARADA POR COMAS DE LAS ETIQUETAS: "
        "TITULO_N1, TITULO_N2, TITULO_N3, REFERENCIA, PARRAFO_NORMAL"
    )

    # Intentar primero con el modelo seleccionado, luego con el alternativo
    modelo_alternativo = MODELO_LIGERO if modelo == MODELO_PESADO else MODELO_PESADO
    for modelo_actual in [modelo, modelo_alternativo]:
        resultado = _intentar_con_modelo(lista_textos, prompt, modelo_actual)
        if resultado is not None:
            return resultado

    # Fallback final: motor de reglas
    logger.warning("⚠️  Todas las keys agotadas. Fallback → motor de reglas.")
    return [clasificar_parrafo_reglas(txt) for txt in lista_textos], 0


def _intentar_con_modelo(
    lista_textos: list, prompt: str, modelo: str
) -> tuple[list, int] | None:
    """
    Intenta clasificar usando el pool para el modelo dado.
    Retorna (etiquetas, tokens) si tiene éxito, None si no hay keys disponibles.
    """
    max_retries = 3
    for attempt in range(max_retries):
        result = pool.get_best_key(modelo)
        if result is None:
            logger.warning(f"⚠️  Sin keys disponibles para '{modelo}'.")
            return None

        client, key_id = result
        try:
            response = client.chat.completions.create(
                model=modelo,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "Eres un experto en normas APA 7ma edición. "
                            "Tu tarea es clasificar párrafos de documentos académicos."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.1,
            )

            tokens_usados = response.usage.total_tokens if response.usage else 0
            pool.register_usage(key_id, modelo, tokens_usados)

            resultado_raw = response.choices[0].message.content.strip().upper()
            etiquetas = [
                tag.strip()
                for tag in resultado_raw.split(",")
                if any(cat in tag for cat in ["TITULO", "REFERENCIA", "PARRAFO"])
            ]

            # Garantizar una etiqueta por párrafo
            while len(etiquetas) < len(lista_textos):
                etiquetas.append("PARRAFO_NORMAL")

            return etiquetas[: len(lista_textos)], tokens_usados

        except Exception as e:
            error_str = str(e)
            if "429" in error_str:
                pool.mark_rate_limited(key_id, modelo)
                logger.warning(
                    f"⚠️  Key #{key_id} rate-limited en '{modelo}'. "
                    f"Intento {attempt + 1}/{max_retries}."
                )
                if attempt < max_retries - 1:
                    continue
                return None

            logger.error(f"❌ Error en Groq (key #{key_id}, modelo '{modelo}'): {e}")
            if attempt < max_retries - 1:
                time.sleep(2)
                continue
            return None

    return None


# ── Procesamiento sincrónico (endpoint existente) ────────────────────────────
def procesar_con_ia(doc_paragraphs) -> dict:
    """
    Procesa sincrónicamente todos los párrafos del documento.
    Compatible con el endpoint POST /procesar-apa/ existente.
    Incluye delay de 1s entre lotes para no sobrecargar Groq.
    """
    stats = {
        "TITULO_N1": 0, "TITULO_N2": 0, "TITULO_N3": 0,
        "REFERENCIA": 0, "PARRAFO_NORMAL": 0,
    }
    detalles = []
    total_groq_tokens = 0

    textos_validos, indices_originales = _extraer_textos(doc_paragraphs)
    total_validos = len(textos_validos)
    modelo = seleccionar_modelo(total_validos)

    logger.info(f"🤖 Clasificación por lotes — {total_validos} párrafos — modelo: {modelo}")

    for i in range(0, total_validos, BATCH_SIZE):
        lote_textos = textos_validos[i : i + BATCH_SIZE]
        num_lote = i // BATCH_SIZE + 1
        logger.info(f"🔍 Lote {num_lote} ({i+1}–{min(i+BATCH_SIZE, total_validos)})...")

        etiquetas_lote, tokens_lote = clasificar_lote_ia(lote_textos, modelo)
        total_groq_tokens += tokens_lote

        for j, categoria in enumerate(etiquetas_lote):
            idx_original = indices_originales[i + j]
            stats[categoria] = stats.get(categoria, 0) + 1
            detalles.append({
                "id": idx_original,
                "texto": lote_textos[j],
                "categoria": categoria,
            })
            logger.info(f"   🏷️  [{idx_original}] → {categoria}")

        # Respiro entre lotes para no sobrecargar Groq
        if i + BATCH_SIZE < total_validos:
            time.sleep(DELAY_ENTRE_LOTES)

    logger.info(f"✅ Total tokens Groq consumidos: {total_groq_tokens}")
    return {"stats": stats, "detalles": detalles, "groq_tokens": total_groq_tokens}


# ── Procesamiento asíncrono con streaming (endpoint SSE) ─────────────────────
async def procesar_con_ia_stream(
    doc_paragraphs,
) -> AsyncGenerator[dict, None]:
    """
    Procesa párrafos con IA y hace yield de un evento por cada lote procesado.
    Diseñado para ser consumido por el endpoint SSE de FastAPI.

    Eventos emitidos:
      - tipo='inicio'      → metadatos del procesamiento
      - tipo='lote'        → resultado parcial de cada lote
      - tipo='finalizado'  → stats completos + todos los detalles
    """
    textos_validos, indices_originales = _extraer_textos(doc_paragraphs)
    total_validos = len(textos_validos)
    total_lotes = max(1, -(-total_validos // BATCH_SIZE))  # ceil division
    modelo = seleccionar_modelo(total_validos)

    stats = {
        "TITULO_N1": 0, "TITULO_N2": 0, "TITULO_N3": 0,
        "REFERENCIA": 0, "PARRAFO_NORMAL": 0,
    }
    detalles = []
    total_groq_tokens = 0

    # Evento de inicio
    yield {
        "tipo": "inicio",
        "total_parrafos": total_validos,
        "total_lotes": total_lotes,
        "modelo": modelo,
        "progreso": 0,
    }

    loop = asyncio.get_event_loop()

    for i in range(0, total_validos, BATCH_SIZE):
        lote_textos = textos_validos[i : i + BATCH_SIZE]
        num_lote = i // BATCH_SIZE + 1

        # Ejecutar la llamada sincrónica a Groq en un thread pool
        etiquetas_lote, tokens_lote = await loop.run_in_executor(
            None, clasificar_lote_ia, lote_textos, modelo
        )
        total_groq_tokens += tokens_lote

        lote_detalles = []
        for j, categoria in enumerate(etiquetas_lote):
            idx_original = indices_originales[i + j]
            stats[categoria] = stats.get(categoria, 0) + 1
            detalle = {
                "id": idx_original,
                "texto": lote_textos[j],
                "categoria": categoria,
            }
            detalles.append(detalle)
            lote_detalles.append(detalle)

        progreso = round((num_lote / total_lotes) * 100)
        lotes_restantes = total_lotes - num_lote

        # Evento por lote procesado
        yield {
            "tipo": "lote",
            "lote": num_lote,
            "total_lotes": total_lotes,
            "progreso": progreso,
            "tiempo_estimado": lotes_restantes,  # ~1s por lote restante
            "etiquetas": [d["categoria"] for d in lote_detalles],
        }

        # Delay de 1 segundo de respiro entre lotes (excepto el último)
        if i + BATCH_SIZE < total_validos:
            await asyncio.sleep(DELAY_ENTRE_LOTES)

    # Evento final con todos los resultados
    yield {
        "tipo": "finalizado",
        "progreso": 100,
        "stats": stats,
        "detalles": detalles,
        "groq_tokens": total_groq_tokens,
    }


# ── Helpers ──────────────────────────────────────────────────────────────────
def _extraer_textos(doc_paragraphs) -> tuple[list[str], list[int]]:
    """Filtra párrafos vacíos y retorna (textos, índices_originales)."""
    textos = []
    indices = []
    for index, paragraph in enumerate(doc_paragraphs):
        texto = paragraph.text.strip()
        if texto:
            textos.append(texto)
            indices.append(index)
    return textos, indices
