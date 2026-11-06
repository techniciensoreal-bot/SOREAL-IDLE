/*
 * SOREAL IDLE — cache des recherches d'éléments faites À CHAQUE IMAGE (plan, 2026-11-06).
 *
 *   window.__SOREAL_IDLE_EL_V1__ = { id(identifiant), sel(sélecteur) }   (même résultat que document.getElementById / document.querySelector)
 *
 * Mesuré (profil du fil principal du vrai jeu, menu Aventure) : getElementById / querySelector / querySelectorAll = 27 % du temps PROPRE du fil principal ; l'Entraînement de base cherchait 7 éléments par compétence à chaque image
 * alors que sa page n'était même pas affichée (tout renvoyait « absent »), le Combat cherchait ses boutons et son duel à chaque image. Même idée que le cache des Augmentations, rendue commune :
 *  - id() : recherche directe (voir plus bas pourquoi) ; sel() : élément TROUVÉ gardé tant qu'il est dans la page (isConnected), retrouvé s'il est remplacé ;
 *  - élément ABSENT : l'absence est mémorisée 120 ms au plus, et oubliée à chaque redessin de la page (AGENTS.md règle n°4 : liste window.__SOREAL_IDLE_APRES_REDESSIN_V1__) ;
 *    la page affichée ne manque donc jamais un élément plus de 120 ms (7 images) après son apparition.
 * Résultat strictement identique à la recherche directe, hors ces 120 ms.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_EL_V1__)return;
  /*
   * MESURÉ A/B sur le vrai jeu (2026-11-06) : document.getElementById est DÉJÀ très rapide (table d'identifiants) ; un cache d'identifiants ajoutait un appel au navigateur (isConnected) à chaque lecture et RALENTISSAIT le fil
   * principal (8,0 à 8,6 % d'activité contre 6,3 à 7,3 %). Seules les recherches par SÉLECTEUR (querySelector, qui parcourt la page) gagnent à être gardées. id() reste donc une recherche directe : les sites qui l'utilisent
   * gagnent seulement quand on évite la boucle entière (voir l'Entraînement de base : une seule recherche par rafraîchissement quand sa page n'est pas affichée).
   */
  var DELAI_ABSENT_MS=120,trouvesSel=new Map(),absentsSel=new Map();
  function id(identifiant){return document.getElementById(identifiant);}
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
  (window.__SOREAL_IDLE_APRES_REDESSIN_V1__=window.__SOREAL_IDLE_APRES_REDESSIN_V1__||[]).push(function(){absentsSel.clear();});
})();
