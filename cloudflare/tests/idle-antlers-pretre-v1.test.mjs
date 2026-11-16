import assert from "node:assert/strict";
import { neuf, agir, equiper, possede } from "./_antlers-aide.mjs";
import { IDLE_ADVENTURE_TITANS, idleAdventureSnapshotV47 } from "../src/idle-adventure-v47.js";
import { IDLE_TITAN_COMBAT_V1 } from "../src/idle-titans-combat-v1.js";

/*
 * Prêtre d'Exilé (LootDrop::zone30Drop + AdventureController::spawnEnemy, build 1260) : tant que « titan9Unlocked » est faux, la zone du 9e titan
 * fait apparaître le Prêtre à la place de l'Exilé. Arme équipée = Sceau (335) -> Visage (336), sinon -> Sceau (335).
 */
const CTX = { bosses: 301, difficulty: "difficile", stats: { power: 1e30, toughness: 1e30 } };
const priest = IDLE_ADVENTURE_TITANS.find(x => x.id === "priest");
const t7 = IDLE_ADVENTURE_TITANS.find(x => x.id === "t7");

/* Statistiques lues dans createEnemyTable : Attaque 2, Power 6e21, Toughness 6e21, Regen 6e20, PV 6e23. */
assert.equal(priest.boss, 190);
assert.equal(priest.p, 0, "aucun seuil de puissance : le jeu n en a pas (combat coup par coup)");
assert.equal(priest.t, 0);
assert.deepEqual(IDLE_TITAN_COMBAT_V1.priest.variantes[""], { hp: 6e23, power: 6e21, toughness: 6e21, regen: 6e20, attackRate: 2 });
assert.equal(priest.cooldown, t7.cooldown, "même minuteur de zone que l'Exilé");

const ids = s => idleAdventureSnapshotV47(s, 301, "difficile").titans.map(t => t.id);

/* Avant le déblocage : le Prêtre se montre, l'Exilé pas. */
{
  const s = neuf();
  assert.ok(ids(s).includes("priest"));
  assert.ok(!ids(s).includes("t7"));
  assert.throws(() => agir(s, { action: "titan", titan: "t7", difficulty: "easy" }, CTX), /PROGRESSION_TITAN_REQUISE/);
}
/* Pas assez de boss : rien. */
{
  assert.throws(() => agir(neuf(), { action: "titan", titan: "priest" }, { ...CTX, bosses: 189 }), /TITAN_VERROUILLE/);
  assert.throws(() => agir(neuf(), { action: "titan", titan: "priest" }, { ...CTX, difficulty: "normal" }), /DIFFICULTE_EVIL_REQUISE/);
}
/* Sans le Sceau en arme : le Sceau tombe. Avec le Sceau équipé : le Visage. Ni or ni EXP. */
{
  let r = agir(neuf(), { action: "titan", titan: "priest" }, CTX);
  assert.deepEqual(r.result.drops.map(d => d.definitionId), ["sealExile"]);
  assert.equal(r.result.gold, 0);
  assert.equal(r.result.experience, 0);
  assert.equal(r.state.itemList.sealExile.seen, true);
  /* Sceau dans le sac mais PAS équipé : encore un Sceau. */
  const r2 = agir(r.state, { action: "titan", titan: "priest" }, CTX, 1_000_000 + 10 * 3600 * 1000);
  assert.deepEqual(r2.result.drops.map(d => d.definitionId), ["sealExile"], "non équipé : encore le Sceau");
  /* Sceau équipé : le Visage. */
  let s = equiper(neuf(), "sealExile", "weapon");
  r = agir(s, { action: "titan", titan: "priest" }, CTX);
  assert.deepEqual(r.result.drops.map(d => d.definitionId), ["faceExile"]);
  assert.equal(r.state.itemList.faceExile.seen, true);
  assert.equal(possede(r.state, "sealExile"), 1, "le Sceau équipé n'est pas consommé");
}
/* Réapparition : même règle que les autres titans. */
{
  const r = agir(neuf(), { action: "titan", titan: "priest" }, CTX);
  assert.throws(() => agir(r.state, { action: "titan", titan: "priest" }, CTX, 1_000_000 + 1000), /TITAN_EN_REAPPARITION/);
}
/* Une fois l'Exilé débloqué : le Prêtre disparaît, l'Exilé se montre. */
{
  const s = neuf();
  s.unlockFlags.titan9Unlocked = true;
  assert.ok(!ids(s).includes("priest"));
  assert.ok(ids(s).includes("t7"));
  assert.throws(() => agir(s, { action: "titan", titan: "priest" }, CTX), /PROGRESSION_TITAN_REQUISE/);
  const r = agir(s, { action: "titan", titan: "t7", difficulty: "easy" }, { ...CTX, stats: { power: 2.3e22, toughness: 1.2e22 } });
  assert.equal(r.result.id, "t7");
}
/* Partie d'avant la chaîne : un Exilé déjà vaincu reste accessible, le Prêtre n'apparaît pas. */
{
  const s = neuf();
  s.titans.t7 = { kills: 3, nextAt: 0 };
  assert.ok(ids(s).includes("t7"));
  assert.ok(!ids(s).includes("priest"));
}
/* Aucun butin supplémentaire de l'Exilé tant que le set Exile n'est pas maxé ; maxé : Sac 2 % et Visage 25 %, tirages plats. */
{
  const s = neuf();
  s.unlockFlags.titan9Unlocked = true;
  const ctx = { ...CTX, stats: { power: 2.3e22, toughness: 1.2e22 } };
  let r = agir(s, { action: "titan", titan: "t7", difficulty: "easy" }, ctx);
  assert.ok(!r.result.drops.some(d => d.definitionId === "sackExile" || d.definitionId === "faceExile"));
  const m = neuf();
  m.unlockFlags.titan9Unlocked = true;
  m.completedSets.exile = true;
  const orig = Math.random;
  let n = 0;
  Math.random = () => (n++ < 2 ? 0.0 : 0.99); /* le 1er et le 2e tirage réussissent : 2 % puis 25 % */
  try {
    r = agir(m, { action: "titan", titan: "t7", difficulty: "easy" }, ctx);
  } finally { Math.random = orig; }
  const defs = r.result.drops.map(d => d.definitionId);
  assert.ok(defs.includes("sackExile"), "Sac de l'Exilé");
  assert.ok(defs.includes("faceExile"), "Visage de l'Exilé");
}
console.log("ok");
