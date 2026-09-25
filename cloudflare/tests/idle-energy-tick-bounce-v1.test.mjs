import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-25) : « La barre démarre de 0 et va taper jusqu'au 500. Elle repart instantanément de 1 et va taper dans 500, elle repart
 * instantanément de 2 et va taper dans 500… Pas d'animation de 500 vers 3, pas d'animation de 500 vers 2 etc. »
 * (remplace la version « balle qui rebondit » du 2026-09-24 : montée puis descente animée).
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-ui.css", "utf8");

const src = ui.match(/function largeurTickEnergieIdleV1_\(valeur,gain,progression,max\)\{[\s\S]*?\n      \}\n/)[0];
const largeur = new Function(src + "return largeurTickEnergieIdleV1_;")();
const MAX = 500;

for (const v of [0, 1, 2, 3, 250, 499]) {
  assert.equal(largeur(v, 1, 0, MAX), v, `le tick ${v} démarre exactement au remplissage`);
  assert.equal(largeur(v, 1, 1, MAX), MAX, `et tape dans ${MAX} avant la fin du tick`);
  let precedent = -Infinity;
  let atteint = -1;
  for (let i = 0; i <= 1000; i += 1) {
    const x = largeur(v, 1, i / 1000, MAX);
    assert.ok(x >= precedent - 1e-9, "la barre ne redescend jamais pendant le tick");
    assert.ok(x <= MAX + 1e-9, "elle ne dépasse pas le cap");
    if (atteint < 0 && x === MAX) atteint = i / 1000;
    precedent = x;
  }
  // Vitesse constante : le cap est touché à (cap - valeur) / cap du tick, puis la barre y reste.
  assert.ok(Math.abs(atteint - (MAX - v) / MAX) <= 0.001 + 1e-9, `cap touché à ${atteint} du tick pour un départ à ${v}`);
}

// Enchaînement 0 → 500, 1 → 500, 2 → 500, 3 → 500 : le départ suivant est instantané (aucune valeur intermédiaire entre 500 et 1).
const suite = [0, 1, 2, 3].flatMap((v) => [largeur(v, 1, 0, MAX), largeur(v, 1, 1, MAX)]);
assert.deepEqual(suite, [0, 500, 1, 500, 2, 500, 3, 500]);

// Aucune transition CSS ne transforme le retour en animation.
assert.match(css, /\.soreal-idle-energybar-v11\{\s*\/\*[^*]*\*\/\s*transition:none !important;/);
// Le client passe toujours le gain du tick (signature inchangée).
assert.match(ui, /maxTotal,\s*metaTickEnergie\.gain\s*\);/);

console.log("idle-energy-tick-bounce-v1 OK");
