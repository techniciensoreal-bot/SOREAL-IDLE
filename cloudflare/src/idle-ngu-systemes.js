/*
 * NGU : Blood Magic, Yggdrasil, Diggers, ITOPOD, Troll et avance générale (audit d'architecture, 2026-10-16 : découpage de idle-ngu-progression.js).
 * Code extrait tel quel ; les fichiers voisins se référencent par import (les fonctions étant hissées, les imports circulaires entre ces fichiers sont sans danger :
 * aucun n'appelle les autres au chargement).
 */
import { quirkBonusesV1 } from "./idle-quirks-v1.js";
import { idleQuirkNiveauxV1, idlePerkNiveauxV1 } from "./idle-difficulty-gates-v1.js";
import { macguffinEffectMultiplierV1, macguffinEatFruitV1, macguffinOnItopodKillsV1 } from "./idle-macguffins-v1.js";
import { IDLE_THE_END_LAST_SPELL_BLOOD_V1, idleTheEndGrantV1, IDLE_THE_END_TOWER_FIRST_FLOOR_V1, idleTheEndHasV1 } from "./idle-the-end-v1.js";
import { perkBonusesV1 } from "./idle-perks-v1.js";
import { idleLoginCalendarOctroiV1 } from "./idle-login-calendar-v1.js";
import { idleYggFruitUnlockedV1, idleYggAutoActivateV1, idleYggActivationCostV1, idleYggSeedUnitV1, idleYggUsePoopV1, idleYggMayoFruitBaseV1, idleYggFruitOfQuirksQpV1, idleYggQuickActivationV1, idleYggTierSecondsV1, idleYggItopodPoopV1 } from "./idle-yggdrasil-extra-v1.js";
import { idleAdventureEquipmentStatsV47, idleEquipementEffectifV1, idleAdventureBoostV1, zoneNormalePlusAvanceeV1, advanceTitanAutoKillV1, advanceAdventureZoneAutoFarmOfflineV1 } from "./idle-adventure-v47.js";
import { idleCardsMayoFruitProgressV1, advanceIdleCardsV1 } from "./idle-cards-v1.js";
import { idleInventoryReceiveDropV1, idleInventoryIdsV1, idleInventoryProcessNewDropsV1, advanceIdleInventoryAutoV1 } from "./idle-inventory-auto-v1.js";
import { idleHeartsConsumableFactorV1 } from "./idle-hearts-v1.js";
import { IDLE_R3_NOMS_V1 } from "./idle-r3-names-v1.js";
import { advanceIdleCookingV1 } from "./idle-cooking-v1.js";
import { advanceIdleDaycareV1 } from "./idle-daycare-v1.js";
import { advanceIdleQuestingV1 } from "./idle-questing-v1.js";
import { tickSelloutEffectsV1 } from "./idle-sellout-shop-v1.js";
import { idleAchievementsEvaluateV1 } from "./idle-achievements-v1.js";
import { EARLY_GAME_MAX_OFFLINE_SECONDS, IDLE_NGU_BLOOD_RITUALS, IDLE_NGU_DIGGERS, IDLE_NGU_SYSTEMS, IDLE_NGU_YGG_FRUITS, challengeCompletionsV1, challengePermanentBonuses, challengeTierV1, clamp, int, nowMs, num } from "./idle-ngu-catalogues.js";
import { advanceAugmentations, advanceGeneratedResources, externalResourceAllocation, idleNguEffectiveResourceStatV1, rebaserProgressionSecondesV1, reconcileResourceCurrents, refreshRebirthState, totalAllocated } from "./idle-ngu-ressources.js";
import { advanceWandoos, applyYggQuickActivationV1, idleNguDifficultySpeedDividerV1, normalizeIdleNguState } from "./idle-ngu-etat.js";
import { autoCompleteChallengeV1, challengeHundredLevelsConsume, challengeHundredLevelsRemaining, crediterRecompensesAventure, photoRecompensesAventure, questingEnvV1, wishLevelV1, wishLevelsMapV1 } from "./idle-ngu-snapshot.js";
import { achievementMetricsV1, advanceNgusV1, apWithBonusV1, gearPctV1, gearSpecialsV1, hackFxV1, idleAdventureCombatStatsV1, idleNguBonuses, idleNguBonusesLectureV1, nguFxV1 } from "./idle-ngu-bonus.js";
import { advanceTimeMachine, advanceTrackSystem, idleNguTimeMachineGrossGoldPerSecond } from "./idle-ngu-pistes.js";
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
  for (const ritual of IDLE_NGU_BLOOD_RITUALS) {
    if (!ritualUnlocked(ritual, context, state)) continue;
    const magic = bloodRitualMagicV1(s, ritual.id);
    if (magic <= 0) continue;
    const rs = s.data.rituals[ritual.id];
    const secondsPerCompletion = ritual.baseSeconds * 1000 * difficultyDivider / Math.max(1e-12, magic * power) / dutchSetMultiplier;
    rebaserProgressionSecondesV1(rs, "progress", secondsPerCompletion);
    rs.progress += seconds;
    let completions = Math.floor(rs.progress / secondsPerCompletion);
    if (completions <= 0) continue;

    const affordable = Math.floor(state.currencies.gold / ritual.gold);
    completions = Math.min(completions, affordable, 1000000, challengeHundredLevelsRemaining(state));
    if (completions <= 0) continue;

    rs.progress -= completions * secondsPerCompletion;
    rs.completions += completions;
    rs.level += completions;
    state.currencies.gold -= completions * ritual.gold;
    state.currencies.blood += completions * ritual.blood * quirkBonusesV1(idleQuirkNiveauxV1(state)).bloodGainMultiplier * hackFxV1(state).bloodGain * diggerBonuses(state).blood * macguffinEffectMultiplierV1(state, "blood");
    s.data.bloodPeak = Math.max(num(s.data.bloodPeak, 0), state.currencies.blood);
    challengeHundredLevelsConsume(state, completions);
  }
  s.level = Object.values(s.data.rituals).reduce((sum, x) => sum + x.level, 0);
  s.tempLevel = s.level;
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

function castBloodSpellSansTrace(state, spell, now = 0) {
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
  if (spell === "leeches") {
    state.currencies.blood = 0;
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
  if (spin.unlocked && !spin.data.readyAt) spin.data.readyAt = now;
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
      const baseToughness=Math.max(1,idleAdventureCombatStatsV1(idleEquipementEffectifV1(state),{},null).toughness);
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

export function setDiggerLevel(state,id,level){
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

export function diggerBonuses(state){
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

/*
 * Page ITOPOD / Build History .398 (docs/HORS-LIGNE.md, proposition 2) : contrairement
 * à l'Aventure classique, la progression de l'ITOPOD (en ligne comme hors ligne) n'exige
 * pas d'y être « actif » -- seulement l'ITOPOD débloqué et 650 de Power d'Aventure au
 * total (de quoi tuer l'étage 1 en un coup). Le réglage « active » (généré par le même
 * bouton Activer/Désactiver que les autres systèmes) ne conditionne donc plus cette
 * progression ; il reste dans l'état sauvegardé pour compat mais n'est plus lu ici.
 */
const ITOPOD_MIN_POWER_V1 = 650;

function advanceTowerV1(state, seconds, context) {
  const tower = state.systems.tower;
  if (!tower.unlocked || !(seconds > 0)) return;
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

  const gear = idleEquipementEffectifV1(state);
  const bonuses = idleNguBonusesLectureV1(state);
  const powerRaw = idleAdventureCombatStatsV1(gear, context, bonuses).power;
  /* Pour l'écran (Norman, 2026-10-04 : « les ennemis doivent prendre des coups, la vie descend progressivement quand on n'est pas assez fort pour les tuer d'un coup ») : coups nécessaires pour tuer un ennemi de l'étage en cours
     (towerHitsV1, la même formule que la progression), délai de réapparition et intervalle entre deux coups. 0 = pas assez de Power pour avancer. */
  d.hitsParKill = 0;
  if (!(powerRaw >= ITOPOD_MIN_POWER_V1)) return;
  const power = Math.max(10, powerRaw);
  const idleBonus = num(gear.specials?.idleAttackMultiplier, 1.2);
  /*
   * Hors ligne (ou en ligne, menu ITOPOD fermé) sans être "actif" (Norman, 2026-09-27, correctif docs/HORS-LIGNE.md
   * point 2 -- wiki NGU, Build History .398 : « the ITOPOD ... progress hors ligne sans y être, tant que l'ITOPOD
   * est débloqué et qu'on peut tuer l'étage 1 en un coup (~650 Power) ». towerHitsV1(power, idleBonus, 0) <= 1 EST
   * exactement cette condition -- même formule que la progression manuelle ci-dessous, aucun seuil "650" inventé
   * ni dupliqué : tower.active reste nécessaire seulement pour choisir/suivre un intervalle de niveaux à l'écran,
   * jamais comme condition de progression en elle-même.
   */
  if (!tower.active && towerHitsV1(power, idleBonus, 0) > 1) return;
  const respawn = Math.max(0.34, 4 * (1 - clamp(num(bonuses.respawnReduction, 0), 0, 1)));
  const interval = state.adventure?.unlockFlags?.redLiquidMaxed ? 0.8 : 1;
  const optimal = towerOptimalFloorV1(power, idleBonus);
  /* Wiki NGU Idle, page ITOPOD (ngu-idle.fandom.com/wiki/ITOPOD, vérifiée le 2026-10-12) : « your start floor ranging from 0 to 1 below the highest floor you've reached, and your end floor going all the way up to 1600 » ; « If you ... defeat ten enemies on your end floor, you'll immediately go back to your start floor. » */
  let start = d.startFloor == null ? null : clamp(int(d.startFloor, 0), 0, Math.max(0, d.highestFloor - 1));
  let end = d.endFloor == null ? null : clamp(int(d.endFloor, 0), start ?? 0, TOWER_MAX_FLOOR_V1);
  let auto = start === null || end === null;
  /* Lazy ITOPOD Floor Shifter acheté (wiki : « check your optimal floor after each kill, and adjust it ») et mode Auto choisi : les étages suivent l'étage optimal à chaque tour. */
  const shifter = Boolean(state.selloutShop?.purchases?.lazyItopodFloorShifter) && d.autoOptimal === true;
  d.optimalFloor = optimal;
  d.hitsParKill = towerHitsV1(power, idleBonus, d.floor);
  d.respawnS = respawn;
  d.intervalS = interval;

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
    /* Pièce 491 (page THE END) : « Drop chance equal to 0.005% * (ITOPOD Level - 1449) » à chaque kill dès l'étage 1450 ; jamais deux fois. */
    if (floor >= IDLE_THE_END_TOWER_FIRST_FLOOR_V1 && !idleTheEndHasV1(state.adventure, 491)) {
      const p = Math.min(1, 0.00005 * (floor - (IDLE_THE_END_TOWER_FIRST_FLOOR_V1 - 1)));
      if (Math.random() < 1 - Math.pow(1 - p, n)) idleTheEndGrantV1(state.adventure, 491, Date.now());
    }
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
    if (shifter && towerAppliquerEtageOptimalV1(d, optimal)) {
      start = d.startFloor;
      end = d.endFloor;
      auto = false;
    }
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

/*
 * Règle de l'étage optimal (Norman, 2026-10-12), commune au bouton Auto (un clic) et au « Lazy ITOPOD Floor Shifter » (après chaque kill) : fin = étage optimal ; départ = optimal quand le wiki le permet (départ de 0 à un étage
 * sous le plus haut atteint : un seul étage, aucune boucle), sinon l'étage juste sous le plus haut atteint. Wiki ITOPOD (ngu-idle.fandom.com/wiki/ITOPOD). Renvoie false si aucun étage optimal n'est encore connu.
 */
function towerAppliquerEtageOptimalV1(d, optimal) {
  const opt = Math.max(0, int(optimal, 0));
  if (!(opt > 0)) return false;
  const plusHaut = Math.max(0, int(d.highestFloor, 0));
  const start = Math.min(opt, Math.max(0, plusHaut - 1));
  d.startFloor = start;
  d.endFloor = opt;
  if (d.floor < start || d.floor > opt) {
    d.floor = start;
    d.killsOnFloor = 0;
  }
  return true;
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

export function towerSetFloorsV1(state, payload) {
  const tower = state.systems.tower;
  if (!tower.unlocked) throw new Error("SYSTEME_VERROUILLE");
  const d = tower.data;
  if (payload.auto) {
    /*
     * Bouton « Auto » (Norman, 2026-10-12) : UN clic règle tes étages sur ton meilleur étage (l'étage optimal du moment : le plus haut où un coup suffit) et il ne monte plus étage par étage ; il ne se remet pas à jour tout seul,
     * on reclique plus tard (le réglage automatique après chaque kill est l'achat « Lazy ITOPOD Floor Shifter », wiki ITOPOD, 4G's Sellout Shop : « check your optimal floor after each kill, and adjust it »).
     * Respecte la règle du wiki (départ de 0 à un étage sous le plus haut atteint) : fin = optimal ; départ = optimal quand c'est permis (un seul étage, aucune boucle), sinon l'étage juste sous le plus haut atteint
     * (par exemple optimal 14 alors que 14 est le plus haut : 13 → 14, comme dans le jeu d'origine). Aucun étage n'est sauté : l'étage le plus haut ne change que par la montée.
     */
    const optimal = Math.max(0, int(d.optimalFloor, 0));
    if (towerAppliquerEtageOptimalV1(d, optimal)) {
      /* Mode « suivre l'étage optimal » : ne sert que si le Lazy ITOPOD Floor Shifter est acheté (voir advance plus bas). */
      d.autoOptimal = true;
      /* Étages changés par le bouton : on recommence au PREMIER ennemi de l'étage choisi (Norman, 2026-10-15). */
      if (d.startFloor != null) d.floor = d.startFloor;
      d.killsOnFloor = 0;
      tower.level = d.floor;
      return { auto: true, start: d.startFloor, end: d.endFloor };
    }
    d.startFloor = null;
    d.endFloor = null;
    return { auto: true };
  }
  const highest = Math.max(0, int(d.highestFloor, 0));
  const start = clamp(int(payload.start, 0), 0, Math.max(0, highest - 1));
  const end = clamp(int(payload.end, start), start, TOWER_MAX_FLOOR_V1);
  d.startFloor = start;
  d.endFloor = end;
  d.autoOptimal = false;
  /* Changer les étages avec les boutons recommence TOUJOURS au premier ennemi de l'étage de départ choisi (Norman, 2026-10-15), qu'on soit déjà dans la plage ou non. */
  d.floor = start;
  d.killsOnFloor = 0;
  return { start, end };
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
  const gearAventure = idleEquipementEffectifV1(state);
  const combatAventure = idleAdventureCombatStatsV1(gearAventure, context, idleNguBonusesLectureV1(state));
  {
    const titanChallengeBonuses = challengePermanentBonuses(state);
    advanceTitanAutoKillV1(state.adventure, Object.assign({}, context, {
      /* Synchro courte = joueur connecté : l'Auto-Kill donne alors le butin ; au-delà (rattrapage hors ligne) seulement EXP, Or, AP, PP, QP, comme le wiki. Même seuil que le farm hors ligne. */
      enLigne: seconds < 5 * 60,
      dropMultiplier: Math.max(0, num(idleNguBonusesLectureV1(state).dropMultiplier, 1)),
      dropMultiplierIncludesGear: true,
      titanLootLevelBonus: titanChallengeBonuses.titanLootLevelBonus,
      stats: { power: combatAventure.power, toughness: combatAventure.toughness },
      wishLevels: wishLevelsMapV1(state),
      titanExpBonusKills: perkBonusesV1(idlePerkNiveauxV1(state)).titanExpBonusKills,
      titanExpChallengePct: challengePermanentBonuses(state).bossExpPct,
      goldMultiplier: Math.max(0, num(idleNguBonusesLectureV1(state).adventureGoldMultiplier, 1)),
      titanCooldownReductionMs: titanChallengeBonuses.titanRespawnReductionMs,
      titanCooldownReductionEvilMs: titanChallengeBonuses.titanRespawnReductionEvilMs,
      titanCooldownReductionSadisticMs: titanChallengeBonuses.titanRespawnReductionSadisticMs
    }), seconds, now);
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
    const resumeFarm = advanceAdventureZoneAutoFarmOfflineV1(state.adventure, Object.assign({}, context, {
      stats: {
        power: combatAventure.power,
        toughness: combatAventure.toughness,
        hp: combatAventure.hp,
        regen: combatAventure.regen,
        specials: combatAventure.specials
      },
      dropMultiplier: Math.max(0, num(idleNguBonusesLectureV1(state).dropMultiplier, 1)),
      dropMultiplierIncludesGear: true,
      goldMultiplier: Math.max(0, num(idleNguBonusesLectureV1(state).adventureGoldMultiplier, 1))
    }), seconds, now);
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

/*
 * Troll Challenge (page Challenges, section « Trolls », relue le 2026-09-30) : « Every so often I'm gonna mess with you
 * in some way. » Délai entre deux trolls selon la complétion en cours (« trolls every 120 seconds » à 75 s : 120, 110,
 * 100, 90, 85, 80, 75). « Every fifth troll is a big troll ». Le chrono compte le temps de jeu actif (hors ligne
 * désactivé). Les petits trolls sont instantanés ; les gros restent actifs « until rebirth » (drapeaux state.challenge.troll.flags).
 * Les trolls purement visuels (message boxes, dessin du chaton, navigation aléatoire à 75 %) sont joués par le client
 * d'après le troll renvoyé dans state.challenge.troll.last.
 */
export const IDLE_TROLL_INTERVALS_S_V1 = Object.freeze([120, 110, 100, 90, 85, 80, 75]);

const IDLE_TROLL_SMALL_V1 = Object.freeze(["augments", "blood", "timeMachine", "gold", "boxes", "energy", "magic", "wandoos", "kitty"]);

const IDLE_TROLL_BIG_V1 = Object.freeze(["ngu", "beards", "menu", "ruin", "wandoosOff", "bossDivider"]);

/* « All small trolls except kitty and boxes » (gros troll « I basically ruined everything just now »). */
const IDLE_TROLL_RUIN_V1 = Object.freeze(["augments", "blood", "timeMachine", "gold", "energy", "magic", "wandoos"]);

export function createTrollStateV1(raw) {
  const f = raw?.flags || {};
  const last = raw?.last && typeof raw.last === "object" ? raw.last : null;
  return {
    timer: Math.max(0, num(raw?.timer, 0)),
    count: Math.max(0, int(raw?.count, 0)),
    flags: { ngu: Boolean(f.ngu), beards: Boolean(f.beards), wandoos: Boolean(f.wandoos), menu: Boolean(f.menu), bossDivider: Boolean(f.bossDivider) },
    last: last ? { id: String(last.id || ""), big: Boolean(last.big), seq: Math.max(0, int(last.seq, 0)) } : null
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

function applyTrollEffectV1(state, id) {
  if (id === "augments") {
    for (const pair of Object.values(state.systems.augmentations?.data?.pairs || {})) {
      pair.level = Math.floor(Math.max(0, num(pair.level, 0)) / 2);
      pair.upgradeLevel = Math.floor(Math.max(0, num(pair.upgradeLevel, 0)) / 2);
    }
  } else if (id === "blood") {
    state.currencies.blood = 0;
    const sp = state.systems.bloodMagic?.data?.spells;
    if (sp) sp.numberBoost = 1;
  } else if (id === "timeMachine") {
    const tm = state.systems.timeMachine?.data;
    if (tm) { tm.speedLevel = 0; tm.speedProgress = 0; tm.goldLevel = 0; tm.goldProgress = 0; }
    clearActiveDiggersV1(state);
  } else if (id === "gold") {
    state.currencies.gold = 0;
  } else if (id === "energy" || id === "magic") {
    const r = state.resources[id];
    if (r) { r.current = 0; r.fillProgress = 0; }
  } else if (id === "wandoos") {
    const w = state.systems.wandoos?.data;
    if (w) { w.dumpEnergyLevel = 0; w.dumpMagicLevel = 0; w.dumpEnergyProgress = 0; w.dumpMagicProgress = 0; }
  }
}

function fireTrollV1(state) {
  const t = state.challenge.troll;
  t.count += 1;
  const big = t.count % 5 === 0;
  const pool = big ? IDLE_TROLL_BIG_V1 : IDLE_TROLL_SMALL_V1;
  const id = pool[Math.min(pool.length - 1, Math.floor(Math.random() * pool.length))];
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
  advanceGeneratedResources(state, secs, context);
  advanceAugmentations(state, secs, context);
  advanceTrackSystem(state, IDLE_NGU_SYSTEMS.find(x => x.id === "advancedTraining"), secs);
  if (num(context.bosses, 0) >= 30) advanceTimeMachine(state, secs);
  if (num(context.bosses, 0) >= 37) advanceBloodMagic(state, secs, context);
  advanceYggdrasil(state, secs, nowMs(now));
  advanceWandoos(state, secs, context, now);
  advanceNgusV1(state, secs);
  advanceTrackSystem(state, IDLE_NGU_SYSTEMS.find(x => x.id === "beards"), secs);
  advanceTrackSystem(state, IDLE_NGU_SYSTEMS.find(x => x.id === "hacks"), secs);
  advanceTrackSystem(state, IDLE_NGU_SYSTEMS.find(x => x.id === "wishes"), secs);
}

/* dejaNormalise : l'appelant (syncIdleNguState) vient de normaliser cet état (copie privée) : le normaliser une 2e fois recopiait tout l'état pour rien (1,3 ms par appel, 4 appels par synchro). */
export function advanceIdleNguState(raw, seconds, context = {}, now = Date.now(), dejaNormalise = false) {
  const state = dejaNormalise ? raw : normalizeIdleNguState(raw, context, now);
  const offlineCap = IDLE_CHALLENGE_OFFLINE_DISABLED_IDS.includes(state.challenge?.active)
    ? 60
    : EARLY_GAME_MAX_OFFLINE_SECONDS;
  const secs = clamp(seconds, 0, offlineCap);
  /* 24 Hour Challenge : « Offline Progress will be disabled during this challenge. But, the timer won't run either. » -> le temps non joué est retiré du chrono. */
  if (state.challenge?.active === "twentyFourHours" && seconds > secs && state.challenge.startedAt > 0) state.challenge.startedAt += (clamp(seconds, 0, EARLY_GAME_MAX_OFFLINE_SECONDS) - secs) * 1000;
  state.records.playSeconds = num(state.records.playSeconds, 0) + secs;
  advanceTrollChallengeV1(state, secs);

  /*
   * 2026-09-24 (page Rebirths, « What do I lose when I rebirth? ») : « Access to the Adventure, Augmentation, Time
   * Machine, and Blood Magic tabs until their related bosses are beaten ». Le drapeau `unlocked` de ces systèmes
   * reste vrai après un Rebirth (les Augmentations testaient déjà le boss) : la Time Machine produisait et se
   * levelait, et Blood Magic tournait, dès le boss 1 d'un nouveau Rebirth.
   */
  if (secs > 0) passesDuTempsSeulV1(state, secs, context, now);
  else if (typeof process !== "undefined" && process.env && process.env.SOREAL_IDLE_VERIF_TEMPS_NUL === "1") {
    const avant = JSON.stringify(state);
    const copie = JSON.parse(avant);
    passesDuTempsSeulV1(copie, secs, context, now);
    if (JSON.stringify(copie) !== avant) throw new Error("SOREAL_IDLE_TEMPS_NUL_DIVERGENT");
  }
  advanceMoneyPitAndDaily(state, nowMs(now));
  advanceIdleCookingV1(state, nowMs(now));
  advanceLateSystems(state, secs, context, nowMs(now));
  advanceAdventureAdvancerV1(state, context, nowMs(now));
  advanceR3NomV1(state);
  /* Item Daycare : même delta en ligne et hors ligne (plafond 30 j / 60 s sous défi hors ligne interdit). */
  if (state.systems.daycare?.data?.slots?.length) advanceIdleDaycareV1(state.systems.daycare.data, secs, daycareFactorsV1(state));
  /* Auto Merge / Auto Boost : minuteurs communs (idle-inventory-auto-v1.js), bonus calculés seulement si un minuteur tourne. */
  /* Un objet fusionné ou boosté au niveau 100 peut compléter un set : ses EXP / AP de complétion sont versés dans les monnaies (comme après une action d'Aventure), sinon ils restaient dans adventure.permanent. */
  const avantAutoInventaire = photoRecompensesAventure(state);
  advanceIdleInventoryAutoV1(state.adventure, secs, () => inventoryAutoEnvV1(state));
  crediterRecompensesAventure(state, avantAutoInventaire);
  /* Questing (crochet 1/4) : Major Quests gagnées avec le temps + barre d'idle. */
  if (state.systems.questing?.unlocked) advanceIdleQuestingV1(state, secs, questingEnvV1(state, context), nowMs(now));

  tickSelloutEffectsV1(state, secs);
  reconcileResourceCurrents(state,context);
  state.updatedAt = nowMs(now);
  applyYggQuickActivationV1(state, now);
  state.rebirth = refreshRebirthState(state, context, nowMs(now));
  idleAchievementsEvaluateV1(state, achievementMetricsV1(state), nowMs(now));
  autoCompleteChallengeV1(state, context, nowMs(now));
  return state;
}
