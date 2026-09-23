import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import {
  normalizeIdleNguState,
  applyIdleNguAction,
  idleNguSnapshot
} from "../src/idle-ngu-progression.js";

/*
 * Page Item Daycare de l'interface, rendue à partir d'un vrai snapshot serveur :
 * verrou, objets en garderie (niveau, ETA), objets plaçables et boutons d'action.
 */
const MODULE_PATH = "cloudflare/public/modules/meta-progression-v130.js";
const numberFormat = { window: {} };
vm.runInNewContext(readFileSync("cloudflare/public/modules/number-format-v1.js", "utf8"), numberFormat);
const grand = numberFormat.window.__SOREAL_IDLE_NUMBER_FORMAT_V1__.grandNombre;
const window = {
  __SOREAL_IDLE_META_HOST_V130__: {
    getIdleEtat() { return null; },
    idleHtml_: (v) => String(v == null ? "" : v),
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
assert.equal(typeof window.__daycareIdleV1__, "function");

const ctx = { bosses: 100 };
const T0 = 1_000_000;
let state = normalizeIdleNguState({}, ctx, T0);
{
  const html = page({ systemes: idleNguSnapshot(state, ctx, T0) }, "daycare", "Item Daycare");
  assert.match(html, /Achète « Item Daycare ! » \(250 EXP\)/, "verrouillé sans slot");
}
state.currencies.experience = 1000;
state = applyIdleNguAction(state, { action: "buyExpShop", item: "daycareSlot1" }, ctx, T0).state;
const added = applyIdleNguAction(state, { action: "adventure", adventure: { action: "addItem", definitionId: "forest:pendant", level: 2 } }, ctx, T0);
state = added.state;
{
  const html = page({ systemes: idleNguSnapshot(state, ctx, T0) }, "daycare", "Item Daycare");
  assert.ok(html.includes("Slots<b>0 / 1</b>"));
  assert.ok(html.includes("window.__daycareIdleV1__('daycarePlace','" + added.result.id + "')"), "bouton Placer du Forest Pendant");
}
state = applyIdleNguAction(state, { action: "daycarePlace", itemId: added.result.id }, ctx, T0).state;
{
  const snap = idleNguSnapshot(state, ctx, T0 + 90 * 60 * 1000);
  const html = page({ systemes: snap }, "daycare", "Item Daycare");
  assert.ok(html.includes("Slots<b>1 / 1</b>"));
  assert.ok(html.includes("Niv. 3 (+1)"), "1 h 30 plus tard : un niveau gagné");
  assert.ok(html.includes("prochain niveau dans 30 min"));
  assert.ok(html.includes("window.__daycareIdleV1__('daycareRemove','" + added.result.id + "')"));
  assert.ok(html.includes("aucun slot libre"), "plus de slot libre pour les autres objets");
}
console.log("idle-daycare-page-render ok");
