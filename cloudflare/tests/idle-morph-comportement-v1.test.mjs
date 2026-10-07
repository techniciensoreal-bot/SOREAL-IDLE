import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { Element, creerDocument, racine } from "./helpers/mini-dom.mjs";

/*
 * Rendu sur place (modules/morph-v1.js) : tests de COMPORTEMENT sur un mini-DOM (lot 1b du chantier de nettoyage, docs/CHANTIER-NETTOYAGE.md).
 * Ce que les joueurs ont vu casser le 7 octobre 2026 : page redessinée au clic sur le coffre, scène d'Aventure sous une autre page, inventaire au-dessus du combat.
 */
const doc = creerDocument();
const fenetre = { document: doc, Element, Object, Array, Map, String, Boolean };
fenetre.window = fenetre;
vm.runInNewContext(readFileSync("cloudflare/public/modules/morph-v1.js", "utf8"), fenetre, { filename: "morph-v1.js" });
const M = fenetre.__SOREAL_IDLE_MORPH_V1__;
assert.ok(M && typeof M.morpherHtml === "function" && typeof M.installer === "function", "API exposée");

const classes = (el) => el.children.map((c) => c.className.split(" ")[0] || c.tagName.toLowerCase());

// 1. Un nœud inchangé reste LE MÊME objet ; texte et attributs sont mis à jour sur place.
{
  const r = racine('<div class="a" data-x="1"><span class="t">avant</span></div><p class="b">fixe</p>');
  const a = r.children[0], span = a.children[0], b = r.children[1];
  M.morpherHtml(r, '<div class="a" data-x="2"><span class="t">après</span></div><p class="b">fixe</p>');
  assert.equal(r.children[0], a, "même <div>");
  assert.equal(a.children[0], span, "même <span>");
  assert.equal(r.children[1], b, "même <p>");
  assert.equal(span.textContent, "après");
  assert.equal(a.getAttribute("data-x"), "2");
}

// 2. Éléments retirés / ajoutés ; attribut supprimé.
{
  const r = racine('<div class="a" title="t">1</div><div class="b">2</div><div class="c">3</div>');
  const a = r.children[0], c = r.children[2];
  M.morpherHtml(r, '<div class="a">1</div><div class="c">3</div><div class="d">4</div>');
  assert.deepEqual(classes(r), ["a", "c", "d"]);
  assert.equal(r.children[0], a);
  assert.equal(r.children[1], c, "le bloc c a été gardé tel quel");
  assert.equal(a.getAttribute("title"), null, "attribut absent du nouveau HTML : retiré");
}

// 3. Éléments à identifiant : suivis même s'ils changent de place.
{
  const r = racine('<div id="x">X</div><div id="y">Y</div>');
  const x = r.children[0], y = r.children[1];
  M.morpherHtml(r, '<div id="y">Y2</div><div id="x">X2</div>');
  assert.equal(r.children[0], y, "y est passé en tête, c'est le même nœud");
  assert.equal(r.children[1], x);
  assert.equal(y.textContent, "Y2");
}

// 4. Bloc posé par un autre module (data-morph-garder) : gardé quand la page reste la même.
{
  const r = racine('<div class="page" data-menu="aventure"><div class="zones">Z</div><div class="panneau">P</div></div>');
  const page = r.children[0];
  const scene = doc.createElement("section"); scene.setAttribute("class", "scene"); scene.setAttribute("data-morph-garder", "1"); scene.setAttribute("data-morph-avant", ".panneau");
  page.insertBefore(scene, page.children[1]);
  M.morpherHtml(r, '<div class="page" data-menu="aventure"><div class="zones">Z</div><div class="panneau">P2</div></div>');
  assert.equal(r.children[0], page);
  assert.deepEqual(classes(page), ["zones", "scene", "panneau"], "la scène reste juste avant le panneau du joueur");
  assert.equal(page.children[1], scene, "la scène est le MÊME nœud (aucun 700 px qui disparaît puis revient)");
  assert.equal(page.children[2].textContent, "P2");
}

// 5. Changement de menu : les blocs gardés de l'ancienne page ne suivent PAS (scène d'Aventure sous Entraînement avancé).
{
  const r = racine('<div class="soreal-idle-page-root-v28" data-menu="aventure"><div class="zones">Z</div><div class="panneau">P</div></div>');
  const page = r.children[0];
  const scene = doc.createElement("section"); scene.setAttribute("class", "scene"); scene.setAttribute("data-morph-garder", "1");
  page.insertBefore(scene, page.children[1]);
  const auto = doc.createElement("div"); auto.setAttribute("data-morph-garder", "1"); auto.setAttribute("id", "auto");
  page.appendChild(auto);
  M.morpherHtml(r, '<div class="soreal-idle-page-root-v28" data-menu="entrainement"><div class="entete">E</div></div>');
  assert.deepEqual(classes(page), ["entete"], "plus de scène ni d'automatisation sous l'autre page");
  assert.equal(page.querySelectorAll("[data-morph-garder]").length, 0);
  assert.equal(page.getAttribute("data-menu"), "entrainement");
}

// 6. Ordre : un bloc gardé qui demande à rester avant un repère y est remis, même si les autres blocs ont bougé.
{
  const r = racine('<div class="page"><div class="a">a</div><div class="panneau">P</div></div>');
  const page = r.children[0];
  const scene = doc.createElement("section"); scene.setAttribute("class", "scene"); scene.setAttribute("data-morph-garder", "1"); scene.setAttribute("data-morph-avant", ".panneau");
  page.appendChild(scene); // posée au mauvais endroit (après le panneau)
  M.morpherHtml(r, '<div class="page"><div class="a">a</div><div class="panneau">P</div><div class="inv">I</div></div>');
  assert.deepEqual(classes(page), ["a", "scene", "panneau", "inv"], "scène remise avant le panneau, inventaire toujours après");
}

// 6b. Un bloc gardé placé en fin de page n est pas supprimé par le nettoyage final des blocs absents du nouveau HTML.
{
  const r = racine('<div class="page"><div class="a">a</div></div>');
  const page = r.children[0];
  const bloc = doc.createElement("div"); bloc.setAttribute("class", "auto"); bloc.setAttribute("data-morph-garder", "1");
  page.appendChild(bloc);
  const intrus = doc.createElement("div"); intrus.setAttribute("class", "intrus");
  page.appendChild(intrus);
  M.morpherHtml(r, '<div class="page"><div class="a">a</div></div>');
  assert.deepEqual(classes(page), ["a", "auto"], "le bloc gardé reste, un élément ordinaire absent du nouveau HTML est retiré");
}

// 7. Champ de saisie : la valeur tapée n'est pas écrasée tant que le champ a le focus ; sinon il suit la page.
{
  const r = racine('<input class="i" value="1">');
  const champ = r.children[0];
  champ.value = "tapé";
  doc.activeElement = champ;
  M.morpherHtml(r, '<input class="i" value="2">');
  assert.equal(champ.value, "tapé", "champ actif : texte tapé conservé");
  doc.activeElement = null;
  M.morpherHtml(r, '<input class="i" value="3">');
  assert.equal(champ.value, "3", "champ non actif : suit la page");
  assert.equal(r.children[0], champ, "même champ");
}

// 8. installer() : l'écriture de innerHTML devient une mise à jour sur place ; sans effet sur un objet qui n'est pas un Element.
{
  const r = racine('<div class="a">1</div>');
  const a = r.children[0];
  M.installer(r);
  r.innerHTML = '<div class="a">2</div>';
  assert.equal(r.children[0], a, "innerHTML ne remplace plus le nœud");
  assert.equal(a.textContent, "2");
  M.installer({ innerHTML: "" });
  console.log("idle-morph-comportement-v1: OK");
}
