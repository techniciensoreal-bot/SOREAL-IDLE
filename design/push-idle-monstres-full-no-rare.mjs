// Remplace ENTIEREMENT la feuille IDLE_MONSTRES par les 92 lignes
// normal+boss_zone des 46 zones -- aucun monstre "rare" nulle part (ce
// tier n'existe pas dans le jeu de base NGU, retire de l'engine ET des
// donnees sur demande de Norman). Contrairement aux autres scripts de
// cette nuit qui ADDITIONNENT, celui-ci REMPLACE toute la feuille : les
// 6 monstres rares deja en ligne sur les zones 1-6 (Le Gerbeur Fantome,
// Le Croutont Mimique, etc.) disparaissent avec ce push.
//
// Utilisation :
//   SOREAL_IDLE_CATALOG_SECRET=<secret> node design/push-idle-monstres-full-no-rare.mjs

import { readFileSync } from 'node:fs';

const secret = process.env.SOREAL_IDLE_CATALOG_SECRET;
if (!secret) {
  console.error('SOREAL_IDLE_CATALOG_SECRET manquant (variable d\'environnement).');
  process.exit(1);
}

const monstres = JSON.parse(readFileSync(new URL('./idle-monstres-full-no-rare.json', import.meta.url), 'utf8'));

const COLUMNS = [
  'ID', 'ZoneID', 'Type', 'Nom', 'Emoji', 'PV', 'Attaque', 'ChanceRencontre', 'ChanceLegendaire',
  'ObjetLegendaire', 'SlotLegendaire', 'BaseLegendaire', 'Description', 'Image', 'Actif'
];

const now = Date.now();
const catalog = [
  { sheet_name: 'IDLE_MONSTRES', row_index: 1, row_json: COLUMNS, updated_at: now },
  ...monstres.map((m, i) => ({
    sheet_name: 'IDLE_MONSTRES',
    row_index: i + 2,
    row_json: COLUMNS.map(c => String(m[c] ?? '')),
    updated_at: now
  }))
];

const res = await fetch('https://soreal-tv.technicien-soreal.workers.dev/api/admin/idle-catalog-replace', {
  method: 'POST',
  headers: { 'x-soreal-idle-catalog-secret': secret, 'content-type': 'application/json' },
  body: JSON.stringify({ sheets: ['IDLE_MONSTRES'], catalog })
});
console.log(res.status, await res.text());
