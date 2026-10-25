/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { RouteScheduleView } from './components/RouteScheduleView';
import { PosView } from './components/PosView';
import { QuotasView } from './components/QuotasView';
import { CustomersView } from './components/CustomersView';
import { ProductsView } from './components/ProductsView';
import { OrdersHistoryView } from './components/OrdersHistoryView';
import { SalesForceView } from './components/SalesForceView';
import { DeploymentGuideView } from './components/DeploymentGuideView';
import { SettingsView } from './components/SettingsView';
import { TicketModal } from './components/TicketModal';
import { LoginView } from './components/LoginView';
import { OfflineIndicator } from './components/OfflineIndicator';

const AppContent: React.FC = () => {
  const { activeTab, currentSalesUser, pendingOfflineCount } = useApp();

  // If no salesperson is logged in, show the Sales Force Login Screen
  if (!currentSalesUser) {
    return (
      <>
        <LoginView />
        <OfflineIndicator pendingCount={pendingOfflineCount} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Bar Contract Navbar */}
      <Navbar />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'rutero' && <RouteScheduleView />}
        {activeTab === 'pos' && <PosView />}
        {activeTab === 'cuotas' && <QuotasView />}
        {activeTab === 'clientes' && <CustomersView />}
        {activeTab === 'productos' && <ProductsView />}
        {activeTab === 'pedidos' && <OrdersHistoryView />}
        {activeTab === 'fuerza_ventas' && <SalesForceView />}
        {activeTab === 'despliegue' && <DeploymentGuideView />}
        {activeTab === 'configuracion' && <SettingsView />}
      </main>

      {/* Thermal Ticket Modal */}
      <TicketModal />

      {/* Offline Status Toast */}
      <OfflineIndicator pendingCount={pendingOfflineCount} />

      {/* Clean quiet footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            RutaVenta POS · Preventa Multi-Usuario, Rutas y Emisión de Tickets en Soles (S/.)
          </span>
          <span className="text-slate-400">
            PWA Instalable Online/Offline · Base de datos sincronizada en Firebase Cloud
          </span>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
