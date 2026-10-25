import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';

export const PWAInstallButton: React.FC<{ variant?: 'compact' | 'full' }> = ({ variant = 'compact' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={
          variant === 'full'
            ? 'inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors cursor-pointer whitespace-nowrap shrink-0'
            : 'inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap shrink-0'
        }
      >
        <Download className="w-3.5 h-3.5" />
        <span>Instalar App</span>
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowGuide(true)}
        className={
          variant === 'full'
            ? 'inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap shrink-0'
            : 'inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap shrink-0'
        }
      >
        <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
        <span>{isIOS ? 'Instalar en iPhone' : 'Instalar App'}</span>
      </button>

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Instalar RutaVenta POS en tu Dispositivo
                </h3>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                <p className="font-semibold text-slate-800">
                  Para instalar en iPhone o iPad (Safari):
                </p>
                <ol className="list-decimal list-inside space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <li>Abre el enlace directo de la aplicación en <strong>Safari</strong>.</li>
                  <li>Toca el botón <strong>Compartir</strong> en la barra inferior.</li>
                  <li>Selecciona <strong>"Agregar a pantalla de inicio"</strong>.</li>
                  <li>Toca <strong>Agregar</strong> arriba a la derecha.</li>
                </ol>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                <p className="font-semibold text-slate-800">
                  Para instalar como App Independiente (Android / Windows / Mac):
                </p>
                <ol className="list-decimal list-inside space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <li>Abre la URL pública de la aplicación en <strong>Google Chrome</strong> o <strong>Edge</strong> (fuera de esta vista previa).</li>
                  <li>Haz clic en el ícono <strong>"Instalar RutaVenta"</strong> en la barra de direcciones o en el menú de 3 puntos <strong>"Instalar aplicación"</strong>.</li>
                  <li>La aplicación quedará en tu pantalla de inicio y funcionará <strong>Online y Offline</strong>.</li>
                </ol>
              </div>
            )}

            <button
              onClick={() => setShowGuide(false)}
              className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
