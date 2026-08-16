import React, { useState } from 'react';
import { Activity, Mail, Lock, LogIn, AlertTriangle, ShieldCheck } from 'lucide-react';
import { UserProfile } from '../types';
import { api } from '../lib/api';

interface LoginScreenProps {
  onLogin: (user: UserProfile) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await api.login(email.trim(), password);
      onLogin(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Décor */}
      <div className="absolute inset-0 opacity-[0.07] pointer-events-none select-none">
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-emerald-500 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-emerald-500 to-transparent" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Brand */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center shadow-lg shadow-black/30 mb-3">
            <Activity className="w-7 h-7 text-emerald-400" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">BioMed</h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Plateforme Collaborative de Maintenance Biomédicale
          </p>
          <div className="flex items-center space-x-1 mt-2 text-[10px] text-slate-500 font-semibold bg-slate-800/60 border border-slate-700/60 px-2.5 py-1 rounded-full">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            <span>Conforme HDS • ISO 13485 • NF EN 60601-1</span>
          </div>
        </div>

        {/* Carte de connexion */}
        <div className="bg-white rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
            <h2 className="text-sm font-bold text-slate-900">Connexion au Réseau Télémédecine</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Authentification requise pour accéder aux données biomédicales
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="flex items-start space-x-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-3 py-2.5 text-xs font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="font-bold text-slate-900 block text-xs">Adresse Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="prenom.nom@etablissement.mg"
                  autoComplete="username"
                  className="w-full bg-slate-50 text-slate-900 placeholder-slate-400 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-900 block text-xs">Mot de Passe</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full bg-slate-50 text-slate-900 placeholder-slate-400 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-emerald-400 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-sm cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Connexion en cours…' : 'Se Connecter'}</span>
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-slate-500 font-medium mt-4">
          © 2026 BioMed — Plateforme Collaborative de Maintenance Biomédicale
        </p>
      </div>
    </div>
  );
};
