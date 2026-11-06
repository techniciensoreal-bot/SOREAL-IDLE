/*
 * SOREAL IDLE — cache des recherches d'éléments faites À CHAQUE IMAGE (plan, 2026-11-06).
 *
 *   window.__SOREAL_IDLE_EL_V1__ = { id(identifiant), sel(sélecteur) }   (même résultat que document.getElementById / document.querySelector)
 *
 * Mesuré (profil du fil principal du vrai jeu, menu Aventure) : getElementById / querySelector / querySelectorAll = 27 % du temps PROPRE du fil principal ; l'Entraînement de base cherchait 7 éléments par compétence à chaque image
 * alors que sa page n'était même pas affichée (tout renvoyait « absent »), le Combat cherchait ses boutons et son duel à chaque image. Même idée que le cache des Augmentations, rendue commune :
 *  - élément TROUVÉ : gardé tant qu'il est dans la page (isConnected) ; un redessin qui le remplace le fait retrouver ;
 *  - élément ABSENT : l'absence est mémorisée 120 ms au plus, et oubliée à chaque redessin de la page (AGENTS.md règle n°4 : liste window.__SOREAL_IDLE_APRES_REDESSIN_V1__) ;
 *    la page affichée ne manque donc jamais un élément plus de 120 ms (7 images) après son apparition.
 * Résultat strictement identique à la recherche directe, hors ces 120 ms.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_EL_V1__)return;
  /* Aucune allocation par appel (mesuré : une première version, avec fermeture et clé concaténée, coûtait autant que les recherches qu'elle remplaçait) : deux tables par type de recherche, l'horloge n'est lue qu'en cas d'absence. */
  var DELAI_ABSENT_MS=120,trouvesId=new Map(),absentsId=new Map(),trouvesSel=new Map(),absentsSel=new Map();
  function id(identifiant){
    var e=trouvesId.get(identifiant);
    if(e!==undefined){if(e.isConnected)return e;trouvesId.delete(identifiant);}
    var t=absentsId.get(identifiant);
    if(t!==undefined&&performance.now()-t<DELAI_ABSENT_MS)return null;
    e=document.getElementById(identifiant);
    if(e){trouvesId.set(identifiant,e);absentsId.delete(identifiant);return e;}
    absentsId.set(identifiant,performance.now());return null;
  }
  function sel(selecteur){
    var e=trouvesSel.get(selecteur);
    if(e!==undefined){if(e.isConnected)return e;trouvesSel.delete(selecteur);}
    var t=absentsSel.get(selecteur);
    if(t!==undefined&&performance.now()-t<DELAI_ABSENT_MS)return null;
    e=document.querySelector(selecteur);
    if(e){trouvesSel.set(selecteur,e);absentsSel.delete(selecteur);return e;}
    absentsSel.set(selecteur,performance.now());return null;
  }
  window.__SOREAL_IDLE_EL_V1__={id:id,sel:sel,DELAI_ABSENT_MS:DELAI_ABSENT_MS};
  (window.__SOREAL_IDLE_APRES_REDESSIN_V1__=window.__SOREAL_IDLE_APRES_REDESSIN_V1__||[]).push(function(){absentsId.clear();absentsSel.clear();});
})();
