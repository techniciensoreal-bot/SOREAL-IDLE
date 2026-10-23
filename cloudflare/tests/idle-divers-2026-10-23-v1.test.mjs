import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const lire = (f) => readFileSync(f, "utf8");
const mobs = JSON.parse(lire("design/traductions/fr/mobs.json"));
/* « Sundae » garde son nom d'origine partout (jeu de mots avec Sunday) */
assert.ok(!("Sundae" in mobs), "aucune traduction française de Sundae");
assert.ok(!lire("design/ngu-boss-names-fr.json").includes("Coupe glacée"));
/* sangsue : jamais de jet parasite au changement de cadence */
const sang = lire("cloudflare/public/modules/sang-rituel-decor-v1.js");
assert.ok(sang.includes("if(sc.__cleAt&&maintenant-sc.__cleAt<350)return;") && sang.includes("sc.__cleAt=performance.now();"), "garde de 350 ms après un changement de cadence");
assert.ok(sang.includes("paq[i].onanimationiteration=null;paq[i].style.animation='none';"), "nouvelle Animation à chaque changement de cadence");
assert.ok(sang.includes("sc.__flux=(m===1)") && sang.includes("if(sc.__flux)return;") && sang.includes("}else if(!attente&&m>1){"), "mode continu : ni jets distincts ni recalage");
/* machine à remonter le temps : nom au-dessus, « Meilleur butin d'or » + Or dessous ; cases de taille fixe */
const md = lire("cloudflare/public/modules/machine-dessin-v1.js");
assert.ok(md.includes('id="tmmNomMob" x="130" y="296"') && md.includes("function tailleNom(nom)"));
assert.ok(lire("cloudflare/public/soreal-idle-machine.css").includes(".tmm-machine .tmm-case .tmm-case-val.soreal-idle-alloc-pop-v1{display:block"), "le gonflement du chiffre ne change plus la taille des cases");
/* fond du Coffre : le dernier ouvert persiste (velours / tapis vert) */
const v = lire("cloudflare/public/modules/valise-v1.js");
assert.ok(v.includes("soreal_idle_dernier_ouvert_v1") && v.includes("noterDernier('valise')") && v.includes("noterDernier('coffre')"));
assert.ok(lire("cloudflare/public/modules/ui-aventure-2-v1.js").includes("fondCoffre==='coffre'?' vl-tapis'"));
assert.ok(v.includes("min-height:var(--vl-m);pointer-events:none}") && v.includes(".vl-deplie .vl-art,${P} .vl-deplie button{pointer-events:auto}"), "toute la valise ouvre : le bloc déplié ne capte plus les clics");
console.log("idle-divers-2026-10-23-v1 OK");
/* cadre : tapis vert foncé par défaut (plus de bois) ; valise à la même distance du texte que le Coffre ; étiquette à gauche, à hauteur des yeux */
const css = lire("cloudflare/public/soreal-idle-itopod.css");
assert.ok(css.includes("radial-gradient(ellipse at 50% 30%,#1a5a30 0%,#11421f 52%,#082712 100%)!important;") && !css.includes("linear-gradient(180deg,#6b4a33,#563a28 55%,#3b2618)!important"), "fond par défaut vert foncé, plus de bois");
assert.ok(v.includes("function rapprocher(s,coffre,rv)") && v.includes("rapprocher(s,coffre,rv);") && v.includes("grid-template-columns:minmax(0,760px) 240px;justify-content:center"));
assert.ok(v.includes('<g class="vl-yeux">\'+\n        \'<g class="vl-etiquette"><path d="M29 80') && !v.includes('<rect x="212" y="168" width="40" height="26"'), "étiquette accrochée à l'extrémité gauche, dans le groupe des yeux");
assert.ok(v.includes(".vl-etiquette{transform-origin:29px 80px;"));
console.log("idle-divers-2026-10-23-v1 (cadre, distance, étiquette) OK");
/* ouverture / fermeture animées : Coffre (couvercle + contenu) et valise (bouche) */
const av = lire("cloudflare/public/modules/ui-aventure-2-v1.js");
assert.ok(av.includes("window.__coffreAnimOuvreIdleV1=Date.now();") && av.includes("racines.forEach(function(r){r.classList.add('ferme-anim');});") && av.includes("setTimeout(finir,400);"), "fermeture : l'animation joue AVANT le changement d'état");
assert.ok(av.includes('data-morph-classes-gardees="^(ferme-anim|ouvre)$"') && av.includes("classList.remove('ouvre')") && av.includes("classList.remove('ferme-anim')"), "classes gardées au redessin, retirées à la fin");
assert.ok(css.includes("@keyframes bgOuvre") && css.includes("@keyframes bgReplie") && css.includes(".soreal-idle-coffre-v1.ouvre .bg-bagage-v1 .bg-couvercle{animation:bgOuvre"));
assert.ok(v.includes("@keyframes vlOuvre") && v.includes("@keyframes vlFerme") && v.includes("s.classList.add('vl-ferme')") && v.includes("anim|baille|ferme)$"), "bouche de la valise : vraies animations à l'ouverture et à la fermeture");
console.log("idle-divers-2026-10-23-v1 (ouvertures animées) OK");
/* le cadre s'allonge / se raccourcit en douceur, l'écran ne bouge pas */
assert.ok(av.includes("function animerHauteurCoffreIdleV1_(racine,de,vers,ms)") && av.includes("window.scrollTo(sx,sy)") && av.includes("Math.max(racine1.getBoundingClientRect().height,racine1.scrollHeight)"), "hauteur animée, défilement conservé");
assert.ok(css.includes(".soreal-idle-page-root-v28{overflow-anchor:none}"));
console.log("idle-divers-2026-10-23-v1 (cadre en douceur) OK");
