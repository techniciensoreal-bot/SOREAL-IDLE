/*
 * SOREAL IDLE — journal de fluidité : sauts de mise en page et redessins du Coffre / de la valise (Norman, 2026-10-23 : « sur téléphone ça redessine à mort, énormément de sauts »).
 * Ajoute au journal existant (Réglages > « 🩺 Journal de fluidité », modules/diag-fluidite-v1.js ; tout reste sur l'appareil) deux sortes de lignes :
 *   - saut_page       : un « layout shift » du navigateur (hors saisie du joueur) : sa valeur et les éléments qui ont bougé (de y à y). Navigateurs sans cette mesure (Safari iPhone) : voir hauteur_page ;
 *   - hauteur_page    : la hauteur de la page change d'au moins 60 px (d'où à où, et le menu ouvert) ;
 *   - redessin_coffre : le cadre du Coffre ou la valise est REMPLACÉ(E) par un nouvel élément (au lieu d'être mis à jour sur place) : n = nombre cumulé, ms = temps depuis le précédent.
 * Copier le journal après une minute de jeu sur le téléphone suffit pour savoir QUI redessine et QUOI saute.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_DIAG_COFFRE_V1__)return;
  /* Contexte de chaque ligne (Norman, 2026-10-24) : le journal ne garde qu'une ligne par clé toutes les 5 s, donc chaque ligne porte un numéro dans sa clé, l'état du Coffre / de la valise, la position de défilement et le dernier toucher (cible, il y a combien de temps). */
  var seq=0,dernierToucher={cible:'-',t:0};
  function etatCoffre(){
    var c=document.querySelector('.soreal-idle-coffre-v1'),v=document.querySelector('.vl-section');
    return {coffre:c?(c.classList.contains('ouvert')?'ouvert':'ferme')+(c.classList.contains('ferme-anim')?'+ferme-anim':'')+(c.classList.contains('ouvre')?'+ouvre':'')+(c.classList.contains('hors-ecran')?'+hors-ecran':''):'-',valise:v?(v.classList.contains('vl-ouverte')?'ouverte':'fermee')+(v.classList.contains('vl-anim')?'+anim':''):'-',defil:Math.round(window.scrollY||0),toucher:dernierToucher.cible+'@'+(dernierToucher.t?Date.now()-dernierToucher.t:'-')+'ms'};
  }
  function noter(type,cle,d){
    try{
      var x=window.__SOREAL_IDLE_DIAG_V1__;
      if(!x||typeof x.noter!=='function')return;
      var e=etatCoffre(),o={};
      for(var k in e)o[k]=e[k];
      for(var q in (d||{}))o[q]=d[q];
      seq+=1;
      x.noter(type,String(cle)+'#'+seq,o);
    }catch(_e){}
  }
  try{
    document.addEventListener('pointerdown',function(ev){dernierToucher={cible:decrire(ev.target),t:Date.now()};},true);
  }catch(_e){}
  function decrire(n){
    if(!n||n.nodeType!==1)return '?';
    var c=String(n.className&&n.className.baseVal!==undefined?n.className.baseVal:n.className||'').trim().split(/\s+/).slice(0,2).join('.');
    return (n.tagName||'?').toLowerCase()+(c?'.'+c:'');
  }
  /* 1. sauts de mise en page */
  try{
    if(typeof PerformanceObserver==='function'){
      new PerformanceObserver(function(liste){
        liste.getEntries().forEach(function(e){
          if(e.hadRecentInput||!(e.value>=0.01))return;
          var src=(e.sources||[]).slice(0,3).map(function(s){
            return decrire(s.node)+':'+Math.round((s.previousRect&&s.previousRect.y)||0)+'>'+Math.round((s.currentRect&&s.currentRect.y)||0);
          }).join(' ; ');
          noter('saut_page',(src||'?').slice(0,60),{valeur:Math.round(e.value*1000)/1000,sources:src});
        });
      }).observe({type:'layout-shift',buffered:false});
    }
  }catch(_e){}
  /* 2. hauteur de la page + 3. éléments remplacés */
  var hauteur=0,coffre=null,valise=null,n={coffre:0,valise:0},tCoffre=0,tValise=0;
  setInterval(function(){
    if(document.hidden)return;
    try{
      var h=Math.round(document.documentElement.scrollHeight||0);
      if(hauteur&&Math.abs(h-hauteur)>=60){
        var m=document.querySelector('.soreal-idle-page-root-v28');
        noter('hauteur_page','h',{de:hauteur,a:h,menu:m&&m.getAttribute('data-menu')||''});
      }
      hauteur=h;
      var c=document.querySelector('.soreal-idle-coffre-v1'),v=document.querySelector('.vl-section'),t=Date.now();
      if(coffre&&c&&c!==coffre){n.coffre+=1;noter('redessin_coffre','coffre',{n:n.coffre,ms:tCoffre?t-tCoffre:0});tCoffre=t;}
      if(valise&&v&&v!==valise){n.valise+=1;noter('redessin_coffre','valise',{n:n.valise,ms:tValise?t-tValise:0});tValise=t;}
      if(c)coffre=c;if(v)valise=v;
    }catch(_e){}
  },400);
  window.__SOREAL_IDLE_DIAG_COFFRE_V1__={decrire:decrire};
})();
