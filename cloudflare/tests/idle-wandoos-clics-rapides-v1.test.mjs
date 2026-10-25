import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-19) : « dans Wandoos, quand je clique très vite le bouton, des clics se perdent ». Le 2e appui repartait de l'ancienne valeur (une réponse du moteur avait
   remis l'état) et envoyait la même cible que le 1er : écartée comme doublon. Garde : la dernière cible demandée sert de base pendant 2,5 s. */
const s = readFileSync("cloudflare/public/modules/wandoos-retro-v1.js", "utf8");
assert.ok(s.includes("var visee_={};"), "mémoire de la dernière cible");
assert.ok(s.includes("var vis=visee_[res];") && s.includes("Date.now()-vis.at<2500"), "la dernière cible sert de base pendant 2,5 s");
assert.ok(s.includes("visee_[res]={v:cible,at:Date.now()};"), "la cible est mémorisée avant l'envoi");
assert.ok(s.indexOf("visee_[res]={v:cible") < s.indexOf("var charge={action:'allocate',system:'wandoos'"), "mémorisée avant meta_");
console.log("idle-wandoos-clics-rapides-v1: OK");

/* 2e cause (Norman, 2026-10-19 : « quand je mets rapidement des 20K dans Wandoos, tous les clics ne sont pas validés ») : chaque placement redessine tout le poste (outerHTML) ; un
   redessin entre l'appui et le relâchement détruit le bouton et le navigateur n'envoie aucun clic (essai souris réelle : 8 clics sur 15 validés). Les touches + et chiffres agissent
   donc à l'appui (souris) ou au relâchement sans bouger (doigt) ; le clic qui suit est ignoré une seule fois. */
assert.ok(s.includes("document.addEventListener('pointerdown'") && s.includes("e.pointerType==='mouse'") && s.includes("declencher_(t)"), "action à l'appui");
assert.ok(s.includes("document.addEventListener('pointerup'") && s.includes("Math.abs(e.clientX-a.x)<10"), "doigt : au relâchement sans bouger");
assert.ok(s.includes("e.stopImmediatePropagation();e.preventDefault();") && s.includes("faitsTouche.splice(i,1)"), "le clic qui suit n'est pas compté deux fois");
assert.ok(s.includes("code.indexOf('.place(')===-1&&code.indexOf('.chiffre(')===-1"), "limité aux touches + − MAX 0 et chiffres");
console.log("idle-wandoos-clics-rapides-v1 (appui): OK");
