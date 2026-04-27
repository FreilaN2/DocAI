-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS docai_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE docai_db;

-- 1. Tabla de Planes
CREATE TABLE IF NOT EXISTS plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,          -- 'free', 'pro'
    price DECIMAL(10, 2) DEFAULT 0.00,
    max_docs_per_month INT DEFAULT 3,   -- -1 para ilimitado
    has_ai_analysis BOOLEAN DEFAULT FALSE,
    has_watermark BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar planes base
INSERT INTO plans (name, price, max_docs_per_month, has_ai_analysis, has_watermark) 
VALUES ('free', 0.00, 3, FALSE, TRUE),
       ('pro', 12.00, -1, TRUE, FALSE);

-- 2. Tabla de Usuarios
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    plan_id INT DEFAULT 1,              -- Por defecto inicia en plan Free
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES plans(id)
);

-- 3. Tabla de Sesiones (para tokens JWT o sesiones activas)
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(500) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Tabla de Documentos Procesados (Historial)
CREATE TABLE IF NOT EXISTS processed_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    apa_version VARCHAR(10) NOT NULL,   -- '6ta', '7ma'
    download_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Tabla de Uso Mensual (para controlar el límite del plan free)
CREATE TABLE IF NOT EXISTS user_usage (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    month_year VARCHAR(7) NOT NULL,     -- Formato '2024-04'
    docs_count INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_month (user_id, month_year)
);
