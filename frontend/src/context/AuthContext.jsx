import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('usuario_autos_colombia');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token_autos_colombia'));
  const [loading, setLoading] = useState(false);

  const login = async (correo, password) => {
    setLoading(true);
    try {
      const res = await authService.login(correo, password);
      if (res.success) {
        localStorage.setItem('token_autos_colombia', res.token);
        localStorage.setItem('usuario_autos_colombia', JSON.stringify(res.usuario));
        setToken(res.token);
        setUser(res.usuario);
        return { success: true };
      }
      return { success: false, message: res.message };
    } catch (error) {
      return { success: false, message: error.message || 'Error de conexión' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token_autos_colombia');
    localStorage.removeItem('usuario_autos_colombia');
    setToken(null);
    setUser(null);
  };

  const isAdmin = user && user.rol === 'Administrador';

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, isAdmin, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}
