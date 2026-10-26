import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-26) : « quand on fait un nuke, un bruit de mitraillette qui dure tant que le popup des boss enchaînés est présent ; pas un truc aigu ». Le son est lancé à l'apparition du popup et coupé à sa disparition ; il est grave
 * (tirs filtrés vers le bas, aucun sifflement).
 */
const audio = readFileSync("cloudflare/public/modules/audio-effects-v199.js", "utf8");
assert.ok(audio.includes("function mitraillette_(marche)") && audio.includes("mitraillette:mitraillette_,"), "le son est exposé");
const coup = audio.slice(audio.indexOf("function mitrailletteCoup_"), audio.indexOf("function mitraillette_(marche)"));
assert.ok(coup.includes('filterType:"lowpass"') && !coup.includes("highpass"), "tirs filtrés vers le bas, pas de sifflement");
assert.ok(/from:f,to:52/.test(coup) && coup.includes("150+Math.random()*45"), "boum grave");
assert.ok(audio.includes("clearTimeout(mitrailletteEtat_.minuterie)"), "l'arrêt coupe la suite des tirs");

const combat = readFileSync("cloudflare/public/modules/ui-combat-2-v1.js", "utf8");
const cascade = combat.slice(combat.indexOf("function lancerCascadeNukeIdleV1_("), combat.indexOf("function exploserBossNukeIdleV1_"));
const iDebut = cascade.indexOf("audioNuke.mitraillette(true)");
const iFin = cascade.indexOf("audioNuke.mitraillette(false)");
assert.ok(iDebut > 0 && iFin > iDebut, "lancé avec le popup, coupé quand il disparaît");
assert.ok(iDebut > cascade.indexOf("document.body.appendChild("), "après l'apparition du popup");
assert.ok(iFin < cascade.indexOf("overlay.remove()"), "coupé avant le retrait du popup");

console.log("idle-nuke-mitraillette-v1: OK");
