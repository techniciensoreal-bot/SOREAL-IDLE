import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-19) : « dans Wandoos, quand je clique très vite le bouton, des clics se perdent ». Le 2e appui repartait de l'ancienne valeur (une réponse du moteur avait
   remis l'état) et envoyait la même cible que le 1er : écartée comme doublon. Garde : la dernière cible demandée sert de base pendant 2,5 s. */
const s = readFileSync("cloudflare/public/modules/wandoos-retro-v1.js", "utf8");
assert.ok(s.includes("var visee_={};"), "mémoire de la dernière cible");
assert.ok(s.includes("var vis=visee_[res];") && s.includes("Date.now()-vis.at<2500"), "la dernière cible sert de base pendant 2,5 s");
assert.ok(s.includes("visee_[res]={v:cible,at:Date.now()};"), "la cible est mémorisée avant l'envoi");
assert.ok(s.indexOf("visee_[res]={v:cible") < s.indexOf("meta_({action:'allocate',system:'wandoos'"), "mémorisée avant meta_");
console.log("idle-wandoos-clics-rapides-v1: OK");
