// Norman (2026-10-29) : Machine temporelle : les pièces d'or sortent en file régulière (aucune pièce qui fait des haut-bas) ; dix tas d'Or de tailles différentes selon l'unité du butin (K, M, B, T… Uvg…).
import fs from "node:fs";
import assert from "node:assert/strict";
const s = fs.readFileSync("cloudflare/public/modules/machine-dessin-v1.js", "utf8").replace(/\r\n/g, "\n");
assert.ok(s.includes("var CHUTE_PIECE=.5;") && s.includes("cad pièces par seconde") && s.includes("g.__tmmAnim.effect.updateTiming(opt)"), "file régulière : même chute pour toutes, seule la cadence change");
assert.ok(!s.includes("playbackRate=rythme;") && !s.includes("rang%pas===0"), "plus de vitesse variable ni de pièces masquées au hasard du rythme");
assert.ok(s.includes("var SEUILS_TAS=[0,2,3,4,6,9,13,18,22,25];") && s.includes("function niveauTas(or)") && s.includes('id="tmmTas"'), "dix niveaux de tas, d'après l'unité du butin");
// les niveaux : sous M, M (2), B, T (4)… Uvg (22)
const m = /var SEUILS_TAS=(\[[^\]]*\]);\s*function niveauTas\(or\)\{([\s\S]*?)\n  \}/.exec(s);
const niveau = new Function("or", "var SEUILS_TAS=" + m[1] + ";" + m[2]);
assert.equal(niveau(0), 0); assert.equal(niveau(999), 0); assert.equal(niveau(5e3), 0);
assert.equal(niveau(3e6), 1, "M"); assert.equal(niveau(4e9), 2, "B"); assert.equal(niveau(2e12), 3, "T");
assert.equal(niveau(4e66), 8, "Uvg"); assert.equal(niveau(1e80), 9, "le dernier tas ne grossit plus");
const tous = new Set([0, 3e6, 4e9, 2e12, 2e18, 1e27, 5e39, 3e54, 4e66, 1e75].map(niveau));
assert.equal(tous.size, 10, "dix tas différents");
assert.ok(s.includes("tas.innerHTML=tasInterieur(nv)"), "le tas change avec le butin à chaque synchro");
console.log("idle-machine-pieces-tas-v1 : OK");
