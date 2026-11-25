import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-11-25) : « quand l'auto nuke se produit, ça reset la barre de vie du mob en aventure ». La réponse du Nuke remplace l'état du joueur : le combat d'Aventure joué dans la page (systemes.adventure.fight) et la vie de repos doivent être remis, comme à chaque synchro. */
const src = readFileSync("cloudflare/public/modules/ui-combat-2-v1.js", "utf8").replace(/\r\n/g, "\n");
const i = src.indexOf("function nukerBossIdleV1_(");
assert.ok(i > 0, "nukerBossIdleV1_ présent");
const corps = src.slice(i, src.indexOf("function autoNukeDueIdleV1_", i));
const avant = corps.indexOf("combatAvantNukeV1=");
const adopte = corps.indexOf("REG.idleEtat=\n                  res.joueur;");
const remis = corps.indexOf("fight:combatAvantNukeV1");
assert.ok(avant > 0 && adopte > avant, "le combat local est lu AVANT d'adopter la réponse");
assert.ok(remis > adopte, "le combat local est remis APRÈS l'adoption");
assert.ok(corps.includes("adventureRestPv=restPvAvantNukeV1"), "la vie de repos est conservée");
console.log("idle-nuke-garde-combat-aventure-v1: OK");
