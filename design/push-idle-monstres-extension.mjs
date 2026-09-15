// Ajoute les monstres normal+boss_zone des zones 7-46 à IDLE_MONSTRES
// SANS toucher aux zones 1-6 déjà en place (normal/boss/rare, avec
// objets légendaires réels) -- import additif uniquement.
//
// Utilisation :
//   SOREAL_IDLE_CATALOG_SECRET=<secret> node design/push-idle-monstres-extension.mjs

import { readFileSync } from 'node:fs';

const secret = process.env.SOREAL_IDLE_CATALOG_SECRET;
if (!secret) {
  console.error('SOREAL_IDLE_CATALOG_SECRET manquant (variable d\'environnement).');
  process.exit(1);
}

const monstres = JSON.parse(readFileSync(new URL('./idle-monstres-extension-7-46.json', import.meta.url), 'utf8'));

const COLUMNS = [
  'ID', 'ZoneID', 'Type', 'Nom', 'Emoji', 'PV', 'Attaque', 'ChanceRencontre', 'ChanceLegendaire',
  'ObjetLegendaire', 'SlotLegendaire', 'BaseLegendaire', 'Description', 'Image', 'Actif'
];

const now = Date.now();
// Existing rows: row_index 1 = header, rows 2-19 = zones 1-6 (3 rows each: normal/boss/rare).
// New rows start at row_index 20.
const catalog = monstres.map((m, i) => ({
  sheet_name: 'IDLE_MONSTRES',
  row_index: i + 20,
  row_json: COLUMNS.map(c => String(m[c] ?? '')),
  updated_at: now
}));

const res = await fetch('https://soreal-tv.technicien-soreal.workers.dev/api/admin/idle-catalog-import', {
  method: 'POST',
  headers: { 'x-soreal-idle-catalog-secret': secret, 'content-type': 'application/json' },
  body: JSON.stringify({ catalog })
});
console.log(res.status, await res.text());
