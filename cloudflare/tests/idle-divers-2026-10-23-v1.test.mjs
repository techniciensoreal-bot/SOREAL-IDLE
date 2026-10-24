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
assert.ok(av.includes('data-morph-classes-gardees="^(ferme-anim|ouvre|hors-ecran)$"') && av.includes("classList.remove('ouvre')") && av.includes("classList.remove('ferme-anim')"), "classes gardées au redessin, retirées à la fin");
assert.ok(css.includes("@keyframes bgOuvre") && css.includes("@keyframes bgReplie") && css.includes(".soreal-idle-coffre-v1.ouvre .bg-bagage-v1 .bg-couvercle{animation:bgOuvre"));
assert.ok(v.includes("@keyframes vlOuvre") && v.includes("@keyframes vlFerme") && v.includes("s.classList.add('vl-ferme')") && v.includes("anim|baille|ferme)$"), "bouche de la valise : vraies animations à l'ouverture et à la fermeture");
console.log("idle-divers-2026-10-23-v1 (ouvertures animées) OK");
/* le cadre s'allonge / se raccourcit en douceur, l'écran ne bouge pas */
assert.ok(av.includes("function animerHauteurCoffreIdleV1_(racine,de,vers,ms)") && av.includes("window.scrollTo(sx,sy)") && av.includes("Math.max(racine1.getBoundingClientRect().height,racine1.scrollHeight)"), "hauteur animée, défilement conservé");
assert.ok(css.includes(".soreal-idle-page-root-v28{overflow-anchor:none}"));
assert.ok(av.includes("bloc.style.display='none';") && av.includes("const ferme=r0.getBoundingClientRect().height;"), "hauteur refermée mesurée, pas estimée");
console.log("idle-divers-2026-10-23-v1 (cadre en douceur) OK");
/* la valise garde sa taille et sa place quand le Coffre se redessine : réglages en variables du module, écrits dans son HTML ; décalage par « left » (une marge négative l'élargissait) */
assert.ok(v.includes("function styleSection()") && v.includes('style="\'+styleSection()+\'" data-vl data-vl-sig=') && v.includes("s.style.position='relative';s.style.left=") && !v.includes("s.style.marginLeft"));
console.log("idle-divers-2026-10-23-v1 (valise stable au redessin) OK");
/* fiches d'objets : plus de « Special: » devant les intitulés, et intitulés sur une ligne (police réduite au besoin) */
assert.ok(!av.includes('class="sb-special-v1">Special: ') && !av.includes('class="sb-special-v1">Special Bonus: '), "plus de préfixe « Special: » dans la description");
const lu = lire("cloudflare/public/modules/ligne-unique-items-v1.js");
assert.ok(lu.includes("while(l.scrollWidth>l.clientWidth+1&&taille>MIN)") && lire("cloudflare/public/index.html").includes("/modules/ligne-unique-items-v1.js"));
assert.ok(css.includes(".soreal-idle-v138-details-stat>span{white-space:nowrap;min-width:0}") && css.includes("flex-wrap:nowrap;gap:8px;min-width:0;max-width:100%"));
console.log("idle-divers-2026-10-23-v1 (intitulés d'objets) OK");
/* téléphone : le Coffre s'ouvre SOUS LUI-MÊME et pousse la valise ; le redessin ne retire plus « data-volet » ; le journal note sauts et redessins du Coffre */
assert.ok(v.includes(">.vl-section{order:3;margin-top:8px;padding-top:12px;border-top:2px dashed") && v.includes(".ouvert:has(>.vl-section)>div:last-child:not(.vl-section){order:2}"), "téléphone : coffre, puis son contenu, puis la valise");
const vo = lire("cloudflare/public/modules/inventaire-volet-v1.js");
assert.ok(vo.includes(".push('data-volet')"), "data-volet gardé au redessin (sinon la mise en page saute à chaque redessin)");
const dc = lire("cloudflare/public/modules/diag-coffre-v1.js"), df = lire("cloudflare/public/modules/diag-fluidite-v1.js");
assert.ok(dc.includes("type:'layout-shift'") && dc.includes("noter('redessin_coffre'") && dc.includes("noter('hauteur_page'") && df.includes("noter:function(type,cle,details)") && df.includes("saut_page:40,hauteur_page:30,redessin_coffre:30"));
assert.ok(lire("cloudflare/public/index.html").includes("/modules/diag-coffre-v1.js"));
console.log("idle-divers-2026-10-23-v1 (téléphone, journal) OK");

/* fermeture : la case du Coffre ne se comprime plus (flex-shrink:0), le contenu se replie en douceur et la valise remonte avec lui */
assert.ok(v.includes(":has(>.vl-section)>*{flex-shrink:0}"), "aucun bloc du cadre ne se comprime");
assert.ok(av.includes("sb.setProperty('max-height',cb.toFixed(1)+'px','important');") && av.includes("border-top-width '+ease"), "contenu replié en douceur, en même temps que le cadre");
console.log("idle-divers-2026-10-23-v1 (fermeture sans saut) OK");
/* journal du téléphone (14 à 25 images/s, 57 animations CSS) : le Coffre et la valise ne s'animent que lorsqu'on les voit */
const ah = lire("cloudflare/public/modules/animations-hors-ecran-v1.js");
assert.ok(ah.includes("rootMargin:'150px 0px 150px 0px'") && ah.includes(".hors-ecran.hors-ecran *") && ah.includes("animation-play-state:paused") && !ah.includes("!important"), "pause hors écran, sans !important");
assert.ok(av.includes('"^(ferme-anim|ouvre|hors-ecran)$"') && lire("cloudflare/public/index.html").includes("/modules/animations-hors-ecran-v1.js"));
console.log("idle-divers-2026-10-23-v1 (animations hors écran) OK");

/* journal : numéro dans la clé (plus de lignes avalées par la limite de 5 s), état du Coffre, défilement et dernier toucher */
assert.ok(dc.includes("x.noter(type,String(cle)+'#'+seq,o);") && dc.includes("toucher:dernierToucher.cible"), "lignes du journal contextualisées");
console.log("idle-divers-2026-10-23-v1 (journal contextualisé) OK");

// Ouverture / fermeture du Coffre ou de la valise : le reste de la page est mis en pause (peu d'images/s sur téléphone).
{
  const h = readFileSync("cloudflare/public/modules/animations-hors-ecran-v1.js", "utf8");
  assert.ok(h.includes("html.soreal-anim-coffre body *:not(.soreal-idle-coffre-v1)") && h.includes("pause:pause"));
  assert.ok(readFileSync("cloudflare/public/modules/valise-v1.js", "utf8").includes("ah.pause(retard+duree"));
  assert.ok(readFileSync("cloudflare/public/modules/ui-aventure-2-v1.js", "utf8").includes("ah.pause(2200)"));
}
