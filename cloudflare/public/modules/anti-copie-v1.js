/*
 * SOREAL IDLE — « un vrai jeu, pas une page web » (Norman, 2026-10-04) : « un clic droit ne doit pas ouvrir le menu Windows dans le jeu ; on ne doit pas pouvoir copier-coller les textes. Ça donne une image de page internet. »
 *
 * - Pas de menu du navigateur au clic droit (ni appui long tactile) : l'événement « contextmenu » est annulé, SANS être stoppé : les gestes du jeu qui l'écoutent (clic droit sur un objet du sac = équiper / fusionner,
 *   maintien long) continuent de fonctionner.
 * - Pas de sélection ni de copie des textes : CSS user-select:none sur toute la page (voir index.html), plus « selectstart », « copy » et « cut » annulés.
 * - EXCEPTION : les champs où l'on SAISIT du texte (input, textarea, liste, zone modifiable : pseudo, chat, éditeurs de l'administrateur) gardent le menu, la sélection, copier, couper et coller : sans eux on ne pourrait
 *   plus écrire correctement.
 * Ce n'est pas une protection contre quelqu'un qui ouvre les outils du navigateur : seulement l'habillage d'un jeu, pas d'une page web.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_ANTI_COPIE_V1__)return;
  window.__SOREAL_IDLE_ANTI_COPIE_V1__=true;

  var SAISIE='input,textarea,select,[contenteditable=""],[contenteditable="true"],[data-copie-autorisee]';

  function cible_(ev){
    var t=ev&&ev.target;
    if(t&&t.nodeType===3)t=t.parentNode;
    return t&&t.closest?t:null;
  }
  function dansSaisie_(ev){
    var t=cible_(ev);
    return Boolean(t&&t.closest(SAISIE));
  }
  function selectionDansSaisie_(){
    try{
      var a=document.activeElement;
      return Boolean(a&&a.closest&&a.closest(SAISIE));
    }catch(_e){return false;}
  }

  document.addEventListener('contextmenu',function(ev){
    if(dansSaisie_(ev))return;
    ev.preventDefault();
  },true);

  document.addEventListener('selectstart',function(ev){
    if(dansSaisie_(ev))return;
    ev.preventDefault();
  },true);

  ['copy','cut'].forEach(function(type){
    document.addEventListener(type,function(ev){
      if(dansSaisie_(ev)||selectionDansSaisie_())return;
      ev.preventDefault();
      try{if(ev.clipboardData)ev.clipboardData.setData('text/plain','');}catch(_e){}
    },true);
  });
})();
