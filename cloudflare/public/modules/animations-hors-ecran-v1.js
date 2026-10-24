/*
 * SOREAL IDLE — le Coffre et la valise ne s'animent que lorsqu'on les voit (Norman, 2026-10-24 : journal du téléphone, 14 à 25 images/s, « 57 animations CSS en cours », 48 % du temps en rendu).
 * Leurs dizaines d'animations infinies (respiration, yeux, pattes, langue, anse…) sont recalculées et repeintes à chaque image même quand le cadre est loin hors de l'écran (page de plusieurs milliers de pixels
 * de haut). Un observateur d'intersection pose la classe « hors-ecran » sur le cadre quand il est à plus de 150 px de l'écran ; la feuille de style met alors toutes ses animations en pause (sans les
 * annuler : elles reprennent là où elles étaient). Aucun effet visible : on ne voit pas ce qui est hors de l'écran. Réduire les animations : déjà géré par les feuilles de style.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_ANIM_HORS_ECRAN_V1__)return;
  var STYLE_ID='soreal-idle-anim-hors-ecran-style';
  var CIBLE='.soreal-idle-coffre-v1';
  var obs=null,vu=null;
  function style(){
    if(document.getElementById(STYLE_ID))return;
    var s=document.createElement('style');s.id=STYLE_ID;
    s.textContent='html body.soreal-idle-active-v47.soreal-idle-active-v47 '+CIBLE+'.hors-ecran.hors-ecran *,html body.soreal-idle-active-v47.soreal-idle-active-v47 '+CIBLE+'.hors-ecran.hors-ecran *::before,html body.soreal-idle-active-v47.soreal-idle-active-v47 '+CIBLE+'.hors-ecran.hors-ecran *::after{animation-play-state:paused}';
    /* Pendant l'ouverture / fermeture du Coffre ou de la valise : tout le reste de la page est en pause (barre du haut ~36 animations, décors), seul le cadre s'anime (Norman, 2026-10-24 : « très peu de FPS »). */
    s.textContent+='html.soreal-anim-coffre body *:not(.soreal-idle-coffre-v1):not(.soreal-idle-coffre-v1 *),html.soreal-anim-coffre body *:not(.soreal-idle-coffre-v1):not(.soreal-idle-coffre-v1 *)::before,html.soreal-anim-coffre body *:not(.soreal-idle-coffre-v1):not(.soreal-idle-coffre-v1 *)::after{animation-play-state:paused}';
    (document.head||document.documentElement).appendChild(s);
  }
  var pauseT=0;
  function pause(ms){
    var h=document.documentElement;
    h.classList.add('soreal-anim-coffre');
    clearTimeout(pauseT);
    pauseT=setTimeout(function(){h.classList.remove('soreal-anim-coffre');},Math.max(200,Number(ms)||1800));
  }
  function observer(){
    var el=document.querySelector(CIBLE);
    if(el===vu)return;
    if(obs&&vu)try{obs.unobserve(vu);}catch(_e){}
    vu=el;
    if(!el)return;
    if(!obs&&typeof IntersectionObserver==='function'){
      obs=new IntersectionObserver(function(entrees){
        entrees.forEach(function(e){
          var c=e.target;
          if(c.classList.contains('hors-ecran')===e.isIntersecting)c.classList.toggle('hors-ecran',!e.isIntersecting);
        });
      },{rootMargin:'150px 0px 150px 0px'});
    }
    if(obs)obs.observe(el);
  }
  /* Le cadre est redessiné par le jeu : on suit l'élément courant (la classe est gardée au redessin par data-morph-classes-gardees posé au rendu). */
  style();
  setInterval(function(){if(!document.hidden)observer();},700);
  window.__SOREAL_IDLE_ANIM_HORS_ECRAN_V1__={observer:observer,pause:pause};
})();
