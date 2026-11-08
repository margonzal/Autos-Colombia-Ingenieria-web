-- ==========================================================
-- PROYECTO: Autos Colombia - Iteración 2
-- Base de Datos: MySQL
-- ==========================================================

CREATE DATABASE IF NOT EXISTS autos_colombia CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE autos_colombia;

-- 1. Tabla de Usuarios internos (personal del parqueadero)
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_completo VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol ENUM('Administrador', 'Operador') NOT NULL DEFAULT 'Operador',
    estado ENUM('Activo', 'Inactivo') NOT NULL DEFAULT 'Activo',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Tabla de Vehículos
CREATE TABLE IF NOT EXISTS vehiculos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    placa VARCHAR(10) NOT NULL UNIQUE,
    marca VARCHAR(50) NOT NULL,
    modelo VARCHAR(50) NOT NULL,
    color VARCHAR(30) NOT NULL,
    tipo VARCHAR(30) DEFAULT 'Automóvil',
    estado ENUM('Activo', 'Inactivo') NOT NULL DEFAULT 'Activo',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Tabla de Celdas (Iteración 2)
CREATE TABLE IF NOT EXISTS celdas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    ubicacion VARCHAR(100) NOT NULL,
    estado ENUM('Disponible', 'Ocupada', 'Inactiva') NOT NULL DEFAULT 'Disponible',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 4. Tabla de Movimientos (Entradas y Salidas)
CREATE TABLE IF NOT EXISTS movimientos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehiculo_id INT NOT NULL,
    celda_id INT NOT NULL,
    usuario_entrada_id INT NOT NULL,
    usuario_salida_id INT NULL,
    fecha_hora_entrada DATETIME NOT NULL,
    fecha_hora_salida DATETIME NULL,
    tiempo_permanencia_minutos INT NULL,
    estado ENUM('Abierto', 'Cerrado') NOT NULL DEFAULT 'Abierto',
    observaciones_entrada TEXT NULL,
    observaciones_salida TEXT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_movimiento_vehiculo FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id) ON UPDATE CASCADE,
    CONSTRAINT fk_movimiento_celda FOREIGN KEY (celda_id) REFERENCES celdas(id) ON UPDATE CASCADE,
    CONSTRAINT fk_movimiento_usuario_entrada FOREIGN KEY (usuario_entrada_id) REFERENCES usuarios(id) ON UPDATE CASCADE,
    CONSTRAINT fk_movimiento_usuario_salida FOREIGN KEY (usuario_salida_id) REFERENCES usuarios(id) ON UPDATE CASCADE
);

-- 5. Tabla de Novedades
CREATE TABLE IF NOT EXISTS novedades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehiculo_id INT NOT NULL,
    usuario_id INT NOT NULL,
    descripcion TEXT NOT NULL,
    fecha_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_novedad_vehiculo FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id) ON UPDATE CASCADE,
    CONSTRAINT fk_novedad_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON UPDATE CASCADE
);

-- Estructura preparada para pagos (Iteración posterior)
-- CREATE TABLE IF NOT EXISTS pagos (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     movimiento_id INT NOT NULL,
--     monto DECIMAL(10,2) NOT NULL,
--     metodo_pago VARCHAR(50),
--     fecha_pago DATETIME DEFAULT CURRENT_TIMESTAMP,
--     CONSTRAINT fk_pago_movimiento FOREIGN KEY (movimiento_id) REFERENCES movimientos(id)
-- );
