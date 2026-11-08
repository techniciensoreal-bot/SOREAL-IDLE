import assert from "node:assert/strict";
import fs from "node:fs";

/*
 * Norman (2026-11-08) : « je veux pouvoir regénérer toute l'étape du tuto sans devoir générer étape par étape ; regénère les voix avec Cthulhu malicieux ».
 * Garde : l'éditeur de voix sait régénérer UN LOT de textes (voix imposée à tous les personnages, tous les blocs refaits, un texte après l'autre, arrêt au premier échec), et la fenêtre « Voix » d'un guide propose « Tout régénérer »
 * avec « Lhu malicieux » choisie d'office. (Le comportement réel a été éprouvé dans l'application avec le studio : étape 1 puis les 26 autres, voix enregistrée « cthulhu-malicieux » dans le texte dit de chaque étape.)
 */
const X = fs.readFileSync("cloudflare/public/modules/textes-admin-v1.js", "utf8");
const A = fs.readFileSync("cloudflare/public/modules/admin-tutoriel-v1.js", "utf8");

assert.ok(X.includes("function regenererLot_(cles,parleur,rappel)") && X.includes("regenererLot:regenererLot_") && X.includes("arreterLot:arreterLot_") && X.includes("voixProposees:voixProposees_"), "l'éditeur expose le lot");
const lot = X.slice(X.indexOf("function regenererLot_"), X.indexOf("function arreterLot_"));
assert.ok(lot.includes("appliquerChoix_('voix',champ+'|'+k,parleur)"), "la voix choisie est donnée à TOUS les personnages de chaque texte (même chemin que le sélecteur de voix)");
assert.ok(lot.includes("lancerGeneration_(o,blocs,") && lot.includes("blocsDeLecture_(valeurs)") && !lot.includes("edition.voix.indexOf"), "tous les blocs sont refaits, même ceux qui existent déjà");
assert.ok(lot.includes("studio.ok===false") && lot.includes("Voix inconnue") && lot.includes("Un lot est déjà en cours"), "refus clairs : studio éteint, voix inconnue, lot déjà lancé");
assert.ok(lot.includes("b.fait<b.total") && lot.includes("bilanGeneration"), "un échec de génération arrête le lot et dit pourquoi");
assert.ok(X.includes("bilanGeneration={fait:fait,total:aFaire.length,raison:raison};"), "le résultat de chaque génération est gardé pour le lot");
assert.ok(/suite=suite\.then\(function\(\)\{[\s\S]*?editer_\(cle\);/.test(lot), "un texte après l'autre : chaque étape ouvre l'éditeur du texte");
assert.ok(/\},function\(e\)\{[\s\S]*?return \{faits:faits,total:liste\.length,echec:/.test(lot), "le lot rend { faits, total, echec } sans jamais lever d'exception");
assert.ok(!/Promise\.all/.test(lot), "jamais deux générations en même temps (une seule carte graphique)");

// L'arrêt demandé interrompt le lot ET la génération en cours.
const arret = X.slice(X.indexOf("function arreterLot_"), X.indexOf("window.__SOREAL_IDLE_TEXTES_V1__={"));
assert.ok(arret.includes("lot.annule=true") && arret.includes("generation.annule=true"), "arrêt du lot");

// Fenêtre « Voix » du guide : bouton, voix par défaut, suivi.
assert.ok(A.includes("data-av=\"lot\"") && A.includes("Tout régénérer") && A.includes("data-av=\"lot-stop\""), "bouton Tout régénérer et bouton Arrêter");
assert.ok(A.includes("v[0]==='cthulhu-malicieux'?' selected'"), "« Lhu malicieux » choisie d'office");
assert.ok(A.includes("X.regenererLot(cles,voix,") && A.includes("g.etapes.map(function(e,k){return T.cleVoix(g,k);})"), "toutes les étapes du guide partent dans le lot");
console.log("idle-voix-lot-guide-v1: OK");
