import React, { useState, useEffect, lazy, Suspense } from 'react';
import {
  UserProfile,
  Equipment,
  IncidentTicket,
  KnowledgeArticle,
  AuditLog,
  TicketStatus,
  UrgencyLevel,
  InterventionReport,
  VideoSession
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
import { EquipmentModal } from './components/EquipmentModal';
import { IncidentReportingModal } from './components/IncidentReportingModal';
import { RemoteDiagnosticModal } from './components/RemoteDiagnosticModal';
import { TeleMaintenanceSession } from './components/TeleMaintenanceSession';
import { InterventionModal } from './components/InterventionModal';
import { AiAssistantDrawer } from './components/AiAssistantDrawer';
import { VideoConferenceModal } from './components/VideoConferenceModal';
import { ToastContainer, Toast } from './components/ToastContainer';
import { OfflineBanner } from './components/OfflineBanner';
import { LoginScreen } from './components/LoginScreen';
import { AppLoader, TabSkeleton, TopProgressBar } from './components/Loading';
import { ShieldCheck } from 'lucide-react';

// Onglets chargés à la demande (code-splitting) : le bundle initial est plus
// léger (Recharts notamment n'est chargé qu'avec l'onglet Supervision).
const EquipmentList = lazy(() => import('./components/EquipmentList').then((m) => ({ default: m.EquipmentList })));
const TicketList = lazy(() => import('./components/TicketList').then((m) => ({ default: m.TicketList })));
const KnowledgeBase = lazy(() => import('./components/KnowledgeBase').then((m) => ({ default: m.KnowledgeBase })));
const DashboardAnalytics = lazy(() => import('./components/DashboardAnalytics').then((m) => ({ default: m.DashboardAnalytics })));
const CriticalAlertsHistory = lazy(() => import('./components/CriticalAlertsHistory').then((m) => ({ default: m.CriticalAlertsHistory })));
const AdminUsersAudit = lazy(() => import('./components/AdminUsersAudit').then((m) => ({ default: m.AdminUsersAudit })));

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
import { api, loadAllData } from './lib/api';
import { can } from './lib/permissions';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(
    MOCK_USERS.find((u) => u.role === 'admin') || MOCK_USERS[0]
  );
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [tabLoading, setTabLoading] = useState<boolean>(false);
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
  const [videoSessions, setVideoSessions] = useState<VideoSession[]>([]);
  const [facilities, setFacilities] = useState<string[]>(MOCK_FACILITIES);
  // Détail (id + nom) des établissements pour la gestion dans l'administration
  const [facilitiesDetail, setFacilitiesDetail] = useState<{ id: string; name: string }[]>(
    MOCK_FACILITIES.map((name) => ({ id: `fac-mock-${name}`, name }))
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


  // Incident Ticket Submission (server-first, fallback local si hors-ligne)
  const handleCreateTicket = async (data: {
    equipmentId: string;
    description: string;
    symptoms: string[];
    urgency: UrgencyLevel;
    errorCode?: string;
    attachments?: { photoVideo?: string; voiceMemo?: string };
  }) => {
    const eq = equipmentList.find((e) => e.id === data.equipmentId);
    if (!eq) return;

    // SLA Deadline logic: 2h for critical, 4h for high, 24h for medium, 48h for low
    let hours = 24;
    if (data.urgency === 'critical_vital') hours = 2;
    else if (data.urgency === 'high') hours = 4;
    else if (data.urgency === 'low') hours = 48;

    // Optimistic : l'équipement passe en panne dans l'UI immédiatement
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

    const offline = !isOnline || isSimulatedOffline;

    if (!offline) {
      try {
        // Server-first : le backend crée le ticket (id/code autoritatifs)
        const serverTicket = await api.createTicket(data);
        setTickets([serverTicket, ...tickets]);
        logAuditAction('Création Signalement Incident', `Ticket ${serverTicket.code}`, `Équipement ${eq.name}`);
        if (data.urgency === 'critical_vital' || data.urgency === 'high') {
          addToast(
            'danger',
            '🚨 INCIDENT CRITIQUE DÉCLARÉ',
            `Alerte : Nouvel incident grave (${serverTicket.code}) sur ${eq.name} (${eq.facility}). SLA engagé: ${hours}h.`
          );
        } else {
          addToast(
            'warning',
            'Nouveau Signalement Incident',
            `Signalement ${serverTicket.code} enregistré pour l'équipement ${eq.name}.`
          );
        }
        return;
      } catch {
        // fallthrough : conservation locale + file d'attente
      }
    }

    // Fallback local (hors ligne ou serveur injoignable)
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
      attachments:
        data.attachments && (data.attachments.photoVideo || data.attachments.voiceMemo)
          ? {
              photoVideo: data.attachments.photoVideo,
              voiceMemo: data.attachments.voiceMemo,
            }
          : undefined,
      history: [
        {
          timestamp: new Date().toISOString(),
          actor: `${currentUser.name} (${currentUser.title})`,
          action: 'Création du signalement d\'incident',
          comment: data.description,
        },
      ],
    };

    setTickets([newTicket, ...tickets]);
    logAuditAction('Création Signalement Incident', `Ticket ${newTicket.code}`, `Équipement ${eq.name}`);
    queueOfflineAction({ type: 'CREATE_INCIDENT', payload: newTicket });
    setPendingActions(getPendingOfflineActions());
    addToast(
      'warning',
      offline ? '⚡ Action Enregistrée Hors Ligne' : 'Serveur injoignable',
      `Le ticket ${newTicket.code} a été conservé localement. Il sera transmis lors du rétablissement du réseau.`
    );
  };

  // Ticket Assignment (optimistic + synchronisation serveur)
  const handleAssignTicket = async (ticketId: string, technicianId: string) => {
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

    if (isOnline && !isSimulatedOffline) {
      try {
        const updated = await api.assignTicket(ticketId, technicianId);
        setTickets((prev) => prev.map((t) => (t.id === ticketId ? updated : t)));
      } catch {
        addToast(
          'warning',
          'Synchronisation différée',
          "L'affectation sera transmise au serveur lors du rétablissement du réseau."
        );
      }
    }
  };

  // Ticket Status Update (optimistic + synchronisation serveur)
  const handleUpdateTicketStatus = async (ticketId: string, newStatus: TicketStatus) => {
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

    const offline = !isOnline || isSimulatedOffline;

    if (offline) {
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
      return;
    }

    try {
      const updated = await api.updateTicketStatus(ticketId, newStatus);
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? updated : t)));
      if (tkt) {
        const isComplete = newStatus === 'validated' || newStatus === 'resolved';
        addToast(
          isComplete ? 'success' : 'info',
          'Changement de Statut Ticket',
          `Le ticket ${tkt.code} est désormais "${statusLabels[newStatus] || newStatus}".`
        );
      }
    } catch {
      queueOfflineAction({
        type: 'UPDATE_STATUS',
        payload: { ticketId, newStatus },
      });
      setPendingActions(getPendingOfflineActions());
      addToast(
        'warning',
        'Synchronisation différée',
        `Le changement de statut du ticket ${tkt?.code || ticketId} sera transmis plus tard.`
      );
    }
  };

  // Intervention Report Saved (server-first, fallback local si hors-ligne)
  const handleSaveInterventionReport = async (reportData: Partial<InterventionReport>) => {
    if (reportData.ticketId) {
      handleUpdateTicketStatus(reportData.ticketId, reportData.validatedByEngineer ? 'validated' : 'resolved');
    }
    logAuditAction('Clôture Rapport Intervention', `Rapport ${reportData.ticketId}`, 'Intervention clôturée et validée');
    addToast(
      'success',
      'Rapport d\'Intervention Certifié',
      'Le PV d\'intervention a été enregistré avec succès et l\'équipement certifié opérationnel.'
    );

    const offline = !isOnline || isSimulatedOffline;
    if (offline) {
      queueOfflineAction({ type: 'ADD_REPORT', payload: reportData });
      setPendingActions(getPendingOfflineActions());
      return;
    }

    try {
      await api.createReport(reportData);
      // Le serveur a aussi mis à jour le statut du ticket : resynchronisation
      const freshTickets = await api.getTickets();
      setTickets(freshTickets);
    } catch {
      queueOfflineAction({ type: 'ADD_REPORT', payload: reportData });
      setPendingActions(getPendingOfflineActions());
      addToast(
        'warning',
        'Rapport conservé localement',
        'Impossible de joindre le serveur : le PV sera synchronisé ultérieurement.'
      );
    }
  };

  // Users CRUD (synchronisé avec le backend ; fallback local si hors-ligne)
  const handleAddUser = async (newUser: UserProfile, password?: string) => {
    if (isOnline && !isSimulatedOffline) {
      try {
        const serverUser = await api.createUser(newUser, password);
        setUsers([...users, serverUser]);
        logAuditAction('Création Acteur', `Utilisateur ${serverUser.name}`, `Rôle ${serverUser.role}`);
        return;
      } catch {
        // fallthrough : conservation locale
      }
    }
    setUsers([...users, newUser]);
    logAuditAction('Création Acteur', `Utilisateur ${newUser.name}`, `Rôle ${newUser.role}`);
    if (isOnline && !isSimulatedOffline) {
      addToast(
        'warning',
        'Synchronisation différée',
        `Le compte ${newUser.name} sera transmis au serveur plus tard.`
      );
    }
  };

  const handleUpdateUser = async (updatedUser: UserProfile, password?: string) => {
    setUsers(users.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    if (currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
    logAuditAction('Modification Acteur', `Utilisateur ${updatedUser.name}`, `Mis à jour permissions/infos`);
    if (isOnline && !isSimulatedOffline) {
      try {
        const serverUser = await api.updateUser(updatedUser.id, updatedUser, password);
        setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? serverUser : u)));
      } catch {
        addToast(
          'warning',
          'Synchronisation différée',
          `Les modifications de ${updatedUser.name} seront transmises plus tard.`
        );
      }
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const target = users.find((u) => u.id === userId);
    setUsers(users.filter((u) => u.id !== userId));
    logAuditAction('Suppression Acteur', `ID ${userId}`, target ? target.name : 'Utilisateur supprimé');
    if (isOnline && !isSimulatedOffline) {
      try {
        await api.deleteUser(userId);
      } catch {
        addToast(
          'warning',
          'Synchronisation différée',
          `La suppression de ${target?.name || "l'utilisateur"} sera transmise plus tard.`
        );
      }
    }
  };

  // Equipment CRUD (synchronisé avec le backend ; fallback local si hors-ligne)
  const handleAddEquipment = async (newEq: Equipment) => {
    if (isOnline && !isSimulatedOffline) {
      try {
        const serverEq = await api.createEquipment(newEq);
        setEquipmentList([serverEq, ...equipmentList]);
        logAuditAction('Ajout Équipement', `Code ${serverEq.code}`, `Modèle ${serverEq.model}`);
        return;
      } catch {
        // fallthrough : conservation locale
      }
    }
    setEquipmentList([newEq, ...equipmentList]);
    logAuditAction('Ajout Équipement', `Code ${newEq.code}`, `Modèle ${newEq.model}`);
    if (isOnline && !isSimulatedOffline) {
      addToast(
        'warning',
        'Synchronisation différée',
        `L'équipement ${newEq.code} sera transmis au serveur plus tard.`
      );
    }
  };

  const handleUpdateEquipment = async (updatedEq: Equipment) => {
    setEquipmentList(equipmentList.map((e) => (e.id === updatedEq.id ? updatedEq : e)));
    logAuditAction('Modification Équipement', `Code ${updatedEq.code}`, `Mis à jour statut/infos`);
    if (isOnline && !isSimulatedOffline) {
      try {
        const serverEq = await api.updateEquipment(updatedEq.id, updatedEq);
        setEquipmentList((prev) => prev.map((e) => (e.id === updatedEq.id ? serverEq : e)));
      } catch {
        addToast(
          'warning',
          'Synchronisation différée',
          `Les modifications de ${updatedEq.code} seront transmises plus tard.`
        );
      }
    }
  };

  const handleDeleteEquipment = async (eqId: string) => {
    const target = equipmentList.find((e) => e.id === eqId);
    setEquipmentList(equipmentList.filter((e) => e.id !== eqId));
    logAuditAction('Suppression Équipement', `ID ${eqId}`, target ? target.name : 'Équipement supprimé');
    if (isOnline && !isSimulatedOffline) {
      try {
        await api.deleteEquipment(eqId);
      } catch {
        addToast(
          'warning',
          'Synchronisation différée',
          `La suppression de ${target?.name || "l'équipement"} sera transmise plus tard.`
        );
      }
    }
  };

  // Facilities CRUD (synchronisé avec le backend ; fallback local si hors-ligne)
  const syncFacilities = (names: string[], detail: { id: string; name: string }[]) => {
    setFacilities(names);
    setFacilitiesDetail(detail);
  };

  const handleAddFacility = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (isOnline && !isSimulatedOffline) {
      try {
        const serverFacility = await api.createFacility(trimmed);
        syncFacilities([...facilities, serverFacility.name], [...facilitiesDetail, serverFacility]);
        logAuditAction('Ajout Établissement', serverFacility.name, 'Nouveau site rattaché');
        return;
      } catch {
        // fallthrough : conservation locale
      }
    }
    const localFacility = { id: `fac-${Date.now()}`, name: trimmed };
    syncFacilities([...facilities, trimmed], [...facilitiesDetail, localFacility]);
    logAuditAction('Ajout Établissement', trimmed, 'Nouveau site rattaché (hors-ligne)');
    if (isOnline && !isSimulatedOffline) {
      addToast(
        'warning',
        'Synchronisation différée',
        `L'établissement ${trimmed} sera transmis au serveur plus tard.`
      );
    }
  };

  const handleUpdateFacility = async (id: string, newName: string) => {
    const trimmed = newName.trim();
    const oldName = facilitiesDetail.find((f) => f.id === id)?.name || id;
    if (!trimmed || trimmed === oldName) return;
    const names = facilities.map((f) => (f === oldName ? trimmed : f));
    const detail = facilitiesDetail.map((f) => (f.id === id ? { ...f, name: trimmed } : f));
    syncFacilities(names, detail);
    logAuditAction('Modification Établissement', trimmed, `Site renommé depuis « ${oldName} »`);
    if (isOnline && !isSimulatedOffline) {
      try {
        const serverFacility = await api.updateFacility(id, trimmed);
        syncFacilities(
          facilities.map((f) => (f === oldName ? serverFacility.name : f)),
          facilitiesDetail.map((f) => (f.id === id ? serverFacility : f))
        );
      } catch {
        addToast(
          'warning',
          'Synchronisation différée',
          `Le renommage de ${oldName} sera transmis au serveur plus tard.`
        );
      }
    }
  };

  const handleDeleteVideoSession = async (id: string) => {
    setVideoSessions((prev) => prev.filter((s) => s.id !== id));
    if (isOnline && !isSimulatedOffline) {
      try {
        await api.deleteVideoSession(id);
      } catch {
        addToast(
          'warning',
          'Synchronisation différée',
          'La suppression de la session sera transmise au serveur plus tard.'
        );
      }
    }
  };

  const handleDeleteFacility = async (id: string, transferTo?: string) => {
    const target = facilitiesDetail.find((f) => f.id === id);
    const name = target?.name || id;
    // Transfert des rattachements vers un autre site avant suppression
    if (transferTo && transferTo !== name) {
      setEquipmentList((prev) =>
        prev.map((e) => (e.facility === name ? { ...e, facility: transferTo } : e))
      );
      setUsers((prev) =>
        prev.map((u) => (u.facility === name ? { ...u, facility: transferTo } : u))
      );
      logAuditAction('Transfert Établissement', name, `Rattachements transférés vers ${transferTo}`);
    }
    syncFacilities(
      facilities.filter((f) => f !== name),
      facilitiesDetail.filter((f) => f.id !== id)
    );
    logAuditAction('Suppression Établissement', name, 'Site retiré du réseau');
    if (isOnline && !isSimulatedOffline) {
      try {
        await api.deleteFacility(id, transferTo);
      } catch {
        addToast(
          'warning',
          'Synchronisation différée',
          `La suppression de ${name} sera transmise au serveur plus tard.`
        );
      }
    }
  };

  // Knowledge article creation (server-first, fallback local)
  const handleAddKnowledgeArticle = async (newArt: KnowledgeArticle) => {
    if (isOnline && !isSimulatedOffline) {
      try {
        const serverArt = await api.createKnowledge(newArt);
        setKnowledgeArticles([serverArt, ...knowledgeArticles]);
        return;
      } catch {
        // fallthrough : conservation locale
      }
    }
    setKnowledgeArticles([newArt, ...knowledgeArticles]);
    if (isOnline && !isSimulatedOffline) {
      addToast(
        'warning',
        'Synchronisation différée',
        `La fiche « ${newArt.title} » sera transmise au serveur plus tard.`
      );
    }
  };

  // --- Authentification ---
  // Connexion réussie : l'utilisateur devient la session active et les
  // données réelles du backend (SQLite) sont chargées (loader plein écran).
  const handleLogin = async (user: UserProfile) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setIsLoading(true);
    try {
      const data = await loadAllData(user);
      setUsers(data.users);
      setEquipmentList(data.equipment);
      setTickets(data.tickets);
      setKnowledgeArticles(data.knowledge);
      setAuditLogs(data.audit);
      if (data.facilities.length > 0) setFacilities(data.facilities);
      try {
        const detail = await api.getFacilitiesDetail();
        setFacilitiesDetail(detail);
      } catch {
        /* liste détaillée indisponible (rôle sans canManageUsers) : on garde les noms seuls */
      }
      try {
        const sessions = await api.getVideoSessions();
        setVideoSessions(sessions);
      } catch {
        /* historique des sessions indisponible */
      }
      addToast(
        'success',
        'Connexion Réussie',
        `Bienvenue ${user.name}. ${data.equipment.length} équipements et ${data.tickets.length} tickets chargés depuis le serveur.`
      );
    } catch {
      addToast(
        'warning',
        'Chargement partiel',
        'Impossible de charger toutes les données depuis le serveur.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Changement d'onglet : feedback visuel immédiat (barre de progression)
  const handleSelectTab = (tab: string) => {
    setActiveTab(tab);
    setTabLoading(true);
    window.setTimeout(() => setTabLoading(false), 400);
  };

  // Mode démonstration : serveur injoignable, on entre avec les données locales
  const handleDemoMode = () => {
    const admin = MOCK_USERS.find((u) => u.role === 'admin') || MOCK_USERS[0];
    setCurrentUser(admin);
    setIsAuthenticated(true);
    setUsers(getCachedData('biomed_users_v1', MOCK_USERS));
    setEquipmentList(getCachedData(STORAGE_KEYS.EQUIPMENT, MOCK_EQUIPMENT));
    setTickets(getCachedData(STORAGE_KEYS.TICKETS, MOCK_TICKETS));
    setKnowledgeArticles(getCachedData(STORAGE_KEYS.KNOWLEDGE, MOCK_KNOWLEDGE_BASE));
    setAuditLogs(getCachedData(STORAGE_KEYS.AUDIT, MOCK_AUDIT_LOGS));
    addToast(
      'info',
      'Mode Démonstration',
      'Serveur injoignable : utilisation des données locales de démonstration.'
    );
  };

  // Déconnexion : retour à l'écran de connexion
  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // session déjà expirée ou serveur injoignable : on déconnecte quand même
    }
    setIsAuthenticated(false);
    setCurrentUser(MOCK_USERS.find((u) => u.role === 'admin') || MOCK_USERS[0]);
  };

  const pendingTicketsCount = tickets.filter((t) => t.status !== 'validated' && t.status !== 'resolved').length;

  // Gate de connexion : l'application n'est accessible qu'après authentification
  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} onDemoMode={handleDemoMode} />;
  }

  // Chargement initial des données après connexion
  if (isLoading) {
    return <AppLoader />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Barre de progression globale (chargement initial / changement d'onglet) */}
      <TopProgressBar visible={isLoading || tabLoading} />

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

      {/* Header with App Title, Active Account, Tabs */}
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        selectedFacility={selectedFacility}
        facilities={facilities}
        onSelectFacility={setSelectedFacility}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onToggleAiDrawer={() => setIsAiDrawerOpen(!isAiDrawerOpen)}
        onOpenVideoCall={() => {
          setSelectedTicketForVideoCall(null);
          setIsVideoConferenceOpen(true);
        }}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        pendingTicketsCount={pendingTicketsCount}
        isOnline={isOnline}
        isSimulatedOffline={isSimulatedOffline}
      />

      {/* Role Context Bar */}
      <RoleContextBar currentUser={currentUser} />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Chaque onglet est chargé à la demande : skeleton pendant le chargement */}
        <Suspense fallback={<TabSkeleton />}>
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
            onAddNewEquipment={can(currentUser, 'canManageEquipment') ? () => setActiveTab('admin') : undefined}
            currentUser={currentUser}
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
              // Ouvre uniquement la visioconférence (avec le contexte du ticket),
              // pas la session de télé-maintenance qui s'ouvre depuis les cartes équipement.
              setSelectedTicketForVideoCall(tkt);
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
            onAddArticle={handleAddKnowledgeArticle}
            canWrite={currentUser.role === 'admin' || currentUser.role === 'engineer'}
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
            facilities={facilities}
            selectedFacility={selectedFacility}
            currentUser={currentUser}
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

        {/* TAB 5: Admin & Audit (réservé admin / gestion parc) */}
        {activeTab === 'admin' &&
          (can(currentUser, 'canManageUsers') || can(currentUser, 'canManageEquipment') ? (
            <AdminUsersAudit
              users={users}
              auditLogs={auditLogs}
              equipmentList={equipmentList}
              facilities={facilities}
              facilitiesDetail={facilitiesDetail}
              videoSessions={videoSessions}
              canManageUsers={can(currentUser, 'canManageUsers')}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              onAddEquipment={handleAddEquipment}
              onUpdateEquipment={handleUpdateEquipment}
              onDeleteEquipment={handleDeleteEquipment}
              onAddFacility={handleAddFacility}
              onUpdateFacility={handleUpdateFacility}
              onDeleteFacility={handleDeleteFacility}
              onDeleteVideoSession={handleDeleteVideoSession}
            />
          ) : (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center shadow-sm">
              <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800">Accès refusé</h3>
              <p className="text-xs text-slate-500 mt-1">
                Vous ne disposez pas des droits nécessaires pour accéder à l'administration.
              </p>
            </div>
          ))}
        </Suspense>
      </main>

      {/* Modals & Slide-Out Drawers */}
      <EquipmentModal
        equipment={selectedEquipmentForModal}
        currentUser={currentUser}
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
          // Recharge l'historique des sessions enregistrées
          api.getVideoSessions().then(setVideoSessions).catch(() => {});
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
