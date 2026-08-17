import express from 'express';
import http from 'node:http';
import net from 'node:net';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { apiRouter } from './server/routes';
import { attachSignalingServer } from './server/signaling';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API routes (auth, CRUD, diagnostics)
  app.use('/api', apiRouter);

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    // Port HMR : surcharge possible via HMR_PORT (utilisé par les tests E2E pour
    // éviter toute collision), sinon port libre si le défaut (24678) est occupé.
    const hmrPort =
      (process.env.HMR_PORT && Number(process.env.HMR_PORT)) || (await getFreePort(24678));
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: { port: hmrPort } },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Serveur HTTP partagé : Express (API + frontend) et WebSocket de
  // signalisation WebRTC (visioconférences en direct) sur le même port.
  const httpServer = http.createServer(app);
  attachSignalingServer(httpServer, '/signal');

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// ---------------------------------------------------------------------------
// Port HMR de Vite : si le port par défaut (24678) est occupé par une autre
// instance, on en choisit un libre pour éviter les erreurs WebSocket.
// ---------------------------------------------------------------------------
function isPortFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.once('error', () => resolve(false));
    srv.once('listening', () => srv.close(() => resolve(true)));
    srv.listen(port, '0.0.0.0');
  });
}

async function getFreePort(preferred: number): Promise<number> {
  if (await isPortFree(preferred)) return preferred;
  // Prochain port libre garanti (bind sur 0.0.0.0 pour couvrir toutes les interfaces,
  // y compris les processus qui occupent uniquement IPv4/dual-stack)
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.listen(0, '0.0.0.0', () => {
      const addr = srv.address() as net.AddressInfo;
      srv.close(() => resolve(addr.port));
    });
  });
}

startServer();
