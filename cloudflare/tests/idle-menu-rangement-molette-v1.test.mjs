import assert from "node:assert/strict";
import fs from "node:fs";

/* Norman (2026-11-03) : « sur PC, quand on édite le menu (qu'on tient son doigt dessus) je veux qu'on puisse quand même scroll le menu pour y placer les menus comme on veut ». */
const src = fs.readFileSync(new URL("../public/modules/ui-menus-v1.js", import.meta.url), "utf8");
const i = src.indexOf("document.addEventListener('wheel'");
assert.ok(i > 0, "un écouteur de molette existe dans le rangement du menu");
const bloc = src.slice(i, src.indexOf("['pointerup','pointercancel']", i));
assert.ok(/if\(!REG\.idleMenuEditionV1\)return;/.test(bloc), "seulement en mode rangement (le reste du jeu garde sa molette)");
assert.ok(/passive:false,capture:true/.test(bloc) && /ev\.preventDefault\(\)/.test(bloc), "la molette est prise en charge (pas passive)");
assert.ok(/cont\.scrollTop\+=dy/.test(bloc) && /conteneurDefilant\(nav\)/.test(bloc), "elle fait défiler le conteneur du menu");
assert.ok(/glisse\.sale=true/.test(bloc) && /defilerPendantGlisse/.test(bloc), "le bouton tenu est replacé sous le pointeur après le défilement");
assert.ok(/deltaMode===1/.test(bloc) && /deltaMode===2/.test(bloc), "molettes en lignes et en pages gérées");
// PC : en rangement la barre reste UNE colonne qui défile verticalement (plus de « wrap » qui rejetait les boutons dans une 2e colonne cachée)
const css = fs.readFileSync(new URL("../public/soreal-idle-ui.css", import.meta.url), "utf8");
const bloc2 = css.slice(css.indexOf("/* Rangement des menus sur PC (Norman, 2026-11-03"));
assert.ok(bloc2.includes("@media (min-width:1100px) and (hover:hover) and (pointer:fine),(min-width:1500px) and (min-height:800px){"), "même condition que la barre en colonne (themes.css)");
assert.ok(/.soreal-idle-nav-v28.edition{flex-wrap:nowrap;overflow-x:hidden;--nav-banner-flex:0 0 auto;--nav-edition-ov:auto}/.test(bloc2), "colonne unique, sans retour à la ligne, qui défile en hauteur");
assert.ok(!/!s*important/.test(bloc2), "aucun !important ajouté");
const itopod = fs.readFileSync(new URL("../public/soreal-idle-itopod.css", import.meta.url), "utf8");
assert.ok(itopod.includes("flex:var(--nav-banner-flex,1 0 100%)!important"), "le bandeau garde sa hauteur dans la colonne (variable), toute la largeur ailleurs");
console.log("idle-menu-rangement-molette-v1: OK");
