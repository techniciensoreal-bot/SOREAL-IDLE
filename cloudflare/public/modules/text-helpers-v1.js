/* SOREAL IDLE — pure labels/text normalization extracted from UI monolith. */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_TEXT_HELPERS_V1__)return;
  function normaliserEffet(type){
    const t=String(type||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    if(['paralysie','paralyse','paralysis','electricite','electric'].includes(t))return 'paralysie';
    if(['gel','frost','freeze','froid','glace'].includes(t))return 'gel';
    if(['feu','fire','burn','brulure','brule'].includes(t))return 'feu';
    if(t==='poison')return 'poison';
    if(['stun','etourdissement','etourdi'].includes(t))return 'stun';
    if(['bouclier','shield','protection'].includes(t))return 'bouclier';
    return '';
  }
  function motDegat(valeur){const n=Number(valeur);return (Number.isFinite(n)?n:0)>1.0001?'dégâts':'dégât';}
  function nomDepuisCleR2(cle,zoneId){
    let base=String(cle||'').split('/').pop().replace(/\.[a-z0-9]+$/i,'');
    base=base.replace(/^Adv_\d+_/i,'');
    if(zoneId)base=base.replace(new RegExp('^'+zoneId+'_','i'),'');
    base=base.replace(/_boss$/i,'');
    return base.split('_').filter(Boolean).map(m=>m.charAt(0).toUpperCase()+m.slice(1)).join(' ')||'Créature';
  }
  function libelleRessource(id){
    if(id==='energy')return '⚡ Énergie';
    if(id==='magic')return '🔮 Magie';
    if(id==='r3')return '🧪 R3';
    return String(id||'');
  }
  window.__SOREAL_IDLE_TEXT_HELPERS_V1__={normaliserEffet,motDegat,nomDepuisCleR2,libelleRessource};
})();
