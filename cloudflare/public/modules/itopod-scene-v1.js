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

/*
 * Décor AU HASARD parmi tous ceux de shared/avatar-backgrounds/ (Norman, 2026-10-04 : « tu dois utiliser des décors au hasard présents dans soreal/shared/avatar-backgrounds/ »), tous Levels confondus. Le choix dépend du
 * numéro de l'ennemi vaincu (donc stable d'un rendu à l'autre) mais d'un tirage mélangé : jamais deux fois le même décor de suite.
 */
function tousLesDecors(){
  var sortie=[];
  if(roster&&roster.decors){
    Object.keys(roster.decors).sort().forEach(function(niveau){
      (roster.decors[niveau]||[]).forEach(function(cle){sortie.push(cle);});
    });
  }
  return sortie;
}
function melange(n){
  n=Math.imul((n^61)^(n>>>16),9);
  n=n^(n>>>4);
  n=Math.imul(n,0x27d4eb2d);
  n=n^(n>>>15);
  return n>>>0;
}
/* Tirage sans répétition : les décors passent par « rondes » (chaque décor une fois par ronde, dans un ordre mélangé différent à chaque ronde) ; le premier d'une ronde n'est jamais le dernier de la précédente. */
function permutation(n,ronde){
  var t=[],i,j,x;
  for(i=0;i<n;i++)t.push(i);
  var g=melange(Math.imul(ronde+1,2654435761)+12345);
  for(i=n-1;i>0;i--){
    g=melange(g+i);
    j=g%(i+1);
    x=t[i];t[i]=t[j];t[j]=x;
  }
  return t;
}
function indexDecor(n,kills){
  if(n<=1)return 0;
  var k=Math.max(0,Math.floor(Number(kills)||0));
  if(n===2)return k%2;
  var ronde=Math.floor(k/n),pos=k%n;
  var perm=permutation(n,ronde);
  var dernierPrecedent=ronde>0?permutation(n,ronde-1)[n-1]:-1;
  if(perm[0]===dernierPrecedent){var x=perm[0];perm[0]=perm[1];perm[1]=x;}
  return perm[pos];
}
function decorAuHasard(etage,kills){
  var liste=tousLesDecors();
  return liste.length?liste[indexDecor(liste.length,kills)]:'';
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
  var fond=decorAuHasard(etage,kills)||decorPour(etage);
  var nom=ennemi?ennemi.nom:'Pissed Off Dude';
  /* Avatar de l'ouvrier ou du responsable : taille proportionnelle au cadre (ni trop petit, ni trop grand). */
  var avatar=ennemi&&ennemi.avatar
    ?'<img src="'+esc(urlImage(ennemi.avatar))+'" alt="" style="flex:0 0 auto;width:42%;max-width:112px;min-width:72px;aspect-ratio:1/1;object-fit:cover;border-radius:16px;border:2px solid rgba(255,255,255,.6);box-shadow:0 8px 22px rgba(0,0,0,.55);background:#1b2742" onerror="this.style.display=\'none\'">'
    :'<div style="flex:0 0 auto;font-size:64px;line-height:1">😠</div>';
  /* Le cadre prend la forme du décor : les décors de l'équipe sont des portraits (rapport 0,67 à 0,8), l'image donne donc sa hauteur ; largeur du cadre ≤ 260 px, soit environ 330 à 390 px de haut : ni trop petit, ni trop grand. Sans décor : un fond uni de hauteur raisonnable. */
  var image=fond
    ?'<img class="fond" src="'+esc(urlImage(fond))+'" alt="" style="display:block;width:100%;height:auto;max-height:420px;min-height:150px;object-fit:cover;background:#111a2e" onerror="this.style.visibility=\'hidden\'">'
    :'<div class="fond" style="min-height:220px;background:linear-gradient(135deg,#1f2b45,#111a2e)"></div>';
  return image+
    '<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(6,10,20,0) 40%,rgba(6,10,20,.78))"></div>'+
    '<div style="position:absolute;left:0;right:0;bottom:0;display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px 10px">'+
      avatar+
      '<div style="min-width:0;max-width:100%;display:flex;flex-direction:column;gap:3px;align-items:center">'+
        '<div style="padding:3px 14px;border-radius:999px;background:rgba(10,16,30,.85);border:1px solid rgba(255,255,255,.28);font-weight:800;font-size:17px;color:#fff;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(nom)+'</div>'+
        '<div style="font-size:13px;color:#dce5f3;text-shadow:0 1px 3px #000">Étage '+etage+' · ennemi '+(killsSurEtage+1)+' / 10</div>'+
      '</div>'+
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
  return '<div class="'+CLASSE+'" data-etage="'+etage+'" data-kills="'+kills+'" data-sur="'+sur+'" style="position:relative;overflow:hidden;width:100%;max-width:260px;margin:0 auto 12px;border-radius:16px;border:2px solid rgba(255,255,255,.2);box-shadow:0 10px 28px rgba(0,0,0,.45);background:#111a2e">'+
    contenu(etage,kills,sur)+'</div>';
}

window.__SOREAL_IDLE_ITOPOD_SCENE_V1__={html:html,palier:palier,niveauDecor:niveauDecor,indexEnnemi:indexEnnemi,indexDecor:indexDecor};
})();
