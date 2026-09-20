/*
 * SOREAL IDLE standalone auxiliary frontend module.
 * Migrated from SOREAL-APP/cloudflare/features/idle/basic-training-stability-v121.html
 * during standalone frontend cutover.
 */
(function(){
  'use strict';

  if(window.__SOREAL_IDLE_BASIC_TRAINING_STABILITY_V121__)return;
  window.__SOREAL_IDLE_BASIC_TRAINING_STABILITY_V121__=true;

  var revisionV121=0;
  var desiredV121=Object.create(null);
  var originalAdjustV121=null;
  var originalClearV121=null;
  var controlsPatchedV121=false;
  var bridgePatchedV121=false;
  var runtimeV121=null;
  var runtimeSubscribedV121=false;
  var allowNextSyncV121=0;
  var timerV121=0;

  function int_(value){
    var n=Number(String(value==null?'':value).replace(/[^0-9-]+/g,''));
    return Number.isFinite(n)?Math.max(0,Math.floor(n)):0;
  }

  function activeMenu_(){
    var active=document.querySelector('.soreal-idle-nav-button-v28.active');
    var code=String(active&&active.getAttribute('onclick')||'');
    var m=code.match(/__menuIdleV28__\(['\"]([^'\"]+)['\"]\)/);
    return m?m[1]:'';
  }

  function trainingActive_(){
    return activeMenu_()==='entrainement';
  }

  function input_(){
    return document.getElementById('sorealIdleTrainingInputV120');
  }

  function allocation_(id){
    var el=document.getElementById('sorealIdleBtAllocationV120_'+String(id||''));
    return int_(el&&el.textContent);
  }

  /*
   * Norman (2026-09-17) : "le bouton + ne fonctionne toujours pas."
   * Cause confirmée en direct : sorealIdleBtIdleV120 n'existe plus dans
   * le DOM depuis la refonte de la barre "Énergie d'entraînement" (voir
   * Soreal_Idle_UI.html, id désormais sorealIdleEnergieValeurV4) — cette
   * lecture renvoyait donc TOUJOURS 0, quelle que soit l'énergie
   * réellement disponible. callOriginalWithDelta_ bornait alors chaque
   * cible à l'allocation actuelle (jamais plus), rendant "+" silencieux
   * en permanence — ou pire, un "moins" involontaire si la valeur saisie
   * était inférieure à l'allocation déjà en place. Soreal_Idle_UI.html
   * expose maintenant sa vraie source de vérité (energieDisponibleIdleV9_,
   * déjà utilisée par la barre elle-même) : on la réutilise telle quelle
   * au lieu de dupliquer un calcul ou de gratter un texte DOM fragile.
   */
  function idleDisponible_(){
    if(typeof window.__energieDisponibleIdleV9__==='function'){
      return int_(window.__energieDisponibleIdleV9__());
    }
    var el=document.getElementById('sorealIdleBtIdleV120');
    return int_(el&&el.textContent);
  }

  function targetInput_(){
    var el=input_();
    return Math.max(1,int_(el&&el.value)||1);
  }

  /*
   * Norman (2026-09-17) : "Quand on met 125 par exemple dans l'énergie
   * qu'on veut dépenser et qu'on clique sur + il faut que ça ajoute 125
   * à la valeur déjà présente. Pas mettre le compteur à 125." Cause
   * confirmée : ce correctif (2026-09-17, plus haut) bornait "+" à une
   * CIBLE absolue (bounded=min(target,current+available)) au lieu d'un
   * AJOUT — alors que la vraie implémentation native
   * (ajusterBasicTrainingIdleV120_, Soreal_Idle_UI.html:718) a TOUJOURS
   * été additive : `cible=courant+min(input,idleAvant)`. La seule raison
   * d'être de ce fichier est de corriger le PLAFOND utilisé (la version
   * native borne par idleEtat.energie brut, qui peut sur-allouer entre
   * plusieurs compétences ; ici on borne par idleDisponible_(), l'énergie
   * VRAIMENT libre) — jamais de changer le sens du bouton. Redevenu
   * additif : le paramètre est désormais le delta demandé (le contenu du
   * champ input, tel quel), borné par l'énergie réellement disponible,
   * jamais par current+available.
   */
  function callOriginalWithDelta_(id,delta){
    if(typeof originalAdjustV121!=='function')return;

    var current=allocation_(id);
    var available=idleDisponible_();
    var bounded=Math.max(0,Math.min(int_(delta),available));
    if(bounded<=0)return;

    var field=input_();
    var oldValue=field?field.value:'';
    if(field)field.value=String(bounded);

    revisionV121+=1;
    try{
      originalAdjustV121(id,'plus');
    }finally{
      if(field)field.value=oldValue;
    }
    desiredV121[String(id||'')]=current+bounded;
  }

  function patchControls_(){
    if(controlsPatchedV121)return true;

    var adjust=window.__ajusterBasicTrainingIdleV120__;
    if(typeof adjust!=='function')return false;
    if(adjust.__sorealBasicTrainingStabilityV121){
      controlsPatchedV121=true;
      return true;
    }

    originalAdjustV121=adjust;
    var wrappedAdjust=function(id,action){
      action=String(action||'');

      /* La valeur saisie est une cible d'allocation, pas un delta cumulatif. */
      if(action==='plus'){
        callOriginalWithDelta_(id,targetInput_());
        return;
      }

      revisionV121+=1;
      var result=originalAdjustV121.apply(this,arguments);
      desiredV121[String(id||'')]=allocation_(id);
      return result;
    };
    wrappedAdjust.__sorealBasicTrainingStabilityV121=true;
    window.__ajusterBasicTrainingIdleV120__=wrappedAdjust;

    var clear=window.__viderBasicTrainingIdleV120__;
    if(typeof clear==='function'){
      originalClearV121=clear;
      var wrappedClear=function(){
        revisionV121+=1;
        desiredV121=Object.create(null);
        return originalClearV121.apply(this,arguments);
      };
      wrappedClear.__sorealBasicTrainingStabilityV121=true;
      window.__viderBasicTrainingIdleV120__=wrappedClear;
    }

    controlsPatchedV121=true;
    return true;
  }

  function cloneWithoutPlayer_(value){
    if(!value||typeof value!=='object')return value;
    var copy=Object.assign({},value);
    delete copy.joueur;
    return copy;
  }

  function patchBridge_(){
    if(bridgePatchedV121)return true;
    if(!window.google||!window.google.script)return false;

    var script=window.google.script;
    var descriptor=Object.getOwnPropertyDescriptor(script,'run');
    if(!descriptor||typeof descriptor.get!=='function')return false;
    if(descriptor.get.__sorealBasicTrainingStabilityV121){
      bridgePatchedV121=true;
      return true;
    }

    var originalGet=descriptor.get;
    var wrappedGet=function(){
      var base=originalGet.call(script);
      var success=null;
      var failure=null;
      var proxy=null;

      proxy=new Proxy({}, {
        get:function(_target,prop){
          if(prop==='withSuccessHandler'){
            return function(fn){
              success=typeof fn==='function'?fn:null;
              return proxy;
            };
          }

          if(prop==='withFailureHandler'){
            return function(fn){
              failure=typeof fn==='function'?fn:null;
              return proxy;
            };
          }

          if(prop==='then')return undefined;

          return function(){
            var args=Array.prototype.slice.call(arguments);
            var operation=String(prop||'');
            var revisionAtCall=revisionV121;
            var runner=base;

            runner=runner.withSuccessHandler(function(value){
              var delivered=value;

              if(
                operation==='definirAllocationsEntrainementSorealIdle' &&
                value&&value.ok
              ){
                if(revisionAtCall!==revisionV121){
                  delivered=cloneWithoutPlayer_(value);
                }
              }else if(
                operation==='synchroniserSorealIdle' &&
                trainingActive_() &&
                allowNextSyncV121<=0 &&
                value&&value.ok
              ){
                delivered=cloneWithoutPlayer_(value);
              }

              if(operation==='synchroniserSorealIdle'&&allowNextSyncV121>0){
                allowNextSyncV121-=1;
              }

              if(
                operation==='definirAllocationsEntrainementSorealIdle' &&
                (!value||!value.ok)
              ){
                allowNextSyncV121=Math.max(allowNextSyncV121,1);
              }

              if(success)success(delivered);
            });

            runner=runner.withFailureHandler(function(error){
              if(operation==='definirAllocationsEntrainementSorealIdle'){
                allowNextSyncV121=Math.max(allowNextSyncV121,1);
              }
              if(failure)failure(error);
            });

            var fn=runner[prop];
            if(typeof fn!=='function')return undefined;
            return fn.apply(runner,args);
          };
        }
      });

      return proxy;
    };

    wrappedGet.__sorealBasicTrainingStabilityV121=true;
    Object.defineProperty(script,'run',{
      configurable:descriptor.configurable!==false,
      enumerable:descriptor.enumerable!==false,
      get:wrappedGet
    });

    bridgePatchedV121=true;
    return true;
  }

  function subscribeRuntime_(){
    runtimeV121=window.__SOREAL_IDLE_RUNTIME_V1__||runtimeV121;
    if(
      runtimeSubscribedV121||
      !runtimeV121||
      typeof runtimeV121.onRender!=='function'
    )return false;

    runtimeV121.onRender(schedule_);
    runtimeSubscribedV121=true;
    return true;
  }

  function install_(){
    patchBridge_();
    patchControls_();
    subscribeRuntime_();
  }

  function schedule_(){
    clearTimeout(timerV121);
    timerV121=setTimeout(install_,40);
  }

  window.__SOREAL_IDLE_BASIC_TRAINING_STABILITY_V121_TEST__={
    activeMenu:activeMenu_,
    trainingActive:trainingActive_,
    allocation:allocation_,
    idleDisponible:idleDisponible_,
    getRevision:function(){return revisionV121;},
    runtimeSubscribed:function(){return runtimeSubscribedV121;}
  };

  install_();
  setTimeout(schedule_,300);
  setTimeout(schedule_,1100);
})();