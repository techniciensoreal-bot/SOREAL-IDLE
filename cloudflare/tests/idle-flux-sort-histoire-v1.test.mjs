import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { instantaneJoueurV1, evenementsV1 } from "../src/idle-flux-v1.js";
import { normalizeIdleNguState, applyIdleNguAction } from "../src/idle-ngu-progression.js";

/*
 * « En direct » (Norman, 2026-10-04) : écrire quand quelqu'un lance un sort de Blood Magic et quand il regarde une cinématique (les petites histoires).
 * Sort : records.bloodSpellsCast / bloodSpellLast ; histoire : stats.fluxHistoires (tenu par marquerVusSorealIdle). Anti-spoil côté lecteur.
 */
const inst = (records, stats) => instantaneJoueurV1({ stats: { metaNgu: { records: records || {} }, ...(stats || {}) } });

// Instantané et événements.
assert.deepEqual([inst().sorts, inst().sortDernier, inst().histoires], [0, 0, 0]);
const a = inst({ bloodSpellsCast: 3, bloodSpellLast: 2 }, { fluxHistoires: 4 });
assert.deepEqual([a.sorts, a.sortDernier, a.histoires], [3, 2, 4]);
assert.deepEqual(evenementsV1(a, inst({ bloodSpellsCast: 3, bloodSpellLast: 2 }, { fluxHistoires: 4 })), []);
assert.deepEqual(evenementsV1(a, inst({ bloodSpellsCast: 4, bloodSpellLast: 3 }, { fluxHistoires: 4 })), [{ type: "sort", donnees: { sort: 3 } }]);
assert.deepEqual(evenementsV1(a, inst({ bloodSpellsCast: 3, bloodSpellLast: 2 }, { fluxHistoires: 5 })), [{ type: "histoire", donnees: {} }]);
assert.deepEqual(evenementsV1({ bossMax: 1, succes: [], titans: {}, defis: {}, rebirths: 0 }, a).map((e) => e.type), [], "ancien instantané : pas de comparaison");

// Moteur : chaque lancement de sort compte une fois et garde le rang du dernier.
{
  const ctx = { bosses: 100 };
  const s = normalizeIdleNguState({}, ctx, 0);
  s.systems.bloodMagic.unlocked = true;
  s.currencies.blood = 5;
  const r = applyIdleNguAction(s, { action: "castBloodSpell", spell: "numberBoost" }, ctx, 1000);
  assert.equal(r.state.records.bloodSpellsCast, 1);
  assert.equal(r.state.records.bloodSpellLast, 1);
  r.state.currencies.blood = 200;
  const r2 = applyIdleNguAction(r.state, { action: "castBloodSpell", spell: "ironPill" }, ctx, 2000);
  assert.equal(r2.state.records.bloodSpellsCast, 2);
  assert.equal(r2.state.records.bloodSpellLast, 2);
}
const rt = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");
assert.ok(rt.includes("/^histoire:/.test(id)") && rt.includes("!dejaVus.has(id)") && rt.includes("stats.fluxHistoires = "), "une histoire jamais vue compte une fois");

// Phrases côté lecteur.
const ctx = { window: {}, document: { addEventListener() {}, getElementById: () => null, createElement: () => ({ style: {}, setAttribute() {}, appendChild() {} }), head: { appendChild() {} }, body: { appendChild() {} } }, setInterval() {}, setTimeout() {}, localStorage: { getItem: () => null, setItem() {} }, console };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(readFileSync("cloudflare/public/modules/flux-v1.js", "utf8") + "\n;globalThis.__phrase__ = (typeof phrase==='function'?phrase:null);", ctx);
const phrase = ctx.__phrase__;
if (phrase) {
  const avecSang = { zones: [], bossMax: 5, connus: { boss: {}, titan: {}, succes: {}, menus: { sang: true }, sorts: { 1: true, 2: true } } };
  const sansSang = { zones: [], bossMax: 5, connus: { boss: {}, titan: {}, succes: {}, menus: {}, sorts: {} } };
  assert.equal(phrase({ type: "sort", nom: "Ana", donnees: { sort: 2 } }, avecSang).texte, "Ana a lancé le sort Iron Pill");
  assert.equal(phrase({ type: "sort", nom: "Ana", donnees: { sort: 3 } }, avecSang).texte, "Ana a lancé un sort de Blood Magic", "sort pas encore découvert : jamais nommé");
  assert.equal(phrase({ type: "sort", nom: "Ana", donnees: { sort: 5 } }, avecSang).texte, "Ana a lancé un sort de Blood Magic", "le dernier sort n'est jamais nommé");
  assert.equal(phrase({ type: "sort", nom: "Ana", donnees: { sort: 1 }, moi: true }, avecSang).texte, "Tu as lancé le sort Blood NUMBER Boost");
  assert.equal(phrase({ type: "sort", nom: "Ana", donnees: { sort: 1 } }, sansSang), null, "menu Blood inconnu du lecteur : rien");
  assert.equal(phrase({ type: "histoire", nom: "Ana", donnees: {} }, sansSang).texte, "Ana a regardé une cinématique");
  assert.equal(phrase({ type: "histoire", nom: "Ana", donnees: {}, moi: true }, sansSang).texte, "Tu as regardé une cinématique");
}
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
assert.ok(ui.includes("'moneyPit','sang','aventure','wandoos','yggdrasil'].forEach(") && ui.includes("connus.sorts="));
console.log("idle-flux-sort-histoire-v1: OK");
