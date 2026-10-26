/*
 * SOREAL IDLE — bandes de la borne en PHASE (Norman, 2026-10-26 : « la jointure entre la barre du haut et celle du pupitre doit être parfaite, comme si du bas au haut ce n'était qu'une seule bande »).
 * Les bandes bleue et rouge de l'écran (pseudo-éléments), du pupitre (dessin SVG) et du corps de la borne (pseudo-éléments) pulsent avec la même animation (bnLuitB / bnLuitR, 3,2 s) mais démarrent à des instants différents : leur éclat différait
 * donc d'un morceau à l'autre. Ici toutes sont ramenées sur l'horloge du document (début à 0) : même phase, même éclat à chaque instant, aucune jointure visible. Rejoué après chaque redessin de la page (AGENTS.md règle n°4) et toutes les 4 s.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_BORNE_BANDES_SYNC_V1__)return;
  function synchroniser(){
    if(!document.querySelector('.borne-v2')||typeof document.getAnimations!=='function')return;
    try{
      document.getAnimations().forEach(function(a){
        var n=a.animationName;
        if((n==='bnLuitB'||n==='bnLuitR')&&a.startTime!==0)a.startTime=0;
      });
    }catch(_e){}
  }
  window.__SOREAL_IDLE_BORNE_BANDES_SYNC_V1__={synchroniser:synchroniser};
  (window.__SOREAL_IDLE_APRES_REDESSIN_V1__=window.__SOREAL_IDLE_APRES_REDESSIN_V1__||[]).push(synchroniser);
  setInterval(synchroniser,4000);
  setTimeout(synchroniser,600);
})();
