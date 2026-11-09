const pool = require('../config/db');

// Listar todas las celdas, incluyendo si está ocupada qué vehículo la ocupa
const getCeldas = async (req, res) => {
  try {
    const { estado, busqueda } = req.query;

    let sql = `
      SELECT
        c.idCelda AS id,
        c.idCelda,
        c.numeroCelda AS codigo,
        c.numeroCelda,
        c.ubicacion,
        c.estado,
        m.idMovimiento AS movimiento_activo_id,
        m.idMovimiento,
        m.fechaHoraEntrada AS fecha_hora_entrada,
        m.fechaHoraEntrada,
        v.idVehiculo AS vehiculo_id,
        v.idVehiculo,
        v.placa AS vehiculo_placa,
        v.placa,
        v.marca AS vehiculo_marca,
        v.marca,
        v.modelo AS vehiculo_modelo,
        v.modelo,
        v.color AS vehiculo_color,
        v.color
      FROM Celdas c
      LEFT JOIN Movimiento m ON c.idCelda = m.Celdas_idCelda AND m.estado = 'Abierto'
      LEFT JOIN Vehiculo v ON m.Vehiculo_idVehiculo = v.idVehiculo
      WHERE 1=1
    `;
    const params = [];

    if (estado) {
      sql += ' AND c.estado = ?';
      params.push(estado);
    }

    if (busqueda) {
      sql += ' AND (c.numeroCelda LIKE ? OR c.ubicacion LIKE ? OR v.placa LIKE ?)';
      params.push(`%${busqueda}%`, `%${busqueda}%`, `%${busqueda}%`);
    }

    sql += ' ORDER BY c.numeroCelda ASC';

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
      'SELECT idCelda AS id, idCelda, numeroCelda AS codigo, numeroCelda, ubicacion, estado FROM Celdas WHERE estado = "Disponible" ORDER BY numeroCelda ASC'
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al consultar celdas disponibles', error: error.message });
  }
};

// Crear nueva celda
const createCelda = async (req, res) => {
  const { numeroCelda, codigo, ubicacion, estado } = req.body;
  const numCelda = (numeroCelda || codigo || '').trim().toUpperCase();

  if (!numCelda || !ubicacion) {
    return res.status(400).json({
      success: false,
      message: 'El número de celda y la ubicación son campos obligatorios'
    });
  }

  const ubicacionNormalizada = ubicacion.trim();
  const estadoFinal = estado && ['Disponible', 'Ocupada', 'Inactiva'].includes(estado) ? estado : 'Disponible';

  try {
    // Validar código/número duplicado
    const [existentes] = await pool.query('SELECT idCelda FROM Celdas WHERE UPPER(numeroCelda) = ?', [numCelda]);
    if (existentes.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Ya existe una celda con el número ${numCelda}`
      });
    }

    const [result] = await pool.query(
      'INSERT INTO Celdas (numeroCelda, ubicacion, estado) VALUES (?, ?, ?)',
      [numCelda, ubicacionNormalizada, estadoFinal]
    );

    return res.status(201).json({
      success: true,
      message: 'Celda registrada exitosamente',
      data: {
        id: result.insertId,
        idCelda: result.insertId,
        codigo: numCelda,
        numeroCelda: numCelda,
        ubicacion: ubicacionNormalizada,
        estado: estadoFinal
      }
    });
  } catch (error) {
    console.error('Error al registrar celda:', error);
    return res.status(500).json({ success: false, message: 'Error interno al crear celda', error: error.message });
  }
};

// Actualizar celda existente
const updateCelda = async (req, res) => {
  const { id } = req.params;
  const { numeroCelda, codigo, ubicacion, estado } = req.body;
  const numCelda = numeroCelda || codigo;

  try {
    const [existentes] = await pool.query('SELECT idCelda, estado FROM Celdas WHERE idCelda = ?', [id]);
    if (existentes.length === 0) {
      return res.status(404).json({ success: false, message: 'Celda no encontrada' });
    }

    if (numCelda) {
      const numNormalizado = numCelda.trim().toUpperCase();
      const [duplicados] = await pool.query(
        'SELECT idCelda FROM Celdas WHERE UPPER(numeroCelda) = ? AND idCelda != ?',
        [numNormalizado, id]
      );
      if (duplicados.length > 0) {
        return res.status(409).json({ success: false, message: `El número de celda ${numNormalizado} ya existe` });
      }
    }

    // No permitir cambiar a Inactiva o Disponible si actualmente está Ocupada
    if (estado && estado !== existentes[0].estado && existentes[0].estado === 'Ocupada') {
      return res.status(400).json({
        success: false,
        message: 'No puede alterar el estado de una celda actualmente ocupada. Debe registrar la salida del vehículo primero.'
      });
    }

    await pool.query(
      `UPDATE Celdas SET
        numeroCelda = COALESCE(?, numeroCelda),
        ubicacion = COALESCE(?, ubicacion),
        estado = COALESCE(?, estado)
      WHERE idCelda = ?`,
      [
        numCelda ? numCelda.trim().toUpperCase() : null,
        ubicacion ? ubicacion.trim() : null,
        estado || null,
        id
      ]
    );

    return res.json({
      success: true,
      message: 'Celda actualizada correctamente'
    });
  } catch (error) {
    console.error('Error al actualizar celda:', error);
    return res.status(500).json({ success: false, message: 'Error interno al actualizar celda', error: error.message });
  }
};

// Activar o desactivar celda (Disponible <-> Inactiva)
const toggleEstadoCelda = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query('SELECT idCelda, estado FROM Celdas WHERE idCelda = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Celda no encontrada' });
    }

    const celda = rows[0];

    if (celda.estado === 'Ocupada') {
      return res.status(400).json({
        success: false,
        message: 'No es posible desactivar una celda que tiene un vehículo ocupándola.'
      });
    }

    const nuevoEstado = celda.estado === 'Disponible' ? 'Inactiva' : 'Disponible';

    await pool.query('UPDATE Celdas SET estado = ? WHERE idCelda = ?', [nuevoEstado, id]);

    return res.json({
      success: true,
      message: `Celda marcada como ${nuevoEstado} exitosamente`,
      nuevoEstado
    });
  } catch (error) {
    console.error('Error al cambiar estado de celda:', error);
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
