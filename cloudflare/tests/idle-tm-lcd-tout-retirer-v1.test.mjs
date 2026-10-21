import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-21) : « Cible et Énergie/Magie allouée sur la machine temporelle : de petits écrans comme Niveau et Temps restant » ; « Tout retirer est énorme sur PC : sur la même ligne que 1/2 et 1/4, sur toutes les pages ». */
const css = readFileSync(new URL("../public/soreal-idle-machine.css", import.meta.url), "utf8");
assert.ok(css.includes(".tmm-lcd,.tmm-case{border-radius:10px;") && css.includes(".tmm-lcd-val,.tmm-case-val,.tmm-machine .tmm-case input[type=number]{"), "Cible et allouée ont le style des écrans LCD");
assert.ok(css.includes(".tmm-lcd-titre,.tmm-case-titre{"), "titres des écrans identiques");
const aug = readFileSync(new URL("../public/modules/augmentations-page-v1.js", import.meta.url), "utf8");
assert.ok(aug.includes(`<i class="tmm-case-titre" title="'+H.idleHtml_(libelleAlloc)+'">Allouée</i>`), "titre court (l'écran est étroit), libellé complet en infobulle");
const it = readFileSync(new URL("../public/soreal-idle-itopod.css", import.meta.url), "utf8");
assert.ok(it.includes("button.clear{grid-column:var(--bt-clear-col,1/-1)!important;padding:6px 10px!important}") && it.includes("@media (min-width:900px){.soreal-idle-bt-toolbar-v120>.soreal-idle-bt-presets-v120{--bt-clear-col:span 2}}"), "PC : « Tout retirer » sur la même ligne que 1/2 et 1/4 ; téléphone : toute la ligne comme avant");
console.log("idle-tm-lcd-tout-retirer-v1: OK");
