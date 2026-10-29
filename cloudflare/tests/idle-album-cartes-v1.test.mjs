// Norman (2026-10-29) : Chroniques de boss = farde noire à anneaux : livre FERMÉ à l'arrivée (couverture avec le logo dans une pochette), 9 pochettes par page (3 x 3), PC : deux pages (gauche = dos des cartes SOREAL), téléphone : page de droite seule ;
// première feuille = l'affiche verticale découpée en 9 cartes (une carte gagnée tous les ~34 boss vaincus) ; carte gagnée au premier boss VAINCU seulement ; annonce par page puis rangement en paquet, une carte à la fois, sans flou.
import fs from "node:fs";
import assert from "node:assert/strict";
const lire = (f) => fs.readFileSync(f, "utf8").replace(/\r\n/g, "\n");
const m = lire("cloudflare/public/modules/album-cartes-v1.js"), c = lire("cloudflare/public/soreal-idle-album.css"), u = lire("cloudflare/public/modules/ui-chroniques-v1.js"), i = lire("cloudflare/public/index.html"), k = lire("cloudflare/public/modules/carte-boss-magic-v1.js"), kc = lire("cloudflare/public/soreal-idle-carte-boss.css");
// 9 par page, trois colonnes
assert.ok(m.includes("var PAR_PAGE=9,COLS=3,PIECES=9,TOTAL_BOSS=301;") && c.includes(".alb-feuille{display:grid;grid-template-columns:repeat(3,minmax(0,1fr))"), "9 pochettes par page : 3 x 3");
// PC / téléphone
assert.ok(m.includes("(min-width:900px)") && c.includes(".alb-page-g{display:none}") && c.includes(".alb-double .alb-page-g{display:block}"), "PC : deux pages ; téléphone : la page de droite seule");
// le livre fermé d'abord, la couverture avec le logo
assert.ok(m.includes("if(!document.querySelector('.alb-classeur')){ouvert=false;page=0;}") && m.includes("function ouvrirLivre(p)") && m.includes("function fermerLivre()") && m.includes("alb-couv-logo") && m.includes("IMG_LOGO"), "livre fermé à l'arrivée, couverture avec le logo, ouvrir / fermer");
assert.ok(c.includes(".alb-classeur:not(.alb-ouvert) .alb-page{visibility:hidden}") && c.includes(".alb-couv-pochette") && c.includes(".alb-cuir-noir"), "couverture de farde noire avec pochette en plastique");
assert.ok(m.includes("cliquerGauche") && m.includes("Fermer le classeur"), "le livre se referme (bouton, ou clic sur l'intérieur de la couverture)");
// cartes DE FACE sur la page de gauche ET sur celle de droite (Norman : « finalement, des cartes de face des deux côtés ») ; le dos ne sert plus qu'aux cartes du grand dessin pas encore gagnées
assert.ok(m.includes("function gaucheHtml(L){return double()&&L>=1?contenuPage(L-1):'';}") && m.includes("function droiteHtml(L){return contenuPage(L);}"), "à gauche : la page d'avant, de face ; à droite : la page courante");
assert.ok(!m.includes("function dosHtml(") && !m.includes("nbDos(") && !m.includes("dosLegerHtml"), "plus de page de dos à gauche");
assert.ok(m.includes("function pieceHtml(k,gagnee){\n  if(!gagnee)return dosPochetteHtml();"), "tant qu'une carte du dessin n'est pas gagnée, on voit son dos (dos de carte SOREAL)");
assert.ok(m.includes("function pageMax()") && m.includes("function norm(L)") && m.includes("double()?L-(L%2):L"), "sur PC la page de droite est toujours paire (à gauche, la page d'avant)");
// une carte pas encore annoncée reste invisible dans sa pochette
assert.ok(m.includes("(enAttente[n]||vusTmp.indexOf(n)<0)?' alb-attente':''") && m.includes("function contenuPage(L){vusTmp=lireVus()||[];"), "une carte pas encore annoncée n'est jamais vue « déjà placée »");
assert.ok(m.includes("var L=norm(double()&&r%2===1?r+1:r);") && m.includes("if(!C||!neuves.length)return;"), "page impaire = page de gauche de la feuille suivante ; jamais d'annonce vide");
assert.ok(m.includes("function pagesVisibles(L)") && m.includes("function neuvesVisibles(L)") && c.includes(".alb-annonce-cartes.alb-large{grid-template-columns:repeat(6,auto)}"), "l'annonce couvre les deux pages visibles (jusqu'à 18 cartes)");
// le grand dessin
assert.ok(m.includes("function puzzleHtml()") && m.includes("Math.floor(cartes.length*PIECES/TOTAL_BOSS)") && c.includes("/chargement/affiche-600x900.webp") && c.includes("background-size:324cqw 486cqw"), "l'affiche découpée en 9 cartes, une par ~34 boss vaincus");
const mp = /function nbPieces\(\)\{return ([^}]*)\}/.exec(m); const pieces = new Function("cartes", "PIECES", "TOTAL_BOSS", "return " + mp[1].replace(/\bcartes\.length\b/g, "cartes"))(0, 9, 301);
const nb = (n) => Math.min(9, Math.floor(n * 9 / 301)); assert.equal(nb(33), 0); assert.equal(nb(34), 1); assert.equal(nb(67), 2); assert.equal(nb(110), 3); assert.equal(nb(301), 9);
// la petite carte est la grande
assert.ok(m.includes("C.html({numero:n") && m.includes("sansFleches:true") && kc.includes(".alb-carte-mtg") && k.includes("dosSeul:dosSeul"), "miniature = la vraie carte");
assert.ok(k.includes("if(cible.closest('.alb-carte-mtg'))return;"), "la miniature ne se retourne pas au clic");
// la feuille qui tourne
assert.ok(m.includes("alb-face-avant") && m.includes("alb-face-arriere") && m.includes("rotateY(-90deg)") && m.includes("rotateY(-180deg)") && c.includes("transform-origin:0 50%"), "feuille à deux faces qui pivote autour des anneaux");
assert.ok(m.includes("function basculer(") && m.includes("alb-ombre-sol"), "bascule de face à mi-course, ombres sur les pages");
assert.ok(m.includes("'.page(-1)\">'") && m.includes("addEventListener('touchend'") && m.includes("prefers-reduced-motion"), "boutons, glissement du doigt, mouvement réduit");
assert.ok(!/boss découverts|\/ ?301/.test(m.replace("TOTAL_BOSS=301","")), "aucun total de boss affiché (règle n°2)");
// seuls les boss vaincus ont leur carte
assert.ok(m.includes("e&&e.vaincu&&Math.floor(Number(e.numero))>0"), "carte = boss vaincu");
assert.ok(u.includes("albumIdle.rendre(entrees)") && u.includes("e.decouvert&&e.vaincu"), "la Collection passe par l'album, compteur = cartes gagnées");
const col = lire("cloudflare/src/idle-runtime-collection.js");
assert.ok(col.includes("vaincu:\n          Boolean(index < bossVaincus)"), "le moteur envoie « vaincu » (jamais pour un boss seulement rencontré)");
// annonce par page, rangement : paquet puis une par une, sans flou
assert.ok(m.includes("nouvelles cartes débloquées !") && m.includes("nouvelle carte débloquée !") && m.includes("Ranger dans l’album") && m.includes("function ranger()") && m.includes("soreal_idle_album_vus_v1"), "annonce puis rangement, mémorisé par compte");
assert.ok(m.includes("function nouvellesDePage(r)") && m.includes("function premierePageNeuve()") && m.includes("setTimeout(verifierPage,450)") && m.includes("if(neuves.length)annoncer(neuves,L);") && m.includes("annoncer(neuves,page)"), "annonce par page, validée à chaque tour de page");
assert.ok(m.includes("enAttente[e.numero]=true") && c.includes(".alb-pochette.alb-attente .alb-carte{visibility:hidden}"), "la pochette d'une nouvelle carte reste vide jusqu'à l'arrivée de la carte");
assert.ok(m.includes("se rejoignent en PAQUET") && m.includes("la suivante ne part que quand la précédente est rangée") && m.includes("suite=suite.then(function(){") && m.includes("alb-vol-carte"), "paquet, puis une carte à la fois (chaîne : la suivante attend la précédente)");
assert.ok(!c.includes("backdrop-filter") && !c.includes("blur("), "aucun flou (on voit les cartes entrer dans le classeur)");
assert.ok(m.includes("r1.height*.62") && m.includes("translateY(-62%)") && c.includes(".alb-pochette.alb-entre{z-index:4}"), "la carte arrive devant la fente puis se glisse sous le plastique");
// le dos de la première feuille : seulement les cartes du dessin débloquées ; ouvrir = fermer à l'envers (rien ne bouge d'un bloc) ; la feuille passe AU-DESSUS de l'anneau ; livre fermé : l'anneau seul
assert.ok(!m.includes("translateX(-25%)") && !c.includes("translateX(-25%)"), "plus de mouvement de toute la page à l'ouverture");
assert.ok(m.includes("{visibility:'hidden',offset:.499},{visibility:'visible',offset:.5}") && m.includes("{visibility:'visible',offset:.499},{visibility:'hidden',offset:.5}"), "la page de gauche apparaît / disparaît au passage de la couverture (ouverture et fermeture symétriques)");
assert.ok(c.includes("pointer-events:none;z-index:5;") && c.includes(".alb-feuille-tournante{position:absolute;transform-origin:0 50%;transform-style:preserve-3d;z-index:6;") && c.includes(".alb-couverture{position:absolute;top:0;bottom:0;left:0;right:0;cursor:pointer;z-index:6;"), "feuille et couverture passent au-dessus de l'anneau");
assert.ok(c.includes(".alb-classeur:not(.alb-ouvert) .alb-livre::before{z-index:8;background:var(--alb-anneau-seul)") && c.includes("--alb-anneau-seul:url("), "livre fermé : l'anneau seul, sans trou noir");
// la languette perforée le long du dos de chaque page, trous pour les anneaux
{
  const cc = lire("cloudflare/public/soreal-idle-album.css");
  assert.ok(cc.includes("--alb-lang:clamp(") && cc.includes(".alb-page-d::before") && cc.includes(".alb-page-g::after") && (cc.match(/circle at 50% /g) || []).length >= 6 && cc.includes("calc(11% + .39 * var(--alb-ra))") && cc.includes("calc(89% - .39 * var(--alb-ra))") && cc.includes(".alb-feuille-tournante .alb-face-avant>.alb-page::before"), "languette perforée sur toute la hauteur, trois trous (là où passent les anneaux), sur les pages et sur la feuille qui tourne");
}
// navigation : au-dessus ET en dessous, 1 page et 10 pages, avec l'animation des 10 feuilles
assert.ok(m.includes("navHtml('haut')+livreHtml()+navHtml('bas')") && m.includes("alb-prec10") && m.includes("alb-suiv10") && m.includes(".sauter(-10)") && m.includes(".sauter(10)"), "barre de navigation au-dessus et en dessous : ±1 page et ±10 pages");
assert.ok(m.includes("function sauter(n)") && m.includes("var DUR=900,PAS=80") && m.includes("anims.push(f.animate(kf,{duration:DUR,easing:E,delay:delai,fill:'both'}))") && m.includes("var total=Math.min(Math.abs(n),dispo);"), "un saut de 10 pages = 10 feuilles EN L'AIR EN MÊME TEMPS (départ en cascade toutes les 80 ms), arrêt à la première ou à la dernière page");
assert.ok(m.includes("function legerHtml(L)") && m.includes("vraiAvant") && m.includes("vraiArriere"), "seules la première et la dernière feuille ont leur vrai contenu (les autres passent trop vite)");
assert.ok(m.includes("fg.parentNode.replaceChild(nf,fg)") && m.includes("fd.parentNode.replaceChild(nf,fd)"), "à l'atterrissage, les cartes de la feuille deviennent la page (mêmes éléments : rien ne bouge à la dernière image)");
assert.ok(!c.includes(".alb-pochette:not(.alb-pochette-dos):not(.alb-pochette-puzzle):hover"), "plus de soulèvement au survol (les cartes ne bougent que pour s'ouvrir)");
assert.ok(c.includes(".alb-feuille-tournante .alb-face-avant>.alb-page{") && c.includes("mask-composite:intersect") && c.includes(".alb-livre.alb-saut .alb-feuille-tournante .alb-face>.alb-page{-webkit-mask-image:none"), "la feuille est percée : l'anneau se voit à travers ses trous (masque sur l'enfant de la face, pas pendant un saut)");
assert.ok(m.includes("sauter:sauter"), "saut exposé");
// fichiers chargés
assert.ok(/soreal-idle-album\.css\?v=\d+/.test(i) && /album-cartes-v1\.js\?v=\d+/.test(i), "fichiers chargés");
assert.ok(kc.includes("touch-action:pan-y"), "défilement vertical du texte conservé (rotation de la grande carte)");
console.log("idle-album-cartes-v1 : OK");

// la dernière page (peu de cartes) garde la taille du classeur ; ouvrir le livre ne déplace rien dans la page
assert.ok(m.includes("function completer(h,n)") && m.includes("alb-pochette-vide") && m.includes("return completer(h,n);"), "toujours 9 emplacements par page (les vides sont invisibles)");
assert.ok(c.includes(".alb-pochette-vide .alb-carte{visibility:hidden}") && c.includes("padding:var(--alb-nav-h) 0 var(--alb-nav-b)") && c.includes(".alb-classeur>.alb-nav{position:absolute"), "la place des barres de navigation est toujours réservée");

// jamais de page vide (la hauteur du classeur s'effondrait sur la page blanche après la dernière) ; les pochettes vides existent déjà ; l'anneau est au-dessus des feuilles
assert.ok(m.includes("if(L>=nbPages())return completer('',0);"), "la page après la dernière a ses 9 pochettes vides");
assert.ok(m.includes('alb-pochette-vide" aria-hidden="true"><div class="alb-carte alb-carte-mtg"></div><div class="alb-plastique"'), "une pochette vide est un plastique seul");
assert.ok(c.includes("transform:translateX(-50%) translateZ(8px)"), "l'anneau reste devant les feuilles (jamais à plat avec elles : il ne disparaît plus)");

// le calage de défilement du clic ne touche jamais l'album (la couverture 3D le faisait défiler de ±100 px) et le classeur ne déborde plus de la page (hauteur du document constante)
{
  const menus = fs.readFileSync("cloudflare/public/modules/ui-menus-v1.js", "utf8");
  assert.ok(menus.includes("if(el.closest&&el.closest('.alb-classeur'))return;"), "pas de calage de défilement sur l'album");
  assert.ok(c.includes(".alb-classeur{position:relative;overflow:clip;overflow-clip-margin:30px;"), "le 3D de l'album n'allonge pas la page");
}
