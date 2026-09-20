/*
 * SOREAL IDLE standalone auxiliary frontend module.
 * Migrated from SOREAL-APP/cloudflare/features/idle/interaction-repair-v79.html
 * during standalone frontend cutover.
 */
(function(){
  'use strict';

  if(window.__SOREAL_IDLE_INTERACTION_REPAIR_V79__)return;
  window.__SOREAL_IDLE_INTERACTION_REPAIR_V79__=true;

  var runtime=window.__SOREAL_IDLE_RUNTIME_V1__||null;
  var bossWrapped=false;
  var timer=0;

  /*
   * Norman (2026-09-14) : le rustine Settings (renderSettings_/wrapMenu_)
   * qui vivait ici a été retirée — elle réécrivait le panneau Settings
   * en aval parce qu'à l'époque 'parametres' n'avait AUCUNE vraie page
   * (Soreal_Idle_UI.html retombait en silence sur Combat de Boss). La
   * vraie cause est corrigée à la source : contenuMenuIdleV28_ a
   * désormais un cas 'parametres' réel (pageParametresIdleV28_, avec le
   * même bouton de reset qu'ici avant). Garder ce patch en plus aurait
   * fait tourner DEUX rendus concurrents du même panneau.
   */

  function wrapBossStart_(){
    if(bossWrapped)return true;
    var original=window.__definirCombatBossIdleV39__;
    if(typeof original!=='function')return false;
    if(original.__sorealInteractionRepairV79){bossWrapped=true;return true;}

    var wrapped=function(actif){
      if(Boolean(actif)){
        var modal=document.getElementById('sorealIdleNouveauteModalV75');
        if(!modal&&typeof window.__fermerPopupNouveauteIdleV75__==='function'){
          try{window.__fermerPopupNouveauteIdleV75__();}catch(e){}
        }
      }
      return original.apply(this,arguments);
    };
    wrapped.__sorealInteractionRepairV79=true;
    window.__definirCombatBossIdleV39__=wrapped;
    bossWrapped=true;
    return true;
  }

  function repairBossButton_(state){
    var button=document.getElementById('sorealIdleBossStartV100');
    if(!button)return;
    var blocked=Boolean(state&&state.bossBloqueRenaissance);
    if(blocked){
      button.disabled=true;
      button.title='Ce boss exige une Renaissance avant de pouvoir être combattu.';
      return;
    }
    button.disabled=false;
    if(button.title&&/Renaissance/.test(button.title))button.title='';
  }

  function render_(){
    wrapBossStart_();

    runtime=window.__SOREAL_IDLE_RUNTIME_V1__||runtime;
    if(runtime&&runtime.getState){
      runtime.getState(false).then(function(state){
        repairBossButton_(state||null);
      }).catch(function(){});
    }
  }

  function schedule_(){
    clearTimeout(timer);
    timer=setTimeout(render_,50);
  }

  window.__SOREAL_IDLE_INTERACTION_REPAIR_V79_TEST__={
    repairBossButton:repairBossButton_
  };

  function init_(){
    runtime=window.__SOREAL_IDLE_RUNTIME_V1__||runtime;
    if(runtime&&runtime.onRender)runtime.onRender(schedule_);
    schedule_();
    setTimeout(schedule_,350);
    setTimeout(schedule_,1200);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init_,{once:true});
  else init_();
})();
