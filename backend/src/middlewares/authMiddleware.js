const jwt = require('jsonwebtoken');

// Middleware para verificar token JWT
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Acceso no autorizado: No se proporcionó token de sesión'
    });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({
        success: false,
        message: 'Error de configuración de seguridad en el servidor'
      });
    }

    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Token de sesión inválido o expirado'
    });
  }
};

// Middleware para verificar rol Administrador
const verifyAdmin = (req, res, next) => {
  if (!req.user || req.user.rol !== 'Administrador') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado: Se requieren permisos de Administrador'
    });
  }
  next();
};

module.exports = {
  verifyToken,
  verifyAdmin
};
