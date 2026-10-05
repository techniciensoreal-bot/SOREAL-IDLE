import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Audit d'Aventure (Norman, 2026-10-05 : « fais un audit de Aventure uniquement »). Mesuré en local :
 *  - au repos, les raccourcis (disabled, hidden, aria-pressed, textes) étaient réassignés ~15 fois par seconde : ~187 modifications de page par seconde, 0 après correction ;
 *  - en combat, les cartes de statistiques réécrivaient tous leurs chiffres à chaque rendu : ~122 -> ~51 modifications par seconde (il reste les barres de vie et le journal, qui changent vraiment).
 * Appels : aucun appel en plus (l'action d'Aventure part par lot, la synchro est celle de 15 s).
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const a = ui.indexOf("      function posteIdleSiChangeV1_(el,propriete,valeur){");
const b = ui.indexOf("      function basculerIdleModeAdventureIdleV3_(){");
assert.ok(a > 0 && b > a);
const corps = ui.slice(a, b);
assert.ok(!/btn\.disabled\s*=|bandeauParalysie\.hidden\s*=|cd\.textContent\s*=|setAttribute\('aria-pressed'/.test(corps), "plus de réassignation systématique");
const { poste, attr } = new Function(ui.slice(a, ui.indexOf("      function rafraichirCommandesAdventureIdleV3_(maintenant){")) + "return {poste:posteIdleSiChangeV1_,attr:attributIdleSiChangeV1_};")();
let ecritures = 0;
const el = { _d: false, _a: "true", get disabled() { return this._d; }, set disabled(v) { ecritures += 1; this._d = v; }, getAttribute() { return this._a; }, setAttribute(n, v) { ecritures += 1; this._a = v; } };
poste(el, "disabled", false); attr(el, "aria-pressed", "true"); assert.equal(ecritures, 0, "valeur identique : aucune écriture");
poste(el, "disabled", true); attr(el, "aria-pressed", "false"); assert.equal(ecritures, 2);
poste(null, "disabled", true);

const sc = readFileSync("cloudflare/public/modules/adventure-scene-v79.js", "utf8");
const corpsStats = sc.slice(sc.indexOf("  function stats_(root,a){"), sc.indexOf("  function format_(value,precision){"));
assert.ok(!/\.textContent\s*=(?!=)/.test(corpsStats.replace(/playerName\.textContent=nomTexte;/, "")), "les chiffres des cartes passent par ecrire_ (seulement s'ils changent)");
assert.ok(corpsStats.includes("data-nom-v1") && corpsStats.includes("largeurChangee_"), "nom de l'ennemi redessiné seulement s'il change ; police réajustée si la largeur change");
console.log("idle-aventure-audit-v1: OK");
