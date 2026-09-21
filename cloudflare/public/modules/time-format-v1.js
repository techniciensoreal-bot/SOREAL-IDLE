/* SOREAL IDLE — time display helpers extracted from the UI monolith. */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_TIME_FORMAT_V1__)return;
  function nombre(v){const n=Number(v);return Number.isFinite(n)?n:0;}
  function entier(v){return Math.max(0,Math.floor(nombre(v)));}
  function duree(secondesTotal){
    const s=Math.max(0,entier(secondesTotal));
    const jours=Math.floor(s/86400),heures=Math.floor((s%86400)/3600),minutes=Math.floor((s%3600)/60),secondes=s%60;
    const deux=v=>String(v).padStart(2,'0');
    return (jours>0?jours+'j ':'')+deux(heures)+':'+deux(minutes)+':'+deux(secondes);
  }
  function runSecondes(j,maintenant){
    const debut=nombre(j&&j.renaissance&&j.renaissance.runDebuteA);
    if(!(debut>0))return 0;
    const now=maintenant===undefined?Date.now():nombre(maintenant);
    return Math.max(0,(now-debut)/1000);
  }
  function heures(v){const n=Math.max(0,nombre(v));return n.toFixed(n<10?2:1).replace('.',',')+' h';}
  window.__SOREAL_IDLE_TIME_FORMAT_V1__={duree,runSecondes,heures};
})();
