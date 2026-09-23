import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * 2026-09-23 : l'affichage des PV clignotait et ses chiffres bougeaient : le
 * suffixe de regen n'existait que sous les PV max et les décimales perdaient
 * leurs zéros finaux ("1.60" -> "1.6"). Décimales fixes, suffixe permanent,
 * chiffres tabulaires.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-ui.css", "utf8");

const debut = ui.indexOf("function formaterDecimalesFixesIdleV1_(");
assert.ok(debut > 0);
const source = ui.slice(debut, ui.indexOf("function regenPvFightBossNguParSecondeV164_", debut));
const formater = new globalThis.Function(
  "idleNombre_", "formatGrandNombreIdleV70_",
  source + "\nreturn formaterDecimalesFixesIdleV1_;"
)((v) => Number(v) || 0, (v, d) => "GRAND:" + v + ":" + d);
assert.equal(formater(1.6, 2), "1,60", "les zéros finaux sont conservés");
assert.equal(formater(0.05, 2), "0,05");
assert.equal(formater(2500, 2), "GRAND:2500:2", "au-delà de 1000, le format compact habituel");

assert.ok(!/regenJoueurVisibleV176=\s*!idleEtat\.combatBossActif/.test(ui), "la regen du joueur reste affichée, même à PV pleins ou en combat");
assert.ok(!/bossEnRegenV174\?4:undefined/.test(ui), "plus de nombre de décimales variable sur les PV du boss");
assert.match(css, /#sorealIdleJoueurPvV15,[\s\S]*?font-variant-numeric:\s*tabular-nums/);

console.log("idle-hp-display-stable: OK");
