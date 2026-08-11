import React, { useState, useEffect } from 'react';
import { Equipment, IncidentTicket } from '../types';
import {
  X,
  Wrench,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Video,
  FileText,
  RotateCcw,
  Cpu
} from 'lucide-react';

interface RemoteDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: Equipment | null;
  ticket?: IncidentTicket | null;
  onOpenTeleSession: (equipment: Equipment) => void;
}

export const RemoteDiagnosticModal: React.FC<RemoteDiagnosticModalProps> = ({
  isOpen,
  onClose,
  equipment,
  ticket,
  onOpenTeleSession,
}) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'wizard' | 'telemetry'>('ai');
  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  const [aiDiagnosticResult, setAiDiagnosticResult] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Troubleshooting Wizard State
  const [wizardStepIndex, setWizardStepIndex] = useState<number>(0);
  const [stepChecks, setStepChecks] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (isOpen && equipment) {
      runAiDiagnostic();
    }
  }, [isOpen, equipment]);

  if (!isOpen || !equipment) return null;

  const runAiDiagnostic = async () => {
    setLoadingAi(true);
    setAiError(null);
    try {
      const res = await fetch('/api/ai/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipmentName: equipment.name,
          model: equipment.model,
          brand: equipment.brand,
          errorCode: equipment.telemetry.errorCode || ticket?.errorCode,
          errorDescription: equipment.telemetry.errorDescription || ticket?.description,
          symptoms: ticket?.symptoms || ['Interférence ou défaut de signal à distance'],
          telemetry: equipment.telemetry,
        }),
      });

      const data = await res.json();
      if (data.success && data.diagnostic) {
        setAiDiagnosticResult(data.diagnostic);
      } else {
        setAiError(data.details || 'Impossible de générer le diagnostic technique pour le moment.');
      }
    } catch (err: any) {
      setAiError(err.message || 'Erreur réseau lors de la communication avec le serveur.');
    } finally {
      setLoadingAi(false);
    }
  };

  // Sample Interactive Diagnostic Wizard steps based on equipment category
  const wizardSteps = [
    {
      title: 'Étape 1 : Vérification de la Source d\'Énergie & Mise à la Terre',
      instruction: 'Mesurer la tension aux bornes de la prise secteur ou du générateur solaire. Vérifier la terre physique (< 0.1 Ohm). Passer l\'équipement en mode Batterie pure.',
      warning: 'Danger électrique : Ne pas toucher les bornes internes sans décharger les condensateurs.',
    },
    {
      title: 'Étape 2 : Inspection Visuelle & Intégrité des Connecteurs / Capteurs',
      instruction: 'Inspecter les câbles brins, prises de dérivation, ou cassettes de pompe pour déceler pliures, fissures ou broches tordues.',
      warning: 'Utiliser une loupe d\'inspection si nécessaire.',
    },
    {
      title: 'Étape 3 : Exécution du Calibrage Zéro / Test de Sécurité Électrique',
      instruction: 'Lancer le menu Maintenance Système. Activer la séquence de calibrage interne et vérifier la conformité de la dérive.',
      warning: 'S\'assurer qu\'aucun patient n\'est relié à l\'appareil pendant la procédure.',
    },
    {
      title: 'Étape 4 : Validation de la Télé-Transmission Télémétrique 4G/Sat',
      instruction: 'Envoyer un paquet de données test vers le serveur central de télémédecine et valider la réception complète sans perte de paquets.',
      warning: 'Si le débit est < 50 kbps, basculer en mode compression données légères.',
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-lg font-bold">
              <Wrench className="w-5 h-5 font-bold" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white">Suite de Diagnostic Technique à Distance</h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded border border-emerald-500/30">
                  {equipment.code}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {equipment.name} • {equipment.facility}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Diagnostic Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 pt-2">
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'ai'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Synthèse Technique</span>
          </button>

          <button
            onClick={() => setActiveTab('wizard')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'wizard'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Arbre de Décision Guidé</span>
          </button>

          <button
            onClick={() => setActiveTab('telemetry')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'telemetry'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Télémétrie & Capteurs</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 text-xs text-slate-300 max-h-[70vh] overflow-y-auto">
          {/* TAB 1: Technical Diagnostic Synthesis */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white">Protocole de Maintenance & Diagnostic</span>
                </div>
                <button
                  onClick={runAiDiagnostic}
                  disabled={loadingAi}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1 rounded-lg font-medium text-xs flex items-center space-x-1 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Réactualiser</span>
                </button>
              </div>

              {loadingAi ? (
                <div className="p-12 text-center space-y-3">
                  <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
                  <p className="font-semibold text-slate-300">Analyse de la télémétrie et des codes d'erreur...</p>
                  <p className="text-[11px] text-slate-500">Corrélation avec les manuels de service {equipment.brand}</p>
                </div>
              ) : aiError ? (
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 space-y-2">
                  <p className="font-bold">{aiError}</p>
                  <button
                    onClick={runAiDiagnostic}
                    className="bg-rose-600 text-white px-3 py-1 rounded text-xs font-semibold cursor-pointer"
                  >
                    Réessayer
                  </button>
                </div>
              ) : (
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 whitespace-pre-wrap font-sans leading-relaxed text-slate-200">
                  {aiDiagnosticResult}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Interactive Decision Tree Wizard */}
          {activeTab === 'wizard' && (
            <div className="space-y-5">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm">
                    {wizardSteps[wizardStepIndex].title}
                  </h3>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Étape {wizardStepIndex + 1} sur {wizardSteps.length}
                  </p>
                </div>
                <div className="flex items-center space-x-1">
                  {wizardSteps.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-2.5 h-2.5 rounded-full ${
                        idx === wizardStepIndex
                          ? 'bg-emerald-400 ring-2 ring-emerald-500/40'
                          : idx < wizardStepIndex
                          ? 'bg-emerald-600'
                          : 'bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Instruction Card */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                <p className="text-slate-200 text-sm leading-relaxed font-medium">
                  {wizardSteps[wizardStepIndex].instruction}
                </p>

                {wizardSteps[wizardStepIndex].warning && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-amber-300 flex items-start space-x-2 text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                    <span>{wizardSteps[wizardStepIndex].warning}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-800 flex items-center space-x-3">
                  <button
                    onClick={() => {
                      setStepChecks({ ...stepChecks, [wizardStepIndex]: true });
                      if (wizardStepIndex < wizardSteps.length - 1) {
                        setWizardStepIndex(wizardStepIndex + 1);
                      }
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold flex items-center space-x-1.5 cursor-pointer transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Test Validé - Passer à l'Étape Suivante</span>
                  </button>

                  <button
                    onClick={() => {
                      setStepChecks({ ...stepChecks, [wizardStepIndex]: false });
                      alert('Échec de l\'étape détecté : recommandation d\'escalader au fournisseur externe ou d\'ouvrir une session de télé-assistance directe.');
                    }}
                    className="bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 px-4 py-2 rounded-xl font-semibold cursor-pointer transition-colors"
                  >
                    Anomalie Détectée
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Telemetry Stream Inspector */}
          {activeTab === 'telemetry' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-400">Marque & Modèle:</span>
                  <p className="font-bold text-white text-sm">{equipment.brand} {equipment.model}</p>
                </div>
                <div>
                  <span className="text-slate-400">Numéro de Série:</span>
                  <p className="font-mono font-bold text-white text-sm">{equipment.serialNumber}</p>
                </div>
                <div>
                  <span className="text-slate-400">Charge Batterie:</span>
                  <p className="font-bold text-emerald-400 text-sm">{equipment.telemetry.batteryLevel}%</p>
                </div>
                <div>
                  <span className="text-slate-400">Température Interne:</span>
                  <p className="font-bold text-amber-400 text-sm">{equipment.telemetry.temperature}°C</p>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
                <p className="text-slate-500">// RAW TELEMETRY LOG STREAM (JSON Payload)</p>
                <p className="text-emerald-400">{JSON.stringify(equipment.telemetry, null, 2)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex items-center justify-between">
          <p className="text-[11px] text-slate-400">
            Assistance technique collaborative connectée
          </p>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                onClose();
                onOpenTeleSession(equipment);
              }}
              className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-lg shadow-sky-600/20"
            >
              <Video className="w-4 h-4" />
              <span>Démarrer Télé-Assistance en Direct</span>
            </button>

            <button
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
