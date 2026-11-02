// Audit de fluidité 2026-11-02 : en anglais, le traducteur change le texte affiché en place ; le garde d'écriture compare avec le DOM et ne reconnaissait jamais « déjà écrit » :
// les compteurs étaient réécrits (et retraduits) à chaque image. Le garde retient maintenant la dernière valeur et le nœud de texte créé.
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

class Noeud {
  constructor(t) { this.nodeType = t; this.enfants = []; this.nodeValue = ""; }
  get firstChild() { return this.enfants[0] || null; }
  get lastChild() { return this.enfants[this.enfants.length - 1] || null; }
}
let ecritures = 0;
const proto = { get firstChild() { return this.enfants[0] || null; }, get lastChild() { return this.enfants[this.enfants.length - 1] || null; } };
Object.defineProperty(proto, "textContent", {
  configurable: true, enumerable: false,
  get() { return this.enfants.map((e) => e.nodeValue).join(""); },
  set(v) { ecritures += 1; const t = new Noeud(3); t.nodeValue = String(v); this.enfants = v === "" ? [] : [t]; },
});
const proto2 = Object.create(proto); proto2.nodeType = 1;
const ctx = { Node: { prototype: proto }, Object, String };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync("cloudflare/public/modules/perf-texte-v1.js", "utf8"), ctx);
const el = Object.create(proto2); el.nodeType = 1; el.enfants = [];

el.textContent = "Energy: 5";                      // 1re écriture
assert.equal(ecritures, 1);
el.textContent = "Energy: 5"; assert.equal(ecritures, 1, "même texte, même nœud : rien");
el.enfants[0].nodeValue = "Énergie : 5";            // le traducteur change le nœud en place
el.textContent = "Energy: 5"; assert.equal(ecritures, 1, "texte traduit en place : une seule observation, pas de réécriture");
el.textContent = "Energy: 5"; assert.equal(ecritures, 1, "traduction stable : toujours rien");
el.textContent = "Energy: 6"; assert.equal(ecritures, 2, "texte différent : écrit");
const avant = ecritures;
el.textContent = "texte d'un autre module";   // un autre module écrit son texte (nouveau nœud)
el.textContent = "Energy: 6";                 // le compteur reprend la main : doit réécrire
assert.equal(ecritures, avant + 2, "texte remplacé par un autre module : réécrit comme avant");
console.log("idle-perf-texte-traduit-v1 : OK");
