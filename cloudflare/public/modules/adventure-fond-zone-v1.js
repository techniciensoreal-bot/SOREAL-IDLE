/*
 * SOREAL IDLE — fond peint derrière le cadre de combat de chaque zone d'Aventure (Norman, 2026-10-26).
 *
 * Les 32 zones ont un fond (R2 : idle/backgrounds/adventure/<id de la zone>.webp, servi par /api/idle/media/adventure-zone?name=<id>). Il remplit tout le cadre
 * de combat (.soreal-idle-v79-adventure-scene) et passe derrière le monstre, les barres de vie et les cartes de statistiques : le décor de la zone est donc peint
 * sur les côtés, le centre reste calme. La barre de titre garde son fond. Zone sans fond (zone sûre, titans) : le cadre garde son apparence d'avant.
 *
 * adventure-scene-v79.js appelle appliquer(bloc, idDeLaZone) à chaque (re)création du cadre.
 *
 *   window.__SOREAL_IDLE_FOND_ZONE_V1__ = { appliquer, url, zones }
 */
(function(){
  'use strict';
  if(typeof window==='undefined'||window.__SOREAL_IDLE_FOND_ZONE_V1__)return;

  var ZONES={tutorial:1,sewers:1,forest:1,cave:1,sky:1,hsb:1,clock:1,'2d':1,ancient:1,avsp:1,mega:1,beardverse:1,badly:1,boring:1,chocolate:1,evilverse:1,pinkprincess:1,metaland:1,interdimensional:1,typozone:1,fadlands:1,jrpgville:1,radlands:1,backtoschool:1,westworld:1,breadverse:1,seventies:1,halloweenies:1,construction:1,duckduck:1,netherregions:1,aethereansea:1};
  var ID_STYLE='soreal-idle-fond-zone-v1-style';
  var VAR='--fond-zone-v1';
  /* Décors assombris (Norman, 2026-10-26 : « il faut assombrir les décors ») : un voile noir sur tout le fond, plus dense au centre pour que les barres et les cartes restent lisibles. */
  var VOILE='radial-gradient(ellipse at 50% 50%,rgba(4,6,14,.78) 0%,rgba(4,6,14,.62) 55%,rgba(4,6,14,.5) 100%)';

  /* Evil : fonds en 3D ; Sadistic : en photo (le serveur retombe sur le fond normal si absent). */
  function url(id){
    var d=window.__SOREAL_IDLE_ITEM_DIFFICULTE_V1__?window.__SOREAL_IDLE_ITEM_DIFFICULTE_V1__.difficulte():'';
    var base='/api/idle/media/adventure-zone?name='+encodeURIComponent(String(id||''))+(d?'&difficulty='+d:'');
    /* Thème d'images (theme-images-v1.js) : fond de base les 5 premières secondes, puis celui du thème ; Evil et Sadistic gardent leurs fonds. */
    var th=window.__SOREAL_IDLE_THEME_V1__;
    return th&&!d?th.habiller('fonds',id,base):base;
  }

  function style_(){
    if(document.getElementById(ID_STYLE))return;
    var s=document.createElement('style');s.id=ID_STYLE;
    /* Le thème de la page impose un dégradé brun en !important sur le cadre et sur l'arène : on le bat avec une règle plus précise, uniquement quand un fond existe. */
    var cadre='body.soreal-idle-active-v47 .soreal-idle-page-root-v28[data-menu="aventure"] .soreal-idle-v79-adventure-scene[data-fond-zone]';
    s.textContent=cadre+'{background-image:'+VOILE+',var('+VAR+')!important;background-size:cover!important;background-position:center!important;background-repeat:no-repeat!important;background-color:#150f08!important}'+
      cadre+' .soreal-idle-v79-arena{background:transparent!important}';
    document.head.appendChild(s);
  }

  function appliquer(bloc,id){
    id=String(id||'');
    if(!bloc||!bloc.style||ZONES[id]!==1)return false;
    style_();
    bloc.setAttribute('data-fond-zone',id);
    bloc.style.setProperty(VAR,'url("'+url(id)+'")');
    return true;
  }

  window.__SOREAL_IDLE_FOND_ZONE_V1__={appliquer:appliquer,url:url,zones:ZONES};
})();
