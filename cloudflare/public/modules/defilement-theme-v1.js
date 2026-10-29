/*
 * Barre de défilement de la page, au thème de chaque page (Norman, 2026-10-29 : « j'aimerais la personnaliser pour qu'elle soit au thème de chaque page, avec des textures »).
 *
 * Couleurs : celles de la page affichée (variables --i-a / --i-b / --i-bg1 / --i-bg2 de soreal-idle-itopod.css, posées sur la racine de la page ; à défaut le thème --th-a / --th-b), recopiées sur <html> en --sb-a / --sb-b /
 * --sb-d. Texture : une par famille de pages (métal rivé pour les machines, balayage d'écran pour Wandoos, écorce pour Yggdrasil, gouttes pour le sang, étoiles pour le NGU, terre pour les mineurs, bandes d'alerte pour les combats,
 * losanges pour les cartes, papier pour les chroniques, quadrillage pour les réglages…). Aucune animation (rien à boucler) ; sur téléphone la barre est une surcouche du système : sans effet.
 * Le style est posé sur la barre de <html> seulement (jamais les réglages standard de largeur ou de couleur de barre : ils désactiveraient ces textures) ; les barres internes (listes, menus) gardent leur style.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_DEFILEMENT_V1__)return;

  var FAMILLES={
    metal:['entrainement','avance','machine','augmentations','tower','challenges'],
    ecran:['wandoos'],
    ecorce:['yggdrasil','beards','cooking'],
    sang:['sang'],
    etoiles:['ngu','renaissance','wishes'],
    terre:['diggers','moneyPit'],
    carte:['aventure','questing'],
    alerte:['combat','titans'],
    losange:['macguffins','cards','perks','quirks','daycare'],
    papier:['chroniques','succes','bestiaire','classement'],
    grille:['chat','parametres','admin','shop','hacks']
  };
  var FAMILLE_DE={};
  Object.keys(FAMILLES).forEach(function(f){FAMILLES[f].forEach(function(m){FAMILLE_DE[m]=f;});});

  var CSS=[
    /* barre de la page : cadre noir comme les boutons du jeu, rail creusé, poignée en relief */
    'html::-webkit-scrollbar{width:20px;height:20px;background:var(--sb-d,#120d1f)}',
    'html::-webkit-scrollbar-corner{background:var(--sb-d,#120d1f)}',
    'html::-webkit-scrollbar-track{background-color:var(--sb-d,#120d1f);border-left:3px solid #000;box-shadow:inset 3px 0 0 rgba(255,255,255,.07),inset -2px 0 0 rgba(0,0,0,.55)}',
    'html::-webkit-scrollbar-thumb{min-height:56px;border:3px solid #000;border-radius:6px;background-color:var(--sb-a,#9a8cff);box-shadow:inset 0 2px 0 rgba(255,255,255,.45),inset 0 -3px 0 rgba(0,0,0,.4);background-image:linear-gradient(90deg,rgba(255,255,255,.28),rgba(255,255,255,0) 40%,rgba(0,0,0,.28));background-repeat:no-repeat}',
    'html::-webkit-scrollbar-thumb:hover{background-color:color-mix(in srgb,var(--sb-a,#9a8cff) 78%,#fff)}',
    'html::-webkit-scrollbar-thumb:active{background-color:color-mix(in srgb,var(--sb-a,#9a8cff) 80%,#000)}',
    'html::-webkit-scrollbar-button{display:none;width:0;height:0}',

    /* métal rivé : stries brossées + deux rivets (haut et bas de la poignée) ; rail à rainures */
    'html[data-sb="metal"]::-webkit-scrollbar-thumb{background-image:radial-gradient(circle at 50% 7px,rgba(255,255,255,.85) 0 1.6px,rgba(0,0,0,.55) 2.2px,transparent 3.4px),radial-gradient(circle at 50% calc(100% - 7px),rgba(255,255,255,.85) 0 1.6px,rgba(0,0,0,.55) 2.2px,transparent 3.4px),repeating-linear-gradient(0deg,rgba(255,255,255,.16) 0 1px,transparent 1px 3px),linear-gradient(90deg,rgba(255,255,255,.3),rgba(255,255,255,0) 45%,rgba(0,0,0,.3))}',
    'html[data-sb="metal"]::-webkit-scrollbar-track{background-image:repeating-linear-gradient(0deg,rgba(0,0,0,.35) 0 2px,transparent 2px 10px);background-size:100% 10px}',

    /* écran cathodique : balayage vert, rail quadrillé de phosphore */
    'html[data-sb="ecran"]::-webkit-scrollbar-thumb{background-image:repeating-linear-gradient(0deg,rgba(0,0,0,.4) 0 1px,transparent 1px 3px),linear-gradient(90deg,rgba(120,255,160,.35),rgba(120,255,160,0) 50%,rgba(0,0,0,.35));background-color:#2f8f4e;box-shadow:inset 0 0 6px rgba(140,255,170,.55),inset 0 2px 0 rgba(255,255,255,.3)}',
    'html[data-sb="ecran"]::-webkit-scrollbar-track{background-image:linear-gradient(rgba(60,200,100,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(60,200,100,.12) 1px,transparent 1px);background-size:6px 6px;background-color:#031208}',

    /* écorce : veines verticales sinueuses, nœud au milieu ; rail de terre sombre */
    'html[data-sb="ecorce"]::-webkit-scrollbar-thumb{background-image:radial-gradient(ellipse at 50% 50%,rgba(0,0,0,.55) 0 2px,rgba(0,0,0,.2) 4px,transparent 6px),repeating-linear-gradient(94deg,rgba(0,0,0,.3) 0 2px,transparent 2px 5px,rgba(255,235,190,.12) 5px 6px,transparent 6px 10px),linear-gradient(90deg,rgba(255,255,255,.2),rgba(0,0,0,.3))}',
    'html[data-sb="ecorce"]::-webkit-scrollbar-track{background-image:repeating-linear-gradient(90deg,rgba(255,255,255,.05) 0 1px,transparent 1px 4px)}',

    /* sang : gouttes et traînées ; rail poisseux */
    'html[data-sb="sang"]::-webkit-scrollbar-thumb{background-image:radial-gradient(circle at 32% 18%,rgba(255,170,180,.8) 0 1.6px,transparent 2.6px),radial-gradient(ellipse at 66% 58%,rgba(0,0,0,.5) 0 2.4px,transparent 4.4px),radial-gradient(ellipse at 34% 86%,rgba(255,120,135,.55) 0 1.8px,transparent 3.2px),linear-gradient(90deg,rgba(255,255,255,.25),rgba(0,0,0,.35));background-size:100% 34px,100% 34px,100% 34px,100% 100%;background-repeat:repeat-y,repeat-y,repeat-y,no-repeat}',
    'html[data-sb="sang"]::-webkit-scrollbar-track{background-image:radial-gradient(ellipse at 50% 20%,rgba(190,25,45,.28) 0 2px,transparent 6px);background-size:100% 46px}',

    /* étoiles : semis de points qui scintillent par leur taille ; rail de ciel nocturne */
    'html[data-sb="etoiles"]::-webkit-scrollbar-thumb{background-image:radial-gradient(circle at 30% 30%,#fff 0 .9px,transparent 1.4px),radial-gradient(circle at 70% 62%,#fff 0 .7px,transparent 1.2px),radial-gradient(circle at 45% 88%,rgba(255,255,255,.9) 0 1px,transparent 1.6px),linear-gradient(90deg,rgba(255,255,255,.25),rgba(0,0,0,.3));background-size:100% 23px,100% 31px,100% 41px,100% 100%;background-repeat:repeat-y,repeat-y,repeat-y,no-repeat}',
    'html[data-sb="etoiles"]::-webkit-scrollbar-track{background-image:radial-gradient(circle at 25% 40%,rgba(255,255,255,.55) 0 .6px,transparent 1px),radial-gradient(circle at 75% 75%,rgba(255,255,255,.4) 0 .6px,transparent 1px);background-size:100% 19px,100% 27px}',

    /* terre : cailloux et grains de tailles variées ; rail de gravier */
    'html[data-sb="terre"]::-webkit-scrollbar-thumb{background-image:radial-gradient(circle at 25% 22%,rgba(0,0,0,.4) 0 1.8px,transparent 2.6px),radial-gradient(circle at 70% 55%,rgba(255,235,190,.4) 0 1.4px,transparent 2.2px),radial-gradient(circle at 40% 82%,rgba(0,0,0,.35) 0 2.2px,transparent 3px),linear-gradient(90deg,rgba(255,255,255,.2),rgba(0,0,0,.3));background-size:100% 17px,100% 13px,100% 23px,100% 100%;background-repeat:repeat-y,repeat-y,repeat-y,no-repeat}',
    'html[data-sb="terre"]::-webkit-scrollbar-track{background-image:radial-gradient(circle at 30% 50%,rgba(255,255,255,.1) 0 1px,transparent 2px),radial-gradient(circle at 70% 30%,rgba(0,0,0,.35) 0 1.4px,transparent 2.4px);background-size:100% 11px,100% 15px}',

    /* carte : bandes obliques d'arpenteur ; rail pointillé comme un chemin */
    'html[data-sb="carte"]::-webkit-scrollbar-thumb{background-image:repeating-linear-gradient(135deg,rgba(0,0,0,.22) 0 5px,transparent 5px 10px),linear-gradient(90deg,rgba(255,255,255,.28),rgba(0,0,0,.3))}',
    'html[data-sb="carte"]::-webkit-scrollbar-track{background-image:linear-gradient(rgba(255,235,190,.35) 40%,transparent 0);background-size:2px 10px;background-repeat:repeat-y;background-position:center}',

    /* alerte : bandes jaune et noir des chantiers ; rail noir à liseré */
    'html[data-sb="alerte"]::-webkit-scrollbar-thumb{background-image:repeating-linear-gradient(135deg,rgba(0,0,0,.65) 0 6px,transparent 6px 12px),linear-gradient(90deg,rgba(255,255,255,.25),rgba(0,0,0,.25))}',
    'html[data-sb="alerte"]::-webkit-scrollbar-track{background-image:repeating-linear-gradient(135deg,rgba(255,255,255,.07) 0 3px,transparent 3px 8px)}',

    /* losanges : treillis des dos de cartes ; rail à damier fin */
    'html[data-sb="losange"]::-webkit-scrollbar-thumb{background-image:linear-gradient(45deg,rgba(255,255,255,.3) 25%,transparent 25%,transparent 75%,rgba(255,255,255,.3) 75%),linear-gradient(45deg,rgba(0,0,0,.28) 25%,transparent 25%,transparent 75%,rgba(0,0,0,.28) 75%),linear-gradient(90deg,rgba(255,255,255,.2),rgba(0,0,0,.3));background-size:10px 10px,10px 10px,100% 100%;background-position:0 0,5px 5px,0 0}',
    'html[data-sb="losange"]::-webkit-scrollbar-track{background-image:linear-gradient(45deg,rgba(255,255,255,.07) 25%,transparent 25%,transparent 75%,rgba(255,255,255,.07) 75%);background-size:8px 8px}',

    /* papier : fibres et lignes d'écriture ; rail de parchemin sombre */
    'html[data-sb="papier"]::-webkit-scrollbar-thumb{background-image:repeating-linear-gradient(0deg,rgba(60,35,10,.28) 0 1px,transparent 1px 5px),radial-gradient(ellipse at 30% 40%,rgba(255,255,255,.22),transparent 60%),linear-gradient(90deg,rgba(255,255,255,.2),rgba(0,0,0,.28))}',
    'html[data-sb="papier"]::-webkit-scrollbar-track{background-image:repeating-linear-gradient(0deg,rgba(255,235,190,.07) 0 1px,transparent 1px 6px)}',

    /* grille : quadrillage d'écran de contrôle ; rail pointillé */
    'html[data-sb="grille"]::-webkit-scrollbar-thumb{background-image:linear-gradient(rgba(255,255,255,.22) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.22) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.2),rgba(0,0,0,.3));background-size:8px 8px,8px 8px,100% 100%}',
    'html[data-sb="grille"]::-webkit-scrollbar-track{background-image:radial-gradient(circle,rgba(255,255,255,.18) 0 .8px,transparent 1.2px);background-size:6px 6px}'
  ].join('\n');

  var style=document.createElement('style');
  style.id='soreal-idle-defilement-v1';
  style.textContent=CSS;
  (document.head||document.documentElement).appendChild(style);

  var racine=document.documentElement;
  var derniere='';

  function lire(cs,noms){
    for(var i=0;i<noms.length;i+=1){
      var v=String(cs.getPropertyValue(noms[i])||'').trim();
      if(v&&v.indexOf('var(')<0)return v;
    }
    return '';
  }

  function appliquer(){
    var page=document.querySelector('.soreal-idle-page-root-v28');
    var natif=document.querySelector('.soreal-idle-native-v4');
    var menu=page?String(page.getAttribute('data-menu')||''):'';
    var cs=page?getComputedStyle(page):natif?getComputedStyle(natif):null;
    if(!cs)return;
    var a=lire(cs,['--i-a','--th-a']);
    var b=lire(cs,['--i-b','--th-b']);
    var d=lire(cs,['--i-bg2','--th-bg2']);
    var signature=menu+'|'+a+'|'+b+'|'+d;
    if(signature===derniere)return;
    derniere=signature;
    var famille=FAMILLE_DE[menu]||'grille';
    if(racine.getAttribute('data-sb')!==famille)racine.setAttribute('data-sb',famille);
    if(a)racine.style.setProperty('--sb-a',a);
    if(b)racine.style.setProperty('--sb-b',b);
    /* rail : le fond le plus sombre du thème, ramené vers le noir pour que la poignée ressorte */
    racine.style.setProperty('--sb-d',d?'color-mix(in srgb,'+d+' 70%,#000)':'#120d1f');
  }

  appliquer();
  /* Une lecture légère toutes les 500 ms (seulement des lectures de style ; rien n'est écrit quand le thème ne change pas). */
  var minuterie=setInterval(function(){if(!document.hidden)appliquer();},500);
  if(minuterie&&typeof minuterie.unref==='function')minuterie.unref();

  window.__SOREAL_IDLE_DEFILEMENT_V1__={appliquer:appliquer,familles:FAMILLES,familleDe:function(m){return FAMILLE_DE[m]||'grille';}};
})();
