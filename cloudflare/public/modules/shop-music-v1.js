/*
 * SOREAL IDLE — musique du Shop (Norman, 2026-10-03) : « Quand on entre dans le Shop, il faut que idle/ambient/ShopMusic.opus soit joué en boucle tant qu'on y reste. Il doit s'additionner au
 * son déjà joué en fond du mode aventure. »
 *
 * Un élément <audio> à part, en boucle, qui se superpose aux sons d'ambiance d'Aventure (ambient-audio-v1.js, qui n'est ni coupé ni modifié). Fondu à l'entrée et à la sortie ; le niveau suit le
 * curseur « Ambiance » des Paramètres. Le fichier est servi par la route d'ambiance (clé idle/ambient/ShopMusic.opus) mais n'est jamais tiré au hasard comme son d'Aventure (idle-media-v1.js).
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_SHOP_MUSIC_V1__)return;
  window.__SOREAL_IDLE_SHOP_MUSIC_V1__=true;

  var URL_MUSIQUE='/api/idle/media/ambient?key='+encodeURIComponent('idle/ambient/ShopMusic.opus');
  var FONDU_MS=900;
  var audio=null;
  var fondu=0;

  function volume_(){
    var r=window.__SOREAL_IDLE_AUDIO_VOLUME_V1__;
    var v=r&&typeof r.getAmbiance==='function'?Number(r.getAmbiance()):0.35;
    return Math.max(0,Math.min(1,Number.isFinite(v)?v:0.35));
  }

  function dansLeShop_(){
    var racine=document.querySelector('.soreal-idle-page-root-v28');
    return Boolean(racine&&racine.getAttribute('data-menu')==='shop'&&!document.hidden);
  }

  function fondreVers_(cible,apres){
    if(!audio)return;
    var a=audio,depart=a.volume,debut=Date.now();
    if(fondu)cancelAnimationFrame(fondu);
    function pas(){
      var t=Math.min(1,(Date.now()-debut)/FONDU_MS);
      try{a.volume=Math.max(0,Math.min(1,depart+(cible-depart)*t));}catch(_e){}
      if(t<1)fondu=requestAnimationFrame(pas);
      else{fondu=0;if(apres)apres();}
    }
    pas();
  }

  function demarrer_(){
    if(audio&&!audio.paused){fondreVers_(volume_());return;}
    if(!audio){
      try{audio=new Audio(URL_MUSIQUE);}catch(_e){audio=null;return;}
      audio.loop=true;
      audio.preload='auto';
    }
    audio.volume=0;
    var p=audio.play();
    if(p&&typeof p.then==='function'){
      p.then(function(){if(dansLeShop_())fondreVers_(volume_());}).catch(function(){/* pas encore de geste de l'utilisateur : le prochain passage réessaie */});
    }else fondreVers_(volume_());
  }

  function arreter_(){
    if(!audio||audio.paused)return;
    var a=audio;
    fondreVers_(0,function(){if(!dansLeShop_()){try{a.pause();}catch(_e){}}});
  }

  setInterval(function(){if(dansLeShop_())demarrer_();else arreter_();},500);

  if(window.__SOREAL_IDLE_AUDIO_VOLUME_V1__&&typeof window.__SOREAL_IDLE_AUDIO_VOLUME_V1__.onChange==='function'){
    window.__SOREAL_IDLE_AUDIO_VOLUME_V1__.onChange(function(){if(audio&&!audio.paused&&dansLeShop_()&&!fondu)audio.volume=volume_();});
  }
})();
