/* Bandeau du haut : place, gain par seconde / temps restant, part dépensée, barre vidée en fondu et 3e ressource.
 * La Vie est écrite par soreal-idle-ui.js (toujours celle de Fight Boss, à chaque tick). Rien n'est écrit si la valeur n'a pas changé. */
(function(){
  'use strict';
  var dernier={pv:null,r3:null};
  function nombre(v){v=Number(v);return isFinite(v)?v:0;}
  function formater(n){
    var f=window.__SOREAL_IDLE_FORMAT_NOMBRE_V2__;
    return typeof f==='function'?f(n):String(Math.round(n));
  }
  /* Le bandeau se colle juste sous le menu (lui-même collé en haut) : on mesure le menu. */
  var dernierTop=null;
  function placer(){
    var nav=document.querySelector('.soreal-idle-nav-v28');
    if(!nav)return;
    var haut=parseFloat(getComputedStyle(nav).top)||0;
    var v=Math.round(haut+nav.getBoundingClientRect().height);
    if(v!==dernierTop){dernierTop=v;document.documentElement.style.setProperty('--hud-haut-v2',v+'px');}
  }
  function texteBarre(v,m){var f=window.__SOREAL_IDLE_TEXTE_BARRE_V2__;return typeof f==='function'?f(v,m):String(v);}
  function majDepense(){
    var f=window.__SOREAL_IDLE_GENEREE_PCT_V2__;
    if(typeof f!=='function')return;
    var g=f();
    var e=document.getElementById('sorealIdleDepenseEnergieV2');
    var ke=g.energie.toFixed(2);
    if(e&&e.style.width!==ke+'%')e.style.width=ke+'%';
    var m=document.getElementById('sorealIdleDepenseMagieV2');
    var km=g.magie.toFixed(2);
    if(m&&m.style.width!==km+'%')m.style.width=km+'%';
  }
  /* Une barre dont tout a été dépensé s'efface en fondu (opacité seulement : sa place reste réservée, rien ne bouge). Elle reparaît dès qu'il y a de nouveau de quoi la remplir. */
  var videDepuis={energie:0,magie:0},pleinDepuis={energie:0,magie:0};
  /* Une barre qui revient se POSE par-dessus l'interface sans rien décaler (Norman, 2026-10-10) : on mesure la hauteur du bandeau avant et après son retour et une marge négative annule exactement la différence. */
  /*
   * Ordre des barres : TOUJOURS Énergie, Magie, 3e ressource, puis Vie (Norman, 2026-10-10). Une barre qui revient se pose dans SA place sans faire bouger l'interface : sa hauteur est annulée par une marge négative
   * (voir reapparaitSansDecaler), et chaque barre située APRÈS elle (dont la Vie) est descendue d'autant par un simple décalage visuel (transform) ; les barres posées s'empilent dans l'ordre du bandeau.
   */
  function ranger(hud){
    var panneaux=[].slice.call(hud.children).filter(function(c){return c.classList&&c.classList.contains('soreal-idle-energy-panel-v34');});
    var cum=0;
    panneaux.forEach(function(p){
      if(p.classList.contains('soreal-idle-vide-v2')){if(p.style.transform)p.style.transform='';return;}
      var tr=cum>0?'translateY('+cum+'px)':'';
      if(p.style.transform!==tr)p.style.transform=tr;
      if(p.classList.contains('soreal-idle-superpose-v2')){
        var pas=-parseFloat(p.style.marginBottom);
        cum+=pas>0?pas:p.offsetHeight+3;
      }
    });
  }
  function reapparaitSansDecaler(panneau){
    var hud=panneau.closest('.soreal-idle-hud-v2')||panneau.parentNode;
    var avant=hud.getBoundingClientRect().height;
    panneau.classList.add('soreal-idle-superpose-v2');
    panneau.classList.remove('soreal-idle-vide-v2');
    panneau.style.setProperty('margin-bottom','0px','important');
    var apres=hud.getBoundingClientRect().height;
    var marge=0;
    if(apres-avant<=0.5){panneau.classList.remove('soreal-idle-superpose-v2');panneau.style.removeProperty('margin-bottom');return;}
    /* Quelques passes : on corrige jusqu'à ce que la hauteur du bandeau soit exactement celle d'avant (marges qui se confondent, écarts d'arrondi). */
    for(var i=0;i<4;i++){
      var reste=hud.getBoundingClientRect().height-avant;
      if(Math.abs(reste)<0.5)break;
      marge-=reste;
      panneau.style.setProperty('margin-bottom',marge+'px','important');
    }
    ranger(hud);
  }
  function basculerVide(id,cle,vide){
    var el=document.getElementById(id);
    var panneau=el&&el.closest('.soreal-idle-energy-panel-v34');
    if(!panneau)return;
    var maintenant=Date.now();
    if(vide){
      if(!videDepuis[cle])videDepuis[cle]=maintenant;
      if(maintenant-videDepuis[cle]>=1200){panneau.classList.add('soreal-idle-vide-v2');panneau.classList.remove('soreal-idle-superpose-v2');panneau.style.removeProperty('margin-bottom');panneau.style.removeProperty('transform');ranger(panneau.closest('.soreal-idle-hud-v2')||panneau.parentNode);}
      pleinDepuis[cle]=0;
    }else{
      videDepuis[cle]=0;
      if(!pleinDepuis[cle])pleinDepuis[cle]=maintenant;
      if(maintenant-pleinDepuis[cle]>=700&&panneau.classList.contains('soreal-idle-vide-v2'))reapparaitSansDecaler(panneau);
    }
  }
  function majVide(){
    var f=window.__SOREAL_IDLE_DISPONIBLE_V2__;
    if(typeof f!=='function')return;
    var d=f();
    /* Moins d'un point restant = plus rien à dépenser (les restes décimaux d'une synchro ne ramènent pas la barre). */
    var vE=d.energie<1,vM=d.magie<1;
    basculerVide('sorealIdleDepenseEnergieV2','energie',vE);
    basculerVide('sorealIdleDepenseMagieV2','magie',vM);
  }
  function ecrire(id,texte){
    var el=document.getElementById(id);
    if(el&&el.textContent!==texte)el.textContent=texte;
  }
  function majInfos(){
    var f=window.__SOREAL_IDLE_BARRE_INFOS_V2__;
    if(typeof f!=='function')return;
    var i=f();
    ecrire('sorealIdleHudGEnergieV2',i.energie.vitesse);
    ecrire('sorealIdleHudDEnergieV2',i.energie.temps);
    ecrire('sorealIdleHudGMagieV2',i.magie.vitesse);
    ecrire('sorealIdleHudDMagieV2',i.magie.temps);
  }
  function maj(){
    placer();
    majInfos();
    majVide();
    majDepense();
    var etat=typeof window.__SOREAL_IDLE_LIRE_ETAT_V1__==='function'?window.__SOREAL_IDLE_LIRE_ETAT_V1__():null;
    if(!etat)return;
    var barR3=document.getElementById('sorealIdleHudR3BarV2');
    if(barR3){
      var r=etat.systemes&&etat.systemes.resources&&etat.systemes.resources.r3;
      if(r){
        var c2=nombre(r.current)+':'+nombre(r.cap);
        if(c2!==barR3.getAttribute('data-cle')){
          barR3.setAttribute('data-cle',c2);
          var cap=Math.max(1,nombre(r.cap));
          barR3.style.width=Math.min(100,nombre(r.current)/cap*100).toFixed(2)+'%';
          var t3=document.getElementById('sorealIdleHudR3TexteV2');
          if(t3)t3.textContent=texteBarre(nombre(r.current),cap);
        }
      }
    }
  }

  setInterval(function(){if(!document.hidden)maj();},250);
})();
