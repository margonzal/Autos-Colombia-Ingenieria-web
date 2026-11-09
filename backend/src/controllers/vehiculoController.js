const pool = require('../config/db');

// Listar vehículos con posibilidad de búsqueda
const getVehiculos = async (req, res) => {
  try {
    const { busqueda, estado } = req.query;

    let sql = `
      SELECT
        v.idVehiculo AS id,
        v.idVehiculo,
        v.placa,
        v.marca,
        v.modelo,
        v.color,
        v.estado,
        m.idMovimiento AS movimiento_activo_id,
        m.idMovimiento,
        m.fechaHoraEntrada AS fecha_hora_entrada,
        m.fechaHoraEntrada,
        c.idCelda AS celda_id,
        c.numeroCelda AS celda_codigo,
        c.numeroCelda,
        c.ubicacion AS celda_ubicacion
      FROM Vehiculo v
      LEFT JOIN Movimiento m ON v.idVehiculo = m.Vehiculo_idVehiculo AND m.estado = 'Abierto'
      LEFT JOIN Celdas c ON m.Celdas_idCelda = c.idCelda
      WHERE 1=1
    `;
    const params = [];

    if (estado) {
      sql += ' AND v.estado = ?';
      params.push(estado);
    }

    if (busqueda) {
      sql += ' AND (v.placa LIKE ? OR v.marca LIKE ? OR v.modelo LIKE ?)';
      params.push(`%${busqueda}%`, `%${busqueda}%`, `%${busqueda}%`);
    }

    sql += ' ORDER BY v.idVehiculo DESC';

    const [vehiculos] = await pool.query(sql, params);

    return res.json({
      success: true,
      data: vehiculos
    });
  } catch (error) {
    console.error('Error al listar vehículos:', error);
    return res.status(500).json({ success: false, message: 'Error interno al consultar vehículos', error: error.message });
  }
};

// Consultar un vehículo por placa con detalle de su estado en parqueadero
const getVehiculoByPlaca = async (req, res) => {
  const { placa } = req.params;

  try {
    const placaNormalizada = placa.trim().toUpperCase();

    const [rows] = await pool.query(
      `SELECT
        v.idVehiculo AS id,
        v.idVehiculo,
        v.placa,
        v.marca,
        v.modelo,
        v.color,
        v.estado,
        m.idMovimiento AS movimiento_activo_id,
        m.idMovimiento,
        m.fechaHoraEntrada AS fecha_hora_entrada,
        m.fechaHoraEntrada,
        c.idCelda AS celda_id,
        c.numeroCelda AS celda_codigo,
        c.numeroCelda,
        c.ubicacion AS celda_ubicacion
      FROM Vehiculo v
      LEFT JOIN Movimiento m ON v.idVehiculo = m.Vehiculo_idVehiculo AND m.estado = 'Abierto'
      LEFT JOIN Celdas c ON m.Celdas_idCelda = c.idCelda
      WHERE UPPER(v.placa) = ?`,
      [placaNormalizada]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No se encontró ningún vehículo con la placa ${placaNormalizada}`
      });
    }

    return res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error al consultar vehículo por placa:', error);
    return res.status(500).json({ success: false, message: 'Error al buscar vehículo', error: error.message });
  }
};

// Registrar nuevo vehículo
const createVehiculo = async (req, res) => {
  const { placa, marca, modelo, color, estado } = req.body;

  if (!placa || !marca || !color) {
    return res.status(400).json({
      success: false,
      message: 'La placa, marca y color son campos obligatorios'
    });
  }

  const placaNormalizada = placa.trim().toUpperCase();
  const estadoFinal = estado && ['Activo', 'Inactivo'].includes(estado) ? estado : 'Activo';

  try {
    // Validar placa duplicada
    const [existentes] = await pool.query('SELECT idVehiculo FROM Vehiculo WHERE UPPER(placa) = ?', [placaNormalizada]);
    if (existentes.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Ya existe un vehículo registrado con la placa ${placaNormalizada}`
      });
    }

    const [result] = await pool.query(
      'INSERT INTO Vehiculo (placa, marca, modelo, color, estado) VALUES (?, ?, ?, ?, ?)',
      [placaNormalizada, marca.trim(), modelo ? modelo.trim() : null, color.trim(), estadoFinal]
    );

    return res.status(201).json({
      success: true,
      message: 'Vehículo registrado exitosamente',
      data: {
        id: result.insertId,
        idVehiculo: result.insertId,
        placa: placaNormalizada,
        marca: marca.trim(),
        modelo: modelo ? modelo.trim() : null,
        color: color.trim(),
        estado: estadoFinal
      }
    });
  } catch (error) {
    console.error('Error al registrar vehículo:', error);
    return res.status(500).json({ success: false, message: 'Error interno al registrar vehículo', error: error.message });
  }
};

// Actualizar información de vehículo
const updateVehiculo = async (req, res) => {
  const { id } = req.params;
  const { placa, marca, modelo, color, estado } = req.body;

  try {
    // Verificar existencia
    const [existentes] = await pool.query('SELECT idVehiculo FROM Vehiculo WHERE idVehiculo = ?', [id]);
    if (existentes.length === 0) {
      return res.status(404).json({ success: false, message: 'Vehículo no encontrado' });
    }

    // Si modifica placa, validar duplicidad
    if (placa) {
      const placaNormalizada = placa.trim().toUpperCase();
      const [duplicados] = await pool.query(
        'SELECT idVehiculo FROM Vehiculo WHERE UPPER(placa) = ? AND idVehiculo != ?',
        [placaNormalizada, id]
      );
      if (duplicados.length > 0) {
        return res.status(409).json({
          success: false,
          message: `La placa ${placaNormalizada} ya se encuentra registrada en otro vehículo`
        });
      }
    }

    await pool.query(
      `UPDATE Vehiculo SET
        placa = COALESCE(?, placa),
        marca = COALESCE(?, marca),
        modelo = COALESCE(?, modelo),
        color = COALESCE(?, color),
        estado = COALESCE(?, estado)
      WHERE idVehiculo = ?`,
      [
        placa ? placa.trim().toUpperCase() : null,
        marca ? marca.trim() : null,
        modelo !== undefined ? (modelo ? modelo.trim() : null) : null,
        color ? color.trim() : null,
        estado || null,
        id
      ]
    );

    return res.json({
      success: true,
      message: 'Vehículo actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar vehículo:', error);
    return res.status(500).json({ success: false, message: 'Error interno al actualizar vehículo', error: error.message });
  }
};

module.exports = {
  getVehiculos,
  getVehiculoByPlaca,
  createVehiculo,
  updateVehiculo
};
