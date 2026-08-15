import { randomBytes } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { db, findBy, getById, verifyPassword } from './db';

const SESSION_COOKIE = 'biomed_session';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface AuthUser {
  id: string;
  name: string;
  role: string;
  title?: string;
  facility?: string;
  email: string;
  avatar?: string;
  phone?: string;
  specialty?: string;
  permissions?: Record<string, boolean> | null;
}

export function publicUser(row: Record<string, unknown>): AuthUser {
  return {
    id: row.id as string,
    name: row.name as string,
    role: row.role as string,
    title: row.title as string | undefined,
    facility: row.facility as string | undefined,
    email: row.email as string,
    avatar: row.avatar as string | undefined,
    phone: row.phone as string | undefined,
    specialty: row.specialty as string | undefined,
    permissions: (row.permissions as Record<string, boolean> | null) ?? undefined,
  };
}

export function parseCookies(req: Request): Record<string, string> {
  const header = req.headers.cookie;
  if (!header) return {};
  const out: Record<string, string> = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return out;
}

export function getSessionUser(req: Request): AuthUser | null {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (!token) return null;
  const session = db
    .prepare('SELECT * FROM sessions WHERE token = ?')
    .get(token) as { userId: string; expiresAt: string } | undefined;
  if (!session) return null;
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    return null;
  }
  const user = getById('users', session.userId);
  if (!user) return null;
  return publicUser(user);
}

export function createSession(userId: string): { token: string; expiresAt: string } {
  const token = randomBytes(32).toString('hex');
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
  db.prepare('INSERT INTO sessions (token, userId, createdAt, expiresAt) VALUES (?, ?, ?, ?)').run(token, userId, createdAt, expiresAt);
  return { token, expiresAt };
}

export function destroySession(token: string): void {
  if (token) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  }
}

export function sessionCookie(token: string, expiresAt: string): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(SESSION_DURATION_MS / 1000)}${secure}`;
}

export const clearSessionCookie = `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const user = getSessionUser(req);
  if (!user) {
    res.status(401).json({ error: 'Authentification requise. Veuillez vous connecter.' });
    return;
  }
  (req as Request & { user?: AuthUser }).user = user;
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as Request & { user?: AuthUser }).user;
    if (!user || !roles.includes(user.role)) {
      res.status(403).json({ error: 'Accès refusé : droits insuffisants.' });
      return;
    }
    next();
  };
}

export function attemptLogin(email: string, password: string): AuthUser | null {
  const row = findBy('users', 'email', email);
  if (!row) return null;
  const storedHash = row.password_hash as string;
  if (!verifyPassword(password, storedHash)) return null;
  return publicUser(row);
}
