import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Portes d'Yggdrasil (Norman, 2026-11-03) : « ce qui les fait disparaître, c'est le BAS DU CADRE AVEC LE TITRE, comme si la porte passait DERRIÈRE ».
 * La herse monte derrière la plaque du titre (.ygg-nom) et est découpée exactement par son bord inférieur.
 */
const src = readFileSync("cloudflare/public/modules/yggdrasil-elfes-v1.js", "utf8").split(String.fromCharCode(13)).join("");
const regle = (sel) => {
  const i = src.indexOf("'" + sel + "{");
  assert.ok(i >= 0, "règle absente : " + sel);
  return src.slice(i, src.indexOf("}", i));
};
const z = (r) => Number(r.match(/z-index:(\d+)/)[1]);

const porte = regle(".ygg-porte");
const nom = regle(".ygg-nom");
// 1. Empilement : plaque au-dessus de la porte, porte au-dessus de l'image du fruit (couches 0 à 6 du cadre).
assert.ok(/position:relative/.test(nom), "la plaque porte son z-index (position:relative)");
assert.ok(z(nom) > z(porte), "plaque du titre au-dessus de la porte");
assert.ok(z(porte) > 6, "porte au-dessus de l'image du fruit et du liseré du cadre (z-index 6)");
// 2. Aucune transparence sur la plaque.
assert.ok(!/opacity/.test(nom), "plaque entière, sans transparence");
// 3. Découpe : clip-path dont le HAUT est le bas de la plaque, jamais un overflow:hidden de la porte.
assert.ok(!/overflow/.test(porte), "la boîte de la porte ne coupe pas par overflow (rien au-dessus de la plaque)");
const m = porte.match(/clip-path:inset\(calc\(([\d.]+)% - var\(--ygg-ecart,([\d.]+cqw)\)\) 0 0 0\)/);
assert.ok(m, "clip-path inset(haut = bas de la plaque, 0 0 0)");
// La boîte déborde de 6,25 % du cadre en haut : (6,25 / 112,5) = 5,5556 % de sa propre hauteur ; l'écart plaque-cadre est celui de la carte.
assert.ok(porte.includes("inset:0;"));
assert.ok(Math.abs(Number(m[1]) - 0) < 0.001, "décalage du bord de coupe = débord de la porte (en % de sa hauteur)");
const carte = regle(".ygg-carte");
assert.ok(/--ygg-ecart:1\.1cqw/.test(carte) && /gap:var\(--ygg-ecart\)/.test(carte), "l'écart plaque-cadre est la variable utilisée par le gap ET par la découpe");
assert.equal(m[2], "1.1cqw", "valeur de repli = écart de la carte");
assert.ok(/@container \(max-width:520px\)[^']*\.ygg-carte\{--ygg-ecart:\.9cqw;/.test(src), "le petit écran change la variable (pas seulement le gap)");
// 4. Translation : la porte monte d'au moins sa propre hauteur (en transform seulement).
const kf = src.match(/@keyframes yggHerse\{([^']*)\}'/)[1];
assert.ok(/^[^]*100%\{transform:translateY\(-(\d+)%\)\}\}?$/.test(kf + "}"), "keyframes en transform");
const fin = Number(kf.match(/100%\{transform:translateY\(-(\d+)%\)\}/)[1]);
assert.ok(fin >= 100, "la porte monte de plus que sa hauteur : entièrement cachée derrière la plaque");
assert.ok(!/top:|margin-top|height:/.test(kf), "animation en transform seulement");
// 5. Le reste de l'animation est inchangé : deux volets, fermeture = ouverture à l'envers, lueur, sons.
assert.ok(src.includes("animation:yggHerse calc(2.6s*var(--vit,1)) cubic-bezier(.45,.02,.2,1) both;"));
assert.ok(src.includes("animation:yggHerse calc(2.2s*var(--vit,1)) cubic-bezier(.45,.02,.2,1) both reverse;"));
assert.ok(/function nomSonPorte_\(\)\{return 'herse';\}/.test(src) && /function nomSonFerme_\(\)\{return 'herseFerme';\}/.test(src));
// 6. Mouvement réduit : plus de porte animée.
assert.ok(/prefers-reduced-motion:reduce\)\{\.ygg-porte\.ouvre,\.ygg-porte\.referme\{display:none;\}\}/.test(src));
console.log("idle-ygg-porte-derriere-titre-v1 OK");
