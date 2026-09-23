import {
  createIdleAdventureStateV47,
  normalizeIdleAdventureStateV47,
  applyIdleAdventureActionV47,
  idleAdventureSnapshotV47,
  idleAdventureEquipmentStatsV47,
  idleAdventureBoostV1,
  idleAdventureAddItemV1,
  idleAdventureCubeTierV1
} from "./idle-adventure-v47.js";
import {
  bigFromLog10V1,
  bigToNumberV1
} from "./idle-big-number-v1.js";
import {
  IDLE_PERKS_CATALOG_V1,
  idlePerkByIdV1,
  idlePerkNextCostV1,
  perkBonusesV1
} from "./idle-perks-v1.js";
import {
  IDLE_SELLOUT_SHOP_CATALOG_V1,
  idleSelloutShopItemV1,
  idleSelloutShopNextCostV1,
  idleSelloutShopBuyV1
} from "./idle-sellout-shop-v1.js";
import {
  IDLE_QUIRKS_CATALOG_V1,
  idleQuirkByIdV1,
  idleQuirkNextCostV1,
  quirkBonusesV1
} from "./idle-quirks-v1.js";
import {
  IDLE_WISHES_CATALOG_V1,
  wishBonusesV1
} from "./idle-wishes-v1.js";
import { levelsPerFillBasicTrainingV411 } from "./idle-basic-training.js";
import {
  IDLE_NGU_CATALOG_V1,
  IDLE_NGU_TIERS_V1,
  IDLE_NGU_MAX_LEVEL_V1,
  nguParamsV1,
  nguEffectPctV1,
  nguEffectsV1,
  nguActiveTiersV1,
  nguLevelsFromWorkV1
} from "./idle-ngu-catalog-v1.js";

/*
 * SOREAL IDLE — early game NGU parity engine.
 *
 * Scope: Normal difficulty from a fresh save through the first Titan / first NGU layer.
 * This file intentionally does not migrate the previous experimental meta-progression.
 * Old SOREAL IDLE saves are disposable while the game is still in private development.
 *
 * The UI may translate names to the SOREAL universe. The progression rules stay NGU-like.
 */

export const IDLE_NGU_META_VERSION = "META-V47-EARLYGAME-NGU";
export const IDLE_NGU_SAVE_SCHEMA = 47;

const RESOURCE_KEYS = Object.freeze(["energy", "magic", "r3"]);

/*
 * Audit 2026-09-17 (screenshot Norman du vrai "Spend EXP" NGU) : le nombre
 * de boss requis pour débloquer Power/Cap dans CE shop ("REACH BOSS 17 FOR
 * MORE PURCHASES HERE!", visible en jeu sous Energy Speed/Bars) est le MÊME
 * palier que celui déjà vérifié pour Augmentations juste plus bas
 * (IDLE_NGU_SYSTEMS, unlock:{bosses:17}) — cohérent avec le wiki/communauté
 * ("energy power is useless to you until you kill boss #17 and unlock
 * augments"). Une seule constante partagée pour ne jamais dupliquer cette
 * règle métier entre les deux endroits qui la consomment.
 */
export const IDLE_NGU_RESOURCE_POWER_CAP_UNLOCK_BOSS_V1 = 17;

// NGU Spend EXP base purchases. Values are base-stat increments per purchase,
// not UI-derived multipliers. Keeping them here makes APP/TV consume one table.
//
// `bulkTiers` : quantités de raccourci proposées par le vrai shop NGU (x1/x10
// systématiques, x100 en plus pour les stats à plafond élevé). Confirmé par
// capture d'écran Norman du vrai jeu pour Energy (Speed : x1/x10 seulement —
// wiki/capture n'en montre jamais x100, cohérent avec un hardCap de 50 ;
// Bars : x1/x10/x100, hardCap 1e18). Magic/R3 partagent la même structure de
// shop qu'Energy (mêmes 4 stats, même mécanique de plafond) donc le même
// motif de paliers est appliqué par symétrie — seul le TABLEAU DE PRIX change
// par ressource, jamais recalculé côté client de toute façon (quantité ×
// cost/gain, cf buyResource ci-dessous).
//
// `unlockBoss` sur power/cap : cf IDLE_NGU_RESOURCE_POWER_CAP_UNLOCK_BOSS_V1
// ci-dessus. Absent (undefined) sur speed/bars : ces deux stats sont
// achetables dès le début de la partie, exactement comme le montre la
// capture d'écran du vrai jeu.
export const IDLE_NGU_RESOURCE_PURCHASES = Object.freeze({
  energy: Object.freeze({
    speed: Object.freeze({ cost: 2, gain: 0.1, hardCap: 50, bulkTiers: Object.freeze([1, 10]) }),
    power: Object.freeze({ cost: 15, gain: 0.1, hardCap: 1e18, bulkTiers: Object.freeze([1, 10, 100]), unlockBoss: IDLE_NGU_RESOURCE_POWER_CAP_UNLOCK_BOSS_V1 }),
    cap: Object.freeze({ cost: 40, gain: 10000, hardCap: 9e18, bulkTiers: Object.freeze([1, 10, 100]), unlockBoss: IDLE_NGU_RESOURCE_POWER_CAP_UNLOCK_BOSS_V1 }),
    bars: Object.freeze({ cost: 80, gain: 1, hardCap: 1e18, bulkTiers: Object.freeze([1, 10, 100]) })
  }),
  magic: Object.freeze({
    speed: Object.freeze({ cost: 3, gain: 0.1, hardCap: 50, bulkTiers: Object.freeze([1, 10]) }),
    power: Object.freeze({ cost: 45, gain: 0.1, hardCap: 1e18, bulkTiers: Object.freeze([1, 10, 100]), unlockBoss: IDLE_NGU_RESOURCE_POWER_CAP_UNLOCK_BOSS_V1 }),
    cap: Object.freeze({ cost: 120, gain: 10000, hardCap: 9e18, bulkTiers: Object.freeze([1, 10, 100]), unlockBoss: IDLE_NGU_RESOURCE_POWER_CAP_UNLOCK_BOSS_V1 }),
    bars: Object.freeze({ cost: 240, gain: 1, hardCap: 1e18, bulkTiers: Object.freeze([1, 10, 100]) })
  }),
  /*
   * Audit 2026-09-16 : la page "Resource 3" du "Spend EXP" menu (wiki,
   * currencies-gold-exp-ap.md) était totalement absente ici — buyResource
   * levait ACHAT_RESSOURCE_INDISPONIBLE pour r3 dans tous les cas, alors
   * qu'Energy/Magic fonctionnaient déjà. Mêmes hardCap qu'Energy/Magic
   * (colonnes "Capped at..." identiques sur le wiki), seuls les coûts EXP
   * changent (bien plus chers, cohérent avec R3 débloqué plus tard).
   */
  r3: Object.freeze({
    speed: Object.freeze({ cost: 300000, gain: 0.1, hardCap: 50, bulkTiers: Object.freeze([1, 10]) }),
    power: Object.freeze({ cost: 1500000, gain: 0.1, hardCap: 1e18, bulkTiers: Object.freeze([1, 10, 100]), unlockBoss: IDLE_NGU_RESOURCE_POWER_CAP_UNLOCK_BOSS_V1 }),
    cap: Object.freeze({ cost: 4000000, gain: 10000, hardCap: 9e18, bulkTiers: Object.freeze([1, 10, 100]), unlockBoss: IDLE_NGU_RESOURCE_POWER_CAP_UNLOCK_BOSS_V1 }),
    bars: Object.freeze({ cost: 8000000, gain: 1, hardCap: 1e18, bulkTiers: Object.freeze([1, 10, 100]) })
  })
});

/*
 * NGU Spend EXP "Newbie Offers" — captures d'écran Norman du vrai shop
 * (2026-09-17) : trois achats à usage unique, réservés à Energy Speed
 * (aucune section équivalente visible sous Energy Bars sur la capture, et
 * Magic/R3 se débloquent bien plus tard — bosses:37/hacks — quand le joueur
 * n'est plus un "newbie" ; recherche wiki croisée (ngu-idle.fandom.com,
 * pages Experience/Magic/Resource 3) ne mentionne aucune Newbie Offer pour
 * ces deux ressources, cohérent avec l'hypothèse). Nettement meilleur taux
 * que l'achat normal (2 EXP pour 0.1) : 1 EXP->0.2, 2 EXP->0.3, 3 EXP->0.4.
 * Achetable une seule fois PAR COMPTE, jamais remise en jeu par une
 * Renaissance (un bonus de démarrage n'a pas de sens à refarmer à l'infini
 * à chaque Renaissance ; state.records survit déjà à la Renaissance pour
 * les mêmes raisons que highestBoss/totalRebirths juste à côté).
 */
export const IDLE_NGU_NEWBIE_OFFERS = Object.freeze({
  energy: Object.freeze({
    speed: Object.freeze([
      Object.freeze({ id: "energySpeedNewbie1", cost: 1, gain: 0.2 }),
      Object.freeze({ id: "energySpeedNewbie2", cost: 2, gain: 0.3 }),
      Object.freeze({ id: "energySpeedNewbie3", cost: 3, gain: 0.4 })
    ])
  })
});
const EARLY_GAME_MAX_OFFLINE_SECONDS = 30 * 24 * 3600;
const MIN_REBIRTH_SECONDS = 180;
/*
 * Wiki NGU (page "Wishes", section "Important Math") : "Wishes have a hard
 * cap of 4 hours, after which putting more resources into it will not
 * speed up the process." — plancher de temps par niveau, quel que soit le
 * débit de ressources. (Le wiki mentionne aussi une réduction à 3h via
 * Perks/Quirks ; non implémentée ici, aucune Perk/Quirk Normal de
 * SOREAL IDLE ne la fournit actuellement — idle-perks-v1.js/idle-quirks-
 * v1.js n'incluent que les entrées Normal, et "Minimum Wish Time
 * Reduction I/II" est Evil-only sur le wiki.)
 */
const WISH_MIN_LEVEL_SECONDS = 4 * 3600;

function num(v, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}
function int(v, d = 0) {
  return Math.floor(num(v, d));
}
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, num(v, min)));
}
function clone(v) {
  return JSON.parse(JSON.stringify(v));
}
function nowMs(v) {
  return Math.max(0, int(v, Date.now()));
}
/*
 * Mission NGU (2026-09-08) : ces deux fonctions écrêtaient auparavant tout
 * résultat à [1e-300, 1e300] via un plafond arbitraire sur le logarithme
 * (±690). Deux chaînes de multiplicateurs produisant "en vrai" 1e400 et
 * 1e900 devenaient alors STRICTEMENT IDENTIQUES (toutes deux 1e300) — pas
 * juste plafonnées, mais rendues indiscernables l'une de l'autre. NGU Idle
 * en Sadistique/fin de partie dépasse couramment 1e300 ; NUMBER (et tout ce
 * qui le multiplie, ex. attackMultiplier plus bas) ne pouvait donc pas être
 * correct passé le tout début de partie.
 *
 * Correctif minimal et rétrocompatible : la représentation interne passe
 * par idle-big-number-v1.js (mantisse/exposant, sans plafond arbitraire),
 * mais la signature et le type de retour restent un Number JS classique —
 * aucun appelant existant n'a besoin de changer. La vraie limite désormais
 * est celle d'un double IEEE 754 (~1.7977e308) : au-delà, le résultat
 * devient honnêtement Infinity (qui reste correctement ORDONNÉ par rapport
 * à toute valeur finie plus petite), au lieu d'un plafond arbitraire qui
 * mentait sur la magnitude réelle.
 *
 * Propager la représentation grand nombre plus loin en aval (jusqu'à
 * attackMultiplier/defenseMultiplier et aux stats de combat qui en
 * découlent) reste un chantier séparé, nécessaire avant que le contenu
 * Évil/Sadistique/fin de partie puisse être validé numériquement — ne pas
 * supposer que ce correctif seul couvre toute la chaîne aval.
 *
 * Note de précision : Math.exp(Math.log(b)*e) reste la voie DIRECTE tant
 * que le résultat est représentable sans dépassement — elle est gardée
 * inchangée pour ne pas introduire de dérive flottante sur les valeurs
 * early-game déjà verrouillées par des tests existants (ex. safePow(2,10)
 * doit rester exactement 1024, pas 1023.9999999999993). Le détour par
 * idle-big-number-v1.js n'intervient QUE quand le résultat direct
 * dépasserait ce que Math.exp peut représenter — c'est précisément la zone
 * où l'ancien code se trompait.
 */
const SAFE_EXP_LOG_LIMIT = 700; // Math.exp(~709.78) est la vraie limite double ; marge de sécurité.
export function safePow(base, exp) {
  const b = Math.max(1e-300, num(base, 1));
  const e = num(exp, 0);
  const log = Math.log(b) * e;
  if (Math.abs(log) <= SAFE_EXP_LOG_LIMIT) return Math.exp(log);
  return bigToNumberV1(bigFromLog10V1(log / Math.LN10, 1));
}
export function safeProduct(values) {
  let log = 0;
  for (const value of values) {
    const v = Math.max(1e-300, num(value, 1));
    log += Math.log(v);
  }
  if (Math.abs(log) <= SAFE_EXP_LOG_LIMIT) return Math.exp(log);
  return bigToNumberV1(bigFromLog10V1(log / Math.LN10, 1));
}

export const IDLE_NGU_EARLY_GAME_TIMELINE = Object.freeze([
  { boss: 4, id: "adventure", name: "Adventure + Inventory" },
  { boss: 17, id: "augmentations", name: "Augmentations" },
  { boss: 30, id: "timeMachine", name: "Time Machine" },
  { boss: 37, id: "magic", name: "Magic + Blood Magic" },
  { boss: 58, id: "challenges", name: "Challenges" },
  { boss: 58, id: "titans", name: "Premier Titan" }
]);

/*
 * Norman (2026-09-16) : "je vois que le rebirth n'est supposé se
 * déverrouiller qu'à ce moment là [tutoriel Aventure] alors que dans
 * SOREAL IDLE on l'a direct." Confirmé par le tutoriel réel NGU (page
 * Adventure_Mode/Tutorial Zone, "You've also unlocked REBIRTHS, which
 * needs some explanation" — affiché juste après le déblocage d'Aventure,
 * boss 4). Seuil unique, réutilisé par calculateIdleNguNextNumber
 * (canRebirth) et rebirthIdleNguState (garde serveur) — jamais un second
 * "4" écrit en dur ailleurs.
 */
export const REBIRTH_UNLOCK_BOSS_V1 =
  IDLE_NGU_EARLY_GAME_TIMELINE.find(x=>x.id==="adventure")?.boss ?? 4;

/*
 * Audit 2026-09-16 — 5 des 11 défis Normal étaient marqués `implemented:
 * false` (jamais lançables, "DEFI_EN_PREPARATION"). Le moteur générique
 * (unlock/start/win-condition boss/récompense EXP+AP/historique bestMs)
 * fonctionnait déjà pour tous — seule une vraie contrainte de jeu manquait
 * pour chacun (sourcée sur augments-and-challenges.md) :
 * - twentyFourHours/hundredLevels/troll ("offline progress disabled") :
 *   IDLE_CHALLENGE_OFFLINE_DISABLED_IDS plafonne le rattrapage par appel à
 *   60s pendant que l'un des trois est actif (voir advanceIdleNguState).
 * - hundredLevels : pool combiné de 100 niveaux (Augments+Blood Magic+Time
 *   Machine+Wandoos+Beards) par Rebirth, appliqué à la source dans chacune
 *   des 5 fonctions concernées AVANT toute dépense de ressource (jamais
 *   après coup, pour ne jamais perdre d'Or sans le niveau correspondant).
 * - laserSword : condition de victoire réelle (paliers 2/2, +1/+1 par
 *   completion sur l'Augment Laser Sword + son upgrade), ET correction du
 *   rebirth (seul défi qui n'est PAS censé réinitialiser NUMBER/banks —
 *   c'était câblé comme les 10 autres avant ce correctif) ; sa condition de
 *   déblocage lisait un champ (`state.adventure.itemList.laserSword`) qui
 *   n'existe nulle part ailleurs dans le dépôt (donc toujours fausse) —
 *   corrigée pour lire le véritable niveau de l'Augment.
 * - blind : sa restriction ("la plupart des nombres à l'écran sont
 *   masqués") est purement un rendu CLIENT, sans équivalent numérique côté
 *   moteur — rien à appliquer ici ; unlock/win/récompense génériques
 *   suffisent pour ce défi précis.
 * Les bonus permanents PAR COMPLETION propres à ces 5 défis (ex. Troll
 * débloquant un slot d'accessoire à la 2e completion, un slot de Beard à
 * la 4e...) ne sont volontairement PAS câblés : chacun dépend d'un système
 * qui n'existe pas encore dans SOREAL IDLE (paliers de fruits Yggdrasil,
 * rituels de Sang additionnels...) — l'EXP/AP plat (déjà généralisé pour
 * tous les défis existants) est bien accordé, mais inventer les bonus
 * annexes casserait la règle "jamais de donnée inventée".
 */
export const IDLE_NGU_NORMAL_CHALLENGES = Object.freeze([
  Object.freeze({id:"basic",name:"Basic Challenge",max:5,targetBoss:58,targetStep:0,implemented:true,reward:{experience:1500,ap:2500},unlock:{bosses:58},restriction:"resetNumber"}),
  Object.freeze({id:"noAugmentations",name:"No Augs Challenge",max:5,targetBoss:59,targetStep:0,implemented:true,reward:{experience:5000,ap:10000},unlock:{bosses:75},restriction:"noAugmentations"}),
  Object.freeze({id:"twentyFourHours",name:"24 Hour Challenge",max:10,targetBoss:58,targetStep:26,implemented:true,reward:{experience:400,ap:5000},unlock:{basicUnder24h:true},restriction:"offlineDisabled"}),
  Object.freeze({id:"hundredLevels",name:"100 Levels Challenge",max:5,targetBoss:58,targetStep:0,implemented:true,reward:{experience:500,ap:1500},unlock:{nguLevels:10},restriction:"hundredLevels"}),
  Object.freeze({id:"noEquipment",name:"No Equipment Challenge",max:5,targetBoss:66,targetStep:0,implemented:true,reward:{experience:4000,ap:3000},unlock:{grbSet:true},restriction:"noEquipment"}),
  Object.freeze({id:"troll",name:"Troll Challenge",max:7,targetBoss:69,targetStep:15,implemented:true,reward:{experience:5000,ap:10000},unlock:{titan:"t2"},restriction:"troll"}),
  Object.freeze({id:"noRebirth",name:"No Rebirth Challenge",max:10,targetBoss:40,targetStep:5,implemented:true,reward:{experience:10000,ap:25000},unlock:{titan:"t3"},restriction:"noRebirth"}),
  Object.freeze({id:"laserSword",name:"Laser Sword Challenge",max:20,targetBoss:0,targetStep:0,implemented:true,reward:{experience:3000,ap:3000},unlock:{laserSword:true},restriction:"laserSword"}),
  Object.freeze({id:"blind",name:"Blind Challenge",max:10,targetBoss:58,targetStep:10,implemented:true,reward:{experience:2500,ap:3000},unlock:{titan:"t4"},restriction:"blind"}),
  Object.freeze({id:"noNgu",name:"No NGU Challenge",max:10,targetBoss:58,targetStep:10,implemented:true,reward:{experience:3000,ap:3000},unlock:{nguLevels:10000},restriction:"noNgu"}),
  Object.freeze({id:"noTimeMachine",name:"No Time Machine Challenge",max:10,targetBoss:58,targetStep:15,implemented:true,reward:{experience:2000,ap:2000},unlock:{diggers:true},restriction:"noTimeMachine"})
]);

function challengePermanentBonuses(state){
  const c=state?.challenge?.completions||{};
  const basic=Math.max(0,int(c.basic,0));
  const noAugs=Math.max(0,int(c.noAugmentations,0));
  const noEquipment=Math.max(0,int(c.noEquipment,0));
  const noRebirth=Math.max(0,int(c.noRebirth,0));
  const noNgu=Math.max(0,int(c.noNgu,0));
  const noTimeMachine=Math.max(0,int(c.noTimeMachine,0));
  return {
    adventureStatsMultiplier:1+basic*0.05+(basic>0?0.10:0),
    boostRecycleChance:clamp(basic*0.10,0,1),
    augmentationPowerMultiplier:1+noAugs*0.25,
    augmentationSpeedMultiplier:noAugs>0?1.10:1,
    augmentationCostMultiplier:noAugs>=5?0.5:1,
    inventorySlots:noEquipment*8+(noEquipment>=5?10:0),
    autoBoost:noEquipment>0,
    autoMergeTimeMultiplier:Math.max(0.5,1-noEquipment*0.10),
    titanRespawnReductionMs:noRebirth*15*60*1000,
    titanLootLevelBonus:noRebirth>0?1:0,
    nguSpeedMultiplier:1+noNgu*0.05,
    timeMachineGoldMultiplier:1+noTimeMachine,
    diggerGlobalMultiplier:noTimeMachine>0?1.05:1,
    diggerSlotBonus:noTimeMachine>=5?1:0
  };
}

export function idleNguChallengeBonuses(raw){
  const state=raw&&raw.version===IDLE_NGU_META_VERSION?raw:normalizeIdleNguState(raw);
  return challengePermanentBonuses(state);
}

/*
 * Normal-difficulty NGU augmentation table.
 * Times are the level-1 base times with 1000 Energy and 1 Energy Power.
 */
export const IDLE_NGU_AUGMENTATIONS = Object.freeze([
  {
    id: "scissors",
    name: "Safety Scissors",
    unlockBoss: 17,
    baseMultiplier: 1,
    exponent: 1,
    baseGold: 1e4,
    baseSeconds: 400,
    upgrade: {
      id: "dangerScissors",
      name: "Danger Scissors",
      unlockBoss: 37,
      baseGold: 1e7,
      baseSeconds: 400
    }
  },
  {
    id: "milk",
    name: "Milk Infusion",
    unlockBoss: 18,
    baseMultiplier: 25,
    exponent: 1.1,
    baseGold: 2e5,
    baseSeconds: 6800,
    upgrade: {
      id: "drinkMilk",
      name: "Drinking The Milk Too",
      unlockBoss: 40,
      baseGold: 5e8,
      baseSeconds: 4800
    }
  },
  {
    id: "cannon",
    name: "Cannon Implant",
    unlockBoss: 20,
    baseMultiplier: 625,
    exponent: 1.2,
    baseGold: 4e6,
    baseSeconds: 115600,
    upgrade: {
      id: "missileLauncher",
      name: "Missile Launcher",
      unlockBoss: 44,
      baseGold: 2.5e10,
      baseSeconds: 57600
    }
  },
  {
    id: "minigun",
    name: "Shoulder Mounted Minigun",
    unlockBoss: 24,
    baseMultiplier: 15625,
    exponent: 1.3,
    baseGold: 8e7,
    baseSeconds: 1965200,
    upgrade: {
      id: "actualAmmo",
      name: "Actual Ammunition",
      unlockBoss: 46,
      baseGold: 1.25e12,
      baseSeconds: 691200
    }
  },
  {
    id: "buster",
    name: "Energy Buster",
    unlockBoss: 28,
    baseMultiplier: 390625,
    exponent: 1.4,
    baseGold: 1.6e9,
    baseSeconds: 33408400,
    upgrade: {
      id: "chargeShot",
      name: "Charge Shot",
      unlockBoss: 48,
      baseGold: 6.25e13,
      baseSeconds: 8294400
    }
  },
  {
    id: "exoskeleton",
    name: "Advanced Exoskeleton",
    unlockBoss: 56,
    baseMultiplier: 976563000,
    exponent: 1.5,
    baseGold: 1.8e16,
    baseSeconds: 46771760000,
    upgrade: {
      id: "energyShield",
      name: "Energy Shield",
      unlockBoss: 56,
      baseGold: 3.125e18,
      baseSeconds: 6635520000
    }
  },
  {
    id: "laserSword",
    name: "Laser Sword",
    unlockBoss: 68,
    baseMultiplier: 2.441e12,
    exponent: 1.6,
    baseGold: 2.3e19,
    baseSeconds: 65480464000000,
    upgrade: {
      id: "quadLaser",
      name: "Quadruple Sided Laser Sword",
      unlockBoss: 68,
      baseGold: 1.5625e20,
      baseSeconds: 5308416000000
    }
  }
]);

export const IDLE_NGU_BLOOD_RITUALS = Object.freeze([
  { id: "tack", name: "Poke Yourself with a Tack", blood: 1, gold: 3e7, baseSeconds: 2000 },
  { id: "papercuts", name: "Fifty Papercuts", blood: 50, gold: 1e10, baseSeconds: 20000 },
  { id: "hickey", name: "A Big-Ass Hickey", blood: 2000, gold: 2e12, baseSeconds: 200000 },
  { id: "barbedWire", name: "Eat a bowl of Barbed Wire", blood: 60000, gold: 4e14, baseSeconds: 2000000 },
  { id: "bloodBank", name: "Grand Theft Blood Bank", blood: 1.2e6, gold: 8e16, baseSeconds: 20000000 },
  { id: "decapitation", name: "Self Decapitation", blood: 1.8e7, gold: 1.6e19, baseSeconds: 200000000 },
  { id: "woodchipper", name: "Hug a Woodchipper", blood: 2.5e8, gold: 3.2e21, baseSeconds: 2000000000 },
  {
    id: "insideOut",
    name: "Turn Yourself Inside Out",
    blood: 3.2e9,
    gold: 6.4e23,
    baseSeconds: 20000000000,
    unlockFlag: "trollChallenge6"
  }
]);

export const IDLE_NGU_YGG_FRUITS = Object.freeze([
  {id:"gold",name:"Fruit of Gold",resource:"energy",activationCost:100000,baseSeeds:1,tierCost:1,effect:"gold"},
  {id:"powerAlpha",name:"Fruit of Power α",resource:"energy",activationCost:200000,baseSeeds:1,tierCost:10,effect:"powerAlpha"},
  {id:"adventure",name:"Fruit of Adventure",resource:"energy",activationCost:200000,baseSeeds:1,tierCost:25,effect:"adventure"},
  {id:"knowledge",name:"Fruit of Knowledge",resource:"energy",activationCost:1000000,baseSeeds:1,tierCost:40,effect:"experience"},
  {id:"pomegranate",name:"Pomegranate",resource:"magic",activationCost:300000,baseSeeds:5,tierCost:60,effect:"seeds"},
  {id:"luck",name:"Fruit of Luck",resource:"energy",activationCost:5000000,baseSeeds:1,tierCost:100,effect:"luck"},
  {id:"powerBeta",name:"Fruit of Power β",resource:"magic",activationCost:3000000,baseSeeds:1,tierCost:150,effect:"powerBeta"},
  {id:"arbitrariness",name:"Fruit of Arbitrariness",resource:"energy",activationCost:20000000,baseSeeds:3,tierCost:170,effect:"ap"},
  {id:"numbers",name:"Fruit of Numbers",resource:"magic",activationCost:10000000,baseSeeds:3,tierCost:200,effect:"numbers"},
  {id:"rage",name:"Fruit of Rage",resource:"energy",activationCost:500000000,baseSeeds:5,tierCost:2000,effect:"pp"}
]);

export const IDLE_NGU_DIGGERS = Object.freeze([
  {id:"drop",name:"Drop Chance Digger",unlockCost:1e16,drain:1e12,growth:1.5,cap:1657,effect:"drop"},
  {id:"wandoos",name:"Wandoos Digger",unlockCost:1e16,drain:1e12,growth:1.5,cap:1657,effect:"wandoos"},
  {id:"stats",name:"Stat Digger",unlockCost:1e16,drain:1e12,growth:1.5,cap:1657,effect:"stats"},
  {id:"adventure",name:"Adventure Digger",unlockCost:1e16,drain:1e12,growth:1.5,cap:1657,effect:"adventure"},
  {id:"energyNgu",name:"Energy NGU Digger",unlockCost:1e19,drain:1e15,growth:1.75,cap:1188,effect:"energyNgu"},
  {id:"magicNgu",name:"Magic NGU Digger",unlockCost:1e19,drain:1e15,growth:1.75,cap:1188,effect:"magicNgu"},
  {id:"energyBeard",name:"Energy Beard Digger",unlockCost:1e22,drain:1e18,growth:1.75,cap:1176,effect:"energyBeard"},
  {id:"magicBeard",name:"Magic Beard Digger",unlockCost:1e22,drain:1e18,growth:1.75,cap:1176,effect:"magicBeard"},
  {id:"pp",name:"PP Digger",unlockCost:1e25,drain:1e21,growth:1.75,cap:1164,effect:"pp"},
  {id:"daycare",name:"Daycare Digger",unlockCost:1e25,drain:1e21,growth:1.75,cap:1164,effect:"daycare"},
  {id:"blood",name:"Blood Digger",unlockCost:1e28,drain:1e24,growth:1.75,cap:1151,effect:"blood"},
  {id:"experience",name:"EXP Digger",unlockCost:1e28,drain:1e24,growth:1.75,cap:1151,effect:"experience"}
]);


/*
 * Norman (2026-09-18) : "il faut tout faire" (fidélité Evil/Sadistic).
 * L'ancien "wandoos: [energy, magic]" ci-dessous a été retiré : c'était un
 * système à piste UNIQUE active (comme "beards"), structurellement
 * incompatible avec le vrai mécanisme NGU où Energy ET Magic Dump
 * progressent SIMULTANÉMENT et se multiplient ensemble dans la formule de
 * stat (wiki, page "Wandoos", section "Using Wandoos" : "Energy and Magic
 * Dump level bonuses are calculated separately before being multiplied
 * together"). Remplacé par IDLE_WANDOOS_OS_V1 + advanceWandoos() plus bas,
 * un système dédié comme Augmentations/Blood Magic/Time Machine.
 */
export const IDLE_NGU_TRACKS = Object.freeze({
  advancedTraining: [
    { id: "power", name: "Adventure Power", effect: "Adventure Attack" },
    { id: "toughness", name: "Adventure Toughness", effect: "Adventure Defense" },
    { id: "block", name: "Block Damage", effect: "Adventure Block" },
    { id: "wandoosEnergy", name: "Wandoos Energy Dump", effect: "Wandoos Energy" },
    { id: "wandoosMagic", name: "Wandoos Magic Dump", effect: "Wandoos Magic" }
  ],
  /*
   * 2026-09-23 (audit NGU) : les 9 pistes NGU inventées (Power/Defense/
   * Adventure/Drop/Respawn/EXP/PP/Quest/Daycare) sont remplacées par les 16
   * vrais NGU, voir idle-ngu-catalog-v1.js. La liste ci-dessous ne sert
   * qu'à exposer leur catalogue sous la même clé.
   */
  ngu: IDLE_NGU_CATALOG_V1.map(n => ({ id: n.id, name: n.name, effect: n.effect, resource: n.resource })),
  beards: [
    { id: "attack", name: "Fu Manchu", effect: "Attack/Defense", resource: "magic", speedDivider: 1e7, beardRole: "attackDefense" },
    { id: "drop", name: "Neckbeard", effect: "Drop Chance", resource: "energy", speedDivider: 3e7, beardRole: "drop" },
    { id: "defense", name: "Reverse Beard", effect: "NUMBER", resource: "magic", speedDivider: 3e7, beardRole: "number" },
    { id: "ngu", name: "Beard Cage", effect: "NGU Speed", resource: "energy", speedDivider: 1e8, beardRole: "ngu" },
    { id: "pp", name: "LadyBeard", effect: "Wandoos Speed", resource: "magic", speedDivider: 1e8, beardRole: "wandoos" },
    { id: "adventure", name: "BEARd", effect: "Adventure Stats", resource: "energy", speedDivider: 3e8, beardRole: "adventure" },
    { id: "gold", name: "Golden Beard", effect: "Gold Production", resource: "magic", speedDivider: 3e8, beardRole: "gold", unlockTroll: 7 }
  ],
  /*
   * Correctif 2026-09-14 (audit fidélité wiki NGU, mission IDLE — Hacks) :
   * la liste précédente (Combat/Adventure/PP/EXP/NGU/Time Machine/Wishes/
   * QP/Daycare/Cards/Blood Magic/Yggdrasil/Gold/Respawn/Titan Rewards)
   * n'était PAS le vrai catalogue des 15 Hacks du wiki NGU (page "Hacks",
   * table "The Hacks") — près de la moitié de ces entrées (Cards, Yggdrasil,
   * Gold, Respawn, Titan Rewards) n'existent pas comme Hacks dans le jeu
   * réel, et plusieurs vrais Hacks manquaient entièrement (Drop Chance,
   * Augment Speed, Energy/Magic NGU Speed séparés, QP Gain, Number, le
   * "Hack Hack" qui boost la vitesse des Hacks elle-même). Remplacé par les
   * 15 vraies entrées, avec leur Effect/Level, Milestone Bonus, Levels par
   * milestone (Normal, i.e. avant réduction Perks/Quirks/Wishes) et Base
   * Speed Divider réels — mêmes colonnes que la table du wiki.
   */
  hacks: [
    { id: "attackDefense", name: "Attack/Defense Hack", effect: "Attack/Defense", effectPerLevelPct: 2.5, milestoneBonusPct: 102.5, levelsPerMilestone: 10, speedDivider: 1e8 },
    { id: "adventureStats", name: "Adventure Hack", effect: "Adventure Stats", effectPerLevelPct: 0.1, milestoneBonusPct: 102, levelsPerMilestone: 50, speedDivider: 2e8 },
    { id: "timeMachineSpeed", name: "Time Machine Hack", effect: "Time Machine Speed", effectPerLevelPct: 0.2, milestoneBonusPct: 102, levelsPerMilestone: 50, speedDivider: 4e8 },
    { id: "dropChance", name: "Drop Chance Hack", effect: "Drop Chance", effectPerLevelPct: 0.25, milestoneBonusPct: 103, levelsPerMilestone: 40, speedDivider: 4e8 },
    { id: "augmentSpeed", name: "Augment Speed Hack", effect: "Augment Speed", effectPerLevelPct: 0.2, milestoneBonusPct: 101, levelsPerMilestone: 20, speedDivider: 8e8 },
    { id: "energyNguSpeed", name: "Energy NGU Speed Hack", effect: "Energy NGU Speed", effectPerLevelPct: 0.1, milestoneBonusPct: 101.5, levelsPerMilestone: 30, speedDivider: 2e9 },
    { id: "magicNguSpeed", name: "Magic NGU Speed Hack", effect: "Magic NGU Speed", effectPerLevelPct: 0.1, milestoneBonusPct: 101.5, levelsPerMilestone: 30, speedDivider: 2e9 },
    { id: "bloodGain", name: "Blood Hack", effect: "Blood Gain", effectPerLevelPct: 0.1, milestoneBonusPct: 104, levelsPerMilestone: 50, speedDivider: 4e9 },
    { id: "qpGain", name: "QP Hack", effect: "QP Gain", effectPerLevelPct: 0.05, milestoneBonusPct: 100.8, levelsPerMilestone: 50, speedDivider: 8e9 },
    { id: "daycare", name: "Daycare Hack", effect: "Daycare", effectPerLevelPct: 0.02, milestoneBonusPct: 100.5, levelsPerMilestone: 45, speedDivider: 2e10 },
    { id: "exp", name: "EXP Hack", effect: "EXP", effectPerLevelPct: 0.025, milestoneBonusPct: 101, levelsPerMilestone: 75, speedDivider: 4e10 },
    { id: "number", name: "Number Hack", effect: "NUMBER", effectPerLevelPct: 5, milestoneBonusPct: 104, levelsPerMilestone: 40, speedDivider: 8e10 },
    { id: "pp", name: "PP Hack", effect: "PP", effectPerLevelPct: 0.05, milestoneBonusPct: 100.5, levelsPerMilestone: 25, speedDivider: 2e11 },
    { id: "hackHack", name: "Hack Hack", effect: "Hack Speed", effectPerLevelPct: 0.05, milestoneBonusPct: 110, levelsPerMilestone: 100, speedDivider: 2e11 },
    { id: "wish", name: "Wish Hack", effect: "Wishes", effectPerLevelPct: 0.01, milestoneBonusPct: 100.5, levelsPerMilestone: 50, speedDivider: 1e13 }
  ],
  /*
   * Correctif 2026-09-14 (audit fidélité wiki NGU, mission IDLE — Wishes) :
   * la liste précédente (adventure/drop/respawn/bank/hacks/ngu/cards/
   * titans/daycare/quest) était 10 pistes génériques inventées, sans aucun
   * rapport avec le vrai catalogue du wiki NGU (page "Wishes", Page 1 à
   * Page 11 de cet article) — 231 vrais souhaits nommés individuellement
   * (id 0-230, voir idle-wishes-v1.js), chacun avec son propre nombre de
   * niveaux et son propre Speed Divider. Remplacé par le vrai catalogue ;
   * la vraie formule de progression (multiplicative, exposant 0.17, plancher
   * 4h) est implémentée par advanceWishTrack() plus bas dans ce fichier.
   *
   * `id` est converti en chaîne ici (contrairement à IDLE_WISHES_CATALOG_V1,
   * qui garde l'index wiki numérique pour wishBonusesV1/idleWishByIdV1) car
   * selectTrack()/advanceTrackSystem comparent activeTrack via
   * String(payload.track) === track.id — toutes les autres pistes
   * (beards/hacks/ngu/...) utilisent déjà des id chaîne pour cette raison ;
   * un id numérique y casserait silencieusement la sélection de piste dès
   * qu'un souhait autre que l'id 0 serait choisi.
   */
  wishes: IDLE_WISHES_CATALOG_V1.map(w => ({ ...w, id: String(w.id) }))
});

export const IDLE_NGU_SYSTEMS = Object.freeze([
  { id: "achievements", name: "Achievements", icon: "🏆", kind: "permanent", resources: [], unlock: {} },
  { id: "dailySpin", name: "Daily Spin", icon: "🎡", kind: "daily", resources: [], unlock: { system: "moneyPit" } },
  { id: "augmentations", name: "Augmentations", icon: "🦾", kind: "run", resources: ["energy"], unlock: {bosses:IDLE_NGU_RESOURCE_POWER_CAP_UNLOCK_BOSS_V1} },
  { id: "advancedTraining", name: "Advanced Training", icon: "🏋️", kind: "run", resources: ["energy"], unlock: { basicTrainingComplete: true } },
  { id: "timeMachine", name: "Time Machine", icon: "⏱️", kind: "run", resources: ["energy", "magic"], unlock: {bosses:30} },
  { id: "bloodMagic", name: "Blood Magic", icon: "🩸", kind: "run", resources: ["magic"], unlock: {bosses:37} },
  { id: "wandoos", name: "Wandoos", icon: "💻", kind: "run", resources: ["energy", "magic"], unlock: {item:"wandoos98"} },
  { id: "ngu", name: "NGU", icon: "♾️", kind: "permanent", resources: ["energy", "magic"], unlock: {item:"aNumber"} },
  { id: "yggdrasil", name: "Yggdrasil", icon: "🌱", kind: "growth", resources: ["energy"], unlock: {item:"giantSeed"} },
  { id: "moneyPit", name: "Money Pit", icon: "🕳️", kind: "utility", resources: [], unlock: { gold: 100000 } },
  { id: "diggers", name: "Gold Diggers", icon: "⛏️", kind: "permanent", resources: [], unlock: {item:"scrapPaper"} },
  { id: "beards", name: "Beards", icon: "🧔", kind: "hybrid", resources: ["energy", "magic"], unlock: {item:"uugHair"} },
  { id: "tower", name: "ITOPOD", icon: "🏢", kind: "infinite", resources: [], unlock: {item:"pissedOffKey"} },
  { id: "perks", name: "Perks", icon: "⭐", kind: "permanent", resources: [], unlock: { system: "tower" } },
  { id: "challenges", name: "Challenges", icon: "🏁", kind: "challenge", resources: [], unlock: {bosses:58} },
  { id: "titans", name: "Titans", icon: "👹", kind: "cooldown", resources: [], unlock: {bosses:58} },
  { id: "macguffins", name: "MacGuffins", icon: "🧩", kind: "permanent", resources: ["energy"], unlock: { flag: "walderpFinalDefeated" } },
  { id: "daycare", name: "Item Daycare", icon: "🛠️", kind: "growth", resources: [], unlock: { flag: "daycareSlotPurchased" } },
  { id: "infinityCube", name: "Infinity Cube", icon: "🧊", kind: "permanent", resources: [], unlock: { flag: "tutorialCubeMaxed" } },
  { id: "questing", name: "Questing", icon: "📋", kind: "quest", resources: [], unlock: {item:"heroicSigil"} },
  { id: "quirks", name: "Quirks", icon: "📚", kind: "permanent", resources: [], unlock: { system: "questing" } },
  { id: "hacks", name: "Hacks", icon: "🧪", kind: "permanent", resources: ["r3"], unlock: {item:"incriminatingEvidence"} },
  { id: "wishes", name: "Wishes", icon: "🌠", kind: "permanent", resources: ["energy", "magic", "r3"], unlock: {item:"severedUnicornHead"} },
  { id: "cards", name: "Cards", icon: "🃏", kind: "cards", resources: [], unlock: {item:"stillBeatingHeart"} },
  { id: "cooking", name: "Cooking", icon: "🍲", kind: "daily", resources: [], unlock: { flag: "itHungersDefeated" } }
]);

function defaultResource(resource = "energy") {
  const key=String(resource||"energy");
  /*
   * Norman (2026-09-18, capture d'écran "Magic Stats Breakdown" du vrai
   * NGU en direct, personnage tout neuf) : "Base Magic Cap: 0 ...
   * Total Magic Cap: 1" -- un plancher de 1, pas 100. r3 (Hacks/Wishes,
   * débloqué très tard, item "incriminatingEvidence") n'a aucune preuve
   * contraire fournie -- laissé à 100 pour ne rien casser sans preuve.
   */
  const cap = key === "energy" ? 500 : key === "magic" ? 1 : 100;
  return {
    speed: 1,
    power: 1,
    cap,
    bars: 1,
    /*
     * Norman (2026-09-15) : "dans NGU IDLE, quand on commence une
     * nouvelle partie, le compte d'énergie est à 250 et on doit générer
     * les 250 restants pour atteindre 500." Cette fonction n'alimente que
     * baseState() (la toute première création d'une partie) — jamais la
     * Renaissance, qui remet chaque ressource à 0 via sa propre logique
     * (applyRebirthResetV56_, inchangée). Un nouveau joueur démarrait
     * jusqu'ici à l'énergie PLEINE (cap), jamais à la moitié comme dans
     * le vrai NGU.
     */
    current: key === "energy" ? cap / 2 : 0,
    fillProgress: 0,
    generatedThisRun: 0,
    spentExp: 0
  };
}

function baseSystemState(def) {
  return {
    id: def.id,
    unlocked: false,
    active: false,
    level: 0,
    tempLevel: 0,
    permanentLevel: 0,
    progress: 0,
    allocation: { energy: 0, magic: 0, r3: 0 },
    data: {}
  };
}

function createTrackState(def) {
  if (def.id === "ngu") return createNguDataV1();
  const tracks = IDLE_NGU_TRACKS[def.id] || [];
  if (!tracks.length) return {};
  const out = {};
  for (const track of tracks) {
    out[track.id] = { level: 0, tempLevel: 0, permanentLevel: 0, progress: 0 };
  }
  return {
    tracks: out,
    activeTrack: tracks[0].id
  };
}

function createAugmentationData() {
  const pairs = {};
  for (const def of IDLE_NGU_AUGMENTATIONS) {
    pairs[def.id] = {
      level: 0,
      progress: 0,
      upgradeLevel: 0,
      upgradeProgress: 0,
      energy: 0,
      upgradeEnergy: 0
    };
  }
  return { pairs, activePair: "scissors", trainUpgrade: false };
}

function createTimeMachineData() {
  return {
    speedLevel: 0,
    speedProgress: 0,
    goldLevel: 0,
    goldProgress: 0,
    bestGoldThisRun: 0,
    highestBossEver: 0,
    producedThisRun: 0
  };
}

function createBloodMagicData() {
  const rituals = {};
  for (const ritual of IDLE_NGU_BLOOD_RITUALS) {
    rituals[ritual.id] = { level: 0, progress: 0, completions: 0 };
  }
  return {
    rituals,
    activeRitual: "tack",
    spells: {
      numberBoost: 1,
      ironPill: 0,
      counterfeitGold: 1,
      counterfeitGoldBloodSpent: 0,
      bloodSpaghetti: 1,
      bloodSpaghettiBloodSpent: 0
    }
  };
}


function createYggdrasilData() {
  return {
    fruits:Object.fromEntries(IDLE_NGU_YGG_FRUITS.map(f=>[
      f.id,
      {tier:0,active:false,growthHours:0,firstHarvestThisRun:true}
    ])),
    reserved:{energy:0,magic:0},
    runPowerAlphaValue:0,
    runPowerBetaActive:false,
    runNumbersActive:false,
    permanent:{
      adventurePower:0,
      adventureToughness:0,
      adventureHp:0,
      adventureRegen:0,
      luckDropPct:0,
      powerBetaValue:0,
      numbersValue:0
    }
  };
}

function createDiggersData() {
  return {
    slots:1,
    diggers:Object.fromEntries(IDLE_NGU_DIGGERS.map(d=>[
      d.id,
      {maxLevel:0,runLevel:0,active:false}
    ]))
  };
}

/*
 * Wandoos (2026-09-18, Norman : "il faut tout faire"). Sources : wiki NGU
 * en direct, page "Wandoos" (ngu-idle.fandom.com/wiki/Wandoos), complétée
 * par les pages "Advanced Training" et "Energy" pour la vitesse de dump.
 *
 * 3 OS réels, chacun avec sa PROPRE formule de bonus Attack/Defense
 * (section "Operating Systems") et son propre seuil Energy/Magic "pour
 * un speed-cap de 50 niveaux/seconde" par difficulté (Normal/Evil/
 * SADISTIC, valeurs littérales de la page, jamais une formule unique
 * extrapolée entre elles).
 *
 * Le "speed-cap de 50 niveaux/seconde" N'EST PAS une mécanique propre à
 * Wandoos : page "Energy", note de bas de page sur "Speed" : "Almost
 * everything in NGU operates on ticks... there are 50 ticks/updates per
 * second... the most a progress bar can gain is... 50 fills (or levels)
 * per second" — c'est le taux de tick du moteur NGU lui-même. Et la même
 * page confirme "Energy Power does not affect the speed on the Energy
 * dump, so high Energy Cap is essential" — seule la quantité ALLOUÉE
 * compte (contrairement à Augmentations/Blood Magic/Time Machine, où
 * Power intervient) : la vitesse est donc directement proportionnelle à
 * l'allocation jusqu'au seuil (aucune autre courbe n'est documentée) :
 * levels/sec = min(50, 50 * alloué / seuil).
 */
export const IDLE_WANDOOS_OS_V1 = Object.freeze({
  "98": {
    name: "Wandoos 98",
    requirement: { normal: 1e9, difficile: 1e21, extreme: 1e33 },
    statBonus: (e, m) => Math.pow((1 + e / 100) * (1 + m / 25), 0.8)
  },
  meh: {
    name: "Wandoos MEH",
    requirement: { normal: 1e12, difficile: 1e27, extreme: 1e39 },
    statBonus: (e, m) => (1 + e / 5) * (1 + m * 2)
  },
  xl: {
    name: "Wandoos XL",
    requirement: { normal: 1e15, difficile: 1e33, extreme: 1e45 },
    statBonus: (e, m) => Math.pow((1 + e * 6) * (1 + m * 40), 1.05)
  }
});

/*
 * Niveau d'OS total (0-400, wiki section "Leveling up the OS") : "+4%
 * level 0, +8% at level 1... maximum level 400, giving +1604% speed" —
 * vérifié : 1+(400+1)*0.04 = 17.04, soit +1604% (multiplicateur total
 * 17.04, "bonus" = 1604 points de %). Formule : 1+(niveau+1)*0.04.
 *
 * Les 4 sources qui alimentent ce niveau total (Wandoos 98/XL consommés,
 * Money Pit, ITOPOD) sont plafonnées à 100 chacune côté wiki. Seule la
 * source ITOPOD (perk 22 "Wandoos Lover", déjà réelle et achetable) est
 * câblée ici — Money Pit et la consommation d'objets "A busted copy of
 * Wandoos 98/XL" nécessitent des mécaniques (table de drops Money Pit,
 * objets consommables avec niveau) non construites chez SOREAL : leurs
 * champs existent dans data.osLevels (jamais supprimés, toujours à 0)
 * mais ne sont alimentés par aucune action pour l'instant — gap honnête,
 * pas un oubli.
 */
function createWandoosData() {
  return {
    os: "98",
    dumpEnergyLevel: 0,
    dumpMagicLevel: 0,
    dumpEnergyProgress: 0,
    dumpMagicProgress: 0,
    osLevels: { moneyPit: 0, consumed98: 0, consumedXl: 0 }
  };
}

function wandoosOsLevelSpeedMultiplierV1(totalOsLevel) {
  const level = Math.max(0, Math.min(400, num(totalOsLevel, 0)));
  return 1 + (level + 1) * 0.04;
}

/*
 * Boot-up (wiki, section "Boot-up") : "1-hour boot-up process... linear,
 * and ranges from 0-100% speed." Réduit par le set Wandoos XL (-10%,
 * gear non construit chez SOREAL — omis) et par les défis "100 Levels"
 * complétés EN EVIL (-10% chacun, jusqu'à 5, plancher 27 minutes avec les
 * deux réductions). SOREAL ne distingue pas la difficulté au moment où un
 * défi "100 Levels" a été complété (state.challenge.completions.hundredLevels
 * est un compteur global) : la réduction ci-dessous utilise ce compteur
 * tel quel, un léger sur-crédit possible si des complétions ont eu lieu
 * en Normal — documenté honnêtement, jamais un chiffre inventé, la
 * réduction du set XL (-10% supplémentaire, jusqu'au plancher réel de 27
 * min) reste hors périmètre.
 */
function wandoosBootFractionV1(state, now) {
  const hundredLevelsCount = Math.max(0, Math.min(5, int(state.challenge?.completions?.hundredLevels, 0)));
  const bootSeconds = 3600 * (1 - 0.10 * hundredLevelsCount);
  const elapsed = Math.max(0, (nowMs(now) - Math.max(0, num(state.runStartedAt, 0))) / 1000);
  return clamp(elapsed / Math.max(1, bootSeconds), 0, 1);
}

function advanceWandoos(state, seconds, context, now) {
  const s = state.systems.wandoos;
  if (!s?.unlocked || seconds <= 0) return;
  const osId = IDLE_WANDOOS_OS_V1[s.data.os] ? s.data.os : "98";
  const os = IDLE_WANDOOS_OS_V1[osId];
  const requirement = os.requirement[state.difficulty] || os.requirement.normal;

  const perkBonuses = perkBonusesV1(state.systems.perks?.data?.levels);
  const quirkBonuses = quirkBonusesV1(state.systems.quirks?.data?.levels);
  const totalOsLevel = Math.min(400,
    Math.max(0, perkBonuses.wandoosOsLevelBonus) +
    Math.max(0, num(s.data.osLevels?.moneyPit, 0)) +
    Math.max(0, num(s.data.osLevels?.consumed98, 0)) +
    Math.max(0, num(s.data.osLevels?.consumedXl, 0))
  );
  const osLevelMultiplier = wandoosOsLevelSpeedMultiplierV1(totalOsLevel);
  const bootFraction = wandoosBootFractionV1(state, now);
  const beardWandoos = beardBonusMultiplier(state, "wandoos");
  const diggerWandoos = diggerBonuses(state).wandoos;
  /*
   * "Wandoos Energy/Magic Dump+" (Advanced Training, wiki page "Advanced
   * Training") : "+1% per level" à la vitesse de dump — déjà des pistes
   * réelles chez SOREAL (IDLE_NGU_TRACKS.advancedTraining "wandoosEnergy"/
   * "wandoosMagic"), jamais lues par Wandoos jusqu'ici.
   */
  const atEnergyDumpMultiplier = 1 + totalTrackLevel(state.systems.advancedTraining, "wandoosEnergy") * 0.01;
  const atMagicDumpMultiplier = 1 + totalTrackLevel(state.systems.advancedTraining, "wandoosMagic") * 0.01;
  /*
   * "Energy/Magic Wandoos BEAST-a" (Quirks 15/16, wiki page "Wandoos") :
   * +2%/niveau chacun, Energy et Magic séparément.
   */
  const quirkEnergyMultiplier = 1 + Math.max(0, num(quirkBonuses.wandoosEnergySpeedPct, 0));
  const quirkMagicMultiplier = 1 + Math.max(0, num(quirkBonuses.wandoosMagicSpeedPct, 0));

  const energyAlloc = Math.max(0, num(s.allocation.energy, 0));
  const magicAlloc = Math.max(0, num(s.allocation.magic, 0));
  /* NGU "Wandoos" (Energy) : "Wandoos speed", audit NGU 2026-09-23. */
  const nguWandoosMultiplier = nguFxV1(state).wandoosSpeed;

  const energySpeed = Math.min(50, 50 * energyAlloc / requirement)
    * osLevelMultiplier * bootFraction * beardWandoos * diggerWandoos
    * atEnergyDumpMultiplier * quirkEnergyMultiplier * nguWandoosMultiplier;
  const magicSpeed = Math.min(50, 50 * magicAlloc / requirement)
    * osLevelMultiplier * bootFraction * beardWandoos * diggerWandoos
    * atMagicDumpMultiplier * quirkMagicMultiplier * nguWandoosMultiplier;

  s.data.dumpEnergyProgress = Math.max(0, num(s.data.dumpEnergyProgress, 0)) + energySpeed * seconds;
  s.data.dumpMagicProgress = Math.max(0, num(s.data.dumpMagicProgress, 0)) + magicSpeed * seconds;
  let energyGain = Math.floor(s.data.dumpEnergyProgress);
  let magicGain = Math.floor(s.data.dumpMagicProgress);
  /*
   * Défi "100 Levels" (wiki, page Challenges) : pool combiné de 100
   * niveaux partagé entre Augments/Blood Magic/Time Machine/Wandoos —
   * même plafond déjà appliqué aux 3 autres systèmes ci-dessus,
   * jusqu'ici jamais appliqué à Wandoos spécifiquement malgré son
   * inclusion documentée dans ce pool.
   */
  if (energyGain + magicGain > 0) {
    const remaining = challengeHundredLevelsRemaining(state);
    if (energyGain + magicGain > remaining) {
      const total = energyGain + magicGain;
      energyGain = Math.floor(energyGain * remaining / total);
      magicGain = Math.floor(magicGain * remaining / total);
    }
    if (energyGain > 0) {
      s.data.dumpEnergyProgress -= energyGain;
      s.data.dumpEnergyLevel = Math.max(0, num(s.data.dumpEnergyLevel, 0)) + energyGain;
    }
    if (magicGain > 0) {
      s.data.dumpMagicProgress -= magicGain;
      s.data.dumpMagicLevel = Math.max(0, num(s.data.dumpMagicLevel, 0)) + magicGain;
    }
    if (energyGain + magicGain > 0) challengeHundredLevelsConsume(state, energyGain + magicGain);
  }

  s.level = s.data.dumpEnergyLevel + s.data.dumpMagicLevel;
  s.tempLevel = s.level;
}

/*
 * Multiplicateur Attack/Defense de l'OS Wandoos actif, à partir des
 * niveaux de Dump Energy/Magic courants (wiki, section "Operating
 * Systems", formule par OS). Retourne 1 si Wandoos n'est pas débloqué ou
 * si aucun Dump n'a encore de niveau — jamais de bonus fantôme.
 */
function wandoosCombatMultiplierV1(state) {
  const s = state.systems.wandoos;
  if (!s?.unlocked) return 1;
  const osId = IDLE_WANDOOS_OS_V1[s.data?.os] ? s.data.os : "98";
  const os = IDLE_WANDOOS_OS_V1[osId];
  const e = Math.max(0, num(s.data?.dumpEnergyLevel, 0));
  const m = Math.max(0, num(s.data?.dumpMagicLevel, 0));
  return Math.max(1, os.statBonus(e, m));
}

function createRebirthState(now) {
  return {
    number: 1,
    nextNumber: 1,
    lastNumber: 1,
    lastBosses: 0,
    lastRunSeconds: 0,
    hasPreviousRun: false,
    minimumRebirthSeconds: MIN_REBIRTH_SECONDS,
    canRebirth: false,
    preview: {},
    updatedAt: now
  };
}

function baseState(now) {
  const systems = {};
  for (const def of IDLE_NGU_SYSTEMS) {
    const s = baseSystemState(def);
    s.data = createTrackState(def);
    if (def.id === "augmentations") s.data = createAugmentationData();
    if (def.id === "timeMachine") s.data = createTimeMachineData();
    if (def.id === "bloodMagic") s.data = createBloodMagicData();
    if (def.id === "yggdrasil") s.data = createYggdrasilData();
    if (def.id === "diggers") s.data = createDiggersData();
    if (def.id === "wandoos") s.data = createWandoosData();
    if (def.id === "moneyPit") s.data = { tossesThisRun: 0, nextAt: 0, lastTossAt: 0, totalGoldTossed: 0, history: [] };
    if (def.id === "dailySpin") s.data = { readyAt: 0, totalSpins: 0, history: [] };
    if (def.id === "titans") s.data = { nextAt: 0, kills: 0, firstTitanDefeated: false };
    systems[def.id] = s;
  }

  return {
    version: IDLE_NGU_META_VERSION,
    saveSchema: IDLE_NGU_SAVE_SCHEMA,
    resourceModelVersion: 52,
    updatedAt: now,
    runStartedAt: now,
    difficulty: "normal",
    difficultyPeaks: { normal: 0, difficile: 0, extreme: 0 },
    adventure: createIdleAdventureStateV47(),
    resources: {
      energy: defaultResource("energy"),
      magic: defaultResource("magic"),
      r3: defaultResource("r3")
    },
    currencies: {
      experience: 0,
      pp: 0,
      qp: 0,
      gold: 0,
      blood: 0,
      seeds: 0,
      mayo: 0,
      ap: 0
    },
    records: {
      highestBoss: 0,
      highestZone: 1,
      setsCompleted: 0,
      totalRebirths: 0,
      highestGoldDrop: 0,
      // Newbie Offers achetées (IDLE_NGU_NEWBIE_OFFERS) : permanent, jamais
      // vidé par applyRebirthResetV56_, exactement comme les autres champs
      // de records ci-dessus (highestBoss, totalRebirths...).
      newbieOffersUsed: []
    },
    rebirth: createRebirthState(now),
    systems,
    challenge: {
      active: "",
      completions: Object.fromEntries(IDLE_NGU_NORMAL_CHALLENGES.map(def=>[def.id,0])),
      startedAt: 0,
      bestMs: {},
      hundredLevelsGained: 0
    },
    bank: {
      advancedTraining: 0,
      timeMachineSpeed: 0,
      timeMachineGold: 0,
      beards: 0
    },
    /*
     * 4G's Sellout Shop (audit 2026-09-13) — achats permanents, jamais
     * réinitialisés par un Rebirth (comme l'AP elle-même, confirmée
     * persistante au Rebirth par le wiki NGU, page Rebirths).
     */
    selloutShop: {
      purchases: {}
    },
    bonuses: {
      cards: { attack: 0, adventure: 0, drop: 0, xp: 0, ngu: 0, hacks: 0, wishes: 0 },
      ironPill: 0,
      cubePower: 0,
      cubeToughness: 0,
      cookingExp: 0,
      /*
       * "Rich Jerks" (2026-09-18, Norman : "il faut tout faire", fidélité
       * Evil/Sadistic). Wiki NGU local, page "Experience", section "Spend
       * Experience" > "Misc", tableau "Attack Boosts For Rich Jerks" :
       * Cost=30 EXP par niveau (plat, aucune formule de croissance du coût
       * publiée -- contrairement à d'autres achats de cette page qui
       * documentent un plafond, celui-ci n'en a aucun), Growth=+10% par
       * niveau, séparément pour Attack et Defense. Persistant au Rebirth
       * comme le reste de ce sac `bonuses` (EXP elle-même ne se remet
       * jamais à 0, cf. applyRebirthResetV56_ : seuls gold/blood le sont).
       */
      richJerksAttackLevel: 0,
      richJerksDefenseLevel: 0
    }
  };
}

/*
 * Coût/effet "Rich Jerks" -- voir le commentaire ci-dessus sur
 * state.bonuses.richJerksAttackLevel/richJerksDefenseLevel pour la source
 * wiki. Exportées pour que le snapshot client puisse afficher le prochain
 * coût sans dupliquer la constante.
 */
export const RICH_JERKS_COST_EXP_V1 = 30;
export const RICH_JERKS_PCT_PER_LEVEL_V1 = 10;

/*
 * Ralentissements Evil/Sadistic (2026-09-18, Norman : "il faut tout
 * faire"). Wiki NGU local, pages "Evil difficulty" et "SADISTIC
 * difficulty", section "Differences" > "Features level slower"/
 * "Features" : Augmentations, Time Machine et Blood Magic ont chacun un
 * diviseur de vitesse UNIFORME (pas cumulatif -- la valeur Sadistic est
 * déjà le total face à Normal, pas un multiplicateur additionnel sur la
 * valeur Evil) :
 *   - Augmentations : Evil 2.5 trillion (2.5e12) / Sadistic 2.5 octillion
 *     (2.5e27, soit x1e15 la valeur Evil, colonne "Relative to Evil").
 *   - Time Machine : Evil 1 trillion (1e12) / Sadistic 1 septillion
 *     (1e24, soit x1e12 la valeur Evil).
 *   - Blood Magic : Evil 1 billion (1e9) / Sadistic 10 sextillion (1e22,
 *     soit x1e13 la valeur Evil).
 * Wandoos a également un diviseur documenté (gap OS x1e6 en Evil,
 * x1e12 supplémentaire en Sadistic) mais AUCUNE mécanique Wandoos
 * (OS/Energy-Magic Dump) n'existe encore dans ce moteur -- rien à
 * diviser tant que ce système n'est pas construit, volontairement non
 * traité ici plutôt que d'inventer un point d'ancrage.
 */
const IDLE_DIFFICULTY_SPEED_DIVIDERS_V1 = Object.freeze({
  augmentations: { difficile: 2.5e12, extreme: 2.5e27 },
  timeMachine: { difficile: 1e12, extreme: 1e24 },
  bloodMagic: { difficile: 1e9, extreme: 1e22 }
});
export function idleNguDifficultySpeedDividerV1(state, system) {
  const tiers = IDLE_DIFFICULTY_SPEED_DIVIDERS_V1[system];
  if (!tiers) return 1;
  return num(tiers[state?.difficulty], 1) || 1;
}

function unlockSatisfied(def, ctx, state) {
  const u = def.unlock || {};
  if (num(ctx.bosses, 0) < num(u.bosses, 0)) return false;
  if (num(ctx.rebirths, 0) < num(u.rebirths, 0)) return false;
  if (num(ctx.sets, 0) < num(u.sets, 0)) return false;
  if (u.basicTrainingComplete && !ctx.basicTrainingComplete) return false;
  if (u.gold && num(state.currencies.gold, 0) < num(u.gold, 0) && num(ctx.gold, 0) < num(u.gold, 0)) return false;
  if (u.system && !state.systems[u.system]?.unlocked) return false;
  if (u.item) {
    const itemFlags = Object.assign(
      {},
      state.adventure?.unlockItems || {},
      ctx.unlockItems || {}
    );
    const consumedMap = {
      aNumber: "ngu",
      giantSeed: "yggdrasil",
      scrapPaper: "diggers",
      uugHair: "beards",
      pissedOffKey: "tower",
      wandoos98: "wandoos"
    };
    const consumedFlag = consumedMap[u.item] || "";
    // NGU consumables unlock their system only after being used. Merely
    // obtaining A Number / Giant Seed / Scrap Paper / etc. is not enough.
    if (consumedFlag) {
      const consumed = Boolean(
        state.adventure?.unlockFlags?.[consumedFlag] ||
        ctx.unlockFlags?.[consumedFlag]
      );
      if (!consumed) return false;
    } else if (!itemFlags[u.item]) {
      return false;
    }
  }
  if (u.flag && !(ctx.unlockFlags?.[u.flag] || state.adventure?.unlockFlags?.[u.flag])) return false;
  return true;
}

function normalizeResource(raw, resource = "energy") {
  const fallback=defaultResource(resource);
  const src = raw && typeof raw === "object" ? raw : {};
  const cap=clamp(num(src.cap, fallback.cap), resource === "energy" ? 500 : 100, 9e18);
  return {
    speed: clamp(num(src.speed, fallback.speed), 0.1, 50),
    power: clamp(num(src.power, fallback.power), 1, 1e18),
    cap,
    bars: clamp(num(src.bars, fallback.bars), 1, 1e18),
    current: clamp(num(src.current, fallback.current), 0, cap),
    fillProgress: clamp(num(src.fillProgress, 0), 0, 0.999999999999),
    generatedThisRun: Math.max(0, num(src.generatedThisRun, 0)),
    spentExp: Math.max(0, num(src.spentExp, fallback.spentExp))
  };
}

function normalizeTracks(def, rawData) {
  const created = createTrackState(def);
  if (!created.tracks) return rawData && typeof rawData === "object" ? clone(rawData) : {};
  const source = rawData && typeof rawData === "object" ? rawData : {};
  const out = createTrackState(def);
  for (const track of IDLE_NGU_TRACKS[def.id] || []) {
    const src = source.tracks?.[track.id] || {};
    out.tracks[track.id] = {
      level: Math.max(0, num(src.level, 0)),
      tempLevel: Math.max(0, num(src.tempLevel, 0)),
      permanentLevel: Math.max(0, num(src.permanentLevel, 0)),
      progress: Math.max(0, num(src.progress, 0))
    };
  }
  if ((IDLE_NGU_TRACKS[def.id] || []).some(t => t.id === source.activeTrack)) {
    out.activeTrack = source.activeTrack;
  }
  return out;
}

function normalizeSystem(def, raw) {
  const s = baseSystemState(def);
  const src = raw && typeof raw === "object" ? raw : {};
  s.unlocked = Boolean(src.unlocked);
  s.active = Boolean(src.active);
  s.level = Math.max(0, num(src.level, 0));
  s.tempLevel = Math.max(0, num(src.tempLevel, 0));
  s.permanentLevel = Math.max(0, num(src.permanentLevel, 0));
  s.progress = Math.max(0, num(src.progress, 0));
  s.allocation = Object.assign({ energy: 0, magic: 0, r3: 0 }, src.allocation || {});
  for (const key of RESOURCE_KEYS) s.allocation[key] = Math.max(0, num(s.allocation[key], 0));

  if (def.id === "augmentations") {
    s.data = createAugmentationData();
    const data = src.data && typeof src.data === "object" ? src.data : {};
    for (const aug of IDLE_NGU_AUGMENTATIONS) {
      const a = data.pairs?.[aug.id] || {};
      s.data.pairs[aug.id] = {
        level: Math.max(0, int(a.level, 0)),
        progress: Math.max(0, num(a.progress, 0)),
        upgradeLevel: Math.max(0, int(a.upgradeLevel, 0)),
        upgradeProgress: Math.max(0, num(a.upgradeProgress, 0)),
        energy: Math.max(0, num(a.energy, 0)),
        upgradeEnergy: Math.max(0, num(a.upgradeEnergy, 0))
      };
    }
    if (IDLE_NGU_AUGMENTATIONS.some(a => a.id === data.activePair)) s.data.activePair = data.activePair;
    s.data.trainUpgrade = Boolean(data.trainUpgrade);
  } else if (def.id === "timeMachine") {
    s.data = Object.assign(createTimeMachineData(), src.data || {});
    for (const key of ["speedLevel", "speedProgress", "goldLevel", "goldProgress", "bestGoldThisRun", "highestBossEver", "producedThisRun"]) {
      s.data[key] = Math.max(0, num(s.data[key], 0));
    }
  } else if (def.id === "bloodMagic") {
    s.data = createBloodMagicData();
    const data = src.data && typeof src.data === "object" ? src.data : {};
    for (const ritual of IDLE_NGU_BLOOD_RITUALS) {
      const r = data.rituals?.[ritual.id] || {};
      s.data.rituals[ritual.id] = {
        level: Math.max(0, int(r.level, 0)),
        progress: Math.max(0, num(r.progress, 0)),
        completions: Math.max(0, int(r.completions, 0))
      };
    }
    if (IDLE_NGU_BLOOD_RITUALS.some(r => r.id === data.activeRitual)) s.data.activeRitual = data.activeRitual;
    s.data.spells = Object.assign(createBloodMagicData().spells, data.spells || {});
  } else if (def.id === "yggdrasil") {
    s.data = createYggdrasilData();
    const data = src.data && typeof src.data === "object" ? src.data : {};
    for (const fruit of IDLE_NGU_YGG_FRUITS) {
      const rawFruit = data.fruits?.[fruit.id] || {};
      s.data.fruits[fruit.id] = {
        tier:clamp(int(rawFruit.tier,0),0,24),
        active:Boolean(rawFruit.active),
        growthHours:Math.max(0,num(rawFruit.growthHours,0)),
        firstHarvestThisRun:rawFruit.firstHarvestThisRun !== false
      };
    }
    s.data.reserved = {
      energy:Math.max(0,num(data.reserved?.energy,0)),
      magic:Math.max(0,num(data.reserved?.magic,0))
    };
    s.data.runPowerAlphaValue=Math.max(0,num(data.runPowerAlphaValue,0));
    s.data.runPowerBetaActive=Boolean(data.runPowerBetaActive);
    s.data.runNumbersActive=Boolean(data.runNumbersActive);
    s.data.permanent=Object.assign(createYggdrasilData().permanent,data.permanent||{});
    for(const k of Object.keys(s.data.permanent))s.data.permanent[k]=Math.max(0,num(s.data.permanent[k],0));
  } else if (def.id === "diggers") {
    s.data = createDiggersData();
    const data = src.data && typeof src.data === "object" ? src.data : {};
    s.data.slots=Math.max(1,int(data.slots,1));
    for(const defDigger of IDLE_NGU_DIGGERS){
      const rawDigger=data.diggers?.[defDigger.id]||{};
      s.data.diggers[defDigger.id]={
        maxLevel:clamp(int(rawDigger.maxLevel,0),0,defDigger.cap),
        runLevel:clamp(int(rawDigger.runLevel,0),0,defDigger.cap),
        active:Boolean(rawDigger.active)
      };
      s.data.diggers[defDigger.id].runLevel=Math.min(
        s.data.diggers[defDigger.id].runLevel,
        s.data.diggers[defDigger.id].maxLevel
      );
    }
  } else if (def.id === "moneyPit") {
    const data = src.data && typeof src.data === "object" ? src.data : {};
    s.data = {
      tossesThisRun: Math.max(0, int(data.tossesThisRun, 0)),
      nextAt: Math.max(0, num(data.nextAt, 0)),
      lastTossAt: Math.max(0, num(data.lastTossAt, 0)),
      totalGoldTossed: Math.max(0, num(data.totalGoldTossed, 0)),
      history:Array.isArray(data.history)
        ?data.history.slice(0,20).map(entry=>({
            at:Math.max(0,num(entry?.at,0)),
            cost:Math.max(0,num(entry?.cost,0)),
            tier:Math.max(0,int(entry?.tier,0)),
            reward:entry?.reward&&typeof entry.reward==="object"
              ?clone(entry.reward)
              :{},
            boost:entry?.boost&&typeof entry.boost==="object"
              ?clone(entry.boost)
              :null
          }))
        :[]
    };
  } else if (def.id === "dailySpin") {
    const data = src.data && typeof src.data === "object" ? src.data : {};
    s.data = {
      readyAt: Math.max(0, num(data.readyAt, 0)),
      totalSpins: Math.max(0, int(data.totalSpins, s.level)),
      history:Array.isArray(data.history)
        ?data.history.slice(0,20).map(entry=>({
            at:Math.max(0,num(entry?.at,0)),
            tier:Math.max(0,int(entry?.tier,0)),
            reward:entry?.reward&&typeof entry.reward==="object"
              ?clone(entry.reward)
              :{},
            totalSpins:Math.max(0,int(entry?.totalSpins,0))
          }))
        :[]
    };
  } else if (def.id === "perks") {
    /*
     * Real per-perk levels (IDLE_PERKS_CATALOG_V1), keyed by numeric id —
     * replaces the previous single shared counter. s.level is kept as the
     * SUM of purchased levels across every perk, purely for back-compat
     * with anything still reading the generic system.level field (e.g.
     * unlock checks, legacy save display) — buyPerkV1 is the only writer
     * of s.data.levels itself.
     */
    const rawLevels = src.data && typeof src.data === "object" ? src.data.levels : null;
    const levels = {};
    for (const perk of IDLE_PERKS_CATALOG_V1) {
      const v = Math.max(0, Math.min(perk.cap, int(rawLevels?.[perk.id], 0)));
      if (v > 0) levels[perk.id] = v;
    }
    s.data = { levels };
    s.level = Object.values(levels).reduce((sum, v) => sum + v, 0);
  } else if (def.id === "wandoos") {
    const data = src.data && typeof src.data === "object" ? src.data : {};
    s.data = createWandoosData();
    s.data.os = ["98", "meh", "xl"].includes(data.os) ? data.os : "98";
    s.data.dumpEnergyLevel = Math.max(0, num(data.dumpEnergyLevel, 0));
    s.data.dumpMagicLevel = Math.max(0, num(data.dumpMagicLevel, 0));
    s.data.dumpEnergyProgress = Math.max(0, num(data.dumpEnergyProgress, 0));
    s.data.dumpMagicProgress = Math.max(0, num(data.dumpMagicProgress, 0));
    s.data.osLevels = {
      moneyPit: Math.max(0, Math.min(100, num(data.osLevels?.moneyPit, 0))),
      consumed98: Math.max(0, Math.min(100, num(data.osLevels?.consumed98, 0))),
      consumedXl: Math.max(0, Math.min(100, num(data.osLevels?.consumedXl, 0)))
    };
    s.level = s.data.dumpEnergyLevel + s.data.dumpMagicLevel;
    s.tempLevel = s.level;
  } else if (def.id === "ngu") {
    s.data = normalizeNguDataV1(src.data);
    syncNguAllocationTotalsV1(s);
  } else if ((IDLE_NGU_TRACKS[def.id] || []).length) {
    s.data = normalizeTracks(def, src.data);
  } else {
    s.data = src.data && typeof src.data === "object" ? clone(src.data) : {};
  }

  return s;
}

function migrateLegacyTrackV47_(target, raw) {
  if (!target || !raw || typeof raw !== "object") return;
  target.level = Math.max(0, num(raw.level, target.level || 0));
  target.tempLevel = Math.max(0, num(raw.tempLevel, target.tempLevel || 0));
  target.permanentLevel = Math.max(0, num(raw.permanentLevel, target.permanentLevel || 0));
  target.progress = Math.max(0, num(raw.progress, target.progress || 0));
}

function legacyRunLevelsV47_(rawSystem) {
  const s = rawSystem && typeof rawSystem === "object" ? rawSystem : {};
  const tracks = s.data && s.data.tracks && typeof s.data.tracks === "object"
    ? Object.values(s.data.tracks)
    : [];
  const fromTracks = tracks.reduce(
    (sum, track) => sum + Math.max(0, num(track?.tempLevel, 0)) + Math.max(0, num(track?.level, 0)),
    0
  );
  return Math.max(0, fromTracks, num(s.tempLevel, 0), num(s.level, 0));
}

function migrateLegacyMetaToV47(raw, now) {
  const src = raw && typeof raw === "object" && !Array.isArray(raw) ? clone(raw) : {};
  const state = baseState(now);
  if (!Object.keys(src).length) return state;

  state.updatedAt = Math.max(0, num(src.updatedAt, now));
  state.runStartedAt = Math.max(0, num(src.runStartedAt, now));
  state.difficulty = ["normal", "difficile", "extreme"].includes(src.difficulty) ? src.difficulty : "normal";
  state.difficultyPeaks = Object.assign(state.difficultyPeaks, src.difficultyPeaks || {});

  state.resources = {
    energy: normalizeResource(src.resources?.energy,"energy"),
    magic: normalizeResource(src.resources?.magic,"magic"),
    r3: normalizeResource(src.resources?.r3,"r3")
  };

  state.currencies = Object.assign(state.currencies, src.currencies || {});
  for (const key of Object.keys(state.currencies)) state.currencies[key] = Math.max(0, num(state.currencies[key], 0));

  state.records = Object.assign(state.records, src.records || {});
  // newbieOffersUsed est un tableau, pas un compteur — même exclusion que
  // dans normalizeIdleNguState plus bas (évite Number([...]) === 0).
  const legacyNewbieOffersUsed = Array.isArray(state.records.newbieOffersUsed) ? state.records.newbieOffersUsed : [];
  for (const key of Object.keys(state.records)) {
    if (key === "newbieOffersUsed") continue;
    state.records[key] = Math.max(0, num(state.records[key], 0));
  }
  state.records.newbieOffersUsed = legacyNewbieOffersUsed.filter(id => typeof id === "string" && id);

  state.challenge = Object.assign(state.challenge, src.challenge || {});
  state.challenge.completions = Object.assign(
    baseState(now).challenge.completions,
    src.challenge?.completions || {}
  );
  state.challenge.bestMs = Object.assign({},src.challenge?.bestMs || {});

  state.bank.advancedTraining = Math.max(0, num(src.bank?.advancedTraining, 0));
  state.bank.timeMachineSpeed = Math.max(0, num(src.bank?.timeMachineSpeed, src.bank?.timeMachine || 0));
  state.bank.timeMachineGold = Math.max(0, num(src.bank?.timeMachineGold, 0));
  state.bank.beards = Math.max(0, num(src.bank?.beards, 0));

  /*
   * 4G's Sellout Shop : purchases est un compteur par objet du catalogue,
   * jamais négatif, jamais au-delà du plafond réel de l'objet (défensif
   * contre un ancien état corrompu ou un catalogue réduit entre deux
   * versions).
   */
  {
    const rawPurchases = src.selloutShop?.purchases && typeof src.selloutShop.purchases === "object" ? src.selloutShop.purchases : {};
    const purchases = {};
    for (const item of IDLE_SELLOUT_SHOP_CATALOG_V1) {
      const n = Math.max(0, int(rawPurchases[item.id], 0));
      purchases[item.id] = item.max != null ? Math.min(item.max, n) : n;
    }
    /*
     * Norman (2026-09-16) : "J'aimerais que le sellout shop n'apparaisse
     * qu'à partir du moment où on récolte ses premiers points d'AP."
     * unlockedEver reste vrai pour toujours dès la première fois où l'AP
     * dépasse 0 — jamais juste "ap>0 en ce moment", sinon dépenser tout
     * son AP au shop referait disparaître le menu qu'on est en train
     * d'utiliser.
     */
    const unlockedEver = Boolean(src.selloutShop?.unlockedEver) || num(state.currencies.ap, 0) > 0;
    state.selloutShop = { purchases, unlockedEver };
  }

  state.bonuses = Object.assign(state.bonuses, src.bonuses || {});
  state.bonuses.cards = Object.assign(baseState(now).bonuses.cards, src.bonuses?.cards || {});
  if (src.rebirth && typeof src.rebirth === "object") state.rebirth = clone(src.rebirth);
  if (src.adventure && typeof src.adventure === "object") state.adventure = clone(src.adventure);

  const oldSystems = src.systems && typeof src.systems === "object" ? src.systems : {};
  for (const def of IDLE_NGU_SYSTEMS) {
    const old = oldSystems[def.id];
    if (!old || typeof old !== "object") continue;
    const target = state.systems[def.id];
    target.unlocked = Boolean(old.unlocked);
    target.active = Boolean(old.active);
    target.level = Math.max(0, num(old.level, 0));
    target.tempLevel = Math.max(0, num(old.tempLevel, 0));
    target.permanentLevel = Math.max(0, num(old.permanentLevel, 0));
    target.progress = Math.max(0, num(old.progress, 0));

    for (const resource of RESOURCE_KEYS) {
      const legacyPercent = clamp(num(old.allocation?.[resource], 0), 0, 100);
      target.allocation[resource] = state.resources[resource].cap * legacyPercent / 100;
    }

    if (target.data?.tracks) {
      const oldTracks = old.data?.tracks && typeof old.data.tracks === "object" ? old.data.tracks : {};
      for (const [trackId, trackState] of Object.entries(target.data.tracks)) {
        migrateLegacyTrackV47_(trackState, oldTracks[trackId]);
      }
      if (def.id === "advancedTraining" && oldTracks.wandoos && target.data.tracks.wandoosEnergy) {
        migrateLegacyTrackV47_(target.data.tracks.wandoosEnergy, oldTracks.wandoos);
      }
      if (old.data?.activeTrack && target.data.tracks[old.data.activeTrack]) {
        target.data.activeTrack = old.data.activeTrack;
      }
    } else if (def.id === "augmentations") {
      if (old.data?.pairs && typeof old.data.pairs === "object") {
        for (const aug of IDLE_NGU_AUGMENTATIONS) {
          const p = old.data.pairs[aug.id];
          if (!p) continue;
          target.data.pairs[aug.id] = Object.assign(target.data.pairs[aug.id], p);
        }
        if (target.data.pairs[old.data.activePair]) target.data.activePair = old.data.activePair;
        target.data.trainUpgrade = Boolean(old.data.trainUpgrade);
      } else {
        target.data.pairs.scissors.level = Math.floor(legacyRunLevelsV47_(old));
      }
    } else if (def.id === "timeMachine") {
      if (old.data && (old.data.speedLevel != null || old.data.goldLevel != null)) {
        target.data = Object.assign(target.data, old.data);
      } else {
        target.data.speedLevel = Math.floor(legacyRunLevelsV47_(old));
        target.data.bestGoldThisRun = Math.max(0, num(src.records?.highestGoldDrop, 0));
        target.data.highestBossEver = Math.max(0, num(src.records?.highestBoss, 0));
      }
    } else if (def.id === "bloodMagic") {
      if (old.data?.rituals && typeof old.data.rituals === "object") {
        for (const ritual of IDLE_NGU_BLOOD_RITUALS) {
          const r = old.data.rituals[ritual.id];
          if (r) target.data.rituals[ritual.id] = Object.assign(target.data.rituals[ritual.id], r);
        }
        if (target.data.rituals[old.data.activeRitual]) target.data.activeRitual = old.data.activeRitual;
        target.data.spells = Object.assign(target.data.spells, old.data.spells || {});
      } else {
        const levels = Math.floor(legacyRunLevelsV47_(old));
        target.data.rituals.tack.level = levels;
        target.data.rituals.tack.completions = levels;
      }
    } else if (def.id === "yggdrasil" && old.data?.fruits) {
      target.data = Object.assign(target.data, old.data);
    } else if (def.id === "diggers" && old.data?.diggers) {
      target.data = Object.assign(target.data, old.data);
    } else if (!target.data?.tracks && old.data && typeof old.data === "object") {
      target.data = Object.assign(target.data || {}, old.data);
    }
  }

  state.migration = {
    fromVersion: String(src.version || "legacy"),
    fromSchema: Math.max(0, int(src.saveSchema, 0)),
    migratedAt: now
  };
  return state;
}

/*
 * V47 save rule: migrate compatible NGU progress forward without reviving
 * obsolete player-level / Renaissance / Essence mechanics. Migration is
 * one-way and idempotent: once normalized, the save is native schema 47.
 */
export function normalizeIdleNguState(raw, context = {}, now = Date.now()) {
  const t = nowMs(now);
  const isV47 = raw && raw.version === IDLE_NGU_META_VERSION && raw.saveSchema === IDLE_NGU_SAVE_SCHEMA;
  const source = isV47 ? clone(raw) : migrateLegacyMetaToV47(raw, t);
  const state = Object.assign(baseState(t), source);

  state.version = IDLE_NGU_META_VERSION;
  state.saveSchema = IDLE_NGU_SAVE_SCHEMA;
  const previousResourceModelVersion=Math.max(0,int(source.resourceModelVersion,0));
  state.resourceModelVersion = 52;
  state.updatedAt = Math.max(0, num(source.updatedAt, t));
  state.runStartedAt = Math.max(0, num(source.runStartedAt, t));
  state.adventure = normalizeIdleAdventureStateV47(source.adventure);

  /*
   * Parité NGU : au premier déblocage d'Adventure, l'inventaire contient
   * le Tutorial Cube plus un Boost Power 1, Toughness 1 et Special 1.
   * Le drapeau est persistant : jamais de doublon aux synchros suivantes.
   */
  state.adventure.unlockFlags=state.adventure.unlockFlags||{};
  if(
    Math.max(0,int(context&&context.bosses,0))>=4 &&
    !state.adventure.unlockFlags.starterBoostsGrantedV1
  ){
    ["power","toughness","special"].forEach(function(type){
      idleAdventureAddItemV1(state.adventure,idleAdventureBoostV1(type,1));
    });
    state.adventure.unlockFlags.starterBoostsGrantedV1=true;
  }

  state.resources = {
    energy: normalizeResource(source.resources?.energy,"energy"),
    magic: normalizeResource(source.resources?.magic,"magic"),
    r3: normalizeResource(source.resources?.r3,"r3")
  };

  state.currencies = Object.assign(baseState(t).currencies, source.currencies || {});
  for (const k of Object.keys(state.currencies)) state.currencies[k] = Math.max(0, num(state.currencies[k], 0));

  /*
   * Norman (2026-09-16) : "le sellout shop ne doit apparaître qu'à
   * partir du moment où on récolte ses premiers points d'AP." Dérivé
   * ICI (chemin commun aux deux migrations, v47 déjà natif ou legacy)
   * plutôt que seulement dans migrateLegacyMetaToV47 — sinon un save
   * déjà en v47 (l'immense majorité) ne recalculait jamais ce drapeau.
   * unlockedEver reste vrai pour toujours une fois franchi, jamais
   * réévalué sur le solde courant (dépenser tout son AP au shop ne doit
   * jamais faire disparaître le menu qu'on est en train d'utiliser).
   */
  state.selloutShop = Object.assign(baseState(t).selloutShop, state.selloutShop || {});
  state.selloutShop.unlockedEver = Boolean(state.selloutShop.unlockedEver) || num(state.currencies.ap, 0) > 0;

  state.records = Object.assign(baseState(t).records, source.records || {});
  /*
   * newbieOffersUsed est un tableau d'ids (IDLE_NGU_NEWBIE_OFFERS), pas un
   * compteur numérique — exclu de la coercion Math.max(0,num(...)) juste en
   * dessous (qui le réduirait sinon à 0 via Number([...]) === NaN/0) et
   * assaini séparément pour tolérer une sauvegarde corrompue.
   */
  const newbieOffersUsedSrc = Array.isArray(state.records.newbieOffersUsed) ? state.records.newbieOffersUsed : [];
  for (const k of Object.keys(state.records)) {
    if (k === "newbieOffersUsed") continue;
    state.records[k] = Math.max(0, num(state.records[k], 0));
  }
  state.records.newbieOffersUsed = Array.from(new Set(newbieOffersUsedSrc.filter(id => typeof id === "string" && id)));

  state.challenge = Object.assign(baseState(t).challenge, source.challenge || {});
  state.challenge.completions = Object.assign(baseState(t).challenge.completions, source.challenge?.completions || {});
  state.bank = Object.assign(baseState(t).bank, source.bank || {});
  state.bonuses = Object.assign(baseState(t).bonuses, source.bonuses || {});
  state.bonuses.cards = Object.assign(baseState(t).bonuses.cards, source.bonuses?.cards || {});

  const systems = {};
  for (const def of IDLE_NGU_SYSTEMS) systems[def.id] = normalizeSystem(def, source.systems?.[def.id]);
  state.systems = systems;

  /*
   * Migration NGU (2026-09-23) : les anciennes sauvegardes portaient 9 pistes
   * inventées et une allocation globale. Les niveaux de ces pistes n'ont pas
   * d'équivalent dans les 16 vrais NGU : ils repartent de zéro (comme au
   * début d'une vraie partie) et l'énergie/magie qui leur était allouée est
   * rendue au joueur.
   */
  {
    const oldNgu = source.systems?.ngu;
    if (oldNgu && typeof oldNgu === "object" && !(oldNgu.data && oldNgu.data.ngus)) {
      for (const resource of ["energy", "magic"]) {
        const held = Math.max(0, num(oldNgu.allocation?.[resource], 0));
        if (held > 0 && state.resources[resource]) {
          state.resources[resource].current = Math.max(0, num(state.resources[resource].current, 0)) + held;
        }
      }
    }
  }

  // V51 migration: older V47/V50 saves had no persisted free-resource pool.
  // The legacy row is consulted once when available, then metaNgu owns it.
  if(previousResourceModelVersion < 51){
    const energyHeldByMeta=totalAllocated(state,"energy");
    const energyHeldExternally=externalResourceAllocation(context,"energy");
    const legacyEnergy=Number(context.legacyEnergyIdle);
    state.resources.energy.current=Number.isFinite(legacyEnergy)
      ? clamp(legacyEnergy,0,Math.max(0,state.resources.energy.cap-energyHeldByMeta-energyHeldExternally))
      : Math.max(0,state.resources.energy.cap-energyHeldByMeta-energyHeldExternally);
    state.resources.energy.fillProgress=0;
    state.resources.energy.generatedThisRun=0;

    const legacyMagic=Number(context.legacyMagicIdle);
    state.resources.magic.current=Number.isFinite(legacyMagic)
      ? clamp(legacyMagic,0,Math.max(0,state.resources.magic.cap-totalAllocated(state,"magic")))
      : 0;
    state.resources.magic.fillProgress=0;
    state.resources.magic.generatedThisRun=0;
  }

  // V52 removes the old Yggdrasil reservation/refund model. Existing active
  // fruit reservations are converted once into actually spent idle resource.
  if(previousResourceModelVersion < 52 && state.systems.yggdrasil?.data?.reserved){
    for(const resource of ["energy","magic"]){
      const reserved=Math.max(0,num(state.systems.yggdrasil.data.reserved[resource],0));
      if(reserved>0 && state.resources[resource]){
        state.resources[resource].current=Math.max(0,num(state.resources[resource].current,0)-reserved);
      }
      state.systems.yggdrasil.data.reserved[resource]=0;
    }
  }

  const bosses = Math.max(0, int(context.bosses, 0));
  const zone = Math.max(1, int(context.zone, 1));
  const sets = Math.max(0, int(context.sets, 0));
  const rebirths = Math.max(0, int(context.rebirths, state.records.totalRebirths));

  state.records.highestBoss = Math.max(state.records.highestBoss, bosses);
  state.records.highestZone = Math.max(state.records.highestZone, zone);
  state.records.setsCompleted = Math.max(state.records.setsCompleted, sets);
  state.records.totalRebirths = Math.max(state.records.totalRebirths, rebirths);
  state.records.highestGoldDrop = Math.max(state.records.highestGoldDrop, num(context.bestGold, 0));

  const tm = state.systems.timeMachine;
  tm.data.bestGoldThisRun = Math.max(tm.data.bestGoldThisRun, num(context.bestGold, 0));
  tm.data.highestBossEver = Math.max(tm.data.highestBossEver, state.records.highestBoss);

  for (const def of IDLE_NGU_SYSTEMS) {
    if (unlockSatisfied(def, context, state)) state.systems[def.id].unlocked = true;
  }

  state.systems.achievements.unlocked = true;
  reconcileResourceCurrents(state,context);
  /*
   * Norman (2026-09-18) : "il faut tout faire" (fidélité Evil/Sadistic).
   * Cause racine d'un bug bloquant trouvé en auditant ce fichier :
   * state.difficulty était lu correctement plus haut (migrateLegacyMetaToV47
   * puis Object.assign(baseState(t), source)) puis ÉCRASÉ ici en dur à
   * "normal" à CHAQUE sync — rendant impossible toute persistance d'un
   * choix Evil/Sadistic (state.difficulty ne valait jamais autre chose que
   * "normal" au runtime, quoi que le joueur ait choisi). difficultyPeaks.
   * normal était de même mis à jour en dur, peu importe la difficulté
   * réellement active -- corrigé pour suivre state.difficulty (déjà lu,
   * jamais réécrit ici).
   */
  state.difficultyPeaks = Object.assign({ normal: 0, difficile: 0, extreme: 0 }, source.difficultyPeaks || {});
  state.difficultyPeaks[state.difficulty] = Math.max(num(state.difficultyPeaks[state.difficulty], 0), bosses);

  state.rebirth = normalizeRebirthState(source.rebirth, state.runStartedAt, t);
  state.rebirth = refreshRebirthState(state, context, t);
  return state;
}

function normalizeRebirthState(raw, runStartedAt, now) {
  const out = Object.assign(createRebirthState(now), raw && typeof raw === "object" ? raw : {});
  for (const k of ["number", "nextNumber", "lastNumber"]) out[k] = Math.max(1e-300, num(out[k], 1));
  out.lastBosses = Math.max(0, int(out.lastBosses, 0));
  out.lastRunSeconds = Math.max(0, num(out.lastRunSeconds, 0));
  out.hasPreviousRun = Boolean(out.hasPreviousRun);
  out.minimumRebirthSeconds = MIN_REBIRTH_SECONDS;
  out.updatedAt = now;
  if (!Number.isFinite(Number(runStartedAt))) out.canRebirth = false;
  return out;
}

export function idleNguRebirthTimeFactor(seconds) {
  const minutes = Math.max(0, num(seconds, 0)) / 60;
  if (minutes < 2) return Math.max(1e-300, minutes / 1989672960);
  if (minutes < 3) return minutes / 31088640;
  if (minutes < 4) return minutes / 971520;
  if (minutes < 5) return minutes / 122880;
  if (minutes < 7) return minutes / 30720;
  if (minutes < 10) return minutes / 7680;
  if (minutes < 12) return minutes / 1920;
  if (minutes < 15) return minutes / 480;
  if (minutes < 30) return minutes / 240;
  if (minutes < 60) return minutes / 120;
  return 1 + minutes / (60 * 24 * 2);
}

export function calculateIdleNguNextNumber(input = {}) {
  const bosses = Math.max(0, int(input.bosses, 0));
  const lastBosses = Math.max(0, int(input.lastBosses, 0));
  const runSeconds = Math.max(0, num(input.runSeconds, 0));
  const lastRunSeconds = Math.max(0, num(input.lastRunSeconds, 0));
  const hasPreviousRun = Boolean(input.hasPreviousRun);
  /*
   * Norman (2026-09-18) : "il faut tout faire" (fidélité Evil/Sadistic).
   * Wiki NGU local, page "SADISTIC difficulty", section "Fight boss and
   * number" : "Boss Power Bonus of rebirth NUMBER is based on 1.2^[boss
   * beaten]... this multiplier can be increased to up to x1.25 per boss
   * killed through the unlocking of the relevant Perks, Quirks and
   * Wishes." Perks 157/158 ("Improved Sadistic Boss Multiplier I/II",
   * +0.0005/niveau chacun, cap 10) et Quirks 74/75 (+0.001/niveau chacun,
   * cap 10) totalisent jusqu'à +0.01+0.02=0.03... la borne wiki "up to
   * x1.25" inclut aussi les Wishes (non construites) : seule la portion
   * Perks+Quirks est câblée ici, jamais extrapolée jusqu'à 1.25.
   */
  const base = input.difficulty === "extreme" ? 1.2 + Math.max(0, num(input.sadisticBossMultiplierBonus, 0)) : input.difficulty === "difficile" ? 1.5 : 2;

  const currentBossFactor = safePow(base, bosses);
  const priorBossFactor = hasPreviousRun ? safePow(base, lastBosses) : 1;
  const currentTimeFactor = idleNguRebirthTimeFactor(runSeconds);
  const priorTimeFactor = hasPreviousRun ? idleNguRebirthTimeFactor(lastRunSeconds) : 1;
  const trainingFactor = Math.max(1, Math.floor(1 + Math.max(0, num(input.attackTrainingLevels, 0)) / 10000));
  const bloodMagicBonus = Math.max(1, num(input.bloodMagicBonus, 1));
  const nguNumberBonus = Math.max(1, num(input.nguNumberBonus, 1));
  const beardNumberBonus = Math.max(1, num(input.beardNumberBonus, 1));
  const yggNumberBonus = Math.max(1, num(input.yggNumberBonus, 1));
  const macguffinNumberBonus = Math.max(1, num(input.macguffinNumberBonus, 1));
  const hacksNumberBonus = Math.max(1, num(input.hacksNumberBonus, 1));

  return {
    nextNumber: safeProduct([
      currentBossFactor,
      priorBossFactor,
      currentTimeFactor,
      priorTimeFactor,
      trainingFactor,
      bloodMagicBonus,
      nguNumberBonus,
      beardNumberBonus,
      yggNumberBonus,
      macguffinNumberBonus,
      hacksNumberBonus
    ]),
    canRebirth: runSeconds >= MIN_REBIRTH_SECONDS && bosses >= REBIRTH_UNLOCK_BOSS_V1,
    minimumRebirthSeconds: MIN_REBIRTH_SECONDS,
    factors: {
      currentBossFactor,
      priorBossFactor,
      currentTimeFactor,
      priorTimeFactor,
      trainingFactor,
      bloodMagicBonus,
      nguNumberBonus,
      beardNumberBonus,
      yggNumberBonus,
      macguffinNumberBonus,
      hacksNumberBonus
    }
  };
}

function totalTrackLevel(system, trackId) {
  const t = system?.data?.tracks?.[trackId];
  if (!t) return 0;
  return Math.max(0, num(t.level, 0) + num(t.tempLevel, 0) + num(t.permanentLevel, 0));
}

function bloodNumberMultiplier(state) {
  return Math.max(1, num(state.systems.bloodMagic?.data?.spells?.numberBoost, 1));
}

function refreshRebirthState(state, context, now) {
  const runSeconds = Math.max(0, (now - state.runStartedAt) / 1000);
  const rb = normalizeRebirthState(state.rebirth, state.runStartedAt, now);
  const preview = calculateIdleNguNextNumber({
    /*
     * Norman (2026-09-18) : "il faut tout faire" (fidélité Evil/Sadistic).
     * calculateIdleNguNextNumber sait déjà distinguer "difficile" (Evil,
     * 1.5^boss) et "extreme" (Sadistic, 1.2^boss) de "normal" (2^boss) --
     * mais ce point d'appel forçait "normal" en dur, rendant la formule
     * Evil/Sadistic inatteignable même une fois state.difficulty
     * correctement choisi et persisté (cf. correctif normalizeIdleNguState
     * ci-dessus). Lit maintenant la vraie difficulté active.
     */
    difficulty: state.difficulty,
    bosses: context.bosses,
    lastBosses: rb.lastBosses,
    runSeconds,
    lastRunSeconds: rb.lastRunSeconds,
    hasPreviousRun: rb.hasPreviousRun,
    attackTrainingLevels: context.attackTrainingLevels,
    bloodMagicBonus: bloodNumberMultiplier(state),
    nguNumberBonus: nguFxV1(state).number,
    beardNumberBonus: beardBonusMultiplier(state, "number"),
    yggNumberBonus: 1,
    macguffinNumberBonus: 1,
    hacksNumberBonus: 1,
    sadisticBossMultiplierBonus:
      perkBonusesV1(state.systems.perks?.data?.levels).sadisticBossMultiplierBonus +
      quirkBonusesV1(state.systems.quirks?.data?.levels).sadisticBossMultiplierBonus
  });
  rb.nextNumber = preview.nextNumber;
  rb.canRebirth = preview.canRebirth;
  rb.preview = preview.factors;
  rb.updatedAt = now;
  return rb;
}

/*
 * Correctif PISTE 6 de l'audit wiki 2026-09-18 : idleNguBonuses() (plus bas
 * dans ce fichier) calcule déjà energyPowerFlat/energyBarsFlat/
 * energyCapMultiplier/magicPowerFlat/magicBarsFlat/magicCapFlat/
 * magicCapMultiplier/r3PowerMultiplier/r3CapMultiplier/r3BarsMultiplier
 * (alimentés par Perks/Quirks/Wishes -- ex. idle-perks-v1.js:94, "The
 * Newbie Magic Perk" : "Gain 1 Magic Power, 1 Magic Bar, and 10k Magic
 * Cap!") mais AUCUN autre point de ce fichier ne relisait ces champs avant
 * ce correctif (grep sur chaque nom de champ, seule idleNguBonuses() les
 * produisait) : un joueur montant ces Perks/Quirks/Wishes ne voyait aucun
 * effet sur sa vitesse Energy/Magic/Resource 3. idleNguEffectiveResourceStatV1
 * centralise la lecture "effective" (achat brut + bonus) utilisée par tous
 * les calculs de vitesse/débit ci-dessous -- jamais en mutant
 * state.resources.<r>.power/bars/cap eux-mêmes (ce total acheté reste
 * affiché tel quel côté UI, seul l'effectif utilisé par le calcul change).
 * idleNguBonuses() ne dépend d'aucune de ces fonctions de ressource (vérifié
 * par grep dans son corps, lignes 2966-3205) : pas de récursion.
 *
 * Correctif 2026-09-18 (suite, "finir le câblage laissé ouvert") :
 * energyPowerMultiplier/energyBarsMultiplier/magicPowerMultiplier/
 * magicBarsMultiplier (Perks/Quirks/Wishes + objets Specials depuis
 * 5a281bd/12e2fe2) restaient calculés par idleNguBonuses() mais jamais lus
 * ici -- seul le terme *Flat l'était pour power/bars (le terme *Multiplier
 * de "cap" ci-dessous, lui, était déjà correctement appliqué depuis le
 * début : (raw+flat)*mult). Mis en cohérence avec ce même schéma pour
 * power/bars, au lieu de le laisser à raw+flat sans multiplicateur --
 * c'est aussi exactement la façon dont attackMultiplier/dropMultiplier
 * composent déjà flat et multiplicatif ailleurs dans ce fichier (une base
 * additive suivie d'un ou plusieurs facteurs multiplicatifs).
 */
function idleNguEffectiveResourceStatV1(state, resource, stat) {
  const raw = Math.max(0, num(state.resources?.[resource]?.[stat], 0));
  if (resource !== "energy" && resource !== "magic" && resource !== "r3") return raw;
  const bonuses = idleNguBonuses(state);
  if (resource === "r3") {
    if (stat === "power") return raw * Math.max(0, num(bonuses.r3PowerMultiplier, 1));
    if (stat === "bars") return raw * Math.max(0, num(bonuses.r3BarsMultiplier, 1));
    if (stat === "cap") return raw * Math.max(0, num(bonuses.r3CapMultiplier, 1));
    return raw;
  }
  if (stat === "power") {
    const flat = Math.max(0, num(bonuses[`${resource}PowerFlat`], 0));
    const mult = Math.max(0, num(bonuses[`${resource}PowerMultiplier`], 1));
    return (raw + flat) * mult;
  }
  if (stat === "bars") {
    const flat = Math.max(0, num(bonuses[`${resource}BarsFlat`], 0));
    const mult = Math.max(0, num(bonuses[`${resource}BarsMultiplier`], 1));
    return (raw + flat) * mult;
  }
  if (stat === "cap") {
    const flat = Math.max(0, num(bonuses[`${resource}CapFlat`], 0));
    const mult = Math.max(0, num(bonuses[`${resource}CapMultiplier`], 1));
    return (raw + flat) * mult;
  }
  if (stat === "speed") {
    /*
     * Training Set : +2 Energy Speed (bonus de complétion NGU).
     * Le bonus était bien stocké dans adventure.permanent.energySpeedFlat
     * mais aucun consommateur ne le lisait : la génération utilisait
     * directement state.resources.energy.speed. Même chemin pour les
     * multiplicateurs Energy/Magic Speed provenant des objets.
     */
    const flat = Math.max(0, num(bonuses[`${resource}SpeedFlat`], 0));
    const mult = Math.max(0, num(bonuses[`${resource}SpeedMultiplier`], 1));
    return (raw + flat) * mult;
  }
  return raw;
}

function resourceThroughput(state, resource) {
  const power = idleNguEffectiveResourceStatV1(state, resource, "power");
  const bars = idleNguEffectiveResourceStatV1(state, resource, "bars");
  return Math.max(1, power) * Math.max(1, bars);
}

function totalAllocated(state, resource, exceptId = "") {
  let total = 0;
  for (const def of IDLE_NGU_SYSTEMS) {
    if (def.id === exceptId) continue;
    total += Math.max(0, num(state.systems[def.id]?.allocation?.[resource], 0));
  }
  return total;
}

function externalResourceAllocation(context, resource) {
  const generic=Math.max(0,num(context?.externalResourceAllocations?.[resource],0));
  const basicTraining=resource === "energy"
    ? Math.max(0,num(context?.basicTrainingEnergyAllocation,0))
    : 0;
  return generic+basicTraining;
}

function resourceCapacityForCurrent(state,resource,context={}){
  const cap=idleNguEffectiveResourceStatV1(state,resource,"cap");
  return Math.max(0,cap-totalAllocated(state,resource)-externalResourceAllocation(context,resource));
}

function reconcileResourceCurrents(state,context={}){
  for(const resource of RESOURCE_KEYS){
    const r=state.resources[resource];
    if(!r)continue;
    r.current=clamp(num(r.current,0),0,resourceCapacityForCurrent(state,resource,context));
    r.fillProgress=clamp(num(r.fillProgress,0),0,0.999999999999);
    r.generatedThisRun=Math.max(0,num(r.generatedThisRun,0));
  }
}

export function idleNguResourceGenerationPerSecond(raw,resource){
  if(!RESOURCE_KEYS.includes(resource))throw new Error("RESSOURCE_INVALIDE");
  const state=raw&&raw.version===IDLE_NGU_META_VERSION?raw:normalizeIdleNguState(raw||{});
  if(resource==="r3")return 0;
  if(resource==="magic"&&!state.systems.bloodMagic?.unlocked)return 0;
  const r=state.resources[resource]||defaultResource(resource);
  const speed=clamp(idleNguEffectiveResourceStatV1(state,resource,"speed"),0.1,50);
  const ticksPerFill=Math.max(1,Math.ceil(50/speed));
  const fillsPerSecond=50/ticksPerFill;
  const bars=idleNguEffectiveResourceStatV1(state,resource,"bars");
  return fillsPerSecond*Math.max(1,bars);
}

function advanceGeneratedResources(state,seconds,context={}){
  if(seconds<=0)return;
  for(const resource of ["energy","magic"]){
    if(resource==="magic"&&!state.systems.bloodMagic?.unlocked)continue;
    const r=state.resources[resource];
    const capacity=resourceCapacityForCurrent(state,resource,context);
    if(capacity<=r.current+1e-12)continue;
    const perSecond=idleNguResourceGenerationPerSecond(state,resource);
    const bars=Math.max(1,idleNguEffectiveResourceStatV1(state,resource,"bars"));
    const fillsPerSecond=perSecond/bars;
    const fillTotal=Math.max(0,num(r.fillProgress,0))+fillsPerSecond*seconds;
    const fullFills=Math.floor(fillTotal+1e-12);
    r.fillProgress=clamp(fillTotal-fullFills,0,0.999999999999);
    if(fullFills<=0)continue;
    const possibleGain=fullFills*bars;
    const gain=Math.min(possibleGain,Math.max(0,capacity-r.current));
    r.current+=gain;
    r.generatedThisRun+=gain;
    if(gain+1e-12<possibleGain)r.fillProgress=0;
  }
}

export function idleNguResourceBudget(raw, resource, context = {}) {
  if (!RESOURCE_KEYS.includes(resource)) throw new Error("RESSOURCE_INVALIDE");
  const state = raw && raw.version === IDLE_NGU_META_VERSION
    ? raw
    : normalizeIdleNguState(raw, context, raw?.updatedAt || Date.now());
  const cap=Math.max(0,num(state.resources?.[resource]?.cap,0));
  const allocated=Math.max(0,totalAllocated(state,resource));
  const reservedExternal=externalResourceAllocation(context,resource);
  const current=clamp(num(state.resources?.[resource]?.current,0),0,Math.max(0,cap-allocated-reservedExternal));
  return {
    cap,
    current,
    allocated,
    reservedExternal,
    available:current,
    freeCapacity:Math.max(0,cap-current-allocated-reservedExternal),
    totalHeld:Math.min(cap,current+allocated+reservedExternal)
  };
}

function setAllocation(state, id, resource, value, context = {}) {
  const def = IDLE_NGU_SYSTEMS.find(x => x.id === id);
  const s = state.systems[id];
  if (!def || !s || !s.unlocked) throw new Error("SYSTEME_VERROUILLE");
  if(state.challenge?.active==="noAugmentations"&&id==="augmentations")throw new Error("DEFI_SANS_AUGMENTATIONS");
  if (!def.resources.includes(resource)) throw new Error("RESSOURCE_INCOMPATIBLE");
  if (resource === "magic" && !state.systems.bloodMagic.unlocked) throw new Error("MAGIC_VERROUILLEE");
  const r=state.resources[resource];
  const cap = Math.max(0, r?.cap || 0);
  const previous=Math.max(0,num(s.allocation[resource],0));
  const usedElsewhere = totalAllocated(state, resource, id) + externalResourceAllocation(context,resource);
  const maxByCapacity=Math.max(0,cap-usedElsewhere);
  const maxByOwned=Math.max(0,previous+num(r.current,0));
  const target=clamp(value,0,Math.min(maxByCapacity,maxByOwned));
  const delta=target-previous;
  s.allocation[resource]=target;
  r.current=clamp(num(r.current,0)-delta,0,Math.max(0,cap-usedElsewhere-target));
}

function reclaimAllocatedResource(state,resource,context={}){
  if(resource!=="energy"&&resource!=="magic")throw new Error("RESSOURCE_INVALIDE");
  if(resource==="magic"&&!state.systems.bloodMagic?.unlocked)throw new Error("MAGIC_VERROUILLEE");
  let released=0;
  for(const def of IDLE_NGU_SYSTEMS){
    const s=state.systems[def.id];
    if(!s?.allocation)continue;
    const amount=Math.max(0,num(s.allocation[resource],0));
    if(amount<=0)continue;
    released+=amount;
    s.allocation[resource]=0;
    if(def.id==="ngu"){clearNguAllocationsV1(s,resource);syncNguAllocationTotalsV1(s);}
  }
  const r=state.resources[resource];
  r.current=clamp(
    num(r.current,0)+released,
    0,
    Math.max(0,idleNguEffectiveResourceStatV1(state,resource,"cap")-externalResourceAllocation(context,resource))
  );
  return {resource,released,current:r.current};
}

function augmentationPair(state) {
  const system = state.systems.augmentations;
  return IDLE_NGU_AUGMENTATIONS.find(x => x.id === system.data.activePair) || IDLE_NGU_AUGMENTATIONS[0];
}

function augmentationGoldCost(state,def,level,upgrade=false) {
  const n=Math.max(1,int(level,0)+1);
  const base=upgrade?def.upgrade.baseGold*n*n:def.baseGold*n;
  return base*challengePermanentBonuses(state).augmentationCostMultiplier;
}

function augmentationSecondsForNextLevel(state, def, upgrade = false) {
  const pair=state.systems.augmentations.data.pairs?.[def.id]||{};
  const perTrack=Math.max(0,num(upgrade?pair.upgradeEnergy:pair.energy,0));
  const legacy=Math.max(0,num(state.systems.augmentations.allocation.energy,0));
  const allocation=perTrack>0?perTrack:(
    def.id===state.systems.augmentations.data.activePair &&
    Boolean(upgrade)===Boolean(state.systems.augmentations.data.trainUpgrade)
      ?legacy
      :0
  );
  if (allocation <= 0) return Infinity;
  const power = Math.max(1, idleNguEffectiveResourceStatV1(state, "energy", "power"));
  const base = upgrade ? def.upgrade.baseSeconds : def.baseSeconds;
  const challengeSpeed=challengePermanentBonuses(state).augmentationSpeedMultiplier;
  const difficultyDivider = idleNguDifficultySpeedDividerV1(state, "augmentations");
  return base * 1000 * difficultyDivider / Math.max(1e-12, allocation * power * challengeSpeed);
}

function advanceAugmentationTrackV214_(state,seconds,context,def,pair,upgrade){
  if(num(context.bosses,0)<def.unlockBoss)return;
  if(upgrade&&(!def.upgrade||num(context.bosses,0)<def.upgrade.unlockBoss))return;
  let remaining=seconds,guard=0;
  const progressKey=upgrade?"upgradeProgress":"progress";
  while(remaining>0&&guard++<10000){
    const level=upgrade?pair.upgradeLevel:pair.level;
    const needed=augmentationSecondsForNextLevel(state,def,upgrade);
    if(!Number.isFinite(needed))break;
    const missing=Math.max(0,needed-num(pair[progressKey],0));
    if(remaining+1e-9<missing){pair[progressKey]+=remaining;break;}
    const cost=augmentationGoldCost(state,def,level,upgrade);
    if(state.currencies.gold+1e-9<cost||challengeHundredLevelsRemaining(state)<=0){
      pair[progressKey]=needed;break;
    }
    remaining-=missing;
    pair[progressKey]=0;
    state.currencies.gold-=cost;
    if(upgrade)pair.upgradeLevel+=1;else pair.level+=1;
    challengeHundredLevelsConsume(state,1);
  }
}

function advanceAugmentations(state, seconds, context) {
  const s=state.systems.augmentations;
  if(!s.unlocked||seconds<=0)return;
  /*
   * V214 — chaque Augment et son Upgrade disposent de leur propre allocation
   * et progressent en parallèle. L'ancien activePair/trainUpgrade reste
   * uniquement comme migration pour les sauvegardes qui possèdent encore
   * l'allocation globale historique.
   */
  for(const def of IDLE_NGU_AUGMENTATIONS){
    const pair=s.data.pairs[def.id];
    advanceAugmentationTrackV214_(state,seconds,context,def,pair,false);
    advanceAugmentationTrackV214_(state,seconds,context,def,pair,true);
  }
  s.level=Object.values(s.data.pairs).reduce((sum,p)=>sum+p.level+p.upgradeLevel,0);
  s.tempLevel=s.level;
}

export function idleNguAugmentationMultiplier(raw) {
  const state = raw && raw.version === IDLE_NGU_META_VERSION ? raw : normalizeIdleNguState(raw);
  if(state.challenge?.active==="noAugmentations")return 1;
  let additive = 0;
  const pairs = state.systems.augmentations.data.pairs;
  for (const def of IDLE_NGU_AUGMENTATIONS) {
    const p = pairs[def.id];
    if (!p || p.level <= 0) continue;
    const augment = def.baseMultiplier * safePow(p.level, def.exponent);
    const upgrade = 1 + safePow(p.upgradeLevel, 2);
    additive += augment * upgrade;
  }
  const challengePower=challengePermanentBonuses(state).augmentationPowerMultiplier;
  /*
   * Norman (2026-09-18) : "il faut tout faire" (fidélité Evil/Sadistic).
   * Wiki NGU local, page "SADISTIC difficulty", section "Features" :
   * "For Augmentations, the total Attack/Defense multiplier has an
   * additional strength divider of 1 trillion (1e12), floored at 1. This
   * multiplier includes the contribution from NGU Augments." -- SADISTIC
   * uniquement (jamais mentionné sur la page "Evil difficulty"), et
   * séparé du diviseur de VITESSE de progression déjà appliqué plus haut
   * (augmentationSecondsForNextLevel) : celui-ci divise le résultat
   * (force du bonus), pas la vitesse pour l'obtenir.
   */
  const sadisticStrengthDivider = state.difficulty === "extreme" ? 1e12 : 1;
  return Math.max(1,1+(additive*nguFxV1(state).augments*challengePower)/sadisticStrengthDivider);
}

function beardTrackUnlocked(state, trackDef) {
  if (!trackDef) return false;
  const required = Math.max(0, int(trackDef.unlockTroll, 0));
  return int(state.challenge?.completions?.troll, 0) >= required;
}

function advanceBeardTrack(state, system, trackDef, track, seconds) {
  if (!system.active || !beardTrackUnlocked(state, trackDef) || seconds <= 0) return;

  const resource = trackDef.resource || "energy";
  const diggers = diggerBonuses(state);
  const diggerSpeed = resource === "magic"
    ? Math.max(1, num(diggers.magicBeard, 1))
    : Math.max(1, num(diggers.energyBeard, 1));
  /*
   * Correctif 2026-09-18 ("finir le câblage laissé ouvert" après 5a281bd) :
   * beardSpeedMultiplierFromItems (Beard Comb/Red Lipstick/A Shrunken
   * Voodoo Doll, wiki "Specials" -- idleNguBonuses(), calculé depuis PISTE
   * 2 mais jamais relu, voir son propre commentaire "câblage dans
   * beardBonusMultiplier laissé pour un futur passage"). beardBonusMultiplier()
   * (plus bas dans ce fichier) n'est PAS le bon point d'entrée : ce
   * multiplicateur y représente l'EFFET produit par le niveau de Beard déjà
   * acquis sur d'autres stats (Attack/Drop/Gold/...), jamais la VITESSE à
   * laquelle la Beard active elle-même progresse -- exactement ce que
   * "Beard Speed" boost sur le wiki. Le vrai point de consommation de la
   * vitesse de Beard est baseRate ci-dessous (advanceBeardTrack) : câblé ici.
   */
  const beardSpeedFromItems = Math.max(0, num(idleNguBonuses(state).beardSpeedMultiplierFromItems, 1));

  // V49 starts with NGU's first Beard slot only, therefore the
  // Beards_SameResource divisor is 1 until a later unlock adds more slots.
  const baseRate =
    Math.max(1, idleNguEffectiveResourceStatV1(state, resource, "bars")) *
    Math.sqrt(Math.max(1, idleNguEffectiveResourceStatV1(state, resource, "power"))) *
    diggerSpeed *
    beardSpeedFromItems /
    Math.max(1, num(trackDef.speedDivider, 1e8));

  if (baseRate <= 0) return;

  let level = Math.max(0, int(track.tempLevel, 0));
  let progress = clamp(track.progress, 0, 0.999999999);
  let remaining = Math.max(0, num(seconds, 0));

  // Finish the current level first. NGU caps Beard growth at 50 levels/s.
  const currentDuration = Math.max(1 / 50, (level + 1) / baseRate);
  const currentRemaining = (1 - progress) * currentDuration;
  if (remaining + 1e-12 < currentRemaining) {
    track.progress = progress + remaining / currentDuration;
    return;
  }

  remaining = Math.max(0, remaining - currentRemaining);
  level += 1;
  progress = 0;

  // Levels with (level + 1) <= baseRate / 50 are hard-capped at 50/s.
  const lastCappedLevel = Math.max(level - 1, Math.floor(baseRate / 50) - 1);
  if (lastCappedLevel >= level && remaining > 0) {
    const cappedCount = Math.min(
      lastCappedLevel - level + 1,
      Math.floor((remaining + 1e-12) * 50)
    );
    level += cappedCount;
    remaining = Math.max(0, remaining - cappedCount / 50);
  }

  // Past the hard cap, durations form an arithmetic series:
  // (level+1)/baseRate, (level+2)/baseRate, ...
  if (remaining > 0) {
    const firstCost = level + 1;
    const budget = remaining * baseRate;
    const discriminant = Math.max(
      0,
      (2 * firstCost - 1) ** 2 + 8 * budget
    );
    let full = Math.max(
      0,
      Math.floor((-(2 * firstCost - 1) + Math.sqrt(discriminant)) / 2)
    );
    const spent = full * (2 * firstCost + full - 1) / 2;
    if (full > 0) {
      level += full;
      remaining = Math.max(0, remaining - spent / baseRate);
    }

    const nextDuration = Math.max(1 / 50, (level + 1) / baseRate);
    progress = clamp(remaining / nextDuration, 0, 0.999999999);
  }

  const startingLevel = Math.max(0, int(track.tempLevel, 0));
  if (level > startingLevel) {
    const remaining = challengeHundredLevelsRemaining(state);
    if (level - startingLevel > remaining) {
      level = startingLevel + remaining;
      progress = 0;
    }
    challengeHundredLevelsConsume(state, level - startingLevel);
  }

  track.tempLevel = level;
  track.progress = progress;
}

/*
 * Wiki NGU (page "Hacks", section "Important Math") : "A Hack's time[1] to
 * level up" = BaseSpeedDivider × 1.0078^level × (level+1) / (R3 alloué ×
 * R3 power), en ticks à 50/s. Contrairement aux Beards, pas de palier
 * "fill" à 50 niveaux/s : la courbe ralentit en continu (facteur
 * géométrique 1.0078^level), donc chaque niveau suivant coûte strictement
 * plus de temps que le précédent — une boucle par niveau reste bornée
 * (plafonnée ici par sécurité, jamais atteinte en pratique vu la vitesse
 * de croissance des BaseSpeedDivider, de 1e8 à 1e13).
 *
 * Correctif 2026-09-18 : hackSpeedMultiplier (idleNguBonuses(), souhaits
 * "Hack Speed" du catalogue + tiers 8-10 de l'Infinity Cube) était calculé
 * mais jamais relu ici (voir le commentaire à sa déclaration) -- acheter le
 * souhait "I wish the Greasy Nerd took a shower" ou monter le cube au tier
 * 8+ n'accélérait donc jamais réellement les Hacks. Appliqué au débit
 * (throughput), comme wishSpeedMultiplier l'est déjà sur le temps requis
 * pour les Wishes ci-dessous (même sens : plus le multiplicateur est haut,
 * plus vite le niveau avance).
 */
function advanceHackTrack(state, system, trackDef, track, seconds) {
  if (!system.unlocked || seconds <= 0) return;
  const hackSpeedMultiplier = Math.max(1e-12, num(idleNguBonuses(state).hackSpeedMultiplier, 1));
  const throughput = Math.max(0, num(system.allocation.r3, 0)) * resourceThroughput(state, "r3") * hackSpeedMultiplier;
  if (throughput <= 0) return;

  let level = Math.max(0, int(track.level, 0));
  let progress = clamp(num(track.progress, 0), 0, 0.999999999);
  let remaining = Math.max(0, num(seconds, 0));
  const divider = Math.max(1, num(trackDef.speedDivider, 1e8));

  let iterations = 0;
  while (remaining > 1e-9 && iterations < 100000) {
    iterations++;
    const ticksNeeded = divider * Math.pow(1.0078, level) * (level + 1);
    const secondsNeeded = ticksNeeded / 50 / throughput;
    if (!Number.isFinite(secondsNeeded) || secondsNeeded <= 0) break;
    const remainingForLevel = (1 - progress) * secondsNeeded;
    if (remaining + 1e-12 < remainingForLevel) {
      progress += remaining / secondsNeeded;
      remaining = 0;
    } else {
      remaining -= remainingForLevel;
      level += 1;
      progress = 0;
    }
  }

  track.level = level;
  track.progress = progress;
}

/*
 * Wiki NGU (page "Wishes", section "Important Math") : "(EngPower x
 * EngAllocated x MagPower x MagAllocated x Res3Power x Res3Allocated)^0.17
 * / (SpeedDivider x (level+1))" — lu comme une VITESSE (le wiki précise
 * "doubling any single resource only increases wish speed by about
 * ~12.5%", cohérent avec 2^0.17 ≈ 1.125), donc le temps par niveau est
 * l'inverse : SpeedDivider x (level+1) / numérateur^0.17, plafonné en bas
 * à WISH_MIN_LEVEL_SECONDS (4h, cap dur du wiki — plus de ressources ne
 * réduit jamais sous ce plancher). "EngAllocated"/"MagAllocated"/
 * "Res3Allocated" correspondent à system.allocation[energy|magic|r3], déjà
 * modélisées ainsi pour toutes les autres pistes de ce fichier — la
 * ressource doit être allouée sur LES TROIS pour progresser ("you must
 * allocate some of all 3 resources to it"). Les souhaits "+X% Wish Speed"
 * (voir idle-wishes-v1.js, wishSpeedPct) accélèrent ce taux multiplicativement,
 * comme leur texte l'indique — appliqués APRÈS le plancher de 4h pour
 * rester fidèles au wiki ("hard cap... putting more resources into it will
 * not speed up the process", qui ne mentionne aucune exception pour les
 * boosts de vitesse eux-mêmes).
 *
 * Correctif 2026-09-18 : les tiers 8-10 de l'Infinity Cube ("Wish Speed",
 * IDLE_ADVENTURE_CUBE_TIERS_V1.wishSpeedPct, idle-adventure-v47.js)
 * n'étaient mergés nulle part -- calculé ici en plus du wishSpeedMultiplier
 * des Wishes, toujours SANS passer par idleNguBonuses() (design déjà en
 * place : cette boucle par niveau ne doit pas dépendre de tout
 * idleNguBonuses(), voir commentaire de sa propre déclaration) -- même
 * formule que idleNguBonuses().wishSpeedMultiplier, dupliquée volontairement
 * à petite échelle plutôt que centralisée, pour les mêmes raisons de coût.
 */
function advanceWishTrack(state, system, trackDef, track, seconds) {
  if (!system.unlocked || seconds <= 0) return;
  if (Math.max(0, int(track.level, 0)) >= Math.max(0, int(trackDef.levels, 0))) return;

  const engAlloc = Math.max(0, num(system.allocation.energy, 0));
  const magAlloc = Math.max(0, num(system.allocation.magic, 0));
  const r3Alloc = Math.max(0, num(system.allocation.r3, 0));
  if (engAlloc <= 0 || magAlloc <= 0 || r3Alloc <= 0) return;

  const engPower = Math.max(1, num(state.resources.energy?.power, 1));
  const magPower = Math.max(1, num(state.resources.magic?.power, 1));
  const r3Power = Math.max(1, num(state.resources.r3?.power, 1));
  const numerator = engPower * engAlloc * magPower * magAlloc * r3Power * r3Alloc;
  const divider = Math.max(1, num(trackDef.speedDivider, 1e15));
  const cubeWishSpeedPct = Math.max(0, num(idleAdventureCubeTierV1(state.adventure?.cube).wishSpeedPct, 0));
  const wishSpeedSetPct = Math.max(0, num(state.adventure?.setRewards?.wishSpeedPct, 0));
  const speedMultiplier = Math.max(1e-12, wishBonusesV1(system.data.tracks).wishSpeedMultiplier * (1 + cubeWishSpeedPct / 100) * (1 + wishSpeedSetPct));

  let level = Math.max(0, int(track.level, 0));
  let progress = clamp(num(track.progress, 0), 0, 0.999999999);
  let remaining = Math.max(0, num(seconds, 0));
  const maxLevel = Math.max(0, int(trackDef.levels, 0));

  let iterations = 0;
  while (remaining > 1e-9 && level < maxLevel && iterations < 100000) {
    iterations++;
    const rawSeconds = (divider * (level + 1)) / Math.pow(numerator, 0.17) / speedMultiplier;
    const secondsNeeded = Number.isFinite(rawSeconds) ? Math.max(WISH_MIN_LEVEL_SECONDS, rawSeconds) : Infinity;
    if (!Number.isFinite(secondsNeeded) || secondsNeeded <= 0) break;
    const remainingForLevel = (1 - progress) * secondsNeeded;
    if (remaining + 1e-12 < remainingForLevel) {
      progress += remaining / secondsNeeded;
      remaining = 0;
    } else {
      remaining -= remainingForLevel;
      level += 1;
      progress = 0;
    }
  }

  track.level = level;
  track.progress = level >= maxLevel ? 0 : progress;
}

function advanceTrackSystem(state, def, seconds) {
  const s = state.systems[def.id];
  if (!s.unlocked || seconds <= 0) return;
  const tracks = IDLE_NGU_TRACKS[def.id] || [];
  if (!tracks.length) return;
  const active = s.data.activeTrack || tracks[0].id;
  const trackDef = tracks.find(x => x.id === active) || tracks[0];
  const t = s.data.tracks[active];
  if (!t) return;

  if (def.id === "beards") {
    advanceBeardTrack(state, s, trackDef, t, seconds);
    s.level = Object.values(s.data.tracks).reduce((sum, x) => sum + x.level, 0);
    s.tempLevel = Object.values(s.data.tracks).reduce((sum, x) => sum + x.tempLevel, 0);
    s.permanentLevel = Object.values(s.data.tracks).reduce((sum, x) => sum + x.permanentLevel, 0);
    return;
  }

  if (def.id === "hacks") {
    advanceHackTrack(state, s, trackDef, t, seconds);
    s.level = Object.values(s.data.tracks).reduce((sum, x) => sum + x.level, 0);
    return;
  }

  if (def.id === "wishes") {
    advanceWishTrack(state, s, trackDef, t, seconds);
    s.level = Object.values(s.data.tracks).reduce((sum, x) => sum + x.level, 0);
    return;
  }

  let throughput = 0;
  for (const resource of def.resources) {
    const alloc = Math.max(0, num(s.allocation[resource], 0));
    /*
     * Wiki NGU (page "Energy", section Uses > Advanced Training : "Energy
     * power affects it only by a Sqrt(Energy Power)" ; page "Advanced
     * Training" : "your Energy Power is only as effective as it's square
     * root... Energy cap is not affected and works at full effectiveness")
     * — l'Advanced Training est la SEULE piste où la Puissance compte en
     * racine carrée ; Wandoos/NGU/Wishes gardent leur Puissance à taux
     * plein (non touché ici).
     */
    const effPower = idleNguEffectiveResourceStatV1(state, resource, "power");
    const effBars = idleNguEffectiveResourceStatV1(state, resource, "bars");
    const power = def.id === "advancedTraining"
      ? Math.sqrt(Math.max(1, effPower))
      : Math.max(1, effPower);
    throughput += alloc * power * Math.max(1, effBars);
  }
  if (throughput <= 0) return;

  const divisor =
    def.id === "advancedTraining" ? 25000 :
    def.id === "ngu" ? 300000 :
    100000;

  /*
   * Norman (2026-09-18) : "il faut tout faire" (équipement des 17 zones
   * Evil/Sadistic). Wiki NGU : "Meta (set)" +20% NGU Speed, "Back To
   * School (set)" +15% NGU Speed -- setRewards.nguSpeedPct
   * (idle-adventure-v47.js) est le pont déjà utilisé pour les autres
   * bonus de set. Ce champ ne couvre QUE ce pont-là.
   *
   * Correctif 2026-09-18 (suite) : le multiplicateur "NGU Speed" plus large
   * (challenges/beard/digger/attack-NGU/objets, déjà calculé dans
   * idleNguBonuses().nguSpeedMultiplier) restait un gap préexistant jamais
   * branché dans cette boucle d'avancement -- câblé maintenant, en plus de
   * nguSpeedSetMultiplier ci-dessus (deux sources distinctes du même wiki,
   * multipliées ensemble comme le reste des chaînes de multiplicateurs de
   * ce fichier). Uniquement sur def.id === "ngu" : ce champ ne concerne que
   * cette piste précise (Attack/Defense/Adventure/Drop/Respawn/Experience/
   * PP/Quest/Daycare via NGU), jamais Beards/Hacks/Wishes/Wandoos/Advanced
   * Training qui ont chacun leur propre vitesse déjà câblée ailleurs.
   */
  const nguSpeedSetMultiplier = def.id === "ngu" ? 1 + Math.max(0, num(state.adventure?.setRewards?.nguSpeedPct, 0)) : 1;
  const nguSpeedBonusMultiplier = def.id === "ngu" ? Math.max(0, num(idleNguBonuses(state).nguSpeedMultiplier, 1)) : 1;
  t.progress += (throughput / divisor) * seconds * nguSpeedSetMultiplier * nguSpeedBonusMultiplier;
  let gain = Math.floor(t.progress);
  if (gain > 0) {
    t.progress -= gain;
    if (def.kind === "run" || def.kind === "hybrid") t.tempLevel += gain;
    else t.level += gain;
  }

  s.level = Object.values(s.data.tracks).reduce((sum, x) => sum + x.level, 0);
  s.tempLevel = Object.values(s.data.tracks).reduce((sum, x) => sum + x.tempLevel, 0);
  s.permanentLevel = Object.values(s.data.tracks).reduce((sum, x) => sum + x.permanentLevel, 0);
}

/*
 * Fidélité wiki (2026-09-16, audit) : ngu-time-machine.md — "Cost for
 * level N-1->N is N times the level 0->1 cost (linear scaling)". La
 * base (0->1, à 1 Energy/Magic Power + 1000 de cap alloué) vaut
 * 1 000 000 s : alloc×power=1000 à ce point de référence, donc
 * base = 1e9/(alloc×power) redonne bien 1 000 000 s. L'ancienne formule
 * (1000/(alloc×power), sans dépendance au niveau) rendait chaque niveau
 * quasi instantané (~1s), une régression bien plus grave que le simple
 * "pas de scaling par niveau" repéré par l'audit.
 */
function tmLevelSeconds(state, resource, targetLevel) {
  const alloc = Math.max(0, num(state.systems.timeMachine.allocation[resource], 0));
  if (alloc <= 0) return Infinity;
  const power = Math.max(1, idleNguEffectiveResourceStatV1(state, resource, "power"));
  const n = Math.max(1, targetLevel);
  const difficultyDivider = idleNguDifficultySpeedDividerV1(state, "timeMachine");
  return (1e9 * difficultyDivider / Math.max(1e-12, alloc * power)) * n;
}

/*
 * Fidélité wiki : "Level 0->1 for EITHER track: 5,000,000 Gold... Requires
 * Energy and Magic allocation, plus Gold, to level up." Aucun coût en Or
 * n'était jamais prélevé auparavant — la barre se remplissait, puis le
 * niveau montait gratuitement.
 */
function tmLevelGoldCost(targetLevel) {
  return 5000000 * Math.max(1, targetLevel);
}

function advanceTimeMachine(state, seconds) {
  const s = state.systems.timeMachine;
  if (!s.unlocked || seconds <= 0) return;
  const d = s.data;

  /*
   * Le coût grandissant avec le niveau (temps ET Or), on ne peut plus
   * calculer le nombre de niveaux gagnés en une division : chaque palier
   * doit être franchi un par un, et un palier reste bloqué si l'Or
   * disponible est insuffisant au moment où la barre se remplit (la barre
   * plafonne alors pleine, en attente d'Or — jamais une perte de
   * progression). Le nombre d'itérations reste naturellement borné (le
   * coût croît linéairement, donc le temps cumulé croît en N²) ; une
   * limite défensive évite malgré tout toute boucle non bornée.
   */
  let guard = 0;
  let energyStep = tmLevelSeconds(state, "energy", d.speedLevel + 1);
  if (Number.isFinite(energyStep)) {
    d.speedProgress += seconds;
    while (d.speedProgress >= energyStep && guard < 100000) {
      guard++;
      const cost = tmLevelGoldCost(d.speedLevel + 1);
      if (state.currencies.gold + 1e-9 < cost || challengeHundredLevelsRemaining(state) <= 0) { d.speedProgress = energyStep; break; }
      state.currencies.gold -= cost;
      d.speedProgress -= energyStep;
      d.speedLevel += 1;
      challengeHundredLevelsConsume(state, 1);
      energyStep = tmLevelSeconds(state, "energy", d.speedLevel + 1);
      if (!Number.isFinite(energyStep)) break;
    }
  }

  if (state.systems.bloodMagic.unlocked) {
    guard = 0;
    let magicStep = tmLevelSeconds(state, "magic", d.goldLevel + 1);
    if (Number.isFinite(magicStep)) {
      d.goldProgress += seconds;
      while (d.goldProgress >= magicStep && guard < 100000) {
        guard++;
        const cost = tmLevelGoldCost(d.goldLevel + 1);
        if (state.currencies.gold + 1e-9 < cost || challengeHundredLevelsRemaining(state) <= 0) { d.goldProgress = magicStep; break; }
        state.currencies.gold -= cost;
        d.goldProgress -= magicStep;
        d.goldLevel += 1;
        challengeHundredLevelsConsume(state, 1);
        magicStep = tmLevelSeconds(state, "magic", d.goldLevel + 1);
        if (!Number.isFinite(magicStep)) break;
      }
    }
  }

  const gps = idleNguTimeMachineGoldPerSecond(state);
  const gain = gps * seconds;
  state.currencies.gold += gain;
  d.producedThisRun += gain;
  s.level = Math.floor(d.speedLevel + d.goldLevel);
  s.tempLevel = s.level;
}

export function idleNguTimeMachineGrossGoldPerSecond(raw) {
  const state = raw && raw.version === IDLE_NGU_META_VERSION ? raw : normalizeIdleNguState(raw);
  const d = state.systems.timeMachine.data;
  if (!state.systems.timeMachine.unlocked) return 0;
  if(state.challenge?.active==="noTimeMachine")return 0;

  const goldPerBar = Math.max(0, num(d.bestGoldThisRun, 0));
  if (goldPerBar <= 0) return 0;

  // Wiki NGU (page "Broken Time Machine", section "Gold multipliers") :
  // "Highest Boss - 27 = Gold Multiplier (max of 274x)" — un multiplicateur
  // linéaire (boss-27), plafonné à 274x (atteint au boss 301), pas la
  // formule 1+boss/10 utilisée précédemment (qui sous-évaluait ce bonus
  // d'un facteur ~7 dès les premiers boss et ne plafonnait jamais).
  const highestBossMultiplier = Math.max(1, Math.min(274, num(d.highestBossEver, 0) - 27));
  const speedLevel = Math.max(0, num(d.speedLevel, 0));
  const barsPerSecond = speedLevel < 50 ? Math.min(50, 1 + speedLevel) : 50 * (1 + (speedLevel - 49));
  const goldMultiplier = 1 + Math.max(0, num(d.goldLevel, 0));
  const counterfeit = Math.max(1, num(state.systems.bloodMagic.data.spells.counterfeitGold, 1));

  const beardGold = beardBonusMultiplier(state, "gold");
  const challengeGold=challengePermanentBonuses(state).timeMachineGoldMultiplier;
  return goldPerBar * highestBossMultiplier * barsPerSecond * goldMultiplier * counterfeit * beardGold * challengeGold * nguFxV1(state).timeMachine;
}

export function idleNguTimeMachineGoldPerSecond(raw) {
  const state = raw && raw.version === IDLE_NGU_META_VERSION ? raw : normalizeIdleNguState(raw);
  return Math.max(0,idleNguTimeMachineGrossGoldPerSecond(state)-diggerDrainTotal(state));
}

function ritualUnlocked(ritual, context) {
  if (!ritual.unlockFlag) return true;
  return Boolean(context.unlockFlags?.[ritual.unlockFlag]);
}

function advanceBloodMagic(state, seconds, context) {
  const s = state.systems.bloodMagic;
  if (!s.unlocked || seconds <= 0) return;
  const ritual = IDLE_NGU_BLOOD_RITUALS.find(r => r.id === s.data.activeRitual) || IDLE_NGU_BLOOD_RITUALS[0];
  if (!ritualUnlocked(ritual, context)) return;
  const rs = s.data.rituals[ritual.id];

  const magic = Math.max(0, num(s.allocation.magic, 0));
  const power = Math.max(1, idleNguEffectiveResourceStatV1(state, "magic", "power"));
  if (magic <= 0) return;

  const difficultyDivider = idleNguDifficultySpeedDividerV1(state, "bloodMagic");
  /*
   * Norman (2026-09-18) : "il faut tout faire" (équipement des 17 zones
   * Evil/Sadistic). Wiki NGU en direct, page "Dutch (set)" (The Nether
   * Regions) : "Bonus for Completion: +25% Faster Blood Magic Rituals!"
   * -- même pont setRewards.* que les autres bonus de set câblés
   * ci-dessus, ici sur le temps par complétion (diviseur, jamais un
   * multiplicateur composé avec difficultyDivider).
   */
  const dutchSetMultiplier = 1 + Math.max(0, num(state.adventure?.setRewards?.bloodMagicSpeedPct, 0));
  const secondsPerCompletion = ritual.baseSeconds * 1000 * difficultyDivider / Math.max(1e-12, magic * power) / dutchSetMultiplier;
  rs.progress += seconds;
  let completions = Math.floor(rs.progress / secondsPerCompletion);
  if (completions <= 0) return;

  const affordable = Math.floor(state.currencies.gold / ritual.gold);
  completions = Math.min(completions, affordable, 1000000, challengeHundredLevelsRemaining(state));
  if (completions <= 0) return;

  rs.progress -= completions * secondsPerCompletion;
  rs.completions += completions;
  rs.level += completions;
  state.currencies.gold -= completions * ritual.gold;
  state.currencies.blood += completions * ritual.blood;
  challengeHundredLevelsConsume(state, completions);
  s.level = Object.values(s.data.rituals).reduce((sum, x) => sum + x.level, 0);
  s.tempLevel = s.level;
}

/*
 * Sang minimum par sort (wiki NGU, page Blood Magic, colonne "Minimum
 * Blood Required", consultée le 2026-09-14) — jamais vérifié avant ce
 * round, seul un `blood <= 0` générique était appliqué.
 */
const BLOOD_SPELL_MINIMUMS_V1 = Object.freeze({
  numberBoost: 1,
  ironPill: 100,
  bloodSpaghetti: 10000,
  counterfeitGold: 1000000
});

/*
 * Sources (wiki NGU, pages Blood Magic et NUMBER, consultées le
 * 2026-09-14) :
 * - Blood NUMBER Boost : page Blood Magic — "Each blood adds 1 to the
 *   NUMBER multiplier" ; confirmé par la page NUMBER, table des
 *   facteurs de Rebirth — "blood magic bonus: the amount of blood cast
 *   into the NUMBER spell this rebirth + 1." C'est donc un cumul
 *   ADDITIF du sang dépensé sur ce sort durant le Rebirth en cours, pas
 *   une composition multiplicative lancer après lancer. L'ancienne
 *   formule (1 + blood^0.2/10) n'avait aucune source wiki et sous-
 *   évaluait massivement le bonus réel dès que le sang dépensé dépasse
 *   quelques unités.
 * - Blood Spaghetti (Drop Chance) : formule wiki exacte
 *   (log2(Blood/10 000) + 1)%, où Blood est le total de sang sacrifié à
 *   CE sort durant ce Rebirth (donc aussi cumulatif, pas juste le
 *   dernier lancer). L'ancienne formule (1 + log10(1+blood)/20) était
 *   inventée, ET son résultat n'était même jamais lu par
 *   dropMultiplier plus bas dans ce fichier — un vrai bug "effet
 *   calculé mais jamais appliqué", câblé pour la première fois ici.
 * - Counterfeit Gold (bonus GPS) : formule wiki exacte
 *   (log2(Blood/1 000 000) + 1)² %, même principe cumulatif. L'ancienne
 *   formule (1 + log10(1+blood)/10) était inventée (log10 au lieu de
 *   log2, pas de mise au carré, mauvais diviseur).
 * - Iron Pill : formule Blood^0.25 déjà correcte dans son exposant,
 *   mais la conversion "/100" en bonus multiplicatif sur
 *   adventureMultiplier est une décision d'architecture antérieure à
 *   tout audit wiki (présente depuis la toute première version du
 *   fichier, commit aa744cd4) — le wiki décrit un gain de stat ABSOLU
 *   (Power/Toughness += Blood^0.25), pas un pourcentage. La corriger
 *   proprement demanderait de revoir le pipeline de calcul des stats
 *   d'Aventure (hors scope meta-progression de ce round, et hors des
 *   fichiers Adventure déjà couverts par des rounds précédents) ;
 *   laissée telle quelle, documentée honnêtement plutôt que remplacée
 *   par une autre conversion tout aussi inventée.
 */
function castBloodSpell(state, spell) {
  const minimum = BLOOD_SPELL_MINIMUMS_V1[spell];
  if (minimum === undefined) throw new Error("SORT_SANG_INVALIDE");
  const blood = Math.floor(state.currencies.blood);
  if (blood < minimum) throw new Error("SANG_INSUFFISANT");
  const spells = state.systems.bloodMagic.data.spells;

  if (spell === "numberBoost") {
    spells.numberBoost = Math.max(1, spells.numberBoost) + blood;
    state.currencies.blood = 0;
    return { spell, spent: blood, multiplier: spells.numberBoost };
  }
  if (spell === "ironPill") {
    const gain = Math.pow(blood, 0.25) / 100;
    spells.ironPill += gain;
    state.bonuses.ironPill += gain;
    state.currencies.blood = 0;
    return { spell, spent: blood, gain };
  }
  if (spell === "counterfeitGold") {
    spells.counterfeitGoldBloodSpent = Math.max(0, num(spells.counterfeitGoldBloodSpent, 0)) + blood;
    const pct = Math.pow(Math.log2(spells.counterfeitGoldBloodSpent / 1000000) + 1, 2);
    spells.counterfeitGold = Math.max(1, 1 + pct / 100);
    state.currencies.blood = 0;
    return { spell, spent: blood, multiplier: spells.counterfeitGold };
  }
  if (spell === "bloodSpaghetti") {
    spells.bloodSpaghettiBloodSpent = Math.max(0, num(spells.bloodSpaghettiBloodSpent, 0)) + blood;
    const pct = Math.log2(spells.bloodSpaghettiBloodSpent / 10000) + 1;
    spells.bloodSpaghetti = Math.max(1, 1 + pct / 100);
    state.currencies.blood = 0;
    return { spell, spent: blood, multiplier: spells.bloodSpaghetti };
  }
  throw new Error("SORT_SANG_INVALIDE");
}

function advanceMoneyPitAndDaily(state, now) {
  const pit = state.systems.moneyPit;
  if (pit.unlocked && state.systems.dailySpin) state.systems.dailySpin.unlocked = true;
  const spin = state.systems.dailySpin;
  if (spin.unlocked && !spin.data.readyAt) spin.data.readyAt = now;
}

function yggMaxTier(state) {
  return int(state.challenge.completions.troll,0)>=3 ? 24 : 10;
}

function yggFreeResource(state, resource) {
  return Math.max(0,num(state.resources[resource]?.current,0));
}

function yggTierUpgradeCost(fruit, targetTier) {
  const t=Math.max(1,int(targetTier,1));
  return Math.max(1,int(fruit.tierCost,1)*t*t);
}

function upgradeYggFruit(state, fruitId) {
  const s=state.systems.yggdrasil;
  if(!s?.unlocked)throw new Error("SYSTEME_VERROUILLE");
  const def=IDLE_NGU_YGG_FRUITS.find(x=>x.id===fruitId);
  const f=s.data.fruits[fruitId];
  if(!def||!f)throw new Error("FRUIT_INVALIDE");
  const maxTier=yggMaxTier(state);
  if(f.tier>=maxTier)throw new Error("FRUIT_TIER_MAX");
  const target=f.tier+1;
  const cost=yggTierUpgradeCost(def,target);
  if(state.currencies.seeds<cost)throw new Error("GRAINES_INSUFFISANTES");
  state.currencies.seeds-=cost;
  f.tier=target;
  return {fruit:fruitId,tier:f.tier,cost,maxTier};
}

function activateYggFruit(state, fruitId) {
  const s=state.systems.yggdrasil;
  if(!s?.unlocked)throw new Error("SYSTEME_VERROUILLE");
  const def=IDLE_NGU_YGG_FRUITS.find(x=>x.id===fruitId);
  const f=s.data.fruits[fruitId];
  if(!def||!f)throw new Error("FRUIT_INVALIDE");
  if(f.tier<=0)throw new Error("FRUIT_VERROUILLE");
  if(f.active)return {fruit:fruitId,active:true};
  if(yggFreeResource(state,def.resource)<def.activationCost)throw new Error("RESSOURCE_YGG_INSUFFISANTE");
  state.resources[def.resource].current=Math.max(
    0,
    num(state.resources[def.resource].current,0)-def.activationCost
  );
  s.data.reserved[def.resource]=0;
  f.active=true;
  f.growthHours=0;
  return {
    fruit:fruitId,
    active:true,
    cost:def.activationCost,
    resource:def.resource,
    remaining:state.resources[def.resource].current
  };
}

function releaseYggFruit(state,def,f){
  // The activation cost was spent from idle Energy/Magic. Eating/harvesting
  // never refunds it; regeneration is the only way to recover that resource.
  state.systems.yggdrasil.data.reserved[def.resource]=0;
  f.active=false;
  f.growthHours=0;
}

/*
 * Wiki NGU, page Yggdrasil, section "Nerdy Formulas" > "Seed Gains"
 * (consultée le 2026-09-14) : ⌈⌈T^1.5⌉ x Poop x (1+EquipSeedGain) x
 * NGUYgg x QuirkSeeds x PerkSeeds x BaseSeedReward x FirstHarvest x
 * HarvestBonus⌉. Poop, EquipSeedGain et NGUYgg n'ont aucune implémentation
 * dans SOREAL IDLE (pas de système Poop, pas d'équipement "Seed Gain",
 * pas de piste NGU Yggdrasil) et restent donc à 1/0 par défaut — gap
 * honnête, pas une valeur inventée. PerkSeeds (Perk "I Want Your Seeds
 * ;)") et QuirkSeeds (Quirk "The Beast's Seed ;)") existent bel et bien
 * dans les catalogues idle-perks-v1.js / idle-quirks-v1.js et étaient
 * déjà calculés par idleNguBonuses() (seedYieldMultiplierFromPerks/
 * Quirks) mais jamais lus par cette fonction — un bonus réel, acheté,
 * jamais appliqué. Idem pour FirstHarvest (Perk "The First Harvest's
 * The Best") : le flag f.firstHarvestThisRun était déjà suivi (mis à
 * false après usage, remis à true au Rebirth) mais son bonus n'était
 * jamais consommé. Les deux sont câblés ici pour la première fois.
 */
function yggSeedGain(def,tier,harvest,seedYieldMultiplier=1,firstHarvestMultiplier=1){
  const unit=Math.ceil(Math.pow(Math.max(1,tier),1.5));
  return Math.ceil(unit*Math.max(1,def.baseSeeds)*(harvest?2:1)*seedYieldMultiplier*firstHarvestMultiplier);
}

function useYggFruit(state,fruitId,mode="eat"){
  const s=state.systems.yggdrasil;
  if(!s?.unlocked)throw new Error("SYSTEME_VERROUILLE");
  const def=IDLE_NGU_YGG_FRUITS.find(x=>x.id===fruitId);
  const f=s.data.fruits[fruitId];
  if(!def||!f)throw new Error("FRUIT_INVALIDE");
  if(!f.active||f.growthHours<1)throw new Error("FRUIT_PAS_PRET");
  const grownTier=Math.max(1,Math.min(f.tier,Math.floor(f.growthHours)));
  const harvest=mode==="harvest";
  const perkBonuses=perkBonusesV1(state.systems.perks?.data?.levels);
  const quirkBonuses=quirkBonusesV1(state.systems.quirks?.data?.levels);
  const seedYieldMultiplier=perkBonuses.seedYieldMultiplier*quirkBonuses.seedYieldMultiplier*nguFxV1(state).yggdrasil;
  const firstHarvestMultiplier=f.firstHarvestThisRun?perkBonuses.firstHarvestMultiplier:1;
  const seedGain=yggSeedGain(def,grownTier,harvest||def.id==="pomegranate",seedYieldMultiplier,firstHarvestMultiplier);
  state.currencies.seeds+=seedGain;
  const factor=Math.ceil(Math.pow(grownTier,1.5));
  const result={fruit:fruitId,mode:harvest?"harvest":"eat",tier:grownTier,seeds:seedGain};

  if(!harvest){
    if(def.effect==="gold"){
      const gold=Math.max(0,idleNguTimeMachineGrossGoldPerSecond(state))*factor*30*60;
      state.currencies.gold+=gold;
      result.gold=gold;
    }else if(def.effect==="powerAlpha"){
      s.data.runPowerAlphaValue+=factor;
      result.runPowerAlphaValue=s.data.runPowerAlphaValue;
    }else if(def.effect==="adventure"){
      const baseToughness=Math.max(1,num(state.adventure?.permanent?.adventureToughness,1));
      const gain=Math.floor(factor*Math.pow(baseToughness,0.2));
      s.data.permanent.adventurePower+=gain;
      s.data.permanent.adventureToughness+=gain;
      s.data.permanent.adventureHp+=gain*3;
      s.data.permanent.adventureRegen+=gain*0.03;
      result.adventureGain=gain;
    }else if(def.effect==="experience"){
      const exp=Math.max(1,factor*10);
      state.currencies.experience+=exp;
      result.experience=exp;
    }else if(def.effect==="luck"){
      const drop=factor*0.01;
      s.data.permanent.luckDropPct+=drop;
      result.dropPct=drop;
    }else if(def.effect==="powerBeta"){
      s.data.permanent.powerBetaValue+=factor;
      s.data.runPowerBetaActive=true;
      result.powerBeta=s.data.permanent.powerBetaValue;
    }else if(def.effect==="numbers"){
      s.data.permanent.numbersValue+=factor;
      s.data.runNumbersActive=true;
      result.numbers=s.data.permanent.numbersValue;
    }else if(def.effect==="ap"){
      const ap=factor;
      state.currencies.ap+=ap;
      result.ap=ap;
    }else if(def.effect==="pp"){
      const pp=Math.max(1,Math.floor(factor/2));
      state.currencies.pp+=pp;
      result.pp=pp;
    }
  }
  f.firstHarvestThisRun=false;
  releaseYggFruit(state,def,f);
  return result;
}

function advanceYggdrasil(state,seconds){
  const s=state.systems.yggdrasil;
  if(!s?.unlocked||seconds<=0)return;
  for(const def of IDLE_NGU_YGG_FRUITS){
    const f=s.data.fruits[def.id];
    if(!f.active||f.tier<=0)continue;
    f.growthHours=Math.min(f.tier,Math.max(0,num(f.growthHours,0))+seconds/3600);
  }
}

/*
 * Wiki NGU (page Gold Diggers, section "Global Digger Bonus", consultée
 * le 2026-09-14) : formule strictement ADDITIVE —
 * "0.05%*(Total Digger Levels) + (No TM Challenge Bonus) + (Party (set)
 * Bonus)". Le bonus du Défi "No Time Machine" (+5 points de % dès le
 * palier 1) doit s'ADDITIONNER au pourcentage de niveaux avant le
 * +100% final, pas se MULTIPLIER par-dessus. L'ancienne formule
 * calculait (1+levelPct/100)*1.05, ce qui composait les deux termes au
 * lieu de les additionner comme l'exige le wiki — un écart croissant
 * avec le nombre de niveaux de Diggers.
 *
 * Norman (2026-09-18) : "il faut tout faire" (équipement des 17 zones
 * Evil/Sadistic). Wiki NGU en direct, page "Party (set)" (Interdimensional
 * Party) : "Bonus for Completion: +5% Total Diggers Level Bonus" -- le
 * "Party (set) Bonus" mentionné ci-dessus par la page Gold Diggers est
 * maintenant câblable (setRewards.diggerGlobalBonusPct, idle-adventure-
 * v47.js), le gap précédemment honnête est comblé.
 */
function diggerGlobalBonus(state){
  const s=state.systems.diggers;
  if(!s?.unlocked)return 1;
  const total=Object.values(s.data.diggers).reduce((a,d)=>a+Math.max(0,int(d.maxLevel,0)),0);
  const levelPct=total<=500 ? total*0.05 : 25+0.05*Math.pow(total-500,0.7);
  const challengePct=(challengePermanentBonuses(state).diggerGlobalMultiplier-1)*100;
  const partySetPct=Math.max(0,num(state.adventure?.setRewards?.diggerGlobalBonusPct,0));
  return 1+(levelPct+challengePct+partySetPct)/100;
}

function diggerDefinition(id){
  return IDLE_NGU_DIGGERS.find(x=>x.id===id);
}

function diggerCostAtLevel(def,level){
  const target=Math.max(1,int(level,1));
  return def.unlockCost*Math.pow(def.growth,target-1);
}

function diggerDrainAtLevel(def,level){
  const l=Math.max(0,int(level,0));
  if(l<=0)return 0;
  return def.drain*Math.pow(def.growth,l-1);
}

function diggerDrainTotal(state){
  const s=state.systems.diggers;
  if(!s?.unlocked)return 0;
  let total=0;
  for(const def of IDLE_NGU_DIGGERS){
    const d=s.data.diggers[def.id];
    if(d.active&&d.runLevel>0)total+=diggerDrainAtLevel(def,d.runLevel);
  }
  return total;
}

function diggerActiveCount(state){
  const s=state.systems.diggers;
  if(!s?.unlocked)return 0;
  return Object.values(s.data.diggers).filter(d=>d.active&&d.runLevel>0).length;
}

function availableDiggerSlots(state){
  const extra=Math.max(0,int(state.adventure?.setRewards?.diggerSlot,0));
  const challengeExtra=challengePermanentBonuses(state).diggerSlotBonus;
  return Math.max(1,int(state.systems.diggers?.data?.slots,1)+extra+challengeExtra);
}

function upgradeDigger(state,id){
  const s=state.systems.diggers;
  if(!s?.unlocked)throw new Error("SYSTEME_VERROUILLE");
  const def=diggerDefinition(id),d=s.data.diggers[id];
  if(!def||!d)throw new Error("DIGGER_INVALIDE");
  if(d.maxLevel>=def.cap)throw new Error("DIGGER_MAX");
  const cost=diggerCostAtLevel(def,d.maxLevel+1);
  if(state.currencies.gold<cost)throw new Error("OR_INSUFFISANT");
  state.currencies.gold-=cost;
  d.maxLevel+=1;
  if(d.runLevel===0)d.runLevel=1;
  return {digger:id,maxLevel:d.maxLevel,cost};
}

function setDiggerLevel(state,id,level){
  const s=state.systems.diggers;
  if(!s?.unlocked)throw new Error("SYSTEME_VERROUILLE");
  const def=diggerDefinition(id),d=s.data.diggers[id];
  if(!def||!d)throw new Error("DIGGER_INVALIDE");
  const target=clamp(int(level,0),0,d.maxLevel);
  const wasActive=d.active;
  d.runLevel=target;
  if(target===0)d.active=false;
  if(wasActive&&target>0){
    const gross=idleNguTimeMachineGrossGoldPerSecond(state);
    if(diggerDrainTotal(state)>gross){d.active=false;throw new Error("GPS_INSUFFISANT");}
  }
  return {digger:id,runLevel:d.runLevel,active:d.active};
}

function toggleDigger(state,id,active){
  const s=state.systems.diggers;
  if(!s?.unlocked)throw new Error("SYSTEME_VERROUILLE");
  const def=diggerDefinition(id),d=s.data.diggers[id];
  if(!def||!d)throw new Error("DIGGER_INVALIDE");
  const target=active===undefined?!d.active:Boolean(active);
  if(!target){d.active=false;return{digger:id,active:false};}
  if(d.maxLevel<=0||d.runLevel<=0)throw new Error("DIGGER_NON_ACHETE");
  if(!d.active&&diggerActiveCount(state)>=availableDiggerSlots(state))throw new Error("AUCUN_SLOT_DIGGER");
  d.active=true;
  const gross=idleNguTimeMachineGrossGoldPerSecond(state);
  if(diggerDrainTotal(state)>gross){d.active=false;throw new Error("GPS_INSUFFISANT");}
  return{digger:id,active:true,runLevel:d.runLevel};
}

function diggerBonuses(state){
  const s=state.systems.diggers;
  const out={drop:1,wandoos:1,stats:1,adventure:1,energyNgu:1,magicNgu:1,energyBeard:1,magicBeard:1,pp:1,daycare:1,blood:1,experience:1};
  if(!s?.unlocked)return out;
  const g=diggerGlobalBonus(state);
  for(const def of IDLE_NGU_DIGGERS){
    const d=s.data.diggers[def.id];
    if(!d.active||d.runLevel<=0)continue;
    const L=d.runLevel;
    let pct=100;
    if(def.id==="drop"||def.id==="wandoos"||def.id==="blood")pct=150+L;
    else if(def.id==="stats")pct=200+Math.pow(L,3);
    else if(def.id==="adventure")pct=110+0.5*L;
    else if(def.id==="energyNgu"||def.id==="magicNgu"||def.id==="energyBeard"||def.id==="magicBeard")pct=120+L;
    else if(def.id==="pp")pct=110+L;
    else if(def.id==="daycare")pct=105+0.1*L;
    else if(def.id==="experience")pct=105+0.5*L;
    out[def.effect]=Math.max(1,pct/100*g);
  }
  return out;
}

function advanceLateSystems(state, seconds, context, now) {
  const tower = state.systems.tower;
  if (tower.unlocked && tower.active) {
    // Même base-10 que idleAdventureCombatStatsV1 (Norman, 2026-09-18, capture "Adventure Stats Breakdown").
    const power = Math.max(10, num(context.adventurePower, 10));
    tower.data.floor = Math.max(0, int(tower.data.floor, 0));
    tower.data.killProgress = Math.max(0, num(tower.data.killProgress, 0)) + seconds * Math.min(1, Math.pow(power / Math.pow(1.05, tower.data.floor), 0.2) / 20);
    const kills = Math.floor(tower.data.killProgress);
    if (kills > 0) {
      tower.data.killProgress -= kills;
      tower.data.kills = Math.max(0, int(tower.data.kills, 0)) + kills;
      /*
       * Wiki NGU (page ITOPOD, section "Drops") : "(200 + Floor) PPP per
       * dude killed" en difficulté Normal — pas un flat 250 (qui n'est
       * exact qu'au floor 50 pile et s'écarte de plus en plus au-delà).
       *
       * Norman (2026-09-18) : "il faut tout faire" (fidélité Evil/
       * Sadistic). Wiki pages "Evil difficulty"/"SADISTIC difficulty",
       * section "Differences" > "Adventure" : "ITOPOD base pp progress is
       * (700 + floor) instead of (200 + floor)" (Evil) ; "(2000 + floor)
       * instead of Evil's (700 + floor)" (SADISTIC) -- seule la base
       * change (200/700/2000), jamais le terme "+ floor".
       */
      const itopodPpBase = state.difficulty === "extreme" ? 2000 : state.difficulty === "difficile" ? 700 : 200;
      /*
       * Norman (2026-09-18) : "il faut tout faire" (équipement des 17
       * zones Evil/Sadistic). Wiki NGU en direct, page "Pretty Pink
       * Princess (set)" : "Bonus for Completion: Gain 10% more PP" --
       * setRewards.itopodPpPct (idle-adventure-v47.js) est le pont
       * cross-système déjà utilisé pour setRewards.diggerSlot ci-dessus
       * (availableDiggerSlots), jamais une nouvelle mécanique inventée.
       */
      const itopodPpSetMultiplier = 1 + Math.max(0, num(state.adventure?.setRewards?.itopodPpPct, 0));
      tower.data.ppProgress = Math.max(0, num(tower.data.ppProgress, 0)) + kills * (itopodPpBase + tower.data.floor) * itopodPpSetMultiplier * nguFxV1(state).pp;
      /*
       * Audit 2026-09-16 : `tower.data.floor += Math.floor(kills / 10)`
       * perdait le report entre deux ticks — en jeu normal (tick fréquent,
       * quasi toujours 0 ou 1 kill par appel), Math.floor(1/10) vaut
       * TOUJOURS 0, donc l'étage ne montait jamais tant qu'un seul gros
       * rattrapage (hors-ligne) n'accumulait pas 10 kills d'un coup dans
       * UN SEUL appel — contraire au wiki ("every 10 enemies killed
       * advances 1 floor"). Dériver l'étage du total cumulé de kills
       * élimine toute perte de report, quel que soit le découpage des
       * ticks.
       */
      tower.data.floor = Math.floor(tower.data.kills / 10);
      const pp = Math.floor(tower.data.ppProgress / 1e6);
      if (pp > 0) {
        tower.data.ppProgress -= pp * 1e6;
        state.currencies.pp += pp;
      }
    }
  }

  const cards = state.systems.cards;
  if (cards.unlocked) {
    cards.data.nextCardAt = Math.max(0, num(cards.data.nextCardAt, now + 3600000));
    cards.data.deck = Array.isArray(cards.data.deck) ? cards.data.deck : [];
    while (now >= cards.data.nextCardAt && cards.data.deck.length < 10) {
      cards.data.deck.push({ id: "card-" + cards.data.nextCardAt, type: "attack", quality: 1 });
      cards.data.nextCardAt += 3600000;
    }
  }
}

/*
 * Wiki (audit 2026-09-16, augments-and-challenges.md) : le 24 Hour, le 100
 * Levels et le Troll Challenge désactivent tous les trois explicitement la
 * progression hors-ligne. Cette architecture ne distingue pas un tick en
 * ligne d'un rattrapage hors-ligne (les deux ne sont qu'un delta de temps
 * écoulé) — appliquer un plafond court par appel est l'équivalent le plus
 * proche sans inventer un nouveau concept d'état "en ligne" : un gros écart
 * (revenir après plusieurs heures) ne peut plus faire progresser les
 * systèmes passifs pendant que l'un de ces défis est actif.
 */
const IDLE_CHALLENGE_OFFLINE_DISABLED_IDS = Object.freeze(["twentyFourHours", "hundredLevels", "troll"]);

export function advanceIdleNguState(raw, seconds, context = {}, now = Date.now()) {
  const state = normalizeIdleNguState(raw, context, now);
  const offlineCap = IDLE_CHALLENGE_OFFLINE_DISABLED_IDS.includes(state.challenge?.active)
    ? 60
    : EARLY_GAME_MAX_OFFLINE_SECONDS;
  const secs = clamp(seconds, 0, offlineCap);

  advanceGeneratedResources(state,secs,context);
  advanceAugmentations(state, secs, context);
  advanceTrackSystem(state, IDLE_NGU_SYSTEMS.find(x => x.id === "advancedTraining"), secs);
  advanceTimeMachine(state, secs);
  advanceBloodMagic(state, secs, context);
  advanceYggdrasil(state, secs);
  advanceWandoos(state, secs, context, now);
  advanceNgusV1(state, secs);
  advanceTrackSystem(state, IDLE_NGU_SYSTEMS.find(x => x.id === "beards"), secs);
  advanceTrackSystem(state, IDLE_NGU_SYSTEMS.find(x => x.id === "hacks"), secs);
  advanceTrackSystem(state, IDLE_NGU_SYSTEMS.find(x => x.id === "wishes"), secs);
  advanceMoneyPitAndDaily(state, nowMs(now));
  advanceLateSystems(state, secs, context, nowMs(now));

  reconcileResourceCurrents(state,context);
  state.updatedAt = nowMs(now);
  state.rebirth = refreshRebirthState(state, context, nowMs(now));
  return state;
}

export function syncIdleNguState(raw, context = {}, now = Date.now()) {
  const state = normalizeIdleNguState(raw, context, now);
  const elapsed = Math.max(0, (nowMs(now) - state.updatedAt) / 1000);
  return advanceIdleNguState(state, elapsed, context, now);
}

/*
 * NGU (2026-09-23, audit) : 16 NGU x 3 paliers, chacun avec son niveau, son
 * travail accumulé (unités de niveau : N -> N+1 coûte N+1) et sa propre
 * allocation. Un seul palier reçoit de l'énergie/magie à la fois.
 */
function createNguDataV1() {
  const ngus = {};
  for (const tier of IDLE_NGU_TIERS_V1) {
    ngus[tier] = {};
    for (const def of IDLE_NGU_CATALOG_V1) ngus[tier][def.id] = { level: 0, work: 0, allocation: 0 };
  }
  return { tier: "normal", ngus };
}

function normalizeNguDataV1(raw) {
  const out = createNguDataV1();
  const src = raw && typeof raw === "object" ? raw : {};
  if (IDLE_NGU_TIERS_V1.includes(src.tier)) out.tier = src.tier;
  for (const tier of IDLE_NGU_TIERS_V1) {
    for (const def of IDLE_NGU_CATALOG_V1) {
      const n = src.ngus?.[tier]?.[def.id] || {};
      out.ngus[tier][def.id] = {
        level: clamp(Math.floor(num(n.level, 0)), 0, IDLE_NGU_MAX_LEVEL_V1),
        work: Math.max(0, num(n.work, 0)),
        allocation: Math.max(0, num(n.allocation, 0))
      };
    }
  }
  return out;
}

function nguAllocationSumV1(data, resource) {
  let total = 0;
  for (const tier of IDLE_NGU_TIERS_V1) {
    for (const def of IDLE_NGU_CATALOG_V1) {
      if (def.resource === resource) total += Math.max(0, num(data?.ngus?.[tier]?.[def.id]?.allocation, 0));
    }
  }
  return total;
}

function syncNguAllocationTotalsV1(system) {
  system.allocation.energy = nguAllocationSumV1(system.data, "energy");
  system.allocation.magic = nguAllocationSumV1(system.data, "magic");
  system.level = Object.values(system.data.ngus).reduce(
    (sum, tierNgus) => sum + Object.values(tierNgus).reduce((t, n) => t + n.level, 0),
    0
  );
  system.permanentLevel = system.level;
}

function clearNguAllocationsV1(system, resource) {
  for (const tier of IDLE_NGU_TIERS_V1) {
    for (const def of IDLE_NGU_CATALOG_V1) {
      if (def.resource === resource && system.data?.ngus?.[tier]?.[def.id]) system.data.ngus[tier][def.id].allocation = 0;
    }
  }
}

function nguLevelsMapV1(state) {
  const out = {};
  const data = state.systems.ngu?.data;
  for (const tier of IDLE_NGU_TIERS_V1) {
    out[tier] = {};
    for (const def of IDLE_NGU_CATALOG_V1) out[tier][def.id] = Math.max(0, num(data?.ngus?.[tier]?.[def.id]?.level, 0));
  }
  return out;
}

/* Effets de tous les NGU (ratios) -- neutres sous le No NGU Challenge. */
function nguFxV1(state) {
  if (state.challenge?.active === "noNgu") return nguEffectsV1({}, state.difficulty);
  return nguEffectsV1(nguLevelsMapV1(state), state.difficulty);
}

function nguTotalLevelsV1(state) {
  const map = nguLevelsMapV1(state);
  let total = 0;
  for (const tier of IDLE_NGU_TIERS_V1) for (const id of Object.keys(map[tier])) total += map[tier][id];
  return total;
}

/*
 * Vitesse (multiplicateur) des NGU alimentés par `resource` : défis, Beard
 * Cage, Digger Energy/Magic NGU, set Meta/Back To School, objets, perks
 * "Faster NGU Energy/Magic", et le NGU "Magic NGU" (accélère les NGU Magic) /
 * "Energy NGU" (accélère les NGU Energy).
 */
function nguSpeedMultiplierV1(state, resource) {
  const gear = state.challenge?.active === "noEquipment" ? null : idleAdventureEquipmentStatsV47(state.adventure);
  const perks = perkBonusesV1(state.systems.perks?.data?.levels);
  const quirks = quirkBonusesV1(state.systems.quirks?.data?.levels);
  const fx = nguFxV1(state);
  const diggers = diggerBonuses(state);
  return Math.max(0,
    challengePermanentBonuses(state).nguSpeedMultiplier *
    beardBonusMultiplier(state, "ngu") *
    (1 + Math.max(0, num(state.adventure?.setRewards?.nguSpeedPct, 0))) *
    (1 + num(gear?.specials?.nguSpeedPct, 0) / 100) *
    (resource === "magic"
      ? diggers.magicNgu * perks.nguSpeedMagicMultiplier * quirks.nguSpeedMagicMultiplier * fx.magicNguSpeed
      : diggers.energyNgu * perks.nguSpeedEnergyMultiplier * quirks.nguSpeedEnergyMultiplier * fx.energyNguSpeed)
  );
}

/* Ajoute des niveaux à un NGU et propage les quirks "Beast NGU" (14 : Evil -> Normal, 89 : Sadistic -> Evil). */
function grantNguLevelsV1(state, tier, id, gained) {
  const data = state.systems.ngu.data;
  const n = data.ngus[tier][id];
  n.level = Math.min(IDLE_NGU_MAX_LEVEL_V1, n.level + Math.max(0, gained));
  const quirkLevels = state.systems.quirks?.data?.levels || {};
  if (tier === "sadistic" && num(quirkLevels[89], 0) > 0) grantNguLevelsV1(state, "evil", id, gained);
  else if (tier === "evil" && num(quirkLevels[14], 0) > 0) grantNguLevelsV1(state, "normal", id, gained);
}

function advanceNgusV1(state, seconds) {
  const s = state.systems.ngu;
  if (!s?.unlocked || seconds <= 0 || state.challenge?.active === "noNgu") return;
  const tier = s.data.tier;
  if (!nguActiveTiersV1(state.difficulty).includes(tier)) return;
  const speeds = {
    energy: nguSpeedMultiplierV1(state, "energy"),
    magic: nguSpeedMultiplierV1(state, "magic")
  };
  for (const def of IDLE_NGU_CATALOG_V1) {
    const n = s.data.ngus[tier][def.id];
    const alloc = Math.max(0, num(n.allocation, 0));
    if (alloc <= 0 || n.level >= IDLE_NGU_MAX_LEVEL_V1) continue;
    if (def.resource === "magic" && !state.systems.bloodMagic?.unlocked) continue;
    const power = Math.max(1, idleNguEffectiveResourceStatV1(state, def.resource, "power"));
    const base = nguParamsV1(tier, def.id).baseCost;
    const work = n.work + (alloc * power * speeds[def.resource] * seconds) / base;
    const { gained, work: rest } = nguLevelsFromWorkV1(n.level, work);
    n.work = rest;
    if (gained > 0) grantNguLevelsV1(state, tier, def.id, gained);
  }
  syncNguAllocationTotalsV1(s);
}

function setNguAllocationV1(state, nguId, value, context = {}, tierArg) {
  const s = state.systems.ngu;
  if (!s?.unlocked) throw new Error("SYSTEME_VERROUILLE");
  if (state.challenge?.active === "noNgu") throw new Error("DEFI_SANS_NGU");
  const def = IDLE_NGU_CATALOG_V1.find(x => x.id === nguId);
  if (!def) throw new Error("NGU_INVALIDE");
  const tier = tierArg || s.data.tier;
  if (!nguActiveTiersV1(state.difficulty).includes(tier)) throw new Error("PALIER_NGU_VERROUILLE");
  if (tier !== s.data.tier) throw new Error("PALIER_NGU_INACTIF");
  const resource = def.resource;
  if (resource === "magic" && !state.systems.bloodMagic?.unlocked) throw new Error("MAGIC_VERROUILLEE");
  const r = state.resources[resource];
  const cap = Math.max(0, idleNguEffectiveResourceStatV1(state, resource, "cap"));
  const n = s.data.ngus[tier][nguId];
  const previous = Math.max(0, num(n.allocation, 0));
  const ownAllocated = nguAllocationSumV1(s.data, resource);
  const otherSystems = totalAllocated(state, resource, "ngu") + externalResourceAllocation(context, resource);
  const maxByCapacity = Math.max(0, cap - otherSystems - (ownAllocated - previous));
  const maxByOwned = Math.max(0, previous + num(r.current, 0));
  const target = clamp(value, 0, Math.min(maxByCapacity, maxByOwned));
  r.current = clamp(num(r.current, 0) - (target - previous), 0, cap);
  n.allocation = target;
  syncNguAllocationTotalsV1(s);
  return { ngu: nguId, tier, allocation: target };
}

/* Change de palier : l'énergie/magie allouée aux NGU du palier quitté est rendue. */
function setNguTierV1(state, tier) {
  const s = state.systems.ngu;
  if (!s?.unlocked) throw new Error("SYSTEME_VERROUILLE");
  if (!IDLE_NGU_TIERS_V1.includes(tier)) throw new Error("PALIER_NGU_INVALIDE");
  if (!nguActiveTiersV1(state.difficulty).includes(tier)) throw new Error("PALIER_NGU_VERROUILLE");
  if (s.data.tier === tier) return { tier };
  for (const resource of ["energy", "magic"]) {
    let released = 0;
    for (const def of IDLE_NGU_CATALOG_V1) {
      if (def.resource !== resource) continue;
      const n = s.data.ngus[s.data.tier][def.id];
      released += Math.max(0, num(n.allocation, 0));
      n.allocation = 0;
    }
    if (released > 0) state.resources[resource].current = num(state.resources[resource].current, 0) + released;
  }
  s.data.tier = tier;
  syncNguAllocationTotalsV1(s);
  return { tier };
}

function trackBonusLevel(state, systemId, trackId) {
  return totalTrackLevel(state.systems[systemId], trackId);
}

function beardSoftLevel(level, exponent, scalar) {
  const l = Math.max(0, num(level, 0));
  return l <= 1000 ? l : Math.pow(l, exponent) * scalar;
}

function beardBonusMultiplier(state, role) {
  const s = state.systems.beards;
  if (!s?.unlocked) return 1;
  const def = (IDLE_NGU_TRACKS.beards || []).find(x => x.beardRole === role);
  if (!def || !beardTrackUnlocked(state, def)) return 1;
  const t = s.data?.tracks?.[def.id] || {};
  const tempActive = Boolean(s.active && s.data?.activeTrack === def.id);
  const temp = tempActive ? Math.max(0, num(t.tempLevel, 0)) : 0;
  const perm = Math.max(0, num(t.permanentLevel, 0));
  let tb = 0, pb = 0;
  if (role === "attackDefense") {
    tb = temp * 0.05; pb = perm * 0.01;
  } else if (role === "drop") {
    tb = beardSoftLevel(temp, .3, 125.9) * .0005;
    pb = beardSoftLevel(perm, .33, 102.4) * .0005;
  } else if (role === "number") {
    tb = beardSoftLevel(temp, .5, 31.7) * .01;
    pb = beardSoftLevel(perm, .5, 31.7) * .001;
  } else if (role === "ngu") {
    tb = beardSoftLevel(temp, .3, 125.9) * .0001;
    pb = beardSoftLevel(perm, .3, 125.9) * .0002;
  } else if (role === "wandoos") {
    tb = beardSoftLevel(temp, .5, 31.7) * .001;
    pb = beardSoftLevel(perm, .5, 31.7) * .002;
  } else if (role === "adventure") {
    tb = beardSoftLevel(temp, .3, 125.9) * .001;
    pb = beardSoftLevel(perm, .5, 31.7) * .0005;
  } else if (role === "gold") {
    tb = beardSoftLevel(temp, .5, 31.7) * .002;
    pb = beardSoftLevel(perm, .5, 31.7) * .005;
  }
  return Math.max(1, (1 + tb) * (1 + pb));
}

function beardRebirthTimeFactor(seconds) {
  const wholeHours = Math.floor(Math.max(0, num(seconds, 0)) / 3600);
  return clamp(wholeHours / 3, 0, 8);
}

function convertActiveBeardOnRebirth(state, runSeconds) {
  const s = state.systems.beards;
  if (!s?.unlocked || !s.data?.tracks) return { track: "", gained: 0, timeFactor: 0 };
  const id = s.active ? (s.data.activeTrack || "") : "";
  const def = (IDLE_NGU_TRACKS.beards || []).find(x => x.id === id);
  const t = id ? s.data.tracks[id] : null;
  const timeFactor = beardRebirthTimeFactor(runSeconds);
  let gained = 0;
  if (t && beardTrackUnlocked(state, def)) {
    const temp = Math.max(0, num(t.tempLevel, 0));
    gained = Math.min(temp, Math.floor(Math.sqrt(temp) * timeFactor));
    t.permanentLevel = Math.max(0, num(t.permanentLevel, 0)) + gained;
  }
  for (const track of Object.values(s.data.tracks)) {
    track.tempLevel = 0;
    track.progress = 0;
  }
  s.tempLevel = 0;
  s.permanentLevel = Object.values(s.data.tracks).reduce((sum, x) => sum + Math.max(0, num(x.permanentLevel, 0)), 0);
  return { track: id, gained, timeFactor };
}

export function idleNguBonuses(raw) {
  const state = raw && raw.version === IDLE_NGU_META_VERSION
    ? raw
    : normalizeIdleNguState(raw, {}, raw?.updatedAt || Date.now());

  const aug = idleNguAugmentationMultiplier(state);
  const atPower = trackBonusLevel(state, "advancedTraining", "power");
  const atToughness = trackBonusLevel(state, "advancedTraining", "toughness");
  const nguFx = nguFxV1(state);
  const equipmentDisabled = state.challenge.active === "noEquipment";
  const adventureGear = equipmentDisabled
    ? {power:0,toughness:0,hp:0,regen:0,specials:{}}
    : idleAdventureEquipmentStatsV47(state.adventure);
  const adventurePermanent = state.adventure?.permanent || {};
  const diggers = diggerBonuses(state);
  const ygg = state.systems.yggdrasil?.data || createYggdrasilData();
  const yggPermanent = ygg.permanent || createYggdrasilData().permanent;
  const powerAlphaMultiplier = 1 + Math.pow(Math.max(0,num(ygg.runPowerAlphaValue,0)),1.5);
  const powerBetaMultiplier = ygg.runPowerBetaActive
    ? 1 + Math.pow(Math.max(0,num(yggPermanent.powerBetaValue,0)),2)*1e-6
    : 1;
  const fruitNumbersMultiplier = ygg.runNumbersActive
    ? 1 + Math.pow(Math.max(0,num(yggPermanent.numbersValue,0)),1.3)*1e-4
    : 1;

  const beardAttack = beardBonusMultiplier(state, "attackDefense");
  const beardNumber = beardBonusMultiplier(state, "number");
  const beardAdventure = beardBonusMultiplier(state, "adventure");
  const beardDrop = beardBonusMultiplier(state, "drop");
  const beardNgu = beardBonusMultiplier(state, "ngu");
  const beardWandoos = beardBonusMultiplier(state, "wandoos");
  const beardGold = beardBonusMultiplier(state, "gold");
  const challengeBonuses=challengePermanentBonuses(state);
  const perkBonuses=perkBonusesV1(state.systems.perks?.data?.levels);
  const quirkBonuses=quirkBonusesV1(state.systems.quirks?.data?.levels);
  const wishBonuses=wishBonusesV1(state.systems.wishes?.data?.tracks);
  const number = Math.max(1e-300, state.rebirth.number) * fruitNumbersMultiplier * beardNumber * nguFx.number;
  /*
   * Wiki NGU (page "Advanced Training", section Formulas) : "The Bonus%
   * for Adventure Power/Toughness is: Level^0.4 * 10" (vérifié cellule par
   * cellule contre la table du wiki, ex. niveau 10 -> 25.12%, niveau 100 ->
   * 63.10%, niveau 1000 -> 158.49%). L'ancienne formule (1 + sqrt(L)*0.005,
   * soit +50% à L=10000) sous-évaluait massivement le bonus réel (+398% à
   * L=10000) et n'avait aucune source wiki.
   */
  const atPowerBonus = 1 + Math.pow(Math.max(0, atPower), 0.4) * 0.1;
  const atToughnessBonus = 1 + Math.pow(Math.max(0, atToughness), 0.4) * 0.1;
  const attackMultiplier =
    number *
    beardAttack *
    aug *
    powerAlphaMultiplier *
    powerBetaMultiplier *
    diggers.stats *
    perkBonuses.statMultiplier *
    quirkBonuses.statMultiplier *
    wishBonuses.statMultiplier *
    atPowerBonus *
    nguFx.attackDefense *
    /*
     * Wandoos (2026-09-18) : wiki page "Wandoos" — l'OS actif multiplie
     * Attack ET Defense ensemble à partir des niveaux de Dump Energy/
     * Magic (formule propre à chaque OS, cf. IDLE_WANDOOS_OS_V1),
     * jamais lu par le combat jusqu'ici (système entièrement mort).
     */
    wandoosCombatMultiplierV1(state);
  /*
   * "Attack Boost for Rich Jerks" (2026-09-18, Norman : "il faut tout
   * faire") -- wiki NGU local, page "Experience", section "Spend
   * Experience" > "Misc", tableau "Attack Boosts For Rich Jerks" : +10%
   * Attack OU Defense par niveau, achetés et trackés SÉPARÉMENT (contraire
   * à "Stat Boost for Rich Perks" ci-dessus, qui boost les deux ensemble)
   * -- voir richJerksAction et state.bonuses.richJerksAttackLevel/
   * richJerksDefenseLevel. Appliqué ici SEULEMENT sur le multiplicateur
   * final exporté de chaque stat, jamais dans attackMultiplier lui-même
   * (qui alimente aussi defenseMultiplier ci-dessous) -- sinon un achat
   * "Attack" boosterait aussi Defense à tort.
   */
  const richJerksAttackMultiplier = 1 + idleNguRichJerksAttackPctV1(state) / 100;
  const richJerksDefenseMultiplier = 1 + Math.max(0, num(state.bonuses?.richJerksDefenseLevel, 0)) * RICH_JERKS_PCT_PER_LEVEL_V1 / 100;

  /*
   * "Equipment Modifier" du panneau Attack/Defense Breakdown (Norman,
   * 2026-09-18, deux captures d'écran du vrai NGU le même jour : la 1re,
   * personnage tout neuf sans gear, montrait "Equipment Modifier: x100%"
   * -- neutre faute d'équipement ; la 2e, panneau "EQUIPMENT BONUSES"
   * avec du gear équipé, montrait Power +1 -> "Player Stat Boosts:
   * Attack: 1%" et Toughness +1 -> "Defense: 1%", un ratio exact de 1
   * point = 1%). Wiki NGU (page Adventure Mode, déjà cité idle-sqlite-
   * runtime.js:9095-9097 lors d'un correctif antérieur qui avait retiré
   * le sens INVERSE, invalide) : "for every point of Power/Toughness
   * from your gear, you also get +1% Attack/Defense" -- jamais câblé
   * jusqu'ici, seulement documenté en commentaire. Même principe que
   * Rich Jerks ci-dessus : appliqué SEULEMENT sur le multiplicateur
   * final exporté (jamais dans attackMultiplier partagé), sinon Power
   * boosterait Defense à tort via la base commune de defenseMultiplier.
   * adventureGear.power/toughness sont déjà à 0 sous le No Equipment
   * Challenge (equipmentDisabled plus haut), donc neutre dans ce cas
   * sans garde supplémentaire.
   */
  const equipmentAttackMultiplier = 1 + Math.max(0, num(adventureGear.power, 0)) * 0.01;
  const equipmentDefenseMultiplier = 1 + Math.max(0, num(adventureGear.toughness, 0)) * 0.01;

  return {
    attackMultiplier: attackMultiplier * richJerksAttackMultiplier * equipmentAttackMultiplier,
    defenseMultiplier:
      attackMultiplier *
      atToughnessBonus *
      richJerksDefenseMultiplier *
      equipmentDefenseMultiplier,
    adventureMultiplier:
      challengeBonuses.adventureStatsMultiplier *
      perkBonuses.adventureStatsMultiplier *
      quirkBonuses.adventureStatsMultiplier *
      wishBonuses.adventureStatsMultiplier *
      beardAdventure *
      diggers.adventure *
      (1 + Math.sqrt(atPower) * 0.008) *
      nguFx.adventure *
      (1 + num(state.bonuses.ironPill, 0)),
    dropMultiplier:
      beardDrop *
      diggers.drop *
      perkBonuses.dropChanceMultiplier *
      nguFx.dropChance *
      (1 + num(adventureGear.specials?.dropChancePct, 0) / 100) *
      (1 + num(yggPermanent.luckDropPct,0)/100) *
      /*
       * Blood Spaghetti (wiki NGU, page Blood Magic) — bonus de Drop
       * Chance calculé dans castBloodSpell() mais jamais lu par ce
       * multiplicateur jusqu'ici (bug "effet calculé mais jamais
       * appliqué"), câblé ici pour la première fois.
       */
      Math.max(1, num(state.systems.bloodMagic?.data?.spells?.bloodSpaghetti, 1)),
    xpMultiplier: diggers.experience * nguFx.exp * (1 + num(state.bonuses.cookingExp, 0)),
    respawnReduction: clamp(
      1 - (1 - nguFx.respawnReduction) * (1 - num(adventureGear.specials?.respawnReductionPct, 0) / 100),
      0,
      0.75
    ),
    adventurePowerFlat: num(adventureGear.power, 0)+num(yggPermanent.adventurePower,0)+perkBonuses.adventurePowerFlat,
    adventureToughnessFlat: num(adventureGear.toughness, 0)+num(yggPermanent.adventureToughness,0)+perkBonuses.adventureToughnessFlat,
    adventureHpFlat: num(adventureGear.hp, 0)+num(yggPermanent.adventureHp,0),
    adventureRegenFlat: num(adventureGear.regen, 0)+num(yggPermanent.adventureRegen,0),
    /*
     * PISTE 2 (2026-09-18, audit "Est-ce que tu as bien intégré chacune des
     * statistiques special etc ?") -- adventureGear.specials.<type>Pct
     * (idle-adventure-v47.js::idleAdventureSpecialsByTypeV1, alimenté par
     * SPECIALS.<item>.sType/sExtra, chaque magnitude sourcée wiki) rejoint
     * désormais chacun des multiplicateurs ci-dessous, au même niveau que
     * les contributions Perks/Quirks/Wishes déjà présentes -- même
     * convention non terminale que le reste de ce bloc (energyPowerMultiplier
     * and co. restent, comme avant ce correctif, calculés ici mais pas
     * encore lus par idleNguEffectiveResourceStatV1 pour le terme
     * multiplicatif -- seul le terme FLAT l'est ; gap préexistant documenté
     * plus haut "les multiplicateurs Perks/Quirks jamais appliqués", commun
     * à Perks/Quirks/Wishes/objets, pas propre à ce correctif ni aggravé
     * par lui).
     */
    adventureGoldMultiplier: perkBonuses.adventureGoldMultiplier * quirkBonuses.adventureGoldMultiplier * nguFx.gold * (1 + num(adventureGear.specials?.goldDropsPct, 0) / 100),
    energySpeedFlat: num(adventurePermanent.energySpeedFlat, 0),
    energyPowerFlat: num(adventurePermanent.energyPowerFlat, 0)+perkBonuses.energyPowerFlat,
    energyBarsFlat: num(adventurePermanent.energyBarsFlat, 0)+perkBonuses.energyBarsFlat,
    energyPowerMultiplier: perkBonuses.energyPowerMultiplier * quirkBonuses.energyPowerMultiplier * wishBonuses.energyPowerMultiplier * (1 + num(adventureGear.specials?.energyPowerPct, 0) / 100),
    energyBarsMultiplier: perkBonuses.energyBarsMultiplier * quirkBonuses.energyBarsMultiplier * wishBonuses.energyBarsMultiplier * (1 + num(adventureGear.specials?.energyBarsPct, 0) / 100),
    energyCapMultiplier: perkBonuses.energyCapMultiplier * quirkBonuses.energyCapMultiplier * wishBonuses.energyCapMultiplier * (1 + num(adventureGear.specials?.energyCapPct, 0) / 100),
    /*
     * energySpeedMultiplier/magicSpeedMultiplier : pas d'équivalent Perks/
     * Quirks/Wishes existant à étendre (aucun des trois catalogues n'a de
     * clé "energySpeedMultiplier"/"magicSpeedMultiplier" -- à distinguer de
     * energyPowerMultiplier/energyBarsMultiplier/energyCapMultiplier
     * ci-dessus, et de "Wandoos Energy/Magic Speed" (quirkEnergyMultiplier/
     * quirkMagicMultiplier, advanceWandoosTrack ci-dessous -- un mécanisme
     * Wandoos différent, déjà câblé, jamais celui-ci). Nouvelle clé, même
     * schéma que r3Power/Cap/BarsMultiplier ci-dessous : "smallest sensible
     * consumer" pour un TYPE de bonus sans câblage préexistant.
     */
    energySpeedMultiplier: 1 + num(adventureGear.specials?.energySpeedPct, 0) / 100,
    magicSpeedMultiplier: 1 + num(adventureGear.specials?.magicSpeedPct, 0) / 100,
    magicPowerFlat: num(adventurePermanent.magicPowerFlat, 0)+perkBonuses.magicPowerFlat,
    magicBarsFlat: num(adventurePermanent.magicBarsFlat, 0)+perkBonuses.magicBarsFlat,
    magicCapFlat: num(adventurePermanent.magicCapFlat, 0)+perkBonuses.magicCapFlat,
    magicPowerMultiplier: perkBonuses.magicPowerMultiplier * quirkBonuses.magicPowerMultiplier * wishBonuses.magicPowerMultiplier * (1 + num(adventureGear.specials?.magicPowerPct, 0) / 100),
    magicBarsMultiplier: perkBonuses.magicBarsMultiplier * quirkBonuses.magicBarsMultiplier * wishBonuses.magicBarsMultiplier * (1 + num(adventureGear.specials?.magicBarsPct, 0) / 100),
    magicCapMultiplier: perkBonuses.magicCapMultiplier * quirkBonuses.magicCapMultiplier * wishBonuses.magicCapMultiplier * (1 + num(adventureGear.specials?.magicCapPct, 0) / 100),
    /*
     * r3Power/Cap/BarsMultiplier : nouvelles clés, sans équivalent Perks/
     * Quirks existant (aucune des deux catalogues Normal ne touche
     * Resource 3 — voir idle-perks-v1.js/idle-quirks-v1.js). Resource 3
     * est pourtant déjà une ressource de première classe ici (state.
     * resources.r3, allouée par les Hacks) ; ces clés suivent exactement
     * le même schéma que les six ci-dessus, alimentées pour l'instant
     * uniquement par les souhaits "Resource 3 Power/Cap/Bars".
     */
    r3PowerMultiplier: wishBonuses.r3PowerMultiplier,
    r3CapMultiplier: wishBonuses.r3CapMultiplier,
    r3BarsMultiplier: wishBonuses.r3BarsMultiplier,
    boostPowerMultiplier: perkBonuses.boostPowerMultiplier * quirkBonuses.boostPowerMultiplier,
    inventorySlotsFromPerks: perkBonuses.inventorySlots,
    accessorySlotsFromPerks: perkBonuses.accessorySlotBonus,
    diggerSlotBonusFromPerks: perkBonuses.diggerSlotBonus,
    advancedTrainingStartBonusFromPerks: perkBonuses.advancedTrainingStartBonus,
    atBankMultiplierFromPerks: perkBonuses.atBankMultiplier,
    tmBankMultiplierFromPerks: perkBonuses.tmBankMultiplier,
    beardBankMultiplierFromPerks: perkBonuses.beardBankMultiplier,
    atBankMultiplierFromQuirks: quirkBonuses.atBankMultiplier,
    tmBankMultiplierFromQuirks: quirkBonuses.tmBankMultiplier,
    beardBankMultiplierFromQuirks: quirkBonuses.beardBankMultiplier,
    titanExpFirstKillsMultiplierFromPerks: perkBonuses.titanExpFirstKillsMultiplier,
    bossExpMultiplierFromPerks: perkBonuses.bossExpMultiplier,
    seedYieldMultiplierFromPerks: perkBonuses.seedYieldMultiplier,
    seedYieldMultiplierFromQuirks: quirkBonuses.seedYieldMultiplier,
    // PISTE 2 (2026-09-18) : "Seed Gain" (Candy Corn Necklace, wiki) -- même convention FromPerks/FromQuirks ci-dessus, aucun équivalent existant à étendre.
    seedYieldMultiplierFromItems: 1 + num(adventureGear.specials?.seedGainPct, 0) / 100,
    lootGoblinChanceFromPerks: perkBonuses.lootGoblinChance,
    cubeBoostRateFromPerks: perkBonuses.cubeBoostRate,
    daycareGrowthMultiplierFromPerks: perkBonuses.daycareGrowthMultiplier,
    firstHarvestMultiplierFromPerks: perkBonuses.firstHarvestMultiplier,
    wandoosOsLevelBonusFromPerks: perkBonuses.wandoosOsLevelBonus,
    doubleBasicTrainingFromPerks: perkBonuses.doubleBasicTraining,
    basicTrainingLevelsPerFill: levelsPerFillBasicTrainingV411({
      doubleBasicTraining: perkBonuses.doubleBasicTraining,
      quirkExtraLevels: quirkBonuses.basicTrainingExtraLevels,
      wishExtraLevels: wishBonuses.basicTrainingExtraLevels
    }),
    disableEquipment: equipmentDisabled,
    numberMultiplier: number,
    augmentationMultiplier: aug,
    timeMachineGoldPerSecond: idleNguTimeMachineGoldPerSecond(state),
    timeMachineGrossGoldPerSecond: idleNguTimeMachineGrossGoldPerSecond(state),
    diggerDrainGoldPerSecond: diggerDrainTotal(state),
    diggerGlobalBonus: diggerGlobalBonus(state),
    diggerSlots: availableDiggerSlots(state),
    /*
     * PISTE 2 (2026-09-18) : "NGU Speed" (Candy Corn Necklace / A Shrunken
     * Voodoo Doll, wiki) rejoint ce multiplicateur. Correctif 2026-09-18
     * (suite) : ce multiplicateur était resté affichage-seul -- advanceTrackSystem
     * (def.id === "ngu") n'appliquait que setRewards.nguSpeedPct (le pont
     * "set complet" existant), jamais ce multiplicateur-ci (beard/digger/
     * attack-NGU/objets). Câblé maintenant dans advanceTrackSystem, en plus
     * de nguSpeedSetMultiplier (les deux sont des sources distinctes,
     * multipliées ensemble comme le reste des chaînes de multiplicateurs de
     * ce fichier).
     */
    nguSpeedMultiplier: challengeBonuses.nguSpeedMultiplier * beardNgu * diggers.energyNgu * (1 + num(adventureGear.specials?.nguSpeedPct, 0) / 100),
    nguEffects: nguFx,
    nguSpeedEnergyMultiplierFromPerks: perkBonuses.nguSpeedEnergyMultiplier,
    nguSpeedMagicMultiplierFromPerks: perkBonuses.nguSpeedMagicMultiplier,
    /*
     * PISTE 2 (2026-09-18) : "Beard Speed" (Beard Comb/Red Lipstick/A
     * Shrunken Voodoo Doll, wiki). Correctif 2026-09-18 (suite) : câblé
     * maintenant dans advanceBeardTrack (baseRate) -- PAS dans
     * beardBonusMultiplier(), qui représente l'effet produit par le niveau
     * de Beard déjà acquis sur d'autres stats, jamais la vitesse à laquelle
     * la Beard active elle-même progresse. Voir le commentaire d'
     * advanceBeardTrack pour le détail.
     */
    beardSpeedMultiplierFromItems: 1 + num(adventureGear.specials?.beardSpeedPct, 0) / 100,
    wandoosSpeedMultiplier: beardWandoos * diggers.wandoos,
    beardGoldMultiplier: beardGold,
    beardNumberMultiplier: beardNumber,
    ppMultiplier: nguFx.pp,
    /* Aucun vrai NGU n'accélère Questing ni le Daycare (pistes inventées retirées). */
    questSpeedMultiplier: 1,
    daycareSpeedMultiplier: 1,
    /*
     * hackSpeedMultiplier/wishSpeedMultiplier étaient déclarées ici à 1 en
     * dur depuis le début, sans aucune source réelle. Câblées avec les
     * souhaits "Hack Speed"/"Wish Speed" du catalogue réel (idle-wishes-
     * v1.js). Correctif 2026-09-18 (suite) : rejoint désormais aussi les
     * tiers 8-10 de l'Infinity Cube (hackSpeedPct/wishSpeedPct,
     * IDLE_ADVENTURE_CUBE_TIERS_V1, 11/11 tiers vérifiés wiki), même
     * principe que dropChancePct/goldDropsPct déjà câblés depuis le cube --
     * ET câblage réel dans advanceHackTrack (qui ne lisait aucun
     * multiplicateur de vitesse jusqu'ici) / advanceWishTrack (qui calcule
     * déjà sa propre vitesse directement via wishBonusesV1(), pour ne pas
     * dépendre de tout idleNguBonuses() dans sa propre boucle -- la même
     * contribution du cube y est donc dupliquée par petit calcul local
     * plutôt que lue depuis ce champ, cf. son propre commentaire).
     */
    hackSpeedMultiplier: wishBonuses.hackSpeedMultiplier * (1 + Math.max(0, num(idleAdventureCubeTierV1(state.adventure?.cube).hackSpeedPct, 0)) / 100),
    wishSpeedMultiplier: wishBonuses.wishSpeedMultiplier * (1 + Math.max(0, num(idleAdventureCubeTierV1(state.adventure?.cube).wishSpeedPct, 0)) / 100) * (1 + Math.max(0, num(state.adventure?.setRewards?.wishSpeedPct, 0))),
    challengeBonuses:clone(challengeBonuses),
    perkBonuses:clone(perkBonuses),
    quirkBonuses:clone(quirkBonuses),
    wishBonuses:clone(wishBonuses),
    inventorySlotsFromChallenges:challengeBonuses.inventorySlots,
    autoBoostUnlockedByChallenges:challengeBonuses.autoBoost,
    autoMergeTimeMultiplierFromChallenges:challengeBonuses.autoMergeTimeMultiplier,
    titanRespawnReductionMsFromChallenges:challengeBonuses.titanRespawnReductionMs,
    titanLootLevelBonusFromChallenges:challengeBonuses.titanLootLevelBonus,
    boostRecycleChanceFromChallenges:challengeBonuses.boostRecycleChance
  };
}

function unlockInfo(def, state, context) {
  return {
    unlocked: Boolean(state.systems[def.id].unlocked),
    bosses: num(def.unlock?.bosses, 0),
    rebirths: num(def.unlock?.rebirths, 0),
    sets: num(def.unlock?.sets, 0),
    item: def.unlock?.item || "",
    flag: def.unlock?.flag || "",
    basicTrainingComplete: Boolean(def.unlock?.basicTrainingComplete)
  };
}

/*
 * Correctif 2026-09-14 (Norman, deuxième signalement le même jour : "je
 * viens de lancer 1 nouvelle partie sur NGU tout en lancant une sur
 * SOREAL IDLE. Je suis déjà à 1,5M alors que dans NGU je ne suis qu'à
 * 350K. Il y a un souci au niveau des points de vie de départ, de la
 * manière dont la vie remonte... rien ne correspond.") — le correctif
 * précédent (même jour, voir historique git) citait une page wiki
 * "Fight Boss" avec "Max HP = Attack x 10"/"HP Regen = Defense / 20" :
 * cette page N'EXISTE PAS sur le wiki NGU (vérifié en direct au
 * navigateur, 404) — une valeur inventée, exactement ce que Norman
 * interdit explicitement. Cause réelle du décalage de vitesse signalé :
 * ce ratio inventé rendait le joueur bien plus résistant que le vrai
 * jeu, donc capable d'idle-farmer des zones largement au-dessus de son
 * niveau réel.
 *
 * Vraie source, vérifiée en direct au navigateur (2026-09-14) :
 * https://ngu-idle.fandom.com/wiki/Build_Max_HP et
 * https://ngu-idle.fandom.com/wiki/Build_HP_Regen — ces deux pages
 * listent les stats Power/Toughness/HP Max/HP regen de ~20 objets
 * d'Aventure réels (UUG's Big Book of Insults, THE DEATHSTICK, Choffice
 * Hat of Greed, etc.). Le ratio est EXACTEMENT le même sur chacun des 20
 * objets, sans une seule exception :
 *   HP Max = Power × 3
 *   HP Regen = Toughness × 0.03 (3%)
 * (ex. UUG's Big Book : Power 104 000 000 000 → HP Max 312 000 000 000
 * = ×3 exact ; Toughness 1 600 000 000 → HP regen 48 000 000 = ×0.03
 * exact — répété à l'identique sur Choffice Hat, Wooden Office Apron,
 * The Titan Effigy, Tie of Apathy, etc.)
 */
function idleAdventureCombatStatsV1(gear, context) {
  const g = gear && typeof gear === "object" ? gear : {};
  /*
   * Norman (répété plusieurs fois, dont 2026-09-16) : "La regen n'est
   * toujours pas à 1/s dès le début du mode aventure." Cause réelle :
   * le plancher de secours (aucune valeur adventurePower/Toughness
   * externe n'existe tant qu'aucun équipement d'Aventure n'est trouvé,
   * voir contexteMetaNguSorealIdle_) s'appliquait sur le TOUGHNESS
   * d'entrée (floor à 1) puis était multiplié par 0.03 — donnant un
   * plancher réel de 0.03/s, pas 1/s. HP suit le même schéma (floor
   * POWER à 1, ×3 → plancher réel 3, cohérent avec le ratio HP=Power×3
   * vérifié sur le wiki) — seul le REGEN doit avoir son propre plancher
   * de sortie à 1, appliqué APRÈS la multiplication, jamais avant.
   *
   * Norman (2026-09-18, capture d'écran "Adventure Stats Breakdown" du
   * vrai NGU en direct) : personnage tout neuf, sans aucun équipement
   * d'Aventure ("Equipment Modifier: +0") -- "Base Adventure Power: 10"
   * / "Base Adventure Toughness: 10" / "Total: 10". Le plancher de
   * secours ci-dessus utilisait 1, pas 10 -- sous-évaluant Power/
   * Toughness/HP/Regen de base d'un facteur 10 pour tout joueur sans
   * encore d'équipement d'Aventure.
   *
   * Norman (2026-09-18, en direct, répété depuis le 2026-09-14) : "Les
   * points de vie du mode aventure au début ne sont pas les mêmes dans
   * NGU et Soreal. C'est 50hp sans équipement." L'audit du même jour
   * (piste 3) avait retiré le "+10" plat au motif qu'AUCUNE page wiki ne
   * documente de PV joueur en combat d'Aventure -- ce qui reste exact,
   * MAIS c'est précisément pour cette raison que ce plancher n'est PAS
   * une donnée à sourcer sur le wiki : la barre de vie d'Aventure est un
   * système SOREAL, jamais une mécanique NGU réelle (Norman, 2026-09-09,
   * déjà documenté plus haut). Pour un système que SOREAL invente
   * lui-même, l'autorité n'est pas une page wiki (qui ne peut
   * structurellement pas exister) mais Norman lui-même, qui vient de
   * fixer explicitement cette magnitude -- pas une valeur "inventée" par
   * un correctif, mais une exigence de conception donnée directement.
   * Le "50" observé le 2026-09-14 venait déjà d'un écran SOREAL, pas du
   * wiki -- ce correctif ne prétend toujours pas que 50 est une valeur
   * NGU, seulement que c'est la valeur SOREAL demandée. Le ratio HP
   * Max=Power×3 RESTE sourcé et inchangé -- pour la contribution de
   * l'équipement (g.hp, wiki Build_Max_HP) ET pour tout scénario où
   * context.adventurePower est réellement fourni (aucun chemin réel ne le
   * fait aujourd'hui, mais idle-adventure-combat-stats-shared.test.mjs
   * l'exerce explicitement avec adventurePower=100 -> hp=300 attendu,
   * comportement à préserver). Seul le PLANCHER PAR DÉFAUT (aucun
   * adventurePower fourni du tout, le cas réel de tout joueur sans encore
   * de contexte externe) devient 50 plutôt que Power_base(10)×3=30.
   */
  const BASE_ADVENTURE_HP_V1 = 50;
  const hasExternalAdventurePower = Number.isFinite(Number(context.adventurePower));
  const baseAdventurePower = Math.max(10, num(context.adventurePower, 10));
  const baseAdventureToughness = Math.max(10, num(context.adventureToughness, context.adventurePower || 10));
  const baseAdventureRegen = Math.max(1, baseAdventureToughness * 0.03);
  const permanent = g.permanent && typeof g.permanent === "object" ? g.permanent : {};
  return Object.assign({}, g, {
    power:
      baseAdventurePower +
      Math.max(0, num(g.power, 0)) +
      Math.max(0, num(permanent.adventurePower, 0)),
    toughness:
      baseAdventureToughness +
      Math.max(0, num(g.toughness, 0)) +
      Math.max(0, num(permanent.adventureToughness, 0)),
    hp:
      (hasExternalAdventurePower ? baseAdventurePower * 3 : BASE_ADVENTURE_HP_V1) +
      Math.max(0, num(g.hp, 0)) +
      Math.max(0, num(permanent.adventureHp, 0)),
    regenBase: baseAdventureRegen,
    regen:
      baseAdventureRegen +
      Math.max(0, num(g.regen, 0)) +
      Math.max(0, num(permanent.adventureRegen, 0))
  });
}

function nguSnapshotV1(state, context) {
  const s = state.systems.ngu;
  const active = nguActiveTiersV1(state.difficulty);
  const speeds = { energy: nguSpeedMultiplierV1(state, "energy"), magic: nguSpeedMultiplierV1(state, "magic") };
  const tiers = {};
  for (const tier of IDLE_NGU_TIERS_V1) {
    tiers[tier] = IDLE_NGU_CATALOG_V1.map(def => {
      const n = s.data.ngus[tier][def.id];
      const params = nguParamsV1(tier, def.id);
      const power = Math.max(1, idleNguEffectiveResourceStatV1(state, def.resource, "power"));
      const alloc = Math.max(0, num(n.allocation, 0));
      const rate = alloc * power * speeds[def.resource];
      const perLevel = params.baseCost * (n.level + 1);
      return {
        id: def.id,
        name: def.name,
        effect: def.effect,
        resource: def.resource,
        level: n.level,
        allocation: alloc,
        progress: n.level >= IDLE_NGU_MAX_LEVEL_V1 ? 0 : Math.max(0, Math.min(1, n.work / (n.level + 1))),
        effectPct: nguEffectPctV1(tier, def.id, n.level),
        secondsPerLevel: rate > 0 ? perLevel / rate : null,
        baseCost: params.baseCost
      };
    });
  }
  return {
    tier: s.data.tier,
    activeTiers: active,
    maxLevel: IDLE_NGU_MAX_LEVEL_V1,
    unlocked: Boolean(s.unlocked),
    magicUnlocked: Boolean(state.systems.bloodMagic?.unlocked),
    speedMultiplier: speeds,
    tiers,
    effects: clone(nguFxV1(state))
  };
}

export function idleNguSnapshot(raw, context = {}, now = Date.now()) {
  const state = syncIdleNguState(raw, context, now);
  return {
    version: state.version,
    saveSchema: state.saveSchema,
    resources: clone(state.resources),
    resourceBudget: Object.fromEntries(
      RESOURCE_KEYS.map(resource=>[resource,idleNguResourceBudget(state,resource,context)])
    ),
    currencies: clone(state.currencies),
    records: clone(state.records),
    rebirth: clone(state.rebirth),
    difficulty: state.difficulty,
    difficultyPeaks: clone(state.difficultyPeaks),
    difficultyUnlockRequirements: idleNguDifficultyUnlockRequirementsV1(state, context),
    challenge: clone(state.challenge),
    challengeDefinitions: challengeSnapshotDefinitions(state,context),
    challengeBonuses: challengePermanentBonuses(state),
    bank: clone(state.bank),
    /*
     * 4G's Sellout Shop : le client ne doit jamais recalculer une formule
     * de coût lui-même — chaque entrée porte déjà son coût réel pour le
     * PROCHAIN achat (ou null si au plafond), calculé ici une seule fois.
     */
    selloutShop: {
      purchases: clone(state.selloutShop.purchases),
      unlockedEver: Boolean(state.selloutShop.unlockedEver),
      catalog: IDLE_SELLOUT_SHOP_CATALOG_V1.map((item) => {
        const purchased = Math.max(0, int(state.selloutShop.purchases[item.id], 0));
        return {
          id: item.id,
          category: item.category,
          name: item.name,
          effect: item.effect,
          max: item.max,
          qty: item.qty || 0,
          purchased,
          effectActive: Boolean(item.grant),
          nextCost: idleSelloutShopNextCostV1(item, purchased)
        };
      })
    },
    bonuses: idleNguBonuses(state),
    adventure: (() => {
      /*
       * Norman (2026-09-11) : "le mode aventure est déjà débloqué [après un
       * Rebirth]... il ne doit se débloquer qu'au niveau habituel." Vérifié
       * contre le wiki NGU (page "Rebirths") : "Access to the Adventure...
       * tabs [is lost] until their related bosses are beaten... Bosses
       * fought (you go back to boss 1)." L'hypothèse inverse ci-dessous
       * (permanence via records.highestBoss) n'a jamais été vérifiée contre
       * le wiki et était fausse — seuls l'Inventaire et la Collection
       * restent permanents après un Rebirth, pas l'Aventure. `context.bosses`
       * (compteur du RUN EN COURS, remis à 0 à chaque Renaissance) est donc
       * la SEULE source à utiliser ici, exactement comme le jeu réel.
       */
      const snap = idleAdventureSnapshotV47(state.adventure, num(context.bosses, 0), state.difficulty, state.difficultyPeaks);
      const gear = snap.stats || idleAdventureEquipmentStatsV47(state.adventure);
      snap.stats = idleAdventureCombatStatsV1(gear, context);
      return snap;
    })(),
    earlyGameTimeline: clone(IDLE_NGU_EARLY_GAME_TIMELINE),
    /*
     * Audit 2026-09-13 (Norman) : "Le menu augmentation ne possède pas de
     * barres qui montent comme dans basic training." Basic Training expose
     * déjà skill.progress (0-1) pour animer une barre de remplissage —
     * Augmentations exposait seulement level/upgradeLevel (un nombre entier
     * qui saute), jamais la progression continue vers le niveau suivant.
     * progressPct/upgradeProgressPct réutilisent la même formule de temps
     * déjà utilisée pour VRAIMENT faire progresser le niveau
     * (augmentationSecondsForNextLevel), jamais un second calcul inventé
     * côté client.
     */
    augmentations: IDLE_NGU_AUGMENTATIONS.map((def) => {
      const pair = state.systems.augmentations.data.pairs?.[def.id] || {};
      const neededMain = augmentationSecondsForNextLevel(state, def, false);
      const neededUpgrade = def.upgrade ? augmentationSecondsForNextLevel(state, def, true) : Infinity;
      return Object.assign({}, def, {
        progressPct: Number.isFinite(neededMain) && neededMain > 0 ? Math.max(0, Math.min(1, num(pair.progress, 0) / neededMain)) : 0,
        upgradeProgressPct: Number.isFinite(neededUpgrade) && neededUpgrade > 0 ? Math.max(0, Math.min(1, num(pair.upgradeProgress, 0) / neededUpgrade)) : 0,
        secondsPerLevel: Number.isFinite(neededMain) ? neededMain : null,
        upgradeSecondsPerLevel: Number.isFinite(neededUpgrade) ? neededUpgrade : null,
        levelsPerSecond: Number.isFinite(neededMain) && neededMain > 0 ? Math.min(50,1/neededMain) : 0,
        upgradeLevelsPerSecond: Number.isFinite(neededUpgrade) && neededUpgrade > 0 ? Math.min(50,1/neededUpgrade) : 0
      });
    }),
    ngus: nguSnapshotV1(state, context),
    bloodRituals: clone(IDLE_NGU_BLOOD_RITUALS),
    yggFruits: clone(IDLE_NGU_YGG_FRUITS),
    diggerDefinitions: clone(IDLE_NGU_DIGGERS),
    /*
     * Audit 2026-09-14 (mission fidélité wiki) : buyPerkV1/buyQuirkV1
     * (plus haut dans ce fichier) exigent un perkId/quirkId précis depuis
     * longtemps (migration Perks d'une session antérieure, puis Quirks ce
     * soir), mais AUCUN des deux catalogues (IDLE_PERKS_CATALOG_V1,
     * IDLE_QUIRKS_CATALOG_V1) n'était exposé au client — qui n'avait donc
     * structurellement aucun moyen de savoir quels perks/quirks existent,
     * ni de construire un bouton d'achat avec le bon id. Résultat en jeu :
     * le seul bouton existant ("Acheter une Maîtrise"/"Acheter une
     * Procédure", Soreal_Idle_UI.html) envoyait l'action sans aucun id,
     * échouant systématiquement (PERK_INTROUVABLE/QUIRK_INTROUVABLE).
     * Mêmes gabarit et clé que diggerDefinitions ci-dessus.
     */
    perkDefinitions: clone(IDLE_PERKS_CATALOG_V1),
    quirkDefinitions: clone(IDLE_QUIRKS_CATALOG_V1),
    /*
     * Audit 2026-09-16 : le client n'avait aucun moyen de connaître le coût
     * EXP/plafond des achats Spend EXP (energy/magic/r3) — jamais exposé
     * avant, uniquement utilisé côté serveur par buyResource(). Même
     * gabarit que perkDefinitions/quirkDefinitions ci-dessus : un catalogue
     * statique cloné, jamais une formule recalculée côté client.
     */
    resourcePurchases: clone(IDLE_NGU_RESOURCE_PURCHASES),
    /*
     * Audit 2026-09-17 (Newbie Offers / achats en lot / verrou boss 17,
     * capture Norman du vrai shop) : le client ne doit jamais recalculer
     * lui-même si Power/Cap sont débloqués (resourcePurchaseUnlocked lit
     * context.bosses, la même convention que IDLE_NGU_SYSTEMS) ni quelles
     * Newbie Offers restent disponibles — les deux sont donc précalculés
     * ici, même principe que resourcePurchases/selloutShop ci-dessus.
     */
    resourcePurchaseUnlock: Object.fromEntries(RESOURCE_KEYS.map(resource => [
      resource,
      Object.fromEntries(Object.keys(IDLE_NGU_RESOURCE_PURCHASES[resource]).map(stat => {
        const purchase = IDLE_NGU_RESOURCE_PURCHASES[resource][stat];
        return [stat, {
          unlocked: resourcePurchaseUnlocked(purchase, context),
          neededBosses: num(purchase.unlockBoss, 0)
        }];
      }))
    ])),
    newbieOffers: {
      catalog: clone(IDLE_NGU_NEWBIE_OFFERS),
      used: clone(state.records.newbieOffersUsed || [])
    },
    systems: IDLE_NGU_SYSTEMS.map(def => ({
      id: def.id,
      name: def.name,
      icon: def.icon,
      kind: def.kind,
      resources: def.resources.slice(),
      unlock: unlockInfo(def, state, context),
      tracks: (IDLE_NGU_TRACKS[def.id] || []).map(track => ({
        ...track,
        unlocked: def.id !== "beards" || beardTrackUnlocked(state, track),
        state: clone(state.systems[def.id].data.tracks?.[track.id] || { level: 0, tempLevel: 0, permanentLevel: 0, progress: 0 }),
        active:
          state.systems[def.id].data.activeTrack === track.id &&
          (def.id !== "beards" || state.systems[def.id].active)
      })),
      state: clone(state.systems[def.id])
    }))
  };
}

/*
 * Vrai NGU ("REACH BOSS 17 FOR MORE PURCHASES HERE!", capture Norman) :
 * Power/Cap restent verrouillés (pas de bouton, message de palier à la
 * place) tant que le boss du RUN EN COURS n'a pas atteint le seuil. Réutilise
 * exactement la même convention que IDLE_NGU_SYSTEMS/unlockSatisfied
 * (context.bosses, remis à 0 à chaque Renaissance comme les autres
 * déblocages de systèmes) plutôt que le tracker permanent
 * state.records.highestBoss (qui sert un autre besoin : le bonus FTBE,
 * jamais remis à 0). purchase.unlockBoss est absent (undefined) sur
 * speed/bars, donc toujours considéré débloqué pour ces deux stats.
 */
function resourcePurchaseUnlocked(purchase, context) {
  const needed = num(purchase?.unlockBoss, 0);
  return needed <= 0 || num(context?.bosses, 0) >= needed;
}

function buyResource(state, resource, stat, quantity, context = {}) {
  if (!RESOURCE_KEYS.includes(resource)) throw new Error("RESSOURCE_INVALIDE");
  if (!["speed", "power", "cap", "bars"].includes(stat)) throw new Error("STAT_RESSOURCE_INVALIDE");
  if (resource === "magic" && !state.systems.bloodMagic.unlocked) throw new Error("MAGIC_VERROUILLEE");
  if (resource === "r3" && !state.systems.hacks.unlocked) throw new Error("R3_VERROUILLEE");
  const purchase=IDLE_NGU_RESOURCE_PURCHASES[resource]?.[stat];
  if (!purchase) throw new Error("ACHAT_RESSOURCE_INDISPONIBLE");
  if (!resourcePurchaseUnlocked(purchase, context)) throw new Error("ACHAT_VERROUILLE_BOSS");
  /*
   * Achat en lot (capture Norman : "+1 for 80 EXP" / "+10 for 800 EXP" /
   * "+100 for 8000 EXP", plus le montant personnalisé de droite) : une seule
   * vérification EXP_INSUFFISANTE pour tout le lot, jamais un achat partiel
   * si le joueur n'a pas assez pour la quantité demandée en entier.
   */
  const qty = Math.floor(num(quantity, 1));
  if (!Number.isFinite(qty) || qty < 1) throw new Error("QUANTITE_INVALIDE");
  const r = state.resources[resource];
  if (num(r[stat],0) >= purchase.hardCap - 1e-12) throw new Error("STAT_RESSOURCE_MAX");
  const totalCost = purchase.cost * qty;
  const totalGain = purchase.gain * qty;
  if (state.currencies.experience < totalCost) throw new Error("EXP_INSUFFISANTE");
  state.currencies.experience -= totalCost;
  r.spentExp += totalCost;
  r[stat] = Math.min(purchase.hardCap, num(r[stat],0) + totalGain);
  return { resource, stat, quantity: qty, cost: totalCost, gain: totalGain, value: r[stat] };
}

/*
 * NGU Spend EXP "Newbie Offers" (IDLE_NGU_NEWBIE_OFFERS ci-dessus) : achat
 * distinct de buyResource — un id stable, achetable une seule fois PAR
 * COMPTE (jamais remis en jeu par une Renaissance, cf commentaire sur
 * records.newbieOffersUsed dans baseState()).
 */
function buyNewbieOffer(state, resource, stat, offerId) {
  if (!RESOURCE_KEYS.includes(resource)) throw new Error("RESSOURCE_INVALIDE");
  if (!["speed", "power", "cap", "bars"].includes(stat)) throw new Error("STAT_RESSOURCE_INVALIDE");
  if (resource === "magic" && !state.systems.bloodMagic.unlocked) throw new Error("MAGIC_VERROUILLEE");
  if (resource === "r3" && !state.systems.hacks.unlocked) throw new Error("R3_VERROUILLEE");
  const id = String(offerId || "");
  const offer = (IDLE_NGU_NEWBIE_OFFERS[resource]?.[stat] || []).find(o => o.id === id);
  if (!id || !offer) throw new Error("OFFRE_INTROUVABLE");
  if (state.records.newbieOffersUsed.includes(id)) throw new Error("OFFRE_DEJA_UTILISEE");
  const hardCap = num(IDLE_NGU_RESOURCE_PURCHASES[resource]?.[stat]?.hardCap, Infinity);
  const r = state.resources[resource];
  if (num(r[stat],0) >= hardCap - 1e-12) throw new Error("STAT_RESSOURCE_MAX");
  if (state.currencies.experience < offer.cost) throw new Error("EXP_INSUFFISANTE");
  state.currencies.experience -= offer.cost;
  r.spentExp += offer.cost;
  r[stat] = Math.min(hardCap, num(r[stat],0) + offer.gain);
  state.records.newbieOffersUsed = state.records.newbieOffersUsed.concat([id]);
  return { resource, stat, offerId: id, cost: offer.cost, gain: offer.gain, value: r[stat] };
}

function selectTrack(state, id, trackId) {
  const s = state.systems[id];
  if (!s?.unlocked) throw new Error("SYSTEME_VERROUILLE");
  const trackDef = (IDLE_NGU_TRACKS[id] || []).find(x => x.id === trackId);
  if (!trackDef) throw new Error("PISTE_INVALIDE");
  if (
    id === "advancedTraining" &&
    (trackId === "wandoosEnergy" || trackId === "wandoosMagic") &&
    !state.systems.wandoos?.unlocked
  ) throw new Error("SYSTEME_VERROUILLE");
  if (id === "beards" && !beardTrackUnlocked(state, trackDef)) {
    throw new Error("PISTE_VERROUILLEE");
  }
  s.data.activeTrack = trackId;
  if (id === "beards") s.active = true;
}

/*
 * Wiki NGU (page "Wandoos", section "Using Wandoos") : "Wandoos Energy
 * and Magic levels are lost when: ...Switching between the different
 * Wandoos OSes (98, MEH and XL)." Changer d'OS repart donc à zéro sur les
 * Dump levels courants, mais jamais sur osLevels (niveau d'OS permanent,
 * partagé entre les 3 OS -- "regardless of which OS is currently being
 * used").
 */
function selectWandoosOs(state, osId) {
  const s = state.systems.wandoos;
  if (!s?.unlocked) throw new Error("SYSTEME_VERROUILLE");
  if (!IDLE_WANDOOS_OS_V1[osId]) throw new Error("OS_INVALIDE");
  if (s.data.os === osId) return;
  s.data.os = osId;
  s.data.dumpEnergyLevel = 0;
  s.data.dumpMagicLevel = 0;
  s.data.dumpEnergyProgress = 0;
  s.data.dumpMagicProgress = 0;
  s.level = 0;
  s.tempLevel = 0;
}

function setAugmentAllocationV214_(state,pairId,upgrade,value,context={}){
  const s=state.systems.augmentations;
  if(!s?.unlocked)throw new Error("SYSTEME_VERROUILLE");
  const def=IDLE_NGU_AUGMENTATIONS.find(x=>x.id===pairId);
  if(!def)throw new Error("AUGMENT_INVALIDE");
  if(num(context.bosses,0)<def.unlockBoss||upgrade&&num(context.bosses,0)<def.upgrade.unlockBoss)throw new Error("AUGMENT_VERROUILLE");
  const pair=s.data.pairs[pairId];
  const key=upgrade?"upgradeEnergy":"energy";
  const previous=Math.max(0,num(pair[key],0));
  const cap=Math.max(0,idleNguEffectiveResourceStatV1(state,"energy","cap"));
  let allocatedTracks=0;
  for(const p of Object.values(s.data.pairs||{}))allocatedTracks+=Math.max(0,num(p.energy,0))+Math.max(0,num(p.upgradeEnergy,0));
  const otherSystems=totalAllocated(state,"energy","augmentations")+externalResourceAllocation(context,"energy");
  const maxByCapacity=Math.max(0,cap-otherSystems-(allocatedTracks-previous));
  const maxByOwned=Math.max(0,previous+num(state.resources.energy.current,0));
  const target=clamp(value,0,Math.min(maxByCapacity,maxByOwned));
  state.resources.energy.current=clamp(num(state.resources.energy.current,0)-(target-previous),0,cap);
  pair[key]=target;
  s.allocation.energy=Object.values(s.data.pairs||{}).reduce((sum,p)=>sum+Math.max(0,num(p.energy,0))+Math.max(0,num(p.upgradeEnergy,0)),0);
}

function selectAugment(state, pairId, upgrade) {
  const s = state.systems.augmentations;
  if (!s.unlocked) throw new Error("SYSTEME_VERROUILLE");
  const def = IDLE_NGU_AUGMENTATIONS.find(x => x.id === pairId);
  if (!def) throw new Error("AUGMENT_INVALIDE");
  s.data.activePair = pairId;
  s.data.trainUpgrade = Boolean(upgrade);
}

function selectRitual(state, ritualId, context) {
  const s = state.systems.bloodMagic;
  if (!s.unlocked) throw new Error("SYSTEME_VERROUILLE");
  const ritual = IDLE_NGU_BLOOD_RITUALS.find(x => x.id === ritualId);
  if (!ritual || !ritualUnlocked(ritual, context)) throw new Error("RITUEL_VERROUILLE");
  s.data.activeRitual = ritualId;
}

function moneyPitTierV48_(gold) {
  const thresholds=[1e5,1e7,1e9,1e11,1e13,1e15,1e18,1e21,1e24,1e27,1e30];
  let tier=0;
  for(let i=0;i<thresholds.length;i+=1){
    if(gold>=thresholds[i])tier=i+1;
    else break;
  }
  return tier;
}

function tossMoneyPit(state, now) {
  const s = state.systems.moneyPit;
  if (!s.unlocked) throw new Error("SYSTEME_VERROUILLE");
  if (now < num(s.data.nextAt, 0)) throw new Error("PUITS_EN_RECHARGE");

  // NGU rule: the pit takes ALL current gold. 100k is only the minimum
  // required to receive a reward; the player cannot choose a smaller toss.
  const cost = Math.floor(Math.max(0, num(state.currencies.gold, 0)));
  if (cost < 100000) throw new Error("OR_INSUFFISANT");
  const tier = moneyPitTierV48_(cost);
  const tosses = Math.max(0, int(s.data.tossesThisRun, 0));

  state.currencies.gold = 0;
  s.data.tossesThisRun = tosses + 1;
  s.data.lastTossAt = now;
  s.data.totalGoldTossed = Math.max(0, num(s.data.totalGoldTossed, 0)) + cost;
  const cooldownHours = 1 + tosses;
  s.data.nextAt = now + cooldownHours * 3600000;
  s.level = Math.max(0, int(s.level, 0)) + 1;

  /*
   * Norman (2026-09-14) : "Regarde bien le wiki pour voir les % de
   * chance... JE VEUX QUE CHAQUE STATISTIQUES SOIENT INTEGREES." Table
   * complète relue directement sur le wiki NGU (page Money Pit, via
   * navigateur — les résultats de recherche étaient trop incomplets) :
   * "It's a random chance between all available rewards" — un seul
   * type de récompense tiré au hasard PARMI ceux listés pour le palier
   * atteint (jamais tous en même temps).
   *
   * Chaque palier réel liste plusieurs colonnes de récompense possibles
   * (Adv Stat, Boost, Adv Max HP, Adv HP Regen, Equip +1lvl, EXP,
   * Wandoos, Seeds). Seules Boost (BOOSTS=[1,2,5,10,20,50,100],
   * exactement les forces du wiki) et EXP/Seeds (déjà de vraies
   * monnaies SOREAL) sont buildables sans construire de toute pièce
   * les stats Adventure séparées, l'amélioration groupée de
   * l'équipement, le boost du Cube ou Wandoos — ces colonnes-là sont
   * honnêtement omises (documenté ici, pas fabriqué) plutôt que
   * remplacées par une valeur inventée.
   */
  /*
   * V212 — les quatre premiers paliers peuvent désormais utiliser les
   * colonnes NGU réellement déjà représentables dans SOREAL IDLE :
   * Adventure Stat, Boost, Adventure Max HP, Adventure HP Regen et EXP.
   * Valeurs du tableau Money Pit NGU :
   * T1 +1 / Boost 1 / +10 HP / +0.1 regen ;
   * T2 +2 / Boost 2 / +20 HP / +0.2 regen / +1 EXP ;
   * T3 +5 / Boost 5 / +50 HP / +0.5 regen / +2 EXP ;
   * T4 +10 / Boost 10 / +75 HP / +1 regen / +3 EXP.
   * Les colonnes Equip/Wandoos/Cube des paliers suivants restent hors de
   * cette passe plutôt que d'être remplacées par une récompense inventée.
   */
  const IDLE_MONEY_PIT_REWARDS_V1 = [
    [],
    [{ adventureStats: 1 }, { boost: 1 }, { adventureHp: 10 }, { adventureRegen: 0.1 }],
    [{ adventureStats: 2 }, { boost: 2 }, { adventureHp: 20 }, { adventureRegen: 0.2 }, { experience: 1 }],
    [{ adventureStats: 5 }, { boost: 5 }, { adventureHp: 50 }, { adventureRegen: 0.5 }, { experience: 2 }],
    [{ adventureStats: 10 }, { boost: 10 }, { adventureHp: 75 }, { adventureRegen: 1 }, { experience: 3 }],
    [{ seeds: 10 }],
    [{ experience: 25 }, { seeds: 25 }],
    [{ experience: 25 }, { seeds: 100 }],
    [{ experience: 200 }, { seeds: 200 }],
    [{ experience: 300 }, { seeds: 300 }],
    [{ experience: 400 }, { seeds: 500 }],
    [{ experience: 500 }, { seeds: 700 }]
  ];
  const candidats = IDLE_MONEY_PIT_REWARDS_V1[Math.min(tier, IDLE_MONEY_PIT_REWARDS_V1.length - 1)];
  const choix = candidats.length ? candidats[Math.floor(Math.random() * candidats.length)] : {};

  const reward = {};
  let boostGrant = null;
  state.adventure.permanent =
    state.adventure.permanent && typeof state.adventure.permanent === "object"
      ? state.adventure.permanent
      : {};

  for (const [k, v] of Object.entries(choix)) {
    if (k === "boost") {
      const type = ["power", "toughness", "special"][Math.floor(Math.random() * 3)];
      boostGrant = idleAdventureBoostV1(type, v);
    } else if (k === "adventureStats") {
      state.adventure.permanent.adventurePower =
        Math.max(0, num(state.adventure.permanent.adventurePower, 0)) + v;
      state.adventure.permanent.adventureToughness =
        Math.max(0, num(state.adventure.permanent.adventureToughness, 0)) + v;
      reward.adventureStats = (reward.adventureStats || 0) + v;
    } else if (k === "adventureHp") {
      state.adventure.permanent.adventureHp =
        Math.max(0, num(state.adventure.permanent.adventureHp, 0)) + v;
      reward.adventureHp = (reward.adventureHp || 0) + v;
    } else if (k === "adventureRegen") {
      state.adventure.permanent.adventureRegen =
        Math.max(0, num(state.adventure.permanent.adventureRegen, 0)) + v;
      reward.adventureRegen = (reward.adventureRegen || 0) + v;
    } else {
      reward[k] = (reward[k] || 0) + v;
    }
  }

  // Wiki (page Money Pit) : AP fixe en plus du tirage, floor(log10(gold)).
  reward.ap = Math.max(0, Math.floor(Math.log10(cost)));

  for (const [k, v] of Object.entries(reward)) {
    if (Object.prototype.hasOwnProperty.call(state.currencies, k)) {
      state.currencies[k] += v;
    }
  }
  if (boostGrant) idleAdventureAddItemV1(state.adventure, boostGrant);

  const resultat={
    cost,
    tier,
    reward,
    boost:boostGrant ? { type: boostGrant.boostType, strength: boostGrant.strength } : null,
    cooldownHours,
    nextAt:s.data.nextAt
  };

  const historique=Array.isArray(s.data.history)?s.data.history:[];
  historique.unshift({
    at:now,
    cost,
    tier,
    reward:Object.assign({},reward),
    boost:resultat.boost
  });
  s.data.history=historique.slice(0,20);

  return resultat;
}

function dailySpinTierV48_(spins) {
  const thresholds=[0,7,14,30,60,120,180,365];
  let tier=0;
  for(let i=0;i<thresholds.length;i+=1){
    if(spins>=thresholds[i])tier=i;
    else break;
  }
  return tier;
}

function spinDaily(state, now) {
  const s = state.systems.dailySpin;
  if (!s.unlocked) throw new Error("SYSTEME_VERROUILLE");
  const previousReadyAt = Math.max(0, num(s.data.readyAt, 0));
  if (now < previousReadyAt) throw new Error("ROUE_PAS_PRETE");

  const totalBefore = Math.max(0, int(s.data.totalSpins, s.level));
  const tier = dailySpinTierV48_(totalBefore);
  /*
   * Norman (2026-09-14) : "Regarde bien le wiki pour voir les % de
   * chance... JE VEUX QUE CHAQUE STATISTIQUES SOIENT INTEGREES." Table
   * complète relue directement sur le wiki NGU (page Daily Spin, via
   * navigateur) : chaque palier liste des lots à pourcentages RÉELS
   * (pondérés, jamais uniformes). Les lots AP/Seeds (déjà de vraies
   * monnaies SOREAL) sont repris avec leurs vrais pourcentages ; les
   * lots non buildables (Potions Energy/Magic, Lucky Charm, Bar Bar,
   * Poop, Consumables Jackpot — aucun n'existe encore côté SOREAL) sont
   * honnêtement omis plutôt que remplacés par une valeur inventée — le
   * jeu n'était de toute façon jamais censé donner de l'Or via la roue
   * (l'ancienne implémentation SOREAL le faisait à tort, jamais présent
   * sur le wiki).
   * Tier 7 (365 spins) : le wiki documente un vrai bug du jeu original
   * ("2000 Seeds (10%)[2]" avec la note "BUG: you get 5000 seeds
   * instead") — repris tel quel (5000), car c'est le comportement RÉEL
   * vécu par les joueurs, pas la valeur nominale jamais atteignable.
   */
  const IDLE_DAILY_SPIN_REWARDS_V1 = [
    [{ ap: 50, poids: 70 }, { ap: 100, poids: 30 }],
    [{ ap: 100, poids: 53 }, { ap: 200, poids: 35 }, { ap: 1000, poids: 10 }],
    [{ ap: 200, poids: 53 }, { ap: 400, poids: 30 }, { ap: 2000, poids: 10 }],
    [{ ap: 300, poids: 37 }, { ap: 600, poids: 25 }, { ap: 3000, poids: 10 }, { seeds: 20, poids: 10 }, { ap: 50000, poids: 0.5 }],
    [{ ap: 500, poids: 50 }, { ap: 1000, poids: 25 }, { ap: 5000, poids: 10 }, { seeds: 100, poids: 5 }, { ap: 75000, poids: 0.5 }],
    [{ ap: 800, poids: 36 }, { ap: 1600, poids: 25 }, { ap: 8000, poids: 10 }, { seeds: 400, poids: 10 }, { ap: 100000, poids: 0.5 }],
    [{ ap: 1200, poids: 35 }, { ap: 2400, poids: 25 }, { ap: 12000, poids: 10 }, { seeds: 2000, poids: 10 }, { ap: 150000, poids: 0.5 }],
    [{ ap: 1500, poids: 35 }, { ap: 3000, poids: 25 }, { ap: 15000, poids: 10 }, { seeds: 5000, poids: 10 }, { ap: 175000, poids: 0.5 }]
  ];
  const table = IDLE_DAILY_SPIN_REWARDS_V1[Math.min(tier, IDLE_DAILY_SPIN_REWARDS_V1.length - 1)];
  const poidsTotal = table.reduce((sum, entree) => sum + entree.poids, 0);
  let curseur = Math.random() * poidsTotal;
  let choix = table[table.length - 1];
  for (const entree of table) {
    if (curseur < entree.poids) { choix = entree; break; }
    curseur -= entree.poids;
  }
  const reward = choix.ap ? { ap: choix.ap } : { seeds: choix.seeds };
  for (const [k, v] of Object.entries(reward)) state.currencies[k] += v;

  s.level = totalBefore + 1;
  s.data.totalSpins = s.level;
  // 24h cadence with up to 12h of lateness banked toward the next spin.
  const bankedMs = Math.min(12 * 3600000, Math.max(0, now - previousReadyAt));
  s.data.readyAt = now + 24 * 3600000 - bankedMs;

  const resultat={
    reward,
    tier,
    totalSpins:s.data.totalSpins,
    bankedMs,
    readyAt:s.data.readyAt
  };
  const historique=Array.isArray(s.data.history)?s.data.history:[];
  historique.unshift({
    at:now,
    tier,
    reward:Object.assign({},reward),
    totalSpins:s.data.totalSpins
  });
  s.data.history=historique.slice(0,20);

  return resultat;
}

function challengeNguLevels(state) {
  return nguTotalLevelsV1(state);
}

function laserSwordPair(state) {
  const pair=state.systems.augmentations?.data?.pairs?.laserSword;
  return {
    level:Math.max(0,int(pair?.level,0)),
    upgradeLevel:Math.max(0,int(pair?.upgradeLevel,0))
  };
}

/*
 * "100 Levels Challenge" (audit 2026-09-16, augments-and-challenges.md) :
 * "total levels gained from Augments+Blood Magic+Time Machine+Wandoos+
 * Beards COMBINED capped at 100/rebirth". Le pool est un simple compteur
 * remis à zéro à chaque Rebirth (applyRebirthResetV56_) ; chaque site de
 * gain (advanceAugmentations, advanceBloodMagic, advanceTimeMachine,
 * advanceTrackSystem pour Wandoos, advanceBeardTrack) vérifie le budget
 * restant AVANT de dépenser une ressource pour ce niveau — jamais après
 * coup, pour ne jamais faire perdre de l'Or déjà dépensé sans le niveau
 * correspondant (même invariant que les gardes "Or insuffisant" déjà
 * présentes dans ces mêmes fonctions).
 */
function challengeHundredLevelsRemaining(state) {
  if (state.challenge?.active !== "hundredLevels") return Infinity;
  return Math.max(0, 100 - Math.max(0, int(state.challenge.hundredLevelsGained, 0)));
}

function challengeHundredLevelsConsume(state, amount) {
  if (state.challenge?.active !== "hundredLevels" || !(amount > 0)) return;
  state.challenge.hundredLevelsGained = Math.max(0, int(state.challenge.hundredLevelsGained, 0)) + amount;
}

function challengeDefinition(id) {
  return IDLE_NGU_NORMAL_CHALLENGES.find(def=>def.id===String(id||"")) || null;
}

function challengeUnlocked(def,state,context={}) {
  if(!def||!state.systems.challenges?.unlocked)return false;
  const highestBoss=Math.max(0,int(state.records.highestBoss,context.bosses||0));
  if(def.id==="basic")return highestBoss>=58;
  if(def.id==="noAugmentations")return highestBoss>=75;
  if(def.id==="twentyFourHours")return num(state.challenge.bestMs?.basic,Infinity)<=24*3600000;
  if(def.id==="hundredLevels")return challengeNguLevels(state)>=10;
  if(def.id==="noEquipment")return Boolean(state.adventure?.completedSets?.grb||state.adventure?.setRewards?.noEquipmentChallenge);
  if(def.id==="troll")return int(state.adventure?.titans?.t2?.kills,0)>0;
  if(def.id==="noRebirth")return int(state.adventure?.titans?.t3?.kills,0)>0;
  if(def.id==="laserSword")return laserSwordPair(state).level>=1&&laserSwordPair(state).upgradeLevel>=1;
  if(def.id==="blind")return int(state.adventure?.titans?.t4?.kills,0)>0;
  if(def.id==="noNgu")return challengeNguLevels(state)>=10000;
  if(def.id==="noTimeMachine")return Boolean(state.systems.diggers?.unlocked);
  return false;
}

function challengeTargetBoss(def,completion) {
  if(!def||!def.targetBoss)return 0;
  return Math.max(0,int(def.targetBoss,0)+Math.max(0,int(completion,0))*Math.max(0,int(def.targetStep,0)));
}

function challengeSnapshotDefinitions(state,context={}) {
  return IDLE_NGU_NORMAL_CHALLENGES.map(def=>{
    const completion=Math.max(0,int(state.challenge.completions?.[def.id],0));
    return Object.assign({},clone(def),{
      completion,
      unlocked:challengeUnlocked(def,state,context),
      targetBoss:challengeTargetBoss(def,completion),
      active:state.challenge.active===def.id
    });
  });
}

function challengeAction(state, payload, context, now) {
  const mode=String(payload.mode||"start");
  if(!state.systems.challenges.unlocked)throw new Error("SYSTEME_VERROUILLE");

  if(mode==="stop"){
    const stopped=String(state.challenge.active||"");
    state.challenge.active="";
    state.challenge.startedAt=0;
    return {stopped:Boolean(stopped),challenge:stopped};
  }

  const id=String(payload.challenge||state.challenge.active||"basic");
  const def=challengeDefinition(id);
  if(!def)throw new Error("DEFI_INVALIDE");

  if(mode==="complete"){
    if(state.challenge.active!==id)throw new Error("DEFI_NON_ACTIF");
    const before=Math.max(0,int(state.challenge.completions[id],0));
    const target=challengeTargetBoss(def,before);
    if(target>0&&num(context.bosses,0)<target)throw new Error("OBJECTIF_NON_ATTEINT");
    if(id==="twentyFourHours"&&now-num(state.challenge.startedAt,now)>24*3600000)throw new Error("DEFI_ECHOUE_TEMPS");
    if(id==="laserSword"){
      // Wiki : "Make a (2/2 + 1/1 per completion) Laser Sword" — palier 2/2 à la 1re, +1/+1 par completion suivante.
      const requiredLevel=2+before;
      const pair=laserSwordPair(state);
      if(pair.level<requiredLevel||pair.upgradeLevel<requiredLevel)throw new Error("OBJECTIF_NON_ATTEINT");
    }

    const elapsed=Math.max(0,now-num(state.challenge.startedAt,now));
    const rewarded=before<Math.max(0,int(def.max,0));
    if(rewarded){
      state.challenge.completions[id]=before+1;
      state.currencies.experience+=Math.max(0,num(def.reward?.experience,0));
      state.currencies.ap+=Math.max(0,num(def.reward?.ap,0));
    }
    const oldBest=num(state.challenge.bestMs?.[id],Infinity);
    state.challenge.bestMs[id]=Math.min(oldBest,elapsed);
    state.challenge.active="";
    state.challenge.startedAt=0;
    return {
      completed:id,
      completion:Math.max(0,int(state.challenge.completions[id],0)),
      targetBoss:target,
      rewarded,
      reward:rewarded?clone(def.reward):{experience:0,ap:0},
      elapsedMs:elapsed
    };
  }

  if(mode!=="start")throw new Error("ACTION_DEFI_INVALIDE");
  if(state.challenge.active)throw new Error("DEFI_DEJA_ACTIF");
  if(!challengeUnlocked(def,state,context))throw new Error("DEFI_VERROUILLE");
  if(!def.implemented)throw new Error("DEFI_EN_PREPARATION");

  // Wiki : "Starting ANY challenge resets NUMBER to 1 and empties banks —
  // EXCEPT the Laser Sword Challenge, which performs only a normal rebirth."
  const isLaserSword=id==="laserSword";
  applyRebirthResetV56_(state,context,now,{
    forceNumber:isLaserSword?undefined:1,
    clearBanks:!isLaserSword,
    challengeId:id
  });

  return {
    started:id,
    challengeReset:!isLaserSword,
    targetBoss:challengeTargetBoss(def,state.challenge.completions[id]),
    number:state.rebirth.number,
    banksCleared:!isLaserSword
  };
}

/*
 * Audit NGU 2026-09-23 : les récompenses de titan (EXP, or, AP, progression
 * de PP) sont cumulées par le moteur Aventure dans adventure.permanent ; ce
 * pont les reverse dans les vraies monnaies. Le PP progress suit la même règle
 * que l'ITOPOD : 1 000 000 de progression = 1 PP.
 */
function crediterRecompensesAventure(state, avant) {
  const p = state.adventure?.permanent || {};
  const gain = (cle) => Math.max(0, num(p[cle], 0) - num(avant[cle], 0));
  state.currencies.experience += gain("experience");
  state.currencies.gold += gain("gold");
  state.currencies.ap += gain("ap");
  state.currencies.qp += gain("qp");
  const pp = gain("ppProgress");
  if (pp > 0) {
    const tower = state.systems.tower;
    if (!tower.data || typeof tower.data !== "object") tower.data = {};
    tower.data.ppProgress = Math.max(0, num(tower.data.ppProgress, 0)) + pp;
    const entiers = Math.floor(tower.data.ppProgress / 1e6);
    if (entiers > 0) {
      tower.data.ppProgress -= entiers * 1e6;
      state.currencies.pp += entiers;
    }
  }
}
/* Niveaux des souhaits (id -> niveau), lus par les récompenses de titans. */
function wishLevelsMapV1(state) {
  const out = {};
  const tracks = state.systems.wishes?.data?.tracks || {};
  for (const id of Object.keys(tracks)) out[id] = Math.max(0, int(tracks[id]?.level, 0));
  return out;
}

function photoRecompensesAventure(state) {
  const p = state.adventure?.permanent || {};
  return {
    qp: num(p.qp, 0),
    experience: num(p.experience, 0),
    gold: num(p.gold, 0),
    ap: num(p.ap, 0),
    ppProgress: num(p.ppProgress, 0)
  };
}

function titanFight(state, context, now) {
  const s = state.systems.titans;
  if (!s.unlocked) throw new Error("SYSTEME_VERROUILLE");

  // Single source of truth: the first Titan is fought by the Adventure V47
  // engine. This keeps cooldown, guaranteed consumables and gear drops in
  // the same persisted state as the Adventure screen.
  const titanChallengeBonuses=challengePermanentBonuses(state);
  const avantRecompenses = photoRecompensesAventure(state);
  const applied = applyIdleAdventureActionV47(
    state.adventure,
    {
      action: "titan",
      titanId: "t1",
      stats: {
        power: Math.max(0, num(context.adventurePower, 0)),
        toughness: Math.max(0, num(context.adventureToughness, context.adventurePower || 0))
      }
    },
    Object.assign({},context,{
      wishLevels:wishLevelsMapV1(state),
      dropMultiplier:Math.max(0,num(idleNguBonuses(state).dropMultiplier,1)),
      titanCooldownReductionMs:titanChallengeBonuses.titanRespawnReductionMs,
      titanLootLevelBonus:titanChallengeBonuses.titanLootLevelBonus
    }),
    now
  );
  state.adventure = applied.state;
  crediterRecompensesAventure(state, avantRecompenses);

  const titanState = state.adventure?.titans?.t1 || { kills: 0, nextAt: 0 };
  s.data.kills = Math.max(0, int(titanState.kills, 0));
  s.data.firstTitanDefeated = s.data.kills > 0;
  s.data.nextAt = Math.max(0, num(titanState.nextAt, 0));
  s.level = s.data.kills;

  return Object.assign(
    { tier: 1, nextAt: s.data.nextAt },
    applied.result || {}
  );
}

function collectSystem(state, id, context, now) {
  if (id === "dailySpin") return spinDaily(state, now);
  if (id === "bloodMagic") return castBloodSpell(state, String(context.spell || "numberBoost"));
  if (id === "yggdrasil") {
    const s = state.systems.yggdrasil;
    if (!s.unlocked) throw new Error("SYSTEME_VERROUILLE");
    const harvests = Math.floor(num(s.data.growth, 0));
    if (harvests <= 0) throw new Error("RIEN_A_RECOLTER");
    s.data.growth -= harvests;
    state.currencies.seeds += harvests;
    s.level += harvests;
    return { harvests };
  }
  throw new Error("ACTION_NON_DISPONIBLE");
}

/*
 * Real per-perk purchase (IDLE_PERKS_CATALOG_V1) — one specific perk id,
 * its own flat per-level cost, up to its own cap. Replaces the previous
 * generic "buyTree" fake single-counter/exponential-cost model for
 * "perks" specifically; the same migration (buyQuirkV1, below) has since
 * been done for "quirks" — buyTree had no remaining callers and was
 * removed (audit 2026-09-14).
 */
function buyPerkV1(state, perkId) {
  const s = state.systems.perks;
  if (!s?.unlocked) throw new Error("SYSTEME_VERROUILLE");
  const perk = idlePerkByIdV1(int(perkId, -1));
  if (!perk) throw new Error("PERK_INTROUVABLE");
  const levels = s.data && typeof s.data === "object" ? s.data.levels : null;
  const currentLevel = Math.max(0, int(levels?.[perk.id], 0));
  const cost = idlePerkNextCostV1(perk, currentLevel);
  if (!Number.isFinite(cost)) throw new Error("PERK_AU_MAXIMUM");
  if (state.currencies.pp < cost) throw new Error("MONNAIE_INSUFFISANTE");
  state.currencies.pp -= cost;
  if (!s.data || typeof s.data !== "object") s.data = { levels: {} };
  if (!s.data.levels || typeof s.data.levels !== "object") s.data.levels = {};
  s.data.levels[perk.id] = currentLevel + 1;
  s.level = Object.values(s.data.levels).reduce((sum, v) => sum + Math.max(0, int(v, 0)), 0);
  return { cost, perkId: perk.id, level: currentLevel + 1, cap: perk.cap };
}

/*
 * Real per-quirk purchase (IDLE_QUIRKS_CATALOG_V1) — one specific quirk id,
 * its own flat per-level cost, up to its own cap. Replaces the previous
 * buyTree(state, "quirks", "qp", 50) fake single-counter/exponential-cost
 * call (audit 2026-09-14, wiki NGU page Quirk Points) — same migration
 * buyPerkV1 already did for Perks.
 */
function buyQuirkV1(state, quirkId) {
  const s = state.systems.quirks;
  if (!s?.unlocked) throw new Error("SYSTEME_VERROUILLE");
  const quirk = idleQuirkByIdV1(int(quirkId, -1));
  if (!quirk) throw new Error("QUIRK_INTROUVABLE");
  const levels = s.data && typeof s.data === "object" ? s.data.levels : null;
  const currentLevel = Math.max(0, int(levels?.[quirk.id], 0));
  const cost = idleQuirkNextCostV1(quirk, currentLevel);
  if (!Number.isFinite(cost)) throw new Error("QUIRK_AU_MAXIMUM");
  if (state.currencies.qp < cost) throw new Error("MONNAIE_INSUFFISANTE");
  state.currencies.qp -= cost;
  if (!s.data || typeof s.data !== "object") s.data = { levels: {} };
  if (!s.data.levels || typeof s.data.levels !== "object") s.data.levels = {};
  s.data.levels[quirk.id] = currentLevel + 1;
  s.level = Object.values(s.data.levels).reduce((sum, v) => sum + Math.max(0, int(v, 0)), 0);
  return { cost, quirkId: quirk.id, level: currentLevel + 1, cap: quirk.cap };
}

export function applyIdleNguAction(raw, payload = {}, context = {}, now = Date.now()) {
  const t = nowMs(now);
  const state = syncIdleNguState(raw, context, t);
  const action = String(payload.action || "").trim();
  let result = {};

  if (action === "adventure") {
    const avantRecompenses = photoRecompensesAventure(state);
    /*
     * Norman (2026-09-14) : "est-ce que tu as ajouté les bonus des sets
     * complets ?" — checkSets() (idle-adventure-v47.js) crédite déjà
     * correctement experience/gold/energySpeedFlat/energyPowerFlat/
     * energyBarsFlat/magicPowerFlat/magicBarsFlat/magicCapFlat dans
     * adventure.permanent (lu par idleNguBonuses() plus haut dans ce
     * fichier, champ `adventurePermanent`, et par le diff experience/gold
     * ci-dessous). Correctif audit 2026-09-18 (PISTE 6) : la fonction citée
     * ici ("idleNguPermanentBonusesV1") n'a jamais existé dans ce fichier
     * (grep confirmé) — les champs *Flat/*Multiplier étaient bien calculés
     * par idleNguBonuses() mais jamais relus ailleurs. Voir désormais
     * idleNguEffectiveResourceStatV1 (plus haut) qui les consomme pour de
     * vrai dans resourceThroughput/idleNguResourceGenerationPerSecond/
     * resourceCapacityForCurrent/advanceGeneratedResources/
     * advanceBeardTrack/advanceTrackSystem/tmLevelSeconds/
     * advanceBloodMagic/augmentationSecondsForNextLevel/
     * reclaimAllocatedResource — mais l'AP de complétion (ex. Badly Drawn Set : 5000,
     * Stealth Set : 10000, UUG's Rings : 20000) restait dans
     * adventure.permanent.ap SANS jamais être diffé vers la vraie
     * monnaie state.currencies.ap, contrairement à experience et gold
     * juste au-dessus (même schéma, oublié pour l'AP spécifiquement).
     */
    const applied = applyIdleAdventureActionV47(
      state.adventure,
      payload.adventure && typeof payload.adventure === "object" ? payload.adventure : payload,
      Object.assign({}, context, {
        /*
         * Adventure rollKill consomme un multiplicateur, pas un pourcentage.
         * Jusqu'ici seul dropChancePct était transmis : tous les bonus réels
         * (Digger, Perks, équipement Drop Chance, Blood Spaghetti...) étaient
         * donc calculés puis perdus avant le jet de loot.
         */
        dropMultiplier: Math.max(0, num(idleNguBonuses(state).dropMultiplier, 1)),
        dropChancePct: num(context.dropChancePct, 0),
        difficulty: state.difficulty,
        wishLevels: wishLevelsMapV1(state),
        titanCooldownReductionMs:challengePermanentBonuses(state).titanRespawnReductionMs,
        titanLootLevelBonus:challengePermanentBonuses(state).titanLootLevelBonus,
        adventureStats: idleAdventureCombatStatsV1(idleAdventureEquipmentStatsV47(state.adventure), context)
      }),
      t
    );
    state.adventure = applied.state;
    /* Expérience, or, AP et progression de PP : voir crediterRecompensesAventure. */
    /*
     * Norman (2026-09-11) : "il faut aussi regarder ce que les mobs sont
     * supposés looter. Il faut qu'ils lootent des golds aussi." Même
     * schéma que l'expérience juste au-dessus : l'or gagné vit dans
     * state.adventure.permanent.gold (idle-adventure-v47.js, rollKill),
     * diffé ici vers la vraie monnaie partagée (state.currencies.gold,
     * déjà utilisée par Augmentations/Time Machine/Blood Magic).
     */
    crediterRecompensesAventure(state, avantRecompenses);
    result = applied.result || {};
    // Consuming one of the permanent unlock items should immediately expose
    // the corresponding system without waiting for another server tick.
    for (const def of IDLE_NGU_SYSTEMS) {
      if (unlockSatisfied(def, context, state)) state.systems[def.id].unlocked = true;
    }
  } else if (action === "allocateNgu") {
    result = setNguAllocationV1(state, String(payload.ngu || ""), num(payload.value, 0), context, payload.tier ? String(payload.tier) : undefined);
  } else if (action === "setNguTier") {
    result = setNguTierV1(state, String(payload.tier || ""));
  } else if (action === "allocate") {
    if (String(payload.system || "") === "ngu") throw new Error("UTILISER_ALLOCATE_NGU");
    setAllocation(
      state,
      String(payload.system || ""),
      String(payload.resource || ""),
      num(payload.value, 0),
      context
    );
  } else if (action === "reclaimResource") {
    result=reclaimAllocatedResource(state,String(payload.resource||"energy"),context);
  } else if (action === "allocateAugment") {
    setAugmentAllocationV214_(state,String(payload.pair||"scissors"),Boolean(payload.upgrade),num(payload.value,0),context);
  } else if (action === "selectTrack") {
    if (String(payload.system || "") === "ngu") throw new Error("UTILISER_ALLOCATE_NGU");
    selectTrack(state, String(payload.system || ""), String(payload.track || ""));
  } else if (action === "selectAugment") {
    selectAugment(state, String(payload.pair || "scissors"), Boolean(payload.upgrade));
  } else if (action === "selectWandoosOs") {
    selectWandoosOs(state, String(payload.os || "98"));
  } else if (action === "selectRitual") {
    selectRitual(state, String(payload.ritual || "tack"), context);
  } else if (action === "castBloodSpell") {
    result = castBloodSpell(state, String(payload.spell || "numberBoost"));
  } else if (action === "toggle") {
    const s = state.systems[String(payload.system || "")];
    if (!s?.unlocked) throw new Error("SYSTEME_VERROUILLE");
    s.active = payload.active === undefined ? !s.active : Boolean(payload.active);
  } else if (action === "buyResource") {
    result = buyResource(state, String(payload.resource || ""), String(payload.stat || "power"), payload.quantity, context);
  } else if (action === "buyNewbieOffer") {
    result = buyNewbieOffer(state, String(payload.resource || ""), String(payload.stat || "power"), String(payload.offerId || ""));
  } else if (action === "upgradeYggFruit") {
    result = upgradeYggFruit(state,String(payload.fruit||"gold"));
  } else if (action === "activateYggFruit") {
    result = activateYggFruit(state,String(payload.fruit||"gold"));
  } else if (action === "useYggFruit") {
    result = useYggFruit(state,String(payload.fruit||"gold"),String(payload.mode||"eat"));
  } else if (action === "upgradeDigger") {
    result = upgradeDigger(state,String(payload.digger||"drop"));
  } else if (action === "setDiggerLevel") {
    result = setDiggerLevel(state,String(payload.digger||"drop"),payload.level);
  } else if (action === "toggleDigger") {
    result = toggleDigger(state,String(payload.digger||"drop"),payload.active);
  } else if (action === "buyPerk") {
    result = buyPerkV1(state, payload.perkId);
  } else if (action === "sellShopBuy") {
    result = idleSelloutShopBuyV1(state, payload.itemId);
  } else if (action === "buyQuirk") {
    result = buyQuirkV1(state, payload.quirkId);
  } else if (action === "collect") {
    const id = String(payload.system || "");
    result = collectSystem(state, id, Object.assign({}, context, { spell: payload.spell }), t);
  } else if (action === "challenge") {
    result = challengeAction(state, payload, context, t);
  } else if (action === "titan") {
    result = titanFight(state, context, t);
    for (const def of IDLE_NGU_SYSTEMS) {
      if (unlockSatisfied(def, context, state)) state.systems[def.id].unlocked = true;
    }
  } else if (action === "moneyPit") {
    result = tossMoneyPit(state, t);
  } else if (action === "difficulty") {
    result = difficultyAction(state, payload, context, t);
  } else if (action === "richJerks") {
    result = richJerksAction(state, payload);
  } else if (action === "buyDigger") {
    result = upgradeDigger(state,String(payload.digger||"drop"));
  } else {
    throw new Error("ACTION_META_INCONNUE");
  }

  state.updatedAt = t;
  state.rebirth = refreshRebirthState(state, context, t);
  return { state, result };
}

function resetRunSystem(def, s) {
  s.progress = 0;
  s.active = false;
  s.allocation = { energy: 0, magic: 0, r3: 0 };
  if ((IDLE_NGU_TRACKS[def.id] || []).length) {
    for (const t of Object.values(s.data.tracks || {})) {
      t.tempLevel = 0;
      t.progress = 0;
    }
    s.tempLevel = 0;
  }
}

function applyNaturalEnergyCapGrowthOnRebirth(state){
  const r=state.resources.energy;
  if(!r)return 0;
  const generated=Math.max(0,num(r.generatedThisRun,0));
  const rawGain=Math.floor(generated/20);
  const room=Math.max(0,100000-Math.min(100000,num(r.cap,0)));
  const gain=Math.min(rawGain,room);
  if(gain>0)r.cap+=gain;
  return gain;
}

function applyRebirthResetV56_(state,context,t,options={}) {
  const runSeconds=Math.max(0,(t-state.runStartedAt)/1000);
  const rb=refreshRebirthState(state,context,t);
  const challengeBefore=String(state.challenge?.active||"");
  const challengeStartedBefore=Math.max(0,num(state.challenge?.startedAt,0));
  const forced=options.forceNumber===undefined||options.forceNumber===null
    ?null
    :Math.max(1,num(options.forceNumber,1));
  const committedNumber=forced===null?rb.nextNumber:forced;

  rb.lastNumber=rb.number;
  rb.number=committedNumber;
  rb.lastBosses=Math.max(0,int(context.bosses,0));
  rb.lastRunSeconds=runSeconds;
  rb.hasPreviousRun=true;
  rb.canRebirth=false;

  // "100 Levels Challenge" pool is explicitly "per rebirth" (audit
  // 2026-09-16) — reset on every rebirth, not just when that challenge starts.
  state.challenge.hundredLevelsGained=0;

  /*
   * Wiki NGU (page "Banks") : les Perks/Quirks "Level Bank" retiennent, à
   * chaque Rebirth, un pourcentage CUMULATIF (simple addition des paliers,
   * pas multiplicatif — confirmé par la colonne "Cumulative bonus" de la
   * page, ex. 5 x 10% Perks + 5 x 5% Quirks = 75%) du niveau atteint en fin
   * de run pour la prochaine run : Time Machine (Speed et Gold séparément)
   * et Beards (niveau temporaire de la track active). Avant ce correctif,
   * seule la LECTURE de state.bank.timeMachineSpeed/Gold existait (elle
   * réamorce bien la run suivante) mais rien n'écrivait jamais dedans, et
   * state.bank.beards n'était ni lu ni écrit : les achats Perks/Quirks
   * "Level Bank" (déjà catalogués, cf idle-perks-v1.js / idle-quirks-v1.js)
   * étaient donc totalement inertes pour ces deux systèmes.
   */
  const tmSpeedLevelEnd=Math.max(0,num(state.systems.timeMachine.data.speedLevel,0));
  const tmGoldLevelEnd=Math.max(0,num(state.systems.timeMachine.data.goldLevel,0));
  const beardsSys=state.systems.beards;
  const beardActiveId=beardsSys?.active?(beardsSys.data?.activeTrack||""):"";
  const beardTempLevelEnd=beardActiveId&&beardsSys?.data?.tracks?.[beardActiveId]
    ?Math.max(0,num(beardsSys.data.tracks[beardActiveId].tempLevel,0))
    :0;

  const beardConversion=convertActiveBeardOnRebirth(state,runSeconds);
  const naturalEnergyCapGain=applyNaturalEnergyCapGrowthOnRebirth(state);

  const perkBankBonuses=perkBonusesV1(state.systems.perks?.data?.levels);
  const quirkBankBonuses=quirkBonusesV1(state.systems.quirks?.data?.levels);
  const tmBankPct=Math.max(0,(perkBankBonuses.tmBankMultiplier-1)+(quirkBankBonuses.tmBankMultiplier-1));
  const beardBankPct=Math.max(0,(perkBankBonuses.beardBankMultiplier-1)+(quirkBankBonuses.beardBankMultiplier-1));
  state.bank.timeMachineSpeed=Math.floor(tmSpeedLevelEnd*tmBankPct);
  state.bank.timeMachineGold=Math.floor(tmGoldLevelEnd*tmBankPct);
  state.bank.beards=Math.floor(beardTempLevelEnd*beardBankPct);

  if(options.clearBanks){
    state.bank.advancedTraining=0;
    state.bank.timeMachineSpeed=0;
    state.bank.timeMachineGold=0;
    state.bank.beards=0;
  }

  for(const resource of RESOURCE_KEYS){
    const r=state.resources[resource];
    if(!r)continue;
    r.current=0;
    r.fillProgress=0;
    r.generatedThisRun=0;
  }

  for(const def of IDLE_NGU_SYSTEMS){
    const s=state.systems[def.id];
    if(def.kind==="run")resetRunSystem(def,s);
    if(def.id==="ngu"){
      clearNguAllocationsV1(s,"energy");
      clearNguAllocationsV1(s,"magic");
      syncNguAllocationTotalsV1(s);
      s.active=false;
    }
    if(def.id==="augmentations")s.data=createAugmentationData();
    if(def.id==="timeMachine"){
      const speedBank=Math.max(0,int(state.bank.timeMachineSpeed,0));
      const goldBank=Math.max(0,int(state.bank.timeMachineGold,0));
      s.data=createTimeMachineData();
      s.data.speedLevel=speedBank;
      s.data.goldLevel=goldBank;
      s.level=speedBank+goldBank;
      s.tempLevel=s.level;
    }
    if(def.id==="bloodMagic"){
      const permanent=clone(s.data.spells);
      s.data=createBloodMagicData();
      s.data.spells.ironPill=Math.max(0,num(permanent.ironPill,0));
    }
    if(def.id==="wandoos"){
      /*
       * Wiki NGU (page "Wandoos", section "Using Wandoos") : "Wandoos
       * Energy and Magic levels are lost when: Rebirthing..." -- seuls
       * les niveaux de Dump (temporaires) sont perdus ; le niveau d'OS
       * total (osLevels) et l'OS sélectionné restent permanents ("Wandoos
       * remains unlocked throughout rebirths").
       */
      const permanentOs=s.data.os;
      const permanentOsLevels=clone(s.data.osLevels);
      s.data=createWandoosData();
      s.data.os=permanentOs;
      s.data.osLevels=permanentOsLevels;
    }
    if(def.id==="beards"&&s.data?.tracks){
      // Wiki NGU (page "Banks") : "banked Beard levels apply right away [on
      // rebirth], without needing to first hit the E/M cap" — the banked
      // amount seeds the NEXT active track's temp level immediately,
      // exactly like Time Machine's speed/gold bank above.
      const beardBank=Math.max(0,int(state.bank.beards,0));
      const nextActiveId=s.data.activeTrack||"";
      const nextTrack=nextActiveId?s.data.tracks[nextActiveId]:null;
      if(nextTrack&&beardBank>0)nextTrack.tempLevel=beardBank;
      s.tempLevel=Object.values(s.data.tracks).reduce((sum,x)=>sum+x.tempLevel,0);
    }
  }

  // Gold and Blood are run currencies in NGU. Permanent currencies survive.
  state.currencies.gold=0;
  state.currencies.blood=0;

  if(state.systems.yggdrasil?.data){
    const ygg=state.systems.yggdrasil.data;
    ygg.reserved={energy:0,magic:0};
    ygg.runPowerAlphaValue=0;
    ygg.runPowerBetaActive=false;
    ygg.runNumbersActive=false;
    for(const f of Object.values(ygg.fruits||{})){
      f.active=false;
      f.growthHours=0;
      f.firstHarvestThisRun=true;
    }
  }

  {
    const pit=state.systems.moneyPit.data;
    const last=Math.max(0,num(pit.lastTossAt,0));
    pit.tossesThisRun=0;
    pit.nextAt=last>0?last+3600000:0;
  }

  const challengeAfter=options.challengeId!==undefined
    ?String(options.challengeId||"")
    :challengeBefore;
  state.challenge.active=challengeAfter;
  state.challenge.startedAt=options.challengeId!==undefined
    ?(challengeAfter?t:0)
    :(challengeAfter?challengeStartedBefore:0);

  /*
   * Norman (2026-09-18) : "il faut tout faire" (fidélité Evil/Sadistic).
   * Wiki NGU (pages "Evil difficulty"/"SADISTIC difficulty") : "there is a
   * choice of rebirthing into normal, evil, or SADISTIC difficulty. A
   * rebirth that changes the difficulty is similar to starting a
   * challenge" -- même mécanique que challengeId ci-dessus (déjà
   * forceNumber:1/clearBanks:true côté appelant, cf. idleNguChangeDifficultyV1).
   * options.difficulty absent = rebirth normal, garde la difficulté
   * actuelle inchangée (jamais une réinitialisation implicite).
   */
  if(options.difficulty!==undefined)state.difficulty=String(options.difficulty);

  state.records.totalRebirths+=1;
  state.runStartedAt=t;
  state.updatedAt=t;
  state.rebirth=rb;
  state.rebirth.nextNumber=rb.number;
  state.rebirth.preview={};
  state.rebirth.beardConversion=beardConversion;
  state.rebirth.resourceGrowth={energyCapGain:naturalEnergyCapGain};
  return state;
}

/*
 * "ITOPOD stat bonus (PP)" (wiki, page "Evil difficulty") : vérifié sur le
 * wiki local (page "Glossary", entrée "Rich Jerks / Perks / Quirks" :
 * "Refers to the EXP purchase, Stat Boosts For Rich Jerks and the Rich
 * Perks and Quirks") -- l'exemple donné sur la page "Evil difficulty"
 * ("500% rich perks (40 PP), and the Newbie Stat Perk (1 PP) is
 * sufficient") liste la Newbie Stat Perk comme participant elle aussi au
 * total, donc "ITOPOD stat bonus (PP)" = la somme de TOUS les perks payés
 * en PP qui boostent Attack/Defense (statPct), pas seulement les 2 perks
 * nommés "Rich Perks" -- exactement perkBonusesV1(...).statMultiplier
 * (idle-perks-v1.js), déjà agrégé sur tout le catalogue (ids 4/5/54).
 */
function idleNguItopodStatBonusPctV1(state) {
  const levels = state?.systems?.perks?.data?.levels;
  return Math.max(0, perkBonusesV1(levels).statMultiplier - 1) * 100;
}

/*
 * "Attack Boost for Rich Jerks (EXP)" (wiki, page "Evil difficulty") :
 * voir state.bonuses.richJerksAttackLevel ci-dessus (baseState) pour la
 * source wiki complète. Exprimé en % (10 par niveau), comme
 * idleNguItopodStatBonusPctV1 ci-dessus, pour reproduire littéralement le
 * "X% x Y%" du wiki.
 */
function idleNguRichJerksAttackPctV1(state) {
  return Math.max(0, num(state?.bonuses?.richJerksAttackLevel, 0)) * RICH_JERKS_PCT_PER_LEVEL_V1;
}

/*
 * Conditions de déblocage Evil/Sadistic (2026-09-18, Norman : "il faut
 * tout faire", fidélité NGU). Sourcé wiki local, pages "Evil difficulty"
 * et "SADISTIC difficulty", section "Unlocking requirements" :
 *
 * Evil (toutes les conditions requises) :
 *   - Reach Boss 301 aka beat boss 300 (en difficulté Normal)
 *   - Attack Boost for Rich Jerks (EXP) x ITOPOD stat bonus (PP) >= 1M %
 *   - The Beast v4 beaten
 *
 * SADISTIC (toutes les conditions requises) :
 *   - Reach Boss 301 aka beat boss 300 on Evil difficulty
 *   - The Exile v4 beaten
 *
 * Les 2 premières conditions Evil sont maintenant entièrement calculables
 * depuis `state` (peaks + Rich Jerks/perks ci-dessus). Les 2 dernières
 * dépendent de systèmes qui n'existent pas encore dans ce moteur au
 * moment de ce correctif :
 *   - aucun suivi "Beast v4 vaincu" n'existe encore (le titan Beast utilise
 *     un système de difficultés Easy/Normal/Hard/Brutal, pas de version
 *     v1-v4) -- context.beastV4Beaten doit être fourni par l'appelant une
 *     fois ce suivi construit ; false par défaut.
 *   - le titan The Exile n'existe pas du tout dans le moteur (aucune
 *     stat/forme/drop) -- context.exileV4Beaten doit être fourni par
 *     l'appelant une fois ce titan construit ; false par défaut.
 * Ce choix (false par défaut, jamais un repli qui déverrouillerait à tort)
 * garde Evil/SADISTIC correctement verrouillés tant que ces prérequis
 * n'existent pas, plutôt que d'inventer un raccourci.
 */
export function idleNguDifficultyUnlockRequirementsV1(state, context = {}) {
  const peaks = state && state.difficultyPeaks ? state.difficultyPeaks : {};
  const bossReadyEvil = num(peaks.normal, 0) >= 301;
  const richJerksItopodBonusPct = idleNguRichJerksAttackPctV1(state) * idleNguItopodStatBonusPctV1(state);
  const richJerksReady = richJerksItopodBonusPct >= 1e6;
  const beastV4Ready = Boolean(context.beastV4Beaten);
  const bossReadySadistic = num(peaks.difficile, 0) >= 301;
  const exileV4Ready = Boolean(context.exileV4Beaten);
  return {
    difficile: {
      met: bossReadyEvil && richJerksReady && beastV4Ready,
      bossReady: bossReadyEvil,
      richJerksReady,
      richJerksItopodBonusPct,
      beastV4Ready
    },
    extreme: {
      met: bossReadySadistic && exileV4Ready,
      bossReady: bossReadySadistic,
      exileV4Ready
    }
  };
}

/*
 * Change de difficulté de Renaissance (2026-09-18, Norman : "il faut tout
 * faire"). Wiki NGU : "there is a choice of rebirthing into normal, evil,
 * or SADISTIC difficulty. A rebirth that changes the difficulty is
 * similar to starting a challenge - number and all last rebirth number
 * factors are reset to 1, and banked levels are lost" -- même mécanique
 * que challengeAction (voir forceNumber:1/clearBanks:true ci-dessous),
 * jamais un simple changement de champ sans les effets de bord réels.
 * Signature alignée sur challengeAction (mute l'état déjà ouvert par
 * applyIdleNguAction, jamais un second syncIdleNguState concurrent).
 */
/*
 * Achat "Rich Jerks" (2026-09-18, Norman : "il faut tout faire").
 * Voir state.bonuses.richJerksAttackLevel (baseState) pour la source
 * wiki : 30 EXP par niveau (plat), +10% Attack OU Defense par niveau,
 * jamais un plafond inventé (le wiki n'en documente aucun pour ce tableau
 * précis, contrairement à d'autres achats de la même page).
 */
function richJerksAction(state, payload) {
  const stat = payload.stat === "defense" ? "defense" : payload.stat === "attack" ? "attack" : null;
  if (!stat) throw new Error("RICH_JERKS_STAT_INVALIDE");
  const levels = Math.max(1, int(payload.levels, 1));
  const cost = levels * RICH_JERKS_COST_EXP_V1;
  if (num(state.currencies.experience, 0) < cost) throw new Error("EXP_INSUFFISANT");
  state.currencies.experience -= cost;
  const key = stat === "attack" ? "richJerksAttackLevel" : "richJerksDefenseLevel";
  state.bonuses[key] = Math.max(0, num(state.bonuses[key], 0)) + levels;
  return { stat, level: state.bonuses[key], pct: state.bonuses[key] * RICH_JERKS_PCT_PER_LEVEL_V1, cost };
}

function difficultyAction(state, payload, context, t) {
  const requested = ["normal", "difficile", "extreme"].includes(payload.value) ? payload.value : null;
  if (!requested) throw new Error("DIFFICULTE_INVALIDE");
  if (requested === state.difficulty) throw new Error("DIFFICULTE_DEJA_ACTIVE");
  if (requested !== "normal") {
    const req = idleNguDifficultyUnlockRequirementsV1(state, context);
    if (!req[requested].met) throw new Error("DIFFICULTE_VERROUILLEE");
  }
  applyRebirthResetV56_(state, context, t, { forceNumber: 1, clearBanks: true, difficulty: requested });
  /*
   * challengeReset:true (2026-09-18) : réutilise le même signal que
   * challengeAction (idle-sqlite-runtime.js::agirProgressionSorealIdle,
   * "if(applique.result&&applique.result.challengeReset)") -- ce
   * changement de difficulté vient de remettre number à 1/vider les banks
   * exactement comme un démarrage de défi ; le moteur de combat de la
   * ladder de boss (état ligne JOUEURS, séparé de ce fichier) doit se
   * réinitialiser à l'identique (BOSS_VAINCUS=0, etc.), pas seulement
   * l'état meta NGU géré ici.
   */
  return { difficulty: requested, challengeReset: true };
}

/*
 * Norman (2026-09-18) : "il faut tout faire" (fidélité Evil/Sadistic).
 * `options.difficulty` (optionnel, absent = comportement strictement
 * inchangé pour tous les appelants existants) : wiki NGU, "at the bottom
 * of the rebirth screen, there is a choice of Normal, Evil difficulty or
 * Sadistic" -- le choix de difficulté fait partie du MÊME clic Rebirth
 * dans le vrai jeu, jamais une action séparée. Quand la difficulté
 * demandée diffère de l'actuelle, applique le même traitement que
 * difficultyAction (déblocage vérifié, number forcé à 1, banks vidées --
 * "similar to starting a challenge").
 */
export function rebirthIdleNguState(raw,context={},now=Date.now(),options={}) {
  const t=nowMs(now);
  const state=syncIdleNguState(raw,context,t);
  if(state.challenge?.active==="noRebirth")throw new Error("REBIRTH_INTERDITE_DEFI");
  if(Math.max(0,int(context.bosses,0))<REBIRTH_UNLOCK_BOSS_V1)throw new Error("REBIRTH_VERROUILLEE_AVENTURE");
  const runSeconds=Math.max(0,(t-state.runStartedAt)/1000);
  if(runSeconds<MIN_REBIRTH_SECONDS)throw new Error("REBIRTH_TROP_TOT");
  const requestedDifficulty=["normal","difficile","extreme"].includes(options.difficulty)?options.difficulty:state.difficulty;
  const changingDifficulty=requestedDifficulty!==state.difficulty;
  if(changingDifficulty&&requestedDifficulty!=="normal"){
    const req=idleNguDifficultyUnlockRequirementsV1(state,context);
    if(!req[requestedDifficulty].met)throw new Error("DIFFICULTE_VERROUILLEE");
  }
  return applyRebirthResetV56_(state,context,t,changingDifficulty?{forceNumber:1,clearBanks:true,difficulty:requestedDifficulty}:{});
}
