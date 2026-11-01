import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { lirePagesMeta } from "./_meta-pages.mjs";
import { normalizeIdleNguState, idleNguSnapshot } from "../src/idle-ngu-progression.js";
import { IDLE_NGU_EXP_SHOP_V1 } from "../src/idle-ngu-actions.js";

/*
 * Norman (2026-11-01) : « pour le magasin, il faut toujours un petit i pour les objets du genre Garderie. Car les gens l'achètent sans savoir ce
 * que ça fait. Un petit i qui explique brièvement ce que ça fera, sans calcul ni rien d'autre. »
 * Boutique EXP : chaque article de déblocage porte un « i » dans l'en-tête de sa carte (avant et après l'achat) ; la phrase ne contient ni chiffre,
 * ni « wiki » ; aucun « i » n'existe pour un article que le joueur ne voit pas (règle n°2) ; l'état ouvert survit à un redessin (règle n°4).
 */
const numberFormat = { window: {} };
vm.runInNewContext(readFileSync("cloudflare/public/modules/number-format-v1.js", "utf8"), numberFormat);
const grand = numberFormat.window.__SOREAL_IDLE_NUMBER_FORMAT_V1__.grandNombre;
const store = {};
const localStorage = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } };
let etat = null;
const window = {
  __SOREAL_IDLE_META_HOST_V130__: {
    getIdleEtat() { return etat; },
    rendreIdleEtat_() {},
    idleHtml_: (v) => String(v == null ? "" : v),
    idleNombre_: (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; },
    idleEntier_: (v) => Math.max(0, Math.floor(Number(v) || 0)),
    formatGrandNombreIdleV70_: (v, d) => grand(v, d),
    entetePageIdleV28_: (titre, sous) => "<h1>" + titre + "</h1><p>" + (sous || "") + "</p>",
    appelerProgressionIdleCloudflareV1_() {}
  },
  __SOREAL_IDLE_TEXT_HELPERS_V1__: { libelleRessource: (id) => ({ energy: "Energy", magic: "Magic", r3: "Resource 3" })[id] || String(id) },
  __SOREAL_IDLE_TEXT_TRANSFORMS_V1__: { attr: (v) => String(v == null ? "" : v) },
  document: { getElementById() { return null; } }
};
vm.runInNewContext(readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8") + lirePagesMeta(), { window, document: window.document, localStorage, SOREAL_SESSION: null, Math, Number, Object, Array, Boolean, String, JSON, Date, Set, Map, Promise, console, setTimeout, clearTimeout });
const api = window.__SOREAL_IDLE_META_V130__;
const I = window.__SOREAL_IDLE_BOUTIQUE_INFO_I_V1__;
assert.ok(I && typeof I.bouton === "function", "module du « i » chargé");

// 1. Chaque article de déblocage a une phrase ; aucun chiffre, aucun « wiki », aucun nom de set.
const DEBLOCAGES = ["daycareSlot1", "daycareSlot2", "daycareSlot3", "diggerSlot", "beardSlot", "macguffinSlot1", "macguffinSlot2", "accessorySlot1", "accessorySlot2", "inventorySpace", "basicLootFilter", "autoMerge", "sortInventory", "doubleTap", "tripleTap", "boostRecycling", "loadoutSlots", "loadoutSlot3", "inventoryMergeSlot", "trainingAutoAdvance", "syncBasicTraining", "syncWandoos", "menuAnimations", "customInput1", "customInput2", "customInput3", "customInput4"];
for (const id of DEBLOCAGES) {
  assert.ok(IDLE_NGU_EXP_SHOP_V1[id], id + " existe dans la boutique EXP");
  const t = I.texte({ id });
  assert.ok(t.length > 10, id + " : une phrase");
}
const fruits = Object.entries(IDLE_NGU_EXP_SHOP_V1).filter(([, d]) => d.yggFruit);
assert.ok(fruits.length > 0);
for (const [id, d] of fruits) assert.ok(I.texte({ id, yggFruit: d.yggFruit }).length > 10, id + " : phrase des fruits");
// Les articles qui ne débloquent rien (statistiques) n'ont pas de « i ».
for (const id of ["adventurePower", "adventureToughness", "adventureHp", "adventureRegen"]) assert.equal(I.bouton({ id }), "", id + " : pas de « i »");
const toutes = Object.values(I.TEXTES).concat([I.TEXTE_FRUIT, I.LIBELLE]);
for (const t of toutes) {
  assert.ok(!/\d/.test(t), "aucun chiffre : « " + t + " »");
  assert.ok(!/wiki/i.test(t), "pas de « wiki » : « " + t + " »");
  assert.ok(!/boss|verrouill|set /i.test(t), "rien de verrouillé ni de boss : « " + t + " »");
}
assert.deepEqual(Object.keys(I.TEXTES).sort(), DEBLOCAGES.slice().sort(), "la liste du test et celle du module sont les mêmes");

// 2. Traduction anglaise de chaque texte affiché.
const dico = JSON.parse(readFileSync("cloudflare/public/modules/traduction-anglais-dict-v1.json", "utf8"));
for (const t of toutes) assert.ok(typeof dico[t] === "string" && dico[t].length > 3, "traduction anglaise : « " + t + " »");

// 3. Rendu : le « i » est sur la carte d'un article visible, avant l'achat, et après l'achat.
const ctx = { bosses: 100 };
const etatJoueur = normalizeIdleNguState({}, ctx, 1_000_000);
etatJoueur.currencies.experience = 500;
for (const id of ["bloodMagic", "hacks", "wandoos", "diggers", "beards", "daycare", "macguffins", "yggdrasil"]) etatJoueur.systems[id].unlocked = true;
const j = { systemes: idleNguSnapshot(etatJoueur, ctx, 2_000_000) };
etat = j;
const TOUS = ["debuts", "toc", "slots"];
const pageDe = (onglet, joueur) => { window.__ongletExpShopIdleV1__(onglet); return api.pageSpendExpIdleV1_(joueur); };
const carteDe = (html, id) => {
  const i = html.indexOf("__acheterExpShopIdleV1__('" + id + "'");
  assert.ok(i > 0, id + " visible");
  const debut = html.lastIndexOf('<div class="soreal-idle-exp-stat-v210">', i);
  return html.slice(debut, i);
};
let html = TOUS.map((o) => pageDe(o, j)).join("");
for (const id of ["daycareSlot1", "daycareSlot2", "diggerSlot", "beardSlot", "macguffinSlot1", "accessorySlot1", "basicLootFilter", "autoMerge", "customInput1", "syncWandoos"]) {
  const carte = carteDe(html, id);
  assert.match(carte, /class="boutique-i-v1"/, id + " : bouton « i » dans l'en-tête");
  assert.ok(carte.indexOf("boutique-i-v1") < carte.indexOf("soreal-idle-exp-current-v211"), id + " : le « i » est dans la partie titre de l'en-tête");
  assert.match(carte, /class="boutique-i-bulle-v1" /, id + " : phrase présente (repliée)");
}
// Les fruits d'Yggdrasil.
assert.match(html, /<div class="soreal-idle-exp-resource-v210">🌱 Yggdrasil : Auto-Activate<\/div>/);
assert.ok((html.match(/boutique-i-v1"/g) || []).length >= 15, "des « i » sur beaucoup d'articles");

// 4. Après l'achat (carte « maximum atteint ») le « i » reste.
{
  const fini = JSON.parse(JSON.stringify(j));
  const art = fini.systemes.expShop.find((x) => x.id === "daycareSlot1");
  art.purchased = 1; art.nextCost = null;
  const h = pageDe("debuts", fini);
  const i = h.indexOf("Maximum atteint");
  assert.ok(i > 0);
  assert.match(h, /boutique-i-v1/);
  const carte = h.slice(h.lastIndexOf('<div class="soreal-idle-exp-stat-v210">', i), i);
  assert.match(carte, /class="boutique-i-v1"/, "le « i » reste après l'achat");
}

// 5. Redessin : l'état ouvert est relu au rendu (aucune fermeture visible).
{
  const bascule = (cleCarte, ouvert) => ({ classe: ouvert, cle: cleCarte });
  const classes = new Set();
  const bulle = { classList: { toggle: (c, v) => { v ? classes.add("b:" + c) : classes.delete("b:" + c); } } };
  const btn = {
    getAttribute: (n) => (n === "data-i-cle" ? "daycareSlot1" : null),
    setAttribute() {},
    classList: { toggle: (c, v) => { v ? classes.add("btn:" + c) : classes.delete("btn:" + c); } },
    closest: () => ({ querySelector: () => bulle })
  };
  void bascule;
  window.__boutiqueInfoIV1__(btn);
  assert.ok(classes.has("btn:ouvert") && classes.has("b:ouvert"), "le clic ouvre");
  const h = pageDe("debuts", j);
  const carte = carteDe(h, "daycareSlot1");
  assert.match(carte, /class="boutique-i-v1 ouvert"[^>]*aria-expanded="true"/, "le rendu suivant garde le « i » ouvert");
  assert.match(carte, /class="boutique-i-bulle-v1 ouvert"/, "le rendu suivant garde la phrase ouverte");
  window.__boutiqueInfoIV1__(btn);
  assert.ok(!classes.has("btn:ouvert") && !classes.has("b:ouvert"), "un second clic referme");
  assert.match(carteDe(pageDe("debuts", j), "daycareSlot1"), /class="boutique-i-v1"/);
}

// 6. Anti-spoil : un joueur qui n'a rien débloqué ne voit aucun « i » d'un article masqué.
{
  const c0 = { bosses: 0 };
  const neuf = normalizeIdleNguState({}, c0, 1_000_000);
  neuf.currencies.experience = 500;
  const j0 = { systemes: idleNguSnapshot(neuf, c0, 2_000_000) };
  etat = j0;
  let tout = "";
  for (const o of ["debuts", "toc", "energy", "magic", "r3", "aventure", "slots"]) tout += pageDe(o, j0);
  /* Une phrase n'est dans la page que si l'article lui-même est dans la liste visible envoyée par le serveur. */
  const visiblesIds = new Set(j0.systemes.expShop.map((x) => x.id));
  for (const [id, phrase] of Object.entries(I.TEXTES)) assert.equal(tout.includes(phrase), visiblesIds.has(id) && tout.includes("__acheterExpShopIdleV1__('" + id + "'"), "boss 0 : phrase de " + id + " seulement si l'article est visible");
  assert.ok(!tout.includes(I.TEXTE_FRUIT), "boss 0 : aucun fruit d'Yggdrasil");
  for (const id of ["daycareSlot2", "diggerSlot", "beardSlot", "macguffinSlot1", "basicLootFilter"]) assert.ok(!tout.includes(I.TEXTES[id]), "boss 0 : " + id + " masqué");
  assert.ok(!/Garderie/.test(tout), "boss 0 : rien sur la Garderie");
  const c4 = { bosses: 4 };
  const quatre = normalizeIdleNguState({}, c4, 1_000_000);
  quatre.currencies.experience = 500;
  const j4 = { systemes: idleNguSnapshot(quatre, c4, 2_000_000) };
  etat = j4;
  tout = ""; for (const o of ["debuts", "toc", "slots"]) tout += pageDe(o, j4);
  for (const mot of ["Digger", "Beard", "MacGuffin", "Yggdrasil"]) assert.ok(!tout.includes(mot), "boss 4 : « " + mot + " » reste masqué");
  assert.match(tout, /boutique-i-v1/, "boss 4 : les articles visibles ont leur « i »");
  etat = j;
}

// 7. Le module est chargé avant la page, et la page n'appelle le « i » que pour les cartes qu'elle dessine.
const index = readFileSync("cloudflare/public/index.html", "utf8");
assert.ok(index.indexOf("/modules/boutique-info-i-v1.js") > 0 && index.indexOf("/modules/boutique-info-i-v1.js") < index.indexOf("/modules/boutique-exp-page-v1.js"), "script chargé avant la page");
console.log("idle-boutique-info-i-v1: OK");
