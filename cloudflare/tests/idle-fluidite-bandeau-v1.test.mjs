/* Audit de fluidité du bandeau et du menu du haut (2026-11-02) : chaque optimisation mesurée est figée ici.
 *  1. le mot « Titans » du menu : seule l'OPACITÉ d'un second exemplaire bouge (plus d'animation de filtre : repeint à chaque image) ;
 *  2. la barre de Magie n'applique plus sorealHudAurore (animation de background-position sans aucun effet visible) ;
 *  3. les boutons du menu hors de l'écran sont en pause (IntersectionObserver, classe nav-hors-v1, gardée par le redessin) ;
 *  4. une barre du bandeau entièrement dépensée (invisible) met ses animations en pause. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const lire = (p) => readFileSync(new URL("../public/" + p, import.meta.url), "utf8");
const ui = lire("soreal-idle-ui.css");
const themes = lire("soreal-idle-themes.css");
const nav = lire("modules/ui-navigation-v1.js");
const menus = lire("modules/ui-menus-v1.js");
const hud = lire("modules/hud-haut-v2.js");

/* 1. Titans : le mot garde un halo fixe, le calque ::after (texte de data-t) apparaît en fondu, 0 à 0 % et à 100 % (règle n°3) */
assert.ok(ui.includes("@keyframes soreal-idle-nav-titans-brille-v1{0%,100%{opacity:0}50%{opacity:1}}"), "Titans : keyframes en opacité seule");
const mot = ui.match(/\.soreal-idle-nav-titans-brille-v1\{[^}]*\}/);
assert.ok(mot && !mot[0].includes("animation"), "Titans : le mot lui-même n'est pas animé");
const calque = ui.match(/\.soreal-idle-nav-titans-brille-v1::after\{[^}]*\}/);
assert.ok(calque && calque[0].includes("content:attr(data-t)") && calque[0].includes("opacity:0") && calque[0].includes("filter:brightness(1.7) drop-shadow(0 0 9px rgba(255,214,74,1))") && calque[0].includes("animation:soreal-idle-nav-titans-brille-v1 1.5s ease-in-out infinite"), "Titans : calque plus clair, filtre FIXE, opacité animée");
assert.ok(menus.includes('class="soreal-idle-nav-titans-brille-v1" data-t="Titans"'), "Titans : le texte du calque vient de data-t");

/* 2. Aurore : la règle de la barre de Magie n'applique plus l'animation (les keyframes restent, gardés par idle-barres-boucles-parfaites-v1) */
const lignesMagie = themes.split("\n").filter((l) => l.includes(".soreal-idle-magic-panel-v1") && l.includes(".soreal-idle-energybar-v11{background:linear-gradient(90deg,#3a7bff"));
assert.equal(lignesMagie.length, 1, "règle de la barre de Magie présente");
assert.ok(!lignesMagie[0].includes("animation"), "Aurore : plus d'animation appliquée (invisible, recalcul de style à chaque image)");

/* 3. boutons du menu hors de l'écran */
const pause = ui.match(/[^\n]*\.soreal-idle-nav-button-v28\.nav-hors-v1,[^\n]*\{animation-play-state:paused!important\}/);
assert.ok(pause, "feuille : animations des boutons hors écran en pause");
for (const part of [".nav-hors-v1::before", ".nav-hors-v1::after", ".nav-hors-v1 *", ".nav-hors-v1 *::before", ".nav-hors-v1 *::after"]) assert.ok(pause[0].includes(part), "pause : " + part);
assert.ok(nav.includes("new IntersectionObserver") && nav.includes("'nav-hors-v1'") && nav.includes("__SOREAL_IDLE_NAV_HORS_ECRAN_V1__"), "observateur unique posant nav-hors-v1");
assert.ok(nav.includes('data-morph-classes-gardees="^nav-hors-v1$"'), "le redessin garde la classe posée par le module (règle n°4)");
assert.ok(!nav.includes(".currentTime=") && !nav.includes(".pause()"), "aucun objet Animation touché par script (la pause CSS resterait sans effet)");
assert.ok(hud.includes("__SOREAL_IDLE_NAV_HORS_ECRAN_V1__"), "les boutons neufs sont observés par la minuterie du bandeau (250 ms)");

/* 4. barre dépensée */
assert.ok(ui.includes(".soreal-idle-energy-panel-v34.soreal-idle-vide-v2 *{animation-play-state:paused!important}") || ui.includes(".soreal-idle-vide-v2 *::after{animation-play-state:paused!important}"), "barre dépensée : animations en pause");
assert.ok(ui.includes(".soreal-idle-vide-v2 *::before") && ui.includes(".soreal-idle-vide-v2 *::after"), "barre dépensée : pseudo-éléments compris");

console.log("idle-fluidite-bandeau-v1: OK");
