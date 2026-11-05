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

  function dessiner(cv,tube){
    var w=tube.clientWidth,h=tube.clientHeight;if(!(w>0)||!(h>0))return;
    var dpr=cv.__ech||(cv.__ech=echelle(tube)),pas=mobile()?PAS_TEL:PAS_PC,cols=Math.max(8,Math.floor(w/pas)),rows=Math.max(3,Math.floor((h-2)/pas));
    var p=avancement(tube),col=couleur(tube),allume=p*cols;
    var sig=cols+'|'+rows+'|'+Math.round(allume*8)+'|'+col+'|'+dpr+'|'+w+'x'+h;
    if(cv.__sigLed===sig)return;
    cv.__sigLed=sig;
    var W=Math.round(w*dpr),H=Math.round(h*dpr);
    if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H;}
    var ctx=cv.getContext('2d'),c=rgb(col),cw=W/cols,ox=0,oy=(H-rows*cw)/2,r=cw*0.36,i,j,a;
    ctx.clearRect(0,0,W,H);
    /* points éteints : la trame reste visible, très sombre */
    ctx.fillStyle='rgba('+c[0]+','+c[1]+','+c[2]+',0.13)';
    for(i=0;i<cols;i++)for(j=0;j<rows;j++){ctx.beginPath();ctx.arc(ox+(i+0.5)*cw,oy+(j+0.5)*cw,r,0,6.2832);ctx.fill();}
    /* points allumés : couleur pleine, halo, reflet au centre ; la colonne en cours monte en intensité */
    for(i=0;i<cols;i++){
      a=Math.max(0,Math.min(1,allume-i));if(a<=0)continue;
      ctx.shadowColor='rgba('+c[0]+','+c[1]+','+c[2]+','+(0.9*a)+')';ctx.shadowBlur=cw*0.9;
      ctx.fillStyle='rgba('+c[0]+','+c[1]+','+c[2]+','+(0.25+0.75*a)+')';
      for(j=0;j<rows;j++){ctx.beginPath();ctx.arc(ox+(i+0.5)*cw,oy+(j+0.5)*cw,r*1.04,0,6.2832);ctx.fill();}
    }
    ctx.shadowBlur=0;
    for(i=0;i<cols;i++){
      a=Math.max(0,Math.min(1,allume-i));if(a<=0.4)continue;
      ctx.fillStyle='rgba(255,255,255,'+(0.35*a)+')';
      for(j=0;j<rows;j++){ctx.beginPath();ctx.arc(ox+(i+0.5)*cw-r*0.25,oy+(j+0.5)*cw-r*0.25,r*0.32,0,6.2832);ctx.fill();}
    }
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
    if(ts-dernier>=33){dernier=ts;var budget=performance.now()+6;for(var i=0;i<cvs.length;i++){if(!cvs[i].__vu)continue;if(performance.now()>budget)break;try{dessiner(cvs[i],cvs[i].parentNode);}catch(_e){}}}
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
