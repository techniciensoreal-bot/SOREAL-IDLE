/*
 * BARRES D'AVANCEMENT EN PANNEAU LED (Norman, 2026-11-04 : « c'est un panneau LED plus récent ; il faut ce genre de panneaux pour la barre d'avancement des améliorations »).
 * Page Augmentations : chaque barre (.aug-tube-v2) reçoit un canvas qui la dessine comme l'écran de la borne d'arcade : une matrice de points ronds, éteints (très sombres) ou allumés
 * (couleur de la paire, halo), la dernière colonne s'allumant progressivement. L'avancement est LU sur le remplissage existant (.aug-liquide-v2, transform scaleX) : le jeu, lui, n'est pas modifié.
 * Règle n°4 : le canvas est AJOUTÉ après le rendu, avec data-morph-garder / data-morph-vivant ; le redessin de la page ne l'enlève pas, et il est ré-attaché par APRES_REDESSIN.
 * Le remplissage d'origine et sa trame CSS sont masqués par :has(> canvas) (aucune classe posée sur un nœud du morph). prefers-reduced-motion : aucune animation propre (le point ne fait que suivre la barre).
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_AUG_LED_BARRES_V1__)return;
  var ID_STYLE='soreal-idle-aug-led-barres-style-v1',PAS_PC=5,PAS_TEL=4;
  var raf=0,dernier=0,io=null;
  /* Audit de fluidité (Norman, 2026-11-05 : « lourdeur quand je navigue de menu en menu avec mon téléphone ») : seules les barres À L'ÉCRAN sont dessinées (IntersectionObserver), l'échelle est lue UNE fois par barre (elle remontait tous les ancêtres avec getComputedStyle à chaque image), la conversion de couleur est mémorisée (elle créait un canvas à chaque image) et la première image est étalée sur plusieurs images. */
  function observer(cv){
    if(!('IntersectionObserver' in window)){cv.__vu=true;return;}
    if(!io)io=new IntersectionObserver(function(es){for(var i=0;i<es.length;i++)es[i].target.__vu=es[i].isIntersecting;},{rootMargin:'120px'});
    if(cv.__obs)return;cv.__obs=true;cv.__vu=false;io.observe(cv);
  }

  function installerStyle(){
    if(document.getElementById(ID_STYLE))return;
    var s=document.createElement('style');s.id=ID_STYLE;
    s.textContent=
      '.aug-tube-v2 canvas.aug-led-cv-v1{position:absolute;left:0;top:0;width:100%;height:100%;z-index:4;display:block;border-radius:inherit;pointer-events:none}'+
      '.aug-tube-v2:has(>canvas.aug-led-cv-v1){background:#050403}'+
      '.aug-tube-v2:has(>canvas.aug-led-cv-v1)::before{display:none}'+
      '.aug-tube-v2:has(>canvas.aug-led-cv-v1) .aug-liquide-v2{visibility:hidden}';
    (document.head||document.documentElement).appendChild(s);
  }
  /* échelle réelle : devicePixelRatio x zoom CSS des ancêtres (la page est zoomée : sans cela le canvas est ré-échantillonné et les points sont inégaux) */
  function echelle(el){
    var d=window.devicePixelRatio||1,z=1,q,a;
    try{for(a=el;a&&a.nodeType===1;a=a.parentNode){q=parseFloat(getComputedStyle(a).zoom);if(q>0&&q!==1)z*=q;}}catch(_e){}
    return d*(z>0.3&&z<3?z:1);
  }
  function mobile(){return Boolean(window.matchMedia&&window.matchMedia('(max-width:700px)').matches);}

  /* avancement 0..1 lu sur le remplissage existant */
  function avancement(tube){
    var l=tube.querySelector('.aug-liquide-v2');if(!l)return 0;
    /* Le jeu anime le remplissage avec une animation du navigateur (échelle 0 -> 1) : le style en ligne ne bouge pas ; la valeur AFFICHÉE est dans le style calculé (Norman, 2026-11-04 : « les barres ne font plus de mouvement de remplissage ; l'écran LED n'apparaît que quand elles sont remplies »). */
    try{var ct=getComputedStyle(l).transform,mc=ct&&ct!=='none'?/^matrix(?:3d)?\(([^)]+)\)/.exec(ct):null;if(mc){var vc=parseFloat(mc[1].split(',')[0]);if(isFinite(vc))return Math.max(0,Math.min(1,vc));}}catch(_e){}
    var m=/scaleX\(([-\d.eE]+)\)/.exec(l.style.transform||'');
    if(m){var v=parseFloat(m[1]);return isFinite(v)?Math.max(0,Math.min(1,v)):0;}
    var w=tube.clientWidth;if(!(w>0))return 0;
    return Math.max(0,Math.min(1,l.getBoundingClientRect().width/w));
  }
  function couleur(tube){
    var c='';try{c=getComputedStyle(tube).getPropertyValue('--led-paire').trim();}catch(_e){}
    return c||'#ffb000';
  }
  var cacheRgb={};
  function rgb(c){
    if(cacheRgb[c])return cacheRgb[c];
    return (cacheRgb[c]=rgb1(c));
  }
  function rgb1(c){
    var d=document.createElement('canvas').getContext('2d');d.fillStyle='#ffb000';d.fillStyle=c;
    var h=d.fillStyle;if(h.charAt(0)==='#'&&h.length===7)return [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
    var m=/rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(h);return m?[+m[1],+m[2],+m[3]]:[255,176,0];
  }

  /*
   * FLUIDITÉ (Norman, 2026-11-07 : « les barres dans Augmentations ont l'air de ne pas être en 60 images par seconde ; le reste est fluide, c'est la manière dont elles avancent ») : avant, chaque barre était REDESSINÉE point par point (des centaines
   * d'arcs avec halo) au plus toutes les 33 ms (30 images par seconde) et la colonne en cours n'avait que 8 niveaux d'intensité : le mouvement paraissait saccadé. Maintenant : la trame éteinte, la colonne allumée (un « sprite » avec son halo) et
   * l'ensemble des colonnes déjà allumées sont dessinés UNE fois sur des calques en mémoire ; à chaque image on ne recompose que trois images (trame, colonnes allumées, colonne en cours à son intensité exacte), à chaque image d'écran (60 par seconde)
   * pour toutes les barres visibles, avec 64 niveaux d'intensité pour la colonne en cours. Colonnes de largeur entière en pixels de l'écran (jamais de ré-échantillonnage : les points restent nets).
   */
  function calques(cv,tube,w,h,dpr,col){
    var pas=mobile()?PAS_TEL:PAS_PC,W=Math.round(w*dpr),H=Math.round(h*dpr),cols=Math.max(8,Math.floor(w/pas)),rows=Math.max(3,Math.floor((h-2)/pas));
    var cw=W/cols,ox=0,oy=(H-rows*cw)/2,r=cw*0.36,m=Math.ceil(cw*0.95),c=rgb(col),i,j;
    var cle=cols+'|'+rows+'|'+cw+'|'+col+'|'+W+'x'+H;
    if(cv.__calquesCle===cle)return cv.__calques;
    function toile(l,hh){var o=document.createElement('canvas');o.width=l;o.height=hh;return o;}
    /* trame éteinte */
    var dim=toile(W,H),d=dim.getContext('2d');
    d.fillStyle='rgba('+c[0]+','+c[1]+','+c[2]+',0.13)';
    for(i=0;i<cols;i++)for(j=0;j<rows;j++){d.beginPath();d.arc(ox+(i+0.5)*cw,oy+(j+0.5)*cw,r,0,6.2832);d.fill();}
    /* une colonne allumée complète : halo, points, reflets (le halo déborde de m pixels de chaque côté) */
    var spr=toile(Math.ceil(cw)+2*m,H),g=spr.getContext('2d');
    g.shadowColor='rgba('+c[0]+','+c[1]+','+c[2]+',0.9)';g.shadowBlur=cw*0.9;g.fillStyle='rgba('+c[0]+','+c[1]+','+c[2]+',1)';
    for(j=0;j<rows;j++){g.beginPath();g.arc(m+cw/2,oy+(j+0.5)*cw,r*1.04,0,6.2832);g.fill();}
    g.shadowBlur=0;g.fillStyle='rgba(255,255,255,0.35)';
    for(j=0;j<rows;j++){g.beginPath();g.arc(m+cw/2-r*0.25,oy+(j+0.5)*cw-r*0.25,r*0.32,0,6.2832);g.fill();}
    var lit=toile(W,H);
    var o={dim:dim,spr:spr,lit:lit,litCtx:lit.getContext('2d'),cols:cols,cw:cw,ox:ox,m:m,W:W,H:H,plein:0};
    cv.__calquesCle=cle;cv.__calques=o;cv.__sigLed='';
    return o;
  }
  function dessiner(cv,tube){
    var w=tube.clientWidth,h=tube.clientHeight;if(!(w>0)||!(h>0))return;
    var dpr=cv.__ech||(cv.__ech=echelle(tube)),col=couleur(tube),o=calques(cv,tube,w,h,dpr,col);
    var p=avancement(tube),allume=p*o.cols,sig=Math.round(allume*64)+'|'+o.cols;
    if(cv.__sigLed===sig)return;
    cv.__sigLed=sig;
    if(cv.width!==o.W||cv.height!==o.H){cv.width=o.W;cv.height=o.H;}
    var ctx=cv.getContext('2d'),plein=Math.min(o.cols,Math.floor(allume)),a=allume-plein,i;
    /* colonnes pleinement allumées : ajoutées au calque (ou calque refait si la barre a reculé) */
    if(plein<o.plein){o.litCtx.clearRect(0,0,o.W,o.H);o.plein=0;}
    for(i=o.plein;i<plein;i++)o.litCtx.drawImage(o.spr,Math.round(o.ox+i*o.cw-o.m),0);
    o.plein=plein;
    ctx.clearRect(0,0,o.W,o.H);
    ctx.drawImage(o.dim,0,0);
    ctx.drawImage(o.lit,0,0);
    if(a>0&&plein<o.cols){ctx.globalAlpha=0.25+0.75*a;ctx.drawImage(o.spr,Math.round(o.ox+plein*o.cw-o.m),0);ctx.globalAlpha=1;}   /* la colonne en cours monte en intensité */
  }

  function attacher(){
    var tubes=document.querySelectorAll('.aug-tube-v2'),n=0;
    for(var i=0;i<tubes.length;i++){
      var t=tubes[i],cv=t.querySelector(':scope>canvas.aug-led-cv-v1');
      if(!cv){
        cv=document.createElement('canvas');cv.className='aug-led-cv-v1';
        cv.setAttribute('data-morph-garder','');cv.setAttribute('data-morph-vivant','');cv.setAttribute('aria-hidden','true');
        t.appendChild(cv);
      }
      observer(cv);
      n++;
    }
    return n;
  }
  function image(ts){
    raf=0;
    if(document.hidden)return;
    var cvs=document.querySelectorAll('.aug-tube-v2>canvas.aug-led-cv-v1');
    if(!cvs.length)return;                                   /* plus de barre à l'écran : la boucle s'arrête, APRES_REDESSIN la relancera */
    {dernier=ts;var budget=performance.now()+8;for(var i=0;i<cvs.length;i++){if(!cvs[i].__vu)continue;if(performance.now()>budget)break;try{dessiner(cvs[i],cvs[i].parentNode);}catch(_e){}}}
    raf=requestAnimationFrame(image);
  }
  function lancer(){
    installerStyle();
    if(!attacher())return;
    if(!raf)raf=requestAnimationFrame(image);
  }
  (window.__SOREAL_IDLE_APRES_REDESSIN_V1__=window.__SOREAL_IDLE_APRES_REDESSIN_V1__||[]).push(function(){try{lancer();}catch(_e){}});
  document.addEventListener('visibilitychange',function(){if(!document.hidden)lancer();});
  window.addEventListener('resize',function(){var c=document.querySelectorAll('canvas.aug-led-cv-v1');for(var i=0;i<c.length;i++)c[i].__sigLed='';c[i].__ech=0;});
  window.__SOREAL_IDLE_AUG_LED_BARRES_V1__={lancer:lancer};
})();
