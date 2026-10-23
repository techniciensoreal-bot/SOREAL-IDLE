/*
 * SOREAL IDLE — la Valise des consommables (Norman, 2026-10-23) : « une valise médiévale, vivante comme le coffre, avec son propre cadre ; quand on l'ouvre, elle se déplie en plusieurs étages, comme un étalage de magasin, avec les consommables affichés ».
 *
 * Posée en haut du Coffre (même nœud racine : le Coffre est remplacé d'un bloc par le jeu). Une créature de cuir (sangles de fer, coins et serrure en laiton, anse, étiquette de parchemin) qui respire, cligne des yeux, remue l'anse et trottine ; elle s'endort de temps en temps
 * (petits « Z », ronflements), se réveille en sursaut si on la touche, et lâche parfois une réplique. Fermée, son couvercle est baissé ; ouverte, il se soulève sur une lueur de fioles, et trois étages se déplient en cascade : Potions (en réserve, bouton « Utiliser »),
 * En cours (potions, Bar Bars et porte-bonheur actifs, avec leur temps), Réserves (Poop, Beast Butter, pilules, stylos). Seul ce que le joueur possède est affiché (règle n°2) ; la valise elle-même est toujours là.
 *
 * Règle n°4 (redessin) : tout ce que ce module pose après le rendu (classes vl-dort / vl-ouverte / vl-parle / vl-glou) est déclaré par data-morph-classes-gardees ; aucune minuterie entre un redessin et la remise en état (le pas de 0,25 s ne fait que réappliquer).
 * Règle n°6 : l'état ouvert / fermé est rangé dans localStorage (soreal_idle_valise_ouverte_v1), donc lié au compte.
 *   window.__SOREAL_IDLE_VALISE_V1__ = { html(), basculer(), ouverte(), potions, effets, reserves, repliques }
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_VALISE_V1__)return;

  var CLE='soreal_idle_valise_ouverte_v1';
  var MOTIF_CLASSES='^vl-(dort|ouverte|parle|glou|anim|baille)$';

  var POTIONS=[
    {id:'energyPotionAlpha',nom:'Potion d’énergie α',img:'energy-potion-alpha'},
    {id:'energyPotionBeta',nom:'Potion d’énergie β',img:'energy-potion-beta'},
    {id:'energyPotionDelta',nom:'Potion d’énergie δ',img:'energy-potion-delta'},
    {id:'magicPotionAlpha',nom:'Potion de magie α',img:'magic-potion-alpha'},
    {id:'magicPotionBeta',nom:'Potion de magie β',img:'magic-potion-beta'},
    {id:'magicPotionDelta',nom:'Potion de magie δ',img:'magic-potion-delta'},
    {id:'resource3PotionAlpha',nom:'Potion de Ressource 3 α',img:'resource-3-potion-alpha'},
    {id:'resource3PotionBeta',nom:'Potion de Ressource 3 β',img:'resource-3-potion-beta'},
    {id:'resource3PotionDelta',nom:'Potion de Ressource 3 δ',img:'resource-3-potion-delta'}
  ];
  var EFFETS=[
    {id:'energyPower',nom:'Potion d’énergie',img:'energy-potion-alpha',beta:'energy-potion-beta'},
    {id:'magicPower',nom:'Potion de magie',img:'magic-potion-alpha',beta:'magic-potion-beta'},
    {id:'r3Power',nom:'Potion de Ressource 3',img:'resource-3-potion-alpha',beta:'resource-3-potion-beta'},
    {id:'energyBars',nom:'Bar Bar d’énergie',img:'energy-bar-bar'},
    {id:'magicBars',nom:'Bar Bar de magie',img:'magic-bar-bar'},
    {id:'luck',nom:'Porte-bonheur',img:'lucky-charm'}
  ];
  var RESERVES=[
    {id:'seeds',nom:'Graines',img:'',icone:'graine'},
    {id:'poop',nom:'Poop',img:'fertilizer'},
    {id:'beastButters',nom:'Beast Butter',img:'beast-butter'},
    {id:'bluePills',nom:'Pilules bleues',img:'little-blue-pill'},
    {id:'blackPens',nom:'Stylos noirs',img:'regular-black-pens'}
  ];

  /* Répliques de la valise : toujours en français, ton médiéval un peu rustre (comme celles du Coffre). */
  var REPLIQUES=[
    'Un peu de potion, messire ?',
    'Doucement sur les flacons, manant !',
    'Par Saint-Glinglin !',
    'Fiole en main, courage au cœur !',
    'Ça sent la mandragore, ici.',
    'J’ai la bougeotte… et le lumbago.',
    'Qui a touché à ma serrure ?',
    'Je ne contiens que des choses très légales.',
    'Messire, vos fioles sont au complet !',
    'Ne secouez pas, ça mousse.'
  ];
  var REVEILS=[
    'Hein ? Quoi ? Un dragon ?',
    'Par la barbe de Merlin !',
    'Je ne dormais pas, je méditais !',
    'À moi, la garde !',
    'Cinq minutes de plus, maître…'
  ];
  var REMARQUE='Vous comptez me regarder longtemps, damoiseau ?';

  var dort=false,parle=null;
  var visibleAvant=0,cibleSommeil=240000+Math.random()*300000,visibleDormi=0,visibleRonfle=0,cibleRonfle=1500,visibleRegard=0,cibleRegard=150000+Math.random()*250000;

  function reg_(){return window.__SOREAL_IDLE_REG__||{};}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function donnees(){var e=reg_().idleEtat;return e&&e.systemes&&e.systemes.consommables||{};}
  function ouverte(){try{return localStorage.getItem(CLE)==='1';}catch(_e){return false;}}
  function duree(s){
    var n=Math.max(0,Math.floor(Number(s)||0));
    if(n>=86400)return Math.floor(n/3600)+' h';
    if(n>=3600)return Math.floor(n/3600)+' h '+String(Math.floor((n%3600)/60)).padStart(2,'0');
    if(n>=60)return Math.ceil(n/60)+' min';
    return n+' s';
  }
  function son(id){try{var a=window.__SOREAL_IDLE_AUDIO_V199__;if(a&&typeof a.play==='function')a.play(id);}catch(_e){}}
  function reduit(){try{return Boolean(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);}catch(_e){return false;}}

  /* ---------- le dessin : une valise de cuir à sangles de fer, coins et serrure de laiton, yeux sous le couvercle ---------- */
  var SVG=
    '<svg viewBox="0 0 320 232" aria-hidden="true" focusable="false"><defs>'+
      '<linearGradient id="vlCuir" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a5662f"/><stop offset=".55" stop-color="#78441f"/><stop offset="1" stop-color="#4a270f"/></linearGradient>'+
      '<linearGradient id="vlCuirC" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c0793a"/><stop offset="1" stop-color="#85491f"/></linearGradient>'+
      '<linearGradient id="vlFer" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8d8d98"/><stop offset=".5" stop-color="#4b4b55"/><stop offset="1" stop-color="#25252c"/></linearGradient>'+
      '<linearGradient id="vlLaiton" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe58a"/><stop offset=".5" stop-color="#d79a1f"/><stop offset="1" stop-color="#7a4c06"/></linearGradient>'+
      '<linearGradient id="vlDent" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffdf0"/><stop offset="1" stop-color="#e6dbb2"/></linearGradient>'+
      '<linearGradient id="vlVelours" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a1c33"/><stop offset="1" stop-color="#34091a"/></linearGradient>'+
      '<radialGradient id="vlLueur" cx=".5" cy=".5" r=".55"><stop offset="0" stop-color="#fff0b0" stop-opacity=".95"/><stop offset="1" stop-color="#ff9a3c" stop-opacity="0"/></radialGradient>'+
    '</defs>'+
    '<ellipse class="vl-ombre" cx="160" cy="219" rx="126" ry="9" fill="rgba(0,0,0,.45)"/>'+
    /* pieds de bois cerclés de laiton */
    '<g class="vl-patte vl-a"><rect x="60" y="192" width="32" height="24" rx="9" fill="#5a3417" stroke="#1f1006" stroke-width="2.2"/><rect x="60" y="192" width="32" height="8" rx="4" fill="url(#vlLaiton)" opacity=".85"/></g>'+
    '<g class="vl-patte vl-b"><rect x="228" y="192" width="32" height="24" rx="9" fill="#5a3417" stroke="#1f1006" stroke-width="2.2"/><rect x="228" y="192" width="32" height="8" rx="4" fill="url(#vlLaiton)" opacity=".85"/></g>'+
    /* l'intérieur, visible quand le couvercle se soulève : velours, lueur, goulots de fioles */
    '<g class="vl-interieur">'+
      '<rect x="30" y="94" width="260" height="18" rx="5" fill="url(#vlVelours)" stroke="#1f1006" stroke-width="2.2"/>'+
      '<rect x="31" y="95" width="16" height="16" rx="4" fill="#1a0a10" opacity=".65"/><rect x="273" y="95" width="16" height="16" rx="4" fill="#1a0a10" opacity=".65"/>'+
      '<ellipse class="vl-lueur" cx="160" cy="98" rx="104" ry="20" fill="url(#vlLueur)"/>'+
    '</g>'+
    '<g class="vl-corps">'+
      '<rect x="26" y="104" width="268" height="94" rx="14" fill="url(#vlCuir)" stroke="#1f1006" stroke-width="3"/>'+
      '<g stroke="#3a1d09" stroke-width="1.4" fill="none" opacity=".45"><path d="M44 126q8-5 16 0M110 178q9-5 18 0M200 130q9-4 17 0M262 172q8-5 16 0M150 152q7-4 14 0M58 170q6-3 12 0M268 124q6-3 12 0"/></g>'+
      '<rect x="35" y="113" width="250" height="76" rx="9" fill="none" stroke="#f0d79a" stroke-width="1.3" stroke-dasharray="6 5" opacity=".75"/>'+
      '<rect x="72" y="104" width="20" height="94" fill="url(#vlFer)" stroke="#111" stroke-width="1.5"/>'+
      '<rect x="228" y="104" width="20" height="94" fill="url(#vlFer)" stroke="#111" stroke-width="1.5"/>'+
      '<g fill="url(#vlLaiton)" stroke="#3a2406" stroke-width="1"><circle cx="82" cy="120" r="3.6"/><circle cx="82" cy="152" r="3.6"/><circle cx="82" cy="184" r="3.6"/><circle cx="238" cy="120" r="3.6"/><circle cx="238" cy="152" r="3.6"/><circle cx="238" cy="184" r="3.6"/></g>'+
      '<g fill="url(#vlLaiton)" stroke="#3a2406" stroke-width="1.5"><path d="M26 174v12q0 12 14 12h16v-10H42q-4 0-4-4v-10z"/><path transform="translate(320 0) scale(-1 1)" d="M26 174v12q0 12 14 12h16v-10H42q-4 0-4-4v-10z"/></g>'+
    '<g class="vl-coins"><path d="M31 104H74C60 108 50 116 44 130C36 126 31 118 31 108Z" fill="#1f0810"/><path d="M289 104H246C260 108 270 116 276 130C284 126 289 118 289 108Z" fill="#1f0810"/></g>'+
    '<g class="vl-serrure"><rect x="142" y="120" width="36" height="42" rx="7" fill="url(#vlLaiton)" stroke="#3a2406" stroke-width="2.2"/><circle cx="160" cy="139" r="5.5" fill="#2a1608"/><path d="M156.5 141h7l2.6 13h-12.2z" fill="#2a1608"/></g>'+
    '</g>'+
    /* l'étiquette de parchemin pend à la serrure et se balance */
    '<path d="M178 136Q204 142 230 166" fill="none" stroke="#3a2406" stroke-width="1.5"/>'+
    '</svg>'+
    '<svg class="vl-haut" viewBox="0 0 320 232" aria-hidden="true" focusable="false">'+
    '<g class="vl-couvercle"><g class="vl-dome">'+
      '<path d="M26 98Q26 56 76 50L244 50Q294 56 294 98Q160 134 26 98Z" fill="url(#vlCuirC)" stroke="#1f1006" stroke-width="3"/>'+
      '<path d="M37 99Q37 65 80 59L240 59Q283 65 283 99" fill="none" stroke="#f0d79a" stroke-width="1.3" stroke-dasharray="6 5" opacity=".75"/>'+
      '<path d="M72 51H92V112L72 108Z" fill="url(#vlFer)" stroke="#111" stroke-width="1.5" stroke-linejoin="round"/><path d="M228 51H248V108L228 112Z" fill="url(#vlFer)" stroke="#111" stroke-width="1.5" stroke-linejoin="round"/>'+
      '<g fill="url(#vlLaiton)" stroke="#3a2406" stroke-width="1"><circle cx="82" cy="66" r="3.6"/><circle cx="82" cy="88" r="3.6"/><circle cx="238" cy="66" r="3.6"/><circle cx="238" cy="88" r="3.6"/></g>'+
      '<path d="M99 116H121V135Q121 143 110 143Q99 143 99 135Z" fill="rgba(20,8,2,.32)"/>'+
      '<path class="vl-dent" d="M96 112H117V131Q117 139 106.500 139Q96 139 96 131Z" fill="url(#vlDent)" stroke="#4a2e12" stroke-width="1.6" stroke-linejoin="round"/><path d="M102 117V127" stroke="#ffffff" stroke-opacity=".7" stroke-width="2" stroke-linecap="round"/>'+
      '<path d="M26 98Q160 134 294 98" fill="none" stroke="#3a2406" stroke-width="11" stroke-linecap="round"/><path d="M26 98Q160 134 294 98" fill="none" stroke="url(#vlLaiton)" stroke-width="8" stroke-linecap="round"/>'+
      '</g>'+
      '<g class="vl-anse"><path d="M128 53Q128 22 160 22Q192 22 192 53" fill="none" stroke="#2a1408" stroke-width="10" stroke-linecap="round"/><path d="M128 53Q128 26 160 26Q192 26 192 53" fill="none" stroke="#8a5a2b" stroke-width="3" stroke-linecap="round"/><circle cx="128" cy="53" r="5.5" fill="url(#vlLaiton)" stroke="#3a2406" stroke-width="1.3"/><circle cx="192" cy="53" r="5.5" fill="url(#vlLaiton)" stroke="#3a2406" stroke-width="1.3"/></g>'+
      '<g class="vl-yeux">'+
        '<g class="vl-etiquette"><path d="M29 80Q19 86 25 97" fill="none" stroke="#2a1408" stroke-width="3" stroke-linecap="round"/><path d="M29 80Q19 86 25 97" fill="none" stroke="#8a5a2b" stroke-width="1.2" stroke-linecap="round"/><rect x="3" y="96" width="46" height="30" rx="4" fill="#f1deb0" stroke="#5a3a12" stroke-width="1.5"/><circle cx="26" cy="102" r="2.4" fill="#5a3a12"/><text x="26" y="119" text-anchor="middle" font-size="10" fill="#4a2a08" font-family="Bangers,Impact,sans-serif">FIOLES</text><circle cx="29" cy="80" r="3.6" fill="url(#vlLaiton)" stroke="#3a2406" stroke-width="1"/></g>'+
        '<ellipse cx="124" cy="80" rx="16" ry="14" fill="#fff6dd" stroke="#1f1006" stroke-width="2.2"/><ellipse cx="196" cy="80" rx="16" ry="14" fill="#fff6dd" stroke="#1f1006" stroke-width="2.2"/>'+
        '<g class="vl-pupille vl-pg"><circle cx="124" cy="80" r="5.2" fill="#1a0d05"/><circle cx="126" cy="77.8" r="1.7" fill="#fff"/></g>'+
        '<g class="vl-pupille vl-pd"><circle cx="196" cy="80" r="5.2" fill="#1a0d05"/><circle cx="198" cy="77.8" r="1.7" fill="#fff"/></g>'+
        '<ellipse class="vl-paupiere" cx="124" cy="80" rx="16.6" ry="14.6" fill="url(#vlCuirC)" stroke="#1f1006" stroke-width="2.2"/><ellipse class="vl-paupiere" cx="196" cy="80" rx="16.6" ry="14.6" fill="url(#vlCuirC)" stroke="#1f1006" stroke-width="2.2"/>'+
        '<path d="M106 62Q124 52 142 62M178 62Q196 52 214 62" fill="none" stroke="#2a1608" stroke-width="3.4" stroke-linecap="round"/>'+
      '</g>'+
    '</g>'+
    '<g class="vl-zzz" fill="#fff6dd" stroke="#1f1006" stroke-width="1.3" font-family="Bangers,Impact,sans-serif"><text class="vl-z1" x="250" y="44" font-size="26">Z</text><text class="vl-z2" x="270" y="26" font-size="20">z</text><text class="vl-z3" x="286" y="12" font-size="15">Z</text></g>'+
    '</svg>';

  /* ---------- la langue : trois pièces dessinées (racine, corps qui se répète, bout), mêmes bords qui se raccordent ---------- */
  var ROSE='#e3607f',CONTOUR='#5a1028',RAINURE='#a8305a';
  function papilles(pts){return pts.map(function(p){return '<circle cx="'+p[0]+'" cy="'+p[1]+'" r="'+(p[2]||2.6)+'" fill="#f4a3b8" opacity=".6"/>';}).join('');}
  var TUILE_SVG='<svg xmlns="http://www.w3.org/2000/svg" width="262" height="160" viewBox="0 0 262 160">'+
    '<path d="M14 0C6 28 22 56 12 84C4 112 20 136 14 160H248C254 132 240 108 250 80C258 52 242 26 248 0Z" fill="'+ROSE+'"/>'+
    '<path d="M131 0C127 40 135 80 131 120C128 140 133 150 131 160" fill="none" stroke="'+RAINURE+'" stroke-width="2.2" opacity=".85"/>'+
    papilles([[50,22],[84,50],[48,96],[92,128],[176,30],[214,64],[170,108],[212,140],[110,12],[150,76],[64,150],[198,100]])+
    '<ellipse cx="66" cy="72" rx="12" ry="38" fill="#fff" opacity=".2"/>'+
    '<path d="M14 0C6 28 22 56 12 84C4 112 20 136 14 160" fill="none" stroke="'+CONTOUR+'" stroke-width="3.4"/>'+
    '<path d="M248 0C242 26 258 52 250 80C240 108 254 132 248 160" fill="none" stroke="'+CONTOUR+'" stroke-width="3.4"/></svg>';
  var TUILE='data:image/svg+xml,'+encodeURIComponent(TUILE_SVG);
  /* La racine : la base de la langue, aussi large que la bouche (l'ouverture de la valise). Posée sur la lèvre inférieure (le bord du corps de la valise), elle bombe vers l'avant, puis la langue retombe sur la façade. */
  /* La base de la langue (largeur inchangée : épaules arrondies) : posée sur la lèvre inférieure. Les coins de la bouche, de chaque côté de ses épaules, sont sombres (l'intérieur), pas de cuir. */
  var RACINE='<svg viewBox="0 0 262 72" aria-hidden="true" focusable="false"><defs><linearGradient id="vlOmbreLg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a0010" stop-opacity=".85"/><stop offset=".34" stop-color="#2a0010" stop-opacity=".45"/><stop offset=".62" stop-color="#2a0010" stop-opacity="0"/></linearGradient></defs>'+
    '<path d="M14 22C34 12 80 5 131 5C182 5 228 12 248 22V72H14Z" fill="'+ROSE+'"/>'+
    '<path d="M131 5V72" stroke="'+RAINURE+'" stroke-width="2.2" opacity=".85"/>'+papilles([[56,36,2.4],[100,26,2.4],[162,26,2.4],[206,36,2.4],[84,56,2.4],[180,56,2.4]])+
    '<ellipse cx="72" cy="40" rx="22" ry="6" fill="#fff" opacity=".22"/>'+
    '<path d="M14 22C34 12 80 5 131 5C182 5 228 12 248 22V72H14Z" fill="url(#vlOmbreLg)"/>'+
    '<path d="M14 72V22C34 12 80 5 131 5C182 5 228 12 248 22V72" fill="none" stroke="'+CONTOUR+'" stroke-width="3.4" stroke-linejoin="round"/></svg>';
  var BOUT='<svg viewBox="0 0 262 104" aria-hidden="true" focusable="false"><path d="M14 0H248C256 46 208 102 131 102C54 102 6 46 14 0Z" fill="'+ROSE+'"/>'+
    '<path d="M131 0V74" stroke="'+RAINURE+'" stroke-width="2.2" opacity=".85" stroke-linecap="round"/>'+papilles([[60,20],[92,52],[170,24],[204,48],[120,84],[146,70]])+
    '<ellipse cx="86" cy="44" rx="16" ry="24" fill="#fff" opacity=".22"/>'+
    '<path d="M14 0C6 46 54 102 131 102C208 102 256 46 248 0" fill="none" stroke="'+CONTOUR+'" stroke-width="3.4"/></svg>';

  /* Le rouleau de langue : le bout enroulé de la langue (un cylindre aux deux faces en spirale). Son rayon diminue à mesure que la langue se déroule et il tourne de la longueur sortie (anime()). */
  var ROULEAU='<b class="vl-ro-corps"></b>';

  /* Icône de graine (dessinée, sans fichier) : une graine brune qui germe, dans le même écrin que les images de la boutique. */
  var GRAINE='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" fill="#cfe8b0"/><path d="M24 22C24 14 18 10 12 11C12 18 17 23 24 22Z" fill="#4aa33a" stroke="#1f3a14" stroke-width="2"/><path d="M24 22C25 15 30 11 36 12C35 19 30 23 24 22Z" fill="#5cbc47" stroke="#1f3a14" stroke-width="2"/><path d="M24 22V28" stroke="#1f3a14" stroke-width="2.4"/><ellipse cx="24" cy="34" rx="8" ry="10" fill="#a8692c" stroke="#3a200a" stroke-width="2.4"/><path d="M21 30C22 34 21 38 20 40" fill="none" stroke="#e6b97a" stroke-width="2" stroke-linecap="round"/></svg>');
  function nb(q){var f=reg_().formatGrandNombreIdleV70_;try{return typeof f==='function'?String(f(q)):String(q);}catch(_e){return String(q);}}

  /* ---------- le contenu des étages ---------- */
  function artPotion(p,q){
    return '<div class="vl-art vl-potion" data-vl-art="'+esc(p.id)+'" title="'+esc(p.nom)+'">'+
      '<span class="vl-pastille">× '+esc(String(q))+'</span>'+
      '<img src="/shop/'+p.img+'.png" alt="" width="46" height="46" loading="lazy" decoding="async" onerror="this.remove()">'+
      '<span class="vl-etiq">'+esc(p.nom)+'</span>'+
      '<button type="button" class="vl-util" data-vl-utiliser="'+esc(p.id)+'">Utiliser</button>'+
    '</div>';
  }
  function artActif(o,restant,beta){
    var image=(restant>0||!o.beta)?o.img:o.beta;
    return '<div class="vl-art vl-actif" title="'+esc(o.nom)+'">'+
      '<span class="vl-bulles" aria-hidden="true"></span>'+
      '<img src="/shop/'+image+'.png" alt="" width="46" height="46" loading="lazy" decoding="async" onerror="this.remove()">'+
      '<span class="vl-etiq">'+esc(o.nom)+'</span>'+
      (restant>0?'<span class="vl-plaque">'+esc(duree(restant))+'</span>':'')+
      (beta?'<span class="vl-plaque vl-rebirth">jusqu’au Rebirth</span>':'')+
    '</div>';
  }
  function artReserve(o,n){
    return '<div class="vl-art vl-reserve" title="'+esc(o.nom)+'">'+
      '<span class="vl-pastille">× '+esc(nb(n))+'</span>'+
      '<img src="'+(o.icone==='graine'?GRAINE:'/shop/'+o.img+'.png')+'" alt="" width="46" height="46" loading="lazy" decoding="async" onerror="this.remove()">'+
      '<span class="vl-etiq">'+esc(o.nom)+'</span>'+
    '</div>';
  }
  /* La langue : sortie de la bouche de la valise, elle porte TOUS les objets ; elle est d'autant plus longue qu'il y en a (une langue par rang d'objets) ; sans objet, pas de langue. */
  function groupe(titre,contenu){
    return contenu?'<div class="vl-groupe"><p class="vl-enseigne"><span>'+esc(titre)+'</span></p><div class="vl-rang">'+contenu+'</div></div>':'';
  }
  function langue(potions,actifs,reserves,n){
    if(!n)return '<p class="vl-rien">Rien là-dedans… pour l’instant.</p>';
    return '<div class="vl-langue" data-n="'+n+'"><div class="vl-lg-racine">'+RACINE+'</div><div class="vl-lg-corps">'+
      groupe('Potions',potions.join(''))+groupe('En cours',actifs.join(''))+groupe('Réserves',reserves.join(''))+
    '</div><div class="vl-lg-bout">'+BOUT+'</div></div>';
  }

  /* Phrases de la valise, affichées quand elle est ouverte (comme « Il mange les objets… » du Coffre) : toujours en français, ton rustre. Une nouvelle à chaque ouverture. */
  var PHRASES=[
    ['Elle ne mange pas : elle livre.','Ouvre grand : la langue te sert potions, graines et autres cochonneries. Pourboire non accepté.'],
    ['Livraison à domicile, par la bouche.','Les fioles sont fraîches, la salive aussi.'],
    ['Service d’étage !','Une langue, un plateau, zéro hygiène. Ne lèche pas la marchandise.'],
    ['Elle a la langue bien pendue.','Tout ce que tu possèdes est posé dessus. Ne la chatouille pas, elle rit en lançant des fioles.'],
    ['Le dépôt-vente le plus gluant du royaume.','Prends ce qu’il te faut ; ce qui est tombé par terre est à elle.']
  ];
  var CLE_PHRASE='soreal_idle_valise_phrase_v1';   /* indice de la phrase affichée à la place de celle du Coffre ; vide = celle du Coffre */
  function phraseIdx(){try{var v=localStorage.getItem(CLE_PHRASE);return v===null||v===''?-1:Math.max(0,parseInt(v,10)||0)%PHRASES.length;}catch(_e){return -1;}}
  function phraseActive(){return phraseIdx()>=0;}
  function poserPhrase(i){try{localStorage.setItem(CLE_PHRASE,i<0?'':String(i));}catch(_e){}}
  /* Le bloc de texte de la valise, posé dans la zone du Coffre à côté de celui du Coffre ; la classe vl-phrase-on de la zone choisit lequel est affiché. */
  function phraseBlocHtml(){var p=PHRASES[Math.max(0,phraseIdx())];return '<div class="bg-texte-v1 vl-phrase-bloc" data-sans-traduction><b>'+esc(p[0])+'</b><span>'+esc(p[1])+'</span></div>';}
  function coffreOuvert(){try{return localStorage.getItem('soreal_idle_coffre_ouvert_v1')==='1';}catch(_e){return false;}}
  var coffreAvant=coffreOuvert();
  /* Le fond du cadre est celui du DERNIER ouvert, et il persiste une fois refermé (Norman, 2026-10-23) : velours pour la valise, tapis vert de billard pour le Coffre. Lié au compte (clé soreal_idle_*). */
  var CLE_DERNIER='soreal_idle_dernier_ouvert_v1';
  function dernier(){try{var v=localStorage.getItem(CLE_DERNIER);return v==='valise'||v==='coffre'?v:'';}catch(_e){return '';}}
  function noterDernier(qui){if(dernier()===qui)return;try{localStorage.setItem(CLE_DERNIER,qui);}catch(_e){}}
  if(coffreAvant&&!dernier())noterDernier('coffre');
  function synchroniserCoffre(){
    var on=phraseActive();
    [].slice.call(document.querySelectorAll('[data-idle-coffre-drop-v180]')).forEach(function(z){
      if(z.classList.contains('vl-phrase-on')!==on)z.classList.toggle('vl-phrase-on',on);
      var b=z.querySelector('.vl-phrase-bloc');
      if(on&&b){var p=PHRASES[phraseIdx()];var t=b.querySelector('b');if(t&&t.textContent!==p[0]){b.outerHTML=phraseBlocHtml();}}
    });
    /* le velours : le fond du Coffre devient un velours tant que la valise est ouverte (jusqu'à la fin de son enroulement) */
    var d=dernier();
    [].slice.call(document.querySelectorAll('.soreal-idle-coffre-v1')).forEach(function(c){
      if(c.classList.contains('vl-velours')!==(d==='valise'))c.classList.toggle('vl-velours',d==='valise');
      if(c.classList.contains('vl-tapis')!==(d==='coffre'))c.classList.toggle('vl-tapis',d==='coffre');
    });
  }

  function contenu(){
    var c=donnees(),n=0;
    var potions=[],actifs=[],reserves=[];
    POTIONS.forEach(function(p){var q=Math.floor(Number(c.potions&&c.potions[p.id])||0);if(q>0){n+=q;potions.push(artPotion(p,q));}});
    EFFETS.forEach(function(e){
      var r=Number(c.restant&&c.restant[e.id])||0,b=Boolean(e.beta&&c.beta&&c.beta[e.id]);
      if(r>0||b){n+=1;actifs.push(artActif(e,r,b));}
    });
    RESERVES.forEach(function(e){var q=Math.floor(Number(c.reserve&&c.reserve[e.id])||0);if(q>0){n+=1;reserves.push(artReserve(e,q));}});
    /* signature : change quand un objet arrive ou part (les temps ne comptent qu'à la minute près) */
    var sig=JSON.stringify([c.potions||{},Object.keys(c.restant||{}).map(function(k){return k+':'+Math.floor((c.restant[k]||0)/60);}),c.beta||{},c.reserve||{}]);
    return {n:n,sig:sig,langue:langue(potions,actifs,reserves,n)};
  }

  function html(){
    var o=ouverte(),k=contenu();
    style_();
    return '<div class="vl-section'+(o?' vl-ouverte':'')+(dort?' vl-dort':'')+'" data-vl data-vl-sig="'+esc(k.sig)+'" data-morph-classes-gardees="'+MOTIF_CLASSES+'">'+
      '<div class="vl-creature" data-vl-bascule role="button" tabindex="0" aria-expanded="'+(o?'true':'false')+'" aria-label="Valise des consommables"><div class="vl-bete">'+SVG+'<span class="vl-bulle" data-sans-traduction aria-hidden="true"></span></div></div>'+
      '<div class="vl-deplie"><div class="vl-deplie-in">'+
        k.langue+
      '</div>'+(k.n?'<i class="vl-rouleau" aria-hidden="true">'+ROULEAU+'</i>':'')+'</div>'+
    '</div>';
  }

  /* Contenu en direct : si un objet arrive (roue, set, achat…) ou part pendant que la valise est affichée, ses étages sont refaits sur place (sans redessiner la page, sans toucher à l'animation en cours). */
  function rafraichirContenu(){
    if(animId)return;
    var k=null;
    sections().forEach(function(s){
      if(s.getAttribute('data-vl-sig')===(k=k||contenu()).sig)return;
      var dedans=s.querySelector('.vl-deplie-in');
      if(!dedans)return;
      dedans.innerHTML=k.langue;
      var dep=s.querySelector('.vl-deplie'),rou=s.querySelector('.vl-rouleau');
      if(k.n&&!rou&&dep){var i=document.createElement('i');i.className='vl-rouleau';i.setAttribute('aria-hidden','true');i.innerHTML=ROULEAU;dep.appendChild(i);}
      if(!k.n&&rou)rou.remove();
      s.setAttribute('data-vl-sig',k.sig);
    });
  }

  /* ---------- le style : cuir, fer, laiton, parchemin ---------- */
  var styleOk=false;
  function style_(){
    if(styleOk||document.getElementById('soreal-idle-valise-style'))return;
    styleOk=true;
    var s=document.createElement('style');s.id='soreal-idle-valise-style';
    s.textContent=CSS;
    (document.head||document.documentElement).appendChild(s);
  }
  var P='html body.soreal-idle-active-v47.soreal-idle-active-v47 .vl-section';
  var CSS=`
/* Pas de cadre propre à la valise (Norman, 2026-10-23) : elle vit dans le cadre du Coffre, sur PC comme sur téléphone */
${P}{container-type:inline-size;position:relative;margin:10px 0 0;padding:0 0 8px;color:#f5e6c4}
${P} .vl-creature{position:relative;display:flex;justify-content:center;padding:14px 0 2px;cursor:pointer;-webkit-tap-highlight-color:transparent}
${P} .vl-bete{position:relative;width:min(210px,70%)}
${P} .vl-bete svg{display:block;width:100%;height:auto;overflow:visible}
/* le couvercle, les yeux et l'anse passent AU-DESSUS de la langue : elle sort de l'ouverture de la valise (entre le couvercle et le corps), la bouche, sans rien de dessiné */
${P} .vl-bete svg.vl-haut{position:absolute;left:0;top:0;z-index:5;pointer-events:none}
${P} .vl-corps{transform-origin:160px 200px;animation:vlRespire 3.8s ease-in-out infinite}
@keyframes vlRespire{0%,100%{transform:scale(1,1)}50%{transform:scale(1.012,.988)}}
${P} .vl-patte{transform-box:fill-box;transform-origin:50% 0;animation:vlTrotte 1.1s ease-in-out infinite}
${P} .vl-patte.vl-b{animation-delay:-.55s}
@keyframes vlTrotte{0%,100%{transform:rotate(-7deg)}50%{transform:rotate(7deg)}}
${P} .vl-anse{transform-box:fill-box;transform-origin:50% 100%;animation:vlAnse 5.2s ease-in-out infinite}
@keyframes vlAnse{0%,70%,100%{transform:rotate(0)}76%{transform:rotate(-6deg)}84%{transform:rotate(5deg)}92%{transform:rotate(-2deg)}}
${P} .vl-etiquette{transform-origin:29px 80px;animation:vlBalance 3.4s ease-in-out infinite}
@keyframes vlBalance{0%,100%{transform:rotate(-7deg)}50%{transform:rotate(7deg)}}
${P} .vl-paupiere{transform-box:fill-box;transform-origin:50% 0;transform:scaleY(0);animation:vlCligne 4.6s ease-in-out infinite}
@keyframes vlCligne{0%,92%,100%{transform:scaleY(0)}95%,97%{transform:scaleY(1)}}
/* Les yeux d'un fou : chaque pupille part de son côté, dans une autre direction (haut, bas, de travers, louchant), à son propre rythme (durées premières : elles ne se synchronisent jamais) */
${P} .vl-pupille{animation-timing-function:cubic-bezier(.65,0,.35,1);animation-iteration-count:infinite}
${P} .vl-pg{animation-name:vlFouG;animation-duration:2.9s}
${P} .vl-pd{animation-name:vlFouD;animation-duration:2.3s}
@keyframes vlFouG{0%{transform:translate(-7px,-5px)}13%{transform:translate(8px,5px)}27%{transform:translate(-2px,6px)}41%{transform:translate(7px,-6px)}55%{transform:translate(-8px,2px)}70%{transform:translate(3px,-7px)}84%{transform:translate(7px,6px)}100%{transform:translate(-7px,-5px)}}
@keyframes vlFouD{0%{transform:translate(8px,5px)}16%{transform:translate(-8px,-5px)}30%{transform:translate(4px,-7px)}46%{transform:translate(-3px,7px)}60%{transform:translate(8px,-2px)}75%{transform:translate(-8px,5px)}88%{transform:translate(1px,-7px)}100%{transform:translate(8px,5px)}}
/* Le couvercle est articulé à l'ARRIÈRE (son bord haut, collé au fond de la valise) : il s'ouvre en levant seulement son avant, le dôme se raccourcit autour de ce bord (perspective), les yeux suivent */
${P} .vl-dome{transform-origin:160px 52px;transition:transform .55s cubic-bezier(.3,1.35,.5,1);animation:vlBaille 7s ease-in-out infinite}
${P} .vl-yeux{transition:transform .55s cubic-bezier(.3,1.35,.5,1)}
@keyframes vlBaille{0%,82%,100%{transform:scaleY(1)}88%{transform:scaleY(.9)}94%{transform:scaleY(.98)}}
${P} .vl-interieur,${P} .vl-coins{opacity:0;transition:opacity .4s}
${P}.vl-ouverte .vl-interieur,${P}.vl-ouverte .vl-coins{opacity:1}
${P}.vl-ouverte .vl-dome{animation:none;transform:scaleY(.74)}
/* bâillement (Norman, 2026-10-23) : le couvercle s'ouvre en grand, les yeux se plissent, le corps s'étire, puis tout se referme (2,2 s, comme le son) */
${P}.vl-baille:not(.vl-ouverte) .vl-dome{animation:vlBailleGrand 2.2s ease-in-out 1}
${P}.vl-baille:not(.vl-ouverte) .vl-corps{animation:vlBailleCorps 2.2s ease-in-out 1}
${P}.vl-baille:not(.vl-ouverte) .vl-paupiere{animation:none;transform:scaleY(1)}
@keyframes vlBailleGrand{0%{transform:scaleY(1)}30%,72%{transform:scaleY(.5)}100%{transform:scaleY(1)}}
@keyframes vlBailleCorps{0%{transform:scale(1,1)}30%,72%{transform:scale(.97,1.05)}100%{transform:scale(1,1)}}
${P}.vl-ouverte .vl-yeux{transform:translateY(-7px)}
${P} .vl-lueur{animation:vlLueur 2.6s ease-in-out infinite}
@keyframes vlLueur{0%,100%{opacity:.55}50%{opacity:1}}
/* la valise dort : yeux clos, plus de trottinement, des Z qui montent (boucle sans à-coup : fondu d'entrée et de sortie, toujours vers le haut) */
${P} .vl-zzz{opacity:0}
${P}.vl-dort .vl-paupiere{animation:none;transform:scaleY(1)}
${P}.vl-dort .vl-pupille,${P}.vl-dort .vl-patte,${P}.vl-dort .vl-anse,${P}.vl-dort .vl-etiquette,${P}.vl-dort .vl-dome{animation:none}
${P}.vl-dort .vl-corps{animation-duration:6.5s}
${P}.vl-dort .vl-zzz{opacity:1}
${P}.vl-dort .vl-zzz text{animation:vlZ 3s ease-in-out infinite;transform-box:fill-box;opacity:0}
${P}.vl-dort .vl-z2{animation-delay:-1s}
${P}.vl-dort .vl-z3{animation-delay:-2s}
@keyframes vlZ{0%{opacity:0;transform:translate(0,8px)}25%,70%{opacity:1}100%{opacity:0;transform:translate(8px,-14px)}}
/* la réplique */
${P} .vl-bulle{position:absolute;right:-6px;bottom:calc(100% - 6px);z-index:7;width:max-content;max-width:100%;padding:5px 12px;border:3px solid #3a2300;border-radius:12px;background:#fff7d6;color:#3a2300;font:400 17px/1.15 Bangers,"Russo One",Impact,sans-serif;letter-spacing:.03em;opacity:0;pointer-events:none;transform:translateY(8px) rotate(3deg);transition:opacity .25s,transform .25s}
${P}.vl-parle .vl-bulle{opacity:1;transform:translateY(0) rotate(3deg)}
/* réveil en sursaut / potion bue : la valise saute sur place */
${P}.vl-glou .vl-bete{animation:vlSaut .55s cubic-bezier(.3,1.6,.5,1)}
@keyframes vlSaut{0%{transform:translateY(0) scale(1)}35%{transform:translateY(-12px) scale(1.04,.97)}100%{transform:translateY(0) scale(1)}}
/* la bouche (sous le nez-serrure) s'ouvre avec la valise : la langue en sort, d'autant plus longue qu'il y a d'objets */
/* Le dépliage commence DANS la bouche, à la hauteur de la lèvre inférieure, ouvert comme fermé (--vl-m = la distance de la bouche au bas de la valise) : le recouvrement est compensé par une hauteur minimale, donc la mise en page ne bouge jamais et la langue ne se détache pas de la bouche pendant qu'elle s'enroule. */
${P} .vl-deplie{--vl-m:calc(min(210px,70cqw)*.444);position:relative;z-index:3;margin-top:calc(var(--vl-m)*-1);min-height:var(--vl-m)}
${P} .vl-etiq{font-size:12px;padding:2px 4px}
/* La partie visible de la langue = la longueur déroulée (--vl-p de 0 à 1 fois la hauteur mesurée --vl-h) : animée image par image par le module (anime()), jamais par une simple transition */
${P} .vl-deplie-in{overflow:hidden;padding:0;max-height:calc(var(--vl-h,0)*var(--vl-pf,var(--vl-p,0))*1px)}
/* la partie de langue visible suit --vl-p ; le cadre (la boîte) suit --vl-pf, en retard à la fermeture : la langue est bien visible en s'enroulant */
${P}.vl-anim .vl-langue{clip-path:inset(0 0 calc(var(--vl-h,0)*(1 - var(--vl-p,0))*1px) 0)}
${P}.vl-ouverte:not(.vl-anim) .vl-deplie-in{max-height:none}
${P}:not(.vl-ouverte):not(.vl-anim) .vl-langue{visibility:hidden}
${P} .vl-rien{margin:calc(var(--vl-m) + 12px) 0 4px;text-align:center;font:400 15px/1.3 "Russo One",system-ui,sans-serif;font-style:italic;color:#e3d2a6;opacity:.9}
/* la langue : un ruban rose qui se déroule vers le bas (rétrécie à la bouche, plus large ensuite), contour sombre, sillon au milieu, petites papilles et reflet humide */
${P} .vl-langue{position:relative;width:min(176px,59cqw);margin:0 auto 6px;transform-origin:50% 0;filter:drop-shadow(0 8px 8px rgba(0,0,0,.5))}
${P}.vl-ouverte .vl-langue{animation:vlLangue 4.4s ease-in-out 1.2s infinite}
/* le rouleau : cylindre vu de face (axe horizontal, perspective de la valise) dont le rayon (--vl-rr) diminue pendant que la langue se déroule ; sa peau (papilles) défile de la longueur sortie (--vl-s) ; il grossit quand la langue s'enroule */
${P} .vl-rouleau{position:absolute;left:50%;z-index:4;width:min(176px,59cqw);margin-left:calc(min(176px,59cqw)/-2);top:calc(var(--vl-h,0)*var(--vl-p,0)*1px);height:calc(var(--vl-rr,0)*2px);transform:translateY(-50%);pointer-events:none;visibility:hidden;opacity:min(1,calc(var(--vl-p,0)*16),calc((1 - var(--vl-p,0))*16))}
${P}.vl-anim .vl-rouleau{visibility:visible}
${P} .vl-ro-corps{position:absolute;inset:0;border:2px solid #5a1028;border-radius:calc(var(--vl-rr,0)*.6px)/calc(var(--vl-rr,0)*.9px);box-shadow:0 6px 6px rgba(0,0,0,.4);
  background:linear-gradient(180deg,rgba(60,8,28,.7),rgba(255,255,255,.3) 38%,rgba(255,255,255,0) 56%,rgba(60,8,28,.55)),linear-gradient(90deg,transparent calc(50% - 1.5px),rgba(110,15,50,.7) calc(50% - 1.5px) calc(50% + 1.5px),transparent calc(50% + 1.5px)),radial-gradient(circle,#f4a3b8 0 2.4px,transparent 3px) 0 calc(var(--vl-s,0)*1px)/26px 22px,#e3607f}
@keyframes vlLangue{0%,100%{transform:scaleY(1) rotate(0)}50%{transform:scaleY(1.012) rotate(.5deg)}}
${P} .vl-lg-racine svg,${P} .vl-lg-bout svg{display:block;width:100%;height:auto;overflow:visible}
${P} .vl-lg-racine{margin-bottom:-1px}
${P} .vl-lg-bout{margin-top:-1px}
${P} .vl-lg-corps{display:grid;gap:12px;justify-items:center;padding:6px 18px 4px;background:url("${TUILE}") center top/100% auto repeat-y}
${P} .vl-groupe{width:100%}
${P} .vl-enseigne{display:flex;justify-content:center;margin:0 0 4px}
${P} .vl-enseigne span{padding:2px 20px 3px;font:400 16px/1.1 Bangers,"Russo One",Impact,sans-serif;letter-spacing:.07em;color:#3a2300;background:linear-gradient(180deg,#f6e6b5,#dcc17c);clip-path:polygon(0 0,100% 0,96% 50%,100% 100%,0 100%,4% 50%)}
${P} .vl-rang{display:flex;flex-wrap:wrap;justify-content:center;align-items:flex-end;gap:8px 6px}
${P} .vl-art{position:relative;display:flex;flex-direction:column;align-items:center;gap:3px;width:80px;padding:4px 2px 6px;text-align:center;min-width:0}
${P} .vl-art img{width:46px;height:46px;object-fit:contain;border-radius:9px;border:2px solid rgba(20,8,2,.7);box-shadow:0 0 0 1px rgba(255,214,140,.35);filter:drop-shadow(0 3px 2px rgba(0,0,0,.65));animation:vlBalancoire 3.2s ease-in-out infinite}
${P} .vl-art:nth-child(2n) img{animation-delay:-1.1s}
${P} .vl-art:nth-child(3n) img{animation-delay:-2.2s}
@keyframes vlBalancoire{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(-3px) rotate(2deg)}}
${P} .vl-etiq{display:block;padding:2px 6px;border-radius:3px;background:linear-gradient(180deg,#f1deb0,#d8bd7a);border:1.5px solid #5a3a12;color:#3a2300;font:400 12.5px/1.15 "Russo One",system-ui,sans-serif;overflow-wrap:anywhere;box-shadow:0 2px 0 rgba(0,0,0,.45)}
${P} .vl-pastille{position:absolute;right:6px;top:0;z-index:2;min-width:26px;padding:1px 7px;border-radius:50% 50% 50% 50%/55% 55% 45% 45%;background:radial-gradient(circle at 35% 30%,#ff7a6a,#b01c1c 70%);border:2px solid #4a0808;color:#fff3d8;font:400 14px/1.3 Bangers,"Russo One",sans-serif;letter-spacing:.04em;text-shadow:0 1px 0 #4a0808;box-shadow:0 2px 0 rgba(0,0,0,.5)}
${P} .vl-plaque{display:block;padding:1px 8px;border-radius:5px;background:linear-gradient(180deg,#ffe58a,#c8901c);border:2px solid #5a3507;color:#3a2300;font:400 13px/1.25 "Russo One",system-ui,sans-serif;box-shadow:0 2px 0 rgba(0,0,0,.5)}
${P} .vl-rebirth{background:linear-gradient(180deg,#bff0c9,#6cc283);color:#0f3a1c;font-size:12px}
${P} .vl-util{margin-top:2px;padding:5px 12px;border-radius:7px;border:2px solid #1f1006;cursor:pointer;color:#fff1c8;font:400 14px/1 "Russo One",system-ui,sans-serif;text-shadow:0 1px 1px rgba(0,0,0,.65);
  background:linear-gradient(180deg,#8a5a2b,#5a3417);box-shadow:inset 0 1px 0 rgba(255,225,170,.5),0 3px 0 #1f1006}
${P} .vl-util:active{transform:translateY(2px);box-shadow:inset 0 1px 0 rgba(255,225,170,.5),0 1px 0 #1f1006}
/* potions actives : une lueur et des bulles qui montent (boucle sans à-coup : elles naissent et s'évanouissent, toujours vers le haut) */
${P} .vl-actif::before{content:"";position:absolute;left:50%;top:-2px;width:64px;height:64px;margin-left:-32px;border-radius:50%;background:radial-gradient(circle,rgba(255,236,160,.45),rgba(255,160,60,0) 68%);animation:vlAura 2.4s ease-in-out infinite;pointer-events:none}
@keyframes vlAura{0%,100%{opacity:.5}50%{opacity:1}}
${P} .vl-bulles{position:absolute;left:50%;top:6px;width:0;height:0;pointer-events:none}
${P} .vl-bulles::before,${P} .vl-bulles::after{content:"";position:absolute;width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.7);box-shadow:-9px 5px 0 -1px rgba(255,255,255,.6),9px 8px 0 -1px rgba(255,255,255,.6);opacity:0;animation:vlBulle 2.6s ease-in infinite}
${P} .vl-bulles::after{animation-delay:-1.3s;left:5px}
@keyframes vlBulle{0%{opacity:0;transform:translateY(22px)}20%{opacity:1}100%{opacity:0;transform:translateY(-22px)}}
${P} .vl-art.vl-glou img{animation:vlGlou .5s ease-out}
@keyframes vlGlou{0%{transform:scale(1)}40%{transform:scale(1.35) rotate(-14deg)}100%{transform:scale(.2) rotate(30deg);opacity:0}}
/* La phrase de la valise, quand elle est ouverte (comme « Il mange les objets… » du Coffre) */
/* Plus de barre « Coffre (n) » en haut du cadre (Norman, 2026-10-23) : le Coffre et la valise s'ouvrent en touchant leur créature */
html body.soreal-idle-active-v47.soreal-idle-active-v47 .soreal-idle-section-v8.soreal-idle-coffre-v1>.soreal-idle-coffre-titre-v1{display:none}
html body.soreal-idle-active-v47.soreal-idle-active-v47 .soreal-idle-section-v8.soreal-idle-coffre-v1{isolation:isolate;overflow:visible}
/* les règles de page (.soreal-idle-page-root-v28[data-menu]) remettaient overflow:hidden au cadre : les bulles étaient coupées ; même sélecteur, plus précis (Norman, 2026-10-23 : « il faut qu'elle sorte ») */
html body.soreal-idle-active-v47.soreal-idle-active-v47 .soreal-idle-page-root-v28[data-menu] .soreal-idle-section-v8.soreal-idle-coffre-v1.soreal-idle-coffre-v1.soreal-idle-coffre-v1{overflow:visible}
/* La phrase de la valise remplace « Il mange les objets… » tant que le Coffre n'a pas été ouvert */
html body.soreal-idle-active-v47.soreal-idle-active-v47 .soreal-idle-coffre-v1 [data-idle-coffre-drop-v180] .vl-phrase-bloc{display:none}
html body.soreal-idle-active-v47.soreal-idle-active-v47 .soreal-idle-coffre-v1 [data-idle-coffre-drop-v180].vl-phrase-on .bg-texte-v1:not(.vl-phrase-bloc){display:none}
html body.soreal-idle-active-v47.soreal-idle-active-v47 .soreal-idle-coffre-v1 [data-idle-coffre-drop-v180].vl-phrase-on .vl-phrase-bloc{display:block}
/* Valise ouverte : le fond du Coffre devient un joli velours (bordeaux, grain fin, ombre douce sur les bords) */
html body.soreal-idle-active-v47.soreal-idle-active-v47 .soreal-idle-coffre-v1 .vl-velours-fond{position:absolute;inset:0;z-index:-1;pointer-events:none;border-radius:inherit;opacity:0;transition:opacity .7s ease;
  background:radial-gradient(ellipse at 50% 20%,rgba(255,150,170,.16),transparent 55%),repeating-linear-gradient(45deg,rgba(255,255,255,.035) 0 1px,transparent 1px 3px),repeating-linear-gradient(-45deg,rgba(0,0,0,.2) 0 1px,transparent 1px 3px),radial-gradient(ellipse at 50% 0%,#8a1d3b 0%,#5a1229 46%,#2c0714 100%);
  box-shadow:inset 0 0 70px rgba(0,0,0,.65)}
html body.soreal-idle-active-v47.soreal-idle-active-v47 .soreal-idle-coffre-v1.vl-velours .vl-velours-fond{opacity:1}
/* le tapis vert (Coffre dernier ouvert, ou rien d'ouvert) est le fond du cadre lui-même (soreal-idle-itopod.css) : seul le velours de la valise passe par-dessus */
/* Sur ordinateur (Norman, 2026-10-23) : la valise est dans le MÊME cadre que le Coffre, à droite de « Il mange les objets… » ; plus de cadre de cuir propre */
@media (min-width:761px){
  /* le texte du Coffre ou de la valise est centré entre les deux (Norman, 2026-10-23) */
  html body.soreal-idle-active-v47.soreal-idle-active-v47 .soreal-idle-section-v8.soreal-idle-coffre-v1:has(>.vl-section)>[data-idle-coffre-drop-v180] .bg-texte-v1{text-align:center}
  html body.soreal-idle-active-v47.soreal-idle-active-v47 .soreal-idle-section-v8.soreal-idle-coffre-v1:has(>.vl-section){display:grid;grid-template-columns:minmax(0,760px) 240px;justify-content:center;column-gap:12px;align-items:start}
  html body.soreal-idle-active-v47.soreal-idle-active-v47 .soreal-idle-section-v8.soreal-idle-coffre-v1:has(>.vl-section)>.soreal-idle-coffre-titre-v1{grid-column:1/-1}
  html body.soreal-idle-active-v47.soreal-idle-active-v47 .soreal-idle-section-v8.soreal-idle-coffre-v1:has(>.vl-section)>[data-idle-coffre-drop-v180]{grid-column:1;grid-row:2}
  html body.soreal-idle-active-v47.soreal-idle-active-v47 .soreal-idle-section-v8.soreal-idle-coffre-v1:has(>.vl-section)>.vl-section{grid-column:2;grid-row:2}
  html body.soreal-idle-active-v47.soreal-idle-active-v47 .soreal-idle-section-v8.soreal-idle-coffre-v1.ouvert:has(>.vl-section)>div:last-child:not(.vl-section){grid-column:1/-1;grid-row:3}
  ${P}{margin:var(--vl-decal,19px) 0 0}
  ${P} .vl-art{width:70px}
  ${P} .vl-lg-corps{padding:6px 14px 4px}
}
@media (max-width:760px){
  html body.soreal-idle-active-v47.soreal-idle-active-v47 .soreal-idle-section-v8.soreal-idle-coffre-v1:has(>.vl-section){display:flex;flex-direction:column}
  html body.soreal-idle-active-v47.soreal-idle-active-v47 .soreal-idle-section-v8.soreal-idle-coffre-v1:has(>.vl-section)>[data-idle-coffre-drop-v180]{order:1}
  html body.soreal-idle-active-v47.soreal-idle-active-v47 .soreal-idle-section-v8.soreal-idle-coffre-v1:has(>.vl-section)>.vl-section{order:2;margin-top:8px;padding-top:12px;border-top:2px dashed rgba(216,169,63,.4)}
  html body.soreal-idle-active-v47.soreal-idle-active-v47 .soreal-idle-section-v8.soreal-idle-coffre-v1.ouvert:has(>.vl-section)>div:last-child:not(.vl-section){order:3}
}
@media (max-width:640px){
  ${P}{margin:0}
  ${P} .vl-bete{width:min(220px,70%)}
  ${P} .vl-deplie{--vl-m:calc(min(220px,70cqw)*.444)}
  ${P} .vl-langue,${P} .vl-rouleau{width:min(185px,59cqw)}
  ${P} .vl-rouleau{margin-left:calc(min(185px,59cqw)/-2)}
  ${P} .vl-art{width:76px}
  ${P} .vl-lg-corps{padding:6px 12px 4px}
}
@media (prefers-reduced-motion:reduce){
  ${P} *{animation:none;transition:none}
  ${P} .vl-langue{transform:none;opacity:1}
}
`;

  /* ---------- la vie : sommeil, répliques, ouverture ---------- */
  function sections(){return [].slice.call(document.querySelectorAll('.vl-section'));}
  function appliquer(){
    var maintenant=Date.now();
    sections().forEach(function(s){
      if(dort){if(!s.classList.contains('vl-dort'))s.classList.add('vl-dort');}else if(s.classList.contains('vl-dort'))s.classList.remove('vl-dort');
      var b=s.querySelector('.vl-bulle');
      var actif=parle&&maintenant<parle.jusqua;
      if(b){
        if(actif){if(b.textContent!==parle.texte)b.textContent=parle.texte;if(!s.classList.contains('vl-parle'))s.classList.add('vl-parle');}
        else if(s.classList.contains('vl-parle'))s.classList.remove('vl-parle');
      }
    });
  }
  function dire(texte){parle={texte:texte,jusqua:Date.now()+3600};appliquer();}
  function tirer(l){return l[Math.floor(Math.random()*l.length)];}
  function sauter(){
    sections().forEach(function(s){
      s.classList.remove('vl-glou');void s.offsetWidth;s.classList.add('vl-glou');
      clearTimeout(s.__vlSaut);s.__vlSaut=setTimeout(function(){s.classList.remove('vl-glou');},650);
    });
  }
  /* Bâillement rare (Norman, 2026-10-23) : jamais endormie, ouverte, en train de parler ni avec le Coffre qui bâille ; 3 à 8 minutes de présence à l'écran entre deux. */
  var visibleBaille=0,cibleBaille=180000+Math.random()*300000;
  function bailler(){
    if(window.__coffreBailleIdleV1__)return false;
    window.__valiseBailleIdleV1__=true;
    sections().forEach(function(s){s.classList.remove('vl-baille');void s.offsetWidth;s.classList.add('vl-baille');});
    son2('baille','valise');
    setTimeout(function(){sections().forEach(function(s){s.classList.remove('vl-baille');});window.__valiseBailleIdleV1__=false;},2300);
    return true;
  }
  function son2(m,a){try{var A=window.__SOREAL_IDLE_AUDIO_V199__;if(A&&typeof A[m]==='function')A[m](a);}catch(_e){}}
  /* Le sommeil est rare (4 à 9 minutes de présence à l'écran) et jamais en même temps que celui du Coffre (Norman, 2026-10-23). */
  function endormir(){
    if(window.__coffreDortIdleV1__){visibleAvant=Math.max(0,cibleSommeil-30000);return;}   /* le Coffre dort : on réessaie dans 30 s */
    dort=true;window.__valiseDortIdleV1__=true;visibleDormi=0;visibleRonfle=0;cibleRonfle=1500;appliquer();
  }
  function reveiller(avecSon){
    dort=false;window.__valiseDortIdleV1__=false;visibleAvant=0;cibleSommeil=240000+Math.random()*300000;
    if(avecSon)son('valiseTouche');
    sauter();dire(tirer(REVEILS));
  }
  /* Le dépliage, image par image : la longueur de langue sortie est --vl-p x la hauteur mesurée ; le rouleau de son bout a un rayon qui diminue (sa longueur enroulée restante) et tourne de la longueur sortie. Dans l'autre sens, la langue s'enroule dans la bouche. */
  var progres=null,animId=0;
  /* p = la longueur de langue sortie (le clic du rouleau) ; pf = la place que prend le cadre : à la fermeture il rétrécit 0,5 s APRÈS le début de l'enroulement, pour ne pas cacher l'animation (Norman, 2026-10-23). */
  function appliquerProgres(p,pf){
    if(pf==null)pf=p;
    progres=p;
    sections().forEach(function(s){
      var dedans=s.querySelector('.vl-deplie-in');
      if(!s.__vlH&&dedans)s.__vlH=dedans.scrollHeight+8;
      var H=s.__vlH||0,r0=Math.max(16,Math.min(46,Math.sqrt(7*H/Math.PI)));
      var rr=r0*(1-p),defile=H*p;
      if(!s.classList.contains('vl-anim'))s.classList.add('vl-anim');
      s.style.setProperty('--vl-h',String(H));
      s.style.setProperty('--vl-p',p.toFixed(4));
      s.style.setProperty('--vl-pf',pf.toFixed(4));
      s.style.setProperty('--vl-rr',rr.toFixed(2));
      s.style.setProperty('--vl-s',(defile%26).toFixed(1));   /* la peau du rouleau (vu de face, de côté : jamais de dessus) défile verticalement de la longueur de langue sortie */
    });
  }
  function finirProgres(p){
    sections().forEach(function(s){
      s.style.setProperty('--vl-p',String(p));s.style.setProperty('--vl-pf',String(p));s.style.setProperty('--vl-rr','0');
      s.classList.remove('vl-anim');
      /* la bouche (le couvercle) ne se referme qu'ici : la langue est entièrement repliée */
      if(p===0)s.classList.remove('vl-ouverte');
    });
    progres=p;animId=0;
    synchroniserCoffre();
  }
  function anime(vers){
    if(animId){cancelAnimationFrame(animId);animId=0;}
    var depart=progres==null?(vers?0:1):progres;
    sections().forEach(function(s){var d=s.querySelector('.vl-deplie-in');s.__vlH=d?d.scrollHeight+8:0;});
    if(reduit()||depart===vers){finirProgres(vers);return;}
    /* À l'ouverture, la bouche s'ouvre d'abord (0,34 s) puis la langue sort. */
    var retard=vers?340:0,duree=(vers?1300:1000)*Math.abs(vers-depart)+150,t0=null;
    var DELAI_CADRE=vers?0:500;   /* fermeture : le cadre ne rétrécit qu'une demi-seconde après le début de l'enroulement */
    function facile(k){return k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;}
    function image(now){
      if(t0===null)t0=now;
      var k=Math.min(1,Math.max(0,(now-t0-retard)/duree));
      var kf=Math.min(1,Math.max(0,(now-t0-retard-DELAI_CADRE)/duree));
      appliquerProgres(depart+(vers-depart)*facile(k),depart+(vers-depart)*facile(kf));
      if(kf<1||now-t0<retard)animId=requestAnimationFrame(image);else finirProgres(vers);
    }
    appliquerProgres(depart);
    animId=requestAnimationFrame(image);
  }
  function basculer(){
    var o=!ouverte();
    if(o)noterDernier('valise');
    try{localStorage.setItem(CLE,o?'1':'0');}catch(_e){}
    sections().forEach(function(s){
      if(o)s.classList.add('vl-ouverte');   /* fermée : la classe ne part qu'à la fin de l'enroulement (finirProgres) */
      var cr=s.querySelector('.vl-creature');if(cr)cr.setAttribute('aria-expanded',o?'true':'false');
    });
    if(o){var ancien=phraseIdx();poserPhrase((Math.max(0,ancien)+1+Math.floor(Math.random()*(PHRASES.length-1)))%PHRASES.length);}
    if(o&&dort)reveiller(false);
    anime(o?1:0);
    synchroniserCoffre();
    son(o?'valiseOuvre':'valiseFerme');
    return o;
  }
  function enVue(el){
    var r=el.getBoundingClientRect();
    return r.bottom>0&&r.top<(window.innerHeight||0)&&r.width>0;
  }
  /* Tout ne compte QUE le temps où la valise est vue (onglet visible, valise à l'écran), comme le Coffre. */
  var PAS=250;
  /* Les roulettes de la valise sur la même ligne que les pattes du Coffre (Norman, 2026-10-23) : la valise garde sa taille (plus petite), on mesure les deux dessins et on décale la valise de la différence. PC seulement (en colonne, sur téléphone, rien à aligner). */
  /* Norman (2026-10-23) : la valise est à la MÊME distance du texte que le Coffre (18 px entre le dessin et le bloc de texte, centré). Sur grand écran (1920) la colonne de la valise la laissait très loin : on la rapproche (marge négative, sa largeur ne change pas) jusqu'au bord droit de la zone du Coffre. */
  function rapprocher(s,coffre,rv){
    var z=coffre.querySelector('[data-idle-coffre-drop-v180]');if(!z)return;
    var rz=z.getBoundingClientRect();
    var m=s.__vlRapproche||0;
    var cible=Math.max(0,Math.min(200,rv.left+m-rz.right));
    if(Math.abs(cible-m)<1)return;
    s.__vlRapproche=cible;
    s.style.marginLeft=(-cible).toFixed(1)+'px';
  }
  function aligner(){
    var s=sections()[0];if(!s)return;
    var coffre=s.closest('.soreal-idle-coffre-v1');if(!coffre)return;
    var cs=null;try{cs=getComputedStyle(coffre);}catch(_e){}
    if(!cs||cs.display!=='grid'){if(s.__vlRapproche){s.__vlRapproche=0;s.style.marginLeft='';}return;}
    var cb=coffre.querySelector('.bg-bagage-v1 svg'),vb=s.querySelector('.vl-bete svg');
    if(!cb||!vb)return;
    var rc=cb.getBoundingClientRect(),rv=vb.getBoundingClientRect();
    if(!(rc.height>0&&rv.height>0))return;
    rapprocher(s,coffre,rv);
    /* bas des roulettes : 247 / 260 du dessin du Coffre, 216 / 232 de celui de la valise */
    var delta=(rc.top+rc.height*247/260)-(rv.top+rv.height*216/232);
    if(Math.abs(delta)<1.5)return;
    var courant=s.__vlDecal==null?19:s.__vlDecal;
    s.__vlDecal=Math.max(0,Math.min(120,courant+delta));
    s.style.setProperty('--vl-decal',s.__vlDecal.toFixed(1)+'px');
  }
  function pas(){
    try{
      var l=sections();
      if(!l.length)return;
      appliquer();
      aligner();
      var co=coffreOuvert();
      if(co&&!coffreAvant)noterDernier('coffre');
      if(co&&!coffreAvant&&phraseActive())poserPhrase(-1);   /* on ouvre le Coffre : sa phrase revient */
      coffreAvant=co;
      synchroniserCoffre();
      rafraichirContenu();
      if(document.hidden||!l.some(enVue))return;
      if(dort){
        visibleDormi+=PAS;visibleRonfle+=PAS;
        if(visibleRonfle>=cibleRonfle){visibleRonfle=0;cibleRonfle=4500+Math.random()*3000;son('valiseRonfle');}
        if(visibleDormi>=140000)reveiller(true);
        return;
      }
      if(!ouverte()){visibleAvant+=PAS;if(visibleAvant>=cibleSommeil)endormir();}
      visibleBaille+=PAS;
      if(visibleBaille>=cibleBaille&&!ouverte()&&!window.__valiseBailleIdleV1__&&!(parle&&Date.now()<parle.jusqua)&&!reduit()){
        if(bailler()){visibleBaille=0;cibleBaille=180000+Math.random()*300000;}else visibleBaille=Math.max(0,cibleBaille-20000);
      }
      visibleRegard+=PAS;
      if(visibleRegard>=cibleRegard){visibleRegard=0;cibleRegard=150000+Math.random()*250000;dire(REMARQUE);}
    }catch(_e){}
  }
  setInterval(pas,PAS);

  document.addEventListener('click',function(ev){
    var t=ev.target&&ev.target.closest?ev.target:null;
    if(!t)return;
    var u=t.closest('[data-vl-utiliser]');
    if(u){
      ev.preventDefault();ev.stopPropagation();
      var id=u.getAttribute('data-vl-utiliser');
      var art=u.closest('.vl-art');
      if(art){art.classList.add('vl-glou');}
      son('valisePotion');sauter();
      if(typeof window.__actionMetaIdleV130__==='function')window.__actionMetaIdleV130__({action:'usePotion',itemId:id});
      return;
    }
    if(t.closest('.vl-flaque-v1')){ev.preventDefault();ev.stopPropagation();return;}   /* on frotte le vomi : ni ouverture ni fermeture */
    var b=t.closest('[data-vl-bascule]');
    if(!b||!b.closest('.vl-section'))return;
    ev.preventDefault();ev.stopPropagation();
    /* Touchée pendant qu'elle dort : elle sursaute (et ne se ferme ni ne s'ouvre), comme le Coffre. */
    if(dort){reveiller(true);return;}
    basculer();
  },true);
  document.addEventListener('keydown',function(ev){
    if(ev.key!=='Enter'&&ev.key!==' ')return;
    var t=ev.target&&ev.target.closest?ev.target.closest('.vl-creature'):null;
    if(!t)return;
    ev.preventDefault();
    if(dort){reveiller(true);return;}
    basculer();
  });

  (window.__SOREAL_IDLE_MORPH_ATTRIBUTS_GARDES_V1__=window.__SOREAL_IDLE_MORPH_ATTRIBUTS_GARDES_V1__||[]);

  window.__SOREAL_IDLE_VALISE_V1__={baille:bailler,fond:dernier,dire:dire,html:html,phraseBlocHtml:phraseBlocHtml,phraseActive:phraseActive,velours:function(){return ouverte();},basculer:basculer,ouverte:ouverte,potions:POTIONS,effets:EFFETS,reserves:RESERVES,repliques:REPLIQUES,reveils:REVEILS,dort:function(){return dort;},css:CSS};
})();
