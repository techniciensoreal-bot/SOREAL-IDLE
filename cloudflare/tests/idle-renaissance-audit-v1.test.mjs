import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Audit de Renaissance (Norman, 2026-10-05 : « fais un audit de Renaissance uniquement »). Mesuré en local :
 *  - ouvrir le menu : aucun appel (seulement « marqué vu » à la première visite) ; Renaître : UN appel (renaitreSorealIdle), dont la réponse contient l'état complet, sans lecture supplémentaire ; côté serveur ~58 ms ;
 *  - la page ne se redessine pas ; seul le suivi en direct (Rebirth Time Factor, NUMBER au Rebirth, Variation) écrit dans la page chaque seconde : il ne réécrit plus un texte identique.
 */
const src = readFileSync("cloudflare/public/modules/rebirth-live-v1.js", "utf8");
let ecritures = 0;
const el = { _t: "×1,0000", get textContent() { return this._t; }, set textContent(v) { ecritures += 1; this._t = v; }, classList: { toggle() {} } };
const fen = {};
vm.runInNewContext(src, { window: fen, document: { getElementById: () => null }, setInterval: () => 0, Math, Number, String });
const L = fen.__SOREAL_IDLE_REBIRTH_LIVE_V1__;
L.ecrire(el, "×1,0000"); L.ecrire(el, "×1,0000");
assert.equal(ecritures, 0, "texte identique : aucune écriture");
L.ecrire(el, "×1,0001");
assert.equal(ecritures, 1);
L.ecrire(null, "x");
assert.ok(!/\.textContent\s*=(?!=)/.test(src.replace("el.textContent=texte;", "")), "plus d'écriture systématique du texte");

// Renaître : une seule opération, dont la réponse remplace l'état (aucune lecture en plus).
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const a = ui.indexOf("          .renaitreSorealIdle(");
const avant = ui.slice(ui.lastIndexOf("function executerRenaissanceIdleV63_", a), a);
assert.ok(avant.includes("idleEtat=\n              res.joueur;") && !/obtenirEtatSorealIdle|synchroniserJeuIdleV7_/.test(avant), "la réponse de Renaître fait l'état : pas de lecture ni de synchro derrière");
console.log("idle-renaissance-audit-v1: OK");
