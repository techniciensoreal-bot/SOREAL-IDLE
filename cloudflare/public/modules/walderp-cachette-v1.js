/*
 * Cache-cache de Walderp, comme dans le vrai jeu (Norman, 2026-11-13 : « fais comme dans le vrai jeu »).
 *
 * Wiki NGU Idle, page Walderp : « Kill his first form in his zone, then he will hide in a random UI. You will have 3 minutes to find him as he becomes
 * more visible in the screen he is hiding in, as he starts out nearly invisible each 3 minute cycle. [...] (but will appear in all tabs of a menu) [...]
 * After 3 minutes he will reset his visibility and change menus. »
 *
 * - AUCUN indice : ni bandeau, ni nom de menu. Seule sa petite image (« Walderp's sprite in menus », WalderpFull.png du wiki) apparaît, dans le menu où
 *   il se cache, quel que soit l'onglet de ce menu ; un clic dessus le débusque (action titanFound, inchangée).
 * - Le moteur ne donne que l'instant où il s'est caché (state.hiddenSince), une graine (state.hiddenSeed) et la durée du cycle (hideCycleMs, 3 minutes du
 *   wiki). Le menu du cycle en cours est déduit ICI, parmi les menus que ce joueur peut réellement ouvrir (menuDisponibleIdleV28_) : il ne peut donc jamais
 *   se cacher dans un menu inaccessible. Deux cycles qui se suivent ne tombent jamais sur le même menu (« change menus ») : les cycles pairs tirent parmi
 *   les menus de rang pair, les cycles impairs parmi ceux de rang impair.
 * - Règle n°4 (aucun redessin visible) : l'image est UN nœud persistant accroché à <body>, hors de la page redessinée ; il est remis à jour après chaque
 *   redessin (window.__SOREAL_IDLE_APRES_REDESSIN_V1__) et à la fin de chaque cycle (une seule minuterie, posée seulement tant qu'il est caché).
 *
 * Valeurs NON publiées par le wiki, choix SOREAL à valider par Norman (2026-11-13) : l'opacité de départ et d'arrivée (« nearly invisible » puis « more
 * visible » : 4 % à 100 %, montée régulière), la place de l'image dans l'écran (tirée avec la graine) et sa taille.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_WALDERP_CACHETTE_V1__)return;

  var CYCLE_MS=180000;      /* wiki Walderp : « You will have 3 minutes to find him » (valeur de repli ; le moteur envoie hideCycleMs). */
  var OPACITE_DEBUT=0.04;   /* choix SOREAL (non publié) : « starts out nearly invisible ». */
  var OPACITE_FIN=1;        /* choix SOREAL (non publié) : « becomes more visible ». */
  var MENUS_EXCLUS={admin:1}; /* outil de l'administrateur, pas un menu du jeu. */
  var CLASSE='soreal-idle-walderp-cachette-v1'; /* styles : soreal-idle-ui.css (aucune feuille injectée par le JS) */
  var noeud=null,minuterie=0,cleAffichee='';

  /* Entier 32 bits déterministe à partir de la graine, du numéro de cycle et d'un sel (même résultat sur tous les appareils du compte). */
  function hasard(graine,cycle,sel){
    var x=(Math.imul((graine|0)^0x9E3779B9,0x85EBCA6B)^Math.imul((cycle|0)+1,0xC2B2AE35)^Math.imul((sel|0)+1,0x27D4EB2F))|0;
    x^=x>>>16;x=Math.imul(x,0x7FEB352D);x^=x>>>15;x=Math.imul(x,0x846CA68B);x^=x>>>16;
    return x>>>0;
  }

  /* Menu où il se cache pendant le cycle donné ; jamais le même que celui du cycle voisin dès qu'il y a au moins 2 menus. */
  function menuDuCycle(graine,cycle,menus){
    var n=menus.length;
    if(!n)return '';
    if(n===1)return menus[0];
    var parite=((cycle%2)+2)%2;
    var nombre=parite===0?Math.ceil(n/2):Math.floor(n/2);
    return menus[parite+2*(hasard(graine,cycle,0)%nombre)];
  }

  /* Place de l'image dans l'écran, en pourcentage (loin des bords et du bandeau du haut). */
  function placeDuCycle(graine,cycle){
    return {gauche:5+hasard(graine,cycle,1)%83,haut:24+hasard(graine,cycle,2)%54};
  }

  /* Cycle en cours : numéro, début, durée. */
  function cycleEnCours(depuis,dureeMs,maintenant){
    var duree=Number(dureeMs)>0?Number(dureeMs):CYCLE_MS;
    var d=Number(depuis)>0?Number(depuis):0;
    var numero=Math.max(0,Math.floor((maintenant-d)/duree));
    return {numero:numero,debut:d+numero*duree,duree:duree};
  }

  function opacite(ecoule,duree){
    var p=Math.max(0,Math.min(1,ecoule/duree));
    return OPACITE_DEBUT+(OPACITE_FIN-OPACITE_DEBUT)*p;
  }

  function registre(){return window.__SOREAL_IDLE_REG__||{};}
  function heure(){return typeof window.__SOREAL_IDLE_HEURE_V1__==='function'?window.__SOREAL_IDLE_HEURE_V1__():Date.now();}

  /* Le titan caché (ou null). */
  function titanCache(j){
    var H=window.__SOREAL_IDLE_META_HOST_V130__||{};
    var a=null;
    try{a=typeof H.aventureMetaIdleV47_==='function'?H.aventureMetaIdleV47_(j):null;}catch(_e){a=null;}
    var titans=a&&Array.isArray(a.titans)?a.titans:[];
    for(var i=0;i<titans.length;i++){
      var t=titans[i];
      if(t&&t.id&&t.state&&t.state.hiddenPanel)return t;
    }
    return null;
  }

  /* Menus que ce joueur peut ouvrir, dans l'ordre fixe du jeu (pas l'ordre qu'il a rangé : la cachette doit être la même sur tous ses appareils). */
  function menusOuverts(j){
    var REG=registre();
    var liste=Array.isArray(REG.IDLE_MENUS_V1)?REG.IDLE_MENUS_V1:[];
    var sortie=[];
    for(var i=0;i<liste.length;i++){
      var id=liste[i]&&String(liste[i].id||'');
      if(!id||MENUS_EXCLUS[id])continue;
      try{if(typeof REG.menuDisponibleIdleV28_==='function'&&REG.menuDisponibleIdleV28_(id,j))sortie.push(id);}catch(_e){}
    }
    return sortie;
  }

  /* Tout ce qu'il faut pour afficher (ou non) l'image maintenant. */
  function situation(j,maintenant){
    var t=titanCache(j);
    if(!t)return null;
    var c=cycleEnCours(t.state.hiddenSince,t.hideCycleMs,maintenant);
    var graine=Number(t.state.hiddenSeed)||0;
    var menus=menusOuverts(j);
    return {titan:String(t.id),forme:Math.max(0,Math.floor(Number(t.state.kills)||0)),cycle:c,menu:menuDuCycle(graine,c.numero,menus),place:placeDuCycle(graine,c.numero)};
  }

  function creer(){
    if(noeud&&noeud.isConnected)return noeud;
    noeud=document.createElement('button');
    noeud.type='button';
    noeud.className=CLASSE;
    noeud.hidden=true;
    noeud.setAttribute('aria-label','Walderp');
    noeud.addEventListener('click',function(){
      if(typeof window.__trouverWalderpIdleV147__==='function')window.__trouverWalderpIdleV147__();
    });
    document.body.appendChild(noeud);
    return noeud;
  }

  /* Image : le sprite « dans les menus » ; à défaut l'image de la forme en cours ; à défaut un fantôme (jamais une cachette vide). */
  function poserImage(n,s){
    var sources=['/api/idle/media/titan?id='+encodeURIComponent(s.titan)+'&sprite=menu','/api/idle/media/titan?id='+encodeURIComponent(s.titan)+'&form='+Math.min(s.forme,4)];
    n.textContent='';
    var img=document.createElement('img');
    img.alt='';
    img.draggable=false;
    var rang=0;
    img.onerror=function(){
      rang++;
      if(rang<sources.length){img.src=sources[rang];return;}
      n.textContent='';
      var f=document.createElement('span');
      f.textContent='👻';
      n.appendChild(f);
    };
    img.src=sources[0];
    n.appendChild(img);
  }

  function cacher(){
    if(noeud){
      noeud.hidden=true;
      if(noeud.__anim){try{noeud.__anim.cancel();}catch(_e){}noeud.__anim=null;}
    }
    cleAffichee='';
  }

  function programmer(fin,maintenant){
    if(minuterie){clearTimeout(minuterie);minuterie=0;}
    if(!(fin>0))return;
    minuterie=setTimeout(function(){minuterie=0;mettreAJour();},Math.max(250,fin-maintenant+60));
  }

  function mettreAJour(){
    var REG=registre();
    var maintenant=heure();
    var s=null;
    try{s=situation(REG.idleEtat,maintenant);}catch(_e){s=null;}
    if(!s){programmer(0,maintenant);cacher();return;}
    /* Il change de menu à la fin du cycle : on revient voir à ce moment-là, où que soit le joueur. */
    programmer(s.cycle.debut+s.cycle.duree,maintenant);
    if(!s.menu||s.menu!==String(REG.idleMenuActifV28||'')){cacher();return;}
    var n=creer();
    var cle=s.titan+'|'+s.cycle.debut+'|'+s.menu;
    var ecoule=Math.max(0,Math.min(s.cycle.duree,maintenant-s.cycle.debut));
    if(cle!==cleAffichee){
      cleAffichee=cle;
      n.style.left=s.place.gauche+'%';
      n.style.top=s.place.haut+'%';
      if(!n.firstChild||n.__titan!==s.titan){n.__titan=s.titan;poserImage(n,s);}
      if(n.__anim){try{n.__anim.cancel();}catch(_e){}n.__anim=null;}
      if(typeof n.animate==='function'){
        /* Web Animations : la montée suit le temps réel du cycle, même si l'onglet a dormi (currentTime recalé sur l'heure du jeu). */
        n.__anim=n.animate([{opacity:OPACITE_DEBUT},{opacity:OPACITE_FIN}],{duration:s.cycle.duree,fill:'both',easing:'linear'});
      }
    }
    if(n.__anim){try{n.__anim.currentTime=ecoule;}catch(_e){}}
    else n.style.opacity=String(Math.round(opacite(ecoule,s.cycle.duree)*100)/100);
    n.hidden=false;
  }

  (window.__SOREAL_IDLE_APRES_REDESSIN_V1__=window.__SOREAL_IDLE_APRES_REDESSIN_V1__||[]).push(function(){try{mettreAJour();}catch(_e){}});
  document.addEventListener('visibilitychange',function(){if(!document.hidden){try{mettreAJour();}catch(_e){}}});

  window.__SOREAL_IDLE_WALDERP_CACHETTE_V1__={
    mettreAJour:mettreAJour,
    /* Fonctions pures, pour les tests. */
    hasard:hasard,menuDuCycle:menuDuCycle,placeDuCycle:placeDuCycle,cycleEnCours:cycleEnCours,opacite:opacite,situation:situation,
    CYCLE_MS:CYCLE_MS,OPACITE_DEBUT:OPACITE_DEBUT,OPACITE_FIN:OPACITE_FIN
  };
})();
