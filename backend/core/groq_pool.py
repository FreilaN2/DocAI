"""
groq_pool.py
Pool inteligente de API keys de Groq.
Gestiona hasta 6 keys con tracking de cuota separado por modelo,
cooling automático tras errores 429 y reset diario automático.
"""
import os
import threading
import logging
from datetime import datetime, timedelta
from groq import Groq
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

# ── Modelos disponibles ──────────────────────────────────────────────────────
MODELO_LIGERO = "llama-3.3-70b-versatile"           # 12k tokens/min · 100k/día
MODELO_PESADO = "meta-llama/llama-4-scout-17b-16e-instruct"  # 30k tokens/min · 500k/día

LIMITES = {
    MODELO_LIGERO: {"tokens_min": 12_000, "tokens_dia": 100_000},
    MODELO_PESADO: {"tokens_min": 30_000, "tokens_dia": 500_000},
}

COOLING_SECONDS = 60  # segundos de enfriamiento tras un error 429


# ── Estado individual de una API Key ────────────────────────────────────────
class KeyState:
    def __init__(self, key_id: int, api_key: str):
        self.key_id = key_id
        self.api_key = api_key
        self.client = Groq(api_key=api_key)

        # Contadores separados por modelo
        self.used_today: dict[str, int] = {MODELO_LIGERO: 0, MODELO_PESADO: 0}
        self.used_minute: dict[str, int] = {MODELO_LIGERO: 0, MODELO_PESADO: 0}
        self.minute_reset_at: dict[str, datetime] = {
            MODELO_LIGERO: datetime.utcnow(),
            MODELO_PESADO: datetime.utcnow(),
        }
        # None = no está en cooling; datetime = enfriada hasta ese momento
        self.cooling_until: dict[str, datetime | None] = {
            MODELO_LIGERO: None,
            MODELO_PESADO: None,
        }

    def is_available(self, modelo: str) -> bool:
        """Verifica si esta key puede procesar una petición para el modelo dado."""
        now = datetime.utcnow()

        # ¿Está en período de enfriamiento para este modelo?
        cooling = self.cooling_until.get(modelo)
        if cooling and now < cooling:
            return False

        # Resetear contador por minuto si ya pasó 1 minuto
        if now - self.minute_reset_at[modelo] >= timedelta(minutes=1):
            self.used_minute[modelo] = 0
            self.minute_reset_at[modelo] = now

        # ¿Superó el límite diario o por minuto para este modelo?
        if self.used_today[modelo] >= LIMITES[modelo]["tokens_dia"]:
            return False
        if self.used_minute[modelo] >= LIMITES[modelo]["tokens_min"]:
            return False

        return True

    def available_quota_today(self, modelo: str) -> int:
        """Tokens restantes disponibles hoy para el modelo dado (para ordenar por prioridad)."""
        return max(0, LIMITES[modelo]["tokens_dia"] - self.used_today[modelo])

    def __repr__(self) -> str:
        return (
            f"<Key {self.key_id} | "
            f"70b: {self.used_today[MODELO_LIGERO]}/{LIMITES[MODELO_LIGERO]['tokens_dia']} | "
            f"scout: {self.used_today[MODELO_PESADO]}/{LIMITES[MODELO_PESADO]['tokens_dia']}>"
        )


# ── Pool principal ───────────────────────────────────────────────────────────
class GroqKeyPool:
    """
    Singleton que gestiona el pool de API keys de Groq.
    Thread-safe: usa un lock interno para operaciones de lectura/escritura.
    """

    def __init__(self):
        self._lock = threading.Lock()
        self.keys: list[KeyState] = []
        self._last_day = datetime.utcnow().date()
        self._load_keys()

    def _load_keys(self):
        """Carga las keys desde las variables de entorno GROQ_API_KEY_1..6."""
        load_dotenv()
        self.keys = []
        for i in range(1, 9):
            key_value = os.getenv(f"GROQ_API_KEY_{i}", "").strip()
            if key_value:
                state = KeyState(key_id=i, api_key=key_value)
                self.keys.append(state)
                logger.info(f"🔑 Groq Key #{i} cargada en el pool.")
        if not self.keys:
            logger.warning(
                "⚠️  Pool de Groq vacío. Define GROQ_API_KEY_1 a GROQ_API_KEY_6 en el .env"
            )

    # ── Operaciones públicas ─────────────────────────────────────────────────

    def get_best_key(self, modelo: str) -> tuple[Groq, int] | None:
        """
        Retorna (cliente_groq, key_id) de la key con más cuota disponible
        para el modelo solicitado. Retorna None si ninguna key está disponible.
        """
        self._reset_if_new_day()
        with self._lock:
            disponibles = [k for k in self.keys if k.is_available(modelo)]
            if not disponibles:
                logger.warning(f"⚠️  Sin keys disponibles para modelo: {modelo}")
                return None
            # Elegir la key con más cuota restante hoy para este modelo
            mejor = max(disponibles, key=lambda k: k.available_quota_today(modelo))
            logger.debug(
                f"🔑 Key #{mejor.key_id} seleccionada para {modelo} "
                f"(cuota restante: {mejor.available_quota_today(modelo)})"
            )
            return mejor.client, mejor.key_id

    def register_usage(self, key_id: int, modelo: str, tokens: int):
        """Registra el consumo de tokens para una key y modelo específicos."""
        with self._lock:
            for key in self.keys:
                if key.key_id == key_id:
                    key.used_today[modelo] = key.used_today.get(modelo, 0) + tokens
                    key.used_minute[modelo] = key.used_minute.get(modelo, 0) + tokens
                    break

    def mark_rate_limited(self, key_id: int, modelo: str):
        """
        Marca una key como 'cooling' para un modelo específico durante COOLING_SECONDS.
        La key puede seguir usándose con otros modelos.
        """
        with self._lock:
            for key in self.keys:
                if key.key_id == key_id:
                    hasta = datetime.utcnow() + timedelta(seconds=COOLING_SECONDS)
                    key.cooling_until[modelo] = hasta
                    logger.warning(
                        f"❄️  Key #{key_id} enfriada para {modelo} "
                        f"por {COOLING_SECONDS}s (hasta {hasta.strftime('%H:%M:%S')})"
                    )
                    break

    def status(self) -> dict:
        """Retorna el estado del pool — útil para el endpoint de diagnóstico."""
        with self._lock:
            return {
                "total_keys_configuradas": len(self.keys),
                "keys": [
                    {
                        "key_id": k.key_id,
                        "disponible_ligero": k.is_available(MODELO_LIGERO),
                        "disponible_pesado": k.is_available(MODELO_PESADO),
                        "usado_hoy": k.used_today,
                        "cooling_hasta": {
                            m: v.isoformat() if v else None
                            for m, v in k.cooling_until.items()
                        },
                    }
                    for k in self.keys
                ],
            }

    # ── Internos ─────────────────────────────────────────────────────────────

    def _reset_if_new_day(self):
        """Resetea contadores diarios si cambió el día (UTC)."""
        today = datetime.utcnow().date()
        if today != self._last_day:
            with self._lock:
                for key in self.keys:
                    for modelo in [MODELO_LIGERO, MODELO_PESADO]:
                        key.used_today[modelo] = 0
                self._last_day = today
                logger.info("🌅 Contadores diarios del pool reseteados (nuevo día UTC).")


# ── Instancia global (singleton) ─────────────────────────────────────────────
pool = GroqKeyPool()
