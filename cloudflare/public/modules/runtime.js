/*
 * SOREAL IDLE standalone auxiliary frontend module.
 * Migrated from SOREAL-APP/cloudflare/features/idle/runtime.html
 * during standalone frontend cutover.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_RUNTIME_V1__)return;

  var CACHE_MS=2000;
  var state=null,stateAt=0,statePromise=null;
  var renderSubscribers=new Set();
  var renderTimer=0;
  var observer=null;

  function token_(){
    try{if(typeof SOREAL_SESSION!=='undefined'&&SOREAL_SESSION)return String(SOREAL_SESSION).trim();}catch(e){}
    try{return String(window.SOREAL_SESSION||'').trim();}catch(e){return '';}
  }

  var attente=[];
  var ATTENTE_ETAT_MS=4000;

  function getState_(force){
    /*
     * Le moteur principal pousse déjà son état live via pushState_().
     * Ne jamais relire le serveur toutes les CACHE_MS à cause des mutations
     * DOM du ticker Fight Boss : cela créait un second moteur de synchro
     * toutes les ~2 s. Une lecture réseau n'est autorisée que si aucun état
     * principal n'a encore été reçu, ou si un appelant demande force=true.
     */
    if(!force&&state)return Promise.resolve(state);
    if(statePromise)return statePromise;
    /*
     * Au démarrage, le moteur principal lit déjà l'état et le pousse par pushState_ : lire le serveur une seconde fois en parallèle doublait l'appel (audit des appels, 2026-10-04).
     * Sans force, on attend donc l'état du moteur et on ne lit le serveur qu'après ATTENTE_ETAT_MS sans nouvelle.
     */
    if(!force){
      statePromise=new Promise(function(resolve){
        attente.push(resolve);
        setTimeout(function(){
          if(state){return;}
          var i=attente.indexOf(resolve);
          if(i===-1)return;
          attente.splice(i,1);
          lireServeur_().then(resolve);
        },ATTENTE_ETAT_MS);
      }).finally(function(){statePromise=null;});
      return statePromise;
    }
    return lireServeur_();
  }

  function lireServeur_(){
    var token=token_();
    if(!token||!window.google||!google.script||!google.script.run)return Promise.resolve(null);
    var lecture=new Promise(function(resolve){
      google.script.run
        .withSuccessHandler(function(res){
var joueur=res&&res.ok&&res.joueur?res.joueur:null;
if(joueur){state=joueur;stateAt=Date.now();}
resolve(joueur);
        })
        .withFailureHandler(function(){resolve(null);})
        .obtenirEtatSorealIdle(token);
    });
    statePromise=lecture.finally(function(){statePromise=null;});
    return statePromise;
  }

  function pushState_(joueur){
    if(joueur&&typeof joueur==='object'){
      state=joueur;stateAt=Date.now();
      if(attente.length)attente.splice(0,attente.length).forEach(function(resolve){resolve(joueur);});
    }
    schedule_();
  }

  function invalidate_(){state=null;stateAt=0;}

  function flush_(){
    renderTimer=0;
    renderSubscribers.forEach(function(fn){try{fn();}catch(e){console.warn('SOREAL IDLE render subscriber',e);}});
  }

  function schedule_(){
    if(renderTimer)return;
    renderTimer=setTimeout(flush_,70);
  }

  function onRender_(fn){
    if(typeof fn!=='function')return function(){};
    renderSubscribers.add(fn);
    setTimeout(function(){try{fn();}catch(e){var D=window.__SOREAL_IDLE_DIAG_V1__;if(D&&D.signaler)D.signaler('runtime_differe',e);}},0);
    return function(){renderSubscribers.delete(fn);};
  }

  function avecElement_(noeuds){
    for(var k=0;k<noeuds.length;k++)if(noeuds[k].nodeType===1)return true;
    return false;
  }

  function observe_(){
    var host=document.getElementById('app')||document.body;
    if(!host){setTimeout(observe_,0);return;}
    observer=new MutationObserver(function(mutations){
      var active=(typeof PAGE_ACTIVE!=='undefined'&&PAGE_ACTIVE==='idle')||Boolean(document.querySelector('.soreal-idle-page-root-v28'));
      if(!active)return;
      /* Seuls les ajouts / retraits d'éléments comptent : les chiffres des barres et des tuiles (texte remplacé ~25 fois par seconde) ne relancent plus tous les abonnés (audit, 2026-10-04). */
      for(var i=0;i<mutations.length;i++){
        if(mutations[i].type==='childList'&&(avecElement_(mutations[i].addedNodes)||avecElement_(mutations[i].removedNodes))){schedule_();break;}
      }
    });
    observer.observe(host,{childList:true,subtree:true});
    document.addEventListener('visibilitychange',function(){if(document.visibilityState!=='hidden')schedule_();});
    schedule_();
  }

  window.__SOREAL_IDLE_RUNTIME_V1__={
    getState:getState_,pushState:pushState_,invalidate:invalidate_,onRender:onRender_,schedule:schedule_,cacheMs:CACHE_MS
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observe_,{once:true});else observe_();
})();
