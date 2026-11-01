import assert from "node:assert/strict";
import { lireUiComplet } from "./_ui-sources.mjs";
import { readFileSync } from "node:fs";

/* Norman (2026-10-10) : une barre qui réapparaît se pose par-dessus sans décaler l'interface ; les runes de la magie sont réparties sur toute la hauteur de la barre. */
const hud = readFileSync("cloudflare/public/modules/hud-haut-v2.js", "utf8");
const themes = readFileSync("cloudflare/public/soreal-idle-themes.css", "utf8");
const ui = lireUiComplet();
assert.ok(hud.includes("function reapparaitSansDecaler") && !hud.includes("function ranger(hud)") && !hud.includes("translateY("), "retour d'une barre en douceur, plus de décalage par transform (la Vie ne chevauche jamais les boutons)");
/* 2026-11-01 (Norman) : les barres d'énergie et de magie disparaissent et reviennent INSTANTANÉMENT (plus de fondu ni de délai) ; la place se referme / rouvre sans animation. */
assert.ok(!themes.includes("soreal-idle-superpose-v2{") && !themes.includes("transition:opacity .45s ease,max-height .45s ease .35s") && themes.includes("max-height:24px;transition:none;"), "place refermée / rouverte instantanément");
assert.ok(ui.includes('<i class="soreal-idle-bulles-v2">' + "<b></b>".repeat(12) + '<b class="gr gr1"></b><b class="gr gr2"></b></i>'), "douze runes et deux grands sigles");
assert.ok(themes.includes("b:nth-child(12){") && !/magic-panel-v1 \.soreal-idle-bulles-v2 b:nth-child\(\d+\)\{left:\d+%;top:\d+px/.test(themes), "runes sur toute la hauteur (plus de hauteur fixe en haut)");
console.log("idle-barre-reapparait-sans-decaler-v1: OK");
