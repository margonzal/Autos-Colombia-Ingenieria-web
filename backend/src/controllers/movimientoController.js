const pool = require('../config/db');

// Listar historial de movimientos con filtros
const getMovimientos = async (req, res) => {
  try {
    const { busqueda, estado, fecha_desde, fecha_hasta } = req.query;

    let sql = `
      SELECT 
        m.id,
        m.fecha_hora_entrada,
        m.fecha_hora_salida,
        m.tiempo_permanencia_minutos,
        m.estado,
        m.observaciones_entrada,
        m.observaciones_salida,
        v.id AS vehiculo_id,
        v.placa,
        v.marca,
        v.modelo,
        v.color,
        c.id AS celda_id,
        c.codigo AS celda_codigo,
        c.ubicacion AS celda_ubicacion,
        ue.nombre_completo AS usuario_entrada,
        us.nombre_completo AS usuario_salida
      FROM movimientos m
      JOIN vehiculos v ON m.vehiculo_id = v.id
      JOIN celdas c ON m.celda_id = c.id
      JOIN usuarios ue ON m.usuario_entrada_id = ue.id
      LEFT JOIN usuarios us ON m.usuario_salida_id = us.id
      WHERE 1=1
    `;
    const params = [];

    if (estado) {
      sql += ' AND m.estado = ?';
      params.push(estado);
    }

    if (busqueda) {
      sql += ' AND (v.placa LIKE ? OR c.codigo LIKE ? OR v.marca LIKE ?)';
      params.push(`%${busqueda}%`, `%${busqueda}%`, `%${busqueda}%`);
    }

    if (fecha_desde) {
      sql += ' AND DATE(m.fecha_hora_entrada) >= ?';
      params.push(fecha_desde);
    }

    if (fecha_hasta) {
      sql += ' AND DATE(m.fecha_hora_entrada) <= ?';
      params.push(fecha_hasta);
    }

    sql += ' ORDER BY m.id DESC';

    const [movimientos] = await pool.query(sql, params);

    return res.json({
      success: true,
      data: movimientos
    });
  } catch (error) {
    console.error('Error al consultar movimientos:', error);
    return res.status(500).json({ success: false, message: 'Error interno al consultar historial de movimientos', error: error.message });
  }
};

// Consultar movimiento activo de un vehículo por placa
const getMovimientoActivoPorPlaca = async (req, res) => {
  const { placa } = req.params;

  try {
    const placaNormalizada = placa.trim().toUpperCase();

    const [rows] = await pool.query(
      `SELECT 
        m.id,
        m.fecha_hora_entrada,
        m.observaciones_entrada,
        m.estado,
        TIMESTAMPDIFF(MINUTE, m.fecha_hora_entrada, NOW()) AS minutos_transcurridos,
        v.id AS vehiculo_id,
        v.placa,
        v.marca,
        v.modelo,
        v.color,
        c.id AS celda_id,
        c.codigo AS celda_codigo,
        c.ubicacion AS celda_ubicacion,
        u.nombre_completo AS usuario_entrada
      FROM movimientos m
      JOIN vehiculos v ON m.vehiculo_id = v.id
      JOIN celdas c ON m.celda_id = c.id
      JOIN usuarios u ON m.usuario_entrada_id = u.id
      WHERE UPPER(v.placa) = ? AND m.estado = 'Abierto'
      LIMIT 1`,
      [placaNormalizada]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No hay ningún movimiento abierto para el vehículo con placa ${placaNormalizada}`
      });
    }

    return res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error al consultar movimiento activo:', error);
    return res.status(500).json({ success: false, message: 'Error al buscar movimiento activo', error: error.message });
  }
};

// Registrar Entrada
const registrarEntrada = async (req, res) => {
  const { placa, celda_id, observaciones_entrada } = req.body;
  const usuario_entrada_id = req.user ? req.user.id : 1;

  if (!placa || !celda_id) {
    return res.status(400).json({
      success: false,
      message: 'Debe ingresar la placa del vehículo y seleccionar una celda'
    });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const placaNormalizada = placa.trim().toUpperCase();

    // 1. Verificar si el vehículo existe y está activo
    const [vehiculos] = await connection.query(
      'SELECT id, placa, marca, modelo, estado FROM vehiculos WHERE UPPER(placa) = ?',
      [placaNormalizada]
    );

    if (vehiculos.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: `El vehículo con placa ${placaNormalizada} no está registrado en el sistema. Regístrelo primero.`
      });
    }

    const vehiculo = vehiculos[0];

    if (vehiculo.estado !== 'Activo') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'El vehículo se encuentra en estado inactivo en el sistema.'
      });
    }

    // 2. Validar que el vehículo NO tenga ya un movimiento abierto
    const [movimientosAbiertos] = await connection.query(
      'SELECT id, celda_id FROM movimientos WHERE vehiculo_id = ? AND estado = "Abierto"',
      [vehiculo.id]
    );

    if (movimientosAbiertos.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `El vehículo ${placaNormalizada} ya tiene un ingreso abierto en el parqueadero.`
      });
    }

    // 3. Validar que la celda exista y esté DISPONIBLE
    const [celdas] = await connection.query(
      'SELECT id, codigo, estado FROM celdas WHERE id = ? FOR UPDATE',
      [celda_id]
    );

    if (celdas.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'La celda seleccionada no existe' });
    }

    const celda = celdas[0];

    if (celda.estado === 'Ocupada') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `La celda ${celda.codigo} ya se encuentra ocupada por otro vehículo.`
      });
    }

    if (celda.estado === 'Inactiva') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `La celda ${celda.codigo} está inactiva y no puede ser asignada.`
      });
    }

    // 4. Crear el registro de movimiento
    const fechaHoraEntrada = new Date();
    const [insertResult] = await connection.query(
      `INSERT INTO movimientos 
        (vehiculo_id, celda_id, usuario_entrada_id, fecha_hora_entrada, estado, observaciones_entrada) 
       VALUES (?, ?, ?, ?, 'Abierto', ?)`,
      [vehiculo.id, celda.id, usuario_entrada_id, fechaHoraEntrada, observaciones_entrada || null]
    );

    // 5. Actualizar el estado de la celda a Ocupada
    await connection.query('UPDATE celdas SET estado = "Ocupada" WHERE id = ?', [celda.id]);

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: `Entrada registrada con éxito para el vehículo ${placaNormalizada} en la celda ${celda.codigo}`,
      data: {
        movimiento_id: insertResult.insertId,
        vehiculo_placa: placaNormalizada,
        celda_codigo: celda.codigo,
        fecha_hora_entrada: fechaHoraEntrada
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error al registrar entrada:', error);
    return res.status(500).json({
      success: false,
      message: 'Error en el servidor al registrar la entrada del vehículo',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Registrar Salida
const registrarSalida = async (req, res) => {
  const { movimiento_id, observaciones_salida } = req.body;
  const usuario_salida_id = req.user ? req.user.id : 1;

  if (!movimiento_id) {
    return res.status(400).json({
      success: false,
      message: 'Debe especificar el número de movimiento a cerrar'
    });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Obtener el movimiento abierto
    const [movimientos] = await connection.query(
      `SELECT m.*, v.placa, c.codigo AS celda_codigo 
       FROM movimientos m
       JOIN vehiculos v ON m.vehiculo_id = v.id
       JOIN celdas c ON m.celda_id = c.id
       WHERE m.id = ? FOR UPDATE`,
      [movimiento_id]
    );

    if (movimientos.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'El movimiento no fue encontrado' });
    }

    const mov = movimientos[0];

    if (mov.estado === 'Cerrado') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Este movimiento ya fue cerrado anteriormente.'
      });
    }

    // 2. Calcular tiempo de permanencia
    const fechaHoraSalida = new Date();
    const fechaEntrada = new Date(mov.fecha_hora_entrada);
    const diffMs = fechaHoraSalida - fechaEntrada;
    const tiempoPermanenciaMinutos = Math.max(1, Math.round(diffMs / (1000 * 60)));

    // 3. Actualizar movimiento a Cerrado
    await connection.query(
      `UPDATE movimientos SET 
        usuario_salida_id = ?, 
        fecha_hora_salida = ?, 
        tiempo_permanencia_minutos = ?, 
        estado = 'Cerrado', 
        observaciones_salida = ?
       WHERE id = ?`,
      [usuario_salida_id, fechaHoraSalida, tiempoPermanenciaMinutos, observaciones_salida || null, mov.id]
    );

    // 4. Liberar la celda a Disponible
    await connection.query('UPDATE celdas SET estado = "Disponible" WHERE id = ?', [mov.celda_id]);

    await connection.commit();

    return res.json({
      success: true,
      message: `Salida registrada exitosamente. Tiempo de permanencia: ${tiempoPermanenciaMinutos} minutos.`,
      data: {
        movimiento_id: mov.id,
        placa: mov.placa,
        celda: mov.celda_codigo,
        fecha_hora_entrada: mov.fecha_hora_entrada,
        fecha_hora_salida: fechaHoraSalida,
        tiempo_permanencia_minutos: tiempoPermanenciaMinutos
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error al registrar salida:', error);
    return res.status(500).json({
      success: false,
      message: 'Error en el servidor al registrar la salida del vehículo',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  getMovimientos,
  getMovimientoActivoPorPlaca,
  registrarEntrada,
  registrarSalida
};
