/*
 * SOREAL IDLE — les savants fous des Labos (Norman, 2026-11-08 : « transformer les mineurs d'or en Labos : des savants fous qui concoctent des potions pour qu'on gagne l'effet ; style cartoon »).
 *
 * Une scène de labo = UN SVG (316 x 268) en couches, de l'arrière vers l'avant : le décor (recadrage de decors.webp), le SAVANT FOU (dessiné ici, articulé, animé), l'établi, le LIQUIDE de chaque ustensile (dessiné ici, découpé dans la forme réelle
 * du verre), puis le VERRE transparent par-dessus. Les images (décor, établi, flacon, tubes, bécher) viennent de cloudflare/public/img/mineurs/labos/ ; les formes intérieures des verres ont été MESURÉES sur ces images (canal alpha).
 * Le savant est un squelette de groupes (corps, tête, deux bras en deux segments, cheveux, blouse, sourcils, pupilles, bouche) : chaque articulation tourne autour de son vrai pivot, avec des retards (cheveux, pan de blouse) pour un mouvement crédible.
 * Boucles parfaites (AGENTS.md règle n°3) : toutes les animations ont une période multiple de la même durée (--T = 2,4 s), commencent et finissent à la même valeur ; seuls transform et opacity sont animés ; mouvement réduit : tout est immobile.
 * Expose window.__SOREAL_IDLE_LABOS_SAVANTS_V1__ = { scene(id, images, travaille), css(), labos }.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_LABOS_SAVANTS_V1__)return;

  var L=316,H=268;
  /* coin haut gauche du recadrage de chaque labo dans decors.webp (1262 x 848), mesuré sur l'image réelle */
  var CELLULES={drop:[8,16],wandoos:[319,16],stats:[627,16],adventure:[940,16],energyNgu:[8,290],magicNgu:[319,290],energyBeard:[627,290],magicBeard:[940,290],pp:[8,564],daycare:[319,564],blood:[627,564],experience:[940,564]};
  /* pièces posées sur l'établi : taille de l'image (px), largeur affichée, centre et base (px de la scène) */
  var PIECES={
    etabli:{w0:603,h0:321,w:172,cx:222,base:243},
    flacon:{w0:274,h0:378,w:54,cx:192,base:168},
    tubes:{w0:265,h0:325,w:50,cx:240,base:169},
    becher:{w0:222,h0:324,w:27,cx:283,base:168}
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

  /* ---------- le savant fou (coordonnées locales : centre x = 40, pieds y = 90) ---------- */
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
    /* cheveux fous, rejetés vers l'arrière puisque le savant regarde à droite (derrière le chapeau) */
    if(coupe==='frise')return '<path d="M33.2 31C28.4 30.4 27 25 30.6 22.6C29.2 17.8 34.6 14.4 38.2 16.6C40.2 12.6 46.4 12.8 47.6 17.4C51.6 17.8 53 22.4 50.8 25.6C47.4 22.6 43 21.6 39 22.8C36 23.8 34 27 33.2 31Z" fill="'+c+'"'+CT+'/>';
    return '<path d="M33 29.4C30 26.4 31 22 34 20.6L31 14 37 17.6 37.6 9.6 41.6 17.2 45.4 10.6 46 18.4 51.4 14.4 49.4 22C46 20 42 19.6 38 21 35.6 22 33.4 25 33 29.4Z" fill="'+c+'"'+CT+'/>';
  }
  function savant(s,v){
    var pot=v.c[0],pot2=v.c[1],fm=v.forme;
    var o='<g class="lb-savant">';
    /* jambes + chaussures (pantalon sombre) */
    o+='<g class="lb-jambes">'+seg(36.2,66,35,85,5,'#3b3552')+seg(44,66,45.6,85,5,'#3b3552')+
       '<path d="M29.6 87.4c0-2.4 2.2-3.8 5-3.8h3.6c1.6 0 2.8 1.2 2.8 2.8 0 1.6-1.2 2.6-2.8 2.6h-6c-1.6 0-2.6-.6-2.6-1.6z" fill="#c8421e"'+CT+'/>'+
       '<path d="M40.4 87.4c0-2.4 2.2-3.8 5-3.8H49c1.6 0 2.8 1.2 2.8 2.8 0 1.6-1.2 2.6-2.8 2.6h-6c-1.6 0-2.6-.6-2.6-1.6z" fill="#c8421e"'+CT+'/></g>';
    o+='<g class="lb-corps">';
    /* bras arrière (gauche) : main ouverte en griffe de savant fou, doigts écartés qui frétillent */
    var doigts='';[-50,-17,17,50].forEach(function(a){var r=a*Math.PI/180;doigts+=seg(23.6,43.2,f1(23.6+4.6*Math.sin(r)),f1(43.2-4.6*Math.cos(r)),1.5,s.peau);});
    o+='<g class="lb-bras-ar">'+seg(34,46,28,55,5,ombre(s.blouse))+
       '<g class="lb-avbras-ar">'+seg(28,55,24,45,4.4,ombre(s.blouse))+'<g class="lb-doigts">'+doigts+'</g><circle cx="23.6" cy="43.4" r="2.9" fill="'+s.peau+'"'+CT+'/></g></g>';
    /* blouse : buste puis pan qui se balance */
    o+='<path d="M30 47c0-4.4 3.4-7 7.6-7.4h5.6c4.2.4 7.6 3 7.6 7.4l1.6 22H28.4z" fill="'+s.blouse+'"'+CT+'/>';
    o+='<path d="M36.4 40.2l3.6 7.4 3.6-7.4z" fill="#fff"'+CT+'/><path d="M38.8 46.4h2.4l1 8.6-2.2 2.4-2.2-2.4z" fill="#e8362f"'+CT+'/>';
    o+='<circle cx="40" cy="60" r="1.1" fill="#1b1008"/><circle cx="40" cy="65.4" r="1.1" fill="#1b1008"/>';
    o+='<rect x="30.8" y="55.4" width="6.2" height="5.4" rx="1" fill="rgba(0,0,0,.14)"'+CT+'/><path d="M33 55.4v-3.2M35.2 55.4v-3.8" stroke="#e8362f" stroke-width="1.3" stroke-linecap="round"/>';
    o+='<g class="lb-pan"><path d="M28.4 68H51.6l2.2 9c-8.6 2.6-19.4 2.6-27.6 0z" fill="'+s.blouse+'"'+CT+'/></g>';
    /* bras avant (droit) : secoue une fiole de potion */
    o+='<g class="lb-bras-av">'+seg(47,46,57.5,37.5,5,s.blouse)+
       '<g class="lb-avbras-av">'+seg(57.5,37.5,60.5,25.5,4.6,s.blouse)+
       '<path d="M58.6 19.6h3.8v5.4l5.4 9.6c.7 1.3 0 2.5-1.6 2.5H54.8c-1.6 0-2.3-1.2-1.6-2.5l5.4-9.6z" fill="rgba(255,255,255,.35)"'+CT+'/>'+
       '<clipPath id="lbf-'+v.id+'"><path d="M59.6 20.6h1.8v5.4l5.2 9.2H54.4L59.6 26z"/></clipPath>'+
       '<g clip-path="url(#lbf-'+v.id+')"><rect x="52" y="29" width="18" height="10" fill="'+pot+'"/><g class="lb-ondule"><path d="M52 29c3 1.4 5 1.4 8 0s5-1.4 8 0V32H52z" fill="'+pot+'"/></g>'+forme(fm,59.6,33.4,1.1,pot2)+'</g>'+
       '<g class="lb-petite-b"><circle cx="60.4" cy="31" r=".9" fill="#fff" opacity=".85"/></g>'+
       '<circle cx="60.4" cy="25.8" r="2.9" fill="'+s.peau+'"'+CT+'/></g></g>';
    /* tête de profil (le savant regarde à droite) */
    o+='<g class="lb-tete">'+
       '<g class="lb-cheveux">'+cheveux(s.coupe,s.cheveux)+'</g>'+
       '<rect x="37.4" y="38" width="6" height="6" fill="'+s.peau+'"'+CT+'/>'+
       '<path d="M32.5 31C31.2 23.5 35.5 19.6 41 19.6C46 19.6 49.6 22.4 50 27.4C50.1 29.2 50.4 30.6 51 31.8C53.6 33.6 53.4 35.4 50.6 35.6L49.6 35.8C50.2 37 49.8 38 48.6 38.8C49 40.8 46.6 42 44 41.6C38.6 41 33.4 37.6 32.5 31Z" fill="'+s.peau+'"'+CT+'/>'+
       '<ellipse cx="37.6" cy="32.2" rx="1.9" ry="2.7" fill="'+s.peau+'"'+CT+'/><path d="M37.2 31.2q1 1.2 0 2.6" stroke="rgba(0,0,0,.4)" stroke-width=".7" fill="none" stroke-linecap="round"/>';
    if(s.barbe)o+='<path d="M44 39C50.4 38.6 52.2 46 47.4 52.4C44.4 55.4 40.4 54.4 38 50.4C36 46.6 36.6 41.6 40.2 40.2C41.6 39.6 42.8 39.2 44 39Z" fill="'+s.barbe+'"'+CT+'/><path d="M41.4 42.6c.8 3.6.2 7 2.6 9.6M45.6 42.4c0 3.4-.4 6-2 8.6" stroke="rgba(0,0,0,.28)" stroke-width="1.1" fill="none" stroke-linecap="round"/>';
    /* lunette de savant fou vue de profil : sangle qui fait le tour de la tête, un seul verre (le près) */
    o+='<path d="M43.4 28.2L32.8 27.2" stroke="'+s.lunettes+'" stroke-width="2.2" stroke-linecap="round"/><path d="M43.4 28.2L32.8 27.2" stroke="#1b1008" stroke-width=".5" opacity=".5"/>'+
       '<ellipse cx="46.8" cy="28.8" rx="3.9" ry="4.8" fill="#fff" stroke="'+s.lunettes+'" stroke-width="2.1"/><ellipse cx="46.8" cy="28.8" rx="4.9" ry="5.8" fill="none" stroke="#1b1008" stroke-width=".7" opacity=".55"/>'+
       '<g class="lb-pupilles"><circle cx="48.2" cy="29" r="1.7" fill="#1b1008"/></g>'+
       '<g class="lb-lueur"><path d="M44.2 26.2c.9-.8 2-1 3-.7" stroke="#fff" stroke-width="1.1" fill="none" stroke-linecap="round"/></g>'+
       '<g class="lb-sourcils"><path d="M43.4 23.2L50.6 21.2" stroke="#1b1008" stroke-width="1.8" stroke-linecap="round"/></g>';
    /* grande bouche de rire, sur le devant du visage */
    o+='<g class="lb-bouche"><path d="M46.2 36C47.6 36.6 49 36.2 49.6 35.7C49.8 38 49 39.8 47.4 39.5C46 39.2 45.6 37.4 46.2 36Z" fill="#6a1a26"'+CT+'/><path d="M46.8 36.6h2.4" stroke="#fff" stroke-width="1.3" stroke-linecap="round"/></g>';
    if(s.chapeau&&CHAPEAUX[s.chapeau])o+=CHAPEAUX[s.chapeau]();
    o+='</g>';   /* tête */
    o+='</g></g>';   /* corps, savant */
    return o;
  }

  /* ---------- le liquide d'un ustensile, découpé dans la forme réelle de son verre ---------- */
  function liquide(cle,niveau,v,idu){
    var I=INTERIEURS[cle],h=I.y1-I.y0,yn=Math.round(I.y1-niveau*h),w=I.x1-I.x0;
    var pot=v.c[0],pot2=v.c[1],id='lbc-'+idu+'-'+cle,n=3,b='';
    for(var i=0;i<n;i++){
      var bx=Math.round(I.x0+w*(0.25+0.25*i)),r=Math.max(7,Math.round(w*0.07));
      b+='<g class="lb-bul" style="--mont:-'+Math.round((I.y1-yn)*0.8)+'px;animation-delay:calc(var(--T)*-'+(i*0.3).toFixed(2)+')">'+forme(v.forme,bx,I.y1-30,r,'rgba(255,255,255,.88)')+'</g>';
    }
    return '<clipPath id="'+id+'"><path d="'+I.p+'"/></clipPath>'+
      '<g clip-path="url(#'+id+')"><g class="lb-niveau"><rect x="'+I.x0+'" y="'+yn+'" width="'+w+'" height="'+(h+20)+'" fill="'+pot+'"/>'+
      '<rect x="'+I.x0+'" y="'+Math.round(yn+h*0.35)+'" width="'+w+'" height="'+Math.round(h)+'" fill="'+pot2+'" opacity=".55"/>'+
      '<path d="M'+I.x0+' '+yn+'c'+Math.round(w*.2)+' '+Math.round(-h*.05)+' '+Math.round(w*.3)+' '+Math.round(-h*.05)+' '+Math.round(w*.5)+' 0s'+Math.round(w*.3)+' '+Math.round(h*.05)+' '+Math.round(w*.5)+' 0v'+Math.round(h*.06)+'H'+I.x0+'z" fill="'+pot+'"/></g>'+b+'</g>';
  }
  function pose(p){var k=p.w/p.w0;return {k:k,x:f1(p.cx-p.w/2),y:f1(p.base-p.h0*k)};}

  /* La scène complète d'un labo. images = {decor, etabli, flacon, tubes, becher} (URL ou data:) ; travaille = animations actives */
  function scene(id,images,travaille){
    var v=LABOS[id],c=CELLULES[id];if(!v||!c)return '';
    v.id=id;
    var idu=id,pe=pose(PIECES.etabli),pf=pose(PIECES.flacon),pt=pose(PIECES.tubes),pb=pose(PIECES.becher);
    var sav='<g transform="translate(18 69) scale(1.75)">'+savant(v.s,v)+'</g>';
    var verre=function(cle,pz,p,liq){return '<g transform="translate('+p.x+' '+p.y+') scale('+f1(p.k*1000)/1000+')">'+liq+'<image href="'+images[cle]+'" width="'+pz.w0+'" height="'+pz.h0+'"/></g>';};
    return '<svg class="lb'+(travaille?' lb-on':'')+'" viewBox="0 0 '+L+' '+H+'" role="img" aria-label="'+v.nom+'" focusable="false">'+
      '<svg x="0" y="0" width="'+L+'" height="'+H+'" viewBox="'+c[0]+' '+c[1]+' '+L+' '+H+'"><image href="'+images.decor+'" width="1262" height="848"/></svg>'+
      sav+
      '<image href="'+images.etabli+'" x="'+pe.x+'" y="'+pe.y+'" width="'+PIECES.etabli.w+'" height="'+f1(PIECES.etabli.h0*pe.k)+'"/>'+
      verre('flacon',PIECES.flacon,pf,liquide('flacon',.62,v,idu))+
      verre('tubes',PIECES.tubes,pt,liquide('tubeG',.7,v,idu)+liquide('tubeD',.45,v,idu))+
      verre('becher',PIECES.becher,pb,liquide('becher',.5,v,idu))+
      '</svg>';
  }

  /* ---------- le style (une seule fois) : transform et opacity seulement, période commune --T ---------- */
  function css(){
    var T='.lb{--T:2.4s;display:block;width:100%;height:auto}';
    function kf(nom,pas){return '@keyframes '+nom+'{'+pas+'}';}
    function ro(deg,tx,ty){return 'transform:rotate('+deg+'deg)'+(tx!==undefined?' translate('+tx+'px,'+ty+'px)':'');}
    var o=[T,
      '.lb *{transform-box:view-box}',
      '.lb-on .lb-corps{animation:lbCorps var(--T) ease-in-out infinite;transform-origin:40px 68px}',
      kf('lbCorps','0%,100%{transform:rotate(1.2deg) translateY(0)}25%{transform:rotate(2.4deg) translateY(-.5px)}50%{transform:rotate(.6deg) translateY(.3px)}58%{transform:rotate(1deg) translateY(-1px)}64%{transform:rotate(1.4deg) translateY(.3px)}70%{transform:rotate(1deg) translateY(-1px)}78%{transform:rotate(1.2deg) translateY(0)}'),
      '.lb-on .lb-tete{animation:lbTete var(--T) ease-in-out infinite;transform-origin:41px 41px}',
      kf('lbTete','0%,100%{transform:rotate(0)}20%{transform:rotate(3deg)}40%{transform:rotate(-2deg)}55%{transform:rotate(-9deg)}62%{transform:rotate(-6deg)}68%{transform:rotate(-9deg)}78%{transform:rotate(-3deg)}'),
      '.lb-on .lb-bras-av{animation:lbBrasAv var(--T) ease-in-out infinite;transform-origin:47px 46px}',
      kf('lbBrasAv','0%,100%{transform:rotate(0)}18%{transform:rotate(-6deg)}36%{transform:rotate(4deg)}52%{transform:rotate(-14deg)}60%{transform:rotate(-8deg)}70%{transform:rotate(-14deg)}85%{transform:rotate(2deg)}'),
      '.lb-on .lb-avbras-av{animation:lbAvBrasAv var(--T) ease-in-out infinite;transform-origin:57.5px 37.5px}',
      kf('lbAvBrasAv','0%,100%{transform:rotate(0)}8%{transform:rotate(14deg)}16%{transform:rotate(-10deg)}24%{transform:rotate(14deg)}32%{transform:rotate(-10deg)}40%{transform:rotate(12deg)}48%{transform:rotate(-6deg)}56%{transform:rotate(-20deg)}64%{transform:rotate(-12deg)}72%{transform:rotate(-20deg)}80%{transform:rotate(8deg)}88%{transform:rotate(-4deg)}'),
      '.lb-on .lb-bras-ar{animation:lbBrasAr var(--T) ease-in-out infinite;transform-origin:34px 46px}',
      kf('lbBrasAr','0%,100%{transform:rotate(0)}25%{transform:rotate(-8deg)}50%{transform:rotate(6deg)}62%{transform:rotate(-16deg)}70%{transform:rotate(-6deg)}78%{transform:rotate(-16deg)}'),
      '.lb-on .lb-avbras-ar{animation:lbAvBrasAr var(--T) ease-in-out infinite;transform-origin:28px 55px}',
      kf('lbAvBrasAr','0%,100%{transform:rotate(0)}20%{transform:rotate(10deg)}45%{transform:rotate(-10deg)}62%{transform:rotate(14deg)}78%{transform:rotate(-6deg)}'),
      '.lb-on .lb-doigts{animation:lbDoigts calc(var(--T)*.5) ease-in-out infinite;transform-origin:23.6px 43.2px}',
      kf('lbDoigts','0%,100%{transform:rotate(0)}25%{transform:rotate(8deg)}75%{transform:rotate(-8deg)}'),
      '.lb-on .lb-cheveux{animation:lbCheveux var(--T) ease-in-out infinite;animation-delay:calc(var(--T)*-.06);transform-origin:41px 24px}',
      kf('lbCheveux','0%,100%{transform:rotate(0)}20%{transform:rotate(4deg)}40%{transform:rotate(-3deg)}55%{transform:rotate(-10deg)}62%{transform:rotate(-6deg)}68%{transform:rotate(-10deg)}80%{transform:rotate(3deg)}'),
      '.lb-on .lb-pan{animation:lbPan var(--T) ease-in-out infinite;animation-delay:calc(var(--T)*-.08);transform-origin:40px 66px}',
      kf('lbPan','0%,100%{transform:rotate(0)}25%{transform:rotate(3deg)}50%{transform:rotate(-3deg)}62%{transform:rotate(4deg)}75%{transform:rotate(-3deg)}'),
      '.lb-on .lb-pupilles{animation:lbPup var(--T) ease-in-out infinite}',
      kf('lbPup','0%,100%{transform:translate(0,0)}15%,40%{transform:translate(.9px,.5px)}50%,70%{transform:translate(-.4px,-.7px)}85%{transform:translate(.5px,.2px)}'),
      '.lb-on .lb-sourcils{animation:lbSourcils var(--T) ease-in-out infinite}',
      kf('lbSourcils','0%,50%,82%,100%{transform:translateY(0)}58%,74%{transform:translateY(-1.3px)}'),
      '.lb-on .lb-bouche{animation:lbBouche var(--T) ease-in-out infinite;transform-origin:45px 38px}',
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
      '@media (prefers-reduced-motion:reduce){.lb *{animation:none!important}.lb-bul{opacity:0}}'];
    return o.join('\n');
  }

  window.__SOREAL_IDLE_LABOS_SAVANTS_V1__={scene:scene,css:css,labos:LABOS,cellules:CELLULES,pieces:PIECES,interieurs:INTERIEURS};
})();
