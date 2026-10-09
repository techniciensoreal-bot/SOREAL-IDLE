import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { IDLE_ACTIVITE_MENUS_V1, normaliserActiviteV1 } from "../src/idle-chat-v1.js";

/*
 * « En direct » plus vivant (Norman, 2026-10-09 : « quand on fuit ou qu'on meurt face à un boss, ça n'apparaît pas pour les autres ; des phrases humoristiques pour les menus visités, toujours en anti-spoil »).
 * Cause de l'oubli : la lecture des statistiques (liste blanche) jetait les compteurs fluxBossFuites / fluxBossDefaites / fluxBossDernier / fluxHistoires à chaque opération.
 */
const rt = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");
const debut = rt.indexOf("function statsJoueurSorealIdle_");
const fin = rt.indexOf("\nfunction ", debut + 10);
const corps = rt.slice(debut, fin);
for (const cle of ["fluxBossFuites", "fluxBossDefaites", "fluxBossDernier", "fluxHistoires"]) {
  assert.ok(corps.includes(cle + ":"), "la normalisation des statistiques conserve " + cle);
}

// Menus visités : liste blanche élargie côté serveur, jamais l'administration ni un texte libre.
for (const m of ["shop", "entrainement", "aventure", "ngu", "wandoos", "cards", "cooking", "parametres"]) assert.ok(IDLE_ACTIVITE_MENUS_V1.includes(m), m);
assert.ok(!IDLE_ACTIVITE_MENUS_V1.includes("admin") && !IDLE_ACTIVITE_MENUS_V1.includes("chat"));
assert.equal(normaliserActiviteV1({ t: "libre", menu: "admin" }).menu, undefined);
assert.equal(normaliserActiviteV1({ t: "libre", menu: "cards" }).menu, "cards");

// Phrases côté lecteur.
const ctx = { window: { __SOREAL_IDLE_ACTIVITE_V1__: () => null }, document: { addEventListener() {}, getElementById: () => null, createElement: () => ({ style: {}, setAttribute() {}, appendChild() {} }), head: { appendChild() {} }, body: { appendChild() {} } }, setInterval() {}, setTimeout() {}, localStorage: { getItem: () => null, setItem() {} }, console };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(readFileSync("cloudflare/public/modules/flux-v1.js", "utf8"), ctx);
const { phrase, lieuxVisite: lieux } = ctx.window.__SOREAL_IDLE_FLUX_V1__ || {};
assert.ok(phrase && lieux);

const tousMenus = Object.keys(lieux);
const menusServeur = IDLE_ACTIVITE_MENUS_V1.slice().sort();
assert.deepEqual(tousMenus.slice().sort(), menusServeur, "chaque menu annoncé par le serveur a ses phrases côté lecteur");
const connus = (menus) => ({ zones: [], bossMax: 20, connus: { boss: { 11: "Gros Méchant" }, titan: {}, succes: {}, menus } });
const expert = connus(Object.fromEntries(tousMenus.map((m) => [m, true])));
const debutant = connus({});
for (const m of tousMenus) {
  assert.ok(lieux[m][2].length >= 3, m + " : au moins trois variantes");
  lieux[m][2].forEach((v, i) => {
    assert.ok(v.includes("{n}"), m + " : le nom du joueur figure dans la phrase");
    const p = phrase({ id: i, type: "visite", nom: "Afflito", donnees: { menu: m } }, expert);
    assert.ok(p && p.texte.startsWith("Afflito "), m + " : phrase lisible");
    const inconnu = phrase({ id: i, type: "visite", nom: "Afflito", donnees: { menu: m } }, debutant).texte;
    assert.ok(inconnu.startsWith("Afflito ") && !inconnu.includes(lieux[m][1]) && !new RegExp(m, "i").test(inconnu), m + " : menu non débloqué chez le lecteur, jamais nommé : " + inconnu);
  });
  // Les variantes tournent avec l'identifiant de l'événement.
  const a = phrase({ id: 0, type: "visite", nom: "A", donnees: { menu: m } }, expert).texte;
  const b = phrase({ id: 1, type: "visite", nom: "A", donnees: { menu: m } }, expert).texte;
  assert.notEqual(a, b, m + " : variantes différentes");
}
assert.equal(phrase({ id: 0, type: "visite", nom: "Afflito", donnees: { menu: "shop" } }, expert).texte, "Afflito visite la boutique");

// Fuite et défaite : variantes d'humour, nom du boss jamais donné à un lecteur qui ne l'a pas atteint.
for (let i = 0; i < 21; i++) {
  const f = phrase({ id: i, type: "fuite", nom: "Sébastien", donnees: { boss: 11 } }, expert).texte;
  const d = phrase({ id: i, type: "defaite", nom: "La Brute", donnees: { boss: 11 } }, expert).texte;
  assert.ok(f.startsWith("Sébastien ") && f.includes("Gros Méchant"), f);
  assert.ok(d.startsWith("La Brute ") && d.includes("Gros Méchant"), d);
  const f2 = phrase({ id: i, type: "fuite", nom: "Sébastien", donnees: { boss: 99 } }, expert).texte;
  const d2 = phrase({ id: i, type: "defaite", nom: "La Brute", donnees: { boss: 99 } }, expert).texte;
  assert.ok(f2.includes("un boss") && !f2.includes("99"), f2);
  assert.ok(d2.includes("un boss") && !d2.includes("99"), d2);
}
assert.ok(phrase({ id: 1, type: "defaite", nom: "La Brute", donnees: { boss: 11 } }, expert).texte.includes("est mort contre Gros Méchant"));
assert.ok(phrase({ id: 1, type: "fuite", nom: "Sébastien", donnees: { boss: 11 } }, expert).texte.includes("a fui face à Gros Méchant"));

// Au moins vingt variantes distinctes par situation (Norman, 2026-10-09 : « une vingtaine de variantes à la honte »).
const distinctes = (type) => new Set(Array.from({ length: 40 }, (_, i) => phrase({ id: i, type, nom: "Ana", donnees: { boss: 11 } }, expert).texte)).size;
assert.ok(distinctes("fuite") >= 20, "fuite : " + distinctes("fuite"));
assert.ok(distinctes("defaite") >= 20, "défaite : " + distinctes("defaite"));
// Vingt variantes par menu (phrases du menu + phrases communes), vingt phrases « endroit que tu n'as pas découvert ».
for (const m of tousMenus) {
  const n = new Set(Array.from({ length: 60 }, (_, i) => phrase({ id: i, type: "visite", nom: "Ana", donnees: { menu: m } }, expert).texte)).size;
  assert.ok(n >= 20, m + " : " + n + " variantes");
}
assert.ok(new Set(Array.from({ length: 60 }, (_, i) => phrase({ id: i, type: "visite", nom: "Ana", donnees: { menu: "ngu" } }, debutant).texte)).size >= 20, "menu inconnu : au moins vingt variantes");
console.log("idle-flux-vivant-v1: OK");
