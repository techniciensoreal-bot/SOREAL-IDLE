// Norman (2026-09-18, en direct) : "il y a une histoire qui se déverrouille
// dans le bestiaire. Je veux que cette petite histoire soit en dessous du
// combat dans Fight Boss. Pour chaque boss et traduit en français."
//
// La colonne Histoire de IDLE_BOSS a été explicitement VIDÉE le 2026-09-18
// (design/clear-idle-boss-lore.mjs) car son contenu d'alors était 100%
// inventé par SOREAL et sans rapport avec le wiki -- elle est donc vide
// pour les boss 1-20 existants, et les boss 21-301 ajoutés le même jour
// (design/apply-idle-boss-real-names.mjs) n'ont jamais eu de colonne
// Histoire renseignée non plus. Ce script la remplit avec la VRAIE
// histoire du wiki NGU (design/extract-ngu-boss-stories.mjs,
// design/ngu-boss-stories-en.json), traduite en français par lot
// (design/ngu-boss-stories-fr.json, fusion des 6 lots de traduction).
//
// Même principe de sécurité que apply-idle-boss-real-names.mjs : lit
// l'état RÉEL en prod (jamais de schéma de colonnes deviné), ne touche
// QUE la cellule Histoire de chaque ligne existante, ne touche jamais
// Nom/Conseil/MortVivant/Image/... Un boss sans histoire disponible
// (ex. les "Intermission" 272-289, un stub sans page wiki dédiée) reste
// tel quel, rien n'est inventé.
//
// Utilisation :
//   SOREAL_IDLE_CATALOG_SECRET=<secret> node design/apply-idle-boss-stories.mjs --dry-run
//   SOREAL_IDLE_CATALOG_SECRET=<secret> node design/apply-idle-boss-stories.mjs

import { readFileSync } from 'node:fs';

const secret = process.env.SOREAL_IDLE_CATALOG_SECRET;
if (!secret) {
  console.error('SOREAL_IDLE_CATALOG_SECRET manquant (variable d\'environnement).');
  process.exit(1);
}

const dryRun = process.argv.includes('--dry-run');
const BASE = 'https://soreal-tv.technicien-soreal.workers.dev';
const HEADERS = { 'x-soreal-idle-catalog-secret': secret, 'content-type': 'application/json' };

const stories = JSON.parse(
  readFileSync(new URL('./ngu-boss-stories-fr.json', import.meta.url), 'utf8')
);
const storyById = new Map(
  stories.filter(e => e && Number.isFinite(e.id) && String(e.story || '').trim()).map(e => [e.id, String(e.story).trim()])
);
console.log(`${storyById.size} histoires en français disponibles.`);

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
const histoireIndex = header.findIndex(h => String(h || '').trim() === 'Histoire');
if (idIndex < 0 || histoireIndex < 0) {
  console.error(`Colonne ID (${idIndex}) ou Histoire (${histoireIndex}) introuvable dans l'en-tête réelle : ${JSON.stringify(header)} -- abandon.`);
  process.exit(1);
}
console.log(`En-tête réelle (${header.length} colonnes) : ID=index ${idIndex}, Histoire=index ${histoireIndex}.`);

let updated = 0, unchanged = 0, noStoryAvailable = 0;
const examples = [];
const finalRows = [{ row_index: 1, row: header }];

for (const { row_index, row } of rows) {
  if (row_index === 1) continue;
  const id = Math.floor(Number(row[idIndex]));
  const story = Number.isFinite(id) ? storyById.get(id) : undefined;
  const current = String(row[histoireIndex] ?? '').trim();

  if (story && current !== story) {
    const next = [...row];
    next[histoireIndex] = story;
    if (examples.length < 3) examples.push({ id, row_index, story: story.slice(0, 80) + (story.length > 80 ? '…' : '') });
    finalRows.push({ row_index, row: next });
    updated++;
  } else {
    finalRows.push({ row_index, row });
    if (!story) noStoryAvailable++;
    else unchanged++;
  }
}

console.log(`Résultat : ${updated} histoire(s) ajoutée(s)/corrigée(s), ${unchanged} déjà correcte(s), ${noStoryAvailable} boss sans histoire disponible (laissé(s) tel(s) quel(s), rien inventé).`);
if (examples.length) {
  console.log('Exemples :');
  for (const e of examples) console.log(`  ligne ${e.row_index} (id ${e.id}) : "${e.story}"`);
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
