/*
 * SOREAL IDLE — bulles des tubes de la Machine temporelle, dessinées dans UN SEUL canvas par tube (plan C9, 2026-11-06).
 *
 * Pourquoi : chaque bulle était un élément animé en CSS, donc sa propre couche de composition : 17 couches par tube, 34 pour la machine, chacune à renouveler 60 fois par seconde. Mesuré sur le téléphone de Norman, les
 * bulles faisaient l'essentiel du coût de rendu de la Machine temporelle (à 3x de densité). Un canvas = une couche par tube.
 *
 * Rendu IDENTIQUE à l'ancien : mêmes bulles (14 minibulles et 3 grosses par tube, mêmes positions, retards et durées), mêmes courbes que les @keyframes `tmmFizz` et `tmmMonte` de soreal-idle-machine.css (gardés
 * comme RÉFÉRENCE : le test compare ce module à ces keyframes), même confinement (jamais au-dessus du liquide, aucune bulle tube vide). Boucles parfaites (règle n°3) : opacité 0 au début et à la fin de chaque cycle,
 * toujours dans le même sens. Redessin de la page (règle n°4) : le canvas porte data-morph-vivant, le morph n'y touche pas.
 *
 *   window.__SOREAL_IDLE_TM_BULLES_V1__ = { specs(gauche), etat(spec, t, hauteurLiquide), bezier(x1,y1,x2,y2) }
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_TM_BULLES_V1__)return;

  /* ---------- courbes (fonctions pures : testées sans navigateur) ---------- */
  function bezier(x1,y1,x2,y2){
    function cx(t){return 3*x1*t*(1-t)*(1-t)+3*x2*t*t*(1-t)+t*t*t;}
    function cy(t){return 3*y1*t*(1-t)*(1-t)+3*y2*t*t*(1-t)+t*t*t;}
    function dx(t){return 3*x1*(1-t)*(1-t)+6*(x2-x1)*t*(1-t)+3*(1-x2)*t*t;}
    return function(x){
      if(x<=0)return 0;if(x>=1)return 1;
      var t=x;
      for(var i=0;i<8;i++){var e=cx(t)-x;if(Math.abs(e)<1e-6)return cy(t);var d=dx(t);if(Math.abs(d)<1e-6)break;t-=e/d;}
      var a=0,b=1;t=x;
      for(var k=0;k<24;k++){var v=cx(t);if(Math.abs(v-x)<1e-6)break;if(v<x)a=t;else b=t;t=(a+b)/2;}
      return cy(t);
    };
  }
  var LIN=function(x){return x;};
  var EASE_GDE=bezier(.35,.1,.7,.9);

  /* Interpolation par segments entre des points-clés {p, v}, avec la fonction de temps de CHAQUE segment (comme CSS : animation-timing-function s'applique entre deux keyframes d'une propriété). */
  function segments(cles,p,ease){
    if(p<=cles[0][0])return cles[0][1];
    for(var i=1;i<cles.length;i++){
      if(p<=cles[i][0]){var a=cles[i-1],b=cles[i],u=(p-a[0])/(b[0]-a[0]);return a[1]+(b[1]-a[1])*ease(u);}
    }
    return cles[cles.length-1][1];
  }

  /* Les bulles d'un tube : mêmes formules que l'ancien balisage (augmentations-page-v1.js). `gauche` = tube de la barre Vitesse. */
  function specs(gauche){
    var out=[],i;
    for(i=0;i<14;i++)out.push({type:'mini',taille:2,x:8+((i*41+(gauche?0:17))%84),retard:-Number(((i*0.173)%0.7).toFixed(2)),duree:Number((0.55+((i*7)%5)*0.07).toFixed(2))});
    for(i=0;i<3;i++)out.push({type:'gde',taille:3,x:24+i*26+(gauche?0:4),retard:-Number((i*0.9+(gauche?0:0.4)).toFixed(1)),duree:Number((2.4+i*0.35).toFixed(2))});
    return out;
  }

  /*
   * État d'une bulle à l'instant t (secondes) dans un liquide de hauteur `h` (px) : { opacite, montee (px depuis le pied), dx (px), echelle }.
   * Cycle : le retard est NÉGATIF (la bulle est déjà en cours à t = 0) ; progression p = ((t - retard) mod durée) / durée.
   */
  function etat(spec,t,h){
    var d=spec.duree,p=(((t-spec.retard)%d)+d)%d/d,cqh=h/100;
    if(spec.type==='mini'){
      /* tmmFizz : opacité 0 -> .95 à 15 % -> 0 ; translateY 0 -> -34px ; scale 1 -> 2.2 ; temps linéaire */
      return {opacite:segments([[0,0],[.15,.95],[1,0]],p,LIN),montee:34*p,dx:0,echelle:1+1.2*p};
    }
    /* tmmMonte : opacité 0 -> .95 (8 %) -> .85 (92 %) -> 0 ; translateY 0 -> -52cqh (50 %) -> -98cqh ; translateX 0 -> 3px -> -2px ; scale 1 -> 2.2 -> 3.8 ; cubic-bezier(.35,.1,.7,.9) à chaque segment */
    return {
      opacite:segments([[0,0],[.08,.95],[.92,.85],[1,0]],p,EASE_GDE),
      montee:segments([[0,0],[.5,52*cqh],[1,98*cqh]],p,EASE_GDE),
      dx:segments([[0,0],[.5,3],[1,-2]],p,EASE_GDE),
      echelle:segments([[0,1],[.5,2.2],[1,3.8]],p,EASE_GDE)
    };
  }

  var api={specs:specs,etat:etat,bezier:bezier};
  window.__SOREAL_IDLE_TM_BULLES_V1__=api;
  if(typeof document==='undefined'||typeof requestAnimationFrame!=='function')return;

  /* ---------- dessin ---------- */
  var calme=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var sprite=null;
  function lireSprite(){
    if(sprite)return sprite;
    var c=document.createElement('canvas');c.width=c.height=32;
    var g=c.getContext('2d');
    /* radial-gradient(circle at 35% 30%, #fff, rgba(255,255,255,.6) 55%, rgba(255,255,255,.18)) de l'ancien CSS */
    var r=g.createRadialGradient(32*.35,32*.3,0,32*.35,32*.3,32*0.72);
    r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.55,'rgba(255,255,255,.6)');r.addColorStop(1,'rgba(255,255,255,.18)');
    g.fillStyle=r;g.beginPath();g.arc(16,16,16,0,Math.PI*2);g.closePath();g.fill();
    sprite=c;return c;
  }
  var SPECS={vrai:specs(true),faux:specs(false)};

  /*
   * Taille du tube : JAMAIS lue dans la boucle d'images (lire clientHeight force le calcul de la mise en page : mesuré sur téléphone, une image de 14 ms à chaque relecture). Un ResizeObserver prévient quand
   * le tube change de taille ; la lecture se fait dans son rappel, une fois la mise en page déjà calculée (donc sans la forcer).
   */
  var observateur=null;
  function appliquerTaille(cv){
    var tube=cv.__tmTube,col=cv.parentNode;
    if(!tube||!col)return;
    var h=tube.clientHeight,l=col.clientWidth;
    if(!(h>0)||!(l>0))return;
    /* Densité 1x (2026-11-06) : à 3x, chaque canvas faisait ~0,5 million de pixels à effacer et renvoyer au processeur graphique à CHAQUE image ; les bulles font 2 à 4 px et sont déjà un dégradé doux, 1x suffit (9 fois moins de pixels). */
    var dpr=1;
    if(cv.__tmH!==h||cv.__tmL!==l||cv.__tmD!==dpr){
      cv.__tmH=h;cv.__tmL=l;cv.__tmD=dpr;
      cv.width=Math.round(l*dpr);cv.height=Math.round(h*dpr);
      cv.style.height=h+'px';
    }
  }
  function surveiller(cv){
    if(cv.__tmSurv)return;
    var tube=cv.parentNode&&cv.parentNode.parentNode&&cv.parentNode.parentNode.parentNode;   /* canvas > .tmm-bulles > .tmm-liq > .tmm-tube */
    if(!tube)return;
    cv.__tmSurv=true;cv.__tmTube=tube;tube.__tmCv=cv;
    if(typeof ResizeObserver!=='function'){appliquerTaille(cv);return;}   /* navigateur sans ResizeObserver : une seule mesure */
    if(!observateur)observateur=new ResizeObserver(function(entrees){entrees.forEach(function(e){var c=e.target.__tmCv;if(c)appliquerTaille(c);});});
    observateur.observe(tube);
  }
  function mesurer(cv){surveiller(cv);return cv.__tmH>0;}

  function dessiner(cv,t){
    var liq=cv.parentNode.parentNode;
    var pct=parseFloat(liq.style.height)||0;   /* hauteur posée par la boucle de la machine (poserTubeTmIdleV1_) : texte déjà écrit, aucune lecture de mise en page */
    var g=cv.__tmG||(cv.__tmG=cv.getContext('2d'));
    g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,cv.width,cv.height);
    if(!(pct>0))return;   /* tube vide : aucune bulle */
    /* Aucune énergie (ou magie) assignée à cette tour : aucune bulle, même si le liquide n'est pas à zéro (Norman, 2026-11-08 : « il ne faut plus de bulles dans les barres énergie et magie de la machine temporelle quand aucune énergie n'est assignée »). L'allocation est lue sur la tour (data-tm-alloc, tenue à jour par la page à chaque changement) ; sans tour (rendu isolé), le comportement d'avant. */
    var tour=cv.__tmTour;
    if(tour===undefined){tour=cv.__tmTour=(typeof cv.closest==='function'?cv.closest('.tmm-tour'):null);}
    if(tour&&!(Number(tour.getAttribute('data-tm-alloc'))>0))return;
    var dpr=cv.__tmD,h=cv.__tmH*pct/100,L=cv.__tmL,s=lireSprite(),liste=cv.dataset.tmGauche==='1'?SPECS.vrai:SPECS.faux;
    g.setTransform(dpr,0,0,dpr,0,0);
    for(var i=0;i<liste.length;i++){
      var b=liste[i],e=etat(b,t,h);
      if(!(e.opacite>0.004))continue;
      var diam=b.taille*e.echelle,cx=L*b.x/100+b.taille/2+e.dx,cy=cv.__tmH-1-b.taille/2-e.montee;   /* pied de la bulle à 1px du bas du liquide */
      g.globalAlpha=e.opacite;
      g.drawImage(s,cx-diam/2,cy-diam/2,diam,diam);
    }
    g.globalAlpha=1;
  }

  /*
   * La boucle ne tourne QUE si un canvas de bulles est dans la page (mesuré dans le menu Aventure : ~2,5 ms/s du fil principal pour une boucle qui ne dessinait rien). Elle s'arrête après 60 images sans canvas ;
   * elle repart au redessin de la page (liste APRES_REDESSIN, règle n°4) et, par sécurité, par une vérification toutes les 500 ms (un getElementsByClassName, aucun coût mesurable).
   */
  var active=false,sansCanvas=0;
  function image(){
    var liste=document.getElementsByClassName('tmm-bulles-cv');
    if(!liste.length){
      sansCanvas+=1;
      if(sansCanvas>60){active=false;return;}
      requestAnimationFrame(image);
      return;
    }
    sansCanvas=0;
    requestAnimationFrame(image);
    var t=performance.now()/1000;
    for(var i=0;i<liste.length;i++){
      var cv=liste[i];
      try{if(mesurer(cv)){if(calme){if(cv.__tmCalme!==1){cv.__tmCalme=1;cv.getContext('2d').clearRect(0,0,cv.width,cv.height);}}else dessiner(cv,t);}}catch(_e){}
    }
  }
  function demarrer(){sansCanvas=0;if(active)return;active=true;requestAnimationFrame(image);}
  (window.__SOREAL_IDLE_APRES_REDESSIN_V1__=window.__SOREAL_IDLE_APRES_REDESSIN_V1__||[]).push(demarrer);
  setInterval(function(){if(!active&&document.getElementsByClassName('tmm-bulles-cv').length)demarrer();},500);
  demarrer();
})();
