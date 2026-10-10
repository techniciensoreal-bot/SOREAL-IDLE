import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { normalizeIdleNguState, applyIdleNguAction, idleNguSnapshot } from "../src/idle-ngu-progression.js";

/*
 * Calendrier de connexion rendu dans la page Money Pit (Norman, 2026-10-03) : une case par jour du mois, cases grisées qui s'allument, dernière case en grand, bouton de récupération.
 */
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
const api = window.__SOREAL_IDLE_META_V130__;
const ctx = { bosses: 100 };
const jour = (iso) => Date.parse(iso + "T12:00:00+02:00");

// Money Pit pas découvert : aucune trace (anti-spoil).
{
  const T = jour("2026-12-10");
  const snap = idleNguSnapshot(normalizeIdleNguState({}, ctx, T), ctx, T);
  assert.equal(snap.loginCalendar, null);
}

let etat = normalizeIdleNguState({}, ctx, jour("2026-12-10"));
etat.systems.moneyPit.unlocked = true;
function pageMoneyPit(joueurSysteme) {
  return api.pageSystemeMetaIdleV130_({ systemes: joueurSysteme }, "moneyPit", "Money Pit");
}
{
  const T = jour("2026-12-10");
  const html = pageMoneyPit(idleNguSnapshot(etat, ctx, T));
  assert.match(html, /Récompenses de connexion · Décembre 2026/);
  assert.equal((html.match(/class="cal-case-v1 /g) || []).length, 31, "31 cases en octobre");
  assert.equal((html.match(/cal-case-v1 ratee/g) || []).length, 9, "les 9 jours déjà passés sont grisés (ratés)");
  assert.equal((html.match(/cal-case-v1 eteint/g) || []).length, 21, "les cases à venir sont éteintes");
  assert.equal((html.match(/cal-case-v1 pret/g) || []).length, 1, "la case du jour est prête");
  assert.match(html, /Récupérer la récompense du jour : \+2870 AP/);
  assert.match(html, /cal-case-v1 eteint dernier/, "la dernière case est la grande");
  assert.match(html, /Total du mois : <b>150000 AP/);
}
{
  const T = jour("2026-12-10");
  const apres = applyIdleNguAction(etat, { action: "loginCalendar" }, ctx, T).state;
  const html = pageMoneyPit(idleNguSnapshot(apres, ctx, T));
  assert.equal((html.match(/cal-case-v1 allume/g) || []).length, 1, "une case allumée");
  assert.equal((html.match(/cal-case-v1 ratee/g) || []).length, 9, "les jours ratés restent grisés");
  assert.match(html, /cal-coche-v1/);
  assert.match(html, /reviens demain pour \+3080 AP/);
  assert.doesNotMatch(html, /Récupérer la récompense du jour/);
  // Un mois de 30 jours : 30 cases.
  const nov = jour("2026-11-04");
  const htmlNov = pageMoneyPit(idleNguSnapshot(apres, ctx, nov));
  assert.equal((htmlNov.match(/class="cal-case-v1 /g) || []).length, 30);
  assert.match(htmlNov, /Novembre 2026/);
}
console.log("idle-login-calendar-page-v1 OK");
