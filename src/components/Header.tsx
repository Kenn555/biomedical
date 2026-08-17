import React from 'react';
import {
  Activity,
  ShieldCheck,
  PlusCircle,
  Building2,
  Users,
  AlertTriangle,
  BookOpen,
  BarChart3,
  Wifi,
  WifiOff,
  ShieldAlert,
  Video,
  LogOut
} from 'lucide-react';
import { UserProfile, VideoSession, AppNotification } from '../types';
import { can } from '../lib/permissions';
import { getRoleLabel } from '../lib/selectOptions';
export { getRoleLabel } from '../lib/selectOptions';
import { NotificationCenter } from './NotificationCenter';

interface HeaderProps {
  currentUser: UserProfile;
  onLogout?: () => void;
  selectedFacility: string;
  facilities: string[];
  onSelectFacility: (facility: string) => void;
  onOpenReportModal: () => void;
  onToggleAiDrawer: () => void;
  onOpenVideoCall?: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  pendingTicketsCount: number;
  isOnline?: boolean;
  isSimulatedOffline?: boolean;
  /** Sessions vidéo où l'utilisateur courant a été invité (cloche) */
  incomingCallSessions?: VideoSession[];
  onMarkCallViewed?: (sessionId: string) => void;
  onJoinIncomingCall?: (session: VideoSession) => void;
  /** Notifications de la plateforme (assignation de signalements) */
  notifications?: AppNotification[];
  onMarkNotificationRead?: (notificationId: string) => void;
  onMarkAllNotificationsRead?: () => void;
  onOpenNotificationTicket?: (ticketId?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLogout,
  selectedFacility,
  facilities,
  onSelectFacility,
  onOpenReportModal,
  onToggleAiDrawer,
  onOpenVideoCall,
  activeTab,
  onSelectTab,
  pendingTicketsCount,
  isOnline = true,
  isSimulatedOffline = false,
  incomingCallSessions = [],
  onMarkCallViewed,
  onJoinIncomingCall,
  notifications = [],
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onOpenNotificationTicket,
}) => {
  const effectiveOffline = !isOnline || isSimulatedOffline;

  return (
    <header className="bg-white/95 backdrop-blur-md text-slate-900 border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
      {/* Top Bar */}
      <div className="px-3 sm:px-4 lg:px-6">
        <div className="flex flex-wrap lg:flex-nowrap items-center justify-between py-2 gap-y-1.5 gap-x-1.5 sm:gap-x-2 min-h-[56px]">
          {/* Brand Logo & Name */}
          <div
            className="flex items-center space-x-2 shrink-0 cursor-pointer"
            onClick={() => onSelectTab('equipment')}
          >
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center shadow-md shadow-slate-900/10 shrink-0">
              <Activity className="w-5 h-5 text-emerald-400 font-bold" />
            </div>
            <div className="flex items-center space-x-2 flex-wrap sm:flex-nowrap">
              <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900 whitespace-nowrap">
                BioMed
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
          </div>

          {/* Facility Filter & Role Switcher & Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto">
            {/* Facility Selector */}
            <div
              className="hidden md:flex items-center space-x-1.5 bg-slate-100/90 rounded-xl px-2 py-1 text-xs text-slate-700"
              title="Filtrer par établissement"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <select
                value={selectedFacility}
                onChange={(e) => onSelectFacility(e.target.value)}
                className="bg-transparent text-slate-800 font-semibold border-none focus:outline-none cursor-pointer max-w-[140px] lg:max-w-[170px] truncate"
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

            {/* Compte actif — avatar + nom + rôle (changement de compte via la déconnexion) */}
            <div
              className="flex items-center space-x-1.5 bg-slate-100/90 rounded-xl pl-1.5 pr-2 py-1"
              title={`Connecté en tant que ${currentUser.name} (${getRoleLabel(currentUser.role)})`}
            >
              <span className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center overflow-hidden shrink-0 ring-2 ring-white shadow-xs">
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <Users className="w-4 h-4 shrink-0" />
                )}
              </span>
              <span className="hidden xs:block leading-tight min-w-0">
                <span className="block text-xs font-bold text-slate-900 max-w-[110px] xs:max-w-[150px] sm:max-w-[180px] truncate">
                  {currentUser.name}
                </span>
                <span className="block text-[10px] font-semibold text-slate-500 max-w-[110px] xs:max-w-[150px] sm:max-w-[180px] truncate">
                  {getRoleLabel(currentUser.role)}
                </span>
              </span>
            </div>

            {/* Centre de notifications (assignations + appels entrants) */}
            {onMarkCallViewed && onJoinIncomingCall && onOpenNotificationTicket && (
              <NotificationCenter
                currentUser={currentUser}
                sessions={incomingCallSessions}
                notifications={notifications}
                onMarkCallViewed={onMarkCallViewed}
                onJoinCall={onJoinIncomingCall}
                onMarkNotificationRead={onMarkNotificationRead || (() => {})}
                onMarkAllNotificationsRead={onMarkAllNotificationsRead || (() => {})}
                onOpenTicket={onOpenNotificationTicket}
              />
            )}

            {/* Déconnexion */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center justify-center space-x-1.5 bg-slate-100/90 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200/80 p-2 sm:px-3 sm:py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-2xs whitespace-nowrap"
                title="Se déconnecter de la plateforme"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span className="hidden lg:inline">Déconnexion</span>
              </button>
            )}

            {/* Signalement rapide button */}
            {can(currentUser, 'canReportIncident') && (
              <button
                onClick={onOpenReportModal}
                className="group relative flex items-center justify-center space-x-1.5 bg-rose-600 hover:bg-rose-700 text-white p-2 sm:px-3 sm:py-1.5 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer whitespace-nowrap"
                title="Signaler une panne d'équipement"
              >
                <PlusCircle className="w-4 h-4 shrink-0" />
                <span className="hidden md:inline">Signaler Panne</span>
              </button>
            )}

            {/* Visioconférence Directe button — ouverte à tous les acteurs,
                quel que soit l'établissement ou la permission de diagnostic */}
            {onOpenVideoCall && (
              <button
                onClick={onOpenVideoCall}
                className="group relative flex items-center justify-center space-x-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 p-2 sm:px-3 sm:py-1.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer shadow-2xs whitespace-nowrap"
                title="Lancer une visioconférence de télé-diagnostic en direct"
              >
                <Video className="w-4 h-4 text-rose-600 shrink-0 animate-pulse" />
                <span className="hidden lg:inline">Visioconférence Directe</span>
              </button>
            )}

            {/* Support Assistant Toggle Button */}
            <button
              onClick={onToggleAiDrawer}
              className="group relative flex items-center justify-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-emerald-400 p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs whitespace-nowrap"
              title="Ouvrir l'Assistant Technique BioMed"
            >
              <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="hidden md:inline">Assistant Support</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 sm:space-x-1.5 overflow-x-auto no-scrollbar border-t border-slate-200/80 py-1.5">
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
          {(can(currentUser, 'canManageUsers') || can(currentUser, 'canManageEquipment')) && (
            <NavButton
              active={activeTab === 'admin'}
              onClick={() => onSelectTab('admin')}
              label="Administration & Audit"
              icon={<ShieldCheck className="w-4 h-4 shrink-0" />}
            />
          )}
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
    className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 cursor-pointer shrink-0 ${
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

