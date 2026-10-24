/*
 * SOREAL IDLE — icônes d'objets selon la difficulté (Norman, 2026-10-24).
 *
 * Evil ("difficile") : icônes 3D dessin animé ; Sadistic ("extreme") : photos. Le serveur (APP, /api/idle/media/item et /boost) choisit le dossier R2 selon
 * `difficulty` et retombe sur l'image normale si elle manque. Les adresses des objets sont construites à de nombreux endroits : ce module ajoute
 * `&difficulty=…` à toute image d'objet ou de boost (propriété src, setAttribute, et images insérées en HTML), sans toucher aux autres images.
 * Sans difficulté Evil/Sadistic, rien ne change.
 *
 *   window.__SOREAL_IDLE_ITEM_DIFFICULTE_V1__ = { adapter, difficulte }
 */
(function(){
  'use strict';
  if(typeof window==='undefined'||window.__SOREAL_IDLE_ITEM_DIFFICULTE_V1__)return;

  var MOTIF=/^(\/api\/idle\/media\/(?:item|boost)\?)/;

  function difficulte(){
    try{
      var REG=window.__SOREAL_IDLE_REG__;
      var d=String(REG&&REG.idleEtat&&REG.idleEtat.systemes&&REG.idleEtat.systemes.difficulty||'');
      return d==='difficile'||d==='extreme'?d:'';
    }catch(_e){return '';}
  }

  /* Adresse enrichie, ou l'adresse reçue telle quelle si elle n'est pas une image d'objet ou si elle porte déjà une difficulté. */
  function adapter(src){
    var s=String(src==null?'':src);
    if(!MOTIF.test(s)||/[?&]difficulty=/.test(s))return s;
    var d=difficulte();
    return d?s+'&difficulty='+d:s;
  }

  window.__SOREAL_IDLE_ITEM_DIFFICULTE_V1__={adapter:adapter,difficulte:difficulte};

  try{
    var proto=window.HTMLImageElement&&window.HTMLImageElement.prototype;
    var desc=proto&&Object.getOwnPropertyDescriptor(proto,'src');
    if(desc&&desc.set){
      Object.defineProperty(proto,'src',{
        configurable:true,enumerable:desc.enumerable,
        get:desc.get,
        set:function(v){desc.set.call(this,adapter(v));}
      });
    }
    var setAttr=window.Element&&window.Element.prototype.setAttribute;
    if(setAttr){
      window.Element.prototype.setAttribute=function(nom,valeur){
        if(nom==='src'&&this instanceof window.HTMLImageElement)valeur=adapter(valeur);
        return setAttr.call(this,nom,valeur);
      };
    }
  }catch(_e){/* l'adaptation reste appelable à la main */}

  /* Images insérées en HTML (innerHTML) : le navigateur ne passe pas par le setter. On ne regarde que les nœuds ajoutés. */
  function corriger_(noeud){
    if(!noeud||noeud.nodeType!==1)return;
    var liste=noeud.tagName==='IMG'?[noeud]:noeud.querySelectorAll?noeud.querySelectorAll('img[src^="/api/idle/media/item?"],img[src^="/api/idle/media/boost?"]'):[];
    for(var i=0;i<liste.length;i++){
      var img=liste[i];
      var actuel=img.getAttribute('src')||'';
      var nouveau=adapter(actuel);
      if(nouveau!==actuel)img.src=nouveau;
    }
  }
  function demarrer_(){
    if(!window.MutationObserver||!document.body)return;
    new MutationObserver(function(lots){
      for(var i=0;i<lots.length;i++){
        var ajoutes=lots[i].addedNodes;
        for(var j=0;j<ajoutes.length;j++)corriger_(ajoutes[j]);
      }
    }).observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',demarrer_);
  else demarrer_();
})();
