import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { instantaneJoueurV1, evenementsV1 } from "../src/idle-flux-v1.js";

/*
 * « En direct » (Norman, 2026-10-10) : « quand on nuke, ça doit être dit : Sébastien a utilisé le bouton Nuke et a tué 40 boss d'un coup, avec des variantes qui donnent toujours le nombre de boss tués ;
 * moins il y en a, plus on peut en rigoler. »
 */
const rt = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");
assert.ok(rt.includes("fluxNukes:Math.max(0,Math.floor(nombreSorealIdle_(s.fluxNukes,0)))") && rt.includes("fluxNukeDernier:Math.max(0,Math.floor(nombreSorealIdle_(s.fluxNukeDernier,0)))"), "les compteurs survivent à la lecture des statistiques");
assert.ok(rt.includes("if (defeated.length > 0) {\n      stats.fluxNukes =") && rt.includes("stats.fluxNukeDernier = defeated.length;"), "le Nuke compte les boss tués");

const inst = (extra) => instantaneJoueurV1({ stats: { metaNgu: {}, ...extra } });
const a = inst({ fluxNukes: 2, fluxNukeDernier: 40 });
assert.deepEqual([a.nukes, a.nukeDernier], [2, 40]);
assert.deepEqual([inst({}).nukes, inst({}).nukeDernier], [0, 0]);
assert.deepEqual(evenementsV1(inst({ fluxNukes: 2, fluxNukeDernier: 40 }), inst({ fluxNukes: 2, fluxNukeDernier: 40 }), {}), []);
assert.deepEqual(evenementsV1(inst({ fluxNukes: 2, fluxNukeDernier: 40 }), inst({ fluxNukes: 3, fluxNukeDernier: 7 }), {}), [{ type: "nuke", donnees: { n: 7 } }]);
assert.deepEqual(evenementsV1({ bossMax: 5, succes: [], titans: {}, defis: {}, rebirths: 0 }, inst({ fluxNukes: 9, fluxNukeDernier: 3 }), {}).map((e) => e.type), [], "ancien instantané : pas de comparaison");

const ctx = { window: { __SOREAL_IDLE_ACTIVITE_V1__: () => null }, document: { addEventListener() {}, getElementById: () => null, createElement: () => ({ style: {}, setAttribute() {}, appendChild() {} }), head: { appendChild() {} }, body: { appendChild() {} } }, setInterval() {}, setTimeout() {}, localStorage: { getItem: () => null, setItem() {} }, console };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(readFileSync("cloudflare/public/modules/flux-v1.js", "utf8"), ctx);
const { phrase } = ctx.window.__SOREAL_IDLE_FLUX_V1__;
const lecteur = { zones: [], bossMax: 0, connus: { boss: {}, titan: {}, succes: {}, menus: {}, pieces: {} } };
const p = (id, n, moi) => phrase({ id, type: "nuke", nom: "Sébastien", donnees: { n }, moi }, lecteur).texte;

assert.equal(p(0, 40), "Sébastien a utilisé le bouton Nuke et a tué 40 boss d’un coup", "la phrase de base pour beaucoup de boss");
assert.equal(p(0, 1), "Sébastien a utilisé le bouton Nuke pour tuer… 1 boss. Une bombe atomique pour une mouche");
assert.equal(p(0, 3), "Sébastien a utilisé le bouton Nuke et a tué 3 boss d’un coup, c’est un début");
assert.equal(p(0, 1500, true), "Tu as utilisé le bouton Nuke et as tué " + (1500).toLocaleString("fr-FR") + " boss");
// Le nombre de boss tués figure TOUJOURS dans la phrase, quelle que soit la variante.
for (const n of [1, 2, 4, 5, 40, 275]) {
  const attendu = n.toLocaleString("fr-FR");
  const textes = Array.from({ length: 60 }, (_, i) => p(i, n));
  assert.ok(textes.every((t) => t.includes(attendu)), "nombre manquant pour n=" + n + " : " + textes.find((t) => !t.includes(attendu)));
  assert.ok(new Set(textes).size >= (n === 4 || n === 2 ? 15 : 20), "variantes pour n=" + n + " : " + new Set(textes).size);
}
// Moins il y en a, plus on rigole : le cas d'un seul boss ne se moque pas pareil que 40.
assert.notEqual(p(1, 1), p(1, 40));
assert.ok(!p(5, 40).includes("mouche"));
console.log("idle-flux-nuke-v1: OK");
