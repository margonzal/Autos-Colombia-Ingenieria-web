-- ==========================================================
-- PROYECTO: Autos Colombia - Datos Iniciales (Seed)
-- Credencial de prueba para desarrollo y evaluación:
-- Contraseña para usuarios de prueba: admin123
-- Hash Bcrypt oficial generado para 'admin123' (10 rounds):
-- $2a$10$7JB720yubVSZvUI0rEqK/.VqGOZTH.ulu33dHOiBE8ByOhJIrdAu2
-- ==========================================================

USE autos_colombia;

-- Usuarios de prueba iniciales (1 Administrador, 1 Operador)
-- Contraseña para ambos perfiles: admin123
INSERT INTO usuarios (nombre_completo, correo, password, rol, estado) VALUES
('Carlos Admin Mendoza', 'admin@autoscolombia.com', '$2a$10$7JB720yubVSZvUI0rEqK/.VqGOZTH.ulu33dHOiBE8ByOhJIrdAu2', 'Administrador', 'Activo'),
('Laura Operadora Gómez', 'operador@autoscolombia.com', '$2a$10$7JB720yubVSZvUI0rEqK/.VqGOZTH.ulu33dHOiBE8ByOhJIrdAu2', 'Operador', 'Activo')
ON DUPLICATE KEY UPDATE 
    nombre_completo = VALUES(nombre_completo),
    password = VALUES(password);

-- Celdas iniciales del parqueadero (Piso 1 y Piso 2)
INSERT INTO celdas (codigo, ubicacion, estado) VALUES
('C-101', 'Piso 1 - Sector Norte', 'Disponible'),
('C-102', 'Piso 1 - Sector Norte', 'Disponible'),
('C-103', 'Piso 1 - Sector Norte', 'Disponible'),
('C-104', 'Piso 1 - Sector Sur', 'Disponible'),
('C-105', 'Piso 1 - Sector Sur', 'Disponible'),
('C-201', 'Piso 2 - Sector Central', 'Disponible'),
('C-202', 'Piso 2 - Sector Central', 'Disponible'),
('C-203', 'Piso 2 - Sector Central', 'Inactiva')
ON DUPLICATE KEY UPDATE ubicacion = VALUES(ubicacion);

-- Vehículos registrados para pruebas
INSERT INTO vehiculos (placa, marca, modelo, color, tipo, estado) VALUES
('ABC123', 'Mazda', 'Mazda 3 2021', 'Rojo Místico', 'Automóvil', 'Activo'),
('XYZ789', 'Renault', 'Duster 2022', 'Blanco Glaciar', 'Camioneta', 'Activo'),
('COL456', 'Toyota', 'Corolla 2020', 'Gris Plata', 'Automóvil', 'Activo'),
('BOG321', 'Chevrolet', 'Onix 2023', 'Azul Eléctrico', 'Automóvil', 'Activo')
ON DUPLICATE KEY UPDATE marca = VALUES(marca);
