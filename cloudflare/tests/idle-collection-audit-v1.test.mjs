import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Audit de Collection (Norman, 2026-10-05 : « fais un audit de Collection uniquement »). Mesuré en local, avec 300 boss découverts (1 512 éléments) :
 *  - rendu de la page 24 ms, aucune modification de page ensuite (même pendant une synchro) ; images des boss et des objets en chargement différé (loading="lazy") ; changer d'onglet : aucun appel ;
 *  - à l'ouverture du menu, deux « marqué vu » partaient à la même milliseconde (le menu, puis son tutoriel) -> un seul appel pour la rafale.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const a = ui.indexOf("      let idleVusMinuterieV1=0;");
const b = ui.indexOf("      /*\n       * Pont pour les modules externes (2026-09-27, popup d'histoire plein écran)");
assert.ok(a > 0 && b > a);
const timers = [];
let envois = 0;
const monde = new Function("idleVusMemoireV1", "idleVusEnAttenteV1", "idleVusEnvoyerV1_", "setTimeout", ui.slice(a, b) + "\nreturn idleVuMarquerV1_;")({}, [], () => { envois += 1; }, (f, ms) => { timers.push([f, ms]); return timers.length; });
monde("menu:bestiaire"); monde("tuto:collection"); monde("menu:bestiaire");
assert.equal(envois, 0, "rien n'est envoyé tout de suite");
assert.equal(timers.length, 1, "une seule minuterie pour la rafale");
timers[0][0]();
assert.equal(envois, 1, "un seul appel pour toute la rafale");
monde("autre");
assert.equal(timers.length, 2, "la rafale suivante repart normalement");

// Les images de la collection restent en chargement différé.
const cartes = ui.slice(ui.indexOf("      function rendreCollectionCreaturesIdleV1_("), ui.indexOf("      function rendreCollectionCreaturesIdleV1_(") + 2200);
assert.ok(cartes.includes('loading="lazy"'), "portraits de boss en chargement différé");
console.log("idle-collection-audit-v1: OK");
