/**
 * Serveur de signalisation WebRTC pour les visioconférences en direct.
 *
 * Une « salle » par session vidéo en cours (id de session) : les acteurs qui
 * rejoignent l'appel échangent leurs offres/réponses/ICE (relais pur) et le
 * chat de la session (messages texte, photos, enregistrements vocaux) est
 * persisté côté serveur puis diffusé à toute la salle.
 *
 * Protocole (JSON) :
 *   client → serveur : { type: 'join', sessionId, userId, userName }
 *                      { type: 'signal', to, fromUser, signal }
 *                      { type: 'chat', sessionId, message }
 *                      { type: 'leave' }
 *   serveur → client : { type: 'joined', sessionId, peers }
 *                      { type: 'peer-joined', peer }
 *                      { type: 'peer-left', peerId }
 *                      { type: 'signal', from, fromUser, signal }
 *                      { type: 'chat', message }
 */
import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'node:http';
import { appendVideoSessionMessage } from './db';

interface PeerInfo {
  ws: WebSocket;
  userId: string;
  userName: string;
}

// Salle de signalisation : userId → socket (une connexion par acteur et par session)
const rooms = new Map<string, Map<string, PeerInfo>>();

function send(ws: WebSocket, data: unknown): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

export function attachSignalingServer(server: Server, path = '/signal'): void {
  const wss = new WebSocketServer({ server, path });

  wss.on('connection', (ws) => {
    let room: Map<string, PeerInfo> | null = null;
    let sessionId = '';
    let peerId = '';

    ws.on('message', (raw) => {
      let msg: Record<string, any>;
      try {
        msg = JSON.parse(String(raw));
      } catch {
        return;
      }

      switch (msg.type) {
        case 'join': {
          const { sessionId: sid, userId, userName } = msg;
          if (!sid || !userId) return;
          sessionId = String(sid);
          peerId = String(userId);
          if (!rooms.has(sessionId)) rooms.set(sessionId, new Map());
          room = rooms.get(sessionId)!;
          // Une seule connexion par acteur : remplace une éventuelle connexion orpheline
          const existing = room.get(peerId);
          if (existing && existing.ws !== ws) existing.ws.close();
          room.set(peerId, { ws, userId: peerId, userName: String(userName || peerId) });
          const peerInfos = [...room.values()].filter((p) => p.userId !== peerId);
          const peers = peerInfos.map((p) => ({
            id: p.userId,
            userId: p.userId,
            userName: p.userName,
          }));
          send(ws, { type: 'joined', sessionId, peers });
          for (const p of peerInfos) {
            send(p.ws, {
              type: 'peer-joined',
              peer: { id: peerId, userId: peerId, userName: String(userName || peerId) },
            });
          }
          break;
        }
        case 'signal': {
          if (!room || !msg.to) return;
          const target = room.get(String(msg.to));
          if (target) {
            send(target.ws, {
              type: 'signal',
              from: peerId,
              fromUser: msg.fromUser || peerId,
              signal: msg.signal,
            });
          }
          break;
        }
        case 'chat': {
          if (!room || !msg.message) return;
          // Persiste le message (texte / photo / enregistrement vocal) dans la
          // session puis le diffuse à toute la salle, y compris l'émetteur.
          if (appendVideoSessionMessage(sessionId || String(msg.sessionId || ''), msg.message)) {
            for (const p of room.values()) {
              send(p.ws, { type: 'chat', message: msg.message });
            }
          }
          break;
        }
        case 'leave': {
          if (room) {
            room.delete(peerId);
            for (const p of room.values()) send(p.ws, { type: 'peer-left', peerId });
          }
          break;
        }
        default:
          break;
      }
    });

    ws.on('close', () => {
      if (room && peerId) {
        room.delete(peerId);
        for (const p of room.values()) send(p.ws, { type: 'peer-left', peerId });
        if (room.size === 0) {
          rooms.delete(sessionId);
        }
      }
    });

    ws.on('error', () => {
      /* socket fermé : le handler 'close' fait le nettoyage */
    });
  });
}
