/*
 * SOREAL IDLE — les cartes de TITANS à la fin de l'album des boss (Norman, 2026-11-01 : « au bout de Chroniques, le classeur, des pages avec les cartes au format Magic des TITANS qu'on a déjà battus,
 * qui aient l'air spéciales, personnalisées par rapport à leurs images, avec un effet hologramme »).
 *
 * Règle n°2 (aucun spoil) : seules les cartes des titans DÉJÀ VAINCUS (au moins une victoire) existent. Aucun total, aucun dénominateur, aucune carte « ??? » ; sans titan vaincu il n'y a AUCUNE page de titans.
 * Règle n°1 : la carte n'affiche que ce que l'état du joueur contient déjà (nom, nombre de victoires, forme en cours pour un titan à formes) ; l'illustration est celle que la page Titans utilise (/api/idle/media/titan).
 * Personnalisation : la couleur d'accent (teinte, 0-359) suit l'IMAGE du titan (analysée à son chargement, mémorisée) ; avant l'analyse, ou si elle est impossible, une teinte de repli stable par identifiant.
 * Hologramme : un reflet irisé (dégradé conique + mix-blend-mode) qui suit le pointeur (--mx / --my) et incline un peu la carte, SEULEMENT sur la carte survolée ou touchée ; aucun balayage ni boucle : rien ne bouge tant qu'on ne touche pas la carte.
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

/* Le corps de la carte d'un titan (le même dans la pochette et dans la fiche zoomée). */
function carteHtml(t){
  var id=String(t.id),nom=String(t.nomComplet||t.name||id),kills=Math.max(1,ent(t.state&&t.state.kills));
  var forme=Array.isArray(t.forms)&&t.forms.length?'<span class="alb-t-forme">Forme '+(Math.min(kills,t.forms.length-1)+1)+'</span>':'';
  return '<div class="alb-titan-carte" data-morph-vivant style="--ta:'+teinte(id)+'" data-titan="'+esc(id)+'">'+
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
    '<i class="alb-t-reflet" aria-hidden="true"></i>'+
  '</div>';
}
/* La carte d'un titan dans sa pochette (le plastique, la place et la taille sont ceux d'une carte de boss) ; un clic la sort de sa pochette comme une carte de boss. */
function pochetteHtml(t){
  var id=String(t.id),nom=String(t.nomComplet||t.name||id);
  return '<div class="alb-pochette alb-pochette-titan" role="button" tabindex="0" data-morph-classes-gardees="^alb-titan-actif$" data-album-titan="'+esc(id)+'" aria-label="'+esc(nom)+'" '+
      'onclick="window.__SOREAL_IDLE_ALBUM_V1__.ouvrirTitan(this.getAttribute(\'data-album-titan\'),this)" '+
      'onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();window.__SOREAL_IDLE_ALBUM_V1__.ouvrirTitan(this.getAttribute(\'data-album-titan\'),this)}">'+
    '<div class="alb-carte alb-carte-mtg">'+carteHtml(t)+'</div>'+
    '<div class="alb-plastique" aria-hidden="true"></div>'+
  '</div>';
}

/* ---------- la fiche zoomée : la grande carte (face = carte du titan, dos = le dos des cartes de boss, sans aucune information de jeu) ---------- */
var CHEV_G='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4 7 12l8 8" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
var CHEV_D='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4l8 8-8 8" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function trouver(id){var l=titansVaincus(),i;for(i=0;i<l.length;i++)if(String(l[i].id)===String(id))return {t:l[i],i:i,liste:l};return null;}
function nomDe(t){return String(t.nomComplet||t.name||t.id);}
function ficheContenu(id){
  var r=trouver(id);if(!r)return '';
  var C=window.__SOREAL_IDLE_CARTE_BOSS_MAGIC_V1__;
  var prec=r.i>0?r.liste[r.i-1]:null,suiv=r.i<r.liste.length-1?r.liste[r.i+1]:null;   /* navigation à l'intérieur de la famille des titans vaincus */
  return '<button type="button" class="mtg-modal-fermer-v1" aria-label="Fermer" data-titan-fermer>✕</button>'+
    (prec?'<button type="button" class="mtg-fleche mtg-fleche-prec" data-titan-aller="'+esc(prec.id)+'" aria-label="Titan précédent" data-soreal-tts-ignore>'+CHEV_G+'</button>':'')+
    (suiv?'<button type="button" class="mtg-fleche mtg-fleche-suiv" data-titan-aller="'+esc(suiv.id)+'" aria-label="Titan suivant" data-soreal-tts-ignore>'+CHEV_D+'</button>':'')+
    '<div class="carte-mtg-v1 alb-titan-fiche-carte" data-numero="titan-'+esc(r.t.id)+'" data-couleur="5">'+
      '<div class="alb-t-face" aria-label="'+esc(nomDe(r.t))+'">'+carteHtml(r.t)+'</div>'+
      (C&&C.dos?C.dos({dosImage:'/titans/dos-titan-v1.webp'}):'')+   /* dos propre aux cartes de Titan (Norman, 2026-11-01), image compressée du dépôt */
    '</div>';
}
function fermerFiche(){var m=document.getElementById('sorealIdleTitanCollectionModalV1');gyFermer();if(m)m.remove();}
function ouvrirFiche(id){
  var r=trouver(id);if(!r)return null;
  fermerFiche();
  var m=document.createElement('div');
  m.id='sorealIdleTitanCollectionModalV1';m.className='soreal-idle-modal-backdrop-v63';m.setAttribute('data-alb-cle',String(id));
  m.innerHTML='<div class="mtg-modal-v1 alb-titan-fiche" role="dialog" aria-modal="true" aria-label="'+esc(nomDe(r.t))+'">'+ficheContenu(id)+'</div>';
  m.addEventListener('click',function(ev){
    if(ev.target===m){fermerFiche();return;}
    var f=ev.target.closest&&ev.target.closest('[data-titan-fermer],[data-titan-aller]');
    if(!f)return;
    if(f.hasAttribute('data-titan-fermer')){fermerFiche();return;}
    if(changerFiche(m,f.getAttribute('data-titan-aller')))ev.stopPropagation();
  });
  document.body.appendChild(m);
  gyOuvrir();
  return m;
}
/* Flèches : la carte voisine remplace celle-ci dans la MÊME fenêtre ; à la fermeture, c'est la pochette du titan alors affiché qui reçoit la carte. */
function changerFiche(m,id){
  var h=ficheContenu(id),f=m.querySelector('.alb-titan-fiche');
  if(!h||!f)return false;
  f.innerHTML=h;m.setAttribute('data-alb-cle',String(id));
  return true;
}
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&document.getElementById('sorealIdleTitanCollectionModalV1')){e.stopPropagation();fermerFiche();}},true);

/* Un tap sur l'illustration de la grande carte la retourne (dos des cartes) ; le tap sur le dos la remet à l'endroit (géré par carte-boss-magic-v1.js) ; la rotation au doigt/souris aussi. */
document.addEventListener('click',function(e){
  var a=e.target&&e.target.closest?e.target.closest('.alb-titan-fiche .alb-t-art'):null;
  if(!a)return;
  var c=a.closest('.carte-mtg-v1');if(c&&!c.classList.contains('retournee'))c.classList.add('retournee');
});

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
/* Quatre lavis de couleur, un par coin : haut-gauche = couleur de base du titan, haut-droit = rouge, bas-gauche = bleu, bas-droit = vert. Le poids de chaque coin (--wd, --wr, --wb, --wv) croît quand la carte penche vers lui (u, v : 0 à 1). */
function poserCoins(k,u,v){
  var w=function(x){return Math.min(1,x*2.4).toFixed(2);};
  k.style.setProperty('--wd',w((1-u)*(1-v)));k.style.setProperty('--wr',w(u*(1-v)));k.style.setProperty('--wb',w((1-u)*v));k.style.setProperty('--wv',w(u*v));
}
function poser(){
  raf=0;
  if(!actif||!dernier)return;
  var r=actif.getBoundingClientRect();if(!(r.width>0&&r.height>0))return;
  var x=Math.max(0,Math.min(1,(dernier.x-r.left)/r.width)),y=Math.max(0,Math.min(1,(dernier.y-r.top)/r.height));
  var c=actif.querySelector('.alb-titan-carte');if(!c)return;
  c.style.setProperty('--mx',(x*100).toFixed(1)+'%');c.style.setProperty('--my',(y*100).toFixed(1)+'%');poserCoins(c,x,y);
  c.style.setProperty('--ry',((x-.5)*14).toFixed(2));c.style.setProperty('--rx',((.5-y)*14).toFixed(2));
}
function repos(p){
  var c=p&&p.querySelector('.alb-titan-carte');if(!c)return;
  p.classList.remove('alb-titan-actif');
  ['--mx','--my','--rx','--ry','--wd','--wr','--wb','--wv'].forEach(function(k){c.style.removeProperty(k);});
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

/*
 * Fiche zoomée : l'hologramme est PILOTÉ par la rotation de la carte (saisie à la souris ou au doigt, mécanisme de carte-boss-magic-v1.js) ET par la position du pointeur, en direct (requestAnimationFrame, seulement pendant l'interaction) :
 * --mx / --my (centre du reflet), --ha (angle de teinte du dégradé conique), --hi (intensité 0-1), --rx / --ry (penchement de la carte vers le pointeur). Sur PC, le simple survol suffit ; au doigt, l'inclinaison suit le doigt.
 */
var fi=null,fraf=0,ftimer=0;
function ficheCarte(){return document.querySelector('#sorealIdleTitanCollectionModalV1 .alb-titan-fiche-carte');}
function angleCarte(c){
  var m=/rotateY\((-?[\d.]+)deg\)/.exec(c.style.transform||'');
  var a=m?parseFloat(m[1]):(c.classList.contains('retournee')?180:0);
  a=((a%360)+360)%360;return a>180?a-360:a;
}
function penchementCarte(c){var m=/rotateX\((-?[\d.]+)deg\)/.exec(c.style.transform||'');return m?parseFloat(m[1]):0;}
/*
 * L'inclinaison a DEUX composantes, tx (gauche -1 / droite +1) et ty (haut -1 / bas +1) : la carte penche vers le coin où se trouve le pointeur (survol), ou vers où on la fait pivoter (glissé : rotateY donne tx, rotateX donne ty).
 * Le centre du reflet suit ce coin (--mx / --my), la teinte du dégradé conique suit la DIRECTION (--ha, en degrés : chaque coin a sa teinte, qui change en continu), l'intensité croît avec l'angle (--hi, nulle à plat).
 */
function inclinaison(c,px,py,glisse){
  var tx,ty;
  if(glisse){tx=Math.max(-1,Math.min(1,Math.sin(angleCarte(c)*Math.PI/180)));ty=Math.max(-1,Math.min(1,-penchementCarte(c)/14+(py-.5)));}
  else{tx=(px-.5)*2;ty=(py-.5)*2;}
  return {tx:tx,ty:ty,dir:Math.atan2(ty,tx)*180/Math.PI,force:Math.min(1,Math.sqrt(tx*tx+ty*ty))};
}
function poserFiche(){
  fraf=0;
  var c=ficheCarte(),f=c&&c.closest('.alb-titan-fiche'),k=c&&c.querySelector('.alb-titan-carte');
  if(!fi||!f||!k)return;
  var r=f.getBoundingClientRect();if(!(r.width>0&&r.height>0))return;
  var px=Math.max(0,Math.min(1,(fi.x-r.left)/r.width)),py=Math.max(0,Math.min(1,(fi.y-r.top)/r.height));
  appliquerInclinaison(c,k,inclinaison(c,px,py,fi.glisse),fi.glisse?0:8,fi.glisse?0:7);
}
/* Pose les variables de l'hologramme pour une inclinaison t (pointeur OU gyroscope) ; rotY / rotX : degrés de penchement de la carte pour tx / ty = 1. */
function appliquerInclinaison(c,k,t,rotY,rotX){
  k.style.setProperty('--mx',(50+t.tx*50).toFixed(1)+'%');k.style.setProperty('--my',(50+t.ty*50).toFixed(1)+'%');
  k.style.setProperty('--ha',t.dir.toFixed(1));k.style.setProperty('--lx',t.tx.toFixed(2));k.style.setProperty('--ly',t.ty.toFixed(2));poserCoins(k,(t.tx+1)/2,(t.ty+1)/2);
  k.style.setProperty('--hi',t.force.toFixed(2));
  k.style.setProperty('--ry',(t.tx*rotY).toFixed(2));k.style.setProperty('--rx',(-t.ty*rotX).toFixed(2));
  var fa=c.querySelector('.alb-t-face');if(fa)fa.classList.add('alb-titan-actif');
}
function reposFiche(){
  var c=ficheCarte(),k=c&&c.querySelector('.alb-titan-carte');
  fi=null;if(!k)return;
  ['--mx','--my','--ha','--hi','--rx','--ry','--wd','--wr','--wb','--wv','--lx','--ly'].forEach(function(n){k.style.removeProperty(n);});
  var fa=c.querySelector('.alb-t-face');if(fa)fa.classList.remove('alb-titan-actif');
}
function bougeFiche(ev){
  var c=ficheCarte();if(!c)return;
  var dedans=Boolean(ev.target&&ev.target.closest&&ev.target.closest('.alb-titan-fiche-carte'));
  if(!dedans&&!(fi&&fi.glisse))return;
  clearTimeout(ftimer);
  fi={x:ev.clientX,y:ev.clientY,glisse:ev.buttons>0||ev.pointerType==='touch'||Boolean(fi&&fi.glisse),dessus:dedans};
  if(!fraf)fraf=requestAnimationFrame(poserFiche);
}
document.addEventListener('pointermove',bougeFiche,{passive:true,capture:true});
document.addEventListener('pointerdown',function(ev){if(ficheCarte()&&ev.target.closest&&ev.target.closest('.alb-titan-fiche-carte'))bougeFiche(ev);},{passive:true,capture:true});
document.addEventListener('pointerup',function(ev){
  if(!fi)return;
  fi.glisse=false;
  if(ev.pointerType==='touch'){clearTimeout(ftimer);ftimer=setTimeout(reposFiche,900);}   /* le doigt levé : la carte finit son demi-tour, puis le reflet retombe */
  else if(!fraf)fraf=requestAnimationFrame(poserFiche);
},{passive:true,capture:true});
document.documentElement.addEventListener('mouseleave',reposFiche);

/*
 * Gyroscope (Norman, 2026-11-01 : « sur téléphone, utilise le gyroscope pour faire bouger la carte ») : l'inclinaison PHYSIQUE du téléphone (deviceorientation, beta / gamma, relatifs à la position de repos prise à l'ouverture de la fiche)
 * incline la carte (bornée à +/-25 degres, lissée) et pilote l'hologramme comme le pointeur. Ecouteur ajouté a l'ouverture de la fiche et RETIRE a sa fermeture ; mise a jour par requestAnimationFrame seulement quand l'angle change de plus de 0,5 degre ;
 * arret si l'onglet est masque ; le doigt pose sur la carte reste prioritaire ; sans capteur (PC : valeurs nulles) ou avec « reduire les animations » : rien. iOS : requestPermission() au premier toucher de la fiche ; refus : comportement doigt / pointeur, sans message.
 */
var GY_MAX=25,gy={on:false,base:null,cible:{x:0,y:0},lisse:{x:0,y:0},dernier:{b:null,g:null},raf:0,ecoute:false,demande:false};
function gyReduit(){try{return Boolean(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);}catch(_e){return false;}}
function gyTactile(){try{return Boolean(window.matchMedia&&window.matchMedia('(pointer: coarse)').matches)||('ontouchstart' in window);}catch(_e){return false;}}
function gyBorne(v){return Math.max(-1,Math.min(1,v));}
function gyEvenement(ev){
  if(!gy.on||!ev||ev.beta==null||ev.gamma==null||gyReduit())return;
  if(!document.getElementById('sorealIdleTitanCollectionModalV1')){gyFermer();return;}   /* fiche retiree par un autre chemin : plus d'ecouteur */
  var b=Number(ev.beta),g=Number(ev.gamma);if(!isFinite(b)||!isFinite(g))return;
  if(!gy.base)gy.base={b:b,g:g};   /* position de repos : celle de l'ouverture */
  if(gy.dernier.b!==null&&Math.abs(b-gy.dernier.b)<=.5&&Math.abs(g-gy.dernier.g)<=.5)return;   /* moins de 0,5 degre : rien (batterie) */
  gy.dernier={b:b,g:g};
  gy.cible={x:gyBorne((g-gy.base.g)/GY_MAX),y:gyBorne((b-gy.base.b)/GY_MAX)};
  if(!gy.raf)gy.raf=requestAnimationFrame(gyPas);
}
function gyPas(){
  gy.raf=0;
  var c=ficheCarte(),k=c&&c.querySelector('.alb-titan-carte');
  if(!gy.on||!k)return;
  if(fi&&fi.glisse){gy.raf=requestAnimationFrame(gyPas);return;}   /* le doigt est pose : le doigt est prioritaire, le gyroscope reprend en douceur au relachement */
  gy.lisse.x+=(gy.cible.x-gy.lisse.x)*.2;gy.lisse.y+=(gy.cible.y-gy.lisse.y)*.2;
  var x=gy.lisse.x,y=gy.lisse.y;
  appliquerInclinaison(c,k,{tx:x,ty:y,dir:Math.atan2(y,x)*180/Math.PI,force:Math.min(1,Math.sqrt(x*x+y*y))},GY_MAX*.8,GY_MAX*.7);   /* carte bornee a +/-20 et +/-17,5 degres */
  if(Math.abs(gy.cible.x-x)>.005||Math.abs(gy.cible.y-y)>.005)gy.raf=requestAnimationFrame(gyPas);
}
function gyEcouter(oui){
  if(oui===gy.ecoute)return;
  gy.ecoute=oui;
  try{if(oui)window.addEventListener('deviceorientation',gyEvenement);else window.removeEventListener('deviceorientation',gyEvenement);}catch(_e){}
}
function gyVisible(){gyEcouter(!document.hidden&&gy.on);}
function gyOuvrir(){
  gyFermer();
  if(gyReduit()||!gyTactile()||typeof window.addEventListener!=='function')return;
  gy.on=true;gy.base=null;gy.cible={x:0,y:0};gy.lisse={x:0,y:0};gy.dernier={b:null,g:null};
  var D=window.DeviceOrientationEvent;
  if(D&&typeof D.requestPermission==='function'){gy.demande=false;return;}   /* iOS : on attend le premier toucher (geste de l'utilisateur) */
  gyEcouter(true);
}
function gyFermer(){
  gy.on=false;gy.base=null;gyEcouter(false);
  if(gy.raf){try{cancelAnimationFrame(gy.raf);}catch(_e){}gy.raf=0;}
}
document.addEventListener('pointerdown',function(ev){
  if(!gy.on||gy.ecoute||gy.demande||!(ev.target&&ev.target.closest&&ev.target.closest('.alb-titan-fiche-carte')))return;
  var D=window.DeviceOrientationEvent;if(!D||typeof D.requestPermission!=='function')return;
  gy.demande=true;
  try{D.requestPermission().then(function(r){if(r==='granted'&&gy.on)gyEcouter(true);}).catch(function(){});}catch(_e){}   /* refus ou erreur : doigt / pointeur seulement */
},true);
document.addEventListener('visibilitychange',gyVisible);

window.__SOREAL_IDLE_ALBUM_TITANS_V1__={titansVaincus:titansVaincus,pochetteHtml:pochetteHtml,gyroEvenement:gyEvenement,gyroOuvrir:gyOuvrir,gyroFermer:gyFermer,ficheContenu:ficheContenu,ouvrirFiche:ouvrirFiche,fermerFiche:fermerFiche,nbPages:nbPages,page:page,teinte:teinte,urlImage:urlImage,PAR_PAGE:PAR_PAGE};
})();
