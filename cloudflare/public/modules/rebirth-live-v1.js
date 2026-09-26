/*
 * SOREAL IDLE — Rebirth : le Rebirth Time Factor, le NUMBER au Rebirth et la Variation suivent l'horloge du run en direct (Norman, 2026-09-26, comparaison
 * côte à côte avec NGU : le panneau montrait le facteur du dernier rafraîchissement serveur — 0,376 alors que le chrono affichait déjà 45:21 ; NGU : 0,378).
 * Le serveur calcule toujours le vrai NUMBER au moment du Rebirth ; ceci ne change que l'affichage. Formule identique à idleNguRebirthTimeFactor
 * (idle-ngu-progression.js, wiki Rebirths : « Rebirth Time Factor Jumps »), verrouillée par un test.
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_REBIRTH_LIVE_V1__)return;

function nb(v){var n=Number(v);return Number.isFinite(n)?n:0;}

function facteurTemps(secondes){
  var m=Math.max(0,nb(secondes))/60;
  if(m<2)return Math.max(1e-300,m/1989672960);
  if(m<3)return m/31088640;
  if(m<4)return m/971520;
  if(m<5)return m/122880;
  if(m<7)return m/30720;
  if(m<10)return m/7680;
  if(m<12)return m/1920;
  if(m<15)return m/480;
  if(m<30)return m/240;
  if(m<60)return m/120;
  return 1+m/(60*24*2);
}

function grand(v,d){
  var api=window.__SOREAL_IDLE_NUMBER_FORMAT_V1__;
  return api&&typeof api.grandNombre==='function'?api.grandNombre(v,d):String(Math.round(nb(v)));
}

function valeurDe(bloc,libelle){
  var labels=bloc.querySelectorAll('.soreal-idle-rebirth-stat-label-v14');
  for(var i=0;i<labels.length;i++){
    if(labels[i].textContent.trim()===libelle){
      var v=labels[i].parentElement&&labels[i].parentElement.querySelector('.soreal-idle-rebirth-stat-value-v14');
      if(v)return v;
    }
  }
  return null;
}

function maj(){
  var bloc=document.getElementById('sorealIdleBlocRenaissanceV27');
  if(!bloc)return;
  var etat=typeof window.__SOREAL_IDLE_LIRE_ETAT_V1__==='function'?window.__SOREAL_IDLE_LIRE_ETAT_V1__():null;
  var temps=window.__SOREAL_IDLE_TIME_FORMAT_V1__;
  var meta=etat&&etat.systemes&&etat.systemes.rebirth;
  if(!meta||!meta.preview||!temps||typeof temps.runSecondes!=='function')return;
  var ancien=nb(meta.preview.currentTimeFactor);
  var secondes=temps.runSecondes(etat);
  if(!(ancien>0)||!(secondes>0))return;
  var nouveau=facteurTemps(secondes);
  var actuel=Math.max(1,nb(meta.number||(etat.renaissance&&etat.renaissance.number)||1));
  var prochain=Math.max(1,nb(meta.nextNumber||(etat.renaissance&&etat.renaissance.nextNumber)||actuel)*nouveau/ancien);
  var a=valeurDe(bloc,'Rebirth Time Factor');if(a)a.textContent='×'+grand(nouveau,4);
  var b=valeurDe(bloc,'NUMBER au Rebirth');if(b)b.textContent=grand(prochain);
  var c=valeurDe(bloc,'Variation');if(c)c.textContent='×'+(prochain/actuel).toFixed(3);
}

setInterval(maj,1000);
window.__SOREAL_IDLE_REBIRTH_LIVE_V1__={facteurTemps:facteurTemps,maj:maj};
})();
