/*
 * SOREAL IDLE — Garderie : récipients des rangs 2 à 6 pour les apparences TCHERNOBYL, PIRATE, NOËL et NÉGATIF (nega). Un objet par récipient : pour en refaire un seul, ne toucher qu'à son entrée.
 * Rang 1 = la forme d'avant (fût, bouteille de rhum, boule de Noël, fiole de cristal). Plus le rang monte, plus le dessin est riche. Aucune animation.
 */
(function(){
  'use strict';
  const R=window.__SOREAL_IDLE_GARDERIE_RANGS_V1__;
  if(!R)return;
  const G=R.aide,D=R.def;
  const clip=function(id,d,inner){return '<clipPath id="'+id+'"><path d="'+d+'"/></clipPath><g clip-path="url(#'+id+')">'+inner+'</g>';};
  const n=function(v){return Math.round(v*10)/10;};
  /* trèfle de radioactivité : trois secteurs de 60 degrés + disque central */
  const trefle=function(cx,cy,r0,R0,col,bord){
    let s='';
    for(let k=0;k<3;k+=1){
      const a0=(k*120-30)*Math.PI/180,a1=a0+Math.PI/3;
      const p=function(r,a){return n(cx+r*Math.cos(a))+' '+n(cy+r*Math.sin(a));};
      s+='<path d="M'+p(r0,a0)+'L'+p(R0,a0)+'A'+R0+' '+R0+' 0 0 1 '+p(R0,a1)+'L'+p(r0,a1)+'A'+r0+' '+r0+' 0 0 0 '+p(r0,a0)+'Z" fill="'+col+'" stroke="'+(bord||'none')+'" stroke-width=".8"/>';
    }
    return s+'<circle cx="'+cx+'" cy="'+cy+'" r="'+n(r0*.62)+'" fill="'+col+'"/>';
  };
  const NOIR='#1c1c14';
  const VERRE_RAD='linear-gradient(90deg,rgba(40,50,0,.5),rgba(25,30,0,.3) 40%,rgba(35,45,0,.4) 72%,rgba(110,130,20,.5))';
  const stries=function(y0,y1){let s='';for(let x=-40;x<140;x+=14)s+='M'+x+' '+y1+'L'+(x+14)+' '+y0;return '<path d="'+s+'" stroke="'+NOIR+'" stroke-width="6" fill="none"/>';};

  /* ===== Tchernobyl ===== */
  const FLACON='M38 14H62V34Q96 40 96 70V138Q96 154 80 154H20Q4 154 4 138V70Q4 40 38 34Z';
  const BIDON='M4 28Q4 14 16 14H34V6H48V14H96V146Q96 154 88 154H12Q4 154 4 146Z';
  const TOUR='M10 154C30 118 36 78 34 10H66C64 78 70 118 90 154Z';
  const SPHERE=G.ell(50,80,48,74);
  const DOME='M6 154V70C6 30 28 8 50 8C72 8 94 30 94 70V154Z';
  R.skins.tchernobyl=[
    D('Flacon radioactif',FLACON,
      '<rect x="34" y="3" width="32" height="13" rx="3" fill="#2a2a1c" stroke="#dbe94a" stroke-width="1.4"/><rect x="30" y="38" width="40" height="40" rx="6" fill="#f2d700" stroke="#222" stroke-width="1.4"/>'+trefle(50,58,4.600,15,NOIR)+G.reflet('M12 90V130'),
      '#dbe94a',82,148,44,VERRE_RAD),
    D('Bidon',BIDON,
      '<rect x="30" y="1" width="22" height="9" rx="2" fill="#f2d700" stroke="#222" stroke-width="1.4"/><path d="M58 20H88V42H58Z" fill="none" stroke="#dbe94a" stroke-width="1.8" stroke-linejoin="round"/><path d="M10 50L90 140M90 50L10 140" stroke="rgba(219,233,74,.45)" stroke-width="1.8"/><rect x="4" y="136" width="92" height="12" fill="#f2d700" stroke="#222" stroke-width="1.2"/>'+stries(136,148).replace('stroke-width="6"','stroke-width="4"'),
      '#dbe94a',60,128,44,VERRE_RAD),
    D('Tour de refroidissement',TOUR,
      '<rect x="30" y="4" width="40" height="7" rx="2" fill="#7a7a6a" stroke="#222" stroke-width="1.2"/><path d="M33 40H67M35 70H65M38 100H62M22 130H78" stroke="#222" stroke-width="1.6" opacity=".7"/><path d="M12 150H88" stroke="#f2d700" stroke-width="5"/>'+trefle(50,114,3,9,NOIR)+G.interieur(TOUR,.86,'#f4ff8a',1),
      '#dbe94a',46,140,26,VERRE_RAD),
    D('Cuve sphérique',SPHERE,
      '<path d="M3 56Q50 66 97 56M3 104Q50 114 97 104" stroke="#8a8a2a" stroke-width="3" fill="none"/><rect x="40" y="2" width="20" height="9" rx="2" fill="#2a2a1c" stroke="#dbe94a" stroke-width="1.4"/><circle cx="50" cy="80" r="1" fill="none"/><circle cx="82" cy="80" r="7" fill="#c33" stroke="#222" stroke-width="1.4"/><path d="M82 73V87M75 80H89" stroke="#222" stroke-width="1.6"/>'+trefle(24,80,2.600,8,NOIR)+G.interieur(SPHERE,.9,'#f4ff8a',1.2)+G.reflet('M18 50Q22 30 40 20'),
      '#dbe94a',44,126,40,VERRE_RAD),
    D('Réacteur',DOME,
      clip('rea',DOME,'<rect x="0" y="136" width="100" height="18" fill="#f2d700"/>'+stries(136,154))+
      '<path d="M6 98H94" stroke="#8a8a2a" stroke-width="4"/><path d="M6 100H94" stroke="#f4ff8a" stroke-width="1" opacity=".8"/>'+trefle(50,52,5.600,19,'#f2d700','#222')+'<circle cx="50" cy="52" r="26" fill="none" stroke="#f2d700" stroke-width="2.400"/>'+
      '<circle cx="14" cy="104" r="1.800" fill="#fff"/><circle cx="86" cy="104" r="1.800" fill="#fff"/><circle cx="14" cy="130" r="1.800" fill="#fff"/><circle cx="86" cy="130" r="1.800" fill="#fff"/>'+G.gem(50,18,3.400,'#ff7a1a','#7a2a00')+G.gem(22,34,2.600,'#ff7a1a','#7a2a00')+G.gem(78,34,2.600,'#ff7a1a','#7a2a00')+G.interieur(DOME,.9,'#f4ff8a',1.4)+G.etincelle(90,22,4,'#f4ff8a')+G.etincelle(10,78,3,'#f4ff8a'),
      '#f2ff6a',104,134,40,VERRE_RAD)
  ];

  /* ===== Pirate ===== */
  const GOURDE='M38 12H62V28Q92 30 94 58V138Q94 154 78 154H22Q6 154 6 138V58Q8 30 38 28Z';
  const TONNEAU='M24 10H76Q96 40 96 82Q96 124 76 154H24Q4 124 4 82Q4 40 24 10Z';
  const COFFRE='M4 154V40Q4 14 30 14H70Q96 14 96 40V154Z';
  const TETE='M50 8C24 8 8 26 8 52C8 68 16 80 28 86V128Q28 154 50 154Q72 154 72 128V86C84 80 92 68 92 52C92 26 76 8 50 8Z';
  const BOUTEILLE='M42 10H58V44Q62 54 78 62Q94 74 94 100V138Q94 154 78 154H22Q6 154 6 138V100Q6 74 22 62Q38 54 42 44Z';
  R.skins.pirate=[
    D('Gourde',GOURDE,
      '<rect x="37" y="3" width="26" height="12" rx="3" fill="#c99a5a" stroke="#6b4a1e" stroke-width="1.5"/><path d="M62 9H80Q86 9 86 22V60" stroke="#6b3a14" stroke-width="3.2" fill="none"/>'+G.interieur(GOURDE,.9,'#e1c283',1.2).replace('opacity=".8"','stroke-dasharray="4 3" opacity=".9"')+G.reflet('M14 70V120'),
      '#ffdca0',66,148,46),
    D('Tonneau',TONNEAU,
      '<path d="M8 32Q50 44 92 32M4 62Q50 72 96 62M4 102Q50 112 96 102M8 132Q50 144 92 132" stroke="#3a2a1a" stroke-width="5" fill="none"/><path d="M8 32Q50 44 92 32M4 62Q50 72 96 62M4 102Q50 112 96 102M8 132Q50 144 92 132" stroke="#c0b090" stroke-width="1.2" fill="none"/><path d="M36 12Q30 80 36 152M50 12V154M64 12Q70 80 64 152" stroke="rgba(60,36,10,.55)" stroke-width="1.2" fill="none"/>',
      '#e1b070',76,128,42),
    D('Coffre de pirate',COFFRE,
      '<path d="M4 50H96" stroke="#2a1a0a" stroke-width="2.400"/><path d="M4 30H96M4 70H96M4 90H96M4 110H96M4 130H96" stroke="rgba(60,36,10,.5)" stroke-width="1.100"/><rect x="14" y="14" width="10" height="140" fill="rgba(60,60,60,.55)" stroke="#222" stroke-width="1.200"/><rect x="76" y="14" width="10" height="140" fill="rgba(60,60,60,.55)" stroke="#222" stroke-width="1.200"/><rect x="40" y="42" width="20" height="20" rx="4" fill="#d9b44a" stroke="#5a3a0a" stroke-width="1.500"/><circle cx="50" cy="50" r="3" fill="#2a1a0a"/><path d="M50 52V58" stroke="#2a1a0a" stroke-width="2.400"/><circle cx="9" cy="24" r="1.600" fill="#bbb"/><circle cx="91" cy="24" r="1.600" fill="#bbb"/><circle cx="9" cy="146" r="1.600" fill="#bbb"/><circle cx="91" cy="146" r="1.600" fill="#bbb"/>',
      '#ffdca0',74,148,40),
    D('Tête de mort',TETE,
      '<path d="M8 38Q50 24 92 38L90 56Q50 42 10 56Z" fill="#b3202a" stroke="#6b0f16" stroke-width="1.400"/><path d="M92 40L100 46L94 52M92 44L98 38" stroke="#b3202a" stroke-width="3" fill="none"/><circle cx="22" cy="46" r="1.400" fill="#fff"/><circle cx="48" cy="40" r="1.400" fill="#fff"/><circle cx="74" cy="44" r="1.400" fill="#fff"/>'+
      '<ellipse cx="34" cy="70" rx="9" ry="10" fill="#1a1008" stroke="#e8d9b0" stroke-width="1.800"/><path d="M60 62H82V78H60Z" fill="#1a1008" stroke="#e8d9b0" stroke-width="1.800"/><path d="M60 62L82 78" stroke="#e8d9b0" stroke-width="1.200"/><path d="M50 82L45 94H55Z" fill="#1a1008" stroke="#e8d9b0" stroke-width="1.400"/><path d="M34 132H66M42 128V152M50 128V154M58 128V152" stroke="#e8d9b0" stroke-width="1.500" fill="none"/>'+
      G.gem(90,100,2.6,'#ffd23f','#6a4a00')+G.interieur(TETE,.92,'#fff3d0',1.1),
      '#f2e4c0',92,126,30),
    D('Voilier en bouteille',BOUTEILLE,
      '<rect x="39" y="2" width="22" height="13" rx="3" fill="#c99a5a" stroke="#6b4a1e" stroke-width="1.500"/><path d="M38 14H62V24Q56 33 52 26Q50 34 46 26Q42 31 38 24Z" fill="#b3202a" stroke="#6b0f16" stroke-width="1.200"/>'+
      '<path d="M50 62V102" stroke="#4a2c0c" stroke-width="2"/><path d="M50 64L72 94H50Z M48 68L30 94H48Z" fill="#fff3d0" stroke="#6b5a3a" stroke-width="1.200"/><path d="M26 98H76L70 108H32Z" fill="#7a4a1c" stroke="#3a2008" stroke-width="1.300"/><path d="M50 62L58 65L50 68Z" fill="#b3202a"/><path d="M14 112Q22 106 30 112T46 112T62 112T78 112T90 112" stroke="#e8f4ff" stroke-width="2" fill="none" opacity=".8"/>'+
      '<path d="M40 46H60M40 52H60" stroke="#e1c283" stroke-width="2.800" fill="none"/>'+G.gem(50,36,3,'#b3202a','#6b0f16')+G.interieur(BOUTEILLE,.9,'#fff3d0',1.2)+G.etincelle(84,84,4)+G.etincelle(14,128,3),
      '#ffdca0',116,148,26)
  ];

  /* ===== Noël ===== */
  const CHAUSSETTE='M26 12H68V92Q70 102 82 106Q98 114 98 134Q98 154 78 154H40Q18 154 20 130Q24 114 26 98Z';
  /* feuille de houx (pointue, nervure) et baie : parties vertes soignées */
  const feuille=function(x,y,rot){return '<g transform="translate('+x+' '+y+') rotate('+rot+')"><path d="M0 0Q3 -7 8 -5Q10 -9 14 -6Q17 -3 20 0Q17 3 14 6Q10 9 8 5Q3 7 0 0Z" fill="#2f8a45" stroke="#12501f" stroke-width="1" stroke-linejoin="round"/><path d="M1 0H18" stroke="#8be0a0" stroke-width=".9"/></g>';};
  const baie=function(x,y,r){return '<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="#d4202c" stroke="#7a0a14" stroke-width="1"/><circle cx="'+(x-r*.35)+'" cy="'+(y-r*.35)+'" r="'+(r*.3)+'" fill="#fff" opacity=".8"/>';};
  const SAPIN='M50 4L74 40H62L84 78H70L94 122H58V154H42V122H6L30 78H16L38 40H26Z';
  const CADEAU='M3 22H97V46H92V154H8V46H3Z';
  const BONHOMME=G.ell(50,36,20,20)+G.ell(50,82,28,28)+G.ell(50,124,30,30);
  const GLOBE=G.ell(50,76,48,66)+'M14 154L22 138H78L86 154Z';
  R.skins.noel=[
    D('Chaussette de Noël',CHAUSSETTE,
      '<path d="M26 44L68 34M26 58L68 48" stroke="rgba(255,255,255,.5)" stroke-width="3" fill="none"/><path d="M20 130Q22 114 28 106L44 112Q48 126 44 142L42 154H40Q18 154 20 130Z" fill="#f6ead6" stroke="#b89a7a" stroke-width="1.3" stroke-linejoin="round"/><path d="M84 107Q98 115 98 134Q98 150 88 154H72Q78 140 78 128Q78 114 84 107Z" fill="#f6ead6" stroke="#b89a7a" stroke-width="1.3" stroke-linejoin="round"/><path d="M26 116L40 120M30 128L42 132M28 140L40 144" stroke="#b89a7a" stroke-width="1" fill="none"/>'+
      '<rect x="20" y="3" width="54" height="22" rx="10" fill="#fff" stroke="#c9a0a0" stroke-width="1.4"/><circle cx="30" cy="9" r="2" fill="#e8d4d4"/><circle cx="46" cy="7" r="2" fill="#e8d4d4"/><circle cx="62" cy="9" r="2" fill="#e8d4d4"/><path d="M60 4Q66 -2 70 5" stroke="#d4202c" stroke-width="2.4" fill="none" stroke-linecap="round"/>'+
      feuille(32,31,-20)+feuille(62,31,200)+baie(47,30,3.4)+baie(41,33,2.8)+baie(53,33,2.8),
      '#ffb3b3',44,100,32),
    D('Sapin',SAPIN,
      '<path d="M32 46Q52 56 70 44M22 86Q52 98 80 84M14 124Q52 138 88 122" stroke="#ffd23f" stroke-width="2" fill="none"/><path d="M38 40Q44 46 50 40Q56 46 62 40M30 78Q38 86 46 78Q54 86 62 78Q70 86 70 78M18 120Q30 128 40 120Q52 128 60 120Q72 128 82 120" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".85"/>'+
      '<circle cx="40" cy="58" r="3.400" fill="#ff3b3b" stroke="#7a1010" stroke-width=".8"/><circle cx="62" cy="62" r="3.400" fill="#4aa3ff" stroke="#1a4a8a" stroke-width=".8"/><circle cx="30" cy="100" r="3.800" fill="#4aa3ff" stroke="#1a4a8a" stroke-width=".8"/><circle cx="68" cy="104" r="3.800" fill="#ff3b3b" stroke="#7a1010" stroke-width=".8"/><circle cx="18" cy="134" r="3.800" fill="#ffd23f" stroke="#8a5d00" stroke-width=".8"/><circle cx="80" cy="136" r="3.800" fill="#ffd23f" stroke="#8a5d00" stroke-width=".8"/>'+
      '<path d="M50 4L74 40H62L84 78H70L94 122H58V154H42V122H6L30 78H16L38 40H26Z" transform="translate(50 78) scale(.9) translate(-50 -78)" fill="none" stroke="#c9f0c9" stroke-width="1" vector-effect="non-scaling-stroke" opacity=".6"/><rect x="40" y="128" width="20" height="26" fill="#6b3a14" stroke="#3a1a08" stroke-width="1.200"/><path d="M45 130V152M52 130V152" stroke="#3a1a08" stroke-width=".8"/><path d="M50 -1L52.600 5L59 5.400L54 9.400L55.800 15.800L50 12.400L44.200 15.800L46 9.400L41 5.400L47.400 5Z" fill="#ffe27a" stroke="#8a5d00" stroke-width=".8"/>',
      '#9fe2a0',66,120,34),
    D('Cadeau',CADEAU,
      '<rect x="43" y="22" width="14" height="132" fill="#ffd23f" stroke="#8a5d00" stroke-width="1.200"/><rect x="3" y="30" width="94" height="8" fill="#ffd23f" stroke="#8a5d00" stroke-width="1.200"/><path d="M50 22C30 22 22 6 34 4C44 4 50 14 50 22C50 14 56 4 66 4C78 6 70 22 50 22Z" fill="#ffd23f" stroke="#8a5d00" stroke-width="1.400"/><circle cx="50" cy="20" r="4" fill="#f0a900" stroke="#8a5d00" stroke-width="1"/>'+'<path d="M14 62L20 70M72 90L78 98M18 120L24 128M78 130L84 138" stroke="rgba(255,255,255,.55)" stroke-width="2.600" stroke-linecap="round"/>',
      '#ffb3b3',60,148,32),
    D('Bonhomme de neige',BONHOMME,
      '<rect x="30" y="8" width="40" height="7" rx="2" fill="#1c1c1c" stroke="#555" stroke-width="1"/><rect x="38" y="-6" width="24" height="16" rx="3" fill="#1c1c1c"/><rect x="38" y="4" width="24" height="3.500" fill="#b3202a"/><circle cx="43" cy="32" r="2.400" fill="#1c1c1c"/><circle cx="57" cy="32" r="2.400" fill="#1c1c1c"/><path d="M50 38L66 42L50 44Z" fill="#ff8a1a" stroke="#a04a00" stroke-width="1"/><path d="M32 56Q50 66 68 56L70 64Q50 74 30 64Z" fill="#b3202a" stroke="#6b0f16" stroke-width="1.200"/><circle cx="50" cy="86" r="2.800" fill="#1c1c1c"/><circle cx="50" cy="98" r="2.800" fill="#1c1c1c"/><path d="M22 76L6 68M78 76L94 68" stroke="#6b3a14" stroke-width="3" stroke-linecap="round"/>'+'<path d="M70 88A28 28 0 0 1 50 110M78 140A30 30 0 0 1 50 154M64 50A20 20 0 0 1 50 56" stroke="rgba(60,90,140,.45)" stroke-width="3" fill="none" stroke-linecap="round"/>'+G.interieur(BONHOMME,.94,'#e8f4ff',1),
      '#6f88ad',104,150,28),
    D('Globe à neige',GLOBE,
      '<rect x="14" y="138" width="72" height="16" rx="4" fill="#d9a441" stroke="#6b4a10" stroke-width="1.600"/><path d="M10 146H90" stroke="#f8e29a" stroke-width="1.500"/>'+G.gem(50,146,3.400,'#ff3b3b','#7a1010')+G.gem(28,146,2.400,'#ff9ac0','#7a1040')+G.gem(72,146,2.400,'#ff9ac0','#7a1040')+
      '<path d="M50 96L58 110H54L63 123H57L67 134H33L43 123H37L46 110H42Z" fill="#2f8a45" stroke="#12501f" stroke-width="1" stroke-linejoin="round"/><path d="M46 110H54M43 123H57" stroke="#8be0a0" stroke-width=".8"/><path d="M50 96L53 103L47 103Z" fill="#fff"/><rect x="47.500" y="134" width="5" height="4" fill="#6b3a14"/><path d="M22 136Q50 122 78 136V140H22Z" fill="#fff" opacity=".95"/><circle cx="34" cy="128" r="2.4" fill="#d4202c"/><circle cx="70" cy="130" r="2.4" fill="#d4202c"/>'+G.etincelle(34,24,4)+G.etincelle(72,64,4)+G.etincelle(24,70,3)+feuille(10,132,-30)+feuille(76,132,210)+baie(20,134,2.6)+baie(82,134,2.6)+'<path d="M12 154Q50 164 88 154" stroke="#ffe27a" stroke-width="1.6" fill="none"/><path d="M38 100Q50 94 62 100" stroke="#fff" stroke-width="1.4" fill="none" opacity=".7"/>'+G.interieur(G.ell(50,76,48,66),.92,'#e8f4ff',1.200)+G.reflet('M18 56Q20 34 36 20'),
      '#ffd6d6',50,92,34)
  ];

  /* ===== Négatif (nega) ===== */
  const VERRE_N='linear-gradient(90deg,rgba(30,10,60,.6),rgba(15,5,35,.4) 40%,rgba(25,10,50,.5) 72%,rgba(80,40,140,.55))';
  const GOUTTE='M50 6C50 6 94 70 94 108C94 138 74 154 50 154C26 154 6 138 6 108C6 70 50 6 50 6Z';
  const LUNE='M70 8C20 16 4 52 4 80C4 112 20 144 70 152C40 130 36 100 38 80C40 56 46 30 70 8Z';
  const OEIL='M50 4C86 40 96 70 96 80C96 90 86 120 50 154C14 120 4 90 4 80C4 70 14 40 50 4Z';
  const SHARD='M52 4L66 40L74 24L82 56L96 130L66 154H30L4 128L18 70L30 50L40 30Z';
  const ARCHE='M50 6C70 24 92 42 92 72V148Q92 154 86 154H14Q8 154 8 148V72C8 42 30 24 50 6Z';
  R.skins.nega=[
    D('Goutte du vide',GOUTTE,
      G.reflet('M22 110Q22 90 34 74')+G.etincelle(72,64,4,'#d9c2ff')+G.interieur(GOUTTE,.9,'#b48cff',1),
      '#b48cff',84,144,48,VERRE_N),
    D('Croissant de lune',LUNE,
      G.interieur(LUNE,.88,'#d9c2ff',1.200)+G.etincelle(76,50,5,'#d9c2ff')+G.etincelle(84,100,4,'#b48cff')+G.etincelle(70,128,3,'#d9c2ff')+G.reflet('M14 90Q16 60 34 38'),
      '#c9a6ff',70,134,24,VERRE_N),
    D('Œil du vide',OEIL,
      '<circle cx="50" cy="80" r="26" fill="none" stroke="#c9a6ff" stroke-width="2.600"/><circle cx="50" cy="80" r="19" fill="none" stroke="rgba(190,140,255,.6)" stroke-width="1.400"/><path d="M50 62C56 72 56 88 50 98C44 88 44 72 50 62Z" fill="none" stroke="#ff5af0" stroke-width="1.600"/><path d="M50 6V16M50 144V154" stroke="#b48cff" stroke-width="1.400"/>'+G.interieur(OEIL,.9,'#b48cff',1),
      '#b48cff',62,98,28,VERRE_N),
    D('Cristal sombre',SHARD,
      '<path d="M52 4L50 70L30 154M66 40L50 70L96 130M74 24L66 40M82 56L66 40M40 30L50 70L18 70M30 50L18 70L4 128M50 70L66 154" stroke="rgba(190,140,255,.7)" stroke-width="1.200" fill="none"/>'+G.gem(52,28,3.600,'#ff5af0','#5a0a60')+G.gem(34,110,2.600,'#7fd0ff','#1a4a8a')+G.etincelle(14,40,4,'#d9c2ff')+G.etincelle(86,90,4,'#d9c2ff')+G.interieur(SHARD,.9,'#d9c2ff',1.100),
      '#c9a6ff',76,130,30,VERRE_N),
    D('Reliquaire lunaire',ARCHE,
      '<path d="M50 -2L56 6L50 14L44 6Z" fill="#f0c15a" stroke="#6b4a10" stroke-width="1"/>'+G.interieur(ARCHE,.9,'#f0c15a',2)+G.interieur(ARCHE,.8,'#d9c2ff',1.200)+
      '<path d="M56 24A14 14 0 1 0 56 54A11 11 0 1 1 56 24Z" fill="#f0e2a8" stroke="#8a6a20" stroke-width="1.200"/>'+G.etincelle(30,40,4,'#f0e2a8')+G.etincelle(76,40,3,'#f0e2a8')+G.etincelle(72,62,3,'#d9c2ff')+
      '<rect x="6" y="138" width="88" height="16" rx="4" fill="#d9a441" stroke="#6b4a10" stroke-width="1.600"/>'+G.gem(50,146,3.800,'#ff5af0','#5a0a60')+G.gem(26,146,2.800,'#7fd0ff','#1a4a8a')+G.gem(74,146,2.800,'#7fd0ff','#1a4a8a')+G.gem(10,76,2.800,'#ff5af0','#5a0a60')+G.gem(90,76,2.800,'#ff5af0','#5a0a60')+G.reflet('M20 100V124'),
      '#d7b8ff',74,134,32,VERRE_N)
  ];
})();
