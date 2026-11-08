/*
 * SOREAL IDLE — les savants fous des Labos (Norman, 2026-11-08 : « transformer les mineurs d'or en Labos : des savants fous qui concoctent des potions pour qu'on gagne l'effet ; style cartoon »).
 *
 * Une scène de labo = UN SVG (316 x 268) en couches, de l'arrière vers l'avant : le décor (l'image de décor propre au labo), le SAVANT FOU (dessiné ici, articulé, animé), l'établi, le LIQUIDE de chaque ustensile (dessiné ici, découpé dans la forme réelle
 * du verre), puis le VERRE transparent par-dessus. Les images (décor, établi, flacon, tubes, bécher) viennent de cloudflare/public/img/mineurs/labos/ ; les formes intérieures des verres ont été MESURÉES sur ces images (canal alpha).
 * Le savant est un squelette de groupes (corps, tête de trois quarts, deux jambes qui pivotent aux hanches, deux bras en deux segments, fiole qui bascule, cheveux, blouse, sourcils, pupilles, bouche) : chaque articulation tourne autour de son vrai pivot.
 * Il se DÉPLACE dans son labo (cycle de 16 s) : il agite sa fiole à gauche, marche derrière l'établi, verse sa potion dans le flacon, les tubes puis le bécher (le niveau monte, un filet de potion coule), et revient en se retournant. Les angles de ses bras viennent d'une cinématique inverse (deux segments) : la fiole penchée se retrouve juste au-dessus de chaque verre.
 * Boucles parfaites (AGENTS.md règle n°3) : chaque animation commence et finit à la même valeur ; la chorégraphie a la période --P (16 s), les petits gestes la période --T (2,4 s) ; seuls transform et opacity sont animés ; mouvement réduit : tout est immobile.
 * Expose window.__SOREAL_IDLE_LABOS_SAVANTS_V1__ = { scene(id, images, travaille), css(), labos }.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_LABOS_SAVANTS_V1__)return;

  var L=316,H=268;
  /* UNE image de décor par labo (Norman, 2026-11-08 : douze images générées à part, 1536 x 1024, recadrées en 1002 x 850 puis réduites à 632 x 536 = deux fois la scène ; le mur du fond est à 54 % de la hauteur, le sol dallé en dessous). CELLULES : fichier de chaque labo dans img/mineurs/labos/. */
  var CELLULES={drop:'decor-drop.webp',wandoos:'decor-wandoos.webp',stats:'decor-stats.webp',adventure:'decor-adventure.webp',energyNgu:'decor-energyNgu.webp',magicNgu:'decor-magicNgu.webp',energyBeard:'decor-energyBeard.webp',magicBeard:'decor-magicBeard.webp',pp:'decor-pp.webp',daycare:'decor-daycare.webp',blood:'decor-blood.webp',experience:'decor-experience.webp'};
  /* pièces posées sur l'établi : taille de l'image (px), largeur affichée, centre et base (px de la scène) */
  var PIECES={
    etabli:{w0:603,h0:321,w:150,cx:225,base:243},
    flacon:{w0:274,h0:378,w:46,cx:190,base:175},
    tubes:{w0:265,h0:325,w:44,cx:232,base:176},
    becher:{w0:222,h0:324,w:24,cx:273,base:175}
  };
  /* intérieur de chaque verre, en pixels de SON image (mesuré sur le canal alpha) */
  var INTERIEURS={
    flacon:{p:'M104 33L100 46L100 59L100 72L101 85L101 98L101 111L100 124L95 137L89 150L83 163L77 176L71 189L66 202L60 215L54 228L48 241L43 254L38 267L32 280L27 293L23 306L20 319L23 332L245 332L246 319L243 306L238 293L233 280L228 267L223 254L217 241L212 228L207 215L201 202L196 189L191 176L185 163L179 150L174 137L170 124L170 111L170 98L170 85L170 72L170 59L170 46L107 33Z',x0:20,x1:245,y0:33,y1:339},
    becher:{p:'M12 30L20 42L21 54L21 66L21 78L21 90L21 102L21 114L21 126L21 138L21 150L21 162L21 174L21 186L21 198L21 210L21 222L21 234L21 246L21 258L21 270L21 282L22 294L30 306L107 318L132 318L204 306L211 294L211 282L211 270L211 258L211 246L211 234L211 222L211 210L211 198L211 186L211 174L211 162L211 150L211 138L211 126L211 114L211 102L211 90L211 78L211 66L211 54L211 42L15 30Z',x0:12,x1:211,y0:30,y1:318},
    tubeD:{p:'M168 23L169 31L169 39L169 47L169 55L169 63L169 71L169 79L169 87L169 95L169 103L168 111L169 119L169 127L169 135L169 143L169 151L169 159L169 167L169 175L169 183L169 191L169 199L169 207L169 215L212 215L212 207L212 199L212 191L212 183L212 175L212 167L212 159L212 151L212 143L212 135L212 127L212 119L212 111L212 103L212 95L212 87L212 79L212 71L212 63L212 55L212 47L212 39L212 31L212 23Z',x0:168,x1:211,y0:23,y1:220},
    tubeG:{p:'M56 23L56 31L56 39L56 47L56 55L56 63L56 71L56 79L56 87L56 95L56 103L56 111L56 119L56 127L56 135L56 143L56 151L56 159L56 167L56 175L56 183L56 191L56 199L56 207L56 215L99 215L99 207L99 199L99 191L99 183L99 175L99 167L99 159L99 151L99 143L99 135L99 127L99 119L99 111L99 103L99 95L99 87L99 79L99 71L99 63L99 55L99 47L99 39L99 31L99 23Z',x0:56,x1:98,y0:23,y1:220}
  };
  /* un labo = son nom, sa potion (nom, couleurs, forme des bulles) et son savant fou */
  var LABOS={
    drop:{nom:'Labo de la chance',potion:'Élixir de fortune',c:['#ffe27a','#e0a21a'],forme:'rond',
      s:{peau:'#f6c9a0',cheveux:'#f07a1c',coupe:'pique',blouse:'#f4f1e6',lunettes:'#e0a21a',chapeau:null,barbe:null}},
    wandoos:{nom:'Labo de Wandoos',potion:'Sérum rétro-pixel',c:['#7dffb8','#1fb86a'],forme:'carre',
      s:{peau:'#f1c7a2',cheveux:'#3a6ad8',coupe:'frise',blouse:'#d6efe9',lunettes:'#2fd08a',chapeau:null,barbe:null}},
    stats:{nom:'Labo des statistiques',potion:'Philtre de vigueur',c:['#ff7a6a','#d02a2a'],forme:'rond',
      s:{peau:'#eebd96',cheveux:'#26262e',coupe:'pique',blouse:'#efe6d6',lunettes:'#d83a3a',chapeau:'bandeau',barbe:null}},
    adventure:{nom:'Labo d’Aventure',potion:'Potion d’audace',c:['#ffc470','#c9701a'],forme:'rond',
      s:{peau:'#e8b58c',cheveux:'#9a9aa2',coupe:'frise',blouse:'#d9c79a',lunettes:'#8a5a2a',chapeau:'explorateur',barbe:null}},
    energyNgu:{nom:'Labo des NGU d’énergie',potion:'Fiole d’éclair',c:['#9bff7a','#27c43a'],forme:'eclair',
      s:{peau:'#f6cfa6',cheveux:'#f4ea5a',coupe:'pique',blouse:'#f1f4f4',lunettes:'#27c43a',chapeau:null,barbe:null}},
    magicNgu:{nom:'Labo des NGU de magie',potion:'Brouet arcanique',c:['#c89aff','#7a38d8'],forme:'etoile',
      s:{peau:'#efc8ac',cheveux:'#d8cdfa',coupe:'frise',blouse:'#ddd4f4',lunettes:'#9a5cff',chapeau:'magicien',barbe:null}},
    energyBeard:{nom:'Labo de la barbe d’énergie',potion:'Tonique de barbe dorée',c:['#e6ee6a','#9ac21c'],forme:'eclair',
      s:{peau:'#f2c7a0',cheveux:'#e0b020',coupe:'frise',blouse:'#eef2e4',lunettes:'#9ac21c',chapeau:null,barbe:'#e8b822'}},
    magicBeard:{nom:'Labo de la barbe de magie',potion:'Lotion de barbe mystique',c:['#d6a4ff','#8a3ad8'],forme:'etoile',
      s:{peau:'#f0c9ac',cheveux:'#8a4ad0',coupe:'frise',blouse:'#e6def6',lunettes:'#b070ff',chapeau:null,barbe:'#9a52e0'}},
    pp:{nom:'Labo des étoiles',potion:'Essence d’étoile',c:['#fff1a6','#f0b81c'],forme:'etoile',
      s:{peau:'#f4cba6',cheveux:'#f6f6f6',coupe:'pique',blouse:'#e8e6f6',lunettes:'#f0b81c',chapeau:'couronne',barbe:null}},
    daycare:{nom:'Labo de la garderie',potion:'Lait de croissance',c:['#fffaf0','#f2c9d8'],forme:'rond',
      s:{peau:'#f6cfae',cheveux:'#d8a070',coupe:'frise',blouse:'#f9d6e4',lunettes:'#f08ab4',chapeau:'bonnet',barbe:null}},
    blood:{nom:'Labo du sang',potion:'Sang d’alambic',c:['#ff5a6a','#b0102a'],forme:'goutte',
      s:{peau:'#e9d0c4',cheveux:'#1a1a22',coupe:'pique',blouse:'#4a3040',lunettes:'#d82a3a',chapeau:'capuche',barbe:null}},
    experience:{nom:'Labo de l’EXP',potion:'Concentré de savoir',c:['#8ee0ff','#2f8ad8'],forme:'rond',
      s:{peau:'#f1c7a2',cheveux:'#5a4a3a',coupe:'frise',blouse:'#e4edf8',lunettes:'#3a6ad8',chapeau:'mortier',barbe:null}}
  };

  var CT=' stroke="#1b1008" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"';
  function f1(n){return Math.round(n*10)/10;}
  /* un segment épais (bras, jambe) : contour noir puis couleur */
  function seg(x1,y1,x2,y2,w,c){return '<path d="M'+x1+' '+y1+'L'+x2+' '+y2+'" stroke="#1b1008" stroke-width="'+(w+2.6)+'" stroke-linecap="round" fill="none"/><path d="M'+x1+' '+y1+'L'+x2+' '+y2+'" stroke="'+c+'" stroke-width="'+w+'" stroke-linecap="round" fill="none"/>';}
  function ombre(c){return c;}

  /* petite bulle / éclat dans la potion, selon la forme du labo (coordonnées locales) */
  function forme(fm,x,y,r,c){
    if(fm==='etoile')return '<path d="M'+x+' '+f1(y-r*1.5)+'l'+f1(r*.45)+' '+f1(r*1.05)+' '+f1(r*1.1)+' '+f1(r*.1)+'-'+f1(r*.85)+' '+f1(r*.75)+' '+f1(r*.3)+' '+f1(r*1.1)+'-'+f1(r*1.0)+'-'+f1(r*.6)+'-'+f1(r*1.0)+' '+f1(r*.6)+' '+f1(r*.3)+'-'+f1(r*1.1)+'-'+f1(r*.85)+'-'+f1(r*.75)+' '+f1(r*1.1)+'-'+f1(r*.1)+'z" fill="'+c+'" stroke="#1b1008" stroke-width="'+f1(r*.35)+'"/>';
    if(fm==='eclair')return '<path d="M'+f1(x+r*.4)+' '+f1(y-r*1.6)+'l'+f1(-r*1.1)+' '+f1(r*1.6)+' '+f1(r*.9)+' 0-'+f1(r*.7)+' '+f1(r*1.7)+' '+f1(r*1.5)+'-'+f1(r*2.1)+'-'+f1(r*.9)+' 0z" fill="'+c+'" stroke="#1b1008" stroke-width="'+f1(r*.3)+'"/>';
    if(fm==='goutte')return '<path d="M'+x+' '+f1(y-r*1.5)+'c'+f1(r*.9)+' '+f1(r*1.1)+' '+f1(r*1.3)+' '+f1(r*1.6)+' '+f1(r*1.3)+' '+f1(r*2.3)+'a'+f1(r*1.3)+' '+f1(r*1.3)+' 0 0 1-'+f1(r*2.6)+' 0c0-'+f1(r*.7)+' '+f1(r*.4)+'-'+f1(r*1.2)+' '+f1(r*1.3)+'-'+f1(r*2.3)+'z" fill="'+c+'" stroke="#1b1008" stroke-width="'+f1(r*.3)+'"/>';
    if(fm==='carre')return '<rect x="'+f1(x-r)+'" y="'+f1(y-r)+'" width="'+f1(r*2)+'" height="'+f1(r*2)+'" fill="'+c+'" stroke="#1b1008" stroke-width="'+f1(r*.3)+'"/>';
    return '<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+c+'" stroke="#1b1008" stroke-width="'+f1(r*.3)+'"/>';
  }

  /* ---------- le savant fou (coordonnées locales : centre x = 40, pieds y = 90), vu de trois quarts, il regarde à droite ---------- */
  /* chapeaux et cheveux dessinés autour du sommet du crâne ; un groupe les recale sur la tête ronde de trois quarts (centre 41,6 ; sommet à y = 21) */
  var COIFFE='<g transform="translate(41.6 22.8) scale(1.08) translate(-41 -22)">';
  var CHAPEAUX={
    bandeau:function(){return '<path d="M32.2 26.4Q41 21.8 50.4 25.8L50.6 29.4Q41 25.8 32.4 29.6Z" fill="#e8362f"'+CT+'/><path d="M32.8 27.8l-5.2-2.2M32.8 29l-4.4 3" stroke="#e8362f" stroke-width="2.4" stroke-linecap="round"/>';},
    explorateur:function(){return '<g transform="rotate(-3 41 24)"><ellipse cx="41" cy="24.6" rx="14.6" ry="3.2" fill="#a8742e"'+CT+'/><path d="M33.4 24.2C33 15.8 37 13.2 41 13.2S49 15.8 48.6 24.2Z" fill="#c48c3c"'+CT+'/><path d="M33.6 21.6Q41 23.6 48.4 21.6" stroke="#7a5018" stroke-width="2" fill="none"/></g>';},
    magicien:function(){return '<g transform="rotate(-3 41 24)"><path d="M31.6 24.8L42.4 3.4 50.4 24.8Z" fill="#7a3ad8"'+CT+'/><ellipse cx="41" cy="24.8" rx="12.6" ry="2.8" fill="#6a2ec0"'+CT+'/><circle cx="42" cy="13.8" r="1.6" fill="#ffe58a"/><circle cx="45.6" cy="19.4" r="1.1" fill="#ffe58a"/><circle cx="38.2" cy="20" r="1" fill="#ffe58a"/></g>';},
    couronne:function(){return '<g transform="rotate(-3 41 24)"><path d="M32.8 26.8L33.8 17.8 37.6 21.8 41 15.8 44.4 21.8 48.2 17.8 49.2 26.8Q41 23.4 32.8 26.8Z" fill="#ffd23a"'+CT+'/><circle cx="41" cy="20.2" r="1.3" fill="#e8362f"/></g>';},
    bonnet:function(){return '<path d="M31.8 28C31.4 17.2 35.6 12.8 41 12.8S50.6 17.2 50.2 28Q41 24.6 31.8 28Z" fill="#f6a0c6"'+CT+'/><path d="M31.6 26.8Q41 22.8 50.4 26.8V29.8Q41 26.2 31.6 29.8Z" fill="#fff"'+CT+'/><circle cx="41" cy="11.8" r="3" fill="#fff"'+CT+'/>';},
    capuche:function(){return '<path d="M31.2 38C28.6 27.4 32 17.6 41.4 17C48.4 16.6 51.6 21.8 50.8 28.2C49.2 24.2 45.4 22.6 41.4 23.2C37 23.8 34.4 28.2 34 37Z" fill="#2b1a26"'+CT+'/>';},
    mortier:function(){return '<g transform="rotate(-3 41 24)"><path d="M35.4 24.4V28.6Q41 31.6 46.8 28.6V24.4" fill="#26263e"'+CT+'/><path d="M28.4 21.6L41 16.6 53.6 21.6 41 26.4Z" fill="#26263e"'+CT+'/><path d="M53.6 21.6L55 29.4" stroke="#ffd23a" stroke-width="1.8"/><circle cx="55" cy="30.8" r="1.8" fill="#ffd23a"/></g>';}
  };
  function cheveux(coupe,c){
    /* cheveux fous, rejetés vers l'arrière (derrière le chapeau) */
    if(coupe==='frise')return '<path d="M33.2 31C28.4 30.4 27 25 30.6 22.6C29.2 17.8 34.6 14.4 38.2 16.6C40.2 12.6 46.4 12.8 47.6 17.4C51.6 17.8 53 22.4 50.8 25.6C47.4 22.6 43 21.6 39 22.8C36 23.8 34 27 33.2 31Z" fill="'+c+'"'+CT+'/>';
    return '<path d="M33 29.4C30 26.4 31 22 34 20.6L31 14 37 17.6 37.6 9.6 41.6 17.2 45.4 10.6 46 18.4 51.4 14.4 49.4 22C46 20 42 19.6 38 21 35.6 22 33.4 25 33 29.4Z" fill="'+c+'"'+CT+'/>';
  }
  /* pivots des articulations (coordonnées locales) : hanches, épaules, coudes, main qui tient la fiole */
  var ART={hancheG:[40,66],hancheD:[40,66],epaule:[47,46],coude:[57.5,37.5],main:[60.5,25.8],epauleAr:[34,46],coudeAr:[30.5,57],mainAr:[31,67]};
  /* La fiole de potion tenue en main (coordonnées de la main de face : main en 60,5 ; 25,8) : le liquide se découpe dans la forme du verre */
  function fiole(v,s,suffixe){
    var pot=v.c[0],pot2=v.c[1],id='lbf-'+v.id+suffixe;
    return '<path d="M58.6 19.6h3.8v5.4l5.4 9.6c.7 1.3 0 2.5-1.6 2.5H54.8c-1.6 0-2.3-1.2-1.6-2.5l5.4-9.6z" fill="rgba(255,255,255,.35)"'+CT+'/>'+
      '<clipPath id="'+id+'"><path d="M59.6 20.6h1.8v5.4l5.2 9.2H54.4L59.6 26z"/></clipPath>'+
      '<g clip-path="url(#'+id+')"><rect x="52" y="29" width="18" height="10" fill="'+pot+'"/><g class="lb-ondule"><path d="M52 29c3 1.4 5 1.4 8 0s5-1.4 8 0V32H52z" fill="'+pot+'"/></g>'+forme(v.forme,59.6,33.4,1.1,pot2)+'</g>'+
      '<g class="lb-petite-b"><circle cx="60.4" cy="31" r=".9" fill="#fff" opacity=".85"/></g>'+
      '<circle cx="60.4" cy="25.8" r="2.9" fill="'+s.peau+'"'+CT+'/>';
  }
  var SOULIER_F=function(x,c){return '<path d="M'+x+' 87.4c0-2.4 2.2-3.8 5-3.8h3.6c1.6 0 2.8 1.2 2.8 2.8 0 1.6-1.2 2.6-2.8 2.6h-6c-1.6 0-2.6-.6-2.6-1.6z" fill="'+c+'"'+CT+'/>';};
  function savant(s,v){
    var fm=v.forme,o='<g class="lb-savant">';
    /* ----- corps de FACE (à l'arrêt : il agite sa fiole, il verse) : jambes puis buste ----- */
    o+='<g class="lb-vf"><g>'+seg(36.2,66,35,85,5,'#3b3552')+SOULIER_F(29.6,'#c8421e')+seg(44,66,45.6,85,5,'#3b3552')+SOULIER_F(40.4,'#c8421e')+'</g></g>';
    /* ----- corps de PROFIL (en marche) : jambes qui pivotent aux hanches, souliers pointés vers l'avant ----- */
    /* jambes de profil : cuisse (pivot hanche 40,66) puis tibia (pivot genou 40 ; 76,6), le pied est au bout du tibia (cheville 40 ; 87,2) ; la marche vient d'une cinématique inverse : le pied posé reste fixe au sol */
    var SOULIER_P='<path d="M-4.6 3.4C-4.6 .4 -2.4 -1.6 .6 -1.6H5C7.6 -1.6 9 -.4 9 1.4C9 3 7.8 3.9 5.8 3.9H-3C-4 3.9 -4.6 3.7 -4.6 3.4Z"';
    var jambeP=function(cu,ti,pantalon,soulier){return '<g class="'+cu+'">'+seg(40,66,40,76.6,5,pantalon)+'<g class="'+ti+'">'+seg(40,76.6,40,87.2,5,pantalon)+'<g transform="translate(40 87.2)">'+SOULIER_P+' fill="'+soulier+'"'+CT+'/></g></g></g>';};
    o+='<g class="lb-vp">'+jambeP('lb-cu-d','lb-ti-d','#2e2a42','#a8341a')+jambeP('lb-cu-g','lb-ti-g','#3b3552','#c8421e')+'</g>';
    o+='<g class="lb-corps">';
    /* buste de face */
    o+='<g class="lb-vf">';
    var doigts='';[-34,-11,11,34].forEach(function(a){var r=a*Math.PI/180;doigts+=seg(31,67,f1(31+4*Math.sin(r)),f1(67+4*Math.cos(r)),1.5,s.peau);});
    o+='<g class="lb-bras-ar">'+seg(34,46,30.5,57,5,ombre(s.blouse))+
       '<g class="lb-avbras-ar">'+seg(30.5,57,31,67,4.4,ombre(s.blouse))+'<g class="lb-doigts">'+doigts+'</g><circle cx="31" cy="67.2" r="2.9" fill="'+s.peau+'"'+CT+'/></g></g>';
    o+='<path d="M30 47c0-4.4 3.4-7 7.6-7.4h5.6c4.2.4 7.6 3 7.6 7.4l1.6 22H28.4z" fill="'+s.blouse+'"'+CT+'/>';
    o+='<path d="M36.4 40.2l3.6 7.4 3.6-7.4z" fill="#fff"'+CT+'/><path d="M38.8 46.4h2.4l1 8.6-2.2 2.4-2.2-2.4z" fill="#e8362f"'+CT+'/>';
    o+='<circle cx="40" cy="60" r="1.1" fill="#1b1008"/><circle cx="40" cy="65.4" r="1.1" fill="#1b1008"/>';
    o+='<rect x="30.8" y="55.4" width="6.2" height="5.4" rx="1" fill="rgba(0,0,0,.14)"'+CT+'/><path d="M33 55.4v-3.2M35.2 55.4v-3.2" stroke="#e8362f" stroke-width="1.3" stroke-linecap="round"/>';
    o+='<g class="lb-pan"><path d="M28.4 68H51.6l2.2 9c-8.6 2.6-19.4 2.6-27.6 0z" fill="'+s.blouse+'"'+CT+'/></g>';
    o+='<g class="lb-bras-av">'+seg(47,46,57.5,37.5,5,s.blouse)+'<g class="lb-avbras-av">'+seg(57.5,37.5,60.5,25.5,4.6,s.blouse)+'<g class="lb-fiole">'+fiole(v,s,'')+'</g></g></g>';
    o+='</g>';   /* buste de face */
    /* buste de PROFIL : plus étroit, cravate sur le devant, bras lointain qui balance, bras proche plié qui tient la fiole devant la poitrine */
    o+='<g class="lb-vp">';
    o+='<g class="lb-p-ar">'+seg(40,46,40.5,57,4.6,ombre(s.blouse))+'<g class="lb-p-avar">'+seg(40.5,57,40.8,66.4,4.2,ombre(s.blouse))+'<circle cx="40.8" cy="67.4" r="2.6" fill="'+s.peau+'"'+CT+'/></g></g>';
    o+='<path d="M34.4 47c0-4.2 2.6-6.8 6.2-7.2h3c3.4.6 5.4 3.2 5.4 7.2l1.2 22H33.2z" fill="'+s.blouse+'"'+CT+'/>';
    o+='<path d="M43.6 40.4l3.6 3.4-3.2 1.8z" fill="#fff"'+CT+'/><path d="M45 46.4l2 .8-.4 8.6-1.8 1.8z" fill="#e8362f"'+CT+'/><circle cx="45.4" cy="60.6" r="1" fill="#1b1008"/><circle cx="45.4" cy="65.6" r="1" fill="#1b1008"/>';
    o+='<g class="lb-pan"><path d="M33.2 68H48.8l2 9c-6.6 2.4-14.4 2.4-20.8 0z" fill="'+s.blouse+'"'+CT+'/></g>';
    o+='<g class="lb-p-av">'+seg(40.6,46,45.6,55,4.8,s.blouse)+'<g class="lb-p-avav">'+seg(45.6,55,53,50.6,4.4,s.blouse)+'<g transform="translate(-7.5 24.8)">'+fiole(v,s,'p')+'</g></g></g>';
    o+='</g>';   /* buste de profil */
    /* tête de trois quarts : le nez est sur l'axe du visage, l'œil le plus proche est le plus grand, l'autre est vu de biais près du bord */
    o+='<g class="lb-tete">'+
       '<g class="lb-cheveux">'+COIFFE+cheveux(s.coupe,s.cheveux)+'</g></g>'+
       '<rect x="38.4" y="38.4" width="6" height="5.6" fill="'+s.peau+'"'+CT+'/>'+
       '<ellipse cx="41.6" cy="31" rx="10.2" ry="10" fill="'+s.peau+'"'+CT+'/>'+
       '<ellipse cx="34.6" cy="32.6" rx="1.9" ry="2.7" fill="'+s.peau+'"'+CT+'/><path d="M34.2 31.6q1 1.2 0 2.6" stroke="rgba(0,0,0,.4)" stroke-width=".7" fill="none" stroke-linecap="round"/>'+
       '<path d="M51.2 30.6C55.2 31.2 56 35 52.4 35.8 51 36.1 49.8 35.6 49 34.8Z" fill="'+s.peau+'"'+CT+'/>';
    if(s.barbe)o+='<path d="M36.6 37C35.6 46 40.2 54 46 56.2C52 53.4 55 45 52.4 36.6C48 40.8 41 41 36.6 37Z" fill="'+s.barbe+'"'+CT+'/><path d="M40.4 42.4c.8 3.8.2 7.6 2.8 10.4M46.4 42.4c0 3.6-.4 7-2 9.6M51 41.6c-.6 3-1.6 5.4-3.2 7.2" stroke="rgba(0,0,0,.28)" stroke-width="1.1" fill="none" stroke-linecap="round"/>';
    o+='<path d="M38.6 29.2L31.8 27.6" stroke="'+s.lunettes+'" stroke-width="2.2" stroke-linecap="round"/><path d="M38.6 29.2L31.8 27.6" stroke="#1b1008" stroke-width=".5" opacity=".5"/>'+
       '<ellipse cx="49.8" cy="29.6" rx="2.6" ry="4" fill="#fff" stroke="'+s.lunettes+'" stroke-width="1.9"/>'+
       '<ellipse cx="42.8" cy="29.4" rx="4.7" ry="5.1" fill="#fff" stroke="'+s.lunettes+'" stroke-width="2.1"/><ellipse cx="42.8" cy="29.4" rx="5.7" ry="6.1" fill="none" stroke="#1b1008" stroke-width=".7" opacity=".5"/>'+
       '<g class="lb-pupilles"><circle cx="44.4" cy="29.6" r="1.7" fill="#1b1008"/><circle cx="50.5" cy="29.8" r="1.1" fill="#1b1008"/></g>'+
       '<g class="lb-lueur"><path d="M39.8 26.4c1-.9 2.3-1.1 3.4-.7" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round"/></g>'+
       '<g class="lb-sourcils"><path d="M37.8 23.4L46.6 21.4" stroke="#1b1008" stroke-width="1.8" stroke-linecap="round"/><path d="M48.4 21.8L52 21.4" stroke="#1b1008" stroke-width="1.5" stroke-linecap="round"/></g>';
    o+='<g class="lb-bouche"><path d="M44.4 36.6C47 38.2 50.2 37.8 51.8 36C51.6 39.8 48.4 41.8 45.8 41.2C43.4 40.6 43.2 38.6 44.4 36.6Z" fill="#6a1a26"'+CT+'/><path d="M45.8 37.6h4.6" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/></g>';
    if(s.chapeau&&CHAPEAUX[s.chapeau])o+=COIFFE+CHAPEAUX[s.chapeau]()+'</g>';
    o+='</g>';   /* tête */
    o+='</g></g>';   /* corps, savant */
    return o;
  }

  /* ---------- le liquide d'un ustensile, découpé dans la forme réelle de son verre ---------- */
  function liquide(cle,niveau,v,idu,classeNiveau){
    var I=INTERIEURS[cle],h=I.y1-I.y0,yn=Math.round(I.y1-niveau*h),w=I.x1-I.x0;
    var pot=v.c[0],pot2=v.c[1],id='lbc-'+idu+'-'+cle,n=3,b='';
    for(var i=0;i<n;i++){
      var bx=Math.round(I.x0+w*(0.25+0.25*i)),r=Math.max(7,Math.round(w*0.07));
      b+='<g class="lb-bul" style="--mont:-'+Math.round((I.y1-yn)*0.8)+'px;animation-delay:calc(var(--T)*-'+(i*0.3).toFixed(2)+')">'+forme(v.forme,bx,I.y1-30,r,'rgba(255,255,255,.88)')+'</g>';
    }
    return '<clipPath id="'+id+'"><path d="'+I.p+'"/></clipPath>'+
      '<g clip-path="url(#'+id+')"><g class="'+classeNiveau+'"><rect x="'+I.x0+'" y="'+yn+'" width="'+w+'" height="'+(h+60)+'" fill="'+pot+'"/>'+
      '<rect x="'+I.x0+'" y="'+Math.round(yn+h*0.35)+'" width="'+w+'" height="'+Math.round(h)+'" fill="'+pot2+'" opacity=".55"/>'+
      '<path d="M'+I.x0+' '+yn+'c'+Math.round(w*.2)+' '+Math.round(-h*.05)+' '+Math.round(w*.3)+' '+Math.round(-h*.05)+' '+Math.round(w*.5)+' 0s'+Math.round(w*.3)+' '+Math.round(h*.05)+' '+Math.round(w*.5)+' 0v'+Math.round(h*.06)+'H'+I.x0+'z" fill="'+pot+'"/></g>'+b+'</g>';
  }
  function pose(p){var k=p.w/p.w0;return {k:k,x:f1(p.cx-p.w/2),y:f1(p.base-p.h0*k)};}
  var NIVEAUX={flacon:.5,tubeG:.55,becher:.45};

  /* La scène complète d'un labo. images = {decor, etabli, flacon, tubes, becher} (URL ou data:) ; travaille = animations actives ; decalage = 0..1, départ décalé dans la chorégraphie (labos qui ne bougent pas tous ensemble) */
  function scene(id,images,travaille,decalage){
    var v=LABOS[id],c=CELLULES[id];if(!v||!c)return '';
    v.id=id;
    var idu=id,pe=pose(PIECES.etabli),pf=pose(PIECES.flacon),pt=pose(PIECES.tubes),pb=pose(PIECES.becher);
    /* le savant est TOUJOURS dessiné derrière l'établi : à gauche il ne touche rien, derrière l'établi la table cache ses jambes */
    var sav='<g class="lb-deplace" transform="translate('+DEPART[0]+' '+DEPART[1]+')"><g class="lb-sens"><g transform="scale('+SAVANT_K+') translate(-40 -90)">'+savant(v.s,v)+'</g></g></g>';
    var verre=function(cle,pz,p,liq){return '<g transform="translate('+p.x+' '+p.y+') scale('+f1(p.k*1000)/1000+')">'+liq+'<image href="'+images[cle]+'" width="'+pz.w0+'" height="'+pz.h0+'"/></g>';};
    /* filets de potion versés (un par verre) : une fine bande depuis l'ouverture jusqu'à la surface du liquide */
    var filet=function(cle,pz,classe){var p=pose(PIECES[pz]),bo=BOUCHES[cle],I=INTERIEURS[cle],h=I.y1-I.y0,yn=p.y+(I.y1-NIVEAUX[cle]*h)*p.k,x=p.x+bo[0]*p.k,y0=p.y+bo[1]*p.k-9;
      return '<rect class="lb-filet '+classe+'" x="'+f1(x-1.3)+'" y="'+f1(y0)+'" width="2.6" height="'+f1(yn-y0)+'" rx="1.3" fill="'+v.c[0]+'" stroke="#1b1008" stroke-width=".5" style="transform-origin:'+f1(x)+'px '+f1(y0)+'px"/>';};
    return '<svg class="lb'+(travaille?' lb-on':'')+'" viewBox="0 0 '+L+' '+H+'" role="img" aria-label="'+v.nom+'" focusable="false" style="--dec:'+(decalage||0)+'">'+
      '<image href="'+(typeof images.decor==='object'?images.decor[id]:images.decor)+'" x="0" y="0" width="'+L+'" height="'+H+'" preserveAspectRatio="none"/>'+
      sav+
      '<image href="'+images.etabli+'" x="'+pe.x+'" y="'+pe.y+'" width="'+PIECES.etabli.w+'" height="'+f1(PIECES.etabli.h0*pe.k)+'"/>'+
      verre('flacon',PIECES.flacon,pf,liquide('flacon',NIVEAUX.flacon,v,idu,'lb-niv-f'))+
      verre('tubes',PIECES.tubes,pt,liquide('tubeG',NIVEAUX.tubeG,v,idu,'lb-niv-t')+liquide('tubeD',.45,v,idu,'lb-niveau'))+
      verre('becher',PIECES.becher,pb,liquide('becher',NIVEAUX.becher,v,idu,'lb-niv-b'))+
      filet('flacon','flacon','lb-filet-f')+filet('tubeG','tubes','lb-filet-t')+filet('becher','becher','lb-filet-b')+
      '<rect class="lb-nuit" x="0" y="0" width="'+L+'" height="'+H+'" fill="#0a0818" style="pointer-events:none"/>'+
      '</svg>';
  }

  /* ---------- la chorégraphie : le savant marche derrière l'établi et verse dans le flacon, les tubes et le bécher ---------- */
  var P=16,PIDLE=16/7;   /* durée du cycle complet (s), à vitesse normale ; le geste de repos (2,29 s) tient sept fois dans le cycle : boucle exacte */
  function suave(x){x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);}
  function interp(tab,u){for(var i=0;i<tab.length-1;i++){if(u>=tab[i][0]&&u<=tab[i+1][0]){var a=tab[i],b=tab[i+1];return a[1]+(b[1]-a[1])*suave((u-a[0])/((b[0]-a[0])||1));}}return tab[tab.length-1][1];}
  /* mouvements au repos (boucle de 2,4 s), rangés par articulation, en degrés (clés de 0 à 1) */
  var T_IDLE={
    brasAv:[[0,0],[.18,-6],[.36,4],[.52,-14],[.6,-8],[.7,-14],[.85,2],[1,0]],
    avbrasAv:[[0,0],[.08,14],[.16,-10],[.24,14],[.32,-10],[.4,12],[.48,-6],[.56,-20],[.64,-12],[.72,-20],[.8,8],[.88,-4],[1,0]],
    corps:[[0,1.2],[.25,2.4],[.5,.6],[.58,1],[.64,1.4],[.7,1],[.78,1.2],[1,1.2]],
    bob:[[0,0],[.25,-.5],[.5,.3],[.58,-1],[.64,.3],[.7,-1],[.78,0],[1,0]]
  };
  var PHASES=[[0,2.6,'repos'],[2.6,4.2,'marche'],[4.2,6.2,'verse',0],[6.2,6.9,'marche'],[6.9,8.9,'verse',1],[8.9,9.8,'marche'],[9.8,11.8,'verse',2],[11.8,14.4,'retour'],[14.4,16,'repos']];
  var MARCHES=[[2.6,4.2],[6.2,6.9],[8.9,9.8],[11.95,14.25]];
  var DEPART=[78,238],SAVANT_K=1.9,P1=[114,233],DERRIERE_Y=230;
  /* marche : demi-pas de 5,5 unités (le pied posé recule de 11 unités = 20,9 px pendant que le corps avance d'autant), pied levé de 3,5, cheville à 86,4 (la semelle touche le sol en 90) */
  var PAS=5.5,LEVE=3.5,CHEVILLE=86.4,DEMI_PAS=2*PAS*SAVANT_K;
  var BOUCHES={flacon:[120,33],tubeG:[77,23],becher:[106,30]};   /* centre de l'ouverture de chaque verre, en pixels de son image */
  /* postes de versement : position du savant (pieds) et angles des bras, calculés par cinématique inverse pour que la fiole penchée se retrouve juste au-dessus du verre */
  function postes(){
    var def=[['flacon','flacon'],['tubeG','tubes'],['becher','becher']],out=[];
    var S1=ART.epaule,E0=ART.coude,H0=ART.main;
    var a=Math.hypot(E0[0]-S1[0],E0[1]-S1[1]),b=Math.hypot(H0[0]-E0[0],H0[1]-E0[1]),u0=Math.atan2(E0[1]-S1[1],E0[0]-S1[0]),f0=Math.atan2(H0[1]-E0[1],H0[0]-E0[0]);
    def.forEach(function(d){
      var p=pose(PIECES[d[1]]),I=BOUCHES[d[0]],mx=p.x+I[0]*p.k,my=p.y+I[1]*p.k;
      /* la fiole penchée de 112° a son goulot à (+5,7 ; +2,3) de la main (px locaux) : la main est donc au-dessus et à gauche de l'ouverture */
      var cible=[mx-5.7*SAVANT_K,my-2.3*SAVANT_K-9];
      var X=cible[0]-(S1[0]-40)*SAVANT_K-18,Y=DERRIERE_Y;
      var lx=40+(cible[0]-X)/SAVANT_K,ly=90+(cible[1]-Y)/SAVANT_K;
      var dx=lx-S1[0],dy=ly-S1[1],dist=Math.min(a+b-.5,Math.max(Math.abs(a-b)+.5,Math.hypot(dx,dy))),phi=Math.atan2(dy,dx);
      var alpha=Math.acos(Math.max(-1,Math.min(1,(a*a+dist*dist-b*b)/(2*a*dist))));
      var thU=phi+alpha;   /* coude vers le bas */
      var ex=S1[0]+a*Math.cos(thU),ey=S1[1]+a*Math.sin(thU),thF=Math.atan2(ly-ey,lx-ex);
      var t1=(thU-u0)*180/Math.PI,t2=(thF-f0-(thU-u0))*180/Math.PI;
      out.push({X:X,Y:Y,t1:t1,t2:t2,mx:mx,my:my});
    });
    return out;
  }
  function modele(){
    var ST=postes(),ptsX=[[0,DEPART[0],DEPART[1]],[2.6,DEPART[0],DEPART[1]],[3.3,P1[0],P1[1]],[4.2,ST[0].X,ST[0].Y],[6.2,ST[0].X,ST[0].Y],[6.9,ST[1].X,ST[1].Y],[8.9,ST[1].X,ST[1].Y],[9.8,ST[2].X,ST[2].Y],[11.8,ST[2].X,ST[2].Y],[13.55,P1[0],P1[1]],[14.25,DEPART[0],DEPART[1]],[16,DEPART[0],DEPART[1]]];
    function position(t){for(var i=0;i<ptsX.length-1;i++){var a=ptsX[i],b=ptsX[i+1];if(t>=a[0]&&t<=b[0]){var k=(t-a[0])/((b[0]-a[0])||1);return [a[1]+(b[1]-a[1])*k,a[2]+(b[2]-a[2])*k];}}return [DEPART[0],DEPART[1]];}
    function sens(t){if(t<11.8)return 1;if(t<11.95)return 1-2*suave((t-11.8)/.15);if(t<14.25)return -1;if(t<14.4)return -1+2*suave((t-14.25)/.15);return 1;}
    function poids(t){   /* marche (jambes, balancier des bras) : 1 pendant les trajets, rampes de 0,15 s */
      var w=0;MARCHES.forEach(function(m){w=Math.max(w,suave((t-m[0])/.15)*(1-suave((t-m[1]+.15)/.15)));});return w;}
    /* ----- marche : le pied posé reste fixe au sol ; la phase avance avec la distance horizontale parcourue ----- */
    function fenetreMarche(t){for(var i=0;i<MARCHES.length;i++){var m=MARCHES[i];if(t>=m[0]-.15&&t<=m[1]+.15)return m;}return null;}
    function phiMarche(t){var m=fenetreMarche(t);if(!m)return null;var tt=Math.min(m[1],Math.max(m[0],t));return Math.abs(position(tt)[0]-position(m[0])[0])/(2*DEMI_PAS);}
    /* position locale du pied (par rapport à la hanche) pour la phase u d'une jambe : appui (recule à vitesse du corps) puis pas (avance, levé) */
    function cible(u){u=((u%1)+1)%1;if(u<.5)return {x:PAS-4*PAS*u,y:0,appui:true};var v=(u-.5)/.5;return {x:-PAS+2*PAS*suave(v),y:-LEVE*Math.sin(Math.PI*v),appui:false};}
    function jambe(u){
      var c=cible(u),hx=40,hy=66,L=10.6,ax=hx+c.x,ay=CHEVILLE+c.y,dx=ax-hx,dy=ay-hy,d=Math.min(2*L-.01,Math.hypot(dx,dy)),phi=Math.atan2(dy,dx);
      var al=Math.acos(Math.max(-1,Math.min(1,d/(2*L))));   /* deux segments égaux : cos(angle) = d / 2L */
      var th=phi-al,kx=hx+L*Math.cos(th),ky=hy+L*Math.sin(th),ts=Math.atan2(ay-ky,ax-kx);
      return {t1:(th-Math.PI/2)*180/Math.PI,t2:(ts-th)*180/Math.PI,appui:c.appui,x:c.x,y:c.y};
    }
    function jambes(t){var p=phiMarche(t);if(p===null)return {a:{t1:0,t2:0},b:{t1:0,t2:0}};return {a:jambe(p),b:jambe(p+.5)};}
    /* positions du pied dans la scène (pour vérifier qu'il ne glisse pas) */
    function pieds(t){var p=phiMarche(t),a=position(t),f=sens(t);if(p===null)return null;
      var g=function(u){var c=cible(u);return {x:a[0]+c.x*SAVANT_K*f,y:a[1]-c.y*SAVANT_K,appui:c.appui};};return {a:g(p),b:g(p+.5)};}
    function perfil(t){   /* corps de profil visible pendant les trajets, avec 0,15 s de fondu avant et après (le retournement de sens se fait pendant ce fondu) */
      var w=0;MARCHES.forEach(function(m){w=Math.max(w,suave((t-(m[0]-.15))/.15)*(1-suave((t-m[1])/.15)));});return w;}
    function mode(t){   /* poids [repos, marche, verse] avec fondus de 0,3 s aux frontières */
      var base=function(i){var m=PHASES[i][2];return m==='repos'?[1,0,0]:(m==='verse'?[0,0,1]:[0,1,0]);};
      var idx=0;for(var i=0;i<PHASES.length;i++)if(t>=PHASES[i][0]&&t<PHASES[i][1])idx=i;
      var w=base(idx);
      for(var j=0;j<PHASES.length-1;j++){var bnd=PHASES[j][1];if(Math.abs(t-bnd)<.15){var s=suave((t-bnd+.15)/.3),A=base(j),B=base(j+1);w=[A[0]*(1-s)+B[0]*s,A[1]*(1-s)+B[1]*s,A[2]*(1-s)+B[2]*s];}}
      return w;
    }
    function verse(t){   /* avancement du versement : { prise (0..1), bascule (0..1), poste } */
      for(var i=0;i<PHASES.length;i++)if(PHASES[i][2]==='verse'&&t>=PHASES[i][0]&&t<PHASES[i][1]){var u=t-PHASES[i][0];return {prise:suave(u/.4)*(1-suave((u-1.55)/.45)),bascule:suave((u-.35)/.35)*(1-suave((u-1.45)/.35)),poste:PHASES[i][3]};}
      return {prise:0,bascule:0,poste:0};
    }
    function articulations(t){
      var w=mode(t),u=((t%PIDLE)+PIDLE)%PIDLE/PIDLE,ww=poids(t),om=2*Math.PI*t/.5,vs=verse(t),pst=ST[vs.poste],J=jambes(t),phM=phiMarche(t),ph2=(phM===null?0:2*Math.PI*phM);
      var carry1=54+4*Math.sin(om),carry2=-38+5*Math.sin(om+1.6);
      var idle1=interp(T_IDLE.brasAv,u),idle2=interp(T_IDLE.avbrasAv,u);
      var pour1=carry1*(1-vs.prise)+pst.t1*vs.prise,pour2=carry2*(1-vs.prise)+pst.t2*vs.prise;
      var av1=w[0]*idle1+w[1]*carry1+w[2]*pour1,av2=w[0]*idle2+w[1]*carry2+w[2]*pour2;
      var hh=suave((u-.5)/.1)*(1-suave((u-.8)/.1));   /* main sur la hanche pendant le rire */
      var ar1=w[0]*(4*Math.sin(2*Math.PI*u)*(1-hh)+25*hh)+w[1]*(-18*Math.sin(om))+w[2]*(28+4*Math.sin(2*Math.PI*t/.6));
      var ar2=w[0]*(3*Math.sin(2*Math.PI*u+1)*(1-hh)-43*hh)+w[1]*(-8+4*Math.sin(om))+w[2]*(-12+3*Math.sin(2*Math.PI*t/.6+1));
      var corps=w[0]*interp(T_IDLE.corps,u)+w[1]*3+w[2]*(1+5*vs.prise),bob=w[0]*interp(T_IDLE.bob,u)+w[1]*(-1.0*Math.abs(Math.sin(ph2)));
      var p=position(t),pv=perfil(t);
      return {pv:pv,pAr:-22*Math.sin(ph2)*ww,pAv:5*Math.sin(ph2+Math.PI)*ww,pAvav:-7*Math.sin(ph2)*ww,x:p[0],y:p[1],f:sens(t),cuG:J.a.t1,tiG:J.a.t2,cuD:J.b.t1,tiD:J.b.t2,corps:corps,bob:bob,brasAv:av1,avbrasAv:av2,fiole:112*vs.bascule*w[2],brasAr:ar1,avbrasAr:ar2};
    }
    /* niveaux de potion : monte pendant le versement, redescend lentement le reste du cycle (retour exact au départ) */
    function niveau(t,k,D){var ph=PHASES.filter(function(q){return q[2]==='verse'&&q[3]===k;})[0],ts=ph[0]+.45,dur=1.0,te=ts+dur;
      if(t>=ts&&t<=te)return D*suave((t-ts)/dur);var tau=((t-te)%P+P)%P;return D*(1-tau/(P-dur));}
    function filet(t,k){var ph=PHASES.filter(function(q){return q[2]==='verse'&&q[3]===k;})[0],a=ph[0]+.6,b=ph[0]+1.5;return suave((t-a)/.12)*(1-suave((t-b+.12)/.12));}
    /* instants où une valeur de la chorégraphie change de pente : bornes des fondus de profil */
    var temps=[0,P];MARCHES.forEach(function(m){temps.push(m[0]-.15,m[0],m[1],m[1]+.15);});
    temps=temps.filter(function(x,i,t2){return x>=0&&x<=P&&t2.indexOf(x)===i;}).sort(function(p,q){return p-q;});
    /* échantillons des jambes : toutes les 0,05 s pendant les trajets (et 0,15 s autour), puis le repos */
    var tj=[0,P];MARCHES.forEach(function(m){for(var x=m[0]-.15;x<=m[1]+.1501;x+=.05)tj.push(Math.round(x*1000)/1000);tj.push(Math.round((m[1]+.16)*1000)/1000);});
    tj=tj.filter(function(x,i,t2){return x>=0&&x<=P&&t2.indexOf(x)===i;}).sort(function(p,q){return p-q;});
    return {articulations:articulations,niveau:niveau,filet:filet,postes:ST,temps:temps,tempsJambes:tj,pieds:pieds,jambes:jambes};
  }
  /* un @keyframes à partir d'une fonction du temps : échantillons réguliers, dernier = premier (boucle exacte) */
  function kfFonction(nom,pas,fn){
    var n=Math.round(P/pas),o='@keyframes '+nom+'{';
    for(var i=0;i<=n;i++){var t=i===n?0:i*pas;o+=f3(i/n*100)+'%{'+fn(t)+'}';}
    return o+'}';
  }
  function kfTemps(nom,temps,fn){
    var o='@keyframes '+nom+'{';
    temps.forEach(function(t,i){o+=f3(t/P*100)+'%{'+fn(i===temps.length-1?0:t)+'}';});
    return o+'}';
  }
  function f3(x){return (Math.round(x*1000)/1000).toString();}
  function dg(x){return f1(x)+'deg';}

  /* ---------- le style (une seule fois) : transform et opacity seulement ; les mouvements de chorégraphie ont la période --P, les petits gestes la période --T ---------- */
  function css(){
    var M=modele(),AR=function(t){return M.articulations(t);};
    function kf(nom,pas){return '@keyframes '+nom+'{'+pas+'}';}
    var o=['.lb{--T:2.4s;--P:calc(var(--T)*6.6667);display:block;width:100%;height:auto}',
      '.lb *{transform-box:view-box}',
      /* AU REPOS (Norman, 2026-11-08) : lumières éteintes (voile sombre, qui se lève en 0,6 s quand le labo se met au travail) et savant les bras baissés : le bras avant pend SUR LE CÔTÉ du corps, hors de la blouse (épaule 100°, coude 58°) et la fiole reste droite au bout de la main (contre-rotation -158°), tête un peu baissée, bouche fermée, sourcils bas, regard vers le sol */
      '.lb-nuit{opacity:.8;transition:opacity .6s ease}',
      '.lb-on .lb-nuit{opacity:0}',
      '.lb-bras-av{transform-origin:'+ART.epaule[0]+'px '+ART.epaule[1]+'px}.lb-avbras-av{transform-origin:'+ART.coude[0]+'px '+ART.coude[1]+'px}.lb-fiole{transform-origin:'+ART.main[0]+'px '+ART.main[1]+'px}',
      '.lb:not(.lb-on) .lb-bras-av{transform:rotate(100deg)}',
      '.lb:not(.lb-on) .lb-avbras-av{transform:rotate(58deg)}',
      '.lb:not(.lb-on) .lb-fiole{transform:rotate(-158deg)}',
      '.lb:not(.lb-on) .lb-tete{transform-origin:41px 41px;transform:rotate(5deg)}',
      '.lb:not(.lb-on) .lb-sourcils{transform:translateY(.9px)}',
      '.lb:not(.lb-on) .lb-bouche{transform-origin:48px 38px;transform:scaleY(.4)}',
      '.lb:not(.lb-on) .lb-pupilles{transform:translate(.3px,.7px)}',
      '.lb:not(.lb-on) .lb-bras-av,.lb:not(.lb-on) .lb-avbras-av,.lb:not(.lb-on) .lb-fiole,.lb:not(.lb-on) .lb-tete,.lb:not(.lb-on) .lb-sourcils,.lb:not(.lb-on) .lb-bouche,.lb:not(.lb-on) .lb-pupilles{transition:transform .6s ease}',
      '.lb-on .lb-vf,.lb-on .lb-vp,.lb-on .lb-p-ar,.lb-on .lb-p-av,.lb-on .lb-p-avav,.lb-on .lb-deplace,.lb-on .lb-sens,.lb-on .lb-cu-g,.lb-on .lb-ti-g,.lb-on .lb-cu-d,.lb-on .lb-ti-d,.lb-on .lb-corps,.lb-on .lb-bras-av,.lb-on .lb-avbras-av,.lb-on .lb-fiole,.lb-on .lb-bras-ar,.lb-on .lb-avbras-ar,.lb-on .lb-niv-f,.lb-on .lb-niv-t,.lb-on .lb-niv-b,.lb-on .lb-filet{animation-duration:var(--P);animation-timing-function:linear;animation-iteration-count:infinite;animation-delay:calc(var(--P)*var(--dec,0)*-1)}',
      '.lb-deplace,.lb-sens{transform-origin:0 0}',
      '.lb-vp{opacity:0}',
      '.lb-vf,.lb-vp{transform-origin:40px 66px}',
      '.lb-on .lb-vf{animation-name:lbVF}',kfTemps('lbVF',M.temps,function(t){var p=AR(t).pv;return 'opacity:'+f1((1-p)*100)/100+';transform:scaleX('+f1((1-.55*p)*100)/100+')';}),
      '.lb-on .lb-vp{animation-name:lbVP}',kfTemps('lbVP',M.temps,function(t){var p=AR(t).pv;return 'opacity:'+f1(p*100)/100+';transform:scaleX('+f1((.45+.55*p)*100)/100+')';}),
      '.lb-on .lb-p-ar{animation-name:lbPAr;transform-origin:40px 46px}',kfFonction('lbPAr',.1,function(t){return 'transform:rotate('+dg(AR(t).pAr)+')';}),
      '.lb-on .lb-p-av{animation-name:lbPAv;transform-origin:40.6px 46px}',kfFonction('lbPAv',.1,function(t){return 'transform:rotate('+dg(AR(t).pAv)+')';}),
      '.lb-on .lb-p-avav{animation-name:lbPAvav;transform-origin:45.6px 55px}',kfFonction('lbPAvav',.1,function(t){return 'transform:rotate('+dg(AR(t).pAvav)+')';}),
      '.lb-on .lb-deplace{animation-name:lbDep}',kfFonction('lbDep',.1,function(t){var a=AR(t);return 'transform:translate('+f1(a.x)+'px,'+f1(a.y)+'px)';}),
      '.lb-on .lb-sens{animation-name:lbSens}',kfFonction('lbSens',.05,function(t){return 'transform:scaleX('+f1(AR(t).f*100)/100+')';}),
      '.lb-on .lb-cu-g{animation-name:lbCuG;transform-origin:40px 66px}',kfTemps('lbCuG',M.tempsJambes,function(t){return 'transform:rotate('+dg(AR(t).cuG)+')';}),
      '.lb-on .lb-ti-g{animation-name:lbTiG;transform-origin:40px 76.6px}',kfTemps('lbTiG',M.tempsJambes,function(t){return 'transform:rotate('+dg(AR(t).tiG)+')';}),
      '.lb-on .lb-cu-d{animation-name:lbCuD;transform-origin:40px 66px}',kfTemps('lbCuD',M.tempsJambes,function(t){return 'transform:rotate('+dg(AR(t).cuD)+')';}),
      '.lb-on .lb-ti-d{animation-name:lbTiD;transform-origin:40px 76.6px}',kfTemps('lbTiD',M.tempsJambes,function(t){return 'transform:rotate('+dg(AR(t).tiD)+')';}),
      '.lb-on .lb-corps{animation-name:lbCorps;transform-origin:40px 68px}',kfFonction('lbCorps',.1,function(t){var a=AR(t);return 'transform:rotate('+dg(a.corps)+') translateY('+f1(a.bob)+'px)';}),
      '.lb-on .lb-bras-av{animation-name:lbBrasAv;transform-origin:'+ART.epaule[0]+'px '+ART.epaule[1]+'px}',kfFonction('lbBrasAv',.1,function(t){return 'transform:rotate('+dg(AR(t).brasAv)+')';}),
      '.lb-on .lb-avbras-av{animation-name:lbAvBrasAv;transform-origin:'+ART.coude[0]+'px '+ART.coude[1]+'px}',kfFonction('lbAvBrasAv',.1,function(t){return 'transform:rotate('+dg(AR(t).avbrasAv)+')';}),
      '.lb-on .lb-fiole{animation-name:lbFiole;transform-origin:'+ART.main[0]+'px '+ART.main[1]+'px}',kfFonction('lbFiole',.1,function(t){return 'transform:rotate('+dg(AR(t).fiole)+')';}),
      '.lb-on .lb-bras-ar{animation-name:lbBrasAr;transform-origin:'+ART.epauleAr[0]+'px '+ART.epauleAr[1]+'px}',kfFonction('lbBrasAr',.1,function(t){return 'transform:rotate('+dg(AR(t).brasAr)+')';}),
      '.lb-on .lb-avbras-ar{animation-name:lbAvBrasAr;transform-origin:'+ART.coudeAr[0]+'px '+ART.coudeAr[1]+'px}',kfFonction('lbAvBrasAr',.1,function(t){return 'transform:rotate('+dg(AR(t).avbrasAr)+')';}),
      /* niveaux de potion (translateY en pixels de l'image du verre) et filets versés */
      '.lb-on .lb-niv-f{animation-name:lbNivF}',kfFonction('lbNivF',.2,function(t){return 'transform:translateY('+f1(-M.niveau(t,0,.24)*306)+'px)';}),
      '.lb-on .lb-niv-t{animation-name:lbNivT}',kfFonction('lbNivT',.2,function(t){return 'transform:translateY('+f1(-M.niveau(t,1,.22)*197)+'px)';}),
      '.lb-on .lb-niv-b{animation-name:lbNivB}',kfFonction('lbNivB',.2,function(t){return 'transform:translateY('+f1(-M.niveau(t,2,.24)*288)+'px)';}),
      '.lb-filet{opacity:0}',
      '.lb-on .lb-filet-f{animation-name:lbFiletF}',kfFonction('lbFiletF',.1,function(t){var v=M.filet(t,0);return 'opacity:'+f1(v*10)/10+';transform:scaleY('+f1(v*100)/100+')';}),
      '.lb-on .lb-filet-t{animation-name:lbFiletT}',kfFonction('lbFiletT',.1,function(t){var v=M.filet(t,1);return 'opacity:'+f1(v*10)/10+';transform:scaleY('+f1(v*100)/100+')';}),
      '.lb-on .lb-filet-b{animation-name:lbFiletB}',kfFonction('lbFiletB',.1,function(t){var v=M.filet(t,2);return 'opacity:'+f1(v*10)/10+';transform:scaleY('+f1(v*100)/100+')';}),
      /* petits gestes (boucle de 2,4 s) : tête, cheveux, blouse, yeux, bouche, doigts, bulles */
      '.lb-on .lb-tete{animation:lbTete var(--T) ease-in-out infinite;transform-origin:41px 41px}',
      kf('lbTete','0%,100%{transform:rotate(0)}20%{transform:rotate(3deg)}40%{transform:rotate(-2deg)}55%{transform:rotate(-9deg)}62%{transform:rotate(-6deg)}68%{transform:rotate(-9deg)}78%{transform:rotate(-3deg)}'),
      '.lb-on .lb-doigts{animation:lbDoigts calc(var(--T)*.5) ease-in-out infinite;transform-origin:31px 67px}',
      kf('lbDoigts','0%,100%{transform:rotate(0)}25%{transform:rotate(4deg)}75%{transform:rotate(-4deg)}'),
      '.lb-on .lb-cheveux{animation:lbCheveux var(--T) ease-in-out infinite;animation-delay:calc(var(--T)*-.06);transform-origin:41px 24px}',
      kf('lbCheveux','0%,100%{transform:rotate(0)}20%{transform:rotate(4deg)}40%{transform:rotate(-3deg)}55%{transform:rotate(-10deg)}62%{transform:rotate(-6deg)}68%{transform:rotate(-10deg)}80%{transform:rotate(3deg)}'),
      '.lb-on .lb-pan{animation:lbPan var(--T) ease-in-out infinite;animation-delay:calc(var(--T)*-.08);transform-origin:40px 66px}',
      kf('lbPan','0%,100%{transform:rotate(0)}25%{transform:rotate(3deg)}50%{transform:rotate(-3deg)}62%{transform:rotate(4deg)}75%{transform:rotate(-3deg)}'),
      '.lb-on .lb-pupilles{animation:lbPup var(--T) ease-in-out infinite}',
      kf('lbPup','0%,100%{transform:translate(0,0)}15%,40%{transform:translate(.9px,.5px)}50%,70%{transform:translate(-.4px,-.7px)}85%{transform:translate(.5px,.2px)}'),
      '.lb-on .lb-sourcils{animation:lbSourcils var(--T) ease-in-out infinite}',
      kf('lbSourcils','0%,50%,82%,100%{transform:translateY(0)}58%,74%{transform:translateY(-1.3px)}'),
      '.lb-on .lb-bouche{animation:lbBouche var(--T) ease-in-out infinite;transform-origin:48px 38px}',
      kf('lbBouche','0%,52%,80%,100%{transform:scaleY(1)}58%,72%{transform:scaleY(1.35)}'),
      '.lb-on .lb-lueur{animation:lbLueur var(--T) ease-in-out infinite}',
      kf('lbLueur','0%,100%{opacity:.35}45%{opacity:1}'),
      '.lb-on .lb-ondule{animation:lbOndule var(--T) ease-in-out infinite}',
      kf('lbOndule','0%,100%{transform:translateY(0)}25%{transform:translateY(-.7px)}75%{transform:translateY(.7px)}'),
      '.lb-on .lb-niveau{animation:lbNiveau calc(var(--T)*1.5) ease-in-out infinite}',
      kf('lbNiveau','0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}'),
      '.lb-bul{opacity:0}',
      '.lb-on .lb-bul{animation:lbBul calc(var(--T)*.7) linear infinite}',
      kf('lbBul','0%{transform:translateY(0);opacity:0}15%{opacity:1}80%{opacity:1}100%{transform:translateY(var(--mont));opacity:0}'),
      '.lb-on .lb-petite-b{animation:lbPetiteB calc(var(--T)*.5) linear infinite}',
      kf('lbPetiteB','0%{transform:translateY(0);opacity:0}20%{opacity:1}100%{transform:translateY(-6px);opacity:0}'),
      '@media (prefers-reduced-motion:reduce){.lb *{animation:none!important}.lb-bul{opacity:0}.lb-filet{opacity:0}}'];
    return o.join('\n');
  }

  window.__SOREAL_IDLE_LABOS_SAVANTS_V1__={scene:scene,css:css,labos:LABOS,cellules:CELLULES,pieces:PIECES,interieurs:INTERIEURS,modele:modele};
})();
