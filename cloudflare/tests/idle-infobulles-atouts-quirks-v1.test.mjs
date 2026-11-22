import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { creerDocument, chargerPreact, chargerPont, evenement } from "./_faux-dom-vdom.mjs";
import { normalizeIdleNguState, applyIdleNguAction, idleNguSnapshot } from "../src/idle-ngu-progression.js";
import { IDLE_PERKS_CATALOG_V1, idleEntreeBonusAffichageV1 } from "../src/idle-perks-v1.js";
import { IDLE_QUIRKS_CATALOG_V1 } from "../src/idle-quirks-v1.js";

/*
 * Atouts et quirks : bonus actuel et bonus au niveau suivant (ItopodPerkController::showTooltip, BeastQuestPerkController::showTooltip, IL build 1260, 2026-11-22),
 * page Quirks avec les filtres de la page Atouts, bouton « Tout » (BeastQuestPerkController::tryLevelAll, action buyQuirkMax) et « Tu as X QP ».
 */

// ---------- serveur : valeurs ----------
{
  const p6 = IDLE_PERKS_CATALOG_V1.find((p) => p.id === 6);   // +1 % d'énergie par niveau, plafond 50
  assert.deepEqual(idleEntreeBonusAffichageV1(p6, 0), [0, 1, "%"]);
  assert.deepEqual(idleEntreeBonusAffichageV1(p6, 10), [10, 11, "%"], "niveau x effet par niveau");
  assert.deepEqual(idleEntreeBonusAffichageV1(p6, 50), [50, null, "%"], "au plafond : pas de niveau suivant");
  assert.deepEqual(idleEntreeBonusAffichageV1(IDLE_PERKS_CATALOG_V1.find((p) => p.id === 13), 3), [7.5, 10, "%"], "pas de bruit de flottant (2,5 x 3)");
  const fib = IDLE_PERKS_CATALOG_V1.find((p) => Array.isArray(p.fibonacciMilestones));
  assert.equal(idleEntreeBonusAffichageV1(fib, 5), null, "paliers de Fibonacci : rien d'inventé");
  const q7 = IDLE_QUIRKS_CATALOG_V1.find((q) => q.id === 7);   // 1 % d'Attaque/Défense par niveau
  assert.deepEqual(idleEntreeBonusAffichageV1(q7, 20), [20, 21, "%"]);
}

// ---------- serveur : snapshot + buyQuirkMax ----------
const ctx = { bosses: 300 };
const etat = (qp) => {
  const s = normalizeIdleNguState({ difficulty: "normal" }, ctx, 0);
  s.systems.perks.unlocked = true;
  s.systems.quirks.unlocked = true;
  s.currencies.qp = qp;
  s.currencies.pp = 100;
  s.systems.perks.data.levels[6] = 10;
  return s;
};
{
  const snap = idleNguSnapshot(etat(0), ctx, 1000);
  assert.deepEqual(snap.perkBonusAffichage[6], [10, 11, "%"], "le snapshot envoie le bonus actuel et suivant de l'atout 6");
  assert.ok(snap.quirkBonusAffichage[7], "et celui du quirk 7");
  for (const id of Object.keys(snap.perkBonusAffichage)) assert.ok(snap.perkDefinitions.some((d) => String(d.id) === id), "seulement des atouts déjà accessibles (règle n°2) : " + id);
  const ferme = normalizeIdleNguState({ difficulty: "normal" }, ctx, 0);
  const snapFerme = idleNguSnapshot(ferme, ctx, 1000);
  assert.equal(Object.keys(snapFerme.perkBonusAffichage).length, 0, "atouts fermés : aucune valeur");
  assert.equal(Object.keys(snapFerme.quirkBonusAffichage).length, 0, "quirks fermés : aucune valeur");

  // quirk 7 : coût 25 QP, plafond 1000 ; 130 QP = 5 niveaux (125 QP)
  const { state: a, result: ra } = applyIdleNguAction(etat(130), { action: "buyQuirkMax", quirkId: 7 }, ctx, 1000);
  assert.equal(a.systems.quirks.data.levels[7], 5);
  assert.equal(a.currencies.qp, 5);
  assert.equal(ra.bought, 5);
  assert.throws(() => applyIdleNguAction(etat(10), { action: "buyQuirkMax", quirkId: 7 }, ctx, 1000), /MONNAIE_INSUFFISANTE/);
  assert.throws(() => applyIdleNguAction(etat(10), { action: "buyQuirkMax", quirkId: 9999 }, ctx, 1000), /QUIRK_INTROUVABLE/);
  // quirk 0 : coût 100, plafond 1 : un niveau, puis « au maximum »
  const { state: b } = applyIdleNguAction(etat(500), { action: "buyQuirkMax", quirkId: 0 }, ctx, 1000);
  assert.equal(b.systems.quirks.data.levels[0], 1);
  assert.equal(b.currencies.qp, 400);
  assert.throws(() => applyIdleNguAction(b, { action: "buyQuirkMax", quirkId: 0 }, ctx, 1000), /QUIRK_AU_MAXIMUM/);
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
    idleHtml_: (v) => String(v),
    entetePageIdleV28_: (t, s) => "<h1>" + t + "</h1><p class=\"soreal-idle-page-sub-v28\">" + s + "</p>",
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

const racine = document.createElement("div");
racine.className = "soreal-idle-page-root-v28";
document.body.appendChild(racine);
function dessinerQuirks(j) { etatJoueur = j; M.morpherHtml(racine, I.pageQuirksIdleV1_(j)); V.appliquer(); }
function dessinerAtouts(j) { etatJoueur = j; M.morpherHtml(racine, I.pageItopodIdleV1_(j)); V.appliquer(); }
const noms = () => [...racine.querySelectorAll(".pk-nom")].map((n) => n.textContent);

function joueur({ pp = 10, qp = 60, levels = {}, qlevels = {}, bonus = {}, qbonus = {} } = {}) {
  return {
    systemes: {
      systems: [
        { id: "tower", state: { unlocked: true, active: false, data: { floor: 3, kills: 14, killsOnFloor: 4, highestFloor: 5, optimalFloor: 4, startFloor: null, endFloor: null, ppProgress: 1000, hitsParKill: 2 } } },
        { id: "perks", state: { unlocked: true, data: { levels } } },
        { id: "quirks", state: { unlocked: true, data: { levels: qlevels } } }
      ],
      difficulty: "normal", currencies: { pp, qp }, consommables: { reserve: { bluePills: 0 }, pilulesActives: false }, selloutShop: { purchases: {} },
      perkDefinitions: [{ id: 6, name: "Six", cap: 50, cost: 1, effect: "e6" }, { id: 4, name: "Quatre", cap: 1, cost: 1, effect: "e4" }],
      quirkDefinitions: [
        { id: 30, name: "Trente", cap: 5, cost: 7, effect: "q30" },
        { id: 4, name: "Quatre", cap: 3, cost: 2, effect: "q4" },
        { id: 12, name: "Douze", cap: 10, cost: 1, effect: "q12" }
      ],
      perkBonusAffichage: bonus, quirkBonusAffichage: qbonus
    }
  };
}

// 1. atouts : lignes « Bonus actuel » et « Bonus du niveau suivant » (ou rien sans valeur du serveur ; pas de niveau suivant au plafond)
dessinerAtouts(joueur({ levels: { 6: 10 }, bonus: { 6: [10, 11, "%"] } }));
let lignes = [...racine.querySelectorAll(".pk-bonus div")].map((n) => n.textContent);
assert.deepEqual(lignes, ["Bonus actuel : 10 %", "Bonus du niveau suivant : 11 %"]);
assert.equal(racine.querySelectorAll(".pk-bonus").length, 1, "Quatre n'a pas de valeur du serveur : aucune ligne");
dessinerAtouts(joueur({ levels: { 6: 50 }, bonus: { 6: [50, null, "%"] } }));
lignes = [...racine.querySelectorAll(".pk-bonus div")].map((n) => n.textContent);
assert.deepEqual(lignes, ["Bonus actuel : 50 %"], "au plafond : pas de niveau suivant");

// 2. page Quirks : même boutique, coût en QP, filtres, tris, « Tout »
dessinerQuirks(joueur({ qlevels: { 4: 3 }, qbonus: { 12: [0, 1, "%"] } }));
assert.deepEqual(noms(), ["Quatre", "Douze", "Trente"], "ordre croissant des numéros (4, 12, 30)");
assert.ok(racine.textContent.includes("QP disponibles") && racine.textContent.includes("60"), "« Tu as X QP »");
assert.ok(racine.textContent.includes("Bonus actuel : 0 %") && racine.textContent.includes("Bonus du niveau suivant : 1 %"), "bonus du quirk");
assert.ok([...racine.querySelectorAll(".pk-prix")].every((n) => n.textContent.includes("QP")), "coûts en QP");
assert.equal(racine.querySelectorAll(".pk-socle").length, 0, "pas d'image de quirk (aucune n'existe)");
fenetre.__quirkFiltrerIdleV1__(null, null, null, "base");
assert.deepEqual(noms(), ["Douze", "Quatre", "Trente"], "tri par coût de base : 1, 2, 7");
fenetre.__quirkFiltrerIdleV1__(null, null, null, "total");
assert.deepEqual(noms(), ["Quatre", "Douze", "Trente"], "tri par coût total : Quatre au max 0, Douze 10, Trente 35");
assert.equal(JSON.parse(stock.soreal_idle_quirks_reglages_v1).tri, "total", "réglage lié au compte (règle n°6)");
fenetre.__quirkFiltrerIdleV1__(null, null, null, "id");
fenetre.__quirkFiltrerIdleV1__(null, true, null);
dessinerQuirks(joueur({ qp: 5, qlevels: { 4: 3 } }));
assert.deepEqual(noms(), ["Quatre", "Douze"], "Abordables : coût <= 5 QP, le quirk au maximum reste (comme les atouts)");
fenetre.__quirkFiltrerIdleV1__(null, null, true);
assert.deepEqual(noms(), ["Douze"], "+ Masquer les maximums");
fenetre.__quirkFiltrerIdleV1__(null, false, false);
for (const cle of Object.keys(stock)) assert.ok(/^soreal_idle_/.test(cle));
// recherche
fenetre.__quirkFiltrerIdleV1__("q30");
assert.deepEqual(noms(), ["Trente"]);
fenetre.__quirkFiltrerIdleV1__("");
// bouton « Tout » : action buyQuirkMax ; achat à l'unité : buyQuirk
actions.length = 0;
evenement(racine.querySelector(".pk-tout"), "click");
assert.deepEqual(JSON.parse(JSON.stringify(actions)), [{ action: "buyQuirkMax", quirkId: 12 }], "Quatre est au maximum : le premier « Tout » est celui de Douze");
actions.length = 0;
evenement(racine.querySelector(".pk-acheter"), "click");
assert.deepEqual(JSON.parse(JSON.stringify(actions)), [{ action: "buyQuirk", quirkId: 12 }]);
// système verrouillé : rien (règle n°2)
const ferme = joueur();
ferme.systemes.systems[2].state.unlocked = false;
assert.ok(I.pageQuirksIdleV1_(ferme).includes("Rien à afficher"));
console.log("idle-infobulles-atouts-quirks-v1: OK");
