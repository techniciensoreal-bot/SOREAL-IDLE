import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-24) : « Je n'aime pas comment tique la barre d'énergie. Ils devaient partir à chaque fois de l'endroit où se situe le
 * remplissage. Exemple 400/1000 : la trajectoire entre 400 et 1000 est la même que entre 0 et 1000 ou entre 999 et 1000. Elle s'allonge
 * mais ne se rétracte pas visuellement… il n'y a que la montée qui est fluide, la baisse est instantanée. Plus elle se remplit et moins
 * vite la barre devra aller rejoindre le 1000, un peu comme une balle qui rebondit. »
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-ui.css", "utf8");

const src = ui.match(/function largeurTickEnergieIdleV1_\(valeur,gain,progression,max\)\{[\s\S]*?\n      \}\n/)[0];
const largeur = new Function(src + "return largeurTickEnergieIdleV1_;")();
const MAX = 1000;
const pas = 1e-3;
const courbe = (v, g) => Array.from({ length: 1001 }, (_, i) => largeur(v, g, i * pas, MAX));

for (const [v, g] of [[0, 1], [400, 1], [400, 25], [900, 5], [999, 1], [0, 300]]) {
  const c = courbe(v, g);
  const cible = Math.min(MAX, v + g);
  assert.equal(c[0], v, `le tick part exactement du remplissage (${v})`);
  assert.equal(c[1000], cible, `et finit exactement au nouveau remplissage (${cible}) : pas de saut au tick suivant`);
  assert.equal(Math.max(...c), MAX, "le rebond va jusqu'au cap");
  // Continuité : aucun saut instantané, ni à la montée ni à la descente (vitesse constante = 2 x cap par tick).
  const vitesse = 2 * MAX * pas;
  for (let i = 1; i < c.length; i += 1) {
    assert.ok(Math.abs(c[i] - c[i - 1]) <= vitesse + 1e-9, `pas ${i} : variation ${c[i] - c[i - 1]} <= ${vitesse}`);
  }
  // La barre ne se rétracte QUE de façon fluide : la descente est strictement à vitesse constante.
  const iMax = c.indexOf(MAX);
  const descente = c.slice(iMax).filter((x, i, a) => i > 0 && a[i - 1] > cible && x >= cible).map((x, i, a) => (i === 0 ? null : a[i - 1] - x)).filter((d) => d !== null && d > 1e-9);
  assert.ok(descente.slice(0, -1).every((d) => Math.abs(d - vitesse) < 1e-6), "descente à vitesse constante");
}

// Plus la barre est remplie, plus le rebond est COURT (même vitesse, distance plus petite) — comme une balle qui rebondit.
const dureeRebond = (v, g) => {
  const c = courbe(v, g);
  const cible = Math.min(MAX, v + g);
  const fin = c.findIndex((x, i) => i > 0 && x === cible && c[i - 1] > cible);
  return fin < 0 ? 0 : fin;
};
const d0 = dureeRebond(0, 1), d400 = dureeRebond(400, 1), d999 = dureeRebond(998, 1);
assert.ok(d0 > d400 && d400 > d999, `durées de rebond décroissantes : ${d0} > ${d400} > ${d999}`);
assert.ok(Math.abs(d400 / d0 - 0.6) < 0.01, "depuis 400/1000 : 60 % du trajet complet, à la même vitesse");

// Cap atteint : la barre reste pleine.
assert.equal(largeur(1000, 5, 0.5, MAX), 1000);

// Le client passe le gain du tick, et aucune transition CSS ne retarde ni n'adoucit le rebond.
assert.match(ui, /maxTotal,\s*metaTickEnergie\.gain\s*\);/);
assert.match(css, /\.soreal-idle-energybar-v11\{\s*\/\*[^*]*\*\/\s*transition:none !important;/);

console.log("idle-energy-tick-bounce-v1 OK");
