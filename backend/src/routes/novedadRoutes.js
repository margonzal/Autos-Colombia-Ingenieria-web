const express = require('express');
const router = express.Router();
const novedadController = require('../controllers/novedadController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.get('/', novedadController.getNovedades);
router.post('/', novedadController.createNovedad);

module.exports = router;
