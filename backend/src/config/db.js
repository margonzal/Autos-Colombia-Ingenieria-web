const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
  database: process.env.DB_NAME || 'mydb',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 6033,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '-05:00', // Zona horaria Colombia (UTC-5)
  dateStrings: true   // Preservar fechas como cadenas para evitar desfasajes horarios UTC
});

// Verificación asíncrona de conexión sin bloquear la inicialización de la API
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log(`✅ Conexión exitosa a la base de datos MySQL [${process.env.DB_NAME || 'mydb'}]`);
    connection.release();
  } catch (error) {
    console.warn('\n⚠️ [Aviso de Conexión MySQL]: No se pudo conectar con la base de datos en este momento.');
    if (error.code === 'ECONNREFUSED') {
      console.warn('   Motivo: Servidor MySQL apagado o puerto inaccesible.');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.warn(`   Motivo: La base de datos '${process.env.DB_NAME || 'mydb'}' no existe aún en el servidor MySQL.`);
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.warn('   Motivo: Usuario o contraseña de MySQL incorrectos en backend/.env.');
    } else {
      console.warn('   Detalle del error:', error.message);
    }
    console.warn('   👉 El backend continuará activo para consultas de salud (/api/health).\n');
  }
})();

module.exports = pool;
