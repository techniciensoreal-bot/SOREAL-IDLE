// Norman (2026-11-03) : trace de performance Chrome -> « reflows forcés » : des fonctions écrivent dans le DOM puis lisent aussitôt une mesure de mise en page (getBoundingClientRect, scrollHeight,
// getComputedStyle...), ce qui force un calcul de style / mise en page en pleine tâche (Layout 565 ms, Recalculate Style 362 ms). Cause à la source : ces mesures tournaient à CHAQUE tick / minuterie alors qu'elles ne
// changent qu'avec la taille d'un élément ou de la fenêtre. Corrigé : mémo + ResizeObserver (rappel exécuté après la mise en page : lecture gratuite), lectures avant écritures, un seul calcul au lieu d'une boucle.
// Mesuré dans le navigateur (compte de lectures géométriques après écriture) : chargement + 9 s : 71 -> 23 ; menu Combat, 20 s : 48 -> 0 ; NGU / Yggdrasil / Augmentations / Aventure, 8 s : 0.
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
const lire = (f) => fs.readFileSync("cloudflare/public/" + f, "utf8").replace(/\r\n/g, "\n");
const corps = (src, debut, fin) => { const a = src.indexOf(debut); assert.ok(a >= 0, "introuvable : " + debut); const b = src.indexOf(fin, a + debut.length); assert.ok(b > a, "fin introuvable : " + fin); return src.slice(a, b); };

/* 1. Titre de menu (entete-menu-v1.js) : exécuté sur un faux DOM qui compte les lectures géométriques. Un cadre déjà mesuré n'est PLUS relu à chaque redessin / seconde. */
{
  const src = lire("modules/entete-menu-v1.js");
  let lectures = 0, rappelRo = null, resize = null;
  const lect = () => { lectures += 1; return { height: 40, top: 10 }; };
  const panneau = { isConnected: true, getBoundingClientRect: lect, closest: () => panneau };
  const natif = { isConnected: true, hasAttribute: (n) => n === "data-entete-menu" ? attrs.has(n) : false, setAttribute: (n) => attrs.add(n), getBoundingClientRect: lect };
  const attrs = new Set();
  const racine = {
    isConnected: true, getAttribute: () => "combat", getBoundingClientRect: lect, firstChild: natif,
    querySelectorAll: (s) => (s === ".soreal-idle-page-head-v28" ? [natif] : []),
    querySelector: () => null
  };
  const pv = { closest: () => panneau };
  const document = {
    readyState: "complete", hidden: false,
    getElementById: (id) => (id === "sorealIdleHudGPvV2" ? pv : id === "sorealIdleHudV2" ? panneau : null),
    querySelector: (s) => (s === ".soreal-idle-page-root-v28" ? racine : null),
    documentElement: { style: { setProperty() {} } },
    addEventListener() {}
  };
  const window = { addEventListener: (n, f) => { if (n === "resize") resize = f; } };
  window.window = window;
  vm.runInNewContext(src, {
    window, document, getComputedStyle: () => ({ zoom: "1", marginBottom: "6px" }), setInterval: () => 0, parseFloat, Math,
    ResizeObserver: class { constructor(f) { rappelRo = f; } observe() {} disconnect() {} }
  });
  const api = window.__SOREAL_IDLE_ENTETE_MENU_V1__;
  assert.ok(api, "module chargé");
  const apres1 = lectures;
  assert.ok(apres1 > 0, "la première fois, le cadre est mesuré");
  for (let i = 0; i < 10; i += 1) api.marquer();   /* dix redessins / secondes sans changement de taille */
  assert.equal(lectures, apres1, "aucune lecture géométrique tant que rien n'a changé de taille");
  rappelRo();   /* un élément a changé de taille : lecture dans le rappel du ResizeObserver */
  assert.ok(lectures > apres1, "un changement de taille relance la mesure");
  const apres2 = lectures;
  resize();     /* redimensionnement de la fenêtre (zoom) */
  assert.ok(lectures > apres2, "un redimensionnement relance la mesure");
  const apres3 = lectures;
  for (let i = 0; i < 10; i += 1) api.marquer();
  assert.equal(lectures, apres3, "puis plus aucune lecture");
}

/* 2. Barre de défilement du thème (defilement-theme-v1.js) : la même page, au même thème, ne relit plus les styles calculés toutes les 500 ms. */
{
  const src = lire("modules/defilement-theme-v1.js");
  let lecturesStyle = 0;
  const attrs = {};
  const racine = { className: "", style: { setProperty() {} }, getAttribute: (k) => attrs[k], setAttribute: (k, v) => { attrs[k] = v; } };
  const page = { className: "soreal-idle-page-root-v28", getAttribute: (k) => (k === "data-menu" ? menu : ""), };
  let menu = "wandoos";
  const cs = { getPropertyValue: () => "#8c7b58" };
  const document = { documentElement: racine, body: { className: "" }, hidden: false, head: { appendChild() {} }, createElement: () => ({}), querySelector: (s) => (s === ".soreal-idle-page-root-v28" ? page : null) };
  const fenetre = {};
  let tic = null;
  vm.runInNewContext(src, { window: fenetre, document, getComputedStyle: () => { lecturesStyle += 1; return cs; }, setInterval: (f) => { tic = f; return 0; } });
  assert.equal(lecturesStyle, 1, "lu une fois au chargement");
  for (let i = 0; i < 20; i += 1) tic();
  assert.equal(lecturesStyle, 1, "20 passages de la minuterie sans changement : aucune lecture de style");
  menu = "yggdrasil"; tic();
  assert.equal(lecturesStyle, 2, "un autre menu relance la lecture");
}

/* 3. Sources : chaque correctif lit AVANT d'écrire, mémorise, ou se branche sur un ResizeObserver. */
{
  const hud = lire("modules/hud-haut-v2.js");
  const placer = corps(hud, "function placer(){", "function texteBarre");
  assert.ok(!placer.includes("getComputedStyle") && !placer.includes("getBoundingClientRect"), "hud-haut : placer() (appelé à chaque tick de 250 ms) ne mesure plus rien");
  assert.ok(hud.includes("function mesurerNav(nav)") && corps(hud, "function placer(){", "function texteBarre").includes("new ResizeObserver"), "hud-haut : la hauteur du menu vient d'un ResizeObserver");

  const diag = lire("modules/diag-coffre-v1.js");
  assert.ok(!corps(diag, "setInterval(function(){", "},400);").includes("scrollHeight"), "diag-coffre : la minuterie de 400 ms ne lit plus scrollHeight");
  assert.ok(diag.includes("function noterHauteur()") && diag.includes("new ResizeObserver(function(){if(!document.hidden)noterHauteur();})"), "diag-coffre : hauteur lue dans le rappel d'un ResizeObserver");

  const bulles = lire("modules/bulles-sang-v1.js");
  const teinter = corps(bulles, "function teinterBoss_(el){", "function poser_(){");
  assert.ok(teinter.indexOf("calque.__cleBrute===cle0") > 0 && teinter.indexOf("calque.__cleBrute===cle0") < teinter.indexOf("getComputedStyle(bar)"), "bulles-sang : clé sans lecture de style AVANT getComputedStyle");

  const amor = lire("modules/ui-amorcage-v1.js");
  const copie = corps(amor, "let cleCopiePvV1=", "window.__SOREAL_IDLE_COPIER_STYLE_PV_V1__");
  assert.ok(copie.includes("new ResizeObserver") && copie.includes("if(copieStylePvFaiteV1&&cle===cleCopiePvV1&&!tailleChangeePvV1)return;"), "ui-amorcage : la copie du style de la barre de vie n'est refaite que si la clé ou la taille change");
  const nav = corps(amor, "function planifier(){if(attente)return;", "window.__ajusterMenuHauteurIdleV1__=ajuster;");
  assert.ok(nav.includes("push(planifier)"), "ui-amorcage : après un redessin, la mesure du menu est planifiée (image suivante), pas lue sur place");
  const filet = corps(amor, "window.__ajusterMenuHauteurIdleV1__=ajuster;", "}else setInterval(ajuster,1500);");
  assert.ok(filet.includes("new ResizeObserver") && !/setInterval\(ajuster/.test(filet) && filet.includes("--nav-dispo"), "ui-amorcage : menu mesuré par ResizeObserver ; le filet de 1,5 s ne lit aucune mise en page");

  const noyau = lire("modules/ui-noyau-v1.js");
  const rendu = corps(noyau, "const hoteHauteur=document.querySelector('.soreal-idle-native-v4');", "clearTimeout(window.__idleRelacherHauteurTimerV1__);");
  const iLecture = rendu.indexOf("const hauteurAvantRendu=");
  const avantLecture = rendu.slice(0, iLecture).replace(/\/\*[\s\S]*?\*\//g, "").replace(/if\(retenueEnCours\)\{[^}]*\}/, "");
  assert.ok(rendu.includes("if(retenueEnCours){") && iLecture > 0, "ui-noyau : la retenue de hauteur n'est relâchée avant la lecture que si elle est active");
  assert.ok(!avantLecture.includes("style.minHeight=''"), "ui-noyau : aucune écriture avant scrollHeight hors retenue active");

  assert.ok(!/hoteHauteur\.getBoundingClientRect\(\)\.top/.test(rendu) && rendu.includes("rectHote"), "ui-noyau : le rectangle du conteneur est lu avant les écritures");

  const combat = lire("modules/ui-combat-1-v1.js");
  const fit = corps(combat, "let taille=parseFloat(window.getComputedStyle(element).fontSize)||12;", "Cas extrême");
  assert.ok(fit.indexOf("const largeurTexte=element.scrollWidth") > 0 && fit.indexOf("const largeurTexte") < fit.indexOf("while("), "ui-combat : la taille qui rentre est calculée par UNE mesure avant la boucle de correction");
}

/* 4. La page charge bien les fichiers corrigés (numéros de version à jour : test idle-pins-assets-v1). */
{
  const idx = lire("index.html");
  for (const m of ["hud-haut-v2", "entete-menu-v1", "diag-coffre-v1", "bulles-sang-v1", "ui-amorcage-v1", "defilement-theme-v1", "ui-noyau-v1", "ui-combat-1-v1"]) assert.ok(idx.includes("modules/" + m + ".js?v="), m + " chargé par la page");
}
console.log("idle-reflows-forces-v1 : OK");
