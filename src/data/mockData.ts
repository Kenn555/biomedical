import {
  Equipment,
  IncidentTicket,
  KnowledgeArticle,
  UserProfile,
  AuditLog,
  InterventionReport
} from '../types';

export const MOCK_USERS: UserProfile[] = [
  {
    id: 'usr-tech-01',
    name: 'Jean-Luc Randria',
    role: 'technician',
    title: 'Technicien Biomédical Référent',
    facility: 'Centre Hospitalier Régional de Tuléar',
    email: 'jl.randria@sante.mg',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    phone: '+261 34 12 345 67',
    specialty: 'Moniteurs & Pompes à perfusion'
  },
  {
    id: 'usr-eng-01',
    name: 'Dr. Bakoly Rakoto',
    role: 'engineer',
    title: 'Ingénieure Biomédicale en Chef',
    facility: 'Direction de la Télémédecine (Antananarivo)',
    email: 'b.rakoto@sante.mg',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    phone: '+261 32 07 890 12',
    specialty: 'Imagerie Médicale & Systèmes Connectés'
  },
  {
    id: 'usr-doc-01',
    name: 'Dr. Marc Heriniaina',
    role: 'doctor',
    title: 'Médecin Urgentiste / Télémédecine',
    facility: 'Hôpital de District de Manakara',
    email: 'm.heriniaina@sante.mg',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
    phone: '+261 33 45 678 90',
    specialty: 'Médecine d\'urgence & Cardiologie'
  },
  {
    id: 'usr-nurse-01',
    name: 'Sahondra Rasoa',
    role: 'nurse',
    title: 'Infirmière Majore',
    facility: 'Poste de Santé Rural de Moramanga',
    email: 's.rasoa@sante.mg',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
    phone: '+261 34 56 789 01'
  },
  {
    id: 'usr-mgr-01',
    name: 'Andry Ratsimba',
    role: 'manager',
    title: 'Responsable Maintenance & Parc',
    facility: 'Réseau Télémédecine Océan Indien',
    email: 'a.ratsimba@sante.mg',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    phone: '+261 32 11 223 34'
  },
  {
    id: 'usr-dir-01',
    name: 'Mme. Nirina Razafy',
    role: 'director',
    title: 'Directrice de l\'Établissement',
    facility: 'Centre Hospitalier Universitaire Majunga',
    email: 'n.razafy@sante.mg',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    phone: '+261 34 99 887 76'
  },
  {
    id: 'usr-vnd-01',
    name: 'Klaus Mueller',
    role: 'vendor',
    title: 'Expert Support Technique Constructeur',
    facility: 'BioMed Systems Global Support',
    email: 'support@biomed-global.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    phone: '+49 89 1234 5678'
  },
  {
    id: 'usr-adm-01',
    name: 'Admin Système',
    role: 'admin',
    title: 'Administrateur Plateforme Télémédecine',
    facility: 'Ministère de la Santé Publique',
    email: 'admin.telemed@sante.mg',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    phone: '+261 32 00 000 00'
  }
];

export const MOCK_FACILITIES = [
  'Hôpital de District de Manakara',
  'Poste de Santé Rural de Moramanga',
  'Centre Hospitalier Régional de Tuléar',
  'Centre Hospitalier Universitaire Majunga',
  'Poste de Santé Isalo',
  'Clinique Mobile Sambava'
];

export const MOCK_EQUIPMENT: Equipment[] = [
  {
    id: 'eq-01',
    code: 'EQ-MON-2024-01',
    name: 'Moniteur Multiparamétrique Connecté',
    category: 'moniteur',
    model: 'IntelliVue MX450 Telemed',
    brand: 'Philips Medical',
    serialNumber: 'SN-MX450-98214',
    facility: 'Hôpital de District de Manakara',
    department: 'Unité Soins Intensifs Télémédecine',
    status: 'operational',
    installationDate: '2024-03-15',
    lastMaintenanceDate: '2026-05-10',
    nextPreventiveMaintenance: '2026-11-10',
    telemetry: {
      batteryLevel: 92,
      operatingHours: 1420,
      temperature: 36.8,
      lastCalibrationDate: '2026-05-10',
      calibrationValid: true,
      signalQuality: 98,
      firmwareVersion: 'v4.2.1-telemed',
      powerSource: 'AC'
    },
    notes: 'Capteur SpO2 remplacé lors de la dernière révision. Fonctionne en 4G/Satellite.'
  },
  {
    id: 'eq-02',
    code: 'EQ-ECG-2024-03',
    name: 'Électrocardiographe 12 Pistes Télémédecine',
    category: 'ecg',
    model: 'CardioExpress SL12',
    brand: 'Spacelabs Healthcare',
    serialNumber: 'SN-ECG-12-5541',
    facility: 'Poste de Santé Rural de Moramanga',
    department: 'Consultation Télé-Cardiologie',
    status: 'breakdown',
    installationDate: '2024-08-20',
    lastMaintenanceDate: '2025-12-01',
    nextPreventiveMaintenance: '2026-06-01',
    telemetry: {
      batteryLevel: 28,
      operatingHours: 890,
      temperature: 41.2,
      lastCalibrationDate: '2025-12-01',
      calibrationValid: false,
      signalQuality: 35,
      firmwareVersion: 'v2.1.0',
      errorCode: 'ERR-ECG-04',
      errorDescription: 'Bruit parasite élevé sur dérivations V1-V3 & Décalage de ligne de base',
      powerSource: 'Battery'
    },
    notes: 'Problème survenu pendant un télé-diagnostic cardiaque d\'urgence avec le CHU d\'Antananarivo.'
  },
  {
    id: 'eq-03',
    code: 'EQ-ECH-2025-08',
    name: 'Échographe Portable Ultra-Léger',
    category: 'echographe',
    model: 'Vscan Air CL Telemed',
    brand: 'GE HealthCare',
    serialNumber: 'SN-GE-VSCAN-0092',
    facility: 'Clinique Mobile Sambava',
    department: 'Télé-Obstétrique & Urgences',
    status: 'operational',
    installationDate: '2025-01-10',
    lastMaintenanceDate: '2026-04-12',
    nextPreventiveMaintenance: '2026-10-12',
    telemetry: {
      batteryLevel: 85,
      operatingHours: 640,
      temperature: 35.4,
      lastCalibrationDate: '2026-04-12',
      calibrationValid: true,
      signalQuality: 92,
      firmwareVersion: 'v3.0.4',
      powerSource: 'Battery'
    },
    notes: 'Sonde double conventionnelle/Phased Array. Liaison sans-fil tablette sécurisée.'
  },
  {
    id: 'eq-04',
    code: 'EQ-PMP-2023-11',
    name: 'Pompe à Perfusion Connectée de Précision',
    category: 'pompe',
    model: 'Infusomat Space 2',
    brand: 'B. Braun Medical',
    serialNumber: 'SN-BB-INF-4412',
    facility: 'Hôpital de District de Manakara',
    department: 'Salle de Soins Télémédecine',
    status: 'critical',
    installationDate: '2023-11-05',
    lastMaintenanceDate: '2025-11-01',
    nextPreventiveMaintenance: '2026-05-01',
    telemetry: {
      batteryLevel: 12,
      operatingHours: 2310,
      temperature: 44.5,
      lastCalibrationDate: '2025-11-01',
      calibrationValid: false,
      signalQuality: 60,
      firmwareVersion: 'v1.8.9',
      errorCode: 'ERR-PERF-12',
      errorDescription: 'Erreur d\'occlusion ligne supérieure & Défaillance du capteur d\'air volumétrique',
      powerSource: 'Battery'
    },
    notes: 'Alerte sécurité vitale déclenchée. Nécessite recalibrage immédiat ou remplacement cassette.'
  },
  {
    id: 'eq-05',
    code: 'EQ-OXY-2024-05',
    name: 'Oxymètre de Pouls de Télésurveillance',
    category: 'oxymetre',
    model: 'Rad-97 Pulse CO-Oximeter',
    brand: 'Masimo',
    serialNumber: 'SN-MAS-RAD97-88',
    facility: 'Poste de Santé Isalo',
    department: 'Pédiatrie & Télé-pneumologie',
    status: 'degraded',
    installationDate: '2024-05-22',
    lastMaintenanceDate: '2026-02-14',
    nextPreventiveMaintenance: '2026-08-14',
    telemetry: {
      batteryLevel: 64,
      operatingHours: 1100,
      temperature: 37.1,
      lastCalibrationDate: '2026-02-14',
      calibrationValid: true,
      signalQuality: 70,
      firmwareVersion: 'v5.1.0',
      errorCode: 'ERR-SPO2-02',
      errorDescription: 'Déconnexion intermittente de la sonde néonatale Masimo Rainbow',
      powerSource: 'AC'
    },
    notes: 'Câble intermédiaire présente un faux contact au niveau du connecteur d\'angle.'
  },
  {
    id: 'eq-06',
    code: 'EQ-TEL-2025-02',
    name: 'Station de Télésurveillance Médicale Répartie',
    category: 'telesurveillance',
    model: 'TeleHealth Station Hub V3',
    brand: 'Comarch Healthcare',
    serialNumber: 'SN-COM-TH3-1102',
    facility: 'Centre Hospitalier Régional de Tuléar',
    department: 'Centre Régional de Télé-Consultation',
    status: 'operational',
    installationDate: '2025-02-01',
    lastMaintenanceDate: '2026-06-18',
    nextPreventiveMaintenance: '2026-12-18',
    telemetry: {
      batteryLevel: 100,
      operatingHours: 3100,
      temperature: 34.2,
      lastCalibrationDate: '2026-06-18',
      calibrationValid: true,
      signalQuality: 100,
      firmwareVersion: 'v6.0.1',
      powerSource: 'AC'
    },
    notes: 'Station centrale recevant les télémétries des 8 postes ruraux rattachés.'
  }
];

export const MOCK_TICKETS: IncidentTicket[] = [
  {
    id: 'tkt-01',
    code: 'INC-2026-088',
    equipmentId: 'eq-02',
    equipmentName: 'Électrocardiographe 12 Pistes Télémédecine',
    equipmentCategory: 'ecg',
    facility: 'Poste de Santé Rural de Moramanga',
    reportedBy: {
      id: 'usr-nurse-01',
      name: 'Sahondra Rasoa',
      role: 'nurse'
    },
    reportedAt: '2026-08-11T02:15:00Z',
    urgency: 'high',
    symptoms: [
      'Bruit parasite / Tracé illisible sur V1-V3',
      'Code d\'erreur affiché à l\'écran',
      'Échec de l\'envoi des données au télé-cardiologue'
    ],
    description: 'Pendant un examen d\'urgence pour suspicion de syndrome coronarien aigu, le tracé ECG affiche un parasite important et le message ERR-ECG-04. Impossible d\'envoyer le bilan au CHU.',
    status: 'diagnosed',
    assignedTo: {
      id: 'usr-tech-01',
      name: 'Jean-Luc Randria',
      role: 'technician'
    },
    errorCode: 'ERR-ECG-04',
    aiDiagnosticSummary: 'Gemini AI: Dysfonctionnement du câble patient à 12 brins ou problème de masse électrique sur la prise secteur. Vérifier l\'impédance des électrodes V1-V3 et tester avec câble de secours.',
    slaDeadline: '2026-08-11T06:15:00Z',
    slaBreached: false,
    history: [
      {
        timestamp: '2026-08-11T02:15:00Z',
        actor: 'Sahondra Rasoa (Infirmière)',
        action: 'Création du signalement d\'incident',
        comment: 'Urgence télé-consultation'
      },
      {
        timestamp: '2026-08-11T02:30:00Z',
        actor: 'Assistant IA Gemini',
        action: 'Diagnostic automatique généré',
        comment: 'Recommandation étape par étape envoyée au technicien'
      },
      {
        timestamp: '2026-08-11T03:00:00Z',
        actor: 'Jean-Luc Randria (Technicien)',
        action: 'Prise en charge & Diagnostic à distance démarré',
        comment: 'Session de télé-assistance initiée avec le poste de santé'
      }
    ]
  },
  {
    id: 'tkt-02',
    code: 'INC-2026-089',
    equipmentId: 'eq-04',
    equipmentName: 'Pompe à Perfusion Connectée de Précision',
    equipmentCategory: 'pompe',
    facility: 'Hôpital de District de Manakara',
    reportedBy: {
      id: 'usr-doc-01',
      name: 'Dr. Marc Heriniaina',
      role: 'doctor'
    },
    reportedAt: '2026-08-11T03:20:00Z',
    urgency: 'critical_vital',
    symptoms: [
      'Alarme sonore continue',
      'Erreur d\'occlusion sur la ligne',
      'Batterie ne tient plus la charge'
    ],
    description: 'La pompe s\'est bloquée avec alarme critique lors de l\'administration de catécholamines. Alerte occlusion en amont sans présence manifeste de grumeau ou pliure.',
    status: 'in_progress',
    assignedTo: {
      id: 'usr-tech-01',
      name: 'Jean-Luc Randria',
      role: 'technician'
    },
    errorCode: 'ERR-PERF-12',
    aiDiagnosticSummary: 'Gemini AI: Dérive du capteur optique de bulles/occlusion ou usure prématurée du mécanisme de poussée de la cassette. Action requise: Passer immédiatement sur pompe de secours et recalibrer.',
    slaDeadline: '2026-08-11T04:20:00Z',
    slaBreached: false,
    history: [
      {
        timestamp: '2026-08-11T03:20:00Z',
        actor: 'Dr. Marc Heriniaina (Médecin)',
        action: 'Signalement d\'Urgence Vitale',
        comment: 'Patient en soins critiques'
      },
      {
        timestamp: '2026-08-11T03:22:00Z',
        actor: 'Andry Ratsimba (Responsable Maintenance)',
        action: 'Affectation d\'urgence à Jean-Luc Randria',
        comment: 'Priorité maximale SLA 1h'
      }
    ]
  },
  {
    id: 'tkt-03',
    code: 'INC-2026-085',
    equipmentId: 'eq-05',
    equipmentName: 'Oxymètre de Pouls de Télésurveillance',
    equipmentCategory: 'oxymetre',
    facility: 'Poste de Santé Isalo',
    reportedBy: {
      id: 'usr-nurse-01',
      name: 'Sahondra Rasoa',
      role: 'nurse'
    },
    reportedAt: '2026-08-10T14:00:00Z',
    urgency: 'medium',
    symptoms: [
      'Mesure instable de la SpO2',
      'Déconnexion intermittente du capteur'
    ],
    description: 'Affichage intermittent de la saturation en oxygène. Faux contact sur la prise du capteur Masimo Rainbow.',
    status: 'waiting_part',
    assignedTo: {
      id: 'usr-vnd-01',
      name: 'Klaus Mueller',
      role: 'vendor'
    },
    errorCode: 'ERR-SPO2-02',
    aiDiagnosticSummary: 'Gemini AI: Câble patient endommagé. Remplacement de la rallonge d\'interface Masimo recommandé.',
    slaDeadline: '2026-08-12T14:00:00Z',
    slaBreached: false,
    history: [
      {
        timestamp: '2026-08-10T14:00:00Z',
        actor: 'Sahondra Rasoa',
        action: 'Ticket ouvert'
      },
      {
        timestamp: '2026-08-10T16:30:00Z',
        actor: 'Jean-Luc Randria',
        action: 'Commande de pièce détachée validée',
        comment: 'Transmis au fournisseur BioMed Systems'
      }
    ]
  },
  {
    id: 'tkt-04',
    code: 'INC-2026-072',
    equipmentId: 'eq-03',
    equipmentName: 'Échographe Portable de Télé-Diagnostic',
    equipmentCategory: 'echographe',
    facility: 'Centre Hospitalier Universitaire Majunga',
    reportedBy: {
      id: 'usr-dir-01',
      name: 'Mme. Nirina Razafy',
      role: 'director'
    },
    reportedAt: '2026-08-08T08:30:00Z',
    urgency: 'critical_vital',
    symptoms: [
      'Écran noir à l\'allumage',
      'Sonde abdominale non détectée',
      'Surchauffe rapide de l\'unité centrale'
    ],
    description: 'Lors d\'une urgence obstétricale en télé-consultation, l\'échographe s\'est éteint subitement avec voyant thermique rouge.',
    status: 'validated',
    assignedTo: {
      id: 'usr-eng-01',
      name: 'Dr. Bakoly Rakoto',
      role: 'engineer'
    },
    errorCode: 'ERR-ECHO-09',
    aiDiagnosticSummary: 'Gemini AI: Mise en sécurité thermique suite à obstruction des grilles de ventilation. Nettoyage du filtre à air et calibrage du bloc d\'alimentation effectués.',
    slaDeadline: '2026-08-08T10:30:00Z',
    slaBreached: false,
    history: [
      {
        timestamp: '2026-08-08T08:30:00Z',
        actor: 'Mme. Nirina Razafy',
        action: 'Alerte Urgence Vitale'
      },
      {
        timestamp: '2026-08-08T08:45:00Z',
        actor: 'Dr. Bakoly Rakoto',
        action: 'Diagnostic à distance exécuté'
      },
      {
        timestamp: '2026-08-08T09:42:00Z',
        actor: 'Jean-Luc Randria',
        action: 'Intervention validée & clôturée',
        comment: 'Temps de résolution : 1h 12min (MTTR optimal)'
      }
    ]
  },
  {
    id: 'tkt-05',
    code: 'INC-2026-068',
    equipmentId: 'eq-06',
    equipmentName: 'Station de Télésurveillance Médicale Répartie',
    equipmentCategory: 'telesurveillance',
    facility: 'Centre Hospitalier Régional de Tuléar',
    reportedBy: {
      id: 'usr-tech-01',
      name: 'Jean-Luc Randria',
      role: 'technician'
    },
    reportedAt: '2026-08-05T11:00:00Z',
    urgency: 'high',
    symptoms: [
      'Perte de flux réseau satellite',
      'Latence élevée >2000ms sur le hub',
      'Déconnexion des postes ruraux'
    ],
    description: 'Rupture de liaison télécoms entre le hub régional et les 8 postes ruraux rattachés pendant un suivi pédiatrique.',
    status: 'resolved',
    assignedTo: {
      id: 'usr-eng-01',
      name: 'Dr. Bakoly Rakoto',
      role: 'engineer'
    },
    errorCode: 'ERR-TEL-01',
    aiDiagnosticSummary: 'Gemini AI: Redémarrage du modem VSAT et reconfiguration du routage VPN chiffré.',
    slaDeadline: '2026-08-05T17:00:00Z',
    slaBreached: false,
    history: [
      {
        timestamp: '2026-08-05T11:00:00Z',
        actor: 'Jean-Luc Randria',
        action: 'Signalement réseau critique'
      },
      {
        timestamp: '2026-08-05T13:25:00Z',
        actor: 'Dr. Bakoly Rakoto',
        action: 'Restauration du canal sécurisé',
        comment: 'Temps de résolution : 2h 25min'
      }
    ]
  },
  {
    id: 'tkt-06',
    code: 'INC-2026-054',
    equipmentId: 'eq-05',
    equipmentName: 'Oxymètre de Pouls de Télésurveillance',
    equipmentCategory: 'oxymetre',
    facility: 'Poste de Santé Isalo',
    reportedBy: {
      id: 'usr-nurse-01',
      name: 'Sahondra Rasoa',
      role: 'nurse'
    },
    reportedAt: '2026-08-01T07:15:00Z',
    urgency: 'high',
    symptoms: [
      'Alarme de batterie faible persistante',
      'Défaut de charge sur panneau solaire'
    ],
    description: 'Le régulateur de charge solaire du poste de santé a disjoncté suite à un orage, empêchant la recharge du moniteur portable.',
    status: 'resolved',
    assignedTo: {
      id: 'usr-tech-01',
      name: 'Jean-Luc Randria',
      role: 'technician'
    },
    errorCode: 'ERR-PWR-03',
    aiDiagnosticSummary: 'Gemini AI: Remplacement du fusible de protection solaire 15A et vérification de la tension batterie.',
    slaDeadline: '2026-08-01T13:15:00Z',
    slaBreached: true,
    history: [
      {
        timestamp: '2026-08-01T07:15:00Z',
        actor: 'Sahondra Rasoa',
        action: 'Ouverture alerte alimentation'
      },
      {
        timestamp: '2026-08-01T12:00:00Z',
        actor: 'Jean-Luc Randria',
        action: 'Déplacement sur piste isolée'
      },
      {
        timestamp: '2026-08-01T14:45:00Z',
        actor: 'Jean-Luc Randria',
        action: 'Changement fusible & clôture',
        comment: 'Temps de résolution : 7h 30min (Dépassement SLA du aux inondations routières)'
      }
    ]
  },
  {
    id: 'tkt-07',
    code: 'INC-2026-049',
    equipmentId: 'eq-02',
    equipmentName: 'Électrocardiographe 12 Pistes Télémédecine',
    equipmentCategory: 'ecg',
    facility: 'Clinique Mobile Sambava',
    reportedBy: {
      id: 'usr-doc-01',
      name: 'Dr. Marc Heriniaina',
      role: 'doctor'
    },
    reportedAt: '2026-07-28T09:00:00Z',
    urgency: 'critical_vital',
    symptoms: [
      'Pannes répétées de transmission Bluetooth',
      'Message Erreur Mémoire Saturée'
    ],
    description: 'Impossible d\'exporter les électrocardiogrammes des patients du dispensaire itinérant vers le serveur régional.',
    status: 'validated',
    assignedTo: {
      id: 'usr-eng-01',
      name: 'Dr. Bakoly Rakoto',
      role: 'engineer'
    },
    errorCode: 'ERR-MEM-02',
    aiDiagnosticSummary: 'Gemini AI: Purge du répertore tampon local et mise à jour du firmware du module de communication.',
    slaDeadline: '2026-07-28T11:00:00Z',
    slaBreached: false,
    history: [
      {
        timestamp: '2026-07-28T09:00:00Z',
        actor: 'Dr. Marc Heriniaina',
        action: 'Signalement urgence télé-cardiologie'
      },
      {
        timestamp: '2026-07-28T10:28:00Z',
        actor: 'Dr. Bakoly Rakoto',
        action: 'Mise à jour à distance & validation',
        comment: 'Temps de résolution : 1h 28min (SLA 2h respecté)'
      }
    ]
  }
];

export const MOCK_KNOWLEDGE_BASE: KnowledgeArticle[] = [
  {
    id: 'kb-01',
    title: 'Résolution des Bruits Parasites sur ECG 12 Pistes en Zone Rurale',
    category: 'ecg',
    modelTarget: 'CardioExpress SL12 & ECG Portable',
    errorCode: 'ERR-ECG-04',
    summary: 'Guide pas à pas pour éliminer les interférences réseau 50Hz, la masse flottante et la mauvaise impédance de peau dans les postes de santé isolés.',
    solutionSteps: [
      'Nettoyer soigneusement la peau du patient avec une compresse imbibée d\'alcool isopropylique avant la pose des électrodes.',
      'Vérifier la prise de terre du générateur solaire/secteur. En cas de réseau instable, basculer l\'ECG en mode Batterie pure.',
      'Activer le filtre Notch 50Hz/60Hz et le filtre de ligne de base (0.05 Hz) dans les réglages avancés du CardioExpress.',
      'Remplacer le câble banane patient si la résistance mesurée entre deux brins dépasse 10 Ohms.'
    ],
    author: 'Dr. Bakoly Rakoto (Ingénieure Biomédicale)',
    date: '2026-04-10',
    downloadsCount: 142,
    tags: ['ECG', 'Terre', 'Parasites', 'Télé-Cardiologie', 'Guide Rurale']
  },
  {
    id: 'kb-02',
    title: 'Dépannage d\'Urgence des Alarmes d\'Occlusion sur Pompes à Perfusion',
    category: 'pompe',
    modelTarget: 'Infusomat Space 2 / Agilia',
    errorCode: 'ERR-PERF-12',
    summary: 'Procédure d\'inspection rapide du capteur de pression en amont et de purge de la ligne de perfusion lors des actes de télémédecine.',
    solutionSteps: [
      'Interrompre temporairement la perfusion et clamper la ligne en aval.',
      'Ouvrir le capot de la pompe et vérifier que la tubulure en silicone n\'est pas déformée ni pincée.',
      'Nettoyer le capteur optique de bulles avec un coton-tige sec sans solvant agressif.',
      'Exécuter la procédure de test à vide (Zero Calibration) accessible via le menu Maintenance (Code 1234).'
    ],
    author: 'Jean-Luc Randria (Technicien Biomédical)',
    date: '2026-03-22',
    downloadsCount: 98,
    tags: ['Pompe', 'Occlusion', 'Sécurité Vitale', 'Calibrage']
  },
  {
    id: 'kb-03',
    title: 'Calibrage et Entretien des Sondes d\'Échographie Portables Vscan',
    category: 'echographe',
    modelTarget: 'GE Vscan Air CL / Butterfly iQ',
    summary: 'Bonnes pratiques de désinfection, vérification de l\'intégrité de la lentille acoustique et synchronisation Wi-Fi sécurisée.',
    solutionSteps: [
      'Inspecter visuellement la lentille acoustique pour détecter toute fissure ou décollement de membrane.',
      'Utiliser uniquement des lingettes désinfectantes homologuées sans alcool (ex: Anios) pour ne pas détériorer les cristaux piézo-électriques.',
      'Si la sonde chauffe prématurément (>40°C), réduire le gain acoustique et redémarrer l\'application Vscan App.',
      'Effectuer un test de phantom gel tous les 3 mois pour valider la résolution axiale et latérale.'
    ],
    author: 'Dr. Bakoly Rakoto',
    date: '2026-02-18',
    downloadsCount: 210,
    tags: ['Échographie', 'Sonde', 'Désinfection', 'Wi-Fi']
  }
];

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-101',
    timestamp: '2026-08-11T03:30:12Z',
    actor: 'Jean-Luc Randria',
    role: 'technician',
    action: 'Lancement Diagnostic IA Gemini',
    target: 'Équipement EQ-ECG-2024-03',
    ipAddress: '197.220.12.44',
    details: 'Analyse d\'erreur ERR-ECG-04 et vérification télémétrie batterie'
  },
  {
    id: 'aud-100',
    timestamp: '2026-08-11T03:20:00Z',
    actor: 'Dr. Marc Heriniaina',
    role: 'doctor',
    action: 'Signalement Incident Critique',
    target: 'Pompe EQ-PMP-2023-11',
    ipAddress: '41.204.18.91',
    details: 'Ouverture du ticket INC-2026-089 avec urgence vitale'
  },
  {
    id: 'aud-099',
    timestamp: '2026-08-11T02:15:00Z',
    actor: 'Sahondra Rasoa',
    role: 'nurse',
    action: 'Création Ticket Incident',
    target: 'ECG EQ-ECG-2024-03',
    ipAddress: '197.218.40.12',
    details: 'Signalement bruit parasite sur V1-V3 lors de télé-consultation'
  },
  {
    id: 'aud-098',
    timestamp: '2026-08-10T16:30:00Z',
    actor: 'Andry Ratsimba',
    role: 'manager',
    action: 'Validation Commande Pièce',
    target: 'Oxymètre EQ-OXY-2024-05',
    ipAddress: '197.220.10.88',
    details: 'Approbation demande câble rallonge Masimo chez BioMed Systems'
  }
];

export const MOCK_INTERVENTION_REPORTS: InterventionReport[] = [
  {
    id: 'rep-001',
    ticketId: 'tkt-000',
    equipmentId: 'eq-01',
    technicianName: 'Jean-Luc Randria',
    engineerName: 'Dr. Bakoly Rakoto',
    startDate: '2026-05-10T08:00:00Z',
    endDate: '2026-05-10T11:30:00Z',
    problemFound: 'Usure du capteur SpO2 d\'origine provoquant des fausses alarmes de desaturation.',
    actionsPerformed: [
      'Vérification sécurité électrique (Tension de fuite 12µA, Résistance de terre 0.08 Ohm)',
      'Remplacement du capteur SpO2 adulte réutilisable',
      'Mise à jour du firmware en version v4.2.1-telemed',
      'Test de simulation de constantes vitales NIBP / ECG / SpO2 sur banc Fluke ProSim'
    ],
    replacedParts: [
      {
        partName: 'Capteur SpO2 Adulte Philips M1191B',
        partCode: 'PRT-PHI-SPO2-01',
        quantity: 1,
        unitPrice: 120
      }
    ],
    electricalSafetyTestPassed: true,
    calibrationPerformed: true,
    finalStatus: 'operational',
    notes: 'Équipement certifié conforme pour télé-consultations d\'urgence.',
    signedByTechnician: true,
    validatedByEngineer: true
  }
];
