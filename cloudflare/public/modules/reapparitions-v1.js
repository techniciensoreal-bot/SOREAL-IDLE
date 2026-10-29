/*
 * SOREAL IDLE — les réapparitions du joueur et les entrées des boss (Norman, 2026-10-29 : « les animations de mort du joueur sont bien, mais les réapparitions ne sont pas variées, c'est souvent un fondu en ouverture ; les réapparitions des boss
 * et du joueur doivent être aussi variées que les morts ; il faut évidemment des sons qui collent »). Sept retours du joueur et sept entrées de boss, validés un par un sur la page de démonstration (Norman, 2026-10-29) :
 *   JOUEUR  marche (il se dandine sur ses deux coins du bas) · rebond · tampon · puzzle · faisceau · ballon · toupie
 *   BOSS    ecrasement · surgissement · portail · silhouette · plongeon · fumee · briques
 * Chaque effet a son propre son synthétisé, calé sur ses temps forts (pas, rebonds, impact, déclic des morceaux, souffle…), joué par le contexte audio commun du jeu (volume et limiteur du jeu : __SOREAL_IDLE_AUDIO_V199__.synth).
 *
 * Mise en scène : l'appelant (mort-joueur-v1.js, apparition-boss-v1.js) a déjà posé un calque OPAQUE gardé du redessin (data-morph-garder, règle n°4) sur l'image réelle. jouer() y ajoute une scène qui découpe tout ce qui dépasse, avec une COPIE de
 * l'image qui fait l'effet ; à la fin elle est exactement à la place de l'image réelle (même recadrage), l'appelant retire le calque. Aucun effet avec « réduire les animations » (l'appelant ne lance rien).
 *   window.__SOREAL_IDLE_REAPPARITIONS_V1__ = { joueur:[{id,nom,duree}], boss:[{id,nom,duree}], jouer(type, id, {calque, img}) -> Promise, sons }
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_REAPPARITIONS_V1__)return;

function rnd(s){var x=Math.sin(s*127.1+311.7)*43758.5453;return x-Math.floor(x);}
function cl(x,a,b){return x<a?a:x>b?b:x;}
function ease(x){x=cl(x,0,1);return 1-Math.pow(1-x,3);}
function attendre(ms){return new Promise(function(r){setTimeout(r,ms);});}

/* ---------- sons : deux briques (tonalité, bruit filtré), puis un son par effet ---------- */
function ton(c,o,t,f0,f1,d,v,type){
  var os=c.createOscillator(),g=c.createGain();
  os.type=type||'sine';os.frequency.setValueAtTime(f0,t);
  if(f1)os.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+d);
  g.gain.value=0.0001;g.gain.setValueAtTime(0.0001,t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002,v),t+Math.min(0.02,d/4));g.gain.exponentialRampToValueAtTime(0.0001,t+d);
  os.connect(g);g.connect(o);os.start(t);os.stop(t+d+0.03);
}
function bruit(c,o,t,d,v,type,f0,f1,q){
  var n=Math.max(1,Math.floor(c.sampleRate*d)),b=c.createBuffer(1,n,c.sampleRate),x=b.getChannelData(0),i;
  for(i=0;i<n;i++)x[i]=Math.random()*2-1;
  var s=c.createBufferSource();s.buffer=b;
  var f=c.createBiquadFilter();f.type=type||'bandpass';f.frequency.setValueAtTime(f0,t);
  if(f1)f.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+d);
  if(q)f.Q.value=q;
  var g=c.createGain();g.gain.value=0.0001;g.gain.setValueAtTime(0.0001,t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002,v),t+Math.min(0.03,d/4));g.gain.exponentialRampToValueAtTime(0.0001,t+d);
  s.connect(f);f.connect(g);g.connect(o);s.start(t);s.stop(t+d+0.02);
}
function choc(c,o,t,v){ton(c,o,t,95,38,0.32,v,'sine');bruit(c,o,t,0.16,v*0.6,'lowpass',420,120,0.7);}
function boing(c,o,t,v,f){ton(c,o,t,f||320,(f||320)*0.45,0.34,v,'sine');ton(c,o,t,(f||320)*2,(f||320)*0.9,0.2,v*0.35,'triangle');}

var SONS={
  /* pas lourds et caoutchouteux : un « toum » à chaque appui sur un coin, un petit couinement entre deux, un « boing » final */
  marche:function(c,o,t){var N=5,D=2.6,i;for(i=0;i<N;i++){var ta=t+(i+1)/N*D;choc(c,o,ta-0.02,0.16+0.02*i);ton(c,o,t+(i+0.5)/N*D,520+i*30,380,0.12,0.03,'triangle');}boing(c,o,t+D-0.05,0.07,360);},
  /* sifflement de chute, puis trois chocs-boing de plus en plus faibles, calés sur les contacts */
  rebond:function(c,o,t){ton(c,o,t,900,260,0.56,0.05,'sine');var T=[0.578,1.122,1.5],V=[0.2,0.13,0.08],i;for(i=0;i<3;i++){choc(c,o,T[i],V[i]);boing(c,o,t+T[i]+0.02,V[i]*0.5,380-i*60);}},
  /* souffle qui s'abat, claquement sec du tampon, onde de choc grave */
  tampon:function(c,o,t){bruit(c,o,t,0.5,0.12,'bandpass',2200,260,0.8);ton(c,o,t+0.5,1400,200,0.5,0.03,'sine');choc(c,o,t+0.55,0.26);bruit(c,o,t+0.55,0.1,0.18,'highpass',2500,1500,0.6);ton(c,o,t+0.6,300,60,0.5,0.08,'sine');},
  /* une pluie de petits déclics d'emboîtement, de plus en plus serrés, et un « ding » clair quand tout est en place */
  puzzle:function(c,o,t){var i;for(i=0;i<16;i++){var ts=t+0.9+Math.pow(rnd(i+3),0.8)*1.15;ton(c,o,ts,1500+rnd(i)*700,900,0.04,0.035,'triangle');bruit(c,o,ts,0.025,0.05,'highpass',3000,2000,0.6);}ton(c,o,t+2.05,1318,null,0.5,0.06,'sine');ton(c,o,t+2.05,1760,null,0.45,0.04,'sine');ton(c,o,t+2.1,2217,null,0.4,0.025,'sine');},
  /* faisceau de téléportation : balayage montant et scintillant, « pling » à l'arrivée */
  faisceau:function(c,o,t){ton(c,o,t,220,1500,1.4,0.04,'sawtooth');ton(c,o,t,224,1512,1.4,0.03,'sawtooth');bruit(c,o,t,1.4,0.05,'highpass',2500,6500,0.5);ton(c,o,t+1.42,1568,null,0.4,0.07,'sine');ton(c,o,t+1.42,2093,null,0.35,0.04,'sine');},
  /* gonflage : souffles pulsés qui montent, couinement de caoutchouc, « boing » quand le ballon prend sa taille */
  ballon:function(c,o,t){var i;for(i=0;i<5;i++)bruit(c,o,t+i*0.17,0.15,0.06+i*0.012,'bandpass',500+i*320,800+i*380,1.2);ton(c,o,t,260,1000,0.9,0.03,'triangle');ton(c,o,t,264,1010,0.9,0.02,'sawtooth');boing(c,o,t+0.92,0.11,430);ton(c,o,t+1.18,520,300,0.3,0.04,'sine');},
  /* toupie : ronronnement qui s'envole, puis des tic de plus en plus espacés quand elle ralentit, et un « tok » */
  toupie:function(c,o,t){ton(c,o,t,140,880,0.9,0.045,'sawtooth');ton(c,o,t,144,900,0.9,0.03,'square');bruit(c,o,t,0.9,0.05,'bandpass',800,3000,1);var k=[0.95,1.12,1.3,1.5],i;for(i=0;i<4;i++)ton(c,o,t+k[i],900-i*180,600,0.05,0.05,'triangle');choc(c,o,t+1.4,0.1);},
  /* sifflement de chute, impact sourd qui fait trembler tout, gravats qui roulent */
  ecrasement:function(c,o,t){ton(c,o,t,1200,200,0.62,0.05,'sine');choc(c,o,t+0.64,0.34);ton(c,o,t+0.64,70,28,0.7,0.2,'sine');bruit(c,o,t+0.64,0.45,0.14,'lowpass',900,150,0.7);var i;for(i=0;i<6;i++)ton(c,o,t+0.75+i*0.07,800-i*80,300,0.04,0.025,'square');},
  /* grondement qui monte, craquements du sol, jaillissement et pierres qui retombent */
  surgissement:function(c,o,t){bruit(c,o,t,0.7,0.12,'lowpass',160,300,0.9);ton(c,o,t,48,90,0.7,0.12,'sawtooth');var i;for(i=0;i<6;i++)bruit(c,o,t+0.12+i*0.07,0.05,0.08,'highpass',2500,1800,0.6);choc(c,o,t+0.66,0.3);bruit(c,o,t+0.7,0.5,0.1,'bandpass',500,200,0.8);var j;for(j=0;j<5;j++)ton(c,o,t+0.95+j*0.09,700-j*70,260,0.05,0.025,'square');},
  /* souffle magique qui enfle, « houmm » à l'ouverture du portail, glissando descendant à sa fermeture */
  portail:function(c,o,t){ton(c,o,t,220,880,0.8,0.045,'triangle');ton(c,o,t,223,892,0.8,0.035,'sine');bruit(c,o,t,0.7,0.05,'bandpass',600,3000,1.5);ton(c,o,t+0.5,70,120,0.7,0.12,'sine');ton(c,o,t+0.5,330,990,0.6,0.04,'triangle');ton(c,o,t+1.45,900,180,0.5,0.045,'triangle');},
  /* bourdon sombre, deux « thoum » de cœur, deux grésillements quand les yeux s'allument, accord clair quand les couleurs reviennent */
  silhouette:function(c,o,t){ton(c,o,t,55,48,1.7,0.1,'sawtooth');var i,T=[0.55,0.75];for(i=0;i<2;i++)ton(c,o,t+T[i],80,40,0.2,0.18,'sine');var Y=[0.76,0.92,1.08];for(i=0;i<3;i++)bruit(c,o,t+Y[i],0.07,0.07,'bandpass',3000,1800,3);ton(c,o,t+1.45,392,null,0.55,0.04,'triangle');ton(c,o,t+1.45,494,null,0.55,0.035,'triangle');ton(c,o,t+1.45,587,null,0.55,0.03,'triangle');},
  /* approche de très loin : souffle et note qui montent comme un avion qui fonce sur l'auditeur, puis fracas à l'arrivée */
  plongeon:function(c,o,t){bruit(c,o,t,0.84,0.12,'bandpass',300,3200,1);ton(c,o,t,160,950,0.84,0.05,'sawtooth');choc(c,o,t+0.84,0.34);bruit(c,o,t+0.84,0.3,0.1,'highpass',3000,800,0.6);ton(c,o,t+0.95,200,60,0.4,0.1,'sine');},
  /* pétard fumigène : « pof » sourd, long sifflement qui retombe, petit « ting » quand l'image se révèle */
  fumee:function(c,o,t){bruit(c,o,t,0.26,0.16,'bandpass',700,350,0.8);ton(c,o,t,110,55,0.3,0.14,'sine');bruit(c,o,t+0.12,1.3,0.07,'highpass',4200,1800,0.5);ton(c,o,t+1.2,1175,null,0.4,0.045,'sine');ton(c,o,t+1.2,1568,null,0.35,0.03,'sine');},
  /* chaque rangée de blocs claque en retombant, sur une note de plus en plus haute (gamme montante), puis fanfare finale */
  briques:function(c,o,t){var N=[523,587,659,698,784,880],i;for(i=0;i<6;i++){var ta=t+0.49+i*0.23+0.05;ton(c,o,ta,220,120,0.07,0.1,'square');bruit(c,o,ta,0.04,0.06,'lowpass',900,300,0.6);ton(c,o,ta+0.02,N[i],null,0.14,0.05,'triangle');}ton(c,o,t+1.98,784,null,0.2,0.06,'triangle');ton(c,o,t+2.12,1047,null,0.4,0.07,'triangle');ton(c,o,t+2.12,1319,null,0.35,0.04,'sine');}
};
function jouerSon(id,duree){
  try{
    var A=window.__SOREAL_IDLE_AUDIO_V199__;
    if(!A||typeof A.synth!=='function'||!SONS[id])return;
    A.synth(Math.round(duree*1000),function(c,out){SONS[id](c,out,c.currentTime+0.03);});
  }catch(_e){}
}

/* ---------- la scène : une copie de l'image, qui fait l'effet, dans un calque qui découpe tout ce qui dépasse ---------- */
function creerScene(calque,img){
  var stage=document.createElement('div');
  stage.className='reapp-scene';
  stage.style.cssText='position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:2';
  var monde=document.createElement('div');
  monde.style.cssText='position:absolute;inset:0';
  var cs=null;try{cs=getComputedStyle(img);}catch(_e){}
  var sujet=document.createElement('img');
  sujet.alt='';sujet.draggable=false;
  sujet.src=img.currentSrc||img.src;
  sujet.style.cssText='position:absolute;inset:0;width:100%;height:100%;display:block;object-fit:'+((cs&&cs.objectFit&&cs.objectFit!=='fill')?cs.objectFit:'cover')+';object-position:'+((cs&&cs.objectPosition)||'50% 50%')+';border-radius:'+((cs&&cs.borderRadius)||'0')+';opacity:0';
  monde.appendChild(sujet);stage.appendChild(monde);calque.appendChild(stage);
  var X={calque:calque,stage:stage,monde:monde,sujet:sujet,img:img,W:Math.max(40,calque.clientWidth||img.clientWidth),H:Math.max(40,calque.clientHeight||img.clientHeight),
    nw:img.naturalWidth||img.width||1,nh:img.naturalHeight||img.height||1,src:sujet.src};
  return X;
}
function anim(el,kf,opt){try{return el.animate(kf,Object.assign({fill:'both'},opt)).finished.catch(function(){});}catch(_e){return Promise.resolve();}}
function sur(X,css,html){var e=document.createElement('div');e.style.cssText='position:absolute;pointer-events:none;'+css;if(html)e.innerHTML=html;X.monde.appendChild(e);return e;}
function raf(X,duree,fn){return new Promise(function(res){var t0=performance.now();function f(t){if(!X.stage.isConnected){res();return;}var p=cl((t-t0)/(duree*1000),0,1);fn(p);if(p<1)requestAnimationFrame(f);else res();}requestAnimationFrame(f);});}
function secouer(X,amp,duree){var k=[],n=10,i;for(i=0;i<=n;i++){var d=(1-i/n)*amp;k.push({transform:'translate('+((rnd(i+3)-.5)*2*d)+'px,'+((rnd(i+9)-.5)*2*d)+'px)'});}return anim(X.monde,k,{duration:duree*1000,fill:'none'});}
function anneau(X,couleur,duree,taille){var T=taille||60;var e=sur(X,'left:50%;bottom:0;width:'+T+'px;height:'+(T/3.4)+'px;margin-left:-'+(T/2)+'px;border:4px solid '+couleur+';border-radius:50%;opacity:.9');return anim(e,[{transform:'scale(.2)',opacity:.95},{transform:'scale(6)',opacity:0}],{duration:duree*1000,easing:'ease-out',fill:'forwards'});}
function poussiere(X,n,couleur,cx,cy,dispersion){var i;for(i=0;i<n;i++){var e=sur(X,'left:'+cx+'%;top:'+cy+'%;width:'+(6+rnd(i)*10)+'px;height:'+(6+rnd(i+5)*10)+'px;background:'+couleur+';border-radius:'+(rnd(i+7)>.5?'50%':'2px'));var dx=(rnd(i+1)-.5)*dispersion,dy=-(20+rnd(i+2)*(dispersion*.5));anim(e,[{transform:'translate(0,0) rotate(0)',opacity:1},{transform:'translate('+dx+'px,'+dy+'px) rotate('+(rnd(i)*360)+'deg)',opacity:0}],{duration:500+rnd(i+4)*500,easing:'cubic-bezier(.2,.8,.4,1)'});}}
/* Les tuiles : le même recadrage « cover » que l'image réelle, pour que l'assemblage retombe exactement dessus. */
function tuiles(X,n,cache){
  var L=[],W=X.W,H=X.H,tw=W/n,th=H/n,s=Math.max(W/X.nw,H/X.nh),sw=X.nw*s,sh=X.nh*s,ox=(W-sw)/2,oy=(H-sh)/2,r,c;
  for(r=0;r<n;r++)for(c=0;c<n;c++){
    var e=sur(X,'left:'+(c*tw)+'px;top:'+(r*th)+'px;width:'+(tw+.6)+'px;height:'+(th+.6)+'px;background:url("'+X.src+'") '+(ox-c*tw)+'px '+(oy-r*th)+'px/'+sw+'px '+sh+'px no-repeat;'+(cache?'opacity:0':''));
    L.push({e:e,r:r,c:c});
  }
  return L;
}
function retirerSurcouches(X){[].slice.call(X.monde.children).forEach(function(e){if(e!==X.sujet)e.remove();});}

/* ================= JOUEUR ================= */
var JOUEUR=[
 {id:'marche',nom:'Marche sur les coins',duree:2.6,jouer:function(X){X.sujet.style.opacity=1;var W=X.W;return raf(X,2.6,function(p){var N=5,s=p*N,i=Math.min(N-1,Math.floor(s)),f=s-i,th=Math.sin(Math.PI*f)*13,droite=(i%2===0);X.sujet.style.transformOrigin=droite?'100% 100%':'0% 100%';var x=(1-ease(p))*(-W*1.15),rot=droite?-th:th,fin=cl((p-.9)/.1,0,1);X.sujet.style.transform='translateX('+x+'px) rotate('+rot*(1-fin)+'deg) scale('+(1+Math.sin(fin*Math.PI)*0.04)+')';}).then(function(){X.sujet.style.transform='';});}},
 {id:'rebond',nom:'Rebond',duree:1.7,jouer:function(X){var H=X.H;X.sujet.style.transformOrigin='50% 100%';var o=sur(X,'left:20%;right:20%;bottom:-4px;height:14px;background:rgba(0,0,0,.5);border-radius:50%;filter:blur(3px)');anim(o,[{transform:'scale(.2)',opacity:.1},{transform:'scale(1)',opacity:.6,offset:.4},{transform:'scale(.8)',opacity:.45,offset:.62},{transform:'scale(1)',opacity:.6,offset:.76},{transform:'scale(.95)',opacity:.55,offset:.88},{transform:'scale(1)',opacity:.6}],{duration:1700});
  return anim(X.sujet,[{transform:'translateY('+(-H*1.45)+'px) scale(.9,1.12)',opacity:1,easing:'cubic-bezier(.5,0,1,.6)'},{transform:'translateY(0) scale(1.22,.78)',offset:.34,easing:'ease-out'},{transform:'translateY('+(-H*.5)+'px) scale(.94,1.06)',offset:.52,easing:'cubic-bezier(.5,0,1,.6)'},{transform:'translateY(0) scale(1.14,.86)',offset:.66,easing:'ease-out'},{transform:'translateY('+(-H*.19)+'px) scale(.98,1.03)',offset:.78,easing:'cubic-bezier(.5,0,1,.6)'},{transform:'translateY(0) scale(1.06,.94)',offset:.88},{transform:'translateY(0) scale(1)',opacity:1}],{duration:1700});}},
 {id:'tampon',nom:'Tampon',duree:1.1,jouer:function(X){setTimeout(function(){if(!X.stage.isConnected)return;anneau(X,'#ffd24a',.7,Math.round(X.W*.5));secouer(X,7,.35);},520);
  return anim(X.sujet,[{transform:'scale(2.8)',opacity:0},{transform:'scale(2.2)',opacity:.4,offset:.3},{transform:'scale(.93)',opacity:1,offset:.5,easing:'cubic-bezier(.2,.9,.3,1)'},{transform:'scale(1.03)',opacity:1,offset:.62},{transform:'scale(1)',opacity:1}],{duration:1100,easing:'ease-in'});}},
 {id:'puzzle',nom:'Puzzle',duree:2.5,jouer:function(X){var L=tuiles(X,6,true),D=Math.max(X.W,X.H);var ps=L.map(function(t,i){var a=rnd(i+1)*Math.PI*2,d=D*1.2+rnd(i+2)*D*.8;return anim(t.e,[{transform:'translate('+(Math.cos(a)*d)+'px,'+(Math.sin(a)*d)+'px) rotate('+((rnd(i+3)-.5)*540)+'deg) scale(.4)',opacity:0},{opacity:1,offset:.25},{transform:'translate(0,0) rotate(0) scale(1.08)',opacity:1,offset:.9,easing:'cubic-bezier(.3,.8,.4,1)'},{transform:'none',opacity:1}],{duration:1500,delay:rnd(i+5)*600});});
  return Promise.all(ps).then(function(){if(!X.stage.isConnected)return;X.sujet.style.opacity=1;retirerSurcouches(X);return anim(X.sujet,[{filter:'brightness(1.9)'},{filter:'brightness(1)'}],{duration:400,fill:'none'});});}},
 {id:'faisceau',nom:'Faisceau',duree:1.7,jouer:function(X){var f=sur(X,'left:-6%;right:-6%;top:0;height:8px;background:#9ff;box-shadow:0 0 18px 8px rgba(80,220,255,.9);border-radius:4px;z-index:4');
  anim(f,[{top:'0%'},{top:'calc(100% - 8px)'}],{duration:1400,easing:'linear'}).then(function(){anim(f,[{opacity:1},{opacity:0}],{duration:250});});
  return anim(X.sujet,[{clipPath:'inset(0 0 100% 0)',filter:'brightness(2) saturate(.4)',opacity:1},{clipPath:'inset(0 0 0 0)',filter:'brightness(1.3) saturate(.8)',offset:.78},{clipPath:'inset(0 0 0 0)',filter:'brightness(1) saturate(1)'}],{duration:1700,easing:'linear'});}},
 {id:'ballon',nom:'Ballon',duree:1.6,jouer:function(X){X.sujet.style.transformOrigin='50% 60%';return anim(X.sujet,[{transform:'scale(0) rotate(0)',borderRadius:'50%',opacity:1},{transform:'scale(.35) rotate(-6deg)',offset:.2,borderRadius:'40%'},{transform:'scale(1.22,1.1) rotate(5deg)',offset:.55,borderRadius:'14px'},{transform:'scale(.9,.96) rotate(-3deg)',offset:.72},{transform:'scale(1.07,1.03) rotate(2deg)',offset:.86},{transform:'scale(1) rotate(0)',borderRadius:'8px'}],{duration:1600,easing:'ease-out'});}},
 {id:'toupie',nom:'Toupie',duree:1.5,jouer:function(X){return anim(X.sujet,[{transform:'scale(0) rotate(0)',filter:'blur(10px)',opacity:0},{transform:'scale(.6) rotate(540deg)',filter:'blur(6px)',opacity:1,offset:.5},{transform:'scale(1.08) rotate(1060deg)',filter:'blur(1px)',offset:.85,easing:'ease-out'},{transform:'scale(1) rotate(1080deg)',filter:'blur(0)',opacity:1}],{duration:1500,easing:'cubic-bezier(.3,.6,.4,1)'});}}
];

/* ================= BOSS ================= */
var BOSS=[
 {id:'ecrasement',nom:'Écrasement',duree:1.4,jouer:function(X){var H=X.H;X.sujet.style.transformOrigin='50% 100%';var o=sur(X,'left:10%;right:10%;bottom:-4px;height:20px;background:rgba(0,0,0,.6);border-radius:50%;filter:blur(4px)');anim(o,[{transform:'scale(.1)',opacity:0},{transform:'scale(1.1)',opacity:.8,offset:.5},{transform:'scale(1)',opacity:.5}],{duration:1500,easing:'ease-in'});
  setTimeout(function(){if(!X.stage.isConnected)return;secouer(X,12,.5);anneau(X,'#ff9a3b',.8,Math.round(X.W*.6));poussiere(X,18,'#9a8f80',50,96,Math.round(X.W*1.1));},640);
  return anim(X.sujet,[{transform:'translateY('+(-H*1.5)+'px) scale(1.2)',opacity:1,easing:'cubic-bezier(.6,0,1,.5)'},{transform:'translateY(0) scale(1.15,.8)',opacity:1,offset:.45,easing:'ease-out'},{transform:'translateY(0) scale(.97,1.04)',opacity:1,offset:.62},{transform:'none',opacity:1}],{duration:1400});}},
 {id:'surgissement',nom:'Surgissement',duree:1.7,jouer:function(X){var H=X.H,i;for(i=0;i<6;i++){var l=sur(X,'left:50%;bottom:-4px;width:4px;height:'+(H*(.15+rnd(i)*.3))+'px;background:linear-gradient(#ffd24a,#000);transform-origin:50% 100%;transform:rotate('+((i-2.5)*22)+'deg);opacity:0');anim(l,[{opacity:0,scale:'1 0'},{opacity:1,scale:'1 1',offset:.4},{opacity:1,offset:.8},{opacity:0}],{duration:1500});}
  setTimeout(function(){if(!X.stage.isConnected)return;secouer(X,8,.6);poussiere(X,22,'#7a5a3a',50,92,Math.round(X.W*1.2));},650);
  return anim(X.sujet,[{clipPath:'inset(100% 0 0 0)',transform:'translateY(40%)',opacity:1},{clipPath:'inset(100% 0 0 0)',transform:'translateY(40%)',offset:.42},{clipPath:'inset(0 0 0 0)',transform:'translateY(-12%) scale(1.06)',offset:.72,easing:'cubic-bezier(.2,.9,.3,1)'},{clipPath:'inset(0 0 0 0)',transform:'none',opacity:1}],{duration:1700});}},
 {id:'portail',nom:'Portail',duree:2.0,jouer:function(X){var T=Math.round(Math.min(X.W,X.H)*1.1);var p=sur(X,'left:50%;top:50%;width:'+T+'px;height:'+T+'px;margin:-'+(T/2)+'px 0 0 -'+(T/2)+'px;border-radius:50%;background:conic-gradient(from 0deg,#7a2cff,#19d4ff,#ff3b8e,#ffd24a,#7a2cff);-webkit-mask:radial-gradient(circle,transparent 52%,#000 54%,#000 70%,transparent 72%);mask:radial-gradient(circle,transparent 52%,#000 54%,#000 70%,transparent 72%);z-index:3');
  anim(p,[{transform:'scale(0) rotate(0)',opacity:0},{transform:'scale(1) rotate(360deg)',opacity:1,offset:.3},{transform:'scale(1) rotate(900deg)',opacity:1,offset:.75},{transform:'scale(.2) rotate(1400deg)',opacity:0}],{duration:2000,easing:'linear'});
  return anim(X.sujet,[{clipPath:'circle(0% at 50% 50%)',transform:'scale(.3) rotate(-120deg)',opacity:1},{clipPath:'circle(0% at 50% 50%)',transform:'scale(.3) rotate(-120deg)',offset:.25},{clipPath:'circle(75% at 50% 50%)',transform:'scale(1.06) rotate(8deg)',offset:.75,easing:'ease-out'},{clipPath:'circle(75% at 50% 50%)',transform:'none',opacity:1}],{duration:2000});}},
 {id:'silhouette',nom:'Silhouette',duree:2.0,jouer:function(X){var y=sur(X,'left:30%;right:30%;top:34%;height:14px;z-index:3');y.innerHTML='<i style="position:absolute;left:0;width:18px;height:12px;border-radius:50%;background:#ff2b2b;box-shadow:0 0 14px 6px #f00"></i><i style="position:absolute;right:0;width:18px;height:12px;border-radius:50%;background:#ff2b2b;box-shadow:0 0 14px 6px #f00"></i>';
  anim(y,[{opacity:0},{opacity:0,offset:.3},{opacity:1,offset:.38},{opacity:.2,offset:.46},{opacity:1,offset:.54},{opacity:1,offset:.7},{opacity:0}],{duration:2000});
  return anim(X.sujet,[{filter:'brightness(0)',opacity:0},{filter:'brightness(0)',opacity:1,offset:.28},{filter:'brightness(0)',opacity:1,offset:.7},{filter:'brightness(1)',opacity:1,offset:.95},{filter:'brightness(1)',opacity:1}],{duration:2000,easing:'ease-in-out'});}},
 {id:'plongeon',nom:'Plongeon',duree:1.4,jouer:function(X){setTimeout(function(){if(!X.stage.isConnected)return;secouer(X,14,.5);anneau(X,'#ffffff',.5,Math.round(X.W*.8));},720);
  return anim(X.sujet,[{transform:'scale(.04)',filter:'blur(8px)',opacity:.3},{transform:'scale(.3)',filter:'blur(5px)',opacity:.7,offset:.4,easing:'cubic-bezier(.5,0,1,.6)'},{transform:'scale(1.55)',filter:'blur(0)',opacity:1,offset:.6,easing:'ease-out'},{transform:'scale(.96)',opacity:1,offset:.75},{transform:'scale(1)',opacity:1}],{duration:1400,easing:'ease-in'});}},
 {id:'fumee',nom:'Fumée',duree:2.0,jouer:function(X){X.sujet.style.opacity=0;var D=Math.min(X.W,X.H),nuages=[],i;for(i=0;i<9;i++){var e=sur(X,'left:'+(8+rnd(i)*70)+'%;top:'+(8+rnd(i+3)*70)+'%;width:'+(D*(.45+rnd(i+6)*.35))+'px;height:'+(D*(.45+rnd(i+6)*.35))+'px;border-radius:50%;background:radial-gradient(circle,#d8d4e6,#8a84a0 60%,transparent 72%);filter:blur(6px);z-index:3');var dx=(rnd(i+1)-.5)*X.W*1.4,dy=-D*(.1+rnd(i+2)*.55);nuages.push(anim(e,[{transform:'scale(.1)',opacity:0},{transform:'scale(1)',opacity:.95,offset:.28},{transform:'scale(1.1)',opacity:.95,offset:.5},{transform:'translate('+dx+'px,'+dy+'px) scale(1.7)',opacity:0}],{duration:2000,delay:i*40}));}
  anim(X.sujet,[{opacity:0},{opacity:0,offset:.42},{opacity:1,offset:.62},{opacity:1}],{duration:2000});return Promise.all(nuages);}},
 {id:'briques',nom:'Briques',duree:2.4,jouer:function(X){X.sujet.style.opacity=0;var L=tuiles(X,6,true),D=Math.max(X.H,X.W);var ps=L.map(function(t,i){var rang=5-t.r;return anim(t.e,[{transform:'translateY('+(-D*1.8)+'px)',opacity:1},{transform:'translateY(0)',opacity:1,offset:.7,easing:'cubic-bezier(.5,0,1,.7)'},{transform:'translateY(-14px)',opacity:1,offset:.84,easing:'ease-out'},{transform:'none',opacity:1}],{duration:700,delay:rang*230+rnd(i+4)*120});});
  return Promise.all(ps).then(function(){if(!X.stage.isConnected)return;X.sujet.style.opacity=1;retirerSurcouches(X);return anim(X.sujet,[{filter:'brightness(1.8)'},{filter:'brightness(1)'}],{duration:350,fill:'none'});});}}
];

/* le calque d'entrée d'un boss porte un balayage de lignes (apparition-boss-v1.js) : trop lourd sur une mise en scène qui bouge, retiré pour ces effets */
try{var st=document.createElement('style');st.id='soreal-idle-reapp-style';st.textContent='.app-boss.app-boss-neuf::after{display:none}';(document.head||document.documentElement).appendChild(st);}catch(_e){}
var TABLES={joueur:JOUEUR,boss:BOSS};
function trouver(type,id){var l=TABLES[type]||[],i;for(i=0;i<l.length;i++)if(l[i].id===id)return l[i];return null;}

/* Joue l'effet `id` dans le calque opaque posé par l'appelant : résout quand l'image copiée est exactement à la place de l'image réelle (le son part en même temps que l'effet). */
function jouer(type,id,o){
  var e=trouver(type,id);
  if(!e||!o||!o.calque||!o.img)return Promise.resolve(false);
  var X;
  try{X=creerScene(o.calque,o.img);}catch(_e){return Promise.resolve(false);}
  jouerSon(id,e.duree+.3);
  var p;
  try{p=e.jouer(X);}catch(_e){p=Promise.resolve();}
  return Promise.resolve(p).then(function(){
    X.sujet.getAnimations().forEach(function(a){try{a.cancel();}catch(_e){}});
    X.sujet.style.cssText+=';opacity:1;transform:none;filter:none;clip-path:none';
    return attendre(60);
  }).then(function(){try{if(X.stage.parentNode)X.stage.parentNode.removeChild(X.stage);}catch(_e){}return true;});
}

window.__SOREAL_IDLE_REAPPARITIONS_V1__={
  joueur:JOUEUR.map(function(x){return {id:x.id,nom:x.nom,duree:x.duree};}),
  boss:BOSS.map(function(x){return {id:x.id,nom:x.nom,duree:x.duree};}),
  jouer:jouer,sons:SONS,trouver:trouver
};
})();
