/*
 * SOREAL IDLE — l'album de collection des boss (Norman, 2026-10-29 : « dans Chroniques de boss, un aspect d'album de collection pour Magic Card, avec des feuilles en plastique ; quand on clique, la carte sort de la feuille et vient en zoom pour qu'on puisse la lire et la faire tourner »).
 *
 * LE CLASSEUR (refonte du même jour) : 9 pochettes par page (3 rangées de 3). Au départ, le livre est FERMÉ : une couverture de farde noire avec, dans sa pochette en plastique, le logo du jeu. Un clic l'ouvre. Sur PC il est ouvert sur deux pages, sur téléphone seulement sur sa page de droite.
 * Les pages se suivent : page 1 = le grand dessin, puis les boss 9 par page. Ouvert sur PC, le livre montre DEUX pages de cartes DE FACE (la feuille a une page devant et une derrière : à gauche la page précédente, à droite la suivante) ; sur téléphone, une page à la fois.
 * LA PREMIÈRE PAGE est un grand dessin : l'affiche verticale du jeu découpée en 9 cartes. Chaque carte du dessin se gagne en battant à peu près un neuvième des boss (301 boss : 34, 67, 101…) ; tant qu'elle n'est pas gagnée, on voit le DOS de la carte (dos SOREAL), sans chiffre ni condition (règle n°2).
 * Une carte pas encore annoncée (pas encore rangée) reste invisible dans sa pochette : on ne la voit jamais « déjà placée » avant d'avoir été rangée.
 * Les feuilles suivantes : les boss VAINCUS au moins une fois (« on gagne la carte quand on le tue la première fois » ; un boss seulement rencontré n'y est pas), 9 par feuille, dans l'ordre des numéros. Chaque petite carte est la grande carte (modules/carte-boss-magic-v1.js) en miniature.
 * Un clic sur une carte : elle sort de sa pochette par le haut et vole au centre de l'écran en grandissant (fiche zoomée qu'on fait tourner). Les boutons ‹ › (ou un glissement du doigt) tournent la feuille autour des anneaux (deux faces : cartes devant, dos derrière).
 * Les cartes gagnées depuis la dernière visite s'annoncent PAGE PAR PAGE (9 au plus) : à « Ranger », elles se rejoignent en paquet puis partent UNE PAR UNE, la suivante seulement quand la précédente est rangée : chacune vole devant la fente de sa pochette et s'y glisse, sous le plastique. Sans flou.
 * Aucune animation avec « réduire les animations ».
 *   window.__SOREAL_IDLE_ALBUM_V1__ = { rendre(entrees) -> html, ouvrir(numero, element), page(sens), sauter(n), ouvrirLivre(), fermerLivre(), nouvelles(), ranger() }
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_ALBUM_V1__)return;

var PAR_PAGE=9,COLS=3,PIECES=9,TOTAL_BOSS=301;
var CLE_VUS='soreal_idle_album_vus_v1';   /* préférence liée au compte (règle n°6) : numéros des cartes déjà annoncées */
var IMG_LOGO='/chargement/logo-800x450.webp';

var cartes=[],page=0,ouvert=false,tourne=false,enAttente={},popup=null;

function reduit(){try{return Boolean(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);}catch(_e){return false;}}
function double(){try{return Boolean(window.matchMedia&&window.matchMedia('(min-width:900px)').matches);}catch(_e){return false;}}
function carteMtg(){return window.__SOREAL_IDLE_CARTE_BOSS_MAGIC_V1__||null;}
function esc(t){return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function reg(){return window.__SOREAL_IDLE_REG__||{};}
function attendre(ms){return new Promise(function(ok){setTimeout(ok,ms);});}
function fin(a){try{return a.finished.catch(function(){});}catch(_e){return Promise.resolve();}}
function monde(n){
  try{
    var cat=reg().idleEtat&&Array.isArray(reg().idleEtat.bossCatalogue)?reg().idleEtat.bossCatalogue:[];
    for(var i=0;i<cat.length;i++)if(cat[i]&&Math.floor(Number(cat[i].numero))===n)return {monde:Math.max(1,Math.floor(Number(cat[i].monde)||1)),ordre:Math.floor(Number(cat[i].ordreMonde)||0)};
  }catch(_e){}
  return {monde:1,ordre:0};
}
function urlImage(n){try{var f=reg().urlBossR2IdleV1_;return typeof f==='function'?f(n):'';}catch(_e){return '';}}
function sansBalise(t){try{var f=reg().sansBaliseVoixIdleV1_;return typeof f==='function'?f(t):t;}catch(_e){return t;}}

/* Pages : 0 = le grand dessin ; 1… = les boss, 9 par page. */
function nbPages(){return 1+Math.max(1,Math.ceil(cartes.length/PAR_PAGE));}
function cartesDePage(r){return r>=1?cartes.slice((r-1)*PAR_PAGE,(r-1)*PAR_PAGE+PAR_PAGE):[];}
function nbPieces(){return Math.min(PIECES,Math.floor(cartes.length*PIECES/TOTAL_BOSS));}
/* Page affichée (celle de droite sur PC, où elle est toujours paire : à gauche, la page d'avant) ; la dernière page peut être seule à gauche, sa voisine de droite est alors vide. */
function pageMax(){var n=nbPages();return double()?(((n-1)%2===0)?n-1:n):n-1;}
function norm(L){L=Math.max(0,Math.min(pageMax(),Math.floor(Number(L))||0));return double()?L-(L%2):L;}
var vusTmp=[];

/* La petite carte : exactement la grande, en miniature (le texte du récit sous l'illustration, comme sur la vraie carte). */
function miniature(e){
  var C=carteMtg();if(!C)return '';
  var n=Math.floor(Number(e.numero))||0,m=monde(n);
  var histoire=e.description?'<div class="soreal-idle-bestiary-desc-v110 soreal-idle-boss-fiche-histoire-v1">'+esc(sansBalise(e.description))+'</div>':'';
  return C.html({numero:n,nom:e.nom,monde:m.monde,ordre:m.ordre,pv:e.pv,attaque:e.attaque,xp:e.xp,rencontres:e.rencontres,histoireHtml:histoire,boutonsHtml:'',adminHtml:'',image:urlImage(n),sansFleches:true});
}
function pochetteHtml(e){
  var n=Math.floor(Number(e.numero))||0,nom=esc(e.nom||'Boss');
  /* une carte pas encore annoncée (ou en cours de rangement) reste invisible dans sa pochette */
  return '<div class="alb-pochette'+((enAttente[n]||vusTmp.indexOf(n)<0)?' alb-attente':'')+'" role="button" tabindex="0" data-album-boss="'+n+'" aria-label="'+nom+'" '+
      'onclick="window.__SOREAL_IDLE_ALBUM_V1__.ouvrir('+n+',this)" '+
      'onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();window.__SOREAL_IDLE_ALBUM_V1__.ouvrir('+n+',this)}">'+
    '<div class="alb-carte alb-carte-mtg">'+miniature(e)+'</div>'+
    '<div class="alb-plastique" aria-hidden="true"></div>'+
  '</div>';
}
/* Le dos d'une carte (dos de carte SOREAL) : même dos que la grande carte retournée. */
function dosPochetteHtml(){
  var C=carteMtg();
  return '<div class="alb-pochette alb-pochette-dos" aria-hidden="true"><div class="alb-carte alb-carte-mtg">'+(C&&C.dosSeul?C.dosSeul():'')+'</div><div class="alb-plastique"></div></div>';
}
/* Le grand dessin : l'affiche découpée en 9 cartes ; une carte est gagnée tous les ~34 boss vaincus ; tant qu'elle ne l'est pas, on voit son dos. */
function pieceHtml(k,gagnee){
  if(!gagnee)return dosPochetteHtml();
  var r=Math.floor(k/COLS),c=k%COLS;
  return '<div class="alb-pochette alb-pochette-puzzle" aria-hidden="true"><div class="alb-carte alb-carte-mtg"><div class="alb-puzzle-carte"><div class="alb-puzzle-art" style="background-position:calc(-1 * (21cqw + '+c+' * 94cqw)) calc(-1 * '+r+' * 162cqw)"></div></div></div><div class="alb-plastique"></div></div>';
}
function puzzleHtml(){var n=nbPieces(),h='',k;for(k=0;k<PIECES;k++)h+=pieceHtml(k,k<n);return h;}
/* Une page a toujours 9 emplacements : les vides sont des pochettes en plastique sans carte (comme un vrai classeur) ; elles gardent la taille du classeur (dernière page à 4 cartes = même classeur) et existent déjà quand la carte arrive. */
function completer(h,n){var i,v='<div class="alb-pochette alb-pochette-vide" aria-hidden="true"><div class="alb-carte alb-carte-mtg"></div><div class="alb-plastique" aria-hidden="true"></div></div>';for(i=n;i<PAR_PAGE;i++)h+=v;return h;}
/* Après la dernière page (la page de droite de la dernière feuille, sur PC) : une page blanche de 9 emplacements invisibles, jamais vide : une page vide ferait s'effondrer la hauteur du classeur (tout le menu bougerait). */
function contenuPage(L){vusTmp=lireVus()||[];if(L<0)return '';if(L>=nbPages())return completer('',0);if(L===0)return puzzleHtml();var l=cartesDePage(L);return completer(l.map(pochetteHtml).join(''),l.length);}
function droiteHtml(L){return contenuPage(L);}
function gaucheHtml(L){return double()&&L>=1?contenuPage(L-1):'';}   /* à gauche : la page d'avant, de face ; avant la première page, l'intérieur de la couverture */

/* Pour un saut de plusieurs pages, seules la première et la dernière page montrent leur vrai contenu : celles du milieu passent trop vite pour être lues, elles sont dessinées en cartes simples (rien de lourd à construire). */
function legerHtml(L){
  if(L<0)return '';
  if(L>=nbPages())return completer('',0);
  var n=L<=0?PIECES:cartesDePage(L).length,h='',i;
  for(i=0;i<n;i++)h+='<div class="alb-pochette alb-pochette-dos" aria-hidden="true"><div class="alb-carte alb-carte-mtg"><div class="alb-leger"></div></div><div class="alb-plastique"></div></div>';
  return completer(h,n);
}
var CHEV_G='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4 7 12l8 8" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
var CHEV_DEBUT='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4v16M19 4 11 12l8 8" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
var CHEV_D='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4l8 8-8 8" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
var CHEV_GG='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 4 3 12l8 8M20 4l-8 8 8 8" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
var CHEV_DD='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 4l8 8-8 8M4 4l8 8-8 8" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
/* Navigation (Norman, 2026-10-29 : « on doit pouvoir changer de page au-dessus et en dessous ; une flèche pour avancer de 1 page, une pour avancer de 10 pages ; une animation de 10 pages ») : la même barre au-dessus et en dessous du livre. */
function numeroHtml(){
  var n=nbPages(),dbl=double();
  if(dbl&&page>=1&&page+1<=n)return '<span>Pages</span> <b>'+page+'</b>–<b>'+(page+1)+'</b> / <b>'+n+'</b>';
  if(dbl&&page>=1)return '<span>Page</span> <b>'+page+'</b> / <b>'+n+'</b>';   /* la dernière page est seule à gauche */
  return '<span>Page</span> <b>'+(page+1)+'</b> / <b>'+n+'</b>';
}
function peutAvancer(){return page+1<=nbPages()-1;}
function navHtml(pos){
  if(!ouvert)return '';
  var A='window.__SOREAL_IDLE_ALBUM_V1__';
  return '<div class="alb-nav alb-nav-'+(pos==='haut'?'haut':'bas')+'">'+
    '<button type="button" class="alb-bouton alb-debut" aria-label="Fermer le classeur : revenir à la couverture" title="Couverture" onclick="'+A+'.fermerLivre()">'+CHEV_DEBUT+'</button>'+
    '<button type="button" class="alb-bouton alb-prec10" aria-label="Reculer de 10 pages" title="−10" '+(page<=0?'disabled ':'')+'onclick="'+A+'.sauter(-10)">'+CHEV_GG+'</button>'+
    '<button type="button" class="alb-bouton alb-prec" aria-label="Page précédente" '+(page<=0?'disabled ':'')+'onclick="'+A+'.page(-1)">'+CHEV_G+'</button>'+
    '<span class="alb-numero">'+numeroHtml()+'</span>'+
    '<button type="button" class="alb-bouton alb-suiv" aria-label="Page suivante" '+(peutAvancer()?'':'disabled ')+'onclick="'+A+'.page(1)">'+CHEV_D+'</button>'+
    '<button type="button" class="alb-bouton alb-suiv10" aria-label="Avancer de 10 pages" title="+10" '+(peutAvancer()?'':'disabled ')+'onclick="'+A+'.sauter(10)">'+CHEV_DD+'</button>'+
  '</div>';
}
/* La couverture : farde noire, le logo du jeu dans sa pochette en plastique ; deux faces (le dehors, l'intérieur noir) pour pivoter autour des anneaux. */
function couvertureHtml(){
  return '<div class="alb-couverture" role="button" tabindex="0" aria-label="Ouvrir le classeur" onclick="window.__SOREAL_IDLE_ALBUM_V1__.ouvrirLivre()" '+
      'onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();window.__SOREAL_IDLE_ALBUM_V1__.ouvrirLivre()}">'+
    '<div class="alb-face alb-face-avant alb-cuir-noir"><div class="alb-couv-pochette"><div class="alb-couv-logo"><img src="'+IMG_LOGO+'" alt="" draggable="false"></div><div class="alb-plastique"></div></div></div>'+
    '<div class="alb-face alb-face-arriere alb-cuir-noir"></div>'+
  '</div>';
}
function livreHtml(){
  return '<div class="soreal-idle-bestiary-grid-v110 soreal-idle-album-v1"><div class="alb-cuir" aria-hidden="true"></div><div class="alb-livre'+(double()?' alb-double':'')+'">'+
    '<div class="alb-page alb-page-g" onclick="window.__SOREAL_IDLE_ALBUM_V1__.cliquerGauche()"><div class="alb-feuille">'+gaucheHtml(page)+'</div></div>'+
    '<div class="alb-page alb-page-d"><div class="alb-feuille" data-alb-page="'+page+'">'+droiteHtml(page)+'</div></div>'+
    couvertureHtml()+
  '</div></div>';
}

/* Le classeur entier ; les cartes viennent de la Collection (boss vaincus seulement, dans l'ordre des numéros). */
function rendre(entrees){
  cartes=(entrees||[]).filter(function(e){return e&&e.vaincu&&Math.floor(Number(e.numero))>0;}).sort(function(a,b){return a.numero-b.numero;});
  if(!document.querySelector('.alb-classeur')){ouvert=false;page=0;}   /* on arrive dans le menu (l'album n'est pas encore dans la page) : le livre est fermé ; un redessin de la page déjà ouverte garde son état, même après une longue absence de l'onglet */
  page=norm(page);
  setTimeout(verifierNouvelles,500);
  return '<div class="alb-classeur'+(ouvert?' alb-ouvert':'')+'">'+navHtml('haut')+livreHtml()+navHtml('bas')+'</div>';
}
function refaire(){var c=document.querySelector('.alb-classeur');if(c){page=norm(page);c.innerHTML=navHtml('haut')+livreHtml()+navHtml('bas');}}
function majNav(){
  var navs=document.querySelectorAll('.alb-classeur .alb-nav');
  [].forEach.call(navs,function(nav){
    var pr=nav.querySelector('.alb-prec'),su=nav.querySelector('.alb-suiv'),p10=nav.querySelector('.alb-prec10'),s10=nav.querySelector('.alb-suiv10'),nu=nav.querySelector('.alb-numero');
    if(pr)pr.disabled=page<=0;if(p10)p10.disabled=page<=0;if(su)su.disabled=!peutAvancer();if(s10)s10.disabled=!peutAvancer();
    if(nu)nu.innerHTML=numeroHtml();
  });
}
/* Le numéro de la page dessinée est noté sur la feuille de droite : une page déjà dessinée n'est JAMAIS redessinée (les images de l'affiche étaient recréées à l'ouverture du livre : la texture disparaissait un instant). */
function marquer(p){var d=document.querySelector('.alb-classeur .alb-page-d .alb-feuille');if(d)d.setAttribute('data-alb-page',String(p));}
function dessinee(){var d=document.querySelector('.alb-classeur .alb-page-d .alb-feuille');return Boolean(d&&d.getAttribute('data-alb-page')===String(page)&&d.children.length);}
function remplirPages(force){
  if(!force&&dessinee())return;
  var d=document.querySelector('.alb-classeur .alb-page-d .alb-feuille'),g=document.querySelector('.alb-classeur .alb-page-g .alb-feuille');
  if(d)d.innerHTML=droiteHtml(page);if(g)g.innerHTML=gaucheHtml(page);
  marquer(page);
}
function afficher(p){   /* sans animation */
  page=norm(p);
  remplirPages(true);majNav();
}

/* La face visible d'une feuille qui tourne : le basculement a lieu exactement à mi-course (feuille de champ, à 90°) ; plus fiable que la seule « face cachée » du navigateur, qui laissait voir le dos à travers le devant. */
function basculer(av,ar,avantD,duree,ease,delai){
  var v1={visibility:'visible'},h1={visibility:'hidden'};
  var kfA=avantD?[v1,{visibility:'visible',offset:.499},{visibility:'hidden',offset:.5},h1]:[h1,{visibility:'hidden',offset:.499},{visibility:'visible',offset:.5},v1];
  var kfR=avantD?[h1,{visibility:'hidden',offset:.499},{visibility:'visible',offset:.5},v1]:[v1,{visibility:'visible',offset:.499},{visibility:'hidden',offset:.5},h1];
  var o={duration:duree,easing:ease,fill:'both',delay:delai||0};
  av.animate(kfA,o);ar.animate(kfR,o);
}
var DUREE=1150,EASE='cubic-bezier(.5,.05,.3,1)';

/* ---------- ouvrir et fermer le livre ---------- */
function ouvrirLivre(p){
  return new Promise(function(ok){
    var cl=document.querySelector('.alb-classeur');
    if(ouvert||tourne||!cl){ok();return;}
    var livre=cl.querySelector('.alb-livre'),couv=cl.querySelector('.alb-couverture'),cuir=cl.querySelector('.alb-cuir');
    ouvert=true;page=norm(typeof p==='number'?p:page);
    var deux=livre.classList.contains('alb-double'),vite=reduit()||typeof couv.animate!=='function';
    remplirPages();
    cl.classList.add('alb-ouvert');
    if(!cl.querySelector('.alb-nav')){cl.insertAdjacentHTML('afterbegin',navHtml('haut'));cl.insertAdjacentHTML('beforeend',navHtml('bas'));}
    if(vite){majNav();ok();return;}
    tourne=true;
    couv.style.display='block';couv.style.zIndex='7';
    var faces=couv.querySelectorAll('.alb-face');
    basculer(faces[0],faces[1],true,DUREE,EASE);
    var a=couv.animate(deux
      ?[{transform:'translateZ(0) rotateY(0deg)'},{transform:'translateZ(70px) rotateY(-90deg)',offset:.5},{transform:'translateZ(0) rotateY(-180deg)'}]
      :[{transform:'translateZ(0) rotateY(0deg)',opacity:1},{transform:'translateZ(70px) rotateY(-90deg)',opacity:1,offset:.5},{transform:'translateZ(0) rotateY(-160deg)',opacity:0}],
      {duration:DUREE,easing:EASE,fill:'forwards'});
    var gauche=cl.querySelector('.alb-page-g');   /* la page de gauche ne se voit qu'une fois la couverture passée dessus (exactement la fermeture, à l'envers) */
    if(deux&&gauche)gauche.animate([{visibility:'hidden'},{visibility:'hidden',offset:.499},{visibility:'visible',offset:.5},{visibility:'visible'}],{duration:DUREE,easing:EASE});
    if(cuir)cuir.animate([{opacity:0},{opacity:1}],{duration:DUREE,easing:EASE});
    fin(a).then(function(){couv.style.display='';couv.style.zIndex='';try{couv.getAnimations().forEach(function(x){x.cancel();});[].forEach.call(faces,function(f){f.getAnimations().forEach(function(x){x.cancel();});});}catch(_e){}tourne=false;ok();});
  });
}
function fermerLivre(){
  return new Promise(function(ok){
    var cl=document.querySelector('.alb-classeur');
    if(!ouvert||tourne||!cl){ok();return;}
    var livre=cl.querySelector('.alb-livre'),couv=cl.querySelector('.alb-couverture'),cuir=cl.querySelector('.alb-cuir');
    var deux=livre.classList.contains('alb-double'),vite=reduit()||typeof couv.animate!=='function';
    [].forEach.call(cl.querySelectorAll('.alb-nav'),function(nav){if(nav.parentNode)nav.parentNode.removeChild(nav);});
    page=0;remplirPages();                       /* le livre se referme sur sa première feuille */
    ouvert=false;
    if(vite){cl.classList.remove('alb-ouvert');ok();return;}
    tourne=true;
    couv.style.display='block';couv.style.zIndex='7';
    var faces=couv.querySelectorAll('.alb-face');
    basculer(faces[0],faces[1],false,DUREE,EASE);
    var a=couv.animate(deux
      ?[{transform:'translateZ(0) rotateY(-180deg)'},{transform:'translateZ(70px) rotateY(-90deg)',offset:.5},{transform:'translateZ(0) rotateY(0deg)'}]
      :[{transform:'translateZ(0) rotateY(-160deg)',opacity:0},{transform:'translateZ(70px) rotateY(-90deg)',opacity:1,offset:.5},{transform:'translateZ(0) rotateY(0deg)',opacity:1}],
      {duration:DUREE,easing:EASE,fill:'forwards'});
    var gauche=cl.querySelector('.alb-page-g');
    if(deux&&gauche)gauche.animate([{visibility:'visible'},{visibility:'visible',offset:.499},{visibility:'hidden',offset:.5},{visibility:'hidden'}],{duration:DUREE,easing:EASE,fill:'forwards'});
    if(cuir)cuir.animate([{opacity:1},{opacity:0}],{duration:DUREE,easing:EASE,fill:'forwards'});
    fin(a).then(function(){
      cl.classList.remove('alb-ouvert');couv.style.display='';couv.style.zIndex='';
      try{couv.getAnimations().forEach(function(x){x.cancel();});if(gauche)gauche.getAnimations().forEach(function(x){x.cancel();});if(cuir)cuir.getAnimations().forEach(function(x){x.cancel();});[].forEach.call(faces,function(f){f.getAnimations().forEach(function(x){x.cancel();});});}catch(_e){}
      tourne=false;ok();
    });
  });
}
function cliquerGauche(){if(ouvert&&page===0)fermerLivre();}   /* l'intérieur de la couverture : un clic referme le classeur */

/*
 * Tourner la feuille. Une feuille a DEUX faces : devant, la page ; derrière, le dos de ses cartes (la future page de gauche). Elle pivote autour des anneaux (le bord gauche de la page de droite), se lève vers le lecteur au milieu du mouvement, projette son ombre sur les pages,
 * puis retombe à gauche (PC) ; en arrière, c'est le mouvement inverse. Sur téléphone (pas de page de gauche) la feuille pivote puis s'efface vers la gauche.
 */
function tournerUne(sens,D,silencieux){
  return new Promise(function(ok){
    if(tourne||!ouvert){ok(false);return;}
    var classeur=document.querySelector('.alb-classeur'),livre=classeur&&classeur.querySelector('.alb-livre');
    if(!livre){ok(false);return;}
    var deux=livre.classList.contains('alb-double'),pas=deux?2:1;
    var p=page,q=p+(sens<0?-pas:pas);
    if(sens>0?!peutAvancer():p<=0){ok(false);return;}
    if(q<0)q=0;
    var E=D<DUREE?'cubic-bezier(.4,0,.55,1)':EASE;
    var pd=livre.querySelector('.alb-page-d'),pg=livre.querySelector('.alb-page-g'),fd=pd.querySelector('.alb-feuille'),fg=pg.querySelector('.alb-feuille');
    if(reduit()||typeof pd.animate!=='function'){afficher(q);if(!silencieux)setTimeout(verifierPage,450);ok(true);return;}
    var avant,arriere;
    try{avant=contenuPage(sens>0?p:q);arriere=deux?contenuPage(sens>0?p+1:q+1):'';}catch(_e){afficher(q);ok(false);return;}   /* un contenu qui lève ne bloque jamais le livre */
    tourne=true;
    /* une feuille : une page devant, la page suivante derrière (PC) */
    var feuille=document.createElement('div');
    feuille.className='alb-feuille-tournante';feuille.setAttribute('data-morph-garder','');feuille.setAttribute('aria-hidden','true');
    feuille.style.cssText='left:'+pd.offsetLeft+'px;top:'+pd.offsetTop+'px;width:'+pd.offsetWidth+'px;height:'+pd.offsetHeight+'px';
    feuille.innerHTML='<div class="alb-face alb-face-avant"><div class="alb-page"><div class="alb-feuille">'+avant+'</div><i class="alb-ombre"></i></div></div>'+
                      '<div class="alb-face alb-face-arriere"><div class="alb-page"><div class="alb-feuille">'+arriere+'</div><i class="alb-ombre"></i></div></div>';
    var ombreD=document.createElement('i'),ombreG=document.createElement('i');
    ombreD.className='alb-ombre-sol alb-ombre-sol-d';ombreG.className='alb-ombre-sol alb-ombre-sol-g';
    pd.appendChild(ombreD);if(deux)pg.appendChild(ombreG);
    var termine=function(){
      tourne=false;page=norm(q);marquer(page);
      [ombreD,ombreG,feuille].forEach(function(x){if(x&&x.parentNode)x.parentNode.removeChild(x);});
      majNav();verifierTaille();
      if(!silencieux)setTimeout(verifierPage,450);       /* les cartes des nouvelles pages s'annoncent, puis se rangent */
      ok(true);
    };
    var ombresFace=feuille.querySelectorAll('.alb-ombre'),facesAV=feuille.querySelector('.alb-face-avant'),facesAR=feuille.querySelector('.alb-face-arriere');
    try{
      var anim;
      if(sens>0){
        fd.innerHTML=contenuPage(q);                    /* dessous : la page suivante, déjà en place */
        livre.appendChild(feuille);basculer(facesAV,facesAR,true,D,E);
        anim=feuille.animate(deux
          ?[{transform:'translateZ(0) rotateY(0deg)'},{transform:'translateZ(70px) rotateY(-90deg)',offset:.5},{transform:'translateZ(0) rotateY(-180deg)'}]
          :[{transform:'translateZ(0) rotateY(0deg)',opacity:1},{transform:'translateZ(70px) rotateY(-90deg)',opacity:1,offset:.5},{transform:'translateZ(0) rotateY(-160deg)',opacity:0}],
          {duration:D,easing:E,fill:'forwards'});
        [ombresFace[0],ombresFace[1]].forEach(function(o){o.animate([{opacity:0},{opacity:.55,offset:.5},{opacity:0}],{duration:D,easing:E});});
        ombreD.animate([{opacity:.65},{opacity:0}],{duration:D*.75,easing:'ease-out',fill:'forwards'});
        if(deux)ombreG.animate([{opacity:0},{opacity:0,offset:.4},{opacity:.6,offset:.8},{opacity:0}],{duration:D,fill:'forwards'});
        fin(anim).then(function(){
          if(deux){var nf=facesAR.querySelector('.alb-feuille');if(nf&&fg.parentNode){fg.parentNode.replaceChild(nf,fg);}else fg.innerHTML=gaucheHtml(q);}
          termine();
        });
      }else{
        if(deux)fg.innerHTML=gaucheHtml(q);             /* dessous (à gauche) : la page d'avant, révélée quand la feuille se lève */
        livre.appendChild(feuille);basculer(facesAV,facesAR,false,D,E);
        anim=feuille.animate(deux
          ?[{transform:'translateZ(0) rotateY(-180deg)'},{transform:'translateZ(70px) rotateY(-90deg)',offset:.5},{transform:'translateZ(0) rotateY(0deg)'}]
          :[{transform:'translateZ(0) rotateY(-160deg)',opacity:0},{transform:'translateZ(70px) rotateY(-90deg)',opacity:1,offset:.5},{transform:'translateZ(0) rotateY(0deg)',opacity:1}],
          {duration:D,easing:E,fill:'forwards'});
        [ombresFace[0],ombresFace[1]].forEach(function(o){o.animate([{opacity:0},{opacity:.55,offset:.5},{opacity:0}],{duration:D,easing:E});});
        ombreD.animate([{opacity:0},{opacity:0,offset:.4},{opacity:.65,offset:.85},{opacity:0}],{duration:D,fill:'forwards'});
        if(deux)ombreG.animate([{opacity:.6},{opacity:0}],{duration:D*.75,easing:'ease-out',fill:'forwards'});
        fin(anim).then(function(){
          var nf=facesAV.querySelector('.alb-feuille');if(nf&&fd.parentNode){fd.parentNode.replaceChild(nf,fd);}else fd.innerHTML=droiteHtml(q);
          termine();
        });
      }
    }catch(_e){termine();afficher(q);}
  });
}
function page_(sens){if(saut)return;return tournerUne(sens,DUREE,false);}
/*
 * Sauter de plusieurs pages (Norman, 2026-10-29 : « quand on passe 10 pages, je veux qu'on voie 10 pages tourner en une fois, pas une par une ») : les N feuilles partent à la file (une toutes les 80 ms) et sont TOUTES en l'air en même temps, comme on feuillette un classeur ;
 * elles retombent l'une sur l'autre (la dernière dessus). Un saut qui dépasse le début ou la fin s'arrête à la première ou à la dernière page. Seule la page atteinte annonce ses nouvelles cartes.
 */
var saut=false;
function sauter(n){
  if(tourne||saut||!ouvert)return;
  var classeur=document.querySelector('.alb-classeur'),livre=classeur&&classeur.querySelector('.alb-livre');
  if(!livre)return;
  var deux=livre.classList.contains('alb-double'),pas=deux?2:1,sens=n<0?-1:1,P=nbPages();
  var dispo=sens>0?(deux?Math.floor((P-page)/2):P-1-page):(deux?Math.floor(page/2):page);   /* feuilles (PC) ou pages (téléphone) tournables dans ce sens */
  var total=Math.min(Math.abs(n),dispo);
  if(total<=0)return;
  if(total===1){page_(sens);return;}
  var p=page,q=p+sens*total*pas;
  var pd=livre.querySelector('.alb-page-d'),pg=livre.querySelector('.alb-page-g'),fd=pd.querySelector('.alb-feuille'),fg=pg.querySelector('.alb-feuille');
  if(reduit()||typeof pd.animate!=='function'){afficher(q);setTimeout(verifierPage,450);return;}
  tourne=true;saut=true;livre.classList.add('alb-saut');   /* plusieurs feuilles en l'air : pas de trous découpés (trop lourd, et on ne les verrait pas) */
  var DUR=900,PAS=80,Z=.6,E='cubic-bezier(.45,.05,.4,1)',N=total,feuilles=[],anims=[],j;
  try{
  if(sens>0)fd.innerHTML=contenuPage(q);                /* dessous : la page visée, déjà en place */
  else if(deux)fg.innerHTML=gaucheHtml(q);              /* dessous (à gauche) : la page d'avant la page visée */
  for(j=0;j<N;j++){
    /* les pages que porte la feuille j : devant a, derrière a+1 (PC) */
    var a=sens>0?p+pas*j:p-pas*(j+1);
    var vraiAvant=sens>0?(j===0):(j===N-1),vraiArriere=sens>0?(j===N-1):(j===0);
    var f=document.createElement('div');
    f.className='alb-feuille-tournante';f.setAttribute('data-morph-garder','');f.setAttribute('aria-hidden','true');
    f.style.cssText='left:'+pd.offsetLeft+'px;top:'+pd.offsetTop+'px;width:'+pd.offsetWidth+'px;height:'+pd.offsetHeight+'px';
    f.innerHTML='<div class="alb-face alb-face-avant"><div class="alb-page"><div class="alb-feuille">'+(vraiAvant?contenuPage(a):legerHtml(a))+'</div></div></div>'+
                '<div class="alb-face alb-face-arriere"><div class="alb-page"><div class="alb-feuille">'+(deux?(vraiArriere?contenuPage(a+1):legerHtml(a+1)):'')+'</div></div></div>';
    livre.appendChild(f);feuilles.push(f);
    var z0=((N-j)*Z).toFixed(2),z1=(j*Z).toFixed(2),delai=j*PAS;
    var kf=deux
      ?(sens>0
        ?[{transform:'translateZ('+z0+'px) rotateY(0deg)'},{transform:'translateZ(70px) rotateY(-90deg)',offset:.5},{transform:'translateZ('+z1+'px) rotateY(-180deg)'}]
        :[{transform:'translateZ('+z0+'px) rotateY(-180deg)'},{transform:'translateZ(70px) rotateY(-90deg)',offset:.5},{transform:'translateZ('+z1+'px) rotateY(0deg)'}])
      :(sens>0
        ?[{transform:'translateZ(0) rotateY(0deg)',opacity:1},{transform:'translateZ(70px) rotateY(-90deg)',opacity:1,offset:.5},{transform:'translateZ(0) rotateY(-160deg)',opacity:0}]
        :[{transform:'translateZ(0) rotateY(-160deg)',opacity:0},{transform:'translateZ(70px) rotateY(-90deg)',opacity:1,offset:.5},{transform:'translateZ(0) rotateY(0deg)',opacity:1}]);
    basculer(f.querySelector('.alb-face-avant'),f.querySelector('.alb-face-arriere'),sens>0,DUR,E,delai);
    anims.push(f.animate(kf,{duration:DUR,easing:E,delay:delai,fill:'both'}));
  }
  }catch(_e){feuilles.forEach(function(x){if(x.parentNode)x.parentNode.removeChild(x);});livre.classList.remove('alb-saut');tourne=false;saut=false;afficher(q);return;}
  Promise.all(anims.map(fin)).then(function(){
    var dern=feuilles[N-1];                             /* la dernière feuille est retombée dessus : ses cartes (déjà dessinées) deviennent la page */
    if(sens>0&&deux){var nf=dern.querySelector('.alb-face-arriere .alb-feuille');if(nf&&fg.parentNode)fg.parentNode.replaceChild(nf,fg);else fg.innerHTML=gaucheHtml(q);}
    if(sens<0){var nd=dern.querySelector('.alb-face-avant .alb-feuille');if(nd&&fd.parentNode)fd.parentNode.replaceChild(nd,fd);else fd.innerHTML=droiteHtml(q);}
    feuilles.forEach(function(x){if(x.parentNode)x.parentNode.removeChild(x);});
    livre.classList.remove('alb-saut');
    tourne=false;saut=false;page=norm(q);marquer(page);majNav();verifierTaille();
    setTimeout(verifierPage,450);
  });
}

/* ---------- le clic : la carte sort de sa pochette et vient en zoom ---------- */
function rendreSortie(n){
  try{var p=document.querySelectorAll('.alb-pochette[data-album-boss="'+n+'"]');for(var i=0;i<p.length;i++)p[i].classList.remove('alb-sorti','alb-envole');}catch(_e){}
}
function ouvrir(n,el){
  var ouvrirReel=window.__ouvrirBossCollectionIdleV1__;
  if(typeof ouvrirReel!=='function')return;
  var carte=el&&el.querySelector?el.querySelector('.alb-carte'):null;
  if(!carte||reduit()||typeof carte.animate!=='function'){ouvrirReel(n);return;}
  if(el.classList.contains('alb-sorti'))return;
  el.classList.add('alb-sorti');                       /* 1. la carte glisse hors de sa pochette, par le haut */
  setTimeout(function(){
   try{
    var r0=carte.getBoundingClientRect();
    ouvrirReel(n);
    var fenetre=document.querySelector('#sorealIdleBossCollectionModalV1');
    var grande=fenetre&&fenetre.querySelector('.mtg-modal-v1');
    if(!grande){rendreSortie(n);return;}
    el.classList.add('alb-envole');                    /* la petite carte est partie : seule sa pochette reste */
    var r1=grande.getBoundingClientRect();
    if(r1.width>0&&r0.width>0){
      var dx=r0.left-r1.left,dy=r0.top-r1.top,s=r0.width/r1.width;
      grande.style.transformOrigin='0 0';
      grande.animate([
        {transform:'translate('+dx.toFixed(1)+'px,'+dy.toFixed(1)+'px) scale('+s.toFixed(4)+') rotate(-3deg)'},
        {transform:'translate('+(dx*.35).toFixed(1)+'px,'+(dy*.35-18).toFixed(1)+'px) scale('+(s+(1-s)*.55).toFixed(4)+') rotate(2deg)',offset:.55},
        {transform:'translate(0,0) scale(1) rotate(0deg)'}
      ],{duration:720,easing:'cubic-bezier(.22,.8,.25,1)'});
    }
    try{fenetre.animate([{opacity:0},{opacity:1}],{duration:320,easing:'ease-out'});}catch(_e){}
    var veille=setInterval(function(){                 /* 3. à la fermeture de la fiche, la carte retourne dans sa pochette */
      if(document.getElementById('sorealIdleBossCollectionModalV1'))return;
      clearInterval(veille);rendreSortie(n);
    },250);
   }catch(_e){rendreSortie(n);}
  },300);
}

/* ---------- les nouvelles cartes : annonce puis rangement ---------- */
var vusMemoire=null;   /* repli : sans stockage utilisable les cartes déjà annoncées sont gardées en mémoire (sinon elles resteraient invisibles) */
function lireVus(){
  try{var t=localStorage.getItem(CLE_VUS);if(t!=null){var v=JSON.parse(t);if(Array.isArray(v)){vusMemoire=v;return v;}}}catch(_e){}
  return vusMemoire;
}
function ecrireVus(l){vusMemoire=l;try{localStorage.setItem(CLE_VUS,JSON.stringify(l));}catch(_e){}}
/* Les cartes gagnées ne s'annoncent que par page (Norman : « en tournant les pages, ils les valident à chaque fois et les rangent ») : à chaque page affichée, les cartes de CETTE page pas encore annoncées. */
function nouvellesDePage(r){var v=lireVus()||[];return cartesDePage(r).filter(function(e){return v.indexOf(e.numero)<0;});}
function nouvelles(){var v=lireVus()||[];return cartes.filter(function(e){return v.indexOf(e.numero)<0;});}
function premierePageNeuve(){for(var r=1;r<nbPages();r++)if(nouvellesDePage(r).length)return r;return -1;}
function pagesVisibles(L){var l=[];if(double()&&L>=1)l.push(L-1);l.push(L);return l;}   /* PC : la page de gauche et celle de droite ; téléphone : une page */
function neuvesVisibles(L){var h=[];pagesVisibles(L).forEach(function(r){h=h.concat(nouvellesDePage(r));});return h;}
function verifierNouvelles(){   /* à l'arrivée dans le menu : la première page qui a des cartes à annoncer (le livre est encore fermé) */
  try{
    if(popup||tourne||!cartes.length)return;
    var c=document.querySelector('.alb-classeur');
    if(!c||!c.offsetParent)return;                      /* l'album n'est pas affiché : l'annonce attend la prochaine ouverture */
    if(ouvert){verifierPage();return;}                  /* déjà ouvert : les cartes de la page vue s'annoncent sans déplacer le livre */
    var r=premierePageNeuve();
    if(r<0)return;
    var L=norm(double()&&r%2===1?r+1:r);   /* sur PC une page impaire est celle de GAUCHE de la feuille suivante */
    var neuves=neuvesVisibles(L);
    if(neuves.length)annoncer(neuves,L);
  }catch(_e){}
}
function verifierPage(){   /* après un tour de page : les cartes de la page qu'on vient d'ouvrir */
  try{
    if(popup||tourne||!ouvert)return;
    var c=document.querySelector('.alb-classeur');
    if(!c||!c.offsetParent)return;
    var neuves=neuvesVisibles(page);
    if(neuves.length)annoncer(neuves,page);
  }catch(_e){}
}
function annoncer(neuves,r){
  var C=carteMtg();if(!C||!neuves.length)return;
  var vus=lireVus()||[];ecrireVus(vus.concat(neuves.map(function(e){return e.numero;})));   /* annoncées une seule fois, même si la fenêtre est fermée en route */
  neuves.forEach(function(e){enAttente[e.numero]=true;});
  if(ouvert)afficher(r);else{page=norm(r);}                  /* derrière l'annonce : la page de ces cartes, leurs pochettes encore vides */
  if(reduit()){neuves.forEach(function(e){delete enAttente[e.numero];});if(ouvert)afficher(page);return;}
  var n=neuves.length;
  var fond=document.createElement('div');fond.className='alb-annonce';fond.setAttribute('data-morph-garder','');
  try{fond.innerHTML='<div class="alb-annonce-titre"><b>'+n+'</b> <span>'+(n>1?'nouvelles cartes débloquées !':'nouvelle carte débloquée !')+'</span></div>'+
    '<div class="alb-annonce-cartes'+(n>9?' alb-large':'')+'">'+neuves.map(function(e){return '<div class="alb-annonce-carte alb-carte-mtg" data-n="'+e.numero+'">'+miniature(e)+'</div>';}).join('')+'</div>'+
    '<button type="button" class="alb-annonce-bouton">Ranger dans l’album</button>';}catch(_e){neuves.forEach(function(e){delete enAttente[e.numero];});ecrireVus(vus);return;}   /* un affichage qui lève ne laisse ni cartes invisibles ni liste écrasée */
  fond.setAttribute('role','dialog');fond.setAttribute('aria-modal','true');fond.setAttribute('aria-label','Nouvelles cartes');
  document.body.appendChild(fond);
  popup={fond:fond,neuves:neuves,page:r,fini:false};
  var els=fond.querySelectorAll('.alb-annonce-carte');
  for(var i=0;i<els.length;i++){
    try{els[i].animate([{transform:'translateY(60px) scale(.5) rotate('+((i%2?1:-1)*8)+'deg)',opacity:0},{transform:'translateY(0) scale(1) rotate('+((i%2?1:-1)*2)+'deg)',opacity:1}],{duration:520,delay:200+i*100,easing:'cubic-bezier(.2,.9,.3,1.15)',fill:'both'});}catch(_e){}
  }
  try{fond.animate([{opacity:0},{opacity:1}],{duration:260,fill:'both'});}catch(_e){}
  var go=function(){ranger();};
  fond.querySelector('.alb-annonce-bouton').addEventListener('click',function(ev){ev.stopPropagation();go();});
  try{fond.querySelector('.alb-annonce-bouton').focus({preventScroll:true});}catch(_e){}
  fond.addEventListener('click',go);
}

/*
 * Le rangement (Norman, 2026-10-29) : 1. l'annonce disparaît tout de suite (sans flou : on voit le classeur) ; si le livre est fermé, il s'ouvre ; 2. les cartes se rejoignent en PAQUET au centre de l'écran, la première du paquet en dessus ;
 * 3. UNE PAR UNE : la carte du dessus quitte le paquet, vole devant la fente de sa pochette et s'y glisse, sous le plastique ; la suivante ne part que quand la précédente est rangée. Chaque carte vole dans une couche fixe à elle (mouvement lisse, rien d'autre qui bouge).
 */
function ranger(){
  var P=popup;if(!P||P.fini)return;
  P.fini=true;
  var fond=P.fond,els=[].slice.call(fond.querySelectorAll('.alb-annonce-carte')),n=els.length;
  var vw=window.innerWidth||document.documentElement.clientWidth,vh=window.innerHeight||document.documentElement.clientHeight;
  var couche=document.createElement('div');couche.className='alb-vol';couche.setAttribute('data-morph-garder','');couche.setAttribute('aria-hidden','true');
  var vols=els.map(function(el,i){
    var r0=el.getBoundingClientRect(),c=el.cloneNode(true);
    c.className='alb-vol-carte alb-carte-mtg';c.style.cssText='left:'+r0.left+'px;top:'+r0.top+'px;width:'+r0.width+'px;z-index:'+(n-i);
    couche.appendChild(c);
    return {el:c,r0:r0,n:el.getAttribute('data-n'),i:i,dx:vw/2-(r0.left+r0.width/2)+i*1.5,dy:vh/2-(r0.top+r0.height/2)-i*1.5,rot:((i%5)-2)*1.4};
  });
  document.body.appendChild(couche);
  try{fond.animate([{opacity:1},{opacity:0}],{duration:240,fill:'forwards'});}catch(_e){}
  setTimeout(function(){if(fond.parentNode)fond.parentNode.removeChild(fond);},260);
  var termine=function(){
    P.neuves.forEach(function(e){delete enAttente[e.numero];});
    document.querySelectorAll('.alb-pochette.alb-attente').forEach(function(p){p.classList.remove('alb-attente');});
    if(couche.parentNode)couche.parentNode.removeChild(couche);
    popup=null;
  };
  var suite=Promise.resolve();
  if(!ouvert)suite=suite.then(function(){return ouvrirLivre(P.page);});
  suite=suite.then(function(){return attendre(250);});
  /* le paquet */
  suite=suite.then(function(){
    return Promise.all(vols.map(function(v){
      var a;try{a=v.el.animate([{transform:'translate(0,0) rotate(0deg)'},{transform:'translate('+v.dx.toFixed(1)+'px,'+v.dy.toFixed(1)+'px) rotate('+v.rot+'deg)'}],{duration:650,delay:v.i*45,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'});}catch(_e){return Promise.resolve();}
      return fin(a);
    }));
  });
  suite=suite.then(function(){return attendre(250);});
  /* une par une */
  vols.forEach(function(v){
    suite=suite.then(function(){
      var poche=document.querySelector('.alb-livre .alb-pochette[data-album-boss="'+v.n+'"]'),cible=poche&&poche.querySelector('.alb-carte');
      var r1=cible?cible.getBoundingClientRect():null;
      if(!(r1&&r1.width>0)){if(poche)poche.classList.remove('alb-attente');if(v.el.parentNode)v.el.parentNode.removeChild(v.el);return;}
      var s=r1.width/v.r0.width;
      var cx=r1.left+r1.width/2-(v.r0.left+v.r0.width/2),cy=r1.top+r1.height/2-(v.r0.top+v.r0.height/2)-r1.height*.62;   /* devant la fente, au-dessus de la pochette */
      var pile='translate('+v.dx.toFixed(1)+'px,'+v.dy.toFixed(1)+'px) scale(1) rotate('+v.rot+'deg)',finT='translate('+cx.toFixed(1)+'px,'+cy.toFixed(1)+'px) scale('+s.toFixed(4)+') rotate(0deg)';
      var vol;try{vol=v.el.animate([{transform:pile},{transform:finT}],{duration:750,easing:'cubic-bezier(.45,0,.2,1)',fill:'forwards'});}catch(_e){vol=null;}
      return (vol?fin(vol):Promise.resolve()).then(function(){
        poche.classList.add('alb-entre');poche.classList.remove('alb-attente');
        if(v.el.parentNode)v.el.parentNode.removeChild(v.el);
        var g;try{g=cible.animate([{transform:'translateY(-62%)'},{transform:'translateY(0)'}],{duration:850,easing:'cubic-bezier(.45,0,.25,1)'});}catch(_e){g=null;}
        return (g?fin(g):Promise.resolve()).then(function(){poche.classList.remove('alb-entre');});
      });
    });
  });
  suite.then(termine,termine);
}

document.addEventListener('keydown',function(e){if(e.key==='Escape'&&popup&&!popup.fini)ranger();});
/* glissement du doigt sur le classeur : vers la gauche = page suivante, vers la droite = précédente */
var toucheX=null,toucheY=null;
document.addEventListener('touchstart',function(e){
  var c=e.target&&e.target.closest&&e.target.closest('.alb-ouvert .soreal-idle-album-v1');
  if(!c||!e.touches||e.touches.length!==1){toucheX=null;return;}
  toucheX=e.touches[0].clientX;toucheY=e.touches[0].clientY;
},{passive:true});
document.addEventListener('touchend',function(e){
  if(toucheX===null||!e.changedTouches||!e.changedTouches.length)return;
  var dx=e.changedTouches[0].clientX-toucheX,dy=e.changedTouches[0].clientY-toucheY;toucheX=null;
  if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.6)page_(dx<0?1:-1);
},{passive:true});
/* l'écran change de taille (rotation du téléphone, fenêtre) : deux pages ou une seule */
var tailleVue=0;
function verifierTaille(){var l=document.querySelector('.alb-classeur .alb-livre');if(l&&!tourne&&l.classList.contains('alb-double')!==double())refaire();}
window.addEventListener('resize',function(){
  clearTimeout(tailleVue);
  tailleVue=setTimeout(function(){
    var livre=document.querySelector('.alb-classeur .alb-livre');
    if(!livre||tourne)return;
    if(livre.classList.contains('alb-double')!==double())refaire();
  },200);
});

window.__SOREAL_IDLE_ALBUM_V1__={rendre:rendre,ouvrir:ouvrir,page:page_,ouvrirLivre:ouvrirLivre,fermerLivre:fermerLivre,sauter:sauter,cliquerGauche:cliquerGauche,nouvelles:nouvelles,ranger:ranger};
})();
