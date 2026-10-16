import { idleLoginCalendarSnapshotV1, idleLoginCalendarReclamerV1, idleLoginCalendarNormaliserV1, idleLoginCalendarOctroiV1 } from "./idle-login-calendar-v1.js";
import {
  idleTheEndGrantV1,
  idleTheEndHasV1,
  idleTheEndDataV1,
  idleTheEndCompleteV1,
  IDLE_THE_END_FINAL_HACK_SECONDS_V1,
  IDLE_THE_END_LAST_SPELL_BLOOD_V1,
  IDLE_THE_END_TOWER_FIRST_FLOOR_V1,
  IDLE_THE_END_TEXT_V1
} from "./idle-the-end-v1.js";
import { IDLE_R3_NOMS_V1 } from "./idle-r3-names-v1.js";
import {
  createIdleAdventureStateV47,
  normalizeIdleAdventureStateV47,
  applyIdleAdventureActionV47,
  idleAdventureSnapshotV47,
  idleAdventureEquipmentStatsV47,
  idleAdventureMemoNouvelleRequeteV1,
  idleAdventureBoostV1,
  idleAdventureAddItemV1,
  idleAdventureSpecialItemV1,
  idleAdventureCubeTierV1,
  idleAdventureTitanCooldownMsV1,
  advanceTitanAutoKillV1,
  advanceAdventureZoneAutoFarmOfflineV1,
  zoneNormalePlusAvanceeV1,
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
  idleAchievementsApMultiplierV1,
  idleAchievementBossRequisV1
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
export { IDLE_NGU_AUGMENTATIONS, IDLE_NGU_BLOOD_RITUALS, IDLE_NGU_DIGGERS, IDLE_NGU_EARLY_GAME_TIMELINE, IDLE_NGU_META_VERSION, IDLE_NGU_NEWBIE_OFFERS, IDLE_NGU_NORMAL_CHALLENGES, IDLE_NGU_RESOURCE_POWER_CAP_UNLOCK_BOSS_V1, IDLE_NGU_RESOURCE_PURCHASES, IDLE_NGU_SAVE_SCHEMA, IDLE_NGU_SYSTEMS, IDLE_NGU_TIER_CHALLENGES, IDLE_NGU_TRACKS, IDLE_NGU_YGG_FRUITS, REBIRTH_UNLOCK_BOSS_V1, idleNguChallengeBonuses, safePow, safeProduct } from "./idle-ngu-catalogues.js";
export { IDLE_WANDOOS_OS_V1, RICH_JERKS_COST_EXP_V1, RICH_JERKS_PCT_PER_LEVEL_V1, idleNguDifficultySpeedDividerV1, idleTheEndFinalHackSnapshotV1, normalizeIdleNguState } from "./idle-ngu-etat.js";
export { calculateIdleNguNextNumber, idleNguAugmentationMultiplier, idleNguEffectiveResourceStat, idleNguRebirthTimeFactor, idleNguResourceBudget, idleNguResourceGenerationPerSecond } from "./idle-ngu-ressources.js";
export { HACK_HARD_CAP_V1, idleNguTimeMachineGoldPerSecond, idleNguTimeMachineGrossGoldPerSecond } from "./idle-ngu-pistes.js";
export { IDLE_TROLL_INTERVALS_S_V1, advanceIdleNguState } from "./idle-ngu-systemes.js";
export { idleNguBonuses, idleNguMemoNouvelleRequeteV1, syncIdleNguState } from "./idle-ngu-bonus.js";
export { idleNguSnapshot } from "./idle-ngu-snapshot.js";
export { IDLE_NGU_EXP_SHOP_V1, applyIdleNguAction, idleNguDifficultyUnlockRequirementsV1, rebirthIdleNguState } from "./idle-ngu-actions.js";

/*
 * SOREAL IDLE — early game NGU parity engine.
 *
 * Scope: Normal difficulty from a fresh save through the first Titan / first NGU layer.
 * This file intentionally does not migrate the previous experimental meta-progression.
 * Old SOREAL IDLE saves are disposable while the game is still in private development.
 *
 * The UI may translate names to the SOREAL universe. The progression rules stay NGU-like.
 */






 // Math.exp(~709.78) est la vraie limite double ; marge de sécurité.

















































































































































































/* État partagé du module (variables « let » d'origine), converti en objet pour que les fichiers du découpage puissent le lire ET l'écrire. */
export const __nguCtx = {
  __porteeBonusV1: null
};































































/* ===== fin Item Daycare ===== */



