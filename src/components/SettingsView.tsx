import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Settings,
  Building2,
  FileSpreadsheet,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    companyConfig,
    updateCompanyConfig,
    exportDataAsJSON,
    importDataFromJSON,
    resetToInitialData,
    customers,
    products,
    orders,
  } = useApp();

  const [formData, setFormData] = useState({ ...companyConfig });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanyConfig(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleExportJSON = () => {
    const jsonStr = exportDataAsJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rutaventa_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (content) {
        const success = importDataFromJSON(content);
        if (success) {
          setImportStatus('Copia de seguridad restaurada con éxito.');
        } else {
          setImportStatus('Error: El archivo no tiene un formato válido.');
        }
        setTimeout(() => setImportStatus(null), 4000);
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (
      confirm(
        '¿Deseas restablecer todos los clientes, productos y pedidos a los datos iniciales de fábrica?'
      )
    ) {
      resetToInitialData();
      setFormData({ ...companyConfig });
      alert('Datos restablecidos correctamente.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Configuración del Sistema & Datos de Preventa
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Personaliza los datos impresos en los tickets de cobranza y gestiona las copias de seguridad.
        </p>
      </div>

      {/* Company / Ticket Header Form */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-5">
          <Building2 className="w-5 h-5 text-emerald-600" />
          <h2 className="text-base font-bold text-slate-900">
            Datos de la Distribuidora en el Ticket
          </h2>
        </div>

        <form onSubmit={handleSaveCompany} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Razón Social *:
              </label>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Nombre Comercial / Marca:
              </label>
              <input
                type="text"
                value={formData.tradeName}
                onChange={e => setFormData({ ...formData, tradeName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                RUC de la Empresa *:
              </label>
              <input
                type="text"
                required
                value={formData.ruc}
                onChange={e => setFormData({ ...formData, ruc: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Teléfono de Contacto *:
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Dirección del Almacén / Distribuidora:
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Ciudad / País:
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Nombre del Preventista / Vendedor por defecto:
            </label>
            <input
              type="text"
              value={formData.sellerName}
              onChange={e => setFormData({ ...formData, sellerName: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Mensaje de Pie de Ticket:
            </label>
            <textarea
              rows={2}
              value={formData.receiptFooterMessage}
              onChange={e => setFormData({ ...formData, receiptFooterMessage: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            {saveSuccess && (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Cambios guardados con éxito
              </span>
            )}
            <div className="ml-auto">
              <button
                type="submit"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Guardar Configuración
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Data Backup & Restore */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-900">
            Respaldo y Portabilidad de Base de Datos
          </h2>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Toda la base de datos de tus clientes ({customers.length}), productos ({products.length}) y pedidos ({orders.length}) se guarda de manera segura en tu navegador. Puedes descargar un archivo de copia de seguridad o importarlo en otro dispositivo o teléfono móvil.
        </p>

        {importStatus && (
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold border border-emerald-200">
            {importStatus}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleExportJSON}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Copia de Seguridad (.json)</span>
          </button>

          <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Restaurar Copia (.json)</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={handleResetData}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl text-xs font-bold transition-colors cursor-pointer ml-auto"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restablecer Datos de Fábrica</span>
          </button>
        </div>
      </div>

    </div>
  );
};
