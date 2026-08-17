import type {
  UserProfile,
  Equipment,
  IncidentTicket,
  KnowledgeArticle,
  InterventionReport,
  AuditLog,
  TicketStatus,
  UrgencyLevel,
  VideoSession,
  AppNotification,
} from '../types';
import { can } from './permissions';

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    let message = `Erreur ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* réponse non-JSON */
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// CRUD typé
// ---------------------------------------------------------------------------
export const api = {
  // --- Auth ---
  async login(email: string, password: string): Promise<UserProfile> {
    const data = await apiFetch<{ user: UserProfile }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return data.user;
  },

  // Utilisateur de la session courante (cookie valide) : permet de restaurer
  // la connexion après un rechargement de page, sans repasser par le login.
  me: () => apiFetch<{ user: UserProfile }>('/api/auth/me').then((d) => d.user),

  async logout(): Promise<void> {
    await apiFetch<{ success: boolean }>('/api/auth/logout', { method: 'POST' });
  },

  // --- Première installation ---
  authStatus: () => apiFetch<{ setupRequired: boolean }>('/api/auth/status').then((d) => d.setupRequired),
  setupAdmin: (data: { name: string; email: string; password: string; title?: string; facility?: string }) =>
    apiFetch<{ user: { id: string; name: string; email: string; role: string } }>('/api/setup', {
      method: 'POST',
      body: JSON.stringify(data),
    }).then((d) => d.user),

  // --- Users ---
  getUsers: () => apiFetch<{ users: UserProfile[] }>('/api/users').then((d) => d.users),
  createUser: (user: UserProfile, password?: string) =>
    apiFetch<{ user: UserProfile }>('/api/users', {
      method: 'POST',
      body: JSON.stringify(password ? { ...user, password } : user),
    }).then((d) => d.user),
  updateUser: (id: string, user: Partial<UserProfile>, password?: string) =>
    apiFetch<{ user: UserProfile }>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(password ? { ...user, password } : user),
    }).then((d) => d.user),
  deleteUser: (id: string) => apiFetch<{ success: boolean }>(`/api/users/${id}`, { method: 'DELETE' }),

  // --- Equipment ---
  getEquipment: () => apiFetch<{ equipment: Equipment[] }>('/api/equipment').then((d) => d.equipment),
  createEquipment: (eq: Equipment) =>
    apiFetch<{ equipment: Equipment }>('/api/equipment', { method: 'POST', body: JSON.stringify(eq) }).then((d) => d.equipment),
  updateEquipment: (id: string, eq: Partial<Equipment>) =>
    apiFetch<{ equipment: Equipment }>(`/api/equipment/${id}`, { method: 'PUT', body: JSON.stringify(eq) }).then((d) => d.equipment),
  deleteEquipment: (id: string) => apiFetch<{ success: boolean }>(`/api/equipment/${id}`, { method: 'DELETE' }),

  // --- Tickets ---
  getTickets: () => apiFetch<{ tickets: IncidentTicket[] }>('/api/tickets').then((d) => d.tickets),
  createTicket: (data: {
    equipmentId: string;
    description: string;
    symptoms: string[];
    urgency: UrgencyLevel;
    errorCode?: string;
    attachments?: { photoVideo?: string; voiceMemo?: string };
  }) =>
    apiFetch<{ ticket: IncidentTicket }>('/api/tickets', { method: 'POST', body: JSON.stringify(data) }).then((d) => d.ticket),
  assignTicket: (id: string, userId: string | null) =>
    apiFetch<{ ticket: IncidentTicket }>(`/api/tickets/${id}/assign`, {
      method: 'PUT',
      body: JSON.stringify({ userId }),
    }).then((d) => d.ticket),
  updateTicketStatus: (id: string, status: TicketStatus) =>
    apiFetch<{ ticket: IncidentTicket }>(`/api/tickets/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }).then((d) => d.ticket),
  updateTicket: (id: string, data: Partial<IncidentTicket>) =>
    apiFetch<{ ticket: IncidentTicket }>(`/api/tickets/${id}`, { method: 'PUT', body: JSON.stringify(data) }).then(
      (d) => d.ticket
    ),
  markTicketViewed: (id: string) =>
    apiFetch<{ ticket: IncidentTicket }>(`/api/tickets/${id}/viewed`, { method: 'PUT' }).then((d) => d.ticket),
  deleteTicket: (id: string) => apiFetch<{ success: boolean }>(`/api/tickets/${id}`, { method: 'DELETE' }),

  // --- Knowledge base ---
  getKnowledge: () => apiFetch<{ knowledge: KnowledgeArticle[] }>('/api/knowledge').then((d) => d.knowledge),
  createKnowledge: (article: KnowledgeArticle) =>
    apiFetch<{ article: KnowledgeArticle }>('/api/knowledge', { method: 'POST', body: JSON.stringify(article) }).then(
      (d) => d.article
    ),
  updateKnowledge: (id: string, article: Partial<KnowledgeArticle>) =>
    apiFetch<{ article: KnowledgeArticle }>(`/api/knowledge/${id}`, {
      method: 'PUT',
      body: JSON.stringify(article),
    }).then((d) => d.article),
  deleteKnowledge: (id: string) => apiFetch<{ success: boolean }>(`/api/knowledge/${id}`, { method: 'DELETE' }),

  // --- Intervention reports ---
  getReports: () => apiFetch<{ reports: InterventionReport[] }>('/api/reports').then((d) => d.reports),
  createReport: (report: Partial<InterventionReport>) =>
    apiFetch<{ report: InterventionReport }>('/api/reports', { method: 'POST', body: JSON.stringify(report) }).then(
      (d) => d.report
    ),
  updateReport: (id: string, report: Partial<InterventionReport>) =>
    apiFetch<{ report: InterventionReport }>(`/api/reports/${id}`, { method: 'PUT', body: JSON.stringify(report) }).then(
      (d) => d.report
    ),
  deleteReport: (id: string) => apiFetch<{ success: boolean }>(`/api/reports/${id}`, { method: 'DELETE' }),

  // --- Audit ---
  getAudit: () => apiFetch<{ logs: AuditLog[] }>('/api/audit').then((d) => d.logs),
  deleteAudit: (id: string) => apiFetch<{ success: boolean }>(`/api/audit/${id}`, { method: 'DELETE' }),

  // --- Notifications (assignation de signalements, appels…) ---
  getNotifications: () => apiFetch<{ notifications: AppNotification[] }>('/api/notifications').then((d) => d.notifications),
  markNotificationRead: (id: string) =>
    apiFetch<{ notification: AppNotification }>(`/api/notifications/${id}/read`, { method: 'PUT' }).then((d) => d.notification),
  markAllNotificationsRead: () =>
    apiFetch<{ updated: number }>('/api/notifications/read-all', { method: 'PUT' }).then((d) => d.updated),

  // --- Sessions de visioconférence ---
  getVideoSessions: () => apiFetch<{ sessions: VideoSession[] }>('/api/video-sessions').then((d) => d.sessions),
  createVideoSession: (session: Partial<VideoSession>) =>
    apiFetch<{ session: VideoSession }>('/api/video-sessions', {
      method: 'POST',
      body: JSON.stringify(session),
    }).then((d) => d.session),
  markVideoSessionViewed: (id: string) =>
    apiFetch<{ session: VideoSession }>(`/api/video-sessions/${id}/viewed`, { method: 'PUT' }).then((d) => d.session),
  endVideoSession: (
    id: string,
    data: { endedAt?: string; durationSeconds?: number; messages?: VideoSession['messages'] }
  ) =>
    apiFetch<{ session: VideoSession }>(`/api/video-sessions/${id}/end`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }).then((d) => d.session),
  markVideoSessionJoined: (id: string) =>
    apiFetch<{ session: VideoSession }>(`/api/video-sessions/${id}/join`, { method: 'PUT' }).then((d) => d.session),
  addVideoSessionMessage: (id: string, message: VideoSession['messages'][number]) =>
    apiFetch<{ session: VideoSession }>(`/api/video-sessions/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify(message),
    }).then((d) => d.session),
  deleteVideoSession: (id: string) =>
    apiFetch<{ success: boolean }>(`/api/video-sessions/${id}`, { method: 'DELETE' }),

  // --- Facilities ---
  getFacilities: () => apiFetch<{ facilities: string[] }>('/api/facilities').then((d) => d.facilities),
  getFacilitiesDetail: () =>
    apiFetch<{ facilities: { id: string; name: string }[] }>('/api/facilities/detail').then((d) => d.facilities),
  createFacility: (name: string) =>
    apiFetch<{ facility: { id: string; name: string } }>('/api/facilities', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }).then((d) => d.facility),
  updateFacility: (id: string, name: string) =>
    apiFetch<{ facility: { id: string; name: string } }>(`/api/facilities/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    }).then((d) => d.facility),
  deleteFacility: (id: string, transferTo?: string) =>
    apiFetch<{ success: boolean }>(`/api/facilities/${id}`, {
      method: 'DELETE',
      body: JSON.stringify(transferTo ? { transferTo } : {}),
    }),
};

// ---------------------------------------------------------------------------
// Chargement complet des données (source de vérité = backend SQLite)
// ---------------------------------------------------------------------------
export interface BackendData {
  users: UserProfile[];
  equipment: Equipment[];
  tickets: IncidentTicket[];
  knowledge: KnowledgeArticle[];
  reports: InterventionReport[];
  audit: AuditLog[];
  facilities: string[];
}

export async function loadAllData(user?: UserProfile | null): Promise<BackendData> {
  // Le journal d'audit est réservé aux administrateurs : les autres rôles ne
  // l'appellent même pas (évite un 403 réseau et reste cohérent avec le RBAC).
  const canReadAudit = can(user, 'canManageUsers');
  const [users, equipment, tickets, knowledge, reports, audit, facilities] = await Promise.all([
    api.getUsers(),
    api.getEquipment(),
    api.getTickets(),
    api.getKnowledge(),
    api.getReports(),
    canReadAudit ? api.getAudit().catch(() => []) : Promise.resolve([] as AuditLog[]),
    api.getFacilities(),
  ]);
  return { users, equipment, tickets, knowledge, reports, audit, facilities };
}
