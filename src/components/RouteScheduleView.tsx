import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Customer, RouteDay, VisitStatus } from '../types';
import { ROUTE_DAYS, getTodayRouteDay, formatCurrencySoles } from '../data/initialData';
import {
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Phone,
  MapPin,
  ExternalLink,
  ShoppingCart,
  Receipt,
  Search,
  Plus,
  RefreshCw,
  TrendingUp,
  UserCheck,
} from 'lucide-react';

export const RouteScheduleView: React.FC = () => {
  const {
    customers,
    selectedRouteDay,
    setSelectedRouteDay,
    setPosCustomer,
    setActiveTab,
    updateCustomerVisitStatus,
    orders,
    openTicketModal,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const todayRealDay = getTodayRouteDay();

  // Filter customers for the selected route day
  const dayCustomers = customers.filter(c => c.routeDay === selectedRouteDay);

  // Search and status filter
  const filteredCustomers = dayCustomers.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.district.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'visited_order' && c.visitStatus === 'visited_order') ||
      (filterStatus === 'pending' && (!c.visitStatus || c.visitStatus === 'pending')) ||
      (filterStatus === 'no_order' && (c.visitStatus === 'visited_no_order' || c.visitStatus === 'absent'));

    return matchesSearch && matchesStatus;
  });

  // Calculate day stats
  const totalInRoute = dayCustomers.length;
  const ordersCompleted = dayCustomers.filter(c => c.visitStatus === 'visited_order').length;
  const pendingCount = dayCustomers.filter(c => !c.visitStatus || c.visitStatus === 'pending').length;
  const noOrderCount = dayCustomers.filter(c => c.visitStatus === 'visited_no_order' || c.visitStatus === 'absent').length;

  // Calculate day's total sales in Soles (S/.)
  const dayTotalSales = orders
    .filter(o => o.routeDay === selectedRouteDay)
    .reduce((sum, ord) => sum + ord.total, 0);

  const handleStartOrder = (customer: Customer) => {
    setPosCustomer(customer);
    setActiveTab('pos');
  };

  const handleOpenTicket = (customer: Customer) => {
    if (customer.lastOrderId) {
      const order = orders.find(o => o.id === customer.lastOrderId);
      if (order) {
        openTicketModal(order);
        return;
      }
    }
    // Fallback find latest order for this customer
    const order = orders.find(o => o.customerId === customer.id);
    if (order) {
      openTicketModal(order);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Route Synchronization Header & Day Selector */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>Sincronización de Rutas</span>
              <span aria-hidden="true">·</span>
              <span>Hoy es <strong className="text-slate-800 uppercase">{todayRealDay}</strong></span>
              {selectedRouteDay === todayRealDay && (
                <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full text-[11px]">
                  En Sincronía Hoy
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Rutas de Preventa: <span className="text-emerald-600">{selectedRouteDay}</span>
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {selectedRouteDay !== todayRealDay && (
              <button
                onClick={() => setSelectedRouteDay(todayRealDay)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sincronizar a Hoy ({todayRealDay})</span>
              </button>
            )}
            <button
              onClick={() => setActiveTab('clientes')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Gestionar Clientes</span>
            </button>
          </div>
        </div>

        {/* Day of Week Navigation Strip (Lunes a Sábado) */}
        <div className="pt-4">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
            Seleccionar Día de Ruta:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {ROUTE_DAYS.map(day => {
              const isSelected = selectedRouteDay === day;
              const isToday = todayRealDay === day;
              const count = customers.filter(c => c.routeDay === day).length;
              const completed = customers.filter(c => c.routeDay === day && c.visitStatus === 'visited_order').length;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedRouteDay(day)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-600/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-bold ${isSelected ? 'text-emerald-900' : 'text-slate-800'}`}>
                      {day}
                    </span>
                    {isToday && (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                        HOY
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{count} clientes</span>
                    {count > 0 && (
                      <span className="font-semibold text-emerald-700">
                        {completed}/{count}
                      </span>
                    )}
                  </div>
                  {/* Micro progress bar */}
                  <div className="w-full bg-slate-200 h-1 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full transition-all"
                      style={{ width: count > 0 ? `${(completed / count) * 100}%` : '0%' }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium mb-1">Total en Ruta ({selectedRouteDay})</div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">
            {totalInRoute} <span className="text-xs font-normal text-slate-400">bodegas</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium mb-1">Pedidos Concretados</div>
          <div className="text-2xl font-bold text-emerald-700 tabular-nums">
            {ordersCompleted} <span className="text-xs font-normal text-slate-400">/ {totalInRoute}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium mb-1">Pendientes por Visitar</div>
          <div className="text-2xl font-bold text-amber-600 tabular-nums">
            {pendingCount}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium mb-1">Monto Preventa en Soles</div>
          <div className="text-2xl font-bold text-emerald-600 tabular-nums">
            {formatCurrencySoles(dayTotalSales)}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por código (CLI-001), bodega, titular o calle..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-full sm:w-auto overflow-x-auto text-xs">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
              filterStatus === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({dayCustomers.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
              filterStatus === 'pending' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pendientes ({pendingCount})
          </button>
          <button
            onClick={() => setFilterStatus('visited_order')}
            className={`px-3 py-1 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
              filterStatus === 'visited_order' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Con Pedido ({ordersCompleted})
          </button>
          <button
            onClick={() => setFilterStatus('no_order')}
            className={`px-3 py-1 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
              filterStatus === 'no_order' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            No Compró ({noOrderCount})
          </button>
        </div>
      </div>

      {/* Customer Route Itinerary List */}
      <div className="space-y-3">
        {filteredCustomers.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-base font-semibold text-slate-800">
              No hay clientes encontrados para este criterio en {selectedRouteDay}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Puedes agregar clientes a la ruta de {selectedRouteDay} o restablecer los filtros de búsqueda.
            </p>
            <button
              onClick={() => setActiveTab('clientes')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Cliente para {selectedRouteDay}</span>
            </button>
          </div>
        ) : (
          filteredCustomers.map(customer => {
            const hasOrder = customer.visitStatus === 'visited_order';
            const isNoOrder = customer.visitStatus === 'visited_no_order';
            const isAbsent = customer.visitStatus === 'absent';
            const isPending = !customer.visitStatus || customer.visitStatus === 'pending';

            return (
              <div
                key={customer.id}
                className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all ${
                  hasOrder
                    ? 'border-emerald-300 bg-emerald-50/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 shadow-xs'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Left Column: Customer Details */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                        {customer.code}
                      </span>
                      <h3 className="text-base font-bold text-slate-900">
                        {customer.name}
                      </h3>
                      {hasOrder && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Pedido Tomado
                        </span>
                      )}
                      {isNoOrder && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                          <XCircle className="w-3.5 h-3.5" />
                          No Compró
                        </span>
                      )}
                      {isAbsent && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Local Cerrado / Ausente
                        </span>
                      )}
                      {isPending && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          <Clock className="w-3.5 h-3.5" />
                          Pendiente de visita
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                      <span>Titular: <strong>{customer.ownerName}</strong></span>
                      <span aria-hidden="true">·</span>
                      <span>{customer.documentType}: {customer.documentNumber}</span>
                      <span aria-hidden="true">·</span>
                      <a
                        href={`https://wa.me/51${customer.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{customer.phone}</span>
                      </a>
                    </div>

                    <div className="flex items-start gap-1.5 text-xs text-slate-700 pt-1">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <span><strong>{customer.address}</strong>, {customer.district}</span>
                        {customer.reference && (
                          <span className="text-slate-500 block text-[11px] mt-0.5">
                            Ref: {customer.reference}
                          </span>
                        )}
                      </div>
                    </div>

                    {customer.notes && (
                      <div className="text-[11px] text-amber-800 bg-amber-50/70 p-2 rounded-lg mt-1 border border-amber-100">
                        <strong>Nota de cobranza/entrega:</strong> {customer.notes}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Actions & Order Status */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
                    
                    {hasOrder && customer.lastOrderAmount && (
                      <div className="text-left lg:text-right">
                        <span className="text-[11px] text-slate-500 block">Total en Pedido:</span>
                        <span className="text-lg font-extrabold text-emerald-700 tabular-nums">
                          {formatCurrencySoles(customer.lastOrderAmount)}
                        </span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      {hasOrder ? (
                        <>
                          <button
                            onClick={() => handleOpenTicket(customer)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>Ver Ticket</span>
                          </button>
                          <button
                            onClick={() => handleStartOrder(customer)}
                            className="inline-flex items-center gap-1 px-3 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                          >
                            <span>Otro Pedido</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleStartOrder(customer)}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-xs font-bold transition-all transform active:scale-95 cursor-pointer shadow-xs"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span>Tomar Pedido Inmediato</span>
                        </button>
                      )}

                      {/* Quick Visit Status Toggles if not ordered */}
                      {!hasOrder && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateCustomerVisitStatus(customer.id, 'visited_no_order')}
                            title="Marcar como 'No Compró'"
                            className="px-2.5 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 rounded-lg transition-colors cursor-pointer"
                          >
                            No Compró
                          </button>
                          <button
                            onClick={() => updateCustomerVisitStatus(customer.id, 'absent')}
                            title="Marcar como 'Cerrado / Ausente'"
                            className="px-2.5 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-amber-50 hover:text-amber-700 rounded-lg transition-colors cursor-pointer"
                          >
                            Cerrado
                          </button>
                        </div>
                      )}

                      {(isNoOrder || isAbsent) && (
                        <button
                          onClick={() => updateCustomerVisitStatus(customer.id, 'pending')}
                          className="text-[11px] text-slate-400 hover:text-slate-700 underline"
                        >
                          Restablecer
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
