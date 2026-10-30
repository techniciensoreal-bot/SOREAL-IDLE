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
/* Le livre est TOUJOURS ouvert sur deux pages, téléphone compris (Norman, 2026-10-30 : « sur téléphone, je veux l'album complet avec zoom et dézoom ») ; sur écran étroit il est affiché en entier, puis on zoome et on le fait glisser de page en page. */
function double(){return true;}
/* Téléphone : sur la première page (et livre fermé) on ne montre que la moitié droite du livre, à la largeur de l'écran : pas de seconde « couverture » noire à gauche de la page 1 (Norman, 2026-10-30) ; dès la page 2|3 le livre s'affiche en entier. */
var demiCible=null;
function demi(){return etroit()&&(demiCible!==null?demiCible:(!ouvert||page===0));}
function etroit(){try{return !(window.matchMedia&&window.matchMedia('(min-width:900px)').matches);}catch(_e){return false;}}
function carteMtg(){return window.__SOREAL_IDLE_CARTE_BOSS_MAGIC_V1__||null;}
function esc(t){return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function reg(){return window.__SOREAL_IDLE_REG__||{};}
/* Sons du classeur (modules/audio-effects-v199.js) : trois bruits de feuille de plastique, un bruit de pages qui défilent, un bruit de couverture qui se ferme ; jamais bloquant. */
function son(nom){try{var a=window.__SOREAL_IDLE_AUDIO_V199__;if(a&&typeof a[nom]==='function')a[nom]();}catch(_e){}}
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
  return C.html({numero:n,nom:e.nom,monde:m.monde,ordre:m.ordre,pv:e.pv,attaque:e.attaque,xp:e.xp,rencontres:e.rencontres,victoires:e.victoires,histoireHtml:histoire,boutonsHtml:'',adminHtml:'',image:urlImage(n),sansFleches:true});
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
/*
 * Page de gauche incomplète (PC) : on voit, à travers le plastique des emplacements vides, le DOS des cartes de la page qui est derrière (Norman, 2026-10-30 : « quand une page gauche n'est pas complète, on doit voir le dos des cartes qui sont derrière »).
 * La page de gauche est le verso de la feuille dont le recto est la page d'avant : ce qui est derrière un emplacement est la carte de la page d'avant, à la place symétrique (même rangée, colonne opposée). derriere[i] = vrai si une VRAIE carte y est :
 * on ne voit que le dos des cartes réellement rangées derrière (sur la première page, les cartes du grand dessin déjà gagnées), jamais un dos pour un emplacement qui n'a pas de carte (Norman : « on ne doit voir que le dos des 4 cartes »).
 */
function derriereGauche(r){
  var d=[],p=r-1,i;
  if(p<0)return d;
  var carteDerriere=p===0?nbPieces():cartesDePage(p).length;   /* la première page est le grand dessin : seules les cartes déjà gagnées comptent */
  for(i=0;i<PAR_PAGE;i++)d.push(Math.floor(i/COLS)*COLS+(COLS-1-i%COLS)<carteDerriere);
  return d;
}
function completer(h,n,derriere){var i,v='<div class="alb-pochette alb-pochette-vide" aria-hidden="true"><div class="alb-carte alb-carte-mtg"></div><div class="alb-plastique" aria-hidden="true"></div></div>';for(i=n;i<PAR_PAGE;i++)h+=(derriere&&derriere[i])?dosPochetteHtml():v;return h;}
/* Après la dernière page (la page de droite de la dernière feuille, sur PC) : une page blanche de 9 emplacements invisibles, jamais vide : une page vide ferait s'effondrer la hauteur du classeur (tout le menu bougerait). */
function contenuPage(L,gauche){vusTmp=lireVus()||[];if(L<0)return '';var dd=gauche?derriereGauche(L):null;if(L>=nbPages())return completer('',0,dd);if(L===0)return puzzleHtml();var l=cartesDePage(L);return completer(l.map(pochetteHtml).join(''),l.length,dd);}
function droiteHtml(L){return contenuPage(L);}
function gaucheHtml(L){return double()&&L>=1?contenuPage(L-1,true):'';}   /* à gauche : la page d'avant, de face ; avant la première page, l'intérieur de la couverture */

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
/*
 * Glissement entre les deux pages d'une feuille (Norman, 2026-10-30) : zoomé, le livre est plus large que l'écran ; les flèches font d'abord GLISSER le livre de la page de gauche à celle de droite (2 → 3),
 * et ne tournent la feuille que si on veut aller plus loin (4) ; en tournant, le livre se place sur la première page de la nouvelle feuille (ou la dernière en reculant).
 */
function cadreAlb(){return document.querySelector('.alb-adapt .alb-cadre');}
function margeAlb(){var c=cadreAlb();return c?Math.max(0,c.scrollWidth-c.clientWidth):0;}
function peutPanner(sens){var c=cadreAlb(),m=margeAlb();if(!c||!ouvert||m<8)return false;return sens>0?c.scrollLeft<m-4:c.scrollLeft>4;}
function placer(cote,net){var c=cadreAlb(),m=margeAlb();if(!c||m<8)return;try{c.scrollTo({left:cote==='d'?m:0,behavior:(net||reduit())?'auto':'smooth'});}catch(_e){c.scrollLeft=cote==='d'?m:0;}}
function peutSuivre(){return peutAvancer()||peutPanner(1);}
function peutPrec(){return page>0||peutPanner(-1);}
function navHtml(pos){
  if(!ouvert)return '';
  var A='window.__SOREAL_IDLE_ALBUM_V1__';
  return '<div class="alb-nav alb-nav-'+(pos==='haut'?'haut':'bas')+'">'+
    '<button type="button" class="alb-bouton alb-debut" aria-label="Fermer le classeur : revenir à la couverture" title="Couverture" onclick="'+A+'.retourCouverture()">'+CHEV_DEBUT+'</button>'+
    '<button type="button" class="alb-bouton alb-prec10" aria-label="Reculer de 10 pages" title="−10" '+(page<=0?'disabled ':'')+'onclick="'+A+'.sauter(-10)">'+CHEV_GG+'</button>'+
    '<button type="button" class="alb-bouton alb-prec" aria-label="Page précédente" '+(peutPrec()?'':'disabled ')+'onclick="'+A+'.page(-1)">'+CHEV_G+'</button>'+
    '<span class="alb-numero">'+numeroHtml()+'</span>'+
    '<button type="button" class="alb-bouton alb-suiv" aria-label="Page suivante" '+(peutSuivre()?'':'disabled ')+'onclick="'+A+'.page(1)">'+CHEV_D+'</button>'+
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
  return '<div class="soreal-idle-bestiary-grid-v110 soreal-idle-album-v1"><div class="alb-cuir" aria-hidden="true"></div><div class="alb-livre'+(double()?' alb-double':'')+(ouvert?'':' alb-centre')+'">'+
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
  setTimeout(adapter,0);
  return '<div class="alb-adapt">'+zoomHtml()+'<div class="alb-nav-zone alb-nav-zone-haut">'+navHtml('haut')+'</div><div class="alb-cadre"><div class="alb-echelle"><div class="alb-classeur'+(ouvert?' alb-ouvert':'')+'">'+livreHtml()+'</div></div></div><div class="alb-nav-zone alb-nav-zone-bas">'+navHtml('bas')+'</div></div>';
}
/*
 * Le livre s'adapte à la fenêtre (Norman, 2026-10-30 : « je veux que le livre s'adapte à la fenêtre, même s'il devient petit, et un bouton + et − pour zoomer / dézoomer ; valable sur PC comme sur téléphone »).
 * Le classeur a une taille de référence fixe (980 px sur deux pages, 520 px sur une) : il est mis à l'échelle (transform) pour tenir en largeur ET en hauteur dans la fenêtre, puis multiplié par le zoom du joueur (50 % à 200 %,
 * mémorisé dans le compte). Les valeurs sont posées en variables CSS sur <html> (jamais en attributs de la page : un redessin de la page ne les efface pas). Les cartes des pochettes sont dessinées à leur taille de référence
 * (400 px de large) puis réduites : tout est écrit comme sur la carte sortie de l'album, même minuscule (le navigateur ne grossit plus un texte trop petit, ce qui tronquait les noms).
 */
var CLE_ZOOM='soreal_idle_album_zoom_v1';
/* Largeur de la carte quand on la sort de l'album (--mtg-largeur, variable de la fenêtre) : c'est la taille de référence des cartes des pochettes (certains textes de la carte ont une taille fixe en pixels : seule la même largeur donne exactement le même rendu). */
function refCarte(){
  try{
    var p=document.getElementById('alb-sonde');
    if(!p){p=document.createElement('div');p.id='alb-sonde';p.setAttribute('aria-hidden','true');p.style.cssText='position:absolute;left:-9999px;top:0;height:1px;visibility:hidden;width:var(--mtg-largeur,400px)';document.body.appendChild(p);}
    var w=p.offsetWidth;return w>=200&&w<=900?w:400;
  }catch(_e){return 400;}
}
var ZMAX=3;   /* sur téléphone, 300 % : une page de la feuille remplit l'écran avec de la marge pour la lire */
function lireZoom(){try{var z=parseFloat(localStorage.getItem(CLE_ZOOM));if(z>=.5&&z<=ZMAX)return Math.round(z*10)/10;}catch(_e){}return 1;}
var zoom=lireZoom();
function zoomHtml(){
  var A='window.__SOREAL_IDLE_ALBUM_V1__';
  return '<div class="alb-zoom"><button type="button" class="alb-bouton alb-zoom-moins" aria-label="Dézoomer" title="Dézoomer" '+(zoom<=.5?'disabled ':'')+'onclick="'+A+'.zoomer(-1)">−</button>'+
    '<button type="button" class="alb-zoom-val" aria-label="Taille d’origine" title="Taille d’origine" onclick="'+A+'.zoomer(0)">'+Math.round(zoom*100)+' %</button>'+
    '<button type="button" class="alb-bouton alb-zoom-plus" aria-label="Zoomer" title="Zoomer" '+(zoom>=ZMAX?'disabled ':'')+'onclick="'+A+'.zoomer(1)">+</button></div>';
}
function adapter(){
  var ad=document.querySelector('.alb-adapt'),cl=ad&&ad.querySelector('.alb-classeur');
  if(!ad||!cl)return;
  var racine=document.documentElement,dispo=ad.clientWidth;
  if(!dispo)return;   /* page cachée : rien à mesurer */
  var nw=980;
  racine.style.setProperty('--alb-nw',nw+'px');
  var nh=cl.offsetHeight;
  if(!nh)return;
  var haut=Math.max(220,(window.innerHeight||800)-110);
  /* Téléphone, livre fermé : seule la couverture (la moitié du livre, centrée) est affichée, à la taille de l'écran ; elle s'agrandit en glissant quand le livre s'ouvre. */
  var echelle=ad.querySelector('.alb-echelle'),ferme=demi(),vis=ferme?nw/2:nw;
  var ajuste=Math.max(.2,Math.min(1,dispo/vis,haut/nh)),s=ajuste*zoom;
  if(!ouvert)s=ajuste;
  if(echelle)echelle.classList.toggle('alb-rogne',ferme&&!echelle.classList.contains('alb-glisse'));
  racine.style.setProperty('--alb-dx',(ferme?-(ouvert?nw/2:nw/4)*s:0).toFixed(1)+'px');
  var carte=cl.querySelector('.alb-pochette .alb-carte');
  var ref=refCarte();
  racine.style.setProperty('--alb-ref',ref+'px');
  if(carte&&carte.offsetWidth)racine.style.setProperty('--alb-k',(carte.offsetWidth/ref).toFixed(4));
  racine.style.setProperty('--alb-s',s.toFixed(4));
  racine.style.setProperty('--alb-w',Math.ceil(vis*s)+'px');
  racine.style.setProperty('--alb-h',Math.ceil(nh*s)+'px');
  if(!ad.__alb_obs&&typeof ResizeObserver==='function'){ad.__alb_obs=new ResizeObserver(function(){adapter();});ad.__alb_obs.observe(ad);}
  var cad=ad.querySelector('.alb-cadre');
  if(cad&&!cad.__alb_sc){cad.__alb_sc=true;cad.addEventListener('scroll',function(){if(cad.__alb_raf)return;cad.__alb_raf=requestAnimationFrame(function(){cad.__alb_raf=0;majNav();});},{passive:true});}
  majNav();
}
function zoomer(sens){
  zoom=sens===0?1:Math.max(.5,Math.min(ZMAX,Math.round((zoom+sens*.1)*10)/10));
  try{if(zoom===1)localStorage.removeItem(CLE_ZOOM);else localStorage.setItem(CLE_ZOOM,String(zoom));}catch(_e){}
  [].forEach.call(document.querySelectorAll('.alb-zoom-val'),function(b){b.textContent=Math.round(zoom*100)+' %';});
  [].forEach.call(document.querySelectorAll('.alb-zoom-moins'),function(b){b.disabled=zoom<=.5;});
  [].forEach.call(document.querySelectorAll('.alb-zoom-plus'),function(b){b.disabled=zoom>=ZMAX;});
  adapter();
}
function refaire(){var c=document.querySelector('.alb-classeur');if(c){page=norm(page);c.innerHTML=livreHtml();zonesNav();adapter();}}
/* Les barres de navigation sont HORS du classeur (qui est mis à l'échelle) : elles gardent la taille d'un bouton normal, même quand le livre est tout petit ou zoomé ; leur place est réservée en permanence. */
function zonesNav(){[].forEach.call(document.querySelectorAll('.alb-adapt .alb-nav-zone'),function(z){z.innerHTML=navHtml(z.classList.contains('alb-nav-zone-haut')?'haut':'bas');});}
function majNav(){
  var navs=document.querySelectorAll('.alb-adapt .alb-nav');
  [].forEach.call(navs,function(nav){
    var pr=nav.querySelector('.alb-prec'),su=nav.querySelector('.alb-suiv'),p10=nav.querySelector('.alb-prec10'),s10=nav.querySelector('.alb-suiv10'),nu=nav.querySelector('.alb-numero');
    if(pr)pr.disabled=!peutPrec();if(p10)p10.disabled=page<=0;if(su)su.disabled=!peutSuivre();if(s10)s10.disabled=!peutAvancer();
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
  remplirPages(true);majNav();adapter();
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
/* Change l'échelle du livre (couverture agrandie sur téléphone <-> livre entier) : transitions CSS le temps de l'animation (classe alb-glisse), puis mesure finale ; ouvert : le livre se place sur sa page de droite. */
function glisserVers(cl,moitie){demiCible=moitie;glisser(cl,false);}   /* tour de page qui quitte ou rejoint la première page (téléphone) : le livre s'élargit ou se resserre pendant que la feuille tourne */
function glisser(cl,vite){
  var ech=cl.closest&&cl.closest('.alb-echelle');
  if(!ech||!etroit()){adapter();return;}
  if(!vite)ech.classList.add('alb-glisse');
  adapter();
  setTimeout(function(){demiCible=null;ech.classList.remove('alb-glisse');adapter();if(ouvert)placer('d',true);},vite?0:DUREE+80);
}
function ouvrirLivre(p){
  return new Promise(function(ok){
    var cl=document.querySelector('.alb-classeur');
    if(ouvert||tourne||!cl){ok();return;}
    son('albumPage');
    var livre=cl.querySelector('.alb-livre'),couv=cl.querySelector('.alb-couverture'),cuir=cl.querySelector('.alb-cuir');
    ouvert=true;page=norm(typeof p==='number'?p:page);
    livre.classList.remove('alb-centre');                /* le livre glisse vers le centre de la page en même temps que la couverture s'ouvre */
    var deux=livre.classList.contains('alb-double'),vite=reduit()||typeof couv.animate!=='function';
    remplirPages();
    cl.classList.add('alb-ouvert');
    if(!document.querySelector('.alb-adapt .alb-nav'))zonesNav();
    glisser(cl,vite);                                    /* téléphone : le livre passe de la couverture agrandie au livre entier pendant l'ouverture */
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
    son('albumFerme');
    var livre=cl.querySelector('.alb-livre'),couv=cl.querySelector('.alb-couverture'),cuir=cl.querySelector('.alb-cuir');
    var deux=livre.classList.contains('alb-double'),vite=reduit()||typeof couv.animate!=='function';
    [].forEach.call(document.querySelectorAll('.alb-adapt .alb-nav'),function(nav){if(nav.parentNode)nav.parentNode.removeChild(nav);});
    page=0;remplirPages();                       /* le livre se referme sur sa première feuille */
    ouvert=false;
    livre.classList.add('alb-centre');                   /* et se recentre sur la page pendant que la couverture se ferme */
    placer('g',true);
    glisser(cl,vite);
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
    if(!silencieux)son('albumPage');
    var deux=livre.classList.contains('alb-double'),pas=deux?2:1;
    var p=page,q=p+(sens<0?-pas:pas);
    if(sens>0?!peutAvancer():p<=0){ok(false);return;}
    if(q<0)q=0;
    if(etroit()&&(p===0||q===0))glisserVers(classeur,q===0);
    var E=D<DUREE?'cubic-bezier(.4,0,.55,1)':EASE;
    var pd=livre.querySelector('.alb-page-d'),pg=livre.querySelector('.alb-page-g'),fd=pd.querySelector('.alb-feuille'),fg=pg.querySelector('.alb-feuille');
    if(reduit()||typeof pd.animate!=='function'){afficher(q);if(!silencieux)setTimeout(verifierPage,450);ok(true);return;}
    var avant,arriere;
    try{avant=contenuPage(sens>0?p:q);arriere=deux?contenuPage(sens>0?p+1:q+1,true):'';}catch(_e){afficher(q);ok(false);return;}   /* un contenu qui lève ne bloque jamais le livre */
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
function page_(sens){
  if(saut||tourne)return;
  if(peutPanner(sens)){placer(sens>0?'d':'g');return;}   /* zoomé : d'abord glisser jusqu'à l'autre page de la feuille */
  var t=tournerUne(sens,DUREE,false);
  if(tourne)placer(sens>0?'g':'d');   /* le livre glisse vers la première page de la nouvelle feuille PENDANT que la feuille tourne (on ne voit jamais les pages plus loin avant) */
  return t;
}
/*
 * Sauter de plusieurs pages (Norman, 2026-10-29 : « quand on passe 10 pages, je veux qu'on voie 10 pages tourner en une fois, pas une par une ») : les N feuilles partent à la file (une toutes les 80 ms) et sont TOUTES en l'air en même temps, comme on feuillette un classeur ;
 * elles retombent l'une sur l'autre (la dernière dessus). Un saut qui dépasse le début ou la fin s'arrête à la première ou à la dernière page. Seule la page atteinte annonce ses nouvelles cartes.
 */
var saut=false;
function sauterInterne(n,fini){
  if(tourne||saut||!ouvert)return fini();
  var classeur=document.querySelector('.alb-classeur'),livre=classeur&&classeur.querySelector('.alb-livre');
  if(!livre)return fini();
  var deux=livre.classList.contains('alb-double'),pas=deux?2:1,sens=n<0?-1:1,P=nbPages();
  var dispo=sens>0?(deux?Math.floor((P-page)/2):P-1-page):(deux?Math.floor(page/2):page);   /* feuilles (PC) ou pages (téléphone) tournables dans ce sens */
  var total=Math.min(Math.abs(n),dispo);
  if(total<=0)return fini();
  if(total===1){var t1=tournerUne(sens,DUREE,false);if(tourne)placer(sens>0?'g':'d');t1.then(function(){fini();});return;}   /* une seule feuille : la promesse se termine à la FIN de son animation (elle se terminait tout de suite : la couverture se fermait pendant que la dernière feuille tournait encore, Norman 2026-10-30 : « double mouvement de couverture en fermant ») */
  var p=page,q=p+sens*total*pas;
  var pd=livre.querySelector('.alb-page-d'),pg=livre.querySelector('.alb-page-g'),fd=pd.querySelector('.alb-feuille'),fg=pg.querySelector('.alb-feuille');
  if(reduit()||typeof pd.animate!=='function'){afficher(q);setTimeout(verifierPage,450);return fini();}
  if(etroit()&&(p===0||q===0))glisserVers(classeur,q===0);
  son('albumDix');
  placer(sens>0?'g':'d');
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
                '<div class="alb-face alb-face-arriere"><div class="alb-page"><div class="alb-feuille">'+(deux?(vraiArriere?contenuPage(a+1,true):legerHtml(a+1)):'')+'</div></div></div>';
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
  }catch(_e){feuilles.forEach(function(x){if(x.parentNode)x.parentNode.removeChild(x);});livre.classList.remove('alb-saut');tourne=false;saut=false;afficher(q);return fini();}
  Promise.all(anims.map(fin)).then(function(){
    var dern=feuilles[N-1];                             /* la dernière feuille est retombée dessus : ses cartes (déjà dessinées) deviennent la page */
    if(sens>0&&deux){var nf=dern.querySelector('.alb-face-arriere .alb-feuille');if(nf&&fg.parentNode)fg.parentNode.replaceChild(nf,fg);else fg.innerHTML=gaucheHtml(q);}
    if(sens<0){var nd=dern.querySelector('.alb-face-avant .alb-feuille');if(nd&&fd.parentNode)fd.parentNode.replaceChild(nd,fd);else fd.innerHTML=droiteHtml(q);}
    feuilles.forEach(function(x){if(x.parentNode)x.parentNode.removeChild(x);});
    livre.classList.remove('alb-saut');
    tourne=false;saut=false;page=norm(q);marquer(page);majNav();verifierTaille();
    placer(sens>0?'g':'d');
    setTimeout(verifierPage,450);
    fini();
  });
}

/* Sauter de plusieurs pages ; la promesse se résout quand les feuilles sont retombées (ou tout de suite si rien ne bouge). */
function sauter(n){return new Promise(function(ok){sauterInterne(n,ok);});}
/*
 * La flèche tout à gauche (Norman, 2026-10-30 : « il faut que toutes les pages repassent avant que la couverture se ferme ; là, on est téléporté à la page 1 ») : toutes les feuilles repassent d'un coup jusqu'à la première page, PUIS la couverture se referme.
 */
function retourCouverture(){
  if(!ouvert||tourne||saut)return Promise.resolve();
  var pas=double()?2:1,feuilles=Math.ceil(page/pas);
  return (feuilles>0?sauter(-feuilles):Promise.resolve()).then(function(){return fermerLivre();});
}
/* ---------- le clic : la carte sort de sa pochette et vient en zoom ---------- */
function rendreSortie(n){
  try{var p=document.querySelectorAll('.alb-pochette[data-album-boss="'+n+'"]');for(var i=0;i<p.length;i++)p[i].classList.remove('alb-sorti','alb-envole');}catch(_e){}
}
/*
 * Consulter un boss (Norman, 2026-10-30 : « le mouvement de la carte qui sort de son étui n'est pas fluide ; et quand on la remet, il n'y a carrément pas d'animation ») :
 * UN SEUL mouvement continu, sans attente ni saccade. La fiche est construite d'abord (la carte n'a pas encore bougé : le travail lourd ne tombe plus au milieu du mouvement), puis la grande carte part EXACTEMENT de la petite (même taille, même place), sort de la pochette par le haut et vient se poser au centre.
 * À la fermeture, la fiche est gardée un instant (invisible pour le jeu : autre identifiant) et la carte refait le chemin inverse : elle remonte un peu puis glisse dans sa pochette ; la fiche s'efface pendant ce temps.
 */
var sortie=null;   /* fermeture en cours : {fenetre} */
function finirSortie(){
  var S=sortie;if(!S)return;sortie=null;
  try{if(S.fenetre.parentNode)S.fenetre.parentNode.removeChild(S.fenetre);}catch(_e){}
  rendreSortie(S.n);
}
function mouvementCarte(r0,r1,cote){   /* de la petite carte (r0) à la grande (r1) : [départ, sortie par le haut, arrivée] */
  var dx=r0.left-r1.left,dy=r0.top-r1.top,s=r0.width/r1.width,h=r0.width*.3,sg=cote==='g'?-1:1;   /* sg : -1 = ouverture à gauche (page de gauche), 1 = à droite */
  return {
    petite:'translate('+dx.toFixed(1)+'px,'+dy.toFixed(1)+'px) scale('+s.toFixed(4)+')',
    sortie:'translate('+(dx+sg*h).toFixed(1)+'px,'+dy.toFixed(1)+'px) scale('+(s*1.04).toFixed(4)+') rotate('+(sg*2)+'deg)',
    dessus:'translate('+(dx+sg*(r0.width+6)).toFixed(1)+'px,'+dy.toFixed(1)+'px) scale('+s.toFixed(4)+')',   /* petite carte posée juste À CÔTÉ de sa pochette, face à l'ouverture (hors écran si besoin) */
    grande:'translate(0,0) scale(1) rotate(0deg)'
  };
}
function retourPochette(n,fenetre,grande,r1,parent){
  var el=document.querySelector('.alb-pochette[data-album-boss="'+n+'"]'),carte=el&&el.querySelector('.alb-carte'),r0=carte?carte.getBoundingClientRect():null;
  if(sortie)finirSortie();
  sortie={fenetre:fenetre,n:n};
  fenetre.id='sorealIdleBossCollectionModalV1-sortie';fenetre.style.pointerEvents='none';
  parent.appendChild(fenetre);                          /* la fiche reste à l'écran pendant que la carte rentre */
  if(!r0||!(r0.width>0)||!(r1.width>0)||typeof grande.animate!=='function'){finirSortie();return;}
  var m=mouvementCarte(r0,r1,el&&el.closest&&el.closest('.alb-page-g')?'g':'d');
  grande.style.transformOrigin='0 0';grande.style.willChange='transform';
  /* Norman (2026-10-30) : « la carte doit entrer par l'ouverture de la pochette, selon la page : à gauche sur la page de gauche, à droite sur la page de droite, même hors écran » : elle rejoint d'abord le côté de sa pochette, face à l'ouverture, puis glisse vers l'intérieur. */
  var a=grande.animate([
    {transform:m.grande,easing:'cubic-bezier(.3,.6,.3,1)'},
    {transform:m.dessus,offset:.5,easing:'cubic-bezier(.35,0,.25,1)'},
    {transform:m.petite}
  ],{duration:900,fill:'forwards'});
  /* Seul le FOND (voile et flou) s'estompe, pendant toute la durée du glissement : la carte est dans la fenêtre, elle ne doit pas s'effacer avant d'être arrivée dans sa pochette (Norman, 2026-10-30 : « quand la carte glisse pour entrer dans sa pochette, elle disparaît et apparaît une fois en place » : la fenêtre entière s'estompait en 520 ms, le glissement durait 900 ms). */
  try{fenetre.animate([{backgroundColor:'rgba(4,8,16,.6)',backdropFilter:'blur(10px)',webkitBackdropFilter:'blur(10px)'},{backgroundColor:'rgba(4,8,16,0)',backdropFilter:'blur(0px)',webkitBackdropFilter:'blur(0px)'}],{duration:900,easing:'ease-in',fill:'forwards'});}catch(_e){}
  fin(a).then(finirSortie);
  setTimeout(function(){if(sortie&&sortie.fenetre===fenetre)finirSortie();},1800);   /* filet de sécurité */
}
function ouvrir(n,el){
  var ouvrirReel=window.__ouvrirBossCollectionIdleV1__;
  if(typeof ouvrirReel!=='function')return;
  var carte=el&&el.querySelector?el.querySelector('.alb-carte'):null;
  if(sortie)finirSortie();                              /* une fermeture encore en cours est terminée tout de suite */
  if(!carte||reduit()||typeof carte.animate!=='function'){ouvrirReel(n);return;}
  try{
    var r0=carte.getBoundingClientRect();
    ouvrirReel(n);                                      /* la fiche est construite AVANT que la carte bouge */
    var fenetre=document.querySelector('#sorealIdleBossCollectionModalV1');
    var grande=fenetre&&fenetre.querySelector('.mtg-modal-v1');
    if(!grande){rendreSortie(n);return;}
    var parent=fenetre.parentNode,r1=grande.getBoundingClientRect();
    if(!(r1.width>0)||!(r0.width>0)){return;}
    el.classList.add('alb-envole');                     /* la petite carte part avec la grande (même image) : seule sa pochette reste */
    var m=mouvementCarte(r0,r1,el.closest&&el.closest('.alb-page-g')?'g':'d');
    grande.style.transformOrigin='0 0';grande.style.willChange='transform';
    var a=grande.animate([
      {transform:m.petite,easing:'cubic-bezier(.3,.9,.3,1)'},
      {transform:m.sortie,offset:.3,easing:'cubic-bezier(.25,.8,.25,1)'},
      {transform:m.grande}
    ],{duration:760});
    fin(a).then(function(){grande.style.willChange='';});
    try{fenetre.animate([{opacity:0},{opacity:1}],{duration:300,easing:'ease-out'});}catch(_e){}
    /* à la fermeture (bouton, fond, Échap : la fiche est retirée de la page) : la carte retourne dans sa pochette */
    var obs=new MutationObserver(function(muts){
      for(var i=0;i<muts.length;i++)for(var j=0;j<muts[i].removedNodes.length;j++)if(muts[i].removedNodes[j]===fenetre){
        obs.disconnect();
        retourPochette(n,fenetre,grande,r1,parent);
        return;
      }
    });
    obs.observe(parent,{childList:true});
  }catch(_e){rendreSortie(n);}
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
/* Passer l'animation : toutes les cartes sont rangées tout de suite. */
function passer(){
  var P=popup;if(!P||!P.fini||P.saute)return;
  P.saute=true;
  [].forEach.call(document.querySelectorAll('.alb-vol'),function(c){c.style.display='none';});
  (P.anims||[]).forEach(function(a){try{a.cancel();}catch(_e){}});
  [].forEach.call(document.querySelectorAll('.alb-vol-carte'),function(c){try{c.getAnimations().forEach(function(a){a.cancel();});}catch(_e){}});
}
function ranger(){
  var P=popup;if(!P||P.fini)return;
  P.fini=true;P.saute=false;P.anims=[];
  var fond=P.fond,els=[].slice.call(fond.querySelectorAll('.alb-annonce-carte')),n=els.length;
  var vw=window.innerWidth||document.documentElement.clientWidth,vh=window.innerHeight||document.documentElement.clientHeight;
  var couche=document.createElement('div');couche.className='alb-vol';couche.setAttribute('data-morph-garder','');couche.setAttribute('aria-hidden','true');
  var vols=els.map(function(el,i){
    var r0=el.getBoundingClientRect(),c=el.cloneNode(true);
    c.className='alb-vol-carte alb-carte-mtg';c.style.cssText='left:'+r0.left+'px;top:'+r0.top+'px;width:'+r0.width+'px;z-index:'+(n-i);
    couche.appendChild(c);
    return {el:c,r0:r0,n:el.getAttribute('data-n'),i:i,dx:vw/2-(r0.left+r0.width/2)+i*1.5,dy:vh/2-(r0.top+r0.height/2)-i*1.5,rot:((i%5)-2)*1.4};
  });
  var bp=document.createElement('button');bp.type='button';bp.className='alb-passer';bp.textContent='Passer';bp.addEventListener('click',function(ev){ev.stopPropagation();passer();});couche.appendChild(bp);
  document.body.appendChild(couche);
  var clsr=document.querySelector('.alb-classeur');if(clsr)clsr.classList.add('alb-rangement');   /* le classeur ne coupe plus ce qui dépasse : la carte entre depuis l'extérieur de la page */
  try{fond.animate([{opacity:1},{opacity:0}],{duration:240,fill:'forwards'});}catch(_e){}
  setTimeout(function(){if(fond.parentNode)fond.parentNode.removeChild(fond);},260);
  var termine=function(){
    P.neuves.forEach(function(e){delete enAttente[e.numero];});
    document.querySelectorAll('.alb-pochette.alb-attente').forEach(function(p){p.classList.remove('alb-attente');});
    if(couche.parentNode)couche.parentNode.removeChild(couche);
    var c2=document.querySelector('.alb-classeur');if(c2)c2.classList.remove('alb-rangement');
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
  /*
   * Une par une (Norman, 2026-10-30) : l'ouverture des pochettes est sur le côté EXTÉRIEUR de la page ; la carte vole jusqu'à côté de l'emplacement, face à l'ouverture, DEHORS, puis glisse en entier à l'intérieur, sous le plastique : elle ne traverse jamais le plastique.
   * « Passer » (bouton, Échap) : toutes les cartes se rangent d'un coup.
   */
  vols.forEach(function(v){
    suite=suite.then(function(){
      if(P.saute)return;
      var poche=document.querySelector('.alb-livre .alb-pochette[data-album-boss="'+v.n+'"]'),cible=poche&&poche.querySelector('.alb-carte');
      var r1=cible?cible.getBoundingClientRect():null;
      if(!(r1&&r1.width>0)){if(poche)poche.classList.remove('alb-attente');if(v.el.parentNode)v.el.parentNode.removeChild(v.el);return;}
      var sg=poche.closest&&poche.closest('.alb-page-g')?-1:1,dec=sg*1.15;   /* 115 % de la largeur de la carte : entièrement hors de la pochette, côté ouverture */
      var s=r1.width/v.r0.width;
      var cx=r1.left+r1.width/2-(v.r0.left+v.r0.width/2)+dec*r1.width,cy=r1.top+r1.height/2-(v.r0.top+v.r0.height/2);
      var pile='translate('+v.dx.toFixed(1)+'px,'+v.dy.toFixed(1)+'px) scale(1) rotate('+v.rot+'deg)',finT='translate('+cx.toFixed(1)+'px,'+cy.toFixed(1)+'px) scale('+s.toFixed(4)+') rotate(0deg)';
      var vol;try{vol=v.el.animate([{transform:pile},{transform:finT}],{duration:750,easing:'cubic-bezier(.45,0,.2,1)',fill:'forwards'});}catch(_e){vol=null;}
      if(vol)P.anims.push(vol);
      return (vol?fin(vol):Promise.resolve()).then(function(){
        if(P.saute)return;
        poche.classList.add('alb-entre');poche.classList.remove('alb-attente');
        if(v.el.parentNode)v.el.parentNode.removeChild(v.el);
        var g;try{g=cible.animate([{transform:'translateX('+(dec*100)+'%)'},{transform:'translateX(0)'}],{duration:850,easing:'cubic-bezier(.45,0,.25,1)'});}catch(_e){g=null;}
        if(g)P.anims.push(g);
        return (g?fin(g):Promise.resolve()).then(function(){poche.classList.remove('alb-entre');});
      });
    });
  });
  suite.then(termine,termine);
}

document.addEventListener('keydown',function(e){if(e.key==='Escape'&&popup){if(popup.fini)passer();else ranger();}});
/* glissement du doigt sur le classeur : vers la gauche = page suivante, vers la droite = précédente */
var toucheX=null,toucheY=null,toucheS=0;
function tournerSwipe(sens){if(saut||tourne)return;tournerUne(sens,DUREE,false);if(tourne)placer(sens>0?'g':'d');}   /* un glissement du doigt tourne toujours la feuille (jamais un simple glissement du livre) */
document.addEventListener('touchstart',function(e){
  var c=e.target&&e.target.closest&&e.target.closest('.alb-ouvert .soreal-idle-album-v1');
  if(!c||!e.touches||e.touches.length!==1){toucheX=null;return;}
  toucheX=e.touches[0].clientX;toucheY=e.touches[0].clientY;
  var cd=cadreAlb();toucheS=cd?cd.scrollLeft:0;
},{passive:true});
document.addEventListener('touchend',function(e){
  if(toucheX===null||!e.changedTouches||!e.changedTouches.length)return;
  var dx=e.changedTouches[0].clientX-toucheX,dy=e.changedTouches[0].clientY-toucheY;toucheX=null;
  /* livre zoomé (plus large que l'écran) : le doigt le fait glisser tout seul ; la feuille ne tourne que si le glissement part du bord du livre */
  var cd=cadreAlb(),m=margeAlb();
  if(cd&&m>=8){if(Math.abs(cd.scrollLeft-toucheS)>2)return;if(dx<0&&cd.scrollLeft<m-4)return;if(dx>0&&cd.scrollLeft>4)return;}
  if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.6)tournerSwipe(dx<0?1:-1);
},{passive:true});
/* l'écran change de taille (rotation du téléphone, fenêtre) : deux pages ou une seule */
var tailleVue=0;
function verifierTaille(){var l=document.querySelector('.alb-classeur .alb-livre');if(l&&!tourne&&l.classList.contains('alb-double')!==double())refaire();}
window.addEventListener('resize',function(){
  clearTimeout(tailleVue);
  adapter();
  tailleVue=setTimeout(function(){
    var livre=document.querySelector('.alb-classeur .alb-livre');
    if(!livre||tourne)return;
    if(livre.classList.contains('alb-double')!==double())refaire();
  },200);
});

window.__SOREAL_IDLE_ALBUM_V1__={rendre:rendre,ouvrir:ouvrir,page:page_,ouvrirLivre:ouvrirLivre,fermerLivre:fermerLivre,sauter:sauter,retourCouverture:retourCouverture,cliquerGauche:cliquerGauche,nouvelles:nouvelles,ranger:ranger,zoomer:zoomer,adapter:adapter};
})();
