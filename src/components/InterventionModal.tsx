import React, { useState } from 'react';
import { IncidentTicket, InterventionReport, UserProfile } from '../types';
import {
  X,
  FileCheck,
  CheckSquare,
  ShieldCheck,
  DollarSign,
  Plus,
  Trash2,
  CheckCircle2,
  UserCheck
} from 'lucide-react';

interface InterventionModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: IncidentTicket | null;
  currentUser: UserProfile;
  onSaveReport: (report: Partial<InterventionReport>) => void;
}

export const InterventionModal: React.FC<InterventionModalProps> = ({
  isOpen,
  onClose,
  ticket,
  currentUser,
  onSaveReport,
}) => {
  const [problemFound, setProblemFound] = useState<string>(
    ticket?.description || 'Dysfonctionnement identifié lors du télé-diagnostic.'
  );
  const [actionsPerformed, setActionsPerformed] = useState<string[]>([
    'Vérification de la sécurité électrique (Courant de fuite & Masse)',
    'Contrôle de l\'intégrité physique du câble et des capteurs',
    'Mise à jour du microprogramme (Firmware)',
    'Test de fonctionnement complet et simulation de constantes'
  ]);
  const [newActionInput, setNewActionInput] = useState<string>('');

  const [replacedParts, setReplacedParts] = useState<{
    partName: string;
    partCode: string;
    quantity: number;
    unitPrice: number;
  }[]>([]);

  const [partName, setPartName] = useState('');
  const [partCode, setPartCode] = useState('');
  const [partQty, setPartQty] = useState(1);
  const [partPrice, setPartPrice] = useState(0);

  const [electricalSafetyTestPassed, setElectricalSafetyTestPassed] = useState<boolean>(true);
  const [calibrationPerformed, setCalibrationPerformed] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('Équipement re-testé et déclaré apte au service en télémédecine.');
  const [signedByTechnician, setSignedByTechnician] = useState<boolean>(true);
  const [validatedByEngineer, setValidatedByEngineer] = useState<boolean>(currentUser.role === 'engineer');

  if (!isOpen || !ticket) return null;

  const handleAddAction = () => {
    if (!newActionInput.trim()) return;
    setActionsPerformed([...actionsPerformed, newActionInput.trim()]);
    setNewActionInput('');
  };

  const handleRemoveAction = (index: number) => {
    setActionsPerformed(actionsPerformed.filter((_, i) => i !== index));
  };

  const handleAddPart = () => {
    if (!partName.trim()) return;
    setReplacedParts([
      ...replacedParts,
      {
        partName: partName.trim(),
        partCode: partCode.trim() || 'PRT-GEN-01',
        quantity: partQty,
        unitPrice: partPrice,
      },
    ]);
    setPartName('');
    setPartCode('');
    setPartQty(1);
    setPartPrice(0);
  };

  const handleRemovePart = (index: number) => {
    setReplacedParts(replacedParts.filter((_, i) => i !== index));
  };

  const totalPartsCost = replacedParts.reduce((acc, p) => acc + p.quantity * p.unitPrice, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSaveReport({
      ticketId: ticket.id,
      equipmentId: ticket.equipmentId,
      technicianName: currentUser.name,
      engineerName: validatedByEngineer ? 'Dr. Bakoly Rakoto (Ingénieure)' : undefined,
      startDate: ticket.reportedAt,
      endDate: new Date().toISOString(),
      problemFound,
      actionsPerformed,
      replacedParts,
      electricalSafetyTestPassed,
      calibrationPerformed,
      finalStatus: 'operational',
      notes,
      signedByTechnician,
      validatedByEngineer,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
              <FileCheck className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Rapport d'Intervention Biomédicale</h2>
              <p className="text-xs text-slate-500 font-medium">
                Procès-verbal officiel de clôture de maintenance pour {ticket.equipmentName} ({ticket.code})
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
          {/* Problem Found */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-900 flex items-center justify-between text-xs">
              <span>Diagnostic Définitif / Problème Constaté <span className="text-rose-600 font-bold">*</span></span>
              <span className="text-[10px] text-slate-400 font-normal">Cause racine validée</span>
            </label>
            <textarea
              rows={2.5}
              value={problemFound}
              onChange={(e) => setProblemFound(e.target.value)}
              className="w-full bg-slate-50 hover:bg-slate-100/60 text-slate-900 border border-slate-300/80 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 focus:bg-white transition-all font-medium leading-relaxed shadow-2xs"
            />
          </div>

          {/* Actions Performed Checklist */}
          <div className="space-y-2">
            <label className="font-bold text-slate-900 flex items-center justify-between text-xs">
              <span>Actes Techniques & Contrôles Effectués</span>
              <span className="text-[10px] text-slate-400 font-normal">{actionsPerformed.length} étape(s) renseignée(s)</span>
            </label>
            <div className="space-y-1.5">
              {actionsPerformed.map((act, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-50 hover:bg-slate-100/80 p-2.5 rounded-xl border border-slate-200/80 transition-colors">
                  <span className="flex items-center space-x-2">
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="text-slate-800 font-medium">{act}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAction(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                    title="Supprimer cette étape"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="text"
                placeholder="Ajouter une action technique réalisée..."
                value={newActionInput}
                onChange={(e) => setNewActionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddAction();
                  }
                }}
                className="flex-1 bg-slate-50 hover:bg-slate-100/60 text-slate-900 border border-slate-300/80 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 focus:bg-white transition-all font-medium shadow-2xs"
              />
              <button
                type="button"
                onClick={handleAddAction}
                className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl font-bold cursor-pointer flex items-center space-x-1 shadow-2xs transition-colors"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Ajouter</span>
              </button>
            </div>
          </div>

          {/* Replaced Parts Section */}
          <div className="space-y-2.5 bg-slate-50 p-4 rounded-xl border border-slate-200/90 shadow-2xs">
            <label className="font-bold text-slate-900 block flex items-center justify-between text-xs">
              <span>Pièces Detachées & Consommables Utilisés</span>
              <span className="text-emerald-700 font-mono font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Coût total: {totalPartsCost} €
              </span>
            </label>

            {replacedParts.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {replacedParts.map((part, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                    <div>
                      <p className="font-bold text-slate-900">{part.partName}</p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        Réf: <span className="font-mono text-slate-700">{part.partCode}</span> • Qté: {part.quantity} • Prix unitaire: {part.unitPrice} €
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePart(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <input
                type="text"
                placeholder="Nom pièce..."
                value={partName}
                onChange={(e) => setPartName(e.target.value)}
                className="bg-white text-slate-900 placeholder-slate-400 border border-slate-300/80 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition-all shadow-2xs"
              />
              <input
                type="text"
                placeholder="Réf. Code..."
                value={partCode}
                onChange={(e) => setPartCode(e.target.value)}
                className="bg-white text-slate-900 placeholder-slate-400 border border-slate-300/80 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition-all shadow-2xs font-mono"
              />
              <input
                type="number"
                min={1}
                value={partQty}
                onChange={(e) => setPartQty(parseInt(e.target.value) || 1)}
                className="bg-white text-slate-900 border border-slate-300/80 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition-all shadow-2xs"
              />
              <button
                type="button"
                onClick={handleAddPart}
                className="bg-slate-900 hover:bg-slate-800 text-emerald-400 rounded-xl px-3 py-2 font-bold cursor-pointer transition-colors shadow-2xs flex items-center justify-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Consommer</span>
              </button>
            </div>
          </div>

          {/* Safety & Calibration Checkboxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center space-x-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80 cursor-pointer">
              <input
                type="checkbox"
                checked={electricalSafetyTestPassed}
                onChange={(e) => setElectricalSafetyTestPassed(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <span className="font-bold text-slate-900 block">Test de Sécurité Électrique Reçu</span>
                <span className="text-[10px] text-slate-500 font-medium">Courant de fuite & résistance terre conformes</span>
              </div>
            </label>

            <label className="flex items-center space-x-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80 cursor-pointer">
              <input
                type="checkbox"
                checked={calibrationPerformed}
                onChange={(e) => setCalibrationPerformed(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <span className="font-bold text-slate-900 block">Calibrage Zéro / Zéro Pression Effectué</span>
                <span className="text-[10px] text-slate-500 font-medium">Certificat de calibrage renouvelé</span>
              </div>
            </label>
          </div>

          {/* Final Validation & Signatures */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <h4 className="font-bold text-slate-900 text-xs">Signatures Numériques & Recommandation finale</h4>

            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={signedByTechnician}
                onChange={(e) => setSignedByTechnician(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-emerald-600"
              />
              <span className="text-slate-700 font-medium">
                Signature Numérique Technicien : <strong className="text-slate-900 font-bold">{currentUser.name}</strong>
              </span>
            </label>

            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={validatedByEngineer}
                onChange={(e) => setValidatedByEngineer(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-emerald-600"
              />
              <span className="text-slate-700 font-medium">
                Validation Technique par l'Ingénieur Biomédical Référent
              </span>
            </label>
          </div>

          {/* Submit buttons */}
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
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Valider & Clôturer l'Intervention</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
