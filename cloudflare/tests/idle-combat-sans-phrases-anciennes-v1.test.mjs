import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-08) : « j'ai les phrases de l'ancienne version de SOREAL IDLE sur Fight Boss : "Même pas peur" ». Bulles de la toute première version (« Ça va finir au recyclage »,
 * « Le dépôt compte sur moi »…) : retirées de la page Fight Boss.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
for (const phrase of ["Ça va finir au recyclage.'", "Encore un effort…'", "Le dépôt compte sur moi.'", "Je vais passer ce mur.'", "'Même pas peur.'"]) assert.ok(!ui.includes(phrase), "phrase retirée : " + phrase);
assert.ok(!ui.includes("sorealIdleDialogueJoueurV76") && !ui.includes("demarrerBullesCombatIdleV76_") && !ui.includes("phrasesJoueurIdleV76_"), "plus de bulle ni de minuteur de bulles");
console.log("idle-combat-sans-phrases-anciennes-v1: OK");
