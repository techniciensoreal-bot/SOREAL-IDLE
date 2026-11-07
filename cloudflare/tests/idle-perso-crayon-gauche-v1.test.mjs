import assert from "node:assert/strict";
import fs from "node:fs";
/* Norman (2026-11-01) : « le bouton pour éditer ses chiffres est coupé dans augmentation ; il peut être sur la gauche ». Cause : la feuille des Augmentations met `display:inline-block` (+ fond, padding) sur tout « span » d'une rangée de boutons, ce qui
   écrasait la grille de la paire : le crayon s'empilait sous le nombre et se faisait rogner. Le crayon est maintenant à GAUCHE, dans une colonne de 32 px, et la grille de la paire l'emporte sur les thèmes. */
const perso = fs.readFileSync(new URL("../public/modules/perso-boutons-v1.js", import.meta.url), "utf8");
const aug = fs.readFileSync(new URL("../public/soreal-idle-augment-led-haut-v1.css", import.meta.url), "utf8");
const i = perso.indexOf('<span class="perso-duo-v1 perso-duo-g-v1">');
assert.ok(i > 0, "paire « crayon à gauche »");
const bloc = perso.slice(i, perso.indexOf("</span>';", i));
assert.ok(bloc.indexOf('class="perso-edit-v1"') < bloc.indexOf("appliquerInput("), "le crayon vient AVANT le nombre");
assert.ok(perso.includes(".perso-duo-g-v1:not(#_)") && perso.includes("grid-template-columns:24px minmax(0,1fr)!important"), "colonne de 24 px (crayons discrets, 2026-11-07) d'abord, nombre ensuite");
assert.ok(perso.includes("min-width:24px!important;width:24px!important;border-radius:8px 0 0 8px"), "crayon : 24 px au moins, bords arrondis à gauche");
assert.ok(perso.includes("border-radius:0 8px 8px 0!important;border-left-width:0!important;padding:0 4px!important"), "nombre : bords arrondis à droite");
assert.ok(perso.includes(".soreal-idle-bt-presets-v120>.perso-duo-v1:not(#_)") && perso.includes("{display:grid!important;padding:0!important;background:none!important"), "la grille de la paire l'emporte sur le « span » des thèmes");
assert.ok(aug.includes(".soreal-idle-bt-presets-v120>span{display:inline-block"), "(repère) c'est bien cette règle des Augmentations qu'il faut battre");
/* aucun overflow qui rogne le crayon : l'ellipsis ne vaut que pour les textes des boutons, pas pour la paire */
assert.ok(!/\.perso-duo-g-v1[^{]*\{[^}]*overflow:hidden/.test(perso), "la paire elle-même ne rogne rien");
console.log("idle-perso-crayon-gauche-v1: OK");
/* Norman (2026-11-01) : « c'est trop grand dans NGU, les 4 boutons : 2 lignes max » : la rangée NGU est une grille de 4 colonnes (chaque paire en prend 2 : 2 + 2, plus d'un bouton par ligne sur téléphone), boutons de 30 px */
{
  const ngu = fs.readFileSync(new URL("../public/modules/ngu-labo-v1.js", import.meta.url), "utf8");
  assert.ok(ngu.includes("[data-perso-input-rangee]{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;--bt-btn-h:30px"), "NGU : « Mes nombres » sur 2 lignes au plus, boutons compacts");
  assert.ok(perso.includes(">.perso-duo-v1:not(#_):not(#_):not(#_){grid-column:span 2!important"), "chaque paire occupe 2 des 4 colonnes");
}
console.log("idle-perso-crayon-gauche-v1 (NGU 2 lignes): OK");
