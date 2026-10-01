import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-27) : « pour la regen par seconde affichée à côté des PV [en Fight Boss],
 * il n'y ait pas de chiffre après la virgule affiché. uniquement 580 K/s par exemple. En
 * aventure je veux les chiffres tels qu'ils sont actuellement donc ne touche à rien d'autre. »
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");

// Fight Boss (2026-10-01) : les barres de vie n'affichent plus la régénération, seulement les PV (le texte « ↗ +.../s » est retiré).
assert.ok(!ui.includes("↗ +"), "plus de régénération affichée dans les barres de Fight Boss");

// Aventure : aucun changement -- le module dédié utilise toujours son propre formatage à 2 décimales.
const adventureScene = readFileSync("cloudflare/public/modules/adventure-scene-v79.js", "utf8");
assert.match(adventureScene, /format_\(effectiveRegen,2\)/, "regen du joueur en Aventure : inchangé (2 décimales)");
assert.match(adventureScene, /format_\(enemyValues\[key\],key==='regen'\?2:0\)/, "regen de l'ennemi en Aventure : inchangé (2 décimales)");

console.log("idle-fight-boss-regen-no-decimals-v1: OK");
