import "./idle-login-calendar-v1.js";
import "./idle-the-end-v1.js";
import "./idle-r3-names-v1.js";
import "./idle-adventure-v47.js";
import "./idle-hearts-v1.js";
import "./idle-achievements-v1.js";
import "./idle-wandoos-os-v1.js";
import "./idle-big-number-v1.js";
import "./idle-perks-v1.js";
import "./idle-sellout-shop-v1.js";
import "./idle-quirks-v1.js";
import "./idle-wishes-v1.js";
import "./idle-basic-training.js";
/* Cooking (IT HUNGERS) : moteur isolé dans idle-cooking-v1.js. */
import "./idle-cooking-v1.js";
/* Questing (2026-09-23) : moteur isolé, branché par 4 crochets marqués "Questing" dans ce fichier. */
import "./idle-questing-v1.js";
/* MacGuffin Fragments (2026-09-23) : moteur isolé, voir idle-macguffins-v1.js. */
import "./idle-macguffins-v1.js";
/* Verrous de difficulté des Perks et Quirks (wiki : « Evil only » / « Sadistic only »). */
import "./idle-difficulty-gates-v1.js";
/* Player Portraits (2026-09-24) et Special Prize : idle-portraits-v1.js. */
import "./idle-portraits-v1.js";
/* Cards et Mayo (système complet dans idle-cards-v1.js). */
import "./idle-cards-v1.js";
import "./idle-ngu-catalog-v1.js";
/* --- Item Daycare (module dédié, voir idle-daycare-v1.js) --- */
import "./idle-daycare-v1.js";
/* --- Automatisation de l'inventaire (module dédié, voir idle-inventory-auto-v1.js) --- */
import "./idle-inventory-auto-v1.js";
/* Yggdrasil : Poop, Auto-Activate, Beast's Fertilizer, perks 16/17, nouveaux fruits (crochets « Ygg extra »). */
import "./idle-yggdrasil-extra-v1.js";
export { IDLE_NGU_AUGMENTATIONS, IDLE_NGU_BLOOD_RITUALS, IDLE_NGU_DIGGERS, IDLE_NGU_EARLY_GAME_TIMELINE, IDLE_NGU_META_VERSION, IDLE_NGU_NEWBIE_OFFERS, IDLE_NGU_NORMAL_CHALLENGES, IDLE_NGU_RESOURCE_POWER_CAP_UNLOCK_BOSS_V1, IDLE_NGU_RESOURCE_PURCHASES, IDLE_NGU_SAVE_SCHEMA, IDLE_NGU_SYSTEMS, IDLE_NGU_TIER_CHALLENGES, IDLE_NGU_TRACKS, IDLE_NGU_YGG_FRUITS, REBIRTH_UNLOCK_BOSS_V1, idleNguChallengeBonuses, safePow, safeProduct } from "./idle-ngu-catalogues.js";
export { IDLE_WANDOOS_OS_V1, RICH_JERKS_COST_EXP_V1, RICH_JERKS_PCT_PER_LEVEL_V1, idleNguDifficultySpeedDividerV1, idleTheEndFinalHackSnapshotV1, normalizeIdleNguState } from "./idle-ngu-etat.js";
export { calculateIdleNguNextNumber, idleNguAugmentationMultiplier, idleNguEffectiveResourceStat, idleNguRebirthTimeFactor, idleNguResourceBudget, idleNguResourceGenerationPerSecond } from "./idle-ngu-ressources.js";
export { HACK_HARD_CAP_V1, idleNguTimeMachineGoldPerSecond, idleNguTimeMachineGrossGoldPerSecond } from "./idle-ngu-pistes.js";
export { IDLE_TROLL_INTERVALS_S_V1, advanceIdleNguState } from "./idle-ngu-systemes.js";
export { avecProjectionSansMemoV1, idleNguBonuses, idleNguMemoNouvelleRequeteV1, syncIdleNguState } from "./idle-ngu-bonus.js";
export { idleNguSnapshot } from "./idle-ngu-snapshot.js";
export { IDLE_NGU_EXP_SHOP_V1, ACTIONS_DE_RYTHME_V1, applyIdleNguAction, idleNguDifficultyUnlockRequirementsV1, rebirthIdleNguState } from "./idle-ngu-actions.js";

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
  __porteeBonusV1: null,
  __sansMemoV1: false
};































































/* ===== fin Item Daycare ===== */



