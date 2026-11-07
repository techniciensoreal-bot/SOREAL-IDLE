/*
 * SOREAL IDLE — les YEUX de la borne d'arcade (Norman, 2026-11-05 ; refonte 2026-11-07) : scènes du panneau LED, séparées de borne-led-v1.js (plafond de 2 700 lignes par fichier). Reçoit les primitives de dessin de la borne (px, clamp, sm, couleurs,
 * panneau courant P(), état du jeu S()) ; rien d'autre n'est partagé. window.__SOREAL_IDLE_BORNE_YEUX_V1__(outils) -> { scene(t) (yeux au repos), combat(t) (yeux du combat), fin(t, 'win'|'ko'), params(), du, lancer, ... }.
 */
(function(){
'use strict';
window.__SOREAL_IDLE_BORNE_YEUX_V1__=function(O){
var px=O.px,clamp=O.clamp,sm=O.sm,BLA=O.BLA;
function paneau(){return O.P();}
function etatJeu(){return O.S?O.S():null;}
/* LES YEUX (Norman, 2026-11-05 : « de temps en temps, la borne doit avoir des yeux sur son écran LED, pleins d'expressions : heureux, tristes, suspect, qui regardent à gauche, à droite, etc. ; ça doit se déclencher quand on n'a pas cliqué depuis un moment ») puis (2026-11-07) :
   « quand on lance un combat, les yeux doivent apparaître et regarder la barre de vie ; suivant l'avancée du combat, ils adoptent des émotions ; quand on perd, ses yeux sont des croix ; il faut vraiment lui donner vie ».
   Deux familles de scènes : (1) les yeux AU REPOS (suite d'expressions tirée au lancement, p.seq) ; (2) les yeux DU COMBAT (combat(t)) : ils s'ouvrent, regardent le bout de la barre de vie du boss (les pupilles suivent sa fin quand elle recule), et l'humeur
   suit le combat : concentrés, déterminés quand le boss faiblit, ravis quand il va tomber, inquiets quand la vie du joueur baisse, grimace à chaque coup reçu, peur quand le joueur est presque à terre ; à la fin (fin(t)) : arcs heureux et étincelles (victoire) ou croix (défaite).
   Vie : clignements irréguliers (parfois doubles), petits mouvements involontaires des pupilles, reflet dans la pupille, pupilles qui se dilatent, respiration des paupières, goutte de sueur de la peur, étincelles de la joie. Règle du panneau : le dessin dépend du temps ; seul l'état lissé des pupilles
   et des paupières est gardé dans p.st (comme la mascotte garde p.te). Règle n°3 : entrée et sortie en fondu (gain commun de dessiner) ; animation réduite : yeux ouverts, fixes. Aucun texte : rien à traduire, rien de verrouillé. */
var YEUX_INACTIF_MS=6000,YEUX_PAUSE_MIN_MS=22000,YEUX_PAUSE_ALEA_MS=26000,YEUX_SEG_S=1.5,YEUX_DEBUT_S=1.0,YEUX_FIN_S=0.7;
/* une expression : lt/lb = paupière haute/basse (part de la hauteur), tl = inclinaison du sourcil (+ triste, − fâché), px/py = regard (−1..1), ps = taille de la pupille, sh = arc heureux, x = croix, sw = sueur, sp = étincelles, tr = tremblement (points) */
function ex(o){var b={lt:0,lb:0,tl:0,px:0,py:0,ps:1,sh:0,x:0,sw:0,sp:0,tr:0},k;for(k in o)b[k]=o[k];return b;}
var YEUX_EXPR={
  neutre:function(){return ex({z:0.84});},
  gauche:function(){return ex({px:-1});},
  droite:function(){return ex({px:1});},
  alalter:function(u){return ex({px:u<0.5?-1:1});},        /* regarde à gauche puis à droite */
  haut:function(){return ex({px:0.3,py:-1});},
  content:function(){return ex({sh:1,sp:1,z:0.9});},                    /* yeux en arcs (^ ^) */
  triste:function(){return ex({lt:0.18,tl:0.8,py:0.6,ps:1.15});},
  soupcon:function(){return ex({lt:0.3,lb:0.08,tl:-0.4,px:1,ps:0.7,z:0.93});},
  surpris:function(){return ex({ps:0.55,z:0.68});},
  endormi:function(){return ex({lt:0.42,lb:0.04,py:0.4,ps:0.7,z:0.74});},
  colere:function(){return ex({lt:0.22,tl:-0.9,py:0.1,ps:0.9,z:0.98});},
  clin:function(u){var o=ex({});o.clin=u>0.25&&u<0.75?1:0;return o;}   /* clin d'œil de l'œil droit */
};
var YEUX_TIRAGE=['alalter','content','triste','soupcon','surpris','endormi','colere','clin','haut','gauche','droite'];
function yeuxParams(){
  var seq=['neutre'],pool=YEUX_TIRAGE.slice(),n=3,i,k;
  for(i=0;i<n;i++){k=Math.floor(Math.random()*pool.length);seq.push(pool[k]);pool.splice(k,1);if(i%2===1)seq.push('neutre');}
  seq.push('neutre');
  return {seq:seq,dur:YEUX_DEBUT_S+(seq.length-1)*YEUX_SEG_S+YEUX_FIN_S};
}
function yeuxMel(a,b,w){var o={},k;for(k in a)o[k]=typeof a[k]==='number'?a[k]+(b[k]-a[k])*w:a[k];o.sh=w<0.5?a.sh:b.sh;o.clin=w<0.5?(a.clin||0):(b.clin||0);return o;}
function yeuxEtat(t,seq){
  var n=seq.length,i=Math.max(0,Math.min(n-1,Math.floor((t-YEUX_DEBUT_S)/YEUX_SEG_S+1))),u,a,b;
  if(t<YEUX_DEBUT_S)return YEUX_EXPR.neutre(0);
  var t0=YEUX_DEBUT_S+(i-1)*YEUX_SEG_S;u=clamp((t-t0)/YEUX_SEG_S,0,1);
  a=YEUX_EXPR[seq[i]](u);
  /* fondu de 0,35 s vers l'expression précédente au début du segment (pas de saut) */
  if(i>1&&t-t0<0.35)a=yeuxMel(YEUX_EXPR[seq[i-1]](1),a,sm((t-t0)/0.35));
  return a;
}
function hash(i){var x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x);}
/* Clignement VIVANT : un clignement toutes les 2,2 à 5,4 s (durée 0,16 s), un sur trois est double ; tout dépend du temps seul (déterministe). */
function clignement(t,seed){
  var slot=3.4,k=Math.floor((t+seed)/slot),dec=(hash(k*7+seed)*2.0)+0.2,u=((t+seed)-k*slot)-dec,dbl=hash(k*13+seed)<0.34;
  function un(v){return v>=0&&v<0.16?Math.sin(v/0.16*Math.PI):0;}
  return Math.max(un(u),dbl?un(u-0.26):0);
}
/* petits mouvements involontaires des pupilles (déterministes, doux) */
function frisson(t){return {x:0.07*Math.sin(t*2.3)+0.05*Math.sin(t*5.1+1),y:0.05*Math.sin(t*1.9+2)};}
/* DESSIN d'une paire d'yeux. e : expression ; ox, oy : décalage de la paire (tremblement, saut) ; fermeture : 0..1 (clignement) ; e.z : distance (Norman, 2026-11-07 : « fais-le se rapprocher, s'éloigner ») : 1 = tout près, pleine taille ; les dimensions sont des nombres décimaux, donc la taille varie en douceur (taille de la paire, écart entre les yeux, pupilles). */
function dessiner(t,e,ox,oy,ferm,petit){
  var P=paneau(),W=P.W,H=P.H,z=e.z===undefined?1:e.z,eh=Math.max(2.4,Math.max(6,Math.min(12,H-2))*z),ew=eh*1.2,gap=ew*0.9,y0=(H-eh)/2+(oy||0),i,x,y,j,fr=P.reduced?{x:0,y:0}:frisson(t);
  var a=ew/2,b=eh/2,cxs=[];
  for(i=0;i<2;i++){
    var cx=(W-1)/2+(i?1:-1)*(gap/2+a)+(ox||0),cy=y0+b-0.5,ext=i?1:-1;   /* ext : côté extérieur de l'œil */
    cxs.push(cx);
    var ferme=(e.clin&&i===1)?1:ferm;
    if(e.x>0.5){                                                      /* ŒIL EN CROIX (défaite) : deux diagonales épaisses */
      var ax=a*0.78,bx=b*0.78,N=Math.ceil(Math.max(ax,bx)*3.2),s,q;
      for(s=0;s<=N;s++){q=s/N;for(j=0;j<2;j++){px(Math.round(cx-ax+2*ax*q)+j,Math.round(cy-bx+2*bx*q),BLA,255);px(Math.round(cx+ax-2*ax*q)+j,Math.round(cy-bx+2*bx*q),BLA,255);}}
      continue;
    }
    for(y=Math.floor(y0-0.5);y<=Math.ceil(y0+eh);y++){
      for(x=Math.floor(cx-a-1);x<=Math.ceil(cx+a+1);x++){
        var nx=(x-cx)/a,ny=(y-cy)/b,dedans=nx*nx+ny*ny<=1.0;
        if(!dedans)continue;
        var u2=nx*ext,haut=y0+e.lt*eh+e.tl*eh*0.35*u2+ferme*b*0.95,bas=y0+eh-1-e.lb*eh-ferme*b*0.95+1;
        if(e.sh===1){                                                    /* arc heureux : seule une fine bande du haut de l'œil */
          var ny2=(y-(cy+b*0.3))/(b*0.7),interne=nx*nx+ny2*ny2<=1.0;
          if(interne||y>cy+b*0.3)continue;
        }else{
          if(y<haut-0.5||y>bas-0.5)continue;
          var pr=Math.max(1.2,eh*0.2*e.ps),pcx=cx+(e.px+fr.x)*a*0.45,pcy=cy+(e.py+fr.y)*b*0.4;
          if((x-pcx)*(x-pcx)+(y-pcy)*(y-pcy)<=pr*pr){
            /* reflet : un point allumé dans la pupille, en haut à gauche, qui donne le regard */
            if(pr>=1.6&&Math.abs(x-Math.round(pcx-pr*0.45))<0.6&&Math.abs(y-Math.round(pcy-pr*0.45))<0.6)px(x,y,BLA,255);
            continue;                                                   /* pupille : points éteints */
          }
        }
        px(x,y,BLA,235);
      }
    }
    if(ferme>0.9&&e.sh!==1){for(x=Math.round(cx-a*0.8);x<=Math.round(cx+a*0.8);x++)px(x,Math.round(cy),BLA,235);}   /* œil fermé : un trait */
    if(e.sw&&i===1){                                                   /* goutte de sueur : naît au coin extérieur de l'œil droit, glisse et s'efface */
      var f=(t*0.9)%1,gx=Math.round(cx+a+1.2),gy=Math.round(y0-1+f*(eh*0.9));
      px(gx,gy,BLA,230*(1-f*0.7));px(gx,gy+1,BLA,200*(1-f*0.7));px(gx-1,gy+1,BLA,140*(1-f*0.7));px(gx+1,gy+1,BLA,140*(1-f*0.7));
    }
  }
  if(e.sp&&!P.reduced){                                                /* étincelles de joie : petites croix qui naissent et meurent autour des yeux */
    var k,rel=[[-1.5,-0.55],[1.5,-0.7],[-1.05,0.95],[1.1,0.9],[0,-1.05]];
    for(k=0;k<rel.length;k++){
      var ph=((t*1.15+k*0.37)%1),al=Math.sin(ph*Math.PI);
      if(al<=0.12)continue;
      var sx=Math.round(W/2+rel[k][0]*(gap/2+a*2)*0.62),sy=Math.round(y0+b+rel[k][1]*b*1.15);
      px(sx,sy,BLA,255*al);px(sx-1,sy,BLA,170*al);px(sx+1,sy,BLA,170*al);px(sx,sy-1,BLA,170*al);px(sx,sy+1,BLA,170*al);
    }
  }
}
/* distance des yeux au repos (Norman, 2026-11-07 : « il doit zoomer pour certaines raisons, pas tout le temps ; s'il est énervé il zoome et nous regarde de plus près ») : les yeux arrivent de loin d'un bond (léger dépassement), puis la distance ne change QUE selon l'expression (énervé, soupçonneux : plus près ; surpris, endormi : plus loin ; sinon distance fixe) ; ils s'éloignent avant de disparaître */
function sortieDe(u){u=clamp(u,0,1);var v=u-1;return 1+2.70158*v*v*v+1.70158*v*v;}   /* « easeOutBack » : arrive un peu trop près, puis se replace */
function zoomRepos(t,dur,ze){
  var entree=clamp(t/0.8,0,1),sortie=clamp((dur-t)/0.7,0,1);
  var z=entree<1?0.22+(ze-0.22)*sortieDe(entree):ze;
  return Math.max(0.12,z*(0.5+0.5*sm(sortie)));
}
function sYeux(t){
  var P=paneau(),p=P.p,seq=p.seq||['neutre','neutre'];
  var e=P.reduced?YEUX_EXPR.neutre(0):yeuxEtat(t,seq),bk=P.reduced?0:clignement(t,0.9),dur=p.dur||8;
  e.z=P.reduced?1:zoomRepos(t,dur,e.z===undefined?0.84:e.z);
  dessiner(t,e,0,0,bk);
}
/* ---------------------------------------------------------------- les yeux DU COMBAT */
var CB_OUVERTURE_S=0.45,CB_SURPRISE_S=1.15;
/* Humeur voulue à cet instant d'après le combat : { cible : expression, regard : null|'joueur' } ; vie = vie du boss (0..1), pj = vie du joueur (0..1). */
function humeur(t,pp,vie,pj,issue,st){
  var tendu=pj<0.5&&issue!=='victoire';
  if(t<CB_SURPRISE_S)return ex({ps:0.5});                                       /* l'éveil : yeux grands ouverts, pupilles minuscules */
  if(st.coup>0&&t-st.coup<0.32)return ex({lt:0.36,lb:0.34,tl:0.2,ps:0.7,tr:1});            /* un coup reçu : grimace, yeux plissés */
  if(pj<0.2)return ex({tl:0.9,lt:0.1,ps:0.45,sw:1,tr:1});                                 /* peur : yeux écarquillés, sourcils inquiets, sueur, tremblement */
  if(vie<0.12)return ex({ps:0.55,sp:1});                                                  /* le boss va tomber : yeux grands, étincelles */
  if(vie<0.4&&pj>=0.4)return ex({lt:0.14,tl:-0.75,ps:0.8});                               /* déterminés : sourcils en V */
  if(tendu)return ex({tl:0.55,lt:0.08,ps:1.1,py:0.1});                                    /* inquiets */
  return ex({lt:0.1,tl:-0.2,ps:0.95});                                                    /* concentrés */
}
/* distance des yeux pendant le combat : fixe, sauf à des moments naturels — l'arrivée d'un bond ; un recul sec à chaque coup reçu ; un recul quand la PEUR s'installe (une seule fois, puis il se détend un peu) ; énervé (le boss faiblit) il se penche vers l'écran et nous regarde de plus près ; tout près quand le boss va tomber */
function zoomCombat(t,vie,pj,st){
  var z=0.82;
  if(t<0.9)return 0.24+(0.82-0.24)*sortieDe(t/0.9);
  if(st.coup>0&&t-st.coup<0.34)z=0.62;
  else if(pj<0.2){if(!st.peurT)st.peurT=t;z=(t-st.peurT)<1.4?0.60:0.70;}
  else{
    st.peurT=0;
    if(vie<0.12)z=1.0;
    else if(vie<0.4&&pj>=0.4)z=0.95;
    else if(pj<0.5)z=0.76;
  }
  return z;
}
function sCombat(t){
  var P=paneau(),pp=P.p,S=etatJeu(),W=P.W;
  if(!pp.st)pp.st={e:ex({lt:0.5,lb:0.2}),t:t,coup:0,pj:-1,regard:0};
  var st=pp.st,vie=S&&S.pv?clamp(S.pv.pct,0,1):1,pj=S&&S.bar?clamp(S.bar.v,0,1):1,dt=clamp(t-st.t,0,0.1),k,c,g;
  st.t=t;
  if(st.pj>=0&&st.pj-pj>=0.03)st.coup=t;
  st.pj=pj;
  var cible=humeur(t,pp,vie,pj,pp.issue,st);
  /* le regard : le bout de la barre de vie du boss (en bas de l'écran) ; de temps en temps un coup d'œil vers la vie du joueur (en haut à gauche), puis de nouveau la barre */
  var len=W-2,xb=1+vie*len,gx=clamp((xb/W)*2-1,-1,1)*0.95,cy=0.85;
  /* combat SERRÉ (Norman, 2026-11-07 : « quand c'est serré, il doit regarder la barre de vie du boss puis la nôtre plusieurs fois, mais pas trop vite pour que ce soit naturel ») : toutes les ~2,9 s (durée variable d'un tour à l'autre), il quitte la barre du boss pour regarder la nôtre un peu moins d'une seconde, puis revient ; hors combat serré : un seul coup d'œil rare vers notre vie */
  if(st.serreT===undefined||t-st.serreT>0.5||t<st.serreT){st.serreT=t;st.serre=typeof O.serre==='function'?Boolean(O.serre()):false;}
  var ph;
  if(st.serre&&t>CB_SURPRISE_S){
    var per=2.9,u0=t-CB_SURPRISE_S,tour=Math.floor(u0/per),u=u0-tour*per,dec=hash(tour+3)*0.5;
    if(u>1.7+dec&&u<2.55+dec*0.6){gx=-0.9;cy=-0.55;}
  }else{
    ph=(t+2)%7.5;
    if(t>CB_SURPRISE_S&&ph>6.4&&ph<7.1){gx=-0.9;cy=-0.55;}
  }
  if(t<CB_OUVERTURE_S)cible=ex({lt:0.6,lb:0.25,px:0,py:0,ps:1});
  cible.px=gx;cible.py=cy;
  cible.z=P.reduced?0.85:zoomCombat(t,vie,pj,st);
  if(t>=CB_OUVERTURE_S&&t<CB_SURPRISE_S){cible.px=gx*0.4;cible.py=0.2;}                  /* il lève d'abord les yeux, étonné, avant de baisser le regard vers la barre */
  /* lissage : paupières et sourcils suivent en ~0,12 s, la pupille un peu plus vite (le regard « accroche » le bout de la barre) */
  var rate=9,rateRegard=16;
  if(P.reduced){st.e={};for(k in cible)st.e[k]=cible[k];}                                  /* mouvement réduit : l'expression voulue, tout de suite et fixe */
  for(k in cible){if(typeof cible[k]!=='number')continue;c=(k==='px'||k==='py')?rateRegard:(k==='z'?(cible.z<st.e.z?20:11):rate);st.e[k]=(st.e[k]===undefined?cible[k]:st.e[k])+(cible[k]-(st.e[k]===undefined?cible[k]:st.e[k]))*(1-Math.exp(-dt*c));}
  var e=st.e,o={},kk;for(kk in e)o[kk]=e[kk];
  o.sh=0;o.clin=0;o.x=0;o.sw=cible.sw||0;o.sp=cible.sp||0;
  g=P.reduced?0:(cible.tr?Math.sin(t*70)*0.5:0);
  var resp=P.reduced?0:0.04*Math.sin(t*2.1);o.lt+=resp;
  var ferm=P.reduced?0:(t<CB_OUVERTURE_S?clamp(1-t/CB_OUVERTURE_S,0,1):clignement(t,0.4));
  dessiner(t,o,Math.round(g),0,ferm,true);
}
/* ---------------------------------------------------------------- la FIN du combat : arcs heureux et étincelles (victoire) ou croix (défaite) */
function sFin(t,issue){
  var P=paneau(),sh=P.reduced?0:Math.sin(t*70);
  if(issue==='ko'){
    if(t<0.3){dessiner(t,ex({ps:0.35,z:P.reduced?1:1.0}),0,0,0,true);return;}                      /* le choc : yeux grands, pupilles minuscules */
    var u=t-0.3,tr=P.reduced?0:Math.round(sh*1.5*Math.max(0,1-u/1.1)),zk=P.reduced?1:1.0-0.68*sm(u/2.2);   /* les croix s'éloignent dans le lointain */
    dessiner(t,ex({x:1,z:zk}),tr,0,0,true);
    return;
  }
  var h=P.reduced?0:-Math.round(1.6*Math.abs(Math.sin(t*8.5))*Math.max(0,1-t/2.2));           /* il saute de joie, de moins en moins haut */
  var zv=P.reduced?1:0.80+0.22*sm(t/0.9)+0.05*Math.sin(t*9);                                      /* il s'approche en sautant de joie */
  if(t<0.3)dessiner(t,ex({ps:0.55,z:zv}),0,h,0,true);else dessiner(t,ex({sh:1,sp:1,z:zv}),0,h,0,true);
}
/* Inactivité : instant du dernier clic / touche / toucher (au chargement : maintenant, donc jamais d'yeux dans les premières secondes) ; yeuxAt : une apparition toutes les 22 à 48 s au plus. */
var dernierClic=(window.performance&&performance.now)?performance.now():0,yeuxAt=0;
(function(){var f=function(){dernierClic=(window.performance&&performance.now)?performance.now():0;};try{window.addEventListener('pointerdown',f,true);window.addEventListener('keydown',f,true);window.addEventListener('touchstart',f,true);}catch(_e){}})();
function du(now,combat){return !combat&&now-dernierClic>=YEUX_INACTIF_MS&&now>=yeuxAt;}
function lancer(now){yeuxAt=now+YEUX_PAUSE_MIN_MS+Math.random()*YEUX_PAUSE_ALEA_MS;return yeuxParams();}
return {scene:sYeux,combat:sCombat,fin:sFin,params:yeuxParams,du:du,lancer:lancer,clic:function(){return dernierClic;},yeuxAt:function(){return yeuxAt;},regler:function(c,a){dernierClic=c;yeuxAt=a;}};
};
})();
