import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");

// La simulation lourde reste volontairement plafonnée à 15 Hz.
assert.ok(ui.includes("const intervalleFrameJeuVisibleV214=1000/15;"));
assert.ok(ui.includes("maintenantFrame-dernierFrameJeuVisibleV214>=intervalleFrameJeuVisibleV214"));
assert.ok(ui.includes("mettreAJourJeuIdleLocalV7_();"));

// Le rendu visuel léger est exécuté à chaque requestAnimationFrame, en dehors du garde 15 Hz.
const loopStart = ui.indexOf("function frameJeuV214_(timestamp)");
const loopEnd = ui.indexOf("requestAnimationFrame(frameJeuV214_)", loopStart);
const loop = ui.slice(loopStart, loopEnd);
const heavyGuardEnd = loop.indexOf("rafraichirVisuelsFluidesIdleV221_();");
assert.ok(loopStart >= 0 && loopEnd > loopStart, "boucle rAF présente");
assert.ok(heavyGuardEnd >= 0, "rendu fluide appelé à chaque frame");
assert.ok(
  loop.indexOf("mettreAJourJeuIdleLocalV7_();") < heavyGuardEnd,
  "tick lourd puis rendu visuel léger séparé"
);

// L'interpolation visuelle ne doit pas faire avancer l'état de gameplay.
const helperStart = ui.indexOf("function rafraichirVisuelsFluidesIdleV221_()");
const helperEnd = ui.indexOf("function demarrerTickerIdle_()", helperStart);
const helper = ui.slice(helperStart, helperEnd);
assert.ok(helperStart >= 0 && helperEnd > helperStart, "helper de rendu fluide présent");
assert.ok(helper.includes("Date.now()-"));
assert.ok(helper.includes("idleDernierTickLocalV40"));
assert.ok(helper.includes("mettreAJourBarreProgressionContinueV1_("));
assert.ok(!/idleEtat\.energie\s*=/.test(helper), "le rendu ne mute pas l'énergie");
assert.ok(!/idleResteTickEnergieMsV114\s*=/.test(helper), "le rendu ne mute pas l'horloge du tick");
assert.ok(!helper.includes("progresserBasicTrainingLocalIdleV120_("), "aucun calcul lourd Basic Training");
assert.ok(!helper.includes("progresserZoneFightLocalIdleV1_("), "aucun calcul lourd de combat");

console.log("idle-smooth-visual-rendering: OK");
