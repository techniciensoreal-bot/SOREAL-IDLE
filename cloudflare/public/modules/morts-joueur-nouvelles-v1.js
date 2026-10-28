/*
 * SOREAL IDLE — cinq nouvelles morts du joueur (Norman, 2026-10-28 : « 5 animations de mort supplémentaires, totalement différentes de ce qu'on a déjà, avec de nouveaux sons ; je veux les voir en local pour valider avant intégration »).
 * Les trois existantes (modules/mort-joueur-v1.js) éclatent l'image en gros pixels puis la reforment (fondu, rembobinage VHS, clignotement). Ici, cinq mises à mort d'une autre nature, toutes dessinées sur le portrait du joueur :
 *   cendres   : l'image brûle de bas en haut, braises et cendres montent ;          son : crépitement du feu + grondement
 *   trounoir  : l'image est aspirée en spirale par un trou noir ;                   son : souffle qui plonge + gros « boum » sourd
 *   vitre     : l'image se fendille puis éclate en éclats de verre ;                son : coup sec + tintement des éclats
 *   tranche   : un coup d'épée la coupe en deux, les moitiés glissent ;             son : sifflement de lame + « shing » + chute
 *   ame       : le corps se vide de ses couleurs, l'âme s'élève en fantôme ;        son : voix creuses qui montent + cloche
 * Chacune finit par le retour du joueur À SA PLACE. Les sons sont synthétisés (WebAudio) : aucun fichier. Pas encore branchée sur le jeu : page d'aperçu cloudflare/tools/apercu-morts/ (validation avant intégration).
 *   window.__SOREAL_IDLE_MORTS_NOUVELLES_V1__ = { variantes, preparer(id,img,LW,LH), dessiner(id,c,t,cache,LW,LH), son(id), jouer(id,canvas,img,opts) }
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_MORTS_NOUVELLES_V1__)return;

function rnd(s){var x=Math.sin(s*127.1+311.7)*43758.5453;return x-Math.floor(x);}
function cl(x,a,b){return x<a?a:x>b?b:x;}
function lisse(x){x=cl(x,0,1);return x*x*(3-2*x);}
function sortie(x){x=cl(x,0,1);return 1-Math.pow(1-x,3);}
function entree(x){x=cl(x,0,1);return x*x*x;}

var VARIANTES=[
  {id:'cendres',nom:'Cendres',duree:4.2,aide:'L’image brûle de bas en haut ; braises et cendres s’envolent.'},
  {id:'trounoir',nom:'Trou noir',duree:3.6,aide:'L’image est aspirée en spirale, puis le joueur ressort du vide.'},
  {id:'vitre',nom:'Vitre brisée',duree:4.0,aide:'L’image se fissure, puis éclate en éclats de verre.'},
  {id:'tranche',nom:'Tranché',duree:3.6,aide:'Un coup d’épée coupe l’image en deux ; les moitiés glissent, puis se rejoignent.'},
  {id:'ame',nom:'Âme',duree:4.4,aide:'Le corps perd ses couleurs, l’âme s’élève en fantôme puis revient.'}
];

/* ---------- préparation (une fois par image) : copies de travail, éclats, particules ---------- */
function canvasDe(img,LW,LH,filtre){
  var cv=document.createElement('canvas');cv.width=LW;cv.height=LH;
  var c=cv.getContext('2d');
  var iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height;
  var ra=LW/LH,sx=0,sy=0,sw=iw,sh=ih;
  if(iw/ih>ra){sw=ih*ra;sx=(iw-sw)/2;}else{sh=iw/ra;sy=(ih-sh)/2;}
  c.drawImage(img,sx,sy,sw,sh,0,0,LW,LH);
  if(filtre==='gris'){
    var d=c.getImageData(0,0,LW,LH),p=d.data;
    for(var i=0;i<p.length;i+=4){var g=p[i]*.3+p[i+1]*.59+p[i+2]*.11;p[i]=g*.78;p[i+1]=g*.9;p[i+2]=g*1.12>255?255:g*1.12;}
    c.putImageData(d,0,0);
  }
  return cv;
}

function preparer(id,img,LW,LH){
  var cache={img:canvasDe(img,LW,LH),LW:LW,LH:LH};
  if(id==='cendres'){
    /* chaque colonne a son propre front de flamme (bords déchiquetés) ; des particules naissent là où le front passe */
    cache.bords=[];for(var x=0;x<LW;x+=2)cache.bords.push((rnd(x*.37)-.5)*.1+(rnd(x*.11+4)-.5)*.06);
    cache.parts=[];
    for(var k=0;k<260;k++){
      var px=rnd(k*3+1)*LW,py=rnd(k*5+2)*LH;
      cache.parts.push({x:px,y:py,v:18+rnd(k+7)*70,d:(rnd(k+9)-.5)*60,r:1+rnd(k+3)*2.6,braise:rnd(k+11)<.35,vie:1.1+rnd(k+13)*1.6});
    }
  }else if(id==='vitre'){
    /* éclats : points décalés sur une grille, chaque case coupée en deux triangles */
    var n=7,m=7,pts=[];
    for(var j=0;j<=m;j++){pts.push([]);for(var i2=0;i2<=n;i2++){
      var jx=(i2===0||i2===n)?0:(rnd(i2*13+j*7)-.5)*.55,jy=(j===0||j===m)?0:(rnd(i2*5+j*17+3)-.5)*.55;
      pts[j].push([(i2+jx)/n*LW,(j+jy)/m*LH]);
    }}
    cache.impact=[LW*(.42+rnd(3)*.16),LH*(.38+rnd(5)*.2)];
    cache.eclats=[];
    for(var jj=0;jj<m;jj++)for(var ii=0;ii<n;ii++){
      var a=pts[jj][ii],b=pts[jj][ii+1],c2=pts[jj+1][ii+1],d2=pts[jj+1][ii];
      [[a,b,c2],[a,c2,d2]].forEach(function(tri,q){
        var cx=(tri[0][0]+tri[1][0]+tri[2][0])/3,cy=(tri[0][1]+tri[1][1]+tri[2][1])/3;
        var dist=Math.hypot(cx-cache.impact[0],cy-cache.impact[1])/Math.hypot(LW,LH);
        var s=jj*50+ii*7+q;
        cache.eclats.push({tri:tri,cx:cx,cy:cy,delai:dist*.9+rnd(s)*.18,vx:(cx-cache.impact[0])/LW*160+(rnd(s+1)-.5)*70,vy:-30-rnd(s+2)*90,rot:(rnd(s+3)-.5)*9,reflet:rnd(s+4)});
      });
    }
    cache.fissures=[];
    for(var f=0;f<13;f++){
      var ang=f/13*Math.PI*2+rnd(f)*.4,pts2=[[cache.impact[0],cache.impact[1]]],lx=cache.impact[0],ly=cache.impact[1];
      for(var s2=0;s2<7;s2++){var l=LW*(.07+rnd(f*9+s2)*.1);var ga=ang+(rnd(f*3+s2*5)-.5)*.5;lx+=Math.cos(ga)*l;ly+=Math.sin(ga)*l;pts2.push([lx,ly]);}
      cache.fissures.push(pts2);
    }
  }else if(id==='ame'){
    cache.gris=canvasDe(img,LW,LH,'gris');
    cache.orbes=[];for(var o=0;o<26;o++)cache.orbes.push({x:rnd(o*3)*LW,y:rnd(o*5+1)*LH,v:12+rnd(o+4)*40,r:1.2+rnd(o+6)*2.4,ph:rnd(o+8)*6.28});
  }
  return cache;
}

/* ---------- dessins : une image, t en secondes ---------- */
function fond(c,LW,LH,col){c.fillStyle=col||'#101827';c.fillRect(0,0,LW,LH);}

function dessinerCendres(c,t,k,LW,LH){
  var T_BRULE=2.4,T_FIN=3.3;
  fond(c,LW,LH,'#0d0f16');
  var u=cl(t/T_BRULE,0,1);
  var base=LH*(1.06-1.14*u);                        /* le front monte de bas en haut */
  if(t<T_FIN){
    for(var x=0,i=0;x<LW;x+=2,i++){
      var f=base+k.bords[i]*LH+Math.sin(x*.07+t*5)*3;
      var h=cl(f,0,LH);
      if(h>0)c.drawImage(k.img,x,0,2,h,x,0,2,h);
      if(f<LH+14&&u<1.0){
        /* roussi juste au-dessus, puis le liseré de braise incandescente */
        c.fillStyle='rgba(20,8,2,.55)';c.fillRect(x,Math.max(0,f-16),2,Math.min(16,f));
        var r=rnd(x*.3+Math.floor(t*14)),g=rnd(x*.2+9+Math.floor(t*14));
        c.fillStyle='rgb(255,'+Math.round(90+g*140)+','+Math.round(r*40)+')';c.fillRect(x,Math.max(0,f-3),2,4);
        c.fillStyle='rgba(255,140,40,.35)';c.fillRect(x,Math.max(0,f-9),2,6);
      }
    }
    /* braises et cendres : naissent quand le front passe, s'élèvent et se dispersent */
    for(var p=0;p<k.parts.length;p++){
      var q=k.parts[p],tn=(1.06-q.y/LH)/1.14*T_BRULE;   /* instant où le front atteint la hauteur de la particule */
      var age=t-tn;if(age<0||age>q.vie)continue;
      var a=1-age/q.vie,x2=q.x+q.d*age+Math.sin(age*4+p)*5,y2=q.y-q.v*age;
      c.globalAlpha=a;
      c.fillStyle=q.braise?(age<q.vie*.5?'#ffb347':'#ff5a1f'):(age<.3?'#4a4a52':'#2b2b31');
      c.fillRect(Math.round(x2),Math.round(y2),Math.ceil(q.r),Math.ceil(q.r));
    }
    c.globalAlpha=1;
  }
  if(t>T_FIN-.1){
    /* le joueur revient : de l'ombre à l'image, en fondu doux */
    var r2=lisse((t-(T_FIN-.1))/(.9));c.globalAlpha=r2;c.drawImage(k.img,0,0);c.globalAlpha=1;
  }
}

function dessinerTrouNoir(c,t,k,LW,LH){
  var T_ASPIRE=2.0,T_VIDE=2.5,T_RETOUR=3.3;
  fond(c,LW,LH,'#07060d');
  var cx=LW/2,cy=LH/2,R=Math.hypot(LW,LH)/2;
  if(t<T_VIDE){
    var u=cl(t/T_ASPIRE,0,1),e=u*u*(3-2*u);
    /* l'image est découpée en couronnes qui tournent d'autant plus vite qu'elles sont proches du centre, tandis que tout rétrécit vers le trou */
    var N=16;
    for(var i=N-1;i>=0;i--){
      var r0=i/N*R,r1=(i+1)/N*R+1;
      var tors=(1-i/N)*e*9.5+e*e*5;
      var s=1-.96*Math.pow(e,1.15);
      c.save();
      c.beginPath();c.arc(cx,cy,r1*Math.max(s,.02),0,Math.PI*2);if(r0>0)c.arc(cx,cy,r0*Math.max(s,.02),0,Math.PI*2,true);
      c.clip();
      c.translate(cx,cy);c.rotate(tors);c.scale(s,s);c.translate(-cx,-cy);
      c.drawImage(k.img,0,0);
      c.restore();
    }
    /* le trou : disque noir au cœur cerné d'un anneau violet incandescent qui grossit */
    var rt=(.02+e*.34)*R;
    var g=c.createRadialGradient(cx,cy,rt*.55,cx,cy,rt*1.9);
    g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(.42,'rgba(0,0,0,1)');g.addColorStop(.5,'rgba(190,110,255,.95)');g.addColorStop(.75,'rgba(80,20,170,.45)');g.addColorStop(1,'rgba(40,10,90,0)');
    c.fillStyle=g;c.beginPath();c.arc(cx,cy,rt*1.9,0,Math.PI*2);c.fill();
    /* étincelles aspirées */
    for(var s2=0;s2<40;s2++){
      var ang=rnd(s2*3)*6.28+t*(2+rnd(s2)*3),rr=(1-((t*.5+rnd(s2+5))%1))*R*.9;
      c.fillStyle='rgba(235,210,255,'+(.25+rnd(s2+8)*.5).toFixed(2)+')';c.fillRect(cx+Math.cos(ang)*rr,cy+Math.sin(ang)*rr,2,2);
    }
    if(t>T_ASPIRE){
      /* le trou se referme sur un éclat */
      var w=cl((t-T_ASPIRE)/(T_VIDE-T_ASPIRE),0,1);
      c.fillStyle='rgba(255,255,255,'+(w<.25?w*3.2:Math.max(0,1-(w-.25)*1.4)).toFixed(2)+')';c.fillRect(0,0,LW,LH);
      fond(c,LW,LH,'rgba(7,6,13,'+Math.min(1,w*1.3).toFixed(2)+')');
    }
  }else if(t<T_RETOUR+.4){
    /* retour : le joueur jaillit du vide en grossissant, avec un léger dépassement */
    var r=cl((t-T_VIDE)/(T_RETOUR-T_VIDE),0,1),sc=r<.8?lisse(r/.8)*1.08:1.08-.08*lisse((r-.8)/.2);
    var pivot=Math.max(.001,sc);
    c.save();c.translate(cx,cy);c.scale(pivot,pivot);c.rotate((1-lisse(r))*-2.2);c.translate(-cx,-cy);c.globalAlpha=Math.min(1,r*2);c.drawImage(k.img,0,0);c.restore();c.globalAlpha=1;
    var g2=c.createRadialGradient(cx,cy,0,cx,cy,R*.5*(1-r)+4);g2.addColorStop(0,'rgba(190,110,255,'+(.8*(1-r)).toFixed(2)+')');g2.addColorStop(1,'rgba(190,110,255,0)');
    c.fillStyle=g2;c.fillRect(0,0,LW,LH);
  }else{c.drawImage(k.img,0,0);}
}

function dessinerVitre(c,t,k,LW,LH){
  var T_FISSURE=.7,T_CASSE=.8,T_FIN=2.9;
  fond(c,LW,LH,'#0c1017');
  var imp=k.impact;
  if(t<T_CASSE){
    c.drawImage(k.img,0,0);
    var u=cl(t/T_FISSURE,0,1);
    c.lineWidth=1.4;
    for(var f=0;f<k.fissures.length;f++){
      var pts=k.fissures[f],visibles=1+u*(pts.length-1);
      c.strokeStyle='rgba(235,245,255,'+(.55+.4*u).toFixed(2)+')';
      c.beginPath();c.moveTo(pts[0][0],pts[0][1]);
      for(var i=1;i<pts.length;i++){
        if(i<=visibles){c.lineTo(pts[i][0],pts[i][1]);}
        else if(i-1<visibles){var r=visibles-(i-1);c.lineTo(pts[i-1][0]+(pts[i][0]-pts[i-1][0])*r,pts[i-1][1]+(pts[i][1]-pts[i-1][1])*r);break;}
      }
      c.stroke();
    }
    /* impact : un petit éclat blanc */
    var ei=Math.max(0,1-t/.18);c.fillStyle='rgba(255,255,255,'+(ei*.9).toFixed(2)+')';c.beginPath();c.arc(imp[0],imp[1],8+ei*14,0,Math.PI*2);c.fill();
  }else if(t<T_FIN){
    var tt=t-T_CASSE;
    for(var q=0;q<k.eclats.length;q++){
      var e=k.eclats[q],a=tt-e.delai;
      var x=0,y=0,rot=0,alpha=1;
      if(a>0){x=e.vx*a;y=e.vy*a+420*a*a;rot=e.rot*a;alpha=cl(1-(a-.5)/1.1,0,1);}
      if(alpha<=0)continue;
      c.save();
      c.globalAlpha=alpha;
      c.translate(e.cx+x,e.cy+y);c.rotate(rot);c.translate(-e.cx,-e.cy);
      c.beginPath();c.moveTo(e.tri[0][0],e.tri[0][1]);c.lineTo(e.tri[1][0],e.tri[1][1]);c.lineTo(e.tri[2][0],e.tri[2][1]);c.closePath();
      c.save();c.clip();c.drawImage(k.img,0,0);
      /* reflet clair qui glisse sur l'éclat */
      var bril=(Math.sin(tt*6+e.reflet*9)+1)/2*.28;c.fillStyle='rgba(255,255,255,'+bril.toFixed(2)+')';c.fillRect(0,0,LW,LH);
      c.restore();
      c.strokeStyle='rgba(235,245,255,.8)';c.lineWidth=1;c.stroke();
      c.restore();
    }
    c.globalAlpha=1;
  }
  if(t>T_FIN-.3){
    var r2=lisse((t-(T_FIN-.3))/.9);c.globalAlpha=r2;c.drawImage(k.img,0,0);
    /* un reflet traverse l'image qui se reforme */
    var bx=-LW*.3+r2*LW*1.6;var g=c.createLinearGradient(bx-30,0,bx+30,LH);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.5,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,0)');
    c.fillStyle=g;c.fillRect(0,0,LW,LH);c.globalAlpha=1;
  }
}

function dessinerTranche(c,t,k,LW,LH){
  var T_COUP=.38,T_GLISSE=1.9,T_RETOUR=2.9;
  fond(c,LW,LH,'#0d1118');
  /* la ligne de coupe : de coin haut-droit à coin bas-gauche, un peu inclinée */
  var A=[LW*1.05,-LH*.05],B=[-LW*.05,LH*1.05];
  var nx=-(B[1]-A[1]),ny=(B[0]-A[0]),nl=Math.hypot(nx,ny);nx/=nl;ny/=nl;
  var ecart=0,tilt=0,alpha=1;
  if(t<T_COUP){
    c.drawImage(k.img,0,0);
    /* le trait d'épée : il court le long de la ligne, très lumineux, qui s'effile */
    var u=t/T_COUP,pos=lisse(u);
    var x2=A[0]+(B[0]-A[0])*pos,y2=A[1]+(B[1]-A[1])*pos;
    c.lineCap='round';
    c.strokeStyle='rgba(255,255,255,.95)';c.lineWidth=6*(1-u*.5);c.beginPath();c.moveTo(A[0],A[1]);c.lineTo(x2,y2);c.stroke();
    c.strokeStyle='rgba(150,200,255,.5)';c.lineWidth=15*(1-u*.5);c.beginPath();c.moveTo(A[0],A[1]);c.lineTo(x2,y2);c.stroke();
    return;
  }
  var tt=t-T_COUP;
  if(t<T_GLISSE){ecart=sortie(tt/(T_GLISSE-T_COUP))*LW*.22;tilt=sortie(tt/(T_GLISSE-T_COUP))*.16;alpha=1-lisse((tt-.9)/(T_GLISSE-T_COUP-.9))*.5;}
  else if(t<T_RETOUR){var r=lisse((t-T_GLISSE)/(T_RETOUR-T_GLISSE));ecart=LW*.22*(1-r);tilt=.16*(1-r);alpha=.5+.5*r;}
  /* deux moitiés : chacune glisse le long de la normale et pivote un peu, en tombant légèrement */
  for(var s=-1;s<=1;s+=2){
    c.save();
    c.beginPath();
    if(s<0){c.moveTo(A[0],A[1]);c.lineTo(B[0],B[1]);c.lineTo(-LW,LH*2);c.lineTo(-LW,-LH);c.lineTo(A[0],-LH);}
    else{c.moveTo(A[0],A[1]);c.lineTo(B[0],B[1]);c.lineTo(LW*2,LH*2);c.lineTo(LW*2,-LH);c.lineTo(A[0],-LH);}
    c.closePath();
    var tombe=t<T_GLISSE?Math.pow(Math.max(0,tt-.15),2)*LH*.35:Math.pow(Math.max(0,T_GLISSE-T_COUP-.15),2)*LH*.35*(1-lisse((t-T_GLISSE)/(T_RETOUR-T_GLISSE)));
    c.translate(LW/2+nx*s*ecart*(s<0?.9:1.1),LH/2+ny*s*ecart+tombe);
    c.rotate(tilt*s*(s<0?1:-1)*-1);
    c.translate(-LW/2,-LH/2);
    c.globalAlpha=alpha;c.save();c.clip();c.drawImage(k.img,0,0);c.restore();
    c.restore();
  }
  c.globalAlpha=1;
  /* bord de coupe encore incandescent, qui s'éteint ; étincelles */
  if(tt<.9){
    var l=1-tt/.9;c.strokeStyle='rgba(255,245,200,'+(l*.85).toFixed(2)+')';c.lineWidth=2+l*3;c.beginPath();c.moveTo(A[0],A[1]);c.lineTo(B[0],B[1]);c.stroke();
    for(var i=0;i<24;i++){
      var p=rnd(i*3)*1,x3=A[0]+(B[0]-A[0])*p+nx*(rnd(i)-.5)*30*tt,y3=A[1]+(B[1]-A[1])*p+ny*(rnd(i)-.5)*30*tt-tt*20*rnd(i+4)+160*tt*tt*rnd(i+6);
      c.fillStyle='rgba(255,'+Math.round(190+rnd(i+2)*60)+',120,'+(l*.9).toFixed(2)+')';c.fillRect(x3,y3,2,2);
    }
  }
  if(t>=T_RETOUR){
    c.drawImage(k.img,0,0);
    var w=cl(1-(t-T_RETOUR)/.35,0,1);if(w>0){c.fillStyle='rgba(255,255,255,'+(w*.55).toFixed(2)+')';c.fillRect(0,0,LW,LH);}
  }
}

function dessinerAme(c,t,k,LW,LH){
  var T_GRIS=.55,T_MONTE=2.5,T_PAUSE=2.75,T_RETOUR=3.9;
  fond(c,LW,LH,'#0a0d17');
  /* 1. le corps se vide de ses couleurs (et tremble un instant) */
  var g=t<T_GRIS?lisse(t/T_GRIS):1;
  var tremble=t<T_GRIS?(rnd(Math.floor(t*50))-.5)*4:0;
  var corps=1;
  if(t>T_GRIS)corps=cl(1-(t-T_GRIS)/1.3,.12,1);       /* le corps sombre s'éteint, il ne disparaît pas tout à fait */
  if(t>=T_PAUSE)corps=.12+.88*lisse((t-T_PAUSE)/(T_RETOUR-T_PAUSE));
  var vraie=t>=T_RETOUR-.5?lisse((t-(T_RETOUR-.5))/.5):0;     /* en fin de retour les vraies couleurs reviennent */
  c.save();c.translate(tremble,0);
  c.globalAlpha=corps;c.drawImage(k.img,0,0);
  c.globalAlpha=corps*g*(1-vraie);c.drawImage(k.gris,0,0);
  c.restore();c.globalAlpha=1;
  /* 2. l'âme : copie bleutée, translucide, qui s'élève en ondulant et s'effile ; elle redescend à la fin */
  if(t>T_GRIS*.6&&t<T_RETOUR){
    var mont=0;
    if(t<T_MONTE)mont=sortie((t-T_GRIS*.6)/(T_MONTE-T_GRIS*.6));
    else if(t<T_PAUSE)mont=1;
    else mont=1-lisse((t-T_PAUSE)/(T_RETOUR-T_PAUSE));
    var a=t<T_MONTE?(.62-.45*cl((t-1.4)/1.1,0,1)):(t<T_PAUSE?.17:.17+.45*lisse((t-T_PAUSE)/(T_RETOUR-T_PAUSE)));
    var N=36,h=LH/N,haut=-mont*LH*.62;
    for(var i=0;i<N;i++){
      var y=i*h,onde=Math.sin(i*.45+t*5)*(4+mont*9)*(.4+i/N);
      var sy=y,dy=y*(1-mont*.28)+haut;
      c.globalAlpha=a*(1-(i/N)*.55*mont);
      c.drawImage(k.gris,0,sy,LW,h+1,onde+mont*0,dy,LW,h+1);
    }
    c.globalAlpha=1;
    /* halo de l'âme */
    var hy=LH*.4+haut*.7,gr=c.createRadialGradient(LW/2,hy,6,LW/2,hy,LW*.55);
    gr.addColorStop(0,'rgba(190,225,255,'+(.3*mont).toFixed(2)+')');gr.addColorStop(1,'rgba(190,225,255,0)');
    c.fillStyle=gr;c.fillRect(0,0,LW,LH);
  }
  /* 3. petites lueurs qui montent avec l'âme */
  if(t>T_GRIS&&t<T_RETOUR){
    for(var o=0;o<k.orbes.length;o++){
      var q=k.orbes[o],age=(t-T_GRIS+q.ph)%2.2,x=q.x+Math.sin(age*3+q.ph)*8,y=q.y-q.v*age;
      c.fillStyle='rgba(205,235,255,'+(Math.max(0,1-age/2.2)*.8).toFixed(2)+')';
      c.beginPath();c.arc(x,y,q.r,0,Math.PI*2);c.fill();
    }
  }
  if(t>=T_RETOUR-.4){
    var w=cl(1-(t-(T_RETOUR-.4))/.5,0,1);if(w>0){c.fillStyle='rgba(215,235,255,'+(w*.5).toFixed(2)+')';c.fillRect(0,0,LW,LH);}
    if(t>=T_RETOUR){c.drawImage(k.img,0,0);}
  }
}

function dessiner(id,c,t,cache,LW,LH){
  if(id==='cendres')dessinerCendres(c,t,cache,LW,LH);
  else if(id==='trounoir')dessinerTrouNoir(c,t,cache,LW,LH);
  else if(id==='vitre')dessinerVitre(c,t,cache,LW,LH);
  else if(id==='tranche')dessinerTranche(c,t,cache,LW,LH);
  else if(id==='ame')dessinerAme(c,t,cache,LW,LH);
}

/* ---------- les sons : synthétisés, aucun fichier ---------- */
var ctxAudio=null,bruitBuf=null;
function audio(){
  if(ctxAudio)return ctxAudio;
  try{
    var L=window.__SOREAL_IDLE_LIMITEUR_AUDIO_V1__;
    ctxAudio=L&&typeof L.contexte==='function'?L.contexte():new (window.AudioContext||window.webkitAudioContext)();
  }catch(_e){ctxAudio=null;}
  return ctxAudio;
}
function bruit(a){
  if(bruitBuf&&bruitBuf.sampleRate===a.sampleRate)return bruitBuf;
  var n=a.sampleRate*3,b=a.createBuffer(1,n,a.sampleRate),d=b.getChannelData(0);
  for(var i=0;i<n;i++)d[i]=Math.random()*2-1;
  bruitBuf=b;return b;
}
function enveloppe(g,t0,att,dec,pic){g.gain.setValueAtTime(0.0001,t0);g.gain.exponentialRampToValueAtTime(pic,t0+att);g.gain.exponentialRampToValueAtTime(0.0001,t0+att+dec);}
function souffle(a,t0,dur,fil,f0,f1,q,pic,att){
  var s=a.createBufferSource();s.buffer=bruit(a);s.loop=true;
  var f=a.createBiquadFilter();f.type=fil;f.Q.value=q||1;f.frequency.setValueAtTime(f0,t0);f.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t0+dur);
  var g=a.createGain();enveloppe(g,t0,att||dur*.15,dur*.85,pic);
  s.connect(f);f.connect(g);g.connect(maitre(a));s.start(t0);s.stop(t0+dur+.1);
}
function ton(a,t0,type,f0,f1,dur,pic,att){
  var o=a.createOscillator();o.type=type;o.frequency.setValueAtTime(f0,t0);if(f1&&f1!==f0)o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t0+dur);
  var g=a.createGain();enveloppe(g,t0,att||.01,dur,pic);o.connect(g);g.connect(maitre(a));o.start(t0);o.stop(t0+dur+.1);
  return o;
}
var maitreNoeud=null;
function maitre(a){
  if(maitreNoeud&&maitreNoeud.context===a)return maitreNoeud;
  maitreNoeud=a.createGain();maitreNoeud.gain.value=.75;maitreNoeud.connect(a.destination);return maitreNoeud;
}

function son(id){
  var a=audio();
  if(!a)return false;
  try{if(a.state==='suspended')a.resume();}catch(_e){}
  var t=a.currentTime+.03;
  if(id==='cendres'){
    /* grondement bas du brasier + crépitements irréguliers (petits claquements filtrés) + dernier souffle */
    souffle(a,t,2.6,'lowpass',380,90,.7,.28,.5);
    souffle(a,t+.1,2.4,'bandpass',1400,700,.8,.06,.6);
    for(var i=0;i<46;i++){
      var d=Math.pow(Math.random(),1.2)*2.4,f=1800+Math.random()*4500;
      souffle(a,t+.2+d,.035+Math.random()*.05,'bandpass',f,f*.6,6,.18+Math.random()*.2,.004);
    }
    souffle(a,t+2.5,.9,'highpass',500,1800,.5,.07,.3);
    ton(a,t+3.2,'sine',330,660,.55,.05,.18);    /* le joueur revient : une note claire qui se lève */
  }else if(id==='trounoir'){
    /* souffle qui plonge (aspiration) + vibration grave qui descend, puis « boum » sourd quand le trou se referme, puis note qui jaillit */
    souffle(a,t,2.0,'bandpass',2200,90,2.2,.4,.7);
    ton(a,t,'sawtooth',260,38,2.1,.16,.4);
    ton(a,t+.2,'sine',120,30,2.0,.22,.4);
    ton(a,t+2.0,'sine',90,24,.9,.8,.012);        /* boum */
    souffle(a,t+2.0,.5,'lowpass',500,60,.6,.5,.01);
    souffle(a,t+2.5,.75,'bandpass',200,2600,1.4,.28,.55);   /* aspiration inversée : il ressort */
    ton(a,t+2.9,'triangle',420,840,.4,.12,.05);
  }else if(id==='vitre'){
    /* coup sec de fissure, silence, craquements, puis pluie de tintements de verre */
    souffle(a,t,.07,'highpass',3000,6000,.7,.7,.002);
    ton(a,t,'square',2600,1800,.05,.12,.001);
    for(var f=0;f<5;f++){souffle(a,t+.12+f*.1,.03,'bandpass',3500+f*500,3000,5,.2,.002);}
    souffle(a,t+.8,.28,'highpass',2200,7000,.6,.85,.003);      /* l'éclatement */
    ton(a,t+.8,'sine',180,60,.35,.4,.004);
    for(var k=0;k<34;k++){
      var dd=.85+Math.pow(Math.random(),1.5)*1.7,fr=3200+Math.random()*5200;
      ton(a,t+dd,'sine',fr,fr*.98,.13+Math.random()*.2,.05+Math.random()*.12,.002);
    }
    souffle(a,t+2.6,.8,'highpass',1500,5000,.5,.07,.3);
    ton(a,t+2.65,'sine',1760,1760,.9,.05,.01);     /* reflet qui se reforme */
  }else if(id==='tranche'){
    /* sifflement de lame (bruit qui monte vite) + « shing » métallique + deux chutes sourdes + retour feutré */
    souffle(a,t+.04,.34,'bandpass',500,5500,2.5,.55,.18);
    ton(a,t+.36,'sine',3100,3100,.7,.12,.004);ton(a,t+.36,'sine',4180,4180,.6,.08,.004);ton(a,t+.36,'sine',5330,5330,.5,.06,.004);
    souffle(a,t+.37,.06,'highpass',4000,7000,.8,.5,.002);
    ton(a,t+1.2,'sine',95,50,.3,.4,.006);ton(a,t+1.38,'sine',80,44,.3,.34,.006);
    souffle(a,t+1.2,.14,'lowpass',400,120,.8,.28,.005);
    souffle(a,t+1.95,.9,'bandpass',350,1200,1.2,.18,.4);       /* les moitiés se rejoignent */
    ton(a,t+2.75,'triangle',660,990,.35,.14,.01);
  }else if(id==='ame'){
    /* voix creuses qui montent (deux sinus désaccordés + trémolo) + souffle d'air + cloche à la fin */
    var o1=ton(a,t+.3,'sine',196,392,2.4,.22,.8),o2=ton(a,t+.3,'sine',199,398,2.4,.2,.8),o3=ton(a,t+.5,'triangle',294,588,2.2,.07,.9);
    try{var lfo=a.createOscillator(),lg=a.createGain();lfo.frequency.value=5.2;lg.gain.value=6;lfo.connect(lg);lg.connect(o1.frequency);lg.connect(o2.frequency);lfo.start(t);lfo.stop(t+3);}catch(_e){}
    void o3;
    souffle(a,t+.2,2.6,'bandpass',900,1800,3,.08,.9);
    ton(a,t+2.8,'sine',784,784,1.3,.22,.01);ton(a,t+2.8,'sine',1568,1568,.9,.08,.01);ton(a,t+2.8,'sine',2349,2349,.6,.04,.01);
    souffle(a,t+2.75,.9,'highpass',1000,4000,.5,.05,.4);
  }
  return true;
}

/* ---------- lecture sur un <canvas> ---------- */
function jouer(id,canvas,img,opts){
  opts=opts||{};
  var v=VARIANTES.filter(function(x){return x.id===id;})[0];
  if(!v||!canvas||!img)return Promise.resolve(false);
  var LW=canvas.width,LH=canvas.height;
  var cache=preparer(id,img,LW,LH);
  var c=canvas.getContext('2d');c.imageSmoothingEnabled=true;
  if(opts.avecSon!==false)son(id);
  var t0=performance.now();
  return new Promise(function(fin){
    (function image(now){
      var t=(now-t0)/1000;
      if(t>=v.duree){c.clearRect(0,0,LW,LH);c.drawImage(cache.img,0,0);fin(true);return;}
      dessiner(id,c,t,cache,LW,LH);
      requestAnimationFrame(image);
    })(t0);
  });
}

window.__SOREAL_IDLE_MORTS_NOUVELLES_V1__={variantes:VARIANTES,preparer:preparer,dessiner:dessiner,son:son,jouer:jouer};
})();
