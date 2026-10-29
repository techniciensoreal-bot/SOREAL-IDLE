/*
 * SOREAL IDLE — cinq nouvelles morts de boss (Norman, 2026-10-28 : « maintenant il en faut des nouvelles dans ce style, mais pour les boss »). Même principe que les cinq morts du joueur (morts-joueur-nouvelles-v1.js) : des mises à mort
 * dessinées sur l'image du boss, chacune avec son propre son synthétisé, toutes différentes de l'éclatement en gros pixels déjà dans le jeu (victoire-boss-arcade-v1.js, apparition-boss-v1.js). Ici le boss ne revient PAS : l'image se vide,
 * le boss suivant arrive ensuite avec son apparition habituelle.
 *   eboulement : le boss se change en pierre, se fissure et s'écroule en blocs qui rebondissent ;     son : grondement de roche, craquements, chutes de blocs
 *   poussiere  : il se désagrège en poussière emportée par le vent, de gauche à droite ;               son : vent, grain qui frotte
 *   fonte      : il fond vers le sol en une flaque verdâtre qui bouillonne puis s'évapore ;            son : bulles, grésillement d'acide, « plop »
 *   foudre     : un éclair le traverse (négatif, os, étincelles), il noircit et tombe en étincelles ;   son : coup de tonnerre, crépitement électrique
 *   enfoncement: la terre tremble, il s'enfonce dans le sol qui se referme sur lui ;                    son : séisme, éboulis, gros choc sourd
 * Validées par Norman le 2026-10-28 puis branchées sur la mort des boss (ui-combat-1-v1.js, transitionMortBossIdleV61_) : à chaque victoire d'un combat d'au moins 5 s, tirage parmi ces cinq morts et l'éclatement en pixels d'avant, jamais deux fois la même d'affilée ;
 * la mort finie, la main passe à l'apparition du boss suivant. Page d'aperçu : cloudflare/tools/apercu-morts/.
 *   window.__SOREAL_IDLE_MORTS_BOSS_NOUVELLES_V1__ = { variantes, preparer(id,img,LW,LH), dessiner(id,c,t,cache,LW,LH), son(id), jouer(id,canvas,img,opts) }
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_MORTS_BOSS_NOUVELLES_V1__)return;

function rnd(s){var x=Math.sin(s*127.1+311.7)*43758.5453;return x-Math.floor(x);}
function cl(x,a,b){return x<a?a:x>b?b:x;}
function lisse(x){x=cl(x,0,1);return x*x*(3-2*x);}

var VARIANTES=[
  {id:'eboulement',nom:'Éboulement',duree:3.8,aide:'Le boss se change en pierre, se fissure et s’écroule en blocs.'},
  {id:'poussiere',nom:'Poussière',duree:3.4,aide:'Le boss se désagrège en poussière emportée par le vent.'},
  {id:'fonte',nom:'Fonte',duree:3.8,aide:'Le boss fond en une flaque verdâtre qui bouillonne puis s’évapore.'},
  {id:'foudre',nom:'Foudre',duree:3.6,aide:'Un éclair le traverse ; il noircit et retombe en étincelles.'},
  {id:'enfoncement',nom:'Enfoncement',duree:3.8,aide:'La terre tremble, le boss s’enfonce dans le sol qui se referme.'}
];

/* ---------- préparation ---------- */
function coupe(img,LW,LH,filtre){
  var cv=document.createElement('canvas');cv.width=LW;cv.height=LH;
  var c=cv.getContext('2d');
  var iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height;
  var ra=LW/LH,sx=0,sy=0,sw=iw,sh=ih;
  if(iw/ih>ra){sw=ih*ra;sx=(iw-sw)/2;}else{sh=iw/ra;sy=(ih-sh)/2;}
  c.drawImage(img,sx,sy,sw,sh,0,0,LW,LH);
  if(filtre){
    var d=c.getImageData(0,0,LW,LH),p=d.data;
    for(var i=0;i<p.length;i+=4){
      var g=p[i]*.3+p[i+1]*.59+p[i+2]*.11;
      if(filtre==='pierre'){var b=(rnd(i*.013)-.5)*34;var v=g*.82+b;p[i]=cl(v+8,0,255);p[i+1]=cl(v+4,0,255);p[i+2]=cl(v,0,255);}
      else if(filtre==='negatif'){p[i]=cl(255-p[i]*.6-40,0,255);p[i+1]=cl(255-p[i+1]*.45-20,0,255);p[i+2]=cl(255-p[i+2]*.2,0,255);}
      else if(filtre==='brule'){var v2=g*.18;p[i]=v2*1.2;p[i+1]=v2*.8;p[i+2]=v2*.7;}
    }
    c.putImageData(d,0,0);
  }
  return cv;
}
function cellules(cv,LW,LH,cell){
  var d=cv.getContext('2d').getImageData(0,0,LW,LH).data,out=[];
  for(var y=0;y<LH;y+=cell)for(var x=0;x<LW;x+=cell){
    var i=((y+(cell>>1))*LW+x+(cell>>1))*4;
    out.push({x:x,y:y,c:'rgb('+d[i]+','+d[i+1]+','+d[i+2]+')'});
  }
  return out;
}

function preparer(id,img,LW,LH){
  var k={img:coupe(img,LW,LH),LW:LW,LH:LH,sol:LH*.86};
  if(id==='eboulement'){
    k.pierre=coupe(img,LW,LH,'pierre');
    var n=6,pts=[];
    for(var j=0;j<=n;j++){pts.push([]);for(var i=0;i<=n;i++){
      var jx=(i===0||i===n)?0:(rnd(i*11+j*5)-.5)*.5,jy=(j===0||j===n)?0:(rnd(i*7+j*13+2)-.5)*.5;
      pts[j].push([(i+jx)/n*LW,(j+jy)/n*LH]);
    }}
    k.blocs=[];
    for(var jj=0;jj<n;jj++)for(var ii=0;ii<n;ii++){
      var poly=[pts[jj][ii],pts[jj][ii+1],pts[jj+1][ii+1],pts[jj+1][ii]];
      var cx=(poly[0][0]+poly[2][0])/2,cy=(poly[0][1]+poly[2][1])/2,s=jj*40+ii;
      k.blocs.push({poly:poly,cx:cx,cy:cy,haut:(poly[3][1]+poly[2][1])/2-(poly[0][1]+poly[1][1])/2,delai:(1-cy/LH)*.0+rnd(s)*.45+(LH-cy)/LH*.55,vx:(rnd(s+1)-.5)*70,rot:(rnd(s+2)-.5)*1.4});
    }
    /* Fissures = les VRAIES cassures (Norman, 2026-10-29 : « quand il casse, les morceaux ne correspondent pas aux fissures ») : chaque fissure suit une ligne de coupe de la grille des blocs (les mêmes points que les bords des blocs) ;
       elles courent sur la pierre l'une après l'autre, et à la fin tous les blocs sont dessinés par ces fissures : ce qui s'écroule est exactement ce qui était fendu. */
    k.fissures=[];
    for(var fj=1;fj<n;fj++)k.fissures.push({seg:pts[fj].slice(),debut:rnd(fj*3+1)*.45,sens:rnd(fj+9)>.5});
    for(var fi=1;fi<n;fi++){var col=[];for(var fk=0;fk<=n;fk++)col.push(pts[fk][fi]);k.fissures.push({seg:col,debut:rnd(fi*5+40)*.45,sens:rnd(fi+31)>.5});}
  }else if(id==='poussiere'){
    k.cells=cellules(k.img,LW,LH,3);
    k.cells.forEach(function(c,i){c.t=(c.x/LW)*1.55+(rnd(i*.7)-.5)*.5;c.vx=70+rnd(i*1.3)*150;c.vy=-30-rnd(i*1.9)*70+(rnd(i*2.3)-.5)*40;c.o=rnd(i*3.1)*6.28;});
  }else if(id==='fonte'){
    k.col=[];for(var x=0;x<LW;x+=2)k.col.push({d:rnd(x*.31)*.9+(Math.abs(x-LW/2)/LW)*.35,v:.55+rnd(x*.17+4)*.55,goutte:rnd(x*.43+2)>.82});
    var cv=document.createElement('canvas');cv.width=1;cv.height=1;var cx2=cv.getContext('2d');cx2.drawImage(k.img,0,LH-8,LW,8,0,0,1,1);var m=cx2.getImageData(0,0,1,1).data;k.moy='rgb('+m[0]+','+m[1]+','+m[2]+')';
  }else if(id==='foudre'){
    k.neg=coupe(img,LW,LH,'negatif');k.brule=coupe(img,LW,LH,'brule');
    k.cells=cellules(k.brule,LW,LH,3);
    k.cells.forEach(function(c,i){c.t=(c.y/LH)*.9+rnd(i*.7)*.5;c.vx=(rnd(i*1.3)-.5)*80;c.vy=-10+rnd(i*1.9)*40;});
  }else if(id==='enfoncement'){
    k.terre=[];for(var tx=0;tx<LW;tx+=4)k.terre.push(rnd(tx*.21)*6);
    k.poussieres=[];for(var p=0;p<70;p++)k.poussieres.push({x:(rnd(p*3)-.5)*LW*1.1+LW/2,v:20+rnd(p+1)*60,r:3+rnd(p+2)*9,t:rnd(p+5)*.9,d:(rnd(p+7)-.5)*50});
  }
  return k;
}

/* ---------- dessins ---------- */
var FOND='#0b0e17';
function vide(c,LW,LH,col){c.fillStyle=col||FOND;c.fillRect(0,0,LW,LH);}

function dessinerEboulement(c,t,k,LW,LH){
  var T_PIERRE=.7,T_FISSURE=1.3,T_CHUTE=3.1,sol=k.sol;
  vide(c,LW,LH);
  var tremble=(t>T_PIERRE&&t<T_CHUTE)?(rnd(Math.floor(t*40))-.5)*(t<T_FISSURE?2:4):0;
  if(t<T_FISSURE+.05){
    c.save();c.translate(tremble,0);
    c.drawImage(k.img,0,0);
    c.globalAlpha=lisse(t/T_PIERRE);c.drawImage(k.pierre,0,0);c.globalAlpha=1;
    if(t>T_PIERRE){
      var u=lisse((t-T_PIERRE)/(T_FISSURE-T_PIERRE));
      c.strokeStyle='rgba(20,18,16,.9)';c.lineWidth=1.8;
      k.fissures.forEach(function(f){
        var seg=f.sens?f.seg:f.seg.slice().reverse();   /* chaque fissure part d'un bout ou de l'autre */
        var vis=1+cl((u-f.debut)/(1-f.debut),0,1)*(seg.length-1);c.beginPath();c.moveTo(seg[0][0],seg[0][1]);
        for(var i=1;i<seg.length;i++){if(i<=vis)c.lineTo(seg[i][0],seg[i][1]);else if(i-1<vis){var r=vis-(i-1);c.lineTo(seg[i-1][0]+(seg[i][0]-seg[i-1][0])*r,seg[i-1][1]+(seg[i][1]-seg[i-1][1])*r);break;}}
        c.stroke();
      });
    }
    c.restore();
    return;
  }
  var tt=t-T_FISSURE;
  for(var q=0;q<k.blocs.length;q++){
    var b=k.blocs[q],a=tt-b.delai*.9;
    var dx=0,dy=0,rot=0,alpha=1;
    if(a>0){
      /* chute avec rebond sur le sol, puis le bloc reste en tas jusqu'à ce que le tas s'efface */
      var g=520,y=g*a*a/2,max=Math.max(0,sol-(b.cy+b.haut/2)-(rnd(q)*14));
      if(y<max){dy=y;rot=b.rot*a*.5;}
      else{var tc=Math.sqrt(2*max/g),ar=a-tc,v=g*tc*.32;var yr=Math.max(0,v*ar-g*ar*ar/2);dy=max-yr;if(yr<=0&&ar>.5)dy=max;rot=b.rot*tc*.5;}
      dx=b.vx*Math.min(a,.9);
    }
    if(t>T_CHUTE)alpha=cl(1-(t-T_CHUTE)/.7,0,1);
    if(alpha<=0)continue;
    c.save();c.globalAlpha=alpha;c.translate(b.cx+dx,b.cy+dy);c.rotate(rot);c.translate(-b.cx,-b.cy);
    c.beginPath();c.moveTo(b.poly[0][0],b.poly[0][1]);for(var i=1;i<4;i++)c.lineTo(b.poly[i][0],b.poly[i][1]);c.closePath();
    c.save();c.clip();c.drawImage(k.pierre,0,0);c.restore();
    c.strokeStyle='rgba(15,13,12,.85)';c.lineWidth=1.4;c.stroke();c.restore();
  }
  c.globalAlpha=1;
  /* nuages de poussière à chaque chute */
  for(var n=0;n<14;n++){
    var tn=.2+n*.17,age=tt-tn;if(age<0||age>1.1)continue;
    c.fillStyle='rgba(170,160,145,'+((1-age/1.1)*.28).toFixed(2)+')';c.beginPath();c.arc(LW*(.12+rnd(n*3)*.76),sol-6-age*16,10+age*22,0,Math.PI*2);c.fill();
  }
}

function dessinerPoussiere(c,t,k,LW,LH){
  vide(c,LW,LH);
  var DUREE=3.4;
  for(var i=0;i<k.cells.length;i++){
    var p=k.cells[i],a=t-p.t;
    if(a<0){c.fillStyle=p.c;c.fillRect(p.x,p.y,3,3);continue;}
    var vie=1.5;if(a>vie)continue;
    var u=a/vie,x=p.x+p.vx*a*(0.4+u)+Math.sin(a*5+p.o)*6,y=p.y+p.vy*a+u*u*30;
    c.globalAlpha=1-u*u;c.fillStyle=p.c;c.fillRect(Math.round(x),Math.round(y),3,3);
  }
  c.globalAlpha=1;
  /* un voile de poussière claire, emporté lui aussi */
  var f=Math.max(0,Math.sin(Math.PI*cl((t-.4)/2.4,0,1)));
  c.fillStyle='rgba(190,175,150,'+(f*.1).toFixed(2)+')';c.fillRect(0,0,LW,LH);
  void DUREE;
}

function dessinerFonte(c,t,k,LW,LH){
  vide(c,LW,LH);
  var sol=LH,T_FIN=3.0;
  for(var x=0,i=0;x<LW;x+=2,i++){
    var col=k.col[i],m=cl((t-.2-col.d)/(1.7/col.v),0,1),lis=m*m*(3-2*m);
    var h=Math.max(1,LH*(1-lis*.97));
    c.drawImage(k.img,x,0,2,LH,x,sol-h,2,h);
    if(lis>0){c.fillStyle='rgba(110,230,70,'+(lis*.42).toFixed(2)+')';c.fillRect(x,sol-h,2,h);}
    if(col.goutte&&lis>.15&&lis<.98){
      /* une coulée qui s'étire sous le boss */
      var l=lis*LH*.25;c.fillStyle='rgba(120,235,80,.8)';c.fillRect(x,sol-h-l*0+h*0,2,0);
      c.fillStyle='rgba(120,235,80,'+(.55*(1-lis*.6)).toFixed(2)+')';c.fillRect(x,sol-h,2,l*.8);
    }
  }
  /* la flaque : grossit puis s'évapore, avec des bulles qui éclatent */
  var fl=lisse(cl((t-.7)/1.6,0,1))*(1-lisse(cl((t-2.4)/(T_FIN-2.4+.5),0,1)));
  if(fl>0.01){
    var g=c.createRadialGradient(LW/2,sol,2,LW/2,sol,LW*.55);g.addColorStop(0,'rgba(140,255,90,'+(.85*fl).toFixed(2)+')');g.addColorStop(.7,'rgba(60,170,50,'+(.7*fl).toFixed(2)+')');g.addColorStop(1,'rgba(30,90,30,0)');
    c.fillStyle=g;c.beginPath();c.ellipse(LW/2,sol-2,LW*.55*Math.min(1,fl*1.4),LH*.07+fl*LH*.05,0,0,Math.PI*2);c.fill();
    for(var b=0;b<18;b++){
      var age=((t*1.4+rnd(b*3))%1),bx=LW*(.18+rnd(b*5)*.64),by=sol-6-age*14;
      c.strokeStyle='rgba(210,255,170,'+(fl*(1-age)*.9).toFixed(2)+')';c.lineWidth=1;c.beginPath();c.arc(bx,by,2+rnd(b)*4*age,0,Math.PI*2);c.stroke();
    }
  }
  /* vapeur au-dessus de la flaque en fin de mort */
  if(t>2.3){
    for(var v=0;v<10;v++){var av=(t-2.3+rnd(v)*.6),yv=sol-av*34,al=Math.max(0,(1-(t-2.3)/1.2)*.18);c.fillStyle='rgba(200,255,190,'+al.toFixed(2)+')';c.beginPath();c.arc(LW*(.2+rnd(v*7)*.6)+Math.sin(av*4+v)*6,yv,8+av*10,0,Math.PI*2);c.fill();}
  }
}

function eclair(c,x0,y0,x1,y1,larg,graine){
  var pts=[[x0,y0]],n=9;
  for(var i=1;i<n;i++){var u=i/n;pts.push([x0+(x1-x0)*u+(rnd(graine+i)-.5)*34,y0+(y1-y0)*u+(rnd(graine+i*3)-.5)*8]);}
  pts.push([x1,y1]);
  c.lineJoin='round';c.lineCap='round';
  c.strokeStyle='rgba(120,160,255,.55)';c.lineWidth=larg*4;c.beginPath();pts.forEach(function(p,i){if(i)c.lineTo(p[0],p[1]);else c.moveTo(p[0],p[1]);});c.stroke();
  c.strokeStyle='rgba(255,255,255,.95)';c.lineWidth=larg;c.beginPath();pts.forEach(function(p,i){if(i)c.lineTo(p[0],p[1]);else c.moveTo(p[0],p[1]);});c.stroke();
}
function dessinerFoudre(c,t,k,LW,LH){
  var T_ELEC=1.1,T_NOIR=1.5,T_FIN=3.4;
  vide(c,LW,LH);
  if(t<T_ELEC){
    var f=Math.floor(t*22),neg=f%2===1&&t>.1;
    c.save();c.translate((rnd(f)-.5)*6,(rnd(f+5)-.5)*4);
    c.drawImage(neg?k.neg:k.img,0,0);
    c.restore();
    if(t<.12){c.fillStyle='rgba(255,255,255,'+(1-t/.12).toFixed(2)+')';c.fillRect(0,0,LW,LH);}
    /* l'éclair principal puis des arcs qui sautent sur le corps */
    eclair(c,LW*(.45+rnd(f)*.1),0,LW*.5,LH*.55,3,f*7);
    for(var a=0;a<4;a++){var gi=f*13+a*31;eclair(c,LW*rnd(gi),LH*rnd(gi+1),LW*rnd(gi+2),LH*rnd(gi+3),1.4,gi);}
  }else if(t<T_NOIR){
    var u=(t-T_ELEC)/(T_NOIR-T_ELEC);
    c.drawImage(k.img,0,0);c.globalAlpha=lisse(u);c.drawImage(k.brule,0,0);c.globalAlpha=1;
    c.fillStyle='rgba(255,120,40,'+((1-u)*.25).toFixed(2)+')';c.fillRect(0,0,LW,LH);
    if(rnd(Math.floor(t*30))>.5)eclair(c,rnd(Math.floor(t*30)+1)*LW,0,LW*.5,LH*.5,1.4,Math.floor(t*30)*3);
  }else if(t<T_FIN){
    /* le boss noirci retombe en cendres et en étincelles, de haut en bas */
    var tt=t-T_NOIR;
    for(var i=0;i<k.cells.length;i++){
      var p=k.cells[i],ag=tt-p.t*.8;
      if(ag<0){c.fillStyle=p.c;c.fillRect(p.x,p.y,3,3);continue;}
      if(ag>1.2)continue;
      var x=p.x+p.vx*ag,y=p.y+p.vy*ag+260*ag*ag;
      c.globalAlpha=1-ag/1.2;
      c.fillStyle=ag<.35&&rnd(i)>.4?'#ffcf5a':p.c;c.fillRect(Math.round(x),Math.round(y),3,3);
    }
    c.globalAlpha=1;
  }
}

function dessinerEnfoncement(c,t,k,LW,LH){
  var T_TREMBLE=.8,T_SENFONCE=2.4,T_FIN=3.8,sol=k.sol;
  vide(c,LW,LH,'#0b0e17');
  var sec=0;if(t<T_SENFONCE+.3)sec=(rnd(Math.floor(t*45))-.5)*(t<T_TREMBLE?5:8)*(1-cl((t-T_SENFONCE)/.3,0,1));
  var sink=t<T_TREMBLE?0:Math.pow(cl((t-T_TREMBLE)/(T_SENFONCE-T_TREMBLE),0,1),1.6);
  c.save();c.translate(sec,0);
  /* le boss : seule la partie au-dessus du sol est visible */
  c.save();c.beginPath();c.rect(0,0,LW,sol);c.clip();
  c.drawImage(k.img,0,sink*(sol+4));   /* il descend assez pour disparaître entièrement sous la ligne du sol */
  c.restore();
  /* le sol : bande de terre au bord irrégulier, qui se fissure puis se referme */
  var ouvert=t<T_SENFONCE?1:1-lisse((t-T_SENFONCE)/.6);
  c.fillStyle='#3a2a1a';c.fillRect(0,sol,LW,LH-sol);
  c.fillStyle='#5a4128';for(var i=0;i<k.terre.length;i++)c.fillRect(i*4,sol-k.terre[i]*(.4+.6*ouvert),4,k.terre[i]*(.4+.6*ouvert)+3);
  c.restore();
  /* fissure sombre autour du boss qui s'enfonce, qui se referme à la fin */
  if(t>T_TREMBLE&&t<T_SENFONCE+.8){c.fillStyle='rgba(8,5,3,'+(ouvert*.8).toFixed(2)+')';c.fillRect(LW*.1,sol-2,LW*.8,5);}
  /* poussière qui jaillit, puis retombe */
  for(var p=0;p<k.poussieres.length;p++){
    var q=k.poussieres[p],age=t-(q.t+.1);if(age<0||age>1.8)continue;
    c.fillStyle='rgba(165,145,115,'+((1-age/1.8)*.35).toFixed(2)+')';c.beginPath();c.arc(q.x+q.d*age,sol-4-q.v*age,q.r*(.6+age*.9),0,Math.PI*2);c.fill();
  }
  /* un petit tertre à l'endroit où il a disparu */
  if(t>T_SENFONCE){var m=lisse((t-T_SENFONCE)/.6)*(1-lisse((t-3.2)/.6));c.fillStyle='rgba(90,66,40,'+m.toFixed(2)+')';c.beginPath();c.ellipse(LW/2,sol,LW*.12,LH*.03*m,0,Math.PI,0);c.fill();}
}

function dessiner(id,c,t,k,LW,LH){
  if(id==='eboulement')dessinerEboulement(c,t,k,LW,LH);
  else if(id==='poussiere')dessinerPoussiere(c,t,k,LW,LH);
  else if(id==='fonte')dessinerFonte(c,t,k,LW,LH);
  else if(id==='foudre')dessinerFoudre(c,t,k,LW,LH);
  else if(id==='enfoncement')dessinerEnfoncement(c,t,k,LW,LH);
}

/* ---------- les sons : synthétisés ---------- */
var ctxAudio=null,bruitBuf=null,sortieCourante=null,maitreNoeud=null;
function audio(){
  if(ctxAudio)return ctxAudio;
  try{var L=window.__SOREAL_IDLE_LIMITEUR_V1__;ctxAudio=L&&typeof L.contexte==='function'?L.contexte():new (window.AudioContext||window.webkitAudioContext)();}catch(_e){ctxAudio=null;}
  return ctxAudio;
}
function bruit(a){if(bruitBuf&&bruitBuf.sampleRate===a.sampleRate)return bruitBuf;var n=a.sampleRate*3,b=a.createBuffer(1,n,a.sampleRate),d=b.getChannelData(0);for(var i=0;i<n;i++)d[i]=Math.random()*2-1;bruitBuf=b;return b;}
function maitre(a){if(maitreNoeud&&maitreNoeud.context===a)return maitreNoeud;maitreNoeud=a.createGain();maitreNoeud.gain.value=.75;maitreNoeud.connect(a.destination);return maitreNoeud;}
function env(g,t0,att,dec,pic){g.gain.value=0.0001;g.gain.setValueAtTime(0.0001,t0);g.gain.exponentialRampToValueAtTime(pic,t0+att);g.gain.exponentialRampToValueAtTime(0.0001,t0+att+dec);}
function souffle(a,t0,dur,fil,f0,f1,q,pic,att){
  var s=a.createBufferSource();s.buffer=bruit(a);s.loop=true;
  var f=a.createBiquadFilter();f.type=fil;f.Q.value=q||1;f.frequency.setValueAtTime(f0,t0);f.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t0+dur);
  var g=a.createGain();env(g,t0,att||dur*.15,dur*.85,pic);
  s.connect(f);f.connect(g);g.connect(sortieCourante||maitre(a));s.start(t0);s.stop(t0+dur+.1);
}
function ton(a,t0,type,f0,f1,dur,pic,att){
  var o=a.createOscillator();o.type=type;o.frequency.setValueAtTime(f0,t0);if(f1&&f1!==f0)o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t0+dur);
  var g=a.createGain();env(g,t0,att||.01,dur,pic);o.connect(g);g.connect(sortieCourante||maitre(a));o.start(t0);o.stop(t0+dur+.1);
  return o;
}
var DUREES_SON={eboulement:4000,poussiere:3600,fonte:4000,foudre:3800,enfoncement:4000};
function construireSon(a,id){
  var t=a.currentTime+.03,i;
  if(id==='eboulement'){
    souffle(a,t+.5,2.6,'lowpass',300,70,.8,.3,.8);ton(a,t+.6,'sawtooth',62,40,2.2,.1,.5);       /* grondement de roche */
    for(i=0;i<7;i++)souffle(a,t+.75+i*.08,.04,'bandpass',900+Math.random()*1800,500,5,.3,.003);   /* craquements */
    for(i=0;i<16;i++){var d=1.35+Math.pow(Math.random(),1.3)*1.6,f=70+Math.random()*60;ton(a,t+d,'sine',f*1.8,f,.14+Math.random()*.1,.35+Math.random()*.35,.003);souffle(a,t+d,.08,'lowpass',700,200,.8,.2,.004);}
    souffle(a,t+1.4,1.8,'bandpass',1200,500,.7,.07,.6);
  }else if(id==='poussiere'){
    souffle(a,t,3.2,'bandpass',500,1500,1.4,.34,1.0);souffle(a,t+.2,2.8,'bandpass',900,300,1,.2,1.0);          /* vent */
    souffle(a,t+.3,2.6,'highpass',3500,6500,.7,.06,.9);                                                          /* grains qui frottent */
    ton(a,t,'sine',90,60,3.2,.06,1.2);
  }else if(id==='fonte'){
    souffle(a,t+.2,1.9,'lowpass',900,150,1.1,.3,.5);ton(a,t+.2,'sine',210,70,1.6,.1,.3);                          /* affaissement visqueux */
    for(i=0;i<24;i++){var d2=.4+Math.random()*2.9,fr=140+Math.random()*180;ton(a,t+d2,'sine',fr,fr*2.2,.09+Math.random()*.07,.22+Math.random()*.2,.004);}   /* bulles */
    souffle(a,t+.6,2.4,'highpass',3000,6000,.6,.07,.8);for(i=0;i<20;i++)souffle(a,t+.7+Math.random()*2.2,.025,'bandpass',4000+Math.random()*3000,3000,6,.12,.002);   /* grésillement d'acide */
    ton(a,t+3.1,'sine',520,170,.2,.5,.004);                                                                       /* plop final */
  }else if(id==='foudre'){
    souffle(a,t,.12,'highpass',2500,7000,.6,.95,.002);ton(a,t,'sine',900,120,.3,.4,.003);                         /* coup sec de l'éclair */
    souffle(a,t+.1,1.4,'lowpass',400,60,.8,.5,.05);ton(a,t+.12,'sine',70,32,1.4,.55,.02);                         /* tonnerre */
    for(i=0;i<34;i++){var d3=.05+Math.random()*1.0;souffle(a,t+d3,.03,'bandpass',2500+Math.random()*4000,2000,7,.2+Math.random()*.2,.002);}   /* crépitement */
    ton(a,t+.15,'square',120,120,1.0,.04,.05);                                                                    /* ronflement électrique */
    for(i=0;i<14;i++)ton(a,t+1.6+Math.random()*1.3,'sine',2000+Math.random()*3500,1500,.06,.08,.002);              /* étincelles qui retombent */
  }else if(id==='enfoncement'){
    souffle(a,t,2.6,'lowpass',200,60,.9,.5,.4);ton(a,t,'sine',48,34,2.6,.5,.3);                                    /* séisme */
    try{var lfo=a.createOscillator(),lg=a.createGain(),osc=ton(a,t+.1,'sine',55,38,2.4,.3,.3);lfo.frequency.value=9;lg.gain.value=4;lfo.connect(lg);lg.connect(osc.frequency);lfo.start(t);lfo.stop(t+3);}catch(_e){}
    for(i=0;i<22;i++){var d4=.3+Math.random()*2.1;souffle(a,t+d4,.06,'lowpass',800+Math.random()*500,250,1,.25,.004);}   /* éboulis */
    souffle(a,t+2.35,.9,'lowpass',500,50,.7,.75,.01);ton(a,t+2.4,'sine',88,26,.9,.9,.01);                           /* choc sourd quand la terre se referme */
    souffle(a,t+2.5,1.2,'bandpass',1500,500,.8,.07,.4);
  }
}
function son(id){
  var A=window.__SOREAL_IDLE_AUDIO_V199__;
  if(A&&typeof A.synth==='function'){
    A.synth(DUREES_SON[id]||4000,function(a,dest){
      var bus=a.createGain();bus.gain.value=.3;bus.connect(dest);sortieCourante=bus;
      try{construireSon(a,id);}finally{sortieCourante=null;}
    });
    return true;
  }
  var a=audio();if(!a)return false;
  try{if(a.state==='suspended')a.resume();}catch(_e){}
  construireSon(a,id);return true;
}

/* ---------- lecture sur un <canvas> ---------- */
function jouer(id,canvas,img,opts){
  opts=opts||{};
  var v=VARIANTES.filter(function(x){return x.id===id;})[0];
  if(!v||!canvas||!img)return Promise.resolve(false);
  var LW=canvas.width,LH=canvas.height,k=preparer(id,img,LW,LH),c=canvas.getContext('2d');c.imageSmoothingEnabled=true;
  if(opts.avecSon!==false)son(id);
  var t0=performance.now();
  return new Promise(function(fin){
    (function image(now){
      var t=(now-t0)/1000;
      if(t>=v.duree){c.fillStyle=FOND;c.fillRect(0,0,LW,LH);fin(true);return;}
      dessiner(id,c,t,k,LW,LH);
      requestAnimationFrame(image);
    })(t0);
  });
}

/*
 * Dans le jeu : la mort du boss tué, sur l'image de la borne. Un calque opaque (data-morph-garder, règle n°4) est posé sur l'image, la mort s'y dessine ; elle finie, la main passe à l'apparition du boss suivant (idMort : le boss tué, jamais celui qui arrive).
 * Rend faux (rien n'est fait, l'appelant garde le comportement d'avant) pour « réduire les animations », sans image lisible, ou quand le tirage retombe sur l'éclatement en pixels d'avant.
 */
var enCours=false;
/*
 * File d'attente des morts (Norman, 2026-10-29 : « les animations de mort ne se jouent pas au hasard, mais en suivant ; quand elles sont toutes lues, on recommence à la première ; quand on en ajoute, elles se mettent en bout de file ») : l'ordre est celui de la liste ci-dessous ;
 * on garde le NOM de la dernière jouée (préférence liée au compte, règle n°6) et la suivante est celle qui vient juste après dans la liste ; après la dernière, retour à la première. Une mort ajoutée à la fin de la liste passe donc après toutes les autres,
 * et une mort inconnue (liste modifiée) fait repartir de la première.
 */
var dernierMemoire_='';
function suivante_(liste){
  var cle='soreal_idle_file_mort_boss_v1',dernier=dernierMemoire_;
  try{dernier=localStorage.getItem(cle)||dernierMemoire_;}catch(_e){}
  var choix=liste[(liste.indexOf(dernier)+1)%liste.length];   /* dernier inconnu : indexOf = -1, donc la première */
  dernierMemoire_=choix;
  try{localStorage.setItem(cle,choix);}catch(_e){}
  return choix;
}
function styleHote(){
  if(document.getElementById('soreal-idle-mort-boss-style'))return;
  var s=document.createElement('style');s.id='soreal-idle-mort-boss-style';
  s.textContent='.soreal-idle-boss-transition-v61.mort-boss-n{position:absolute;inset:0;z-index:9;display:block;pointer-events:none;overflow:hidden;background:'+FOND+';font-size:0}'+
    '.soreal-idle-boss-transition-v61.mort-boss-n canvas{position:absolute;inset:0;width:100%;height:100%}';
  (document.head||document.documentElement).appendChild(s);
}
function jouerSurHote(hote,image,idMort){
  try{
    if(!hote||!image||enCours)return false;
    if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return false;
    /* « classique » = l'éclatement en gros pixels d'origine (victoire-boss-arcade-v1.js) : il ouvre la file, les nouvelles morts viennent à la suite, dans l'ordre de VARIANTES (les ajouts se mettent à la fin) */
    var choix=suivante_(['classique'].concat(VARIANTES.map(function(v){return v.id;})));
    if(choix==='classique')return false;
    if(!(image.naturalWidth>0))return false;
    var r=hote.getBoundingClientRect();
    if(!(r.width>20&&r.height>20))return false;
    var LW=Math.round(Math.min(220,Math.max(100,r.width))),LH=Math.round(LW*r.height/r.width);
    var v=VARIANTES.filter(function(x){return x.id===choix;})[0];
    var k=preparer(choix,image,LW,LH);
    styleHote();
    var calque=document.createElement('div');
    calque.className='soreal-idle-boss-transition-v61 mort-boss-n';
    calque.setAttribute('data-morph-garder','');calque.setAttribute('aria-hidden','true');
    var cv=document.createElement('canvas');cv.width=LW;cv.height=LH;calque.appendChild(cv);
    hote.appendChild(calque);
    var c=cv.getContext('2d');c.imageSmoothingEnabled=true;
    enCours=true;
    /*
     * Norman (2026-10-29) : « le son de la mort et celui de l'apparition du boss suivant sont identiques, bien souvent ». Cause : l'écran de victoire classique prévenait l'apparition (VICTOIRE_EN_COURS + annuler) mais PAS ces cinq morts : le moteur remplace l'image du boss tué par le suivant dès la mort, l'apparition du boss
     * suivant (son compris) partait alors tout de suite, PENDANT la mort, puis une seconde fois à la fin (jouerApres) : le même son joué deux fois. Comme la victoire classique, la mort a maintenant la main jusqu'à sa fin, et c'est elle qui lance l'apparition, une seule fois.
     */
    try{var A0=window.__SOREAL_IDLE_APPARITION_BOSS_V1__;if(A0&&A0.annuler)A0.annuler();}catch(_e){}
    window.__SOREAL_IDLE_VICTOIRE_EN_COURS__=true;
    var fini=false,t0=performance.now();
    function terminer(){
      if(fini)return;fini=true;enCours=false;window.__SOREAL_IDLE_VICTOIRE_EN_COURS__=false;
      /* la main passe à l'apparition du boss suivant dans la même tâche : aucune image du boss suivant n'apparaît entre les deux */
      try{var app=window.__SOREAL_IDLE_APPARITION_BOSS_V1__;if(app&&app.jouerApres)app.jouerApres(hote,idMort,true);else if(app&&app.jouer)app.jouer(hote);}catch(_e){}
      if(calque.parentNode)calque.parentNode.removeChild(calque);
    }
    try{son(choix);}catch(_e){}
    (function image2(now){
      if(fini)return;
      if(!calque.isConnected){fini=true;enCours=false;window.__SOREAL_IDLE_VICTOIRE_EN_COURS__=false;return;}
      var t=(now-t0)/1000;
      if(t>=v.duree){terminer();return;}
      dessiner(choix,c,t,k,LW,LH);
      requestAnimationFrame(image2);
    })(t0);
    return true;
  }catch(_e){enCours=false;return false;}
}

window.__SOREAL_IDLE_MORTS_BOSS_NOUVELLES_V1__={variantes:VARIANTES,preparer:preparer,dessiner:dessiner,son:son,jouer:jouer,jouerSurHote:jouerSurHote,duree:function(){return 3.8;}};
})();
