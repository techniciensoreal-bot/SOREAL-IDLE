import assert from "node:assert/strict";
import { lireUiComplet } from "./_ui-sources.mjs";
import { readFileSync } from "node:fs";

/* Norman (2026-10-13) : après une Renaissance on arrive sur Fight Boss, la borne d'arcade en haut de la page, pour revoir la borne qui s'allume. */
const ui = lireUiComplet().replace(/\r\n/g, "\n");
const i = ui.indexOf("Rebirth réussi");
const bloc = ui.slice(i - 1900, i);
assert.ok(bloc.includes("idleMenuActifV28='combat';") && bloc.includes("sauverMenuIdleV28_();"), "la page active devient Fight Boss après la Renaissance");
assert.ok(bloc.includes("const toutEnHaut=function(){const ban=document.querySelector('.soreal-idle-hero-banner-v95')") && !bloc.includes("borneRenaissance.scrollIntoView"), "Norman (2026-10-15) : la page est scrollée au maximum en haut (et non plus seulement la borne amenée en haut de l'écran)");
assert.ok(ui.indexOf("idleMenuActifV28='combat';", i - 1900) < ui.indexOf("rendreIdleEtat_({", ui.indexOf("idleMenuActifV28='combat';", i - 1900)), "le menu est changé avant le redessin (la borne s'allume au rendu)");
console.log("idle-renaissance-vers-borne-v1: OK");
