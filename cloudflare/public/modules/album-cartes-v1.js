/*
 * SOREAL IDLE — l'album de collection des boss (Norman, 2026-10-29 : « dans Chroniques de boss, un aspect d'album de collection pour Magic Card, avec des feuilles en plastique ; quand on clique, la carte sort de la feuille en plastique et vient en zoom sur l'écran pour qu'on puisse
 * lire et la faire tourner » ; puis : « 4 rangées par page, 12 cartes sur la page de gauche et 12 sur la page de droite ; à gauche, le dos des cartes ; la petite carte doit être la même que la grande, l'image avec le texte dessous ; sur téléphone, seulement la page de droite »).
 *
 * Le classeur : des pages de 12 pochettes en plastique (3 colonnes x 4 rangées). Sur PC le classeur est ouvert sur deux pages : à DROITE les cartes de la page, à GAUCHE le dos des cartes de la page précédente (comme dans un vrai classeur : les cartes sont glissées dos à dos dans
 * les feuilles, tourner la feuille montre leur dos). Sur téléphone, seule la page de droite est visible. Chaque petite carte est exactement la grande carte (modules/carte-boss-magic-v1.js) en miniature : mêmes dessins, mêmes tailles relatives (unités cqw).
 * Seuls les boss VAINCUS au moins une fois ont leur carte (Norman : « on gagne la carte quand on le tue la première fois uniquement » ; un boss seulement rencontré n'y est pas). Jamais de pochette vide ni de total de boss (règle n°2).
 * Un clic : la carte sort de sa pochette par le haut puis vole au centre de l'écran en grandissant (fiche zoomée, qu'on fait tourner au doigt ou à la souris). Les boutons ‹ › (ou un glissement du doigt) tournent la feuille autour des anneaux : elle se lève, pivote en montrant son dos,
 * et retombe à gauche ; en arrière, la feuille retombe à droite. À l'ouverture du menu, les cartes gagnées depuis la dernière visite s'affichent (« 5 nouvelles cartes débloquées ! ») puis se rangent une à une dans leur pochette.
 * Aucune animation avec « réduire les animations ».
 *   window.__SOREAL_IDLE_ALBUM_V1__ = { rendre(entrees) -> html, ouvrir(numero, element), page(sens), nouvelles(), ranger() }
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_ALBUM_V1__)return;

var PAR_PAGE=12,COLS=3;
var CLE_VUS='soreal_idle_album_vus_v1';   /* préférence liée au compte (règle n°6) : numéros des cartes déjà annoncées */

var cartes=[],page=0,tourne=false,enAttente={},popup=null;

function reduit(){try{return Boolean(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);}catch(_e){return false;}}
function double(){try{return Boolean(window.matchMedia&&window.matchMedia('(min-width:900px)').matches);}catch(_e){return false;}}
function carteMtg(){return window.__SOREAL_IDLE_CARTE_BOSS_MAGIC_V1__||null;}
function esc(t){return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function reg(){return window.__SOREAL_IDLE_REG__||{};}
function monde(n){
  try{
    var cat=reg().idleEtat&&Array.isArray(reg().idleEtat.bossCatalogue)?reg().idleEtat.bossCatalogue:[];
    for(var i=0;i<cat.length;i++)if(cat[i]&&Math.floor(Number(cat[i].numero))===n)return {monde:Math.max(1,Math.floor(Number(cat[i].monde)||1)),ordre:Math.floor(Number(cat[i].ordreMonde)||0)};
  }catch(_e){}
  return {monde:1,ordre:0};
}
function urlImage(n){try{var f=reg().urlBossR2IdleV1_;return typeof f==='function'?f(n):'';}catch(_e){return '';}}
function sansBalise(t){try{var f=reg().sansBaliseVoixIdleV1_;return typeof f==='function'?f(t):t;}catch(_e){return t;}}
function nbPages(){return Math.max(1,Math.ceil(cartes.length/PAR_PAGE));}

/* La petite carte : exactement la grande, en miniature (le texte du récit sous l'illustration, comme sur la vraie carte). */
function miniature(e){
  var C=carteMtg();if(!C)return '';
  var n=Math.floor(Number(e.numero))||0,m=monde(n);
  var histoire=e.description?'<div class="soreal-idle-bestiary-desc-v110 soreal-idle-boss-fiche-histoire-v1">'+esc(sansBalise(e.description))+'</div>':'';
  return C.html({numero:n,nom:e.nom,monde:m.monde,ordre:m.ordre,pv:e.pv,attaque:e.attaque,xp:e.xp,rencontres:e.rencontres,histoireHtml:histoire,boutonsHtml:'',adminHtml:'',image:urlImage(n),sansFleches:true});
}
function pochetteHtml(e){
  var n=Math.floor(Number(e.numero))||0,nom=esc(e.nom||'Boss');
  return '<div class="alb-pochette'+(enAttente[n]?' alb-attente':'')+'" role="button" tabindex="0" data-album-boss="'+n+'" aria-label="'+nom+'" '+
      'onclick="window.__SOREAL_IDLE_ALBUM_V1__.ouvrir('+n+',this)" '+
      'onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();window.__SOREAL_IDLE_ALBUM_V1__.ouvrir('+n+',this)}">'+
    '<div class="alb-carte alb-carte-mtg">'+miniature(e)+'</div>'+
    '<div class="alb-plastique" aria-hidden="true"></div>'+
  '</div>';
}
/* Le dos d'une carte, rangé à la place MIROIR de la carte de la page (la feuille tournée : la colonne de gauche passe à droite). */
function dosHtmlPochette(i){
  var r=Math.floor(i/COLS),c=COLS-1-(i%COLS),C=carteMtg();
  return '<div class="alb-pochette alb-pochette-dos" aria-hidden="true" style="grid-row:'+(r+1)+';grid-column:'+(c+1)+'">'+
    '<div class="alb-carte alb-carte-mtg">'+(C&&C.dosSeul?C.dosSeul():'')+'</div><div class="alb-plastique"></div></div>';
}
function cartesDePage(p){return cartes.slice(p*PAR_PAGE,p*PAR_PAGE+PAR_PAGE);}
function feuilleHtml(p){return cartesDePage(p).map(pochetteHtml).join('');}
function dosHtml(p){return cartesDePage(p).map(function(_e,i){return dosHtmlPochette(i);}).join('');}
/* à gauche : le dos des cartes de la page précédente ; avant la première page, des pochettes vides (l'intérieur de la couverture) */
function gaucheHtml(p){
  if(p>=1)return dosHtml(p-1);
  var v='',i;for(i=0;i<PAR_PAGE;i++)v+='<div class="alb-pochette alb-pochette-dos" aria-hidden="true"><div class="alb-carte alb-carte-mtg"></div><div class="alb-plastique"></div></div>';
  return v;
}

var CHEV_G='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4 7 12l8 8" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
var CHEV_D='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4l8 8-8 8" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function navHtml(){
  var n=nbPages();if(n<2)return '';
  return '<div class="alb-nav">'+
    '<button type="button" class="alb-bouton alb-prec" aria-label="Page précédente" '+(page<=0?'disabled ':'')+'onclick="window.__SOREAL_IDLE_ALBUM_V1__.page(-1)">'+CHEV_G+'</button>'+
    '<span class="alb-numero"><span>Page</span> <b>'+(page+1)+'</b> / <b>'+n+'</b></span>'+
    '<button type="button" class="alb-bouton alb-suiv" aria-label="Page suivante" '+(page>=n-1?'disabled ':'')+'onclick="window.__SOREAL_IDLE_ALBUM_V1__.page(1)">'+CHEV_D+'</button>'+
  '</div>';
}
function livreHtml(){
  return '<div class="soreal-idle-bestiary-grid-v110 soreal-idle-album-v1"><div class="alb-livre'+(double()?' alb-double':'')+'">'+
    '<div class="alb-page alb-page-g"><div class="alb-feuille">'+gaucheHtml(page)+'</div></div>'+
    '<div class="alb-page alb-page-d"><div class="alb-feuille">'+feuilleHtml(page)+'</div></div>'+
  '</div></div>'+navHtml();
}

/* Le classeur entier ; les cartes viennent de la Collection (boss vaincus seulement, dans l'ordre des numéros). */
function rendre(entrees){
  cartes=(entrees||[]).filter(function(e){return e&&e.vaincu&&Math.floor(Number(e.numero))>0;}).sort(function(a,b){return a.numero-b.numero;});
  page=Math.min(page,nbPages()-1);
  setTimeout(verifierNouvelles,500);
  return '<div class="alb-classeur">'+livreHtml()+'</div>';
}
function refaire(){var c=document.querySelector('.alb-classeur');if(c)c.innerHTML=livreHtml();}
function majNav(){
  var nav=document.querySelector('.alb-classeur .alb-nav');if(!nav)return;
  var n=nbPages(),b=nav.querySelectorAll('b');
  nav.querySelector('.alb-prec').disabled=page<=0;nav.querySelector('.alb-suiv').disabled=page>=n-1;
  if(b.length>1){b[0].textContent=String(page+1);b[1].textContent=String(n);}
}
function afficher(p){   /* sans animation */
  page=Math.max(0,Math.min(nbPages()-1,p));
  var d=document.querySelector('.alb-classeur .alb-page-d .alb-feuille'),g=document.querySelector('.alb-classeur .alb-page-g .alb-feuille');
  if(d)d.innerHTML=feuilleHtml(page);if(g)g.innerHTML=gaucheHtml(page);
  majNav();
}

/*
 * Tourner la feuille. Une feuille a DEUX faces : devant, les cartes de la page ; derrière, leur dos (la future page de gauche). Elle pivote autour des anneaux (le bord gauche de la page de droite), se lève vers le lecteur au milieu du mouvement, projette son ombre sur les pages,
 * puis retombe à gauche (PC) ; en arrière, c'est le mouvement inverse. Sur téléphone (pas de page de gauche) la feuille pivote puis s'efface vers la gauche.
 */
function page_(sens){
  if(tourne)return;
  var classeur=document.querySelector('.alb-classeur'),livre=classeur&&classeur.querySelector('.alb-livre');
  if(!livre)return;
  var p=page,q=p+(sens<0?-1:1);
  if(q<0||q>=nbPages())return;
  var pd=livre.querySelector('.alb-page-d'),pg=livre.querySelector('.alb-page-g'),fd=pd.querySelector('.alb-feuille'),fg=pg.querySelector('.alb-feuille');
  var deux=livre.classList.contains('alb-double');
  if(reduit()||typeof pd.animate!=='function'){page=q;afficher(q);return;}
  tourne=true;
  var avant=sens>0?feuilleHtml(p):feuilleHtml(q),arriere=sens>0?dosHtml(p):dosHtml(q);
  var feuille=document.createElement('div');
  feuille.className='alb-feuille-tournante';feuille.setAttribute('data-morph-garder','');feuille.setAttribute('aria-hidden','true');
  feuille.style.cssText='left:'+pd.offsetLeft+'px;top:'+pd.offsetTop+'px;width:'+pd.offsetWidth+'px;height:'+pd.offsetHeight+'px';
  feuille.innerHTML='<div class="alb-face alb-face-avant alb-page"><div class="alb-feuille">'+avant+'</div><i class="alb-ombre"></i></div>'+
                    '<div class="alb-face alb-face-arriere alb-page"><div class="alb-feuille">'+arriere+'</div><i class="alb-ombre"></i></div>';
  var ombreD=document.createElement('i'),ombreG=document.createElement('i');
  ombreD.className='alb-ombre-sol alb-ombre-sol-d';ombreG.className='alb-ombre-sol alb-ombre-sol-g';
  pd.appendChild(ombreD);if(deux)pg.appendChild(ombreG);
  var DUREE=1150,EASE='cubic-bezier(.5,.05,.3,1)';
  var fin=function(){
    tourne=false;page=q;
    [ombreD,ombreG,feuille].forEach(function(x){if(x&&x.parentNode)x.parentNode.removeChild(x);});
    majNav();
  };
  var ombresFace=feuille.querySelectorAll('.alb-ombre');
  /* Quelle face se voit : le basculement a lieu exactement à mi-course (feuille de champ, à 90°) ; plus fiable que la seule « face cachée » du navigateur, qui laissait voir le dos à travers le devant. */
  var facesAV=feuille.querySelector('.alb-face-avant'),facesAR=feuille.querySelector('.alb-face-arriere');
  var basculer=function(avantD){   /* avantD : la face avant se voit en premier (feuille qui se lève), sinon le dos d'abord (feuille qui retombe) */
    var v1={visibility:'visible'},h1={visibility:'hidden'};
    var kfA=avantD?[v1,{visibility:'visible',offset:.499},{visibility:'hidden',offset:.5},h1]:[h1,{visibility:'hidden',offset:.499},{visibility:'visible',offset:.5},v1];
    var kfR=avantD?[h1,{visibility:'hidden',offset:.499},{visibility:'visible',offset:.5},v1]:[v1,{visibility:'visible',offset:.499},{visibility:'hidden',offset:.5},h1];
    var o={duration:DUREE,easing:EASE,fill:'forwards'};
    facesAV.animate(kfA,o);facesAR.animate(kfR,o);
  };
  try{
    var anim;
    if(sens>0){
      fd.innerHTML=feuilleHtml(q);                      /* dessous : la page suivante, déjà en place */
      livre.appendChild(feuille);basculer(true);
      anim=feuille.animate(deux
        ?[{transform:'translateZ(0) rotateY(0deg)'},{transform:'translateZ(70px) rotateY(-90deg)',offset:.5},{transform:'translateZ(0) rotateY(-180deg)'}]
        :[{transform:'translateZ(0) rotateY(0deg)',opacity:1},{transform:'translateZ(70px) rotateY(-90deg)',opacity:1,offset:.5},{transform:'translateZ(0) rotateY(-160deg)',opacity:0}],
        {duration:DUREE,easing:EASE,fill:'forwards'});
      [ombresFace[0],ombresFace[1]].forEach(function(o){o.animate([{opacity:0},{opacity:.55,offset:.5},{opacity:0}],{duration:DUREE,easing:EASE});});
      ombreD.animate([{opacity:.65},{opacity:0}],{duration:DUREE*.75,easing:'ease-out',fill:'forwards'});
      if(deux)ombreG.animate([{opacity:0},{opacity:0,offset:.4},{opacity:.6,offset:.8},{opacity:0}],{duration:DUREE,fill:'forwards'});
      anim.onfinish=function(){if(deux)fg.innerHTML=gaucheHtml(q);fin();};
    }else{
      if(deux)fg.innerHTML=gaucheHtml(q);               /* dessous (à gauche) : la page d'avant, révélée quand la feuille se lève */
      livre.appendChild(feuille);basculer(false);
      anim=feuille.animate(deux
        ?[{transform:'translateZ(0) rotateY(-180deg)'},{transform:'translateZ(70px) rotateY(-90deg)',offset:.5},{transform:'translateZ(0) rotateY(0deg)'}]
        :[{transform:'translateZ(0) rotateY(-160deg)',opacity:0},{transform:'translateZ(70px) rotateY(-90deg)',opacity:1,offset:.5},{transform:'translateZ(0) rotateY(0deg)',opacity:1}],
        {duration:DUREE,easing:EASE,fill:'forwards'});
      [ombresFace[0],ombresFace[1]].forEach(function(o){o.animate([{opacity:0},{opacity:.55,offset:.5},{opacity:0}],{duration:DUREE,easing:EASE});});
      ombreD.animate([{opacity:0},{opacity:0,offset:.4},{opacity:.65,offset:.85},{opacity:0}],{duration:DUREE,fill:'forwards'});
      if(deux)ombreG.animate([{opacity:.6},{opacity:0}],{duration:DUREE*.75,easing:'ease-out',fill:'forwards'});
      anim.onfinish=function(){fd.innerHTML=feuilleHtml(q);fin();};
    }
  }catch(_e){page=q;fin();afficher(q);}
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
  el.classList.add('alb-sorti');                       /* 1. la carte glisse hors de la pochette, par le haut */
  setTimeout(function(){
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
  },300);
}

/* ---------- les nouvelles cartes : annonce puis rangement ---------- */
function lireVus(){try{var t=localStorage.getItem(CLE_VUS);return t==null?null:(JSON.parse(t)||[]);}catch(_e){return null;}}
function ecrireVus(l){try{localStorage.setItem(CLE_VUS,JSON.stringify(l));}catch(_e){}}
function nouvelles(){
  var vus=lireVus();
  if(vus===null){
    /* première visite de cet album : un joueur qui débute (peu de cartes) voit ses cartes arriver ; un joueur déjà avancé n'est pas noyé sous des centaines de cartes d'un coup */
    if(cartes.length>PAR_PAGE){ecrireVus(cartes.map(function(e){return e.numero;}));return [];}
    vus=[];
  }
  return cartes.filter(function(e){return vus.indexOf(e.numero)<0;});
}
function verifierNouvelles(){
  try{
    if(popup||!cartes.length)return;
    var c=document.querySelector('.alb-classeur');
    if(!c||!c.offsetParent)return;                      /* l'album n'est pas affiché : l'annonce attend la prochaine ouverture */
    var neuves=nouvelles();
    if(!neuves.length)return;
    annoncer(neuves);
  }catch(_e){}
}
function annoncer(neuves){
  var C=carteMtg();if(!C)return;
  var vus=lireVus()||[];ecrireVus(vus.concat(neuves.map(function(e){return e.numero;})));   /* annoncées une seule fois, même si la fenêtre est fermée en route */
  neuves.forEach(function(e){enAttente[e.numero]=true;});
  var idx=cartes.indexOf(neuves[0]);
  afficher(Math.floor(idx/PAR_PAGE));                  /* derrière l'annonce : la page de la première nouvelle carte, pochettes encore vides */
  if(reduit()){neuves.forEach(function(e){delete enAttente[e.numero];});afficher(page);return;}
  var n=neuves.length,voir=neuves.slice(0,PAR_PAGE);
  var fond=document.createElement('div');fond.className='alb-annonce';fond.setAttribute('data-morph-garder','');
  fond.innerHTML='<div class="alb-annonce-titre"><b>'+n+'</b> <span>'+(n>1?'nouvelles cartes débloquées !':'nouvelle carte débloquée !')+'</span></div>'+
    '<div class="alb-annonce-cartes">'+voir.map(function(e){return '<div class="alb-annonce-carte alb-carte-mtg" data-n="'+e.numero+'">'+miniature(e)+'</div>';}).join('')+'</div>'+
    (n>voir.length?'<div class="alb-annonce-reste">+'+(n-voir.length)+'</div>':'')+
    '<button type="button" class="alb-annonce-bouton">Ranger dans l’album</button>';
  document.body.appendChild(fond);
  popup={fond:fond,neuves:neuves,voir:voir,fini:false};
  var els=fond.querySelectorAll('.alb-annonce-carte');
  for(var i=0;i<els.length;i++){
    try{els[i].animate([{transform:'translateY(60px) scale(.5) rotate('+((i%2?1:-1)*8)+'deg)',opacity:0},{transform:'translateY(0) scale(1) rotate('+((i%2?1:-1)*2)+'deg)',opacity:1}],{duration:520,delay:200+i*110,easing:'cubic-bezier(.2,.9,.3,1.15)',fill:'both'});}catch(_e){}
  }
  try{fond.animate([{opacity:0},{opacity:1}],{duration:260,fill:'both'});}catch(_e){}
  var go=function(){ranger();};
  fond.querySelector('.alb-annonce-bouton').addEventListener('click',function(ev){ev.stopPropagation();go();});
  fond.addEventListener('click',go);
}
/* Les cartes de l'annonce volent chacune jusqu'à sa pochette (celle qui est sur une autre page glisse simplement vers le classeur et s'efface). */
function ranger(){
  var P=popup;if(!P||P.fini)return;
  P.fini=true;
  var fond=P.fond,els=[].slice.call(fond.querySelectorAll('.alb-annonce-carte'));
  var bouton=fond.querySelector('.alb-annonce-bouton');if(bouton)bouton.style.visibility='hidden';
  var titre=fond.querySelector('.alb-annonce-titre'),reste=fond.querySelector('.alb-annonce-reste');
  [titre,reste].forEach(function(x){if(x)try{x.animate([{opacity:1},{opacity:0}],{duration:300,fill:'forwards'});}catch(_e){}});
  try{fond.animate([{backgroundColor:'rgba(4,8,16,.72)'},{backgroundColor:'rgba(4,8,16,0)'}],{duration:900,delay:200,fill:'forwards'});}catch(_e){}
  var restant=els.length,classeur=document.querySelector('.alb-classeur');
  var termine=function(){
    P.neuves.forEach(function(e){delete enAttente[e.numero];});
    document.querySelectorAll('.alb-pochette.alb-attente').forEach(function(p){p.classList.remove('alb-attente');});
    if(fond.parentNode)fond.parentNode.removeChild(fond);
    popup=null;
  };
  if(!els.length){termine();return;}
  els.forEach(function(el,i){
    var n=el.getAttribute('data-n'),poche=document.querySelector('.alb-page-d .alb-pochette[data-album-boss="'+n+'"]');
    var r0=el.getBoundingClientRect(),cible=poche&&poche.querySelector('.alb-carte'),r1=cible?cible.getBoundingClientRect():null;
    /* La carte arrive AU-DESSUS de sa pochette, puis se glisse dedans par la fente du haut (Norman, 2026-10-29 : « elles doivent entrer par le haut comme si elles étaient glissées dans la pochette en plastique ») : à l'arrivée, la vraie carte de la pochette prend la place de la copie, remontée de 30 %, et redescend sous le plastique. */
    var fini=function(){
      if(poche&&cible){
        cible.style.transition='none';cible.style.transform='translateY(-30%)';
        poche.classList.remove('alb-attente');
        if(el.parentNode)el.parentNode.removeChild(el);
        void cible.offsetWidth;
        cible.style.transition='transform .7s cubic-bezier(.3,.8,.3,1)';cible.style.transform='';
        setTimeout(function(){cible.style.transition='';},800);
        try{poche.animate([{filter:'brightness(1.6)'},{filter:'brightness(1)'}],{duration:900,delay:450});}catch(_e){}
        setTimeout(function(){restant-=1;if(restant<=0)termine();},750);
        return;
      }
      if(poche)poche.classList.remove('alb-attente');
      if(el.parentNode)el.parentNode.removeChild(el);
      restant-=1;if(restant<=0)termine();
    };
    try{
      var dx,dy,s;
      if(r1&&r1.width>0){dx=r1.left+r1.width/2-(r0.left+r0.width/2);dy=r1.top+r1.height/2-(r0.top+r0.height/2)-r1.height*.30;s=r1.width/r0.width;}   /* au-dessus de la pochette, à l'ouverture */
      else{var rc=classeur?classeur.getBoundingClientRect():{left:r0.left,top:r0.top,width:0,height:0};dx=rc.left+rc.width/2-(r0.left+r0.width/2);dy=rc.top+rc.height/2-(r0.top+r0.height/2);s=.3;}
      var a=el.animate([
        {transform:'translate(0,0) scale(1) rotate(0deg)',opacity:1},
        {transform:'translate('+(dx*.2).toFixed(1)+'px,'+(dy*.2-40).toFixed(1)+'px) scale(1.12) rotate(-4deg)',opacity:1,offset:.28},
        {transform:'translate('+dx.toFixed(1)+'px,'+dy.toFixed(1)+'px) scale('+s.toFixed(4)+') rotate(0deg)',opacity:r1?1:0}
      ],{duration:850,delay:300+i*170,easing:'cubic-bezier(.45,.05,.25,1)',fill:'forwards'});
      a.onfinish=fini;
    }catch(_e){fini();}
  });
}

/* glissement du doigt sur le classeur : vers la gauche = page suivante, vers la droite = précédente */
var toucheX=null,toucheY=null;
document.addEventListener('touchstart',function(e){
  var c=e.target&&e.target.closest&&e.target.closest('.alb-classeur .soreal-idle-album-v1');
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
window.addEventListener('resize',function(){
  clearTimeout(tailleVue);
  tailleVue=setTimeout(function(){
    var livre=document.querySelector('.alb-classeur .alb-livre');
    if(!livre||tourne)return;
    if(livre.classList.contains('alb-double')!==double())refaire();
  },200);
});

window.__SOREAL_IDLE_ALBUM_V1__={rendre:rendre,ouvrir:ouvrir,page:page_,nouvelles:nouvelles,ranger:ranger};
})();
