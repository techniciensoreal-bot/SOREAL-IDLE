import fs from 'node:fs';
import assert from 'node:assert/strict';
const lire=f=>fs.readFileSync(new URL('../public/'+f,import.meta.url),'utf8');
const audio=lire('modules/audio-coffre-v1.js'),eff=lire('modules/audio-effects-v199.js'),coffre=lire('modules/coffre-sommeil-v1.js'),valise=lire('modules/valise-v1.js'),css=lire('soreal-idle-itopod.css');
/* sons : deux bâillements distincts, vomis aigus choisis, un seul pet « normal » (coussin) */
assert.match(audio,/id:'baille-coffre'/);assert.match(audio,/id:'baille-valise'/);
assert.match(audio,/id:'vomi-aigu-hurk'/);assert.match(audio,/id:'vomi-hoquets'/);
assert.doesNotMatch(audio,/id:'vomi-nausee'|id:'vomi-jets'/);
assert.match(audio,/id:'pet-coussin'/);assert.doesNotMatch(audio,/id:'pet-court'|id:'pet-mouille'/);
/* le vomi de la valise et les bâillements passent par le module de sons du Coffre */
assert.match(eff,/jouerVomi\(c,master\|\|c\.destination\)/);assert.match(eff,/baille:function\(qui\)/);
/* Coffre : bâillement rare, jamais ouvert, endormi, avec la valise ni pendant une bulle */
assert.match(coffre,/__coffreBailleIdleV1__/);assert.match(coffre,/__valiseBailleIdleV1__/);assert.match(coffre,/classList\.contains\('ouvert'\)/);
assert.match(css,/\.bg-bagage-v1\.bg-baille-v1 \.bg-couvercle\{animation:bgBailleGrand/);
/* valise : classe gardée au redessin, jamais avec le Coffre qui bâille, animations réduites respectées */
assert.match(valise,/\^vl-\(dort\|ouverte\|parle\|glou\|anim\|baille\|ferme\)\$/);
assert.match(valise,/if\(window\.__coffreBailleIdleV1__\)return false/);assert.match(valise,/!reduit\(\)/);
/* aucun !important ajouté */
assert.doesNotMatch(css.slice(css.indexOf('Bâillement du Coffre'), css.indexOf('Bâillement du Coffre') + 3000),/!important/);   /* le bloc du bâillement seulement (les blocs ajoutés plus loin dans la feuille ont leurs propres tests) */
console.log('idle-baillements-v1 OK');
/* vomi sur les objets de la valise non nettoyée ; texte centré entre le Coffre et la valise (PC) */
const acc=lire('modules/valise-accident-v1.js');
assert.match(acc,/\.vl-section:has\(\.vl-bete\[data-vomi\]\) \.vl-art::after/);
assert.match(valise,/\[data-idle-coffre-drop-v180\] \.bg-texte-v1\{text-align:center\}/);
console.log('idle-baillements-v1 (vomi objets, texte centré) OK');
/* l'éponge ne frotte que la tache aux pieds : la flaque ne reçoit rien, seule la moitié basse de sa zone tactile frotte */
const cac=lire('modules/coffre-accident-v1.js');
for(const [src,cl] of [[acc,'vl-flaque-v1'],[cac,'bg-flaque-v1']]){
  assert.match(src,new RegExp('\.'+cl+'::after\{content:"";position:absolute;top:50%;'));
  assert.doesNotMatch(src,new RegExp('\.'+cl+'\{[^}]*pointer-events:auto'));
  assert.doesNotMatch(src,/top:calc\(-70px \/ var\(--s\)\)/);
}
console.log('idle-baillements-v1 (éponge sur la tache seulement) OK');
/* le cadre ne coupe plus les bulles : la règle de page (page-root[data-menu]) est surpassée */
assert.match(valise,/\.soreal-idle-page-root-v28\[data-menu\] \.soreal-idle-section-v8\.soreal-idle-coffre-v1\.soreal-idle-coffre-v1\.soreal-idle-coffre-v1\{overflow:visible\}/);
console.log('idle-baillements-v1 (bulles hors du cadre) OK');
