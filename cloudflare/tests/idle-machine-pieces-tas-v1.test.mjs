// Norman (2026-10-29) : Machine temporelle : les pièces d'or sortent en file régulière (aucune pièce qui fait des haut-bas) ; dix tas d'Or de tailles différentes.
// Norman (2026-11-08) : « j'aimerais que le paquet d'or soit de plus en plus gros suivant si on fait des T/s ou des Qa/s de plus en plus gros » : la taille suit l'OR PAR SECONDE (brut), plus le butin d'une barre.
import fs from "node:fs";
import assert from "node:assert/strict";
const s = fs.readFileSync("cloudflare/public/modules/machine-dessin-v1.js", "utf8").replace(/\r\n/g, "\n");
assert.ok(s.includes("var CHUTE_PIECE=.5;") && s.includes("280 px/s") && s.includes("g.__tmmAnim.effect.updateTiming(opt)"), "file régulière : même chute pour toutes, seule la cadence change");
assert.ok(!s.includes("playbackRate=rythme;") && !s.includes("rang%pas===0"), "plus de vitesse variable ni de pièces masquées au hasard du rythme");
assert.ok(s.includes("var SEUILS_TAS=[0,3,4,5,6,7,9,12,16,21];") && s.includes("function niveauTas(orParSeconde)") && s.includes('id="tmmTas"'), "dix niveaux de tas, d'après l'unité de l'or par seconde");
// la fonction réelle est extraite du fichier
const m = /var SEUILS_TAS=(\[[^\]]*\]);\s*function niveauTas\(orParSeconde\)\{([\s\S]*?)\n  \}/.exec(s);
assert.ok(m, "fonction niveauTas retrouvée");
const niveau = new Function("orParSeconde", "var SEUILS_TAS=" + m[1] + ";" + m[2]);
assert.equal(niveau(0), 0); assert.equal(niveau(999), 0); assert.equal(niveau(5e8), 0, "sous B/s");
assert.equal(niveau(5e9), 1, "B/s"); assert.equal(niveau(2e12), 2, "T/s"); assert.equal(niveau(2e15), 3, "Qa/s");
assert.equal(niveau(1.3e15), 3, "l'or par seconde de Norman (1,3 Qa/s)");
assert.equal(niveau(2e18), 4, "Qi/s"); assert.equal(niveau(2e21), 5, "Sx/s"); assert.equal(niveau(2e27), 6, "Oc/s");
assert.equal(niveau(2e36), 7); assert.equal(niveau(2e48), 8); assert.equal(niveau(2e63), 9);
assert.equal(niveau(1e80), 9, "le dernier tas ne grossit plus");
const jalons = [0, 5e9, 2e12, 2e15, 2e18, 2e21, 2e27, 2e36, 2e48, 2e63];
for (let i = 1; i < jalons.length; i++) assert.ok(niveau(jalons[i]) > niveau(jalons[i - 1]), "chaque palier est plus gros que le précédent");
assert.equal(new Set(jalons.map(niveau)).size, 10, "dix tas différents");
assert.ok(s.includes("tas.innerHTML=tasInterieur(nv)") && s.includes("niveauTas(v.grossGps)"), "le tas change avec l'or brut par seconde à chaque synchro");
const page = fs.readFileSync("cloudflare/public/modules/augmentations-page-v1.js", "utf8");
assert.ok(page.includes("tas:D.niveauTas(H.idleNombre_(vue.grossGps))"), "le premier dessin de la machine part du bon tas");
console.log("idle-machine-pieces-tas-v1 : OK");
