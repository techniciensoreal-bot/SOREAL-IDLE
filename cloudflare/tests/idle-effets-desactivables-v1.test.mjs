import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Effets visuels désactivables (Norman, 2026-10-08) : l'orage et la cheminée peuvent être coupés dans les Réglages pour les téléphones moins puissants.
 * Actifs par défaut ; le réglage est mémorisé sur l'appareil (localStorage) et prévient les modules par l'évènement « soreal-effets-v1 ».
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const orage = readFileSync("cloudflare/public/modules/orage-v1.js", "utf8");
const feu = readFileSync("cloudflare/public/modules/feu-v1.js", "utf8");

assert.ok(ui.includes("soreal_idle_effet_orage_v1") && ui.includes("soreal_idle_effet_feu_v1"), "clés mémorisées sur l'appareil");
assert.ok(ui.includes("window.__basculerEffetIdleV1__=function(id,coche)") && ui.includes("new Event('soreal-effets-v1')"), "bascule + évènement");
assert.ok(ui.includes("htmlReglagesAudioIdleV1_()+\n          htmlReglagesEffetsIdleV1_()+"), "section dans les Réglages, sous l'audio");
for (const [nom, src, cle] of [["orage", orage, "soreal_idle_effet_orage_v1"], ["feu", feu, "soreal_idle_effet_feu_v1"]]) {
  assert.ok(src.includes(`localStorage.getItem('${cle}')!=='0'`) || (nom === "feu" && src.includes(`localStorage.getItem('${cle}')==='1'`)), nom + " : actif par défaut (orage), ou coupé par défaut et activé par '1' (feu, trop lourd pour un téléphone)");
  assert.ok(/volumeAmbiance_\(\)>0&&effetAutorise_\(\)/.test(src), nom + " : le réglage conditionne le démarrage");
  assert.ok(src.includes("window.addEventListener('soreal-effets-v1'"), nom + " : réagit au changement de réglage");
}
console.log("idle-effets-desactivables-v1: OK");
