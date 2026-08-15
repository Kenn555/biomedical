import React from 'react';
import { Equipment } from '../types';
import {
  X,
  Battery,
  Wifi,
  Thermometer,
  ShieldCheck,
  Calendar,
  Wrench,
  FileText,
  AlertTriangle,
  Sparkles,
  CheckCircle,
  Clock,
  Download,
  Video
} from 'lucide-react';
import { getCategoryLabel, EquipmentThumb } from './EquipmentCard';

interface EquipmentModalProps {
  equipment: Equipment | null;
  onClose: () => void;
  onOpenDiagnostic: (equipment: Equipment) => void;
  onOpenTeleSession: (equipment: Equipment) => void;
  onReportIncident: (equipment: Equipment) => void;
}

export const EquipmentModal: React.FC<EquipmentModalProps> = ({
  equipment,
  onClose,
  onOpenDiagnostic,
  onOpenTeleSession,
  onReportIncident,
}) => {
  if (!equipment) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            {/* Photo / Avatar de l'équipement */}
            <EquipmentThumb
              equipment={equipment}
              className="w-16 h-16 rounded-xl shrink-0"
              iconClassName="w-7 h-7 text-slate-400"
            />
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold bg-slate-900 text-emerald-400 px-2.5 py-1 rounded-lg">
                  {equipment.code}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-1 truncate">{equipment.name}</h2>
              <p className="text-xs text-slate-500 font-medium truncate">
                {equipment.brand} • {equipment.model} • SN: {equipment.serialNumber}
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

        {/* Modal Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto text-slate-700 text-xs font-medium">
          {/* Real-time Digital Twin Telemetry Strip */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Télémétrie en Direct (Jumeau Numérique)</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              {/* Battery */}
              <div className="space-y-1">
                <div className="flex items-center space-x-1 text-slate-500">
                  <Battery className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Batterie</span>
                </div>
                <p className="text-lg font-bold text-slate-900">{equipment.telemetry.batteryLevel}%</p>
                <p className="text-[10px] text-slate-500">Source: {equipment.telemetry.powerSource}</p>
              </div>

              {/* Temp */}
              <div className="space-y-1">
                <div className="flex items-center space-x-1 text-slate-500">
                  <Thermometer className="w-3.5 h-3.5 text-amber-600" />
                  <span>Température</span>
                </div>
                <p className="text-lg font-bold text-slate-900">{equipment.telemetry.temperature}°C</p>
                <p className="text-[10px] text-emerald-700 font-semibold">Plage normale (&lt;42°C)</p>
              </div>

              {/* Signal */}
              <div className="space-y-1">
                <div className="flex items-center space-x-1 text-slate-500">
                  <Wifi className="w-3.5 h-3.5 text-sky-600" />
                  <span>Liaison 4G/Sat</span>
                </div>
                <p className="text-lg font-bold text-slate-900">{equipment.telemetry.signalQuality}%</p>
                <p className="text-[10px] text-slate-500">Flux télémétrie actif</p>
              </div>

              {/* Hours & Firmware */}
              <div className="space-y-1">
                <div className="flex items-center space-x-1 text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-purple-600" />
                  <span>Heures & Firmware</span>
                </div>
                <p className="text-sm font-bold text-slate-900">{equipment.telemetry.operatingHours} hrs</p>
                <p className="text-[10px] font-mono text-slate-500">{equipment.telemetry.firmwareVersion}</p>
              </div>
            </div>
          </div>

          {/* Active Error Code Banner if applicable */}
          {equipment.telemetry.errorCode && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-rose-900 text-sm">
                    Code d'Erreur : {equipment.telemetry.errorCode}
                  </h4>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenDiagnostic(equipment);
                    }}
                    className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Lancer un Diagnostic</span>
                  </button>
                </div>
                <p className="text-slate-700 mt-1">{equipment.telemetry.errorDescription}</p>
              </div>
            </div>
          )}

          {/* Device General Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
              <h4 className="font-bold text-slate-900 text-xs border-b border-slate-200/80 pb-1">
                Fiche d'Identité
              </h4>
              <p><span className="text-slate-500 font-semibold">Catégorie:</span> {getCategoryLabel(equipment.category)}</p>
              <p><span className="text-slate-500 font-semibold">Marque / Fabricant:</span> {equipment.brand}</p>
              <p><span className="text-slate-500 font-semibold">Modèle Spécifique:</span> {equipment.model}</p>
              <p><span className="text-slate-500 font-semibold">Numéro de Série:</span> {equipment.serialNumber}</p>
              <p><span className="text-slate-500 font-semibold">Établissement:</span> {equipment.facility}</p>
              <p><span className="text-slate-500 font-semibold">Service:</span> {equipment.department}</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
              <h4 className="font-bold text-slate-900 text-xs border-b border-slate-200/80 pb-1">
                Suivi de Maintenance
              </h4>
              <p><span className="text-slate-500 font-semibold">Date d'Installation:</span> {equipment.installationDate}</p>
              <p><span className="text-slate-500 font-semibold">Dernière Maintenance:</span> {equipment.lastMaintenanceDate}</p>
              <p><span className="text-slate-500 font-semibold">Prochaine Révision Préventive:</span> <span className="text-amber-700 font-bold">{equipment.nextPreventiveMaintenance}</span></p>
              <p className="flex items-center space-x-1">
                <span className="text-slate-500 font-semibold">Certificat de Calibrage:</span>
                {equipment.telemetry.calibrationValid ? (
                  <span className="text-emerald-700 font-bold flex items-center space-x-1">
                    <CheckCircle className="w-3.5 h-3.5 inline text-emerald-600" />
                    <span>Valide (10/05/2026)</span>
                  </span>
                ) : (
                  <span className="text-rose-700 font-bold flex items-center space-x-1">
                    <AlertTriangle className="w-3.5 h-3.5 inline text-rose-600" />
                    <span>Expiré - Recalibrage Requis</span>
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Technical Documentation GED Downloads */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <h4 className="font-bold text-slate-900 text-xs mb-2 flex items-center justify-between">
              <span>Documentation Technique & Schémas</span>
              <span className="text-[10px] text-slate-500 font-semibold">GED Télémédecine</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); alert(`Téléchargement du Manuel Service Technique : ${equipment.model}.pdf`); }}
                className="flex items-center justify-between bg-white hover:bg-slate-100 border border-slate-200 p-2.5 rounded-xl text-slate-800 transition-colors shadow-2xs"
              >
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <div>
                    <p className="font-bold text-[11px]">Manuel de Service Constructeur</p>
                    <p className="text-[10px] text-slate-500">PDF • 4.2 MB</p>
                  </div>
                </div>
                <Download className="w-3.5 h-3.5 text-slate-500" />
              </a>

              <a
                href="#"
                onClick={(e) => { e.preventDefault(); alert(`Téléchargement du Schéma Électrique & Capteurs : ${equipment.model}-schematics.pdf`); }}
                className="flex items-center justify-between bg-white hover:bg-slate-100 border border-slate-200 p-2.5 rounded-xl text-slate-800 transition-colors shadow-2xs"
              >
                <div className="flex items-center space-x-2">
                  <Wrench className="w-4 h-4 text-sky-600" />
                  <div>
                    <p className="font-bold text-[11px]">Schématique Câblage & Cartes</p>
                    <p className="text-[10px] text-slate-500">PDF • 2.8 MB</p>
                  </div>
                </div>
                <Download className="w-3.5 h-3.5 text-slate-500" />
              </a>
            </div>
          </div>

          {/* Equipment Notes */}
          {equipment.notes && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <span className="font-bold text-slate-800">Historique & Notes de terrain :</span>
              <p className="text-slate-700 mt-0.5">{equipment.notes}</p>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-end gap-2">
          <button
            onClick={() => {
              onClose();
              onOpenDiagnostic(equipment);
            }}
            className="bg-slate-900 hover:bg-slate-800 text-emerald-400 px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Ouvrir la Suite de Diagnostic</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenTeleSession(equipment);
            }}
            className="bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Video className="w-4 h-4 text-sky-600" />
            <span>Télé-Assistance Directe</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onReportIncident(equipment);
            }}
            className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Signaler Panne</span>
          </button>
        </div>
      </div>
    </div>
  );
};
