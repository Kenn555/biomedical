import React, { useState } from 'react';
import { UserProfile, Equipment } from '../types';
import {
  X,
  Send,
  Loader2,
  BookOpen,
  Wrench,
  HelpCircle
} from 'lucide-react';

interface AiAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  selectedEquipment?: Equipment | null;
}

interface ChatMsg {
  id: string;
  sender: 'user' | 'ai';
  text: string;
}

export const AiAssistantDrawer: React.FC<AiAssistantDrawerProps> = ({
  isOpen,
  onClose,
  currentUser,
  selectedEquipment,
}) => {
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: '1',
      sender: 'ai',
      text: `Bonjour ${currentUser.name} ! Je suis l'Assistant Technique BioMed, votre guide interactif pour la maintenance et le dépannage des équipements biomédicaux. Comment puis-je vous aider ?`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: ChatMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: input.trim()
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/assistant-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ text: m.text, role: m.sender })),
          userRole: currentUser.role,
          equipmentContext: selectedEquipment
            ? {
                name: selectedEquipment.name,
                model: selectedEquipment.model,
                status: selectedEquipment.status,
                telemetry: selectedEquipment.telemetry,
              }
            : null,
        }),
      });

      const data = await res.json();
      if (data.success && data.reply) {
        setMessages([
          ...newMessages,
          { id: (Date.now() + 1).toString(), sender: 'ai', text: data.reply }
        ]);
      } else {
        setMessages([
          ...newMessages,
          { id: (Date.now() + 1).toString(), sender: 'ai', text: 'Désolé, une erreur est survenue lors de la consultation du guide technique.' }
        ]);
      }
    } catch (err) {
      setMessages([
        ...newMessages,
        { id: (Date.now() + 1).toString(), sender: 'ai', text: 'Erreur réseau lors de la communication avec le serveur.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (promptText: string) => {
    setInput(promptText);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="bg-white border-l border-slate-200 w-full max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-emerald-400 shadow-xs font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Assistant Support BioMed</h3>
              <p className="text-[10px] text-slate-500 font-medium">
                Guide Technique & Base Connaissances • Profil : {currentUser.role}
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

        {/* Selected Equipment Banner Context */}
        {selectedEquipment && (
          <div className="bg-slate-100/80 px-4 py-2 border-b border-slate-200 text-[11px] flex items-center justify-between shrink-0 font-medium">
            <span className="text-slate-600">Contexte Équipement:</span>
            <span className="font-bold text-emerald-700 font-mono">{selectedEquipment.code} ({selectedEquipment.model})</span>
          </div>
        )}

        {/* Quick Prompts Suggestions */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center space-x-2 overflow-x-auto no-scrollbar shrink-0 text-[10px]">
          <button
            onClick={() => handleQuickPrompt('Comment résoudre un code d\'erreur ERR-ECG-04 sur un ECG 12 pistes ?')}
            className="bg-white hover:bg-slate-100 text-slate-700 font-medium border border-slate-200 px-2.5 py-1 rounded-lg whitespace-nowrap cursor-pointer transition-colors shadow-2xs"
          >
            💡 Code ERR-ECG-04
          </button>
          <button
            onClick={() => handleQuickPrompt('Quelles sont les normes de test de sécurité électrique NF EN 60601-1 ?')}
            className="bg-white hover:bg-slate-100 text-slate-700 font-medium border border-slate-200 px-2.5 py-1 rounded-lg whitespace-nowrap cursor-pointer transition-colors shadow-2xs"
          >
            ⚡ Sécurité 60601-1
          </button>
          <button
            onClick={() => handleQuickPrompt('Procédure de purge et déblocage occlusion sur pompe à perfusion ?')}
            className="bg-white hover:bg-slate-100 text-slate-700 font-medium border border-slate-200 px-2.5 py-1 rounded-lg whitespace-nowrap cursor-pointer transition-colors shadow-2xs"
          >
            🩺 Occlusion Pompe
          </button>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <div
                key={m.id}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`p-3 rounded-2xl max-w-[85%] space-y-1 ${
                    isUser
                      ? 'bg-slate-900 text-white rounded-br-none font-medium'
                      : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-bl-none font-medium'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl text-slate-600 text-xs flex items-center space-x-2 font-medium">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                <span>Recherche dans la base technique...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Footer */}
        <form onSubmit={handleSend} className="p-3 bg-slate-50 border-t border-slate-200 flex items-center space-x-2 shrink-0">
          <input
            type="text"
            placeholder="Posez une question technique biomédicale..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-white text-slate-900 placeholder-slate-400 text-xs font-medium rounded-xl px-3.5 py-2.5 border border-slate-300/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition-all shadow-2xs"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-emerald-400 p-2.5 rounded-xl cursor-pointer transition-colors shadow-2xs shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
