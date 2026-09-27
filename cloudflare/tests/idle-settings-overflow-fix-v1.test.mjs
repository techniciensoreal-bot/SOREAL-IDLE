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

console.log("idle-settings-overflow-fix-v1: OK");
