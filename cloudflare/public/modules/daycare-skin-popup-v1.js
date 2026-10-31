/*
 * SOREAL IDLE — annonce d'un NOUVEAU CHAT pour la Garderie (Norman, 2026-10-31).
 *
 * À la première connexion où le joueur possède un skin du chat de la Garderie dont il n'a pas encore validé l'annonce, une fenêtre le lui annonce : titre, image du skin,
 * nom, phrase courte et UN SEUL bouton « Cool ». Pas de croix, pas de clic dehors, pas d'Échap : la validation est explicite. Plusieurs skins = une fenêtre après l'autre.
 *
 * Source : j.systemes.daycare.skins.nouveaux (ids POSSÉDÉS et pas encore vus, calculés par le moteur, idle-daycare-skins-v1.js) ; au clic, l'action { action:'daycareSkinVu', id }
 * mémorise « vu » sur le COMPTE (state.records.daycareSkinsVus, règle n°6 : rien seulement sur l’appareil). Anti-spoil (règle n°2) : la fenêtre ne parle jamais d'un skin non possédé, et
 * rien ne s'affiche tant que la Garderie n'est pas débloquée (le titre la nomme).
 *
 * Le bloc est ajouté à <body> (data-morph-garder : le morph de la page ne le retire pas, règle n°4), indépendant du menu ouvert ; les animations sont coupées en mouvement réduit.
 * Dessins : SVG originaux, sans émoji ; polices Bangers (titres) et Russo One (nom).
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_DAYCARE_SKIN_POPUP_V1__)return;

var ID_FOND='gsp-fond-v1';
var NOMS={noeud:'Joli chaton',arcenciel:'Nyankitty',fibonacci:'Chaton Fibonacci',dore:'Chaton Premium',matrix:'Chaton blanc',chauvesouris:'Chaton chauve-souris',tchernobyl:'Chaton Tchernobyl',pirate:'Chaton pirate',noel:'Chaton de Noël',nega:'Chaton Néga'};
var PHRASES={
  noeud:'Ce joli chaton à nœud est à toi.',
  arcenciel:'Ton souhait est exaucé : un chaton arc-en-ciel te rejoint.',
  fibonacci:'Ton atout Fibonacci est au sommet : ce chaton te rejoint.',
  dore:'Tu as rempli tous les jours d’un mois du calendrier de connexion !',
  matrix:'Merci pour ton achat : ce chaton blanc te rejoint.',
  chauvesouris:'Joyeux Halloween ! Ce chaton est à toi pour toujours.',
  tchernobyl:'Tu as trouvé le chat Tchernobyl !',
  pirate:'Tu as vaincu PirateGirl : son chaton pirate te rejoint !',
  noel:'Joyeuses fêtes ! Ce chaton est à toi pour toujours.',
  nega:'Tu as trouvé le chat Néga !'
};
/* Portraits de joueur gagnés (annonce identique, clé "p:<id>") : thème Halloween comme le chat chauve-souris. */
var PORTRAITS={sleepyhollow:{nom:'Portrait d’Halloween',phrase:'Tu as gagné le portrait d’Halloween !',fichier:'PlayerPortrait-SleepyHollow',theme:'chauvesouris'}};
var TITRE_PORTRAIT='Nouveau portrait de joueur !';
var PHRASE_DEFAUT='Un nouveau chaton te rejoint.';
var INDICE='Choisis-le dans la Garderie quand tu veux.';
var TITRE='Nouveau chat pour la Garderie !';
var BOUTON='Cool';

/* Thèmes : couleurs (variables CSS) + décor SVG. Les skins sans thème propre prennent une palette tirée de leur image. */
var THEMES={
  chauvesouris:{cls:'gsp-halloween',bg:'linear-gradient(180deg,#3a1458,#160722 70%,#0d0414)',bord:'#ff7a1a',txt:'#ffe9d2',acc:'#ff9a3c',btnA:'#ffb347',btnB:'#e8590c',btnT:'#2a0d00',glow:'rgba(255,122,26,.5)'},
  noel:{cls:'gsp-noel',bg:'linear-gradient(180deg,#a3142c,#7a0f22 45%,#0f4a2a)',bord:'#f7f7f2',txt:'#fff8f0',acc:'#ffe08a',btnA:'#ffffff',btnB:'#d8e8dc',btnT:'#7a0f22',glow:'rgba(255,255,255,.45)'},
  dore:{cls:'gsp-premium',bg:'linear-gradient(180deg,#1b1608,#0a0905 60%,#000)',bord:'#f0c040',txt:'#fff3c8',acc:'#ffd75e',btnA:'#ffe27a',btnB:'#c8921a',btnT:'#1a1200',glow:'rgba(240,192,64,.55)'},
  tchernobyl:{cls:'gsp-tchernobyl',bg:'linear-gradient(180deg,#0e1a0b,#060b05 70%,#000)',bord:'#f2e600',txt:'#e9ffd9',acc:'#7dff2a',btnA:'#a6ff3d',btnB:'#3fae10',btnT:'#041000',glow:'rgba(125,255,42,.5)'},
  pirate:{cls:'gsp-pirate',bg:'repeating-linear-gradient(90deg,#6b4423 0 38px,#5a381c 38px 40px),#5a381c',bord:'#2b1a0c',txt:'#fff0d4',acc:'#f2c77a',btnA:'#f2c77a',btnB:'#b3752a',btnT:'#2a1606',glow:'rgba(242,199,122,.4)'},
  noeud:{cls:'gsp-simple',bg:'linear-gradient(180deg,#ffd3e6,#f59bc4)',bord:'#d9468f',txt:'#4a1230',acc:'#b3246b',btnA:'#ff8ec1',btnB:'#d9468f',btnT:'#3a0a22',glow:'rgba(217,70,143,.4)'},
  arcenciel:{cls:'gsp-simple',bg:'linear-gradient(180deg,#2a1b5e,#13294d)',bord:'#8fe3ff',txt:'#f0f6ff',acc:'#ffd1f5',btnA:'#a8f0ff',btnB:'#7c8cff',btnT:'#0c1233',glow:'rgba(143,227,255,.45)'},
  fibonacci:{cls:'gsp-simple',bg:'linear-gradient(180deg,#14304a,#0a1826)',bord:'#5fd0ff',txt:'#e9f6ff',acc:'#9fe3ff',btnA:'#8fe0ff',btnB:'#2b8fd1',btnT:'#04121f',glow:'rgba(95,208,255,.4)'},
  matrix:{cls:'gsp-simple',bg:'linear-gradient(180deg,#05150a,#000)',bord:'#25ff6a',txt:'#d6ffe3',acc:'#25ff6a',btnA:'#5dff94',btnB:'#12a843',btnT:'#001a09',glow:'rgba(37,255,106,.45)'},
  nega:{cls:'gsp-nuit',bg:'linear-gradient(180deg,#07070f,#000)',bord:'#ffe45c',txt:'#fff6c9',acc:'#ffe45c',btnA:'#fff08a',btnB:'#e0b814',btnT:'#120e00',glow:'rgba(255,228,92,.45)'}
};
var THEME_DEFAUT=THEMES.nega;

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}

/* ----- Décors SVG originaux (aria-hidden) ----- */
function svg(w,h,corps,cls){return '<svg class="gsp-d '+cls+'" viewBox="0 0 '+w+' '+h+'" width="'+w+'" height="'+h+'" aria-hidden="true" focusable="false">'+corps+'</svg>';}
function citrouille(cls){
  return svg(64,56,'<ellipse cx="32" cy="34" rx="28" ry="20" fill="#f77f00"/><ellipse cx="18" cy="34" rx="12" ry="19" fill="#e8590c"/><ellipse cx="46" cy="34" rx="12" ry="19" fill="#e8590c"/><ellipse cx="32" cy="34" rx="9" ry="20" fill="#ff9a3c"/><path d="M30 15c0-6 3-9 8-10 0 3-1 6-4 10z" fill="#3a7d1e"/><path d="M20 30l6 4-7 1zM44 30l-6 4 7 1zM22 42q10 8 20 0-4 3-10 3t-10-3z" fill="#2a0d00"/>',cls);
}
function toile(cls){
  return svg(90,90,'<g fill="none" stroke="#e8dff5" stroke-width="1.6" stroke-linecap="round"><path d="M0 0L90 90M0 30L60 90M30 0L90 60M0 60L30 90M60 0L90 30"/><path d="M0 22Q22 22 22 0M0 44Q44 44 44 0M0 66Q66 66 66 0"/></g><circle cx="52" cy="50" r="5" fill="#e8dff5"/><g stroke="#e8dff5" stroke-width="1.6" stroke-linecap="round"><path d="M47 48l-6-5M47 52l-6 5M57 48l6-5M57 52l6 5"/></g>',cls);
}
function flocon(cls,taille){
  var t=taille||28;
  return svg(40,40,'<g stroke="#ffffff" stroke-width="3" stroke-linecap="round" fill="none"><path d="M20 3v34M4 11l32 18M36 11L4 29"/><path d="M15 6l5 5 5-5M15 34l5-5 5 5M5 17l7 1-1-7M35 23l-7-1 1 7M5 23l7-1-1 7M35 17l-7 1 1-7" stroke-width="2"/></g>',cls).replace('width="40" height="40"','width="'+t+'" height="'+t+'"');
}
function guirlande(){
  var ampoules='',cols=['#ff4d5a','#ffd23f','#5fe08a','#6cc4ff'],i;
  for(i=0;i<9;i++)ampoules+='<circle cx="'+(18+i*38)+'" cy="'+(14+(i%2)*6)+'" r="6" fill="'+cols[i%4]+'" class="gsp-amp gsp-amp'+(i%4)+'"/>';
  return svg(360,30,'<path d="M0 6Q45 20 90 10T180 10T270 10T360 8" fill="none" stroke="#1a0a0a" stroke-width="2.4"/>'+ampoules,'gsp-guirlande');
}
function etoile(cls,taille,couleur){
  var t=taille||20;
  return svg(24,24,'<path d="M12 1.5l3 7 7.5.7-5.7 5 1.8 7.4L12 17.7l-6.6 3.9 1.8-7.4-5.7-5L9 8.5z" fill="'+(couleur||'#ffd75e')+'"/>',cls).replace('width="24" height="24"','width="'+t+'" height="'+t+'"');
}
function radiation(cls){
  return svg(64,64,'<circle cx="32" cy="32" r="30" fill="#f2e600" stroke="#000" stroke-width="3"/><g fill="#000"><path d="M32 32L14 17A28 28 0 0 1 50 17z" transform="rotate(0 32 32)"/><path d="M32 32L14 17A28 28 0 0 1 50 17z" transform="rotate(120 32 32)"/><path d="M32 32L14 17A28 28 0 0 1 50 17z" transform="rotate(240 32 32)"/></g><circle cx="32" cy="32" r="6" fill="#f2e600" stroke="#000" stroke-width="3"/>',cls);
}
function drapeau(cls){
  return svg(70,90,'<rect x="6" y="4" width="5" height="82" rx="2" fill="#2b1a0c"/><path d="M11 8q20-8 30 0t26 0v38q-14 8-26 0t-30 0z" fill="#16120f" stroke="#2b1a0c" stroke-width="2"/><g stroke="#f4ecd8" stroke-width="3.2" stroke-linecap="round"><path d="M28 20l22 18M50 20L28 38"/></g><circle cx="39" cy="29" r="7" fill="#f4ecd8"/><circle cx="36.500" cy="28" r="1.800" fill="#16120f"/><circle cx="41.500" cy="28" r="1.800" fill="#16120f"/>',cls);
}
function corde(){
  return svg(360,10,'<path d="M0 5Q15 0 30 5T60 5T90 5T120 5T150 5T180 5T210 5T240 5T270 5T300 5T330 5T360 5" fill="none" stroke="#d9b97a" stroke-width="5" stroke-linecap="round" stroke-dasharray="9 3"/>','gsp-corde');
}
function croissant(cls,t){
  return svg(40,40,'<path d="M27 4A17 17 0 1 0 36 28 14 14 0 0 1 27 4z" fill="#ffe45c"/>',cls).replace('width="40" height="40"','width="'+t+'" height="'+t+'"');
}
function decor(id){
  if(id==='nega')return croissant('gsp-d-lune',54)+croissant('gsp-d-cr2',22)+etoile('gsp-d-n1',18,'#ffe45c')+etoile('gsp-d-n2',12,'#fff6c9')+etoile('gsp-d-n3',16,'#ffe45c')+etoile('gsp-d-n4',11,'#fff6c9')+etoile('gsp-d-n5',14,'#ffe45c');
  if(id==='chauvesouris')return toile('gsp-d-hg')+citrouille('gsp-d-bg')+citrouille('gsp-d-bd');
  if(id==='noel')return guirlande()+flocon('gsp-d-f1',26)+flocon('gsp-d-f2',20)+flocon('gsp-d-f3',30)+flocon('gsp-d-f4',18);
  if(id==='dore')return etoile('gsp-d-e1',26)+etoile('gsp-d-e2',16)+etoile('gsp-d-e3',20)+etoile('gsp-d-e4',14)+'<div class="gsp-badge">PREMIUM</div>';
  if(id==='tchernobyl')return '<div class="gsp-bande gsp-bande-h"></div><div class="gsp-bande gsp-bande-b"></div>'+radiation('gsp-d-rad1')+radiation('gsp-d-rad2');
  if(id==='pirate')return corde()+drapeau('gsp-d-flag');
  return '';
}

function styles(){
  if(document.getElementById('gsp-style-v1'))return;
  var s=document.createElement('style');s.id='gsp-style-v1';
  s.textContent=
    '.gsp-fond{position:fixed;inset:0;z-index:100001;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;background:rgba(4,4,12,.78);backdrop-filter:blur(3px)}'+
    '.gsp-carte{position:relative;overflow:hidden;width:min(400px,100%);max-height:calc(100dvh - 24px);overflow-y:auto;box-sizing:border-box;padding:26px 20px 20px;border-radius:16px;text-align:center;color:var(--gsp-txt);background:var(--gsp-bg);border:4px solid var(--gsp-bord);box-shadow:0 0 0 3px #000,0 0 44px var(--gsp-glow);animation:gspEntree .35s ease-out both}'+
    '.gsp-carte>*:not(.gsp-d):not(.gsp-badge):not(.gsp-bande){position:relative;z-index:2}'+
    '.gsp-titre{margin:0 0 10px;font-family:Bangers,"Comic Sans MS",cursive;font-weight:400;font-size:30px;line-height:1.05;letter-spacing:1.5px;color:var(--gsp-acc);text-shadow:2px 2px 0 #000}'+
    '.gsp-cadre{display:flex;justify-content:center;margin:6px auto 8px}'+
    '.gsp-img{display:block;width:min(46vw,180px);max-height:34dvh;height:auto;object-fit:contain;filter:drop-shadow(0 6px 10px rgba(0,0,0,.55));animation:gspFlotte 3.2s ease-in-out infinite}'+
    '.gsp-portrait{width:min(40vw,170px);border-radius:14px;border:3px solid var(--gsp-bord);box-sizing:border-box;image-rendering:auto}.gsp-nom{margin:4px 0 6px;font-family:"Russo One",Bangers,sans-serif;font-size:21px;letter-spacing:.5px;color:var(--gsp-acc);text-shadow:1px 1px 0 #000}'+
    '.gsp-phrase{margin:6px 0;font-family:"Comic Neue","Comic Sans MS",sans-serif;font-weight:700;font-size:16px;line-height:1.35}'+
    '.gsp-indice{margin:6px 0 14px;font-size:13.500px;opacity:.82}'+
    '.gsp-bouton{min-width:170px;padding:11px 26px;border:3px solid #000;border-radius:10px;font-family:Bangers,"Comic Sans MS",cursive;font-size:24px;letter-spacing:1.5px;color:var(--gsp-btnT);background:linear-gradient(180deg,var(--gsp-btnA),var(--gsp-btnB));box-shadow:0 4px 0 #000;cursor:pointer}'+
    '.gsp-bouton:focus-visible{outline:4px solid #fff;outline-offset:3px}'+
    '.gsp-bouton:active{transform:translateY(3px);box-shadow:0 1px 0 #000}'+
    '.gsp-d{position:absolute;z-index:1;pointer-events:none}'+
    /* Halloween */
    '.gsp-d-hg{left:0;top:0;width:96px;height:96px;opacity:.85}.gsp-d-bg{left:8px;bottom:6px;width:60px;height:auto;z-index:3}.gsp-d-bd{right:8px;bottom:6px;width:60px;height:auto;z-index:3;transform:scaleX(-1)}'+
    '.gsp-halloween .gsp-carte,.gsp-halloween.gsp-carte{box-shadow:0 0 0 3px #000,0 0 44px var(--gsp-glow),inset 0 0 40px rgba(255,122,26,.18)}'+
    '.gsp-halloween .gsp-d-bg{animation:gspSaut 2.6s ease-in-out infinite}.gsp-halloween .gsp-d-bd{animation:gspSautMiroir 2.6s ease-in-out -1.3s infinite}'+
    /* Noël */
    '.gsp-guirlande{left:0;top:0;width:100%;height:30px}.gsp-amp{animation:gspAmp 1.6s ease-in-out infinite}.gsp-amp1{animation-delay:-.4s}.gsp-amp2{animation-delay:-.8s}.gsp-amp3{animation-delay:-1.2s}'+
    '.gsp-d-f1{left:10px;top:48px;animation:gspNeige 7s linear infinite}.gsp-d-f2{right:14px;top:70px;animation:gspNeige 9s linear -3s infinite}.gsp-d-f3{left:18px;bottom:46px;animation:gspNeige 8s linear -5s infinite}.gsp-d-f4{right:20px;bottom:64px;animation:gspNeige 6s linear -2s infinite}'+
    '.gsp-noel .gsp-titre{padding-top:14px}'+
    /* Premium */
    '.gsp-d-e1{left:14px;top:16px;animation:gspBrille 2.4s ease-in-out infinite}.gsp-d-e2{right:22px;top:30px;animation:gspBrille 2.4s ease-in-out -.8s infinite}.gsp-d-e3{left:26px;bottom:70px;animation:gspBrille 2.4s ease-in-out -1.6s infinite}.gsp-d-e4{right:16px;bottom:96px;animation:gspBrille 2.4s ease-in-out -.4s infinite}'+
    '.gsp-badge{position:absolute;z-index:2;top:10px;left:50%;transform:translateX(-50%);padding:2px 12px;border:2px solid #000;border-radius:999px;font-family:"Russo One",sans-serif;font-size:11px;letter-spacing:3px;color:#1a1200;background:linear-gradient(180deg,#ffe27a,#c8921a)}'+
    '.gsp-premium .gsp-titre{padding-top:20px}'+
    /* Tchernobyl */
    '.gsp-bande{position:absolute;left:0;right:0;height:12px;z-index:1;background:repeating-linear-gradient(-45deg,#f2e600 0 14px,#000 14px 28px)}.gsp-bande-h{top:0}.gsp-bande-b{bottom:0}'+
    '.gsp-d-rad1{left:8px;top:132px;width:46px;height:46px;animation:gspTourne 9s linear infinite}.gsp-d-rad2{right:8px;bottom:22px;width:38px;height:38px;animation:gspTourne 12s linear reverse infinite}'+
    '.gsp-tchernobyl .gsp-titre{padding-top:12px;text-shadow:0 0 12px rgba(125,255,42,.8),2px 2px 0 #000}.gsp-tchernobyl .gsp-phrase{padding-bottom:6px}'+
    '.gsp-tchernobyl .gsp-img{filter:drop-shadow(0 0 14px rgba(125,255,42,.65))}'+
    /* Nuit étoilée */
    '.gsp-d-lune{right:14px;top:12px;filter:drop-shadow(0 0 10px rgba(255,228,92,.7))}.gsp-d-cr2{left:16px;bottom:78px;transform:rotate(-30deg);opacity:.9}'+
    '.gsp-d-n1{left:18px;top:20px;animation:gspBrille 2.6s ease-in-out infinite}.gsp-d-n2{left:70px;top:58px;animation:gspBrille 2.6s ease-in-out -.9s infinite}.gsp-d-n3{right:24px;bottom:96px;animation:gspBrille 2.6s ease-in-out -1.7s infinite}.gsp-d-n4{right:70px;top:76px;animation:gspBrille 2.6s ease-in-out -.4s infinite}.gsp-d-n5{left:26px;bottom:28px;animation:gspBrille 2.6s ease-in-out -2.1s infinite}'+
    '.gsp-nuit .gsp-titre{padding-top:14px;padding-right:44px;text-shadow:0 0 12px rgba(255,228,92,.6),2px 2px 0 #000}'+
    /* Pirate */
    '.gsp-corde{left:0;top:6px;width:100%;height:10px}.gsp-d-flag{right:6px;top:14px;width:52px;height:auto;transform-origin:11px 4px;animation:gspDrapeau 2.4s ease-in-out infinite}'+
    '.gsp-pirate .gsp-carte,.gsp-pirate.gsp-carte{border-style:solid;border-color:#2b1a0c;box-shadow:0 0 0 3px #000,0 0 30px var(--gsp-glow),inset 0 0 0 4px #8a5a2b}.gsp-pirate .gsp-titre{padding-top:10px;text-shadow:2px 2px 0 #000}'+
    '.gsp-pirate .gsp-phrase,.gsp-pirate .gsp-indice{text-shadow:1px 1px 0 rgba(0,0,0,.7)}'+
    '@keyframes gspEntree{from{opacity:0;transform:translateY(14px) scale(.96)}to{opacity:1;transform:none}}'+
    '@keyframes gspFlotte{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}'+
    '@keyframes gspSaut{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}'+
    '@keyframes gspSautMiroir{0%,100%{transform:scaleX(-1) translateY(0)}50%{transform:scaleX(-1) translateY(-6px)}}'+
    '@keyframes gspAmp{0%,100%{opacity:1}50%{opacity:.35}}'+
    '@keyframes gspNeige{0%{opacity:0;transform:translateY(-8px) rotate(0)}12%{opacity:.9}88%{opacity:.9}100%{opacity:0;transform:translateY(34px) rotate(120deg)}}'+
    '@keyframes gspBrille{0%{opacity:0;transform:scale(.4) rotate(0)}50%{opacity:1;transform:scale(1) rotate(45deg)}100%{opacity:0;transform:scale(.4) rotate(90deg)}}'+
    '@keyframes gspTourne{from{transform:rotate(0)}to{transform:rotate(360deg)}}'+
    '@keyframes gspDrapeau{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(5deg)}}'+
    '@media (max-width:420px){.gsp-titre{font-size:25px}.gsp-nom{font-size:18px}.gsp-phrase{font-size:15px}.gsp-img{width:min(44vw,150px)}.gsp-d-bg,.gsp-d-bd{width:44px}.gsp-d-hg{width:70px;height:70px}}'+
    '@media (prefers-reduced-motion:reduce){.gsp-carte,.gsp-img,.gsp-d,.gsp-amp{animation:none!important}.gsp-d-f1,.gsp-d-f2,.gsp-d-f3,.gsp-d-f4{opacity:.8}.gsp-d-e1,.gsp-d-e2,.gsp-d-e3,.gsp-d-e4,.gsp-d-n1,.gsp-d-n2,.gsp-d-n3,.gsp-d-n4,.gsp-d-n5{opacity:1}}';
  document.head.appendChild(s);
}

var courant='';          /* id affiché */
var valides={};          /* ids validés ici, en attente de la réponse du serveur */
var dernierFocus=null;

function lireEtat(){try{return typeof window.__SOREAL_IDLE_LIRE_ETAT_V1__==='function'?window.__SOREAL_IDLE_LIRE_ETAT_V1__():null;}catch(_e){return null;}}

function garderieDisponible(etat){
  try{var g=window.__SOREAL_IDLE_DAYCARE_PAGE_V1__;return Boolean(g&&typeof g.disponible==='function'&&g.disponible(etat));}catch(_e){return false;}
}

function nouveaux(etat){
  var d=etat&&etat.systemes&&etat.systemes.daycare,l=d&&d.skins&&d.skins.nouveaux,p=d&&d.skins&&d.skins.possedes;
  if(!Array.isArray(l)||!Array.isArray(p))return [];
  return l.filter(function(id){return typeof id==='string'&&NOMS[id]&&p.indexOf(id)>=0&&!valides[id];});
}

function htmlPortrait(id){
  var pt=PORTRAITS[id],th=THEMES[pt.theme];
  return '<div class="gsp-carte '+th.cls+'" style="--gsp-bg:'+th.bg+';--gsp-bord:'+th.bord+';--gsp-txt:'+th.txt+';--gsp-acc:'+th.acc+';--gsp-btnA:'+th.btnA+';--gsp-btnB:'+th.btnB+';--gsp-btnT:'+th.btnT+';--gsp-glow:'+th.glow+'">'+
    decor(pt.theme)+
    '<h2 class="gsp-titre" id="gsp-titre-v1">'+esc(TITRE_PORTRAIT)+'</h2>'+
    '<div class="gsp-cadre"><img class="gsp-img gsp-portrait" src="/api/idle/media/player?portrait='+encodeURIComponent(pt.fichier)+'" alt="'+esc(pt.nom)+'" decoding="async"></div>'+
    '<div class="gsp-nom">'+esc(pt.nom)+'</div>'+
    '<p class="gsp-phrase">'+esc(pt.phrase)+'</p>'+
    '<button type="button" class="gsp-bouton" data-gsp-cool="1">'+esc(BOUTON)+'</button>'+
  '</div>';
}

function html(id){
  if(id.indexOf('p:')===0&&PORTRAITS[id.slice(2)])return htmlPortrait(id.slice(2));
  var th=THEMES[id]||THEME_DEFAUT;
  var phrase=PHRASES[id]||PHRASE_DEFAUT;
  return '<div class="gsp-carte '+th.cls+'" style="--gsp-bg:'+th.bg+';--gsp-bord:'+th.bord+';--gsp-txt:'+th.txt+';--gsp-acc:'+th.acc+';--gsp-btnA:'+th.btnA+';--gsp-btnB:'+th.btnB+';--gsp-btnT:'+th.btnT+';--gsp-glow:'+th.glow+'">'+
    decor(id)+
    '<h2 class="gsp-titre" id="gsp-titre-v1">'+esc(TITRE)+'</h2>'+
    '<div class="gsp-cadre"><img class="gsp-img" src="/api/idle/media/garderie-skin?id='+encodeURIComponent(id)+'" alt="'+esc(NOMS[id])+'" decoding="async"></div>'+
    '<div class="gsp-nom">'+esc(NOMS[id])+'</div>'+
    '<p class="gsp-phrase">'+esc(phrase)+'</p>'+
    '<p class="gsp-indice">'+esc(INDICE)+'</p>'+
    '<button type="button" class="gsp-bouton" data-gsp-cool="1">'+esc(BOUTON)+'</button>'+
  '</div>';
}

function fermer(){
  var f=document.getElementById(ID_FOND);
  if(f&&f.parentNode)f.parentNode.removeChild(f);
  courant='';
  if(dernierFocus&&typeof dernierFocus.focus==='function'){try{dernierFocus.focus();}catch(_e){}}
  dernierFocus=null;
}

function valider(){
  var id=courant;
  if(!id)return;
  valides[id]=true;
  fermer();
  try{if(typeof window.__actionMetaIdleV130__==='function')window.__actionMetaIdleV130__(id.indexOf('p:')===0?{action:'portraitVu',id:id.slice(2)}:{action:'daycareSkinVu',id:id});}catch(_e){}
  /* Le suivant (s'il y en a un) arrive à la prochaine vérification : un popup après l'autre. */
  setTimeout(essayer,350);
}

function ouvrir(id){
  styles();
  var f=document.createElement('div');
  f.id=ID_FOND;f.className='gsp-fond';
  f.setAttribute('data-morph-garder','1');
  f.setAttribute('role','dialog');f.setAttribute('aria-modal','true');f.setAttribute('aria-labelledby','gsp-titre-v1');
  f.innerHTML=html(id);
  /* Pas de fermeture hors du bouton « Cool » : ni clic dehors, ni Échap, ni croix. Tab reste sur le seul bouton. */
  f.addEventListener('click',function(e){
    var t=e.target;
    if(t&&t.closest&&t.closest('[data-gsp-cool]'))valider();
  });
  f.addEventListener('keydown',function(e){
    if(e.key==='Tab'){e.preventDefault();var b=f.querySelector('[data-gsp-cool]');if(b)b.focus();}
  });
  dernierFocus=document.activeElement&&document.activeElement!==document.body?document.activeElement:null;
  courant=id;
  document.body.appendChild(f);
  var b=f.querySelector('[data-gsp-cool]');
  if(b){try{b.focus();}catch(_e){}}
}

function autreFenetreOuverte(){
  return Boolean(document.querySelector('.soreal-idle-tuto-flottant-v1,.soreal-idle-modal-v63,.soreal-idle-histoire-plein-ecran-v1,[role="dialog"]:not(#'+ID_FOND+')'));
}

function nouveauxPortraits(etat){
  var p=etat&&etat.systemes&&etat.systemes.portraits,l=p&&p.nouveaux;
  if(!Array.isArray(l))return [];
  return l.filter(function(id){return typeof id==='string'&&PORTRAITS[id]&&!valides['p:'+id];}).map(function(id){return 'p:'+id;});
}

function essayer(){
  if(document.hidden)return;
  if(courant){
    /* Déjà affiché : si le bloc a disparu (page remplacée), on le remet ; sinon rien. */
    if(!document.getElementById(ID_FOND)){var id=courant;courant='';ouvrir(id);}
    return;
  }
  var etat=lireEtat();
  if(!etat)return;
  /* Chats (si la Garderie est débloquée) puis portraits : jamais en même temps. Le portrait est un cadeau : annoncé quoi qu'il en soit. */
  var liste=(garderieDisponible(etat)?nouveaux(etat):[]).concat(nouveauxPortraits(etat));
  if(!liste.length||autreFenetreOuverte())return;
  ouvrir(liste[0]);
}

if(typeof setInterval==='function')setInterval(essayer,1500);

window.__SOREAL_IDLE_DAYCARE_SKIN_POPUP_V1__={essayer:essayer,html:html,noms:NOMS,phrases:PHRASES,themes:THEMES,portraits:PORTRAITS,ouvrir:ouvrir,valider:valider};
})();
