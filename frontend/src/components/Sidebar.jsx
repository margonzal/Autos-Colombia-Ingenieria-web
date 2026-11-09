import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { user, isAdmin, logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Inicio', icon: '📊', minRole: 'Operador' },
    { id: 'entradas', label: 'Registro de Entrada', icon: '📥', minRole: 'Operador' },
    { id: 'salidas', label: 'Registro de Salida', icon: '📤', minRole: 'Operador' },
    { id: 'vehiculos', label: 'Gestión de Vehículos', icon: '🚗', minRole: 'Operador' },
    { id: 'celdas', label: 'Gestión de Celdas', icon: '🅿️', badge: '', minRole: 'Operador' },
    { id: 'historial', label: 'Historial', icon: '⏱️', minRole: 'Operador' },
    { id: 'novedades', label: 'Novedades', icon: '📝', minRole: 'Operador' },
    { id: 'usuarios', label: 'Gestión de Usuarios', icon: '👥', badge: '', minRole: 'Administrador' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">AC</div>
        <div>
          <div className="sidebar-brand-title">Autos Colombia</div>
          <div className="sidebar-brand-sub">Sistema de Parqueadero</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">Operaciones Principales</div>
        {menuItems.map((item) => {
          if (item.minRole === 'Administrador' && !isAdmin) return null;

          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && (
                <span
                  style={{
                    fontSize: '0.65rem',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : '#1e293b',
                    color: isActive ? '#ffffff' : '#93c5fd'
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="nav-section-title" style={{ marginTop: '1rem' }}>Futuras Ampliaciones</div>
        <div
          className="nav-item"
          style={{ opacity: 0.5, cursor: 'not-allowed' }}
          title="Módulo preparado para desarrollarse en la siguiente iteración"
        >
          <span className="nav-icon">💳</span>
          <span style={{ flex: 1 }}>Módulo de Pagos</span>
          <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#334155' }}>
            Próximamente
          </span>
        </div>
      </nav>

      <div className="sidebar-footer">
        <button
          onClick={logout}
          className="btn btn-secondary"
          style={{ width: '100%', justifyContent: 'center', backgroundColor: '#1e293b', color: '#f8fafc' }}
        >
          🚪 Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
