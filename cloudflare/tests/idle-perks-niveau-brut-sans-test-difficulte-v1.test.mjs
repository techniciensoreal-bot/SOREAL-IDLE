import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction } from "../src/idle-ngu-progression.js";
import { idlePerkNiveauxV1, IDLE_PERK_SANS_TEST_DIFFICULTE_V1, IDLE_PERK_DIFFICULTE_V1 } from "../src/idle-difficulty-gates-v1.js";
import { perkBonusesV1 } from "../src/idle-perks-v1.js";

/*
 * Audit 2026-11-22 (IL build 1260) : le jeu ne teste la difficulté (perkDifficultyReq[i]) que dans perkEffect, energyPower2..5, stat3Bonus, stat5Bonus,
 * drop2, wish1, res3*, ngu1..3, sadBoss, questHandinRatio, stat6, adventureStats5, aug1. Les autres atouts lisent perkLevel[i] SANS test : leur niveau
 * acheté reste actif même si la difficulté courante est plus basse. L'ACHAT, lui, reste refusé (DIFFICULTE_REQUISE).
 */
const etat = (difficulty, levels) => {
  const s = normalizeIdleNguState({ difficulty }, { bosses: 300 }, 0);
  s.systems.perks.unlocked = true;
  Object.assign(s.systems.perks.data.levels, levels);
  return s;
};

// Groupes lus bruts par le jeu : un test par groupe (en Normal, alors que tous exigent Evil ou Sadistic pour l'ACHAT).
const groupes = {
  "MacGuffin Daycare (56) et MacGuffins (67, 70, 71, 73, 88)": [56, 67, 70, 71, 73, 88],
  "Iron Pill, dons et autres (83-87)": [83, 84, 85, 86, 87],
  "Quêtes (89-92, 106, 145)": [89, 90, 91, 92, 106, 145],
  "Respawn (93)": [93],
  "Souhaits et Boosted Boosts (107, 109, 110, 112)": [107, 109, 110, 112],
  "Hack Milestones (113-115, 217-219)": [113, 114, 115, 217, 218, 219]
};
for (const [nom, ids] of Object.entries(groupes)) {
  const s = etat("normal", Object.fromEntries(ids.map((id) => [id, 1])));
  const actifs = idlePerkNiveauxV1(s);
  for (const id of ids) {
    assert.ok(IDLE_PERK_DIFFICULTE_V1[id] >= 1, `${nom} : l'achat de ${id} exige Evil ou Sadistic`);
    assert.equal(actifs[id], 1, `${nom} : le niveau ${id} lu BRUT par le jeu reste actif en Normal`);
    assert.ok(IDLE_PERK_SANS_TEST_DIFFICULTE_V1.includes(id));
  }
}

// Les consommateurs qui testent la difficulté dans le jeu restent filtrés (Energy Power II = 57.., Sadistic 126.., Rich Perks III = 82).
{
  const s = etat("normal", { 57: 5, 82: 5, 126: 5, 149: 1 });
  const actifs = idlePerkNiveauxV1(s);
  for (const id of [57, 82, 126, 149]) assert.equal(actifs[id], undefined, `perkEffect : ${id} reste coupé en dessous de sa difficulté`);
}
// Evil : un atout Sadistic lu par perkEffect reste coupé, un atout brut Sadistic (217) reste actif.
{
  const s = etat("difficile", { 126: 5, 217: 1, 57: 5 });
  const actifs = idlePerkNiveauxV1(s);
  assert.equal(actifs[126], undefined);
  assert.equal(actifs[217], 1);
  assert.equal(actifs[57], 5);
}

// Effet réel : la réduction des paliers de hacks (113) agit en Normal ; l'énergie du Sadistic (126) non.
{
  const s = etat("normal", { 113: 2, 126: 5 });
  const b = perkBonusesV1(idlePerkNiveauxV1(s));
  assert.ok(Object.values(b.hackMilestoneReduction).some((v) => v === 2), "hack milestone : niveau brut actif en Normal");
  const base = perkBonusesV1(idlePerkNiveauxV1(etat("normal", {})));
  assert.equal(b.energyPowerMultiplier ?? 1, base.energyPowerMultiplier ?? 1, "126 (Sadistic, perkEffect) reste coupé en Normal");
}

// Achat : toujours gardé par la difficulté.
assert.throws(() => applyIdleNguAction(Object.assign(etat("normal", {}), { currencies: { ...etat("normal", {}).currencies, pp: 1e12 } }), { action: "buyPerk", perkId: 113 }, { bosses: 300 }, 1000), /DIFFICULTE_REQUISE/);

console.log("idle-perks-niveau-brut-sans-test-difficulte-v1: OK");
