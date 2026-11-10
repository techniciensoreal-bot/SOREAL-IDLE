/*
 * Entraînement avancé : un bouton « Max » par ligne (Norman, 2026-11-10 : « un bouton Max pour chaque ligne qui met toute l'énergie idle disponible »).
 * Le bouton place sur la ligne TOUTE l'énergie idle libre (courant + libre) ; le serveur borne de toute façon à l'énergie libre, l'action envoyée est la même que « + ».
 */
import assert from "node:assert/strict";
import fs from "node:fs";

const src = fs.readFileSync("cloudflare/public/modules/augmentations-page-v1.js", "utf8");

assert.ok(src.includes("class=\"soreal-idle-at-max-v1\"") && src.includes("\\'max\\')\">Max</button>"), "chaque ligne a un bouton Max");
assert.ok(src.includes("Toute l’énergie idle libre"), "info-bulle du bouton");
assert.ok(src.includes("mode==='max'?courant+libre"), "Max = énergie déjà placée + toute l'énergie idle libre");
assert.ok(src.includes("mode==='plus'||mode==='max'?'btPlus':'btMinus'"), "Max joue le son de « + »");
assert.ok(src.includes("envoyerAllocRapideV1_({action:'allocateAdvancedTraining',track:id,value:valeur})"), "même action serveur que « + » et « − »");

/* le bouton est dans la ligne (une seule fois dans le gabarit de ligne, donc une fois par compétence) */
const ligne = src.slice(src.indexOf("const ligne=function(id){"), src.indexOf("const toolbar="));
assert.equal((ligne.match(/soreal-idle-at-max-v1/g) || []).length, 1, "un Max par ligne");
assert.ok(ligne.indexOf("\\'moins\\'") < ligne.indexOf("soreal-idle-at-max-v1") && ligne.indexOf("soreal-idle-at-max-v1") < ligne.indexOf("\\'zero\\'"), "ordre : + − Max 0");

console.log("idle-advanced-training-max-par-ligne-v1: OK");
