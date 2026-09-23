import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { normalizeIdleNguState, syncIdleNguState, idleNguSnapshot } from "../src/idle-ngu-progression.js";

/*
 * Page Cooking (modules/cooking-v1.js) rendue depuis un vrai snapshot :
 * verrou IT HUNGERS, 8 lignes d'ingrédients (slots 7/8 verrouillés), valeurs
 * affichées par le vrai écran, bouton Manger désactivé tant que le gain par
 * repas n'est pas sourcé, et chargement du module avant le monolithe.
 */
const H = 3600000;
const actions = [];
const window = {
  __SOREAL_IDLE_META_HOST_V130__: {
    getIdleEtat() { return null; },
    idleHtml_: (v) => String(v == null ? "" : v).replace(/</g, "&lt;"),
    idleNombre_: (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; },
    idleEntier_: (v) => Math.max(0, Math.floor(Number(v) || 0)),
    formatGrandNombreIdleV70_: (v) => String(v),
    entetePageIdleV28_: (titre, sous) => "<h1>" + titre + "</h1><p>" + (sous || "") + "</p>",
    appelerProgressionIdleCloudflareV1_() {}
  },
  __SOREAL_IDLE_TEXT_HELPERS_V1__: { libelleRessource: (id) => String(id || "") },
  __SOREAL_IDLE_TEXT_TRANSFORMS_V1__: { attr: (v) => String(v == null ? "" : v) },
  document: { getElementById() { return null; } }
};
const sandbox = { window, document: window.document, SOREAL_SESSION: null };
vm.runInNewContext(readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8"), sandbox);
vm.runInNewContext(readFileSync("cloudflare/public/modules/cooking-v1.js", "utf8"), sandbox);
const api = window.__SOREAL_IDLE_META_V130__;
assert.ok(window.__SOREAL_IDLE_COOKING_V1__, "module Cooking chargé");

const ctx = { bosses: 100 };
const t0 = 5_000_000;

{
  const snap = idleNguSnapshot(normalizeIdleNguState({}, ctx, t0), ctx, t0);
  const html = api.pageSystemeMetaIdleV130_({ systemes: snap }, "cooking", "Cooking");
  assert.match(html, /Système verrouillé : vaincs le titan IT HUNGERS/);
}

let state = normalizeIdleNguState({}, ctx, t0);
state.adventure.unlockFlags.itHungersDefeated = true;
state = syncIdleNguState(state, ctx, t0);
state.systems.cooking.data.levels[1] = 4;
{
  const snap = idleNguSnapshot(state, ctx, t0 + 2 * H);
  const html = api.pageSystemeMetaIdleV130_({ systemes: snap }, "cooking", "Cooking");
  assert.match(html, /Efficacité du repas/);
  assert.match(html, /Bonus de cuisine totaux<b>100,00 %/);
  assert.match(html, /Gain d’EXP du repas<b>non documenté/);
  assert.match(html, /Gain d’EXP total<b>\+0,00 % \/ 300 %/);
  assert.match(html, /Repas n°1/);
  assert.match(html, /Un repas toutes les 23,5 h/);
  assert.match(html, /max 24,5 h/);
  assert.match(html, /prêt dans 21:30:00/);
  assert.equal((html.match(/Ingrédient n°/g) || []).length, 8);
  assert.match(html, /vaincre ROCK LOBSTER/);
  assert.match(html, /vaincre AMALGAMATE/);
  assert.match(html, /<b>4<\/b> \/ 20/);
  assert.doesNotMatch(html, /__cuisineMangerIdleV1__/, "pas de repas prêt");
}
{
  const snap = idleNguSnapshot(state, ctx, t0 + 30 * H);
  const html = api.pageSystemeMetaIdleV130_({ systemes: snap }, "cooking", "Cooking");
  assert.match(html, /Manger ! \(gain non documenté\)/);
  assert.doesNotMatch(html, /__cuisineMangerIdleV1__\(\)/, "manger désactivé tant que le gain n'est pas sourcé");
}

/* Les boutons +/- envoient l'action serveur { action: "cooking", op: "setIngredient" }. */
{
  sandbox.SOREAL_SESSION = null;
  window.__SOREAL_IDLE_META_V130__ = Object.assign({}, api, { actionMetaIdleV130_: (p) => actions.push(p) });
  window.__cuisineReglerIngredientIdleV1__(3, 7);
  assert.equal(JSON.stringify(actions.pop()), JSON.stringify({ action: "cooking", op: "setIngredient", index: 3, level: 7 }));
  window.__SOREAL_IDLE_META_V130__ = api;
}

const index = readFileSync("cloudflare/public/index.html", "utf8");
const posModule = index.indexOf("/modules/cooking-v1.js");
assert.ok(posModule > index.indexOf("/modules/meta-progression-v130.js"));
assert.ok(posModule < index.indexOf("/soreal-idle-ui.js"));

console.log("idle-cooking-page: OK");
