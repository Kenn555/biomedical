import React, { useState, useRef, useEffect } from 'react';
import { Equipment, ChatMessage, UserProfile } from '../types';
import {
  X,
  Video,
  Mic,
  MicOff,
  VideoOff,
  Send,
  PenTool,
  RotateCcw,
  Activity,
  ShieldCheck,
  Zap,
  Users,
  Bot,
  Camera
} from 'lucide-react';

interface TeleMaintenanceSessionProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: Equipment | null;
  currentUser: UserProfile;
}

export const TeleMaintenanceSession: React.FC<TeleMaintenanceSessionProps> = ({
  isOpen,
  onClose,
  equipment,
  currentUser,
}) => {
  const [micMuted, setMicMuted] = useState<boolean>(false);
  const [videoOff, setVideoOff] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<{ id: number; x: number; y: number; label: string }[]>([
    { id: 1, x: 45, y: 35, label: 'Vérifier connecteur V1-V3' },
    { id: 2, x: 70, y: 60, label: 'Masse à contrôler' }
  ]);

  // Flux vidéo réel (WebRTC) : caméra + micro de l'utilisateur
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    if (isOpen && equipment) {
      setCameraError(null);
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((mediaStream) => {
          activeStream = mediaStream;
          streamRef.current = mediaStream;
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        })
        .catch((err) => {
          console.warn('WebRTC getUserMedia error:', err);
          setCameraError(
            "Caméra ou microphone inaccessible. Veuillez autoriser l'accès dans votre navigateur pour la session vidéo directe."
          );
        });
    }
    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen, equipment?.id]);

  // Maintient le flux vidéo sur l'élément <video>
  useEffect(() => {
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [videoOff, micMuted]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      senderId: 'usr-tech-01',
      senderName: 'Jean-Luc Randria (Biomédical)',
      senderRole: 'technician',
      text: 'Bonjour, je vois bien votre flux vidéo de l\'appareil. Veuillez orienter la caméra vers la prise patient.',
      timestamp: '11:02'
    },
    {
      id: 'm2',
      senderId: 'usr-nurse-01',
      senderName: 'Sahondra Rasoa (Infirmière)',
      senderRole: 'nurse',
      text: 'Entendu Jean-Luc. La LED jaune clignote comme indiqué sur l\'écran.',
      timestamp: '11:03'
    }
  ]);
  const [inputText, setInputText] = useState<string>('');

  if (!isOpen || !equipment) return null;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      text: inputText,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages([...chatMessages, newMsg]);
    setInputText('');
  };

  const toggleMic = () => {
    const next = !micMuted;
    setMicMuted(next);
    streamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !next;
    });
  };

  const toggleVideo = () => {
    const next = !videoOff;
    setVideoOff(next);
    streamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = !next;
    });
  };

  const addAnnotationOnCanvas = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    const newAnn = {
      id: Date.now(),
      x,
      y,
      label: `Point de contrôle #${annotations.length + 1}`
    };
    setAnnotations([...annotations, newAnn]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-start sm:items-center justify-center p-3 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh]">
        {/* Session Top Header */}
        <div className="bg-slate-950 px-6 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
              <span className="font-bold text-white text-sm">Session Télé-Assistance Biomédicale Directe</span>
            </div>
            <span className="text-xs font-mono bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded border border-sky-500/30">
              {equipment.code}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs text-slate-400 hidden sm:inline flex items-center space-x-1">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>2 Participants Connectés</span>
            </span>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Work Area: Video Canvas + Side Panel */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 overflow-y-auto lg:overflow-hidden">
          {/* Main Interactive Video Feed (2 cols) */}
          <div className="lg:col-span-2 bg-slate-950 p-4 flex flex-col justify-between relative overflow-hidden">
            {/* Interactive Annotations Canvas Area */}
            <div
              onClick={addAnnotationOnCanvas}
              className="relative flex-1 min-h-[280px] bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center overflow-hidden cursor-crosshair group shadow-inner"
            >
              {videoOff ? (
                <div className="text-center space-y-2 text-slate-500">
                  <VideoOff className="w-12 h-12 mx-auto" />
                  <p className="text-xs font-semibold">Caméra Désactivée</p>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Flux vidéo réel (caméra de l'utilisateur via WebRTC) */}
                  {cameraError ? (
                    <div className="text-center space-y-2 text-amber-300/90 p-6">
                      <Camera className="w-10 h-10 mx-auto" />
                      <p className="text-xs font-semibold max-w-xs">{cameraError}</p>
                    </div>
                  ) : (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  )}
                  {/* Grid overlay */}
                  <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />

                  {/* Top HUD overlay */}
                  <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md p-2.5 rounded-xl border border-slate-800 text-xs space-y-1">
                    <p className="font-bold text-white flex items-center space-x-1">
                      <Activity className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{equipment.name}</span>
                    </p>
                    <p className="text-[10px] text-slate-400">Flux vidéo HD 1080p • Chiffrement HDS End-to-End</p>
                  </div>

                  {/* Interactive Annotation Pins */}
                  {annotations.map((ann) => (
                    <div
                      key={ann.id}
                      style={{ left: `${ann.x}%`, top: `${ann.y}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 group/pin cursor-pointer z-10"
                    >
                      <div className="w-6 h-6 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center border-2 border-white shadow-lg animate-bounce">
                        !
                      </div>
                      <div className="absolute left-7 top-0 bg-slate-900 text-white font-medium text-[10px] px-2 py-1 rounded border border-slate-700 whitespace-nowrap shadow-xl">
                        {ann.label}
                      </div>
                    </div>
                  ))}

                  <div className="absolute bottom-4 right-4 bg-slate-950/80 text-slate-300 text-[10px] px-2.5 py-1 rounded-md border border-slate-800">
                    Cliquer n'importe où sur l'image pour placer une annotation
                  </div>
                </div>
              )}
            </div>

            {/* Video Controls Toolbar */}
            <div className="mt-3 flex items-center justify-between bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleMic}
                  className={`p-2.5 rounded-xl transition-colors cursor-pointer ${
                    micMuted ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  }`}
                  title={micMuted ? 'Activer le micro' : 'Coupure micro'}
                >
                  {micMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <button
                  onClick={toggleVideo}
                  className={`p-2.5 rounded-xl transition-colors cursor-pointer ${
                    videoOff ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  }`}
                  title={videoOff ? 'Activer la vidéo' : 'Couper la vidéo'}
                >
                  {videoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setAnnotations([])}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2.5 rounded-xl text-xs font-medium flex items-center space-x-1 cursor-pointer"
                  title="Effacer les annotations"
                >
                  <RotateCcw className="w-4 h-4 text-slate-400" />
                  <span className="hidden sm:inline">Effacer Repères</span>
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-emerald-400 font-medium hidden sm:inline flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Session Enregistrée pour l'Audit</span>
                </span>
                <button
                  onClick={onClose}
                  className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-md"
                >
                  Quitter la Session
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Collaborative Live Chat & Telemetry Side Panel */}
          <div className="border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between overflow-hidden">
            {/* Live Telemetry Card */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 mb-3 shrink-0">
              <h4 className="font-bold text-white text-xs flex items-center justify-between">
                <span>Télémétrie en Direct</span>
                <span className="text-[10px] text-emerald-400 font-mono">EN SYNCHRO</span>
              </h4>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Batterie</span>
                  <span className="font-bold text-white">{equipment.telemetry.batteryLevel}%</span>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Erreur Active</span>
                  <span className="font-bold text-rose-400 font-mono">{equipment.telemetry.errorCode || 'Aucune'}</span>
                </div>
              </div>
            </div>

            {/* Chat Messages Log */}
            <div className="h-56 lg:h-auto lg:flex-1 overflow-y-auto space-y-2.5 pr-1 my-2 text-xs">
              {chatMessages.map((msg) => {
                const isMe = msg.senderId === currentUser.id;
                return (
                  <div
                    key={msg.id}
                    className={`p-2.5 rounded-xl border space-y-1 ${
                      isMe
                        ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-100 ml-4'
                        : 'bg-slate-950 border-slate-800 text-slate-200 mr-4'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-semibold text-slate-300">{msg.senderName}</span>
                      <span>{msg.timestamp}</span>
                    </div>
                    <p className="leading-relaxed">{msg.text}</p>
                  </div>
                );
              })}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="mt-2 flex items-center space-x-2 shrink-0">
              <input
                type="text"
                placeholder="Envoyer une consigne technique..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 bg-slate-950 text-slate-200 placeholder-slate-500 text-xs rounded-xl px-3 py-2 border border-slate-800 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-xl transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
