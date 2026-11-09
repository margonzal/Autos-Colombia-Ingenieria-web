const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Cargar variables de entorno desde backend/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

/**
 * Script de inicialización de la base de datos MySQL para Autos Colombia.
 * ADVERTENCIA: Este script solo debe ejecutarse en entornos nuevos o de prueba.
 * NO ejecutar si ya dispone de tablas existentes con datos previos que desea conservar.
 */
async function initDatabase() {
  console.log('===========================================================');
  console.log('🔄 Inicialización de Base de Datos - Autos Colombia');
  console.log('⚠️ AVISO: Asegúrese de no sobreescribir datos existentes.');
  console.log('===========================================================');

  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const port = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306;

  let connection;
  try {
    // 1. Establecer conexión inicial al servidor MySQL
    connection = await mysql.createConnection({
      host,
      user,
      password,
      port,
      multipleStatements: true
    });

    console.log(`✅ Conexión establecida con MySQL en ${host}:${port} como '${user}'.`);

    // 2. Ejecutar esquema DDL
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
      await connection.query(schemaSql);
      console.log('✅ Esquema DDL procesado correctamente (schema.sql).');
    } else {
      console.warn('⚠️ No se encontró el archivo schema.sql en:', schemaPath);
    }

    // 3. Ejecutar datos semilla (seed)
    const seedPath = path.join(__dirname, 'seed.sql');
    if (fs.existsSync(seedPath)) {
      const seedSql = fs.readFileSync(seedPath, 'utf-8');
      await connection.query(seedSql);
      console.log('✅ Datos semilla procesados correctamente (seed.sql).');
    } else {
      console.warn('⚠️ No se encontró el archivo seed.sql en:', seedPath);
    }

    console.log('\n🎉 Base de datos configurada exitosamente.');
  } catch (error) {
    console.error('\n❌ Error durante la inicialización de la base de datos:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('👉 Verifique que el servicio de MySQL (XAMPP / WAMP / nativo) esté en ejecución.');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('👉 Verifique el usuario y contraseña de MySQL en el archivo backend/.env.');
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Exportar función y ejecutar solo si es llamada directamente
if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase;
