import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { normalizeIdleNguState, idleNguSnapshot } from "../src/idle-ngu-progression.js";

/*
 * Page Achievements + Player Portraits (modules/profile-v1.js), rendue depuis un vrai snapshot :
 * succès, BP et bonus d'AP, portraits (verrous, choix), Special Prize, câblage des actions et
 * chargement du module avant le monolithe.
 */
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
vm.runInNewContext(readFileSync("cloudflare/public/modules/profile-v1.js", "utf8"), sandbox);
const api = window.__SOREAL_IDLE_META_V130__;
assert.ok(window.__SOREAL_IDLE_PROFILE_V1__, "module Profil chargé");

const ctx = { bosses: 100 };
const state = normalizeIdleNguState({}, ctx, 0);
state.adventure.completedSets.sewers = true;
const snap = idleNguSnapshot(state, ctx, 0);
const html = api.pageSystemeMetaIdleV130_({ systemes: snap }, "achievements", "Achievements");
/* 2026-09-24 (anti-spoil) : ni « n / 153 », ni succès à venir, ni « ??? », ni « x / 50 » de portraits. */
assert.match(html, /Succès<b>\d+<\/b>/);
assert.doesNotMatch(html, /\/ 153|\/ 50|\?\?\?|⬜|➖/, "aucun total ni objectif à venir");
assert.match(html, /Bonus Points<b>\d+ BP/);
assert.match(html, /Player Portraits — 2</, "défaut + Sewers");
assert.match(html, /Special Prize/);
assert.match(html, /__profilChoisirPortraitIdleV1__\('sewers'\)/, "portrait débloqué sélectionnable");
assert.doesNotMatch(html, /__profilChoisirPortraitIdleV1__\('forest'\)/, "portrait verrouillé : pas de clic");
assert.match(html, /__profilPrixSpecialIdleV1__\(\)/);
assert.doesNotMatch(html, /disabled style="opacity:\.45"|🔒/, "aucun portrait verrouillé affiché");

/* Les boutons envoient les actions serveur. */
window.__SOREAL_IDLE_META_V130__ = Object.assign({}, api, { actionMetaIdleV130_: (p) => actions.push(p) });
window.__profilChoisirPortraitIdleV1__("sewers");
assert.equal(JSON.stringify(actions.pop()), JSON.stringify({ action: "portrait", id: "sewers" }));
window.__profilPrixSpecialIdleV1__();
assert.equal(JSON.stringify(actions.pop()), JSON.stringify({ action: "specialPrize" }));
window.__SOREAL_IDLE_META_V130__ = api;

/* Câblage : module chargé avant le monolithe, menu et page dans le monolithe, portrait passé au média. */
const index = readFileSync("cloudflare/public/index.html", "utf8");
const pos = index.indexOf("/modules/profile-v1.js");
assert.ok(pos > index.indexOf("/modules/meta-progression-v130.js"));
assert.ok(pos < index.indexOf("/soreal-idle-ui.js"));
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
assert.match(ui, /succes:'achievements'/);
assert.match(ui, /case 'succes':\s*return pageSystemeMetaIdleV130_\(j,'achievements'/);
assert.match(ui, /'&portrait='\+encodeURIComponent/);
assert.match(ui, /j\.systemes\.portraits\.selectedFile/);

console.log("idle-profile-page: OK");
