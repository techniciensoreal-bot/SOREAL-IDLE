/* Bandeau du haut (maquette téléphone) : met à jour en direct la barre de Vie et celle de la 3e ressource.
 * Énergie et Magie gardent leurs mises à jour d'origine. Rien n'est écrit si la valeur n'a pas changé. */
(function(){
  'use strict';
  var dernier={pv:null,r3:null};
  function nombre(v){v=Number(v);return isFinite(v)?v:0;}
  function pvActuels(etat){
    var racine=document.querySelector('.soreal-idle-page-root-v28');
    var menu=racine?racine.getAttribute('data-menu'):'';
    var adv=etat&&etat.systemes&&etat.systemes.adventure;
    if(menu!=='combat'&&adv){
      var f=adv.fight;
      if(f&&f.active&&nombre(f.playerHpMax)>0)return {pv:nombre(f.playerHp),max:nombre(f.playerHpMax)};
      var max=nombre(adv.stats&&adv.stats.hp);
      if(max>0){var rep=etat.adventureRestPv;return {pv:rep==null?max:Math.min(max,nombre(rep)),max:max};}
    }
    return {pv:nombre(etat&&etat.pvJoueur),max:nombre(etat&&etat.pvJoueurMax)};
  }
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
  var videDepuis={energie:0,magie:0};
  function basculerVide(id,cle,vide){
    var el=document.getElementById(id);
    var panneau=el&&el.closest('.soreal-idle-energy-panel-v34');
    if(!panneau)return;
    var maintenant=Date.now();
    if(vide){
      if(!videDepuis[cle])videDepuis[cle]=maintenant;
      if(maintenant-videDepuis[cle]>=1200)panneau.classList.add('soreal-idle-vide-v2');
    }else{
      videDepuis[cle]=0;
      panneau.classList.remove('soreal-idle-vide-v2');
    }
  }
  function majVide(){
    var f=window.__SOREAL_IDLE_DISPONIBLE_V2__;
    if(typeof f!=='function')return;
    var d=f();
    var vE=d.energie<=0.0001,vM=d.magie<=0.0001;
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
    var g=window.__SOREAL_IDLE_REGEN_PV_V2__,ft=window.__SOREAL_IDLE_TEXTE_REGEN_PV_V2__;
    if(typeof g==='function'&&typeof ft==='function'){
      var racine=document.querySelector('.soreal-idle-page-root-v28');
      var menuR=racine?racine.getAttribute('data-menu'):'';
      if(menuR!=='combat')ecrire('sorealIdleHudDPvV2',ft(g(menuR)));
    }
  }
  function maj(){
    placer();
    majInfos();
    majVide();
    majDepense();
    var etat=typeof window.__SOREAL_IDLE_LIRE_ETAT_V1__==='function'?window.__SOREAL_IDLE_LIRE_ETAT_V1__():null;
    if(!etat)return;
    var barPv=document.getElementById('sorealIdleHudPvBarV2');
    var racinePv=document.querySelector('.soreal-idle-page-root-v28');
    var menuPv=racinePv?racinePv.getAttribute('data-menu'):'';
    /* En Fight Boss, soreal-idle-ui.js écrit la Vie au même instant que la barre du combat : ici on n'y touche pas. */
    if(barPv&&menuPv!=='combat'){
      var p=pvActuels(etat);
      var cle=p.pv+':'+p.max;
      /* Le cache est porté par l'élément lui-même : un nouveau rendu de la page recrée la barre, elle doit alors être remplie à nouveau. */
      if(cle!==barPv.getAttribute('data-cle')){
        barPv.setAttribute('data-cle',cle);
        var pct=p.max>0?Math.max(0,Math.min(100,p.pv/p.max*100)):0;
        barPv.style.width=pct.toFixed(2)+'%';
        var t=document.getElementById('sorealIdleHudPvTexteV2');
        var fp=window.__SOREAL_IDLE_TEXTE_PV_V2__;
        if(t)t.textContent=typeof fp==='function'?fp(p.pv,p.max):texteBarre(p.pv,p.max);
        var panneau=document.getElementById('sorealIdleHudPvV2');
        if(panneau)panneau.classList.toggle('bas',pct<=25);
      }
    }
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
