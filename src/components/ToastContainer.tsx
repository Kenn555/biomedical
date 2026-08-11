import React from 'react';
import { AlertTriangle, CheckCircle2, Info, Bell, X } from 'lucide-react';

export interface Toast {
  id: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  title: string;
  message: string;
  timestamp?: string;
}

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col space-y-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let bgStyle = 'bg-slate-900 border-slate-700 text-white';
        let icon = <Bell className="w-5 h-5 text-emerald-400 shrink-0" />;

        if (toast.type === 'danger') {
          bgStyle = 'bg-rose-950/95 border-rose-500/80 text-rose-100 shadow-rose-950/50';
          icon = <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 animate-pulse" />;
        } else if (toast.type === 'warning') {
          bgStyle = 'bg-amber-950/95 border-amber-500/80 text-amber-100 shadow-amber-950/50';
          icon = <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
        } else if (toast.type === 'success') {
          bgStyle = 'bg-emerald-950/95 border-emerald-500/80 text-emerald-100 shadow-emerald-950/50';
          icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
        } else {
          bgStyle = 'bg-slate-900/95 border-slate-700 text-slate-100 shadow-slate-950/50';
          icon = <Info className="w-5 h-5 text-sky-400 shrink-0" />;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl border backdrop-blur-md shadow-xl flex items-start space-x-3 transition-all duration-300 animate-in slide-in-from-top-3 ${bgStyle}`}
          >
            <div className="mt-0.5">{icon}</div>

            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-bold text-xs uppercase tracking-wider">{toast.title}</h4>
                {toast.timestamp && (
                  <span className="text-[10px] opacity-60 font-mono">
                    {new Date(toast.timestamp).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                )}
              </div>
              <p className="text-xs mt-1 font-medium leading-relaxed break-words">{toast.message}</p>
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="opacity-70 hover:opacity-100 text-current p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              title="Fermer la notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
