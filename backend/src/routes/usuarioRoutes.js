const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { verifyToken, verifyAdmin } = require('../middlewares/authMiddleware');

// Todas las rutas de usuarios requieren autenticación y rol Administrador
router.use(verifyToken, verifyAdmin);

router.get('/', usuarioController.getUsuarios);
router.get('/:id', usuarioController.getUsuarioById);
router.post('/', usuarioController.createUsuario);
router.put('/:id', usuarioController.updateUsuario);
router.patch('/:id/toggle-estado', usuarioController.toggleEstadoUsuario);

module.exports = router;
