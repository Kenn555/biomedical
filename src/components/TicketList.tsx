import React, { useState } from 'react';
import { IncidentTicket, TicketStatus, UrgencyLevel, UserProfile } from '../types';
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  User,
  Search,
  Filter,
  Wrench,
  ArrowRight,
  FileCheck,
  Video,
  PlusCircle,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  History,
  Maximize2,
  Minimize2,
  X,
  Paperclip,
  Mic,
  Image
} from 'lucide-react';
import { getRoleLabel } from './Header';
import { can, isRole } from '../lib/permissions';
import { TICKET_STATUS_OPTIONS, URGENCY_LEVEL_OPTIONS } from '../lib/selectOptions';

interface TicketListProps {
  tickets: IncidentTicket[];
  users: UserProfile[];
  currentUser: UserProfile;
  selectedFacility: string;
  onOpenDiagnostic: (ticket: IncidentTicket) => void;
  onOpenTeleSession: (ticket: IncidentTicket) => void;
  onOpenInterventionReport: (ticket: IncidentTicket) => void;
  onAssignTicket: (ticketId: string, technicianId: string) => void;
  onUpdateStatus: (ticketId: string, newStatus: TicketStatus) => void;
  onOpenCreateTicket: () => void;
}

export const TicketList: React.FC<TicketListProps> = ({
  tickets,
  users,
  currentUser,
  selectedFacility,
  onOpenDiagnostic,
  onOpenTeleSession,
  onOpenInterventionReport,
  onAssignTicket,
  onUpdateStatus,
  onOpenCreateTicket,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('ALL');
  const [expandedTicketIds, setExpandedTicketIds] = useState<string[]>([]);

  const toggleExpand = (ticketId: string) => {
    setExpandedTicketIds((prev) =>
      prev.includes(ticketId) ? prev.filter((id) => id !== ticketId) : [...prev, ticketId]
    );
  };

  const toggleExpandAll = () => {
    if (expandedTicketIds.length === filteredTickets.length) {
      setExpandedTicketIds([]);
    } else {
      setExpandedTicketIds(filteredTickets.map((t) => t.id));
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    if (selectedFacility !== 'ALL' && ticket.facility !== selectedFacility) {
      return false;
    }
    if (statusFilter !== 'ALL' && ticket.status !== statusFilter) {
      return false;
    }
    if (urgencyFilter !== 'ALL' && ticket.urgency !== urgencyFilter) {
      return false;
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        ticket.code.toLowerCase().includes(q) ||
        ticket.equipmentName.toLowerCase().includes(q) ||
        ticket.facility.toLowerCase().includes(q) ||
        ticket.description.toLowerCase().includes(q) ||
        (ticket.errorCode && ticket.errorCode.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getUrgencyBadge = (urgency: UrgencyLevel) => {
    switch (urgency) {
      case 'critical_vital':
        return {
          label: 'URGENCE VITALE',
          bg: 'bg-rose-600 text-white animate-pulse shadow-xs',
          icon: ShieldAlert
        };
      case 'high':
        return {
          label: 'Priorité Élevée',
          bg: 'bg-rose-50 text-rose-700 border border-rose-200',
          icon: AlertTriangle
        };
      case 'medium':
        return {
          label: 'Priorité Modérée',
          bg: 'bg-amber-50 text-amber-700 border border-amber-200',
          icon: Clock
        };
      case 'low':
        return {
          label: 'Faible',
          bg: 'bg-sky-50 text-sky-700 border border-sky-200',
          icon: CheckCircle
        };
    }
  };

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'new':
        return { label: 'Signalé (Nouveau)', bg: 'bg-rose-50 text-rose-700 border border-rose-200' };
      case 'diagnosed':
        return { label: 'Diagnostiqué', bg: 'bg-amber-50 text-amber-700 border border-amber-200' };
      case 'in_progress':
        return { label: 'Intervention en Cours', bg: 'bg-sky-50 text-sky-700 border border-sky-200' };
      case 'waiting_part':
        return { label: 'Attente Pièce', bg: 'bg-purple-50 text-purple-700 border border-purple-200' };
      case 'resolved':
        return { label: 'Résolu (Test Réussi)', bg: 'bg-emerald-50 text-emerald-700 border border-emerald-200' };
      case 'validated':
        return { label: 'Validé par Ingénieur', bg: 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold' };
    }
  };

  // Compute remaining SLA time
  const getSlaRemaining = (deadline: string) => {
    const now = new Date().getTime();
    const target = new Date(deadline).getTime();
    const diffMs = target - now;
    if (diffMs <= 0) {
      return { text: 'SLA Dépassé !', alert: true };
    }
    const mins = Math.floor(diffMs / (1000 * 60));
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return {
      text: `${hrs > 0 ? `${hrs}h ` : ''}${remMins}min restantes`,
      alert: hrs === 0 && remMins < 30
    };
  };

  const technicians = users.filter((u) => u.role === 'technician' || u.role === 'engineer' || u.role === 'vendor');

  return (
    <div className="space-y-6">
      {/* Control Header */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un ticket par code (ex: INC-2026-088), équipement, centre, symptôme..."
            className="w-full bg-slate-50 hover:bg-slate-100/60 text-slate-900 placeholder-slate-400 text-xs font-medium rounded-xl pl-10 pr-9 py-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 focus:bg-white transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 rounded-md hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Effacer la recherche"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-2 bg-slate-100/90 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium transition-colors shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-900 font-semibold border-none focus:outline-none cursor-pointer text-xs"
            >
              <option value="ALL" className="bg-white">Tous les Statuts</option>
              {TICKET_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2 bg-slate-100/90 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium transition-colors shadow-2xs">
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="bg-transparent text-slate-900 font-semibold border-none focus:outline-none cursor-pointer text-xs"
            >
              <option value="ALL" className="bg-white">Toutes Urgences</option>
              {URGENCY_LEVEL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {filteredTickets.length > 0 && (
            <button
              onClick={toggleExpandAll}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
              title="Développer ou réduire tous les tickets"
            >
              {expandedTicketIds.length === filteredTickets.length ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-slate-600" />
                  <span className="hidden sm:inline">Tout Réduire</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-slate-600" />
                  <span className="hidden sm:inline">Tout Développer</span>
                </>
              )}
            </button>
          )}

          {can(currentUser, 'canReportIncident') && (
            <button
              onClick={onOpenCreateTicket}
              className="bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs whitespace-nowrap"
              title="Nouveau signalement d'incident / Créer un ticket"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span>Nouveau Signalement</span>
            </button>
          )}
        </div>
      </div>

      {/* Ticket List Accordion */}
      {filteredTickets.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-sm">
          <CheckCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Aucun ticket d'incident d'équipement</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Tous les équipements biomédicaux fonctionnent nominalement pour cette sélection.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTickets.map((ticket) => {
            const urgency = getUrgencyBadge(ticket.urgency);
            const status = getStatusBadge(ticket.status);
            const sla = getSlaRemaining(ticket.slaDeadline);
            const UrgencyIcon = urgency.icon;
            const isExpanded = expandedTicketIds.includes(ticket.id);

            return (
              <div
                key={ticket.id}
                className={`bg-white border transition-all rounded-2xl overflow-hidden shadow-xs ${
                  isExpanded ? 'border-slate-400 ring-1 ring-slate-300' : 'border-slate-200/90 hover:border-slate-300'
                }`}
              >
                {/* COMPACT SUMMARY HEADER ROW - ALWAYS VISIBLE */}
                <div
                  onClick={() => toggleExpand(ticket.id)}
                  className="p-3.5 sm:px-5 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 cursor-pointer hover:bg-slate-50/80 transition-colors select-none"
                >
                  {/* Left Column: Code, Equipment, Facility, Reported */}
                  <div className="flex items-center space-x-3 min-w-0">
                    <span className="font-mono text-xs font-bold bg-slate-900 text-white px-2.5 py-1 rounded-lg shrink-0">
                      {ticket.code}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <h3 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                          {ticket.equipmentName}
                        </h3>
                        {ticket.errorCode && (
                          <span className="text-[10px] font-mono bg-rose-50 text-rose-700 px-1.5 py-0.2 rounded border border-rose-200 shrink-0">
                            {ticket.errorCode}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium truncate">
                        {ticket.facility} • {new Date(ticket.reportedAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>

                  {/* Middle Badges: Urgency, Status, SLA, Assignee */}
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 ${urgency.bg}`}>
                      <UrgencyIcon className="w-3 h-3 shrink-0" />
                      <span>{urgency.label}</span>
                    </span>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${status.bg}`}>
                      {status.label}
                    </span>

                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border flex items-center space-x-1 ${
                        sla.alert
                          ? 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse'
                          : 'bg-slate-100 border-slate-200 text-slate-600'
                      }`}
                    >
                      <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                      <span>SLA: {sla.text}</span>
                    </span>

                    {/* Assigned Tech badge */}
                    <span className="hidden md:inline-flex items-center space-x-1 text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-200">
                      <User className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="truncate max-w-[100px]">{ticket.assignedTo ? ticket.assignedTo.name.split(' ')[0] : 'Non assigné'}</span>
                    </span>

                    {/* Expand/Collapse Chevron Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(ticket.id);
                      }}
                      className="ml-1 p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shrink-0"
                      title={isExpanded ? 'Réduire' : 'Développer les détails'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* EXPANDABLE DETAILS BODY */}
                {isExpanded && (
                  <div className="border-t border-slate-200/80 p-4 sm:p-5 bg-slate-50/50 space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {/* Left: Full Details & Diagnostic Summary */}
                      <div className="lg:col-span-2 space-y-3">
                        {/* Reported by & Full Timestamp */}
                        <div className="text-xs text-slate-600 font-medium bg-white p-2.5 rounded-xl border border-slate-200/80">
                          Signalé par <strong className="text-slate-900">{ticket.reportedBy.name}</strong> ({getRoleLabel(ticket.reportedBy.role)}) le{' '}
                          <span className="font-mono">{new Date(ticket.reportedAt).toLocaleString('fr-FR')}</span>
                        </div>

                        {/* Description */}
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                            Description du Dysfonctionnement
                          </label>
                          <p className="text-xs text-slate-800 bg-white p-3 rounded-xl border border-slate-200/80 leading-relaxed font-medium">
                            "{ticket.description}"
                          </p>
                        </div>

                        {/* Symptoms Tags */}
                        {ticket.symptoms.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                            <span className="text-slate-500 font-bold">Symptômes identifiés:</span>
                            {ticket.symptoms.map((s, idx) => (
                              <span
                                key={idx}
                                className="bg-white text-slate-700 font-medium px-2.5 py-0.5 rounded-md border border-slate-200 shadow-2xs"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Pièces jointes : photo/vidéo & mémo vocal */}
                        {(ticket.attachments?.photoVideo || ticket.attachments?.voiceMemo) && (
                          <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-3">
                            <h4 className="text-[11px] font-bold text-slate-700 flex items-center space-x-1.5">
                              <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                              <span>Pièces Jointes ({[ticket.attachments?.photoVideo, ticket.attachments?.voiceMemo].filter(Boolean).length})</span>
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {ticket.attachments.photoVideo &&
                                (ticket.attachments.photoVideo.startsWith('data:video') ? (
                                  <video
                                    src={ticket.attachments.photoVideo}
                                    controls
                                    className="w-full rounded-lg bg-black max-h-44"
                                  />
                                ) : (
                                  <div className="space-y-1">
                                    <img
                                      src={ticket.attachments.photoVideo}
                                      alt="Photo jointe au signalement"
                                      className="w-full rounded-lg max-h-44 object-cover"
                                    />
                                    <p className="text-[10px] text-slate-400 font-bold flex items-center space-x-1">
                                      <Image className="w-3 h-3" />
                                      <span>Photo jointe au signalement</span>
                                    </p>
                                  </div>
                                ))}
                              {ticket.attachments.voiceMemo && (
                                <div className="space-y-1">
                                  <audio src={ticket.attachments.voiceMemo} controls className="w-full" />
                                  <p className="text-[10px] text-slate-400 font-bold flex items-center space-x-1">
                                    <Mic className="w-3 h-3" />
                                    <span>Mémo vocal du signalant</span>
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Diagnostic Summary if present */}
                        {ticket.aiDiagnosticSummary && (
                          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 flex items-start space-x-2">
                            <Wrench className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-emerald-800">Synthèse de Diagnostic Technique :</span>
                              <p className="text-slate-700 text-[11px] mt-0.5 font-medium">{ticket.aiDiagnosticSummary}</p>
                            </div>
                          </div>
                        )}

                        {/* History Timeline */}
                        {ticket.history && ticket.history.length > 0 && (
                          <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-2">
                            <h4 className="text-[11px] font-bold text-slate-700 flex items-center space-x-1.5">
                              <History className="w-3.5 h-3.5 text-slate-500" />
                              <span>Historique des Actions ({ticket.history.length})</span>
                            </h4>
                            <div className="space-y-1.5 text-[11px]">
                              {ticket.history.map((h, i) => (
                                <div key={i} className="flex items-start justify-between border-b border-slate-100 last:border-0 pb-1">
                                  <div>
                                    <span className="font-bold text-slate-900">{h.actor}</span>: <span className="text-slate-700">{h.action}</span>
                                    {h.comment && <p className="text-[10px] text-slate-500 italic">"{h.comment}"</p>}
                                  </div>
                                  <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-2">
                                    {new Date(h.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: Actions & Assignment Controls */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200/80 space-y-3.5 flex flex-col justify-between">
                        <div className="space-y-3">
                          {/* Assignment Picker (réservé gestion) */}
                          {isRole(currentUser, ['admin', 'engineer', 'manager']) && (
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                Technicien Assigné
                              </label>
                              <div className="flex items-center space-x-2">
                                <User className="w-4 h-4 text-slate-400 shrink-0" />
                                <select
                                  value={ticket.assignedTo?.id || ''}
                                  onChange={(e) => onAssignTicket(ticket.id, e.target.value)}
                                  className="bg-slate-50 text-xs font-semibold text-slate-800 border-none rounded-lg px-2 py-1.5 w-full focus:outline-none cursor-pointer"
                                >
                                  <option value="">-- Non assigné --</option>
                                  {technicians.map((tech) => (
                                    <option key={tech.id} value={tech.id}>
                                      {tech.name} ({getRoleLabel(tech.role)})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}

                          {/* Workflow Status Selector (rôles maintenance) */}
                          {isRole(currentUser, ['admin', 'engineer', 'technician', 'manager', 'vendor']) && (
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                Statut de Traitement
                              </label>
                              <select
                                value={ticket.status}
                                onChange={(e) => onUpdateStatus(ticket.id, e.target.value as TicketStatus)}
                                className="bg-slate-50 text-xs font-bold text-emerald-700 border-none rounded-lg px-2.5 py-1.5 w-full focus:outline-none cursor-pointer"
                              >
                                {TICKET_STATUS_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          {can(currentUser, 'canRunDiagnostic') && (
                            <button
                              onClick={() => onOpenDiagnostic(ticket)}
                              className="w-full bg-slate-900 hover:bg-slate-800 text-emerald-400 p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
                              title="Lancer le guide de diagnostic technique & Arbre de décision"
                            >
                              <Wrench className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span>Guide & Diagnostic Technique</span>
                            </button>
                          )}

                          {can(currentUser, 'canRunDiagnostic') && (
                            <button
                              onClick={() => onOpenTeleSession(ticket)}
                              className="w-full bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 p-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                              title="Démarrer la session de Télé-Assistance vidéo directe"
                            >
                              <Video className="w-4 h-4 text-sky-600 shrink-0" />
                              <span>Télé-Assistance Directe</span>
                            </button>
                          )}

                          {can(currentUser, 'canCloseIntervention') && (
                            <button
                              onClick={() => onOpenInterventionReport(ticket)}
                              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 p-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                              title="Saisir le rapport d'intervention et le PV de clôture"
                            >
                              <FileCheck className="w-4 h-4 text-amber-600 shrink-0" />
                              <span>Rapport & Fiche d'Intervention</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
