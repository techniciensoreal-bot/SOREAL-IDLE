/*
 * SOREAL IDLE — chargeur de modules à la demande (vague 1 de l'audit de cohérence 2026-11-09, front 5 : réduire le JavaScript chargé avant le premier affichage).
 *
 * Un module qui ne sert qu'à certains comptes (l'administrateur) n'est plus un <script defer> de index.html : il est listé dans la TABLE ci-dessous (lue dans index.html, élément
 * <script type="application/json" id="soreal-modules-differes-v1">) et chargé par `window.__SOREAL_IDLE_CHARGEUR_V1__.charger(nom)` quand on en a besoin.
 *
 *   table  : { nom de groupe : [adresse avec ?v=N, …] }. Les numéros ?v=N ne sont écrits QUE dans cette table : tools/maj-pins.mjs les suit et les monte comme ceux des <script> de la page,
 *            le service worker (sw-idle-v1.js) les précharge pour le hors ligne, l'audit d'architecture contrôle leur syntaxe. Le chargeur n'écrit jamais lui-même un numéro.
 *   charger(nom) -> Promise : une seule requête par fichier, jamais deux ; les appels simultanés partagent la même promesse ; les fichiers d'un groupe s'exécutent dans l'ordre de la table.
 *            En cas d'échec la promesse est rejetée, rien n'est mémorisé de faux (le fichier raté sera redemandé), et un nouvel essai n'est accepté qu'après DELAI_REESSAI_MS
 *            (sinon un rendu répété de la page relancerait la requête à chaque image).
 *   etat(nom) -> 'inconnu' | 'absent' | 'en-cours' | 'charge' | 'echec'.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_CHARGEUR_V1__)return;
  var DELAI_REESSAI_MS=4000;

  function lireTable(){
    try{
      var el=document.getElementById('soreal-modules-differes-v1');
      var t=el?JSON.parse(el.textContent||'{}'):{};
      return t&&typeof t==='object'?t:{};
    }catch(_e){return {};}
  }
  var table=lireTable();
  var fichiers={};    /* adresse -> { promesse, charge } */
  var groupes={};     /* nom -> { promesse, echecAt } */

  function chargerFichier(url){
    var f=fichiers[url];
    if(f)return f.promesse;
    f={charge:false};
    f.promesse=new Promise(function(ok,ko){
      var s=document.createElement('script');
      s.src=url;
      s.setAttribute('data-soreal-differe','1');   /* nouvelle-version-v1.js ignore ces scripts : index.html ne les liste pas */
      s.async=false;   /* l'ordre d'exécution est celui de l'insertion */
      s.onload=function(){f.charge=true;ok();};
      s.onerror=function(){
        delete fichiers[url];
        try{if(s.parentNode)s.parentNode.removeChild(s);}catch(_e){}
        ko(new Error('Chargement impossible : '+url));
      };
      (document.head||document.documentElement).appendChild(s);
    });
    fichiers[url]=f;
    return f.promesse;
  }

  function charger(nom){
    var liste=table[nom];
    if(!Array.isArray(liste))return Promise.reject(new Error('Groupe de modules inconnu : '+nom));
    var g=groupes[nom];
    if(g&&g.promesse)return g.promesse;
    if(g&&g.echecAt&&Date.now()-g.echecAt<DELAI_REESSAI_MS)return Promise.reject(new Error('Nouvel essai trop proche : '+nom));
    g=groupes[nom]={promesse:null,echecAt:0};
    g.promesse=Promise.all(liste.map(chargerFichier)).then(function(){return undefined;},function(e){
      g.promesse=null;g.echecAt=Date.now();
      throw e;
    });
    return g.promesse;
  }

  function etat(nom){
    var liste=table[nom];
    if(!Array.isArray(liste))return 'inconnu';
    var g=groupes[nom];
    if(g&&g.promesse){
      return liste.every(function(u){return fichiers[u]&&fichiers[u].charge;})?'charge':'en-cours';
    }
    return g&&g.echecAt?'echec':'absent';
  }

  window.__SOREAL_IDLE_CHARGEUR_V1__={charger:charger,table:table,etat:etat,DELAI_REESSAI_MS:DELAI_REESSAI_MS};
})();
