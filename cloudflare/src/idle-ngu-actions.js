/*
 * NGU : actions du joueur, Renaissance, boutique EXP et Garderie (audit d'architecture, 2026-10-16 : découpage de idle-ngu-progression.js).
 * Code extrait tel quel ; les fichiers voisins se référencent par import (les fonctions étant hissées, les imports circulaires entre ces fichiers sont sans danger :
 * aucun n'appelle les autres au chargement).
 */
import { macguffinAdventureBeforeV1, macguffinAfterAdventureV1, applyMacguffinActionV1, macguffinApplyRebirthV1 } from "./idle-macguffins-v1.js";
import { idleInventoryIdsV1, idleInventoryManualBoostBeforeV1, idleInventoryProcessNewDropsV1, idleInventoryManualBoostAfterV1, applyIdleInventoryAutoActionV1, idleInventoryBoostRecycleChanceV1, idleInventoryLoadoutSlotsV1 } from "./idle-inventory-auto-v1.js";
import { applyIdleAdventureActionV47, idleAdventureEquipmentStatsV47, idleEquipementEffectifV1, idleAdventureSpecialItemV1, idleAdventureAddItemV1, idleAdventureTitanCooldownMsV1 } from "./idle-adventure-v47.js";
import { perkBonusesV1 } from "./idle-perks-v1.js";
import { appliquerUiPrefsV1 } from "./idle-ui-prefs-v1.js";
import { idlePerkNiveauxV1, idleQuirkNiveauxV1 } from "./idle-difficulty-gates-v1.js";
import { idleTheEndCompleteV1, IDLE_THE_END_TEXT_V1 } from "./idle-the-end-v1.js";
import { idleQuestingOnZoneKillV1, applyIdleQuestingActionV1 } from "./idle-questing-v1.js";
import { idleHeartV1, idleHeartsBuyV1 } from "./idle-hearts-v1.js";
import { idleSelloutShopBuyV1, idleSelloutShopNextCostV1, idleSelloutShopItemV1, idleSelloutUsePotionV1 } from "./idle-sellout-shop-v1.js";
import { idleWandoosConsumeCopyV1 } from "./idle-wandoos-os-v1.js";
import { idleYggConsumeGiantSeedV1, idleYggAutoActivateExpShopEntriesV1, idleYggIsMayoFruitV1, idleYggFruitUnlockedV1, idleYggAutoActivateV1 } from "./idle-yggdrasil-extra-v1.js";
import { idleLoginCalendarReclamerV1 } from "./idle-login-calendar-v1.js";
import { applyIdleCookingActionV1 } from "./idle-cooking-v1.js";
import { idlePortraitSelectV1, IDLE_SPECIAL_PRIZE_AP_V1 } from "./idle-portraits-v1.js";
import { idleDaycarePlaceV1, idleDaycareRemoveV1, idleDaycareFactorsV1 } from "./idle-daycare-v1.js";
import { idleCardsActionV1 } from "./idle-cards-v1.js";
import { quirkBonusesV1 } from "./idle-quirks-v1.js";
import { IDLE_NGU_AUGMENTATIONS, IDLE_NGU_NORMAL_CHALLENGES, IDLE_NGU_SYSTEMS, IDLE_NGU_TRACKS, IDLE_NGU_YGG_FRUITS, REBIRTH_UNLOCK_BOSS_V1, RESOURCE_KEYS, challengePermanentBonuses, clamp, clone, int, nowMs, num } from "./idle-ngu-catalogues.js";
import { apWithBonusV1, applyNguTargetsV1, clearNguAllocationsV1, convertActiveBeardOnRebirth, gearSpecialsV1, hackFxV1, idleAdventureCombatStatsV1, idleNguBonuses, idleNguBonusesLectureV1, setNguAdvanceV1, setNguAllocationV1, setNguTargetV1, setNguTierV1, syncIdleNguState, syncNguAllocationTotalsV1 } from "./idle-ngu-bonus.js";
import { buyNewbieOffer, buyPerkV1, buyQuirkV1, buyResource, challengeAction, collectSystem, crediterRecompensesAventure, marquerDropsFiltresV1, minRebirthSecondsV1, photoRecompensesAventure, portraitEnvV1, questingEnvV1, selectAugment, selectRitual, selectTrack, selectWandoosOs, setAugmentAllocationV214_, titanFight, tossMoneyPit, wishLevelV1, wishLevelsMapV1 } from "./idle-ngu-snapshot.js";
import { augApplyTargetsV1, idleNguEffectiveResourceStatV1, idleNguResourceGenerationPerSecond, reclaimAllocatedResource, refreshRebirthState, setAllocation, setAugmentAdvanceV1, setAugmentTargetV1, verifierCapApresEquipementV1 } from "./idle-ngu-ressources.js";
import { RICH_JERKS_COST_EXP_V1, RICH_JERKS_PCT_PER_LEVEL_V1, createAugmentationData, createBloodMagicData, createTimeMachineData, nettoyerMobMeilleurButinV1, createWandoosData, unlockSatisfied } from "./idle-ngu-etat.js";
import { atApplyTargetsV1, atSetTrackEnergyV1, beardActiveIdsV1, clearWishSlotAllocationsV1, setWishSlotAllocationV1, setWishSlotV1, tmApplyTargets } from "./idle-ngu-pistes.js";
import { activateYggFruit, bloodRitualMagicV1, castBloodSpell, createTrollStateV1, diggerBonuses, setDiggerLevel, setR3NomAleatoireV1, setRitualAllocationV1, toggleDigger, towerSetFloorsV1, upgradeDigger, upgradeYggFruit, useYggFruit } from "./idle-ngu-systemes.js";

export function applyIdleNguAction(raw, payload = {}, context = {}, now = Date.now()) {
  const t = nowMs(now);
  const state = syncIdleNguState(raw, context, t);
  const action = String(payload.action || "").trim();
  let result = {};

  /*
   * clientMutationId optionnel (string <= 160) : un même identifiant déjà vu parmi les 64 dernières actions renvoie le
   * résultat mémorisé sans rejouer l'action. L'action "adventure" garde son propre mécanisme (idle-adventure-v47.js).
   */
  const clientMutationId = action !== "adventure" && typeof payload.clientMutationId === "string"
    ? payload.clientMutationId.slice(0, 160)
    : "";
  if (clientMutationId) {
    const deja = state.recentClientMutations.find((x) => x && x.id === clientMutationId);
    if (deja) return { state, result: clone(deja.result === undefined ? null : deja.result), duplicate: true };
  }

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
        dropMultiplier: Math.max(0, num(idleNguBonusesLectureV1(state).dropMultiplier, 1)),
        dropMultiplierIncludesGear: true,
        dropChancePct: num(context.dropChancePct, 0),
        difficulty: state.difficulty,
        goldMultiplier: Math.max(0, num(idleNguBonusesLectureV1(state).adventureGoldMultiplier, 1)),
        boostPowerMultiplier: Math.max(1, num(idleNguBonusesLectureV1(state).boostPowerMultiplier, 1)),
        cubeBoostRate: Math.max(0.01, num(perkBonusesV1(idlePerkNiveauxV1(state)).cubeBoostRate, 0.01)),
        cubeBoostEffectiveness: 1 + 0.05 * Math.min(20, wishLevelV1(state, 110)),
        wishLevels: wishLevelsMapV1(state),
        titanExpBonusKills: perkBonusesV1(idlePerkNiveauxV1(state)).titanExpBonusKills,
        /* No Equipment Challenge : rien ne peut être équipé tant que le défi est actif (idle-adventure-v47.js, action equip). */
        equipmentLocked: state.challenge?.active === "noEquipment",
        titanExpChallengePct: challengePermanentBonuses(state).bossExpPct,
        titanCooldownReductionMs:challengePermanentBonuses(state).titanRespawnReductionMs,
        titanCooldownReductionEvilMs:challengePermanentBonuses(state).titanRespawnReductionEvilMs,
        titanCooldownReductionSadisticMs:challengePermanentBonuses(state).titanRespawnReductionSadisticMs,
        titanLootLevelBonus:challengePermanentBonuses(state).titanLootLevelBonus,
        adventureStats: idleAdventureCombatStatsV1(idleEquipementEffectifV1(state), context, idleNguBonuses(state))
      }),
      t
    );
    if ((advActionInv === "unequip" || advActionInv === "equip") && !applied.duplicate) verifierCapApresEquipementV1(state, applied.state, context);
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
      if (advActionInv === "zoneKill" || advActionInv === "resolveZoneFight" || advActionInv === "titan") {
        const filtrage = idleInventoryProcessNewDropsV1(state.adventure, idsAvantAventure, invEnv);
        marquerDropsFiltresV1(applied.result, filtrage.filteredIds);
      }
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
    if (advActionInv === "theEndPlay" && idleTheEndCompleteV1(state.adventure)) result = Object.assign({}, result, { text: IDLE_THE_END_TEXT_V1 });
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
      if (dropGold > 0 && tmData) {
        const ancien = Math.max(0, num(tmData.bestGoldThisRun, 0));
        /* Une partie commencée avant l'écran de la machine a un record SANS mob (impossible à retrouver : le record vient d'un tirage et de bonus d'Or d'alors). Le mob du premier kill suivant est montré en attendant (l'écran resterait vide jusqu'à la renaissance : les kills du moment rapportent bien moins que l'ancien record, journal de Norman 2026-10-20) ; le premier vrai record le remplace. */
        const recordSansMob = !tmData.bestGoldMob && ancien > 0;
        if (dropGold > ancien || recordSansMob) {
          if (dropGold > ancien) tmData.bestGoldThisRun = dropGold;
          /* Le mob de ce butin (écran de la Machine temporelle) : un kill de zone (zone, boss ou non, graine d'image, nom) ou un titan. Sans information : la zone seulement. */
          const mob = advActionInv === "titan"
            ? { titan: String(result?.id || result?.titanId || ""), name: String(result?.name || result?.titanName || "") }
            : { zone: String(result?.zone || ""), boss: result?.boss ? 1 : 0, seed: Math.floor(num(result?.mobSeed, -1)), name: String(result?.mobName || "") };
          tmData.bestGoldMob = nettoyerMobMeilleurButinV1(mob);
        }
      }
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
      const macguffinDrops = macguffinAfterAdventureV1(state, macguffinAvant, result, { dropMultiplier: idleNguBonusesLectureV1(state).dropMultiplier });
      if (macguffinDrops.length && result && typeof result === "object") result.macguffinDrops = macguffinDrops;
    }
  } else if (action === "setUiPrefs") {
    /* Préférences d'interface liées au compte : cases, saisies, onglets, réglages (idle-ui-prefs-v1.js). Aucun effet sur le jeu. */
    result = appliquerUiPrefsV1(state, payload.prefs);
  } else if (action === "macguffin") {
    result = applyMacguffinActionV1(state, payload, t);
  } else if (action === "allocateNgu") {
    result = setNguAllocationV1(state, String(payload.ngu || ""), num(payload.value, 0), context, payload.tier ? String(payload.tier) : undefined);
    /* Un NGU qui a déjà atteint son Target ne garde pas l'énergie qu'on vient d'y mettre (comme l'Entraînement avancé). */
    applyNguTargetsV1(state);
  } else if (action === "setNguTarget") {
    result = setNguTargetV1(state, String(payload.ngu || ""), num(payload.value, 0));
  } else if (action === "setNguAdvance") {
    result = setNguAdvanceV1(state, String(payload.resource || ""), Boolean(payload.enabled));
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
  } else if (action === "allocateAdvancedTraining") {
    /* Énergie d'une compétence d'Advanced Training (colonne « Energy Allocated », boutons + / −). */
    atSetTrackEnergyV1(state, String(payload.track || ""), num(payload.value, 0), context);
    atApplyTargetsV1(state);
  } else if (action === "allocateAdvancedTrainings") {
    /* Lot d'allocations d'Advanced Training (audit du menu, Norman 2026-10-05) : plusieurs compétences modifiées en rafale (ou « Tout retirer ») partent en UN appel ; appliquées dans l'ordre demandé, puis les Targets une seule fois. */
    const items = Array.isArray(payload.items) ? payload.items.slice(0, 40) : [];
    for (const it of items) atSetTrackEnergyV1(state, String(it?.track || ""), num(it?.value, 0), context);
    atApplyTargetsV1(state);
  } else if (action === "setAdvancedTrainingAdvance") {
    /* Case « Advance Energy » d'Advanced Training. */
    const at = state.systems.advancedTraining;
    if (!at?.unlocked) throw new Error("SYSTEME_VERROUILLE");
    at.data.advanceEnergy = Boolean(payload.enabled);
    atApplyTargetsV1(state);
  } else if (action === "setAdvancedTrainingTarget") {
    /* Champ « Target » d'une compétence : niveau à atteindre (0 = aucun) ; à l'atteinte son énergie est retirée. */
    const at = state.systems.advancedTraining;
    if (!at?.unlocked) throw new Error("SYSTEME_VERROUILLE");
    const track = at.data?.tracks?.[String(payload.track || "")];
    if (!track) throw new Error("PISTE_INCONNUE");
    track.target = Math.max(0, Math.min(1e9, Math.floor(num(payload.value, 0))));
    atApplyTargetsV1(state);
  } else if (action === "reclaimResource") {
    result=reclaimAllocatedResource(state,String(payload.resource||"energy"),context);
  } else if (action === "allocateAugment") {
    setAugmentAllocationV214_(state,String(payload.pair||"scissors"),Boolean(payload.upgrade),num(payload.value,0),context);
    /* Une piste qui a déjà atteint sa cible ne garde pas l'énergie qu'on vient d'y mettre (comme NGU et l'Entraînement avancé). */
    augApplyTargetsV1(state, context);
  } else if (action === "setAugmentTarget") {
    result = setAugmentTargetV1(state, String(payload.pair || "scissors"), Boolean(payload.upgrade), num(payload.value, 0), context);
  } else if (action === "setAugmentAdvance") {
    result = setAugmentAdvanceV1(state, Boolean(payload.enabled), context);
  } else if (action === "allocateAugments") {
    /* Lot d'allocations (audit du menu Augmentations, Norman 2026-10-05) : plusieurs Augments / Upgrades modifiés en rafale partent en UN appel au lieu d'un par cible ; appliqués dans l'ordre demandé, chacun borné par l'énergie libre. */
    const items = Array.isArray(payload.items) ? payload.items.slice(0, 40) : [];
    for (const it of items) setAugmentAllocationV214_(state, String(it?.pair || "scissors"), Boolean(it?.upgrade), num(it?.value, 0), context);
    augApplyTargetsV1(state, context);
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
  } else if (action === "allocateRitual") {
    /* Magic d'UN rituel (plusieurs rituels peuvent en recevoir en même temps). */
    setRitualAllocationV1(state, String(payload.ritual || "tack"), num(payload.value, 0), context);
  } else if (action === "clearRitualAllocations") {
    if (!state.systems.bloodMagic?.unlocked) throw new Error("SYSTEME_VERROUILLE");
    for (const id of Object.keys(state.systems.bloodMagic.data.rituals || {})) {
      if (bloodRitualMagicV1(state.systems.bloodMagic, id) > 0) setRitualAllocationV1(state, id, 0, context);
    }
  } else if (action === "castBloodSpell") {
    result = castBloodSpell(state, String(payload.spell || "numberBoost"), t);
  } else if (action === "cornerClick") {
    /* Secret « Clicked the bottom right corner of the Advanced Training menu » : le caca n'existe à l'écran qu'avec Wandoos, on refuse sinon. */
    if (!state.systems.wandoos?.unlocked) throw new Error("SYSTEME_VERROUILLE");
    state.records.cornerClicked = 1;
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
  } else if (action === "setR3NomAleatoire") {
    result = setR3NomAleatoireV1(state, payload);
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
  } else if (action === "usePotion") {
    /* Une potion de la valise (haut du Coffre) : elle s'active maintenant. */
    result = idleSelloutUsePotionV1(state, String(payload.itemId || ""));
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
  } else if (action === "loginCalendar") {
    if (!state.systems.moneyPit?.unlocked) throw new Error("SYSTEME_VERROUILLE");
    result = idleLoginCalendarReclamerV1(state, t);
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
    const avantInventaireAuto = photoRecompensesAventure(state);
    result = applyIdleInventoryAutoActionV1(state, payload, inventoryAutoEnvV1(state));
    /* A / D + clic, « tout booster »… : un set complété par ce geste verse aussitôt ses EXP / AP de complétion. */
    crediterRecompensesAventure(state, avantInventaireAuto);
  } else {
    throw new Error("ACTION_META_INCONNUE");
  }

  state.updatedAt = t;
  state.rebirth = refreshRebirthState(state, context, t);
  if (clientMutationId) {
    state.recentClientMutations.push({ id: clientMutationId, result: result === undefined ? null : clone(result) });
    if (state.recentClientMutations.length > 64) state.recentClientMutations = state.recentClientMutations.slice(-64);
  }
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
      if (def.id === "advancedTraining") t.energy = 0;
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
export function resourceInfoV1(state, resource, context = {}) {
  const r = state.resources[resource];
  if (!r) return null;
  const speed = clamp(idleNguEffectiveResourceStatV1(state, resource, "speed"), 0.1, 50);
  const ticksPerFill = Math.max(1, Math.round((50 / speed) * 100) / 100);
  const capRun = Math.max(0, idleNguEffectiveResourceStatV1(state, resource, "cap"));
  const generated = Math.max(0, num(r.generatedThisRun, 0));
  const room = Math.max(0, 100000 - Math.min(100000, num(r.capNaturel, num(r.cap, 0))));
  const capGain = resource === "energy" ? Math.min(Math.floor(generated / 20), room) : 0;
  return {
    capRun,
    capAfterRebirth: capRun + capGain,
    capGain,
    perSecond: idleNguResourceGenerationPerSecond(state, resource),
    speed,
    ticksPerFill,
    nextSpeed: speed < 50 - 1e-9 ? Math.min(50, Math.round((speed + 0.1) * 10) / 10) : null
  };
}

function applyNaturalEnergyCapGrowthOnRebirth(state){
  const r=state.resources.energy;
  if(!r)return 0;
  const generated=Math.max(0,num(r.generatedThisRun,0));
  const rawGain=Math.floor(generated/20);
  const naturel=Math.max(0,num(r.capNaturel,num(r.cap,0)));
  const room=Math.max(0,100000-Math.min(100000,naturel));
  const gain=Math.min(rawGain,room);
  if(gain>0){r.cap+=gain;r.capNaturel=naturel+gain;}
  return gain;
}

export function applyRebirthResetV56_(state,context,t,options={}) {
  const runSeconds=Math.max(0,(t-state.runStartedAt)/1000);
  const rb=refreshRebirthState(state,context,t);
  /* Sang dépensé dans le sort Number pendant cette partie : le multiplicateur vaut 1 + sang dépensé ; mémorisé AVANT la remise à zéro de la Renaissance. */
  const sangDepenseRun=Math.max(0,num(state.systems.bloodMagic?.data?.spells?.numberBoost,1)-1);
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
  rb.lastBlood=sangDepenseRun;
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
    rb.lastBlood=0;
    rb.hasPreviousRun=false;
  }
  rb.canRebirth=false;

  // "100 Levels Challenge" pool is explicitly "per rebirth" (audit
  // 2026-09-16) — reset on every rebirth, not just when that challenge starts.
  state.challenge.hundredLevelsGained=0;
  /* Gros trolls : « until rebirth » -> les drapeaux tombent à chaque Rebirth (le chrono des trolls continue). */
  if(state.challenge.troll)state.challenge.troll.flags=createTrollStateV1().flags;
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
    /*
     * Wiki NGU, page Rebirths, « What do I lose when I rebirth? » : « Access to the Adventure, Augmentation, Time Machine, and Blood Magic tabs until
     * their related bosses are beaten. » (Norman, 2026-10-02 : Augmentations restait ouvert après un défi ; ses points posés étaient rendus et faussaient
     * le temps de génération.) Ces menus se referment donc à chaque Rebirth/défi/changement de difficulté ; la synchro les rouvre dès que le compteur
     * de boss DU RUN atteint de nouveau leur seuil (unlockSatisfied).
     */
    if(def.id==="augmentations"||def.id==="timeMachine"||def.id==="bloodMagic")s.unlocked=false;
    if(def.id==="augmentations"){
      /* Les niveaux repartent à zéro au Rebirth, mais les CIBLES et « Faire suivre l'énergie » sont des réglages du joueur : ils sont conservés (audit des Augmentations, 2026-10-11). */
      const avantAug=s.data;
      s.data=createAugmentationData();
      for(const augDef of IDLE_NGU_AUGMENTATIONS){
        const ancien=avantAug?.pairs?.[augDef.id];
        if(!ancien)continue;
        s.data.pairs[augDef.id].target=Math.max(0,int(ancien.target,0));
        s.data.pairs[augDef.id].upgradeTarget=Math.max(0,int(ancien.upgradeTarget,0));
      }
      s.data.advanceEnergy=Boolean(avantAug?.advanceEnergy);
    }
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
      const bloodPeak=Math.max(0,num(s.data.bloodPeak,0),num(state.currencies.blood,0));
      s.data=createBloodMagicData();
      s.data.bloodPeak=bloodPeak;
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
export function idleNguRichJerksAttackPctV1(state) {
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
  /*
   * Norman (2026-09-29) : « J'aimerai un bouton pour trier l'inventaire [...] il ne serait pas
   * dévérouillé de base, mais tu peux l'ajouter dans le shop, dans la section débutant. Il coute
   * 200 EXP. » Fonctionnalité SOREAL originale, absente du wiki NGU Idle (le tri manuel/drag & drop
   * du sac existe déjà côté serveur, mais aucun bouton "tout trier" n'existe dans le jeu réel) --
   * coût donné directement par Norman, jamais tiré du wiki.
   */
  /* Norman (2026-10-02) : le tri passe à 20 EXP et rejoint le nouveau rayon « Toc » de la boutique. */
  sortInventory: Object.freeze({ name: "Sort Inventory", cost: () => 20, gain: 1, max: 1 }),
  /*
   * « Synchro Basic Training » (Norman, 2026-10-02) : case à cocher sous Input dans Basic Training ; cochée, ce qu'on place dans une compétence est placé au même
   * instant dans sa jumelle (Attaque passive / Blocage, etc.) pour que les deux montent exactement à la même vitesse. Fonctionnalité SOREAL originale, absente
   * du wiki NGU Idle : prix et rayon donnés par Norman (le prix n'est pas tiré du wiki). L'effet est purement côté client (les allocations des deux compétences
   * partent ensemble) ; le serveur ne fait que mémoriser l'achat (bonus basicTrainingSync).
   */
  syncBasicTraining: Object.freeze({ name: "Basic Training Sync", cost: () => 50, gain: 1, max: 1 }),
  /*
   * « Synchro Wandoos » (Norman, 2026-10-23) : interrupteur de métal sur le clavier de Wandoos ; allumé, les touches 0, −, + et CAP de l'énergie agissent aussi sur la magie (et inversement), avec ce qu'il y a de libre.
   * Fonctionnalité SOREAL originale, absente du wiki NGU Idle : prix (25 EXP de plus que la Synchro Basic Training) et rayon donnés par Norman. Effet purement côté client ; le serveur mémorise l'achat (bonus wandoosSync).
   */
  syncWandoos: Object.freeze({ name: "Wandoos Sync", cost: () => 75, gain: 1, max: 1 }),
  /* Menus animés (Norman, 2026-10-04 : « enlève les animations des menus du haut ; pour les avoir, un achat dans le rayon Toc à 40 EXP qui permet de savoir quand un menu est actif »). Fonctionnalité SOREAL absente du wiki NGU Idle : prix et rayon donnés par Norman ; le serveur ne fait que mémoriser l'achat (drapeau menusAnimes), l'animation est dessinée par le client. */
  menuAnimations: Object.freeze({ name: "Animated Menus", cost: () => 40, gain: 1, max: 1 }),
  /*
   * Gestes sur les objets du sac (Norman, 2026-10-04) : « retire la fonction double tap / triple tap de base pour les joueurs ; dans le Shop, au rayon Aventure : Double tap pour 20 EXP (un objet absorbe tous les
   * boosts de l'inventaire), Triple tap pour 30 EXP (fusion automatique avec les pièces disponibles) ». Fonctionnalités SOREAL originales, absentes du wiki NGU Idle : prix et rayon donnés par Norman. Le serveur
   * mémorise l'achat (drapeaux doubleTap / tripleTap du bloc inventoryAuto.unlocked) ; le geste lui-même (appuis rapides, tactile) est détecté par le client, qui envoie les actions déjà existantes
   * inventoryAuto / boostAll (Double tap) et inventoryAuto / mergeAll (Triple tap).
   */
  doubleTap: Object.freeze({ name: "Double Tap (boosts)", cost: () => 20, gain: 1, max: 1 }),
  tripleTap: Object.freeze({ name: "Double Tap (fusion)", cost: () => 30, gain: 1, max: 1 }),
  basicLootFilter: Object.freeze({ name: "Basic Loot Filter", cost: () => 20, gain: 1, max: 1 }),
  loadoutSlots: Object.freeze({ name: "2 Loadout Slots!", cost: () => 1000, gain: 2, max: 1 }),
  loadoutSlot3: Object.freeze({ name: "Another Loadout Slot!", cost: () => 10000, gain: 1, max: 1 }),
  boostRecycling: Object.freeze({ name: "Boost Recycling", cost: () => 100, gain: 10, max: 5 }),
  inventoryMergeSlot: Object.freeze({ name: "Inventory Merge Slot!", cost: () => 1000, gain: 1, max: 1 }),
  /*
   * Custom Input Button 1 à 4 (Norman, 2026-10-12 : « veille à brancher tout ce qui est dans les boutiques »). Wiki Experience, Misc : « Custom Input Button 1/2/3/4 », 50 / 100 / 500 / 1000 EXP, achat unique (« these can only be
   * purchased once »). Le wiki ne décrit aucun effet ; la page 4G's Sellout Shop dit seulement que les boutons de pourcentage « work like the other custom buttons ». Effet retenu : un bouton à côté du champ Input qui y place
   * un nombre CHOISI par le joueur (modules/perso-boutons-v1.js) ; valeur de départ SOREAL (100, 1 000, 10 000, 100 000), à changer avec ✎. Le serveur ne mémorise que l'achat.
   */
  customInput1: Object.freeze({ name: "Custom Input Button 1", cost: () => 50, gain: 1, max: 1 }),
  customInput2: Object.freeze({ name: "Custom Input Button 2", cost: () => 100, gain: 1, max: 1 }),
  customInput3: Object.freeze({ name: "Custom Input Button 3", cost: () => 500, gain: 1, max: 1 }),
  customInput4: Object.freeze({ name: "Custom Input Button 4", cost: () => 1000, gain: 1, max: 1 }),
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
export function inventoryAutoEnvV1(state) {
  const ch = challengePermanentBonuses(state);
  const sellout = state.selloutShop?.purchases || {};
  const hundred = Math.max(0, int(state.challenge?.completions?.hundredLevels, 0));
  const hundredMax = IDLE_NGU_NORMAL_CHALLENGES.find((d) => d.id === "hundredLevels")?.max || 5;
  return {
    autoMergeUnlocked: expShopPurchasedV1(state, "autoMerge") >= 1,
    equipmentLocked: state.challenge?.active === "noEquipment",
    sortInventoryUnlocked: expShopPurchasedV1(state, "sortInventory") >= 1,
    doubleTapUnlocked: expShopPurchasedV1(state, "doubleTap") >= 1,
    tripleTapUnlocked: expShopPurchasedV1(state, "tripleTap") >= 1,
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
      boostPowerMultiplier: Math.max(1, num(idleNguBonusesLectureV1(state).boostPowerMultiplier, 1)),
      cubeBoostRate: Math.max(0.01, num(perkBonusesV1(idlePerkNiveauxV1(state)).cubeBoostRate, 0.01)),
      cubeBoostEffectiveness: 1 + 0.05 * Math.min(20, wishLevelV1(state, 110))
    })
  };
}

export function expShopPurchasedV1(state, id) {
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

/*
 * Anti-spoil (règle n°2, balayage en ligne 2026-10-06) : la boutique EXP ne liste que les achats dont le système est découvert (même table que le client,
 * meta-progression-v130.js IDLE_EXP_SYSTEME_DE_L_ACHAT_V1 : Aventure dès le boss 4, sinon le système doit être débloqué ; fruits Yggdrasil = Yggdrasil).
 */
const IDLE_EXP_SYSTEME_DE_L_ACHAT_V1 = Object.freeze({
  adventurePower: "adventure", adventureToughness: "adventure", adventureHp: "adventure", adventureRegen: "adventure",
  customInput1: "adventure", customInput2: "adventure", customInput3: "adventure", customInput4: "adventure", inventorySpace: "adventure", accessorySlot1: "adventure", accessorySlot2: "adventure", autoMerge: "adventure", sortInventory: "adventure",
  syncWandoos: "wandoos", syncBasicTraining: "adventure", doubleTap: "adventure", tripleTap: "adventure", basicLootFilter: "adventure",
  loadoutSlots: "adventure", loadoutSlot3: "adventure", boostRecycling: "adventure", inventoryMergeSlot: "adventure",
  diggerSlot: "diggers", beardSlot: "beards", daycareSlot1: "daycare", daycareSlot2: "daycare", daycareSlot3: "daycare",
  macguffinSlot1: "macguffins", macguffinSlot2: "macguffins"
});

function expShopAchatVisibleV1(state, id, def) {
  const systeme = def.yggFruit ? "yggdrasil" : IDLE_EXP_SYSTEME_DE_L_ACHAT_V1[id];
  if (!systeme) return true;
  if (systeme === "adventure") return num(state.records?.highestBoss, 0) >= 4;
  return Boolean(state.systems[systeme]?.unlocked) || expShopPurchasedV1(state, id) > 0;
}

export function expShopSnapshotV1(state) {
  return Object.entries(IDLE_NGU_EXP_SHOP_V1).filter(([id, def]) => expShopAchatVisibleV1(state, id, def)).filter(([, def]) => !(def.yggFruit && idleYggIsMayoFruitV1(def.yggFruit) && !idleYggFruitUnlockedV1(state, def.yggFruit))).map(([id, def]) => {
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
export function daycareBaseInputsV1(state) {
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

export function daycareFactorsV1(state) {
  return idleDaycareFactorsV1(Object.assign(daycareBaseInputsV1(state), {
    /* Souhait 27 « I wish the Daycare Kitty was even happier » : +1 % de vitesse par niveau (page Wishes). */
    wishLevel: wishLevelV1(state, 27),
    gearDaycareSpeedPct: num(gearSpecialsV1(state).daycareSpeedPct, 0),
    diggerMultiplier: diggerBonuses(state).daycare,
    hackMultiplier: hackFxV1(state).daycare
  }));
}

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
