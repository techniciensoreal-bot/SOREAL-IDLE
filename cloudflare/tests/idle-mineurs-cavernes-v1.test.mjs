import assert from "node:assert/strict";
import fs from "node:fs";
import { IDLE_NGU_DIGGERS } from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-11-08) : « refaire entièrement le menu Mineurs d'or : un décor avec à chaque fois une caverne, chaque cavité différente et en rapport avec ce qu'elle rapporte ». Étape 1 : chaque carte de mineur montre SA caverne,
 * recadrée dans l'image de fond unique (12 cavités). Anti-spoil (règle n°2) : jamais le fond entier (donc jamais le nombre de cavernes) ; une carte n'existe que pour un mineur découvert.
 */
const page = fs.readFileSync("cloudflare/public/modules/mineurs-page-v1.js", "utf8");

// L'image existe, au bon format (1536 x 1024, 12 cavités).
const fond = "cloudflare/public/img/mineurs/fonds/fond-pc.webp";
assert.ok(fs.existsSync(fond) && fs.statSync(fond).size > 100000, "fond-pc.webp rangé dans le dépôt");
const octets = fs.readFileSync(fond);
assert.equal(octets.slice(0, 4).toString("latin1"), "RIFF", "fichier WebP");
assert.equal(octets.slice(8, 12).toString("latin1"), "WEBP");
assert.ok(page.includes("var FOND_URL='/img/mineurs/fonds/fond-pc.webp',FOND_L=1536,FOND_H=1024,CAD_L=356,CAD_H=320;"), "image et recadrage déclarés");

// Une caverne par mineur du moteur, chacune différente, toutes dans l'image.
const m = /var CAVERNES=\{([^}]*)\};/.exec(page);
assert.ok(m, "table des cavernes");
const table = Object.fromEntries([...m[1].matchAll(/(\w+):\[([\d.]+),([\d.]+)\]/g)].map((x) => [x[1], [Number(x[2]), Number(x[3])]]));
const ids = IDLE_NGU_DIGGERS.map((d) => d.id).sort();
assert.deepEqual(Object.keys(table).sort(), ids, "exactement une caverne par mineur du moteur (" + ids.length + ")");
assert.equal(new Set(Object.values(table).map((c) => c.join(","))).size, ids.length, "douze cavités différentes");
const L = 1536, H = 1024, CL = 356, CH = 320;
for (const [id, [cx, cy]] of Object.entries(table)) {
  assert.ok(cx - CL / 2 >= -1 && cx + CL / 2 <= L + 1 && cy - CH / 2 >= -1 && cy + CH / 2 <= H + 1, "recadrage de " + id + " dans l'image");
}
// Rangées et colonnes régulières (4 x 3) : l'ordre du plan (design/PROMPT-FONDS-MINEURS.md).
assert.deepEqual([table.drop[1], table.energyNgu[1], table.pp[1]], [167.5, 508.5, 840], "trois rangées");
assert.equal(new Set(Object.values(table).map((c) => c[0])).size, 4, "quatre colonnes");
assert.ok(Math.abs(CL / CH - 120 / 108) < 0.005, "même proportion que la carte du mineur (120 : 108)");

// Anti-spoil : le style n'expose jamais le fond entier, seulement un recadrage agrandi (> 100 %) positionné sur la cavité.
const fn = page.slice(page.indexOf("function styleCaverne_"), page.indexOf("/* Nom, ce que le mineur améliore"));
assert.ok(fn.includes("(FOND_L/CAD_L*100).toFixed(2)+'% auto no-repeat'") && fn.includes("if(!fondPret||!c)return ''"), "recadrage agrandi, repli sans image");
assert.ok(FOND_RATIO() > 4, "l'image est agrandie plus de 4 fois dans la carte : un seul quart de sa largeur y est visible");
function FOND_RATIO() { return L / CL; }
assert.ok(!/mn-fond-entier|background-size:\s*cover/.test(page), "jamais le fond entier");

// Une carte n'existe que pour un mineur découvert (aucune cavité vide ni verrouillée dessinée).
assert.ok(/liste=g\.ids\.filter\(function\(id\)\{return defs\[id\]/.test(page) && page.includes("if(!precedentEngage)return;"), "seules les galeries et mineurs déjà atteints sont dessinés");

// Avec la caverne, le sol et le butin dessinés disparaissent (la caverne les porte) ; l'ouvrier reste.
assert.ok(page.includes("(caverne?'':fond(o)+m.extra)") && page.includes("scene(id,Boolean(fondCaverne))"), "la scène dessinée ne double pas la caverne");
// Repli : sans image chargée, l'ancien décor.
assert.ok(page.includes("var fondPret=false;") && page.includes("im.onload=function(){fondPret=true;"), "repli tant que l'image n'est pas chargée");
console.log("idle-mineurs-cavernes-v1: OK");
