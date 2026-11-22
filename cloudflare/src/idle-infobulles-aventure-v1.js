/*
 * SOREAL IDLE : infobulles de chiffres du vrai jeu pour les titans, les zones et l'équipement (Norman, 2026-11-22 : « corrige tout en une fois »).
 *
 * Source (règle n°1) : le jeu, build 1260 (IL, Assembly-CSharp.dll). Rien n'est inventé :
 *  - TITANS : AdventureController::beastLootRates, nerdLootRates, godmotherLootRates, exileLootRates, itHungersLootRates, rockLobsterLootRates, amalgamateLootRates. Chaque ligne affiche
 *    base x facteur de butin x 100 (Character::actualLootChancePercent, ou ...Rooted = racine cubique pour les titans Evil/Sadistic), format « ##0.## » + « % », remplacée par le PLAFOND en vert
 *    quand le produit l'atteint (Character::lootChanceDisplay / lootChanceDisplayRooted : sans argument de plafond, 100 %). Les lignes « Normal Loot / Rare Loot » de Jake, UUG et Walderp
 *    viennent de AdventureController::zoneDescriptions (zones 11, 14 et 16 du jeu = les zones de ces titans).
 *  - ZONES : AdventureController::zoneDescriptions (« Boost Drop Chance », « Normal Mob Drop Chance », « Boss Drop Chance »). Les chiffres des zones sont ceux du moteur
 *    (IDLE_ADVENTURE_ZONE_LOOT_PROFILE_V2), contrôlés contre le jeu par le test idle-infobulles-aventure-v1 (une seule différence connue : JRPGVille, voir DIFFERENCES_JEU_V1).
 *  - ÉQUIPEMENT : Equipment::tooltipText : « Stats (X%) » avec X = min(1, boss effectif / bossRequired) x 100 (format « ##.# »), Power et Toughness mis à l'échelle floor(valeur x X), Max Health = Power
 *    mis à l'échelle x 3, Health Regen = Toughness mis à l'échelle x 0,03, chaque Special mis à l'échelle de la même façon (idle-adventure-boss-requis-v1.js).
 *
 * Les taux de base des titans sont ceux de rollTitanLootV1 (idle-adventure-combat.js) : le test relit ce fichier et vérifie que chaque base y figure (jamais deux valeurs qui divergent).
 * Anti-spoil (règle n°2) : seuls les titans déjà atteignables (ou déjà vaincus), leurs versions déjà ouvertes (la 1re, puis chaque version dont la précédente a été vaincue) et les zones
 * déjà ouvertes reçoivent des lignes ; rien n'est envoyé pour le reste, et aucun total n'est donné. Pièce légère : aucun champ horodaté ni aléatoire.
 */
import { IDLE_ADVENTURE_ZONE_LOOT_PROFILE_V2, idleAdventureDropChanceV2 } from "./idle-adventure-butin.js";
import { IDLE_ADVENTURE_ZONES } from "./idle-adventure-zones.js";
import { idleBossRequisFacteurV1, idleBossRequisEchelleV1, IDLE_BOSS_REQUIS_V1 } from "./idle-adventure-boss-requis-v1.js";
import { idleAdventureSpecialsListV1 } from "./idle-adventure-objets.js";
import { wikiItemIdAdventureV1 } from "./idle-adventure-sets.js";

const N = (v, d = 0) => { const n = Number(v); return Number.isFinite(n) ? n : d; };
/* 10 chiffres significatifs : la réponse ne porte pas les restes de calcul flottant (0,35000000000000003). */
const P10 = (v) => Number(Number(v).toPrecision(10));

/* Marqueur « racine cubique du facteur de butin » (Character::lootFactorRooted) pour idleAdventureDropChanceV2 : même règle que les zones Evil et les titans Evil du moteur. */
const MARQUE_RACINE_V1 = Object.freeze({ id: "infobulle-racine", requiredDifficulty: "difficile" });

/*
 * Titans : lignes de la page de butin. [clé, base] ; plafond en fraction (0,25 = 25 %) ; « racine » = lootChanceDisplayRooted.
 * Ordre des clés de version : main (V1) puis v2, v3, v4, dans l'ordre des paliers easy, normal, hard, brutal.
 */
export const IDLE_INFOBULLES_TITANS_V1 = Object.freeze({
  /* beastLootRates : « Main Set Drop Chance » seulement, 0,0005, lootChanceDisplay (sans plafond donné : 100 %). */
  t6: Object.freeze({ racine: false, cap: 1, paliers: true, lignes: Object.freeze([["main", 0.0005]]), seulementPremier: true }),
  /* nerdLootRates, plafond 25 %, Rooted. */
  nerd: Object.freeze({ racine: true, cap: 0.25, paliers: true, lignes: Object.freeze([["main", 0.00035], ["v2", 0.00027], ["v3", 0.00022], ["v4", 0.00017]]) }),
  /* godmotherLootRates */
  godmother: Object.freeze({ racine: true, cap: 0.25, paliers: true, lignes: Object.freeze([["main", 0.0001], ["v2", 0.000075], ["v3", 0.00006], ["v4", 0.000045]]) }),
  /* exileLootRates */
  t7: Object.freeze({ racine: true, cap: 0.25, paliers: true, lignes: Object.freeze([["main", 0.00002], ["v2", 0.00001], ["v3", 0.000006], ["v4", 0.000004]]) }),
  /* itHungersLootRates */
  hungers: Object.freeze({ racine: true, cap: 0.25, paliers: true, lignes: Object.freeze([["main", 1e-6], ["v2", 6e-7], ["v3", 4e-7], ["v4", 3e-7]]) }),
  /* rockLobsterLootRates */
  lobster: Object.freeze({ racine: true, cap: 0.25, paliers: true, lignes: Object.freeze([["main", 1e-7], ["v2", 6.5e-8], ["v3", 4e-8], ["v4", 3e-8]]) }),
  /* amalgamateLootRates */
  amalgamate: Object.freeze({ racine: true, cap: 0.25, paliers: true, lignes: Object.freeze([["main", 1.4e-8], ["v2", 1e-8], ["v3", 8e-9], ["v4", 6e-9]]) }),
  /* zoneDescriptions, zones 11, 14 et 16 (lootChanceDisplay sans plafond : 100 %) : titans Jake, UUG et Walderp, sans versions. */
  t3: Object.freeze({ racine: false, cap: 1, paliers: false, lignes: Object.freeze([["normal", 0.1], ["rare", 0.02]]) }),
  t4: Object.freeze({ racine: false, cap: 1, paliers: false, lignes: Object.freeze([["normal", 0.02], ["rare", 0.001]]) }),
  t5: Object.freeze({ racine: false, cap: 1, paliers: false, lignes: Object.freeze([["normal", 0.005], ["rare", 0.0001]]) }),
});

const PALIERS_V1 = Object.freeze(["easy", "normal", "hard", "brutal"]);
const CLE_PALIER_V1 = Object.freeze({ main: "easy", v2: "normal", v3: "hard", v4: "brutal" });

/* Une ligne : pct = valeur affichée (en %), plafond = vrai quand le produit atteint le plafond (le jeu écrit alors le plafond, en vert), cap = plafond en %. */
function ligne(cle, base, cap, racine, facteur) {
  const fraction = idleAdventureDropChanceV2(base, cap, facteur, racine ? MARQUE_RACINE_V1 : null);
  const atteint = fraction >= cap;
  return { k: cle, pct: P10(atteint ? cap * 100 : fraction * 100), ...(atteint ? { plafond: true } : {}) };
}

/* La version (V2, V3, V4) est « ouverte » quand la précédente a été vaincue au moins une fois, ou quand elle l'a elle-même été ; la première l'est toujours. */
function versionOuverte(cle, difficultyKills) {
  const rang = PALIERS_V1.indexOf(CLE_PALIER_V1[cle]);
  if (rang <= 0) return true;
  const k = difficultyKills && typeof difficultyKills === "object" ? difficultyKills : {};
  return N(k[PALIERS_V1[rang]]) > 0 || N(k[PALIERS_V1[rang - 1]]) > 0;
}

/* titans : tableau de la réponse (déjà filtré anti-spoil : seulement les titans visibles) ; retourne { id: [lignes] } pour ceux qui ont des lignes. */
export function idleInfobullesTitansV1(titans, facteurButin) {
  const sortie = {};
  for (const t of Array.isArray(titans) ? titans : []) {
    const def = t && IDLE_INFOBULLES_TITANS_V1[t.id];
    if (!def) continue;
    const accessible = t.progressionUnlocked !== false || N(t.state && t.state.kills) > 0;
    if (!accessible) continue;
    const dk = t.state && t.state.difficultyKills;
    const lignes = [];
    for (const [cle, base] of def.lignes) {
      if (def.paliers && !versionOuverte(cle, dk)) continue;
      lignes.push(ligne(cle, base, def.cap, def.racine, facteurButin));
    }
    if (lignes.length) sortie[t.id] = lignes;
  }
  return sortie;
}

/*
 * Zones : quelles lignes le jeu affiche pour chaque zone (zoneDescriptions). Le reste (zones basses, Ciel, base haute sécurité, Dimension de l'horloge, sûre) n'en affiche aucune dans le jeu.
 * boost = première ligne de boosts de la zone, mob = équipement des ennemis normaux, boss = équipement du boss (plafond du moteur ; absent = 100 %).
 */
export const IDLE_INFOBULLES_ZONES_V1 = Object.freeze({
  "2d": ["boost"], ancient: ["boost"], avsp: ["boost"], mega: ["boost"],
  beardverse: ["boost", "boss"],
  badly: ["boost", "mob", "boss"], boring: ["boost", "mob", "boss"],
  chocolate: ["boost", "mob", "boss"], evilverse: ["boost", "mob", "boss"], pinkprincess: ["boost", "mob", "boss"],
  metaland: ["boost", "mob", "boss"], interdimensional: ["boost", "mob", "boss"],
  typozone: ["boost", "mob", "boss"], fadlands: ["boost", "mob", "boss"], jrpgville: ["boost", "mob", "boss"],
  radlands: ["boost", "mob", "boss"], backtoschool: ["boost", "mob", "boss"], westworld: ["boost", "mob", "boss"],
  breadverse: ["boost", "mob", "boss"], seventies: ["boost", "mob", "boss"], halloweenies: ["boost", "mob", "boss"],
  construction: ["boost", "mob", "boss"], duckduck: ["boost", "mob", "boss"], netherregions: ["boost", "mob", "boss"],
  aethereansea: ["boost", "mob", "boss"],
});

/*
 * Écart connu entre le jeu (IL) et le moteur, affiché tel que le MOTEUR tire (l'infobulle ne doit jamais promettre autre chose que ce qui tombe) et signalé à Norman : JRPGVille, boosts :
 * le jeu écrit 0,0000015 (1,5e-6) avec plafond 8 %, le moteur tire 0,000015 (1,5e-5) avec plafond 10 % (profil du 2026-09-23, d'après le wiki).
 */
export const DIFFERENCES_JEU_V1 = Object.freeze({}); /* plus aucun écart : JRPGVille aligné sur le jeu le 2026-11-22 */

function definitionLigneZone(zoneId, cle) {
  const p = IDLE_ADVENTURE_ZONE_LOOT_PROFILE_V2[zoneId];
  if (!p) return null;
  const d = cle === "boost" ? p.normal && p.normal.boosts && p.normal.boosts[0]
    : cle === "mob" ? p.normal && p.normal.equipment && p.normal.equipment[0]
    : p.boss && p.boss.equipment && p.boss.equipment[0];
  return d && N(d.chance) > 0 ? d : null;
}

/* zones : tableau de la réponse (déjà filtré) ; retourne { zoneId: [lignes] } pour les zones OUVERTES seulement. */
export function idleInfobullesZonesV1(zones, facteurButin) {
  const sortie = {};
  for (const z of Array.isArray(zones) ? zones : []) {
    if (!z || !z.unlocked) continue;
    const modele = IDLE_INFOBULLES_ZONES_V1[z.id];
    if (!modele) continue;
    const zoneMoteur = IDLE_ADVENTURE_ZONES.find((x) => x.id === z.id);
    const lignes = [];
    for (const cle of modele) {
      const d = definitionLigneZone(z.id, cle);
      if (!d) continue;
      const cap = d.cap == null ? 1 : N(d.cap);
      const fraction = idleAdventureDropChanceV2(N(d.chance), cap, facteurButin, zoneMoteur);
      const atteint = fraction >= cap;
      lignes.push({ k: cle, pct: P10(atteint ? cap * 100 : fraction * 100), ...(atteint ? { plafond: true } : {}) });
    }
    if (lignes.length) sortie[z.id] = lignes;
  }
  return sortie;
}

/*
 * Équipement : mise à l'échelle par le boss atteint (Equipment::tooltipText). Retourne null quand rien ne change (objet sans palier, ou boss effectif >= palier : le jeu n'écrit alors pas « (X%) »).
 * pct = min(1, boss / requis) x 100 ; power / toughness / hp / regen = valeurs mises à l'échelle (floor), specials = valeurs mises à l'échelle dans l'ordre de specialsAll.
 */
export function idleEchelleBossObjetV1(objet, bossEffectif) {
  if (!objet || bossEffectif === null || bossEffectif === undefined || !Number.isFinite(bossEffectif)) return null;
  const wikiId = objet.wikiItemId || wikiItemIdAdventureV1(objet.definitionId);
  const requis = IDLE_BOSS_REQUIS_V1[wikiId] || 0;
  if (!(requis > 0) || bossEffectif >= requis) return null;
  const f = idleBossRequisFacteurV1(wikiId, bossEffectif);
  const power = idleBossRequisEchelleV1(N(objet.power), f);
  const toughness = idleBossRequisEchelleV1(N(objet.toughness), f);
  const specials = [];
  for (const sv of idleAdventureSpecialsListV1(objet)) {
    const ratio = N(sv.ratio);
    const brut = ratio > 0 ? Math.round(N(sv.value) * ratio * 1e6) / 1e6 : N(sv.value);
    specials.push(ratio > 0 ? idleBossRequisEchelleV1(brut, f) / ratio : N(sv.value));
  }
  return { pct: Math.round(f * 1000) / 10, power, hp: power * 3, toughness, regen: toughness * 0.03, ...(specials.length ? { specials } : {}) };
}

/* Applique l'échelle aux objets du sac de la réponse (copies : l'état n'est jamais modifié). */
export function idleObjetsAvecEchelleBossV1(objets, bossEffectif) {
  if (!Array.isArray(objets)) return objets;
  return objets.map((o) => {
    const e = idleEchelleBossObjetV1(o, bossEffectif);
    return e ? { ...o, echelleBoss: e } : o;
  });
}
