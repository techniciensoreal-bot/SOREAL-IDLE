import { readFileSync, writeFileSync } from 'node:fs';

// Full IDLE_MONSTRES replacement: normal + boss_zone rows for all 46 zones,
// NO rare tier anywhere -- rare monsters don't exist in the base NGU game
// (confirmed: no "rare enemy" concept on ngu-wiki-reference/), so per
// Norman's instruction they're removed from the data entirely, not just
// disarmed in the engine (see idle-sqlite-runtime.js, 'rare' already
// dropped from the type whitelist).
//
// Zones 1-6 normal/boss_zone rows are copied verbatim from the live sheet
// (read via idle-catalog-read on 2026-09-16) -- their Z{n}_RARE rows are
// simply omitted here. Zones 7-46 come from the already-built
// idle-monstres-extension-7-46.json (never had a rare tier of its own).

const LIVE_ZONES_1_6 = [
  { ID: 'Z1_NORMAL', ZoneID: 1, Type: 'normal', Nom: 'Palette bancale', Emoji: '📦', PV: 90, Attaque: 2, ChanceRencontre: '1', ChanceLegendaire: '0', ObjetLegendaire: '', SlotLegendaire: '', BaseLegendaire: '0', Description: "Une palette mal équilibrée qui avance en grinçant comme si elle avait quelque chose à prouver.", Image: '', Actif: 'TRUE' },
  { ID: 'Z1_BOSS', ZoneID: 1, Type: 'boss_zone', Nom: 'La Palette Infernale', Emoji: '👹', PV: 260, Attaque: 4, ChanceRencontre: '1', ChanceLegendaire: '0', ObjetLegendaire: '', SlotLegendaire: '', BaseLegendaire: '0', Description: "Une version déchaînée de la menace du quai. Elle refuse catégoriquement d'être rangée.", Image: '', Actif: 'TRUE' },
  { ID: 'Z2_NORMAL', ZoneID: 2, Type: 'normal', Nom: 'Baguette fossilisée', Emoji: '🥖', PV: 220, Attaque: 4, ChanceRencontre: '1', ChanceLegendaire: '0', ObjetLegendaire: '', SlotLegendaire: '', BaseLegendaire: '0', Description: "Du pain beaucoup trop vieux pour être encore mobile, et pourtant.", Image: '', Actif: 'TRUE' },
  { ID: 'Z2_BOSS', ZoneID: 2, Type: 'boss_zone', Nom: 'Le Pain Éternel', Emoji: '👑', PV: 650, Attaque: 7, ChanceRencontre: '1', ChanceLegendaire: '0', ObjetLegendaire: '', SlotLegendaire: '', BaseLegendaire: '0', Description: "Il ne moisit pas. Il ne sèche pas. Il attend.", Image: '', Actif: 'TRUE' },
  { ID: 'Z3_NORMAL', ZoneID: 3, Type: 'normal', Nom: 'Steak cryogénisé', Emoji: '🥩', PV: 520, Attaque: 7, ChanceRencontre: '1', ChanceLegendaire: '0', ObjetLegendaire: '', SlotLegendaire: '', BaseLegendaire: '0', Description: "Une pièce de viande gelée qui a manifestement décidé de se défendre.", Image: '', Actif: 'TRUE' },
  { ID: 'Z3_BOSS', ZoneID: 3, Type: 'boss_zone', Nom: 'Le Choc Freezer', Emoji: '👑', PV: 1500, Attaque: 11, ChanceRencontre: '1', ChanceLegendaire: '0', ObjetLegendaire: '', SlotLegendaire: '', BaseLegendaire: '0', Description: "Le froid du choc freezer semble avoir pris une forme propre.", Image: '', Actif: 'TRUE' },
  { ID: 'Z4_NORMAL', ZoneID: 4, Type: 'normal', Nom: 'Palette possédée', Emoji: '🪵', PV: 1200, Attaque: 12, ChanceRencontre: '1', ChanceLegendaire: '0', ObjetLegendaire: '', SlotLegendaire: '', BaseLegendaire: '0', Description: "Le bois craque avant même qu'on le touche.", Image: '', Actif: 'TRUE' },
  { ID: 'Z4_BOSS', ZoneID: 4, Type: 'boss_zone', Nom: 'La Palette Maudite', Emoji: '👑', PV: 3600, Attaque: 18, ChanceRencontre: '1', ChanceLegendaire: '0', ObjetLegendaire: '', SlotLegendaire: '', BaseLegendaire: '0', Description: "Quelque chose s'est installé entre ses planches et n'a aucune intention d'en sortir.", Image: '', Actif: 'TRUE' },
  { ID: 'Z5_NORMAL', ZoneID: 5, Type: 'normal', Nom: 'Diable de manutention', Emoji: '🚚', PV: 2700, Attaque: 20, ChanceRencontre: '1', ChanceLegendaire: '0', ObjetLegendaire: '', SlotLegendaire: '', BaseLegendaire: '0', Description: "Une machine de manutention qui roule seule et choisit très mal ses trajectoires.", Image: '', Actif: 'TRUE' },
  { ID: 'Z5_BOSS', ZoneID: 5, Type: 'boss_zone', Nom: "Le Maxity de l'Apocalypse", Emoji: '👑', PV: 8500, Attaque: 28, ChanceRencontre: '1', ChanceLegendaire: '0', ObjetLegendaire: '', SlotLegendaire: '', BaseLegendaire: '0', Description: "Le moteur tourne alors que personne n'est au volant.", Image: '', Actif: 'TRUE' },
  { ID: 'Z6_NORMAL', ZoneID: 6, Type: 'normal', Nom: 'Esprit frigorifique', Emoji: '🧊', PV: 6000, Attaque: 32, ChanceRencontre: '1', ChanceLegendaire: '0', ObjetLegendaire: '', SlotLegendaire: '', BaseLegendaire: '0', Description: "Une forme froide qui se déplace dans la brume sans jamais toucher le sol.", Image: '', Actif: 'TRUE' },
  { ID: 'Z6_BOSS', ZoneID: 6, Type: 'boss_zone', Nom: 'Thermo King, Seigneur du Froid', Emoji: '👑', PV: 20000, Attaque: 44, ChanceRencontre: '1', ChanceLegendaire: '0', ObjetLegendaire: '', SlotLegendaire: '', BaseLegendaire: '0', Description: "Le froid mécanique a fini par prendre un nom.", Image: '', Actif: 'TRUE' }
];

const extension7to46 = JSON.parse(readFileSync(new URL('./idle-monstres-extension-7-46.json', import.meta.url), 'utf8'));

const rows = [...LIVE_ZONES_1_6, ...extension7to46];

writeFileSync(new URL('./idle-monstres-full-no-rare.json', import.meta.url), JSON.stringify(rows, null, 2));
console.log('wrote', rows.length, 'monster rows (zones 1-46, normal+boss_zone only, no rare)');
