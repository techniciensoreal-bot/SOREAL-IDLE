import assert from "node:assert/strict";
import { lireSrc } from "./_src-sources.mjs";
import vm from "node:vm";
import { readFileSync } from "node:fs";

/*
 * Boutique AP (wiki NGU Idle, 4G's Sellout Shop) : boutons de pourcentage personnalisés (énergie/magie ×2, idle, ressource 3 ×2 + idle) et NGU Cap Modifier. Un bouton n'existe que si l'achat est fait ; sa valeur est choisie par le joueur,
 * bornée à 1-100, gardée sur l'appareil ; il écrit dans l'Input comme Max / 1/2 / 1/4.
 */
const src = readFileSync("cloudflare/public/modules/perso-boutons-v1.js", "utf8");
const stockage = {};
const appels = [];
let achats = [];
const fenetre = {
  localStorage: { getItem: (k) => (k in stockage ? stockage[k] : null), setItem: (k, v) => { stockage[k] = String(v); } },
  __SOREAL_IDLE_META_HOST_V130__: { getIdleEtat: () => ({ systemes: { selloutShop: { catalog: achats.map((id) => ({ id, purchased: 1 })) } } }) },
  __SOREAL_IDLE_ALLOC_V1__: { preset: (res, source, f) => appels.push([res, source, f]), saisir: (n) => appels.push(["saisir", n]) },
  prompt: () => null,
  alert() {}
};
const document = { hidden: false, querySelector: () => null, querySelectorAll: () => [], addEventListener() {}, createElement: () => ({ style: {}, set textContent(v) {} }), head: { appendChild() {} }, body: null };
vm.runInNewContext(src, { window: fenetre, document, localStorage: fenetre.localStorage, setInterval: () => 0, setTimeout: (f) => 0, requestAnimationFrame: () => 0, MutationObserver: undefined, JSON, Math, Number, String, Array, Object });
const api = fenetre.__SOREAL_IDLE_PERSO_PCT_V1__;
assert.equal(api.pourcentage("em1"), 10, "10 % au départ (le wiki ne publie aucune valeur)");
assert.equal(api.definir("em1", "25"), true);
assert.equal(api.pourcentage("em1"), 25);
assert.equal(api.definir("em1", "0"), true, "borné à 1");
assert.equal(api.pourcentage("em1"), 1);
assert.equal(api.definir("em1", "250"), true);
assert.equal(api.pourcentage("em1"), 100, "borné à 100");
assert.equal(api.definir("em1", "abc"), false, "valeur invalide refusée");
assert.equal(api.definir("slotInconnu", "5"), false);
assert.equal(api.definir("nguCap", "40,5"), true);
assert.equal(api.pourcentNgu(), 40.5);
api.definir("em2", "30");
api.appliquer("energy", "cap", "em2");
assert.deepEqual([...appels.pop()], ["energy", "cap", 0.3], "le bouton écrit 30 % du plafond");
api.appliquer("magic", "idle", "emIdle");
assert.deepEqual([...appels.pop()], ["magic", "idle", 0.1], "idle : 10 % par défaut");
// chaque article correspond à un slot
const attendu = { em1: "customEnergyMagicButtons", em2: "moreCustomEnergyMagicButtons", emIdle: "customIdleEnergyMagicButtons", r3a: "customResource3Button", r3b: "anotherCustomResource3Button", r3Idle: "customIdleResource3Button" };
for (const [slot, achat] of Object.entries(attendu)) assert.equal(api.slots[slot].achat, achat, slot);
assert.equal(JSON.stringify(api.slots.r3a.res), "[\"r3\"]");
assert.equal(JSON.stringify(api.slots.em1.res), "[\"energy\",\"magic\"]");
assert.equal(api.slots.emIdle.source, "idle");
assert.equal(api.slots.r3Idle.source, "idle");

// Boutique EXP, Misc : Custom Input Button 1 à 4 (wiki Experience : 50 / 100 / 500 / 1000 EXP) -- un nombre choisi par le joueur placé dans Input.
assert.equal(api.valeurInput(1), 100); assert.equal(api.valeurInput(4), 100000);
assert.equal(api.definirInput(2, "12 345"), true); assert.equal(api.valeurInput(2), 12345);
assert.equal(api.definirInput(2, "0"), false, "minimum 1"); assert.equal(api.definirInput(9, "5"), false, "seulement les boutons 1 à 4");
assert.equal(api.definirInput(3, "abc"), false);
api.appliquerInput(2);
assert.deepEqual([...appels.pop()], ["saisir", 12345], "le bouton place son nombre dans Input");
const srv = lireSrc("idle-ngu-progression.js");
for (const [id, cout] of [["customInput1", 50], ["customInput2", 100], ["customInput3", 500], ["customInput4", 1000]]) assert.ok(srv.includes(id + ": Object.freeze({ name: \"Custom Input Button " + id.slice(-1) + "\", cost: () => " + cout + ", gain: 1, max: 1 })"), id + " : " + cout + " EXP");

const idx = readFileSync("cloudflare/public/index.html", "utf8");
assert.ok(idx.includes("/modules/perso-boutons-v1.js?v=") && idx.indexOf("barre-allocation-v1.js") < idx.indexOf("perso-boutons-v1.js"), "module chargé après la barre d'allocation");
assert.ok(src.includes("nguCapModifier") && src.includes("preset('cap',1)"), "NGU Cap Modifier : le bouton Max des NGU applique le pourcentage choisi");
console.log("idle-boutique-ap-boutons-pourcentage-v1: OK");
