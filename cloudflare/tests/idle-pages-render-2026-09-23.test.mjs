import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { normalizeIdleNguState, idleNguSnapshot } from "../src/idle-ngu-progression.js";

/* 2026-09-23 : les pages ITOPOD, Défis et Boutique EXP se rendent à partir de vrais snapshots (étages, difficulté, achats d'aventure). */
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
vm.runInNewContext(readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8"), { window, document: window.document, SOREAL_SESSION: null });
const api = window.__SOREAL_IDLE_META_V130__;
const context = { bosses: 100 };
const state = normalizeIdleNguState({}, context, 1_000_000);
state.systems.tower.unlocked = true;
state.systems.tower.data = { floor: 12, killsOnFloor: 3, kills: 123, highestFloor: 40, ppProgress: 500000, optimalFloor: 33 };
state.systems.challenges.unlocked = true;
state.difficulty = "difficile";
state.currencies.experience = 500;
const snap = idleNguSnapshot(state, context, 2_000_000);

{
  const html = api.pageSystemeMetaIdleV130_({ systemes: snap }, "tower", "ITOPOD");
  assert.match(html, /Étage le plus haut/);
  assert.match(html, /Étage optimal/);
  assert.match(html, /itopodDebutV1/);
}
{
  const html = api.pageSystemeMetaIdleV130_({ systemes: snap }, "challenges", "Défis");
  assert.match(html, /\(Evil\)/, "la difficulté affichée est Evil");
  assert.match(html, /15 ?000|15K|15,0/i, "récompense Evil du Basic Challenge (15 000 EXP)");
}
{
  /* 2026-09-24 : Boutique EXP en onglets (un seul affiché à la fois ; « Débuts » par défaut). */
  const debuts = api.pageSpendExpIdleV1_({ systemes: snap });
  assert.match(debuts, /À acheter tôt/);
  assert.match(debuts, /Filtre de butin basique/);
  window.__ongletExpShopIdleV1__("aventure");
  const html = api.pageSpendExpIdleV1_({ systemes: snap });
  assert.match(html, /Rich Jerks/);
  assert.match(html, /buyExpShop|__acheterExpShopIdleV1__/);
  window.__ongletExpShopIdleV1__("debuts");
}
console.log("idle-pages-render-2026-09-23 ok");
