const express = require('express');
const router = express.Router();
const celdaController = require('../controllers/celdaController');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');

router.use(verifyToken);

// Consultas permitidas tanto para Administrador como Operador
router.get('/', celdaController.getCeldas);
router.get('/disponibles', celdaController.getCeldasDisponibles);

// Modificaciones exclusivas del Administrador
router.post('/', verifyAdmin, celdaController.createCelda);
router.put('/:id', verifyAdmin, celdaController.updateCelda);
router.patch('/:id/toggle-estado', verifyAdmin, celdaController.toggleEstadoCelda);

module.exports = router;
