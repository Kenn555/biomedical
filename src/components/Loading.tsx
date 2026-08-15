import React from 'react';
import { Activity, Loader2 } from 'lucide-react';

// ---------------------------------------------------------------------------
// Spinner simple
// ---------------------------------------------------------------------------
export const Spinner: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <Loader2 className={`animate-spin ${className}`} />
);

// ---------------------------------------------------------------------------
// Skeleton affiché lors du chargement d'un onglet (fallback Suspense)
// ---------------------------------------------------------------------------
export const TabSkeleton: React.FC = () => (
  <div className="space-y-6" role="status" aria-busy="true" aria-label="Chargement de l'onglet">
    {/* Cartes KPI */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-24 bg-slate-200/70 rounded-2xl animate-pulse" />
      ))}
    </div>

    {/* Barre d'outils */}
    <div className="h-12 bg-white border border-slate-200/80 rounded-2xl animate-pulse" />

    {/* Grille de cartes */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-3">
          <div className="h-4 bg-slate-200/70 rounded-lg animate-pulse w-2/3" />
          <div className="h-3 bg-slate-200/70 rounded-lg animate-pulse w-1/2" />
          <div className="h-20 bg-slate-200/70 rounded-xl animate-pulse" />
          <div className="h-8 bg-slate-200/70 rounded-xl animate-pulse" />
        </div>
      ))}
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Loader plein écran (chargement initial des données après connexion)
// ---------------------------------------------------------------------------
export const AppLoader: React.FC<{ message?: string }> = ({ message = 'Chargement des données du serveur…' }) => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center" role="status" aria-busy="true" aria-label={message}>
    <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/10 animate-pulse">
      <Activity className="w-7 h-7 text-emerald-400" />
    </div>
    <p className="mt-4 text-sm font-bold text-slate-800 flex items-center space-x-2">
      <Spinner className="w-4 h-4 text-emerald-600" />
      <span>{message}</span>
    </p>
    <div className="mt-3 w-40 h-1 bg-slate-200 rounded-full overflow-hidden">
      <div
        className="h-full w-2/5 bg-emerald-500 rounded-full"
        style={{ animation: 'progress-indeterminate 1.1s ease-in-out infinite' }}
      />
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Barre de progression fine en haut de page (feedback global)
// ---------------------------------------------------------------------------
export const TopProgressBar: React.FC<{ visible: boolean }> = ({ visible }) => (
  <div
    className={`fixed top-0 left-0 right-0 z-[70] h-1 pointer-events-none transition-opacity duration-200 ${
      visible ? 'opacity-100' : 'opacity-0'
    }`}
    aria-hidden="true"
  >
    <div className="relative h-full overflow-hidden">
      <div
        className="absolute h-full w-2/5 bg-gradient-to-r from-emerald-500 via-emerald-400 to-sky-500 rounded-full"
        style={{ animation: 'progress-indeterminate 1.1s ease-in-out infinite' }}
      />
    </div>
  </div>
);
