import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { normalizeIdleNguState, idleNguSnapshot } from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-09-24) : « Exp shop a trop de catégories. On s'y perd… Il y a des choses qu'on doit acheter très tôt du genre le filtre
 * à loot, mais il est perdu tout en bas. Un nouveau joueur ne le trouvera jamais. Je n'aime pas le blanc que tu as mis en fond.
 * Utilise le même bleu que dans la bannière "Boutique EXP". »
 */
const numberFormat = { window: {} };
vm.runInNewContext(readFileSync("cloudflare/public/modules/number-format-v1.js", "utf8"), numberFormat);
const grand = numberFormat.window.__SOREAL_IDLE_NUMBER_FORMAT_V1__.grandNombre;
let rendus = 0;
const store = {};
const localStorage = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } };
let etat = null;
const window = {
  __SOREAL_IDLE_META_HOST_V130__: {
    getIdleEtat() { return etat; },
    rendreIdleEtat_() { rendus += 1; },
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
vm.runInNewContext(readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8"), { window, document: window.document, localStorage, SOREAL_SESSION: null, Math, Number, Object, Array, Boolean, String, JSON, Date });
const api = window.__SOREAL_IDLE_META_V130__;

const ctx = { bosses: 100 };
const state = normalizeIdleNguState({}, ctx, 1_000_000);
state.currencies.experience = 500;
/* Joueur avancé : tous les systèmes concernés sont débloqués (le joueur qui n'a rien débloqué est testé plus bas). */
for (const id of ["bloodMagic", "hacks", "diggers", "beards", "daycare", "macguffins", "yggdrasil"]) state.systems[id].unlocked = true;
const snap = idleNguSnapshot(state, ctx, 2_000_000);
const j = { systemes: snap };
etat = j;

const page = (onglet) => { window.__ongletExpShopIdleV1__(onglet); return api.pageSpendExpIdleV1_(j); };
const TOUS = ["debuts", "energy", "magic", "r3", "aventure", "slots"];

// --- Onglet par défaut : Débuts, avec le filtre de butin tout en haut de la boutique (plus « perdu en bas ») ---
{
  delete store.soreal_idle_exp_onglet_v1;
  const html = page("debuts");
  assert.match(html, /À acheter tôt/);
  assert.match(html, /Filtre de butin basique/);
  assert.ok(html.indexOf("Filtre de butin basique") < html.indexOf("Auto Merge"), "ordre conseillé : du moins cher au plus cher");
  assert.match(html, /Débloque le filtre de butin/);
  for (const id of ["inventorySpace", "basicLootFilter", "boostRecycling", "autoMerge", "daycareSlot1", "trainingAutoAdvance"]) {
    assert.ok(html.includes("__acheterExpShopIdleV1__('" + id + "'"), "Débuts contient " + id);
  }
  // 500 EXP : pastille = nombre d'achats de Débuts abordables
  assert.match(html, /soreal-idle-exp-pastille-v212" title="Achats abordables">[1-9]/);
}

// --- Chaque achat du catalogue apparaît dans UN SEUL onglet ; un seul onglet est affiché à la fois ---
{
  const catalogue = snap.expShop.filter((it) => !it.yggFruit).map((it) => it.id);
  assert.ok(catalogue.includes("basicLootFilter") && catalogue.length > 15);
  const pages = Object.fromEntries(TOUS.map((o) => [o, page(o)]));
  for (const id of catalogue) {
    const ou = TOUS.filter((o) => pages[o].includes("__acheterExpShopIdleV1__('" + id + "'"));
    assert.equal(ou.length, 1, id + " doit être dans exactement un onglet : " + ou.join(","));
  }
  assert.ok(pages.aventure.includes("Rich Jerks") && pages.aventure.includes("adventurePower"));
  assert.ok(!pages.debuts.includes("Rich Jerks") && !pages.slots.includes("adventurePower"));
  assert.ok(pages.slots.includes("🌱 Yggdrasil : Auto-Activate"));
  // Les statistiques Energy (Vitesse, Puissance, Plafond, Barres) sont dans leur onglet, pas dans les autres
  assert.ok(pages.energy.includes("Vitesse") && pages.energy.includes("Barres"));
  assert.ok(!pages.debuts.includes("Vitesse") && !pages.slots.includes("Vitesse"));
}

// --- Navigation : les onglets s'affichent, l'actif est marqué, le choix est mémorisé et la page est redessinée ---
{
  const avant = rendus;
  const html = page("energy");
  assert.equal(rendus, avant + 1, "changer d'onglet redessine la page");
  assert.equal(store.soreal_idle_exp_onglet_v1, "energy");
  for (const nom of ["🚀 Débuts", "⚡ Énergie", "✨ Magie", "🧪 Ressource 3", "⚔️ Aventure", "🎒 Slots & options"]) assert.ok(html.includes(nom), nom);
  assert.equal((html.match(/soreal-idle-exp-tab-v212 actif/g) || []).length, 1);
  window.__ongletExpShopIdleV1__("inconnu");
  assert.equal(store.soreal_idle_exp_onglet_v1, "energy", "onglet inconnu ignoré");
}

// --- Couleurs : plus de fond blanc, le bleu de la bannière (couleur du menu) est utilisé ---
{
  const html = page("debuts");
  const css = html.slice(html.indexOf("<style>"), html.indexOf("</style>"));
  assert.ok(css.includes("var(--nav-color,#0891b2)"), "bleu de la bannière (couleur du menu Boutique EXP)");
  assert.ok(css.includes("60%,#0b1020") && css.includes("38%,#1a2340"), "mêmes dégradés que la bannière (page-head)");
  assert.ok(!/background:#fff[;}]/i.test(css) && !/background:#(?:f[0-9a-f]{2}|f[0-9a-f]{5})[;}]/i.test(css.replace(/background:#(?:f5c451|ffd978)/g,"")), "aucun fond blanc / clair (hors pastille dorée)");
  assert.ok(!/background:#(?:e9edf7|f1f3f8|f1f3f7|fffaf0|fff4cf|edf8f0)/i.test(css));
}

// --- ANTI-SPOIL : rien de verrouillé n'est visible (ni onglet, ni achat, ni prix, ni cadenas) ---
{
  const paliers = [
    { bosses: 0, absents: ["Magie", "Ressource 3", "Aventure", "Slots", "Rich Jerks", "Filtre de butin", "Digger", "Beard", "MacGuffin", "garderie", "Yggdrasil", "Auto-Activate", "verrouillé", "🔒"], presents: ["Débuts", "Énergie"] },
    { bosses: 4, absents: ["Magie", "Ressource 3", "Digger", "Beard", "MacGuffin", "garderie", "Yggdrasil", "🔒"], presents: ["Filtre de butin", "Aventure", "Rich Jerks"] }
  ];
  for (const palier of paliers) {
    const c = { bosses: palier.bosses };
    const neuf = normalizeIdleNguState({}, c, 1_000_000);
    neuf.currencies.experience = 500;
    const j2 = { systemes: idleNguSnapshot(neuf, c, 2_000_000) };
    etat = j2;
    let tout = "";
    for (const o of TOUS) { window.__ongletExpShopIdleV1__(o); tout += api.pageSpendExpIdleV1_(j2); }
    window.__ongletExpShopIdleV1__("debuts");
    const debuts = api.pageSpendExpIdleV1_(j2);
    for (const mot of palier.absents) assert.ok(!tout.includes(mot), "boss " + palier.bosses + " : « " + mot + " » ne doit pas être visible");
    for (const mot of palier.presents) assert.ok(tout.includes(mot), "boss " + palier.bosses + " : « " + mot + " » attendu");
    // l'onglet mémorisé d'un système encore verrouillé retombe sur Débuts
    window.__ongletExpShopIdleV1__("magic");
    assert.match(api.pageSpendExpIdleV1_(j2), /soreal-idle-exp-tab-v212 actif" aria-pressed="true" onclick="window.__ongletExpShopIdleV1__\('debuts'\)"/);
    window.__ongletExpShopIdleV1__("debuts");
  }
  etat = j;
}

console.log("idle-exp-shop-tabs-v1: OK");
