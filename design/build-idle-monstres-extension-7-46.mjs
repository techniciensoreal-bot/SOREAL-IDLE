import { readFileSync, writeFileSync } from 'node:fs';

// Extends IDLE_MONSTRES to zones 7-46 (normal + boss_zone tiers only --
// the "rare" tier with its own legendary item per zone is real, high-
// craft content in zones 1-6 (unique flavor text + named legendary drop
// per zone) that deserves the same care, not a rushed 40-zone batch;
// left as documented follow-up, see README).
//
// Stats reused directly from idle-zones-full-v2.json (PVEnnemi/
// AttaqueEnnemi/PVBoss/AttaqueBoss already computed there) -- no new
// formula invented, just consistent reuse across sheets.

const zones = JSON.parse(readFileSync(new URL('./idle-zones-full-v2.json', import.meta.url), 'utf8'));

const rows = [];
for (const z of zones) {
  if (z.ID < 7) continue; // zones 1-6 already have real IDLE_MONSTRES entries live
  const emojiNormal = '👾';
  const emojiBoss = z._isTitan ? '💀' : '👑';
  rows.push({
    ID: `Z${z.ID}_NORMAL`,
    ZoneID: z.ID,
    Type: 'normal',
    Nom: z.Ennemi === '-' ? `Garde de ${z.Nom}` : z.Ennemi,
    Emoji: emojiNormal,
    PV: z.PVEnnemi,
    Attaque: z.AttaqueEnnemi,
    ChanceRencontre: 1,
    ChanceLegendaire: 0,
    ObjetLegendaire: '',
    SlotLegendaire: '',
    BaseLegendaire: 0,
    Description: `Ennemi courant de la zone ${z.ID} (${z.Nom}).`,
    Image: '',
    Actif: 'TRUE'
  });
  rows.push({
    ID: `Z${z.ID}_BOSS`,
    ZoneID: z.ID,
    Type: 'boss_zone',
    Nom: z.Boss,
    Emoji: emojiBoss,
    PV: z.PVBoss,
    Attaque: z.AttaqueBoss,
    ChanceRencontre: 1,
    ChanceLegendaire: 0,
    ObjetLegendaire: '',
    SlotLegendaire: '',
    BaseLegendaire: 0,
    Description: `Boss de la zone ${z.ID} (${z.Nom}).`,
    Image: '',
    Actif: 'TRUE'
  });
}

writeFileSync(new URL('./idle-monstres-extension-7-46.json', import.meta.url), JSON.stringify(rows, null, 2));
console.log('wrote', rows.length, 'monster rows (zones 7-46, normal+boss tiers)');
