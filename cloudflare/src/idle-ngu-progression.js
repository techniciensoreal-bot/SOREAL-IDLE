import {
  createIdleAdventureStateV47,
  normalizeIdleAdventureStateV47,
  applyIdleAdventureActionV47,
  idleAdventureSnapshotV47,
  idleAdventureEquipmentStatsV47,
  idleAdventureBoostV1,
  idleAdventureAddItemV1,
  idleAdventureSpecialItemV1,
  idleAdventureCubeTierV1,
  idleAdventureTitanCooldownMsV1,
  idleAdventureSetRewardProductV1,
  IDLE_ADVENTURE_SPECIALS
} from "./idle-adventure-v47.js";
import {
  idleHeartV1,
  idleHeartsBuyV1,
  idleHeartsExpMultiplierV1,
  idleHeartsApMultiplierV1,
  idleHeartsConsumableFactorV1,
  idleHeartsHackSpeedMultiplierV1,
  idleHeartsPinkCompleteV1
} from "./idle-hearts-v1.js";
import {
  IDLE_ACHIEVEMENTS_V1,
  normalizeIdleAchievementsDataV1,
  idleAchievementsEvaluateV1,
  idleAchievementsBpV1,
  idleAchievementsApMultiplierV1
} from "./idle-achievements-v1.js";
import {
  idleWandoosConsumeCopyV1,
  idleWandoosBootMultiplierV1,
  idleWandoosXlUnlockedV1
} from "./idle-wandoos-os-v1.js";
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
  idleSelloutShopEffectActiveV1,
  createSelloutEffectsV1,
  idleSelloutApplyEffectV1,
  idleSelloutPotionFactorV1,
  tickSelloutEffectsV1,
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
/* Cooking (IT HUNGERS) : moteur isolé dans idle-cooking-v1.js. */
import {
  createIdleCookingDataV1,
  normalizeIdleCookingDataV1,
  advanceIdleCookingV1,
  applyIdleCookingActionV1,
  idleCookingSystemSnapshotV1
} from "./idle-cooking-v1.js";
/* Questing (2026-09-23) : moteur isolé, branché par 4 crochets marqués "Questing" dans ce fichier. */
import {
  advanceIdleQuestingV1,
  applyIdleQuestingActionV1,
  idleQuestingOnZoneKillV1,
  idleQuestingSnapshotV1
} from "./idle-questing-v1.js";
/* MacGuffin Fragments (2026-09-23) : moteur isolé, voir idle-macguffins-v1.js. */
import {
  createMacguffinDataV1,
  normalizeMacguffinDataV1,
  macguffinApplyToBonusesV1,
  macguffinEffectMultiplierV1,
  macguffinApplyRebirthV1,
  macguffinAdventureBeforeV1,
  macguffinAfterAdventureV1,
  macguffinOnItopodKillsV1,
  macguffinEatFruitV1,
  applyMacguffinActionV1,
  macguffinSnapshotV1,
  macguffinPermanentPctV1
} from "./idle-macguffins-v1.js";
/* Verrous de difficulté des Perks et Quirks (wiki : « Evil only » / « Sadistic only »). */
import {
  IDLE_PERK_DIFFICULTE_V1,
  IDLE_QUIRK_DIFFICULTE_V1,
  IDLE_WISH_DIFFICULTE_V1,
  idleDifficulteSuffisanteV1,
  idlePerkNiveauxV1,
  idleQuirkNiveauxV1,
  idleWishTracksActifsV1,
  idleWishAccessibleV1
} from "./idle-difficulty-gates-v1.js";
/* Player Portraits (2026-09-24) et Special Prize : idle-portraits-v1.js. */
import {
  IDLE_SPECIAL_PRIZE_AP_V1,
  idlePortraitsSnapshotV1,
  idlePortraitSelectV1
} from "./idle-portraits-v1.js";
/* Cards et Mayo (système complet dans idle-cards-v1.js). */
import {
  createIdleCardsDataV1,
  normalizeIdleCardsDataV1,
  createIdleCardBonusesV1,
  normalizeIdleCardBonusesV1,
  idleCardsMultiplierV1,
  idleCardsApplyToBonusesV1,
  advanceIdleCardsV1,
  idleCardsActionV1,
  idleCardsGrantChallengeMayoV1,
  idleCardsMayoFruitProgressV1,
  idleCardsSnapshotV1
} from "./idle-cards-v1.js";
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
/* --- Item Daycare (module dédié, voir idle-daycare-v1.js) --- */
import {
  idleDaycareFactorsV1,
  normalizeIdleDaycareDataV1,
  advanceIdleDaycareV1,
  idleDaycarePlaceV1,
  idleDaycareRemoveV1,
  idleDaycareSnapshotV1
} from "./idle-daycare-v1.js";
/* --- Automatisation de l'inventaire (module dédié, voir idle-inventory-auto-v1.js) --- */
import {
  normalizeIdleInventoryAutoV1,
  idleInventoryMergeSlotCountV1,
  idleInventoryLoadoutSlotsV1,
  idleInventoryBoostRecycleChanceV1,
  advanceIdleInventoryAutoV1,
  applyIdleInventoryAutoActionV1,
  idleInventoryAutoSnapshotV1,
  idleInventoryReceiveDropV1,
  idleInventoryProcessNewDropsV1,
  idleInventoryIdsV1,
  idleInventoryManualBoostBeforeV1,
  idleInventoryManualBoostAfterV1
} from "./idle-inventory-auto-v1.js";
/* Yggdrasil : Poop, Auto-Activate, Beast's Fertilizer, perks 16/17, nouveaux fruits (crochets « Ygg extra »). */
import {
  idleYggUsePoopV1,
  idleYggAutoActivateExpShopEntriesV1,
  IDLE_YGG_MAYO_FRUITS_V1,
  IDLE_YGG_MAYO_ACTIVATION_COST_V1,
  idleYggIsMayoFruitV1,
  idleYggMayoFruitBaseV1,
  idleYggActivationCostV1,
  idleYggAutoActivateV1,
  idleYggTierSecondsV1,
  idleYggQuickActivationV1,
  idleYggFruitUnlockedV1,
  idleYggPowerDeltaMultiplierV1,
  idleYggSeedUnitV1,
  idleYggFruitOfQuirksQpV1,
  idleYggExtraSnapshotV1,
  idleYggConsumeGiantSeedV1,
  idleYggItopodPoopV1
} from "./idle-yggdrasil-extra-v1.js";

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
 * débit de ressources. La réduction jusqu'à 3h ("There are Perks and Quirks
 * which can reduce the minimum time, down to 3 hours") est câblée dans
 * wishSpeedParamsV1 : perks 109/110 et quirk 54, 24 s par niveau chacun.
 */
const WISH_MIN_LEVEL_SECONDS = 4 * 3600;
/*
 * Page "Wishes" : "To make more wishes simultaneously, you must unlock more
 * wish slots. You can get 4 wish slots: 1 to start with, 1 from evil mode
 * Troll Challenge 7, 1 from maxing My Pink Heart, 1 from Quirks".
 */
const IDLE_WISH_MAX_SLOTS_V1 = 4;

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
  Object.freeze({id:"twentyFourHours",name:"24 Hour Challenge",max:10,targetBoss:58,targetStep:26,implemented:true,reward:{experience:400,ap:5000,scaleByNumber:true},unlock:{basicUnder24h:true},restriction:"offlineDisabled"}),
  Object.freeze({id:"hundredLevels",name:"100 Levels Challenge",max:5,targetBoss:58,targetStep:0,implemented:true,reward:{experience:500,ap:1500},unlock:{nguLevels:10},restriction:"hundredLevels"}),
  Object.freeze({id:"noEquipment",name:"No Equipment Challenge",max:5,targetBoss:66,targetStep:0,implemented:true,reward:{experience:4000,ap:3000},unlock:{grbSet:true},restriction:"noEquipment"}),
  Object.freeze({id:"troll",name:"Troll Challenge",max:7,targetBoss:69,targetStep:15,implemented:true,reward:{experience:5000,ap:10000},unlock:{titan:"t2"},restriction:"troll"}),
  Object.freeze({id:"noRebirth",name:"No Rebirth Challenge",max:10,targetBoss:40,targetStep:5,implemented:true,reward:{experience:10000,ap:25000},unlock:{titan:"t3"},restriction:"noRebirth"}),
  Object.freeze({id:"laserSword",name:"Laser Sword Challenge",max:20,targetBoss:0,targetStep:0,implemented:true,reward:{experience:3000,ap:3000},unlock:{laserSword:true},restriction:"laserSword"}),
  Object.freeze({id:"blind",name:"Blind Challenge",max:10,targetBoss:58,targetStep:10,implemented:true,reward:{experience:2500,ap:3000},unlock:{titan:"t4"},restriction:"blind"}),
  Object.freeze({id:"noNgu",name:"No NGU Challenge",max:10,targetBoss:58,targetStep:10,implemented:true,reward:{experience:3000,ap:3000},unlock:{nguLevels:10000},restriction:"noNgu"}),
  Object.freeze({id:"noTimeMachine",name:"No Time Machine Challenge",max:10,targetBoss:58,targetStep:15,implemented:true,reward:{experience:2000,ap:2000},unlock:{diggers:true},restriction:"noTimeMachine"})
]);

/*
 * 2026-09-23 (audit, page Challenges) : les défis Evil et Sadistic n'existaient pas -- seule la
 * colonne Normal était modélisée. Chaque difficulté a son propre compteur de complétions, sa
 * table de récompenses (EXP/AP) et ses bonus permanents. Lignes : [max, boss cible, pas par
 * complétion, EXP, AP]. « Boss # does NOT increase » (Sadistic) : pas de 0 pour Basic, No Augs,
 * 100 Levels et No Equipment.
 */
const CHALLENGE_TIER_ROWS_V1 = Object.freeze({
  difficile: {
    basic:[5,58,0,15000,500], noAugmentations:[5,59,0,50000,2000], twentyFourHours:[10,58,26,4000,1000],
    hundredLevels:[5,58,0,20000,1200], noEquipment:[5,66,0,40000,2400], troll:[7,69,15,50000,2000],
    noRebirth:[10,40,5,100000,5000], laserSword:[20,0,0,30000,600], blind:[10,58,10,25000,600],
    noNgu:[10,58,10,30000,600], noTimeMachine:[10,58,15,20000,400]
  },
  extreme: {
    basic:[5,58,0,150000,500], noAugmentations:[5,59,0,500000,2000], twentyFourHours:[10,58,26,40000,1000],
    hundredLevels:[5,58,0,200000,1200], noEquipment:[5,66,0,400000,2400], troll:[7,69,15,500000,2000],
    noRebirth:[10,40,5,1000000,5000], laserSword:[20,0,0,300000,600], blind:[10,58,10,250000,600],
    noNgu:[10,58,10,300000,600], noTimeMachine:[10,58,15,200000,400]
  }
});
const CHALLENGE_TIER_KEYS_V1 = Object.freeze(["difficile", "extreme"]);
export const IDLE_NGU_TIER_CHALLENGES = Object.freeze(Object.fromEntries(
  Object.entries(CHALLENGE_TIER_ROWS_V1).map(([tier, rows]) => [tier, Object.freeze(IDLE_NGU_NORMAL_CHALLENGES.map(base => {
    const r = rows[base.id];
    return Object.freeze(Object.assign({}, base, {
      max:r[0], targetBoss:r[1], targetStep:r[2],
      reward:Object.assign({experience:r[3], ap:r[4]}, base.id === "twentyFourHours" ? {scaleByNumber:true} : {}),
      unlock:{}, tier
    }));
  }))])
));

function challengeTierOfDifficultyV1(difficulty){
  return difficulty==="extreme"?"extreme":difficulty==="difficile"?"difficile":"normal";
}
function challengeTierV1(state){
  if(state?.challenge?.active)return CHALLENGE_TIER_KEYS_V1.includes(state.challenge.activeTier)?state.challenge.activeTier:"normal";
  return challengeTierOfDifficultyV1(state?.difficulty);
}
function challengeDefsForTierV1(tier){
  return tier==="normal"?IDLE_NGU_NORMAL_CHALLENGES:(IDLE_NGU_TIER_CHALLENGES[tier]||IDLE_NGU_NORMAL_CHALLENGES);
}
function challengeCompletionsV1(state,tier){
  if(tier==="normal")return state.challenge.completions;
  const all=state.challenge.completionsTier||(state.challenge.completionsTier=createChallengeTiersV1());
  return all[tier]||(all[tier]={});
}
function createChallengeTiersV1(raw){
  const out={};
  for(const tier of CHALLENGE_TIER_KEYS_V1){
    out[tier]=Object.fromEntries(IDLE_NGU_NORMAL_CHALLENGES.map(def=>[def.id,Math.max(0,int(raw?.[tier]?.[def.id],0))]));
  }
  return out;
}

function challengePermanentBonuses(state){
  const c=state?.challenge?.completions||{};
  const e=state?.challenge?.completionsTier?.difficile||{};
  const s=state?.challenge?.completionsTier?.extreme||{};
  const k=(o,id)=>Math.max(0,int(o[id],0));
  const basic=k(c,"basic");
  const noAugs=k(c,"noAugmentations");
  const noAugsEvil=k(e,"noAugmentations");
  const noEquipment=k(c,"noEquipment");
  const noRebirth=k(c,"noRebirth");
  const noNgu=k(c,"noNgu");
  const noTimeMachine=k(c,"noTimeMachine");
  const noTimeMachineEvil=k(e,"noTimeMachine");
  const trollNormal=k(c,"troll");
  const trollEvil=k(e,"troll");
  const trollSadistic=k(s,"troll");
  const noEquipmentSadistic=k(s,"noEquipment");
  return {
    /* Basic : +5 % par complétion (+10 % la première) en Normal, +10 % par complétion en Evil. */
    adventureStatsMultiplier:1+basic*0.05+(basic>0?0.10:0)+k(e,"basic")*0.10,
    boostRecycleChance:clamp(basic*0.10,0,1),
    augmentationPowerMultiplier:1+noAugs*0.25,
    /* No Augs : +10 % (1re, Normal), Evil +5 % par complétion et +25 % supplémentaires à la dernière. */
    augmentationSpeedMultiplier:1+(noAugs>0?0.10:0)+noAugsEvil*0.05+(noAugsEvil>=5?0.25:0),
    augmentationCostMultiplier:noAugs>=5?0.5:1,
    /* Laser Sword (Normal) : +0,01 x rang de l'augment (Milk = 1) à l'exposant, par complétion. */
    laserSwordExponentStep:k(c,"laserSword")*0.01,
    /* No Equipment : +8 slots par complétion (+10 à la dernière, 50 au total) en Normal ; Evil : +3 par complétion et +9 à la dernière (24 au total, page Inventory). */
    inventorySlots:noEquipment*8+(noEquipment>=5?10:0)+k(e,"noEquipment")*3+(k(e,"noEquipment")>=5?9:0),
    autoBoost:noEquipment>0,
    autoMergeTimeMultiplier:Math.max(0.5,1-noEquipment*0.10),
    /* No Rebirth : -15 min de respawn par complétion pour les titans à partir de Jake (Normal), du Greasy Nerd (Evil), d'IT HUNGERS (Sadistic). */
    titanRespawnReductionMs:noRebirth*15*60*1000,
    titanRespawnReductionEvilMs:k(e,"noRebirth")*15*60*1000,
    titanRespawnReductionSadisticMs:k(s,"noRebirth")*15*60*1000,
    titanLootLevelBonus:noRebirth>0?1:0,
    nguSpeedMultiplier:1+noNgu*0.05,
    /* Troll : Normal 1re = Magic NGU x3 ; Sadistic 1re = Energy NGU x3. */
    nguSpeedMagicChallengeMultiplier:trollNormal>=1?3:1,
    nguSpeedEnergyChallengeMultiplier:trollSadistic>=1?3:1,
    /* Page Broken Time Machine : « les 10 No TM normaux et le 1er No TM Evil donnent +100 % chacun, 1100 % au total ». */
    timeMachineGoldMultiplier:1+noTimeMachine+(noTimeMachineEvil>=1?1:0),
    /* No Time Machine Evil : +10 % de vitesse de la Time Machine par complétion ; 1re = +100 % de gains d'or. */
    timeMachineSpeedMultiplier:1+noTimeMachineEvil*0.10,
    goldDropChallengeMultiplier:1,
    diggerGlobalMultiplier:noTimeMachine>0?1.05:1,
    diggerSlotBonus:noTimeMachine>=5?1:0,
    /* No NGU Evil : +20 % de vitesse des Hacks par complétion ; Troll Evil 5e : +25 % de vitesse des Hacks. */
    hackSpeedChallengeMultiplier:(1+k(e,"noNgu")*0.20)*(trollEvil>=5?1.25:1),
    /* 100 Levels Normal : +20 % de vitesse Wandoos permanente par complétion. */
    wandoosSpeedChallengeMultiplier:1+k(c,"hundredLevels")*0.20,
    /* 24 Hour : +10 % (Normal), +4 % (Evil), +2 % (Sadistic) d'EXP des boss 24+ par complétion. */
    bossExpPct:k(c,"twentyFourHours")*0.10+k(e,"twentyFourHours")*0.04+k(s,"twentyFourHours")*0.02,
    /* No Equipment Sadistic : +2 % d'Idle Attack par complétion, +10 % à la dernière (1,5 x 1,2 = 1,8). */
    idleAttackBonus:noEquipmentSadistic*0.02+(noEquipmentSadistic>=5?0.10:0),
    /* Troll : Normal 2e, Evil 1re, Sadistic 7e = un slot d'accessoire chacun. */
    accessorySlots:(trollNormal>=2?1:0)+(trollEvil>=1?1:0)+(trollSadistic>=7?1:0)
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
      baseGold: 1.5625e23, /* wiki Augmentations : « 156.25 Sext » (sextillion = 1e21) ; corrigé le 2026-09-25 (1,5625e20 était x1000 trop bas) */
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
  {id:"rage",name:"Fruit of Rage",resource:"energy",activationCost:500000000,baseSeeds:5,tierCost:2000,effect:"pp"},
  /* Wiki Yggdrasil, "Fruits and Fruit Effects" : 500 M Magic / 6 graines / T² x 15 000 ; 100 B Energy / 8 / T² x 100 000. */
  {id:"macguffinAlpha",name:"Fruit of MacGuffin α",resource:"magic",activationCost:500000000,baseSeeds:6,tierCost:15000,effect:"macguffinAlpha"},
  /*
   * Wiki Yggdrasil, "Fruits and Fruit Effects" (2026-09-23) : Fruit of Power δ 5 B Energy / 7 graines /
   * T² x 30 000 ; Watermelon 20 B Magic / 30 / T² x 50 000 ("Eating or harvesting grants you extra seeds") ;
   * Fruit of Quirks 40 B Magic / 7 / T² x 25 000 (graines « mangé » sur T, voir idleYggSeedUnitV1).
   * Fruits de Mayo non ajoutés : coût « 10 Qa Energy or Magic » ambigu (idle-yggdrasil-extra-v1.js).
   */
  {id:"powerDelta",name:"Fruit of Power δ",resource:"energy",activationCost:5000000000,baseSeeds:7,tierCost:30000,effect:"powerDelta"},
  {id:"watermelon",name:"Watermelon",resource:"magic",activationCost:20000000000,baseSeeds:30,tierCost:50000,effect:"seeds"},
  {id:"macguffinBeta",name:"Fruit of MacGuffin β",resource:"energy",activationCost:100000000000,baseSeeds:8,tierCost:100000,effect:"macguffinBeta"},
  {id:"quirks",name:"Fruit of Quirks",resource:"magic",activationCost:40000000000,baseSeeds:7,tierCost:25000,effect:"quirks",eatSeedUnit:"linear"},
  /* Fruits de Mayo (2026-09-25) : 10 Qa Energy ou Magic / 10 graines / T² x 250 000 ; effet = progression du générateur de mayo associé. */
  ...IDLE_YGG_MAYO_FRUITS_V1.map(m=>({id:m.id,name:m.name,resource:m.resource,activationCost:IDLE_YGG_MAYO_ACTIVATION_COST_V1,baseSeeds:10,tierCost:250000,effect:"mayo",mayo:m.mayo}))
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
  const created = {
    tracks: out,
    activeTrack: tracks[0].id
  };
  /* Wishes : un souhait et une allocation Energy/Magic/R3 par slot (le slot 1 reprend activeTrack). */
  if (def.id === "wishes") {
    created.slots = Array.from({ length: IDLE_WISH_MAX_SLOTS_V1 }, (_, i) => emptyWishSlotV1(i === 0 ? tracks[0].id : ""));
  }
  return created;
}

function emptyWishSlotV1(wish = "") {
  return { wish, allocation: { energy: 0, magic: 0, r3: 0 } };
}

/*
 * Slots de souhaits (2026-09-23). Invariants maintenus ici à chaque
 * normalisation :
 *  - data.slots : IDLE_WISH_MAX_SLOTS_V1 entrées { wish, allocation } ; un
 *    même souhait n'occupe jamais deux slots (le wiki parle de faire
 *    "more wishes simultaneously", donc des souhaits distincts) ;
 *  - data.activeTrack === slots[0].wish et system.allocation === somme des
 *    allocations des slots (totalAllocated, budgets et Rebirth continuent
 *    de lire system.allocation, comme pour les NGU).
 * Migration / compatibilité : l'ancien état (un seul souhait actif +
 * allocation partagée) devient le slot 1. Plus généralement, tout code
 * qui n'écrit que les anciens champs (activeTrack, allocation) est
 * répercuté sur le slot 1 : slot1 = total - autres slots. Si le total est
 * inférieur à la somme des autres slots, les autres slots sont vidés et
 * le slot 1 reçoit tout le total : la quantité allouée n'est jamais
 * modifiée par la normalisation (aucune ressource créée ni perdue).
 */
function normalizeWishSlotsV1(s, rawData) {
  const valid = new Set((IDLE_NGU_TRACKS.wishes || []).map(t => t.id));
  const src = rawData && typeof rawData === "object" ? rawData : {};
  const hadSlots = Array.isArray(src.slots);
  const slots = [];
  for (let i = 0; i < IDLE_WISH_MAX_SLOTS_V1; i++) {
    const raw = hadSlots ? src.slots[i] : null;
    const slot = emptyWishSlotV1();
    if (raw && typeof raw === "object") {
      const wish = String(raw.wish ?? "");
      slot.wish = valid.has(wish) ? wish : "";
      for (const k of RESOURCE_KEYS) slot.allocation[k] = Math.max(0, num(raw.allocation?.[k], 0));
    }
    slots.push(slot);
  }
  /* Slot 1 vidé volontairement : activeTrack "" n'est conservé que pour une sauvegarde déjà à slots. */
  slots[0].wish = hadSlots && src.activeTrack === "" ? "" : String(s.data.activeTrack || "");
  const seen = new Set(slots[0].wish ? [slots[0].wish] : []);
  for (let i = 1; i < slots.length; i++) {
    if (!slots[i].wish) continue;
    if (seen.has(slots[i].wish)) slots[i].wish = "";
    else seen.add(slots[i].wish);
  }
  for (const k of RESOURCE_KEYS) {
    const total = Math.max(0, num(s.allocation[k], 0));
    const others = slots.slice(1).reduce((sum, x) => sum + x.allocation[k], 0);
    if (total + 1e-9 < others) {
      for (let i = 1; i < slots.length; i++) slots[i].allocation[k] = 0;
      slots[0].allocation[k] = total;
    } else {
      slots[0].allocation[k] = Math.max(0, total - others);
    }
  }
  s.data.slots = slots;
  s.data.activeTrack = slots[0].wish;
  syncWishAllocationTotalsV1(s);
}

function syncWishAllocationTotalsV1(s) {
  for (const k of RESOURCE_KEYS) {
    s.allocation[k] = (s.data.slots || []).reduce((sum, x) => sum + Math.max(0, num(x.allocation?.[k], 0)), 0);
  }
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
    /*
     * Niveaux cibles (écran Broken Time Machine, champ « Target », 0 = désactivé) : une fois le niveau atteint, l'allocation de la piste
     * (Energy pour Machine Speed, Magic pour Gold Multiplier) est retirée automatiquement (Norman, 2026-09-25, d'après sa capture du jeu).
     */
    speedTarget: 0,
    goldTarget: 0,
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
      numbersValue:0,
      /* "Invisible Fruit of Power δ Level" (bonus permanent toujours actif). */
      powerDeltaValue:0
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
 * Money Pit, ITOPOD) sont plafonnées à 100 chacune côté wiki. Sources
 * câblées : ITOPOD (perk 22 "Wandoos Lover"), Money Pit (tossMoneyPit) et,
 * depuis le 2026-09-23, la consommation des copies "A busted copy of
 * Wandoos 98/XL" (action méta consumeWandoosCopy, idle-wandoos-os-v1.js).
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
  /*
   * 2026-09-23 (audit, page Wandoos) : « +4 % au niveau 0, +8 % au niveau 1 ... est trompeur : cela
   * équivaut à 100 % au niveau 0, 200 % au niveau 1 (le temps de remplissage est divisé par deux),
   * jusqu'à 401 fois plus rapide au niveau 400 » -> multiplicateur = niveau + 1.
   */
  return level + 1;
}

/*
 * Boot-up (wiki, section "Boot-up") : "1-hour boot-up process... linear,
 * and ranges from 0-100% speed." Réduit par le set Wandoos XL (-10 %,
 * SETS_OBJETS_V1.wandoosXl, câblé 2026-09-23) et par les défis "100 Levels"
 * complétés EN EVIL (-10% chacun, jusqu'à 5, plancher 27 minutes avec les
 * deux réductions). SOREAL ne distingue pas la difficulté au moment où un
 * défi "100 Levels" a été complété (state.challenge.completions.hundredLevels
 * est un compteur global) : la réduction ci-dessous utilise ce compteur
 * tel quel, un léger sur-crédit possible si des complétions ont eu lieu
 * en Normal — documenté honnêtement, jamais un chiffre inventé. Le set XL
 * multiplie le tout par 0,9 (plancher réel de 27 min = 60 x 0,9 x 0,5).
 */
function wandoosBootFractionV1(state, now, seconds = 0) {
  const hundredLevelsCount = Math.max(0, Math.min(5, int(state.challenge?.completionsTier?.difficile?.hundredLevels, 0)));
  /* Wandoos XL (set) : x0,9 sur la durée du boot (idle-wandoos-os-v1.js), cumulé multiplicativement avec les défis. */
  const bootSeconds = Math.max(1, 3600 * (1 - 0.10 * hundredLevelsCount) * idleWandoosBootMultiplierV1(state));
  const end = Math.max(0, (nowMs(now) - Math.max(0, num(state.runStartedAt, 0))) / 1000);
  const span = Math.max(0, Math.min(end, num(seconds, 0)));
  if (span <= 1e-9) {
    const f = clamp(end / bootSeconds, 0, 1);
    return { fraction: f, afterBootShare: end >= bootSeconds ? 1 : 0 };
  }
  /*
   * 2026-09-24 (audit, page Wandoos, Boot-up : « The speed increase is linear, and ranges from 0-100% speed »)
   * : une fenêtre de temps simulée d'un seul bloc (hors ligne, jusqu'à 30 jours) était multipliée par la
   * vitesse de la FIN de fenêtre. On utilise la vitesse moyenne de la rampe linéaire sur la fenêtre, et la
   * part de la fenêtre écoulée après le boot pour le +10 % du set Wandoos.
   */
  const start = end - span;
  const rampEnd = Math.min(end, bootSeconds);
  const rampStart = Math.min(start, bootSeconds);
  const rampIntegral = (rampEnd * rampEnd - rampStart * rampStart) / (2 * bootSeconds);
  const afterBoot = Math.max(0, end - Math.max(start, bootSeconds));
  return { fraction: clamp((rampIntegral + afterBoot) / span, 0, 1), afterBootShare: afterBoot / span };
}

function advanceWandoos(state, seconds, context, now) {
  const s = state.systems.wandoos;
  if (!s?.unlocked || seconds <= 0) return;
  const osId = IDLE_WANDOOS_OS_V1[s.data.os] ? s.data.os : "98";
  const os = IDLE_WANDOOS_OS_V1[osId];
  const requirement = os.requirement[state.difficulty] || os.requirement.normal;

  const perkBonuses = perkBonusesV1(idlePerkNiveauxV1(state));
  const quirkBonuses = quirkBonusesV1(idleQuirkNiveauxV1(state));
  const totalOsLevel = Math.min(400,
    Math.max(0, perkBonuses.wandoosOsLevelBonus) +
    /* Souhait 4 « I wish money Pit didn't suck » : « Also maxes your money pit Wandoos level » (page Wishes / Money Pit : 100). */
    (wishLevelV1(state, 4) >= 1 ? 100 : Math.max(0, num(s.data.osLevels?.moneyPit, 0))) +
    Math.max(0, num(s.data.osLevels?.consumed98, 0)) +
    Math.max(0, num(s.data.osLevels?.consumedXl, 0))
  );
  const osLevelMultiplier = wandoosOsLevelSpeedMultiplierV1(totalOsLevel);
  const boot = wandoosBootFractionV1(state, now, seconds);
  const bootFraction = boot.fraction;
  const beardWandoos = beardBonusMultiplier(state, "wandoos");
  const diggerWandoos = diggerBonuses(state).wandoos;
  const challengeWandoos = challengePermanentBonuses(state).wandoosSpeedChallengeMultiplier;
  /*
   * "Wandoos Energy/Magic Dump+" (Advanced Training, wiki page "Advanced
   * Training") : "+1% per level" à la vitesse de dump — déjà des pistes
   * réelles chez SOREAL (IDLE_NGU_TRACKS.advancedTraining "wandoosEnergy"/
   * "wandoosMagic"), jamais lues par Wandoos jusqu'ici.
   */
  const atEnergyDumpMultiplier = 1 + atLevelV1(state, "wandoosEnergy") * 0.01;
  const atMagicDumpMultiplier = 1 + atLevelV1(state, "wandoosMagic") * 0.01;
  /*
   * "Energy/Magic Wandoos BEAST-a" (Quirks 15/16, wiki page "Wandoos") :
   * +2%/niveau chacun, Energy et Magic séparément.
   */
  const quirkEnergyMultiplier = 1 + Math.max(0, num(quirkBonuses.wandoosEnergySpeedPct, 0));
  const quirkMagicMultiplier = 1 + Math.max(0, num(quirkBonuses.wandoosMagicSpeedPct, 0));

  const energyAlloc = Math.max(0, num(s.allocation.energy, 0));
  const magicAlloc = Math.max(0, num(s.allocation.magic, 0));
  /* NGU "Wandoos" (Energy) : "Wandoos speed", audit NGU 2026-09-23. */
  const nguWandoosMultiplier = nguFxV1(state).wandoosSpeed * gearPctV1(gearSpecialsV1(state), "wandoosSpeedPct");
  /*
   * Wandoos (set) (wiki "Wandoos" > Boot-up : "After booting-up, it gains a 10% speed boost by
   * maxing the Wandoos set") : +10 % uniquement une fois le boot terminé (bootFraction = 1).
   */
  const wandoosSetMultiplier = 1 + Math.max(0, num(state.adventure?.setRewards?.wandoosBootedSpeedPct, 0)) * boot.afterBootShare;

  /* Plafond de 50 niveaux/s (1 niveau par tick) appliqué APRÈS tous les multiplicateurs. */
  const energySpeed = Math.min(50, (50 * energyAlloc / requirement)
    * idleCardsMultiplierV1(state, "wandoos") /* Cards WANDOOS */
    * osLevelMultiplier * bootFraction * beardWandoos * diggerWandoos * challengeWandoos
    * atEnergyDumpMultiplier * quirkEnergyMultiplier * nguWandoosMultiplier * wandoosSetMultiplier
    * macguffinEffectMultiplierV1(state, "energyWandoos"));
  const magicSpeed = Math.min(50, (50 * magicAlloc / requirement)
    * idleCardsMultiplierV1(state, "wandoos") /* Cards WANDOOS */
    * osLevelMultiplier * bootFraction * beardWandoos * diggerWandoos * challengeWandoos
    * atMagicDumpMultiplier * quirkMagicMultiplier * nguWandoosMultiplier * wandoosSetMultiplier
    * macguffinEffectMultiplierV1(state, "magicWandoos"));

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
    if (def.id === "macguffins") s.data = createMacguffinDataV1();
    if (def.id === "moneyPit") s.data = { tossesThisRun: 0, nextAt: 0, lastTossAt: 0, totalGoldTossed: 0, history: [] };
    if (def.id === "dailySpin") s.data = { readyAt: 0, totalSpins: 0, history: [] };
    if (def.id === "titans") s.data = { nextAt: 0, kills: 0, firstTitanDefeated: false };
    if (def.id === "cooking") s.data = createIdleCookingDataV1();
    if (def.id === "cards") s.data = createIdleCardsDataV1();
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
      /*
       * Classement des joueurs (2026-09-25) : meilleur NUMBER obtenu à un Rebirth, EXP totale GAGNÉE (jamais diminuée par les achats), temps de jeu
       * cumulé (secondes simulées, hors ligne compris) ; expLastSeen = dernière EXP observée, sert à repérer les gains entre deux normalisations.
       */
      bestNumber: 0,
      totalExpEarned: 0,
      expLastSeen: -1,
      playSeconds: 0,
      /* Secret de Rebirth "3 fois de suite < 30 min avec boss 37" (page Rebirths) : série en cours, bonus versé (0/1). */
      speedrunStreak: 0,
      speedrunBonusClaimed: 0,
      /* Portrait de joueur choisi (idle-portraits-v1.js) et « Special Prize » de 50 000 AP (0/1). */
      portrait: "default",
      specialPrizeClaimed: 0,
      /* Choix du Special Prize : 0 aucun, 1 = 50 000 AP, 2 = joli chaton (il donne aussi les AP). Nombre : les records sont coercés en compteurs. */
      specialPrizeChoice: 0,
      // Money Pit, « One-Time Bonuses » déjà versés (masque de bits, 2026-09-24).
      moneyPitOneTimeMask: 0,
      // Newbie Offers achetées (IDLE_NGU_NEWBIE_OFFERS) : permanent, jamais
      // vidé par applyRebirthResetV56_, exactement comme les autres champs
      // de records ci-dessus (highestBoss, totalRebirths...).
      newbieOffersUsed: []
    },
    rebirth: createRebirthState(now),
    systems,
    challenge: {
      active: "",
      activeTier: "normal",
      completionsTier: createChallengeTiersV1(),
      completions: Object.fromEntries(IDLE_NGU_NORMAL_CHALLENGES.map(def=>[def.id,0])),
      startedAt: 0,
      bestMs: {},
      hundredLevelsGained: 0
    },
    bank: {
      advancedTraining: 0,
      /* 2026-09-24 : niveaux d'Advanced Training retenus par piste, versés quand le Basic Training est complété. */
      timeMachineSpeed: 0,
      timeMachineGold: 0,
      beards: 0
    },
    /*
     * 4G's Sellout Shop (audit 2026-09-13) — achats permanents, jamais
     * réinitialisés par un Rebirth (comme l'AP elle-même, confirmée
     * persistante au Rebirth par le wiki NGU, page Rebirths).
     */
    selloutEffects: { remaining: {}, beta: {}, bluePills: 0 },
    selloutShop: {
      purchases: {}
    },
    bonuses: {
      /* Bonus accumulés des cartes lancées, en % par type (idle-cards-v1.js) ; conservés au Rebirth. */
      cards: createIdleCardBonusesV1(),
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
      richJerksDefenseLevel: 0,
      /* Spend EXP > Adventure / Misc (2026-09-23) : compteurs d'achats. */
      expShop: {}
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
  if (def.id === "beards") {
    /* 2026-09-23 : plusieurs Beards actives en même temps (une par slot). Ancien état : activeTrack seul. */
    const valid = new Set((IDLE_NGU_TRACKS.beards || []).map(t => t.id));
    const list = Array.isArray(source.activeTracks) ? source.activeTracks.filter(id => valid.has(id)) : (out.activeTrack ? [out.activeTrack] : []);
    out.activeTracks = Array.from(new Set(list));
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
    for (const key of ["speedLevel", "speedProgress", "goldLevel", "goldProgress", "speedTarget", "goldTarget", "bestGoldThisRun", "highestBossEver", "producedThisRun"]) {
      s.data[key] = Math.max(0, num(s.data[key], 0));
    }
    s.data.speedTarget = Math.floor(s.data.speedTarget);
    s.data.goldTarget = Math.floor(s.data.goldTarget);
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
  } else if (def.id === "cooking") {
    s.data = normalizeIdleCookingDataV1(src.data);
  } else if (def.id === "macguffins") {
    s.data = normalizeMacguffinDataV1(src.data);
  } else if (def.id === "cards") {
    s.data = normalizeIdleCardsDataV1(src.data);
  } else if (def.id === "achievements") {
    s.data = normalizeIdleAchievementsDataV1(src.data);
  } else if ((IDLE_NGU_TRACKS[def.id] || []).length) {
    s.data = normalizeTracks(def, src.data);
    if (def.id === "wishes") normalizeWishSlotsV1(s, src.data);
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
    if (key === "newbieOffersUsed" || key === "portrait") continue;
    state.records[key] = Math.max(0, num(state.records[key], 0));
  }
  state.records.newbieOffersUsed = legacyNewbieOffersUsed.filter(id => typeof id === "string" && id);
  state.records.portrait = typeof state.records.portrait === "string" && state.records.portrait ? state.records.portrait : "default";

  state.challenge = Object.assign(state.challenge, src.challenge || {});
  state.challenge.completions = Object.assign(
    baseState(now).challenge.completions,
    src.challenge?.completions || {}
  );
  state.challenge.bestMs = Object.assign({},src.challenge?.bestMs || {});
  state.challenge.completionsTier = createChallengeTiersV1(src.challenge?.completionsTier);
  state.challenge.activeTier = CHALLENGE_TIER_KEYS_V1.includes(src.challenge?.activeTier) ? src.challenge.activeTier : "normal";

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
    state.selloutEffects = createSelloutEffectsV1(src.selloutEffects);
  }

  state.bonuses = Object.assign(state.bonuses, src.bonuses || {});
  state.bonuses.cards = normalizeIdleCardBonusesV1(src.bonuses?.cards);
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
  state.selloutEffects = createSelloutEffectsV1(source.selloutEffects);
  appliquerConsommablesSetsAventureV1(state);

  state.records = Object.assign(baseState(t).records, source.records || {});
  /*
   * newbieOffersUsed est un tableau d'ids (IDLE_NGU_NEWBIE_OFFERS), pas un
   * compteur numérique — exclu de la coercion Math.max(0,num(...)) juste en
   * dessous (qui le réduirait sinon à 0 via Number([...]) === NaN/0) et
   * assaini séparément pour tolérer une sauvegarde corrompue.
   */
  const newbieOffersUsedSrc = Array.isArray(state.records.newbieOffersUsed) ? state.records.newbieOffersUsed : [];
  for (const k of Object.keys(state.records)) {
    if (k === "newbieOffersUsed" || k === "portrait") continue;
    state.records[k] = Math.max(0, num(state.records[k], 0));
  }
  state.records.newbieOffersUsed = Array.from(new Set(newbieOffersUsedSrc.filter(id => typeof id === "string" && id)));
  /* Portrait de joueur choisi (idle-portraits-v1.js) : identifiant texte, pas un compteur. */
  state.records.portrait = typeof state.records.portrait === "string" && state.records.portrait ? state.records.portrait : "default";

  state.challenge = Object.assign(baseState(t).challenge, source.challenge || {});
  state.challenge.completions = Object.assign(baseState(t).challenge.completions, source.challenge?.completions || {});
  state.challenge.completionsTier = createChallengeTiersV1(source.challenge?.completionsTier);
  state.challenge.activeTier = CHALLENGE_TIER_KEYS_V1.includes(source.challenge?.activeTier) ? source.challenge.activeTier : "normal";
  state.bank = Object.assign(baseState(t).bank, source.bank || {});
  state.bonuses = Object.assign(baseState(t).bonuses, source.bonuses || {});
  state.bonuses.cards = normalizeIdleCardBonusesV1(source.bonuses?.cards);

  const systems = {};
  for (const def of IDLE_NGU_SYSTEMS) systems[def.id] = normalizeSystem(def, source.systems?.[def.id]);
  state.systems = systems;

  /*
   * 2026-09-23 (audit) : slots d'inventaire / d'accessoires venant des Perks, des
   * souhaits "more Inventory space" (1 par niveau) et des No Equipment Challenges
   * -- calculés mais jamais lus, les capacités étant des constantes.
   */
  {
    const perks = perkBonusesV1(idlePerkNiveauxV1(state));
    const wishes = wishBonusesV1(idleWishTracksActifsV1(state));
    /*
     * 2026-09-24 (seconde passe) : perk 25 « The Loot Goblin's Blessing » (lootGoblinChance) était agrégé
     * mais jamais lu. Page Inventory, Higher Level Drops : « a 1% chance that any item dropped at lvl 1 or
     * higher gains +1 level. This can be bought 10 times and stacks with the Gaudy Set Bonus » -- ajouté
     * au même tirage que le set Gaudy et Fibonacci 144 (dropLevelAdventureV2, idle-adventure-v47.js).
     */
    state.adventure.bonusDropLevelChance = Math.min(1, perks.lootLevelChance + perks.lootGoblinChance);
    state.adventure.idleAttackBonus = Math.max(0, num(challengePermanentBonuses(state).idleAttackBonus, 0));
    /* Dual Wielding : ratio de la seconde arme = 0,05 x (niveau du souhait 28 + niveau du souhait 45), maximum 1 (wiki Wishes ; source tierce player.ts). */
    state.adventure.dualWieldRatio = Math.min(1, 0.05 * (Math.max(0, wishLevelV1(state, 28)) + Math.max(0, wishLevelV1(state, 45))));
    state.adventure.bonusSlots = {
      inventory: Math.max(0, int(perks.inventorySlots, 0)) + Math.max(0, int(quirkBonusesV1(idleQuirkNiveauxV1(state)).inventorySlotBonus, 0)) + Math.max(0, int(challengePermanentBonuses(state).inventorySlots, 0)) + Math.max(0, int(wishes.inventorySlots, 0)) + Math.max(0, int(state.selloutShop?.purchases?.extraInventorySpace, 0)) + expShopPurchasedV1(state, "inventorySpace"),
      accessory: Math.max(0, int(perks.accessorySlotBonus, 0)) + Math.max(0, int(quirkBonusesV1(idleQuirkNiveauxV1(state)).accessorySlotBonus, 0)) + Math.max(0, int(challengePermanentBonuses(state).accessorySlots, 0)) + ["extraAccessorySlot1", "extraAccessorySlot2", "extraAccessorySlot3", "extraAccessorySlot4", "extraAccessorySlot5", "extraAccessorySlotEvil"].reduce((sum, id) => sum + Math.min(1, int(state.selloutShop?.purchases?.[id], 0)), 0) + expShopPurchasedV1(state, "accessorySlot1") + expShopPurchasedV1(state, "accessorySlot2") + (wishLevelV1(state, 109) >= 1 ? 1 : 0)
    };
  }

  /* Automatisation de l'inventaire : nombre de slots d'automerge (lu par le moteur d'Aventure) et réglages. */
  state.adventure.mergeSlots = idleInventoryMergeSlotCountV1(state);
  state.adventure.inventoryAuto = normalizeIdleInventoryAutoV1(state.adventure.inventoryAuto);

  /* Item Daycare : données des slots, et déblocage dès qu'un slot existe (« shows up once a daycare slot has been purchased »). */
  state.systems.daycare.data = normalizeIdleDaycareDataV1(state.systems.daycare.data);
  if (idleDaycareFactorsV1(daycareBaseInputsV1(state)).slots > 0) state.adventure.unlockFlags.daycareSlotPurchased = true;

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
  applyYggQuickActivationV1(state, t);
  state.rebirth = refreshRebirthState(state, context, t);
  trackLeaderboardStatsV1(state);
  return state;
}

/*
 * Statistiques du classement qui ne se déduisent pas de l'état courant (voir records.bestNumber / totalExpEarned / playSeconds) :
 *  - EXP totale gagnée : chaque hausse de l'EXP depuis la dernière observation est un gain ; une baisse est un achat (ignoré). Les achats passent
 *    par une action, qui normalise d'abord l'état : les gains précédents sont donc déjà comptés au moment de la dépense.
 *  - Meilleur NUMBER : le NUMBER en cours vient d'un Rebirth ; comptes existants (au moins un Rebirth) initialisés à leur NUMBER actuel.
 */
function trackLeaderboardStatsV1(state) {
  const r = state.records;
  const exp = Math.max(0, num(state.currencies?.experience, 0));
  const vue = num(r.expLastSeen, -1);
  if (vue < 0) r.totalExpEarned = Math.max(num(r.totalExpEarned, 0), exp);
  else if (exp > vue) r.totalExpEarned = num(r.totalExpEarned, 0) + (exp - vue);
  r.expLastSeen = exp;
  if (num(r.totalRebirths, 0) > 0) r.bestNumber = Math.max(num(r.bestNumber, 0), num(state.rebirth?.number, 0));
}

/*
 * 2026-09-24 (audit, page Yggdrasil, Perk Points) : « Quicker Power Fruit Beta Activation » /
 * « Quicker Fruit of Numbers Bonus Activation » (perks 16 et 17, 50 PP) : « The Fruit of Power Beta's
 * bonus will automatically turn on after 30 minutes » (« Fruit of Power β and Fruit of Numbers' bonuses
 * are only activated after eating that fruit at least once during the current rebirth, or by buying the
 * respective quicker activation perk »). Leur bonus était vide : le multiplicateur n'était jamais
 * actif sans avoir mangé le fruit. Les 30 minutes se comptent depuis le début du Rebirth.
 */
function applyYggQuickActivationV1(state, now) {
  const ygg = state.systems.yggdrasil?.data;
  if (!ygg) return;
  const levels = idlePerkNiveauxV1(state);
  const runSeconds = Math.max(0, (nowMs(now) - Math.max(0, num(state.runStartedAt, 0))) / 1000);
  if (runSeconds < 1800) return;
  if (num(levels[16], 0) >= 1) ygg.runPowerBetaActive = true;
  if (num(levels[17], 0) >= 1) ygg.runNumbersActive = true;
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

/*
 * Page « Yggdrasil » : « Your Fruit of Numbers Bonus is based off your
 * Invisible Fruit of Numbers Level^1.3 * 0.05% », actif seulement si le fruit
 * a été mangé pendant ce Rebirth ; page « NUMBER » : facteur « Yggdrasil
 * NUMBER Bonus ... if activated this rebirth » du PROCHAIN NUMBER.
 */
function yggFruitNumbersMultiplierV1(state) {
  const ygg = state.systems.yggdrasil?.data;
  if (!ygg || !ygg.runNumbersActive) return 1;
  return 1 + Math.pow(Math.max(0, num(ygg.permanent?.numbersValue, 0)), 1.3) * 5e-4;
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
    /* 2026-09-24 (page NUMBER) : Fruit of Numbers et Number Hack sont des facteurs du prochain NUMBER. */
    yggNumberBonus: yggFruitNumbersMultiplierV1(state),
    /* NUMBER MacGuffin Fragment : bonus permanent (idle-macguffins-v1.js). */
    macguffinNumberBonus: macguffinEffectMultiplierV1(state, "number"),
    /* Page Hacks : « Hacks do not affect Normal mode » (hackFxV1 renvoie 1 en Normal). */
    hacksNumberBonus: hackFxV1(state).number,
    sadisticBossMultiplierBonus:
      perkBonusesV1(idlePerkNiveauxV1(state)).sadisticBossMultiplierBonus +
      quirkBonusesV1(idleQuirkNiveauxV1(state)).sadisticBossMultiplierBonus +
      0.001 * (wishLevelV1(state, 107) + wishLevelV1(state, 108))
  });
  rb.nextNumber = preview.nextNumber;
  const minRebirth = minRebirthSecondsV1(state);
  rb.canRebirth = runSeconds >= minRebirth && Math.max(0, int(context.bosses, 0)) >= REBIRTH_UNLOCK_BOSS_V1;
  rb.minimumRebirthSeconds = minRebirth;
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
export function idleNguEffectiveResourceStat(raw, resource, stat) {
  const state = raw && raw.version === IDLE_NGU_META_VERSION ? raw : normalizeIdleNguState(raw || {});
  return idleNguEffectiveResourceStatV1(state, resource, stat);
}

/*
 * 2026-09-24 (audit de composition, pages Energy / Magic / Resource 3 / Experience > Spend EXP) :
 * « Energy Power is limited to a maximum of 1E18 (4.84E18 when using potions) », « Capped at 1 Qi
 * (1E18) before potion effects », Bars « 1E18 (2.2E18 when using an Energy Bar Bar) », Cap « 9E18 ».
 * 4,84 = (2 x 1,1)^2 : le plafond s'applique au TOTAL (achats + bonus de perks, quirks, souhaits,
 * équipement) AVANT les potions / Bar Bar, qui le multiplient ensuite. Le code ne plafonnait que
 * les achats bruts (IDLE_NGU_RESOURCE_PURCHASES.hardCap) : les multiplicateurs les dépassaient sans limite.
 */
const RESOURCE_STAT_HARD_CAPS_V1 = Object.freeze({ power: 1e18, bars: 1e18, cap: 9e18 });

function idleNguEffectiveResourceStatV1(state, resource, stat) {
  const value = idleNguEffectiveResourceStatUncappedV1(state, resource, stat);
  const hard = RESOURCE_STAT_HARD_CAPS_V1[stat];
  if (!hard || (resource !== "energy" && resource !== "magic" && resource !== "r3")) return value;
  const potionKey = stat === "power" ? `${resource}Power` : (stat === "bars" && resource !== "r3" ? `${resource}Bars` : "");
  const potion = potionKey ? Math.max(1, num(idleSelloutPotionFactorV1(state, potionKey), 1)) : 1;
  return value / potion > hard ? hard * potion : value;
}

function idleNguEffectiveResourceStatUncappedV1(state, resource, stat) {
  const raw = Math.max(0, num(state.resources?.[resource]?.[stat], 0));
  if (resource !== "energy" && resource !== "magic" && resource !== "r3") return raw;
  const bonuses = idleNguBonuses(state);
  if (resource === "r3") {
    /* Bonus "base" (Incriminating Evidence (set) : +2 Power, +80K Cap, +2 Bars) ajoutés au brut avant les multiplicateurs. */
    if (stat === "power") return (raw + Math.max(0, num(bonuses.r3PowerFlat, 0))) * Math.max(0, num(bonuses.r3PowerMultiplier, 1));
    if (stat === "bars") return (raw + Math.max(0, num(bonuses.r3BarsFlat, 0))) * Math.max(0, num(bonuses.r3BarsMultiplier, 1));
    if (stat === "cap") return (raw + Math.max(0, num(bonuses.r3CapFlat, 0))) * Math.max(0, num(bonuses.r3CapMultiplier, 1));
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
  /* Resource 3 (wiki Resource 3 / Hacks / Wishes) : générée par speed et bars comme Energy et Magic, une fois les Hacks débloqués. */
  if(resource==="r3"&&!state.systems.hacks?.unlocked)return 0;
  if(resource==="magic"&&!state.systems.bloodMagic?.unlocked)return 0;
  const r=state.resources[resource]||defaultResource(resource);
  const speed=clamp(idleNguEffectiveResourceStatV1(state,resource,"speed"),0.1,50);
  const ticksPerFill=Math.max(1,Math.ceil(50/speed));
  const fillsPerSecond=50/ticksPerFill;
  const bars=idleNguEffectiveResourceStatV1(state,resource,"bars");
  return fillsPerSecond*Math.max(1,bars);
}

/*
 * Énergie « obtenue » (2026-09-25, Norman : « quand je rebirth dans NGU, mon maximum d'énergie est de 916 contre 512 dans SOREAL IDLE, en faisant
 * exactement la même chose dans les deux jeux »). Wiki (page Energy) : le cap augmente de 1 « every 20 Energy you get, at every rebirth ». 512 = 500 +
 * ⌊250/20⌋ : SOREAL ne comptait que les 250 points qui remplissaient la réserve jusqu'au cap, puis plus rien, alors que la barre d'énergie de NGU
 * continue de se remplir au cap et que chaque remplissage compte comme énergie obtenue (916 = 500 + ⌊8 3xx/20⌋). generatedThisRun compte donc TOUT
 * ce que la barre produit (bars par remplissage), même la part perdue faute de place ; la réserve, elle, reste plafonnée au cap.
 */
function advanceGeneratedResources(state,seconds,context={}){
  if(seconds<=0)return;
  for(const resource of ["energy","magic","r3"]){
    if(resource==="magic"&&!state.systems.bloodMagic?.unlocked)continue;
    if(resource==="r3"&&!state.systems.hacks?.unlocked)continue;
    const r=state.resources[resource];
    const capacity=resourceCapacityForCurrent(state,resource,context);
    const pleine=capacity<=r.current+1e-12;
    const perSecond=idleNguResourceGenerationPerSecond(state,resource);
    const bars=Math.max(1,idleNguEffectiveResourceStatV1(state,resource,"bars"));
    const fillsPerSecond=perSecond/bars;
    const fillTotal=Math.max(0,num(r.fillProgress,0))+fillsPerSecond*seconds;
    const fullFills=Math.floor(fillTotal+1e-12);
    r.fillProgress=clamp(fillTotal-fullFills,0,0.999999999999);
    if(fullFills<=0)continue;
    const possibleGain=fullFills*bars;
    const gain=pleine?0:Math.min(possibleGain,Math.max(0,capacity-r.current));
    r.current+=gain;
    r.generatedThisRun+=possibleGain;
    if(!pleine&&gain+1e-12<possibleGain)r.fillProgress=0;
  }
}

export function idleNguResourceBudget(raw, resource, context = {}) {
  if (!RESOURCE_KEYS.includes(resource)) throw new Error("RESSOURCE_INVALIDE");
  const state = raw && raw.version === IDLE_NGU_META_VERSION
    ? raw
    : normalizeIdleNguState(raw, context, raw?.updatedAt || Date.now());
  /* 2026-09-23 (audit) : le cap est le cap EFFECTIF (perks, quirks, wishes, équipement), comme pour la génération. */
  const cap=Math.max(0,idleNguEffectiveResourceStatV1(state,resource,"cap"));
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
  const cap = Math.max(0, idleNguEffectiveResourceStatV1(state, resource, "cap"));
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
    if(def.id==="wishes")clearWishSlotAllocationsV1(s,resource);
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
  const challengeSpeed=challengePermanentBonuses(state).augmentationSpeedMultiplier*idleCardsMultiplierV1(state,"augments"); /* + Cards AUGS */
  const difficultyDivider = idleNguDifficultySpeedDividerV1(state, "augmentations");
  const gearAugmentSpeed = gearPctV1(gearSpecialsV1(state), "augmentSpeedPct");
  /*
   * 2026-09-24 (audit de composition, page « Augmentations ») : « All
   * Augmentation Upgrades ... cost Base Cost * n² in gold where n is the level
   * you want to upgrade the augment to, and cost Base Cost * n in energy in the
   * same manner as Augmentations » -- le coût en énergie (donc le temps à
   * allocation/puissance égales, « Base Time » = 1er niveau) est multiplié par
   * le niveau visé n, pour l'Augment comme pour son Upgrade. Il était constant.
   */
  const targetLevel = Math.max(1, int(upgrade ? pair.upgradeLevel : pair.level, 0) + 1);
  return targetLevel * base * 1000 * difficultyDivider / Math.max(1e-12, allocation * power * challengeSpeed * gearAugmentSpeed * hackFxV1(state).augmentSpeed * perkBonusesV1(idlePerkNiveauxV1(state)).augmentSpeedMultiplier * macguffinEffectMultiplierV1(state, "augmentSpeed"));
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
  const laserStep = challengePermanentBonuses(state).laserSwordExponentStep;
  const pairs = state.systems.augmentations.data.pairs;
  for (const def of IDLE_NGU_AUGMENTATIONS) {
    const p = pairs[def.id];
    if (!p || p.level <= 0) continue;
    const augmentRank = IDLE_NGU_AUGMENTATIONS.indexOf(def);
    const augment = def.baseMultiplier * safePow(p.level, def.exponent + laserStep * augmentRank);
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

/*
 * Page Beards of Power : 7 slots -- 1 au déblocage, 1 Troll Normal (complétion 4), 1 boutique EXP (50 000 EXP),
 * 4 boutique Sellout. Plusieurs Beards actives ralentissent celles qui utilisent la même ressource :
 * diviseur = nombre de Beards actives sur cette ressource (x0,9 avec le set Beardverse, minimum 1).
 */
function beardSlotsV1(state) {
  const troll = int(state.challenge?.completions?.troll, 0) >= 4 ? 1 : 0;
  const exp = expShopPurchasedV1(state, "beardSlot");
  const sellout = Math.max(0, Math.min(4, int(state.selloutShop?.purchases?.extraBeardSlot, 0)));
  return Math.min(7, 1 + troll + exp + sellout);
}
function beardActiveIdsV1(state) {
  const s = state.systems.beards;
  if (!s || !s.active) return [];
  const data = s.data || {};
  const list = Array.isArray(data.activeTracks) ? data.activeTracks : (data.activeTrack ? [data.activeTrack] : []);
  const defs = IDLE_NGU_TRACKS.beards || [];
  return list.filter(id => {
    const def = defs.find(x => x.id === id);
    return def && beardTrackUnlocked(state, def) && data.tracks?.[id];
  }).slice(0, beardSlotsV1(state));
}

/*
 * Slots de souhaits (page "Wishes", 4 au total) : 1 de base ; 1 à la 7e
 * complétion du Troll Challenge en Evil (page Challenges, Troll Challenge :
 * "Completion 7 Reward(s) ... Unlock a Wish Slot!" ; page Wishes, tableau
 * Challenges : "Evil Troll Challenge 7 | Unlock a Wish Slot") ; 1 en
 * "maxant" My Pink Heart (fiche "Pink Heart (set)" : "Gain an additional
 * Wish slot!", bonus de complétion obtenu au niveau 100 -- completedSets,
 * idle-adventure-v47.js) ; 1 par la quirk 56 "A Wish Slot!".
 */
function wishSlotBreakdownV1(state) {
  return {
    base: 1,
    trollEvil: int(state.challenge?.completionsTier?.difficile?.troll, 0) >= 7 ? 1 : 0,
    pinkHeart: idleHeartsPinkCompleteV1(state) ? 1 : 0,
    quirk: Math.min(1, Math.max(0, int(quirkBonusesV1(idleQuirkNiveauxV1(state)).wishSlotBonus, 0)))
  };
}
function wishSlotCountV1(state) {
  const b = wishSlotBreakdownV1(state);
  return Math.min(IDLE_WISH_MAX_SLOTS_V1, b.base + b.trollEvil + b.pinkHeart + b.quirk);
}

/* Un slot non débloqué ne garde jamais de ressources : elles retournent au stock libre. */
function releaseLockedWishSlotsV1(state, s) {
  const count = wishSlotCountV1(state);
  (s.data.slots || []).forEach((slot, i) => {
    if (i < count) return;
    for (const k of RESOURCE_KEYS) {
      const amount = Math.max(0, num(slot.allocation?.[k], 0));
      if (amount <= 0) continue;
      slot.allocation[k] = 0;
      if (state.resources[k]) state.resources[k].current = num(state.resources[k].current, 0) + amount;
    }
  });
  syncWishAllocationTotalsV1(s);
}

function clearWishSlotAllocationsV1(s, resource) {
  for (const slot of s?.data?.slots || []) {
    if (slot?.allocation) slot.allocation[resource] = 0;
  }
}

function wishSlotIndexV1(state, slot) {
  const idx = Number(slot);
  if (!Number.isInteger(idx) || idx < 0 || idx >= IDLE_WISH_MAX_SLOTS_V1) throw new Error("SLOT_SOUHAIT_INVALIDE");
  if (idx >= wishSlotCountV1(state)) throw new Error("SLOT_SOUHAIT_VERROUILLE");
  return idx;
}

/* Place un souhait dans un slot ("" = vider le slot). L'allocation du slot est conservée. */
function setWishSlotV1(state, slot, wishId) {
  const s = state.systems.wishes;
  if (!s?.unlocked) throw new Error("SYSTEME_VERROUILLE");
  const idx = wishSlotIndexV1(state, slot);
  const id = String(wishId ?? "");
  if (id) {
    const def = (IDLE_NGU_TRACKS.wishes || []).find(x => x.id === id);
    if (!def) throw new Error("SOUHAIT_INVALIDE");
    if (!idleWishAccessibleV1(state, id)) throw new Error("DIFFICULTE_REQUISE");
    if (Math.max(0, int(s.data.tracks?.[id]?.level, 0)) >= Math.max(0, int(def.levels, 0))) throw new Error("SOUHAIT_TERMINE");
    if (s.data.slots.some((x, i) => i !== idx && x.wish === id)) throw new Error("SOUHAIT_DEJA_DANS_UN_SLOT");
  }
  s.data.slots[idx].wish = id;
  if (idx === 0) s.data.activeTrack = id;
  return { slot: idx, wish: id };
}

/*
 * Allocation d'une ressource sur un slot : même plafond que les NGU
 * (setNguAllocationV1) -- jamais au-delà du cap effectif moins ce qui est
 * alloué ailleurs (autres systèmes, autres slots, réservations externes),
 * ni au-delà de ce que le joueur possède réellement (current + déjà alloué).
 */
function setWishSlotAllocationV1(state, slot, resource, value, context = {}) {
  const s = state.systems.wishes;
  if (!s?.unlocked) throw new Error("SYSTEME_VERROUILLE");
  if (!RESOURCE_KEYS.includes(resource)) throw new Error("RESSOURCE_INVALIDE");
  if (resource === "magic" && !state.systems.bloodMagic?.unlocked) throw new Error("MAGIC_VERROUILLEE");
  if (resource === "r3" && !state.systems.hacks?.unlocked) throw new Error("R3_VERROUILLEE");
  const idx = wishSlotIndexV1(state, slot);
  const r = state.resources[resource];
  const cap = Math.max(0, idleNguEffectiveResourceStatV1(state, resource, "cap"));
  const entry = s.data.slots[idx];
  const previous = Math.max(0, num(entry.allocation[resource], 0));
  const ownAllocated = s.data.slots.reduce((sum, x) => sum + Math.max(0, num(x.allocation?.[resource], 0)), 0);
  const otherSystems = totalAllocated(state, resource, "wishes") + externalResourceAllocation(context, resource);
  const maxByCapacity = Math.max(0, cap - otherSystems - (ownAllocated - previous));
  const maxByOwned = Math.max(0, previous + num(r.current, 0));
  const target = clamp(num(value, 0), 0, Math.min(maxByCapacity, maxByOwned));
  r.current = clamp(num(r.current, 0) - (target - previous), 0, cap);
  entry.allocation[resource] = target;
  syncWishAllocationTotalsV1(s);
  return { slot: idx, resource, allocation: target };
}

/* Vue client des slots : souhait, progression, allocation et durée du niveau en cours. */
function wishSlotsSnapshotV1(state) {
  const s = state.systems.wishes;
  const defs = IDLE_NGU_TRACKS.wishes || [];
  const count = wishSlotCountV1(state);
  const params = wishSpeedParamsV1(state, s);
  return {
    unlocked: Boolean(s.unlocked),
    maxSlots: IDLE_WISH_MAX_SLOTS_V1,
    slotCount: count,
    sources: wishSlotBreakdownV1(state),
    minSecondsPerLevel: params.wishMinSeconds,
    speedMultiplier: params.speedMultiplier,
    r3Unlocked: Boolean(state.systems.hacks?.unlocked),
    magicUnlocked: Boolean(state.systems.bloodMagic?.unlocked),
    slots: (s.data.slots || []).map((slot, index) => {
      const def = slot.wish ? defs.find(x => x.id === slot.wish) : null;
      const t = def ? s.data.tracks[def.id] : null;
      const level = Math.max(0, int(t?.level, 0));
      const maxLevel = def ? Math.max(0, int(def.levels, 0)) : 0;
      const done = Boolean(def) && level >= maxLevel;
      const progress = done ? 0 : clamp(num(t?.progress, 0), 0, 1);
      const secs = def && !done ? wishSecondsForLevelV1(state, def, level, slot.allocation, params) : Infinity;
      return {
        index,
        unlocked: index < count,
        wish: slot.wish,
        name: def ? def.name : "",
        effect: def ? def.effect : "",
        level,
        maxLevel,
        done,
        progress,
        allocation: clone(slot.allocation),
        secondsPerLevel: Number.isFinite(secs) ? secs : null,
        secondsRemaining: Number.isFinite(secs) ? secs * (1 - progress) : null
      };
    })
  };
}

function beardTrackUnlocked(state, trackDef) {
  if (!trackDef) return false;
  const required = Math.max(0, int(trackDef.unlockTroll, 0));
  return int(state.challenge?.completions?.troll, 0) >= required;
}

function advanceBeardTrack(state, system, trackDef, track, seconds, sameResourceCount = 1) {
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
  /* Armpit (set) (wiki "Armpit (set)" : "+10% Beard Speed!") -- setRewards.beardSpeedPct. */
  const beardSpeedFromSets = 1 + Math.max(0, num(state.adventure?.setRewards?.beardSpeedPct, 0));

  // V49 starts with NGU's first Beard slot only, therefore the
  // Beards_SameResource divisor is 1 until a later unlock adds more slots.
  /*
   * 2026-09-23 (audit, page Beards of Power) : la formule du wiki est « progress per tick » (50
   * ticks/s) ; baseRate est une vitesse par seconde, donc x50 (la barre de Beard était 50 fois
   * trop lente, alors que le plafond de 50 niveaux/s ci-dessous suppose bien des ticks).
   */
  const baseRate = 50 *
    Math.max(1, idleNguEffectiveResourceStatV1(state, resource, "bars")) *
    Math.sqrt(Math.max(1, idleNguEffectiveResourceStatV1(state, resource, "power"))) *
    diggerSpeed *
    beardSpeedFromItems *
    beardSpeedFromSets *
    quirkBonusesV1(idleQuirkNiveauxV1(state)).beardSpeedMultiplier /
    (Math.max(1, num(trackDef.speedDivider, 1e8)) * Math.max(1, sameResourceCount));

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
/* Page Hacks : niveau maximal de chaque Hack (au-delà, la barre repart sans augmenter le bonus). */
export const HACK_HARD_CAP_V1 = Object.freeze({ attackDefense: 7720, adventureStats: 7632, timeMachineSpeed: 7544, dropChance: 7544, augmentSpeed: 7456, energyNguSpeed: 7340, magicNguSpeed: 7340, bloodGain: 7252, qpGain: 7164, daycare: 7048, exp: 6960, number: 6873, pp: 6757, hackHack: 6757, wish: 6262 });
function advanceHackTrack(state, system, trackDef, track, seconds) {
  if (!system.unlocked || seconds <= 0) return;
  const hackSpeedMultiplier = Math.max(1e-12, num(idleNguBonuses(state).hackSpeedMultiplier, 1));
  /*
   * Page Hacks, « Important Math » : temps = BaseSpeedDivider x 1.0078^level x (level+1) / (R3_allocated x R3_power x
   * HackSpeedBonus). Les Bars de Resource 3 n'y figurent pas (page Resource 3 : « Bars : Increases the rate at which
   * you generate Resource 3 until you hit your cap », « The output of each task is (points invested * Power) ») :
   * seconde passe 2026-09-24, elles multipliaient à tort la vitesse des Hacks.
   */
  const throughput = Math.max(0, num(system.allocation.r3, 0)) * Math.max(1, idleNguEffectiveResourceStatV1(state, "r3", "power")) * hackSpeedMultiplier;
  if (throughput <= 0) return;

  let level = Math.max(0, int(track.level, 0));
  let progress = clamp(num(track.progress, 0), 0, 0.999999999);
  let remaining = Math.max(0, num(seconds, 0));
  const divider = Math.max(1, num(trackDef.speedDivider, 1e8));

  const hardCap = HACK_HARD_CAP_V1[trackDef.id] || Infinity;
  let iterations = 0;
  while (remaining > 1e-9 && iterations < 100000 && level < hardCap) {
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

  track.level = Math.min(level, hardCap);
  track.progress = level >= hardCap ? 0 : progress;
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
/*
 * Paramètres communs à tous les slots (2026-09-23, slots de souhaits) :
 * multiplicateur de vitesse partagé et temps minimum par niveau. Calculés
 * une fois par tick puis appliqués à chaque slot avec SA propre allocation.
 */
function wishSpeedParamsV1(state, system) {
  const cubeWishSpeedPct = Math.max(0, num(idleAdventureCubeTierV1(state.adventure?.cube).wishSpeedPct, 0));
  const wishSpeedSetPct = Math.max(0, num(state.adventure?.setRewards?.wishSpeedPct, 0));
  const perkWish = perkBonusesV1(idlePerkNiveauxV1(state));
  const wishMinSeconds = Math.max(3600, WISH_MIN_LEVEL_SECONDS - perkWish.wishMinTimeReductionSeconds - quirkBonusesV1(idleQuirkNiveauxV1(state)).wishMinTimeReductionSeconds);
  const speedMultiplier = Math.max(1e-12, wishBonusesV1(system.data.tracks).wishSpeedMultiplier * perkWish.wishSpeedMultiplier * (state.selloutShop?.purchases?.fasterWishes ? 1.25 : 1) * (1 + cubeWishSpeedPct / 100) * (1 + wishSpeedSetPct) * gearPctV1(gearSpecialsV1(state), "wishSpeedPct") * hackFxV1(state).wish
    * idleCardsMultiplierV1(state, "wishes") /* Cards WISHES */);
  return { wishMinSeconds, speedMultiplier };
}

/*
 * Durée (s) d'un niveau `level` -> `level + 1` avec l'allocation d'UN slot.
 * Infinity si l'une des trois ressources n'est pas allouée ou si le calcul
 * déborde. Le bug de virgule flottante décrit par le wiki (progression
 * bloquée à 50 % au-delà de ~7 j 17 h) n'est volontairement PAS reproduit.
 */
function wishSecondsForLevelV1(state, trackDef, level, allocation, params) {
  const engAlloc = Math.max(0, num(allocation?.energy, 0));
  const magAlloc = Math.max(0, num(allocation?.magic, 0));
  const r3Alloc = Math.max(0, num(allocation?.r3, 0));
  if (engAlloc <= 0 || magAlloc <= 0 || r3Alloc <= 0) return Infinity;
  /*
   * Page Wishes : « (Eng_Power x Eng_allocated x Mag_Power x Mag_allocated x Res3_Power x Res3_allocated)^0.17 ».
   * Seconde passe 2026-09-24 : la Puissance est celle du jeu (achats EXP + perks + quirks + souhaits + équipement +
   * potions...), pas la seule Puissance achetée : les Hacks, les Augments et les NGU lisaient déjà la Puissance effective.
   */
  const engPower = Math.max(1, idleNguEffectiveResourceStatV1(state, "energy", "power"));
  const magPower = Math.max(1, idleNguEffectiveResourceStatV1(state, "magic", "power"));
  const r3Power = Math.max(1, idleNguEffectiveResourceStatV1(state, "r3", "power"));
  const numerator = engPower * engAlloc * magPower * magAlloc * r3Power * r3Alloc;
  const divider = Math.max(1, num(trackDef.speedDivider, 1e15));
  const rawSeconds = (divider * (level + 1)) / Math.pow(numerator, 0.17) / params.speedMultiplier;
  return Number.isFinite(rawSeconds) ? Math.max(params.wishMinSeconds, rawSeconds) : Infinity;
}

function advanceWishTrack(state, system, trackDef, track, seconds, allocation = system.allocation, params = wishSpeedParamsV1(state, system)) {
  if (!system.unlocked || seconds <= 0) return;
  if (Math.max(0, int(track.level, 0)) >= Math.max(0, int(trackDef.levels, 0))) return;
  if (!Number.isFinite(wishSecondsForLevelV1(state, trackDef, Math.max(0, int(track.level, 0)), allocation, params))) return;

  let level = Math.max(0, int(track.level, 0));
  let progress = clamp(num(track.progress, 0), 0, 0.999999999);
  let remaining = Math.max(0, num(seconds, 0));
  const maxLevel = Math.max(0, int(trackDef.levels, 0));

  let iterations = 0;
  while (remaining > 1e-9 && level < maxLevel && iterations < 100000) {
    iterations++;
    const secondsNeeded = wishSecondsForLevelV1(state, trackDef, level, allocation, params);
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
  if (def.id === "beards") {
    const ids = beardActiveIdsV1(state);
    const countBy = { energy: 0, magic: 0 };
    for (const id of ids) countBy[(tracks.find(x => x.id === id)?.resource) || "energy"] += 1;
    const penaltyFactor = state.adventure?.completedSets?.beardverse ? 0.9 : 1;
    for (const id of ids) {
      const bd = tracks.find(x => x.id === id);
      const same = Math.max(1, countBy[bd.resource || "energy"] * penaltyFactor);
      advanceBeardTrack(state, s, bd, s.data.tracks[id], seconds, same);
    }
    s.data.beardSlots = beardSlotsV1(state);
    s.level = Object.values(s.data.tracks).reduce((sum, x) => sum + x.level, 0);
    s.tempLevel = Object.values(s.data.tracks).reduce((sum, x) => sum + x.tempLevel, 0);
    s.permanentLevel = Object.values(s.data.tracks).reduce((sum, x) => sum + x.permanentLevel, 0);
    return;
  }

  if (def.id === "wishes") {
    /*
     * Chaque slot débloqué fait progresser SON souhait avec SA propre
     * allocation, même formule et mêmes multiplicateurs partagés (page
     * Wishes : "spreading out your resources on multiple wishes is very
     * effective", conséquence directe de l'exposant 0,17).
     */
    releaseLockedWishSlotsV1(state, s);
    const count = wishSlotCountV1(state);
    const params = wishSpeedParamsV1(state, s);
    for (let i = 0; i < count; i++) {
      const slot = s.data.slots?.[i];
      if (!slot || !slot.wish) continue;
      const wishDef = tracks.find(x => x.id === slot.wish);
      const wishState = s.data.tracks[slot.wish];
      if (wishDef && wishState && idleWishAccessibleV1(state, slot.wish)) advanceWishTrack(state, s, wishDef, wishState, seconds, slot.allocation, params);
    }
    s.level = Object.values(s.data.tracks).reduce((sum, x) => sum + x.level, 0);
    return;
  }

  const active = s.data.activeTrack || tracks[0].id;
  const trackDef = tracks.find(x => x.id === active) || tracks[0];
  const t = s.data.tracks[active];
  if (!t) return;

  if (def.id === "hacks") {
    advanceHackTrack(state, s, trackDef, t, seconds);
    s.level = Object.values(s.data.tracks).reduce((sum, x) => sum + x.level, 0);
    return;
  }

  if (def.id === "advancedTraining") {
    /*
     * 2026-09-23 (audit) : wiki "Advanced Training" -- « With 1000 Energy cap,
     * 1 Energy power ... Adventure Toughness, Adventure Power and Block Damage
     * Reduction each need 10,000 seconds to level from level 0 to level 1.
     * Wandoos Energy/Magic Dump+ each need 20,000 seconds. Every level requires
     * linearly more time than the last one », Energy Power seulement par sa
     * racine carrée, 50 niveaux/s maximum. L'ancien débit (alloc x sqrt(power) x
     * bars / 25 000, indépendant du niveau) rendait l'entraînement ~400 fois
     * trop rapide.
     */
    /*
     * 2026-09-24 (audit de composition) : (1) souhait 190 « I wish I was f**king done with
     * Advanced Training forever! » (page Advanced Training : « allows all abilities to run at
     * max speed (50 levels/second) without allocating energy ») ; (2) le spécial d'équipement
     * « Advanced Training » (objets du build Build Advanced Training : « Gain Advance Training
     * Speed ») multiplie la vitesse ; (3) les niveaux gagnés comptent dans le plafond de 100
     * niveaux du défi 100 Levels (note de la page Challenges : « Advanced Training levels
     * gained during a rebirth also count towards the 100 levels »).
     */
    if (wishLevelV1(state, 190) >= 1) {
      for (const other of tracks) {
        if ((other.id === "wandoosEnergy" || other.id === "wandoosMagic") && !state.systems.wandoos?.unlocked) continue;
        const ot = s.data.tracks[other.id];
        if (!ot) continue;
        ot.progress = Math.max(0, num(ot.progress, 0)) + 50 * seconds;
        let gainedFree = Math.floor(ot.progress);
        const roomFree = challengeHundredLevelsRemaining(state);
        if (gainedFree > roomFree) { gainedFree = roomFree; ot.progress = 0; }
        else ot.progress -= gainedFree;
        if (gainedFree > 0) {
          ot.tempLevel = Math.max(0, Math.floor(num(ot.tempLevel, 0))) + gainedFree;
          challengeHundredLevelsConsume(state, gainedFree);
        }
      }
      s.tempLevel = Object.values(s.data.tracks).reduce((sum, x) => sum + x.tempLevel, 0);
      return;
    }
    const alloc = Math.max(0, num(s.allocation.energy, 0));
    if (alloc <= 0) return;
    const baseSeconds = trackDef.id === "wandoosEnergy" || trackDef.id === "wandoosMagic" ? 20000 : 10000;
    const sqrtPower = Math.sqrt(Math.max(1, idleNguEffectiveResourceStatV1(state, "energy", "power")));
    const gearAtSpeed = gearPctV1(gearSpecialsV1(state), "advancedTrainingPct");
    const rate = (alloc * sqrtPower * gearAtSpeed) / (baseSeconds * 1000); // unités de travail par seconde
    const level = Math.max(0, Math.floor(num(t.tempLevel, 0)));
    const work = Math.max(0, num(t.progress, 0)) * (level + 1) + rate * seconds;
    const step = nguLevelsFromWorkV1(level, work);
    let gained = Math.min(step.gained, Math.floor(50 * seconds) + 1);
    const roomAt = challengeHundredLevelsRemaining(state);
    const cappedByPool = gained > roomAt;
    if (cappedByPool) gained = roomAt;
    challengeHundredLevelsConsume(state, gained);
    t.tempLevel = level + gained;
    t.progress = cappedByPool || gained < step.gained ? 0 : clamp(step.work / (t.tempLevel + 1), 0, 0.999999999);
  } else {
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
  return (1e9 * difficultyDivider / Math.max(1e-12, alloc * power * hackFxV1(state).timeMachineSpeed * challengePermanentBonuses(state).timeMachineSpeedMultiplier
    * idleCardsMultiplierV1(state, "timeMachine") /* Cards TM */)) * n;
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

function tmTargetReached(target, level) {
  return num(target, 0) > 0 && num(level, 0) >= num(target, 0);
}

/* Niveau cible atteint : l'énergie (vitesse) ou la magie (Gold) allouée à la Time Machine est rendue automatiquement. */
function tmApplyTargets(state) {
  const s = state.systems.timeMachine;
  const d = s.data;
  if (tmTargetReached(d.speedTarget, d.speedLevel) && num(s.allocation.energy, 0) > 0) {
    setAllocation(state, "timeMachine", "energy", 0);
    d.speedProgress = 0;
  }
  if (tmTargetReached(d.goldTarget, d.goldLevel) && num(s.allocation.magic, 0) > 0) {
    setAllocation(state, "timeMachine", "magic", 0);
    d.goldProgress = 0;
  }
}

/*
 * Vue de l'écran Broken Time Machine (mêmes rubriques que le jeu : Gold per Bar Fill, Bar Fills per second, Blood Magic GPS Bonus, NGU GPS
 * Multiplier, Challenge Multiplier, Highest Boss Multiplier, Gold Multiplier, Machine Speed GPS Multiplier, Beard GPS Multiplier, Gross / Net GPS).
 * Ce sont EXACTEMENT les facteurs de idleNguTimeMachineGrossGoldPerSecond, jamais une seconde formule ; les pourcentages du jeu valent
 * multiplicateur x 100. Les barres sont la progression vers le niveau suivant (temps déjà écoulé / durée du niveau).
 */
function timeMachineViewV1(state) {
  const s = state.systems.timeMachine;
  const d = s.data;
  const speedLevel = Math.max(0, num(d.speedLevel, 0));
  const goldLevel = Math.max(0, num(d.goldLevel, 0));
  const fill = (progress, step) => (Number.isFinite(step) && step > 0 ? Math.max(0, Math.min(1, num(progress, 0) / step)) : 0);
  const speedStep = tmLevelSeconds(state, "energy", speedLevel + 1);
  const goldStep = state.systems.bloodMagic?.unlocked ? tmLevelSeconds(state, "magic", goldLevel + 1) : Infinity;
  const highestBoss = Math.max(1, Math.min(274, num(d.highestBossEver, 0) - 27));
  return {
    goldPerBarFill: Math.max(0, num(d.bestGoldThisRun, 0)),
    barFillsPerSecond: speedLevel < 50 ? Math.min(50, 1 + speedLevel) : 50,
    bloodMagicMultiplier: Math.max(1, num(state.systems.bloodMagic.data.spells.counterfeitGold, 1)),
    nguMultiplier: nguFxV1(state).timeMachine,
    challengeMultiplier: challengePermanentBonuses(state).timeMachineGoldMultiplier,
    highestBossMultiplier: highestBoss,
    goldMultiplier: 1 + goldLevel,
    machineSpeedMultiplier: speedLevel < 50 ? 1 : 1 + (speedLevel - 49),
    beardMultiplier: beardBonusMultiplier(state, "gold"),
    grossGps: idleNguTimeMachineGrossGoldPerSecond(state),
    netGps: idleNguTimeMachineGoldPerSecond(state),
    speedFill: fill(d.speedProgress, speedStep),
    goldFill: fill(d.goldProgress, goldStep),
    speedTarget: Math.max(0, Math.floor(num(d.speedTarget, 0))),
    goldTarget: Math.max(0, Math.floor(num(d.goldTarget, 0)))
  };
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
    while (d.speedProgress >= energyStep && guard < 100000 && !tmTargetReached(d.speedTarget, d.speedLevel)) {
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
      while (d.goldProgress >= magicStep && guard < 100000 && !tmTargetReached(d.goldTarget, d.goldLevel)) {
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

  tmApplyTargets(state);

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

function ritualUnlocked(ritual, context, state) {
  if (!ritual.unlockFlag) return true;
  /*
   * 2026-09-24 (page Blood Magic : « This ritual is unlocked by completing Troll Challenge 6 » ; page Challenges,
   * Troll Challenge, Completion 6 : « A new Blood Magic Ritual! ») : le drapeau « trollChallenge6 » n'était posé nulle
   * part, le rituel « Turn Yourself Inside Out » était donc inaccessible même après la 6e complétion.
   */
  if (ritual.unlockFlag === "trollChallenge6" && state && int(state.challenge?.completions?.troll, 0) >= 6) return true;
  return Boolean(context?.unlockFlags?.[ritual.unlockFlag]);
}

function advanceBloodMagic(state, seconds, context) {
  const s = state.systems.bloodMagic;
  if (!s.unlocked || seconds <= 0) return;
  const ritual = IDLE_NGU_BLOOD_RITUALS.find(r => r.id === s.data.activeRitual) || IDLE_NGU_BLOOD_RITUALS[0];
  if (!ritualUnlocked(ritual, context, state)) return;
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
  state.currencies.blood += completions * ritual.blood * quirkBonusesV1(idleQuirkNiveauxV1(state)).bloodGainMultiplier * hackFxV1(state).bloodGain * diggerBonuses(state).blood * macguffinEffectMultiplierV1(state, "blood");
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
/*
 * 2026-09-24 (audit de composition, page « Blood Magic ») : le tableau des sorts donne
 * TROIS durées pour TROIS sorts différents -- Iron Pill 11,5 h, Blood MacGuffin α 23,5 h,
 * Blood MacGuffin β 1 jour et 23,5 h -- jamais une durée par difficulté. L'ancienne table
 * (11,5 / 23,5 / 47,5 h selon la difficulté) avait attribué les recharges des deux sorts
 * MacGuffin à l'Iron Pill en Evil / Sadistic. Aucune page ne publie d'autre recharge.
 */
const IRON_PILL_COOLDOWN_MS_V1 = Object.freeze({ normal: 11.5 * 3600000, difficile: 11.5 * 3600000, extreme: 11.5 * 3600000 });

function castBloodSpell(state, spell, now = 0) {
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
    /* Wiki Blood Magic : Power/Toughness += Blood^0.25 (HP x3, regen x0,03), permanent -- gain ABSOLU, pas un pourcentage. */
    if (now > 0 && now < num(spells.ironPillReadyAt, 0)) throw new Error("SORT_EN_RECHARGE");
    const gain = Math.pow(blood, 0.25) * perkBonusesV1(idlePerkNiveauxV1(state)).ironPillMultiplier;
    spells.ironPill += gain;
    if (now > 0) spells.ironPillReadyAt = now + (IRON_PILL_COOLDOWN_MS_V1[state.difficulty] || IRON_PILL_COOLDOWN_MS_V1.normal);
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
  /* Ygg extra : Fruit of Numbers débloqué par la 5e complétion du Troll Challenge (Normal). */
  if(f.tier<=0&&!idleYggFruitUnlockedV1(state,fruitId))throw new Error("FRUIT_NON_DEBLOQUE");
  const maxTier=yggMaxTier(state);
  if(f.tier>=maxTier)throw new Error("FRUIT_TIER_MAX");
  const target=f.tier+1;
  const cost=yggTierUpgradeCost(def,target);
  if(state.currencies.seeds<cost)throw new Error("GRAINES_INSUFFISANTES");
  state.currencies.seeds-=cost;
  f.tier=target;
  /* Ygg extra : un fruit à Auto-Activate démarre dès son déblocage. */
  idleYggAutoActivateV1(state,IDLE_NGU_YGG_FRUITS);
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
  /* Ygg extra : coût nul si l'Auto-Activate du fruit est acheté (boutique EXP). */
  const activationCost=idleYggActivationCostV1(state,def);
  if(yggFreeResource(state,def.resource)<activationCost)throw new Error("RESSOURCE_YGG_INSUFFISANTE");
  state.resources[def.resource].current=Math.max(
    0,
    num(state.resources[def.resource].current,0)-activationCost
  );
  s.data.reserved[def.resource]=0;
  f.active=true;
  f.growthHours=0;
  return {
    fruit:fruitId,
    active:true,
    cost:activationCost,
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
 * 2026-09-23 (Ygg extra, relu sur la page Yggdrasil) : EquipSeedGain (spécial "seedGainPct") et
 * NGU Yggdrasil sont désormais câblés ; le tableau « NGU Yggdrasil / Yggdrasil Yield » précise que
 * les graines ne reçoivent PAS le bonus « Yggdrasil Yield » (Pomegranate/Watermelon : « Only affected
 * by Seed Gain ») -- l'ancien multiplicateur appliquait à tort yggdrasilYieldPct aux graines, ainsi
 * que la quirk « Even Better Yggdrasil Yields » (Quirk_Ygg, pas Quirk_Seeds). Poop : consommable réel
 * (idle-yggdrasil-extra-v1.js), multiplié au même niveau que FirstHarvest dans CHAQUE formule du wiki
 * (graines et rendements), d'où `bonus` = FirstHarvest x Poop ci-dessous.
 */
function yggSeedGain(def,tier,harvest,seedYieldMultiplier=1,bonus=1,eaten=false){
  const unit=idleYggSeedUnitV1(def,tier,eaten);
  return Math.ceil(unit*Math.max(1,def.baseSeeds)*(harvest?2:1)*seedYieldMultiplier*bonus);
}

function useYggFruit(state,fruitId,mode="eat",options={}){
  const s=state.systems.yggdrasil;
  if(!s?.unlocked)throw new Error("SYSTEME_VERROUILLE");
  const def=IDLE_NGU_YGG_FRUITS.find(x=>x.id===fruitId);
  const f=s.data.fruits[fruitId];
  if(!def||!f)throw new Error("FRUIT_INVALIDE");
  if(!f.active||f.growthHours<1)throw new Error("FRUIT_PAS_PRET");
  const grownTier=Math.max(1,Math.min(f.tier,Math.floor(f.growthHours)));
  const harvest=mode==="harvest";
  const perkBonuses=perkBonusesV1(idlePerkNiveauxV1(state));
  const quirkBonuses=quirkBonusesV1(idleQuirkNiveauxV1(state));
  const gearYgg=gearSpecialsV1(state);
  /* Seed Gains : (1 + Equip_SeedGain) x NGU_Ygg x Quirk_Seeds x Perk_Seeds (jamais Yggdrasil Yield). */
  const seedYieldMultiplier=perkBonuses.seedYieldMultiplier*quirkBonuses.seedYieldMultiplier*nguFxV1(state).yggdrasil*gearPctV1(gearYgg,"seedGainPct");
  /* Ygg extra : Poop choisie pour ce fruit (x1,5, x1,65 avec le Blue Heart (set)), consommée ici. */
  const poop=options&&options.poop?idleYggUsePoopV1(state):null;
  const firstHarvestMultiplier=(f.firstHarvestThisRun?perkBonuses.firstHarvestMultiplier:1)*(poop?poop.factor:1);
  /* Pomegranate et Watermelon : « HarvestBonus = 2, even when eating ». */
  const seedGain=yggSeedGain(def,grownTier,harvest||def.effect==="seeds",seedYieldMultiplier,firstHarvestMultiplier,!harvest);
  state.currencies.seeds+=seedGain;
  const factor=Math.ceil(Math.pow(grownTier,1.5));
  const result={fruit:fruitId,mode:harvest?"harvest":"eat",tier:grownTier,seeds:seedGain};
  if(poop)result.poop={consumed:poop.consumed,free:poop.free,remaining:poop.remaining};
  /*
   * 2026-09-23 (audit) : wiki Yggdrasil > Fruit Yields. Chaque fruit a sa formule :
   * ceil(ceil(T^1.5) x constante du fruit x Poop x NGU_Ygg x Quirk_Ygg x Equip_YggYield x
   * FirstHarvest) ; Gold et Arbitrariness ne reçoivent ni NGU ni Yield ; Rage : Quirk x Equip
   * x PPBonus. Quirk_Ygg = « Even Better Yggdrasil Yields » (quirkBonuses.yggYieldMultiplier).
   */
  const quirkYgg=quirkBonuses.yggYieldMultiplier;
  const yieldFruit=nguFxV1(state).yggdrasil*quirkYgg*gearPctV1(gearYgg,"yggdrasilYieldPct")*firstHarvestMultiplier;

  if(!harvest){
    if(def.effect==="gold"){
      const minutes=Math.ceil(factor*30*firstHarvestMultiplier);
      const gold=Math.max(0,idleNguTimeMachineGrossGoldPerSecond(state))*minutes*60;
      state.currencies.gold+=gold;
      result.gold=gold;
    }else if(def.effect==="powerAlpha"){
      s.data.runPowerAlphaValue+=Math.ceil(factor*yieldFruit);
      result.runPowerAlphaValue=s.data.runPowerAlphaValue;
    }else if(def.effect==="adventure"){
      const baseToughness=Math.max(1,idleAdventureCombatStatsV1(idleAdventureEquipmentStatsV47(state.adventure),{},null).toughness);
      const gain=Math.floor(factor*Math.pow(baseToughness,0.2)*yieldFruit);
      s.data.permanent.adventurePower+=gain;
      s.data.permanent.adventureToughness+=gain;
      s.data.permanent.adventureHp+=gain*3;
      s.data.permanent.adventureRegen+=gain*0.03;
      result.adventureGain=gain;
    }else if(def.effect==="experience"){
      /* « x FoKSucksPerk x FoKStillSucksPerk » : x3 chacun (perks 19 et 20). */
      const exp=Math.max(1,Math.floor(Math.ceil(factor*5*yieldFruit)*Math.max(1,perkBonuses.fruitKnowledgeExpMultiplier)*Math.max(1,num(idleNguBonuses(state).xpMultiplier,1))));
      state.currencies.experience+=exp;
      result.experience=exp;
    }else if(def.effect==="luck"){
      const drop=Math.ceil(factor*0.7*yieldFruit)*0.05;
      s.data.permanent.luckDropPct+=drop;
      result.dropPct=drop;
    }else if(def.effect==="powerBeta"){
      s.data.permanent.powerBetaValue+=Math.ceil(factor*yieldFruit);
      s.data.runPowerBetaActive=true;
      result.powerBeta=s.data.permanent.powerBetaValue;
    }else if(def.effect==="numbers"){
      s.data.permanent.numbersValue+=Math.ceil(factor*3*yieldFruit);
      s.data.runNumbersActive=true;
      result.numbers=s.data.permanent.numbersValue;
    }else if(def.effect==="ap"){
      const ap=Math.floor(Math.ceil(factor*15*firstHarvestMultiplier));
      /* Page Yggdrasil, Fruit of Arbitrariness : "... x (1 + BP/10000) x (1 + YellowHeartAPBonus) x Perk_Fibo89" (arrondi inférieur). */
      const apCoeur=apWithBonusV1(state,ap);
      state.currencies.ap+=apCoeur;
      result.ap=apCoeur;
    }else if(def.effect==="pp"){
      /* Perk Point PROGRESS (1 000 000 = 1 PP), pas des PP entiers. */
      const progress=Math.ceil(factor*60000*quirkYgg*gearPctV1(gearYgg,"yggdrasilYieldPct")*Math.max(1,num(idleNguBonuses(state).ppMultiplier,1))*firstHarvestMultiplier);
      const tower=state.systems.tower;
      if(!tower.data||typeof tower.data!=="object")tower.data={};
      tower.data.ppProgress=Math.max(0,num(tower.data.ppProgress,0))+progress;
      const entiers=Math.floor(tower.data.ppProgress/1e6);
      if(entiers>0){tower.data.ppProgress-=entiers*1e6;state.currencies.pp+=entiers;}
      result.pp=entiers;
      result.ppProgress=progress;
    }else if(def.effect==="macguffinAlpha"||def.effect==="macguffinBeta"){
      /* Wiki Yggdrasil : ni NGU Yggdrasil (tableau "NGU Yggdrasil / Yggdrasil Yield"), seulement Poop x Quirk x Equip x FirstHarvest. */
      const fx=macguffinEatFruitV1(state,def.effect==="macguffinAlpha"?"alpha":"beta",grownTier,quirkYgg*gearPctV1(gearYgg,"yggdrasilYieldPct")*firstHarvestMultiplier);
      result.macguffinLevels=fx.levels;
      result.macguffins=fx.touched;
    }else if(def.effect==="powerDelta"){
      /* Fruit of Power δ : ⌈⌈T^1.5⌉ x 7 x Poop x NGU_Ygg x Quirk_Ygg x Equip_YggYield x FirstHarvest⌉ niveaux permanents. */
      s.data.permanent.powerDeltaValue=Math.max(0,num(s.data.permanent.powerDeltaValue,0))+Math.ceil(factor*7*yieldFruit);
      result.powerDelta=s.data.permanent.powerDeltaValue;
    }else if(def.effect==="mayo"){
      /* Fruit de Mayo : T^1.1 x 0.025 x Poop x MayoSpeed (Infuser inclus) au générateur associé ; ni FirstHarvest ni NGU/Quirk Yggdrasil. */
      const fxMayo=idleCardsMayoFruitProgressV1(state,def.mayo,idleYggMayoFruitBaseV1(grownTier,poop?poop.factor:1));
      result.mayo=def.mayo;
      result.mayoProgress=fxMayo.progress;
      result.mayoGained=fxMayo.whole;
    }else if(def.effect==="quirks"){
      /* Fruit of Quirks : ⌈T x 3 x QPRewardModifier x Poop x Quirk_Ygg x Equip_YggYield x FirstHarvest⌉ (pas de NGU Yggdrasil). */
      const qp=idleYggFruitOfQuirksQpV1(grownTier,quirkYgg*gearPctV1(gearYgg,"yggdrasilYieldPct")*firstHarvestMultiplier);
      state.currencies.qp=Math.max(0,num(state.currencies.qp,0))+qp;
      result.qp=qp;
    }
  }
  f.firstHarvestThisRun=false;
  releaseYggFruit(state,def,f);
  /* Ygg extra : Auto-Activate -- le fruit repart aussitôt, sans coût. */
  if(idleYggAutoActivateV1(state,IDLE_NGU_YGG_FRUITS).includes(fruitId))result.autoActivated=true;
  return result;
}

function advanceYggdrasil(state,seconds,now){
  const s=state.systems.yggdrasil;
  if(!s?.unlocked||seconds<=0)return;
  /* Ygg extra : Auto-Activate (fruits inactifs relancés) et perks 16/17 (bonus actifs après 30 min de Rebirth). */
  idleYggAutoActivateV1(state,IDLE_NGU_YGG_FRUITS);
  if(now!=null)idleYggQuickActivationV1(state,now);
  /* « Every one full hour growing » ; « The Beast's Fertilizer » : 1 minute de moins par tier et par niveau. */
  const tierSeconds=idleYggTierSecondsV1(state);
  for(const def of IDLE_NGU_YGG_FRUITS){
    const f=s.data.fruits[def.id];
    if(!f.active||f.tier<=0)continue;
    f.growthHours=Math.min(f.tier,Math.max(0,num(f.growthHours,0))+seconds/tierSeconds);
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
  /* Perks « A Digger Slot! » et boutique Sellout (6 slots) : calculés mais jamais lus jusqu'ici. */
  const perkExtra=Math.max(0,int(perkBonusesV1(idlePerkNiveauxV1(state)).diggerSlotBonus,0));
  const shopExtra=Math.max(0,Math.min(6,int(state.selloutShop?.purchases?.diggerSlots,0)));
  const expExtra=expShopPurchasedV1(state,"diggerSlot");
  return Math.max(1,Math.min(12,int(state.systems.diggers?.data?.slots,1)+extra+challengeExtra+perkExtra+shopExtra+expExtra));
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

/*
 * ITOPOD (wiki, page ITOPOD) -- réécriture 2026-09-23. Avant : cadence de kills inventée
 * (min(1, (Power/1,05^étage)^0,2 / 20) par seconde), aucun EXP/AP, étage = kills/10 sans borne.
 * Maintenant :
 *  - ennemis de l'étage F : PV 600 x 1,05^F (588-612), défense 10 x 1,05^F ;
 *  - dégâts d'Idle Attack = max(10 % Power, Power - défense/2) x bonus Idle (1,2 / 1,5 / 1,8) ;
 *  - un kill dure : respawn (4 s réduit, plancher 0,34 s) + coups nécessaires x 1 s (0,8 s avec le
 *    set Red Liquid) ;
 *  - 10 kills = 1 étage ; sur l'étage de fin, les 10 kills renvoient à l'étage de départ ;
 *  - récompenses : (200 / 700 / 2000 + étage) PPP par kill, EXP et 1 AP tous les n kills (n = 40 - palier,
 *    20 au-delà du palier 20 ; EXP du palier = 1, 2, puis (palier-1)(palier-2)+2), PP de première
 *    atteinte des étages multiples de 10 ;
 *  - par défaut (départ/fin non réglés) : montée jusqu'à l'« étage optimal » (le plus haut où un coup suffit).
 * Non modélisé : chute de Boosts (14 %, niveau 1), MacGuffins, mort du joueur (les dégâts subis).
 */
const TOWER_MAX_FLOOR_V1 = 1600;
function towerTierV1(floor) { return Math.max(1, Math.floor(floor / 50) + 1); }
function towerExpForTierV1(tier) { return tier <= 1 ? 1 : tier === 2 ? 2 : (tier - 1) * (tier - 2) + 2; }
function towerKillsPerRewardV1(tier) { return tier <= 20 ? 40 - tier : 20; }
function towerHitsV1(power, idleBonus, floor) {
  const scale = Math.pow(1.05, floor);
  const damage = Math.max(0.1 * power, power - (10 * scale) / 2) * Math.max(0.1, idleBonus);
  return Math.max(1, Math.ceil((600 * scale) / Math.max(1e-9, damage)));
}
function towerOptimalFloorV1(power, idleBonus) {
  let lo = 0;
  let hi = TOWER_MAX_FLOOR_V1;
  if (towerHitsV1(power, idleBonus, 0) > 1) return 0;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (towerHitsV1(power, idleBonus, mid) <= 1) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}
/* Page ITOPOD, colonne « Boost » : force du boost lâché par palier (14 % de chance par kill, niveau 1). */
function towerBoostStrengthV1(tier) {
  const forces = [1, 2, 5, 10, 20, 50, 100, 200, 500];
  if (tier <= 9) return forces[tier - 1];
  if (tier <= 14) return 1000;
  if (tier <= 17) return 2000;
  if (tier <= 23) return 5000;
  return 10000;
}
function towerMilestonePpV1(floor) {
  if (floor <= 0 || floor % 10 !== 0) return 0;
  return floor % 100 === 0 ? floor / 10 : 1 + Math.floor(floor / 100);
}

function advanceTowerV1(state, seconds, context) {
  const tower = state.systems.tower;
  if (!tower.unlocked || !tower.active || !(seconds > 0)) return;
  const d = tower.data;
  d.kills = Math.max(0, int(d.kills, 0));
  if (d.killsOnFloor === undefined) {
    d.killsOnFloor = d.kills % 10;
    d.floor = Math.floor(d.kills / 10);
  }
  d.killsOnFloor = Math.max(0, int(d.killsOnFloor, 0)) % 10;
  d.floor = clamp(int(d.floor, 0), 0, TOWER_MAX_FLOOR_V1);
  d.highestFloor = Math.max(int(d.highestFloor, 0), d.floor);
  d.killTime = Math.max(0, num(d.killTime, 0));
  d.apProgress = Math.max(0, num(d.apProgress, 0));

  const gear = idleAdventureEquipmentStatsV47(state.adventure);
  const bonuses = idleNguBonuses(state);
  const power = Math.max(10, idleAdventureCombatStatsV1(gear, context, bonuses).power);
  const idleBonus = num(gear.specials?.idleAttackMultiplier, 1.2);
  const respawn = Math.max(0.34, 4 * (1 - clamp(num(bonuses.respawnReduction, 0), 0, 1)));
  const interval = state.adventure?.unlockFlags?.redLiquidMaxed ? 0.8 : 1;
  const optimal = towerOptimalFloorV1(power, idleBonus);
  const start = d.startFloor == null ? null : clamp(int(d.startFloor, 0), 0, Math.max(0, d.highestFloor - 1));
  const end = d.endFloor == null ? null : clamp(int(d.endFloor, 0), start ?? 0, TOWER_MAX_FLOOR_V1);
  const auto = start === null || end === null;
  d.optimalFloor = optimal;

  const perks = perkBonusesV1(idlePerkNiveauxV1(state));
  const quirks = quirkBonusesV1(idleQuirkNiveauxV1(state));
  const ppBase = (state.difficulty === "extreme" ? 2000 : state.difficulty === "difficile" ? 700 : 200) + quirks.itopodPppFlat + 50 * wishLevelV1(state, 79);
  /* Même PPBonus que le Fruit of Rage (sets multiplicatifs, NGU PP, Hacks PP, Diggers PP, Perks, Cards PP). */
  const ppMultiplier = Math.max(0, num(bonuses.ppMultiplier, 1));
  const expMultiplier = Math.max(0, num(bonuses.xpMultiplier, 1));

  const killTimeAt = (floor) => respawn + interval * towerHitsV1(power, idleBonus, floor);
  const applyKills = (n, floor) => {
    if (!(n > 0)) return;
    const tier = towerTierV1(floor);
    d.kills += n;
    d.boostProgress = Math.max(0, num(d.boostProgress, 0)) + n * 0.14;
    const boosts = Math.floor(d.boostProgress);
    if (boosts > 0) {
      d.boostProgress -= boosts;
      const types = ["power", "toughness", "special"];
      const forceBoost = towerBoostStrengthV1(tier);
      /* Filtre de butin, Filter Boosts into Infinity Cube et transformation automatique (idle-inventory-auto-v1.js). */
      const invEnv = inventoryAutoEnvV1(state);
      /*
       * 2026-09-24 (seconde passe) : page Boost, « in the ITOPOD they drop at level 1 and can be affected by
       * The Loot Goblin's Blessing and the Gaudy set bonus » -- même tirage +1 niveau que les drops de zone
       * (dropLevelAdventureV2 : set Gaudy + bonusDropLevelChance = Loot Goblin + Fibonacci 144).
       */
      const levelUpChance = Math.min(1, Math.max(0, num(state.adventure?.setRewards?.extraDropLevelChance, 0)) + Math.max(0, num(state.adventure?.bonusDropLevelChance, 0)));
      for (let i = 0; i < Math.min(boosts, 200); i++) {
        const item = idleAdventureBoostV1(types[Math.floor(Math.random() * 3)], forceBoost);
        item.level = Math.random() < levelUpChance ? 2 : 1;
        if (!idleInventoryReceiveDropV1(state.adventure, item, invEnv)) break;
      }
    }
    /* Little Blue Pill : PPP doublés pour les n premiers kills couverts par le stock de pilules. */
    const fx = state.selloutEffects;
    const pills = fx ? Math.min(n, Math.max(0, int(fx.bluePills, 0))) : 0;
    if (pills > 0) fx.bluePills -= pills;
    /* Little Blue Pill : x2 (x2,2 avec le Blue Heart (set), idle-hearts-v1.js) pour chaque kill couvert. */
    const pillFactor = 2 * idleHeartsConsumableFactorV1(state);
    d.ppProgress = Math.max(0, num(d.ppProgress, 0)) + (n + pills * (pillFactor - 1)) * (ppBase + floor) * ppMultiplier;
    const rewards = n / towerKillsPerRewardV1(tier);
    state.currencies.experience += rewards * towerExpForTierV1(tier) * expMultiplier;
    d.apProgress += rewards;
    const ap = Math.floor(d.apProgress);
    if (ap > 0) {
      d.apProgress -= ap;
      /* Page Arbitrary Points : les kills de l'ITOPOD sont exclus des bonus AP (succès, Yellow Heart, Fibonacci 89). */
      state.currencies.ap += ap;
    }
  };
  const reachFloor = (floor) => {
    if (floor <= d.highestFloor) return;
    for (let g = d.highestFloor + 1; g <= floor; g++) state.currencies.pp += towerMilestonePpV1(g);
    d.highestFloor = floor;
  };

  let time = seconds + d.killTime;
  let guard = 0;
  while (guard++ < 20000) {
    if (auto) {
      if (d.floor > optimal) d.floor = optimal;
    } else if (d.floor < start || d.floor > end) {
      d.floor = start;
      d.killsOnFloor = 0;
    }
    const tk = killTimeAt(d.floor);
    const steady = auto ? d.floor >= optimal : start === end;
    if (steady) {
      const n = Math.floor(time / tk);
      if (n <= 0) break;
      time -= n * tk;
      applyKills(n, d.floor);
      d.killsOnFloor = (d.killsOnFloor + n) % 10;
      break;
    }
    if (!auto && d.killsOnFloor === 0 && d.floor === start && d.highestFloor >= end) {
      let cycle = 0;
      for (let f = start; f <= end; f++) cycle += 10 * killTimeAt(f);
      const cycles = Math.floor(time / cycle);
      if (cycles >= 1) {
        time -= cycles * cycle;
        for (let f = start; f <= end; f++) applyKills(10 * cycles, f);
        continue;
      }
    }
    const need = 10 - d.killsOnFloor;
    const n = Math.min(need, Math.floor(time / tk));
    if (n <= 0) break;
    time -= n * tk;
    applyKills(n, d.floor);
    d.killsOnFloor += n;
    if (d.killsOnFloor >= 10) {
      d.killsOnFloor = 0;
      if (auto) d.floor = Math.min(optimal, d.floor + 1);
      else if (d.floor >= end) d.floor = start;
      else d.floor += 1;
      reachFloor(d.floor);
    }
  }
  d.killTime = Math.min(time, killTimeAt(d.floor));
  const pp = Math.floor(d.ppProgress / 1e6);
  if (pp > 0) {
    d.ppProgress -= pp * 1e6;
    state.currencies.pp += pp;
  }
  tower.level = d.floor;
}

function towerSetFloorsV1(state, payload) {
  const tower = state.systems.tower;
  if (!tower.unlocked) throw new Error("SYSTEME_VERROUILLE");
  const d = tower.data;
  if (payload.auto) {
    d.startFloor = null;
    d.endFloor = null;
    return { auto: true };
  }
  const highest = Math.max(0, int(d.highestFloor, 0));
  const start = clamp(int(payload.start, 0), 0, Math.max(0, highest - 1));
  const end = clamp(int(payload.end, start), start, TOWER_MAX_FLOOR_V1);
  d.startFloor = start;
  d.endFloor = end;
  if (d.floor < start || d.floor > end) {
    d.floor = start;
    d.killsOnFloor = 0;
  }
  return { start, end };
}

function advanceLateSystems(state, seconds, context, now) {
  const killsItopodAvant = Math.max(0, int(state.systems.tower?.data?.kills, 0));
  advanceTowerV1(state, seconds, context);
  /* MacGuffin ITOPOD Drops (perk 68) : les kills de ce tick alimentent le compteur MacGuffin. */
  macguffinOnItopodKillsV1(state, Math.max(0, int(state.systems.tower?.data?.kills, 0)) - killsItopodAvant);
  /* Perk 30 « What a Crappy Perk » : Poop de l'ITOPOD (1 tous les 9 000 kills + 0,01 % par kill). */
  idleYggItopodPoopV1(state, Math.max(0, int(state.systems.tower?.data?.kills, 0)) - killsItopodAvant);

  /* Cards et Mayo : vrai système (idle-cards-v1.js), remplace les cartes factices horaires. */
  advanceIdleCardsV1(state, seconds);
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
  state.records.playSeconds = num(state.records.playSeconds, 0) + secs;

  advanceGeneratedResources(state,secs,context);
  advanceAugmentations(state, secs, context);
  advanceTrackSystem(state, IDLE_NGU_SYSTEMS.find(x => x.id === "advancedTraining"), secs);
  /*
   * 2026-09-24 (page Rebirths, « What do I lose when I rebirth? ») : « Access to the Adventure, Augmentation, Time
   * Machine, and Blood Magic tabs until their related bosses are beaten ». Le drapeau `unlocked` de ces systèmes
   * reste vrai après un Rebirth (les Augmentations testaient déjà le boss) : la Time Machine produisait et se
   * levelait, et Blood Magic tournait, dès le boss 1 d'un nouveau Rebirth.
   */
  if (num(context.bosses, 0) >= 30) advanceTimeMachine(state, secs);
  if (num(context.bosses, 0) >= 37) advanceBloodMagic(state, secs, context);
  advanceYggdrasil(state, secs, nowMs(now));
  advanceWandoos(state, secs, context, now);
  advanceNgusV1(state, secs);
  advanceTrackSystem(state, IDLE_NGU_SYSTEMS.find(x => x.id === "beards"), secs);
  advanceTrackSystem(state, IDLE_NGU_SYSTEMS.find(x => x.id === "hacks"), secs);
  advanceTrackSystem(state, IDLE_NGU_SYSTEMS.find(x => x.id === "wishes"), secs);
  advanceMoneyPitAndDaily(state, nowMs(now));
  advanceIdleCookingV1(state, nowMs(now));
  advanceLateSystems(state, secs, context, nowMs(now));
  /* Item Daycare : même delta en ligne et hors ligne (plafond 30 j / 60 s sous défi hors ligne interdit). */
  if (state.systems.daycare?.data?.slots?.length) advanceIdleDaycareV1(state.systems.daycare.data, secs, daycareFactorsV1(state));
  /* Auto Merge / Auto Boost : minuteurs communs (idle-inventory-auto-v1.js), bonus calculés seulement si un minuteur tourne. */
  advanceIdleInventoryAutoV1(state.adventure, secs, () => inventoryAutoEnvV1(state));
  /* Questing (crochet 1/4) : Major Quests gagnées avec le temps + barre d'idle. */
  if (state.systems.questing?.unlocked) advanceIdleQuestingV1(state, secs, questingEnvV1(state, context), nowMs(now));

  tickSelloutEffectsV1(state, secs);
  reconcileResourceCurrents(state,context);
  state.updatedAt = nowMs(now);
  applyYggQuickActivationV1(state, now);
  state.rebirth = refreshRebirthState(state, context, nowMs(now));
  idleAchievementsEvaluateV1(state, achievementMetricsV1(state), nowMs(now));
  return state;
}

/*
 * Mesures des succès (idle-achievements-v1.js). Energy/Magic Power, Cap et Bar :
 * valeurs totales effectives (achat + bonus), celles que le jeu affiche ("Obtain
 * A Total Energy Cap of ..."). Boss : plus haut boss vaincu toutes difficultés
 * ("Defeat Boss 10!"). The Beast V1-V4 = paliers Easy/Normal/Hard/Brutal (même
 * lecture que "The Beast v4 beaten" -> beastBrutalDefeated).
 */
function achievementMetricsV1(state) {
  const eff = (r, s) => idleNguEffectiveResourceStatV1(state, r, s);
  const flags = state.adventure?.unlockFlags || {};
  const peaks = state.difficultyPeaks || {};
  return {
    energyPower: eff("energy", "power"),
    magicPower: eff("magic", "power"),
    energyCap: eff("energy", "cap"),
    magicCap: eff("magic", "cap"),
    energyBars: eff("energy", "bars"),
    magicBars: eff("magic", "bars"),
    highestBoss: Math.max(0, num(state.records?.highestBoss, 0)),
    totalRebirths: Math.max(0, num(state.records?.totalRebirths, 0)),
    nguUnlocked: Boolean(state.systems.ngu?.unlocked),
    yggdrasilUnlocked: Boolean(state.systems.yggdrasil?.unlocked),
    beardsUnlocked: Boolean(state.systems.beards?.unlocked),
    walderpFinal: Boolean(flags.walderpFinalDefeated),
    beastV1: Boolean(flags.beastDefeated_easy),
    beastV2: Boolean(flags.beastDefeated_normal),
    beastV3: Boolean(flags.beastDefeated_hard),
    beastV4: Boolean(flags.beastDefeated_brutal || flags.beastBrutalDefeated),
    evilEntered: state.difficulty === "difficile" || state.difficulty === "extreme" || num(peaks.difficile, 0) > 0 || num(peaks.extreme, 0) > 0,
    speedrun: num(state.records?.speedrunBonusClaimed, 0) > 0
  };
}

function achievementsSnapshotV1(state) {
  const unlocked = state.systems.achievements?.data?.unlocked || {};
  return {
    bp: idleAchievementsBpV1(state),
    apMultiplier: idleAchievementsApMultiplierV1(state),
    list: IDLE_ACHIEVEMENTS_V1.map(a => ({
      id: a.id, group: a.group, name: a.name, bp: a.bp, threshold: a.threshold,
      tracked: a.tracked, secret: a.secret, unlocked: unlocked[a.id] !== undefined
    }))
  };
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

/*
 * Effets des Hacks (wiki Hacks) : (100 % + Effect par niveau x Niveau) x Milestone bonus^(nombre
 * de milestones), milestones = floor(niveau / niveaux par milestone) ; « Hacks do not affect Normal
 * mode ». Jusqu'ici seule leur VITESSE était lue : aucun effet n'était appliqué.
 */
function hackFxV1(state) {
  const out = {};
  for (const def of IDLE_NGU_TRACKS.hacks || []) out[def.id] = 1;
  if (state.difficulty === "normal") return out;
  const tracks = state.systems.hacks?.data?.tracks || {};
  const reduction = quirkBonusesV1(idleQuirkNiveauxV1(state)).hackMilestoneReduction || {};
  const perkReduction = Object.assign({}, perkBonusesV1(idlePerkNiveauxV1(state)).hackMilestoneReduction || {});
  perkReduction.qpGain = (perkReduction.qpGain || 0) + wishLevelV1(state, 76);
  perkReduction.number = (perkReduction.number || 0) + wishLevelV1(state, 77);
  perkReduction.hackHack = (perkReduction.hackHack || 0) + wishLevelV1(state, 78);
  for (const def of IDLE_NGU_TRACKS.hacks || []) {
    const level = Math.max(0, int(tracks[def.id]?.level, 0));
    if (level <= 0) continue;
    const perMilestone = Math.max(1, num(def.levelsPerMilestone, 1) - Math.max(0, num(reduction[def.id], 0)) - Math.max(0, num(perkReduction[def.id], 0)));
    const milestones = Math.floor(level / perMilestone);
    out[def.id] = (1 + (num(def.effectPerLevelPct, 0) * level) / 100) * Math.pow(num(def.milestoneBonusPct, 100) / 100, milestones);
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
/* Specials cumulés (en %) de l'équipement porté ; vides sous le No Equipment Challenge. */
function gearSpecialsV1(state) {
  if (state.challenge?.active === "noEquipment") return {};
  return idleAdventureEquipmentStatsV47(state.adventure).specials || {};
}
const gearPctV1 = (specials, key) => 1 + Math.max(0, num(specials?.[key], 0)) / 100;
/*
 * My Yellow Heart (idle-hearts-v1.js) : facteur AP de toutes les sources sauf les kills de l'ITOPOD
 * (page Arbitrary Points : "from all sources, except for ITOPOD kills and Special Prize").
 */
function heartApMultiplierV1(state) {
  return idleHeartsApMultiplierV1(state, gearSpecialsV1(state));
}
/*
 * Bonus AP commun (2026-09-24). Page Arbitrary Points : "Arbitrary points gained
 * from all sources, except for ITOPOD kills and Special Prize, can be increased
 * by: Completing achievements ; My Yellow Heart item/set bonus ; Fibonacci Perk
 * level 89 (2%)" -- "Maximal bonus is 193.698% (158.25% * 120% * 102%) and the
 * final AP value is rounded down". Page Yggdrasil (Fruit of Arbitrariness) :
 * "(1 + BP/10000) x (1 + YellowHeartAPBonus) x Perk_Fibo89". Avant ce correctif,
 * les succès n'étaient appliqués nulle part et chaque source appliquait un
 * sous-ensemble différent (défis/Money Pit/Daily Spin/fruit sans Fibonacci,
 * Money Pit sans aucun bonus, ITOPOD avec Fibonacci alors qu'il est exclu).
 */
function apBonusMultiplierV1(state) {
  return idleAchievementsApMultiplierV1(state) *
    heartApMultiplierV1(state) *
    perkBonusesV1(idlePerkNiveauxV1(state)).apEarningsMultiplier;
}
/* AP versée = arrondi inférieur de base x bonus ; la marge 1e-9 absorbe l'erreur binaire (50 000 x 1,023 = 51 150, pas 51 149). */
function apWithBonusV1(state, base) {
  return Math.max(0, Math.floor(Math.max(0, num(base, 0)) * apBonusMultiplierV1(state) + 1e-9));
}


function nguSpeedMultiplierV1(state, resource) {
  const gear = state.challenge?.active === "noEquipment" ? null : idleAdventureEquipmentStatsV47(state.adventure);
  const perks = perkBonusesV1(idlePerkNiveauxV1(state));
  const quirks = quirkBonusesV1(idleQuirkNiveauxV1(state));
  const fx = nguFxV1(state);
  const diggers = diggerBonuses(state);
  return Math.max(0,
    challengePermanentBonuses(state).nguSpeedMultiplier *
    (resource === "magic" ? challengePermanentBonuses(state).nguSpeedMagicChallengeMultiplier : challengePermanentBonuses(state).nguSpeedEnergyChallengeMultiplier) *
    (1 + 0.02 * (resource === "magic" ? wishLevelV1(state, 113) + wishLevelV1(state, 114) : wishLevelV1(state, 111) + wishLevelV1(state, 112))) *
    beardBonusMultiplier(state, "ngu") *
    idleCardsMultiplierV1(state, resource === "magic" ? "magicNgu" : "energyNgu") * /* Cards E-NGU / M-NGU */
    (1 + Math.max(0, num(state.adventure?.setRewards?.nguSpeedPct, 0))) *
    (1 + num(gear?.specials?.nguSpeedPct, 0) / 100) *
    /* Energy/Magic NGU MacGuffin Fragment (idle-macguffins-v1.js). */
    macguffinEffectMultiplierV1(state, resource === "magic" ? "magicNgu" : "energyNgu") *
    (resource === "magic"
      ? diggers.magicNgu * perks.nguSpeedMagicMultiplier * quirks.nguSpeedMagicMultiplier * fx.magicNguSpeed * hackFxV1(state).magicNguSpeed
      : diggers.energyNgu * perks.nguSpeedEnergyMultiplier * quirks.nguSpeedEnergyMultiplier * fx.energyNguSpeed * hackFxV1(state).energyNguSpeed)
  );
}

/* Ajoute des niveaux à un NGU et propage les quirks "Beast NGU" (14 : Evil -> Normal, 89 : Sadistic -> Evil). */
function grantNguLevelsV1(state, tier, id, gained) {
  const data = state.systems.ngu.data;
  const n = data.ngus[tier][id];
  n.level = Math.min(IDLE_NGU_MAX_LEVEL_V1, n.level + Math.max(0, gained));
  const quirkLevels = idleQuirkNiveauxV1(state);
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
    let { gained, work: rest } = nguLevelsFromWorkV1(n.level, work);
    /*
     * Page NGU : « at max speed, meaning they gain 50 levels/s » ; page Energy : « the most a progress bar can gain is
     * exactly 1 filling per tick, since there are 50 ticks per second, or 50 fills (or levels) per second ». Seconde
     * passe 2026-09-24 : le plafond existait pour les barbes et Wandoos, pas pour les NGU. Le travail en trop est perdu.
     */
    const maxGain = Math.max(1, Math.ceil(50 * seconds));
    if (gained > maxGain) { gained = maxGain; rest = 0; }
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

/*
 * Niveaux d'Advanced Training effectifs : nuls tant que le menu AT est verrouillé (2026-09-24,
 * page Banks : "banked Advanced Training levels do not have any effect until the AT menu is
 * unlocked by completing Basic Training" ; page Rebirths : accès perdu au Rebirth).
 */
function atLevelV1(state, trackId) {
  return state.systems.advancedTraining?.unlocked ? totalTrackLevel(state.systems.advancedTraining, trackId) : 0;
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
  const tempActive = beardActiveIdsV1(state).includes(def.id);
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

/*
 * Page Beards of Power : facteur de temps = +1/3 par heure entière jusqu'à 8 (24 h) ; chaque niveau du
 * perk « Five O'Clock Shadow » atteint le maximum 1 h plus tôt (minimum 12 h) -> pente 8 / (24 - niveau).
 */
function beardRebirthTimeFactor(seconds, shadowLevel = 0) {
  const wholeHours = Math.floor(Math.max(0, num(seconds, 0)) / 3600);
  const hoursToMax = 24 - clamp(int(shadowLevel, 0), 0, 12);
  return clamp(wholeHours * (8 / hoursToMax), 0, 8);
}

function convertActiveBeardOnRebirth(state, runSeconds) {
  const s = state.systems.beards;
  if (!s?.unlocked || !s.data?.tracks) return { track: "", gained: 0, timeFactor: 0 };
  const ids = beardActiveIdsV1(state);
  const id = ids[0] || "";
  const timeFactor = beardRebirthTimeFactor(runSeconds, perkBonusesV1(idlePerkNiveauxV1(state)).beardTrimSpeedLevel);
  let gained = 0;
  for (const activeId of ids) {
    const t = s.data.tracks[activeId];
    const temp = Math.max(0, num(t.tempLevel, 0));
    const part = Math.min(temp, Math.floor(Math.sqrt(temp) * timeFactor));
    t.permanentLevel = Math.max(0, num(t.permanentLevel, 0)) + part;
    gained += part;
  }
  for (const track of Object.values(s.data.tracks)) {
    track.tempLevel = 0;
    track.progress = 0;
  }
  s.tempLevel = 0;
  s.permanentLevel = Object.values(s.data.tracks).reduce((sum, x) => sum + Math.max(0, num(x.permanentLevel, 0)), 0);
  return { track: id, gained, timeFactor };
}

/*
 * MacGuffin Fragments (2026-09-23) : les facteurs permanents (Stat,
 * Adventure, Drop Chance, Energy/Magic/R3 Power/Cap/Bars) sont appliqués
 * sur l'objet calculé ci-dessous (produits commutatifs), voir
 * macguffinApplyToBonusesV1 dans idle-macguffins-v1.js.
 */
export function idleNguBonuses(raw) {
  const state = raw && raw.version === IDLE_NGU_META_VERSION
    ? raw
    : normalizeIdleNguState(raw, {}, raw?.updatedAt || Date.now());
  return macguffinApplyToBonusesV1(idleNguBonusesSansMacguffinV1(state), state);
}

function idleNguBonusesSansMacguffinV1(state) {
  const aug = idleNguAugmentationMultiplier(state);
  const atPower = atLevelV1(state, "power");
  const atToughness = atLevelV1(state, "toughness");
  const atBlock = atLevelV1(state, "block");
  const ironPillPoints = Math.max(0, num(state.systems.bloodMagic?.data?.spells?.ironPill, 0));
  const nguFx = nguFxV1(state);
  const hackFx = hackFxV1(state);
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
    ? 1 + Math.pow(Math.max(0,num(yggPermanent.powerBetaValue,0)),2)*5e-4
    : 1;

  const beardAttack = beardBonusMultiplier(state, "attackDefense");
  const beardNumber = beardBonusMultiplier(state, "number");
  const beardAdventure = beardBonusMultiplier(state, "adventure");
  /* Evil Bonus Accs (Set) (2026-09-24, wiki : "+20% Adventure stats!") : setRewards.adventureStatsPct, un facteur de plus comme perks / quirks / souhaits. */
  const evilAccsAdventureStats = 1 + Math.max(0, num(state.adventure?.setRewards?.adventureStatsPct, 0));
  const beardDrop = beardBonusMultiplier(state, "drop");
  const beardNgu = beardBonusMultiplier(state, "ngu");
  const beardWandoos = beardBonusMultiplier(state, "wandoos");
  const beardGold = beardBonusMultiplier(state, "gold");
  const challengeBonuses=challengePermanentBonuses(state);
  const perkBonuses=perkBonusesV1(idlePerkNiveauxV1(state));
  const quirkBonuses=quirkBonusesV1(idleQuirkNiveauxV1(state));
  const wishBonuses=wishBonusesV1(idleWishTracksActifsV1(state));
  /*
   * 2026-09-24 (audit de composition, page « NUMBER ») : « The NUMBER for the
   * next rebirth will be the product of the following factors » -- les bonus
   * NGU Number, Beard NUMBER (Reverse Hitler), Yggdrasil (Fruit of Numbers),
   * MacGuffin et Number Hack sont des FACTEURS DU PROCHAIN NUMBER, calculés
   * dans refreshRebirthState. Ils étaient en plus multipliés ici au NUMBER
   * courant (Beard et NGU comptés deux fois, Fruit et Hack appliqués au
   * mauvais endroit). L'Attaque/Défense ne lit que le NUMBER courant.
   */
  const number = Math.max(1e-300, state.rebirth.number);
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
    /* Fruit of Power δ : Attack/Defense permanent, toujours actif (idle-yggdrasil-extra-v1.js). */
    idleYggPowerDeltaMultiplierV1(ygg) *
    diggers.stats *
    perkBonuses.statMultiplier *
    quirkBonuses.statMultiplier *
    wishBonuses.statMultiplier *
    nguFx.attackDefense *
    hackFx.attackDefense *
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

  /* Cards : bonus accumulés appliqués en un seul point sur le résultat (idleCardsApplyToBonusesV1). */
  return idleCardsApplyToBonusesV1(state, {
    attackMultiplier: attackMultiplier * richJerksAttackMultiplier * equipmentAttackMultiplier,
    /* Part « équipement d'Aventure » du produit ci-dessus (Adventure n'existe qu'à partir du boss 4 de chaque run : voir statsCombatPrincipalSorealIdleV413_). */
    equipmentAttackMultiplier,
    equipmentDefenseMultiplier,
    defenseMultiplier:
      attackMultiplier *
      richJerksDefenseMultiplier *
      equipmentDefenseMultiplier,
    adventureMultiplier:
      challengeBonuses.adventureStatsMultiplier *
      perkBonuses.adventureStatsMultiplier *
      quirkBonuses.adventureStatsMultiplier *
      wishBonuses.adventureStatsMultiplier *
      evilAccsAdventureStats *
      beardAdventure *
      diggers.adventure *
      nguFx.adventure *
      hackFx.adventureStats,
    /*
     * 2026-09-23 (audit) : wiki Advanced Training -- « Bonus% for Adventure
     * Power/Toughness = Level^0.4 x 10 » : il s'applique à la Power et à la
     * Toughness D'AVENTURE (pas à l'Attack/Defense de Fight Boss). Le terme
     * (1 + sqrt(L) x 0,008) qui le remplaçait ici n'avait aucune source.
     */
    adventurePowerMultiplier:
      challengeBonuses.adventureStatsMultiplier *
      perkBonuses.adventureStatsMultiplier *
      quirkBonuses.adventureStatsMultiplier *
      wishBonuses.adventureStatsMultiplier *
      evilAccsAdventureStats *
      beardAdventure *
      diggers.adventure *
      nguFx.adventure *
      hackFx.adventureStats *
      atPowerBonus,
    adventureToughnessMultiplier:
      challengeBonuses.adventureStatsMultiplier *
      perkBonuses.adventureStatsMultiplier *
      quirkBonuses.adventureStatsMultiplier *
      wishBonuses.adventureStatsMultiplier *
      evilAccsAdventureStats *
      beardAdventure *
      diggers.adventure *
      nguFx.adventure *
      hackFx.adventureStats *
      atToughnessBonus,
    /* Block Damage Reduction (wiki Advanced Training) : (Level + 50) / (Level + 100) -- 50 % au niveau 0. */
    blockReduction: (Math.max(0, atBlock) + 50) / (Math.max(0, atBlock) + 100),
    /* Gains absolus hors équipement : Fruit of Adventure, perk Newbie (+100), Iron Pill (Blood^0.25 : Power/Toughness, HP x3, regen x0,03). */
    adventureBaseFlat: {
      power: num(yggPermanent.adventurePower, 0) + perkBonuses.adventurePowerFlat + ironPillPoints,
      toughness: num(yggPermanent.adventureToughness, 0) + perkBonuses.adventureToughnessFlat + ironPillPoints,
      hp: num(yggPermanent.adventureHp, 0) + ironPillPoints * 3,
      regen: num(yggPermanent.adventureRegen, 0) + ironPillPoints * 0.03
    },
    dropMultiplier:
      idleSelloutPotionFactorV1(state, "luck") *
      beardDrop *
      diggers.drop *
      perkBonuses.dropChanceMultiplier *
      nguFx.dropChance *
      hackFx.dropChance *
      (1 + num(adventureGear.specials?.dropChancePct, 0) / 100) *
      (1 + num(yggPermanent.luckDropPct,0)/100) *
      /*
       * Blood Spaghetti (wiki NGU, page Blood Magic) — bonus de Drop
       * Chance calculé dans castBloodSpell() mais jamais lu par ce
       * multiplicateur jusqu'ici (bug "effet calculé mais jamais
       * appliqué"), câblé ici pour la première fois.
       */
      Math.max(1, num(state.systems.bloodMagic?.data?.spells?.bloodSpaghetti, 1)),
    /* My Red Heart (page Yggdrasil, EXPBonus : "(1 + RedHeartEXPBonus)") : équipé ou set complété, idle-hearts-v1.js. */
    xpMultiplier: diggers.experience * nguFx.exp * hackFx.exp * perkBonuses.expEarningsMultiplier * (1 + num(state.bonuses.cookingExp, 0)) * (1 + 0.005 * wishLevelV1(state, 61)) * idleHeartsExpMultiplierV1(state, adventureGear.specials),
    respawnReduction: respawnReductionV1(state, nguFx, adventureGear, perkBonuses),
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
    adventureGoldMultiplier: perkBonuses.adventureGoldMultiplier * quirkBonuses.adventureGoldMultiplier * nguFx.gold * (1 + num(adventureGear.specials?.goldDropsPct, 0) / 100) * challengeBonuses.goldDropChallengeMultiplier,
    energySpeedFlat: num(adventurePermanent.energySpeedFlat, 0),
    energyPowerFlat: num(adventurePermanent.energyPowerFlat, 0)+perkBonuses.energyPowerFlat,
    energyBarsFlat: num(adventurePermanent.energyBarsFlat, 0)+perkBonuses.energyBarsFlat,
    energyPowerMultiplier: idleSelloutPotionFactorV1(state, "energyPower") * perkBonuses.energyPowerMultiplier * quirkBonuses.energyPowerMultiplier * wishBonuses.energyPowerMultiplier * (1 + num(adventureGear.specials?.energyPowerPct, 0) / 100),
    energyBarsMultiplier: idleSelloutPotionFactorV1(state, "energyBars") * perkBonuses.energyBarsMultiplier * quirkBonuses.energyBarsMultiplier * wishBonuses.energyBarsMultiplier * (1 + num(adventureGear.specials?.energyBarsPct, 0) / 100),
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
    magicPowerMultiplier: idleSelloutPotionFactorV1(state, "magicPower") * perkBonuses.magicPowerMultiplier * quirkBonuses.magicPowerMultiplier * wishBonuses.magicPowerMultiplier * (1 + num(adventureGear.specials?.magicPowerPct, 0) / 100),
    magicBarsMultiplier: idleSelloutPotionFactorV1(state, "magicBars") * perkBonuses.magicBarsMultiplier * quirkBonuses.magicBarsMultiplier * wishBonuses.magicBarsMultiplier * (1 + num(adventureGear.specials?.magicBarsPct, 0) / 100),
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
    /* Incriminating Evidence (set) : +2 base R3 Power / +80K base R3 Cap / +2 base R3 Bars (adventure.permanent). */
    r3PowerFlat: num(adventurePermanent.r3PowerFlat, 0),
    r3CapFlat: num(adventurePermanent.r3CapFlat, 0),
    r3BarsFlat: num(adventurePermanent.r3BarsFlat, 0),
    r3PowerMultiplier: idleSelloutPotionFactorV1(state, "r3Power") * wishBonuses.r3PowerMultiplier * quirkBonuses.r3PowerMultiplier * perkBonuses.r3PowerMultiplier * gearPctV1(adventureGear.specials, "r3PowerPct"),
    r3CapMultiplier: wishBonuses.r3CapMultiplier * quirkBonuses.r3CapMultiplier * perkBonuses.r3CapMultiplier * gearPctV1(adventureGear.specials, "r3CapPct"),
    r3BarsMultiplier: wishBonuses.r3BarsMultiplier * quirkBonuses.r3BarsMultiplier * perkBonuses.r3BarsMultiplier * gearPctV1(adventureGear.specials, "r3BarsPct"),
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
    titanExpBonusKillsFromPerks: perkBonuses.titanExpBonusKills,
    bossExpMultiplierFromPerks: perkBonuses.bossExpMultiplier + challengeBonuses.bossExpPct,
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
    /* Wiki Experience > Misc « Training Auto Advance » (300 EXP) : effet dans advanceBasicTrainingStateV411. */
    basicTrainingAutoAdvance: expShopPurchasedV1(state, "trainingAutoAdvance") >= 1,
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
    /* PPBonus (page Yggdrasil, Fruit of Rage) : sets « PP earnings » en facteurs séparés x NGU PP x Diggers x Perks x Hacks (cartes PP ajoutées par idleCardsApplyToBonusesV1). */
    ppMultiplier: idleAdventureSetRewardProductV1(state.adventure, "itopodPpPct") * nguFx.pp * hackFx.pp * perkBonuses.ppEarningsMultiplier * diggers.pp,
    /* Aucun vrai NGU n'accélère Questing ni le Daycare (pistes inventées retirées). */
    questSpeedMultiplier: 1,
    /* Item Daycare (idle-daycare-v1.js) : vitesse (équipement, Fibonacci, souhait, Blind Evil/Sadistic, Digger, Hack) et facteur de temps. */
    ...(() => { const fx = daycareFactorsV1(state); return { daycareSpeedMultiplier: fx.speedMultiplier, daycareTimeMultiplier: fx.timeFactor, daycareSlots: fx.slots }; })(),
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
    hackSpeedMultiplier: wishBonuses.hackSpeedMultiplier * (1 + Math.max(0, num(idleAdventureCubeTierV1(state.adventure?.cube).hackSpeedPct, 0)) / 100) * gearPctV1(adventureGear.specials, "hackSpeedPct") * hackFx.hackHack * challengeBonuses.hackSpeedChallengeMultiplier * idleHeartsHackSpeedMultiplierV1(state) /* Grey Heart (set) : "25% Faster Hacks!" */,
    wishSpeedMultiplier: wishBonuses.wishSpeedMultiplier * (1 + Math.max(0, num(idleAdventureCubeTierV1(state.adventure?.cube).wishSpeedPct, 0)) / 100) * (1 + Math.max(0, num(state.adventure?.setRewards?.wishSpeedPct, 0))) * gearPctV1(adventureGear.specials, "wishSpeedPct") * hackFx.wish,
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
  });
}

/*
 * Wiki Respawn : temps de base 4 s ; facteurs multiplicatifs (NGU Respawn, set Clock -5 %, perk
 * SPAWN FASTER DAMMIT, souhait « enemies spawned faster » -1 %/niveau) ; les objets « Build Respawn »
 * s'additionnent puis sont plafonnés (48 % Normal, 58 % Evil, 78 % Sadistic). Plancher : 0,34 s.
 */
function respawnReductionV1(state, nguFx, adventureGear, perkBonuses) {
  const cap = state.difficulty === "extreme" ? 78 : state.difficulty === "difficile" ? 58 : 48;
  const itemsPct = Math.min(cap, Math.max(0, num(adventureGear.specials?.respawnReductionPct, 0) - Math.max(0, num(state.adventure?.setRewards?.respawn, 0)) * 100));
  const clockSet = 1 - Math.max(0, Math.min(1, num(state.adventure?.setRewards?.respawn, 0)));
  const wishLevel = Math.max(0, Math.min(10, int(idleWishTracksActifsV1(state)["46"]?.level, 0)));
  const remaining = (1 - nguFx.respawnReduction) * clockSet * perkBonuses.respawnRemaining * (1 - wishLevel * 0.01) * (1 - itemsPct / 100);
  return clamp(1 - remaining, 0, 1 - 0.34 / 4);
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
function idleAdventureCombatStatsV1(gear, context, bonuses) {
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
  /*
   * 2026-09-23 (audit) : jusqu'ici AUCUN multiplicateur d'Adventure Stats
   * n'atteignait le combat (Challenges, Perks, Quirks, Wishes, NGU Adventure
   * alpha/beta, Diggers, Beard BEARd, Advanced Training, Newbie Adventure Perk,
   * Fruit of Adventure, Iron Pill : calculés par idleNguBonuses mais jamais
   * lus). Stats = (base + équipement + permanent + gains absolus) x
   * multiplicateur ; les PV suivent la Power (x3 wiki) et la regen la
   * Toughness (x0,03), donc leurs multiplicateurs.
   */
  const bo = bonuses && typeof bonuses === "object" ? bonuses : null;
  const flat = (bo && bo.adventureBaseFlat) || { power: 0, toughness: 0, hp: 0, regen: 0 };
  const multPower = Math.max(0, num(bo && bo.adventurePowerMultiplier, 1));
  const multToughness = Math.max(0, num(bo && bo.adventureToughnessMultiplier, 1));
  return Object.assign({}, g, {
    power:
      (baseAdventurePower +
        Math.max(0, num(g.power, 0)) +
        Math.max(0, num(permanent.adventurePower, 0)) +
        Math.max(0, num(flat.power, 0))) * multPower,
    toughness:
      (baseAdventureToughness +
        Math.max(0, num(g.toughness, 0)) +
        Math.max(0, num(permanent.adventureToughness, 0)) +
        Math.max(0, num(flat.toughness, 0))) * multToughness,
    hp:
      ((hasExternalAdventurePower ? baseAdventurePower * 3 : BASE_ADVENTURE_HP_V1) +
        Math.max(0, num(g.hp, 0)) +
        Math.max(0, num(permanent.adventureHp, 0)) +
        Math.max(0, num(flat.hp, 0))) * multPower,
    regenBase: baseAdventureRegen,
    regen:
      (baseAdventureRegen +
        Math.max(0, num(g.regen, 0)) +
        Math.max(0, num(permanent.adventureRegen, 0)) +
        Math.max(0, num(flat.regen, 0))) * multToughness,
    blockReduction: bo && Number.isFinite(Number(bo.blockReduction)) ? Number(bo.blockReduction) : 0.5
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
    resources: Object.fromEntries(Object.entries(clone(state.resources)).map(([id, r]) => [
      id,
      { ...r, capBase: r.cap, cap: idleNguEffectiveResourceStatV1(state, id, "cap") }
    ])),
    resourceInfo: Object.fromEntries(
      RESOURCE_KEYS.filter(resource => !(resource === "magic" && !state.systems.bloodMagic?.unlocked) && !(resource === "r3" && !state.systems.hacks?.unlocked))
        .map(resource => [resource, resourceInfoV1(state, resource, context)])
    ),
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
          effectActive: idleSelloutShopEffectActiveV1(item),
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
      snap.stats = idleAdventureCombatStatsV1(gear, context, idleNguBonuses(state));
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
      /*
       * 2026-09-24 (Norman : « les barres se remplissent à fond mais ne repartent pas de 0 ») : wiki, page Augmentations, « Each augment
       * level costs gold ». advanceAugmentationTrackV214_ garde la barre PLEINE tant que l'Or du prochain niveau manque : le client doit
       * le dire (coût, attente) au lieu de laisser croire à un bug. Coûts = augmentationGoldCost, la même fonction que l'achat réel.
       */
      const goldCost = augmentationGoldCost(state, def, num(pair.level, 0), false);
      const upgradeGoldCost = def.upgrade ? augmentationGoldCost(state, def, num(pair.upgradeLevel, 0), true) : null;
      const gold = num(state.currencies?.gold, 0);
      const defiBloque = challengeHundredLevelsRemaining(state) <= 0;
      const attenteOr = (needed, progress, cost) => Number.isFinite(needed) && needed > 0 && num(progress, 0) >= needed - 1e-9 && (gold + 1e-9 < cost || defiBloque);
      return Object.assign({}, def, {
        goldCost,
        upgradeGoldCost,
        waitingGold: attenteOr(neededMain, pair.progress, goldCost),
        upgradeWaitingGold: upgradeGoldCost != null && attenteOr(neededUpgrade, pair.upgradeProgress, upgradeGoldCost),
        progressPct: Number.isFinite(neededMain) && neededMain > 0 ? Math.max(0, Math.min(1, num(pair.progress, 0) / neededMain)) : 0,
        upgradeProgressPct: Number.isFinite(neededUpgrade) && neededUpgrade > 0 ? Math.max(0, Math.min(1, num(pair.upgradeProgress, 0) / neededUpgrade)) : 0,
        secondsPerLevel: Number.isFinite(neededMain) ? neededMain : null,
        upgradeSecondsPerLevel: Number.isFinite(neededUpgrade) ? neededUpgrade : null,
        levelsPerSecond: Number.isFinite(neededMain) && neededMain > 0 ? Math.min(50,1/neededMain) : 0,
        upgradeLevelsPerSecond: Number.isFinite(neededUpgrade) && neededUpgrade > 0 ? Math.min(50,1/neededUpgrade) : 0
      });
    }),
    ngus: nguSnapshotV1(state, context),
    /* Slots de souhaits (page Wishes, 4 au maximum) : un souhait et une allocation par slot. */
    wishSlots: wishSlotsSnapshotV1(state),
    cards: idleCardsSnapshotV1(state),
    bloodRituals: clone(IDLE_NGU_BLOOD_RITUALS),
    yggFruits: clone(IDLE_NGU_YGG_FRUITS.filter(def => !idleYggIsMayoFruitV1(def.id) || idleYggFruitUnlockedV1(state, def.id) || num(state.systems.yggdrasil?.data?.fruits?.[def.id]?.tier, 0) > 0)),
    /* Yggdrasil : Poop, Auto-Activate, durée d'un tier, coût du prochain tier (idle-yggdrasil-extra-v1.js). */
    yggExtra: idleYggExtraSnapshotV1(state, IDLE_NGU_YGG_FRUITS, { maxTier: yggMaxTier(state), tierCost: yggTierUpgradeCost }),
    diggerDefinitions: clone(IDLE_NGU_DIGGERS),
    /* MacGuffin Fragments : catalogue, slots, compteurs et bonus permanents (idle-macguffins-v1.js). */
    macguffins: macguffinSnapshotV1(state, nowMs(now)),
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
    /* Wiki : les Perks et Quirks « Evil only » / « Sadistic only » n'existent qu'à partir de cette difficulté (déjà possédés : gardés, inactifs). */
    perkDefinitions: clone(IDLE_PERKS_CATALOG_V1.filter(p => idleDifficulteSuffisanteV1(IDLE_PERK_DIFFICULTE_V1, p.id, state.difficulty) || num(state.systems.perks?.data?.levels?.[p.id], 0) > 0)),
    quirkDefinitions: clone(IDLE_QUIRKS_CATALOG_V1.filter(q => idleDifficulteSuffisanteV1(IDLE_QUIRK_DIFFICULTE_V1, q.id, state.difficulty) || num(state.systems.quirks?.data?.levels?.[q.id], 0) > 0)),
    /* Item Daycare : slots, objets placés (progression, ETA) et objets de l'inventaire plaçables. */
    daycare: idleDaycareSnapshotV1(state.systems.daycare.data, state.adventure, daycareFactorsV1(state)),
    /* Automatisation de l'inventaire : déblocages, réglages, minuteurs, slots d'automerge, loadouts, filtre. */
    inventoryAuto: idleInventoryAutoSnapshotV1(state.adventure, inventoryAutoEnvV1(state)),
    /* Questing (crochet 4/4) : état de quête prêt à afficher (idle-questing-v1.js). */
    questing: state.systems.questing?.unlocked ? idleQuestingSnapshotV1(state, questingEnvV1(state, context)) : { unlocked: false },
    /*
     * Audit 2026-09-16 : le client n'avait aucun moyen de connaître le coût
     * EXP/plafond des achats Spend EXP (energy/magic/r3) — jamais exposé
     * avant, uniquement utilisé côté serveur par buyResource(). Même
     * gabarit que perkDefinitions/quirkDefinitions ci-dessus : un catalogue
     * statique cloné, jamais une formule recalculée côté client.
     */
    resourcePurchases: clone(IDLE_NGU_RESOURCE_PURCHASES),
    expShop: expShopSnapshotV1(state),
    /* Achievements (2026-09-24) : catalogue, succès débloqués, BP et facteur AP (idle-achievements-v1.js). */
    achievements: achievementsSnapshotV1(state),
    /* Écran Broken Time Machine (facteurs du GPS, barres, niveaux cibles). */
    timeMachineView: state.systems.timeMachine?.unlocked ? timeMachineViewV1(state) : null,
    /* Player Portraits : portraits débloqués, choix courant, Special Prize (idle-portraits-v1.js). */
    portraits: idlePortraitsSnapshotV1(state.records.portrait, portraitEnvV1(state), num(state.records.specialPrizeClaimed, 0) > 0, num(state.records.specialPrizeChoice, 0)),
    richJerks: {
      attackLevel: Math.max(0, int(state.bonuses.richJerksAttackLevel, 0)),
      defenseLevel: Math.max(0, int(state.bonuses.richJerksDefenseLevel, 0)),
      cost: RICH_JERKS_COST_EXP_V1,
      pctPerLevel: RICH_JERKS_PCT_PER_LEVEL_V1
    },
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
      tracks: (IDLE_NGU_TRACKS[def.id] || []).filter(track => def.id !== "wishes" || idleWishAccessibleV1(state, track.id) || num(state.systems.wishes?.data?.tracks?.[track.id]?.level, 0) > 0).map(track => ({
        ...track,
        unlocked: def.id !== "beards" || beardTrackUnlocked(state, track),
        state: clone(state.systems[def.id].data.tracks?.[track.id] || { level: 0, tempLevel: 0, permanentLevel: 0, progress: 0 }),
        active: def.id === "beards"
          ? beardActiveIdsV1(state).includes(track.id)
          : def.id === "wishes"
            ? (state.systems.wishes.data.slots || []).slice(0, wishSlotCountV1(state)).some(x => x.wish === track.id)
            : state.systems[def.id].data.activeTrack === track.id
      })),
      /* Cooking : vue publique, sans les cibles secrètes du repas. */
      state: def.id === "cooking" ? idleCookingSystemSnapshotV1(state, nowMs(now)) : clone(state.systems[def.id])
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
  if (id === "beards") {
    const list = Array.isArray(s.data.activeTracks) ? s.data.activeTracks.slice() : (s.data.activeTrack ? [s.data.activeTrack] : []);
    const idx = list.indexOf(trackId);
    if (idx >= 0) list.splice(idx, 1);
    else {
      list.push(trackId);
      while (list.length > beardSlotsV1(state)) list.shift();
    }
    s.data.activeTracks = list;
    s.data.activeTrack = list[list.length - 1] || "";
    s.active = list.length > 0;
    return;
  }
  s.data.activeTrack = trackId;
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
  /* Wiki Wandoos : Wandoos MEH se débloque en complétant le set Jake. */
  if (osId === "meh" && !state.adventure?.setRewards?.wandoosMeh) throw new Error("OS_VERROUILLE");
  /* Fiche "A busted copy of Wandoos XL" : l'OS XL se débloque en consommant une copie (idle-wandoos-os-v1.js). */
  if (osId === "xl" && !idleWandoosXlUnlockedV1(state)) throw new Error("OS_VERROUILLE");
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
  if (!ritual || !ritualUnlocked(ritual, context, state)) throw new Error("RITUEL_VERROUILLE");
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

/*
 * Money Pit, « One-Time Bonuses » (2026-09-24, audit des pages-guides : la FAQ les cite, rien
 * ne les versait). Seuils sur l'or TOTAL jeté (« sum over many tosses »), une fois chacun :
 *  - 1E8  : +100 Max Health et +1 Health Regen d'Aventure (page Money Pit + FAQ « 100M+ gold :
 *           +100 Max HP, +1 HP Regen ») ;
 *  - 1E10 : +1 Energy Bar et +1 Magic Bar (pages Money Pit, Energy et Magic ; la FAQ, plus
 *           ancienne, disait 1B) ;
 *  - 1E11 : Looty McLootFace (page Money Pit, FAQ « ~100b? lootymclootyface ») ; niveau non
 *           publié -> niveau de drop du catalogue (0). Non marqué versé tant que le sac est plein ;
 *  - 1E12 : +100 EXP (page Money Pit).
 * Non versé : le « +10 Power, +10 Toughness » du palier 1E8 (page Money Pit) que la FAQ donne
 * à « +1 Adventure attack and defense » : sources contradictoires, laissé en suspens.
 */
const MONEY_PIT_ONE_TIME_BONUSES_V1 = Object.freeze([
  Object.freeze({ bit: 1, gold: 1e8, adventureHp: 100, adventureRegen: 1 }),
  Object.freeze({ bit: 2, gold: 1e10, energyBars: 1, magicBars: 1 }),
  Object.freeze({ bit: 4, gold: 1e11, item: "lootyMcLootFace" }),
  Object.freeze({ bit: 8, gold: 1e12, experience: 100 })
]);

function applyMoneyPitOneTimeBonusesV1(state) {
  const total = Math.max(0, num(state.systems.moneyPit?.data?.totalGoldTossed, 0));
  let mask = Math.max(0, int(state.records.moneyPitOneTimeMask, 0));
  const out = [];
  const adv = state.adventure && typeof state.adventure === "object" ? state.adventure : null;
  const permanent = adv ? (adv.permanent = adv.permanent && typeof adv.permanent === "object" ? adv.permanent : {}) : null;
  for (const b of MONEY_PIT_ONE_TIME_BONUSES_V1) {
    if (total < b.gold || (mask & b.bit)) continue;
    if (b.item) {
      if (!adv) continue;
      const def = IDLE_ADVENTURE_SPECIALS[b.item];
      const livre = idleAdventureAddItemV1(adv, idleAdventureSpecialItemV1(b.item, int(def?.dropLevel, 0)));
      if (!livre) continue;
    } else if (!permanent) {
      continue;
    }
    if (b.adventureHp) permanent.adventureHp = Math.max(0, num(permanent.adventureHp, 0)) + b.adventureHp;
    if (b.adventureRegen) permanent.adventureRegen = Math.max(0, num(permanent.adventureRegen, 0)) + b.adventureRegen;
    if (b.energyBars) permanent.energyBarsFlat = Math.max(0, num(permanent.energyBarsFlat, 0)) + b.energyBars;
    if (b.magicBars) permanent.magicBarsFlat = Math.max(0, num(permanent.magicBarsFlat, 0)) + b.magicBars;
    if (b.experience) state.currencies.experience = Math.max(0, num(state.currencies.experience, 0)) + b.experience;
    mask |= b.bit;
    out.push(b.gold);
  }
  state.records.moneyPitOneTimeMask = mask;
  return out;
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
    /*
     * 2026-09-23 (audit, page Money Pit) : paliers 5 à 11 complétés avec TOUTES leurs colonnes
     * (Adv Stat, Cube P/T ou les deux, HP, regen, EXP, Wandoos, Seeds). Le tirage reste un seul
     * type de récompense au hasard. « Equip +1 LVL » (équipement/Daycare) n'est pas modélisé.
     */
    [{ adventureStats: 20 }, { cubePower: 5 }, { cubeToughness: 5 }, { cubeBoth: 3 }, { adventureHp: 150 }, { adventureRegen: 1.5 }, { experience: 10 }, { seeds: 10 }],
    [{ adventureStats: 50 }, { cubePower: 10 }, { cubeToughness: 10 }, { cubeBoth: 5 }, { adventureHp: 200 }, { adventureRegen: 2 }, { experience: 25 }, { wandoos: 1, wandoosMax: 20 }, { seeds: 25 }],
    [{ adventureStats: 100 }, { cubePower: 20 }, { cubeToughness: 20 }, { cubeBoth: 10 }, { adventureHp: 300 }, { adventureRegen: 3 }, { experience: 25 }, { wandoos: 1, wandoosMax: 50 }, { seeds: 100 }],
    [{ adventureStats: 150 }, { cubePower: 50 }, { cubeToughness: 50 }, { cubeBoth: 25 }, { adventureHp: 450 }, { adventureRegen: 5 }, { experience: 200 }, { wandoos: 2, wandoosMax: 100 }, { seeds: 200 }],
    [{ adventureStats: 200 }, { cubePower: 100 }, { cubeToughness: 100 }, { cubeBoth: 50 }, { adventureHp: 700 }, { adventureRegen: 6 }, { experience: 300 }, { wandoos: 2, wandoosMax: 100 }, { seeds: 300 }],
    [{ adventureStats: 250 }, { cubePower: 150 }, { cubeToughness: 150 }, { cubeBoth: 75 }, { adventureHp: 750 }, { adventureRegen: 7.5 }, { experience: 400 }, { wandoos: 2, wandoosMax: 100 }, { seeds: 500 }],
    [{ adventureStats: 300 }, { cubePower: 200 }, { cubeToughness: 200 }, { cubeBoth: 100 }, { adventureHp: 900 }, { adventureRegen: 9 }, { experience: 500 }, { wandoos: 3, wandoosMax: 100 }, { seeds: 700 }]
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
    } else if (k === "cubePower" || k === "cubeToughness" || k === "cubeBoth") {
      const cube = state.adventure.cube && typeof state.adventure.cube === "object" ? state.adventure.cube : (state.adventure.cube = { power: 0, toughness: 0 });
      if (k !== "cubeToughness") cube.power = Math.max(0, num(cube.power, 0)) + v;
      if (k !== "cubePower") cube.toughness = Math.max(0, num(cube.toughness, 0)) + v;
      reward[k] = (reward[k] || 0) + v;
    } else if (k === "wandoos") {
      const os = state.systems.wandoos?.data?.osLevels;
      if (os) {
        const max = Math.min(100, num(choix.wandoosMax, 100));
        const gained = Math.max(0, Math.min(v, max - num(os.moneyPit, 0)));
        os.moneyPit = Math.max(0, num(os.moneyPit, 0)) + gained;
        reward.wandoosLevels = (reward.wandoosLevels || 0) + gained;
      }
    } else if (k === "wandoosMax") {
      /* plafond du palier, traité avec "wandoos" */
    } else if (k === "experience") {
      /* Wiki : « EXP rewards are affected by EXP bonus » */
      reward.experience = (reward.experience || 0) + v * Math.max(0, num(idleNguBonuses(state).xpMultiplier, 1));
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
  // Bonus AP commun appliqué comme aux autres sources (page Arbitrary Points), arrondi inférieur.
  reward.ap = apWithBonusV1(state, Math.floor(Math.log10(cost)));

  const oneTime = applyMoneyPitOneTimeBonusesV1(state);

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
  // Seuils d'or total des One-Time Bonuses versés par ce jet (hors `reward`, qui ne décrit que le tirage).
  if (oneTime.length) resultat.oneTime = oneTime;

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
  /*
   * 2026-09-23 : table complète de la page Daily Spin (chaque palier totalise 100 %). Les potions, Lucky Charm et
   * Bar Bar sont désormais réels (boutique Sellout) et s'activent immédiatement. MacGuffin Muffin : réel depuis le
   * 2026-09-23 (IDLE_SELLOUT_EFFECTS_V1.macguffinMuffin, consommé au Rebirth par idle-macguffins-v1.js). Beast
   * Butter (Questing) et Poop (IDLE_SELLOUT_EFFECTS_V1.poop -> stock state.selloutEffects.poop, utilisé sur un fruit
   * d'Yggdrasil, idle-yggdrasil-extra-v1.js) sont réels depuis le 2026-09-23.
   */
  const P = (item, poids, n = 1) => ({ items: { [item]: n }, poids });
  const JACKPOTS = {
    3: { energyPotionAlpha: 1, energyPotionBeta: 1, magicPotionAlpha: 1, magicPotionBeta: 1, luckyCharm: 1, energyBarBar: 1, magicBarBar: 1, poop: 2 },
    4: { energyPotionAlpha: 1, energyPotionBeta: 1, energyPotionDelta: 1, magicPotionAlpha: 1, magicPotionBeta: 1, magicPotionDelta: 1, luckyCharm: 1, energyBarBar: 1, magicBarBar: 1, poop: 5, superLuckyCharm: 1, littleBluePill1000: 1 },
    5: { energyPotionAlpha: 2, energyPotionBeta: 2, energyPotionDelta: 1, magicPotionAlpha: 2, magicPotionBeta: 2, magicPotionDelta: 1, luckyCharm: 2, energyBarBar: 2, magicBarBar: 2, poop: 10, superLuckyCharm: 1, littleBluePill1000: 2, beastButter: 1, macguffinMuffin: 1 },
    6: { energyPotionAlpha: 2, energyPotionBeta: 2, energyPotionDelta: 2, magicPotionAlpha: 2, magicPotionBeta: 2, magicPotionDelta: 2, luckyCharm: 3, energyBarBar: 3, magicBarBar: 3, poop: 25, superLuckyCharm: 2, littleBluePill1000: 3, beastButter: 2, macguffinMuffin: 2 },
    7: { energyPotionAlpha: 3, energyPotionBeta: 3, energyPotionDelta: 3, magicPotionAlpha: 3, magicPotionBeta: 3, magicPotionDelta: 3, luckyCharm: 3, energyBarBar: 3, magicBarBar: 3, poop: 25, superLuckyCharm: 3, littleBluePill1000: 5, beastButter: 3, macguffinMuffin: 3 }
  };
  const J = (t, poids) => ({ items: JACKPOTS[t], poids });
  const IDLE_DAILY_SPIN_REWARDS_V1 = [
    [{ ap: 50, poids: 70 }, { ap: 100, poids: 30 }],
    [{ ap: 100, poids: 53 }, { ap: 200, poids: 35 }, { ap: 1000, poids: 10 }, P("energyPotionAlpha", 1), P("magicPotionAlpha", 1)],
    [{ ap: 200, poids: 53 }, { ap: 400, poids: 30 }, { ap: 2000, poids: 10 }, P("energyPotionAlpha", 1), P("magicPotionAlpha", 1), P("energyPotionBeta", 1), P("magicPotionBeta", 1), P("luckyCharm", 1), P("energyBarBar", 1), P("magicBarBar", 1)],
    [{ ap: 300, poids: 37 }, { ap: 600, poids: 25 }, { ap: 3000, poids: 10 }, P("energyPotionAlpha", 2), P("magicPotionAlpha", 2), P("energyPotionBeta", 1), P("magicPotionBeta", 1), P("luckyCharm", 2), P("energyBarBar", 2), P("magicBarBar", 2), { seeds: 20, poids: 10 }, P("poop", 5, 2), J(3, 0.5), { ap: 50000, poids: 0.5 }],
    [{ ap: 500, poids: 50 }, { ap: 1000, poids: 25 }, { ap: 5000, poids: 10 }, P("energyPotionAlpha", 1), P("magicPotionAlpha", 1), P("energyPotionBeta", 1), P("magicPotionBeta", 1), P("luckyCharm", 1), P("energyBarBar", 1), P("magicBarBar", 1), { seeds: 100, poids: 5 }, P("poop", 1, 5), J(4, 0.5), { ap: 75000, poids: 0.5 }, P("energyPotionDelta", 0.5), P("magicPotionDelta", 0.5)],
    [{ ap: 800, poids: 36 }, { ap: 1600, poids: 25 }, { ap: 8000, poids: 10 }, P("energyPotionAlpha", 2), P("magicPotionAlpha", 2), P("energyPotionBeta", 1), P("magicPotionBeta", 1), P("luckyCharm", 2), P("energyBarBar", 2), P("magicBarBar", 2), { seeds: 400, poids: 10 }, P("poop", 5, 10), J(5, 0.5), { ap: 100000, poids: 0.5 }, P("energyPotionDelta", 0.5), P("magicPotionDelta", 0.5)],
    [{ ap: 1200, poids: 35 }, { ap: 2400, poids: 25 }, { ap: 12000, poids: 10 }, P("energyPotionAlpha", 2, 2), P("magicPotionAlpha", 2, 2), P("energyPotionBeta", 1, 2), P("magicPotionBeta", 1, 2), P("luckyCharm", 2, 2), P("energyBarBar", 2, 2), P("magicBarBar", 2, 2), { seeds: 2000, poids: 10 }, P("poop", 5, 25), P("energyPotionDelta", 1), P("magicPotionDelta", 1), J(6, 0.5), { ap: 150000, poids: 0.5 }],
    [{ ap: 1500, poids: 35 }, { ap: 3000, poids: 25 }, { ap: 15000, poids: 10 }, P("energyPotionAlpha", 2, 2), P("magicPotionAlpha", 2, 2), P("energyPotionBeta", 1, 2), P("magicPotionBeta", 1, 2), P("luckyCharm", 2, 2), P("energyBarBar", 2, 2), P("magicBarBar", 2, 2), { seeds: 5000, poids: 10 }, P("poop", 5, 25), P("energyPotionDelta", 1), P("magicPotionDelta", 1), J(7, 0.5), { ap: 175000, poids: 0.5 }]
  ];
  const table = IDLE_DAILY_SPIN_REWARDS_V1[Math.min(tier, IDLE_DAILY_SPIN_REWARDS_V1.length - 1)];
  const poidsTotal = table.reduce((sum, entree) => sum + entree.poids, 0);
  let curseur = Math.random() * poidsTotal;
  let choix = table[table.length - 1];
  for (const entree of table) {
    if (curseur < entree.poids) { choix = entree; break; }
    curseur -= entree.poids;
  }
  let reward;
  if (choix.items) {
    reward = { items: Object.assign({}, choix.items) };
    for (const [id, n] of Object.entries(choix.items)) idleSelloutApplyEffectV1(state, id, n);
  } else {
    reward = choix.ap ? { ap: choix.ap } : { seeds: choix.seeds };
    /* AP : bonus AP commun (page Arbitrary Points : toutes les sources sauf ITOPOD), arrondi inférieur. */
    if (reward.ap) reward.ap = apWithBonusV1(state, reward.ap);
    for (const [k, v] of Object.entries(reward)) state.currencies[k] += v;
  }

  s.level = totalBefore + 1;
  s.data.totalSpins = s.level;
  /*
   * Cadence de 24 h, temps en retard « banké » vers le prochain tour. Plafond de banque : « maximum time banked by the
   * daily spin system from 36 hours to 7 days » (4G's Sellout Shop, 7-Day Time Bank for Daily Spin!) : le plafond
   * total (24 h de cadence + retard banké) passe de 36 h à 7 jours, soit 12 h puis 144 h de retard banké
   * (lecture retenue : le retard banké de 12 h du code d'origine est bien 36 h - 24 h).
   */
  const bankCapMs = (state.selloutShop?.purchases?.dailySpinTimeBank > 0 ? 7 * 24 : 36) * 3600000 - 24 * 3600000;
  const bankedMs = Math.min(bankCapMs, Math.max(0, now - previousReadyAt));
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

function challengeDefinition(id, tier = "normal") {
  return challengeDefsForTierV1(tier).find(def=>def.id===String(id||"")) || null;
}

function challengeUnlocked(def,state,context={}) {
  if(!def||!state.systems.challenges?.unlocked)return false;
  /* Wiki : les défis Evil/Sadistic sont débloqués en entrant dans la difficulté. */
  if(def.tier&&def.tier!=="normal")return true;
  const highestBoss=Math.max(0,int(state.records.highestBoss,context.bosses||0));
  if(def.id==="basic")return highestBoss>=58;
  if(def.id==="noAugmentations")return highestBoss>=75;
  if(def.id==="twentyFourHours")return num(state.challenge.bestMs?.basic,Infinity)<=24*3600000;
  if(def.id==="hundredLevels")return challengeNguLevels(state)>=10;
  /* Wiki Challenges : « Discover (NOT complete) every piece of the GRB set » -- les 7 pièces vues au moins une fois. */
  if(def.id==="noEquipment"){
    const grbVues=["head","chest","legs","boots","weapon","necklace","meat"].every(slot=>Boolean(state.adventure?.itemList?.["grb:"+slot]?.seen));
    return Boolean(grbVues||state.adventure?.completedSets?.grb||state.adventure?.setRewards?.noEquipmentChallenge);
  }
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
  const tier=challengeTierV1(state);
  const completions=challengeCompletionsV1(state,tier);
  return challengeDefsForTierV1(tier).map(def=>{
    const completion=Math.max(0,int(completions?.[def.id],0));
    return Object.assign({},clone(def),{
      tier,
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
    state.challenge.activeTier="normal";
    state.challenge.startedAt=0;
    return {stopped:Boolean(stopped),challenge:stopped};
  }

  const id=String(payload.challenge||state.challenge.active||"basic");
  const tier=challengeTierV1(state);
  const def=challengeDefinition(id,tier);
  if(!def)throw new Error("DEFI_INVALIDE");
  const completions=challengeCompletionsV1(state,tier);

  if(mode==="complete"){
    if(state.challenge.active!==id)throw new Error("DEFI_NON_ACTIF");
    const before=Math.max(0,int(completions[id],0));
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
    const rewardScale=def.reward?.scaleByNumber?before+1:1;
    const rewardExperience=Math.max(0,num(def.reward?.experience,0))*rewardScale;
    const rewardAp=Math.max(0,num(def.reward?.ap,0))*rewardScale;
    if(rewarded){
      completions[id]=before+1;
      state.currencies.experience+=rewardExperience;
      /* Page Arbitrary Points : AP des défis majoré par le bonus AP commun, arrondi inférieur. */
      state.currencies.ap+=apWithBonusV1(state,rewardAp);
      /* Basic Challenge Sadistic : mayo de chaque type (page Challenges, idle-cards-v1.js). */
      if(tier==="extreme"&&id==="basic")idleCardsGrantChallengeMayoV1(state,completions[id]);
    }
    if(tier==="normal"){
      const oldBest=num(state.challenge.bestMs?.[id],Infinity);
      state.challenge.bestMs[id]=Math.min(oldBest,elapsed);
    }
    state.challenge.active="";
    state.challenge.activeTier="normal";
    state.challenge.startedAt=0;
    return {
      completed:id,
      tier,
      completion:Math.max(0,int(completions[id],0)),
      targetBoss:target,
      rewarded,
      reward:rewarded?{experience:rewardExperience,ap:rewardAp}:{experience:0,ap:0},
      elapsedMs:elapsed
    };
  }

  if(mode!=="start")throw new Error("ACTION_DEFI_INVALIDE");
  if(state.challenge.active)throw new Error("DEFI_DEJA_ACTIF");
  if(!challengeUnlocked(def,state,context))throw new Error("DEFI_VERROUILLE");
  if(!def.implemented)throw new Error("DEFI_EN_PREPARATION");
  state.challenge.activeTier=tier;

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
    targetBoss:challengeTargetBoss(def,completions[id]),
    tier,
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
/*
 * Consommables de complétion de set (Forest, HSB, Gaudy, Incriminating
 * Evidence ; voir accorderConsommablesSetsV1 dans idle-adventure-v47.js) :
 * activés immédiatement comme ceux de la roue quotidienne, puis retirés de la
 * file d'attente -- jamais appliqués deux fois.
 */
function appliquerConsommablesSetsAventureV1(state) {
  const file = state.adventure?.pendingSetConsumablesV1;
  if (!file || typeof file !== "object") return;
  for (const [id, n] of Object.entries(file)) idleSelloutApplyEffectV1(state, id, Math.max(0, int(n, 0)));
  state.adventure.pendingSetConsumablesV1 = {};
}

function crediterRecompensesAventure(state, avant) {
  appliquerConsommablesSetsAventureV1(state);
  const p = state.adventure?.permanent || {};
  const gain = (cle) => Math.max(0, num(p[cle], 0) - num(avant[cle], 0));
  /*
   * 2026-09-24 (audit, page Yggdrasil, Nerdy Formulas) : « EXPBonus is bonus applied to all experience
   * gain (This can be found in Stat Breakdowns) : NGU EXP x (1 + RedHeart) x Fibonacci 987 x Digger EXP x
   * Hacks EXP x Wish 61 x Cooking EXP ». L'EXP de l'aventure (drops de boss de zone, titans, bonus de
   * complétion d'objets) était créditée brute ; seuls les boss de Fight Boss, l'ITOPOD, le Money Pit et
   * le Fruit of Knowledge recevaient ce bonus.
   */
  state.currencies.experience += gain("experience") * Math.max(0, num(idleNguBonuses(state).xpMultiplier, 1));
  state.currencies.gold += gain("gold");
  const perksGain = perkBonusesV1(idlePerkNiveauxV1(state));
  /*
   * "the final AP value is rounded down" (page Arbitrary Points). LIMITE : l'arrondi
   * porte sur le lot crédité par cet appel (boss d'Aventure, titans, sets), pas sur
   * chaque événement -- le moteur d'Aventure ne transmet qu'un delta cumulé.
   */
  state.currencies.ap += apWithBonusV1(state, gain("ap"));
  state.currencies.qp += gain("qp") * perksGain.qpEarningsMultiplier;
  /* Poop d'Icarus Proudbottom (The Sky, rollKill) : ajoutée au stock de Poop d'Yggdrasil. */
  const poop = Math.floor(gain("poop"));
  if (poop > 0) idleSelloutApplyEffectV1(state, "poop", poop);
  /* Page Yggdrasil : « PPBonus is bonus applied to all Perk Points gain » : le PP des titans reçoit le même facteur que l'ITOPOD. */
  const pp = gain("ppProgress") * Math.max(0, num(idleNguBonuses(state).ppMultiplier, 1));
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
/* Niveau d'un souhait (0 si absent). */
function wishLevelV1(state, id) {
  return Math.max(0, int(idleWishTracksActifsV1(state)[String(id)]?.level, 0));
}
/* Souhait 20 (« I didn't have to wait 3 minutes per rebirth ») : -10 s par niveau sur les 180 s minimum. */
function minRebirthSecondsV1(state) {
  return Math.max(0, MIN_REBIRTH_SECONDS - 10 * Math.min(6, wishLevelV1(state, 20)));
}

/* Conditions de déblocage des portraits de joueur (sets complétés, souhaits, fragments SEXY/SMART). */
/* Set dont les 4 pièces d'armure (tête, torse, jambes, bottes) sont équipées, quel que soit leur niveau ; "" sinon. Les BOTH Edgy Boots comptent pour le set Edgy. */
export function equippedFullSetIdV1(adv) {
  const eq = adv?.equipment || {};
  const inv = Array.isArray(adv?.inventory) ? adv.inventory : [];
  let premier = "";
  for (const slot of ["head", "chest", "legs", "boots"]) {
    const piece = eq[slot] ? inv.find(x => x && x.id === eq[slot]) : null;
    if (!piece || piece.kind !== "equipment" || !piece.set) return "";
    const set = piece.set === "bothedgy" ? "edgy" : String(piece.set);
    if (!premier) premier = set;
    else if (set !== premier) return "";
  }
  return premier;
}

function portraitEnvV1(state) {
  return {
    equippedSet: equippedFullSetIdV1(state.adventure),
    completedSets: state.adventure?.completedSets || {},
    wishLevel: id => wishLevelV1(state, id),
    macguffinPct: id => macguffinPermanentPctV1(state, id),
    /*
     * Special Prize réclamé AVANT l'existence du choix (pas de choix enregistré) : le joueur n'a pas pu prendre le chaton, il le reçoit
     * (Norman, 2026-09-25 : « débloque le chaton sur mon compte, je ne l'ai pas choisi car il n'était pas là »).
     */
    specialPrizeChoice: num(state.records.specialPrizeChoice, 0) || (num(state.records.specialPrizeClaimed, 0) > 0 ? 2 : 0)
  };
}

function wishLevelsMapV1(state) {
  const out = {};
  const tracks = idleWishTracksActifsV1(state);
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
    ppProgress: num(p.ppProgress, 0),
    poop: num(p.poop, 0)
  };
}

/*
 * Questing : valeurs déjà calculées par ce moteur et consommées par idle-questing-v1.js --
 * respawn réel (même formule que l'ITOPOD : 4 s réduits, plancher 0,34 s), vitesse d'Idle Attack
 * (0,8 s avec Mysterious Red Liquid maxé, 1 s sinon), spéciaux "Quest Drops" de l'équipement,
 * multiplicateurs QP/AP des Perks et du QP Hack.
 */
function questingEnvV1(state, context) {
  const bonuses = idleNguBonuses(state);
  const gear = idleAdventureEquipmentStatsV47(state.adventure);
  const perks = perkBonusesV1(idlePerkNiveauxV1(state));
  return {
    respawnSeconds: Math.max(0.34, 4 * (1 - clamp(num(bonuses.respawnReduction, 0), 0, 1))),
    idleAttackSeconds: state.adventure?.unlockFlags?.redLiquidMaxed ? 0.8 : 1,
    gearQuestDropsPct: Math.max(0, num(gear.specialsByType?.questDropsPct, 0)),
    /* Heroic Sigil (set) : "Quest items drop 10% more often!" (SETS_OBJETS_V1.heroicSigil). */
    questDropsSetPct: Math.max(0, num(state.adventure?.setRewards?.questDropsSetPct, 0)),
    qpEarningsMultiplier: perks.qpEarningsMultiplier,
    apEarningsMultiplier: apBonusMultiplierV1(state),
    qpHackMultiplier: Math.max(0, num(hackFxV1(state).qpGain, 1)),
    /* Cartes QP « QP Gain » (idle-cards-v1.js, idleCardsApplyToBonusesV1). */
    qpCardMultiplier: Math.max(0, num(bonuses.cardsQpGainMultiplier, 1))
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
  const idsAvantTitan = idleInventoryIdsV1(state.adventure);
  const applied = applyIdleAdventureActionV47(
    state.adventure,
    {
      action: "titan",
      titanId: "t1",
      /* 2026-09-23 : vraies stats d'aventure (avec multiplicateurs), plus un champ jamais renseigné (0). */
      stats: (() => {
        const combat = idleAdventureCombatStatsV1(idleAdventureEquipmentStatsV47(state.adventure), context, idleNguBonuses(state));
        return { power: combat.power, toughness: combat.toughness };
      })()
    },
    Object.assign({},context,{
      wishLevels:wishLevelsMapV1(state),
      titanExpBonusKills:perkBonusesV1(idlePerkNiveauxV1(state)).titanExpBonusKills,
      titanExpChallengePct:challengePermanentBonuses(state).bossExpPct,
      goldMultiplier:Math.max(0,num(idleNguBonuses(state).adventureGoldMultiplier,1)),
      dropMultiplier:Math.max(0,num(idleNguBonuses(state).dropMultiplier,1)),
      dropMultiplierIncludesGear:true,
      titanCooldownReductionMs:titanChallengeBonuses.titanRespawnReductionMs,
      titanCooldownReductionEvilMs:titanChallengeBonuses.titanRespawnReductionEvilMs,
      titanCooldownReductionSadisticMs:titanChallengeBonuses.titanRespawnReductionSadisticMs,
      titanLootLevelBonus:titanChallengeBonuses.titanLootLevelBonus
    }),
    now
  );
  state.adventure = applied.state;
  /* Butin du titan : filtre de butin / cube / transformation automatique (idle-inventory-auto-v1.js). */
  if (!applied.duplicate) idleInventoryProcessNewDropsV1(state.adventure, idsAvantTitan, inventoryAutoEnvV1(state));
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
  /*
   * 2026-09-24 : l'ancienne branche « yggdrasil » (lecture d'un data.growth que
   * plus rien n'écrit) est retirée. Les fruits se mangent / se récoltent un par
   * un avec l'action useYggFruit.
   */
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
  if (!idleDifficulteSuffisanteV1(IDLE_PERK_DIFFICULTE_V1, perk.id, state.difficulty)) throw new Error("DIFFICULTE_REQUISE");
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
  if (!idleDifficulteSuffisanteV1(IDLE_QUIRK_DIFFICULTE_V1, quirk.id, state.difficulty)) throw new Error("DIFFICULTE_REQUISE");
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
    const macguffinAvant = macguffinAdventureBeforeV1(state.adventure);
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
    /* Automatisation de l'inventaire (idle-inventory-auto-v1.js) : état avant l'action, relu juste après. */
    const advPayloadInv = payload.adventure && typeof payload.adventure === "object" ? payload.adventure : payload;
    const advActionInv = String(advPayloadInv.action || advPayloadInv.mode || "");
    const idsAvantAventure = idleInventoryIdsV1(state.adventure);
    const boostManuelAvant = idleInventoryManualBoostBeforeV1(state.adventure, advPayloadInv);
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
        dropMultiplierIncludesGear: true,
        dropChancePct: num(context.dropChancePct, 0),
        difficulty: state.difficulty,
        goldMultiplier: Math.max(0, num(idleNguBonuses(state).adventureGoldMultiplier, 1)),
        boostPowerMultiplier: Math.max(1, num(idleNguBonuses(state).boostPowerMultiplier, 1)),
        cubeBoostRate: Math.max(0.01, num(perkBonusesV1(idlePerkNiveauxV1(state)).cubeBoostRate, 0.01)),
        cubeBoostEffectiveness: 1 + 0.05 * Math.min(20, wishLevelV1(state, 110)),
        wishLevels: wishLevelsMapV1(state),
        titanExpBonusKills: perkBonusesV1(idlePerkNiveauxV1(state)).titanExpBonusKills,
        titanExpChallengePct: challengePermanentBonuses(state).bossExpPct,
        titanCooldownReductionMs:challengePermanentBonuses(state).titanRespawnReductionMs,
        titanCooldownReductionEvilMs:challengePermanentBonuses(state).titanRespawnReductionEvilMs,
        titanCooldownReductionSadisticMs:challengePermanentBonuses(state).titanRespawnReductionSadisticMs,
        titanLootLevelBonus:challengePermanentBonuses(state).titanLootLevelBonus,
        adventureStats: idleAdventureCombatStatsV1(idleAdventureEquipmentStatsV47(state.adventure), context, idleNguBonuses(state))
      }),
      t
    );
    state.adventure = applied.state;
    /* THE TRAITOR vaincu : « sets your number of rebirths to 10,000, allowing you to complete the final achievement » (page THE TRAITOR (titan)). */
    if (state.adventure?.unlockFlags?.traitorDefeated) state.records.totalRebirths = Math.max(num(state.records.totalRebirths, 0), 10000);
    /*
     * Butin des kills/titans : filtre de butin, Filter Boosts into Infinity Cube, transformation
     * automatique. Boost manuel (objet ou cube) : recyclage (page Boost, boutique EXP + Basic Challenge).
     */
    let boostRecycleInv = null;
    if (!applied.duplicate) {
      const invEnv = inventoryAutoEnvV1(state);
      if (advActionInv === "zoneKill" || advActionInv === "resolveZoneFight" || advActionInv === "titan") idleInventoryProcessNewDropsV1(state.adventure, idsAvantAventure, invEnv);
      boostRecycleInv = idleInventoryManualBoostAfterV1(state.adventure, boostManuelAvant, invEnv);
    }
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
    /*
     * 2026-09-24 (audit de composition, pages Broken Time Machine et Gold) : « This machine will produce gold
     * based on the best gold drop that you have received in Adventure Mode. This number, along with the levels,
     * resets upon rebirth » ; « (based on highest gold earned from a kill that rebirth) ». Rien n'alimentait
     * cette valeur (bestGoldThisRun ne lisait que context.bestGold = 1 côté serveur) : la Time Machine ne
     * produisait pratiquement aucun Or. On retient le plus gros drop d'Or d'un kill/titan de ce Rebirth, bonus
     * d'Or inclus (le tableau des zones donne le drop « without bonus »).
     */
    {
      const dropGold = Math.max(0, num(result?.gold, 0));
      const tmData = state.systems.timeMachine?.data;
      if (dropGold > 0 && tmData) tmData.bestGoldThisRun = Math.max(Math.max(0, num(tmData.bestGoldThisRun, 0)), dropGold);
    }
    if (boostRecycleInv && result && typeof result === "object") result = Object.assign({}, result, { boostRecycled: boostRecycleInv });
    /* Questing (crochet 2/4) : objet de quête possible sur un vrai kill de zone (jamais sur un rejeu idempotent). */
    {
      const adv = payload.adventure && typeof payload.adventure === "object" ? payload.adventure : payload;
      const advAction = String(adv.action || adv.mode || "");
      if (!applied.duplicate && (advAction === "zoneKill" || advAction === "resolveZoneFight") && result && result.zone && state.systems.questing?.unlocked) {
        const questDrop = idleQuestingOnZoneKillV1(state, result.zone, questingEnvV1(state, context));
        if (questDrop) result = Object.assign({}, result, { questDrop });
      }
    }
    // Consuming one of the permanent unlock items should immediately expose
    // the corresponding system without waiting for another server tick.
    for (const def of IDLE_NGU_SYSTEMS) {
      if (unlockSatisfied(def, context, state)) state.systems[def.id].unlocked = true;
    }
    /* MacGuffin Fragments : compteur de kills de zone et drops des titans. */
    if (!applied.duplicate) {
      const macguffinDrops = macguffinAfterAdventureV1(state, macguffinAvant, result, { dropMultiplier: idleNguBonuses(state).dropMultiplier });
      if (macguffinDrops.length && result && typeof result === "object") result.macguffinDrops = macguffinDrops;
    }
  } else if (action === "macguffin") {
    result = applyMacguffinActionV1(state, payload, t);
  } else if (action === "allocateNgu") {
    result = setNguAllocationV1(state, String(payload.ngu || ""), num(payload.value, 0), context, payload.tier ? String(payload.tier) : undefined);
  } else if (action === "setNguTier") {
    result = setNguTierV1(state, String(payload.tier || ""));
  } else if (action === "setWishSlot") {
    /* Slots de souhaits : { slot: 0..3, wish: "<id>" | "" }. */
    result = setWishSlotV1(state, payload.slot, payload.wish);
  } else if (action === "allocateWishSlot") {
    /* { slot: 0..3, resource: "energy"|"magic"|"r3", value: quantité absolue }. */
    result = setWishSlotAllocationV1(state, payload.slot, String(payload.resource || ""), num(payload.value, 0), context);
  } else if (action === "allocate" && String(payload.system || "") === "wishes") {
    /* Ancien contrat (allocation unique des Wishes) : s'applique au slot 1. */
    result = setWishSlotAllocationV1(state, 0, String(payload.resource || ""), num(payload.value, 0), context);
  } else if (action === "selectTrack" && String(payload.system || "") === "wishes") {
    /* Ancien contrat ("Piste active") : place le souhait dans le slot 1. */
    result = setWishSlotV1(state, 0, String(payload.track || ""));
  } else if (action === "allocate") {
    if (String(payload.system || "") === "ngu") throw new Error("UTILISER_ALLOCATE_NGU");
    setAllocation(
      state,
      String(payload.system || ""),
      String(payload.resource || ""),
      num(payload.value, 0),
      context
    );
  } else if (action === "setTimeMachineTarget") {
    /* Champ « Target » de la Time Machine : niveau à atteindre (0 = aucun) ; à l'atteinte l'allocation de la piste est retirée. */
    const tm = state.systems.timeMachine;
    if (!tm?.unlocked) throw new Error("SYSTEME_VERROUILLE");
    const track = String(payload.track || "");
    if (track !== "speed" && track !== "gold") throw new Error("PISTE_INCONNUE");
    const value = Math.max(0, Math.min(1e9, Math.floor(num(payload.value, 0))));
    tm.data[track === "speed" ? "speedTarget" : "goldTarget"] = value;
    tmApplyTargets(state);
  } else if (action === "reclaimResource") {
    result=reclaimAllocatedResource(state,String(payload.resource||"energy"),context);
  } else if (action === "allocateAugment") {
    setAugmentAllocationV214_(state,String(payload.pair||"scissors"),Boolean(payload.upgrade),num(payload.value,0),context);
  } else if (action === "clearAugmentAllocations") {
    /* « Tout retirer » (2026-09-24) : rend toute l'énergie placée dans les Augments et leurs Upgrades. */
    if (!state.systems.augmentations?.unlocked) throw new Error("SYSTEME_VERROUILLE");
    for (const [pairId, p] of Object.entries(state.systems.augmentations.data.pairs || {})) {
      if (Math.max(0, num(p.energy, 0)) > 0) setAugmentAllocationV214_(state, pairId, false, 0, context);
      if (Math.max(0, num(p.upgradeEnergy, 0)) > 0) setAugmentAllocationV214_(state, pairId, true, 0, context);
    }
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
    result = castBloodSpell(state, String(payload.spell || "numberBoost"), t);
  } else if (action === "towerFloors") {
    result = towerSetFloorsV1(state, payload);
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
    result = useYggFruit(state,String(payload.fruit||"gold"),String(payload.mode||"eat"),{poop:payload.poop===true});
  } else if (action === "upgradeDigger") {
    result = upgradeDigger(state,String(payload.digger||"drop"));
  } else if (action === "setDiggerLevel") {
    result = setDiggerLevel(state,String(payload.digger||"drop"),payload.level);
  } else if (action === "toggleDigger") {
    result = toggleDigger(state,String(payload.digger||"drop"),payload.active);
  } else if (action === "buyPerk") {
    result = buyPerkV1(state, payload.perkId);
  } else if (action === "sellShopBuy") {
    /* Cœurs : l'objet est livré dans l'inventaire d'Aventure avant tout débit d'AP (idle-hearts-v1.js). */
    if (idleHeartV1(payload.itemId)) {
      result = idleHeartsBuyV1(state, payload.itemId, {
        buy: idleSelloutShopBuyV1,
        createItem: idleAdventureSpecialItemV1,
        addItem: idleAdventureAddItemV1,
        nextCost: (id) => idleSelloutShopNextCostV1(idleSelloutShopItemV1(id), state.selloutShop?.purchases?.[id]),
        r3Unlocked: Boolean(state.systems.hacks?.unlocked)
      });
    } else {
      result = idleSelloutShopBuyV1(state, payload.itemId);
    }
  } else if (action === "consumeWandoosCopy") {
    /* Copie "A busted copy of Wandoos 98/XL" : +1 niveau d'OS ou déblocage de Wandoos XL (idle-wandoos-os-v1.js). */
    result = idleWandoosConsumeCopyV1(state, String(payload.itemId || payload.id || ""));
  } else if (action === "consumeGiantSeed") {
    /* A Giant Seed réutilisée : max(1, ⌊L + L²/100⌋) graines (idle-yggdrasil-extra-v1.js). */
    result = idleYggConsumeGiantSeedV1(state, String(payload.itemId || payload.id || ""));
  } else if (action === "buyQuirk") {
    result = buyQuirkV1(state, payload.quirkId);
  } else if (/^quest[A-Z]/.test(action)) {
    /* Questing (crochet 3/4) : questStart/questSkip/questHandIn/questComplete/questIdle/questMerge/questPrefs. */
    result = applyIdleQuestingActionV1(state, action, payload, questingEnvV1(state, context), t);
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
  } else if (action === "buyExpShop") {
    result = buyExpShopV1(state, payload);
  } else if (action === "richJerks") {
    result = richJerksAction(state, payload);
  } else if (action === "cooking") {
    result = applyIdleCookingActionV1(state, payload, t);
  } else if (action === "portrait") {
    /* Choix cosmétique du portrait de joueur ; seuls les portraits débloqués sont acceptés. */
    state.records.portrait = idlePortraitSelectV1(payload.id, portraitEnvV1(state));
    result = { portrait: state.records.portrait };
  } else if (action === "specialPrize") {
    /*
     * Tips N' Tricks, « Special Prize » (menu Info) : deux choix — 50 000 AP, ou A PRETTY KITTY (« it gives you the AP too ») ; le second clic
     * répond « Nice try, greedypants » (aucun deuxième prix). Hors bonus d'AP (page Arbitrary Points). Le chaton à nœud est un portrait de la
     * garderie (cosmétique, pas encore dessiné dans SOREAL) : seul le choix est retenu.
     */
    if (num(state.records.specialPrizeClaimed, 0) > 0) throw new Error("PRIX_SPECIAL_DEJA_RECLAME");
    state.records.specialPrizeClaimed = 1;
    state.records.specialPrizeChoice = payload.choice === "kitty" ? 2 : 1;
    state.currencies.ap += IDLE_SPECIAL_PRIZE_AP_V1;
    result = { ap: IDLE_SPECIAL_PRIZE_AP_V1, choice: state.records.specialPrizeChoice === 2 ? "kitty" : "ap" };
  } else if (action === "buyDigger") {
    result = upgradeDigger(state,String(payload.digger||"drop"));
  } else if (action === "daycarePlace" || action === "daycareRemove") {
    /* Item Daycare : placer un objet de l'inventaire / le reprendre avec ses niveaux gagnés. */
    if (!state.systems.daycare?.unlocked) throw new Error("SYSTEME_VERROUILLE");
    const factors = daycareFactorsV1(state);
    const itemId = String(payload.itemId || payload.id || "");
    /*
     * Un objet repris au niveau 100 peut compléter un set (checkSets via add()) : ses EXP/AP de
     * complétion (ex. Flubber (set) : 30 000 AP) sont reversés dans les monnaies comme après une
     * action d'Aventure (crediterRecompensesAventure), sinon ils resteraient dans adventure.permanent.
     */
    const avantDaycare = photoRecompensesAventure(state);
    result = action === "daycarePlace"
      ? idleDaycarePlaceV1(state.adventure, state.systems.daycare.data, itemId, factors)
      : idleDaycareRemoveV1(state.adventure, state.systems.daycare.data, itemId, factors);
    crediterRecompensesAventure(state, avantDaycare);
  } else if (action === "cards") {
    result = idleCardsActionV1(state, payload);
  } else if (action === "inventoryAuto") {
    /* Auto Merge/Auto Boost, A/D + clic, transformation de boost, loadouts, filtre de butin (idle-inventory-auto-v1.js). */
    result = applyIdleInventoryAutoActionV1(state, payload, inventoryAutoEnvV1(state));
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

/*
 * Infobulle d'énergie de NGU (capture de Norman, 2026-09-25) : « Max energy on this rebirth is capped at 916. On rebirth, you will have 1114
 * Energy. Every 20 Energy gained grants 1 extra energy to your max upon rebirth, up to 100,000. You currently make 2 Energy per second.
 * Current Energy Speed is 2, meaning the bar fills every 25 ticks. Next Speed Increase is at 2.1 Energy Speed. »
 * Mêmes formules que le moteur (génération, croissance du cap au Rebirth) : le client n'en recalcule aucune.
 */
function resourceInfoV1(state, resource, context = {}) {
  const r = state.resources[resource];
  if (!r) return null;
  const speed = clamp(idleNguEffectiveResourceStatV1(state, resource, "speed"), 0.1, 50);
  const ticksPerFill = Math.max(1, Math.ceil(50 / speed - 1e-9));
  const capRun = Math.max(0, idleNguEffectiveResourceStatV1(state, resource, "cap"));
  const generated = Math.max(0, num(r.generatedThisRun, 0));
  const room = Math.max(0, 100000 - Math.min(100000, num(r.cap, 0)));
  const capGain = resource === "energy" ? Math.min(Math.floor(generated / 20), room) : 0;
  return {
    capRun,
    capAfterRebirth: capRun + capGain,
    capGain,
    perSecond: idleNguResourceGenerationPerSecond(state, resource),
    speed,
    ticksPerFill,
    nextSpeed: ticksPerFill > 1 ? Math.ceil((50 / (ticksPerFill - 1)) * 10 - 1e-9) / 10 : null
  };
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

  /* Page Arbitrary Points : « Rebirths over 1 hour long : 1 AP pour chaque 500 s de Rebirth ». */
  if(!options.challengeId&&runSeconds>=3600){
    state.currencies.ap+=apWithBonusV1(state,Math.floor(runSeconds/500));
  }

  /*
   * "Sneaky Secret about Rebirthing" (2026-09-24), page Rebirths : "Rebirthing 3
   * times in a row (each under 30 minutes long and each defeating boss 37+)
   * Rewards the player with a special, one-time bonus of: 200 EXP, 1 Energy
   * Power" -- page Achievements : "Speedrun 3 times in a row with rebirths under
   * 30 minutes each, with boss 37 defeated!" (20 BP). Série remise à 0 par tout
   * Rebirth qui ne remplit pas les deux conditions ; bonus versé une seule fois.
   */
  {
    const rapide=runSeconds<30*60&&Math.max(0,int(context.bosses,0))>=37;
    state.records.speedrunStreak=rapide?Math.max(0,int(state.records.speedrunStreak,0))+1:0;
    if(rapide&&state.records.speedrunStreak>=3&&!(num(state.records.speedrunBonusClaimed,0)>0)){
      state.records.speedrunBonusClaimed=1;
      state.currencies.experience+=200;
      state.resources.energy.power=Math.max(1,num(state.resources.energy.power,1))+1;
    }
  }

  rb.lastNumber=rb.number;
  rb.number=committedNumber;
  state.records.bestNumber=Math.max(num(state.records.bestNumber,0),committedNumber);
  rb.lastBosses=Math.max(0,int(context.bosses,0));
  rb.lastRunSeconds=runSeconds;
  rb.hasPreviousRun=true;
  /*
   * 2026-09-24 (pages « Evil difficulty » / « SADISTIC difficulty » /
   * « Rebirths ») : « A rebirth that changes the difficulty is similar to
   * starting a challenge - number and all last rebirth number factors are
   * reset to 1 ». forceNumber n'est passé que dans ces deux cas (changement
   * de difficulté, défi autre que Laser Sword) : les facteurs « prior boss »
   * et « prior rebirth time » du prochain NUMBER repartent donc à 1.
   */
  if(forced!==null){
    rb.lastBosses=0;
    rb.lastRunSeconds=0;
    rb.hasPreviousRun=false;
  }
  rb.canRebirth=false;

  // "100 Levels Challenge" pool is explicitly "per rebirth" (audit
  // 2026-09-16) — reset on every rebirth, not just when that challenge starts.
  state.challenge.hundredLevelsGained=0;
  /* Sellout Shop : les potions beta sont perdues au Rebirth (wiki). */
  if (state.selloutEffects) state.selloutEffects.beta = {};

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
  const beardActiveId=beardActiveIdsV1(state)[0]||"";
  const beardTempLevelEnd=beardActiveId&&beardsSys?.data?.tracks?.[beardActiveId]
    ?Math.max(0,num(beardsSys.data.tracks[beardActiveId].tempLevel,0))
    :0;

  const beardConversion=convertActiveBeardOnRebirth(state,runSeconds);
  /* MacGuffin Fragments : les fragments équipés augmentent leur bonus permanent (idle-macguffins-v1.js). */
  const macguffinGain=macguffinApplyRebirthV1(state,runSeconds);
  const naturalEnergyCapGain=applyNaturalEnergyCapGrowthOnRebirth(state);

  const perkBankBonuses=perkBonusesV1(idlePerkNiveauxV1(state));
  const quirkBankBonuses=quirkBonusesV1(idleQuirkNiveauxV1(state));
  const tmBankPct=Math.max(0,(perkBankBonuses.tmBankMultiplier-1)+(quirkBankBonuses.tmBankMultiplier-1));
  const beardBankPct=Math.max(0,(perkBankBonuses.beardBankMultiplier-1)+(quirkBankBonuses.beardBankMultiplier-1));
  state.bank.timeMachineSpeed=Math.floor(tmSpeedLevelEnd*tmBankPct);
  state.bank.timeMachineGold=Math.floor(tmGoldLevelEnd*tmBankPct);
  state.bank.beards=Math.floor(beardTempLevelEnd*beardBankPct);
  /*
   * Advanced Training Level Bank (2026-09-24) : les Perks 36-40 / Quirks 20-24
   * étaient catalogués mais aucun niveau d'AT n'était jamais retenu. Page Banks :
   * "retain some percentage of your levels in Advanced Training ... when
   * rebirthing" ; Perk 36 : "Saves 1% (rounded down) of Advanced Training levels".
   * Même lecture que Time Machine : pourcentage cumulé du niveau de fin de run,
   * par compétence d'AT ; state.bank.advancedTraining = total retenu.
   */
  const atBankPct=Math.max(0,(perkBankBonuses.atBankMultiplier-1)+(quirkBankBonuses.atBankMultiplier-1));
  const atBanked={};
  for(const [id,tr] of Object.entries(state.systems.advancedTraining?.data?.tracks||{})){
    atBanked[id]=options.clearBanks?0:Math.floor(Math.max(0,num(tr.tempLevel,0))*atBankPct+1e-9);
  }
  state.bank.advancedTraining=Object.values(atBanked).reduce((s,v)=>s+v,0);

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
    if(def.id==="hacks"||def.id==="wishes")s.allocation={energy:0,magic:0,r3:0};
    /* Slots de souhaits : les souhaits placés restent, les ressources allouées sont perdues comme avant. */
    if(def.id==="wishes")for(const k of RESOURCE_KEYS)clearWishSlotAllocationsV1(s,k);
    if(def.id==="diggers"&&s.data?.diggers){
      for(const d of Object.values(s.data.diggers))d.active=false;
    }
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
      s.data.spells.ironPillReadyAt=Math.max(0,num(permanent.ironPillReadyAt,0));
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
      const nextActiveId=(Array.isArray(s.data.activeTracks)&&s.data.activeTracks[0])||s.data.activeTrack||"";
      const nextTrack=nextActiveId?s.data.tracks[nextActiveId]:null;
      if(nextTrack&&beardBank>0)nextTrack.tempLevel=beardBank;
      s.tempLevel=Object.values(s.data.tracks).reduce((sum,x)=>sum+x.tempLevel,0);
    }
    if(def.id==="advancedTraining"&&s.data?.tracks){
      /*
       * Page Rebirths, "What do I lose" : "Advanced Training levels and access to
       * the menu (until you get the basic training levels again)" ; page Banks :
       * "banked Advanced Training levels do not have any effect until the AT menu
       * is unlocked by completing Basic Training" -> menu reverrouillé (rouvert
       * par la synchro quand basicTrainingComplete), niveaux retenus réinjectés.
       */
      /*
       * Perk 18 "Instant Advanced Training Levels!" (page Advanced Training, tableau des Perks) :
       * "Each level in this perk gives you a level of every Advanced Training ability at the
       * start of every rebirth even before it is unlocked." (2026-09-24 : effet jamais lu jusqu'ici.)
       */
      const perkStartAt=Math.max(0,int(perkBankBonuses.advancedTrainingStartBonus,0));
      for(const [id,tr] of Object.entries(s.data.tracks))tr.tempLevel=Math.max(0,int(atBanked[id],0))+perkStartAt;
      s.tempLevel=Object.values(s.data.tracks).reduce((sum,x)=>sum+x.tempLevel,0);
      s.unlocked=false;
    }
  }

  /* Perk 34 « Bonus Titan EXP! » : les premiers kills de CHAQUE titan sont comptés par Rebirth (page Experience). */
  for(const ts of Object.values(state.adventure?.titans||{}))if(ts&&typeof ts==="object")ts.rebirthKills=0;
  /*
   * Page Titans : « Rebirth will despawn currently living titans and starts a new cooldown timer from the moment of
   * rebirth. » Chaque titan déjà vaincu repart avec son délai complet (réductions No Rebirth comprises, plancher 60 min)
   * à partir du Rebirth. Walderp, tant que ses formes ne sont pas toutes vaincues, reste caché (pas de délai).
   */
  {
    const bonusesTitans=challengePermanentBonuses(state);
    for(const [tid,ts] of Object.entries(state.adventure?.titans||{})){
      if(!ts||typeof ts!=="object"||int(ts.kills,0)<=0)continue;
      const cooldown=idleAdventureTitanCooldownMsV1(tid,{
        titanCooldownReductionMs:bonusesTitans.titanRespawnReductionMs,
        titanCooldownReductionEvilMs:bonusesTitans.titanRespawnReductionEvilMs,
        titanCooldownReductionSadisticMs:bonusesTitans.titanRespawnReductionSadisticMs
      },ts.kills);
      if(cooldown!==null)ts.nextAt=t+cooldown;
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
  state.rebirth.macguffinGain=macguffinGain;
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
/*
 * Spend EXP (wiki Experience, sections Adventure Stats / Adventure Special / Misc), achats qui ont un
 * effet dans SOREAL : Power/Toughness (3 EXP = +1), Max Health (3 EXP = +10), HP Regen (50 EXP = +1),
 * espaces d'inventaire (25-36 : 2 EXP ; 37-60 : 4 x (possédés - 35) ; plafond 60), 2 slots
 * d'accessoire (3 000 / 30 000 EXP), 1 slot de Digger (25 000 EXP), 3 slots de garderie (« Item Daycare ! »
 * 250, « Another Daycare Slots! » 25 000, « Another Another Daycare Slots! » 500 000 EXP, achat unique
 * chacun). Auto Merge, filtre de butin, loadouts, Boost Recycling et Inventory Merge Slot : voir
 * idle-inventory-auto-v1.js. Training Auto Advance (300 EXP) : idle-basic-training.js. Non modélisés :
 * « Custom Input Button 1..4 » (50/100/500/1000 EXP) -- le wiki ne donne que nom et prix, aucun effet
 * décrit (les boutons % du 4G's Sellout Shop disent seulement « work like the other custom buttons »),
 * donc rien n'est inventé. 2 slots MacGuffin (10 M / 100 M EXP).
 */
export const IDLE_NGU_EXP_SHOP_V1 = Object.freeze({
  adventurePower: Object.freeze({ name: "Adventure Power", cost: () => 3, gain: 1, max: null }),
  adventureToughness: Object.freeze({ name: "Adventure Toughness", cost: () => 3, gain: 1, max: null }),
  adventureHp: Object.freeze({ name: "Adventure Max HP", cost: () => 3, gain: 10, max: null }),
  adventureRegen: Object.freeze({ name: "Adventure HP Regen", cost: () => 50, gain: 1, max: null }),
  /* Wiki Experience : « 1–24: Free, 25–36: 2, 37–60: 4 x (Owned - 35) », plafond 60 (24 de base + 36 achats). Prix variable : le snapshot donne tous les prix restants. */
  inventorySpace: Object.freeze({ name: "Inventory Space", cost: (n) => (n + 25 <= 36 ? 2 : 4 * (24 + n - 35)), gain: 1, max: 36, variableCost: true }),
  accessorySlot1: Object.freeze({ name: "Extra Accessory Slot!", cost: () => 3000, gain: 1, max: 1 }),
  accessorySlot2: Object.freeze({ name: "Another Extra Accessory Slot!", cost: () => 30000, gain: 1, max: 1 }),
  diggerSlot: Object.freeze({ name: "A Digger Slot!", cost: () => 25000, gain: 1, max: 1 }),
  beardSlot: Object.freeze({ name: "A Beard Slot!", cost: () => 50000, gain: 1, max: 1 }),
  daycareSlot1: Object.freeze({ name: "Item Daycare !", cost: () => 250, gain: 1, max: 1 }),
  daycareSlot2: Object.freeze({ name: "Another Daycare Slots!", cost: () => 25000, gain: 1, max: 1 }),
  daycareSlot3: Object.freeze({ name: "Another Another Daycare Slots!", cost: () => 500000, gain: 1, max: 1 }),
  /* Wiki Experience, Misc : "A Macguffin Slot!" 10 M puis 100 M EXP (lus par idle-macguffins-v1.js). */
  macguffinSlot1: Object.freeze({ name: "A Macguffin Slot!", cost: () => 10000000, gain: 1, max: 1 }),
  macguffinSlot2: Object.freeze({ name: "A Macguffin Slot!", cost: () => 100000000, gain: 1, max: 1 }),
  /*
   * Wiki Experience, Adventure Special (effets dans idle-inventory-auto-v1.js) : « Auto Merge » 200
   * (la page Inventory annonce 1 000 : la page de la boutique fait foi), « Basic Loot Filter » 20,
   * « 2 Loadout Slots! » 1000 (2 slots), « Another Loadout Slot! » 10,000, « Boost Recycling » 100 par
   * +10 % (« Capped at 50% » = 5 achats), « Inventory Merge Slot! » 1000.
   */
  autoMerge: Object.freeze({ name: "Auto Merge", cost: () => 200, gain: 1, max: 1 }),
  basicLootFilter: Object.freeze({ name: "Basic Loot Filter", cost: () => 20, gain: 1, max: 1 }),
  loadoutSlots: Object.freeze({ name: "2 Loadout Slots!", cost: () => 1000, gain: 2, max: 1 }),
  loadoutSlot3: Object.freeze({ name: "Another Loadout Slot!", cost: () => 10000, gain: 1, max: 1 }),
  boostRecycling: Object.freeze({ name: "Boost Recycling", cost: () => 100, gain: 10, max: 5 }),
  inventoryMergeSlot: Object.freeze({ name: "Inventory Merge Slot!", cost: () => 1000, gain: 1, max: 1 }),
  /*
   * Wiki Experience, Misc (« these can only be purchased once ») : « Training Auto Advance » 300 EXP,
   * « Automatically allocates energy each time a skill is unlocked while leaving the necessary cap for
   * each skill » (effet : advanceBasicTrainingStateV411, option autoAdvance).
   */
  trainingAutoAdvance: Object.freeze({ name: "Training Auto Advance", cost: () => 300, gain: 1, max: 1 }),
  /* Wiki Experience, section Yggdrasil : 15 « Auto-Activate » (coût EXP + cap requis ; idle-yggdrasil-extra-v1.js). */
  ...idleYggAutoActivateExpShopEntriesV1()
});

/*
 * Automatisation de l'inventaire : bonus lus ici, mécanique dans idle-inventory-auto-v1.js.
 * No Equipment (Normal) : Auto Boost à la 1re complétion, -10 % de minuteur par complétion
 * (challengePermanentBonuses) ; « 1/2 Auto Merge and Boost Timers! » : -50 % (combinés
 * multiplicativement) ; Basic (Normal) : +10 % de recyclage par complétion ; 100 Levels (Normal) :
 * transformation à la 1re complétion, gratuite + automatique à la dernière.
 */
function inventoryAutoEnvV1(state) {
  const ch = challengePermanentBonuses(state);
  const sellout = state.selloutShop?.purchases || {};
  const hundred = Math.max(0, int(state.challenge?.completions?.hundredLevels, 0));
  const hundredMax = IDLE_NGU_NORMAL_CHALLENGES.find((d) => d.id === "hundredLevels")?.max || 5;
  return {
    autoMergeUnlocked: expShopPurchasedV1(state, "autoMerge") >= 1,
    autoBoostUnlocked: Boolean(ch.autoBoost),
    timerMultiplier: Math.max(0, num(ch.autoMergeTimeMultiplier, 1)) * (int(sellout.autoMergeBoostTimers, 0) >= 1 ? 0.5 : 1),
    boostRecycleChance: idleInventoryBoostRecycleChanceV1(expShopPurchasedV1(state, "boostRecycling"), ch.boostRecycleChance),
    lootFilterBasic: expShopPurchasedV1(state, "basicLootFilter") >= 1,
    lootFilterImproved: int(sellout.improvedLootFilter, 0) >= 1,
    filterBoostsIntoCube: int(sellout.filterBoostsIntoCube, 0) >= 1,
    loadoutSlots: idleInventoryLoadoutSlotsV1(expShopPurchasedV1(state, "loadoutSlots"), expShopPurchasedV1(state, "loadoutSlot3"), sellout.loadoutSlot),
    boostTransformUnlocked: hundred >= 1,
    boostTransformFree: hundred >= hundredMax,
    /* « Merges your equipped items (including MacGuffin Fragments) » : fragments équipés (idle-macguffins-v1.js). */
    macguffins: state.systems.macguffins?.data || null,
    boostCtx: () => ({
      boostPowerMultiplier: Math.max(1, num(idleNguBonuses(state).boostPowerMultiplier, 1)),
      cubeBoostRate: Math.max(0.01, num(perkBonusesV1(idlePerkNiveauxV1(state)).cubeBoostRate, 0.01)),
      cubeBoostEffectiveness: 1 + 0.05 * Math.min(20, wishLevelV1(state, 110))
    })
  };
}

function expShopPurchasedV1(state, id) {
  return Math.max(0, int(state.bonuses?.expShop?.[id], 0));
}

function buyExpShopV1(state, payload) {
  const id = String(payload.item || "");
  const def = IDLE_NGU_EXP_SHOP_V1[id];
  if (!def) throw new Error("ACHAT_EXP_INCONNU");
  if (!state.bonuses.expShop || typeof state.bonuses.expShop !== "object") state.bonuses.expShop = {};
  /* Auto-Activate Yggdrasil : « Your total Energy or Magic cap must be 10x greater than the fruit's activation cost ». */
  /* Auto-Activate d'un fruit de Mayo : seulement une fois le fruit disponible (système Cards). */
  if (def.yggFruit && idleYggIsMayoFruitV1(def.yggFruit) && !idleYggFruitUnlockedV1(state, def.yggFruit)) throw new Error("ACHAT_VERROUILLE");
  if (def.requiredCap && !(expShopPurchasedV1(state, id) >= num(def.max, Infinity)) && idleNguEffectiveResourceStatV1(state, def.resource, "cap") < def.requiredCap) throw new Error("CAP_RESSOURCE_INSUFFISANT");
  const wanted = clamp(int(payload.quantity, 1), 1, 1000000);
  let bought = 0;
  let spent = 0;
  while (bought < wanted) {
    const owned = expShopPurchasedV1(state, id);
    if (def.max != null && owned >= def.max) break;
    const cost = def.cost(owned);
    if (num(state.currencies.experience, 0) < cost) break;
    state.currencies.experience -= cost;
    state.bonuses.expShop[id] = owned + 1;
    spent += cost;
    bought += 1;
  }
  if (bought === 0) throw new Error(def.max != null && expShopPurchasedV1(state, id) >= def.max ? "ACHAT_AU_MAXIMUM" : "EXP_INSUFFISANT");
  const permanent = state.adventure.permanent && typeof state.adventure.permanent === "object" ? state.adventure.permanent : (state.adventure.permanent = {});
  const key = { adventurePower: "adventurePower", adventureToughness: "adventureToughness", adventureHp: "adventureHp", adventureRegen: "adventureRegen" }[id];
  if (key) permanent[key] = Math.max(0, num(permanent[key], 0)) + bought * def.gain;
  /* Auto-Activate : le fruit démarre aussitôt s'il est débloqué et inactif. */
  if (def.yggFruit) idleYggAutoActivateV1(state, IDLE_NGU_YGG_FRUITS);
  return { item: id, bought, spent, purchased: expShopPurchasedV1(state, id) };
}

function expShopSnapshotV1(state) {
  return Object.entries(IDLE_NGU_EXP_SHOP_V1).filter(([, def]) => !(def.yggFruit && idleYggIsMayoFruitV1(def.yggFruit) && !idleYggFruitUnlockedV1(state, def.yggFruit))).map(([id, def]) => {
    const purchased = expShopPurchasedV1(state, id);
    const entry = { id, name: def.name, gain: def.gain, max: def.max, purchased, nextCost: def.max != null && purchased >= def.max ? null : def.cost(purchased) };
    if (def.variableCost && def.max != null) {
      entry.remainingCosts = [];
      for (let i = purchased; i < def.max; i += 1) entry.remainingCosts.push(def.cost(i));
    }
    /* Auto-Activate Yggdrasil : fruit, ressource et cap requis (affichés à part par le client). */
    if (def.yggFruit) Object.assign(entry, { yggFruit: def.yggFruit, resource: def.resource, requiredCap: def.requiredCap });
    return entry;
  });
}

/* ===== Item Daycare : sources de bonus lues ici, formule dans idle-daycare-v1.js ===== */
/* Sources de slots et de réduction de temps (peu coûteuses : lues aussi à chaque normalisation). */
function daycareBaseInputsV1(state) {
  const perks = perkBonusesV1(idlePerkNiveauxV1(state));
  const normal = state.challenge?.completions || {};
  const evil = state.challenge?.completionsTier?.difficile || {};
  const sadistic = state.challenge?.completionsTier?.extreme || {};
  return {
    expShopSlots: expShopPurchasedV1(state, "daycareSlot1") + expShopPurchasedV1(state, "daycareSlot2") + expShopPurchasedV1(state, "daycareSlot3"),
    blindNormal: int(normal.blind, 0),
    blindEvil: int(evil.blind, 0),
    blindSadistic: int(sadistic.blind, 0),
    trollEvil: int(evil.troll, 0),
    perkSlots: perks.daycareSlotBonus,
    perkTimeMultiplier: perks.daycareTimeMultiplier,
    perkSpeedMultiplier: perks.daycareGrowthMultiplier,
    selloutSpeedBoost: int(state.selloutShop?.purchases?.daycareSpeedBoost, 0) >= 1
  };
}
function daycareFactorsV1(state) {
  return idleDaycareFactorsV1(Object.assign(daycareBaseInputsV1(state), {
    /* Souhait 27 « I wish the Daycare Kitty was even happier » : +1 % de vitesse par niveau (page Wishes). */
    wishLevel: wishLevelV1(state, 27),
    gearDaycareSpeedPct: num(gearSpecialsV1(state).daycareSpeedPct, 0),
    diggerMultiplier: diggerBonuses(state).daycare,
    hackMultiplier: hackFxV1(state).daycare
  }));
}
/* ===== fin Item Daycare ===== */

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
  if(runSeconds<minRebirthSecondsV1(state))throw new Error("REBIRTH_TROP_TOT");
  const requestedDifficulty=["normal","difficile","extreme"].includes(options.difficulty)?options.difficulty:state.difficulty;
  const changingDifficulty=requestedDifficulty!==state.difficulty;
  if(changingDifficulty&&requestedDifficulty!=="normal"){
    const req=idleNguDifficultyUnlockRequirementsV1(state,context);
    if(!req[requestedDifficulty].met)throw new Error("DIFFICULTE_VERROUILLEE");
  }
  return applyRebirthResetV56_(state,context,t,changingDifficulty?{forceNumber:1,clearBanks:true,difficulty:requestedDifficulty}:{});
}
