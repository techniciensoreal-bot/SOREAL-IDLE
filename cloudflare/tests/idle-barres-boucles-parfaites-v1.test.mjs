import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-09) : « pour toutes les barres qui ont un effet dans ce style, fondu d'entrée et de sortie pour éviter les saccades dues à des boucles non parfaites ; si j'ajoute des animations dans une
 * nouvelle barre, pense-y automatiquement ». Règle n°3 d'AGENTS.md. Ce test garde les barres du bandeau (braises, magie, 3e ressource) et sert de modèle pour une nouvelle barre animée.
 */
const css = readFileSync("cloudflare/public/soreal-idle-themes.css", "utf8");
const regles = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ sel: m[1].trim(), corps: m[2] }));

// 1. Éléments qui apparaissent / disparaissent : opacité 0 au début ET à la fin du cycle, mouvement dans un seul sens.
function keyframes(nom) {
  const tous = [...css.matchAll(new RegExp("@keyframes " + nom + "\{((?:[^{}]|\{[^{}]*\})*)\}", "g"))];
  assert.ok(tous.length, "keyframes " + nom);
  return tous[tous.length - 1][1]; // la dernière définition est celle qui s'applique
}
for (const nom of ["sorealHudRune"]) {
  const k = keyframes(nom);
  assert.match(k, /0%\{opacity:0;/, nom + " : fondu d'entrée (opacité 0 au départ)");
  assert.match(k, /100%\{opacity:0;/, nom + " : fondu de sortie (opacité 0 à l'arrivée)");
  const xs = [...k.matchAll(/translate\((-?[\d.]+)px/g)].map((m) => Number(m[1]));
  assert.ok(xs.length >= 3 && xs.every((x, i) => i === 0 || x >= xs[i - 1]), nom + " : le mouvement ne recule jamais");
}

// 2. Motifs qui défilent : chaque règle qui anime sorealHudBgx déclare sa période (--p) ; la tuile de TOUTES les couches est explicite et égale à --p.
const defilants = regles.filter((r) => /animation:[^;]*sorealHudBgx/.test(r.corps));
assert.ok(defilants.length >= 5, "les règles de défilement sont trouvées");
for (const r of defilants) {
  const p = r.corps.match(/--p:(\d+)px/);
  assert.ok(p, "période --p déclarée : " + r.sel.slice(-60));
  const tuile = r.corps.match(/\/(\d+)px (\d+)px/);
  assert.ok(tuile, "tuile déclarée : " + r.sel.slice(-60));
  assert.equal(tuile[1], p[1], "glissement = une période de tuile : " + r.sel.slice(-60));
  const couches = (r.corps.match(/radial-gradient|url\(/g) || []).length;
  if (couches > 1) {
    const toutes = regles.some((x) => x.sel === r.sel && /background-size:\d+px \d+px/.test(x.corps) && /background-repeat:repeat-x/.test(x.corps));
    assert.ok(toutes, "background-size explicite sur toutes les couches (une taille dans « background: » ne vaut que pour la dernière) : " + r.sel.slice(-60));
  }
}

// 3. Aurore : le glissement vaut une période du dégradé (300 % de large, motif répété à 150 %).
assert.match(keyframes("sorealHudAurore"), /from\{background-position:100% 0\}to\{background-position:25% 0\}/, "aurore : 100 % vers 25 % = 150 % = une période");

// 4. Points masqués aux deux bouts, et mouvement réduit coupé.
assert.ok(css.includes("mask-image:linear-gradient(90deg,transparent 0,#000 26px,#000 calc(100% - 26px),transparent 100%)"), "points estompés aux deux bouts du liquide");
assert.ok(css.includes("@media (prefers-reduced-motion:reduce){") && css.includes("animation:none!important"), "mouvement réduit : animations coupées");
console.log("idle-barres-boucles-parfaites-v1: OK");
