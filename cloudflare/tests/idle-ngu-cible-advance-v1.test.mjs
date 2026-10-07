import assert from "node:assert/strict";
import { normalizeIdleNguState, advanceIdleNguState, applyIdleNguAction, idleNguSnapshot } from "../src/idle-ngu-progression.js";

/*
 * Écran NGU (Norman, 2026-10-08, capture de NGU Idle) : un « Target » par NGU et la case « Advance Energy ». Même règle que l'Entraînement avancé : à l'atteinte du Target, l'énergie du NGU est rendue ;
 * avec « Advance Energy » elle passe au NGU suivant de la liste (même ressource) qui n'a pas atteint son propre Target.
 */
const context = { bosses: 58, bestGold: 1e6, adventurePower: 1e9 };
function depart() {
  let s = normalizeIdleNguState({}, context, 1_000_000);
  s.adventure.unlockItems.aNumber = true;
  s = applyIdleNguAction(s, { action: "adventure", adventure: { mode: "consumeUnlock", itemId: "aNumber" } }, context, 1_000_000).state;
  s.resources.energy.cap = 100000;
  s.resources.energy.current = 100000;
  s.resources.energy.power = 1e8;
  return s;
}
const agir = (s, a, t = 1_000_000) => applyIdleNguAction(s, a, context, t).state;
const vue = (s, t = 1_000_000) => idleNguSnapshot(s, context, t).ngus.tiers.normal;
const ngu = (s, id) => s.systems.ngu.data.ngus.normal[id];
const ordre = ["augments", "wandoos", "respawn", "gold", "adventureAlpha", "powerAlpha", "dropChance", "magicNgu", "pp"];

// 1. Données : cible à 0 par défaut, jamais de case cochée ; le snapshot les expose
{
  const s = depart();
  assert.equal(ngu(s, "augments").target, 0);
  assert.deepEqual(s.systems.ngu.data.advance, { energy: false, magic: false });
  const snap = idleNguSnapshot(s, context, 1_000_000).ngus;
  assert.equal(snap.advance.energy, false);
  assert.ok(vue(s).every((n) => n.target === 0), "target exposée pour chaque NGU");
}
// 2. Poser un Target : borné, mémorisé
{
  let s = depart();
  s = agir(s, { action: "setNguTarget", ngu: "gold", value: 12.9 });
  assert.equal(ngu(s, "gold").target, 12, "arrondi inférieur");
  s = agir(s, { action: "setNguTarget", ngu: "gold", value: -5 });
  assert.equal(ngu(s, "gold").target, 0, "jamais négatif");
  assert.throws(() => agir(s, { action: "setNguTarget", ngu: "n'importe quoi", value: 1 }), /NGU_INVALIDE/);
  /* NGU de magie : même règle une fois la magie découverte (le verrou serveur MAGIC_VERROUILLEE reste le garde-fou avant). */
  s = agir(s, { action: "setNguTarget", ngu: "yggdrasil", value: 7 });
  assert.equal(ngu(s, "yggdrasil").target, 7);
  s = agir(s, { action: "setNguAdvance", resource: "magic", enabled: true });
  assert.equal(idleNguSnapshot(s, context, 1_000_000).ngus.advance.magic, true);
}
// 3. Sans « Advance Energy » : à l'atteinte du Target, l'énergie est rendue
{
  let s = depart();
  s = agir(s, { action: "allocateNgu", ngu: "powerAlpha", value: 40000 });
  s = agir(s, { action: "setNguTarget", ngu: "powerAlpha", value: 1 });
  assert.equal(ngu(s, "powerAlpha").allocation, 40000, "Target pas encore atteint : l'énergie reste");
  const libreAvant = s.resources.energy.current;
  s = advanceIdleNguState(s, 20000, context, 21_000_000);
  assert.ok(ngu(s, "powerAlpha").level >= 1, "le NGU a gagné au moins un niveau");
  assert.equal(ngu(s, "powerAlpha").allocation, 0, "Target atteint : l'énergie est retirée");
  assert.ok(s.resources.energy.current >= libreAvant + 40000 - 1, "énergie rendue au joueur");
  // une nouvelle allocation sur un NGU déjà au Target est aussitôt rendue
  s = agir(s, { action: "allocateNgu", ngu: "powerAlpha", value: 1000 }, 22_000_000);
  assert.equal(ngu(s, "powerAlpha").allocation, 0, "pas d'énergie gardée sur un NGU qui a déjà son Target");
}
// 4. Avec « Advance Energy » : l'énergie passe au NGU suivant (dans l'ordre de l'écran) qui n'a pas atteint son Target
{
  let s = depart();
  s = agir(s, { action: "setNguAdvance", resource: "energy", enabled: true });
  assert.equal(idleNguSnapshot(s, context, 1_000_000).ngus.advance.energy, true);
  s = agir(s, { action: "allocateNgu", ngu: "powerAlpha", value: 40000 });
  s = agir(s, { action: "setNguTarget", ngu: "powerAlpha", value: 1 });
  s = advanceIdleNguState(s, 20000, context, 21_000_000);
  assert.equal(ngu(s, "powerAlpha").allocation, 0, "l'énergie quitte le NGU qui a atteint son Target");
  assert.equal(ngu(s, "dropChance").allocation, 40000, "elle passe au NGU suivant de la liste : Drop Chance");
  // le suivant a lui aussi un Target atteint : on saute au suivant encore
  let t = depart();
  t = agir(t, { action: "setNguAdvance", resource: "energy", enabled: true });
  t = agir(t, { action: "allocateNgu", ngu: "powerAlpha", value: 40000 });
  t.systems.ngu.data.ngus.normal.dropChance.level = 5;
  t = agir(t, { action: "setNguTarget", ngu: "dropChance", value: 3 });
  t = agir(t, { action: "setNguTarget", ngu: "powerAlpha", value: 1 });
  t = advanceIdleNguState(t, 20000, context, 21_000_000);
  assert.equal(ngu(t, "dropChance").allocation, 0, "un NGU qui a déjà son Target ne reçoit pas l'énergie");
  assert.equal(ngu(t, "magicNgu").allocation, 40000, "elle saute au suivant : Magic NGU");
  // dernier de la liste : rien après, l'énergie est rendue
  let u = depart();
  u = agir(u, { action: "setNguAdvance", resource: "energy", enabled: true });
  u = agir(u, { action: "allocateNgu", ngu: "pp", value: 40000 });
  u.systems.ngu.data.ngus.normal.pp.level = 4;
  u = agir(u, { action: "setNguTarget", ngu: "pp", value: 2 });
  assert.equal(ngu(u, "pp").allocation, 0, "pas de NGU suivant : l'énergie est simplement rendue");
}
// 5. L'énergie ne se perd ni ne se crée : total alloué + libre inchangé
{
  let s = depart();
  s = agir(s, { action: "setNguAdvance", resource: "energy", enabled: true });
  s = agir(s, { action: "allocateNgu", ngu: "augments", value: 30000 });
  s = agir(s, { action: "setNguTarget", ngu: "augments", value: 1 });
  const total = () => Object.values(s.systems.ngu.data.ngus.normal).reduce((t, n) => t + n.allocation, 0) + s.resources.energy.current;
  const avant = total();
  s = advanceIdleNguState(s, 30000, context, 31_000_000);
  assert.ok(Math.abs(total() - avant) < 1e-3 + avant * 1e-9, "conservation de l'énergie");
  assert.equal(s.systems.ngu.allocation.energy, Object.values(s.systems.ngu.data.ngus.normal).reduce((t, n) => t + n.allocation, 0), "total du système cohérent");
}
// 6. Les ordres des NGU d'énergie suivent l'écran du jeu
assert.deepEqual(vue(depart()).filter((n) => n.resource === "energy").map((n) => n.id), ordre, "même ordre que l'écran de NGU Idle");
console.log("idle-ngu-cible-advance-v1: OK");
