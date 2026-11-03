/*
 * SOREAL IDLE — drapeaux de menu sur <body> (audit de fluidité 2026-11-03, MESURÉ : navigateur à processeur x4, menu Combat de boss).
 * Les thèmes de couleur (--th-*) étaient choisis par `.soreal-idle-native-v4:has(.soreal-idle-page-root-v28[data-menu="X"])` (22 règles). Chaque insertion ou retrait d'un nœud sous le conteneur du jeu obligeait le navigateur à
 * réévaluer ces :has() puis à recalculer le style de TOUT le sous-arbre (~870 éléments, 100 ms par recalcul à processeur x4, 58 recalculs en 10 s = 5,9 s sur 10 s). Sans ces règles : 1,6 s sur 10 s, 3 fois plus d'images par seconde.
 * Maintenant : ce module recopie sur <body> quatre attributs (data-sj-menu, data-sj-onglet, data-sj-chr, data-sj-shopap) et les feuilles de style lisent `body[data-sj-menu="X"] .soreal-idle-native-v4`. Aucun :has().
 * Aucun clignotement : un MutationObserver s'exécute en micro-tâche, avant le calcul de style et le dessin de l'image qui suit la modification ; un attribut n'est réécrit que si sa valeur change.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_MENU_DRAPEAUX_V1__)return;
  var etat={menu:null,onglet:null,chr:null,shopap:null};
  function poser(nom,cle,valeur){
    if(etat[cle]===valeur)return;
    etat[cle]=valeur;
    try{if(valeur===''||valeur===null)document.body.removeAttribute(nom);else document.body.setAttribute(nom,valeur);}catch(_e){}
  }
  function calculer(){
    var b=document.body;if(!b)return;
    var racine=document.querySelector('.soreal-idle-page-root-v28[data-menu]');
    var menu=racine?String(racine.getAttribute('data-menu')||''):'';
    poser('data-sj-menu','menu',menu);
    var ong=document.querySelector('.soreal-idle-chroniques-onglet-v1.actif[data-onglet]');
    poser('data-sj-onglet','onglet',ong?String(ong.getAttribute('data-onglet')||''):'');
    poser('data-sj-chr','chr',document.querySelector('.chr-v1')?'1':'');
    poser('data-sj-shopap','shopap',(menu==='shop'&&racine&&racine.querySelector('.soreal-idle-shop-ap-v1'))?'1':'');
  }
  var planifie=false;
  function surMutation(){
    if(planifie)return;
    planifie=true;
    /* même tâche : la micro-tâche précède le prochain calcul de style */
    Promise.resolve().then(function(){planifie=false;calculer();});
  }
  function demarrer(){
    calculer();
    try{
      var o=new MutationObserver(surMutation);
      o.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-menu','data-onglet','class']});
    }catch(_e){}
  }
  if(document.body)demarrer();else document.addEventListener('DOMContentLoaded',demarrer);
  window.__SOREAL_IDLE_MENU_DRAPEAUX_V1__={calculer:calculer,etat:etat};
})();
