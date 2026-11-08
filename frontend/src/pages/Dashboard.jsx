import React, { useEffect, useState } from 'react';
import { dashboardService } from '../services/api';
import MetricCard from '../components/MetricCard';

export default function Dashboard({ setActiveTab }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await dashboardService.getData();
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      setError('No se pudo conectar con el servidor backend o la base de datos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando panel de control...</div>;
  }

  const m = data?.metricas || {
    vehiculos_actualmente: 0,
    entradas_hoy: 0,
    salidas_hoy: 0,
    celdas_disponibles: 0,
    celdas_ocupadas: 0,
    total_celdas: 0
  };

  return (
    <div>
      {error && (
        <div className="alert alert-error">
          <span>⚠️ {error}</span>
          <button className="btn btn-sm btn-secondary" onClick={fetchDashboard} style={{ marginLeft: 'auto' }}>
            Reintentar
          </button>
        </div>
      )}

      {/* Grid de Métricas Principales */}
      <div className="metrics-grid">
        <MetricCard
          title="Vehículos en Parqueadero"
          value={m.vehiculos_actualmente}
          icon="🚗"
          color="#1d4ed8"
          bg="#eff6ff"
          subtitle="Con ingreso activo"
        />
        <MetricCard
          title="Entradas de Hoy"
          value={m.entradas_hoy}
          icon="📥"
          color="#059669"
          bg="#ecfdf5"
          subtitle="Registros del día"
        />
        <MetricCard
          title="Salidas de Hoy"
          value={m.salidas_hoy}
          icon="📤"
          color="#d97706"
          bg="#fffbeb"
          subtitle="Vehículos despachados"
        />
        <MetricCard
          title="Celdas Disponibles"
          value={m.celdas_disponibles}
          icon="🅿️"
          color="#0284c7"
          bg="#e0f2fe"
          subtitle={`De ${m.total_celdas} celdas en total`}
        />
        <MetricCard
          title="Celdas Ocupadas"
          value={m.celdas_ocupadas}
          icon="🔒"
          color="#dc2626"
          bg="#fef2f2"
          subtitle="Lugares en uso"
        />
      </div>

      {/* Accesos Rápidos */}
      <div className="panel-card">
        <h3 className="panel-title">⚡ Acciones Rápidas del Operador</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => setActiveTab('entradas')}>
            📥 Registrar Entrada de Vehículo
          </button>
          <button className="btn btn-secondary" onClick={() => setActiveTab('salidas')}>
            📤 Registrar Salida de Vehículo
          </button>
          <button className="btn btn-secondary" onClick={() => setActiveTab('vehiculos')}>
            🚗 Consultar / Registrar Vehículos
          </button>
          <button className="btn btn-secondary" onClick={() => setActiveTab('celdas')}>
            🅿️ Ver Mapa de Celdas
          </button>
        </div>
      </div>

      {/* Tabla de Movimientos Recientes */}
      <div className="panel-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 className="panel-title" style={{ margin: 0 }}>⏱️ Movimientos Recientes en el Parqueadero</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('historial')}>
            Ver Todo el Historial →
          </button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>N° Mov.</th>
                <th>Placa</th>
                <th>Vehículo</th>
                <th>Celda</th>
                <th>Fecha / Hora Entrada</th>
                <th>Fecha / Hora Salida</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {data?.movimientos_recientes && data.movimientos_recientes.length > 0 ? (
                data.movimientos_recientes.map((mov) => (
                  <tr key={mov.id}>
                    <td><strong>#{mov.id}</strong></td>
                    <td>
                      <span style={{ fontWeight: '700', color: '#1e40af' }}>{mov.placa}</span>
                    </td>
                    <td>{mov.marca} {mov.modelo}</td>
                    <td>
                      <span className="badge" style={{ backgroundColor: '#e2e8f0', color: '#1e293b' }}>
                        {mov.celda_codigo}
                      </span>
                    </td>
                    <td>{new Date(mov.fecha_hora_entrada).toLocaleString()}</td>
                    <td>
                      {mov.fecha_hora_salida
                        ? new Date(mov.fecha_hora_salida).toLocaleString()
                        : <span style={{ color: '#94a3b8' }}>En permanencia</span>}
                    </td>
                    <td>
                      <span className={`badge ${mov.estado === 'Abierto' ? 'badge-abierto' : 'badge-cerrado'}`}>
                        {mov.estado}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                    No se han registrado movimientos recientes aún.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
