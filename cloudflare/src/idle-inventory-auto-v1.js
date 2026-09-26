/*
 * SOREAL IDLE — automatisation de l'inventaire (Auto Merge, Auto Boost, slots d'automerge,
 * recyclage des boosts, transformation des boosts, loadouts, filtre de butin).
 *
 * Sources (miroir local du wiki NGU Idle, C:\Users\n0rma\Documents\NGU-Wiki\pages) :
 *  - « Inventory » :
 *      · AutoMerge & AutoBoost : « Auto Merge : Merges your equipped items (including MacGuffin
 *        Fragments) and the items in the automerge slots [...] The baseline countdown without any
 *        upgrades is 60 minutes. » ; « Auto Boost : Boosts your equipped items and the items in the
 *        automerge slots. Reward from the No Equipment Challenge. The baseline countdown without any
 *        upgrades is 60 minutes. » ; ordre de priorité = image « Merge priority.png » (1-4 casque,
 *        torse, jambes, bottes ; 5 arme ; 6 seconde arme [absente de SOREAL] ; 7-22 accessoires ;
 *        23-30 slots d'automerge ; 31 Infinity Cube).
 *      · Automerge Slots : « Each new slot uses the next inventory space starting from the top left
 *        of page 1 [...] no items will drop in these slots. Automerge and autoboost of automerge slot
 *        can be turned off by options » ; 8 slots : 1 boutique EXP, 2 Perks, 1 Quirk, 4 Sellout Shop.
 *      · Loot Filters : Basic (boutique EXP, par type) et Improved (Sellout Shop, objet par objet via
 *        l'Item List).
 *      · Loadouts : jusqu'à 10 (3 boutique EXP : 2 pour 1 000 EXP + 1 pour 10 K EXP ; 7 Sellout Shop).
 *      · Inventory Shortcuts : « Shift + Click » = PROTECTED (flag `locked` déjà présent dans
 *        idle-adventure-v47.js) ; « A + Click : Auto Boost, allocate all unprotected boosts on the
 *        clicked item » ; « D + Click : Merge all similar items » ; « Q/W/E + Left Click : Boost
 *        Transformation [...] at a cost of reducing the boost one tier ».
 *  - « Experience » (Adventure Special) : Auto Merge 200 EXP (« If an item is at level 100, Auto Merge
 *    will not combine that item anymore ») ; Basic Loot Filter 20 ; 2 Loadout Slots! 1000 ; Another
 *    Loadout Slot! 10,000 ; Boost Recycling 100 EXP par +10 %, « Capped at 50% (other 50% can be
 *    obtained from Basic challenge) » ; Inventory Merge Slot! 1000.
 *    NB : la page Inventory annonce « Cost: 1,000 exp » pour Auto Merge ; la page de la boutique
 *    (Experience) dit 200 : c'est elle qui fait foi ici (écart signalé dans le rapport).
 *  - « Boost » : recyclage — « With 100% boost recycling: Boosts 2, 20, 200 and 2k have approximately
 *    a ~x1.94 multiplier, 5, 50, 500 and 5k ~x1.77, 10, 100, 1k and 10k ~x1.88 ». Ces trois valeurs
 *    ne s'obtiennent exactement que si un boost recyclé redevient le boost du palier inférieur
 *    (2k -> 1k -> 500 -> ... -> 1 : 3 888 / 2 000 = 1,944 ; 8 888 / 5 000 = 1,778 ;
 *    18 888 / 10 000 = 1,889) : c'est donc la sémantique appliquée (un Boost 1 n'a pas de palier
 *    inférieur et n'est jamais recyclé). « Build History 2018 » : « A + Click/Autoboost will now
 *    re-apply a boost that is successfully recycled before moving to the next boost » ; « Protected
 *    boosts will now be skipped when performing an A+click or autoboost ». Page Boost, Related
 *    Purchases : le recyclage « does not affect filtered boosts ».
 *    Transformation : « Boost Transformation is unlocked upon completing the 1st normal 100 Levels
 *    Challenge [...] at the cost of reducing the boost by one tier [...] This also reduces the
 *    boost's level to 0. Upon completing the final normal 100 Levels Challenge, boosts no longer drop
 *    a tier when transformed, and the auto transform setting for dropped boosts is unlocked. Auto
 *    Transform does not reset the boost level (ITOPOD drops) ».
 *  - « Infinity Cube » : « The Auto Boost option [...] will periodically apply all non-protected
 *    boosts to your equipment, with the cube being boosted if all other equipment is at maximum
 *    boost » ; « Right clicking or A+clicking on the cube will apply all non-protected boosts » ;
 *    « Filter Boosts into Infinity Cube [...] neither Boost Recycle nor Auto Transform will be
 *    applied ».
 *  - « Challenges » : No Equipment (Normal) 1re complétion = AUTO BOOST, -10 % de temps Auto
 *    Boost/Auto Merge par complétion (challengePermanentBonuses, idle-ngu-progression.js) ; Basic
 *    (Normal) +10 % de Boost Recycle Chance par complétion ; 100 Levels (Normal) 1re = transformation,
 *    dernière = transformation gratuite + transformation automatique.
 *  - « 4G's Sellout Shop » (Special 1/3) : Improved Loot Filter, 1/2 Auto Merge and Boost Timers
 *    (« 50% time reduction »), Loadout Slot! (x7), Filter Boosts into Infinity Cube!, Inventory Merge
 *    Slots (x4).
 *  - « Perk Points » 111 « An Inventory Merge Slot » et 112 « Another Inventory Merge Slot » ;
 *    « Quirk Points » 55 « An Inventory Automerge Slot! ».
 *
 * Choix non chiffrés (aucune valeur inventée, mais le wiki ne tranche pas) :
 *  - réductions de minuteur combinées de façon multiplicative (No Equipment x 1/2 Sellout) : la
 *    combinaison additive donnerait 0 minute avec les deux au maximum (-50 % et -50 %) ;
 *  - un boost recyclé garde sa case et repart au niveau 0 ; les boosts rangés dans un slot
 *    d'automerge (cibles de fusion) et les boosts protégés ne sont jamais consommés par A+clic/Auto
 *    Boost ; un objet sans plafond publié (Special inconnu) n'est pas une cible d'Auto Boost ;
 *  - un loadout dont un objet a disparu (fusionné, jeté, en garderie) laisse ce slot inchangé.
 *
 * Réglage « consommer ou non les boosts recyclés » (2026-09-24) : « Build History 2018 », build .367
 * (postérieur au .366 qui introduit la ré-application) : « Added setting to choose if Autoboost/
 * A+clicking consumes recycled boosts or leaves them alone. » -> `consumeRecycled` (vrai par défaut =
 * comportement du .366). Faux : un boost recyclé pendant un A + clic ou une passe d'Auto Boost reste
 * dans le sac et n'est plus touché jusqu'à la fin de cette passe. Le wiki ne décrit aucun marqueur
 * persistant : à la passe suivante c'est un boost ordinaire (aucun état inventé).
 *
 * Non modélisé : distinction en ligne / hors ligne du recyclage (page Boost : « does not affect [...]
 * offline boost progress » ; ce moteur ne distingue pas les deux), seconde arme (slot 6, absent de
 * SOREAL).
 *
 * Ce module n'importe rien d'idle-ngu-progression.js : les bonus lui sont passés déjà calculés
 * (`env`, construit par inventoryAutoEnvV1 dans idle-ngu-progression.js).
 */
import {
  IDLE_ADVENTURE_BOOSTS,
  idleAdventureBoostV1,
  idleAdventureAddItemV1,
  idleAdventureMergeItemsV1,
  idleAdventureApplyBoostItemV1,
  idleAdventureCubeBoostItemV1,
  idleAdventureEquipItemV1,
  idleAdventureUnequipItemV1,
  idleAdventureRecordItemV1,
  idleAdventureSyncInventorySlotsV1,
  idleAdventureInventoryCapacityV1,
  idleAdventureInventoryUsedV1,
  idleAdventureBoostRoomV1,
  idleAdventureItemAtLevelV47,
  IDLE_SECOND_WEAPON_SLOTS_V1
} from "./idle-adventure-v47.js";
import { macguffinMergeLevelV1 } from "./idle-macguffins-v1.js";
import { idlePerkNiveauxV1, idleQuirkNiveauxV1 } from "./idle-difficulty-gates-v1.js";

const N = (v, d = 0) => (Number.isFinite(+v) ? +v : d);
const I = (v, d = 0) => Math.floor(N(v, d));
const X = (v) => JSON.parse(JSON.stringify(v));

/* Page Inventory : « The baseline countdown without any upgrades is 60 minutes » (Auto Merge et Auto Boost). */
export const IDLE_INVENTORY_AUTO_BASE_SECONDS_V1 = 3600;
/* Page Inventory : « There are 8 automerge slots available ». */
export const IDLE_INVENTORY_MERGE_SLOTS_MAX_V1 = 8;
/* Page Inventory : « You can have up to 10 loadouts » (3 boutique EXP + 7 Sellout Shop). */
export const IDLE_INVENTORY_LOADOUTS_MAX_V1 = 10;
/* Page Experience : Boost Recycling +10 % par achat, « Capped at 50% » ; Basic Challenge : autres 50 %. */
export const IDLE_BOOST_RECYCLE_EXP_STEP_V1 = 0.10;
export const IDLE_BOOST_RECYCLE_EXP_CAP_V1 = 0.50;
/* Page Experience : « Basic Loot Filter — Allows to filter items by type: head, chest, legs, boots, weapon and accessory ». */
export const IDLE_LOOT_FILTER_TYPES_V1 = Object.freeze(["head", "chest", "legs", "boots", "weapon", "accessory"]);
/* Page Inventory, Inventory Shortcuts : « Q for Power, W for Toughness, and E for Special ». */
export const IDLE_BOOST_TYPES_V1 = Object.freeze(["power", "toughness", "special"]);

const CORE_SLOTS = ["head", "chest", "legs", "boots", "weapon", "weapon2"];
const EPS = 1e-9;

/* ---------- état persistant (vit dans state.adventure.inventoryAuto) ---------- */

function normalizeLoadoutV1(raw) {
  if (!raw || typeof raw !== "object") return null;
  const out = {};
  for (const slot of CORE_SLOTS) out[slot] = String(raw[slot] || "");
  out.accessories = (Array.isArray(raw.accessories) ? raw.accessories : []).map(String).filter(Boolean);
  return out;
}

/* Un filtre { types, items } nettoyé. */
function normalizeFilterV1(filtre) {
  const src = filtre && typeof filtre === "object" ? filtre : {};
  const types = {};
  for (const t of IDLE_LOOT_FILTER_TYPES_V1) if (src.types && src.types[t]) types[t] = true;
  const items = {};
  for (const [k, v] of Object.entries(src.items && typeof src.items === "object" ? src.items : {})) if (v) items[String(k)] = true;
  return { types, items };
}

const ZONE_ID_RE = /^[a-z0-9_-]{1,40}$/i;

/*
 * Filtres de butin PAR ZONE (2026-09-26, Norman : « les filtres de butin doivent être liés à la zone où on les active ; si je change de zone,
 * ça doit mettre le filtre adéquat »). `lootFilters` : zone -> filtre. `lootFilter` reste le filtre par défaut : celui des sauvegardes d'avant
 * (rien n'est perdu) et de toute zone sans réglage propre. Régler un filtre dans une zone crée le filtre de CETTE zone (copie du filtre en vigueur).
 */
export function idleInventoryFilterZoneV1(s, hint) {
  const h = String(hint || "");
  if (ZONE_ID_RE.test(h) && h !== "safe") return h;
  const sel = String(s?.selectedZone || "");
  if (ZONE_ID_RE.test(sel) && sel !== "safe") return sel;
  const last = String(s?.lastCombatZone || "");
  return ZONE_ID_RE.test(last) && last !== "safe" ? last : "tutorial";
}
function lootFilterOfZoneV1(cfg, zone) {
  return cfg.lootFilters[zone] || cfg.lootFilter;
}

export function normalizeIdleInventoryAutoV1(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const { types, items } = normalizeFilterV1(src.lootFilter);
  const lootFilters = {};
  for (const [zone, filtre] of Object.entries(src.lootFilters && typeof src.lootFilters === "object" ? src.lootFilters : {}).slice(0, 80)) {
    if (ZONE_ID_RE.test(zone)) lootFilters[zone] = normalizeFilterV1(filtre);
  }
  const loadouts = Array.from({ length: IDLE_INVENTORY_LOADOUTS_MAX_V1 }, (_, i) => normalizeLoadoutV1(Array.isArray(src.loadouts) ? src.loadouts[i] : null));
  return {
    autoMerge: Boolean(src.autoMerge),
    autoBoost: Boolean(src.autoBoost),
    /* Réglages de la page 2 des options : fusion / boost automatiques des slots d'automerge (actifs par défaut). */
    mergeSlotsMerge: src.mergeSlotsMerge === undefined ? true : Boolean(src.mergeSlotsMerge),
    mergeSlotsBoost: src.mergeSlotsBoost === undefined ? true : Boolean(src.mergeSlotsBoost),
    /* Build .367 : A + clic / Auto Boost consomment (ré-appliquent) les boosts recyclés, ou les laissent. */
    consumeRecycled: src.consumeRecycled === undefined ? true : Boolean(src.consumeRecycled),
    autoTransform: IDLE_BOOST_TYPES_V1.includes(src.autoTransform) ? src.autoTransform : "",
    mergeElapsed: Math.max(0, N(src.mergeElapsed, 0)),
    boostElapsed: Math.max(0, N(src.boostElapsed, 0)),
    lootFilter: { types, items },
    lootFilters,
    loadouts
  };
}

function cfgV1(s) {
  s.inventoryAuto = normalizeIdleInventoryAutoV1(s.inventoryAuto);
  return s.inventoryAuto;
}

/* ---------- sources de bonus (lues directement dans l'état méta, sans import circulaire) ---------- */

/* Slots d'automerge : boutique EXP (1), perks 111/112, quirk 55, Sellout Shop (4) ; 8 au maximum. */
export function idleInventoryMergeSlotCountV1(state) {
  const exp = Math.min(1, Math.max(0, I(state?.bonuses?.expShop?.inventoryMergeSlot, 0)));
  const perks = idlePerkNiveauxV1(state);
  const quirks = idleQuirkNiveauxV1(state);
  const perk = Math.min(1, Math.max(0, I(perks[111], 0))) + Math.min(1, Math.max(0, I(perks[112], 0)));
  const quirk = Math.min(1, Math.max(0, I(quirks[55], 0)));
  const sellout = Math.min(4, Math.max(0, I(state?.selloutShop?.purchases?.inventoryMergeSlots, 0)));
  return Math.min(IDLE_INVENTORY_MERGE_SLOTS_MAX_V1, exp + perk + quirk + sellout);
}

/* Loadouts : « 2 Loadout Slots! » (x2), « Another Loadout Slot! » (x1), Sellout « Loadout Slot! » (7 achats). */
export function idleInventoryLoadoutSlotsV1(expPair, expThird, sellout) {
  return Math.min(IDLE_INVENTORY_LOADOUTS_MAX_V1, Math.min(1, Math.max(0, I(expPair, 0))) * 2 + Math.min(1, Math.max(0, I(expThird, 0))) + Math.min(7, Math.max(0, I(sellout, 0))));
}

/* Chance de recyclage : boutique EXP (+10 % par achat, plafond 50 %) + Basic Challenge (déjà calculé, 0-50 %). */
export function idleInventoryBoostRecycleChanceV1(expPurchases, challengeChance) {
  const exp = Math.min(IDLE_BOOST_RECYCLE_EXP_CAP_V1, Math.max(0, I(expPurchases, 0)) * IDLE_BOOST_RECYCLE_EXP_STEP_V1);
  return Math.max(0, Math.min(1, exp + Math.max(0, N(challengeChance, 0))));
}

/* Minuteur commun Auto Merge / Auto Boost (secondes). */
export function idleInventoryAutoIntervalSecondsV1(env) {
  const m = Math.max(0, N(env?.timerMultiplier, 1));
  return IDLE_INVENTORY_AUTO_BASE_SECONDS_V1 * (m > 0 ? m : 1);
}

function boostCtxV1(env) {
  const ctx = typeof env?.boostCtx === "function" ? env.boostCtx() : (env?.boostCtx || {});
  return ctx && typeof ctx === "object" ? ctx : {};
}

/* ---------- utilitaires d'inventaire ---------- */

function equippedSetV1(s) {
  const ids = new Set();
  for (const slot of CORE_SLOTS) if (s.equipment?.[slot]) ids.add(String(s.equipment[slot]));
  for (const id of Array.isArray(s.equipment?.accessories) ? s.equipment.accessories : []) if (id) ids.add(String(id));
  return ids;
}

function mergeSlotIdsV1(s) {
  const k = Math.max(0, I(s.mergeSlots, 0));
  return (Array.isArray(s.inventorySlots) ? s.inventorySlots.slice(0, k) : []).map(String).filter(Boolean);
}

/* Objets du sac (non équipés) dans l'ordre visuel des cases. */
function bagItemsInOrderV1(s) {
  const slots = idleAdventureSyncInventorySlotsV1(s);
  const byId = new Map(s.inventory.map((o) => [String(o.id), o]));
  const out = [];
  for (const id of slots) if (id && byId.has(String(id))) out.push(byId.get(String(id)));
  return out;
}

/* Ordre de priorité (image « Merge priority.png ») : équipement, accessoires, puis slots d'automerge. */
function priorityTargetIdsV1(s, includeMergeSlots) {
  idleAdventureSyncInventorySlotsV1(s);
  const ids = [];
  for (const slot of CORE_SLOTS) if (s.equipment?.[slot]) ids.push(String(s.equipment[slot]));
  for (const id of Array.isArray(s.equipment?.accessories) ? s.equipment.accessories : []) if (id) ids.push(String(id));
  if (includeMergeSlots) ids.push(...mergeSlotIdsV1(s));
  return ids.filter((id, i) => ids.indexOf(id) === i && s.inventory.some((o) => String(o.id) === id));
}

function bumpRevisionV1(s) {
  s.revision = Math.max(0, I(s.revision, 0)) + 1;
}

/* ---------- fusion (D + clic, Auto Merge) ---------- */

/*
 * Fusionne dans `targetId` tous les objets identiques du sac : jamais un objet protégé, jamais un
 * objet équipé, jamais un objet déjà au niveau 100 (« If an item is at level 100, Auto Merge will not
 * combine that item anymore » ; Build History : « D-clicking and Automerge will now merge items to
 * level 100. Any levels past 100 will be ignored »). Fusion réelle via merge() du moteur.
 */
function mergeSimilarIntoV1(s, targetId) {
  const target = s.inventory.find((o) => String(o.id) === String(targetId));
  if (!target || I(target.level, 0) >= 100) return 0;
  const equipped = equippedSetV1(s);
  const sources = bagItemsInOrderV1(s).filter((o) =>
    String(o.id) !== String(target.id) && o.definitionId === target.definitionId && !o.locked && !equipped.has(String(o.id)) && I(o.level, 0) < 100
  );
  let merged = 0;
  for (const src of sources) {
    if (I(target.level, 0) >= 100) break;
    try {
      idleAdventureMergeItemsV1(s, target.id, src.id);
      merged += 1;
    } catch (_) {
      break;
    }
  }
  return merged;
}

/* MacGuffin Fragments équipés : fusionne les copies du même type de la réserve (niveau sans plafond). */
function mergeMacguffinsV1(data) {
  if (!data || !Array.isArray(data.equipped) || !Array.isArray(data.inventory)) return 0;
  let merged = 0;
  for (const eq of data.equipped) {
    const copies = data.inventory.filter((f) => f && f.type === eq.type && f.uid !== eq.uid);
    for (const f of copies) {
      eq.level = macguffinMergeLevelV1(eq.level, f.level);
      data.inventory.splice(data.inventory.indexOf(f), 1);
      merged += 1;
    }
  }
  return merged;
}

export function idleInventoryRunAutoMergeV1(s, env) {
  const cfg = cfgV1(s);
  let merged = 0;
  for (const id of priorityTargetIdsV1(s, cfg.mergeSlotsMerge)) merged += mergeSimilarIntoV1(s, id);
  merged += mergeMacguffinsV1(env?.macguffins);
  if (merged) {
    idleAdventureSyncInventorySlotsV1(s);
    bumpRevisionV1(s);
  }
  return { merged };
}

/* ---------- boosts : recyclage, A + clic, Auto Boost ---------- */

/*
 * Recyclage d'un boost qui vient d'être consommé (`info` = état avant application) : avec la chance
 * `chance`, il revient dans la même case au palier inférieur (voir en-tête : sémantique déduite des
 * multiplicateurs x1,94 / x1,77 / x1,88 de la page Boost). Renvoie le nouveau boost ou null.
 */
export function idleInventoryRecycleBoostV1(s, info, chance, rng = Math.random) {
  if (!info || !(N(chance, 0) > 0)) return null;
  const idx = IDLE_ADVENTURE_BOOSTS.indexOf(N(info.strength, -1));
  if (idx <= 0) return null;
  if (s.inventory.some((o) => String(o.id) === String(info.id))) return null;
  if (!(rng() < chance)) return null;
  const nb = idleAdventureBoostV1(info.type, IDLE_ADVENTURE_BOOSTS[idx - 1]);
  nb.id = String(info.id);
  nb.level = 0;
  s.inventory.push(nb);
  idleAdventureRecordItemV1(s, nb);
  if (Array.isArray(s.inventorySlots) && info.slotIndex >= 0 && info.slotIndex < s.inventorySlots.length && !s.inventorySlots[info.slotIndex]) {
    s.inventorySlots[info.slotIndex] = nb.id;
  }
  return nb;
}

function boostInfoV1(s, id) {
  const b = s.inventory.find((o) => String(o.id) === String(id));
  if (!b || b.kind !== "boost") return null;
  const slots = Array.isArray(s.inventorySlots) ? s.inventorySlots : [];
  return { id: String(b.id), type: b.boostType, strength: N(b.strength, 0), slotIndex: slots.indexOf(String(b.id)) };
}

/*
 * Boosts utilisables par A + clic / Auto Boost : ni protégés, ni rangés dans un slot d'automerge, ni
 * recyclés pendant la passe en cours quand le réglage « consumeRecycled » est coupé (`pass.skip`).
 */
function usableBoostIdsV1(s, pass) {
  const merge = new Set(mergeSlotIdsV1(s));
  const skip = pass?.skip;
  return bagItemsInOrderV1(s).filter((o) => o.kind === "boost" && !o.locked && !merge.has(String(o.id)) && !(skip && skip.has(String(o.id)))).map((o) => String(o.id));
}

/* État d'une passe A + clic / Auto Boost. */
function boostPassV1(cfg) {
  return { consume: cfg.consumeRecycled !== false, skip: new Set() };
}

/* Après un recyclage réussi : vrai si le boost doit être ré-appliqué tout de suite (réglage par défaut). */
function reapplyRecycledV1(pass, id) {
  if (!pass || pass.consume) return true;
  pass.skip.add(String(id));
  return false;
}

function roomV1(s, targetId, type) {
  const r = idleAdventureBoostRoomV1(s, targetId, type);
  return Number.isFinite(r) && r > EPS ? r : 0;
}

/* Applique chaque boost tant que la stat visée a de la marge ; un boost recyclé est ré-appliqué d'abord. */
function boostTargetV1(s, targetId, boostIds, env, rng, stats, pass) {
  const ctx = boostCtxV1(env);
  for (const id of boostIds) {
    for (;;) {
      const info = boostInfoV1(s, id);
      if (!info || !(roomV1(s, targetId, info.type) > 0)) break;
      try {
        idleAdventureApplyBoostItemV1(s, id, targetId, ctx);
      } catch (_) {
        break;
      }
      stats.applied += 1;
      if (!idleInventoryRecycleBoostV1(s, info, env?.boostRecycleChance, rng)) break;
      stats.recycled += 1;
      if (!reapplyRecycledV1(pass, id)) break;
    }
  }
}

function boostCubeV1(s, boostIds, env, rng, stats, pass) {
  const ctx = boostCtxV1(env);
  for (const id of boostIds) {
    for (;;) {
      const info = boostInfoV1(s, id);
      if (!info) break;
      try {
        idleAdventureCubeBoostItemV1(s, id, ctx);
      } catch (_) {
        break;
      }
      stats.cube += 1;
      if (!idleInventoryRecycleBoostV1(s, info, env?.boostRecycleChance, rng)) break;
      stats.recycled += 1;
      if (!reapplyRecycledV1(pass, id)) break;
    }
  }
}

function targetFullyBoostedV1(s, targetId) {
  return IDLE_BOOST_TYPES_V1.every((type) => !(roomV1(s, targetId, type) > 0));
}

export function idleInventoryRunAutoBoostV1(s, env, rng = Math.random) {
  const cfg = cfgV1(s);
  const stats = { applied: 0, recycled: 0, cube: 0 };
  const pass = boostPassV1(cfg);
  const targets = priorityTargetIdsV1(s, cfg.mergeSlotsBoost).filter((id) => {
    const o = s.inventory.find((x) => String(x.id) === id);
    return o && o.kind !== "boost";
  });
  for (const t of targets) boostTargetV1(s, t, usableBoostIdsV1(s, pass), env, rng, stats, pass);
  /* Infinity Cube : « the cube being boosted if all other equipment is at maximum boost ». */
  if (s.cube?.unlocked && targets.every((t) => targetFullyBoostedV1(s, t))) boostCubeV1(s, usableBoostIdsV1(s, pass), env, rng, stats, pass);
  if (stats.applied || stats.cube) {
    idleAdventureSyncInventorySlotsV1(s);
    bumpRevisionV1(s);
  }
  return stats;
}

/* ---------- transformation des boosts ---------- */

function replaceBoostV1(s, o, type, strength, level) {
  const nb = idleAdventureBoostV1(type, strength);
  nb.id = String(o.id);
  nb.level = Math.max(0, I(level, 0));
  if (o.locked) nb.locked = true;
  const i = s.inventory.indexOf(o);
  s.inventory[i] = nb;
  idleAdventureRecordItemV1(s, nb);
  return nb;
}

export function idleInventoryTransformBoostV1(s, itemId, type, env) {
  if (!env?.boostTransformUnlocked) throw new Error("TRANSFORMATION_BOOST_VERROUILLEE");
  if (!IDLE_BOOST_TYPES_V1.includes(type)) throw new Error("TYPE_BOOST_INVALIDE");
  const o = s.inventory.find((x) => String(x.id) === String(itemId));
  if (!o || o.kind !== "boost") throw new Error("BOOST_INVALIDE");
  if (o.boostType === type) throw new Error("BOOST_DEJA_DE_CE_TYPE");
  const idx = IDLE_ADVENTURE_BOOSTS.indexOf(N(o.strength, -1));
  if (idx < 0) throw new Error("BOOST_INVALIDE");
  /* Coût : un palier de moins (« e.g. 5->2, 200->100, 1k->500 ») sauf après la dernière complétion. */
  if (!env.boostTransformFree && idx === 0) throw new Error("BOOST_PALIER_MINIMUM");
  const strength = env.boostTransformFree ? IDLE_ADVENTURE_BOOSTS[idx] : IDLE_ADVENTURE_BOOSTS[idx - 1];
  /* « This also reduces the boost's level to 0 » (transformation manuelle). */
  const nb = replaceBoostV1(s, o, type, strength, 0);
  bumpRevisionV1(s);
  return { id: nb.id, type: nb.boostType, strength: nb.strength, level: nb.level };
}

/* ---------- butin entrant : filtre, cube, transformation automatique ---------- */

/*
 * Type du filtre basique : les 5 slots d'armure/arme, sinon « accessory » pour tout objet équipable
 * en accessoire (anneaux, amulettes, objets spéciaux « accessory », Tutorial Cube). Boosts,
 * consommables et objets de déblocage (slot « special ») n'ont pas de type : jamais filtrés ainsi.
 */
function basicFilterTypeV1(o) {
  if (!o || o.kind === "boost" || o.consumable) return "";
  if (CORE_SLOTS.includes(o.slot)) return o.slot;
  /* Les secondes armes des sets tardifs sont de type Weapon sur le wiki. */
  if (IDLE_SECOND_WEAPON_SLOTS_V1.includes(o.slot)) return "weapon";
  if (o.kind === "cube") return "accessory";
  if (o.slot === "special" || o.slot === "consumable") return "";
  return "accessory";
}

/* Filtre à modifier pour une zone : le sien, créé au besoin comme copie du filtre en vigueur (au plus 80 zones). */
function filterToEditV1(cfg, zone) {
  if (!cfg.lootFilters[zone]) {
    const base = lootFilterOfZoneV1(cfg, zone);
    cfg.lootFilters[zone] = { types: { ...base.types }, items: { ...base.items } };
  }
  return cfg.lootFilters[zone];
}

function filteredV1(cfg, env, o, zone) {
  if (!o) return false;
  const filtre = lootFilterOfZoneV1(cfg, zone);
  if (env?.lootFilterImproved && filtre.items[String(o.definitionId)]) return true;
  const t = basicFilterTypeV1(o);
  if (env?.lootFilterBasic && t && filtre.types[t]) return true;
  return false;
}

function autoTransformV1(s, cfg, env, o) {
  if (!o || o.kind !== "boost" || !env?.boostTransformFree || !cfg.autoTransform || o.boostType === cfg.autoTransform) return o;
  /* « Auto Transform does not reset the boost level » ; plus de perte de palier après la dernière complétion. */
  return replaceBoostV1(s, o, cfg.autoTransform, N(o.strength, 1), I(o.level, 0));
}

/*
 * Objet filtré déjà présent dans s.inventory : retiré, ou versé dans l'Infinity Cube si c'est un boost
 * et que « Filter Boosts into Infinity Cube! » est acheté (« boosts applied this way will not be
 * recycled » ; ni recyclage ni transformation automatique).
 */
function disposeFilteredV1(s, o, env) {
  if (o.kind === "boost" && env?.filterBoostsIntoCube && s.cube?.unlocked) {
    try {
      idleAdventureCubeBoostItemV1(s, o.id, boostCtxV1(env));
    } catch (_) { /* retiré juste en dessous */ }
  }
  s.inventory = s.inventory.filter((x) => x !== o);
  if (Array.isArray(s.inventorySlots)) s.inventorySlots = s.inventorySlots.map((id) => (String(id) === String(o.id) ? "" : id));
}

/*
 * Drop entrant (ITOPOD) avant son entrée dans le sac. Renvoie l'objet ajouté, { filtered: true } s'il a
 * été filtré, ou null si le sac est plein (même contrat que idleAdventureAddItemV1).
 */
export function idleInventoryReceiveDropV1(s, item, env) {
  const cfg = cfgV1(s);
  if (filteredV1(cfg, env, item, idleInventoryFilterZoneV1(s, env?.filterZone))) {
    idleAdventureRecordItemV1(s, item);
    if (item.kind === "boost" && env?.filterBoostsIntoCube && s.cube?.unlocked) {
      s.inventory.push(item);
      disposeFilteredV1(s, item, env);
      return { filtered: true, cube: true };
    }
    return { filtered: true };
  }
  const added = idleAdventureAddItemV1(s, item);
  return added ? autoTransformV1(s, cfg, env, added) : null;
}

/* Drops d'une action d'Aventure (kill de zone, titan) : objets apparus depuis `beforeIds`. */
export function idleInventoryProcessNewDropsV1(s, beforeIds, env) {
  const cfg = cfgV1(s);
  const before = beforeIds instanceof Set ? beforeIds : new Set(beforeIds || []);
  const out = { filtered: 0, cube: 0, transformed: 0 };
  const zone = idleInventoryFilterZoneV1(s, env?.filterZone);
  for (const o of s.inventory.slice()) {
    if (before.has(String(o.id))) continue;
    if (filteredV1(cfg, env, o, zone)) {
      if (o.kind === "boost" && env?.filterBoostsIntoCube && s.cube?.unlocked) out.cube += 1;
      disposeFilteredV1(s, o, env);
      out.filtered += 1;
    } else if (autoTransformV1(s, cfg, env, o) !== o) {
      out.transformed += 1;
    }
  }
  return out;
}

export function idleInventoryIdsV1(s) {
  return new Set((Array.isArray(s?.inventory) ? s.inventory : []).map((o) => String(o.id)));
}

/* Boost manuel (glisser-déposer sur un objet ou sur le cube) : informations à relire après l'action. */
export function idleInventoryManualBoostBeforeV1(s, payload) {
  const a = String(payload?.action || payload?.mode || "");
  if (a !== "boost" && a !== "cube") return null;
  idleAdventureSyncInventorySlotsV1(s);
  return boostInfoV1(s, payload.boostId);
}

export function idleInventoryManualBoostAfterV1(s, info, env, rng = Math.random) {
  if (!info) return null;
  const nb = idleInventoryRecycleBoostV1(s, info, env?.boostRecycleChance, rng);
  return nb ? { recycled: true, id: nb.id, strength: nb.strength } : null;
}

/* ---------- loadouts ---------- */

function loadoutSaveV1(s, index, env) {
  const cfg = cfgV1(s);
  const i = I(index, -1);
  if (i < 0 || i >= Math.max(0, I(env?.loadoutSlots, 0))) throw new Error("LOADOUT_VERROUILLE");
  const eq = s.equipment || {};
  cfg.loadouts[i] = normalizeLoadoutV1({ ...eq, accessories: Array.isArray(eq.accessories) ? eq.accessories : [] });
  return { index: i, loadout: X(cfg.loadouts[i]) };
}

/* Applique un loadout sur une copie de l'état Aventure ; renvoie la copie (le sac ne doit pas déborder). */
function loadoutApplyV1(s, index, env) {
  const cfg = cfgV1(s);
  const i = I(index, -1);
  if (i < 0 || i >= Math.max(0, I(env?.loadoutSlots, 0))) throw new Error("LOADOUT_VERROUILLE");
  const lo = cfg.loadouts[i];
  if (!lo) throw new Error("LOADOUT_VIDE");
  const w = X(s);
  const has = (id) => w.inventory.some((o) => String(o.id) === String(id));
  for (const slot of CORE_SLOTS) {
    const id = lo[slot];
    if (!id) {
      if (w.equipment[slot]) idleAdventureUnequipItemV1(w, w.equipment[slot]);
    } else if (has(id) && w.equipment[slot] !== id) {
      try { idleAdventureEquipItemV1(w, id, slot); } catch (_) { /* objet devenu inéquipable : slot inchangé */ }
    }
  }
  const voulus = lo.accessories.filter(has);
  for (const id of (Array.isArray(w.equipment.accessories) ? w.equipment.accessories.slice() : [])) {
    if (!voulus.includes(String(id))) idleAdventureUnequipItemV1(w, id);
  }
  for (const id of voulus) {
    if (w.equipment.accessories.includes(id)) continue;
    if (CORE_SLOTS.some((slot) => w.equipment[slot] === id)) continue;
    try { idleAdventureEquipItemV1(w, id, "accessory"); } catch (_) { /* plus de slot libre : ignoré */ }
  }
  if (idleAdventureInventoryUsedV1(w) > idleAdventureInventoryCapacityV1(w)) throw new Error("SAC_PLEIN");
  idleAdventureSyncInventorySlotsV1(w);
  bumpRevisionV1(w);
  return w;
}

/* ---------- minuteurs (appelé par le tick d'idle-ngu-progression.js) ---------- */

export function advanceIdleInventoryAutoV1(s, seconds, envFn, rng = Math.random) {
  if (!s || !(seconds > 0)) return null;
  const cfg = cfgV1(s);
  if (!cfg.autoMerge && !cfg.autoBoost) return null;
  const env = typeof envFn === "function" ? envFn() : envFn;
  const interval = idleInventoryAutoIntervalSecondsV1(env);
  const out = {};
  if (cfg.autoMerge && env?.autoMergeUnlocked) {
    cfg.mergeElapsed += seconds;
    if (cfg.mergeElapsed >= interval) {
      cfg.mergeElapsed %= interval;
      out.merge = idleInventoryRunAutoMergeV1(s, env);
    }
  }
  if (cfg.autoBoost && env?.autoBoostUnlocked) {
    cfg.boostElapsed += seconds;
    if (cfg.boostElapsed >= interval) {
      cfg.boostElapsed %= interval;
      out.boost = idleInventoryRunAutoBoostV1(s, env, rng);
    }
  }
  return out;
}

/* ---------- actions joueur : { action: "inventoryAuto", mode, ... } ---------- */

export function applyIdleInventoryAutoActionV1(state, payload, env, rng = Math.random) {
  const s = state.adventure;
  const cfg = cfgV1(s);
  const mode = String(payload?.mode || "");
  if (mode === "settings") {
    const out = {};
    if (payload.autoMerge !== undefined) {
      if (payload.autoMerge && !env?.autoMergeUnlocked) throw new Error("AUTO_MERGE_VERROUILLE");
      if (Boolean(payload.autoMerge) !== cfg.autoMerge) cfg.mergeElapsed = 0;
      cfg.autoMerge = out.autoMerge = Boolean(payload.autoMerge);
    }
    if (payload.autoBoost !== undefined) {
      if (payload.autoBoost && !env?.autoBoostUnlocked) throw new Error("AUTO_BOOST_VERROUILLE");
      if (Boolean(payload.autoBoost) !== cfg.autoBoost) cfg.boostElapsed = 0;
      cfg.autoBoost = out.autoBoost = Boolean(payload.autoBoost);
    }
    if (payload.mergeSlotsMerge !== undefined) cfg.mergeSlotsMerge = out.mergeSlotsMerge = Boolean(payload.mergeSlotsMerge);
    if (payload.mergeSlotsBoost !== undefined) cfg.mergeSlotsBoost = out.mergeSlotsBoost = Boolean(payload.mergeSlotsBoost);
    if (payload.consumeRecycled !== undefined) cfg.consumeRecycled = out.consumeRecycled = Boolean(payload.consumeRecycled);
    if (payload.autoTransform !== undefined) {
      const t = String(payload.autoTransform || "");
      if (t && !IDLE_BOOST_TYPES_V1.includes(t)) throw new Error("TYPE_BOOST_INVALIDE");
      if (t && !env?.boostTransformFree) throw new Error("TRANSFORMATION_AUTO_VERROUILLEE");
      cfg.autoTransform = out.autoTransform = t;
    }
    return out;
  }
  if (mode === "mergeAll") {
    const id = String(payload.itemId || payload.id || "");
    if (!s.inventory.some((o) => String(o.id) === id)) throw new Error("OBJET_INTROUVABLE");
    const merged = mergeSimilarIntoV1(s, id);
    if (merged) { idleAdventureSyncInventorySlotsV1(s); bumpRevisionV1(s); }
    return { id, merged };
  }
  if (mode === "boostAll") {
    const target = String(payload.targetId || payload.itemId || "");
    const stats = { applied: 0, recycled: 0, cube: 0 };
    const pass = boostPassV1(cfg);
    if (target === "cube") {
      if (!s.cube?.unlocked) throw new Error("CUBE_VERROUILLE");
      boostCubeV1(s, usableBoostIdsV1(s, pass), env, rng, stats, pass);
    } else {
      const o = s.inventory.find((x) => String(x.id) === target);
      if (!o || o.kind === "boost") throw new Error("BOOST_INVALIDE");
      boostTargetV1(s, target, usableBoostIdsV1(s, pass), env, rng, stats, pass);
    }
    if (stats.applied || stats.cube) { idleAdventureSyncInventorySlotsV1(s); bumpRevisionV1(s); }
    return stats;
  }
  if (mode === "transformBoost") return idleInventoryTransformBoostV1(s, payload.itemId || payload.id, String(payload.type || ""), env);
  if (mode === "loadoutSave") return loadoutSaveV1(s, payload.index, env);
  if (mode === "loadoutApply") {
    state.adventure = loadoutApplyV1(s, payload.index, env);
    return { index: I(payload.index, -1), equipment: X(state.adventure.equipment) };
  }
  if (mode === "lootFilterType") {
    if (!env?.lootFilterBasic) throw new Error("FILTRE_BASIQUE_VERROUILLE");
    const t = String(payload.slot || "");
    if (!IDLE_LOOT_FILTER_TYPES_V1.includes(t)) throw new Error("TYPE_FILTRE_INVALIDE");
    const zone = idleInventoryFilterZoneV1(s, payload.zone);
    const filtre = filterToEditV1(cfg, zone);
    if (payload.filtered) filtre.types[t] = true; else delete filtre.types[t];
    return { slot: t, zone, filtered: Boolean(filtre.types[t]) };
  }
  if (mode === "lootFilterItem") {
    if (!env?.lootFilterImproved) throw new Error("FILTRE_AMELIORE_VERROUILLE");
    const d = String(payload.definitionId || "");
    /* L'Item List ne propose que les objets déjà découverts. */
    if (!s.itemList?.[d]?.seen) throw new Error("OBJET_NON_DECOUVERT");
    const zone = idleInventoryFilterZoneV1(s, payload.zone);
    const filtre = filterToEditV1(cfg, zone);
    if (payload.filtered) filtre.items[d] = true; else delete filtre.items[d];
    return { definitionId: d, zone, filtered: Boolean(filtre.items[d]) };
  }
  throw new Error("MODE_INVENTAIRE_AUTO_INCONNU");
}

/* ---------- snapshot client ---------- */

function nomDefinitionV1(s, definitionId) {
  const vivant = (Array.isArray(s.inventory) ? s.inventory : []).find((o) => o.definitionId === definitionId);
  if (vivant?.name) return String(vivant.name);
  const b = /^boost:(power|toughness|special):(\d+)$/.exec(String(definitionId));
  if (b) return `Boost ${b[1]} ${b[2]}`;
  try { return idleAdventureItemAtLevelV47(definitionId, 0).name; } catch (_) { return String(definitionId); }
}

export function idleInventoryAutoSnapshotV1(s, env) {
  const cfg = normalizeIdleInventoryAutoV1(s?.inventoryAuto);
  const interval = idleInventoryAutoIntervalSecondsV1(env);
  const slots = Math.max(0, I(env?.loadoutSlots, 0));
  const byId = new Map((Array.isArray(s?.inventory) ? s.inventory : []).map((o) => [String(o.id), o]));
  const nom = (id) => (id && byId.has(String(id)) ? String(byId.get(String(id)).name || "") : "");
  const zoneFiltre = idleInventoryFilterZoneV1(s, env?.filterZone);
  const filtreZone = lootFilterOfZoneV1(cfg, zoneFiltre);
  return {
    unlocked: {
      autoMerge: Boolean(env?.autoMergeUnlocked),
      autoBoost: Boolean(env?.autoBoostUnlocked),
      lootFilterBasic: Boolean(env?.lootFilterBasic),
      lootFilterImproved: Boolean(env?.lootFilterImproved),
      filterBoostsIntoCube: Boolean(env?.filterBoostsIntoCube),
      boostTransform: Boolean(env?.boostTransformUnlocked),
      boostTransformFree: Boolean(env?.boostTransformFree),
      autoTransform: Boolean(env?.boostTransformFree)
    },
    settings: {
      autoMerge: cfg.autoMerge,
      autoBoost: cfg.autoBoost,
      mergeSlotsMerge: cfg.mergeSlotsMerge,
      mergeSlotsBoost: cfg.mergeSlotsBoost,
      consumeRecycled: cfg.consumeRecycled,
      autoTransform: cfg.autoTransform
    },
    intervalSeconds: interval,
    mergeRemainingSeconds: cfg.autoMerge ? Math.max(0, interval - cfg.mergeElapsed) : null,
    boostRemainingSeconds: cfg.autoBoost ? Math.max(0, interval - cfg.boostElapsed) : null,
    boostRecycleChance: Math.max(0, N(env?.boostRecycleChance, 0)),
    mergeSlots: Math.max(0, I(s?.mergeSlots, 0)),
    mergeSlotsMax: IDLE_INVENTORY_MERGE_SLOTS_MAX_V1,
    loadoutSlots: slots,
    loadoutsMax: IDLE_INVENTORY_LOADOUTS_MAX_V1,
    loadouts: cfg.loadouts.slice(0, slots).map((lo) => (lo ? {
      items: [...CORE_SLOTS.map((slot) => ({ slot, id: lo[slot], name: nom(lo[slot]) })), ...lo.accessories.map((id) => ({ slot: "accessory", id, name: nom(id) }))].filter((x) => x.id)
    } : null)),
    /* Filtre de la zone où se trouve le joueur (un changement de zone change le filtre affiché ET appliqué). */
    lootFilterZone: zoneFiltre,
    lootFilter: { types: X(filtreZone.types), items: Object.keys(filtreZone.items) },
    lootFilterTypes: [...IDLE_LOOT_FILTER_TYPES_V1],
    filterable: env?.lootFilterImproved
      ? Object.entries(s?.itemList || {}).filter(([, v]) => v && v.seen).map(([d]) => ({ definitionId: d, name: nomDefinitionV1(s, d), filtered: Boolean(filtreZone.items[d]) }))
      : []
  };
}
