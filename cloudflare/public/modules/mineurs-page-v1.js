/*
 * SOREAL IDLE — page « Mineurs d'or » (Norman, 2026-10-27 : « on va retravailler complètement le menu ; il faut que ce soit représentatif de ce que ça fait ; chaque dessin adapté à ce que ça fait, original ; les ouvriers ont des pelles,
 * pas des pioches ; il faut qu'ils aient l'air de travailler, pas juste la pelle »).
 *
 * Une coupe de mine : des GALERIES par profondeur (les mineurs sont rangés par coût, du plus proche au plus profond) ; chaque mineur est un ouvrier DESSINÉ en SVG, avec son propre décor et son propre geste : il se penche, creuse, soulève la pelle, balance
 * la terre dans la brouette ou sur le tas… et ce qui vole est ce que le mineur rapporte (butin, charbon pour le vieil ordinateur, étincelles d'énergie, cristaux de magie, sang, étoiles de PP, billes d'EXP…). Au repos, l'ouvrier s'appuie sur sa pelle, immobile.
 * Seuls transform et opacity sont animés ; toutes les boucles ont la même période (1,8 s) et finissent là où elles commencent ; mouvement réduit : tout est immobile.
 *
 * Anti-spoil (AGENTS.md règle n°2) : une galerie n'apparaît que quand la précédente a au moins un mineur engagé ; jamais un prix ni un nom de ce qui n'est pas encore atteint.
 * Les chiffres affichés (bonus, drain, coût) viennent du moteur (j.systemes.diggerView, idle-ngu-systemes.js : diggerViewV1), aucune formule n'est refaite ici.
 * Dépendances : window.__SOREAL_IDLE_META_HOST_V130__ et window.__SOREAL_IDLE_META_PARTAGE_V130__, lus à l'exécution. Expose window.__SOREAL_IDLE_MINEURS_PAGE_V1__.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_MINEURS_PAGE_V1__)return;

  function H(){return window.__SOREAL_IDLE_META_HOST_V130__;}
  function systemeMetaParIdIdleV130_(){return window.__SOREAL_IDLE_META_PARTAGE_V130__.systemeMetaParIdIdleV130_.apply(null,arguments);}

  /* Les galeries, de la plus proche de la surface à la plus profonde (mêmes paliers de coût que le moteur). */
  var GALERIES=[
    {cls:'g1',titre:'Les galeries du haut',ids:['drop','wandoos','stats','adventure']},
    {cls:'g2',titre:'Les galeries du milieu',ids:['energyNgu','magicNgu']},
    {cls:'g3',titre:'Sous la barbe',ids:['energyBeard','magicBeard']},
    {cls:'g4',titre:'Le fond des puits',ids:['pp','daycare']},
    {cls:'g5',titre:'Là où ça brûle',ids:['blood','experience']}
  ];
  /* Nom, ce que le mineur améliore, et ce que fait son ouvrier. */
  var INFOS={
    drop:{nom:'Mineur de chance de drop',effet:'chance de drop'},
    wandoos:{nom:'Mineur de Wandoos',effet:'rendement de Wandoos'},
    stats:{nom:'Mineur de stats',effet:'tes statistiques'},
    adventure:{nom:'Mineur d’Aventure',effet:'stats d’Aventure'},
    energyNgu:{nom:'Mineur de NGU d’énergie',effet:'vitesse des NGU d’énergie'},
    magicNgu:{nom:'Mineur de NGU de magie',effet:'vitesse des NGU de magie'},
    energyBeard:{nom:'Mineur de barbe d’énergie',effet:'vitesse des barbes d’énergie'},
    magicBeard:{nom:'Mineur de barbe de magie',effet:'vitesse des barbes de magie'},
    pp:{nom:'Mineur de PP',effet:'gain de PP'},
    daycare:{nom:'Mineur de garderie',effet:'vitesse de la garderie'},
    blood:{nom:'Mineur de sang',effet:'gain de sang'},
    experience:{nom:'Mineur d’EXP',effet:'gain d’EXP'}
  };

  /* ---------- le dessin ---------- */
  var CONTOUR='stroke="#000" stroke-width="1.6" stroke-linejoin="round"';
  var PEAU='#e8b98a';
  /* chapeaux : un par ouvrier, pour qu'on les reconnaisse au premier coup d'œil */
  var CHAPEAUX={
    casque:'<path d="M32 29a8 8 0 0 1 16 0z" fill="#e0a21a" '+CONTOUR+'/><rect x="30.5" y="28" width="19" height="2.6" rx="1.2" fill="#b37c10" '+CONTOUR+'/><rect x="37" y="22" width="6" height="4.4" rx="1.6" fill="#fff6c0" '+CONTOUR+'/>',
    casquette:'<path d="M32 29a8 8 0 0 1 16 0z" fill="#3f6aa8" '+CONTOUR+'/><path d="M40 28.5h13l-1 3H40z" fill="#2c4d82" '+CONTOUR+'/><circle cx="40" cy="22" r="1.6" fill="#9ad06a"/>',
    bandeau:'<path d="M32.5 26.5h15v3.2h-15z" fill="#d83a3a" '+CONTOUR+'/><path d="M47.5 27.4l5 -1.6M47.5 28.8l5 2" stroke="#d83a3a" stroke-width="2" stroke-linecap="round"/>',
    explorateur:'<ellipse cx="40" cy="28.4" rx="13.5" ry="3.2" fill="#8a5a2a" '+CONTOUR+'/><path d="M33 28.4a7 7 0 0 1 14 0z" fill="#a9703a" '+CONTOUR+'/><path d="M45 23.6c5-3 8-1 9 2-4 0-7 0-9-2z" fill="#d83a3a" '+CONTOUR+'/>',
    eclair:'<path d="M32 29a8 8 0 0 1 16 0z" fill="#e0a21a" '+CONTOUR+'/><path d="M41 19.5l-5 6.5h3.4l-1.6 5 6-7.4h-3.6z" fill="#fff08a" '+CONTOUR+'/>',
    magicien:'<path d="M30.5 28.6h19L40 12z" fill="#6a3ab0" '+CONTOUR+'/><path d="M30.5 28.6h19" stroke="#000" stroke-width="2.4"/><circle cx="40" cy="21" r="1.7" fill="#ffe58a"/><circle cx="43.4" cy="25" r="1.1" fill="#ffe58a"/>',
    barbe:'<path d="M32.5 28.5a7.5 7.5 0 0 1 15 0z" fill="#6b4a2a" '+CONTOUR+'/>',
    couronne:'<path d="M33 28l1.4-7 3.2 3.6L40 19.5l2.4 5 3.2-3.6L47 28z" fill="#ffd44a" '+CONTOUR+'/>',
    bonnet:'<path d="M32 29a8 8 0 0 1 16 0z" fill="#f2a6c4" '+CONTOUR+'/><circle cx="40" cy="21" r="2.6" fill="#fff"/><path d="M33 28.6c3 2 11 2 14 0" stroke="#fff" stroke-width="2" fill="none"/>',
    capuche:'<path d="M31 32c0-9 4-14 9-14s9 5 9 14l-3-3.4c-3-3-9-3-12 0z" fill="#2b1620" '+CONTOUR+'/>',
    mortier:'<path d="M26 24.5l14-5.5 14 5.5-14 5.4z" fill="#26263a" '+CONTOUR+'/><path d="M33 27.5v4c4 2.4 10 2.4 14 0v-4" fill="#26263a" '+CONTOUR+'/><path d="M52 24.6v7" stroke="#ffd44a" stroke-width="1.6"/><circle cx="52" cy="33" r="1.7" fill="#ffd44a"/>'
  };
  function barbeDe(couleur){
    return '<g class="dg-barbe"><path d="M33.5 32c-2 11 2 18 6.5 21 4.5-3 8.5-10 6.5-21-3 3.4-10 3.4-13 0z" fill="'+couleur+'" '+CONTOUR+'/><path d="M37 38c1 5 .5 9 3 12M43 38c-1 5-.5 9-3 12" stroke="rgba(0,0,0,.35)" stroke-width="1" fill="none"/></g>';
  }
  /* l'ouvrier : jambes, buste qui se penche (.dg-t), bras et pelle qui bougent d'un bloc (.dg-b) */
  function ouvrier(o){
    var hat=CHAPEAUX[o.chapeau]||CHAPEAUX.casque;
    return '<g class="dg-ouvrier">'+
      '<path d="M37 56v13M44 56v13" stroke="#2a1d14" stroke-width="5.4" stroke-linecap="round"/><path d="M33.4 70.5h8M41 70.5h8" stroke="#000" stroke-width="3.2" stroke-linecap="round"/>'+
      '<g class="dg-t">'+
        '<rect x="33" y="38" width="14" height="20" rx="4" fill="'+o.chemise+'" '+CONTOUR+'/>'+
        (o.tablier?'<path d="M35 44h10v13H35z" fill="'+o.tablier+'" '+CONTOUR+'/>':'')+
        '<circle cx="40" cy="30.5" r="7.2" fill="'+PEAU+'" '+CONTOUR+'/>'+
        (o.barbe?barbeDe(o.barbe):'<path d="M42 34.4q2 1 3.4 0" stroke="#000" stroke-width="1" fill="none" stroke-linecap="round"/>')+
        '<circle cx="43" cy="30.4" r="1.2" fill="#000"/><circle cx="37.6" cy="30.4" r="1.2" fill="#000"/>'+
        hat+
        '<g class="dg-b">'+
          '<path d="M40 44.5l10 6" stroke="#000" stroke-width="7.2" stroke-linecap="round"/><path d="M40 44.5l10 6" stroke="'+o.chemise+'" stroke-width="5" stroke-linecap="round"/>'+
          '<circle cx="51" cy="51" r="2.6" fill="'+PEAU+'" '+CONTOUR+'/>'+
          '<path d="M47 48.5L77 70" stroke="#8a5a2a" stroke-width="3.2" stroke-linecap="round"/>'+
          '<path d="M74 65.4l10.4 4.6-4.2 8.4-10.6-4.8z" fill="#b8c2d0" '+CONTOUR+'/>'+
          '<ellipse class="dg-pelletee" cx="79.4" cy="68" rx="4.4" ry="2.4" fill="'+o.terre+'"/>'+
        '</g>'+
      '</g></g>';
  }
  function fond(o){
    return '<ellipse cx="80" cy="72.6" rx="12" ry="3.4" fill="#0b0708"/>'+
      '<path d="M0 71h120v29H0z" fill="rgba(0,0,0,.34)"/><path d="M0 71h120" stroke="#000" stroke-width="2"/>'+
      '<path class="dg-tas" d="M92 72c4-15 20-15 26 0z" fill="'+o.terre+'" '+CONTOUR+'/>';
  }
  function rond(cls,x,y,c){return '<circle class="dg-j '+cls+'" cx="'+x+'" cy="'+y+'" r="2.4" fill="'+c+'" '+CONTOUR+'/>';}
  function etoile(cls,x,y,c){return '<path class="dg-j '+cls+'" transform-origin="'+x+' '+y+'" d="M'+x+' '+(y-3.6)+'l1.1 2.5 2.7.3-2 1.9.6 2.7-2.4-1.4-2.4 1.4.6-2.7-2-1.9 2.7-.3z" fill="'+c+'" '+CONTOUR+'/>';}
  function eclat(cls,x,y,c){return '<path class="dg-j '+cls+'" d="M'+x+' '+(y-3.4)+'l2.6 3.4-2.6 3.4-2.6-3.4z" fill="'+c+'" '+CONTOUR+'/>';}
  function goutte(cls,x,y,c){return '<path class="dg-j '+cls+'" d="M'+x+' '+(y-3.6)+'c2.6 3 3 4.6 3 5.8a3 3 0 0 1-6 0c0-1.2.4-2.8 3-5.8z" fill="'+c+'" '+CONTOUR+'/>';}

  /* chaque mineur : son ouvrier, sa terre, ce qu'il lance et son décor animé */
  var MINEURS={
    drop:{o:{chapeau:'casque',chemise:'#3f6aa8',terre:'#7a5230'},jet:[rond,'#caa55a'],
      extra:'<g><rect x="96" y="52" width="18" height="12" rx="2.4" fill="#8a5a2a" '+CONTOUR+'/><path d="M96 55h18" stroke="#000" stroke-width="1.4"/><rect x="103" y="55" width="4" height="4" rx=".8" fill="#ffd44a" '+CONTOUR+'/>'+
      '<path class="dg-couvercle" d="M96 52l2-6h14l2 6z" fill="#a9703a" '+CONTOUR+'/></g>'+
      '<g class="dg-butin"><circle cx="102" cy="48" r="2.2" fill="#ffd44a" '+CONTOUR+'/><path d="M108 46l2 2.6-2 2.6-2-2.6z" fill="#7fd6ff" '+CONTOUR+'/><circle cx="105" cy="43" r="1.7" fill="#fff6c0"/></g>'},
    wandoos:{o:{chapeau:'casquette',chemise:'#3d8a4e',terre:'#2c2c34'},jet:[rond,'#2a2a30'],
      extra:'<g><rect x="95" y="34" width="21" height="17" rx="2" fill="#cfd2c4" '+CONTOUR+'/><rect x="98" y="37" width="15" height="10.4" rx="1" fill="#06140c" '+CONTOUR+'/>'+
      '<g class="dg-ecran"><path d="M100 40h9M100 43h6M100 45.6h10" stroke="#59e06a" stroke-width="1.5" stroke-linecap="round"/></g>'+
      '<rect x="99" y="51" width="13" height="5" rx="1.2" fill="#a8ab9c" '+CONTOUR+'/><rect x="94" y="56" width="22" height="3.4" rx="1" fill="#8d907f" '+CONTOUR+'/></g>'},
    stats:{o:{chapeau:'bandeau',chemise:'#b8352a',terre:'#7a5230'},jet:[rond,'#caa55a'],
      extra:'<g><rect x="96" y="36" width="5" height="26" rx="1.2" fill="#2a1d14" '+CONTOUR+'/><rect x="104" y="36" width="5" height="26" rx="1.2" fill="#2a1d14" '+CONTOUR+'/><rect x="112" y="36" width="5" height="26" rx="1.2" fill="#2a1d14" '+CONTOUR+'/></g>'+
      '<g><rect class="dg-b1" x="96.6" y="38" width="3.8" height="23.4" fill="#e84a3a"/><rect class="dg-b2" x="104.6" y="38" width="3.8" height="23.4" fill="#3a8ae8"/><rect class="dg-b3" x="112.6" y="38" width="3.8" height="23.4" fill="#59e06a"/></g>'},
    adventure:{o:{chapeau:'explorateur',chemise:'#9a6a2a',terre:'#8a6a3a'},jet:[rond,'#caa55a'],
      extra:'<g><circle cx="106" cy="46" r="11" fill="#e8d59a" '+CONTOUR+'/><circle cx="106" cy="46" r="8.2" fill="#fff6dc" stroke="#000" stroke-width="1"/><path d="M106 38.6v2M106 51.4v2M98.6 46h2M111.4 46h2" stroke="#000" stroke-width="1.2"/>'+
      '<g class="dg-aiguille"><path d="M106 46l2-6 2 6z" fill="#d83a3a" transform="translate(-2 0)"/><path d="M106 46l-2 6h4z" fill="#3a3a44"/></g></g>'},
    energyNgu:{o:{chapeau:'eclair',chemise:'#c98a14',terre:'#6a5a2a'},jet:[eclat,'#ffe45a'],
      extra:'<g><path class="dg-eclairs" d="M108 36l-8 11h6l-3 11 10-14h-6.4z" fill="#fff08a" '+CONTOUR+'/></g><circle class="dg-lueur" cx="106" cy="50" r="13" fill="rgba(255,228,90,.35)"/>'},
    magicNgu:{o:{chapeau:'magicien',chemise:'#6a3ab0',terre:'#4a3a6a'},jet:[eclat,'#c9a0ff'],
      extra:'<g><path class="dg-cristal" d="M104 64l-6-12 6-12 6 12z" fill="#b48aff" '+CONTOUR+'/><path d="M104 40v24M98 52h12" stroke="rgba(255,255,255,.55)" stroke-width="1"/></g>'+
      '<g class="dg-scint"><path class="dg-s1" d="M96 38l1 2.6 2.6 1-2.6 1-1 2.6-1-2.6-2.6-1 2.6-1z" fill="#fff"/><path class="dg-s2" d="M113 44l.9 2.2 2.2.9-2.2.9-.9 2.2-.9-2.2-2.2-.9 2.2-.9z" fill="#ffe58a"/></g>'},
    energyBeard:{o:{chapeau:'barbe',chemise:'#c98a14',barbe:'#f0c94c',terre:'#6a5a2a'},jet:[rond,'#caa55a'],
      extra:'<g><path class="dg-peigne" d="M100 44h14v4h-14z" fill="#d83a3a" '+CONTOUR+'/><path d="M102 48v5M105 48v5M108 48v5M111 48v5" stroke="#000" stroke-width="1.4" stroke-linecap="round"/></g>'+
      '<path class="dg-eclairs" d="M112 30l-5 7h4l-2 6 6-8h-4z" fill="#fff08a" '+CONTOUR+'/>'},
    magicBeard:{o:{chapeau:'barbe',chemise:'#6a3ab0',barbe:'#b48aff',terre:'#4a3a6a'},jet:[rond,'#caa55a'],
      extra:'<g><path class="dg-peigne" d="M100 44h14v4h-14z" fill="#8a5ad8" '+CONTOUR+'/><path d="M102 48v5M105 48v5M108 48v5M111 48v5" stroke="#000" stroke-width="1.4" stroke-linecap="round"/></g>'+
      '<g class="dg-scint"><path class="dg-s1" d="M104 30l1 2.6 2.6 1-2.6 1-1 2.6-1-2.6-2.6-1 2.6-1z" fill="#fff"/><path class="dg-s2" d="M113 36l.9 2.2 2.2.9-2.2.9-.9 2.2-.9-2.2-2.2-.9 2.2-.9z" fill="#ffe58a"/></g>'},
    pp:{o:{chapeau:'couronne',chemise:'#8a3a8a',terre:'#7a5230'},jet:[etoile,'#ffd44a'],
      extra:'<g class="dg-sac"><path d="M98 66c-2-8 0-16 6-18h6c6 2 8 10 6 18z" fill="#c9a06a" '+CONTOUR+'/><path d="M103 48l1.6-3h4.4l1.6 3" fill="#a9803a" '+CONTOUR+'/><path d="M107 52.5l1.6 3.4 3.6.4-2.7 2.4.8 3.6-3.3-1.9-3.3 1.9.8-3.6-2.7-2.4 3.6-.4z" fill="#ffd44a" '+CONTOUR+'/></g>'},
    daycare:{o:{chapeau:'bonnet',chemise:'#e8738a',terre:'#d8b878'},jet:[rond,'#e8cc8a'],
      extra:'<g><rect x="94" y="56" width="24" height="12" rx="2" fill="#d8b878" '+CONTOUR+'/><path d="M94 56h24" stroke="#000" stroke-width="1.4"/></g>'+
      '<g class="dg-bebe"><circle cx="106" cy="50" r="5.4" fill="'+PEAU+'" '+CONTOUR+'/><circle cx="104.4" cy="49.6" r=".9" fill="#000"/><circle cx="108" cy="49.6" r=".9" fill="#000"/><path d="M104.6 52.6q1.4 1.2 2.8 0" stroke="#000" stroke-width="1" fill="none" stroke-linecap="round"/><path d="M101 47a5 5 0 0 1 10 0z" fill="#7fd6ff" '+CONTOUR+'/><circle cx="106" cy="42" r="2" fill="#ffd44a" '+CONTOUR+'/></g>'},
    blood:{o:{chapeau:'capuche',chemise:'#4a1a22',tablier:'#7a1c1c',terre:'#5a0f14'},jet:[goutte,'#d82a2a'],
      extra:'<g><path d="M96 64c0 3 4 5 9 5s9-2 9-5V48c0-3-4-5-9-5s-9 2-9 5z" fill="#6b4a2a" '+CONTOUR+'/><ellipse cx="105" cy="48" rx="9" ry="3.2" fill="#a01818" '+CONTOUR+'/><path d="M96 52c6 2.4 12 2.4 18 0M96 59c6 2.4 12 2.4 18 0" stroke="#000" stroke-width="1.4" fill="none"/></g>'+
      '<path class="dg-goutte" d="M105 49c1.8 2.2 2 3.4 2 4.2a2 2 0 0 1-4 0c0-.8.2-2 2-4.2z" fill="#d82a2a" '+CONTOUR+'/>'},
    experience:{o:{chapeau:'mortier',chemise:'#3a5ab8',terre:'#3a4a7a'},jet:[rond,'#8ad8ff'],
      extra:'<g class="dg-anneau"><circle cx="106" cy="48" r="11" fill="none" stroke="#8ad8ff" stroke-width="2"/></g>'+
      '<g><circle cx="106" cy="48" r="7" fill="#dff4ff" '+CONTOUR+'/><circle cx="104" cy="46" r="2" fill="#fff"/></g>'+
      '<path class="dg-niveau" d="M106 38l4 5h-2.6v5h-2.8v-5H102z" fill="#59e06a" '+CONTOUR+'/>'}
  };
  function scene(id){
    var m=MINEURS[id];if(!m)return '';
    var o=m.o;o.terre=o.terre||'#7a5230';
    var f=m.jet[0],c=m.jet[1];
    return '<svg viewBox="0 0 120 108" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false"><g transform="translate(0 8)">'+
      fond(o)+m.extra+
      '<g class="dg-jets">'+f('dg-j1',86,32,c)+f('dg-j2',88,30,c)+f('dg-j3',84,34,c)+'</g>'+
      ouvrier(o)+
      '<g class="dg-zz"><text x="52" y="22" font-size="9" fill="#fff" font-family="Bangers,cursive">Z</text><text x="60" y="15" font-size="7" fill="#fff" font-family="Bangers,cursive">z</text></g>'+
    '</g></svg>';
  }
  /* ---------- le style (injecté une fois ; seules transform et opacity sont animées) ---------- */
  var STYLE_ID='soreal-idle-mineurs-style-v1';
  var P='html body.soreal-idle-active-v47.soreal-idle-active-v47 ';
  function style_(){
    if(document.getElementById(STYLE_ID))return;
    var s=document.createElement('style');s.id=STYLE_ID;
    s.textContent=[
      '.mn-page{display:grid;gap:12px;font-family:"Russo One",system-ui,sans-serif}',
      '.mn-haut{display:grid;grid-template-columns:1fr 1fr;gap:10px}',
      '@media (max-width:560px){.mn-haut{grid-template-columns:1fr}}',
      '.mn-pan{background:linear-gradient(180deg,#4a2f19,#2c1b0e);border:3px solid #000;border-radius:12px;padding:10px;box-shadow:inset 0 2px 0 rgba(255,255,255,.12);color:#f3e7cf}',
      '.mn-pan h3{font:400 21px Bangers,cursive;margin:0 0 6px;color:#ffcf4a;letter-spacing:.05em;text-shadow:0 2px 0 #000}',
      '.mn-jauge{height:20px;border:3px solid #000;border-radius:8px;background:#1a0f08;overflow:hidden;position:relative}',
      '.mn-jauge i{position:absolute;inset:0;transform-origin:0 50%;background:linear-gradient(180deg,#ffe58a,#d99a1c)}',
      '.mn-jauge i.fort{background:linear-gradient(180deg,#ff8a6a,#b3261e)}',
      '.mn-petit{font-size:12px;opacity:.9;margin-top:5px;line-height:1.35}',
      '.mn-petit b{color:#ffd06a}.mn-petit .ok{color:#8cf5a4}',
      '.mn-lampes{display:flex;gap:8px;flex-wrap:wrap}',
      '.mn-lampe{width:30px;height:38px}',
      '.mn-mine{border:4px solid #000;border-radius:14px;overflow:hidden;background:#1c1420}',
      '.mn-strate{padding:8px 8px 2px}',
      '.mn-etage{font:400 19px Bangers,cursive;letter-spacing:.06em;margin:0 0 6px 4px;color:#fff;text-shadow:0 2px 0 #000}',
      '.g1{background:linear-gradient(180deg,#6e4a2b,#553720)}.g2{background:linear-gradient(180deg,#4d4a52,#383540)}.g3{background:linear-gradient(180deg,#3a3f5a,#2a2d46)}.g4{background:linear-gradient(180deg,#4a2a55,#34193e)}.g5{background:linear-gradient(180deg,#5a1f22,#3b1114)}',
      /* Le cadre du mineur EST la scène (Norman, 2026-10-27) : le dessin remplit tout le cadre, le nom et l'effet sont posés en haut, les boutons en bas, par-dessus le décor. */
      '.mn-liste{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px;margin:0 0 8px}',
      '.mn-gal{position:relative;aspect-ratio:120/108;overflow:hidden;border:3px solid #000;border-radius:12px;color:#f3e7cf;background:radial-gradient(ellipse at 70% 100%,rgba(255,200,80,.2),transparent 70%),#140e12;box-shadow:0 3px 0 rgba(0,0,0,.5)}',
      '.mn-poste{position:absolute;inset:0}',
      '.mn-poste svg{position:absolute;inset:0;width:100%;height:100%}',
      '.mn-gal.repos .mn-poste{filter:saturate(.55) brightness(.82)}',
      '.mn-gal.neuf .mn-poste{filter:saturate(.3) brightness(.7)}',
      '.mn-hautb,.mn-basb{position:absolute;left:0;right:0;z-index:2;padding:6px 8px}',
      '.mn-hautb{top:0;background:linear-gradient(180deg,rgba(8,4,6,.82),rgba(8,4,6,.55) 70%,transparent)}',
      '.mn-basb{bottom:0;display:grid;gap:5px;padding-top:14px;background:linear-gradient(0deg,rgba(8,4,6,.88),rgba(8,4,6,.6) 72%,transparent)}',
      '.mn-titre{display:flex;justify-content:space-between;align-items:baseline;gap:8px}',
      '.mn-titre b{font:400 19px Bangers,cursive;letter-spacing:.05em;color:#fff;text-shadow:0 2px 0 #000;line-height:1.05}',
      '.mn-niv{font-size:11px;opacity:.92;text-align:right;line-height:1.2}',
      '.mn-effet{font-size:12px;color:#ffe9a8;margin-top:2px;line-height:1.25}.mn-effet em{font-style:normal;color:#8cf5a4}',
      '.mn-ligne{display:flex;align-items:center;gap:6px;flex-wrap:nowrap}',
      '.mn-ligne .mn-btn{flex:1 1 auto;min-width:0;padding:3px 6px;font-size:14px;min-height:34px}',
      '.mn-ligne .mn-btn.carre{flex:0 0 34px}',
      '.mn-btn{appearance:none;-webkit-appearance:none;border:3px solid #000;border-radius:6px;font:400 15px Bangers,cursive;letter-spacing:.05em;padding:4px 10px;min-height:36px;color:#2b1d00;background:linear-gradient(180deg,#ffe38a,#d9a62f);box-shadow:inset 0 2px 0 rgba(255,255,255,.55),2px 2px 0 #000;cursor:pointer;touch-action:manipulation}',
      '.mn-btn.vert{color:#f4edc9;background:linear-gradient(180deg,#4ea866,#256b3c)}',
      '.mn-btn.carre{min-width:36px;padding:4px 0}',
      '.mn-btn:disabled{cursor:default;color:#8d8d8d;background:linear-gradient(180deg,#555,#333)}',
      '.mn-btn small{font:400 11px "Russo One",sans-serif;opacity:.85;margin-left:4px}',
      '.mn-nivactif{min-width:56px;text-align:center;font-size:14px}',
      /* le geste : une période, 1,8 s, début = fin */
      '.dg-t,.dg-b{transform-box:view-box}',
      '.dg-t{transform-origin:40px 56px;transform:rotate(2deg)}',
      '.dg-b{transform-origin:40px 44.5px;transform:rotate(-4deg)}',
      '.dg-ouvrier{transform-box:view-box}',
      '.dg-j,.dg-zz,.dg-pelletee,.dg-butin,.dg-goutte,.dg-niveau,.dg-anneau{opacity:0}',
      '.repos .dg-zz{opacity:.85}',
      '.dg-ecran{opacity:.55}.dg-eclairs{opacity:.35}.dg-lueur{opacity:.25}.dg-scint{opacity:.5}',
      '.on .dg-t{animation:dgT 1.8s ease-in-out infinite}',
      '.on .dg-b{animation:dgB 1.8s ease-in-out infinite}',
      '@keyframes dgT{0%{transform:rotate(15deg)}35%{transform:rotate(3deg)}55%{transform:rotate(-4deg)}70%{transform:rotate(11deg)}100%{transform:rotate(15deg)}}',
      '@keyframes dgB{0%{transform:rotate(12deg)}35%{transform:rotate(-30deg)}55%{transform:rotate(-54deg)}68%{transform:rotate(-12deg)}100%{transform:rotate(12deg)}}',
      '.on .dg-pelletee{animation:dgPelle 1.8s linear infinite}',
      '@keyframes dgPelle{0%,28%{opacity:0}34%,56%{opacity:1}60%,100%{opacity:0}}',
      '.dg-j1{--dx:22px;--dy:36px}.dg-j2{--dx:25px;--dy:39px}.dg-j3{--dx:19px;--dy:33px}',
      '.on .dg-j{animation:dgJ 1.8s linear infinite}.on .dg-j2{animation-name:dgJ2}.on .dg-j3{animation-name:dgJ3}',
      '@keyframes dgJ{0%,53%{opacity:0;transform:translate(0,0)}57%{opacity:1}75%{transform:translate(calc(var(--dx)*.45),-7px)}92%{opacity:1;transform:translate(calc(var(--dx)*.92),calc(var(--dy)*.9))}100%{opacity:0;transform:translate(var(--dx),var(--dy))}}',
      '@keyframes dgJ2{0%,55%{opacity:0;transform:translate(0,0)}59%{opacity:1}77%{transform:translate(calc(var(--dx)*.4),-4px)}93%{opacity:1;transform:translate(calc(var(--dx)*.9),calc(var(--dy)*.9))}100%{opacity:0;transform:translate(var(--dx),var(--dy))}}',
      '@keyframes dgJ3{0%,51%{opacity:0;transform:translate(0,0)}55%{opacity:1}73%{transform:translate(calc(var(--dx)*.5),-9px)}91%{opacity:1;transform:translate(calc(var(--dx)*.94),calc(var(--dy)*.9))}100%{opacity:0;transform:translate(var(--dx),var(--dy))}}',
      '.dg-tas{transform-box:view-box;transform-origin:105px 72px}.on .dg-tas{animation:dgTas 1.8s ease-in-out infinite}',
      '@keyframes dgTas{0%,70%{transform:scale(1)}85%{transform:scale(1.05,1.08)}100%{transform:scale(1)}}',
      '.dg-barbe{transform-box:view-box;transform-origin:40px 33px}.on .dg-barbe{animation:dgBarbe 1.8s ease-in-out infinite}',
      '@keyframes dgBarbe{0%,100%{transform:rotate(0)}30%{transform:rotate(7deg)}55%{transform:rotate(-9deg)}78%{transform:rotate(5deg)}}',
      /* décors propres à chaque mineur */
      '.on .dg-butin{animation:dgButin 1.8s ease-in-out infinite}',
      '@keyframes dgButin{0%,60%{opacity:0;transform:translateY(5px)}78%{opacity:1;transform:translateY(0)}96%{opacity:1;transform:translateY(-3px)}100%{opacity:0;transform:translateY(-3px)}}',
      '.dg-couvercle{transform-box:view-box;transform-origin:96px 52px}.on .dg-couvercle{animation:dgCouv 1.8s ease-in-out infinite}',
      '@keyframes dgCouv{0%,55%{transform:rotate(0)}70%,95%{transform:rotate(-24deg)}100%{transform:rotate(0)}}',
      '.on .dg-ecran{animation:dgEcran 1.8s steps(1,end) infinite}',
      '@keyframes dgEcran{0%{opacity:.95}20%{opacity:.5}40%{opacity:1}60%{opacity:.6}80%{opacity:1}100%{opacity:.95}}',
      '.dg-b1,.dg-b2,.dg-b3{transform-box:view-box}.dg-b1{transform-origin:98.5px 61.4px}.dg-b2{transform-origin:106.5px 61.4px}.dg-b3{transform-origin:114.5px 61.4px}',
      '.dg-b1,.dg-b2,.dg-b3{transform:scaleY(.35)}',
      '.on .dg-b1{animation:dgBar 1.8s ease-in-out infinite}.on .dg-b2{animation:dgBar 1.8s ease-in-out -.6s infinite}.on .dg-b3{animation:dgBar 1.8s ease-in-out -1.2s infinite}',
      '@keyframes dgBar{0%,100%{transform:scaleY(.4)}50%{transform:scaleY(1)}}',
      '.dg-aiguille{transform-box:view-box;transform-origin:106px 46px}.on .dg-aiguille{animation:dgAig 1.8s ease-in-out infinite}',
      '@keyframes dgAig{0%,100%{transform:rotate(-40deg)}50%{transform:rotate(40deg)}}',
      '.on .dg-eclairs{animation:dgEcl 1.8s linear infinite}',
      '@keyframes dgEcl{0%,100%{opacity:0}12%{opacity:1}22%{opacity:.2}34%{opacity:1}46%{opacity:0}}',
      '.on .dg-lueur{animation:dgLueur 1.8s ease-in-out infinite}',
      '@keyframes dgLueur{0%,100%{opacity:.1}50%{opacity:.5}}',
      '.dg-cristal{transform-box:view-box;transform-origin:104px 64px}.on .dg-cristal{animation:dgCrist 1.8s ease-in-out infinite}',
      '@keyframes dgCrist{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}',
      '.on .dg-s1{animation:dgScint 1.8s ease-in-out infinite}.on .dg-s2{animation:dgScint 1.8s ease-in-out -.9s infinite}',
      '.on .dg-scint{opacity:1}.dg-s1,.dg-s2{transform-box:fill-box;transform-origin:50% 50%}',
      '@keyframes dgScint{0%,100%{opacity:0;transform:scale(.4)}50%{opacity:1;transform:scale(1.2)}}',
      '.dg-peigne{transform-box:view-box;transform-origin:107px 46px}.on .dg-peigne{animation:dgPeigne 1.8s ease-in-out infinite}',
      '@keyframes dgPeigne{0%,100%{transform:translateY(0)}50%{transform:translateY(3px)}}',
      '.dg-sac{transform-box:view-box;transform-origin:107px 66px}.on .dg-sac{animation:dgSac 1.8s ease-in-out infinite}',
      '@keyframes dgSac{0%,72%{transform:scale(1)}88%{transform:scale(1.06,1.04)}100%{transform:scale(1)}}',
      '.dg-bebe{transform-box:view-box;transform-origin:106px 56px}.on .dg-bebe{animation:dgBebe 1.8s ease-in-out infinite}',
      '@keyframes dgBebe{0%,100%{transform:translateY(0)}25%{transform:translateY(-5px)}50%{transform:translateY(0)}75%{transform:translateY(-3px)}}',
      '.on .dg-goutte{animation:dgGoutte 1.8s ease-in infinite}',
      '@keyframes dgGoutte{0%{opacity:0;transform:translateY(-4px)}15%{opacity:1}70%{opacity:1;transform:translateY(16px)}85%,100%{opacity:0;transform:translateY(18px)}}',
      '.dg-anneau{transform-box:view-box;transform-origin:106px 48px}.on .dg-anneau{animation:dgAnneau 1.8s ease-out infinite}',
      '@keyframes dgAnneau{0%{opacity:0;transform:scale(.7)}30%{opacity:.9}100%{opacity:0;transform:scale(1.35)}}',
      '.on .dg-niveau{animation:dgNiv 1.8s ease-out infinite}',
      '@keyframes dgNiv{0%,55%{opacity:0;transform:translateY(8px)}72%{opacity:1}100%{opacity:0;transform:translateY(-8px)}}',
      '@media (prefers-reduced-motion:reduce){.on *{animation:none!important}}',
      /* polices du jeu (Norman : titres et boutons en Bangers, textes en Russo One) : la règle générale de la page impose Comic Neue en !important, il faut la même spécificité */
      P+'.mn-page{font-family:"Russo One",system-ui,sans-serif!important;font-weight:400!important}',
      P+'.mn-pan h3,'+P+'.mn-etage,'+P+'.mn-titre b,'+P+'.mn-btn{font-family:Bangers,"Russo One",Impact,sans-serif!important;font-weight:400!important;letter-spacing:.05em!important}',
      P+'.mn-page :is(.mn-effet,.mn-niv,.mn-petit,.mn-nivactif){font-family:"Russo One",system-ui,sans-serif!important;font-weight:400!important}',
      P+'.mn-btn small{font-family:"Russo One",sans-serif!important;font-size:11px!important}',
      P+'.mn-btn.carre{font-family:"Russo One",system-ui,sans-serif!important;font-size:19px!important;line-height:1!important}'
    ].join('\n');
    (document.head||document.documentElement).appendChild(s);
  }

  /* ---------- la page ---------- */
  function lampes_(places,actifs){
    var h='';
    for(var i=0;i<places;i++){
      var p=i<actifs;
      h+='<svg class="mn-lampe" viewBox="0 0 30 38" aria-hidden="true"><path d="M5 20a10 10 0 0 1 20 0z" fill="'+(p?'#e0a21a':'#3a3a3a')+'" stroke="#000" stroke-width="2"/><rect x="11" y="9" width="8" height="5" rx="2" fill="'+(p?'#fff6c0':'#555')+'" stroke="#000" stroke-width="1.5"/><path d="M3 22h24v4H3z" fill="'+(p?'#b37c10':'#2a2a2a')+'" stroke="#000" stroke-width="2"/>'+(p?'<path d="M15 28v8" stroke="#ffe58a" stroke-width="3"/>':'')+'</svg>';
    }
    return h;
  }
  function nombre_(x){return H().formatGrandNombreIdleV70_(Number(x)||0);}
  function mult_(x){
    x=Number(x)||1;
    if(x>=1000)return '×'+nombre_(x);
    return '×'+x.toLocaleString('fr-FR',{maximumFractionDigits:2});
  }
  function galerie_(def,d,vue,or){
    var id=def.id,inf=INFOS[id]||{nom:def.name||id,effet:''};
    var run=H().idleEntier_(d.runLevel||0),max=H().idleEntier_(d.maxLevel||0),on=Boolean(d.active)&&run>0;
    var v=(vue&&vue.items&&vue.items[id])||{};
    var etat=on?'on':(max>0?'repos':'neuf');
    var idH=H().idleHtml_(id);
    var coutTexte=v.nextCost!=null?nombre_(v.nextCost)+' Or':'au maximum';
    var abordable=v.nextCost!=null&&or>=v.nextCost;
    var effet=on
      ?'Maintenant : <em>'+mult_(v.multiplier)+' '+inf.effet+'</em>'
      :(max>0?'S’il travaillait au niveau '+run+' : <em>'+mult_(v.multiplier)+' '+inf.effet+'</em>':'Il améliorera : <em>'+inf.effet+'</em>');
    var drain=nombre_(run>0?v.drain:v.nextDrain);
    var h='<div class="mn-gal '+etat+'" data-mineur="'+idH+'"><div class="mn-poste">'+scene(id)+'</div>'+
      '<div class="mn-hautb"><div class="mn-titre"><b>'+H().idleHtml_(inf.nom)+'</b><span class="mn-niv">'+(max>0?'niveau '+run+' sur '+max:'pas encore engagé')+'<br>'+drain+' d’or/s</span></div>'+
      '<div class="mn-effet">'+effet+'</div></div><div class="mn-basb">';
    if(max>0){
      h+='<div class="mn-ligne">'+
        '<button type="button" class="mn-btn carre" '+(run<=0?'disabled ':'')+'onclick="window.__setDiggerIdleV47__(\''+idH+'\','+Math.max(0,run-1)+')" aria-label="Baisser le niveau actif">−</button>'+
        '<span class="mn-nivactif">'+run+'</span>'+
        '<button type="button" class="mn-btn carre" '+(run>=max?'disabled ':'')+'onclick="window.__setDiggerIdleV47__(\''+idH+'\','+Math.min(max,run+1)+')" aria-label="Monter le niveau actif">+</button>'+
        '<button type="button" class="mn-btn" '+(run>=max?'disabled ':'')+'onclick="window.__setDiggerIdleV47__(\''+idH+'\','+max+')">Au maximum</button></div>';
    }
    h+='<div class="mn-ligne">'+
      (max>0
        ?'<button type="button" class="mn-btn'+(on?'':' vert')+'" onclick="window.__toggleDiggerIdleV47__(\''+idH+'\','+(!on)+')">'+(on?'Mettre au repos':'Mettre au travail')+'</button>'
        :'')+
      '<button type="button" class="mn-btn'+(max>0?'':' vert')+'" '+(v.nextCost==null||!abordable?'disabled ':'')+'onclick="window.__actionMetaV47__({action:\'upgradeDigger\',digger:\''+idH+'\'})">'+(max>0?'Creuser plus profond':'Engager')+'<small>'+H().idleHtml_(coutTexte)+'</small></button></div>'+
      '</div></div>';
    return h;
  }
  function page(j){
    style_();
    var s=systemeMetaParIdIdleV130_(j,'diggers');
    if(!s||!s.state||!s.state.unlocked)return '<div class="soreal-idle-section-v8" style="text-align:center;padding:26px">Rien à afficher pour le moment.</div>';
    var data=s.state.data||{};
    var diggers=data.diggers||{};
    var m=(j&&j.systemes)||{};
    var vue=m.diggerView||{};
    var or=Number(m.currencies&&m.currencies.gold)||0;
    var daycareOk=Boolean(systemeMetaParIdIdleV130_(j,'daycare')&&systemeMetaParIdIdleV130_(j,'daycare').state&&systemeMetaParIdIdleV130_(j,'daycare').state.unlocked);
    var defs={};(Array.isArray(m.diggerDefinitions)?m.diggerDefinitions:[]).forEach(function(def){defs[def.id]=def;});
    var places=Math.max(1,H().idleEntier_(vue.slots||data.slots||1)),actifs=H().idleEntier_(vue.active||0);
    var brut=Number(vue.grossGps)||0,drain=Number(vue.drain)||0;
    var part=brut>0?Math.max(0,Math.min(1,drain/brut)):(drain>0?1:0);
    var strates='';
    var precedentEngage=true;
    GALERIES.forEach(function(g){
      if(!precedentEngage)return;
      var liste=g.ids.filter(function(id){return defs[id]&&(id!=='daycare'||daycareOk);});
      if(!liste.length)return;
      strates+='<div class="mn-strate '+g.cls+'"><div class="mn-etage">'+g.titre+'</div><div class="mn-liste">'+liste.map(function(id){return galerie_(defs[id],diggers[id]||{},vue,or);}).join('')+'</div></div>';
      precedentEngage=liste.some(function(id){return H().idleEntier_((diggers[id]||{}).maxLevel||0)>0;});
    });
    var haut='<div class="mn-haut">'+
      '<div class="mn-pan"><h3>Or par seconde</h3><div class="mn-jauge"><i class="'+(part>.85?'fort':'')+'" style="transform:scaleX('+part.toFixed(3)+')"></i></div>'+
        '<div class="mn-petit">Tes mineurs consomment <b>'+nombre_(drain)+'</b> sur <b>'+nombre_(brut)+'</b> produits par seconde.</div>'+
        '<div class="mn-petit">Il te reste <b class="ok">'+nombre_(Math.max(0,brut-drain))+'</b> par seconde.</div></div>'+
      '<div class="mn-pan"><h3>Emplacements</h3><div class="mn-lampes">'+lampes_(places,actifs)+'</div>'+
        '<div class="mn-petit">'+actifs+' mineur'+(actifs>1?'s':'')+' au travail sur '+places+' place'+(places>1?'s':'')+'.</div>'+
        '<div class="mn-petit">Bonus de tous leurs niveaux : <b class="ok">+'+(Number(vue.globalPct)||0).toLocaleString('fr-FR',{maximumFractionDigits:1})+' %</b> sur chaque effet.</div></div>'+
    '</div>';
    return H().entetePageIdleV28_('Mineurs d’or','Ils creusent avec l’or par seconde de ta machine temporelle : chaque mineur au travail améliore quelque chose. Monte leur niveau maximum, puis choisis à quel niveau ils travaillent.')+
      '<div class="mn-page">'+haut+'<div class="mn-mine">'+strates+'</div></div>';
  }

  window.__SOREAL_IDLE_MINEURS_PAGE_V1__={page:page,scene:scene,galeries:GALERIES,mineurs:MINEURS};
})();
