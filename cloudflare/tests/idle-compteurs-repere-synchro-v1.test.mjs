import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-03) : « le compteur de temps dans Blood Magic s'arrête (27 s) alors que la barre avance. TOUS LES COMPTEURS doivent être très précis. »
 * Cause : chaque synchro remplace idleEtat ; les repères visuels (__bloodMagicVisualV1, __augmentationsVisualV215) posés au rendu disparaissaient, donc le texte du
 * compte à rebours n'était plus rafraîchi alors que la barre (animation du navigateur) continuait.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
assert.ok(ui.includes("const idleRepereVisuelsV1_={};"), "mémoire des repères visuels");
assert.match(ui, /\['__augmentationsVisualV215','__bloodMagicVisualV1'\]\.forEach\(function\(cle\)\{/);
assert.ok(ui.indexOf("idleRepereVisuelsV1_[cle]!==undefined)idleEtat[cle]=idleRepereVisuelsV1_[cle]") > 0, "repère reporté sur le nouvel état");
assert.ok(ui.indexOf("idleRepereVisuelsV1_[cle]=idleEtat[cle]") < ui.indexOf("const augVisual=idleEtat.__augmentationsVisualV215;"), "reporté avant lecture du repère");
console.log("idle-compteurs-repere-synchro-v1 OK");
