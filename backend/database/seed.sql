-- ==========================================================
-- PROYECTO: Autos Colombia - Iteración 2
-- Datos Iniciales de Prueba (Seed)
-- Esquema Oficial: mydb
-- Contraseña de prueba para ambos usuarios: admin123
-- Hash Bcrypt oficial generado (10 rondas):
-- $2a$10$lQwI6TAEFg4InhezNT5wyOrhy0JMTytn89.P8M5wb1l5SMZQTUmZG
-- ==========================================================

USE `mydb`;

-- 1. Usuarios del sistema (1 Administrador, 1 Operador)
INSERT INTO `mydb`.`Usuario` (`idUsuario`, `nombre`, `email`, `password`, `rol`, `estado`) VALUES
(1, 'Carlos Admin Mendoza', 'admin@autoscolombia.com', '$2a$10$lQwI6TAEFg4InhezNT5wyOrhy0JMTytn89.P8M5wb1l5SMZQTUmZG', 'Administrador', 'Activo'),
(2, 'Laura Operadora Gómez', 'operador@autoscolombia.com', '$2a$10$lQwI6TAEFg4InhezNT5wyOrhy0JMTytn89.P8M5wb1l5SMZQTUmZG', 'Operador', 'Activo')
ON DUPLICATE KEY UPDATE
    `nombre` = VALUES(`nombre`),
    `password` = VALUES(`password`),
    `rol` = VALUES(`rol`),
    `estado` = VALUES(`estado`);

-- 2. Celdas del parqueadero
INSERT INTO `mydb`.`Celdas` (`idCelda`, `numeroCelda`, `ubicacion`, `estado`) VALUES
(1, 'C-101', 'Piso 1 - Sector Norte', 'Ocupada'),
(2, 'C-102', 'Piso 1 - Sector Norte', 'Disponible'),
(3, 'C-103', 'Piso 1 - Sector Norte', 'Disponible'),
(4, 'C-104', 'Piso 1 - Sector Sur', 'Disponible'),
(5, 'C-105', 'Piso 1 - Sector Sur', 'Disponible'),
(6, 'C-201', 'Piso 2 - Sector Central', 'Disponible'),
(7, 'C-202', 'Piso 2 - Sector Central', 'Disponible'),
(8, 'C-203', 'Piso 2 - Sector Central', 'Inactiva')
ON DUPLICATE KEY UPDATE
    `ubicacion` = VALUES(`ubicacion`),
    `estado` = VALUES(`estado`);

-- 3. Vehículos registrados
INSERT INTO `mydb`.`Vehiculo` (`idVehiculo`, `placa`, `marca`, `modelo`, `color`, `estado`) VALUES
(1, 'ABC123', 'Mazda', 'Mazda 3 2021', 'Rojo Místico', 'Activo'),
(2, 'XYZ789', 'Renault', 'Duster 2022', 'Blanco Glaciar', 'Activo'),
(3, 'COL456', 'Toyota', 'Corolla 2020', 'Gris Plata', 'Activo'),
(4, 'BOG321', 'Chevrolet', 'Onix 2023', 'Azul Eléctrico', 'Activo')
ON DUPLICATE KEY UPDATE
    `marca` = VALUES(`marca`),
    `modelo` = VALUES(`modelo`),
    `color` = VALUES(`color`),
    `estado` = VALUES(`estado`);

-- 4. Movimientos de prueba (1 Abierto en Celda C-101 y 1 Cerrado histórico)
INSERT INTO `mydb`.`Movimiento`
(`idMovimiento`, `fechaHoraEntrada`, `fechaHoraSalida`, `tiempoPermanenciaMinutos`, `estado`, `observacionesEntrada`, `observacionesSalida`, `Vehiculo_idVehiculo`, `idUsuarioEntrada`, `idUsuarioSalida`, `Celdas_idCelda`)
VALUES
(1, DATE_SUB(NOW(), INTERVAL 3 HOUR), DATE_SUB(NOW(), INTERVAL 1 HOUR), 120, 'Cerrado', 'Ingreso normal por mensualidad', 'Salida sin novedades', 2, 1, 2, 2),
(2, DATE_SUB(NOW(), INTERVAL 45 MINUTE), NULL, NULL, 'Abierto', 'Vehículo con rayón previo en puerta lateral derecha', NULL, 1, 1, NULL, 1)
ON DUPLICATE KEY UPDATE
    `estado` = VALUES(`estado`);

-- 5. Novedades de prueba
INSERT INTO `mydb`.`Novedad`
(`idNovedad`, `descripcion`, `fechaHoraReporte`, `estado`, `Vehiculo_idVehiculo`, `Usuario_idUsuario`, `Movimiento_idMovimiento`)
VALUES
(1, 'Rayón leve detectado en la puerta lateral derecha al momento del ingreso.', DATE_SUB(NOW(), INTERVAL 40 MINUTE), 'Registrada', 1, 1, 2)
ON DUPLICATE KEY UPDATE
    `descripcion` = VALUES(`descripcion`);
