import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Bell, PhoneCall, PhoneOff, Video, X, CheckCheck, Clock, Wrench, Inbox } from 'lucide-react';
import { VideoSession, UserProfile, AppNotification } from '../types';
import { isViewed } from '../lib/ticketUtils';

interface NotificationCenterProps {
  currentUser: UserProfile;
  /** Sessions vidéo où l'utilisateur courant a été invité */
  sessions: VideoSession[];
  /** Notifications de la plateforme (assignation de signalement, etc.) */
  notifications: AppNotification[];
  onMarkCallViewed: (sessionId: string) => void;
  onJoinCall: (session: VideoSession) => void;
  onMarkNotificationRead: (notificationId: string) => void;
  onMarkAllNotificationsRead: () => void;
  /** Ouvre le ticket associé à une notification */
  onOpenTicket: (ticketId?: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  currentUser,
  sessions,
  notifications,
  onMarkCallViewed,
  onJoinCall,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onOpenTicket,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Appels entrants : sessions dont l'utilisateur courant est invité (par un
  // autre acteur) et qu'il n'a pas encore consultées.
  const incoming = useMemo(
    () =>
      sessions.filter((s) => {
        const participants = (s.participants || []).map((p) => p.id);
        if (!participants.includes(currentUser.id)) return false;
        if (s.createdBy?.id === currentUser.id) return false;
        return true;
      }),
    [sessions, currentUser.id]
  );

  const unreadCalls = useMemo(
    () => incoming.filter((s) => !isViewed(s.viewedBy, currentUser.id)).length,
    [incoming, currentUser.id]
  );

  const unreadNotifs = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const unreadTotal = unreadCalls + unreadNotifs;

  // Ferme le panneau au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOpen = () => {
    const next = !isOpen;
    setIsOpen(next);
    // L'ouverture du panneau marque les appels comme consultés
    if (next && unreadCalls > 0) {
      incoming.forEach((s) => onMarkCallViewed(s.id));
    }
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Cloche */}
      <button
        onClick={toggleOpen}
        className={`relative flex items-center justify-center p-2 sm:px-3 sm:py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-2xs whitespace-nowrap ${
          unreadTotal > 0
            ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/80'
            : 'bg-slate-100/90 hover:bg-slate-200/80 text-slate-600 border border-slate-200/80'
        }`}
        title={unreadTotal > 0 ? `${unreadTotal} notification(s) non lue(s)` : 'Aucune notification'}
      >
        <Bell className="w-4 h-4 shrink-0" />
        <span className="hidden lg:inline ml-1.5">Notifications</span>
        {unreadTotal > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center shadow-md animate-pulse">
            {unreadTotal}
          </span>
        )}
      </button>

      {/* Panneau déroulant */}
      {isOpen && (
        <div className="absolute right-0 top-[calc(100%+8px)] w-[min(24rem,calc(100vw-1rem))] sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h4 className="text-xs font-extrabold text-slate-900 flex items-center space-x-1.5">
              <Bell className="w-4 h-4 text-emerald-600" />
              <span>Notifications</span>
            </h4>
            <div className="flex items-center space-x-1">
              {unreadNotifs > 0 && (
                <button
                  onClick={onMarkAllNotificationsRead}
                  className="text-[10px] font-bold text-sky-600 hover:text-sky-700 bg-sky-50 border border-sky-200 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                  title="Tout marquer comme lu"
                >
                  <CheckCheck className="w-3.5 h-3.5 inline mr-1" />
                  Tout lire
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-lg transition-colors cursor-pointer"
                title="Fermer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {/* Assignations de signalements */}
            <div className="p-2.5 space-y-1.5">
              <p className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider px-1.5">
                Signalements assignés ({notifications.length})
              </p>
              {notifications.length === 0 && (
                <p className="text-[11px] text-slate-400 font-medium px-1.5 py-2">
                  Aucun signalement assigné récemment.
                </p>
              )}
              {notifications.map((n) => {
                const isUnread = !n.read;
                return (
                  <div
                    key={n.id}
                    className={`rounded-xl p-2.5 space-y-1 cursor-pointer transition-colors ${
                      isUnread ? 'bg-amber-50/70 hover:bg-amber-100/70' : 'hover:bg-slate-50'
                    }`}
                    onClick={() => onOpenTicket(n.ticketId)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[11px] font-bold text-slate-900 flex items-center space-x-1.5 min-w-0">
                        {isUnread && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />}
                        <Wrench className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="truncate">{n.title}</span>
                      </p>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">{formatTime(n.createdAt)}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium leading-snug">{n.message}</p>
                    {n.ticketCode && (
                      <span className="inline-block text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        {n.ticketCode}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Appels entrants */}
            <div className="p-2.5 space-y-1.5">
              <p className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider px-1.5">
                Appels entrants ({incoming.length})
              </p>
              {incoming.length === 0 && (
                <p className="text-[11px] text-slate-400 font-medium px-1.5 py-2 flex items-center space-x-1.5">
                  <Inbox className="w-3.5 h-3.5" />
                  <span>Aucun appel entrant.</span>
                </p>
              )}
              {incoming.map((s) => {
                const isUnread = !isViewed(s.viewedBy, currentUser.id);
                // Session « en direct » : l'appel est en cours, l'invité peut
                // encore le rejoindre. Session clôturée : simple rappel.
                const isLive = !s.endedAt;
                const caller = s.createdBy?.name || 'Un acteur';
                return (
                  <div key={s.id} className={`rounded-xl p-2.5 space-y-2 ${isUnread ? 'bg-amber-50/70' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-slate-900 truncate flex items-center space-x-1.5">
                          {isUnread && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />}
                          <span>Appel de {caller}</span>
                          {isLive && (
                            <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300 text-[9px] font-black shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                              <span>EN DIRECT</span>
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                          {s.roomName}
                          {s.ticketCode ? ` — Ticket ${s.ticketCode}` : ''}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium flex items-center space-x-1 mt-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatTime(s.startedAt)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onJoinCall(s)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black px-3 py-1.5 rounded-xl transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>{isLive ? "Accepter & rejoindre" : 'Rejoindre / Rappeler'}</span>
                      </button>
                      {isUnread && isLive && (
                        <button
                          onClick={() => onMarkCallViewed(s.id)}
                          className="px-2 py-1.5 bg-white hover:bg-slate-100 text-rose-600 border border-rose-200 rounded-xl transition-colors cursor-pointer"
                          title="Refuser l'appel"
                        >
                          <PhoneOff className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {isUnread && !isLive && (
                        <button
                          onClick={() => onMarkCallViewed(s.id)}
                          className="px-2 py-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                          title="Marquer comme lu"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
