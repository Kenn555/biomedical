import React, { useState, useEffect, useRef, useCallback } from 'react';
import { IncidentTicket, Equipment, UserProfile, VideoSession, InvitedParticipant } from '../types';
import { api } from '../lib/api';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  PhoneOff,
  X,
  Maximize2,
  Minimize2,
  Sparkles,
  Camera,
  MessageSquare,
  Users,
  Settings,
  Pencil,
  Trash2,
  Download,
  Share2,
  ShieldCheck,
  Zap,
  Activity,
  AlertOctagon,
  Building2,
  Check
} from 'lucide-react';

interface VideoConferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket?: IncidentTicket | null;
  equipment?: Equipment | null;
  currentUser: UserProfile;
  /** Acteurs invités à l'appel (choisis dans l'écran de préparation) */
  invitedParticipants?: InvitedParticipant[];
}

export const VideoConferenceModal: React.FC<VideoConferenceModalProps> = ({
  isOpen,
  onClose,
  ticket,
  equipment,
  currentUser,
  invitedParticipants = [],
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isAnnotating, setIsAnnotating] = useState(false);
  // Enregistrement de session : durée, participants présents, messages
  const [sessionElapsed, setSessionElapsed] = useState(0);
  const [isSavingSession, setIsSavingSession] = useState(false);
  const [lastSavedSession, setLastSavedSession] = useState<VideoSession | null>(null);
  const sessionStartRef = useRef<number | null>(null);
  const elapsedTimerRef = useRef<number | null>(null);
  const hasSavedRef = useRef(false);
  const [chatMessages, setChatMessages] = useState<
    { sender: string; time: string; text: string; isAi?: boolean }[]
  >([
    {
      sender: 'Système Télémédecine',
      time: '12:00',
      text: 'Session vidéo sécurisée établie. Canal chiffré HDS & ISO 13485.',
    },
    {
      sender: 'Dr. Bakoly Rakoto (Ingénieur)',
      time: '12:01',
      text: 'Bonjour, je vois votre flux vidéo. Pouvez-vous pointer la sonde ou le boîtier d\'alimentation ?',
    },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [aiDiagnosticAdvice, setAiDiagnosticAdvice] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#f43f5e'); // Rose accent for annotation

  const roomName = ticket
    ? `BioMed-${ticket.code}`
    : `BioMed-Room-${equipment ? equipment.code : 'General'}`;

  // Acteurs présents dans la session : l'utilisateur connecté + les acteurs invités
  // (choisis dans l'écran de préparation — par acteur ou par établissement)
  const sessionParticipants = [
    { id: currentUser.id, name: currentUser.name, role: currentUser.role },
    ...invitedParticipants,
  ];

  // Démarre le chrono de session et la caméra WebRTC à l'ouverture
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    if (isOpen) {
      hasSavedRef.current = false;
      setLastSavedSession(null);
      setSessionElapsed(0);
      sessionStartRef.current = Date.now();
      elapsedTimerRef.current = window.setInterval(() => {
        setSessionElapsed(() =>
          sessionStartRef.current ? Math.floor((Date.now() - sessionStartRef.current) / 1000) : 0
        );
      }, 1000);

      setPermissionError(null);
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((mediaStream) => {
          activeStream = mediaStream;
          setStream(mediaStream);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = mediaStream;
          }
        })
        .catch((err) => {
          console.warn('WebRTC getUserMedia error or permission denied:', err);
          setPermissionError(
            'Caméra ou microphone inaccessible. Veuillez autoriser l\'accès dans votre navigateur pour le flux vidéo direct.'
          );
        });
    }

    return () => {
      if (elapsedTimerRef.current !== null) {
        window.clearInterval(elapsedTimerRef.current);
        elapsedTimerRef.current = null;
      }
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen]);

  // Bind video element whenever stream changes
  useEffect(() => {
    if (localVideoRef.current && stream) {
      localVideoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Toggle Video Track
  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    }
  };

  // Toggle Audio Track
  const toggleAudio = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioOn(audioTrack.enabled);
      }
    }
  };

  // Toggle Screen Share via WebRTC Display Media
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Revert to camera
      if (stream) {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        setIsScreenSharing(true);

        screenStream.getVideoTracks()[0].onended = () => {
          if (localVideoRef.current && stream) {
            localVideoRef.current.srcObject = stream;
          }
          setIsScreenSharing(false);
        };
      } catch (err) {
        console.warn('Screen share cancelled or failed:', err);
      }
    }
  };

  // Annotation Drawing Logic on Canvas
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isAnnotating || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isAnnotating || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Take Snapshot of Video Stream
  const takeSnapshot = () => {
    if (!localVideoRef.current) return;
    const video = localVideoRef.current;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth || 640;
    tempCanvas.height = video.videoHeight || 480;
    const ctx = tempCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
      if (canvasRef.current) {
        ctx.drawImage(canvasRef.current, 0, 0, tempCanvas.width, tempCanvas.height);
      }
      const dataUrl = tempCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `Capture-TeleDiags-${ticket ? ticket.code : 'Biomedical'}.png`;
      link.click();
    }
  };

  // Send Chat Message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msg = {
      sender: currentUser.name,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      text: newMessage.trim(),
    };
    setChatMessages((prev) => [...prev, msg]);
    setNewMessage('');
  };

  // Trigger Live Technical Assistance
  const handleAiLiveAssist = () => {
    setIsGeneratingAi(true);
    setTimeout(() => {
      setIsGeneratingAi(false);
      const advice = ticket
        ? `Recommandation technique pour ${ticket.equipmentName}: Vérifiez d'abord la tension d'entrée du fusible principal (${ticket.errorCode || 'Alimentation'}). Assurez-vous que le câble de terre est continuel.`
        : `Pour ce modèle, assurez-vous de réinitialiser le contrôleur via le menu technicien en maintenant le bouton Power pendant 10s.`;
      setAiDiagnosticAdvice(advice);
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'Assistant Technique',
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          text: advice,
          isAi: true,
        },
      ]);
    }, 1200);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(roomName);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // Enregistre la session (durée, participants, messages) puis ferme
  const saveSession = useCallback(async () => {
    if (hasSavedRef.current) return;
    hasSavedRef.current = true;
    setIsSavingSession(true);
    const startedAt = sessionStartRef.current || Date.now();
    const endedAt = Date.now();
    const durationSeconds = Math.max(1, Math.floor((endedAt - startedAt) / 1000));
    const session: Partial<VideoSession> = {
      roomName,
      ticketCode: ticket?.code,
      equipmentCode: equipment?.code,
      startedAt: new Date(startedAt).toISOString(),
      endedAt: new Date(endedAt).toISOString(),
      durationSeconds,
      participants: sessionParticipants,
      messages: chatMessages.map((m) => ({ sender: m.sender, time: m.time, text: m.text, isAi: m.isAi })),
    };
    try {
      const saved = await api.createVideoSession(session);
      setLastSavedSession(saved);
    } catch (err) {
      console.warn('Échec de l\'enregistrement de la session :', err);
    } finally {
      setIsSavingSession(false);
    }
  }, [roomName, ticket, equipment, sessionParticipants, chatMessages]);

  // Fermeture : enregistre la session puis appelle onClose (une seule fois)
  const handleHangUp = () => {
    void saveSession().then(() => onClose());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-white">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 gap-3">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="p-2.5 bg-rose-600/20 text-rose-500 rounded-2xl border border-rose-500/30 shrink-0">
              <Video className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm sm:text-base font-extrabold truncate text-slate-100">
                  Télé-Diagnostic & Assistance Vidéo Directe
                </h3>
                <span className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  <span>Session Live HD</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                {ticket
                  ? `Ticket #${ticket.code} — ${ticket.equipmentName} (${ticket.facility})`
                  : equipment
                  ? `Équipement: ${equipment.name} (${equipment.facility})`
                  : 'Canal de Visioconférence Général Biomédical'}
              </p>
            </div>
          </div>

          {/* Right Header Options */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Badge Session Propriétaire + durée en cours */}
            <div className="bg-slate-800 px-3 py-1.5 rounded-xl flex items-center space-x-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
              <span className="font-mono font-bold text-emerald-400">{formatDuration(sessionElapsed)}</span>
            </div>

            <button
              onClick={handleHangUp}
              disabled={isSavingSession}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              title="Raccrocher et enregistrer la session"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Content */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto lg:overflow-hidden">
          {/* Main Video View Canvas Container (col-8 on desktop) */}
          <div className="lg:col-span-8 bg-slate-950 p-4 flex flex-col justify-between relative min-h-[380px] lg:min-h-[500px]">
            {/* Permission Warning Banner */}
            {permissionError && (
              <div className="absolute top-6 left-6 right-6 z-30 bg-amber-500/20 border border-amber-500/40 text-amber-200 p-3.5 rounded-2xl text-xs flex items-center justify-between gap-3 shadow-xl backdrop-blur-md">
                <div className="flex items-center space-x-2">
                  <AlertOctagon className="w-5 h-5 text-amber-400 shrink-0" />
                  <span>{permissionError}</span>
                </div>
                <button
                  onClick={() => setPermissionError(null)}
                  className="text-slate-300 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Video Canvas : flux WebRTC propriétaire intégré */}
            <div className="flex-1 relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center group">
                <>
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted={false}
                    className={`w-full h-full object-cover rounded-2xl transition-all ${
                      !isVideoOn ? 'hidden' : ''
                    }`}
                  />

                  {/* Fallback overlay when video is turned off */}
                  {!isVideoOn && (
                    <div className="flex flex-col items-center justify-center space-y-3 text-slate-500">
                      <div className="w-20 h-20 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                        <VideoOff className="w-8 h-8" />
                      </div>
                      <p className="text-xs font-bold text-slate-400">
                        Caméra Désactivée par l'Utilisateur
                      </p>
                    </div>
                  )}

                  {/* Annotation Canvas Overlay */}
                  <canvas
                    ref={canvasRef}
                    width={800}
                    height={500}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className={`absolute inset-0 w-full h-full z-20 ${
                      isAnnotating ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'
                    }`}
                  />

                  {/* Remote Peer Overlay (Pip) */}
                  <div className="absolute top-4 right-4 z-10 w-36 sm:w-48 aspect-video bg-slate-900/90 rounded-xl border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col justify-between p-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-300 font-bold">
                      <span className="truncate">Dr. Bakoly (Expert)</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    </div>
                    <div className="flex-1 flex items-center justify-center text-slate-500 text-xs font-bold">
                      [Flux Télé-Expert]
                    </div>
                  </div>

                  {/* Live HUD telemetry badges */}
                  <div className="absolute top-4 left-4 z-10 flex flex-col space-y-1.5 pointer-events-none">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-700/80 text-[11px] font-mono text-emerald-400 font-bold backdrop-blur-md flex items-center space-x-1.5">
                      <Activity className="w-3.5 h-3.5 text-emerald-400" />
                      <span>
                        {ticket ? ticket.code : equipment ? equipment.code : 'STREAM-LIVE-HD'}
                      </span>
                    </span>
                    {isScreenSharing && (
                      <span className="px-2.5 py-1 rounded-lg bg-rose-600/90 text-white text-[10px] uppercase font-bold backdrop-blur-md flex items-center space-x-1">
                        <Monitor className="w-3 h-3" />
                        <span>Partage d'écran actif</span>
                      </span>
                    )}
                    {/* Durée de session en direct */}
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-700/80 text-[10px] font-mono font-bold text-amber-300 backdrop-blur-md inline-flex items-center space-x-1">
                      <Activity className="w-3 h-3 text-amber-400" />
                      <span>Durée : {formatDuration(sessionElapsed)}</span>
                    </span>
                  </div>
                </>
            </div>

            {/* Video Controls Bar */}
            <div className="pt-4 flex flex-wrap items-center justify-between gap-3">
              {/* Left Media Toggles */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleAudio}
                  className={`p-3 rounded-2xl font-bold transition-all cursor-pointer flex items-center justify-center ${
                    isAudioOn
                      ? 'bg-slate-800 hover:bg-slate-700 text-white'
                      : 'bg-rose-600 text-white ring-2 ring-rose-400/50'
                  }`}
                  title={isAudioOn ? 'Désactiver le microphone' : 'Activer le microphone'}
                >
                  {isAudioOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>

                <button
                  onClick={toggleVideo}
                  className={`p-3 rounded-2xl font-bold transition-all cursor-pointer flex items-center justify-center ${
                    isVideoOn
                      ? 'bg-slate-800 hover:bg-slate-700 text-white'
                      : 'bg-rose-600 text-white ring-2 ring-rose-400/50'
                  }`}
                  title={isVideoOn ? 'Couper la caméra' : 'Activer la caméra'}
                >
                  {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>

                <button
                  onClick={toggleScreenShare}
                  className={`p-3 rounded-2xl font-bold transition-all cursor-pointer flex items-center justify-center ${
                    isScreenSharing
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                  title="Partager mon écran"
                >
                  <Monitor className="w-5 h-5" />
                </button>
              </div>

              {/* Center Tools (Annotation & Snapshot) */}
              <div className="flex items-center space-x-2 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/80">
                <button
                  onClick={() => setIsAnnotating(!isAnnotating)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                    isAnnotating
                      ? 'bg-rose-600 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                  title="Dessiner et annoter l'écran"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Annoter</span>
                </button>

                {isAnnotating && (
                  <>
                    <input
                      type="color"
                      value={drawColor}
                      onChange={(e) => setDrawColor(e.target.value)}
                      className="w-7 h-7 rounded-lg border-none cursor-pointer bg-transparent"
                      title="Couleur d'annotation"
                    />
                    <button
                      onClick={clearCanvas}
                      className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Effacer le dessin"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}

                <button
                  onClick={takeSnapshot}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700 transition-all cursor-pointer flex items-center space-x-1.5"
                  title="Capturer une photo diagnostique"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Capture photo</span>
                </button>
              </div>

              {/* Right Call Termination Button */}
              <button
                onClick={handleHangUp}
                disabled={isSavingSession}
                className="px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs transition-all cursor-pointer flex items-center space-x-2 shadow-lg shadow-rose-900/40 disabled:opacity-60"
                title="Raccrocher et enregistrer la session"
              >
                <PhoneOff className="w-4 h-4" />
                <span>{isSavingSession ? 'Enregistrement…' : 'Raccrocher'}</span>
              </button>
            </div>
          </div>

          {/* Right Panel: Live Telemetry & Chat (col-4 on desktop) */}
          <div className="lg:col-span-4 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col justify-between p-4 space-y-4">
            {/* Participants présents + durée */}
            <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-3 space-y-2">
              <h4 className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>Acteurs présents ({sessionParticipants.length})</span>
              </h4>
              <div className="space-y-1.5">
                {sessionParticipants.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-200 font-semibold truncate">{p.name}</span>
                    <span className="flex items-center space-x-1.5 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                      <span className="text-emerald-400 font-mono text-[10px] font-bold">Présent</span>
                    </span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-semibold">Durée de session</span>
                <span className="font-mono font-bold text-amber-300">{formatDuration(sessionElapsed)}</span>
              </div>
              {isSavingSession && (
                <p className="text-[10px] text-emerald-400 font-bold animate-pulse pt-1">Enregistrement de la session…</p>
              )}
              {lastSavedSession && (
                <p className="text-[10px] text-emerald-400 font-bold pt-1">✓ Session enregistrée ({formatDuration(lastSavedSession.durationSeconds)})</p>
              )}
            </div>

            {/* Header section with room name */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider flex items-center space-x-1.5">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>Messagerie & Aide en Direct</span>
                </h4>

                <button
                  onClick={handleCopyLink}
                  className="text-[11px] text-slate-400 hover:text-emerald-400 font-bold flex items-center space-x-1 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                  title="Copier le nom de la salle"
                >
                  {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Share2 className="w-3 h-3" />}
                  <span>{isCopied ? 'Salle copiée' : 'Salle'}</span>
                </button>
              </div>

              {/* Live Technical Assistance Trigger Button */}
              <button
                onClick={handleAiLiveAssist}
                disabled={isGeneratingAi}
                className="w-full bg-slate-800 hover:bg-slate-700/80 text-emerald-400 font-bold text-xs py-2.5 px-3 rounded-xl border border-emerald-500/30 flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: '3s' }} />
                <span>{isGeneratingAi ? 'Analyse en cours...' : 'Demander un avis technique'}</span>
              </button>
            </div>

            {/* Live Chat Box */}
            <div className="flex-1 bg-slate-950/80 rounded-2xl border border-slate-800 p-3 overflow-y-auto space-y-3 min-h-[200px] max-h-[300px] text-xs">
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`p-2.5 rounded-xl space-y-1 ${
                    msg.isAi
                      ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-200'
                      : 'bg-slate-900 border border-slate-800 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                    <span className={msg.isAi ? 'text-emerald-400 font-black' : ''}>{msg.sender}</span>
                    <span className="font-mono text-slate-500">{msg.time}</span>
                  </div>
                  <p className="text-xs leading-relaxed">{msg.text}</p>
                </div>
              ))}
            </div>

            {/* Send Chat Message Form */}
            <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Écrire un message en direct..."
                className="flex-1 bg-slate-950 text-white placeholder-slate-500 text-xs rounded-xl px-3.5 py-2.5 border border-slate-800 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2.5 rounded-xl text-xs transition-colors cursor-pointer shrink-0"
              >
                Envoyer
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
