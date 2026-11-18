import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { creerDocument, chargerPreact, chargerPont, evenement } from "./_faux-dom-vdom.mjs";

/*
 * Page ITOPOD (tour + boutique des Atouts) rendue par composants Preact (modules/itopod-vdom-v1.js + modules/itopod-perks-page-v1.js, chantier de fluidité 2026-11-18) : le VRAI Preact, le VRAI pont,
 * le VRAI morph et les VRAIS modules sur un faux DOM. Garanties (AGENTS.md règle n°4) :
 *  (a) la page ne donne au morph qu'une chaîne stable (conteneur data-vdom vide) ; rendu initial complet, mêmes classes ;
 *  (b) une synchro (chiffres, PP, vitrines qui deviennent abordables) ne REMPLACE aucun nœud ; la scène animée (HTML posé une fois, modifié ensuite par son module) n'est pas réécrite ;
 *  (c) un champ d'étage en cours de saisie n'est jamais écrasé par un rendu ; il suit le serveur seulement quand le joueur n'y est pas ;
 *  (d) le filtre de recherche des perks garde le MÊME champ (focus), la bascule de vue ne redessine rien d'autre ;
 *  (e) le conteneur survit à un redessin complet de la page par le morph ; un changement de menu le démonte ;
 *  (f) un clic arrive à la bonne action (entrer, pilule, appliquer, acheter un perk) ;
 *  (g) anti-spoil (règle n°2) : atouts fermés = ni bouton ni vitrines ; perks verrouillés jamais rendus ; tour verrouillée = « Rien à afficher ».
 */
const document = creerDocument();
const actions = [];
const brouillon = {};
let etatJoueur = null;
const fenetre = {
  document,
  __SOREAL_IDLE_META_HOST_V130__: {
    idleEntier_: (v) => Math.max(0, Math.floor(Number(v) || 0)),
    idleNombre_: (v) => Number(v) || 0,
    formatGrandNombreIdleV70_: (v) => String(Math.floor(Number(v) || 0)),
    getIdleEtat: () => etatJoueur
  },
  __SOREAL_IDLE_META_PARTAGE_V130__: {
    systemeMetaParIdIdleV130_: (j, id) => (j.systemes.systems || []).find((s) => s.id === id) || null,
    actionMetaIdleV130_: (p) => actions.push(p),
    toggleSystemeMetaIdleV130_: (id) => actions.push({ toggle: id }),
    emojiNomIdleV1_: (_a, _b, n) => n
  },
  localStorage: { getItem: (k) => (k in brouillon ? brouillon[k] : null), setItem: (k, v) => { brouillon[k] = String(v); }, removeItem: (k) => { delete brouillon[k]; } },
  console, setTimeout, setInterval: () => 0, fetch: () => new Promise(() => {})
};
fenetre.window = fenetre;
const contexte = fenetre;
chargerPreact(contexte);
chargerPont(contexte);
vm.runInNewContext(readFileSync("cloudflare/public/modules/morph-v1.js", "utf8"), contexte);
vm.runInNewContext(readFileSync("cloudflare/public/modules/itopod-scene-v1.js", "utf8"), contexte, { filename: "itopod-scene-v1.js" });
vm.runInNewContext(readFileSync("cloudflare/public/modules/itopod-vdom-v1.js", "utf8"), contexte, { filename: "itopod-vdom-v1.js" });
vm.runInNewContext(readFileSync("cloudflare/public/modules/itopod-perks-page-v1.js", "utf8"), contexte, { filename: "itopod-perks-page-v1.js" });
const I = fenetre.__SOREAL_IDLE_ITOPOD_PERKS_PAGE_V1__, V = fenetre.__SOREAL_IDLE_VDOM_V1__, M = fenetre.__SOREAL_IDLE_MORPH_V1__;
assert.ok(I && V && M && fenetre.__SOREAL_IDLE_ITOPOD_VDOM_V1__ && fenetre.preact, "modules, pont, morph et Preact chargés");

function joueur({ pp = 2, kills = 14, atouts = true, tour = true, pilules = 0, ppProgress = 250000 } = {}) {
  const systems = [];
  if (tour) systems.push({ id: "tower", state: { unlocked: true, active: false, data: { floor: 3, kills, killsOnFloor: kills % 10, highestFloor: 5, optimalFloor: 4, startFloor: null, endFloor: null, ppProgress, hitsParKill: 2, intervalS: 1, respawnS: 4 } } });
  if (atouts) systems.push({ id: "perks", state: { unlocked: true, data: { levels: { 1: 2, 2: 5 } } } });
  return {
    systemes: {
      systems, difficulty: "normal", currencies: { pp }, consommables: { reserve: { bluePills: pilules }, pilulesActives: false },
      perkDefinitions: [
        { id: 1, name: "Perk Un", cap: 5, cost: 3, effect: "Effet un" },
        { id: 2, name: "Perk Deux", cap: 5, cost: 4, effect: "Effet deux" },
        { id: 52, name: "Perk Spécial", cap: 1, cost: 50, effect: "Effet spécial" }
      ]
    }
  };
}

const racine = document.createElement("div");
racine.className = "soreal-idle-page-root-v28";
document.body.appendChild(racine);
function dessiner(j, enveloppe = (h) => h) {
  etatJoueur = j;
  const chaine = I.pageItopodIdleV1_(j);
  M.morpherHtml(racine, enveloppe(chaine));
  V.appliquer();
  return chaine;
}
const tous = (el) => { const o = []; (function f(n) { for (const c of n.childNodes) { o.push(c); if (c.childNodes) f(c); } })(el); return o; };

// (a) rendu initial
const chaine = dessiner(joueur());
assert.equal(chaine, '<div id="vdom-itopod" data-vdom="itopod" data-morph-vivant></div>', "chaîne stable et vide pour le morph");
const conteneur = racine.querySelector('[data-vdom="itopod"]');
assert.ok(conteneur && conteneur.parentNode === racine);
for (const sel of [".soreal-idle-page-head-v28", ".itp-vues", ".itp-vue-atouts", ".itp-page", ".itp-scene-hote", ".itp-entree", ".itp-montee", ".itp-tuiles", ".itp-pp-rempli", ".pk-boutique", ".pk-recherche", ".pk-bascule"]) assert.ok(racine.querySelector(sel), "présent : " + sel);
assert.equal(racine.querySelectorAll(".itp-tuile").length, 6, "six tuiles de progression");
assert.equal(racine.querySelectorAll(".pk-vitrine").length, 3, "trois vitrines");
assert.ok(racine.querySelector(".itp-vue-atouts").hasAttribute("hidden") && !racine.querySelector(".itp-page").hasAttribute("hidden"), "vue tour par défaut : Atouts cachés, tour visible");
assert.ok(!racine.querySelector(".itp-bouton-pilule"), "aucune pilule : pas de bouton (comme avant)");
assert.equal(racine.querySelector(".itp-pp-rempli").style.width, "25.00%");
assert.equal(racine.querySelector(".itp-pp-ligne b").textContent.replace(/\s| /g, ""), "250000/1000000");
assert.equal(racine.querySelector(".pk-solde b").textContent, "2");
assert.ok(!racine.querySelector(".pk-abordable") && racine.querySelector(".pk-max") && racine.querySelectorAll(".pk-possede").length === 2, "2 PP : rien d'abordable, un perk au maximum, deux possédés");
assert.ok(racine.querySelector('.pk-image').getAttribute("src").startsWith("/perks/1.webp"));
assert.ok(racine.querySelectorAll(".pk-image")[2].getAttribute("src").endsWith("/perks/52.webp?v=2"), "version du visuel conservée");
assert.equal(racine.querySelector("[id=\"itopodDebutV1\"]").value, "3", "Départ = étage courant en mode Auto");
assert.equal(racine.querySelector("[id=\"itopodFinV1\"]").value, "4", "Fin = étage optimal en mode Auto");
assert.equal(chaine, dessiner(joueur()), "redessin identique : même chaîne");

// (b) synchro : le nœud de la scène animée et tous les autres sont conservés
const hote = racine.querySelector(".itp-scene-hote");
assert.ok(hote && hote.innerHTML.includes("itp-arene"), "scène (HTML du module de scène) posée une fois dans son hôte sans boîte");
assert.equal(hote.style.display, "contents");
const scene = document.createElement("section");             // ce que fait itopod-scene-v1 : il retouche son propre DOM (coups, barre de vie, ennemi suivant)
scene.className = "itp-arene-anime"; scene.setAttribute("data-test-animation", "1");
hote.appendChild(scene);
const avant = tous(racine);
etatJoueur = joueur({ pp: 12, kills: 15, ppProgress: 300000 });
fenetre.__rafraichirItopodIdleV1__(etatJoueur);
const apres = new Set(tous(racine));
const remplaces = avant.filter((n) => !apres.has(n));
assert.equal(remplaces.length, 0, "aucun nœud remplacé par une synchro : " + remplaces.map((n) => (n.tagName || "#texte") + "." + (n.className || n.data || "")).join(" | "));
assert.ok(racine.querySelector(".itp-arene-anime") === scene && scene.parentNode === hote && scene.getAttribute("data-test-animation") === "1", "scène : même élément, rien de réécrit par la synchro");
assert.equal(racine.querySelector(".itp-pp-rempli").style.width, "30.00%", "barre PP mise à jour");
assert.equal(racine.querySelector(".pk-solde b").textContent, "12", "solde mis à jour");
assert.equal(racine.querySelectorAll(".pk-abordable").length, 1, "la vitrine devenue abordable suit les PP (le perk au maximum ne l'est jamais)");
const tuileKills = racine.querySelectorAll(".itp-tuile b")[2];
assert.equal(tuileKills.textContent, "15");

// (c) champs d'étage : jamais écrasés pendant la frappe, suivent le serveur sinon
const champ = racine.querySelector("[id=\"itopodDebutV1\"]");
document.activeElement = champ;
champ.value = "12";                                        // frappe en cours, pas encore dans le brouillon
fenetre.__rafraichirItopodIdleV1__(joueur({ kills: 16 }));
assert.equal(racine.querySelector("[id=\"itopodDebutV1\"]").value, "12", "la saisie en cours n'est pas écrasée");
assert.ok(racine.querySelector("[id=\"itopodDebutV1\"]") === champ, "même champ");
document.activeElement = null;
fenetre.localStorage.setItem("soreal_idle_itopod_etages_v1", JSON.stringify({ d: 20, f: 40 }));
dessiner(joueur({ kills: 16 }));
assert.equal(racine.querySelector("[id=\"itopodDebutV1\"]").value, "20", "le brouillon (compte) se pose quand le joueur n'est pas en train de taper");
assert.equal(racine.querySelector("[id=\"itopodFinV1\"]").value, "40");
fenetre.localStorage.removeItem("soreal_idle_itopod_etages_v1");

// (d) filtre des perks : même champ, vitrines filtrées, nœuds conservés
const recherche = racine.querySelector(".pk-recherche");
const vitrine2 = racine.querySelectorAll(".pk-vitrine")[1];
fenetre.__perkFiltrerIdleV1__("deux", null);
assert.equal(racine.querySelectorAll(".pk-vitrine").length, 1, "un seul perk correspond");
assert.ok(racine.querySelector(".pk-recherche") === recherche, "même champ de recherche (le focus ne se perd pas)");
assert.ok(racine.querySelector(".pk-vitrine") === vitrine2, "la vitrine gardée est le même élément (clé par perk)");
fenetre.__perkFiltrerIdleV1__("zzz", null);
assert.ok(racine.querySelector(".pk-vide"), "aucun résultat : message");
fenetre.__perkFiltrerIdleV1__("", null);
assert.equal(racine.querySelectorAll(".pk-vitrine").length, 3);
fenetre.__perkFiltrerIdleV1__(null, true);
assert.ok(racine.querySelector(".pk-bascule").className.includes("actif"));
fenetre.__perkFiltrerIdleV1__(null, false);
// bascule de vue : seuls les attributs hidden changent
const tourAvant = tous(racine);
fenetre.__itopodVueIdleV1_basculer__();
assert.equal(fenetre.__itopodVueIdleV1__, "atouts");
assert.ok(racine.querySelector(".itp-page").hasAttribute("hidden") && !racine.querySelector(".itp-vue-atouts").hasAttribute("hidden"), "vue Atouts");
assert.equal(racine.querySelector(".itp-bouton-atouts").textContent, "🏢 Retour à la tour");
const apresBascule = new Set(tous(racine));
assert.equal(tourAvant.filter((n) => !apresBascule.has(n)).length, 0, "la bascule ne remplace aucun nœud");
fenetre.__itopodVueIdleV1_basculer__();
assert.ok(!racine.querySelector(".itp-page").hasAttribute("hidden"));

// (e) redessin complet de la page par le morph : le conteneur et la scène survivent ; changement de menu : démonté
const dedans = tous(conteneur);
dessiner(joueur({ kills: 16 }), (h) => '<div class="entete">autre bloc</div>' + h + '<div class="pied">fin</div>');
assert.ok(racine.querySelector('[data-vdom="itopod"]') === conteneur, "conteneur conservé");
assert.ok(dedans.every((n) => tous(conteneur).includes(n)), "contenu intact après le redessin de la page (scène animée comprise : son HTML n'a pas changé)");
M.morpherHtml(racine, "<div>autre menu</div>");
V.appliquer();
assert.equal(V.registre.itopod, undefined, "page quittée : démontée et oubliée");
dessiner(joueur({ kills: 16 }));
assert.ok(racine.querySelector('[data-vdom="itopod"]') !== conteneur && racine.querySelectorAll(".pk-vitrine").length === 3, "retour : rendue de zéro");

// (f) clics -> actions
actions.length = 0;
evenement(racine.querySelector(".itp-bouton-entrer"), "click");
assert.deepEqual(JSON.parse(JSON.stringify(actions)), [{ toggle: "tower" }], "entrer / quitter");
actions.length = 0;
evenement(racine.querySelector(".itp-actions .itp-bouton"), "click");
assert.equal(actions[0].action, "towerFloors", "appliquer les étages");
actions.length = 0;
evenement(racine.querySelector(".itp-bouton-auto"), "click");
assert.deepEqual(JSON.parse(JSON.stringify(actions)), [{ action: "towerFloors", auto: true }]);
actions.length = 0;
evenement(racine.querySelector(".pk-acheter"), "click");
assert.deepEqual(JSON.parse(JSON.stringify(actions)), [{ action: "buyPerk", perkId: 1 }], "acheter un perk");
dessiner(joueur({ pilules: 3 }));
const pilule = racine.querySelector(".itp-bouton-pilule");
assert.ok(pilule && pilule.textContent.includes("(3 kills restants)"), "bouton de pilule seulement avec des pilules");
actions.length = 0;
evenement(pilule, "click");
assert.deepEqual(JSON.parse(JSON.stringify(actions)), [{ action: "towerTogglePill" }]);
const bouton = racine.querySelectorAll(".itp-pas-bouton")[1];
champ.value = "";
evenement(bouton, "click");   // + : borne 0-1600, écrit le brouillon (un champ vide ne l'écrit pas)

// (g) anti-spoil
dessiner(joueur({ atouts: false }));
assert.ok(!racine.querySelector(".itp-vues") && !racine.querySelector(".itp-vue-atouts") && !racine.querySelector(".pk-boutique"), "atouts verrouillés : ni bouton ni vitrines");
const verrouille = I.pageItopodIdleV1_(joueur({ tour: false }));
assert.ok(verrouille.includes("Rien à afficher pour le moment."), "tour verrouillée : rien");
assert.ok(!/ITOPOD|itp-|Atouts/.test(verrouille));
assert.equal(I.htmlItopodIdleV1_(joueur({ tour: false })), "");
const html = I.htmlItopodIdleV1_(joueur());
assert.ok(html.includes("pk-vitrine") && html.includes("Perk Emporium") && html.includes("🏢 ITOPOD"), "rendu vers chaîne (tests)");

console.log("idle-itopod-vdom-v1: OK");
