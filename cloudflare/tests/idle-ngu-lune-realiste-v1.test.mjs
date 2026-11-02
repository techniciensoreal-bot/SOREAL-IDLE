import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-11-02) : « dans NGU, je veux que la lune soit une lune réaliste comme celle du thème Halloween pour TV et APP ». Référence : .lune de SOREAL-APP (sphère #fffdf0 > #fbeeb4 > #e9cf86 > #c9a95c, ombre en bas à droite, trois cratères, halo orange doux).
 * Trois endroits : le cadre de titre de la page NGU (SVG de la moitié nuit, dans les feuilles d'en-têtes), la lune de l'onglet Magie (.nl-astre) et le bouton de menu (même dessin). Statique : aucune animation de filter / box-shadow.
 */
const lab = readFileSync("cloudflare/public/modules/ngu-labo-v1.js", "utf8");
const lisCss = (f) => decodeURIComponent(readFileSync("cloudflare/public/" + f, "utf8").replace(/%(?![0-9A-Fa-f]{2})/g, "%25"));
for (const f of ["soreal-idle-entetes-d.css", "soreal-idle-entetes-miniature-v1.css", "soreal-idle-menus-boutons-v1.css"]) {
  const s = lisCss(f);
  assert.ok(s.includes('stop-color="#fffdf0"') && s.includes('stop-color="#fbeeb4"') && s.includes('stop-color="#e9cf86"') && s.includes('stop-color="#c9a95c"'), f + " : sphère pleine lune (dégradé Halloween)");
  assert.ok(/id="c"/.test(s) && (s.match(/fill="url\(#c\)"/g) || []).length >= 3, f + " : trois cratères");
  assert.ok(s.includes('stop-color="#ffe6a0"') && !s.includes("dfe7ff"), f + " : halo chaud, plus l'ancienne lune bleutée");
}
// onglet Magie
assert.ok(lab.includes("function luneUri_") && lab.includes("'#fffdf0','#fbeeb4','#e9cf86','#c9a95c'"), "lune de l'onglet Magie : mêmes couleurs que la référence");
assert.ok(/\.nl-v1\[data-nl-onglet="magic"\] \.nl-astre::after\{background:url\("'\+LUNE_URI\+'"\)/.test(lab), "la lune de Magie est la pleine lune");
assert.ok(/data-nl-niv="0"\] \.nl-astre::after\{background:url\("'\+LUNE_GRISE_URI\+'"\)[^}]*box-shadow:none/.test(lab), "niveau 0 : lune grise, sans halo");
assert.ok(/\.nl-astre::before\{inset:-42px;[^}]*opacity:calc\(var\(--nl-lueur,0\)\*\.95\)/.test(lab), "halo proportionnel à --nl-lueur");
assert.ok(/box-shadow:0 0 calc\(8px \+ var\(--nl-lueur,0\)\*14px\)/.test(lab), "halo d'ombre proportionnel à --nl-lueur");
assert.ok(!/@keyframes[^{]*\{[^}]*(filter|box-shadow)/.test(lab), "aucune animation de filter ou de box-shadow");
assert.ok(/\.nl-v1>\.nl-astre,\.nl-v1>\.nl-nuages\{position:absolute;pointer-events:none/.test(lab), "pointer-events:none");
assert.ok(!lab.includes("rgba(150,60,8,.5) 0 9%"), "plus de lune orange à cratères orangés");
console.log("idle-ngu-lune-realiste-v1: OK");
