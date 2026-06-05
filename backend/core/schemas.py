"""
core/schemas.py
===============
Modelos Pydantic para validación de requests y responses.
Centraliza todos los schemas de la API en un solo lugar.
"""

from pydantic import BaseModel
from core.document_builder import DEFAULT_APA_FONT


# ─── Documentos APA ───────────────────────────────────────

class ParrafoCorregido(BaseModel):
    texto: str
    categoria: str


class DatosFinales(BaseModel):
    edicion: str
    parrafos: list[ParrafoCorregido]
    filename: str
    plan: str = "free"
    incluir_indice: bool = False
    formato: str = "docx"
    fuente: str = DEFAULT_APA_FONT


# ─── Autenticación ────────────────────────────────────────

class UserCreate(BaseModel):
    firstName: str
    lastName: str
    email: str
    phone: str
    country: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class GoogleAuthRequest(BaseModel):
    token: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


# ─── Pagos ────────────────────────────────────────────────

class SuscripcionRequest(BaseModel):
    months: int


class ConfirmarPagoRequest(BaseModel):
    order_id: str
    months: int


class PackRequest(BaseModel):
    pack_id: int


class ConfirmarPackRequest(BaseModel):
    order_id: str
    pack_id: int


class VerifyBinanceRequest(BaseModel):
    order_id: str
    type: str
    item_id: int


class ReportPagoMovilRequest(BaseModel):
    reference_number: str
    phone_number: str
    type: str   # 'subscription' or 'pack'
    item_id: int  # months or pack_id


# ─── Administración ───────────────────────────────────────

class AdminPagoActionRequest(BaseModel):
    transaction_id: int


class CreateAdminRequest(BaseModel):
    email: str
    password: str
