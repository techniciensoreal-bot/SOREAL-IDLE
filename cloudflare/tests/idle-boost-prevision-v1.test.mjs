import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";

/*
 * A + clic sur une arme équipée (Norman, 2026-10-02 : « mes items ne sont pas aspirés alors qu'il y a de la place sur mon marteau ») :
 * le client prévoit ce que le serveur absorbera (mêmes règles : verrouillés et cases d'automerge exclus, marge de stat requise), n'efface à
 * l'écran que ces boosts-là, et explique la raison quand rien n'est absorbé.
 */
const code = readFileSync("cloudflare/public/modules/inventory-auto-v1.js", "utf8");
const classes = new Set();
const noeuds = [];
const document = {
  addEventListener() {},
  getElementById: () => null,
  querySelector(sel) {
    const m = /data-item-id="([^"]+)"/.exec(sel);
    if (!m) return null;
    const n = { id: m[1], classList: { add: (c) => classes.add(m[1] + ":" + c), remove: (c) => classes.delete(m[1] + ":" + c) } };
    noeuds.push(n);
    return n;
  },
  querySelectorAll: () => [],
};
let rendu = null;
const envoyes = [];
const fenetre = {
  document,
  addEventListener() {},
  __actionMetaV47__: (p) => envoyes.push(p),
  __SOREAL_IDLE_RUNTIME_V1__: { onRender: (f) => { rendu = f; }, getState: () => Promise.resolve(etat) },
};
const etat = {
  systemes: {
    inventoryAuto: { mergeSlots: 1 },
    adventure: {
      inventorySlots: ["b0", "b1", "b2", "b3", "b4", "b5", "b6"],
      inventory: [
        { id: "m", kind: "equipment", name: "Marteau", level: 1, power: 100, toughness: 50, basePower: 100, baseToughness: 50 }, // power au plafond 101 ? non : 100 < 101
        { id: "b0", kind: "boost", boostType: "power" },                  // case d'automerge : exclu
        { id: "b1", kind: "boost", boostType: "power", locked: true },    // verrouillé : exclu
        { id: "b2", kind: "boost", boostType: "power" },                  // marge : absorbé
        { id: "b3", kind: "boost", boostType: "toughness" },              // 50 < 50,5 : absorbé
        { id: "b4", kind: "boost", boostType: "special" },                // pas de Specials connus : incertain
      ],
    },
  },
};
const ctx = vm.createContext({ window: fenetre, document, setTimeout: (f) => { void f; return 0; }, console });
vm.runInContext(code, ctx);
const API = fenetre.__SOREAL_IDLE_INVENTORY_AUTO_V1__;
assert.ok(API && typeof API.prevoirBoosts === "function" && typeof API.expliquerAucunBoost === "function");
// Le module lit l'état via le runtime : on déclenche un rafraîchissement.
rendu();
await new Promise((r) => setImmediate(r));

let p = API.prevoirBoosts("m");
assert.equal(JSON.stringify(p.ok), JSON.stringify(["b2", "b3"]), "seuls les boosts qui entrent");
assert.equal(p.verrouilles, 1);
assert.equal(p.automerge, 1);
assert.equal(p.incertains, 1);

// Plus de marge : rien ne doit être effacé, et la raison est donnée.
etat.systemes.adventure.inventory[0].power = 101;
etat.systemes.adventure.inventory[0].toughness = 50.5;
rendu();
await new Promise((r) => setImmediate(r));
p = API.prevoirBoosts("m");
assert.equal(p.ok.length, 0);
assert.equal(p.pleins.power, 1);
assert.equal(p.pleins.toughness, 1);
const phrase = API.expliquerAucunBoost("m");
assert.ok(/Marteau/.test(phrase) && /Power déjà au maximum/.test(phrase) && /Toughness déjà au maximum/.test(phrase), phrase);
assert.ok(/protégé/.test(phrase) && /automerge/.test(phrase), phrase);

// Le serveur ignore un objet équipé sans boost : message simple.
etat.systemes.adventure.inventory = etat.systemes.adventure.inventory.filter((o) => o.kind !== "boost");
rendu();
await new Promise((r) => setImmediate(r));
assert.equal(API.expliquerAucunBoost("m"), "Aucun boost dans le sac.");

// Le client affiche cette phrase quand le serveur répond « 0 absorbé » (au lieu de « Progression mise à jour »).
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
assert.ok(meta.includes("ia.expliquerAucunBoost(payload.targetId)"));
console.log("idle-boost-prevision-v1: OK");
