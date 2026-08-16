import React, { useState, useMemo } from 'react';
import { Equipment, EquipmentCategory, EquipmentStatus, UserProfile } from '../types';
import { EquipmentCard } from './EquipmentCard';
import { Search, Filter, Activity, AlertTriangle, CheckCircle, Wrench, RefreshCw, Plus, X } from 'lucide-react';

interface EquipmentListProps {
  equipmentList: Equipment[];
  selectedFacility: string;
  currentUser?: UserProfile;
  onViewDetails: (equipment: Equipment) => void;
  onOpenDiagnostic: (equipment: Equipment) => void;
  onOpenTeleSession: (equipment: Equipment) => void;
  onReportIncident: (equipment: Equipment) => void;
  onAddNewEquipment?: () => void;
}

export const EquipmentList: React.FC<EquipmentListProps> = ({
  equipmentList,
  selectedFacility,
  currentUser,
  onViewDetails,
  onOpenDiagnostic,
  onOpenTeleSession,
  onReportIncident,
  onAddNewEquipment,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const filteredEquipment = useMemo(() => {
    return equipmentList.filter((eq) => {
      // Facility filter
      if (selectedFacility !== 'ALL' && eq.facility !== selectedFacility) {
        return false;
      }
      // Category filter
      if (selectedCategory !== 'ALL' && eq.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (selectedStatus !== 'ALL' && eq.status !== selectedStatus) {
        return false;
      }
      // Search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        return (
          eq.name.toLowerCase().includes(q) ||
          eq.code.toLowerCase().includes(q) ||
          eq.brand.toLowerCase().includes(q) ||
          eq.model.toLowerCase().includes(q) ||
          eq.facility.toLowerCase().includes(q) ||
          eq.serialNumber.toLowerCase().includes(q) ||
          (eq.telemetry.errorCode && eq.telemetry.errorCode.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [equipmentList, selectedFacility, selectedCategory, selectedStatus, searchQuery]);

  // Statistics counters
  const stats = useMemo(() => {
    const list = selectedFacility === 'ALL' ? equipmentList : equipmentList.filter(e => e.facility === selectedFacility);
    return {
      total: list.length,
      operational: list.filter(e => e.status === 'operational').length,
      breakdown: list.filter(e => e.status === 'breakdown' || e.status === 'critical').length,
      maintenance: list.filter(e => e.status === 'in_maintenance').length,
      degraded: list.filter(e => e.status === 'degraded').length,
    };
  }, [equipmentList, selectedFacility]);

  return (
    <div className="space-y-6">
      {/* Overview KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Parc Connecté</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats.total}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center shadow-xs">
            <Activity className="w-5 h-5 font-bold" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
          <div>
            <p className="text-xs font-semibold text-slate-500">Opérationnels</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">{stats.operational}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
          <div>
            <p className="text-xs font-semibold text-slate-500">Pannes & Urgences</p>
            <p className="text-2xl font-extrabold text-rose-600 mt-1">{stats.breakdown}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
          <div>
            <p className="text-xs font-semibold text-slate-500">Maintenance / Dégradé</p>
            <p className="text-2xl font-extrabold text-amber-600 mt-1">
              {stats.maintenance + stats.degraded}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
            <Wrench className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Filters */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par équipement, modèle, code, ou code d'erreur (ex: ERR-ECG-04)..."
            className="w-full bg-slate-50 hover:bg-slate-100/60 text-slate-900 placeholder-slate-400 text-xs font-medium rounded-xl pl-10 pr-9 py-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 focus:bg-white transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 rounded-md hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Effacer la recherche"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-2 bg-slate-100/90 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium transition-colors shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-slate-900 font-semibold border-none focus:outline-none cursor-pointer text-xs"
            >
              <option value="ALL" className="bg-white">Toutes Catégories</option>
              <option value="moniteur" className="bg-white">Moniteurs Multiparamétriques</option>
              <option value="ecg" className="bg-white">Électrocardiographes (ECG)</option>
              <option value="echographe" className="bg-white">Échographes Portables</option>
              <option value="oxymetre" className="bg-white">Oxymètres de Pouls</option>
              <option value="pompe" className="bg-white">Pompes à Perfusion</option>
              <option value="telesurveillance" className="bg-white">Télésurveillance</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 bg-slate-100/90 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium transition-colors shadow-2xs">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-slate-900 font-semibold border-none focus:outline-none cursor-pointer text-xs"
            >
              <option value="ALL" className="bg-white">Tous les Statuts</option>
              <option value="operational" className="bg-white">Opérationnel</option>
              <option value="degraded" className="bg-white">Mode Dégradé</option>
              <option value="breakdown" className="bg-white">En Panne</option>
              <option value="in_maintenance" className="bg-white">En Maintenance</option>
              <option value="critical" className="bg-white">Urgence Vitale</option>
            </select>
          </div>

          {onAddNewEquipment && (
            <button
              onClick={onAddNewEquipment}
              className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter un Équipement</span>
            </button>
          )}
        </div>
      </div>

      {/* Equipment Grid */}
      {filteredEquipment.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-sm">
          <Activity className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Aucun équipement trouvé</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Modifiez vos filtres de recherche ou sélectionnez un autre établissement dans le menu supérieur.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEquipment.map((eq) => (
            <EquipmentCard
              key={eq.id}
              equipment={eq}
              currentUser={currentUser}
              onViewDetails={onViewDetails}
              onOpenDiagnostic={onOpenDiagnostic}
              onOpenTeleSession={onOpenTeleSession}
              onReportIncident={onReportIncident}
            />
          ))}
        </div>
      )}
    </div>
  );
};
