/*
 * Plafond d'une stat au niveau L, comme le jeu (Equipment::maxEquipBoost / boostEquip / mergeItem, lu dans l'IL, build 1260) : floor(cap x (1 + L/100)), calculé en float32. Même formule que le moteur
 * (idleAdventurePlafondNiveauV1, cloudflare/src/idle-adventure-base.js) : l'interface (fiches, boutons de boost, rangement automatique) affiche et teste le MÊME maximum que celui que le moteur applique.
 * Avant (2026-11-19) : valeur décimale (3,03 pour une Stick niveau 1 ; le jeu : 3).
 */
(function(){
  'use strict';
  window.__SOREAL_IDLE_PLAFOND_NIVEAU_V1__=function(plafond,niveau){
    var cap=Number(plafond);
    if(!(cap>0))return 0;
    var l=Math.fround(Math.max(0,Math.min(100,Math.trunc(Number(niveau)||0))));
    var q=Math.fround(1+Math.fround(l/100));
    return Math.floor(Math.fround(Math.fround(cap)*q));
  };
})();
