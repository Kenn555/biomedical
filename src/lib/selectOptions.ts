import type { UserRole, EquipmentCategory, EquipmentStatus, UrgencyLevel, TicketStatus } from '../types';

/**
 * Gestionnaire central des options de tous les sélecteurs de l'app.
 *
 * Chaque liste est la source unique des <option> rendues dans les filtres et
 * les formulaires : modifier une option ici la met à jour partout
 * (AdminUsersAudit, EquipmentList, KnowledgeBase, TicketList, …).
 * Les labels (getXxxLabel) sont dérivés de ces mêmes listes, ce qui garantit
 * une cohérence totale entre les libellés affichés dans les listes et les
 * libellés proposés dans les sélecteurs.
 */

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
}

// ---------------------------------------------------------------------------
// Rôles utilisateur / acteurs
// ---------------------------------------------------------------------------
export const USER_ROLE_OPTIONS: SelectOption<UserRole>[] = [
  { value: 'technician', label: 'Technicien Biomédical' },
  { value: 'engineer', label: 'Ingénieur Biomédical' },
  { value: 'doctor', label: 'Médecin / Utilisateur' },
  { value: 'nurse', label: 'Infirmier(ère)' },
  { value: 'manager', label: 'Responsable Maintenance' },
  { value: 'director', label: 'Directeur d\'Établissement' },
  { value: 'vendor', label: 'Fournisseur Externe' },
  { value: 'admin', label: 'Administrateur Système' },
];

// ---------------------------------------------------------------------------
// Catégories d'équipement
// ---------------------------------------------------------------------------
export const EQUIPMENT_CATEGORY_OPTIONS: SelectOption<EquipmentCategory>[] = [
  { value: 'moniteur', label: 'Moniteur Multiparamétrique' },
  { value: 'ecg', label: 'Électrocardiographe (ECG)' },
  { value: 'echographe', label: 'Échographe Portable' },
  { value: 'oxymetre', label: 'Oxymètre de Pouls' },
  { value: 'pompe', label: 'Pompe à Perfusion' },
  { value: 'telesurveillance', label: 'Télésurveillance' },
];

// ---------------------------------------------------------------------------
// Statuts d'équipement
// ---------------------------------------------------------------------------
export const EQUIPMENT_STATUS_OPTIONS: SelectOption<EquipmentStatus>[] = [
  { value: 'operational', label: 'Opérationnel (Nominal)' },
  { value: 'degraded', label: 'Performance Dégradée' },
  { value: 'breakdown', label: 'En Panne' },
  { value: 'in_maintenance', label: 'En Maintenance Préventive' },
  { value: 'critical', label: 'CRITIQUE (Arrêt Réseau)' },
];

// ---------------------------------------------------------------------------
// Niveaux d'urgence
// ---------------------------------------------------------------------------
export const URGENCY_LEVEL_OPTIONS: SelectOption<UrgencyLevel>[] = [
  { value: 'critical_vital', label: 'URGENCE VITALE' },
  { value: 'high', label: 'Priorité Élevée' },
  { value: 'medium', label: 'Priorité Modérée' },
  { value: 'low', label: 'Faible' },
];

// ---------------------------------------------------------------------------
// Statuts de ticket (cycle de traitement)
// ---------------------------------------------------------------------------
export const TICKET_STATUS_OPTIONS: SelectOption<TicketStatus>[] = [
  { value: 'new', label: 'Nouveau / Signalé' },
  { value: 'diagnosed', label: 'Diagnostiqué' },
  { value: 'in_progress', label: 'Intervention en Cours' },
  { value: 'waiting_part', label: 'Attente Pièce Détachée' },
  { value: 'resolved', label: 'Résolu (Test Réussi)' },
  { value: 'validated', label: 'Validé par Ingénieur' },
];

// ---------------------------------------------------------------------------
// Helpers de libellés (dérivés des listes ci-dessus)
// ---------------------------------------------------------------------------

function labelOf<T extends string>(options: SelectOption<T>[], value: T | undefined | null): string {
  return options.find((o) => o.value === value)?.label ?? (value ?? '');
}

export function getRoleLabel(role: UserRole): string {
  return labelOf(USER_ROLE_OPTIONS, role);
}

export function getCategoryLabel(category: EquipmentCategory): string {
  return labelOf(EQUIPMENT_CATEGORY_OPTIONS, category);
}

export function getEquipmentStatusLabel(status: EquipmentStatus): string {
  return labelOf(EQUIPMENT_STATUS_OPTIONS, status);
}

export function getUrgencyLabel(urgency: UrgencyLevel): string {
  return labelOf(URGENCY_LEVEL_OPTIONS, urgency);
}

export function getTicketStatusLabel(status: TicketStatus): string {
  return labelOf(TICKET_STATUS_OPTIONS, status);
}

/** Construit les options d'un sélecteur d'établissements (liste dynamique serveur). */
export function facilityOptions(facilities: string[]): SelectOption<string>[] {
  return facilities.map((fac) => ({ value: fac, label: fac }));
}
