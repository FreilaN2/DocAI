import requests
import logging
from typing import Optional

logger = logging.getLogger(__name__)

def get_bcv_rate() -> Optional[float]:
    """
    Obtiene la tasa oficial del BCV (promedio) usando la API pública ve.dolarapi.com.
    Equivalente al scraper original en PHP (cambio_tasa.php).
    """
    url = "https://ve.dolarapi.com/v1/dolares/oficial"
    try:
        response = requests.get(url, timeout=15)
        response.raise_for_status()
        data = response.json()
        
        if 'promedio' in data and isinstance(data['promedio'], (int, float)):
            return float(data['promedio'])
        else:
            logger.error(f"Formato de respuesta JSON inválido o tasa no encontrada en la API: {data}")
            return None
            
    except requests.exceptions.RequestException as e:
        logger.error(f"Error conectando a la API del dólar: {e}")
        return None
    except Exception as e:
        logger.error(f"Error inesperado al obtener la tasa BCV: {e}")
        return None
