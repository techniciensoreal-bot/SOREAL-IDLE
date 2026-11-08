import assert from "node:assert/strict";
import fs from "node:fs";
import { IDLE_NGU_DIGGERS, normalizeIdleNguState, applyIdleNguAction, idleNguTimeMachineGrossGoldPerSecond } from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-11-08) : « dans Mineurs, quand on clique sur le bouton Maximum, il doit nous mettre au maximum que notre or peut supporter ». « Au maximum » demande le niveau le plus haut possédé avec ajustement (fit) :
 * le moteur ramène le niveau au plus haut dont la consommation d'or, avec celle des autres mineurs au travail, tient dans l'or par seconde brut.
 */
const context = { bosses: 82, bestGold: 1e15 };
let state = normalizeIdleNguState({}, context, 1_000_000);
state.adventure.unlockFlags.diggers = true;
state = normalizeIdleNguState(state, context, 1_000_000);
state.currencies.gold = 1e18;
state.systems.timeMachine.data.bestGoldThisRun = 1e15;
state.systems.timeMachine.data.highestBossEver = 82;
state.systems.timeMachine.data.speedLevel = 50;
const gross = idleNguTimeMachineGrossGoldPerSecond(state);
state = applyIdleNguAction(state, { action: "upgradeDigger", digger: "drop" }, context, 1_000_000).state;
const def = IDLE_NGU_DIGGERS.find((x) => x.id === "drop");
const drain = (l) => (l <= 0 ? 0 : def.drain * Math.pow(def.growth, l - 1));
const d = state.systems.diggers.data.diggers.drop;
d.maxLevel = 400;   // beaucoup plus de niveaux possédés que l'or n'en supporte
let attendu = 0; while (attendu < 400 && drain(attendu + 1) <= gross) attendu += 1;
assert.ok(attendu >= 2 && attendu < 400, "scénario utile : le maximum supporté est entre 2 et 399 (" + attendu + ")");

// sans ajustement : comportement d'avant (le travail au-delà de l'or est refusé)
state = applyIdleNguAction(state, { action: "setDiggerLevel", digger: "drop", level: 1 }, context, 1_000_000).state;
state = applyIdleNguAction(state, { action: "toggleDigger", digger: "drop", active: true }, context, 1_000_000).state;
assert.throws(() => applyIdleNguAction(state, { action: "setDiggerLevel", digger: "drop", level: 400 }, context, 1_000_000), /GPS_INSUFFISANT/, "sans fit : refusé comme avant");

// avec ajustement : le plus haut niveau supporté, et le mineur reste au travail
const r = applyIdleNguAction(state, { action: "setDiggerLevel", digger: "drop", level: 400, fit: true }, context, 1_000_000).state.systems.diggers.data.diggers.drop;
assert.equal(r.runLevel, attendu, "Au maximum = plus haut niveau que l'or par seconde supporte");
assert.equal(r.active, true, "il reste au travail");
assert.ok(drain(r.runLevel) <= gross && drain(r.runLevel + 1) > gross, "un niveau de plus ne passerait plus");

// au repos : même niveau, sans le mettre au travail
const repos = applyIdleNguAction(state, { action: "toggleDigger", digger: "drop", active: false }, context, 1_000_000).state;
const r2 = applyIdleNguAction(repos, { action: "setDiggerLevel", digger: "drop", level: 400, fit: true }, context, 1_000_000).state.systems.diggers.data.diggers.drop;
assert.equal(r2.runLevel, attendu);
assert.equal(r2.active, false);

// une demande plus basse que le supporté n'est pas relevée
const bas = applyIdleNguAction(state, { action: "setDiggerLevel", digger: "drop", level: 2, fit: true }, context, 1_000_000).state.systems.diggers.data.diggers.drop;
assert.equal(bas.runLevel, 2);

// le bouton de la page demande l'ajustement
const page = fs.readFileSync("cloudflare/public/modules/mineurs-page-v1.js", "utf8");
assert.ok(page.includes("+max+',true)\">Au maximum</button>"), "bouton « Au maximum » : fit demandé");
const ui = fs.readFileSync("cloudflare/public/modules/ui-aventure-1-v1.js", "utf8");
assert.ok(ui.includes("function setDiggerIdleV47_(id,niveau,ajuster)") && ui.includes("p.fit=true"), "le client transmet fit au moteur");
console.log("idle-mineurs-au-maximum-v1: OK (niveau supporté " + attendu + ")");
