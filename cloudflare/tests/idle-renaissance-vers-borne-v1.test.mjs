import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-13) : après une Renaissance on arrive sur Fight Boss, la borne d'arcade en haut de la page, pour revoir la borne qui s'allume. */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8").replace(/\r\n/g, "\n");
const i = ui.indexOf("Rebirth réussi");
const bloc = ui.slice(i - 1200, i);
assert.ok(bloc.includes("idleMenuActifV28='combat';") && bloc.includes("sauverMenuIdleV28_();"), "la page active devient Fight Boss après la Renaissance");
assert.ok(bloc.includes('.soreal-idle-page-root-v28[data-menu="combat"] .borne-v2') && bloc.includes("scrollIntoView({block:'start'})"), "la borne est amenée en haut de la page");
assert.ok(ui.indexOf("idleMenuActifV28='combat';", i - 1200) < ui.indexOf("rendreIdleEtat_({", ui.indexOf("idleMenuActifV28='combat';", i - 1200)), "le menu est changé avant le redessin (la borne s'allume au rendu)");
console.log("idle-renaissance-vers-borne-v1: OK");
