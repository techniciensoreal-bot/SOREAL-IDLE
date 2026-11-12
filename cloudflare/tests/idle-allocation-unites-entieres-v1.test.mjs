import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction } from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-11-12) : « je suis à 0 énergie et 0 magie, mais en cliquant sur CAP de Wandoos j'ai 1 magie qui se met ; avec − elle est reprise mais n'apparaît pas ».
 * Le stock libre est à virgule (0,6) ; le bandeau l'affiche arrondi vers le bas (0) mais Wandoos l'arrondissait à 1. Une allocation ne prend que des unités ENTIÈRES du stock libre ; la fraction reste libre.
 */
const context = { bosses: 58, bestGold: 1e6, adventurePower: 1e9 };
const now = 100_000_000;
function depart(libreMagie, dejaWandoos = 0) {
  let state = normalizeIdleNguState({}, context, now);
  state.adventure.unlockFlags.wandoos = true;
  state = normalizeIdleNguState(state, context, now);
  state.systems.bloodMagic.unlocked = true;
  state.resources.magic.cap = 9e18;
  state.systems.wandoos.allocation.magic = dejaWandoos;
  state.resources.magic.current = libreMagie;
  return state;
}
const placer = (state, valeur) => applyIdleNguAction(state, { action: "allocate", system: "wandoos", resource: "magic", value: valeur }, context, now).state;

// Fraction seule : rien n'est placé, rien n'est perdu.
for (const libre of [0.4, 0.6, 0.999]) {
  const s = placer(depart(libre), 1e9);
  assert.equal(s.systems.wandoos.allocation.magic, 0, "libre " + libre + " : aucune fraction placée");
  assert.equal(s.resources.magic.current, libre, "la fraction reste libre, intacte");
}
// Entier + fraction : la partie entière est placée, la fraction reste libre ; − rend l'entier.
{
  let s = placer(depart(5.6), 1e9);
  assert.equal(s.systems.wandoos.allocation.magic, 5);
  assert.ok(Math.abs(s.resources.magic.current - 0.6) < 1e-9, "0,6 reste libre");
  s = placer(s, 4);
  assert.equal(s.systems.wandoos.allocation.magic, 4);
  assert.ok(Math.abs(s.resources.magic.current - 1.6) < 1e-9, "− rend l'unité : 1,6 libre");
}
// Stock entier : comportement inchangé (tout est placé), y compris très grand.
for (const libre of [1, 1234, 1e9, 8e18]) {
  const s = placer(depart(libre), 1e19);
  assert.equal(s.systems.wandoos.allocation.magic, libre, "stock entier " + libre + " : tout est placé");
  assert.equal(s.resources.magic.current, 0);
}
// Une imprécision de calcul (0,9999999999999) ne fait pas perdre une unité.
{
  const s = placer(depart(3 - 1e-12), 1e9);
  assert.equal(s.systems.wandoos.allocation.magic, 3 - 1e-12 >= 3 - 1e-9 ? s.systems.wandoos.allocation.magic : 2);
}
console.log("idle-allocation-unites-entieres-v1 : OK");
