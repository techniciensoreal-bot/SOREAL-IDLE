import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-25) : « dans Collection, enlève les mobs Aventure (ce sont les mêmes que les Boss). Les boss n'affichent pas le texte en
 * dessous : juste leur nom, centré, et sans bords noirs sur les côtés de l'image. Rends les cartes de boss cliquables pour afficher leurs
 * statistiques et leurs textes de chroniques. »
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-ui.css", "utf8");

// Plus d'onglet « Aventure » dans Collection
const page = ui.slice(ui.indexOf("function pageBestiaireIdleV110_(j)"), ui.indexOf("function aventureMetaIdleV47_(j)"));
assert.ok(!page.includes("__changerOngletCollectionIdleV1__('aventure')"), "aucun bouton d'onglet Aventure");
assert.ok(!page.includes("Aucune rencontre d’Aventure"), "aucun rendu des créatures d'Aventure");
assert.match(page, /idleCollectionOngletV1!=='aventure'\?idleCollectionOngletV1:'boss'/, "un ancien onglet mémorisé « aventure » retombe sur Boss");
for (const onglet of ["boss", "equipement", "sets"]) assert.ok(page.includes("__changerOngletCollectionIdleV1__('" + onglet + "')"), "onglet " + onglet + " conservé");

// Carte de boss : image + nom seulement, cliquable
const rendu = ui.slice(ui.indexOf("function rendreCollectionCreaturesIdleV1_("), ui.indexOf("function fermerBossCollectionIdleV1_()"));
const carteBoss = rendu.slice(rendu.indexOf("if(idleEntier_(e.numero)>0){"), rendu.indexOf("/* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-172 */"));
assert.match(carteBoss, /boss-card/);
assert.match(carteBoss, /__ouvrirBossCollectionIdleV1__\('\+idleEntier_\(e\.numero\)/, "clic -> fiche du boss");
assert.ok(!/bestiary-type|bestiary-meta|bestiary-desc|tts-read/.test(carteBoss), "aucun texte de type, statistiques ni chronique sous la carte");
assert.match(carteBoss, /bestiary-name-v110 boss-name/, "le nom reste");

// Image plein cadre (cover) et nom centré
const regle = (sel) => css.slice(css.lastIndexOf(sel));
assert.match(regle(".soreal-idle-bestiary-card-v110.boss-card .soreal-idle-bestiary-image-v120 img{"), /object-fit:cover/);
assert.match(regle(".soreal-idle-bestiary-card-v110.boss-card .boss-name{"), /text-align:center/);
assert.match(regle(".soreal-idle-bestiary-card-v110.boss-card{"), /padding:0/);

// Fiche : exécution réelle avec un faux DOM
const src = ui.slice(ui.indexOf("function fermerBossCollectionIdleV1_()"), ui.indexOf("function lireHistoireCompleteBossIdleV206_()"));
const ajoutes = [];
const enfants = new Map();
const documentFactice = {
  getElementById: (id) => enfants.get(id) || null,
  createElement: () => {
    const el = { id: "", className: "", innerHTML: "", listeners: {}, addEventListener(t, f) { this.listeners[t] = f; }, remove() { enfants.delete(this.id); } };
    return el;
  },
  body: { appendChild: (el) => { enfants.set(el.id, el); ajoutes.push(el); } }
};
const fenetre = {};
const ctx = {
  document: documentFactice,
  window: fenetre,
  idleEtat: { bestiaire: { entrees: [
    { source: "boss", decouvert: true, numero: 4, nom: "Fake <Boss>", pv: 1200, attaque: 30, defense: 12, xp: 25, rencontres: 3, description: "Il était une fois." },
    { source: "boss", decouvert: false, numero: 5, nom: "???????" }
  ] } }
};
const fabrique = new Function("ctx", `
  const {document,window,idleEtat}=ctx;
  const idleEntier_=v=>Math.max(0,Math.floor(Number(v)||0));
  const idleNombre_=v=>Number(v)||0;
  const idleHtml_=v=>String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const formatGrandNombreIdleV70_=v=>String(v);
  const urlBossR2IdleV1_=n=>'/api/idle/media/boss?id='+n;
  ${src}
  return {ouvrir:ouvrirBossCollectionIdleV1_,fermer:fermerBossCollectionIdleV1_};
`)(ctx);
fabrique.ouvrir(5);
assert.equal(ajoutes.length, 0, "un boss non découvert n'ouvre rien (anti-spoil)");
fabrique.ouvrir(4);
assert.equal(ajoutes.length, 1);
const html = ajoutes[0].innerHTML;
assert.match(html, /Fake &lt;Boss&gt;/, "nom échappé");
for (const attendu of ["Points de vie", "1200", "Attaque", "Défense", "EXP", "Rencontres", "Il était une fois."]) assert.ok(html.includes(attendu), attendu);
assert.match(html, /data-soreal-tts-chronique="Fake &lt;Boss&gt;"/, "lecture vocale de la chronique conservée");
assert.match(html, /data-soreal-tts-target="sorealIdleCollectionBossStoryV206_4"/);
assert.match(html, /id="sorealIdleCollectionBossStoryV206_4"/);
fabrique.ouvrir(4);
assert.equal(ajoutes.length, 2);
assert.equal(enfants.size, 1, "une seule fiche ouverte à la fois");
ajoutes[1].listeners.click({ target: ajoutes[1] });
assert.equal(enfants.size, 0, "clic sur le fond : fermeture");
assert.equal(typeof fenetre.__ouvrirBossCollectionIdleV1__, "function", "global exposé pour le onclick des cartes");
assert.match(ui, /window\.__ouvrirBossCollectionIdleV1__=ouvrirBossCollectionIdleV1_;/);
assert.match(ui, /window\.__fermerBossCollectionIdleV1__=fermerBossCollectionIdleV1_;/);

console.log("idle-collection-boss-cards-v1: OK");
