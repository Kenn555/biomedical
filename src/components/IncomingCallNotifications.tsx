import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Bell, PhoneCall, Video, X, CheckCheck, Clock } from 'lucide-react';
import { VideoSession, UserProfile } from '../types';
import { isViewed } from '../lib/ticketUtils';

interface IncomingCallNotificationsProps {
  currentUser: UserProfile;
  /** Sessions vidéo où l'utilisateur courant a été invité (cloche) */
  sessions: VideoSession[];
  onMarkViewed: (sessionId: string) => void;
  onJoinCall: (session: VideoSession) => void;
}

export const IncomingCallNotifications: React.FC<IncomingCallNotificationsProps> = ({
  currentUser,
  sessions,
  onMarkViewed,
  onJoinCall,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Notifications d'appel entrant : sessions dont l'utilisateur courant est un
  // participant invité (par un autre acteur) et qu'il n'a pas encore consultées.
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

  const unreadCount = useMemo(
    () => incoming.filter((s) => !isViewed(s.viewedBy, currentUser.id)).length,
    [incoming, currentUser.id]
  );

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
    // L'ouverture du panneau marque les notifications comme lues
    if (next && unreadCount > 0) {
      incoming.forEach((s) => onMarkViewed(s.id));
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
          unreadCount > 0
            ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/80'
            : 'bg-slate-100/90 hover:bg-slate-200/80 text-slate-600 border border-slate-200/80'
        }`}
        title={
          unreadCount > 0
            ? `${unreadCount} appel(s) entrant(s) non consulté(s)`
            : 'Aucun appel entrant'
        }
      >
        <Bell className="w-4 h-4 shrink-0" />
        <span className="hidden lg:inline ml-1.5">Appels</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center shadow-md animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Panneau déroulant */}
      {isOpen && (
        <div className="absolute right-0 top-[calc(100%+8px)] w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h4 className="text-xs font-extrabold text-slate-900 flex items-center space-x-1.5">
              <PhoneCall className="w-4 h-4 text-emerald-600" />
              <span>Appels entrants ({incoming.length})</span>
            </h4>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-lg transition-colors cursor-pointer"
              title="Fermer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {incoming.length === 0 && (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-500">Aucun appel entrant</p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                  Les invitations d'appel vidéo apparaîtront ici.
                </p>
              </div>
            )}

            {incoming.map((s) => {
              const isUnread = !isViewed(s.viewedBy, currentUser.id);
              const caller = s.createdBy?.name || 'Un acteur';
              return (
                <div
                  key={s.id}
                  className={`p-3.5 space-y-2 ${isUnread ? 'bg-amber-50/60' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate flex items-center space-x-1.5">
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                        )}
                        <span>Appel de {caller}</span>
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                        {s.roomName}
                        {s.ticketCode ? ` — Ticket ${s.ticketCode}` : ''}
                        {s.equipmentCode ? ` — ${s.equipmentCode}` : ''}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium flex items-center space-x-1 mt-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(s.startedAt)} • {Math.floor(s.durationSeconds / 60)} min</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onJoinCall(s)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black px-3 py-2 rounded-xl transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                      title="Lancer un appel avec les participants de cette session"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Rejoindre / Rappeler</span>
                    </button>
                    {isUnread && (
                      <button
                        onClick={() => onMarkViewed(s.id)}
                        className="px-2.5 py-2 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl transition-colors cursor-pointer"
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
      )}
    </div>
  );
};
