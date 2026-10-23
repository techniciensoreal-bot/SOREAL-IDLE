/*
 * SOREAL IDLE — la défaite : l'image du joueur éclate en gros pixels, comme celle d'un boss qui meurt, puis réapparaît à sa place en fondu (Norman, 2026-10-22 : « quand le joueur meurt, je veux qu'il explose en pixel mais qu'il réapparaisse à la bonne place en fondu en
 * ouverture de 3 secondes »).
 *
 * Un calque opaque (gardé par le redessin, règle n°4) est posé sur le portrait du joueur : il reprend d'abord l'image telle quelle (en gros pixels, aucun saut visible), un éclat blanc la fait voler en éclats qui retombent, puis le calque se dissout en fondu
 * pendant 3 secondes et l'image du joueur reparaît À SA PLACE. Aucun effet avec « réduire les animations ». Le son de défaite du jeu est déjà joué par l'appelant.
 *   window.__SOREAL_IDLE_MORT_JOUEUR_V1__ = { jouer(hote) -> bool, dessiner(ctx, t, px, LW, LH), pixelsDe(img, LW, LH), duree }
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_MORT_JOUEUR_V1__)return;

var CX=40;                       /* nombre de gros pixels en largeur */
var T_EXPLOSION=0.14,T_CHUTE=1.0,T_VIDE=1.25,T_FONDU=3,DUREE=T_VIDE+T_FONDU+0.2;   /* explosion, puis l'image réapparaît À SA PLACE en fondu pendant 3 s */
var enCours=false;
/*
 * Deux façons de réapparaître (Norman, 2026-10-23 : « plusieurs animations ») : « fondu » (l'image revient en fondu d'ouverture, comme ci-dessus) et « rewind » : les pixels se RECONSTITUENT (l'explosion jouée à l'envers) avec un effet de
 * rembobinage de cassette VHS au moment où ça arrive (tremblements de lignes, bande de suivi qui remonte, couleurs qui se décalent, neige, « ◀◀ RW »), et le son de défaite joué à l'envers (modules/audio-effects-v199.js, defeatReverse).
 * Tirée au hasard à chaque mort (jamais deux fois la même d'affilée).
 */
var T_A=1.0,T_BRUIT=.16,T_REW=1.2,T_TENUE=.4,T_FONDU2=.5,DUREE2=T_A+T_BRUIT+T_REW+T_TENUE+T_FONDU2+0.1;
var derniereVariante='';
/* Troisième façon : l'image du joueur CLIGNOTE trois fois en revenant, avec trois sons identiques calés sur chaque clignotement (Norman, 2026-10-23). */
var T_CLIGNOTE=.42,T_ALLUME=.2,N_CLIGNOTEMENTS=3,DUREE3=T_VIDE+(N_CLIGNOTEMENTS-1)*T_CLIGNOTE+T_ALLUME+.6;

function rnd(s){var x=Math.sin(s*127.1+311.7)*43758.5453;return x-Math.floor(x);}
function cl(x,a,b){return x<a?a:x>b?b:x;}
function ease(x){x=cl(x,0,1);return 1-Math.pow(1-x,3);}

/* Les gros pixels de l'image (recadrée « cover » à la forme du portrait). */
function pixelsDe(img,LW,LH){
  var CY=Math.max(8,Math.round(CX*LH/LW)),px=[];
  try{
    var cv=document.createElement('canvas');cv.width=CX;cv.height=CY;
    var cx=cv.getContext('2d');cx.imageSmoothingEnabled=true;
    var iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height;
    var ra=CX/CY,sx=0,sy=0,sw=iw,sh=ih;
    if(iw/ih>ra){sw=ih*ra;sx=(iw-sw)/2;}else{sh=iw/ra;sy=(ih-sh)/2;}
    cx.drawImage(img,sx,sy,sw,sh,0,0,CX,CY);
    var d=cx.getImageData(0,0,CX,CY).data;
    for(var y=0;y<CY;y++)for(var x=0;x<CX;x++){var i=(y*CX+x)*4;if(d[i+3]>60)px.push({x:x,y:y,c:'rgb('+d[i]+','+d[i+1]+','+d[i+2]+')'});}
  }catch(_e){return null;}   /* image illisible : pas d'effet */
  return {px:px,CY:CY};
}

/* Une image de l'explosion : t en secondes. */
function dessiner(c,t,px,LW,LH){
  var e=LW/CX;
  c.fillStyle='#101827';c.fillRect(0,0,LW,LH);
  for(var k=0;k<px.length;k++){
    var p=px[k],ox=p.x*e,oy=p.y*e,x=ox,y=oy,a=1,col=p.c;
    if(t<T_EXPLOSION){
      if(Math.floor(t*40)%2===0)col='#ffffff';
    }else if(t<T_VIDE){
      var u=t-T_EXPLOSION;
      var vx=(rnd(k)-.5)*LW*1.1,vy=-(0.15+rnd(k+9)*0.55)*LH;
      x=ox+vx*u;y=oy+vy*u+LH*1.6*u*u;
      a=cl(1-u/(T_CHUTE-T_EXPLOSION+0.1),0,1);
      if(y>LH+e)continue;
    }else{
      continue;   /* fin de l'explosion : plus de pixels, l'image revient en fondu sous le calque */
    }
    if(a<=0)continue;
    c.globalAlpha=a;c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.ceil(e),Math.ceil(e));
  }
  c.globalAlpha=1;
  if(t<T_EXPLOSION+0.1){c.fillStyle='rgba(255,255,255,'+(0.5*(1-Math.abs(t-T_EXPLOSION)/0.1)).toFixed(2)+')';c.fillRect(0,0,LW,LH);}
}

/* Neige de cassette : de petits traits clairs et sombres au hasard, d'autant plus nombreux que `force` est grand. */
function neige(c,LW,LH,t,force){
  var n=Math.round(30+90*force);
  for(var k=0;k<n;k++){
    var r1=rnd(k*7+Math.floor(t*30)*13),r2=rnd(k*11+Math.floor(t*30)*5+3),r3=rnd(k*3+Math.floor(t*30)*17+9);
    c.globalAlpha=.25+.45*r3*force;
    c.fillStyle=r3>.5?'#ffffff':'#8d93a6';
    c.fillRect(Math.round(r1*LW),Math.round(r2*LH),Math.round(6+r3*34*force),1+(r3>.8?1:0));
  }
  c.globalAlpha=1;
}
/* Le rembobinage VHS appliqué à l'image déjà dessinée : lignes qui tremblent, bande de suivi qui remonte (très déformée), canaux rouge / vert / bleu décalés, neige, balayage, « ◀◀ RW ». */
function vhs(c,LW,LH,t,force){
  if(force<=0.02)return;
  var src=c.getImageData(0,0,LW,LH),sd=src.data,out=c.createImageData(LW,LH),dd=out.data;
  var barre=(1-((t*.85)%1))*LH,epais=LH*.09,sp=Math.max(1,Math.round(3*force));
  for(var y=0;y<LH;y++){
    var dec=Math.sin(y*.085+t*34)*2.2*force;
    if(rnd(y*3+Math.floor(t*26))<.045)dec+=(rnd(y+Math.floor(t*26))-.5)*16*force;
    var db=Math.abs(y-barre);
    if(db<epais)dec+=(1-db/epais)*(rnd(y*5+Math.floor(t*40))-.5)*46*force;
    dec=Math.round(dec);
    var ligne=y*LW;
    for(var x=0;x<LW;x++){
      var xr=x+dec-sp,xg=x+dec,xb=x+dec+sp;
      xr=xr<0?0:xr>=LW?LW-1:xr;xg=xg<0?0:xg>=LW?LW-1:xg;xb=xb<0?0:xb>=LW?LW-1:xb;
      var i=(ligne+x)*4;
      dd[i]=sd[(ligne+xr)*4];dd[i+1]=sd[(ligne+xg)*4+1];dd[i+2]=sd[(ligne+xb)*4+2];dd[i+3]=255;
    }
  }
  c.putImageData(out,0,0);
  /* la bande de suivi : plus claire, couverte de neige */
  c.globalAlpha=.22*force;c.fillStyle='#ffffff';c.fillRect(0,Math.max(0,barre-epais*.5),LW,epais);c.globalAlpha=1;
  neige(c,LW,LH,t,force);
  /* balayage de l'écran */
  c.fillStyle='rgba(0,0,0,.18)';for(var yy=0;yy<LH;yy+=3)c.fillRect(0,yy,LW,1);
  /* indication « ◀◀ RW » qui clignote, comme sur un vieux magnétoscope */
  if(Math.floor(t*3)%2===0){
    c.font='bold '+Math.max(11,Math.round(LW*.075))+'px monospace';c.textBaseline='top';
    c.fillStyle='#000000';c.fillText('◀◀ RW',9,9);c.fillStyle='#ffffff';c.fillText('◀◀ RW',8,8);
  }
}
/* Une image du rembobinage : t en secondes depuis la mort. Explosion normale, un coup de neige, puis les pixels reviennent à leur place (l'explosion à l'envers), le tout sous l'effet VHS qui s'apaise. */
function dessinerRewind(c,t,px,LW,LH){
  if(t<T_A){dessiner(c,t,px,LW,LH);return;}
  var e=LW/CX,UM=T_CHUTE-T_EXPLOSION+0.1;
  c.fillStyle='#101827';c.fillRect(0,0,LW,LH);
  if(t<T_A+T_BRUIT){
    neige(c,LW,LH,t,1);neige(c,LW,LH,t+.37,1);
    c.fillStyle='rgba(255,255,255,.1)';c.fillRect(0,0,LW,LH);
    return;
  }
  var tr=t-(T_A+T_BRUIT),k=cl(tr/T_REW,0,1),lisse=k*k*(3-2*k),u=UM*(1-lisse);
  for(var i=0;i<px.length;i++){
    var p=px[i],ox=p.x*e,oy=p.y*e;
    var vx=(rnd(i)-.5)*LW*1.1,vy=-(0.15+rnd(i+9)*0.55)*LH;
    var x=ox+vx*u,y=oy+vy*u+LH*1.6*u*u;
    var a=cl(1-u/UM,0,1);
    if(a<=0||y>LH+e)continue;
    c.globalAlpha=a;c.fillStyle=p.c;c.fillRect(Math.round(x),Math.round(y),Math.ceil(e),Math.ceil(e));
  }
  c.globalAlpha=1;
  var force=tr<T_REW?1-.55*k:Math.max(0,.45*(1-(tr-T_REW)/T_TENUE));
  vhs(c,LW,LH,t,force);
}

function style_(){
  if(document.getElementById('soreal-idle-mort-joueur-style'))return;
  var s=document.createElement('style');s.id='soreal-idle-mort-joueur-style';
  s.textContent='.soreal-idle-boss-transition-v61.mort-joueur{position:absolute;inset:0;z-index:9;display:block;pointer-events:none;overflow:hidden;background:#101827;font-size:0;opacity:1}'+
    '.soreal-idle-boss-transition-v61.mort-joueur canvas{position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated;image-rendering:crisp-edges}';
  (document.head||document.documentElement).appendChild(s);
}

function jouer(hote,variante){
  try{
    if(!hote||enCours)return false;
    var CHOIX=['fondu','rewind','clignote'];
    if(CHOIX.indexOf(variante)<0){
      variante=CHOIX[Math.floor(Math.random()*CHOIX.length)];
      if(variante===derniereVariante)variante=CHOIX[(CHOIX.indexOf(variante)+1+Math.floor(Math.random()*(CHOIX.length-1)))%CHOIX.length];   /* jamais deux fois la même d'affilée */
    }
    derniereVariante=variante;
    if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return false;
    var img=hote.querySelector&&hote.querySelector('img');
    if(!img||!(img.naturalWidth>0))return false;
    var r=hote.getBoundingClientRect();
    if(!(r.width>20&&r.height>20))return false;
    var LW=Math.round(Math.min(220,Math.max(80,r.width))),LH=Math.round(LW*r.height/r.width);
    var pk=pixelsDe(img,LW,LH);
    if(!pk||!pk.px.length)return false;
    style_();
    var calque=document.createElement('div');
    calque.className='soreal-idle-boss-transition-v61 mort-joueur';
    calque.setAttribute('data-morph-garder','');calque.setAttribute('aria-hidden','true');
    var cv=document.createElement('canvas');cv.width=LW;cv.height=LH;calque.appendChild(cv);
    hote.appendChild(calque);
    var c=cv.getContext('2d');c.imageSmoothingEnabled=false;
    enCours=true;
    var t0=performance.now(),fini=false;
    function terminer(){
      if(fini)return;fini=true;enCours=false;
      if(calque.parentNode)calque.parentNode.removeChild(calque);
    }
    var fondu=false,son=false,bips=0;
    (function image(now){
      if(fini)return;
      if(!calque.isConnected){fini=true;enCours=false;return;}
      var t=(now-t0)/1000;
      if(variante==='clignote'){
        if(t>=DUREE3){terminer();return;}
        if(t<T_VIDE){dessiner(c,t,pk.px,LW,LH);}
        else{
          /* l'image du joueur apparaît puis disparaît trois fois ; un bip identique à chaque apparition */
          var p=t-T_VIDE,k=Math.floor(p/T_CLIGNOTE);
          /* apparue, disparue, apparue, disparue, puis apparue pour de bon : trois apparitions, trois bips */
          var allume=k>=N_CLIGNOTEMENTS-1?true:(p-k*T_CLIGNOTE)<T_ALLUME;
          if(allume&&bips<N_CLIGNOTEMENTS&&bips<=Math.min(k,N_CLIGNOTEMENTS-1)){bips=k+1;try{var a=window.__SOREAL_IDLE_AUDIO_V199__;if(a&&typeof a.reapparitionBip==='function')a.reapparitionBip();}catch(_e){}}
          c.fillStyle='#101827';c.fillRect(0,0,LW,LH);
          calque.style.transition='none';calque.style.opacity=allume?'0':'1';
        }
        requestAnimationFrame(image);
        return;
      }
      if(variante==='rewind'){
        if(t>=DUREE2){terminer();return;}
        dessinerRewind(c,t,pk.px,LW,LH);
        if(t>=T_A+T_BRUIT*.5&&!son){son=true;try{var a=window.__SOREAL_IDLE_AUDIO_V199__;if(a&&typeof a.defeatReverse==='function')a.defeatReverse();}catch(_e){}}   /* le son de défaite, à l'envers, avec le rembobinage */
        if(t>=T_A+T_BRUIT+T_REW+T_TENUE&&!fondu){fondu=true;calque.style.transition='opacity '+T_FONDU2+'s ease-out';calque.style.opacity='0';}   /* l'image reconstituée laisse place à l'image du joueur */
        requestAnimationFrame(image);
        return;
      }
      if(t>=DUREE){terminer();return;}
      dessiner(c,t,pk.px,LW,LH);
      if(t>=T_VIDE&&!fondu){
        /* fondu en ouverture de 3 secondes : le calque sombre s'efface et l'image du joueur reparaît à sa place */
        fondu=true;calque.style.transition='opacity '+T_FONDU+'s ease-in-out';calque.style.opacity='0';
      }
      requestAnimationFrame(image);
    })(t0);
    return true;
  }catch(_e){enCours=false;return false;}
}

window.__SOREAL_IDLE_MORT_JOUEUR_V1__={jouer:jouer,dessiner:dessiner,dessinerRewind:dessinerRewind,vhs:vhs,neige:neige,pixelsDe:pixelsDe,duree:DUREE,dureeRewind:DUREE2,dureeClignote:DUREE3,variantes:['fondu','rewind','clignote'],enCours:function(){return enCours;}};
})();
