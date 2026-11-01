/*
 * SOREAL IDLE — pupilles en FENTE verticale des chats de la Garderie (Norman, 2026-11-01 : « les pupilles s'élargissent ou se contractent verticalement comme le font vraiment les chats »).
 * Les sprites de regard (/garderie/yeux/<id>-<n>.webp) portent une pupille dessinée ; pour la faire bouger sans toucher aux sprites, chaque iris reçoit deux éléments : un PATCH (couleur de l'iris, bord
 * adouci par un masque radial) qui recouvre la pupille dessinée, et la PUPILLE-FENTE noire (ellipse haute) dont la largeur varie en transform scaleX (jamais de layout, aucun filtre).
 * Mouvement : dilatation lente et irrégulière (le chat « regarde » : 18 % -> 30 % la fente s'ouvre presque ronde, se rétrécit, se resserre en fine fente quand la lumière du bocal est vive, puis revient) ;
 * durée DIFFÉRENTE par chat (7,7 à 12,7 s) et décalage négatif par œil. Règle n°3 : 0 % et 100 % ont la même valeur (boucle parfaite). Mouvement réduit : fente fixe.
 * Règle n°4 : tout est dessiné par le rendu de la page (même principe que les yeux : aucun état, aucune minuterie) ; un seul animation CSS par pupille, une seule par œil.
 * Yeux NON félins (gardent leur identité, pas de fente) : arcenciel (anneaux), fibonacci (spirale), matrix (glyphes), nega (croissant), tchernobyl (tache irrégulière).
 * window.__SOREAL_IDLE_ETAGERE_PUPILLES_V1__ = { skins, html(idSkin), css }.
 */
(function(){
  'use strict';
  if(typeof window==='undefined'||window.__SOREAL_IDLE_ETAGERE_PUPILLES_V1__)return;
  /* teinte du centre de l'iris (patch), pupille dessinée ronde ou fente, durée du cycle */
  var SKINS={
    defaut:{tone:'#9cc0d8',rond:1,d:9.3},
    noeud:{tone:'#b583dc',rond:0,d:11.1},
    dore:{tone:'#eba315',rond:0,d:7.7},
    chauvesouris:{tone:'#c92a2a',rond:0,d:12.7},
    pirate:{tone:'#bf7a2b',rond:1,d:10.4},
    noel:{tone:'#38b958',rond:1,d:8.6}
  };
  function html(id){
    var s=SKINS[id];
    if(!s)return '';
    css();
    var dl=-(s.d*0.37);   /* décalage fixe par chat : les deux yeux réagissent ensemble, et un redessin ne change jamais le style */
    return '<em class="et-pc'+(s.rond?' et-pc-r':'')+'" style="--pt:'+s.tone+'"></em><em class="et-pf" style="--pd:'+s.d+'s;--pdl:'+dl.toFixed(1)+'s"></em>';
  }
  function css(){
    if(typeof document==='undefined'||!document.head||document.getElementById('et-style-pupilles-v1'))return;
    var s=document.createElement('style');
    s.id='et-style-pupilles-v1';
    s.textContent=[
      '.et-pc{position:absolute;left:50%;top:50%;width:36%;height:104%;margin:0;transform:translate(-50%,-50%);background:var(--pt,#999);border-radius:50%;pointer-events:none;-webkit-mask-image:radial-gradient(closest-side,#000 62%,rgba(0,0,0,0));mask-image:radial-gradient(closest-side,#000 62%,rgba(0,0,0,0))}',
      '.et-pc.et-pc-r{width:68%;height:68%}',
      '.et-pf{position:absolute;left:50%;top:50%;width:44%;height:88%;margin:0;border-radius:50%;background:#050302;pointer-events:none;transform:translate(-50%,-50%) scaleX(.34);animation:etPup var(--pd,9s) ease-in-out var(--pdl,0s) infinite}',
      /* 0 % = 100 % (boucle parfaite) ; ouverte presque ronde vers 30 %, fine fente vers 62 % */
      '@keyframes etPup{0%,100%{transform:translate(-50%,-50%) scaleX(.34)}18%{transform:translate(-50%,-50%) scaleX(.4)}30%{transform:translate(-50%,-50%) scaleX(1)}46%{transform:translate(-50%,-50%) scaleX(.78)}62%{transform:translate(-50%,-50%) scaleX(.26)}80%{transform:translate(-50%,-50%) scaleX(.48)}}',
      '@media (prefers-reduced-motion:reduce){.et-pf{animation:none;transform:translate(-50%,-50%) scaleX(.34)}}'
    ].join('\n');
    document.head.appendChild(s);
  }
  window.__SOREAL_IDLE_ETAGERE_PUPILLES_V1__={skins:SKINS,html:html,css:css};
})();
