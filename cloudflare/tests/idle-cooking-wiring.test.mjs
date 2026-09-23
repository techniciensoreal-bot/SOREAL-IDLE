import assert from "node:assert/strict";
import {
  normalizeIdleNguState,
  syncIdleNguState,
  applyIdleNguAction,
  idleNguSnapshot,
  idleNguBonuses,
  rebirthIdleNguState
} from "../src/idle-ngu-progression.js";

/*
 * Cooking branché de bout en bout dans le moteur méta : déblocage par
 * IT HUNGERS (flag itHungersDefeated posé par la victoire sur le titan),
 * repas généré au déblocage, actions, snapshot sans secrets, bonus EXP
 * (state.bonuses.cookingExp -> xpMultiplier) et persistance au Rebirth
 * ("permanently increase exp gains", wiki page "Cooking").
 */
const H = 3600000;
const ctx = { bosses: 100 };
const t0 = 1_000_000;

/* Verrouillé tant qu'IT HUNGERS n'est pas vaincu. */
{
  const s = normalizeIdleNguState({}, ctx, t0);
  assert.equal(s.systems.cooking.unlocked, false);
  assert.throws(() => applyIdleNguAction(s, { action: "cooking", op: "setIngredient", index: 0, level: 1 }, ctx, t0), /SYSTEME_VERROUILLE/);
}

let state = normalizeIdleNguState({}, ctx, t0);
state.adventure.unlockFlags.itHungersDefeated = true;
state = syncIdleNguState(state, ctx, t0);
const cooking = state.systems.cooking;
assert.equal(cooking.unlocked, true, "débloqué par IT HUNGERS");
assert.ok(cooking.data.meal, "un repas est généré au déblocage");
assert.equal(cooking.data.mealNumber, 1);
assert.equal(cooking.data.bankAnchorAt, t0, "la minuterie démarre au déblocage");

/* Le repas survit à une nouvelle normalisation (pas de retirage à chaque lecture). */
{
  const cible = JSON.stringify(cooking.data.meal);
  const relu = syncIdleNguState(JSON.parse(JSON.stringify(state)), ctx, t0 + 1000);
  assert.equal(JSON.stringify(relu.systems.cooking.data.meal), cible);
}

/* Réglage des ingrédients : 6 slots de base, niveaux 0..20. */
{
  const r = applyIdleNguAction(state, { action: "cooking", op: "setIngredient", index: 2, level: 7 }, ctx, t0 + 1000);
  state = r.state;
  assert.equal(state.systems.cooking.data.levels[2], 7);
  assert.ok(r.result.efficiency > 0 && r.result.efficiency <= 1);
  assert.throws(() => applyIdleNguAction(state, { action: "cooking", op: "setIngredient", index: 6, level: 1 }, ctx, t0), /COOKING_SLOT_VERROUILLE/);
  assert.throws(() => applyIdleNguAction(state, { action: "cooking", op: "setIngredient", index: 0, level: 21 }, ctx, t0), /COOKING_NIVEAU_INVALIDE/);
  assert.throws(() => applyIdleNguAction(state, { action: "cooking", op: "rien" }, ctx, t0), /COOKING_ACTION_INCONNUE/);
  /* ROCK LOBSTER vaincu : slot 7 ouvert. */
  const avecLobster = JSON.parse(JSON.stringify(state));
  avecLobster.adventure.titans.lobster = { kills: 1, nextAt: 0 };
  const r7 = applyIdleNguAction(avecLobster, { action: "cooking", op: "setIngredient", index: 6, level: 3 }, ctx, t0 + 2000);
  assert.equal(r7.state.systems.cooking.data.levels[6], 3);
}

/* Manger : refusé tant que le gain par repas n'est pas sourcé, même repas prêt. */
assert.throws(
  () => applyIdleNguAction(state, { action: "cooking", op: "eat" }, ctx, t0 + 30 * H),
  /COOKING_GAIN_REPAS_NON_DOCUMENTE/
);

/* Snapshot : vue publique, sans cibles/poids/paires. */
{
  const snap = idleNguSnapshot(state, ctx, t0 + 2 * H);
  const sys = snap.systems.find(x => x.id === "cooking");
  assert.ok(sys && sys.state && sys.state.unlocked);
  const json = JSON.stringify(sys.state);
  assert.doesNotMatch(json, /"target"|"weight"|"pairs"|"meal":/);
  assert.equal(sys.state.data.ingredients.length, 8);
  assert.equal(sys.state.data.unlockedSlots, 6);
  assert.equal(sys.state.data.ingredients[2].level, 7);
  assert.equal(sys.state.data.totalCookingBonusesPct, 100);
  assert.equal(sys.state.data.mealExpGainPct, null);
  assert.equal(sys.state.data.mealExpGainDocumented, false);
  assert.equal(sys.state.data.totalExpGainMaxPct, 300);
  assert.equal(sys.state.data.timer.mealMs, 23.5 * H);
  assert.equal(sys.state.data.timer.readyInMs, 21.5 * H);
  assert.ok(sys.state.data.efficiencyPct > 0 && sys.state.data.efficiencyPct <= 100);
}

/* Total Exp Gain -> state.bonuses.cookingExp -> xpMultiplier x(1 + total). */
{
  const base = idleNguBonuses(state).xpMultiplier;
  const avec = JSON.parse(JSON.stringify(state));
  avec.systems.cooking.data.totalExpGainPct = 100;
  const synced = syncIdleNguState(avec, ctx, t0 + 3 * H);
  assert.equal(synced.bonuses.cookingExp, 1);
  assert.ok(Math.abs(idleNguBonuses(synced).xpMultiplier - base * 2) < 1e-9 * base);
  /* Plafond de 300 % même sur une sauvegarde corrompue. */
  avec.systems.cooking.data.totalExpGainPct = 999;
  assert.equal(syncIdleNguState(avec, ctx, t0 + 3 * H).bonuses.cookingExp, 3);
}

/* Persistance au Rebirth : total, repas et minuterie conservés. */
{
  const avant = JSON.parse(JSON.stringify(state));
  avant.systems.cooking.data.totalExpGainPct = 42;
  const apres = rebirthIdleNguState(avant, ctx, t0 + 12 * H);
  const reborn = apres.state || apres;
  assert.equal(reborn.systems.cooking.unlocked, true);
  assert.equal(reborn.systems.cooking.data.totalExpGainPct, 42);
  assert.equal(reborn.bonuses.cookingExp, 0.42);
  assert.equal(JSON.stringify(reborn.systems.cooking.data.meal), JSON.stringify(state.systems.cooking.data.meal));
  assert.equal(reborn.systems.cooking.data.bankAnchorAt, t0);
}

/* Équipement réel : Regular Pants (jambes) compte double, The Joker (accessoire) simple. */
{
  let s = JSON.parse(JSON.stringify(state));
  for (const definitionId of ["grb:legs", "theJoker"]) {
    s = applyIdleNguAction(s, { action: "adventure", adventure: { action: "addItem", definitionId, level: 0 } }, ctx, t0 + 4 * H).state;
  }
  const pants = s.adventure.inventory.find(x => x.definitionId === "grb:legs");
  const joker = s.adventure.inventory.find(x => x.definitionId === "theJoker");
  s = applyIdleNguAction(s, { action: "adventure", adventure: { action: "equip", id: pants.id, slot: "legs" } }, ctx, t0 + 4 * H).state;
  s = applyIdleNguAction(s, { action: "adventure", adventure: { action: "equip", id: joker.id, slot: "accessory" } }, ctx, t0 + 4 * H).state;
  const snap = idleNguSnapshot(s, ctx, t0 + 4 * H);
  const d = snap.systems.find(x => x.id === "cooking").state.data;
  assert.equal(d.bonuses.gearCount, 3);
  assert.ok(Math.abs(d.totalCookingBonusesPct - Math.pow(1.03, 3) * 100) < 1e-9);
}

console.log("idle-cooking-wiring: OK");
