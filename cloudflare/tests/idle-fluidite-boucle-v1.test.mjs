import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const lire = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8").replace(/\r\n/g, "\n");
/*
 * Audit de fluidité du 2026-11-02 (boucle de jeu, Combat de boss) : ce test fige chaque optimisation en exécutant le VRAI code sur un faux document.
 * Mesure de départ (Combat de boss, dix modules anciens abonnés au runtime) : ~11 réveils par seconde CHACUN, parce que les spans « nb-suf » des chiffres colorés (recréés à chaque changement de nombre,
 * ~30 fois par seconde) étaient pris pour de vrais ajouts d'éléments.
 */
const span = (cls) => ({ nodeType: 1, classList: { contains: (c) => c === cls }, tagName: "SPAN" });
const bloc = () => ({ nodeType: 1, classList: { contains: () => false }, tagName: "DIV" });
const texte = () => ({ nodeType: 3 });

/* 1. runtime.js : un lot qui ne contient que des spans nb-suf ne relance AUCUN abonné ; un vrai élément, si (le minuteur de 70 ms s'exécute tout de suite pour que chaque lot se mesure seul) */
{
  let rappel = null;
  let appels = 0;
  const faux = {
    document: { readyState: "complete", getElementById: () => ({}), body: {}, querySelector: () => ({}), addEventListener() {} },
    MutationObserver: class { constructor(f) { rappel = f; } observe() {} },
    setTimeout: (f, ms) => { if (ms === 70) { appels += 1; f(); } return 0; },
    clearTimeout() {},
    console,
    Promise,
  };
  faux.window = faux;
  vm.createContext(faux);
  vm.runInContext(lire("public/modules/runtime.js"), faux);
  let rendus = 0;
  faux.window.__SOREAL_IDLE_RUNTIME_V1__.onRender(() => { rendus += 1; });
  const base = appels;
  const lot = (ajoutes, retires) => [{ type: "childList", addedNodes: ajoutes, removedNodes: retires }];
  rappel(lot([span("nb-suf")], [span("nb-suf"), texte()]));
  assert.equal(appels, base, "des spans nb-suf ajoutés/retirés ne relancent aucun abonné");
  rappel(lot([texte()], [texte()]));
  assert.equal(appels, base, "des nœuds de texte seuls non plus (comme avant)");
  rappel(lot([bloc()], []));
  assert.equal(appels, base + 1, "un vrai élément ajouté relance les abonnés");
  rappel(lot([], [bloc()]));
  assert.equal(appels, base + 2, "un vrai élément retiré aussi");
  rappel(lot([span("nb-suf"), bloc()], []));
  assert.equal(appels, base + 3, "un lot mélangé avec un vrai élément relance");
  rappel(lot([span("autre-span")], []));
  assert.equal(appels, base + 4, "un span qui n'est pas nb-suf compte");
}

/* 2. Le même filtre dans la scène d'Aventure, la correction d'image d'objet et la ligne unique des objets */
{
  const scene = lire("public/modules/adventure-scene-v79.js");
  assert.ok(scene.includes("function ajoutElementUtile_(lots)") && scene.includes("if(!ajoutElementUtile_(lots))return;") && scene.includes("new MutationObserver(function(lots){") && scene.includes("nb-suf"), "scène d'Aventure : filtre des spans nb-suf");
  /* ordre : le filtre vient AVANT les recherches DOM de l'observateur */
  const obs = scene.slice(scene.indexOf("function observerEntree_()"));
  assert.ok(obs.indexOf("ajoutElementUtile_(lots)") < obs.indexOf("root_()"), "le filtre précède root_()");
  const diff = lire("public/modules/item-difficulte-v1.js");
  assert.ok(diff.includes("noeud.tagName!=='IMG'&&!noeud.firstElementChild)return;"), "image d'objet : un élément sans enfant n'est pas fouillé");
  const ligne = lire("public/modules/ligne-unique-items-v1.js");
  assert.ok(ligne.includes("a[j].firstElementChild&&a[j].querySelector('.soreal-idle-item-popup-v1')"), "ligne unique : pas de recherche dans un élément sans enfant");
}
{
  /* item-difficulte : exécution réelle de corriger_ via l'observateur, sur un faux document */
  let obs = null;
  const recherches = [];
  const faux = {
    document: { readyState: "complete", body: {}, addEventListener() {} },
    MutationObserver: class { constructor(f) { obs = f; } observe() {} },
    HTMLImageElement: function () {},
    console,
    REG: undefined,
  };
  faux.HTMLImageElement.prototype = {};
  faux.window = faux;
  vm.createContext(faux);
  vm.runInContext(lire("public/modules/item-difficulte-v1.js"), faux);
  assert.equal(typeof obs, "function", "l'observateur d'images d'objets démarre");
  const feuille = { nodeType: 1, tagName: "SPAN", firstElementChild: null, querySelectorAll() { recherches.push("feuille"); return []; } };
  const boite = { nodeType: 1, tagName: "DIV", firstElementChild: {}, querySelectorAll() { recherches.push("boite"); return []; } };
  obs([{ addedNodes: [feuille, feuille, feuille] }]);
  assert.deepEqual(recherches, [], "un span sans enfant ne déclenche aucune recherche");
  obs([{ addedNodes: [boite] }]);
  assert.deepEqual(recherches, ["boite"], "une boîte avec des enfants est toujours fouillée");
}

/* 3. Boutons de sorts : liste mémorisée, relue seulement quand la page change vraiment */
{
  const src = lire("public/modules/ui-magie-energie-v1.js");
  const debut = src.indexOf("let boutonsSortsV90=[];");
  const fin = src.indexOf("function actualiserManaSortsIdleV90_(");
  assert.ok(debut !== -1 && fin > debut, "bloc de mémorisation présent");
  assert.ok(src.includes("boutonsSortsIdleV90_()" + String.fromCharCode(10) + "          .forEach(function(button){") && src.split("slice.call(document.querySelectorAll('[data-sort-idle-v90]'))").length === 2, "la boucle de sorts lit la liste mémorisée : une seule recherche, dans la fonction qui la relit");
  const code = src.slice(debut, fin);
  let rappel = null;
  let recherches = 0;
  let boutons = [{ id: 1 }, { id: 2 }];
  let nbObs = 0;
  const corps = {};
  const faux = {
    document: { body: corps, querySelectorAll: () => { recherches += 1; return boutons; } },
    MutationObserver: class {
      constructor(f) { rappel = f; nbObs += 1; }
      observe(hote, opts) { this.opts = opts; assert.equal(hote, corps); assert.equal(opts.childList, true); assert.equal(opts.subtree, true); assert.equal(JSON.stringify(opts.attributeFilter), JSON.stringify(["data-sort-idle-v90"])); }
      disconnect() {}
      takeRecords() { return []; }
    },
    Array,
  };
  vm.createContext(faux);
  const lecteur = vm.runInContext("(function(){" + code + "; return boutonsSortsIdleV90_;})()", faux);
  assert.deepEqual(lecteur().map((b) => b.id), [1, 2], "première lecture : recherche");
  assert.equal(recherches, 1);
  for (let i = 0; i < 200; i += 1) lecteur();
  assert.equal(recherches, 1, "200 images plus tard : toujours une seule recherche");
  rappel([{ type: "childList", addedNodes: [span("nb-suf")], removedNodes: [span("nb-suf"), texte()] }]);
  lecteur();
  assert.equal(recherches, 1, "des spans nb-suf ne rendent pas la liste périmée");
  boutons = [{ id: 3 }];
  rappel([{ type: "childList", addedNodes: [bloc()], removedNodes: [] }]);
  assert.deepEqual(lecteur().map((b) => b.id), [3], "un vrai élément ajouté : la liste est relue (jamais périmée)");
  assert.equal(recherches, 2);
  boutons = [];
  rappel([{ type: "childList", addedNodes: [], removedNodes: [bloc()] }]);
  assert.equal(lecteur().length, 0, "un vrai élément retiré : relue");
  boutons = [{ id: 9 }];
  rappel([{ type: "attributes", attributeName: "data-sort-idle-v90", addedNodes: [], removedNodes: [] }]);
  assert.deepEqual(lecteur().map((b) => b.id), [9], "l'attribut d'un bouton change : relue");
  assert.equal(nbObs, 1, "un seul observateur");
}

/* 4. Bulles de sang : le calque est gardé par le morph, l'hôte garde overflow:hidden par un attribut inscrit, un redessin remet tout dans la même tâche */
{
  const src = lire("public/modules/bulles-sang-v1.js");
  assert.ok(src.includes('<i class="sg-bulles-v1" aria-hidden="true" data-morph-garder>'), "calque gardé par le morph");
  assert.ok(src.includes("push('data-sg-hote')"), "attribut de l'hôte inscrit dans la liste des attributs gardés");
  assert.ok(src.includes("__SOREAL_IDLE_APRES_REDESSIN_V1__=window.__SOREAL_IDLE_APRES_REDESSIN_V1__||[]).push(function(){") && src.includes("if(b&&!b.hasAttribute('data-sg-hote'))poser_();"), "remise en état juste après chaque redessin, test léger");
  const css = lire("public/soreal-idle-themes.css");
  assert.ok(css.includes(".sg-hote-v1,[data-sg-hote]{overflow:hidden}"), "overflow caché tenu aussi par l'attribut");
  /* exécution réelle sur un faux document : un redessin qui réécrit la classe de l'hôte ne casse plus rien */
  const crayon = () => {
    const attrs = new Map();
    const classes = new Set();
    const enfants = [];
    const el = {
      style: {},
      classList: { add: (c) => classes.add(c), remove: (c) => classes.delete(c), contains: (c) => classes.has(c) },
      setAttribute: (k, v) => attrs.set(k, v),
      removeAttribute: (k) => attrs.delete(k),
      hasAttribute: (k) => attrs.has(k),
      getAttribute: (k) => (attrs.has(k) ? attrs.get(k) : null),
      matches: () => true,
      querySelector: () => (enfants.length ? enfants[0] : null),
      insertAdjacentHTML: (_p, html) => { enfants.push({ html, parentElement: el, remove() { enfants.length = 0; } }); },
      _attrs: attrs, _classes: classes, _enfants: enfants,
    };
    return el;
  };
  const hote = crayon();
  const faux = {
    document: {
      hidden: false,
      querySelectorAll: (sel) => (sel === ".sg-bulles-v1" ? hote._enfants.slice() : [hote]),
    },
    getComputedStyle: () => ({ position: "absolute", backgroundImage: "" }),
    setInterval() {},
    console,
  };
  faux.window = faux;
  hote._enfants.push = Array.prototype.push;
  vm.createContext(faux);
  vm.runInContext(src, faux);
  assert.equal(hote._enfants.length, 1, "le calque est posé");
  assert.ok(hote._enfants[0].html.includes("data-morph-garder"), "le calque posé porte data-morph-garder");
  assert.ok(hote._attrs.has("data-sg-hote"), "l'hôte porte l'attribut qui tient overflow");
  /* un redessin réécrit la classe : l'attribut, lui, est gardé ; rien n'est reposé en double */
  hote._classes.clear();
  faux.window.__SOREAL_IDLE_BULLES_SANG_V1__.poser();
  assert.equal(hote._enfants.length, 1, "pas de second calque");
  assert.ok(hote._attrs.has("data-sg-hote"), "attribut toujours là");
  assert.ok(faux.window.__SOREAL_IDLE_MORPH_ATTRIBUTS_GARDES_V1__.includes("data-sg-hote"), "inscrit dans la liste du morph");
  assert.equal(faux.window.__SOREAL_IDLE_APRES_REDESSIN_V1__.length, 1, "une remise en état inscrite");
  /* barre du boss recréée par le morph (plus d'attribut) : le calque revient dans la même tâche ; barre intacte : aucune recherche */
  const bossBar = crayon();
  bossBar.id = "sorealIdleBossBarV7";
  let posees = 0;
  const fauxDoc2 = faux.document;
  const dejaQSA = fauxDoc2.querySelectorAll;
  fauxDoc2.querySelectorAll = (s) => { posees += 1; return dejaQSA(s); };
  fauxDoc2.getElementById = (id) => (id === "sorealIdleBossBarV7" ? bossBar : null);
  const hook = faux.window.__SOREAL_IDLE_APRES_REDESSIN_V1__[0];
  bossBar.setAttribute("data-sg-hote", "");
  hook();
  assert.equal(posees, 0, "barre intacte : le crochet ne fait aucune recherche DOM");
  bossBar.removeAttribute("data-sg-hote");
  hook();
  assert.ok(posees > 0, "barre recréée : la pose complète est refaite");
}
console.log("idle-fluidite-boucle-v1 OK");
