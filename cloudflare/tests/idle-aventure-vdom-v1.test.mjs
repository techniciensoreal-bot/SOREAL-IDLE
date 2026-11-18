import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { creerDocument, chargerPreact, chargerPont, evenement, serialiser } from "./_faux-dom-vdom.mjs";

/*
 * Page Aventure rendue par composants Preact (modules/aventure-vdom-v1.js, chantier 2026-11-18, design/PREACT-AVENTURE-PLAN.md) : le VRAI Preact, le VRAI pont et le VRAI module
 * sur un faux DOM. Garanties :
 *  - les nœuds du sélecteur de zone (déclencheur, liste, options) gardent leur identité d'un rendu à l'autre, et l'état « ouvert » posé à la main survit ;
 *  - la scène de combat (nœud impératif, hors conteneur Preact) n'est JAMAIS recréée, ni par un rendu, ni par un redessin complet de la page ;
 *  - après un redessin complet (conteneurs recréés par le morph), le composant se remet en place sans autre appel ;
 *  - anti-spoil (règle n°2) : seules les zones débloquées sont dans la liste ; le bouton Titans fermé n'affiche que « ??? » et le numéro de boss.
 */
const document = creerDocument();
const appels = [];
const window = { document, __selectionnerZoneAdventureIdleV47__: (id) => appels.push("zone:" + id), __toggleMenuZoneAdventureIdleV1__: () => appels.push("toggle"), __vueAventureIdleV1__: (v) => appels.push("vue:" + v), __zoneAdventureSuivanteV1__: () => appels.push("suivante") };
const contexte = { window, document, console, setTimeout, clearTimeout };
contexte.self = window;
chargerPreact(contexte);
const pont = chargerPont(contexte);
vm.runInNewContext(readFileSync("cloudflare/public/modules/aventure-vdom-v1.js", "utf8"), contexte);
const AV = window.__SOREAL_IDLE_AVENTURE_VDOM_V1__;
assert.ok(AV && AV.pret(), "le module Aventure Preact est prêt (Preact + pont chargés)");

/* Page factice : racine, conteneurs data-vdom, scène de combat impérative (data-morph-garder), panneau joueur. */
const racine = document.createElement("div"); racine.className = "soreal-idle-page-root-v28"; document.body.appendChild(racine);
function conteneur(cle) { const c = document.createElement("div"); c.setAttribute("data-vdom", cle); c.setAttribute("data-morph-vivant", ""); return c; }
function poserPage() {
  while (racine.firstChild) racine.removeChild(racine.firstChild);
  ["aventure-bascule", "aventure-zones"].forEach((k) => racine.appendChild(conteneur(k)));
}
poserPage();
const scene = document.createElement("section"); scene.className = "soreal-idle-v79-adventure-scene"; scene.setAttribute("data-morph-garder", "1");
const barre = document.createElement("div"); barre.id = "sorealIdleAdventureFightBarV1"; scene.appendChild(barre);
racine.appendChild(scene);

/* Le faux DOM n est pas muni de la propriété onclick : Preact y pose donc l écouteur sous le nom « Click » (dans un vrai navigateur : « click »). */
const clic = (el) => evenement(el, "Click");
const fmt = (n) => String(n);
const ZONES = [
  { id: "safe", name: "Zone sûre", unlocked: true, p: 0, t: 0 },
  { id: "tutorial", name: "Zone Tutoriel", unlocked: true, p: 10, t: 10, idleP: 5, idleT: 6 },
  { id: "sewers", name: "SECRET-ZONE-VERROUILLEE", unlocked: false, p: 99, t: 99 }
];
const j = { };
const titans = [{ id: "t1" }];

/* --- 1. Premier rendu --- */
AV.bascule(j, { titansAccesBoss: 0 }, titans, "", false);
AV.zones(ZONES, "safe", ZONES[0], fmt);
pont.appliquer();
const picker = document.getElementById("idleZoneSelectCustom");
assert.ok(picker, "le sélecteur est rendu");
assert.equal(picker.querySelectorAll(".team-sort-option").length, 2, "seules les zones débloquées sont listées (règle n°2)");
assert.ok(!serialiser(racine).includes("SECRET-ZONE-VERROUILLEE") && !serialiser(racine).includes("sewers"), "aucune trace d'une zone verrouillée");
const declencheur = picker.querySelector(".team-sort-trigger");
const options = picker.querySelectorAll(".team-sort-option");
const baseOpt = (id) => picker.querySelectorAll(".team-sort-option").find((o) => o.getAttribute("data-zone-id") === id);
assert.ok(baseOpt("safe").className.includes("active") && !baseOpt("tutorial").className.includes("active"), "zone active marquée");
assert.ok(baseOpt("tutorial").getAttribute("title").includes("Puissance 10 · Endurance 10 · Puissance Idle 5 · Endurance Idle 6"), "info-bulle de la zone (mêmes textes)");
assert.ok(picker.querySelector(".team-sort-trigger-value").textContent.includes("Zone sûre"));

/* --- 2. Changement de zone : mêmes nœuds, seul ce qui change est touché ; « ouvert » posé à la main survit --- */
picker.className += " open";
AV.zones(ZONES, "tutorial", ZONES[1], fmt);
assert.ok((document.getElementById("idleZoneSelectCustom"))===(picker), "le sélecteur n'est pas recréé");
assert.ok((picker.querySelector(".team-sort-trigger"))===(declencheur), "le déclencheur n'est pas recréé");
const apres = picker.querySelectorAll(".team-sort-option");
assert.ok(apres.length === options.length && apres.every((o, i) => o === options[i]), "les options gardent leur identité (clé = id de zone)");
assert.ok(picker.className.split(/\s+/).includes("open"), "la classe « open » (impérative) n'est pas retirée par Preact");
assert.ok(baseOpt("tutorial").className.includes("active") && !baseOpt("safe").className.includes("active"), "la zone active a changé");
assert.ok(picker.querySelector(".team-sort-trigger-value").textContent.includes("Zone Tutoriel"));
assert.ok((scene.parentNode)===(racine)); assert.ok((racine.querySelector('[id="sorealIdleAdventureFightBarV1"]'))===(barre), "la scène de combat n'est pas touchée");

/* --- 3. Clics : mêmes ponts que l'ancienne chaîne HTML --- */
clic(baseOpt("safe"));
assert.deepEqual(appels.splice(0), ["zone:safe"], "choisir une zone appelle le pont de sélection");
const boutons = racine.querySelectorAll(".soreal-idle-bascule-aventure-v1 button");
clic(boutons[1]);
assert.deepEqual(appels.splice(0), ["vue:titans"]);
clic(racine.querySelectorAll(".soreal-idle-zone-arrow-v1")[1]);
assert.deepEqual(appels.splice(0), ["suivante"]);

/* --- 4. Redessin complet de la page : conteneurs recréés, scène et état intacts --- */
const ancienPicker = picker;
const sceneAvant = racine.querySelector(".soreal-idle-v79-adventure-scene");
const enfantsScene = sceneAvant.childNodes.slice();
const pannel = document.createElement("div"); pannel.className = "soreal-idle-adventure-player-panel-v1";
poserPage(); racine.appendChild(sceneAvant); racine.appendChild(pannel); // le morph recrée les conteneurs, garde la scène (data-morph-garder)
assert.ok((racine.querySelector('[id="idleZoneSelectCustom"]'))===(null), "avant la remise en place, le conteneur est vide");
pont.appliquer();
const nouveau = document.getElementById("idleZoneSelectCustom");
assert.ok(nouveau && nouveau !== ancienPicker, "le sélecteur se redessine dans le nouveau conteneur (survie à un redessin complet)");
assert.ok(baseOpt("tutorial") && picker.querySelector, "options présentes");
assert.ok((racine.querySelector(".soreal-idle-v79-adventure-scene"))===(sceneAvant), "la scène de combat n'est jamais recréée");
assert.ok(sceneAvant.childNodes.length === enfantsScene.length && sceneAvant.childNodes.every((n, i) => n === enfantsScene[i]), "ni ses enfants");
assert.equal(racine.querySelectorAll(".soreal-idle-bascule-aventure-v1").length, 1);

/* --- 5. Bascule : bouton Titans fermé (exception règle n°2) et absent sans titan --- */
assert.equal(AV.bascule(j, { titansAccesBoss: 0 }, [], "", false), "", "aucun titan, aucun accès : rien");
AV.bascule(j, { titansAccesBoss: 12.7 }, [], "", false);
pont.appliquer();
const ferme = racine.querySelector(".soreal-idle-titans-ferme-v1");
assert.ok(ferme && ferme.hasAttribute("disabled"), "bouton fermé grisé");
assert.equal(ferme.textContent, "???Vaincs le boss 12", "seulement ??? et le numéro de boss");
AV.bascule(j, { titansAccesBoss: 0 }, titans, '<span class="soreal-idle-titan-icone-v1" aria-hidden="true"><img src="x" alt=""></span>', true);
pont.appliquer();
const bas = racine.querySelector(".soreal-idle-bascule-aventure-v1");
assert.ok(bas.className.includes("avec-icone"));
const bb = bas.querySelectorAll("button");
assert.ok(!bb[0].className.includes("actif") && bb[1].className.includes("actif"), "vue Titans : le bouton Titans est actif");
const imgIcone = bas.querySelector("img");
AV.bascule(j, { titansAccesBoss: 0 }, titans, '<span class="soreal-idle-titan-icone-v1" aria-hidden="true"><img src="x" alt=""></span>', false);
assert.ok((bas.querySelector("img"))===(imgIcone), "l'icône du titan (animée en CSS) n'est pas recréée à chaque rendu");

/* --- 6. Section « Un objet t'attend » --- */
racine.appendChild(conteneur("aventure-deblocages"));
AV.deblocages([{ id: "u1", nom: "Objet", systeme: "Cartes" }]);
pont.appliquer();
assert.ok(racine.querySelector('[data-vdom="aventure-deblocages"]').textContent.includes("Libère une place dans ton sac"));

/* --- 7. Branchement dans la page : composants quand Preact est là, chaîne de repli sinon ; jamais Preact pour la scène --- */
const ui = readFileSync("cloudflare/public/modules/ui-aventure-1-v1.js", "utf8");
assert.ok(/vdomAv\.zones\(zones,selected,zone,formatGrandNombreIdleV70_\)/.test(ui), "la page monte le sélecteur par le composant");
assert.ok(ui.includes("soreal-idle-zone-picker-v1") && ui.includes("idleZoneSelectCustom"), "la chaîne HTML de repli existe encore");
assert.ok(/vdomAv\.zonesMontees\(\)\)\{vdomAv\.zones\(/.test(ui), "la mise à jour de zone passe par les données, jamais par une écriture manuelle quand Preact tient le sélecteur");
const mod = readFileSync("cloudflare/public/modules/aventure-vdom-v1.js", "utf8");
assert.ok(!/adventure-scene|sorealIdleAdventureLog|sorealIdleAdventureFightBar|soreal-idle-adventure-log/.test(mod.replace(/\/\*[\s\S]*?\*\//g, "")), "aucun nœud du combat (scène, barres, journal) dans un composant Preact");
console.log("ok idle-aventure-vdom-v1");
