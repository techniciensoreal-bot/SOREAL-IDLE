import assert from "node:assert/strict";
import { PAGES_META } from "./_meta-pages.mjs";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import {
  normalizeIdleNguState,
  applyIdleNguAction,
  idleNguSnapshot
} from "../src/idle-ngu-progression.js";

/*
 * Audit NGU 2026-09-23 : la page NGU de l'interface affiche les 16 vrais NGU
 * à partir d'un vrai snapshot serveur (pas d'un jeu de données inventé pour le test).
 */
const horloge = { t: 5000 };
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
/* La page NGU est celle du laboratoire (modules/ngu-labo-v1.js), appelée par la page générique. */
vm.runInNewContext(readFileSync("cloudflare/public/modules/ngu-labo-v1.js", "utf8"), { window, document: window.document, setInterval: () => 1, clearInterval() {}, performance: { now: () => horloge.t } });
{
  const bac = { window, document: window.document, SOREAL_SESSION: null };
  vm.runInNewContext(readFileSync(MODULE_PATH, "utf8"), bac);
  for (const f of PAGES_META) vm.runInNewContext(readFileSync("cloudflare/public/modules/" + f, "utf8"), bac);
}
const page = window.__SOREAL_IDLE_META_V130__.pageSystemeMetaIdleV130_;

/*
 * HTML stable (Norman, 2026-11-02) : deux rendus de la page NGU pour le MÊME état du jeu doivent donner exactement le même HTML (le morph ignore alors le redessin). Avant : data-nl-t0 prenait l'heure du rendu (performance.now()) sur chaque tuyau, donc le HTML changeait à chaque rendu.
 * Un tuyau à l'arrêt porte data-nl-t0="0" ; seul un tuyau qui progresse garde son instant de départ (le tick en a besoin), il vient de l'état reçu (__recuPerfV1), pas de l'heure du rendu.
 */
const context = { bosses: 100, bestGold: 1e6, adventurePower: 1e9 };
let state = normalizeIdleNguState({}, context, 1_000_000);
state.adventure.unlockItems.aNumber = true;
state = applyIdleNguAction(state, { action: "adventure", adventure: { mode: "consumeUnlock", itemId: "aNumber" } }, context, 1_000_000).state;
{
  const snap = idleNguSnapshot(state, context, 1_000_000);
  horloge.t = 5000;
  const a = page({ systemes: snap }, "ngu", "NGU");
  horloge.t = 9137.5;
  const b = page({ systemes: snap }, "ngu", "NGU");
  assert.ok(a.includes("data-nl-ngu="), "la page est rendue");
  assert.equal(a, b, "deux rendus d'un état sans progression : HTML identique");
  assert.ok(!/data-nl-t0="(?!0")/.test(a), "tuyaux à l'arrêt : data-nl-t0 vaut 0");
}
state.resources.energy.cap = 1000;
state.resources.energy.current = 1000;
state.resources.energy.power = 1e9;
state = applyIdleNguAction(state, { action: "allocateNgu", ngu: "powerAlpha", value: 500 }, context, 1_000_000).state;
{
  const snap = idleNguSnapshot(state, context, 1_000_000);
  const j = { systemes: snap, __recuPerfV1: 7000 };
  horloge.t = 7100;
  const a = page(j, "ngu", "NGU");
  horloge.t = 9100;
  const b = page(j, "ngu", "NGU");
  assert.equal(a, b, "tuyau actif : l'instant de départ vient de l'état reçu, pas de l'heure du rendu");
  assert.ok(a.includes('data-nl-t0="7000"'), "le tuyau qui progresse garde son instant de départ");
  assert.equal((a.match(/data-nl-t0="7000"/g) || []).length, 1, "un seul tuyau actif");
}
console.log("idle-ngu-html-stable-v1: OK");
