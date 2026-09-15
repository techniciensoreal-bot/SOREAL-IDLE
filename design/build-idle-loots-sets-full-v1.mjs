import { readFileSync, writeFileSync } from 'node:fs';

// Generates IDLE_LOOTS (6 items per zone, one per engine slot) matching the
// sets already saved in idle-sets-full-v1.json. Item naming follows the
// real NGU pattern ({Adjective} {Noun} -- Crappy Helmet, Magitech
// Chestplate, Chocolate Boots...), using each zone's SOREAL theme adjective.
//
// 6 fixed engine slots (slotsEquipementSorealIdle_ in idle-sqlite-runtime.js):
// tete, torse, bottes, arme, bijou1, bijou2.

const zones = JSON.parse(readFileSync(new URL('./idle-zones-full-v2.json', import.meta.url), 'utf8'));

const SLOT_NOUNS = {
  tete: 'Casque',
  torse: 'Plastron',
  bottes: 'Bottes',
  arme: 'Outil',
  bijou1: 'Badge',
  bijou2: 'Gants'
};

function themeAdjective(setTheme) {
  return setTheme.replace(/^Tenue\s+/, '').trim();
}

const lootRows = [];
const setRows = [];

zones.forEach(z => {
  const zoneId = z.ID;
  const adjective = themeAdjective(z._setTheme);
  const setId = `SET_Z${zoneId}`;
  const itemPower = z.PuissanceRecommandee;

  for (const [slotKey, noun] of Object.entries(SLOT_NOUNS)) {
    lootRows.push({
      ID: `${setId}_${slotKey}`,
      Nom: `${noun} ${adjective}`,
      Slot: slotKey,
      ZoneID: zoneId,
      Boss: z.Boss,
      Poids: 1,
      ChanceDrop: 0.25,
      BasePuissance: Math.max(1, Math.round(itemPower * 10) / 10),
      SetID: setId,
      Image: '',
      Actif: 'TRUE'
    });
  }

  setRows.push({
    ID: setId,
    Nom: z._setTheme,
    ZoneID: zoneId,
    Pieces2: 2,
    Bonus2Pct: Math.round((5 + zoneId * 0.5) * 10) / 10,
    Pieces4: 4,
    Bonus4Pct: Math.round((12 + zoneId * 1.2) * 10) / 10,
    Pieces6: 6,
    Bonus6Pct: Math.round((30 + zoneId * 3) * 10) / 10,
    Apparence: zoneId,
    Description: `Set de la zone ${zoneId} (${z.Nom}), theme ${adjective}.`,
    Actif: 'TRUE'
  });
});

writeFileSync(new URL('./idle-loots-full-v1.json', import.meta.url), JSON.stringify(lootRows, null, 2));
writeFileSync(new URL('./idle-sets-full-v1.json', import.meta.url), JSON.stringify(setRows, null, 2));
console.log('wrote', lootRows.length, 'loot items across', setRows.length, 'sets');
