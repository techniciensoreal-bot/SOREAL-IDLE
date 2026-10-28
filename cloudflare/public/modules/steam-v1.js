/*
 * SOREAL IDLE — « Ajouter à Steam » (Norman, 2026-10-28) : dans l'application Windows seulement (le pont window.sorealDesktop, desktop/preload.js, n'existe pas dans un navigateur : la section n'apparaît alors pas du tout).
 * Un bouton des Réglages (onglet « Ma partie ») ajoute SOREAL IDLE à la bibliothèque Steam comme jeu non-Steam, sous son nom exact, avec son icône, son affiche, sa capsule et sa bannière.
 * Les images sont composées ICI à partir de la bannière du jeu (la même que l'écran de chargement) : affiche 600 x 900 (le logo en haut, les monstres en dessous), capsule 920 x 430, bannière 1920 x 620. Sans bannière (médias absents) : l'icône du jeu sur le fond bleu nuit.
 * L'application écrit le raccourci et les images dans Steam (desktop/src/steam.mjs) ; Steam doit être fermé.
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_STEAM_V1__)return;

var FOND='#071226';
var etat={charge:false,enCharge:false,info:null,occupe:false,message:'',erreur:false};

function pont(){var d=window.sorealDesktop;return d&&typeof d.steamAjouter==='function'&&typeof d.steamEtat==='function'?d:null;}
function esc(t){return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

var MESSAGES={
  STEAM_ABSENT:'Steam n’a pas été trouvé sur cet ordinateur.',
  STEAM_OUVERT:'Steam est ouvert : ferme-le complètement (clic droit sur son icône près de l’horloge, puis « Quitter Steam »), et réessaie.',
  STEAM_SANS_COMPTE:'Aucun compte Steam n’a été trouvé : connecte-toi une fois à Steam, puis réessaie.',
  SHORTCUTS_ILLISIBLE:'Le fichier des raccourcis de Steam est illisible : rien n’a été modifié.',
  DEVELOPPEMENT:'Disponible seulement dans l’application installée.'
};

function message(texte,erreur){
  etat.message=texte||'';etat.erreur=Boolean(erreur);
  var el=document.getElementById('sorealIdleSteamEtatV1');
  if(el){el.textContent=etat.message;el.style.color=etat.erreur?'#ff9d9d':'#86efac';}
}

function charger(){
  var d=pont();
  if(!d||etat.enCharge)return;
  etat.enCharge=true;
  Promise.resolve(d.steamEtat()).then(function(r){etat.info=r||null;}).catch(function(){etat.info=null;}).then(function(){
    etat.enCharge=false;etat.charge=true;
    var s=document.getElementById('sorealIdleSteamV1');
    if(s)s.outerHTML=sectionHtml();
  });
}

/* Section des Réglages ; vide hors de l'application Windows. */
function sectionHtml(){
  if(!pont())return '';
  if(!etat.charge&&!etat.enCharge)setTimeout(charger,0);
  var i=etat.info,absent=Boolean(i&&i.steam===false);
  var dev=Boolean(i&&i.developpement);
  var libelle=i&&i.dejaAjoute?'🔄 Mettre à jour dans Steam':'🎮 Ajouter à Steam';
  var texte=etat.message||(absent?(dev?MESSAGES.DEVELOPPEMENT:MESSAGES.STEAM_ABSENT):(i&&i.dejaAjoute?'SOREAL IDLE est déjà dans ta bibliothèque Steam.':''));
  return '<div class="soreal-idle-section-v8" id="sorealIdleSteamV1">'+
    '<div class="soreal-idle-window-title-v31">🎮 Steam</div>'+
    '<div style="font-size:14px;color:#8b93ab;margin-bottom:10px">Ajoute SOREAL IDLE à ta bibliothèque Steam comme jeu non-Steam, avec son nom, son icône, son affiche et sa bannière. Steam doit être fermé pendant l’ajout.</div>'+
    '<button type="button" class="soreal-idle-expand-button-v25" onclick="window.__ajouterSteamIdleV1__(this)"'+(absent||etat.occupe?' disabled':'')+'>'+libelle+'</button>'+
    '<div id="sorealIdleSteamEtatV1" style="font-size:14px;color:'+(etat.erreur?'#ff9d9d':'#86efac')+';margin-top:8px">'+esc(texte)+'</div>'+
  '</div>';
}

/* ---------- images ---------- */
function charge(url){
  return fetch(url,{cache:'force-cache'}).then(function(r){if(!r.ok)throw new Error('absent');return r.blob();}).then(function(b){return createImageBitmap(b);});
}
function toile(l,h){var c=document.createElement('canvas');c.width=l;c.height=h;var x=c.getContext('2d');x.fillStyle=FOND;x.fillRect(0,0,l,h);return {c:c,x:x};}
function png(t){return t.c.toDataURL('image/png');}

/* Avec la bannière (3 : 1, le logo à gauche, les monstres au centre et à droite). */
function imagesDepuisBanniere(b){
  var W=b.width,H=b.height;
  var hero=toile(1920,620);
  var ech=Math.max(1920/W,620/H);
  hero.x.drawImage(b,(1920-W*ech)/2,(620-H*ech)/2,W*ech,H*ech);
  var grille=toile(920,430);
  var lg=Math.min(W,Math.round(H*920/430));
  grille.x.drawImage(b,0,0,lg,H,0,0,920,430);
  var portrait=toile(600,900);
  var lp=Math.round(H*600/900),sx=Math.round(W*0.5-lp/2);
  portrait.x.drawImage(b,sx,0,lp,H,0,0,600,900);
  var degrade=portrait.x.createLinearGradient(0,0,0,460);
  degrade.addColorStop(0,'rgba(7,18,38,.96)');degrade.addColorStop(.7,'rgba(7,18,38,.7)');degrade.addColorStop(1,'rgba(7,18,38,0)');
  portrait.x.fillStyle=degrade;portrait.x.fillRect(0,0,600,460);
  /* le logo (la partie gauche de la bannière), en haut de l'affiche */
  var lw=Math.round(W*0.43),lh=Math.round(H*0.78),ly=Math.round(H*0.12);
  /* bords fondus (deux masques, horizontal puis vertical) : le fond sombre du logo ne dessine pas de rectangle sur l'image */
  var lhp=Math.round(540*lh/lw),logo=toile(540,lhp);
  logo.x.clearRect(0,0,540,lhp);
  logo.x.drawImage(b,0,ly,lw,lh,0,0,540,lhp);
  logo.x.globalCompositeOperation='destination-in';
  var mh=logo.x.createLinearGradient(0,0,540,0);
  mh.addColorStop(0,'rgba(0,0,0,0)');mh.addColorStop(.14,'rgba(0,0,0,1)');mh.addColorStop(.86,'rgba(0,0,0,1)');mh.addColorStop(1,'rgba(0,0,0,0)');
  logo.x.fillStyle=mh;logo.x.fillRect(0,0,540,lhp);
  var mv=logo.x.createLinearGradient(0,0,0,lhp);
  mv.addColorStop(0,'rgba(0,0,0,0)');mv.addColorStop(.16,'rgba(0,0,0,1)');mv.addColorStop(.84,'rgba(0,0,0,1)');mv.addColorStop(1,'rgba(0,0,0,0)');
  logo.x.fillStyle=mv;logo.x.fillRect(0,0,540,lhp);
  portrait.x.drawImage(logo.c,30,40);
  return {grille:png(grille),portrait:png(portrait),hero:png(hero)};
}

/* Sans bannière : l'icône du jeu sur le fond du jeu. */
function imagesDepuisIcone(ic){
  function poser(t,l,h,taille){t.x.drawImage(ic,(l-taille)/2,(h-taille)/2,taille,taille);}
  var hero=toile(1920,620);poser(hero,1920,620,560);
  var grille=toile(920,430);poser(grille,920,430,380);
  var portrait=toile(600,900);poser(portrait,600,900,520);
  return {grille:png(grille),portrait:png(portrait),hero:png(hero)};
}

function composer(){
  return charge('/api/idle/media/banner?name=soreal-idle.webp').then(imagesDepuisBanniere,function(){
    return charge('/icons/icon-512.png').then(imagesDepuisIcone);
  });
}

function ajouter(bouton){
  var d=pont();
  if(!d||etat.occupe)return;
  etat.occupe=true;
  if(bouton)bouton.disabled=true;
  message('Préparation des images…',false);
  composer().then(function(art){
    message('Ajout à Steam…',false);
    return d.steamAjouter(art);
  }).then(function(r){
    if(r&&r.ok){
      etat.info=Object.assign({},etat.info||{},{steam:true,dejaAjoute:true});
      message('SOREAL IDLE est ajouté à Steam. Ouvre Steam : le jeu apparaît dans ta bibliothèque, avec son icône et sa bannière.',false);
    }else{
      message(MESSAGES[r&&r.code]||'L’ajout à Steam a échoué.',true);
    }
  }).catch(function(){
    message('L’ajout à Steam a échoué.',true);
  }).then(function(){
    etat.occupe=false;
    if(bouton)bouton.disabled=false;
  });
}

window.__ajouterSteamIdleV1__=ajouter;
window.__SOREAL_IDLE_STEAM_V1__={sectionHtml:sectionHtml,composer:composer,disponible:function(){return Boolean(pont());}};
})();
