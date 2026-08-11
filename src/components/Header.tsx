import React from 'react';
import {
  Activity,
  ShieldCheck,
  Bot,
  PlusCircle,
  Building2,
  Users,
  AlertTriangle,
  BookOpen,
  BarChart3,
  Wifi,
  WifiOff,
  ShieldAlert
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';

interface HeaderProps {
  currentUser: UserProfile;
  users: UserProfile[];
  onSelectUser: (user: UserProfile) => void;
  selectedFacility: string;
  facilities: string[];
  onSelectFacility: (facility: string) => void;
  onOpenReportModal: () => void;
  onToggleAiDrawer: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  pendingTicketsCount: number;
  isOnline?: boolean;
  isSimulatedOffline?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  users,
  onSelectUser,
  selectedFacility,
  facilities,
  onSelectFacility,
  onOpenReportModal,
  onToggleAiDrawer,
  activeTab,
  onSelectTab,
  pendingTicketsCount,
  isOnline = true,
  isSimulatedOffline = false,
}) => {
  const effectiveOffline = !isOnline || isSimulatedOffline;

  return (
    <header className="bg-white/95 backdrop-blur-md text-slate-900 border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap lg:flex-nowrap items-center justify-between py-2.5 gap-y-2 gap-x-2 sm:gap-x-4 min-h-[64px]">
          {/* Brand Logo & Name */}
          <div
            className="flex items-center space-x-2.5 shrink-0 cursor-pointer py-1"
            onClick={() => onSelectTab('equipment')}
          >
            <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center shadow-md shadow-slate-900/10 shrink-0">
              <Activity className="w-5 h-5 text-emerald-400 font-bold" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-2 flex-wrap sm:flex-nowrap">
                <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900 whitespace-nowrap">
                  BioMed Telemed
                </span>
                <span className="hidden xs:inline-block px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full whitespace-nowrap">
                  Plateforme Collaborative
                </span>

                {/* Offline Badge */}
                {effectiveOffline ? (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 rounded-full flex items-center space-x-1 animate-pulse" title="Les données sont enregistrées en cache local">
                    <WifiOff className="w-3 h-3 text-amber-700" />
                    <span>Hors Ligne (Cache)</span>
                  </span>
                ) : (
                  <span className="hidden sm:flex items-center space-x-1 px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60 rounded-full" title="Connecté au serveur central">
                    <Wifi className="w-3 h-3 text-emerald-600" />
                    <span>Connecté</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 hidden md:block font-medium leading-tight">
                Maintenance à Distance des Équipements Biomédicaux
              </p>
            </div>
          </div>


          {/* Facility Filter & Role Switcher & Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 ml-auto">
            {/* Facility Selector */}
            <div
              className="hidden md:flex items-center space-x-1.5 bg-slate-100/80 border border-slate-200/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-700"
              title="Filtrer par établissement"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <select
                value={selectedFacility}
                onChange={(e) => onSelectFacility(e.target.value)}
                className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer max-w-[140px] lg:max-w-[170px] truncate"
              >
                <option value="ALL" className="bg-white text-slate-900">
                  Tous Établissements
                </option>
                {facilities.map((fac) => (
                  <option key={fac} value={fac} className="bg-white text-slate-900">
                    {fac}
                  </option>
                ))}
              </select>
            </div>

            {/* Role Switcher */}
            <div
              className="flex items-center space-x-1.5 bg-slate-100/80 border border-slate-200/80 rounded-xl px-2.5 py-1.5"
              title="Changer le profil utilisateur actif"
            >
              <Users className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] uppercase text-slate-500 font-bold leading-none mb-0.5 hidden sm:block">
                  Profil
                </span>
                <select
                  value={currentUser.id}
                  onChange={(e) => {
                    const u = users.find((usr) => usr.id === e.target.value);
                    if (u) onSelectUser(u);
                  }}
                  className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer max-w-[110px] xs:max-w-[150px] sm:max-w-[200px] truncate pr-1"
                >
                  {users.map((usr) => (
                    <option key={usr.id} value={usr.id} className="bg-white text-slate-900">
                      {usr.name} ({getRoleLabel(usr.role)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Signalement rapide button */}
            <button
              onClick={onOpenReportModal}
              className="group relative flex items-center justify-center space-x-1.5 bg-rose-600 hover:bg-rose-700 text-white p-2.5 sm:px-3.5 sm:py-2 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer whitespace-nowrap"
              title="Signaler une panne d'équipement"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">Signaler Panne</span>
            </button>

            {/* Support Assistant Toggle Button */}
            <button
              onClick={onToggleAiDrawer}
              className="group relative flex items-center justify-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-emerald-400 p-2.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs whitespace-nowrap"
              title="Ouvrir l'Assistant Technique BioMed"
            >
              <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="hidden md:inline">Assistant Support</span>
            </button>

            {/* Compliance Badge */}
            <div
              className="hidden xl:flex items-center space-x-1 text-slate-600 text-xs bg-slate-100/80 px-2.5 py-1.5 rounded-xl border border-slate-200/80 whitespace-nowrap"
              title="Conforme normes données de santé HDS / ISO 13485"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="text-[10px] text-slate-700 font-bold">HDS / ISO 13485</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 sm:space-x-1.5 overflow-x-auto no-scrollbar border-t border-slate-200/80 py-2">
          <NavButton
            active={activeTab === 'equipment'}
            onClick={() => onSelectTab('equipment')}
            label="Parc Équipements"
            icon={<Activity className="w-4 h-4 shrink-0" />}
          />
          <NavButton
            active={activeTab === 'tickets'}
            onClick={() => onSelectTab('tickets')}
            label="Incidents & Signalements"
            icon={<AlertTriangle className="w-4 h-4 shrink-0" />}
            badge={pendingTicketsCount > 0 ? pendingTicketsCount : undefined}
          />
          <NavButton
            active={activeTab === 'knowledge'}
            onClick={() => onSelectTab('knowledge')}
            label="Base de Connaissances"
            icon={<BookOpen className="w-4 h-4 shrink-0" />}
          />
          <NavButton
            active={activeTab === 'analytics'}
            onClick={() => onSelectTab('analytics')}
            label="Supervision & Tableaux"
            icon={<BarChart3 className="w-4 h-4 shrink-0" />}
          />
          <NavButton
            active={activeTab === 'alerts'}
            onClick={() => onSelectTab('alerts')}
            label="Alertes Critiques & MTTR"
            icon={<ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />}
          />
          <NavButton
            active={activeTab === 'admin'}
            onClick={() => onSelectTab('admin')}
            label="Administration & Audit"
            icon={<ShieldCheck className="w-4 h-4 shrink-0" />}
          />
        </div>
      </div>
    </header>
  );
};

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, label, icon, badge }) => (
  <button
    onClick={onClick}
    title={label}
    className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 cursor-pointer shrink-0 ${
      active
        ? 'bg-slate-900 text-white shadow-xs'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`}
  >
    <span className={active ? 'text-emerald-400' : 'text-slate-500'}>{icon}</span>
    <span className="hidden sm:inline">{label}</span>
    <span className="sm:hidden text-[11px] font-bold">{label.split(' ')[0]}</span>
    {badge !== undefined && (
      <span className="bg-rose-500 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
        {badge}
      </span>
    )}
  </button>
);

export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case 'technician':
      return 'Technicien Biomédical';
    case 'engineer':
      return 'Ingénieur Biomédical';
    case 'doctor':
      return 'Médecin / Utilisateur';
    case 'nurse':
      return 'Infirmier(ère)';
    case 'manager':
      return 'Responsable Maintenance';
    case 'director':
      return 'Directrice Établissement';
    case 'vendor':
      return 'Fournisseur Externe';
    case 'admin':
      return 'Administrateur';
    default:
      return role;
  }
}
