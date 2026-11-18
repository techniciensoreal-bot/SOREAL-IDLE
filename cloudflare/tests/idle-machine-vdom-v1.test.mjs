import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { preparerVdom } from "./_ygg-vdom.mjs";
import { evenement } from "./_faux-dom-vdom.mjs";

/*
 * Page Machine temporelle rendue par composants Preact (modules/machine-page-vdom-v1.js ; le modèle de vue vient de pageTimeMachineIdleV48_, augmentations-page-v1.js) : le VRAI Preact, le VRAI pont et le VRAI morph sur un faux DOM.
 *  (a) rendu complet ; la page ne donne au morph qu'une chaîne STABLE ;
 *  (b) un nouveau rendu (niveau, barre, compte à rebours, chiffres) ne REMPLACE aucun nœud existant ; ce que le code en direct a écrit à la main (expandos d'animation, style, canvas) reste ;
 *  (c) ce que le redessin RETIRAIT (ancre du compte à rebours, aria-valuenow, titre de la barre) est retiré à chaque rendu : le re-ancrage « plus jamais un recul de barre » est celui d'avant ;
 *  (d) îlots (machine, haut des tours, barre d'outils) : chaîne identique = aucun travail ; chaîne changée = le morph compare ;
 *  (e) le conteneur survit à un redessin complet de la page ; un changement de menu le démonte ;
 *  (f) clics -> ponts du jeu ; champ de saisie jamais écrasé en pleine frappe ; (g) anti-spoil : la tour Magie n'existe pas sans Blood Magic.
 */
const appels = [];
const fenetre = { setTimeout, clearTimeout, console, Date, Number, Math, String, Array, Object, JSON, isFinite, Boolean };
const document = preparerVdom(fenetre);
fenetre.__ajusterTimeMachineIdleV1__ = (...a) => appels.push(["ajuster", ...a]);
fenetre.__cibleTimeMachineIdleV1__ = (...a) => appels.push(["cible", ...a]);
fenetre.__basculerAideMenuIdleV1__ = (cle, d) => appels.push(["aide", cle, d.open]);
vm.runInNewContext(readFileSync("cloudflare/public/modules/morph-v1.js", "utf8"), fenetre);
vm.runInNewContext(readFileSync("cloudflare/public/modules/machine-page-vdom-v1.js", "utf8"), fenetre);
const MP = fenetre.__SOREAL_IDLE_MACHINE_PAGE_V1__, V = fenetre.__SOREAL_IDLE_VDOM_V1__, M = fenetre.__SOREAL_IDLE_MORPH_V1__;
assert.ok(MP && V && M && fenetre.preact, "module, pont, morph et Preact chargés");

function tour(cle, o = {}) {
  const g = cle === "vitesse";
  return Object.assign({
    cle, gauche: g, titre: g ? "Vitesse" : "Or", ressource: g ? "energy" : "magic", libelleAlloc: g ? "Énergie allouée" : "Magie allouée", sousTitre: "sous-titre",
    largeur: "40.00%", fill0: "0.400000", niveau: "12", lcd: "5 s", prix: "300", etaSecondes: "5", etaTexte: "Fin de la barre dans 5 s", cible: 0, alloue: "100", allocBrute: "100", k: "10",
    hautHtml: '<svg class="haut-' + cle + '"><circle r="1"/></svg>'
  }, o);
}
function modele(o = {}) {
  return {
    hero: { net: "1K", brutNet: true, brut: "2K", labos: "1K", orReel: "500", barre: { classe: "", style: "animation-duration:1.0000s;animation-delay:-0.1000s", fills: "1" }, legende: "💰 +500 Or à chaque remplissage" },
    aide: { cle: "timeMachine", ouvert: false, resume: "Résumé.", etapes: ["Un.", "Deux."] },
    barreOutils: '<div class="soreal-idle-bt-entree-v1"><input id="sorealIdleTmInputV1" type="text" value="1"></div><div class="soreal-idle-bt-info-v1">info</div>',
    machine: { magicOk: true, defs: '<defs><radialGradient id="tmmPiece"/></defs>', centreHtml: '<svg id="centre"><g id="tmmTas"/></svg>', vitesse: tour("vitesse"), or: tour("or") },
    stats: { colonne1: [{ libelle: "Or de base", valeur: "10", cle: "goldPerBarFill" }], colonne2: [{ libelle: "Boss", valeur: "3", cle: "highestBossMultiplier" }], gps: { brutNet: true, brut: "2K", labos: "1K", net: "1K" } },
    ...o
  };
}
const racine = document.createElement("div");
racine.className = "soreal-idle-page-root-v28";
document.body.appendChild(racine);
function redessiner(m, enveloppe = (x) => x) {
  const chaine = MP.page(m);
  M.morpherHtml(racine, enveloppe(chaine));
  V.appliquer();
  return chaine;
}
const tous = (el) => { const o = []; (function f(n) { for (const c of n.childNodes) { o.push(c); if (c.childNodes) f(c); } })(el); return o; };

// (a)
const chaine = redessiner(modele());
assert.equal(chaine, '<div id="vdom-machine" data-vdom="machine" data-morph-vivant></div>', "chaîne stable et vide pour le morph");
const conteneur = racine.querySelector('[data-vdom="machine"]');
assert.ok(conteneur && conteneur.parentNode === racine);
assert.equal(racine.querySelectorAll(".tmm-tour").length, 2, "deux tours");
const enfantDe = (sel, parent) => { const e = racine.querySelector(sel); return Boolean(e && e.parentNode && e.parentNode.className.split(" ").includes(parent)); };
assert.ok(enfantDe(".soreal-idle-tm-hero-v1", "soreal-idle-tm-v1") && enfantDe(".tmm-centre", "tmm-machine") && enfantDe(".tmm-machine", "tmm-cadre"), "structure : enfants directs comme avant");
assert.ok(enfantDe("svg.tmm-defs", "tmm-cadre") && racine.querySelector("#tmmTas"), "définitions et machine centrale posées");
assert.ok(enfantDe(".soreal-idle-bt-entree-v1", "soreal-idle-bt-toolbar-v120") && enfantDe(".soreal-idle-bt-info-v1", "soreal-idle-bt-toolbar-v120"), "barre d'outils : enfants directs (les règles CSS « > » s'y appliquent)");
assert.ok(racine.querySelector(".tmm-tour.vitesse .tmm-haut svg.haut-vitesse") && racine.querySelector(".tmm-tour.or .tmm-haut svg.haut-or"), "haut des tours");
assert.equal(racine.querySelector('[data-tm-niveau="vitesse"]').textContent, "12");
assert.equal(chaine, redessiner(modele()), "un redessin identique : même chaîne");

// état écrit à la main par le code en direct (ui-machine-temporelle-v1.js, machine-dessin-v1.js, tm-bulles-canvas-v1.js)
const piste = racine.querySelector(".tmm-tour.vitesse");
const rempl = piste.querySelector(".tmm-rempl"), liq = piste.querySelector(".tmm-liq"), eta = piste.querySelector(".tmm-eta"), barre = piste.querySelector(".tmm-barre"), canvas = piste.querySelector("canvas");
rempl.__tmAnim = { f: 0.5 }; rempl.__tmCorr = { d: 0.01 }; rempl.setAttribute("aria-valuenow", "40"); barre.setAttribute("title", "Progression : 40 %");
eta.setAttribute("data-tm-eta-at", "123"); eta.setAttribute("data-tm-eta-last", "4"); eta.setAttribute("data-tm-niveau0", "11");
canvas.setAttribute("width", "64"); canvas.__dessin = "ok";
const tas = racine.querySelector("#tmmTas");
const marque = document.createElement("i"); marque.className = "marque-ile"; racine.querySelector(".tmm-centre").appendChild(marque);   // à l'intérieur d'un îlot : ne bouge pas si sa chaîne ne change pas

// (b) + (c) nouveau rendu : le niveau monte, la barre avance, le compte à rebours change
const avant = tous(racine);
const suivant = modele();
suivant.machine.vitesse = tour("vitesse", { niveau: "13", largeur: "55.00%", fill0: "0.550000", lcd: "4 s", etaSecondes: "4", etaTexte: "Fin de la barre dans 4 s", alloue: "150", allocBrute: "150" });
suivant.hero = Object.assign({}, suivant.hero, { net: "2K" });
suivant.stats = Object.assign({}, suivant.stats, { colonne1: [{ libelle: "Or de base", valeur: "20", cle: "goldPerBarFill" }] });
redessiner(suivant);
const apres = new Set(tous(racine));
const remplaces = avant.filter((n) => !apres.has(n) && !(n.nodeType === 3));
assert.equal(remplaces.length, 0, "aucun élément existant remplacé : " + remplaces.map((n) => (n.tagName || "") + "." + (n.className || "")).join(" | "));
assert.ok(racine.querySelector('[data-vdom="machine"]') === conteneur);
assert.equal(racine.querySelector('[data-tm-niveau="vitesse"]').textContent, "13", "le niveau est mis à jour");
assert.equal(racine.querySelector('[data-tm-hero="netGps"]').textContent, "2K");
assert.equal(racine.querySelector('[data-tm-stat="goldPerBarFill"]').textContent, "20");
assert.equal(rempl.style.width, "55.00%", "la largeur annoncée par le serveur est écrite quand elle change");
assert.equal(liq.style.height, "55.00%");
assert.equal(rempl.getAttribute("data-tm-fill0"), "0.550000");
assert.equal(eta.getAttribute("data-tm-eta-seconds"), "4");
assert.ok(rempl.__tmAnim && rempl.__tmCorr && canvas.__dessin === "ok" && canvas.getAttribute("width") === "64", "expandos d'animation et attributs du canvas conservés");
assert.ok(!eta.hasAttribute("data-tm-eta-at") && !eta.hasAttribute("data-tm-eta-last") && !eta.hasAttribute("data-tm-niveau0"), "(c) ancre du compte à rebours retirée comme le faisait le redessin : re-ancrage au prochain passage");
assert.ok(!rempl.hasAttribute("aria-valuenow") && !barre.hasAttribute("title"), "(c) aria-valuenow et titre de la barre retirés comme avant");
// (d) îlots : chaîne identique -> rien touché ; changée -> comparée par le morph
assert.ok(racine.querySelector(".marque-ile") === marque && racine.querySelector("#tmmTas") === tas, "îlot dont la chaîne n'a pas changé : intact");
const tasEcrit = tas.getAttribute("data-niveau");
const suivant2 = modele(); suivant2.machine.centreHtml = '<svg id="centre"><g id="tmmTas" data-niveau="3"/></svg>';
redessiner(suivant2);
assert.ok(racine.querySelector("#tmmTas") === tas && racine.querySelector(".tmm-centre").innerHTML.includes('data-niveau="3"') && tasEcrit !== "3", "îlot dont la chaîne change : comparé par le morph (même élément, attribut mis à jour)");
assert.ok(!racine.querySelector(".marque-ile"), "ce que la nouvelle chaîne ne contient pas est retiré (comme le morph le faisait)");

// (e) redessin complet de la page autour du conteneur ; changement de menu
const enfants = tous(conteneur);
redessiner(modele(), (x) => '<div class="entete"><p>autre bloc</p></div>' + x + '<div class="pied">fin</div>');
assert.ok(racine.querySelector('[data-vdom="machine"]') === conteneur && enfants.every((n) => tous(conteneur).includes(n)), "le conteneur et tout son contenu survivent au redessin complet");
M.morpherHtml(racine, "<div>autre menu</div>");
V.appliquer();
assert.equal(V.registre.machine, undefined, "page quittée : composant démonté et oublié");
redessiner(modele());
assert.equal(racine.querySelectorAll(".tmm-tour").length, 2, "retour sur la page : rendue de nouveau");
assert.ok(racine.querySelector('[data-vdom="machine"]') !== conteneur);

// (f) clics -> ponts ; saisie jamais écrasée en pleine frappe
appels.length = 0;
const boutons = (cle) => racine.querySelectorAll(".tmm-tour." + cle + " .tmm-boutons button");
evenement(boutons("vitesse")[0], "click"); evenement(boutons("vitesse")[1], "click"); evenement(boutons("vitesse")[2], "click"); evenement(boutons("vitesse")[3], "click"); evenement(boutons("or")[0], "click");
assert.deepEqual(appels, [["ajuster", "energy", "plus"], ["ajuster", "energy", "moins"], ["ajuster", "energy", "max"], ["ajuster", "energy", "zero"], ["ajuster", "magic", "plus"]]);
appels.length = 0;
const champ = racine.querySelector(".tmm-tour.vitesse .tmm-case input"), champOr = racine.querySelector(".tmm-tour.or .tmm-case input");
champ.value = "120"; evenement(champ, "change"); champOr.value = "7"; evenement(champOr, "change");
assert.deepEqual(appels, [["cible", "speed", "120"], ["cible", "gold", "7"]]);
const sans = modele(); sans.machine.vitesse = tour("vitesse", { cible: 50 });
document.activeElement = champ; champ.value = "123";
redessiner(sans);
assert.equal(champ.value, "123", "champ avec le focus : la valeur du serveur ne l'écrase pas");
document.activeElement = null;
redessiner(Object.assign(modele(), { machine: Object.assign(modele().machine, { vitesse: tour("vitesse", { cible: 60 }) }) }));
assert.equal(champ.value, "60", "champ sans le focus : valeur du serveur");
const aide = racine.querySelector("details.soreal-idle-aide-v1");
assert.equal(aide.hasAttribute("open"), false);
const ouverte = modele(); ouverte.aide = Object.assign({}, ouverte.aide, { ouvert: true });
redessiner(ouverte);
assert.ok(racine.querySelector("details.soreal-idle-aide-v1") === aide && (aide.open === true || aide.hasAttribute("open")), "aide ouverte : même élément");

// (g) anti-spoil : sans Blood Magic, ni tour Magie, ni mot « Magie »
const sansMagie = modele(); sansMagie.machine = Object.assign({}, sansMagie.machine, { magicOk: false, or: null });
redessiner(sansMagie);
assert.equal(racine.querySelectorAll(".tmm-tour").length, 1);
assert.ok(racine.querySelector(".tmm-machine.tmm-sans-magie") && !/Magie|MAGIE/.test(racine.textContent), "pas de tour Magie, aucun mot Magie");
// le moteur de rendu ne contient aucun appel réseau
assert.ok(!/https?:\/\//.test(readFileSync("cloudflare/public/modules/machine-page-vdom-v1.js", "utf8").replace(/\/\*[\s\S]*?\*\//g, "")), "aucune adresse externe");
console.log("idle-machine-vdom-v1: OK");
