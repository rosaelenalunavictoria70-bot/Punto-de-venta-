import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Order, OrderStatus, RouteDay } from '../types';
import { ROUTE_DAYS, formatCurrencySoles } from '../data/initialData';
import {
  FileText,
  Search,
  Printer,
  Share2,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

export const OrdersHistoryView: React.FC = () => {
  const { orders, openTicketModal, updateOrderStatus, deleteOrder, companyConfig } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dayFilter, setDayFilter] = useState<string>('all');

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone.includes(searchQuery);

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesDay = dayFilter === 'all' || order.routeDay === dayFilter;

    return matchesSearch && matchesStatus && matchesDay;
  });

  // Calculate stats
  const totalSalesAmount = orders
    .filter(o => o.status !== 'cancelado')
    .reduce((sum, o) => sum + o.total, 0);

  const pendingDeliveryAmount = orders
    .filter(o => o.status === 'pendiente_entrega')
    .reduce((sum, o) => sum + o.total, 0);

  const deliveredAmount = orders
    .filter(o => o.status === 'entregado_y_cobrado')
    .reduce((sum, o) => sum + o.total, 0);

  const handleShareWhatsApp = (order: Order) => {
    let msg = `*TICKET DE PEDIDO - ${companyConfig.tradeName}*\n`;
    msg += `📄 *N° Pedido:* ${order.orderNumber}\n`;
    msg += `🏪 *Cliente:* ${order.customerName} (${order.customerCode})\n`;
    msg += `📍 *Dirección:* ${order.customerAddress} (${order.customerDistrict})\n`;
    msg += `📦 *Cantidad de Items:* ${order.items.reduce((s, i) => s + i.quantity, 0)} unidades\n`;
    msg += `💰 *TOTAL A COBRAR EN SOLES: ${formatCurrencySoles(order.total)}*\n`;
    msg += `💳 *Forma de Pago:* ${order.paymentMethod}\n`;
    msg += `🚚 *Fecha Entrega:* ${order.deliveryDate} - ${order.deliveryTimeSlot}\n`;

    const message = encodeURIComponent(msg);
    let cleanPhone = order.customerPhone.replace(/\D/g, '');
    if (cleanPhone.length === 9) cleanPhone = `51${cleanPhone}`;
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${message}` : `https://wa.me/?text=${message}`;
    window.open(url, '_blank');
  };

  const handleDelete = (order: Order) => {
    if (confirm(`¿Eliminar el pedido ${order.orderNumber} de ${order.customerName}?`)) {
      deleteOrder(order.id);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Registro de Ventas</span>
            <span aria-hidden="true">·</span>
            <span>Total de tickets emitidos: <strong>{orders.length} pedidos</strong></span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Historial de Pedidos & Tickets de Venta
          </h1>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium mb-1">Total Pedidos Preventa (Activos)</div>
          <div className="text-2xl font-black text-slate-900 tabular-nums">
            {formatCurrencySoles(totalSalesAmount)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {orders.filter(o => o.status !== 'cancelado').length} tickets activos
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium mb-1">Por Entregar y Cobrar en Ruta</div>
          <div className="text-2xl font-black text-amber-600 tabular-nums">
            {formatCurrencySoles(pendingDeliveryAmount)}
          </div>
          <div className="text-[11px] text-amber-700/80 mt-0.5">
            {orders.filter(o => o.status === 'pendiente_entrega').length} pedidos pendientes de reparto
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium mb-1">Cobrado & Entregado con Éxito</div>
          <div className="text-2xl font-black text-emerald-700 tabular-nums">
            {formatCurrencySoles(deliveredAmount)}
          </div>
          <div className="text-[11px] text-emerald-600 mt-0.5">
            {orders.filter(o => o.status === 'entregado_y_cobrado').length} pedidos finalizados
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col lg:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por N° ticket, código cliente (CLI-001)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto text-xs">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 cursor-pointer"
          >
            <option value="all">Todos los estados</option>
            <option value="pendiente_entrega">Pendiente Entrega</option>
            <option value="entregado_y_cobrado">Entregado y Cobrado</option>
            <option value="cancelado">Cancelado</option>
          </select>

          {/* Day filter */}
          <select
            value={dayFilter}
            onChange={e => setDayFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 cursor-pointer"
          >
            <option value="all">Todas las rutas (Lun-Sáb)</option>
            {ROUTE_DAYS.map(day => (
              <option key={day} value={day}>Ruta {day}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 text-slate-400">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <h3 className="text-base font-semibold text-slate-700">No se encontraron pedidos</h3>
            <p className="text-xs text-slate-500 mt-1">
              Prueba cambiando los filtros o emite un nuevo pedido en el Punto de Venta.
            </p>
          </div>
        ) : (
          filteredOrders.map(order => {
            const isPending = order.status === 'pendiente_entrega';
            const isDelivered = order.status === 'entregado_y_cobrado';
            const isCancelled = order.status === 'cancelado';
            const totalUnits = order.items.reduce((s, i) => s + i.quantity, 0);

            const dateStr = new Date(order.createdAt).toLocaleDateString('es-PE', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 hover:border-slate-300 transition-all shadow-xs"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Left Column: Order metadata & client */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded">
                        {order.orderNumber}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {order.customerCode}
                      </span>
                      <h3 className="text-base font-bold text-slate-900">
                        {order.customerName}
                      </h3>
                      <span className="text-xs text-slate-400">
                        · {dateStr}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                      <span>Titular: <strong>{order.customerOwner}</strong></span>
                      <span aria-hidden="true">·</span>
                      <a
                        href={`https://wa.me/51${order.customerPhone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-600 font-medium"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{order.customerPhone}</span>
                      </a>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded text-[11px]">
                        Ruta {order.routeDay}
                      </span>
                    </div>

                    <div className="flex items-start gap-1 text-xs text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>{order.customerAddress}</strong> ({order.customerDistrict})
                        {order.customerReference && ` · Ref: ${order.customerReference}`}
                      </span>
                    </div>

                    {/* Products compact preview */}
                    <div className="pt-2 text-[11px] text-slate-600 flex flex-wrap gap-1.5">
                      <span className="font-semibold text-slate-800">{totalUnits} items:</span>
                      {order.items.map((item, idx) => (
                        <span key={idx} className="bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                          {item.quantity}x {item.productName.split('(')[0]}
                        </span>
                      ))}
                    </div>

                    <div className="text-[11px] text-slate-500 pt-1">
                      <span>Entrega pactada: <strong>{order.deliveryDate} ({order.deliveryTimeSlot})</strong></span>
                      <span className="ml-2">· Pago: <strong>{order.paymentMethod}</strong></span>
                    </div>
                  </div>

                  {/* Right Column: Total amount & Actions */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
                    <div className="text-left lg:text-right">
                      <span className="text-[11px] text-slate-500 block">Total a Cobrar:</span>
                      <span className="text-2xl font-black text-emerald-700 tabular-nums">
                        {formatCurrencySoles(order.total)}
                      </span>
                    </div>

                    {/* Status badge & selector */}
                    <div className="flex items-center gap-2">
                      <select
                        value={order.status}
                        onChange={e => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                        className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border cursor-pointer ${
                          isDelivered
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : isPending
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        <option value="pendiente_entrega">⏳ Pendiente Entrega</option>
                        <option value="entregado_y_cobrado">✓ Entregado y Cobrado</option>
                        <option value="cancelado">✕ Cancelado</option>
                      </select>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openTicketModal(order)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Ver Ticket</span>
                      </button>

                      <button
                        onClick={() => handleShareWhatsApp(order)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                        title="Enviar detalle por WhatsApp"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>

                      <button
                        onClick={() => handleDelete(order)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Eliminar pedido"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
