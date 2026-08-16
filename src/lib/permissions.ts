import type { UserProfile, UserRole } from '../types';

/**
 * Clés de permissions fines (RBAC) — identiques à la matrice du panneau
 * d'administration et aux contrôles du backend (server/auth.ts).
 */
export type PermissionKey =
  | 'canReportIncident'
  | 'canRunDiagnostic'
  | 'canCloseIntervention'
  | 'canManageEquipment'
  | 'canManageUsers';

/** Valeurs par défaut par rôle (appliquées si aucune permission explicite). */
const DEFAULT_PERMISSIONS: Record<UserRole, Record<PermissionKey, boolean>> = {
  technician: { canReportIncident: true, canRunDiagnostic: true, canCloseIntervention: true, canManageEquipment: false, canManageUsers: false },
  engineer: { canReportIncident: true, canRunDiagnostic: true, canCloseIntervention: true, canManageEquipment: true, canManageUsers: false },
  doctor: { canReportIncident: true, canRunDiagnostic: true, canCloseIntervention: true, canManageEquipment: false, canManageUsers: false },
  nurse: { canReportIncident: true, canRunDiagnostic: true, canCloseIntervention: true, canManageEquipment: false, canManageUsers: false },
  manager: { canReportIncident: true, canRunDiagnostic: true, canCloseIntervention: true, canManageEquipment: false, canManageUsers: false },
  director: { canReportIncident: true, canRunDiagnostic: true, canCloseIntervention: true, canManageEquipment: false, canManageUsers: false },
  vendor: { canReportIncident: true, canRunDiagnostic: true, canCloseIntervention: true, canManageEquipment: false, canManageUsers: false },
  admin: { canReportIncident: true, canRunDiagnostic: true, canCloseIntervention: true, canManageEquipment: true, canManageUsers: true },
};

/** Renvoie true si l'utilisateur dispose de la permission (avec repli par rôle). */
export function can(user: UserProfile | null | undefined, permission: PermissionKey): boolean {
  if (!user) return false;
  const explicit = user.permissions?.[permission];
  if (explicit !== undefined) return explicit;
  return DEFAULT_PERMISSIONS[user.role]?.[permission] ?? false;
}

/** Renvoie true si l'utilisateur possède l'un des rôles donnés. */
export function isRole(user: UserProfile | null | undefined, roles: UserRole[]): boolean {
  return !!user && roles.includes(user.role);
}
