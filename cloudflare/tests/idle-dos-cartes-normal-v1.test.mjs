// Norman (2026-11-01) : « pour le mode normal, les dos de cartes (9, déjà compressés) : nomme-les et range-les ; on ne voit jamais plus de 9 dos en même temps ».
import fs from "node:fs";
import assert from "node:assert/strict";
const lire = (p) => fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n");
for (let i = 1; i <= 9; i++) {
  const f = "cloudflare/public/dos-cartes/normal/boss-" + i + ".webp";
  assert.ok(fs.existsSync(f), "dos " + i + " présent");
  const t = fs.statSync(f).size;
  assert.ok(t > 20000 && t < 150000, "dos " + i + " déjà compressé (" + t + " octets)");
}
for (let i = 1; i <= 9; i++) { const f2 = "cloudflare/public/dos-cartes/normal/titan-" + i + ".webp"; assert.ok(fs.existsSync(f2) && fs.statSync(f2).size > 20000 && fs.statSync(f2).size < 150000, "dos de titan " + i); }
assert.ok(!fs.existsSync("cloudflare/public/dos-cartes/normal/boss-10.webp") && !fs.existsSync("cloudflare/public/dos-cartes/normal/titan-10.webp"), "9 dos de boss et 9 dos de titans, pas plus");
const m = lire("cloudflare/public/modules/carte-boss-magic-v1.js");
assert.ok(m.includes("var NB_DOS_NORMAL=9;") && m.includes("(((n-1)%NB_DOS_NORMAL)+1)") && m.includes("function dosSeul(k)"), "variante = place de la carte modulo 9");
const a = lire("cloudflare/public/modules/album-cartes-v1.js");
assert.ok(a.includes("dosPochetteHtml(k+1)") && a.includes("dosPochetteHtml(i+1)"), "dos des pochettes : emplacement de la page");
// dos des Titans étiré, sans bord noir visible (Norman, 2026-11-01)
const css = lire("cloudflare/public/soreal-idle-carte-boss.css");
assert.ok(m.includes("' mtg-dos-plein'") && css.includes(".mtg-dos.mtg-dos-plein{overflow:hidden;padding:0}") && css.includes(".mtg-dos.mtg-dos-plein .mtg-dos-image{transform:scaleX(1.08);filter:none}"), "dos d'image : agrandi de 8 % et rogné par le contour de la carte");
console.log("idle-dos-cartes-normal-v1 : OK");
