const pool = require('../config/db');

// Listar novedades
const getNovedades = async (req, res) => {
  try {
    const { busqueda, vehiculo_id } = req.query;

    let sql = `
      SELECT 
        n.id,
        n.descripcion,
        n.fecha_hora,
        v.id AS vehiculo_id,
        v.placa,
        v.marca,
        v.modelo,
        v.color,
        u.id AS usuario_id,
        u.nombre_completo AS usuario_nombre,
        u.rol AS usuario_rol
      FROM novedades n
      JOIN vehiculos v ON n.vehiculo_id = v.id
      JOIN usuarios u ON n.usuario_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (vehiculo_id) {
      sql += ' AND n.vehiculo_id = ?';
      params.push(vehiculo_id);
    }

    if (busqueda) {
      sql += ' AND (v.placa LIKE ? OR n.descripcion LIKE ? OR u.nombre_completo LIKE ?)';
      params.push(`%${busqueda}%`, `%${busqueda}%`, `%${busqueda}%`);
    }

    sql += ' ORDER BY n.id DESC';

    const [novedades] = await pool.query(sql, params);

    return res.json({
      success: true,
      data: novedades
    });
  } catch (error) {
    console.error('Error al listar novedades:', error);
    return res.status(500).json({ success: false, message: 'Error al consultar novedades', error: error.message });
  }
};

// Registrar una nueva novedad
const createNovedad = async (req, res) => {
  const { placa, vehiculo_id, descripcion } = req.body;
  const usuario_id = req.user ? req.user.id : 1;

  if (!descripcion || (!placa && !vehiculo_id)) {
    return res.status(400).json({
      success: false,
      message: 'Debe ingresar la placa del vehículo y la descripción de la novedad'
    });
  }

  try {
    let resolvedVehiculoId = vehiculo_id;

    if (!resolvedVehiculoId && placa) {
      const [vehiculos] = await pool.query('SELECT id FROM vehiculos WHERE UPPER(placa) = ?', [placa.trim().toUpperCase()]);
      if (vehiculos.length === 0) {
        return res.status(404).json({
          success: false,
          message: `El vehículo con placa ${placa.trim().toUpperCase()} no se encuentra registrado`
        });
      }
      resolvedVehiculoId = vehiculos[0].id;
    }

    const [result] = await pool.query(
      'INSERT INTO novedades (vehiculo_id, usuario_id, descripcion, fecha_hora) VALUES (?, ?, ?, NOW())',
      [resolvedVehiculoId, usuario_id, descripcion.trim()]
    );

    return res.status(201).json({
      success: true,
      message: 'Novedad registrada exitosamente',
      data: {
        id: result.insertId,
        vehiculo_id: resolvedVehiculoId,
        descripcion: descripcion.trim()
      }
    });
  } catch (error) {
    console.error('Error al registrar novedad:', error);
    return res.status(500).json({ success: false, message: 'Error interno al registrar novedad', error: error.message });
  }
};

module.exports = {
  getNovedades,
  createNovedad
};
