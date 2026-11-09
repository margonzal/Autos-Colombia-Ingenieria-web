# Autos Colombia - Sistema Administrativo de Parqueadero (Iteración 2)

Sistema web para la administración y control operativo del parqueadero **Autos Colombia**

---

## 🛠️ 1. Tecnologías Utilizadas

- **Frontend:** React 18, Vite 5, CSS3 modular (diseño limpio y responsivo con paleta institucional en azul oscuro, azul claro, blanco y gris).
- **Backend:** Node.js (v18+), Express 4 (arquitectura modular por capas: Controladores, Rutas, Middlewares y Configuración).
- **Base de Datos:** MySQL (con pool de conexiones `mysql2/promise`).
- **Seguridad y Autenticación:** Tokens JWT (JSON Web Tokens) y cifrado unidireccional de contraseñas con `bcryptjs` (sin alternativas en texto plano).

---

## 📁 2. Estructura del Proyecto

```text
Iteracion 2/
├── .gitignore                         # Exclusiones de Git (node_modules, .env, temporales)
├── README.md                          # Documentación e instrucciones del proyecto
├── Desarrollo del sistema web - Auto.txt # Requisitos y especificaciones de la entrega
│
├── backend/                           # Servidor API REST en Node.js y Express
│   ├── .env                           # Variables de entorno locales (ignorado por Git)
│   ├── .env.example                   # Plantilla de variables de entorno sin secretos
│   ├── package.json                   # Dependencias y scripts del backend
│   ├── server.js                      # Punto de entrada y arranque del servidor HTTP
│   │
│   ├── database/                      # Scripts de base de datos
│   │   ├── schema.sql                 # Estructura DDL (tablas, relaciones y restricciones)
│   │   ├── seed.sql                   # Datos de prueba con hash Bcrypt oficial
│   │   └── initDb.js                  # Script automatizado de inicialización
│   │
│   └── src/                           # Código fuente del backend
│       ├── app.js                     # Configuración de Express, CORS y middleware
│       ├── config/
│       │   └── db.js                  # Conexión y Pool de MySQL con manejo de errores
│       ├── controllers/               # Controladores de la lógica de negocio
│       │   ├── authController.js      # Inicio de sesión seguro y perfil
│       │   ├── celdaController.js     # [Iteración 2] Gestión y disponibilidad de celdas
│       │   ├── dashboardController.js # Métricas del panel principal
│       │   ├── movimientoController.js# Registro de entradas, salidas y permanencia
│       │   ├── novedadController.js   # Registro de incidentes de vehículos
│       │   ├── usuarioController.js   # [Iteración 2] Gestión de personal interno
│       │   └── vehiculoController.js  # Administración del parque automotor
│       ├── middlewares/
│       │   └── authMiddleware.js      # Verificación de JWT y control estricto de roles
│       └── routes/                    # Enrutadores REST de la API
│
└── frontend/                          # Interfaz de usuario SPA en React
    ├── index.html                     # HTML principal con fuentes y metadatos
    ├── package.json                   # Dependencias y scripts del frontend
    ├── vite.config.js                 # Configuración de Vite (puerto 3000)
    │
    └── src/
        ├── main.jsx                   # Punto de montaje de React
        ├── App.jsx                    # Enrutamiento interno y control de vistas
        ├── App.css                    # Estilos del sistema administrativo y modales
        ├── index.css                  # Variables CSS globales, tipografía y tablas
        ├── components/                # Componentes reutilizables
        │   ├── Sidebar.jsx            # Menú de navegación lateral con control de roles
        │   ├── Navbar.jsx             # Barra superior con estado del usuario
        │   ├── MetricCard.jsx         # Tarjetas de indicadores para el dashboard
        │   └── Modal.jsx              # Ventana modal para formularios
        ├── context/
        │   └── AuthContext.jsx        # Contexto global de autenticación y permisos
        ├── pages/                     # Módulos y vistas principales
        │   ├── Dashboard.jsx          # Panel principal con indicadores y accesos
        │   ├── Entradas.jsx           # Búsqueda por placa y asignación de celda
        │   ├── Salidas.jsx            # Búsqueda de movimiento y liberación de celda
        │   ├── Vehiculos.jsx          # Registro y consulta de vehículos
        │   ├── Celdas.jsx             # [Iteración 2] Mapa gráfico y tabla de celdas
        │   ├── Historial.jsx          # Consulta y filtros de movimientos
        │   ├── Novedades.jsx          # Registro de novedades e incidencias
        │   ├── Usuarios.jsx           # [Iteración 2] Gestión de usuarios y roles
        │   └── Login.jsx              # Pantalla de inicio de sesión
        └── services/
            └── api.js                 # Cliente HTTP con inyección automática de JWT
```

## 🔑 3. Credenciales de Prueba Verificadas

Para ingresar al sistema administrativo se han verificado los siguientes usuarios de prueba:

| Rol | Correo Electrónico | Contraseña Verificada | Permisos del Rol |
|---|---|---|---|
| **Administrador** | `admin@autoscolombia.com` | `Itereishon2` | Control total: Gestión de Usuarios, Gestión de Celdas y todas las operaciones |

## 📋 4. Módulos Implementados

### Módulos de Operación Diaria (Iteración 1)
- **Inicio (Dashboard):** Tarjetas de métricas en tiempo real (vehículos dentro, entradas del día, salidas del día, celdas disponibles y celdas ocupadas) y tabla de movimientos recientes.
- **Gestión de Vehículos:** Registro de vehículos (placa, marca, modelo, color, tipo), consulta por placa y estado actual en parqueadero.
- **Registro de Entrada:** Búsqueda rápida por placa, validación contra movimientos abiertos previos y asignación a una celda disponible.
- **Registro de Salida:** Localización del movimiento abierto, cálculo automático del tiempo de permanencia en minutos y liberación inmediata de la celda a estado `Disponible`.
- **Historial:** Bitácora completa de movimientos con filtros por placa, estado (`Abierto`/`Cerrado`) y rango de fechas.
- **Novedades:** Registro de observaciones e incidencias de los vehículos con fecha, hora y operador responsable.

### Módulos Administrativos (Iteración 2)
- **Gestión de Celdas:**
  - Código único, ubicación y estado (`Disponible`, `Ocupada`, `Inactiva`).
  - **Vista en Mapa Gráfico interactivo** con identificación visual del vehículo ocupante por placa.
  - **Vista en Tabla** con opciones de edición y activación/inactivación (exclusivas del Administrador).
  - Al registrar una entrada, la celda cambia automáticamente a `Ocupada`; al registrar salida, pasa a `Disponible`.
- **Gestión de Usuarios Internos:**
  - Exclusivo para el personal del parqueadero (los clientes no tienen acceso al sistema).
  - Creación, consulta, edición y activación/desactivación de cuentas.
  - Almacenamiento seguro de contraseñas mediante **Bcrypt** con costo de 10 rondas.
  - Asignación estricta de roles (`Administrador` y `Operador`).
  - Protección de rutas en backend y frontend para impedir que operadores accedan a configuraciones administrativas.
- **Módulo de Pagos:** Estructura de base de datos e interfaz preparada para su posterior desarrollo.
