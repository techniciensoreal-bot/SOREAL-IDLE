/*
 * SOREAL IDLE — le panneau LED de la borne d'arcade (menu Combat de boss), posé JUSTE AU-DESSUS DE LA BARRE DE VIE DU BOSS (dans la plaque du duel) ; le fronton « NGU IDLE » est inchangé.
 * Maquette validée par Norman (2026-11-01) : « J'aime bien tout. Mais la barre de vie du boss doit rester affichée comme elle l'est actuellement. Cet écran se situe juste au-dessus. »
 *
 * Principe : une matrice de points (120 x 14 sur PC, 90 x 12 sur téléphone) dessinée dans UN SEUL canvas, sans bibliothèque. Chaque scène est une FONCTION PURE
 * du temps (secondes depuis son début) : aucune image n'est gardée d'une image à l'autre. Le panneau est purement décoratif : il lit l'état du jeu, il n'y écrit jamais et ne retarde aucun combat.
 *
 * Ce qui s'affiche (rien n'est inventé côté serveur, tout vient d'événements ou d'états déjà présents dans la page) :
 *   - par défaut « #<numéro> · <NOM DU BOSS> » : les données de l'ancienne plaque du duel, qu'il REMPLACE (bossSelection, bossActuel ; le nom, traduit en anglais, est lu dans le span masqué #sorealIdleBossNomTexteV65) ; sans boss connu : « SOREAL IDLE » ;
 *   - début d'un duel (REG.idleCombatDebutV1 change) : FIGHT ! lettre par lettre, avec secousse (aucun compte à rebours : le jeu combat déjà, rien n'est retardé) ;
 *   - pendant TOUT le combat (idleEtat.combatBossActif, de REG.idleCombatDebutV1 jusqu'à la victoire, le K.O. ou l'arrêt) : FIGHT ! reste affiché en boucle parfaite ; par-dessus, brièvement : POW ! / BAM !, la barre de vie du JOUEUR (cœur), la mascotte qui court ; la vie du BOSS n'est PAS sur le panneau (la vraie barre, juste dessous, reste seule) ; au boss suivant (combat enchaîné) FIGHT ! reste sans clignoter ;
 *   - un coup (le résumé de combat d'une seconde, REG.idleCombatLogDernierResumeV70, un sur trois) : POW ! / BAM ! en alternance (aucun « critique » n'existe côté client : aucun n'est affiché) ;
 *   - victoire (window.__SOREAL_IDLE_VICTOIRE_EN_COURS__ : même condition que l'écran de victoire arcade) : la ola puis VICTOIRE ! ;
 *   - défaite (REG.idleCombatEnPauseApresDefaiteV1) : K.O. puis RECOMMENCE ? (simple texte, aucun clic) ;
 *   - entre deux combats : « Le saviez-vous ? » (cinq phrases génériques, aucune information de jeu) et le tableau des scores (numéro du boss, victoires : jamais de total) ;
 *   - la caméra de stade (objet rare) N'EST PAS branchée : aucun événement « objet rare obtenu » fiable et neutre n'existe côté client.
 *
 * Règle n°2 : jamais le nom d'un boss non découvert (même source que la plaque) ; les phrases ne parlent de rien de verrouillé ; aucun dénominateur.
 * Règle n°3 : chaque scène s'allume et s'éteint en fondu (0,2 s) ; les motifs qui défilent sont fondus à leurs deux bouts ; prefers-reduced-motion = images fixes (aucune animation).
 * Règle n°4 : le canvas est ajouté PAR CE MODULE dans l'hôte `.bn-led` du HTML de la page, avec data-morph-garder (jamais retiré) et data-morph-vivant (ses attributs ne sont jamais retirés) ;
 *   un redessin de la page ne le remplace donc pas ; le module se rattache après chaque redessin (window.__SOREAL_IDLE_APRES_REDESSIN_V1__), dans la même tâche.
 * Performance : arrêt quand l'onglet est masqué (visibilitychange), quand la borne n'est pas à l'écran (IntersectionObserver) ou quand elle n'existe plus ; 30 images/s au plus sur téléphone.
 * Les textes sont dessinés dans le canvas (le traducteur de la page ne les voit pas) : petit dictionnaire interne français / anglais selon la langue du jeu (soreal_idle_langue_v1).
 *
 *   window.__SOREAL_IDLE_BORNE_LED_V1__ = { ensure(), etat() }
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_BORNE_LED_V1__)return;

/* ------------------------------------------------------------------ couleurs */
var AMB=1,ROU=2,BLA=3,VER=4,BLE=5,ROS=6,BARRE=7;
/* BARRE = la couleur de la barre de vie du boss : la teinte de CE boss (paletteBarreBossIdleV1_, ui-combat-1-v1.js), violet-rose par défaut (#a23fd6) ; recalculée à chaque changement de boss */
var RGB=[null,[255,168,28],[255,48,40],[255,246,222],[56,255,110],[70,150,255],[255,80,180],[162,63,214]];

/* ------------------------------------------------------------------ police pixel 5x7 (majuscules, chiffres, ponctuation) */
var F={
  'A':'01110 10001 10001 11111 10001 10001 10001','B':'11110 10001 10001 11110 10001 10001 11110',
  'C':'01110 10001 10000 10000 10000 10001 01110','D':'11110 10001 10001 10001 10001 10001 11110',
  'E':'11111 10000 10000 11110 10000 10000 11111','F':'11111 10000 10000 11110 10000 10000 10000',
  'G':'01110 10001 10000 10111 10001 10001 01111','H':'10001 10001 10001 11111 10001 10001 10001',
  'I':'01110 00100 00100 00100 00100 00100 01110','J':'00111 00010 00010 00010 00010 10010 01100',
  'K':'10001 10010 10100 11000 10100 10010 10001','L':'10000 10000 10000 10000 10000 10000 11111',
  'M':'10001 11011 10101 10101 10001 10001 10001','N':'10001 11001 10101 10011 10001 10001 10001',
  'O':'01110 10001 10001 10001 10001 10001 01110','P':'11110 10001 10001 11110 10000 10000 10000',
  'Q':'01110 10001 10001 10001 10101 10010 01101','R':'11110 10001 10001 11110 10100 10010 10001',
  'S':'01111 10000 10000 01110 00001 00001 11110','T':'11111 00100 00100 00100 00100 00100 00100',
  'U':'10001 10001 10001 10001 10001 10001 01110','V':'10001 10001 10001 10001 10001 01010 00100',
  'W':'10001 10001 10001 10101 10101 10101 01010','X':'10001 10001 01010 00100 01010 10001 10001',
  'Y':'10001 10001 01010 00100 00100 00100 00100','Z':'11111 00001 00010 00100 01000 10000 11111',
  '0':'01110 10001 10011 10101 11001 10001 01110','1':'00100 01100 00100 00100 00100 00100 01110',
  '2':'01110 10001 00001 00010 00100 01000 11111','3':'11110 00001 00001 01110 00001 00001 11110',
  '4':'00010 00110 01010 10010 11111 00010 00010','5':'11111 10000 11110 00001 00001 10001 01110',
  '6':'00110 01000 10000 11110 10001 10001 01110','7':'11111 00001 00010 00100 01000 01000 01000',
  '8':'01110 10001 10001 01110 10001 10001 01110','9':'01110 10001 10001 01111 00001 00010 01100',
  '!':'00100 00100 00100 00100 00100 00000 00100','?':'01110 10001 00001 00010 00100 00000 00100',
  '.':'00000 00000 00000 00000 00000 01100 01100',',':'00000 00000 00000 00000 00100 00100 01000',
  ':':'00000 01100 01100 00000 01100 01100 00000','-':'00000 00000 00000 11111 00000 00000 00000',
  "'":'00100 00100 01000 00000 00000 00000 00000','#':'01010 01010 11111 01010 11111 01010 01010',
  '·':'00000 00000 00000 00100 00000 00000 00000','/':'00001 00010 00010 00100 01000 01000 10000',
  '%':'11001 11010 00010 00100 01000 01011 10011','+':'00000 00100 00100 11111 00100 00100 00000',
  '(':'00010 00100 01000 01000 01000 00100 00010',')':'01000 00100 00010 00010 00010 00100 01000',
  '*':'00000 10101 01110 11111 01110 10101 00000','>':'10000 01000 00100 00010 00100 01000 10000',
  '<':'00001 00010 00100 01000 00100 00010 00001','&':'01100 10010 10100 01000 10101 10010 01101',
  '"':'01010 01010 01010 00000 00000 00000 00000',';':'00000 01100 01100 00000 00100 00100 01000'
};
/* accents : deux rangées posées 3 et 2 lignes au-dessus du haut de la lettre (un blanc les sépare) ; a = aigu, g = grave, c = circonflexe, d = tréma */
var ACC={a:['00010','00100'],g:['01000','00100'],c:['00100','01010'],d:['01010','00000']};
var MARQUES={'́':'a','̀':'g','̂':'c','̈':'d'};
var GL={};
function bitsOf(s){return s.split(' ').map(function(r){return parseInt(r,2);});}
function mkGlyph(rows,acc){
  var mn=5,mx=-1,r,c,all=rows.concat(acc||[]);
  for(r=0;r<all.length;r++)for(c=0;c<5;c++)if(all[r]&(16>>c)){if(c<mn)mn=c;if(c>mx)mx=c;}
  if(mx<0){mn=0;mx=2;}   /* espace : 3 colonnes */
  return {rows:rows,acc:acc,x0:mn,w:mx-mn+1};
}
Object.keys(F).forEach(function(k){GL[k]=mkGlyph(bitsOf(F[k]));});
GL[' ']=mkGlyph([0,0,0,0,0,0,0]);
/* Un caractère que la police n'a pas : on le décompose (É = E + accent aigu) ; une marque inconnue (cédille, tilde, rond…) est simplement retirée (Ç devient C) ; un caractère sans équivalent est supprimé. */
function glyphDe(ch){
  if(GL[ch])return GL[ch];
  var d=ch.normalize?ch.normalize('NFD'):ch,base=d.charAt(0),marque=d.length>1?MARQUES[d.charAt(1)]:null;
  if(!F[base])return null;
  GL[ch]=marque?mkGlyph(bitsOf(F[base]),ACC[marque].map(function(s){return parseInt(s,2);})):GL[base];
  return GL[ch];
}
var REMPL={'’':"'",'‘':"'",'`':"'",'«':'"','»':'"','“':'"','”':'"','–':'-','—':'-','…':'...','Œ':'OE','Æ':'AE','ß':'SS','Ø':'O','Ł':'L','Đ':'D',' ':' ','\t':' ','_':'-','=':'-','•':'·','×':'X'};
/* Lettres d'unité des grands nombres (K, M, AB, TG…) en couleur (Norman, 2026-11-01 : « je veux aussi les lettres en couleur, AB etc ») : mêmes couleurs que partout dans le jeu, lues dans les règles .nb-suf[data-suf="…"] de la feuille de style (aucune table recopiée) ; une couleur de plus dans la palette par unité rencontrée. */
var SUF=null,SUF_RE=null,COUL_IDX={};
function suffixes(){
  if(SUF)return SUF;
  SUF={};
  try{
    for(var a=0;a<document.styleSheets.length;a++){
      var rules;try{rules=document.styleSheets[a].cssRules;}catch(_e){continue;}
      for(var b=0;rules&&b<rules.length;b++){
        var rg=rules[b],m=rg.selectorText&&/nb-suf\[data-suf="([A-Za-z]+)"\]/.exec(rg.selectorText),c=m&&rg.style&&/(\d+)[ ,]+(\d+)[ ,]+(\d+)/.exec(rg.style.color||'');
        if(m&&c)SUF[m[1].toUpperCase()]=[+c[1],+c[2],+c[3]];
      }
    }
  }catch(_e){}
  var ks=Object.keys(SUF).sort(function(x,y){return y.length-x.length;});
  SUF_RE=ks.length?new RegExp('(\\d(?:[\\d.,]*\\d)?)('+ks.join('|')+')(?![A-Za-z0-9])','g'):null;
  return SUF;
}
function indexCouleur(rgb){var k=rgb.join(',');if(COUL_IDX[k])return COUL_IDX[k];if(RGB.length>=250)return AMB;RGB.push(rgb);COUL_IDX[k]=RGB.length-1;return COUL_IDX[k];}
/* fn de text() : la couleur de l'unité pour chaque lettre d'unité, la couleur de base ailleurs */
function fnUnites(s){
  suffixes();
  if(!SUF_RE)return null;
  s=canon(s);var marques=[],m,any=false;
  SUF_RE.lastIndex=0;
  while((m=SUF_RE.exec(s))){var col=SUF[m[2]];if(!col)continue;var ci=indexCouleur(col),d=m.index+m[1].length;for(var i=0;i<m[2].length;i++)marques[d+i]=ci;any=true;}
  return any?function(i){return marques[i]||0;}:null;
}

/* texte → suite de caractères que la police sait dessiner */
function canon(s){
  var up=String(s==null?'':s).toUpperCase(),out='',i,ch;
  for(i=0;i<up.length;i++){
    ch=up.charAt(i);
    if(REMPL[ch]!==undefined)ch=REMPL[ch];
    if(ch.length>1){out+=ch;continue;}
    if(!glyphDe(ch))continue;
    if(!GL[ch]||ch.normalize&&!MARQUES[ch.normalize('NFD').charAt(1)]&&ch.normalize('NFD').length>1)ch=ch.normalize('NFD').charAt(0);   /* marque inconnue (cédille, tilde…) : on garde la lettre seule */
    out+=ch;
  }
  return out;
}
function gl(ch){return glyphDe(ch)||GL['?'];}

/* ------------------------------------------------------------------ sprites 1 bit (chaque lettre = une couleur) */
var SPR={
  coeurP:['.XX.XX.','XXXXXXX','XXXXXXX','.XXXXX.','..XXX..','...X...'],
  crane:['.XXX.','XXXXX','X.X.X','XXXXX','.XXX.','.X.X.'],
  hero1:['..WWW....','.WWWWW..W','.WAWAW.W.','..WWW.W..','.AAAAAW..','AAAAAAA..','..A.A....','.A...A...'],
  hero2:['..WWW....','.WWWWW..W','.WAWAW.W.','..WWW.W..','.AAAAAW..','AAAAAAA..','...AA....','...AA....'],
  hero3:['..WWW....','.WWWWW..W','.WAWAW.W.','..WWW.W..','.AAAAAW..','AAAAAAA..','..AAA....','.........'],
  pique:['.R.','RRR'],
  epee:['......W','.....WW','....WW.','.A.WW..','..AW...','.A.A...','A......']
};
var PAL={X:AMB,A:AMB,W:BLA,R:ROU,G:VER,B:BLE,P:ROS};

/* ------------------------------------------------------------------ dictionnaire interne (les textes du canvas échappent au traducteur de la page) */
var TXT={
  fr:{fight:'FIGHT !',tue:'TUÉ',fois:'FOIS',win:'VICTOIRE !',ko:'K.O.',again:'RECOMMENCE',boss:'BOSS',wins:'VICTOIRES',winsCourt:'VICT.',savLong:'LE SAVIEZ-VOUS',savCourt:'SAVIEZ-VOUS',marque:'SOREAL NGU IDLE',nuke:'NUKE !',boum:'BOUM !',alerte:'ALERTE !',nepas:'NE PAS APPUYER',super:'SUPER NUKE',j:'J',h:'H',min:'MIN',s:'S',
    objets:{energyPower:'Potion d’énergie',magicPower:'Potion de magie',r3Power:'Potion de Ressource 3',energyBars:'Bar Bar d’énergie',magicBars:'Bar Bar de magie',luck:'Porte-bonheur'},
    jokes:[]},   /* Norman (2026-11-01) : « je ne veux que les phrases que j'ai écrites » : aucune phrase d'origine, seulement celles de l'administrateur */
  en:{fight:'FIGHT !',tue:'KILLED',fois:'TIMES',win:'VICTORY !',ko:'K.O.',again:'TRY AGAIN',boss:'BOSS',wins:'WINS',winsCourt:'WINS',savLong:'DID YOU KNOW',savCourt:'DID YOU KNOW',marque:'SOREAL NGU IDLE',nuke:'NUKE !',boum:'BOOM !',alerte:'ALERT !',nepas:'DO NOT PRESS',super:'SUPER NUKE',j:'D',h:'H',min:'MIN',s:'S',
    objets:{energyPower:'Energy potion',magicPower:'Magic potion',r3Power:'Resource 3 potion',energyBars:'Energy Bar Bar',magicBars:'Magic Bar Bar',luck:'Lucky charm'},
    jokes:[]}
};
var langue='fr',langueLue=-1e9;
function langueDe(now){
  if(now-langueLue>1000){langueLue=now;try{langue=localStorage.getItem('soreal_idle_langue_v1')==='en'?'en':'fr';}catch(_e){langue='fr';}}
  return langue;
}
function T(k){return TXT[langue][k];}

/* ------------------------------------------------------------------ matrice et primitives (écrivent dans le panneau P en cours de dessin) */
var P=null;
function clamp(x,a,b){return x<a?a:x>b?b:x;}
function sm(x){x=clamp(x,0,1);return x*x*(3-2*x);}
function eo(x){x=clamp(x,0,1);return 1-Math.pow(1-x,3);}
function R(i,k){var x=Math.sin(i*127.1+k*311.7)*43758.5453;return x-Math.floor(x);}
function px(x,y,col,v){
  x=Math.round(x);y=Math.round(y+P.yoff);
  if(x<0||y<0||x>=P.W||y>=P.YM||y<P.cy0||y>P.cy1)return;
  if(v===undefined)v=255;
  if(v<=0)return;
  var i=y*P.W+x;P.c[i]=col;P.v[i]=v>255?255:v;
}
function rect(x,y,w,h,col,v){for(var j=0;j<h;j++)for(var i=0;i<w;i++)px(x+i,y+j,col,v);}
function box(x0,y0,x1,y1,col,v){
  var i;for(i=x0;i<=x1;i++){px(i,y0,col,v);px(i,y1,col,v);}
  for(i=y0+1;i<y1;i++){px(x0,i,col,v);px(x1,i,col,v);}
}
function sprite(rows,x,y,v,colOver){
  for(var j=0;j<rows.length;j++)for(var i=0;i<rows[j].length;i++){
    var ch=rows[j][i];if(ch==='.'||ch===' ')continue;
    px(x+i,y+j,colOver||PAL[ch]||AMB,v);
  }
}
/* Petite police 3x5 (chiffres, + - . /, A-Z) pour la régénération sous la jauge (Norman, 2026-11-01 : « tu peux écrire la regen plus petit ? ») : 5 rangées au lieu de 7, 3 colonnes au lieu de 5. */
var MINI={'0':'111101101101111','1':'010110010010111','2':'111001111100111','3':'111001111001111','4':'101101111001001','5':'111100111001111','6':'111100111101111','7':'111001010010010','8':'111101111101111','9':'111101111001111','.':'000000000000010','+':'000010111010000','-':'000000111000000','/':'001001010100100','A':'010101111101101','B':'110101110101110','C':'011100100100011','D':'110101101101110','E':'111100110100111','F':'111100110100100','G':'011100101101011','H':'101101111101101','I':'111010010010111','J':'001001001101010','K':'101101110101101','L':'100100100100111','M':'101111111101101','N':'110101101101101','O':'010101101101010','P':'110101110100100','Q':'010101101111011','R':'110101110101101','S':'011100010001110','T':'111010010010010','U':'101101101101111','V':'101101101101010','W':'101101111111101','X':'101101010101101','Y':'101101010010010','Z':'111001010100111'};
function miniWidth(s){s=canon(s);return Math.max(0,s.length*4-1);}
function miniText(s,x,bt,col,v,fn){
  s=canon(s);
  for(var i=0;i<s.length;i++){
    var g=MINI[s[i]];
    if(g)for(var r=0;r<5;r++)for(var c=0;c<3;c++)if(g[r*3+c]==='1'){var cc=fn?(fn(i)||col):col;px(x+i*4+c,bt+r,cc,v);}
  }
}
function twidth(s,sc){s=canon(s);var w=0;for(var i=0;i<s.length;i++)w+=gl(s[i]).w+1;return Math.max(0,(w-1))*sc;}
function rwidth(segs,sc){var w=0;segs.forEach(function(g,i){w+=twidth(g[0],sc)+(i?sc*2:0);});return w;}
/* bt = ligne du HAUT de la lettre (sans l'accent) ; opt.fn(i,gx,gy) -> couleur ou [couleur, luminosité] ; opt.edge={a,b,f} fondu latéral */
function text(s,x,bt,col,sc,v,opt){
  s=canon(s);sc=sc||1;if(v===undefined)v=255;opt=opt||{};
  var cx=x,i,r,c,g,bits;
  for(i=0;i<s.length;i++){
    g=gl(s[i]);
    for(r=-3;r<7;r++){
      if(r<0){if(!g.acc||r>-2)continue;bits=g.acc[r+3];}else bits=g.rows[r];
      if(!bits)continue;
      for(c=0;c<5;c++){
        if(!(bits&(16>>c)))continue;
        for(var sy=0;sy<sc;sy++)for(var sx=0;sx<sc;sx++){
          var gx=cx+(c-g.x0)*sc+sx,gy=bt+r*sc+sy,cc=col,vv=v;
          if(opt.fn){var q=opt.fn(i,gx,gy);if(q instanceof Array){cc=q[0]||col;vv=q[1]*v/255;}else cc=q||col;}
          if(opt.edge)vv*=clamp((gx-opt.edge.a)/opt.edge.f,0,1)*clamp((opt.edge.b-gx)/opt.edge.f,0,1);
          px(gx,gy,cc,vv);
        }
      }
    }
    cx+=(g.w+1)*sc;
  }
  return cx-x-sc;
}
function rich(segs,x,bt,sc,v,opt){var cx=x;segs.forEach(function(g){cx+=text(g[0],cx,bt,g[1],sc,v,opt)+sc*2;});return cx-x;}

/* ------------------------------------------------------------------ état lu dans le jeu (rempli avant chaque image ; les scènes ne font que le lire) */
var S={num:0,nom:'',nomJ:'',morts:0,vic:0,boss:false,combat:false,bar:{v:1,g:1,gv:0},obj:{},now:0,pv:null};

/* ------------------------------------------------------------------ scènes (fonctions pures du temps t en secondes depuis le début de la scène) */
function bigSc(s){return P.H>=14&&twidth(s,2)<=P.W-4?2:1;}   /* lettres doublées (échelle entière, jamais fractionnaire) quand la hauteur et la largeur le permettent, sinon taille simple */
function cb(){return Math.round((P.H-7)/2);}                       /* haut d'une ligne d'écriture centrée */
function chase(t,v,col){                                           /* guirlande de points qui courent sur le bord haut/bas (période 0,4 s) */
  var o=P.reduced?0:Math.floor(t*10)%4,x;
  for(x=0;x<P.W;x++){
    var a=(x-o+40)%4===0;
    px(x,0,col||AMB,a?230*v:28);px(P.W-1-x,P.H-1,col||AMB,a?230*v:28);
  }
}
function burst(cx,cy,u,n,seed,speed,life,cols,grav){
  if(u<0||u>life)return;
  for(var i=0;i<n;i++){
    var ang=R(i,seed)*6.2832,sp=speed*(0.35+0.65*R(i,seed+1));
    var x=cx+Math.cos(ang)*sp*u*1.6,y=cy+Math.sin(ang)*sp*u*0.8+0.5*grav*u*u;
    px(x,y,cols[Math.floor(R(i,seed+2)*cols.length)],255*Math.pow(1-u/life,1.2));
  }
}

/* 1. Affichage de base : « #n · NOM » (ou « SOREAL IDLE » quand aucun boss n'est connu) */
function sBase(t){
  var segs=S.boss?[['#'+S.num,BLA],['·',ROU],[S.nom,AMB]]:[[T('marque'),AMB]],W=P.W,bt=cb(),tw=rwidth(segs,1);
  chase(t,1);
  if(tw<=W-8){                                                     /* tient : fixe, avec un reflet blanc qui passe et un léger scintillement */
    var x0=Math.floor((W-tw)/2),xs=P.reduced?-99:((t/3.2)%1)*(W+40)-20;
    rich(segs,x0,bt,1,255,{fn:function(i,gx,gy){
      var vv=P.reduced?255:205+50*Math.sin(6.2832*(t/2+R(gx,gy)));
      return Math.abs(gx-xs)<4.5?[BLA,255]:[0,vv];
    }});
  }else{                                                           /* trop long : défile, fondu aux deux bouts */
    var per=tw+26,off=P.reduced?0:(t*26)%per;
    for(var k=0;k<2;k++)rich(segs,4-off+k*per,bt,1,255,{edge:{a:3,b:W-3,f:6}});
  }
}

/* 1 bis. « TUÉ N FOIS » (Norman, 2026-11-01 : « la bande passante au-dessus doit indiquer le nombre de fois qu'on l'a tué ») : nombre de victoires du boss COURANT (bestiaire.entrees[].victoires, la donnée de sa carte), jamais de total ; la scène n'existe pas à 0. */
function sMorts(t){
  var W=P.W,bt=cb(),n=String(Math.min(S.morts,999999)),num=[['#'+S.num,BLA],['·',ROU]];
  var cands=[num.concat([[T('tue')+' ',AMB],[n+' ',BLA],[T('fois'),AMB]]),[[T('tue')+' ',AMB],[n+' ',BLA],[T('fois'),AMB]],[['X ',AMB],[n,BLA]]],i,segs=cands[0],w=0;
  chase(t,1);
  for(i=0;i<cands.length;i++){w=11+rwidth(cands[i],1);if(w<=W-8){segs=cands[i];break;}if(i===cands.length-1){segs=cands[i];w=11+rwidth(segs,1);}}
  var x0=w<=W-8?Math.floor((W-w)/2):4;
  sprite(SPR.epee,x0,bt,255);
  rich(segs,x0+11,bt,1,255);
}

/* 2. FIGHT ! : affiché TOUT LE TEMPS du combat. À l'apparition (u < ~1 s) : lettre par lettre, secousse, anneau, cadre qui clignote ; ensuite une boucle PARFAITE de 2 s (reflet blanc qui traverse, luminosité qui respire ;
   début = fin, le reflet part et finit hors des lettres). u = temps depuis le début du combat : il continue pendant les interludes (coups, barre de vie, mascotte), le panneau revient donc à FIGHT ! sans repartir de zéro. */
function ring(p,col){
  var hx=6+(P.W/2-7)*p,hy=3+(P.H/2-4)*p,cx=P.W/2,cy=P.H/2;
  box(Math.round(cx-hx),Math.round(cy-hy),Math.round(cx+hx),Math.round(cy+hy),col,255*(1-p));
}
function sFight(t){
  var W=P.W,H=P.H,u=t,str=T('fight'),c=canon(str),sc=bigSc(str),tw=twidth(str,sc),bt=Math.round((H-7*sc)/2);
  var n=Math.min(c.length,Math.floor(u/0.07)+1),ap=!P.reduced&&u<1.1;
  var sh=ap&&u<0.6?Math.round(Math.sin(u*70)*1.3):0;
  var vv=P.reduced?255:255-sm((u-0.8)/0.5)*55*(0.5-0.5*Math.cos(6.2832*u/2));
  var xs=P.reduced?-99:((u/2)%1)*(W+30)-15;
  text(c.slice(0,n),Math.floor((W-tw)/2)+sh,bt,ROU,sc,vv,{fn:function(i,gx){
    if(ap&&u<0.6)return Math.floor(u/0.075)%2?BLA:ROU;
    return Math.abs(gx-xs)<3?[BLA,255]:[ROU,255];}});
  if(ap&&u<0.7)ring(clamp(u/0.7,0,1),ROU);
  if(ap&&u<1.1&&Math.floor(u/0.15)%2===0)box(0,0,W-1,H-1,ROU,220*(1-sm((u-0.8)/0.3)));
}

/* 3. Barre de vie à LED : UNIQUEMENT celle du joueur (cœur) ; la vie du boss n'est jamais sur le panneau */
function sBars(t){
  var W=P.W,H=P.H,bh=H>=18?5:4,y=Math.round((H-bh)/2),x0=11,len=W-3-x0,b=S.bar,x,j;
  chase(t,0.55,VER);
  for(x=0;x<len;x++){
    var f=(x+0.5)/len,seg=(x%5===4)?0.42:1,col,v;
    if(f<=b.v){col=b.v>0.5?VER:b.v>0.25?AMB:ROU;v=255;if(b.v<0.25&&!P.reduced&&Math.floor(t*4)%2)v=110;}
    else if(f<=b.g&&b.gv>0){col=BLA;v=255*b.gv;}
    else{col=AMB;v=34;seg=1;}
    for(j=0;j<bh;j++)px(x0+x,y+j,col,v*seg);
  }
  sprite(SPR.coeurP,2,y+Math.floor((bh-6)/2),255,b.v>0.5?VER:b.v>0.25?AMB:ROU);
}

/* 4. Messages de coups : POW ! / BAM ! (mot choisi au déclenchement, p.mot) */
function sHits(t){
  var W=P.W,H=P.H,s=P.p.mot||'POW !',sc=bigSc(s),tw=twidth(s,sc),bt=Math.round((H-7*sc)/2),u=t;
  var y=u<0.22?bt-Math.pow(1-u/0.22,2)*H:bt;
  var sh=u>0.22&&u<0.62?Math.round(Math.sin(u*90)*1.6*(1-(u-0.22)/0.4)):0;
  var col=AMB,vv=255*(1-sm((u-1.1)/0.35));
  if(u<0.5&&u>=0.22)col=BLA;
  text(s,Math.floor((W-tw)/2)+sh,y,col,sc,vv);
  var uu=u-0.22;
  burst(W/2,H/2,uu,26,10+(P.p.n||0)*7,26,0.9,[BLA,AMB,ROU],26);
  if(uu>=0&&uu<0.16){
    var Lg=2+uu*40;
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(function(d){for(var q=0;q<3;q++)px(W/2+d[0]*(Lg+q)*1.5,H/2+d[1]*(Lg+q)*0.6,BLA,255*(1-uu/0.16));});
  }
}

/* 5. Mascotte qui court et saute (boucle sans à-coup : la période des piques est celle du saut) */
function sMascot(t){
  var W=P.W,H=P.H,sp=30,per=50,T0=per/sp,hx=14,phi=(t%T0),pc=11/sp,jt=(phi-(pc-0.36))/0.72,air=jt>0&&jt<1;
  var jy=air?Math.min(8,H-10)*4*jt*(1-jt):0,fl=H-2,i;
  for(i=0;i<W;i++){px(i,fl,AMB,70);if(((i+Math.floor(t*sp))%4)===0)px(i,fl+1<H?fl+1:fl,AMB,120);}
  for(i=0;i<6;i++){                                                /* étoiles de fond (parallaxe lente) */
    var sx=((R(i,3)*W-t*7)%W+W)%W,sy=1+Math.floor(R(i,4)*(H-12));
    px(sx,sy,BLA,70+120*(0.5+0.5*Math.sin(6.2832*(t/2+R(i,5)))));
  }
  for(var k=-1;k<Math.ceil(W/per)+1;k++){var ox=hx+14-sp*phi+k*per;sprite(SPR.pique,Math.round(ox),fl-2,255);}
  var fr=air?SPR.hero3:(Math.floor(t/0.12)%2?SPR.hero1:SPR.hero2);
  sprite(fr,hx,Math.round(fl-8-jy),255);
  if(air&&jt>0.3&&jt<0.7)px(hx+9,fl-8-jy-1,BLA,255);              /* éclat sur l'épée */
}

/* 6. La ola puis VICTOIRE ! */
function sWin(t){
  var W=P.W,H=P.H,x,y;
  if(t<3.0){
    var A=sm(t/0.5)*(1-sm((t-2.3)/0.7));
    for(x=0;x<W;x++){
      var hgt=(0.5+0.5*Math.sin(x/W*6.2832*1.5-t*5.2))*H*A;
      for(y=0;y<hgt;y++){var r=y/H;px(x,H-1-y,r<0.5?VER:r<0.85?AMB:BLA,255);}
    }
  }
  var s=T('win'),sc=bigSc(s),tw=twidth(s,sc),bt=Math.round((H-7*sc)/2);
  var v=sm((t-2.8)/0.4)*(1-sm((t-6.6)/0.5));
  if(v>0)text(s,Math.floor((W-tw)/2),bt,VER,sc,255*v,{fn:function(i,gx){return P.reduced?VER:Math.abs(gx-(((t-3)*38)%(W+30)-15))<3?[BLA,255]:[VER,255];}});
  if(P.reduced)return;
  var cols=[AMB,ROU,BLA,VER,BLE,ROS];
  for(var i=0;i<46;i++){
    var ts=3.0+R(i,1)*1.6,vy=10+14*R(i,2),u=t-ts;if(u<0)continue;
    px(R(i,3)*W+Math.sin(u*3+R(i,4)*6)*2,-1+u*vy,cols[Math.floor(R(i,6)*6)],255);
  }
}

/* 7. K.O. puis RECOMMENCE ? (texte seul : rien n'est cliquable, rien n'a l'allure d'un bouton) */
function sKO(t){
  var W=P.W,H=P.H,bl=P.reduced?1:clamp(0.5+1.2*Math.sin(6.2832*2.5*t),0,1);
  var vk=sm(t/0.15)*(1-sm((t-3.0)/0.3));
  if(vk>0){
    var s=T('ko'),ks=bigSc(s),tw=twidth(s,ks),bt=Math.round((H-7*ks)/2),sh=t<0.6&&!P.reduced?Math.round(Math.sin(t*75)*1.5):0;
    text(s,Math.floor((W-tw)/2)+sh,bt,ROU,ks,255*vk*(0.15+0.85*bl));
    box(0,0,W-1,H-1,ROU,230*vk*bl);
    box(1,1,W-2,H-2,ROU,90*vk*bl);
  }
  var v2=sm((t-3.3)/0.4);
  if(v2>0){
    var s2=T('again'),tw2=twidth(s2+' ?',1),bt2=cb(),x=Math.floor((W-tw2)/2);
    var wq=text(s2,x,bt2,AMB,1,255*v2);
    text('?',x+wq+4,bt2,BLA,1,255*v2*(P.reduced?1:0.2+0.8*(0.5+0.5*Math.sin(6.2832*t/1.0))));
    if(x>9){sprite(SPR.crane,2,bt2,200*v2,ROU);sprite(SPR.crane,W-7,bt2,200*v2,ROU);}
  }
}

/* 8. « Le saviez-vous ? » : titre fixe puis phrase générique qui défile (p.k = numéro de la phrase) */
function phraseDe(p){var J=TXT[langue].jokes;return typeof p.txt==='string'&&p.txt?p.txt:(J.length?J[(p.k||0)%J.length]:'');}
function jokeDuree(p,W){return 2.0+(twidth(phraseDe(p),1)+W)/30;}
function sJokes(t){
  var W=P.W,j=phraseDe(P.p),bt=cb(),u=t;
  chase(t,0.5,BLA);
  if(P.reduced){text(j,4,bt,AMB,1,255,{edge:{a:3,b:W-3,f:6}});return;}
  if(u<2.0){
    var hd=W>=100?T('savLong'):T('savCourt'),w=twidth(hd,1),x=Math.floor((W-w-8)/2);
    var v=sm(u/0.3)*(1-sm((u-1.7)/0.3));
    text(hd,x,bt,BLA,1,255*v);
    text('?',x+w+4,bt,ROU,1,255*v*(Math.floor(u*4)%2?0.35:1));
  }else{
    var off=(u-2.0)*30;
    text(j,W-3-off,bt,AMB,1,255,{edge:{a:3,b:W-3,f:6}});
  }
}

/* 10. Tableau des scores : chiffres qui roulent (numéro du boss, victoires ; jamais de total) */
function digit(d,x,bt,sc,col,v){
  var g=gl(String(d)),o=Math.floor((5-g.w)/2);
  for(var r=0;r<7;r++)for(var c=0;c<5;c++)if(g.rows[r]&(16>>c))
    for(var sy=0;sy<sc;sy++)for(var sx=0;sx<sc;sx++)px(x+(c-g.x0+o)*sc+sx,bt+r*sc+sy,col,v);
}
function oneDigitRoll(dTarget,x,bt,sc,col,p){
  var total=dTarget+10,val=total*eo(p),n=Math.floor(val),fr=val-n,pitch=7*sc+2;
  var oldy0=P.cy0,oldy1=P.cy1;
  P.cy0=Math.max(P.cy0,Math.round(bt+P.yoff));P.cy1=Math.min(P.cy1,Math.round(bt+7*sc-1+P.yoff));
  digit(n%10,x,bt-Math.round(fr*pitch),sc,col,255);
  digit((n+1)%10,x,bt+pitch-Math.round(fr*pitch),sc,col,255);
  P.cy0=oldy0;P.cy1=oldy1;
}
function pageScore(label,value,col,lt,W,H){
  var ds=1,pas=5*ds+2,s=String(value),n=s.length,dw=n*pas-2,lw=twidth(label,1),tot=lw+6+dw,x=Math.floor((W-tot)/2);
  text(label,x,cb(),BLA,1,255);
  for(var j=0;j<7;j++)if(j%2===0)px(x+lw+2,cb()+j,AMB,90);
  var bt=Math.round((H-7*ds)/2);
  for(var i=0;i<n;i++)oneDigitRoll(+s[i],x+lw+6+i*pas,bt,ds,col,P.reduced?1:clamp((lt-0.45-i*0.15)/1.1,0,1));
}
function sScore(t){
  var W=P.W,H=P.H,num=Math.min(S.num,99999),vic=Math.min(S.vic,99999),dbl=vic>0;
  var wins=twidth(T('wins'),1)+6+String(vic).length*(H>=14?12:6)-2<=W-8?T('wins'):T('winsCourt');
  var pg=[[T('boss'),num,ROU],[wins,vic,VER]];
  if(P.reduced||!dbl){P.yoff=0;pageScore(pg[0][0],pg[0][1],pg[0][2],P.reduced?3:t,W,H);return;}
  var tt=(t+0.5)%8,a=Math.floor(tt/4)%2,lt=tt%4,e=eo(lt/0.5),o,x;     /* la scène commence à 0,5 s : la première page est déjà en place */
  if(lt<0.5){
    P.yoff=H*(1-e);pageScore(pg[a][0],pg[a][1],pg[a][2],lt,W,H);
    P.yoff=-H*e;pageScore(pg[1-a][0],pg[1-a][1],pg[1-a][2],4+lt,W,H);
  }else{P.yoff=0;pageScore(pg[a][0],pg[a][1],pg[a][2],lt,W,H);}
  P.yoff=0;
  o=Math.floor(t*10)%4;for(x=0;x<W;x++)if((x-o+40)%4===0){px(x,0,ROU,60);px(W-1-x,H-1,ROU,60);}
}

/* 9. Objet actif : « PORTE-BONHEUR  1 H 20 MIN » (lucky charm, potions, Bar Bar... : les minuteurs de la valise). Les secondes restantes sont celles de l'état reçu (systemes.consommables.restant), décomptées en direct entre deux synchros (aucune requête). */
var OBJ_ORDRE=['energyPower','magicPower','r3Power','energyBars','magicBars','luck'];
var ICONE={luck:'trefle',energyPower:'fiole',magicPower:'fiole',r3Power:'fiole',energyBars:'etoile',magicBars:'etoile'};
function reste(k,now){var o=S.obj[k];return o?Math.max(0,o.base-(now-o.t0)/1000):0;}
function dureeTxt(n){
  n=Math.max(0,Math.floor(Number(n)||0));
  var d=Math.floor(n/86400),h=Math.floor(n%86400/3600),m=Math.floor(n%3600/60),s=n%60,U=TXT[langue];
  if(d>0)return d+' '+U.j+' '+h+' '+U.h;
  if(h>0)return h+' '+U.h+' '+m+' '+U.min;
  if(m>0)return m+' '+U.min+' '+(s<10?'0':'')+s+' '+U.s;
  return n+' '+U.s;
}
function sObjet(t){
  var W=P.W,H=P.H,o=P.p.o,nom=TXT[langue].objets[o],ic=SPR[ICONE[o]];
  if(!nom||!ic)return;
  var dur=dureeTxt(reste(o,S.now)),x0=13,room=W-x0-4,bt=cb(),wn=twidth(nom,1),wt=twidth(dur,1);
  chase(t,0.5,VER);
  sprite(ic,3,Math.round((H-ic.length)/2),255);
  if(wn+8+wt<=room){text(nom,x0,bt,AMB,1,255);text(dur,x0+wn+8,bt,VER,1,255);return;}   /* tient sur une ligne */
  var m=2.2,ph=P.reduced||t<m?0:1,u=ph?t-m:t,v=P.reduced?1:sm(u/0.15)*(1-sm((u-(m-0.15))/0.15));
  if(ph===0)text(nom,x0+(wn>room?-clamp((u-0.5)/1.2,0,1)*(wn-room):0),bt,AMB,1,255*v,{edge:{a:x0-1,b:W-3,f:3}});   /* le nom, puis son temps restant */
  else{var sc=1;text(dur,x0,Math.round((H-7*sc)/2),VER,sc,255*v);}
}

/* 11. NUKE : treize petites animations muettes (une seule fois, TN s), tirées sans répétition immédiate ; puis « +N BOSS » si le client connaît le nombre (différence des boss vaincus de l'état) */
var TN=2.7,NUKE_DUR=4.0,BOMBARDIER=12;
function plein(col,v){var n=P.W*P.H;for(var i=0;i<n;i++){P.c[i]=col;P.v[i]=v>255?255:v<0?0:v;}}
function eclair(a){if(a>0)plein(a>0.55?BLA:a>0.25?AMB:ROU,255*Math.min(1,a*1.6));}   /* blanc, puis orange, puis rouge */
function motNuke(u,u0,coul,fn2){
  if(u<u0)return;
  var s=T('nuke'),c=canon(s),sc=bigSc(s),tw=twidth(s,sc),bt=Math.round((P.H-7*sc)/2),n=Math.min(c.length,Math.floor((u-u0)/0.08)+1);
  text(c.slice(0,n),Math.floor((P.W-tw)/2),bt,coul,sc,255,{fn:fn2||function(i){return (u-u0-i*0.08)<0.15?BLA:coul;}});
}
function haloMot(u0,u){                                          /* efface un point autour des lettres de NUKE ! pour qu'elles restent lisibles dans le feu */
  if(u<u0)return;
  var s=T('nuke'),c=canon(s),sc=bigSc(s),tw=twidth(s,sc),bt=Math.round((P.H-7*sc)/2),n=Math.min(c.length,Math.floor((u-u0)/0.08)+1),pts=[],i,d,k;
  text(c.slice(0,n),Math.floor((P.W-tw)/2),bt,BLA,sc,255,{fn:function(q,gx,gy){pts.push([gx,gy]);return [BLA,0];}});
  for(i=0;i<pts.length;i++)for(d=-1;d<=1;d++)for(k=-1;k<=1;k++){var x=pts[i][0]+k,y=pts[i][1]+d;if(x>=0&&y>=0&&x<P.W&&y<P.H)P.v[y*P.W+x]=0;}
}
function flammes(x0,x1,u,haut){
  for(var x=Math.max(0,x0);x<=Math.min(P.W-1,x1);x++){
    var h=Math.round(haut*(0.4+0.6*R(x,Math.floor(u*14)))),j;
    for(j=0;j<h;j++)px(x,P.H-1-j,j<h*0.4?BLA:j<h*0.75?AMB:ROU,255);
  }
}
function disque(cx,cy,r,v){for(var j=-r;j<=r;j++)for(var i=-r*2;i<=r*2;i++){var d=Math.sqrt(i*i/4+j*j);if(d<=r)px(cx+i,cy+j,d<r*0.4?BLA:d<r*0.75?AMB:ROU,v);}}
SPR.trefle=['.GG.GG.','GGGGGGG','.GGGGG.','GGGGGGG','.GG.GG.','...G...','...G...'];
SPR.fiole=['.WWW.','..W..','.BBB.','BBBBB','BPPPB','BPPPB','.BBB.'];
SPR.etoile=['...X...','...X...','XXXXXXX','.XXXXX.','..XXX..','.XX.XX.','.X...X.'];
SPR.missile=['RR......','RWWWWWWX','RR......'];
SPR.chat1=['.......W.W','X.XXXXXXXX','XXXXXXXWXX','.XXXXXXXXX','.X.X..X.X.','.X.X..X.X.'];
SPR.chat2=['.......W.W','X.XXXXXXXX','XXXXXXXWXX','.XXXXXXXXX','..X.X.X..X','..X.X.X..X'];
SPR.avion1=['.W......WW...X','WWWWWWWWWWWBBX','.WWWWWWWWWWW.X','...WW.........'];
SPR.avion2=['.W......WW....','WWWWWWWWWWWBBX','.WWWWWWWWWWW..','...WW.........'];
var NUKES=[
  function champignon(u){                                          /* 1. champignon atomique qui monte, flash blanc */
    var W=P.W,H=P.H,cx=W>>1,h=Math.min(1,u/1.4),sh=Math.round(h*(H-5)),cy=H-2-sh,capR=2+h*8,i,j;
    if(u<1.5){
      for(j=0;j<sh;j++){var w=1+(j%2);for(i=-w;i<=w;i++)px(cx+i,H-1-j,j<2?BLA:AMB,255);}
      for(j=-3;j<=2;j++)for(i=-Math.round(capR*2);i<=Math.round(capR*2);i++)if(i*i/(capR*capR*4)+j*j/9<=1)px(cx+i,cy+j,j<0?ROU:j<2?AMB:BLA,255);
    }else eclair(1-sm((u-1.5)/0.6));
    motNuke(u,1.8,ROU);
  },
  function missile(u){                                             /* 2. missile qui traverse le panneau et explose */
    var W=P.W,H=P.H,x=-10+u*(W+4)/1.3,y=Math.round(H/2)-1,k;
    if(u<1.3){
      for(k=1;k<10;k++)px(x-k+1,y+1,k%2?AMB:ROU,255-k*24);
      sprite(SPR.missile,Math.round(x),y);
    }else{burst(W-6,H/2,u-1.3,34,21,28,0.8,[BLA,AMB,ROU],20);eclair(1-sm((u-1.3)/0.4));}
    motNuke(u,1.8,AMB);
  },
  function boum(u){                                                /* 3. « BOUM ! » géant qui explose en pixels */
    var s=T('boum'),sc=bigSc(s),tw=twidth(s,sc),bt=Math.round((P.H-7*sc)/2),x=Math.floor((P.W-tw)/2),pts=[],j;
    if(u<1.0){text(s,x+Math.round(Math.sin(u*80)*1.4),bt,ROU,sc,255,{fn:function(i){return Math.floor(u/0.1+i)%2?AMB:ROU;}});return;}
    text(s,x,bt,ROU,sc,255,{fn:function(i,gx,gy){pts.push([gx,gy]);return [ROU,0];}});
    var uu=u-1.0,cs=[BLA,AMB,ROU];
    for(j=0;j<pts.length;j++){
      var a=R(j,5)*6.2832,sp=8+34*R(j,6);
      px(pts[j][0]+Math.cos(a)*sp*uu*1.6,pts[j][1]+Math.sin(a)*sp*uu*0.8+10*uu*uu,cs[j%3],255*(1-sm(uu/0.7)));
    }
    eclair(1-uu/0.25);motNuke(u,1.5,BLA);
  },
  function bouton(u){                                              /* 4. bouton rouge « NE PAS APPUYER » qui s'enfonce */
    var W=P.W,H=P.H,cx=W>>1,i,j;
    if(u<1.1){var s=T('nepas'),tw=twidth(s,1);text(s,Math.floor((W-tw)/2),cb(),Math.floor(u*6)%2?BLA:ROU,1,255);return;}
    var d=u>1.4?3:0;
    rect(cx-10,H-3,21,3,AMB,170);
    for(j=0;j<4;j++){var w=[4,6,7,7][j];for(i=-w;i<=w;i++)px(cx+i,H-7+j+d,j===0&&i<0?BLA:ROU,255);}
    if(u>1.5)eclair(1-sm((u-1.5)/0.5));
    motNuke(u,1.9,ROU);
  },
  function alerte(u){                                              /* 5. alerte rouge, sirène en barres, puis flash */
    var W=P.W,H=P.H,on=Math.floor(u*5)%2===0,x,j;
    if(u<1.7){
      for(x=0;x<9;x++){var h=Math.round((0.5+0.5*Math.sin(u*14+x*0.7))*H);for(j=0;j<h;j++){px(x,H-1-j,ROU,200);px(W-1-x,H-1-j,ROU,200);}}
      if(on)box(0,0,W-1,H-1,ROU,255);
      var s=T('alerte');text(s,Math.floor((W-twidth(s,1))/2),cb(),on?ROU:BLA,1,on?255:120);
    }else eclair(1-sm((u-1.7)/0.5));
    motNuke(u,2.0,ROU);
  },
  function chat(u){                                                /* 6. un chat pousse le bouton nucléaire */
    var W=P.W,H=P.H,bx=W-16,x=-10+Math.min(1,u/1.2)*(bx-14),i,j,d=u>1.35?2:0;
    if(u<1.5){
      rect(bx-1,H-3,12,3,AMB,170);
      for(j=0;j<3;j++){var w=[2,4,5][j];for(i=-w;i<=w;i++)px(bx+5+i,H-6+j+d,ROU,255);}
      sprite(u<1.2&&Math.floor(u/0.1)%2?SPR.chat2:SPR.chat1,Math.round(x),H-7+(u>1.2&&u<1.35?-1:0),255,AMB);
    }else eclair(1-sm((u-1.5)/0.5));
    motNuke(u,1.9,AMB);
  },
  function compte(u){                                              /* 7. décor : 3 - 2 - 1 (0,6 s par chiffre), rien n'est retardé */
    var W=P.W,H=P.H,n=3-Math.floor(u/0.6);
    if(n>=1&&u<1.8){var lu=u%0.6;text(String(n),Math.floor(W/2)-5,Math.round((H-14)/2),ROU,2,255*(1-sm((lu-0.45)/0.15)));ring(lu/0.6,AMB);}
    else eclair(1-sm((u-1.8)/0.5));
    motNuke(u,2.1,BLA);
  },
  function onde(u){                                                /* 8. onde de choc : des cercles révèlent les lettres */
    var W=P.W,H=P.H,cx=W/2,cy=H/2,r=(u/1.8)*(W/2+14),k,a;
    motNuke(u,0,AMB,function(i,gx,gy){return [AMB,Math.sqrt((gx-cx)*(gx-cx)+(gy-cy)*(gy-cy)*11)<r?255:0];});
    if(u<2.0)for(k=0;k<3;k++){var rr=r-k*9;if(rr>1)for(a=0;a<6.2832;a+=0.05)px(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr/3.3,k===0?BLA:k===1?AMB:ROU,255*(1-u/2.2));}
  },
  function meteores(u){                                            /* 9. pluie de fusées en colonnes */
    var W=P.W,H=P.H,i,k;
    if(u<1.9){
      for(i=0;i<16;i++){
        var x=Math.floor(R(i,1)*W),t0=R(i,2)*1.3,y=(u-t0)*H*2.4;
        if(y>=0&&y<H){px(x,y,BLA,255);for(k=1;k<5;k++)px(x,y-k,k<3?AMB:ROU,255-k*45);}
        else if(y>=H)burst(x,H-2,(y-H)/(H*2.4),7,i*3,12,0.4,[AMB,ROU,BLA],10);
      }
    }else eclair(1-sm((u-1.9)/0.5));
    motNuke(u,2.1,ROU);
  },
  function fissure(u){                                             /* 10. l'écran se fissure puis éclate */
    var W=P.W,cx=W>>1,cy=P.H>>1,S0=Math.floor(Math.min(1,u/1.4)*W/2),d,s;
    if(u<1.5){for(d=0;d<6;d++){var ang=d*1.047+R(d,9)*0.4;for(s=0;s<S0;s++)px(cx+Math.cos(ang)*s+(R(s,d)-0.5)*2,cy+Math.sin(ang)*s*0.28+(R(s,d+7)-0.5)*1.2,BLA,255);}}
    else{burst(cx,cy,u-1.5,70,33,40,0.9,[BLA,AMB,ROU,BLE],12);eclair(1-sm((u-1.5)/0.35));}
    motNuke(u,1.8,BLA);
  },
  function superNuke(u){                                           /* 11. SUPER NUKE en lettres arc-en-ciel avec secousse */
    var s=T('super'),c=canon(s),sc=bigSc(s),tw=twidth(s,sc),bt=Math.round((P.H-7*sc)/2),n=Math.min(c.length,Math.floor(u/0.09)+1),cs=[ROU,AMB,BLA,VER,BLE,ROS];
    text(c.slice(0,n),Math.floor((P.W-tw)/2)+(u<2.2?Math.round(Math.sin(u*60)*1.3):0),bt,ROU,sc,255,{fn:function(i){return cs[(i+Math.floor(u*10))%6];}});
    if(u<0.25)eclair(0.6*(1-u/0.25));
  },
  function chevalier(u){                                           /* 12. le chevalier fuit le mur de feu */
    var W=P.W,H=P.H,kx=4+Math.min(u,1.9)*48*(W/120),fx=-14+Math.pow(u/1.9,1.8)*(W+4),x;
    if(u<1.9){
      for(x=0;x<fx;x++){var h=Math.round(3+R(x,Math.floor(u*14))*(H-3)),j;for(j=0;j<h;j++)px(x,H-1-j,j<h*0.35?BLA:j<h*0.7?AMB:ROU,255);}
      sprite(Math.floor(u/0.1)%2?SPR.hero1:SPR.hero2,Math.round(kx),H-9);
    }else eclair(1-sm((u-1.9)/0.5));
    motNuke(u,2.2,ROU);
  },
  function bombardier(u){                                          /* 13. un bombardier lâche des bombes, mur de feu, puis tout explose : NUKE apparaît dans les flammes */
    var W=P.W,H=P.H,v=(W+14)/1.8,ax=-14+u*v,i,n=Math.floor(W/8);
    if(u<1.9){
      for(i=0;i<n;i++){
        var bx=6+i*8,td=(bx+8)/v,f=u-td;
        if(f<0)continue;
        if(f<0.18){var by=3+Math.floor(f/0.06)*Math.round((H-6)/3);px(bx,by,BLA,255);px(bx,by+1,ROU,255);}
        else{var g=f-0.18;if(g<0.2)disque(bx,H-3,Math.max(1,Math.round(g/0.2*3)),255);flammes(bx-2,bx+2,u,4+Math.min(3,Math.floor(g*8)));}
      }
      if(ax<W)sprite(Math.floor(u/0.07)%2?SPR.avion1:SPR.avion2,Math.round(ax),1);
    }else{
      var g2=u-1.9;
      for(i=0;i<W*H;i++)if(R(i,Math.floor(u*16))<0.5*(1-sm((g2-0.2)/0.8)*0.6)){P.c[i]=R(i,2)<0.5?AMB:ROU;P.v[i]=255;}
      flammes(0,W-1,u,Math.round(H*0.6));
      haloMot(2.0,u);
      eclair(1-g2/0.45);
      motNuke(u,2.0,BLA,function(i){return u<2.4&&Math.floor(u*20+i)%2?AMB:BLA;});
      if(u<2.4)for(i=0;i<W*H;i++)if(R(i,Math.floor(u*18)+3)<0.18*(2.4-u)/0.4){P.c[i]=ROU;P.v[i]=255;}   /* quelques flammes passent encore devant les lettres */
    }
  }
];
function sNuke(t){
  var v=(P.p.v|0)%NUKES.length,W=P.W,H=P.H;
  if(P.reduced){                                                   /* image fixe : « NUKE ! » (dans les flammes pour le bombardier) */
    if(v===BOMBARDIER)flammes(0,W-1,0,H-2);
    var s0=T('nuke'),sc0=bigSc(s0);text(s0,Math.floor((W-twidth(s0,sc0))/2),Math.round((H-7*sc0)/2),v===BOMBARDIER?BLA:ROU,sc0,255);
    return;
  }
  NUKES[v](Math.min(t,TN));
  var n=S.vic-(P.p.base||0);
  if(t>TN&&n>0){                                                   /* nombre de boss franchis, déjà connu du client (jamais de total) */
    var k=1-sm((t-TN)/0.25),i,s='+'+Math.min(n,99999)+' '+T('boss'),sc=bigSc(s),vv=sm((t-TN-0.15)/0.25);
    for(i=0;i<W*H;i++)P.v[i]*=k;
    if(vv>0)text(s,Math.floor((W-twidth(s,sc))/2),Math.round((H-7*sc)/2),VER,sc,255*vv);
  }
}
/* tirage sans répétition immédiate : liste mélangée puis parcourue ; le bombardier sort environ une fois sur cinq */
var nukeSac=[],nukeDernier=-1;
function melanger(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t;}return a;}
function nukeChoix(){
  var v;
  if(nukeDernier!==BOMBARDIER&&Math.random()<0.2)v=BOMBARDIER;
  else{
    if(!nukeSac.length)nukeSac=melanger(NUKES.slice(0,BOMBARDIER).map(function(_f,i){return i;}));
    v=nukeSac.pop();
    if(v===nukeDernier){if(nukeSac.length){var w=nukeSac.pop();nukeSac.push(v);v=w;}else v=(v+1)%BOMBARDIER;}
  }
  nukeDernier=v;return v;
}


/* ------------------------------------------------------------------ barre de vie du boss, dessinée SUR l'écran (Norman, 2026-11-01 : « en écran de jeu quoi » ; mêmes données que l'ancienne barre rose, maintenant masquée) :
   cœur à gauche, jauge de segments qui se vide de droite à gauche, « PV / PV max » centré en police LED, « +régénération/s » en vert sous la jauge, à droite. Valeurs lues dans l'état client (bossPv, bossPvMax, regenBoss), formatées comme
   l'ancienne barre (formaterPvFixeIdleV1_) ; jamais de boss inconnu (même source que la plaque). */
function hsl2rgb(h,s,l){
  h=(((h%360)+360)%360)/360;
  var q=l<0.5?l*(1+s):l+s-l*s,p=2*l-q;
  function f(x){x=(x+1)%1;return x<1/6?p+(q-p)*6*x:x<0.5?q:x<2/3?p+(q-p)*(2/3-x)*6:p;}
  return [Math.round(f(h+1/3)*255),Math.round(f(h)*255),Math.round(f(h-1/3)*255)];
}
/* assombrit d'un contour d'un point les cellules autour de pts (comme l'ombre noire du texte d'origine) sans effacer la jauge */
function contour(pts,y0,y1){for(var i=0;i<pts.length;i++)for(var j=-1;j<=1;j++)for(var x=-1;x<=1;x++){var xx=pts[i][0]+x,yy=pts[i][1]+j;if(xx>=0&&xx<P.W&&yy>=y0&&yy<y1){var k=yy*P.W+xx;P.v[k]=Math.round(P.v[k]*0.3);}}}
function barre(t){
  var W=P.W,y0=P.H,pv=S.pv,x,j,gy=y0+2,GH=9;
  for(x=0;x<W;x+=2)px(x,y0,AMB,60);                                 /* rainure : fine ligne de points entre les scènes et la vie du boss */
  if(!pv)return;
  var x0=1,len=W-2,lit=Math.round(pv.pct*len);
  if(pv.pct>0&&lit<1)lit=1;
  for(x=0;x<len;x++){
    var on=x<lit,seam=1;   /* barre pleine, sans traits qui la coupent (Norman, 2026-11-01) */
    for(j=0;j<GH;j++)px(x0+x,gy+j,BARRE,(on?255:30)*seam);
  }
  var hx=x0+2,hy=gy+Math.floor((GH-6)/2),hp=[],r,q,txt=pv.cur+' / '+pv.max,lr=gy+GH+2;   /* le petit cœur, à gauche dans la jauge */
  for(r=0;r<SPR.coeurP.length;r++)for(q=0;q<SPR.coeurP[r].length;q++)if(SPR.coeurP[r][q]!=='.')hp.push([hx+q,hy+r]);
  contour(hp,gy,gy+GH);sprite(SPR.coeurP,hx,hy,255,ROS);
  /* Norman (2026-11-01) : les chiffres de la vie sont SOUS la jauge, calés à gauche, sur la même ligne que la régénération (à droite), en petite police 3x5 */
  var room=W-3-(pv.regen?miniWidth(pv.regen)+4:0);
  if(miniWidth(txt)>room)txt=pv.cur+'/'+pv.max;
  if(miniWidth(txt)>room)txt=pv.cur;
  miniText(txt,2,lr,BLA,255,fnUnites(txt));
  if(pv.regen)miniText(pv.regen,W-2-miniWidth(pv.regen),lr,VER,255,fnUnites(pv.regen));
}
var cbId=-1;
function couleurBarre(r,e){
  var id=e?Math.max(0,Math.floor(nombre(e.bossId))):0,st='',m;
  if(id===cbId)return;
  cbId=id;
  try{st=typeof r.styleCouleurBarreBossIdleV1_==='function'?String(r.styleCouleurBarreBossIdleV1_(id)):'';}catch(_e){st='';}
  m=/--bc-b:hsl\((\d+),/.exec(st);
  RGB[BARRE]=m?hsl2rgb(Number(m[1]),0.85,0.56):[162,63,214];
  if(panel&&panel.cell)panel.sprites();
}

/* ------------------------------------------------------------------ catalogue : durée, priorité (un événement de combat l'emporte sur le reste), instant de l'image fixe (prefers-reduced-motion) */
var SC={
  base:{fn:sBase,dur:10,prio:0,cap:1.0},
  mascot:{fn:sMascot,dur:3.2,prio:0,cap:0.5},
  bars:{fn:sBars,dur:2.6,prio:1,cap:1.0},
  jokes:{fn:sJokes,dur:function(p,W){return jokeDuree(p,W);},prio:1,cap:0.5},
  objet:{fn:sObjet,dur:4.4,prio:1,cap:0.5},
  nuke:{fn:sNuke,dur:NUKE_DUR,prio:4,cap:3.0},
  morts:{fn:sMorts,dur:4,prio:1,cap:1.0},
  score:{fn:sScore,dur:function(){return S.vic>0?8:4;},prio:1,cap:2.0},
  hit:{fn:sHits,dur:1.5,prio:3,cap:0.8},
  fight:{fn:sFight,dur:Infinity,prio:0,cap:2.0},
  win:{fn:sWin,dur:7.2,prio:5,cap:4.2},
  ko:{fn:sKO,dur:6.4,prio:5,cap:3.9}
};
/* un combat qui recommence pendant VICTOIRE ! / K.O. : son FIGHT ! attend que le message ait été vu */
var COUPE={win:5.0,ko:4.2};

/* ------------------------------------------------------------------ rendu : un seul canvas */
var BARH=19;   /* rangées sous la zone des scènes : rainure (1), vide (1), jauge (9), vide (0), régénération (7) ; tout est lu dans l'état du jeu, jamais écrit */
/* Fluidité (2026-11-02) : canvas opaque (le fond est toujours dessiné plein) ; `neuf` = rien d'affiché au bon format, tout est à redessiner (voir Panel.draw : seules les cellules qui ont changé sont repeintes) */
function Panel(canvas,W,H,sansBarre){this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.extra=sansBarre?0:BARH;this.setGrid(W,H);this.reduced=false;this.cell=0;this.p={};}
Panel.prototype.setGrid=function(W,H){this.W=W;this.H=H;this.HT=H+this.extra;this.YM=H;var n=W*this.HT;this.c=new Uint8Array(n);this.v=new Uint8Array(n);this.pc=new Uint8Array(n);this.pl=new Uint8Array(n);this.pg=new Uint8Array(n);this.dm=new Uint8Array(n);this.sm=new Uint8Array(n);this.ch=new Int32Array(n);this.neuf=true;this.nd=0;this.yoff=0;this.cy0=0;this.cy1=H-1;this.cell=0;};
/* Écran plus grand = PLUS DE LED, jamais un dessin agrandi (Norman, 2026-11-01) : la TAILLE d'un point est fixe (4 px CSS sur PC, 3 px sur téléphone, arrondie à un nombre ENTIER de pixels d'écran pour rester net) ;
   c'est le nombre de colonnes et de rangées qui s'adapte à l'hôte (taille()). Rendu 1:1 : le canvas est affiché à sa taille exacte canvas.width/dpr x canvas.height/dpr (jamais étiré par le CSS, donc jamais
   rééchantillonné) et centré dans l'hôte noir sur un nombre entier de pixels d'écran ; le petit reste devient des marges noires symétriques. */
Panel.prototype.fit=function(cell,cssW,cssH){
  var dpr=window.devicePixelRatio||1,cv=this.canvas,st=cv.style,changed=cell!==this.cell||dpr!==this.dpr;
  this.dpr=dpr;
  if(changed){
    this.cell=cell;cv.width=cell*this.W;cv.height=cell*this.HT;this.neuf=true;
    this.sprites();this.bg();
  }
  if(st){
    var wd=cv.width,hd=cv.height;
    st.width=(wd/dpr)+'px';st.height=(hd/dpr)+'px';st.imageRendering='pixelated';
    if(cssH>0){
      st.position='absolute';st.left=(Math.max(0,Math.floor((cssW*dpr-wd)/2))/dpr)+'px';st.top=(Math.max(0,Math.floor((cssH*dpr-hd)/2))/dpr)+'px';
    }else{st.margin='0 auto';}
  }
  return changed;
};
/* grille FIXE (aperçu de l'éditeur Admin) : la plus grande cellule entière qui tient dans la largeur */
Panel.prototype.resize=function(cssW,cssH){
  var dpr=window.devicePixelRatio||1;
  return this.fit(Math.max(3,Math.floor(cssW*dpr/this.W+1e-6)),cssW,cssH);
};
Panel.prototype.sprites=function(){
  this.core=[];this.glow=[];this.neuf=true;   /* les sprites changent (couleur du boss) : tout est repeint */
  for(var c=1;c<=7;c++)this.mk(c);
};
/* sprites d'une couleur de la palette (les 7 de base d'office, les couleurs d'unités de nombres à la demande) */
Panel.prototype.mk=function(c){
  var cell=this.cell,core=[],glow=[],l;
  {
    core=[];glow=[];
    for(l=1;l<=8;l++){
      var I=l/8,rgb=RGB[c],k=document.createElement('canvas'),g=document.createElement('canvas'),x;
      k.width=k.height=cell;x=k.getContext('2d');
      var hot=rgb.map(function(q){return Math.round(q+(255-q)*0.5);});
      x.fillStyle='rgba('+rgb+','+I+')';x.beginPath();x.arc(cell/2,cell/2,cell*0.4,0,6.2832);x.fill();   /* bord franc : Norman, 2026-11-01 « ça m'a l'air flou » */
      x.fillStyle='rgba('+hot+','+I+')';x.beginPath();x.arc(cell/2,cell/2,cell*0.24,0,6.2832);x.fill();
      g.width=g.height=cell*3;x=g.getContext('2d');
      var gg=x.createRadialGradient(cell*1.5,cell*1.5,cell*0.2,cell*1.5,cell*1.5,cell*1.5);
      gg.addColorStop(0,'rgba('+rgb+','+(0.16*I)+')');gg.addColorStop(1,'rgba('+rgb+',0)');
      x.fillStyle=gg;x.fillRect(0,0,cell*3,cell*3);
      core[l]=k;glow[l]=g;
    }
  }
  this.core[c]=core;this.glow[c]=glow;
};
Panel.prototype.bg=function(){
  var cell=this.cell,b=document.createElement('canvas'),x;b.width=this.canvas.width;b.height=this.canvas.height;x=b.getContext('2d');
  x.fillStyle='#020202';x.fillRect(0,0,b.width,b.height);
  for(var j=0;j<this.HT;j++)for(var i=0;i<this.W;i++){
    x.fillStyle='#0b0907';x.beginPath();x.arc(i*cell+cell/2,j*cell+cell/2,cell*0.38,0,6.2832);x.fill();   /* point éteint presque noir, sans petit reflet */
  }
  this.bgc=b;
};
Panel.prototype.draw=function(fn,t,gain,params){
  P=this;this.p=params||{};this.c.fill(0);this.v.fill(0);this.yoff=0;this.cy0=0;this.cy1=this.H-1;this.YM=this.H;
  fn(t);
  if(this.extra){this.yoff=0;this.cy0=0;this.cy1=this.HT-1;this.YM=this.HT;barre(t);this.YM=this.H;this.cy1=this.H-1;}   /* la vie du boss est dessinée APRÈS la scène, hors du fondu : elle reste toujours affichée */
  var ctx=this.ctx,cell=this.cell,W=this.W,HT=this.HT,i,n=W*this.HT,ns=W*this.H,v,l,x,y;
  /* Fluidité (2026-11-02) : on compare la grille à celle déjà affichée (couleur, niveau du coeur, niveau du halo de chaque point) ; rien de changé = aucun dessin ; sinon seules les cellules changées
     (et leurs voisines, le halo déborde d'une cellule) sont repeintes, dans un rectangle de découpe : le résultat est identique pixel pour pixel à un redessin complet. La vie du boss, immobile presque toujours, n'est plus repeinte. */
  var pc=this.pc,pl=this.pl,pg=this.pg,nc=0,ch=this.ch,cc=this.c,vv=this.v,L2,G2,col;
  for(i=0;i<n;i++){
    v=vv[i]*(i<ns?gain:1);
    L2=v<=0?0:Math.max(1,Math.min(8,Math.ceil(v/255*8)));G2=v<70?0:Math.min(8,Math.ceil(v/255*8));col=L2?cc[i]:0;
    if(L2&&!this.core[col])this.mk(col);
    if(col!==pc[i]||L2!==pl[i]||G2!==pg[i]){ch[nc++]=i;pc[i]=col;pl[i]=L2;pg[i]=G2;}
  }
  this.nd=(this.nd||0)+1;
  if(nc===0&&!this.neuf&&this.nd%240!==0){P=null;return;}   /* rien n'a changé : le canvas reste tel quel (un redessin complet de sécurité toutes les 240 images) */
  if(this.neuf||this.nd%240===0||nc*3>n){
    this.neuf=false;
    ctx.globalCompositeOperation='source-over';ctx.drawImage(this.bgc,0,0);
    ctx.globalCompositeOperation='lighter';
    for(i=0;i<n;i++){v=this.v[i]*(i<ns?gain:1);if(v<70)continue;l=Math.min(8,Math.ceil(v/255*8));x=(i%W)*cell;y=((i/W)|0)*cell;if(!this.glow[this.c[i]])this.mk(this.c[i]);ctx.drawImage(this.glow[this.c[i]][l],x-cell,y-cell);}
    ctx.globalCompositeOperation='source-over';
    for(i=0;i<n;i++){v=this.v[i]*(i<ns?gain:1);if(v<=0)continue;l=Math.max(1,Math.min(8,Math.ceil(v/255*8)));if(!this.core[this.c[i]])this.mk(this.c[i]);ctx.drawImage(this.core[this.c[i]][l],(i%W)*cell,((i/W)|0)*cell);}
    P=null;return;
  }
  var dm=this.dm,sm=this.sm,k,j,cx,cy,a,b,run;
  dm.fill(0);sm.fill(0);
  for(k=0;k<nc;k++){
    i=ch[k];cx=i%W;cy=(i/W)|0;
    for(b=-2;b<=2;b++){y=cy+b;if(y<0||y>=HT)continue;for(a=-2;a<=2;a++){x=cx+a;if(x<0||x>=W)continue;if(a>=-1&&a<=1&&b>=-1&&b<=1)dm[y*W+x]=1;sm[y*W+x]=1;}}   /* dm = cellules à repeindre (voisines comprises) ; sm = cellules dont le halo peut les toucher */
  }
  ctx.save();ctx.beginPath();
  for(y=0;y<HT;y++){
    run=-1;
    for(x=0;x<=W;x++){
      if(x<W&&dm[y*W+x]){if(run<0)run=x;}
      else if(run>=0){ctx.rect(run*cell,y*cell,(x-run)*cell,cell);run=-1;}
    }
  }
  ctx.clip();
  ctx.globalCompositeOperation='source-over';ctx.drawImage(this.bgc,0,0);
  ctx.globalCompositeOperation='lighter';
  for(i=0;i<n;i++){if(!sm[i]||pg[i]===0)continue;x=(i%W)*cell;y=((i/W)|0)*cell;ctx.drawImage(this.glow[pc[i]][pg[i]],x-cell,y-cell);}
  ctx.globalCompositeOperation='source-over';
  for(i=0;i<n;i++){if(!dm[i]||pl[i]===0)continue;ctx.drawImage(this.core[pc[i]][pl[i]],(i%W)*cell,((i/W)|0)*cell);}
  ctx.restore();
  P=null;
};

/* ------------------------------------------------------------------ lecture de l'état du jeu (jamais d'écriture) */
function reg(){return window.__SOREAL_IDLE_REG__||{};}
function nombre(v){var n=Number(v);return isFinite(n)?n:0;}
var histPv=[];                                                     /* [instant ms, ratio de vie du joueur] sur les 0,6 dernières secondes : tranche perdue en blanc */
function lire(now){
  var r=reg(),e=r.idleEtat||null;
  langueDe(now);
  S.combat=Boolean(e&&e.combatBossActif);
  S.num=e?Math.max(0,Math.floor(nombre(e.bossSelection))):0;
  S.vic=e?Math.max(0,Math.floor(nombre(e.bossVaincus))):0;
  S.nomJ=e?String(e.nom||'Joueur').trim().replace(/\s+/g,' '):'';
  /* victoires du boss COURANT : la même donnée que la carte du boss (bestiaire.entrees[].victoires) ; 0 = rien d'affiché */
  S.morts=0;
  if(e&&e.bestiaire&&Array.isArray(e.bestiaire.entrees)){var sel=Math.floor(nombre(e.bossSelection)),en=e.bestiaire.entrees;for(var q=0;q<en.length;q++){var x=en[q];if(x&&x.source==='boss'&&x.decouvert&&Math.floor(nombre(x.numero))===sel){S.morts=Math.max(0,Math.floor(nombre(x.victoires)));break;}}}
  /* même source que la plaque du duel : le nom du boss sélectionné, tel qu'elle l'affiche (traduit si le jeu est en anglais) ; rien tant que le jeu ne connaît pas de boss */
  var nom=e?String(e.bossActuel||'').trim():'';
  if(nom){var pl=document.getElementById('sorealIdleBossNomTexteV65');if(pl&&pl.textContent.trim())nom=pl.textContent.trim().replace(/\s+/g,' ');}
  S.boss=Boolean(nom&&S.num>0);
  S.nom=S.boss?nom:'';
  S.now=now;
  var fmt=r.formaterPvFixeIdleV1_,bpm=e?nombre(e.bossPvMax):0,bp=e?nombre(e.bossPv):0;
  /* vie du boss : mêmes champs et même mise en forme que l'ancienne barre (ui-boucle-v1.js : bossPv, bossPvMax, regenBoss) ; rien pour un boss inconnu */
  S.pv=(S.boss&&bpm>0&&typeof fmt==='function')?{pct:clamp(bp/bpm,0,1),cur:String(fmt(bp)),max:String(fmt(bpm)),regen:(bp>0&&nombre(e.regenBoss)>0)?'+'+fmt(nombre(e.regenBoss))+'/s':''}:null;
  couleurBarre(r,e);
  var cons=e&&e.systemes&&e.systemes.consommables,rs=cons&&cons.restant||{};   /* mêmes secondes que la valise ; compte à rebours local entre deux synchros */
  OBJ_ORDRE.forEach(function(k){var v=Math.floor(nombre(rs[k]));if(v>0){var o=S.obj[k];if(!o||o.base!==v)S.obj[k]={base:v,t0:now};}else delete S.obj[k];});
  var max=e?nombre(e.pvJoueurMax):0,ratio=max>0?clamp(nombre(e.pvJoueur)/max,0,1):1;
  var h=histPv;
  if(!h.length||h[h.length-1][1]!==ratio)h.push([now,ratio]);
  while(h.length>1&&now-h[0][0]>600)h.shift();
  var gmax=ratio,tg=now;
  for(var i=0;i<h.length;i++)if(h[i][1]>gmax){gmax=h[i][1];tg=h[i][0];}
  S.bar={v:ratio,g:gmax,gv:gmax>ratio+0.002?clamp(1-(now-tg)/600,0,1):0};
}

/* ------------------------------------------------------------------ gestionnaire de scènes : une à la fois, priorité aux événements de combat, retour automatique à l'affichage de base */
var L={ok:false,debut:0,res:0,hitN:0,mot:0,vic:false,def:false,combat:false,nuke:false};
var EN_COMBAT={fight:1,hit:1,bars:1,mascot:1};
var cur=null,pend=false,rot=0,jk=0,last='',fightT0=0,interAt=0,interN=0,objAt=0,objTour=0,objI=0;
function enCombat(s){return Boolean(s&&(EN_COMBAT[s.id]||(s.id==='objet'&&s.p.inter)));}
/* objets actifs (ordre fixe), avec au moins une seconde restante */
function actifs(now){return OBJ_ORDRE.filter(function(k){return reste(k,now)>=1;});}
function objetDu(now){return (objTour>0||now>=objAt)&&actifs(now).length>0;}
/* une annonce d'objet actif toutes les ~28 s, 4,4 s chacune ; hors combat tous les objets défilent un par un, pendant le combat un seul s'intercale entre deux FIGHT ! */
function objetSuivant(now,inter){
  var l=actifs(now);
  if(!l.length){objTour=0;return null;}
  if(objTour<=0)objTour=inter?1:l.length;
  var k=l[objI%l.length];objI+=1;objTour-=1;
  if(objTour<=0)objAt=now+4400+(inter?26000:25000);
  return mk('objet',now,{o:k,inter:Boolean(inter)});
}
function mk(id,now,p){
  var d=SC[id].dur;p=p||{};
  return {id:id,t0:id==='fight'?fightT0:now,p:p,prio:SC[id].prio,dur:typeof d==='function'?d(p,panel?panel.W:120):d};
}
function demarrer(s){cur=s;}
/* le combat commence (ou reprend après un message) : FIGHT ! ; `neuf` = nouvelle apparition (lettre par lettre), sinon on reprend la boucle là où elle en était */
function combatFight(now,neuf){
  var dedans=enCombat(cur);
  if(neuf||!dedans){fightT0=now;interAt=now+5000;objTour=0;if(objAt<now+8000)objAt=now+8000;}
  demarrer(mk('fight',now));
}
/* « Le saviez-vous ? » : phrases ajoutées par l'administrateur (modules/admin-saviez-vous-v1.js, lues dans les textes déjà synchronisés : aucune requête) ; '' = aucune, on garde les cinq d'origine (jk) ; jamais deux fois la même d'affilée */
var phraseDerniere='';
function phraseAdmin(){
  var m=window.__SOREAL_IDLE_SAVIEZ_VOUS_V1__,t='';
  try{if(m&&typeof m.tirer==='function')t=String(m.tirer(langue,phraseDerniere,TXT[langue].jokes)||'');}catch(_e){t='';}
  if(t)phraseDerniere=t;
  return t;
}
function suivante(now){
  if(S.combat){combatFight(now,false);return cur;}
  if(objetDu(now)){var so=objetSuivant(now,false);if(so)return so;}
  var seq=S.boss?(S.morts>0?['base','morts','score','base','jokes']:['base','score','base','jokes']):['base','jokes'],id=seq[rot%seq.length];rot+=1;
  if(id==='jokes'){var tx=phraseAdmin();if(tx)return mk('jokes',now,{k:0,txt:tx});id='base';}   /* sans phrase de l'administrateur : pas de scène « Le saviez-vous ? » */
  return mk(id,now);
}
function pousser(id,now,p){
  if(id==='fight'){
    if(enCombat(cur))return;                              /* déjà en combat (le boss suivant s'enchaîne) : FIGHT ! reste affiché, sans clignoter */
    if(cur&&COUPE[cur.id]&&(now-cur.t0)/1000<COUPE[cur.id]){pend=true;return;}
    pend=false;combatFight(now,true);return;
  }
  if(id==='nuke'&&cur&&cur.prio>=5)return;                         /* une victoire ou un K.O. déjà en cours n'est pas interrompu */
  var s=mk(id,now,p);
  if(id==='hit'){if(cur&&cur.prio>=3)return;demarrer(s);return;}
  pend=false;demarrer(s);                                          /* victoire ou défaite : passe devant tout */
}
function evenements(now){
  var r=reg(),e=r.idleEtat||null;
  var debut=nombre(r.idleCombatDebutV1),res=r.idleCombatLogDernierResumeV70,vic=Boolean(window.__SOREAL_IDLE_VICTOIRE_EN_COURS__),def=Boolean(r.idleCombatEnPauseApresDefaiteV1);
  if(!L.ok){L.ok=true;L.debut=debut;L.res=res;L.vic=vic;L.def=def;L.combat=S.combat;L.nuke=Boolean(r.idleNukeEnCoursV1);return;}   /* première lecture (ou reprise) : on se cale sans jouer d'événement ancien */
  if(S.combat&&!L.combat){rot=0;L.hitN=0;}
  if(debut&&debut!==L.debut)pousser('fight',now);
  if(!debut)L.hitN=0;
  L.debut=debut;
  if(S.combat&&res!==L.res){L.hitN+=1;if(L.hitN%3===0){L.mot=1-L.mot;pousser('hit',now,{mot:L.mot?'BAM !':'POW !',n:L.hitN});}}
  L.res=res;
  var nk=Boolean(r.idleNukeEnCoursV1);                              /* un NUKE part (même drapeau que la victoire arcade ignore) : une animation parmi treize */
  if(nk&&!L.nuke)pousser('nuke',now,{v:nukeChoix(),base:S.vic});
  L.nuke=nk;
  if(vic&&!L.vic)pousser('win',now);
  L.vic=vic;
  if((def&&!L.def)||(L.combat&&!S.combat&&e&&nombre(e.pvJoueur)<=0&&!(cur&&cur.id==='ko')))pousser('ko',now);
  L.def=def;L.combat=S.combat;
}

/* ------------------------------------------------------------------ canvas, observation, boucle */
var panel=null,host=null,io=null,ro=null,onScreen=true,raf=0,timer=0,lastTs=0;
function reduit(){try{return Boolean(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);}catch(_e){return false;}}
function mobile(){return (window.innerWidth||1000)<=700;}
var CELL_PC=4,CELL_TEL=3,W_MAX=240,W_MIN=60,ROWS_MAX=72;   /* taille d'un point en px CSS ; plafonds de la grille (perf) */
/* nombre de colonnes et de rangées pour un hôte donné : floor(taille de l'hôte en pixels d'écran / taille d'un point) ; la zone des scènes = toutes les rangées moins les 19 de la vie du boss */
function grille(cssW,cssH,dpr){
  var cell=Math.max(2,Math.round((mobile()?CELL_TEL:CELL_PC)*(dpr||1)));
  var W=clamp(Math.floor(cssW*(dpr||1)/cell),W_MIN,W_MAX),R=clamp(Math.floor(cssH*(dpr||1)/cell),BARH+8,ROWS_MAX);
  return {cell:cell,W:W,H:R-BARH};
}

function dessiner(now){
  var s=cur,sc=SC[s.id],u=(now-s.t0)/1000,rm=reduit(),g=1;
  panel.reduced=rm;
  if(rm){
    var sig=s.id+'|'+S.num+'|'+S.nom+'|'+S.vic+'|'+Math.round(S.bar.v*50)+'|'+langue+'|'+panel.cell+'|'+panel.W+'|'+(S.pv?S.pv.pct.toFixed(3)+S.pv.cur+S.pv.max+S.pv.regen:'')+RGB[BARRE].join();
    if(sig===last)return;
    last=sig;panel.draw(sc.fn,sc.cap,1,s.p);return;
  }
  var f=s.id==='hit'?0.08:0.2;
  g=s.id==='fight'?1:clamp(Math.min(u,s.dur-u)/f,0,1);
  last='';
  panel.draw(sc.fn,u,g,s.p);
}
function image(now){
  lire(now);
  evenements(now);
  if(pend&&(!cur||!COUPE[cur.id]||(now-cur.t0)/1000>=COUPE[cur.id])){pend=false;combatFight(now,true);}
  if(!cur||(now-cur.t0)/1000>=cur.dur){
    if(cur&&(cur.id==='mascot'||cur.id==='bars'||cur.id==='hit'||(cur.id==='objet'&&cur.p.inter))&&S.combat)combatFight(now,false);
    else demarrer(suivante(now));
  }else if(S.combat&&(cur.id==='base'||cur.id==='jokes'||cur.id==='score'||(cur.id==='objet'&&!cur.p.inter)))combatFight(now,true);
  else if(!S.combat&&enCombat(cur))demarrer(suivante(now));
  else if(cur.id==='fight'&&objetDu(now)){var oi=objetSuivant(now,true);if(oi)demarrer(oi);}
  else if(cur.id==='fight'&&now>=interAt){                         /* un petit interlude (barre de vie du joueur, mascotte) puis retour à FIGHT ! */
    interN+=1;demarrer(mk(interN%2?'bars':'mascot',now));interAt=now+cur.dur*1000+5000;
  }
  dessiner(now);
  try{dessinerMinis(now);}catch(_e){}
}
/* ------------------------------------------------------------------ petits écrans LED du duel (Norman, 2026-11-01 : « le nom du joueur doit aussi être sur un écran LED », « l'information avec le nombre de fois qu'on a déjà tué ce boss doit passer aussi »)
   Même moteur de points, mêmes polices et même rendu 1:1 que le grand panneau ; hôte `.bn-led-mini.bn-led-joueur` du HTML de la page, canvas ajouté ici avec data-morph-garder.
   Seul le nom du joueur est ici ; le nombre de fois que le boss a été tué est dans la rotation du grand panneau (scène « morts »).
   Texte ambre ; trop long = va-et-vient avec pause aux deux bouts (immobile, tronqué, si l'animation est réduite). */
var minis=[];
function sMini(){
  var p=P.p,bt=Math.max(0,Math.floor((P.H-7)/2)),x=p.x;   /* texte centré en hauteur (Norman, 2026-11-01 : « il est collé sur le bas du cadre ») : le nombre de rangées est impair, donc marges haut et bas égales */
  if(p.spr){sprite(SPR[p.spr],x,bt,255);x+=9;}
  rich(p.segs,x,bt,1,255);
}
function contenuMini(m){
  if(!S.nomJ)return null;
  var seg=[[S.nomJ,AMB]];return {segs:seg,spr:null,w:rwidth(seg,1)};
}
function tailleMini(m){
  var h=m.host,w=h.clientWidth,hh=h.clientHeight;
  if(!(w>0)||!(hh>0))return;
  var dpr=window.devicePixelRatio||1,cell=Math.max(2,Math.round((mobile()?CELL_TEL:CELL_PC)*dpr));
  var W=clamp(Math.floor(w*dpr/cell),20,W_MAX),H=clamp(Math.floor(hh*dpr/cell),9,40);if((H-7)%2!==0)H-=1;
  if(W!==m.panel.W||H!==m.panel.H)m.panel.setGrid(W,H);
  m.panel.fit(cell,w,hh);m.sig='';
}
function syncMinis(){
  var hs=document.querySelectorAll('.bn-led-mini'),i,j;
  for(i=minis.length-1;i>=0;i--)if(!minis[i].host.isConnected||Array.prototype.indexOf.call(hs,minis[i].host)<0){if(minis[i].ro)minis[i].ro.disconnect();minis.splice(i,1);}
  for(i=0;i<hs.length;i++){
    var h=hs[i],m=null;
    for(j=0;j<minis.length;j++)if(minis[j].host===h)m=minis[j];
    var cv=h.querySelector('canvas.bn-led-canvas');
    if(!cv){
      cv=document.createElement('canvas');cv.className='bn-led-canvas';
      cv.setAttribute('data-morph-garder','');cv.setAttribute('data-morph-vivant','');cv.setAttribute('data-steam-visible','');cv.setAttribute('aria-hidden','true');
      h.appendChild(cv);m=null;
    }
    if(m&&m.panel.canvas!==cv){if(m.ro)m.ro.disconnect();minis.splice(minis.indexOf(m),1);m=null;}
    if(!m){
      m={host:h,kind:'joueur',panel:new Panel(cv,60,11,true),sig:'',t0:performance.now(),ro:null};
      minis.push(m);
      try{if(typeof ResizeObserver==='function'){m.ro=new ResizeObserver(function(){tailleMini(m);});m.ro.observe(h);}}catch(_e){}
      tailleMini(m);
    }
  }
}
function dessinerMinis(now){
  var rm=reduit();
  for(var i=0;i<minis.length;i++){
    var m=minis[i],pn=m.panel,c;
    if(!(pn.cell>0))continue;
    c=contenuMini(m);
    var x,off=0,sig;
    if(!c){sig='vide|'+pn.W+'|'+pn.cell;if(sig!==m.sig){m.sig=sig;pn.draw(function(){},0,1,{segs:[],x:0});}continue;}
    var dispo=pn.W-6;
    if(c.w<=dispo)x=Math.floor((pn.W-c.w)/2);
    else{
      var trajet=c.w-dispo,pause=1.5,vit=14,tt=trajet/vit,per=2*(pause+tt),u=rm?0:((now-m.t0)/1000)%per;
      var d=u<pause?0:u<pause+tt?(u-pause)/tt:u<2*pause+tt?1:1-(u-2*pause-tt)/tt;
      off=Math.round(clamp(d,0,1)*trajet);x=3-off;
    }
    sig=m.kind+'|'+c.segs.map(function(g){return g[0];}).join(' ')+'|'+x+'|'+pn.W+'x'+pn.H+'|'+pn.cell+'|'+langue;
    if(sig===m.sig)continue;
    m.sig=sig;pn.draw(sMini,0,1,{segs:c.segs,spr:c.spr,x:x});
  }
}
function actif(){return Boolean(panel&&host&&host.isConnected&&onScreen&&!document.hidden);}
function boucle(ts){
  raf=0;
  if(!actif())return;
  if(!mobile()||ts-lastTs>=32){lastTs=ts;try{image(performance.now());}catch(_e){}}
  raf=requestAnimationFrame(boucle);
}
function relancer(){
  if(raf||timer||!actif())return;
  L.ok=false;cur=null;pend=false;last='';
  if(reduit()){
    var pas=function(){timer=0;if(!actif())return;try{image(performance.now());}catch(_e){}timer=setTimeout(pas,250);};
    pas();
  }else{lastTs=0;raf=requestAnimationFrame(boucle);}
}
function arreter(){if(raf){cancelAnimationFrame(raf);raf=0;}if(timer){clearTimeout(timer);timer=0;}}

function taille(){
  if(!panel||!host)return;
  var w=host.clientWidth;
  if(!(w>0))return;
  var hh=host.clientHeight;
  if(!(hh>0))return;
  var g=grille(w,hh,window.devicePixelRatio||1);
  var grille2=g.W!==panel.W||g.H!==panel.H;
  if(grille2)panel.setGrid(g.W,g.H);
  var neuf=panel.fit(g.cell,w,hh);
  last='';
  /* Norman (2026-11-01) : « l'écran devient noir par moment » : changer la grille ou la taille d'un point efface le canvas ; on le redessine DANS LA MÊME TÂCHE (jamais d'image noire en attendant la prochaine image d'animation). */
  if(grille2||neuf){try{image(performance.now());}catch(_e){}}
}
/* appelé après chaque redessin de la page (et à la première image) : rattache le panneau à l'hôte `.bn-led`, sans jamais recréer un canvas encore valide */
function ensure(){
  var h=document.querySelector('.bn-led');
  if(!h){
    if(panel){arreter();if(io)io.disconnect();if(ro)ro.disconnect();panel=null;host=null;}
    syncMinis();
    return false;
  }
  var cv=h.querySelector('canvas.bn-led-canvas');
  if(!cv){
    cv=document.createElement('canvas');cv.className='bn-led-canvas';
    cv.setAttribute('data-morph-garder','');cv.setAttribute('data-morph-vivant','');cv.setAttribute('data-steam-visible','');cv.setAttribute('aria-hidden','true');
    h.appendChild(cv);
  }
  if(!panel||panel.canvas!==cv||host!==h){
    arreter();
    host=h;
    panel=new Panel(cv,120,14);   /* taille(), juste après, calcule la vraie grille depuis l'hôte */
    if(io)io.disconnect();if(ro)ro.disconnect();
    try{
      if(typeof IntersectionObserver==='function'){io=new IntersectionObserver(function(en){onScreen=en[en.length-1].isIntersecting;if(onScreen)relancer();else arreter();});io.observe(h);}
      if(typeof ResizeObserver==='function'){ro=new ResizeObserver(function(){taille();});ro.observe(h);}
    }catch(_e){}
    taille();
  }
  syncMinis();
  relancer();
  return true;
}

window.addEventListener('resize',function(){taille();});   /* zoom de la page : le rapport de pixels change */
document.addEventListener('visibilitychange',function(){if(document.hidden)arreter();else relancer();});
/* Exe (Steam) : la superposition prend le focus ; le gel de la page (desktop/coeur.js) cache les canvas sauf ceux marqués data-steam-visible (les écrans LED le sont : jamais noirs). Pour ne présenter aucune image pendant la superposition, le dessin s'arrête à la perte du focus (la dernière image reste affichée) et repart au retour du focus (Norman, 2026-11-01 : « toujours noir puis ça revient »). */
window.addEventListener('blur',function(){arreter();});
window.addEventListener('focus',function(){relancer();});
(window.__SOREAL_IDLE_APRES_REDESSIN_V1__=window.__SOREAL_IDLE_APRES_REDESSIN_V1__||[]).push(function(){try{ensure();}catch(_e){}});

/* ------------------------------------------------------------------ outils de l'éditeur Admin (modules/admin-saviez-vous-v1.js) : mêmes polices et même moteur que le panneau */
/* caractères que la police ne dessine pas tels quels : remplacés (Ç -> C) ou retirés (sans équivalent) */
function diagnostic(s){
  var seen={},rempl=[],ret=[],i,ch,up,c,l=Array.from?Array.from(String(s==null?'':s)):String(s==null?'':s).split('');
  for(i=0;i<l.length;i++){
    ch=l[i];if(ch===' '||seen[ch])continue;
    up=ch.toUpperCase();c=canon(ch);
    if(c===up)continue;
    seen[ch]=1;
    if(c==='')ret.push(ch);else rempl.push([ch,c]);
  }
  return {remplaces:rempl,retires:ret};
}
/* aperçu animé d'une phrase sur un canvas de l'éditeur (grille PC 120 x 14) : la phrase défile exactement comme sur la borne ; s'arrête quand le canvas quitte la page ou que l'onglet est masqué */
function apercu(cv,texte){
  if(!cv||!cv.getContext)return null;
  if(cv.__apercuLedV1)cv.__apercuLedV1.arret();
  var p=new Panel(cv,120,14,true),txt=String(texte==null?'':texte)||' ',params={txt:txt},t0=performance.now(),id=0,fin=false,rm=reduit();
  p.reduced=rm;
  p.resize((cv.clientWidth||cv.parentNode&&cv.parentNode.clientWidth)||416);
  function image(now){
    id=0;if(fin||!cv.isConnected)return;
    if(!document.hidden){var dur=jokeDuree(params,p.W)-2;p.draw(sJokes,rm?2:2+((now-t0)/1000)%dur,1,params);}
    if(!rm)id=requestAnimationFrame(image);
  }
  var h={arret:function(){fin=true;if(id){cancelAnimationFrame(id);id=0;}}};
  cv.__apercuLedV1=h;
  image(t0);
  return h;
}

window.__SOREAL_IDLE_BORNE_LED_V1__={ensure:ensure,redessinerTout:function(){if(panel)panel.neuf=true;minis.forEach(function(m){m.panel.neuf=true;});},diagnostic:diagnostic,apercu:apercu,canon:canon,originales:function(l){return TXT[l==='en'?'en':'fr'].jokes.slice();},etat:function(){return {scene:cur&&cur.id,grille:panel?[panel.W,panel.H]:null,actif:actif(),nom:S.nom,num:S.num};}};
})();
