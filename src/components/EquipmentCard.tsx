import React from 'react';
import { Equipment, EquipmentCategory, EquipmentStatus } from '../types';
import {
  Battery,
  Wifi,
  Thermometer,
  Wrench,
  AlertTriangle,
  FileText,
  Activity,
  Video,
  Sparkles
} from 'lucide-react';

interface EquipmentCardProps {
  equipment: Equipment;
  onViewDetails: (equipment: Equipment) => void;
  onOpenDiagnostic: (equipment: Equipment) => void;
  onOpenTeleSession: (equipment: Equipment) => void;
  onReportIncident: (equipment: Equipment) => void;
}

export const EquipmentCard: React.FC<EquipmentCardProps> = ({
  equipment,
  onViewDetails,
  onOpenDiagnostic,
  onOpenTeleSession,
  onReportIncident,
}) => {
  const getStatusBadge = (status: EquipmentStatus) => {
    switch (status) {
      case 'operational':
        return { label: 'Opérationnel', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'degraded':
        return { label: 'Mode Dégradé', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'breakdown':
        return { label: 'En Panne', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'in_maintenance':
        return { label: 'En Maintenance', bg: 'bg-sky-50 text-sky-700 border-sky-200' };
      case 'critical':
        return { label: 'Urgence Vitale', bg: 'bg-purple-50 text-purple-700 border-purple-200 animate-pulse' };
    }
  };

  const statusBadge = getStatusBadge(equipment.status);

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:border-slate-300 hover:shadow-md transition-all duration-200 shadow-sm flex flex-col justify-between group">
      <div>
        {/* Card Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-start space-x-3 min-w-0">
            {/* Photo / Avatar de l'équipement */}
            <EquipmentThumb
              equipment={equipment}
              className="w-14 h-14 rounded-xl shrink-0"
              iconClassName="w-6 h-6 text-slate-400"
            />
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                  {equipment.code}
                </span>
                <span className="text-[11px] font-semibold text-slate-500">
                  {getCategoryLabel(equipment.category)}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mt-1.5 group-hover:text-emerald-600 transition-colors truncate">
                {equipment.name}
              </h3>
              <p className="text-xs text-slate-500 font-medium truncate">
                {equipment.brand} • {equipment.model}
              </p>
            </div>
          </div>

          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${statusBadge.bg} shrink-0`}>
            {statusBadge.label}
          </span>
        </div>

        {/* Location / Facility */}
        <div className="text-xs text-slate-600 mb-3 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/60">
          <p className="font-semibold text-slate-800 truncate">{equipment.facility}</p>
          <p className="text-[11px] text-slate-500">{equipment.department}</p>
        </div>

        {/* Telemetry Dashboard Strip */}
        <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200/60 mb-3 text-xs">
          {/* Battery */}
          <div className="flex flex-col">
            <div className="flex items-center space-x-1 text-slate-500 text-[10px] font-medium">
              <Battery className="w-3 h-3 text-slate-400" />
              <span>Batterie</span>
            </div>
            <div className="flex items-center space-x-1.5 mt-1">
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    equipment.telemetry.batteryLevel < 20
                      ? 'bg-rose-500'
                      : equipment.telemetry.batteryLevel < 50
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${equipment.telemetry.batteryLevel}%` }}
                />
              </div>
              <span className="font-mono text-[11px] text-slate-800 font-bold shrink-0">
                {equipment.telemetry.batteryLevel}%
              </span>
            </div>
          </div>

          {/* Temperature */}
          <div className="flex flex-col">
            <div className="flex items-center space-x-1 text-slate-500 text-[10px] font-medium">
              <Thermometer className="w-3 h-3 text-slate-400" />
              <span>Température</span>
            </div>
            <span
              className={`font-mono text-[11px] font-bold mt-1 ${
                equipment.telemetry.temperature > 40 ? 'text-rose-600' : 'text-slate-800'
              }`}
            >
              {equipment.telemetry.temperature}°C
            </span>
          </div>

          {/* Signal */}
          <div className="flex flex-col">
            <div className="flex items-center space-x-1 text-slate-500 text-[10px] font-medium">
              <Wifi className="w-3 h-3 text-slate-400" />
              <span>Signal 4G/Sat</span>
            </div>
            <span className="font-mono text-[11px] text-slate-800 font-bold mt-1">
              {equipment.telemetry.signalQuality}%
            </span>
          </div>
        </div>

        {/* Active Error Code Highlight */}
        {equipment.telemetry.errorCode && (
          <div className="mb-3 bg-rose-50 border border-rose-200/80 rounded-xl p-2.5 text-xs flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-mono font-bold text-rose-700">
                  {equipment.telemetry.errorCode}
                </span>
                <span className="text-[10px] font-semibold bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded-full">
                  Alerte Détectée
                </span>
              </div>
              <p className="text-slate-700 text-[11px] mt-0.5 line-clamp-1 font-medium">
                {equipment.telemetry.errorDescription}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-slate-200/80 flex flex-wrap gap-1.5">
        <button
          onClick={() => onViewDetails(equipment)}
          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center space-x-1 cursor-pointer"
          title="Consulter la fiche technique et la télémétrie"
        >
          <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="truncate">Fiche & Télémétrie</span>
        </button>

        <button
          onClick={() => onOpenDiagnostic(equipment)}
          className="bg-slate-900 hover:bg-slate-800 text-emerald-400 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center space-x-1 cursor-pointer shadow-xs"
          title="Lancer le diagnostic technique & Arbre de décision"
        >
          <Wrench className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Diagnostic</span>
        </button>

        <button
          onClick={() => onOpenTeleSession(equipment)}
          className="bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl p-2 sm:px-2.5 sm:py-1.5 text-xs font-semibold transition-colors flex items-center justify-center cursor-pointer"
          title="Session Télé-Assistance Vidéo en Direct"
        >
          <Video className="w-3.5 h-3.5 text-sky-600 shrink-0" />
        </button>

        <button
          onClick={() => onReportIncident(equipment)}
          className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl p-2 sm:px-2.5 sm:py-1.5 text-xs font-semibold transition-colors flex items-center justify-center cursor-pointer"
          title="Signaler une panne ou un problème"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
        </button>
      </div>
    </div>
  );
};

/**
 * Vignette photo d'un équipement avec repli élégant (icône) si l'image
 * est absente ou inaccessible.
 */
export const EquipmentThumb: React.FC<{
  equipment: Equipment;
  className?: string;
  iconClassName?: string;
}> = ({ equipment, className = '', iconClassName = 'w-6 h-6 text-slate-400' }) => {
  const [imgError, setImgError] = React.useState(false);
  const showImg = !!equipment.imageUrl && !imgError;
  return (
    <div
      className={`overflow-hidden bg-slate-100 border border-slate-200/80 flex items-center justify-center ${className}`}
      title={equipment.imageUrl ? equipment.name : 'Pas de photo disponible'}
    >
      {showImg ? (
        <img
          src={equipment.imageUrl}
          alt={equipment.name}
          loading="lazy"
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <Activity className={iconClassName} />
      )}
    </div>
  );
};

export function getCategoryLabel(category: EquipmentCategory): string {
  switch (category) {
    case 'moniteur':
      return 'Moniteur Multiparamétrique';
    case 'ecg':
      return 'Électrocardiographe (ECG)';
    case 'echographe':
      return 'Échographe Portable';
    case 'oxymetre':
      return 'Oxymètre de Pouls';
    case 'pompe':
      return 'Pompe à Perfusion';
    case 'telesurveillance':
      return 'Télésurveillance';
    default:
      return category;
  }
}
