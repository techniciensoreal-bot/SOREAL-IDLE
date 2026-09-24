import assert from "node:assert/strict";
import {
  IDLE_ACHIEVEMENTS_V1,
  idleAchievementV1,
  idleAchievementsBpV1,
  idleAchievementsApMultiplierV1,
  normalizeIdleAchievementsDataV1
} from "../src/idle-achievements-v1.js";
import {
  normalizeIdleNguState,
  advanceIdleNguState,
  applyIdleNguAction,
  rebirthIdleNguState,
  idleNguSnapshot
} from "../src/idle-ngu-progression.js";
import { applyIdleAdventureActionV47, normalizeIdleAdventureStateV47 } from "../src/idle-adventure-v47.js";

/*
 * Achievements (2026-09-24) -- page "Achievements" du miroir NGU-Wiki, bonus AP
 * (pages "Arbitrary Points" et "Yggdrasil"), secret de Rebirth (page "Rebirths").
 */

// ---- Catalogue : 153 succès, valeurs de chaque ligne du wiki ----
assert.equal(IDLE_ACHIEVEMENTS_V1.length, 153, "As of build 0.423 there are 153 achievements");
assert.equal(IDLE_ACHIEVEMENTS_V1.filter((a) => !a.secret).length, 135);
assert.equal(IDLE_ACHIEVEMENTS_V1.filter((a) => a.secret).length, 18);
assert.equal(new Set(IDLE_ACHIEVEMENTS_V1.map((a) => a.id)).size, 153, "ids uniques");
/* La page annonce 5825 BP mais ses lignes totalisent 5815 : on garde les lignes. */
assert.equal(IDLE_ACHIEVEMENTS_V1.reduce((s, a) => s + a.bp, 0), 5815);
for (const [id, bp] of [
  ["energyPower_10", 5], ["energyPower_300000000", 50], ["magicPower_3", 5], ["magicPower_100000000", 50],
  ["energyCap_10000", 5], ["energyCap_1000000000000", 50], ["magicCap_30000", 5], ["magicCap_1000000000000", 50],
  ["energyBars_3", 5], ["magicBars_100000000", 50], ["boss_10", 5], ["boss_60", 25], ["boss_240", 55], ["boss_300", 60],
  ["rebirth_1", 5], ["rebirth_1000", 40], ["rebirth_10000", 60],
  ["secretNguMenu", 100], ["secretAtCorner", 60], ["secretSpeedrun", 20], ["secretBeastV4", 25], ["secretEvil", 25]
]) assert.equal(idleAchievementV1(id)?.bp, bp, id);
for (const id of ["secretExploder", "secretLevel69", "secretNoHitGrb", "secretNoHitWalderp", "secretAtCorner"]) {
  assert.equal(idleAchievementV1(id).tracked, false, `${id} : non mesurable, jamais débloqué`);
}
assert.deepEqual(normalizeIdleAchievementsDataV1({ unlocked: { boss_10: 5, inconnu: 1, secretExploder: 2 } }), { unlocked: { boss_10: 5 } });

// ---- Déblocage à la synchro, permanence, facteur AP ----
{
  let s = normalizeIdleNguState({}, { bosses: 0 }, 0);
  s = advanceIdleNguState(s, 0, { bosses: 0 }, 1000);
  assert.equal(idleAchievementsBpV1(s), 0, "partie neuve : aucun succès");
  s = advanceIdleNguState(s, 0, { bosses: 100 }, 2000);
  /* Boss 10..100 : 5+10+15+20+25+25+30+30+35+35 = 230 BP. */
  assert.equal(idleAchievementsBpV1(s), 230);
  assert.equal(idleAchievementsApMultiplierV1(s), 1.023, "+1 % / 100 BP");
  assert.equal(s.systems.achievements.data.unlocked.boss_100, 2000);
  s = advanceIdleNguState(s, 0, { bosses: 3 }, 3000);
  assert.equal(idleAchievementsBpV1(s), 230, "un succès ne se perd jamais");
  s.resources.energy.power = 30;
  s.systems.ngu.unlocked = true;
  s = advanceIdleNguState(s, 0, { bosses: 3 }, 4000);
  assert.equal(idleAchievementsBpV1(s), 230 + 5 + 10 + 100, "Energy Power 10 et 30 + menu NGU");
  const snap = idleNguSnapshot(s, { bosses: 3 }, 4000);
  assert.equal(snap.achievements.bp, 345);
  assert.equal(snap.achievements.list.length, 153);
  assert.equal(snap.achievements.list.find((a) => a.id === "secretNguMenu").unlocked, true);
}

// ---- Evil, Walderp, The Beast V1..V4 ----
{
  let s = normalizeIdleNguState({}, { bosses: 0 }, 0);
  s.difficulty = "difficile";
  s.adventure.unlockFlags.walderpFinalDefeated = true;
  s.adventure.unlockFlags.beastBrutalDefeated = true; /* ancien drapeau = V4 */
  s = advanceIdleNguState(s, 0, { bosses: 0 }, 1000);
  const u = s.systems.achievements.data.unlocked;
  assert.ok(u.secretEvil !== undefined && u.secretWalderpFinal !== undefined && u.secretBeastV4 !== undefined);
  assert.equal(u.secretBeastV1, undefined);
}
{
  const ctx = { bosses: 132, stats: { power: 1e13, toughness: 1e13 } };
  const adv = normalizeIdleAdventureStateV47({});
  const r = applyIdleAdventureActionV47(adv, { action: "titan", titan: "t6", difficulty: "normal" }, ctx, 1000);
  assert.equal(r.state.unlockFlags.beastDefeated_normal, true, "The Beast V2 = palier Normal");
  assert.equal(r.state.unlockFlags.beastDefeated_easy, undefined);
}

// ---- Bonus AP commun : Money Pit (+ succès), ITOPOD exclu ----
{
  const ctx = { bosses: 37, bestGold: 0 };
  const tous = Object.fromEntries(IDLE_ACHIEVEMENTS_V1.filter((a) => a.tracked).map((a) => [a.id, 1]));
  let s = normalizeIdleNguState({}, ctx, 1_000_000);
  s.currencies.gold = 1e9;
  s.systems.achievements.data.unlocked = tous;
  s = normalizeIdleNguState(s, ctx, 1_000_000);
  assert.equal(idleAchievementsBpV1(s), 5195);
  const r = applyIdleNguAction(s, { action: "moneyPit" }, ctx, 1_000_000);
  /* floor(log10(1e9)) = 9 ; x 1,5195 -> 13. */
  assert.equal(r.result.reward.ap, 13);
}

{
  /* Page Arbitrary Points : les kills de l'ITOPOD ne reçoivent aucun bonus AP. */
  const ctx = { adventurePower: 1e6, adventureToughness: 1e6, bosses: 100 };
  const tous = Object.fromEntries(IDLE_ACHIEVEMENTS_V1.filter((a) => a.tracked).map((a) => [a.id, 1]));
  const tour = (avecSucces, fibo = 0) => {
    let s = normalizeIdleNguState({}, ctx, 1_000_000);
    s.systems.tower.unlocked = true;
    s.systems.tower.active = true;
    if (fibo) s.systems.perks.data.levels[94] = fibo;
    if (avecSucces) s.systems.achievements.data.unlocked = Object.assign({}, tous);
    s = normalizeIdleNguState(s, ctx, 1_000_000);
    const ap0 = s.currencies.ap;
    s = advanceIdleNguState(s, 5 * 100, ctx, 2_000_000);
    assert.equal(s.systems.tower.data.kills, 100);
    return s.currencies.ap - ap0;
  };
  const sans = tour(false);
  assert.ok(sans > 0, "l'ITOPOD donne de l'AP");
  assert.equal(tour(true), sans, "succès sans effet sur l'AP de l'ITOPOD");
  /* Fibonacci 88 -> 89 : seul le palier "+2% Bonus to AP earnings" change, sans effet ici. */
  assert.equal(tour(false, 89), tour(false, 88), "Fibonacci 89 sans effet sur l'AP de l'ITOPOD");
}

// ---- Secret de Rebirth : 3 Rebirths de suite < 30 min avec boss 37 ----
{
  const MIN = 60_000;
  let s = normalizeIdleNguState({}, { bosses: 37 }, 0);
  const exp0 = s.currencies.experience;
  const power0 = s.resources.energy.power;
  let t = 0;
  const reborn = (bosses, minutes) => { t += minutes * MIN; s = rebirthIdleNguState(s, { bosses }, t); };
  reborn(37, 10);
  reborn(37, 29);
  assert.equal(s.records.speedrunStreak, 2);
  reborn(36, 10); /* boss 36 : la série repart de zéro */
  assert.equal(s.records.speedrunStreak, 0);
  reborn(40, 10);
  reborn(40, 31); /* 31 min : trop long */
  assert.equal(s.records.speedrunStreak, 0);
  assert.equal(s.records.speedrunBonusClaimed, 0);
  reborn(37, 5);
  reborn(37, 5);
  reborn(37, 5);
  assert.equal(s.records.speedrunBonusClaimed, 1);
  assert.equal(s.currencies.experience - exp0, 200, "200 EXP");
  assert.equal(s.resources.energy.power - power0, 1, "1 Energy Power");
  reborn(37, 5);
  reborn(37, 5);
  reborn(37, 5);
  assert.equal(s.currencies.experience - exp0, 200, "bonus unique");
  s = advanceIdleNguState(s, 0, { bosses: 0 }, t);
  assert.ok(s.systems.achievements.data.unlocked.secretSpeedrun !== undefined);
  assert.ok(s.systems.achievements.data.unlocked.rebirth_10 !== undefined, "11 Rebirths -> Rebirth 10 times!");
}

console.log("idle-achievements: OK");
