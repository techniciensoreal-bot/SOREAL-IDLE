import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { normalizeIdleNguState, idleNguSnapshot } from "../src/idle-ngu-progression.js";

/*
 * Ygg extra (2026-09-23) : page Yggdrasil et section Auto-Activate de la boutique EXP, rendues à
 * partir d'un vrai snapshot serveur (Poop, case à cocher par fruit, Auto-Activate, verrou du Fruit
 * of Numbers, durée d'un tier).
 */
const MODULE_PATH = "cloudflare/public/modules/meta-progression-v130.js";
const numberFormat = { window: {} };
vm.runInNewContext(readFileSync("cloudflare/public/modules/number-format-v1.js", "utf8"), numberFormat);
const grand = numberFormat.window.__SOREAL_IDLE_NUMBER_FORMAT_V1__.grandNombre;
const actions = [];
const window = {
  __SOREAL_IDLE_META_HOST_V130__: {
    getIdleEtat() { return null; },
    idleHtml_: (v) => String(v == null ? "" : v),
    idleNombre_: (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; },
    idleEntier_: (v) => Math.max(0, Math.floor(Number(v) || 0)),
    formatGrandNombreIdleV70_: (v, d) => grand(v, d),
    formatterHeuresIdleV47_: (h) => Number(h).toFixed(2) + " h",
    entetePageIdleV28_: (titre, sous) => "<h1>" + titre + "</h1><p>" + (sous || "") + "</p>",
    appelerProgressionIdleCloudflareV1_() {}
  },
  __SOREAL_IDLE_TEXT_HELPERS_V1__: { libelleRessource: (id) => String(id || "") },
  __SOREAL_IDLE_TEXT_TRANSFORMS_V1__: { attr: (v) => String(v == null ? "" : v) },
  __actionMetaV47__: (p) => actions.push(p),
  document: { getElementById() { return null; } }
};
vm.runInNewContext(readFileSync(MODULE_PATH, "utf8"), { window, document: window.document, SOREAL_SESSION: null });
const page = window.__SOREAL_IDLE_META_V130__.pageSystemeMetaIdleV130_;

const ctx = { bosses: 100 };
const T0 = 1_000_000;
const state = normalizeIdleNguState({}, ctx, T0);
state.systems.yggdrasil.unlocked = true;
state.selloutEffects.poop = 7;
state.systems.quirks.data.levels = { 13: 2 };
state.bonuses.expShop = { yggAutoPomegranate: 1 };
Object.assign(state.systems.yggdrasil.data.fruits.gold, { tier: 2, active: true, growthHours: 1.5 });
state.systems.yggdrasil.data.fruits.pomegranate.tier = 1;

const html = page({ systemes: idleNguSnapshot(state, ctx, T0) }, "yggdrasil", "Yggdrasil");
assert.ok(html.includes("💩 Poop<b>7</b>"), "stock de Poop visible");
assert.ok(html.includes("Durée d’un tier<b>58 min</b>"), "The Beast's Fertilizer niveau 2");
assert.ok(!html.includes("Réservé Energy"), "résumé obsolète retiré");
assert.ok(html.includes("window.__utiliserFruitYggIdleV1__('gold','eat')"));
assert.ok(html.includes("window.__basculerPoopYggIdleV1__('gold',this.checked)"));
assert.ok(html.includes("🔒 Débloqué par la 5e complétion du Troll Challenge"), "Fruit of Numbers verrouillé");
assert.ok(html.includes("⚡ Auto-Activate"), "Pomegranate : Auto-Activate acheté");
assert.ok(html.includes("window.__acheterExpShopIdleV1__('yggAutoGold',1)"), "achat de l'Auto-Activate du Fruit of Gold");
for (const nom of ["Fruit of Power δ", "Watermelon", "Fruit of Quirks"]) assert.ok(html.includes(nom), nom);

// Case Poop cochée : envoyée avec Manger, puis décochée.
window.__basculerPoopYggIdleV1__("gold", true);
window.__utiliserFruitYggIdleV1__("gold", "eat");
window.__utiliserFruitYggIdleV1__("gold", "harvest");
assert.deepEqual(JSON.parse(JSON.stringify(actions)), [
  { action: "useYggFruit", fruit: "gold", mode: "eat", poop: true },
  { action: "useYggFruit", fruit: "gold", mode: "harvest" }
]);

// Boutique EXP : section Auto-Activate séparée avec le cap requis.
{
  const shop = window.__SOREAL_IDLE_META_V130__.pageSpendExpIdleV1_({ systemes: idleNguSnapshot(state, ctx, T0) });
  const i = shop.indexOf("🌱 Yggdrasil : Auto-Activate");
  assert.ok(i > 0, "section dédiée");
  assert.ok(shop.indexOf("Fruit of Gold Auto-Activate") > i, "les Auto-Activate ne sont pas dans « Aventure et divers »");
  assert.ok(shop.includes("Cap requis</small><strong>" + grand(1e6) + " Energy"), "cap requis du Fruit of Gold");
  assert.ok(shop.includes("✔ Acheté : activation automatique et gratuite"), "Pomegranate déjà acheté");
}

console.log("idle-yggdrasil-extra-page-render: OK");
