/*
 * SOREAL IDLE — les cartes de TITANS à la fin de l'album des boss (Norman, 2026-11-01 : « au bout de Chroniques, le classeur, des pages avec les cartes au format Magic des TITANS qu'on a déjà battus,
 * qui aient l'air spéciales, personnalisées par rapport à leurs images, avec un effet hologramme »).
 *
 * Règle n°2 (aucun spoil) : seules les cartes des titans DÉJÀ VAINCUS (au moins une victoire) existent. Aucun total, aucun dénominateur, aucune carte « ??? » ; sans titan vaincu il n'y a AUCUNE page de titans.
 * Règle n°1 : la carte n'affiche que ce que l'état du joueur contient déjà (nom, nombre de victoires, forme en cours pour un titan à formes) ; l'illustration est celle que la page Titans utilise (/api/idle/media/titan).
 * Personnalisation : la couleur d'accent (teinte, 0-359) suit l'IMAGE du titan (analysée à son chargement, mémorisée) ; avant l'analyse, ou si elle est impossible, une teinte de repli stable par identifiant.
 * Hologramme : un reflet irisé (dégradé conique + mix-blend-mode) qui suit le pointeur (--mx / --my) et incline un peu la carte, SEULEMENT sur la carte survolée ou touchée ; un balayage lumineux en boucle parfaite
 * (soreal-idle-album-titans.css : fondu aux deux bouts, une seule période, coupé par « réduire les animations »).
 *   window.__SOREAL_IDLE_ALBUM_TITANS_V1__ = { titansVaincus(), pochetteHtml(titan), nbPages(n), page(liste, p), teinte(id), PAR_PAGE }
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_ALBUM_TITANS_V1__)return;

var PAR_PAGE=9;
var memoTeinte={};   /* identifiant du titan -> teinte déduite de son image */

function esc(t){return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function ent(x){var n=Math.floor(Number(x));return isFinite(n)?n:0;}
function reg(){return window.__SOREAL_IDLE_REG__||{};}

/* Rang d'un titan dans l'ordre du jeu : le nombre de son identifiant (t2 avant t10). */
function rang(t){var m=/(\d+)/.exec(String(t&&t.id));return m?parseInt(m[1],10):1e9;}

/* Les titans déjà vaincus au moins une fois, dans l'ordre du jeu. La liste envoyée par le serveur est déjà filtrée (règle n°2) : on ne garde en plus que les victoires. */
function titansVaincus(){
  try{
    var R=reg(),a=typeof R.aventureMetaIdleV47_==='function'&&R.idleEtat?R.aventureMetaIdleV47_(R.idleEtat):null;
    var l=a&&Array.isArray(a.titans)?a.titans:[];
    return l.filter(function(t){return t&&t.id&&ent(t.state&&t.state.kills)>0;}).sort(function(x,y){return rang(x)-rang(y);});
  }catch(_e){return [];}
}
/* Pages de titans : 9 emplacements par page, aucune page quand il n'y a aucun titan vaincu. */
function nbPages(n){n=Math.max(0,ent(n));return n?Math.ceil(n/PAR_PAGE):0;}
function page(liste,p){return (liste||[]).slice(p*PAR_PAGE,p*PAR_PAGE+PAR_PAGE);}

/* Teinte de repli stable (aucune valeur de jeu : simple parure) ; remplacée par celle de l'image dès qu'elle est analysée. */
function teinteRepli(id){
  var s=String(id),h=0,i;
  for(i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))%360;
  return (h*137+40)%360;
}
function teinte(id){var v=memoTeinte[id];return typeof v==='number'?v:teinteRepli(id);}

/* L'image du titan : celle de la page Titans (forme en cours pour un titan à formes, premier palier pour un titan à difficultés). */
function urlImage(t){
  var p='id='+encodeURIComponent(String(t.id));
  if(Array.isArray(t.forms)&&t.forms.length)p+='&form='+Math.min(ent(t.state&&t.state.kills),t.forms.length-1);
  else if(t.difficulties&&typeof t.difficulties==='object'){var k=Object.keys(t.difficulties)[0];if(k)p+='&tier='+encodeURIComponent(k);}
  return '/api/idle/media/titan?'+p;
}

/* La carte d'un titan dans sa pochette (le plastique, la place et la taille sont ceux d'une carte de boss). */
function pochetteHtml(t){
  var id=String(t.id),nom=String(t.nomComplet||t.name||id),kills=Math.max(1,ent(t.state&&t.state.kills));
  var forme=Array.isArray(t.forms)&&t.forms.length?'<span class="alb-t-forme">Forme '+(Math.min(kills,t.forms.length-1)+1)+'</span>':'';
  return '<div class="alb-pochette alb-pochette-titan" role="img" tabindex="0" data-morph-classes-gardees="^alb-titan-actif$" data-album-titan="'+esc(id)+'" aria-label="'+esc(nom)+'">'+
    '<div class="alb-carte alb-carte-mtg">'+
      '<div class="alb-titan-carte" data-morph-vivant style="--ta:'+teinte(id)+'" data-titan="'+esc(id)+'">'+
        '<div class="alb-t-cadre">'+
          '<div class="alb-t-tete"><b class="alb-t-nom">'+esc(nom)+'</b><i class="alb-t-gemme" aria-hidden="true"></i></div>'+
          '<div class="alb-t-art">'+
            '<img class="alb-t-img" src="'+esc(urlImage(t))+'" alt="" draggable="false" decoding="async" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">'+
            '<span class="alb-t-secours" style="display:none">👹</span>'+
            '<i class="alb-t-holo" aria-hidden="true"></i>'+
          '</div>'+
          '<div class="alb-t-type"><span>Titan</span>'+forme+'</div>'+
          '<div class="alb-t-pied"><b>'+kills+'</b> <span>'+(kills>1?'victoires':'victoire')+'</span></div>'+
        '</div>'+
        '<i class="alb-t-reflet" aria-hidden="true"></i><i class="alb-t-balai" aria-hidden="true"></i>'+
      '</div>'+
    '</div>'+
    '<div class="alb-plastique" aria-hidden="true"></div>'+
  '</div>';
}

/* ---------- couleur tirée de l'image ---------- */
function analyser(img){
  try{
    var c=document.createElement('canvas');c.width=c.height=32;
    var g=c.getContext('2d',{willReadFrequently:true});
    g.drawImage(img,0,0,32,32);
    var d=g.getImageData(0,0,32,32).data,sx=0,sy=0,tot=0,i;
    for(i=0;i<d.length;i+=4){
      if(d[i+3]<128)continue;
      var r=d[i]/255,gg=d[i+1]/255,b=d[i+2]/255,mx=Math.max(r,gg,b),mn=Math.min(r,gg,b),dl=mx-mn;
      if(!dl||mx<.25||dl/mx<.25)continue;
      var h=mx===r?((gg-b)/dl+6)%6:mx===gg?(b-r)/dl+2:(r-gg)/dl+4,w=(dl/mx)*mx,a=h*Math.PI/3;
      sx+=Math.cos(a)*w;sy+=Math.sin(a)*w;tot+=w;
    }
    if(tot<1)return null;   /* image presque sans couleur : on garde la teinte de repli */
    var deg=Math.atan2(sy,sx)*180/Math.PI;
    return Math.round((deg+360)%360);
  }catch(_e){return null;}   /* image illisible (canvas verrouillé) : repli */
}
document.addEventListener('load',function(e){
  var im=e.target;
  if(!im||im.tagName!=='IMG'||!im.classList||!im.classList.contains('alb-t-img'))return;
  var carte=im.closest('.alb-titan-carte'),id=carte&&carte.getAttribute('data-titan');
  if(!id||typeof memoTeinte[id]==='number')return;
  var h=analyser(im);if(h===null)return;
  memoTeinte[id]=h;
  [].forEach.call(document.querySelectorAll('.alb-titan-carte'),function(c){if(c.getAttribute('data-titan')===id)c.style.setProperty('--ta',String(h));});
},true);

/* ---------- le reflet suit le pointeur : seulement sur la carte survolée ou touchée ---------- */
var actif=null,raf=0,dernier=null,retombe=0;
function poser(){
  raf=0;
  if(!actif||!dernier)return;
  var r=actif.getBoundingClientRect();if(!(r.width>0&&r.height>0))return;
  var x=Math.max(0,Math.min(1,(dernier.x-r.left)/r.width)),y=Math.max(0,Math.min(1,(dernier.y-r.top)/r.height));
  var c=actif.querySelector('.alb-titan-carte');if(!c)return;
  c.style.setProperty('--mx',(x*100).toFixed(1)+'%');c.style.setProperty('--my',(y*100).toFixed(1)+'%');
  c.style.setProperty('--ry',((x-.5)*14).toFixed(2));c.style.setProperty('--rx',((.5-y)*14).toFixed(2));
}
function repos(p){
  var c=p&&p.querySelector('.alb-titan-carte');if(!c)return;
  p.classList.remove('alb-titan-actif');
  ['--mx','--my','--rx','--ry'].forEach(function(k){c.style.removeProperty(k);});
}
function suivre(ev){
  var p=ev.target&&ev.target.closest?ev.target.closest('.alb-pochette-titan'):null;
  if(!p){if(actif&&ev.pointerType!=='touch'){repos(actif);actif=null;}return;}
  clearTimeout(retombe);
  if(actif!==p){if(actif)repos(actif);actif=p;p.classList.add('alb-titan-actif');}
  dernier={x:ev.clientX,y:ev.clientY};
  if(!raf)raf=requestAnimationFrame(poser);
}
document.addEventListener('pointermove',suivre,{passive:true});
document.addEventListener('pointerdown',suivre,{passive:true});
document.addEventListener('pointerup',function(ev){
  if(ev.pointerType!=='touch'||!actif)return;
  var p=actif;clearTimeout(retombe);retombe=setTimeout(function(){if(actif===p){repos(p);actif=null;}},1400);   /* le doigt levé, le reflet reste un instant puis retombe */
},{passive:true});
document.documentElement.addEventListener('mouseleave',function(){if(actif){repos(actif);actif=null;}});   /* le pointeur quitte la fenêtre */

window.__SOREAL_IDLE_ALBUM_TITANS_V1__={titansVaincus:titansVaincus,pochetteHtml:pochetteHtml,nbPages:nbPages,page:page,teinte:teinte,urlImage:urlImage,PAR_PAGE:PAR_PAGE};
})();
