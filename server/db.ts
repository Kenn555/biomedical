import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';

// Répertoire du module courant, quel que soit le contexte d'exécution :
// - en dev (tsx, ESM) : import.meta.url est une URL valide ;
// - en production, le bundle CJS généré par esbuild remplace import.meta.url
//   par un objet vide (donc undefined) → repli sur __dirname fourni par Node.
const MODULE_DIR = ((): string => {
  if (import.meta.url) return path.dirname(fileURLToPath(import.meta.url));
  return __dirname;
})();
// Le chemin de la base peut être surchargé via DB_PATH (utilisé par les tests)
// ou DATA_DIR (dossier de données alternatif).
const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(MODULE_DIR, '..', 'data');
const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(DATA_DIR, 'biomed.db');

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

export const db = new DatabaseSync(DB_PATH);

db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  title TEXT,
  facility TEXT,
  email TEXT UNIQUE NOT NULL,
  avatar TEXT,
  phone TEXT,
  specialty TEXT,
  permissions TEXT,
  password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS equipment (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  model TEXT,
  brand TEXT,
  serialNumber TEXT,
  facility TEXT,
  department TEXT,
  status TEXT NOT NULL,
  installationDate TEXT,
  lastMaintenanceDate TEXT,
  nextPreventiveMaintenance TEXT,
  telemetry TEXT,
  imageUrl TEXT,
  manualUrl TEXT,
  schematicUrl TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  equipmentId TEXT,
  equipmentName TEXT,
  equipmentCategory TEXT,
  facility TEXT,
  reportedBy TEXT,
  reportedAt TEXT,
  urgency TEXT,
  symptoms TEXT,
  description TEXT,
  status TEXT,
  assignedTo TEXT,
  errorCode TEXT,
  aiDiagnosticSummary TEXT,
  slaDeadline TEXT,
  slaBreached INTEGER,
  attachments TEXT,
  viewedBy TEXT,
  history TEXT
);

CREATE TABLE IF NOT EXISTS knowledge_articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  modelTarget TEXT,
  errorCode TEXT,
  summary TEXT,
  solutionSteps TEXT,
  author TEXT,
  date TEXT,
  downloadsCount INTEGER,
  tags TEXT
);

CREATE TABLE IF NOT EXISTS intervention_reports (
  id TEXT PRIMARY KEY,
  ticketId TEXT,
  equipmentId TEXT,
  technicianName TEXT,
  engineerName TEXT,
  startDate TEXT,
  endDate TEXT,
  problemFound TEXT,
  actionsPerformed TEXT,
  replacedParts TEXT,
  electricalSafetyTestPassed INTEGER,
  calibrationPerformed INTEGER,
  finalStatus TEXT,
  notes TEXT,
  signedByTechnician INTEGER,
  validatedByEngineer INTEGER
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TEXT,
  actor TEXT,
  role TEXT,
  action TEXT,
  target TEXT,
  ipAddress TEXT,
  details TEXT
);

CREATE TABLE IF NOT EXISTS facilities (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  createdAt TEXT,
  expiresAt TEXT
);

CREATE TABLE IF NOT EXISTS video_sessions (
  id TEXT PRIMARY KEY,
  roomName TEXT NOT NULL,
  ticketCode TEXT,
  equipmentCode TEXT,
  startedAt TEXT,
  endedAt TEXT,
  durationSeconds INTEGER,
  participants TEXT,
  messages TEXT,
  viewedBy TEXT,
  createdBy TEXT
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT,
  message TEXT,
  ticketId TEXT,
  ticketCode TEXT,
  createdAt TEXT,
  read INTEGER DEFAULT 0
);
`;

db.exec(SCHEMA);

// Migration : bases existantes créées avant l'ajout de la colonne imageUrl
// (CREATE TABLE IF NOT EXISTS ne modifie pas les tables déjà présentes).
function migrateEquipmentImageUrl(): void {
  const cols = db.prepare('PRAGMA table_info(equipment)').all() as { name: string }[];
  if (cols.some((c) => c.name === 'imageUrl')) return;
  db.prepare('ALTER TABLE equipment ADD COLUMN imageUrl TEXT').run();
}
migrateEquipmentImageUrl();

// Migration : bases existantes créées avant l'ajout de la colonne attachments
// (photo/vidéo et mémo vocal joints à un ticket).
function migrateTicketsAttachments(): void {
  const cols = db.prepare('PRAGMA table_info(tickets)').all() as { name: string }[];
  if (cols.some((c) => c.name === 'attachments')) return;
  db.prepare('ALTER TABLE tickets ADD COLUMN attachments TEXT').run();
}
migrateTicketsAttachments();

// Migration : bases existantes créées avant l'ajout de la colonne viewedBy
// (suivi des tickets « non lus » pour le badge Incidents & Signalements).
function migrateTicketsViewedBy(): void {
  const cols = db.prepare('PRAGMA table_info(tickets)').all() as { name: string }[];
  if (cols.some((c) => c.name === 'viewedBy')) return;
  db.prepare('ALTER TABLE tickets ADD COLUMN viewedBy TEXT').run();
}
migrateTicketsViewedBy();

// Migration : bases existantes créées avant l'ajout de la colonne viewedBy
// (cloche de notifications d'appels entrants dans le Header).
function migrateVideoSessionsViewedBy(): void {
  const cols = db.prepare('PRAGMA table_info(video_sessions)').all() as { name: string }[];
  if (cols.some((c) => c.name === 'viewedBy')) return;
  db.prepare('ALTER TABLE video_sessions ADD COLUMN viewedBy TEXT').run();
}
migrateVideoSessionsViewedBy();

// ---------------------------------------------------------------------------
// Entity registry (camelCase column names == API field names)
// ---------------------------------------------------------------------------
export interface EntityDef {
  table: string;
  jsonCols: string[];
  intCols: string[];
  orderBy: string;
}

export const ENTITIES: Record<string, EntityDef> = {
  users: {
    table: 'users',
    jsonCols: ['permissions'],
    intCols: [],
    orderBy: 'name ASC',
  },
  equipment: {
    table: 'equipment',
    jsonCols: ['telemetry'],
    intCols: [],
    orderBy: 'code ASC',
  },
  tickets: {
    table: 'tickets',
    jsonCols: ['reportedBy', 'assignedTo', 'symptoms', 'history', 'attachments', 'viewedBy'],
    intCols: ['slaBreached'],
    orderBy: 'reportedAt DESC',
  },
  knowledge: {
    table: 'knowledge_articles',
    jsonCols: ['solutionSteps', 'tags'],
    intCols: ['downloadsCount'],
    orderBy: 'date DESC',
  },
  reports: {
    table: 'intervention_reports',
    jsonCols: ['actionsPerformed', 'replacedParts'],
    intCols: ['electricalSafetyTestPassed', 'calibrationPerformed', 'signedByTechnician', 'validatedByEngineer'],
    orderBy: 'startDate DESC',
  },
  audit: {
    table: 'audit_logs',
    jsonCols: [],
    intCols: [],
    orderBy: 'timestamp DESC',
  },
  facilities: {
    table: 'facilities',
    jsonCols: [],
    intCols: [],
    orderBy: 'name ASC',
  },
  video_sessions: {
    table: 'video_sessions',
    jsonCols: ['participants', 'messages', 'viewedBy', 'createdBy'],
    intCols: [],
    orderBy: 'startedAt DESC',
  },
  notifications: {
    table: 'notifications',
    jsonCols: [],
    intCols: ['read'],
    orderBy: 'createdAt DESC',
  },
};

export type EntityName = keyof typeof ENTITIES;

// ---------------------------------------------------------------------------
// Serialization helpers
// ---------------------------------------------------------------------------
function serializeRow(data: Record<string, unknown>, def: EntityDef): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (def.jsonCols.includes(key)) {
      row[key] = typeof value === 'string' ? value : JSON.stringify(value);
    } else if (def.intCols.includes(key)) {
      row[key] = value ? 1 : 0;
    } else {
      row[key] = value;
    }
  }
  return row;
}

function deserializeRow(row: Record<string, unknown>, def: EntityDef): Record<string, unknown> {
  const out: Record<string, unknown> = { ...row };
  for (const key of def.jsonCols) {
    if (typeof out[key] === 'string') {
      try {
        out[key] = JSON.parse(out[key] as string);
      } catch {
        out[key] = null;
      }
    }
  }
  for (const key of def.intCols) {
    out[key] = Boolean(out[key]);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Generic CRUD
// ---------------------------------------------------------------------------
export function listAll(entity: EntityName): Record<string, unknown>[] {
  const def = ENTITIES[entity];
  return db
    .prepare(`SELECT * FROM ${def.table} ORDER BY ${def.orderBy}`)
    .all()
    .map((row) => deserializeRow(row as Record<string, unknown>, def));
}

export function getById(entity: EntityName, id: string): Record<string, unknown> | null {
  const def = ENTITIES[entity];
  const row = db.prepare(`SELECT * FROM ${def.table} WHERE id = ?`).get(id) as Record<string, unknown> | undefined;
  return row ? deserializeRow(row, def) : null;
}

export function insertRow(entity: EntityName, data: Record<string, unknown>): Record<string, unknown> {
  const def = ENTITIES[entity];
  const row = serializeRow({ id: data.id ?? `id-${randomUUID()}`, ...data }, def);
  const cols = Object.keys(row);
  const placeholders = cols.map(() => '?').join(', ');
  db.prepare(`INSERT INTO ${def.table} (${cols.join(', ')}) VALUES (${placeholders})`).run(...cols.map((c) => row[c] as SQLInputValue));
  return getById(entity, row.id as string)!;
}

export function updateRow(entity: EntityName, id: string, data: Record<string, unknown>): Record<string, unknown> | null {
  const def = ENTITIES[entity];
  const existing = getById(entity, id);
  if (!existing) return null;
  const merged = { ...existing, ...data, id };
  const row = serializeRow(merged, def);
  const cols = Object.keys(row).filter((c) => c !== 'id');
  const assignments = cols.map((c) => `${c} = ?`).join(', ');
  db.prepare(`UPDATE ${def.table} SET ${assignments} WHERE id = ?`).run(...cols.map((c) => row[c] as SQLInputValue), id);
  return getById(entity, id);
}

export function deleteRow(entity: EntityName, id: string): boolean {
  const def = ENTITIES[entity];
  const result = db.prepare(`DELETE FROM ${def.table} WHERE id = ?`).run(id);
  return result.changes > 0;
}

export function findBy(entity: EntityName, field: string, value: unknown): Record<string, unknown> | null {
  const def = ENTITIES[entity];
  const row = db.prepare(`SELECT * FROM ${def.table} WHERE ${field} = ?`).get(value as SQLInputValue) as Record<string, unknown> | undefined;
  return row ? deserializeRow(row, def) : null;
}

// ---------------------------------------------------------------------------
// Password hashing (scrypt, used by auth)
// ---------------------------------------------------------------------------
export function hashPassword(password: string): string {
  const salt = randomUUID().replace(/-/g, '').slice(0, 16);
  const hash = createHash('sha256').update(`${salt}:${password}`).digest('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, expected] = stored.split(':');
  if (!salt || !expected) return false;
  const candidate = createHash('sha256').update(`${salt}:${password}`).digest('hex');
  return candidate === expected;
}

// ---------------------------------------------------------------------------
// Première installation (aucune donnée de démonstration n'est seedée : la
// base démarre vide et le premier compte administrateur est créé via l'écran
// de première installation, ou directement par l'API POST /api/setup).
// ---------------------------------------------------------------------------
export function needsSetup(): boolean {
  const row = db.prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number };
  return row.count === 0;
}

export function createInitialAdmin(data: {
  name: string;
  email: string;
  password: string;
  title?: string;
  facility?: string;
}): { id: string; name: string; email: string; role: string } {
  const user = insertRow('users', {
    id: `usr-${Date.now()}`,
    name: data.name,
    email: data.email,
    role: 'admin',
    title: data.title || 'Administrateur',
    facility: data.facility || 'Établissement principal',
    avatar: '',
    phone: '',
    password_hash: hashPassword(data.password),
    permissions: {
      canReportIncident: true,
      canRunDiagnostic: true,
      canCloseIntervention: true,
      canManageEquipment: true,
      canManageUsers: true,
    },
  });
  return { id: user.id as string, name: user.name as string, email: user.email as string, role: user.role as string };
}

export function resetDatabase(): void {
  const tables = ['users', 'equipment', 'tickets', 'knowledge_articles', 'intervention_reports', 'audit_logs', 'facilities', 'video_sessions', 'notifications', 'sessions'];
  for (const t of tables) {
    db.prepare(`DELETE FROM ${t}`).run();
  }
}
