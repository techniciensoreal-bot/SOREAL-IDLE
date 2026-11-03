import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Page Augmentations (Norman, 2026-11-03).
 *  1. Quatrième exception à la règle n°2 : à la place de l'Upgrade non possédé, UNIQUEMENT le circuit imprimé vide (rien dessiné dessus), sans texte, nom, prix, condition ni cadenas ;
 *     la carte garde la même taille (même cellule de grille et même hauteur que la vraie piste) ; l'emplacement n'existe que dans la branche « upgrade non débloqué ».
 *  2. Plus de « petit cadre en fondu noir » (dégradé sombre en fond de la piste d'Augment).
 *  3. Touches en caoutchouc (+ − Max 0, barre d'outils) : mêmes couleurs pour toutes, sombres, mates, légende lisible même désactivées.
 */
const page = readFileSync("cloudflare/public/modules/augmentations-page-v1.js", "utf8");
const led = readFileSync("cloudflare/public/soreal-idle-augment-led-v1.css", "utf8");
const touches = readFileSync("cloudflare/public/soreal-idle-augment-touches-v1.css", "utf8");
const haut = readFileSync("cloudflare/public/soreal-idle-augment-led-haut-v1.css", "utf8");
const itopod = readFileSync("cloudflare/public/soreal-idle-itopod.css", "utf8");

// --- 1. emplacement vide
assert.ok(!page.includes("Upgrade verrouillé") && !page.includes("🔒 Upgrade"), "l'ancienne ligne « Upgrade verrouillé » a disparu");
const m = page.match(/const EMPLACEMENT_UPGRADE_VIDE_V1='([^']*)';/);
assert.ok(m, "constante de l'emplacement");
assert.equal(m[1], '<div class="aug-emplacement-v2" aria-hidden="true"></div>', "UNE div vide, aria-hidden, sans enfant (donc ni texte, ni SVG, ni cadenas, ni nombre)");
assert.ok(!/[0-9A-Za-zÀ-ÿ]/.test(m[1].replace(/<[^>]*>/g, "")), "aucun texte entre les balises");
assert.equal(page.split("EMPLACEMENT_UPGRADE_VIDE_V1").length - 1, 2, "défini une fois, utilisé une fois");
assert.match(page, /\(def\.upgrade\?\(upgradeOk\?track\(def,pair,true,true\):EMPLACEMENT_UPGRADE_VIDE_V1\):''\)/, "seulement quand l'Upgrade existe et n'est pas débloqué ; rien si l'Augment n'a pas d'Upgrade");
assert.ok(!page.includes("data-morph-garder") || !/aug-emplacement/.test(page.slice(page.indexOf("data-morph-garder") - 80, page.indexOf("data-morph-garder") + 80)), "aucun data-morph-garder sur l'emplacement (le morph le remplace au déblocage)");
for (const mot of ["socle", "aug-lien-vide", "connecteur"]) assert.ok(!page.includes(mot) && !led.includes("aug-" + mot), "aucun reste de « " + mot + " »");
// la vraie piste ne contient rien de l'emplacement
const track = page.slice(page.indexOf("function track("), page.indexOf("function track(") + 6000);
assert.ok(track.includes("aug-piste-v2") && !track.includes("emplacement"), "la vraie piste d'Upgrade ne contient rien de l'emplacement");

// CSS de l'emplacement : seulement de la mise en page (même cellule, même hauteur), aucun décor
const regles = [...led.matchAll(/([^{}]*aug-emplacement-v2[^{}]*)\{([^{}]*)\}/g)].map((x) => ({ sel: x[1], corps: x[2] }));
assert.ok(regles.length >= 4, "règles de l'emplacement présentes");
for (const r of regles) {
  assert.ok(!/::(before|after)/.test(r.sel), "aucun pseudo-élément décoratif : " + r.sel.trim().slice(-60));
  assert.ok(!/background|box-shadow|gradient|url\(|content:|border-color|filter/.test(r.corps), "aucun fond/ombre/dessin propre : " + r.corps.slice(0, 80));
}
assert.ok(/aug-pistes-v2:has\(\.aug-emplacement-v2\)\{grid-template-columns:minmax\(0,1fr\) 34px minmax\(0,1fr\)\}/.test(led), "PC : deux colonnes de piste + la colonne du « × » (34 px), comme avec la vraie piste");
assert.ok(/aug-emplacement-v2\{grid-column:3;/.test(led), "PC : l'emplacement occupe la colonne de l'Upgrade (étirée comme la piste)");
assert.ok(led.includes("aug-emplacement-v2{grid-column:auto;height:32px}"), "téléphone : empilé sous la piste, simple bande basse du circuit (32 px, nettement plus courte que la vraie piste ; Norman, 2026-11-03)");
assert.ok(!/min-height:\d+px/.test(led.slice(led.indexOf("aug-emplacement-v2{grid-column:3"))), "plus de hauteur minimale de la vraie piste");

// --- 2. plus de cadre en fondu noir sur la piste d'Augment
const degradeNoir = "linear-gradient(170deg,rgba(255,255,255,.05),rgba(0,0,0,.35))";
assert.ok(!itopod.includes(degradeNoir), "le fond en dégradé noir de .aug-piste-v2 a disparu");
assert.ok(/\.aug-piste-v2\[data-rang-v1\]\{border-left-width:2px!important;background:none!important/.test(itopod), "le fond de la piste d'Augment est vide (!important : bat les fonds de rang)");

// --- 3. touches en caoutchouc
const i = touches.indexOf("/* Touches en CAOUTCHOUC");
assert.ok(i > 0, "bloc des touches");
const bloc = touches.slice(i);
assert.ok(!/nth-child|first-of-type|\.clear|\.max/.test(bloc.replace(/\/\*[\s\S]*?\*\//g, "")), "aucune couleur d'accent propre à Max / Tout retirer : même gomme pour toutes");
assert.ok(!/radial-gradient/.test(bloc.replace(/\/\*[\s\S]*?\*\//g, "").replace(/--trou:[^;]*;/g, "")), "pas de dégradé radial (reflet) sur les touches");
for (const a of bloc.matchAll(/rgba\(255,255,255,([.\d]+)\)/g)) assert.ok(Number(a[1]) <= 0.12, "aucun liseré/reflet blanc marqué : " + a[0]);
const sansCommentaires = bloc.replace(/\/\*[\s\S]*?\*\//g, "");
assert.ok(!/filter:(?!none)/.test(sansCommentaires), "aucun filtre CSS");
assert.ok(!/text-shadow:(?!none)/.test(sansCommentaires), "aucune ombre de texte (pas de flou autour des lettres)");
assert.ok(/-webkit-text-stroke:1\.2px #000!important;paint-order:stroke fill/.test(sansCommentaires), "légende au trait extérieur net");
assert.ok(!/animation|@keyframes/.test(sansCommentaires) && /transition:transform 60ms linear,box-shadow 60ms linear/.test(sansCommentaires), "seul l'enfoncement est animé (60 ms)");
// Le BOUTON est le cadre et ne bouge jamais ; seule la CAPE (::before) s'enfonce (Norman, 2026-11-03)
assert.ok(/:active:not\(:disabled\)::before\{transform:translateY\(4px\)/.test(sansCommentaires), "l'appui enfonce la cape (::before) de son épaisseur, dans le cadre");
for (const r of sansCommentaires.matchAll(/([^{}]*button:not\(#_\)[^{}]*:active[^{}]*)\{([^{}]*)\}/g)) {
  if (/::before/.test(r[1])) continue;
  assert.ok(!/transform|box-shadow|width|height|margin|(?<![-w])(top|left|bottom|right):/.test(r[2]), "le cadre (le bouton) ne change ni de position, ni de taille, ni d'ombre à l'appui : " + r[2]);
}
assert.ok(/--gomme-grain:url\("data:image\/svg\+xml/.test(sansCommentaires) && /width='48' height='48'/.test(sansCommentaires), "une seule tuile de grain de 48 px, partagée par une variable");
assert.ok(/min-height:46px!important/.test(sansCommentaires), "cible tactile >= 44 px");
const hex = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); };
const lum = (h) => { const [r, g, b] = hex(h); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contraste = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
function cap(corpsRegle) { return ["--c1", "--c2", "--c3"].map((v) => (corpsRegle.match(new RegExp(v + ":(#[0-9a-f]{6})")) || [])[1]); }
const base = bloc.match(/button:not\(#_\)\{([^}]*)\}/)[1];
const caps = cap(base);
assert.ok(/transform:none/.test(base), "le bouton (cadre) n'a jamais de transform");
assert.ok(led.includes(".aug-piste-v2.upgrade .soreal-idle-bt-actions-v120 button:active:not(:disabled){transform:translateY(1px)") && !led.includes(".aug-piste-v2 .soreal-idle-bt-actions-v120 button:active"), "l'ancien enfoncement par transform du bouton ne vise plus que les pistes d'Upgrade");
assert.ok(/--anneau:color-mix\(in srgb,var\(--pcb-acc,#e0a458\) 90%,#3a2a10\)/.test(base) && /0 0 0 4px var\(--anneau\)/.test(base), "le cadre prend l'accent de la carte (--pcb-acc), pas une couleur en dur");
assert.ok(/::before\{content:"";position:absolute;z-index:-1;inset:2px 3px 6px/.test(sansCommentaires) && /isolation:isolate/.test(base), "la cape est un ::before sous le texte, dans le cadre");
assert.ok(caps.every(Boolean), "trois teintes de gomme");
for (const c of caps) assert.ok(lum(c) <= 0.025, "gomme très sombre : " + c);
const texte = base.match(/color:(#[0-9a-f]{6})(?:!important)?/)[1];
for (const c of caps) assert.ok(contraste(texte, c) >= 7, "contraste du texte >= 7:1 sur " + c);
const hover = bloc.match(/:hover:not\(:disabled\)\{([^}]*)\}/)[1];
for (const c of cap(hover)) assert.ok(lum(c) <= 0.035, "survol à peine plus clair : " + c);
const desactivee = bloc.match(/button:not\(#_\):disabled\{([^}]*)\}/)[1];
const textD = desactivee.match(/color:(#[0-9a-f]{6})!important/);
assert.ok(textD, "état désactivé : couleur du texte imposée (bat body.soreal-idle-active-v47 button:disabled{color:#758198!important})");
for (const c of cap(desactivee)) assert.ok(contraste(textD[1], c) >= 7, "désactivée : texte lisible (>= 7:1) sur " + c);
assert.ok(!/opacity:[^1;]/.test(desactivee) && /opacity:1[;}]/.test(sansCommentaires), "désactivée : pas de transparence (texte lisible)");
// les 4 touches d'une piste partagent le MÊME fond : une seule règle les style (aucune règle par bouton)
assert.equal((sansCommentaires.match(/background:var\(--gomme-grain\)/g) || []).length, 1, "un seul fond de gomme pour toutes les touches");
// --- 3b. aucun cadre autour du groupe des 4 touches (Norman, 2026-11-03)
{
  const reg = sansCommentaires.match(/\.aug-piste-v2:not\(\.upgrade\) \.soreal-idle-bt-actions-v120:not\(#_\):not\(#_\)\{([^}]*)\}/);
  assert.ok(reg, "règle du conteneur des touches");
  assert.ok(/border:0;border-radius:0;box-shadow:none/.test(reg[1]), "le conteneur n'a ni bordure, ni rayon, ni ombre");
  assert.ok(!/--pcb-base/.test(reg[1]) && !/radial-gradient|inset/.test(reg[1]), "aucune sous-plaque ni trou de fixation : seulement une trace de cuivre");
  assert.ok(!sansCommentaires.includes("--trou"), "plus de sous-plaque");
}
// --- 4. plus d'étoiles dans les pistes d'Augmentations (Norman, 2026-11-03)
const barres = readFileSync("cloudflare/public/modules/barres-actives-v1.js", "utf8");
assert.ok(/augmentations:\{[^}]*sansParticules:true\}/.test(barres), "le menu Augmentations est déclaré sans particules");
assert.ok(/if\(!cfg\.sansParticules&&!ligne\.querySelector\(':scope>\.part-v1'\)\)ligne\.insertAdjacentHTML/.test(barres), "la couche .part-v1 n'est pas créée (plutôt que masquée)");
assert.ok(!barres.includes("pvEtoile") && !barres.includes('[data-style="etoile"] .part-v1'), "CSS des étoiles supprimé");
assert.ok(!page.includes("part-v1"), "aucune .part-v1 dans le HTML des pistes");
// anciens poussoirs retirés
assert.ok(!/:not\(\.upgrade\) \.soreal-idle-bt-actions-v120 button\{--cap/.test(led) && !/bt-presets-v120 button\{--cap/.test(haut), "anciens poussoirs supprimés (aucun code mort)");

console.log("idle-augment-emplacement-vide-v1: OK");

// --- 5. légende des touches : grotesque industrielle étroite, même corps pour +, −, MAX, 0 (Norman, 2026-11-03)
{
  const css = readFileSync("cloudflare/public/soreal-idle-augment-touches-v1.css", "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  assert.ok(css.includes('font:700 17px/1.1 "Barlow Semi Condensed","Barlow","Arial Narrow",Arial,sans-serif!important;text-transform:uppercase;letter-spacing:.06em;font-variant-numeric:tabular-nums'), "légende : Barlow Semi Condensed (repli Roboto Condensed, Arial Narrow), capitales, interlettrage léger, chiffres tabulaires");
  assert.ok(!/Bangers|Comic|Russo/.test(css), "plus de police cartoon sur les touches");
  assert.ok(!/nth-child\(-n\+2\)/.test(css), "aucun corps de police propre à + et − : même gabarit que MAX et 0");
  const barre = readFileSync("cloudflare/public/soreal-idle-barre-outils.css", "utf8");
  const ex = ':where(:not([data-menu="augmentations"] *))';
  for (const l of barre.split("\n").filter((x) => /font-family:(system-ui|"Bangers")/.test(x))) assert.ok(l.includes(ex), "la règle de police des boutons exclut la page Augmentations : " + l.slice(0, 90));
}
// police servie depuis le dépôt (SIL OFL), une seule retenue après comparaison (Barlow Semi Condensed 700)
{
  const fonts = readFileSync("cloudflare/public/fonts/fonts.css", "utf8");
  const fichier = "cloudflare/public/fonts/barlow-semi-condensed-700-latin.woff2";
  const buf = readFileSync(fichier);
  assert.equal(buf.slice(0, 4).toString("latin1"), "wOF2", "fichier woff2");
  assert.ok(buf.length <= 25 * 1024, "<= 25 Ko");
  assert.ok(/@font-face\{font-family:'Barlow Semi Condensed';font-style:normal;font-weight:700;font-display:swap;src:url\(\/fonts\/barlow-semi-condensed-700-latin\.woff2\) format\('woff2'\)/.test(fonts), "@font-face déclaré, font-display:swap");
  assert.ok(/SIL Open Font License/.test(fonts), "note de licence OFL");
  assert.ok(!/roboto-condensed|barlow-semi-condensed-600/.test(fonts), "polices non retenues retirées de fonts.css");
  const { existsSync } = await import("node:fs");
  assert.ok(!existsSync("cloudflare/public/fonts/roboto-condensed-700-latin.woff2") && !existsSync("cloudflare/public/fonts/barlow-semi-condensed-600-latin.woff2"), "fichiers non retenus supprimés");
  assert.ok(!readFileSync("cloudflare/public/index.html", "utf8").includes("barlow-semi-condensed"), "pas de preload : le texte des touches n'est pas visible au chargement");
}
console.log("idle-augment-emplacement-vide-v1 (police): OK");
