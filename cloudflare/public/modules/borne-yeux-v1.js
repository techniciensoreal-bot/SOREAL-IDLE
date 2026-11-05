/*
 * SOREAL IDLE — les YEUX de la borne d'arcade (Norman, 2026-11-05) : scène du panneau LED, séparée de borne-led-v1.js (plafond de 2 700 lignes par fichier). Reçoit les primitives de dessin de la borne (px, clamp, sm, couleur, panneau en cours) ;
 * rien d'autre n'est partagé. window.__SOREAL_IDLE_BORNE_YEUX_V1__(outils) -> { scene(t), params() }.
 */
(function(){
'use strict';
window.__SOREAL_IDLE_BORNE_YEUX_V1__=function(O){
var px=O.px,clamp=O.clamp,sm=O.sm,BLA=O.BLA;
function paneau(){return O.P();}
/* LES YEUX (Norman, 2026-11-05 : « de temps en temps, la borne doit avoir des yeux sur son écran LED, pleins d'expressions : heureux, tristes, suspect, qui regardent à gauche, à droite, etc. ; ça doit se déclencher quand on n'a pas cliqué sur les boutons depuis quelques secondes et qu'on est sur la page Fight Boss »).
   Scène pure du temps (règle du panneau) : deux yeux (blanc allumé, pupille éteinte) dont les paupières, la pupille et la forme suivent une suite d'expressions tirée au lancement (p.seq). Un clic (ou une touche) l'arrête ; un combat l'interrompt tout de suite (voir image/pousser) ;
   aucune scène en combat. Règle n°3 : entrée et sortie en fondu (gain commun de dessiner) ; animation réduite : yeux ouverts, fixes. Aucun texte : rien à traduire, rien de verrouillé. */
var YEUX_INACTIF_MS=6000,YEUX_PAUSE_MIN_MS=22000,YEUX_PAUSE_ALEA_MS=26000,YEUX_SEG_S=1.5,YEUX_DEBUT_S=1.0,YEUX_FIN_S=0.7;
var YEUX_EXPR={
  neutre:function(){return {lt:0,lb:0,tl:0,px:0,py:0,ps:1,sh:0};},
  gauche:function(){return {lt:0,lb:0,tl:0,px:-1,py:0,ps:1,sh:0};},
  droite:function(){return {lt:0,lb:0,tl:0,px:1,py:0,ps:1,sh:0};},
  alalter:function(u){return {lt:0,lb:0,tl:0,px:u<0.5?-1:1,py:0,ps:1,sh:0};},        /* regarde à gauche puis à droite */
  haut:function(){return {lt:0,lb:0,tl:0,px:0.3,py:-1,ps:1,sh:0};},
  content:function(){return {lt:0,lb:0,tl:0,px:0,py:0,ps:1,sh:1};},                    /* yeux en arcs (^ ^) */
  triste:function(){return {lt:0.18,lb:0,tl:0.8,px:0,py:0.6,ps:1.15,sh:0};},
  soupcon:function(){return {lt:0.3,lb:0.08,tl:-0.4,px:1,py:0,ps:0.7,sh:0};},
  surpris:function(){return {lt:0,lb:0,tl:0,px:0,py:0,ps:0.55,sh:0};},
  endormi:function(){return {lt:0.42,lb:0.04,tl:0,px:0,py:0.4,ps:0.7,sh:0};},
  colere:function(){return {lt:0.22,lb:0,tl:-0.9,px:0,py:0.1,ps:0.9,sh:0};},
  clin:function(u){return {lt:0,lb:0,tl:0,px:0,py:0,ps:1,sh:0,clin:u>0.25&&u<0.75?1:0};}   /* clin d'œil de l'œil droit */
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
function sYeux(t){
  var P=paneau(),p=P.p,seq=p.seq||['neutre','neutre'],W=P.W,H=P.H,eh=Math.max(6,Math.min(12,H-2)),ew=Math.round(eh*1.2)|1,gap=Math.round(ew*0.9),y0=Math.floor((H-eh)/2),i,x,y;
  var e=P.reduced?YEUX_EXPR.neutre(0):yeuxEtat(t,seq);
  /* clignement : bref, toutes les ~2,6 s (jamais pendant un clin d'œil), fermeture et réouverture en 0,16 s */
  var bk=0;if(!P.reduced){var c=(t+0.9)%2.6;bk=c<0.16?Math.sin(c/0.16*Math.PI):0;}
  var a=ew/2,b=eh/2;
  for(i=0;i<2;i++){
    var cx=Math.round(W/2+(i?1:-1)*(gap/2+a))-0.5+(ew%2?0.5:0),cy=y0+b-0.5,ext=i?1:-1;   /* ext : côté extérieur de l'œil */
    var ferme=(e.clin&&i===1)?1:bk;
    for(y=y0;y<y0+eh;y++){
      for(x=Math.floor(cx-a-1);x<=Math.ceil(cx+a+1);x++){
        var nx=(x-cx)/a,ny=(y-cy)/b,dedans=nx*nx+ny*ny<=1.0;
        if(!dedans)continue;
        var u2=nx*ext,haut=y0+e.lt*eh+e.tl*eh*0.35*u2+ferme*b*0.95,bas=y0+eh-1-e.lb*eh-ferme*b*0.95+1;
        if(e.sh===1){                                                    /* arc heureux : seule une fine bande du haut de l'œil */
          var ny2=(y-(cy+b*0.15))/(b*0.8),interne=nx*nx+ny2*ny2<=1.0;
          if(interne||y>cy+b*0.15)continue;
        }else{
          if(y<haut-0.5||y>bas-0.5)continue;
          var pr=Math.max(1.2,eh*0.2*e.ps),pcx=cx+e.px*a*0.45,pcy=cy+e.py*b*0.4;
          if((x-pcx)*(x-pcx)+(y-pcy)*(y-pcy)<=pr*pr)continue;           /* pupille : points éteints */
        }
        px(x,y,BLA,235);
      }
    }
    if(ferme>0.9&&e.sh!==1){for(x=Math.round(cx-a*0.8);x<=Math.round(cx+a*0.8);x++)px(x,Math.round(cy),BLA,235);}   /* œil fermé : un trait */
  }
}
/* Inactivité : instant du dernier clic / touche / toucher (au chargement : maintenant, donc jamais d'yeux dans les premières secondes) ; yeuxAt : une apparition toutes les 22 à 48 s au plus. */
var dernierClic=(window.performance&&performance.now)?performance.now():0,yeuxAt=0;
(function(){var f=function(){dernierClic=(window.performance&&performance.now)?performance.now():0;};try{window.addEventListener('pointerdown',f,true);window.addEventListener('keydown',f,true);window.addEventListener('touchstart',f,true);}catch(_e){}})();
function du(now,combat){return !combat&&now-dernierClic>=YEUX_INACTIF_MS&&now>=yeuxAt;}
function lancer(now){yeuxAt=now+YEUX_PAUSE_MIN_MS+Math.random()*YEUX_PAUSE_ALEA_MS;return yeuxParams();}
return {scene:sYeux,params:yeuxParams,du:du,lancer:lancer,clic:function(){return dernierClic;},yeuxAt:function(){return yeuxAt;},regler:function(c,a){dernierClic=c;yeuxAt=a;}};
};
})();
