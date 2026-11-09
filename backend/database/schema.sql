-- ==========================================================
-- PROYECTO: Autos Colombia - Iteración 2
-- Modelo de Base de Datos Oficial (MySQL Workbench)
-- Esquema: mydb
-- ==========================================================

CREATE SCHEMA IF NOT EXISTS `mydb` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `mydb`;

-- -----------------------------------------------------
-- 1. Tabla `mydb`.`Vehiculo`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`Vehiculo` (
  `idVehiculo` INT NOT NULL AUTO_INCREMENT,
  `placa` VARCHAR(15) NOT NULL,
  `marca` VARCHAR(45) NOT NULL,
  `modelo` VARCHAR(45) NULL,
  `color` VARCHAR(30) NOT NULL,
  `estado` VARCHAR(20) NOT NULL DEFAULT 'Activo',
  PRIMARY KEY (`idVehiculo`),
  UNIQUE INDEX `placa_UNIQUE` (`placa` ASC)
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- 2. Tabla `mydb`.`Usuario`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`Usuario` (
  `idUsuario` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `rol` VARCHAR(45) NOT NULL DEFAULT 'Operador',
  `estado` VARCHAR(20) NOT NULL DEFAULT 'Activo',
  PRIMARY KEY (`idUsuario`),
  UNIQUE INDEX `email_UNIQUE` (`email` ASC)
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- 3. Tabla `mydb`.`Celdas` (Ampliación Iteración 2)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`Celdas` (
  `idCelda` INT NOT NULL AUTO_INCREMENT,
  `numeroCelda` VARCHAR(20) NOT NULL,
  `ubicacion` VARCHAR(100) NULL,
  `estado` VARCHAR(20) NOT NULL DEFAULT 'Disponible',
  PRIMARY KEY (`idCelda`),
  UNIQUE INDEX `numeroCelda_UNIQUE` (`numeroCelda` ASC)
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- 4. Tabla `mydb`.`Movimiento`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`Movimiento` (
  `idMovimiento` INT NOT NULL AUTO_INCREMENT,
  `fechaHoraEntrada` DATETIME NOT NULL,
  `fechaHoraSalida` DATETIME NULL,
  `tiempoPermanenciaMinutos` INT NULL,
  `estado` VARCHAR(20) NOT NULL DEFAULT 'Abierto',
  `observacionesEntrada` TEXT NULL,
  `observacionesSalida` TEXT NULL,
  `Vehiculo_idVehiculo` INT NOT NULL,
  `idUsuarioEntrada` INT NOT NULL,
  `idUsuarioSalida` INT NULL,
  `Celdas_idCelda` INT NOT NULL,
  PRIMARY KEY (`idMovimiento`),
  INDEX `fk_Movimiento_Vehiculo_idx` (`Vehiculo_idVehiculo` ASC),
  INDEX `fk_Movimiento_Usuario1_idx` (`idUsuarioEntrada` ASC),
  INDEX `fk_Movimiento_Usuario2_idx` (`idUsuarioSalida` ASC),
  INDEX `fk_Movimiento_Celdas_idx` (`Celdas_idCelda` ASC),
  CONSTRAINT `fk_Movimiento_Vehiculo`
    FOREIGN KEY (`Vehiculo_idVehiculo`)
    REFERENCES `mydb`.`Vehiculo` (`idVehiculo`)
    ON DELETE NO ACTION
    ON UPDATE CASCADE,
  CONSTRAINT `fk_Movimiento_Usuario1`
    FOREIGN KEY (`idUsuarioEntrada`)
    REFERENCES `mydb`.`Usuario` (`idUsuario`)
    ON DELETE NO ACTION
    ON UPDATE CASCADE,
  CONSTRAINT `fk_Movimiento_Usuario2`
    FOREIGN KEY (`idUsuarioSalida`)
    REFERENCES `mydb`.`Usuario` (`idUsuario`)
    ON DELETE NO ACTION
    ON UPDATE CASCADE,
  CONSTRAINT `fk_Movimiento_Celdas`
    FOREIGN KEY (`Celdas_idCelda`)
    REFERENCES `mydb`.`Celdas` (`idCelda`)
    ON DELETE NO ACTION
    ON UPDATE CASCADE
) ENGINE = InnoDB;

-- -----------------------------------------------------
-- 5. Tabla `mydb`.`Novedad`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`Novedad` (
  `idNovedad` INT NOT NULL AUTO_INCREMENT,
  `descripcion` VARCHAR(300) NOT NULL,
  `fechaHoraReporte` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `estado` VARCHAR(45) NOT NULL DEFAULT 'Registrada',
  `Vehiculo_idVehiculo` INT NOT NULL,
  `Usuario_idUsuario` INT NOT NULL,
  `Movimiento_idMovimiento` INT NULL,
  PRIMARY KEY (`idNovedad`),
  INDEX `fk_Novedad_Vehiculo1_idx` (`Vehiculo_idVehiculo` ASC),
  INDEX `fk_Novedad_Usuario1_idx` (`Usuario_idUsuario` ASC),
  INDEX `fk_Novedad_Movimiento1_idx` (`Movimiento_idMovimiento` ASC),
  CONSTRAINT `fk_Novedad_Vehiculo1`
    FOREIGN KEY (`Vehiculo_idVehiculo`)
    REFERENCES `mydb`.`Vehiculo` (`idVehiculo`)
    ON DELETE NO ACTION
    ON UPDATE CASCADE,
  CONSTRAINT `fk_Novedad_Usuario1`
    FOREIGN KEY (`Usuario_idUsuario`)
    REFERENCES `mydb`.`Usuario` (`idUsuario`)
    ON DELETE NO ACTION
    ON UPDATE CASCADE,
  CONSTRAINT `fk_Novedad_Movimiento1`
    FOREIGN KEY (`Movimiento_idMovimiento`)
    REFERENCES `mydb`.`Movimiento` (`idMovimiento`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE = InnoDB;
