const app = require('./src/app');
const dotenv = require('dotenv');

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚗 Servidor Autos Colombia - Backend Iteración 2`);
  console.log(`📡 Ejecutándose en: http://localhost:${PORT}`);
  console.log(`🩺 Endpoint de estado: http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});
