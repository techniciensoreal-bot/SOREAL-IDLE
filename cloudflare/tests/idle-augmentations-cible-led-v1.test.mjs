import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
/* Norman (2026-11-01) : dans les Augmentations, toute information du circuit est dans un petit écran incrusté. Circuit imprimé (piste d'Augment) = vieil afficheur à LED, une couleur par paire ;
   processeur (piste d'Upgrade) = LCD des débuts, un seul ton, sans halo. Le champ « Cible » reste un vrai input number. */
const js = readFileSync("cloudflare/public/modules/augmentations-page-v1.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-augment-led-v1.css", "utf8");
const html = readFileSync("cloudflare/public/index.html", "utf8");

// le champ reste un vrai input number, mêmes attributs et même onchange
const champ = js.slice(js.indexOf('<label class="aug-cible-v2">'), js.indexOf('<div class="soreal-idle-bt-actions-v120">'));
assert.ok(champ.includes('<input type="number" inputmode="numeric" min="0" step="1"'), "input number conservé");
assert.ok(champ.includes("onchange=\"window.__cibleAugmentIdleV1__("), "même onchange");
assert.ok(/:\s*'disabled'/.test(champ), "état désactivé conservé");

// deux familles : LED (circuit) lumineuse, LCD (processeur) sans halo ni néon
const led = /\.aug-piste-v2\{([^}]*)\}/.exec(css)[1];
const lcd = /\.aug-piste-v2\.upgrade\{([^}]*)\}/.exec(css)[1];
assert.match(led, /--e-txt:var\(--led-paire,/);
assert.match(led, /--e-glow:0 0 5px/, "LED : halo");
assert.match(lcd, /--e-fond:#9bb08a/);
assert.match(lcd, /--e-txt:#2b3a28/);
assert.match(lcd, /--e-glow:none/, "LCD : aucun halo");
assert.ok(!/--led-paire|neon/.test(lcd), "LCD : pas de couleur de paire");

// tout texte d'information est dans un écran (nom + logo, niveau, énergie, coût, temps, cible) et chaque écran a sa matrice
for (const k of [".aug-tete-v2", ".aug-niv-bloc", ".soreal-idle-bt-allocation-v120", ".aug-cout-ligne", ".aug-eta", ".aug-cible-v2"]) {
  assert.ok(css.includes(":is(.aug-tete-v2,.aug-niv-bloc,.soreal-idle-bt-allocation-v120,.aug-cout-ligne,.aug-eta,.aug-cible-v2)") && css.includes(k), "écran : " + k);
}
assert.match(css, /\)::after\{content:"";position:absolute;inset:0;z-index:3;pointer-events:none;[^}]*background:var\(--e-grille\)/);
assert.match(css, /\.aug-cible-v2 input\{[^}]*appearance:textfield/);
assert.match(css, /\.aug-cible-v2 input\{[^}]*caret-color:var\(--e-txt\)/);
assert.ok(!/animation|@keyframes|filter:/.test(css.replace(/\/\*[\s\S]*?\*\//g, "")), "aucune animation ni filtre");
assert.ok(!css.includes("!important"), "aucun !important");

// barre : masque statique par-dessus, le remplissage garde son animation (rien n'est recréé par segment)
assert.match(css, /\.aug-tube-v2::before\{background:var\(--e-grille\),repeating-linear-gradient/);
assert.match(css, /\.aug-liquide-v2\{background:var\(--e-txt\)/);
assert.ok(js.includes("transform:scaleX('+(pct/100)+')"), "remplissage toujours en scaleX");

// une couleur par paire : palette distincte, posée sur la paire (l'Augment et son Upgrade la partagent)
const palette = /COULEURS_LED_AUGMENTS_V1=\[([^\]]+)\]/.exec(js)[1].match(/#[0-9a-f]{6}/gi);
assert.ok(palette.length >= 10 && new Set(palette).size === palette.length, "10 couleurs distinctes");
assert.ok(js.includes("--led-paire:'+COULEURS_LED_AUGMENTS_V1[Math.max(0,defs.indexOf(def))%COULEURS_LED_AUGMENTS_V1.length]"), "couleur selon le rang de la paire");

// boutons : composants du circuit (poussoir) et touches de la puce, états survol / appui / désactivé, aucun pointillé
assert.match(css, /\.aug-piste-v2:not\(\.upgrade\) \.soreal-idle-bt-actions-v120 button\{[^}]*--bague:color-mix\(in srgb,var\(--pcb-acc/);
assert.match(css, /\.aug-piste-v2\.upgrade \.soreal-idle-bt-actions-v120 button\{[^}]*border:2px solid #c9a24a/);
assert.match(css, /button:active:not\(:disabled\)\{transform:translateY\(1px\)/);
assert.match(css, /button:disabled\{opacity:\.5/);
assert.match(css, /min-height:46px/);
const themes = readFileSync("cloudflare/public/soreal-idle-themes.css", "utf8");
assert.ok(themes.includes('button:not(.aug-piste-v2 *)'), "le thème des boutons d'Augmentations ne touche plus les boutons des pistes");
const itopod = readFileSync("cloudflare/public/soreal-idle-itopod.css", "utf8");
assert.ok(!/data-menu="augmentations"\][^{]*\{[^}]*(dashed|dotted)/.test(itopod + themes + css), "aucun pointillé sur la page Augmentations");
assert.ok(!/dashed|dotted/.test(css.replace(/\/\*[\s\S]*?\*\//g, "")), "aucun pointillé dans la feuille des écrans");

// haut de page : en-tête, aide, totaux, barre d'outils et case « suivre l'énergie » sont aussi des écrans LED ; boutons = mêmes poussoirs ; thèmes partagés exclus pour Augmentations seulement
const haut = readFileSync("cloudflare/public/soreal-idle-augment-led-haut-v1.css", "utf8");
for (const k of [".soreal-idle-page-head-v28", ".soreal-idle-aide-v1", ".soreal-idle-summary-grid-v28>.soreal-idle-summary-v28", ".soreal-idle-bt-input-box-v120", ".soreal-idle-bt-info-v1", ".soreal-idle-bt-total-v1", ".aug-avance-v2"]) assert.ok(haut.includes(k), "écran du haut : " + k);
assert.ok(!haut.includes("!important") && !/dashed|dotted|@keyframes|animation:/.test(haut.replace(/\/\*[\s\S]*?\*\//g, "")), "haut : statique, sans pointillé ni !important");
assert.ok(haut.split('[data-menu="augmentations"]').length - 1 >= haut.split("\n").filter((l) => l.startsWith("html body")).length, "haut : toutes les règles sont scopées à Augmentations");
assert.match(haut, /\.soreal-idle-bt-presets-v120 button\{--cap:#22232a/);
assert.match(haut, /\.soreal-idle-page-head-v28\[data-entete-menu\]\{background:var\(--e-fond\)/);
assert.match(haut, /\.soreal-idle-page-title-v28::before[^{]*\{content:none\}/);
assert.ok(itopod.includes(':not([data-menu="augmentations"]) *):is(') || itopod.includes('not([data-menu="augmentations"] *):is('), "boutons partagés exclus pour Augmentations");
assert.ok(itopod.includes('[data-menu]:not([data-menu="augmentations"]) .soreal-idle-page-head-v28'), "en-tête partagé exclu pour Augmentations");
assert.ok(readFileSync("cloudflare/public/soreal-idle-ui.css", "utf8").includes('.soreal-idle-page-head-v28:where(:not(.soreal-idle-page-root-v28[data-menu="augmentations"] *))'), "fond d'en-tête de ui.css exclu pour Augmentations");
assert.ok(/soreal-idle-augment-led-haut-v1\.css\?v=\d+/.test(html), "feuille du haut liée");

// feuille liée dans la page
assert.ok(/soreal-idle-augment-led-v1\.css\?v=\d+/.test(html), "feuille liée");
console.log("OK idle-augmentations-cible-led-v1");
