const express = require('express');
const router = express.Router();
const vehiculoController = require('../controllers/vehiculoController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.get('/', vehiculoController.getVehiculos);
router.get('/placa/:placa', vehiculoController.getVehiculoByPlaca);
router.post('/', vehiculoController.createVehiculo);
router.put('/:id', vehiculoController.updateVehiculo);

module.exports = router;
