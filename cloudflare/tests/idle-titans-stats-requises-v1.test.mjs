import assert from "node:assert/strict";
import { lireSrc } from "./_src-sources.mjs";
import { readFileSync } from "node:fs";

/* Norman (2026-11-24, remplace la règle du 2026-10-13) : « on doit pouvoir affronter un titan quand on le débloque, même si on n'a pas les statistiques nécessaires pour le battre ». Le COMBAT de titan n'exige plus de stats (serveur ET interface) ; les stats conseillées restent une information, et un mode sans seuil (0 / 0, ex. SKELETON GUARDIAN) n'affiche pas de bloc « 0 Puissance / 0 Endurance ». */
const titans = readFileSync("cloudflare/public/modules/titans-v1.js", "utf8").split(String.fromCharCode(13)).join("");
const serveur = lireSrc("idle-adventure-v47.js");
const combat = serveur.slice(serveur.indexOf("export function startTitanFight"), serveur.indexOf("export function startTitanFight") + 1500);
assert.ok(!combat.includes('throw Error("PUISSANCE_INSUFFISANTE")'), "le serveur ne refuse plus le combat de titan sous les stats");
assert.ok(!titans.includes("avertirStats_(") && !titans.includes("manque_("), "l'interface n'a plus de popup « Trop faible »");
const aff = titans.slice(titans.indexOf("window.__affronterTitanV1__=function(id){"), titans.indexOf("function lancerCombatTitan_"));
assert.ok(aff.includes("demanderPlace_(t,function(){lancerCombatTitan_(id);});") && !aff.includes("return;}"), "le combat part toujours (après le popup du sac)");
assert.ok(titans.includes("if(!(Number(p)>0||Number(tt)>0))return;"), "aucun bloc de comparaison quand le jeu n'impose aucun seuil");
console.log("idle-titans-stats-requises-v1: OK");
