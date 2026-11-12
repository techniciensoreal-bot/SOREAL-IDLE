// Audit 2026-11-12 : metaNgu des statistiques est copié paresseusement (à la première lecture) ; chaque appel garde SA copie, une affectation le remplace, l'ordre des clés ne change pas.
import assert from "node:assert/strict";
import "../src/idle-sqlite-runtime.js";
import { statsJoueurSorealIdle_ } from "../src/idle-runtime-collection.js";

const gros = { remplissage: "x".repeat(2500), clicsTotal: 7, niveau: { a: [1, 2, 3], b: { c: 1 } } };
const texte = JSON.stringify({ clicsTotal: 12, metaNgu: gros, vus: ["a", "b"] });
assert.ok(texte.length > 2000, "le texte passe par le mémo (plus de 2000 caractères)");

const a = statsJoueurSorealIdle_(texte);
const b = statsJoueurSorealIdle_(texte);
assert.equal(a.clicsTotal, 12);
// copie indépendante par appel
a.metaNgu.niveau.b.c = 99; a.metaNgu.niveau.a.push(4);
assert.equal(b.metaNgu.niveau.b.c, 1, "la copie d'un autre appel n'est pas touchée");
assert.deepEqual(b.metaNgu.niveau.a, [1, 2, 3]);
const c = statsJoueurSorealIdle_(texte);
assert.equal(c.metaNgu.niveau.b.c, 1, "l'objet gardé n'a jamais été modifié");
// lecture répétée : le même objet
assert.equal(c.metaNgu, c.metaNgu);
// affectation
c.metaNgu = { remplace: true };
assert.deepEqual(c.metaNgu, { remplace: true });
// absent -> null ; texte court -> comportement d'avant
assert.equal(statsJoueurSorealIdle_(JSON.stringify({ clicsTotal: 1 })).metaNgu, null);
assert.equal(statsJoueurSorealIdle_(JSON.stringify({ metaNgu: { z: 1 } })).metaNgu.z, 1);
// sérialisation : metaNgu présent, ordre des clés stable
const d = statsJoueurSorealIdle_(texte);
const cles = Object.keys(d);
assert.ok(cles.includes("metaNgu"));
assert.equal(JSON.parse(JSON.stringify(d)).metaNgu.niveau.b.c, 1);
assert.deepEqual(Object.keys(statsJoueurSorealIdle_(texte)), cles);
console.log("idle-stats-metangu-paresseux-v1 : OK");
