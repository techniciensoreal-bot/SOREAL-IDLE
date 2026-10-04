import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { instantaneJoueurV1, evenementsV1 } from "../src/idle-flux-v1.js";

/*
 * « En direct » (Norman, 2026-10-04) : écrire quand un joueur prend la fuite ou perd contre un boss. Les compteurs sont tenus par le moteur (stats.fluxBossFuites / fluxBossDefaites / fluxBossDernier) ;
 * l'événement naît de la différence entre deux instantanés ; le nom du boss n'est donné qu'au lecteur qui l'a atteint (anti-spoil, comme la victoire).
 */
const inst = (extra) => instantaneJoueurV1({ stats: { metaNgu: {}, ...extra } });
const noms = { boss: (n) => "Boss " + n };

// Instantané : compteurs lus, bornés, nuls par défaut.
assert.deepEqual([inst({}).bossFuites, inst({}).bossDefaites, inst({}).bossDernier], [0, 0, 0]);
const a = inst({ fluxBossFuites: 2, fluxBossDefaites: 5, fluxBossDernier: 37 });
assert.deepEqual([a.bossFuites, a.bossDefaites, a.bossDernier], [2, 5, 37]);
assert.equal(inst({ fluxBossFuites: -4 }).bossFuites, 0);

// Événements : seulement quand un compteur augmente ; jamais depuis un instantané d'avant ce jalon.
const avant = inst({ fluxBossFuites: 1, fluxBossDefaites: 1, fluxBossDernier: 10 });
assert.deepEqual(evenementsV1(avant, inst({ fluxBossFuites: 1, fluxBossDefaites: 1, fluxBossDernier: 10 }), noms), [], "rien n'a changé");
assert.deepEqual(evenementsV1(avant, inst({ fluxBossFuites: 2, fluxBossDefaites: 1, fluxBossDernier: 11 }), noms), [{ type: "fuite", donnees: { boss: 11, nom: "Boss 11" } }]);
assert.deepEqual(evenementsV1(avant, inst({ fluxBossFuites: 1, fluxBossDefaites: 2, fluxBossDernier: 12 }), noms), [{ type: "defaite", donnees: { boss: 12, nom: "Boss 12" } }]);
assert.deepEqual(evenementsV1({ bossMax: 5, succes: [], titans: {}, defis: {}, rebirths: 0 }, inst({ fluxBossFuites: 3, fluxBossDefaites: 3, fluxBossDernier: 4 }), noms).map((e) => e.type), [], "ancien instantané : pas de comparaison");

// Moteur : les trois endroits où un combat de boss s'arrête comptent une fois, jamais pour un arrêt technique.
const rt = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");
assert.equal(rt.split("statsCombat.fluxBossDefaites=").length - 1, 2, "défaites constatées par la progression");
assert.ok(rt.includes("!Boolean(actif)&&stats.combatBossActif&&(raisonArret==='defaite'||raisonArret==='fuite')"), "arrêt demandé par le joueur, seulement si un combat était actif");
assert.ok(!rt.includes("raisonArret==='garde_client'&&"), "pas d'annonce pour les arrêts techniques");

// Phrase côté lecteur : nom du boss seulement s'il l'a atteint ; « Tu » pour soi.
const ctx = { window: { __SOREAL_IDLE_ACTIVITE_V1__: () => ({ zones: [], bossMax: 20, connus: { boss: { 11: "Gros Méchant" }, titan: {}, succes: {}, menus: {} } }) }, document: { addEventListener() {}, getElementById: () => null, createElement: () => ({ style: {}, setAttribute() {}, appendChild() {} }), head: { appendChild() {} }, body: { appendChild() {} } }, setInterval() {}, setTimeout() {}, localStorage: { getItem: () => null, setItem() {} }, console };
ctx.globalThis = ctx;
vm.createContext(ctx);
const src = readFileSync("cloudflare/public/modules/flux-v1.js", "utf8");
vm.runInContext(src + "\n;globalThis.__phrase__ = (typeof phrase==='function'?phrase:null);", ctx);
const phrase = ctx.__phrase__;
if (phrase) {
  const lecteur = { zones: [], bossMax: 20, connus: { boss: { 11: "Gros Méchant" }, titan: {}, succes: {}, menus: {} } };
  assert.equal(phrase({ type: "fuite", nom: "Ana", donnees: { boss: 11 } }, lecteur).texte, "Ana a pris la fuite devant Gros Méchant");
  assert.equal(phrase({ type: "defaite", nom: "Ana", donnees: { boss: 11 } }, lecteur).texte, "Ana a perdu contre Gros Méchant");
  assert.equal(phrase({ type: "defaite", nom: "Ana", donnees: { boss: 99 }, moi: true }, lecteur).texte, "Tu as perdu contre un boss", "boss pas encore atteint : jamais nommé");
  assert.equal(phrase({ type: "fuite", nom: "Ana", donnees: { boss: 99 }, moi: true }, lecteur).texte, "Tu as pris la fuite devant un boss");
}
console.log("idle-flux-fuite-defaite-boss-v1: OK");
