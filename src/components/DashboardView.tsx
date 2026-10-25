import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ROUTE_DAYS, formatCurrencySoles, getTodayRouteDay } from '../data/initialData';
import { SalesRole } from '../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Receipt,
  ArrowUpRight,
  Package,
  PlusCircle,
  ShieldCheck,
  Lock,
  Activity,
  Users,
  CheckCircle2,
  Clock,
  CloudUpload,
  Eye,
} from 'lucide-react';

const CHART_COLORS = ['#059669', '#0f172a', '#2563eb', '#d97706', '#7c3aed', '#e11d48'];

export const DashboardView: React.FC = () => {
  const {
    orders,
    products,
    customers,
    salesUsers,
    currentSalesUser,
    loginAsDemoUser,
    updateSalesUser,
    selectedRouteDay,
    setSelectedRouteDay,
    setActiveTab,
    openTicketModal,
    firebaseUser,
    lastRealtimeUpdate,
    syncAllToCloud,
    isSyncing,
  } = useApp();

  // Check if current user has Supervisor or Admin access level in Firebase
  const isSupervisor =
    currentSalesUser?.role === 'supervisor' || currentSalesUser?.role === 'admin';

  // Scope filter: 'day' (Ruta del Día Seleccionado) vs 'week' (Acumulado Semanal Lun-Sáb)
  const [scope, setScope] = useState<'day' | 'week'>('week');
  const [sellerFilter, setSellerFilter] = useState<string>('all');
  const [topMetric, setTopMetric] = useState<'revenue' | 'quantity'>('revenue');
  const [breakdownMode, setBreakdownMode] = useState<'category' | 'payment'>('category');
  const [roleUpdateNotice, setRoleUpdateNotice] = useState<string | null>(null);

  const todayRealDay = getTodayRouteDay();

  // Effective seller filter: Vendedores can ONLY see their own sellerCode; Supervisors can see 'all' or any specific seller
  const effectiveSellerFilter = isSupervisor
    ? sellerFilter
    : currentSalesUser?.sellerCode || 'VEN-002';

  // Active valid orders (non-cancelled) filtered by effectiveSellerFilter and scope
  const activeOrders = useMemo(() => {
    return orders.filter(o => {
      if (o.status === 'cancelado') return false;
      const matchesScope = scope === 'week' || o.routeDay === selectedRouteDay;
      const matchesSeller =
        effectiveSellerFilter === 'all' || o.sellerCode === effectiveSellerFilter;
      return matchesScope && matchesSeller;
    });
  }, [orders, scope, selectedRouteDay, effectiveSellerFilter]);

  // Specific day orders for quick comparison
  const selectedDayOrders = useMemo(() => {
    return orders.filter(
      o =>
        o.status !== 'cancelado' &&
        o.routeDay === selectedRouteDay &&
        (effectiveSellerFilter === 'all' || o.sellerCode === effectiveSellerFilter)
    );
  }, [orders, selectedRouteDay, effectiveSellerFilter]);

  // Core KPI Calculations
  const totalSalesSoles = useMemo(
    () => activeOrders.reduce((sum, o) => sum + o.total, 0),
    [activeOrders]
  );

  const selectedDaySalesSoles = useMemo(
    () => selectedDayOrders.reduce((sum, o) => sum + o.total, 0),
    [selectedDayOrders]
  );

  const totalOrdersCount = activeOrders.length;
  const deliveredOrdersCount = activeOrders.filter(o => o.status === 'entregado_y_cobrado').length;
  const pendingOrdersCount = activeOrders.filter(o => o.status === 'pendiente_entrega').length;

  const totalUnitsSold = useMemo(
    () =>
      activeOrders.reduce(
        (sum, o) => sum + o.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
        0
      ),
    [activeOrders]
  );

  const averageTicketSoles = totalOrdersCount > 0 ? totalSalesSoles / totalOrdersCount : 0;

  // Route coverage calculation
  const scopedCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchesScope = scope === 'week' || c.routeDay === selectedRouteDay;
      const matchesSeller =
        effectiveSellerFilter === 'all' || c.assignedSellerCode === effectiveSellerFilter;
      return matchesScope && matchesSeller;
    });
  }, [customers, scope, selectedRouteDay, effectiveSellerFilter]);

  const customersWithOrdersCount = useMemo(() => {
    const orderedCustomerIds = new Set(activeOrders.map(o => o.customerId));
    return scopedCustomers.filter(
      c => c.visitStatus === 'visited_order' || orderedCustomerIds.has(c.id)
    ).length;
  }, [scopedCustomers, activeOrders]);

  const routeEffectivenessPct =
    scopedCustomers.length > 0
      ? Math.round((customersWithOrdersCount / scopedCustomers.length) * 100)
      : 0;

  // EXCLUSIVE SUPERVISOR DATA: Real-time progress per salesperson across the entire sales force
  const salesForceRealtimeStats = useMemo(() => {
    const periodOrders = orders.filter(o => {
      if (o.status === 'cancelado') return false;
      return scope === 'week' || o.routeDay === selectedRouteDay;
    });

    return salesUsers
      .filter(u => u.active)
      .map(seller => {
        const sOrders = periodOrders.filter(o => o.sellerCode === seller.sellerCode);
        const soldSoles = Number(sOrders.reduce((sum, o) => sum + o.total, 0).toFixed(2));
        const collectedSoles = Number(
          sOrders
            .filter(o => o.status === 'entregado_y_cobrado')
            .reduce((sum, o) => sum + o.total, 0)
            .toFixed(2)
        );
        const quotaSoles =
          scope === 'week' ? seller.salesGoalSoles * 6 : seller.salesGoalSoles;
        const progressPct =
          quotaSoles > 0 ? Math.round((soldSoles / quotaSoles) * 100) : 0;

        const assignedCustomers = customers.filter(c => {
          const matchesDay = scope === 'week' || c.routeDay === selectedRouteDay;
          return matchesDay && c.assignedSellerCode === seller.sellerCode;
        });

        const orderedCustIds = new Set(sOrders.map(o => o.customerId));
        const attendedCount = assignedCustomers.filter(
          c => c.visitStatus === 'visited_order' || orderedCustIds.has(c.id)
        ).length;

        const latestOrder = sOrders[0] || null;

        return {
          seller,
          shortName: seller.fullName.split('(')[0].trim(),
          codeLabel: `${seller.sellerCode} · ${seller.fullName.split(' ')[0]}`,
          quotaSoles,
          soldSoles,
          collectedSoles,
          pendingSoles: Math.max(0, Number((soldSoles - collectedSoles).toFixed(2))),
          remainingQuota: Math.max(0, Number((quotaSoles - soldSoles).toFixed(2))),
          ordersCount: sOrders.length,
          progressPct,
          assignedCount: assignedCustomers.length,
          attendedCount,
          latestOrder,
        };
      });
  }, [orders, salesUsers, customers, scope, selectedRouteDay]);

  const totalForceQuotaSoles = useMemo(
    () => salesForceRealtimeStats.reduce((sum, r) => sum + r.quotaSoles, 0),
    [salesForceRealtimeStats]
  );

  const totalForceSoldSoles = useMemo(
    () => salesForceRealtimeStats.reduce((sum, r) => sum + r.soldSoles, 0),
    [salesForceRealtimeStats]
  );

  const totalForceProgressPct =
    totalForceQuotaSoles > 0
      ? Math.round((totalForceSoldSoles / totalForceQuotaSoles) * 100)
      : 0;

  // Chart 1 Data: Sales & Orders by Route Day (Lunes a Sábado)
  const salesByDayData = useMemo(() => {
    return ROUTE_DAYS.map(day => {
      const dayOrders = orders.filter(
        o =>
          o.status !== 'cancelado' &&
          o.routeDay === day &&
          (effectiveSellerFilter === 'all' || o.sellerCode === effectiveSellerFilter)
      );
      const monto = dayOrders.reduce((sum, o) => sum + o.total, 0);
      const clientesRuta = customers.filter(
        c =>
          c.routeDay === day &&
          (effectiveSellerFilter === 'all' || c.assignedSellerCode === effectiveSellerFilter)
      ).length;

      return {
        day,
        shortDay: day.slice(0, 3),
        ventas: Number(monto.toFixed(2)),
        pedidos: dayOrders.length,
        clientes: clientesRuta,
      };
    });
  }, [orders, customers, effectiveSellerFilter]);

  // Chart 2 Data: Top Selling Products (by Soles or Units)
  const topProductsData = useMemo(() => {
    const map = new Map<
      string,
      {
        code: string;
        name: string;
        shortName: string;
        unit: string;
        category: string;
        quantity: number;
        revenue: number;
        ordersCount: number;
      }
    >();

    activeOrders.forEach(order => {
      order.items.forEach(item => {
        const prodRef = products.find(p => p.id === item.productId || p.code === item.productCode);
        const category = prodRef?.category || 'Abarrotes';
        const key = item.productCode;
        const existing = map.get(key);

        if (existing) {
          existing.quantity += item.quantity;
          existing.revenue = Number((existing.revenue + item.subtotal).toFixed(2));
          existing.ordersCount += 1;
        } else {
          const cleanName = item.productName.split('(')[0].trim();
          map.set(key, {
            code: item.productCode,
            name: item.productName,
            shortName: cleanName.length > 22 ? `${cleanName.slice(0, 22)}…` : cleanName,
            unit: item.unit,
            category,
            quantity: item.quantity,
            revenue: Number(item.subtotal.toFixed(2)),
            ordersCount: 1,
          });
        }
      });
    });

    const list = Array.from(map.values());
    list.sort((a, b) =>
      topMetric === 'revenue' ? b.revenue - a.revenue : b.quantity - a.quantity
    );
    return list.slice(0, 7);
  }, [activeOrders, products, topMetric]);

  // Chart 3 Data: Breakdown by Product Category or Payment Method
  const distributionData = useMemo(() => {
    const map = new Map<string, number>();

    if (breakdownMode === 'category') {
      activeOrders.forEach(order => {
        order.items.forEach(item => {
          const prodRef = products.find(
            p => p.id === item.productId || p.code === item.productCode
          );
          const cat = prodRef?.category || 'Otros';
          map.set(cat, (map.get(cat) || 0) + item.subtotal);
        });
      });
    } else {
      activeOrders.forEach(order => {
        const method = order.paymentMethod.replace(' contra entrega', '');
        map.set(method, (map.get(method) || 0) + order.total);
      });
    }

    const total = Array.from(map.values()).reduce((s, v) => s + v, 0);
    return Array.from(map.entries())
      .map(([name, value]) => ({
        name,
        value: Number(value.toFixed(2)),
        pct: total > 0 ? Math.round((value / total) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [activeOrders, products, breakdownMode]);

  const handleChangeAccessLevel = (userId: string, fullName: string, newRole: SalesRole) => {
    updateSalesUser(userId, { role: newRole });
    const roleLabel =
      newRole === 'supervisor'
        ? 'Supervisor (Acceso Global)'
        : newRole === 'admin'
        ? 'Administrador'
        : 'Vendedor de Ruta';
    setRoleUpdateNotice(
      `Nivel de acceso de ${fullName} actualizado en Firebase a: ${roleLabel}`
    );
    setTimeout(() => setRoleUpdateNotice(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Firebase RBAC Access Level Strip & Instant Profile Switcher */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>
                  Nivel de Acceso Firebase:{' '}
                  {isSupervisor ? 'SUPERVISOR (Vista Global Habilitada)' : 'VENDEDOR (Vista Personal)'}
                </span>
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="inline-flex items-center gap-1.5 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>
                  Tiempo Real ({firebaseUser ? 'Firebase Cloud' : 'Sincronización Activa'}):{' '}
                  <strong className="font-mono text-white">{lastRealtimeUpdate}</strong>
                </span>
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {isSupervisor
                ? 'Tienes habilitada la vista exclusiva de Supervisor para monitorear en vivo las ventas, cuotas y rutas de toda la fuerza de ventas.'
                : `Conectado como ${currentSalesUser?.fullName} (${currentSalesUser?.sellerCode}). Por nivel de acceso, solo visualizas tus propios pedidos y ruta.`}
            </p>
          </div>

          {/* Quick Role Switcher to test Supervisor vs Vendedor views */}
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-semibold text-slate-400 mr-1">
              Probar Nivel de Acceso:
            </span>
            {salesUsers.map(u => {
              const isCurrent = currentSalesUser?.id === u.id;
              const isSupRole = u.role === 'supervisor' || u.role === 'admin';
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    loginAsDemoUser(u);
                    if (u.role === 'vendedor') {
                      setSellerFilter(u.sellerCode);
                    } else {
                      setSellerFilter('all');
                    }
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    isCurrent
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {u.fullName.split(' ')[0]} ({isSupRole ? 'Supervisor' : u.sellerCode})
                </button>
              );
            })}
          </div>
        </div>

        {roleUpdateNotice && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-950/90 border border-emerald-700 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{roleUpdateNotice}</span>
          </div>
        )}
      </div>

      {/* Top Control Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Panel de Control Comercial</span>
            <span aria-hidden="true">·</span>
            <span>
              Ruta sincronizada: <strong className="text-slate-800">{selectedRouteDay}</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>Hoy es {todayRealDay}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {isSupervisor
              ? 'Dashboard General y Monitoreo de Fuerza de Ventas en Tiempo Real'
              : `Mi Resumen de Ventas en Ruta (${currentSalesUser?.sellerCode})`}
          </h1>
        </div>

        {/* Interactive Scope & Seller Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Segmented Scope Selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setScope('day')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                scope === 'day'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Día: {selectedRouteDay}
            </button>
            <button
              type="button"
              onClick={() => setScope('week')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                scope === 'week'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Toda la Semana (Lun-Sáb)
            </button>
          </div>

          {/* Seller Filter (Only Supervisors can filter across all sellers) */}
          {isSupervisor ? (
            <select
              value={sellerFilter}
              onChange={e => setSellerFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-700 cursor-pointer"
            >
              <option value="all">Toda la Fuerza de Ventas ({salesUsers.length})</option>
              {salesUsers.map(u => (
                <option key={u.id} value={u.sellerCode}>
                  [{u.sellerCode}] {u.fullName}
                </option>
              ))}
            </select>
          ) : (
            <span className="px-3 py-2 text-xs font-semibold bg-slate-100 border border-slate-200 rounded-lg text-slate-700">
              Vendedor: [{currentSalesUser?.sellerCode}] {currentSalesUser?.fullName.split('(')[0]}
            </span>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('pos')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Tomar Pedido</span>
          </button>
        </div>
      </div>

      {/* Quick Day Selector Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {ROUTE_DAYS.map(day => {
          const isSelected = selectedRouteDay === day;
          const dayStat = salesByDayData.find(d => d.day === day);
          return (
            <button
              key={day}
              type="button"
              onClick={() => {
                setSelectedRouteDay(day);
                setScope('day');
              }}
              className={`px-3.5 py-2 rounded-xl border text-left transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isSelected && scope === 'day'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : isSelected
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-950'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between gap-3 text-xs font-bold">
                <span>{day}</span>
                <span className="font-mono tabular-nums opacity-85">
                  {formatCurrencySoles(dayStat?.ventas || 0)}
                </span>
              </div>
              <div className="text-[10px] opacity-75 mt-0.5 tabular-nums">
                {dayStat?.pedidos || 0} pedido(s) · {dayStat?.clientes || 0} clientes
              </div>
            </button>
          );
        })}
      </div>

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <div className="text-xs font-medium text-slate-500">
            {scope === 'day'
              ? `Ventas del Día (${selectedRouteDay})`
              : 'Ventas Totales de la Semana'}
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 tabular-nums mt-1.5">
            {formatCurrencySoles(totalSalesSoles)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
            <span>Ruta {selectedRouteDay}:</span>
            <strong className="text-slate-800 tabular-nums">
              {formatCurrencySoles(selectedDaySalesSoles)}
            </strong>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <div className="text-xs font-medium text-slate-500">Total de Pedidos Realizados</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums mt-1.5">
            {totalOrdersCount}{' '}
            <span className="text-sm font-normal text-slate-400">tickets</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-2 tabular-nums">
            <span className="text-emerald-700 font-medium">
              {deliveredOrdersCount} cobrados
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-amber-700 font-medium">
              {pendingOrdersCount} por entregar
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <div className="text-xs font-medium text-slate-500">Ticket Promedio & Unidades</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums mt-1.5">
            {formatCurrencySoles(averageTicketSoles)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2 tabular-nums">
            <span>Volumen despachado:</span>
            <strong className="text-slate-800">{totalUnitsSold} unds/cajas</strong>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <div className="text-xs font-medium text-slate-500">Efectividad de Ruta</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums mt-1.5">
            {routeEffectivenessPct}%
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2 tabular-nums">
            <span>Clientes con pedido:</span>
            <strong className="text-slate-800">
              {customersWithOrdersCount} de {scopedCustomers.length}
            </strong>
          </div>
        </div>
      </div>

      {/* =====================================================================
          EXCLUSIVE SUPERVISOR VIEW: REAL-TIME SALES FORCE MONITORING
          Only visible when currentSalesUser.role === 'supervisor' || 'admin'
      ===================================================================== */}
      {isSupervisor ? (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border-2 border-emerald-600/30 shadow-xs space-y-6">
          {/* Header of the Exclusive Supervisor Command Center */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs mb-1">
                <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 uppercase tracking-wider">
                  <Activity className="w-4 h-4" />
                  <span>Vista Exclusiva de Supervisor · Monitoreo en Tiempo Real</span>
                </span>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span className="text-slate-500">
                  Colección Firebase: <code>/sales_users</code> y <code>/orders</code>
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Progreso en Vivo de Toda la Fuerza de Ventas ({scope === 'day' ? `Ruta ${selectedRouteDay}` : 'Acumulado Semanal'})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Supervisa el avance individual de cada preventista frente a su cuota, cambia niveles de acceso en Firebase y audita los tickets emitidos al instante.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <div className="text-right">
                <div className="text-[11px] font-medium text-slate-500">
                  Avance Global vs. Cuota Fuerza de Ventas
                </div>
                <div className="text-base font-extrabold text-emerald-700 tabular-nums">
                  {formatCurrencySoles(totalForceSoldSoles)}{' '}
                  <span className="text-xs font-normal text-slate-400">
                    / {formatCurrencySoles(totalForceQuotaSoles)} ({totalForceProgressPct}%)
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void syncAllToCloud()}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                <CloudUpload className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Firebase'}</span>
              </button>
            </div>
          </div>

          {/* Grid: Left 5 Cols Recharts Comparison Chart | Right 7 Cols Live Seller Cards & Table */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 5 Cols: Grouped BarChart of Quota vs Actual per Seller */}
            <div className="lg:col-span-5 bg-slate-50/70 rounded-xl p-4 border border-slate-200/80">
              <div className="mb-3">
                <h3 className="text-sm font-bold text-slate-900">
                  Comparativa en Tiempo Real: Cuota vs. Venta por Vendedor
                </h3>
                <p className="text-[11px] text-slate-500">
                  Importes en Soles (S/.) sincronizados desde los pedidos activos
                </p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={salesForceRealtimeStats}
                    margin={{ top: 8, right: 10, left: 0, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="codeLabel"
                      tick={{ fontSize: 10, fill: '#334155', fontWeight: 600 }}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      tickFormatter={v => `S/${v}`}
                    />
                    <Tooltip
                      formatter={(val: unknown) => [formatCurrencySoles(Number(val) || 0), '']}
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar
                      dataKey="quotaSoles"
                      name="Cuota Objetivo (S/.)"
                      fill="#94a3b8"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="soldSoles"
                      name="Venta en Vivo (S/.)"
                      fill="#059669"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right 7 Cols: Live Salesperson Progress Table & Firebase Role Manager */}
            <div className="lg:col-span-7 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 pr-3">Vendedor / Zona</th>
                    <th className="py-2.5 px-2">Nivel Firebase</th>
                    <th className="py-2.5 px-2 text-right">Venta / Cuota</th>
                    <th className="py-2.5 px-2">Progreso en Vivo</th>
                    <th className="py-2.5 pl-2 text-right">Inspeccionar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {salesForceRealtimeStats.map(row => {
                    const isFocused = sellerFilter === row.seller.sellerCode;
                    return (
                      <tr
                        key={row.seller.id}
                        className={isFocused ? 'bg-emerald-50/60' : 'hover:bg-slate-50/80'}
                      >
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[11px] font-bold text-emerald-700">
                              {row.seller.sellerCode}
                            </span>
                            <span className="font-bold text-slate-900">
                              {row.shortName}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate max-w-[190px]">
                            {row.seller.assignedZone}
                          </div>
                        </td>

                        {/* Direct Firebase Access Level Selector */}
                        <td className="py-3 px-2">
                          <select
                            value={row.seller.role}
                            onChange={e =>
                              handleChangeAccessLevel(
                                row.seller.id,
                                row.shortName,
                                e.target.value as SalesRole
                              )
                            }
                            className={`px-2 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
                              row.seller.role === 'supervisor' || row.seller.role === 'admin'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            <option value="supervisor">Supervisor</option>
                            <option value="vendedor">Vendedor</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>

                        <td className="py-3 px-2 text-right tabular-nums">
                          <div className="font-extrabold text-emerald-700">
                            {formatCurrencySoles(row.soldSoles)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Meta: {formatCurrencySoles(row.quotaSoles)}
                          </div>
                        </td>

                        <td className="py-3 px-2 min-w-[130px]">
                          <div className="flex items-center justify-between text-[11px] font-bold mb-1 tabular-nums">
                            <span
                              className={
                                row.progressPct >= 100
                                  ? 'text-emerald-700'
                                  : row.progressPct >= 50
                                  ? 'text-amber-600'
                                  : 'text-slate-700'
                              }
                            >
                              {row.progressPct}%
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {row.ordersCount} ped · {row.attendedCount}/{row.assignedCount} cli
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                row.progressPct >= 100
                                  ? 'bg-emerald-600'
                                  : row.progressPct >= 50
                                  ? 'bg-amber-500'
                                  : 'bg-slate-500'
                              }`}
                              style={{ width: `${Math.min(100, row.progressPct)}%` }}
                            />
                          </div>
                        </td>

                        <td className="py-3 pl-2 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              setSellerFilter(
                                isFocused ? 'all' : row.seller.sellerCode
                              )
                            }
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                              isFocused
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            <Eye className="w-3 h-3" />
                            <span>{isFocused ? 'Ver Todos' : 'Filtrar'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Live Order Activity Stream across the Sales Force */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Últimos Pedidos Emitidos en Tiempo Real por la Fuerza de Ventas
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('cuotas')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Ir a Cuotas y Cierre Detallado</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {activeOrders.slice(0, 3).map(ord => (
                <div
                  key={ord.id}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="font-mono font-bold text-emerald-700">
                        [{ord.sellerCode || 'VEN-001'}]
                      </span>
                      <span className="font-semibold text-slate-700 truncate">
                        {ord.sellerName.split('(')[0]}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 truncate mt-0.5">
                      {ord.customerName}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {ord.orderNumber} · {ord.routeDay}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-extrabold text-emerald-700 tabular-nums">
                      {formatCurrencySoles(ord.total)}
                    </div>
                    <button
                      type="button"
                      onClick={() => openTicketModal(ord)}
                      className="text-[11px] font-semibold text-slate-700 hover:text-emerald-700 underline cursor-pointer mt-0.5"
                    >
                      Ver Ticket
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Vista de Monitoreo Global Reservada para Usuarios con Rol &ldquo;Supervisor&rdquo;
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
                Tu perfil actual en Firebase (<code>{currentSalesUser?.sellerCode}</code>) tiene nivel de acceso <strong>Vendedor</strong>, por lo que este Dashboard muestra únicamente el avance de tu ruta asignada.
              </p>
            </div>
          </div>
          {salesUsers.find(u => u.role === 'supervisor' || u.role === 'admin') && (
            <button
              type="button"
              onClick={() => {
                const sup = salesUsers.find(
                  u => u.role === 'supervisor' || u.role === 'admin'
                );
                if (sup) {
                  loginAsDemoUser(sup);
                  setSellerFilter('all');
                }
              }}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Cambiar a Vista de Supervisor</span>
            </button>
          )}
        </div>
      )}

      {/* Main Charts Row: Top Products (Recharts Horizontal Bar) & Sales by Route Day (Recharts Bar) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 7 Cols: Productos Más Vendidos */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Productos Más Vendidos
                </h2>
                <p className="text-xs text-slate-500">
                  Ranking de productos líderes según pedidos emitidos ({scope === 'day' ? selectedRouteDay : 'Semana completa'})
                </p>
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs self-start">
                <button
                  type="button"
                  onClick={() => setTopMetric('revenue')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    topMetric === 'revenue'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Por Soles (S/.)
                </button>
                <button
                  type="button"
                  onClick={() => setTopMetric('quantity')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    topMetric === 'quantity'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Por Cantidad
                </button>
              </div>
            </div>

            {topProductsData.length === 0 ? (
              <div className="h-72 flex flex-col items-center justify-center text-center text-slate-400">
                <Package className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-xs font-medium text-slate-600">
                  Aún no hay productos vendidos en este filtro
                </p>
                <button
                  type="button"
                  onClick={() => setScope('week')}
                  className="mt-2 text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
                >
                  Ver acumulado de toda la semana
                </button>
              </div>
            ) : (
              <div className="h-72 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topProductsData}
                    layout="vertical"
                    margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickFormatter={val => (topMetric === 'revenue' ? `S/${val}` : `${val}`)}
                    />
                    <YAxis
                      type="category"
                      dataKey="shortName"
                      width={135}
                      tick={{ fontSize: 11, fill: '#0f172a', fontWeight: 600 }}
                    />
                    <Tooltip
                      formatter={(value: unknown) => {
                        const num = Number(value) || 0;
                        return topMetric === 'revenue'
                          ? [formatCurrencySoles(num), 'Total Vendido']
                          : [`${num} unidades`, 'Cantidad Vendida'];
                      }}
                      labelFormatter={label => `Producto: ${String(label)}`}
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                      }}
                    />
                    <Bar
                      dataKey={topMetric === 'revenue' ? 'revenue' : 'quantity'}
                      fill="#059669"
                      radius={[0, 6, 6, 0]}
                      barSize={22}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Líder actual:{' '}
              <strong className="text-slate-900">
                {topProductsData[0]
                  ? `[${topProductsData[0].code}] ${topProductsData[0].shortName}`
                  : 'Sin registros'}
              </strong>
            </span>
            <button
              type="button"
              onClick={() => setActiveTab('productos')}
              className="font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
            >
              <span>Ver Catálogo</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right 5 Cols: Ventas por Día de Ruta (Lunes a Sábado) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                Ventas por Día de Programación (Lun - Sáb)
              </h2>
              <p className="text-xs text-slate-500">
                Comparativa de ingresos en Soles (S/.) según las rutas semanales
              </p>
            </div>

            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={salesByDayData}
                  margin={{ top: 10, right: 12, left: 0, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="shortDay"
                    tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickFormatter={val => `S/${val}`}
                  />
                  <Tooltip
                    formatter={(value: unknown) => [
                      formatCurrencySoles(Number(value) || 0),
                      'Ventas en Ruta',
                    ]}
                    labelFormatter={label => `Ruta: ${String(label)}`}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="ventas" radius={[6, 6, 0, 0]} barSize={30}>
                    {salesByDayData.map(entry => (
                      <Cell
                        key={entry.day}
                        fill={entry.day === selectedRouteDay ? '#059669' : '#0f172a'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Barra verde indica el día sincronizado ({selectedRouteDay})</span>
            <button
              type="button"
              onClick={() => setActiveTab('rutero')}
              className="font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
            >
              <span>Ir a Rutas</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row: Category/Payment Donut Chart & Detailed Top Products / Recent Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 5 Cols: Distribución por Categoría o Medio de Pago */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Distribución de Ingresos
                </h2>
                <p className="text-xs text-slate-500">
                  Participación porcentual en Soles (S/.)
                </p>
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setBreakdownMode('category')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    breakdownMode === 'category'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Categorías
                </button>
                <button
                  type="button"
                  onClick={() => setBreakdownMode('payment')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    breakdownMode === 'payment'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Pagos
                </button>
              </div>
            </div>

            {distributionData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-xs text-slate-400">
                Sin datos para este periodo
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4 pt-3">
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distributionData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                      >
                        {distributionData.map((entry, idx) => (
                          <Cell
                            key={entry.name}
                            fill={CHART_COLORS[idx % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: unknown) => formatCurrencySoles(Number(val) || 0)}
                        contentStyle={{
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 text-xs">
                  {distributionData.map((item, idx) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-100 last:border-none"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-xs shrink-0"
                          style={{
                            backgroundColor: CHART_COLORS[idx % CHART_COLORS.length],
                          }}
                        />
                        <span className="font-medium text-slate-700 truncate">
                          {item.name}
                        </span>
                      </div>
                      <div className="text-right tabular-nums shrink-0">
                        <span className="font-bold text-slate-900">
                          {formatCurrencySoles(item.value)}
                        </span>
                        <span className="text-slate-400 ml-1">({item.pct}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right 7 Cols: Tabla Detallada de Productos Más Vendidos & Últimos Tickets */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Detalle de Productos Líderes y Tickets Recientes
                </h2>
                <p className="text-xs text-slate-500">
                  Desglose por código de producto, unidades despachadas e importe total en Soles
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('pedidos')}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer whitespace-nowrap shrink-0"
              >
                Ver Todos los Tickets
              </button>
            </div>

            <div className="overflow-x-auto mt-3">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2 pr-3 font-semibold">Código</th>
                    <th className="py-2 px-3 font-semibold">Producto</th>
                    <th className="py-2 px-3 font-semibold text-right">Cant. Vendida</th>
                    <th className="py-2 pl-3 font-semibold text-right">Total Soles (S/.)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topProductsData.slice(0, 5).map(prod => (
                    <tr key={prod.code} className="hover:bg-slate-50/80">
                      <td className="py-2.5 pr-3 font-mono font-bold text-slate-800">
                        {prod.code}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-900">{prod.name}</span>
                        <span className="text-slate-400 ml-1.5">· {prod.category}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-800 tabular-nums">
                        {prod.quantity} {prod.unit}
                      </td>
                      <td className="py-2.5 pl-3 text-right font-extrabold text-emerald-700 tabular-nums">
                        {formatCurrencySoles(prod.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Orders Quick Strip */}
          {activeOrders.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="text-slate-500">
                Último ticket emitido:{' '}
                <strong className="text-slate-900">
                  {activeOrders[0].orderNumber} — {activeOrders[0].customerName} (
                  {formatCurrencySoles(activeOrders[0].total)})
                </strong>
              </div>
              <button
                type="button"
                onClick={() => openTicketModal(activeOrders[0])}
                className="inline-flex items-center gap-1 font-bold text-slate-900 hover:text-emerald-700 cursor-pointer"
              >
                <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                <span>Abrir Último Ticket</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
