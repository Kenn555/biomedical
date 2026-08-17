import React, { useMemo, useState, useEffect } from 'react';
import { IncidentTicket, Equipment, UserProfile, InvitedParticipant } from '../types';
import { Users, Building2, X, PhoneCall, Check, Video, Mic, BellRing } from 'lucide-react';
import { getRoleLabel } from './Header';

interface VideoCallSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  users: UserProfile[];
  facilities: string[];
  ticket?: IncidentTicket | null;
  equipment?: Equipment | null;
  onStartCall: (invited: InvitedParticipant[], mode: 'audio' | 'video') => void;
  /** Participants pré-sélectionnés (rappel depuis la cloche d'appels entrants) */
  defaultSelectedIds?: string[];
}

export const VideoCallSetupModal: React.FC<VideoCallSetupModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  users,
  facilities,
  ticket,
  equipment,
  onStartCall,
  defaultSelectedIds = [],
}) => {
  // Phase 1 : sélection des participants — Phase 2 : notification bloquante
  const [phase, setPhase] = useState<'select' | 'notify'>('select');
  const [selectedIds, setSelectedIds] = useState<string[]>(defaultSelectedIds);
  const [facilityFilter, setFacilityFilter] = useState<string>('ALL');
  // Mode de l'appel : vidéo (caméra + micro) ou audio seul
  const [callMode, setCallMode] = useState<'audio' | 'video'>('video');

  const candidates = useMemo(
    () => users.filter((u) => u.id !== currentUser.id),
    [users, currentUser.id]
  );

  const visibleCandidates = useMemo(() => {
    if (facilityFilter === 'ALL') return candidates;
    return candidates.filter((u) => u.facility === facilityFilter);
  }, [candidates, facilityFilter]);

  // Établissements ayant au moins un acteur invitable
  const facilitiesWithActors = useMemo(() => {
    return facilities.filter((f) => candidates.some((u) => u.facility === f));
  }, [facilities, candidates]);

  const toggleUser = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleFacility = (facility: string) => {
    const facilityIds = candidates.filter((u) => u.facility === facility).map((u) => u.id);
    const allSelected = facilityIds.every((id) => selectedIds.includes(id));
    setSelectedIds((prev) =>
      allSelected ? prev.filter((id) => !facilityIds.includes(id)) : [...new Set([...prev, ...facilityIds])]
    );
  };

  const toggleSelectAll = () => {
    const visibleIds = visibleCandidates.map((u) => u.id);
    const allSelected = visibleIds.every((id) => selectedIds.includes(id));
    setSelectedIds((prev) =>
      allSelected ? prev.filter((id) => !visibleIds.includes(id)) : [...new Set([...prev, ...visibleIds])]
    );
  };

  const selectedParticipants = useMemo(
    () =>
      users
        .filter((u) => selectedIds.includes(u.id))
        .map((u) => ({ id: u.id, name: u.name, role: u.role, facility: u.facility })),
    [users, selectedIds]
  );

  // À chaque ouverture, réinitialise la sélection (pré-remplie pour un rappel)
  useEffect(() => {
    if (isOpen) {
      setPhase('select');
      setSelectedIds(defaultSelectedIds);
      setFacilityFilter('ALL');
      setCallMode('video');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const contextLabel = ticket
    ? `Ticket ${ticket.code} — ${ticket.equipmentName}`
    : equipment
    ? `Équipement ${equipment.name}`
    : 'Salle générale';

  if (!isOpen) return null;

  const resetAndClose = () => {
    setPhase('select');
    setSelectedIds([]);
    setFacilityFilter('ALL');
    onClose();
  };

  // --- PHASE 2 : notification bloquante des invités ---
  if (phase === 'notify') {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200">
          <div className="bg-slate-900 p-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto mb-3">
              <BellRing className="w-7 h-7 text-emerald-400 animate-pulse" />
            </div>
            <h3 className="text-base font-extrabold text-white">Appel en cours de notification…</h3>
            <p className="text-xs text-slate-400 font-medium mt-1">
              {selectedParticipants.length} acteur(s) notifié(s) pour : <strong className="text-slate-200">{contextLabel}</strong>
            </p>
          </div>

          <div className="p-5 space-y-3">
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {selectedParticipants.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{p.name}</p>
                    <p className="text-[10px] text-slate-500 font-medium truncate">
                      {getRoleLabel(p.role)} • {p.facility}
                    </p>
                  </div>
                  <span className="flex items-center space-x-1 shrink-0 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">
                    <Check className="w-3 h-3" />
                    <span>Notifié</span>
                  </span>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-500 font-medium text-center bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
              🛎️ Les acteurs invités ont reçu une notification d'appel. La session démarre dès que vous la rejoignez.
            </p>

            <div className="flex space-x-2 pt-1">
              <button
                onClick={resetAndClose}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3 rounded-xl transition-colors cursor-pointer"
              >
                Fermer
              </button>
              <button
                onClick={() => onStartCall(selectedParticipants, callMode)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-3 rounded-xl transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Video className="w-4 h-4" />
                <span>Rejoindre l'appel</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- PHASE 1 : sélection des acteurs / établissements ---
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-start justify-between gap-3">
          <div className="flex items-start space-x-3 min-w-0">
            <div className="p-2.5 bg-sky-50 text-sky-600 rounded-2xl border border-sky-200 shrink-0">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-slate-900 truncate">Préparer l'appel vidéo</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Indiquez d'abord les <strong>acteurs</strong> ou <strong>établissements</strong> demandés à l'appel, puis lancez la visioconférence.
              </p>
              <p className="text-[11px] text-slate-400 font-bold mt-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 inline-block truncate max-w-full">
                Contexte : {contextLabel}
              </p>
            </div>
          </div>
          <button
            onClick={resetAndClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Filtre par établissement + sélection rapide */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="text-[10px] uppercase font-bold text-slate-500 block">
              Filtrer par établissement
              <select
                value={facilityFilter}
                onChange={(e) => setFacilityFilter(e.target.value)}
                className="mt-1 w-full bg-slate-50 text-xs font-semibold text-slate-800 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500/30 cursor-pointer"
              >
                <option value="ALL">Tous les établissements</option>
                {facilitiesWithActors.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </label>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-500 block">
                Établissements demandés à l'appel
              </label>
              <div className="flex flex-wrap gap-1.5">
                {facilitiesWithActors.map((f) => {
                  const ids = candidates.filter((u) => u.facility === f).map((u) => u.id);
                  const allSelected = ids.every((id) => selectedIds.includes(id));
                  return (
                    <button
                      key={f}
                      onClick={() => toggleFacility(f)}
                      className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition-colors flex items-center space-x-1 cursor-pointer ${
                        allSelected
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-emerald-300'
                      }`}
                      title={`${allSelected ? 'Retirer' : 'Inviter'} tous les acteurs de ${f}`}
                    >
                      <Building2 className="w-3 h-3 shrink-0" />
                      <span className="truncate max-w-[110px]">{f}</span>
                      {allSelected && <Check className="w-3 h-3 shrink-0" />}
                    </button>
                  );
                })}
                {facilitiesWithActors.length === 0 && (
                  <span className="text-[11px] text-slate-400 font-medium">Aucun acteur disponible</span>
                )}
              </div>
            </div>
          </div>

          {/* Liste des acteurs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[10px] uppercase font-bold text-slate-500 flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5 text-sky-500" />
                <span>Acteurs disponibles ({visibleCandidates.length})</span>
              </h4>
              {visibleCandidates.length > 0 && (
                <button
                  onClick={toggleSelectAll}
                  className="text-[11px] font-bold text-sky-600 hover:text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  {visibleCandidates.every((u) => selectedIds.includes(u.id))
                    ? 'Tout désélectionner'
                    : 'Tout sélectionner'}
                </button>
              )}
            </div>

            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {visibleCandidates.map((u) => {
                const selected = selectedIds.includes(u.id);
                return (
                  <button
                    key={u.id}
                    onClick={() => toggleUser(u.id)}
                    className={`w-full flex items-center justify-between bg-white border rounded-xl px-3 py-2.5 text-left transition-colors cursor-pointer ${
                      selected ? 'border-emerald-400 ring-1 ring-emerald-300 bg-emerald-50/50' : 'border-slate-200 hover:border-sky-300'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{u.name}</p>
                      <p className="text-[10px] text-slate-500 font-medium truncate">
                        {getRoleLabel(u.role)} • {u.facility}
                      </p>
                    </div>
                    <span
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                        selected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {selected && <Check className="w-3.5 h-3.5" />}
                    </span>
                  </button>
                );
              })}
              {visibleCandidates.length === 0 && (
                <p className="text-[11px] text-slate-400 font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-4 text-center">
                  Aucun acteur dans cet établissement.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <p className="text-[11px] text-slate-500 font-medium">
            <strong className="text-slate-800">{selectedParticipants.length}</strong> acteur(s) sélectionné(s)
            {selectedParticipants.length > 0 && (
              <span className="text-slate-400"> — {selectedParticipants.map((p) => p.name.split(' ')[0]).join(', ')}</span>
            )}
          </p>
          <div className="flex items-center space-x-2 shrink-0">
            {/* Choix du mode : vidéo ou audio seul */}
            <div className="flex items-center bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => setCallMode('video')}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer ${
                  callMode === 'video' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Appel vidéo (caméra + micro)"
              >
                <Video className="w-4 h-4 text-sky-600" />
                <span>Vidéo</span>
              </button>
              <button
                onClick={() => setCallMode('audio')}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer ${
                  callMode === 'audio' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Appel audio seul (micro uniquement)"
              >
                <Mic className="w-4 h-4 text-emerald-600" />
                <span>Audio</span>
              </button>
            </div>
            <button
              onClick={resetAndClose}
              className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              onClick={() => setPhase('notify')}
              disabled={selectedParticipants.length === 0}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black text-xs rounded-xl transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Lancer l'appel ({selectedParticipants.length})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
