import React, { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';

export const UpdateNotification: React.FC = () => {
  const [showUpdate, setShowUpdate] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    navigator.serviceWorker.getRegistration().then((registration) => {
      if (!registration) return;

      // 1. If there is already a waiting worker
      if (registration.waiting) {
        setWaitingWorker(registration.waiting);
        setShowUpdate(true);
      }

      // 2. If an update is in progress
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              setWaitingWorker(newWorker);
              setShowUpdate(true);
            }
          });
        }
      });
    });
  }, []);

  const handleReload = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  };

  if (!showUpdate) return null;

  return (
    <div
      id="update-notification-toast"
      className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:max-w-md z-50 flex items-center justify-between p-3.5 bg-[#18181b] border border-[#c5a059]/50 rounded-xl shadow-2xl text-xs text-[#e2e2e2] animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="flex items-center space-x-2.5 mr-3">
        <div className="w-7 h-7 rounded-full bg-[#c5a059]/15 flex items-center justify-center shrink-0 text-[#c5a059]">
          <RefreshCw className="w-3.5 h-3.5" />
        </div>
        <div>
          <p className="font-semibold text-[#f5f5f5]">Actualización disponible</p>
          <p className="text-[11px] text-[#999999]">Hay una nueva versión de METRON disponible.</p>
        </div>
      </div>
      <div className="flex items-center space-x-1.5 shrink-0">
        <button
          onClick={handleReload}
          className="px-3 py-1.5 bg-[#c5a059] hover:bg-[#b08d4b] text-black font-semibold rounded-lg transition-colors text-xs flex items-center space-x-1"
        >
          <span>Recargar</span>
        </button>
        <button
          onClick={() => setShowUpdate(false)}
          className="p-1 text-[#888888] hover:text-[#e2e2e2] transition-colors rounded-md"
          title="Descartar por ahora"
          aria-label="Cerrar aviso"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
