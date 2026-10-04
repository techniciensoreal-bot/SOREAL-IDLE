import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { instantaneJoueurV1, evenementsV1 } from "../src/idle-flux-v1.js";

/* « En direct » (Norman, 2026-10-04) : combat de titan lancé, perdu (la victoire existait déjà). Compteurs adventure.titanFlux {starts, losses, last}. */
const inst = (tf, titans) => instantaneJoueurV1({ stats: { metaNgu: { adventure: { titanFlux: tf, titans: titans || {} } } } });
assert.deepEqual([inst().titanCombats, inst().titanPertes, inst().titanDernier], [0, 0, ""]);
const a = inst({ starts: 2, losses: 1, last: "t1" });
assert.deepEqual([a.titanCombats, a.titanPertes, a.titanDernier], [2, 1, "t1"]);
assert.deepEqual(evenementsV1(a, inst({ starts: 2, losses: 1, last: "t1" })), []);
assert.deepEqual(evenementsV1(a, inst({ starts: 3, losses: 1, last: "t2" }), { titan: (id) => "N" + id }), [{ type: "titanCombat", donnees: { id: "t2", nom: "Nt2" } }]);
assert.deepEqual(evenementsV1(a, inst({ starts: 3, losses: 2, last: "t2" })).map((e) => e.type), ["titanCombat", "titanPerdu"]);
assert.deepEqual(evenementsV1({ bossMax: 1, succes: [], titans: {}, defis: {}, rebirths: 0 }, a).map((e) => e.type), [], "ancien instantané");
// La victoire reste annoncée par le compteur de kills.
assert.deepEqual(evenementsV1(inst({}, { t1: { kills: 0 } }), inst({}, { t1: { kills: 1 } })).map((e) => e.type), ["titan"]);

const src = readFileSync("cloudflare/src/idle-adventure-v47.js", "utf8");
assert.ok(src.includes('fluxTitanV1(s,"starts",pre.id)') && src.includes('if(s.fight.titanId)fluxTitanV1(s,"losses",s.fight.titanId);'));

const ctx = { window: {}, document: { addEventListener() {}, getElementById: () => null, createElement: () => ({ style: {}, setAttribute() {}, appendChild() {} }), head: { appendChild() {} }, body: { appendChild() {} } }, setInterval() {}, setTimeout() {}, localStorage: { getItem: () => null, setItem() {} }, console };
ctx.globalThis = ctx; vm.createContext(ctx);
vm.runInContext(readFileSync("cloudflare/public/modules/flux-v1.js", "utf8") + "\n;globalThis.__phrase__ = (typeof phrase==='function'?phrase:null);", ctx);
const phrase = ctx.__phrase__;
if (phrase) {
  const connu = { zones: [], bossMax: 5, connus: { boss: {}, titan: { t1: "Jake" }, succes: {}, menus: { titans: true } } };
  const inconnu = { zones: [], bossMax: 5, connus: { boss: {}, titan: {}, succes: {}, menus: {} } };
  assert.equal(phrase({ type: "titanCombat", nom: "Ana", donnees: { id: "t1" } }, connu).texte, "Ana a lancé le combat contre le Titan Jake");
  assert.equal(phrase({ type: "titanPerdu", nom: "Ana", donnees: { id: "t1" } }, connu).texte, "Ana a perdu contre le Titan Jake");
  assert.equal(phrase({ type: "titanPerdu", nom: "Ana", donnees: { id: "t9" }, moi: true }, connu).texte, "Tu as perdu contre un Titan", "titan inconnu : jamais nommé");
  assert.equal(phrase({ type: "titanCombat", nom: "Ana", donnees: { id: "t1" } }, inconnu), null, "menu Titans inconnu : rien");
}
console.log("idle-flux-titan-combat-v1: OK");
