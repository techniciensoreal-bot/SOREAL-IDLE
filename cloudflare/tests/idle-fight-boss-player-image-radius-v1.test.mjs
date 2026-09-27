import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-27) : « L'image du joueur dans fight boss est la seule à ne pas avoir de
 * bords arrondis. » Elle ne reposait que sur overflow:hidden du conteneur parent
 * (.soreal-idle-duel-portrait-v41), contrairement à l'image du boss qui porte elle-même
 * border-radius:14px (.soreal-idle-boss-image-v35). Même convention appliquée au joueur.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-ui.css", "utf8");

// Les trois sites de rendu de l'image du joueur passent la nouvelle classe dédiée.
const sites = [...ui.matchAll(/markupImageCombatIdleV61_\(\s*'joueur',[\s\S]{0,400}?\)/g)];
assert.equal(sites.length, 3, "trois sites de rendu de l'image du joueur (page Fight Boss + rafraîchissement en direct x2)");
for (const m of sites) {
  assert.match(m[0], /'soreal-idle-player-image-v41'/, "chaque site passe la classe dédiée à l'image du joueur");
}
assert.equal(
  (ui.match(/soreal-idle-player-image-v41/g) || []).length,
  3,
  "exactement trois occurrences (aucune classe orpheline en plus)"
);

assert.match(css, /\.soreal-idle-player-image-v41\{border-radius:14px\}/, "l'image du joueur porte elle-même un border-radius, comme .soreal-idle-boss-image-v35");

console.log("idle-fight-boss-player-image-radius-v1: OK");
