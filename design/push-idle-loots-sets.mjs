// Pousse IDLE_LOOTS et IDLE_SETS en direct (remplace ENTIÈREMENT ces deux
// feuilles -- c'est exactement la demande initiale de Norman : "j'oublie ce
// Google Sheet, je reprends sur le wiki les vraies informations").
//
// Utilisation :
//   SOREAL_IDLE_CATALOG_SECRET=<secret> node design/push-idle-loots-sets.mjs

import { readFileSync } from 'node:fs';

const secret = process.env.SOREAL_IDLE_CATALOG_SECRET;
if (!secret) {
  console.error('SOREAL_IDLE_CATALOG_SECRET manquant (variable d\'environnement).');
  process.exit(1);
}

const loots = JSON.parse(readFileSync(new URL('./idle-loots-full-v1.json', import.meta.url), 'utf8'));
const sets = JSON.parse(readFileSync(new URL('./idle-sets-full-v1.json', import.meta.url), 'utf8'));

const LOOTS_COLUMNS = ['ID', 'Nom', 'Slot', 'ZoneID', 'Boss', 'Poids', 'ChanceDrop', 'BasePuissance', 'SetID', 'Image', 'Actif'];
const SETS_COLUMNS = ['ID', 'Nom', 'ZoneID', 'Pieces2', 'Bonus2Pct', 'Pieces4', 'Bonus4Pct', 'Pieces6', 'Bonus6Pct', 'Apparence', 'Description', 'Actif'];

const now = Date.now();
const catalog = [
  { sheet_name: 'IDLE_LOOTS', row_index: 1, row_json: LOOTS_COLUMNS, updated_at: now },
  ...loots.map((l, i) => ({
    sheet_name: 'IDLE_LOOTS',
    row_index: i + 2,
    row_json: LOOTS_COLUMNS.map(c => String(l[c] ?? '')),
    updated_at: now
  })),
  { sheet_name: 'IDLE_SETS', row_index: 1, row_json: SETS_COLUMNS, updated_at: now },
  ...sets.map((s, i) => ({
    sheet_name: 'IDLE_SETS',
    row_index: i + 2,
    row_json: SETS_COLUMNS.map(c => String(s[c] ?? '')),
    updated_at: now
  }))
];

const res = await fetch('https://soreal-tv.technicien-soreal.workers.dev/api/admin/idle-catalog-replace', {
  method: 'POST',
  headers: { 'x-soreal-idle-catalog-secret': secret, 'content-type': 'application/json' },
  body: JSON.stringify({ sheets: ['IDLE_LOOTS', 'IDLE_SETS'], catalog })
});
console.log(res.status, await res.text());
