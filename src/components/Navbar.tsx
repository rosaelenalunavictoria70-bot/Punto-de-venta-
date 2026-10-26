import React from 'react';
import { useApp } from '../context/AppContext';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { PWAInstallButton } from './PWAInstallButton';
import {
  PlusCircle,
  Wifi,
  WifiOff,
  LogOut,
} from 'lucide-react';
import logoImg from '../assets/images/distribuidora_logo_1792434315123.jpg';

export const Navbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    currentSalesUser,
    logoutSalesUser,
    firebaseUser,
  } = useApp();

  const isOnline = useOnlineStatus();
  const isSupervisor =
    !currentSalesUser ||
    currentSalesUser.role === 'supervisor' ||
    currentSalesUser.role === 'admin';

  return (
    <div className="sticky top-0 z-40 no-print">
      {/* Main 3-Zone Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-8 h-16">
          
          {/* Zone 1: Single text element wordmark */}
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
          >
            RutaVenta POS
          </button>

          {/* Zone 2: 5 clean single-line text navigation links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`pb-1 transition-colors whitespace-nowrap shrink-0 border-b-2 cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'text-emerald-700 font-bold border-emerald-600'
                  : 'text-slate-600 border-transparent hover:text-slate-900'
              }`}
            >
              {isSupervisor ? 'Dashboard Supervisor' : 'Mi Avance'}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('rutero')}
              className={`pb-1 transition-colors whitespace-nowrap shrink-0 border-b-2 cursor-pointer ${
                activeTab === 'rutero'
                  ? 'text-emerald-700 font-bold border-emerald-600'
                  : 'text-slate-600 border-transparent hover:text-slate-900'
              }`}
            >
              {isSupervisor ? 'Rutas' : 'Mi Ruta'}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('pos')}
              className={`pb-1 transition-colors whitespace-nowrap shrink-0 border-b-2 cursor-pointer ${
                activeTab === 'pos'
                  ? 'text-emerald-700 font-bold border-emerald-600'
                  : 'text-slate-600 border-transparent hover:text-slate-900'
              }`}
            >
              Punto de Venta
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('cuotas')}
              className={`pb-1 transition-colors whitespace-nowrap shrink-0 border-b-2 cursor-pointer ${
                activeTab === 'cuotas'
                  ? 'text-emerald-700 font-bold border-emerald-600'
                  : 'text-slate-600 border-transparent hover:text-slate-900'
              }`}
            >
              Cuotas y Cierre
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('clientes')}
              className={`pb-1 transition-colors whitespace-nowrap shrink-0 border-b-2 cursor-pointer ${
                activeTab === 'clientes'
                  ? 'text-emerald-700 font-bold border-emerald-600'
                  : 'text-slate-600 border-transparent hover:text-slate-900'
              }`}
            >
              {isSupervisor ? 'Clientes' : 'Mis Clientes'}
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('pos')}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nuevo Pedido</span>
            </button>
          </div>
        </div>
      </header>

      {/* Workspace Status, Secondary Views & Active Seller Toolbar */}
      <div className="bg-slate-900 text-slate-200 border-b border-slate-800 px-4 sm:px-6 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* Active Salesperson Info */}
          <div className="flex items-center gap-3">
            <img
              src={logoImg}
              alt="Logo"
              className="w-5 h-5 rounded object-cover hidden sm:block"
              onError={e => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            {currentSalesUser && (
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-bold text-emerald-400">
                  [{currentSalesUser.sellerCode}]
                </span>
                <span className="font-semibold text-white truncate max-w-[160px] sm:max-w-none">
                  {currentSalesUser.fullName}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    isSupervisor
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                      : 'bg-sky-500/20 text-sky-300 border border-sky-400/30'
                  }`}
                >
                  {isSupervisor ? 'Vista Supervisor / Gerencia' : 'Vista Vendedor de Ruta'}
                </span>
              </div>
            )}

            {/* Secondary Workspace Links on Desktop */}
            <div className="hidden lg:flex items-center gap-3 pl-3 border-l border-slate-700 text-[11px]">
              <button
                type="button"
                onClick={() => setActiveTab('pedidos')}
                className={`hover:text-white transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'pedidos' ? 'text-emerald-400 font-bold' : 'text-slate-300'
                }`}
              >
                {isSupervisor ? 'Todos los Tickets' : 'Mis Tickets'}
              </button>
              <span aria-hidden="true" className="text-slate-700">·</span>
              <button
                type="button"
                onClick={() => setActiveTab('productos')}
                className={`hover:text-white transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'productos' ? 'text-emerald-400 font-bold' : 'text-slate-300'
                }`}
              >
                Catálogo y Precios
              </button>

              {isSupervisor && (
                <>
                  <span aria-hidden="true" className="text-slate-700">·</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('fuerza_ventas')}
                    className={`hover:text-white transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      activeTab === 'fuerza_ventas' ? 'text-emerald-400 font-bold' : 'text-slate-300'
                    }`}
                  >
                    Fuerza de Ventas
                  </button>
                  <span aria-hidden="true" className="text-slate-700">·</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('despliegue')}
                    className={`hover:text-white transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      activeTab === 'despliegue' ? 'text-emerald-400 font-bold' : 'text-slate-300'
                    }`}
                  >
                    App & Offline/Online
                  </button>
                  <span aria-hidden="true" className="text-slate-700">·</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('configuracion')}
                    className={`hover:text-white transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      activeTab === 'configuracion' ? 'text-emerald-400 font-bold' : 'text-slate-300'
                    }`}
                  >
                    Ajustes
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Connectivity, Cloud Status, Install PWA & Switch User */}
          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              onClick={() => setActiveTab('despliegue')}
              className="flex items-center gap-1.5 text-[11px] hover:text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-400 font-semibold">Offline</span>
                </>
              )}
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-slate-300 hidden sm:inline">
                {firebaseUser ? 'Nube Sincronizada' : 'Local + Nube'}
              </span>
            </button>

            <PWAInstallButton variant="compact" />

            <button
              type="button"
              onClick={logoutSalesUser}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
              title="Cambiar de vendedor o cerrar sesión"
            >
              <LogOut className="w-3 h-3" />
              <span>Cambiar Usuario</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Scroller */}
      <div className="lg:hidden flex items-center gap-1 px-3 py-2 overflow-x-auto bg-white border-b border-slate-200 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors shrink-0 ${
            activeTab === 'dashboard' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Dashboard
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('rutero')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors shrink-0 ${
            activeTab === 'rutero' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Rutas
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pos')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors shrink-0 ${
            activeTab === 'pos' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          POS Pedido
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('cuotas')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors shrink-0 ${
            activeTab === 'cuotas' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Cuotas y Cierre
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pedidos')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors shrink-0 ${
            activeTab === 'pedidos' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Tickets
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('fuerza_ventas')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors shrink-0 ${
            activeTab === 'fuerza_ventas' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Fuerza de Ventas
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('clientes')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors shrink-0 ${
            activeTab === 'clientes' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Clientes
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('productos')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors shrink-0 ${
            activeTab === 'productos' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Productos
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('despliegue')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors shrink-0 ${
            activeTab === 'despliegue' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          App & Offline
        </button>
      </div>
    </div>
  );
};
