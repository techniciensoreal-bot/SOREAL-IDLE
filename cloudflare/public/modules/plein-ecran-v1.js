/*
 * Bouton « plein écran / écran normal » (Norman, 2026-10-29 : « sur PC, en haut à droite, dans la partie vide à droite du cadre Temps, un simple bouton plein écran / écran normal »).
 * Le bouton fait partie du bandeau (ui-aventure-1-v1.js, resumeStatsIdleV28_) : dernière case de la rangée des chiffres, PC seulement (le téléphone est déjà en plein écran). Son dessin passe de « agrandir » à « réduire » par la pseudo-classe
 * :fullscreen du CSS (aucun attribut à réécrire : le redessin périodique de la page ne peut ni le casser ni le faire clignoter, règle n°4). Si le navigateur ne sait pas passer en plein écran (WebView Android…), le bouton n'existe pas.
 */
(function(){
  'use strict';
  var racine=document.documentElement;
  var possible=false;
  try{possible=Boolean(document.fullscreenEnabled&&racine.requestFullscreen);}catch(_e){possible=false;}
  if(!possible)racine.classList.add('pe-indispo');
  function plein(){try{return Boolean(document.fullscreenElement);}catch(_e){return false;}}
  window.__sorealPleinEcranV1__=function(){
    try{
      if(plein()){if(document.exitFullscreen)document.exitFullscreen();}
      else if(racine.requestFullscreen){var p=racine.requestFullscreen();if(p&&p.catch)p.catch(function(){});}
    }catch(_e){/* refusé par le navigateur : rien */}
  };
  /*
   * Actualiser dans l'application Windows (Norman, 2026-10-29 : « F5 et Ctrl+R ne marchent pas »). Sans menu, Electron n'a plus ces raccourcis ; le cœur de l'application les rétablit (desktop/coeur.js, before-input-event) mais il ne se charge qu'avec la mise à jour installée
   * ET validée (20 s de fenêtre ouverte). Cette écoute dans la page double le cœur : elle arrive avec les fichiers du jeu, dès le premier redémarrage. Quand le cœur a déjà traité la touche, la page ne la reçoit pas (jamais deux actualisations).
   */
  if(window.sorealDesktop){
    document.addEventListener('keydown',function(e){
      var k=String(e.key||'').toLowerCase();
      if(e.altKey||!(k==='f5'||((e.ctrlKey||e.metaKey)&&k==='r')))return;
      e.preventDefault();
      try{location.reload();}catch(_e){/* rien */}
    },true);
  }
  if(document.getElementById('soreal-idle-plein-ecran-style-v1'))return;
  var s=document.createElement('style');s.id='soreal-idle-plein-ecran-style-v1';
  s.textContent=[
    '.soreal-idle-pe-v1{appearance:none;-webkit-appearance:none;display:none;align-items:center;justify-content:center;padding:0;cursor:pointer;color:var(--th-dim,#9fb0d8);background:linear-gradient(165deg,var(--th-bg,#0d1426),var(--th-bg2,#0a1020));border:1px solid var(--th-line,#2a3a66);border-bottom:3px solid var(--th-a,#5b8cff);border-radius:4px;box-shadow:0 6px 16px -10px var(--th-glow,#5b8cff);touch-action:manipulation;-webkit-tap-highlight-color:transparent}',
    '.soreal-idle-pe-v1:hover{color:#fff}.soreal-idle-pe-v1:active{transform:translateY(1px)}',
    '.soreal-idle-pe-v1 svg{display:block;width:18px;height:18px}',
    'html:not(:fullscreen) .soreal-idle-pe-v1 .pe-sor{display:none}html:fullscreen .soreal-idle-pe-v1 .pe-ent{display:none}',
    /* PC seulement : une colonne de plus à la fin de la rangée des chiffres (largeur fixe), le bouton y tient quel que soit le nombre de cases */
    '@media (min-width:701px){html:not(.pe-indispo) .soreal-idle-hud-v2 .soreal-idle-summary-grid-v28[style*="--nb-tuiles"]{grid-template-columns:repeat(var(--nb-tuiles),minmax(0,1fr)) 38px!important}html:not(.pe-indispo) .soreal-idle-pe-v1{display:flex}}'
  ].join('\n');
  (document.head||racine).appendChild(s);
})();
