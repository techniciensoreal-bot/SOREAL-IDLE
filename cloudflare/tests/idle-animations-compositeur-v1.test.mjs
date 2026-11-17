import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Fluidité téléphone (Norman, 2026-11-17 : « le jeu est devenu injouable sur téléphone »). Une animation INFINIE ne doit animer que transform / opacity / scale / rotate / translate (compositeur) :
 * box-shadow, filter, background-position, couleurs, clip-path, width/height/top/left sont repeints à CHAQUE image. Ce test balaie les deux feuilles de style principales et exige que toute animation
 * infinie lourde soit dans la liste d'exceptions justifiées ci-dessous (et seulement elle) ; il garde aussi les mécanismes de remplacement (calque + opacity / transform, boucles parfaites, règle n°3).
 */
const FICHIERS = ["cloudflare/public/soreal-idle-themes.css", "cloudflare/public/soreal-idle-ui.css"];
const OK = new Set(["transform", "opacity", "scale", "rotate", "translate", "animation-timing-function"]);
// Exceptions : animations « par paliers » (steps) qui ne repeignent qu'une ou deux fois par cycle, ou structure à refaire (anneau masqué).
const EXCEPTIONS = {
  sorealAlTourneV1: "anneau conique masqué autour du bouton d'un menu alimenté : propriété @property animée ; à refaire avec une structure dédiée",
  sorealAlGlitchV1: "steps(1) : un filtre n'existe que sur deux paliers d'un cycle de 1,6 s",
  sorealAlDamierV1: "steps(1) : deux changements de couleur par cycle de 0,9 s",
  sorealAlPointsV1: "steps(1) : trois changements de texte par cycle de 1,2 s",
};

function keyframesDe(css) {
  const out = {};
  const re = /@keyframes\s+([\w-]+)\s*\{/g;
  let m;
  while ((m = re.exec(css))) {
    let i = re.lastIndex, d = 1;
    while (d && i < css.length) { const c = css[i++]; if (c === "{") d++; else if (c === "}") d--; }
    const props = new Set();
    for (const b of css.slice(re.lastIndex, i - 1).matchAll(/\{([^{}]*)\}/g)) for (const p of b[1].split(";")) { const n = p.split(":")[0].trim(); if (n) props.add(n); }
    out[m[1]] = [...props];
  }
  return out;
}

const complet = {};
for (const f of FICHIERS) {
  const css = readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  const kf = keyframesDe(css);
  for (const [nom, props] of Object.entries(kf)) {
    const lourdes = props.filter((p) => !OK.has(p));
    if (!lourdes.length) continue;
    const infini = new RegExp("animation[^;{}]*\\b" + nom + "\\b[^;{}]*infinite|animation[^;{}]*infinite[^;{}]*\\b" + nom + "\\b").test(css);
    if (infini) assert.ok(EXCEPTIONS[nom], f + " : @keyframes " + nom + " anime " + lourdes.join(", ") + " en boucle infinie (repeint à chaque image) : passer par transform / opacity (calque ::before / ::after)");
  }
  complet[f] = readFileSync(f, "utf8");
}
const themes = complet[FICHIERS[0]];
const ui = complet[FICHIERS[1]];

function corps(css, nom) {
  const m = css.match(new RegExp("@keyframes " + nom + "\\{((?:[^{}]|\\{[^{}]*\\})*)\\}"));
  assert.ok(m, nom);
  return m[1];
}

// Défilement de la barre de vie : un calque qui déborde d'UNE période (84 px) à gauche et glisse d'exactement 84 px.
assert.match(corps(themes, "sorealBarreDefileV1"), /from\{transform:translateX\(0\)\}to\{transform:translateX\(84px\)\}/);
assert.ok(themes.includes("left:-84px;width:calc(100% + 84px)") && themes.includes("background-size:84px 100%"), "tuile de 84 px alignée sur le bord du calque");

// Plasma de la 3e ressource : calque de 3 largeurs, tuile de 2 largeurs (66,6667 %), glissement d'exactement une tuile.
assert.match(corps(themes, "sorealHudPlasma"), /from\{transform:translateX\(0\)\}to\{transform:translateX\(66\.6667%\)\}/);
assert.ok(themes.includes("left:-200%;width:300%") && themes.includes("0 0/66.6667% 100% repeat-x"), "plasma : calque 300 %, tuile 66,6667 %");

// Reflet des rangs 3, 4, 5 : calque de la taille de l'ancien fond (220 / 200 / 190 %) ; course calculée : 1,6 x (1 - s) / s et -0,6 x (1 - s) / s (en % de la largeur du calque).
for (const [taille, fa, fb] of [[2.2, -87.27, 32.73], [2.0, -80, 30], [1.9, -75.79, 28.42]]) {
  assert.ok(Math.abs((1.6 * (1 - taille)) / taille * 100 - fa) < 0.01 && Math.abs((-0.6 * (1 - taille)) / taille * 100 - fb) < 0.01, "course du reflet " + taille);
  assert.ok(themes.includes("--rg-fa:" + fa + "%;--rg-fb:" + fb + "%"), "reflet de largeur " + taille * 100 + " %");
}
assert.match(corps(themes, "sorealRgFluxV1"), /transform:translateX\(var\(--rg-fa\)\)[\s\S]*transform:translateX\(var\(--rg-fb\)\)/);

// Pulsations : opacité seule (le filtre ou l'ombre sont fixes, ou portés par un calque).
for (const nom of ["sorealBarreAlerteV1", "sorealRgBatV1", "sorealTmOrRapideV1", "sorealParalysieV1", "dfiPouls", "sorealCombatPulseV1", "sorealAlFenetresV1"]) {
  assert.ok(/opacity:/.test(corps(themes, nom)) && !/filter|box-shadow|background-position/.test(corps(themes, nom)), nom + " : opacité seule");
}
for (const nom of ["sorealIdleBarPulseV2", "sorealIdleNavGreenPulseV1", "sorealIdleNavYellowPulseV1", "sorealIdleParalysieV112"]) {
  assert.ok(/opacity:/.test(corps(ui, nom)) && !/filter|box-shadow/.test(corps(ui, nom)), nom + " : opacité seule");
}
for (const nom of ["sorealNavDispoV1", "sorealBoutonDispoV1", "sorealPointRougeV1", "sorealAlRenaitV1"]) {
  assert.ok(/transform:/.test(corps(themes, nom)) && !/filter|box-shadow/.test(corps(themes, nom)), nom + " : transform seul");
}
// Les calques de lueur portent l'ombre en STATIQUE.
assert.match(themes, /\.dfi-tuile\.cours::after\{[^}]*box-shadow:inset 0 0 22px 2px rgba\(255,77,94,\.85\)[^}]*opacity:0;animation:dfiPouls/);
assert.match(themes, /\.soreal-idle-adventure-paralysie-v1::after\{[^}]*box-shadow:0 0 22px rgba\(255,214,60,\.95\)[^}]*opacity:0;animation:sorealParalysieV1/);
assert.match(ui, /\.soreal-idle-nav-money-green-v1::after\{[^}]*box-shadow:0 0 24px 7px rgba\(46,204,113,\.72\)[^}]*opacity:0/);
assert.match(ui, /\.soreal-idle-nav-money-yellow-v1::after\{[^}]*box-shadow:0 0 24px 7px rgba\(241,196,15,\.68\)[^}]*opacity:0/);
// Mouvement réduit : les calques animés sont coupés.
assert.ok(themes.includes(".soreal-idle-tm-or-remplissage-v1.rapide::after{animation:none}") && themes.includes(".dfi-tuile.cours::after{animation:none"));

console.log("idle-animations-compositeur-v1 OK");
