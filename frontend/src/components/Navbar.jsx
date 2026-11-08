import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ title }) {
  const { user, logout } = useAuth();

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <header className="topbar">
      <div>
        <h1 className="topbar-title">{title}</h1>
      </div>

      <div className="topbar-user">
        <div className="user-badge">
          <div className="user-details">
            <div className="user-name">{user?.nombre_completo || 'Usuario del Sistema'}</div>
            <div className="user-role">
              <span className={`badge ${user?.rol === 'Administrador' ? 'badge-admin' : 'badge-operador'}`}>
                {user?.rol || 'Operador'}
              </span>
            </div>
          </div>
          <div className="user-avatar">{getInitials(user?.nombre_completo)}</div>
        </div>

        <button
          onClick={logout}
          className="btn btn-secondary btn-sm"
          title="Cerrar sesión"
          style={{ marginLeft: '0.5rem' }}
        >
          Salir
        </button>
      </div>
    </header>
  );
}
