const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Cliente HTTP para comunicarse con el Backend de Autos Colombia
 */
export async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token_autos_colombia');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      // Manejar error 401 (token expirado)
      if (response.status === 401 && !endpoint.includes('/auth/login')) {
        localStorage.removeItem('token_autos_colombia');
        localStorage.removeItem('usuario_autos_colombia');
        window.location.reload();
      }
      throw new Error(data.message || 'Error en la petición');
    }

    return data;
  } catch (error) {
    console.error(`Error en API (${endpoint}):`, error);
    throw error;
  }
}

// Servicios de Autenticación
export const authService = {
  login: (correo, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ correo, password })
    }),
  getPerfil: () => request('/auth/perfil')
};

// Servicios de Dashboard
export const dashboardService = {
  getData: () => request('/dashboard')
};

// Servicios de Vehículos
export const vehiculoService = {
  getAll: (busqueda = '') => request(`/vehiculos?busqueda=${encodeURIComponent(busqueda)}`),
  getByPlaca: (placa) => request(`/vehiculos/placa/${encodeURIComponent(placa)}`),
  create: (data) => request('/vehiculos', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/vehiculos/${id}`, { method: 'PUT', body: JSON.stringify(data) })
};

// Servicios de Celdas (Iteración 2)
export const celdaService = {
  getAll: (busqueda = '', estado = '') => {
    const params = new URLSearchParams();
    if (busqueda) params.append('busqueda', busqueda);
    if (estado) params.append('estado', estado);
    return request(`/celdas?${params.toString()}`);
  },
  getDisponibles: () => request('/celdas/disponibles'),
  create: (data) => request('/celdas', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/celdas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggleEstado: (id) => request(`/celdas/${id}/toggle-estado`, { method: 'PATCH' })
};

// Servicios de Movimientos (Entradas, Salidas e Historial)
export const movimientoService = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.busqueda) params.append('busqueda', filters.busqueda);
    if (filters.estado) params.append('estado', filters.estado);
    if (filters.fecha_desde) params.append('fecha_desde', filters.fecha_desde);
    if (filters.fecha_hasta) params.append('fecha_hasta', filters.fecha_hasta);
    return request(`/movimientos?${params.toString()}`);
  },
  getActivoPorPlaca: (placa) => request(`/movimientos/activo/${encodeURIComponent(placa)}`),
  registrarEntrada: (data) => request('/movimientos/entrada', { method: 'POST', body: JSON.stringify(data) }),
  registrarSalida: (data) => request('/movimientos/salida', { method: 'POST', body: JSON.stringify(data) })
};

// Servicios de Novedades
export const novedadService = {
  getAll: (busqueda = '') => request(`/novedades?busqueda=${encodeURIComponent(busqueda)}`),
  create: (data) => request('/novedades', { method: 'POST', body: JSON.stringify(data) }),
  updateEstado: (id, estado) => request(`/novedades/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) })
};

// Servicios de Usuarios (Iteración 2)
export const usuarioService = {
  getAll: (busqueda = '', rol = '', estado = '') => {
    const params = new URLSearchParams();
    if (busqueda) params.append('busqueda', busqueda);
    if (rol) params.append('rol', rol);
    if (estado) params.append('estado', estado);
    return request(`/usuarios?${params.toString()}`);
  },
  getById: (id) => request(`/usuarios/${id}`),
  create: (data) => request('/usuarios', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggleEstado: (id) => request(`/usuarios/${id}/toggle-estado`, { method: 'PATCH' })
};
