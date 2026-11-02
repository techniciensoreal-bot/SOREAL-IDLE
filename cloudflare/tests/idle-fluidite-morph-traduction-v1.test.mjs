import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { Element, Texte, creerDocument, racine } from "./helpers/mini-dom.mjs";

/*
 * Audit de fluidité du 2026-11-02 : redessin d'un menu vivant (Yggdrasil, Mineurs, NGU…) EN ANGLAIS (et en français pour les libellés écrits en anglais dans le code).
 * Avant : à chaque redessin le rendu sur place (morph-v1.js) réécrivait le texte d'ORIGINE de chaque nœud déjà traduit (centaines de nœuds de texte et d'attributs title),
 * puis le traducteur du DOM (traduction-anglais-v1.js / traduction-interface-v1.js) les retraduisait aussitôt : ping-pong inutile, 2 écritures par nœud et par redessin.
 * Ici, avec les VRAIS modules sur un DOM simulé :
 *   - un redessin sans changement d'un nœud déjà traduit = 0 écriture (texte ET attribut title) ;
 *   - un texte d'origine changé = 1 seule écriture, directement traduite (jamais le texte d'origine entre-aperçu) ;
 *   - un attribut title changé = idem ;
 *   - un texte sans traduction = 1 écriture brute (comportement d'avant) ;
 *   - HTML identique au dernier redessin = rien n'est comparé (installer), resynchronisation complète au plus tard 4 s après ;
 *   - un nœud modifié par ailleurs (texte affiché différent de celui du traducteur) est remis à jour : la mémoire n'est jamais crue sans preuve.
 */
const R = "cloudflare/public/modules/";

// --- compléments de mini-DOM (test seulement) ---
const protoNoeud = Object.getPrototypeOf(Texte.prototype);
if (!Object.getOwnPropertyDescriptor(protoNoeud, "parentElement")) {
  Object.defineProperty(protoNoeud, "parentElement", { get() { return this.parentNode && this.parentNode.nodeType === 1 ? this.parentNode : null; } });
}
Element.prototype.closest = function () { return null; };
const ecritsAttr = [];
const setAttributOrigine = Element.prototype.setAttribute;
Element.prototype.setAttribute = function (n, v) { if (this.isConnected) ecritsAttr.push([n, String(v)]); return setAttributOrigine.call(this, n, v); };

function textes(n, out = []) {
  if (n.nodeType === 3) out.push(n);
  else n.childNodes.forEach((c) => textes(c, out));
  return out;
}
/* Compte les écritures de nodeValue des nœuds déjà présents. */
function espionner(r) {
  const journal = [];
  textes(r).forEach((n) => {
    let v = n.nodeValue;
    Object.defineProperty(n, "nodeValue", { configurable: true, get() { return v; }, set(x) { journal.push(String(x)); v = String(x); } });
  });
  return journal;
}
function monde(langue, horloge) {
  const doc = creerDocument();
  doc.readyState = "complete";
  doc.addEventListener = () => {};
  doc.createTreeWalker = (rac, _quoi, filtre) => {
    const liste = [];
    (function aller(n) { n.childNodes.forEach((c) => { if (c.nodeType === 3) { if (!filtre || filtre.acceptNode(c) === 1) liste.push(c); } else if (c.nodeType === 1) { if (!filtre || filtre.acceptNode(c) !== 2) aller(c); } }); })(rac);
    let i = -1;
    return { nextNode() { i += 1; return liste[i] || null; } };
  };
  const stockage = { getItem: () => langue, setItem() {} };
  const win = { localStorage: stockage, addEventListener() {}, document: doc, Element, Object, Array, Map, Set, String, Boolean, WeakMap, RegExp, JSON, Math, Date: { now: () => horloge.t }, console };
  win.window = win;
  Object.assign(win, { fetch: () => new Promise(() => {}), requestAnimationFrame: (f) => f(), MutationObserver: function () { this.observe = () => {}; }, NodeFilter: { SHOW_TEXT: 4, FILTER_ACCEPT: 1, FILTER_REJECT: 2 }, setTimeout, clearTimeout });
  vm.createContext(win);
  return { win, doc };
}
function charger(win, fichier) { vm.runInContext(readFileSync(R + fichier, "utf8"), win, { filename: fichier }); }

const dico = JSON.parse(readFileSync(R + "traduction-anglais-dict-v1.json", "utf8"));
const html = (a, b, c, t) => `<div class="bloc"><span class="a">${a}</span><b class="b">${b}</b><i class="c">${c}</i><button class="btn" title="${t}">x</button></div>`;

// ================= ANGLAIS =================
{
  const horloge = { t: 1000 };
  const { win, doc } = monde("en", horloge);
  charger(win, "morph-v1.js");
  charger(win, "traduction-anglais-v1.js");
  const M = win.__SOREAL_IDLE_MORPH_V1__;
  win.__SOREAL_IDLE_TRADUCTION_ANGLAIS_V1__.charger(dico);
  const r = racine(html("Fermer", "Niveau suivant dans 2 s", "123", "Acheter"));
  doc.body = r;
  win.__SOREAL_IDLE_LANGUE_CHANGEE_V1__("en"); // traduit la page (comme le menu Réglages)
  const lire = () => textes(r).map((n) => n.nodeValue);
  assert.deepEqual(lire().slice(0, 3), ["Close", "Next level in 2 s", "123"], "page traduite au départ");
  assert.equal(r.querySelectorAll("button")[0].getAttribute("title"), "Buy");

  // 1. Redessin SANS changement (HTML d'origine en français) : 0 écriture de texte, 0 écriture d'attribut.
  let journal = espionner(r);
  ecritsAttr.length = 0;
  M.morpherHtml(r, html("Fermer", "Niveau suivant dans 2 s", "123", "Acheter"));
  assert.equal(journal.length, 0, "aucun nœud de texte réécrit : " + JSON.stringify(journal));
  assert.equal(ecritsAttr.length, 0, "aucun attribut réécrit : " + JSON.stringify(ecritsAttr));
  assert.deepEqual(lire().slice(0, 3), ["Close", "Next level in 2 s", "123"], "toujours en anglais");

  // 2. Un texte d'origine change : UNE écriture, directement en anglais.
  journal.length = 0; ecritsAttr.length = 0;
  M.morpherHtml(r, html("Fermer", "Niveau suivant dans 2 s", "123", "Acheter").replace("Fermer", "Tout retirer"));
  assert.deepEqual(journal, ["Remove all"], "1 écriture, traduite : " + JSON.stringify(journal));
  assert.equal(ecritsAttr.length, 0);
  // et le redessin suivant, identique, ne touche plus rien
  journal.length = 0;
  M.morpherHtml(r, html("Tout retirer", "Niveau suivant dans 2 s", "123", "Acheter"));
  assert.equal(journal.length, 0, "retraduit une fois, puis plus rien");

  // 3. Un titre (title) d'origine change : UNE écriture d'attribut, traduite.
  ecritsAttr.length = 0;
  M.morpherHtml(r, html("Tout retirer", "Niveau suivant dans 2 s", "123", "Fermer"));
  assert.deepEqual(ecritsAttr, [["title", "Close"]], JSON.stringify(ecritsAttr));
  ecritsAttr.length = 0;
  M.morpherHtml(r, html("Tout retirer", "Niveau suivant dans 2 s", "123", "Fermer"));
  assert.equal(ecritsAttr.length, 0);

  // 4. Texte sans traduction (compteur) : une écriture brute, comme avant.
  journal.length = 0;
  M.morpherHtml(r, html("Tout retirer", "Niveau suivant dans 2 s", "124", "Fermer"));
  assert.deepEqual(journal, ["124"]);

  // 5. Nœud traduit puis modifié par ailleurs (texte affiché ≠ celui du traducteur) : le redessin le remet à l'état du jeu.
  textes(r)[0].nodeValue = "Autre chose";
  journal.length = 0;
  M.morpherHtml(r, html("Tout retirer", "Niveau suivant dans 2 s", "124", "Fermer"));
  assert.deepEqual(journal, ["Remove all"], "mémoire non crue sans preuve : " + JSON.stringify(journal));

  // 6. Interrupteur de langue : repasser en français restitue l'origine, le redessin suivant n'écrit pas de texte périmé.
  win.__SOREAL_IDLE_LANGUE_CHANGEE_V1__("fr");
  const stockage = win.localStorage; stockage.getItem = () => "fr";
  assert.equal(lire()[0], "Tout retirer");
  journal.length = 0;
  M.morpherHtml(r, html("Tout retirer", "Niveau suivant dans 2 s", "124", "Fermer"));
  assert.equal(journal.length, 0, "en français aussi, rien à réécrire");
  M.morpherHtml(r, html("Fermer", "Niveau suivant dans 2 s", "124", "Fermer"));
  assert.equal(lire()[0], "Fermer", "en français, le texte d'origine est écrit tel quel");
}

// ================= FRANÇAIS (libellés écrits en anglais dans le code) =================
{
  const horloge = { t: 1000 };
  const { win, doc } = monde("fr", horloge);
  const r = racine(html("Energy", "Magic", "7", "Energy Cap"));
  doc.body = r;
  doc.getElementById = () => r;
  charger(win, "morph-v1.js");
  charger(win, "traduction-interface-v1.js"); // traduit tout de suite la page
  const M = win.__SOREAL_IDLE_MORPH_V1__;
  const lire = () => textes(r).map((n) => n.nodeValue);
  assert.deepEqual(lire().slice(0, 3), ["Énergie", "Magie", "7"], "page traduite au départ : " + JSON.stringify(lire()));
  assert.equal(r.querySelectorAll("button")[0].getAttribute("title"), "Plafond d’Énergie");

  let journal = espionner(r);
  ecritsAttr.length = 0;
  M.morpherHtml(r, html("Energy", "Magic", "7", "Energy Cap"));
  assert.equal(journal.length, 0, "FR : aucun nœud réécrit : " + JSON.stringify(journal));
  assert.equal(ecritsAttr.length, 0, "FR : aucun attribut réécrit");

  M.morpherHtml(r, html("Energy", "Shop", "7", "Energy Cap"));
  assert.deepEqual(journal, ["Boutique"], "FR : 1 écriture, directement en français : " + JSON.stringify(journal));
  journal.length = 0;
  M.morpherHtml(r, html("Energy", "Shop", "8", "Energy Cap"));
  assert.deepEqual(journal, ["8"]);
  ecritsAttr.length = 0;
  M.morpherHtml(r, html("Energy", "Shop", "8", "Magic Cap"));
  assert.deepEqual(ecritsAttr, [["title", "Plafond de Magie"]]);
}

// ================= HTML identique : rien n'est comparé, resynchronisation au plus tard 4 s après =================
{
  const horloge = { t: 1000 };
  const { win, doc } = monde("fr", horloge);
  charger(win, "morph-v1.js");
  const M = win.__SOREAL_IDLE_MORPH_V1__;
  const r = racine("");
  r.setAttribute("class", "soreal-idle-page-root-v28");
  M.installer(r);
  r.innerHTML = '<div class="a">un</div><p class="b">deux</p>';
  const a = r.children[0];
  assert.equal(a.textContent, "un");
  // un autre module touche la page entre deux redessins identiques
  a.childNodes[0].nodeValue = "modifié ailleurs";
  horloge.t += 400;
  r.innerHTML = '<div class="a">un</div><p class="b">deux</p>';
  assert.equal(a.textContent, "modifié ailleurs", "HTML identique : pas de comparaison, rien n'est touché");
  horloge.t += 3700; // > 4 s depuis le dernier vrai redessin
  r.innerHTML = '<div class="a">un</div><p class="b">deux</p>';
  assert.equal(a.textContent, "un", "resynchronisation complète au plus tard après 4 s");
  // un HTML différent est toujours appliqué
  r.innerHTML = '<div class="a">trois</div><p class="b">deux</p>';
  assert.equal(r.children[0], a, "même nœud");
  assert.equal(a.textContent, "trois");
  // les enfants remplacés par ailleurs : redessin complet même si le HTML est identique
  horloge.t += 100;
  const neuf = doc.createElement("div"); neuf.setAttribute("class", "x");
  r.insertBefore(neuf, r.children[0]);
  r.innerHTML = '<div class="a">trois</div><p class="b">deux</p>';
  assert.deepEqual(r.children.map((c) => c.className), ["a", "b"], "le bloc étranger est retiré : le redessin n'est pas ignoré");
}

// Le rendu complet de la page (#app, sans cette classe) garde toujours la comparaison complète ; un changement de langue annule aussi l'omission.
{
  const horloge = { t: 1000 };
  const { win } = monde("en", horloge);
  charger(win, "morph-v1.js");
  charger(win, "traduction-anglais-v1.js");
  const M = win.__SOREAL_IDLE_MORPH_V1__;
  const app = racine("");
  M.installer(app);
  app.innerHTML = '<p class="b">deux</p>';
  app.children[0].childNodes[0].nodeValue = "modifié ailleurs";
  app.innerHTML = '<p class="b">deux</p>';
  assert.equal(app.children[0].textContent, "deux", "hors du conteneur de menu : comparaison complète à chaque redessin");
  const r = racine("");
  r.setAttribute("class", "soreal-idle-page-root-v28");
  M.installer(r);
  r.innerHTML = '<p class="b">deux</p>';
  r.children[0].childNodes[0].nodeValue = "modifié ailleurs";
  win.__SOREAL_IDLE_LANGUE_CHANGEE_V1__("fr");
  r.innerHTML = '<p class="b">deux</p>';
  assert.equal(r.children[0].textContent, "deux", "changement de langue : redessin complet même si le HTML est identique");
}

// ================= garde de code =================
{
  const morph = readFileSync(R + "morph-v1.js", "utf8");
  assert.ok(morph.includes("__SOREAL_IDLE_TRAD_MEMOIRE_V1__"), "le morph lit la mémoire de traduction");
  for (const f of ["traduction-anglais-v1.js", "traduction-interface-v1.js"]) {
    const s = readFileSync(R + f, "utf8");
    assert.ok(s.includes("__SOREAL_IDLE_TRAD_MEMOIRE_V1__") && s.includes("accrocs.push"), f + " : mémoire et accroche du rendu sur place");
  }
}

console.log("idle-fluidite-morph-traduction-v1: ok");
