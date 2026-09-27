import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-27) : « toute l'interface du jeu n'est pas centrée. Elle déborde sur la droite de l'écran. Ce
 * qui fait que le menu settings par exemple est coupé sur la droite par l'écran. »
 *
 * Cause : deux grilles à colonnes égales utilisaient `1fr 1fr` (ou `1fr 1fr` / `1fr` bare) sans `minmax(0,...)`.
 * Une piste de grille CSS a par défaut min-width:auto (la largeur min-content de son contenu), pas 0 : si le
 * texte d'un bouton ne rentre pas, la grille -- et donc toute la mise en page qui suit -- est forcée plus large
 * que son conteneur au lieu de rétrécir, ce qui déclenche un défilement horizontal (l'app ne "bouge" pas, elle
 * dépasse juste du cadre -- ce qui se voit comme "coupé à droite"). Le bouton « Partie B » (Paramètres,
 * .soreal-idle-parties-dev-v1, admin seulement -- exactement le compte de Norman) est tout en haut de la page
 * Paramètres et le suspect le plus probable.
 */
const css = readFileSync("cloudflare/public/soreal-idle-ui.css", "utf8");

for (const selecteur of [".soreal-idle-parties-dev-v1", ".soreal-idle-boss-fiche-stats-v1"]) {
  const i = css.indexOf(selecteur + "{");
  assert.ok(i >= 0, selecteur + " introuvable");
  const bloc = css.slice(i, css.indexOf("}", i));
  assert.match(bloc, /grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\);/, selecteur + " : les pistes doivent pouvoir rétrécir sous leur contenu (jamais forcer la page plus large)");
  assert.ok(!bloc.includes("grid-template-columns:1fr 1fr;"), selecteur + " : plus de piste bare 1fr");
}

/*
 * Norman (2026-09-27, suite) : le débordement persistait après la correction des grilles ci-dessus -- deuxième cause
 * trouvée : plusieurs boutons pleine largeur (`width:100%`) avec `padding`/`border` mais SANS `box-sizing:border-box`
 * (le défaut CSS, `content-box`, ajoute le padding/la bordure EN PLUS de 100% -- donc au-delà du conteneur). Le bouton
 * « Réinitialiser entièrement » (`.soreal-idle-danger-button-v67`, page Paramètres, tout en bas) en est un exemple direct.
 */
for (const selecteur of [
  ".soreal-idle-danger-button-v67",
  ".soreal-idle-zone-custom-v1 .team-sort-trigger",
  ".soreal-idle-zone-custom-v1 .team-sort-option",
  ".soreal-idle-zone-button-v16",
  ".soreal-idle-rebirth-button-v14",
  ".soreal-idle-item-popup-actions-v165 button",
  ".soreal-idle-action-button-v50",
  ".soreal-idle-boss-card-image-v91"
]) {
  const i = css.indexOf(selecteur + "{");
  assert.ok(i >= 0, selecteur + " introuvable");
  const bloc = css.slice(i, css.indexOf("}", i));
  assert.match(bloc, /width:100%/, selecteur + " : toujours pleine largeur");
  assert.match(bloc, /box-sizing:border-box/, selecteur + " : padding/bordure ne doivent jamais dépasser 100% du conteneur");
}

// Filet de sécurité général (pas seulement en media query mobile) : un débordement horizontal oublié est coupé, jamais scrollable/décentré.
assert.match(css, /^html,body\{overflow-x:hidden\}$/m, "filet de sécurité overflow-x sur html/body, hors media query mobile");

console.log("idle-settings-overflow-fix-v1: OK");
