/*
 * SOREAL IDLE — fond de la page « Fight Boss » sur PC (Norman, 2026-10-26) : une salle d'arcade en perspective, point de fuite au centre, DERRIÈRE la borne (qui cache la bande du milieu). Image FondFightBoss.webp (1389 x 1132, ratio du cadre mesuré à 1920 x 1080 : 1348 x 1092),
 * stockée dans R2 sous idle/banners/ et servie par /api/idle/media/banner. Remplit tout le cadre de la page (couverture, centrée) ; léger voile sombre pour garder les chiffres lisibles. Téléphone : fond d'origine (largeur de fenêtre inférieure à 1100 px).
 * Le style est posé ici (et non dans les feuilles de style) : il remplace le fond d'origine du cadre « combat » sans ajouter de !important aux feuilles (plafond du test d'audit).
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_FOND_COMBAT_V1__)return;
  window.__SOREAL_IDLE_FOND_COMBAT_V1__=true;
  var s=document.createElement('style');
  s.id='soreal-idle-fond-combat-v1';
  s.textContent='@media (min-width:1100px){html body.soreal-idle-active-v47.soreal-idle-active-v47 .soreal-idle-page-root-v28[data-menu="combat"]{background:linear-gradient(rgba(6,8,18,.16),rgba(6,8,18,.16)),url("/api/idle/media/banner?name=FondFightBoss.webp") center/cover no-repeat,#0a0d18!important;}}';
  (document.head||document.documentElement).appendChild(s);
})();
