"""
paypal.py
Cliente para la API REST v2 de PayPal.
Soporta modo sandbox y producción a través de la variable PAYPAL_MODE.
"""
import os
import requests
import logging
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# ─── Configuración ────────────────────────────────────────────────────────────
PAYPAL_MODE = os.getenv("PAYPAL_MODE", "sandbox").strip()

if PAYPAL_MODE == "live":
    CLIENT_ID = os.getenv("PAYPAL_CLIENT_ID_LIVE")
    CLIENT_SECRET = os.getenv("PAYPAL_CLIENT_SECRET_LIVE")
    BASE_URL = "https://api-m.paypal.com"
else:
    CLIENT_ID = os.getenv("PAYPAL_CLIENT_ID_SANDBOX")
    CLIENT_SECRET = os.getenv("PAYPAL_CLIENT_SECRET_SANDBOX")
    BASE_URL = "https://api-m.sandbox.paypal.com"

# URL de retorno del frontend (donde PayPal redirige al usuario tras aprobar)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


# ─── Autenticación ────────────────────────────────────────────────────────────
def _get_access_token() -> str:
    """Obtiene un Bearer token de OAuth2 de PayPal."""
    response = requests.post(
        f"{BASE_URL}/v1/oauth2/token",
        auth=(CLIENT_ID, CLIENT_SECRET),
        data={"grant_type": "client_credentials"},
        headers={"Accept": "application/json"},
        timeout=15,
    )
    if response.status_code != 200:
        logger.error(f"❌ Error obteniendo token PayPal: {response.text}")
        raise Exception(f"PayPal auth error: {response.text}")
    return response.json()["access_token"]


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {_get_access_token()}",
        "Content-Type": "application/json",
    }


# ─── Crear Orden ──────────────────────────────────────────────────────────────
def create_order(amount: float, description: str, custom_id: str = "") -> dict:
    """
    Crea una orden de pago en PayPal.
    Retorna:
        {
            "order_id": str,
            "approval_url": str  # URL a la que redirigir al usuario
        }
    """
    payload = {
        "intent": "CAPTURE",
        "purchase_units": [
            {
                "amount": {
                    "currency_code": "USD",
                    "value": f"{amount:.2f}",
                },
                "description": description,
                "custom_id": custom_id,  # Usaremos esto para guardar info extra (ej: "sub:1:1000")
            }
        ],
        "application_context": {
            "brand_name": "DocIA",
            "landing_page": "NO_PREFERENCE",
            "user_action": "PAY_NOW",
            "return_url": f"{FRONTEND_URL}/pago/exitoso",
            "cancel_url": f"{FRONTEND_URL}/upgrade",
        },
    }

    response = requests.post(
        f"{BASE_URL}/v2/checkout/orders",
        json=payload,
        headers=_headers(),
        timeout=15,
    )

    if response.status_code not in (200, 201):
        logger.error(f"❌ Error creando orden PayPal: {response.text}")
        raise Exception(f"PayPal create_order error: {response.text}")

    data = response.json()
    order_id = data["id"]

    # Extraer la URL de aprobación
    approval_url = next(
        (link["href"] for link in data.get("links", []) if link["rel"] == "approve"),
        None,
    )

    logger.info(f"✅ Orden PayPal creada: {order_id} | ${amount:.2f} | {description}")
    return {"order_id": order_id, "approval_url": approval_url}


# ─── Capturar Pago ────────────────────────────────────────────────────────────
def capture_order(order_id: str) -> dict:
    """
    Captura el pago de una orden aprobada por el usuario.
    Retorna el objeto completo de la respuesta de PayPal.
    """
    response = requests.post(
        f"{BASE_URL}/v2/checkout/orders/{order_id}/capture",
        headers=_headers(),
        timeout=15,
    )

    if response.status_code not in (200, 201):
        logger.error(f"❌ Error capturando orden PayPal {order_id}: {response.text}")
        raise Exception(f"PayPal capture error: {response.text}")

    data = response.json()
    status = data.get("status")
    logger.info(f"💳 Pago capturado: {order_id} | Status: {status}")
    return data
