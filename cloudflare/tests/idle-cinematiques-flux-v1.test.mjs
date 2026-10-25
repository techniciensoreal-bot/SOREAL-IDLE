import fs from 'node:fs';
import assert from 'node:assert/strict';
const lire = f => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const chro = lire('public/modules/ui-chroniques-v1.js');
const tuto = lire('public/modules/ui-tutoriel-v1.js');
const flux = lire('public/modules/flux-v1.js');
const srvFlux = lire('src/idle-flux-v1.js');
const actions = lire('src/idle-ngu-actions.js');

// onglet Cinématiques : jamais seul, aperçu = première image, rejeu sans marque de « vu »
assert.ok(/if\(liste\.length\)liste\.push\(\{nom:'Cinématiques'/.test(chro), 'onglet jamais seul (anti-spoil)');
assert.ok(chro.includes('d.url(0)'), 'aperçu = première image de l’intro');
assert.ok(chro.includes("action:'watchCinematic'"));
assert.ok(/rejeu:Boolean\(options&&options\.rejeu\)/.test(tuto));
assert.ok(tuto.includes('if(etat&&!etat.rejeu)idleTutorielPagesMarquerVuV1_'), 'un rejeu ne marque rien');
// serveur : action connue, événement, phrase gardée par le menu
assert.ok(actions.includes('IDLE_CINEMATIQUES_V1') && actions.includes('"watchCinematic"'));
assert.ok(srvFlux.includes('type: "cinematique"'));
assert.ok(flux.includes("case 'cinematique'") && flux.includes('if(!k.menus.chroniques)return null'));
// nouveaux événements de progression
for (const t of ['tm', 'wandoosOs', 'wandoos', 'ngu', 'diggers', 'diggersNiveau', 'tour', 'avance']) {
  assert.ok(srvFlux.includes('type: "' + t + '"'), 'événement serveur ' + t);
  assert.ok(flux.includes("case '" + t + "'"), 'phrase client ' + t);
}
console.log('ok idle-cinematiques-flux-v1');

// Coffre : la hauteur fermée retenue est la VRAIE (jamais celle forcée par l'animation) ; mesurée avant ferme-anim ; connue dès l'ouverture
const av = lire('public/modules/ui-aventure-2-v1.js');
assert.ok(av.includes("nr.style.removeProperty('height');nr.style.removeProperty('overflow');\r\n") || av.includes("nr.style.removeProperty('height');nr.style.removeProperty('overflow');\n"));
assert.ok(av.indexOf('fermeMesure=racines[0]') < av.indexOf("r.classList.add('ferme-anim')"), 'mesure avant la classe');
assert.ok(av.includes('if(hAvant>0)window.__coffreHFermeV1=hAvant;'));
console.log('ok coffre hauteur fermee');
