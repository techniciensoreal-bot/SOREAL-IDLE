/*
 * SOREAL IDLE — bruit de caisse enregistreuse à chaque achat (Norman, 2026-09-26).
 *
 * Point de passage unique : tout achat du jeu est un appel serveur (google.script.run). Ce module enveloppe `google.script.run` : quand un appel d'achat
 * revient RÉUSSI (`ok:true` — un achat refusé, faute de moyens par exemple, répond `ok:false` et reste muet), le son « purchase » est joué. Il n'y a donc aucun
 * appel à ajouter dans les dizaines de boutons d'achat, présents ou futurs ; il suffit de déclarer ici le nom de l'opération ou de l'action.
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_PURCHASE_SOUND_V1__)return;

/* Opérations serveur qui sont des achats. */
var OPERATIONS={
  acheterAmeliorationSorealIdle:1,acheterAmeliorationsSorealIdle:1,
  acheterEntrainementSorealIdle:1,acheterEntrainementsSorealIdle:1,
  acheterSortSorealIdle:1,acheterSortsSorealIdle:1,
  agrandirInventaireSorealIdle:1,agrandirInventairePlusieursSorealIdle:1
};
/* Actions de progression (agirProgressionSorealIdle) qui sont des achats. */
var ACTIONS={
  buyResource:1,buyNewbieOffer:1,buyPerk:1,buyQuirk:1,sellShopBuy:1,buyExpShop:1,richJerks:1,buyDigger:1,upgradeDigger:1,upgradeYggFruit:1
};

function estAchat(nom,args,resultat){
  if(!resultat||resultat.ok!==true)return false;
  if(OPERATIONS[nom])return true;
  if(nom==='agirProgressionSorealIdle'){
    var payload=Array.isArray(args)?args[1]:null;
    return Boolean(payload&&typeof payload==='object'&&ACTIONS[String(payload.action||'')]);
  }
  return false;
}

function jouer(){
  try{
    var audio=window.__SOREAL_IDLE_AUDIO_V199__;
    if(audio&&typeof audio.play==='function')audio.play('purchase');
  }catch(_){}
}

function envelopper(){
  var google=window.google;
  var script=google&&google.script;
  if(!script)return false;
  var descripteur=Object.getOwnPropertyDescriptor(script,'run');
  if(!descripteur||typeof descripteur.get!=='function'||descripteur.get.__sorealAchat)return Boolean(descripteur&&descripteur.get&&descripteur.get.__sorealAchat);
  var origine=descripteur.get;
  var nouveau=function(){
    var runner=origine.call(script);
    var succes=null;
    var proxy=new Proxy({},{
      get:function(_cible,prop){
        if(prop==='withSuccessHandler'){
          return function(fn){succes=typeof fn==='function'?fn:null;return proxy;};
        }
        if(prop==='withFailureHandler'){
          return function(fn){runner.withFailureHandler(fn);return proxy;};
        }
        if(prop==='then')return undefined;
        return function(){
          var args=Array.prototype.slice.call(arguments);
          var nom=String(prop);
          runner.withSuccessHandler(function(resultat){
            try{if(estAchat(nom,args,resultat))jouer();}catch(_){}
            if(succes)succes(resultat);
          });
          runner[nom].apply(runner,args);
          return proxy;
        };
      }
    });
    return proxy;
  };
  nouveau.__sorealAchat=true;
  Object.defineProperty(script,'run',{configurable:true,enumerable:true,get:nouveau});
  return true;
}

if(!envelopper()){
  /* Le pont google.script.run peut être posé un peu après : on réessaie brièvement. */
  var essais=0;
  var minuteur=setInterval(function(){if(envelopper()||++essais>40)clearInterval(minuteur);},100);
}

window.__SOREAL_IDLE_PURCHASE_SOUND_V1__={estAchat:estAchat,operations:Object.keys(OPERATIONS),actions:Object.keys(ACTIONS)};
})();
