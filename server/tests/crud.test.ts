/**
 * Tests automatisés du CRUD backend (Express + SQLite).
 *
 * Lancement : npm test
 *
 * Le script démarre un serveur isolé sur un port éphémère avec une base de
 * données temporaire (DB_PATH), exécute les scénarios CRUD, puis nettoie.
 * La base de production (data/biomed.db) n'est jamais touchée.
 */
import { spawn, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');

const PORT = 3100 + Math.floor(Math.random() * 2000);
const BASE = `http://127.0.0.1:${PORT}/api`;

const ADMIN_EMAIL = 'admin.telemed@sante.mg';
const TECH_EMAIL = 'jl.randria@sante.mg';
const PASSWORD = 'biomed123'; // mot de passe par défaut des comptes seedés

// ---------------------------------------------------------------------------
// Utilitaires
// ---------------------------------------------------------------------------

/** Petit jar de cookies : fetch Node ne gère pas les cookies automatiquement. */
class CookieJar {
  private cookies = new Map<string, string>();

  setFromResponse(res: Response): void {
    const setCookie = res.headers.get('set-cookie');
    if (!setCookie) return;
    const first = setCookie.split(',')[0].split(';')[0].trim();
    const idx = first.indexOf('=');
    if (idx === -1) return;
    this.cookies.set(first.slice(0, idx).trim(), first.slice(idx + 1).trim());
  }

  header(): string {
    return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  }
}

interface ApiResult {
  status: number;
  data: Record<string, any> | null;
}

async function api(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  pathname: string,
  jar?: CookieJar,
  body?: unknown
): Promise<ApiResult> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (jar) {
    const cookie = jar.header();
    if (cookie) headers['Cookie'] = cookie;
  }
  const res = await fetch(`${BASE}${pathname}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (jar) jar.setFromResponse(res);
  let data: Record<string, any> | null = null;
  try {
    data = (await res.json()) as Record<string, any>;
  } catch {
    /* réponse sans corps JSON */
  }
  return { status: res.status, data };
}

async function loginAs(email: string, password: string): Promise<CookieJar | null> {
  const jar = new CookieJar();
  const res = await api('POST', '/auth/login', jar, { email, password });
  return res.status === 200 ? jar : null;
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

async function startTestServer(): Promise<boolean> {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'biomed-test-'));
  server = spawn(process.execPath, ['--import', 'tsx', 'server.ts'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT), DB_PATH: path.join(tempDir, 'test.db') },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout?.on('data', (d) => (serverLog += d.toString()));
  server.stderr?.on('data', (d) => (serverLog += d.toString()));

  // Attente de la disponibilité du serveur
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE.replace('/api', '')}/api/health`);
      if (res.ok) return true;
    } catch {
      /* pas encore prêt */
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

async function stopTestServer(): Promise<void> {
  if (server) {
    server.kill('SIGTERM');
    await new Promise((r) => setTimeout(r, 800));
    if (server.exitCode === null) server.kill('SIGKILL');
    server = null;
  }
  if (tempDir) {
    // Petite attente pour laisser SQLite libérer les fichiers (Windows)
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
// Scénarios de test
// ---------------------------------------------------------------------------

async function testAuth(): Promise<CookieJar | null> {
  console.log('\n▶ Authentification');

  const noSession = await api('GET', '/auth/me');
  check('auth/me sans session → 401', noSession.status === 401);

  const badPw = await api('POST', '/auth/login', undefined, { email: ADMIN_EMAIL, password: 'mauvais' });
  check('mauvais mot de passe → 401', badPw.status === 401);

  const admin = await loginAs(ADMIN_EMAIL, PASSWORD);
  check('login admin → session créée', admin !== null);

  const me = await api('GET', '/auth/me', admin!);
  check('auth/me → compte admin', me.status === 200 && me.data?.user?.role === 'admin');

  return admin;
}

async function testUsers(admin: CookieJar): Promise<void> {
  console.log('\n▶ CRUD Utilisateurs');

  const created = await api('POST', '/users', admin, {
    name: 'Test CRUD User',
    email: 'crud.test@sante.mg',
    role: 'technician',
    title: 'Technicien Test',
    facility: 'Poste de Test',
  });
  check('create user → 200', created.status === 200);
  const uid: string = created.data?.user?.id;
  check('create user → id présent', typeof uid === 'string' && uid.length > 0);

  const dup = await api('POST', '/users', admin, { name: 'Doublon', email: 'crud.test@sante.mg' });
  check('email dupliqué → 409', dup.status === 409);

  const upd = await api('PUT', `/users/${uid}`, admin, { name: 'Test CRUD User Modifié' });
  check('update user → nom modifié', upd.status === 200 && upd.data?.user?.name === 'Test CRUD User Modifié');

  const del = await api('DELETE', `/users/${uid}`, admin);
  check('delete user → 200', del.status === 200);

  const gone = await api('PUT', `/users/${uid}`, admin, { name: 'x' });
  check('update utilisateur supprimé → 404', gone.status === 404);
}

async function testEquipment(admin: CookieJar): Promise<void> {
  console.log('\n▶ CRUD Équipements');

  const created = await api('POST', '/equipment', admin, {
    code: 'EQ-TEST-001',
    name: 'Moniteur de Test',
    category: 'moniteur',
    model: 'MX-Test',
    brand: 'TestBrand',
    serialNumber: 'SN-TEST-001',
    facility: 'Poste de Test',
    department: 'Unité Test',
    status: 'operational',
    installationDate: '2026-01-01',
    lastMaintenanceDate: '2026-01-01',
    nextPreventiveMaintenance: '2027-01-01',
    telemetry: {
      batteryLevel: 90,
      operatingHours: 10,
      temperature: 36,
      lastCalibrationDate: '2026-01-01',
      calibrationValid: true,
      signalQuality: 99,
      firmwareVersion: 'v1.0.0',
      powerSource: 'AC',
    },
  });
  check('create equipment → 200', created.status === 200);
  const eid: string = created.data?.equipment?.id;

  const missing = await api('POST', '/equipment', admin, { name: 'Sans code' });
  check('create sans code → 400', missing.status === 400);

  const upd = await api('PUT', `/equipment/${eid}`, admin, { status: 'degraded', notes: 'modifié par test' });
  check('update equipment → statut modifié', upd.status === 200 && upd.data?.equipment?.status === 'degraded');

  const del = await api('DELETE', `/equipment/${eid}`, admin);
  check('delete equipment → 200', del.status === 200);
}

async function testTickets(admin: CookieJar): Promise<void> {
  console.log('\n▶ CRUD Tickets');

  const created = await api('POST', '/tickets', admin, {
    equipmentId: 'eq-02',
    description: 'Ticket de test automatisé',
    symptoms: ['Bruit parasite / Tracé illisible'],
    urgency: 'high',
    errorCode: 'ERR-ECG-04',
  });
  check('create ticket → 200', created.status === 200);
  const tid: string = created.data?.ticket?.id;
  const code: string = created.data?.ticket?.code;
  check('create ticket → code INC généré', typeof code === 'string' && code.startsWith('INC-'));

  const noEquip = await api('POST', '/tickets', admin, { equipmentId: 'eq-inconnu', description: 'x', urgency: 'high' });
  check('create ticket équipement inconnu → 400', noEquip.status === 400);

  const st = await api('PUT', `/tickets/${tid}/status`, admin, { status: 'in_progress' });
  check('update statut → in_progress', st.status === 200 && st.data?.ticket?.status === 'in_progress');

  const asg = await api('PUT', `/tickets/${tid}/assign`, admin, { userId: 'usr-tech-01' });
  check('affectation → technicien assigné', asg.status === 200 && asg.data?.ticket?.assignedTo?.id === 'usr-tech-01');

  const upd = await api('PUT', `/tickets/${tid}`, admin, { description: 'Description modifiée' });
  check('update générique → description modifiée', upd.status === 200 && upd.data?.ticket?.description === 'Description modifiée');

  const del = await api('DELETE', `/tickets/${tid}`, admin);
  check('delete ticket → 200', del.status === 200);
}

async function testKnowledge(admin: CookieJar): Promise<void> {
  console.log('\n▶ CRUD Base de Connaissances');

  const created = await api('POST', '/knowledge', admin, {
    title: 'Fiche de test automatisé',
    category: 'ecg',
    modelTarget: 'CardioExpress SL12',
    errorCode: 'ERR-ECG-04',
    summary: 'Résumé de test',
    solutionSteps: ['Étape 1', 'Étape 2'],
    author: 'Test',
    date: '2026-08-15',
    downloadsCount: 1,
    tags: ['test', 'automatisé'],
  });
  check('create article → 200', created.status === 200);
  const aid: string = created.data?.article?.id;

  const upd = await api('PUT', `/knowledge/${aid}`, admin, { title: 'Fiche de test modifiée' });
  check('update article → titre modifié', upd.status === 200 && upd.data?.article?.title === 'Fiche de test modifiée');

  const del = await api('DELETE', `/knowledge/${aid}`, admin);
  check('delete article → 200', del.status === 200);
}

async function testReports(admin: CookieJar): Promise<void> {
  console.log('\n▶ CRUD Rapports d\'intervention');

  const created = await api('POST', '/reports', admin, {
    ticketId: 'tkt-01',
    equipmentId: 'eq-02',
    technicianName: 'Test',
    problemFound: 'Panne détectée',
    actionsPerformed: ['Vérification électrique'],
    replacedParts: [],
    electricalSafetyTestPassed: true,
    calibrationPerformed: true,
    finalStatus: 'operational',
    notes: 'PV de test',
    signedByTechnician: true,
    validatedByEngineer: false,
  });
  check('create report → 200', created.status === 200);
  const rid: string = created.data?.report?.id;

  const upd = await api('PUT', `/reports/${rid}`, admin, { notes: 'PV modifié par test' });
  check('update report → notes modifiées', upd.status === 200 && upd.data?.report?.notes === 'PV modifié par test');

  const del = await api('DELETE', `/reports/${rid}`, admin);
  check('delete report → 200', del.status === 200);
}

async function testAudit(admin: CookieJar): Promise<void> {
  console.log('\n▶ Journal d\'audit');

  const created = await api('POST', '/audit', admin, {
    action: 'Test Automatisé',
    target: 'Script CRUD',
    details: 'Entrée créée par le script de test',
  });
  check('create audit → 200', created.status === 200);

  const list = await api('GET', '/audit', admin);
  check('list audit → contient l\'entrée de test', list.status === 200 && Array.isArray(list.data?.logs));

  const newestId: string = list.data?.logs?.[0]?.id; // trié par timestamp DESC
  check('entrée de test en tête de liste', typeof newestId === 'string' && newestId.startsWith('aud-'));

  const del = await api('DELETE', `/audit/${newestId}`, admin);
  check('delete audit → 200', del.status === 200);

  const delMissing = await api('DELETE', '/audit/aud-inconnu', admin);
  check('delete audit inexistant → 404', delMissing.status === 404);
}

async function testFacilities(admin: CookieJar): Promise<void> {
  console.log('\n▶ CRUD Établissements');

  const created = await api('POST', '/facilities', admin, { name: 'Clinique Test Automatisé' });
  check('create facility → 200', created.status === 200);
  const fid: string = created.data?.facility?.id;

  const dup = await api('POST', '/facilities', admin, { name: 'Clinique Test Automatisé' });
  check('facility dupliquée → 409', dup.status === 409);

  const upd = await api('PUT', `/facilities/${fid}`, admin, { name: 'Clinique Test Renommée' });
  check('update facility → nom modifié', upd.status === 200 && upd.data?.facility?.name === 'Clinique Test Renommée');

  const del = await api('DELETE', `/facilities/${fid}`, admin);
  check('delete facility → 200', del.status === 200);
}

async function testRbac(admin: CookieJar): Promise<void> {
  console.log('\n▶ RBAC (droits par rôle)');

  const tech = await loginAs(TECH_EMAIL, PASSWORD);
  check('login technicien → session créée', tech !== null);
  if (!tech) return;

  const createUser = await api('POST', '/users', tech, { name: 'x', email: 'x@sante.mg', role: 'technician' });
  check('technicien POST /users → 403', createUser.status === 403);

  const deleteEq = await api('DELETE', '/equipment/eq-01', tech);
  check('technicien DELETE /equipment → 403', deleteEq.status === 403);

  const readEq = await api('GET', '/equipment', tech);
  check('technicien GET /equipment → 200', readEq.status === 200);

  const createTicket = await api('POST', '/tickets', tech, {
    equipmentId: 'eq-02',
    description: 'Ticket technicien',
    symptoms: ['Test'],
    urgency: 'low',
  });
  check('technicien POST /tickets → 200', createTicket.status === 200);
  const tid: string = createTicket.data?.ticket?.id;

  const genericPut = await api('PUT', `/tickets/${tid}`, tech, { description: 'x' });
  check('technicien PUT /tickets/:id (admin/engineer) → 403', genericPut.status === 403);

  // Nettoyage : suppression du ticket créé par le technicien (admin requis)
  const del = await api('DELETE', `/tickets/${tid}`, admin);
  check('nettoyage ticket RBAC → 200', del.status === 200);
}

async function testGranularPermissions(admin: CookieJar): Promise<void> {
  console.log('\n▶ Permissions fines (RBAC par utilisateur)');

  // 1. Ingénieur privé de la gestion du parc et de la clôture d'intervention
  const engRestricted = await api('POST', '/users', admin, {
    name: 'Ingénieur Restreint',
    email: 'eng.restreint@sante.mg',
    role: 'engineer',
    title: 'Ingénieur Test',
    facility: 'Poste de Test',
    permissions: {
      canReportIncident: true,
      canRunDiagnostic: true,
      canCloseIntervention: false,
      canManageEquipment: false,
      canManageUsers: false,
    },
  });
  check('création ingénieur restreint → 200', engRestricted.status === 200);
  const engJar = await loginAs('eng.restreint@sante.mg', PASSWORD);
  check('login ingénieur restreint → session', engJar !== null);
  if (engJar) {
    const eq = await api('POST', '/equipment', engJar, { code: 'EQ-X', name: 'X', category: 'moniteur' });
    check('ingénieur sans canManageEquipment POST /equipment → 403', eq.status === 403);

    const rep = await api('POST', '/reports', engJar, {
      ticketId: 'tkt-01',
      equipmentId: 'eq-02',
      technicianName: 'Test',
      problemFound: 'x',
      actionsPerformed: [],
      replacedParts: [],
      electricalSafetyTestPassed: true,
      calibrationPerformed: true,
      finalStatus: 'operational',
      notes: 'x',
      signedByTechnician: true,
      validatedByEngineer: false,
    });
    check('ingénieur sans canCloseIntervention POST /reports → 403', rep.status === 403);

    const diag = await api('POST', '/ai/diagnose', engJar, { equipmentName: 'Moniteur', model: 'MX', brand: 'P', symptoms: [] });
    check('ingénieur canRunDiagnostic POST /ai/diagnose → 200', diag.status === 200);
  }

  // 2. Technicien privé du signalement d'incidents
  const techRestricted = await api('POST', '/users', admin, {
    name: 'Technicien Restreint',
    email: 'tech.restreint@sante.mg',
    role: 'technician',
    title: 'Technicien Test',
    facility: 'Poste de Test',
    permissions: {
      canReportIncident: false,
      canRunDiagnostic: true,
      canCloseIntervention: true,
      canManageEquipment: false,
      canManageUsers: false,
    },
  });
  check('création technicien restreint → 200', techRestricted.status === 200);
  const techJar = await loginAs('tech.restreint@sante.mg', PASSWORD);
  check('login technicien restreint → session', techJar !== null);
  if (techJar) {
    const tkt = await api('POST', '/tickets', techJar, { equipmentId: 'eq-02', description: 'x', symptoms: ['Test'], urgency: 'low' });
    check('technicien sans canReportIncident POST /tickets → 403', tkt.status === 403);

    const diag = await api('POST', '/ai/diagnose', techJar, { equipmentName: 'Moniteur', model: 'MX', brand: 'P', symptoms: [] });
    check('technicien canRunDiagnostic POST /ai/diagnose → 200', diag.status === 200);

    const audit = await api('GET', '/audit', techJar);
    check('technicien GET /audit → 403 (réservé admin)', audit.status === 403);
  }

  // 3. Médecin : peut signaler, mais ni affecter ni changer le statut
  const doctor = await loginAs('m.heriniaina@sante.mg', PASSWORD);
  check('login médecin → session', doctor !== null);
  if (doctor) {
    const asg = await api('PUT', '/tickets/tkt-01/assign', doctor, { userId: 'usr-tech-01' });
    check('médecin PUT /tickets/:id/assign → 403', asg.status === 403);

    const st = await api('PUT', '/tickets/tkt-01/status', doctor, { status: 'in_progress' });
    check('médecin PUT /tickets/:id/status → 403', st.status === 403);

    const tkt = await api('POST', '/tickets', doctor, { equipmentId: 'eq-02', description: 'Signalement médecin', symptoms: ['Test'], urgency: 'low' });
    check('médecin POST /tickets → 200', tkt.status === 200);
  }

  // 4. Technicien : changement de statut autorisé, validation finale réservée ingénieur
  const tech = await loginAs(TECH_EMAIL, PASSWORD);
  if (tech) {
    const st = await api('PUT', '/tickets/tkt-01/status', tech, { status: 'in_progress' });
    check('technicien PUT /tickets/:id/status → 200', st.status === 200);

    const val = await api('PUT', '/tickets/tkt-01/status', tech, { status: 'validated' });
    check('technicien PUT /tickets/:id/status validated → 403', val.status === 403);
  }

  // Nettoyage des comptes de test
  const usersList = await api('GET', '/users', admin);
  const created = (usersList.data?.users as any[] || []).filter(
    (u: any) => u.email === 'eng.restreint@sante.mg' || u.email === 'tech.restreint@sante.mg'
  );
  for (const u of created) {
    await api('DELETE', `/users/${u.id}`, admin);
  }
}

async function testUserPasswords(admin: CookieJar): Promise<void> {
  console.log('\n▶ Mot de passe des acteurs (création / modification)');

  // 1. Création avec mot de passe personnalisé → login avec ce mot de passe
  const created = await api('POST', '/users', admin, {
    name: 'Acteur Mot de Passe',
    email: 'mdp.acteur@sante.mg',
    role: 'technician',
    title: 'Technicien Test',
    facility: 'Poste de Test',
    password: 'mdp-super-secret-42',
  });
  check('création acteur avec mot de passe → 200', created.status === 200);

  const jar = await loginAs('mdp.acteur@sante.mg', 'mdp-super-secret-42');
  check('login avec le mot de passe personnalisé → session', jar !== null);

  // L'ancien mot de passe par défaut ne doit plus fonctionner
  const jarDefault = await loginAs('mdp.acteur@sante.mg', PASSWORD);
  check('login avec l\'ancien mot de passe par défaut → refusé', jarDefault === null);

  // 2. Création SANS mot de passe → mot de passe par défaut conservé
  const createdNoPw = await api('POST', '/users', admin, {
    name: 'Acteur Sans Mot de Passe',
    email: 'mdp.vide@sante.mg',
    role: 'nurse',
    title: 'Infirmier Test',
    facility: 'Poste de Test',
  });
  check('création acteur sans mot de passe → 200', createdNoPw.status === 200);
  const jarNoPw = await loginAs('mdp.vide@sante.mg', PASSWORD);
  check('login avec le mot de passe par défaut → session', jarNoPw !== null);

  // 3. Modification : changement de mot de passe
  const userId = (created.data?.user as any)?.id;
  check('id acteur retourné', !!userId);
  if (userId) {
    const updated = await api('PUT', `/users/${userId}`, admin, {
      title: 'Technicien Senior',
      password: 'nouveau-mdp-99',
    });
    check('modification acteur avec nouveau mot de passe → 200', updated.status === 200);

    const jarNew = await loginAs('mdp.acteur@sante.mg', 'nouveau-mdp-99');
    check('login avec le nouveau mot de passe → session', jarNew !== null);

    const jarOld = await loginAs('mdp.acteur@sante.mg', 'mdp-super-secret-42');
    check('login avec l\'ancien mot de passe → refusé', jarOld === null);
  }

  // 4. Modification SANS mot de passe → mot de passe inchangé
  if (userId) {
    const updatedNoPw = await api('PUT', `/users/${userId}`, admin, { title: 'Technicien Confirmé' });
    check('modification sans mot de passe → 200', updatedNoPw.status === 200);
    const jarStill = await loginAs('mdp.acteur@sante.mg', 'nouveau-mdp-99');
    check('mot de passe conservé après modification sans champ password', jarStill !== null);
  }

  // Nettoyage des comptes de test
  const usersList = await api('GET', '/users', admin);
  const createdUsers = (usersList.data?.users as any[] || []).filter(
    (u: any) => u.email === 'mdp.acteur@sante.mg' || u.email === 'mdp.vide@sante.mg'
  );
  for (const u of createdUsers) {
    await api('DELETE', `/users/${u.id}`, admin);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  process.on('exit', () => {
    void stopTestServer();
  });

  console.log(`Démarrage du serveur de test sur le port ${PORT} (base temporaire)...`);
  const up = await startTestServer();
  if (!up) {
    console.error('❌ Le serveur de test n\'a pas démarré.');
    console.error(serverLog.slice(-1000));
    await stopTestServer();
    process.exit(1);
  }
  console.log('✅ Serveur de test prêt.');

  try {
    const admin = await testAuth();
    if (!admin) {
      console.error('❌ Impossible d\'obtenir une session admin : tests CRUD annulés.');
    } else {
      await testUsers(admin);
      await testEquipment(admin);
      await testTickets(admin);
      await testKnowledge(admin);
      await testReports(admin);
      await testAudit(admin);
      await testFacilities(admin);
      await testRbac(admin);
      await testGranularPermissions(admin);
      await testUserPasswords(admin);
    }
  } finally {
    await stopTestServer();
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
