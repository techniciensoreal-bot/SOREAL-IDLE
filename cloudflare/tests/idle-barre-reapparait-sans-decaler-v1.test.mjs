import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-10) : une barre qui réapparaît se pose par-dessus sans décaler l'interface ; les runes de la magie sont réparties sur toute la hauteur de la barre. */
const hud = readFileSync("cloudflare/public/modules/hud-haut-v2.js", "utf8");
const themes = readFileSync("cloudflare/public/soreal-idle-themes.css", "utf8");
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
assert.ok(hud.includes("function reapparaitSansDecaler") && hud.includes("function ranger(hud)") && hud.includes("soreal-idle-superpose-v2"), "retour d'une barre sans décalage, barres rangées sous la vie");
assert.ok(themes.includes(".soreal-idle-energy-panel-v34.soreal-idle-superpose-v2{max-height:none!important;position:relative"), "style de la barre posée par-dessus");
assert.ok(ui.includes('<i class="soreal-idle-bulles-v2">' + "<b></b>".repeat(12) + "</i>"), "douze runes");
assert.ok(themes.includes("b:nth-child(12){") && !/magic-panel-v1 \.soreal-idle-bulles-v2 b:nth-child\(\d+\)\{left:\d+%;top:\d+px/.test(themes), "runes sur toute la hauteur (plus de hauteur fixe en haut)");
console.log("idle-barre-reapparait-sans-decaler-v1: OK");
