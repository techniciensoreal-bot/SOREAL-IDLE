/*
 * SOREAL IDLE — interrupteur « Nuke automatique » sur la borne d'arcade (Norman, 2026-11-22 : « une possibilité de désactiver le nuke automatique. Un switch par exemple, sur la borne d'arcade »).
 * L'Auto Nuker (achat de la boutique Sellout) lance un Nuke tout seul sur les boss ; ce petit interrupteur de la tranche du pupitre le coupe ou le remet. Le choix est une préférence liée au COMPTE
 * (règle n°6 : clé localStorage soreal_idle_…, recopiée par prefs-compte-v1.js) ; la boucle de l'Auto Nuker (ui-amorcage-v1.js) la lit à chaque tour. Le bouton « Nuke » manuel n'est jamais touché.
 * Règle n°2 (anti-spoil) : l'interrupteur n'existe QUE si l'Auto Nuker est acheté.
 * Règle n°4 (redessin) : l'interrupteur fait partie du HTML du pupitre (ui-combat-2-v1.js) et son état vient de la préférence : un redessin le remet identique ; au clic seul son DOM est mis à jour.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_BORNE_NUKE_AUTO_V1__)return;
  var CLE='soreal_idle_auto_nuke_off_v1';

  function actif(){try{return localStorage.getItem(CLE)!=='1';}catch(_e){return true;}}
  function possede(j){
    var e=j||(window.__SOREAL_IDLE_REG__||{}).idleEtat;
    var a=e&&e.systemes&&e.systemes.selloutShop&&e.systemes.selloutShop.purchases;
    return Boolean(a&&Number(a.autoNuker)>0);
  }
  function titre(on){return on?'Nuke automatique : activé (clique pour le couper)':'Nuke automatique : coupé (clique pour le remettre)';}

  /* HTML de l'interrupteur pour le pupitre ; vide tant que l'Auto Nuker n'est pas acheté. */
  function boutonHtml(j){
    if(!possede(j))return '';
    var on=actif();
    return '<button type="button" class="bna-sw'+(on?' on':'')+'" role="switch" aria-checked="'+(on?'true':'false')+'" title="'+titre(on)+'" aria-label="Nuke automatique" onclick="window.__borneNukeAutoBasculerV1__(this)">'+
      '<span class="bna-rail"><span class="bna-levier"></span></span><span class="bna-txt">AUTO</span></button>';
  }

  function basculer(el){
    var on=!actif();
    try{if(on)localStorage.removeItem(CLE);else localStorage.setItem(CLE,'1');}catch(_e){}
    if(el){
      el.classList.toggle('on',on);
      el.setAttribute('aria-checked',on?'true':'false');
      el.setAttribute('title',titre(on));
    }
  }

  window.__borneNukeAutoBasculerV1__=basculer;
  window.__SOREAL_IDLE_BORNE_NUKE_AUTO_V1__={actif:actif,possede:possede,boutonHtml:boutonHtml,basculer:basculer};
})();
