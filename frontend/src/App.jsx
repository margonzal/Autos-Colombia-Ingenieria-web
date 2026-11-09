import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Vehiculos from './pages/Vehiculos';
import Entradas from './pages/Entradas';
import Salidas from './pages/Salidas';
import Historial from './pages/Historial';
import Novedades from './pages/Novedades';
import Celdas from './pages/Celdas';
import Usuarios from './pages/Usuarios';
import Login from './pages/Login';
import './App.css';

export default function App() {
  const { isAuthenticated, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!isAuthenticated) {
    return <Login />;
  }

  // Título según módulo activo
  const getModuleTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Panel Principal';
      case 'entradas':
        return 'Registro de Entrada de Vehículos';
      case 'salidas':
        return 'Registro de Salida de Vehículos';
      case 'vehiculos':
        return 'Gestión de Vehículos';
      case 'celdas':
        return 'Gestión y Mapa de Celdas ';
      case 'historial':
        return 'Historial de Movimientos';
      case 'novedades':
        return 'Registro y Consulta de Novedades';
      case 'usuarios':
        return 'Gestión de Usuarios Internos ';
      default:
        return 'Autos Colombia';
    }
  };

  const renderModuleContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} />;
      case 'entradas':
        return <Entradas />;
      case 'salidas':
        return <Salidas />;
      case 'vehiculos':
        return <Vehiculos />;
      case 'celdas':
        return <Celdas />;
      case 'historial':
        return <Historial />;
      case 'novedades':
        return <Novedades />;
      case 'usuarios':
        return isAdmin ? <Usuarios /> : <Dashboard setActiveTab={setActiveTab} />;
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="main-wrapper">
        <Navbar title={getModuleTitle()} />
        <main className="content-area">
          {renderModuleContent()}
        </main>
      </div>
    </div>
  );
}
