import React, { useState, useEffect } from 'react';
import { vehiculoService } from '../services/api';
import Modal from '../components/Modal';

export default function Vehiculos() {
  const [vehiculos, setVehiculos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  // Estado del Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    placa: '',
    marca: '',
    modelo: '',
    color: '',
    tipo: 'Automóvil',
    estado: 'Activo'
  });

  const fetchVehiculos = async () => {
    try {
      setLoading(true);
      const res = await vehiculoService.getAll(busqueda);
      if (res.success) {
        setVehiculos(res.data);
      }
    } catch (err) {
      setError(err.message || 'Error al cargar vehículos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehiculos();
  }, [busqueda]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm({
      placa: '',
      marca: '',
      modelo: '',
      color: '',
      tipo: 'Automóvil',
      estado: 'Activo'
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v) => {
    setEditingId(v.id);
    setForm({
      placa: v.placa,
      marca: v.marca,
      modelo: v.modelo,
      color: v.color,
      tipo: v.tipo || 'Automóvil',
      estado: v.estado
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await vehiculoService.update(editingId, form);
        setMensaje('Vehículo actualizado correctamente');
      } else {
        await vehiculoService.create(form);
        setMensaje('Vehículo registrado exitosamente');
      }
      setIsModalOpen(false);
      fetchVehiculos();
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
            placeholder="Buscar por placa, marca o modelo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          ➕ Registrar Vehículo
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Placa</th>
              <th>Marca y Modelo</th>
              <th>Color</th>
              <th>Tipo</th>
              <th>Estado Sistema</th>
              <th>Estado en Parqueadero</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Cargando vehículos...</td>
              </tr>
            ) : vehiculos.length > 0 ? (
              vehiculos.map((v) => (
                <tr key={v.id}>
                  <td>
                    <span style={{ fontWeight: '800', fontSize: '1rem', color: '#1e40af' }}>{v.placa}</span>
                  </td>
                  <td>
                    <strong>{v.marca}</strong> {v.modelo}
                  </td>
                  <td>{v.color}</td>
                  <td>{v.tipo}</td>
                  <td>
                    <span className={`badge ${v.estado === 'Activo' ? 'badge-activo' : 'badge-inactivo'}`}>
                      {v.estado}
                    </span>
                  </td>
                  <td>
                    {v.movimiento_activo_id ? (
                      <span className="badge badge-ocupada">
                        🅿️ En Celda: {v.celda_codigo}
                      </span>
                    ) : (
                      <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}>
                        Fuera
                      </span>
                    )}
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleOpenEdit(v)}>
                      ✏️ Editar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  No se encontraron vehículos registrados con ese criterio.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Registro / Edición */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Editar Información del Vehículo' : 'Registrar Nuevo Vehículo'}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" form="form-vehiculo" className="btn btn-primary">
              {editingId ? 'Guardar Cambios' : 'Registrar Vehículo'}
            </button>
          </>
        }
      >
        {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
        <form id="form-vehiculo" onSubmit={handleSave}>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Marca *</label>
              <input
                type="text"
                placeholder="Ej: Mazda, Renault, Chevrolet"
                value={form.marca}
                onChange={(e) => setForm({ ...form, marca: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Modelo / Año *</label>
              <input
                type="text"
                placeholder="Ej: 3 Touring 2021"
                value={form.modelo}
                onChange={(e) => setForm({ ...form, modelo: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Color *</label>
              <input
                type="text"
                placeholder="Ej: Rojo, Blanco, Gris"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tipo de Vehículo</label>
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                <option value="Automóvil">Automóvil</option>
                <option value="Camioneta">Camioneta</option>
                <option value="Motocicleta">Motocicleta</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Estado en Sistema</label>
            <select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}
