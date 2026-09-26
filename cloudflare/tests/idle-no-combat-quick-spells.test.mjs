import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-26) : « il n'y a pas de magie sous cette forme à lancer en combat fight boss dans NGU IDLE, donc supprime » : l'encart « 🔮 Magie / Aucun sort appris »
 * (et les sorts rapides) du combat de boss n'existe plus. Les sorts restent dans l'onglet Magie.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-ui.css", "utf8");
assert.ok(!ui.includes("barreSortsCombatIdleV90_"), "plus de barre de sorts dans le combat");
assert.ok(!ui.includes("Aucun sort appris"), "plus d'encart « Aucun sort appris »");
assert.ok(!ui.includes("soreal-idle-quick-spells-v90") && !css.includes("soreal-idle-quick-spells"), "plus de style de la barre");
assert.ok(ui.includes("function pageMagieIdleV90_(") && ui.includes("boutonsCibleSortIdleV90_("), "l'onglet Magie garde ses boutons de sorts");
console.log("idle-no-combat-quick-spells OK");
