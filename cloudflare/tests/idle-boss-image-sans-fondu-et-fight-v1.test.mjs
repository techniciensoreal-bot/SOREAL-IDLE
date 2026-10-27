import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-27) : « l'image du boss suivant est visible instantanément, puis noire, puis elle réapparaît » et « l'écran reste noir trop longtemps, je peux lancer le fight alors que le boss n'est pas encore apparu ».
 * Cause 1 : le fondu CSS de 3 s de l'image boss retirait la classe visible d'une image déjà opaque quand son adresse changeait (elle s'éteignait puis se rallumait) ; l'apparition (apparition-boss-v1.js) la révèle déjà.
 * Cause 2 : Fight n'attendait que le nom et les PV du boss, pas la fin du calque d'apparition.
 */
const ui = readFileSync("cloudflare/public/modules/ui-combat-2-v1.js", "utf8");
const fn = ui.slice(ui.indexOf("function classeFonduImageIdleV61_("), ui.indexOf("function markupImageCombatIdleV61_("));
const bossBranch = fn.slice(fn.indexOf("if(type==='boss'){"), fn.indexOf("if(type==='joueur'){"));
assert.ok(!bossBranch.includes("soreal-idle-image-fade-v61"), "l'image du boss n'a plus de fondu de 3 s");
assert.ok(fn.includes("idleDerniereImageBossV61=key;"), "la mémoire de l'image boss reste tenue");
assert.ok(fn.slice(fn.indexOf("if(type==='joueur'){")).includes("soreal-idle-image-fade-v61"), "le portrait du joueur garde son fondu");
assert.ok(ui.includes("if(actif&&!REG.idleEtat.combatBossActif&&document.querySelector('#sorealIdleBossImageHostV36 .app-boss'))return;"), "pas de Fight tant que le calque d'apparition couvre le boss");
console.log("idle-boss-image-sans-fondu-et-fight-v1: OK");
