import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { preparerVdom } from "./_ygg-vdom.mjs";

/*
 * Pont de rendu par composants (modules/vdom-pont-v1.js, Preact) : la page Yggdrasil (modules/yggdrasil-elfes-v1.js) rendue par le VRAI Preact, le VRAI pont et le VRAI morph (modules/morph-v1.js) sur un faux DOM.
 * Exigences (AGENTS.md règle n°4, chantier de fluidité du 2026-11-18) :
 *  (a) rendu initial complet ; la page ne fournit au morph qu'une chaîne STABLE (conteneur data-vdom vide) ;
 *  (b) un nouveau rendu avec des props modifiées ne REMPLACE aucun nœud existant (identité conservée : fruits, images, boutons), seul ce qui change est touché ;
 *  (c) l'état d'une animation en cours (calque d'animation, fruit masqué, porte qui s'ouvre) et le défilement interne survivent à un rendu ;
 *  (d) le conteneur survit à un redessin complet de la page par le morph ; un changement de menu le démonte, le retour le recrée.
 */
const actions = [];
let etatJoueur = null;
const fenetre = {
  __SOREAL_IDLE_META_HOST_V130__: {
    formatGrandNombreIdleV70_: (v) => String(Math.floor(Number(v) || 0)),
    formatterHeuresIdleV47_: (h) => Math.round(h * 10) / 10 + " h",
    rafraichirMenuRacineIdleV28_: () => {},
    getIdleEtat: () => etatJoueur
  },
  __SOREAL_IDLE_ICONES_V1__: { pour: () => "🌿" },
  __actionMetaV47__: (p) => actions.push(p),
  setTimeout, setInterval: () => 0
};
const document = preparerVdom(fenetre);
fenetre.__SOREAL_IDLE_META_V130__ = {
  systemeMetaParIdIdleV130_: (j, id) => (id === "yggdrasil" ? j.systemes.systems[0] : id === "macguffins" ? { state: { unlocked: true } } : null)
};
vm.runInNewContext(readFileSync("cloudflare/public/modules/morph-v1.js", "utf8"), fenetre);
vm.runInNewContext(readFileSync("cloudflare/public/modules/yggdrasil-elfes-v1.js", "utf8"), fenetre, { filename: "yggdrasil-elfes-v1.js" });
const Y = fenetre.__SOREAL_IDLE_YGG_V1__, V = fenetre.__SOREAL_IDLE_VDOM_V1__, M = fenetre.__SOREAL_IDLE_MORPH_V1__;
assert.ok(Y && V && M && fenetre.preact, "module, pont, morph et Preact chargés");

const noms = ["gold", "powerAlpha", "adventure", "knowledge", "pomegranate", "luck", "powerBeta", "arbitrariness", "numbers"];
function joueur(croissanceOr) {
  const fruits = {}, xf = {};
  noms.forEach((id, i) => {
    fruits[id] = { tier: 3, active: i % 2 === 0, growthHours: id === "gold" ? croissanceOr : (i % 2 === 0 ? 2 : 0) };
    xf[id] = { unlocked: true, activationCost: 1000, nextTierCost: 10, autoShopId: "ygg" + id, autoCost: 300, autoRequiredCap: 1e6 };
  });
  return { systemes: { currencies: { seeds: 322, experience: 5000 }, yggFruits: noms.map((id) => ({ id, name: "Fruit of " + id, resource: "energy" })), yggExtra: { poop: 10, poopFactor: 1.5, maxTier: 10, tierSeconds: 3600, fruits: xf }, systems: [{ id: "yggdrasil", state: { unlocked: true, data: { fruits, runPowerAlphaValue: 0, permanent: { luckDropPct: 100 } } } }] } };
}

/* La page du jeu : un conteneur de menu dont le contenu est redessiné par le morph, puis les crochets « après redessin » (ui-menus-v1.js, rafraichirMenuRacineIdleV28_). */
const racine = document.createElement("div");
racine.className = "soreal-idle-page-root-v28";
document.body.appendChild(racine);
function redessiner(j, enveloppe = (h) => h) {
  etatJoueur = j;
  const chaine = Y.page(j);
  M.morpherHtml(racine, enveloppe(chaine));
  V.appliquer();
  return chaine;
}
const tous = (el) => { const o = []; (function f(n) { for (const c of n.childNodes) { o.push(c); if (c.childNodes) f(c); } })(el); return o; };

// (a) rendu initial
const chaine = redessiner(joueur(2.0));
assert.equal(chaine, '<div id="vdom-ygg" data-vdom="ygg" data-morph-vivant></div>', "la page ne donne au morph qu'une chaîne stable et vide");
const conteneur = racine.querySelector('[data-vdom="ygg"]');
assert.ok(conteneur && conteneur.parentNode === racine, "conteneur posé dans la page");
assert.equal(racine.querySelectorAll(".ygg-carte").length, 9, "9 fruits rendus dans le conteneur");
assert.ok(racine.querySelector(".ygg-page .ygg-titre") && racine.querySelector(".ygg-grille"), "page complète");
const carteOr = () => racine.querySelector('.ygg-carte[data-fruit="gold"]');
const fruitsOr = () => carteOr().querySelectorAll("img.ygg-fruit");
assert.equal(fruitsOr().length, 2, "or : 2 h de pousse = 2 fruits sur l'arbre");
assert.ok(carteOr().querySelector(".ygg-porte.ouvre"), "première visite : la porte de l'or s'ouvre");
assert.equal(chaine, redessiner(joueur(2.0)), "un redessin identique donne la même chaîne");

// (c) état d'animation et défilement posés SUR les nœuds, avant le nouveau rendu
const vitre = carteOr().querySelector(".ygg-vitre");
vitre.scrollTop = 123;
const calque = document.createElement("div");
calque.className = "ygg-anim-v1"; calque.setAttribute("data-morph-garder", "");
vitre.appendChild(calque);
const premier = fruitsOr()[0];
premier.style.visibility = "hidden";
const porteOr = carteOr().querySelector(".ygg-porte");

// (b) nouveau rendu : l'or pousse (2 h -> 3,5 h) et la page est redessinée par le morph, enveloppée dans d'autres blocs
const avant = tous(racine);
redessiner(joueur(3.5));
const apres = new Set(tous(racine));
const remplaces = avant.filter((n) => !apres.has(n));
assert.equal(remplaces.length, 0, "aucun nœud existant remplacé par le nouveau rendu : " + remplaces.map((n) => (n.tagName || "#texte") + "." + (n.className || n.data || "")).join(" | "));
assert.ok(racine.querySelector('[data-vdom="ygg"]') === conteneur, "même conteneur");
assert.equal(fruitsOr().length, 4, "or : 3,5 h = 3 fruits mûrs + 1 qui pousse");
assert.ok(fruitsOr()[0] === premier, "le premier fruit est le même élément");
assert.equal(fruitsOr()[1].getAttribute("class"), "ygg-img ygg-fruit ygg-mur");
const nouveaux = tous(racine).filter((n) => !avant.includes(n));
assert.equal(nouveaux.filter((n) => n.nodeType === 1).length, 2, "seulement les deux fruits ajoutés (le troisième et celui qui pousse)");
assert.ok(carteOr().querySelector(".ygg-temps").textContent.startsWith("3.5 h"), "le texte qui change est mis à jour");

// (c) suite : rien de l'animation ni du défilement n'a bougé
assert.ok(carteOr().querySelector(".ygg-vitre") === vitre);
assert.equal(vitre.scrollTop, 123, "défilement interne conservé");
assert.ok(vitre.contains(calque) && calque.getAttribute("data-morph-garder") === "", "calque d'animation (nœud étranger) conservé dans la vitre");
assert.equal(premier.style.visibility, "hidden", "fruit masqué par l'animation d'usage : le rendu ne réécrit que les variables qui changent");
assert.ok(carteOr().querySelector(".ygg-porte") === porteOr, "la porte qui s'ouvre est le même élément (son animation CSS n'est pas relancée)");
assert.ok(porteOr.className.includes("ouvre"));

// (d) redessin complet de la page par le morph, autour du même conteneur : il survit, son contenu n'est pas touché
const enfantsAvant = tous(conteneur);
redessiner(joueur(3.5), (h) => '<div class="entete"><p>autre bloc</p></div>' + h + '<div class="pied">fin</div>');
assert.ok(racine.querySelector('[data-vdom="ygg"]') === conteneur, "le conteneur survit au redessin complet");
assert.ok(enfantsAvant.every((n) => tous(conteneur).includes(n)), "tout son contenu est intact après le redessin de la page");
assert.equal(racine.querySelectorAll(".pied").length, 1);

// (d) changement de menu : le conteneur disparaît, le pont démonte et oublie ; le retour recrée un conteneur neuf, rendu de zéro
M.morpherHtml(racine, "<div>autre menu</div>");
V.appliquer();
assert.equal(V.registre.ygg, undefined, "page quittée : composant démonté et oublié");
assert.equal(racine.querySelector(".ygg-page"), null);
redessiner(joueur(3.5));
assert.equal(racine.querySelectorAll(".ygg-carte").length, 9, "retour sur la page : rendue de nouveau");
assert.ok(racine.querySelector('[data-vdom="ygg"]') !== conteneur, "conteneur neuf");

// Gestionnaires réels (plus d'onclick en chaîne) : un clic arrive à l'action
actions.length = 0;
const { evenement } = await import("./_faux-dom-vdom.mjs");
const boutonAmeliorer = racine.querySelectorAll('.ygg-carte[data-fruit="gold"] .ygg-actions .ygg-btn').find((b) => b.textContent.startsWith("Améliorer") && !b.hasAttribute("disabled"));
assert.ok(boutonAmeliorer, "bouton Améliorer actif");
evenement(boutonAmeliorer, "click");
assert.deepEqual(JSON.parse(JSON.stringify(actions)), [{ action: "upgradeYggFruit", fruit: "gold" }], "le clic part du vrai gestionnaire");

// Garde-fous du pont : le morph ne descend pas dans data-vdom ; le conteneur ne crée pas de boîte ; aucune dépendance au réseau.
assert.ok(/hasAttribute\('data-vdom'\)\)return;/.test(readFileSync("cloudflare/public/modules/morph-v1.js", "utf8")), "morph : contenu d'un conteneur data-vdom jamais touché");
assert.ok(readFileSync("cloudflare/public/vdom-v1.css", "utf8").includes("[data-vdom]{display:contents}"), "conteneur sans boîte");
const index = readFileSync("cloudflare/public/index.html", "utf8");
assert.ok(index.indexOf("vendor/preact-10.28.4.min.js") > 0 && index.indexOf("vendor/preact-10.28.4.min.js") < index.indexOf("vdom-pont-v1.js") && index.indexOf("vdom-pont-v1.js") < index.indexOf("yggdrasil-elfes-v1.js"), "Preact, puis le pont, puis la page (hors ligne : fichier local, aucun CDN)");
assert.ok(!/https?:\/\//.test(readFileSync("cloudflare/public/modules/vdom-pont-v1.js", "utf8").replace(/\/\*[\s\S]*?\*\//g, "")), "le pont n'appelle aucune adresse externe");
console.log("idle-vdom-pont-v1: OK");
