import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Garderie (Norman, 2026-11-01) : SIX récipients par apparence du chat, de plus en plus beaux (le rang = la place n° k de l'étagère ; la garderie a 6 places au maximum).
 */
const pub = (f) => readFileSync("cloudflare/public/" + f, "utf8");
const SRC = ["garderie-bocaux-rangs-v1.js", "garderie-bocaux-formes-a-v1.js", "garderie-bocaux-formes-b-v1.js", "garderie-bocaux-formes-c-v1.js", "garderie-bocaux-effets-v1.js", "garderie-bocaux-formes-v1.js"];
const fakeDoc = { head: { appendChild() {} }, getElementById() { return null; }, createElement() { return { id: "", textContent: "" }; } };
const win = {};
const ctx = { window: win, document: fakeDoc, encodeURIComponent };
for (const f of SRC) vm.runInNewContext(pub("modules/" + f), ctx);
const F = win.__SOREAL_IDLE_GARDERIE_FORMES_V1__;
const RG = win.__SOREAL_IDLE_GARDERIE_RANGS_V1__;

/* 1. Le nombre maximal de places est celui du moteur : 6 (rang 1 à 6). */
const moteur = readFileSync("cloudflare/src/idle-daycare-v1.js", "utf8");
assert.ok(/IDLE_DAYCARE_MAX_SLOTS_V1 = 6/.test(moteur), "6 places au maximum");
const skins = ["defaut", "noeud", "dore", "chauvesouris", "arcenciel", "fibonacci", "matrix", "tchernobyl", "pirate", "noel", "nega"];
assert.deepEqual(Array.from(Object.keys(RG.skins)).sort(), skins.slice().sort(), "les rangs 2 à 6 existent pour les 11 apparences");

/* 2. Six formes DIFFÉRENTES par apparence (rang 1 = forme d'avant, inchangée ; le défaut garde le bocal classique), de plus en plus riches. */
const FORME_1_AVANT = {
  noeud: "M41 16H59V31C59 37 97 38 97 62V136Q97 154 79 154H21Q3 154 3 136V62C3 38 41 37 41 31Z",
  dore: "M23 24H77L98 144Q99 154 89 154H11Q1 154 2 144Z",
  chauvesouris: "M2 32H98V46H90C100 72 100 120 82 142Q76 152 66 154H34Q24 152 18 142C0 120 0 72 10 46H2Z",
  nega: "M36 12H64L96 48V120L70 154H30L4 120V48Z"
};
for (const [id, d] of Object.entries(FORME_1_AVANT)) assert.equal(F.formes[id].d, d, id + " : la forme n°1 est inchangée");
assert.ok(!("defaut" in F.formes), "défaut : le rang 1 reste le bocal classique");
for (const id of skins) {
  const L = RG.skins[id];
  assert.equal(L.length, 5, id + " : 5 nouveaux récipients (rangs 2 à 6)");
  const tous = (F.formes[id] ? [F.formes[id]] : []).concat(L);
  assert.equal(new Set(L.map((f) => f.d)).size, 5, id + " : silhouettes toutes différentes");
  assert.equal(new Set(L.map((f) => f.nom)).size, 5, id + " : noms différents");
  if (F.formes[id]) assert.ok(!L.some((f) => f.d === F.formes[id].d), id + " : aucune ne reprend le rang 1");
  for (const f of L) {
    assert.ok(f.d.startsWith("M") && f.d.endsWith("Z"), id + "/" + f.nom + " : silhouette fermée");
    assert.ok(f.hautObj < f.basObj && f.ico > 0, id + "/" + f.nom + " : zone de l'objet");
    assert.ok(!/NaN|undefined/.test(f.d + f.deco), id + "/" + f.nom + " : dessin sans valeur invalide");
  }
  /* la richesse (longueur du cadre dessiné) du dernier est supérieure à celle du premier nouveau */
  assert.ok(L[4].deco.length > L[0].deco.length, id + " : le n°6 est plus riche que le n°2");
}
/* Halloween : le n°6 est le crâne en cristal, avec citrouille, chauve-souris, fiole, tombe, chaudron. */
assert.deepEqual(Array.from(RG.skins.chauvesouris.map((f) => f.nom)), ["Fiole de poison", "Pierre tombale", "Citrouille", "Chauve-souris", "Crâne de cristal"]);
assert.ok(/gemme|<path d="M50 /.test(RG.skins.chauvesouris[4].deco) && RG.skins.chauvesouris[4].deco.includes("#ff5af0"), "crâne : gemmes");
/* Coquet : flacons de parfum de luxe croissant. */
assert.deepEqual(Array.from(RG.skins.noeud.map((f) => f.nom)), ["Flacon à pulvérisateur", "Vaporisateur à poire", "Carafe de parfum", "Flacon facetté à nœud", "Flacon de diamant à nœud"]);

/* 3. Règles CSS : chaque rang a sa règle de vitre ciblée par data-rang, le liquide n'est pas touché, pas de filtre ni d'animation. */
const css = F.css();
for (const id of skins) for (let r = 2; r <= 6; r += 1) {
  assert.ok(css.includes('.gd-etagere[data-skin="' + id + '"] .gd-pot[data-rang="' + r + '"] .gd-verre{'), id + " rang " + r + " : règle de vitre");
}
assert.ok(!/\.gd-liq\s*\{[^}]*transform/.test(css) && !css.includes("translateY"), "le calcul du liquide (transform) n'est pas modifié");
assert.ok(!/filter\s*:|drop-shadow|blur\(/.test(css), "aucun filtre coûteux");
/* les animations n'existent que dans les effets (boule de Noël, globe à neige) : les formes elles-mêmes n'en ont aucune */
assert.ok(!/animation|@keyframes/.test(css.slice(0, css.indexOf('.gd-etagere[data-skin="matrix"] .gd-pot[data-rang="1"]{--gd-liq'))), "aucune animation hors effets");
assert.ok(css.includes("-webkit-mask:url(") && css.includes("mask:url("), "silhouette par masque (le liquide reste contenu)");

/* 4. Pas de nouveau !important ; aucun émoji ; jamais « wiki ». */
for (const f of SRC) {
  const src = pub("modules/" + f);
  assert.ok(!/!important/.test(src), f + " : aucun !important");
  assert.ok(!/[\u{1F300}-\u{1FAFF}☀-➿]/u.test(src), f + " : aucun émoji (dessins SVG)");
  assert.ok(!/wiki/i.test(src.replace(/^\/\*[\s\S]*?\*\//, "")), f + " : jamais « wiki »");
}

/* 5. Rang = place : la page pose data-rang (1 à 6) sur chaque bocal rendu (occupé ou libre) ; la vue zoom le reprend ; aucun bocal non possédé n'est rendu. */
const daycare = pub("modules/daycare-page-v1.js"), zoom = pub("modules/garderie-zoom-v1.js");
assert.equal((daycare.match(/data-rang="'\+\(i\+1\)\+'"/g) || []).length, 2, "bocal occupé et bocal libre portent leur rang");
assert.ok(zoom.includes("data-rang"), "la vue zoom montre le même récipient en grand");
assert.ok(daycare.includes("const total=Math.min(PLACES.length,Math.max(H.idleEntier_(d.slots),objets.length))"), "seules les places possédées sont rendues");
assert.ok(daycare.includes("for(let i=0;i<libres;i+=1)"), "les places libres possédées seulement");
assert.ok(!/possedes|skins\.actif/.test(SRC.slice(0, 5).map((f) => pub("modules/" + f).replace(/\/\*[\s\S]*?\*\//g, "")).join("")), "aucune lecture des apparences ou places non possédées dans les dessins");

/* 6. Chargement : registre, a, b, c AVANT le module de formes, lui-même avant la page. */
const html = pub("index.html");
const ordre = SRC.concat(["daycare-page-v1.js", "garderie-zoom-v1.js"]).map((f) => html.indexOf("/modules/" + f));
assert.ok(ordre.every((i) => i > 0) && ordre.every((v, i) => i === 0 || ordre[i - 1] < v), "ordre des scripts");
/* 7. Mouvement : la petite aide ne fait rien bouger (pas de minuterie, pas de Date). */
for (const f of SRC.slice(0, 5)) assert.ok(!/setInterval|setTimeout|requestAnimationFrame/.test(pub("modules/" + f)), f + " : aucune minuterie");
assert.equal(typeof RG.aide.gem, "function");
console.log("OK idle-garderie-six-bocaux-v1");
