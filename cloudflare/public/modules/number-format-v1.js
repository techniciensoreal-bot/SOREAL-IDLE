/* SOREAL IDLE — numeric display helpers extracted from the UI monolith. */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_NUMBER_FORMAT_V1__)return;
  function nombre(v){const n=Number(v);return Number.isFinite(n)?n:0;}
  function entier(v){return Math.max(0,Math.floor(nombre(v)));}
  /*
   * Unités des grands nombres. Les 31 premières sont les noms de l'échelle courte (K, M, B, T, Qa… jusqu'à Tg = 10^93) ; AU-DELÀ, des lettres : AA = 10^96, AB = 10^99, … AZ, puis BA… (Norman, 2026-10-25 : « j'aurais aimé ne pas avoir recours à e+96, des lettres à chaque fois »).
   * Une valeur qui tient dans un nombre à virgule flottante (< 1,8e308) a donc toujours une lettre, jamais « e+ ». Choix d'affichage de SOREAL, sans lien avec le jeu NGU Idle.
   */
  const NOMMEES=['','K','M','B','T','Qa','Qi','Sx','Sp','Oc','No','Dc','Ud','Dd','Td','Qad','Qid','Sxd','Spd','Ocd','Nod','Vg','Uvg','Dvg','Tvg','Qavg','Qivg','Sxvg','Spvg','Ocvg','Novg','Tg'];
  function lettres(i){return String.fromCharCode(65+Math.floor(i/26))+String.fromCharCode(65+i%26);}
  function suffixe(rang){
    if(rang<NOMMEES.length)return NOMMEES[rang]||'';
    const i=rang-NOMMEES.length;
    return i<676?lettres(i):null;
  }
  /* Rang d'une unité écrite (saisie « 30K », « 2aa ») : les noms d'abord, sans tenir compte de la casse ; puis les lettres, en majuscules (AA = 10^96). -1 si inconnue. */
  function rangDe(texte){
    const t=String(texte||'');
    if(!t)return 0;
    for(let r=1;r<NOMMEES.length;r+=1)if(NOMMEES[r].toLowerCase()===t.toLowerCase())return r;
    const m=/^([A-Za-z])([A-Za-z])$/.exec(t);
    if(m){const i=(m[1].toUpperCase().charCodeAt(0)-65)*26+(m[2].toUpperCase().charCodeAt(0)-65);return NOMMEES.length+i;}
    return -1;
  }
  function grandNombre(valeur,decimales){
    const n=nombre(valeur),abs=Math.abs(n);
    if(!Number.isFinite(n))return '∞';
    if(abs<1000)return decimales===undefined?String(Math.round(n)):n.toFixed(Math.max(0,entier(decimales))).replace(/\.0+$/,'').replace(/(\.\d*?)0+$/,'$1');
    const rang=Math.floor(Math.log10(abs)/3+1e-9);
    const unite=suffixe(rang);
    if(unite===null)return n.toExponential(2);
    const scaled=n/Math.pow(1000,rang);
    const d=decimales===undefined?(Math.abs(scaled)>=100?0:Math.abs(scaled)>=10?1:2):Math.max(0,entier(decimales));
    return scaled.toFixed(d).replace(/\.0+$/,'').replace(/(\.\d*?)0+$/,'$1')+unite;
  }
  function combat(valeur){
    const n=Math.max(0,nombre(valeur));
    if(n>=1000)return grandNombre(n);
    const dixieme=Math.round(n*10)/10;
    if(Math.abs(dixieme-Math.round(dixieme))<.001)return String(Math.round(dixieme));
    return dixieme.toFixed(1).replace('.',',');
  }
  /* Entier lisible (Norman, 2026-10-10 : « quand 1 million ne s'écrit pas 1M, écris-le 1.000.000 ») : points entre les milliers, pour les chiffres qui s'écrivent en entier (barres d'énergie, niveaux, quantités placées). */
  function entierLisible(valeur){
    const n=Math.floor(nombre(valeur)+1e-9);
    if(!Number.isFinite(n))return '∞';
    const signe=n<0?'-':'';
    const chiffres=String(Math.abs(n));
    if(/e/i.test(chiffres))return signe+chiffres;
    return signe+chiffres.replace(/\B(?=(\d{3})+(?!\d))/g,'.');
  }
  window.__SOREAL_IDLE_NUMBER_FORMAT_V1__={grandNombre,combat,entierLisible,suffixe,rangDe};
})();
