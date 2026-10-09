import assert from 'node:assert/strict';
import fs from 'node:fs';

const mod = fs.readFileSync('cloudflare/public/modules/nombres-couleur-v1.js', 'utf8');
const css = fs.readFileSync('cloudflare/public/soreal-idle-itopod.css', 'utf8');
const html = fs.readFileSync('cloudflare/public/index.html', 'utf8');

assert.match(html, /modules\/nombres-couleur-v1\.js\?v=\d+/, 'le module est chargé par index.html');
assert.match(css, /\.nb-suf\s*\{[^}]*color:/, 'la lettre du nombre a sa couleur');

/* Le motif : 155Dd, 1.50K, E+139 sont reconnus ; une phrase ne l'est pas. */
const sandbox = { window: {}, document: { readyState: 'loading', addEventListener() {} } };
new Function('window', 'document', 'requestAnimationFrame', 'MutationObserver', 'NodeFilter', mod)(sandbox.window, sandbox.document, () => {}, function () {}, {});
const api = sandbox.window.__SOREAL_IDLE_NOMBRES_COULEUR_V1__;
assert.ok(api, 'module exposé');
for (const t of ['155Dd', '1.50K', '10K Or', '2.3T', '1.2E+139']) assert.ok(api.admissible(t), t + ' coloré');
for (const t of ['Nécessite 5K niveaux pour débloquer la suite du jeu', 'Boss 12', '3 jours']) assert.ok(!api.admissible(t), t + ' laissé intact');

/* Augmentations : la somme est verte (ok) ou rouge (non) */
assert.match(css, /aug-cout-val\.ok/, 'somme verte');
assert.match(css, /aug-cout-val\.non/, 'somme rouge');
console.log('idle-nombres-couleur-v1: OK');

/* 2026-10-09 : une couleur par unité (toutes différentes), Qa bleu, Spd vert, exposant à part, et toujours un espace entre les chiffres et la lettre. */
{
  const couleurs = {};
  for (const m of css.matchAll(/\.nb-suf\[data-suf="([A-Za-z]+)"\]\{color:(#[0-9a-f]{6})\}/g)) couleurs[m[1]] = m[2];
  for (const u of api.unites) assert.ok(couleurs[u], 'une couleur pour ' + u);
  assert.ok(couleurs.e, "une couleur pour l'exposant (e+139)");
  const valeurs = Object.values(couleurs);
  assert.equal(new Set(valeurs).size, valeurs.length, 'chaque unité a une couleur différente');
  const hsl = (hex) => { const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255); const mx = Math.max(r, g, b), mn = Math.min(r, g, b); const d = mx - mn; let h = 0; if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return ((h * 60) + 360) % 360; };
  assert.ok(hsl(couleurs.Spd) > 100 && hsl(couleurs.Spd) < 160, 'Spd en vert');
  assert.ok(hsl(couleurs.Qa) > 200 && hsl(couleurs.Qa) < 250, 'Qa en bleu');
  assert.match(css, /html body \.nb-suf\{margin-left:\.2em\}/, 'toujours un espace entre le chiffre et la lettre');
  assert.equal(api.cle('Qa'), 'Qa'); assert.equal(api.cle('e+139'), 'e'); assert.equal(api.cle('E+5'), 'e');
}
