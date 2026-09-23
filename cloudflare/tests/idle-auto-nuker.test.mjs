import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * 2026-09-23 : Auto Nuker (Sellout Shop, wiki) -- nuke automatique 10 s après le début de
 * chaque rebirth, puis toutes les minutes. Test au niveau source + logique d'échéance.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
assert.ok(ui.includes("function autoNukeDueIdleV1_("), "la fonction d'échéance existe");
assert.ok(ui.includes("achats.autoNuker"), "le timer lit l'achat autoNuker");

const m = ui.match(/function autoNukeDueIdleV1_\(([^)]*)\)\{([\s\S]*?)\n      \}\n/);
assert.ok(m, "corps extractible");
const due = new Function(...m[1].split(","), m[2]);
const t0 = 1_000_000_000_000;
assert.equal(due(0, 0, t0), false, "pas de run connu");
assert.equal(due(t0, 0, t0 + 9_000), false, "avant 10 s");
assert.equal(due(t0, 0, t0 + 10_000), true, "à 10 s");
assert.equal(due(t0, t0 + 10_000, t0 + 69_000), false, "moins d'une minute après");
assert.equal(due(t0, t0 + 10_000, t0 + 70_000), true, "une minute après");
console.log("idle-auto-nuker ok");
