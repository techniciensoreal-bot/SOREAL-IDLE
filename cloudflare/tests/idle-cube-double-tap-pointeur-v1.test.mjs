import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-09) : « le double tap sur le cube de l'infini n'avale plus les boosts ». Cause : le Cube porte data-soreal-longpress (popup au maintien) et le module de maintien appelle preventDefault
 * sur touchstart, ce qui supprime le « click » tactile : le double tap compté dans le clic ne se déclenchait plus. Le tap est maintenant détecté au relâchement du doigt (pointerup).
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const lp = readFileSync("cloudflare/public/modules/long-press-v200.js", "utf8");
assert.ok(lp.includes("if(event.cancelable)event.preventDefault();") && lp.includes("touchstart"), "le module de maintien supprime bien le clic tactile (raison du correctif)");
assert.ok(ui.includes("data-idle-cube-drop-v180") && ui.includes('data-soreal-longpress="idle-cube"'), "le Cube porte le maintien");
assert.ok(ui.includes("function toucherCubeAdventureIdleV1_()") && ui.includes("toucherCubeAdventureIdleV1_();\n          return;") || ui.includes("toucherCubeAdventureIdleV1_();"), "le clic passe par la fonction commune");
assert.ok(ui.includes("document.addEventListener('pointerup',function(event){\n          const p=idleCubeAppuiV1;"), "le tap est détecté au relâchement");
assert.ok(ui.includes("if(maintenant-idleCubeDernierEvtMsV1<80)return;"), "pointerup + clic collés = un seul appui");
assert.ok(ui.includes("Math.hypot(event.clientX-p.x,event.clientY-p.y)>20||Date.now()-p.t>550"), "ni glissement ni maintien ne comptent comme un tap");
assert.ok(ui.includes("if(!gestesAchetesIdleV1_().double)return;"), "le double tap acheté reste requis");
console.log("idle-cube-double-tap-pointeur-v1: OK");
