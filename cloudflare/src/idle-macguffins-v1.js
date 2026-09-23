/*
 * SOREAL IDLE — MacGuffin Fragments (système complet, 2026-09-23).
 *
 * Source unique des valeurs : miroir local du wiki NGU Idle
 * (Documents/NGU-Wiki/pages/<Titre>.json, champ __expandedWikitext).
 * Toutes les pages "<X> MacGuffin Fragment" sont des redirections vers la
 * page "MacGuffin Fragments" : c'est elle qui publie le catalogue, les
 * zones de drop, la formule de bonus par Rebirth, les slots et les
 * améliorations. Pages croisées citées au cas par cas ci-dessous : Perk
 * Points, Quirk Points, Wishes, Experience, Challenges, 4G's Sellout Shop,
 * Blood Magic, Yggdrasil, Adventure Mode, Greasy Nerd, The Godmother, The
 * Exile, IT HUNGERS, ROCK LOBSTER, AMALGAMATE, Choco (set), Edgy (set),
 * Greasy Nerd (set), Build History, Advanced Guide.
 *
 * Modèle :
 *  - les fragments vivent dans state.systems.macguffins.data (inventaire
 *    dédié + slots équipés ordonnés), jamais dans l'inventaire d'Aventure
 *    (écart assumé : dans NGU ils occupent l'inventaire commun) ;
 *  - un fragment n'a PAS de stat quand il est équipé : le bonus est
 *    PERMANENT (page MacGuffin Fragments, "MacGuffin Bonuses" : "grant
 *    permanent bonuses even when they aren't equipped. That permanent bonus
 *    is increased whenever the player rebirths with a MacGuffin Fragment
 *    equipped") ; il est stocké en points de % par type
 *    (data.permanent[type]) et appliqué comme un facteur (1 + % / 100),
 *    multiplié aux autres sources de la même stat, comme le reste des
 *    multiplicateurs d'idleNguBonuses() (Beards, Diggers, Perks...).
 *
 * Ce module est volontairement autonome (aucun import du moteur méta, pour
 * éviter une dépendance circulaire) : il ne lit que l'état brut et reçoit
 * du moteur ce qu'il ne peut pas calculer seul (multiplicateur de drop).
 */

import { idleAdventureDropChanceV2 } from "./idle-adventure-v47.js";

const N = (v, d = 0) => (Number.isFinite(+v) ? +v : d);
const I = (v, d = 0) => Math.floor(N(v, d));

/*
 * Formules de bonus par Rebirth (page MacGuffin Fragments, table "Rebirth
 * bonuses differ per MacGuffin type. For level L and time ratio T").
 * Résultat en POINTS DE % (ex. 0.101 = +0,101 %). `lin` = coefficient (en %)
 * de la branche L <= 100 ; `exp`/`coef` = branche L > 100 ; types sans
 * branche > 100 publiée (Golden, Augment, Stat) : linéaires pour tout L.
 */
export const IDLE_MACGUFFIN_FORMULAS_V1 = Object.freeze({
  power: Object.freeze({ lin: 0.001, exp: 0.3, coef: 0.02512 }),
  standard: Object.freeze({ lin: 0.001, exp: 0.2, coef: 0.03981 }),
  golden: Object.freeze({ lin: 0.005 }),
  augment: Object.freeze({ lin: 0.001 }),
  stat: Object.freeze({ lin: 0.01 }),
  wandoos: Object.freeze({ lin: 0.002, exp: 0.25, coef: 0.06325 }),
  number: Object.freeze({ lin: 0.005, exp: 0.25, coef: 0.1581 }),
  blood: Object.freeze({ lin: 0.003, exp: 0.2, coef: 0.1194 }),
  r3Power: Object.freeze({ lin: 0.0005, exp: 0.3, coef: 0.01255 }),
  r3CapBar: Object.freeze({ lin: 0.0005, exp: 0.2, coef: 0.0199 })
});

/*
 * Catalogue (page MacGuffin Fragments, table "The Fragments & Drop
 * Locations", # 1-22 ; `item` = numéro d'objet du wiki). `zone` = id de
 * zone SOREAL (IDLE_ADVENTURE_ZONES) ; `titan` = id de titan SOREAL.
 * `effect` = ce que le bonus permanent alimente dans le moteur :
 *  - Energy/Magic Power/Cap/Bar, Resource 3 Power/Cap/Bar : nom explicite ;
 *  - NGU : page NGU, "Other features" (avec Diggers et Hack de vitesse NGU)
 *    -> vitesse des NGU Energy / Magic ;
 *  - Wandoos : page Wandoos, "Other features" (avec LadyBeard, Diggers et
 *    cartes de vitesse Wandoos) -> vitesse du Dump Energy / Magic ;
 *  - Drop Chance : page Drop Chance ("permanent increase to your drop
 *    chance") ; Stat : "Increases Attack and Defense" ; Adventure : stats
 *    d'Aventure (Advanced Guide, "Adventure MacGuffins: ~400%+") ;
 *  - Augment : vitesse des Augments (Build History, "Fixed the Augment
 *    Speed MacGuffin never working") ;
 *  - NUMBER : multiplicateur de NUMBER au Rebirth ; Blood : gain de Blood
 *    (page Blood Magic, "Other features", avec Blood Digger / Blood Hack) ;
 *  - SEXY / SMART : aucun effet (seulement un portrait à 250 %, système
 *    de portraits absent) ;
 *  - Golden : AUCUNE page ne précise quel multiplicateur d'or il alimente
 *    (drops d'or d'Aventure ? production de la Time Machine ?) : le bonus
 *    permanent est calculé et affiché mais volontairement NON branché
 *    (règle n°1 d'AGENTS.md, jamais deviné).
 */
export const IDLE_MACGUFFIN_TYPES_V1 = Object.freeze([
  { id: "energyPower", item: 198, name: "Energy Power MacGuffin Fragment", nom: "Fragment MacGuffin Energy Power", zone: "sewers", formula: "power", effect: "energyPower", effet: "Energy Power" },
  { id: "magicPower", item: 200, name: "Magic Power MacGuffin Fragment", nom: "Fragment MacGuffin Magic Power", zone: "forest", formula: "power", effect: "magicPower", effet: "Magic Power" },
  { id: "energyCap", item: 199, name: "Energy Cap MacGuffin Fragment", nom: "Fragment MacGuffin Energy Cap", zone: "cave", formula: "standard", effect: "energyCap", effet: "Energy Cap" },
  { id: "magicCap", item: 201, name: "Magic Cap MacGuffin Fragment", nom: "Fragment MacGuffin Magic Cap", zone: "sky", formula: "standard", effect: "magicCap", effet: "Magic Cap" },
  { id: "energyNgu", item: 202, name: "Energy NGU MacGuffin Fragment", nom: "Fragment MacGuffin Energy NGU", zone: "hsb", formula: "standard", effect: "energyNgu", effet: "Vitesse des NGU Energy" },
  { id: "magicNgu", item: 203, name: "Magic NGU MacGuffin Fragment", nom: "Fragment MacGuffin Magic NGU", zone: "clock", formula: "standard", effect: "magicNgu", effet: "Vitesse des NGU Magic" },
  { id: "energyBar", item: 204, name: "Energy Bar MacGuffin Fragment", nom: "Fragment MacGuffin Energy Bar", zone: "2d", formula: "standard", effect: "energyBars", effet: "Energy Bars" },
  { id: "magicBar", item: 205, name: "Magic Bar MacGuffin Fragment", nom: "Fragment MacGuffin Magic Bar", zone: "ancient", formula: "standard", effect: "magicBars", effet: "Magic Bars" },
  { id: "sexy", item: 206, name: "SEXY MacGuffin Fragment", nom: "Fragment MacGuffin SEXY (ex-Energy Beard)", zone: "avsp", formula: "standard", effect: null, effet: "Aucun effet (portrait à 250 %)" },
  { id: "smart", item: 207, name: "SMART MacGuffin Fragment", nom: "Fragment MacGuffin SMART (ex-Magic Beard)", zone: "mega", formula: "standard", effect: null, effet: "Aucun effet (portrait à 250 %)" },
  { id: "dropChance", item: 208, name: "Drop Chance MacGuffin Fragment", nom: "Fragment MacGuffin Drop Chance", zone: "beardverse", formula: "standard", effect: "dropChance", effet: "Drop Chance" },
  { id: "golden", item: 209, name: "Golden MacGuffin Fragment", nom: "Fragment MacGuffin Golden", zone: "badly", formula: "golden", effect: null, effet: "Or (cible non documentée par le wiki : non appliqué)" },
  { id: "augment", item: 210, name: "Augment MacGuffin Fragment", nom: "Fragment MacGuffin Augment", zone: "boring", formula: "augment", effect: "augmentSpeed", effet: "Vitesse des Augments" },
  { id: "stat", item: 228, name: "Stat MacGuffin Fragment", nom: "Fragment MacGuffin Stat", zone: "chocolate", requiresSet: "choco", formula: "stat", effect: "stat", effet: "Attack et Defense" },
  { id: "energyWandoos", item: 211, name: "Energy Wandoos MacGuffin Fragment", nom: "Fragment MacGuffin Energy Wandoos", zone: "evilverse", formula: "wandoos", effect: "energyWandoos", effet: "Vitesse du Dump Energy de Wandoos" },
  { id: "magicWandoos", item: 250, name: "Magic Wandoos MacGuffin Fragment", nom: "Fragment MacGuffin Magic Wandoos", zone: "pinkprincess", formula: "wandoos", effect: "magicWandoos", effet: "Vitesse du Dump Magic de Wandoos" },
  { id: "adventure", item: 291, name: "Adventure MacGuffin Fragment", nom: "Fragment MacGuffin Adventure", titan: "nerd", formula: "standard", effect: "adventure", effet: "Stats d'Aventure" },
  { id: "number", item: 289, name: "NUMBER MacGuffin Fragment", nom: "Fragment MacGuffin NUMBER", zone: "metaland", formula: "number", effect: "number", effet: "NUMBER (au Rebirth)" },
  { id: "blood", item: 290, name: "Blood MacGuffin Fragment", nom: "Fragment MacGuffin Blood", zone: "interdimensional", formula: "blood", effect: "blood", effet: "Gain de Blood" },
  { id: "r3Power", item: 298, name: "Resource 3 Power MacGuffin Fragment", nom: "Fragment MacGuffin Resource 3 Power", titan: "godmother", formula: "r3Power", effect: "r3Power", effet: "Resource 3 Power" },
  { id: "r3Cap", item: 299, name: "Resource 3 Cap MacGuffin Fragment", nom: "Fragment MacGuffin Resource 3 Cap", titan: "godmother", formula: "r3CapBar", effect: "r3Cap", effet: "Resource 3 Cap" },
  { id: "r3Bar", item: 300, name: "Resource 3 Bar MacGuffin Fragment", nom: "Fragment MacGuffin Resource 3 Bar", titan: "godmother", formula: "r3CapBar", effect: "r3Bars", effet: "Resource 3 Bars" }
].map(Object.freeze));

const TYPES_BY_ID_V1 = Object.freeze(Object.fromEntries(IDLE_MACGUFFIN_TYPES_V1.map(t => [t.id, t])));
export function idleMacguffinTypeV1(id) {
  return TYPES_BY_ID_V1[String(id || "")] || null;
}

/*
 * Tirage aléatoire (page MacGuffin Fragments, note du # 0) : "chosen with
 * equal probability from a list containing Energy and Magic
 * Cap/Pow/Bars/NGU/SEXY/SMART and Drop MacGuffin Fragments, as well as any
 * others that have already dropped from their normal zone or Titan."
 */
export const IDLE_MACGUFFIN_RANDOM_BASE_POOL_V1 = Object.freeze([
  "energyCap", "energyPower", "energyBar", "energyNgu", "sexy",
  "magicCap", "magicPower", "magicBar", "magicNgu", "smart",
  "dropChance"
]);

/* Page MacGuffin Fragments, "Kill Counter" / Perk Points 68-71 / Choco (set) / My Purple Heart. */
export const IDLE_MACGUFFIN_ZONE_KILLS_V1 = 1000;
export const IDLE_MACGUFFIN_ITOPOD_KILLS_V1 = 5000;

/* Slots (page MacGuffin Fragments, "MacGuffin Slots" : 22 au total). */
export const IDLE_MACGUFFIN_MAX_SLOTS_V1 = 22;
const SELLOUT_SLOT_MAX_V1 = 11;

/*
 * Titans à drop garanti d'un fragment aléatoire ("All Modes" de la section
 * Loot de chaque page ; "Guaranteed Drops" de la page Adventure Mode).
 * Greasy Nerd : "Adventure MacGuffin Fragment - guaranteed" + "Random
 * MacGuffin Fragment - guaranteed if defeated Walderp's 5th form".
 */
export const IDLE_MACGUFFIN_TITAN_RANDOM_V1 = Object.freeze(["nerd", "godmother", "t7", "hungers", "lobster", "amalgamate"]);

/*
 * The Godmother, section Loot : R3 Power (All Modes, 0,01 % de base, 25 %
 * max), R3 Cap (Normal+, 0,0075 %, 25 %), R3 Bar (Hard+, 0,006 %, 25 %).
 * Même règle de chance que le reste du butin des titans Evil/Sadistic
 * (idle-adventure-v47.js, TITAN_LOOT_CUBE_ROOT_V1).
 */
export const IDLE_MACGUFFIN_GODMOTHER_DROPS_V1 = Object.freeze([
  Object.freeze({ type: "r3Power", chance: 0.0001, cap: 0.25, tiers: ["easy", "normal", "hard", "brutal"] }),
  Object.freeze({ type: "r3Cap", chance: 0.000075, cap: 0.25, tiers: ["normal", "hard", "brutal"] }),
  Object.freeze({ type: "r3Bar", chance: 0.00006, cap: 0.25, tiers: ["hard", "brutal"] })
]);
const TITAN_LOOT_CUBE_ROOT_V1 = Object.freeze({ id: "titan-evil", requiredDifficulty: "difficile" });

/*
 * Blood Magic, table "The Spells" : α = floor(log10(Blood / 1e9) + 1),
 * minimum 1B, recharge 23,5 h ; β = floor(log20(Blood / 1e6) + 1),
 * minimum 1M, recharge "1 day and 23.5 hours". Comme les autres sorts du
 * moteur, le sort consomme tout le Blood disponible.
 */
export const IDLE_MACGUFFIN_BLOOD_SPELLS_V1 = Object.freeze({
  alpha: Object.freeze({ perk: 72, minimum: 1e9, base: 10, divisor: 1e9, cooldownMs: 23.5 * 3600000 }),
  beta: Object.freeze({ perk: 73, minimum: 1e6, base: 20, divisor: 1e6, cooldownMs: 47.5 * 3600000 })
});

/*
 * Yggdrasil, "Fruit Yields" : α = ⌈⌈T^1.5⌉ x 0.5 x Poop x Quirk_Ygg x
 * Equip_YggYield x FirstHarvest⌉ (un MacGuffin équipé au hasard, ou le
 * premier slot avec le souhait 25) ; β = même formule avec 0.1, sur TOUS
 * les MacGuffins équipés. Poop : consommable absent (= 1).
 */
export const IDLE_MACGUFFIN_FRUIT_FACTORS_V1 = Object.freeze({ alpha: 0.5, beta: 0.1 });

/* ⌈x⌉ tolérant au bruit flottant (ex. 90 x 0.1 = 9.000000000000002 doit rester 9). */
function ceilSafe(x) {
  return Math.ceil(N(x, 0) - 1e-9);
}

export function createMacguffinDataV1() {
  return {
    serial: 1,
    equipped: [],
    inventory: [],
    permanent: {},
    sourceDropped: {},
    zoneCounter: { zone: "", kills: 0 },
    itopodKills: 0,
    bloodAlphaReadyAt: 0,
    bloodBetaReadyAt: 0,
    lastRebirth: null,
    lastDrops: []
  };
}

function normalizeFragment(raw) {
  if (!raw || typeof raw !== "object") return null;
  const type = idleMacguffinTypeV1(raw.type);
  if (!type) return null;
  const uid = String(raw.uid || "");
  if (!uid) return null;
  return { uid, type: type.id, level: Math.max(0, I(raw.level, 0)) };
}

export function normalizeMacguffinDataV1(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const out = createMacguffinDataV1();
  out.serial = Math.max(1, I(src.serial, 1));
  const seen = new Set();
  const list = (arr) => (Array.isArray(arr) ? arr : []).map(normalizeFragment).filter(f => {
    if (!f || seen.has(f.uid)) return false;
    seen.add(f.uid);
    return true;
  });
  out.equipped = list(src.equipped);
  out.inventory = list(src.inventory);
  /* Un seul fragment équipé par type (voir equipFragment) : doublons rendus à l'inventaire. */
  const typesEquipes = new Set();
  out.equipped = out.equipped.filter(f => {
    if (typesEquipes.has(f.type)) { out.inventory.push(f); return false; }
    typesEquipes.add(f.type);
    return true;
  });
  for (const t of IDLE_MACGUFFIN_TYPES_V1) {
    const v = Math.max(0, N(src.permanent?.[t.id], 0));
    if (v > 0) out.permanent[t.id] = v;
    if (src.sourceDropped?.[t.id]) out.sourceDropped[t.id] = true;
  }
  out.zoneCounter = { zone: String(src.zoneCounter?.zone || ""), kills: Math.max(0, I(src.zoneCounter?.kills, 0)) };
  out.itopodKills = Math.max(0, I(src.itopodKills, 0));
  out.bloodAlphaReadyAt = Math.max(0, N(src.bloodAlphaReadyAt, 0));
  out.bloodBetaReadyAt = Math.max(0, N(src.bloodBetaReadyAt, 0));
  out.lastRebirth = src.lastRebirth && typeof src.lastRebirth === "object" ? JSON.parse(JSON.stringify(src.lastRebirth)) : null;
  out.lastDrops = Array.isArray(src.lastDrops) ? src.lastDrops.slice(0, 20).map(normalizeFragment).filter(Boolean) : [];
  return out;
}

/* ---------- Lecture de l'état (perks, quirks, souhaits, défis, sets) ---------- */

function mgData(state) {
  const s = state?.systems?.macguffins;
  if (!s) return null;
  if (!s.data || typeof s.data !== "object" || !Array.isArray(s.data.equipped)) s.data = normalizeMacguffinDataV1(s.data);
  return s.data;
}
function perkLevel(state, id) { return Math.max(0, I(state?.systems?.perks?.data?.levels?.[id], 0)); }
function quirkLevel(state, id) { return Math.max(0, I(state?.systems?.quirks?.data?.levels?.[id], 0)); }
function wishLevel(state, id) { return Math.max(0, I(state?.systems?.wishes?.data?.tracks?.[String(id)]?.level, 0)); }
function completedSet(state, id) { return Boolean(state?.adventure?.completedSets?.[id]); }
function tierCompletions(state, tier, id) { return Math.max(0, I(state?.challenge?.completionsTier?.[tier]?.[id], 0)); }

/* Fonctionnalité débloquée : forme finale de Walderp vaincue (page MacGuffin Fragments, note 1). */
export function macguffinUnlockedV1(state) {
  return Boolean(state?.systems?.macguffins?.unlocked || state?.adventure?.unlockFlags?.walderpFinalDefeated);
}

/*
 * Ratio de temps T (page MacGuffin Fragments, "MacGuffin Bonuses") :
 *  - < 30 min : (t / 1800)^2 ;
 *  - >= 30 min : (t / 1800)^0.5, plafonné à 20 (200 h) ;
 *  - 2e complétion du Troll Challenge Sadistic : t / 1800 entre 30 min et
 *    24 h, puis 48 x (t / 86400)^0.4, plafonné à 104.86.
 */
export function macguffinTimeRatioV1(seconds, sadisticTroll2 = false) {
  const t = Math.max(0, N(seconds, 0));
  if (t < 1800) return Math.pow(t / 1800, 2);
  if (!sadisticTroll2) return Math.min(20, Math.pow(t / 1800, 0.5));
  if (t <= 86400) return t / 1800;
  return Math.min(104.86, 48 * Math.pow(t / 86400, 0.4));
}

/* Gain de bonus permanent (en points de %) d'un fragment de niveau L pour un ratio T. */
export function macguffinRebirthGainPctV1(typeId, level, ratio) {
  const type = idleMacguffinTypeV1(typeId);
  if (!type) return 0;
  const f = IDLE_MACGUFFIN_FORMULAS_V1[type.formula];
  const L = Math.max(0, N(level, 0));
  const T = Math.max(0, N(ratio, 0));
  const base = f.exp !== undefined && L > 100 ? Math.pow(L + 1, f.exp) * f.coef : (L + 1) * f.lin;
  return base * T;
}

export function macguffinSadisticTroll2V1(state) {
  return tierCompletions(state, "extreme", "troll") >= 2;
}

/*
 * Kills requis par fragment (page MacGuffin Fragments, "Kill Counter" :
 * minimum avec tous les bonus 720 en zone, 1 800 à l'ITOPOD).
 *  - zone : 1 000, -10 % (Choco set), -20 % (Purple Heart) ;
 *  - ITOPOD : 5 000 (perk 68), -20 % (perk 69), -25 % (70), -25 % (71),
 *    -20 % (Purple Heart : "reduces the time it takes to obtain MacGuffins
 *    from any source by 20%").
 * Réductions multiplicatives : c'est la seule lecture qui redonne les
 * minimums publiés (1000 x 0.9 x 0.8 = 720 ; 5000 x 0.8 x 0.75 x 0.75 x 0.8
 * = 1 800). Arrondi à l'entier le plus proche (seulement pour absorber le
 * bruit flottant : toutes les combinaisons publiées tombent juste).
 */
export function macguffinKillsRequiredV1(opts = {}) {
  if (opts.itopod) {
    let k = IDLE_MACGUFFIN_ITOPOD_KILLS_V1;
    if (opts.perk69) k *= 0.8;
    if (opts.perk70) k *= 0.75;
    if (opts.perk71) k *= 0.75;
    if (opts.purpleHeart) k *= 0.8;
    return Math.max(1, Math.round(k));
  }
  let k = IDLE_MACGUFFIN_ZONE_KILLS_V1;
  if (opts.chocoSet) k *= 0.9;
  if (opts.purpleHeart) k *= 0.8;
  return Math.max(1, Math.round(k));
}

/*
 * My Purple Heart : l'objet (et donc son set "atteindre le niveau 100")
 * n'existe pas dans l'inventaire SOREAL et heartPurple n'est pas achetable
 * au Sellout Shop (aucun effet câblé) -- facteur jamais actif pour l'instant.
 */
function purpleHeartActive() { return false; }

export function macguffinZoneKillsRequiredV1(state) {
  return macguffinKillsRequiredV1({ chocoSet: completedSet(state, "choco"), purpleHeart: purpleHeartActive(state) });
}
export function macguffinItopodKillsRequiredV1(state) {
  return macguffinKillsRequiredV1({
    itopod: true,
    perk69: perkLevel(state, 69) > 0,
    perk70: perkLevel(state, 70) > 0,
    perk71: perkLevel(state, 71) > 0,
    purpleHeart: purpleHeartActive(state)
  });
}

/*
 * Niveau de base des drops (niveau 0 sur la page Adventure Mode, "(0)") :
 * +1 perk 65 "Improved Macguffin Drops I", +1 par niveau du souhait 2
 * "I wish MacGuffin drops mattered" (5 niveaux), +1 Greasy Nerd (set)
 * ("All MacGuffins drop 1 level higher!").
 */
export function macguffinDropLevelV1(state) {
  return (perkLevel(state, 65) > 0 ? 1 : 0) + Math.min(5, wishLevel(state, 2)) + (completedSet(state, "greasynerd") ? 1 : 0);
}

/*
 * Slots (page MacGuffin Fragments, "MacGuffin Slots", 22 au total) :
 * 1 au déblocage ; 2 EXP shop (10 M / 100 M) ; 3 perks (66, 67, 88) ;
 * 2 quirks (19, 50) ; 1 Edgy (set) ; 1 Troll Challenge Evil (2e
 * complétion) ; 1 No Equipment Challenge Evil (5e complétion) ; 11 Sellout.
 */
export function macguffinSlotBreakdownV1(state) {
  const exp = state?.bonuses?.expShop || {};
  return {
    base: macguffinUnlockedV1(state) ? 1 : 0,
    expShop: Math.min(1, Math.max(0, I(exp.macguffinSlot1, 0))) + Math.min(1, Math.max(0, I(exp.macguffinSlot2, 0))),
    perks: [66, 67, 88].reduce((n, id) => n + (perkLevel(state, id) > 0 ? 1 : 0), 0),
    quirks: [19, 50].reduce((n, id) => n + (quirkLevel(state, id) > 0 ? 1 : 0), 0),
    edgySet: completedSet(state, "edgy") ? 1 : 0,
    trollEvil: tierCompletions(state, "difficile", "troll") >= 2 ? 1 : 0,
    noEquipmentEvil: tierCompletions(state, "difficile", "noEquipment") >= 5 ? 1 : 0,
    sellout: Math.min(SELLOUT_SLOT_MAX_V1, Math.max(0, I(state?.selloutShop?.purchases?.macguffinSlot, 0)))
  };
}
export function macguffinSlotCountV1(state) {
  if (!macguffinUnlockedV1(state)) return 0;
  const b = macguffinSlotBreakdownV1(state);
  return Math.min(IDLE_MACGUFFIN_MAX_SLOTS_V1, Object.values(b).reduce((n, v) => n + v, 0));
}

/* ---------- Effets permanents ---------- */

export function macguffinPermanentPctV1(state, typeId) {
  const d = state?.systems?.macguffins?.data;
  return Math.max(0, N(d?.permanent?.[typeId], 0));
}

/* Facteurs (1 + % / 100) par clé d'effet. Les effets absents valent 1. */
export function macguffinEffectMultipliersV1(state) {
  const out = {
    energyPower: 1, magicPower: 1, energyCap: 1, magicCap: 1, energyBars: 1, magicBars: 1,
    energyNgu: 1, magicNgu: 1, energyWandoos: 1, magicWandoos: 1, dropChance: 1,
    augmentSpeed: 1, stat: 1, adventure: 1, number: 1, blood: 1, r3Power: 1, r3Cap: 1, r3Bars: 1
  };
  const perm = state?.systems?.macguffins?.data?.permanent;
  if (!perm) return out;
  for (const type of IDLE_MACGUFFIN_TYPES_V1) {
    if (!type.effect) continue;
    const pct = Math.max(0, N(perm[type.id], 0));
    if (pct > 0) out[type.effect] *= 1 + pct / 100;
  }
  return out;
}

export function macguffinEffectMultiplierV1(state, effect) {
  return macguffinEffectMultipliersV1(state)[effect] || 1;
}

/*
 * Applique les facteurs MacGuffin à l'objet déjà calculé par
 * idleNguBonuses() (produits commutatifs : équivalent à les avoir insérés
 * dans chaque chaîne de multiplicateurs). Les effets qui ne passent pas
 * par idleNguBonuses (vitesse NGU/Wandoos/Augments, Blood, NUMBER) sont
 * appliqués directement à leur point de calcul dans idle-ngu-progression.js.
 */
export function macguffinApplyToBonusesV1(bonuses, state) {
  if (!bonuses || typeof bonuses !== "object") return bonuses;
  const m = macguffinEffectMultipliersV1(state);
  const mul = (key, f) => { if (f !== 1 && Number.isFinite(+bonuses[key])) bonuses[key] = +bonuses[key] * f; };
  mul("attackMultiplier", m.stat);
  mul("defenseMultiplier", m.stat);
  mul("adventureMultiplier", m.adventure);
  mul("adventurePowerMultiplier", m.adventure);
  mul("adventureToughnessMultiplier", m.adventure);
  mul("dropMultiplier", m.dropChance);
  mul("energyPowerMultiplier", m.energyPower);
  mul("energyCapMultiplier", m.energyCap);
  mul("energyBarsMultiplier", m.energyBars);
  mul("magicPowerMultiplier", m.magicPower);
  mul("magicCapMultiplier", m.magicCap);
  mul("magicBarsMultiplier", m.magicBars);
  mul("r3PowerMultiplier", m.r3Power);
  mul("r3CapMultiplier", m.r3Cap);
  mul("r3BarsMultiplier", m.r3Bars);
  bonuses.macguffinMultipliers = m;
  return bonuses;
}

/* ---------- Inventaire, équipement, fusion ---------- */

function newFragment(data, typeId, level) {
  const uid = "mg" + data.serial;
  data.serial += 1;
  return { uid, type: typeId, level: Math.max(0, I(level, 0)) };
}

function findFragment(data, uid) {
  const u = String(uid || "");
  let i = data.equipped.findIndex(f => f.uid === u);
  if (i >= 0) return { where: "equipped", index: i, frag: data.equipped[i] };
  i = data.inventory.findIndex(f => f.uid === u);
  if (i >= 0) return { where: "inventory", index: i, frag: data.inventory[i] };
  return null;
}

/* Page Inventory, "Leveling-up Items" : niveau fusionné = somme des deux niveaux + 1 ; sans plafond pour les MacGuffins ("infinitely leveled"). */
export function macguffinMergeLevelV1(a, b) {
  return Math.max(0, I(a, 0)) + Math.max(0, I(b, 0)) + 1;
}

/*
 * Un seul fragment d'un même type peut être équipé à la fois : non publié
 * par le wiki, choix SOREAL pour interdire le cumul de deux copies non
 * fusionnées (la fusion reste la seule façon de monter un type).
 */
function equipFragment(state, data, uid, slotIndex) {
  const found = findFragment(data, uid);
  if (!found) throw new Error("MACGUFFIN_INTROUVABLE");
  if (found.where === "equipped") return { uid, equipped: true };
  const slots = macguffinSlotCountV1(state);
  if (data.equipped.some(f => f.type === found.frag.type)) throw new Error("MACGUFFIN_TYPE_DEJA_EQUIPE");
  if (data.equipped.length >= slots) throw new Error("MACGUFFIN_SLOTS_PLEINS");
  data.inventory.splice(found.index, 1);
  const idx = slotIndex === undefined || slotIndex === null ? data.equipped.length : Math.max(0, Math.min(data.equipped.length, I(slotIndex, data.equipped.length)));
  data.equipped.splice(idx, 0, found.frag);
  return { uid, equipped: true, slot: idx };
}

function unequipFragment(data, uid) {
  const found = findFragment(data, uid);
  if (!found) throw new Error("MACGUFFIN_INTROUVABLE");
  if (found.where !== "equipped") return { uid, equipped: false };
  data.equipped.splice(found.index, 1);
  data.inventory.push(found.frag);
  return { uid, equipped: false };
}

function mergeFragments(data, targetUid, sourceUid) {
  if (String(targetUid) === String(sourceUid)) throw new Error("MACGUFFIN_FUSION_IDENTIQUE");
  const target = findFragment(data, targetUid);
  const source = findFragment(data, sourceUid);
  if (!target || !source) throw new Error("MACGUFFIN_INTROUVABLE");
  if (target.frag.type !== source.frag.type) throw new Error("MACGUFFIN_TYPES_DIFFERENTS");
  if (source.where === "equipped" && target.where !== "equipped") {
    /* Fusionner vers la copie équipée : on garde le slot occupé. */
    return mergeFragments(data, sourceUid, targetUid);
  }
  target.frag.level = macguffinMergeLevelV1(target.frag.level, source.frag.level);
  const list = source.where === "equipped" ? data.equipped : data.inventory;
  list.splice(list.findIndex(f => f.uid === source.frag.uid), 1);
  return { uid: target.frag.uid, level: target.frag.level };
}

/* Fusionne toutes les copies d'un type dans la copie équipée (ou la plus haute de l'inventaire). */
function mergeAllOfType(data, typeId) {
  const type = idleMacguffinTypeV1(typeId);
  if (!type) throw new Error("MACGUFFIN_TYPE_INVALIDE");
  let target = data.equipped.find(f => f.type === type.id);
  if (!target) {
    const copies = data.inventory.filter(f => f.type === type.id).sort((a, b) => b.level - a.level);
    target = copies[0];
  }
  if (!target) throw new Error("MACGUFFIN_INTROUVABLE");
  let merged = 0;
  for (const f of data.inventory.filter(x => x.type === type.id && x.uid !== target.uid)) {
    target.level = macguffinMergeLevelV1(target.level, f.level);
    data.inventory.splice(data.inventory.findIndex(x => x.uid === f.uid), 1);
    merged += 1;
  }
  return { uid: target.uid, level: target.level, merged };
}

/* ---------- Drops ---------- */

function addDrop(state, data, typeId, fromSource, out) {
  const frag = newFragment(data, typeId, macguffinDropLevelV1(state));
  data.inventory.push(frag);
  if (fromSource) data.sourceDropped[typeId] = true;
  data.lastDrops = [frag, ...(data.lastDrops || [])].slice(0, 20).map(f => ({ ...f }));
  out.push({ ...frag });
  return frag;
}

export function macguffinRandomPoolV1(state) {
  const data = state?.systems?.macguffins?.data || {};
  const pool = IDLE_MACGUFFIN_RANDOM_BASE_POOL_V1.slice();
  for (const t of IDLE_MACGUFFIN_TYPES_V1) {
    if (!pool.includes(t.id) && data.sourceDropped?.[t.id]) pool.push(t.id);
  }
  return pool;
}

function dropRandom(state, data, rng, out) {
  const pool = macguffinRandomPoolV1(state);
  const pick = pool[Math.min(pool.length - 1, Math.floor(N(rng(), 0) * pool.length))];
  return addDrop(state, data, pick, false, out);
}

/* Type de fragment de zone lâché par une zone d'Aventure (null si aucun ou verrouillé). */
export function macguffinZoneTypeV1(state, zoneId) {
  const type = IDLE_MACGUFFIN_TYPES_V1.find(t => t.zone === zoneId);
  if (!type) return null;
  if (type.requiresSet && !completedSet(state, type.requiresSet)) return null;
  return type;
}

/*
 * Kills de zone : compteur remis à zéro quand le joueur quitte la zone ;
 * au seuil, le fragment de la zone tombe et le compteur repart de 0.
 */
export function macguffinOnZoneKillsV1(state, zoneId, kills) {
  const data = mgData(state);
  const out = [];
  if (!data || !macguffinUnlockedV1(state) || !(kills > 0)) return out;
  const type = macguffinZoneTypeV1(state, zoneId);
  if (!type) return out;
  if (data.zoneCounter.zone !== zoneId) data.zoneCounter = { zone: zoneId, kills: 0 };
  data.zoneCounter.kills += I(kills, 0);
  const required = macguffinZoneKillsRequiredV1(state);
  while (data.zoneCounter.kills >= required) {
    data.zoneCounter.kills -= required;
    addDrop(state, data, type.id, true, out);
  }
  return out;
}

export function macguffinOnZoneChangeV1(state, zoneId) {
  const data = mgData(state);
  if (!data) return;
  if (data.zoneCounter.zone !== String(zoneId || "")) data.zoneCounter = { zone: String(zoneId || ""), kills: 0 };
}

/* ITOPOD : compteur jamais remis à zéro (sauf au drop), actif avec la perk 68. */
export function macguffinOnItopodKillsV1(state, kills, rng = Math.random) {
  const data = mgData(state);
  const out = [];
  if (!data || !macguffinUnlockedV1(state) || perkLevel(state, 68) <= 0 || !(kills > 0)) return out;
  data.itopodKills += I(kills, 0);
  const required = macguffinItopodKillsRequiredV1(state);
  while (data.itopodKills >= required) {
    data.itopodKills -= required;
    dropRandom(state, data, rng, out);
  }
  return out;
}

export function macguffinOnTitanKillV1(state, titanId, tierKey, dropMultiplier = 1, rng = Math.random) {
  const data = mgData(state);
  const out = [];
  if (!data || !macguffinUnlockedV1(state)) return out;
  if (titanId === "nerd") addDrop(state, data, "adventure", true, out);
  if (IDLE_MACGUFFIN_TITAN_RANDOM_V1.includes(titanId)) dropRandom(state, data, rng, out);
  if (titanId === "godmother") {
    const tier = ["easy", "normal", "hard", "brutal"].includes(tierKey) ? tierKey : "easy";
    const mult = Math.max(0.1, N(dropMultiplier, 1));
    for (const d of IDLE_MACGUFFIN_GODMOTHER_DROPS_V1) {
      if (!d.tiers.includes(tier)) continue;
      if (N(rng(), 1) < idleAdventureDropChanceV2(d.chance, d.cap, mult, TITAN_LOOT_CUBE_ROOT_V1)) addDrop(state, data, d.type, true, out);
    }
  }
  return out;
}

/* Photo de l'Aventure avant une action, pour déduire kills de zone / titans. */
export function macguffinAdventureBeforeV1(adventure) {
  const titans = {};
  for (const id of IDLE_MACGUFFIN_TITAN_RANDOM_V1) titans[id] = Math.max(0, I(adventure?.titans?.[id]?.kills, 0));
  return {
    selectedZone: String(adventure?.selectedZone || ""),
    zoneKills: Object.assign({}, adventure?.zone?.kills || {}),
    titans
  };
}

export function macguffinAfterAdventureV1(state, before, result, opts = {}, rng = Math.random) {
  const out = [];
  if (!before || !mgData(state)) return out;
  const adv = state.adventure || {};
  const kills = adv.zone?.kills || {};
  for (const [zoneId, n] of Object.entries(kills)) {
    const delta = Math.max(0, I(n, 0) - Math.max(0, I(before.zoneKills?.[zoneId], 0)));
    if (delta > 0) out.push(...macguffinOnZoneKillsV1(state, zoneId, delta));
  }
  const zoneNow = String(adv.selectedZone || "");
  if (zoneNow !== before.selectedZone) macguffinOnZoneChangeV1(state, zoneNow);
  for (const id of IDLE_MACGUFFIN_TITAN_RANDOM_V1) {
    const delta = Math.max(0, I(adv.titans?.[id]?.kills, 0) - Math.max(0, I(before.titans?.[id], 0)));
    for (let k = 0; k < delta; k++) out.push(...macguffinOnTitanKillV1(state, id, result?.difficulty, opts.dropMultiplier, rng));
  }
  return out;
}

/* ---------- Gain de niveaux (Blood α/β, fruits α/β) ---------- */

function pickTarget(state, data, mode, rng) {
  if (!data.equipped.length) return [];
  if (mode === "all") return data.equipped.slice();
  if (mode === "first") return [data.equipped[0]];
  return [data.equipped[Math.min(data.equipped.length - 1, Math.floor(N(rng(), 0) * data.equipped.length))]];
}

export function macguffinAddLevelsV1(state, mode, levels, rng = Math.random) {
  const data = mgData(state);
  const gained = Math.max(0, I(levels, 0));
  if (!data || gained <= 0) return [];
  return pickTarget(state, data, mode, rng).map(f => {
    f.level = Math.max(0, I(f.level, 0)) + gained;
    return { uid: f.uid, type: f.type, level: f.level, gained };
  });
}

export function macguffinBloodSpellLevelsV1(spell, blood) {
  const def = IDLE_MACGUFFIN_BLOOD_SPELLS_V1[spell];
  const b = Math.max(0, N(blood, 0));
  if (!def || b < def.minimum) return 0;
  return Math.max(0, Math.floor(Math.log(b / def.divisor) / Math.log(def.base) + 1 + 1e-9));
}

function castBloodMacguffin(state, spell, now, rng) {
  const def = IDLE_MACGUFFIN_BLOOD_SPELLS_V1[spell];
  if (!def) throw new Error("SORT_SANG_INVALIDE");
  if (perkLevel(state, def.perk) <= 0) throw new Error("SORT_MACGUFFIN_VERROUILLE");
  const data = mgData(state);
  if (!data.equipped.length) throw new Error("AUCUN_MACGUFFIN_EQUIPE");
  const readyKey = spell === "alpha" ? "bloodAlphaReadyAt" : "bloodBetaReadyAt";
  if (now > 0 && now < N(data[readyKey], 0)) throw new Error("SORT_EN_RECHARGE");
  const blood = Math.floor(N(state.currencies?.blood, 0));
  if (blood < def.minimum) throw new Error("SANG_INSUFFISANT");
  const levels = macguffinBloodSpellLevelsV1(spell, blood);
  /* Souhait 24 "I wish Blood MacGuffin α wasn't so random" : premier slot au lieu d'un slot au hasard. */
  const mode = spell === "beta" ? "all" : (wishLevel(state, 24) > 0 ? "first" : "random");
  const touched = macguffinAddLevelsV1(state, mode, levels, rng);
  state.currencies.blood = 0;
  if (now > 0) data[readyKey] = now + def.cooldownMs;
  return { spell, spent: blood, levels, touched };
}

/* Yggdrasil : niveaux gagnés en mangeant un Fruit of MacGuffin α/β de tier T. */
export function macguffinFruitLevelsV1(fruit, tier, multipliers = 1) {
  const factor = IDLE_MACGUFFIN_FRUIT_FACTORS_V1[fruit];
  if (!factor) return 0;
  const unit = Math.ceil(Math.pow(Math.max(1, N(tier, 1)), 1.5));
  return ceilSafe(unit * factor * Math.max(0, N(multipliers, 1)));
}

export function macguffinEatFruitV1(state, fruit, tier, multipliers = 1, rng = Math.random) {
  const levels = macguffinFruitLevelsV1(fruit, tier, multipliers);
  /* Souhait 25 "I wish Fruit of MacGuffin α wasn't so random" : premier slot. */
  const mode = fruit === "beta" ? "all" : (wishLevel(state, 25) > 0 ? "first" : "random");
  return { levels, touched: macguffinAddLevelsV1(state, mode, levels, rng) };
}

/* ---------- Rebirth ---------- */

/*
 * MacGuffin Muffin (4G's Sellout Shop) : "Doubles the bonus you get from
 * MacGuffins when you rebirth for 24 hours. Applies for at least one
 * rebirth, even if it's past 24 hours." -> actif si le minuteur court
 * encore OU si aucun Rebirth ne l'a encore consommé.
 */
function consumeMuffin(state) {
  const fx = state.selloutEffects || {};
  const timer = N(fx.remaining?.macguffinMuffin, 0) > 0;
  const armed = Boolean(fx.armed?.macguffinMuffin);
  if (armed && fx.armed) delete fx.armed.macguffinMuffin;
  return timer || armed;
}

export function macguffinMuffinActiveV1(state) {
  const fx = state?.selloutEffects || {};
  return N(fx.remaining?.macguffinMuffin, 0) > 0 || Boolean(fx.armed?.macguffinMuffin);
}

export function macguffinApplyRebirthV1(state, runSeconds) {
  const data = mgData(state);
  if (!data) return null;
  const muffin = consumeMuffin(state);
  if (!macguffinUnlockedV1(state) || !data.equipped.length) {
    data.lastRebirth = null;
    return null;
  }
  const ratio = macguffinTimeRatioV1(runSeconds, macguffinSadisticTroll2V1(state));
  const factor = muffin ? 2 : 1;
  const gains = {};
  for (const f of data.equipped) {
    const g = macguffinRebirthGainPctV1(f.type, f.level, ratio) * factor;
    if (!(g > 0)) continue;
    data.permanent[f.type] = Math.max(0, N(data.permanent[f.type], 0)) + g;
    gains[f.type] = g;
  }
  data.lastRebirth = { runSeconds: Math.max(0, N(runSeconds, 0)), ratio, muffin, gains };
  return data.lastRebirth;
}

/* ---------- Actions ---------- */

export function applyMacguffinActionV1(state, payload = {}, now = Date.now(), rng = Math.random) {
  const s = state?.systems?.macguffins;
  if (!s?.unlocked) throw new Error("SYSTEME_VERROUILLE");
  const data = mgData(state);
  const op = String(payload.op || "");
  if (op === "equip") return equipFragment(state, data, payload.uid, payload.slot);
  if (op === "unequip") return unequipFragment(data, payload.uid);
  if (op === "merge") return mergeFragments(data, payload.target, payload.source);
  if (op === "mergeAll") return mergeAllOfType(data, payload.type);
  if (op === "discard") {
    const found = findFragment(data, payload.uid);
    if (!found) throw new Error("MACGUFFIN_INTROUVABLE");
    if (found.where === "equipped") throw new Error("MACGUFFIN_EQUIPE");
    data.inventory.splice(found.index, 1);
    return { uid: found.frag.uid, discarded: true };
  }
  if (op === "bloodAlpha") return castBloodMacguffin(state, "alpha", now, rng);
  if (op === "bloodBeta") return castBloodMacguffin(state, "beta", now, rng);
  throw new Error("ACTION_MACGUFFIN_INCONNUE");
}

/* ---------- Snapshot client ---------- */

export function macguffinSnapshotV1(state, now = Date.now()) {
  const data = state?.systems?.macguffins?.data || createMacguffinDataV1();
  const runSeconds = Math.max(0, (N(now, 0) - N(state?.runStartedAt, 0)) / 1000);
  const troll2 = macguffinSadisticTroll2V1(state);
  const ratio = macguffinTimeRatioV1(runSeconds, troll2);
  const muffin = macguffinMuffinActiveV1(state);
  const withGain = f => ({ ...f, nextGainPct: macguffinRebirthGainPctV1(f.type, f.level, ratio) * (muffin ? 2 : 1) });
  const blood = Math.floor(N(state?.currencies?.blood, 0));
  const zoneType = macguffinZoneTypeV1(state, data.zoneCounter?.zone);
  return {
    unlocked: macguffinUnlockedV1(state),
    slots: macguffinSlotCountV1(state),
    maxSlots: IDLE_MACGUFFIN_MAX_SLOTS_V1,
    slotBreakdown: macguffinSlotBreakdownV1(state),
    equipped: data.equipped.map(withGain),
    inventory: data.inventory.map(withGain),
    permanent: Object.fromEntries(IDLE_MACGUFFIN_TYPES_V1.map(t => [t.id, Math.max(0, N(data.permanent?.[t.id], 0))])),
    multipliers: macguffinEffectMultipliersV1(state),
    types: IDLE_MACGUFFIN_TYPES_V1.map(t => ({ ...t, sourceDropped: Boolean(data.sourceDropped?.[t.id]) })),
    randomPool: macguffinRandomPoolV1(state),
    dropLevel: macguffinDropLevelV1(state),
    runSeconds,
    timeRatio: ratio,
    sadisticTroll2: troll2,
    muffinActive: muffin,
    zoneCounter: {
      zone: data.zoneCounter?.zone || "",
      kills: Math.max(0, I(data.zoneCounter?.kills, 0)),
      required: macguffinZoneKillsRequiredV1(state),
      type: zoneType ? zoneType.id : null
    },
    itopod: {
      enabled: perkLevel(state, 68) > 0,
      kills: Math.max(0, I(data.itopodKills, 0)),
      required: macguffinItopodKillsRequiredV1(state)
    },
    bloodSpells: {
      alpha: { unlocked: perkLevel(state, 72) > 0, readyAt: N(data.bloodAlphaReadyAt, 0), levelsPreview: macguffinBloodSpellLevelsV1("alpha", blood), minimum: IDLE_MACGUFFIN_BLOOD_SPELLS_V1.alpha.minimum, firstSlot: wishLevel(state, 24) > 0 },
      beta: { unlocked: perkLevel(state, 73) > 0, readyAt: N(data.bloodBetaReadyAt, 0), levelsPreview: macguffinBloodSpellLevelsV1("beta", blood), minimum: IDLE_MACGUFFIN_BLOOD_SPELLS_V1.beta.minimum }
    },
    lastRebirth: data.lastRebirth ? JSON.parse(JSON.stringify(data.lastRebirth)) : null,
    lastDrops: (data.lastDrops || []).map(f => ({ ...f }))
  };
}
