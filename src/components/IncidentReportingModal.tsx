import React, { useState } from 'react';
import { Equipment, UrgencyLevel, UserProfile } from '../types';
import {
  X,
  AlertTriangle,
  Upload,
  Mic,
  Sparkles,
  ShieldAlert,
  CheckCircle,
  FileText,
  Activity,
  Loader2
} from 'lucide-react';

interface IncidentReportingModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipmentList: Equipment[];
  selectedEquipmentPreload?: Equipment | null;
  currentUser: UserProfile;
  onSubmitTicket: (ticketData: {
    equipmentId: string;
    description: string;
    symptoms: string[];
    urgency: UrgencyLevel;
    errorCode?: string;
  }) => void;
}

const COMMON_SYMPTOMS = [
  'Refuse de s\'allumer / Panne d\'alimentation',
  'Code d\'erreur affiché à l\'écran',
  'Bruit parasite / Tracé déformé ou illisible',
  'Batterie ne tient plus la charge / Se décharge vite',
  'Erreur d\'occlusion / Alarme pression continue',
  'Dysfonctionnement du capteur ou câble patient',
  'Surchauffe anormale de l\'appareil',
  'Échec de transmission des données télémédicales'
];

export const IncidentReportingModal: React.FC<IncidentReportingModalProps> = ({
  isOpen,
  onClose,
  equipmentList,
  selectedEquipmentPreload,
  currentUser,
  onSubmitTicket,
}) => {
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>(
    selectedEquipmentPreload?.id || equipmentList[0]?.id || ''
  );
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [description, setDescription] = useState<string>('');
  const [errorCode, setErrorCode] = useState<string>('');
  const [urgency, setUrgency] = useState<UrgencyLevel>('high');
  const [isAnalyzingAi, setIsAnalyzingAi] = useState<boolean>(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);
  const [audioRecorded, setAudioRecorded] = useState<boolean>(false);
  const [photoUploaded, setPhotoUploaded] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentEquipment = equipmentList.find((e) => e.id === selectedEquipmentId);

  const toggleSymptom = (sym: string) => {
    if (selectedSymptoms.includes(sym)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== sym));
    } else {
      setSelectedSymptoms([...selectedSymptoms, sym]);
    }
  };

  // Run AI Auto-Triage via Express endpoint
  const handleAiAutoTriage = async () => {
    if (!description && selectedSymptoms.length === 0) {
      alert('Veuillez d\'abord saisir une description ou sélectionner au moins un symptôme.');
      return;
    }

    setIsAnalyzingAi(true);
    try {
      const res = await fetch('/api/ai/analyze-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          symptoms: selectedSymptoms,
          equipmentCategory: currentEquipment?.category || 'Inconnu',
        }),
      });

      const data = await res.json();
      if (data.success && data.analysis) {
        setAiAnalysisResult(data.analysis);
        if (data.analysis.suggestedUrgency) {
          setUrgency(data.analysis.suggestedUrgency as UrgencyLevel);
        }
      }
    } catch (err) {
      console.error('Error in AI Auto-triage:', err);
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquipmentId) {
      alert('Veuillez sélectionner un équipement.');
      return;
    }
    if (!description && selectedSymptoms.length === 0) {
      alert('Veuillez décrire le problème ou sélectionner des symptômes.');
      return;
    }

    onSubmitTicket({
      equipmentId: selectedEquipmentId,
      description,
      symptoms: selectedSymptoms,
      urgency,
      errorCode,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Signaler une Panne d'Équipement</h2>
              <p className="text-xs text-slate-500 font-medium">
                Formulaire guidé pour les médecins, infirmiers et utilisateurs de télémédecine
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-800 p-1 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs text-slate-700 max-h-[75vh] overflow-y-auto font-medium">
          {/* 1. Equipment Selector */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-900 flex items-center justify-between">
              <span>1. Sélectionner l'Équipement Concerné <span className="text-rose-600 font-bold">*</span></span>
              <span className="text-[10px] text-slate-400 font-normal">Recherche par identifiant ou hôpital</span>
            </label>
            <div className="relative">
              <select
                value={selectedEquipmentId}
                onChange={(e) => setSelectedEquipmentId(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100/80 text-slate-900 border border-slate-300/80 rounded-xl px-3.5 py-2.5 font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 focus:bg-white transition-all cursor-pointer shadow-2xs"
              >
                {equipmentList.map((eq) => (
                  <option key={eq.id} value={eq.id} className="bg-white text-slate-900 py-1">
                    {eq.code} — {eq.name} ({eq.brand} {eq.model}) [{eq.facility}]
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Equipment Info summary badge */}
          {currentEquipment && (
            <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200/80 flex items-center justify-between shadow-2xs">
              <div className="space-y-0.5">
                <p className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                  <span>{currentEquipment.name}</span>
                </p>
                <p className="text-[11px] text-slate-600 font-medium">
                  {currentEquipment.facility} • {currentEquipment.department}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono font-bold bg-white text-emerald-900 px-2.5 py-1 rounded-lg border border-emerald-200/80 shadow-2xs block">
                  SN: {currentEquipment.serialNumber}
                </span>
              </div>
            </div>
          )}

          {/* 2. Symptom Checklist */}
          <div className="space-y-2">
            <label className="font-bold text-slate-900 flex items-center justify-between">
              <span>2. Symptômes Observés (Cocher tous les dysfonctionnements)</span>
              <span className="text-[10px] text-slate-400 font-normal">{selectedSymptoms.length} sélectionné(s)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {COMMON_SYMPTOMS.map((sym, idx) => {
                const checked = selectedSymptoms.includes(sym);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleSymptom(sym)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer text-[11px] font-medium flex items-center space-x-2.5 ${
                      checked
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-950 font-bold shadow-2xs ring-1 ring-emerald-500/30'
                        : 'bg-slate-50 border-slate-200/90 text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 hover:border-slate-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-md border shrink-0 flex items-center justify-center transition-all ${
                        checked ? 'bg-emerald-600 border-emerald-600 shadow-2xs' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {checked && <CheckCircle className="w-3 h-3 text-white stroke-[2.5]" />}
                    </div>
                    <span className="leading-tight">{sym}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Error code & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1 space-y-1.5">
              <label className="font-bold text-slate-900 block text-xs">Code Erreur Écran</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ex: ERR-ECG-04"
                  value={errorCode}
                  onChange={(e) => setErrorCode(e.target.value)}
                  className="w-full bg-slate-50 hover:bg-slate-100/60 text-slate-900 border border-slate-300/80 rounded-xl p-2.5 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 focus:bg-white transition-all shadow-2xs"
                />
              </div>
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="font-bold text-slate-900 block text-xs">Description Détaillée de l'Incident</label>
              <textarea
                rows={2.5}
                placeholder="Décrivez les circonstances de la panne (ex: pendant un télé-examen, alarme sonore continue, odeur de chaud...)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100/60 text-slate-900 border border-slate-300/80 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 focus:bg-white transition-all shadow-2xs leading-relaxed"
              />
            </div>
          </div>

          {/* 4. Multimedia & Voice Note Attachments (Simulation) */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPhotoUploaded(!photoUploaded)}
              className={`p-3 rounded-xl border flex items-center justify-center space-x-2 transition-colors cursor-pointer font-semibold ${
                photoUploaded
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>{photoUploaded ? 'Photo/Vidéo Jointe (1)' : 'Joindre Photo/Vidéo'}</span>
            </button>

            <button
              type="button"
              onClick={() => setAudioRecorded(!audioRecorded)}
              className={`p-3 rounded-xl border flex items-center justify-center space-x-2 transition-colors cursor-pointer font-semibold ${
                audioRecorded
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>{audioRecorded ? 'Vocal Enregistré (12s)' : 'Enregistrer Mémo Vocal'}</span>
            </button>
          </div>

          {/* 5. Urgency Selection + AI Auto-Triage Trigger */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 block">5. Niveau d'Urgence Déclaré</label>
              <button
                type="button"
                onClick={handleAiAutoTriage}
                disabled={isAnalyzingAi}
                className="bg-slate-900 hover:bg-slate-800 text-emerald-400 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1 cursor-pointer transition-all shadow-2xs"
              >
                {isAnalyzingAi ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>Évaluation de la Priorité</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <UrgencyOption
                active={urgency === 'low'}
                onClick={() => setUrgency('low')}
                label="Faible"
                desc="Fonctionne partiellement"
                color="border-sky-300 bg-sky-50 text-sky-900"
              />
              <UrgencyOption
                active={urgency === 'medium'}
                onClick={() => setUrgency('medium')}
                label="Modérée"
                desc="Gêne non vitale"
                color="border-amber-300 bg-amber-50 text-amber-900"
              />
              <UrgencyOption
                active={urgency === 'high'}
                onClick={() => setUrgency('high')}
                label="Élevée"
                desc="Appareil inutilisable"
                color="border-rose-300 bg-rose-50 text-rose-900"
              />
              <UrgencyOption
                active={urgency === 'critical_vital'}
                onClick={() => setUrgency('critical_vital')}
                label="URGENCE VITALE"
                desc="Soin critique bloqué"
                color="border-rose-600 bg-rose-600 text-white font-bold animate-pulse"
              />
            </div>

            {/* Display Auto-Triage Feedback */}
            {aiAnalysisResult && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-900 text-xs space-y-1">
                <p className="font-bold text-emerald-800 flex items-center space-x-1">
                  <Activity className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Résultat du Triage Automatique :</span>
                </p>
                <p><span className="text-slate-600 font-semibold">Priorité Suggérée:</span> <span className="uppercase font-bold text-amber-800">{aiAnalysisResult.suggestedUrgency}</span></p>
                <p><span className="text-slate-600 font-semibold">Raison:</span> {aiAnalysisResult.reasoning}</p>
                <p><span className="text-slate-600 font-semibold">Consigne de Sécurité Immédiate:</span> <span className="text-slate-900 font-bold">{aiAnalysisResult.immediateSafetyAction}</span></p>
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Transmettre le Signalement</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface UrgencyOptionProps {
  active: boolean;
  onClick: () => void;
  label: string;
  desc: string;
  color: string;
}

const UrgencyOption: React.FC<UrgencyOptionProps> = ({ active, onClick, label, desc, color }) => (
  <button
    type="button"
    onClick={onClick}
    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
      active ? `${color} shadow-xs font-bold` : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`}
  >
    <p className="text-xs font-bold leading-tight">{label}</p>
    <p className="text-[10px] opacity-80 mt-0.5">{desc}</p>
  </button>
);
