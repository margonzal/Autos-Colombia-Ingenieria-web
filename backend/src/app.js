const express = require('express');
const cors = require('cors');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const vehiculoRoutes = require('./routes/vehiculoRoutes');
const celdaRoutes = require('./routes/celdaRoutes');
const movimientoRoutes = require('./routes/movimientoRoutes');
const novedadRoutes = require('./routes/novedadRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// Ruta de estado de la API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    sistema: 'Autos Colombia - Sistema de Gestión de Parqueadero',
    iteracion: 'Iteración 2',
    timestamp: new Date()
  });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/vehiculos', vehiculoRoutes);
app.use('/api/celdas', celdaRoutes);
app.use('/api/movimientos', movimientoRoutes);
app.use('/api/novedades', novedadRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Manejo de ruta 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta ${req.originalUrl} no encontrada en el servidor`
  });
});

// Manejador global de errores
app.use((err, req, res, next) => {
  console.error('Error no controlado en la aplicación:', err);
  res.status(500).json({
    success: false,
    message: 'Ocurrió un error inesperado en el servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = app;
