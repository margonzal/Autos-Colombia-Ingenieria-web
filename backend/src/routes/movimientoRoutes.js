const express = require('express');
const router = express.Router();
const movimientoController = require('../controllers/movimientoController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.get('/', movimientoController.getMovimientos);
router.get('/activo/:placa', movimientoController.getMovimientoActivoPorPlaca);
router.post('/entrada', movimientoController.registrarEntrada);
router.post('/salida', movimientoController.registrarSalida);

module.exports = router;
