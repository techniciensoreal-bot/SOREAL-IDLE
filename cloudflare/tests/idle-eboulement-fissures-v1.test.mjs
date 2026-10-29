// Norman (2026-10-29) : « quand le boss casse, les morceaux ne correspondent pas aux fissures » : les fissures de l'éboulement suivent les lignes de coupe des blocs.
import fs from "node:fs";
import assert from "node:assert/strict";
const s = fs.readFileSync("cloudflare/public/modules/morts-boss-nouvelles-v1.js", "utf8").replace(/\r\n/g, "\n");
assert.ok(s.includes("k.fissures.push({seg:pts[fj].slice()") && s.includes("col.push(pts[fk][fi])"), "fissures = lignes de la grille des blocs");
assert.ok(s.includes("var poly=[pts[jj][ii],pts[jj][ii+1],pts[jj+1][ii+1],pts[jj+1][ii]]"), "les blocs sont découpés par les mêmes points");
assert.ok(!s.includes("ax+=(rnd(f*17+q)-.5)"), "plus de fissures au hasard");
console.log("idle-eboulement-fissures-v1 : OK");
