// Norman (2026-09-18, en direct) : "Je veux que les noms des boss soient
// traduits quand ils peuvent l'être."
//
// La colonne Nom de IDLE_BOSS porte actuellement les vrais noms NGU en
// ANGLAIS (design/apply-idle-boss-real-names.mjs, session du 2026-09-18,
// déjà en prod). Ce script les traduit en français, en préservant le ton
// comique/absurde (design/ngu-boss-names-fr.json, 301 entrées {id, nomEn,
// nomFr}, produit par traduction par lot -- jamais un mot-à-mot littéral,
// et jamais forcé quand aucune traduction naturelle n'existe : nomFr peut
// alors être identique à nomEn, ce script ne touche pas ces lignes-là).
//
// Même principe de sécurité que apply-idle-boss-real-names.mjs : lit
// l'état RÉEL en prod (jamais de schéma de colonnes deviné), ne touche
// QUE la cellule Nom de chaque ligne existante, ne touche jamais
// Histoire/Conseil/MortVivant/Image/DriveFileID/... Un boss sans entrée
// dans ngu-boss-names-fr.json ou dont nomFr===nomEn reste tel quel, rien
// n'est inventé/forcé.
//
// Utilisation :
//   SOREAL_IDLE_CATALOG_SECRET=<secret> node design/apply-idle-boss-french-names.mjs --dry-run
//   SOREAL_IDLE_CATALOG_SECRET=<secret> node design/apply-idle-boss-french-names.mjs

import { readFileSync } from 'node:fs';

const secret = process.env.SOREAL_IDLE_CATALOG_SECRET;
if (!secret) {
  console.error('SOREAL_IDLE_CATALOG_SECRET manquant (variable d\'environnement).');
  process.exit(1);
}

const dryRun = process.argv.includes('--dry-run');
const BASE = 'https://soreal-tv.technicien-soreal.workers.dev';
const HEADERS = { 'x-soreal-idle-catalog-secret': secret, 'content-type': 'application/json' };

const frNames = JSON.parse(
  readFileSync(new URL('./ngu-boss-names-fr.json', import.meta.url), 'utf8')
);
const frById = new Map(
  frNames
    .filter(e => e && Number.isFinite(e.id) && String(e.nomFr || '').trim())
    .map(e => [e.id, { nomEn: String(e.nomEn || '').trim(), nomFr: String(e.nomFr).trim() }])
);
console.log(`${frById.size}/301 noms français disponibles.`);

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
console.log(`IDLE_BOSS : ${rows.length} ligne(s) lue(s) en prod (en-tête incluse).`);

const headerEntry = rows.find(r => r.row_index === 1);
if (!headerEntry || !Array.isArray(headerEntry.row)) {
  console.error('Ligne d\'en-tête (row_index=1) introuvable -- abandon, rien écrit.');
  process.exit(1);
}
const header = headerEntry.row;
const idIndex = header.findIndex(h => String(h || '').trim() === 'ID');
const nomIndex = header.findIndex(h => String(h || '').trim() === 'Nom');
if (idIndex < 0 || nomIndex < 0) {
  console.error(`Colonne ID (${idIndex}) ou Nom (${nomIndex}) introuvable dans l'en-tête réelle : ${JSON.stringify(header)} -- abandon.`);
  process.exit(1);
}
console.log(`En-tête réelle (${header.length} colonnes) : ID=index ${idIndex}, Nom=index ${nomIndex}.`);

let updated = 0, unchanged = 0, noTranslation = 0, mismatchedCurrent = 0;
const examples = [];
const finalRows = [{ row_index: 1, row: header }];

for (const { row_index, row } of rows) {
  if (row_index === 1) continue;
  const id = Math.floor(Number(row[idIndex]));
  const entry = Number.isFinite(id) ? frById.get(id) : undefined;
  const current = String(row[nomIndex] ?? '').trim();

  if (!entry) {
    finalRows.push({ row_index, row });
    noTranslation++;
    continue;
  }

  if (entry.nomEn === entry.nomFr) {
    // Jugé intraduisible par l'agent de traduction -- rien à changer, le nom anglais reste.
    finalRows.push({ row_index, row });
    unchanged++;
    continue;
  }

  if (current !== entry.nomEn && current !== entry.nomFr) {
    // Le nom actuel en prod ne correspond ni à l'anglais attendu ni au
    // français cible (catalogue modifié entre-temps) -- on ne l'écrase
    // pas à l'aveugle, on le signale et on le laisse tel quel.
    finalRows.push({ row_index, row });
    mismatchedCurrent++;
    if (examples.length < 5) examples.push({ id, row_index, note: 'MISMATCH', current, expectedEn: entry.nomEn, nomFr: entry.nomFr });
    continue;
  }

  if (current === entry.nomFr) {
    finalRows.push({ row_index, row });
    unchanged++;
    continue;
  }

  const next = [...row];
  next[nomIndex] = entry.nomFr;
  if (examples.length < 5) examples.push({ id, row_index, before: current, after: entry.nomFr });
  finalRows.push({ row_index, row: next });
  updated++;
}

console.log(`Résultat : ${updated} nom(s) traduit(s), ${unchanged} déjà correct(s)/non traduisible(s), ${noTranslation} sans entrée française, ${mismatchedCurrent} ignoré(s) (nom actuel inattendu, rien écrasé).`);
if (examples.length) {
  console.log('Exemples :');
  for (const e of examples) {
    if (e.note === 'MISMATCH') {
      console.log(`  ligne ${e.row_index} (id ${e.id}) MISMATCH : actuel="${e.current}" attendu_en="${e.expectedEn}" -- ignoré.`);
    } else {
      console.log(`  ligne ${e.row_index} (id ${e.id}) : "${e.before}" -> "${e.after}"`);
    }
  }
}

if (dryRun) {
  console.log('--dry-run : rien écrit. Relancer sans ce flag pour appliquer.');
  process.exit(0);
}

if (!updated) {
  console.log('Rien à changer -- aucun appel d\'écriture effectué.');
  process.exit(0);
}

const now = Date.now();
const catalog = finalRows.map(({ row_index, row }) => ({
  sheet_name: 'IDLE_BOSS',
  row_index,
  row_json: row.map(v => String(v ?? '')),
  updated_at: now
}));

const writeRes = await fetch(`${BASE}/api/admin/idle-catalog-replace`, {
  method: 'POST',
  headers: HEADERS,
  body: JSON.stringify({ sheets: ['IDLE_BOSS'], catalog })
});
console.log(writeRes.status, await writeRes.text());
