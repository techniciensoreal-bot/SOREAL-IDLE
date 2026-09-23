/*
 * SOREAL IDLE — Item Daycare (la garderie du Daycare Kitty).
 *
 * Sources (miroir local du wiki NGU Idle, C:\Users\n0rma\Documents\NGU-Wiki\pages) :
 *  - page « Item Daycare » : 6 slots au total (3 achats EXP à 250 / 25k / 500k, 10e complétion
 *    du Blind Challenge Normal, 3e complétion du Troll Challenge Evil, perk ITOPOD à 50k PP) ;
 *    « Attempting to merge an item into one in a daycare slot will result in nothing happening » ;
 *    « You can only have one of each item in the daycare » ; section « Time & Speed » : deux familles
 *    de bonus, toutes deux multiplicatives :
 *      1. réductions de temps (RÉTROACTIVES) : Blind Normal (-5 % à la 1re complétion, -1 % par
 *         complétion, x85 % au total), Daycare Kitty's Blessing I et II (-1 % par niveau, 5 niveaux,
 *         x95 % chacun), Daycare Speed Boost de la 4G's Sellout Shop (x90 %) ;
 *      2. hausses de vitesse (NON rétroactives) : équipement (Daycare Speed, additifs entre eux :
 *         « +20 % each ... plus 24 % more from the Creepy Doll » = x204 %), Fibonacci Perk 55 (x105 %),
 *         souhait « I wish the Daycare Kitty was even happier » (x110 %), Blind Evil (+2 % par
 *         complétion, x120 %), Blind Sadistic (+1 % par complétion, x110 %), Daycare Digger, Daycare
 *         Hack, cartes Daycare.
 *    Exemple du wiki (verrouillé par les tests) : base 8 h, 15 jours -> 45 niveaux ; 50 avec le
 *    Daycare Speed Boost (15 x 24 / (8 x 90 %)).
 *  - pages objets (« <Objet> will gain one level every N hours when put in the Daycare (base
 *    rate) ») : table IDLE_DAYCARE_BASE_HOURS_BY_WIKI_ID_V1 ci-dessous, extraite par script des 426
 *    pages objets du miroir (321 taux publiés ; recoupés avec le paramètre `daycare =` des modèles
 *    « Item data » : aucun écart). Les 105 autres pages n'ont pas de ligne Daycare (paramètre
 *    `daycare = ?` ou absent) : ces objets sont refusés (TAUX_DAYCARE_INCONNU), jamais un taux inventé.
 *  - pages « Challenges » (Blind Normal/Evil/Sadistic, Troll Evil complétion 3), « Experience »
 *    (Adventure Special), « Perk Points » (27, 28, 86), « Fibonacci Perk », « Wishes » (27),
 *    « Gold Diggers » (Daycare Digger, calculé par diggerBonuses), « Hacks » (Daycare Hack, calculé
 *    par hackFxV1), « 4G's Sellout Shop » (Daycare Speed Boost!).
 *
 * Non modélisé (système absent de SOREAL ou magnitude non publiée) : cartes Daycare (le système de
 * cartes n'existe pas), perk « Macguffin Daycare! » (MacGuffins hors de ce module), récompense
 * « All Equip OR Daycare » du Money Pit (répartition entre les deux cibles non documentée), objets
 * de quête (« Quest items take 48 hours », système Questing absent de l'inventaire).
 *
 * Modèle : un objet placé quitte l'inventaire (comme le Coffre) et vit dans
 * state.systems.daycare.data.slots[] avec son niveau d'entrée et des « heures effectives »
 * accumulées (temps réel x vitesse au moment où il s'écoule, donc non rétroactif). Le niveau vaut
 * niveau d'entrée + floor(heures effectives / (heures de base x facteur de temps)), plafonné à 100 ;
 * le facteur de temps est relu à chaque calcul, donc une réduction de temps achetée plus tard
 * s'applique rétroactivement, exactement comme le décrit le wiki. Ce module ne lit aucun état de
 * idle-ngu-progression.js : les bonus lui sont passés déjà calculés (idleDaycareFactorsV1).
 */
import { idleAdventureAddItemV1 } from "./idle-adventure-v47.js";

/* Niveau maximum d'un objet (page Inventory : « maximum level of 100 »), même borne que MAX dans idle-adventure-v47.js. */
export const IDLE_DAYCARE_MAX_LEVEL_V1 = 100;

/* Page « Item Daycare » : « a total of 6 daycare slots ». */
export const IDLE_DAYCARE_MAX_SLOTS_V1 = 6;

/*
 * Heures de base par niveau, par Id wiki de l'objet (champ wikiItemId des objets d'inventaire,
 * table IDLE_ADVENTURE_WIKI_ITEM_IDS_V1). Source : ligne « Daycare: » de chaque page objet.
 */
export const IDLE_DAYCARE_BASE_HOURS_BY_WIKI_ID_V1 = Object.freeze({
  40: 1, // Crappy Helmet
  41: 1, // Crappy Chestplate
  42: 1, // Crappy Leggings
  43: 1, // Crappy Boots
  44: 1, // Rusty Sword
  45: 1, // Gross Ring
  46: 1, // Cracked Amulet
  47: 1, // Forest Helmet
  48: 1, // Forest Chestplate
  49: 1, // Forest Leggings
  50: 1, // Forest Boots
  51: 1, // Kokiri Blade
  52: 1, // Mossy Ring
  53: 1, // Forest Pendant
  54: 1, // Blue Cheese Helmet
  55: 1, // Gouda Chestplate
  56: 1, // Swiss Leggings
  57: 1, // Limburger Boots
  58: 1, // Mole Hammer
  59: 1, // Havarti Ring
  60: 1, // Cheddar Amulet
  61: 1, // Combat Cheese
  62: 1, // Cloth Hat
  63: 1, // Cloth Shirt
  64: 1, // Cloth Leggings
  65: 1, // Cloth Boots
  66: 6, // A busted copy of Wandoos 98
  67: 6, // Looty McLootFace
  68: 2, // Magitech Helmet
  69: 2, // Magitech Chestplate
  70: 2, // Magitech Leggings
  71: 2, // Magitech Boots
  72: 2, // Magitech Blade
  73: 2, // Magitech Ring
  74: 2, // Magitech Amulet
  75: 1, // A Stick
  76: 24, // Ascended Forest Pendant
  77: 1, // 4G's Merge and Boost Tutorial Cube
  78: 6, // Chef's Hat
  79: 6, // Chef's Apron
  80: 6, // Regular Pants
  81: 6, // Non Slip Shoes
  82: 6, // Bloody Cleaver
  83: 6, // Suspicious Sausage Necklace
  84: 6, // Raw Slab of Meat
  85: 6, // Clockwork Hat
  86: 6, // Clockwork Chest
  87: 6, // Clockwork Pants
  88: 6, // Clockwork Boots
  89: 6, // A Comically Oversized Minute-Hand
  90: 6, // Alarm Clock
  91: 6, // The Sands of Time
  92: 24, // A Giant Seed
  93: 24, // Mysterious Red Liquid
  94: 36, // Ascended Ascended Forest Pendant
  95: 6, // Circle Helmet
  96: 6, // Square Chestpiece
  97: 6, // Rectangle Pants
  98: 6, // Polygon Boots
  99: 6, // A Triangle
  100: 6, // THE CUBE
  101: 6, // King Circle's Amulet of Helping Random Stuff
  102: 24, // A Number
  103: 6, // Spoopy Helmet
  104: 6, // Ghostly Chest
  105: 6, // Pants of Horror
  106: 6, // Spectral Boots
  107: 6, // Spooky Sword
  108: 6, // Cursed Ring
  109: 6, // Amulet of Sunshine, Sparkles, and Gore
  110: 12, // Dragon Wings
  111: 6, // Office Hat
  112: 6, // Office Shirt
  113: 6, // Office Pants
  114: 6, // Office Shoes
  115: 6, // The Pen-Is
  116: 6, // A Regular Tie
  117: 6, // Generic Paperweight
  118: 12, // Stapler
  119: 8, // My Red Heart
  120: 6, // The Lonely Flubber
  121: 6, // The Triple Flubber
  122: 6, // Gaudy Hat
  123: 6, // Gaudy Shirt
  124: 6, // Gaudy Pants
  125: 6, // Gaudy Boots
  126: 6, // Paper Fan
  127: 12, // A Beanie
  128: 24, // Sir Looty McLootington III, Esquire
  129: 8, // My Yellow Heart
  130: 12, // Mega Helmet
  131: 12, // Mega Chest
  132: 12, // Mega Blue Jeans
  133: 12, // Mega Boots
  134: 12, // Beam Laser Sword
  135: 2, // Ring of Apathy
  136: 12, // Ring of Greed
  137: 12, // Ring of Might
  138: 12, // Ring of Utility
  139: 12, // Ring of Way Too Much Energy
  140: 12, // Ring of Way Too Much Magic
  141: 8, // UUG's Armpit Hair
  142: 48, // Ascended Ascended Ascended Pendant
  143: 12, // Groucho Marx Disguise
  144: 12, // Gossamer Chest
  145: 12, // Braided Beard Legs
  146: 12, // Fuzzy Orange Cheeto Slippers!
  147: 12, // Bearded Axe
  148: 24, // An Infinitely Long Strand of Beard Hair
  149: 24, // UUG's 'Special' Ring
  150: 24, // Wanderer's Hat
  151: 24, // Wanderer's Chest
  152: 24, // Wanderer's Pants
  153: 24, // Wanderer's Boots
  154: 6, // Wanderer's Cane
  155: 24, // TaH s'rerednaW
  156: 24, // TsehC s'rerednaW
  157: 24, // StnaP s'rerednaW
  158: 24, // StooB s'rerednaW
  159: 24, // The Candy Cane of Destiny
  160: 24, // Fanny Pack
  161: 24, // Dorky Glasses
  162: 8, // My Brown Heart
  163: 6, // A busted copy of Wandoos XL
  164: 24, // Badly Drawn Smiley Face
  165: 24, // Badly Drawn Chest
  166: 24, // Badly Drawn Pants
  167: 24, // Badly Drawn Foot
  168: 24, // Badly Drawn Gun
  169: 24, // King Looty
  170: 72, // Ascended x4 Pendant
  171: 8, // My Green Heart
  172: 24, // Pissed Off Key
  173: 24, // Stealthy Hat
  174: 24, // Stealthy Chest
  175: 24, // No Pants
  176: 24, // High Heeled Boots
  177: 24, // A Giant Bazooka
  178: 24, // The Stealthiest Armour
  184: 24, // Slimy Helmet
  185: 24, // Slimy Chest
  186: 24, // Slimy Pants
  187: 24, // Slimy Boots
  188: 24, // The Fists of Flubber
  189: 24, // A Bald Egg
  190: 24, // A Shrunken Voodoo Doll
  191: 24, // Mysterious Purple Liquid
  192: 24, // A Priceless Van-Gogh Painting
  193: 24, // A Giant Apple
  194: 24, // A Power Pill
  195: 24, // A Small Gerbil
  196: 8, // My Blue Heart
  197: 24, // A Scrap of Paper
  212: 8, // My Purple Heart
  213: 24, // Edgy Helmet
  214: 24, // Edgy Chest
  215: 24, // Edgy Pants
  216: 24, // Left Edgy Boot
  217: 24, // Edgy Jaw Axe
  218: 24, // A Cheap Plastic Amulet
  219: 24, // Right Edgy Boot
  220: 24, // BOTH Edgy Boots
  221: 24, // Chocolate Helmet
  222: 24, // Chocolate Chest
  223: 24, // Chocolate Pants
  224: 24, // Chocolate Boots
  225: 24, // Chocolate Crowbar
  226: 24, // Energy Bar Bar (Accessory)
  227: 24, // Magic Bar Bar (Accessory)
  229: 72, // Ascended x5 Pendant
  230: 72, // Emperor Looty
  231: 48, // Clown Hat
  232: 48, // Fabulous Super Chest
  233: 48, // A Crappy Tutu
  234: 48, // Pretty Pink Slippers
  235: 48, // Giant Sticky Foot
  236: 48, // A Pretty Pink Bow
  237: 48, // A Worn Out Fedora
  238: 48, // Sweat-Stained NGU Shirt
  239: 48, // Not Sweat-Stained Underpants
  240: 48, // Nerdy Shoes
  241: 48, // Superior Japanese Katana
  242: 48, // An Ordinary Calculator
  243: 48, // Anime Figurine
  244: 48, // The D20
  245: 48, // The D8
  246: 48, // Anime Bodypillow
  247: 48, // Red Meeple Thingy
  248: 48, // A Bag of Trash
  249: 48, // Heart Shaped Panties
  251: 48, // Numerical Head
  252: 48, // Numerical Chest
  253: 48, // Numerical Legs
  254: 48, // Numerical Boots
  255: 48, // The Number 7
  256: 48, // Infinity Charm
  257: 48, // 69 Charm
  258: 48, // Party Hat
  259: 48, // Pogmail Chest
  260: 48, // Tear Away Pants
  261: 48, // Pizza Boots
  262: 48, // The God of Thunder's Hammer
  263: 48, // Plastic Red Cup
  264: 48, // Party Whistle
  265: 48, // Mobster Hat
  266: 48, // Mobster Vest
  267: 48, // Mobster Pants
  268: 48, // Cement Boots
  269: 48, // Tommy Gun
  270: 48, // A Garrote
  271: 48, // Brass Knuckles
  272: 48, // Violin Case
  273: 48, // Molotov Cocktail
  274: 48, // The Godmother's Ring
  275: 48, // The Godmother's Wand
  276: 48, // Left Fairy Wing
  277: 48, // Right Fairy Wing
  292: 48, // Heroic Sigil
  293: 8, // My Orange Heart
  294: 48, // Incriminating Evidence
  295: 120, // Ascended x6 Pendant
  296: 120, // GALACTIC HERALD LOOTY
  297: 8, // My Grey Heart
  301: 48, // Hamlet
  302: 48, // Chess Plate
  303: 48, // Logs
  304: 48, // Booms
  305: 48, // Wee pin
  306: 48, // The Ass-cessory
  307: 48, // Eye of ELXU
  308: 72, // Spinning Tophat
  309: 72, // Demonic Flurbie Chestplate
  310: 72, // AAA Battery Legs
  311: 72, // Slinky Boots
  312: 72, // THE MALF SLAMMER
  313: 72, // Rare Foil Pokeyman Card
  314: 72, // A handful of Krazy Bonez
  315: 72, // Buster Sword Top
  316: 72, // Buster Sword Upper
  317: 72, // Buster Sword Lower
  318: 72, // Buster Sword Bottom
  319: 72, // Gift Shop Buster Sword Replica
  320: 72, // A Gigantic Zipper
  321: 72, // Anime Hero Wig
  322: 72, // Hat of Greed
  323: 72, // Blue Eyes White Chestplate
  324: 72, // Trap Pants
  325: 72, // All the other Titans' Missing Shoes
  326: 72, // The Disk of Dueling
  327: 72, // The Joker
  328: 72, // Antlers of the Exile
  329: 72, // The Credit Card
  330: 72, // Tentacle of the Exile
  331: 72, // The Skip Card
  332: 72, // Antennae of the Exile
  333: 72, // The Black Lotus
  334: 72, // Buster of the Exile
  342: 168, // Blue Eyes Ultimate Chestplate
  343: 24, // A Severed Unicorn's Head
  344: 24, // My Pink Heart
  345: 72, // Cool Shades
  346: 72, // Leather Jacket
  347: 72, // Flamin' Hot Shorts
  348: 72, // A Skateboard
  349: 72, // Nunchuks
  350: 72, // Not Drugs
  351: 72, // The Glove of Power
  352: 72, // Dunce Cap
  353: 72, // School Jersey
  354: 72, // ULTRAWIDE Pants
  355: 72, // Shoes With Wheels
  356: 72, // Floppy Elastic Ruler
  357: 72, // THE S
  358: 72, // A Walkman
  359: 72, // A 10 Litre Hat
  360: 72, // Asslest Vest
  361: 72, // Assful Chaps
  362: 72, // Extra Spiky Spurs
  363: 72, // The Six Shooter
  364: 72, // A Battle Corgi
  365: 72, // A Pink Bandana
  366: 72, // A 9mm Beretta
  372: 24, // GLOP
  373: 72, // Space Helmet
  374: 72, // Space Suit Chest
  375: 72, // Space Suit Legs
  376: 72, // Space Boots
  377: 72, // Space Gun!
  378: 72, // A Manhole
  379: 72, // A Red Shirt
  380: 72, // 'The Cricket'
  381: 72, // Evil Rubber Ducky
  382: 72, // A Gas Giant
  383: 72, // An Inanimate Carbon Rod
  384: 72, // A Funky Klein Bottle
  385: 72, // Giant Alien Bug Nest
  386: 24, // The Key
  388: 144, // Ascended x7 Pendant
  389: 144, // SUPREME INTELLIGENCE LOOTY
  390: 24, // My Rainbow Heart
  430: 216, // Ascended x8 Pendant
  431: 216, // GRAND DEMON LOOTZIFER
  432: 1, // The Tuba of Time
  433: 1, // Cheese Grater
  434: 1.5, // A Dragon's Left Ball
  435: 2, // Magicite Crystal
  436: 6, // Giant Windup Gear
  437: 6, // A Sinusoidal Wave
  438: 6, // Ghost Typewriter
  439: 6, // Gaudy Epaulettes
  440: 12, // The F Tank
  441: 12, // A Beard Comb
  442: 24, // Random Crayons
  443: 24, // Red Lipstick
  444: 24, // Candy Corn Necklace
  447: 48, // THE EXPONENTIAL
  448: 48, // Mt. Rushmore Roosevelt's Nose
  452: 72, // Rad Mixtape
  504: 278, // Ascended x9 Pendant
  505: 278, // LootzLrtozlOtZlOtTlooTTLoooLLLTTTToTlOOt
  506: 96, // Mysterious Grey Liquid
});

const num = (v, d = 0) => { const n = Number(v); return Number.isFinite(n) ? n : d; };
const int = (v, d = 0) => Math.floor(num(v, d));
const clamp = (v, a, b) => Math.max(a, Math.min(b, num(v, a)));
const clone = (v) => JSON.parse(JSON.stringify(v));
/* Tolérance flottante : 360 / (8 x 0,9) doit donner 50 niveaux, pas 49. */
const EPS = 1e-9;

export function idleDaycareBaseHoursV1(item) {
  const id = int(item && item.wikiItemId, 0);
  const h = IDLE_DAYCARE_BASE_HOURS_BY_WIKI_ID_V1[id];
  return Number.isFinite(h) && h > 0 ? h : null;
}

/*
 * Slots, facteur de temps et multiplicateur de vitesse, à partir des sources déjà lues par
 * l'appelant (idle-ngu-progression.js::daycareFactorsV1). Toutes les bornes viennent des pages
 * citées en tête de fichier.
 */
export function idleDaycareFactorsV1(input = {}) {
  const x = input && typeof input === "object" ? input : {};
  /* Blind Challenge : 10 complétions possibles dans chaque difficulté (page Challenges). */
  const blindNormal = clamp(int(x.blindNormal, 0), 0, 10);
  const blindEvil = clamp(int(x.blindEvil, 0), 0, 10);
  const blindSadistic = clamp(int(x.blindSadistic, 0), 0, 10);
  /* Troll Challenge : 7 complétions possibles. */
  const trollEvil = clamp(int(x.trollEvil, 0), 0, 7);

  const slotSources = {
    expShop: clamp(int(x.expShopSlots, 0), 0, 3),
    blindNormal: blindNormal >= 10 ? 1 : 0,
    trollEvil: trollEvil >= 3 ? 1 : 0,
    perk: clamp(int(x.perkSlots, 0), 0, 1)
  };
  const slots = Math.min(IDLE_DAYCARE_MAX_SLOTS_V1, Object.values(slotSources).reduce((a, b) => a + b, 0));

  /* Réductions de temps (rétroactives). */
  const timeParts = {
    blindNormal: blindNormal > 0 ? 1 - 0.05 - 0.01 * blindNormal : 1,
    perks: clamp(num(x.perkTimeMultiplier, 1), 0.01, 1),
    selloutSpeedBoost: x.selloutSpeedBoost ? 0.9 : 1
  };
  const timeFactor = Object.values(timeParts).reduce((a, b) => a * b, 1);

  /* Hausses de vitesse (non rétroactives). */
  const speedParts = {
    gear: 1 + Math.max(0, num(x.gearDaycareSpeedPct, 0)) / 100,
    fibonacci: Math.max(1, num(x.perkSpeedMultiplier, 1)),
    wish: 1 + 0.01 * clamp(int(x.wishLevel, 0), 0, 10),
    blindEvil: 1 + 0.02 * blindEvil,
    blindSadistic: 1 + 0.01 * blindSadistic,
    digger: Math.max(1, num(x.diggerMultiplier, 1)),
    hack: Math.max(1, num(x.hackMultiplier, 1))
  };
  const speedMultiplier = Object.values(speedParts).reduce((a, b) => a * b, 1);

  return { slots, slotSources, timeFactor, timeParts, speedMultiplier, speedParts };
}

export function createIdleDaycareDataV1() {
  return { slots: [] };
}

function cleanDaycareItemV1(raw) {
  if (!raw || typeof raw !== "object") return null;
  const o = clone(raw);
  o.id = String(o.id || "");
  o.definitionId = String(o.definitionId || "");
  if (!o.id || !o.definitionId) return null;
  o.wikiItemId = Math.max(0, int(o.wikiItemId, 0));
  o.level = clamp(int(o.level, 0), 0, IDLE_DAYCARE_MAX_LEVEL_V1);
  o.locked = Boolean(o.locked);
  return o;
}

export function normalizeIdleDaycareDataV1(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const out = createIdleDaycareDataV1();
  const seenIds = new Set();
  const seenDefs = new Set();
  for (const e of Array.isArray(src.slots) ? src.slots : []) {
    const item = cleanDaycareItemV1(e && e.item);
    if (!item || seenIds.has(item.id) || seenDefs.has(item.definitionId)) continue;
    seenIds.add(item.id);
    seenDefs.add(item.definitionId);
    out.slots.push({
      item,
      levelAtEntry: clamp(int(e.levelAtEntry, item.level), 0, item.level),
      hours: Math.max(0, num(e.hours, 0))
    });
  }
  return out;
}

function hoursPerLevelV1(entry, factors) {
  const base = idleDaycareBaseHoursV1(entry.item);
  if (base == null) return null;
  return base * Math.max(EPS, num(factors && factors.timeFactor, 1));
}

function levelFromHoursV1(entry, factors) {
  const perLevel = hoursPerLevelV1(entry, factors);
  const start = clamp(int(entry.levelAtEntry, 0), 0, IDLE_DAYCARE_MAX_LEVEL_V1);
  if (perLevel == null) return Math.max(start, int(entry.item.level, 0));
  const gained = Math.floor(Math.max(0, num(entry.hours, 0)) / perLevel + EPS);
  return Math.max(int(entry.item.level, 0), Math.min(IDLE_DAYCARE_MAX_LEVEL_V1, start + gained));
}

/* Avance tous les slots de `seconds` (en ligne comme hors ligne : même chemin). */
export function advanceIdleDaycareV1(data, seconds, factors) {
  const secs = Math.max(0, num(seconds, 0));
  const speed = Math.max(0, num(factors && factors.speedMultiplier, 1));
  const out = { levelsGained: 0 };
  for (const entry of (data && Array.isArray(data.slots)) ? data.slots : []) {
    const perLevel = hoursPerLevelV1(entry, factors);
    if (perLevel == null) continue;
    const before = int(entry.item.level, 0);
    if (before >= IDLE_DAYCARE_MAX_LEVEL_V1) continue;
    /* Au-delà du niveau 100, le temps n'est plus compté (niveau plafonné). */
    const maxHours = (IDLE_DAYCARE_MAX_LEVEL_V1 - clamp(int(entry.levelAtEntry, 0), 0, IDLE_DAYCARE_MAX_LEVEL_V1)) * perLevel;
    const current = Math.max(0, num(entry.hours, 0));
    entry.hours = Math.max(current, Math.min(maxHours, current + (secs / 3600) * speed));
    entry.item.level = levelFromHoursV1(entry, factors);
    out.levelsGained += entry.item.level - before;
  }
  return out;
}

function equippedIdsV1(adventure) {
  const e = (adventure && adventure.equipment) || {};
  const ids = new Set();
  for (const slot of ["head", "chest", "legs", "boots", "weapon"]) if (e[slot]) ids.add(String(e[slot]));
  for (const id of Array.isArray(e.accessories) ? e.accessories : []) if (id) ids.add(String(id));
  return ids;
}

/* Un objet peut aller en garderie s'il a un taux publié et n'est ni un Boost ni un consommable. */
export function idleDaycareEligibilityV1(item) {
  if (!item || typeof item !== "object") return "OBJET_INTROUVABLE";
  if (item.kind === "boost" || item.consumable) return "OBJET_NON_ELIGIBLE_DAYCARE";
  if (idleDaycareBaseHoursV1(item) == null) return "TAUX_DAYCARE_INCONNU";
  return "";
}

/* Place un objet de l'inventaire dans un slot libre. */
export function idleDaycarePlaceV1(adventure, data, itemId, factors) {
  if (!adventure || !Array.isArray(adventure.inventory)) throw new Error("OBJET_INTROUVABLE");
  const slots = Math.max(0, int(factors && factors.slots, 0));
  if (slots <= 0) throw new Error("SYSTEME_VERROUILLE");
  if (data.slots.length >= slots) throw new Error("DAYCARE_PLEIN");
  const idx = adventure.inventory.findIndex((x) => x && String(x.id) === String(itemId));
  if (idx < 0) throw new Error("OBJET_INTROUVABLE");
  const item = adventure.inventory[idx];
  if (equippedIdsV1(adventure).has(String(item.id))) throw new Error("OBJET_EQUIPE");
  const refus = idleDaycareEligibilityV1(item);
  if (refus) throw new Error(refus);
  if (data.slots.some((e) => e.item.definitionId === item.definitionId)) throw new Error("DAYCARE_OBJET_DEJA_PRESENT");
  adventure.inventory.splice(idx, 1);
  const level = clamp(int(item.level, 0), 0, IDLE_DAYCARE_MAX_LEVEL_V1);
  data.slots.push({ item: clone(item), levelAtEntry: level, hours: 0 });
  /* Le client n'accepte un inventaire serveur que si sa révision avance (protegerJoueurServeurInventaireIdleV208_). */
  adventure.revision = Math.max(0, int(adventure.revision, 0)) + 1;
  return { id: String(item.id), definitionId: item.definitionId, level };
}

/* Rend l'objet à l'inventaire avec son niveau acquis (enregistré dans la Collection par add()). */
export function idleDaycareRemoveV1(adventure, data, itemId, factors) {
  const idx = data.slots.findIndex((e) => String(e.item.id) === String(itemId));
  if (idx < 0) throw new Error("OBJET_INTROUVABLE");
  const entry = data.slots[idx];
  entry.item.level = levelFromHoursV1(entry, factors);
  const added = idleAdventureAddItemV1(adventure, clone(entry.item));
  if (!added) throw new Error("SAC_PLEIN");
  data.slots.splice(idx, 1);
  adventure.revision = Math.max(0, int(adventure.revision, 0)) + 1;
  return { id: String(entry.item.id), level: entry.item.level, levelsGained: entry.item.level - entry.levelAtEntry };
}

function secondsV1(hours, speed) {
  return speed > 0 ? (hours / speed) * 3600 : null;
}

export function idleDaycareSnapshotV1(data, adventure, factors) {
  const f = factors || idleDaycareFactorsV1({});
  const speed = Math.max(0, num(f.speedMultiplier, 1));
  const inDaycare = new Set();
  const slots = (data && Array.isArray(data.slots) ? data.slots : []).map((entry) => {
    inDaycare.add(entry.item.definitionId);
    const base = idleDaycareBaseHoursV1(entry.item);
    const perLevel = hoursPerLevelV1(entry, f);
    const level = levelFromHoursV1(entry, f);
    const maxed = level >= IDLE_DAYCARE_MAX_LEVEL_V1;
    const done = perLevel ? Math.max(0, num(entry.hours, 0)) / perLevel : 0;
    const progress = maxed || !perLevel ? (maxed ? 1 : 0) : Math.max(0, Math.min(1, done - Math.floor(done + EPS)));
    const restLevels = maxed || !perLevel ? 0 : IDLE_DAYCARE_MAX_LEVEL_V1 - level - progress;
    return {
      item: Object.assign(clone(entry.item), { level }),
      levelAtEntry: entry.levelAtEntry,
      levelsGained: level - entry.levelAtEntry,
      baseHours: base,
      effectiveHoursPerLevel: perLevel != null && speed > 0 ? perLevel / speed : null,
      progress,
      maxed,
      secondsToNextLevel: maxed || !perLevel ? null : secondsV1((1 - progress) * perLevel, speed),
      secondsToMax: maxed || !perLevel ? null : secondsV1(restLevels * perLevel, speed)
    };
  });
  const equipped = equippedIdsV1(adventure);
  const eligible = (adventure && Array.isArray(adventure.inventory) ? adventure.inventory : [])
    .filter((o) => o && !equipped.has(String(o.id)) && o.kind !== "boost" && !o.consumable)
    .map((o) => ({
      id: String(o.id),
      definitionId: String(o.definitionId || ""),
      wikiItemId: int(o.wikiItemId, 0),
      name: String(o.name || o.definitionId || ""),
      level: int(o.level, 0),
      baseHours: idleDaycareBaseHoursV1(o),
      alreadyInDaycare: inDaycare.has(String(o.definitionId || ""))
    }));
  return {
    slots: f.slots,
    maxSlots: IDLE_DAYCARE_MAX_SLOTS_V1,
    slotSources: clone(f.slotSources || {}),
    timeFactor: f.timeFactor,
    timeParts: clone(f.timeParts || {}),
    speedMultiplier: f.speedMultiplier,
    speedParts: clone(f.speedParts || {}),
    items: slots,
    inventory: eligible
  };
}
