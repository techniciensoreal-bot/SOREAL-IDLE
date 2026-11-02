/*
 * SOREAL IDLE — effets visuels allégeables (Norman, 2026-10-24). Journal du téléphone (Android 10, ×3) : 20 à 25 images/s PARTOUT, même dans les Réglages, alors que les images sont courtes côté script / style / rendu (quelques ms) :
 * le goulot est le dessin par la carte graphique. Le point commun de toutes les pages est la barre du haut (une quarantaine d'animations avec halos : cercles des nouveautés, battements, étoiles du bouton Renaissance) et les décors des cadres.
 * Deux réglages dans Réglages > Effets visuels, actifs par défaut (aucun changement d'affichage), mémorisés sur le compte (clé soreal_idle_effet_*, règle n°6) :
 *   - « Animations du menu du haut » : décoché, les boutons du menu gardent leur dessin mais ne s'animent plus ;
 *   - « Décors animés des cadres » : décoché, les torches des cadres, les bulles des barres et les particules des lignes actives se figent.
 * Une classe sur <html> (soreal-nav-calme / soreal-decor-calme) ; la feuille ne fait que couper `animation` : aucune valeur de jeu n'est touchée.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_EFFETS_LEGERS_V1__)return;
  var CLES={nav:'soreal_idle_effet_nav_v1',decor:'soreal_idle_effet_decor_v1'};
  var CLASSES={nav:'soreal-nav-calme',decor:'soreal-decor-calme'};
  /* Application Android hors ligne (Norman, 2026-11-01 : fluidité très inférieure à l'ancienne application) : réglé « léger » par défaut TANT QUE le joueur n'a rien choisi (règle n°6 : un choix posé, '1' ou '0', l'emporte). Web et exe : inchangés. */
  var EST_APK=(function(){try{return typeof window.AndroidSoreal!=='undefined'&&window.AndroidSoreal!==null;}catch(_e){return false;}})();
  function defautPour(){return !EST_APK;}
  function actif(cle){try{var v=localStorage.getItem(cle);return v===null?defautPour():v!=='0';}catch(_e){return defautPour();}}
  function style(){
    if(document.getElementById('soreal-idle-effets-legers-style'))return;
    var s=document.createElement('style');s.id='soreal-idle-effets-legers-style';
    var N='html.soreal-nav-calme body.soreal-idle-active-v47 .soreal-idle-nav-v28';
    var D='html.soreal-decor-calme body.soreal-idle-active-v47';
    s.textContent=
      N+' *,'+N+' *::before,'+N+' *::after,'+N+'{animation:none!important}'+
      D+' .soreal-idle-page-root-v28[data-menu]::before,'+D+' .soreal-idle-page-root-v28[data-menu]::after,'+
      D+' .soreal-idle-bulles-v2,'+D+' .soreal-idle-bulles-v2::before,'+D+' .soreal-idle-bulles-v2::after,'+
      D+' .part-v1 i{animation:none!important}';
    (document.head||document.documentElement).appendChild(s);
  }
  function appliquer(){
    var h=document.documentElement;
    Object.keys(CLES).forEach(function(k){h.classList.toggle(CLASSES[k],!actif(CLES[k]));});
  }
  /*
   * Mode économe commun (audit fluidité 2026-11-02, docs/AUDIT-ANDROID-FLUIDITE-2026-11-01.md §4) : classe soreal-mode-eco sur <html>, posée au chargement du module quand l'application Android existe OU sur un appareil tactile
   * à petit écran / peu de cœurs. Elle ne change AUCUN affichage : seulement la réactivité du toucher (pas de délai de double-tap, pas de halo gris au toucher, pas de rebond de page). Les autres modules peuvent la lire
   * (document.documentElement.classList.contains('soreal-mode-eco')) pour espacer leurs minuteries.
   */
  function appareilEconome(){
    try{
      if(EST_APK)return true;
      var tactile=(navigator.maxTouchPoints||0)>0||('ontouchstart' in window);
      if(!tactile)return false;
      var petit=Math.min(window.innerWidth||9999,window.innerHeight||9999)<=700;
      var faible=Number(navigator.hardwareConcurrency||8)<=6;
      return petit||faible;
    }catch(_e){return false;}
  }
  try{
    if(appareilEconome()){
      document.documentElement.classList.add('soreal-mode-eco');
      var se=document.createElement('style');se.id='soreal-idle-mode-eco-style';
      se.textContent='html.soreal-mode-eco{-webkit-tap-highlight-color:transparent;overscroll-behavior:none}html.soreal-mode-eco body{touch-action:manipulation}';
      (document.head||document.documentElement).appendChild(se);
    }
  }catch(_e){}
  style();appliquer();
  window.addEventListener('soreal-effets-v1',appliquer);
  /* le compte peut remettre les préférences APRÈS le chargement (prefs-compte-v1.js) */
  setInterval(function(){if(!document.hidden)appliquer();},3000);
  window.__SOREAL_IDLE_EFFETS_LEGERS_V1__={appareilEconome:appareilEconome,appliquer:appliquer,actif:actif,defautPour:defautPour};
})();
