/*
 * SOREAL IDLE — l'album de collection des boss (Norman, 2026-10-29 : « dans Chroniques de boss, un aspect d'album de collection pour Magic Card, avec des feuilles en plastique ; quand on clique, la carte sort de la feuille en plastique et vient en zoom sur l'écran pour qu'on puisse lire et la faire tourner »).
 * Chaque boss DÉJÀ découvert (règle n°2 : jamais de pochette vide ni de total) est une petite carte glissée dans sa pochette en plastique. Un clic : la carte sort de la pochette par le haut, puis vole jusqu'au centre de l'écran en grandissant : c'est la carte à collectionner complète
 * (modules/carte-boss-magic-v1.js, qui la fait tourner au doigt ou à la souris et la retourne d'un tap). À la fermeture, la carte retourne dans sa pochette. Aucune animation avec « réduire les animations ».
 * Pages (Norman, 2026-10-29 : « un mouvement de page qui tourne quand on passe à la suivante, avec un bouton ; adapter pour téléphone et PC ») : 9 pochettes par page sur téléphone (3 x 3), 8 sur grand écran (4 x 2). Les boutons ‹ › (ou un glissement du doigt) tournent la page autour des anneaux du classeur :
 * l'ancienne feuille pivote et laisse voir la suivante (ou, en arrière, la page précédente retombe). Le numéro de page ne dit que ce qui est découvert : pas de total de boss.
 *   window.__SOREAL_IDLE_ALBUM_V1__ = { pochette(entree, urlImage, esc) -> html, rendre(pochettesHtml[]) -> html, ouvrir(numero, element), page(sens) }
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_ALBUM_V1__)return;

var COULEURS=['#2a6aa6','#c0432b','#2f8048','#3d3545','#d9ccaa','#d2a93f'];   /* mêmes familles que la carte (bleu, rouge, vert, noir, blanc, or) */
function reduit(){try{return Boolean(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);}catch(_e){return false;}}
function monde(n){
  try{
    var REG=window.__SOREAL_IDLE_REG__||{};var cat=REG.idleEtat&&Array.isArray(REG.idleEtat.bossCatalogue)?REG.idleEtat.bossCatalogue:[];
    for(var i=0;i<cat.length;i++)if(cat[i]&&Math.floor(Number(cat[i].numero))===n)return Math.max(1,Math.floor(Number(cat[i].monde)||1));
  }catch(_e){}
  return 1;
}

/* Une pochette : la carte (cadre de la couleur du monde, nom, illustration entière) sous une feuille de plastique brillante. */
function pochette(e,url,esc){
  var n=Math.floor(Number(e.numero))||0;
  var nom=esc(e.nom||'Boss');
  var coul=COULEURS[(monde(n)-1)%5];
  return '<div class="alb-pochette" role="button" tabindex="0" data-album-boss="'+n+'" aria-label="'+nom+'" '+
      'onclick="window.__SOREAL_IDLE_ALBUM_V1__.ouvrir('+n+',this)" '+
      'onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();window.__SOREAL_IDLE_ALBUM_V1__.ouvrir('+n+',this)}">'+
    '<div class="alb-carte" style="--alb-cadre:'+coul+'">'+
      '<div class="alb-carte-nom">'+nom+'</div>'+
      '<div class="alb-carte-art"><img src="'+esc(url)+'" alt="" loading="lazy" onerror="this.style.display=\'none\'"></div>'+
      '<div class="alb-carte-bas" aria-hidden="true">B '+('0000'+n).slice(-4)+'</div>'+
    '</div>'+
    '<div class="alb-plastique" aria-hidden="true"></div>'+
  '</div>';
}

var liste=[],debut=0,tourne=false;
function taille(){try{return window.matchMedia&&window.matchMedia('(min-width:640px)').matches?8:9;}catch(_e){return 9;}}
function nbPages(){return Math.max(1,Math.ceil(liste.length/taille()));}
function pageCourante(){return Math.min(nbPages()-1,Math.floor(debut/taille()));}
function feuilleHtml(p){var t=taille();return liste.slice(p*t,p*t+t).join('');}
var CHEV_G='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4 7 12l8 8" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
var CHEV_D='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4l8 8-8 8" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function navHtml(){
  var p=pageCourante(),n=nbPages();
  if(n<2)return '';
  return '<div class="alb-nav">'+
    '<button type="button" class="alb-bouton alb-prec" aria-label="Page précédente" '+(p<=0?'disabled ':'')+'onclick="window.__SOREAL_IDLE_ALBUM_V1__.page(-1)">'+CHEV_G+'</button>'+
    '<span class="alb-numero">Page '+(p+1)+' / '+n+'</span>'+
    '<button type="button" class="alb-bouton alb-suiv" aria-label="Page suivante" '+(p>=n-1?'disabled ':'')+'onclick="window.__SOREAL_IDLE_ALBUM_V1__.page(1)">'+CHEV_D+'</button>'+
  '</div>';
}
/* Le classeur entier : la reliure (anneaux) avec la feuille de pochettes de la page courante, puis les boutons. */
function rendre(pochettes){
  liste=pochettes||[];
  debut=Math.min(debut,Math.max(0,liste.length-1));
  debut=pageCourante()*taille();
  return '<div class="alb-classeur">'+
    '<div class="soreal-idle-bestiary-grid-v110 soreal-idle-album-v1"><div class="alb-feuille">'+feuilleHtml(pageCourante())+'</div></div>'+
    navHtml()+
  '</div>';
}
function majNav(){
  var nav=document.querySelector('.alb-classeur .alb-nav');if(!nav)return;
  var p=pageCourante(),n=nbPages();
  nav.querySelector('.alb-prec').disabled=p<=0;nav.querySelector('.alb-suiv').disabled=p>=n-1;
  nav.querySelector('.alb-numero').textContent='Page '+(p+1)+' / '+n;
}
/* Tourne la page : sens +1 = suivante (la feuille actuelle pivote autour des anneaux), -1 = précédente (l'ancienne page retombe par-dessus). */
function page(sens){
  if(tourne)return;
  var classeur=document.querySelector('.alb-classeur');
  var reliure=classeur&&classeur.querySelector('.soreal-idle-album-v1'),feuille=reliure&&reliure.querySelector('.alb-feuille');
  if(!feuille)return;
  var p=pageCourante(),q=p+(sens<0?-1:1);
  if(q<0||q>=nbPages())return;
  debut=q*taille();
  var vite=reduit()||typeof feuille.animate!=='function';
  if(vite){feuille.innerHTML=feuilleHtml(q);majNav();return;}
  tourne=true;
  var copie=feuille.cloneNode(true);
  copie.className='alb-feuille alb-feuille-tournante';
  copie.setAttribute('data-morph-garder','');copie.setAttribute('aria-hidden','true');
  copie.style.cssText='position:absolute;left:'+feuille.offsetLeft+'px;top:'+feuille.offsetTop+'px;width:'+feuille.offsetWidth+'px;height:'+feuille.offsetHeight+'px;transform-origin:0 50%;z-index:5;pointer-events:none';
  reliure.classList.add('alb-tourne');
  var fin=function(){tourne=false;reliure.classList.remove('alb-tourne');if(copie.parentNode)copie.parentNode.removeChild(copie);majNav();};
  var opts={duration:720,easing:'cubic-bezier(.45,.05,.3,1)',fill:'forwards'};
  try{
    if(sens>0){
      /* la feuille actuelle (copie) se lève et pivote vers la gauche ; dessous, la page suivante est déjà en place */
      feuille.innerHTML=feuilleHtml(q);
      reliure.appendChild(copie);
      var a=copie.animate([{transform:'rotateY(0deg)',opacity:1},{transform:'rotateY(-80deg)',opacity:1,offset:.5},{transform:'rotateY(-172deg)',opacity:0}],opts);
      a.onfinish=fin;
    }else{
      /* la page précédente (copie) retombe de la gauche sur la feuille actuelle, puis la remplace */
      copie.innerHTML=feuilleHtml(q);
      reliure.appendChild(copie);
      var b=copie.animate([{transform:'rotateY(-172deg)',opacity:0},{transform:'rotateY(-80deg)',opacity:1,offset:.5},{transform:'rotateY(0deg)',opacity:1}],opts);
      b.onfinish=function(){feuille.innerHTML=feuilleHtml(q);fin();};
    }
  }catch(_e){feuille.innerHTML=feuilleHtml(q);fin();}
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
  if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.6)page(dx<0?1:-1);
},{passive:true});
/* l'écran change de taille (rotation du téléphone, fenêtre) : même première pochette, nouveau découpage en pages */
var tailleVue=0;
window.addEventListener('resize',function(){
  clearTimeout(tailleVue);
  tailleVue=setTimeout(function(){
    var f=document.querySelector('.alb-classeur .alb-feuille');if(!f||tourne)return;
    debut=pageCourante()*taille();f.innerHTML=feuilleHtml(pageCourante());majNav();
  },200);
});

function rendreSortie(n){
  try{
    var p=document.querySelectorAll('.alb-pochette[data-album-boss="'+n+'"]');
    for(var i=0;i<p.length;i++)p[i].classList.remove('alb-sorti','alb-envole');
  }catch(_e){}
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
    /* 3. à la fermeture de la fiche, la carte retourne dans sa pochette */
    var veille=setInterval(function(){
      if(document.getElementById('sorealIdleBossCollectionModalV1'))return;
      clearInterval(veille);rendreSortie(n);
    },250);
  },300);
}

window.__SOREAL_IDLE_ALBUM_V1__={pochette:pochette,rendre:rendre,ouvrir:ouvrir,page:page};
})();
