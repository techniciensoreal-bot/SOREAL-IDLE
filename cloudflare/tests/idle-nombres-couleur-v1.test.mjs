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
