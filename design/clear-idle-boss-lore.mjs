// Norman (2026-09-18) : "j'aimerai que tu enlèves toutes les descriptions
// pré NGU perfect [...] Ces textes ne sont plus valables." Les colonnes
// Histoire/Conseil de IDLE_BOSS (affichées en combat via
// histoireBossMarkupIdleV142_, Soreal_Idle_UI.html) contiennent du texte
// 100% inventé par SOREAL (ex: "Le vieux Maxity a décidé qu'il n'avait
// plus besoin de conducteur", des Conseil référençant Fureur/Bouclier —
// des mécaniques SOREAL depuis retirées au profit du combat Attaque-vs-
// Défense pur du wiki NGU, voir bossCatalogueSorealIdle_ dans
// idle-sqlite-runtime.js). Le vrai wiki NGU Idle n'a pas de texte
// narratif par monstre/boss (juste noms, PV, Attaque, zone) : il n'y a
// donc rien de "wiki" à traduire pour remplacer ce texte — on le vide.
//
// Contrairement à push-idle-boss-extension.mjs (additif, ON CONFLICT DO
// NOTHING), ce script lit d'abord l'état RÉEL de IDLE_BOSS en prod
// (/api/admin/idle-catalog-read), vide seulement Histoire et Conseil sur
// CHAQUE ligne (garde tout le reste identique : PV, Attaque, images...),
// puis réécrit la feuille entière via /api/admin/idle-catalog-replace
// (remplacement réel, pas un complément). L'affichage gère déjà
// l'absence de lore (histoireBossMarkupIdleV142_ retourne '' si les deux
// champs sont vides) — aucun changement de code nécessaire.
//
// Utilisation :
//   SOREAL_IDLE_CATALOG_SECRET=<secret> node design/clear-idle-boss-lore.mjs
//
// Ajouter --dry-run pour prévisualiser sans écrire (affiche seulement
// combien de lignes seraient modifiées et un exemple avant/après).

const secret = process.env.SOREAL_IDLE_CATALOG_SECRET;
if (!secret) {
  console.error('SOREAL_IDLE_CATALOG_SECRET manquant (variable d\'environnement).');
  process.exit(1);
}

const dryRun = process.argv.includes('--dry-run');
const BASE = 'https://soreal-tv.technicien-soreal.workers.dev';
const HEADERS = { 'x-soreal-idle-catalog-secret': secret, 'content-type': 'application/json' };

// Même ordre de colonnes que push-idle-boss-extension.mjs.
const COLUMNS = [
  'ID', 'Nom', 'PV', 'Attaque', 'XP', 'Pieces', 'ChanceLoot', 'Image', 'Actif', 'DriveFileID',
  'Capacite1', 'Intervalle1', 'Valeur1', 'Duree1', 'Capacite2', 'Intervalle2', 'Valeur2', 'Duree2',
  'Capacite3', 'Intervalle3', 'Valeur3', 'Duree3', 'Histoire', 'MortVivant', 'Conseil', 'NiveauRequis'
];
const HISTOIRE_INDEX = COLUMNS.indexOf('Histoire');
const CONSEIL_INDEX = COLUMNS.indexOf('Conseil');

const readRes = await fetch(`${BASE}/api/admin/idle-catalog-read`, {
  method: 'POST',
  headers: HEADERS,
  body: JSON.stringify({ sheet: 'IDLE_BOSS' })
});
const readBody = await readRes.json();
if (!readRes.ok || !readBody?.ok) {
  console.error('Lecture IDLE_BOSS échouée :', readRes.status, JSON.stringify(readBody));
  process.exit(1);
}

const rows = Array.isArray(readBody.rows) ? readBody.rows : [];
console.log(`IDLE_BOSS : ${rows.length} ligne(s) lue(s).`);

let toClear = 0;
const now = Date.now();
const catalog = rows.map(({ row_index, row }) => {
  const next = [...row];
  const hadContent = Boolean(next[HISTOIRE_INDEX] || next[CONSEIL_INDEX]);
  if (hadContent) toClear++;
  if (dryRun && hadContent && toClear <= 3) {
    console.log(`  exemple ligne ${row_index} — Nom="${next[1]}"`);
    console.log(`    Histoire avant: ${JSON.stringify(next[HISTOIRE_INDEX])}`);
    console.log(`    Conseil avant : ${JSON.stringify(next[CONSEIL_INDEX])}`);
  }
  next[HISTOIRE_INDEX] = '';
  next[CONSEIL_INDEX] = '';
  return {
    sheet_name: 'IDLE_BOSS',
    row_index,
    row_json: next.map(v => String(v ?? '')),
    updated_at: now
  };
});

console.log(`${toClear} ligne(s) avaient du contenu Histoire/Conseil à vider.`);

if (dryRun) {
  console.log('--dry-run : rien écrit. Relancer sans ce flag pour appliquer.');
  process.exit(0);
}

if (!catalog.length) {
  console.error('Aucune ligne à écrire, abandon (rien envoyé).');
  process.exit(1);
}

const writeRes = await fetch(`${BASE}/api/admin/idle-catalog-replace`, {
  method: 'POST',
  headers: HEADERS,
  body: JSON.stringify({ sheets: ['IDLE_BOSS'], catalog })
});
console.log(writeRes.status, await writeRes.text());
