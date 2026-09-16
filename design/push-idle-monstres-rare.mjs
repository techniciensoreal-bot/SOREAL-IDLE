// Ajoute le tier "rare" (monstre unique + objet légendaire nommé) des
// zones 7-46 à IDLE_MONSTRES, SANS toucher aux lignes déjà en place
// (row_index 1-19 = header + zones 1-6, row_index 20-99 = zones 7-46
// normal+boss_zone déjà poussées) -- import additif uniquement, nouveaux
// row_index à partir de 100.
//
// Utilisation :
//   SOREAL_IDLE_CATALOG_SECRET=<secret> node design/push-idle-monstres-rare.mjs

import { readFileSync } from 'node:fs';

const secret = process.env.SOREAL_IDLE_CATALOG_SECRET;
if (!secret) {
  console.error('SOREAL_IDLE_CATALOG_SECRET manquant (variable d\'environnement).');
  process.exit(1);
}

const rares = JSON.parse(readFileSync(new URL('./idle-monstres-rare-7-46.json', import.meta.url), 'utf8'));

const COLUMNS = [
  'ID', 'ZoneID', 'Type', 'Nom', 'Emoji', 'PV', 'Attaque', 'ChanceRencontre', 'ChanceLegendaire',
  'ObjetLegendaire', 'SlotLegendaire', 'BaseLegendaire', 'Description', 'Image', 'Actif'
];

const now = Date.now();
const catalog = rares.map((m, i) => ({
  sheet_name: 'IDLE_MONSTRES',
  row_index: i + 100,
  row_json: COLUMNS.map(c => String(m[c] ?? '')),
  updated_at: now
}));

const res = await fetch('https://soreal-tv.technicien-soreal.workers.dev/api/admin/idle-catalog-import', {
  method: 'POST',
  headers: { 'x-soreal-idle-catalog-secret': secret, 'content-type': 'application/json' },
  body: JSON.stringify({ catalog })
});
console.log(res.status, await res.text());
