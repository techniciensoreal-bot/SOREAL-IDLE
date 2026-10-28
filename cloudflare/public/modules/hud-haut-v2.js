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
  /*
   * Une barre qui revient (ou qui part) ouvre (ou referme) sa place EN DOUCEUR (max-height + marge, voir soreal-idle-themes.css) : le bandeau grandit ou rétrécit et tout ce qui est dessous suit, la Vie reste dans le bandeau
   * et ne chevauche jamais les boutons du dessous (Norman, 2026-10-11 : « ma barre de vie fait un saut et se retrouve au-dessus des boutons attaque, défense, or »). Plus de décalage par transform ni de marge négative.
   */
  function reapparaitSansDecaler(panneau){
    panneau.classList.remove('soreal-idle-vide-v2');
    panneau.classList.remove('soreal-idle-superpose-v2');
    panneau.style.removeProperty('margin-bottom');
    panneau.style.removeProperty('transform');
  }
  function basculerVide(id,cle,vide){
    var el=document.getElementById(id);
    var panneau=el&&el.closest('.soreal-idle-energy-panel-v34');
    if(!panneau)return;
    var maintenant=Date.now();
    if(vide){
      if(!videDepuis[cle])videDepuis[cle]=maintenant;
      if(maintenant-videDepuis[cle]>=1200){panneau.classList.add('soreal-idle-vide-v2');panneau.classList.remove('soreal-idle-superpose-v2');panneau.style.removeProperty('margin-bottom');panneau.style.removeProperty('transform');}
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
    var vE=d.energie<1,vM=d.magie<1&&!d.magieEnCours;   /* la Magie reste affichée tant qu'il y en a encore à générer */
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
  /*
   * La page ne bouge plus quand une barre part ou revient (Norman, 2026-10-26 : « quand je dépense toute ma magie ou toute mon énergie, les barres disparaissent et ça fait bouger la page où je me trouve »). Le bandeau est collé en haut et sa
   * hauteur change en douceur (voir soreal-idle-themes.css) : tout ce qui est dessous suivait, d'où le saut. Le défilement natif « ancré » est coupé sur la page (overflow-anchor:none, elle est redessinée en continu) : on le remplace ici. Chaque
   * variation de hauteur du bandeau, image après image, est reportée sur le défilement : le contenu reste exactement où il est, la barre se déploie par-dessus. En haut de page (rien à compenser) le contenu descend ou remonte avec la barre, comme avant.
   */
  /* Barre de vie du bandeau : glisse par transform (voir majHudPvIdleV2_). Règle posée ici (pas dans les feuilles, plafond de !important) : seul le transform est animé, plus la largeur. */
  (function(){
    if(document.getElementById('soreal-idle-pv-transform-v1'))return;
    var st=document.createElement('style');st.id='soreal-idle-pv-transform-v1';
    st.textContent='html body #sorealIdleHudPvBarV2{transition:transform .28s linear,background .4s ease,box-shadow .4s ease!important;will-change:transform}'+
      '@media (prefers-reduced-motion:reduce){html body #sorealIdleHudPvBarV2{transition:none!important}}';
    (document.head||document.documentElement).appendChild(st);
  })();
  /*
   * Le bandeau et la page sont deux choses INDÉPENDANTES (Norman, 2026-10-28 : « quand la barre de magie ou d'énergie disparaît, ça fait encore bouger le menu ; ça doit vraiment être 2 choses indépendantes, ce petit saut n'est vraiment pas propre »).
   * L'ancienne compensation ne jouait que page défilée (en haut de page, le contenu suivait la barre) et passait par le défilement. Maintenant une réserve (un bloc vide juste sous le bandeau, data-morph-garder) absorbe EXACTEMENT chaque variation de
   * hauteur du bandeau, image après image (ResizeObserver : avant l'affichage de l'image) : le contenu reste où il est, en haut de page comme défilé ; le bandeau, lui, se réduit ou se déploie par-dessus. La réserve est remise à zéro quand on change de menu
   * ou que la fenêtre change de taille (le contenu est alors remplacé ou remis en page de toute façon).
   */
  var hudObs=null,hudEl=null,hudPos=0,reserve=null,menuReserve='',graceJusqua=0;
  /* Une page qui vient de s'afficher laisse le bandeau se mettre en place (les barres déjà vides se replient en fondu ~2 s après l'arrivée) : pendant ces 5 s rien n'est absorbé, sinon la réserve laissait un grand vide entre la barre de vie et la page (Norman, 2026-10-28, Fight Boss). */
  var GRACE_MS=5000;
  function menuCourant(){var r=document.querySelector('.soreal-idle-page-root-v28');return r?(r.getAttribute('data-menu')||''):'';}
  /* Position, dans le DOCUMENT, du début du contenu : le bas de la réserve (marges du bandeau comprises). */
  function positionSous(){
    if(!reserve||!reserve.isConnected)return null;
    return reserve.getBoundingClientRect().bottom+(window.scrollY||document.documentElement.scrollTop||0);
  }
  function assurerReserve(h){
    if(reserve&&reserve.isConnected&&reserve.previousElementSibling===h)return;
    if(reserve&&reserve.parentNode)reserve.parentNode.removeChild(reserve);
    reserve=document.createElement('div');
    reserve.id='sorealIdleHudReserveV2';
    reserve.setAttribute('data-morph-garder','');
    reserve.setAttribute('aria-hidden','true');
    reserve.style.cssText='height:0;margin:0;padding:0;border:0;pointer-events:none;flex:none;grid-column:1/-1';
    h.insertAdjacentElement('afterend',reserve);
  }
  function remettreReserve(){
    if(reserve&&reserve.style.height!=='0px')reserve.style.height='0px';
    hudPos=positionSous();
    graceJusqua=Date.now()+GRACE_MS;
  }
  function surveillerHud(){
    var h=document.getElementById('sorealIdleHudV2');
    var m=menuCourant();
    if(h&&m!==menuReserve){menuReserve=m;if(h===hudEl)remettreReserve();}
    if(h===hudEl&&(!h||(reserve&&reserve.isConnected)))return;
    if(hudObs){hudObs.disconnect();hudObs=null;}
    hudEl=h;
    if(!h||typeof ResizeObserver!=='function')return;
    assurerReserve(h);
    hudPos=positionSous();
    graceJusqua=Date.now()+GRACE_MS;
    hudObs=new ResizeObserver(function(){
      if(!hudEl||!reserve||!reserve.isConnected)return;
      /* changement de menu détecté ici même, avant le prochain passage du minuteur : réserve à zéro et période de mise en place */
      var mc=menuCourant();
      if(mc!==menuReserve){menuReserve=mc;remettreReserve();return;}
      var p=positionSous();
      if(p===null||hudPos===null){hudPos=p;return;}
      var d=p-hudPos;
      if(Date.now()<graceJusqua){hudPos=p;return;}   /* page qui vient de s'afficher : le bandeau se met en place, rien n'est absorbé */
      /* une seule barre (30 px au plus, marges comprises) : une variation plus grande est un vrai changement de page ; pendant un combat de Titan le bandeau est caché volontairement */
      if(document.body&&document.body.classList.contains('tcv-actif')){remettreReserve();return;}
      /* aucun seuil : pendant le fondu la hauteur varie de moins d'un pixel par image au début et à la fin, ces petits écarts s'additionneraient en un saut */
      if(Math.abs(d)>0.01&&Math.abs(d)<60){
        var hauteur=parseFloat(reserve.style.height)||0;
        reserve.style.height=Math.max(0,hauteur-d)+'px';
      }
      hudPos=positionSous();   /* ce qui n'a pas pu être absorbé (réserve à zéro) n'est pas reporté sur l'image suivante */
    });
    hudObs.observe(h);
  }
  window.addEventListener('resize',function(){remettreReserve();});
  window.__SOREAL_IDLE_HUD_HAUT_V2__={surveiller:surveillerHud};
  function maj(){
    placer();
    surveillerHud();
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
