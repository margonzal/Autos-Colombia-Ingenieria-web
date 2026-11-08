const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.post('/login', authController.login);
router.get('/perfil', verifyToken, authController.getPerfil);

module.exports = router;
