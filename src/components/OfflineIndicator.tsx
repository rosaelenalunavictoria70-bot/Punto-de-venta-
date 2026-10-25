import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC<{ pendingCount?: number }> = ({ pendingCount = 0 }) => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-xl border border-amber-500 no-print">
      <WifiOff className="w-4 h-4 shrink-0" />
      <div>
        <span>Modo Offline Activo — Guardando pedidos en el teléfono</span>
        {pendingCount > 0 && (
          <span className="block text-[10px] font-normal text-amber-100">
            {pendingCount} cambio(s) se sincronizarán automáticamente al volver la señal
          </span>
        )}
      </div>
    </div>
  );
};
