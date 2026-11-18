import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { preparerVdom } from "./_ygg-vdom.mjs";
import { evenement } from "./_faux-dom-vdom.mjs";

/*
 * Page Magie du sang rendue par composants Preact (modules/blood-magic-vdom-v1.js, chantier de fluidité du 2026-11-18) : le VRAI Preact, le VRAI pont, le VRAI morph, la VRAIE page (blood-magic-v1.js) sur un faux DOM.
 * Exigences (AGENTS.md règles n°2 et n°4, section « Blood Magic ») :
 *  (a) la page ne donne au morph qu'une chaîne STABLE (conteneur data-vdom vide) ; rendu initial complet, mêmes classes et mêmes ids qu'avant ;
 *  (b) un nouveau rendu ne REMPLACE aucun nœud : cartes, scènes, boutons, champ Input gardent leur identité ; seul ce qui change est touché ;
 *  (c) la SCÈNE d'un rituel reste impérative : classes posées à la main (data-morph-classes-gardees), blocs gardés (data-morph-garder) et nœud de la scène survivent à un rendu ; les nœuds « vivants » (compte, ligne de durée, sang)
 *      écrits par les ticks ne sont pas réécrits par Preact tant que la valeur du moteur ne change pas ;
 *  (d) le conteneur survit à un redessin complet de la page par le morph ; un changement de menu le démonte ;
 *  (e) un clic appelle les mêmes ponts window.__x__ qu'avant ; (f) anti-spoil : un sort non découvert n'apparaît pas ; aucun total ; (g) sans Preact : repli sur la page en chaînes HTML.
 */
const appels = [];
let etat = null;
const fenetre = {
  setTimeout, setInterval: () => 0, performance: { now: () => 1000 },
  __SOREAL_IDLE_META_HOST_V130__: {
    formatGrandNombreIdleV70_: (v) => String(Math.floor(Number(v) || 0)),
    idleNombre_: (v) => Number(v) || 0,
    idleEntier_: (v) => Math.floor(Number(v) || 0),
    idleHtml_: (v) => String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;"),
    getIdleEtat: () => etat
  },
  __SOREAL_IDLE_FORMAT_NOMBRE_V2__: (v) => String(Math.floor(v)),
  __actionMetaV47__: (p) => appels.push(["action", p]),
  __ajusterRituelBloodMagicIdleV1__: (...a) => appels.push(["ajuster", ...a]),
  __presetBloodMagicIdleV1__: (...a) => appels.push(["preset", ...a]),
  __viderBloodMagicIdleV1__: () => appels.push(["vider"]),
  __basculerInfoSortBloodIdleV1__: (id) => appels.push(["info", id]),
  __saisirMontantAugmentIdleV1__: (v) => appels.push(["saisir", v]),
  __resoudreFractionInputIdleV1__: () => {}
};
const document = preparerVdom(fenetre);
/* Décor minimal (le vrai, sang-rituel-decor-v1.js, a ses propres tests) : une scène à deux blocs frères comme le vrai (scène + étagère), avec les mêmes attributs de garde. */
fenetre.__SOREAL_IDLE_SANG_DECOR_V1__ = {
  css() {},
  entete: (t, s) => '<div class="bm-entete"><h2 class="bm-titre">' + t + '</h2><p>' + s + "</p></div>",
  scene: (o) => '<div class="bm-scene" data-morph-classes-gardees="^bm-" data-bm-id="' + o.id + '" data-bm-pleins="' + Math.floor(o.compte / 200) + '"><div class="bm-ver"><div class="bm-tuyau' + (o.saigne ? " saigne-v1" : "") + '">' + (o.barre || "") + '</div></div><div class="bm-vase"></div></div><div class="bm-etagere" data-bm-etagere="' + o.id + '"><b class="bm-etagere-n">' + (o.sangTotal == null ? o.compte * o.sang : o.sangTotal) + "</b></div>"
};
vm.runInNewContext(readFileSync("cloudflare/public/modules/morph-v1.js", "utf8"), fenetre);
vm.runInNewContext(readFileSync("cloudflare/public/modules/blood-magic-vdom-v1.js", "utf8"), fenetre, { filename: "blood-magic-vdom-v1.js" });
vm.runInNewContext(readFileSync("cloudflare/public/modules/blood-magic-v1.js", "utf8"), fenetre, { filename: "blood-magic-v1.js" });
const V = fenetre.__SOREAL_IDLE_VDOM_V1__, M = fenetre.__SOREAL_IDLE_MORPH_V1__, B = fenetre.__SOREAL_IDLE_BLOOD_V1__, BV = fenetre.__SOREAL_IDLE_BLOOD_VDOM_V1__;
assert.ok(V && M && B && BV && fenetre.preact && BV.disponible(), "pont, morph, page, module Preact et Preact chargés");

let montant = 125;
const hote = {
  systemeMeta: (j, id) => (id === "bloodMagic" ? j.systemes.systems[0] : null),
  envoyerAllocRapide: () => {}, recalculerPisteFraction: () => ({ seconds: 0, progress: 0 }), ancreSnapshot: () => 0,
  formatDuree: (s) => Math.round(s) + " s", carteAide: (cle, resume) => '<details class="soreal-idle-aide-v1" data-idle-aide-v1="' + cle + '"><summary>aide</summary><p>' + resume.slice(0, 20) + "</p></details>",
  legendeAllocation: () => "", emojiNom: () => "", montant: () => montant, fixerMontant: (n) => { montant = n; }
};
const page = B.creer(hote).page;
/* creer() pose les vrais ponts window.__x__ : on les remplace par des espions APRÈS (les composants les appellent à chaque clic, par leur nom). */
Object.assign(fenetre, {
  __ajusterRituelBloodMagicIdleV1__: (...a) => appels.push(["ajuster", ...a]),
  __presetBloodMagicIdleV1__: (...a) => appels.push(["preset", ...a]),
  __viderBloodMagicIdleV1__: () => appels.push(["vider"]),
  __basculerInfoSortBloodIdleV1__: (id) => appels.push(["info", id])
});

function joueur({ sang = 150, pic = 150, tack = 3, papier = 0, magieTack = 50, eta = 4 } = {}) {
  const spells = {};
  return {
    systemes: {
      currencies: { blood: sang, gold: 1000 },
      resources: { magic: { current: 500, cap: 1000 } },
      bloodRituals: [{ id: "tack", name: "Tack", gold: 5, blood: 1, baseSeconds: 10 }, { id: "papercuts", name: "Papercuts", gold: 50, blood: 10, baseSeconds: 20 }],
      bloodMagicView: { activeRitual: "tack", rituals: [{ id: "tack", magic: magieTack, secondsPerCompletion: 10, etaSeconds: eta, progressFraction: 0.6 }] },
      systems: [{ id: "bloodMagic", state: { unlocked: true, allocation: { magic: magieTack }, data: { activeRitual: "tack", bloodPeak: pic, spells, rituals: { tack: { completions: tack, magic: magieTack, bloodGain: 1, bloodCollected: tack }, papercuts: { completions: papier, magic: 0 } } } } }]
    }
  };
}

const racine = document.createElement("div");
racine.className = "soreal-idle-page-root-v28";
document.body.appendChild(racine);
/* Le faux DOM ne connaît pas « #id » : on passe par getElementById. */
const qa = (sel) => { const m = /^#([A-Za-z0-9_-]+)(?: +(.+))?$/.exec(sel); if (!m) return racine.querySelectorAll(sel); const el = document.getElementById(m[1]); return !el ? [] : m[2] ? el.querySelectorAll(m[2]) : [el]; };
const q = (sel) => qa(sel)[0] || null;
function redessiner(j, enveloppe = (h) => h) {
  etat = j;
  const chaine = page(j);
  M.morpherHtml(racine, enveloppe(chaine));
  V.appliquer();
  return chaine;
}

// (a) rendu initial
const chaine = redessiner(joueur());
assert.equal(chaine, '<div id="vdom-sang" data-vdom="sang" data-morph-vivant></div>', "la page ne donne au morph qu'une chaîne stable et vide");
const conteneur = q('[data-vdom="sang"]');
assert.ok(conteneur && conteneur.parentNode === racine, "conteneur posé dans la page");
assert.equal(qa(".bm-rituel").length, 2, "deux rituels");
assert.ok(conteneur.innerHTML.includes('class="bm-entete"') && conteneur.innerHTML.includes('class="soreal-idle-aide-v1"'), "en-tête et aide (HTML déjà fabriqué, posé tel quel)");
for (const sel of [".soreal-idle-bloodmagic-v1", ".bm-sang-total-v1", "#sorealIdleBloodTotalV1", "#sorealIdleBloodOrV1", ".soreal-idle-blood-sorts-v1", "#sorealIdleBloodInputV1", "#sorealIdleBloodLibreV1", "#sorealIdleBloodAllocV1", ".bm-grille", "#sorealIdleBloodRitualV1_tack", "#sorealIdleBloodCountV1_tack", "#sorealIdleBloodRitualAllocV1_tack", "#sorealIdleBloodEtaLineV1_tack", "#sorealIdleBloodMarkerV1_tack", '.bm-scene[data-bm-id="tack"]', '.bm-etagere[data-bm-etagere="tack"]', "[data-idle-blood-bar-v1]", ".soreal-idle-bt-presets-v120", ".soreal-idle-bt-actions-v120"]) {
  assert.ok(q(sel), "présent : " + sel);
}
assert.equal(q("#sorealIdleBloodCountV1_tack").textContent, "3", "compteur « N complété(s) »");
assert.equal(q("#sorealIdleBloodEtaLineV1_tack").textContent, "⏱ 4 s avant le prochain rituel complété");
assert.equal(q("#sorealIdleBloodEtaLineV1_papercuts").textContent, "", "rituel sans Magic : pas de ligne de durée");
assert.equal(q("#sorealIdleBloodTotalV1").textContent, "150");
assert.equal(q("#sorealIdleBloodMarkerV1_tack").textContent, " ▶", "rituel sélectionné");
assert.equal(q('.bm-rituel [data-cout-or="5"]').className, "or-cout-v1 or-ok");
assert.equal(q('.bm-scene[data-bm-id="tack"] .bm-tuyau').className, "bm-tuyau saigne-v1", "le rituel qui progresse saigne (scène)");
assert.equal(q("#sorealIdleBloodInputV1").value, "125", "le champ Input reprend le montant du jeu");

// (f) anti-spoil : sang 150 -> Number Boost et Pilule de fer ; ni Spaghetti (1e4) ni dernier sort ; aucun total
const noms = qa(".soreal-idle-blood-sort-v1").map((e) => e.getAttribute("data-sort"));
assert.deepEqual(noms, ["numberBoost", "ironPill"], "seuls les sorts découverts");
const texte = racine.textContent;
assert.ok(!/verrouill|\?\?\?|\d\s*\/\s*\d/.test(texte.replace(/1\/2|1\/4/g, "")), "aucun cadenas, aucun total x / y");
assert.ok(!texte.includes("Spaghetti") && !texte.includes("Or contrefait"), "sorts suivants invisibles");

// (b) identité des nœuds au rendu suivant (tout change : sang, compteur, durée)
const ids = ["#sorealIdleBloodRitualV1_tack", "#sorealIdleBloodRitualV1_papercuts", '.bm-scene[data-bm-id="tack"]', '.bm-etagere[data-bm-etagere="tack"]', "#sorealIdleBloodCountV1_tack", "#sorealIdleBloodEtaLineV1_tack", "#sorealIdleBloodInputV1", ".soreal-idle-blood-lancer-v1", ".soreal-idle-blood-sort-v1", ".bm-grille", "#sorealIdleBloodTotalV1", "[data-idle-blood-bar-v1]"];
const avant = ids.map((s) => q(s));
redessiner(joueur({ sang: 200, tack: 4, eta: 2 }));
ids.forEach((s, i) => assert.equal(q(s), avant[i], "même nœud : " + s));
assert.equal(q("#sorealIdleBloodCountV1_tack").textContent, "4", "le compteur suit le moteur");
assert.equal(q("#sorealIdleBloodEtaLineV1_tack").textContent, "⏱ 2 s avant le prochain rituel complété");
assert.equal(q("#sorealIdleBloodTotalV1").textContent, "200");
assert.equal(q('.bm-etagere[data-bm-etagere="tack"] .bm-etagere-n').textContent, "4", "la scène suit (sang collecté de ce rituel)");

// (c) scène impérative : classe posée à la main, bloc gardé, nœud de la scène
const scene = q('.bm-scene[data-bm-id="tack"]');
scene.classList.add("bm-installe");
const garde = document.createElement("div"); garde.className = "bm-vase bm-suivant"; garde.setAttribute("data-morph-garder", "");
scene.appendChild(garde);
const vase = scene.querySelector(".bm-vase");
redessiner(joueur({ sang: 250, tack: 450, eta: 1 }));
assert.equal(q('.bm-scene[data-bm-id="tack"]'), scene, "la scène n'est jamais recréée");
assert.ok(scene.classList.contains("bm-installe"), "classe bm-* posée par le module : gardée (data-morph-classes-gardees)");
assert.ok(garde.parentNode === scene, "bloc data-morph-garder gardé");
assert.equal(scene.querySelector(".bm-vase"), vase, "le calice n'est pas recréé");
assert.equal(scene.getAttribute("data-bm-pleins"), "2", "les données de la scène suivent le moteur (450 niveaux = 2 pleins)");

// nœuds vivants : un tick écrit un chiffre plus avancé ; tant que le moteur n'annonce rien de neuf, Preact n'y touche pas
const compte = q("#sorealIdleBloodCountV1_tack"), eta = q("#sorealIdleBloodEtaLineV1_tack");
compte.textContent = "451"; eta.innerHTML = "<b>vu par le tick</b>";
redessiner(joueur({ sang: 250, tack: 450, eta: 1 }));
assert.equal(compte.textContent, "451", "valeur du moteur inchangée : le chiffre du tick reste");
assert.equal(eta.textContent, "vu par le tick");
redessiner(joueur({ sang: 250, tack: 460, eta: 0 }));
assert.equal(compte.textContent, "460", "le moteur change : le compteur est réécrit");

// boutons « Lancer le sort » : écrits par la minuterie ; Preact ne les réécrit que si l'état venu du moteur change
const lancer = (id) => q('.soreal-idle-blood-sort-v1[data-sort="' + id + '"] .soreal-idle-blood-lancer-v1');
assert.equal(lancer("numberBoost").getAttribute("onclick"), "window.__lancerSortBloodIdleV1__('numberBoost')");
assert.equal(lancer("numberBoost").textContent, "Lancer le sort");
assert.equal(lancer("ironPill").disabled, false);
assert.equal(lancer("ironPill").getAttribute("data-sang-mini"), "100");
lancer("ironPill").disabled = true; lancer("ironPill").textContent = "écrit par la minuterie";
redessiner(joueur({ sang: 250, tack: 460, eta: 0 }));
assert.equal(lancer("ironPill").textContent, "écrit par la minuterie", "même état moteur : la minuterie garde la main");
redessiner(joueur({ sang: 10, pic: 250, tack: 460, eta: 0 }));
assert.equal(lancer("ironPill").disabled, true, "le sang retombe : inactif");
assert.equal(lancer("ironPill").textContent, "Pas assez de sang");
assert.equal(lancer("ironPill").hasAttribute("onclick"), false);
redessiner(joueur({ sang: 400, tack: 460, eta: 0 }));
assert.equal(lancer("ironPill").disabled, false);
assert.equal(lancer("ironPill").getAttribute("onclick"), "window.__lancerSortBloodIdleV1__('ironPill')");

// (d) redessin complet de la page par le morph : le conteneur et les nœuds survivent ; puis changement de menu
const sceneAvant = q('.bm-scene[data-bm-id="tack"]');
const chaineMorph = redessiner(joueur({ sang: 400, tack: 460, eta: 0 }), (h) => h);
assert.equal(chaineMorph, chaine);
assert.equal(q('.bm-scene[data-bm-id="tack"]'), sceneAvant, "le redessin de la page ne touche pas au conteneur");
etat = joueur();
M.morpherHtml(racine, '<div class="autre-menu">autre</div>'); V.appliquer();
assert.equal(q('[data-vdom="sang"]'), null, "autre menu : conteneur retiré");
assert.equal(V.registre.sang, undefined, "autre menu : composant démonté et oublié");
redessiner(joueur());
assert.equal(qa(".bm-rituel").length, 2, "retour au menu : la page revient");

// (e) clics -> mêmes ponts qu'avant
const clic = (el) => evenement(el, "click");
const boutonsRituel = qa("#sorealIdleBloodRitualV1_papercuts .soreal-idle-bt-actions-v120 button");
assert.equal(boutonsRituel.length, 4);
boutonsRituel.forEach(clic);
assert.deepEqual(appels.splice(0), [["ajuster", "papercuts", "plus"], ["ajuster", "papercuts", "moins"], ["ajuster", "papercuts", "cap"], ["ajuster", "papercuts", "zero"]]);
const presets = qa('[data-bt-groupe-v1="magic"] button');
presets.forEach(clic);
assert.deepEqual(appels.splice(0), [["preset", "cap", 1], ["preset", "cap", 0.5], ["preset", "cap", 0.25], ["preset", "idle", 0.5], ["preset", "idle", 0.25], ["vider"]]);
clic(q(".soreal-idle-blood-info-v1"));
assert.deepEqual(appels.splice(0), [["info", "numberBoost"]]);
const auto = q('[data-sort-auto="numberBoost"]');
assert.equal(auto.getAttribute("aria-pressed"), "false");
clic(auto);
assert.equal(JSON.stringify(appels.splice(0)), JSON.stringify([["action", { action: "setBloodAutoSpell", spell: "numberBoost" }]]));
assert.ok(!q('[data-sort-auto="ironPill"]'), "seuls les sorts qui ont un mode automatique en portent un");
const champ = q("#sorealIdleBloodInputV1");
champ.value = "1/8"; evenement(champ, "input");
assert.deepEqual(appels.splice(0), [["saisir", "1/8"]]);
// le champ saisi n'est pas réécrit par un rendu qui n'apporte pas de nouveau montant
redessiner(joueur({ tack: 5 }));
assert.equal(champ.value, "1/8", "la saisie en cours survit aux rendus");

// (g) sans Preact : repli sur la page en chaînes HTML (même contenu)
{
  const f2 = { setTimeout, setInterval: () => 0, performance: { now: () => 1 }, __SOREAL_IDLE_META_HOST_V130__: fenetre.__SOREAL_IDLE_META_HOST_V130__, __SOREAL_IDLE_SANG_DECOR_V1__: fenetre.__SOREAL_IDLE_SANG_DECOR_V1__, __SOREAL_IDLE_FORMAT_NOMBRE_V2__: fenetre.__SOREAL_IDLE_FORMAT_NOMBRE_V2__ };
  f2.window = f2;
  vm.runInNewContext(readFileSync("cloudflare/public/modules/blood-magic-vdom-v1.js", "utf8"), f2);
  vm.runInNewContext(readFileSync("cloudflare/public/modules/blood-magic-v1.js", "utf8"), f2);
  assert.equal(f2.__SOREAL_IDLE_BLOOD_VDOM_V1__.disponible(), false);
  etat = joueur();
  const chaineRepli = f2.__SOREAL_IDLE_BLOOD_V1__.creer(hote).page(etat);
  assert.ok(chaineRepli.includes('class="bm-grille"') && chaineRepli.includes('id="sorealIdleBloodCountV1_tack"') && !chaineRepli.includes("data-vdom"), "repli : la page complète en chaînes HTML");
}
console.log("idle-sang-vdom-v1 : OK");
