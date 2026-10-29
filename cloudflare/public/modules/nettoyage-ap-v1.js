/*
 * SOREAL IDLE — la récompense du nettoyage (Norman, 2026-10-29 : « à chaque fois qu'on nettoie le Coffre quand il a chié, et la Valise avec le vomi, on gagne des AP qu'on voit s'envoler du Coffre ou de la Valise : +2 AP ; en fait, aléatoire entre
 * 1 AP et 100 AP, et très très rarement, à 0,05 % de chance, 5K AP »).
 *
 * Le tirage et le versement des AP sont faits par le MOTEUR (action « cleanMess », idle-ngu-actions.js) : ce module envoie seulement l'action quand la flaque (Coffre) ou le vomi (Valise) vient d'être nettoyé, puis, à la réponse du moteur (événement
 * « soreal-nettoyage-ap » posé par meta-progression-v130.js), fait s'envoler « +N AP » du Coffre ou de la Valise, là où ça s'est passé. Un gain exceptionnel (5K) s'envole plus gros, doré, plus longtemps, avec des étoiles.
 * Le texte vole dans un calque gardé du redessin (data-morph-garder, règle n°4) ; aucun effet d'animation avec « réduire les animations » (le gain s'affiche alors sans mouvement).
 *   window.__SOREAL_IDLE_NETTOYAGE_AP_V1__ = { reclamer(lieu, element), montrer(ap, rare, x, y), formater(ap) }
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_NETTOYAGE_AP_V1__)return;

var attente=[];   /* positions de départ des nettoyages envoyés, dans l'ordre : la réponse du moteur reprend la plus ancienne du même lieu */

function reduit(){try{return Boolean(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);}catch(_e){return false;}}
function formater(ap){
  ap=Math.max(0,Math.floor(Number(ap)||0));
  if(ap>=1000){var k=ap/1000;return (Math.round(k*10)/10).toString().replace('.',',')+'K';}
  return String(ap);
}
function centre(el){
  try{
    var r=el&&el.getBoundingClientRect?el.getBoundingClientRect():null;
    if(r&&r.width>0)return {x:r.left+r.width/2,y:r.top+r.height*0.35};
  }catch(_e){}
  return {x:window.innerWidth/2,y:window.innerHeight*0.45};
}
function style(){
  if(document.getElementById('soreal-idle-nettoyage-ap-style'))return;
  var s=document.createElement('style');s.id='soreal-idle-nettoyage-ap-style';
  s.textContent='.nap-v1{position:fixed;z-index:100000;pointer-events:none;transform:translate(-50%,-50%);white-space:nowrap;font:400 34px/1 Bangers,Impact,sans-serif;letter-spacing:1.5px;color:#f472b6;-webkit-text-stroke:2px #3a0a2a;paint-order:stroke fill;text-shadow:0 3px 0 #3a0a2a,0 0 14px rgba(244,114,182,.8)}'+
    '.nap-v1 small{font:400 .62em Bangers,Impact,sans-serif;margin-left:.3em;color:#ffd5ec}'+
    '.nap-v1.rare{font-size:56px;color:#ffd24a;-webkit-text-stroke:3px #4a2a00;text-shadow:0 4px 0 #4a2a00,0 0 22px rgba(255,200,60,.95),0 0 44px rgba(255,150,0,.7)}'+
    '.nap-v1.rare small{color:#fff3b0}'+
    '.nap-etoile-v1{position:fixed;z-index:99999;pointer-events:none;color:#ffd24a;text-shadow:0 0 8px #ff9a1f;font:400 22px/1 sans-serif}';
  (document.head||document.documentElement).appendChild(s);
}
function montrer(ap,rare,x,y){
  try{
    style();
    var e=document.createElement('div');
    e.className='nap-v1'+(rare?' rare':'');
    e.setAttribute('data-morph-garder','');e.setAttribute('aria-hidden','true');
    e.style.left=Math.round(x)+'px';e.style.top=Math.round(y)+'px';
    e.innerHTML='+'+formater(ap)+'<small>AP</small>'+(rare?' ✦':'');
    document.body.appendChild(e);
    var duree=rare?3200:1900,haut=rare?170:120;
    if(reduit()){setTimeout(function(){if(e.parentNode)e.parentNode.removeChild(e);},duree*0.8);return;}
    var a=e.animate([
      {transform:'translate(-50%,-50%) scale(.4)',opacity:0},
      {transform:'translate(-50%,-50%) scale('+(rare?1.35:1.2)+')',opacity:1,offset:.14},
      {transform:'translate(-50%,calc(-50% - '+(haut*0.35)+'px)) scale(1)',opacity:1,offset:.5},
      {transform:'translate(-50%,calc(-50% - '+haut+'px)) scale(.96)',opacity:0}
    ],{duration:duree,easing:'cubic-bezier(.2,.7,.3,1)',fill:'forwards'});
    a.onfinish=function(){if(e.parentNode)e.parentNode.removeChild(e);};
    /* gain exceptionnel : une gerbe d'étoiles autour */
    if(rare){
      for(var i=0;i<14;i++){
        var s=document.createElement('div');s.className='nap-etoile-v1';s.textContent=i%2?'✦':'★';
        s.setAttribute('data-morph-garder','');s.setAttribute('aria-hidden','true');
        s.style.left=Math.round(x)+'px';s.style.top=Math.round(y)+'px';
        document.body.appendChild(s);
        var ang=(i/14)*Math.PI*2+i*.3,d=70+((i*37)%60);
        (function(el){
          var an=el.animate([{transform:'translate(-50%,-50%) scale(.3)',opacity:1},{transform:'translate(calc(-50% + '+Math.cos(ang)*d+'px),calc(-50% + '+(Math.sin(ang)*d-30)+'px)) scale(1.2) rotate(180deg)',opacity:0}],{duration:1500+((i*91)%900),delay:(i*40),easing:'cubic-bezier(.2,.7,.3,1)',fill:'forwards'});
          an.onfinish=function(){if(el.parentNode)el.parentNode.removeChild(el);};
        })(s);
      }
    }
  }catch(_e){}
}
function reclamer(lieu,element){
  try{
    var f=window.__actionMetaIdleV130__;
    if(typeof f!=='function')return false;
    var p=centre(element);
    attente.push({lieu:String(lieu||''),x:p.x,y:p.y,at:Date.now()});
    if(attente.length>6)attente.shift();
    f({action:'cleanMess',lieu:String(lieu||'coffre')});
    return true;
  }catch(_e){return false;}
}
window.addEventListener('soreal-nettoyage-ap',function(ev){
  var d=(ev&&ev.detail)||{};
  var i=-1,k;
  for(k=0;k<attente.length;k++)if(attente[k].lieu===d.lieu){i=k;break;}
  var pos=i>=0?attente.splice(i,1)[0]:{x:window.innerWidth/2,y:window.innerHeight*0.45};
  montrer(d.ap,d.rare,pos.x,pos.y);
});

window.__SOREAL_IDLE_NETTOYAGE_AP_V1__={reclamer:reclamer,montrer:montrer,formater:formater};
})();
