import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source=readFileSync(
  new URL("../public/soreal-idle-ui.js",import.meta.url),
  "utf8"
);

assert.match(
  source,
  /const pctJoueur=[\s\S]{0,500}idleEtat\.pvJoueur[\s\S]{0,180}idleEtat\.pvJoueurMax[\s\S]{0,120}\*\s*100/,
  "La couleur/largeur de la barre joueur doit être calculée avec pvJoueur / pvJoueurMax."
);

assert.match(
  source,
  /classList\.toggle\(\s*'low',\s*pctJoueur<=50&&pctJoueur>25\s*\)/,
  "La barre joueur doit être jaune entre 25% et 50% inclus."
);

assert.match(
  source,
  /classList\.toggle\(\s*'critical',\s*pctJoueur<=25\s*\)/,
  "La barre joueur doit être rouge à 25% ou moins."
);

console.log("Fight Boss player HP colors V178: OK");
