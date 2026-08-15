import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  Equipment,
  IncidentTicket,
  KnowledgeArticle,
  AuditLog,
  TicketStatus,
  UrgencyLevel,
  InterventionReport
} from './types';
import {
  MOCK_USERS,
  MOCK_EQUIPMENT,
  MOCK_TICKETS,
  MOCK_KNOWLEDGE_BASE,
  MOCK_AUDIT_LOGS,
  MOCK_FACILITIES
} from './data/mockData';

import { Header } from './components/Header';
import { RoleContextBar } from './components/RoleContextBar';
import { EquipmentList } from './components/EquipmentList';
import { EquipmentModal } from './components/EquipmentModal';
import { TicketList } from './components/TicketList';
import { IncidentReportingModal } from './components/IncidentReportingModal';
import { RemoteDiagnosticModal } from './components/RemoteDiagnosticModal';
import { TeleMaintenanceSession } from './components/TeleMaintenanceSession';
import { InterventionModal } from './components/InterventionModal';
import { KnowledgeBase } from './components/KnowledgeBase';
import { DashboardAnalytics } from './components/DashboardAnalytics';
import { CriticalAlertsHistory } from './components/CriticalAlertsHistory';
import { AdminUsersAudit } from './components/AdminUsersAudit';
import { AiAssistantDrawer } from './components/AiAssistantDrawer';
import { VideoConferenceModal } from './components/VideoConferenceModal';
import { ToastContainer, Toast } from './components/ToastContainer';
import { OfflineBanner } from './components/OfflineBanner';

import {
  getCachedData,
  setCachedData,
  STORAGE_KEYS,
  queueOfflineAction,
  getPendingOfflineActions,
  clearPendingOfflineActions,
  getLastCacheTimestamp,
  PendingSyncAction
} from './lib/offlineStorage';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(MOCK_USERS[0]); // Technicien
  const [users, setUsers] = useState<UserProfile[]>(() =>
    getCachedData('biomed_users_v1', MOCK_USERS)
  );
  const [equipmentList, setEquipmentList] = useState<Equipment[]>(() =>
    getCachedData(STORAGE_KEYS.EQUIPMENT, MOCK_EQUIPMENT)
  );
  const [tickets, setTickets] = useState<IncidentTicket[]>(() =>
    getCachedData(STORAGE_KEYS.TICKETS, MOCK_TICKETS)
  );
  const [knowledgeArticles, setKnowledgeArticles] = useState<KnowledgeArticle[]>(() =>
    getCachedData(STORAGE_KEYS.KNOWLEDGE, MOCK_KNOWLEDGE_BASE)
  );
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() =>
    getCachedData(STORAGE_KEYS.AUDIT, MOCK_AUDIT_LOGS)
  );

  // Network & Cache State
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);
  const [pendingActions, setPendingActions] = useState<PendingSyncAction[]>(() =>
    getPendingOfflineActions()
  );
  const [lastCacheTime, setLastCacheTime] = useState<string | null>(() =>
    getLastCacheTimestamp()
  );

  const [selectedFacility, setSelectedFacility] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<string>('equipment');

  // Modals state
  const [selectedEquipmentForModal, setSelectedEquipmentForModal] = useState<Equipment | null>(null);
  const [selectedEquipmentForDiag, setSelectedEquipmentForDiag] = useState<Equipment | null>(null);
  const [selectedTicketForDiag, setSelectedTicketForDiag] = useState<IncidentTicket | null>(null);
  const [selectedEquipmentForTeleSession, setSelectedEquipmentForTeleSession] = useState<Equipment | null>(null);
  const [selectedTicketForReport, setSelectedTicketForReport] = useState<IncidentTicket | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState<boolean>(false);
  const [isVideoConferenceOpen, setIsVideoConferenceOpen] = useState<boolean>(false);
  const [selectedTicketForVideoCall, setSelectedTicketForVideoCall] = useState<IncidentTicket | null>(null);

  // Toast Notifications State
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (
    type: 'info' | 'success' | 'warning' | 'danger',
    title: string,
    message: string
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast: Toast = {
      id,
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
    };
    setToasts((prev) => [newToast, ...prev]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync state to local storage cache on update
  useEffect(() => {
    setCachedData(STORAGE_KEYS.EQUIPMENT, equipmentList);
    setLastCacheTime(getLastCacheTimestamp());
  }, [equipmentList]);

  useEffect(() => {
    setCachedData(STORAGE_KEYS.TICKETS, tickets);
    setLastCacheTime(getLastCacheTimestamp());
  }, [tickets]);

  useEffect(() => {
    setCachedData(STORAGE_KEYS.KNOWLEDGE, knowledgeArticles);
  }, [knowledgeArticles]);

  useEffect(() => {
    setCachedData(STORAGE_KEYS.AUDIT, auditLogs);
  }, [auditLogs]);

  // Handle Online / Offline network event listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      addToast(
        'success',
        'Connexion Réseau Rétablie',
        'La connexion avec le serveur central a été restaurée. Synchronisation du cache...'
      );
      handleForceSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      addToast(
        'warning',
        'Mode Hors Ligne Activé',
        'Connexion réseau perdue. Vous pouvez continuer à consulter les équipements et tickets grâce au cache local (Service Worker).'
      );
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Force Manual / Auto Sync
  const handleForceSync = () => {
    const pending = getPendingOfflineActions();
    if (pending.length > 0) {
      clearPendingOfflineActions();
      setPendingActions([]);
      addToast(
        'success',
        'Synchronisation Réussie',
        `${pending.length} modification(s) enregistrée(s) hors-ligne ont été synchronisées avec le serveur central.`
      );
    } else {
      addToast(
        'info',
        'Cache à Jour',
        'Toutes les données biomédicales locales sont synchronisées avec le serveur.'
      );
    }
  };

  // Helper: Log audit action
  const logAuditAction = (action: string, target: string, details: string) => {
    const newLog: AuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: currentUser.name,
      role: currentUser.role,
      action,
      target,
      ipAddress: '197.220.14.102',
      details,
    };
    setAuditLogs([newLog, ...auditLogs]);
  };


  // Incident Ticket Submission
  const handleCreateTicket = (data: {
    equipmentId: string;
    description: string;
    symptoms: string[];
    urgency: UrgencyLevel;
    errorCode?: string;
  }) => {
    const eq = equipmentList.find((e) => e.id === data.equipmentId);
    if (!eq) return;

    // SLA Deadline logic: 2h for critical, 4h for high, 24h for medium, 48h for low
    let hours = 24;
    if (data.urgency === 'critical_vital') hours = 2;
    else if (data.urgency === 'high') hours = 4;
    else if (data.urgency === 'low') hours = 48;

    const newTicket: IncidentTicket = {
      id: `tkt-${Date.now()}`,
      code: `INC-2026-${Math.floor(100 + Math.random() * 900)}`,
      equipmentId: eq.id,
      equipmentName: eq.name,
      equipmentCategory: eq.category,
      facility: eq.facility,
      reportedBy: {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
      },
      reportedAt: new Date().toISOString(),
      urgency: data.urgency,
      symptoms: data.symptoms,
      description: data.description,
      status: 'new',
      errorCode: data.errorCode || eq.telemetry.errorCode,
      slaDeadline: new Date(Date.now() + hours * 3600000).toISOString(),
      history: [
        {
          timestamp: new Date().toISOString(),
          actor: `${currentUser.name} (${currentUser.title})`,
          action: 'Création du signalement d\'incident',
          comment: data.description,
        },
      ],
    };

    // Update equipment status if breakdown
    setEquipmentList(
      equipmentList.map((item) =>
        item.id === eq.id
          ? {
              ...item,
              status: data.urgency === 'critical_vital' ? 'critical' : 'breakdown',
              telemetry: {
                ...item.telemetry,
                errorCode: data.errorCode || item.telemetry.errorCode || 'ERR-SYS-01',
              },
            }
          : item
      )
    );

    setTickets([newTicket, ...tickets]);
    logAuditAction('Création Signalement Incident', `Ticket ${newTicket.code}`, `Équipement ${eq.name}`);

    // Queue action if offline
    if (!isOnline || isSimulatedOffline) {
      const action = queueOfflineAction({
        type: 'CREATE_INCIDENT',
        payload: newTicket,
      });
      setPendingActions(getPendingOfflineActions());
      addToast(
        'warning',
        '⚡ Action Enregistrée Hors Ligne',
        `Le ticket ${newTicket.code} a été sauvegardé localement en cache. Il sera transmis lors du rétablissement du réseau.`
      );
    } else if (data.urgency === 'critical_vital' || data.urgency === 'high') {
      addToast(
        'danger',
        '🚨 INCIDENT CRITIQUE DÉCLARÉ',
        `Alerte : Nouvel incident grave (${newTicket.code}) sur ${eq.name} (${eq.facility}). SLA engagé: ${hours}h.`
      );
    } else {
      addToast(
        'warning',
        'Nouveau Signalement Incident',
        `Signalement ${newTicket.code} enregistré pour l'équipement ${eq.name}.`
      );
    }
  };

  // Ticket Assignment
  const handleAssignTicket = (ticketId: string, technicianId: string) => {
    const tech = users.find((u) => u.id === technicianId);
    const targetTicket = tickets.find((t) => t.id === ticketId);

    setTickets(
      tickets.map((t) => {
        if (t.id === ticketId) {
          return {
            ...t,
            assignedTo: tech
              ? { id: tech.id, name: tech.name, role: tech.role }
              : undefined,
            history: [
              ...t.history,
              {
                timestamp: new Date().toISOString(),
                actor: currentUser.name,
                action: tech ? `Affecté à ${tech.name}` : 'Désaffecté',
              },
            ],
          };
        }
        return t;
      })
    );
    logAuditAction('Affectation Ticket', `Ticket ${ticketId}`, tech ? `Assigné à ${tech.name}` : 'Non assigné');

    if (targetTicket) {
      addToast(
        'info',
        'Affectation de Ticket',
        `Le ticket ${targetTicket.code} a été ${tech ? `assigné à ${tech.name}` : 'désaffecté'}.`
      );
    }
  };

  // Ticket Status Update
  const handleUpdateTicketStatus = (ticketId: string, newStatus: TicketStatus) => {
    const tkt = tickets.find((t) => t.id === ticketId);

    const statusLabels: Record<TicketStatus, string> = {
      new: 'Signalé (Nouveau)',
      diagnosed: 'Diagnostiqué',
      in_progress: 'Intervention en Cours',
      waiting_part: 'En attente de Pièce',
      resolved: 'Résolu (Testé)',
      validated: 'Clôturé & Validé',
    };

    setTickets(
      tickets.map((t) => {
        if (t.id === ticketId) {
          return {
            ...t,
            status: newStatus,
            history: [
              ...t.history,
              {
                timestamp: new Date().toISOString(),
                actor: currentUser.name,
                action: `Statut modifié : ${newStatus}`,
              },
            ],
          };
        }
        return t;
      })
    );

    // If resolved or validated, set equipment operational
    if (tkt && (newStatus === 'resolved' || newStatus === 'validated')) {
      setEquipmentList(
        equipmentList.map((e) =>
          e.id === tkt.equipmentId
            ? {
                ...e,
                status: 'operational',
                telemetry: { ...e.telemetry, errorCode: undefined, errorDescription: undefined },
              }
            : e
        )
      );
    }

    logAuditAction('Changement Statut Ticket', `Ticket ${ticketId}`, `Nouveau statut: ${newStatus}`);

    if (!isOnline || isSimulatedOffline) {
      queueOfflineAction({
        type: 'UPDATE_STATUS',
        payload: { ticketId, newStatus },
      });
      setPendingActions(getPendingOfflineActions());
      addToast(
        'warning',
        '⚡ Mise à jour enregistrée en cache',
        `Changement de statut pour le ticket ${tkt?.code || ticketId} sauvegardé hors-ligne.`
      );
    } else if (tkt) {
      const isComplete = newStatus === 'validated' || newStatus === 'resolved';
      addToast(
        isComplete ? 'success' : 'info',
        'Changement de Statut Ticket',
        `Le ticket ${tkt.code} est désormais "${statusLabels[newStatus] || newStatus}".`
      );
    }
  };

  // Intervention Report Saved
  const handleSaveInterventionReport = (reportData: Partial<InterventionReport>) => {
    if (reportData.ticketId) {
      handleUpdateTicketStatus(reportData.ticketId, reportData.validatedByEngineer ? 'validated' : 'resolved');
    }
    logAuditAction('Clôture Rapport Intervention', `Rapport ${reportData.ticketId}`, 'Intervention clôturée et validée');
    addToast(
      'success',
      'Rapport d\'Intervention Certifié',
      'Le PV d\'intervention a été enregistré avec succès et l\'équipement certifié opérationnel.'
    );
  };

  // Users CRUD
  const handleAddUser = (newUser: UserProfile) => {
    setUsers([...users, newUser]);
    logAuditAction('Création Acteur', `Utilisateur ${newUser.name}`, `Rôle ${newUser.role}`);
  };

  const handleUpdateUser = (updatedUser: UserProfile) => {
    setUsers(users.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    if (currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
    logAuditAction('Modification Acteur', `Utilisateur ${updatedUser.name}`, `Mis à jour permissions/infos`);
  };

  const handleDeleteUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    setUsers(users.filter((u) => u.id !== userId));
    logAuditAction('Suppression Acteur', `ID ${userId}`, target ? target.name : 'Utilisateur supprimé');
  };

  // Equipment CRUD
  const handleAddEquipment = (newEq: Equipment) => {
    setEquipmentList([newEq, ...equipmentList]);
    logAuditAction('Ajout Équipement', `Code ${newEq.code}`, `Modèle ${newEq.model}`);
  };

  const handleUpdateEquipment = (updatedEq: Equipment) => {
    setEquipmentList(equipmentList.map((e) => (e.id === updatedEq.id ? updatedEq : e)));
    logAuditAction('Modification Équipement', `Code ${updatedEq.code}`, `Mis à jour statut/infos`);
  };

  const handleDeleteEquipment = (eqId: string) => {
    const target = equipmentList.find((e) => e.id === eqId);
    setEquipmentList(equipmentList.filter((e) => e.id !== eqId));
    logAuditAction('Suppression Équipement', `ID ${eqId}`, target ? target.name : 'Équipement supprimé');
  };

  const pendingTicketsCount = tickets.filter((t) => t.status !== 'validated' && t.status !== 'resolved').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Toast Notifications Overlay */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />

      {/* Offline Banner Bar */}
      <OfflineBanner
        isOnline={isOnline}
        lastCacheTime={lastCacheTime}
        pendingActions={pendingActions}
        onForceSync={handleForceSync}
        onToggleSimulateOffline={() => setIsSimulatedOffline(!isSimulatedOffline)}
        isSimulatedOffline={isSimulatedOffline}
      />

      {/* Header with App Title, Role Switcher, Tabs */}
      <Header
        currentUser={currentUser}
        users={users}
        onSelectUser={setCurrentUser}
        selectedFacility={selectedFacility}
        facilities={MOCK_FACILITIES}
        onSelectFacility={setSelectedFacility}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onToggleAiDrawer={() => setIsAiDrawerOpen(!isAiDrawerOpen)}
        onOpenVideoCall={() => {
          setSelectedTicketForVideoCall(null);
          setIsVideoConferenceOpen(true);
        }}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        pendingTicketsCount={pendingTicketsCount}
        isOnline={isOnline}
        isSimulatedOffline={isSimulatedOffline}
      />

      {/* Role Context Bar */}
      <RoleContextBar currentUser={currentUser} />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* TAB 1: Equipment Fleet */}
        {activeTab === 'equipment' && (
          <EquipmentList
            equipmentList={equipmentList}
            selectedFacility={selectedFacility}
            onViewDetails={(eq) => setSelectedEquipmentForModal(eq)}
            onOpenDiagnostic={(eq) => setSelectedEquipmentForDiag(eq)}
            onOpenTeleSession={(eq) => setSelectedEquipmentForTeleSession(eq)}
            onReportIncident={(eq) => {
              setSelectedEquipmentForModal(null);
              setIsReportModalOpen(true);
            }}
            onAddNewEquipment={currentUser.role === 'admin' || currentUser.role === 'engineer' ? () => setActiveTab('admin') : undefined}
          />
        )}

        {/* TAB 2: Incident Tickets */}
        {activeTab === 'tickets' && (
          <TicketList
            tickets={tickets}
            users={users}
            currentUser={currentUser}
            selectedFacility={selectedFacility}
            onOpenDiagnostic={(tkt) => {
              const eq = equipmentList.find((e) => e.id === tkt.equipmentId);
              if (eq) {
                setSelectedTicketForDiag(tkt);
                setSelectedEquipmentForDiag(eq);
              }
            }}
            onOpenTeleSession={(tkt) => {
              const eq = equipmentList.find((e) => e.id === tkt.equipmentId);
              setSelectedTicketForVideoCall(tkt);
              if (eq) setSelectedEquipmentForTeleSession(eq);
              setIsVideoConferenceOpen(true);
            }}
            onOpenInterventionReport={(tkt) => setSelectedTicketForReport(tkt)}
            onAssignTicket={handleAssignTicket}
            onUpdateStatus={handleUpdateTicketStatus}
            onOpenCreateTicket={() => setIsReportModalOpen(true)}
          />
        )}

        {/* TAB 3: Knowledge Base */}
        {activeTab === 'knowledge' && (
          <KnowledgeBase
            articles={knowledgeArticles}
            onAddArticle={(newArt) => setKnowledgeArticles([newArt, ...knowledgeArticles])}
          />
        )}

        {/* TAB 4: Dashboard Analytics */}
        {activeTab === 'analytics' && (
          <DashboardAnalytics
            equipmentList={equipmentList}
            tickets={tickets}
            selectedFacility={selectedFacility}
          />
        )}

        {/* TAB 4.5: Dedicated Critical Alerts & MTTR History View */}
        {activeTab === 'alerts' && (
          <CriticalAlertsHistory
            tickets={tickets}
            facilities={MOCK_FACILITIES}
            selectedFacility={selectedFacility}
            onSelectFacility={setSelectedFacility}
            onOpenDiagnostic={(tkt) => {
              const eq = equipmentList.find((e) => e.id === tkt.equipmentId);
              if (eq) {
                setSelectedTicketForDiag(tkt);
                setSelectedEquipmentForDiag(eq);
              }
            }}
            onOpenReport={(tkt) => setSelectedTicketForReport(tkt)}
          />
        )}

        {/* TAB 5: Admin & Audit */}
        {activeTab === 'admin' && (
          <AdminUsersAudit
            users={users}
            auditLogs={auditLogs}
            equipmentList={equipmentList}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            onAddEquipment={handleAddEquipment}
            onUpdateEquipment={handleUpdateEquipment}
            onDeleteEquipment={handleDeleteEquipment}
          />
        )}
      </main>

      {/* Modals & Slide-Out Drawers */}
      <EquipmentModal
        equipment={selectedEquipmentForModal}
        onClose={() => setSelectedEquipmentForModal(null)}
        onOpenDiagnostic={(eq) => setSelectedEquipmentForDiag(eq)}
        onOpenTeleSession={(eq) => setSelectedEquipmentForTeleSession(eq)}
        onReportIncident={() => setIsReportModalOpen(true)}
      />

      <IncidentReportingModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        equipmentList={equipmentList}
        selectedEquipmentPreload={selectedEquipmentForModal}
        currentUser={currentUser}
        onSubmitTicket={handleCreateTicket}
      />

      <RemoteDiagnosticModal
        isOpen={!!selectedEquipmentForDiag}
        onClose={() => {
          setSelectedEquipmentForDiag(null);
          setSelectedTicketForDiag(null);
        }}
        equipment={selectedEquipmentForDiag}
        ticket={selectedTicketForDiag}
        onOpenTeleSession={(eq) => setSelectedEquipmentForTeleSession(eq)}
      />

      <TeleMaintenanceSession
        isOpen={!!selectedEquipmentForTeleSession}
        onClose={() => setSelectedEquipmentForTeleSession(null)}
        equipment={selectedEquipmentForTeleSession}
        currentUser={currentUser}
      />

      <InterventionModal
        isOpen={!!selectedTicketForReport}
        onClose={() => setSelectedTicketForReport(null)}
        ticket={selectedTicketForReport}
        currentUser={currentUser}
        onSaveReport={handleSaveInterventionReport}
      />

      <AiAssistantDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
        currentUser={currentUser}
        selectedEquipment={selectedEquipmentForModal || selectedEquipmentForDiag}
      />

      <VideoConferenceModal
        isOpen={isVideoConferenceOpen}
        onClose={() => {
          setIsVideoConferenceOpen(false);
          setSelectedTicketForVideoCall(null);
        }}
        ticket={selectedTicketForVideoCall}
        equipment={selectedEquipmentForTeleSession || selectedEquipmentForModal}
        currentUser={currentUser}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500 shadow-xs mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 BioMed — Plateforme Collaborative de Maintenance Biomédicale</p>
          <p className="text-[11px] text-slate-400 font-medium">
            Conforme HDS, ISO 13485 & NF EN 60601-1
          </p>
        </div>
      </footer>
    </div>
  );
}
