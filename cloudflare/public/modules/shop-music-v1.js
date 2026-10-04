/*
 * SOREAL IDLE — musiques de menu (Norman, 2026-10-03 : Shop ; 2026-10-04 : Blood Magic) :
 *  - « Quand on entre dans le Shop, il faut que idle/ambient/ShopMusic.opus soit joué en boucle tant qu'on y reste. Il doit s'additionner au son déjà joué en fond du mode aventure. »
 *  - « Quand on va dans le menu Blood, on doit entendre idle/ambient/BloodMagic.opus. Elle doit reprendre où elle s'était arrêtée quand on y retourne, avec un fade in et fade out quand on quitte. »
 *
 * Un élément <audio> PAR musique, en boucle, qui se superpose aux sons d'ambiance d'Aventure (ambient-audio-v1.js, qui n'est ni coupé ni modifié). Fondu à l'entrée et à la sortie ; à la sortie la musique est
 * mise en pause (jamais remise à zéro) : en revenant dans le menu elle reprend exactement là où elle s'était arrêtée. Le niveau suit le curseur « Ambiance » des Paramètres. Les fichiers sont servis par la route
 * d'ambiance (clés idle/ambient/ShopMusic.opus et idle/ambient/BloodMagic.opus) mais ne sont jamais tirés au hasard comme sons d'Aventure (idle-media-v1.js).
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_SHOP_MUSIC_V1__)return;
  window.__SOREAL_IDLE_SHOP_MUSIC_V1__=true;

  var FONDU_MS=900;
  /* Une musique par menu : data-menu de la page -> fichier R2. */
  var MUSIQUES=[
    {menu:'shop',cle:'idle/ambient/ShopMusic.opus'},
    {menu:'sang',cle:'idle/ambient/BloodMagic.opus'}
  ].map(function(m){
    return {menu:m.menu,url:'/api/idle/media/ambient?key='+encodeURIComponent(m.cle),audio:null,fondu:0};
  });

  function volume_(){
    var r=window.__SOREAL_IDLE_AUDIO_VOLUME_V1__;
    var v=r&&typeof r.getAmbiance==='function'?Number(r.getAmbiance()):0.35;
    return Math.max(0,Math.min(1,Number.isFinite(v)?v:0.35));
  }

  function menuCourant_(){
    if(document.hidden)return '';
    var racine=document.querySelector('.soreal-idle-page-root-v28');
    return racine?String(racine.getAttribute('data-menu')||''):'';
  }

  function dansLeMenu_(m){
    return menuCourant_()===m.menu;
  }

  function fondreVers_(m,cible,apres){
    if(!m.audio)return;
    var a=m.audio,depart=a.volume,debut=Date.now();
    if(m.fondu)cancelAnimationFrame(m.fondu);
    function pas(){
      var t=Math.min(1,(Date.now()-debut)/FONDU_MS);
      try{a.volume=Math.max(0,Math.min(1,depart+(cible-depart)*t));}catch(_e){}
      if(t<1)m.fondu=requestAnimationFrame(pas);
      else{m.fondu=0;if(apres)apres();}
    }
    pas();
  }

  function demarrer_(m){
    if(m.audio&&!m.audio.paused){fondreVers_(m,volume_());return;}
    if(!m.audio){
      try{m.audio=new Audio(m.url);}catch(_e){m.audio=null;return;}
      m.audio.loop=true;
      m.audio.preload='auto';
    }
    /* Position jamais remise à zéro : une musique mise en pause à la sortie reprend à l'endroit exact où elle s'était arrêtée. */
    m.audio.volume=0;
    var p=m.audio.play();
    if(p&&typeof p.then==='function'){
      p.then(function(){if(dansLeMenu_(m))fondreVers_(m,volume_());}).catch(function(){/* pas encore de geste de l'utilisateur : le prochain passage réessaie */});
    }else fondreVers_(m,volume_());
  }

  function arreter_(m){
    if(!m.audio||m.audio.paused)return;
    var a=m.audio;
    fondreVers_(m,0,function(){if(!dansLeMenu_(m)){try{a.pause();}catch(_e){}}});
  }

  setInterval(function(){
    MUSIQUES.forEach(function(m){
      if(dansLeMenu_(m))demarrer_(m);else arreter_(m);
    });
  },500);

  if(window.__SOREAL_IDLE_AUDIO_VOLUME_V1__&&typeof window.__SOREAL_IDLE_AUDIO_VOLUME_V1__.onChange==='function'){
    window.__SOREAL_IDLE_AUDIO_VOLUME_V1__.onChange(function(){
      MUSIQUES.forEach(function(m){if(m.audio&&!m.audio.paused&&dansLeMenu_(m)&&!m.fondu)m.audio.volume=volume_();});
    });
  }

  /* Pour les vérifications hors navigateur. */
  window.__SOREAL_IDLE_MUSIQUES_MENU_V1__={musiques:MUSIQUES.map(function(m){return {menu:m.menu,url:m.url};})};
})();
