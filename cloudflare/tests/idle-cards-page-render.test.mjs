import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { normalizeIdleNguState, applyIdleNguAction, idleNguSnapshot } from "../src/idle-ngu-progression.js";

/*
 * Page Cards (meta-progression-v130.js::pageCardsIdleV1_) rendue à partir d'un
 * vrai snapshot serveur (idle-cards-v1.js), textes en français.
 */
const MODULE_PATH = "cloudflare/public/modules/meta-progression-v130.js";
const numberFormat = { window: {} };
vm.runInNewContext(readFileSync("cloudflare/public/modules/number-format-v1.js", "utf8"), numberFormat);
const grand = numberFormat.window.__SOREAL_IDLE_NUMBER_FORMAT_V1__.grandNombre;
const esc = (v) => String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
const window = {
  __SOREAL_IDLE_META_HOST_V130__: {
    getIdleEtat() { return null; },
    idleHtml_: esc,
    idleNombre_: (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; },
    idleEntier_: (v) => Math.max(0, Math.floor(Number(v) || 0)),
    formatGrandNombreIdleV70_: (v, d) => grand(v, d),
    entetePageIdleV28_: (titre, sous) => "<h1>" + titre + "</h1><p>" + (sous || "") + "</p>",
    appelerProgressionIdleCloudflareV1_() {}
  },
  __SOREAL_IDLE_TEXT_HELPERS_V1__: { libelleRessource: (id) => String(id || "") },
  __SOREAL_IDLE_TEXT_TRANSFORMS_V1__: { attr: (v) => String(v == null ? "" : v) },
  document: { getElementById() { return null; } }
};
vm.runInNewContext(readFileSync(MODULE_PATH, "utf8"), { window, document: window.document, SOREAL_SESSION: null });
const page = window.__SOREAL_IDLE_META_V130__.pageSystemeMetaIdleV130_;

const ctx = { bosses: 300 };
let state = normalizeIdleNguState({}, ctx, 1_000_000);
{
  const html = page({ systemes: idleNguSnapshot(state, ctx, 1_000_000) }, "cards", "Cards");
  assert.match(html, /Still-Beating Heart/, "verrouillé tant que le cœur n'est pas consommé");
}

state.systems.cards.unlocked = true;
state.systems.cards.data.deck.push({ id: "carte-1", type: "adventure", tier: 2, rarity: 1.18, mayo: { angry: 2, pretty: 1 }, protected: false, chonker: false });
state.systems.cards.data.mayo.angry = 5;
state.systems.cards.data.mayo.pretty = 1;
state = applyIdleNguAction(state, { action: "cards", mode: "toggleGenerator", mayo: "sad" }, ctx, 1_000_000).state;
{
  const html = page({ systemes: idleNguSnapshot(state, ctx, 1_000_000) }, "cards", "Cards");
  assert.match(html, /1 \/ 10/, "deck 1 / 10");
  assert.match(html, /ADV · Stats d'Aventure|ADV · Stats d&#039;Aventure/);
  assert.match(html, /Great/, "rareté 1.18 = Great");
  assert.match(html, /✨ Lancer/);
  assert.match(html, /&quot;mode&quot;:&quot;cast&quot;/, "bouton Lancer branché sur l'action cards/cast");
  assert.match(html, /⏸️ Arrêter le générateur/, "générateur Sad actif");
  for (const nom of ["Angry", "Sad", "Moldy", "Ayy Lmayo", "Cinco de Mayo", "Pretty"]) assert.ok(html.includes(nom), "mayo " + nom);
  for (const code of ["E-NGU", "M-NGU", "WANDOOS", "AUGS", "TM", "HACKS", "WISHES", "A/D", "ADV", "DROPS", "GOLD", "DAYCARE", "PP", "QP"]) {
    assert.ok(html.includes(code + " · "), "type " + code);
  }
}
console.log("idle-cards-page-render: OK");
