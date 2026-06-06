import os
import re
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "b4f1c7d9a2e3f5b8c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7
RESET_TOKEN_EXPIRE_MINUTES = 30
VERIFICATION_TOKEN_EXPIRE_MINUTES = 60 * 24

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_reset_token(email: str):
    expire = datetime.utcnow() + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": email, "exp": expire, "type": "reset"}, SECRET_KEY, algorithm=ALGORITHM)

def verify_reset_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "reset":
            return None
        return payload.get("sub")
    except JWTError:
        return None

def create_verification_token(email: str):
    expire = datetime.utcnow() + timedelta(minutes=VERIFICATION_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": email, "exp": expire, "type": "verify"}, SECRET_KEY, algorithm=ALGORITHM)

def verify_verification_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "verify":
            return None
        return payload.get("sub")
    except JWTError:
        return None

def validate_password_strength(password: str) -> Optional[str]:
    if len(password) < 8:
        return "La contraseña debe tener al menos 8 caracteres"
    if not re.search(r'[A-Z]', password):
        return "La contraseña debe contener al menos una mayúscula"
    if not re.search(r'[a-z]', password):
        return "La contraseña debe contener al menos una minúscula"
    if not re.search(r'\d', password):
        return "La contraseña debe contener al menos un número"
    return None
