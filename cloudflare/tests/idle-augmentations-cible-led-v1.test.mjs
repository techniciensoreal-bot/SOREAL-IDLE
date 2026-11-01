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
assert.match(led, /--e-fond:var\(--led-fond,/, "LED : fond de la paire");
assert.ok(!/--e-fond|--e-txt/.test(lcd), "LCD : hérite du fond et de la police de la paire");
assert.match(lcd, /--e-glow:none/, "LCD : aucun halo");
assert.ok(!/neon/.test(lcd));

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
// barre PLEINE et continue (Norman) : aucun trait ni segment, couleur unie, aucun dégradé dans les règles de la barre
assert.match(css, /\.aug-tube-v2::before\{content:none;background:none\}/);
assert.match(css, /\.aug-liquide-v2,[^{]*\.aug-piste-v2\.upgrade \.aug-liquide-v2\{background:var\(--e-txt\);box-shadow:none\}/);
for (const r of css.split("\n").filter((l) => /aug-(tube|liquide|reflet)-v2/.test(l))) assert.ok(!/gradient\(|repeating|dashed|dotted/.test(r), "barre sans dégradé ni trait : " + r.slice(0, 120));
assert.ok(js.includes("transform:scaleX('+(pct/100)+')"), "remplissage toujours en scaleX");

// une couleur par paire : palette distincte, posée sur la paire (l'Augment et son Upgrade la partagent)
const brut = /COULEURS_LED_AUGMENTS_V1=\[(.*)\];/.exec(js)[1];
const paires = [...brut.matchAll(/\['(#[0-9a-f]{6})','(#[0-9a-f]{6})'\]/gi)].map((m) => ({ txt: m[1], fond: m[2] }));
assert.ok(paires.length >= 10, "10 palettes");
assert.equal(new Set(paires.map((x) => x.txt)).size, paires.length, "polices distinctes");
assert.equal(new Set(paires.map((x) => x.fond)).size, paires.length, "fonds distincts");
const lum = (h) => { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
for (const x of paires) { const [a, b] = [lum(x.txt), lum(x.fond)].sort((u, v) => v - u); assert.ok((a + 0.05) / (b + 0.05) >= 4.5, "contraste lisible " + x.txt + " / " + x.fond); }
const I = "COULEURS_LED_AUGMENTS_V1[Math.max(0,defs.indexOf(def))%COULEURS_LED_AUGMENTS_V1.length]";
assert.ok(js.includes("--led-paire:'+" + I + "[0]+';--led-fond:'+" + I + "[1]"), "police et fond selon le rang de la paire");

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
assert.ok(itopod.includes(':not([data-menu="augmentations"]) *):is(') || itopod.includes('not([data-menu="augmentations"] *):is(') || itopod.includes(':where(:not([data-menu="augmentations"] *)):is('), "boutons partagés exclus pour Augmentations");
// Norman (2026-11-01) : « pourquoi tu as changé les boutons Fight, Fuite, Nuke ? » : l'exclusion ne doit AJOUTER AUCUNE spécificité à la règle partagée (sinon elle écrase les styles propres de la borne) : :where() obligatoire
assert.ok(!itopod.includes('[data-menu] :not([data-menu="augmentations"] *):is('), "l'exclusion Augmentations passe par :where(), spécificité inchangée pour tous les autres boutons");
assert.ok(itopod.includes('[data-menu]:not([data-menu="augmentations"]) .soreal-idle-page-head-v28'), "en-tête partagé exclu pour Augmentations");
assert.ok(readFileSync("cloudflare/public/soreal-idle-ui.css", "utf8").includes('.soreal-idle-page-head-v28:where(:not(.soreal-idle-page-root-v28[data-menu="augmentations"] *))'), "fond d'en-tête de ui.css exclu pour Augmentations");
assert.ok(/soreal-idle-augment-led-haut-v1\.css\?v=\d+/.test(html), "feuille du haut liée");

// feuille liée dans la page
assert.ok(/soreal-idle-augment-led-v1\.css\?v=\d+/.test(html), "feuille liée");
console.log("OK idle-augmentations-cible-led-v1");
