import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-09-26) : voix (Norman -> « Normanne », « Fight Boss » mieux dit, pause des « … » = « . + . », titre « Norman & Sébastien » non lu),
 * phrase du sandwich, et un tutoriel déjà en cours ne repart plus de la première page. */
const piper = readFileSync("cloudflare/public/modules/local-neural-piper-v1.js", "utf8");
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");

// 1. Prononciation : fonction extraite et exécutée
const src = piper.slice(piper.indexOf("var PRONONCIATIONS_=["), piper.indexOf("/*\n * Astérisques"));
const normaliser = new Function(src + "\nreturn normalizePronunciation_;")();
assert.equal(normaliser("Salut, c’est Norman & Sébastien."), "Salut, c’est Normanne & Sébastien.");
assert.equal(normaliser("Va au menu Fight Boss !"), "Va au menu Faïte Bosse !");
assert.equal(normaliser("le fight boss"), "le Faïte Bosse", "sans casse");
assert.equal(normaliser("Normandie et Normandy"), "Normandie et Normandy", "seul le mot Norman est remplacé");
assert.ok(piper.includes("normalizeEllipsis_(normalizeAsterisks_(normalizePronunciation_(sanitizeText_(text))))"), "appliqué à la synthèse, avant l'empreinte du texte (inchangée)");

// 2. Pause des points de suspension : « . + . »
const ell = new Function("text", "return (" + piper.match(/function normalizeEllipsis_\(text\)\{[\s\S]*?\n\}/)[0].replace(/^function normalizeEllipsis_\(text\)/, "function(text)") + ")(text);");
assert.equal(ell("Hmm... bon"), "Hmm. . bon");
assert.equal(ell("Hmm… bon"), "Hmm. . bon");

// 3. Titre « Norman & Sébastien » non lu, les autres titres oui
const fn = ui.slice(ui.indexOf("function pauseVoixIdleV1_(ms){"), ui.indexOf("function texteVoixNouveauteIdleV1_(info){"));
const texteVoix = new Function(fn + "\nreturn texteVoixTutorielIdleV1_;")();
const ns = texteVoix({ titre: "Norman & Sébastien", paragraphes: ["Salut !"] });
assert.equal(ns.includes("Norman & Sébastien"), false);
assert.ok(ns.includes("Salut !"));
assert.ok(texteVoix({ titre: "Objectif", paragraphes: ["Salut !"] }).startsWith("Objectif"));

// 4. Phrase du sandwich
assert.ok(ui.includes("ce sandwich est fantastique ! Jambon fromage et sauce mayonnaise volé à un ouvrier dans le frigo. Miam."));
assert.equal(ui.includes("ciabatta"), false);

// 5. Un tutoriel en cours n'est pas relancé
const demarrer = ui.slice(ui.indexOf("function demarrerTutorielPagesIdleV1_(pages,cle){"), ui.indexOf("function tutorielPagesNaviguerV1_(delta){"));
assert.ok(demarrer.includes("idleTutorielPagesEnCoursV1&&idleTutorielPagesEnCoursV1.cle===cle"));
assert.ok(demarrer.indexOf("idleTutorielPagesEnCoursV1.cle===cle") < demarrer.indexOf("idleTutorielPagesEnCoursV1={pages:pages,index:0,cle:cle};"), "la reprise passe avant la remise à la page 1");
console.log("idle-voice-pronunciation-tutorial-restart-v1: OK");
