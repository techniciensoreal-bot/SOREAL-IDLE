// Pousse le contenu de idle-zones-full-v2.json en direct dans SOREAL IDLE
// (remplace ENTIÈREMENT la feuille IDLE_ZONES, y compris les zones qui
// existaient déjà avant cette nuit).
//
// Utilisation :
//   SOREAL_IDLE_CATALOG_SECRET=<secret> node design/push-idle-zones.mjs
//
// Le secret a été généré et enregistré cette nuit (wrangler secret put,
// Worker "soreal-tv") — sa valeur en clair a été donnée à Norman
// directement dans la conversation, elle n'est jamais commitée ici.

import { readFileSync } from 'node:fs';

const secret = process.env.SOREAL_IDLE_CATALOG_SECRET;
if (!secret) {
  console.error('SOREAL_IDLE_CATALOG_SECRET manquant (variable d\'environnement).');
  process.exit(1);
}

const zones = JSON.parse(readFileSync(new URL('./idle-zones-full-v2.json', import.meta.url), 'utf8'));

const COLUMNS = [
  'ID', 'Nom', 'Emoji', 'Description', 'Ennemi', 'Boss', 'NiveauRequis', 'PuissanceRecommandee',
  'CoutEntree', 'PVEnnemi', 'AttaqueEnnemi', 'PVBoss', 'AttaqueBoss', 'Points', 'Pieces', 'Image',
  'Actif', 'ImageName', 'DriveFileID'
];

const now = Date.now();
const catalog = [
  { sheet_name: 'IDLE_ZONES', row_index: 1, row_json: COLUMNS, updated_at: now }
];
zones.forEach((z, i) => {
  catalog.push({
    sheet_name: 'IDLE_ZONES',
    row_index: i + 2,
    row_json: COLUMNS.map(c => String(z[c] ?? '')),
    updated_at: now
  });
});

const res = await fetch('https://soreal-tv.technicien-soreal.workers.dev/api/admin/idle-catalog-replace', {
  method: 'POST',
  headers: { 'x-soreal-idle-catalog-secret': secret, 'content-type': 'application/json' },
  body: JSON.stringify({ sheets: ['IDLE_ZONES'], catalog })
});
console.log(res.status, await res.text());
