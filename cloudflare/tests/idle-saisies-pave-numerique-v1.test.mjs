import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-12) : « dans Augmentations, la saisie Cible ouvre directement le pavé numérique ; il faut que ce soit comme ça pour l'entièreté des zones de saisie sauf celle du pseudo ». */
const lire = (f) => readFileSync("cloudflare/public/" + f, "utf8");
const ui = lire("soreal-idle-ui.js"), meta = lire("modules/meta-progression-v130.js"), bm = lire("modules/blood-magic-v1.js"), ngu = lire("modules/ngu-labo-v1.js"), alloc = lire("modules/barre-allocation-v1.js"), perso = lire("modules/perso-boutons-v1.js");
// tous les champs « Input » (nombre ou fraction) ouvrent le pavé numérique
assert.ok(bm.includes('<input id="sorealIdleBloodInputV1" type="text" inputmode="decimal" '), "Input de Blood Magic");
assert.equal((meta.match(/<input id="sorealIdleAugInputV1" type="text" inputmode="decimal" /g) || []).length, 2, "Input des Augmentations (deux rendus)");
assert.ok(meta.includes('<input id="sorealIdleTmInputV1" type="text" inputmode="decimal" '), "Input de la Machine temporelle");
assert.ok(ngu.includes('<input id="sorealIdleAugInputV1" type="text" inputmode="decimal" '), "Input des NGU");
assert.ok(alloc.includes('type="text" inputmode="decimal" '), "Input des barres d'allocation");
assert.ok(/id="sorealIdleTrainingInputV120"\s+type="text"\s+inputmode="decimal"/.test(ui), "Input de Basic Training");
assert.ok(perso.includes('type="text" inputmode="decimal"'), "fenêtre de saisie des boutons personnalisés");
// aucun champ numérique sans inputmode ; le pseudo reste un champ texte
for (const [nom, src] of [["ui", ui], ["meta", meta], ["ngu", ngu], ["alloc", alloc]]) {
  for (const m of src.matchAll(/<input[^>]*type="number"[^>]*>/g)) assert.ok(/inputmode="(numeric|decimal)"/.test(m[0]), nom + " : champ numérique sans pavé numérique : " + m[0].slice(0, 80));
}
const pseudo = ui.match(/<input id="sorealIdlePseudoChampV1"[^>]*>/)[0];
assert.ok(pseudo.includes('type="text"') && !pseudo.includes("inputmode"), "le pseudo garde le clavier normal");
console.log("idle-saisies-pave-numerique-v1: OK");
