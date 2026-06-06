import re
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional


class UserCreate(BaseModel):
    first_name: str = Field(..., alias="firstName", min_length=1, max_length=50)
    last_name: str = Field(..., alias="lastName", min_length=1, max_length=50)
    email: EmailStr
    phone: Optional[str] = Field(default=None)
    country: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=8)

    @field_validator('password')
    @classmethod
    def password_strength(cls, v):
        if not re.search(r'[A-Z]', v):
            raise ValueError('La contraseña debe contener al menos una mayúscula')
        if not re.search(r'[a-z]', v):
            raise ValueError('La contraseña debe contener al menos una minúscula')
        if not re.search(r'\d', v):
            raise ValueError('La contraseña debe contener al menos un número')
        return v

    @field_validator('first_name', 'last_name')
    @classmethod
    def only_letters(cls, v):
        if not re.match(r'^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$', v):
            raise ValueError('Solo se permiten letras en este campo')
        return v.strip()

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        if v is None:
            return None
        v = v.strip()
        if v == '':
            return None
        if len(v) < 7:
            raise ValueError('El número de teléfono debe tener al menos 7 dígitos')
        return v

    model_config = {"extra": "forbid", "populate_by_name": True}


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)

    model_config = {"extra": "forbid"}


class ForgotPasswordRequest(BaseModel):
    email: EmailStr

    model_config = {"extra": "forbid"}


class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8)

    @field_validator('new_password')
    @classmethod
    def password_strength(cls, v):
        if not re.search(r'[A-Z]', v):
            raise ValueError('La contraseña debe contener al menos una mayúscula')
        if not re.search(r'[a-z]', v):
            raise ValueError('La contraseña debe contener al menos una minúscula')
        if not re.search(r'\d', v):
            raise ValueError('La contraseña debe contener al menos un número')
        return v

    model_config = {"extra": "forbid"}


class EmailVerificationRequest(BaseModel):
    email: EmailStr

    model_config = {"extra": "forbid"}


class VerifyEmailRequest(BaseModel):
    token: str = Field(..., min_length=1)

    model_config = {"extra": "forbid"}
