import React, { useState, useEffect } from 'react';
import { celdaService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function Celdas() {
  const { isAdmin } = useAuth();
  const [celdas, setCeldas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [vista, setVista] = useState('mapa'); // 'mapa' o 'tabla'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    codigo: '',
    ubicacion: '',
    estado: 'Disponible'
  });

  const fetchCeldas = async () => {
    try {
      setLoading(true);
      const res = await celdaService.getAll(busqueda, filtroEstado);
      if (res.success) {
        setCeldas(res.data);
      }
    } catch (err) {
      setError(err.message || 'Error al cargar celdas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCeldas();
  }, [busqueda, filtroEstado]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm({ codigo: '', ubicacion: '', estado: 'Disponible' });
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditingId(c.id);
    setForm({ codigo: c.codigo, ubicacion: c.ubicacion, estado: c.estado });
    setError('');
    setIsModalOpen(true);
  };

  const handleToggleEstado = async (c) => {
    if (c.estado === 'Ocupada') {
      alert('No se puede cambiar el estado de una celda que está actualmente ocupada');
      return;
    }

    try {
      const res = await celdaService.toggleEstado(c.id);
      if (res.success) {
        setMensaje(res.message);
        fetchCeldas();
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
        await celdaService.update(editingId, form);
        setMensaje('Celda actualizada exitosamente');
      } else {
        await celdaService.create(form);
        setMensaje('Celda creada exitosamente');
      }
      setIsModalOpen(false);
      fetchCeldas();
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
            placeholder="Buscar por código, ubicación o placa ocupante..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            style={{ maxWidth: '170px' }}
          >
            <option value="">Todos los estados</option>
            <option value="Disponible">Disponible</option>
            <option value="Ocupada">Ocupada</option>
            <option value="Inactiva">Inactiva</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div style={{ display: 'inline-flex', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
            <button
              className={`btn btn-sm ${vista === 'mapa' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setVista('mapa')}
              style={{ borderRadius: 0 }}
            >
              🗺️ Vista Gráfica
            </button>
            <button
              className={`btn btn-sm ${vista === 'tabla' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setVista('tabla')}
              style={{ borderRadius: 0 }}
            >
              📋 Vista Tabla
            </button>
          </div>

          {isAdmin && (
            <button className="btn btn-primary" onClick={handleOpenCreate}>
              ➕ Nueva Celda
            </button>
          )}
        </div>
      </div>

      {/* VISTA MAPA DE CELDAS */}
      {vista === 'mapa' && (
        <div className="panel-card">
          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem', fontSize: '0.825rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: '#86efac' }}></span>
              Disponible
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: '#93c5fd' }}></span>
              Ocupada
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: '#cbd5e1' }}></span>
              Inactiva
            </span>
          </div>

          <div className="celdas-map">
            {celdas.map((c) => (
              <div
                key={c.id}
                className={`celda-box ${c.estado.toLowerCase()}`}
                onClick={() => isAdmin && handleOpenEdit(c)}
                title={isAdmin ? 'Haz clic para editar esta celda' : ''}
              >
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{c.ubicacion}</div>
                <div className="celda-code">{c.codigo}</div>

                {c.estado === 'Ocupada' && c.vehiculo_placa ? (
                  <div>
                    <span className="celda-plate">{c.vehiculo_placa}</span>
                    <div style={{ fontSize: '0.7rem', color: '#1e40af', marginTop: '3px' }}>
                      {c.vehiculo_marca} {c.vehiculo_modelo}
                    </div>
                  </div>
                ) : (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', fontWeight: '600' }}>
                    {c.estado}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VISTA TABLA DE CELDAS */}
      {vista === 'tabla' && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Ubicación / Descripción</th>
                <th>Estado</th>
                <th>Vehículo Ocupante</th>
                <th>Hora Ingreso</th>
                {isAdmin && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} style={{ textAlign: 'center', padding: '2rem' }}>Cargando celdas...</td>
                </tr>
              ) : celdas.length > 0 ? (
                celdas.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <strong style={{ fontSize: '1rem', color: '#1e3a8a' }}>{c.codigo}</strong>
                    </td>
                    <td>{c.ubicacion}</td>
                    <td>
                      <span className={`badge badge-${c.estado.toLowerCase()}`}>
                        {c.estado}
                      </span>
                    </td>
                    <td>
                      {c.vehiculo_placa ? (
                        <div>
                          <span style={{ fontWeight: '700', color: '#1e40af' }}>{c.vehiculo_placa}</span>
                          <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '6px' }}>
                            ({c.vehiculo_marca} {c.vehiculo_modelo})
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>- Ninguno -</span>
                      )}
                    </td>
                    <td>
                      {c.fecha_hora_entrada ? (
                        new Date(c.fecha_hora_entrada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      ) : (
                        <span style={{ color: '#94a3b8' }}>-</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleOpenEdit(c)}>
                            ✏️ Editar
                          </button>
                          {c.estado !== 'Ocupada' && (
                            <button
                              className={`btn btn-sm ${c.estado === 'Inactiva' ? 'btn-success' : 'btn-danger'}`}
                              onClick={() => handleToggleEstado(c)}
                            >
                              {c.estado === 'Inactiva' ? 'Activar' : 'Inactivar'}
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    No se encontraron celdas con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Crear / Editar Celda */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? `Editar Celda ${form.codigo}` : 'Registrar Nueva Celda de Parqueadero'}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" form="form-celda" className="btn btn-primary">
              {editingId ? 'Guardar Cambios' : 'Registrar Celda'}
            </button>
          </>
        }
      >
        {error && <div className="alert alert-error">{error}</div>}
        <form id="form-celda" onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Código o Número de Celda *</label>
            <input
              type="text"
              placeholder="Ej: C-101, B-205"
              style={{ textTransform: 'uppercase', fontWeight: 'bold' }}
              value={form.codigo}
              onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Ubicación o Descripción *</label>
            <input
              type="text"
              placeholder="Ej: Piso 1 - Sector Norte, Sótano 1"
              value={form.ubicacion}
              onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Estado de la Celda</label>
            <select
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value })}
              disabled={form.estado === 'Ocupada'}
            >
              <option value="Disponible">Disponible</option>
              <option value="Inactiva">Inactiva</option>
              {form.estado === 'Ocupada' && <option value="Ocupada">Ocupada</option>}
            </select>
            {form.estado === 'Ocupada' && (
              <small style={{ color: '#64748b', display: 'block', marginTop: '4px' }}>
                * La celda está ocupada. Se liberará automáticamente al registrar la salida del vehículo.
              </small>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
}
