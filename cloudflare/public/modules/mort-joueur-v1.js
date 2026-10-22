/*
 * SOREAL IDLE — la défaite : l'image du joueur éclate en gros pixels, comme celle d'un boss qui meurt, puis se reforme juste après (Norman, 2026-10-22 : « les animations de boss qui meurent utilisées aussi sur notre perso quand on perd un combat ; il devra se reformer juste après »).
 *
 * Un calque opaque (gardé par le redessin, règle n°4) est posé sur le portrait du joueur : il reprend d'abord l'image telle quelle (en gros pixels, aucun saut visible), un éclat blanc la fait voler en éclats qui retombent, puis chaque pixel revient à sa place
 * et l'image entière réapparaît ; le calque s'efface alors. Aucun effet avec « réduire les animations ». Le son de défaite du jeu est déjà joué par l'appelant.
 *   window.__SOREAL_IDLE_MORT_JOUEUR_V1__ = { jouer(hote) -> bool, dessiner(ctx, t, px, LW, LH), pixelsDe(img, LH), duree }
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_MORT_JOUEUR_V1__)return;

var CX=40;                       /* nombre de gros pixels en largeur */
var T_EXPLOSION=0.14,T_CHUTE=1.0,T_VIDE=1.25,T_FIN=2.45,DUREE=T_FIN+0.1;
var enCours=false;

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

/* Une image du film : t en secondes. */
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
      /* retour : chaque pixel part de là où il était retombé et revient à sa place, par vagues */
      var uf=T_VIDE-T_EXPLOSION,vx2=(rnd(k)-.5)*LW*1.1,vy2=-(0.15+rnd(k+9)*0.55)*LH;
      var dx=ox+vx2*uf,dy=oy+vy2*uf+LH*1.6*uf*uf;
      dx=cl(dx,-LW*0.2,LW*1.2);dy=cl(dy,LH*0.5,LH*1.15);   /* regroupés au bas du portrait, comme retombés */
      var r=ease((t-T_VIDE-rnd(k+3)*0.45)/(T_FIN-T_VIDE-0.45));
      x=r>=1?ox:dx+(ox-dx)*r;y=r>=1?oy:dy+(oy-dy)*r;
      a=0.35+0.65*r;
    }
    if(a<=0)continue;
    c.globalAlpha=a;c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.ceil(e),Math.ceil(e));
  }
  c.globalAlpha=1;
  if(t<T_EXPLOSION+0.1){c.fillStyle='rgba(255,255,255,'+(0.5*(1-Math.abs(t-T_EXPLOSION)/0.1)).toFixed(2)+')';c.fillRect(0,0,LW,LH);}
}

function style_(){
  if(document.getElementById('soreal-idle-mort-joueur-style'))return;
  var s=document.createElement('style');s.id='soreal-idle-mort-joueur-style';
  s.textContent='.soreal-idle-boss-transition-v61.mort-joueur{position:absolute;inset:0;z-index:9;display:block;pointer-events:none;overflow:hidden;background:#101827;font-size:0;opacity:1;transition:opacity .18s}'+
    '.soreal-idle-boss-transition-v61.mort-joueur canvas{position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated;image-rendering:crisp-edges}';
  (document.head||document.documentElement).appendChild(s);
}

function jouer(hote){
  try{
    if(!hote||enCours)return false;
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
      calque.style.opacity='0';
      setTimeout(function(){if(calque.parentNode)calque.parentNode.removeChild(calque);},220);
    }
    (function image(now){
      if(fini)return;
      if(!calque.isConnected){fini=true;enCours=false;return;}
      var t=(now-t0)/1000;
      if(t>=DUREE){terminer();return;}
      dessiner(c,t,pk.px,LW,LH);
      requestAnimationFrame(image);
    })(t0);
    return true;
  }catch(_e){enCours=false;return false;}
}

window.__SOREAL_IDLE_MORT_JOUEUR_V1__={jouer:jouer,dessiner:dessiner,pixelsDe:pixelsDe,duree:DUREE,enCours:function(){return enCours;}};
})();
