import assert from "node:assert/strict";
import {
  advanceIdleNguState,
  IDLE_NGU_META_VERSION,
  IDLE_NGU_SAVE_SCHEMA
} from "../src/idle-ngu-progression.js";

/*
 * 2026-09-24 -- audit de composition, page « Augmentations » : « The cost to
 * level augmentations up scales linearly and is equal to Base cost * n where n
 * is the level you want to upgrade the augment to » et, pour les Upgrades,
 * « cost Base Cost * n in energy in the same manner as Augmentations ».
 * Base Time = « For 1st level, normal mode, 1000 cap, 1 power » : Safety
 * Scissors, 1000 energie allouee, Power 1 -> 400 s pour le niveau 1, donc
 * 800 s pour le niveau 2, 1200 s pour le niveau 3. Le temps etait constant.
 */
const save = (level) => ({
  version: IDLE_NGU_META_VERSION,
  saveSchema: IDLE_NGU_SAVE_SCHEMA,
  difficulty: "normal",
  systems: {
    augmentations: {
      unlocked: true,
      allocation: { energy: 1000 },
      data: { activePair: "scissors", trainUpgrade: false, pairs: { scissors: { level, upgradeLevel: 0, progress: 0, upgradeProgress: 0 } } }
    }
  },
  resources: { energy: { power: 1, speed: 50, cap: 1e9, bars: 1, current: 1e9 } },
  currencies: { gold: 1e30 }
});
const ctx = { adventurePower: 100, adventureToughness: 100, bosses: 301 };
const lvl = (s) => s.systems.augmentations.data.pairs.scissors.level;

/* Niveau 0 -> 1 : 400 s (valeur publiee). */
assert.equal(lvl(advanceIdleNguState(save(0), 399, ctx, 0)), 0);
assert.equal(lvl(advanceIdleNguState(save(0), 400, ctx, 0)), 1);
/* Niveau 1 -> 2 : 2 x 400 s. */
assert.equal(lvl(advanceIdleNguState(save(1), 799, ctx, 0)), 1);
assert.equal(lvl(advanceIdleNguState(save(1), 800, ctx, 0)), 2);
/* Niveau 9 -> 10 : 10 x 400 s. */
assert.equal(lvl(advanceIdleNguState(save(9), 3999, ctx, 0)), 9);
assert.equal(lvl(advanceIdleNguState(save(9), 4000, ctx, 0)), 10);

/* Upgrade : meme regle (Base Time du 1er niveau x n). */
{
  const up = (upgradeLevel) => {
    const s = save(1);
    s.systems.augmentations.data.trainUpgrade = true;
    s.systems.augmentations.data.pairs.scissors.upgradeLevel = upgradeLevel;
    return s;
  };
  const r0 = advanceIdleNguState(up(0), 400, ctx, 0).systems.augmentations.data.pairs.scissors.upgradeLevel;
  const r1a = advanceIdleNguState(up(1), 799, ctx, 0).systems.augmentations.data.pairs.scissors.upgradeLevel;
  const r1b = advanceIdleNguState(up(1), 800, ctx, 0).systems.augmentations.data.pairs.scissors.upgradeLevel;
  assert.equal(r0, 1, "Upgrade niveau 1 : temps de base (400 s pour Safety Scissors)");
  assert.equal(r1a, 1);
  assert.equal(r1b, 2, "Upgrade niveau 2 : 2 x le temps de base");
}
console.log("idle-augmentation-cost-scales-with-level: OK");
