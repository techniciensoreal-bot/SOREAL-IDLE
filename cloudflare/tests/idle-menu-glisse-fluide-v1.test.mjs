import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-27, téléphone) : « c'est fluide sauf quand on déplace les pages ; ça fait des à-coups ». Le glissement d'un bouton du menu relisait la mise en page à chaque mouvement du doigt et à chaque image
 * (getComputedStyle, conteneur défilant, elementFromPoint, getBoundingClientRect) pendant que tous les boutons tremblaient. Désormais : mesures faites une fois au début, un seul calcul par image, animations figées.
 */
const menus = readFileSync("cloudflare/public/modules/ui-menus-v1.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-ui.css", "utf8");
const debut = menus.indexOf("function commencerGlisse(bouton,ev)");
const fin = menus.indexOf("function naviguerSwipeIdleV1_");
const bloc = menus.slice(debut, fin);
assert.ok(debut > 0 && fin > debut);
assert.ok(bloc.includes("vertical:nav0?getComputedStyle(nav0).flexDirection==='column':false") && bloc.includes("rect:cont0?cont0.getBoundingClientRect():null"), "mesures prises une fois au début du geste");
const boucle = bloc.slice(bloc.indexOf("function defilerPendantGlisse"), bloc.indexOf("function terminerGlisse"));
assert.ok(!boucle.includes("getComputedStyle") && !boucle.includes("conteneurDefilant("), "la boucle d'image ne relit plus ni le style ni le conteneur");
assert.equal(boucle.split("elementFromPoint").length - 1, 1, "un seul elementFromPoint par image");
const mouvement = bloc.slice(bloc.indexOf("addEventListener('pointermove'"), bloc.indexOf("['pointerup','pointercancel']"));
assert.ok(!mouvement.includes("elementFromPoint") && !mouvement.includes("getBoundingClientRect") && !mouvement.includes("getComputedStyle"), "le mouvement du doigt ne force aucune mise en page");
assert.ok(bloc.includes("classList.add('glissant')") && bloc.includes("classList.remove('glissant')"), "classe « glissant » posée et retirée");
assert.ok(/\.soreal-idle-nav-v28\.edition\.glissant \*\{\s*animation-play-state:paused;/.test(css), "animations figées pendant le glissement");
console.log("idle-menu-glisse-fluide-v1: OK");
