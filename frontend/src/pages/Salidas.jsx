import React, { useState } from 'react';
import { movimientoService } from '../services/api';

export default function Salidas() {
  const [placaInput, setPlacaInput] = useState('');
  const [movimiento, setMovimiento] = useState(null);
  const [observaciones, setObservaciones] = useState('');
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const handleBuscarMovimiento = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('');
    setMovimiento(null);

    if (!placaInput.trim()) {
      setError('Ingrese una placa para buscar el vehículo');
      return;
    }

    try {
      setLoadingSearch(true);
      const res = await movimientoService.getActivoPorPlaca(placaInput.trim());
      if (res.success) {
        setMovimiento(res.data);
      }
    } catch (err) {
      setError(err.message || 'No se encontró un movimiento abierto para este vehículo.');
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleRegistrarSalida = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('');

    if (!movimiento) {
      setError('No hay ningún movimiento seleccionado');
      return;
    }

    try {
      setLoadingSubmit(true);
      const res = await movimientoService.registrarSalida({
        movimiento_id: movimiento.id,
        observaciones_salida: observaciones
      });

      if (res.success) {
        setMensaje(`🎉 ${res.message}`);
        setMovimiento(null);
        setPlacaInput('');
        setObservaciones('');
      }
    } catch (err) {
      setError(err.message || 'Error al registrar la salida');
    } finally {
      setLoadingSubmit(false);
    }
  };

  const formatearMinutos = (min) => {
    if (!min && min !== 0) return '0 min';
    const horas = Math.floor(min / 60);
    const m = min % 60;
    if (horas > 0) {
      return `${horas} h ${m} min (${min} minutos)`;
    }
    return `${min} minutos`;
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      {mensaje && <div className="alert alert-success">{mensaje}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="panel-card">
        <h3 className="panel-title">🔍 1. Buscar Vehículo con Movimiento Abierto</h3>
        <form onSubmit={handleBuscarMovimiento} style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            type="text"
            placeholder="Ingrese placa (Ej: ABC123)"
            value={placaInput}
            onChange={(e) => setPlacaInput(e.target.value.toUpperCase())}
            style={{ fontSize: '1.1rem', fontWeight: 'bold', textTransform: 'uppercase', flex: 1 }}
          />
          <button type="submit" className="btn btn-primary" disabled={loadingSearch}>
            {loadingSearch ? 'Buscando...' : 'Buscar Movimiento'}
          </button>
        </form>
      </div>

      {movimiento && (
        <div className="panel-card">
          <h3 className="panel-title">⏱️ 2. Resumen de Permanencia y Celda</h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem', background: '#f8fafc', padding: '1.25rem', borderRadius: '8px' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>PLACA</span>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#1e40af' }}>{movimiento.placa}</div>
              <div style={{ fontSize: '0.85rem', color: '#475569' }}>{movimiento.marca} {movimiento.modelo}</div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>CELDA ASIGNADA</span>
              <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#047857' }}>
                🅿️ {movimiento.celda_codigo}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{movimiento.celda_ubicacion}</div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>HORA DE ENTRADA</span>
              <div style={{ fontWeight: '600' }}>
                {new Date(movimiento.fecha_hora_entrada).toLocaleString()}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Operador: {movimiento.usuario_entrada}</div>
            </div>

            <div style={{ background: '#ecfdf5', padding: '0.75rem', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
              <span style={{ fontSize: '0.75rem', color: '#065f46', fontWeight: '700' }}>TIEMPO TRANSCURRIDO</span>
              <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#047857', marginTop: '4px' }}>
                {formatearMinutos(movimiento.minutos_transcurridos)}
              </div>
            </div>
          </div>

          <form onSubmit={handleRegistrarSalida}>
            <div className="form-group">
              <label className="form-label">Observaciones de Salida (Opcional)</label>
              <textarea
                rows="2"
                placeholder="Novedad al momento del retiro del vehículo..."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
              />
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setMovimiento(null)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-danger"
                style={{ padding: '0.75rem 1.75rem', fontSize: '1rem', fontWeight: '600' }}
                disabled={loadingSubmit}
              >
                {loadingSubmit ? 'Procesando...' : '📤 Confirmar Salida y Liberar Celda'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
