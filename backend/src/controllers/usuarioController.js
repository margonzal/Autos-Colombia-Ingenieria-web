const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// Listar todos los usuarios
const getUsuarios = async (req, res) => {
  try {
    const { rol, estado, busqueda } = req.query;
    let sql = `
      SELECT
        idUsuario,
        idUsuario AS id,
        nombre,
        nombre AS nombre_completo,
        email,
        email AS correo,
        rol,
        estado
      FROM Usuario
      WHERE 1=1
    `;
    const params = [];

    if (rol) {
      sql += ' AND rol = ?';
      params.push(rol);
    }

    if (estado) {
      sql += ' AND estado = ?';
      params.push(estado);
    }

    if (busqueda) {
      sql += ' AND (nombre LIKE ? OR email LIKE ?)';
      params.push(`%${busqueda}%`, `%${busqueda}%`);
    }

    sql += ' ORDER BY idUsuario DESC';

    const [usuarios] = await pool.query(sql, params);
    return res.json({ success: true, data: usuarios });
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    return res.status(500).json({ success: false, message: 'Error en el servidor al obtener usuarios', error: error.message });
  }
};

// Obtener un usuario por ID
const getUsuarioById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      'SELECT idUsuario, idUsuario AS id, nombre, nombre AS nombre_completo, email, email AS correo, rol, estado FROM Usuario WHERE idUsuario = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    return res.json({ success: true, data: rows[0] });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al consultar usuario', error: error.message });
  }
};

// Crear nuevo usuario interno
const createUsuario = async (req, res) => {
  const { nombre, nombre_completo, email, correo, password, rol, estado } = req.body;
  const targetNombre = (nombre || nombre_completo || '').trim();
  const targetEmail = (email || correo || '').trim().toLowerCase();

  if (!targetNombre || !targetEmail || !password || !rol) {
    return res.status(400).json({
      success: false,
      message: 'Todos los campos obligatorios deben ser proporcionados (nombre, correo, contraseña, rol)'
    });
  }

  if (!['Administrador', 'Operador'].includes(rol)) {
    return res.status(400).json({ success: false, message: 'Rol inválido. Debe ser Administrador u Operador.' });
  }

  try {
    // Validar si el correo ya existe
    const [existentes] = await pool.query('SELECT idUsuario FROM Usuario WHERE email = ?', [targetEmail]);
    if (existentes.length > 0) {
      return res.status(409).json({ success: false, message: 'Ya existe un usuario registrado con este correo electrónico' });
    }

    // Hashear contraseña con bcrypt (10 rounds)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const estadoFinal = estado && ['Activo', 'Inactivo'].includes(estado) ? estado : 'Activo';

    const [result] = await pool.query(
      'INSERT INTO Usuario (nombre, email, password, rol, estado) VALUES (?, ?, ?, ?, ?)',
      [targetNombre, targetEmail, passwordHash, rol, estadoFinal]
    );

    return res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        id: result.insertId,
        idUsuario: result.insertId,
        nombre: targetNombre,
        nombre_completo: targetNombre,
        email: targetEmail,
        correo: targetEmail,
        rol,
        estado: estadoFinal
      }
    });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    return res.status(500).json({ success: false, message: 'Error interno al registrar usuario', error: error.message });
  }
};

// Actualizar usuario
const updateUsuario = async (req, res) => {
  const { id } = req.params;
  const { nombre, nombre_completo, email, correo, password, rol, estado } = req.body;
  const targetNombre = nombre || nombre_completo;
  const targetEmail = email || correo;

  try {
    // Verificar existencia
    const [existentes] = await pool.query('SELECT idUsuario FROM Usuario WHERE idUsuario = ?', [id]);
    if (existentes.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    // Validar duplicado de email con otro usuario
    if (targetEmail) {
      const [duplicados] = await pool.query(
        'SELECT idUsuario FROM Usuario WHERE email = ? AND idUsuario != ?',
        [targetEmail.trim().toLowerCase(), id]
      );
      if (duplicados.length > 0) {
        return res.status(409).json({ success: false, message: 'El correo electrónico ya pertenece a otro usuario' });
      }
    }

    let sql = 'UPDATE Usuario SET nombre = COALESCE(?, nombre), email = COALESCE(?, email), rol = COALESCE(?, rol), estado = COALESCE(?, estado)';
    const params = [
      targetNombre ? targetNombre.trim() : null,
      targetEmail ? targetEmail.trim().toLowerCase() : null,
      rol || null,
      estado || null
    ];

    // Si se envió una nueva contraseña, se encripta
    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password.trim(), salt);
      sql += ', password = ?';
      params.push(passwordHash);
    }

    sql += ' WHERE idUsuario = ?';
    params.push(id);

    await pool.query(sql, params);

    return res.json({
      success: true,
      message: 'Usuario actualizado correctamente'
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    return res.status(500).json({ success: false, message: 'Error interno al actualizar usuario', error: error.message });
  }
};

// Activar o desactivar usuario
const toggleEstadoUsuario = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query('SELECT idUsuario, estado, rol FROM Usuario WHERE idUsuario = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const currentUserId = req.user ? (req.user.idUsuario || req.user.id) : null;
    // Evitar que el usuario actual se desactive a sí mismo si es el único admin
    if (currentUserId && currentUserId === parseInt(id) && rows[0].estado === 'Activo') {
      return res.status(400).json({ success: false, message: 'No puedes desactivar tu propia cuenta activa' });
    }

    const nuevoEstado = rows[0].estado === 'Activo' ? 'Inactivo' : 'Activo';

    await pool.query('UPDATE Usuario SET estado = ? WHERE idUsuario = ?', [nuevoEstado, id]);

    return res.json({
      success: true,
      message: `Usuario ${nuevoEstado === 'Activo' ? 'activado' : 'desactivado'} exitosamente`,
      nuevoEstado
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al cambiar estado de usuario', error: error.message });
  }
};

module.exports = {
  getUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  toggleEstadoUsuario
};
