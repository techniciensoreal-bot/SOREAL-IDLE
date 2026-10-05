import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Audit de l'entraînement de base (Norman, 2026-10-05 : « fais un audit d'Entraînement de base uniquement »). Mesuré en local, page ouverte au repos :
 * le rafraîchissement (~13 fois par seconde) réécrivait les 6 textes de chaque compétence à chaque passage, même identiques : ~156 modifications de page par seconde sans rien de nouveau, qui relançaient aussi les
 * observateurs de la page (0 après correction). Le reste est déjà sobre : une rafale de clics = UN envoi, un clic sans effet n'envoie rien.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const a = ui.indexOf("      function rafraichirBasicTrainingIdleV120_(){");
const b = ui.indexOf("      function fusionnerBasicTrainingPlusAvanceIdleV166_(");
assert.ok(a > 0 && b > a);
const corps = ui.slice(a, b);
assert.ok(!/(level|allocation|cap|nextCap|speed|eta)\.textContent\s*=/.test(corps), "plus de réécriture systématique des textes");
assert.equal((corps.match(/ecrireTexteSiChangeIdleV1_\(/g) || []).length, 6, "les six textes passent par l'écriture conditionnelle");

// L'écriture conditionnelle ne touche la page que si le texte change.
const helper = new Function(ui.slice(ui.indexOf("      function ecrireTexteSiChangeIdleV1_(el,texte){"), ui.indexOf("      function rafraichirBasicTrainingIdleV120_(){")) + "return ecrireTexteSiChangeIdleV1_;")();
let ecritures = 0;
const el = { _t: "12", get textContent() { return this._t; }, set textContent(v) { ecritures += 1; this._t = v; } };
helper(el, "12"); helper(el, "12"); assert.equal(ecritures, 0, "texte identique : aucune écriture");
helper(el, "13"); assert.equal(ecritures, 1); assert.equal(el.textContent, "13");
helper(null, "x");

// Lot des clics (classement) : toutes les 15 s au plus, et dès que l'onglet est quitté.
assert.ok(ui.includes("},15000);\n        }\n      }\n      document.addEventListener('visibilitychange',function(){\n        if(document.hidden&&idleClicsEnAttenteV1>0){"), "clics envoyés par lots de 15 s et à la sortie de l'onglet");
console.log("idle-entrainement-audit-v1: OK");
