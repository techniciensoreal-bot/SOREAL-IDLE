// Norman (2026-10-30) : le classeur des chroniques s'adapte à la fenêtre (même petit) et se zoome avec + et − ; les cartes rangées s'écrivent comme la carte sortie ; la carte rentre par le haut de sa pochette ; les boutons de la fiche d'objet ne sont plus coupés. PC et téléphone.
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
const lire = (f) => fs.readFileSync(f, "utf8").replace(/\r\n/g, "\n");
const js = lire("cloudflare/public/modules/album-cartes-v1.js");
const css = lire("cloudflare/public/soreal-idle-album.css");

// --- adaptation à la fenêtre et zoom
assert.ok(js.includes('<div class="alb-adapt">\'+zoomHtml()+\'<div class="alb-cadre"><div class="alb-echelle"><div class="alb-classeur'), "le classeur est posé dans un cadre mis à l'échelle, avec la barre de zoom");
for (const v of ["--alb-s", "--alb-w", "--alb-h", "--alb-nw", "--alb-k", "--alb-ref"]) assert.ok(js.includes("setProperty('" + v + "'"), "variable " + v + " posée sur <html> (jamais en attribut de la page : un redessin ne l'efface pas)");
assert.ok(js.includes("Math.min(1,dispo/nw,haut/nh)"), "tient en largeur ET en hauteur dans la fenêtre");
assert.ok(js.includes("zoomer:zoomer,adapter:adapter") && js.includes("Math.max(.5,Math.min(2,"), "zoom de 50 % à 200 %");
assert.ok(js.includes("window.addEventListener('resize',function(){\n  clearTimeout(tailleVue);\n  adapter();") || js.includes("clearTimeout(tailleVue);\n  adapter();"), "recalcul à chaque changement de taille de la fenêtre");
assert.ok(js.includes("localStorage.setItem(CLE_ZOOM") && js.includes("soreal_idle_album_zoom_v1"), "zoom mémorisé (préférence liée au compte)");
assert.ok(css.includes("transform:scale(var(--alb-s,1))") && css.includes("width:var(--alb-nw,980px)"), "classeur à taille de référence fixe, mis à l'échelle");
assert.ok(css.includes("width:var(--alb-ref,400px);height:calc(var(--alb-ref,400px) * 1.68)") && css.includes("transform:scale(var(--alb-k,.315))"), "cartes des pochettes dessinées à la largeur de la carte sortie, puis réduites (noms jamais tronqués davantage)");
assert.ok(css.includes("translateX(var(--alb-ref,400px)) rotateY(180deg)"), "dos des cartes : même mise à l'échelle");
assert.ok(!/\.alb-echelle[^{]*\{[^}]*!important/.test(css), "aucune règle forcée de plus");

// --- la carte entre par l'ouverture de sa pochette, selon la page : à gauche sur la page de gauche, à droite sur la page de droite (même hors écran)
const debut = js.indexOf("function mouvementCarte(r0,r1,cote){"), fin = js.indexOf("function retourPochette", debut);
assert.ok(debut > 0, "mouvementCarte reçoit le côté de la page");
const mouvement = vm.runInNewContext("(" + js.slice(debut, fin).replace("function mouvementCarte", "function") + ")");
const r0 = { left: 100, top: 400, width: 120, height: 200 }, r1 = { left: 300, top: 100, width: 460, height: 772 };
const mD = mouvement(r0, r1, "d"), mG = mouvement(r0, r1, "g");
assert.ok(/translate\(-74\.0px,300\.0px\)/.test(mD.dessus), "page de droite : posée à droite de la pochette (dx -200 + 120 + 6), même hauteur : " + mD.dessus);
assert.ok(/translate\(-326\.0px,300\.0px\)/.test(mG.dessus), "page de gauche : posée à gauche de la pochette (dx -200 - 126) : " + mG.dessus);
assert.ok(!/rotate/.test(mD.dessus) && /rotate\(2deg\)/.test(mD.sortie) && /rotate\(-2deg\)/.test(mG.sortie), "elle glisse droite ; elle sort en s'inclinant du côté de l'ouverture");
const retour = js.slice(js.indexOf("function retourPochette"), js.indexOf("function ouvrir(n,el)"));
assert.ok(retour.includes("{transform:m.dessus,offset:.5") && retour.includes("{transform:m.petite}") && !retour.includes("m.sortie") && retour.includes("el.closest('.alb-page-g')?'g':'d'"), "retour : grande carte, puis à côté de la pochette (côté de l'ouverture), puis glissement vers l'intérieur");
assert.ok(js.includes("el.closest&&el.closest('.alb-page-g')?'g':'d'"), "sortie : même côté");

// --- farde sans anneaux ni ronds noirs ; ouverture des pochettes côté extérieur de la page
const fin_css = css.slice(css.indexOf("La farde n'a ni anneaux ni ronds noirs"));
assert.ok(fin_css.includes(".alb-classeur .alb-livre::before{display:none}") && fin_css.includes(".alb-face-avant.alb-cuir-noir::before{display:none}") && fin_css.includes("mask-image:none"), "plus d'anneaux, de trous de languette, de trous de couverture ni de trous découpés dans les feuilles");
assert.ok(fin_css.includes("border-right-color:transparent") && fin_css.includes("border-left-color:transparent") && fin_css.includes(".alb-page-g .alb-plastique::after"), "pointillé ouvert à droite (page de droite) et à gauche (page de gauche)");
assert.ok(css.includes(".alb-face-arriere .alb-pochette.alb-sorti .alb-carte{transform:translateX(-30%)") && css.includes(".alb-pochette.alb-sorti .alb-carte{transform:translateX(30%)"), "survol : la carte sort du côté de l'ouverture");

// --- fiche d'objet : les boutons ne sont plus coupés
const itopod = lire("cloudflare/public/soreal-idle-itopod.css");
const regle = itopod.split("\n").find((l) => l.includes(".soreal-idle-item-popup-actions-v165 .idle-fiche-bouton-v1{width:100%"));
assert.ok(regle && !regle.includes("nowrap") && !regle.includes("ellipsis") && regle.includes("white-space:normal"), "le texte du bouton passe à la ligne au lieu d'être coupé");
assert.ok(itopod.includes(".idle-fiche-bouton-large-v1{grid-column:1/-1}") && lire("cloudflare/public/modules/ui-aventure-2-v1.js").includes('class="idle-fiche-bouton-v1 idle-fiche-bouton-large-v1" onclick="window.__actionMetaIdleV130__({action:\\\'consumeGiantSeed\\\''), "le bouton au libellé long prend toute la largeur");
// --- sons du classeur : trois feuilles de plastique, pages de 10 en 10, couverture qui se referme ; discrets
const audio = lire("cloudflare/public/modules/audio-effects-v199.js");
for (const n of ["albumPage1", "albumPage2", "albumPage3", "albumDix", "albumFerme"]) assert.ok(audio.includes(n + ":{group:\"album-page\"") && audio.includes(n + ":"), "son " + n + " défini");
const volumes = [...audio.slice(audio.indexOf("function albumPageA_"), audio.indexOf("function valiseFerme_")).matchAll(/volume:([0-9.]+)/g)].map((m) => Number(m[1]));
assert.ok(volumes.length > 10 && Math.max(...volumes) <= .06, "volumes bas (jamais bruyants) : max " + Math.max(...volumes));
assert.ok(audio.includes("albumPage:function(){") && audio.includes("albumDix:function(){return demander_(\"albumDix\");}") && audio.includes("albumFerme:function(){return demander_(\"albumFerme\");}"), "API publique des sons du classeur");
assert.ok(js.includes("if(!silencieux)son('albumPage');") && js.includes("son('albumDix');") && js.includes("son('albumFerme');") && js.includes("function ouvrirLivre(p){\n  return new Promise(function(ok){\n    var cl=document.querySelector('.alb-classeur');\n    if(ouvert||tourne||!cl){ok();return;}\n    son('albumPage');"), "sons branchés : feuille tournée, 10 pages, couverture refermée, couverture ouverte");
// --- Yggdrasil : le gain Manger / Récolter bien visible, chaque nombre dans son élément (code couleur des unités)
const ygg = lire("cloudflare/public/modules/yggdrasil-elfes-v1.js");
assert.ok(ygg.includes("function nombreHtml_(t){") && ygg.includes("manger.map(nombreHtml_).join(' · ')") && ygg.includes(".ygg-apercu{display:grid;gap:3px;margin-top:5px;padding:5px 7px;border:2px solid #d6b24a") && ygg.includes("clamp(12px,2.7cqw,15px)"), "aperçu Manger / Récolter plus visible, nombres colorés");
// --- page de gauche incomplète : le dos des cartes rangées derrière (seulement les vraies cartes)
assert.ok(js.includes("function derriereGauche(r){") && js.includes("var carteDerriere=p===0?nbPieces():cartesDePage(p).length;") && js.includes("Math.floor(i/COLS)*COLS+(COLS-1-i%COLS)<carteDerriere"), "dos derrière les emplacements vides : place symétrique, seulement les vraies cartes (grand dessin : celles déjà gagnées)");
assert.ok(js.includes("h+=(derriere&&derriere[i])?dosPochetteHtml():v;") && js.includes("function gaucheHtml(L){return double()&&L>=1?contenuPage(L-1,true):'';}"), "page de gauche : completer reçoit les dos");
assert.ok(js.includes("contenuPage(sens>0?p+1:q+1,true)") && js.includes("contenuPage(a+1,true)"), "faces arrière des feuilles qui tournent (= page de gauche) : mêmes dos");
// --- fermeture : la couverture attend la fin de la dernière feuille (la promesse d'une seule feuille se terminait tout de suite)
assert.ok(js.includes("if(total===1){Promise.resolve(page_(sens)).then(fini);return;}") && !js.includes("then(fini);return fini();"), "sauter() d'une seule feuille se termine à la fin de son animation");
// --- cadre de titre de NGU : moitié gauche en jour, moitié droite en nuit (Norman, 2026-10-30)
assert.ok(itopod.includes('[data-menu="ngu"] .soreal-idle-page-head-v28[data-entete-menu]::before{background:') && itopod.includes("linear-gradient(90deg,#3d9be0 0%,#7cc4f5 38%,#a9dcff 47%,#262c6e 53%,#121847 70%,#070b2a 100%)"), "NGU : ciel de jour à gauche, ciel de nuit à droite");
// --- retour de la carte : seul le fond s'estompe, la carte reste visible jusqu'à sa pochette (la fenêtre entière s'estompait avant la fin du glissement)
assert.ok(retour.includes("fenetre.animate([{backgroundColor:'rgba(4,8,16,.6)'") && !retour.includes("fenetre.animate([{opacity:1},{opacity:0}]") && retour.includes("duration:900,easing:'ease-in'"), "retour : le fond s'estompe sur 900 ms comme le glissement, jamais la carte");
console.log("idle-album-adapte-v1 : OK");
