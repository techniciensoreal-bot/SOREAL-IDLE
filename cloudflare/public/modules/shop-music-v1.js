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

  /* Fondus par musique (ms). Blood Magic (Norman, 2026-10-04 : « elle doit commencer avec un long fade in, elle est trop brusque ») : 5 s à l'entrée, 1,5 s à la sortie ; le Shop garde 0,9 s. */
  var FONDU_DEFAUT={entree:900,sortie:900};
  /* Une musique par menu : data-menu de la page -> fichier R2. */
  var MUSIQUES=[
    {menu:'shop',cle:'idle/ambient/ShopMusic.opus',fondu:FONDU_DEFAUT},
    {menu:'sang',cle:'idle/ambient/BloodMagic.opus',fondu:{entree:5000,sortie:1500}}
  ].map(function(m){
    return {menu:m.menu,url:'/api/idle/media/ambient?key='+encodeURIComponent(m.cle),audio:null,fondu:0,cible:-1,duree:m.fondu};
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

  /*
   * Fondu en S (départ et arrivée très doux, pas de coup au démarrage) vers la cible, sur la durée propre à la musique et au sens (entrée / sortie). Un fondu déjà en cours vers la même cible n'est jamais relancé :
   * le battement de 500 ms rappelle demarrer_() tant qu'on est dans le menu, et relancer le fondu à chaque fois l'aurait raccourci (la musique atteignait son volume bien avant la durée prévue).
   */
  function fondreVers_(m,cible,apres){
    if(!m.audio)return;
    if(m.fondu&&m.cible===cible)return;
    var a=m.audio,depart=a.volume,debut=Date.now();
    var duree=Math.max(1,(cible>depart?m.duree.entree:m.duree.sortie)||900);
    if(m.fondu)cancelAnimationFrame(m.fondu);
    m.cible=cible;
    function pas(){
      var t=Math.min(1,(Date.now()-debut)/duree);
      var courbe=t*t*(3-2*t);
      try{a.volume=Math.max(0,Math.min(1,depart+(cible-depart)*courbe));}catch(_e){}
      if(t<1)m.fondu=requestAnimationFrame(pas);
      else{m.fondu=0;m.cible=-1;if(apres)apres();}
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
