import assert from "node:assert/strict";
import { idleAdventureEquipmentStatsV47, createIdleAdventureStateV47 } from "../src/idle-adventure-v47.js";

/*
 * Norman (2026-09-18, en direct) : "Le tableau avec les statistiques et
 * bas doit uniquement indiquer le bonus que les équipement apportent. Pas
 * les statistiques de base du personnage." Ce test verrouille que
 * idleAdventureEquipmentStatsV47 -- la fonction qui alimente à la fois le
 * combat (idleAdventureCombatStatsV1, idle-ngu-progression.js) ET le
 * panneau client "Equipment Bonuses" (Soreal_Idle_UI.html,
 * rendreBonusEquipementAdventureIdleV1_) -- ne renvoie JAMAIS le plancher
 * de base du personnage (Power/Toughness=10, "Base Adventure Power/
 * Toughness" du vrai NGU) : cette base est ajoutée séparément et
 * uniquement par idleAdventureCombatStatsV1, jamais ici. Un joueur sans
 * aucun équipement doit voir 0 partout dans ce panneau, pas 10.
 */

const stateSansEquipement = createIdleAdventureStateV47();
const stats = idleAdventureEquipmentStatsV47(stateSansEquipement);

assert.equal(stats.power, 0, "Sans aucun équipement, le bonus Power doit être 0 -- jamais le plancher de base du personnage (10).");
assert.equal(stats.toughness, 0, "Sans aucun équipement, le bonus Toughness doit être 0 -- jamais le plancher de base du personnage (10).");
assert.equal(stats.hp, 0, "Sans aucun équipement, le bonus Max Health doit être 0 -- jamais le plancher de base (50, exigence Norman du 2026-09-18).");
assert.equal(stats.regen, 0, "Sans aucun équipement, le bonus Health Regen doit être 0 -- jamais le plancher de base.");

console.log("idle-equipment-stats-exclude-base-character-stats: OK");
