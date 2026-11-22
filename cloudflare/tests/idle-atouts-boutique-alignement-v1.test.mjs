import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { creerDocument, chargerPreact, chargerPont, evenement } from "./_faux-dom-vdom.mjs";
import { normalizeIdleNguState, applyIdleNguAction } from "../src/idle-ngu-progression.js";
import { IDLE_PERKS_CATALOG_V1 } from "../src/idle-perks-v1.js";

/*
 * Boutique des Atouts et page ITOPOD alignées sur le jeu (IL build 1260, audit 2026-11-22) :
 *  3. « Tout dépenser » (ItopodPerkController::tryLevelAll / doLevelAll) : action moteur buyPerkMax + bouton « Tout » (et clic droit) ;
 *  4. ordre croissant des indices (le catalogue SOREAL a 6 descentes) + deux tris (coût de base : orderBaseCost ; coût total : orderTotalCost) ;
 *  5. filtres : « Abordables » = filterAffordable (cost <= PP, SANS exclure les atouts au maximum), « Masquer les maximums » = filterNotMax ; réglages liés au compte (clé soreal_idle_perks_reglages_v1) ;
 *  6. Fibonacci (fibPerkUnlocks) : paliers atteints + UN « ?????? » pour le prochain, jamais la liste complète (règle n°2) ;
 *  8. sous-titre : PPP de base envoyés par le serveur (d.ppBase) ;
 *  9. noms alignés sur le jeu, mention de difficulté ;
 *  11. boutons « Max », « Optimal » (ex-Auto), interrupteurs Lazy ITOPOD Floor Shifter (seulement s'il est acheté) et Idle Mode.
 */

// ---------- moteur : buyPerkMax ----------
{
  const ctx = { bosses: 300 };
  const etat = (pp, levels = {}) => {
    const s = normalizeIdleNguState({ difficulty: "normal" }, ctx, 0);
    s.systems.perks.unlocked = true;
    s.currencies.pp = pp;
    Object.assign(s.systems.perks.data.levels, levels);
    return s;
  };
  // perk 6 : coût 1, plafond 50
  const { state: a, result: ra } = applyIdleNguAction(etat(30), { action: "buyPerkMax", perkId: 6 }, ctx, 1000);
  assert.equal(a.systems.perks.data.levels[6], 30, "30 PP à 1 PP/niveau : 30 niveaux");
  assert.equal(a.currencies.pp, 0);
  assert.equal(ra.bought, 30);
  const { state: b } = applyIdleNguAction(etat(1000), { action: "buyPerkMax", perkId: 6 }, ctx, 1000);
  assert.equal(b.systems.perks.data.levels[6], 50, "borné au plafond");
  assert.equal(b.currencies.pp, 950);
  // perk 13 : coût 5, plafond 20, niveau 3 déjà acquis, 23 PP : 4 niveaux (20 PP)
  const { state: c } = applyIdleNguAction(etat(23, { 13: 3 }), { action: "buyPerkMax", perkId: 13 }, ctx, 1000);
  assert.equal(c.systems.perks.data.levels[13], 7);
  assert.equal(c.currencies.pp, 3);
  // mêmes refus que buyPerk
  assert.throws(() => applyIdleNguAction(etat(4), { action: "buyPerkMax", perkId: 13 }, ctx, 1000), /MONNAIE_INSUFFISANTE/);
  assert.throws(() => applyIdleNguAction(etat(99, { 6: 50 }), { action: "buyPerkMax", perkId: 6 }, ctx, 1000), /PERK_AU_MAXIMUM/);
  assert.throws(() => applyIdleNguAction(etat(1e9), { action: "buyPerkMax", perkId: 126 }, ctx, 1000), /DIFFICULTE_REQUISE/);
  assert.throws(() => applyIdleNguAction(etat(10), { action: "buyPerkMax", perkId: 9999 }, ctx, 1000), /PERK_INTROUVABLE/);
}

// ---------- catalogue : noms du jeu et texte du perk 94 ----------
{
  const nom = (id) => IDLE_PERKS_CATALOG_V1.find((p) => p.id === id).name;
  assert.equal(nom(36), "Adv. Training Level Bank I");
  assert.equal(nom(40), "Adv. Training Level Bank V");
  assert.equal(nom(113), "Adventure Hack Milestone Reducer I");
  assert.equal(nom(115), "Daycare Hack Milestone Reducer I");
  assert.equal(nom(145), "Bonus Quest Handin Progress I");
  assert.equal(nom(146), "Bonus Quest Handin Progress II");
  assert.equal(nom(105), "Gooder Idle Questing!");
  assert.equal(nom(106), "Another Gooder Idle Questing!");
  assert.equal(nom(19), "\"Fruit of Knowledge sucks, 1/5\"");
  assert.equal(nom(20), "\"Fruit of Knowledge STILL sucks, 1/5\"");
  const cartes = readFileSync("cloudflare/src/idle-cards-v1.js", "utf8");
  for (const n of ["A / D Card Tier Up I", "Magic NGU Speed Card Tier Up II", "Energy NGU Speed Card Tier Up III"]) assert.ok(cartes.includes('name: "' + n + '"'), n);
  const fib = IDLE_PERKS_CATALOG_V1.find((p) => p.id === 94).effect;
  assert.ok(!/\d/.test(fib) && !/wiki|discord/i.test(fib), "le texte du perk 94 ne liste plus les paliers (règle n°2) et ne dit ni wiki ni Discord");
}

// ---------- interface ----------
const document = creerDocument();
const actions = [];
const stock = {};
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
  localStorage: { getItem: (k) => (k in stock ? stock[k] : null), setItem: (k, v) => { stock[k] = String(v); }, removeItem: (k) => { delete stock[k]; } },
  console, setTimeout, setInterval: () => 0, fetch: () => new Promise(() => {})
};
fenetre.window = fenetre;
chargerPreact(fenetre);
chargerPont(fenetre);
vm.runInNewContext(readFileSync("cloudflare/public/modules/morph-v1.js", "utf8"), fenetre);
vm.runInNewContext(readFileSync("cloudflare/public/modules/itopod-scene-v1.js", "utf8"), fenetre, { filename: "itopod-scene-v1.js" });
vm.runInNewContext(readFileSync("cloudflare/public/modules/itopod-vdom-v1.js", "utf8"), fenetre, { filename: "itopod-vdom-v1.js" });
vm.runInNewContext(readFileSync("cloudflare/public/modules/itopod-perks-page-v1.js", "utf8"), fenetre, { filename: "itopod-perks-page-v1.js" });
const I = fenetre.__SOREAL_IDLE_ITOPOD_PERKS_PAGE_V1__, V = fenetre.__SOREAL_IDLE_VDOM_V1__, M = fenetre.__SOREAL_IDLE_MORPH_V1__;

function joueur({ pp = 10, levels = {}, defs, d = {}, achats = {}, difficulty = "normal" } = {}) {
  return {
    systemes: {
      systems: [
        { id: "tower", state: { unlocked: true, active: false, data: Object.assign({ floor: 3, kills: 14, killsOnFloor: 4, highestFloor: 5, optimalFloor: 4, startFloor: null, endFloor: null, ppProgress: 1000, hitsParKill: 2 }, d) } },
        { id: "perks", state: { unlocked: true, data: { levels } } }
      ],
      difficulty, currencies: { pp }, consommables: { reserve: { bluePills: 0 }, pilulesActives: false }, selloutShop: { purchases: achats },
      perkDefinitions: defs || [
        { id: 30, name: "Trente", cap: 5, cost: 7, effect: "e30" },
        { id: 4, name: "Quatre", cap: 3, cost: 2, effect: "e4" },
        { id: 12, name: "Douze", cap: 10, cost: 1, effect: "e12" },
        { id: 20, name: "Vingt", cap: 2, cost: 100, effect: "e20", diff: 1 }
      ]
    }
  };
}
const racine = document.createElement("div");
racine.className = "soreal-idle-page-root-v28";
document.body.appendChild(racine);
function dessiner(j) { etatJoueur = j; I.pageItopodIdleV1_(j); M.morpherHtml(racine, I.pageItopodIdleV1_(j)); V.appliquer(); }
const noms = () => [...racine.querySelectorAll(".pk-nom")].map((n) => n.textContent);

// 4. ordre : indices croissants malgré un tableau désordonné
dessiner(joueur({ levels: { 4: 3 } }));
assert.deepEqual(noms(), ["Quatre", "Douze", "Vingt", "Trente"], "ordre croissant des indices (4, 12, 20, 30)");
// tris du jeu : coût de base (croissant) et coût total restant ((plafond - niveau) x coût)
fenetre.__perkFiltrerIdleV1__(null, null, null, "base");
assert.deepEqual(noms(), ["Douze", "Quatre", "Trente", "Vingt"], "tri par coût de base : 1, 2, 7, 100");
fenetre.__perkFiltrerIdleV1__(null, null, null, "total");
assert.deepEqual(noms(), ["Quatre", "Douze", "Trente", "Vingt"], "tri par coût total : Quatre 0 (au max), Douze 10, Trente 35, Vingt 200");
assert.equal(JSON.parse(stock.soreal_idle_perks_reglages_v1).tri, "total", "réglage rangé dans localStorage (lié au compte, règle n°6)");
fenetre.__perkFiltrerIdleV1__(null, null, null, "id");

// 5. filtres du jeu
fenetre.__perkFiltrerIdleV1__(null, true, null);
assert.deepEqual(noms(), ["Quatre", "Douze", "Trente"], "Abordables = coût <= PP (10), le perk au maximum (Quatre) reste, comme filterAffordable du jeu");
fenetre.__perkFiltrerIdleV1__(null, null, true);
assert.deepEqual(noms(), ["Douze", "Trente"], "+ Masquer les maximums (filterNotMax)");
fenetre.__perkFiltrerIdleV1__(null, false, null);
assert.deepEqual(noms(), ["Douze", "Vingt", "Trente"], "maximums masqués seuls");
assert.equal(JSON.parse(stock.soreal_idle_perks_reglages_v1).nonMax, true);
fenetre.__perkFiltrerIdleV1__(null, false, false);
assert.equal(noms().length, 4);
for (const cle of Object.keys(stock)) assert.ok(/^soreal_idle_/.test(cle), "préférence liée au compte : clé soreal_idle_*");

// 9. mention de difficulté seulement sur un perk Evil/Sadistic (déjà listé, donc accessible)
assert.equal(racine.querySelectorAll(".pk-difficulte").length, 1);
assert.equal(racine.querySelector(".pk-difficulte").textContent, "ATOUT DE DIFFICULTÉ MALÉFIQUE");

// 3. bouton « Tout » et clic droit
actions.length = 0;
evenement(racine.querySelector(".pk-tout"), "click");
assert.deepEqual(JSON.parse(JSON.stringify(actions)), [{ action: "buyPerkMax", perkId: 12 }], "Quatre est au maximum (pas de bouton) : le premier « Tout » est celui de Douze");

// 6. Fibonacci : paliers atteints + un seul « ?????? »
const fibDefs = [{ id: 94, name: "The Fibonacci Perk", cap: 1597, cost: 500, effect: "texte" }];
dessiner(joueur({ pp: 0, defs: fibDefs, levels: { 94: 0 } }));
let lignes = [...racine.querySelectorAll(".pk-paliers div")].map((n) => n.textContent);
assert.deepEqual(lignes, ["Niveau 1 : ??????"], "niveau 0 : seulement le prochain palier, masqué");
dessiner(joueur({ pp: 0, defs: fibDefs, levels: { 94: 4 } }));
lignes = [...racine.querySelectorAll(".pk-paliers div")].map((n) => n.textContent);
assert.equal(lignes.length, 4, "paliers 1, 2, 3 atteints + le 5 masqué : " + lignes.join(" | "));
assert.ok(lignes[2].startsWith("Niveau 3 : ") && !lignes[2].includes("?"), "le palier 3 (oublié avant) est listé");
assert.equal(lignes[3], "Niveau 5 : ??????");
assert.ok(!lignes.join("").includes("Niveau 8"), "jamais la suite ni le total");
dessiner(joueur({ pp: 0, defs: fibDefs, levels: { 94: 1597 } }));
lignes = [...racine.querySelectorAll(".pk-paliers div")].map((n) => n.textContent);
assert.equal(lignes.length, 16, "tous atteints : seize paliers, dont 233 et 377 oubliés avant");
assert.ok(!lignes.join("").includes("??????"));
// le serveur ne liste que l'accessible : pas de perk Fibonacci, pas de bloc
dessiner(joueur());
assert.equal(racine.querySelectorAll(".pk-paliers").length, 0);

// 8. sous-titre : base du serveur
const sous = () => racine.querySelector(".soreal-idle-page-sub-v28").textContent;
dessiner(joueur({ d: { ppBase: 2100 + 0 }, difficulty: "extreme" }));
assert.ok(sous().includes("PPP (2100 + le numéro"), "d.ppBase du serveur : " + sous());
dessiner(joueur({ difficulty: "difficile" }));
assert.ok(sous().includes("PPP (700 + le numéro"), "repli sur la base de la difficulté sans d.ppBase");

// 7. PP gagnés au total : seulement quand le serveur l'envoie et > 0
dessiner(joueur());
assert.equal(racine.querySelectorAll(".itp-tuile").length, 6, "pas de tuile sans lifetimePp");
dessiner(joueur({ d: { lifetimePp: 42 } }));
assert.equal(racine.querySelectorAll(".itp-tuile").length, 7);
assert.ok([...racine.querySelectorAll(".itp-tuile")].some((t) => t.textContent.includes("PP gagnés au total") && t.textContent.includes("42")));

// 11. Max, Optimal, interrupteurs
dessiner(joueur());
const boutons = [...racine.querySelectorAll(".itp-montee .itp-bouton")];
const parTexte = (t) => boutons.find((b) => b.textContent.startsWith(t));
assert.ok(parTexte("Max") && parTexte("Optimal") && !parTexte("Auto"), "Max et Optimal (ex-Auto)");
actions.length = 0;
evenement(parTexte("Max"), "click");
evenement(parTexte("Optimal"), "click");
assert.deepEqual(JSON.parse(JSON.stringify(actions)), [{ action: "towerMaxFloor" }, { action: "towerFloors", auto: true }]);
assert.ok(!boutons.some((b) => b.textContent.includes("Lazy ITOPOD")), "Floor Shifter non acheté : aucun interrupteur (règle n°2)");
dessiner(joueur({ achats: { lazyItopodFloorShifter: 1 }, d: { shifterOn: false, idleMode: true } }));
const b2 = [...racine.querySelectorAll(".itp-montee .itp-bouton")];
const shifter = b2.find((b) => b.textContent.includes("Lazy ITOPOD Floor Shifter"));
assert.ok(shifter, "interrupteur du Floor Shifter (acheté)");
assert.ok(!b2.some((b) => b.textContent.includes("Idle Mode")), "le bouton Idle Mode n'existe plus (Norman, 2026-11-22 : aucune utilité)");
assert.ok(shifter.textContent.includes("désactivé"));
actions.length = 0;
evenement(shifter, "click");
assert.deepEqual(JSON.parse(JSON.stringify(actions)), [{ action: "towerShifter", enabled: true }]);

// les actions existent côté moteur
const actionsSrc = readFileSync("cloudflare/src/idle-ngu-actions.js", "utf8");
for (const a of ["towerMaxFloor", "towerShifter", "buyPerkMax", "towerFloors"]) assert.ok(actionsSrc.includes('"' + a + '"'), "action moteur " + a);

console.log("idle-atouts-boutique-alignement-v1: OK");
