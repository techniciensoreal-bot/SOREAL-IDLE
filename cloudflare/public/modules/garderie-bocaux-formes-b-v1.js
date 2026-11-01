/*
 * SOREAL IDLE — Garderie : récipients des rangs 2 à 6 pour les apparences NYAN (arcenciel), FIBONACCI et MATRIX. Un objet par récipient : pour en refaire un seul, ne toucher qu'à son entrée.
 * Rang 1 = la forme d'avant (pop-tart, fiole ballon, éprouvette). Plus le rang monte, plus le dessin est riche. Aucune animation.
 */
(function(){
  'use strict';
  const R=window.__SOREAL_IDLE_GARDERIE_RANGS_V1__;
  if(!R)return;
  const G=R.aide,D=R.def;
  const clip=function(id,d,inner){return '<clipPath id="'+id+'"><path d="'+d+'"/></clipPath><g clip-path="url(#'+id+')">'+inner+'</g>';};
  const verreVert='linear-gradient(90deg,rgba(0,40,10,.45),rgba(0,30,8,.25) 40%,rgba(0,40,10,.35) 72%,rgba(40,120,60,.45))';

  /* ===== Nyan (arcenciel) ===== */
  const NUAGE='M18 152H82A18 18 0 0 0 96 126A24 24 0 0 0 84 92A22 22 0 0 0 62 62A20 20 0 0 0 36 60A24 24 0 0 0 16 90A24 24 0 0 0 4 128A16 16 0 0 0 18 152Z';
  const E=function(f,k){f.echelle=k;return f;};
  const COEUR='M50 154C10 120 2 90 2 60C2 34 20 20 36 20C44 20 48 26 50 32C52 26 56 20 64 20C80 20 98 34 98 60C98 90 90 120 50 154Z';
  const TETE='M6 40L10 8L36 28Q50 24 64 28L90 8L94 40Q98 60 98 90V130Q98 154 74 154H26Q2 154 2 130V90Q2 60 6 40Z';
  const CUPCAKE='M50 10Q60 10 60 20Q78 22 78 38Q94 42 94 60Q94 74 86 76L78 154H22L14 76Q6 74 6 60Q6 42 22 38Q22 22 40 20Q40 10 50 10Z';
  const ETOILE=G.etoile(50,88,50,25,5,1.4);
  R.skins.arcenciel=[
    E(D('Nuage',NUAGE,
      '<path d="M24 138H76" stroke="#ff9ad5" stroke-width="3" stroke-linecap="round"/><path d="M24 145H76" stroke="#9ad5ff" stroke-width="3" stroke-linecap="round"/>'+G.interieur(NUAGE,.93,'#ffffff',1.2)+G.reflet('M22 96Q26 78 40 70')+G.etincelle(88,60,4,'#fff')+G.etincelle(14,112,3,'#ffe135'),
      '#cfe6ff',70,134,46),1.3),
    D('Étoile filante',ETOILE,
      G.interieur(ETOILE,.82,'#fff3a0',1.4)+G.etincelle(14,24,4,'#ffe135')+G.etincelle(90,70,3.4,'#ff9ad5')+G.etincelle(10,120,3,'#2fb5ff'),
      '#ffe135',64,114,30),
    D('Cupcake',CUPCAKE,
      '<path d="M20 78L26 154M32 78L36 154M44 78V154M56 78V154M68 78L64 154M80 78L74 154" stroke="#c9569a" stroke-width="1.5" fill="none"/><circle cx="50" cy="8" r="6" fill="#ff3b5c" stroke="#8a0a22" stroke-width="1.4"/><path d="M26 52Q50 40 74 52M24 62Q50 50 76 62" stroke="#fff" stroke-width="1.6" fill="none" opacity=".7"/><rect x="30" y="44" width="5" height="2.4" rx="1" fill="#ffe135" transform="rotate(30 32 45)"/><rect x="62" y="38" width="5" height="2.4" rx="1" fill="#4be07b" transform="rotate(-40 64 39)"/><rect x="42" y="30" width="5" height="2.4" rx="1" fill="#2fb5ff" transform="rotate(60 44 31)"/><rect x="76" y="56" width="5" height="2.4" rx="1" fill="#b24bff" transform="rotate(10 78 57)"/>'+G.interieur(CUPCAKE,.92,'#ffd0ea',1.1),
      '#ff9ad5',88,146,38),
    D('Cœur arc-en-ciel',COEUR,
      G.interieur(COEUR,.94,'#ff4a4a',2.2)+G.interieur(COEUR,.88,'#ffa83a',2.2)+G.interieur(COEUR,.82,'#ffe135',2.2)+G.interieur(COEUR,.76,'#4be07b',2.2)+G.interieur(COEUR,.70,'#2fb5ff',2.2)+G.etincelle(14,24,5)+G.etincelle(88,28,4,'#ffe135')+G.etincelle(76,120,3.4),
      '#ff7fc3',64,118,30),
    D('Chat pop-tart',TETE,
      '<path d="M12 12L14 30L28 24Z M88 12L86 30L72 24Z" fill="#ff9ad5" stroke="#b02a78" stroke-width="1"/><circle cx="32" cy="66" r="9" fill="#fff" stroke="#222" stroke-width="2"/><circle cx="68" cy="66" r="9" fill="#fff" stroke="#222" stroke-width="2"/><circle cx="34" cy="68" r="4.600" fill="#222"/><circle cx="70" cy="68" r="4.600" fill="#222"/><circle cx="36" cy="65" r="1.600" fill="#fff"/><circle cx="72" cy="65" r="1.600" fill="#fff"/><ellipse cx="16" cy="86" rx="7" ry="5" fill="#ff7fa8" opacity=".85"/><ellipse cx="84" cy="86" rx="7" ry="5" fill="#ff7fa8" opacity=".85"/><path d="M42 88Q46 94 50 88Q54 94 58 88" stroke="#222" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M2 76L-6 72M2 84L-6 86M98 76L106 72M98 84L106 86" stroke="#222" stroke-width="1.4" fill="none"/>'+
      '<rect x="14" y="40" width="5" height="2.4" rx="1" fill="#ffe135" transform="rotate(30 16 41)"/><rect x="80" y="44" width="5" height="2.4" rx="1" fill="#4be07b" transform="rotate(-40 82 45)"/><rect x="46" y="38" width="5" height="2.4" rx="1" fill="#b24bff"/>'+
      G.interieur(TETE,.93,'#ff9ad5',3)+G.interieur(TETE,.88,'#ffe135',2)+G.interieur(TETE,.83,'#4be07b',2)+G.etincelle(10,106,4)+G.etincelle(92,112,5,'#ffe135')+G.etincelle(50,14,3.4),
      '#e9b27c',100,148,38)
  ];

  /* ===== Fibonacci ===== */
  const OEUF='M50 6C74 6 94 56 94 100C94 134 76 154 50 154C24 154 6 134 6 100C6 56 26 6 50 6Z';
  const PIN='M50 4C72 8 92 40 92 86C92 128 74 154 50 154C26 154 8 128 8 86C8 40 28 8 50 4Z';
  const SOLEIL=G.petales(50,84,42,56,16,6);
  const RECT='M12 6H88Q94 6 94 12V148Q94 154 88 154H12Q6 154 6 148V12Q6 6 12 6Z';
  const grain=(function(){let s='';for(let i=1;i<=64;i+=1){const r=3.3*Math.sqrt(i),a=i*2.39996323;s+='<circle cx="'+(50+r*Math.cos(a)).toFixed(1)+'" cy="'+(84+r*Math.sin(a)).toFixed(1)+'" r="1.3"/>';}return '<g fill="#5a3410" opacity=".9">'+s+'</g>';})();
  const losanges=(function(){let s='';for(let k=-4;k<=8;k+=1){s+='M'+(k*18-20)+' 0L'+(k*18+80)+' 160M'+(k*18+120)+' 0L'+(k*18+20)+' 160';}return '<path d="'+s+'" stroke="#7a5a10" stroke-width="1.4" fill="none" opacity=".7"/>';})();
  R.skins.fibonacci=[
    D('Œuf d’or',OEUF,
      '<path d="M10 84Q50 96 90 84" stroke="#e6b84a" stroke-width="5" fill="none"/><path d="M10 84Q50 96 90 84" stroke="#7a5a10" stroke-width="1.2" fill="none"/>'+G.gem(50,90,3.4,'#37c9b0','#0f5a4a')+G.reflet('M22 62Q26 36 42 20'),
      '#f3d77a',104,148,46),
    D('Nautile',
      'M8 110C0 60 28 10 66 12C92 14 98 44 92 76C88 110 70 154 36 154C18 154 10 138 8 110Z',
      '<path d="M66 88a10 10 0 0 1-10 10a18 18 0 0 1-18-18a30 30 0 0 1 30-30a50 50 0 0 1 50 50" fill="none" stroke="#e6b84a" stroke-width="2" stroke-linecap="round" transform="translate(-6 4)"/><path d="M20 130Q40 100 56 98M16 112Q30 90 46 82M22 146Q50 128 72 100M34 152Q64 140 84 112" stroke="#7a5a10" stroke-width="1.2" fill="none" opacity=".7"/>'+G.reflet('M18 70Q22 44 40 26'),
      '#f3d77a',110,148,40),
    D('Pomme de pin',PIN,
      clip('p',PIN,losanges)+'<path d="M40 12L50 0L60 12" fill="#8a6a2a" stroke="#4a3410" stroke-width="1.2"/>'+G.interieur(PIN,.93,'#f3d77a',1.2),
      '#d9b45a',60,140,44),
    D('Tournesol',SOLEIL,
      '<circle cx="50" cy="84" r="27" fill="none" stroke="#7a5a10" stroke-width="1.6"/>'+grain+G.interieur(SOLEIL,.9,'#ffe58a',1.2)+G.etincelle(14,22,4,'#fff3a0'),
      '#ffd23f',62,106,32),
    D('Rectangle d’or',RECT,
      '<path d="M6 98H94M38 98V154M6 122H38" stroke="#c9a23a" stroke-width="1.4" fill="none"/><path d="M6 10A88 88 0 0 1 94 98A56 56 0 0 0 38 154A32 32 0 0 1 6 122" fill="none" stroke="#ffe58a" stroke-width="3" stroke-linecap="round"/>'+
      '<rect x="3" y="3" width="94" height="151" rx="9" fill="none" stroke="#e6b84a" stroke-width="2.4"/>'+G.interieur(RECT,.92,'#fff3a0',1.2)+G.gem(8,8,4,'#37c9b0','#0f5a4a')+G.gem(92,8,4,'#37c9b0','#0f5a4a')+G.gem(8,148,4,'#ff4a6a','#7a1020')+G.gem(92,148,4,'#ff4a6a','#7a1020')+G.etincelle(70,60,5)+G.etincelle(20,40,3.4),
      '#ffd23f',112,148,34)
  ];

  /* ===== Matrix ===== */
  const CAPS='M50 4Q92 4 92 46V110Q92 154 50 154Q8 154 8 110V46Q8 4 50 4Z';
  const CUBE='M50 6L94 32V128L50 154L6 128V32Z';
  const MONITEUR='M8 34H92Q96 34 96 38V114Q96 118 92 118H62V134H82V154H18V134H38V118H8Q4 118 4 114V38Q4 34 8 34Z';
  const CRISTAL='M50 4L74 22L82 52V112L50 154L18 112V52L26 22Z';
  const COEURM='M24 6H76L94 24V132L76 154H24L6 132V24Z';
  const pluie=function(x,y,n){let s='';for(let i=0;i<n;i+=1)s+='M'+x+' '+(y+i*7)+'h2.6';return '<path d="'+s+'" stroke="#9dffb0" stroke-width="2.2" fill="none"/>';};
  R.skins.matrix=[
    D('Pilule bleue',CAPS,
      '<path d="M8 80H92" stroke="#bfe0ff" stroke-width="2"/><path d="M20 30Q22 18 36 12" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".75"/>'+G.interieur(CAPS,.9,'#bfe0ff',1.2)+G.etincelle(80,110,4,'#fff'),
      '#8ac4ff',34,126,38,'linear-gradient(90deg,rgba(0,20,60,.5),rgba(0,15,45,.3) 40%,rgba(0,20,60,.4) 72%,rgba(40,90,180,.5))'),
    D('Cube de données',CUBE,
      '<path d="M6 32L50 58L94 32M50 58V154" stroke="#7dff9b" stroke-width="1.6" fill="none"/>'+pluie(20,70,8)+pluie(30,60,6)+pluie(74,66,8)+pluie(84,60,6),
      '#8bffa8',70,134,36,verreVert),
    E(D('Moniteur',MONITEUR,
      '<rect x="10" y="40" width="80" height="72" rx="3" fill="none" stroke="#7dff9b" stroke-width="1.6"/><path d="M12 54H88M12 68H88M12 82H88M12 96H88" stroke="rgba(125,255,155,.25)" stroke-width="1.2"/><circle cx="86" cy="115" r="1.6" fill="#7dff9b"/><rect x="24" y="144" width="52" height="4" fill="#7dff9b" opacity=".5"/>',
      '#8bffa8',44,108,46,verreVert),1.15),
    D('Cristal de code',CRISTAL,
      '<path d="M50 4L40 52L50 154M50 4L60 52L50 154M26 22L40 52L18 112M74 22L60 52L82 112M18 52H82" stroke="#7dff9b" stroke-width="1.2" fill="none" opacity=".8"/>'+pluie(30,66,8)+pluie(66,62,8)+G.gem(50,30,3.4,'#7dff9b','#0a5a20')+G.etincelle(88,40,4,'#c8ffd6'),
      '#8bffa8',58,126,30,verreVert),
    D('Cœur de la Matrice',COEURM,
      G.interieur(COEURM,.9,'#c8ffd6',1.4)+'<path d="M6 36H18L24 28M94 36H82L76 28M6 124H18L24 132M94 124H82L76 132M50 6V20M50 154V140" stroke="#9dffb0" stroke-width="1.6" fill="none"/><circle cx="24" cy="28" r="2.6" fill="#7dff9b"/><circle cx="76" cy="28" r="2.6" fill="#7dff9b"/><circle cx="24" cy="132" r="2.6" fill="#7dff9b"/><circle cx="76" cy="132" r="2.6" fill="#7dff9b"/>'+pluie(14,44,6)+pluie(82,44,6)+G.gem(50,18,3.6,'#7dff9b','#0a5a20')+G.gem(50,142,3.6,'#7dff9b','#0a5a20')+G.etincelle(30,70,3.4,'#c8ffd6')+G.etincelle(70,100,3.4,'#c8ffd6'),
      '#b8ffc8',36,120,38,verreVert)
  ];
})();
