import React, { useState, useEffect } from 'react';
import { vehiculoService, celdaService, movimientoService } from '../services/api';

export default function Entradas() {
  const [placaInput, setPlacaInput] = useState('');
  const [vehiculo, setVehiculo] = useState(null);
  const [celdasDisponibles, setCeldasDisponibles] = useState([]);
  const [selectedCeldaId, setSelectedCeldaId] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  // Cargar celdas disponibles
  const loadCeldas = async () => {
    try {
      const res = await celdaService.getDisponibles();
      if (res.success) {
        setCeldasDisponibles(res.data);
        if (res.data.length > 0) {
          setSelectedCeldaId(res.data[0].id);
        }
      }
    } catch (err) {
      console.error('Error al cargar celdas disponibles:', err);
    }
  };

  useEffect(() => {
    loadCeldas();
  }, []);

  const handleBuscarVehiculo = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('');
    setVehiculo(null);

    if (!placaInput.trim()) {
      setError('Ingrese una placa para buscar');
      return;
    }

    try {
      setLoadingSearch(true);
      const res = await vehiculoService.getByPlaca(placaInput.trim());
      if (res.success) {
        setVehiculo(res.data);
        if (res.data.movimiento_activo_id) {
          setError(`⚠️ Este vehículo YA tiene un movimiento abierto en la celda ${res.data.celda_codigo}. No puede registrar otra entrada.`);
        }
      }
    } catch (err) {
      setError(err.message || 'Vehículo no encontrado. Verifique la placa o regístrelo en el módulo de vehículos.');
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleRegistrarEntrada = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('');

    if (!vehiculo) {
      setError('Primero busque y verifique el vehículo');
      return;
    }

    if (vehiculo.movimiento_activo_id) {
      setError('El vehículo ya se encuentra dentro del parqueadero.');
      return;
    }

    if (!selectedCeldaId) {
      setError('Debe seleccionar una celda disponible');
      return;
    }

    try {
      setLoadingSubmit(true);
      const res = await movimientoService.registrarEntrada({
        placa: vehiculo.placa,
        celda_id: selectedCeldaId,
        observaciones_entrada: observaciones
      });

      if (res.success) {
        setMensaje(`🎉 ${res.message}`);
        setVehiculo(null);
        setPlacaInput('');
        setObservaciones('');
        loadCeldas(); // Actualizar celdas disponibles
      }
    } catch (err) {
      setError(err.message || 'Error al registrar entrada');
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      {mensaje && <div className="alert alert-success">{mensaje}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="panel-card">
        <h3 className="panel-title">🔍 1. Buscar Vehículo para Ingreso</h3>
        <form onSubmit={handleBuscarVehiculo} style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            type="text"
            placeholder="Ingrese placa (Ej: ABC123)"
            value={placaInput}
            onChange={(e) => setPlacaInput(e.target.value.toUpperCase())}
            style={{ fontSize: '1.1rem', fontWeight: 'bold', textTransform: 'uppercase', flex: 1 }}
          />
          <button type="submit" className="btn btn-primary" disabled={loadingSearch}>
            {loadingSearch ? 'Buscando...' : 'Buscar Placa'}
          </button>
        </form>
      </div>

      {vehiculo && (
        <div className="panel-card">
          <h3 className="panel-title">🚗 2. Datos del Vehículo</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>PLACA</span>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1e40af' }}>{vehiculo.placa}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>MARCA / MODELO</span>
              <div style={{ fontWeight: '600' }}>{vehiculo.marca} {vehiculo.modelo}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>COLOR</span>
              <div>{vehiculo.color}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>ESTADO SISTEMA</span>
              <div>
                <span className={`badge ${vehiculo.estado === 'Activo' ? 'badge-activo' : 'badge-inactivo'}`}>
                  {vehiculo.estado}
                </span>
              </div>
            </div>
          </div>

          {!vehiculo.movimiento_activo_id && (
            <form onSubmit={handleRegistrarEntrada}>
              <h3 className="panel-title" style={{ marginTop: '1.5rem' }}>🅿️ 3. Asignación de Celda y Confirmación</h3>
              
              <div className="form-group">
                <label className="form-label">Seleccionar Celda Disponible *</label>
                {celdasDisponibles.length > 0 ? (
                  <select
                    value={selectedCeldaId}
                    onChange={(e) => setSelectedCeldaId(e.target.value)}
                    required
                  >
                    {celdasDisponibles.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.codigo} — {c.ubicacion}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="alert alert-error" style={{ margin: 0 }}>
                    ⚠️ No hay celdas disponibles en este momento en el parqueadero.
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Observaciones de Entrada (Opcional)</label>
                <textarea
                  rows="2"
                  placeholder="Rayones previos, estado de las llantas o notas del operador..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                />
              </div>

              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  className="btn btn-success"
                  style={{ padding: '0.75rem 1.75rem', fontSize: '1rem' }}
                  disabled={loadingSubmit || celdasDisponibles.length === 0}
                >
                  {loadingSubmit ? 'Registrando...' : '✅ Confirmar y Registrar Entrada'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
