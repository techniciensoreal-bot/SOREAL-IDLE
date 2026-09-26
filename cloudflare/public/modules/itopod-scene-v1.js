/*
 * SOREAL IDLE — scène de l'ITOPOD (Norman, 2026-09-26) : les ennemis portent les prénoms des ouvriers et leur avatar ; le décor est l'un des décors
 * « Level 1 » à « Level 6 » de l'équipe, selon le palier de la tour. Voir src/idle-itopod-roster-v1.js (liste des ouvriers, lue par le serveur sur
 * SOREAL TV : elle grandit toute seule avec l'équipe ; Norman et Sébastien y sont toujours).
 *
 * La scène est purement visuelle : le combat de la tour est calculé par le serveur (par lots, hors ligne compris). L'ennemi affiché est choisi de
 * façon déterministe d'après le nombre total d'ennemis vaincus, donc stable d'un rendu à l'autre.
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_ITOPOD_SCENE_V1__)return;

var CLASSE='soreal-idle-itopod-scene-v1';
var roster=null;      /* {workers:[{nom,avatar}], decors:{1..6:[cle]}} */
var chargement=false;
var dernierEssai=0;

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function urlImage(cle){return '/api/idle/media/shared?key='+encodeURIComponent(cle);}

/* Palier de la tour : 50 étages chacun (1 à 32) ; les 32 paliers se répartissent sur les 6 Levels de décors. */
function palier(etage){return Math.max(1,Math.floor(Math.max(0,etage)/50)+1);}
function niveauDecor(etage){return Math.min(6,Math.floor((palier(etage)-1)*6/32)+1);}

function pgcd(a,b){while(b){var t=b;b=a%b;a=t;}return a;}
/* Ennemi n° kills : un pas premier avec la taille de la liste, pour ne jamais retomber sur le même nom deux fois de suite. */
function indexEnnemi(n,kills,etage){
  if(n<=1)return 0;
  var pas=[7,11,13,17,19,23,29,31,37].filter(function(p){return pgcd(p,n)===1;})[0]||1;
  return ((Math.max(0,kills)*pas)+Math.max(0,etage)*3)%n;
}

function decorPour(etage){
  if(!roster||!roster.decors)return '';
  var niveau=niveauDecor(etage);
  /* Si ce Level n'a pas (encore) de décor, on prend le plus proche disponible. */
  for(var d=0;d<6;d++){
    var choix=[niveau-d,niveau+d];
    for(var i=0;i<choix.length;i++){
      var liste=roster.decors[choix[i]];
      if(Array.isArray(liste)&&liste.length)return liste[(palier(etage)-1)%liste.length];
    }
  }
  return '';
}

function contenu(etage,kills,killsSurEtage){
  var n=roster&&Array.isArray(roster.workers)?roster.workers.length:0;
  var ennemi=n?roster.workers[indexEnnemi(n,kills,etage)]:null;
  var fond=decorPour(etage);
  var nom=ennemi?ennemi.nom:'Pissed Off Dude';
  var avatar=ennemi&&ennemi.avatar
    ?'<img src="'+esc(urlImage(ennemi.avatar))+'" alt="" width="104" height="104" style="width:104px;height:104px;object-fit:cover;border-radius:18px;border:2px solid rgba(255,255,255,.55);box-shadow:0 8px 22px rgba(0,0,0,.5)" onerror="this.outerHTML=\'<div style=&quot;font-size:64px&quot;>😠</div>\'">'
    :'<div style="font-size:64px;line-height:1">😠</div>';
  return '<div class="fond" style="position:absolute;inset:0;background:'+(fond?'url('+esc(urlImage(fond))+') center/cover no-repeat':'linear-gradient(135deg,#1f2b45,#111a2e)')+'"></div>'+
    '<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(6,10,20,0) 35%,rgba(6,10,20,.7))"></div>'+
    '<div style="position:relative;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:7px;min-height:190px;padding:14px 10px 10px">'+
      avatar+
      '<div style="padding:3px 14px;border-radius:999px;background:rgba(10,16,30,.82);border:1px solid rgba(255,255,255,.25);font-weight:800;font-size:16px;color:#fff">'+esc(nom)+'</div>'+
      '<div style="font-size:12px;color:#dce5f3;text-shadow:0 1px 3px #000">Étage '+etage+' · palier '+palier(etage)+' · ennemi '+(killsSurEtage+1)+' / 10</div>'+
    '</div>';
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

/* HTML de la scène pour l'état de la tour d (floor, kills, killsOnFloor). */
function html(d){
  charger();
  var etage=Math.max(0,Math.floor(Number(d&&d.floor)||0));
  var kills=Math.max(0,Math.floor(Number(d&&d.kills)||0));
  var sur=Math.max(0,Math.min(9,Math.floor(Number(d&&d.killsOnFloor!=null?d.killsOnFloor:kills%10)||0)));
  return '<div class="'+CLASSE+'" data-etage="'+etage+'" data-kills="'+kills+'" data-sur="'+sur+'" style="position:relative;overflow:hidden;border-radius:16px;margin-bottom:12px;border:1px solid rgba(255,255,255,.14);background:#111a2e">'+
    contenu(etage,kills,sur)+'</div>';
}

window.__SOREAL_IDLE_ITOPOD_SCENE_V1__={html:html,palier:palier,niveauDecor:niveauDecor,indexEnnemi:indexEnnemi};
})();
