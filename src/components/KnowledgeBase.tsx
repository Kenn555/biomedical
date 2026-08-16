import React, { useState } from 'react';
import { KnowledgeArticle, EquipmentCategory } from '../types';
import {
  BookOpen,
  Search,
  Filter,
  Download,
  PlusCircle,
  Tag,
  UserCheck,
  FileText,
  CheckCircle,
  Sparkles,
  X
} from 'lucide-react';
import { getCategoryLabel } from './EquipmentCard';

interface KnowledgeBaseProps {
  articles: KnowledgeArticle[];
  onAddArticle: (article: KnowledgeArticle) => void;
  /** true si l'utilisateur peut rédiger des fiches (admin / ingénieur) */
  canWrite?: boolean;
}

export const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ articles, onAddArticle, canWrite = false }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Article Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<EquipmentCategory>('ecg');
  const [modelTarget, setModelTarget] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [summary, setSummary] = useState('');
  const [stepInput, setStepInput] = useState('');
  const [solutionSteps, setSolutionSteps] = useState<string[]>([]);
  const [tagsInput, setTagsInput] = useState('');

  const filteredArticles = articles.filter((art) => {
    if (selectedCategory !== 'ALL' && art.category !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        art.title.toLowerCase().includes(q) ||
        art.summary.toLowerCase().includes(q) ||
        art.modelTarget.toLowerCase().includes(q) ||
        (art.errorCode && art.errorCode.toLowerCase().includes(q)) ||
        art.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleAddStep = () => {
    if (!stepInput.trim()) return;
    setSolutionSteps([...solutionSteps, stepInput.trim()]);
    setStepInput('');
  };

  const handleCreateArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !modelTarget || solutionSteps.length === 0) {
      alert('Veuillez renseigner le titre, le modèle et au moins une étape de solution.');
      return;
    }

    const newArt: KnowledgeArticle = {
      id: `kb-${Date.now()}`,
      title,
      category,
      modelTarget,
      errorCode: errorCode || undefined,
      summary,
      solutionSteps,
      author: 'Technicien Biomédical',
      date: new Date().toISOString().split('T')[0],
      downloadsCount: 1,
      tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
    };

    onAddArticle(newArt);
    setIsAddModalOpen(false);
    // Reset
    setTitle('');
    setModelTarget('');
    setErrorCode('');
    setSummary('');
    setSolutionSteps([]);
    setTagsInput('');
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Header */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par code erreur (ex: ERR-ECG-04), modèle, mot-clé ou tag..."
            className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 text-xs font-medium rounded-xl pl-9 pr-3 py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1.5 bg-slate-100/90 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold border-none focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-white">Toutes Catégories</option>
              <option value="ecg" className="bg-white">Électrocardiographes (ECG)</option>
              <option value="pompe" className="bg-white">Pompes à Perfusion</option>
              <option value="echographe" className="bg-white">Échographes Portables</option>
              <option value="moniteur" className="bg-white">Moniteurs Multiparamétriques</option>
              <option value="oxymetre" className="bg-white">Oxymètres de Pouls</option>
            </select>
          </div>

          {canWrite && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>Rédiger une Fiche Technique</span>
            </button>
          )}
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredArticles.map((art) => (
          <div
            key={art.id}
            className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4 shadow-sm"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] uppercase font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    {getCategoryLabel(art.category)}
                  </span>
                  {art.errorCode && (
                    <span className="font-mono text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-lg">
                      {art.errorCode}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-1 text-[10px] text-slate-500 font-semibold bg-slate-100 px-2.5 py-0.5 rounded-full">
                  <Download className="w-3 h-3 text-slate-500" />
                  <span>{art.downloadsCount} téléch.</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 hover:text-emerald-600 transition-colors">
                  {art.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Modèle cible: <span className="text-slate-800 font-semibold">{art.modelTarget}</span> • Par {art.author} ({art.date})
                </p>
              </div>

              <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/80 leading-relaxed font-medium">
                {art.summary}
              </p>

              {/* Solution Steps SOP */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                  Procédures Opérationnelles de Résolution :
                </p>
                <ol className="space-y-1 text-xs text-slate-700 list-decimal list-inside bg-slate-50 p-3 rounded-xl border border-slate-200/80 font-medium">
                  {art.solutionSteps.map((step, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {art.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200 flex items-center space-x-1"
                  >
                    <Tag className="w-2.5 h-2.5 text-slate-400" />
                    <span>{t}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-semibold">Document Certifié Télémédecine</span>
              <button
                onClick={() => alert(`Téléchargement de la fiche technique : ${art.title}.pdf`)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 cursor-pointer transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Télécharger Fiche PDF</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Technical Article Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-start sm:items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden my-8">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>Rédiger une Fiche Technique Collaborative</span>
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-800 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateArticle} className="p-6 space-y-4 text-xs text-slate-700 max-h-[75vh] overflow-y-auto font-medium">
              <div className="space-y-1">
                <label className="font-bold text-slate-900 block">Titre du Guide / Fiche Technique</label>
                <input
                  type="text"
                  placeholder="Ex: Élimination des Bruits Parasites sur ECG CardioExpress..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-900 block">Catégorie</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as EquipmentCategory)}
                    className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none"
                  >
                    <option value="ecg">ECG</option>
                    <option value="pompe">Pompe à perfusion</option>
                    <option value="echographe">Échographe</option>
                    <option value="moniteur">Moniteur</option>
                    <option value="oxymetre">Oxymètre</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-900 block">Modèle Cible</label>
                  <input
                    type="text"
                    placeholder="Ex: CardioExpress SL12"
                    value={modelTarget}
                    onChange={(e) => setModelTarget(e.target.value)}
                    className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-900 block">Code Erreur Associé</label>
                  <input
                    type="text"
                    placeholder="Ex: ERR-ECG-04"
                    value={errorCode}
                    onChange={(e) => setErrorCode(e.target.value)}
                    className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-xs font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-900 block">Résumé de la Problématique</label>
                <textarea
                  rows={2}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Bref contexte sur le problème technique résolu..."
                  className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none"
                />
              </div>

              {/* Steps */}
              <div className="space-y-2">
                <label className="font-bold text-slate-900 block">Procédures Pas-à-Pas (SOP)</label>
                {solutionSteps.map((s, idx) => (
                  <div key={idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-800">
                    {idx + 1}. {s}
                  </div>
                ))}
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Saisir une étape de résolution..."
                    value={stepInput}
                    onChange={(e) => setStepInput(e.target.value)}
                    className="flex-1 bg-slate-50 text-slate-800 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddStep}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-xl font-bold cursor-pointer"
                  >
                    + Étape
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-900 block">Mots-Clés / Tags (séparés par des virgules)</label>
                <input
                  type="text"
                  placeholder="ECG, Terre, Parasites, Télé-Cardiologie"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-emerald-400 px-5 py-2 rounded-xl text-xs font-bold cursor-pointer shadow-xs"
                >
                  Publier la Fiche
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
