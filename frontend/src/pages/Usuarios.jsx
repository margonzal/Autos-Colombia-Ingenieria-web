import React, { useState, useEffect } from 'react';
import { usuarioService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function Usuarios() {
  const { user: currentUser } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    nombre_completo: '',
    correo: '',
    password: '',
    rol: 'Operador',
    estado: 'Activo'
  });

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const res = await usuarioService.getAll(busqueda, filtroRol, filtroEstado);
      if (res.success) {
        setUsuarios(res.data);
      }
    } catch (err) {
      setError(err.message || 'Error al cargar lista de usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, [busqueda, filtroRol, filtroEstado]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm({
      nombre_completo: '',
      correo: '',
      password: '',
      rol: 'Operador',
      estado: 'Activo'
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u) => {
    setEditingId(u.id);
    setForm({
      nombre_completo: u.nombre_completo,
      correo: u.correo,
      password: '', // Opcional al editar
      rol: u.rol,
      estado: u.estado
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleToggleEstado = async (u) => {
    if (u.id === currentUser?.id) {
      alert('No puedes desactivar tu propia cuenta activa de administrador');
      return;
    }

    try {
      const res = await usuarioService.toggleEstado(u.id);
      if (res.success) {
        setMensaje(res.message);
        fetchUsuarios();
        setTimeout(() => setMensaje(''), 4000);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await usuarioService.update(editingId, form);
        setMensaje('Usuario actualizado correctamente');
      } else {
        if (!form.password) {
          setError('Debe especificar una contraseña para el nuevo usuario');
          return;
        }
        await usuarioService.create(form);
        setMensaje('Usuario creado exitosamente');
      }
      setIsModalOpen(false);
      fetchUsuarios();
      setTimeout(() => setMensaje(''), 4000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      {mensaje && <div className="alert alert-success">✅ {mensaje}</div>}
      {error && !isModalOpen && <div className="alert alert-error">❌ {error}</div>}

      <div className="toolbar">
        <div className="toolbar-search">
          <input
            type="text"
            placeholder="Buscar por nombre o correo electrónico..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <select
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value)}
            style={{ maxWidth: '160px' }}
          >
            <option value="">Todos los roles</option>
            <option value="Administrador">Administrador</option>
            <option value="Operador">Operador</option>
          </select>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            style={{ maxWidth: '160px' }}
          >
            <option value="">Todos los estados</option>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </div>

        <button className="btn btn-primary" onClick={handleOpenCreate}>
          ➕ Nuevo Usuario Interno
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre Completo</th>
              <th>Correo Electrónico</th>
              <th>Rol Asignado</th>
              <th>Estado</th>
              <th>Fecha de Creación</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Cargando usuarios...</td>
              </tr>
            ) : usuarios.length > 0 ? (
              usuarios.map((u) => (
                <tr key={u.id}>
                  <td><strong>#{u.id}</strong></td>
                  <td>
                    <div style={{ fontWeight: '600', color: '#0f172a' }}>{u.nombre_completo}</div>
                    {u.id === currentUser?.id && (
                      <span style={{ fontSize: '0.7rem', color: '#2563eb', fontWeight: 'bold' }}>(Tu cuenta)</span>
                    )}
                  </td>
                  <td>{u.correo}</td>
                  <td>
                    <span className={`badge ${u.rol === 'Administrador' ? 'badge-admin' : 'badge-operador'}`}>
                      {u.rol === 'Administrador' ? '👑 Administrador' : '🧑‍💼 Operador'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.estado === 'Activo' ? 'badge-activo' : 'badge-inactivo'}`}>
                      {u.estado}
                    </span>
                  </td>
                  <td>{new Date(u.creado_en).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleOpenEdit(u)}>
                        ✏️ Editar
                      </button>
                      {u.id !== currentUser?.id && (
                        <button
                          className={`btn btn-sm ${u.estado === 'Inactivo' ? 'btn-success' : 'btn-danger'}`}
                          onClick={() => handleToggleEstado(u)}
                        >
                          {u.estado === 'Inactivo' ? 'Activar' : 'Desactivar'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  No se encontraron usuarios con los criterios indicados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Crear / Editar Usuario */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Editar Usuario Interno' : 'Registrar Nuevo Usuario del Sistema'}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" form="form-usuario" className="btn btn-primary">
              {editingId ? 'Guardar Cambios' : 'Registrar Usuario'}
            </button>
          </>
        }
      >
        {error && <div className="alert alert-error">{error}</div>}
        <form id="form-usuario" onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Nombre Completo *</label>
            <input
              type="text"
              placeholder="Ej: Laura Sofía Gómez"
              value={form.nombre_completo}
              onChange={(e) => setForm({ ...form, nombre_completo: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Correo Electrónico (Para Iniciar Sesión) *</label>
            <input
              type="email"
              placeholder="usuario@autoscolombia.com"
              value={form.correo}
              onChange={(e) => setForm({ ...form, correo: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Contraseña {editingId ? '(Dejar en blanco para mantener la actual)' : '*'}
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required={!editingId}
            />
            <small style={{ color: '#64748b', display: 'block', marginTop: '3px' }}>
              🔒 Se almacenará con cifrado unidireccional seguro (Bcrypt).
            </small>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Rol del Usuario *</label>
              <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
                <option value="Operador">Operador (Registro E/S, Novedades, Consultas)</option>
                <option value="Administrador">Administrador (Acceso total, Usuarios, Celdas)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Estado de la Cuenta</label>
              <select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
