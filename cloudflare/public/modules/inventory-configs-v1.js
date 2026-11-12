/*
 * SOREAL IDLE — configurations d'équipement dans la zone du sac (Norman, 2026-11-12).
 *
 * « Je veux que les configurations d'équipement se trouvent dans la zone du sac. Je veux qu'on puisse choisir parmi une liste de dessins, pour que ce soit sur le bouton qui permet de sélectionner ce set. Une pièce d'or pour un
 * set gold, puissance magique, puissance énergie, cap magie, cap énergie... On doit pouvoir identifier ce que fait ce set juste avec l'image. »
 *
 * - Une bande de boutons-dessins (un par emplacement débloqué) : toucher = équiper ; le petit crayon ouvre l'éditeur (nom, dessin, enregistrer l'équipement porté, décaler).
 * - Un dessin = une icône de base (éclair = Énergie, orbe = Magie, pièce = Or...) + une pastille qui dit l'effet (flèche = Puissance, plafond = Cap, horloge = Vitesse, barres = Barres).
 *   Le catalogue couvre les 29 types d’effets d’objets du jeu (IDLE_SPECIAL_BONUS_TYPES_V1_, soreal-idle-ui.js) plus Puissance / Endurance / PV.
 * - ANTI-SPOIL (règle n°2) : l'éditeur ne propose que les dessins des effets déjà découverts (système débloqué) ; la bande n'existe que si au moins un emplacement est débloqué. Aucun total, aucun cadenas.
 * - Le serveur ne garde que l'identifiant du dessin (src/idle-inventory-auto-v1.js, mode loadoutIcon) ; ce module ne calcule aucune règle de jeu.
 * - Règle n°4 : la bande est dessinée par modules/inventory-auto-v1.js dans son bloc (data-morph-garder) ; l'éditeur est un nœud persistant rattaché à body (data-morph-garder).
 * Expose window.__SOREAL_IDLE_INV_CONFIGS_V1__ = { bande, ouvrir, fermer, rafraichir, catalogue, svg }.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_INV_CONFIGS_V1__)return;

  function html(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function entier(v){var n=Math.floor(Number(v));return Number.isFinite(n)?n:0;}

  /* ---------- dessins : contour sombre, aplats, un reflet (même esprit que les icônes .dsn-v1 du jeu) ---------- */
  var E='#16100c';
  function engrenage(){
    var d='';
    for(var i=0;i<8;i++){d+='<rect x="21" y="3" width="6" height="9" rx="1.500" transform="rotate('+(i*45)+' 24 24)"/>';}
    return '<g fill="#b9c2cf" stroke="'+E+'" stroke-width="2.600" stroke-linejoin="round">'+d+'<circle cx="24" cy="24" r="14"/></g><circle cx="24" cy="24" r="14" fill="#b9c2cf"/><circle cx="24" cy="24" r="5.500" fill="#2b3340" stroke="'+E+'" stroke-width="2"/><path d="M14 20a11 11 0 0 1 7-7" fill="none" stroke="#fff" stroke-width="2.400" stroke-linecap="round"/>';
  }
  var BASES={
    armure:'<path d="M14 6 6 12l4 8 4-2v24h20V18l4 2 4-8-8-6-5 4h-10z" fill="#8fa3bf" stroke="'+E+'" stroke-width="3" stroke-linejoin="round"/><path d="M16 12l3 4M32 12l-3 4" stroke="#e6eefb" stroke-width="2.400" stroke-linecap="round"/>',
    epee:'<path d="M36 5h7v7L21 34l-7-7z" fill="#dfe6ee" stroke="'+E+'" stroke-width="3" stroke-linejoin="round"/><path d="m12 29 7 7-4 4-7-7z" fill="#b5763a" stroke="'+E+'" stroke-width="3" stroke-linejoin="round"/><path d="m5 38 5 5" stroke="'+E+'" stroke-width="4" stroke-linecap="round"/>',
    bouclier:'<path d="M24 4 8 10v13c0 10 7 17 16 21 9-4 16-11 16-21V10z" fill="#5b7cc4" stroke="'+E+'" stroke-width="3" stroke-linejoin="round"/><path d="M24 4v40c-9-4-16-11-16-21V10z" fill="#7c9be0" opacity=".55"/><path d="M24 13v17M16 20h16" stroke="#e9f0ff" stroke-width="3" stroke-linecap="round"/>',
    coeur:'<path d="M24 42C8 31 5 21 8 15c3-6 12-6 16 1 4-7 13-7 16-1 3 6 0 16-16 27z" fill="#ff5a6e" stroke="'+E+'" stroke-width="3" stroke-linejoin="round"/><path d="M13 17c2-3 6-3 8 0" fill="none" stroke="#ffd0d6" stroke-width="3" stroke-linecap="round"/>',
    eclair:'<path d="M28 3 11 27h11l-3 18 19-26H27z" fill="#4ade80" stroke="'+E+'" stroke-width="3" stroke-linejoin="round"/><path d="M26 9 17 24h7" fill="none" stroke="#c9ffd9" stroke-width="2" stroke-linecap="round"/>',
    orbe:'<circle cx="24" cy="25" r="16" fill="#4f9bff" stroke="'+E+'" stroke-width="3"/><path d="M14 20a11 11 0 0 1 9-8" fill="none" stroke="#d6ecff" stroke-width="3" stroke-linecap="round"/><path d="m33 10 1.600 3.400 3.400 1.600-3.400 1.600L33 20l-1.600-3.400L28 15l3.400-1.600z" fill="#fff" stroke="'+E+'" stroke-width="1.400" stroke-linejoin="round"/>',
    gemme:'<path d="M24 4 40 14v20L24 44 8 34V14z" fill="#e0457b" stroke="'+E+'" stroke-width="3" stroke-linejoin="round"/><path d="M8 14l16 10 16-10M24 24v20" fill="none" stroke="#ffb3cc" stroke-width="2" stroke-linejoin="round"/>',
    or:'<circle cx="24" cy="24" r="18" fill="#f6c431" stroke="'+E+'" stroke-width="3"/><circle cx="24" cy="24" r="12" fill="none" stroke="#b8820f" stroke-width="3"/><path d="m24 15 3 6 6 .8-4.400 4.200 1 6-5.600-3-5.600 3 1-6-4.400-4.200 6-.8z" fill="#fff3b0" stroke="#b8820f" stroke-width="1.200" stroke-linejoin="round"/>',
    sac:'<path d="M18 9h12l-2 6h-8z" fill="#9a6a34" stroke="'+E+'" stroke-width="3" stroke-linejoin="round"/><path d="M19 15c-9 4-13 12-11 20 2 6 9 8 16 8s14-2 16-8c2-8-2-16-11-20z" fill="#c98f4b" stroke="'+E+'" stroke-width="3" stroke-linejoin="round"/><path d="m24 22 2.200 4.600 5 .7-3.600 3.500.9 5-4.500-2.400-4.500 2.400.9-5-3.600-3.500 5-.7z" fill="#fff3b0" stroke="#8a5a12" stroke-width="1.300" stroke-linejoin="round"/>',
    etoile:'<path d="m24 4 6 13 14 2-10 10 2.500 14L24 36l-12.500 7L14 29 4 19l14-2z" fill="#ff9d2e" stroke="'+E+'" stroke-width="3" stroke-linejoin="round"/><path d="m24 11 3.500 8 8 1.200" fill="none" stroke="#ffe0b0" stroke-width="2.400" stroke-linecap="round"/>',
    diamant:'<path d="M24 4 41 18 24 44 7 18z" fill="#7c9cff" stroke="'+E+'" stroke-width="3" stroke-linejoin="round"/><path d="M7 18h34M24 4l-6 14 6 26 6-26z" fill="none" stroke="#dbe5ff" stroke-width="2" stroke-linejoin="round"/>',
    barbe:'<path d="M7 11c0 20 6 33 17 33s17-13 17-33c-4 6-10 7-17 7S11 17 7 11z" fill="#b5763a" stroke="'+E+'" stroke-width="3" stroke-linejoin="round"/><path d="M17 27c3 3 11 3 14 0" fill="none" stroke="'+E+'" stroke-width="3" stroke-linecap="round"/><path d="M13 14c2 8 4 14 6 22" fill="none" stroke="#e0a766" stroke-width="2.400" stroke-linecap="round"/>',
    ngu:'<path d="M24 24c-4-8-13-10-16-4-3 7 6 11 16 4 10-7 19-3 16 4-3 6-12 4-16-4z" fill="none" stroke="'+E+'" stroke-width="10" stroke-linejoin="round"/><path d="M24 24c-4-8-13-10-16-4-3 7 6 11 16 4 10-7 19-3 16 4-3 6-12 4-16-4z" fill="none" stroke="#b36bff" stroke-width="5" stroke-linejoin="round"/>',
    graine:'<path d="M24 44V26" stroke="'+E+'" stroke-width="6" stroke-linecap="round"/><path d="M24 44V26" stroke="#5ec96a" stroke-width="2.600" stroke-linecap="round"/><path d="M24 28C13 29 7 22 7 12c11 0 17 6 17 16z" fill="#5ec96a" stroke="'+E+'" stroke-width="3" stroke-linejoin="round"/><path d="M24 24c0-10 6-17 17-17 0 11-7 18-17 17z" fill="#9be88a" stroke="'+E+'" stroke-width="3" stroke-linejoin="round"/><ellipse cx="24" cy="44" rx="14" ry="3" fill="#7a4d26" stroke="'+E+'" stroke-width="2.400"/>',
    arbre:'<path d="M20 44V28h8v16z" fill="#8a5a2c" stroke="'+E+'" stroke-width="3" stroke-linejoin="round"/><circle cx="24" cy="18" r="14" fill="#4fbf63" stroke="'+E+'" stroke-width="3"/><circle cx="17" cy="14" r="4" fill="#8be39b"/><circle cx="30" cy="22" r="3" fill="#ffd54a" stroke="'+E+'" stroke-width="1.400"/><circle cx="19" cy="24" r="2.600" fill="#ff7a7a" stroke="'+E+'" stroke-width="1.400"/>',
    lampe:'<path d="M6 32c0-7 7-11 16-11h8c9 0 12 5 12 10 0 6-6 10-14 10H19c-8 0-13-4-13-9z" fill="#e8b93e" stroke="'+E+'" stroke-width="3" stroke-linejoin="round"/><path d="M38 27c4-1 6-5 6-10" fill="none" stroke="'+E+'" stroke-width="3" stroke-linecap="round"/><path d="M16 21c0-4 4-7 8-7s8 3 8 7z" fill="#f6d36b" stroke="'+E+'" stroke-width="3" stroke-linejoin="round"/><path d="M12 29c1-2 4-3 8-3" fill="none" stroke="#fff3c0" stroke-width="2.400" stroke-linecap="round"/><path d="m27 6 1.400 3 3 1.400-3 1.400L27 15l-1.400-3.200-3-1.400 3-1.400z" fill="#9fe8ff" stroke="'+E+'" stroke-width="1.200" stroke-linejoin="round"/>',
    terminal:'<rect x="4" y="8" width="40" height="30" rx="4" fill="#0f2b1a" stroke="'+E+'" stroke-width="3"/><path d="m11 17 7 6-7 6" fill="none" stroke="#4ade80" stroke-width="3.400" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 29h12" stroke="#4ade80" stroke-width="3.400" stroke-linecap="round"/><path d="M14 43h20" stroke="'+E+'" stroke-width="4" stroke-linecap="round"/>',
    ecran:'<rect x="5" y="6" width="38" height="30" rx="4" fill="#d9d2bf" stroke="'+E+'" stroke-width="3"/><rect x="10" y="11" width="28" height="20" rx="2" fill="#6fb4ff" stroke="'+E+'" stroke-width="2.200"/><path d="M13 16h12" stroke="#e6f3ff" stroke-width="2.400" stroke-linecap="round"/><path d="M18 36v5h12v-5M14 43h20" fill="none" stroke="'+E+'" stroke-width="3.400" stroke-linecap="round" stroke-linejoin="round"/>',
    engrenage:engrenage(),
    ours:'<circle cx="11" cy="11" r="6" fill="#b5763a" stroke="'+E+'" stroke-width="3"/><circle cx="37" cy="11" r="6" fill="#b5763a" stroke="'+E+'" stroke-width="3"/><circle cx="24" cy="26" r="17" fill="#c98f4b" stroke="'+E+'" stroke-width="3"/><ellipse cx="24" cy="31" rx="7" ry="5.500" fill="#f0cf9d" stroke="'+E+'" stroke-width="2.400"/><circle cx="17" cy="22" r="2.400" fill="'+E+'"/><circle cx="31" cy="22" r="2.400" fill="'+E+'"/><ellipse cx="24" cy="29" rx="2.600" ry="1.800" fill="'+E+'"/>',
    marmite:'<path d="M7 22h34v12c0 7-7 10-17 10S7 41 7 34z" fill="#8b95a6" stroke="'+E+'" stroke-width="3" stroke-linejoin="round"/><path d="M7 26H3M41 26h4" stroke="'+E+'" stroke-width="3.400" stroke-linecap="round"/><ellipse cx="24" cy="22" rx="17" ry="4.500" fill="#59616f" stroke="'+E+'" stroke-width="3"/><path d="M16 15c-3-3 3-5 0-9M25 15c-3-3 3-5 0-9M34 15c-3-3 3-5 0-9" fill="none" stroke="#f1f5ff" stroke-width="2.600" stroke-linecap="round"/><path d="M12 30c1 4 4 6 8 7" fill="none" stroke="#c9d1de" stroke-width="2.400" stroke-linecap="round"/>',
    parchemin:'<path d="M10 8h28v28c0 4 3 4 3 4H14c-4 0-4-4-4-4z" fill="#f1deb0" stroke="'+E+'" stroke-width="3" stroke-linejoin="round"/><path d="M10 8c-5 0-5 8 0 8h2" fill="none" stroke="'+E+'" stroke-width="3" stroke-linecap="round"/><path d="M17 20h16M17 26h16M17 32h10" stroke="#8a6a2c" stroke-width="2.600" stroke-linecap="round"/>',
    haltere:'<path d="M14 24h20" stroke="'+E+'" stroke-width="9" stroke-linecap="round"/><path d="M14 24h20" stroke="#b9c2cf" stroke-width="4" stroke-linecap="round"/><rect x="5" y="12" width="9" height="24" rx="3" fill="#ff8b3d" stroke="'+E+'" stroke-width="3"/><rect x="34" y="12" width="9" height="24" rx="3" fill="#ff8b3d" stroke="'+E+'" stroke-width="3"/><path d="M8 16v8M37 16v8" stroke="#ffd0a8" stroke-width="2.200" stroke-linecap="round"/>',
    crane:'<path d="M24 4C13 4 7 12 7 21c0 6 3 9 6 11v6h22v-6c3-2 6-5 6-11 0-9-6-17-17-17z" fill="#eef0f4" stroke="'+E+'" stroke-width="3" stroke-linejoin="round"/><circle cx="16.500" cy="22" r="4.500" fill="'+E+'"/><circle cx="31.500" cy="22" r="4.500" fill="'+E+'"/><path d="M22 29l2 3 2-3zM19 38v-4M24 38v-4M29 38v-4" stroke="'+E+'" stroke-width="2.600" stroke-linecap="round" stroke-linejoin="round"/>',
    recharge:'<path d="M39 20A16 16 0 1 0 38 31" fill="none" stroke="'+E+'" stroke-width="9" stroke-linecap="round"/><path d="M39 20A16 16 0 1 0 38 31" fill="none" stroke="#ffd45e" stroke-width="4.400" stroke-linecap="round"/><path d="m41 6 1 15-15-1z" fill="#ffd45e" stroke="'+E+'" stroke-width="2.600" stroke-linejoin="round"/>'
  };
  /* pastilles d'effet (dessinées dans un carré de 24) */
  var MODS={
    puissance:{fond:'#9b2f2f',svg:'<path d="M12 3 4 13h5v8h6v-8h5z" fill="#fff" stroke="'+E+'" stroke-width="1.600" stroke-linejoin="round"/>'},
    plafond:{fond:'#2f6b9b',svg:'<path d="M4 4h16" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M12 8v12M7 13l5-5 5 5" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'},
    vitesse:{fond:'#8a5a12',svg:'<circle cx="12" cy="12" r="8.500" fill="none" stroke="#fff" stroke-width="3"/><path d="M12 7v5l3.500 2" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'},
    barres:{fond:'#4b4b9b',svg:'<path d="M5 20V12M12 20V5M19 20V9" stroke="#fff" stroke-width="4" stroke-linecap="round"/>'}
  };

  /*
   * Catalogue : [identifiant, nom affiché, groupe, icône de base, pastille, condition de découverte].
   * Condition : '' = toujours ; 'magic' / 'r3' = ressource découverte ; 'daycare' = onglet Garderie ; sinon identifiant d'un système (j.systemes.systems ne contient que les systèmes débloqués).
   */
  var GROUPES=['Combat','Énergie','Magie','Butin et progression','Systèmes'];
  var CATALOGUE=[
    ['puissance','Puissance','Combat','epee','',''],
    ['endurance','Endurance','Combat','bouclier','',''],
    ['pv','Points de vie','Combat','coeur','',''],
    ['energie-vitesse','Vitesse','Énergie','eclair','vitesse',''],
    ['energie-puissance','Puissance','Énergie','eclair','puissance',''],
    ['energie-plafond','Plafond','Énergie','eclair','plafond',''],
    ['energie-barres','Barres','Énergie','eclair','barres',''],
    ['magie-vitesse','Vitesse','Magie','orbe','vitesse','magic'],
    ['magie-puissance','Puissance','Magie','orbe','puissance','magic'],
    ['magie-plafond','Plafond','Magie','orbe','plafond','magic'],
    ['magie-barres','Barres','Magie','orbe','barres','magic'],
    ['r3-puissance','Ressource 3 : puissance','Butin et progression','gemme','puissance','r3'],
    ['r3-plafond','Ressource 3 : plafond','Butin et progression','gemme','plafond','r3'],
    ['r3-barres','Ressource 3 : barres','Butin et progression','gemme','barres','r3'],
    ['or','Or','Butin et progression','or','',''],
    ['butin','Chance de butin','Butin et progression','sac','',''],
    ['exp','EXP','Butin et progression','etoile','',''],
    ['ap','Points AP','Butin et progression','diamant','',''],
    ['repousse','Réapparition','Butin et progression','crane','vitesse',''],
    ['recharge','Recharge des mouvements','Butin et progression','recharge','',''],
    ['quetes','Butin de quêtes','Systèmes','parchemin','','questing'],
    ['entrainement','Entraînement avancé','Systèmes','haltere','','advancedTraining'],
    ['augment-vitesse','Augmentations','Systèmes','engrenage','vitesse','augmentations'],
    ['ngu-vitesse','NGU','Systèmes','ngu','vitesse','ngu'],
    ['barbe-vitesse','Barbes','Systèmes','barbe','vitesse','beards'],
    ['graine','Graines','Systèmes','graine','','yggdrasil'],
    ['arbre','Rendement Yggdrasil','Systèmes','arbre','puissance','yggdrasil'],
    ['voeu-vitesse','Souhaits','Systèmes','lampe','vitesse','wishes'],
    ['hack-vitesse','Hacks','Systèmes','terminal','vitesse','hacks'],
    ['wandoos-vitesse','Wandoos','Systèmes','ecran','vitesse','wandoos'],
    ['cuisine','Cuisine','Systèmes','marmite','','cooking'],
    ['garderie','Garderie','Systèmes','ours','vitesse','daycare']
  ];
  var PAR_ID={};
  CATALOGUE.forEach(function(d){PAR_ID[d[0]]={id:d[0],nom:d[1],groupe:d[2],base:d[3],mod:d[4],requis:d[5]};});

  function svg(id){
    var d=PAR_ID[id]||null;
    var base=BASES[d?d.base:'armure']||BASES.armure;
    var m=d&&d.mod?MODS[d.mod]:null;
    var badge=m?'<g transform="translate(26 26)"><circle cx="11" cy="11" r="11" fill="'+m.fond+'" stroke="'+E+'" stroke-width="2.400"/><g transform="translate(3 3) scale(.6667)">'+m.svg+'</g></g>':'';
    return '<svg class="ic-dessin-v1" viewBox="0 0 48 48" aria-hidden="true" focusable="false">'+base+badge+'</svg>';
  }

  /* ---------- découverte (anti-spoil) ---------- */
  function etat(j){return (j&&j.systemes)||{};}
  function aSysteme(j,id){var l=etat(j).systems;return Array.isArray(l)&&l.some(function(x){return x&&x.id===id;});}
  function decouvert(j,req){
    if(!req)return true;
    var s=etat(j);
    if(req==='magic')return !!(s.ressourcesDecouvertes&&s.ressourcesDecouvertes.magic);
    if(req==='r3')return !!(s.r3NomDisponible||(s.ressourcesDecouvertes&&s.ressourcesDecouvertes.r3));
    if(req==='daycare'){var G=window.__SOREAL_IDLE_DAYCARE_PAGE_V1__;try{return !!(G&&typeof G.disponible==='function'&&G.disponible(j));}catch(_e){return false;}}
    if(req==='questing')return !!(s.questing&&s.questing.unlocked===true);
    if(req==='advancedTraining')return !!(s.advancedTrainingView&&s.advancedTrainingView.unlocked===true);
    return aSysteme(j,req);
  }
  /* Dessins proposés : ceux dont l'effet est découvert, plus celui déjà choisi (jamais un dessin retiré sous les yeux du joueur). */
  function catalogue(j,choisi){
    return CATALOGUE.filter(function(d){return d[0]===choisi||decouvert(j,d[5]);}).map(function(d){return PAR_ID[d[0]];});
  }

  /* ---------- données ---------- */
  function snap(j){return j&&j.systemes&&j.systemes.inventoryAuto||null;}
  function aventure(j){return j&&j.systemes&&j.systemes.adventure||null;}
  var dernierEtat=null;
  function fmt(n,dec){var f=window.__SOREAL_IDLE_REG__&&window.__SOREAL_IDLE_REG__.formatGrandNombreIdleV70_;return f?f(n,dec):String(Math.round(Number(n)*100)/100);}
  function lib(k){var f=window.__SOREAL_IDLE_REG__&&window.__SOREAL_IDLE_REG__.idleLabelSpecialBonusV1_;return f?f(k):String(k);}
  function identifiantsPortes(a){
    var e=(a&&a.equipment)||{};
    var ids=[e.head,e.chest,e.legs,e.boots,e.weapon,e.weapon2].concat(Array.isArray(e.accessories)?e.accessories:[]).filter(Boolean).map(String);
    return ids.sort().join('|');
  }
  function identifiantsConfig(lo){return (lo&&Array.isArray(lo.items)?lo.items:[]).map(function(x){return String(x.id);}).sort().join('|');}
  function totalHtml(t){
    if(!t)return '';
    var p=[];
    if(t.power>0)p.push('<span>Puissance <b>'+html(fmt(t.power))+'</b></span>');
    if(t.toughness>0)p.push('<span>Endurance <b>'+html(fmt(t.toughness))+'</b></span>');
    if(t.hp>0)p.push('<span>PV max <b>'+html(fmt(t.hp))+'</b></span>');
    if(t.regen>0)p.push('<span>Regen PV <b>'+html(fmt(t.regen,2))+'</b></span>');
    Object.keys(t.specials||{}).forEach(function(k){var v=Number(t.specials[k])||0;if(v>0)p.push('<span>'+html(lib(k))+' <b>+'+html(fmt(v,2))+'</b></span>');});
    return p.length?'<div class="ic-total">'+p.join('')+'</div>':'';
  }

  /* ---------- bande des configurations (dans le bloc de modules/inventory-auto-v1.js) ---------- */
  function bulle(i,lo,vide,libelle){
    return '<div class="ic-bulle" role="tooltip"><b>'+(i+1)+'. '+html(libelle)+'</b>'+(vide?'vide':html((lo.items||[]).map(function(x){return x.name||'objet absent';}).join(', ')))+totalHtml(lo&&lo.total)+'</div>';
  }
  /* Bloc FERMÉ (Norman, 2026-11-12 : « une ligne fine avec les cases à cocher et les icônes, en plus petit ») : une petite icône par configuration, plus UN seul « + » (la première case libre). Toucher une icône équipe ; le détail (noms, crayon, totaux) est dans le bloc ouvert. */
  function mini(j){
    var s=snap(j),a=aventure(j);
    if(!s||!a)return '';
    var nb=Math.max(0,entier(s.loadoutSlots));
    if(nb<1)return '';
    var los=Array.isArray(s.loadouts)?s.loadouts:[];
    var portes=identifiantsPortes(a);
    var cases=[],libreVue=false;
    for(var i=0;i<nb;i++){
      var lo=los[i]||null;
      var vide=!lo||lo.vide||!(lo.items&&lo.items.length);
      var nom=lo&&lo.name?String(lo.name):'';
      if(vide&&!nom&&!(lo&&lo.icon)){
        if(libreVue)continue;
        libreVue=true;
        cases.push('<span class="ic-cfg ic-vide"><button type="button" class="ic-mini-bt" aria-label="Enregistrer mon équipement actuel dans la configuration '+(i+1)+'" onclick="window.__inventaireAutoConfigV1__(\'sauver\','+i+')">+</button></span>');
        continue;
      }
      var actif=!vide&&identifiantsConfig(lo)===portes;
      var libelle=nom||('Configuration '+(i+1));
      cases.push('<span class="ic-cfg'+(actif?' ic-actif':'')+'"><button type="button" class="ic-mini-bt" '+(vide?'disabled ':'')+'aria-label="Équiper : '+html(libelle)+'" onclick="window.__inventaireAutoConfigV1__(\'equiper\','+i+')">'+svg(lo&&lo.icon||'')+'</button>'+bulle(i,lo,vide,libelle)+'</span>');
    }
    return '<span class="ic-mini">'+cases.join('')+'</span>';
  }
  /* Bloc OUVERT : le détail. `bascule` = le bouton de repli, placé dans l'en-tête quand la barre des cases n'existe pas. */
  function bande(j,bascule){
    var s=snap(j),a=aventure(j);
    if(!s||!a)return '';
    var nb=Math.max(0,entier(s.loadoutSlots));
    if(nb<1)return '';
    var los=Array.isArray(s.loadouts)?s.loadouts:[];
    var portes=identifiantsPortes(a);
    var cases=[];
    for(var i=0;i<nb;i++){
      var lo=los[i]||null;
      var vide=!lo||lo.vide||!(lo.items&&lo.items.length);
      var nom=lo&&lo.name?String(lo.name):'';
      if(vide&&!nom&&!(lo&&lo.icon)){
        cases.push('<div class="ic-cfg ic-vide"><button type="button" class="ic-bouton" aria-label="Enregistrer mon équipement actuel dans la configuration '+(i+1)+'" onclick="window.__inventaireAutoConfigV1__(\'sauver\','+i+')">+</button><span class="ic-nom">'+(i+1)+'</span></div>');
        continue;
      }
      var actif=!vide&&identifiantsConfig(lo)===portes;
      var libelle=nom||('Configuration '+(i+1));
      cases.push('<div class="ic-cfg'+(vide?' ic-vide-nommee':'')+(actif?' ic-actif':'')+'">'+
        '<button type="button" class="ic-bouton" '+(vide?'disabled ':'')+'aria-label="Équiper : '+html(libelle)+'" onclick="window.__inventaireAutoConfigV1__(\'equiper\','+i+')">'+svg(lo&&lo.icon||'')+'</button>'+
        '<span class="ic-num" aria-hidden="true">'+(i+1)+'</span>'+
        '<button type="button" class="ic-crayon" aria-label="Modifier la configuration '+(i+1)+'" onclick="window.__inventaireAutoConfigV1__(\'editer\','+i+')"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1-5L16 4l4 4L9 19z" fill="currentColor"/></svg></button>'+
        '<span class="ic-nom">'+html(nom||('Config. '+(i+1)))+'</span>'+
        bulle(i,lo,vide,libelle)+
      '</div>');
    }
    return '<div class="ic-configs"><div class="ic-configs-tete"><b>Configurations</b><span>Touche : équipe · crayon : modifie</span>'+(bascule||'')+'</div><div class="ic-bande">'+cases.join('')+'</div></div>';
  }

  /* ---------- éditeur ---------- */
  var idx=-1;
  function noeud(){
    var n=document.getElementById('soreal-idle-inv-editeur-v1');
    if(n)return n;
    n=document.createElement('div');
    n.id='soreal-idle-inv-editeur-v1';
    n.className='ic-voile';
    n.setAttribute('data-morph-garder','1');
    n.setAttribute('data-morph-vivant','1');
    n.addEventListener('click',function(ev){if(ev.target===n)fermer();});
    document.body.appendChild(n);
    return n;
  }
  function contenuEditeur(j){
    var s=snap(j);
    var lo=s&&Array.isArray(s.loadouts)?s.loadouts[idx]:null;
    var nom=lo&&lo.name?String(lo.name):'';
    var choisi=lo&&lo.icon?String(lo.icon):'';
    var vide=!lo||lo.vide||!(lo.items&&lo.items.length);
    var nb=Math.max(0,entier(s&&s.loadoutSlots));
    var liste=catalogue(j,choisi);
    var parGroupe=GROUPES.map(function(g){
      var l=liste.filter(function(d){return d.groupe===g;});
      if(!l.length)return '';
      return '<div class="ic-groupe">'+html(g)+'</div><div class="ic-choix">'+l.map(function(d){
        return '<button type="button" class="ic-dessin'+(d.id===choisi?' ic-choisi':'')+'" aria-pressed="'+(d.id===choisi?'true':'false')+'" onclick="window.__inventaireAutoConfigV1__(\'dessin\','+idx+',\''+d.id+'\')">'+svg(d.id)+'<span>'+html(d.nom)+'</span></button>';
      }).join('')+'</div>';
    }).join('');
    return '<div class="ic-fenetre" role="dialog" aria-modal="true" aria-labelledby="ic-titre">'+
      '<h2 id="ic-titre">Configuration '+(idx+1)+'</h2>'+
      '<div class="ic-champ"><input type="text" id="ic-nom-champ" maxlength="24" value="'+html(nom)+'" placeholder="Nom (ex. : Boss, Aventure…)" aria-label="Nom de la configuration" onchange="window.__inventaireAutoConfigV1__(\'nom\','+idx+',this.value)"></div>'+
      '<div class="ic-groupe ic-groupe-tete">Choisis un dessin</div>'+parGroupe+
      '<div class="ic-actions">'+
        '<button type="button" class="ic-bt" onclick="window.__inventaireAutoConfigV1__(\'sauver\','+idx+')">'+(vide?'Enregistrer mon équipement ici':'Remplacer par mon équipement actuel')+'</button>'+
        '<button type="button" class="ic-bt ic-sec"'+(idx<=0?' disabled':'')+' onclick="window.__inventaireAutoConfigV1__(\'gauche\','+idx+')">◀ Décaler</button>'+
        '<button type="button" class="ic-bt ic-sec"'+(idx>=nb-1?' disabled':'')+' onclick="window.__inventaireAutoConfigV1__(\'droite\','+idx+')">Décaler ▶</button>'+
        '<button type="button" class="ic-bt ic-sec" onclick="window.__SOREAL_IDLE_INV_CONFIGS_V1__.fermer()">Fermer</button>'+
      '</div></div>';
  }
  function dessiner(){
    var n=document.getElementById('soreal-idle-inv-editeur-v1');
    if(!n||idx<0||!dernierEtat)return;
    var champ=document.getElementById('ic-nom-champ');
    var saisie=champ&&document.activeElement===champ;
    var defil=n.firstChild?n.firstChild.scrollTop:0;
    var neuf=contenuEditeur(dernierEtat);
    if(n.getAttribute('data-sig')===neuf)return;
    if(saisie){
      /* le nom en cours de frappe n'est jamais écrasé : seuls les dessins et les boutons sont mis à jour */
      var valeur=champ.value;n.innerHTML=neuf;var c2=document.getElementById('ic-nom-champ');if(c2){c2.value=valeur;c2.focus();}
    }else n.innerHTML=neuf;
    n.setAttribute('data-sig',neuf);
    if(n.firstChild)n.firstChild.scrollTop=defil;
  }
  function ouvrir(i,j){
    if(j)dernierEtat=j;
    idx=entier(i);
    var n=noeud();
    n.removeAttribute('data-sig');
    n.classList.add('ic-ouvert');
    dessiner();
    var champ=document.getElementById('ic-nom-champ');
    if(champ&&window.matchMedia&&!window.matchMedia('(pointer:coarse)').matches){try{champ.focus({preventScroll:true});}catch(_e){}}
  }
  function fermer(){
    idx=-1;
    var n=document.getElementById('soreal-idle-inv-editeur-v1');
    if(n){n.classList.remove('ic-ouvert');n.removeAttribute('data-sig');n.innerHTML='';}
  }
  function rafraichir(j){
    if(j)dernierEtat=j;
    if(idx>=0)dessiner();
  }
  document.addEventListener('keydown',function(ev){if(ev.key==='Escape'&&idx>=0){fermer();ev.stopPropagation();}},true);

  window.__SOREAL_IDLE_INV_CONFIGS_V1__={bande:bande,mini:mini,ouvrir:ouvrir,fermer:fermer,rafraichir:rafraichir,catalogue:catalogue,svg:svg,CATALOGUE:CATALOGUE,etat:function(j){dernierEtat=j;}};
})();
