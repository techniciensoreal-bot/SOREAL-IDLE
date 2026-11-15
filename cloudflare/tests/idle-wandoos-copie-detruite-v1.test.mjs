import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction } from "../src/idle-ngu-progression.js";
import { SET_ITEM_SPECIALS_V1 } from "../src/idle-adventure-set-specials-v1.js";

/*
 * Wandoos (2026-11-15, fiche « A busted copy of Wandoos 98 », « If used after maxing 98 OS levels » : « you grind the disk into a coarse powder ») :
 * une copie consommée alors que l'OS de sa source est déjà au niveau 100 est DÉTRUITE sans effet, jamais refusée.
 */
const ctx = { bosses: 100 };
const T0 = 1_000_000;
const agir = (s, p) => applyIdleNguAction(s, p, ctx, T0);
let s = normalizeIdleNguState({}, ctx, T0);
s.adventure.unlockFlags.wandoos = true; s = normalizeIdleNguState(s, ctx, T0);
s.systems.wandoos.data.osLevels = Object.assign({ moneyPit: 0, consumedXl: 0 }, s.systems.wandoos.data.osLevels, { consumed98: 100 });
s = agir(s, { action: "adventure", adventure: { action: "addItem", definitionId: "wandoos98", level: 7 } }).state;
const copie = s.adventure.inventory.find((x) => x.definitionId === "wandoos98");
assert.ok(copie, "copie présente");
const r = agir(s, { action: "consumeWandoosCopy", itemId: copie.id });
assert.equal(r.result.detruite, true, "copie détruite");
assert.equal(r.state.systems.wandoos.data.osLevels.consumed98, 100, "niveau d'OS inchangé");
assert.equal(r.state.adventure.inventory.some((x) => x.id === copie.id), false, "la copie a disparu de l'inventaire");

// A Battle Corgi : vitesse NGU 600 / 600 / 1200 (rapport des points de la fiche, gear-optimizer).
const spec = SET_ITEM_SPECIALS_V1["western:corgi"];
assert.ok(spec, "corgi présent"); assert.deepEqual(spec.find((x) => x[0] === "nguSpeedPct"), ["nguSpeedPct", 600, 600, 1200]);
console.log("idle-wandoos-copie-detruite-v1 : OK");
