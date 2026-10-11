/*
 * SOREAL IDLE — Magie du sang : décor de rituel satanique (Norman, 2026-10-11).
 *
 *  - En-tête : bougies qui vacillent de chaque côté d'un pentacle inversé qui tourne lentement.
 *  - Chaque rituel : une scène dans un cadre. Un tuyau de VERS (corps annelé, tête aux yeux rouges, bouche qui goutte) dont le sang avance au rythme du rituel, et un calice qui se remplit
 *    au fil des niveaux : 200 niveaux (rituels terminés) remplissent un calice. Quand il est plein il sort du cadre par la droite, un calice vide entre par la gauche, et le calice plein rejoint
 *    l'étagère sous la scène. Aucun total n'est écrit (règle n°2) : l'étagère n'affiche que les calices déjà remplis.
 *  - Aucune valeur de jeu n'est inventée : tout est visuel ; la barre du tuyau est celle du moteur (data-idle-blood-bar-v1, animée par soreal-idle-ui.js).
 *  - Boucles sans à-coup (règle n°3) : anneaux du tuyau et vaguelettes glissent d'EXACTEMENT une période, les flammes et le pentacle bouclent à l'identique, mouvement réduit coupé.
 *
 *   window.__SOREAL_IDLE_SANG_DECOR_V1__ = { NIVEAUX_PAR_RECIPIENT, css(), defs(), entete(titre,sousTitre), scene(opts), etagere(pleins), majVases() }
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_SANG_DECOR_V1__)return;

var NIVEAUX_PAR_RECIPIENT=200;
var HAUTEUR_LIQUIDE=66;   /* course verticale du sang dans le bol (unités du dessin) */
var DEPART_LIQUIDE=78;    /* décalage du liquide quand le calice est vide : sous le bol */

/* Le même motif ondulé sert de masque (forme du ver) et de relief (reflet + ombre) : une période = 120 px. */
var COURBE_VER="M-120 22 C-100 8 -80 8 -60 22 S-20 36 0 22 C20 8 40 8 60 22 S100 36 120 22 C140 8 160 8 180 22 S220 36 240 22";
var MASQUE_VER="data:image/svg+xml;utf8,"+encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='120' height='44' viewBox='0 0 120 44'><path d='"+COURBE_VER+"' fill='none' stroke='#000' stroke-width='18'/></svg>");
var RELIEF_VER="data:image/svg+xml;utf8,"+encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='120' height='44' viewBox='0 0 120 44'><path transform='translate(0,-4)' d='"+COURBE_VER+"' fill='none' stroke='#fff' stroke-opacity='.38' stroke-width='3' stroke-linecap='round'/><path transform='translate(0,5.5)' d='"+COURBE_VER+"' fill='none' stroke='#000' stroke-opacity='.42' stroke-width='4' stroke-linecap='round'/></svg>");

/* Pentacle inversé (pointe en bas) dans un double cercle gradué. */
function etoile(cx,cy,r){
  var pts=[],i,a;
  for(i=0;i<5;i++){a=(Math.PI/2)+i*2*Math.PI/5;pts.push([cx+r*Math.cos(a),cy+r*Math.sin(a)]);}
  var ordre=[0,2,4,1,3,0];
  return 'M'+ordre.map(function(k){return pts[k][0].toFixed(1)+' '+pts[k][1].toFixed(1);}).join(' L')+' Z';
}
function graduations(cx,cy,r1,r2,n){
  var d='',i,a;
  for(i=0;i<n;i++){a=i*2*Math.PI/n;d+='M'+(cx+r1*Math.cos(a)).toFixed(1)+' '+(cy+r1*Math.sin(a)).toFixed(1)+' L'+(cx+r2*Math.cos(a)).toFixed(1)+' '+(cy+r2*Math.sin(a)).toFixed(1)+' ';}
  return d;
}
function pentacle(classe){
  return '<svg class="'+classe+'" viewBox="0 0 200 200" aria-hidden="true" focusable="false">'+
    '<circle cx="100" cy="100" r="96" fill="none" stroke="currentColor" stroke-width="2.6"/>'+
    '<circle cx="100" cy="100" r="86" fill="none" stroke="currentColor" stroke-width="1.4"/>'+
    '<path d="'+graduations(100,100,87,95,36)+'" stroke="currentColor" stroke-width="1.6" fill="none"/>'+
    '<path d="'+etoile(100,100,84)+'" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>'+
    '<circle cx="100" cy="100" r="22" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="3 4"/>'+
    '</svg>';
}

function bougie(){
  return '<svg class="bm-bougie" viewBox="0 0 40 90" aria-hidden="true" focusable="false">'+
    '<ellipse cx="20" cy="84" rx="17" ry="5" fill="#1a0a0d" stroke="#000" stroke-width="2"/>'+
    '<path d="M10 40 L10 82 Q20 88 30 82 L30 40 Z" fill="url(#bm-g-cire)" stroke="#000" stroke-width="2.4" stroke-linejoin="round"/>'+
    '<path d="M10 40 Q14 50 17 41 Q20 54 24 41 Q27 48 30 40" fill="#e8dcc4" stroke="#000" stroke-width="2" stroke-linejoin="round"/>'+
    '<path d="M20 40 L20 32" stroke="#000" stroke-width="2.4" stroke-linecap="round"/>'+
    '<g class="bm-flamme"><path d="M20 4 C28 16 30 24 20 33 C10 24 12 16 20 4 Z" fill="#ff7a1a" stroke="#000" stroke-width="2"/>'+
    '<path d="M20 15 C24 22 24 27 20 31 C16 27 16 22 20 15 Z" fill="#ffe27a"/></g>'+
    '</svg>';
}

/* Dessins partagés (une seule fois dans la page) : calice, dégradés, bol de découpe. */
var CORPS_CALICE='M10 10 L90 10 C92 50 72 74 54 79 L54 100 C54 107 68 108 78 115 L86 120 L86 126 L14 126 L14 120 L22 115 C32 108 46 107 46 100 L46 79 C28 74 8 50 10 10 Z';
var CORPS_BOITE='M6 24 V40 A54 13 0 0 0 114 40 V24 A54 13 0 0 0 6 24 Z';
var INT_BOITE='M10 26 A50 11 0 0 1 110 26 V40 A50 11 0 0 1 10 40 Z';
var CORPS_FIOLE='M20 6 H40 V16 C40 20 46 24 48 34 C52 50 52 70 46 84 C42 94 18 94 14 84 C8 70 8 50 12 34 C14 24 20 20 20 16 Z';
var INT_FIOLE='M23 8 H37 V17 C37 22 43 26 45 36 C49 50 49 70 44 82 C40 91 20 91 16 82 C11 70 11 50 15 36 C17 26 23 22 23 17 Z';
var BOL_CALICE='M15 14 L85 14 C87 48 69 70 52 75 L48 75 C31 70 13 48 15 14 Z';
/*
 * Dessins des rituels, un par un (Norman, 2026-10-11 : « on va les faire 1 par 1 »). Le premier rituel a sa propre source : un doigt piqué par une punaise. Les accessoires (bougies, grimoires, crânes, fioles, livre ouvert
 * lumineux, chaînes, runes) s'ajoutent à mesure qu'on descend dans les rituels (rang 0 à 5) : plus on sacrifie, plus la scène est chargée et plus le tuyau est gros.
 */
/* Toutes les scènes ont la même hauteur (Norman, 2026-10-11 : « les rituels côte à côte doivent toujours avoir la même taille ») ; le plus grand calice (rang 5) y tient. */
var HAUTEUR_SCENE=312;
if(typeof document!=='undefined'&&document.addEventListener&&!window.__bmPersoErr){window.__bmPersoErr=1;document.addEventListener('error',function(e){var t=e&&e.target;if(t&&t.classList&&(t.classList.contains('bm-perso')||t.classList.contains('bm-bras-img')))t.remove();},true);}
var SOURCES={tack:'punaise',papercuts:'papier',hickey:'sucon',barbedWire:'fil'};
var CORPS_VERRE='M8 8 H72 L67 92 Q66.5 98 60 98 H20 Q13.5 98 13 92 Z';
var INT_VERRE='M12 10 H68 L64 90 Q63.5 94 59 94 H21 Q16.5 94 16 90 Z';
var DEVANT_VERRE='<path d="M18 18 L21 82" stroke="#fff" stroke-opacity=".42" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="40" cy="9" rx="32" ry="3.2" fill="none" stroke="#dfeaf2" stroke-width="2.2"/><path d="M13.6 34 Q40 38 66.4 34 M13.2 40 Q40 44 66.8 40 M14 78 Q40 82 66 78" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="1.6"/><path d="M13 86 Q40 90 67 86" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="4"/>';
var CORPS_CHOPE='M8 8 H80 L76 90 Q75.5 96 70 96 H18 Q12.5 96 12 90 Z';
var INT_CHOPE='M13 11 H75 L71.5 88 Q71 92 67 92 H21 Q17 92 16.5 88 Z';
var ANSE_CHOPE='M79 24 H90 Q104 24 104 40 V56 Q104 72 90 72 H78';
var DEVANT_CHOPE='<path d="M19 18 L22 82" stroke="#fff" stroke-opacity=".42" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="44" cy="9" rx="36" ry="3.4" fill="none" stroke="#dfeaf2" stroke-width="2.2"/><path d="M12.4 30 Q44 34 75.6 30 M12.2 36 Q44 40 75.8 36 M13 80 Q44 84 75 80" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="1.6"/><path d="M12.6 88 Q44 92 75.4 88" fill="none" stroke="#fff" stroke-opacity=".24" stroke-width="4"/><path d="'+ANSE_CHOPE+'" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="2.4" stroke-linecap="round" transform="translate(0,-2)"/>';
var SYMBOLES3=
  '<clipPath id="bm-clip-chope"><path d="'+INT_CHOPE+'"/></clipPath>'+
  '<symbol id="bm-sym-chope-verre" viewBox="0 0 110 100">'+
    '<path d="'+ANSE_CHOPE+'" fill="none" stroke="#000" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>'+
    '<path d="'+ANSE_CHOPE+'" fill="none" stroke="#a9c3d8" stroke-opacity=".5" stroke-width="6.4" stroke-linecap="round" stroke-linejoin="round"/>'+
    '<path d="'+CORPS_CHOPE+'" fill="#a9c3d8" fill-opacity=".2" stroke="#000" stroke-width="2.8" stroke-linejoin="round"/>'+
    '<path d="'+INT_CHOPE+'" fill="#12050a" opacity=".1"/>'+
  '</symbol>'+
  '<symbol id="bm-sym-chope-devant" viewBox="0 0 110 100">'+DEVANT_CHOPE+'</symbol>'+
  '<symbol id="bm-sym-chope-plein" viewBox="0 0 110 100">'+
    '<path d="'+ANSE_CHOPE+'" fill="none" stroke="#000" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>'+
    '<path d="'+ANSE_CHOPE+'" fill="none" stroke="#a9c3d8" stroke-opacity=".5" stroke-width="6.4" stroke-linecap="round" stroke-linejoin="round"/>'+
    '<path d="'+CORPS_CHOPE+'" fill="#a9c3d8" fill-opacity=".2" stroke="#000" stroke-width="2.8" stroke-linejoin="round"/>'+
    '<path d="'+INT_CHOPE+'" fill="url(#bm-g-sang)"/>'+DEVANT_CHOPE+
  '</symbol>'+
  /* dégradés du buste et de la ventouse */
  '<linearGradient id="bm-g-cou" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c98068"/><stop offset=".35" stop-color="#e9b196"/><stop offset=".7" stop-color="#f8d3ba"/><stop offset="1" stop-color="#e5a78c"/></linearGradient>'+
  '<linearGradient id="bm-g-robe" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#14121b"/><stop offset=".5" stop-color="#2d2c3b"/><stop offset="1" stop-color="#17151f"/></linearGradient>'+
  '<linearGradient id="bm-g-cheveux" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a0f09"/><stop offset="1" stop-color="#3f2616"/></linearGradient>'+
  '<radialGradient id="bm-g-levre" cx=".4" cy=".3" r=".9"><stop offset="0" stop-color="#ffa3b8"/><stop offset=".5" stop-color="#dc5472"/><stop offset="1" stop-color="#8f1f3c"/></radialGradient>'+
  '<radialGradient id="bm-g-dome" cx=".35" cy=".35" r=".85"><stop offset="0" stop-color="#e86e8a"/><stop offset=".55" stop-color="#b0314f"/><stop offset="1" stop-color="#5e0f24"/></radialGradient>'+
  /* cou : personnage vu de DOS, tête hors cadre ; nuque, cheveux, oreille droite qui dépasse, chaîne et fermoir, robe noire au col doublé de rouge */
  '<symbol id="bm-sym-cou" viewBox="0 0 200 624">'+
    '<path d="M126 4 Q160 -2 164 30 Q164 60 142 68 L126 54 Z" fill="url(#bm-g-cou)" stroke="#3b1710" stroke-width="3.4" stroke-linejoin="round"/>'+
    '<path d="M138 14 Q154 20 150 38 Q148 50 140 54" fill="none" stroke="#a85a42" stroke-opacity=".7" stroke-width="3.6" stroke-linecap="round"/>'+
    '<path d="M22 60 H124 V250 Q126 294 156 326 L-16 372 L-16 300 Q20 280 22 230 Z" fill="url(#bm-g-cou)"/>'+
    '<path d="M22 100 Q26 200 40 280 L58 292 Q44 200 40 100 Z" fill="#c27a5e" fill-opacity=".7"/>'+
    '<path d="M106 100 Q112 200 108 290 L124 290 V100 Z" fill="#c27a5e" fill-opacity=".8"/>'+
    '<path d="M73 130 V300" fill="none" stroke="#7a3d2c" stroke-opacity=".4" stroke-width="3.6" stroke-linecap="round"/>'+
    '<path d="M50 150 Q56 220 48 286 M96 150 Q90 220 98 286" fill="none" stroke="#7a3d2c" stroke-opacity=".3" stroke-width="3.4" stroke-linecap="round"/>'+
    '<path d="M60 160 Q64 230 62 280" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="3.4" stroke-linecap="round"/>'+
    '<path d="M22 230 Q20 280 -16 300 M124 60 V250 Q126 294 156 326" fill="none" stroke="#3b1710" stroke-width="3.4" stroke-linejoin="round" stroke-linecap="round"/>'+
    '<path d="M22 236 Q73 268 126 250" fill="none" stroke="#3b1710" stroke-width="6.4" stroke-linecap="round"/>'+
    '<path d="M22 236 Q73 268 126 250" fill="none" stroke="#e6b64e" stroke-width="3.4" stroke-dasharray="8 4" stroke-linecap="round"/>'+
    '<circle cx="73" cy="259" r="9" fill="#e0b04a" stroke="#3b1710" stroke-width="3"/>'+
    '<path d="M69 255 Q72 252 77 254" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2.4" stroke-linecap="round"/>'+
    '<path d="M44 170 q-8 12 0 20 q8 -8 0 -20 Z M98 208 q-6 10 0 16 q6 -6 0 -16 Z" fill="#d6eeff" stroke="#6aa0c8" stroke-width="2.4"/>'+
    '<path d="M-16 0 H134 V40 Q134 90 114 122 Q94 100 73 138 Q52 100 32 122 Q12 96 -16 84 Z" fill="url(#bm-g-cheveux)" stroke="#3b1710" stroke-width="3.4" stroke-linejoin="round"/>'+
    '<path d="M10 10 Q30 50 20 94 M48 6 Q62 50 52 104 M86 6 Q96 50 90 106 M118 8 Q124 50 112 108" fill="none" stroke="#8a5a36" stroke-width="5" stroke-linecap="round"/>'+
    '<path d="M0 24 Q24 32 40 24 M64 26 Q88 36 112 28" fill="none" stroke="#9a6c46" stroke-opacity=".7" stroke-width="2.6" stroke-linecap="round"/>'+
    '<path d="M-16 372 Q30 330 73 338 Q120 330 160 340 Q206 352 222 396 V640 H-16 Z" fill="url(#bm-g-robe)" stroke="#3b1710" stroke-width="3.4" stroke-linejoin="round"/>'+
    '<path d="M24 340 Q73 380 124 338 L128 356 Q73 404 22 358 Z" fill="#6b1020" stroke="#3b1710" stroke-width="3.4" stroke-linejoin="round"/>'+
    '<path d="M73 396 V636" fill="none" stroke="#3b1710" stroke-opacity=".5" stroke-width="3.4" stroke-linecap="round"/>'+
    '<path d="M16 432 Q62 484 28 592 M130 424 Q166 504 146 610" fill="none" stroke="#3b1710" stroke-opacity=".4" stroke-width="3.4" stroke-linecap="round"/>'+
    '<path d="M100 452 Q116 522 100 604" fill="none" stroke="#fff" stroke-opacity=".12" stroke-width="8" stroke-linecap="round"/>'+
  '</symbol>'+
  /* ventouse en caoutchouc, de profil : le bord (collerette) est plaqué sur le cou, la peau est aspirée dans la cloche, l'embout se raccorde au tuyau */
  '<radialGradient id="bm-g-gomme" cx=".32" cy=".3" r=".95"><stop offset="0" stop-color="#f0566c"/><stop offset=".5" stop-color="#b8243c"/><stop offset="1" stop-color="#5a0d1c"/></radialGradient>'+
  '<linearGradient id="bm-g-collerette" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6a1020"/><stop offset=".55" stop-color="#c83048"/><stop offset="1" stop-color="#8a1a2e"/></linearGradient>'+
  '<linearGradient id="bm-g-sangsue" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b5a26"/><stop offset=".5" stop-color="#2e2c14"/><stop offset="1" stop-color="#101208"/></linearGradient>'+
  '<radialGradient id="bm-g-bouche-sangsue" cx=".4" cy=".4" r=".8"><stop offset="0" stop-color="#e8738a"/><stop offset=".6" stop-color="#b02f4c"/><stop offset="1" stop-color="#5e0f24"/></radialGradient>'+
  '<symbol id="bm-sym-bouche" viewBox="0 0 140 152" overflow="visible">'+
    /* sangsue : ventouse buccale (rose, mâchoire en Y) plaquée sur la peau, tête annelée à bande orange et petits yeux, bague où commence le corps */
    '<path d="M-16 24 H6 M-12 48 H6 M-16 76 H4 M-12 104 H6 M-16 128 H6" stroke="#8f4a36" stroke-opacity=".6" stroke-width="3.4" stroke-linecap="round"/>'+
    '<ellipse cx="8" cy="76" rx="12" ry="50" fill="#8a2a60" fill-opacity=".5"/>'+
    '<path d="M30 20 C88 8 112 42 112 49 L112 103 C112 110 88 144 30 132 Z" fill="url(#bm-g-sangsue)" stroke="#000" stroke-width="6" stroke-linejoin="round"/>'+
    '<path d="M54 22 Q62 76 54 130 M74 18 Q82 76 74 134 M94 28 Q100 76 94 126" fill="none" stroke="#070803" stroke-opacity=".6" stroke-width="3.6" stroke-linecap="round"/>'+
    '<path d="M36 36 C70 24 98 40 108 54" fill="none" stroke="#e8801e" stroke-width="7" stroke-linecap="round"/>'+
    '<path d="M44 30 C72 22 96 33 106 49" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="3.6" stroke-linecap="round"/>'+
    '<rect x="12" y="6" width="28" height="140" rx="13" fill="url(#bm-g-bouche-sangsue)" stroke="#000" stroke-width="5.4"/>'+
    '<path d="M22 18 V134" stroke="#fff" stroke-opacity=".34" stroke-width="3.4" stroke-linecap="round"/>'+
    '<path d="M24 76 H36 M24 76 L33 62 M24 76 L33 90" fill="none" stroke="#3a0612" stroke-width="3" stroke-linecap="round"/>'+
    '<rect x="104" y="45" width="40" height="62" rx="11" fill="url(#bm-g-sangsue)" stroke="#000" stroke-width="5.4"/>'+
    '<path d="M120 49 V103 M132 49 V103" stroke="#070803" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/>'+
    '<path d="M110 53 H140" stroke="#e8801e" stroke-width="4" stroke-linecap="round"/>'+
    '</symbol>';
var SYMBOLES2=
  '<clipPath id="bm-clip-verre"><path d="'+INT_VERRE+'"/></clipPath>'+
  '<symbol id="bm-sym-verre-verre" viewBox="0 0 80 100">'+
    '<path d="'+CORPS_VERRE+'" fill="#a9c3d8" fill-opacity=".2" stroke="#000" stroke-width="2.8" stroke-linejoin="round"/>'+
    '<path d="'+INT_VERRE+'" fill="#12050a" opacity=".1"/>'+
  '</symbol>'+
  '<symbol id="bm-sym-verre-devant" viewBox="0 0 80 100">'+DEVANT_VERRE+'</symbol>'+
  '<symbol id="bm-sym-verre-plein" viewBox="0 0 80 100">'+
    '<path d="'+CORPS_VERRE+'" fill="#a9c3d8" fill-opacity=".2" stroke="#000" stroke-width="2.8" stroke-linejoin="round"/>'+
    '<path d="'+INT_VERRE+'" fill="url(#bm-g-sang)"/>'+DEVANT_VERRE+
  '</symbol>'+
  /* manche relevée : tissu froissé à gauche, puis deux rouleaux (le second doublé de rouge) qui serrent l'avant-bras */
  '<linearGradient id="bm-g-tissu" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#232733"/><stop offset=".45" stop-color="#4a5163"/><stop offset="1" stop-color="#262a37"/></linearGradient>'+
  '<linearGradient id="bm-g-doublure" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5a0b17"/><stop offset=".5" stop-color="#b3182c"/><stop offset="1" stop-color="#4a0912"/></linearGradient>'+
  /* feuille de papier : le tranchant est son bord du bas */
  '<linearGradient id="bm-g-papier" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffefa"/><stop offset=".55" stop-color="#f6f0e0"/><stop offset="1" stop-color="#e3dac2"/></linearGradient>'+
  '<symbol id="bm-sym-papier" viewBox="0 0 68 88">'+
    /* page de derrière, légèrement décalée */
    '<path d="M8 6 Q24 2 40 5 T66 5 L67 82 Q40 86 9 83 Z" fill="#cfc7b0" stroke="#000" stroke-width="2.2" stroke-linejoin="round"/>'+
    /* page de devant : bords gondolés, coin supérieur droit corné */
    '<path d="M3 5 Q19 1 34 4 T50 3.5 L64 17.5 L65 83 Q35 88 3.6 84 Z" fill="url(#bm-g-papier)" stroke="#000" stroke-width="2.6" stroke-linejoin="round"/>'+
    '<path d="M50 3.5 L50.6 16 Q57 17.4 64 17.5 Z" fill="#d6cdb4" stroke="#000" stroke-width="1.8" stroke-linejoin="round"/>'+
    /* ombre de la courbure, sur le bord gauche */
    '<path d="M3 6 Q6 44 3.6 83 L11 83 Q9 44 12 5 Z" fill="#8a7f64" fill-opacity=".16"/>'+
    /* petit sceau rouge (pentacle inversé) */
    '<circle cx="34" cy="26" r="9.4" fill="none" stroke="#a31224" stroke-width="1.5"/>'+
    '<path d="'+etoile(34,26,8)+'" fill="none" stroke="#a31224" stroke-width="1.4" stroke-linejoin="round"/>'+
    /* texte tapé, lignes de longueurs irrégulières */
    '<path d="M9 43 H57 M9 49 H52 M9 55 H58 M9 61 H44 M9 67 H55 M9 73 H38" fill="none" stroke="#5b6275" stroke-opacity=".78" stroke-width="1.7" stroke-linecap="round"/>'+
    '<path d="M9 43 H20 M9 55 H15" fill="none" stroke="#a31224" stroke-opacity=".8" stroke-width="1.7" stroke-linecap="round"/>'+
    /* le tranchant : arête claire sur le bord du bas */
    '<path d="M3.6 84 Q35 88 65 83" fill="none" stroke="#ffffff" stroke-opacity=".9" stroke-width="1.6" stroke-linecap="round"/>'+
  '</symbol>';
var SYMBOLES=
  '<linearGradient id="bm-g-peau" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f8d3ba"/><stop offset="1" stop-color="#d3917a"/></linearGradient>'+
  '<linearGradient id="bm-g-acier" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#46464f"/><stop offset=".5" stop-color="#eceef6"/><stop offset="1" stop-color="#55555f"/></linearGradient>'+
  '<linearGradient id="bm-g-plastique" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff4a62"/><stop offset="1" stop-color="#a50f26"/></linearGradient>'+
  '<symbol id="bm-sym-doigt-haut" viewBox="0 0 210 54">'+
    '<path d="M0 4 H150 C190 4 208 14 208 27 C208 40 190 50 150 50 H0 Z" fill="url(#bm-g-peau)"/>'+
    '<path d="M0 50 H150 C190 50 208 40 208 27" fill="none" stroke="#a35a43" stroke-opacity=".35" stroke-width="5"/>'+
    '<path d="M0 4 H150 C190 4 208 14 208 27 C208 40 190 50 150 50 H0" fill="none" stroke="#000" stroke-width="2.8" stroke-linejoin="round" stroke-linecap="round"/>'+
    '<path d="M10 10 H138 C160 10 176 12 188 17" fill="none" stroke="#fff" stroke-opacity=".42" stroke-width="3.4" stroke-linecap="round"/>'+
    '<path d="M44 8 Q49 27 44 46 M53 8 Q58 27 53 46 M98 7 Q103 27 98 47 M107 7 Q112 27 107 47" fill="none" stroke="#8f4a36" stroke-opacity=".5" stroke-width="1.7" stroke-linecap="round"/>'+
    '<path d="M178 14 Q196 27 178 40 M169 16 Q186 27 169 38 M160 19 Q174 27 160 35 M153 22 Q162 27 153 32" fill="none" stroke="#8f4a36" stroke-opacity=".5" stroke-width="1.5" stroke-linecap="round"/>'+
  '</symbol>'+
  '<symbol id="bm-sym-poing" viewBox="0 0 60 62">'+
    '<path d="M0 3 H56 V24 H58 V50 C58 60 50 60 44 60 H0 Z" fill="url(#bm-g-peau)"/>'+
    '<rect x="28" y="24.5" width="30" height="11.5" rx="5.5" fill="#e2a78d" stroke="#000" stroke-width="2"/>'+
    '<rect x="28" y="36" width="30" height="11.5" rx="5.5" fill="#dc9e84" stroke="#000" stroke-width="2"/>'+
    '<rect x="28" y="47.5" width="28" height="11" rx="5.5" fill="#d6967c" stroke="#000" stroke-width="2"/>'+
    '<path d="M0 3 H56" fill="none" stroke="#000" stroke-width="2.6" stroke-linecap="round"/>'+
    '<path d="M10 8 H40" stroke="#fff" stroke-opacity=".35" stroke-width="3" stroke-linecap="round"/>'+
    '<path d="M8 20 Q18 30 12 44" stroke="#7a3d2c" stroke-opacity=".45" stroke-width="1.8" fill="none" stroke-linecap="round"/>'+
  '</symbol>'+
  '<symbol id="bm-sym-doigt-bout" viewBox="0 0 56 40">'+
    '<path d="M0 5 H14 C42 5 54 11 54 21 C54 31 42 37 14 37 H0" fill="url(#bm-g-peau)" stroke="#000" stroke-width="2.6" stroke-linejoin="round"/>'+
    '<path d="M8 9 H34" stroke="#fff" stroke-opacity=".38" stroke-width="3" stroke-linecap="round"/>'+
    '<path d="M30 13 Q40 21 30 29 M38 15 Q46 21 38 27" stroke="#7a3d2c" stroke-opacity=".4" stroke-width="1.4" fill="none" stroke-linecap="round"/>'+
  '</symbol>'+
  '<symbol id="bm-sym-doigt" viewBox="0 0 110 40">'+
    '<path d="M0 5 H70 C92 5 106 11 106 21 C106 31 92 37 70 37 H0 Z" fill="url(#bm-g-peau)" stroke="#000" stroke-width="2.6" stroke-linejoin="round"/>'+
    '<path d="M12 9 H64" stroke="#fff" stroke-opacity=".38" stroke-width="3" stroke-linecap="round"/>'+
    '<path d="M28 7 Q31 21 28 35 M48 7 Q51 21 48 35" stroke="#7a3d2c" stroke-opacity=".55" stroke-width="1.8" fill="none" stroke-linecap="round"/>'+
    '<path d="M78 13 Q88 21 78 29 M86 15 Q94 21 86 27" stroke="#7a3d2c" stroke-opacity=".4" stroke-width="1.4" fill="none" stroke-linecap="round"/>'+
  '</symbol>'+
  '<symbol id="bm-sym-punaise" viewBox="0 0 30 50">'+
    '<path d="M13.2 24 H16.8 L15 49 Z" fill="url(#bm-g-acier)" stroke="#000" stroke-width="1.6" stroke-linejoin="round"/>'+
    '<rect x="9.5" y="14" width="11" height="10" rx="2" fill="#9c0e21" stroke="#000" stroke-width="2"/>'+
    '<path d="M3 8 C3 4 9 2 15 2 C21 2 27 4 27 8 L25 15 C22 17 8 17 5 15 Z" fill="url(#bm-g-plastique)" stroke="#000" stroke-width="2.4" stroke-linejoin="round"/>'+
    '<ellipse cx="15" cy="7" rx="9" ry="3" fill="#ff7184" opacity=".7"/>'+
    '<path d="M8 6 Q11 4 16 4" stroke="#fff" stroke-opacity=".65" stroke-width="1.6" fill="none" stroke-linecap="round"/>'+
  '</symbol>';

function use(sym,l,h,classe){return '<svg class="'+classe+'" viewBox="0 0 '+l+' '+h+'" aria-hidden="true" focusable="false"><use href="#'+sym+'" width="'+l+'" height="'+h+'"/></svg>';}

/* Ce qui donne vie au bout du tuyau : le premier rituel a un doigt qu'une punaise pique (elle s'enfonce quand de la Magic est placée) ; les autres rituels auront chacun leur dessin. */
/* Planche de bois un peu penchée, la même pour la sangsue et pour le bol de fil barbelé ; « ombres » = ombres portées des objets posés dessus. */
function planche(ombres){
  return '<svg class="bm-planche" viewBox="0 0 330 62" preserveAspectRatio="none" aria-hidden="true" focusable="false"><defs><linearGradient id="bm-g-planche" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c58a50"/><stop offset=".2" stop-color="#94603a"/><stop offset=".55" stop-color="#6a4023"/><stop offset="1" stop-color="#3b2212"/></linearGradient><linearGradient id="bm-g-planche-bout" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".5"/><stop offset=".12" stop-color="#000" stop-opacity="0"/><stop offset=".88" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></linearGradient><clipPath id="bm-clip-planche"><rect x="1" y="1" width="328" height="70" rx="4"/></clipPath><filter id="bm-f-flou" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="2.4"/></filter></defs><rect x="1" y="1" width="328" height="70" rx="4" fill="url(#bm-g-planche)" stroke="#000" stroke-width="2.4"/><rect x="1" y="1" width="328" height="70" rx="4" fill="url(#bm-g-planche-bout)"/><path d="M6 5 H324" stroke="#e8b987" stroke-opacity=".7" stroke-width="2.2" stroke-linecap="round"/><path d="M0 24 Q80 21 160 24 T330 23 M0 44 Q90 47 170 44 T330 45" fill="none" stroke="#2e1a0e" stroke-opacity=".5" stroke-width="1.6"/>'+'<g clip-path="url(#bm-clip-planche)">'+ombres+'</g>'+'<circle cx="14" cy="14" r="3" fill="#2a2a2e" stroke="#000" stroke-width="1"/><circle cx="316" cy="14" r="3" fill="#2a2a2e" stroke="#000" stroke-width="1"/></svg>';
}
/*
 * BIBLIOTHÈQUE DU FOND (Norman, 2026-10-11) : une même bibliothèque derrière toutes les scènes. Plus on avance dans les rituels (rang), plus elle se remplit : les livres s'ajoutent sans jamais disparaître (chaque emplacement
 * a un tirage fixe, le seuil monte avec le rang), puis viennent les objets de sorcellerie (bougies, crânes, corbeau, pendentif pentacle, fiole, grimoire ouvert, boule de cristal, herbes). Le dessin est le même d'un rituel
 * à l'autre ; seule la PERSPECTIVE change avec la distance de la table (voir le CSS) : table très proche = fond lointain (plus petit, flou, sombre) ; table lointaine = fond plus proche (plus grand, net).
 */
var PALETTE_LIVRES=['#6b1d2a','#4a2a5e','#1f4a3a','#7a4a1e','#2c3a5e','#5e1a1a','#3d2b1f','#6a5a1e'];
var BIB_PLANCHES=[62,122,182,242];
function biblioAlea(i,j){var x=Math.sin(i*127.1+j*311.7+17.3)*43758.5453;return x-Math.floor(x);}
function biblioLivre(x,y,w,h,col,incline){
  var o='<g'+(incline?' transform="rotate('+incline+' '+(x+w)+' '+y+')"':'')+'><rect x="'+x+'" y="'+(y-h)+'" width="'+w+'" height="'+h+'" rx="1.2" fill="'+col+'" stroke="#000" stroke-width="1.2"/>'+
    '<rect x="'+x+'" y="'+(y-h+Math.round(h*.16))+'" width="'+w+'" height="2.4" fill="#d9b45a" fill-opacity=".85"/>'+
    '<rect x="'+x+'" y="'+(y-Math.round(h*.2))+'" width="'+w+'" height="2" fill="#d9b45a" fill-opacity=".6"/>'+
    '<path d="M'+(x+1.8)+' '+(y-h+2)+' V'+(y-2)+'" stroke="#fff" stroke-opacity=".18" stroke-width="1.2"/></g>';
  return o;
}
function biblioBougie(x,y,h,delai){
  return '<g><circle cx="'+x+'" cy="'+(y-h-6)+'" r="15" fill="url(#bm-g-lueur-bib)"/>'+
    '<rect x="'+(x-3.5)+'" y="'+(y-h)+'" width="7" height="'+h+'" rx="1" fill="#efe4c8" stroke="#000" stroke-width="1.1"/>'+
    '<path d="M'+(x-3.5)+' '+(y-h+3)+' q1.2 4 2.4 0 q1.4 6 2.6 1 q1 5 2 -1" fill="#fffaf0" opacity=".8"/>'+
    '<path d="M'+x+' '+(y-h)+' v-3" stroke="#000" stroke-width="1"/>'+
    '<path class="bm-flamme-b" style="animation-delay:'+delai+'s" d="M'+x+' '+(y-h-13)+' C'+(x+4)+' '+(y-h-8)+' '+(x+3.4)+' '+(y-h-3)+' '+x+' '+(y-h-3)+' C'+(x-3.4)+' '+(y-h-3)+' '+(x-4)+' '+(y-h-8)+' '+x+' '+(y-h-13)+' Z" fill="#ffb347" stroke="#c4601a" stroke-width=".8"/></g>';
}
function biblioCrane(x,y,sc){
  return '<g transform="translate('+(x-10*sc)+' '+(y-21*sc)+') scale('+sc+')">'+
    '<path d="M10 1 C4 1 1 5 1 10 C1 13 3 15 4 16 V20 H16 V16 C17 15 19 13 19 10 C19 5 16 1 10 1 Z" fill="#e8dcc0" stroke="#000" stroke-width="1.4" stroke-linejoin="round"/>'+
    '<ellipse cx="6.5" cy="10" rx="2.5" ry="2.9" fill="#1a0808"/><ellipse cx="13.5" cy="10" rx="2.5" ry="2.9" fill="#1a0808"/>'+
    '<path d="M10 12.5 l-1.4 3 h2.8 Z" fill="#1a0808"/><path d="M6.5 17 V20 M10 17 V20 M13.5 17 V20" stroke="#000" stroke-width="1"/>'+
    '<path d="M4 4 Q6 2.4 9 2.2" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.4" stroke-linecap="round"/></g>';
}
function biblioCorbeau(x,y){
  return '<g transform="translate('+(x-15)+' '+(y-28)+')">'+
    '<path d="M3 20 Q-3 25 -6 27 Q2 27 8 24 Z" fill="#0c0a12" stroke="#000" stroke-width="1"/>'+
    '<path d="M4 14 C4 5 12 2 18 4 C24 6 26 12 22 18 C20 23 14 26 8 25 C5 24 4 19 4 14 Z" fill="#17131f" stroke="#000" stroke-width="1.3"/>'+
    '<path d="M18 5 C21 2 26 3 27 6 L33 8 L27 9.5 C26 12 22 12 20 10 Z" fill="#1d1827" stroke="#000" stroke-width="1.2"/>'+
    '<path d="M27 6 L33 8 L27 9.5 Z" fill="#3a3340" stroke="#000" stroke-width=".8"/>'+
    '<circle cx="22.4" cy="6.8" r="1.5" fill="#ffd34a"/><circle cx="22.7" cy="6.8" r=".7" fill="#000"/>'+
    '<path d="M8 12 Q14 16 17 22" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="1.4" stroke-linecap="round"/>'+
    '<path d="M10 25 V28 M15 25.5 V28" stroke="#c9a14a" stroke-width="1.4"/></g>';
}
function biblioPendentif(x,y0,long){
  var yb=y0+long;
  return '<g><path d="M'+x+' '+y0+' Q'+(x-3)+' '+(y0+long*.5)+' '+x+' '+yb+'" fill="none" stroke="#c9a14a" stroke-width="1.3" stroke-dasharray="2.4 1.4"/>'+
    '<circle cx="'+x+'" cy="'+(yb+9)+'" r="9" fill="#2a1a0c" stroke="#000" stroke-width="1.3"/><circle cx="'+x+'" cy="'+(yb+9)+'" r="7.6" fill="none" stroke="#d9b45a" stroke-width="1.4"/>'+
    '<path d="M'+x+' '+(yb+2.4)+' L'+(x+4.4)+' '+(yb+14.6)+' L'+(x-5.8)+' '+(yb+7)+' L'+(x+5.8)+' '+(yb+7)+' L'+(x-4.4)+' '+(yb+14.6)+' Z" fill="none" stroke="#ff5a6e" stroke-width="1.2" stroke-linejoin="round"/>'+
    '<circle cx="'+x+'" cy="'+(yb+9)+'" r="1.6" fill="#ff2a44"/></g>';
}
function biblioFiole(x,y){
  return '<g><path d="M'+(x-5)+' '+(y-20)+' h10 v5 q5 3 5 9 v7 q0 2 -2 2 h-16 q-2 0 -2 -2 v-7 q0 -6 5 -9 Z" fill="#a9c3d8" fill-opacity=".25" stroke="#000" stroke-width="1.2"/>'+
    '<path d="M'+(x-7)+' '+(y-8)+' h14 v6 q0 2 -2 2 h-10 q-2 0 -2 -2 Z" fill="#b01230"/><rect x="'+(x-3.4)+'" y="'+(y-24)+'" width="6.8" height="4.5" rx="1" fill="#8a5a34" stroke="#000" stroke-width="1"/>'+
    '<path d="M'+(x-5)+' '+(y-12)+' v4" stroke="#fff" stroke-opacity=".4" stroke-width="1.2"/></g>';
}
function biblioGrimoire(x,y){
  return '<g><ellipse cx="'+x+'" cy="'+(y-8)+'" rx="22" ry="12" fill="url(#bm-g-lueur-bib)"/>'+
    '<path d="M'+(x-18)+' '+y+' L'+x+' '+(y-3)+' L'+(x+18)+' '+y+' V'+(y-4)+' L'+x+' '+(y-8)+' L'+(x-18)+' '+(y-4)+' Z" fill="#3a1a14" stroke="#000" stroke-width="1.2"/>'+
    '<path d="M'+(x-16)+' '+(y-4)+' L'+x+' '+(y-8)+' V'+(y-14)+' L'+(x-17)+' '+(y-10)+' Z" fill="#e8dcc0" stroke="#000" stroke-width="1.1"/>'+
    '<path d="M'+(x+16)+' '+(y-4)+' L'+x+' '+(y-8)+' V'+(y-14)+' L'+(x+17)+' '+(y-10)+' Z" fill="#d9ccaa" stroke="#000" stroke-width="1.1"/>'+
    '<path d="M'+(x-12)+' '+(y-9)+' l8 -2 M'+(x-12)+' '+(y-6.6)+' l8 -2 M'+(x+4)+' '+(y-11)+' l8 2 M'+(x+4)+' '+(y-8.6)+' l8 2" stroke="#7a1a2a" stroke-width="1"/></g>';
}
function biblioCristal(x,y){
  return '<g><path d="M'+(x-9)+' '+y+' h18 l-3 -5 h-12 Z" fill="#3a2214" stroke="#000" stroke-width="1.2"/>'+
    '<circle cx="'+x+'" cy="'+(y-15)+'" r="11" fill="url(#bm-g-cristal)" stroke="#000" stroke-width="1.3"/>'+
    '<path d="M'+(x-6)+' '+(y-19)+' q2 -4 6 -4.4" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.6" stroke-linecap="round"/></g>';
}
function biblioHerbes(x,y0){
  return '<g><path d="M'+x+' '+y0+' V'+(y0+6)+'" stroke="#6a4a2a" stroke-width="1.4"/>'+
    '<path d="M'+(x-5)+' '+(y0+6)+' q-2 10 1 22 M'+(x-1.5)+' '+(y0+6)+' q0 12 0 26 M'+(x+2.5)+' '+(y0+6)+' q2 10 -1 20 M'+(x+5.5)+' '+(y0+6)+' q3 8 1 17" fill="none" stroke="#4f7a3a" stroke-width="2.2" stroke-linecap="round"/>'+
    '<path d="M'+(x-6)+' '+(y0+6)+' h12" stroke="#a8754a" stroke-width="2"/></g>';
}
/* objets : [rang minimal, emplacement] — l'emplacement réserve de la place aux livres (ils ne passent jamais devant les objets) */
var BIB_OBJETS=[
  {r:0,k:'bougie',x:262,rang:1,h:22,d:0},
  {r:1,k:'crane',x:205,rang:0,s:1.15},
  {r:2,k:'bougie',x:236,rang:2,h:17,d:-.5},
  {r:3,k:'corbeau',x:262,rang:0},
  {r:4,k:'pendentif',x:172,y0:7,long:30},
  {r:4,k:'fiole',x:212,rang:1},
  {r:5,k:'grimoire',x:176,rang:2},
  {r:5,k:'crane',x:142,rang:1,s:1},
  {r:6,k:'cristal',x:140,rang:0},
  {r:6,k:'herbes',x:238,y0:7},
  {r:6,k:'bougie',x:232,rang:0,h:15,d:-.9}
];
function bibliotheque(rang){
  var r=Math.max(0,Math.min(7,Math.floor(Number(rang))||0)),i,j,h='';
  var seuil=Math.min(.95,.2+.11*r);
  /* dégradés partagés (lueur de bougie, boule de cristal) */
  h+='<defs><radialGradient id="bm-g-lueur-bib"><stop offset="0" stop-color="#ffb347" stop-opacity=".55"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>'+
     '<radialGradient id="bm-g-cristal" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#cfe9ff"/><stop offset=".5" stop-color="#6a7fc8"/><stop offset="1" stop-color="#241a4a"/></radialGradient>'+
     '<linearGradient id="bm-g-fond-bib" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c0c10"/><stop offset="1" stop-color="#0c0508"/></linearGradient></defs>';
  h+='<rect x="0" y="0" width="291" height="312" fill="url(#bm-g-fond-bib)"/>';
  var objets=BIB_OBJETS.filter(function(o){return o.r<=r;});
  /* réserve : x ± largeur de l'objet, sur sa rangée (les suspendus ne réservent rien) */
  function reserve(row,x0,x1){
    for(var q=0;q<objets.length;q++){var o=objets[q];if(o.rang===row&&x1>o.x-16&&x0<o.x+16)return true;}
    return false;
  }
  for(j=0;j<BIB_PLANCHES.length;j++){
    var yb=BIB_PLANCHES[j],x=8,slot=0;
    while(x<283){
      var w=8+Math.floor(biblioAlea(slot,j)*7),hh=30+Math.floor(biblioAlea(slot,j+9)*22);
      if(x+w>283)break;
      if(biblioAlea(slot,j+3)<seuil&&!reserve(j,x,x+w)){
        var col=PALETTE_LIVRES[Math.floor(biblioAlea(slot,j+5)*PALETTE_LIVRES.length)];
        var pen=(biblioAlea(slot,j+7)<.18&&!reserve(j,x+w,x+w+10))?-13:0;
        h+=biblioLivre(x,yb,w,hh,col,pen);
        if(pen)x+=6;
      }
      x+=w+1;slot++;
    }
  }
  /* planches par-dessus les livres (leur pied) */
  for(j=0;j<BIB_PLANCHES.length;j++)h+='<rect x="0" y="'+BIB_PLANCHES[j]+'" width="291" height="7" fill="#3a2214" stroke="#000" stroke-width="1.4"/><path d="M2 '+(BIB_PLANCHES[j]+1.6)+' H289" stroke="#8a5a34" stroke-opacity=".6" stroke-width="1.2"/>';
  h+='<rect x="0" y="0" width="7" height="312" fill="#2a180d" stroke="#000" stroke-width="1.2"/><rect x="284" y="0" width="7" height="312" fill="#2a180d" stroke="#000" stroke-width="1.2"/>';
  for(i=0;i<objets.length;i++){
    var o=objets[i],yy=BIB_PLANCHES[o.rang||0];
    if(o.k==='bougie')h+=biblioBougie(o.x,yy,o.h,o.d);
    else if(o.k==='crane')h+=biblioCrane(o.x,yy,o.s);
    else if(o.k==='corbeau')h+=biblioCorbeau(o.x,yy);
    else if(o.k==='pendentif')h+=biblioPendentif(o.x,o.y0,o.long);
    else if(o.k==='fiole')h+=biblioFiole(o.x,yy);
    else if(o.k==='grimoire')h+=biblioGrimoire(o.x,yy);
    else if(o.k==='cristal')h+=biblioCristal(o.x,yy);
    else if(o.k==='herbes')h+=biblioHerbes(o.x,o.y0);
  }
  return '<svg class="bm-biblio" viewBox="0 0 291 312" preserveAspectRatio="none" aria-hidden="true" focusable="false">'+h+'</svg>';
}
function source(id){
  if(SOURCES[id]==='punaise'){
    return '<svg class="bm-doigt" viewBox="0 0 210 54" preserveAspectRatio="none" aria-hidden="true" focusable="false"><use href="#bm-sym-doigt-haut" width="210" height="54"/></svg>'+
      '<i class="bm-trace bm-trace-trou"></i>'+use('bm-sym-punaise',30,50,'bm-punaise')+'<i class="bm-goutte-doigt"></i>'+planche('<ellipse cx="182" cy="27" rx="75" ry="6.5" fill="#000" fill-opacity=".62" filter="url(#bm-f-flou)"/>');
  }
  if(SOURCES[id]==='fil'){
    /* quatrième rituel : 30 images de Norman (R2 idle/bloodmagic/rincevent/WEBP/1.webp à 30.webp), dessinées dans un canevas ; l'image affichée suit l'avancement du niveau (bol qui se vide) */
    return '<canvas class="bm-fil" width="629" height="943" aria-hidden="true"></canvas><i class="bm-levre-sang"></i><i class="bm-filet-fil"></i><i class="bm-saigne-b"></i><i class="bm-saigne-b s2"></i><i class="bm-crachat"><b></b></i><i class="bm-crachat c2"><b></b></i><i class="bm-crachat c3"><b></b></i><i class="bm-crachat c4"><b></b></i><i class="bm-crachat c5"><b></b></i><i class="bm-crachat c6"><b></b></i><i class="bm-crachat c7"><b></b></i><i class="bm-crachat c8"><b></b></i><i class="bm-eclat"></i><i class="bm-eclat c2"></i><i class="bm-eclat c3"></i><i class="bm-eclat c4"></i><i class="bm-eclat c5"></i><i class="bm-eclat c6"></i><i class="bm-eclat c7"></i><i class="bm-eclat c8"></i>'+planche('<ellipse cx="254" cy="30" rx="50" ry="6" fill="#000" fill-opacity=".62" filter="url(#bm-f-flou)"/>')+'';
  }
  if(SOURCES[id]==='sucon'){
    /* personnage dessiné par Norman, déposé dans R2 (idle/bloodmagic/BloodMagicSucon.webp) ; tant qu'il n'est pas chargé (ou absent), le dessin SVG de secours reste affiché */
    /* planche de bois un peu penchée, dans le bas : le verre et le porte-sangsue (un seul pied à socle, posé sur la planche, avec un rail sur lequel elle repose) sont posés dessus ; la sangsue ne flotte plus dans le vide */
    return use('bm-sym-cou',100,312,'bm-cou')+''+planche('<ellipse cx="238" cy="43" rx="100" ry="9" fill="#000" fill-opacity=".62" filter="url(#bm-f-flou)"/><ellipse cx="140" cy="26" rx="39" ry="6.5" fill="#000" fill-opacity=".6" filter="url(#bm-f-flou)"/>')+'<svg class="bm-porte" viewBox="0 0 54 160" aria-hidden="true" focusable="false"><defs><linearGradient id="bm-g-tige" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4a5365"/><stop offset=".32" stop-color="#e3e9f3"/><stop offset=".62" stop-color="#8b95a8"/><stop offset="1" stop-color="#363d4b"/></linearGradient><linearGradient id="bm-g-rail" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef2f8"/><stop offset=".4" stop-color="#9aa4b6"/><stop offset="1" stop-color="#414958"/></linearGradient><radialGradient id="bm-g-socle" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="#d4dbe8"/><stop offset=".55" stop-color="#7d889c"/><stop offset="1" stop-color="#3b4352"/></radialGradient></defs><ellipse cx="27" cy="152" rx="24" ry="7.5" fill="#262c38" stroke="#000" stroke-width="1.4"/><ellipse cx="27" cy="148.5" rx="24" ry="7.5" fill="url(#bm-g-socle)" stroke="#000" stroke-width="1.4"/><ellipse cx="27" cy="147" rx="12" ry="3.6" fill="#59627a" stroke="#000" stroke-width="1"/><rect x="23" y="10" width="8" height="138" fill="url(#bm-g-tige)" stroke="#000" stroke-width="1.4"/><rect x="20.5" y="62" width="13" height="7" rx="2" fill="url(#bm-g-rail)" stroke="#000" stroke-width="1.2"/><rect x="20.5" y="120" width="13" height="6" rx="2" fill="url(#bm-g-rail)" stroke="#000" stroke-width="1.2"/><rect x="0.8" y="0.8" width="52.4" height="9" rx="3.2" fill="url(#bm-g-rail)" stroke="#000" stroke-width="1.6"/><path d="M4 3.4 H50" stroke="#fff" stroke-opacity=".75" stroke-width="1.4" stroke-linecap="round"/><rect x="1.8" y="7.4" width="50.4" height="2.4" rx="1" fill="#000" fill-opacity=".35"/><path d="M1 0.8 V-3 M53 0.8 V-3" stroke="#000" stroke-width="0"/></svg>'+'<img class="bm-perso" alt="" aria-hidden="true" decoding="async" src="/api/idle/media/bloodmagic?name=BloodMagicSucon.webp"><i class="bm-perso-bas"></i>'+
      '<svg class="bm-coude" viewBox="0 0 34 40" aria-hidden="true" focusable="false"><path d="M0 0 H10 C24 0 34 7 34 20 V32 H14 V27 C14 23 10 20 6 20 H0 Z" fill="url(#bm-g-sangsue)" stroke="#000" stroke-width="1.3" stroke-linejoin="round"/><path d="M0 4 H10 C21 4 30 9 30 20 V28" fill="none" stroke="#e8801e" stroke-width="2.4" stroke-linecap="round"/><path d="M6 1 Q8 10 6 19 M16 1 Q20 8 19 14 M27 12 H33 M26 22 H33" fill="none" stroke="#070803" stroke-opacity=".6" stroke-width="1.4" stroke-linecap="round"/><ellipse cx="24" cy="34.5" rx="11" ry="4.6" fill="url(#bm-g-bouche-sangsue)" stroke="#000" stroke-width="1.3"/><ellipse cx="24" cy="35" rx="3.6" ry="1.9" fill="#1a0508"/></svg>'+'<i class="bm-trace bm-trace-sucon"></i>'+use('bm-sym-bouche',70,76,'bm-bouche')+'<svg class="bm-oeil" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><ellipse cx="12" cy="12" rx="9" ry="10" fill="#fffbe8" stroke="#000" stroke-width="2.4"/><g class="pupille"><circle cx="13.5" cy="13" r="5" fill="#000"/><circle cx="15.2" cy="10.8" r="1.7" fill="#fff"/></g><defs><clipPath id="bm-oeil-clip"><ellipse cx="12" cy="12" rx="9" ry="10"/></clipPath></defs><g clip-path="url(#bm-oeil-clip)"><path class="paupiere" d="M-2 -32 L26 -32 L26 11 C18 8 8 9 -2 14 Z" fill="#3d3a1a" stroke="#000" stroke-width="2" stroke-linejoin="round"/></g></svg><i class="bm-larme"></i><i class="bm-larme l2"></i><i class="bm-larme l3"></i><span class="bm-zzz" aria-hidden="true" data-sans-traduction><i>z</i><i>z</i><i>Z</i></span>';
  }
  if(SOURCES[id]==='papier'){
    /* bras dessiné par Norman, déposé dans R2 (idle/bloodmagic/BloodMagiCoupure.webp) : manche, avant-bras, cicatrices et bracelet */
    return '<img class="bm-bras-img" alt="" aria-hidden="true" decoding="async" src="/api/idle/media/bloodmagic?name=BloodMagiCoupure.webp">'+
      '<i class="bm-trace bm-trace-coupures"></i><i class="bm-coupure"></i>'+use('bm-sym-papier',68,88,'bm-papier')+
      '<i class="bm-goutte-doigt bm-gros"></i><i class="bm-goutte-doigt bm-gros g2"></i><i class="bm-goutte-doigt bm-gros g3"></i>'+planche('<ellipse cx="168" cy="35" rx="32" ry="5" fill="#000" fill-opacity=".62" filter="url(#bm-f-flou)"/>');
  }
  return '<svg class="bm-bride" viewBox="0 0 20 60" aria-hidden="true" focusable="false"><rect x="3" y="2" width="14" height="56" rx="4" fill="url(#bm-g-metal)" stroke="#000" stroke-width="2.4"/><circle cx="10" cy="12" r="2" fill="#000" opacity=".6"/><circle cx="10" cy="48" r="2" fill="#000" opacity=".6"/></svg>';
}


function defs(){
  return '<svg class="bm-defs" width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute;width:0;height:0;overflow:hidden">'+
    '<defs>'+
    '<filter id="bm-f-verre" x="-15%" y="-15%" width="130%" height="130%"><feTurbulence type="fractalNoise" baseFrequency=".03 .018" numOctaves="2" seed="4" result="b"/><feDisplacementMap in="SourceGraphic" in2="b" scale="11" xChannelSelector="R" yChannelSelector="G"/></filter>'+
    '<linearGradient id="bm-g-sang" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff4a62"/><stop offset=".45" stop-color="#b3102a"/><stop offset="1" stop-color="#5c0716"/></linearGradient>'+
    '<linearGradient id="bm-g-metal" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#17171e"/><stop offset=".32" stop-color="#8d8d9e"/><stop offset=".62" stop-color="#3a3a46"/><stop offset="1" stop-color="#101016"/></linearGradient>'+
    '<linearGradient id="bm-g-cire" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b9ad93"/><stop offset=".4" stop-color="#f1e8d2"/><stop offset="1" stop-color="#9c9078"/></linearGradient>'+
    '<clipPath id="bm-clip-bol"><path d="'+BOL_CALICE+'"/></clipPath>'+
    '<symbol id="bm-sym-calice" viewBox="0 0 100 130">'+
      '<path d="'+CORPS_CALICE+'" fill="url(#bm-g-metal)" stroke="#000" stroke-width="3" stroke-linejoin="round"/>'+
      '<path d="'+BOL_CALICE+'" fill="#12050a" opacity=".12"/>'+
    '</symbol>'+
    '<symbol id="bm-sym-calice-devant" viewBox="0 0 100 130">'+
      '<path d="M20 18 C22 40 31 56 45 66" stroke="#fff" stroke-opacity=".34" stroke-width="3" fill="none" stroke-linecap="round"/>'+
      '<ellipse cx="50" cy="10" rx="40" ry="3.6" fill="none" stroke="#d9a441" stroke-width="2.4"/>'+
      '<circle cx="50" cy="91" r="4.6" fill="#e11d3a" stroke="#000" stroke-width="2"/>'+
      '<path d="M26 122 L74 122" stroke="#000" stroke-opacity=".5" stroke-width="2"/>'+
    '</symbol>'+
    '<symbol id="bm-sym-calice-plein" viewBox="0 0 100 130">'+
      '<path d="'+CORPS_CALICE+'" fill="url(#bm-g-metal)" stroke="#000" stroke-width="3" stroke-linejoin="round"/>'+
      '<path d="'+BOL_CALICE+'" fill="url(#bm-g-sang)"/>'+
      '<path d="M20 18 C22 40 31 56 45 66" stroke="#fff" stroke-opacity=".34" stroke-width="3" fill="none" stroke-linecap="round"/>'+
      '<ellipse cx="50" cy="10" rx="40" ry="3.6" fill="none" stroke="#d9a441" stroke-width="2.4"/>'+
      '<circle cx="50" cy="91" r="4.6" fill="#e11d3a" stroke="#000" stroke-width="2"/>'+
    '</symbol>'+
    '<clipPath id="bm-clip-boite"><path d="'+INT_BOITE+'"/></clipPath>'+
    '<symbol id="bm-sym-boite-verre" viewBox="0 0 120 64">'+
      '<path d="'+CORPS_BOITE+'" fill="#a9c3d8" fill-opacity=".2" stroke="#000" stroke-width="2.6" stroke-linejoin="round"/>'+
      '<path d="'+INT_BOITE+'" fill="#12050a" opacity=".1"/>'+
    '</symbol>'+
    '<symbol id="bm-sym-boite-devant" viewBox="0 0 120 64">'+
      '<ellipse cx="60" cy="24" rx="54" ry="13" fill="none" stroke="#dfeaf2" stroke-width="2.2"/>'+
      '<path d="M14 31 Q18 40 28 45" stroke="#fff" stroke-opacity=".5" stroke-width="2.4" fill="none" stroke-linecap="round"/>'+
      '<path d="M100 33 Q104 38 108 40" stroke="#fff" stroke-opacity=".35" stroke-width="2" fill="none" stroke-linecap="round"/>'+
      '<path d="M30 37.8 Q60 42.2 90 37.8 V48.8 Q60 53.2 30 48.8 Z" fill="#f4f1e6" stroke="#000" stroke-width="1.5" stroke-linejoin="round"/>'+
    '</symbol>'+
    '<symbol id="bm-sym-boite-plein" viewBox="0 0 120 64">'+
      '<path d="'+CORPS_BOITE+'" fill="#a9c3d8" fill-opacity=".2" stroke="#000" stroke-width="2.6" stroke-linejoin="round"/>'+
      '<path d="'+INT_BOITE+'" fill="url(#bm-g-sang)"/>'+
      '<ellipse cx="60" cy="31" rx="50" ry="11" fill="#b3102a"/>'+
      '<ellipse cx="60" cy="24" rx="54" ry="13" fill="none" stroke="#dfeaf2" stroke-width="2.2"/>'+
      '<path d="M30 37.8 Q60 42.2 90 37.8 V48.8 Q60 53.2 30 48.8 Z" fill="#f4f1e6" stroke="#000" stroke-width="1.5" stroke-linejoin="round"/>'+
    '</symbol>'+
    '<clipPath id="bm-clip-fiole"><path d="'+INT_FIOLE+'"/></clipPath>'+
    '<symbol id="bm-sym-fiole-verre" viewBox="0 0 60 100">'+
      '<path d="'+CORPS_FIOLE+'" fill="#a9c3d8" fill-opacity=".22" stroke="#000" stroke-width="3" stroke-linejoin="round"/>'+
      '<path d="'+INT_FIOLE+'" fill="#12050a" opacity=".9"/>'+
    '</symbol>'+
    '<symbol id="bm-sym-fiole-devant" viewBox="0 0 60 100">'+
      '<path d="M19 42 C16 56 16 70 20 81" stroke="#fff" stroke-opacity=".42" stroke-width="3" fill="none" stroke-linecap="round"/>'+
      '<ellipse cx="30" cy="6" rx="11" ry="2.4" fill="none" stroke="#cfe1f0" stroke-width="2"/>'+
      '<rect x="16" y="54" width="28" height="16" rx="2" fill="#e9dcc0" stroke="#000" stroke-width="1.8"/>'+
      '<path d="M30 56.5 C34.5 61 35.5 64 30 67.5 C24.5 64 25.5 61 30 56.5 Z" fill="#b3102a" stroke="#000" stroke-width="1"/>'+
    '</symbol>'+
    '<symbol id="bm-sym-fiole-plein" viewBox="0 0 60 100">'+
      '<path d="'+CORPS_FIOLE+'" fill="#a9c3d8" fill-opacity=".22" stroke="#000" stroke-width="3" stroke-linejoin="round"/>'+
      '<path d="'+INT_FIOLE+'" fill="url(#bm-g-sang)"/>'+
      '<path d="M19 42 C16 56 16 70 20 81" stroke="#fff" stroke-opacity=".42" stroke-width="3" fill="none" stroke-linecap="round"/>'+
      '<ellipse cx="30" cy="6" rx="11" ry="2.4" fill="none" stroke="#cfe1f0" stroke-width="2"/>'+
    '</symbol>'+
    SYMBOLES+SYMBOLES2+SYMBOLES3+
    '</defs></svg>';
}

/*
 * Les contenants (Norman, 2026-10-11 : « les contenants doivent être de plus en plus grands, différents pour chaque rituel, et le taux nécessaire pour un remplissage va varier de rituel en rituel »).
 * Chaque contenant a son dessin et sa course de liquide (depart = décalage quand il est vide, haut = course jusqu'au plein). CONTENANT_DE dit lequel sert à quel rituel (calice par défaut) ;
 * CAPACITE dit combien de niveaux le remplissent (200 par défaut : Norman donnera les autres au fur et à mesure).
 */
var CONTENANTS={
  calice:{vb:'0 0 100 130',l:100,h:130,corps:'bm-sym-calice',devant:'bm-sym-calice-devant',plein:'bm-sym-calice-plein',clip:'bm-clip-bol',depart:DEPART_LIQUIDE,haut:HAUTEUR_LIQUIDE,nom:'Sang collecté'},
  boite:{vb:'0 0 120 64',l:120,h:64,corps:'bm-sym-boite-verre',devant:'bm-sym-boite-devant',plein:'bm-sym-boite-plein',clip:'bm-clip-boite',depart:64,haut:33,nom:'Sang collecté',sansMini:true,liquide:'<rect x="-10" y="0" width="140" height="80" fill="url(#bm-g-sang)"/><ellipse cx="60" cy="0" rx="50" ry="11" fill="#c4162f"/><path d="M22 -2 Q40 -6 58 -3" stroke="#fff" stroke-opacity=".4" stroke-width="2" fill="none" stroke-linecap="round"/>'},
  chope:{vb:'0 0 110 100',l:110,h:100,fond:92,corps:'bm-sym-chope-verre',devant:'bm-sym-chope-devant',plein:'bm-sym-chope-plein',clip:'bm-clip-chope',depart:97,haut:81,nom:'Sang collecté',sansMini:true,liquide:'<rect x="-10" y="0" width="140" height="120" fill="url(#bm-g-sang)"/><ellipse cx="44" cy="0" rx="32" ry="3.8" fill="#c4162f"/><path d="M22 -1 Q34 -3.4 44 -1.6" stroke="#fff" stroke-opacity=".4" stroke-width="1.6" fill="none" stroke-linecap="round"/>'},
  verre:{vb:'0 0 80 100',l:80,h:100,fond:94,corps:'bm-sym-verre-verre',devant:'bm-sym-verre-devant',plein:'bm-sym-verre-plein',clip:'bm-clip-verre',depart:99,haut:83,nom:'Sang collecté',sansMini:true,liquide:'<rect x="-10" y="0" width="100" height="120" fill="url(#bm-g-sang)"/><ellipse cx="40" cy="0" rx="28" ry="3.6" fill="#c4162f"/><path d="M20 -1 Q30 -3 38 -1.5" stroke="#fff" stroke-opacity=".4" stroke-width="1.6" fill="none" stroke-linecap="round"/>'},
  fiole:{vb:'0 0 60 100',l:60,h:100,corps:'bm-sym-fiole-verre',devant:'bm-sym-fiole-devant',plein:'bm-sym-fiole-plein',clip:'bm-clip-fiole',depart:89,haut:70,nom:'Sang collecté'}
};
var CONTENANT_DE={tack:'boite',papercuts:'verre',hickey:'chope'};
/* Premier rituel : 1000 piqûres remplissent un récipient (Norman, 2026-10-11) ; une piqûre = un niveau. Les autres rituels : 200 par défaut jusqu'à ce que Norman donne leur valeur. */
/* Cinquante coupures de papier : un verre à moutarde, 5000 coupures pour le remplir (Norman, 2026-10-11). */
var CAPACITE={tack:1000,papercuts:5000,hickey:5000};
/* Dès que le récipient est rempli à cette part, le suivant arrive (vide) et se colle à lui, prêt à le pousser. */
var SEUIL_ARRIVEE=0.9;
/* id -> le suivant est déjà à l'écran (un redessin de la page ne le refait pas arriver : il ne surgit jamais, il vient d'en dehors du cadre une seule fois) */
var suivantVu={};
/* id -> la trace de l'impact est visible (le rituel progresse) : restituée telle quelle à chaque redessin, elle ne clignote pas. */
var marqueVue={};
function typeContenant(id){return CONTENANTS[CONTENANT_DE[id]]?CONTENANT_DE[id]:'calice';}
function capacite(id){var c=Number(CAPACITE[id]);return c>0?c:NIVEAUX_PAR_RECIPIENT;}
/* Taille de la scène et du contenant : la fiole du premier rituel est minuscule (posée sur un petit autel), les calices grandissent avec le rang. */
function dimensions(id,rang){
  var r=Math.max(0,Math.min(5,Math.floor(Number(rang))||0));
  if(typeContenant(id)==='chope')return {vw:165,vh:150,vb:14,sh:HAUTEUR_SCENE,autel:false,ox:15};
  if(typeContenant(id)==='verre')return {vw:104,vh:130,vb:14,sh:HAUTEUR_SCENE,autel:false};
  if(typeContenant(id)==='boite')return {vw:250,vh:134,vb:14,sh:HAUTEUR_SCENE,autel:false};
  if(typeContenant(id)==='fiole')return {vw:54,vh:90,vb:60,sh:HAUTEUR_SCENE,autel:true};
  var s=[.8,.9,1,1.15,1.3,1.5][r];
  var vw=Math.round(100*s),vh=Math.round(130*s),th=CORPS_PAR_RANG[r]+26;
  /* quatrième rituel : le calice est posé au fond de la table du premier plan (14 px plus haut) */
  return {vw:vw,vh:vh,vb:6+(SOURCES[id]==='fil'?14:0),sh:HAUTEUR_SCENE,autel:false};
}
/* Un contenant qui se remplit : le sang est un groupe qu'on déplace en hauteur (transform), sa surface ondule d'une période exactement. */
function echapper(t){return String(t==null?'':t).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function nomJoueur(){try{return typeof window.__nomJoueurIdleV1__==='function'?String(window.__nomJoueurIdleV1__()||'Joueur'):'Joueur';}catch(e){return 'Joueur';}}
/*
 * TRANSPARENCE ET DÉFORMATION (Norman, 2026-10-11) : on voit à travers chaque récipient ce qui est DERRIÈRE lui (bibliothèque et planche), légèrement agrandi et déformé comme à travers du verre. Le fond est redessiné
 * à l'intérieur du récipient, aligné sur le vrai décor (position du récipient dans la scène connue par source), découpé par l'intérieur du verre ; le liquide est translucide par-dessus.
 */
var PLANCHE_GEO={sucon:{L:-22,T:252,w:335,h:62,o:[115,2]},fil:{L:-22,T:252,w:335,h:62,o:[115,2]},punaise:{L:-190,T:215,w:640,h:128,o:[230,2]},papier:{L:-190,T:215,w:640,h:128,o:[230,2]}};
var VASE_CENTRE_X={punaise:129,papier:120,fil:222};
var fondCache={};
function fondVerre(type,id,rang){
  var c=CONTENANTS[type]||CONTENANTS.calice,src=SOURCES[id]||'bride';
  var d=dimensions(id,rang),k=Math.min(d.vw/c.l,d.vh/c.h);
  var gauche=VASE_CENTRE_X[src]!=null?VASE_CENTRE_X[src]-d.vw/2:(286-12-d.vw);
  var haut=d.sh-d.vb-d.vh;
  var X0=gauche+(d.vw-c.l*k)/2,Y0=haut+(d.vh-c.h*k)/2;
  var cle=rang+'|'+src,bg=fondCache[cle];
  if(!bg){
    bg=bibliotheque(rang).replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'');
    var g=PLANCHE_GEO[src];
    if(g)bg+='<g transform="translate('+g.L+' '+g.T+') rotate(3 '+g.o[0]+' '+g.o[1]+') scale('+(g.w/330).toFixed(4)+' '+(g.h/62).toFixed(4)+')">'+planche('').replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'')+'</g>';
    fondCache[cle]=bg;
  }
  var cx=c.l/2,cy=c.h/2;
  return '<g clip-path="url(#'+c.clip+')"><g filter="url(#bm-f-verre)"><g transform="translate('+cx+' '+cy+') scale(1.12) translate('+(-cx)+' '+(-cy)+') scale('+(1/k).toFixed(5)+') translate('+(-X0).toFixed(2)+' '+(-Y0).toFixed(2)+')">'+bg+'</g></g></g>';
}
function contenant(type,fraction,ctx){
  var c=CONTENANTS[type]||CONTENANTS.calice;
  var t=c.depart-c.haut*Math.max(0,Math.min(1,fraction));
  return '<svg class="bm-calice" viewBox="'+c.vb+'" aria-hidden="true" focusable="false">'+
    '<use href="#'+c.corps+'" width="'+c.l+'" height="'+c.h+'"/>'+
    (ctx?fondVerre(type,ctx.id,ctx.rang):'')+
    '<g clip-path="url(#'+c.clip+')"><g class="bm-liq" opacity=".9" style="transform:translateY('+t.toFixed(2)+'px)">'+
      (c.liquide||'<g class="bm-onde"><path d="M-40 3 q10 -4 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 V90 H-40 Z" fill="url(#bm-g-sang)"/></g>')+
    '</g></g>'+
    '<use href="#'+c.devant+'" width="'+c.l+'" height="'+c.h+'"/>'+
    (type==='boite'?etiquette(nomJoueur()):'')+
    '</svg>';
}
/* Le nom du joueur, au feutre, sur l'étiquette de la boîte (comme dans The Thing). */
function etiquette(nom){
  var n=String(nom||'Joueur').slice(0,18);
  var l=Math.min(46,n.length*5.6);
  return '<text class="bm-nom" x="60" y="48.4" text-anchor="middle" font-size="8.6" textLength="'+l.toFixed(1)+'" lengthAdjust="spacingAndGlyphs">'+echapper(n)+'</text>';
}
function mini(type){
  var c=CONTENANTS[type]||CONTENANTS.calice;
  return '<svg class="bm-mini bm-mini-'+(CONTENANTS[type]?type:'calice')+'" viewBox="'+c.vb+'" aria-hidden="true" focusable="false"><use href="#'+c.plein+'" width="'+c.l+'" height="'+c.h+'"/></svg>';
}

/*
 * « Sang collecté » (Norman, 2026-10-11) : la quantité de Blood déjà produite par CE rituel = rituels terminés × Blood par rituel (valeur du catalogue). Toujours affiché, mis à jour en direct avec le compteur
 * de rituels (plus de nombre de récipients, qui ne bougeait qu'à chaque récipient plein).
 */
function formatSang(v){var f=window.__SOREAL_IDLE_FORMAT_NOMBRE_V2__;return typeof f==='function'?f(v):String(Math.floor(v));}
function etagere(sangTotal){
  return '<span class="bm-etagere-lib">Sang collecté</span><b class="bm-etagere-n">'+formatSang(Math.max(0,Number(sangTotal)||0))+'</b>';
}

function entete(titre,sousTitre){
  return defs()+
    '<div class="bm-entete">'+
      '<div class="bm-entete-fond">'+pentacle('bm-pentacle-fond')+'</div>'+
      bougie()+
      '<div class="bm-entete-texte"><h2 class="bm-titre">'+titre+'</h2><p class="bm-sous-titre">'+sousTitre+'</p></div>'+
      bougie()+
    '</div>';
}

/*
 * La scène d'un rituel. opts : id (déjà échappé), compte (nombre de rituels terminés), barre (HTML du remplissage du tuyau, vide si le rituel n'a jamais reçu de Magic).
 * Le tuyau garde le parent direct de la barre comme « piste » (la page y pose la classe saigne-v1 et les gouttes quand le rituel progresse).
 */
function scene(opts){
  var compte=Math.max(0,Math.floor(Number(opts.compte)||0));
  if(SOURCES[opts.id]==='fil')compte=filNAffiche(opts.id,compte,null);
  var cap=capacite(opts.id),type=typeContenant(opts.id),dim=dimensions(opts.id,opts.rang);
  var fraction=(compte%cap)/cap;
  var rendu=suivantVu[opts.id];
  var pleins=Math.floor(compte/cap);
  demarrer();
  suivantVu[opts.id]=fraction>=SEUIL_ARRIVEE;
  var marque=!!(marqueVue[opts.id]&&opts.saigne);
  return '<div class="bm-scene'+(marque?' bm-marque':'')+(SOURCES[opts.id]==='sucon'&&!opts.saigne?' bm-dort':'')+((SOURCES[opts.id]==='punaise'||SOURCES[opts.id]==='papier'||SOURCES[opts.id]==='sucon'||SOURCES[opts.id]==='fil')&&(!opts.saigne||etatHors[opts.id]===true)?' bm-hors':((SOURCES[opts.id]==='punaise'||SOURCES[opts.id]==='papier'||SOURCES[opts.id]==='sucon'||SOURCES[opts.id]==='fil')&&(installeA[opts.id]===undefined||performance.now()>=installeA[opts.id])?' bm-installe':''))+'" data-bm-id="'+opts.id+'" data-bm-rang="'+(Number(opts.rang)||0)+'" data-bm-pleins="'+pleins+'" data-bm-cap="'+cap+'" data-bm-sang="'+(Number(opts.sang)||0)+'" data-contenant="'+type+'" data-source="'+(SOURCES[opts.id]||'bride')+'" style="--vw:'+dim.vw+'px;--vh:'+dim.vh+'px;--vb:'+dim.vb+'px;--sh:'+dim.sh+'px;--pas:'+(dim.vw+4)+'px'+(dim.ox?';--cx:'+(dim.vw/2+12+dim.ox)+'px':'')+(function(){var h=chuteSang(SOURCES[opts.id],type,dim.vh,dim.vb,dim.sh,fraction);return h==null?'':';--chute:'+h+'px';})()+'">'+
      bibliotheque(opts.rang)+
      '<div class="bm-sol">'+pentacle('bm-pentacle-sol')+'</div>'+
      '<div class="bm-ver"><div class="bm-tuyau'+(opts.saigne?' saigne-v1':'')+'">'+(opts.barre||'')+(SOURCES[opts.id]==='sucon'?'<div class="bm-paquets-corps" aria-hidden="true"><i class="bm-paquet"></i><i class="bm-paquet"></i><i class="bm-paquet"></i><i class="bm-paquet"></i><i class="bm-paquet"></i><i class="bm-paquet"></i></div>':'')+'</div></div>'+
      source(opts.id)+
      (SOURCES[opts.id]==='sucon'
        ?'<div class="bm-bec bm-bec-flot" aria-hidden="true"><i class="bm-filet"></i></div>'
        :'<div class="bm-bec" aria-hidden="true"><i class="bm-goutte" style="animation-delay:-.2s"></i><i class="bm-goutte" style="animation-delay:-.75s"></i><i class="bm-goutte" style="animation-delay:-1.25s"></i></div>')+
      (dim.autel?'<div class="bm-autel" aria-hidden="true"></div>':'')+
      '<div class="bm-vase">'+contenant(type,fraction,{id:opts.id,rang:opts.rang})+'</div>'+
      (fraction>=SEUIL_ARRIVEE?'<div class="bm-vase bm-suivant'+(rendu?'':' bm-apparait')+'" aria-hidden="true">'+contenant(type,0,{id:opts.id,rang:opts.rang})+'</div>':'')+
    '</div>'+
    '<div class="bm-etagere" data-bm-etagere="'+opts.id+'"'+'>'+etagere(compte*(Number(opts.sang)||0))+'</div>';
}

/* ---------- Vie des calices : lit le compteur de rituels (mis à jour en direct par la page) et fait remplir / sortir / entrer ---------- */
var vus={};   /* id -> nombre de calices pleins déjà montrés (survit aux redessins de la page) */
function lireCompte(id){
  var el=document.getElementById('sorealIdleBloodCountV1_'+id);
  if(!el)return null;
  var n=Number(String(el.textContent||'').replace(/\D/g,''));
  return isFinite(n)?n:null;
}
/*
 * Échange des contenants (Norman, 2026-10-11) : un seul récipient sous le doigt. À l'approche du plein (SEUIL_ARRIVEE), le suivant arrive VIDE par la gauche et se colle au récipient actuel ; quand l'actuel est plein,
 * le suivant le POUSSE : les deux glissent ensemble d'un cran, le suivant se retrouve sous la goutte et le plein finit de sortir du cadre. Aucun délai ajouté.
 */
var DUREE_ECHANGE=800;
/* Le suivant arrive (vide) par la gauche et se colle au récipient actuel. */
function ajouterSuivant(sc,type,anime){
  var reduit=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var n=document.createElement('div');
  n.className='bm-vase bm-suivant'+(anime&&!reduit?' bm-apparait':'');n.setAttribute('aria-hidden','true');n.innerHTML=contenant(type,0,{id:sc.getAttribute('data-bm-id'),rang:Number(sc.getAttribute('data-bm-rang'))||0});
  sc.appendChild(n);
  return n;
}
function echanger(sc,type){
  var a=sc.querySelector('.bm-vase:not(.bm-suivant)'),b=sc.querySelector('.bm-vase.bm-suivant');
  if(!a||!b)return;
  var reduit=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  sc.__swap=true;sc.__vide=true;
  function fin(){
    if(a.parentNode)a.parentNode.removeChild(a);
    b.classList.remove('bm-suivant','bm-avance','bm-apparait');b.removeAttribute('aria-hidden');
    sc.__swap=false;sc.__vide=false;
  }
  if(reduit){fin();return;}
  b.classList.remove('bm-apparait');
  a.classList.add('bm-sort');b.classList.add('bm-avance');
  setTimeout(fin,DUREE_ECHANGE);
}
/*
 * La goutte tombe jusqu'au SANG (Norman, 2026-10-11, coupures de papier) : sa hauteur de chute suit le niveau du liquide dans le verre (verre vide : elle va jusqu'au fond, presque plein : elle tombe de peu).
 * Valeur = ordonnée de la surface du sang dans la scène moins l'ordonnée de départ de la goutte (centre) ; seulement pour les sources listées.
 */
var DEPART_GOUTTE={papier:98,punaise:92,sucon:145,fil:124};
/* Boîte de Petri vue en perspective (premier rituel) : la goutte ne descend pas plus bas que l'ouverture du récipient (centre du bord + marge). Plus bas, elle serait dessinée devant la paroi de verre et semblerait tomber À CÔTÉ du récipient. */
var PLAFOND_GOUTTE={punaise:{rim:24,marge:7}};
function chuteSang(source,type,vh,vb,sh,fraction){
  var d=DEPART_GOUTTE[source];
  if(!d)return null;
  var c=CONTENANTS[type]||CONTENANTS.calice;
  var echelle=(window.matchMedia&&window.matchMedia('(max-width:560px)').matches)?0.88:1;
  var t=c.depart-c.haut*Math.max(0,Math.min(1,fraction));
  /* récipient vide : la surface « virtuelle » est cachée sous le fond ; la goutte s'arrête au fond intérieur, jamais en dessous du récipient */
  if(c.fond!=null)t=Math.min(t,c.fond-2);
  var k=vh/c.h;
  var y=(sh-vb)-(vh-t*k)*echelle;
  var pl=PLAFOND_GOUTTE[source];
  if(pl)y=Math.min(y,(sh-vb)-(vh-(pl.rim+pl.marge)*k)*echelle);
  return Math.max(24,Math.round(y-d));
}
function niveauLiquide(scene,fraction,c){
  var liq=scene.querySelector('.bm-vase:not(.bm-suivant):not(.bm-sort)>.bm-calice .bm-liq');
  if(liq)liq.style.transform='translateY('+(c.depart-c.haut*Math.max(0,Math.min(1,fraction))).toFixed(2)+'px)';
}
/*
 * Rythme des piqûres (Norman, 2026-10-11 : « garde une animation maximale mais trouve le bon compromis, crédible »). Une piqûre = un niveau. Période réelle du rituel = secondes par niveau ;
 * jamais plus rapide que PERIODE_MIN (la goutte et la punaise restent lisibles, le niveau du contenant, lui, suit le vrai rythme) ; au-delà de PERIODE_BOUCLE, la scène ne boucle plus :
 * un coup de punaise et une goutte à chaque niveau réellement gagné.
 */
var PERIODE_MIN=0.4,PERIODE_BOUCLE=4;
/* Part du cycle où l'impact a lieu (la pointe a touché le doigt ; la feuille a fini de traverser le bras) : la trace n'apparaît JAMAIS avant (Norman, 2026-10-11). */
var PART_IMPACT={punaise:0.44,papier:0.5};
function poserMarque(sc,id){
  sc.__marq=0;
  if(sc.querySelector('.bm-tuyau.saigne-v1')){sc.classList.add('bm-marque');marqueVue[id]=true;}
}
var secVue={};
/*
 * Avancement du niveau (Norman, 2026-10-11) : la punaise (ou la feuille) se rapproche tout doucement de l'endroit où elle pique pendant TOUT le niveau, et le mouvement se termine exactement quand le chrono se termine :
 * c'est là que le coup part. Niveaux lents seulement (au-delà de PERIODE_BOUCLE) ; en boucle rapide, la scène pique déjà sans arrêt. Cycle d'un niveau (durée P) : le coup finit de se jouer (0,9 s, l'objet reste au contact),
 * l'objet recule (jusqu'à 1,5 s), puis avance en ligne droite jusqu'à la fin du niveau. L'horloge est calée sur la barre du moteur ; propriété « top » (la punaise et la feuille se déplacent déjà par transform et translate).
 */
var APPROCHE={punaise:{base:14,loin:-26},papier:{base:-36,loin:-70}};
function approche(sc,src,sec,actif,attente){
  var def=APPROCHE[src],el=sc.querySelector(src==='punaise'?'.bm-punaise':'.bm-papier');
  if(!def||!el||typeof el.animate!=='function')return;
  var reduit=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!actif||reduit||!(sec>PERIODE_BOUCLE)){
    if(sc.__ap){try{sc.__ap.cancel();}catch(_e){}sc.__ap=null;sc.__apCle='';}
    return;
  }
  var P=sec,cle=src+'|'+P.toFixed(2),pb=phaseBarre(sc);
  if(!sc.__ap||sc.__apCle!==cle){
    if(sc.__ap){try{sc.__ap.cancel();}catch(_e){}}
    var h=Math.min(.4,0.9/P),r=Math.min(.7,1.5/P);
    sc.__ap=el.animate([
      {top:def.base+'px',offset:0},
      {top:def.base+'px',offset:h,easing:'ease-in-out'},
      {top:def.loin+'px',offset:r,easing:'linear'},
      {top:def.base+'px',offset:1}
    ],{duration:P*1000,iterations:Infinity,easing:'linear'});
    sc.__apCle=cle;
    if(pb!=null)sc.__ap.currentTime=pb*P*1000;
  }else if(!attente&&pb!=null&&sc.__ap.effect){
    var t=sc.__ap.effect.getComputedTiming();
    if(t&&t.progress!=null){var d=Math.abs(Number(t.progress)-pb);if(Math.min(d,1-d)>0.03)sc.__ap.currentTime=pb*P*1000;}
  }
  /* Il manque de l'Or : la barre est pleine et plus rien ne bouge ; l'objet attend au contact (fin de l'approche), et repart quand l'Or revient. */
  if(sc.__ap){
    if(attente){if(sc.__ap.playState!=='paused'){sc.__ap.pause();sc.__ap.currentTime=P*999;}}
    else if(sc.__ap.playState==='paused')sc.__ap.play();
  }
}
/* Le doigt et le bras sont-ils sortis de la case ? Mémorisé entre deux redessins : un rituel qui reçoit de l'énergie est redessiné « sorti » puis rentre en glissant (transition), au lieu d'apparaître d'un coup. */
var etatHors={},installeA={};
/*
 * SANGSUE (Norman, 2026-10-11) : le ventre est vide au départ ; chaque niveau terminé = UN petit paquet de sang absorbé par la bouche, qui avance dans le ventre coup par coup, au rythme des succions
 * (déplacement fluide à chaque coup, puis repos). Plus les niveaux sont rapides, plus les paquets sont rapprochés ; au plus rapide, tout le ventre est plein et le sang coule sans arrêt.
 * m = nombre de coups (cases) entre deux paquets ; le ventre compte K cases (multiple de m : un paquet atteint la queue exactement quand un niveau se termine) ; S = durée d'un coup = P / m.
 * L'horloge est calée sur la barre du moteur (niveau terminé = barre qui repart de zéro), jamais sur une minuterie indépendante.
 */
var PAQ_CASES=6;
var memoireSang={};
function phaseBarre(sc){
  var bar=sc.querySelector('.bm-sang');
  var ab=bar&&(bar.__idleAugAnimationV217||(typeof bar.getAnimations==='function'?bar.getAnimations()[0]:null));
  var t=ab&&ab.effect&&typeof ab.effect.getComputedTiming==='function'?ab.effect.getComputedTiming():null;
  return t&&t.progress!=null?Number(t.progress):null;
}
function garantirPas(m){
  var id='sorealIdleSangPaquetsV1';
  var st=document.getElementById(id);
  if(!st){st=document.createElement('style');st.id=id;st.setAttribute('data-m','');document.head.appendChild(st);}
  var deja=(st.getAttribute('data-m')||'').split(',');
  if(deja.indexOf(String(m))>=0)return;
  var K=m*Math.ceil(PAQ_CASES/m),Jn=Math.ceil(PAQ_CASES/m),out='',j,i,pos=function(c){return (c/K*100).toFixed(3)+'%';};
  for(j=0;j<Jn;j++){
    out+='@keyframes bmPaq'+m+'x'+j+'{';
    for(i=0;i<m;i++){
      out+=(i/m*100).toFixed(3)+'%{left:'+pos(j*m+i)+';animation-timing-function:ease-in-out}';
      out+=((i+0.62)/m*100).toFixed(3)+'%{left:'+pos(j*m+i+1)+';animation-timing-function:linear}';
    }
    out+='100%{left:'+pos((j+1)*m)+'}}';
  }
  st.appendChild(document.createTextNode(out));
  deja.push(String(m));st.setAttribute('data-m',deja.join(','));
}
function sangsue(sc,sec,actif){
  var cont=sc.querySelector('.bm-paquets-corps');
  if(!cont)return;
  var paq=cont.children,i;
  if(!actif||!(sec>0)){
    if(sc.classList.contains('bm-pleure'))sc.classList.remove('bm-pleure');
    if(!sc.classList.contains('bm-dort'))sc.classList.add('bm-dort');   /* aucune Magie dans ce rituel : la sangsue dort */
    /* Quand on retire la Magie, le sang déjà dans son ventre RESTE affiché, mais figé (Norman, 2026-10-11) ; il est mémorisé par rituel pour survivre à un redessin de la page et reprendre là où il s'était arrêté. */
    var idSang=sc.getAttribute('data-bm-id'),mm=memoireSang[idSang];
    if(!sc.__fige&&sc.__cle&&paq[0]&&paq[0].getAnimations&&paq[0].getAnimations().length){
      /* le sang est déjà arrêté par le style : on garde exactement sa position */
      var tt=[],oo=[];
      for(i=0;i<paq.length;i++){
        var an0=paq[i].getAnimations&&paq[i].getAnimations()[0];
        tt.push(an0?Number(an0.currentTime)||0:0);oo.push(paq[i].classList.contains('on'));
        if(an0)an0.pause();
      }
      if(mm){mm.t=tt;mm.on=oo;}
      sc.classList.add('bm-fige');sc.__fige=true;
    }
    if(mm&&!sc.__fige){
      /* le ventre a été redessiné (ou masqué) : on le rebâtit figé, à partir du dernier état connu */
      garantirPas(mm.m);
      cont.style.setProperty('--bm-k',String(mm.m*Math.ceil(PAQ_CASES/mm.m)));
      for(i=0;i<paq.length;i++){
        /* position mémorisée = décalage négatif, et « paused » dans le style : le sang apparaît tout de suite à sa place, figé (le style le fige, pas le script) */
        paq[i].style.animation=i<Math.ceil(PAQ_CASES/mm.m)?'bmPaq'+mm.m+'x'+i+' '+mm.P.toFixed(3)+'s linear '+(-((mm.t[i]||0)/1000)).toFixed(3)+'s infinite paused':'none';
        if(mm.on[i]&&!paq[i].classList.contains('on'))paq[i].classList.add('on');
      }
      sc.classList.add('bm-fige');
      sc.__cle=mm.cle;sc.__fige=true;sc.__delai=true;
    }
    /* le sang figé reste figé : à chaque pas on vérifie que rien ne s'est remis en marche, et on le remet à son état mémorisé si une animation a été recréée */
    if(sc.__fige&&mm){
      for(i=0;i<paq.length;i++){
        var ag=paq[i].getAnimations&&paq[i].getAnimations()[0];
        if(ag&&ag.playState!=='paused'){ag.pause();ag.currentTime=mm.t[i]||0;}
      }
    }
    if(sc.classList.contains('bm-continu'))sc.classList.remove('bm-continu');
    return;
  }
  if(sc.classList.contains('bm-dort'))sc.classList.remove('bm-dort');
  var P=Math.max(PERIODE_MIN,sec);
  var m=P<3?Math.max(1,Math.round(P/0.5)):PAQ_CASES;
  var K=m*Math.ceil(PAQ_CASES/m),Jn=Math.ceil(PAQ_CASES/m),S=P/m;
  /* sans horloge de barre (animation absente), on ne recale RIEN : les paquets avancent seuls ; barre pleine faute d'Or : ils attendent au bout du ventre */
  var pbBrut=phaseBarre(sc),barre=sc.querySelector('.bm-sang');
  var ligneEta=document.getElementById('sorealIdleBloodEtaLineV1_'+sc.getAttribute('data-bm-id'));
  var attente=(pbBrut==null&&!!barre&&/scaleX\(1\)/.test(barre.style.transform||''))||(!!ligneEta&&/Barre pleine|validation/.test(ligneEta.textContent||''));
  var pb=pbBrut==null?0:pbBrut;
  var pleure=!!ligneEta&&/Barre pleine : il manque/.test(ligneEta.textContent||'');
  if(sc.classList.contains('bm-pleure')!==pleure)sc.classList.toggle('bm-pleure',pleure);
  var maintenant=performance.now()/1000;
  var cle=m+'|'+P.toFixed(2);
  var idS=sc.getAttribute('data-bm-id'),memS=memoireSang[idS];
  if(sc.__fige){
    sc.__fige=false;
    if(sc.__delai){
      /* le sang avait été rebâti figé avec un décalage : on le remet en marche depuis sa position exacte */
      sc.__delai=false;
      for(i=0;i<paq.length;i++){
        var ad=paq[i].getAnimations&&paq[i].getAnimations()[0];
        var pg=ad&&ad.effect?ad.effect.getComputedTiming().progress:null;
        paq[i].style.animationDelay='0s';paq[i].style.animationPlayState='running';
        if(ad&&pg!=null){ad.currentTime=pg*Math.max(PERIODE_MIN,sec)*1000;}
      }
    }
    if(sc.classList.contains('bm-fige'))sc.classList.remove('bm-fige');
    if(memS&&memS.cle===cle)sc.__t0=maintenant-pb*P-memS.niv*P;   /* même cadence : on reprend avec le même sang */
    else sc.__cle='';
  }
  if(sc.__cle!==cle){
    sc.__cle=cle;sc.__t0=maintenant-pb*P-((memS&&memS.cle===cle)?memS.niv*P:0);   /* nouvelle cadence : le ventre repart vide ; même cadence retrouvée après un redessin : le sang mémorisé revient */
    garantirPas(m);
    cont.style.setProperty('--bm-k',String(K));
    sc.style.setProperty('--bm-pas',S.toFixed(3)+'s');
    for(i=0;i<paq.length;i++){
      paq[i].classList.remove('on');
      paq[i].style.animation=i<Jn?'bmPaq'+m+'x'+i+' '+P.toFixed(3)+'s linear infinite':'none';
    }
    void cont.offsetWidth;
    /* ventre redessiné (page rafraîchie) juste après un pas : on repart de la position mémorisée plutôt que de l'horloge de la barre, qui peut déjà être à zéro si la Magie vient d'être retirée */
    var depuisMemoire=!!memS&&memS.cle===cle&&(performance.now()-(memS.at||0))<3000;
    for(i=0;i<Jn;i++){var an=paq[i].getAnimations&&paq[i].getAnimations()[0];if(an)an.currentTime=depuisMemoire?(memS.t[i]||0):pb*P*1000;}
  }else{
    /* recalage doux sur la barre du moteur */
    var a0=paq[0].getAnimations&&paq[0].getAnimations()[0],t0=a0&&a0.effect?a0.effect.getComputedTiming():null;
    if(pbBrut!=null&&t0&&t0.progress!=null){
      var d=Math.abs(Number(t0.progress)-pb);
      if(Math.min(d,1-d)>0.04)for(i=0;i<Jn;i++){var ai=paq[i].getAnimations()[0];if(ai)ai.currentTime=pb*P*1000;}
    }
  }
  for(i=0;i<Jn;i++){
    var aw=paq[i].getAnimations&&paq[i].getAnimations()[0];
    if(!aw)continue;
    if(attente){if(aw.playState!=='paused'){aw.pause();aw.currentTime=P*995;}}
    else if(aw.playState==='paused')aw.play();
  }
  /* la bouche suce au rythme des coups : une contraction par pas */
  var bo=sc.querySelector('.bm-bouche'),ab=bo&&bo.getAnimations?bo.getAnimations()[0]:null;
  if(ab&&ab.effect&&pbBrut!=null){
    var tb=ab.effect.getComputedTiming(),pr=((pb*P)%S)/S;
    if(tb&&tb.progress!=null){var dd=Math.abs(Number(tb.progress)-pr);if(Math.min(dd,1-dd)>0.06)ab.currentTime=pr*S*1000;}
  }
  /* un paquet de plus à chaque niveau terminé depuis le début du rituel : le ventre n'est jamais plein d'emblée */
  var niv=Math.floor((maintenant-sc.__t0)/P);
  for(i=0;i<paq.length;i++){
    var vis=i<Jn&&i<=niv;
    if(paq[i].classList.contains('on')!==vis)paq[i].classList.toggle('on',vis);
  }
  if(sc.classList.contains('bm-continu')!==(m===1))sc.classList.toggle('bm-continu',m===1);
  /* mémoire du sang affiché (pour le figer quand la Magie est retirée, et le retrouver après un redessin) */
  var tm=[],om=[];
  for(i=0;i<paq.length;i++){var am=paq[i].getAnimations&&paq[i].getAnimations()[0];tm.push(am?Number(am.currentTime)||0:0);om.push(paq[i].classList.contains('on'));}
  memoireSang[sc.getAttribute('data-bm-id')]={cle:cle,m:m,P:P,t:tm,on:om,niv:niv,at:performance.now()};
}
/* Le jet de la sangsue part au moment précis où le sang arrive au bout de son ventre : en boucle, son horloge est recalée sur celle de la barre (même phase, début du jet = barre pleine qui repart de zéro). */
function aligner(sc){
  var bar=sc.querySelector('.bm-sang'),f=sc.querySelector('.bm-filet');
  if(!bar||!f||typeof f.getAnimations!=='function')return;
  var ab=bar.__idleAugAnimationV217||(typeof bar.getAnimations==='function'?bar.getAnimations()[0]:null),af=f.getAnimations()[0];
  if(!ab||!af||!ab.effect||!af.effect)return;
  var tb=ab.effect.getComputedTiming(),tf=af.effect.getComputedTiming();
  var pb=tb&&tb.progress!=null?Number(tb.progress):null,df=tf?Number(tf.duration):0;
  if(pb==null||!(df>0)||tf.progress==null)return;
  var d=Math.abs(pb-Number(tf.progress));
  if(Math.min(d,1-d)>0.05)af.currentTime=pb*df;
}
function rythme(sc,id,n,avant){
  var src=sc.getAttribute('data-source');
  if(src==='sucon'){
    /* Le suçon marque le cou après la première succion complète (~0,9 s) et s'efface en fondu à l'arrêt du rituel. */
    var prog0=!!sc.querySelector('.bm-tuyau.saigne-v1');
    if(!prog0){clearTimeout(sc.__marq);sc.__marq=0;marqueVue[id]=false;if(sc.classList.contains('bm-marque'))sc.classList.remove('bm-marque');}
    else if(!sc.classList.contains('bm-marque')&&!sc.__marq&&sc.classList.contains('bm-installe')){
      var red=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      sc.__marq=setTimeout(function(){poserMarque(sc,id);},red?0:900);
    }
  }
  if(src==='punaise'||src==='papier'||src==='sucon'||src==='fil'){
    var horsVoulu=!sc.querySelector('.bm-tuyau.saigne-v1');
    if(sc.classList.contains('bm-hors')!==horsVoulu)sc.classList.toggle('bm-hors',horsVoulu);
    /* L'animation (punaise, feuille, coupure, traces, gouttes) ne commence que quand le doigt / le bras ont fini de se mettre en place (Norman, 2026-10-11) : l'échéance est mémorisée par rituel (le redessin de la page ne la fait pas sauter) ; glissement 0,95 s + 0,2 s de décalage. */
    var avantHors=etatHors[id];
    etatHors[id]=horsVoulu;
    if(horsVoulu)installeA[id]=Infinity;
    else if(avantHors===true||installeA[id]===Infinity)installeA[id]=performance.now()+1250;
    else if(installeA[id]===undefined)installeA[id]=0;   /* page ouverte avec le rituel déjà en marche : tout est déjà en place */
    var installe=!horsVoulu&&performance.now()>=installeA[id];
    if(sc.classList.contains('bm-installe')!==installe)sc.classList.toggle('bm-installe',installe);
  }
  if(src!=='punaise'&&src!=='papier'&&src!=='sucon'&&src!=='fil')return;
  /* Trace de l'impact : elle reste tant que le rituel progresse ; dès qu'il s'arrête (plus de Magie placée), elle s'efface en fondu (transition CSS). */
  var progresse=!!sc.querySelector('.bm-tuyau.saigne-v1');
  var pret=sc.classList.contains('bm-installe');
  if(!progresse){
    clearTimeout(sc.__marq);sc.__marq=0;marqueVue[id]=false;
    if(sc.classList.contains('bm-marque'))sc.classList.remove('bm-marque');
  }
  if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    if(progresse&&pret&&src!=='fil'&&!sc.classList.contains('bm-marque'))poserMarque(sc,id);
    return;
  }
  var ligneOr=document.getElementById('sorealIdleBloodEtaLineV1_'+id);
  var attenteOr=src!=='sucon'&&!!ligneOr&&/Barre pleine : il manque/.test(ligneOr.textContent||'');
  var H=window.__SOREAL_IDLE_META_HOST_V130__,etat=H&&H.getIdleEtat&&H.getIdleEtat();
  var vis=etat&&etat.__bloodMagicVisualV1,v=vis&&typeof vis==='object'?vis[id]:null;
  /* La vue du rituel disparaît un instant à chaque synchro avec le serveur, justement quand un niveau se termine (Norman, 2026-10-11 : « très peu de magie : l'animation ne se fait pas quand le chrono arrive à 0 ») : on garde la dernière durée connue. */
  /* (la dernière durée connue ne sert qu'au déclenchement du coup : le mode boucle, lui, suit la vue actuelle et ne continue jamais quand on retire toute la Magie) */
  var sec=v?Number(v.secondsPerCompletion):0;
  if(sec>0)secVue[id]=sec;
  var mode='repos';
  if(sec>0&&sec<=PERIODE_BOUCLE&&progresse&&pret&&!attenteOr){
    mode='boucle';
    var t=Math.max(PERIODE_MIN,sec),act=parseFloat(sc.style.getPropertyValue('--bm-t'))||0;
    if(!act||Math.abs(act-t)/t>0.04)sc.style.setProperty('--bm-t',t.toFixed(3)+'s');
  }
  if(sc.getAttribute('data-rythme')!==mode)sc.setAttribute('data-rythme',mode);
  if(src==='punaise'||src==='papier')approche(sc,src,sec>0?sec:(progresse&&pret?(secVue[id]||0):0),progresse&&pret,attenteOr);
  if(src==='fil'){sc.__filP=sec>0?sec:(progresse&&pret?(secVue[id]||0):0);filDemarrer();}
  if(src==='sucon'){
    if(mode==='boucle')aligner(sc);
    sangsue(sc,sec>0?sec:(progresse?(secVue[id]||0):0),progresse&&pret);
  }
  /* Boucle : la trace est posée à l'instant EXACT du premier impact, lu sur l'animation en cours (jamais sur une minuterie indépendante). */
  if(mode==='boucle'&&progresse&&!sc.classList.contains('bm-marque')&&!sc.__marq){
    var cible=src==='punaise'?sc.querySelector('.bm-punaise'):sc.querySelector('.bm-papier');
    var an=cible&&typeof cible.getAnimations==='function'?cible.getAnimations()[0]:null;
    var ct=an&&an.effect&&typeof an.effect.getComputedTiming==='function'?an.effect.getComputedTiming():null;
    var dur=ct?Number(ct.duration):0,prog=ct&&ct.progress!=null?Number(ct.progress):null;
    if(dur>0&&prog!=null){
      var delai=((PART_IMPACT[src]-(prog%1)+1)%1)*dur;
      sc.__marq=setTimeout(function(){poserMarque(sc,id);},delai);
    }
  }
  if(mode!=='boucle'&&n>avant&&src==='sucon'){
    /* un niveau vient de se terminer : le sang arrivé au bout du tuyau coule UNE fois dans la chope (jet qui s'allonge puis s'effile), jamais en continu */
    sc.classList.remove('bm-jet');void sc.offsetWidth;sc.classList.add('bm-jet');
    clearTimeout(sc.__jet);sc.__jet=setTimeout(function(){sc.classList.remove('bm-jet');},2100);
  }else if(mode!=='boucle'&&n>avant&&pret&&!attenteOr&&src==='fil'){
    /* quatrième rituel : l'animation de fin de niveau est pilotée par filTic (voir plus bas) */
  }else if(mode!=='boucle'&&n>avant&&pret&&!attenteOr){
    sc.classList.remove('bm-coup');void sc.offsetWidth;sc.classList.add('bm-coup');
    clearTimeout(sc.__marq);sc.__marq=setTimeout(function(){poserMarque(sc,id);},Math.round(PART_IMPACT[src]*900));
    clearTimeout(sc.__coup);sc.__coup=setTimeout(function(){sc.classList.remove('bm-coup');},1000);
  }
}
var derniers={};
/*
 * QUATRIÈME RITUEL (Norman, 2026-10-11) : 30 images (un bol de fil barbelé qu'il avale, jusqu'au bol vide) lues dans R2 sous idle/bloodmagic/rincevent/WEBP/. L'image affichée est choisie d'après l'avancement du niveau lu sur la
 * barre du moteur (jamais une minuterie indépendante) : bol plein au début du niveau, bol vide à sa fin, puis le bol se remplit d'un coup pour le niveau suivant. Sans Or, le bol reste vide (gel à la fin du niveau) ; sans énergie,
 * le personnage a quitté la case. Un seul canevas par scène, redessiné seulement quand l'image change.
 */
/* L'animation (30 images) ne se joue qu'À LA FIN du niveau, une seule fois, de façon fluide à cadence fixe FIL_FPS (Norman, 2026-10-11 : « immobile ; uniquement à la fin du rituel l'animation se déclenche avec le bon fps »). Pendant le niveau le personnage reste immobile (image 1, bol plein). Niveaux plus courts que l'animation : elle tourne en boucle à cette même cadence. */
/* Niveau affiché du calice (par rituel) : il suit le vrai compteur UNIQUEMENT quand une goutte de sang arrive au liquide (filAtterri) ; sans animation (mouvement réduit, page ouverte en cours de route), il rattrape après 4,5 s. */
var filAff={},filAtterri={};
function filNAffiche(id,n,sc){
  if(typeof document==='undefined'||typeof document.querySelector!=='function')return n;   /* rendu pur (tests) : pas d'animation, pas de retard */
  var m=filAff[id],now=typeof performance!=='undefined'?performance.now():Date.now();
  if(!m||n<m.n){filAff[id]={n:n,lag:0};return n;}
  if(n===m.n){m.lag=0;return n;}
  if(!m.lag)m.lag=now;
  var t=filAtterri[id];
  if((t&&now>=t)||now-m.lag>4500){
    m.n=n;m.lag=0;
    filAtterri[id]=(sc&&sc.classList.contains('bm-flux'))?now+800:0;
  }
  return m.n;
}
var FIL_N=30,FIL_FPS=9,FIL_DUREE=FIL_N/FIL_FPS,FIL_IMAGE_SANG=21,filImgs=null,filBoucle=0;
function filCharger(){
  if(filImgs)return;
  filImgs=[];
  for(var i=1;i<=FIL_N;i++){var im=new Image();im.decoding='async';im.src='/api/idle/media/bloodmagic?name=rincevent/WEBP/'+i+'.webp';filImgs.push(im);}
}
function filDessiner(cv,k){
  var im=filImgs&&filImgs[k];
  if(!im||!im.complete||!im.naturalWidth){
    im=null;
    for(var j=k;j>=0&&!im;j--){var c=filImgs&&filImgs[j];if(c&&c.complete&&c.naturalWidth)im=c;}
  }
  if(!im||(cv.__k===k&&cv.__im===im))return;
  var ctx=cv.getContext('2d');
  if(!ctx)return;
  ctx.clearRect(0,0,cv.width,cv.height);ctx.drawImage(im,0,0,cv.width,cv.height);
  cv.__k=k;cv.__im=im;
}
function filRepos(sc){sc.__filT0=0;sc.__filPb=null;sc.__filSang=false;return 0;}
function filCadre(sc){
  if(sc.classList.contains('bm-hors')||!sc.querySelector('.bm-tuyau.saigne-v1')||!sc.classList.contains('bm-installe'))return filRepos(sc);
  if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return filRepos(sc);
  var ligne=document.getElementById('sorealIdleBloodEtaLineV1_'+sc.getAttribute('data-bm-id'));
  if(ligne&&/Barre pleine : il manque/.test(ligne.textContent||''))return filRepos(sc);
  var maintenant=performance.now(),P=sc.__filP;
  if(P>0&&P<FIL_DUREE){
    /* niveaux plus courts que l'animation : boucle continue à la cadence normale */
    sc.__filT0=0;
    return Math.min(FIL_N-1,Math.floor(((maintenant/1000)%FIL_DUREE)/FIL_DUREE*FIL_N));
  }
  /* fin de niveau = la barre du moteur repart de zéro */
  var pb=phaseBarre(sc);
  if(pb!=null){
    if(sc.__filPb!=null&&pb<sc.__filPb-0.3){sc.__filT0=maintenant;sc.__filSang=false;}
    sc.__filPb=pb;
  }
  if(!sc.__filT0)return 0;
  var ecoule=(maintenant-sc.__filT0)/1000;
  if(ecoule>=FIL_DUREE){sc.__filT0=0;sc.__filSang=false;return 0;}
  return Math.min(FIL_N-1,Math.floor(ecoule*FIL_FPS));
}
/* les gouttes de sang jaillissent quand il avale le dernier morceau, une fois par animation */
/* Quantité de sang : ce qui est RÉELLEMENT produit pendant la durée de l'animation (Norman, 2026-10-11). Niveau plus long que l'animation : un seul niveau, une goutte ; plus les niveaux sont courts, plus il en est terminé pendant l'animation (FIL_DUREE / durée du niveau) et plus il y a de gouttes (de 1 à 8). */
function filGouttes(sc){
  var P=Number(sc.__filP)||0,c=P>0?Math.max(1,FIL_DUREE/P):1;
  return Math.max(1,Math.min(8,Math.round(1.6*Math.sqrt(c)-0.6)));
}
/* Le fil barbelé touche sa bouche à partir de l'image 6 (indice 5) : il saigne dès cet instant, jusqu'à la fin de l'animation (Norman, 2026-10-11). */
var FIL_IMAGE_CONTACT=5;
function filSaigne(sc,k){
  var on=k>=FIL_IMAGE_CONTACT;
  if(sc.classList.contains('bm-saigne-b-on')!==on)sc.classList.toggle('bm-saigne-b-on',on);
}
function filSang(sc,k){
  if(k<FIL_IMAGE_SANG){
    sc.__filSang=false;
    if(sc.classList.contains('bm-flux')){sc.classList.remove('bm-flux');sc.classList.remove('bm-coup');}
    return;
  }
  if(sc.__filSang)return;
  sc.__filSang=true;
  filAtterri[sc.getAttribute('data-bm-id')]=performance.now()+800;   /* la première goutte touche le liquide dans 0,8 s */
  var nb=filGouttes(sc),gs=sc.querySelectorAll('.bm-crachat,.bm-eclat');
  for(var g=0;g<gs.length;g++)gs[g].classList.toggle('off',(g%8)>=nb);
  sc.classList.remove('bm-coup');void sc.offsetWidth;sc.classList.add('bm-coup');
  /* haut niveau (beaucoup de niveaux terminés pendant l'animation) : le sang COULE sans interruption jusqu'à la fin de l'animation, au lieu de quelques gouttes isolées */
  var flux=nb>=6;
  sc.classList.toggle('bm-flux',flux);
  clearTimeout(sc.__coup);
  if(!flux)sc.__coup=setTimeout(function(){sc.classList.remove('bm-coup');},1100);
}
function filTic(){
  var l=document.querySelectorAll('.bm-scene[data-source="fil"]');
  if(!l.length){filBoucle=0;return;}
  for(var i=0;i<l.length;i++){
    var cv=l[i].querySelector('.bm-fil');
    if(!cv)continue;
    var k=filCadre(l[i]);l[i].__kfil=k;filDessiner(cv,k);filSaigne(l[i],k);filSang(l[i],k);
  }
  filBoucle=requestAnimationFrame(filTic);
}
function filDemarrer(){
  filCharger();
  if(!filBoucle&&typeof requestAnimationFrame==='function')filBoucle=requestAnimationFrame(filTic);
}
/*
 * Un contenant ne se vide jamais « pour rien » (Norman, 2026-10-11 : « il se remplit, se vide, ça n'a pas de sens ») : le compteur de la page peut reculer un instant (rejeu local en avance sur la réponse
 * du serveur, redessin avec un chiffre plus ancien). Le niveau AFFICHÉ ne baisse donc que d'une vraie remise à zéro (Renaissance : le chiffre tombe sous la moitié) ; aucun délai.
 */
var affiches={};
function stabiliser(id,n){
  var a=affiches[id];
  if(a===undefined||n>=a||n<=a/2){affiches[id]=n;return n;}
  return a;
}
function majScene(sc){
  var id=sc.getAttribute('data-bm-id');
  var n=lireCompte(id);
  if(n==null)return;
  n=stabiliser(id,n);
  var type=sc.getAttribute('data-contenant')||'calice',c=CONTENANTS[type]||CONTENANTS.calice;
  var cap=Number(sc.getAttribute('data-bm-cap'))||NIVEAUX_PAR_RECIPIENT;
  var nv=sc.getAttribute('data-source')==='fil'?filNAffiche(id,n,sc):n;
  var pleins=Math.floor(nv/cap),fraction=(nv%cap)/cap;
  rythme(sc,id,n,derniers[id]===undefined?n:derniers[id]);
  derniers[id]=n;
  var avant=vus[id];
  if(avant===undefined)avant=Number(sc.getAttribute('data-bm-pleins'))||0;
  var attend=sc.querySelector('.bm-vase.bm-suivant');
  if(pleins>avant&&!sc.__swap){
    if(!attend){
      /* le suivant n'était pas encore là (gros saut de niveaux) : il arrive d'abord d'en dehors du cadre, le plein reste plein pendant ce temps, puis il le pousse */
      ajouterSuivant(sc,type,true);
      sc.__swap=true;sc.__plein=true;
      setTimeout(function(){sc.__plein=false;sc.__swap=false;echanger(sc,type);},900);
    }else echanger(sc,type);
  }else if(!sc.__swap){
    if(fraction>=SEUIL_ARRIVEE&&!attend){ajouterSuivant(sc,type,true);suivantVu[id]=true;}
    else if(fraction<SEUIL_ARRIVEE){suivantVu[id]=false;if(attend&&attend.parentNode)attend.parentNode.removeChild(attend);}
  }
  var fAff=sc.__plein?1:(sc.__vide?0:fraction);
  niveauLiquide(sc,fAff,c);
  var ch=chuteSang(sc.getAttribute('data-source'),type,parseFloat(sc.style.getPropertyValue('--vh')),parseFloat(sc.style.getPropertyValue('--vb')),parseFloat(sc.style.getPropertyValue('--sh')),fAff);
  if(ch!=null&&sc.style.getPropertyValue('--chute')!==ch+'px')sc.style.setProperty('--chute',ch+'px');
  if(pleins!==avant||sc.getAttribute('data-bm-pleins')!==String(pleins))sc.setAttribute('data-bm-pleins',String(pleins));
  var et=sc.parentNode&&sc.parentNode.querySelector('[data-bm-etagere="'+id+'"]');
  var nEl=et&&et.querySelector('.bm-etagere-n');
  if(nEl){var txt=formatSang(n*(Number(sc.getAttribute('data-bm-sang'))||0));if(nEl.textContent!==txt)nEl.textContent=txt;}
  vus[id]=pleins;
}
function majVases(){
  var sc=document.querySelectorAll('.bm-scene');
  for(var i=0;i<sc.length;i++)majScene(sc[i]);
}
var tic=0;
function demarrer(){
  if(tic||typeof setInterval!=='function')return;
  tic=setInterval(function(){if(!document.hidden)majVases();},400);
}

/* ---------- Habillage (injecté une fois) ---------- */
var CSS_ID='sorealIdleSangDecorV1';
var RUNE='data:image/svg+xml;utf8,'+encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><circle cx='100' cy='100' r='94' fill='none' stroke='%23ff3a55' stroke-width='9'/><path d='"+etoile(100,100,80)+"' fill='none' stroke='%23ff3a55' stroke-width='11' stroke-linejoin='round'/></svg>").replace(/%2523/g,'%23');
/* Le tuyau grossit avec le sacrifice : rang 0 = fin, rang 5 = très gros (largeur du corps, puis hauteur de la tuile = corps + 26). */
var CORPS_PAR_RANG=[11,14,18,22,27,32];
function tuile(corps,haut){
  var h=corps+26,t=h/2-22;
  var masque='data:image/svg+xml;utf8,'+encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='120' height='"+h+"' viewBox='0 0 120 "+h+"'><path transform='translate(0,"+t+")' d='"+COURBE_VER+"' fill='none' stroke='#000' stroke-width='"+corps+"'/></svg>");
  var relief='data:image/svg+xml;utf8,'+encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='120' height='"+h+"' viewBox='0 0 120 "+h+"'><path transform='translate(0,"+(t-corps*0.22).toFixed(2)+")' d='"+COURBE_VER+"' fill='none' stroke='#fff' stroke-opacity='.38' stroke-width='"+Math.max(2,corps*0.17).toFixed(1)+"' stroke-linecap='round'/><path transform='translate(0,"+(t+corps*0.3).toFixed(2)+")' d='"+COURBE_VER+"' fill='none' stroke='#000' stroke-opacity='.42' stroke-width='"+Math.max(3,corps*0.22).toFixed(1)+"' stroke-linecap='round'/></svg>");
  return {h:h,masque:masque,relief:relief};
}
function reglesRangs(P){
  var out=[],r,t,sel;
  for(r=0;r<CORPS_PAR_RANG.length;r++){
    t=tuile(CORPS_PAR_RANG[r]);
    sel=P+'.bm-rituel[data-rang-v1="'+r+'"]';
    out.push(sel+'{--th:'+t.h+'px}');
    out.push(sel+' .bm-tuyau{-webkit-mask:url("'+t.masque+'") 0 0/120px '+t.h+'px repeat-x;mask:url("'+t.masque+'") 0 0/120px '+t.h+'px repeat-x}');
    out.push(sel+' .bm-tuyau::after{background:url("'+t.relief+'") 0 0/120px '+t.h+'px repeat-x}');
  }
  return out;
}

function css(){
  if(typeof document.createElement!=='function'||!document.head||document.getElementById(CSS_ID))return;
  var P='html body.soreal-idle-active-v47 .soreal-idle-bloodmagic-v1 ';
  var st=document.createElement('style');st.id=CSS_ID;
  st.textContent=[
    /* Fond : noir lie-de-vin, un pentacle pâle derrière tout */
    P+'{background:radial-gradient(ellipse 110% 38% at 50% 0,rgba(170,12,38,.40),transparent 70%),radial-gradient(ellipse 90% 40% at 50% 100%,rgba(90,6,24,.45),transparent 72%),linear-gradient(180deg,#14040a 0%,#0c0306 55%,#070204 100%);}',
    /* En-tête */
    P+'.bm-entete{position:relative;display:flex;align-items:center;justify-content:center;gap:clamp(8px,3vw,28px);margin:6px 0 14px;padding:18px 10px 14px;border:3px solid #000;border-radius:14px;background:linear-gradient(180deg,#2a0610,#14040a);box-shadow:inset 0 0 0 2px rgba(200,30,55,.35),inset 0 -26px 40px rgba(120,6,26,.35),4px 4px 0 #000;overflow:hidden;isolation:isolate}',
    P+'.bm-entete-fond{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:-1;pointer-events:none}',
    P+'.bm-pentacle-fond{width:min(340px,92%);height:auto;color:rgba(230,40,70,.34);filter:drop-shadow(0 0 8px rgba(255,30,60,.45));animation:bmTourne 90s linear infinite}',
    P+'.bm-entete-texte{text-align:center;min-width:0}',
    P+'.bm-titre{margin:0;font-family:var(--f-titre,"Bangers",cursive)!important;font-weight:400;font-size:clamp(30px,7vw,54px);letter-spacing:.12em;line-height:1;color:#ffdce1;text-transform:uppercase;text-shadow:0 3px 0 #000,0 0 18px rgba(255,30,60,.85),0 0 34px rgba(190,10,40,.7);-webkit-text-stroke:1px #000}',
    P+'.bm-sous-titre{margin:6px 0 0;font-family:var(--f-texte,"Russo One",sans-serif);font-size:clamp(11px,2.3vw,15px);color:#e9aeb8;text-shadow:0 1px 0 #000}',
    P+'.bm-bougie{flex:0 0 auto;width:clamp(26px,6vw,40px);height:auto;filter:drop-shadow(0 0 10px rgba(255,150,40,.55))}',
    P+'.bm-flamme{transform-origin:20px 33px;animation:bmFlamme 1.3s ease-in-out infinite}',
    P+'.bm-entete .bm-bougie:last-of-type .bm-flamme{animation-delay:-.6s}',
    /* Rituel : carte noire cerclée de sang */
    P+'.bm-rituel{position:relative;margin:0;padding:12px 12px 12px;border:3px solid #000;border-radius:14px;background:radial-gradient(ellipse 90% 60% at 50% 0,rgba(150,10,36,.42),transparent 72%),linear-gradient(170deg,#2b0710,#150409);box-shadow:inset 0 0 0 2px rgba(210,40,66,calc(.22 + var(--bm-r,0)*.07)),0 0 calc(var(--bm-r,0)*5px) rgba(220,20,50,.45),4px 4px 0 #000;color:#f3d9de;overflow:hidden}',
    P+'.bm-rituel[data-rang-v1="0"]{--bm-r:0}'+P+'.bm-rituel[data-rang-v1="1"]{--bm-r:1}'+P+'.bm-rituel[data-rang-v1="2"]{--bm-r:2}'+P+'.bm-rituel[data-rang-v1="3"]{--bm-r:3}'+P+'.bm-rituel[data-rang-v1="4"]{--bm-r:4}'+P+'.bm-rituel[data-rang-v1="5"]{--bm-r:5}',
    /* Cadres verticaux de taille FIXE (Norman, 2026-10-11) : sur PC ils se rangent côte à côte tant qu'il y a de la place (alignés à gauche, jamais superposés) ; la scène garde la largeur d'un téléphone, donc le bras n'est jamais étiré et PC et téléphone montrent la même chose. */
    P+'.bm-grille{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,324px),324px));grid-auto-rows:1fr;gap:12px;align-items:stretch;justify-content:start}',
    P+'.bm-grille>.bm-rituel{width:auto;box-sizing:border-box;display:flex;flex-direction:column}',
    P+'.bm-grille>.bm-rituel .soreal-idle-bt-actions-v120{margin-top:auto!important;padding-top:9px}',
    /* hauteurs réservées (Norman, 2026-10-11 : « les boutons doivent toujours être alignés ») : titre sur trois lignes, description sur deux, ligne du compte à rebours même sans énergie allouée */
    P+'.bm-grille>.bm-rituel .bm-rituel-tete{min-height:76px;box-sizing:border-box}',
    P+'.bm-grille>.bm-rituel .soreal-idle-blood-ritual-desc-v1{min-height:2.7em}',
    P+'.bm-rituel-tete{display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap}',
    P+'.bm-rituel-nom{font-family:var(--f-titre,"Bangers",cursive)!important;font-weight:400;font-size:calc(1.25em + var(--bm-r,0)*.07em);letter-spacing:.06em;color:#ffe4e8;text-shadow:0 2px 0 #000,0 0 12px rgba(255,30,60,.55)}',
    P+'.bm-rituel-compte{font-family:var(--f-texte,"Russo One",sans-serif);font-size:.95em;color:#f3b4be}',
    P+'.bm-rituel-compte b{font-family:var(--f-titre,"Bangers",cursive)!important;font-weight:400;font-size:1.5em;color:#fff;letter-spacing:.04em;text-shadow:0 2px 0 #000,0 0 10px rgba(255,40,70,.7)}',
    P+'.bm-rituel .soreal-idle-blood-ritual-desc-v1{margin:6px 0 8px;font-family:var(--f-texte,"Russo One",sans-serif)}',
    /* Scène */
    P+'.bm-scene{--cx:calc(var(--vw,100px)/2 + 12px);position:relative;height:var(--sh,244px);margin:6px 0 4px;border:3px solid #000;border-radius:12px;overflow:hidden;background:radial-gradient(ellipse 70% 60% at 82% 78%,rgba(190,16,44,.28),transparent 70%),linear-gradient(180deg,#1b050b,#0b0205);box-shadow:inset 0 0 26px rgba(0,0,0,.85),inset 0 0 0 2px rgba(190,30,55,.25)}',
    P+'.bm-sol{position:absolute;right:-26px;bottom:-34px;width:210px;height:210px;transform:perspective(360px) rotateX(64deg);transform-origin:50% 100%;pointer-events:none;opacity:.9}',
    P+'.bm-pentacle-sol{width:100%;height:100%;color:rgba(235,40,70,.55);filter:drop-shadow(0 0 6px rgba(255,30,60,.6));animation:bmTourne 40s linear infinite;animation-play-state:paused}',
    /* le pentacle du sol ne tourne que lorsque le rituel est en marche (Norman, 2026-10-11) ; à l'arrêt il garde l'angle où il s'est arrêté */
    P+'.bm-scene:has(.bm-tuyau.saigne-v1) .bm-pentacle-sol{animation-play-state:running}',
    /* le tuyau grossit avec le rang du rituel (--th = hauteur de la tuile) ; son axe reste à 70 px du haut de la scène */
    P+'.bm-ver{position:absolute;left:14px;right:var(--cx);top:calc(70px - var(--th,44px)/2);height:var(--th,44px);filter:drop-shadow(0 0 1.4px #000) drop-shadow(0 3px 3px rgba(0,0,0,.65))}',
    P+'.bm-scene[data-source="punaise"] .bm-ver{left:80px}',
    P+'.bm-tuyau{position:absolute;inset:0;overflow:hidden;background:linear-gradient(180deg,#5a3a3c,#2e1a1c);-webkit-mask:url("'+MASQUE_VER+'") 0 0/120px 44px repeat-x;mask:url("'+MASQUE_VER+'") 0 0/120px 44px repeat-x}',
    /* anneaux du ver (période 12 px) : ils avancent quand le rituel progresse */
    P+'.bm-tuyau::before{content:"";position:absolute;top:0;bottom:0;left:-12px;width:calc(100% + 12px);z-index:2;pointer-events:none;background:repeating-linear-gradient(90deg,rgba(0,0,0,.34) 0 2px,rgba(255,255,255,.08) 2px 4px,transparent 4px 12px);background-size:12px 100%}',
    P+'.bm-tuyau::after{content:"";position:absolute;inset:0;z-index:3;pointer-events:none;background:url("'+RELIEF_VER+'") 0 0/120px 44px repeat-x}',
    P+'.bm-scene:has(.bm-tuyau.saigne-v1) .bm-tuyau::before{animation:bmAnneaux .9s linear infinite}',
    /* le sang : barre du moteur, animée par soreal-idle-ui.js (transform scaleX) */
    P+'.bm-tuyau .bm-sang{position:absolute;inset:0;width:100%;transform-origin:left center;will-change:transform;background:linear-gradient(180deg,#ff3a55 0,#c0152e 40%,#6d0818 100%);transition:none;z-index:1}',
    P+'.bm-tuyau .sang-g-v1{display:none}',
    P+'.bm-ver:has(.saigne-v1){animation:bmPouls 1.1s ease-in-out infinite}',
    P+'.bm-bride{position:absolute;left:8px;top:calc(70px - 30px);width:20px;height:60px;z-index:4;filter:drop-shadow(0 2px 2px rgba(0,0,0,.6))}',
    /* le doigt et la punaise (premier rituel) : la punaise plane au-dessus du doigt, elle s'enfonce quand de la Magic est placée, une perle de sang perle à chaque piqûre */
    /* premier rituel : le doigt sort du bord gauche et s'arrête (--tx) au-dessus de la boîte, qui est posée juste dessous */
    P+'.bm-scene[data-source="punaise"]{--tx:165px;--px:calc(var(--tx) - 36px);--chute:128px;--gy:87px}',
    P+'.bm-scene[data-source="papier"]{--px:120px;--chute:74px;--gy:89px}',
    P+'.bm-scene[data-source="fil"]{--px:222px}',
    P+'.bm-doigt{position:absolute;left:-6px;top:56px;width:calc(var(--tx) + 6px);height:72px;z-index:4;display:block;transform-origin:50% 100%;filter:drop-shadow(0 2px 2px rgba(0,0,0,.6))}',
    P+'.bm-scene[data-source="punaise"] .bm-vase,'+P+'.bm-scene[data-source="papier"] .bm-vase,'+P+'.bm-scene[data-source="fil"] .bm-vase{right:auto;left:calc(var(--px) - var(--vw,250px)/2)}',
    P+'.bm-scene[data-source="punaise"] .bm-sol,'+P+'.bm-scene[data-source="papier"] .bm-sol,'+P+'.bm-scene[data-source="fil"] .bm-sol{right:auto;left:calc(var(--px) - 105px)}',
    /* la punaise plane au-dessus du bout du doigt ; la piqûre = un niveau */
    P+'.bm-punaise{position:absolute;left:calc(var(--tx) - 51px);top:14px;width:30px;height:50px;z-index:5;transform:translateY(-8px);filter:drop-shadow(0 2px 2px rgba(0,0,0,.6))}',
    /* la goutte qui part du doigt : elle roule jusqu'au bout puis tombe dans la boîte (une goutte par piqûre) */
    P+'.bm-goutte-doigt{position:absolute;left:calc(var(--px) - 4px);top:var(--gy,87px);width:7px;height:10px;z-index:6;border:1px solid #000;border-radius:50% 50% 50% 50%/65% 65% 38% 38%;background:radial-gradient(circle at 38% 30%,#ff7a8a,#c0152e 55%,#6b0a18);opacity:0}',
    /* la barre du moteur sert d'horloge : elle reste en place mais invisible */
    P+'.bm-scene[data-source="fil"] .bm-ver{opacity:0;pointer-events:none}',
    P+'.bm-scene[data-source="fil"] .bm-bec{display:none}',
    /* sang qui s'échappe de sa bouche : arc (x régulier, y qui monte un peu puis tombe de plus en plus vite, goutte qui s'étire) jusqu'à la SURFACE DU LIQUIDE déjà dans le calice (hauteur de chute --chute, calculée par chuteSang), puis éclaboussure */
    P+'.bm-crachat{position:absolute;left:90px;top:119px;width:7px;height:10px;z-index:6;opacity:0;pointer-events:none}',
    P+'.bm-crachat b{display:block;width:100%;height:100%;border:1px solid #000;border-radius:50% 50% 50% 50%/65% 65% 38% 38%;background:radial-gradient(circle at 38% 30%,#ff7a8a,#c0152e 55%,#6b0a18);box-sizing:border-box}',
    P+'.bm-crachat.c2{width:6px;height:8px}',
    P+'.bm-crachat.c3{width:5px;height:7px}',
    P+'.bm-crachat.c5{width:6px;height:9px}',
    P+'.bm-crachat.c7{width:5px;height:8px}',
    P+'.bm-crachat.off,'+P+'.bm-eclat.off{display:none}',
    /* il saigne dès que le fil touche sa bouche (image 6) : petite tache au point d'entrée du fil entre les lèvres, filet fin qui suit le fil (même inclinaison), puis des gouttes qui se forment au bout du filet et tombent le long du menton */
    P+'.bm-levre-sang{position:absolute;left:85.5px;top:120.2px;width:9px;height:4px;z-index:6;border-radius:58% 42% 52% 48%/62% 58% 42% 38%;background:radial-gradient(ellipse at 50% 40%,#d4122f 0,#9a0c22 55%,rgba(110,8,24,.0) 100%);opacity:0;transform:scale(.4);transition:opacity .25s ease,transform .35s ease-out;pointer-events:none}',
    P+'.bm-filet-fil{position:absolute;left:89.4px;top:122.4px;width:1.7px;height:15px;z-index:6;border-radius:1px;background:linear-gradient(180deg,#d4122f,#8a0a1c 75%,rgba(110,8,24,.5));transform-origin:50% 0;transform:rotate(-4.5deg) scaleY(0);pointer-events:none}',
    P+'.bm-saigne-b{position:absolute;left:92px;top:136px;width:3px;height:5px;z-index:6;border-radius:50% 50% 50% 50%/62% 62% 40% 40%;background:radial-gradient(circle at 38% 28%,#ff7a8a,#c0152e 55%,#6b0a18);opacity:0;pointer-events:none}',
    P+'.bm-saigne-b.s2{left:93px;width:2.4px;height:4px}',
    P+'.bm-scene[data-source="fil"].bm-saigne-b-on .bm-levre-sang{opacity:.92;transform:scale(1)}',
    P+'.bm-scene[data-source="fil"].bm-saigne-b-on .bm-filet-fil{animation:bmTraceFil .8s ease-out .15s both}',
    P+'.bm-scene[data-source="fil"].bm-saigne-b-on .bm-saigne-b{animation:bmSaigneB 1.3s linear .9s infinite}',
    P+'.bm-scene[data-source="fil"].bm-saigne-b-on .bm-saigne-b.s2{animation-delay:1.55s;animation-duration:1.6s}',
    '@keyframes bmTraceFil{0%{transform:rotate(-4.5deg) scaleY(0)}100%{transform:rotate(-4.5deg) scaleY(1)}}',
    /* la goutte grossit au bout du filet, se détache, puis tombe de plus en plus vite le long du menton */
    '@keyframes bmSaigneB{0%{translate:0 0;opacity:0;scale:.3 .3}25%{translate:0 0;opacity:1;scale:1 1}45%{translate:0 2px;opacity:1;scale:1 1.15}100%{translate:1.5px 42px;opacity:0;scale:.8 1.6}}',
    /* il saigne de la bouche dès que le fil la touche : lèvre rouge + filets qui coulent le long du menton */
    P+'.bm-eclat{position:absolute;left:210px;top:calc(124px + var(--chute,44px) - 3px);width:18px;height:6px;z-index:6;border-radius:50%;border:1.6px solid rgba(255,130,150,.9);background:rgba(160,10,35,.45);opacity:0;pointer-events:none}',
    P+'.bm-scene[data-source="fil"].bm-coup .bm-crachat{animation:bmCrX .8s linear both}',
    P+'.bm-scene[data-source="fil"].bm-coup .bm-crachat b{animation:bmCrY .8s linear both}',
    P+'.bm-scene[data-source="fil"].bm-coup .bm-eclat{animation:bmEclat .8s linear both}',
    P+'.bm-scene[data-source="fil"].bm-coup.bm-flux :is(.bm-crachat,.bm-crachat b,.bm-eclat){animation-iteration-count:infinite}',
    P+'.bm-scene[data-source="fil"].bm-coup :is(.bm-crachat.c2,.bm-crachat.c2 b,.bm-eclat.c2){animation-delay:0.1s}',
    P+'.bm-scene[data-source="fil"].bm-coup :is(.bm-crachat.c3,.bm-crachat.c3 b,.bm-eclat.c3){animation-delay:0.2s}',
    P+'.bm-scene[data-source="fil"].bm-coup :is(.bm-crachat.c4,.bm-crachat.c4 b,.bm-eclat.c4){animation-delay:0.3s}',
    P+'.bm-scene[data-source="fil"].bm-coup :is(.bm-crachat.c5,.bm-crachat.c5 b,.bm-eclat.c5){animation-delay:0.4s}',
    P+'.bm-scene[data-source="fil"].bm-coup :is(.bm-crachat.c6,.bm-crachat.c6 b,.bm-eclat.c6){animation-delay:0.5s}',
    P+'.bm-scene[data-source="fil"].bm-coup :is(.bm-crachat.c7,.bm-crachat.c7 b,.bm-eclat.c7){animation-delay:0.6s}',
    P+'.bm-scene[data-source="fil"].bm-coup :is(.bm-crachat.c8,.bm-crachat.c8 b,.bm-eclat.c8){animation-delay:0.7s}',
    '@keyframes bmCrX{0%{translate:0 0;opacity:0}8%{opacity:1}94%{opacity:1}100%{translate:130px 0;opacity:0}}',
    '@keyframes bmCrY{0%{translate:0 calc(-26px*0.00 + (var(--chute,44px) + 26px)*0.0000);scale:1.00 1.00}10%{translate:0 calc(-26px*0.10 + (var(--chute,44px) + 26px)*0.0100);scale:0.98 1.07}20%{translate:0 calc(-26px*0.20 + (var(--chute,44px) + 26px)*0.0400);scale:0.97 1.14}30%{translate:0 calc(-26px*0.30 + (var(--chute,44px) + 26px)*0.0900);scale:0.95 1.21}40%{translate:0 calc(-26px*0.40 + (var(--chute,44px) + 26px)*0.1600);scale:0.94 1.28}50%{translate:0 calc(-26px*0.50 + (var(--chute,44px) + 26px)*0.2500);scale:0.93 1.35}60%{translate:0 calc(-26px*0.60 + (var(--chute,44px) + 26px)*0.3600);scale:0.91 1.42}70%{translate:0 calc(-26px*0.70 + (var(--chute,44px) + 26px)*0.4900);scale:0.90 1.49}80%{translate:0 calc(-26px*0.80 + (var(--chute,44px) + 26px)*0.6400);scale:0.88 1.56}90%{translate:0 calc(-26px*0.90 + (var(--chute,44px) + 26px)*0.8100);scale:0.86 1.63}100%{translate:0 calc(-26px*1.00 + (var(--chute,44px) + 26px)*1.0000);scale:0.85 1.70}}',
    '@keyframes bmEclat{0%,76%{opacity:0;transform:scale(.3)}80%{opacity:.95;transform:scale(.6)}100%{opacity:0;transform:scale(1.5)}}',
    P+'.bm-fil{position:absolute;left:-14px;top:30px;height:282px;width:auto;aspect-ratio:629/943;z-index:5;display:block;pointer-events:none;filter:drop-shadow(0 2px 3px rgba(0,0,0,.55))}',
    /* gouttes de sang qui jaillissent de sa bouche vers le récipient (une trajectoire en arc, jamais en l'air sans but) */
    P+'.bm-scene[data-source="punaise"] .bm-ver,'+P+'.bm-scene[data-source="papier"] .bm-ver,'+P+'.bm-scene[data-source="punaise"] .bm-bec,'+P+'.bm-scene[data-source="papier"] .bm-bec{display:none}',
    /* rythme : en boucle quand le rituel se termine souvent (période réelle, plafonnée pour rester lisible), un coup par niveau sinon */
    P+'.bm-scene[data-rythme="boucle"] .bm-punaise{animation:bmPique var(--bm-t,1s) ease-in-out infinite}',
    P+'.bm-scene[data-rythme="boucle"] .bm-doigt{animation:bmDoigt var(--bm-t,1s) ease-in-out infinite}',
    P+'.bm-scene[data-rythme="boucle"] .bm-goutte-doigt{animation:bmGouttedoigt var(--bm-t,1s) ease-in infinite}',
    P+'.bm-scene.bm-coup .bm-punaise{animation:bmPique .9s ease-in-out 1 both}',
    P+'.bm-scene.bm-coup .bm-doigt{animation:bmDoigt .9s ease-in-out 1 both}',
    P+'.bm-scene.bm-coup .bm-goutte-doigt{animation:bmGouttedoigt .9s ease-in 1 both}',
    /* second rituel : un avant-bras se fait trancher par une feuille de papier ; la feuille descend d'un coup à travers le bras, laisse un trait rouge, la goutte naît au milieu du trait et tombe droit dans le verre */
    P+'.bm-goutte-doigt.bm-gros{width:13px;height:18px;margin-left:-3px}',
    P+'.bm-goutte-doigt.g2{width:11px;height:15px;margin-left:5px}',
    P+'.bm-goutte-doigt.g3{width:9px;height:12px;margin-left:-8px}',
    P+'.bm-scene[data-rythme="boucle"] .bm-goutte-doigt.g2{animation-delay:calc(var(--bm-t,1s)*.1)}',
    P+'.bm-scene[data-rythme="boucle"] .bm-goutte-doigt.g3{animation-delay:calc(var(--bm-t,1s)*.2)}',
    P+'.bm-scene.bm-coup .bm-goutte-doigt.g2{animation-delay:.09s}',
    P+'.bm-scene.bm-coup .bm-goutte-doigt.g3{animation-delay:.18s}',
    P+'.bm-papier{position:absolute;left:calc(var(--px) - 65px);top:-36px;width:68px;height:88px;z-index:5;transform-origin:50% 100%;filter:drop-shadow(0 2px 2px rgba(0,0,0,.55))}',
    P+'.bm-coupure{position:absolute;left:calc(var(--px) - 1.5px);top:76px;width:3px;height:42px;z-index:5;border-radius:2px;background:linear-gradient(180deg,#e0304a,#a30f22);box-shadow:0 0 4px rgba(255,40,70,.8);opacity:0;transform-origin:50% 0}',
    P+'.bm-scene[data-rythme="boucle"] .bm-papier{animation:bmCoupe var(--bm-t,1s) ease-in-out infinite}',
    P+'.bm-scene[data-rythme="boucle"] .bm-coupure{animation:bmTrait var(--bm-t,1s) ease-out infinite}',
    P+'.bm-scene.bm-coup .bm-papier{animation:bmCoupe .9s ease-in-out 1 both}',
    P+'.bm-scene.bm-coup .bm-coupure{animation:bmTrait .9s ease-out 1 both}',
    /* traces d'impact : un trou sur le bout du doigt, des coupures sur le bras ; fondu rapide à l'apparition, fondu LENT à la disparition (quand le rituel s'arrête) */
    P+'.bm-trace{position:absolute;z-index:5;pointer-events:none;opacity:0;transition:opacity 1.8s ease-out}',
    P+'.bm-scene.bm-marque .bm-trace{opacity:1;transition:opacity .25s ease-out}',
    /* Quand la Magie est retirée, le bras (ou le doigt) repart et la cicatrice disparaît d'un coup avec lui : elle ne reste pas flottante pendant le fondu (Norman, 2026-10-11). */
    P+'.bm-scene.bm-hors .bm-trace{opacity:0;transition:opacity .1s linear}',
    P+'.bm-trace-trou{left:calc(var(--px) - 6px);top:86px;width:12px;height:12px;border-radius:50%;background:radial-gradient(circle,#2a0309 0 22%,#b3102a 24% 52%,rgba(179,16,42,.35) 54% 70%,transparent 72%)}',
    P+'.bm-trace-coupures{left:calc(var(--px) - 14px);top:74px;width:28px;height:46px;background:linear-gradient(#c01a30,#8f1124) 13px 0/3px 100% no-repeat,linear-gradient(#a3182c,#8f1124) 3px 9px/2px 66% no-repeat,linear-gradient(#a3182c,#8f1124) 23px 14px/2px 56% no-repeat;border-radius:2px;box-shadow:0 0 3px rgba(255,40,70,.5)}',
    /* troisième rituel : un cou, un tuyau de ver dont la bouche suce le cou, le sang monte dans le tuyau (barre du moteur) et tombe dans la chope */
    P+'.bm-cou{position:absolute;left:-6px;top:0;width:100px;height:312px;z-index:3;filter:drop-shadow(0 2px 3px rgba(0,0,0,.55))}',
    /* nouvelle image avec la main (1552 x 677) : l'avant-bras garde EXACTEMENT sa taille et sa place d'avant (épaisseur 63 px, centre à 96 px, manche à gauche) pour que la coupure tombe au même endroit ; la main dépasse à droite, HORS de la case : on ne la voit que quand le bras glisse (sortie et retour) */
    P+'.bm-bras-img{position:absolute;left:-29px;top:96px;transform:translateY(-50%);height:215px;width:auto;max-width:none;z-index:4;pointer-events:none;filter:drop-shadow(0 2px 3px rgba(0,0,0,.55))}',
    P+'.bm-perso{position:absolute;left:-12px;top:-18px;height:330px;width:auto;max-width:none;z-index:3;display:block;pointer-events:none;filter:drop-shadow(0 2px 3px rgba(0,0,0,.55))}',
    P+'.bm-scene:has(.bm-perso) .bm-cou{display:none}',
    P+'.bm-perso-bas{position:absolute;left:0;top:240px;width:150px;height:74px;z-index:3;display:none;pointer-events:none;background:linear-gradient(180deg,#4a0f19,#3a0b13)}',
    
    P+'.bm-bouche{position:absolute;left:16px;top:71px;width:72px;height:78px;z-index:5;overflow:visible;transform-origin:14% 50%;filter:drop-shadow(0 2px 2px rgba(0,0,0,.6))}',
    P+'.bm-scene[data-source="sucon"] .bm-ver{left:76px;right:calc(var(--cx) + 25px);top:calc(110px - var(--th,44px)/2);z-index:4}',
    /* un seul appareil (Norman, 2026-10-11) : ventouse, tuyau, coude et embout sont du même caoutchouc ; le tuyau est lisse, de l'épaisseur du coude, et le sang le remplit de gauche à droite */
    P+'.bm-scene[data-source="sucon"]{--th:28px}',
    P+'.bm-scene[data-source="sucon"] .bm-ver{border-radius:10px}',
    P+'.bm-scene[data-source="sucon"] .bm-tuyau{-webkit-mask:none!important;mask:none!important;border-radius:10px;border:1.3px solid #000;box-sizing:border-box;background:linear-gradient(180deg,#6b5a26 0,#2e2c14 50%,#101208 100%)}',
    P+'.bm-scene[data-source="sucon"] .bm-tuyau::after{background:linear-gradient(180deg,rgba(255,255,255,.3) 0,rgba(255,255,255,0) 36%,rgba(0,0,0,.28) 100%)!important;border-radius:10px}',
    /* le sang avance dans le ventre comme une barre d'avancement : il remplit toute l'épaisseur du corps, de la tête vers la queue, avec un front brillant */
    P+'.bm-scene[data-source="sucon"] .bm-tuyau{background:linear-gradient(180deg,#4a4020 0,#22210f 50%,#0c0d06 100%)}',
    /* la barre pleine est remplacée par des paquets de sang qui avancent dans le ventre (la barre du moteur reste là, invisible, pour donner l'heure) */
    P+'.bm-scene[data-source="sucon"] .bm-tuyau .bm-sang{opacity:0}',
    P+'.bm-paquets-corps{--bm-k:6;position:absolute;inset:2px 0;z-index:1;overflow:hidden;border-radius:9px;pointer-events:none;display:none}',
    P+'.bm-tuyau.saigne-v1 .bm-paquets-corps,'+P+'.bm-scene.bm-fige .bm-paquets-corps,'+P+'.bm-paquets-corps:has(.bm-paquet.on){display:block}',
    P+'.bm-scene:not(:has(.bm-tuyau.saigne-v1)) .bm-paquet{animation-play-state:paused!important}',
    P+'.bm-paquet{position:absolute;top:0;bottom:0;left:0;width:calc(100% / var(--bm-k,6) - 3px);margin-left:1.5px;border-radius:46%;background:radial-gradient(ellipse at 34% 26%,#ffa3b0 0,#e0203c 46%,#7a0a1c 100%);box-shadow:inset -2px -3px 4px rgba(60,0,10,.55),0 0 5px rgba(255,40,70,.5);display:none}',
    P+'.bm-paquet.on{display:block}',
    /* un seul œil (de profil) ; sans Or elle pleure : paupière triste, regard vers le bas, larmes qui tombent */
    P+'.bm-oeil{position:absolute;left:48px;top:81px;width:22px;height:22px;z-index:6;pointer-events:none;overflow:visible}',
    P+'.bm-oeil .paupiere{transform:translateY(-18px);transition:transform .6s ease-in-out}',
    P+'.bm-oeil .pupille{transition:transform .3s}',
    P+'.bm-scene.bm-pleure .bm-oeil .paupiere{transform:translateY(6.5px)}',
    P+'.bm-scene.bm-pleure .bm-oeil .pupille{transform:translateY(2.4px)}',
    P+'.bm-larme{position:absolute;left:57px;top:98px;width:4px;height:6px;z-index:6;pointer-events:none;border-radius:50% 50% 50% 50%/65% 65% 38% 38%;background:radial-gradient(circle at 38% 30%,#e8f6ff,#7fc4ff 60%,#2f7fc4);border:1px solid #0b3a66;opacity:0;display:none}',
    P+'.bm-larme.l2{left:60px}',
    P+'.bm-larme.l3{left:55px}',
    /* sans Or : la bouche ne pompe plus et le corps ne bouge plus, elle pleure seulement */
    P+'.bm-scene.bm-pleure:has(.bm-tuyau.saigne-v1) .bm-bouche{animation:none}',
    P+'.bm-scene.bm-pleure:has(.bm-tuyau.saigne-v1) .bm-tuyau::before{animation:none}',
    /* Sans énergie, le doigt et le bras glissent hors de la case vers la gauche ; quand on en met, ils reviennent se placer (Norman, 2026-10-11). Propriété « translate » : elle s'ajoute aux animations de coup sans les gêner. */
    P+'.bm-scene[data-source="punaise"] :is(.bm-doigt,.bm-punaise,.bm-goutte-doigt),'+P+'.bm-scene[data-source="papier"] :is(.bm-bras-img,.bm-papier,.bm-coupure,.bm-goutte-doigt){transition:translate .95s cubic-bezier(.25,.8,.3,1)}',
    P+'.bm-scene[data-source="punaise"] .bm-punaise,'+P+'.bm-scene[data-source="papier"] .bm-papier{transition-delay:.2s}',
    P+'.bm-scene[data-source="punaise"].bm-hors :is(.bm-doigt,.bm-punaise,.bm-goutte-doigt),'+P+'.bm-scene[data-source="papier"].bm-hors :is(.bm-bras-img,.bm-papier,.bm-coupure,.bm-goutte-doigt){translate:-340px 0;transition-delay:0s}',
    /* le bras est long (avec sa main à droite) : il sort ENTIÈREMENT de la case, main comprise */
    P+'.bm-scene[data-source="papier"].bm-hors .bm-bras-img{translate:-540px 0}',
    /* ritual du suçon : sans énergie, le personnage (et la marque sur son cou) glisse hors de la case vers la gauche ; la sangsue reste sur son porte-sangsue et dort. Il revient quand on met de l'énergie ; la succion ne reprend qu'une fois qu'il est en place. */
    P+'.bm-scene[data-source="sucon"] :is(.bm-perso,.bm-cou,.bm-perso-bas),'+P+'.bm-scene[data-source="fil"] .bm-fil{transition:translate .95s cubic-bezier(.25,.8,.3,1)}',
    P+'.bm-scene[data-source="sucon"].bm-hors :is(.bm-perso,.bm-cou,.bm-perso-bas),'+P+'.bm-scene[data-source="fil"].bm-hors .bm-fil{translate:-300px 0}',
    '@media (prefers-reduced-motion:reduce){'+P+'.bm-scene :is(.bm-doigt,.bm-punaise,.bm-goutte-doigt,.bm-bras-img,.bm-papier,.bm-coupure,.bm-perso,.bm-cou,.bm-perso-bas,.bm-fil){transition:none}}',
    /* aucune Magie : elle dort (œil fermé, petits zzz qui montent) */
    P+'.bm-scene.bm-dort .bm-oeil .paupiere{transform:translateY(13px)}',
    P+'.bm-zzz{position:absolute;left:66px;top:66px;width:44px;height:50px;z-index:7;pointer-events:none;display:none}',
    P+'.bm-scene.bm-dort .bm-zzz{display:block}',
    P+'.bm-zzz i{position:absolute;left:0;bottom:0;font:400 15px/1 "Bangers","Russo One",Impact,sans-serif;font-style:normal;color:#dff1ff;-webkit-text-stroke:.6px #1b3a5a;text-shadow:0 1px 0 #1b3a5a;opacity:0;animation:bmZzz 3.6s ease-in-out infinite}',
    P+'.bm-zzz i:nth-child(2){animation-delay:1.2s;font-size:19px}',
    P+'.bm-zzz i:nth-child(3){animation-delay:2.4s;font-size:24px}',
    /* une seule larme toutes les 5 secondes */
    P+'.bm-scene.bm-pleure .bm-larme{display:block;animation:bmLarme 5s ease-in infinite}',
    P+'.bm-scene.bm-pleure .bm-larme.l2,'+P+'.bm-scene.bm-pleure .bm-larme.l3{display:none}',
    P+'.bm-coude{position:absolute;display:none;right:calc(var(--cx) - 14px);top:96px;width:48px;height:56px;z-index:6;overflow:visible;filter:drop-shadow(0 2px 2px rgba(0,0,0,.6))}',
    P+'.bm-scene[data-source="sucon"] .bm-coude{display:block}',
    /* bibliothèque du fond : plan le plus reculé ; la perspective suit la distance de la table (rituels 1 et 2 : table très proche, donc fond lointain = plus petit, flou et sombre ; rituels 3 et 4 : table lointaine, fond plus proche = plus grand et net ; autres : intermédiaire) */
    P+'.bm-biblio{position:absolute;left:0;top:0;width:100%;height:100%;z-index:0;pointer-events:none;transform-origin:50% 22%;transform:scale(.9);filter:blur(.9px) brightness(.7)}',
    P+'.bm-scene:is([data-source="punaise"],[data-source="papier"]) .bm-biblio{transform:scale(.74);filter:blur(1.5px) brightness(.55)}',
    P+'.bm-scene:is([data-source="sucon"],[data-source="fil"]) .bm-biblio{transform:scale(1.04);filter:blur(.4px) brightness(.82)}',
    P+'.bm-calice .bm-flamme-b{animation:none}',
    P+'.bm-flamme-b{transform-box:fill-box;transform-origin:50% 100%;animation:bmFlammeB 1.5s ease-in-out infinite}',
    '@keyframes bmFlammeB{0%,100%{transform:scale(1,1);opacity:1}30%{transform:scale(.92,1.12);opacity:.93}60%{transform:scale(1.05,.94);opacity:1}}',
    '@media (prefers-reduced-motion:reduce){'+P+'.bm-flamme-b,'+P+'.bm-saigne-b{animation:none}}',
    P+'.bm-planche{display:none;position:absolute;left:-22px;top:252px;width:335px;height:62px;z-index:4;overflow:visible;pointer-events:none;transform-origin:115px 2px;transform:rotate(3deg);filter:drop-shadow(0 -2px 3px rgba(0,0,0,.45))}',
    P+'.bm-porte{display:none;position:absolute;left:80px;top:122px;width:54px;height:160px;z-index:5;overflow:visible;pointer-events:none;filter:drop-shadow(2px 3px 2px rgba(0,0,0,.6))}',
    P+'.bm-scene[data-source="sucon"] :is(.bm-planche,.bm-porte){display:block}',
    /* rituels 1 et 2 : la MÊME planche, mais beaucoup plus proche de l'objectif (deux fois plus grosse, épaisse, tout en bas) ; le récipient est posé SUR elle, devant, son pied enfoncé dans sa face comme le verre de la sangsue */
    P+'.bm-scene:is([data-source="punaise"],[data-source="papier"]) .bm-planche{display:block;z-index:3;left:-190px;top:215px;width:640px;height:128px;transform-origin:230px 2px;filter:drop-shadow(0 -4px 6px rgba(0,0,0,.6))}',
    /* quatrième rituel : la même planche, au premier plan (devant le personnage), le calice posé devant elle */
    P+'.bm-scene[data-source="fil"] .bm-planche{display:block;z-index:6}',
    P+'.bm-scene[data-source="fil"] .bm-vase{z-index:7}',
    /* plans : personnage au fond (3), planche derrière (4), verre, sangsue et porte-sangsue devant (5) */
    P+'.bm-scene[data-source="sucon"] .bm-vase{z-index:5}',
    P+'.bm-scene[data-source="sucon"] .bm-bec{top:calc(110px + var(--th,44px)/2 + 21px);z-index:7}',
    P+'.bm-trace-sucon{left:8px;top:80px;width:40px;height:62px;z-index:4;border-radius:50%;background:radial-gradient(ellipse,rgba(106,20,87,.85) 0 34%,rgba(169,34,63,.55) 58%,rgba(169,34,63,0) 78%)}',
    P+'.bm-scene:has(.bm-tuyau.saigne-v1) .bm-bouche{animation:bmSuce var(--bm-pas,1.1s) ease-in-out infinite}',
    P+'.bm-nom{font-family:"Permanent Marker","Segoe Print","Bradley Hand","Comic Sans MS",cursive;font-weight:700;fill:#1a1a1a}',
    P+'.bm-mini-boite{width:36px;height:19px}',
    /* gouttes qui tombent du bout du tuyau dans le calice */
    P+'.bm-bec{position:absolute;right:var(--cx);top:calc(70px + var(--th,44px)/2 - 6px);width:0;height:40px;z-index:5;pointer-events:none}',
    P+'.bm-goutte{position:absolute;left:-3px;top:0;width:7px;height:10px;border:1px solid #000;border-radius:50% 50% 50% 50%/65% 65% 38% 38%;background:radial-gradient(circle at 38% 30%,#ff7a8a,#c0152e 55%,#6b0a18);opacity:0;display:none}',
    /* suçon : un filet de sang continu depuis le bout du tuyau jusqu'au sang du récipient, et de grosses gouttes qui s'y ajoutent (plus de sang que les coupures de papier) */
    P+'.bm-bec-flot .bm-goutte{width:8px;height:22px;left:-4px;border-radius:50% 50% 50% 50%/72% 72% 28% 28%}',
    /* filet de sang : invisible au repos ; un jet par niveau terminé (il s'allonge depuis l'embout, tient, puis s'effile par le haut : il ne surgit ni ne disparaît d'un coup) ; niveaux très courts : le jet se répète à leur rythme */
    P+'.bm-filet{position:absolute;left:-1.5px;top:0;width:3px;height:calc(var(--chute,60px) + 5px);border-radius:2px 2px 3px 3px;background:linear-gradient(90deg,#8f1124,#e0304a 45%,#8f1124);box-shadow:0 0 4px rgba(255,40,70,.55);opacity:0;transform-origin:50% 0;transform:scaleY(0);clip-path:inset(0)}',
    P+'.bm-scene.bm-jet .bm-filet{animation:bmJet 1.9s ease-in-out 1 both}',
    P+'.bm-scene.bm-continu:has(.bm-tuyau.saigne-v1) .bm-filet{animation:none!important;opacity:.95!important;transform:scaleY(1)!important;clip-path:inset(0)!important}',
    P+'.bm-scene[data-rythme="boucle"]:has(.bm-tuyau.saigne-v1) .bm-filet{animation:bmJet var(--bm-t,1s) linear infinite}',
    P+'.bm-scene:has(.bm-tuyau.saigne-v1) .bm-goutte{display:block;animation:bmGoutte 1.5s ease-in infinite}',
    /* calice */
    P+'.bm-vase{position:absolute;right:12px;bottom:var(--vb,6px);width:var(--vw,100px);height:var(--vh,130px);z-index:4}',
    /* le contenant suivant attend à gauche, vide ; l'échange les fait glisser ensemble d'un cran puis le plein sort du cadre */
    P+'.bm-vase.bm-suivant{transform:translateX(calc(var(--pas,118px)*-1));z-index:3}',
    P+'.bm-vase.bm-sort{animation:bmConvoi .8s linear forwards}',
    P+'.bm-vase.bm-avance{animation:bmConvoiSuivant .8s linear forwards}',
    P+'.bm-vase.bm-apparait{animation:bmApparait .9s ease-out both}',
    P+'.bm-autel{position:absolute;right:2px;bottom:6px;width:calc(var(--vw,54px) + 20px);height:calc(var(--vb,60px) - 6px);z-index:3;border:2px solid #000;border-radius:5px 5px 0 0;background:linear-gradient(180deg,#6a5a63 0,#44353d 16%,#2b2027 100%);box-shadow:inset 0 3px 0 rgba(255,255,255,.2),inset 0 -10px 14px rgba(0,0,0,.5),0 3px 4px rgba(0,0,0,.6)}',
    P+'.bm-autel::after{content:"";position:absolute;left:50%;top:50%;width:26px;height:26px;margin:-8px 0 0 -13px;background:url("'+RUNE+'") center/contain no-repeat;opacity:.55}',
    P+'.bm-mini-fiole{width:16px;height:27px}',
    P+'.bm-calice{display:block;width:100%;height:100%;overflow:visible;filter:drop-shadow(0 4px 3px rgba(0,0,0,.7))}',
    P+'.bm-liq{transition:transform .9s cubic-bezier(.3,.7,.3,1)}',
    P+'.bm-onde{animation:bmOnde 2.4s linear infinite}',
    P+'.bm-lueur{animation:bmOeil 1.6s ease-in-out infinite}',
    P+'.bm-eta{font-family:var(--f-texte,"Russo One",sans-serif);font-size:14px;line-height:1.35;color:#f0b9c2;margin:4px 0;min-height:2.7em}',
    /* étagère des calices remplis */
    P+'.bm-etagere{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:4px 0 6px;padding:6px 10px;border:2px solid #000;border-radius:10px;background:linear-gradient(180deg,#2a1210,#170a09);box-shadow:inset 0 -5px 0 #4a2a1c,inset 0 0 12px rgba(0,0,0,.6)}',
    P+'.bm-etagere[hidden]{display:none}',
    P+'.bm-etagere-lib{font-family:var(--f-texte,"Russo One",sans-serif);font-size:.8em;color:#d9b3a8;text-transform:uppercase;letter-spacing:.08em}',
    P+'.bm-etagere-rang{display:flex;gap:4px;align-items:flex-end}',
    P+'.bm-mini{width:26px;height:34px;display:block;filter:drop-shadow(0 2px 1px rgba(0,0,0,.7))}',
    P+'.bm-etagere-n{font-family:var(--f-titre,"Bangers",cursive)!important;font-weight:400;font-size:1.4em;color:#ffdce1;text-shadow:0 2px 0 #000,0 0 8px rgba(255,40,70,.6)}',
    P+'.bm-etagere.bm-pop .bm-etagere-rang .bm-mini:last-child,'+P+'.bm-etagere.bm-pop .bm-etagere-n{animation:bmPop .7s ease-out}',
    /* titres de section */
    P+'.soreal-idle-blood-titre-v1{font-family:var(--f-titre,"Bangers",cursive)!important;font-weight:400;letter-spacing:.1em}',
    /* téléphone */
    '@media (max-width:560px){'+P+'.bm-scene{--cx:calc(var(--vw,100px)*.44 + 12px)}'+P+'.bm-scene[data-source="punaise"]{--tx:170px}'+P+'.bm-scene[data-source="punaise"] .bm-vase,'+P+'.bm-scene[data-source="papier"] .bm-vase,'+P+'.bm-scene[data-source="sucon"] .bm-vase{transform-origin:50% 100%}'+P+'.bm-vase{scale:.88;transform-origin:100% 100%}'+P+'.bm-autel{width:calc(var(--vw,54px)*.88 + 20px)}'+P+'.bm-sol{width:180px;height:180px}}',
    /* images clés : toutes bouclent à l'identique (début = fin), mouvement toujours dans le même sens */
    '@keyframes bmTourne{to{transform:rotate(360deg)}}',
    '@keyframes bmFlamme{0%,100%{transform:scale(1,1) rotate(0);opacity:1}25%{transform:scale(.94,1.08) rotate(-3deg);opacity:.92}50%{transform:scale(1.04,.93) rotate(2deg);opacity:1}75%{transform:scale(.96,1.05) rotate(-1.5deg);opacity:.95}}',
    '@keyframes bmAnneaux{from{transform:translateX(0)}to{transform:translateX(12px)}}',
    '@keyframes bmOnde{from{transform:translateX(0)}to{transform:translateX(40px)}}',
    '@keyframes bmPouls{0%,100%{filter:drop-shadow(0 0 1.4px #000) drop-shadow(0 3px 3px rgba(0,0,0,.65)) drop-shadow(0 0 4px rgba(255,30,60,.45))}50%{filter:drop-shadow(0 0 1.4px #000) drop-shadow(0 3px 3px rgba(0,0,0,.65)) drop-shadow(0 0 12px rgba(255,40,70,.95))}}',
    '@keyframes bmOeil{0%,100%{opacity:.55}50%{opacity:1}}',
    /* punaise : plane, s'enfonce, remonte (même période pour le doigt et la perle de sang) */
    '@keyframes bmPique{0%,100%{transform:translateY(-8px)}30%{transform:translateY(-8px)}42%{transform:translateY(29px)}56%{transform:translateY(29px)}76%{transform:translateY(-8px)}}',
    '@keyframes bmDoigt{0%,100%{transform:translateY(0)}30%{transform:translateY(0)}42%{transform:translateY(2px)}56%{transform:translateY(2px)}76%{transform:translateY(0)}}',
    '@keyframes bmGouttedoigt{0%,40%{opacity:0;transform:translate(0,0) scale(.3)}48%{opacity:1;transform:translate(0,0) scale(1)}60%{opacity:1;transform:translate(0,3px) scale(1,1.1)}92%{opacity:1;transform:translate(0,calc(var(--chute,128px) - 10px)) scale(.9,1.28)}100%{opacity:0;transform:translate(0,calc(var(--chute,128px) + 2px)) scale(.7,1.3)}}',
    '@keyframes bmCoupe{0%,100%{transform:translateY(0) rotate(-5deg)}28%{transform:translateY(0) rotate(-5deg)}44%{transform:translateY(84px) rotate(-5deg)}56%{transform:translateY(84px) rotate(-5deg)}76%{transform:translateY(0) rotate(-5deg)}}',
    '@keyframes bmTrait{0%,38%{opacity:0;transform:scaleY(.1)}46%{opacity:1;transform:scaleY(1)}84%{opacity:1;transform:scaleY(1)}100%{opacity:0;transform:scaleY(1)}}',
    '@keyframes bmZzz{0%{opacity:0;transform:translate(0,0) scale(.6)}20%{opacity:1}75%{opacity:1}100%{opacity:0;transform:translate(26px,-34px) scale(1.15)}}',
    '@keyframes bmLarme{0%{opacity:0;transform:translateY(0) scale(.6)}6%{opacity:1;transform:translateY(1px) scale(1)}30%{opacity:.9;transform:translateY(34px) scale(1)}34%{opacity:0;transform:translateY(40px) scale(.8)}100%{opacity:0;transform:translateY(40px) scale(.8)}}',
    '@keyframes bmSuce{0%,100%{transform:scale(1,1)}45%{transform:scale(.88,1.1)}70%{transform:scale(1.03,.98)}}',
    '@keyframes bmJet{0%{opacity:0;transform:scaleY(0);clip-path:inset(0)}16%{opacity:.95;transform:scaleY(1);clip-path:inset(0)}58%{opacity:.95;transform:scaleY(1);clip-path:inset(0)}100%{opacity:.9;transform:scaleY(1);clip-path:inset(100% 0 0 0)}}',
    '@keyframes bmGoutte{0%{opacity:0;transform:translateY(-2px) scale(.5,.3)}15%{opacity:1;transform:translateY(0) scale(1,1)}70%{opacity:1;transform:translateY(calc(var(--chute,30px)*.82)) scale(.95,1.15)}100%{opacity:0;transform:translateY(calc(var(--chute,30px) + 4px)) scale(.85,1.3)}}',
    '@keyframes bmConvoi{0%{transform:translateX(0)}50%{transform:translateX(var(--pas,118px))}100%{transform:translateX(640px)}}',
    '@keyframes bmConvoiSuivant{0%{transform:translateX(calc(var(--pas,118px)*-1))}50%{transform:translateX(0)}100%{transform:translateX(0)}}',
    '@keyframes bmApparait{from{transform:translateX(-640px)}to{transform:translateX(calc(var(--pas,118px)*-1))}}',
    '@keyframes bmPop{0%{transform:scale(.2);opacity:0}60%{transform:scale(1.25);opacity:1}100%{transform:scale(1);opacity:1}}',
    '@media (prefers-reduced-motion:reduce){'+P+'.bm-pentacle-fond,'+P+'.bm-pentacle-sol,'+P+'.bm-flamme,'+P+'.bm-onde,'+P+'.bm-scene:has(.bm-tuyau.saigne-v1) .bm-tuyau::before,'+P+'.bm-ver:has(.saigne-v1),'+P+'.bm-scene:has(.bm-tuyau.saigne-v1) .bm-bouche,'+P+'.bm-scene:has(.bm-tuyau.saigne-v1) .bm-filet,'+P+'.bm-scene .bm-punaise,'+P+'.bm-scene .bm-doigt,'+P+'.bm-scene .bm-papier,'+P+'.bm-scene .bm-coupure,'+P+'.bm-scene .bm-goutte-doigt,'+P+'.bm-lueur,'+P+'.bm-scene:has(.bm-tuyau.saigne-v1) .bm-goutte{animation:none}'+P+'.bm-liq,'+P+'.bm-trace{transition:none}}'
  ].concat(reglesRangs(P)).join('\n');
  document.head.appendChild(st);
}

window.__SOREAL_IDLE_SANG_DECOR_V1__={NIVEAUX_PAR_RECIPIENT:NIVEAUX_PAR_RECIPIENT,css:css,defs:defs,entete:entete,scene:scene,etagere:etagere,majVases:majVases};
})();
