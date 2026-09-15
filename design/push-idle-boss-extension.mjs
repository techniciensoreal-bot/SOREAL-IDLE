// Ajoute les boss 21-46 à IDLE_BOSS SANS toucher aux 20 déjà en place
// (utilise l'import additif ON CONFLICT DO NOTHING, jamais un remplacement
// -- ces 20 premiers boss ont une histoire et des capacités déjà bien
// écrites, hors de question de risquer de les écraser).
//
// Utilisation :
//   SOREAL_IDLE_CATALOG_SECRET=<secret> node design/push-idle-boss-extension.mjs

import { readFileSync } from 'node:fs';

const secret = process.env.SOREAL_IDLE_CATALOG_SECRET;
if (!secret) {
  console.error('SOREAL_IDLE_CATALOG_SECRET manquant (variable d\'environnement).');
  process.exit(1);
}

const bosses = JSON.parse(readFileSync(new URL('./idle-boss-extension-21-46.json', import.meta.url), 'utf8'));

const COLUMNS = [
  'ID', 'Nom', 'PV', 'Attaque', 'XP', 'Pieces', 'ChanceLoot', 'Image', 'Actif', 'DriveFileID',
  'Capacite1', 'Intervalle1', 'Valeur1', 'Duree1', 'Capacite2', 'Intervalle2', 'Valeur2', 'Duree2',
  'Capacite3', 'Intervalle3', 'Valeur3', 'Duree3', 'Histoire', 'MortVivant', 'Conseil', 'NiveauRequis'
];

const now = Date.now();
// row_index 22 = boss ID 21 (row 1 = header, row 2 = boss 1, ..., row 21 = boss 20).
const catalog = bosses.map((b, i) => ({
  sheet_name: 'IDLE_BOSS',
  row_index: i + 22,
  row_json: COLUMNS.map(c => String(b[c] ?? '')),
  updated_at: now
}));

const res = await fetch('https://soreal-tv.technicien-soreal.workers.dev/api/admin/idle-catalog-import', {
  method: 'POST',
  headers: { 'x-soreal-idle-catalog-secret': secret, 'content-type': 'application/json' },
  body: JSON.stringify({ catalog })
});
console.log(res.status, await res.text());
