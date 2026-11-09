import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, loading } = useAuth();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!correo || !password) {
      setError('Por favor complete todos los campos');
      return;
    }

    const res = await login(correo, password);
    if (!res.success) {
      setError(res.message || 'Error al iniciar sesión');
    }
  };

  const handleDemoFill = (email, pass) => {
    setCorreo(email);
    setPassword(pass);
    setError('');
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo">🚗</div>
          <h2 className="login-title">Autos Colombia</h2>
          <p className="login-subtitle">Sistema Administrativo del Parqueadero</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Correo Electrónico</label>
            <input
              type="email"
              placeholder="ejemplo@autoscolombia.com"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', fontWeight: '600' }}
            disabled={loading}
          >
            {loading ? 'Accediendo...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid #e2e8f0' }}>
          <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.75rem', textAlign: 'center' }}>
            <strong>Cuentas de prueba para desarrollo:</strong>
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ flex: 1, fontSize: '0.75rem' }}
              onClick={() => handleDemoFill('admin@autoscolombia.com', 'admin123')}
            >
              👑 Administrador
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ flex: 1, fontSize: '0.75rem' }}
              onClick={() => handleDemoFill('operador@autoscolombia.com', 'admin123')}
            >
              🧑‍💼 Operador
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
