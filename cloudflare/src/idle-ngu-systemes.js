/*
 * NGU : Blood Magic, Yggdrasil, Diggers, ITOPOD, Troll et avance générale (audit d'architecture, 2026-10-16 : découpage de idle-ngu-progression.js).
 * Code extrait tel quel ; les fichiers voisins se référencent par import (les fonctions étant hissées, les imports circulaires entre ces fichiers sont sans danger :
 * aucun n'appelle les autres au chargement).
 */
import { aleaV1 } from "./idle-alea-v1.js";
import { quirkBonusesV1 } from "./idle-quirks-v1.js";
import { ITOPOD_AUTOATTACK_REGEN_V1, itopodCycleV1, itopodDrawAiV1 } from "./idle-itopod-combat-v1.js";
import { exileHackV1, exileItopodV1 } from "./idle-antlers-v1.js";
import { beteDebutVisiteV1, beteItopodV1 } from "./idle-bete-secret-v1.js";
import { IDLE_TICK_SECONDS_V1, dureeNiveauEnTicksV1 } from "./idle-tick-v1.js";
import { span, enveloppeSpan } from "./idle-spans-v1.js";
import { idleQuirkNiveauxV1, idlePerkNiveauxV1, idleRangDifficulteV1 } from "./idle-difficulty-gates-v1.js";
import { macguffinEffectMultiplierV1, macguffinEatFruitV1, macguffinFruitLevelsV1, macguffinOnItopodKillsV1 } from "./idle-macguffins-v1.js";
import { IDLE_THE_END_LAST_SPELL_BLOOD_V1, idleTheEndGrantV1, IDLE_THE_END_TOWER_FIRST_FLOOR_V1, idleTheEndHasV1 } from "./idle-the-end-v1.js";
import { perkBonusesV1 } from "./idle-perks-v1.js";
import { idleLoginCalendarOctroiV1 } from "./idle-login-calendar-v1.js";
import { acquerirSkinsV1 } from "./idle-daycare-skins-v1.js";
import { acquerirPortraitsV1 } from "./idle-portraits-v1.js";
import { idleYggFruitUnlockedV1, idleYggAutoActivateV1, idleYggActivationCostV1, idleYggSeedUnitV1, idleYggUsePoopV1, idleYggMayoFruitBaseV1, idleYggFruitOfQuirksQpV1, idleYggQuickActivationV1, idleYggTierSecondsV1, idleYggItopodPoopV1 } from "./idle-yggdrasil-extra-v1.js";
import { idleAdventureEquipmentStatsV47, idleAdventureCubeDirectV1, idleEquipementEffectifV1, idleEquipementEffectifLectureV1, idleAdventureBoostV1, zoneNormalePlusAvanceeV1, advanceTitanAutoKillV1, advanceAdventureZoneAutoFarmOfflineV1 } from "./idle-adventure-v47.js";
import { idleCardsMayoFruitProgressV1, idleCardsMayoFruitApercuV1, advanceIdleCardsV1 } from "./idle-cards-v1.js";
import { idleInventoryReceiveDropV1, idleInventoryIdsV1, idleInventoryProcessNewDropsV1, advanceIdleInventoryAutoV1 } from "./idle-inventory-auto-v1.js";
import { idleHeartsConsumableFactorV1 } from "./idle-hearts-v1.js";
import { IDLE_R3_NOMS_V1 } from "./idle-r3-names-v1.js";
import { advanceIdleCookingV1 } from "./idle-cooking-v1.js";
import { advanceIdleDaycareV1 } from "./idle-daycare-v1.js";
import { advanceIdleQuestingV1 } from "./idle-questing-v1.js";
import { IDLE_SELLOUT_MINUTEURS_HORS_LIGNE_V1, tickSelloutEffectsV1 } from "./idle-sellout-shop-v1.js";
import { idleAchievementsEvaluateV1 } from "./idle-achievements-v1.js";
import { DEFIS_SANS_HORS_LIGNE_IDS_V1, PLAFOND_HORS_LIGNE_DEFIS_SECONDES_V1 } from "./idle-hors-ligne-v1.js";
import { EARLY_GAME_MAX_OFFLINE_SECONDS, IDLE_NGU_BLOOD_RITUALS, IDLE_NGU_DIGGERS, IDLE_NGU_SYSTEMS, IDLE_NGU_YGG_FRUITS, challengeCompletionsV1, challengePermanentBonuses, challengeTierV1, clamp, int, nowMs, num } from "./idle-ngu-catalogues.js";
import { advanceAugmentations, advanceGeneratedResources, externalResourceAllocation, idleNguEffectiveResourceStatV1, rebaserProgressionSecondesV1, reconcileResourceCurrents, reclaimAllocatedResource, refreshRebirthState, totalAllocated } from "./idle-ngu-ressources.js";
import { advanceWandoos, applyYggQuickActivationV1, idleNguDifficultySpeedDividerV1, normalizeIdleNguState } from "./idle-ngu-etat.js";
import { autoCompleteChallengeV1, challengeHundredLevelsConsume, challengeHundredLevelsRemaining, crediterRecompensesAventure, photoRecompensesAventure, questingEnvV1, questRewardFactorTitansV1, questButterFactorTitansV1, wishLevelV1, wishLevelsMapV1 } from "./idle-ngu-snapshot.js";
import { achievementMetricsV1, advanceNgusV1, apWithBonusV1, gearPctV1, gearSpecialsV1, hackFxV1, idleAdventureCombatStatsV1, idleNguBonuses, idleNguBonusesLectureV1, nguFxV1 } from "./idle-ngu-bonus.js";
import { advanceTimeMachine, advanceTrackSystem, barbesTempsPleinV1, crediterOrHorsLigneV1, idleNguTimeMachineGrossGoldPerSecond, tmAbsenceHorsLigneV1 } from "./idle-ngu-pistes.js";
import { daycareFactorsV1, expShopPurchasedV1, inventoryAutoEnvV1 } from "./idle-ngu-actions.js";

export function ritualUnlocked(ritual, context, state) {
  if (!ritual.unlockFlag) return true;
  /*
   * 2026-09-24 (page Blood Magic : « This ritual is unlocked by completing Troll Challenge 6 » ; page Challenges,
   * Troll Challenge, Completion 6 : « A new Blood Magic Ritual! ») : le drapeau « trollChallenge6 » n'était posé nulle
   * part, le rituel « Turn Yourself Inside Out » était donc inaccessible même après la 6e complétion.
   */
  if (ritual.unlockFlag === "trollChallenge6" && state && int(state.challenge?.completions?.troll, 0) >= 6) return true;
  return Boolean(context?.unlockFlags?.[ritual.unlockFlag]);
}

/*
 * Magic par rituel (Norman, 2026-10-07 : « dans Blood Magic on ne peut pas mettre de la magie dans plusieurs barres en même temps ; il me semble qu'on pouvait dans le jeu de base »).
 * Wiki NGU, page Blood Magic : le temps de chaque rituel est donné pour « 1000 magic, 1 magic power » -- chaque rituel a donc SA propre Magic allouée. Chacun progresse avec la sienne,
 * en même temps que les autres ; s.allocation.magic reste le TOTAL (somme des rituels), lu par les plafonds communs de Magic. Anciennes sauvegardes : une seule allocation pour le
 * rituel actif -- elle est reportée sur ce rituel au premier passage.
 */
export function bloodMigrerAllocationV1(s) {
  const rituals = s.data.rituals || {};
  let somme = 0;
  for (const r of Object.values(rituals)) somme += Math.max(0, num(r.magic, 0));
  const total = Math.max(0, num(s.allocation?.magic, 0));
  if (somme <= 0 && total > 0) {
    const cible = rituals[s.data.activeRitual] || rituals[IDLE_NGU_BLOOD_RITUALS[0].id];
    if (cible) cible.magic = total;
    somme = total;
  }
  if (s.allocation) s.allocation.magic = somme;
  return somme;
}

export function bloodRitualMagicV1(s, ritualId) {
  return Math.max(0, num(s.data.rituals?.[ritualId]?.magic, 0));
}

function advanceBloodMagic(state, seconds, context) {
  const s = state.systems.bloodMagic;
  if (!s.unlocked || seconds <= 0) return;
  bloodMigrerAllocationV1(s);
  const power = Math.max(1, idleNguEffectiveResourceStatV1(state, "magic", "power"));
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
  bloodCollecteMigrerV1(state, s);
  for (const ritual of IDLE_NGU_BLOOD_RITUALS) {
    if (!ritualUnlocked(ritual, context, state)) continue;
    const magic = bloodRitualMagicV1(s, ritual.id);
    if (magic <= 0) continue;
    const rs = s.data.rituals[ritual.id];
    /* Cible de complétions (Norman, 2026-11-20 : « il devra arrêter avant que le prochain niveau ne prenne l'or ») : au plus `quota` complétions de plus ; un niveau DÉJÀ payé (barre entamée) va toujours à son terme, mais aucun niveau suivant n'est payé une fois la cible atteinte. */
    let quota = Math.max(0, int(rs.target, 0)) > 0 ? Math.max(0, int(rs.target, 0) - Math.max(0, int(rs.completions, 0))) : Infinity;
    /* Un rituel dure au moins un tick (50 par seconde au plus, comme le vrai jeu : idle-tick-v1.js, Norman 2026-11-05) */
    const secondsPerCompletion = dureeNiveauEnTicksV1(ritual.baseSeconds * 1000 * difficultyDivider / Math.max(1e-12, magic * power) / dutchSetMultiplier);
    rebaserProgressionSecondesV1(rs, "progress", secondsPerCompletion);
    /*
     * Lu dans le code du jeu (build 1260, 2026-11-15 : BloodMagicController::updateBloodMagic) : l'Or du rituel est payé AU DÉBUT (barre à 0, premier tick) ; sans assez d'Or la barre ne bouge pas ; à la fin la barre
     * repart de 0 sans report et le rituel suivant se paie à son tour. La durée est celle d'un nombre ENTIER de ticks (secondsPerCompletion). « Payé » = barre > 0. Une passe en formule, sans plafond de rituels (le jeu n'en a pas : constantLevelGain).
     */
    let t = seconds, p = Math.max(0, num(rs.progress, 0)), completions = 0;
    if (p >= secondsPerCompletion - 1e-9) p = 0;   /* ancienne forme « barre pleine en attente d'Or » */
    let or = state.currencies.gold;
    const limiteDefi = challengeHundredLevelsRemaining(state);
    if (p > 0) {
      const manque = Math.max(0, secondsPerCompletion - p);
      if (t + 1e-9 < manque) { p += t; t = 0; }
      else if (limiteDefi >= 1) { t = Math.max(0, t - manque); p = 0; completions = 1; quota = Math.max(0, quota - 1); }
      else { p = Math.min(p + t, secondsPerCompletion); t = 0; }
    }
    if (t > 1e-9 && p <= 0) {
      const dejaFaits = completions;
      const pleins = Math.floor((t + 1e-9) / secondsPerCompletion);
      const payables = Math.floor((or + 1e-9) / ritual.gold);
      const n = Math.max(0, Math.min(pleins, payables, limiteDefi - dejaFaits, quota));
      t = Math.max(0, t - n * secondsPerCompletion);
      or -= n * ritual.gold;
      completions += n;
      p = 0;
      if (n >= pleins && t > 1e-9 && or + 1e-9 >= ritual.gold && limiteDefi - completions >= 1 && quota - n >= 1) {
        or -= ritual.gold;
        p = Math.min(t, secondsPerCompletion);   /* le niveau suivant démarre : payé, avec le temps restant */
        t = 0;
      }
    }
    rs.progress = p;
    rs.progressRef = secondsPerCompletion;
    if (completions <= 0) { state.currencies.gold = or; continue; }

    rs.completions += completions;
    rs.level += completions;
    state.currencies.gold = or;
    const gainParCompletion = ritual.blood * quirkBonusesV1(idleQuirkNiveauxV1(state)).bloodGainMultiplier * hackFxV1(state).bloodGain * diggerBonuses(state).blood * macguffinEffectMultiplierV1(state, "blood");
    state.currencies.blood += completions * gainParCompletion;
    rs.bloodCollected = Math.max(0, num(rs.bloodCollected, 0)) + completions * gainParCompletion;
    rs.bloodGain = gainParCompletion;
    s.data.bloodPeak = Math.max(num(s.data.bloodPeak, 0), state.currencies.blood);
    challengeHundredLevelsConsume(state, completions);
  }
  s.level = Object.values(s.data.rituals).reduce((sum, x) => sum + x.level, 0);
  s.tempLevel = s.level;
}

/*
 * Sang collecté par rituel (Norman, 2026-11-08 : « le compteur de sang collecté sous le rituel et le sang disponible ne sont pas les mêmes ; quand on lance un sort, tous les compteurs reviennent à 0 ») : chaque rituel garde le sang QU'IL A VRAIMENT RAPPORTÉ (avec tous les
 * multiplicateurs, c'est le montant ajouté au sang disponible) depuis la dernière dépense de sang. Toute remise à zéro du sang disponible (les cinq sorts, Rebirth, boutique) remet aussi ces compteurs à 0 : leur somme égale toujours le sang disponible.
 * bloodGain = sang rapporté par UNE complétion (l'écran s'en sert pour faire monter le compteur d'un coup à chaque rituel rejoué).
 */
export function bloodCollecteRemiseAZeroV1(state) {
  const rituals = state?.systems?.bloodMagic?.data?.rituals;
  if (!rituals) return;
  for (const r of Object.values(rituals)) r.bloodCollected = 0;
}
/* Ancienne sauvegarde (compteurs absents) : le sang disponible est réparti entre les rituels au prorata de ce qu'ils rapportent (complétions x sang du catalogue), pour que la somme soit juste dès le premier passage. */
function bloodCollecteMigrerV1(state, s) {
  const rituals = s.data.rituals || {};
  if (!Object.values(rituals).some((r) => r.bloodCollected === undefined)) return;
  const sang = Math.max(0, num(state.currencies?.blood, 0));
  let poids = 0;
  for (const ritual of IDLE_NGU_BLOOD_RITUALS) poids += Math.max(0, num(rituals[ritual.id]?.completions, 0)) * ritual.blood;
  for (const ritual of IDLE_NGU_BLOOD_RITUALS) {
    const r = rituals[ritual.id];
    if (!r) continue;
    r.bloodCollected = poids > 0 ? sang * (Math.max(0, num(r.completions, 0)) * ritual.blood) / poids : 0;
  }
}

/* Cible de complétions d'UN rituel (0 = aucune). */
export function setRitualTargetV1(state, ritualId, value) {
  const s = state.systems.bloodMagic;
  if (!s?.unlocked) throw new Error("SYSTEME_VERROUILLE");
  const rs = s.data.rituals?.[ritualId];
  if (!rs) throw new Error("RITUEL_INVALIDE");
  rs.target = Math.max(0, Math.min(1e9, Math.floor(num(value, 0))));
  return { ritual: ritualId, target: rs.target };
}

/* Place (ou retire) de la Magic sur UN rituel, bornée par le plafond commun de Magic et par la Magic libre ; le total du système est la somme des rituels. */
export function setRitualAllocationV1(state, ritualId, value, context = {}) {
  const s = state.systems.bloodMagic;
  if (!s?.unlocked) throw new Error("SYSTEME_VERROUILLE");
  const ritual = IDLE_NGU_BLOOD_RITUALS.find(x => x.id === ritualId);
  if (!ritual || !ritualUnlocked(ritual, context, state)) throw new Error("RITUEL_VERROUILLE");
  bloodMigrerAllocationV1(s);
  const rs = s.data.rituals[ritualId];
  const previous = Math.max(0, num(rs.magic, 0));
  const autres = Object.entries(s.data.rituals).reduce((sum, [id, r]) => sum + (id === ritualId ? 0 : Math.max(0, num(r.magic, 0))), 0);
  const cap = Math.max(0, idleNguEffectiveResourceStatV1(state, "magic", "cap"));
  const usedElsewhere = totalAllocated(state, "magic", "bloodMagic") + externalResourceAllocation(context, "magic");
  const maxByCapacity = Math.max(0, cap - usedElsewhere - autres);
  const maxByOwned = Math.max(0, previous + num(state.resources.magic.current, 0));
  const target = clamp(value, 0, Math.min(maxByCapacity, maxByOwned));
  rs.magic = target;
  state.resources.magic.current = clamp(num(state.resources.magic.current, 0) - (target - previous), 0, Math.max(0, cap - usedElsewhere - autres - target));
  s.allocation.magic = autres + target;
}

/*
 * Sang minimum par sort (wiki NGU, page Blood Magic, colonne "Minimum
 * Blood Required", consultée le 2026-09-14) — jamais vérifié avant ce
 * round, seul un `blood <= 0` générique était appliqué.
 */
const BLOOD_SPELL_MINIMUMS_V1 = Object.freeze({
  /* Le jeu n'impose AUCUN minimum au sort du Nombre (RebirthPowerSpell::castRebirthSpell, build 1260, 2026-11-16) ; 1 reste le seuil du bouton (le client le recopie, test idle-blood-lancer-apres-serveur-v1). Le lancer partiel automatique, lui, n'en a aucun. */
  numberBoost: 1,
  ironPill: 100,
  bloodSpaghetti: 10000,
  counterfeitGold: 1000000,
  /* Dernier sort (page THE END, pièce 494) : « blood requirement: 50 sextillion / 5e22 ». */
  leeches: IDLE_THE_END_LAST_SPELL_BLOOD_V1
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

/* « En direct » (Norman, 2026-10-04 : « quand quelqu'un effectue un rituel blood, ça s'écrit dans En direct ») : compteur de sorts lancés + dernier sort (rang dans la liste), lus par idle-flux-v1.js. */
const BLOOD_SPELLS_FLUX_V1 = Object.freeze(["numberBoost", "ironPill", "bloodSpaghetti", "counterfeitGold", "leeches"]);

export function castBloodSpell(state, spell, now = 0) {
  const resultat = castBloodSpellSansTrace(state, spell, now);
  state.records.bloodSpellsCast = Math.max(0, num(state.records.bloodSpellsCast, 0)) + 1;
  state.records.bloodSpellLast = BLOOD_SPELLS_FLUX_V1.indexOf(spell) + 1;
  return resultat;
}

/*
 * Lancer PARTIEL (lu dans le jeu, build 1260, 2026-11-16 : RebirthPowerSpell::castRebirthSpell(montant), castLootSpell(montant), castGoldSpell(montant), appelés seulement par autoSpell).
 * Un montant au-dessus du sang disponible ne fait RIEN ; Loot et Gold refusent aussi un montant sous leur minimum (10 000 / 1e6) ; le Nombre n'a aucun minimum. Le montant est
 * ajouté au cumul du sort et retiré du sang (le reste du sang est conservé). Renvoie null quand le lancer est ignoré. Ne compte pas dans « En direct » (jamais un lancer du joueur).
 */
export const IDLE_SORTS_AUTO_V1 = Object.freeze([
  Object.freeze({ spell: "numberBoost", cle: "autoNumberBoost" }),
  Object.freeze({ spell: "bloodSpaghetti", cle: "autoBloodSpaghetti" }),
  Object.freeze({ spell: "counterfeitGold", cle: "autoCounterfeitGold" })
]);

export function castBloodSpellPartielV1(state, spell, montant) {
  if (!IDLE_SORTS_AUTO_V1.some((x) => x.spell === spell)) throw new Error("SORT_SANG_INVALIDE");
  const montantNum = num(montant, NaN);
  const brut = Math.max(0, num(state.currencies.blood, 0));
  if (!(montantNum >= 0) || montantNum > brut) return null;
  if (spell !== "numberBoost" && montantNum < BLOOD_SPELL_MINIMUMS_V1[spell]) return null;
  const spells = state.systems.bloodMagic.data.spells;
  if (spell === "numberBoost") spells.numberBoost = Math.max(1, spells.numberBoost) + montantNum;
  else appliquerSortCumulV1(spells, spell, montantNum);
  state.currencies.blood = brut - montantNum;
  /* La collecte par rituel (affichage) ne suit que la remise à zéro complète du sang. */
  if (state.currencies.blood <= 0) bloodCollecteRemiseAZeroV1(state);
  return { spell, spent: montantNum };
}

/* Blood Spaghetti / Counterfeit Gold : cumule le sang et recalcule le bonus (formules lues dans AllBloodMagicController::lootBonus / goldBonus). */
function appliquerSortCumulV1(spells, spell, montant) {
  if (spell === "counterfeitGold") {
    spells.counterfeitGoldBloodSpent = Math.max(0, num(spells.counterfeitGoldBloodSpent, 0)) + montant;
    /* Lu dans le jeu (AllBloodMagicController::goldBonus, build 1260, 2026-11-16) : 1 si le sang dépensé est sous 1e6, sinon 1 + floor((log2(sang/1e6) + 1)^2) x 0,01. */
    spells.counterfeitGold = spells.counterfeitGoldBloodSpent < 1000000 ? 1 : 1 + Math.floor(Math.pow(Math.log2(spells.counterfeitGoldBloodSpent / 1000000) + 1, 2)) * 0.01;
    return spells.counterfeitGold;
  }
  spells.bloodSpaghettiBloodSpent = Math.max(0, num(spells.bloodSpaghettiBloodSpent, 0)) + montant;
  /* Lu dans le jeu (AllBloodMagicController::lootBonus, build 1260, 2026-11-16) : 1 si le sang dépensé est sous 10 000, sinon 1 + floor(log2(sang/10 000) + 1) x 0,01. */
  spells.bloodSpaghetti = spells.bloodSpaghettiBloodSpent < 10000 ? 1 : 1 + Math.floor(Math.log2(spells.bloodSpaghettiBloodSpent / 10000) + 1) * 0.01;
  return spells.bloodSpaghetti;
}

/*
 * Sorts automatiques (lu dans le jeu, build 1260, 2026-11-16 : RebirthPowerSpell::autoSpell, relancé toutes les secondes par InvokeRepeating).
 * Condition : boss > 36 (bossID) ; le sang est réparti à parts égales (floor) entre les sorts cochés (Nombre, Spaghetti, Or) et chacun lance son lancer partiel,
 * dans cet ordre, avec le MÊME montant. Les cases sont des champs du jeu (BloodMagic.*AutoSpell), conservés au Rebirth. Le jeu n'exécute rien hors ligne.
 */
export function setBloodAutoSpellV1(state, spell, valeur, context = {}) {
  const def = IDLE_SORTS_AUTO_V1.find((x) => x.spell === spell);
  if (!def) throw new Error("SORT_SANG_INVALIDE");
  if (!state.systems.bloodMagic?.unlocked) throw new Error("SYSTEME_VERROUILLE");
  const spells = state.systems.bloodMagic.data.spells;
  spells[def.cle] = valeur === undefined ? !spells[def.cle] : Boolean(valeur);
  return { spell, auto: spells[def.cle] };
}

export function avancerSortsAutoV1(state, secs, context) {
  const bm = state.systems.bloodMagic;
  if (!bm?.unlocked || !(secs > 0)) return;
  const spells = bm.data.spells;
  const actifs = IDLE_SORTS_AUTO_V1.filter((x) => spells[x.cle]);
  if (!actifs.length) { if (spells.autoReste) spells.autoReste = 0; return; }
  /* Pas de lancer hors ligne (même seuil de 5 min que le reste du hors ligne) ; boss > 36 (même condition que l'avance des rituels). */
  if (secs >= 5 * 60 || num(context.bosses, 0) < 37) return;
  const cumul = Math.max(0, num(spells.autoReste, 0)) + secs;
  if (cumul < 1) { spells.autoReste = cumul; return; }
  spells.autoReste = cumul - Math.floor(cumul);
  const montant = Math.floor(Math.max(0, num(state.currencies.blood, 0)) / actifs.length);
  for (const x of actifs) castBloodSpellPartielV1(state, x.spell, montant);
}

function castBloodSpellSansTrace(state, spell, now = 0) {
  const minimum = BLOOD_SPELL_MINIMUMS_V1[spell];
  if (minimum === undefined) throw new Error("SORT_SANG_INVALIDE");
  /* Nombre, Spaghetti et Gold prennent le sang TEL QUEL (le jeu ne l'arrondit pas : castRebirthSpell / castLootSpell / castGoldSpell) ; les autres sorts travaillent sur sa partie entière (mêmes seuils entiers, résultat identique). */
  const brut = Math.max(0, num(state.currencies.blood, 0));
  const blood = Math.floor(state.currencies.blood);
  const sangSort = spell === "numberBoost" || spell === "bloodSpaghetti" || spell === "counterfeitGold" ? brut : blood;
  if (sangSort < minimum) throw new Error("SANG_INSUFFISANT");
  const spells = state.systems.bloodMagic.data.spells;

  if (spell === "numberBoost") {
    spells.numberBoost = Math.max(1, spells.numberBoost) + brut;
    state.currencies.blood = 0;
    bloodCollecteRemiseAZeroV1(state);
    return { spell, spent: brut, multiplier: spells.numberBoost };
  }
  if (spell === "ironPill") {
    /* Wiki Blood Magic : Power/Toughness += Blood^0.25 (HP x3, regen x0,03), permanent -- gain ABSOLU, pas un pourcentage. */
    if (now > 0 && now < num(spells.ironPillReadyAt, 0)) throw new Error("SORT_EN_RECHARGE");
    /* Lu dans le jeu (RebirthPowerSpell::castAdventurePowerupSpell, build 1260, 2026-11-16) : floor(sang^0,25), x ironPillBonus (perks 84/85) SEULEMENT si la difficulté du Rebirth est Evil ou plus, plafonné à 1e8. */
    const base = Math.floor(Math.pow(blood, 0.25));
    const gain = Math.min(1e8, idleRangDifficulteV1(state.difficulty) >= 1 ? base * perkBonusesV1(idlePerkNiveauxV1(state)).ironPillMultiplier : base);
    spells.ironPill += gain;
    if (now > 0) spells.ironPillReadyAt = now + (IRON_PILL_COOLDOWN_MS_V1[state.difficulty] || IRON_PILL_COOLDOWN_MS_V1.normal);
    state.currencies.blood = 0;
    bloodCollecteRemiseAZeroV1(state);
    return { spell, spent: blood, gain };
  }
  if (spell === "counterfeitGold" || spell === "bloodSpaghetti") {
    const multiplier = appliquerSortCumulV1(spells, spell, brut);
    state.currencies.blood = 0;
    bloodCollecteRemiseAZeroV1(state);
    return { spell, spent: brut, multiplier };
  }
  if (spell === "leeches") {
    /* Lu dans le jeu (RebirthPowerSpell::castEndSpell, build 1260, 2026-11-16) : le dernier sort n'existe qu'en difficulté Sadistic (rebirthDifficulty < 2 : refus). */
    if (idleRangDifficulteV1(state.difficulty) < 2) throw new Error("DIFFICULTE_VERROUILLEE");
    state.currencies.blood = 0;
    bloodCollecteRemiseAZeroV1(state);
    idleTheEndGrantV1(state.adventure, 494, Date.now());
    return { spell, spent: blood };
  }
  throw new Error("SORT_SANG_INVALIDE");
}

/* Historiques du Money Pit et de la roue (Norman, 2026-10-03) : 20 lignes par page, plusieurs pages pour les plus anciennes -> on garde 100 lignes par liste (5 pages). */
export const IDLE_MONEY_PIT_HISTORIQUE_MAX_V1 = 100;

function advanceMoneyPitAndDaily(state, now) {
  const pit = state.systems.moneyPit;
  if (pit.unlocked && state.systems.dailySpin) state.systems.dailySpin.unlocked = true;
  /* Octroi des cases 1 et 2 d'octobre 2026 (idle-login-calendar-v1.js) : seulement pour qui voit le calendrier (Money Pit découvert). */
  if (pit.unlocked) idleLoginCalendarOctroiV1(state, nowMs(now));
  const spin = state.systems.dailySpin;
  /* Lu dans le jeu (DailyReward::.ctor) : le chrono du tour démarre à 23 h et tourne depuis la création de la partie (plafond 36 h). */
  if (spin.unlocked && !spin.data.readyAt) spin.data.readyAt = now + 24 * 3600000 - Math.min(36 * 3600000, 23 * 3600000 + Math.max(0, num(state.records?.playSeconds, 0)) * 1000);
}

export function yggMaxTier(state) {
  return int(state.challenge.completions.troll,0)>=3 ? 24 : 10;
}

function yggFreeResource(state, resource) {
  return Math.max(0,num(state.resources[resource]?.current,0));
}

export function yggTierUpgradeCost(fruit, targetTier) {
  const t=Math.max(1,int(targetTier,1));
  return Math.max(1,int(fruit.tierCost,1)*t*t);
}

export function upgradeYggFruit(state, fruitId) {
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

export function activateYggFruit(state, fruitId) {
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

/*
 * Money Pit, paliers 12 à 16 (lu dans le jeu, build 1260, 2026-11-16 : PitController::tier12Reward…tier16Reward).
 * Sang par seconde : somme sur les rituels de (remplissages par seconde x sang par complétion), sans tenir compte de l'Or (AllBloodMagicController::totalBloodGainedPerSecond).
 */
export function bloodParSecondeV1(state, context) {
  const s = state.systems.bloodMagic;
  if (!s || !s.unlocked) return 0;
  bloodMigrerAllocationV1(s);
  const power = Math.max(1, idleNguEffectiveResourceStatV1(state, "magic", "power"));
  const difficultyDivider = idleNguDifficultySpeedDividerV1(state, "bloodMagic");
  const dutch = 1 + Math.max(0, num(state.adventure?.setRewards?.bloodMagicSpeedPct, 0));
  let total = 0;
  for (const ritual of IDLE_NGU_BLOOD_RITUALS) {
    if (!ritualUnlocked(ritual, context, state)) continue;
    const magic = bloodRitualMagicV1(s, ritual.id);
    if (magic <= 0) continue;
    const secondes = dureeNiveauEnTicksV1(ritual.baseSeconds * 1000 * difficultyDivider / Math.max(1e-12, magic * power) / dutch);
    const gain = ritual.blood * quirkBonusesV1(idleQuirkNiveauxV1(state)).bloodGainMultiplier * hackFxV1(state).bloodGain * diggerBonuses(state).blood * macguffinEffectMultiplierV1(state, "blood");
    if (Number.isFinite(secondes) && secondes > 0) total += gain / secondes;
  }
  return total;
}

/* Graines d'une « grenade » du Money Pit : (long)(graines d'une récolte de Pomegranate au palier 24 x fraction) (FruitController::awardPartialPomegranate). */
export function pitGrainesGrenadeV1(state, fraction) {
  const def = IDLE_NGU_YGG_FRUITS.find((x) => x.id === "pomegranate");
  if (!def) return 0;
  const perkBonuses = perkBonusesV1(idlePerkNiveauxV1(state));
  const quirkBonuses = quirkBonusesV1(idleQuirkNiveauxV1(state));
  const mult = perkBonuses.seedYieldMultiplier * quirkBonuses.seedYieldMultiplier * nguFxV1(state).yggdrasil * gearPctV1(gearSpecialsV1(state), "seedGainPct");
  return Math.floor(yggSeedGain(def, 24, true, mult, 1, false) * fraction);
}

export function useYggFruit(state,fruitId,mode="eat",options={}){
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
  /* Fil « En direct » (Norman, 2026-11-14) : un compteur par fruit et par mode (manger / récolter), lu par idle-flux-v1.js ; jamais le détail du gain. */
  {const rec=state.records||(state.records={});const ff=rec.fruitFlux&&typeof rec.fruitFlux==="object"?rec.fruitFlux:(rec.fruitFlux={eat:{},harvest:{}});const cible=harvest?(ff.harvest&&typeof ff.harvest==="object"?ff.harvest:(ff.harvest={})):(ff.eat&&typeof ff.eat==="object"?ff.eat:(ff.eat={}));cible[fruitId]=Math.max(0,num(cible[fruitId],0))+1;}
  if(poop)result.poop={consumed:poop.consumed,free:poop.free,remaining:poop.remaining,factor:poop.factor};
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
      /* Lu dans le jeu (FruitController::consumeGoldFruit, build 1260, 2026-11-16) : facteur x 1800 x GPS brut x bonus de récolte, SANS arrondi. */
      const gold=Math.max(0,idleNguTimeMachineGrossGoldPerSecond(state))*(factor*1800*firstHarvestMultiplier);
      state.currencies.gold+=gold;
      result.gold=gold;
    }else if(def.effect==="powerAlpha"){
      s.data.runPowerAlphaValue+=Math.ceil(factor*yieldFruit);
      result.runPowerAlphaValue=s.data.runPowerAlphaValue;
    }else if(def.effect==="adventure"){
      const baseToughness=Math.max(1,idleAdventureCombatStatsV1(idleEquipementEffectifLectureV1(state),{},null).toughness);
      const gain=Math.floor(factor*Math.pow(baseToughness,0.2)*yieldFruit);
      s.data.permanent.adventurePower+=gain;
      s.data.permanent.adventureToughness+=gain;
      s.data.permanent.adventureHp+=gain*3;
      s.data.permanent.adventureRegen+=gain*0.03;
      result.adventureGain=gain;
    }else if(def.effect==="experience"){
      /* « x FoKSucksPerk x FoKStillSucksPerk » : x3 chacun (perks 19 et 20). */
      const exp=Math.max(1,Math.floor(Math.ceil(factor*5*yieldFruit)*Math.max(1,perkBonuses.fruitKnowledgeExpMultiplier)*Math.max(1,num(idleNguBonusesLectureV1(state).xpMultiplier,1))));
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
      const progress=Math.ceil(factor*60000*quirkYgg*gearPctV1(gearYgg,"yggdrasilYieldPct")*Math.max(1,num(idleNguBonusesLectureV1(state).ppMultiplier,1))*firstHarvestMultiplier);
      const tower=state.systems.tower;
      if(!tower.data||typeof tower.data!=="object")tower.data={};
      tower.data.ppProgress=Math.max(0,num(tower.data.ppProgress,0))+progress;
      const entiers=Math.floor(tower.data.ppProgress/1e6);
      if(entiers>0){tower.data.ppProgress-=entiers*1e6;state.currencies.pp+=entiers;}
      result.pp=entiers;
      result.ppProgress=progress;
    }else if(def.effect==="macguffinAlpha"||def.effect==="macguffinBeta"){
      /* Wiki Yggdrasil : ni NGU Yggdrasil (tableau "NGU Yggdrasil / Yggdrasil Yield"), seulement Poop x Quirk x Equip x FirstHarvest. */
      const fx=macguffinEatFruitV1(state,def.effect==="macguffinAlpha"?"alpha":"beta",grownTier,quirkYgg*gearPctV1(gearYgg,"yggdrasilYieldPct")*firstHarvestMultiplier*(def.effect==="macguffinAlpha"?1+0.2*wishLevelV1(state,60):1)); /* souhait 60 : +20 % par niveau au Fruit of MacGuffin α (lu dans le jeu, WishesController::totalFruitGuffbonus, 2026-11-16) */
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
      /* Fruit of Quirks (FruitController::consumeQPFruit, build 1260, audit 2026-11-16) : ⌈3 x T x Poop x Quirk_Ygg x Equip_YggYield x questRewardFactor (SANS le beurre : le jeu le divise) x FirstHarvest⌉ (pas de NGU Yggdrasil). */
      const qp=idleYggFruitOfQuirksQpV1(grownTier,quirkYgg*gearPctV1(gearYgg,"yggdrasilYieldPct")*firstHarvestMultiplier*questRewardFactorTitansV1(state,{}));
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

/*
 * Aperçu de la page Yggdrasil (Norman, 2026-10-22 : « le nombre de graines qu'on va récolter » et « les bonus qu'on va gagner en mangeant »). LECTURE SEULE : mêmes formules que useYggFruit (ci-dessus),
 * sans rien modifier ; le test idle-ygg-apercu-v1 compare cet aperçu au vrai useYggFruit pour chaque fruit. Renvoie {harvest:{seeds}, eat:{seeds, effets:[[code,valeur],…]}} pour le fruit prêt (tier poussé
 * actuel), avec le facteur de Poop voulu (1 = sans). À garder synchronisé avec useYggFruit : toute formule changée là doit l'être ici (le test le vérifie).
 */
export function apercuYggFruitV1(state,def,f,poopFactor=1){
  const grownTier=Math.max(1,Math.min(f.tier,Math.floor(f.growthHours)));
  const perkBonuses=perkBonusesV1(idlePerkNiveauxV1(state));
  const quirkBonuses=quirkBonusesV1(idleQuirkNiveauxV1(state));
  const gearYgg=gearSpecialsV1(state);
  const seedYieldMultiplier=perkBonuses.seedYieldMultiplier*quirkBonuses.seedYieldMultiplier*nguFxV1(state).yggdrasil*gearPctV1(gearYgg,"seedGainPct");
  const firstHarvestMultiplier=(f.firstHarvestThisRun?perkBonuses.firstHarvestMultiplier:1)*Math.max(1,poopFactor);
  const factor=Math.ceil(Math.pow(grownTier,1.5));
  const quirkYgg=quirkBonuses.yggYieldMultiplier;
  const yieldFruit=nguFxV1(state).yggdrasil*quirkYgg*gearPctV1(gearYgg,"yggdrasilYieldPct")*firstHarvestMultiplier;
  const effets=[];
  if(def.effect==="gold"){
    effets.push(["gold",Math.max(0,idleNguTimeMachineGrossGoldPerSecond(state))*(factor*1800*firstHarvestMultiplier)]);
  }else if(def.effect==="powerAlpha")effets.push(["powerAlpha",Math.ceil(factor*yieldFruit)]);
  else if(def.effect==="adventure"){
    const baseToughness=Math.max(1,idleAdventureCombatStatsV1(idleEquipementEffectifLectureV1(state),{},null).toughness);
    effets.push(["adventure",Math.floor(factor*Math.pow(baseToughness,0.2)*yieldFruit)]);
  }else if(def.effect==="experience")effets.push(["experience",Math.max(1,Math.floor(Math.ceil(factor*5*yieldFruit)*Math.max(1,perkBonuses.fruitKnowledgeExpMultiplier)*Math.max(1,num(idleNguBonusesLectureV1(state).xpMultiplier,1))))]);
  else if(def.effect==="luck")effets.push(["luck",Math.ceil(factor*0.7*yieldFruit)*0.05]);
  else if(def.effect==="powerBeta")effets.push(["powerBeta",Math.ceil(factor*yieldFruit)]);
  else if(def.effect==="numbers")effets.push(["numbers",Math.ceil(factor*3*yieldFruit)]);
  else if(def.effect==="ap")effets.push(["ap",apWithBonusV1(state,Math.floor(Math.ceil(factor*15*firstHarvestMultiplier)))]);
  else if(def.effect==="pp")effets.push(["pp",Math.ceil(factor*60000*quirkYgg*gearPctV1(gearYgg,"yggdrasilYieldPct")*Math.max(1,num(idleNguBonusesLectureV1(state).ppMultiplier,1))*firstHarvestMultiplier)/1e6]);
  else if(def.effect==="macguffinAlpha"||def.effect==="macguffinBeta")effets.push(["macguffin",macguffinFruitLevelsV1(def.effect==="macguffinAlpha"?"alpha":"beta",grownTier,quirkYgg*gearPctV1(gearYgg,"yggdrasilYieldPct")*firstHarvestMultiplier)]);
  else if(def.effect==="powerDelta")effets.push(["powerDelta",Math.ceil(factor*7*yieldFruit)]);
  else if(def.effect==="mayo")effets.push(["mayo",idleCardsMayoFruitApercuV1(state,def.mayo,idleYggMayoFruitBaseV1(grownTier,poopFactor>1?poopFactor:1))]);
  else if(def.effect==="quirks")effets.push(["quirks",idleYggFruitOfQuirksQpV1(grownTier,quirkYgg*gearPctV1(gearYgg,"yggdrasilYieldPct")*firstHarvestMultiplier*questRewardFactorTitansV1(state,{}))]);
  return {
    tier:grownTier,
    harvest:{seeds:yggSeedGain(def,grownTier,true,seedYieldMultiplier,firstHarvestMultiplier,false)},
    eat:{seeds:yggSeedGain(def,grownTier,def.effect==="seeds",seedYieldMultiplier,firstHarvestMultiplier,true),effets}
  };
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
export function diggerGlobalBonus(state){
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

export function diggerDrainTotal(state){
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

export function availableDiggerSlots(state){
  const extra=Math.max(0,int(state.adventure?.setRewards?.diggerSlot,0));
  const challengeExtra=challengePermanentBonuses(state).diggerSlotBonus;
  /* Perks « A Digger Slot! » et boutique Sellout (6 slots) : calculés mais jamais lus jusqu'ici. */
  const perkExtra=Math.max(0,int(perkBonusesV1(idlePerkNiveauxV1(state)).diggerSlotBonus,0));
  const shopExtra=Math.max(0,Math.min(6,int(state.selloutShop?.purchases?.diggerSlots,0)));
  const expExtra=expShopPurchasedV1(state,"diggerSlot");
  return Math.max(1,Math.min(12,int(state.systems.diggers?.data?.slots,1)+extra+challengeExtra+perkExtra+shopExtra+expExtra));
}

export function upgradeDigger(state,id){
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

/*
 * Niveau « au maximum » d'un mineur (Norman, 2026-11-08 : « dans Mineurs, le bouton Maximum doit nous mettre au maximum que notre or peut supporter ») : avec ajuster, le niveau demandé est ramené au plus haut niveau (au plus le niveau demandé) dont la consommation d'or,
 * ajoutée à celle des AUTRES mineurs au travail, tient dans l'or par seconde brut de la Machine temporelle. La consommation croît avec le niveau : recherche par dichotomie. Aucun niveau ne tient : on garde l'état et on refuse comme avant (GPS_INSUFFISANT).
 */
function niveauMaxSupporteDiggerV1(state,id,demande){
  const s=state.systems.diggers,def=diggerDefinition(id);
  const gross=idleNguTimeMachineGrossGoldPerSecond(state);
  let autres=0;
  for(const x of IDLE_NGU_DIGGERS){
    if(x.id===id)continue;
    const dx=s.data.diggers[x.id];
    if(dx&&dx.active&&dx.runLevel>0)autres+=diggerDrainAtLevel(x,dx.runLevel);
  }
  /* Lu dans le jeu (AllGoldDiggerController::setLevelMaxAffordable, build 1260, audit 2026-11-16, economie.md) : niveau = partie entière de ln(or par seconde net / drain de base) / ln(croissance), plafonné au niveau maximum acheté, jamais négatif. Comme le drain du niveau L vaut base x croissance^(L-1), c'est UN niveau sous le plus haut qui tienne (marge du jeu). Le niveau demandé reste un plafond (SOREAL). */
  const net=gross-autres;
  if(!(net>=def.drain)||!(def.growth>1))return 0;
  const niveauJeu=Math.floor(Math.log(net/def.drain)/Math.log(def.growth));
  return Math.max(0,Math.min(int(demande,0),int(s.data.diggers[id]?.maxLevel,0),niveauJeu));
}

export function setDiggerLevel(state,id,level,ajuster){
  const s=state.systems.diggers;
  if(!s?.unlocked)throw new Error("SYSTEME_VERROUILLE");
  const def=diggerDefinition(id),d=s.data.diggers[id];
  if(!def||!d)throw new Error("DIGGER_INVALIDE");
  let target=clamp(int(level,0),0,d.maxLevel);
  if(ajuster&&target>0){
    const supporte=niveauMaxSupporteDiggerV1(state,id,target);
    if(supporte<=0)throw new Error("GPS_INSUFFISANT");
    target=supporte;
  }
  const wasActive=d.active;
  d.runLevel=target;
  if(target===0)d.active=false;
  if(wasActive&&target>0){
    const gross=idleNguTimeMachineGrossGoldPerSecond(state);
    if(diggerDrainTotal(state)>gross){d.active=false;throw new Error("GPS_INSUFFISANT");}
  }
  return {digger:id,runLevel:d.runLevel,active:d.active};
}

export function toggleDigger(state,id,active){
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

/* Pourcentage de l'effet d'un Digger à un niveau actif donné (formules du wiki, page Gold Diggers) : factorisé pour que le bonus affiché au joueur soit EXACTEMENT celui que diggerBonuses applique. */
function diggerPctAtLevel(def,L){
  if(def.id==="drop"||def.id==="wandoos"||def.id==="blood")return 150+L;
  if(def.id==="stats")return 200+Math.pow(L,3);
  if(def.id==="adventure")return 110+0.5*L;
  if(def.id==="energyNgu"||def.id==="magicNgu"||def.id==="energyBeard"||def.id==="magicBeard")return 120+L;
  if(def.id==="pp")return 110+L;
  if(def.id==="daycare")return 105+0.1*L;
  if(def.id==="experience")return 105+0.5*L;
  return 100;
}

export function diggerBonuses(state){
  const s=state.systems.diggers;
  const out={drop:1,wandoos:1,stats:1,adventure:1,energyNgu:1,magicNgu:1,energyBeard:1,magicBeard:1,pp:1,daycare:1,blood:1,experience:1};
  if(!s?.unlocked)return out;
  const g=diggerGlobalBonus(state);
  for(const def of IDLE_NGU_DIGGERS){
    const d=s.data.diggers[def.id];
    if(!d.active||d.runLevel<=0)continue;
    out[def.effect]=Math.max(1,diggerPctAtLevel(def,d.runLevel)/100*g);
  }
  return out;
}

/*
 * Vue de la page Mineurs d'or (Norman, 2026-10-27 : « il faut que ce soit représentatif de ce que ça fait ») : pour chaque Digger, le multiplicateur que donne son niveau actif (s'il travaillait), le drain à ce niveau et le coût du prochain niveau maximum ;
 * plus le GPS brut, le drain total, les emplacements et le bonus global. Lecture seule : aucune valeur nouvelle, ce sont celles du moteur. Rien tant que le système n'est pas découvert (anti-spoil).
 */
/* Anti-spoil (Norman, 2026-11-09) : un labo qui nomme un système (Wandoos, NGU, barbes, Magie du sang, garderie) n'est envoyé que si ce système est découvert ;
 * même règle que la page (SYSTEME_DU_LABO, labos-page-v1.js) : la taille de la liste ne doit pas révéler le nombre total de labos. */
const SYSTEME_DU_LABO_V1={wandoos:"wandoos",energyNgu:"ngu",magicNgu:"ngu",energyBeard:"beards",magicBeard:"beards",blood:"bloodMagic",daycare:"daycare"};
export function diggerLaboVisibleV1(state,id){
  const sys=SYSTEME_DU_LABO_V1[id];
  return !sys||Boolean(state.systems[sys]?.unlocked);
}
export function diggerViewV1(state){
  const s=state.systems.diggers;
  if(!s?.unlocked)return null;
  const g=diggerGlobalBonus(state);
  const items={};
  for(const def of IDLE_NGU_DIGGERS){
    if(!diggerLaboVisibleV1(state,def.id))continue;
    const d=s.data.diggers[def.id]||{};
    const run=Math.max(0,int(d.runLevel,0)),max=Math.max(0,int(d.maxLevel,0));
    items[def.id]={
      multiplier:run>0?Math.max(1,diggerPctAtLevel(def,run)/100*g):1,
      drain:run>0?diggerDrainAtLevel(def,run):0,
      nextCost:max>=def.cap?null:diggerCostAtLevel(def,max+1),
      nextDrain:diggerDrainAtLevel(def,Math.min(def.cap,run+1))
    };
  }
  return {
    globalPct:(g-1)*100,
    grossGps:idleNguTimeMachineGrossGoldPerSecond(state),
    drain:diggerDrainTotal(state),
    slots:availableDiggerSlots(state),
    active:diggerActiveCount(state),
    items
  };
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
 * Ennemis qui attaquent et mort du joueur : en ligne seulement, quand un étage du parcours demande 1,8 s de coups ou plus (idle-itopod-combat-v1.js, towerBoucleCombatV1).
 */
const TOWER_MAX_FLOOR_V1 = 1600;

function towerTierV1(floor) { return Math.max(1, Math.floor(floor / 50) + 1); }

function towerExpForTierV1(tier) { return tier <= 1 ? 1 : tier === 2 ? 2 : (tier - 1) * (tier - 2) + 2; }

function towerKillsPerRewardV1(tier) { return tier <= 20 ? 40 - tier : 20; }

/*
 * Coups nécessaires pour tuer un ennemi de l'étage. Régénération de l'ennemi (Norman, 2026-11-22 : « les ennemis de l'ITOPOD n'ont pas de regen de vie dans le jeu original ? » ; AdventureController::manageFight : PV de l'ennemi + régénération x dt, plafonnés
 * à ses PV max ; régénération de base 1 x 1,05^étage par seconde, createEnemyTable zone 1000) : entre deux coups (« interval » secondes) l'ennemi récupère regen x interval ; le premier coup n'en subit aucune (PV pleins). Après le 1er coup il reste PV - dégâts,
 * puis chaque coup retire (dégâts - regen x interval) : coups = 1 + ceil((PV - dégâts) / (dégâts - regen x interval)). Si le coup ne dépasse pas la régénération, l'ennemi ne meurt jamais (valeur très grande : le joueur n'avance pas).
 */
export function towerHitsV1(power, idleBonus, floor, interval = 1) {
  const scale = Math.pow(1.05, floor);
  /* EnemyAI::takeDamage (IL, audit 2026-11-22) : Floor(dégâts / defenseFactor) : un coup du joueur est entier. */
  const damage = Math.floor(Math.max(0, power - (10 * scale) / 2) /* le joueur n'a pas de plancher de dégâts dans le jeu (PlayerController) : lu 2026-11-16 */ * Math.max(0.1, idleBonus));
  const pv = 600 * scale;
  if (damage >= pv) return 1;
  const net = damage - scale * Math.max(0.05, Number(interval) || 1);
  if (!(net > 0)) return 1e9;
  return Math.max(1, 1 + Math.ceil((pv - damage) / net));
}

/*
 * Étage optimal = Character::calculateBestItopodLevel du jeu (NGU Idle build 1260, lu le 2026-11-16) : 0 sous 700 de Puissance, sinon floor(log base 1,05 de (Puissance / 765 x Idle Attack Power)), au moins 1.
 * Le jeu le plafonne en plus à l'étage le plus haut atteint (highestItopodLevel) ; ici ce plafond est laissé à la montée progressive (Auto) et à towerAppliquerEtageOptimalV1 (départ au plus à « plus haut - 1 »).
 * Ce n'est PAS « le plus haut étage tuable en un coup » (calcul d'avant, de ~5 étages plus haut) : le jeu garde une marge pour les aléas des coups (0,8 à 1,2) et des PV (0,98 à 1,02).
 */
export function towerOptimalFloorV1(power, idleBonus) {
  if (!(power >= 700)) return 0;
  const x = (power / 765) * Math.max(0.1, idleBonus);
  const f = Math.floor(Math.log(x) / Math.log(1.05) + 1e-9);
  return Math.min(TOWER_MAX_FLOOR_V1, Math.max(1, f));
}

/*
 * Étage optimal tel que le jeu l'expose (Character::calculateBestItopodLevel, IL audit 2026-11-22) : 0 sous 700 de Puissance ; si le logarithme donne moins de 1 : 1, SANS plafond (cas « plus haut = 0 » : le jeu joue l'étage 1 hors ligne) ;
 * sinon min(logarithme, étage le plus haut atteint). towerOptimalFloorV1 (ci-dessus) reste le calcul brut sans plafond.
 */
export function towerOptimalCappedV1(power, idleBonus, highest) {
  if (!(power >= 700)) return 0;
  const x = (power / 765) * Math.max(0.1, idleBonus);
  const f = Math.floor(Math.log(x) / Math.log(1.05) + 1e-9);
  if (!(f >= 1)) return 1;
  return Math.min(TOWER_MAX_FLOOR_V1, Math.min(f, Math.max(0, int(highest, 0))));
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

/*
 * Page ITOPOD / Build History .398 (docs/HORS-LIGNE.md, proposition 2) : contrairement
 * à l'Aventure classique, la progression de l'ITOPOD (en ligne comme hors ligne) n'exige
 * pas d'y être « actif » -- seulement l'ITOPOD débloqué et 650 de Power d'Aventure au
 * total (de quoi tuer l'étage 1 en un coup). Le réglage « active » (généré par le même
 * bouton Activer/Désactiver que les autres systèmes) ne conditionne donc plus cette
 * progression ; il reste dans l'état sauvegardé pour compat mais n'est plus lu ici.
 */
const ITOPOD_MIN_POWER_V1 = 650;

/*
 * Normalisation des données de la Tour (alignement 2026-11-22, audit de la Tour : Norman, « corrige tout en une fois »).
 * Lu dans le jeu (NGU Idle build 1260, Adventure::.ctor) : itopodStart = 0 et itopodEnd = 20 par défaut, AUCUNE montée automatique vers l'étage optimal : l'ancien mode « auto » (départ / fin null) n'existe plus.
 * Migration des anciennes sauvegardes : seules les valeurs null deviennent 0 / 20 ; un réglage posé par le joueur est conservé.
 * Le Lazy ITOPOD Floor Shifter est un interrupteur indépendant (Arbitrary.lazyITOPODOn) : d.shifterOn ; ancien d.autoOptimal (posé par l'ancien bouton Auto) migré UNE fois en d.shifterOn, puis gardé en miroir (compat).
 * Idle Mode (PlayerSettings / Adventure.autoattacking du jeu, faux par défaut dans le jeu) : d.idleMode, vrai par défaut ici pour ne pas casser les parties existantes.
 */
export function towerNormaliserV1(state, d) {
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
  /* Wiki NGU Idle, page ITOPOD (vérifiée le 2026-10-12) : « your start floor ranging from 0 to 1 below the highest floor you've reached, and your end floor going all the way up to 1600 ». */
  if (d.startFloor == null) d.startFloor = 0;
  if (d.endFloor == null) d.endFloor = 20;
  d.startFloor = clamp(int(d.startFloor, 0), 0, Math.max(0, d.highestFloor - 1));
  d.endFloor = clamp(int(d.endFloor, d.startFloor), Math.max(1, d.startFloor), TOWER_MAX_FLOOR_V1);
  if (typeof d.shifterOn !== "boolean") d.shifterOn = d.autoOptimal === true;
  d.autoOptimal = d.shifterOn;
  if (typeof d.idleMode !== "boolean") d.idleMode = true;
}

/* Étage suivant après les 10 kills d'un étage (AdventureController::enemyDeath, IL_08c5 à IL_08fc) : niveau + 1 ; au-delà de l'étage de fin, retour à l'étage de DÉPART. */
function towerEtageSuivantV1(d, floor) {
  return floor + 1 > d.endFloor ? d.startFloor : floor + 1;
}

function advanceTowerV1(state, seconds, context) {
  const tower = state.systems.tower;
  if (!tower.unlocked || !(seconds > 0)) return;
  const d = tower.data;
  towerNormaliserV1(state, d);
  d.hitsParKill = 0;

  const gear = idleEquipementEffectifLectureV1(state);   /* lecture seule (équipement partagé et gelé) */
  const bonuses = idleNguBonusesLectureV1(state);
  const combatStats = idleAdventureCombatStatsV1(gear, context, bonuses);
  const powerRaw = combatStats.power;
  const idleBonus = num(gear.specials?.idleAttackMultiplier, 1.2);
  /* Étage optimal exposé = Character::calculateBestItopodLevel (plafonné à l'étage le plus haut atteint, repli à 1 sans plafond ; audit IL 2026-11-22). */
  d.optimalFloor = towerOptimalCappedV1(powerRaw, idleBonus, d.highestFloor);
  /* Pour l'écran (Norman, 2026-10-04 : « les ennemis doivent prendre des coups, la vie descend progressivement quand on n'est pas assez fort pour les tuer d'un coup ») : coups nécessaires pour tuer un ennemi de l'étage en cours
     (towerHitsV1, la même formule que la progression), délai de réapparition et intervalle entre deux coups. 0 = pas assez de Power pour avancer. */
  if (!(powerRaw >= ITOPOD_MIN_POWER_V1)) return;
  const power = Math.max(10, powerRaw);
  const respawn = 4 * (1 - clamp(num(bonuses.respawnReduction, 0), 0, 1));   /* AdventureController::respawnTime : 4 s x facteurs, sans plancher (audit 2026-11-16) */
  const interval = state.adventure?.unlockFlags?.redLiquidMaxed ? 0.8 : 1;
  /* Idle Mode (jeu : idleAttack seulement si Adventure.autoattacking ; régénération x1,2 seulement dans ce cas, AdventureController::manageFight). Hors ligne le jeu ne le consulte pas (adventureOfflineProgress). */
  const idleOn = d.idleMode !== false;
  const hpMax = Math.max(0, num(combatStats.hp, 0));
  const regenJoueur = Math.max(0, num(combatStats.regen, 0)) * (idleOn ? ITOPOD_AUTOATTACK_REGEN_V1 : 1);
  d.hitsParKill = towerHitsV1(power, idleBonus, d.floor, interval);
  d.respawnS = respawn;
  d.intervalS = interval;
  /* Pour l'écran (Norman, 2026-11-21 : « dans l'ITOPOD le joueur a une barre de vie et il y a un journal de combat ») : de quoi dessiner la barre de vie du joueur et les lignes du journal, tirés du MÊME calcul que la progression (lecture seule, aucun effet sur le jeu).
     pvMax / pv = PV max et PV actuels du joueur (d.hp n'existe que depuis qu'un combat a été simulé : sinon plein) ; degatsCoup = un coup du joueur (formule de towerHitsV1) ; ennemiCoup = un coup de l'ennemi de l'étage (EnemyAI::attack, aléa remplacé par 1) ; regenPv = régénération par seconde en auto-attaque. */
  {
    const echelle = Math.pow(1.05, d.floor);
    d.pvMax = hpMax;
    d.pv = Number.isFinite(d.hp) ? clamp(d.hp, 0, hpMax) : hpMax;
    /* EnemyAI::takeDamage (audit IL 2026-11-22) : Floor(dégâts / defenseFactor) : un coup du joueur est entier. */
    d.degatsCoup = Math.floor(Math.max(0, power - (10 * echelle) / 2) * Math.max(0.1, idleBonus));
    /* Coup de l'ennemi NON tronqué (le jeu tronque une seule fois, après le multiplicateur du coup : la scène fait le floor). */
    d.ennemiCoup = Math.max(0.1 * 10 * echelle, 10 * echelle - Math.max(0, num(combatStats.toughness, 0)) / 2);
    d.regenPv = regenJoueur;
    /* Panneau de stats du joueur (AdventureController::updateAdventureStats : Power, Toughness, Max HP, HP Regen de base). */
    d.puissanceJoueur = Math.max(0, num(combatStats.power, 0));
    d.defenseJoueur = Math.max(0, num(combatStats.toughness, 0));
    d.regenBase = Math.max(0, num(combatStats.regen, 0));
    /* PV de l'ennemi de l'étage (600 x 1,05^étage, powerUp sans l'aléa) et dégâts de poison par tour (floor(attaque x 0,2)) : texte de sa barre et journal. */
    d.ennemiPv = 600 * echelle;
    d.ennemiPoison = Math.floor(10 * echelle * 0.2);
  }
  /*
   * Hors ligne (Character::adventureOfflineProgress, IL 2239) : seconds >= TOWER_COMBAT_MAX_SECONDS_V1. Le jeu applique son rattrapage dès 10 s d'absence (OpenFileDialog::LoadText) ; ici la synchro en ligne est appelée toutes les ~15 s
   * et ne se distingue pas d'une absence courte : le seuil reste celui du farm hors ligne (5 min), voir le rapport d'audit 2026-11-22.
   * EN LIGNE, la Tour ne progresse que si le joueur est dans la zone ITOPOD (zone == 1000 du jeu : enemyDeath ne compte les kills ITOPOD que dans cette zone) = tower.active ; entrer, sortir : towerEntrerV1 / choix d'une zone d'Aventure.
   * HORS LIGNE : seulement « ITOPOD débloqué » + Puissance >= 650 (adventureOfflineProgress ne lit ni la zone ni tower.active ; il lit aussi le réglage itopodOn, qui n'existe pas ici).
   */
  const horsLigneItopod = seconds >= TOWER_COMBAT_MAX_SECONDS_V1;
  if (!horsLigneItopod && (!tower.active || !idleOn)) {
    /* Hors de la zone (ou Idle Mode coupé) : aucun kill ; les PV se régénèrent seuls (jamais au-delà du maximum). */
    if (Number.isFinite(d.hp)) d.hp = clamp(d.hp + regenJoueur * seconds, 0, hpMax);
    return;
  }

  const perks = perkBonusesV1(idlePerkNiveauxV1(state));
  const quirks = quirkBonusesV1(idleQuirkNiveauxV1(state));
  /* Lu dans le jeu (ItopodPerkController::progressGained, build 1260, 2026-11-15) : le bonus de base (quirks + souhaits) ne s'ajoute QU'EN Sadistic (2000 + étage + bonus de base) ; Normal (200 + étage), Evil (700 + étage). */
  const ppBase = state.difficulty === "extreme" ? 2000 + quirks.itopodPppFlat + 50 * wishLevelV1(state, 79) : state.difficulty === "difficile" ? 700 : 200;
  /* Même PPBonus que le Fruit of Rage (sets multiplicatifs, NGU PP, Hacks PP, Diggers PP, Perks, Cards PP). */
  /* ItopodPerkController::totalPPBonus (IL 330) : minimum 1 (audit 2026-11-22). */
  const ppMultiplier = Math.max(1, num(bonuses.ppMultiplier, 1));
  const expMultiplier = Math.max(0, num(bonuses.xpMultiplier, 1));
  /* Pour le journal de l'écran : PPP gagnés par kill = (base + étage) x PPBonus (ItopodPerkController::progressGained). */
  d.ppBase = ppBase;
  d.ppMult = ppMultiplier;

  const killTimeAt = (floor) => respawn + interval * towerHitsV1(power, idleBonus, floor, interval);

  /*
   * PP par kill (ItopodPerkController::progressGained) : l'étage du KILL (AdventureController::enemyDeath calcule progressGained avant d'incrémenter le niveau, IL_0845 à IL_08ae), y compris pour le 10e kill d'un étage.
   * Little Blue Pill : PPP doublés (AllArbitraryController::pillModifier, ItopodPerkController::totalPPBonus) pour les n premiers kills couverts par le stock de pilules, réglage actif.
   */
  const ppPart = (n, floor) => {
    const fx = state.selloutEffects;
    /* Lu dans le jeu, build 1260, 2026-11-17 : AdventureController::enemyDeath (1 pilule par kill ITOPOD SEULEMENT si PlayerSettings.buffedKillsOn) et Character::adventureOfflineProgress (kills buffés = min(kills, pilules) si actif, sinon 0). Réglage faux par défaut : sans lui, aucune pilule n'est consommée ni ne double les PPP. */
    const pills = fx && fx.buffedKillsOn === true ? Math.min(n, Math.max(0, int(fx.bluePills, 0))) : 0;
    if (pills > 0) fx.bluePills -= pills;
    /* Little Blue Pill : x2 (x2,2 avec le Blue Heart (set), idle-hearts-v1.js) pour chaque kill couvert. */
    const pillFactor = 2 * idleHeartsConsumableFactorV1(state);
    d.ppProgress = Math.max(0, num(d.ppProgress, 0)) + (n + pills * (pillFactor - 1)) * (ppBase + floor) * ppMultiplier;
  };
  /*
   * Butin et récompenses d'un lot de n kills : AdventureController::enemyDeath appelle dropLoot APRÈS avoir incrémenté le niveau : le 10e kill d'un étage lâche son butin (palier d'AP / d'EXP, force du boost, pièce 491, Exilé, indice de la Bête)
   * à l'étage SUIVANT (ou à l'étage de départ si on dépasse la fin) ; seul le PP (ppPart) utilise l'étage du kill (audit IL 2026-11-22). `lf` = étage du butin ; `killsAvantBete` = kills déjà faits sur l'étage (-1 : jamais le premier).
   */
  const lootPart = (n, lf, killsAvantBete) => {
    if (!(n > 0)) return;
    const tier = towerTierV1(lf);
    /* Pièce 491 (page THE END) : « Drop chance equal to 0.005% * (ITOPOD Level - 1449) » à chaque kill dès l'étage 1450 ; jamais deux fois. */
    /* Hors ligne (Character::adventureOfflineProgress, méthode 2239 : aucun appel à itopodDrop / checkEndDrop / checkExileDrop / checkITOPODSecret) : AUCUN de ces trois tirages (audit IL 2026-11-20). */
    if (!horsLigneItopod && lf >= IDLE_THE_END_TOWER_FIRST_FLOOR_V1 && !idleTheEndHasV1(state.adventure, 491)) {
      const p = Math.min(1, 0.00005 * (lf - (IDLE_THE_END_TOWER_FIRST_FLOOR_V1 - 1)));
      if (Math.random() < 1 - Math.pow(1 - p, n)) idleTheEndGrantV1(state.adventure, 491, Date.now());
    }
    /* Tentacule de l'Exilé (337) : LootDrop::checkExileDrop, étages 950 à 999, exige le Visage (336) déjà vu (idle-antlers-v1.js). */
    if (!horsLigneItopod && lf >= 950 && lf <= 999) exileItopodV1(state.adventure, lf, n);
    /* Dernier indice de la Bête (183) : LootDrop::checkITOPODSecret (étage 100, départ 0, premier kill de l'étage, joueur nu depuis le début de la visite ; idle-bete-secret-v1.js). */
    if (!horsLigneItopod && state.adventure && state.adventure.unlockFlags && state.adventure.unlockFlags.clue3Complete) beteItopodV1(state.adventure, d, lf, n, killsAvantBete);
    /* Hors ligne (Character::adventureOfflineProgress du jeu, lu le 2026-11-16) : AUCUN objet de boost, ni tirage ; avec « Filter Boosts into Infinity Cube! » le jeu ajoute directement à la puissance et à la robustesse du cube capAttack[boost du palier] x kills / 8 x bonus des boosts / (diviseur x 2) (idleAdventureCubeDirectV1) ; sans le filtre, rien. */
    if (horsLigneItopod) {
      const envCube = inventoryAutoEnvV1(state);
      if (envCube.filterBoostsIntoCube) idleAdventureCubeDirectV1(state.adventure, towerBoostStrengthV1(tier), n, envCube.boostCtx());
    } else {
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
    }
    if (horsLigneItopod) {
      /* Hors ligne (adventureOfflineProgress IL_1db2 à IL_1dd2) : AP = kills / killsPerAP et EXP = (kills / killsPerEXP) x itopodEXPAwarded, divisions ENTIÈRES, sans report de reste ; l'AP hors ligne n'a aucun bonus (curArbitraryPoints += AP). */
      const lots = Math.floor(n / towerKillsPerRewardV1(tier));
      state.currencies.experience += lots * towerExpForTierV1(tier) * expMultiplier;
      state.currencies.ap += lots;
      return;
    }
    /* En ligne le jeu donne l'AP / l'EXP quand enemiesKilled % killsPerAP == 0 (LootDrop::itopodDrop) : même taux, compté ici en fraction reportée (équivalent à long terme). */
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
  /* n kills à l'étage `floor` dont `nbFin` sont des 10es kills (butin à l'étage `floorFin`). */
  const applyKills = (n, floor, nbFin = 0, floorFin = floor) => {
    if (!(n > 0)) return;
    ppPart(n, floor);
    lootPart(n - nbFin, floor, d.killsOnFloor);
    lootPart(nbFin, floorFin, -1);
    d.kills += n;
  };
  const reachFloor = (floor) => {
    if (floor <= d.highestFloor) return;
    for (let g = d.highestFloor + 1; g <= floor; g++) state.currencies.pp += towerMilestonePpV1(g);
    d.highestFloor = floor;
  };
  const verserPp = () => {
    const pp = Math.floor(d.ppProgress / 1e6);
    if (pp > 0) {
      d.ppProgress -= pp * 1e6;
      state.currencies.pp += pp;
      /* ITOPOD.lifetimePoints du jeu (« Total Earned PP ») : incrémenté par addProgress seulement, pas par awardHighestLevelPP. */
      d.lifetimePp = Math.max(0, num(d.lifetimePp, 0)) + pp;
    }
  };

  if (horsLigneItopod) {
    /* Hors ligne (Character::adventureOfflineProgress, IL_1c9c à IL_1db2 ; audit IL 2026-11-22) : le jeu ne modifie NI itopodLevel NI itopodKillCount (ni ici d.floor, d.killsOnFloor, tower.level) ; il joue UN SEUL étage, calculateBestItopodLevel,
       et exige qu'il soit > 0. Kills = secondes / (intervalle + réapparition) (Mathf.FloorToInt), le reste est perdu. Il n'ajoute que enemiesKilled, PP, EXP, AP, cube, pilule (jamais d'étage nouveau, donc jamais de PP de première atteinte). */
    const best = d.optimalFloor;
    if (best <= 0) return;
    const kills = Math.floor(seconds / (interval + respawn));
    applyKills(kills, best, 0, best);
    verserPp();
    return;
  }

  /* Lazy ITOPOD Floor Shifter acheté ET activé (Arbitrary.lazyITOPODOn, interrupteur indépendant) : après chaque kill, setOptimalFloor puis changeZone(1000) (niveau = départ, compteur = 0). */
  const shifter = Boolean(state.selloutShop?.purchases?.lazyItopodFloorShifter) && d.shifterOn === true;
  if (shifter) towerShifterActiverV1(state, d);
  const start = d.startFloor;
  const end = d.endFloor;

  let time = seconds + d.killTime;
  let guard = 0;
  /* Les ennemis de l'ITOPOD attaquent (idle-itopod-combat-v1.js, lu dans le jeu le 2026-11-16) : en ligne (synchro courte), si un étage du parcours demande 1,8 s de coups ou plus (premier coup de l'ennemi), chaque kill est simulé avec les PV du joueur ; sinon (un coup tue avant le premier coup de l'ennemi) le calcul par lots ci-dessous est exact. */
  const etageLePlusHaut = Math.max(end, d.floor);
  const combatNecessaire = !shifter && hpMax > 0 && interval * towerHitsV1(power, idleBonus, etageLePlusHaut, interval) >= TOWER_FIRST_STRIKE_SECONDS_V1;
  if (combatNecessaire) {
    if (!Number.isFinite(d.hp)) d.hp = hpMax;
    d.hp = clamp(d.hp, 0, hpMax);
    time = towerBoucleCombatV1({ alea: aleaV1(context), d, time, start, end, power, idleBonus, toughness: Math.max(0, num(combatStats.toughness, 0)), interval, respawn, hpMax, regenJoueur, applyKills, reachFloor });
  } else if (Number.isFinite(d.hp)) {
    /* Hors combat les PV se régénèrent seuls (jamais au-delà du maximum). */
    d.hp = clamp(d.hp + regenJoueur * seconds, 0, hpMax);
    d.fightAi = null;
  }
  while (!combatNecessaire && guard++ < 20000) {
    const tk = killTimeAt(d.floor);
    if (shifter) {
      /* Le Shifter ramène au départ et remet le compteur à 0 après CHAQUE kill : tous les kills ont lieu au même étage, aucun étage nouveau. */
      const n = Math.floor(time / tk);
      if (n <= 0) break;
      time -= n * tk;
      applyKills(n, d.floor);
      d.killsOnFloor = 0;
      break;
    }
    if (d.floor === start && start === end) {
      /* Un seul étage : les 10es kills retombent sur le même étage (départ = fin). */
      const n = Math.floor(time / tk);
      if (n <= 0) break;
      time -= n * tk;
      applyKills(n, d.floor);
      d.killsOnFloor = (d.killsOnFloor + n) % 10;
      break;
    }
    if (d.killsOnFloor === 0 && d.floor === start && d.highestFloor >= end) {
      let cycle = 0;
      for (let f = start; f <= end; f++) cycle += 10 * killTimeAt(f);
      const cycles = Math.floor(time / cycle);
      if (cycles >= 1) {
        time -= cycles * cycle;
        for (let f = start; f <= end; f++) applyKills(10 * cycles, f, cycles, towerEtageSuivantV1(d, f));
        continue;
      }
    }
    const need = 10 - d.killsOnFloor;
    const n = Math.min(need, Math.floor(time / tk));
    if (n <= 0) break;
    time -= n * tk;
    const termine = n === need;
    const suivant = termine ? towerEtageSuivantV1(d, d.floor) : d.floor;
    applyKills(n, d.floor, termine ? 1 : 0, suivant);
    d.killsOnFloor += n;
    if (termine) {
      d.killsOnFloor = 0;
      d.floor = suivant;
      reachFloor(d.floor);
    }
  }
  d.killTime = combatNecessaire ? Math.min(time, TOWER_COMBAT_MAX_KILLTIME_V1) : Math.min(time, killTimeAt(d.floor));
  verserPp();
  tower.level = d.floor;
}

/* Combat simulé seulement en ligne (synchro de moins de 5 minutes, même seuil que le farm hors ligne) ; premier coup de l'ennemi = 1,5 x 1,2 s (EnemyAI::Update). */
const TOWER_COMBAT_MAX_SECONDS_V1 = 5 * 60;
const TOWER_FIRST_STRIKE_SECONDS_V1 = 1.8;
/* Temps de cycle conservé entre deux synchros quand le joueur ne peut plus tuer ni mourir : borné pour garder la simulation courte. */
const TOWER_COMBAT_MAX_KILLTIME_V1 = 5 * 60;

/*
 * Boucle de combat de l'ITOPOD en ligne : un cycle (réapparition + combat) à la fois, avec les PV du joueur (d.hp) et l'IA tirée de l'ennemi (d.fightAi, gardée jusqu'à la fin du cycle).
 * Un kill compte comme dans le calcul par lots ; la mort du joueur le renvoie à l'étage de DÉPART (jamais 0 si le départ est différent ; le compteur de 10 kills n'est pas remis à zéro) et vide ses PV (playerDeath du jeu). Renvoie le temps restant.
 */
function towerBoucleCombatV1(c) {
  const { d } = c;
  let time = c.time;
  for (let garde = 0; garde < 5000; garde++) {
    if (!Number.isInteger(d.fightAi)) d.fightAi = itopodDrawAiV1(c.alea());
    const r = itopodCycleV1({ floor: d.floor, ai: d.fightAi, power: c.power, toughness: c.toughness, idleMult: c.idleBonus, interval: c.interval, hp: d.hp, hpMax: c.hpMax, regen: c.regenJoueur, respawn: c.respawn, tMax: time });
    if (!r.complete) break;
    time -= r.t;
    d.hp = r.hp;
    d.fightAi = null;
    if (r.outcome === "death") {
      d.deaths = Math.max(0, int(d.deaths, 0)) + 1;
      d.floor = d.startFloor;   /* AdventureController::playerDeath (IL_0051 à IL_0056) : itopodLevel = itopodStart */
      continue;
    }
    const termine = d.killsOnFloor + 1 >= 10;
    const suivant = termine ? towerEtageSuivantV1(d, d.floor) : d.floor;
    c.applyKills(1, d.floor, termine ? 1 : 0, suivant);
    d.killsOnFloor += 1;
    if (termine) {
      d.killsOnFloor = 0;
      d.floor = suivant;
      c.reachFloor(d.floor);
    }
  }
  return time;
}

/*
 * AdventureController::verifyItopodInputs (IL, audit 2026-11-22) : départ = borné à [0 ; « plus haut atteint - 1 » ; 1600] ; fin = au moins le départ, au moins 1, au plus 1600. Ne modifie QUE itopodStart / itopodEnd : le niveau courant et le compteur de kills
 * ne changent qu'à l'entrée dans la zone (changeZone), à la mort et au Lazy Shifter ; un niveau hors de [départ ; fin] continue jusqu'à la fin de ses 10 kills puis repart au départ (alignement 2026-11-22, renverse la décision du 2026-10-15).
 */
function towerVerifierEntreesV1(d, startBrut, endBrut) {
  const plusHaut = Math.max(0, int(d.highestFloor, 0)) - 1;
  let s = int(startBrut, 0);
  if (s > plusHaut) s = plusHaut;
  if (s < 0) s = 0;
  if (s > TOWER_MAX_FLOOR_V1) s = TOWER_MAX_FLOOR_V1;
  let e = int(endBrut, 0);
  if (e <= s) e = s;
  if (e < 1) e = 1;
  if (e > TOWER_MAX_FLOOR_V1) e = TOWER_MAX_FLOOR_V1;
  d.startFloor = s;
  d.endFloor = e;
}

/*
 * AdventureController::setOptimalFloor (IL, audit 2026-11-22 ; le Lazy ITOPOD Floor Shifter appelle la même, activateLazyItopod) : étage = calculateBestItopodLevel (d.optimalFloor), plafonné à « plus haut atteint - 1 » ; le jeu écrit cette MÊME valeur dans
 * départ ET fin puis verifyItopodInputs : un étage optimal de 0 (ou « plus haut - 1 » <= 0) donne départ 0 et fin 1. Le jeu ne monte donc JAMAIS tout seul vers un nouvel étage. Renvoie toujours vrai (l'ancien repli « mode auto null » n'existe plus).
 */
function towerAppliquerEtageOptimalV1(d, optimal) {
  const plusHaut = Math.max(0, int(d.highestFloor, 0));
  let opt = int(optimal, 0);
  if (opt > plusHaut - 1) opt = plusHaut - 1;
  towerVerifierEntreesV1(d, opt, opt);
  return true;
}

/* ZoneSelector::changeZone(1000) (IL) : niveau = départ, compteur de kills = 0, combat arrêté ; début d'une visite de l'ITOPOD : éligible au dernier indice de la Bête si l'indice 3 est fait. */
function towerChangerZoneV1(state, d) {
  d.floor = d.startFloor;
  d.killsOnFloor = 0;
  d.fightAi = null;
  delete d.beteElig;
  beteDebutVisiteV1(state.adventure, d);
}

/* AdventureController::activateLazyItopod (IL) : setOptimalFloor puis changeZone(1000). */
function towerShifterActiverV1(state, d) {
  const avant = d.floor;
  towerAppliquerEtageOptimalV1(d, d.optimalFloor);
  towerChangerZoneV1(state, d);
  /* Pour la ligne de journal « The ITOPOD Floor Shifter changed your current floor from X to Y. » : étage d'avant le changement (scène). */
  if (avant !== d.floor) d.shifterDe = avant;
}

/*
 * Entrée dans la zone ITOPOD (action `toggle` du système « tower » qui l'active) : ZoneSelector::changeZone(1000) ; le joueur quitte la zone d'Aventure (une seule zone à la fois dans le jeu : selectedZone = Zone sûre, plus de combat en cours).
 * Choisir une zone d'Aventure fait l'inverse (idle-ngu-actions.js : tower.active = faux).
 */
export function towerEntrerV1(state) {
  const tower = state.systems.tower;
  const d = tower.data;
  towerNormaliserV1(state, d);
  towerChangerZoneV1(state, d);
  tower.level = d.floor;
  const adv = state.adventure;
  if (adv && typeof adv === "object") {
    adv.selectedZone = "safe";
    adv.fight = { active: false, zone: "", monsterHp: 0, monsterHpMax: 0, boss: false, playerHp: 0, playerHpMax: 0 };
  }
}

/* Rebirth : la zone repasse à Zone sûre (la Tour est quittée) et itopodLevel retombe au départ ; PV, combat en cours et compteur de kills remis à zéro. Gardés : plus haut étage, Perks, PP, départ et fin. */
export function towerRebirthResetV1(state) {
  const tower = state.systems.tower;
  if (!tower) return;
  if (!tower.data || typeof tower.data !== "object") tower.data = {};
  const d = tower.data;
  towerNormaliserV1(state, d);
  tower.active = false;
  d.floor = d.startFloor;
  d.killsOnFloor = 0;
  d.killTime = 0;
  d.fightAi = null;
  delete d.hp;
  delete d.beteElig;
  tower.level = d.floor;
}

/*
 * Adventure Advancer (Boutique AP, 65 000 AP ; Norman, 2026-10-12) : « Advances you to the furthest normal zone you can reach at the 20s mark of a rebirth. » (wiki NGU Idle, 4G's Sellout Shop). Une seule fois par run : dès que
 * le run a 20 s, si le joueur est encore en Zone sûre (aucun combat en cours), il passe sur la zone normale la plus avancée ouverte ; s'il a déjà choisi une zone ou combat, rien n'est touché.
 */
function advanceAdventureAdvancerV1(state, context, now) {
  if (!state.selloutShop?.purchases?.adventureAdvancer) return;
  const adv = state.adventure;
  if (!adv || typeof adv !== "object") return;
  const run = Math.max(0, num(state.runStartedAt, 0));
  if (adv.advancerRun === run) return;
  if ((now - run) / 1000 < 20) return;
  adv.advancerRun = run;
  /* lu dans le jeu, build 1260, 2026-11-17 : AdventureController::Update ne saute que si rebirthTime est entre 20 s et 30 s (une seule fois par Rebirth, didAdvAdvance) ; passé 30 s, la fenêtre est perdue. */
  if ((now - run) / 1000 > 30) return;
  if (adv.fight && adv.fight.active) return;
  if (String(adv.selectedZone || "safe") !== "safe") return;
  const zone = zoneNormalePlusAvanceeV1(num(context.bosses, 0), state.difficulty, state.difficultyPeaks);
  if (zone && zone !== "safe") adv.selectedZone = zone;
}

/*
 * Resource 3 Name Randomizer (Boutique AP, 100 000 AP ; Norman, 2026-10-12) : « Unlocks a setting which will randomize the name of your Resource 3 every time you rebirth. It'll pick from a pool of over 200 names! » (wiki NGU
 * Idle, 4G's Sellout Shop ; la liste complète est sur la page « Resource 3 Name Randomizer », reprise dans idle-r3-names-v1.js). Réglage à cocher ; un nouveau nom est tiré à chaque nouveau run.
 */
export function normaliserR3NomV1(raw) {
  const r = raw && typeof raw === "object" ? raw : {};
  const nom = String(r.nom == null ? "" : r.nom).slice(0, 40);
  return { actif: r.actif === true, nom: IDLE_R3_NOMS_V1.includes(nom) ? nom : "", run: Math.max(0, num(r.run, 0)) };
}

function tirerR3NomV1(precedent) {
  const choix = IDLE_R3_NOMS_V1.filter((n) => n !== precedent);
  return choix[Math.floor(Math.random() * choix.length)] || IDLE_R3_NOMS_V1[0];
}

function advanceR3NomV1(state) {
  const r = state.r3Nom;
  if (!r || !r.actif || !state.selloutShop?.purchases?.resource3NameRandomizer) return;
  const run = Math.max(0, num(state.runStartedAt, 0));
  if (r.nom && r.run === run) return;
  r.nom = tirerR3NomV1(r.nom);
  r.run = run;
}

export function setR3NomAleatoireV1(state, payload) {
  if (!state.selloutShop?.purchases?.resource3NameRandomizer) throw new Error("ACHAT_REQUIS");
  const r = state.r3Nom;
  r.actif = payload?.enabled === true;
  if (!r.actif) { r.nom = ""; r.run = 0; } else advanceR3NomV1(state);
  return { actif: r.actif, nom: r.nom };
}

/* Bascule « Little Blue Pill » (lu dans le jeu, build 1260, 2026-11-17 : AdventureController::togglePill inverse PlayerSettings.buffedKillsOn). Réservé à qui possède déjà des pilules ou a le réglage actif (règle n°2). */
export function towerTogglePillV1(state) {
  const tower = state.systems.tower;
  if (!tower || !tower.unlocked) throw new Error("SYSTEME_VERROUILLE");
  const fx = state.selloutEffects && typeof state.selloutEffects === "object" ? state.selloutEffects : (state.selloutEffects = { remaining: {}, beta: {}, bluePills: 0 });
  if (fx.buffedKillsOn !== true && !(int(fx.bluePills, 0) > 0)) throw new Error("AUCUNE_PILULE");
  if (fx.buffedKillsOn === true) delete fx.buffedKillsOn; else fx.buffedKillsOn = true;
  return { buffedKillsOn: fx.buffedKillsOn === true, pilules: Math.max(0, int(fx.bluePills, 0)) };
}

/*
 * Boutons des étages de la Tour (alignement 2026-11-22, audit de la Tour). Aucun de ces boutons ne déplace le joueur : le jeu (verifyItopodInputs) ne modifie QUE itopodStart / itopodEnd ; d.floor et le compteur ne changent
 * qu'à l'entrée dans la zone, à la mort et au Lazy Shifter. Si le niveau courant sort de [départ ; fin], il termine ses 10 kills puis repart au départ.
 *  - { start, end } : réglage manuel (verifyItopodInputs) ;
 *  - { auto: true } : bouton « Optimal » = setOptimalFloor UNE fois (l'ancien mode « suivre l'étage optimal » est le Lazy Shifter, interrupteur à part : towerSetShifterV1).
 */
export function towerSetFloorsV1(state, payload) {
  const tower = state.systems.tower;
  if (!tower.unlocked) throw new Error("SYSTEME_VERROUILLE");
  const d = tower.data;
  towerNormaliserV1(state, d);
  if (payload.auto) {
    towerAppliquerEtageOptimalV1(d, d.optimalFloor);
    return { auto: true, start: d.startFloor, end: d.endFloor };
  }
  const start = int(payload.start, 0);
  towerVerifierEntreesV1(d, start, payload.end === undefined || payload.end === null ? start : int(payload.end, start));
  return { start: d.startFloor, end: d.endFloor };
}

/* AdventureController::setMaxFloor (IL, audit 2026-11-22) : départ = max(0, « plus haut atteint - 1 »), la fin reste telle quelle puis verifyItopodInputs (fin >= départ, >= 1). */
export function towerSetMaxFloorV1(state) {
  const tower = state.systems.tower;
  if (!tower.unlocked) throw new Error("SYSTEME_VERROUILLE");
  const d = tower.data;
  towerNormaliserV1(state, d);
  towerVerifierEntreesV1(d, Math.max(0, int(d.highestFloor, 0) - 1), d.endFloor);
  return { start: d.startFloor, end: d.endFloor };
}

/* Lazy ITOPOD Floor Shifter : interrupteur INDÉPENDANT (Arbitrary.lazyITOPODOn, AdventureController::toggleShifter), possible seulement si l'amélioration est achetée (boughtLazyITOPOD). */
export function towerSetShifterV1(state, payload) {
  const tower = state.systems.tower;
  if (!tower.unlocked) throw new Error("SYSTEME_VERROUILLE");
  if (!state.selloutShop?.purchases?.lazyItopodFloorShifter) throw new Error("ACHAT_REQUIS");
  const d = tower.data;
  towerNormaliserV1(state, d);
  d.shifterOn = payload && payload.enabled !== undefined ? payload.enabled === true : !d.shifterOn;
  d.autoOptimal = d.shifterOn;
  return { shifterOn: d.shifterOn };
}

/* Idle Mode (bouton du jeu, Adventure.autoattacking) : l'attaque automatique de la Tour et la régénération x1,2 ne fonctionnent que s'il est actif. Vrai par défaut dans SOREAL (parties existantes). */
export function towerSetIdleModeV1(state, payload) {
  const tower = state.systems.tower;
  if (!tower.unlocked) throw new Error("SYSTEME_VERROUILLE");
  const d = tower.data;
  towerNormaliserV1(state, d);
  d.idleMode = payload && payload.enabled !== undefined ? payload.enabled === true : !d.idleMode;
  return { idleMode: d.idleMode };
}

function advanceLateSystems(state, seconds, context, now) {
  /*
   * Auto-Kill des Titans (Norman, 2026-09-27, correctif 1/4 de docs/HORS-LIGNE.md) : mêmes stats de combat que
   * l'ITOPOD ci-dessous (idleAdventureCombatStatsV1), mêmes bonus de récompense/cooldown que le combat manuel
   * (titanFight, plus haut dans ce fichier) -- reconstruits ici pour que l'avancement automatique (en ligne comme
   * hors ligne, puisque cette fonction est appelée à chaque syncIdleNguState) donne EXACTEMENT les mêmes
   * récompenses qu'un kill manuel, à l'exception du butin (jamais accordé par Auto-Kill, cf. le commentaire
   * d'advanceTitanAutoKillV1).
   */
  const gearAventure = idleEquipementEffectifLectureV1(state);   /* lecture seule */
  const combatAventure = idleAdventureCombatStatsV1(gearAventure, context, idleNguBonusesLectureV1(state));
  {
    const titanChallengeBonuses = challengePermanentBonuses(state);
    /* Butin de l'auto-kill EN LIGNE : filtre de butin, cube, transformation automatique (Norman, 2026-11-06 : « je les loote quand même toutes les heures quand je tue auto GRB » : ce butin allait directement dans le sac, sans filtre). */
    const idsAvantTitansAuto = idleInventoryIdsV1(state.adventure);
    span("tardif:titans", () => advanceTitanAutoKillV1(state.adventure, Object.assign({}, context, {
      /* Synchro courte = joueur connecté : l'Auto-Kill donne alors le butin ; au-delà (rattrapage hors ligne) seulement EXP, Or, AP, PP, QP, comme le wiki. Même seuil que le farm hors ligne. */
      enLigne: seconds < 5 * 60,
      dropMultiplier: Math.max(0, num(idleNguBonusesLectureV1(state).dropMultiplier, 1)),
      dropMultiplierIncludesGear: true,
      titanLootLevelBonus: titanChallengeBonuses.titanLootLevelBonus,
      stats: { power: combatAventure.power, toughness: combatAventure.toughness, regen: combatAventure.regen },
      wishLevels: wishLevelsMapV1(state),
      questRewardFactor: questRewardFactorTitansV1(state, context),
      questButterFactor: questButterFactorTitansV1(state),
      titanExpBonusKills: perkBonusesV1(idlePerkNiveauxV1(state)).titanExpBonusKills,
      titanExpChallengePct: challengePermanentBonuses(state).bossExpPct,
      goldMultiplier: Math.max(0, num(idleNguBonusesLectureV1(state).adventureGoldMultiplier, 1)),
      titanCooldownReductionMs: titanChallengeBonuses.titanRespawnReductionMs,
      titanCooldownReductionEvilMs: titanChallengeBonuses.titanRespawnReductionEvilMs,
      titanCooldownReductionSadisticMs: titanChallengeBonuses.titanRespawnReductionSadisticMs
    }), seconds, now));
    idleInventoryProcessNewDropsV1(state.adventure, idsAvantTitansAuto, inventoryAutoEnvV1(state));
  }

  /*
   * Farm automatique de zone d'Aventure hors ligne (advanceAdventureZoneAutoFarmOfflineV1,
   * idle-adventure-v47.js) : mêmes stats de combat réelles que l'Auto-Kill Titan ci-dessus et le
   * combat manuel (Power/Toughness/HP/Regen/specials, idleAdventureCombatStatsV1), même filtrage
   * auto-inventaire que les kills en ligne (idleInventoryProcessNewDropsV1) appliqué sur le lot
   * entier de drops accumulés pendant l'absence.
   *
   * Garde des 5 minutes (SEUIL_FARM_OFFLINE_SEC) : cette fonction est appelée à CHAQUE sync, y
   * compris pendant une partie EN LIGNE (poll régulier, ~15s -- syncSecondes). Le combat de zone réel
   * est déjà simulé par le CLIENT en direct (startZoneFight/resolveZoneFight, cf. le commentaire de
   * resolveZoneFight dans idle-adventure-v47.js) : sans ce seuil, ce simulateur tournerait EN PLUS,
   * en parallèle, à chaque sync online -- doublant butin/or/exp pendant toute partie active. Le
   * déclenchement reste bien automatique dès qu'une zone est sélectionnée (Norman : « Dès qu'une zone
   * est sélectionnée, l'auto combat est toujours actif »), seulement après un écart réel depuis le
   * dernier sync, jamais pendant.
   */
  const SEUIL_FARM_OFFLINE_SEC = 5 * 60;
  if (seconds >= SEUIL_FARM_OFFLINE_SEC) {
    const idsAvantFarm = idleInventoryIdsV1(state.adventure);
    const resumeFarm = span("tardif:farmHorsLigne", () => advanceAdventureZoneAutoFarmOfflineV1(state.adventure, Object.assign({}, context, {
      stats: {
        power: combatAventure.power,
        toughness: combatAventure.toughness,
        hp: combatAventure.hp,
        regen: combatAventure.regen,
        specials: combatAventure.specials
      },
      dropMultiplier: Math.max(0, num(idleNguBonusesLectureV1(state).dropMultiplier, 1)),
      dropMultiplierIncludesGear: true,
      goldMultiplier: Math.max(0, num(idleNguBonusesLectureV1(state).adventureGoldMultiplier, 1)),
      respawnReduction: Math.max(0, Math.min(1, num(idleNguBonusesLectureV1(state).respawnReduction, 0)))
    }), seconds, now));
    idleInventoryProcessNewDropsV1(state.adventure, idsAvantFarm, inventoryAutoEnvV1(state));
    /*
     * Résumé de CE seul sync (jamais persisté) : lu et retiré par idle-sqlite-runtime.js
     * (construireEtatJoueurSorealIdle_, autoFarmAventureEtat) avant l'écriture de STATS_JSON, pour
     * alimenter j.autoAventureHorsLigne côté client (verifierDefaiteAutoAventureIdleV1_).
     */
    if (resumeFarm && (resumeFarm.kills > 0 || resumeFarm.derniereDefaite)) {
      state.adventure.lastAutoFarmSummaryV1 = resumeFarm;
    }
  }

  const killsItopodAvant = Math.max(0, int(state.systems.tower?.data?.kills, 0));
  span("tardif:itopod", () => advanceTowerV1(state, seconds, context));
  /* MacGuffin ITOPOD Drops (perk 68) : les kills de ce tick alimentent le compteur MacGuffin. */
  const horsLigneTour = seconds >= TOWER_COMBAT_MAX_SECONDS_V1;
  macguffinOnItopodKillsV1(state, Math.max(0, int(state.systems.tower?.data?.kills, 0)) - killsItopodAvant, Math.random, { horsLigne: horsLigneTour });
  /* Perk 30 « What a Crappy Perk » : Poop de l'ITOPOD (1 tous les 9 000 kills + 0,01 % par kill). */
  idleYggItopodPoopV1(state, Math.max(0, int(state.systems.tower?.data?.kills, 0)) - killsItopodAvant, Math.random, { horsLigne: horsLigneTour });

  /* Cards et Mayo : vrai système (idle-cards-v1.js), remplace les cartes factices horaires. */
  span("tardif:cartes", () => advanceIdleCardsV1(state, seconds));
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
const IDLE_CHALLENGE_OFFLINE_DISABLED_IDS = DEFIS_SANS_HORS_LIGNE_IDS_V1;

/*
 * Troll Challenge (page Challenges, section « Trolls », relue le 2026-09-30) : « Every so often I'm gonna mess with you
 * in some way. » Délai entre deux trolls selon la complétion en cours (« trolls every 120 seconds » à 75 s : 120, 110,
 * 100, 90, 85, 80, 75). « Every fifth troll is a big troll ». Le chrono compte le temps de jeu actif (hors ligne
 * désactivé). Les petits trolls sont instantanés ; les gros restent actifs « until rebirth » (drapeaux state.challenge.troll.flags).
 * Les trolls purement visuels (message boxes, dessin du chaton, navigation aléatoire à 75 %) sont joués par le client
 * d'après le troll renvoyé dans state.challenge.troll.last.
 */
export const IDLE_TROLL_INTERVALS_S_V1 = Object.freeze([120, 110, 100, 90, 85, 80, 75]);

const IDLE_TROLL_HIST_V1 = 3;

const IDLE_TROLL_SMALL_V1 =Object.freeze(["augments", "blood", "timeMachine", "gold", "boxes", "energy", "magic", "wandoos", "kitty"]);

const IDLE_TROLL_BIG_V1 = Object.freeze(["ngu", "beards", "menu", "ruin", "wandoosOff", "bossDivider"]);

/* « All small trolls except kitty and boxes » (gros troll « I basically ruined everything just now »). */
const IDLE_TROLL_RUIN_V1 = Object.freeze(["augments", "blood", "timeMachine", "gold", "energy", "magic", "wandoos"]);

/*
 * Anti-spoil (règle n°2 ; Norman, 2026-11-02 : « un troll pour les barbes alors que je ne les ai pas encore ») : un troll ne tombe que sur un système que le joueur POSSÈDE déjà (son message, son nom et son effet ne révèlent jamais un système verrouillé).
 * Trolls sans système (or, énergie, boîtes, chaton, menus, multiplicateur de boss, « tout ruiner ») : toujours possibles.
 */
const IDLE_TROLL_SYSTEME_V1 = Object.freeze({ augments: "augmentations", blood: "bloodMagic", magic: "bloodMagic", timeMachine: "timeMachine", wandoos: "wandoos", wandoosOff: "wandoos", ngu: "ngu", beards: "beards" });
export function trollPossibleV1(state, id) {
  const sys = IDLE_TROLL_SYSTEME_V1[id];
  return !sys || Boolean(state.systems?.[sys]?.unlocked);
}

export function createTrollStateV1(raw) {
  const f = raw?.flags || {};
  const last = raw?.last && typeof raw.last === "object" ? raw.last : null;
  return {
    timer: Math.max(0, num(raw?.timer, 0)),
    count: Math.max(0, int(raw?.count, 0)),
    flags: { ngu: Boolean(f.ngu), beards: Boolean(f.beards), wandoos: Boolean(f.wandoos), menu: Boolean(f.menu), bossDivider: Boolean(f.bossDivider) },
    last: last ? { id: String(last.id || ""), big: Boolean(last.big), seq: Math.max(0, int(last.seq, 0)) } : null,
    /* Les trolls déjà tombés en dernier (récents en fin de liste) : un troll ne retombe pas tout de suite (voir fireTrollV1). */
    hist: Array.isArray(raw?.hist) ? raw.hist.map((x) => String(x)).slice(-IDLE_TROLL_HIST_V1) : []
  };
}

export function trollFlagsV1(state) {
  return state?.challenge?.active === "troll" ? (state.challenge.troll?.flags || {}) : {};
}

function trollIntervalSecondsV1(state) {
  const done = Math.max(0, int(challengeCompletionsV1(state, challengeTierV1(state))?.troll, 0));
  return IDLE_TROLL_INTERVALS_S_V1[Math.min(IDLE_TROLL_INTERVALS_S_V1.length - 1, done)];
}

function clearActiveDiggersV1(state) {
  const d = state.systems.diggers?.data?.diggers;
  if (d) for (const x of Object.values(d)) x.active = false;
}

export function applyTrollEffectV1(state, id) {
  if (id === "augments") {
    for (const pair of Object.values(state.systems.augmentations?.data?.pairs || {})) {
      pair.level = Math.floor(Math.max(0, num(pair.level, 0)) / 2);
      pair.upgradeLevel = Math.floor(Math.max(0, num(pair.upgradeLevel, 0)) / 2);
    }
  } else if (id === "blood") {
    state.currencies.blood = 0;
    bloodCollecteRemiseAZeroV1(state);
    const sp = state.systems.bloodMagic?.data?.spells;
    if (sp) sp.numberBoost = 1;
  } else if (id === "timeMachine") {
    const tm = state.systems.timeMachine?.data;
    if (tm) { tm.speedLevel = 0; tm.speedProgress = 0; tm.goldLevel = 0; tm.goldProgress = 0; }
    clearActiveDiggersV1(state);
  } else if (id === "gold") {
    state.currencies.gold = 0;
  } else if (id === "energy" || id === "magic") {
    /* « Removes all energy / magic » : TOUT, y compris ce qui est déjà alloué (Norman, 2026-11-02 : « il retire aussi les ressources déjà allouées, comme quand on appuie sur R ») : les allocations sont d'abord reprises (même calcul que la touche R), puis la réserve est vidée. */
    try { reclaimAllocatedResource(state, id); } catch (_e) { /* magie pas encore débloquée : rien d'alloué */ }
    const r = state.resources[id];
    if (r) { r.current = 0; r.fillProgress = 0; }
  } else if (id === "wandoos") {
    const w = state.systems.wandoos?.data;
    /* Troll « wipeWandoos » (méthode 2089) : les NIVEAUX seulement (la progression des barres reste), jamais l'installation (installSeconds). */
    if (w) { w.dumpEnergyLevel = 0; w.dumpMagicLevel = 0; }
  }
}

function fireTrollV1(state) {
  const t = state.challenge.troll;
  t.count += 1;
  const big = t.count % 5 === 0;
  const complet = big ? IDLE_TROLL_BIG_V1 : IDLE_TROLL_SMALL_V1;
  const possibles = complet.filter((x) => trollPossibleV1(state, x));
  /* Alternance (Norman, 2026-11-02 : « il me faut non stop le troll de me prendre mon énergie ; il doit y avoir une limite, ça empêche d'avancer ; il doit alterner ») : un troll qui vient de tomber ne retombe pas pendant les
     IDLE_TROLL_HIST_V1 tirages suivants ; s'il n'en reste aucun (peu de systèmes possédés), on évite au moins le dernier. */
  const base = possibles.length ? possibles : complet;
  const recents = big ? [] : (t.hist || []).slice(-IDLE_TROLL_HIST_V1);   /* l'historique ne suit que les petits trolls (le gros, un tirage sur cinq, a sa propre réserve) */
  let pool = base.filter((x) => !recents.includes(x));
  if (!pool.length) pool = base.filter((x) => x !== recents[recents.length - 1]);
  if (!pool.length) pool = base;
  const id = pool[Math.min(pool.length - 1, Math.floor(Math.random() * pool.length))];
  if (!big) t.hist = [...recents, id].slice(-IDLE_TROLL_HIST_V1);
  if (id === "ngu") { t.flags.ngu = true; clearActiveDiggersV1(state); }
  else if (id === "beards") { t.flags.beards = true; clearActiveDiggersV1(state); }
  else if (id === "menu") t.flags.menu = true;
  else if (id === "wandoosOff") t.flags.wandoos = true;
  else if (id === "bossDivider") t.flags.bossDivider = true;
  else if (id === "ruin") for (const sub of IDLE_TROLL_RUIN_V1) applyTrollEffectV1(state, sub);
  else applyTrollEffectV1(state, id);
  t.last = { id, big, seq: (t.last?.seq || 0) + 1 };
}

/* Diviseur du multiplicateur de boss du prochain NUMBER : « divides boss multiplier for NUMBER by 2 + Troll Challenge completions ». */
export function trollBossDividerV1(state) {
  if (!trollFlagsV1(state).bossDivider) return 1;
  return 2 + Math.max(0, int(challengeCompletionsV1(state, challengeTierV1(state))?.troll, 0));
}

function advanceTrollChallengeV1(state, seconds) {
  if (state.challenge?.active !== "troll" || !(seconds > 0)) return;
  if (!state.challenge.troll) state.challenge.troll = createTrollStateV1();
  const t = state.challenge.troll;
  t.timer += seconds;
  const interval = trollIntervalSecondsV1(state);
  let garde = 0;
  while (t.timer >= interval && garde++ < 20) {
    t.timer -= interval;
    fireTrollV1(state);
  }
}

/* Gros troll « I just broke your NGU's » : aucun bonus NGU jusqu'au prochain Rebirth. */
export function trollNguOffV1(state) { return Boolean(trollFlagsV1(state).ngu); }

/*
 * Passes qui ne dépendent QUE du temps écoulé (secs) : avec secs = 0 elles n'ajoutent rien. Une opération du moteur appelle advanceIdleNguState plusieurs fois (progression, état, snapshot, trajectoire) ; depuis que l'horloge est
 * figée pendant une opération (runSorealIdleOperation), les appels suivants ont secs = 0 : on ne refait plus 5 ms de calculs inutiles à chaque fois. Le mode SOREAL_IDLE_VERIF_TEMPS_NUL=1 exécute quand même les passes sur une
 * copie et vérifie que l'état est strictement identique (toute la suite de tests y passe avant chaque livraison).
 */
function passesDuTempsSeulV1(state, secs, context, now) {
  /*
   * Lu dans le jeu (audit hors ligne 2026-11-16, E1) : pour une absence longue, l'Or de la Time Machine (niveaux d'AVANT l'absence) est crédité en TÊTE, puis l'Or est dépensé dans l'ordre
   * Augmentations, Blood Magic, Time Machine. En ligne (fenêtres courtes) l'ordre historique est conservé.
   */
  /* Absence longue (même seuil de 5 minutes que le reste du hors ligne) : barbes (secondes barre pleine), Entraînement avancé (cible) et hack final (demi-vitesse) suivent le jeu. */
  const horsLigne = secs >= 5 * 60;
  const tempsPleinBarbes = horsLigne ? barbesTempsPleinV1(state, secs) : null;   /* mesuré AVANT la production de l'absence */
  const tmActive = num(context.bosses, 0) >= 30;
  const orEnTete = tmActive && tmAbsenceHorsLigneV1(secs) && state.systems.timeMachine.unlocked;
  if (orEnTete) span("avance:orHorsLigne", () => crediterOrHorsLigneV1(state, secs));
  span("avance:ressources", () => advanceGeneratedResources(state, secs, context));
  span("avance:augmentations", () => advanceAugmentations(state, secs, context));
  span("avance:entrainementAvance", () => advanceTrackSystem(state, IDLE_NGU_SYSTEMS.find(x => x.id === "advancedTraining"), secs, horsLigne ? {} : null));
  if (orEnTete) {
    if (num(context.bosses, 0) >= 37) span("avance:bloodMagic", () => advanceBloodMagic(state, secs, context));
    span("avance:machineTemporelle", () => advanceTimeMachine(state, secs, true));
  } else {
    if (tmActive) span("avance:machineTemporelle", () => advanceTimeMachine(state, secs));
    if (num(context.bosses, 0) >= 37) span("avance:bloodMagic", () => advanceBloodMagic(state, secs, context));
  }
  span("avance:sortsAuto", () => avancerSortsAutoV1(state, secs, context));
  span("avance:yggdrasil", () => advanceYggdrasil(state, secs, nowMs(now)));
  span("avance:wandoos", () => advanceWandoos(state, secs, context, now));
  span("avance:ngus", () => advanceNgusV1(state, secs));
  span("avance:barbes", () => advanceTrackSystem(state, IDLE_NGU_SYSTEMS.find(x => x.id === "beards"), secs, tempsPleinBarbes ? { tempsPlein: tempsPleinBarbes } : null));
  span("avance:hacks", () => advanceTrackSystem(state, IDLE_NGU_SYSTEMS.find(x => x.id === "hacks"), secs, horsLigne ? {} : null));
  /* Antennes de l'Exilé (340) : Hack Hack avec R3 = plafond - 1, toutes les 60 s (HacksController::checkExilePiece). */
  exileHackV1(state, secs, secs < 5 * 60);
  span("avance:souhaits", () => advanceTrackSystem(state, IDLE_NGU_SYSTEMS.find(x => x.id === "wishes"), secs, horsLigne ? {} : null));
}

/* dejaNormalise : l'appelant (syncIdleNguState) vient de normaliser cet état (copie privée) : le normaliser une 2e fois recopiait tout l'état pour rien (1,3 ms par appel, 4 appels par synchro). */
export function advanceIdleNguState(raw, seconds, context = {}, now = Date.now(), dejaNormalise = false) {
  const state = dejaNormalise ? raw : span("normaliser", () => normalizeIdleNguState(raw, context, now));
  const offlineCap = IDLE_CHALLENGE_OFFLINE_DISABLED_IDS.includes(state.challenge?.active)
    ? PLAFOND_HORS_LIGNE_DEFIS_SECONDES_V1
    : EARLY_GAME_MAX_OFFLINE_SECONDS;
  const secs = clamp(seconds, 0, offlineCap);
  /* 24 Hour Challenge : « Offline Progress will be disabled during this challenge. But, the timer won't run either. » -> le temps non joué est retiré du chrono. */
  if (state.challenge?.active === "twentyFourHours" && seconds > secs && state.challenge.startedAt > 0) state.challenge.startedAt += (clamp(seconds, 0, EARLY_GAME_MAX_OFFLINE_SECONDS) - secs) * 1000;
  state.records.playSeconds = num(state.records.playSeconds, 0) + secs;

  /*
   * 2026-09-24 (page Rebirths, « What do I lose when I rebirth? ») : « Access to the Adventure, Augmentation, Time
   * Machine, and Blood Magic tabs until their related bosses are beaten ». Le drapeau `unlocked` de ces systèmes
   * reste vrai après un Rebirth (les Augmentations testaient déjà le boss) : la Time Machine produisait et se
   * levelait, et Blood Magic tournait, dès le boss 1 d'un nouveau Rebirth.
   */
  if (secs > 0) {
    /* Hors ligne (même seuil de 5 minutes que le farm hors ligne) : l'effet des potions, charmes et Bar Bars n'entre pas dans la production (lu dans le jeu). */
    const horsLigneBoutique = secs >= 5 * 60 && state.selloutEffects?.remaining;
    let misDeCote = null;
    if (horsLigneBoutique) {
      misDeCote = {};
      for (const k of Object.keys(state.selloutEffects.remaining)) {
        if (IDLE_SELLOUT_MINUTEURS_HORS_LIGNE_V1.includes(k)) continue;
        misDeCote[k] = state.selloutEffects.remaining[k];
        delete state.selloutEffects.remaining[k];
      }
    }
    try { passesDuTempsSeulV1(state, secs, context, now); }
    finally { if (misDeCote) Object.assign(state.selloutEffects.remaining, misDeCote); }
  }
  else if (typeof process !== "undefined" && process.env && process.env.SOREAL_IDLE_VERIF_TEMPS_NUL === "1") {
    const avant = JSON.stringify(state);
    const copie = JSON.parse(avant);
    passesDuTempsSeulV1(copie, secs, context, now);
    if (JSON.stringify(copie) !== avant) throw new Error("SOREAL_IDLE_TEMPS_NUL_DIVERGENT");
  }
  span("avance:moneyPit+quotidien", () => advanceMoneyPitAndDaily(state, nowMs(now)));
  span("avance:cuisine", () => advanceIdleCookingV1(state, nowMs(now)));
  span("avance:systemesTardifs", () => advanceLateSystems(state, secs, context, nowMs(now)));
  span("avance:avanceurAventure", () => advanceAdventureAdvancerV1(state, context, nowMs(now)));
  span("avance:r3", () => advanceR3NomV1(state));
  /* Les trolls tombent APRÈS la production de l'intervalle (Norman, 2026-11-02 : « il dit qu'il a volé mon or mais il est toujours là ») : sinon la production du reste de l'intervalle (jusqu'à 60 s hors ligne) remplissait de nouveau l'or / l'énergie / la magie juste après le vol. */
  span("avance:troll", () => advanceTrollChallengeV1(state, secs));
  /* Item Daycare : même delta en ligne et hors ligne (plafond 30 j / 60 s sous défi hors ligne interdit). */
  if (state.systems.daycare?.data?.slots?.length) span("avance:garderie", () => advanceIdleDaycareV1(state.systems.daycare.data, secs, daycareFactorsV1(state)));
  /* Auto Merge / Auto Boost : minuteurs communs (idle-inventory-auto-v1.js), bonus calculés seulement si un minuteur tourne. */
  /* Un objet fusionné ou boosté au niveau 100 peut compléter un set : ses EXP / AP de complétion sont versés dans les monnaies (comme après une action d'Aventure), sinon ils restaient dans adventure.permanent. */
  const avantAutoInventaire = photoRecompensesAventure(state);
  /* Norman (2026-10-31) : Auto Merge et Auto Boost ne tournent PAS hors ligne (l'inventaire se remplit, c'est tout) ; ils repartent dès que le joueur se reconnecte. Même seuil de 5 minutes que le farm hors ligne ; les minuteurs restent figés pendant l'absence. */
  span("avance:inventaireAuto", () => advanceIdleInventoryAutoV1(state.adventure, seconds >= 5 * 60 ? 0 : secs, () => inventoryAutoEnvV1(state)));
  crediterRecompensesAventure(state, avantAutoInventaire);
  /* Questing (crochet 1/4) : Major Quests gagnées avec le temps + barre d'idle. */
  if (state.systems.questing?.unlocked) span("avance:quetes", () => advanceIdleQuestingV1(state, secs, questingEnvV1(state, context), nowMs(now)));

  span("avance:effetsBoutique", () => tickSelloutEffectsV1(state, secs, secs >= 5 * 60));
  span("fin:reconcilier", () => reconcileResourceCurrents(state,context));
  state.updatedAt = nowMs(now);
  span("fin:yggRapide", () => applyYggQuickActivationV1(state, now));
  span("fin:renaissance", () => state.rebirth = refreshRebirthState(state, context, nowMs(now)));
  span("fin:succes", () => idleAchievementsEvaluateV1(state, achievementMetricsV1(state), nowMs(now)));
  /* Skins de la Garderie acquis par fenêtre de dates (heure de Bruxelles) ou calendrier complet : enregistrés pour toujours (idle-daycare-skins-v1.js). */
  span("fin:skinsGarderie", () => { acquerirSkinsV1(state, nowMs(now)); acquerirPortraitsV1(state, nowMs(now)); });
  span("fin:defis", () => autoCompleteChallengeV1(state, context, nowMs(now)));
  return state;
}
