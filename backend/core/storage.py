"""
core/storage.py
===============
Almacenamiento en memoria con TTL y límite de tamaño.
Evita memory leaks en el manejo de archivos temporales.
"""

import time

_MAX_STORAGE_ENTRIES = 500


class _TTLStorage:
    """Dict con TTL y límite de tamaño para evitar memory leaks."""

    def __init__(self, ttl_seconds: int = 86400, max_size: int = _MAX_STORAGE_ENTRIES):
        self._data: dict[str, tuple] = {}  # key → (valor, timestamp)
        self._ttl = ttl_seconds
        self._max = max_size

    def set(self, key: str, value) -> None:
        self._evict()
        if len(self._data) >= self._max:
            # Eliminar la entrada más antigua si se alcanza el límite
            oldest = min(self._data, key=lambda k: self._data[k][1])
            del self._data[oldest]
        self._data[key] = (value, time.time())

    def get(self, key: str, default=None):
        entry = self._data.get(key)
        if entry is None:
            return default
        value, ts = entry
        if time.time() - ts > self._ttl:
            del self._data[key]
            return default
        return value

    def pop(self, key: str, default=None):
        entry = self._data.pop(key, None)
        if entry is None:
            return default
        return entry[0]

    def __contains__(self, key: str) -> bool:
        return self.get(key) is not None

    def _evict(self) -> None:
        """Elimina entradas expiradas."""
        now = time.time()
        expired = [k for k, (_, ts) in self._data.items() if now - ts > self._ttl]
        for k in expired:
            del self._data[k]


# Instancias globales compartidas entre routers
storage        = _TTLStorage(ttl_seconds=86400)  # file_id   → ruta del archivo procesado
upload_storage = _TTLStorage(ttl_seconds=3600)   # upload_id → (ruta, nombre original)
