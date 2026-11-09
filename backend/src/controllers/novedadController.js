const pool = require('../config/db');

// Listar novedades con filtros opcionales
const getNovedades = async (req, res) => {
  try {
    const { busqueda, vehiculo_id, estado } = req.query;

    let sql = `
      SELECT
        n.idNovedad AS id,
        n.idNovedad,
        n.descripcion,
        n.fechaHoraReporte AS fecha_hora,
        n.fechaHoraReporte,
        n.estado,
        v.idVehiculo AS vehiculo_id,
        v.idVehiculo,
        v.placa,
        v.marca,
        v.modelo,
        v.color,
        u.idUsuario AS usuario_id,
        u.idUsuario,
        u.nombre AS usuario_nombre,
        u.rol AS usuario_rol,
        n.Movimiento_idMovimiento AS movimiento_id
      FROM Novedad n
      JOIN Vehiculo v ON n.Vehiculo_idVehiculo = v.idVehiculo
      JOIN Usuario u ON n.Usuario_idUsuario = u.idUsuario
      WHERE 1=1
    `;
    const params = [];

    if (vehiculo_id) {
      sql += ' AND n.Vehiculo_idVehiculo = ?';
      params.push(vehiculo_id);
    }

    if (estado) {
      sql += ' AND n.estado = ?';
      params.push(estado);
    }

    if (busqueda) {
      sql += ' AND (v.placa LIKE ? OR n.descripcion LIKE ? OR u.nombre LIKE ?)';
      params.push(`%${busqueda}%`, `%${busqueda}%`, `%${busqueda}%`);
    }

    sql += ' ORDER BY n.idNovedad DESC';

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
  const { placa, vehiculo_id, descripcion, estado } = req.body;
  const usuario_id = req.user ? (req.user.idUsuario || req.user.id) : 1;

  if (!descripcion || (!placa && !vehiculo_id)) {
    return res.status(400).json({
      success: false,
      message: 'Debe ingresar la placa del vehículo y la descripción de la novedad'
    });
  }

  try {
    let resolvedVehiculoId = vehiculo_id;

    if (!resolvedVehiculoId && placa) {
      const [vehiculos] = await pool.query('SELECT idVehiculo FROM Vehiculo WHERE UPPER(placa) = ?', [placa.trim().toUpperCase()]);
      if (vehiculos.length === 0) {
        return res.status(404).json({
          success: false,
          message: `El vehículo con placa ${placa.trim().toUpperCase()} no se encuentra registrado`
        });
      }
      resolvedVehiculoId = vehiculos[0].idVehiculo;
    }

    // Buscar si el vehículo tiene un movimiento abierto para vincular
    const [movimientos] = await pool.query(
      'SELECT idMovimiento FROM Movimiento WHERE Vehiculo_idVehiculo = ? AND estado = "Abierto" ORDER BY idMovimiento DESC LIMIT 1',
      [resolvedVehiculoId]
    );
    const resolvedMovimientoId = movimientos.length > 0 ? movimientos[0].idMovimiento : null;

    const estadoFinal = estado || 'Registrada';

    const [result] = await pool.query(
      `INSERT INTO Novedad
        (Vehiculo_idVehiculo, Usuario_idUsuario, Movimiento_idMovimiento, descripcion, fechaHoraReporte, estado)
       VALUES (?, ?, ?, ?, NOW(), ?)`,
      [resolvedVehiculoId, usuario_id, resolvedMovimientoId, descripcion.trim(), estadoFinal]
    );

    return res.status(201).json({
      success: true,
      message: 'Novedad registrada exitosamente',
      data: {
        id: result.insertId,
        idNovedad: result.insertId,
        vehiculo_id: resolvedVehiculoId,
        descripcion: descripcion.trim(),
        estado: estadoFinal
      }
    });
  } catch (error) {
    console.error('Error al registrar novedad:', error);
    return res.status(500).json({ success: false, message: 'Error interno al registrar novedad', error: error.message });
  }
};

// Actualizar estado de una novedad
const updateEstadoNovedad = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  if (!estado) {
    return res.status(400).json({ success: false, message: 'Debe especificar el nuevo estado de la novedad' });
  }

  try {
    const [existentes] = await pool.query('SELECT idNovedad FROM Novedad WHERE idNovedad = ?', [id]);
    if (existentes.length === 0) {
      return res.status(404).json({ success: false, message: 'Novedad no encontrada' });
    }

    await pool.query('UPDATE Novedad SET estado = ? WHERE idNovedad = ?', [estado.trim(), id]);

    return res.json({
      success: true,
      message: `Estado de la novedad actualizado a '${estado}' exitosamente`
    });
  } catch (error) {
    console.error('Error al actualizar estado de novedad:', error);
    return res.status(500).json({ success: false, message: 'Error interno al actualizar estado de la novedad', error: error.message });
  }
};

module.exports = {
  getNovedades,
  createNovedad,
  updateEstadoNovedad
};
