# Usa una versión de Python ligera pero compatible con compilación de librerías
FROM python:3.12-slim

# Evita que Python genere archivos .pyc y permite que los logs se vean en tiempo real
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Establece el directorio de trabajo
WORKDIR /app

# Instala dependencias del sistema necesarias para compilar paquetes de Python
# (Importante para bcrypt, cryptography y lxml en Linux)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    libxml2-dev \
    libxslt-dev \
    libssl-dev \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# Copia los requerimientos e instálalos
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia el resto del código
COPY . .

# Crea los directorios de subida y procesados por si no existen
RUN mkdir -p uploads processed

# Expone el puerto que usa FastAPI
EXPOSE 8000

# Comando para ejecutar la aplicación
# Usamos 0.0.0.0 para que sea accesible desde fuera del contenedor
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
