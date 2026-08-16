import React, { useState } from 'react';
import { Activity, ShieldCheck, User, Mail, Lock, Building2, Briefcase, Rocket, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api';

interface SetupScreenProps {
  onComplete: (email: string, password: string) => void;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [title, setTitle] = useState('Administrateur');
  const [facility, setFacility] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (password !== confirm) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    try {
      await api.setupAdmin({ name, email, password, title, facility });
      // Première connexion automatique avec le compte créé
      onComplete(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'installation. Veuillez réessayer.');
      setLoading(false);
    }
  };

  const inputClass =
    'w-full bg-slate-50 text-slate-900 placeholder-slate-400 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 focus:bg-white transition-all';

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

        {/* Carte de première installation */}
        <div className="bg-white rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
              <Rocket className="w-4 h-4 text-emerald-600" />
              <span>Première installation</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Aucun compte n'existe encore. Créez le compte <strong>administrateur</strong> initial — tous les
              acteurs et établissements seront ensuite gérés depuis l'interface.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
            {error && (
              <div className="flex items-start space-x-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-3 py-2.5 text-xs font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="font-bold text-slate-900 block text-xs">Nom complet *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex. : Raharison Jean"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-900 block text-xs">Adresse Email *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="prenom.nom@etablissement.mg"
                  autoComplete="username"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-900 block text-xs">Fonction</label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Administrateur"
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="font-bold text-slate-900 block text-xs">Établissement</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={facility}
                    onChange={(e) => setFacility(e.target.value)}
                    placeholder="Établissement principal"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-900 block text-xs">Mot de passe * (min. 6 caractères)</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-900 block text-xs">Confirmer le mot de passe *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  className={inputClass}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-emerald-400 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-sm cursor-pointer"
            >
              <Rocket className="w-4 h-4" />
              <span>{loading ? 'Création du compte…' : 'Créer le compte administrateur'}</span>
            </button>

            <p className="text-[10px] text-slate-400 font-medium text-center">
              Ce compte sera le seul à disposer de la gestion complète des acteurs, équipements et établissements.
            </p>
          </form>
        </div>

        <p className="text-center text-[10px] text-slate-500 font-medium mt-4">
          © 2026 BioMed — Plateforme Collaborative de Maintenance Biomédicale
        </p>
      </div>
    </div>
  );
};
