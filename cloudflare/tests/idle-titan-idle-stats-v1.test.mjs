import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-12) : « le ×5 de régénération s'affiche encore contre un Titan ». Un Titan se livre en Zone sûre : pendant ce combat, la régénération n'est plus multipliée par 5 (ni 10 avec le set GRB),
 * ni à l'affichage de la fiche (modules/adventure-scene-v79.js) ni dans le calcul (regenReposAdventureIdleV3_ et appliquerRegenCombatAdventureIdleV2_ dans soreal-idle-ui.js).
 */
const scene = readFileSync("cloudflare/public/modules/adventure-scene-v79.js", "utf8");
assert.ok(scene.includes("var reposSafe=selectedZone==='safe'&&!(fight&&fight.active);") && scene.includes("var effectiveRegen=reposSafe?totalRegen*safeMultiplier:totalRegen;") && scene.includes("ecrire_(regenBonus,reposSafe?") && scene.includes("regenValue.classList.toggle('soreal-idle-v79-safe-regen',reposSafe);"), "fiche : pas de ×5 pendant un combat");
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const repos = ui.slice(ui.indexOf("function regenReposAdventureIdleV3_("), ui.indexOf("function facteurAleatoireDegatsAdventureIdleV2_"));
assert.ok(repos.includes("if(zoneCourante==='safe'&&!(a&&a.fight&&a.fight.active)){"), "calcul du repos : le ×5 seulement sans combat actif");
const combat = ui.slice(ui.indexOf("function appliquerRegenCombatAdventureIdleV2_("), ui.indexOf("function appliquerRegenCombatAdventureIdleV2_(") + 2500);
assert.ok(!/safeZoneRegen10x|\*5|\*10/.test(combat), "la régénération en plein combat n'a aucun ×5 ni ×10");
console.log("idle-titan-idle-stats-v1: OK");
