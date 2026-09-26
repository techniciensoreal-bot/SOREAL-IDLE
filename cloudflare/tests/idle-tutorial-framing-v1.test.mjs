import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Tutoriel du début (Norman, 2026-09-26) : à chaque page, le jeu se place sur le bon menu, défile vers ce dont on parle et pose la fenêtre à l'endroit
 * qui ne le cache pas. Vérifié en navigateur (PC 1024x768 et téléphone 375x812) sur les 8 pages avec cadrage ; ici : câblage et règles de calcul.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const bloc = ui.slice(ui.indexOf("const TUTORIEL_DEBUT_JEU_PAGES_V1=["), ui.indexOf("const TUTORIEL_AVENTURE_PAGES_V1=["));

// 1. Une page = un cadrage, selon la demande
const attendu = [["Objectif", "stats"], ["Énergie", "energie"], ["Basic Training", "barres"], ["Bien joué", "barres"], ["Énergie Idle", "energie"], ["Saisie personnalisée", "saisie"], ["Défense", "blocage"], ["Fight Boss", "fight"]];
for (const [titre, cadrage] of attendu) {
  assert.ok(bloc.includes(`titre:'${titre}',\n          cadrage:'${cadrage}',`), titre + " -> " + cadrage);
}
assert.equal((bloc.match(/cadrage:'/g) || []).length, 8, "pas de cadrage sur les autres pages (le dernier écran reste où il est)");
// les pages de fin et d'accroche ne portent pas de cadrage
for (const titre of ["LE COMMENCEMENT", "Norman & Sébastien"]) {
  const i = bloc.indexOf(`titre:'${titre}'`);
  assert.ok(i >= 0 && !bloc.slice(i, i + 200).includes("cadrage:"), titre);
}
// la voix (textes lus) ne dépend pas du cadrage
assert.ok(ui.includes("function texteVoixTutorielIdleV1_(page){") && !/texteVoixTutorielIdleV1_[\s\S]{0,400}cadrage/.test(ui.slice(ui.indexOf("function texteVoixTutorielIdleV1_"), ui.indexOf("function texteVoixTutorielIdleV1_") + 500)));

// 2. Appel après affichage de la fenêtre flottante, avec le menu actif et le changement de menu
assert.ok(ui.includes("window.__SOREAL_IDLE_TUTO_CADRAGE_V1__.appliquer(page.cadrage||'',root,{"));
assert.ok(ui.includes("menuActif:function(){return idleMenuActifV28;}") && ui.includes("allerMenu:function(menu){menuIdleV28_(menu);}"));
assert.ok(ui.includes("location.hostname)){") && ui.includes("window.__SOREAL_IDLE_TUTO_REJOUER_V1__=function(index){"), "le rejeu de test n'existe qu'en local (nom d'hôte testé)");
assert.ok(/\/\^\(localhost\|127\\\.0\\\.0\\\.1\)\$\/\.test\(location\.hostname\)/.test(ui), "seulement localhost / 127.0.0.1");

// 3. Module : les 6 cadrages, menus voulus, règles de placement
const src = readFileSync("cloudflare/public/modules/tutorial-framing-v1.js", "utf8");
const fen = { addEventListener() {}, innerWidth: 1024, innerHeight: 768 };
vm.runInNewContext(src, { window: fen, document: { addEventListener() {}, querySelector: () => null }, setTimeout, clearTimeout, requestAnimationFrame: (f) => f(), getComputedStyle: () => ({ top: "6px" }) });
const api = fen.__SOREAL_IDLE_TUTO_CADRAGE_V1__;
assert.deepEqual([...api.cadrages].sort(), ["barres", "blocage", "energie", "fight", "saisie", "stats"]);
for (const [regle, morceau] of [
  ["Basic Training (stats) : menu entrainement", "stats:{\n    menu:'entrainement'"],
  ["Fight Boss : menu combat", "fight:{\n    menu:'combat'"],
  ["fenêtre sous les cases du haut", "poser(r,g.getBoundingClientRect().bottom+8)"],
  ["fenêtre sous la barre verte", "poser(r,$('.soreal-idle-energybar-wrap-v11').getBoundingClientRect().bottom+8)"],
  ["fenêtre sous « Tout retirer »", "$('.soreal-idle-bt-toolbar-v120 button.clear').getBoundingClientRect().bottom+8"],
  ["Blocage : fenêtre juste au-dessus", "poser(r,ligne.getBoundingClientRect().top-P-8)"],
  ["Fight Boss : fenêtre juste au-dessus du cadre", "poser(r,cadre.getBoundingClientRect().top-P-8)"],
  ["barres : fenêtre en haut, Attaque passive dessous", "if(V-8-distance>=haut+P+8)"],
  ["fenêtre déplacée à la main : plus replacée", "data-cadre-deplace"]
]) assert.ok(src.includes(morceau), regle);
assert.ok(readFileSync("cloudflare/public/index.html", "utf8").includes("/modules/tutorial-framing-v1.js?v=1"));
console.log("idle-tutorial-framing-v1: OK");
