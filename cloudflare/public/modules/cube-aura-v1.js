/*
 * SOREAL IDLE — la petite aura du Cube de l'infini (Norman, 2026-10-29 : « j'aimerais que le cube de l'infini ait toujours une petite aura qui correspond à son aspect »).
 * Le cube change d'image à chaque palier : l'aura prend la COULEUR DOMINANTE de l'image affichée (les pixels vifs pèsent le plus, comme la couleur d'une carte de boss), calculée une fois par image puis mémorisée.
 * Toujours allumée, douce, sans animation (règle n°3 : aucune boucle imparfaite possible) : deux ombres portées colorées autour du cube, dans l'inventaire (emplacement du cube) et dans la Collection.
 * Règle n°4 (redessin) : l'aura est un style posé sur l'image après le rendu ; elle est remise dans la même tâche à chaque redessin de la page (window.__SOREAL_IDLE_APRES_REDESSIN_V1__), sans attente.
 *   window.__SOREAL_IDLE_CUBE_AURA_V1__ = { couleurDe(img) -> 'r,g,b' | null, appliquer() }
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_CUBE_AURA_V1__)return;

var SELECTEURS='.soreal-idle-v138-slot-cube img,.soreal-idle-collection-cube-v1 img';
var memoire={};   /* adresse de l'image -> 'r,g,b' (ou '' si l'image est illisible) */

function style_(){
  if(document.getElementById('cube-aura-style-v1'))return;
  var s=document.createElement('style');s.id='cube-aura-style-v1';
  s.textContent='img.cube-aura-v1{filter:drop-shadow(0 0 3px rgba(var(--cube-aura),.85)) drop-shadow(0 0 9px rgba(var(--cube-aura),.5))}';
  (document.head||document.documentElement).appendChild(s);
}

/* Couleur dominante : chaque pixel opaque est pesé par sa saturation et sa luminosité (un cube gris reste gris, un cube coloré donne sa couleur). */
function dominante(img){
  try{
    var c=document.createElement('canvas');c.width=c.height=32;
    var g=c.getContext('2d',{willReadFrequently:true});
    g.drawImage(img,0,0,32,32);
    var d=g.getImageData(0,0,32,32).data,R=0,G=0,B=0,W=0,i;
    for(i=0;i<d.length;i+=4){
      if(d[i+3]<140)continue;
      var r=d[i],gg=d[i+1],b=d[i+2],mx=Math.max(r,gg,b),mn=Math.min(r,gg,b);
      var sat=mx?(mx-mn)/mx:0,w=.05+sat*(mx/255)*(mx/255);
      R+=r*w;G+=gg*w;B+=b*w;W+=w;
    }
    if(!W)return '';
    R/=W;G/=W;B/=W;
    /* l'aura doit se voir sur le fond sombre : on éclaircit un peu les couleurs trop sombres, sans toucher à la teinte */
    var lum=Math.max(R,G,B);
    if(lum<150&&lum>0){var k=150/lum;R=Math.min(255,R*k);G=Math.min(255,G*k);B=Math.min(255,B*k);}
    return Math.round(R)+','+Math.round(G)+','+Math.round(B);
  }catch(_e){return '';}   /* image d'une autre origine, non chargée… : pas d'aura */
}

function poser(img,couleur){
  if(!couleur){img.classList.remove('cube-aura-v1');img.style.removeProperty('--cube-aura');return;}
  img.style.setProperty('--cube-aura',couleur);
  img.classList.add('cube-aura-v1');
}

function appliquer(){
  try{
    style_();
    var imgs=document.querySelectorAll(SELECTEURS);
    for(var i=0;i<imgs.length;i++){
      (function(img){
        var src=img.currentSrc||img.getAttribute('src')||'';
        if(!src||img.style.display==='none')return;
        if(Object.prototype.hasOwnProperty.call(memoire,src)){poser(img,memoire[src]);return;}   /* connue : posée tout de suite (même tâche que le redessin) */
        var calculer=function(){
          if(Object.prototype.hasOwnProperty.call(memoire,src))return;
          memoire[src]=dominante(img);
          appliquer();
        };
        if(img.complete&&img.naturalWidth>0)calculer();
        else img.addEventListener('load',calculer,{once:true});
      })(imgs[i]);
    }
  }catch(_e){}
}

function couleurDe(img){var src=img&&(img.currentSrc||img.getAttribute('src'));return src&&Object.prototype.hasOwnProperty.call(memoire,src)?memoire[src]||null:null;}

(window.__SOREAL_IDLE_APRES_REDESSIN_V1__=window.__SOREAL_IDLE_APRES_REDESSIN_V1__||[]).push(appliquer);
try{
  var rt=window.__SOREAL_IDLE_RUNTIME_V1__;
  if(rt&&typeof rt.onRender==='function')rt.onRender(function(){setTimeout(appliquer,60);});
}catch(_e){}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',appliquer,{once:true});else appliquer();
setInterval(function(){if(!document.hidden&&document.querySelector(SELECTEURS))appliquer();},2000);   /* filet : une image qui arrive après le rendu (changement de palier) */

window.__SOREAL_IDLE_CUBE_AURA_V1__={couleurDe:couleurDe,appliquer:appliquer};
})();
