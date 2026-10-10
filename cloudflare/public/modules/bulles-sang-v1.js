/*
 * SOREAL IDLE — bulles dans les barres de vie (Norman, 2026-10-10 : « dans la barre de vie du joueur et du boss, des bulles de temps en temps, plus foncées que la couleur de base, un peu comme des bulles dans le sang »).
 * Un calque de 6 bulles sombres est posé dans chaque barre de vie (celle du bandeau, celle du boss et celle du joueur dans le duel) ; les barres sont redessinées par la page, on le repose donc dès qu'il manque.
 * Les bulles naissent en fondu, montent un peu dans un seul sens, puis s'éteignent en fondu (opacité 0 au début et à la fin du cycle : aucune boucle imparfaite), chacune à son rythme, la plupart du temps invisibles.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_BULLES_SANG_V1__)return;
  /* Seulement la barre de vie du joueur en haut de l'écran et celles de Fight Boss (Norman, 2026-10-10 : « pas dans le reste du jeu »). */
  var BARRES='#sorealIdleHudPvBarV2,.soreal-idle-page-root-v28[data-menu="combat"] .soreal-idle-bossbar-v7,.soreal-idle-page-root-v28[data-menu="combat"] .soreal-idle-playerbar-v15';
  var HTML='<i class="sg-bulles-v1" aria-hidden="true"><b></b><b></b><b></b><b></b><b></b><b></b></i>';
  function poser_(){
    /* Nettoyage : un calque posé sur une barre qui n'est plus dans la liste (autre page) est retiré. */
    var vieux=document.querySelectorAll('.sg-bulles-v1');
    for(var v=0;v<vieux.length;v+=1){
      var h=vieux[v].parentElement;
      if(!h||!h.matches(BARRES)){h&&h.classList.remove('sg-hote-v1');vieux[v].remove();}
    }
    var liste=document.querySelectorAll(BARRES);
    for(var i=0;i<liste.length;i+=1){
      var el=liste[i];
      if(el.querySelector(':scope > .sg-bulles-v1'))continue;
      el.classList.add('sg-hote-v1');
      if(getComputedStyle(el).position==='static')el.style.position='relative';
      el.insertAdjacentHTML('beforeend',HTML);
    }
  }
  poser_();
  setInterval(poser_,700);
  window.__SOREAL_IDLE_BULLES_SANG_V1__={poser:poser_};
})();
