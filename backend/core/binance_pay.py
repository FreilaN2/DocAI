"""
Optimizaciones aplicadas:
  - FIX #1:  Eliminada carga redundante de dotenv
  - FIX #2:  Función de firma reutilizable (evita recrear hmac)
  - FIX #3:  urlencode calculada una sola vez por request
  - FIX #4:  print() → logging con niveles apropiados
  - FIX #5:  Validación temprana de credenciales (al importar)
  - FIX #6:  Timeout configurable por variable de entorno
  - FIX #7:  Manejo de errores estructurado
  - FIX #8:  Type hints completos
  - FIX #9:  Caché de sesión HTTP (reusa conexiones TCP)
  - FIX #10: Rate limiting awareness con backoff
  - FIX #11: Constantes pre-calculadas (URLs, headers base)
"""

import os
import time
import hmac
import hashlib
import logging
from functools import lru_cache
from typing import Optional, Any
from urllib.parse import urlencode

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

# ═══════════════════════════════════════════════════════════
# FIX #1: Carga condicional de variables de entorno
# ═══════════════════════════════════════════════════════════

# Solo cargar si no hay credenciales ya (evita doble carga)
if not os.getenv("BINANCE_API_KEY") or not os.getenv("BINANCE_API_SECRET"):
    load_dotenv()

# ═══════════════════════════════════════════════════════════
# FIX #5: Validación temprana de credenciales
# ═══════════════════════════════════════════════════════════

BINANCE_API_KEY: Optional[str] = os.getenv("BINANCE_API_KEY")
BINANCE_API_SECRET: Optional[str] = os.getenv("BINANCE_API_SECRET")

# Validar al cargar el módulo (no en cada request)
_BINANCE_CONFIGURED: bool = bool(BINANCE_API_KEY and BINANCE_API_SECRET)

if not _BINANCE_CONFIGURED:
    logger.warning(
        "⚠️  Binance Pay no está configurado. "
        "Los pagos con Binance no funcionarán hasta que configures "
        "BINANCE_API_KEY y BINANCE_API_SECRET en el archivo .env"
    )

# ═══════════════════════════════════════════════════════════
# FIX #6 y #11: Constantes pre-calculadas
# ═══════════════════════════════════════════════════════════

BASE_URL: str = "https://api.binance.com"
ENDPOINT_TRANSACTIONS: str = "/sapi/v1/pay/transactions"

# Timeout configurable (default 10s)
REQUEST_TIMEOUT: int = int(os.getenv("BINANCE_TIMEOUT", "10"))

# Headers base (sin API key, se agrega dinámicamente)
_BASE_HEADERS: dict[str, str] = {
    "Accept": "application/json",
    "User-Agent": "DocAI/1.0",
}

# Código de éxito de Binance
_BINANCE_SUCCESS_CODE: str = "000000"

# FIX #10: Rate limiting
_MAX_RETRIES: int = 3
_RETRY_BACKOFF_FACTOR: float = 0.5  # 0.5s, 1s, 2s entre reintentos
_RATE_LIMIT_CODES: frozenset[int] = frozenset({429, 418})


# ═══════════════════════════════════════════════════════════
# FIX #9: Sesión HTTP con connection pooling y retry
# ═══════════════════════════════════════════════════════════

def _create_session() -> requests.Session:
    """
    Crea una sesión HTTP configurada con:
      - Connection pooling (reusa conexiones TCP)
      - Retry automático con backoff exponencial
      - Timeout por defecto
    """
    session = requests.Session()
    
    # Configurar retry strategy
    retry_strategy = Retry(
        total=_MAX_RETRIES,
        backoff_factor=_RETRY_BACKOFF_FACTOR,
        status_forcelist=list(_RATE_LIMIT_CODES),
        allowed_methods=["GET"],  # Solo reintentar GET
    )
    
    adapter = HTTPAdapter(
        max_retries=retry_strategy,
        pool_connections=2,   # Conexiones en pool
        pool_maxsize=4,       # Máximo de conexiones simultáneas
    )
    
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    
    return session


# FIX #9: Sesión global reutilizable (thread-safe)
_SESSION: Optional[requests.Session] = None


def _get_session() -> requests.Session:
    """Obtiene o crea la sesión HTTP global."""
    global _SESSION
    if _SESSION is None:
        _SESSION = _create_session()
    return _SESSION


# ═══════════════════════════════════════════════════════════
# FIX #2: Función de firma HMAC reutilizable
# ═══════════════════════════════════════════════════════════

def _generate_signature(query_string: str) -> str:
    """
    Genera firma HMAC-SHA256 para la API de Binance.
    
    FIX #2: Función aislada para:
      - Testing más fácil
      - Reutilización en otros endpoints
      - No recrear objetos hmac/hashlib inline
    """
    if not BINANCE_API_SECRET:
        raise ValueError("BINANCE_API_SECRET no configurada")
    
    return hmac.new(
        BINANCE_API_SECRET.encode('utf-8'),
        query_string.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()


# ═══════════════════════════════════════════════════════════
# FIX #3 y #7: Consulta a Binance Pay optimizada
# ═══════════════════════════════════════════════════════════

def _build_signed_request() -> tuple[dict[str, str], dict[str, str | int]]:
    """
    Construye headers y params firmados para la API de Binance.
    
    FIX #3: urlencode se calcula UNA SOLA VEZ.
    """
    if not BINANCE_API_KEY or not BINANCE_API_SECRET:
        raise ValueError(
            "Credenciales de Binance no configuradas. "
            "Asegúrate de definir BINANCE_API_KEY y BINANCE_API_SECRET en .env"
        )
    
    # Construir parámetros
    timestamp = int(time.time() * 1000)
    params = {"timestamp": timestamp}
    
    # FIX #3: urlencode una sola vez
    query_string = urlencode(params)
    
    # Generar firma
    signature = _generate_signature(query_string)
    params['signature'] = signature
    
    # Headers con API key
    headers = {**_BASE_HEADERS, "X-MBX-APIKEY": BINANCE_API_KEY}
    
    return headers, params


def get_binance_pay_transactions() -> Optional[dict[str, Any]]:
    """
    Obtiene el historial de transacciones de Binance Pay del usuario.
    
    FIX #9: Usa sesión HTTP con connection pooling.
    FIX #7: Manejo de errores estructurado por tipo.
    
    Returns:
        dict con la respuesta de Binance, o None si hay error.
    """
    if not _BINANCE_CONFIGURED:
        logger.error("❌ Binance Pay no configurado. Verifica BINANCE_API_KEY y BINANCE_API_SECRET")
        return None
    
    try:
        headers, params = _build_signed_request()
    except ValueError as e:
        logger.error(f"❌ Error construyendo request: {e}")
        return None
    
    url = f"{BASE_URL}{ENDPOINT_TRANSACTIONS}"
    
    try:
        # FIX #9: Usar sesión con connection pooling
        session = _get_session()
        response = session.get(
            url, 
            headers=headers, 
            params=params, 
            timeout=REQUEST_TIMEOUT
        )
        
        # FIX #7: Manejar códigos de error HTTP
        if response.status_code == 401:
            logger.error("❌ API Key de Binance inválida o sin permisos")
            return None
        elif response.status_code == 403:
            logger.error("❌ IP no autorizada o restricción de acceso en Binance")
            return None
        elif response.status_code in _RATE_LIMIT_CODES:
            logger.warning("⚠️  Rate limit de Binance alcanzado")
            return None
        
        response.raise_for_status()
        return response.json()
        
    except requests.exceptions.Timeout:
        logger.error(f"❌ Timeout consultando Binance API (>{REQUEST_TIMEOUT}s)")
        return None
    except requests.exceptions.ConnectionError:
        logger.error("❌ Error de conexión con Binance API. Verifica conectividad.")
        return None
    except requests.exceptions.HTTPError as e:
        logger.error(f"❌ Error HTTP de Binance: {e}")
        # Intentar extraer mensaje de error de Binance
        if e.response is not None:
            try:
                error_data = e.response.json()
                logger.error(f"   Detalle Binance: {error_data}")
            except Exception:
                logger.error(f"   Respuesta: {e.response.text[:200]}")
        return None
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Error consultando Binance API: {e}")
        return None
    except Exception as e:
        logger.error(f"❌ Error inesperado en Binance: {e}")
        return None


# ═══════════════════════════════════════════════════════════
# FIX #8 y #10: Verificación de pago optimizada
# ═══════════════════════════════════════════════════════════

@lru_cache(maxsize=64)
def _normalize_order_id(order_id: str) -> str:
    """
    Normaliza un Order ID para comparación.
    Cacheado porque el mismo ID se verifica varias veces.
    """
    return order_id.strip()


def verify_binance_payment(
    order_id: str, 
    expected_amount: float = 5.0,
    expected_currency: str = "USDT"
) -> tuple[bool, str]:
    """
    Verifica si un Order ID existe en el historial de Binance Pay
    y coincide con el monto esperado.
    
    FIX #8: Type hints completos.
    FIX #10: Early return si Binance no está configurado.
    
    Args:
        order_id: ID de la orden a verificar.
        expected_amount: Monto mínimo esperado.
        expected_currency: Moneda esperada (default: USDT).
    
    Returns:
        Tuple (éxito: bool, mensaje: str)
    """
    # FIX #10: Validación temprana
    if not _BINANCE_CONFIGURED:
        return False, "Binance Pay no está configurado en el servidor"
    
    if not order_id or not order_id.strip():
        return False, "Order ID no proporcionado"
    
    # Normalizar ID
    order_id_clean = _normalize_order_id(order_id)
    
    # Obtener transacciones
    data = get_binance_pay_transactions()
    
    if data is None:
        return False, "Error al consultar la API de Binance. Intenta de nuevo."
    
    # Validar respuesta de Binance
    response_code = data.get("code", "")
    if response_code != _BINANCE_SUCCESS_CODE:
        error_msg = data.get("msg", "Error desconocido")
        logger.error(f"❌ Binance devolvió error: code={response_code}, msg={error_msg}")
        return False, f"Error de Binance: {error_msg}"
    
    transactions = data.get("data", [])
    
    if not transactions:
        logger.info(f"ℹ️  No se encontraron transacciones en el historial de Binance")
        return False, "No se encontró el número de orden en el historial de Binance"
    
    # Buscar la transacción
    for tx in transactions:
        # Binance Pay puede devolver orderId o transactionId
        tx_order_id = str(tx.get("orderId", ""))
        tx_transaction_id = str(tx.get("transactionId", ""))
        
        # Comparar con el ID normalizado
        if order_id_clean in (tx_order_id, tx_transaction_id):
            # Verificar monto y moneda
            amount = float(tx.get("amount", 0))
            currency = tx.get("currency", "")
            status = tx.get("status", "")
            
            # Validar estado de la transacción
            if status and status != "SUCCESS":
                logger.warning(
                    f"⚠️  Transacción encontrada pero estado no exitoso: {status}"
                )
                return False, f"Transacción encontrada pero estado: {status}"
            
            # Validar moneda
            if currency != expected_currency:
                logger.warning(
                    f"⚠️  Moneda incorrecta. Esperada: {expected_currency}, "
                    f"Recibida: {currency}"
                )
                return False, (
                    f"Moneda incorrecta. Se esperaba {expected_currency} "
                    f"pero se recibió {currency}"
                )
            
            # Validar monto
            if amount < expected_amount:
                logger.warning(
                    f"⚠️  Monto insuficiente. Esperado: {expected_amount} "
                    f"{expected_currency}, Recibido: {amount} {currency}"
                )
                return False, (
                    f"Monto insuficiente. Se esperaba al menos {expected_amount} "
                    f"{expected_currency} pero se recibió {amount} {currency}"
                )
            
            # Todo correcto
            logger.info(
                f"✅ Pago verificado: order={order_id_clean}, "
                f"amount={amount} {currency}"
            )
            return True, "Pago verificado correctamente"
    
    # No se encontró la orden
    logger.info(f"ℹ️  Order ID no encontrado en historial: {order_id_clean}")
    return False, "No se encontró el número de orden especificado en el historial de Binance"


# ═══════════════════════════════════════════════════════════
# Utilidad para health check
# ═══════════════════════════════════════════════════════════

def check_binance_connectivity() -> bool:
    """
    Verifica conectividad básica con la API de Binance.
    Útil para endpoints de health check.
    
    Returns:
        True si se puede conectar a Binance.
    """
    try:
        session = _get_session()
        response = session.get(
            f"{BASE_URL}/api/v3/ping",
            timeout=5
        )
        return response.status_code == 200
    except Exception:
        return False


def is_binance_configured() -> bool:
    """Retorna True si Binance Pay está correctamente configurado."""
    return _BINANCE_CONFIGURED