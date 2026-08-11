import React from 'react';
import { WifiOff, Wifi, RefreshCw, HardDrive, CheckCircle2 } from 'lucide-react';
import { PendingSyncAction } from '../lib/offlineStorage';

interface OfflineBannerProps {
  isOnline: boolean;
  lastCacheTime: string | null;
  pendingActions: PendingSyncAction[];
  onForceSync?: () => void;
  onToggleSimulateOffline?: () => void;
  isSimulatedOffline?: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  isOnline,
  lastCacheTime,
  pendingActions,
  onForceSync,
  onToggleSimulateOffline,
  isSimulatedOffline,
}) => {
  if (isOnline && !isSimulatedOffline && pendingActions.length === 0) {
    return null;
  }

  const effectiveOffline = !isOnline || isSimulatedOffline;

  return (
    <div
      className={`border-b px-4 py-2 text-xs transition-all duration-300 ${
        effectiveOffline
          ? 'bg-amber-500 text-amber-950 border-amber-600/30'
          : 'bg-emerald-600 text-white border-emerald-700/30'
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2 min-w-0">
          {effectiveOffline ? (
            <div className="flex items-center space-x-1.5 font-bold shrink-0">
              <WifiOff className="w-4 h-4 text-amber-950 animate-pulse" />
              <span className="uppercase tracking-wider text-[11px]">Mode Hors Ligne Activé</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 font-bold shrink-0">
              <Wifi className="w-4 h-4 text-emerald-200" />
              <span className="uppercase tracking-wider text-[11px]">Connexion Réseau Rétablie</span>
            </div>
          )}

          <span className="text-amber-900/80 font-medium hidden sm:inline">•</span>

          <div className="truncate text-[11px] font-medium">
            {effectiveOffline ? (
              <span>
                Consultation disponible via le cache local (Service Worker).{' '}
                {lastCacheTime && (
                  <span className="font-semibold">Dernière synchro : {lastCacheTime}</span>
                )}
              </span>
            ) : (
              <span>Synchronisation automatique du cache local terminée.</span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {pendingActions.length > 0 && (
            <span className="bg-amber-900/15 text-amber-950 font-bold px-2 py-0.5 rounded-md text-[10px] flex items-center space-x-1">
              <HardDrive className="w-3 h-3" />
              <span>{pendingActions.length} action(s) en attente de synchro</span>
            </span>
          )}

          {onForceSync && (
            <button
              onClick={onForceSync}
              className={`px-2.5 py-1 rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center space-x-1 cursor-pointer transition-colors shadow-2xs ${
                effectiveOffline
                  ? 'bg-amber-950 text-amber-100 hover:bg-amber-900'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
              title="Forcer la synchronisation avec le serveur"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Ré-essayer Synchro</span>
            </button>
          )}

          {onToggleSimulateOffline && (
            <button
              onClick={onToggleSimulateOffline}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                isSimulatedOffline
                  ? 'bg-amber-900 text-amber-100 border-amber-800'
                  : 'bg-white/20 border-white/30 text-white hover:bg-white/30'
              }`}
              title="Tester le comportement hors ligne sans déconnecter le Wifi"
            >
              {isSimulatedOffline ? 'Quitter Simu Hors-Ligne' : 'Simuler Hors-Ligne'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
