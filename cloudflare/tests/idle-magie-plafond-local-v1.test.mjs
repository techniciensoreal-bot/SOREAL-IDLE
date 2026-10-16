import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Bug d'un joueur (2026-10-16) : la Magie générée dépassait le maximum jusqu'à un rafraîchissement. Le plafond local est borné par capRun - Magie placée - réservé. */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
assert.ok(ui.includes("capMagieTickEtat-allocationMetaMagieIdleV1_()-Math.max(0,idleNombre_(budgetMagieEtat.reservedExternal))"), "plafond direct calculé avec la Magie placée");
assert.ok(ui.includes("ressourceMagieEtat.current>plafondMagieDirect") || ui.includes("idleNombre_(ressourceMagieEtat.current)>plafondMagieDirect"), "valeur ramenée au plafond");
assert.ok(/maxLocalMagie=\s*Math\.min\(\s*plafondMagieDirect/.test(ui), "le plafond local ne dépasse jamais le plafond direct");
console.log("idle-magie-plafond-local-v1: OK");
