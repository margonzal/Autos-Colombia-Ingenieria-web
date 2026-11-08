import React, { useState, useEffect } from 'react';
import { movimientoService } from '../services/api';

export default function Historial() {
  const [movimientos, setMovimientos] = useState([]);
  const [filters, setFilters] = useState({
    busqueda: '',
    estado: '',
    fecha_desde: '',
    fecha_hasta: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchHistorial = async () => {
    try {
      setLoading(true);
      const res = await movimientoService.getAll(filters);
      if (res.success) {
        setMovimientos(res.data);
      }
    } catch (err) {
      setError(err.message || 'Error al cargar historial');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistorial();
  }, [filters]);

  const handleClearFilters = () => {
    setFilters({
      busqueda: '',
      estado: '',
      fecha_desde: '',
      fecha_hasta: ''
    });
  };

  return (
    <div>
      {error && <div className="alert alert-error">❌ {error}</div>}

      <div className="panel-card" style={{ marginBottom: '1.25rem' }}>
        <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: '#475569' }}>Filtros de Búsqueda</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
          <div>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Buscar por Placa o Celda</label>
            <input
              type="text"
              placeholder="Ej: ABC123 o C-101"
              value={filters.busqueda}
              onChange={(e) => setFilters({ ...filters, busqueda: e.target.value })}
            />
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Estado del Movimiento</label>
            <select
              value={filters.estado}
              onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
            >
              <option value="">Todos los estados</option>
              <option value="Abierto">Abierto (En parqueadero)</option>
              <option value="Cerrado">Cerrado (Finalizado)</option>
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Fecha Desde</label>
            <input
              type="date"
              value={filters.fecha_desde}
              onChange={(e) => setFilters({ ...filters, fecha_desde: e.target.value })}
            />
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Fecha Hasta</label>
            <input
              type="date"
              value={filters.fecha_hasta}
              onChange={(e) => setFilters({ ...filters, fecha_hasta: e.target.value })}
            />
          </div>
        </div>

        <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary btn-sm" onClick={handleClearFilters}>
            Limpiar Filtros
          </button>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>N° Mov.</th>
              <th>Placa</th>
              <th>Vehículo</th>
              <th>Celda</th>
              <th>Fecha y Hora Entrada</th>
              <th>Fecha y Hora Salida</th>
              <th>Permanencia</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>Cargando registros...</td>
              </tr>
            ) : movimientos.length > 0 ? (
              movimientos.map((m) => (
                <tr key={m.id}>
                  <td><strong>#{m.id}</strong></td>
                  <td>
                    <span style={{ fontWeight: '800', color: '#1e40af' }}>{m.placa}</span>
                  </td>
                  <td>
                    <div>{m.marca} {m.modelo}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{m.color}</div>
                  </td>
                  <td>
                    <span className="badge" style={{ backgroundColor: '#e2e8f0', color: '#1e293b' }}>
                      {m.celda_codigo}
                    </span>
                  </td>
                  <td>
                    <div>{new Date(m.fecha_hora_entrada).toLocaleString()}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Por: {m.usuario_entrada}</div>
                  </td>
                  <td>
                    {m.fecha_hora_salida ? (
                      <>
                        <div>{new Date(m.fecha_hora_salida).toLocaleString()}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Por: {m.usuario_salida || 'Sistema'}</div>
                      </>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>En permanencia</span>
                    )}
                  </td>
                  <td>
                    {m.tiempo_permanencia_minutos ? (
                      `${m.tiempo_permanencia_minutos} min`
                    ) : (
                      <span style={{ color: '#94a3b8' }}>-</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${m.estado === 'Abierto' ? 'badge-abierto' : 'badge-cerrado'}`}>
                      {m.estado}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  No se encontraron movimientos registrados con los filtros aplicados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
