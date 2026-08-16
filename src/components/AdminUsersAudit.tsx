import React, { useState } from 'react';
import { UserProfile, AuditLog, Equipment, EquipmentCategory, EquipmentStatus, UserRole } from '../types';
import {
  ShieldCheck,
  Users,
  PlusCircle,
  Edit3,
  Trash2,
  Key,
  Search,
  CheckCircle2,
  Check,
  Image,
  X,
  Save,
  Wrench,
  Building2,
  Mail,
  Phone,
  Shield,
  Filter
} from 'lucide-react';
import { getRoleLabel } from './Header';
import { ImageUploadButton } from './ImageUploadButton';

interface AdminUsersAuditProps {
  users: UserProfile[];
  auditLogs: AuditLog[];
  equipmentList: Equipment[];
  /** false pour un ingénieur/manager : seuls les admins gèrent acteurs & audit */
  canManageUsers?: boolean;
  /** password : à la création c'est le mot de passe initial ; en modification, vide = inchangé */
  onAddUser?: (newUser: UserProfile, password?: string) => void;
  onUpdateUser?: (updatedUser: UserProfile, password?: string) => void;
  onDeleteUser?: (userId: string) => void;
  onAddEquipment: (newEq: Equipment) => void;
  onUpdateEquipment?: (updatedEq: Equipment) => void;
  onDeleteEquipment?: (eqId: string) => void;
}

export const AdminUsersAudit: React.FC<AdminUsersAuditProps> = ({
  users,
  auditLogs,
  equipmentList,
  canManageUsers = true,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onAddEquipment,
  onUpdateEquipment,
  onDeleteEquipment,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'permissions' | 'equipment' | 'audit'>(
    canManageUsers ? 'users' : 'equipment'
  );

  // Search & Filters
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');
  const [eqSearch, setEqSearch] = useState('');
  const [eqCategoryFilter, setEqCategoryFilter] = useState<string>('ALL');

  // User Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  // User Form State
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('technician');
  const [userTitle, setUserTitle] = useState('');
  const [userFacility, setUserFacility] = useState('Hôpital de District de Manakara');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('+261 34 00 000 00');
  const [userSpecialty, setUserSpecialty] = useState('Biomédical & Maintenance');
  const [userAvatar, setUserAvatar] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userPermissions, setUserPermissions] = useState({
    canReportIncident: true,
    canRunDiagnostic: true,
    canCloseIntervention: true,
    canManageEquipment: false,
    canManageUsers: false,
  });

  // Avatars de démonstration proposés à la création d'un acteur
  const PRESET_AVATARS = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  ];
  const DEFAULT_AVATAR = PRESET_AVATARS[0];

  // Equipment Modal State
  const [isEqModalOpen, setIsEqModalOpen] = useState(false);
  const [editingEq, setEditingEq] = useState<Equipment | null>(null);

  // Equipment Form State
  const [eqCode, setEqCode] = useState('');
  const [eqName, setEqName] = useState('');
  const [eqCategory, setEqCategory] = useState<EquipmentCategory>('moniteur');
  const [eqModel, setEqModel] = useState('');
  const [eqBrand, setEqBrand] = useState('');
  const [eqSerialNumber, setEqSerialNumber] = useState('');
  const [eqFacility, setEqFacility] = useState('Hôpital de District de Manakara');
  const [eqDepartment, setEqDepartment] = useState('Unité Télémédecine');
  const [eqStatus, setEqStatus] = useState<EquipmentStatus>('operational');
  const [eqImageUrl, setEqImageUrl] = useState('');
  const [eqNotes, setEqNotes] = useState('');

  // Photos de démonstration proposées pour un équipement (par catégorie)
  const PRESET_EQUIPMENT_IMAGES = [
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1581056771107-24ca5f033842?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=300&auto=format&fit=crop&q=80',
  ];

  // Open User Modal for Create/Edit
  const handleOpenUserModal = (user?: UserProfile) => {
    if (user) {
      setEditingUser(user);
      setUserName(user.name);
      setUserRole(user.role);
      setUserTitle(user.title);
      setUserFacility(user.facility);
      setUserEmail(user.email);
      setUserPhone(user.phone || '');
      setUserSpecialty(user.specialty || '');
      setUserAvatar(user.avatar || '');
      // En modification : laisser vide pour conserver le mot de passe actuel
      setUserPassword('');
      setUserPermissions({
        canReportIncident: user.permissions?.canReportIncident ?? true,
        canRunDiagnostic: user.permissions?.canRunDiagnostic ?? true,
        canCloseIntervention: user.permissions?.canCloseIntervention ?? true,
        canManageEquipment: user.permissions?.canManageEquipment ?? (user.role === 'admin' || user.role === 'engineer'),
        canManageUsers: user.permissions?.canManageUsers ?? (user.role === 'admin'),
      });
    } else {
      setEditingUser(null);
      setUserName('');
      setUserRole('technician');
      setUserTitle('Technicien Biomédical');
      setUserFacility('Hôpital de District de Manakara');
      setUserEmail('nouvel.acteur@sante.gov.mg');
      setUserPhone('+261 34 12 345 67');
      setUserSpecialty('Maintenance & Équipements');
      setUserAvatar('');
      setUserPassword('');
      setUserPermissions({
        canReportIncident: true,
        canRunDiagnostic: true,
        canCloseIntervention: true,
        canManageEquipment: false,
        canManageUsers: false,
      });
    }
    setIsUserModalOpen(true);
  };

  // Submit User Form
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !userEmail) {
      alert('Veuillez remplir le nom et l\'adresse email.');
      return;
    }

    const userData: UserProfile = {
      id: editingUser ? editingUser.id : `usr-${Date.now()}`,
      name: userName,
      role: userRole,
      title: userTitle || getRoleLabel(userRole),
      facility: userFacility,
      email: userEmail,
      phone: userPhone,
      specialty: userSpecialty,
      avatar: userAvatar.trim() || DEFAULT_AVATAR,
      permissions: userPermissions,
    };

    if (editingUser) {
      if (onUpdateUser) onUpdateUser(userData, userPassword.trim() || undefined);
      alert(`Profil de ${userName} mis à jour avec succès !`);
    } else {
      if (onAddUser) onAddUser(userData, userPassword.trim() || undefined);
      alert(`Acteur ${userName} créé avec succès !`);
    }

    setIsUserModalOpen(false);
  };

  // Delete User
  const handleDeleteUserClick = (user: UserProfile) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'acteur "${user.name}" (${user.title}) ?`)) {
      if (onDeleteUser) onDeleteUser(user.id);
      alert(`Utilisateur ${user.name} supprimé.`);
    }
  };

  // Reset Password (le mot de passe est envoyé au backend qui le hache)
  const handleResetPasswordClick = (user: UserProfile) => {
    const newPassword = window.prompt(
      `Nouveau mot de passe pour "${user.name}" (${user.email}) :\n\n6 caractères minimum.`,
      ''
    );
    if (newPassword === null) return; // annulé
    const trimmed = newPassword.trim();
    if (trimmed.length < 6) {
      alert('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (onUpdateUser) onUpdateUser(user, trimmed);
    alert(`Le mot de passe de ${user.name} a été réinitialisé.`);
  };

  // Open Equipment Modal for Create/Edit
  const handleOpenEqModal = (eq?: Equipment) => {
    if (eq) {
      setEditingEq(eq);
      setEqCode(eq.code);
      setEqName(eq.name);
      setEqCategory(eq.category);
      setEqModel(eq.model);
      setEqBrand(eq.brand);
      setEqSerialNumber(eq.serialNumber);
      setEqFacility(eq.facility);
      setEqDepartment(eq.department);
      setEqStatus(eq.status);
      setEqImageUrl(eq.imageUrl || '');
      setEqNotes(eq.notes || '');
    } else {
      setEditingEq(null);
      setEqCode(`EQ-MED-${Date.now().toString().slice(-4)}`);
      setEqName('');
      setEqCategory('moniteur');
      setEqModel('');
      setEqBrand('');
      setEqSerialNumber('');
      setEqFacility('Hôpital de District de Manakara');
      setEqDepartment('Unité Télémédecine');
      setEqStatus('operational');
      setEqImageUrl('');
      setEqNotes('Enregistré dans le parc biomédical.');
    }
    setIsEqModalOpen(true);
  };

  // Submit Equipment Form
  const handleSaveEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eqName || !eqModel || !eqBrand || !eqSerialNumber) {
      alert('Veuillez remplir tous les champs obligatoires (*).');
      return;
    }

    if (editingEq) {
      const updatedEq: Equipment = {
        ...editingEq,
        code: eqCode,
        name: eqName,
        category: eqCategory,
        model: eqModel,
        brand: eqBrand,
        serialNumber: eqSerialNumber,
        facility: eqFacility,
        department: eqDepartment,
        status: eqStatus,
        imageUrl: eqImageUrl.trim() || undefined,
        notes: eqNotes,
      };
      if (onUpdateEquipment) onUpdateEquipment(updatedEq);
      alert(`Équipement "${eqName}" mis à jour avec succès !`);
    } else {
      const newEq: Equipment = {
        id: `eq-${Date.now()}`,
        code: eqCode,
        name: eqName,
        category: eqCategory,
        model: eqModel,
        brand: eqBrand,
        serialNumber: eqSerialNumber,
        facility: eqFacility,
        department: eqDepartment,
        status: eqStatus,
        imageUrl: eqImageUrl.trim() || undefined,
        installationDate: new Date().toISOString().split('T')[0],
        lastMaintenanceDate: new Date().toISOString().split('T')[0],
        nextPreventiveMaintenance: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
        telemetry: {
          batteryLevel: 100,
          operatingHours: 0,
          temperature: 36.0,
          lastCalibrationDate: new Date().toISOString().split('T')[0],
          calibrationValid: true,
          signalQuality: 100,
          firmwareVersion: 'v1.0.0',
          powerSource: 'AC'
        },
        notes: eqNotes,
      };
      onAddEquipment(newEq);
      alert(`Équipement "${eqName}" ajouté au parc !`);
    }

    setIsEqModalOpen(false);
  };

  // Delete Equipment
  const handleDeleteEqClick = (eq: Equipment) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'équipement "${eq.name}" (${eq.code}) ?`)) {
      if (onDeleteEquipment) onDeleteEquipment(eq.id);
      alert(`Équipement ${eq.code} supprimé du parc.`);
    }
  };

  // Toggle permission directly from Permissions Matrix
  const handleToggleUserPermission = (user: UserProfile, permKey: keyof Required<UserProfile>['permissions']) => {
    const currentPerms = user.permissions || {
      canReportIncident: true,
      canRunDiagnostic: true,
      canCloseIntervention: true,
      canManageEquipment: user.role === 'admin' || user.role === 'engineer',
      canManageUsers: user.role === 'admin',
    };

    const updatedUser: UserProfile = {
      ...user,
      permissions: {
        ...currentPerms,
        [permKey]: !currentPerms[permKey],
      },
    };

    if (onUpdateUser) onUpdateUser(updatedUser);
  };

  // Filters
  const filteredUsers = users.filter((u) => {
    if (userRoleFilter !== 'ALL' && u.role !== userRoleFilter) return false;
    if (userSearch.trim() !== '') {
      const q = userSearch.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.title.toLowerCase().includes(q) ||
        u.facility.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredEquipment = equipmentList.filter((e) => {
    if (eqCategoryFilter !== 'ALL' && e.category !== eqCategoryFilter) return false;
    if (eqSearch.trim() !== '') {
      const q = eqSearch.toLowerCase();
      return (
        e.code.toLowerCase().includes(q) ||
        e.name.toLowerCase().includes(q) ||
        e.model.toLowerCase().includes(q) ||
        e.brand.toLowerCase().includes(q) ||
        e.facility.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Control Navigation Tabs */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-2 shadow-sm flex flex-wrap gap-2">
        {canManageUsers && (
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'users' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Gestion des Acteurs ({users.length})</span>
          </button>
        )}

        {canManageUsers && (
          <button
            onClick={() => setActiveTab('permissions')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'permissions' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Key className="w-4 h-4 text-amber-400" />
            <span>Matrice des Permissions & RBAC</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('equipment')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
            activeTab === 'equipment' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Wrench className="w-4 h-4 text-sky-400" />
          <span>Gestion du Parc Équipements ({equipmentList.length})</span>
        </button>

        {canManageUsers && (
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === 'audit' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>Journaux d'Audit HDS</span>
          </button>
        )}
      </div>

      {/* TAB 1: GESTION DES ACTEURS (LISTE, CREER, MODIFIER, SUPPRIMER) */}
      {activeTab === 'users' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Gestionnaires des Acteurs & Utilisateurs</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">Création, modification et révocation des comptes d'accès biomédicaux</p>
            </div>

            <button
              onClick={() => handleOpenUserModal()}
              className="bg-slate-900 hover:bg-slate-800 text-emerald-400 px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 cursor-pointer transition-all shadow-xs"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span>Créer un Nouvel Acteur</span>
            </button>
          </div>

          {/* Search & Role Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Rechercher par nom, rôle, établissement ou email..."
                className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 text-xs font-medium rounded-xl pl-9 pr-3 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>

            <div className="flex items-center space-x-2 bg-slate-100/90 rounded-xl px-3 py-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 border-none focus:outline-none cursor-pointer"
              >
                <option value="ALL">Tous les Rôles</option>
                <option value="technician">Technicien Biomédical</option>
                <option value="engineer">Ingénieur Biomédical</option>
                <option value="doctor">Médecin / Utilisateur</option>
                <option value="nurse">Infirmier(ère)</option>
                <option value="manager">Responsable Maintenance</option>
                <option value="director">Directeur d'Établissement</option>
                <option value="vendor">Fournisseur Externe</option>
                <option value="admin">Administrateur Système</option>
              </select>
            </div>
          </div>

          {/* User Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredUsers.map((u) => {
              const perms = u.permissions || {
                canReportIncident: true,
                canRunDiagnostic: true,
                canCloseIntervention: true,
                canManageEquipment: u.role === 'admin' || u.role === 'engineer',
                canManageUsers: u.role === 'admin',
              };

              return (
                <div key={u.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex flex-col justify-between space-y-3">
                  <div className="flex items-start space-x-3">
                    <img src={u.avatar} alt={u.name} loading="lazy" decoding="async" className="w-12 h-12 rounded-full object-cover border-2 border-slate-300 shrink-0" />
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <h4 className="font-bold text-slate-900 text-sm truncate">{u.name}</h4>
                        <span className="text-[10px] font-bold bg-slate-900 text-emerald-400 px-2.5 py-0.5 rounded-full shrink-0">
                          {getRoleLabel(u.role)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 font-semibold">{u.title}</p>
                      <p className="text-[11px] text-slate-500 flex items-center space-x-1 truncate">
                        <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{u.facility}</span>
                      </p>
                      <p className="text-[11px] text-slate-500 flex items-center space-x-1 truncate">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{u.email}</span>
                      </p>
                    </div>
                  </div>

                  {/* Active Permissions Chips */}
                  <div className="flex flex-wrap gap-1 pt-2 border-t border-slate-200/80 text-[10px]">
                    {perms.canReportIncident && <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">Signalement</span>}
                    {perms.canRunDiagnostic && <span className="bg-sky-100 text-sky-800 px-2 py-0.5 rounded-md font-bold">Diag Technique</span>}
                    {perms.canCloseIntervention && <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-bold">Rapport PV</span>}
                    {perms.canManageEquipment && <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md font-bold">Parc Matériel</span>}
                    {perms.canManageUsers && <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md font-bold">Gestion Admin</span>}
                  </div>

                  {/* Actions Buttons: Réinitialiser mdp / Modifier / Supprimer */}
                  <div className="flex items-center space-x-2 pt-2 border-t border-slate-200/80">
                    <button
                      onClick={() => handleResetPasswordClick(u)}
                      className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer"
                      title="Réinitialiser le mot de passe de cet utilisateur"
                    >
                      <Key className="w-3.5 h-3.5 text-amber-600" />
                      <span>Réinit. mdp</span>
                    </button>

                    <button
                      onClick={() => handleOpenUserModal(u)}
                      className="flex-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                      <span>Modifier</span>
                    </button>

                    <button
                      onClick={() => handleDeleteUserClick(u)}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 p-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      title="Supprimer cet utilisateur"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: MATRICE DES PERMISSIONS RBAC */}
      {activeTab === 'permissions' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Key className="w-4 h-4 text-amber-600" />
                <span>Matrice des Habilitations & Droits d'Accès Réseau</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">Cochez ou décochez les fonctionnalités autorisées en temps réel par acteur</p>
            </div>
            <span className="text-xs font-mono font-bold bg-amber-50 text-amber-800 px-3 py-1 rounded-full border border-amber-200">
              Contrôle RBAC Dynamique
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-700 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3 font-bold">Acteur / Utilisateur</th>
                  <th className="p-3 font-bold text-center">Signalement Incident</th>
                  <th className="p-3 font-bold text-center">Guide & Diag Technique</th>
                  <th className="p-3 font-bold text-center">Clôture & PV Intervention</th>
                  <th className="p-3 font-bold text-center">Gestion Parc Équipement</th>
                  <th className="p-3 font-bold text-center">Gestion Acteurs Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 text-[11px]">
                {users.map((u) => {
                  const perms = u.permissions || {
                    canReportIncident: true,
                    canRunDiagnostic: true,
                    canCloseIntervention: true,
                    canManageEquipment: u.role === 'admin' || u.role === 'engineer',
                    canManageUsers: u.role === 'admin',
                  };

                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-bold text-slate-900 flex items-center space-x-2">
                        <img src={u.avatar} alt={u.name} loading="lazy" decoding="async" className="w-7 h-7 rounded-full object-cover border border-slate-300 shrink-0" />
                        <div>
                          <div>{u.name}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{getRoleLabel(u.role)} • {u.facility}</div>
                        </div>
                      </td>

                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={perms.canReportIncident ?? true}
                          onChange={() => handleToggleUserPermission(u, 'canReportIncident')}
                          className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>

                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={perms.canRunDiagnostic ?? true}
                          onChange={() => handleToggleUserPermission(u, 'canRunDiagnostic')}
                          className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>

                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={perms.canCloseIntervention ?? true}
                          onChange={() => handleToggleUserPermission(u, 'canCloseIntervention')}
                          className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>

                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={perms.canManageEquipment ?? false}
                          onChange={() => handleToggleUserPermission(u, 'canManageEquipment')}
                          className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>

                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={perms.canManageUsers ?? false}
                          onChange={() => handleToggleUserPermission(u, 'canManageUsers')}
                          className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: GESTION PARC ÉQUIPEMENTS (LISTE, CREER, MODIFIER, SUPPRIMER) */}
      {activeTab === 'equipment' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Wrench className="w-4 h-4 text-sky-600" />
                <span>Gestionnaire du Parc d'Équipements Biomédicaux</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">Ajout, révision des fiches matérielles et suppression d'équipements</p>
            </div>

            <button
              onClick={() => handleOpenEqModal()}
              className="bg-slate-900 hover:bg-slate-800 text-emerald-400 px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 cursor-pointer transition-all shadow-xs"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span>Nouveau Matériel</span>
            </button>
          </div>

          {/* Search & Category Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={eqSearch}
                onChange={(e) => setEqSearch(e.target.value)}
                placeholder="Rechercher par code (EQ-MON-01), nom, modèle, marque, centre..."
                className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 text-xs font-medium rounded-xl pl-9 pr-3 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>

            <div className="flex items-center space-x-2 bg-slate-100/90 rounded-xl px-3 py-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={eqCategoryFilter}
                onChange={(e) => setEqCategoryFilter(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 border-none focus:outline-none cursor-pointer"
              >
                <option value="ALL">Toutes les Catégories</option>
                <option value="moniteur">Moniteur Multiparamétrique</option>
                <option value="ecg">Électrocardiographe (ECG)</option>
                <option value="echographe">Échographe Portable</option>
                <option value="oxymetre">Oxymètre de Pouls</option>
                <option value="pompe">Pompe à Perfusion</option>
                <option value="telesurveillance">Télésurveillance</option>
              </select>
            </div>
          </div>

          {/* Equipment Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-700 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3 font-bold">Code</th>
                  <th className="p-3 font-bold">Nom & Marque</th>
                  <th className="p-3 font-bold">N° Série</th>
                  <th className="p-3 font-bold">Affectation</th>
                  <th className="p-3 font-bold">Statut</th>
                  <th className="p-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 text-[11px]">
                {filteredEquipment.map((eq) => (
                  <tr key={eq.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-900">{eq.code}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{eq.name}</div>
                      <div className="text-[10px] text-slate-500">{eq.brand} • {eq.model}</div>
                    </td>
                    <td className="p-3 font-mono text-slate-600">{eq.serialNumber}</td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-800">{eq.facility}</div>
                      <div className="text-[10px] text-slate-500">{eq.department}</div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        eq.status === 'operational' ? 'bg-emerald-100 text-emerald-800' :
                        eq.status === 'degraded' ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {eq.status === 'operational' ? 'Opérationnel' : eq.status === 'degraded' ? 'Dégradé' : 'Panne'}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1">
                      <button
                        onClick={() => handleOpenEqModal(eq)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 p-1.5 rounded-lg transition-colors cursor-pointer"
                        title="Modifier cet équipement"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteEqClick(eq)}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 p-1.5 rounded-lg transition-colors cursor-pointer"
                        title="Supprimer cet équipement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>Journal d'Audit & Traçabilité Réseau HDS</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">Registre inaltérable de toutes les actions biomédicales et accès de télé-diagnostic</p>
            </div>
            <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-200">
              Conforme ISO 27001 & HDS
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3 font-bold">Horodatage</th>
                  <th className="p-3 font-bold">Acteur</th>
                  <th className="p-3 font-bold">Action Effectuée</th>
                  <th className="p-3 font-bold">Cible / Équipement</th>
                  <th className="p-3 font-bold">Adresse IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 text-slate-500">{new Date(log.timestamp).toLocaleString('fr-FR')}</td>
                    <td className="p-3 font-bold text-slate-900">{log.actor} ({getRoleLabel(log.role)})</td>
                    <td className="p-3 text-emerald-700 font-bold">{log.action}</td>
                    <td className="p-3 text-slate-800 font-medium">{log.target}</td>
                    <td className="p-3 text-slate-500">{log.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL USER CREATE / EDIT */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {editingUser ? `Modifier l'Acteur: ${editingUser.name}` : 'Créer un Nouvel Acteur Biomédical'}
              </h3>
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3.5 text-xs font-medium text-slate-700">
              <div>
                <label className="font-bold text-slate-900 block mb-1">Nom Complet *</label>
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Ex: Dr. Raveloson Jean"
                  className="w-full bg-slate-50 hover:bg-slate-100/60 text-slate-900 border border-slate-300/80 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 focus:bg-white transition-all shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-900 block mb-1">Rôle Système *</label>
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value as UserRole)}
                    className="w-full bg-slate-50 hover:bg-slate-100/60 text-slate-900 border-none rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:bg-white transition-all shadow-2xs cursor-pointer font-semibold"
                  >
                    <option value="technician">Technicien Biomédical</option>
                    <option value="engineer">Ingénieur Biomédical</option>
                    <option value="doctor">Médecin / Utilisateur</option>
                    <option value="nurse">Infirmier(ère)</option>
                    <option value="manager">Responsable Maintenance</option>
                    <option value="director">Directeur d'Établissement</option>
                    <option value="vendor">Fournisseur Externe</option>
                    <option value="admin">Administrateur Système</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-900 block mb-1">Titre / Intitulé Poste</label>
                  <input
                    type="text"
                    value={userTitle}
                    onChange={(e) => setUserTitle(e.target.value)}
                    placeholder="Ex: Responsable Télémédecine"
                    className="w-full bg-slate-50 hover:bg-slate-100/60 text-slate-900 border border-slate-300/80 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 focus:bg-white transition-all shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-900 block mb-1">Établissement d'Affectation</label>
                <input
                  type="text"
                  value={userFacility}
                  onChange={(e) => setUserFacility(e.target.value)}
                  className="w-full bg-slate-50 hover:bg-slate-100/60 text-slate-900 border border-slate-300/80 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 focus:bg-white transition-all shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-900 block mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-slate-100/60 text-slate-900 border border-slate-300/80 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 focus:bg-white transition-all shadow-2xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-900 block mb-1">Téléphone Direct</label>
                  <input
                    type="text"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-slate-100/60 text-slate-900 border border-slate-300/80 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 focus:bg-white transition-all shadow-2xs"
                  />
                </div>
              </div>

              {/* Mot de passe (l'acteur est aussi un utilisateur de la plateforme) */}
              <div>
                <label className="font-bold text-slate-900 block mb-1">
                  Mot de Passe {editingUser ? '(facultatif)' : ''}
                </label>
                <input
                  type="password"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  minLength={6}
                  placeholder={editingUser ? 'Laisser vide pour conserver le mot de passe actuel' : 'Défaut : biomed123 (6 caractères min.)'}
                  className="w-full bg-slate-50 hover:bg-slate-100/60 text-slate-900 border border-slate-300/80 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 focus:bg-white transition-all shadow-2xs"
                />
                <p className="text-[10px] text-slate-400 font-medium mt-1">
                  {editingUser
                    ? 'Laissez vide pour ne pas modifier le mot de passe.'
                    : 'Ce mot de passe permettra à cet acteur de se connecter à la plateforme.'}
                </p>
              </div>

              {/* Photo / Avatar de l'acteur */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-3">
                <label className="font-bold text-slate-900 block text-xs">Photo / Avatar de l'Acteur</label>
                <div className="flex items-center space-x-3">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-200 border-2 border-slate-300 shrink-0 flex items-center justify-center">
                    {userAvatar.trim() ? (
                      <img
                        src={userAvatar.trim()}
                        alt="Aperçu avatar"
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <Image className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="font-bold text-slate-900 block text-[11px]">URL de l'image (photo de profil)</label>
                    <input
                      type="url"
                      value={userAvatar}
                      onChange={(e) => setUserAvatar(e.target.value)}
                      placeholder="https://.../photo.jpg"
                      className="w-full bg-white text-slate-900 placeholder-slate-400 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition-all"
                    />
                    <div className="flex items-center space-x-2">
                      <ImageUploadButton
                        onImage={(dataUrl) => setUserAvatar(dataUrl)}
                        maxDim={320}
                        label="Importer depuis l'ordinateur"
                      />
                      <span className="text-[10px] text-slate-400 font-medium">PNG / JPG — redimensionnée automatiquement</span>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1.5">Ou choisir parmi les avatars</p>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                    {PRESET_AVATARS.map((url) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => setUserAvatar(url)}
                        title="Utiliser cet avatar"
                        className={`relative w-9 h-9 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                          userAvatar === url
                            ? 'border-emerald-600 ring-2 ring-emerald-500/40'
                            : 'border-slate-300 hover:border-slate-400'
                        }`}
                      >
                        <img src={url} alt="Avatar" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                        {userAvatar === url && (
                          <span className="absolute inset-0 bg-emerald-600/30 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Permissions Checkboxes */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2">
                <label className="font-bold text-slate-900 block text-xs">Droits et Permissions Accordés</label>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={userPermissions.canReportIncident}
                      onChange={(e) => setUserPermissions({ ...userPermissions, canReportIncident: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Signalement Incident</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={userPermissions.canRunDiagnostic}
                      onChange={(e) => setUserPermissions({ ...userPermissions, canRunDiagnostic: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Guide & Diag Technique</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={userPermissions.canCloseIntervention}
                      onChange={(e) => setUserPermissions({ ...userPermissions, canCloseIntervention: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Clôture Intervention</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={userPermissions.canManageEquipment}
                      onChange={(e) => setUserPermissions({ ...userPermissions, canManageEquipment: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Gestion Parc Matériel</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer col-span-2">
                    <input
                      type="checkbox"
                      checked={userPermissions.canManageUsers}
                      onChange={(e) => setUserPermissions({ ...userPermissions, canManageUsers: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Administration Acteurs & Système</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-emerald-400 px-5 py-2 rounded-xl font-bold transition-all shadow-xs flex items-center space-x-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingUser ? 'Enregistrer Modifications' : 'Créer l\'Acteur'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EQUIPMENT CREATE / EDIT */}
      {isEqModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {editingEq ? `Modifier Équipement: ${editingEq.code}` : 'Enregistrer un Nouvel Équipement'}
              </h3>
              <button
                onClick={() => setIsEqModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEquipment} className="space-y-3.5 text-xs font-medium text-slate-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-900 block mb-1">Code Interne *</label>
                  <input
                    type="text"
                    required
                    value={eqCode}
                    onChange={(e) => setEqCode(e.target.value)}
                    className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl p-2.5 font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-900 block mb-1">Catégorie *</label>
                  <select
                    value={eqCategory}
                    onChange={(e) => setEqCategory(e.target.value as EquipmentCategory)}
                    className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                  >
                    <option value="moniteur">Moniteur Multiparamétrique</option>
                    <option value="ecg">Électrocardiographe (ECG)</option>
                    <option value="echographe">Échographe Portable</option>
                    <option value="oxymetre">Oxymètre de Pouls</option>
                    <option value="pompe">Pompe à Perfusion</option>
                    <option value="telesurveillance">Télésurveillance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-900 block mb-1">Désignation de l'Appareil *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Échographe Portable Ultra-Léger Vscan..."
                  value={eqName}
                  onChange={(e) => setEqName(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-900 block mb-1">Marque *</label>
                  <input
                    type="text"
                    required
                    placeholder="Philips, GE..."
                    value={eqBrand}
                    onChange={(e) => setEqBrand(e.target.value)}
                    className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-900 block mb-1">Modèle *</label>
                  <input
                    type="text"
                    required
                    placeholder="Vscan Extend..."
                    value={eqModel}
                    onChange={(e) => setEqModel(e.target.value)}
                    className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-900 block mb-1">Numéro Série *</label>
                  <input
                    type="text"
                    required
                    placeholder="SN-9988-77"
                    value={eqSerialNumber}
                    onChange={(e) => setEqSerialNumber(e.target.value)}
                    className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl p-2.5 font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-900 block mb-1">Établissement</label>
                  <input
                    type="text"
                    value={eqFacility}
                    onChange={(e) => setEqFacility(e.target.value)}
                    className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-900 block mb-1">Service / Unité</label>
                  <input
                    type="text"
                    value={eqDepartment}
                    onChange={(e) => setEqDepartment(e.target.value)}
                    className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-900 block mb-1">Statut Initial / Actuel</label>
                <select
                  value={eqStatus}
                  onChange={(e) => setEqStatus(e.target.value as EquipmentStatus)}
                  className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl p-2.5 focus:outline-none font-bold"
                >
                  <option value="operational">Opérationnel (Nominal)</option>
                  <option value="degraded">Performance Dégradée</option>
                  <option value="breakdown">En Panne</option>
                  <option value="in_maintenance">En Maintenance Preventive</option>
                  <option value="critical">CRITIQUE (Arrêt Réseau)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-900 block mb-1">
                  <span className="flex items-center space-x-1.5">
                    <Image className="w-3.5 h-3.5 text-slate-500" />
                    <span>Photo / Image de l'Équipement</span>
                  </span>
                </label>
                <div className="flex items-center space-x-3">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0">
                    {eqImageUrl.trim() ? (
                      <img
                        src={eqImageUrl.trim()}
                        alt="Aperçu équipement"
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }}
                      />
                    ) : (
                      <Image className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="url"
                      placeholder="https://… (photo de l'appareil)"
                      value={eqImageUrl}
                      onChange={(e) => setEqImageUrl(e.target.value)}
                      className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                    />
                    <div className="flex items-center space-x-2">
                      <ImageUploadButton
                        onImage={(dataUrl) => setEqImageUrl(dataUrl)}
                        maxDim={480}
                        label="Importer depuis l'ordinateur"
                      />
                      <span className="text-[10px] text-slate-400 font-medium">PNG / JPG — redimensionnée automatiquement</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1.5 mt-2">
                  <span className="text-[10px] font-semibold text-slate-500 mr-1">Suggestions :</span>
                  {PRESET_EQUIPMENT_IMAGES.map((img) => (
                    <button
                      key={img}
                      type="button"
                      onClick={() => setEqImageUrl(img)}
                      className={`w-8 h-8 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                        eqImageUrl === img ? 'border-emerald-500 ring-2 ring-emerald-500/30' : 'border-slate-200 hover:border-slate-300'
                      }`}
                      title="Utiliser cette photo"
                    >
                      <img src={img} alt="Photo suggérée" className="w-full h-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-900 block mb-1">Notes Complémentaires</label>
                <textarea
                  rows={2}
                  value={eqNotes}
                  onChange={(e) => setEqNotes(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEqModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-emerald-400 px-5 py-2 rounded-xl font-bold transition-all shadow-xs flex items-center space-x-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingEq ? 'Enregistrer Modifications' : 'Enregistrer Matériel'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
