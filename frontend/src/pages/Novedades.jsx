import React, { useState, useEffect } from 'react';
import { novedadService } from '../services/api';
import Modal from '../components/Modal';

export default function Novedades() {
  const [novedades, setNovedades] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  // Modal de creación
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    placa: '',
    descripcion: '',
    estado: 'Registrada'
  });

  const fetchNovedades = async () => {
    try {
      setLoading(true);
      const res = await novedadService.getAll(busqueda);
      if (res.success) {
        setNovedades(res.data);
      }
    } catch (err) {
      setError(err.message || 'Error al cargar novedades');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNovedades();
  }, [busqueda]);

  const handleOpenCreate = () => {
    setForm({ placa: '', descripcion: '', estado: 'Registrada' });
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await novedadService.create(form);
      setMensaje('Novedad registrada exitosamente');
      setIsModalOpen(false);
      fetchNovedades();
      setTimeout(() => setMensaje(''), 4000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCambiarEstado = async (id, nuevoEstado) => {
    try {
      await novedadService.updateEstado(id, nuevoEstado);
      setMensaje(`Estado de la novedad #${id} actualizado a "${nuevoEstado}"`);
      fetchNovedades();
      setTimeout(() => setMensaje(''), 4000);
    } catch (err) {
      setError(err.message || 'Error al actualizar el estado de la novedad');
      setTimeout(() => setError(''), 4000);
    }
  };

  const getBadgeClass = (estado) => {
    switch (estado) {
      case 'Resuelta':
        return 'badge-success';
      case 'En Revisión':
        return 'badge-warning';
      default:
        return 'badge-admin';
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
            placeholder="Buscar por placa, texto de novedad o usuario..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          ➕ Registrar Novedad
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Placa</th>
              <th>Vehículo</th>
              <th>Descripción de la Novedad</th>
              <th>Estado</th>
              <th>Registrado Por</th>
              <th>Fecha y Hora</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>Cargando novedades...</td>
              </tr>
            ) : novedades.length > 0 ? (
              novedades.map((n) => (
                <tr key={n.id || n.idNovedad}>
                  <td><strong>#{n.id || n.idNovedad}</strong></td>
                  <td>
                    <span style={{ fontWeight: '800', color: '#1e40af' }}>{n.placa}</span>
                  </td>
                  <td>{n.marca} {n.modelo} ({n.color})</td>
                  <td style={{ maxWidth: '300px', whiteSpace: 'pre-wrap' }}>{n.descripcion}</td>
                  <td>
                    <span className={`badge ${getBadgeClass(n.estado)}`}>
                      {n.estado || 'Registrada'}
                    </span>
                  </td>
                  <td>
                    <div>{n.usuario_nombre}</div>
                    <small style={{ color: '#64748b' }}>({n.usuario_rol})</small>
                  </td>
                  <td>{n.fecha_hora ? new Date(n.fecha_hora).toLocaleString('es-CO') : '-'}</td>
                  <td>
                    <select
                      className="form-control"
                      style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', borderRadius: '4px' }}
                      value={n.estado || 'Registrada'}
                      onChange={(e) => handleCambiarEstado(n.id || n.idNovedad, e.target.value)}
                    >
                      <option value="Registrada">Registrada</option>
                      <option value="En Revisión">En Revisión</option>
                      <option value="Resuelta">Resuelta</option>
                    </select>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  No se han registrado novedades en el sistema.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal para Registrar Novedad */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar Nueva Novedad sobre Vehículo"
      >
        {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Placa del Vehículo *</label>
            <input
              type="text"
              placeholder="Ej: ABC123"
              style={{ textTransform: 'uppercase', fontWeight: 'bold' }}
              value={form.placa}
              onChange={(e) => setForm({ ...form, placa: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Descripción Detallada *</label>
            <textarea
              rows="4"
              placeholder="Describa el incidente, golpe, rayón o detalle del vehículo..."
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Estado Inicial</label>
            <select
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value })}
            >
              <option value="Registrada">Registrada</option>
              <option value="En Revisión">En Revisión</option>
              <option value="Resuelta">Resuelta</option>
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Guardar Novedad
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
