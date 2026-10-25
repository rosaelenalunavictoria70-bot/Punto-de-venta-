import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SalesUser, SalesRole } from '../types';
import { formatCurrencySoles } from '../data/initialData';
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  KeyRound,
  Shield,
  Phone,
  MapPin,
  LogOut,
  CheckCircle2,
  RefreshCw,
  Eye,
  EyeOff,
  UserCheck,
} from 'lucide-react';

export const SalesForceView: React.FC = () => {
  const {
    salesUsers,
    customers,
    orders,
    currentSalesUser,
    addSalesUser,
    updateSalesUser,
    deleteSalesUser,
    loginAsDemoUser,
    logoutSalesUser,
    firebaseUser,
    isSyncing,
    syncAllToCloud,
    signInWithGoogleCloud,
  } = useApp();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SalesUser | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    sellerCode: '',
    username: '',
    accessPin: '',
    fullName: '',
    role: 'vendedor' as SalesRole,
    phone: '',
    assignedZone: '',
    salesGoalSoles: 1500,
    active: true,
  });

  const handleOpenAdd = () => {
    setEditingUser(null);
    const nextNum = salesUsers.length + 1;
    setFormData({
      sellerCode: `VEN-${String(nextNum).padStart(3, '0')}`,
      username: `vendedor${nextNum}`,
      accessPin: `clave${nextNum}2026`,
      fullName: '',
      role: 'vendedor',
      phone: '',
      assignedZone: 'Lima',
      salesGoalSoles: 1500,
      active: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (sUser: SalesUser) => {
    setEditingUser(sUser);
    setFormData({
      sellerCode: sUser.sellerCode,
      username: sUser.username,
      accessPin: sUser.accessPin,
      fullName: sUser.fullName,
      role: sUser.role,
      phone: sUser.phone,
      assignedZone: sUser.assignedZone,
      salesGoalSoles: sUser.salesGoalSoles,
      active: sUser.active,
    });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.username.trim() || !formData.accessPin.trim()) {
      return;
    }

    if (editingUser) {
      updateSalesUser(editingUser.id, { ...formData });
    } else {
      addSalesUser({ ...formData });
    }
    setModalOpen(false);
  };

  const handleDelete = (sUser: SalesUser) => {
    if (salesUsers.length <= 1) {
      alert('Debe existir al menos un usuario administrador en el sistema.');
      return;
    }
    if (confirm(`¿Eliminar al usuario de ventas ${sUser.fullName} (${sUser.sellerCode})?`)) {
      deleteSalesUser(sUser.id);
    }
  };

  const toggleShowPin = (id: string) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCloudSync = async () => {
    if (!firebaseUser) {
      try {
        await signInWithGoogleCloud();
      } catch (e) {
        setSyncFeedback('Inicia sesión con Google para activar el respaldo en la nube.');
        return;
      }
    }
    const res = await syncAllToCloud();
    setSyncFeedback(res.message);
    setTimeout(() => setSyncFeedback(null), 5000);
  };

  // Total team metrics
  const totalTeamSales = orders
    .filter(o => o.status !== 'cancelado')
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Gestión Multi-Usuario</span>
            <span aria-hidden="true">·</span>
            <span>Sesión activa: <strong className="text-emerald-700">{currentSalesUser?.fullName} ({currentSalesUser?.sellerCode})</strong></span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Fuerza de Ventas: Usuarios, Contraseñas y Metas
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleCloudSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
            <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Equipo en Nube'}</span>
          </button>

          <button
            onClick={logoutSalesUser}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Probar Pantalla de Login</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Crear Usuario de Venta</span>
          </button>
        </div>
      </div>

      {syncFeedback && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* Team Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium mb-1">Total Fuerza de Ventas</div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">
            {salesUsers.length} <span className="text-xs font-normal text-slate-400">usuarios configurados</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium mb-1">Vendedores Activos en Ruta</div>
          <div className="text-2xl font-bold text-emerald-700 tabular-nums">
            {salesUsers.filter(u => u.active).length} <span className="text-xs font-normal text-slate-400">habilitados</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium mb-1">Preventa Total del Equipo</div>
          <div className="text-2xl font-bold text-emerald-600 tabular-nums">
            {formatCurrencySoles(totalTeamSales)}
          </div>
        </div>
      </div>

      {/* Sales Users Cards / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {salesUsers.map(sUser => {
          const isCurrent = currentSalesUser?.id === sUser.id;
          const assignedClientsCount = customers.filter(
            c => c.assignedSellerCode === sUser.sellerCode
          ).length;
          const sellerOrders = orders.filter(
            o =>
              o.status !== 'cancelado' &&
              (o.sellerCode === sUser.sellerCode || o.sellerName.includes(sUser.fullName))
          );
          const sellerTotalSoles = sellerOrders.reduce((sum, o) => sum + o.total, 0);
          const goalPct =
            sUser.salesGoalSoles > 0
              ? Math.min(100, Math.round((sellerTotalSoles / sUser.salesGoalSoles) * 100))
              : 0;

          return (
            <div
              key={sUser.id}
              className={`bg-white rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                isCurrent
                  ? 'border-emerald-500 ring-1 ring-emerald-500/20 shadow-xs'
                  : 'border-slate-200 shadow-xs'
              }`}
            >
              <div>
                {/* Top Row: Code, Name, Role */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                        {sUser.sellerCode}
                      </span>
                      <h3 className="text-base font-bold text-slate-900">
                        {sUser.fullName}
                      </h3>
                      {isCurrent && (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          En uso ahora
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <span className="capitalize font-semibold text-slate-700">
                        Rol: {sUser.role}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>Tel: {sUser.phone || 'Sin registrar'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(sUser)}
                      title="Editar usuario y contraseña"
                      className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(sUser)}
                      title="Eliminar vendedor"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Credentials Box */}
                <div className="my-3 p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Usuario de Acceso
                    </span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {sUser.username}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Contraseña / Clave
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-700 text-sm">
                        {showPasswords[sUser.id] ? sUser.accessPin : '••••••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleShowPin(sUser.id)}
                        className="text-slate-400 hover:text-slate-700 cursor-pointer"
                        title="Ver/Ocultar contraseña"
                      >
                        {showPasswords[sUser.id] ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Zone & KPIs */}
                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Zona: <strong className="text-slate-800">{sUser.assignedZone}</strong></span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 block">Clientes Ruta</span>
                      <span className="font-bold text-slate-900 tabular-nums text-sm">
                        {assignedClientsCount}
                      </span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 block">Pedidos</span>
                      <span className="font-bold text-slate-900 tabular-nums text-sm">
                        {sellerOrders.length}
                      </span>
                    </div>
                    <div className="p-2 bg-emerald-50/60 rounded-lg border border-emerald-100">
                      <span className="text-[10px] text-emerald-700 block">Vendido (S/.)</span>
                      <span className="font-bold text-emerald-800 tabular-nums text-sm">
                        {formatCurrencySoles(sellerTotalSoles)}
                      </span>
                    </div>
                  </div>

                  {/* Sales Goal Bar */}
                  <div className="pt-2">
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-500">
                        Meta Diaria: <strong>{formatCurrencySoles(sUser.salesGoalSoles)}</strong>
                      </span>
                      <span className="font-bold text-emerald-700 tabular-nums">{goalPct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full transition-all"
                        style={{ width: `${goalPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Estado: <strong className={sUser.active ? 'text-emerald-700' : 'text-rose-600'}>{sUser.active ? 'Activo' : 'Suspendido'}</strong>
                </span>

                {!isCurrent ? (
                  <button
                    onClick={() => loginAsDemoUser(sUser)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Cambiar a este Vendedor</span>
                  </button>
                ) : (
                  <span className="text-xs font-bold text-emerald-700">
                    ✓ Usuario Activo en Punto de Venta
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE / EDIT SALES USER MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingUser ? 'Editar Usuario de Fuerza de Ventas' : 'Crear Nuevo Usuario de Fuerza de Ventas'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Código de Vendedor *:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VEN-005"
                    value={formData.sellerCode}
                    onChange={e => setFormData({ ...formData, sellerCode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Rol en el Sistema *:
                  </label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value as SalesRole })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                  >
                    <option value="vendedor">Preventista / Vendedor de Ruta</option>
                    <option value="supervisor">Supervisor de Rutas</option>
                    <option value="admin">Administrador General</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Nombre Completo del Vendedor *:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Pedro Castillo Morales"
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-emerald-50/50 rounded-xl border border-emerald-200">
                <div>
                  <label className="block text-emerald-950 font-bold mb-1">
                    Usuario de Login *:
                  </label>
                  <input
                    type="text"
                    required
                    minLength={3}
                    placeholder="Ej: pedro.ruta"
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-emerald-950 font-bold mb-1">
                    Contraseña / Clave *:
                  </label>
                  <input
                    type="text"
                    required
                    minLength={4}
                    placeholder="Mínimo 4 caracteres"
                    value={formData.accessPin}
                    onChange={e => setFormData({ ...formData, accessPin: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Celular / WhatsApp *:
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="987654321"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Meta Diaria en Soles (S/.) *:
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    required
                    value={formData.salesGoalSoles}
                    onChange={e =>
                      setFormData({ ...formData, salesGoalSoles: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Zona / Distritos Asignados *:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Lima Norte - Comas / Carabayllo"
                  value={formData.assignedZone}
                  onChange={e => setFormData({ ...formData, assignedZone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="activeSeller"
                  checked={formData.active}
                  onChange={e => setFormData({ ...formData, active: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-600"
                />
                <label htmlFor="activeSeller" className="text-slate-700 font-semibold">
                  Cuenta habilitada para tomar pedidos
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  {editingUser ? 'Guardar Cambios' : 'Crear Vendedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
