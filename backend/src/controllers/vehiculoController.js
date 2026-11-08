const pool = require('../config/db');

// Listar vehículos con posibilidad de búsqueda
const getVehiculos = async (req, res) => {
  try {
    const { busqueda, estado } = req.query;

    let sql = `
      SELECT 
        v.id,
        v.placa,
        v.marca,
        v.modelo,
        v.color,
        v.tipo,
        v.estado,
        v.creado_en,
        m.id AS movimiento_activo_id,
        m.fecha_hora_entrada,
        c.codigo AS celda_codigo,
        c.ubicacion AS celda_ubicacion
      FROM vehiculos v
      LEFT JOIN movimientos m ON v.id = m.vehiculo_id AND m.estado = 'Abierto'
      LEFT JOIN celdas c ON m.celda_id = c.id
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

    sql += ' ORDER BY v.id DESC';

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
        v.id,
        v.placa,
        v.marca,
        v.modelo,
        v.color,
        v.tipo,
        v.estado,
        m.id AS movimiento_activo_id,
        m.fecha_hora_entrada,
        c.id AS celda_id,
        c.codigo AS celda_codigo,
        c.ubicacion AS celda_ubicacion
      FROM vehiculos v
      LEFT JOIN movimientos m ON v.id = m.vehiculo_id AND m.estado = 'Abierto'
      LEFT JOIN celdas c ON m.celda_id = c.id
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
  const { placa, marca, modelo, color, tipo, estado } = req.body;

  if (!placa || !marca || !modelo || !color) {
    return res.status(400).json({
      success: false,
      message: 'Placa, marca, modelo y color son campos obligatorios'
    });
  }

  const placaNormalizada = placa.trim().toUpperCase();
  const estadoFinal = estado && ['Activo', 'Inactivo'].includes(estado) ? estado : 'Activo';

  try {
    // Validar placa duplicada
    const [existentes] = await pool.query('SELECT id FROM vehiculos WHERE UPPER(placa) = ?', [placaNormalizada]);
    if (existentes.length > 0) {
      return res.status(409).json({
        success: false,
        message: `El vehículo con placa ${placaNormalizada} ya se encuentra registrado`
      });
    }

    const [result] = await pool.query(
      'INSERT INTO vehiculos (placa, marca, modelo, color, tipo, estado) VALUES (?, ?, ?, ?, ?, ?)',
      [placaNormalizada, marca.trim(), modelo.trim(), color.trim(), tipo ? tipo.trim() : 'Automóvil', estadoFinal]
    );

    return res.status(201).json({
      success: true,
      message: 'Vehículo registrado exitosamente',
      data: {
        id: result.insertId,
        placa: placaNormalizada,
        marca: marca.trim(),
        modelo: modelo.trim(),
        color: color.trim(),
        tipo: tipo || 'Automóvil',
        estado: estadoFinal
      }
    });
  } catch (error) {
    console.error('Error al registrar vehículo:', error);
    return res.status(500).json({ success: false, message: 'Error al registrar vehículo', error: error.message });
  }
};

// Actualizar información de un vehículo
const updateVehiculo = async (req, res) => {
  const { id } = req.params;
  const { placa, marca, modelo, color, tipo, estado } = req.body;

  try {
    const [existentes] = await pool.query('SELECT id FROM vehiculos WHERE id = ?', [id]);
    if (existentes.length === 0) {
      return res.status(404).json({ success: false, message: 'Vehículo no encontrado' });
    }

    if (placa) {
      const placaNormalizada = placa.trim().toUpperCase();
      const [duplicados] = await pool.query(
        'SELECT id FROM vehiculos WHERE UPPER(placa) = ? AND id != ?',
        [placaNormalizada, id]
      );
      if (duplicados.length > 0) {
        return res.status(409).json({ success: false, message: 'Ya existe otro vehículo registrado con esa placa' });
      }
    }

    await pool.query(
      `UPDATE vehiculos SET 
        placa = COALESCE(?, placa),
        marca = COALESCE(?, marca),
        modelo = COALESCE(?, modelo),
        color = COALESCE(?, color),
        tipo = COALESCE(?, tipo),
        estado = COALESCE(?, estado)
      WHERE id = ?`,
      [
        placa ? placa.trim().toUpperCase() : null,
        marca ? marca.trim() : null,
        modelo ? modelo.trim() : null,
        color ? color.trim() : null,
        tipo ? tipo.trim() : null,
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
    return res.status(500).json({ success: false, message: 'Error al actualizar vehículo', error: error.message });
  }
};

module.exports = {
  getVehiculos,
  getVehiculoByPlaca,
  createVehiculo,
  updateVehiculo
};
