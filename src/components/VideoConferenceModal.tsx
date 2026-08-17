import React, { useState, useEffect, useRef, useCallback } from 'react';
import { IncidentTicket, Equipment, UserProfile, VideoSession, InvitedParticipant, VideoChatMessage } from '../types';
import { api } from '../lib/api';
import { CallSession, CallPeer } from '../lib/webrtc';
import { fileToResizedDataUrl } from '../lib/imageUpload';
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
  Check,
  ImagePlus,
  Square,
  AudioLines,
  PhoneCall,
  Wifi,
  WifiOff,
  Paperclip,
  FileText
} from 'lucide-react';

interface VideoConferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket?: IncidentTicket | null;
  equipment?: Equipment | null;
  currentUser: UserProfile;
  /** Acteurs invités à l'appel (choisis dans l'écran de préparation) */
  invitedParticipants?: InvitedParticipant[];
  /** Session « en direct » créée au démarrage (notification des invités) */
  liveSessionId?: string | null;
  /** Session live à rejoindre directement (acceptation d'un appel entrant) */
  joinSession?: VideoSession | null;
  /** Mode de l'appel choisi au lancement (vidéo ou audio seul) */
  callMode?: 'audio' | 'video';
}

export const VideoConferenceModal: React.FC<VideoConferenceModalProps> = ({
  isOpen,
  onClose,
  ticket,
  equipment,
  currentUser,
  invitedParticipants = [],
  liveSessionId = null,
  joinSession = null,
  callMode: initialCallMode = 'video',
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isAnnotating, setIsAnnotating] = useState(false);
  // Mode de l'appel (vidéo / audio seul) — choisi au lancement ou à la jointure
  const [callMode, setCallMode] = useState<'audio' | 'video'>(initialCallMode);
  // Appel entrant : invite à choisir le mode avant de rejoindre
  const [joinPrompt, setJoinPrompt] = useState(false);
  const [mediaReady, setMediaReady] = useState(false);
  // Visio en direct : pairs distants + statut de la connexion de signalisation
  const [remotePeers, setRemotePeers] = useState<CallPeer[]>([]);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'connected' | 'disconnected'>('idle');
  const callSessionRef = useRef<CallSession | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const seenMessageIdsRef = useRef<Set<string>>(new Set());
  // Enregistrement vocal (consentement explicite + indicateur visible)
  const [recordingAllowed, setRecordingAllowed] = useState(false);
  const [showRecordingConsent, setShowRecordingConsent] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  // Enregistrement de session : durée, participants présents, messages
  const [sessionElapsed, setSessionElapsed] = useState(0);
  const [isSavingSession, setIsSavingSession] = useState(false);
  const [lastSavedSession, setLastSavedSession] = useState<VideoSession | null>(null);
  const sessionStartRef = useRef<number | null>(null);
  const elapsedTimerRef = useRef<number | null>(null);
  const hasSavedRef = useRef(false);
  // Messages échangés pendant la session (texte, photos, enregistrements vocaux)
  const [chatMessages, setChatMessages] = useState<VideoChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [aiDiagnosticAdvice, setAiDiagnosticAdvice] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#f43f5e'); // Rose accent for annotation

  const roomName = ticket
    ? `BioMed-${ticket.code}`
    : `BioMed-Room-${equipment ? equipment.code : 'General'}`;

  // Session « en direct » concernée : celle créée au démarrage (hôte) ou celle
  // que l'on rejoint (appel entrant accepté).
  const effectiveSessionId = liveSessionId || joinSession?.id || null;
  const isJoiner = !!joinSession;

  // Session enregistrée : l'utilisateur connecté + les acteurs invités
  // (choisis dans l'écran de préparation — par acteur ou par établissement).
  const sessionParticipants = [
    { id: currentUser.id, name: currentUser.name, role: currentUser.role },
    ...invitedParticipants,
  ];
  const invitedCount = invitedParticipants.length;

  const localVideoMode = callMode === 'video';

  // ---------------------------------------------------------------------------
  // Chat en direct (persisté côté serveur + diffusé à la salle via WebSocket)
  // ---------------------------------------------------------------------------
  const handleIncomingChat = useCallback((message: VideoChatMessage) => {
    if (seenMessageIdsRef.current.has(message.id)) return;
    seenMessageIdsRef.current.add(message.id);
    setChatMessages((prev) => [...prev, message]);
  }, []);

  const sendChatMessage = useCallback(
    (message: VideoChatMessage) => {
      if (seenMessageIdsRef.current.has(message.id)) return;
      seenMessageIdsRef.current.add(message.id);
      setChatMessages((prev) => [...prev, message]);
      // Signalisation ouverte : message diffusé et persisté par le serveur.
      // Sinon (hors ligne / socket fermée) : repli HTTP.
      if (!callSessionRef.current?.sendChat(message)) {
        if (effectiveSessionId) {
          api.addVideoSessionMessage(effectiveSessionId, message).catch(() => {});
        }
      }
    },
    [effectiveSessionId]
  );

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    sendChatMessage({
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      senderId: currentUser.id,
      sender: currentUser.name,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      text: newMessage.trim(),
    });
    setNewMessage('');
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const dataUrl = await fileToResizedDataUrl(file, 480, 0.8);
      sendChatMessage({
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        senderId: currentUser.id,
        sender: currentUser.name,
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        image: dataUrl,
      });
    } catch (err) {
      console.warn('Photo non envoyée :', err);
    }
  };

  // Fichier joint pendant l'appel (tout type : PDF, document, archive…) —
  // lu en data URL et envoyé comme message à toute la salle.
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setFileError('Fichier trop lourd (10 Mo maximum pour un envoi pendant l\'appel).');
      return;
    }
    setFileError(null);
    const reader = new FileReader();
    reader.onerror = () => setFileError('Impossible de lire le fichier sélectionné.');
    reader.onload = () => {
      const dataUrl = String(reader.result);
      if (dataUrl) {
        sendChatMessage({
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          senderId: currentUser.id,
          sender: currentUser.name,
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          file: dataUrl,
          fileName: file.name,
          fileSize: file.size,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
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
      sendChatMessage({
        id: `msg-ai-${Date.now()}`,
        senderId: 'assistant',
        sender: 'Assistant Technique',
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        text: advice,
        isAi: true,
      });
    }, 1200);
  };

  // ---------------------------------------------------------------------------
  // Enregistrement vocal (autorisation explicite + enregistré dans la session)
  // ---------------------------------------------------------------------------
  const stopVoiceRecording = useCallback(() => {
    if (recordingTimerRef.current !== null) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    setIsRecording(false);
  }, []);

  const startVoiceRecording = useCallback(async () => {
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStreamRef.current = audioStream;
      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
      const recorder = new MediaRecorder(audioStream, mime ? { mimeType: mime } : undefined);
      recordingChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordingChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(recordingChunksRef.current, { type: mime || 'audio/webm' });
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = String(reader.result);
          if (dataUrl) {
            sendChatMessage({
              id: `msg-voice-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              senderId: currentUser.id,
              sender: currentUser.name,
              time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
              voice: dataUrl,
            });
          }
        };
        reader.readAsDataURL(blob);
        audioStream.getTracks().forEach((t) => t.stop());
        recordingStreamRef.current = null;
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecordingSeconds(0);
      setIsRecording(true);
      // Arrêt automatique après 60 s (le fichier reste léger pour la base)
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((s) => {
          if (s + 1 >= 60) stopVoiceRecording();
          return s + 1;
        });
      }, 1000);
    } catch (err) {
      console.warn('Enregistrement vocal impossible :', err);
      setPermissionError(
        "Microphone inaccessible pour l'enregistrement vocal. Vérifiez l'autorisation du navigateur."
      );
    }
  }, [currentUser, sendChatMessage, stopVoiceRecording]);

  const requestVoiceRecording = () => {
    if (isRecording) {
      stopVoiceRecording();
      return;
    }
    if (!recordingAllowed) {
      setShowRecordingConsent(true);
      return;
    }
    void startVoiceRecording();
  };

  // ---------------------------------------------------------------------------
  // Média local + connexion WebRTC (signalisation WebSocket)
  // ---------------------------------------------------------------------------
  const startCallMedia = useCallback(
    (mode: 'audio' | 'video') => {
      setJoinPrompt(false);
      setMediaReady(false);
      setPermissionError(null);
      setCallStatus('connecting');
      setCallMode(mode);
      // Démarre le chrono de session à la jointure effective
      sessionStartRef.current = Date.now();
      setSessionElapsed(0);
      if (elapsedTimerRef.current !== null) window.clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = window.setInterval(() => {
        setSessionElapsed(() =>
          sessionStartRef.current ? Math.floor((Date.now() - sessionStartRef.current) / 1000) : 0
        );
      }, 1000);

      navigator.mediaDevices
        .getUserMedia({ audio: true, video: mode === 'video' })
        .then((mediaStream) => {
          mediaStreamRef.current = mediaStream;
          setStream(mediaStream);
          setIsVideoOn(mode === 'video');
          setIsAudioOn(true);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = mediaStream;
          }
          setMediaReady(true);
          if (effectiveSessionId) {
            // Appel entrant : présence + historique déjà échangé
            if (joinSession) {
              api.markVideoSessionJoined(effectiveSessionId).catch(() => {});
              const existing = joinSession.messages || [];
              for (const m of existing) seenMessageIdsRef.current.add(m.id);
              if (existing.length) setChatMessages(existing);
            }
            const session = new CallSession(
              effectiveSessionId,
              { id: currentUser.id, name: currentUser.name },
              mediaStream,
              {
                onPeersChanged: setRemotePeers,
                onRemoteStream: (peerId, s) =>
                  setRemoteStreams((prev) => ({ ...prev, [peerId]: s })),
                onChat: handleIncomingChat,
                onStatus: setCallStatus,
              }
            );
            callSessionRef.current = session;
            session.connect();
          } else {
            setCallStatus('connected');
          }
        })
        .catch((err) => {
          console.warn('WebRTC getUserMedia error or permission denied:', err);
          setPermissionError(
            'Caméra ou microphone inaccessible. Veuillez autoriser l\'accès dans votre navigateur pour le flux vidéo direct.'
          );
          setCallStatus('disconnected');
        });
    },
    [effectiveSessionId, joinSession, currentUser, handleIncomingChat]
  );

  // Démarre le chrono de session et la caméra WebRTC à l'ouverture
  useEffect(() => {
    if (!isOpen) return;

    hasSavedRef.current = false;
    setLastSavedSession(null);
    setSessionElapsed(0);
    setPermissionError(null);
    setChatMessages([]);
    setRemotePeers([]);
    setRemoteStreams({});
    setCallStatus('idle');
    setRecordingAllowed(false);
    setShowRecordingConsent(false);
    setIsRecording(false);
    setRecordingSeconds(0);
    setStream(null);
    seenMessageIdsRef.current = new Set();
    callSessionRef.current?.leave();
    callSessionRef.current = null;
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;

    // Appel entrant : d'abord le choix du mode (audio / vidéo)
    if (joinSession) {
      setJoinPrompt(true);
      setMediaReady(false);
    } else {
      void startCallMedia(initialCallMode);
    }

    return () => {
      if (elapsedTimerRef.current !== null) {
        window.clearInterval(elapsedTimerRef.current);
        elapsedTimerRef.current = null;
      }
      if (recordingTimerRef.current !== null) {
        window.clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      // Clôture un éventuel enregistrement en cours (message envoyé à la salle)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current = null;
      recordingStreamRef.current?.getTracks().forEach((t) => t.stop());
      recordingStreamRef.current = null;
      callSessionRef.current?.leave();
      callSessionRef.current = null;
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    try {
      if (effectiveSessionId) {
        // Session « en direct » créée au démarrage : on la clôture. Les
        // messages du chat sont déjà persistés en direct par le serveur.
        const saved = await api.endVideoSession(effectiveSessionId, {
          endedAt: new Date(endedAt).toISOString(),
          durationSeconds,
        });
        setLastSavedSession(saved);
      } else {
        // Repli (hors ligne, création de session impossible au démarrage) :
        // enregistrement complet à la clôture.
        const session: Partial<VideoSession> = {
          roomName,
          ticketCode: ticket?.code,
          equipmentCode: equipment?.code,
          startedAt: new Date(startedAt).toISOString(),
          endedAt: new Date(endedAt).toISOString(),
          durationSeconds,
          participants: sessionParticipants,
          messages: chatMessages,
          callMode,
        };
        const saved = await api.createVideoSession(session);
        setLastSavedSession(saved);
      }
    } catch (err) {
      console.warn('Échec de l\'enregistrement de la session :', err);
    } finally {
      setIsSavingSession(false);
    }
  }, [effectiveSessionId, roomName, ticket, equipment, sessionParticipants, chatMessages, callMode]);

  // Fermeture : quitte la salle, stoppe média/enregistrement puis clôture la
  // session (hôte) ou referme simplement (acteur invité).
  const handleHangUp = () => {
    if (isRecording) stopVoiceRecording();
    callSessionRef.current?.leave();
    callSessionRef.current = null;
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    if (isJoiner) {
      onClose();
    } else {
      void saveSession().then(() => onClose());
    }
  };

  if (!isOpen) return null;

  // ---------------------------------------------------------------------------
  // Appel entrant : choix du mode (vidéo ou audio) avant de rejoindre
  // ---------------------------------------------------------------------------
  if (joinSession && !mediaReady) {
    const caller = joinSession.createdBy?.name || 'Un acteur';
    return (
      <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200">
          <div className="bg-slate-900 p-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto mb-3 animate-pulse">
              <PhoneCall className="w-7 h-7 text-emerald-400" />
            </div>
            <h3 className="text-base font-extrabold text-white">Appel entrant</h3>
            <p className="text-xs text-slate-400 font-medium mt-1">
              <strong className="text-slate-200">{caller}</strong> vous invite à rejoindre{' '}
              <strong className="text-slate-200">{joinSession.roomName}</strong>
              {joinSession.ticketCode ? ` — Ticket ${joinSession.ticketCode}` : ''}
            </p>
          </div>
          <div className="p-5 space-y-3">
            <p className="text-[11px] text-slate-500 font-medium text-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
              Choisissez le mode de votre participation à l'appel.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() => void startCallMedia('video')}
                className="bg-sky-600 hover:bg-sky-700 text-white font-black text-xs py-3 rounded-xl transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Video className="w-4 h-4" />
                <span>Rejoindre en vidéo</span>
              </button>
              <button
                onClick={() => void startCallMedia('audio')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-3 rounded-xl transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Mic className="w-4 h-4" />
                <span>Rejoindre en audio</span>
              </button>
            </div>
            <button
              onClick={onClose}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs py-3 rounded-xl transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <PhoneOff className="w-4 h-4" />
              <span>Refuser l'appel</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

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
                  {isJoiner ? 'Visio en direct — Appel accepté' : 'Télé-Diagnostic & Assistance Vidéo Directe'}
                </h3>
                <span
                  className={`hidden sm:inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                    callStatus === 'connected'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full inline-block ${
                      callStatus === 'connected' ? 'bg-emerald-400 animate-ping' : 'bg-amber-400 animate-pulse'
                    }`}
                  />
                  <span>
                    {callStatus === 'connected'
                      ? 'En direct'
                      : callStatus === 'connecting'
                      ? 'Connexion…'
                      : callStatus === 'disconnected'
                      ? 'Hors ligne'
                      : 'Session Live'}
                  </span>
                </span>
                {isRecording && (
                  <span className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-600/30 text-rose-300 border border-rose-500/40">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
                    <span>Enregistrement vocal {formatDuration(recordingSeconds)}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                {ticket
                  ? `Ticket #${ticket.code} — ${ticket.equipmentName} (${ticket.facility})`
                  : equipment
                  ? `Équipement: ${equipment.name} (${equipment.facility})`
                  : joinSession
                  ? `${joinSession.roomName} — ${callMode === 'audio' ? 'Appel audio' : 'Appel vidéo'}`
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
                  {localVideoMode ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted={false}
                      className={`w-full h-full object-cover rounded-2xl transition-all ${
                        !isVideoOn ? 'hidden' : ''
                      }`}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center space-y-3 text-slate-500">
                      <div className="w-20 h-20 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400">
                        <AudioLines className="w-8 h-8" />
                      </div>
                      <p className="text-xs font-bold text-slate-400">
                        Appel audio — {currentUser.name}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {callStatus === 'connected' ? 'Connecté à la salle' : 'En attente de connexion…'}
                      </p>
                    </div>
                  )}

                  {/* Fallback overlay when video is turned off */}
                  {localVideoMode && !isVideoOn && (
                    <div className="flex flex-col items-center justify-center space-y-3 text-slate-500">
                      <div className="w-20 h-20 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                        <VideoOff className="w-8 h-8" />
                      </div>
                      <p className="text-xs font-bold text-slate-400">
                        Caméra Désactivée par l'Utilisateur
                      </p>
                    </div>
                  )}

                  {/* Annotation Canvas Overlay (mode vidéo uniquement) */}
                  {localVideoMode && (
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
                  )}

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

                  {/* Tuiles des participants distants (en bas à droite) */}
                  {remotePeers.length > 0 && (
                    <div className="absolute bottom-3 right-3 z-20 flex gap-2 flex-wrap justify-end">
                      {remotePeers.map((peer) => {
                        const peerStream = remoteStreams[peer.id];
                        const hasVideo = !!peerStream?.getVideoTracks().some((t) => t.readyState === 'live');
                        return (
                          <div
                            key={peer.id}
                            className="w-28 h-20 rounded-lg overflow-hidden bg-slate-800 border border-slate-700 relative shrink-0"
                          >
                            {peerStream && hasVideo ? (
                              <video
                                ref={(el) => {
                                  if (el && el.srcObject !== peerStream) el.srcObject = peerStream;
                                }}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1">
                                <Users className="w-4 h-4" />
                                <span className="text-[9px] font-bold px-1 truncate max-w-full">
                                  {peer.userName}
                                </span>
                              </div>
                            )}
                            <span className="absolute bottom-0 inset-x-0 bg-slate-900/70 text-[8px] font-bold text-center py-0.5 truncate px-1">
                              {peer.userName}
                            </span>
                            {!hasVideo && (
                              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
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

                {localVideoMode && (
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
                )}

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

              {/* Center Tools (Annotation & Snapshot) — mode vidéo uniquement */}
              {localVideoMode && (
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
              )}

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
                <span>
                  Acteurs présents ({1 + remotePeers.length})
                  {invitedCount > 0 && <span className="text-slate-500"> • {invitedCount} invité(s)</span>}
                </span>
              </h4>
              <div className="space-y-1.5">
                {/* L'utilisateur connecté : réellement présent dans l'appel */}
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-200 font-semibold truncate">{currentUser.name}</span>
                  <span className="flex items-center space-x-1.5 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                    <span className="text-emerald-400 font-mono text-[10px] font-bold">Présent</span>
                  </span>
                </div>
                {/* Participants distants connectés (signalisation) */}
                {remotePeers.map((peer) => (
                  <div key={peer.id} className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-200 font-semibold truncate">{peer.userName}</span>
                    <span className="flex items-center space-x-1.5 shrink-0">
                      <span
                        className={`w-1.5 h-1.5 rounded-full inline-block ${
                          peer.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400/80'
                        }`}
                      />
                      <span
                        className={`font-mono text-[10px] font-bold ${
                          peer.connected ? 'text-emerald-400' : 'text-amber-400/90'
                        }`}
                      >
                        {peer.connected ? 'En ligne' : 'Connexion…'}
                      </span>
                    </span>
                  </div>
                ))}
                {/* Acteurs invités pas encore connectés */}
                {invitedParticipants
                  .filter((p) => !remotePeers.some((r) => r.id === p.id))
                  .map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium truncate">{p.name}</span>
                      <span className="flex items-center space-x-1.5 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80 inline-block" />
                        <span className="text-amber-400/90 font-mono text-[10px] font-bold">
                          {joinSession && !remotePeers.some((r) => r.id === p.id) ? 'En ligne' : 'Invité'}
                        </span>
                      </span>
                    </div>
                  ))}
                {remotePeers.length === 0 && invitedCount === 0 && (
                  <p className="text-[10px] text-slate-500 font-medium pt-0.5">
                    Aucun autre acteur connecté à cette session.
                  </p>
                )}
              </div>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-semibold">Durée de session</span>
                <span className="font-mono font-bold text-amber-300">{formatDuration(sessionElapsed)}</span>
              </div>
              {/* Statut de la connexion de signalisation */}
              <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 font-bold">
                {callStatus === 'connected' ? (
                  <>
                    <Wifi className="w-3 h-3 text-emerald-400" />
                    <span>Signalisation connectée</span>
                  </>
                ) : callStatus === 'connecting' ? (
                  <>
                    <Wifi className="w-3 h-3 text-amber-400 animate-pulse" />
                    <span>Connexion à la salle…</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 text-rose-400" />
                    <span>Signalisation hors ligne</span>
                  </>
                )}
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
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-2.5 rounded-xl space-y-1 ${
                    msg.isAi
                      ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-200'
                      : 'bg-slate-900 border border-slate-800 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                    <span className={msg.isAi ? 'text-emerald-400 font-black' : ''}>
                      {msg.sender}
                      {msg.senderId === currentUser.id ? ' (vous)' : ''}
                    </span>
                    <span className="font-mono text-slate-500">{msg.time}</span>
                  </div>
                  {msg.text && <p className="text-xs leading-relaxed">{msg.text}</p>}
                  {msg.image && (
                    <img
                      src={msg.image}
                      alt="Photo envoyée pendant l'appel"
                      className="mt-1.5 rounded-lg max-h-40 w-auto border border-slate-700"
                      loading="lazy"
                    />
                  )}
                  {msg.file && msg.fileName && (
                    <a
                      href={msg.file}
                      download={msg.fileName}
                      className="mt-1.5 flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg px-2.5 py-2 transition-colors group"
                      title={`Télécharger ${msg.fileName}`}
                    >
                      <span className="p-1.5 bg-sky-500/20 text-sky-400 rounded-lg shrink-0">
                        <FileText className="w-4 h-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[11px] font-bold text-slate-100 truncate">{msg.fileName}</span>
                        {msg.fileSize !== undefined && (
                          <span className="block text-[10px] text-slate-400 font-medium">{formatFileSize(msg.fileSize)}</span>
                        )}
                      </span>
                      <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 shrink-0" />
                    </a>
                  )}
                  {msg.voice && (
                    <audio controls src={msg.voice} className="mt-1.5 w-full h-8" preload="metadata" />
                  )}
                </div>
              ))}
            </div>

            {/* Consentement enregistrement vocal */}
            {showRecordingConsent && (
              <div className="rounded-xl border border-amber-500/40 bg-amber-950/40 p-3 space-y-2">
                <p className="text-[11px] text-amber-200 font-bold flex items-center space-x-1.5">
                  <Mic className="w-3.5 h-3.5 text-amber-400" />
                  <span>Autorisation d'enregistrement vocal</span>
                </p>
                <p className="text-[10px] text-amber-100/80 leading-snug">
                  L'enregistrement de votre voix sera joint à la session et rejouable dans l'historique.
                  Autorisez-vous l'enregistrement ?
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setShowRecordingConsent(false);
                      setRecordingAllowed(true);
                      void startVoiceRecording();
                    }}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    Autoriser
                  </button>
                  <button
                    onClick={() => setShowRecordingConsent(false)}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-[10px] py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    Refuser
                  </button>
                </div>
              </div>
            )}

            {/* Erreur d'envoi de fichier */}
            {fileError && (
              <p className="text-[10px] font-bold text-rose-300 bg-rose-950/40 border border-rose-500/40 rounded-xl px-3 py-2">
                ⚠️ {fileError}
              </p>
            )}

            {/* Send Chat Message Form */}
            <form onSubmit={handleSendText} className="flex items-center space-x-2">
              <input
                type="file"
                accept="image/*"
                ref={photoInputRef}
                onChange={handlePhotoChange}
                className="hidden"
              />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-slate-800 hover:bg-slate-700 text-amber-400 p-2.5 rounded-xl transition-colors cursor-pointer shrink-0"
                title="Envoyer un fichier pendant l'appel"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="bg-slate-800 hover:bg-slate-700 text-sky-400 p-2.5 rounded-xl transition-colors cursor-pointer shrink-0"
                title="Envoyer une photo pendant l'appel"
              >
                <ImagePlus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={requestVoiceRecording}
                className={`p-2.5 rounded-xl transition-colors cursor-pointer shrink-0 ${
                  isRecording
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-slate-800 hover:bg-slate-700 text-emerald-400'
                }`}
                title={isRecording ? 'Arrêter l\'enregistrement vocal' : 'Enregistrement vocal'}
              >
                {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Écrire un message en direct..."
                className="flex-1 bg-slate-950 text-white placeholder-slate-500 text-xs rounded-xl px-3.5 py-2.5 border border-slate-800 focus:outline-none focus:border-emerald-500 min-w-0"
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
