import assert from "node:assert/strict";
import fs from "node:fs";

/*
 * Bandeau « En direct » (plan C9, 2026-11-06) : mesuré sur le téléphone de Norman, l'arrivée d'une information provoquait une image de 42 ms (flux-v1.js, boucle) : le code lisait clientWidth, scrollWidth puis
 * getBoundingClientRect au milieu de l'image, ce qui force un calcul complet de la mise en page. Les largeurs sont désormais suivies par un ResizeObserver (lecture dans son rappel, mise en page déjà calculée) ;
 * la lecture directe n'est plus qu'un repli quand ResizeObserver n'existe pas.
 */
const src = fs.readFileSync("cloudflare/public/modules/flux-v1.js", "utf8");

assert.ok(/new ResizeObserver\(/.test(src), "largeurs suivies par un ResizeObserver");
/* arrivée d'une information : aucune lecture de mise en page quand l'observateur existe */
const ajout = src.slice(src.indexOf("function ajouterAuBandeau"), src.indexOf("function viderBandeau"));
assert.ok(/if\(!roFlux\)largeurVue=vue\.clientWidth/.test(ajout), "largeur de la vue : lecture directe seulement en repli");
assert.ok(/x\+\(roFlux\?largeurPiste:piste\.scrollWidth\)/.test(ajout), "fin de piste : largeur suivie, scrollWidth seulement en repli");
assert.ok(/roFlux\.observe\(noeud\)/.test(ajout), "chaque information est suivie dès son ajout");
assert.ok(/blanc\.__largeurV1=/.test(ajout), "la largeur du blanc de prolongement est connue sans mesure");
/* la boucle d'images n'a plus de mesure quand l'observateur existe */
const boucle = src.slice(src.indexOf("function boucle(t)"), src.indexOf("function enfiler()"));
assert.ok(/const w=roFlux\?premier\.__largeurV1:\(premier\.__largeurV1\|\|\(premier\.__largeurV1=premier\.getBoundingClientRect\(\)\.width\)\)/.test(boucle), "retrait en tête : largeur déjà connue");
assert.ok(/w===undefined\|\|x\+w>0/.test(boucle), "une information pas encore mesurée est à l'écran : jamais retirée");
assert.ok(/roFlux\.unobserve\(premier\)/.test(boucle) && /largeurPiste=Math\.max\(0,largeurPiste-w\)/.test(boucle), "retrait : plus suivie, largeur de piste mise à jour");
/* l'observateur lit les largeurs dans son rappel seulement */
const rappel = src.slice(src.indexOf("roFlux=new ResizeObserver"), src.indexOf("roFlux.observe(vueFlux)"));
assert.ok(/offsetWidth/.test(rappel) && /clientWidth/.test(rappel), "lecture dans le rappel de l'observateur");
/* vider : plus rien n'est suivi, largeur remise à zéro */
const vider = src.slice(src.indexOf("function viderBandeau"), src.indexOf("function boucle(t)"));
assert.ok(/largeurPiste=0/.test(vider) && /roFlux\.disconnect\(\)/.test(vider), "bandeau vidé : suivi remis à zéro");
console.log("idle-flux-sans-mise-en-page-forcee-v1: OK");
