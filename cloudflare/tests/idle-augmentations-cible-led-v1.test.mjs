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
// LCD rétroéclairé : fond clair teinté de la paire + lueur intérieure, caractères sombres, halo doux AUTOUR de l'écran (pas de néon sur le texte)
assert.ok(lcd.includes("--e-fond:color-mix(in srgb,var(--led-paire,#ffb000) 28%,#f4f7ea)"), "LCD : fond clair teinté");
assert.match(lcd, /--e-ecran:radial-gradient\(ellipse/, "LCD : lueur intérieure plus claire au centre");
assert.ok(lcd.includes("--e-txt:color-mix(in srgb,var(--led-fond,#1d271b) 78%,#000)"), "LCD : caractères sombres");
assert.match(lcd, /--e-glow:none/, "LCD : aucun néon sur le texte");
assert.ok(css.includes(".aug-piste-v2.upgrade :is(.aug-tete-v2,.aug-niv-bloc,.soreal-idle-bt-allocation-v120,.aug-cout-ligne,.aug-eta,.aug-cible-v2){box-shadow:inset 0 0 14px rgba(255,255,255,.65)") && css.includes("0 0 12px 3px color-mix(in srgb,var(--led-paire,#ffb000) 55%,transparent)"), "LCD : halo rétroéclairé autour de l'écran");
assert.ok(!/neon/.test(lcd));

// tout texte d'information est dans un écran (nom + logo, niveau, énergie, coût, temps, cible) et chaque écran a sa matrice
for (const k of [".aug-tete-v2", ".aug-niv-bloc", ".soreal-idle-bt-allocation-v120", ".aug-cout-ligne", ".aug-eta", ".aug-cible-v2"]) {
  assert.ok(css.includes(":is(.aug-tete-v2,.aug-niv-bloc,.soreal-idle-bt-allocation-v120,.aug-cout-ligne,.aug-eta,.aug-cible-v2)") && css.includes(k), "écran : " + k);
}
assert.match(css, /\)::after\{content:"";position:absolute;inset:0;z-index:3;pointer-events:none;[^}]*background:var\(--e-grille\)/);
assert.match(css, /\.aug-cible-v2 input\{[^}]*appearance:textfield/);
assert.match(css, /\.aug-cible-v2 input\{[^}]*caret-color:var\(--e-txt\)/);
assert.ok(!/animation|@keyframes|filter:(?!none)/.test(css.replace(/\/\*[\s\S]*?\*\//g, "")), "aucune animation ni filtre");
assert.ok(!css.includes("!important"), "aucun !important");

// barre = EFFET LED CONTINU : trame de points au pas entier (6 px), un seul calque, aucun trait ni coupure ni dégradé de couleur ; remplissage plein de la couleur de la paire
assert.ok(css.includes('.aug-tube-v2::before{content:"";position:absolute;inset:0;z-index:2;pointer-events:none;background:radial-gradient(circle at 50% 50%,transparent 0 1.9px,var(--led-fond,#050403) 2.3px) 0 0/6px 6px}'), "trame de LED, pas de 6 px entier, un seul calque");
assert.ok(css.includes(".aug-liquide-v2{background:var(--led-paire,#ffb000);box-shadow:none}"), "remplissage plein, sans dégradé");
for (const r of css.split("\n").filter((l) => /aug-(tube|liquide|reflet)-v2/.test(l))) assert.ok(!/repeating|linear-gradient|dashed|dotted/.test(r), "barre sans trait ni coupure : " + r.slice(0, 120));
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

// lisibilité (Norman, 2026-11-01) : sur le circuit, étiquettes (Niveau, Prochain niveau, Cible), valeurs, minuterie et valeur « non » >= 7 avec le fond de l'écran, pour les 10 paires
const mix = (h1, h2, k) => "#" + [1, 3, 5].map((i) => Math.round(parseInt(h1.slice(i, i + 2), 16) * k + parseInt(h2.slice(i, i + 2), 16) * (1 - k)).toString(16).padStart(2, "0")).join("");
const ratio = (x, y) => { const [m, n] = [lum(x), lum(y)].sort((u, v) => v - u); return (m + 0.05) / (n + 0.05); };
assert.ok(led.includes("--e-dim:color-mix(in srgb,var(--e-txt) 70%,#fff)"), "étiquettes : 70 % de la couleur + 30 % de blanc");
const non = /--e-non:(#[0-9a-f]{6})/i.exec(led)[1];
for (const x of paires) {
  assert.ok(ratio(x.txt, x.fond) >= 7, "valeurs et minuterie >= 7 : " + x.txt);
  assert.ok(ratio(mix(x.txt, "#ffffff", 0.7), x.fond) >= 7, "étiquettes >= 7 : " + x.txt);
  assert.ok(ratio(non, x.fond) >= 7, "valeur « non » >= 7 : " + non + " / " + x.fond);
}
const ECR = ":is(.aug-tete-v2,.aug-niv-bloc,.soreal-idle-bt-allocation-v120,.aug-cout-ligne,.aug-eta,.aug-cible-v2)";
assert.ok(css.includes('font:900 12px/1.2 "Russo One"'), "étiquettes 12 px");
assert.ok(css.includes(":not(.upgrade) .aug-eta{font-size:16px}"), "minuterie 16 px");
assert.ok(css.includes(":not(.upgrade) " + ECR + "{isolation:isolate}"));
assert.ok(css.includes(":not(.upgrade) " + ECR + "::after{z-index:-1}"), "trame de LED sous le texte, jamais par-dessus");
for (const l of css.split("\n").filter((x) => /(\.aug-eta|\.aug-niv-lib|\.aug-cout-lib|\.aug-cible-v2>span)[^{]*\{/.test(x))) assert.ok(!/opacity|filter/.test(l), "aucune opacité ni filtre sur ces textes");

// boutons : composants du circuit (poussoir) et touches de la puce, états survol / appui / désactivé, aucun pointillé
/* touches de la piste d'Augment : caoutchouc dans un cadre à l'accent de la carte (2026-11-03), feuille soreal-idle-augment-touches-v1.css (gardes : idle-augment-emplacement-vide-v1) */
assert.match(readFileSync("cloudflare/public/soreal-idle-augment-touches-v1.css", "utf8"), /\.aug-piste-v2 \.soreal-idle-bt-actions-v120[^{]*button:not\(#_\)\{[^}]*--anneau:color-mix\(in srgb,var\(--pcb-acc/);
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
/* boutons de la barre d'outils : mêmes touches en caoutchouc que les pistes (feuille soreal-idle-augment-touches-v1.css, 2026-11-03) */
assert.ok(readFileSync("cloudflare/public/soreal-idle-augment-touches-v1.css", "utf8").includes(".soreal-idle-bt-presets-v120) button:not(#_){--c1:"));
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
