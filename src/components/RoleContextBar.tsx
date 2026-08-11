import React from 'react';
import { UserProfile } from '../types';
import { Wrench, Shield, Stethoscope, UserCheck, BarChart3, Building, Truck, Settings, Sparkles } from 'lucide-react';

interface RoleContextBarProps {
  currentUser: UserProfile;
}

export const RoleContextBar: React.FC<RoleContextBarProps> = ({ currentUser }) => {
  const getRoleDetails = () => {
    switch (currentUser.role) {
      case 'technician':
        return {
          icon: Wrench,
          badge: 'Technicien Biomédical',
          tasks: 'Consulter les pannes, exécuter les télé-diagnostics avec IA, planifier les pièces & signer les rapports d\'intervention.'
        };
      case 'engineer':
        return {
          icon: Shield,
          badge: 'Ingénieur Biomédical',
          tasks: 'Superviser la conformité du parc, valider les rapports d\'intervention, analyser les pannes critiques & valider la sécurité.'
        };
      case 'doctor':
        return {
          icon: Stethoscope,
          badge: 'Médecin / Télé-Expert',
          tasks: 'Signaler les pannes en cours d\'examen, vérifier le statut opérationnel des appareils & suivre les délais de réparation.'
        };
      case 'nurse':
        return {
          icon: UserCheck,
          badge: 'Infirmier(ère) de Soins',
          tasks: 'Signalement rapide d\'incidents biomédicaux, demande d\'assistance d\'urgence & accompagnement télé-assistance.'
        };
      case 'manager':
        return {
          icon: BarChart3,
          badge: 'Responsable Maintenance',
          tasks: 'Affecter les techniciens, suivre le compte à rebours SLA, gérer les stocks de pièces & planifier la maintenance préventive.'
        };
      case 'director':
        return {
          icon: Building,
          badge: 'Directrice Établissement',
          tasks: 'Avoir une vue d\'ensemble globale du parc, des coûts de maintenance, des taux de panne et de la disponibilité régionale.'
        };
      case 'vendor':
        return {
          icon: Truck,
          badge: 'Fournisseur / Support Externe',
          tasks: 'Recevoir les escalades de pannes complexes, consulter les documentations constructeur & fournir les pièces détachées.'
        };
      case 'admin':
        return {
          icon: Settings,
          badge: 'Administrateur Système',
          tasks: 'Gérer les comptes utilisateurs, configurer le registre du parc, consulter les journaux d\'audit HDS & règles de sécurité.'
        };
    }
  };

  const details = getRoleDetails();
  const Icon = details.icon;

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-1">
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-800">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 rounded-xl bg-slate-900 text-emerald-400 shrink-0 shadow-xs">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-slate-900">
                {currentUser.name}
              </span>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/80">
                {currentUser.facility}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              <span className="font-bold text-slate-900">{details.badge} :</span> {details.tasks}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-[11px] font-semibold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80 self-start sm:self-auto shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Profil {currentUser.title}</span>
        </div>
      </div>
    </div>
  );
};
