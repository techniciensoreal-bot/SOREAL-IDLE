import assert from "node:assert/strict";
import {
  IDLE_ADVENTURE_ZONES,
  IDLE_ADVENTURE_ZONE_LOOT_PROFILE_V2,
  createIdleAdventureStateV47,
  applyIdleAdventureActionV47
} from "../src/idle-adventure-v47.js";

/*
 * Audit NGU 2026-09-23 (parité wiki) : les 17 zones Evil/Sadistic tiraient
 * leur butin avec un repli universel INVENTÉ (22% de set, 12% de boost,
 * 4% de spécial, force de boost = log2(1+boss/10)) et n'avaient ni plage
 * d'or ni EXP de boss. Chaque zone a maintenant son profil : taux de base et
 * plafonds "up to" de la section Loot de sa page wiki (miroir local
 * NGU-Wiki ; Fad-lands et Back To School relues via l'API MediaWiki, leurs
 * pages étant absentes du miroir à cause d'une collision de casse Windows
 * avec leur redirection).
 */

const zonesDifficiles = IDLE_ADVENTURE_ZONES.filter((z) => z.requiredDifficulty);
assert.equal(zonesDifficiles.length, 17, "17 zones Evil/Sadistic attendues");

for (const z of zonesDifficiles) {
  const p = IDLE_ADVENTURE_ZONE_LOOT_PROFILE_V2[z.id];
  assert.ok(p, `${z.id} : profil de butin manquant (retomberait sur le repli inventé)`);
  assert.equal(p.normal.boosts.length, 2, `${z.id} : deux lignes Boost sur la page wiki`);
  assert.equal(p.normal.equipment.length, 1);
  assert.equal(p.boss.equipment.length, 1);
  for (const pool of [p.normal.equipment[0], p.boss.equipment[0]]) {
    assert.equal(pool.set, z.set, `${z.id} : le set du profil doit être celui de la zone`);
    assert.equal(pool.level, 1, `${z.id} : niveau de drop 1 sur la page wiki`);
    assert.ok(pool.chance > 0 && pool.cap > pool.chance);
  }
}

// Valeurs de référence relevées sur les pages wiki (Loot > Normal enemy / Boss)
const evilverse = IDLE_ADVENTURE_ZONE_LOOT_PROFILE_V2.evilverse;
assert.deepEqual(
  evilverse.normal.boosts,
  [{ strength: 200, chance: 0.00012, cap: 0.1 }, { strength: 500, chance: 0.00012, cap: 0.1 }]
);
assert.deepEqual(evilverse.normal.equipment[0], { chance: 0.00007, cap: 0.08, set: "edgy", level: 1 });
assert.deepEqual(evilverse.boss.equipment[0], { chance: 0.00021, cap: 0.12, set: "edgy", level: 1 });
assert.deepEqual(
  IDLE_ADVENTURE_ZONE_LOOT_PROFILE_V2.radlands.boss.equipment[0],
  { chance: 6e-7, cap: 0.15, set: "rad", level: 1 }
);
assert.deepEqual(
  IDLE_ADVENTURE_ZONE_LOOT_PROFILE_V2.aethereansea.normal.equipment[0],
  { chance: 4e-9, cap: 0.05, set: "pirate", level: 1 }
);

// "Boss chance" propre à la zone (section Enemies de chaque page)
const zone = (id) => IDLE_ADVENTURE_ZONES.find((z) => z.id === id);
assert.equal(zone("evilverse").bossChance, 2 / 9);
assert.equal(zone("radlands").bossChance, 1 / 5);
assert.equal(zone("aethereansea").bossChance, 4 / 21);
assert.equal(zone("westworld").bossChance, undefined, "1/4 = valeur par défaut, aucune surcharge nécessaire");

// Niveau de drop des sets de Beardverse, Badly Drawn, Boring-Ass Earth et Chocolate : "lvl 1" sur le wiki
for (const [id, set] of [["beardverse", "beardverse"], ["badly", "badly"], ["boring", "stealth"], ["chocolate", "choco"]]) {
  const p = IDLE_ADVENTURE_ZONE_LOOT_PROFILE_V2[id];
  const pools = [...(p.normal.equipment || []), ...(p.boss.equipment || [])];
  assert.ok(pools.length > 0);
  for (const pool of pools) assert.equal(pool.level, 1, `${id} : set ${set} au niveau 1`);
}

// --- Comportement réel : un kill de boss en zone Evil, RNG forcé à "tout tombe" ---
function tuerBoss(zoneId, aleatoire) {
  const z = zone(zoneId);
  const ctx = { bosses: z.boss + 50, difficulty: z.requiredDifficulty, difficultyPeaks: {} };
  const original = Math.random;
  Math.random = () => aleatoire;
  try {
    let etat = applyIdleAdventureActionV47(createIdleAdventureStateV47(), { action: "selectZone", zone: zoneId }, ctx).state;
    return applyIdleAdventureActionV47(etat, { action: "zoneKill", forceBoss: true }, { ...ctx, forceBoss: true }).result;
  } finally {
    Math.random = original;
  }
}

{
  const r = tuerBoss("evilverse", 0);
  assert.equal(r.boss, true);
  assert.ok(r.drops.some((d) => String(d.set || "") === "edgy"), "le set Edgy doit tomber (tirage forcé)");
  assert.equal(r.experience, 30, "Exp 30 sur la page wiki");
  assert.ok(r.gold >= 2400000000 && r.gold <= 3000000000 * 1.0001, "or de boss : 2,4 à 3 milliards");
}
{
  const r = tuerBoss("evilverse", 0.999999);
  assert.equal(r.drops.length, 0, "aucun tirage ne réussit à 0,999999");
  assert.equal(r.experience, 0);
}
{
  const r = tuerBoss("aethereansea", 0);
  assert.equal(r.experience, 0, "Aethereal Sea : taux d'EXP non publié, jamais inventé");
}

console.log("idle-adventure-evil-sadistic-loot-profiles: OK");
