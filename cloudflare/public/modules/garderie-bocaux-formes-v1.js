/*
 * SOREAL IDLE — Garderie : formes de bocaux par apparence du chat, étiquette de niveau SOUS le bocal, ombrage du chat et cadrage du fond sur téléphone (Norman, 2026-11-01).
 * Module de STYLE seulement : il n'ajoute aucun calcul de jeu. Le liquide garde son mécanisme (même transform, même variable --gd-liq, mêmes ondes) ; seule la SILHOUETTE change :
 * la vitre (.gd-verre) reçoit un masque SVG statique (mask-image, 100 % x 100 %, courbes comprises) qui contient le liquide de 0 à 100 %, et un cadre dessiné (.gd-bocal::before,
 * SVG en fond) pose le verre, le bouchon, le nœud... L'apparence « défaut » garde le bocal classique. Aucune animation ici (règle n°3 : rien à boucler), aucun filtre ni ombre portée
 * répétés sur les 9 bocaux (perf APK), aucune règle forcée. Anti-spoil (règle n°2) : les formes ne dépendent que de data-skin, l'apparence ACTIVE (donc possédée) du chat affiché.
 * Boîte d'un bocal : rapport 100 x 157 (13,2 % x 13,8 % de l'image du chat 768 x 1152), tous les dessins sont en viewBox 0 0 100 157 (preserveAspectRatio none).
 * Cadrage téléphone (< 900 px) : le fond du grenier (1024 x 1536, ombre du plancher centrée à 49,8 % x 71,6 %) est posé pour que cette ombre tombe sous les pieds du chat, avec --gd-s = largeur de
 * la scène ; sous l'image le plancher se fond dans le brun sombre du cadre.
 * SIX récipients par apparence : rang 1 = FORMES ci-dessous, rangs 2 à 6 = garderie-bocaux-formes-a/b/c-v1.js, choisis par data-rang (numéro de la place) posé par daycare-page-v1.js.
 * Expose window.__SOREAL_IDLE_GARDERIE_FORMES_V1__ { formes, rangs, css, assurer }.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_GARDERIE_FORMES_V1__)return;

  /* [silhouette, cadre (SVG interne), haut de la zone de l'objet (en y / 157), bas, taille de l'icône en cqw, couleur du trait du verre, fond du verre] */
  const SVG_O='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 157" preserveAspectRatio="none">';
  const FORMES={
    /* Pretty Kitty : flacon de parfum (corps large, épaules, col doré, bouchon rose et nœud) */
    noeud:{d:'M41 16H59V31C59 37 97 38 97 62V136Q97 154 79 154H21Q3 154 3 136V62C3 38 41 37 41 31Z',
      deco:'<path d="M50 40L27 29V49Z M50 40L73 29V49Z" fill="#ff5fb8" stroke="#b02a78" stroke-width="1.4"/><circle cx="50" cy="40" r="5.5" fill="#ff8fcf" stroke="#b02a78" stroke-width="1.4"/><rect x="36" y="25" width="28" height="6" rx="2" fill="#f0c15a" stroke="#8a5d0c" stroke-width="1.2"/><rect x="35" y="3" width="30" height="19" rx="8" fill="#ff8fcf" stroke="#b02a78" stroke-width="1.6"/><path d="M41 8Q45 6 49 7" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>',
      trait:'#ffd6ec',hautObj:62,basObj:152,ico:52},
    /* Doré : lingot d'or (face supérieure biseautée) */
    dore:{d:'M23 24H77L98 144Q99 154 89 154H11Q1 154 2 144Z',
      deco:'<path d="M23 24H77L83 54H17Z" fill="rgba(255,248,180,.5)" stroke="#fff3a0" stroke-width="1.4"/><path d="M12 150L8 144M88 150L92 144" stroke="#8a5d00" stroke-width="1.4" fill="none"/>',
      trait:'#ffe27a',hautObj:56,basObj:150,ico:50},
    /* Chauve-souris (Halloween) : chaudron à sang, anses, pieds, bulles */
    chauvesouris:{d:'M2 32H98V46H90C100 72 100 120 82 142Q76 152 66 154H34Q24 152 18 142C0 120 0 72 10 46H2Z',
      deco:'<circle cx="38" cy="25" r="6" fill="rgba(255,60,60,.6)" stroke="#ff8a8a" stroke-width="1.2"/><circle cx="62" cy="22" r="4.5" fill="rgba(255,60,60,.6)" stroke="#ff8a8a" stroke-width="1.2"/><circle cx="6" cy="66" r="5" fill="none" stroke="#8a8398" stroke-width="2"/><circle cx="94" cy="66" r="5" fill="none" stroke="#8a8398" stroke-width="2"/><rect x="20" y="150" width="11" height="7" rx="2" fill="#2a2630"/><rect x="69" y="150" width="11" height="7" rx="2" fill="#2a2630"/><path d="M4 38H96" stroke="#b5aec4" stroke-width="1.6" fill="none"/>',
      trait:'#a79fb8',hautObj:52,basObj:148,ico:54,fond:'linear-gradient(90deg,rgba(40,30,50,.55),rgba(20,15,25,.35) 40%,rgba(30,22,40,.45) 72%,rgba(70,60,85,.55))'},
    /* Nyan (arc-en-ciel) : pop-tart glacé de rose avec ses paillettes */
    arcenciel:{d:'M10 24H90Q98 24 98 32V146Q98 154 90 154H10Q2 154 2 146V32Q2 24 10 24Z',
      deco:'<rect x="9" y="31" width="82" height="115" rx="7" fill="none" stroke="#ff9ad5" stroke-width="3"/><rect x="14" y="38" width="5" height="2.4" rx="1" fill="#ffe135" transform="rotate(30 16 39)"/><rect x="76" y="44" width="5" height="2.4" rx="1" fill="#4be07b" transform="rotate(-40 78 45)"/><rect x="20" y="136" width="5" height="2.4" rx="1" fill="#2fb5ff" transform="rotate(60 22 137)"/><rect x="74" y="132" width="5" height="2.4" rx="1" fill="#ff4a4a" transform="rotate(10 76 133)"/><rect x="46" y="29" width="5" height="2.4" rx="1" fill="#b24bff" transform="rotate(-20 48 30)"/>',
      trait:'#e9b27c',hautObj:40,basObj:148,ico:54},
    /* Fibonacci : fiole ballon, bouchon d'or, spirale dorée */
    fibonacci:{d:'M40 16H60V54C84 60 98 80 98 106C98 134 78 154 50 154C22 154 2 134 2 106C2 80 16 60 40 54Z',
      deco:'<path d="M50 112a7 7 0 0 1 7-7a12 12 0 0 1 12 12a20 20 0 0 1-20 20a33 33 0 0 1-33-33" fill="none" stroke="#ffe58a" stroke-width="1.8" stroke-linecap="round" opacity=".85"/><rect x="36" y="38" width="28" height="6" rx="2" fill="#e6b84a" stroke="#7a5a10" stroke-width="1.2"/><rect x="37" y="5" width="26" height="14" rx="5" fill="#e6b84a" stroke="#7a5a10" stroke-width="1.4"/>',
      trait:'#f3d77a',hautObj:70,basObj:150,ico:50},
    /* Matrix : PILULE ROUGE (remplace l'éprouvette, Norman 2026-11-01) ; son liquide est rouge (surcharge de --gd-liq pour le rang 1, garderie-bocaux-effets-v1.js) */
    matrix:{d:'M50 4Q76 4 76 30V126Q76 154 50 154Q24 154 24 126V30Q24 4 50 4Z',
      deco:'<path d="M24 80H76" stroke="#ffb0b0" stroke-width="2"/><path d="M33 26Q34 14 44 10" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".75"/><path d="M50 4Q76 4 76 30V126Q76 154 50 154Q24 154 24 126V30Q24 4 50 4Z" transform="translate(50 78) scale(.86) translate(-50 -78)" fill="none" stroke="#ffd0d0" stroke-width="1.1" vector-effect="non-scaling-stroke" opacity=".7"/>',
      trait:'#ff9a9a',hautObj:36,basObj:124,ico:34,fond:'linear-gradient(90deg,rgba(60,0,10,.5),rgba(45,0,8,.3) 40%,rgba(60,0,10,.4) 72%,rgba(170,40,50,.5))'},
    /* Tchernobyl : fût de matière radioactive (couvercle rayé, cerclages) */
    tchernobyl:{d:'M12 20H88Q94 20 94 26V146Q94 154 86 154H14Q6 154 6 146V26Q6 20 12 20Z',
      deco:'<rect x="4" y="14" width="92" height="13" rx="3" fill="#f2d700" stroke="#222" stroke-width="1.6"/><path d="M12 14L20 27M26 14L34 27M40 14L48 27M54 14L62 27M68 14L76 27M82 14L90 27" stroke="#222" stroke-width="3" fill="none"/><rect x="5" y="62" width="90" height="5" fill="rgba(30,30,0,.55)"/><rect x="5" y="112" width="90" height="5" fill="rgba(30,30,0,.55)"/>',
      trait:'#dbe94a',hautObj:34,basObj:150,ico:54},
    /* Pirate : bouteille de rhum (bouchon de liège, cire rouge, cordage) */
    pirate:{d:'M40 16H60V62C60 66 90 70 90 94V140Q90 154 76 154H24Q10 154 10 140V94C10 70 40 66 40 62Z',
      deco:'<rect x="37" y="3" width="26" height="15" rx="3" fill="#c99a5a" stroke="#6b4a1e" stroke-width="1.6"/><circle cx="45" cy="9" r="1.2" fill="#6b4a1e"/><circle cx="55" cy="12" r="1.2" fill="#6b4a1e"/><path d="M36 17H64V27Q58 36 54 29Q50 39 46 29Q41 34 36 27Z" fill="#b3202a" stroke="#6b0f16" stroke-width="1.2"/><path d="M39 46H61M39 53H61" stroke="#e1c283" stroke-width="2.6" fill="none"/>',
      trait:'#ffdca0',hautObj:84,basObj:150,ico:56},
    /* Noël : boule de Noël (calotte dorée et anneau) */
    noel:{d:'M2 104a48 48 0 1 0 96 0a48 48 0 1 0-96 0Z',
      deco:'<rect x="37" y="42" width="26" height="15" rx="3" fill="#f0c15a" stroke="#8a5d0c" stroke-width="1.4"/><circle cx="50" cy="32" r="9" fill="none" stroke="#f0c15a" stroke-width="2.6"/><path d="M27 92Q30 76 44 70" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>',
      trait:'#ffb3b3',hautObj:62,basObj:146,ico:50},
    /* Négatif : fiole de cristal sombre à facettes */
    nega:{d:'M36 12H64L96 48V120L70 154H30L4 120V48Z',
      deco:'<path d="M4 48H96M36 12L26 48L50 92L74 48L64 12M26 48L4 120M74 48L96 120M50 92L30 154M50 92L70 154" fill="none" stroke="rgba(190,140,255,.55)" stroke-width="1.2"/>',
      trait:'#b48cff',hautObj:48,basObj:150,ico:52,fond:'linear-gradient(90deg,rgba(30,10,60,.6),rgba(15,5,35,.4) 40%,rgba(25,10,50,.5) 72%,rgba(80,40,140,.55))'}
  };
  /* Couleur de l'ombre au sol de chaque chat (r,g,b) : plus chaude pour l'or, plus verte pour Matrix... */
  const OMBRES={defaut:'40,20,5',noeud:'92,30,50',arcenciel:'60,28,80',fibonacci:'70,46,0',dore:'96,58,0',matrix:'0,48,16',chauvesouris:'56,0,10',tchernobyl:'48,58,0',pirate:'36,18,0',noel:'60,10,10',nega:'36,8,70'};

  /* échelle des bocaux RANGÉS sur l'étagère (1 = pleine taille), par apparence */
  const ECHELLES={noeud:0.75};

  const uri=function(inner){return 'url("data:image/svg+xml,'+encodeURIComponent(SVG_O+inner+'</svg>')+'")';};
  const regle=function(id,f,rang){
    const S='.gd-etagere[data-skin="'+id+'"] '+(rang?'.gd-pot[data-rang="'+rang+'"] ':'');
    const masque=uri('<path d="'+f.d+'" fill="#000"/>');
    const cadre=uri('<path d="'+f.d+'" fill="none" stroke="'+f.trait+'" stroke-width="2.2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>'+f.deco);
    const verre=f.fond||'linear-gradient(90deg,rgba(255,255,255,.2),rgba(255,255,255,.05) 38%,rgba(255,255,255,.1) 70%,rgba(255,255,255,.24))';
    return [
      S+'.gd-bouchon,'+S+'.gd-col{display:none}',
      S+'.gd-verre{top:0;border:0;border-radius:0;box-shadow:none;background:'+verre+';-webkit-mask:'+masque+' 0 0/100% 100% no-repeat;mask:'+masque+' 0 0/100% 100% no-repeat}',
      S+'.gd-bocal::before{content:"";position:absolute;inset:0;z-index:6;pointer-events:none;background:'+cadre+' 0 0/100% 100% no-repeat}',
      S+'.gd-objet{inset:'+(f.hautObj/1.57).toFixed(1)+'cqh 10cqw '+((157-f.basObj)/1.57).toFixed(1)+'cqh}',
      S+'.gd-objet .idle-boost-icon-v1,'+S+'.gd-objet img{width:'+f.ico+'cqw;height:'+f.ico+'cqw}',
      S+'.gd-reflet{top:'+(f.hautObj/1.57+2).toFixed(1)+'cqh;bottom:'+((157-f.basObj)/1.57+6).toFixed(1)+'cqh}'
    ].join('\n');
  };

  function css(){
    const L=[];
    Object.keys(FORMES).forEach(function(id){L.push(regle(id,FORMES[id]));});
    /* RANGS 2 à 6 (garderie-bocaux-rangs-v1.js et formes-a/b/c) : la place n° k de l'étagère (data-rang = k) a sa propre silhouette ; le rang 1 reste la forme ci-dessus (ou le bocal classique du défaut) */
    const RG=window.__SOREAL_IDLE_GARDERIE_RANGS_V1__;
    if(RG&&RG.skins)Object.keys(RG.skins).forEach(function(id){RG.skins[id].forEach(function(f,i){
      L.push(regle(id,f,i+2));
      /* récipient agrandi (ex. nuage de Nyan, moniteur de Matrix : la place le permet) : transform statique ancré au pied, étiquette remise à sa taille, vue zoom à taille pleine */
      if(f.echelle){const S='.gd-etagere[data-skin="'+id+'"] .gd-pot[data-rang="'+(i+2)+'"]:not(.gdz-pot) ';L.push(S+'.gd-bocal{transform:scale('+f.echelle+');transform-origin:50% 100%}');L.push(S+'.gd-niv-badge{transform:translateX(-50%) scale('+(1/f.echelle).toFixed(3)+');transform-origin:50% 0}');}
    });});
    /* couleurs de liquide par rang et neige du globe (garderie-bocaux-effets-v1.js) */
    if(RG&&typeof RG.effets==='function')L.push(RG.effets());
    /* Pretty Kitty (noeud) : sa place est moindre, les flacons rangés sur l'étagère sont 25 % plus petits (transform statique ancré au pied du bocal, le pied reste sur la planche) ; l'étiquette est remise à sa taille ; la vue zoom (.gdz-pot) garde la taille pleine */
    Object.keys(ECHELLES).forEach(function(id){
      const k=ECHELLES[id],S='.gd-etagere[data-skin="'+id+'"] .gd-pot:not(.gdz-pot) ';
      L.push(S+'.gd-bocal{transform:scale('+k+');transform-origin:50% 100%}');
      L.push(S+'.gd-niv-badge{transform:translateX(-50%) scale('+(1/k).toFixed(3)+');transform-origin:50% 0}');
    });
    /* vide « ouvert » (choix d'un objet) : le trait passe à l'or même sur une forme dessinée */
    L.push('.gd-etagere[data-skin] .gd-vide.ouvert .gd-verre{background:rgba(245,193,75,.28)}');
    /* ÉTIQUETTE SOUS LE BOCAL (Norman, 2026-11-01 : « le fond doit se voir se remplir ») : posée juste sous le pied du bocal, jamais sur la vitre ; hors flux (aucun saut de mise en page) */
    L.push('.gd-pot .gd-niv-badge{top:calc(100% + 2.5cqw);bottom:auto;font-size:max(24cqw,8px);padding:.16em .5em;line-height:1.1}');
    /* OMBRAGE du chat : ombre douce au sol (ellipse aplatie, dégradé radial statique, aucun filtre), teinte par apparence ; sous le chat (z-index -1), jamais sur les bocaux ni leur étiquette */
    L.push('.gd-etagere::before{content:"";position:absolute;z-index:-1;left:5%;width:90%;bottom:-3.2%;height:8%;border-radius:50%;pointer-events:none;background:radial-gradient(closest-side,rgba(var(--gd-ombre,40,20,5),.5),rgba(var(--gd-ombre,40,20,5),.22) 55%,rgba(var(--gd-ombre,40,20,5),0))}');
    Object.keys(OMBRES).forEach(function(id){L.push('.gd-etagere[data-skin="'+id+'"]{--gd-ombre:'+OMBRES[id]+'}');});
    L.push('#soreal-idle-garderie-section .gd-scene::after{display:none}');
    /* CADRAGE TÉLÉPHONE / TABLETTE (< 900 px) : --gd-s = largeur de la scène ; le fond (1024 x 1536) mesure 1,45 x --gd-s de large ; son ombre (71,6 % de la hauteur) tombe au niveau du sol du chat ; en dessous le plancher se fond dans le brun du cadre */
    L.push('@media (max-width:899px){'+
      '#soreal-idle-garderie-section .gd-plein{container-type:inline-size;isolation:isolate;background:#3a2410}'+
      '#soreal-idle-garderie-section .gd-plein::before{--gd-s:min(100cqw - 36px,520px);--gd-haut:74.5px;content:"";position:absolute;inset:0;z-index:-1;border-radius:inherit;background:url(/garderie/fond-grenier-tel-v1.webp?v=1) no-repeat;background-size:calc(var(--gd-s) * 1.45) auto;background-position:50% calc(18px + var(--gd-haut) + var(--gd-s) * 1.174 - var(--gd-s) * 1.5578);-webkit-mask-image:linear-gradient(180deg,#000 calc(var(--gd-s) * 1.5 + 92px),rgba(0,0,0,0) calc(var(--gd-s) * 1.79 + 92px));mask-image:linear-gradient(180deg,#000 calc(var(--gd-s) * 1.5 + 92px),rgba(0,0,0,0) calc(var(--gd-s) * 1.79 + 92px))}'+
    '}');
    return L.join('\n');
  }
  function assurer(){
    if(typeof document==='undefined'||!document.head)return;
    let s=document.getElementById('gd-formes-style-v1');
    if(!s){s=document.createElement('style');s.id='gd-formes-style-v1';s.textContent=css();}
    document.head.appendChild(s);   /* (re)placé en dernier : à spécificité égale il passe après la feuille de la page */
  }
  window.__SOREAL_IDLE_GARDERIE_FORMES_V1__={formes:FORMES,rangs:function(){const RG=window.__SOREAL_IDLE_GARDERIE_RANGS_V1__;return RG?RG.skins:{};},ombres:OMBRES,css:css,assurer:assurer};
  assurer();
})();
