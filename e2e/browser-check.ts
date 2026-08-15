/**
 * Vérification du parcours complet dans un navigateur réel (Chromium headless).
 *
 * Lancement : npm run test:e2e
 *
 * Démarre un serveur isolé (port éphémère + base temporaire), pilote un vrai
 * Chromium avec Playwright : écran de connexion → login → chargement des
 * données → navigation entre onglets → création d'un ticket → bascule de
 * profil → déconnexion. Capture les erreurs console / exceptions React.
 */
import { spawn, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const PORT = 3400 + Math.floor(Math.random() * 500);
const BASE = `http://127.0.0.1:${PORT}`;
// Port HMR dédié au test : évite toute collision avec un serveur de dev sur 24678
const HMR_PORT = 25000 + Math.floor(Math.random() * 1000);

const ADMIN_EMAIL = 'admin.telemed@sante.mg';
const PASSWORD = 'biomed123';

// ---------------------------------------------------------------------------
// Découverte du Chromium déjà installé (ms-playwright)
// ---------------------------------------------------------------------------
function findChrome(): string {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const dir = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright');
  if (!fs.existsSync(dir)) return '';
  const versions = fs
    .readdirSync(dir)
    .filter((d) => d.startsWith('chromium-'))
    .sort();
  for (let i = versions.length - 1; i >= 0; i--) {
    const base = path.join(dir, versions[i]);
    const candidates = [
      path.join(base, 'chrome-win64', 'chrome.exe'),
      path.join(base, 'chrome-win', 'chrome.exe'),
      path.join(base, 'chrome-linux', 'chrome'),
      path.join(base, 'chrome-headless-shell-win64', 'chrome-headless-shell.exe'),
      path.join(base, 'chrome-headless-shell-linux64', 'chrome-headless-shell'),
    ];
    for (const c of candidates) if (fs.existsSync(c)) return c;
  }
  return '';
}

// ---------------------------------------------------------------------------
// Assertions & rapport
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;
const failures: string[] = [];

function check(name: string, cond: boolean, detail?: unknown): void {
  if (cond) {
    passed += 1;
    console.log(`  ✅ ${name}`);
  } else {
    failed += 1;
    failures.push(name);
    console.error(`  ❌ ${name}${detail !== undefined ? ` — ${JSON.stringify(detail)}` : ''}`);
  }
}

// ---------------------------------------------------------------------------
// Cycle de vie du serveur de test
// ---------------------------------------------------------------------------

let server: ChildProcess | null = null;
let tempDir: string | null = null;
let serverLog = '';

async function startServer(): Promise<boolean> {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'biomed-e2e-'));
  server = spawn(process.execPath, ['--import', 'tsx', 'server.ts'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT), HMR_PORT: String(HMR_PORT), DB_PATH: path.join(tempDir, 'e2e.db') },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout?.on('data', (d) => (serverLog += d.toString()));
  server.stderr?.on('data', (d) => (serverLog += d.toString()));

  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE}/api/health`);
      if (res.ok) return true;
    } catch {
      /* pas encore prêt */
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

async function stopServer(): Promise<void> {
  if (server) {
    server.kill('SIGTERM');
    await new Promise((r) => setTimeout(r, 800));
    if (server.exitCode === null) server.kill('SIGKILL');
    server = null;
  }
  if (tempDir) {
    await new Promise((r) => setTimeout(r, 300));
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
    tempDir = null;
  }
}

// ---------------------------------------------------------------------------
// Parcours navigateur
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const chromePath = findChrome();
  if (!chromePath) {
    console.error("❌ Chromium introuvable (ms-playwright). Installez-le via : npx playwright install chromium");
    process.exit(1);
  }

  console.log(`Démarrage du serveur isolé sur le port ${PORT}...`);
  const up = await startServer();
  if (!up) {
    console.error('❌ Le serveur n\'a pas démarré.');
    console.error(serverLog.slice(-1000));
    await stopServer();
    process.exit(1);
  }
  console.log('✅ Serveur prêt.');

  const browser = await chromium.launch({ executablePath: chromePath, headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.setDefaultTimeout(15000);

  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => pageErrors.push(String(err)));
  // Accepte les alert() du formulaire admin (confirmations de création/suppression)
  page.on('dialog', (dialog) => void dialog.accept());
  // Les photos externes (Unsplash) sont remplacées par un PNG local : test déterministe,
  // indépendant du réseau (les <img> se chargent toujours).
  const TINY_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
  await page.route('**/images.unsplash.com/**', async (route) => {
    await route.fulfill({ contentType: 'image/png', body: TINY_PNG });
  });

  try {
    // --- 1. Écran de connexion ---
    console.log('\n▶ Écran de connexion');
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    check('champ email affiché', await page.locator('input[type="email"]').isVisible());
    check('champ mot de passe affiché', await page.locator('input[type="password"]').isVisible());
    check('titre « Connexion au Réseau Télémédecine » affiché', await page.getByText('Connexion au Réseau Télémédecine').isVisible());
    check('comptes de démonstration listés', await page.getByText('Comptes de démonstration').isVisible());

    // --- 2. Connexion admin + loader plein écran ---
    console.log('\n▶ Connexion admin + loader');
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    // Ralentit temporairement les appels API pour observer le loader de façon déterministe
    await page.route('**/api/**', async (route) => {
      await new Promise((r) => setTimeout(r, 600));
      await route.continue();
    });
    await page.getByRole('button', { name: /Se Connecter/ }).click();
    await page.waitForSelector('text=Chargement des données du serveur', { timeout: 5000 });
    check('loader plein écran affiché pendant le chargement des données', true);
    await page.waitForSelector('header', { timeout: 15000 });
    await page.unroute('**/api/**');
    check('application chargée après connexion', await page.getByText('Parc Équipements').isVisible());
    await page.waitForSelector('text=Connexion Réussie', { timeout: 10000 });
    check('toast « Connexion Réussie » affiché', true);

    // --- 3. Données réelles chargées ---
    console.log('\n▶ Données chargées depuis le backend');
    await page.waitForTimeout(1500);
    // Nom exact rendu dans la carte équipement (évite l'<option> masquée du filtre)
    check('équipement seedé visible (Électrocardiographe)', await page.getByText('Électrocardiographe 12 Pistes Télémédecine').first().isVisible().catch(() => false));
    // Photo / avatar affiché sur la fiche équipement (première carte = Moniteur)
    check('photo affichée sur la carte équipement', await page.locator('img[alt="Moniteur Multiparamétrique Connecté"]').first().isVisible().catch(() => false));
    // Avatar affiché dans le header à côté du profil (image remplacée par le PNG local)
    check('avatar affiché dans le header (Admin Système)', await page.locator('header img[alt="Admin Système"]').isVisible().catch(() => false));
    check('rôle affiché sous le nom dans le header', await page.locator('header').getByText('Administrateur').first().isVisible().catch(() => false));

    // --- 4. Navigation entre onglets (via title, unique aux boutons de nav) ---
    console.log('\n▶ Navigation entre onglets');
    // Première visite de l'onglet : le chunk est chargé à la demande → skeleton affiché
    await page.route('**/components/TicketList.tsx*', async (route) => {
      await new Promise((r) => setTimeout(r, 600));
      await route.continue().catch(() => undefined); // la requête peut être re-déclenchée (StrictMode)
    });
    await page.getByTitle('Incidents & Signalements').click();
    await page.waitForSelector('[aria-label="Chargement de l\'onglet"]', { timeout: 5000 });
    check('skeleton affiché pendant le chargement de l\'onglet tickets', true);
    await page.waitForSelector('text=INC-2026', { timeout: 10000 });
    check('onglet tickets : codes INC affichés', await page.getByText('INC-2026').first().isVisible());

    await page.getByTitle('Base de Connaissances').click();
    await page.waitForSelector('text=Résolution des Bruits Parasites', { timeout: 10000 });
    check('onglet connaissances : fiche seedée affichée', true);

    const errBeforeAnalytics = pageErrors.length;
    await page.getByTitle('Supervision & Tableaux').click();
    await page.waitForTimeout(1800);
    check('onglet supervision : rendu sans erreur React', pageErrors.length === errBeforeAnalytics, pageErrors.slice(errBeforeAnalytics));

    await page.getByTitle('Alertes Critiques & MTTR').click();
    await page.waitForTimeout(1200);
    check('onglet alertes : rendu sans erreur React', pageErrors.length === errBeforeAnalytics, pageErrors.slice(errBeforeAnalytics));

    await page.getByTitle('Administration & Audit').click();
    await page.waitForSelector('text=Gestion des Acteurs', { timeout: 10000 });
    check('onglet admin : gestion des acteurs affichée', true);

    // --- 4bis. Création d'un acteur avec image/avatar ---
    console.log('\n▶ Création d\'un acteur avec avatar');
    await page.getByRole('button', { name: /Créer un Nouvel Acteur/ }).click();
    await page.waitForSelector('text=Créer un Nouvel Acteur Biomédical', { timeout: 10000 });
    await page.locator('input[placeholder="Ex: Dr. Raveloson Jean"]').fill('Acteur E2E Test');
    await page.locator('input[type="email"]').fill('acteur.e2e@sante.mg');
    await page.locator('button[title="Utiliser cet avatar"]').first().click();
    check('champ URL image présent', (await page.locator('input[placeholder="https://.../photo.jpg"]').count()) === 1);
    // Upload d'une image depuis l'ordinateur (fichier local → data URL redimensionnée)
    const tmpPng = path.join(tempDir!, 'upload-test.png');
    fs.writeFileSync(tmpPng, TINY_PNG);
    await page.locator('input[type="file"]').first().setInputFiles(tmpPng);
    await page.waitForSelector('img[src^="data:image/"]', { timeout: 8000 });
    check('photo importée depuis l\'ordinateur (aperçu data URL)', true);
    const avatarField = await page.locator('input[placeholder="https://.../photo.jpg"]').inputValue();
    check('champ URL prérempli par l\'image importée', avatarField.startsWith('data:image/'));
    await page.getByRole('button', { name: /Créer l\'Acteur/ }).click();
    // Carte acteur (nom exact) : l'<option> du sélecteur de profil contient aussi ce texte
    await page.getByText('Acteur E2E Test', { exact: true }).first().waitFor({ timeout: 10000 });
    check('acteur créé avec avatar, visible dans la liste', true);

    // --- 4ter. Champ photo dans le formulaire d'équipement ---
    console.log('\n▶ Formulaire matériel : champ photo');
    await page.getByRole('button', { name: /Gestion du Parc Équipements/ }).click();
    await page.waitForSelector('text=Nouveau Matériel', { timeout: 10000 });
    await page.getByRole('button', { name: /Nouveau Matériel/ }).click();
    await page.waitForSelector('text=Enregistrer un Nouvel Équipement', { timeout: 10000 });
    check('champ photo équipement présent', await page.getByText('Photo / Image de l\'Équipement').isVisible());
    check('photos suggérées proposées', (await page.locator('button[title="Utiliser cette photo"]').count()) >= 3);
    await page.locator('button[title="Utiliser cette photo"]').first().click();
    check('aperçu photo mis à jour', await page.locator('img[alt="Aperçu équipement"]').isVisible());
    // Upload d'une image locale dans le formulaire équipement
    await page.locator('input[type="file"]').first().setInputFiles(tmpPng);
    await page.waitForSelector('img[src^="data:image/"]', { timeout: 8000 });
    check('photo équipement importée depuis l\'ordinateur', true);
    await page.getByRole('button', { name: 'Annuler' }).click();

    // --- 5. Création d'un ticket via l'UI ---
    console.log('\n▶ Création d\'un ticket (formulaire complet)');
    await page.getByRole('button', { name: /Signaler Panne/ }).click();
    await page.waitForSelector('text=Signaler une Panne', { timeout: 10000 });
    check('modal de signalement ouverte', await page.getByText('Signaler une Panne').isVisible());

    await page.fill('textarea', 'Test E2E : écran noir au démarrage pendant un télé-examen.');
    await page.getByRole('button', { name: /Code d\'erreur affiché/ }).click();
    await page.getByRole('button', { name: /Transmettre le Signalement/ }).click();
    // On revient sur l'onglet tickets : le nouveau signalement est en tête de liste.
    // La description n'est visible qu'une fois la carte développée.
    await page.getByTitle('Incidents & Signalements').click();
    await page.locator('button[title="Développer les détails"]').first().click();
    await page.waitForSelector('text=Test E2E : écran noir au démarrage', { timeout: 10000 });
    check('ticket créé via l\'UI (description visible)', true);

    // --- 6. Changement de compte : uniquement via déconnexion → nouvelle connexion ---
    console.log('\n▶ Changement de compte (déconnexion → connexion ingénieure)');
    // Le sélecteur de comptes a disparu du header (les comptes des autres acteurs ne sont plus listés)
    const profileSelect = page.locator('header select').filter({ has: page.locator('option[value="usr-eng-01"]') });
    check('aucun sélecteur de compte dans le header', (await profileSelect.count()) === 0);
    await page.getByTitle('Se déconnecter de la plateforme').click();
    await page.waitForSelector('input[type="email"]', { timeout: 8000 });
    await page.locator('input[type="email"]').fill('b.rakoto@sante.mg');
    await page.locator('input[type="password"]').fill('biomed123');
    await page.locator('button[type="submit"]').click();
    await page.waitForSelector('text=Connexion Réussie', { timeout: 10000 });
    check('connexion en tant que Dr. Bakoly Rakoto', true);
    await page.waitForSelector('text=Dr. Bakoly Rakoto', { timeout: 8000 });
    check('compte ingénieure affiché dans le header', await page.locator('header').getByText('Dr. Bakoly Rakoto').isVisible());

    // --- 7. Déconnexion ---
    console.log('\n▶ Déconnexion');
    await page.getByTitle('Se déconnecter de la plateforme').click();
    await page.waitForSelector('input[type="email"]', { timeout: 8000 });
    check('retour à l\'écran de connexion', await page.locator('input[type="email"]').isVisible());

    // --- 8. Erreurs console / React ---
    console.log('\n▶ Erreurs console & React');
    const benign = (e: string) => e.includes('favicon');
    const realErrors = consoleErrors.filter((e) => !benign(e));
    check('aucune erreur console', realErrors.length === 0, realErrors);
    check('aucune exception React', pageErrors.length === 0, pageErrors);
  } catch (err) {
    failed += 1;
    failures.push(`exception pendant le parcours : ${String(err)}`);
    console.error(`❌ ${String(err)}`);
    await page.screenshot({ path: path.join(ROOT, 'e2e', 'failure.png'), fullPage: true }).catch(() => undefined);
  } finally {
    await browser.close();
    await stopServer();
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Résultat : ${passed} réussis, ${failed} échec(s)`);
  if (failures.length > 0) {
    console.error('Échecs :');
    for (const f of failures) console.error(`  - ${f}`);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  process.exit(failed > 0 ? 1 : 0);
}

void main();
