import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API 1: Technical Diagnostic Endpoint (Rule-based)
  app.post('/api/ai/diagnose', (req, res) => {
    try {
      const { equipmentName, model, brand, errorCode, errorDescription, symptoms, telemetry } = req.body;

      if (!equipmentName) {
        return res.status(400).json({ error: 'Equipment name is required.' });
      }

      const code = errorCode || 'Standard';
      const symStr = Array.isArray(symptoms) ? symptoms.join(', ') : symptoms || 'Avis général';

      const diagnosticText = `--- FICHE DE DIAGNOSTIC TECHNIQUE AUTOMATISÉ ---
Équipement: ${equipmentName} (${brand} - ${model})
Code Erreur Identifié: ${code}
Symptômes Renseignés: ${symStr}

1. RÉSULTAT DU DIAGNOSTIC DE CAUSE RACINE
- Hypothèse Principale: Perturbation du signal électrique ou alimentation instable (${telemetry?.powerSource || 'AC/Batterie'}).
- Analyse Télémétrique: Charge Batterie (${telemetry?.batteryLevel ?? 'N/A'}%), Température Interne (${telemetry?.temperature ?? 'N/A'}°C), Qualité Signal (${telemetry?.signalQuality ?? 'N/A'}%).

2. SÉCURITÉ PATIENT ET CONSIGNES D'URGENCE
- Vérifier l'isolement électrique (Norme IEC 60601-1).
- En cas de déviation majeure ou d'alarme critique, basculer le patient sur un équipement de secours immédiatement.

3. PLAN D'ACTION DE DÉPANNAGE ÉTAPE PAR ÉTAPE
- Étape 1: Redémarrage froid et réinitialisation des paramètres d'usine.
- Étape 2: Contrôle visuel et nettoyage des connecteurs, câbles et sondes.
- Étape 3: Lancement de l'auto-test et du calibrage zéro via le menu de maintenance technique.
- Étape 4: Test de transmission des données et validation du tracé.

4. PIÈCES DE RECHANGE & OUTILLAGE CONSEILLÉS
- Multimètre biomédical, kit de test de sécurité électrique, câble patient de rechange.`;

      res.json({
        success: true,
        diagnostic: diagnosticText,
      });
    } catch (error: any) {
      console.error('Error in /api/ai/diagnose:', error);
      res.status(500).json({
        error: 'Échec du diagnostic technique',
        details: error?.message || 'Erreur interne',
      });
    }
  });

  // API 2: Ticket Triage & Urgency Analysis (Rule-based)
  app.post('/api/ai/analyze-ticket', (req, res) => {
    try {
      const { description, symptoms, equipmentCategory } = req.body;
      const symList = Array.isArray(symptoms) ? symptoms : [];

      let suggestedUrgency = 'high';
      let reasoning = 'Incident affectant le fonctionnement normal de l\'appareil.';
      let immediateSafetyAction = 'Contrôler l\'état du patient et isoler l\'équipement si dysfonctionnement persistant.';

      if (symList.some((s: string) => s.toLowerCase().includes('allumer') || s.toLowerCase().includes('panne'))) {
        suggestedUrgency = 'critical_vital';
        reasoning = 'Panne d\'alimentation totale détectée. Risque pour la continuité des soins.';
        immediateSafetyAction = 'Basculer immédiatement sur l\'équipement biomédical de secours.';
      } else if (symList.some((s: string) => s.toLowerCase().includes('batterie') || s.toLowerCase().includes('bruit'))) {
        suggestedUrgency = 'medium';
        reasoning = 'Anomalie secondaire ou dégradation progressive des performances.';
        immediateSafetyAction = 'Brancher sur le réseau électrique stable et vérifier les connexions.';
      }

      res.json({
        success: true,
        analysis: {
          suggestedUrgency,
          reasoning,
          immediateSafetyAction,
          estimatedRepairTimeHours: 2,
          requiredSpecialty: 'Maintenance Biomédicale Générale',
        },
      });
    } catch (error: any) {
      console.error('Error in /api/ai/analyze-ticket:', error);
      res.status(500).json({ error: 'Échec de l\'analyse du ticket', details: error?.message });
    }
  });

  // API 3: Assistant Chat (Rule-based)
  app.post('/api/ai/assistant-chat', (req, res) => {
    try {
      const { messages } = req.body;
      const lastUserMsg = (messages[messages.length - 1]?.text || '').toLowerCase();

      let reply = 'Voici les consignes techniques standards : 1. Vérifiez l\'alimentation et la batterie. 2. Contrôlez l\'intégrité des câbles et connecteurs. 3. Lancez une séquence d\'auto-test et de calibrage zéro dans le menu de maintenance. 4. En cas de problème persistant, saisissez une fiche d\'intervention.';

      if (lastUserMsg.includes('err') || lastUserMsg.includes('erreur') || lastUserMsg.includes('code')) {
        reply = 'Analyse du code d\'erreur : 1. Notez précisément le code affiché. 2. Reportez-vous à la Base de Connaissances dans l\'onglet dédié. 3. Vérifiez les fusibles et la tension réseau. 4. Exécutez un redémarrage froid.';
      } else if (lastUserMsg.includes('sécurité') || lastUserMsg.includes('norme')) {
        reply = 'Normes de Sécurité Biomédicale (NF EN 60601-1) : 1. Mesure du courant de fuite à la terre. 2. Test d\'isolement du câble patient. 3. Vérification de la continuité de masse. 4. Validation du certificat de maintenance préventive.';
      }

      res.json({
        success: true,
        reply,
      });
    } catch (error: any) {
      console.error('Error in /api/ai/assistant-chat:', error);
      res.status(500).json({ error: 'Erreur assistant technique', details: error?.message });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
