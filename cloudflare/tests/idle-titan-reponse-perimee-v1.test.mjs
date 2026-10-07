import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Titan invisible jusqu'au rafraîchissement (Norman, 2026-10-07) : une réponse du serveur plus ANCIENNE que celle déjà reçue (synchro lancée juste avant « Affronter »)
 * ne doit pas effacer le combat ni la zone du client, seulement l'inventaire était protégé.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
assert.ok(ui.includes("const IDLE_ADVENTURE_COMBAT_FIELDS_V1=['fight','selectedZone','lastCombatZone','retourSafe'];"), "champs de combat protégés");
const i = ui.indexOf("revision<idleAdventureRevisionServeurV208");
const bloc = ui.slice(i, i + 1400);
assert.ok(bloc.includes("IDLE_ADVENTURE_COMBAT_FIELDS_V1.forEach") && bloc.includes("fusionPerimee[cle]=cloneInventaireIdleV160_(local[cle])"), "réponse périmée : combat et zone repris du local");
console.log("idle-titan-reponse-perimee-v1: OK");
