import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-27) : « pour la regen par seconde affichée à côté des PV [en Fight Boss],
 * il n'y ait pas de chiffre après la virgule affiché. uniquement 580 K/s par exemple. En
 * aventure je veux les chiffres tels qu'ils sont actuellement donc ne touche à rien d'autre. »
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");

// Fight Boss : les deux affichages "↗ +.../s" (joueur, boss) passent 0 décimale.
assert.match(
  ui,
  /const regenJoueurVisibleV176=[\s\S]{0,600}formaterDecimalesFixesIdleV1_\(\s*regenJoueurVisibleV176,\s*0\s*\)/,
  "regen du joueur en Fight Boss : 0 décimale"
);
assert.match(
  ui,
  /const bossEnRegenV174=[\s\S]{0,900}formaterDecimalesFixesIdleV1_\(\s*idleEtat\.regenBoss,\s*0\s*\)/,
  "regen du boss en Fight Boss : 0 décimale"
);

// Aventure : aucun changement -- le module dédié utilise toujours son propre formatage à 2 décimales.
const adventureScene = readFileSync("cloudflare/public/modules/adventure-scene-v79.js", "utf8");
assert.match(adventureScene, /format_\(effectiveRegen,2\)/, "regen du joueur en Aventure : inchangé (2 décimales)");
assert.match(adventureScene, /format_\(enemyValues\[key\],key==='regen'\?2:0\)/, "regen de l'ennemi en Aventure : inchangé (2 décimales)");

console.log("idle-fight-boss-regen-no-decimals-v1: OK");
