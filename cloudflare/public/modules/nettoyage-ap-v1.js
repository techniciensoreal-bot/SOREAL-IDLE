/*
 * SOREAL IDLE — la récompense du nettoyage (Norman, 2026-10-29 : « à chaque fois qu'on nettoie le Coffre quand il a chié, et la Valise avec le vomi, on gagne des AP qu'on voit s'envoler du Coffre ou de la Valise : +2 AP ; en fait, aléatoire entre
 * 1 AP et 100 AP, et très très rarement, à 0,05 % de chance, 5K AP »).
 *
 * Le tirage et le versement des AP sont faits par le MOTEUR (action « cleanMess », idle-ngu-actions.js) : ce module envoie seulement l'action quand la flaque (Coffre) ou le vomi (Valise) vient d'être nettoyé, puis, à la réponse du moteur (événement
 * « soreal-nettoyage-ap » posé par meta-progression-v130.js), fait s'envoler « +N AP » du Coffre ou de la Valise, là où ça s'est passé. Un gain exceptionnel (5K) s'envole plus gros, doré, plus longtemps, avec des étoiles.
 * Le texte vole dans un calque gardé du redessin (data-morph-garder, règle n°4) ; aucun effet d'animation avec « réduire les animations » (le gain s'affiche alors sans mouvement).
 *   window.__SOREAL_IDLE_NETTOYAGE_AP_V1__ = { reclamer(lieu, element), montrer(ap, rare, x, y, lieu), formater(ap), phrase(lieu, ap, rare) }
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
    '.nap-phrase-v1{position:fixed;z-index:100000;pointer-events:none;box-sizing:border-box;width:max-content;max-width:min(300px,calc(100vw - 24px));padding:8px 12px;border-radius:12px;text-align:center;font:700 15px/1.3 "Russo One","Trebuchet MS",Arial,sans-serif;color:#fff;background:rgba(26,10,34,.92);border:2px solid #f472b6;box-shadow:0 4px 14px rgba(0,0,0,.55),0 0 14px rgba(244,114,182,.4)}'+
    '.nap-phrase-v1.rare{border-color:#ffd24a;font-size:16px;box-shadow:0 4px 14px rgba(0,0,0,.55),0 0 22px rgba(255,200,60,.7)}'+
    '.nap-etoile-v1{position:fixed;z-index:99999;pointer-events:none;color:#ffd24a;text-shadow:0 0 8px #ff9a1f;font:400 22px/1 sans-serif}';
  (document.head||document.documentElement).appendChild(s);
}
/*
 * Phrases comiques du nettoyage (Norman, 2026-10-30 : « quand on nettoie son coffre ou sa valise, on a une récompense en AP : plusieurs phrases comiques, du genre : Sébastien a du vomi partout sur lui mais ça valait le coup pour ses 20 AP »).
 * Une phrase au hasard (jamais deux fois de suite la même) s'affiche sous le « +N AP » ; {ap} y est remplacé par le gain. Coffre = le caca ; Valise = le vomi ; gain exceptionnel (5K AP) : phrases de jackpot.
 */
var PHRASES={
  coffre:[
    'Sébastien a du caca jusqu’aux coudes, mais ça valait le coup pour ses {ap} AP.',
    'Marcel sent encore le Coffre. Il ne sent plus ses doigts, mais il sent très bien ses {ap} AP.',
    'Jean-Kevin a juré de ne plus jamais dire « c’est juste de la boue ». {ap} AP, c’est dur à digérer.',
    'Le Coffre brille. Colette, elle, est un peu verte. Compensation : {ap} AP.',
    'Josiane jure que l’éponge n’était pas la sienne. {ap} AP plus tard, elle ne pose plus de questions.',
    'Patrick a frotté si fort qu’il a usé son gant et un bout de son orgueil. {ap} AP.',
    'Gérard se lave les mains pour la douzième fois. {ap} AP, ça se rince mal.',
    'Le Coffre te remercie en silence. Les {ap} AP, eux, sont plus polis.'
  ],
  valise:[
    'Sébastien a du vomi partout sur lui mais ça valait le coup pour ses {ap} AP.',
    'La Valise sent la menthe et le regret. Hervé garde les {ap} AP, le regret est offert.',
    'Brigitte a nettoyé en retenant sa respiration : {ap} AP et un poumon plein de courage.',
    'Raymond ne mangera plus jamais de spaghetti. Mais il mangera avec {ap} AP de plus.',
    'Merci à Nadine, qui a frotté sans vomir. Presque. {ap} AP.',
    'La Valise est propre ! Les chaussettes de Michel, un peu moins. {ap} AP quand même.',
    'Ginette jure n’avoir touché à rien. Ses mains et ses {ap} AP disent le contraire.',
    'Le vomi est parti, la honte reste. Fabrice garde ses {ap} AP.'
  ],
  rare:[
    'Jackpot ! Roger a frotté, frotté… et la saleté lui a craché {ap} AP. Même la poubelle est jalouse.',
    '{ap} AP ! Odette n’a jamais été aussi fière d’avoir les mains sales.',
    'Fernand a trouvé une dent en or dans la flaque : {ap} AP ! Il ne dira pas d’où elle venait.'
  ]
};
var dernierePhrase={};
function phrase(lieu,ap,rare){
  var cle=rare?'rare':(PHRASES[lieu]?lieu:'coffre'),liste=PHRASES[cle],i=Math.floor(Math.random()*liste.length);
  if(liste.length>1&&i===dernierePhrase[cle])i=(i+1)%liste.length;
  dernierePhrase[cle]=i;
  return liste[i].replace('{ap}',formater(ap));
}
function montrerPhrase(texte,rare,x,y){
  try{
    var e=document.createElement('div');
    e.className='nap-phrase-v1'+(rare?' rare':'');
    e.setAttribute('data-morph-garder','');e.setAttribute('aria-hidden','true');
    e.textContent=texte;
    var demi=Math.min(150,Math.max(100,(window.innerWidth||320)/2-12));
    e.style.left=Math.round(Math.max(demi+8,Math.min((window.innerWidth||320)-demi-8,x)))+'px';
    e.style.top=Math.round(y+(rare?58:46))+'px';
    document.body.appendChild(e);
    var duree=rare?5200:4200;
    if(reduit()){setTimeout(function(){if(e.parentNode)e.parentNode.removeChild(e);},duree);return;}
    var a=e.animate([
      {transform:'translate(-50%,6px)',opacity:0},
      {transform:'translate(-50%,0)',opacity:1,offset:.12},
      {transform:'translate(-50%,0)',opacity:1,offset:.82},
      {transform:'translate(-50%,-10px)',opacity:0}
    ],{duration:duree,easing:'ease-out',fill:'forwards'});
    a.onfinish=function(){if(e.parentNode)e.parentNode.removeChild(e);};
  }catch(_e){}
}
function montrer(ap,rare,x,y,lieu){
  try{
    style();
    var e=document.createElement('div');
    e.className='nap-v1'+(rare?' rare':'');
    e.setAttribute('data-morph-garder','');e.setAttribute('aria-hidden','true');
    e.style.left=Math.round(x)+'px';e.style.top=Math.round(y)+'px';
    e.innerHTML='+'+formater(ap)+'<small>AP</small>'+(rare?' ✦':'');
    document.body.appendChild(e);
    if(lieu)montrerPhrase(phrase(lieu,ap,rare),rare,x,y);
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
    attente=attente.filter(function(a){return Date.now()-a.at<8000;});   /* une demande refusée par le moteur (cadence, plafond) ne reçoit jamais de « +N AP » : son entrée ne reste pas */
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
  montrer(d.ap,d.rare,pos.x,pos.y,d.lieu||'coffre');
});

window.__SOREAL_IDLE_NETTOYAGE_AP_V1__={reclamer:reclamer,montrer:montrer,formater:formater,phrase:phrase,phrases:PHRASES};
})();
