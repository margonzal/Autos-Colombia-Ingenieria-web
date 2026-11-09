const pool = require('../config/db');

// Obtener todas las métricas del panel principal
const getDashboardData = async (req, res) => {
  try {
    // 1. Vehículos actualmente en parqueadero (movimientos abiertos)
    const [activosRows] = await pool.query(
      'SELECT COUNT(*) AS total FROM Movimiento WHERE estado = "Abierto"'
    );

    // 2. Entradas registradas durante el día
    const [entradasHoyRows] = await pool.query(
      'SELECT COUNT(*) AS total FROM Movimiento WHERE DATE(fechaHoraEntrada) = CURDATE()'
    );

    // 3. Salidas registradas durante el día
    const [salidasHoyRows] = await pool.query(
      'SELECT COUNT(*) AS total FROM Movimiento WHERE DATE(fechaHoraSalida) = CURDATE() AND estado = "Cerrado"'
    );

    // 4. Conteo de celdas según estado
    const [celdasRows] = await pool.query(`
      SELECT
        SUM(CASE WHEN estado = 'Disponible' THEN 1 ELSE 0 END) AS celdas_disponibles,
        SUM(CASE WHEN estado = 'Ocupada' THEN 1 ELSE 0 END) AS celdas_ocupadas,
        SUM(CASE WHEN estado = 'Inactiva' THEN 1 ELSE 0 END) AS celdas_inactivas,
        COUNT(*) AS total_celdas
      FROM Celdas
    `);

    // 5. Total de vehículos registrados activos en el sistema
    const [vehiculosRows] = await pool.query('SELECT COUNT(*) AS total FROM Vehiculo WHERE estado = "Activo"');

    // 6. Movimientos recientes (últimos 6)
    const [recientesRows] = await pool.query(`
      SELECT
        m.idMovimiento AS id,
        m.idMovimiento,
        m.fechaHoraEntrada AS fecha_hora_entrada,
        m.fechaHoraEntrada,
        m.fechaHoraSalida AS fecha_hora_salida,
        m.fechaHoraSalida,
        m.estado,
        v.placa,
        v.marca,
        v.modelo,
        c.codigo AS celda_codigo,
        c.codigo
      FROM Movimiento m
      JOIN Vehiculo v ON m.Vehiculo_idVehiculo = v.idVehiculo
      JOIN Celdas c ON m.Celdas_idCelda = c.idCelda
      ORDER BY m.idMovimiento DESC
      LIMIT 6
    `);

    return res.json({
      success: true,
      data: {
        metricas: {
          vehiculos_actualmente: activosRows[0].total || 0,
          entradas_hoy: entradasHoyRows[0].total || 0,
          salidas_hoy: salidasHoyRows[0].total || 0,
          celdas_disponibles: Number(celdasRows[0].celdas_disponibles || 0),
          celdas_ocupadas: Number(celdasRows[0].celdas_ocupadas || 0),
          celdas_inactivas: Number(celdasRows[0].celdas_inactivas || 0),
          total_celdas: Number(celdasRows[0].total_celdas || 0),
          total_vehiculos: vehiculosRows[0].total || 0
        },
        movimientos_recientes: recientesRows
      }
    });
  } catch (error) {
    console.error('Error al obtener datos del dashboard:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al consultar métricas del dashboard',
      error: error.message
    });
  }
};

module.exports = {
  getDashboardData
};
