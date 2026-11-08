const pool = require('../config/db');

// Listar todas las celdas, incluyendo si está ocupada qué vehículo la ocupa
const getCeldas = async (req, res) => {
  try {
    const { estado, busqueda } = req.query;

    let sql = `
      SELECT 
        c.id,
        c.codigo,
        c.ubicacion,
        c.estado,
        c.creado_en,
        c.actualizado_en,
        m.id AS movimiento_activo_id,
        m.fecha_hora_entrada,
        v.id AS vehiculo_id,
        v.placa AS vehiculo_placa,
        v.marca AS vehiculo_marca,
        v.modelo AS vehiculo_modelo,
        v.color AS vehiculo_color
      FROM celdas c
      LEFT JOIN movimientos m ON c.id = m.celda_id AND m.estado = 'Abierto'
      LEFT JOIN vehiculos v ON m.vehiculo_id = v.id
      WHERE 1=1
    `;
    const params = [];

    if (estado) {
      sql += ' AND c.estado = ?';
      params.push(estado);
    }

    if (busqueda) {
      sql += ' AND (c.codigo LIKE ? OR c.ubicacion LIKE ? OR v.placa LIKE ?)';
      params.push(`%${busqueda}%`, `%${busqueda}%`, `%${busqueda}%`);
    }

    sql += ' ORDER BY c.codigo ASC';

    const [celdas] = await pool.query(sql, params);

    return res.json({
      success: true,
      data: celdas
    });
  } catch (error) {
    console.error('Error al obtener celdas:', error);
    return res.status(500).json({ success: false, message: 'Error interno al consultar celdas', error: error.message });
  }
};

// Obtener solo celdas disponibles para selector de entrada
const getCeldasDisponibles = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, codigo, ubicacion, estado FROM celdas WHERE estado = "Disponible" ORDER BY codigo ASC'
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al consultar celdas disponibles', error: error.message });
  }
};

// Crear nueva celda
const createCelda = async (req, res) => {
  const { codigo, ubicacion, estado } = req.body;

  if (!codigo || !ubicacion) {
    return res.status(400).json({
      success: false,
      message: 'El código de celda y la ubicación son campos obligatorios'
    });
  }

  const codigoNormalizado = codigo.trim().toUpperCase();
  const ubicacionNormalizada = ubicacion.trim();
  const estadoFinal = estado && ['Disponible', 'Ocupada', 'Inactiva'].includes(estado) ? estado : 'Disponible';

  try {
    // Validar código duplicado
    const [existentes] = await pool.query('SELECT id FROM celdas WHERE UPPER(codigo) = ?', [codigoNormalizado]);
    if (existentes.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Ya existe una celda con el código ${codigoNormalizado}`
      });
    }

    const [result] = await pool.query(
      'INSERT INTO celdas (codigo, ubicacion, estado) VALUES (?, ?, ?)',
      [codigoNormalizado, ubicacionNormalizada, estadoFinal]
    );

    return res.status(201).json({
      success: true,
      message: 'Celda registrada exitosamente',
      data: {
        id: result.insertId,
        codigo: codigoNormalizado,
        ubicacion: ubicacionNormalizada,
        estado: estadoFinal
      }
    });
  } catch (error) {
    console.error('Error al registrar celda:', error);
    return res.status(500).json({ success: false, message: 'Error al registrar la celda', error: error.message });
  }
};

// Editar celda
const updateCelda = async (req, res) => {
  const { id } = req.params;
  const { codigo, ubicacion, estado } = req.body;

  try {
    const [existentes] = await pool.query('SELECT id, estado FROM celdas WHERE id = ?', [id]);
    if (existentes.length === 0) {
      return res.status(404).json({ success: false, message: 'Celda no encontrada' });
    }

    const celdaActual = existentes[0];

    // Si tiene movimiento activo y se intenta cambiar a disponible o inactiva manualmente
    if (celdaActual.estado === 'Ocupada' && estado && estado !== 'Ocupada') {
      const [movimientos] = await pool.query('SELECT id FROM movimientos WHERE celda_id = ? AND estado = "Abierto"', [id]);
      if (movimientos.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'No puede cambiar el estado de una celda que tiene un vehículo ocupándola. Registre la salida del vehículo primero.'
        });
      }
    }

    // Validar código duplicado con otra celda
    if (codigo) {
      const codigoNormalizado = codigo.trim().toUpperCase();
      const [duplicados] = await pool.query(
        'SELECT id FROM celdas WHERE UPPER(codigo) = ? AND id != ?',
        [codigoNormalizado, id]
      );
      if (duplicados.length > 0) {
        return res.status(409).json({ success: false, message: 'Ya existe otra celda con ese código' });
      }
    }

    await pool.query(
      'UPDATE celdas SET codigo = COALESCE(?, codigo), ubicacion = COALESCE(?, ubicacion), estado = COALESCE(?, estado) WHERE id = ?',
      [codigo ? codigo.trim().toUpperCase() : null, ubicacion ? ubicacion.trim() : null, estado || null, id]
    );

    return res.json({
      success: true,
      message: 'Celda actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar celda:', error);
    return res.status(500).json({ success: false, message: 'Error al actualizar la celda', error: error.message });
  }
};

// Activar o desactivar celda
const toggleEstadoCelda = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query('SELECT id, codigo, estado FROM celdas WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Celda no encontrada' });
    }

    const celda = rows[0];

    if (celda.estado === 'Ocupada') {
      return res.status(400).json({
        success: false,
        message: 'No se puede desactivar una celda que actualmente está ocupada por un vehículo'
      });
    }

    const nuevoEstado = celda.estado === 'Inactiva' ? 'Disponible' : 'Inactiva';

    await pool.query('UPDATE celdas SET estado = ? WHERE id = ?', [nuevoEstado, id]);

    return res.json({
      success: true,
      message: `Celda ${celda.codigo} ${nuevoEstado === 'Disponible' ? 'activada' : 'inactivada'} correctamente`,
      nuevoEstado
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al cambiar estado de la celda', error: error.message });
  }
};

module.exports = {
  getCeldas,
  getCeldasDisponibles,
  createCelda,
  updateCelda,
  toggleEstadoCelda
};
