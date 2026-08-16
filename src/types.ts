export type UserRole =
  | 'technician'      // Technicien biomédical
  | 'engineer'        // Ingénieur biomédical
  | 'doctor'          // Médecin / Utilisateur
  | 'nurse'           // Infirmier(ère)
  | 'manager'         // Responsable de maintenance
  | 'director'        // Responsable de l'établissement
  | 'vendor'          // Fournisseur / Technicien externe
  | 'admin';          // Administrateur

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  title: string;
  facility: string;
  email: string;
  avatar: string;
  phone: string;
  specialty?: string;
  permissions?: {
    canReportIncident?: boolean;
    canRunDiagnostic?: boolean;
    canCloseIntervention?: boolean;
    canManageEquipment?: boolean;
    canManageUsers?: boolean;
  };
}

export type EquipmentCategory =
  | 'moniteur'        // Moniteur multiparamétrique
  | 'ecg'             // Électrocardiographe (ECG)
  | 'echographe'      // Échographe portable
  | 'oxymetre'        // Oxymètre de pouls
  | 'pompe'           // Pompe à perfusion
  | 'telesurveillance';// Dispositif de télésurveillance

export type EquipmentStatus = 'operational' | 'degraded' | 'breakdown' | 'in_maintenance' | 'critical';

export interface TelemetryData {
  batteryLevel: number;        // %
  operatingHours: number;      // hrs
  temperature: number;         // °C
  lastCalibrationDate: string;
  calibrationValid: boolean;
  signalQuality: number;       // %
  firmwareVersion: string;
  errorCode?: string;
  errorDescription?: string;
  powerSource: 'AC' | 'Battery' | 'Solar';
}

export interface Equipment {
  id: string;
  code: string;                // e.g. EQ-MON-2024-01
  name: string;
  category: EquipmentCategory;
  model: string;
  brand: string;
  serialNumber: string;
  facility: string;            // e.g., Hôpital de District de Manakara
  department: string;          // e.g. Télémédecine / Urgences
  status: EquipmentStatus;
  installationDate: string;
  lastMaintenanceDate: string;
  nextPreventiveMaintenance: string;
  telemetry: TelemetryData;
  imageUrl?: string;          // Photo / image de l'équipement
  manualUrl?: string;
  schematicUrl?: string;
  notes?: string;
}

export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical_vital';

export type TicketStatus = 'new' | 'diagnosed' | 'in_progress' | 'waiting_part' | 'resolved' | 'validated';

export interface TicketSymptom {
  id: string;
  label: string;
  category: string;
}

export interface IncidentTicket {
  id: string;
  code: string;                // e.g. INC-2026-088
  equipmentId: string;
  equipmentName: string;
  equipmentCategory: EquipmentCategory;
  facility: string;
  reportedBy: {
    id: string;
    name: string;
    role: UserRole;
  };
  reportedAt: string;
  urgency: UrgencyLevel;
  symptoms: string[];
  description: string;
  status: TicketStatus;
  assignedTo?: {
    id: string;
    name: string;
    role: UserRole;
  };
  errorCode?: string;
  aiDiagnosticSummary?: string;
  slaDeadline: string;         // ISO timestamp
  slaBreached?: boolean;
  /** Pièces jointes du signalement : photo/vidéo (data URL) et mémo vocal (audio data URL) */
  attachments?: {
    photoVideo?: string;
    voiceMemo?: string;
  };
  /** Ids des utilisateurs ayant déjà consulté ce ticket (badge « non lu ») */
  viewedBy?: string[];
  history: {
    timestamp: string;
    actor: string;
    action: string;
    comment?: string;
  }[];
}

/** Acteur invité à un appel vidéo (choisi dans la liste des acteurs ou par établissement) */
export interface InvitedParticipant {
  id: string;
  name: string;
  role: UserRole;
  facility: string;
}

export interface DiagnosticStep {
  id: string;
  title: string;
  instruction: string;
  type: 'check' | 'measure' | 'action' | 'decision';
  safetyWarning?: string;
  expectedResult?: string;
}

export interface DiagnosticFlowchart {
  equipmentCategory: EquipmentCategory;
  problemTitle: string;
  steps: DiagnosticStep[];
}

export interface InterventionReport {
  id: string;
  ticketId: string;
  equipmentId: string;
  technicianName: string;
  engineerName?: string;
  startDate: string;
  endDate?: string;
  problemFound: string;
  actionsPerformed: string[];
  replacedParts: {
    partName: string;
    partCode: string;
    quantity: number;
    unitPrice: number;
  }[];
  electricalSafetyTestPassed: boolean;
  calibrationPerformed: boolean;
  finalStatus: EquipmentStatus;
  notes: string;
  signedByTechnician: boolean;
  validatedByEngineer: boolean;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: EquipmentCategory;
  modelTarget: string;
  errorCode?: string;
  summary: string;
  solutionSteps: string[];
  author: string;
  date: string;
  downloadsCount: number;
  tags: string[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  role: UserRole;
  action: string;
  target: string;
  ipAddress: string;
  details: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  timestamp: string;
  isAi?: boolean;
}

/** Session de visioconférence enregistrée (durée, participants présents, messages) */
export interface VideoSession {
  id: string;
  roomName: string;
  ticketCode?: string;
  equipmentCode?: string;
  startedAt: string;           // ISO timestamp de début
  endedAt: string;             // ISO timestamp de fin
  durationSeconds: number;
  participants: {
    id: string;
    name: string;
    role: string;
  }[];
  messages: {
    sender: string;
    time: string;
    text: string;
    isAi?: boolean;
  }[];
  /** Ids des utilisateurs ayant déjà consulté la notification d'appel (cloche) */
  viewedBy?: string[];
  createdBy?: {
    id: string;
    name: string;
  };
}
