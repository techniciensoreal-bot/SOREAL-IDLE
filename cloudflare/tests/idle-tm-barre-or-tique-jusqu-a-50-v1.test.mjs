import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
/* Barre d'Or de la Time Machine (Norman, 2026-10-11) : plafonnée à 50 tiques par seconde seulement ; avant, elle devait tiquer de plus en plus vite (elle s'arrêtait de tiquer dès 16 par seconde). */
const src = readFileSync(new URL("../public/modules/meta-progression-v130.js", import.meta.url), "utf8");
const i = src.indexOf("function styleBarreOrTimeMachineIdleV1_");
const fn = src.slice(i, src.indexOf("function patcherChiffresTimeMachineIdleV1_", i));
assert.ok(fn.includes("Math.min(50,"), "plafond à 50 tiques par seconde");
assert.ok(!fn.includes("1/16") && fn.includes("if(n>=50)return {classe:'rapide',style:''};") && fn.split("'rapide'").length===2, "pas de scintillement avant le plafond ; pleine (rapide) seulement à 50 (Norman, 2026-10-13)");
console.log("idle-tm-barre-or-tique-jusqu-a-50-v1: OK");
