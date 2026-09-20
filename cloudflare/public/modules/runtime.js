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
    try{return String(window.SOREAL_SESSION||localStorage.getItem('soreal_session_v6b')||'').trim();}catch(e){return '';}
  }

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
    var token=token_();
    if(!token||!window.google||!google.script||!google.script.run)return Promise.resolve(null);
    statePromise=new Promise(function(resolve){
      google.script.run
        .withSuccessHandler(function(res){
var joueur=res&&res.ok&&res.joueur?res.joueur:null;
if(joueur){state=joueur;stateAt=Date.now();}
resolve(joueur);
        })
        .withFailureHandler(function(){resolve(null);})
        .obtenirEtatSorealIdle(token);
    }).finally(function(){statePromise=null;});
    return statePromise;
  }

  function pushState_(joueur){
    if(joueur&&typeof joueur==='object'){state=joueur;stateAt=Date.now();}
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
    setTimeout(function(){try{fn();}catch(e){}},0);
    return function(){renderSubscribers.delete(fn);};
  }

  function observe_(){
    var host=document.getElementById('app')||document.body;
    if(!host){setTimeout(observe_,0);return;}
    observer=new MutationObserver(function(mutations){
      var active=(typeof PAGE_ACTIVE!=='undefined'&&PAGE_ACTIVE==='idle')||Boolean(document.querySelector('.soreal-idle-page-root-v28'));
      if(!active)return;
      for(var i=0;i<mutations.length;i++){
        if(mutations[i].type==='childList'){schedule_();break;}
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
