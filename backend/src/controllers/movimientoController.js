const pool = require('../config/db');

// Listar historial de movimientos con filtros
const getMovimientos = async (req, res) => {
  try {
    const { busqueda, estado, fecha_desde, fecha_hasta } = req.query;

    let sql = `
      SELECT
        m.idMovimiento AS id,
        m.idMovimiento,
        m.fechaHoraEntrada AS fecha_hora_entrada,
        m.fechaHoraEntrada,
        m.fechaHoraSalida AS fecha_hora_salida,
        m.fechaHoraSalida,
        m.tiempoPermanenciaMinutos AS tiempo_permanencia_minutos,
        m.tiempoPermanenciaMinutos,
        m.estado,
        m.observacionesEntrada AS observaciones_entrada,
        m.observacionesSalida AS observaciones_salida,
        v.idVehiculo AS vehiculo_id,
        v.idVehiculo,
        v.placa,
        v.marca,
        v.modelo,
        v.color,
        c.idCelda AS celda_id,
        c.idCelda,
        c.numeroCelda AS celda_codigo,
        c.numeroCelda,
        c.ubicacion AS celda_ubicacion,
        ue.nombre AS usuario_entrada,
        us.nombre AS usuario_salida
      FROM Movimiento m
      JOIN Vehiculo v ON m.Vehiculo_idVehiculo = v.idVehiculo
      JOIN Celdas c ON m.Celdas_idCelda = c.idCelda
      JOIN Usuario ue ON m.idUsuarioEntrada = ue.idUsuario
      LEFT JOIN Usuario us ON m.idUsuarioSalida = us.idUsuario
      WHERE 1=1
    `;
    const params = [];

    if (estado) {
      sql += ' AND m.estado = ?';
      params.push(estado);
    }

    if (busqueda) {
      sql += ' AND (v.placa LIKE ? OR c.numeroCelda LIKE ? OR v.marca LIKE ?)';
      params.push(`%${busqueda}%`, `%${busqueda}%`, `%${busqueda}%`);
    }

    if (fecha_desde) {
      sql += ' AND DATE(m.fechaHoraEntrada) >= ?';
      params.push(fecha_desde);
    }

    if (fecha_hasta) {
      sql += ' AND DATE(m.fechaHoraEntrada) <= ?';
      params.push(fecha_hasta);
    }

    sql += ' ORDER BY m.idMovimiento DESC';

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
        m.idMovimiento AS id,
        m.idMovimiento,
        m.fechaHoraEntrada AS fecha_hora_entrada,
        m.fechaHoraEntrada,
        m.observacionesEntrada AS observaciones_entrada,
        m.estado,
        TIMESTAMPDIFF(MINUTE, m.fechaHoraEntrada, NOW()) AS minutos_transcurridos,
        v.idVehiculo AS vehiculo_id,
        v.idVehiculo,
        v.placa,
        v.marca,
        v.modelo,
        v.color,
        c.idCelda AS celda_id,
        c.idCelda,
        c.numeroCelda AS celda_codigo,
        c.numeroCelda,
        c.ubicacion AS celda_ubicacion,
        u.nombre AS usuario_entrada
      FROM Movimiento m
      JOIN Vehiculo v ON m.Vehiculo_idVehiculo = v.idVehiculo
      JOIN Celdas c ON m.Celdas_idCelda = c.idCelda
      JOIN Usuario u ON m.idUsuarioEntrada = u.idUsuario
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
  const usuario_entrada_id = req.user ? (req.user.idUsuario || req.user.id) : 1;

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
      'SELECT idVehiculo, placa, marca, modelo, estado FROM Vehiculo WHERE UPPER(placa) = ?',
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
      'SELECT idMovimiento, Celdas_idCelda FROM Movimiento WHERE Vehiculo_idVehiculo = ? AND estado = "Abierto"',
      [vehiculo.idVehiculo]
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
      'SELECT idCelda, numeroCelda, estado FROM Celdas WHERE idCelda = ? FOR UPDATE',
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
        message: `La celda ${celda.numeroCelda} ya se encuentra ocupada por otro vehículo.`
      });
    }

    if (celda.estado === 'Inactiva') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `La celda ${celda.numeroCelda} está inactiva y no puede ser asignada.`
      });
    }

    // 4. Crear el registro de movimiento
    const fechaHoraEntrada = new Date();
    const [insertResult] = await connection.query(
      `INSERT INTO Movimiento
        (Vehiculo_idVehiculo, Celdas_idCelda, idUsuarioEntrada, fechaHoraEntrada, estado, observacionesEntrada)
       VALUES (?, ?, ?, ?, 'Abierto', ?)`,
      [vehiculo.idVehiculo, celda.idCelda, usuario_entrada_id, fechaHoraEntrada, observaciones_entrada || null]
    );

    // 5. Actualizar el estado de la celda a Ocupada
    await connection.query('UPDATE Celdas SET estado = "Ocupada" WHERE idCelda = ?', [celda.idCelda]);

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: `Entrada registrada con éxito para el vehículo ${placaNormalizada} en la celda ${celda.numeroCelda}`,
      data: {
        movimiento_id: insertResult.insertId,
        idMovimiento: insertResult.insertId,
        id: insertResult.insertId,
        vehiculo_placa: placaNormalizada,
        celda_codigo: celda.numeroCelda,
        numeroCelda: celda.numeroCelda,
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
  const usuario_salida_id = req.user ? (req.user.idUsuario || req.user.id) : 1;

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
      `SELECT m.*, v.placa, c.idCelda, c.numeroCelda
       FROM Movimiento m
       JOIN Vehiculo v ON m.Vehiculo_idVehiculo = v.idVehiculo
       JOIN Celdas c ON m.Celdas_idCelda = c.idCelda
       WHERE m.idMovimiento = ? FOR UPDATE`,
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
    const fechaEntrada = new Date(mov.fechaHoraEntrada);
    const diffMs = fechaHoraSalida - fechaEntrada;
    const tiempoPermanenciaMinutos = Math.max(1, Math.round(diffMs / (1000 * 60)));

    // 3. Actualizar movimiento a Cerrado
    await connection.query(
      `UPDATE Movimiento SET
        idUsuarioSalida = ?,
        fechaHoraSalida = ?,
        tiempoPermanenciaMinutos = ?,
        estado = 'Cerrado',
        observacionesSalida = ?
       WHERE idMovimiento = ?`,
      [usuario_salida_id, fechaHoraSalida, tiempoPermanenciaMinutos, observaciones_salida || null, mov.idMovimiento]
    );

    // 4. Liberar la celda a Disponible
    await connection.query('UPDATE Celdas SET estado = "Disponible" WHERE idCelda = ?', [mov.Celdas_idCelda]);

    await connection.commit();

    return res.json({
      success: true,
      message: `Salida registrada exitosamente. Tiempo de permanencia: ${tiempoPermanenciaMinutos} minutos.`,
      data: {
        movimiento_id: mov.idMovimiento,
        idMovimiento: mov.idMovimiento,
        id: mov.idMovimiento,
        placa: mov.placa,
        celda: mov.numeroCelda,
        numeroCelda: mov.numeroCelda,
        celda_codigo: mov.numeroCelda,
        fecha_hora_entrada: mov.fechaHoraEntrada,
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
