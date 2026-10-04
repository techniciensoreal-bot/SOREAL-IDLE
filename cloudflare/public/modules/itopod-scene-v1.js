/*
 * SOREAL IDLE — arène de l'ITOPOD (Norman, 2026-09-26 puis 2026-10-04) : la page copie la disposition du mode Aventure (sans inventaire) : l'image de l'ennemi, son nom en dessous, puis le choix des étages
 * (construit par pageItopodIdleV1_, meta-progression-v130.js). Les ennemis portent les prénoms et les avatars de l'équipe (ouvriers, responsables, anciens), lus par le serveur sur SOREAL TV
 * (src/idle-itopod-roster-v1.js : la liste grandit toute seule avec l'équipe ; Norman et Sébastien y sont toujours).
 *
 * Décor : R2 « idle/itopod/ », un fichier par étage de 1 à 10 : l'étage N de la tour affiche le décor ((N − 1) mod 10) + 1, donc le même décor à chaque fois pour un même étage, en boucle tous les 10 étages.
 * Style : feuille soreal-idle-jeu.css (classes itp-*).
 *
 * La scène est purement visuelle : le combat de la tour est calculé par le serveur (par lots, hors ligne compris). L'ennemi affiché est choisi de façon déterministe d'après le nombre total
 * d'ennemis vaincus, donc stable d'un rendu à l'autre.
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_ITOPOD_SCENE_V1__)return;

var CLASSE='soreal-idle-itopod-scene-v1';
var roster=null;      /* {workers:[{nom,avatar}], etages:{1..10:cle}} */
var chargement=false;
var dernierEssai=0;

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function urlImage(cle){return '/api/idle/media/shared?key='+encodeURIComponent(cle);}

/* Décor de l'étage : de 1 à 10, en boucle (étage 0 ou 1 → 1, étage 10 → 10, étage 11 → 1…). */
function numeroDecor(etage){
  var e=Math.max(0,Math.floor(Number(etage)||0));
  return e<=0?1:((e-1)%10)+1;
}
function decorPour(etage){
  var liste=roster&&roster.etages;
  return liste&&liste[numeroDecor(etage)]?liste[numeroDecor(etage)]:'';
}

function pgcd(a,b){while(b){var t=b;b=a%b;a=t;}return a;}
/* Ennemi n° kills : un pas premier avec la taille de la liste, pour ne jamais retomber sur le même nom deux fois de suite. */
function indexEnnemi(n,kills,etage){
  if(n<=1)return 0;
  var pas=[7,11,13,17,19,23,29,31,37].filter(function(p){return pgcd(p,n)===1;})[0]||1;
  return ((Math.max(0,kills)*pas)+Math.max(0,etage)*3)%n;
}

function contenu(etage,kills,killsSurEtage){
  var n=roster&&Array.isArray(roster.workers)?roster.workers.length:0;
  var ennemi=n?roster.workers[indexEnnemi(n,kills,etage)]:null;
  var fond=decorPour(etage);
  var nom=ennemi?ennemi.nom:'Pissed Off Dude';
  var avatar=ennemi&&ennemi.avatar
    ?'<img class="itp-avatar" src="'+esc(urlImage(ennemi.avatar))+'" alt="" onerror="this.style.display=\'none\'">'
    :'<div class="itp-avatar itp-avatar-vide">😠</div>';
  var decor=fond
    ?'<img class="itp-decor" src="'+esc(urlImage(fond))+'" alt="" onerror="this.style.visibility=\'hidden\'">'
    :'';
  var pips='';
  for(var i=0;i<10;i++)pips+='<i class="itp-pip'+(i<killsSurEtage?' plein':'')+'"></i>';
  return '<div class="itp-banniere"><span class="itp-etage"><small>ÉTAGE</small><b>'+etage+'</b></span><span class="itp-pips" title="Ennemis vaincus sur cet étage">'+pips+'</span></div>'+
    '<div class="itp-cadre"><div class="itp-vitre">'+decor+'<div class="itp-ombre"></div>'+avatar+'<span class="itp-braise itp-b1"></span><span class="itp-braise itp-b2"></span><span class="itp-braise itp-b3"></span></div></div>'+
    '<div class="itp-nom"><span class="itp-nom-texte">'+esc(nom)+'</span></div>';
}

function remplir(el){
  el.innerHTML=contenu(Number(el.getAttribute('data-etage'))||0,Number(el.getAttribute('data-kills'))||0,Number(el.getAttribute('data-sur'))||0);
}

function charger(){
  if(roster||chargement||Date.now()-dernierEssai<30000)return;
  chargement=true;dernierEssai=Date.now();
  fetch('/api/idle/media/roster',{cache:'no-cache'}).then(function(r){return r.ok?r.json():null;}).then(function(j){
    chargement=false;
    if(j&&j.ok&&Array.isArray(j.workers)){
      roster=j;
      Array.prototype.forEach.call(document.querySelectorAll('.'+CLASSE),remplir);
    }
  }).catch(function(){chargement=false;});
}

/* HTML de l'arène pour l'état de la tour d (floor, kills, killsOnFloor). */
function html(d){
  charger();
  var etage=Math.max(0,Math.floor(Number(d&&d.floor)||0));
  var kills=Math.max(0,Math.floor(Number(d&&d.kills)||0));
  var sur=Math.max(0,Math.min(9,Math.floor(Number(d&&d.killsOnFloor!=null?d.killsOnFloor:kills%10)||0)));
  return '<section class="itp-arene '+CLASSE+'" data-etage="'+etage+'" data-kills="'+kills+'" data-sur="'+sur+'">'+contenu(etage,kills,sur)+'</section>';
}

window.__SOREAL_IDLE_ITOPOD_SCENE_V1__={html:html,numeroDecor:numeroDecor,indexEnnemi:indexEnnemi};
})();
