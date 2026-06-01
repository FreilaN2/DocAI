import os
import time
import hmac
import hashlib
import requests
from urllib.parse import urlencode
from dotenv import load_dotenv

load_dotenv()

BINANCE_API_KEY = os.getenv("BINANCE_API_KEY")
BINANCE_API_SECRET = os.getenv("BINANCE_API_SECRET")

# Base URL para la API de Binance
BASE_URL = "https://api.binance.com"

def get_binance_pay_transactions():
    """
    Obtiene el historial de transacciones de Binance Pay del usuario.
    Requiere una API Key con permisos de lectura.
    """
    if not BINANCE_API_KEY or not BINANCE_API_SECRET:
        raise ValueError("Faltan las credenciales de Binance en el archivo .env")

    endpoint = "/sapi/v1/pay/transactions"
    
    # Parámetros requeridos (timestamp)
    timestamp = int(time.time() * 1000)
    params = {
        "timestamp": timestamp
    }
    
    query_string = urlencode(params)
    
    # Generar la firma HMAC SHA256
    signature = hmac.new(
        BINANCE_API_SECRET.encode('utf-8'),
        query_string.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    params['signature'] = signature
    
    headers = {
        "X-MBX-APIKEY": BINANCE_API_KEY
    }
    
    url = f"{BASE_URL}{endpoint}"
    
    try:
        response = requests.get(url, headers=headers, params=params, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error al conectar con Binance API: {e}")
        # Intentar extraer el mensaje de error de Binance si existe
        if hasattr(e, 'response') and e.response is not None:
            try:
                print(f"Detalle: {e.response.json()}")
            except:
                pass
        return None

def verify_binance_payment(order_id: str, expected_amount: float = 5.0):
    """
    Verifica si un Order ID específico existe en el historial de Binance Pay
    y si coincide con el monto esperado.
    """
    data = get_binance_pay_transactions()
    
    if not data or data.get("code") != "000000":
        return False, "Error al consultar la API de Binance"
        
    transactions = data.get("data", [])
    
    for tx in transactions:
        # El historial de Binance Pay devuelve campos como orderId, amount, currency
        # Nota: A veces el campo es 'orderId' o 'transactionId', revisamos ambos por seguridad
        tx_order_id = str(tx.get("orderId", ""))
        tx_transaction_id = str(tx.get("transactionId", ""))
        
        if order_id == tx_order_id or order_id == tx_transaction_id:
            # Encontramos la transacción, verificamos el monto
            amount = float(tx.get("amount", 0))
            currency = tx.get("currency", "")
            
            if currency == "USDT" and amount >= expected_amount:
                return True, "Pago verificado correctamente"
            else:
                return False, f"Monto insuficiente o moneda incorrecta. Esperado: {expected_amount} USDT. Recibido: {amount} {currency}"
                
    return False, "No se encontró el número de orden especificado en el historial de Binance."
