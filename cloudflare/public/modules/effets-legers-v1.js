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
  function actif(cle){try{return localStorage.getItem(cle)!=='0';}catch(_e){return true;}}
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
  style();appliquer();
  window.addEventListener('soreal-effets-v1',appliquer);
  /* le compte peut remettre les préférences APRÈS le chargement (prefs-compte-v1.js) */
  setInterval(function(){if(!document.hidden)appliquer();},3000);
  window.__SOREAL_IDLE_EFFETS_LEGERS_V1__={appliquer:appliquer,actif:actif};
})();
