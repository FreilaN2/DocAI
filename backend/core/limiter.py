"""
core/limiter.py
===============
Instancia global de slowapi Limiter.
Se define aquí para que todos los routers puedan importarla
sin crear instancias duplicadas.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
