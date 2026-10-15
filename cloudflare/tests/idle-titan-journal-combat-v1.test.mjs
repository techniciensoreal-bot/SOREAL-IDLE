import assert from "node:assert/strict";
import fs from "node:fs";
const lire = (p) => fs.readFileSync(new URL("../public/" + p, import.meta.url), "utf8");
const ecran = lire("modules/titans-combat-ecran-v1.js"), ui = lire("soreal-idle-ui.js");
/* Norman (2026-10-15) : le journal de combat reste visible pendant un combat de titan, sur téléphone et sur PC */
assert.ok(ecran.includes('<div id="sorealIdleAdventureLogV1" class="tcv-journal" role="log" aria-live="off"></div>'), "le journal de la page Aventure est posé dans l'écran de combat (même id : le tick y écrit)");
assert.ok(ecran.includes("window.__dessinerJournalAventureIdleV1__()") && ui.includes("window.__dessinerJournalAventureIdleV1__=dessinerJournalAventureIdleV1_;"), "rempli dès l'ouverture avec ce qui est déjà écrit");
assert.ok(ecran.includes("#'+ID+' .tcv-corps{flex:1 1 0;min-height:0;display:grid") && ecran.includes("max-height:40%") && ecran.includes("pointer-events:none"), "téléphone : voile sur le bas de l'image du titan, sans toucher");
assert.ok(ecran.includes("@media (min-width:900px){") && ecran.includes("grid-template-columns:minmax(0,1fr) minmax(280px,34%)") && ecran.includes("grid-row:1 / span 2") && ecran.includes("overflow-y:auto"), "PC : colonne de journal à droite, défilante, image et barres à gauche");
assert.ok(ecran.indexOf('class="tcv-corps"') < ecran.indexOf('id="sorealIdleAdventureLogV1"') && ecran.indexOf('id="sorealIdleAdventureLogV1"') < ecran.indexOf('class="tcv-cmd"'), "ordre : scène, barres, journal, puis attaques");
console.log("idle-titan-journal-combat-v1: OK");
