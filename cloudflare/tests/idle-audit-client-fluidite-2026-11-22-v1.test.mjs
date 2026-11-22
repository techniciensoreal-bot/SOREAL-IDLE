/* Audit client 2026-11-22 : travail inutile retiré (onglet caché, observateur sans objet, code mort). Garde de non-régression. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
const lire = f => fs.readFileSync(new URL('../public/' + f, import.meta.url), 'utf8');
const valise = lire('modules/valise-v1.js');
assert.match(valise, /function pas\(\)\{\n\s*if\(document\.hidden\)return;/, 'valise : aucune lecture de mise en page onglet caché');
const bandes = lire('modules/borne-bandes-sync-v1.js');
assert.match(bandes, /setInterval\(function\(\)\{if\(!document\.hidden\)synchroniser\(\);\},4000\)/, 'bandes de la borne : pas de balayage onglet caché');
assert.match(bandes, /APRES_REDESSIN_V1__.*push\(synchroniser\)/, 'le redessin rejoue toujours la synchro (règle n°4)');
const mp = lire('modules/money-pit-page-v1.js');
assert.match(mp, /function surveillerYeuxIdleV1_\(\)\{[^]*?getElementsByClassName\('mp3-calques'\)\.length\)return;/, 'Money Pit : l\'observateur ne balaie rien sans image');
const ta = lire('modules/textes-admin-v1.js');
assert.match(ta, /new MutationObserver\(function\(ml\)\{if\(!document\.getElementById\(EDITEUR_ID\)\)return;/, 'éditeur de textes : observateur inactif sans éditeur');
const ic = lire('modules/inventory-configs-v1.js');
assert.doesNotMatch(ic, /identifiantsPortes|identifiantsConfig/, 'code mort retiré');
assert.doesNotMatch(lire('modules/local-neural-piper-v1.js'), /setInterval\(/, 'attente du phonémiseur : chaîne de setTimeout');
console.log('ok idle-audit-client-fluidite-2026-11-22-v1');
