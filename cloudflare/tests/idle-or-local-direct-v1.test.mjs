import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
/* Norman (2026-10-10) : l'Or doit être contrôlé « assez vite » dans tous les menus qui en demandent : l'Or gagné par seconde est ajouté localement entre deux synchros (avant, seule la dépense était rejouée). */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const i = ui.indexOf("Or EN DIRECT (Norman, 2026-10-10");
assert.ok(i > 0, "bloc présent");
const bloc = ui.slice(i, i + 2200);
assert.ok(bloc.includes("vueMachine&&vueMachine.netGps") && bloc.includes("monnaiesOr.gold=idleNombre_(monnaiesOr.gold)+gps*dtOr"), "l'Or net par seconde est ajouté");
assert.ok(bloc.includes("Math.min(5,"), "un long arrêt de l'onglet ne crédite pas des minutes d'un coup (plafond 5 s)");
assert.ok(bloc.includes("patcherResumeStatsIdleV28_"), "le compteur d'Or affiché suit");
// le crédit local vient AVANT le rejeu des niveaux d'Augments et des rituels (qui lisent ce même compteur)
assert.ok(i < ui.indexOf("const augVisual=idleEtat.__augmentationsVisualV215;"), "crédit avant le rejeu des achats");
// simulation de la logique : sans crédit local la piste reste « en attente » alors que la machine a produit l'Or
function manque(or, cout) { return or + 1e-9 < cout; }
let or = 100, cout = 130; const gps = 20;
assert.equal(manque(or, cout), true, "synchro : 100 Or, il en manque");
or += gps * 2; // 2 s plus tard, sans attendre la synchro
assert.equal(manque(or, cout), false, "avec le crédit local, le niveau est acheté tout de suite");
console.log("idle-or-local-direct-v1: OK");
