import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { preparerVdom } from "./_ygg-vdom.mjs";
import { evenement } from "./_faux-dom-vdom.mjs";
import { IDLE_NGU_DIGGERS } from "../src/idle-ngu-catalogues.js";

/*
 * Page Labos rendue par composants Preact (modules/labos-page-v1.js, chantier de fluidité 2026-11-18) : le VRAI Preact, le VRAI pont et le VRAI morph sur un faux DOM.
 *  (a) la page ne donne au morph qu'une chaîne STABLE ; rendu initial complet ;
 *  (b) un nouveau rendu (or qui change, niveau qui monte) ne REMPLACE aucun nœud existant : cartes, scènes de savants (SVG animés en CSS) et boutons gardent leur identité ;
 *  (c) la scène d'un labo qui ne change pas d'état n'est jamais réécrite (l'animation CSS ne repart pas) ; un changement d'état (repos <-> travail) la réécrit seule ;
 *  (d) le conteneur survit à un redessin complet de la page ; un changement de menu le démonte ;
 *  (e) un clic part vers le bon pont (window.__x__), un bouton grisé ne fait rien ;
 *  (f) anti-spoil (règle n°2) : un labo de système verrouillé n'est jamais rendu.
 */
const appels = [];
const fenetre = { setTimeout, clearTimeout, console, Date, Number, Math, String, Array, Object, JSON, isFinite, Boolean };
const document = preparerVdom(fenetre);
fenetre.__setDiggerIdleV47__ = (...a) => appels.push(["set", ...a]);
fenetre.__toggleDiggerIdleV47__ = (...a) => appels.push(["toggle", ...a]);
fenetre.__actionMetaV47__ = (p) => appels.push(["action", JSON.parse(JSON.stringify(p))]);
fenetre.__SOREAL_IDLE_META_HOST_V130__ = { idleEntier_: (x) => Math.round(Number(x) || 0), idleHtml_: (x) => String(x), formatGrandNombreIdleV70_: (x) => String(x) };
const ouvert = { diggers: true, wandoos: false, ngu: true, beards: false, bloodMagic: false, daycare: false };
let sys;
const donnees = (extra = {}) => ({ state: { unlocked: true, data: { slots: 2, diggers: Object.fromEntries(IDLE_NGU_DIGGERS.map((d) => [d.id, Object.assign({ maxLevel: 0, runLevel: 0, active: false }, extra[d.id] || {})])) } } });
sys = donnees();
fenetre.__SOREAL_IDLE_META_PARTAGE_V130__ = { systemeMetaParIdIdleV130_: (j, id) => (id === "diggers" ? sys : { state: { unlocked: ouvert[id] !== false } }) };
vm.runInNewContext(readFileSync("cloudflare/public/modules/morph-v1.js", "utf8"), fenetre);
vm.runInNewContext(readFileSync("cloudflare/public/modules/labos-savants-v1.js", "utf8"), fenetre);
vm.runInNewContext(readFileSync("cloudflare/public/modules/labos-page-v1.js", "utf8"), fenetre);
const L = fenetre.__SOREAL_IDLE_LABOS_PAGE_V1__, V = fenetre.__SOREAL_IDLE_VDOM_V1__, M = fenetre.__SOREAL_IDLE_MORPH_V1__;
assert.ok(L && V && M && fenetre.preact, "module, pont, morph et Preact chargés");

const joueur = (or, cout = 1000) => ({ systemes: { diggerDefinitions: IDLE_NGU_DIGGERS, currencies: { gold: or }, diggerView: { slots: 2, active: 1, globalPct: 12.5, grossGps: 100, drain: 10, items: Object.fromEntries(IDLE_NGU_DIGGERS.map((d) => [d.id, { multiplier: 2, drain: 5, nextCost: cout, nextDrain: 6 }])) } } });
const racine = document.createElement("div");
racine.className = "soreal-idle-page-root-v28";
document.body.appendChild(racine);
function redessiner(j, enveloppe = (x) => x) {
  const chaine = L.page(j);
  M.morpherHtml(racine, enveloppe(chaine));
  V.appliquer();
  return chaine;
}
const tous = (el) => { const o = []; (function f(n) { for (const c of n.childNodes) { o.push(c); if (c.childNodes) f(c); } })(el); return o; };
const carte = (id) => racine.querySelector('.lp-labo[data-labo="' + id + '"]');

// état : le premier labo ouvert et au travail, les autres du premier étage fermés
sys = donnees({ drop: { maxLevel: 5, runLevel: 3, active: true }, stats: { maxLevel: 2, runLevel: 0, active: false } });
// (a)
const chaine = redessiner(joueur(10));
assert.equal(chaine, '<div id="vdom-labos" data-vdom="labos" data-morph-vivant></div>', "la page ne donne au morph qu'une chaîne stable et vide");
const conteneur = racine.querySelector('[data-vdom="labos"]');
assert.ok(conteneur && conteneur.parentNode === racine, "conteneur posé dans la page");
assert.equal(racine.querySelectorAll(".lp-labo").length, 5, "premier étage (3 : Wandoos verrouillé) + deuxième étage (2)");
assert.ok(racine.querySelector(".soreal-idle-page-head-v28 .soreal-idle-page-title-v28") && racine.querySelector(".lp-haut") && racine.querySelector(".lp-donjon"), "page complète");
assert.equal(racine.querySelectorAll(".lp-fiole").length, 2, "deux emplacements");
assert.ok(carte("drop").className.includes("on") && carte("stats").className.includes("repos") && carte("adventure").className.includes("neuf"));
assert.equal(chaine, redessiner(joueur(10)), "un redessin identique donne la même chaîne");

// (c) animation : le bloc de la scène (nœud brut) est posé une fois ; on y pose des marques pour détecter une réécriture
const poste = (id) => carte(id).querySelector(".lp-poste");
const posteDrop = poste("drop"), brutDrop = posteDrop.childNodes[0], brutStats = poste("stats").childNodes[0];
const bouton = (id, texte) => carte(id).querySelectorAll("button").find((b) => b.textContent.startsWith(texte));
const ameliorerDrop = bouton("drop", "Améliorer le labo");
assert.ok(ameliorerDrop.className.includes("lp-manque"), "or insuffisant : grisé (mais cliquable)");

// (b) l'or arrive : le bouton n'est plus grisé, le niveau actif monte ; aucun nœud remplacé
const avant = tous(racine);
sys = donnees({ drop: { maxLevel: 5, runLevel: 4, active: true }, stats: { maxLevel: 2, runLevel: 0, active: false } });
redessiner(joueur(5000));
const apres = new Set(tous(racine));
const remplaces = avant.filter((n) => !apres.has(n));
assert.equal(remplaces.length, 0, "aucun nœud existant remplacé : " + remplaces.map((n) => (n.tagName || "#texte") + "." + (n.className || n.data || "")).join(" | "));
assert.ok(racine.querySelector('[data-vdom="labos"]') === conteneur, "même conteneur");
assert.ok(bouton("drop", "Améliorer le labo") === ameliorerDrop && !ameliorerDrop.className.includes("lp-manque"), "même bouton, plus grisé");
assert.equal(carte("drop").querySelector(".lp-nivactif").textContent, "4", "niveau actif mis à jour");
assert.ok(poste("drop") === posteDrop && posteDrop.childNodes[0] === brutDrop && poste("stats").childNodes[0] === brutStats, "scènes inchangées : jamais réécrites (l'animation CSS ne repart pas)");

// (c) changement d'état : le labo passe au repos, SA scène est réécrite, pas celle des autres
sys = donnees({ drop: { maxLevel: 5, runLevel: 4, active: false }, stats: { maxLevel: 2, runLevel: 0, active: false } });
redessiner(joueur(5000));
assert.ok(carte("drop").className.includes("repos"));
assert.ok(poste("drop") === posteDrop && posteDrop.childNodes[0] !== brutDrop, "la scène du labo qui change d'état est réécrite");
assert.ok(poste("stats").childNodes[0] === brutStats, "celle d'un autre labo ne bouge pas");
assert.ok(bouton("drop", "Mettre au travail"), "bouton Mettre au travail");

// (d) redessin complet de la page par le morph autour du même conteneur : il survit, son contenu n'est pas touché
const enfantsAvant = tous(conteneur);
redessiner(joueur(5000), (x) => '<div class="entete"><p>autre bloc</p></div>' + x + '<div class="pied">fin</div>');
assert.ok(racine.querySelector('[data-vdom="labos"]') === conteneur, "le conteneur survit au redessin complet");
assert.ok(enfantsAvant.every((n) => tous(conteneur).includes(n)), "tout son contenu est intact");
// (d) changement de menu : démonté et oublié ; le retour rend de zéro
M.morpherHtml(racine, "<div>autre menu</div>");
V.appliquer();
assert.equal(V.registre.labos, undefined, "page quittée : composant démonté et oublié");
redessiner(joueur(5000));
assert.equal(racine.querySelectorAll(".lp-labo").length, 5, "retour sur la page : rendue de nouveau");
assert.ok(racine.querySelector('[data-vdom="labos"]') !== conteneur, "conteneur neuf");

// (e) clics : vrais gestionnaires, vers les ponts du jeu
appels.length = 0;
evenement(bouton("drop", "Mettre au travail"), "click");
evenement(bouton("drop", "Au maximum"), "click");
evenement(bouton("drop", "Améliorer le labo"), "click");
const plusMoins = carte("drop").querySelectorAll(".lp-btn.carre");
evenement(plusMoins[0], "click"); evenement(plusMoins[1], "click");
assert.deepEqual(appels, [["toggle", "drop", true], ["set", "drop", 5, true], ["action", { action: "upgradeDigger", digger: "drop" }], ["set", "drop", 3], ["set", "drop", 5]], "chaque bouton appelle son pont avec ses arguments");
appels.length = 0;
sys = donnees({ drop: { maxLevel: 5, runLevel: 5, active: true } });
redessiner(joueur(5000));
const pm = carte("drop").querySelectorAll(".lp-btn.carre");
assert.equal(pm[1].getAttribute("aria-disabled"), "true", "+ grisé au niveau acheté le plus haut");
evenement(pm[1], "click");
assert.deepEqual(appels, [], "un bouton grisé ne fait rien");
// « Améliorer » sans prochain coût : réellement indisponible
const sansCout = joueur(5000); sansCout.systemes.diggerView.items.drop.nextCost = null;
redessiner(sansCout);
const maxi = bouton("drop", "Améliorer le labo");
assert.equal(maxi.getAttribute("aria-disabled"), "true");
assert.ok(!maxi.hasAttribute("disabled"), "jamais l'attribut disabled (texte lisible)");
evenement(maxi, "click");
assert.deepEqual(appels, [], "au maximum : aucun clic");

// (f) anti-spoil : les labos de systèmes verrouillés ne sont jamais rendus (ni leur nom)
ouvert.ngu = false;
const toutOuvert = Object.fromEntries(IDLE_NGU_DIGGERS.map((d) => [d.id, { maxLevel: 3, runLevel: 1, active: false }]));
sys = { state: { unlocked: true, data: { slots: 2, diggers: toutOuvert } } };
redessiner(joueur(5000));
for (const id of ["wandoos", "energyNgu", "magicNgu", "energyBeard", "magicBeard", "blood", "daycare"]) assert.equal(carte(id), null, id + " caché tant que son système est verrouillé");
assert.ok(!/barbe|NGU|Wandoos|sang|garderie/i.test(racine.textContent), "aucun mot qui nomme un système verrouillé");
ouvert.beards = true;
redessiner(joueur(5000));
assert.ok(carte("energyBeard") && carte("magicBeard") && !carte("energyNgu"), "les labos de barbes apparaissent avec leur système");
// anti-spoil : labos verrouillés (système « diggers » fermé) : message d'attente seulement
sys = { state: { unlocked: false } };
assert.ok(/Rien à afficher/.test(L.page(joueur(0))), "système fermé : rien d'autre");
console.log("idle-labos-vdom-v1: OK");
