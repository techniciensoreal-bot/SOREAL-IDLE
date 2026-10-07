import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Sac en pages de 60 (5 par ligne sur téléphone) et clic sur « Beta x.y » vers les notes de mise à jour (Norman, 2026-10-08). */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-itopod.css", "utf8");
assert.ok(ui.includes("const IDLE_SAC_CASES_PAR_PAGE_V1=60;"), "60 cases par page au plus");
const debut = ui.indexOf("function rendreGrilleSacAdventureIdleV1_(items,capacite){");
const grille = ui.slice(debut, debut + 1400);
assert.ok(grille.includes("for(let i=debut;i<fin;i+=1)") && grille.includes('data-slot-index="'+"'+i+'"+'"'), "numéros d'emplacement absolus, seule la page courante est dessinée");
assert.ok(grille.includes("pagerSacIdleV1_(page,pages)"), "boutons de page");
assert.ok(ui.includes("if(pages<2)return '';"), "pas de pager tant qu'une seule page suffit");
assert.ok(ui.includes("window.__changerPageSacV1__=changerPageSacV1_;"), "changement de page exposé");
assert.ok(/@media \(max-width:700px\)\{[^@]*soreal-idle-v138-bag\{grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/.test(css), "5 colonnes sur téléphone");
// Badge de version cliquable
assert.ok(ui.includes('class="soreal-idle-badge-v4" role="button"') && ui.includes('onclick="window.__ouvrirNotesMajIdleV1__()"'), "badge cliquable");
const ouvrir = ui.slice(ui.indexOf("window.__ouvrirNotesMajIdleV1__=function(){"), ui.indexOf("window.__ouvrirNotesMajIdleV1__=function(){") + 1800);
assert.ok(ouvrir.includes("soreal_idle_notes_maj_ouvert_v1','1'") && ouvrir.includes("__menuIdleV28__('parametres')") && ouvrir.includes("scrollIntoView"), "ouvre les Réglages, déplie et affiche les notes");
console.log("idle-sac-pages-badge-v1: OK");
