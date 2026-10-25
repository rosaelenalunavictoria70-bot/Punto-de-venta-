import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Customer, RouteDay } from '../types';
import { ROUTE_DAYS } from '../data/initialData';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Phone,
  MapPin,
  ExternalLink,
  ShoppingCart,
  Calendar,
  X,
  Check,
  Building,
} from 'lucide-react';

export const CustomersView: React.FC = () => {
  const {
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    setPosCustomer,
    setActiveTab,
    selectedRouteDay,
    setSelectedRouteDay,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [dayFilter, setDayFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    ownerName: '',
    documentType: 'RUC' as 'DNI' | 'RUC',
    documentNumber: '',
    phone: '',
    address: '',
    district: 'Los Olivos, Lima',
    reference: '',
    routeDay: 'Lunes' as RouteDay,
    notes: '',
  });

  const filteredCustomers = customers.filter(c => {
    const matchesSearch =
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.documentNumber.includes(searchQuery);

    const matchesDay = dayFilter === 'all' || c.routeDay === dayFilter;

    return matchesSearch && matchesDay;
  });

  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    const nextCodeNum = customers.length + 1;
    setFormData({
      code: `CLI-${String(nextCodeNum).padStart(3, '0')}`,
      name: '',
      ownerName: '',
      documentType: 'DNI',
      documentNumber: '',
      phone: '',
      address: '',
      district: 'Lima',
      reference: '',
      routeDay: selectedRouteDay || 'Lunes',
      notes: '',
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      code: customer.code,
      name: customer.name,
      ownerName: customer.ownerName,
      documentType: customer.documentType,
      documentNumber: customer.documentNumber,
      phone: customer.phone,
      address: customer.address,
      district: customer.district,
      reference: customer.reference,
      routeDay: customer.routeDay,
      notes: customer.notes || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.address.trim()) return;

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, {
        ...formData,
      });
    } else {
      addCustomer({
        ...formData,
      });
    }

    setModalOpen(false);
  };

  const handleDelete = (customer: Customer) => {
    if (confirm(`¿Estás seguro de eliminar al cliente ${customer.name} (${customer.code})?`)) {
      deleteCustomer(customer.id);
    }
  };

  const handleStartOrderForCustomer = (customer: Customer) => {
    setPosCustomer(customer);
    setActiveTab('pos');
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Actions */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Directorio Central</span>
            <span aria-hidden="true">·</span>
            <span>Total: <strong>{customers.length} clientes registrados</strong></span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Base de Datos de Clientes & Códigos
          </h1>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Nuevo Cliente</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por código (CLI-001), bodega, titular o calle..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
          />
        </div>

        {/* Day Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto p-1 bg-slate-100 rounded-lg text-xs">
          <button
            onClick={() => setDayFilter('all')}
            className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
              dayFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({customers.length})
          </button>
          {ROUTE_DAYS.map(day => {
            const count = customers.filter(c => c.routeDay === day).length;
            return (
              <button
                key={day}
                onClick={() => setDayFilter(day)}
                className={`px-2.5 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  dayFilter === day ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {day} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Customer Data Table / Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Código</th>
                <th className="py-3.5 px-4">Bodega / Cliente</th>
                <th className="py-3.5 px-4">Titular & Documento</th>
                <th className="py-3.5 px-4">Teléfono / WhatsApp</th>
                <th className="py-3.5 px-4">Dirección & Referencia</th>
                <th className="py-3.5 px-4">Día de Ruta</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No se encontraron clientes con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(customer => (
                  <tr key={customer.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                        {customer.code}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-sm">
                        {customer.name}
                      </div>
                      {customer.notes && (
                        <div className="text-[11px] text-amber-700 truncate max-w-xs">
                          {customer.notes}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{customer.ownerName}</div>
                      <div className="text-slate-500 text-[11px]">
                        {customer.documentType}: {customer.documentNumber}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <a
                        href={`https://wa.me/51${customer.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{customer.phone}</span>
                      </a>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-medium text-slate-800">{customer.address}</div>
                      <div className="text-slate-500 text-[11px] truncate">
                        {customer.district} {customer.reference ? `· ${customer.reference}` : ''}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-md text-[11px]">
                        {customer.routeDay}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleStartOrderForCustomer(customer)}
                          title="Tomar pedido a este cliente"
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Pedido</span>
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(customer)}
                          title="Editar datos del cliente"
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(customer)}
                          title="Eliminar cliente"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT CUSTOMER MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingCustomer ? 'Editar Datos del Cliente' : 'Registrar Nuevo Cliente en Base de Datos'}
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
                    Código de Cliente *:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="CLI-001"
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Día de Ruta Asignado *:
                  </label>
                  <select
                    value={formData.routeDay}
                    onChange={e => setFormData({ ...formData, routeDay: e.target.value as RouteDay })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                  >
                    {ROUTE_DAYS.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Nombre Comercial / Bodega / Negocio *:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Bodega Don Lucho"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Nombre Completo del Titular / Encargado:
                </label>
                <input
                  type="text"
                  placeholder="Ej: Luis Alberto Medina"
                  value={formData.ownerName}
                  onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Tipo Doc:
                  </label>
                  <select
                    value={formData.documentType}
                    onChange={e => setFormData({ ...formData, documentType: e.target.value as 'DNI' | 'RUC' })}
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="DNI">DNI</option>
                    <option value="RUC">RUC</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">
                    N° Documento:
                  </label>
                  <input
                    type="text"
                    placeholder="10458923411"
                    value={formData.documentNumber}
                    onChange={e => setFormData({ ...formData, documentNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Celular / WhatsApp para Envío de Tickets *:
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
                  Dirección de Entrega Exacta *:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Av. Antúnez de Mayolo 1245"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Distrito / Ciudad:
                  </label>
                  <input
                    type="text"
                    placeholder="Los Olivos, Lima"
                    value={formData.district}
                    onChange={e => setFormData({ ...formData, district: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Referencia del Local:
                  </label>
                  <input
                    type="text"
                    placeholder="Frente al mercado, reja azul"
                    value={formData.reference}
                    onChange={e => setFormData({ ...formData, reference: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Observaciones de Entrega o Cobranza:
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Paga con Yape, entregar antes de las 12:00m"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                >
                  {editingCustomer ? 'Guardar Cambios' : 'Registrar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
