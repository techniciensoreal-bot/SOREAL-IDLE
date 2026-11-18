import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { preparerNgu, monterNgu } from "./_ngu-vdom.mjs";
import { evenement } from "./_faux-dom-vdom.mjs";
import { normalizeIdleNguState, applyIdleNguAction, idleNguSnapshot } from "../src/idle-ngu-progression.js";

/*
 * Page NGU rendue par composants Preact (modules/ngu-labo-v1.js, chantier de fluidité du 2026-11-18) : le VRAI Preact, le VRAI pont (modules/vdom-pont-v1.js), le VRAI morph (modules/morph-v1.js) et le VRAI module sur un faux DOM.
 * Exigences (AGENTS.md règle n°4) :
 *  (a) la page ne donne au morph qu'une chaîne STABLE (conteneur data-vdom vide) ; rendu initial complet ;
 *  (b) un nouveau rendu ne REMPLACE aucun nœud existant (identité des tuyaux, boutons, champs, ciel) ;
 *  (c) ce que le tick écrit à la main (liquide, pourcentage, niveau) survit à un rendu local, et une NOUVELLE synchro du serveur remet les ancrages ;
 *  (d) le conteneur survit à un redessin complet de la page par le morph ; un changement de menu le démonte ;
 *  (e) un clic sur + place l'énergie (action envoyée, classe « actif », montant) sans remplacer le tuyau ; l'ancrage fait par le clic n'est pas défait par le rendu local ;
 *  (f) changer d'onglet est un rendu local : section, bouton, ciel (soleil / lune) et libellés suivent sans recréer le conteneur ; anti-spoil : aucune section de magie tant qu'elle n'est pas découverte.
 */
const horloge = { t: 5000 };
const envois = [];
let etatJoueur = null;
const nf = { window: {} };
vm.runInNewContext(readFileSync("cloudflare/public/modules/number-format-v1.js", "utf8"), nf);
const grand = nf.window.__SOREAL_IDLE_NUMBER_FORMAT_V1__.grandNombre;
const fenetre = {
  __SOREAL_IDLE_META_HOST_V130__: {
    getIdleEtat: () => etatJoueur,
    formatGrandNombreIdleV70_: (v, d) => grand(v, d),
    rafraichirMenuRacineIdleV28_: () => {}
  },
  __envoyerAllocRapideIdleV1__: (p) => envois.push(p),
  __lireMontantAugmentIdleV1__: () => 5,
  __actionMetaV47__: () => {},
  performance: { now: () => horloge.t },
  setInterval: () => 7,
  clearInterval() {}
};
const document = preparerNgu(fenetre);
/* Le faux DOM n'a pas `dataset` (utilisé par le tick et les actions du module) : proxy sur data-*. */
const kebab = (k) => k.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());
const avecDataset = (creer) => (...a) => {
  const el = creer(...a);
  Object.defineProperty(el, "dataset", {
    value: new Proxy({}, { get: (_o, k) => (typeof k === "string" && el.hasAttribute("data-" + kebab(k)) ? el.getAttribute("data-" + kebab(k)) : undefined), set: (_o, k, v) => { el.setAttribute("data-" + kebab(k), String(v)); return true; } })
  });
  return el;
};
document.createElement = avecDataset(document.createElement);
document.createElementNS = avecDataset(document.createElementNS);
vm.runInNewContext(readFileSync("cloudflare/public/modules/morph-v1.js", "utf8"), fenetre);
vm.runInNewContext(readFileSync("cloudflare/public/modules/ngu-labo-v1.js", "utf8"), fenetre, { filename: "ngu-labo-v1.js" });
const L = fenetre.__SOREAL_IDLE_NGU_LABO_V1__, V = fenetre.__SOREAL_IDLE_VDOM_V1__, M = fenetre.__SOREAL_IDLE_MORPH_V1__;
assert.ok(L && V && M && fenetre.preact, "module, pont, morph et Preact chargés");

/* Un vrai état du moteur : A Number consommé (NGU ouverts), Power α avec 500 d'énergie placée au niveau 120. */
const contexte = { bosses: 100, bestGold: 1e6, adventurePower: 1e9 };
let state = normalizeIdleNguState({}, contexte, 1_000_000);
state.adventure.unlockItems.aNumber = true;
state = applyIdleNguAction(state, { action: "adventure", adventure: { mode: "consumeUnlock", itemId: "aNumber" } }, contexte, 1_000_000).state;
state.resources.energy.cap = 1000;
state.resources.energy.current = 1000;
state.resources.energy.power = 1e9;
state = applyIdleNguAction(state, { action: "allocateNgu", ngu: "powerAlpha", value: 500 }, contexte, 1_000_000).state;
state.systems.ngu.data.ngus.normal.powerAlpha.level = 120;
function joueur(recu, magie = true) {
  const snap = idleNguSnapshot(state, contexte, 1_000_000);
  snap.ngus.magicUnlocked = magie;
  return { systemes: snap, energie: 500, energieMax: 1000, __recuPerfV1: recu };
}

/* La page du jeu : un conteneur de menu dont le contenu est redessiné par le morph, puis les crochets « après redessin » (ui-menus-v1.js). */
const racine = document.createElement("div");
racine.className = "soreal-idle-page-root-v28";
document.body.appendChild(racine);
function redessiner(j) {
  etatJoueur = j;
  const chaine = L.page(j);
  M.morpherHtml(racine, chaine);
  V.appliquer();
  L.apresRedessin();
  return chaine;
}
const barre = (id) => racine.querySelector('[data-nl-ngu="' + id + '"]');
/* Éléments seulement : le tick réécrit à la main les feuilles de texte du liquide (pourcentage, niveau, durée), ses nœuds de texte ne sont pas ceux de Preact. */
const tous = (el) => { const o = []; (function f(n) { for (const c of n.childNodes) { if (c.nodeType === 1) { o.push(c); f(c); } } })(el); return o; };

// (a) rendu initial
const chaine = redessiner(joueur(7000));
assert.equal(chaine, '<div id="vdom-ngu" data-vdom="ngu" data-morph-vivant></div>', "la page ne donne au morph qu'une chaîne stable et vide");
const conteneur = racine.querySelector('[data-vdom="ngu"]');
assert.ok(conteneur && conteneur.parentNode === racine, "conteneur posé dans la page");
assert.equal(racine.querySelectorAll(".nl-barre").length, 16, "un tuyau par NGU");
assert.ok(racine.querySelector(".nl-v1 .nl-haut") && racine.querySelector(".nl-barre-outils") && racine.querySelector(".nl-resume") && racine.querySelector("style"), "page complète (cadre, barre d'outils, effets, feuille de style)");
assert.equal(racine.querySelectorAll(".nl-section").length, 2, "énergie et magie");
assert.equal(chaine, redessiner(joueur(7000)), "un redessin identique donne la même chaîne");

// (b) un rendu venu du serveur ne remplace aucun nœud (identité conservée)
const avant = tous(racine);
const pa = barre("powerAlpha"), liq = pa.querySelector("[data-nl-fill]"), pct = pa.querySelector("[data-nl-pct]");
horloge.t = 9000;
redessiner(joueur(8900));
const apres = tous(racine);
assert.equal(apres.length, avant.length, "même nombre de nœuds");
assert.ok(avant.every((n, i) => n === apres[i]), "aucun nœud remplacé par une nouvelle synchro (tuyaux, boutons, champs, ciel)");
assert.equal(barre("powerAlpha"), pa, "le tuyau de Power α est le même nœud");

// (c) ce que le tick écrit à la main survit à un rendu local ; une nouvelle synchro remet les ancrages
horloge.t = 11000;
L.apresRedessin();   /* le tick (mêmes formules que le jeu) pose le liquide et le pourcentage */
const transform = liq.style.transform, texte = pct.textContent, vAttr = liq.getAttribute("data-nl-v");
assert.ok(/^scaleX\(/.test(transform) && /^\d+ %$/.test(texte) && vAttr !== null, "le tick a écrit le liquide, le pourcentage et sa mémoire");
L.aide();   /* rendu local : la page se redessine sans le serveur */
assert.equal(barre("powerAlpha"), pa, "rendu local : même tuyau");
assert.equal(liq.style.transform, transform, "rendu local : le liquide écrit par le tick n'est pas touché");
assert.equal(pct.textContent, texte, "rendu local : le pourcentage écrit par le tick n'est pas touché");
const t0Avant = pa.getAttribute("data-nl-t0");
assert.equal(t0Avant, "8900", "l'instant de départ vient de la dernière synchro");
pa.setAttribute("data-nl-t0", "10500");   /* ré-ancrage fait à la main (clic sur + ou −) */
L.aide();
assert.equal(pa.getAttribute("data-nl-t0"), "10500", "un rendu local ne défait pas le ré-ancrage d'un clic");
etatJoueur = joueur(10900);
redessiner(etatJoueur);
assert.equal(pa.getAttribute("data-nl-t0"), "10900", "une NOUVELLE synchro du serveur remet l'instant de départ (comme le redessin d'avant)");
assert.equal(liq.getAttribute("data-nl-v") === vAttr && vAttr !== null && liq.style.transform === transform ? "inchangé" : "recalculé", "recalculé", "la mémoire du tick est remise à zéro : le tick réécrit le liquide dans la même tâche");

// (d) redessin complet de la page par le morph : le conteneur et son arbre survivent
const racinePage = tous(racine);
M.morpherHtml(racine, '<div id="vdom-ngu" data-vdom="ngu" data-morph-vivant></div>');
V.appliquer();
assert.equal(racine.querySelector('[data-vdom="ngu"]'), conteneur, "le conteneur survit à un redessin complet");
assert.ok(tous(racine).length === racinePage.length && racinePage.every((n, i) => n === tous(racine)[i]), "l'arbre Preact survit tel quel au redessin du morph");

// (e) clic sur + : action envoyée, classe « actif », montant placé, sans remplacer le tuyau
const wa = barre("wandoos");
assert.ok(!/\bactif\b/.test(wa.className), "Wandoos n'a pas d'énergie");
const plus = wa.querySelectorAll(".nl-boutons button")[0];
evenement(plus, "click");
assert.equal(envois.length, 1, "une action envoyée");
assert.equal(envois[0].action, "allocateNgu");
assert.equal(envois[0].ngu, "wandoos");
assert.equal(envois[0].value, 5, "le pas est la valeur de la case Input");
assert.equal(barre("wandoos"), wa, "le tuyau n'est pas remplacé par le clic");
assert.ok(/\bactif\b/.test(wa.className), "le rendu local pose la classe actif");
assert.equal(wa.querySelector("[data-nl-alloc]").textContent, "5", "le montant placé suit");
assert.equal(document.getElementById("sorealIdleNguLibreV1").textContent, "495", "l'énergie libre suit");
evenement(wa.querySelectorAll(".nl-boutons button")[3], "click");   /* « 0 » */
assert.ok(!/\bactif\b/.test(wa.className) && wa.querySelector("[data-nl-alloc]").textContent === "0", "« 0 » reprend l'énergie du tuyau");
assert.equal(envois[1].value, 0);

// (f) onglet Magie : rendu local, ciel et libellés
const haut = () => racine.querySelector(".nl-v1");
assert.ok(haut().getAttribute("data-nl-onglet") === "energy" && racine.querySelector(".nl-soleil") && racine.querySelector(".nl-gris") && !racine.querySelector(".nl-astre"), "jour : soleil et banc gris");
const secEnergie = racine.querySelector('[data-nl-section="energy"]'), secMagie = racine.querySelector('[data-nl-section="magic"]');
L.onglet("magic");
assert.equal(racine.querySelector('[data-vdom="ngu"]'), conteneur);
assert.equal(haut().getAttribute("data-nl-onglet"), "magic", "onglet Magie");
assert.ok(racine.querySelector(".nl-astre") && racine.querySelector(".nl-nuages") && !racine.querySelector(".nl-soleil") && !racine.querySelector(".nl-gris"), "nuit : lune et chauves-souris, plus de soleil ni de banc gris");
assert.equal(racine.querySelector('[data-nl-section="energy"]'), secEnergie, "la section d'énergie est le même nœud (seulement cachée)");
assert.ok(secEnergie.hasAttribute("hidden") && !secMagie.hasAttribute("hidden"), "sections : énergie cachée, magie visible");
assert.ok(racine.querySelector("[data-nl-onglet-btn]").textContent === "Vers les NGU d’énergie" && /Magie libre/.test(racine.querySelector("[data-nl-libre-label]").textContent), "bouton et libellés de l'onglet Magie");
L.onglet("energy");
assert.ok(racine.querySelector(".nl-soleil") && racine.querySelector(".nl-gris") && !racine.querySelector(".nl-astre"), "retour au jour");

// (g) anti-spoil : tant que la magie n'est pas découverte, ni section, ni bouton, ni case
L.onglet("magic");
redessiner(joueur(12000, false));
assert.equal(racine.querySelectorAll(".nl-section").length, 1, "une seule section (énergie)");
assert.equal(racine.querySelectorAll(".nl-barre").length, 9, "seulement les 9 NGU d'énergie");
assert.ok(!racine.querySelector("[data-nl-onglet-btn]") && !/Vers les NGU de magie|Faire suivre la magie|Magie libre|Plafond de magie|Magie placée/.test(racine.querySelector(".nl-v1").textContent), "ni bouton « Vers les NGU de magie », ni case, ni libellé de magie");
assert.equal(L.ongletCourant(), "energy", "onglet remis sur l'énergie");

// (h) menu quitté : le conteneur disparaît, l'arbre est démonté
M.morpherHtml(racine, "<div>autre menu</div>");
V.appliquer();
assert.ok(!racine.querySelector(".nl-barre") && !V.registre.ngu, "changement de menu : page démontée");
console.log("idle-ngu-vdom-v1: OK");
