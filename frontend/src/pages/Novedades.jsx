import React, { useState, useEffect } from 'react';
import { novedadService } from '../services/api';
import Modal from '../components/Modal';

export default function Novedades() {
  const [novedades, setNovedades] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    placa: '',
    descripcion: ''
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
    setForm({ placa: '', descripcion: '' });
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
              <th>Registrado Por</th>
              <th>Fecha y Hora</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Cargando novedades...</td>
              </tr>
            ) : novedades.length > 0 ? (
              novedades.map((n) => (
                <tr key={n.id}>
                  <td><strong>#{n.id}</strong></td>
                  <td>
                    <span style={{ fontWeight: '800', color: '#1e40af' }}>{n.placa}</span>
                  </td>
                  <td>{n.marca} {n.modelo} ({n.color})</td>
                  <td style={{ maxWidth: '350px', whiteSpace: 'pre-wrap' }}>
                    {n.descripcion}
                  </td>
                  <td>
                    <div>{n.usuario_nombre}</div>
                    <span className="badge badge-operador" style={{ fontSize: '0.65rem' }}>{n.usuario_rol}</span>
                  </td>
                  <td>{new Date(n.fecha_hora).toLocaleString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  No hay novedades registradas hasta el momento.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Nueva Novedad */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar Nueva Novedad de Vehículo"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" form="form-novedad" className="btn btn-primary">
              Guardar Novedad
            </button>
          </>
        }
      >
        {error && <div className="alert alert-error">{error}</div>}
        <form id="form-novedad" onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Placa del Vehículo *</label>
            <input
              type="text"
              placeholder="Ej: ABC123"
              style={{ textTransform: 'uppercase', fontWeight: 'bold' }}
              value={form.placa}
              onChange={(e) => setForm({ ...form, placa: e.target.value.toUpperCase() })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Descripción Detallada de la Novedad *</label>
            <textarea
              rows="4"
              placeholder="Escriba los detalles de la novedad (golpe en puerta derecha, espejo fisurado, olvido de luces, etc.)..."
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
