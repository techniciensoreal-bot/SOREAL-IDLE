import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { instantaneJoueurV1, evenementsV1 } from "../src/idle-flux-v1.js";

/*
 * Norman (2026-10-04) : « quand on balance son or dans le puits, ça doit être inscrit dans En direct, ainsi que la récompense ; pareil pour la roue. »
 */
const inst = (puits, roue) => instantaneJoueurV1({ stats: { metaNgu: { systems: { moneyPit: { data: puits || {} }, dailySpin: { data: roue || {} } } } } });
const p0 = inst({ lastTossAt: 1000, history: [{ at: 1000, cost: 5e6, tier: 1, reward: { experience: 12, ap: 6 }, boost: null }] }, { totalSpins: 3, history: [{ at: 500, tier: 1, reward: { ap: 100 }, totalSpins: 3 }] });
assert.equal(p0.puitsAt, 1000);
assert.deepEqual(p0.puitsJet, { cout: 5e6, recompense: { experience: 12, ap: 6 }, boost: false });
assert.equal(p0.roueN, 3);
assert.deepEqual(p0.roueJet, { recompense: { ap: 100 } });
assert.deepEqual([inst().puitsAt, inst().puitsJet, inst().roueN, inst().roueJet], [0, null, 0, null]);

// Événements : seulement quand un jet NOUVEAU apparaît ; jamais depuis un instantané d'avant ce jalon.
assert.deepEqual(evenementsV1(p0, p0), []);
const p1 = inst({ lastTossAt: 2000, history: [{ at: 2000, cost: 2e7, reward: { adventureStats: 20, ap: 7 }, boost: { type: "power" } }, { at: 1000, cost: 5e6, reward: { experience: 12 } }] }, { totalSpins: 3, history: [{ reward: { ap: 100 } }] });
assert.deepEqual(evenementsV1(p0, p1), [{ type: "puits", donnees: { cout: 2e7, recompense: { adventureStats: 20, ap: 7 }, boost: true } }]);
const p2 = inst({ lastTossAt: 1000, history: [{ cost: 5e6, reward: { experience: 12, ap: 6 } }] }, { totalSpins: 4, history: [{ reward: { items: { energyPotionAlpha: 2, poop: 1 } } }] });
assert.deepEqual(evenementsV1(p0, p2), [{ type: "roue", donnees: { recompense: { items: 3 } } }]);
assert.deepEqual(evenementsV1({ bossMax: 1, succes: [], titans: {}, defis: {}, rebirths: 0 }, p1).map((e) => e.type), [], "ancien instantané : pas de comparaison");

// Phrases côté lecteur, avec anti-spoil.
const fenetre = { __SOREAL_IDLE_ACTIVITE_V1__: () => null };
const ctx = { window: fenetre, document: { addEventListener() {}, getElementById: () => null, createElement: () => ({ style: {}, setAttribute() {}, appendChild() {} }), head: { appendChild() {} }, body: { appendChild() {} } }, setInterval() {}, setTimeout() {}, localStorage: { getItem: () => null, setItem() {} }, console };
ctx.globalThis = ctx; vm.createContext(ctx);
vm.runInContext(readFileSync("cloudflare/public/modules/flux-v1.js", "utf8") + "\n;globalThis.__phrase__ = (typeof phrase==='function'?phrase:null);", ctx);
const phrase = ctx.__phrase__;
if (phrase) {
  const connus = (menus) => ({ zones: [], bossMax: 5, connus: { boss: {}, titan: {}, succes: {}, menus } });
  const tout = connus({ moneyPit: true, spendExp: true, sellout: true, aventure: true, wandoos: true, yggdrasil: true });
  const peu = connus({ moneyPit: true });
  const aucun = connus({});
  assert.equal(phrase({ type: "puits", nom: "Ana", donnees: { cout: 5e6, recompense: { experience: 12, ap: 6 } } }, tout).texte, "Ana a jeté 5 M d’or dans le puits : +12 EXP et +6 AP");
  assert.equal(phrase({ type: "puits", nom: "Ana", donnees: { cout: 2e7, recompense: { adventureStats: 20, ap: 7 }, boost: true }, moi: true }, tout).texte, "Tu as jeté 20 M d’or dans le puits : +20 stats d’Aventure et +7 AP et un boost");
  assert.equal(phrase({ type: "puits", nom: "Ana", donnees: { cout: 5e6, recompense: { experience: 12, ap: 6 } } }, peu).texte, "Ana a jeté 5 M d’or dans le puits : une récompense", "récompenses de systèmes inconnus : jamais nommées");
  assert.equal(phrase({ type: "puits", nom: "Ana", donnees: { cout: 5e6, recompense: { wandoosLevels: 2, seeds: 10 } } }, peu).texte, "Ana a jeté 5 M d’or dans le puits : une récompense");
  assert.equal(phrase({ type: "puits", nom: "Ana", donnees: { cout: 5e6, recompense: { experience: 12 } } }, aucun), null, "menu Money Pit inconnu : rien");
  assert.equal(phrase({ type: "roue", nom: "Ana", donnees: { recompense: { ap: 100 } } }, tout).texte, "Ana a tourné la roue : +100 AP");
  assert.equal(phrase({ type: "roue", nom: "Ana", donnees: { recompense: { items: 3 } } }, tout).texte, "Ana a tourné la roue : un lot d’objets");
  assert.equal(phrase({ type: "roue", nom: "Ana", donnees: { recompense: { ap: 100 } } }, peu).texte, "Ana a tourné la roue : une récompense");
  assert.equal(phrase({ type: "roue", nom: "Ana", donnees: { recompense: { ap: 100 } } }, aucun), null);
}
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
assert.ok(ui.includes("'moneyPit','sang','aventure','wandoos','yggdrasil',"), "le lecteur connaît ces menus pour l'anti-spoil");
console.log("idle-flux-puits-roue-v1: OK");
