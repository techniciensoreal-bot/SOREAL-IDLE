import assert from "node:assert/strict";
import { lireSrc } from "./_src-sources.mjs";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { normaliserActiviteV1 } from "../src/idle-chat-v1.js";

/*
 * « En direct » plus vivant (Norman, 2026-10-09 : « quand on fuit ou qu'on meurt face à un boss, ça n'apparaît pas pour les autres ; des phrases humoristiques pour les menus visités, toujours en anti-spoil »).
 * Cause de l'oubli : la lecture des statistiques (liste blanche) jetait les compteurs fluxBossFuites / fluxBossDefaites / fluxBossDernier / fluxHistoires à chaque opération.
 */
const rt = lireSrc("idle-sqlite-runtime.js");
const debut = rt.indexOf("function statsJoueurSorealIdle_");
const fin = rt.indexOf("\nfunction ", debut + 10);
const corps = rt.slice(debut, fin);
for (const cle of ["fluxBossFuites", "fluxBossDefaites", "fluxBossDernier", "fluxHistoires"]) {
  assert.ok(corps.includes(cle + ":"), "la normalisation des statistiques conserve " + cle);
}

// Aucun menu n'est gardé ni renvoyé par le serveur (Norman, 2026-10-31 : En direct ne montre que des actions).
assert.equal(normaliserActiviteV1({ t: "libre", menu: "cards" }).menu, undefined);
assert.equal(normaliserActiviteV1({ t: "libre", menu: "admin" }).menu, undefined);
assert.equal("menu" in normaliserActiviteV1({ t: "farm", zoneId: 3, menu: "ngu" }), false);

// Phrases côté lecteur.
const ctx = { window: { __SOREAL_IDLE_ACTIVITE_V1__: () => null }, document: { addEventListener() {}, getElementById: () => null, createElement: () => ({ style: {}, setAttribute() {}, appendChild() {} }), head: { appendChild() {} }, body: { appendChild() {} } }, setInterval() {}, setTimeout() {}, localStorage: { getItem: () => null, setItem() {} }, console };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(readFileSync("cloudflare/public/modules/flux-v1.js", "utf8"), ctx);
const { phrase } = ctx.window.__SOREAL_IDLE_FLUX_V1__ || {};
assert.ok(phrase);
assert.equal(ctx.window.__SOREAL_IDLE_FLUX_V1__.lieuxVisite, undefined, "plus aucune table de menus visités");

const tousMenus = [];
const connus = (menus) => ({ zones: [], bossMax: 20, connus: { boss: { 11: "Gros Méchant" }, titan: {}, succes: {}, menus } });
const expert = connus({});
const debutant = connus({});

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
const anglais = /Basic Training|Advanced Training|Fight Boss|Item Daycare|Time Machine|Blood Magic|Gold Diggers|Rebirth|Questing|Challenges|Adventure|Beards|Hacks|Quirks|Wishes|Cards|Cooking|Money Pit/;
assert.ok(!anglais.test(phrase({ id: 0, type: "sort", nom: "Ana", donnees: { sort: 9 } }, Object.assign(expert, { connus: Object.assign({}, expert.connus, { menus: Object.assign({}, expert.connus.menus, { sang: true }), sorts: {} }) })).texte), "sort de sang : nom du menu en français");


// Un ancien événement « visite » n'a plus aucune phrase (jamais « X est dans le menu Y »).
assert.equal(phrase({ id: 1, type: "visite", nom: "Ana", donnees: { menu: "shop" } }, expert), null);
// Zone d'Aventure : le nom n'est donné qu'au lecteur qui l'a découverte (liste `zones` de son activité), sinon « en Aventure ».
{
  const avecZone = { zones: [{ id: 4, nom: "Forêt" }], bossMax: 20, connus: { boss: {}, titan: {}, succes: {}, menus: {} } };
  assert.ok(phrase({ id: 1, type: "farm", nom: "Ana", donnees: { zoneId: 4, zoneNom: "Forêt" } }, avecZone).texte.includes("Forêt"));
  const sans = phrase({ id: 1, type: "farm", nom: "Ana", donnees: { zoneId: 9, zoneNom: "Zone Secrète" } }, avecZone).texte;
  assert.ok(!sans.includes("Zone Secrète") && sans.includes("en Aventure"), sans);
}
console.log("idle-flux-vivant-v1: OK");
