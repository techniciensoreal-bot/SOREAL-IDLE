import assert from "node:assert/strict";
import {
  IDLE_NGU_CATALOG_V1,
  IDLE_NGU_TIERS_V1,
  IDLE_NGU_MAX_LEVEL_V1,
  nguParamsV1,
  nguEffectPctV1,
  nguEffectsV1,
  nguLevelsFromWorkV1,
  nguSecondsForNextLevelV1
} from "../src/idle-ngu-catalog-v1.js";

/*
 * Audit NGU 2026-09-23 : les 16 vrais NGU (wiki, page "NGU") remplacent les 9
 * pistes inventées. La colonne "Max value" de chacun des 48 tableaux
 * Normal/Evil/Sadistic (valeur au niveau max de 1 milliard) sert de référence.
 */

assert.equal(IDLE_NGU_CATALOG_V1.length, 16);
assert.equal(IDLE_NGU_CATALOG_V1.filter((n) => n.resource === "energy").length, 9, "9 NGU Energy");
assert.equal(IDLE_NGU_CATALOG_V1.filter((n) => n.resource === "magic").length, 7, "7 NGU Magic");
assert.deepEqual([...IDLE_NGU_TIERS_V1], ["normal", "evil", "sadistic"]);
assert.equal(IDLE_NGU_MAX_LEVEL_V1, 1e9);

// [palier, NGU, "Max value" du wiki en %]
const MAX_WIKI = [
  ["normal", "augments", 1000000000],
  ["normal", "wandoos", 100000000],
  ["normal", "respawn", 40],
  ["normal", "gold", 1000000000],
  ["normal", "adventureAlpha", 100244.2],
  ["normal", "powerAlpha", 5000000000],
  ["normal", "dropChance", 100244.2],
  ["normal", "magicNgu", 6309.95],
  ["normal", "pp", 3154.97],
  ["normal", "yggdrasil", 5170.23],
  ["normal", "exp", 3808.29],
  ["normal", "powerBeta", 1000000000],
  ["normal", "number", 1002000],
  ["normal", "timeMachine", 12619000],
  ["normal", "energyNgu", 6309.95],
  ["normal", "adventureBeta", 7539.75],
  ["evil", "augments", 500000000],
  ["evil", "wandoos", 3163.56],
  ["evil", "respawn", 10],
  ["evil", "gold", 500000000],
  ["evil", "adventureAlpha", 1581.78],
  ["evil", "powerAlpha", 2000000000],
  ["evil", "dropChance", 3154.97],
  ["evil", "magicNgu", 3154.97],
  ["evil", "pp", 316.99],
  ["evil", "yggdrasil", 87.26],
  ["evil", "exp", 137.97],
  ["evil", "powerBeta", 500000000],
  ["evil", "number", 31549.74],
  ["evil", "timeMachine", 6310000],
  ["evil", "energyNgu", 792.48],
  ["evil", "adventureBeta", 474.35],
  ["sadistic", "augments", 400000000],
  ["sadistic", "wandoos", 476.59],
  ["sadistic", "respawn", 10],
  ["sadistic", "gold", 500114.21],
  ["sadistic", "adventureAlpha", 633.96],
  ["sadistic", "powerAlpha", 1600000000],
  ["sadistic", "dropChance", 633.99],
  ["sadistic", "magicNgu", 159.24],
  ["sadistic", "pp", 63.7],
  ["sadistic", "yggdrasil", 52],
  ["sadistic", "exp", 71.59],
  ["sadistic", "powerBeta", 500000000],
  ["sadistic", "number", 7924.82],
  ["sadistic", "timeMachine", 6309000],
  ["sadistic", "energyNgu", 397.17],
  ["sadistic", "adventureBeta", 78.72]
];
assert.equal(MAX_WIKI.length, 48);
for (const [tier, id, expected] of MAX_WIKI) {
  const got = nguEffectPctV1(tier, id, 1e9);
  const tolerance = Math.abs(expected) * 0.0015 + 1e-9; // les valeurs du wiki sont arrondies (3-5 chiffres)
  assert.ok(Math.abs(got - expected) <= tolerance, `${tier}/${id} : ${got} != ${expected} (Max value du wiki)`);
}

// Continuité au soft cap : la formule après plafond reprend la valeur linéaire (à l'arrondi du wiki près)
for (const tier of IDLE_NGU_TIERS_V1) {
  for (const def of IDLE_NGU_CATALOG_V1) {
    const p = nguParamsV1(tier, def.id);
    assert.ok(p, `${tier}/${def.id} : paramètres manquants`);
    // Respawn Evil/Sadistic : la formule du wiki (0,05 + L/(20L+200000)) a un saut de 5 % à 7,5 % au soft cap ; reproduit tel que publié.
    if (p.softCap === null || p.respawnBase !== undefined && tier !== "normal") continue;
    const before = nguEffectPctV1(tier, def.id, p.softCap);
    const after = nguEffectPctV1(tier, def.id, p.softCap + 1);
    assert.ok(Math.abs(after - before) / before < 0.02, `${tier}/${def.id} : saut au soft cap (${before} -> ${after})`);
  }
}

// Coût : niveau N -> N+1 = (N+1) x coût de base ; base 200 B pour Augments normal
assert.equal(nguSecondsForNextLevelV1("normal", "augments", 0), 2e11);
assert.equal(nguSecondsForNextLevelV1("normal", "augments", 9), 2e12);
assert.equal(nguSecondsForNextLevelV1("evil", "gold", 0), 2e21);
assert.equal(nguSecondsForNextLevelV1("sadistic", "pp", 0), 1e45);

// Niveaux gagnés à partir d'un travail cumulé (formule fermée)
assert.deepEqual(nguLevelsFromWorkV1(0, 10), { gained: 4, work: 0 }, "1+2+3+4 = 10");
assert.deepEqual(nguLevelsFromWorkV1(0, 9.5).gained, 3);
{
  const r = nguLevelsFromWorkV1(1000, 5e12);
  const total = (k) => (k * (2 * 1000 + k + 1)) / 2;
  assert.ok(total(r.gained) <= 5e12 && total(r.gained + 1) > 5e12, "le dernier niveau n'est pas payé");
}
assert.equal(nguLevelsFromWorkV1(1e9, 1e30).gained, 0, "niveau max atteint");
assert.equal(nguLevelsFromWorkV1(1e9 - 3, 1e30).gained, 3, "plafonné à 1 milliard");

// Effets combinés : ratios, multiplicatifs entre NGU d'un même effet et entre paliers
{
  const fx = nguEffectsV1({ normal: { powerAlpha: 1e9, powerBeta: 1e9 } }, "normal");
  // wiki : "Combined Power α and β is 5E16%" = (1 + 5e9 %)(1 + 1e9 %) exprimé en %
  assert.ok(Math.abs(fx.attackDefense * 100 / 5e16 - 1) < 1e-6);
  const evil = nguEffectsV1({ normal: { powerAlpha: 1e9, powerBeta: 1e9 }, evil: { powerAlpha: 1e9, powerBeta: 1e9 } }, "difficile");
  assert.ok(Math.abs(evil.attackDefense * 100 / 5e30 - 1) < 1e-2, "wiki : total combiné Normal+Evil 5e30 %");
  const hidden = nguEffectsV1({ normal: { powerAlpha: 10 }, evil: { powerAlpha: 1e9 } }, "normal");
  assert.equal(hidden.attackDefense, 1 + 10 * 5 / 100, "les effets Evil n'existent pas en difficulté Normal");
}
// Respawn : les réductions se composent par leurs restes (wiki : 40 % + 10 % -> 46 %)
{
  const fx = nguEffectsV1({ normal: { respawn: 1e9 }, evil: { respawn: 1e9 } }, "difficile");
  assert.ok(Math.abs(fx.respawnReduction - 0.46) < 1e-3);
  const sad = nguEffectsV1({ normal: { respawn: 1e9 }, evil: { respawn: 1e9 }, sadistic: { respawn: 1e9 } }, "extreme");
  assert.ok(Math.abs(sad.respawnReduction - 0.514) < 1e-3, "wiki : 51,4 % au total en Sadistic");
}

console.log("idle-ngu-real-catalog: OK");
