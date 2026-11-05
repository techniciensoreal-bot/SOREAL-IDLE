import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

/*
 * Plan design/PLAN-MOTEUR-UNIQUE.md, étape 2 : la copie profonde de l'état (une dizaine par opération, 1,37 ms sur l'état de Norman) devient copieJsonV1 (0,27 ms). Elle doit donner EXACTEMENT ce que donnait
 * JSON.parse(JSON.stringify(v)) : nombres non finis -> null, undefined et fonctions ignorés dans un objet, null dans un tableau, toJSON appelé, clés dans le même ordre.
 */
const { copieJsonV1 } = await import(pathToFileURL(process.cwd() + "/cloudflare/src/idle-copie-json-v1.js").href);
const { clone } = await import(pathToFileURL(process.cwd() + "/cloudflare/src/idle-ngu-catalogues.js").href);
const ref = (v) => JSON.parse(JSON.stringify(v));
const egal = (v, msg) => { assert.equal(JSON.stringify(copieJsonV1(v)), JSON.stringify(ref(v)), msg); assert.deepEqual(copieJsonV1(v), ref(v), msg); };

egal({ a: 1, b: "x", c: true, d: null, e: [1, 2, { f: 3 }], g: { h: { i: [] } } }, "données ordinaires");
egal({ n: NaN, i: Infinity, m: -Infinity, z: 0, neg: -0, grand: 1.7e308, petit: 5e-324 }, "nombres non finis -> null, -0 et extrêmes");
egal({ u: undefined, f() {}, s: Symbol("x"), ok: 1 }, "undefined, fonctions et symboles ignorés dans un objet");
egal([1, undefined, () => 1, NaN, "a", null], "tableau : undefined / fonction -> null");
egal({ d: new Date(86400000), nested: { d2: new Date(0) } }, "toJSON appelé (dates)");
egal({ toJSON() { return { remplace: [1, undefined] }; } }, "toJSON renvoyant un objet");
egal({ ordre: 1, a: 2, "10": 3, "2": 4, b: 5 }, "même ordre des clés (entiers d'abord, puis insertion)");
egal("texte", "chaîne seule"); egal(42, "nombre seul"); egal(null, "null seul"); egal([], "tableau vide"); egal({}, "objet vide");
// une copie ne partage rien avec l'original
const src = { a: { b: [1, { c: 2 }] } }; const cp = copieJsonV1(src); cp.a.b[1].c = 99; cp.a.b.push(3);
assert.equal(src.a.b[1].c, 2, "copie indépendante"); assert.equal(src.a.b.length, 2);
// clone() garde l'ancien comportement pour undefined (erreur) et sinon passe par la copie rapide
assert.throws(() => clone(undefined));
assert.deepEqual(clone({ x: [1, NaN] }), { x: [1, null] });
// grosse structure aléatoire déterministe : même résultat que l'aller-retour JSON
let graine = 12345; const alea = () => (graine = (graine * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
function gen(p) { const r = alea(); if (p <= 0 || r < 0.25) return [1, -3.5, "t", true, null, undefined, NaN, 1e300][Math.floor(alea() * 8)]; if (r < 0.6) { const a = []; for (let i = 0; i < 1 + alea() * 4; i++) a.push(gen(p - 1)); return a; } const o = {}; for (let i = 0; i < 1 + alea() * 5; i++) o["k" + Math.floor(alea() * 20)] = gen(p - 1); return o; }
for (let i = 0; i < 300; i++) { const v = gen(5); if (v !== undefined && typeof v !== "function") egal(v, "aléatoire " + i); }
console.log("idle-clone-json-v1: OK");
