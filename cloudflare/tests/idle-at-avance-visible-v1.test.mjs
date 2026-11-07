import assert from "node:assert/strict";
import fs from "node:fs";

/*
 * Norman (2026-11-07), Entraînement avancé : « l'énergie m'est rendue quand Puissance d'Aventure atteint sa cible, alors qu'avec ma configuration elle aurait dû passer à l'autre ; quand elle est rendue, Énergie placée ne repasse pas à 0 ;
 * il n'y a pas de bouton pour passer l'énergie, il en faut un ». La case « Faire suivre l'énergie » existait mais dans une rangée tout en haut, cachée sous la barre fixe d'énergie et de vie : elle est maintenant sous le titre ;
 * et l'énergie rendue ou passée par le moteur s'affiche sans attendre un clic (synchro demandée dès qu'un Target est atteint).
 */
const s = fs.readFileSync("cloudflare/public/modules/augmentations-page-v1.js", "utf8");
const iTitre = s.indexOf('<header class="soreal-idle-at-entete-v1">'), iHaut = s.indexOf('<div class="soreal-idle-at-haut-v1">'), iCase = s.indexOf('<label class="soreal-idle-at-avance-v1">');
assert.ok(iTitre > 0 && iHaut > iTitre && iCase > iHaut, "la rangée « Je fais quoi ? » + « Faire suivre l'énergie » est SOUS le titre (plus cachée sous la barre fixe)");
assert.ok(s.includes("window.__basculerAdvanceAdvancedTrainingIdleV1__=function(actif)") && s.includes("action:'setAdvancedTrainingAdvance'"), "la case envoie bien l'action au moteur");
// énergie rendue ou passée : affichée sans clic
assert.ok(s.includes("const caseAvance=document.querySelector('.soreal-idle-at-avance-v1 input')") && s.includes("if(alloc>0&&(atteint||(cible<0&&avanceCochee)))"), "Target atteint (ou cible -1 avec la case cochée) et de l'énergie placée : synchro demandée");
assert.ok(s.includes("tSync-(el.__atSyncT||0)>3000") && s.includes("Rg.synchroniserJeuIdleV7_(true)"), "au plus une synchro toutes les 3 s par ligne");
// le moteur : avec la case cochée l'énergie passe à la suivante (une cible -1 n'est jamais une destination) ; sans, elle est rendue
const moteur = fs.readFileSync("cloudflare/src/idle-ngu-pistes.js", "utf8");
assert.ok(moteur.includes("s.data.advanceEnergy\n      ? IDLE_AT_ORDRE_V1.slice(index + 1).find(n => pistes[n]") && moteur.includes("!atTargetIgnoreV1(pistes[n]) && !atTargetAtteintV1(pistes[n])"), "moteur : prochaine ligne débloquée, ni à -1 ni déjà au Target");
console.log("idle-at-avance-visible-v1: OK");
