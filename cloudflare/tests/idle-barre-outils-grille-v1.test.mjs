import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-10) : une seule grille propre pour les cadres Input / Plafond / Idle / total placé, partout ; plus de barre d'outils dans le menu Wandoos. */
const css = readFileSync("cloudflare/public/soreal-idle-itopod.css", "utf8");
const wd = readFileSync("cloudflare/public/modules/wandoos-retro-v1.js", "utf8");
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
assert.ok(css.includes(".soreal-idle-bt-toolbar-v120{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important"), "grille à deux colonnes");
assert.ok(css.includes('[data-alloc-cadre-v1^="cap-"] button:first-of-type{grid-column:span 2!important}') && css.includes('[data-alloc-cadre-v1^="idle-"] button.clear{grid-column:span 2!important}'), "Max et Tout retirer sur deux colonnes : boutons alignés");
assert.ok(!wd.includes("AL.cadres("), "Wandoos : pas de barre d'outils d'allocation");
assert.ok(/soreal-idle-bt-toolbar-v120">'\+<div class="soreal-idle-tm-input-v1 soreal-idle-bt-input-box-v120"|soreal-idle-bt-toolbar-v120\?">'\+'<div class="soreal-idle-tm-input-v1 soreal-idle-bt-input-box-v120"/.test(meta) || meta.includes("soreal-idle-tm-input-v1 soreal-idle-bt-input-box-v120"), "Machine temporelle : l'Input est dans la barre d'outils");
console.log("idle-barre-outils-grille-v1: OK");
