/**
 * Client WebRTC pour les visioconférences en direct.
 *
 * Ouvre une connexion WebSocket vers le serveur de signalisation (/signal),
 * rejoint la « salle » de la session en cours puis négocie un flux média
 * peer-to-peer avec chaque acteur présent :
 *   - le nouvel arrivant initie les offres vers les pairs déjà présents ;
 *   - les ICE candidates sont mises en file d'attente tant que la description
 *     distante n'est pas posée ;
 *   - le chat (texte / photo / enregistrement vocal) transite par la même
 *     socket, est persisté côté serveur et diffusé à toute la salle.
 */
import type { VideoChatMessage } from '../types';

export interface CallPeer {
  id: string;        // userId
  userName: string;
  stream?: MediaStream;
  connected: boolean;
}

export interface CallSessionCallbacks {
  onPeersChanged: (peers: CallPeer[]) => void;
  onRemoteStream: (peerId: string, stream: MediaStream) => void;
  onChat: (message: VideoChatMessage) => void;
  onStatus: (status: 'connecting' | 'connected' | 'disconnected') => void;
}

// Serveurs STUN publics : permettent d'établir le flux direct à travers les
// NAT sur Internet (en réseau local, les candidats « host » suffisent).
const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

type Signal = {
  type: 'offer' | 'answer' | 'ice-candidate';
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
};

type Incoming = {
  type: string;
  sessionId?: string;
  peers?: { id: string; userId: string; userName: string }[];
  peer?: { id: string; userId: string; userName: string };
  peerId?: string;
  from?: string;
  fromUser?: string;
  signal?: Signal;
  message?: VideoChatMessage;
};

export class CallSession {
  private ws: WebSocket | null = null;
  private readonly sessionId: string;
  private readonly userId: string;
  private readonly userName: string;
  private readonly localStream: MediaStream;
  private readonly cbs: CallSessionCallbacks;
  private readonly peers = new Map<string, CallPeer>();
  private readonly pcs = new Map<string, RTCPeerConnection>();
  private readonly iceQueue = new Map<string, RTCIceCandidateInit[]>();
  private closed = false;

  constructor(
    sessionId: string,
    user: { id: string; name: string },
    localStream: MediaStream,
    cbs: CallSessionCallbacks
  ) {
    this.sessionId = sessionId;
    this.userId = user.id;
    this.userName = user.name;
    this.localStream = localStream;
    this.cbs = cbs;
  }

  connect(): void {
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${proto}://${window.location.host}/signal`);
    this.ws = ws;
    this.cbs.onStatus('connecting');

    ws.onopen = () => {
      this.send({
        type: 'join',
        sessionId: this.sessionId,
        userId: this.userId,
        userName: this.userName,
      });
    };

    ws.onmessage = (event) => {
      try {
        this.handleMessage(JSON.parse(String(event.data)) as Incoming);
      } catch {
        /* message illisible : ignoré */
      }
    };

    ws.onclose = () => {
      if (!this.closed) {
        this.closed = true;
        this.teardown();
        this.cbs.onStatus('disconnected');
      }
    };

    ws.onerror = () => {
      /* onclose déclenche le nettoyage */
    };
  }

  private handleMessage(msg: Incoming): void {
    switch (msg.type) {
      case 'joined': {
        // Le nouvel arrivant initie les offres vers les pairs déjà présents
        for (const p of msg.peers || []) {
          const peer: CallPeer = { id: p.userId, userName: p.userName, connected: false };
          this.peers.set(peer.id, peer);
          void this.initiateOffer(peer.id);
        }
        this.cbs.onPeersChanged(this.peerList());
        this.cbs.onStatus('connected');
        break;
      }
      case 'peer-joined': {
        const p = msg.peer;
        if (!p || p.userId === this.userId) break;
        // Un nouvel arrivant nous contactera : on l'affiche en attente
        if (!this.peers.has(p.userId)) {
          this.peers.set(p.userId, { id: p.userId, userName: p.userName, connected: false });
          this.cbs.onPeersChanged(this.peerList());
        }
        break;
      }
      case 'peer-left': {
        const id = msg.peerId;
        if (!id) break;
        this.peers.delete(id);
        this.pcs.get(id)?.close();
        this.pcs.delete(id);
        this.iceQueue.delete(id);
        this.cbs.onPeersChanged(this.peerList());
        break;
      }
      case 'signal': {
        if (msg.from && msg.signal) this.handleSignal(msg.from, msg.fromUser || '', msg.signal);
        break;
      }
      case 'chat': {
        if (msg.message) this.cbs.onChat(msg.message);
        break;
      }
      default:
        break;
    }
  }

  private async initiateOffer(peerId: string): Promise<void> {
    const pc = this.getPc(peerId);
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      this.send({
        type: 'signal',
        to: peerId,
        fromUser: this.userName,
        signal: { type: 'offer', sdp: pc.localDescription },
      });
    } catch {
      /* négociation échouée : le pair reste en attente */
    }
  }

  private async handleSignal(from: string, fromUser: string, signal: Signal): Promise<void> {
    const pc = this.getPc(from);
    if (!this.peers.has(from)) {
      this.peers.set(from, { id: from, userName: fromUser || from, connected: false });
      this.cbs.onPeersChanged(this.peerList());
    }

    try {
      if (signal.type === 'offer') {
        await pc.setRemoteDescription(signal.sdp as RTCSessionDescriptionInit);
        await this.flushIceQueue(from);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        this.send({
          type: 'signal',
          to: from,
          fromUser: this.userName,
          signal: { type: 'answer', sdp: pc.localDescription },
        });
      } else if (signal.type === 'answer') {
        await pc.setRemoteDescription(signal.sdp as RTCSessionDescriptionInit);
        await this.flushIceQueue(from);
      } else if (signal.type === 'ice-candidate' && signal.candidate) {
        if (pc.remoteDescription) {
          await pc.addIceCandidate(signal.candidate).catch(() => {});
        } else {
          const queue = this.iceQueue.get(from) || [];
          queue.push(signal.candidate);
          this.iceQueue.set(from, queue);
        }
      }
    } catch {
      /* signal invalide : ignoré */
    }
  }

  private async flushIceQueue(peerId: string): Promise<void> {
    const pc = this.pcs.get(peerId);
    const queue = this.iceQueue.get(peerId) || [];
    this.iceQueue.set(peerId, []);
    for (const candidate of queue) {
      await pc?.addIceCandidate(candidate).catch(() => {});
    }
  }

  private getPc(peerId: string): RTCPeerConnection {
    const existing = this.pcs.get(peerId);
    if (existing) return existing;

    const pc = new RTCPeerConnection(RTC_CONFIG);
    for (const track of this.localStream.getTracks()) {
      pc.addTrack(track, this.localStream);
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.send({
          type: 'signal',
          to: peerId,
          fromUser: this.userName,
          signal: { type: 'ice-candidate', candidate: event.candidate.toJSON() },
        });
      }
    };

    pc.ontrack = (event) => {
      const stream = event.streams[0] || new MediaStream([event.track]);
      const peer = this.peers.get(peerId);
      if (peer) peer.stream = stream;
      this.cbs.onRemoteStream(peerId, stream);
    };

    pc.onconnectionstatechange = () => {
      const peer = this.peers.get(peerId);
      if (peer && pc.connectionState === 'connected') {
        peer.connected = true;
        this.cbs.onPeersChanged(this.peerList());
      }
    };

    this.pcs.set(peerId, pc);
    return pc;
  }

  private peerList(): CallPeer[] {
    return [...this.peers.values()];
  }

  /** Envoie un message au chat de la salle (true si la socket était ouverte). */
  sendChat(message: VideoChatMessage): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({ type: 'chat', sessionId: this.sessionId, message });
      return true;
    }
    return false;
  }

  isConnected(): boolean {
    return !!this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  leave(): void {
    if (!this.closed) {
      this.send({ type: 'leave' });
      this.closed = true;
      this.teardown();
    }
  }

  private send(data: unknown): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private teardown(): void {
    for (const pc of this.pcs.values()) pc.close();
    this.pcs.clear();
    this.iceQueue.clear();
    this.ws?.close();
    this.ws = null;
  }
}
