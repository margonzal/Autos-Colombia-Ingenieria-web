const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Iniciar sesión
const login = async (req, res) => {
  const { correo, email, password } = req.body;
  const targetEmail = (correo || email || '').trim().toLowerCase();

  if (!targetEmail || !password) {
    return res.status(400).json({
      success: false,
      message: 'Por favor ingrese correo electrónico y contraseña'
    });
  }

  try {
    const [rows] = await pool.query(
      'SELECT idUsuario, nombre, email, password, rol, estado FROM Usuario WHERE email = ?',
      [targetEmail]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas (usuario no encontrado)'
      });
    }

    const usuario = rows[0];

    if (usuario.estado !== 'Activo') {
      return res.status(403).json({
        success: false,
        message: 'El usuario se encuentra inactivo. Comuníquese con el administrador.'
      });
    }

    // Verificar contraseña con bcrypt
    const passwordValido = await bcrypt.compare(password, usuario.password);

    if (!passwordValido) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas (contraseña incorrecta)'
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('ERROR CRÍTICO: JWT_SECRET no está definido en las variables de entorno.');
      return res.status(500).json({
        success: false,
        message: 'Error de configuración de seguridad en el servidor'
      });
    }

    // Generar Token JWT (duración: 12 horas)
    const token = jwt.sign(
      {
        id: usuario.idUsuario,
        idUsuario: usuario.idUsuario,
        nombre: usuario.nombre,
        nombre_completo: usuario.nombre,
        email: usuario.email,
        correo: usuario.email,
        rol: usuario.rol
      },
      jwtSecret,
      { expiresIn: '12h' }
    );

    return res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      token,
      usuario: {
        id: usuario.idUsuario,
        idUsuario: usuario.idUsuario,
        nombre: usuario.nombre,
        nombre_completo: usuario.nombre,
        email: usuario.email,
        correo: usuario.email,
        rol: usuario.rol
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al procesar el inicio de sesión',
      error: error.message
    });
  }
};

// Obtener perfil del usuario autenticado
const getPerfil = async (req, res) => {
  try {
    const userId = req.user.idUsuario || req.user.id;
    const [rows] = await pool.query(
      'SELECT idUsuario, idUsuario AS id, nombre, nombre AS nombre_completo, email, email AS correo, rol, estado FROM Usuario WHERE idUsuario = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    return res.json({
      success: true,
      usuario: rows[0]
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al consultar perfil de usuario',
      error: error.message
    });
  }
};

module.exports = {
  login,
  getPerfil
};
