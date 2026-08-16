import { Router, Request, Response } from 'express';
import {
  listAll,
  getById,
  insertRow,
  updateRow,
  deleteRow,
  findBy,
  seedDatabase,
  resetDatabase,
  hashPassword,
} from './db';
import {
  attemptLogin,
  createSession,
  destroySession,
  getSessionUser,
  parseCookies,
  requireAuth,
  requireRole,
  requirePermission,
  sessionCookie,
  clearSessionCookie,
  AuthUser,
} from './auth';

export const apiRouter = Router();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function logAudit(req: Request, action: string, target: string, details: string): void {
  const user = (req as Request & { user?: AuthUser }).user;
  insertRow('audit', {
    id: `aud-${Date.now()}`,
    timestamp: new Date().toISOString(),
    actor: user?.name || 'Système',
    role: user?.role || 'system',
    action,
    target,
    ipAddress: req.ip || 'unknown',
    details,
  });
}

function getAuthedUser(req: Request): AuthUser {
  return (req as Request & { user?: AuthUser }).user!;
}

function ok(res: Response, data: Record<string, unknown>): void {
  res.json({ success: true, ...data });
}

const SLA_HOURS: Record<string, number> = {
  critical_vital: 2,
  high: 4,
  medium: 24,
  low: 48,
};

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
apiRouter.post('/auth/login', (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis.' });
    }
    const user = attemptLogin(String(email), String(password));
    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }
    const { token, expiresAt } = createSession(user.id);
    res.setHeader('Set-Cookie', sessionCookie(token, expiresAt));
    ok(res, { user });
  } catch (err: any) {
    res.status(500).json({ error: 'Erreur lors de la connexion.', details: err?.message });
  }
});

apiRouter.get('/auth/me', (req, res) => {
  const user = getSessionUser(req);
  if (!user) return res.status(401).json({ error: 'Non authentifié.' });
  ok(res, { user });
});

apiRouter.post('/auth/logout', (req, res) => {
  const token = parseCookies(req).biomed_session;
  destroySession(token);
  res.setHeader('Set-Cookie', clearSessionCookie);
  ok(res, {});
});

// ---------------------------------------------------------------------------
// Users (write: admin only)
// ---------------------------------------------------------------------------
apiRouter.get('/users', requireAuth, (req, res) => {
  ok(res, { users: listAll('users') });
});

apiRouter.post('/users', requireAuth, requirePermission('canManageUsers'), (req, res) => {
  const data = req.body || {};
  if (!data.name || !data.email) {
    return res.status(400).json({ error: 'Nom et email requis.' });
  }
  const existing = findBy('users', 'email', data.email);
  if (existing) return res.status(409).json({ error: 'Un utilisateur avec cet email existe déjà.' });
  const { password, ...profile } = data;
  const defaultPassword = process.env.DEFAULT_PASSWORD || 'biomed123';
  const chosenPassword = typeof password === 'string' && password.trim() ? password : defaultPassword;
  const user = insertRow('users', { id: `usr-${Date.now()}`, ...profile, password_hash: hashPassword(chosenPassword) });
  delete (user as Record<string, unknown>).password_hash;
  logAudit(req, 'Création Acteur', `Utilisateur ${user.name}`, `Rôle ${user.role}`);
  ok(res, { user });
});

apiRouter.put('/users/:id', requireAuth, requirePermission('canManageUsers'), (req, res) => {
  const existing = getById('users', req.params.id);
  if (!existing) return res.status(404).json({ error: 'Utilisateur introuvable.' });
  const { password_hash: _pw, password, ...clean } = req.body || {};
  const withNewPassword =
    typeof password === 'string' && password.trim()
      ? { ...clean, password_hash: hashPassword(password) }
      : clean;
  const user = updateRow('users', req.params.id, withNewPassword);
  delete (user as Record<string, unknown>).password_hash;
  logAudit(req, 'Modification Acteur', `Utilisateur ${user?.name}`, 'Mise à jour profil/permissions');
  ok(res, { user });
});

apiRouter.delete('/users/:id', requireAuth, requirePermission('canManageUsers'), (req, res) => {
  const existing = getById('users', req.params.id);
  if (!existing) return res.status(404).json({ error: 'Utilisateur introuvable.' });
  if (existing.id === getAuthedUser(req).id) {
    return res.status(400).json({ error: 'Impossible de supprimer votre propre compte.' });
  }
  deleteRow('users', req.params.id);
  logAudit(req, 'Suppression Acteur', `ID ${req.params.id}`, existing.name as string);
  ok(res, {});
});

// ---------------------------------------------------------------------------
// Equipment (write: admin or engineer)
// ---------------------------------------------------------------------------
apiRouter.get('/equipment', requireAuth, (req, res) => {
  ok(res, { equipment: listAll('equipment') });
});

apiRouter.post('/equipment', requireAuth, requirePermission('canManageEquipment'), (req, res) => {
  const data = req.body || {};
  if (!data.name || !data.code) return res.status(400).json({ error: 'Nom et code requis.' });
  const eq = insertRow('equipment', { id: `eq-${Date.now()}`, ...data });
  logAudit(req, 'Ajout Équipement', `Code ${eq.code}`, `Modèle ${eq.model || 'N/A'}`);
  ok(res, { equipment: eq });
});

apiRouter.put('/equipment/:id', requireAuth, requirePermission('canManageEquipment'), (req, res) => {
  const existing = getById('equipment', req.params.id);
  if (!existing) return res.status(404).json({ error: 'Équipement introuvable.' });
  const eq = updateRow('equipment', req.params.id, req.body || {});
  logAudit(req, 'Modification Équipement', `Code ${eq?.code}`, 'Mise à jour statut/infos');
  ok(res, { equipment: eq });
});

apiRouter.delete('/equipment/:id', requireAuth, requirePermission('canManageEquipment'), (req, res) => {
  const existing = getById('equipment', req.params.id);
  if (!existing) return res.status(404).json({ error: 'Équipement introuvable.' });
  deleteRow('equipment', req.params.id);
  logAudit(req, 'Suppression Équipement', `ID ${req.params.id}`, existing.name as string);
  ok(res, {});
});

// ---------------------------------------------------------------------------
// Tickets (write: any authenticated user)
// ---------------------------------------------------------------------------
apiRouter.get('/tickets', requireAuth, (req, res) => {
  ok(res, { tickets: listAll('tickets') });
});

apiRouter.post('/tickets', requireAuth, requirePermission('canReportIncident'), (req, res) => {
  const { equipmentId, description, symptoms, urgency, errorCode, attachments } = req.body || {};
  const eq = equipmentId ? getById('equipment', equipmentId) : null;
  if (!eq) return res.status(400).json({ error: 'Équipement introuvable.' });
  if (!description && (!symptoms || symptoms.length === 0)) {
    return res.status(400).json({ error: 'Décrivez le problème ou sélectionnez des symptômes.' });
  }

  const hours = SLA_HOURS[urgency as string] ?? 24;
  const user = getAuthedUser(req);
  const ticket = {
    id: `tkt-${Date.now()}`,
    code: `INC-2026-${Math.floor(100 + Math.random() * 900)}`,
    equipmentId: eq.id,
    equipmentName: eq.name as string,
    equipmentCategory: eq.category as string,
    facility: eq.facility as string,
    reportedBy: { id: user.id, name: user.name, role: user.role },
    reportedAt: new Date().toISOString(),
    urgency: urgency || 'high',
    symptoms: Array.isArray(symptoms) ? symptoms : [],
    description: description || '',
    status: 'new',
    assignedTo: null,
    errorCode: errorCode || (eq as Record<string, any>).telemetry?.errorCode || null,
    aiDiagnosticSummary: null,
    slaDeadline: new Date(Date.now() + hours * 3600000).toISOString(),
    slaBreached: false,
    attachments:
      attachments && (attachments.photoVideo || attachments.voiceMemo)
        ? { photoVideo: attachments.photoVideo || null, voiceMemo: attachments.voiceMemo || null }
        : null,
    // Le signalant a déjà « vu » son propre ticket : il ne compte pas comme non lu
    viewedBy: [user.id],
    history: [
      {
        timestamp: new Date().toISOString(),
        actor: `${user.name} (${user.title || user.role})`,
        action: 'Création du signalement d\'incident',
        comment: description || 'Signalement sans description',
      },
    ],
  };

  const created = insertRow('tickets', ticket);

  // Mark equipment as breakdown / critical
  const status = urgency === 'critical_vital' ? 'critical' : 'breakdown';
  const telemetry = { ...((eq as Record<string, any>).telemetry || {}) };
  telemetry.errorCode = errorCode || telemetry.errorCode || 'ERR-SYS-01';
  updateRow('equipment', eq.id as string, { status, telemetry });

  logAudit(req, 'Création Signalement Incident', `Ticket ${created.code}`, `Équipement ${eq.name}`);
  ok(res, { ticket: created });
});

apiRouter.put('/tickets/:id/assign', requireAuth, requireRole('admin', 'engineer', 'manager'), (req, res) => {
  const ticket = getById('tickets', req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket introuvable.' });
  const { userId } = req.body || {};
  const tech = userId ? getById('users', userId) : null;
  const updated = updateRow('tickets', req.params.id, {
    assignedTo: tech ? { id: tech.id, name: tech.name, role: tech.role } : null,
    history: [
      ...(ticket.history as any[]),
      {
        timestamp: new Date().toISOString(),
        actor: getAuthedUser(req).name,
        action: tech ? `Affecté à ${tech.name}` : 'Désaffecté',
      },
    ],
  });
  logAudit(req, 'Affectation Ticket', `Ticket ${ticket.code}`, tech ? `Assigné à ${tech.name}` : 'Non assigné');
  ok(res, { ticket: updated });
});

apiRouter.put('/tickets/:id/status', requireAuth, requireRole('admin', 'engineer', 'technician', 'manager', 'vendor'), (req, res) => {
  const ticket = getById('tickets', req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket introuvable.' });
  const { status } = req.body || {};
  if (!status) return res.status(400).json({ error: 'Statut requis.' });

  // La validation finale ("Validé par Ingénieur") exige un rôle ingénieur/admin
  if (status === 'validated' && !['admin', 'engineer'].includes(getAuthedUser(req).role)) {
    return res.status(403).json({ error: 'Accès refusé : la validation finale exige un rôle Ingénieur ou Administrateur.' });
  }

  const updated = updateRow('tickets', req.params.id, {
    status,
    history: [
      ...(ticket.history as any[]),
      { timestamp: new Date().toISOString(), actor: getAuthedUser(req).name, action: `Statut modifié : ${status}` },
    ],
  });

  // Resolving the ticket makes the equipment operational again
  if (status === 'resolved' || status === 'validated') {
    const eq = ticket.equipmentId ? getById('equipment', ticket.equipmentId as string) : null;
    if (eq) {
      const telemetry = { ...((eq as Record<string, any>).telemetry || {}) };
      delete telemetry.errorCode;
      delete telemetry.errorDescription;
      updateRow('equipment', eq.id as string, { status: 'operational', telemetry });
    }
  }

  logAudit(req, 'Changement Statut Ticket', `Ticket ${ticket.code}`, `Nouveau statut: ${status}`);
  ok(res, { ticket: updated });
});

// Marque un ticket comme consulté par l'utilisateur courant (badge « non lu »)
apiRouter.put('/tickets/:id/viewed', requireAuth, (req, res) => {
  const ticket = getById('tickets', req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket introuvable.' });
  const user = getAuthedUser(req);
  const viewedBy = Array.isArray(ticket.viewedBy) ? (ticket.viewedBy as string[]) : [];
  if (!viewedBy.includes(user.id)) {
    viewedBy.push(user.id);
  }
  const updated = updateRow('tickets', req.params.id, { viewedBy });
  ok(res, { ticket: updated });
});

apiRouter.delete('/tickets/:id', requireAuth, requirePermission('canManageUsers'), (req, res) => {
  const existing = getById('tickets', req.params.id);
  if (!existing) return res.status(404).json({ error: 'Ticket introuvable.' });
  deleteRow('tickets', req.params.id);
  logAudit(req, 'Suppression Ticket', `Ticket ${existing.code}`, 'Ticket supprimé');
  ok(res, {});
});

apiRouter.put('/tickets/:id', requireAuth, requireRole('admin', 'engineer'), (req, res) => {
  const existing = getById('tickets', req.params.id);
  if (!existing) return res.status(404).json({ error: 'Ticket introuvable.' });
  const { password_hash: _pw, id: _id, history: _hist, ...clean } = req.body || {};
  const updated = updateRow('tickets', req.params.id, clean);
  logAudit(req, 'Modification Ticket', `Ticket ${existing.code}`, 'Mise à jour des informations du ticket');
  ok(res, { ticket: updated });
});

// ---------------------------------------------------------------------------
// Knowledge base (write: admin or engineer)
// ---------------------------------------------------------------------------
apiRouter.get('/knowledge', requireAuth, (req, res) => {
  ok(res, { knowledge: listAll('knowledge') });
});

apiRouter.post('/knowledge', requireAuth, requireRole('admin', 'engineer'), (req, res) => {
  const data = req.body || {};
  if (!data.title) return res.status(400).json({ error: 'Titre requis.' });
  const article = insertRow('knowledge', { id: `kb-${Date.now()}`, ...data });
  logAudit(req, 'Ajout Fiche Technique', article.title as string, `Catégorie ${article.category || 'N/A'}`);
  ok(res, { article });
});

apiRouter.put('/knowledge/:id', requireAuth, requireRole('admin', 'engineer'), (req, res) => {
  const existing = getById('knowledge', req.params.id);
  if (!existing) return res.status(404).json({ error: 'Fiche introuvable.' });
  const article = updateRow('knowledge', req.params.id, req.body || {});
  logAudit(req, 'Modification Fiche Technique', article?.title as string, 'Mise à jour fiche');
  ok(res, { article });
});

apiRouter.delete('/knowledge/:id', requireAuth, requireRole('admin', 'engineer'), (req, res) => {
  const existing = getById('knowledge', req.params.id);
  if (!existing) return res.status(404).json({ error: 'Fiche introuvable.' });
  deleteRow('knowledge', req.params.id);
  logAudit(req, 'Suppression Fiche Technique', existing.title as string, 'Fiche supprimée');
  ok(res, {});
});

// ---------------------------------------------------------------------------
// Intervention reports
// ---------------------------------------------------------------------------
apiRouter.get('/reports', requireAuth, (req, res) => {
  ok(res, { reports: listAll('reports') });
});

apiRouter.post('/reports', requireAuth, requirePermission('canCloseIntervention'), (req, res) => {
  const data = req.body || {};
  const report = insertRow('reports', { id: `rep-${Date.now()}`, ...data });

  if (data.ticketId) {
    const ticket = getById('tickets', data.ticketId);
    if (ticket) {
      const newStatus = data.validatedByEngineer ? 'validated' : 'resolved';
      updateRow('tickets', ticket.id as string, {
        status: newStatus,
        history: [
          ...(ticket.history as any[]),
          {
            timestamp: new Date().toISOString(),
            actor: getAuthedUser(req).name,
            action: `Rapport d'intervention enregistré (${newStatus})`,
          },
        ],
      });
      const eq = ticket.equipmentId ? getById('equipment', ticket.equipmentId as string) : null;
      if (eq) {
        const telemetry = { ...((eq as Record<string, any>).telemetry || {}) };
        delete telemetry.errorCode;
        delete telemetry.errorDescription;
        updateRow('equipment', eq.id as string, { status: 'operational', telemetry });
      }
    }
  }

  logAudit(req, 'Clôture Rapport Intervention', `Rapport ${report.id}`, 'Intervention clôturée et validée');
  ok(res, { report });
});

apiRouter.put('/reports/:id', requireAuth, requireRole('admin'), (req, res) => {
  const existing = getById('reports', req.params.id);
  if (!existing) return res.status(404).json({ error: 'Rapport introuvable.' });
  const { id: _id, ...clean } = req.body || {};
  const report = updateRow('reports', req.params.id, clean);
  logAudit(req, 'Modification Rapport Intervention', `Rapport ${req.params.id}`, 'Mise à jour du PV d\'intervention');
  ok(res, { report });
});

apiRouter.delete('/reports/:id', requireAuth, requireRole('admin'), (req, res) => {
  const existing = getById('reports', req.params.id);
  if (!existing) return res.status(404).json({ error: 'Rapport introuvable.' });
  deleteRow('reports', req.params.id);
  logAudit(req, 'Suppression Rapport Intervention', `Rapport ${req.params.id}`, 'PV d\'intervention supprimé');
  ok(res, {});
});

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------
apiRouter.get('/audit', requireAuth, requirePermission('canManageUsers'), (req, res) => {
  ok(res, { logs: listAll('audit') });
});

apiRouter.post('/audit', requireAuth, (req, res) => {
  const { action, target, details } = req.body || {};
  if (!action) return res.status(400).json({ error: 'Action requise.' });
  logAudit(req, action, target || 'N/A', details || '');
  ok(res, {});
});

apiRouter.delete('/audit/:id', requireAuth, requirePermission('canManageUsers'), (req, res) => {
  const existing = getById('audit', req.params.id);
  if (!existing) return res.status(404).json({ error: 'Entrée d\'audit introuvable.' });
  deleteRow('audit', req.params.id);
  ok(res, {});
});

// ---------------------------------------------------------------------------
// Facilities (write: admin only)
// ---------------------------------------------------------------------------
apiRouter.get('/facilities', requireAuth, (req, res) => {
  ok(res, { facilities: listAll('facilities').map((f) => f.name) });
});

// Détail complet (id + nom) pour la gestion dans l'administration
apiRouter.get('/facilities/detail', requireAuth, requirePermission('canManageUsers'), (req, res) => {
  ok(res, { facilities: listAll('facilities') });
});

apiRouter.post('/facilities', requireAuth, requirePermission('canManageUsers'), (req, res) => {
  const { name } = req.body || {};
  if (!name || !String(name).trim()) return res.status(400).json({ error: 'Nom requis.' });
  const existing = findBy('facilities', 'name', String(name).trim());
  if (existing) return res.status(409).json({ error: 'Cet établissement existe déjà.' });
  const facility = insertRow('facilities', { name: String(name).trim() });
  logAudit(req, 'Ajout Établissement', facility.name as string, 'Nouveau site rattaché');
  ok(res, { facility });
});

apiRouter.put('/facilities/:id', requireAuth, requirePermission('canManageUsers'), (req, res) => {
  const existing = getById('facilities', req.params.id);
  if (!existing) return res.status(404).json({ error: 'Établissement introuvable.' });
  const { name } = req.body || {};
  if (!name || !String(name).trim()) return res.status(400).json({ error: 'Nom requis.' });
  const facility = updateRow('facilities', req.params.id, { name: String(name).trim() });
  logAudit(req, 'Modification Établissement', facility?.name as string, 'Site renommé');
  ok(res, { facility });
});

apiRouter.delete('/facilities/:id', requireAuth, requirePermission('canManageUsers'), (req, res) => {
  const existing = getById('facilities', req.params.id);
  if (!existing) return res.status(404).json({ error: 'Établissement introuvable.' });

  const name = existing.name as string;
  const attachedEquipment = listAll('equipment').filter((e) => e.facility === name);
  const attachedUsers = listAll('users').filter((u) => u.facility === name);
  const { transferTo } = req.body || {};

  if (attachedEquipment.length > 0 || attachedUsers.length > 0) {
    if (!transferTo || !String(transferTo).trim()) {
      return res.status(409).json({
        error: 'Impossible de supprimer : des équipements ou des acteurs sont encore rattachés à cet établissement.',
        counts: { equipment: attachedEquipment.length, users: attachedUsers.length },
      });
    }
    // Transfert vers un autre établissement avant suppression
    const target = findBy('facilities', 'name', String(transferTo).trim());
    if (!target) return res.status(400).json({ error: 'Établissement de transfert introuvable.' });
    if (String(transferTo).trim() === name) {
      return res.status(400).json({ error: 'L\'établissement de transfert doit être différent du site supprimé.' });
    }
    for (const eq of attachedEquipment) {
      updateRow('equipment', eq.id as string, { facility: String(transferTo).trim() });
    }
    for (const u of attachedUsers) {
      updateRow('users', u.id as string, { facility: String(transferTo).trim() });
    }
    logAudit(req, 'Transfert Établissement', name, `${attachedEquipment.length} équipement(s) et ${attachedUsers.length} acteur(s) transférés vers ${transferTo}`);
  }

  deleteRow('facilities', req.params.id);
  logAudit(req, 'Suppression Établissement', name, 'Site retiré du réseau');
  ok(res, {});
});

// ---------------------------------------------------------------------------
// Sessions de visioconférence (enregistrement durée, participants, messages)
// ---------------------------------------------------------------------------
apiRouter.get('/video-sessions', requireAuth, (req, res) => {
  ok(res, { sessions: listAll('video_sessions') });
});

apiRouter.post('/video-sessions', requireAuth, (req, res) => {
  const data = req.body || {};
  const user = getAuthedUser(req);
  const session = insertRow('video_sessions', {
    id: `vs-${Date.now()}`,
    roomName: data.roomName || 'BioMed-Room-General',
    ticketCode: data.ticketCode || null,
    equipmentCode: data.equipmentCode || null,
    startedAt: data.startedAt || new Date().toISOString(),
    endedAt: data.endedAt || new Date().toISOString(),
    durationSeconds: Math.max(0, Number(data.durationSeconds) || 0),
    participants: Array.isArray(data.participants) ? data.participants : [],
    messages: Array.isArray(data.messages) ? data.messages : [],
    // Le créateur a déjà « vu » sa propre session : elle ne compte pas comme
    // notification d'appel entrant pour lui.
    viewedBy: [user.id],
    createdBy: { id: user.id, name: user.name },
  });
  logAudit(
    req,
    'Session Visioconférence',
    session.roomName as string,
    `${session.durationSeconds}s — ${(session.participants as unknown as any[]).length} participant(s), ${(session.messages as unknown as any[]).length} message(s)`
  );
  ok(res, { session });
});

// Marque une session vidéo comme consultée par l'utilisateur courant
// (cloche de notifications d'appels entrants).
apiRouter.put('/video-sessions/:id/viewed', requireAuth, (req, res) => {
  const session = getById('video_sessions', req.params.id);
  if (!session) return res.status(404).json({ error: 'Session introuvable.' });
  const user = getAuthedUser(req);
  const viewedBy = Array.isArray(session.viewedBy) ? (session.viewedBy as string[]) : [];
  if (!viewedBy.includes(user.id)) {
    viewedBy.push(user.id);
  }
  const updated = updateRow('video_sessions', req.params.id, { viewedBy });
  ok(res, { session: updated });
});

apiRouter.delete('/video-sessions/:id', requireAuth, requirePermission('canManageUsers'), (req, res) => {
  const existing = getById('video_sessions', req.params.id);
  if (!existing) return res.status(404).json({ error: 'Session introuvable.' });
  deleteRow('video_sessions', req.params.id);
  ok(res, {});
});

// ---------------------------------------------------------------------------
// Admin utilities
// ---------------------------------------------------------------------------
apiRouter.post('/admin/reset-data', requireAuth, requirePermission('canManageUsers'), (req, res) => {
  resetDatabase();
  logAudit(req, 'Réinitialisation Données', 'Base de données', 'Données re-seedées depuis le référentiel');
  ok(res, {});
});

// ---------------------------------------------------------------------------
// Technical diagnostic endpoints (rule-based)
// ---------------------------------------------------------------------------
apiRouter.post('/ai/diagnose', requireAuth, requirePermission('canRunDiagnostic'), (req, res) => {
  try {
    const { equipmentName, model, brand, errorCode, errorDescription, symptoms, telemetry } = req.body;
    if (!equipmentName) return res.status(400).json({ error: 'Equipment name is required.' });

    const code = errorCode || 'Standard';
    const symStr = Array.isArray(symptoms) ? symptoms.join(', ') : symptoms || 'Avis général';

    const diagnosticText = `--- FICHE DE DIAGNOSTIC TECHNIQUE AUTOMATISÉ ---
Équipement: ${equipmentName} (${brand} - ${model})
Code Erreur Identifié: ${code}
Symptômes Renseignés: ${symStr}

1. RÉSULTAT DU DIAGNOSTIC DE CAUSE RACINE
- Hypothèse Principale: Perturbation du signal électrique ou alimentation instable (${telemetry?.powerSource || 'AC/Batterie'}).
- Analyse Télémétrique: Charge Batterie (${telemetry?.batteryLevel ?? 'N/A'}%), Température Interne (${telemetry?.temperature ?? 'N/A'}°C), Qualité Signal (${telemetry?.signalQuality ?? 'N/A'}%).

2. SÉCURITÉ PATIENT ET CONSIGNES D'URGENCE
- Vérifier l'isolement électrique (Norme IEC 60601-1).
- En cas de déviation majeure ou d'alarme critique, basculer le patient sur un équipement de secours immédiatement.

3. PLAN D'ACTION DE DÉPANNAGE ÉTAPE PAR ÉTAPE
- Étape 1: Redémarrage froid et réinitialisation des paramètres d'usine.
- Étape 2: Contrôle visuel et nettoyage des connecteurs, câbles et sondes.
- Étape 3: Lancement de l'auto-test et du calibrage zéro via le menu de maintenance technique.
- Étape 4: Test de transmission des données et validation du tracé.

4. PIÈCES DE RECHANGE & OUTILLAGE CONSEILLÉS
- Multimètre biomédical, kit de test de sécurité électrique, câble patient de rechange.`;

    ok(res, { diagnostic: diagnosticText });
  } catch (err: any) {
    res.status(500).json({ error: 'Échec du diagnostic technique', details: err?.message });
  }
});

apiRouter.post('/ai/analyze-ticket', requireAuth, requirePermission('canRunDiagnostic'), (req, res) => {
  try {
    const { symptoms } = req.body;
    const symList = Array.isArray(symptoms) ? symptoms : [];

    let suggestedUrgency = 'high';
    let reasoning = 'Incident affectant le fonctionnement normal de l\'appareil.';
    let immediateSafetyAction = 'Contrôler l\'état du patient et isoler l\'équipement si dysfonctionnement persistant.';

    if (symList.some((s: string) => s.toLowerCase().includes('allumer') || s.toLowerCase().includes('panne'))) {
      suggestedUrgency = 'critical_vital';
      reasoning = 'Panne d\'alimentation totale détectée. Risque pour la continuité des soins.';
      immediateSafetyAction = 'Basculer immédiatement sur l\'équipement biomédical de secours.';
    } else if (symList.some((s: string) => s.toLowerCase().includes('batterie') || s.toLowerCase().includes('bruit'))) {
      suggestedUrgency = 'medium';
      reasoning = 'Anomalie secondaire ou dégradation progressive des performances.';
      immediateSafetyAction = 'Brancher sur le réseau électrique stable et vérifier les connexions.';
    }

    ok(res, {
      analysis: {
        suggestedUrgency,
        reasoning,
        immediateSafetyAction,
        estimatedRepairTimeHours: 2,
        requiredSpecialty: 'Maintenance Biomédicale Générale',
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Échec de l\'analyse du ticket', details: err?.message });
  }
});

apiRouter.post('/ai/assistant-chat', requireAuth, (req, res) => {
  try {
    const { messages } = req.body;
    const lastUserMsg = (messages?.[messages.length - 1]?.text || '').toLowerCase();

    let reply = 'Voici les consignes techniques standards : 1. Vérifiez l\'alimentation et la batterie. 2. Contrôlez l\'intégrité des câbles et connecteurs. 3. Lancez une séquence d\'auto-test et de calibrage zéro dans le menu de maintenance. 4. En cas de problème persistant, saisissez une fiche d\'intervention.';

    if (lastUserMsg.includes('err') || lastUserMsg.includes('erreur') || lastUserMsg.includes('code')) {
      reply = 'Analyse du code d\'erreur : 1. Notez précisément le code affiché. 2. Reportez-vous à la Base de Connaissances dans l\'onglet dédié. 3. Vérifiez les fusibles et la tension réseau. 4. Exécutez un redémarrage froid.';
    } else if (lastUserMsg.includes('sécurité') || lastUserMsg.includes('norme')) {
      reply = 'Normes de Sécurité Biomédicale (NF EN 60601-1) : 1. Mesure du courant de fuite à la terre. 2. Test d\'isolement du câble patient. 3. Vérification de la continuité de masse. 4. Validation du certificat de maintenance préventive.';
    }

    ok(res, { reply });
  } catch (err: any) {
    res.status(500).json({ error: 'Erreur assistant technique', details: err?.message });
  }
});

// Seed on first load
seedDatabase();
