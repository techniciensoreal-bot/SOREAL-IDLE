// Norman (2026-09-18) : "je veux que tu fasses un audit de chaque boss et
// que tu corriges les données qui ne sont pas bonnes."
//
// Audit complet (voir résumé donné à Norman) : les stats numériques
// (NGU_BOSS_REFERENCE_V1, boss 1-160) sont déjà exactes (BigInt, sourcées
// individuellement) ; boss 161-301 restent une extrapolation honnête, le
// wiki lui-même étant corrompu à partir du boss 161 (revérifié en direct
// ce jour, toujours vrai). Les 7 Titans (IDLE_ADVENTURE_TITANS) sont déjà
// sourcés wiki, spot-vérifiés à nouveau ce jour (GRB, The Exile). Le vrai
// écart trouvé : la colonne Nom du catalogue IDLE_BOSS (D1, vivant) porte
// des noms INVENTÉS par SOREAL (ex. "La Palette Infernale") au lieu des
// vrais noms NGU -- déjà préparés à 301/301 dans
// design/ngu-boss-fight-real-names-v1.json (sessions du 2026-09-17/18),
// jamais poussés en prod faute d'accès au secret à l'époque.
//
// Ce script :
//   1. Lit l'état RÉEL de IDLE_BOSS en prod (/api/admin/idle-catalog-read)
//      -- jamais de schéma de colonnes deviné/codé en dur : l'index de la
//      colonne "Nom" (et "ID") est retrouvé dynamiquement depuis la VRAIE
//      ligne d'en-tête (row_index=1) actuellement en place.
//   2. Pour chaque ligne EXISTANTE, ne touche QUE la cellule Nom (si le vrai
//      nom NGU diffère et n'est pas un nom placeholder vide "\"\"" du wiki
//      lui-même) -- garde row_index et absolument toutes les autres
//      colonnes (Histoire/Conseil/MortVivant/Image/DriveFileID/...)
//      identiques au bit près.
//   3. Pour chaque boss 1-301 ABSENT du catalogue actuel (aucune ligne avec
//      cet ID), ajoute une nouvelle ligne (row_index continué après le
//      maximum existant, jamais une réutilisation/un décalage d'un
//      row_index déjà utilisé) avec seulement ID+Nom renseignés -- les
//      autres colonnes vides, déjà gérées par des valeurs par défaut
//      sûres côté runtime (bossCatalogueSorealIdle_, idle-sqlite-runtime.js).
//   4. Réécrit la feuille ENTIÈRE via /api/admin/idle-catalog-replace
//      (remplacement réel, mais construit à partir de la lecture réelle --
//      rien n'est perdu qui existait déjà).
//
// Utilisation :
//   SOREAL_IDLE_CATALOG_SECRET=<secret> node design/apply-idle-boss-real-names.mjs --dry-run
//   SOREAL_IDLE_CATALOG_SECRET=<secret> node design/apply-idle-boss-real-names.mjs

import { readFileSync } from 'node:fs';

const secret = process.env.SOREAL_IDLE_CATALOG_SECRET;
if (!secret) {
  console.error('SOREAL_IDLE_CATALOG_SECRET manquant (variable d\'environnement).');
  process.exit(1);
}

const dryRun = process.argv.includes('--dry-run');
const BASE = 'https://soreal-tv.technicien-soreal.workers.dev';
const HEADERS = { 'x-soreal-idle-catalog-secret': secret, 'content-type': 'application/json' };

function estNomPlaceholder(nom) {
  const n = String(nom ?? '').trim();
  return !n || n === '""' || n === "''";
}

const realNames = JSON.parse(
  readFileSync(new URL('./ngu-boss-fight-real-names-v1.json', import.meta.url), 'utf8')
);
const realNameById = new Map(
  realNames
    .filter(e => e && Number.isFinite(e.id) && !estNomPlaceholder(e.nom))
    .map(e => [e.id, String(e.nom).trim()])
);
console.log(`${realNameById.size}/301 vrais noms NGU disponibles (hors placeholders vides du wiki).`);

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

const dataRows = rows.filter(r => r.row_index !== 1);
const existingById = new Map();
let maxRowIndex = 1;
for (const { row_index, row } of dataRows) {
  maxRowIndex = Math.max(maxRowIndex, row_index);
  const id = Math.floor(Number(row[idIndex]));
  if (Number.isFinite(id) && id > 0) existingById.set(id, { row_index, row });
}
console.log(`${existingById.size} boss identifiable(s) par ID dans les lignes existantes (max row_index=${maxRowIndex}).`);

let updated = 0, unchanged = 0, added = 0, skippedNoRealName = 0;
const examples = [];
const finalRows = [{ row_index: 1, row: header }];
let nextRowIndex = maxRowIndex + 1;

for (let id = 1; id <= 301; id++) {
  const realNom = realNameById.get(id) || '';
  const existing = existingById.get(id);

  if (existing) {
    const current = String(existing.row[nomIndex] ?? '').trim();
    if (realNom && current !== realNom) {
      const next = [...existing.row];
      next[nomIndex] = realNom;
      if (examples.length < 5) examples.push({ id, row_index: existing.row_index, before: current, after: realNom });
      finalRows.push({ row_index: existing.row_index, row: next });
      updated++;
    } else {
      finalRows.push({ row_index: existing.row_index, row: existing.row });
      unchanged++;
    }
    continue;
  }

  if (!realNom) {
    skippedNoRealName++;
    continue;
  }

  const next = header.map(() => '');
  next[idIndex] = String(id);
  next[nomIndex] = realNom;
  finalRows.push({ row_index: nextRowIndex, row: next });
  nextRowIndex++;
  added++;
}

console.log(`Résultat : ${updated} nom(s) corrigé(s), ${unchanged} déjà correct(s)/inchangé(s), ${added} ligne(s) manquante(s) ajoutée(s), ${skippedNoRealName} boss sans vrai nom disponible (ignoré(s), rien créé).`);
if (examples.length) {
  console.log('Exemples de correction :');
  for (const e of examples) console.log(`  ligne ${e.row_index} (id ${e.id}) : "${e.before}" -> "${e.after}"`);
}

if (dryRun) {
  console.log('--dry-run : rien écrit. Relancer sans ce flag pour appliquer.');
  process.exit(0);
}

if (!updated && !added) {
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
