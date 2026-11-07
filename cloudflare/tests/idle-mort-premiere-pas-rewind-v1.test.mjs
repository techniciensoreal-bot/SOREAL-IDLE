import assert from "node:assert/strict";
import fs from "node:fs";
/*
 * Norman (2026-11-07) : « la première animation de mort du joueur dans le tuto est le rewind ; je ne veux pas que ce soit le rewind exceptionnellement pour ce premier combat. Ne décale pas le reste. » La première mort joue
 * une autre animation, mais la file garde « rewind » comme jouée : la deuxième mort est la même qu'avant ce changement (clignote), puis tout suit.
 */
const src = fs.readFileSync("cloudflare/public/modules/mort-joueur-v1.js", "utf8");
const i = src.indexOf("var dernierMemoire_=''"), j = src.indexOf("function jouer(hote,variante)");
assert.ok(i > 0 && j > i);
const mem = new Map();
const suivante = new Function("localStorage", src.slice(i, j) + "\nreturn suivante_;")({ getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, v) });
const liste = ["rewind", "clignote", "a", "b", "c"];
assert.equal(suivante(liste), "c", "première mort : pas le rembobinage");
assert.equal(mem.get("soreal_idle_file_mort_joueur_v1"), "rewind", "la file compte « rewind » comme jouée");
assert.deepEqual([suivante(liste), suivante(liste), suivante(liste), suivante(liste), suivante(liste)], ["clignote", "a", "b", "c", "rewind"], "la suite n'est pas décalée, le cycle revient ensuite au rembobinage");
console.log("idle-mort-premiere-pas-rewind-v1: OK");
