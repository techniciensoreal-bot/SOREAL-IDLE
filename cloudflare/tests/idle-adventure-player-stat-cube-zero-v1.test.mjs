import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-29) : « ne plus avoir (+0 cube) mais juste (+0) ». Refonte du 2026-11-11 (Norman : « je ne veux plus puissance de base, en vert le stuff et en mauve le cube : je veux le total déjà additionné, écrit en vert ») :
 * la ligne n'affiche plus que le TOTAL ; les tags (+bonus) et (+cube) sont vidés, donc plus aucun « (+0 cube) » possible. La provenance de chaque part est dans le « i » (ouvrirDetailStat_).
 */
const source = readFileSync("cloudflare/public/modules/adventure-scene-v79.js", "utf8");
const debut = source.indexOf("function playerStat(key,base,total,precision,cubeContribution){");
const fin = source.indexOf("\n    }\n", debut) + "\n    }\n".length;
assert.ok(debut > 0 && fin > debut, "playerStat introuvable");
const corps = source.slice(debut, fin);
assert.ok(corps.includes("ecrire_(baseEl,format_(total,precision))"), "la ligne affiche le total déjà additionné");
assert.ok(corps.includes("classList.toggle('soreal-idle-v79-stat-vert',total>base0+1e-9)"), "vert dès qu'il y a un bonus au-dessus de la base (même vert que le multiplicateur de drop)");
for (const n of ["stat-bonus", "stat-bloque", "stat-cube", "stat-cube-bloque"]) assert.ok(corps.includes("'" + n + "'"), "le tag " + n + " est vidé");
assert.ok(!/ cube\)/.test(corps), "plus de « (+x cube) » dans la ligne");
console.log("idle-adventure-player-stat-cube-zero-v1: OK");
