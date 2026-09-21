/* SOREAL IDLE — numeric display helpers extracted from the UI monolith. */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_NUMBER_FORMAT_V1__)return;
  function nombre(v){const n=Number(v);return Number.isFinite(n)?n:0;}
  function entier(v){return Math.max(0,Math.floor(nombre(v)));}
  function grandNombre(valeur,decimales){
    const n=nombre(valeur),abs=Math.abs(n);
    if(!Number.isFinite(n))return '∞';
    if(abs<1000)return decimales===undefined?String(Math.round(n)):n.toFixed(Math.max(0,entier(decimales))).replace(/\.0+$/,'').replace(/(\.\d*?)0+$/,'$1');
    const suffixes=['','K','M','B','T','Qa','Qi','Sx','Sp','Oc','No','Dc','Ud','Dd','Td','Qad','Qid'];
    const rang=Math.min(suffixes.length-1,Math.floor(Math.log10(abs)/3));
    if(rang>=suffixes.length-1)return n.toExponential(2);
    const scaled=n/Math.pow(1000,rang);
    const d=decimales===undefined?(Math.abs(scaled)>=100?0:Math.abs(scaled)>=10?1:2):Math.max(0,entier(decimales));
    return scaled.toFixed(d).replace(/\.0+$/,'').replace(/(\.\d*?)0+$/,'$1')+suffixes[rang];
  }
  function combat(valeur){
    const n=Math.max(0,nombre(valeur));
    if(n>=1000)return grandNombre(n);
    const dixieme=Math.round(n*10)/10;
    if(Math.abs(dixieme-Math.round(dixieme))<.001)return String(Math.round(dixieme));
    return dixieme.toFixed(1).replace('.',',');
  }
  window.__SOREAL_IDLE_NUMBER_FORMAT_V1__={grandNombre,combat};
})();
