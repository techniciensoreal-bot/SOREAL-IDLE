// Norman (2026-10-29) : « le nom qu'il met dans Steam doit être SOREAL NGU IDLE » : une entrée qui porte l'ancien nom est renommée toute seule au lancement (Steam fermé).
import fs from "node:fs";
import assert from "node:assert/strict";
const c = fs.readFileSync("desktop/coeur.js", "utf8").replace(/\r\n/g, "\n"), s = fs.readFileSync("desktop/src/steam.mjs", "utf8").replace(/\r\n/g, "\n");
assert.ok(s.includes("ancienNom") && s.includes('export const NOM_STEAM = "SOREAL NGU IDLE"'), "l'état signale un ancien nom");
assert.ok(c.includes("e.ancienNom && !e.enCours") && c.includes("ajouterSteam_(null)") && c.includes("async function ajouterSteam_(art)"), "renommage automatique, Steam fermé");
console.log("idle-steam-renommage-auto-v1 : OK");
