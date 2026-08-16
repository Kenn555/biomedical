import React, { useState } from 'react';
import { Equipment, IncidentTicket } from '../types';
import { CriticalAlertsHistory } from './CriticalAlertsHistory';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Building2,
  DollarSign,
  Activity,
  ShieldCheck,
  PieChart as PieChartIcon,
  AlertCircle,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';

interface DashboardAnalyticsProps {
  equipmentList: Equipment[];
  tickets: IncidentTicket[];
  facilities: string[];
  selectedFacility: string;
}

export const DashboardAnalytics: React.FC<DashboardAnalyticsProps> = ({
  equipmentList,
  tickets,
  facilities,
  selectedFacility,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'critical_alerts'>('overview');

  const criticalAlertsCount = tickets.filter(
    (t) => t.urgency === 'critical_vital' || t.urgency === 'high'
  ).length;
  const list = selectedFacility === 'ALL' ? equipmentList : equipmentList.filter((e) => e.facility === selectedFacility);
  const total = list.length || 1;
  const operationalCount = list.filter((e) => e.status === 'operational').length;
  const availabilityRate = Math.round((operationalCount / total) * 100);

  // Filtered tickets based on selected facility
  const filteredTickets = selectedFacility === 'ALL'
    ? tickets
    : tickets.filter((t) => t.facility === selectedFacility);

  // SLA calculations
  const totalTicketsCount = filteredTickets.length;
  const slaRespectedCount = filteredTickets.filter((t) => !t.slaBreached).length;
  const slaBreachedCount = filteredTickets.filter((t) => t.slaBreached).length;
  const slaRatePercentage = totalTicketsCount > 0 ? Math.round((slaRespectedCount / totalTicketsCount) * 100) : 100;

  // Répartition des interventions par catégorie (calculée depuis les tickets réels)
  const CATEGORY_COLORS: Record<string, string> = {
    moniteur: 'bg-rose-500',
    ecg: 'bg-amber-500',
    echographe: 'bg-purple-500',
    oxymetre: 'bg-sky-500',
    pompe: 'bg-emerald-500',
    telesurveillance: 'bg-indigo-500',
  };
  const CATEGORY_LABELS: Record<string, string> = {
    moniteur: 'Moniteurs Multiparamétriques',
    ecg: 'Électrocardiographes (ECG)',
    echographe: 'Échographes Portables',
    oxymetre: 'Oxymètres de Pouls',
    pompe: 'Pompes à Perfusion',
    telesurveillance: 'Télésurveillance',
  };
  const categoryCounts = new Map<string, number>();
  for (const t of filteredTickets) {
    const cat = t.equipmentCategory || 'moniteur';
    categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
  }
  const categoryTotal = [...categoryCounts.values()].reduce((a, b) => a + b, 0) || 1;
  const categoryBreakdown = [...categoryCounts.entries()].map(([cat, count]) => ({
    label: CATEGORY_LABELS[cat] || cat,
    percent: Math.round((count / categoryTotal) * 100),
    color: CATEGORY_COLORS[cat] || 'bg-slate-500',
  }));

  const slaPieData = [
    {
      name: 'SLA Respecté',
      value: slaRespectedCount,
      color: '#10b981',
      percentage: totalTicketsCount > 0 ? Math.round((slaRespectedCount / totalTicketsCount) * 100) : 100,
    },
    {
      name: 'SLA Dépassé',
      value: slaBreachedCount,
      color: '#f43f5e',
      percentage: totalTicketsCount > 0 ? Math.round((slaBreachedCount / totalTicketsCount) * 100) : 0,
    },
  ];

  // Urgency SLA compliance rates
  const urgencyBreakdown = [
    {
      label: 'Urgence Vitale',
      sla: '2 hrs',
      total: filteredTickets.filter((t) => t.urgency === 'critical_vital').length,
      respected: filteredTickets.filter((t) => t.urgency === 'critical_vital' && !t.slaBreached).length,
    },
    {
      label: 'Urgence Élevée',
      sla: '6 hrs',
      total: filteredTickets.filter((t) => t.urgency === 'high').length,
      respected: filteredTickets.filter((t) => t.urgency === 'high' && !t.slaBreached).length,
    },
    {
      label: 'Urgence Moyenne',
      sla: '24 hrs',
      total: filteredTickets.filter((t) => t.urgency === 'medium').length,
      respected: filteredTickets.filter((t) => t.urgency === 'medium' && !t.slaBreached).length,
    },
    {
      label: 'Urgence Faible',
      sla: '48 hrs',
      total: filteredTickets.filter((t) => t.urgency === 'low').length,
      respected: filteredTickets.filter((t) => t.urgency === 'low' && !t.slaBreached).length,
    },
  ].map((item) => ({
    ...item,
    rate: item.total > 0 ? Math.round((item.respected / item.total) * 100) : 100,
  }));

  // Regional Facilities Status Data
  const facilityStats = [
    { name: 'Hôpital de District de Manakara', region: 'Vatovavy-Fitovinany', activeEq: 12, operationalRate: 92, tickets: 2 },
    { name: 'Poste de Santé Rural de Moramanga', region: 'Alaotra-Mangoro', activeEq: 6, operationalRate: 83, tickets: 1 },
    { name: 'Centre Hospitalier Régional de Tuléar', region: 'Atsimo-Andrefana', activeEq: 18, operationalRate: 98, tickets: 0 },
    { name: 'Centre Hospitalier Universitaire Majunga', region: 'Boeny', activeEq: 24, operationalRate: 95, tickets: 1 },
    { name: 'Poste de Santé Isalo', region: 'Ihorombe', activeEq: 4, operationalRate: 75, tickets: 1 },
    { name: 'Clinique Mobile Sambava', region: 'Sava', activeEq: 8, operationalRate: 100, tickets: 0 }
  ];

  return (
    <div className="space-y-6">
      {/* Dashboard Section Sub-Navigation */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-2.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center space-x-1.5 w-full sm:w-auto">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center space-x-2 ${
              activeSubTab === 'overview'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            <span>Vue Synthétique & SLA</span>
          </button>
          <button
            onClick={() => setActiveSubTab('critical_alerts')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center space-x-2 ${
              activeSubTab === 'critical_alerts'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80'
            }`}
          >
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>Historique Alertes Critiques & MTTR</span>
            {criticalAlertsCount > 0 && (
              <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-full ${
                activeSubTab === 'critical_alerts' ? 'bg-white text-rose-700' : 'bg-rose-600 text-white'
              }`}>
                {criticalAlertsCount}
              </span>
            )}
          </button>
        </div>

        <div className="text-[11px] text-slate-500 font-medium px-2 hidden lg:block">
          {activeSubTab === 'overview'
            ? 'Indicateurs clés de performance & distribution du respect SLA'
            : 'Suivi détaillé du temps de résolution moyen (MTTR) par site'}
        </div>
      </div>

      {/* Render Selected View */}
      {activeSubTab === 'critical_alerts' ? (
        <CriticalAlertsHistory
          tickets={tickets}
          facilities={facilities}
          selectedFacility={selectedFacility}
        />
      ) : (
        <>
          {/* Top Key Metrics Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Availability Rate */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-2 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Taux de Disponibilité du Parc</span>
            <span className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600">
              <Activity className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900">{availabilityRate}%</span>
            <span className="text-xs text-emerald-600 font-bold flex items-center">
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +2.4% ce mois
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Objectif ministériel: ≥ 90% en télémédecine</p>
        </div>

        {/* MTBF */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-2 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">MTBF (Temps Moyen Entre Pannes)</span>
            <span className="p-2 rounded-xl bg-sky-50 border border-sky-200 text-sky-600">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900">740 h</span>
            <span className="text-xs text-slate-500 font-medium">(~31 jours)</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Fiabilité accrue sur les moniteurs et ECG</p>
        </div>

        {/* MTTR */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-2 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">MTTR (Temps Moyen de Réparation)</span>
            <span className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-600">
              <BarChart3 className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-amber-600">3.8 hrs</span>
            <span className="text-xs text-emerald-600 font-bold">-1.2h via Télé-diagnostic</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Réduction majeure grâce aux diagnostics à distance</p>
        </div>

        {/* SLA Compliance */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-2 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Conformité Engagement SLA</span>
            <span className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-emerald-600">{slaRatePercentage}%</span>
            <span className="text-xs text-slate-500 font-medium">des interventions</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Prise en charge sous 2h sur urgence vitale</p>
        </div>
      </div>

      {/* SLA Distribution Pie Chart & Performance Analysis Section */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/80 pb-4 gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <PieChartIcon className="w-4 h-4 text-emerald-600" />
              <span>Distribution des Tickets Respectant ou Dépassant le SLA</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Graphique circulaire de répartition et respect des fenêtres d'intervention biomédicales
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-800 px-3 py-1 rounded-lg border border-emerald-200/80 shadow-2xs">
              Respect SLA Global: {slaRatePercentage}%
            </span>
            <span className="text-xs font-mono font-bold bg-slate-100 text-slate-800 px-3 py-1 rounded-lg border border-slate-200 shadow-2xs">
              {totalTicketsCount} Ticket(s) Total
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Pie Chart Component */}
          <div className="lg:col-span-6 bg-slate-50/80 rounded-xl border border-slate-200/80 p-4 relative flex flex-col items-center justify-center min-h-[290px] shadow-2xs">
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={slaPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    labelLine={false}
                  >
                    {slaPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-slate-700">
                            <p className="font-bold flex items-center space-x-1.5">
                              <span
                                className="w-2.5 h-2.5 rounded-full inline-block"
                                style={{ backgroundColor: data.color }}
                              />
                              <span>{data.name}</span>
                            </p>
                            <p className="font-mono text-slate-300">
                              Nombre de tickets : <span className="font-bold text-white">{data.value}</span>
                            </p>
                            <p className="font-mono text-slate-300">
                              Proportion : <span className="font-bold text-emerald-400">{data.percentage}%</span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => <span className="text-xs font-bold text-slate-700">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Donut Center Display */}
            <div className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <span className="text-2xl font-black text-slate-900 block leading-none">{slaRatePercentage}%</span>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Respect SLA</span>
            </div>
          </div>

          {/* SLA Breakdown Cards & Statistics */}
          <div className="lg:col-span-6 space-y-3.5">
            <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-3.5 flex items-start space-x-3 shadow-2xs">
              <div className="p-2 bg-emerald-600 text-white rounded-lg shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-emerald-950 text-xs">Tickets Respectant le SLA</h4>
                  <span className="font-mono font-extrabold text-emerald-700 text-sm">
                    {slaRespectedCount} ({slaRatePercentage}%)
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800/90 font-medium mt-0.5 leading-snug">
                  Interventions prises en charge et résolues dans le délai légal garanti.
                </p>
              </div>
            </div>

            <div className="bg-rose-50/80 border border-rose-200/80 rounded-xl p-3.5 flex items-start space-x-3 shadow-2xs">
              <div className="p-2 bg-rose-600 text-white rounded-lg shrink-0 mt-0.5">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-rose-950 text-xs">Tickets Dépassant le SLA</h4>
                  <span className="font-mono font-extrabold text-rose-700 text-sm">
                    {slaBreachedCount} ({totalTicketsCount > 0 ? Math.round((slaBreachedCount / totalTicketsCount) * 100) : 0}%)
                  </span>
                </div>
                <p className="text-[11px] text-rose-800/90 font-medium mt-0.5 leading-snug">
                  Retards engendrés par l'acheminement complexe de pièces ou la météo.
                </p>
              </div>
            </div>

            {/* Urgency SLA breakdown list */}
            <div className="bg-slate-50 rounded-xl border border-slate-200/80 p-3 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                Conformité SLA par Niveau d'Urgence
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {urgencyBreakdown.map((item, idx) => (
                  <div key={idx} className="bg-white p-2.5 rounded-lg border border-slate-200/80 flex items-center justify-between shadow-2xs">
                    <div>
                      <p className="font-bold text-slate-800 text-[11px]">{item.label}</p>
                      <p className="text-[10px] text-slate-400 font-medium">Fenêtre: {item.sla}</p>
                    </div>
                    <span className={`font-mono font-bold text-[11px] px-2 py-0.5 rounded ${
                      item.rate >= 80 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {item.rate}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Regional Facilities Status Map & Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Répartition Régionale des Centres de Santé & Postes Ruraux</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Couverture réseau télémédical et taux d'opérationnalité des équipements par site
            </p>
          </div>
          <span className="text-xs font-mono font-bold bg-slate-100 text-slate-800 px-3 py-1 rounded-lg border border-slate-200">
            6 Sites Rattachés
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Simulation Graphic */}
          <div className="lg:col-span-1 bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex flex-col justify-between relative min-h-[220px]">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-600 tracking-wider block">
                Carte Interactive Madagascar & Réseau Océan Indien
              </span>
              <p className="text-xs text-slate-700 font-medium">
                Postes de Santé Ruraux raccordés par Satellite/4G au CHU d'Antananarivo
              </p>
            </div>

            {/* Pins Simulation */}
            <div className="my-6 space-y-2">
              {facilityStats.slice(0, 4).map((f, idx) => (
                <div key={idx} className="flex items-center justify-between bg-white p-2.5 rounded-xl text-xs border border-slate-200 shadow-2xs">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-slate-900 font-semibold truncate max-w-[160px]">{f.name}</span>
                  </div>
                  <span className="font-mono text-emerald-700 font-bold">{f.operationalRate}%</span>
                </div>
              ))}
            </div>

            <div className="text-[10px] text-slate-500 text-center font-medium">
              Coordonnées GPS & Liaison Télémétrique Opérationnelles
            </div>
          </div>

          {/* Regional Table */}
          <div className="lg:col-span-2 overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3 font-bold">Établissement / Poste</th>
                  <th className="p-3 font-bold">Région</th>
                  <th className="p-3 font-bold">Équipements</th>
                  <th className="p-3 font-bold">Disponibilité</th>
                  <th className="p-3 font-bold">Pannes Actives</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80">
                {facilityStats.map((f, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-900">{f.name}</td>
                    <td className="p-3 text-slate-500 font-medium">{f.region}</td>
                    <td className="p-3 font-mono font-bold text-slate-800">{f.activeEq} unités</td>
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              f.operationalRate > 90 ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${f.operationalRate}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-emerald-700">{f.operationalRate}%</span>
                      </div>
                    </td>
                    <td className="p-3 font-mono">
                      {f.tickets > 0 ? (
                        <span className="text-rose-700 font-bold bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                          {f.tickets} en cours
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-bold">0 (RAS)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Equipment Category Cost & Breakdown Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
          <h4 className="font-bold text-slate-900 text-xs border-b border-slate-200/80 pb-2">
            Répartition des Interventions par Catégorie Biomédicale
          </h4>
          <div className="space-y-2.5 text-xs">
            {categoryBreakdown.length === 0 && (
              <p className="text-[11px] text-slate-400 font-medium">
                Aucune intervention enregistrée — les données apparaîtront ici.
              </p>
            )}
            {categoryBreakdown.map((c) => (
              <CategoryProgress key={c.label} label={c.label} percent={c.percent} color={c.color} />
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
          <h4 className="font-bold text-slate-900 text-xs border-b border-slate-200/80 pb-2">
            Résolutions guidées à distance
          </h4>
          <div className="space-y-3 text-xs">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-900">Tickets clôturés (validés / résolus)</p>
                <p className="text-[10px] text-slate-500 font-medium">Interventions terminées sur la période</p>
              </div>
              <span className="text-emerald-600 font-extrabold text-base">
                {tickets.filter((t) => t.status === 'validated' || t.status === 'resolved').length}
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-900">Sessions de télé-assistance vidéo</p>
                <p className="text-[10px] text-slate-500 font-medium">Diagnostics guidés enregistrés</p>
              </div>
              <span className="text-emerald-600 font-extrabold text-base">—</span>
            </div>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
};

const CategoryProgress: React.FC<{ label: string; percent: number; color: string }> = ({ label, percent, color }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-slate-700 font-medium">
      <span>{label}</span>
      <span className="font-mono font-bold text-slate-900">{percent}%</span>
    </div>
    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
    </div>
  </div>
);
