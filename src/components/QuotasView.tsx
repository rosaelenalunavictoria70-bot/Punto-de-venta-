import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { ROUTE_DAYS, formatCurrencySoles, getTodayRouteDay } from '../data/initialData';
import { ProductCategory } from '../types';
import {
  Target,
  TrendingUp,
  ShieldCheck,
  Lock,
  CloudUpload,
  Edit3,
  Save,
  Database,
  ShoppingCart,
  CheckCircle2,
} from 'lucide-react';

export const QuotasView: React.FC = () => {
  const {
    orders,
    products,
    customers,
    salesUsers,
    currentSalesUser,
    loginAsDemoUser,
    selectedRouteDay,
    setSelectedRouteDay,
    quotaConfig,
    updateQuotaConfig,
    updateCustomerQuota,
    updateSalesUser,
    setPosCustomer,
    setActiveTab,
    syncAllToCloud,
    isSyncing,
    firebaseUser,
    lastSyncedAt,
  } = useApp();

  const [viewScope, setViewScope] = useState<'day' | 'all'>('day');
  const [activeSubTab, setActiveSubTab] = useState<'general' | 'categorias' | 'clientes' | 'auditoria'>('general');
  const [editingGeneralGoal, setEditingGeneralGoal] = useState(false);
  const [tempDailyGoal, setTempDailyGoal] = useState(String(quotaConfig.dailyGeneralGoalSoles));
  const [tempWeeklyGoal, setTempWeeklyGoal] = useState(String(quotaConfig.weeklyGeneralGoalSoles));
  const [editingCat, setEditingCat] = useState<ProductCategory | null>(null);
  const [tempCatSoles, setTempCatSoles] = useState('');
  const [tempCatUnits, setTempCatUnits] = useState('');
  const [editingCustomerId, setEditingCustomerId] = useState(null as string | null);
  const [tempCustQuota, setTempCustQuota] = useState('');
  const [editingSellerId, setEditingSellerId] = useState(null as string | null);
  const [tempSellerGoal, setTempSellerGoal] = useState('');
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const isSupervisorOrAdmin =
    currentSalesUser?.role === 'admin' || currentSalesUser?.role === 'supervisor';

  const todayRealDay = getTodayRouteDay();

  // Filter valid orders (exclude cancelled)
  const validOrders = useMemo(() => {
    return orders.filter(o => {
      if (o.status === 'cancelado') return false;
      if (viewScope === 'day' && o.routeDay !== selectedRouteDay) return false;
      return true;
    });
  }, [orders, viewScope, selectedRouteDay]);

  // 1. General Quota Calculations (Objetivo Diario & Avance al Cierre del Día)
  const activeGeneralGoal =
    viewScope === 'day'
      ? quotaConfig.dailyGeneralGoalSoles
      : quotaConfig.weeklyGeneralGoalSoles;

  const totalSalesSoles = useMemo(
    () => validOrders.reduce((acc, o) => acc + o.total, 0),
    [validOrders]
  );

  const collectedSalesSoles = useMemo(
    () =>
      validOrders
        .filter(o => o.status === 'entregado_y_cobrado')
        .reduce((acc, o) => acc + o.total, 0),
    [validOrders]
  );

  const pendingCollectionSoles = Math.max(0, totalSalesSoles - collectedSalesSoles);
  const generalProgressPct =
    activeGeneralGoal > 0 ? Math.round((totalSalesSoles / activeGeneralGoal) * 100) : 0;
  const remainingForClosingSoles = Math.max(0, activeGeneralGoal - totalSalesSoles);
  const surplusSoles = Math.max(0, totalSalesSoles - activeGeneralGoal);

  // 2. Category Quotas Calculation
  const productCategoryLookup = useMemo(() => {
    const map = new Map<string, ProductCategory>();
    products.forEach(p => {
      map.set(p.id, p.category);
      map.set(p.code, p.category);
    });
    return map;
  }, [products]);

  const categoryProgressList = useMemo(() => {
    const multiplier = viewScope === 'all' ? 6 : 1;
    const actualByCat = new Map<ProductCategory, { actualSoles: number; actualUnits: number }>();

    validOrders.forEach(ord => {
      ord.items.forEach(item => {
        const cat =
          productCategoryLookup.get(item.productId) ||
          productCategoryLookup.get(item.productCode) ||
          'Abarrotes';
        const prev = actualByCat.get(cat) || { actualSoles: 0, actualUnits: 0 };
        actualByCat.set(cat, {
          actualSoles: prev.actualSoles + item.subtotal,
          actualUnits: prev.actualUnits + item.quantity,
        });
      });
    });

    return quotaConfig.categoryQuotas.map(cq => {
      const stats = actualByCat.get(cq.category) || { actualSoles: 0, actualUnits: 0 };
      const targetSoles = cq.dailyGoalSoles * multiplier;
      const targetUnits = cq.dailyGoalUnits * multiplier;
      const pctSoles = targetSoles > 0 ? Math.round((stats.actualSoles / targetSoles) * 100) : 0;
      const diffSoles = stats.actualSoles - targetSoles;

      return {
        category: cq.category,
        dailyGoalSoles: cq.dailyGoalSoles,
        dailyGoalUnits: cq.dailyGoalUnits,
        targetSoles,
        targetUnits,
        actualSoles: Number(stats.actualSoles.toFixed(2)),
        actualUnits: stats.actualUnits,
        pctSoles,
        diffSoles,
      };
    });
  }, [quotaConfig.categoryQuotas, validOrders, productCategoryLookup, viewScope]);

  // 3. Customer Quotas Calculation
  const customerQuotaRows = useMemo(() => {
    const targetCustomers =
      viewScope === 'day'
        ? customers.filter(c => c.routeDay === selectedRouteDay)
        : customers;

    return targetCustomers.map(cust => {
      const custOrders = validOrders.filter(
        o => o.customerId === cust.id || o.customerCode === cust.code
      );
      const actualSoles = custOrders.reduce((acc, o) => acc + o.total, 0);
      const quotaSoles = cust.dailyPurchaseQuotaSoles ?? 250;
      const pct = quotaSoles > 0 ? Math.round((actualSoles / quotaSoles) * 100) : 0;
      const remaining = Math.max(0, quotaSoles - actualSoles);

      return {
        customer: cust,
        quotaSoles,
        actualSoles,
        ordersCount: custOrders.length,
        pct,
        remaining,
      };
    });
  }, [customers, validOrders, viewScope, selectedRouteDay]);

  // 4. Seller Closing Summary
  const sellerClosingRows = useMemo(() => {
    return salesUsers
      .filter(u => u.active)
      .map(seller => {
        const sellerOrders = validOrders.filter(o => o.sellerCode === seller.sellerCode);
        const actualSoles = sellerOrders.reduce((acc, o) => acc + o.total, 0);
        const targetSoles =
          viewScope === 'all' ? seller.salesGoalSoles * 6 : seller.salesGoalSoles;
        const pct = targetSoles > 0 ? Math.round((actualSoles / targetSoles) * 100) : 0;
        const assignedCustomers = customers.filter(c =>
          viewScope === 'day'
            ? c.routeDay === selectedRouteDay && c.assignedSellerCode === seller.sellerCode
            : c.assignedSellerCode === seller.sellerCode
        );
        const visitedWithOrder = assignedCustomers.filter(
          c => c.visitStatus === 'visited_order'
        ).length;

        return {
          seller,
          targetSoles,
          actualSoles,
          ordersCount: sellerOrders.length,
          pct,
          assignedCount: assignedCustomers.length,
          visitedWithOrder,
          remainingSoles: Math.max(0, targetSoles - actualSoles),
        };
      });
  }, [salesUsers, validOrders, customers, viewScope, selectedRouteDay]);

  // Handlers
  const handleSaveGeneralGoal = () => {
    const dGoal = Math.max(100, Number(tempDailyGoal) || 2500);
    const wGoal = Math.max(500, Number(tempWeeklyGoal) || dGoal * 6);
    updateQuotaConfig({
      dailyGeneralGoalSoles: dGoal,
      weeklyGeneralGoalSoles: wGoal,
    });
    setEditingGeneralGoal(false);
  };

  const handleSaveCategoryGoal = (category: ProductCategory) => {
    const newSoles = Math.max(0, Number(tempCatSoles) || 0);
    const newUnits = Math.max(0, Number(tempCatUnits) || 0);
    const updatedList = quotaConfig.categoryQuotas.map(c =>
      c.category === category
        ? { ...c, dailyGoalSoles: newSoles, dailyGoalUnits: newUnits }
        : c
    );
    updateQuotaConfig({ categoryQuotas: updatedList });
    setEditingCat(null);
  };

  const handleSaveCustomerQuota = (customerId: string) => {
    const val = Math.max(0, Number(tempCustQuota) || 0);
    updateCustomerQuota(customerId, val);
    setEditingCustomerId(null);
  };

  const handleSaveSellerQuota = (sellerId: string) => {
    const val = Math.max(0, Number(tempSellerGoal) || 0);
    updateSalesUser(sellerId, { salesGoalSoles: val });
    setEditingSellerId(null);
  };

  const handleSyncCloudNow = async () => {
    const res = await syncAllToCloud();
    setSyncFeedback(res.message);
    setTimeout(() => setSyncFeedback(null), 5000);
  };

  // If logged in as Vendedor (non-supervisor), show personal quota summary + Supervisor Lock notice
  if (!isSupervisorOrAdmin) {
    const myQuota = currentSalesUser?.salesGoalSoles || 1500;
    const myOrders = validOrders.filter(o => o.sellerCode === currentSalesUser?.sellerCode);
    const myActual = myOrders.reduce((acc, o) => acc + o.total, 0);
    const myPct = myQuota > 0 ? Math.round((myActual / myQuota) * 100) : 0;
    const adminUser = salesUsers.find(u => u.role === 'admin' || u.role === 'supervisor');

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div>
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                Mi Avance Personal de Ruta ({selectedRouteDay})
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
                Hola, {currentSalesUser?.fullName}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Código: <strong>{currentSalesUser?.sellerCode}</strong> · Zona: {currentSalesUser?.assignedZone}
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500">Mi Objetivo Diario</div>
              <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
                {formatCurrencySoles(myQuota)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="text-xs text-slate-500 font-medium">Mi Avance Hoy</div>
              <div className="text-2xl font-bold text-emerald-700 tabular-nums mt-1">
                {formatCurrencySoles(myActual)}
              </div>
              <div className="text-xs text-slate-500 mt-1">{myOrders.length} pedidos emitidos</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="text-xs text-slate-500 font-medium">Faltante para Cierre</div>
              <div className="text-2xl font-bold text-amber-600 tabular-nums mt-1">
                {formatCurrencySoles(Math.max(0, myQuota - myActual))}
              </div>
              <div className="text-xs text-slate-500 mt-1">Restante para llegar al 100%</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="text-xs text-slate-500 font-medium">% Cumplimiento</div>
              <div className="text-2xl font-bold text-slate-900 tabular-nums mt-1">{myPct}%</div>
              <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-emerald-600 h-full transition-all"
                  style={{ width: `${Math.min(100, myPct)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Supervisor Restricted Notice */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <Lock className="w-4 h-4" />
                <span>Módulo Exclusivo para Supervisores y Gerencia</span>
              </div>
              <h2 className="text-lg font-bold">
                Control Maestro de Cuotas Generales, Categorías, Clientes y Base de Datos
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Estás conectado con un perfil de <strong>Vendedor de Ruta ({currentSalesUser?.sellerCode})</strong>. Por seguridad comercial, solo los usuarios con rol <strong>Supervisor</strong> o <strong>Administrador</strong> pueden modificar las cuotas generales, auditar a todos los vendedores y verificar el cierre del día.
              </p>
            </div>
            {adminUser && (
              <button
                type="button"
                onClick={() => loginAsDemoUser(adminUser)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors shrink-0 cursor-pointer flex items-center gap-2 shadow-xs"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Entrar como Supervisora ({adminUser.fullName.split(' ')[0]})</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Supervisor Header & Controls */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1">
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                <ShieldCheck className="w-3.5 h-3.5" />
                Panel Exclusivo de Supervisión Comercial
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Supervisora activa: <strong className="text-slate-800">{currentSalesUser?.fullName}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Ruta activa: <strong className="text-emerald-700 uppercase">{selectedRouteDay}</strong>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Control de Cuotas, Objetivos y Avance al Cierre del Día
            </h1>
          </div>

          {/* Scope & Cloud Sync Controls */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setViewScope('day')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                  viewScope === 'day'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cierre Diario ({selectedRouteDay})
              </button>
              <button
                type="button"
                onClick={() => setViewScope('all')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                  viewScope === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Acumulado Semanal
              </button>
            </div>

            <button
              type="button"
              onClick={() => void handleSyncCloudNow()}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              <CloudUpload className="w-4 h-4" />
              <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar en la Nube'}</span>
            </button>
          </div>
        </div>

        {syncFeedback && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{syncFeedback}</span>
          </div>
        )}

        {/* Route Day Quick Selector Strip */}
        <div className="pt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-semibold text-slate-500 mr-1">Día a auditar:</span>
            {ROUTE_DAYS.map(day => {
              const active = viewScope === 'day' && selectedRouteDay === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    setSelectedRouteDay(day);
                    setViewScope('day');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    active
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {day} {day === todayRealDay ? '(Hoy)' : ''}
                </button>
              );
            })}
          </div>

          {/* Sub-navigation Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveSubTab('general')}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeSubTab === 'general'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1. Cuota General y Cierre
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('categorias')}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeSubTab === 'categorias'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2. Cuota por Categorías
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('clientes')}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeSubTab === 'clientes'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              3. Cuota por Cliente ({customerQuotaRows.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('auditoria')}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeSubTab === 'auditoria'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              4. Base de Datos y Nube
            </button>
          </div>
        </div>
      </div>

      {/* KPI Closing Strip (Always Visible) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Objetivo Diario / Semanal */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {viewScope === 'day' ? `Objetivo Diario (${selectedRouteDay})` : 'Objetivo Semanal (Lun-Sáb)'}
            </span>
            <button
              type="button"
              onClick={() => {
                setTempDailyGoal(String(quotaConfig.dailyGeneralGoalSoles));
                setTempWeeklyGoal(String(quotaConfig.weeklyGeneralGoalSoles));
                setEditingGeneralGoal(!editingGeneralGoal);
              }}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editar Meta</span>
            </button>
          </div>

          {editingGeneralGoal ? (
            <div className="mt-2 space-y-2 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-[11px] text-slate-500 font-medium">
                  Meta Diaria General (S/.)
                </label>
                <input
                  type="number"
                  value={tempDailyGoal}
                  onChange={e => setTempDailyGoal(e.target.value)}
                  className="w-full px-2.5 py-1 text-sm font-bold border border-slate-300 rounded-lg mt-0.5"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 font-medium">
                  Meta Semanal General (S/.)
                </label>
                <input
                  type="number"
                  value={tempWeeklyGoal}
                  onChange={e => setTempWeeklyGoal(e.target.value)}
                  className="w-full px-2.5 py-1 text-sm font-bold border border-slate-300 rounded-lg mt-0.5"
                />
              </div>
              <button
                type="button"
                onClick={handleSaveGeneralGoal}
                className="w-full py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 cursor-pointer flex items-center justify-center gap-1"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Objetivos</span>
              </button>
            </div>
          ) : (
            <div className="mt-2">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
                {formatCurrencySoles(activeGeneralGoal)}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Meta establecida por Supervisión General
              </div>
            </div>
          )}
        </div>

        {/* Card 2: Avance Real al Cierre del Día */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Avance al Cierre del Día
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 tabular-nums">
              {formatCurrencySoles(totalSalesSoles)}
            </div>
            <div className="text-xs text-slate-600 mt-1">
              Cobrado: <strong className="tabular-nums">{formatCurrencySoles(collectedSalesSoles)}</strong> · Por cobrar:{' '}
              <strong className="tabular-nums">{formatCurrencySoles(pendingCollectionSoles)}</strong>
            </div>
          </div>
        </div>

        {/* Card 3: Brecha / Saldo para Cierre */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {surplusSoles > 0 ? 'Superávit sobre Cuota' : 'Faltante para Cierre'}
            </span>
            <Target className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2">
            {surplusSoles > 0 ? (
              <>
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tabular-nums">
                  +{formatCurrencySoles(surplusSoles)}
                </div>
                <div className="text-xs text-emerald-700 font-medium mt-1">
                  ¡Objetivo superado exitosamente!
                </div>
              </>
            ) : (
              <>
                <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 tabular-nums">
                  {formatCurrencySoles(remainingForClosingSoles)}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Monto pendiente para llegar al 100% hoy
                </div>
              </>
            )}
          </div>
        </div>

        {/* Card 4: % Cumplimiento General */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              % Cumplimiento Cierre
            </span>
            <span className="text-xs font-bold text-slate-700 tabular-nums">
              {validOrders.length} pedidos
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
                {generalProgressPct}%
              </span>
              <span className="text-xs text-slate-500">
                Meta: 100%
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full transition-all ${
                  generalProgressPct >= 100
                    ? 'bg-emerald-600'
                    : generalProgressPct >= 60
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, generalProgressPct)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: CUOTA GENERAL Y AVANCE POR VENDEDOR AL CIERRE */}
      {activeSubTab === 'general' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Avance de Cuota por Vendedor al Cierre del Día ({viewScope === 'day' ? selectedRouteDay : 'Semanal'})
                </h2>
                <p className="text-xs text-slate-500">
                  Verifica cuánto ha vendido cada preventista frente a su cuota diaria asignada. Puedes ajustar la cuota de cada vendedor haciendo clic en el ícono de edición.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-3">Código / Vendedor</th>
                    <th className="py-3 px-3">Zona Asignada</th>
                    <th className="py-3 px-3 text-right">Cuota Objetivo (S/.)</th>
                    <th className="py-3 px-3 text-right">Venta al Cierre (S/.)</th>
                    <th className="py-3 px-3 text-right">Faltante (S/.)</th>
                    <th className="py-3 px-3 text-center">Clientes Visitados</th>
                    <th className="py-3 px-3">Avance (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {sellerClosingRows.map(row => (
                    <tr key={row.seller.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-3">
                        <div className="font-mono text-[11px] font-bold text-emerald-700">
                          {row.seller.sellerCode}
                        </div>
                        <div className="font-bold text-slate-900">{row.seller.fullName}</div>
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 max-w-xs truncate">
                        {row.seller.assignedZone}
                      </td>
                      <td className="py-3.5 px-3 text-right tabular-nums">
                        {editingSellerId === row.seller.id ? (
                          <div className="inline-flex items-center gap-1 justify-end">
                            <input
                              type="number"
                              value={tempSellerGoal}
                              onChange={e => setTempSellerGoal(e.target.value)}
                              className="w-24 px-2 py-1 text-right font-bold border border-slate-300 rounded-md"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveSellerQuota(row.seller.id)}
                              className="px-2 py-1 bg-emerald-600 text-white rounded-md text-[11px] font-bold cursor-pointer"
                            >
                              OK
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            <span className="font-bold text-slate-900">
                              {formatCurrencySoles(row.targetSoles)}
                            </span>
                            {viewScope === 'day' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingSellerId(row.seller.id);
                                  setTempSellerGoal(String(row.seller.salesGoalSoles));
                                }}
                                className="text-slate-400 hover:text-emerald-600 cursor-pointer"
                                title="Editar cuota diaria del vendedor"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right font-extrabold text-emerald-700 tabular-nums">
                        {formatCurrencySoles(row.actualSoles)}
                        <span className="block text-[10px] font-normal text-slate-400">
                          {row.ordersCount} pedidos
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-semibold text-amber-600 tabular-nums">
                        {row.remainingSoles > 0 ? formatCurrencySoles(row.remainingSoles) : 'S/ 0.00'}
                      </td>
                      <td className="py-3.5 px-3 text-center tabular-nums">
                        <span className="font-bold text-slate-800">{row.visitedWithOrder}</span>
                        <span className="text-slate-400"> / {row.assignedCount}</span>
                      </td>
                      <td className="py-3.5 px-3 min-w-[140px]">
                        <div className="flex items-center justify-between text-xs font-bold mb-1 tabular-nums">
                          <span
                            className={
                              row.pct >= 100
                                ? 'text-emerald-700'
                                : row.pct >= 50
                                ? 'text-amber-600'
                                : 'text-slate-700'
                            }
                          >
                            {row.pct}%
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {row.pct >= 100 ? 'Meta Lograda' : 'En progreso'}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              row.pct >= 100
                                ? 'bg-emerald-600'
                                : row.pct >= 50
                                ? 'bg-amber-500'
                                : 'bg-slate-400'
                            }`}
                            style={{ width: `${Math.min(100, row.pct)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: CUOTA POR CATEGORÍA DE PRODUCTOS */}
      {activeSubTab === 'categorias' && (
        <div className="space-y-6">
          {/* Recharts BarChart comparing Target vs Actual by Category */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Gráfico Comparativo: Cuota Objetivo vs. Venta Real por Categoría (S/.)
                </h2>
                <p className="text-xs text-slate-500">
                  Monitoreo en tiempo real del avance de líneas de producto ({viewScope === 'day' ? selectedRouteDay : 'Acumulado Semanal'})
                </p>
              </div>
            </div>

            <div className="h-72 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryProgressList}
                  margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#475569' }} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#475569' }}
                    tickFormatter={v => `S/${v}`}
                  />
                  <Tooltip
                    formatter={(value: unknown) => [formatCurrencySoles(Number(value) || 0), '']}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar
                    dataKey="targetSoles"
                    name="Cuota Objetivo (S/.)"
                    fill="#94a3b8"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="actualSoles"
                    name="Venta Real al Cierre (S/.)"
                    fill="#059669"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Quotas Table & Editor */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <div className="pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Detalle y Configuración de Cuotas por Categoría de Productos
              </h3>
              <p className="text-xs text-slate-500">
                Haz clic en &ldquo;Editar Cuota&rdquo; en cualquier categoría para cambiar su objetivo diario en Soles o Unidades.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {categoryProgressList.map(cat => (
                <div
                  key={cat.category}
                  className="p-4 rounded-xl border border-slate-200 flex flex-col justify-between bg-slate-50/40"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-slate-900">{cat.category}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCat(cat.category);
                          setTempCatSoles(String(cat.dailyGoalSoles));
                          setTempCatUnits(String(cat.dailyGoalUnits));
                        }}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Editar Cuota</span>
                      </button>
                    </div>

                    {editingCat === cat.category ? (
                      <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                        <div>
                          <label className="block text-[11px] text-slate-500">
                            Cuota Diaria en Soles (S/.)
                          </label>
                          <input
                            type="number"
                            value={tempCatSoles}
                            onChange={e => setTempCatSoles(e.target.value)}
                            className="w-full px-2 py-1 text-xs font-bold border border-slate-300 rounded mt-0.5"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-500">
                            Meta Diaria en Unidades/Cajas
                          </label>
                          <input
                            type="number"
                            value={tempCatUnits}
                            onChange={e => setTempCatUnits(e.target.value)}
                            className="w-full px-2 py-1 text-xs font-bold border border-slate-300 rounded mt-0.5"
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleSaveCategoryGoal(cat.category)}
                            className="flex-1 py-1 bg-emerald-600 text-white rounded text-xs font-bold cursor-pointer"
                          >
                            Guardar
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCat(null)}
                            className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs text-slate-500">Avance en Soles:</span>
                          <span className="text-base font-extrabold text-emerald-700 tabular-nums">
                            {formatCurrencySoles(cat.actualSoles)}{' '}
                            <span className="text-xs font-normal text-slate-400">
                              / {formatCurrencySoles(cat.targetSoles)}
                            </span>
                          </span>
                        </div>

                        <div className="flex items-baseline justify-between text-xs">
                          <span className="text-slate-500">Avance en Unidades/Cajas:</span>
                          <span className="font-bold text-slate-800 tabular-nums">
                            {cat.actualUnits} / {cat.targetUnits} unds
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/80">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-slate-700 tabular-nums">
                        {cat.pctSoles}% de la meta
                      </span>
                      <span className="text-[11px] text-slate-500 tabular-nums">
                        {cat.diffSoles >= 0
                          ? `Superávit +${formatCurrencySoles(cat.diffSoles)}`
                          : `Falta ${formatCurrencySoles(Math.abs(cat.diffSoles))}`}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          cat.pctSoles >= 100
                            ? 'bg-emerald-600'
                            : cat.pctSoles >= 50
                            ? 'bg-amber-500'
                            : 'bg-slate-400'
                        }`}
                        style={{ width: `${Math.min(100, cat.pctSoles)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: CUOTA DE LOS CLIENTES */}
      {activeSubTab === 'clientes' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Cuota de Compra por Cliente ({viewScope === 'day' ? `Ruta ${selectedRouteDay}` : 'Todos los Clientes'})
              </h2>
              <p className="text-xs text-slate-500">
                Asigna una cuota objetivo en Soles (S/.) a cada bodega o minimarket y verifica cuánto compró realmente al cierre del día.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-3">Código / Cliente</th>
                  <th className="py-3 px-3">Ruta / Vendedor</th>
                  <th className="py-3 px-3 text-right">Cuota del Cliente (S/.)</th>
                  <th className="py-3 px-3 text-right">Compra Hoy (S/.)</th>
                  <th className="py-3 px-3 text-right">Diferencia (S/.)</th>
                  <th className="py-3 px-3">Avance de Cuota</th>
                  <th className="py-3 px-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {customerQuotaRows.map(row => (
                  <tr key={row.customer.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-3">
                      <div className="font-mono text-[11px] font-bold text-slate-600">
                        {row.customer.code}
                      </div>
                      <div className="font-bold text-slate-900">{row.customer.name}</div>
                      <div className="text-[11px] text-slate-500">{row.customer.district}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800">{row.customer.routeDay}</span>
                      <span className="block text-[11px] text-slate-500">
                        Vendedor: {row.customer.assignedSellerCode || 'VEN-002'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums">
                      {editingCustomerId === row.customer.id ? (
                        <div className="inline-flex items-center gap-1 justify-end">
                          <input
                            type="number"
                            value={tempCustQuota}
                            onChange={e => setTempCustQuota(e.target.value)}
                            className="w-20 px-2 py-1 text-right font-bold border border-slate-300 rounded"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveCustomerQuota(row.customer.id)}
                            className="px-2 py-1 bg-emerald-600 text-white rounded text-[11px] font-bold cursor-pointer"
                          >
                            OK
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <span className="font-bold text-slate-900">
                            {formatCurrencySoles(row.quotaSoles)}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCustomerId(row.customer.id);
                              setTempCustQuota(String(row.quotaSoles));
                            }}
                            className="text-slate-400 hover:text-emerald-600 cursor-pointer"
                            title="Editar cuota de compra de este cliente"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-emerald-700 tabular-nums">
                      {formatCurrencySoles(row.actualSoles)}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold tabular-nums">
                      {row.remaining > 0 ? (
                        <span className="text-amber-600">Falta {formatCurrencySoles(row.remaining)}</span>
                      ) : (
                        <span className="text-emerald-700">Cumplió Meta</span>
                      )}
                    </td>
                    <td className="py-3 px-3 min-w-[130px]">
                      <div className="flex items-center justify-between text-[11px] font-bold mb-1 tabular-nums">
                        <span>{row.pct}%</span>
                        <span className="text-slate-400">
                          {row.actualSoles > 0 ? 'Con Pedido' : 'Sin Pedido'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            row.pct >= 100
                              ? 'bg-emerald-600'
                              : row.pct > 0
                              ? 'bg-amber-500'
                              : 'bg-slate-300'
                          }`}
                          style={{ width: `${Math.min(100, row.pct)}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setPosCustomer(row.customer);
                          setActiveTab('pos');
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        <ShoppingCart className="w-3 h-3" />
                        <span>Tomar Pedido</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: AUDITORÍA DE BASE DE DATOS EN LA NUBE (FIREBASE FIRESTORE) */}
      {activeSubTab === 'auditoria' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
                  <Database className="w-4 h-4" />
                  <span>Almacenamiento Híbrido Local + Google Firebase Cloud</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  Base de Datos en Tiempo Real (Firebase Firestore)
                </h2>
                <p className="text-xs text-slate-600 mt-1 max-w-3xl">
                  Cada pedido emitido por un vendedor guarda automáticamente el código del vendedor (<code>sellerCode</code>), el cliente, los productos y el importe en Soles tanto en el dispositivo como en las 4 colecciones seguras de <strong>Google Cloud Firestore</strong>.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => void handleSyncCloudNow()}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <CloudUpload className="w-4 h-4" />
                  <span>{isSyncing ? 'Sincronizando Nube...' : 'Sincronizar Todo a Firebase Ahora'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-5">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="font-mono text-xs font-bold text-emerald-700">/orders</div>
                <div className="text-xl font-extrabold text-slate-900 tabular-nums mt-1">
                  {orders.length} pedidos
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Guarda cada ticket con vendedor, cliente, ruta, productos y estado de cobro.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="font-mono text-xs font-bold text-emerald-700">/customers</div>
                <div className="text-xl font-extrabold text-slate-900 tabular-nums mt-1">
                  {customers.length} clientes
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Padrón de bodegas con RUC/DNI, dirección, día de ruta y vendedor asignado.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="font-mono text-xs font-bold text-emerald-700">/products</div>
                <div className="text-xl font-extrabold text-slate-900 tabular-nums mt-1">
                  {products.length} productos
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Catálogo mayorista con códigos, precios en Soles (S/.) y stock actualizado.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="font-mono text-xs font-bold text-emerald-700">/sales_users</div>
                <div className="text-xl font-extrabold text-slate-900 tabular-nums mt-1">
                  {salesUsers.length} usuarios
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Credenciales de acceso, rol (Supervisor o Vendedor) y cuotas individuales.
                </p>
              </div>
            </div>

            <div className="mt-5 p-4 rounded-xl bg-slate-900 text-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-bold text-white block">
                  Estado de Conexión Cloud Firestore: {firebaseUser ? `Conectado (${firebaseUser.email})` : 'Modo Híbrido Local'}
                </span>
                <span className="text-slate-400">
                  Última sincronización registrada: {lastSyncedAt || 'Lista para sincronizar'} · Proyecto Cloud: <code>gen-lang-client-0265265513</code>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('despliegue')}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
              >
                Abrir Panel de Conexión Cloud
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
