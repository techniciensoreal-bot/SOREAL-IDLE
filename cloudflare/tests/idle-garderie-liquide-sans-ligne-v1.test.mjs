// Norman (2026-11-01) : « pour chaque liquide dans les bocaux, il y a une ligne blanche avec des coupures dans les vagues ; je veux la supprimer, juste garder les vagues. »
// Puis : « à la surface du liquide des bocaux de la garderie, il y a encore des traits noirs que je ne veux plus ».
// Cause des traits noirs : la tuile de la vague (50cqw, largeur fractionnaire) se répétait DANS le liquide ; sa jointure laissait une colonne de pixels
// à moitié transparente, un trait sombre vertical sur la vague. Maintenant une seule tuile de 3 périodes (150cqw), glissant de -50cqw à 0 : jointure hors du liquide.
import fs from "node:fs";
import assert from "node:assert/strict";
const dir = "cloudflare/public/modules/";
const s = fs.readFileSync(dir + "daycare-page-v1.js", "utf8");
assert.ok(!/\.gd-liq::after\{/.test(s), "plus de ligne blanche (pseudo-élément ::after) sur le liquide");
assert.ok(!/\.gd-liq::before\{/.test(s), "plus de pseudo-élément ::before sur le liquide");
assert.ok(s.includes("animation:gd-onde 3.2s linear infinite"), "les vagues restent");
// aucune jointure de tuile visible : la tuile de vague couvre tout le liquide (150cqw >= 100cqw + 50cqw de glissement)
assert.ok(s.includes("mask-size:150cqw 8cqw") && !s.includes("mask-size:50cqw 8cqw"), "tuile de vague de 150cqw (pas de répétition dans le liquide)");
assert.ok(s.includes("width='180' height='10' viewBox='0 0 180 10'") && !s.includes("width='60' height='10'"), "tuile SVG de 3 périodes");
assert.ok(s.includes("from{-webkit-mask-position:-50cqw 0,0 100%") && s.includes("to{-webkit-mask-position:0 0,0 100%"), "glissement de -50cqw à 0 : une période, la jointure reste hors du liquide");
// la règle du liquide ne porte ni bordure, ni ombre, ni contour, ni couche sombre
const regle = /\.gd-liq\{[^}]*\}/.exec(s)[0];
assert.ok(!/border|outline|box-shadow|filter|drop-shadow/.test(regle), "aucun trait, ombre ou contour sur le liquide");
assert.ok(!/rgba\(0,0,0|#000[^0-9a-f]|black/.test(regle.replace(/linear-gradient\(#000,#000\)/g, "").replace(new RegExp("url\\([^)]*\\)", "g"), "")), "aucune couche sombre dans le fond du liquide");
// aucun module de formes ne dessine quelque chose sur .gd-liq
for (const f of fs.readdirSync(dir).filter((n) => /^garderie-bocaux-.*\.js$/.test(n))) {
  const t = fs.readFileSync(dir + f, "utf8");
  assert.ok(!/\.gd-liq(::|\{)[^}]*(border|box-shadow|outline)/.test(t), f + " : pas de trait sur le liquide");
}
console.log("idle-garderie-liquide-sans-ligne-v1 : OK");
