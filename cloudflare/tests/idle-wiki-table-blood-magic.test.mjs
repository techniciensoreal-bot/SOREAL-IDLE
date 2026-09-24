import assert from "node:assert/strict";
import { IDLE_NGU_BLOOD_RITUALS } from "../src/idle-ngu-progression.js";
import { IDLE_MACGUFFIN_BLOOD_SPELLS_V1 } from "../src/idle-macguffins-v1.js";

/*
 * Wiki, page « Blood Magic » (2026-09-24), valeurs recopiées :
 *  - tableau « Blood Rituals » : sang gagné, coût en or, temps de base (secondes) des 8 rituels ;
 *  - tableau des ratios (« Gold Per Blood » et « Blood Per Time » par rapport au rituel 1), qui doit découler des mêmes valeurs ;
 *  - tableau « The Spells » pour les sorts Blood MacGuffin α et β : sang minimum, formule, recharge ;
 *  - tableau « Blood used on Macguffin α / β Spell » pour +1 à +11 niveaux.
 */
const RITUALS = [
  ["tack", 1, 3e7, 2000], ["papercuts", 50, 1e10, 20000], ["hickey", 2000, 2e12, 200000], ["barbedWire", 60000, 4e14, 2e6],
  ["bloodBank", 1.2e6, 8e16, 2e7], ["decapitation", 1.8e7, 1.6e19, 2e8], ["woodchipper", 2.5e8, 3.2e21, 2e9], ["insideOut", 3.2e9, 6.4e23, 2e10]
];
assert.equal(IDLE_NGU_BLOOD_RITUALS.length, 8, "8 rituels");
RITUALS.forEach(([id, blood, gold, seconds], i) => {
  const r = IDLE_NGU_BLOOD_RITUALS[i];
  assert.equal(r.id, id);
  assert.equal(r.blood, blood, id + " sang");
  assert.equal(r.gold, gold, id + " or");
  assert.equal(r.baseSeconds, seconds, id + " temps de base");
});
assert.equal(IDLE_NGU_BLOOD_RITUALS[7].unlockFlag, "trollChallenge6", "le 8e rituel se débloque au Troll Challenge 6");

// Ratios publiés (arrondis à 2 décimales), par rapport au rituel 1.
// Rituel 8 : le wiki publie 66 666 666,67, mais 6 666 666,67 découle de ses propres valeurs (or 6,4e23 = 200 x le rituel 7, sang 3,2e9 et « Blood Per Time » 320,
// qui suppose bien 3,2e9). La cellule du wiki est dix fois trop grande (coquille) : on verrouille la valeur cohérente.
const GOLD_PER_BLOOD = [1, 6.67, 33.33, 222.22, 2222.22, 29629.63, 426666.67, 6666666.67];
const BLOOD_PER_TIME = [1, 5, 20, 60, 120, 180, 250, 320];
const first = IDLE_NGU_BLOOD_RITUALS[0];
IDLE_NGU_BLOOD_RITUALS.forEach((r, i) => {
  const goldRatio = (r.gold / r.blood) / (first.gold / first.blood);
  const timeRatio = (r.blood / r.baseSeconds) / (first.blood / first.baseSeconds);
  assert.ok(Math.abs(goldRatio - GOLD_PER_BLOOD[i]) <= 0.005 + GOLD_PER_BLOOD[i] * 1e-9, "ratio or/sang du rituel " + (i + 1) + " : " + goldRatio);
  assert.ok(Math.abs(timeRatio - BLOOD_PER_TIME[i]) < 1e-9, "ratio sang/temps du rituel " + (i + 1) + " : " + timeRatio);
});

// Sorts Blood MacGuffin : α = floor(log10(Blood/1e9)+1), minimum 1 Md, recharge 23,5 h ; β = floor(log20(Blood/1e6)+1), minimum 1 M, recharge 1 jour et 23,5 h.
const { alpha, beta } = IDLE_MACGUFFIN_BLOOD_SPELLS_V1;
assert.deepEqual([alpha.base, alpha.divisor, alpha.minimum, alpha.cooldownMs], [10, 1e9, 1e9, 23.5 * 3600000]);
assert.deepEqual([beta.base, beta.divisor, beta.minimum, beta.cooldownMs], [20, 1e6, 1e6, (24 + 23.5) * 3600000]);

// Sang nécessaire pour +n niveaux (table du wiki, n = 1..11).
const ALPHA_TABLE = [1e9, 1e10, 1e11, 1e12, 1e13, 1e14, 1e15, 1e16, 1e17, 1e18, 1e19];
const BETA_TABLE = [1e6, 2e7, 4e8, 8e9, 1.6e11, 3.2e12, 6.4e13, 1.28e15, 2.56e16, 5.12e17, 1.024e19];
const levelsGained = (spell, blood) => Math.floor(Math.log(blood / spell.divisor) / Math.log(spell.base) + 1 + 1e-9);
ALPHA_TABLE.forEach((blood, i) => {
  assert.equal(levelsGained(alpha, blood), i + 1, "α +" + (i + 1));
  if (i > 0) assert.equal(levelsGained(alpha, blood * 0.999), i, "α juste sous +" + (i + 1));
});
BETA_TABLE.forEach((blood, i) => {
  assert.equal(levelsGained(beta, blood), i + 1, "β +" + (i + 1));
  if (i > 0) assert.equal(levelsGained(beta, blood * 0.999), i, "β juste sous +" + (i + 1));
});

console.log("idle-wiki-table-blood-magic: OK");
