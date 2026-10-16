/*
 * NGU : constantes, catalogues et petits utilitaires (audit d'architecture, 2026-10-16 : découpage de idle-ngu-progression.js).
 * Code extrait tel quel ; les fichiers voisins se référencent par import (les fonctions étant hissées, les imports circulaires entre ces fichiers sont sans danger :
 * aucun n'appelle les autres au chargement).
 */
import { bigToNumberV1, bigFromLog10V1 } from "./idle-big-number-v1.js";
import { IDLE_YGG_MAYO_FRUITS_V1, IDLE_YGG_MAYO_ACTIVATION_COST_V1 } from "./idle-yggdrasil-extra-v1.js";
import { IDLE_NGU_CATALOG_V1 } from "./idle-ngu-catalog-v1.js";
import { IDLE_WISHES_CATALOG_V1 } from "./idle-wishes-v1.js";
import { normalizeIdleNguState } from "./idle-ngu-etat.js";

export const IDLE_NGU_META_VERSION = "META-V47-EARLYGAME-NGU";

export const IDLE_NGU_SAVE_SCHEMA = 47;

export const RESOURCE_KEYS = Object.freeze(["energy", "magic", "r3"]);

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

export const EARLY_GAME_MAX_OFFLINE_SECONDS = 30 * 24 * 3600;

export const MIN_REBIRTH_SECONDS = 180;

/*
 * Wiki NGU (page "Wishes", section "Important Math") : "Wishes have a hard
 * cap of 4 hours, after which putting more resources into it will not
 * speed up the process." — plancher de temps par niveau, quel que soit le
 * débit de ressources. La réduction jusqu'à 3h ("There are Perks and Quirks
 * which can reduce the minimum time, down to 3 hours") est câblée dans
 * wishSpeedParamsV1 : perks 109/110 et quirk 54, 24 s par niveau chacun.
 */
export const WISH_MIN_LEVEL_SECONDS = 4 * 3600;

/*
 * Page "Wishes" : "To make more wishes simultaneously, you must unlock more
 * wish slots. You can get 4 wish slots: 1 to start with, 1 from evil mode
 * Troll Challenge 7, 1 from maxing My Pink Heart, 1 from Quirks".
 */
export const IDLE_WISH_MAX_SLOTS_V1 = 4;

export function num(v, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

export function int(v, d = 0) {
  return Math.floor(num(v, d));
}

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, num(v, min)));
}

export function clone(v) {
  return JSON.parse(JSON.stringify(v));
}

export function nowMs(v) {
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
const SAFE_EXP_LOG_LIMIT = 700;
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

export const CHALLENGE_TIER_KEYS_V1 = Object.freeze(["difficile", "extreme"]);

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

export function challengeTierV1(state){
  if(state?.challenge?.active)return CHALLENGE_TIER_KEYS_V1.includes(state.challenge.activeTier)?state.challenge.activeTier:"normal";
  return challengeTierOfDifficultyV1(state?.difficulty);
}

export function challengeDefsForTierV1(tier){
  return tier==="normal"?IDLE_NGU_NORMAL_CHALLENGES:(IDLE_NGU_TIER_CHALLENGES[tier]||IDLE_NGU_NORMAL_CHALLENGES);
}

export function challengeCompletionsV1(state,tier){
  if(tier==="normal")return state.challenge.completions;
  const all=state.challenge.completionsTier||(state.challenge.completionsTier=createChallengeTiersV1());
  return all[tier]||(all[tier]={});
}

export function createChallengeTiersV1(raw){
  const out={};
  for(const tier of CHALLENGE_TIER_KEYS_V1){
    out[tier]=Object.fromEntries(IDLE_NGU_NORMAL_CHALLENGES.map(def=>[def.id,Math.max(0,int(raw?.[tier]?.[def.id],0))]));
  }
  return out;
}

function laserSwordStepV1(done){
  const n=Math.max(0,Math.min(20,int(done,0)));
  if(n<=0)return 0;
  return 0.05+Math.max(0,Math.min(n,19)-1)*0.01+(n>=20?0.05:0);
}

export function challengePermanentBonuses(state){
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
    /*
     * Laser Sword (Normal), page Challenges : « Each completion will raise the bonus by 0.01 for milk, 0.02 for cannon, and so
     * on » ; « First Completion Reward: Same bonus, but increases by 0.05! » et « Final Completion Reward: Same bonus, but
     * increases by 0.05! ». Lecture retenue : la 1re et la 20e complétion ajoutent 0,05 (au lieu de 0,01) x rang de l'augment
     * (Milk = 1) à l'exposant ; les 18 autres 0,01. Total à 20 complétions : 0,28 x rang.
     */
    laserSwordExponentStep:laserSwordStepV1(k(c,"laserSword")),
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
