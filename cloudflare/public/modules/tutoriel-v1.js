/*
 * SOREAL IDLE — tutoriel éditable (Norman, 2026-10-14) : les guides sont créés dans le menu Admin (modules/admin-tutoriel-v1.js), stockés côté serveur (idle-tutoriel-v1.js) et joués ici.
 *
 * Une fenêtre flottante, indépendante du rendu de page (un <div> ajouté à document.body, jamais recréé pendant un guide), se pose à côté de l'élément montré par l'étape, qui est entouré d'un cadre
 * lumineux. Elle ne bloque PAS la page : le joueur peut cliquer sur l'élément montré. Placement : auto (le côté où il y a de la place), haut, bas, gauche, droite ou centre.
 * La cible est un sélecteur CSS choisi dans le jeu par « Placer sur l'écran » (choisirElement) ; elle est cherchée à chaque instant, car le jeu redessine souvent ses pages.
 *
 * Déclencheurs : début du jeu (nouveau joueur), première ouverture d'un menu, boss vaincu. Mémoire « vu » côté serveur (profil.stats.vus) : un guide ne se rejoue pas, sauf en aperçu.
 * Anti-spoil (AGENTS.md règle n°2) : le client ne demande que les guides du menu OUVERT ; le serveur ne renvoie que ceux du déclencheur demandé, jamais la liste complète.
 * L'ancien tutoriel (fenêtres de Norman & Sébastien et popups de première ouverture) reste joué tant que l'administrateur ne l'a pas désactivé : ancienPermis() le dit au jeu.
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_TUTORIEL_V1__)return;

var ID='sorealIdleTutorielV1';
var ID_CADRE='sorealIdleTutorielCadreV1';
var ID_STYLE='sorealIdleTutorielStyleV1';
var CLASSE_NOIR='soreal-lhu-boss-noir';
var ID_PICKER='sorealIdleTutorielPickerV1';
/* Étape « avance au clic » : le bouton Suivant revient après ce délai si le clic est impossible (jamais bloquant). */
var DELAI_SUIVANT_MS=30000;

var etat={ancienActif:null,ancienMenus:null,initEnCours:false,demandes:{},enCours:null};
var boucle=0;

function esc_(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function appel_(nom,args){
  var f=window.__SOREAL_IDLE_CALL_V1__;
  if(typeof f!=='function')return Promise.reject(new Error('Connexion au jeu indisponible.'));
  return Promise.resolve(f(nom,args));
}
function bienvenueFaite_(){
  try{var f=window.__soreal_idle_vu_connu_v1__;return typeof f==='function'?Boolean(f('bienvenue')):true;}catch(_e){return true;}
}
function dejaVu_(j,vuId){
  try{var vus=j&&j.profil&&j.profil.stats&&j.profil.stats.vus;return Array.isArray(vus)&&vus.indexOf(vuId)!==-1;}catch(_e){return false;}
}
function marquerVu_(vuId){
  try{if(vuId&&typeof window.__soreal_idle_marquer_vu_v1__==='function')window.__soreal_idle_marquer_vu_v1__(vuId);}catch(_e){}
}
function menuActif_(){
  var r=document.querySelector('.soreal-idle-page-root-v28[data-menu]');
  return r?String(r.getAttribute('data-menu')||''):'';
}
function cibler_(selecteur){
  if(!selecteur)return null;
  try{return document.querySelector(selecteur);}catch(_e){return null;}
}
function visible_(el){
  if(!el||!el.getBoundingClientRect)return false;
  var r=el.getBoundingClientRect();
  return r.width>0&&r.height>0;
}

/* ---------- style ---------- */

function installerStyle_(){
  if(document.getElementById(ID_STYLE))return;
  var s=document.createElement('style');s.id=ID_STYLE;
  s.textContent=
    '#'+ID+'{position:fixed;z-index:100000;box-sizing:border-box;width:min(360px,calc(100vw - 16px));padding:12px 14px 12px;border-radius:14px;border:3px solid #000;'+
      'background:linear-gradient(180deg,#1d2a47,#101a30);color:#f1f5ff;box-shadow:0 0 0 2px #f2c94c,0 14px 40px rgba(0,0,0,.65);font-family:"Comic Neue","Comic Sans MS",cursive,sans-serif}'+
    '#'+ID+'[hidden]{display:none}'+
    '#'+ID+' .tu-haut{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-bottom:6px}'+
    '#'+ID+' .tu-titre{font-family:Bangers,"Comic Sans MS",cursive;font-size:22px;letter-spacing:.05em;color:#f2c94c;text-shadow:0 2px 0 #000;line-height:1.1}'+
    '#'+ID+' .tu-compte{font-size:12px;color:#9fb3d8;white-space:nowrap}'+
    '#'+ID+' .tu-texte{font-size:16px;line-height:1.45;font-weight:700;max-height:42vh;overflow:auto}'+
    '#'+ID+' .tu-texte p{margin:0 0 8px}'+
    '#'+ID+' .tu-texte p:last-child{margin-bottom:0}'+
    '#'+ID+' .tu-actions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;margin-top:10px}'+
    '#'+ID+' .tu-actions button{font:inherit;font-weight:800;font-size:14px;padding:7px 12px;min-height:38px;border-radius:10px;border:2px solid #000;color:#fff;cursor:pointer;background:linear-gradient(180deg,#3a4d78,#26365a)}'+
    '#'+ID+' .tu-actions button.principal{background:linear-gradient(180deg,#34c46a,#1f8f4c)}'+
    '#'+ID+' .tu-actions button.discret{background:transparent;border-color:#5a6a8e;color:#aeb9d4}'+
    '#'+ID+' .tu-actions button:disabled{opacity:.45;cursor:default}'+
    '#'+ID+' .tu-apercu{font-size:12px;color:#f2c94c;margin-bottom:4px}'+
    '#'+ID+' .tu-indice{margin-top:8px;font-size:14px;font-weight:800;color:#4cd6f2}'+
    /* Fenêtre réduite en enceinte flottante (Norman, 2026-10-26 : « la fenêtre de tuto doit être diminuée directement ; on clique sur l'enceinte pour l'agrandir ») : la voix continue, un clic dessus la rouvre. */
    '#'+ID+' .tu-cth{position:absolute;left:8px;top:-118px;width:130px;height:130px;pointer-events:none}'+
    '#'+ID+' .tu-cth .cth-v1{width:130px;height:130px}'+
    /* Cthulhu en grand (arrive / grand / repart) : plein cadre, centré en haut, tout entier visible avec son visage ; la fenêtre de texte se cale en bas (Norman, 2026-11-04 : « il est coupé, on ne voit pas son visage »). */
    '.tu-anneau{position:fixed;z-index:99990;pointer-events:none;box-sizing:border-box;border:3px solid #ffe27a;animation:tuClignote 1s ease-in-out infinite}'+
    '@keyframes tuClignote{0%,100%{box-shadow:0 0 0 0 rgba(255,226,122,0);opacity:.25}50%{box-shadow:0 0 18px 6px rgba(255,226,122,.95);opacity:1}}'+
    '@media (prefers-reduced-motion:reduce){.tu-anneau{animation:none;box-shadow:0 0 14px 5px rgba(255,226,122,.95)}}'+
    '#'+ID+'{--tu-B:min(66vh,96vw)}'+
    /* bulle de dialogue de Lhu (Norman, 2026-11-07 : « je veux des bulles de dialogues ») : fond clair, queue qui pointe vers lui (placer_ pose data-queue et --qx) */
    '#'+ID+'.tu-bulle{background:linear-gradient(180deg,#ffffff,#fff6d6);color:#1b2238;border:3px solid #1b1630;border-radius:26px;box-shadow:0 8px 0 rgba(10,8,25,.45),0 14px 28px rgba(0,0,0,.35);width:min(300px,calc(100vw - 20px));padding:18px 18px 12px;font-family:"Comic Neue","Comic Sans MS",cursive}'+
    '#'+ID+'.tu-bulle .tu-haut,#'+ID+'.tu-bulle .tu-compte,#'+ID+'.tu-bulle .tu-indice,#'+ID+'.tu-bulle .tu-apercu{display:none}'+
    '#'+ID+'.tu-bulle .tu-texte{font-size:17px;line-height:1.4;font-weight:700;color:#1b2238;max-height:none;overflow:visible}'+
    '#'+ID+'.tu-bulle .tu-texte p{margin:0 0 6px}'+
    '#'+ID+'.tu-bulle .tu-actions{display:none}'+
    '#'+ID+'.tu-bulle .tu-actions button{min-height:34px;font-size:15px;border-radius:999px;border:2px solid #1b1630;box-shadow:0 3px 0 rgba(10,8,25,.4)}'+
    '#'+ID+'.tu-bulle .tu-actions button.discret{background:#fff;color:#1b2238;border-color:#1b1630}'+
    '#'+ID+'.tu-bulle .tu-actions button[data-tu="prec"]{display:none}'+
    '#'+ID+'.tu-bulle.tu-bulle-apercu .tu-actions button[data-tu="prec"]{display:inline-block}'+
    '#'+ID+'.tu-bulle::after{content:"";position:absolute;width:20px;height:20px;background:#fff6d6;border:3px solid #1b1630;transform:translateX(-50%) rotate(45deg);border-radius:4px}'+
    '#'+ID+'.tu-bulle[data-queue="bas"]::after{left:var(--qx,50%);bottom:-13px;border-top:0;border-left:0}'+
    '#'+ID+'.tu-bulle[data-queue="haut"]::after{left:var(--qx,50%);top:-13px;border-bottom:0;border-right:0;background:#ffffff}'+
    '#'+ID+'.tu-bulle[data-queue="gauche"]::after{left:-13px;top:var(--qy,50%);transform:translateY(-50%) rotate(45deg);border-top:0;border-right:0}'+
    '#'+ID+'.tu-bulle[data-queue="droite"]::after{left:auto;right:-13px;top:var(--qy,50%);transform:translateY(-50%) rotate(45deg);border-bottom:0;border-left:0}'+
    '#'+ID+' .tu-cth.tu-cth-grand{position:fixed;left:50%;top:2vh;width:var(--tu-B);height:var(--tu-B);margin-left:calc(var(--tu-B) / -2)}'+
    '#'+ID+' .tu-cth-grand .cth-v1{width:100%;height:100%;--cth-g:1}'+
    '#'+ID+'.tu-bas-cth{left:0!important;right:0!important;top:auto!important;bottom:12px!important;margin:0 auto!important}'+
    '#'+ID+'.reduit{width:54px;height:54px;padding:0;border-radius:50%;overflow:hidden;cursor:pointer}'+
    '#'+ID+'.reduit>*{display:none}'+
    '#'+ID+'.reduit::after{content:"🔊";position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:24px;animation:tuReduit 1.6s ease-in-out infinite}'+
    '@keyframes tuReduit{0%,100%{opacity:.7}50%{opacity:1}}'+
    /* Écran du boss noir (Norman, 2026-11-07) : après la victoire sur le premier boss, le NOUVEAU boss n'apparaît qu'une fois Lhu parti (et 2 s après) ; en attendant la partie du boss reste noire et sa chronique est masquée. */
    '#sorealLhuNoirV1{position:fixed;z-index:90000;background:#000;pointer-events:auto;opacity:1;transition:opacity .8s ease}'+
    '#sorealLhuNoirV1.fondu{opacity:0;pointer-events:none}'+
    'html.'+CLASSE_NOIR+' #sorealIdleBossChroniqueV206{visibility:hidden}'+
    '#'+ID+'.tu-verrou-voix .tu-indice{color:#ffd27a}'+
    '#'+ID_CADRE+'{position:fixed;z-index:99999;pointer-events:none;border-radius:12px;border:3px solid #f2c94c;box-shadow:0 0 0 3px rgba(0,0,0,.55),0 0 18px 4px rgba(242,201,76,.75);animation:tuPulse 1.3s ease-in-out infinite}'+
    '#'+ID_CADRE+'[hidden]{display:none}'+
    '@keyframes tuPulse{0%,100%{box-shadow:0 0 0 3px rgba(0,0,0,.55),0 0 10px 2px rgba(242,201,76,.55)}50%{box-shadow:0 0 0 3px rgba(0,0,0,.55),0 0 22px 7px rgba(242,201,76,.95)}}'+
    '@media (prefers-reduced-motion:reduce){#'+ID_CADRE+'{animation:none}}'+
    '#'+ID_PICKER+'{position:fixed;inset:0;z-index:100001;cursor:crosshair;background:rgba(0,0,0,.12)}'+
    '#'+ID_PICKER+' .tu-pk-bandeau{position:fixed;left:50%;top:10px;transform:translateX(-50%);max-width:92vw;padding:9px 14px;border-radius:12px;background:#0b1220;color:#fff;border:2px solid #f2c94c;font:700 15px "Comic Neue","Comic Sans MS",sans-serif;text-align:center;box-shadow:0 8px 24px rgba(0,0,0,.6);pointer-events:none}'+
    '#'+ID_PICKER+' .tu-pk-survol{position:fixed;pointer-events:none;border:3px dashed #4cd6f2;background:rgba(76,214,242,.16);border-radius:6px}';
  (document.head||document.documentElement).appendChild(s);
}

/* ---------- positionnement ---------- */

/* Éléments qui clignotent (Norman, 2026-11-07 : « le menu doit clignoter », « la barre de vie et le bouton + clignotent ») : un anneau lumineux POSÉ sur chaque élément, jamais une classe sur l'élément (le redessin de la page la retirerait, règle n°4). Les anneaux vivent dans <body>, hors du morph. */
var anneaux=[];
/* le panneau d'énergie (barre verte) du bandeau fixe : le deuxième bloc du bandeau, après les statistiques */
var SEL_BARRE_VERTE='#sorealIdleHudV2>div:nth-child(2)';
function retirerAnneaux_(){anneaux.forEach(function(a){if(a.parentNode)a.parentNode.removeChild(a);});anneaux=[];}
function anneaux_(etape){
  var els=[];
  if(etape&&etape.clignote&&etape.cible&&etape.cible.selecteur){var c=cibler_(etape.cible.selecteur);if(c&&visible_(c))els.push(c);}
  if(etape&&etape.clignoteAussi){try{Array.prototype.forEach.call(document.querySelectorAll(etape.clignoteAussi),function(x){if(visible_(x))els.push(x);});}catch(_e){}}
  /* Quand Lhu PARLE de la barre verte, elle est entourée (Norman, 2026-11-07 : « la barre verte n'est pas entourée quand il en parle ») : le guide enregistré n'a rien à porter pour ça (une étape dont « clignoteAussi » est déjà rempli garde ce qu'on lui a demandé). */
  if(etape&&!etape.clignoteAussi&&/barre verte/i.test(String(etape.texte||''))){var ev=document.querySelector(SEL_BARRE_VERTE);if(ev&&visible_(ev)&&els.indexOf(ev)<0)els.push(ev);}
  while(anneaux.length>els.length){var d=anneaux.pop();if(d.parentNode)d.parentNode.removeChild(d);}
  while(anneaux.length<els.length){var n=document.createElement('div');n.className='tu-anneau';n.setAttribute('data-morph-garder','1');n.setAttribute('aria-hidden','true');document.body.appendChild(n);anneaux.push(n);}
  els.forEach(function(x,i){
    var r=x.getBoundingClientRect(),a=anneaux[i];
    /* le cadre ne dépasse jamais de l'écran (la barre de vie touche les bords : le cadre se serre contre eux) */
    var VW=document.documentElement.clientWidth||window.innerWidth,VH=window.innerHeight;
    var gl=Math.max(0,r.left-3),gt=Math.max(0,r.top-3),gr=Math.min(VW,r.right+3),gb=Math.min(VH,r.bottom+3);
    a.style.left=gl+'px';a.style.top=gt+'px';a.style.width=Math.max(0,gr-gl)+'px';a.style.height=Math.max(0,gb-gt)+'px';
    var rad=getComputedStyle(x).borderRadius;a.style.borderRadius=rad&&rad!=='0px'?rad:'10px';
  });
}
/* Texte dynamique : {input} = le nombre écrit dans la zone de saisie de l'Entraînement de base. */
function texteDyn_(t){
  return String(t==null?'':t).replace(/\{input\}/g,function(){
    var i=document.getElementById('sorealIdleTrainingInputV120');
    return i&&i.value!==''?String(i.value):'';
  });
}
/* Réglage du joueur : désactiver les aides de Cthulhu (lié au compte : clé soreal_idle_*). */
var CLE_AIDES='soreal_idle_aides_lhu_off_v1';
function aidesActives_(){try{return localStorage.getItem(CLE_AIDES)!=='1';}catch(_e){return true;}}
function definirAides_(actif){
  try{if(actif)localStorage.removeItem(CLE_AIDES);else localStorage.setItem(CLE_AIDES,'1');}catch(_e){}
  if(!actif&&etat.enCours&&!etat.enCours.apercu)fermer_(false);
}
window.__basculerAidesLhuIdleV1__=function(actif){definirAides_(Boolean(actif));};
function placer_(bulle,cadre,etape){
  var cible=etape&&etape.cible?cibler_(etape.cible.selecteur):null;
  var vw=window.innerWidth,vh=window.innerHeight,m=8;
  var bw=bulle.offsetWidth,bh=bulle.offsetHeight;
  var x,y,r=null;
  if(cible&&visible_(cible)){
    r=cible.getBoundingClientRect();
    if(cadre){
      if(etape.surbrillance!==false&&!etape.scene){   /* aucun cadre autour de ce qu'il faut cliquer pendant une scène de Lhu (Norman, 2026-11-07) */
        cadre.hidden=false;
        cadre.style.left=(r.left-5)+'px';cadre.style.top=(r.top-5)+'px';cadre.style.width=(r.width+10)+'px';cadre.style.height=(r.height+10)+'px';
      }else cadre.hidden=true;
    }
  }else if(cadre)cadre.hidden=true;
  anneaux_(etape);
  var p=String(etape&&etape.placement||'auto');
  var cr=window.__SOREAL_IDLE_CTHULHU_SCENE_V1__&&bulle.classList.contains('tu-bulle')?window.__SOREAL_IDLE_CTHULHU_SCENE_V1__.rect():null;
  if(cr&&cr.width>0){
    /* Bulle de dialogue (Norman, 2026-11-07 : « les choses mieux placées ») : près de Lhu, la queue vers lui, et JAMAIS sur ce qu'il faut cliquer, sur ce qui clignote ni sur Lhu : on essaie les places autour de lui (dessous, dessus, côtés) et les bandes du haut et du bas de l'écran, et on garde celle qui recouvre le moins. */
    var obst=[];
    function ajouterObst(el){if(el&&visible_(el)){var q=el.getBoundingClientRect();obst.push({l:q.left-8,t:q.top-8,r:q.right+8,b:q.bottom+8});}}
    ajouterObst(cible);
    /* ce qu'on regarde dans le duel : le portrait du boss et du joueur (la bulle ne les cache pas si une autre place existe) */
    if(etape.clignoteAussi){try{Array.prototype.forEach.call(document.querySelectorAll(etape.clignoteAussi),ajouterObst);}catch(_e){}}
    var grand=cr.height>0.4*vh;
    obst.push({l:cr.left,t:cr.top,r:cr.right,b:cr.bottom});
    var ccx=cr.left+cr.width/2,ccy=cr.top+cr.height/2,g=18;
    var haut0=m;
    try{var hh=document.elementFromPoint(vw/2,4);while(hh&&hh!==document.body){var cs0=getComputedStyle(hh);if(cs0.position==='fixed'||cs0.position==='sticky'){var rh0=hh.getBoundingClientRect();if(rh0.bottom<vh*0.4)haut0=Math.max(haut0,rh0.bottom+6);break;}hh=hh.parentElement;}}catch(_e){}
    var cands=[
      {x:ccx-bw/2,y:cr.top-bh-g,q:'bas'},{x:ccx-bw/2,y:cr.bottom+g,q:'haut'},
      {x:cr.left-bw-g,y:ccy-bh/2,q:'droite'},{x:cr.right+g,y:ccy-bh/2,q:'gauche'},
      {x:(vw-bw)/2,y:vh-bh-m-6,q:ccy<vh/2?'haut':'bas'},{x:(vw-bw)/2,y:haut0,q:ccy<vh/2?'haut':'bas'}
    ];
    /* La bulle est AU-DESSUS de Lhu (Norman, 2026-11-07) ; seulement s'il n'y a pas la place au-dessus : dessous, puis les côtés, puis le haut ou le bas de l'écran. Une bulle qui n'entre pas dans l'écran ou qui recouvrirait Lhu est écartée. */
    var meilleur=null,pire=1e15;
    cands.forEach(function(c,rang){
      var cx=Math.max(m,Math.min(vw-bw-m,c.x)),cy=c.y,entre=cy>=haut0&&cy+bh<=vh-m;
      if(!entre)cy=Math.max(haut0,Math.min(vh-bh-m,cy));
      var aire=0;
      var lhu=0;
      obst.forEach(function(o,k){var w=Math.min(cx+bw,o.r)-Math.max(cx,o.l),h=Math.min(cy+bh,o.b)-Math.max(cy,o.t);if(w>0&&h>0){if(k===obst.length-1)lhu=1;else aire+=w*h;}});   /* le dernier obstacle est Lhu lui-même */
      var note=(entre?0:1e9)+lhu*1e6+rang*1e4+aire*0.001;   /* l'ordre des places prime (dessus d'abord) ; ce qui clignote ne départage que des places de même rang */
      if(note<pire){pire=note;meilleur={x:cx,y:cy,q:c.q};}
    });
    x=meilleur.x;y=meilleur.y;
    bulle.setAttribute('data-queue',meilleur.q);
    bulle.style.setProperty('--qx',Math.round(Math.max(28,Math.min(bw-28,ccx-x)))+'px');
    bulle.style.setProperty('--qy',Math.round(Math.max(28,Math.min(bh-28,ccy-y)))+'px');
    bulle.style.left=Math.round(x)+'px';bulle.style.top=Math.round(y)+'px';
    return;
  }
  if(!r&&etape&&etape.scene&&p!=='centre'){
    x=(vw-bw)/2;y=vh-bh-m;
  }else if(!r||p==='centre'){
    x=(vw-bw)/2;y=(vh-bh)/2;
    /* Cible présente mais fenêtre « au centre » : on l'écarte pour ne pas cacher la cible. */
    if(r&&p==='centre'&&y<r.bottom&&y+bh>r.top)y=(r.top+r.height/2<vh/2)?Math.min(vh-bh-m,r.bottom+14):Math.max(m,r.top-bh-14);
  }else{
    var g=14,cx=r.left+r.width/2-bw/2,cy=r.top+r.height/2-bh/2;
    var cand={
      bas:{x:cx,y:r.bottom+g,ok:r.bottom+g+bh<=vh-m},
      haut:{x:cx,y:r.top-bh-g,ok:r.top-bh-g>=m},
      droite:{x:r.right+g,y:cy,ok:r.right+g+bw<=vw-m},
      gauche:{x:r.left-bw-g,y:cy,ok:r.left-bw-g>=m}
    };
    var ordre=p==='auto'?['bas','haut','droite','gauche']:[p].concat(['bas','haut','droite','gauche'].filter(function(c){return c!==p;}));
    var choix=null;
    for(var i=0;i<ordre.length;i++){if(cand[ordre[i]].ok){choix=cand[ordre[i]];break;}}
    if(!choix){
      /* Aucun côté ne convient (cible très grande) : en haut ou en bas de l'écran, du côté où la cible n'est pas. */
      choix={x:(vw-bw)/2,y:(r.top+r.height/2<vh/2)?vh-bh-m:m};
    }
    x=choix.x;y=choix.y;
  }
  x=Math.max(m,Math.min(vw-bw-m,x));y=Math.max(m,Math.min(vh-bh-m,y));
  bulle.style.left=Math.round(x)+'px';bulle.style.top=Math.round(y)+'px';
}

/* ---------- voix ---------- */
/*
 * Chaque étape d'un guide a sa voix (Norman, 2026-10-14) : elle est déclarée à l'éditeur de textes et de voix du menu Admin (modules/textes-admin-v1.js, groupe « Tutoriel · … »), qui génère les fichiers avec le
 * studio local et les envoie sur R2 ; même chaîne que les popups d'explication. Sans modification, la voix dit le titre puis le texte de l'étape ; le texte lu peut être changé (balises de voix, d'expression, de pause)
 * sans toucher au texte affiché. La lecture est automatique si la voix est activée par le joueur ; le bouton 🔊 relit l'étape.
 */
/* Texte d'une étape en blocs : une chaîne ou une liste -> un texte, un bloc par ligne, sans bloc vide (c'est ce que la fenêtre affiche et ce que la voix lit). */
function blocsEtape_(v){
  return (Array.isArray(v)?v:String(v==null?'':v).split(/\n+/)).map(function(x){return String(x==null?'':x).trim();}).filter(Boolean).join('\n');
}
function cleVoix_(guide,i){return 'guide:'+String(guide&&guide.id||'')+':'+i;}
function texteOrigineVoix_(e){
  var t=String(e&&e.titre||'').trim(),x=String(e&&e.texte||'').replace(/\s+/g,' ').trim();
  return t&&x?t+' (pause 450ms) '+x:(t||x);
}
function declarerVoix_(guide){
  var T=window.__SOREAL_IDLE_TEXTES_V1__;
  if(!T||typeof T.declarer!=='function'||!guide||!guide.id||!Array.isArray(guide.etapes))return;
  guide.etapes.forEach(function(e,i){
    T.declarer(cleVoix_(guide,i),{
      groupe:'Tutoriel · '+String(guide.titre||guide.id),
      libelle:'Étape '+(i+1)+' — '+String(e.titre||'Sans titre'),
      /* Même éditeur que les textes de base (Norman, 2026-10-23) : le cadre jaune est le texte de l'étape tel que le joueur le lit (celui du guide, jamais une copie), les personnages en dessous disent ce qu'on veut. */
      /* Liste de textes (Norman, 2026-11-02 : « je dois pouvoir supprimer un texte… de 3 à 1 ou 5 ») : un cadre jaune par ligne du texte de l'étape (la fenêtre du joueur affiche un paragraphe par ligne) ; on en retire ou on en ajoute. */
      champs:[{id:'texte',label:'Texte de l’étape',type:'liste'}],
      champsDepuisSource:true,
      original:function(){return {texte:blocsEtape_(e.texte).split('\n').filter(Boolean)};},
      texteLu:function(v){return blocsEtape_(v&&v.texte);},
      apresEnregistrer:function(o){
        var A=window.__SOREAL_IDLE_ADMIN_TUTORIEL_V1__;
        if(A&&typeof A.majTexteEtape==='function')A.majTexteEtape(guide.id,i,blocsEtape_(o&&o.champs&&o.champs.texte));
      }
    });
  });
}
/* Texte à dire pour l'étape : la version de l'administrateur si elle existe, sinon le titre et le texte de l'étape. */
function texteParle_(guide,i){
  var tts=window.__SOREAL_IDLE_TUTORIAL_TTS_V209__,T=window.__SOREAL_IDLE_TEXTES_V1__;
  var e=guide.etapes[i],brut=texteOrigineVoix_(e);
  try{
    var sur=T&&typeof T.surcharge==='function'?T.surcharge(cleVoix_(guide,i)):null;
    if(sur&&Array.isArray(sur.texte))sur={texte:blocsEtape_(sur.texte)};   /* liste de textes (cadres jaunes) : un bloc par ligne */
    if(sur&&typeof sur.texte==='string'&&sur.texte.trim())brut=sur.texte;
    /* Norman (2026-10-23) : « ma fenêtre de tuto lit avec la voix de secours alors que les voix sont disponibles dans l'éditeur ». Les voix générées dans l'éditeur sont celles du texte DIT (le cadre des personnages, champ « parle »), pas du texte affiché : la lecture doit prendre ce texte-là, sinon l'empreinte du bloc ne correspond à aucun fichier et la voix de secours prend le relais. */
    var dit=T&&typeof T.parle==='function'?T.parle(cleVoix_(guide,i),'texte'):undefined;
    if(Array.isArray(dit))dit=blocsEtape_(dit);   /* un texte dit par bloc (cadre jaune) : les blocs supprimés ne sont plus lus */
    if(typeof dit==='string'&&dit.trim())brut=dit;
  }catch(_e){}
  brut=texteDyn_(brut);   /* {input} : le chiffre vu à l'écran, dit tel quel */
  return tts&&typeof tts.retirerParentheses==='function'?tts.retirerParentheses(brut):brut;   /* sans écraser les retours à la ligne : le même texte que l'éditeur, donc les mêmes empreintes */
}
function lireEtape_(s,force){
  var tts=window.__SOREAL_IDLE_TUTORIAL_TTS_V209__;
  s.voixEnCours=false;
  if(!tts||typeof tts.readText!=='function')return;
  if(!force&&!(typeof tts.enabled==='function'&&tts.enabled()))return;
  try{
    var t=texteParle_(s.guide,s.i);
    if(!t)return;
    /* Verrou « la voix parle » (Norman, 2026-10-26) : sur une étape qui demande de cliquer (Fight), rien ne se clique tant que la voix n'a pas fini ; levé à la fin de la lecture, à son arrêt ou au plus tard après 90 s. */
    var jeton=(s.jetonVoix||0)+1;s.jetonVoix=jeton;s.voixEnCours=true;s.voixLimite=Date.now()+(s.guide&&s.guide.mascotte?Math.min(90000,(s.tempsLecture||8000)+6000):90000);   /* bulle de Lhu : une phrase courte, jamais bloqué 90 s si la lecture ne démarre pas */
    var debutVoix=Date.now();
    s.aVoix=false;s.voixFinieA=0;
    var demarre=tts.readText(t,null,function(){
      if(s.jetonVoix!==jeton)return;
      s.voixEnCours=false;
      /* une vraie lecture a duré (un rappel immédiat = la voix n'a pas pu partir : on garde le temps de lecture) */
      if(Date.now()-debutVoix>=800){s.aVoix=true;s.voixFinieA=Date.now();}
    });
    if(!demarre)s.voixEnCours=false;
  }catch(_e){s.voixEnCours=false;}
}
/* Bulle de Lhu : la suivante vient dès que la voix a fini de lire (Norman, 2026-11-07 : « trop de longueurs entre les bulles, ça doit s'enchaîner quand la voix a terminé »), après un souffle de 0,35 s ; sans voix, le temps de lecture prévu. */
var SOUFFLE_APRES_VOIX_MS=350;
function pretASuivre_(s){
  if(voixParle_(s))return false;
  if(s.aVoix)return Date.now()-s.voixFinieA>=SOUFFLE_APRES_VOIX_MS;
  return Date.now()-s.debutEtape>=s.tempsLecture;
}
/* La voix parle encore (réglage de l'étape ignoré) : sert à finir seul une étape sans fenêtre. */
function voixParle_(s){
  if(!s||!s.voixEnCours)return false;
  if(Date.now()>(s.voixLimite||0)){s.voixEnCours=false;return false;}
  return true;
}
/* Verrou des clics : seulement si l'étape demande d'attendre la fin de la phrase (case de l'éditeur, cochée par défaut ; Norman, 2026-10-27). */
function voixVerrouille_(s){
  if(!s||!s.voixEnCours)return false;
  var etapeCourante=s.guide&&s.guide.etapes&&s.guide.etapes[s.i];
  if(etapeCourante&&etapeCourante.attendreVoix===false)return false;
  if(Date.now()>(s.voixLimite||0)){s.voixEnCours=false;return false;}
  return true;
}
function taire_(){
  var tts=window.__SOREAL_IDLE_TUTORIAL_TTS_V209__;
  try{if(tts&&typeof tts.stop==='function')tts.stop();}catch(_e){}
}

/* ---------- lecture d'un guide ---------- */

function arreterBoucle_(){if(boucle){clearInterval(boucle);boucle=0;}}

/*
 * ÉCRAN DU BOSS NOIR (Norman, 2026-11-07 : « le boss ne doit apparaître que quand Cthulhu est parti ; l'écran de la partie du boss reste noir tant qu'il n'est pas parti, hors de l'écran pendant 2 secondes, puis le nouveau boss apparaît ; son texte doit être lu à ce moment-là, il n'avait prononcé que son nom »).
 * Dès la victoire sur le premier boss le voile noir tombe sur la partie du boss ; la chronique du nouveau boss est marquée lue (elle ne se lance pas toute seule derrière le voile, ni ne se fait couper par la voix de Lhu) ; à la fin du guide Lhu s'envole, 2 secondes passent, le voile s'efface en fondu et la chronique est lue en entier, à la main (le même chemin que le bouton « Lire la chronique »).
 */
var noirGarde=0,noirMinuteur=0,noirSecours=0;
function voileNoir_(){
  var v=document.getElementById('sorealLhuNoirV1');
  if(!v){v=document.createElement('div');v.id='sorealLhuNoirV1';v.setAttribute('aria-hidden','true');document.body.appendChild(v);}
  return v;
}
/* le voile suit la carte du boss (page qui défile, redimensionnée ou redessinée) ; absente (autre menu) : voile masqué */
function suivreVoile_(){
  var v=document.getElementById('sorealLhuNoirV1');if(!v)return;
  /* Norman (2026-11-07) : « ce n'est pas toute la borne qui doit être noire, juste la case de l'image du boss » */
  var c=document.querySelector('.soreal-idle-page-root-v28[data-menu="combat"] #sorealIdleBossImageHostV36');
  if(!c){v.style.display='none';return;}
  var r=c.getBoundingClientRect();
  v.style.display='';v.style.left=r.left+'px';v.style.top=r.top+'px';v.style.width=r.width+'px';v.style.height=r.height+'px';
}
function coupeChronique_(){
  try{
    var p=document.getElementById('sorealIdleBossChroniqueV206'),tts=window.__SOREAL_IDLE_TUTORIAL_TTS_V209__;
    var id=p&&p.getAttribute('data-soreal-chronique-boss-id');
    if(id&&tts&&typeof tts.marquerChroniqueLue==='function')tts.marquerChroniqueLue(id);
    if(tts&&typeof tts.lectureCible==='function'&&tts.lectureCible('sorealIdleBossChroniqueV206')&&typeof tts.stop==='function')tts.stop();
  }catch(_e){}
}
function idChronique_(){var p=document.getElementById('sorealIdleBossChroniqueV206');return p?String(p.getAttribute('data-soreal-chronique-boss-id')||''):'';}
function bossNoir_(on){
  document.documentElement.classList.toggle(CLASSE_NOIR,Boolean(on));
  if(noirGarde){clearInterval(noirGarde);noirGarde=0;}
  var v=document.getElementById('sorealLhuNoirV1');
  if(!on){
    if(v){v.classList.add('fondu');setTimeout(function(){var w=document.getElementById('sorealLhuNoirV1');if(w&&w.classList.contains('fondu')&&w.parentNode)w.parentNode.removeChild(w);},900);}
    return;
  }
  v=voileNoir_();v.classList.remove('fondu');suivreVoile_();
  /* le nom du nouveau boss ne doit JAMAIS être prononcé tout de suite (Norman, 2026-11-07 : « il a prononcé le nom du suivant quand même ») : une lecture de chronique déjà partie est coupée */
  coupeChronique_();
  noirGarde=setInterval(function(){
    coupeChronique_();
    suivreVoile_();
    try{
      var p=document.getElementById('sorealIdleBossChroniqueV206'),tts=window.__SOREAL_IDLE_TUTORIAL_TTS_V209__;
      var id=p&&p.getAttribute('data-soreal-chronique-boss-id');
      if(id&&tts&&typeof tts.marquerChroniqueLue==='function')tts.marquerChroniqueLue(id);
    }catch(_e){}
  },100);
}
function devoilerBoss_(){
  clearTimeout(noirMinuteur);clearTimeout(noirSecours);noirMinuteur=0;noirSecours=0;
  if(!document.documentElement.classList.contains(CLASSE_NOIR))return;
  bossNoir_(false);
  setTimeout(function(){   /* le voile s'efface en 0,8 s ; la chronique du nouveau boss se lit une fois qu'il est visible */
    try{
      var tts=window.__SOREAL_IDLE_TUTORIAL_TTS_V209__,id='sorealIdleBossChroniqueV206';
      if(!tts||typeof tts.readTarget!=='function')return;
      if(typeof tts.enabled==='function'&&!tts.enabled())return;
      if(typeof tts.lectureCible==='function'&&tts.lectureCible(id))return;
      tts.readTarget(id);
    }catch(_e){}
  },500);
}
function programmerDevoilement_(fin){
  /* Lhu a quitté l'écran (fin = promesse de son départ) : 2 secondes de vide, puis le nouveau boss. Filet de sécurité : jamais plus de 15 s. */
  clearTimeout(noirSecours);noirSecours=setTimeout(devoilerBoss_,15000);
  Promise.resolve(fin).then(function(){clearTimeout(noirMinuteur);noirMinuteur=setTimeout(devoilerBoss_,2000);},function(){devoilerBoss_();});
}

function fermer_(vu){
  var s=etat.enCours;
  arreterBoucle_();
  retirerAnneaux_();
  var finLhu=null;
  try{var sc=window.__SOREAL_IDLE_CTHULHU_SCENE_V1__;if(sc&&sc.existe())finLhu=sc.partir();}catch(_e){}
  if(document.documentElement.classList.contains(CLASSE_NOIR))programmerDevoilement_(finLhu);
  var b=document.getElementById(ID),c=document.getElementById(ID_CADRE);
  if(b&&b.parentNode)b.parentNode.removeChild(b);
  if(c&&c.parentNode)c.parentNode.removeChild(c);
  etat.enCours=null;
  if(s)taire_();
  if(s&&s.marquerVu&&vu)marquerVu_(s.guide.vuId);
  if(s&&typeof s.apresFin==='function'){try{s.apresFin(Boolean(vu));}catch(_e){}}
}

/*
 * La chronique du boss d'abord (Norman, 2026-10-22 : « le tutoriel nous fait apparaître dans Fight Boss ; la chronique de boss doit se lire, et ensuite il doit s'ouvrir et se lire aussi ») : à la première étape, une fois le jeu rendu au menu de l'étape, la fenêtre attend que le texte de la
 * chronique soit fermé et que sa lecture soit terminée ou interrompue (libre depuis 1,5 s : la lecture automatique peut démarrer juste après l'affichage), 2 minutes au plus. Sans chronique à l'écran, l'attente se limite à ce délai.
 */
function chroniqueOccupee_(){
  /* La cinématique de début de partie (images puis chronique du premier boss) occupe l'écran : le guide ne démarre qu'à sa fermeture (Norman, 2026-10-23). */
  if(document.getElementById('sorealIdleTutorielPagesModalV1'))return true;
  /* L'écran d'accueil (choix du pseudo) passe avant tout (Norman, 2026-10-26 : le tutoriel arrivait sur l'écran du pseudo). */
  if(document.getElementById('sorealIdleAccueilV1'))return true;
  var p=document.getElementById('sorealIdleBossChroniqueV206');
  if(!p)return false;
  if(window.__chroniqueOuverteIdleV1||(p.classList&&p.classList.contains('ouverte')))return true;
  var tts=window.__SOREAL_IDLE_TUTORIAL_TTS_V209__;
  try{if(tts&&typeof tts.lectureCible==='function'&&tts.lectureCible('sorealIdleBossChroniqueV206'))return true;}catch(_e){}
  try{if(tts&&typeof tts.isSpeaking==='function'&&tts.isSpeaking())return true;}catch(_e){}
  return false;
}
/* Norman (2026-10-23) : l’étape suivante n’arrive que 2 secondes après le clic sur la cible (le temps de voir le jeu réagir). */
var DELAI_APRES_CLIC_MS=2000;
function attendreChronique_(s,suite){
  var debut=Date.now(),libre=0;
  (function sonde(){
    if(etat.enCours!==s)return;
    if(chroniqueOccupee_()){libre=0;}
    else if(!libre){libre=Date.now();}
    if((libre&&Date.now()-libre>=1500)||Date.now()-debut>120000){suite();return;}
    setTimeout(sonde,300);
  })();
}

/* Cthulhu à côté de la fenêtre (la mascotte ne fait que se dessiner : textes, menus et voix sont ceux du guide). */
function mascotteHtml_(e){
  var C=window.__SOREAL_IDLE_CTHULHU_V1__;
  if(!C||typeof C.html!=='function')return '';
  var SC=window.__SOREAL_IDLE_CTHULHU_SCENE_V1__;
  if(e&&(e.scene||(SC&&SC.existe())))return '';   /* une scène de vol : c'est le Cthulhu flottant (cthulhu-scene-v1.js) qui joue, pas celui de la fenêtre */
  var grand=/^(arrive|grand|repart)$/.test(e&&e.humeur||'');
  return '<div class="tu-cth'+(grand?' tu-cth-grand':'')+'">'+C.html(e&&e.humeur||'normal',/^(arrive|grand|repart)$/.test(e&&e.humeur||'')?'':'cth-entre')+'</div>';
}
/* Cthulhu en grand : la fenêtre se cale en bas ; pour « repart », il retourne à sa petite place (coin de la fenêtre) : décalage et échelle calculés ici. */
function reglerMascotteGrande_(b,e){
  var grand=Boolean(b&&e&&/^(arrive|grand|repart)$/.test(e.humeur||'')&&b.querySelector('.tu-cth-grand'));
  b.classList.toggle('tu-bas-cth',grand);
  if(!grand)return;
  var racine=b.querySelector('.tu-cth-grand .cth-v1');if(!racine)return;
  var W=window.innerWidth||1000,H=window.innerHeight||700,B=Math.min(0.66*H,0.96*W);
  var wr=b.getBoundingClientRect(),cx=W/2,cy=0.02*H+B,sx=wr.left+8+65,sy=wr.top-118+130;   /* l'échelle part de ses pieds (bas du dessin, au centre) : on vise donc le bas de sa petite place */
  racine.style.setProperty('--cth-s',String(130/B));
  racine.style.setProperty('--cth-dx',Math.round(sx-cx)+'px');
  racine.style.setProperty('--cth-dy',Math.round(sy-cy)+'px');
}
/* Lhu se place tout seul près de ce qu'il faut cliquer (Norman, 2026-11-07 : « j'ai raccourci le tuto, du coup il n'est plus placé aux bons endroits ») : une étape qui attend un clic et n'a pas de scène (la place de Lhu venait de l'étape supprimée) le fait voler près de la cible. */
function etapeAvecPlace_(s,e){
  var sc=window.__SOREAL_IDLE_CTHULHU_SCENE_V1__;
  if(!e.scene&&s.guide.mascotte&&e.avanceAuClic&&e.cible&&e.cible.selecteur&&sc&&typeof sc.existe==='function'&&sc.existe())return Object.assign({},e,{scene:'place',mascotteSur:e.mascotteSur||e.cible.selecteur});
  return e;
}
function afficherEtape_(garderTaille){
  var s=etat.enCours;if(!s)return;
  var e=s.guide.etapes[s.i];if(!e){fermer_(true);return;}
  e=etapeAvecPlace_(s,e);
  installerStyle_();
  /* Le jeu se rend tout seul au menu de l'étape. */
  if(e.menu&&e.menu!==menuActif_()&&typeof window.__menuIdleV28__==='function'){try{window.__menuIdleV28__(e.menu);}catch(_e){}}
  if(!s.apercu&&s.i===0&&!s.chroniqueVue){
    s.chroniqueVue=true;
    attendreChronique_(s,function(){if(etat.enCours===s)afficherEtape_();});
    return;
  }
  var b=document.getElementById(ID),c=document.getElementById(ID_CADRE);
  if(!b){b=document.createElement('div');b.id=ID;b.setAttribute('role','dialog');b.setAttribute('data-soreal-tts-ignore','1');b.setAttribute('aria-live','polite');document.body.appendChild(b);}
  if(!c){c=document.createElement('div');c.id=ID_CADRE;c.hidden=true;document.body.appendChild(c);}
  var nbEtapes=s.guide.etapes.length;
  var paragraphes=texteDyn_(e.texte||'').split(/\n+/).filter(function(x){return x.trim();}).map(function(x){return '<p>'+esc_(x)+'</p>';}).join('');
  var dernier=s.i>=nbEtapes-1;
  /* « Avance au clic » : on attend le clic sur la cible (indice affiché, bouton Suivant masqué le temps du délai). */
  s.attenteClic=Boolean(e.avanceAuClic&&e.cible&&e.cible.selecteur);
  s.debutAttente=Date.now();
  /* Guide « sans fenêtre » (Norman, 2026-10-27 : « pour le premier tuto, rien ne doit apparaître à l'écran, ni texte ni fenêtre rétrécie ») : la fenêtre existe pour la logique (voix, clic) mais reste cachée ; le cadre lumineux de la cible n'est pas touché. */
  s.cache=s.guide.afficher===false;
  s.debutEtape=Date.now();s.aVoix=false;s.voixFinieA=0;
  s.tempsLecture=s.guide.mascotte?Math.max(3200,Math.min(60000,texteDyn_(e.texte||'').length*65+1500)):Math.max(2500,Math.min(60000,String(e.texte||'').length*60));   /* bulle de Lhu : le temps de lire */
  /* Scène de vol de Lhu : la fenêtre (texte, voix) n'apparaît qu'à la FIN du mouvement ; rien ne se clique avant. */
  var scene=window.__SOREAL_IDLE_CTHULHU_SCENE_V1__;
  var indiceScene=s.i;
  s.sceneEnCours=Boolean(e.scene&&scene);
  b.hidden=s.cache||s.sceneEnCours;
  var avecLhu=Boolean(scene&&(e.scene||scene.existe()));
  b.classList.toggle('tu-bulle',avecLhu);
  b.classList.toggle('tu-bulle-apercu',Boolean(avecLhu&&s.apercu));
  /* Une étape qui commence (départ du guide, avance au clic) s'ouvre réduite en enceinte ; un clic sur Précédent / Suivant garde la taille choisie. */
  b.classList.toggle('reduit',!garderTaille&&!s.guide.mascotte);   /* Cthulhu s'affiche tout de suite, jamais réduit en enceinte */
  b.innerHTML=
    (s.apercu?'<div class="tu-apercu">👁 Aperçu — rien n’est enregistré</div>':'')+
    (s.guide.mascotte?mascotteHtml_(e):'')+
    '<div class="tu-haut"><span class="tu-titre">'+esc_(e.titre||s.guide.titre||'')+'</span><span class="tu-compte">'+(s.i+1)+'/'+nbEtapes+'</span></div>'+
    '<div class="tu-texte">'+paragraphes+'</div>'+
    (s.attenteClic?'<div class="tu-indice">'+(e.scene||e.surbrillance===false?'👆 Clique pour continuer.':'👆 Clique sur l’élément entouré pour continuer.')+'</div>':'')+
    '<div class="tu-actions">'+
      '<button type="button" class="discret" data-tu="ecouter" title="Écouter cette étape" aria-label="Écouter cette étape">🔊</button>'+
      (avecLhu&&!s.apercu?'':'<button type="button" class="discret" data-tu="passer">'+(s.apercu?'Fermer':'Passer')+'</button>')+
      '<button type="button" data-tu="prec" '+(s.i<=0?'disabled':'')+'>◀ Précédent</button>'+
      '<button type="button" class="principal" data-tu="suiv" '+(s.attenteClic?'hidden':'')+'>'+(dernier?'Terminé ✔':'Suivant ▶')+'</button>'+
    '</div>';
  reglerMascotteGrande_(b,e);
  /* La cible peut mettre un instant à apparaître (changement de menu) : on la fait défiler dans l'écran dès qu'elle existe. */
  s.defile=false;s.essais=0;
  arreterBoucle_();
  boucle=setInterval(suivre_,200);
  suivre_();
  declarerVoix_(s.guide);
  if(s.sceneEnCours){
    var fini=function(){
      if(etat.enCours!==s||s.i!==indiceScene)return;
      s.sceneEnCours=false;s.debutEtape=Date.now();s.aVoix=false;s.voixFinieA=0;
      var bb=document.getElementById(ID);if(bb&&!s.cache)bb.hidden=false;
      lireEtape_(s,false);suivre_();
    };
    var p=null;try{p=scene.jouer(e.scene,{sur:e.mascotteSur||''});}catch(_e){}
    Promise.resolve(p).then(fini,fini);
    return;
  }
  lireEtape_(s,false);
}

function suivre_(){
  var s=etat.enCours;if(!s){arreterBoucle_();return;}
  var b=document.getElementById(ID),c=document.getElementById(ID_CADRE);
  if(!b)return;
  var e=s.guide.etapes[s.i];if(!e)return;
  var cible=e.cible?cibler_(e.cible.selecteur):null;
  if(cible&&visible_(cible)&&!s.defile){
    s.defile=true;
    var r=cible.getBoundingClientRect();
    if(r.top<60||r.bottom>window.innerHeight-60){try{cible.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});}catch(_e){cible.scrollIntoView(true);}}
  }
  /* Attendre ne lance JAMAIS l'étape suivante (Norman, 2026-10-26) : le bouton Suivant ne revient que si l'élément à cliquer n'existe pas du tout (écran où il ne peut pas apparaître), jamais au bout d'un délai. */
  if(s.attenteClic&&!cible&&Date.now()-s.debutAttente>DELAI_SUIVANT_MS){
    var bs=b.querySelector('[data-tu="suiv"]');if(bs&&bs.hidden)bs.hidden=false;
    var ind0=b.querySelector('.tu-indice');if(ind0)ind0.hidden=true;
  }
  if(s.attenteClic){
    var verrou=voixVerrouille_(s);
    b.classList.toggle('tu-verrou-voix',verrou);
    var ind=b.querySelector('.tu-indice');
    if(ind){
      var sansCadre=Boolean(e.scene||e.surbrillance===false);
      var texteInd=verrou?(sansCadre?'🔊 Écoute d’abord la voix, tu pourras ensuite cliquer.':'🔊 Écoute d’abord la voix : tu pourras ensuite cliquer sur l’élément entouré.'):(sansCadre?'👆 Clique pour continuer.':'👆 Clique sur l’élément entouré pour continuer.');
      if(ind.textContent!==texteInd)ind.textContent=texteInd;
    }
  }
  /* Sans fenêtre et sans clic demandé, personne ne peut cliquer sur « Suivant » : l'étape se termine toute seule quand la voix a fini (au moins 2,5 s, ou le temps de lire le texte si la voix est coupée). */
  if(s.cache&&!s.attenteClic&&!voixParle_(s)&&Date.now()-s.debutEtape>=s.tempsLecture){
    var iEtape=s.i;
    if(s.i>=s.guide.etapes.length-1){fermer_(true);return;}
    s.i=iEtape+1;afficherEtape_(true);return;
  }
  /* Bulle de Lhu (Norman, 2026-11-07 : « juste une bulle avec du texte ; quand le temps prévu pour lire est passé, ça passe à la bulle suivante ; quand il nous demande de faire un truc, sa bulle disparaît ») : aucun bouton. Le temps de lecture écoulé (et la voix finie), la bulle suivante vient seule ; sur une étape qui demande un clic, la bulle se range et l'élément qui clignote reste seul. */
  if(b.classList.contains('tu-bulle')&&!s.sceneEnCours&&pretASuivre_(s)){
    if(s.attenteClic){if(!b.hidden)b.hidden=true;}
    else if(s.i>=s.guide.etapes.length-1){fermer_(true);return;}
    else{s.i+=1;afficherEtape_(true);return;}
  }
  placer_(b,c,e);
}

/*
 * jouer(guide, options) : options.apercu (rien n'est marqué vu), options.marquerVu, options.apresFin(vu).
 * Un seul guide à la fois.
 */
function jouer_(guide,options){
  if(!guide||!Array.isArray(guide.etapes)||!guide.etapes.length)return false;
  if(etat.enCours)fermer_(false);
  var o=options||{};
  etat.enCours={guide:guide,i:0,apercu:Boolean(o.apercu),marquerVu:Boolean(o.marquerVu)&&!o.apercu,apresFin:o.apresFin,defile:false,essais:0};
  afficherEtape_();
  return true;
}

document.addEventListener('click',function(ev){
  var t=ev.target&&ev.target.closest?ev.target.closest('#'+ID+' [data-tu]'):null;
  if(!t||!etat.enCours)return;
  var a=t.getAttribute('data-tu'),s=etat.enCours;
  if(a==='ecouter'){lireEtape_(s,true);return;}
  if(a==='passer'){fermer_(true);return;}
  if(a==='prec'&&s.i>0){s.i-=1;afficherEtape_(true);return;}
  if(a==='suiv'){
    if(s.i>=s.guide.etapes.length-1)fermer_(true);
    else{s.i+=1;afficherEtape_(true);}
  }
},true);
/* Un clic sur l'enceinte flottante (fenêtre réduite) la rouvre ; rien d'autre ne se passe. */
document.addEventListener('click',function(ev){
  var b=document.getElementById(ID);
  if(!b||!b.classList.contains('reduit')||!ev.target||!ev.target.closest||!ev.target.closest('#'+ID))return;
  ev.preventDefault();ev.stopPropagation();
  b.classList.remove('reduit');
  suivre_();
},true);
/*
 * Étape « avance au clic » : rien d'autre que la cible ne se clique (Norman, 2026-10-26 : « on ne doit pas pouvoir cliquer ailleurs que sur Fight »), et la cible elle-même reste bloquée tant que la voix parle. Les clics dans la fenêtre du tutoriel
 * (enceinte, Passer…) restent permis. Capture + arrêt immédiat : le jeu ne voit pas les clics refusés.
 */
function clicRefuse_(ev){
  var s=etat.enCours;
  if(!s||!s.attenteClic||!ev.target||!ev.target.closest)return false;
  if(ev.target.closest('#'+ID))return false;
  var e=s.guide.etapes[s.i],cible=e&&e.cible?cibler_(e.cible.selecteur):null;
  if(!cible)return false;   /* pas de cible à l'écran : jamais un écran verrouillé sans issue */
  if(s.sceneEnCours||voixVerrouille_(s))return true;   /* Lhu vole encore : rien ne se clique avant la fin de la scène */
  return !cible.contains(ev.target);
}
/*
 * Les refus sont posés sur WINDOW (phase de capture), pas sur document : la phase de capture de window passe AVANT celle de document, donc avant tous les autres écouteurs de capture de la page. Sur document, un écouteur enregistré plus tôt (le bouton
 * « Lire ce texte » de tutorial-tts-v202.js, chargé avant ce module) s'exécutait en premier : Norman (2026-10-27) a pu lancer la lecture de la chronique d'un boss pendant l'étape « clique sur Fight », ce qui a interrompu le tutoriel.
 */
['click','pointerdown','mousedown','mouseup','pointerup','dblclick','touchstart','touchend'].forEach(function(nom){
  window.addEventListener(nom,function(ev){
    if(!clicRefuse_(ev))return;
    /* un toucher (touchstart/touchend) n'est refusé que s'il est annulable ; le clic qui en découle est de toute façon refusé juste après */
    if(ev.cancelable)ev.preventDefault();
    ev.stopPropagation();ev.stopImmediatePropagation();
  },true);
});
/*
 * Étape « avance au clic » : un clic sur la cible (ou dedans) passe à l'étape suivante, APRÈS que le jeu a traité le clic (le bouton fait son travail, puis le guide avance). L'écouteur est en phase de capture pour ne rien
 * rater, mais l'avance est différée.
 */
document.addEventListener('click',function(ev){
  var s=etat.enCours;
  if(!s||!s.attenteClic||!ev.target||(ev.target.closest&&ev.target.closest('#'+ID)))return;
  var e=s.guide.etapes[s.i],cible=e&&e.cible?cibler_(e.cible.selecteur):null;
  if(!cible||!cible.contains(ev.target))return;
  var indice=s.i;
  var suite=function(){
    var c=etat.enCours;
    if(!c||c!==s||c.i!==indice)return;
    if(c.i>=c.guide.etapes.length-1)fermer_(true);
    else{c.i+=1;afficherEtape_();}
  };
  if(!e.attendreVictoire){setTimeout(suite,DELAI_APRES_CLIC_MS);return;}
  /* « Attendre la victoire » : la bulle se range, la suite ne vient qu'une fois le boss vaincu (record de boss en hausse), 5 minutes au plus. */
  var avant=recordBoss_(),debut=Date.now(),idAvant=idChronique_();
  var bb=document.getElementById(ID),cc=document.getElementById(ID_CADRE);if(bb)bb.hidden=true;if(cc)cc.hidden=true;retirerAnneaux_();
  (function sonde(){
    var c=etat.enCours;if(!c||c!==s||c.i!==indice)return;
    /* le boss suivant s'affiche (sa chronique porte un autre numéro) AVANT que le record soit relu : le voile tombe tout de suite */
    if(!document.documentElement.classList.contains(CLASSE_NOIR)&&idAvant&&idChronique_()&&idChronique_()!==idAvant)bossNoir_(true);
    if(recordBoss_()>avant||Date.now()-debut>300000){if(recordBoss_()>avant)bossNoir_(true);setTimeout(suite,DELAI_APRES_CLIC_MS);return;}
    setTimeout(sonde,120);
  })();
},true);
document.addEventListener('keydown',function(ev){
  if(ev.key==='Escape'&&etat.enCours&&etat.enCours.apercu)fermer_(false);
});
window.addEventListener('resize',function(){if(etat.enCours)suivre_();});

/* ---------- déclenchement automatique (joueurs) ---------- */

function recordBoss_(){
  try{var h=window.__SOREAL_IDLE_META_HOST_V130__,j=h&&typeof h.getIdleEtat==='function'?h.getIdleEtat():null;return Math.floor(Number(j&&j.systemes&&j.systemes.records&&j.systemes.records.highestBoss))||0;}catch(_e){return 0;}
}
function histoireOuModalEnCours_(){
  return Boolean(document.getElementById('sorealIdleHistoirePopupV1')||document.querySelector('.soreal-idle-modal-backdrop-v63'));
}

function demander_(cle,contexte,j){
  if(!aidesActives_())return;
  if(etat.demandes[cle])return;
  etat.demandes[cle]=true;
  appel_('obtenirTutorielSorealIdle',[contexte]).then(function(res){
    etat.ancienActif=false;   /* ancien tutoriel supprimé (Norman, 2026-10-26) */
    if(res&&typeof res.ancienMenusActif==='boolean')etat.ancienMenus=res.ancienMenusActif;
    var guides=res&&Array.isArray(res.guides)?res.guides:[];
    if(cle==='debut'){etat.debutResolu=true;etat.debutVuId=guides.length&&guides[0].vuId?String(guides[0].vuId):'';}   /* sert à introFinie() : le guide de départ est connu (ou absent) */
    var hote=window.__SOREAL_IDLE_META_HOST_V130__,jeu=(hote&&typeof hote.getIdleEtat==='function'&&hote.getIdleEtat())||j;
    for(var i=0;i<guides.length;i++){
      if(dejaVu_(jeu,guides[i].vuId))continue;
      if(etat.enCours)return;
      jouer_(guides[i],{marquerVu:true});
      return;
    }
  }).catch(function(){delete etat.demandes[cle];});
}

/* Appelée à CHAQUE rendu d'état par soreal-idle-ui.js. */
function considerer_(j){
  if(!j)return;
  if(etat.ancienActif===null&&!etat.initEnCours){
    etat.initEnCours=true;
    appel_('obtenirTutorielSorealIdle',[{}]).then(function(res){
      etat.ancienActif=false;   /* ancien tutoriel supprimé (Norman, 2026-10-26) */
      etat.ancienMenus=!(res&&res.ancienMenusActif===false);
    }).catch(function(){etat.initEnCours=false;});
  }
  if(etat.ancienActif===null||etat.enCours||histoireOuModalEnCours_())return;
  /* Le guide de départ ne commence qu'APRÈS l'introduction, une fois le bouton blanc pressé (Norman, 2026-10-26) : « bienvenue » est marqué à la fermeture de l'intro. */
  if(j.profil&&j.profil.nouveauJoueur&&bienvenueFaite_())demander_('debut',{debut:true},j);
  var m=menuActif_();
  if(m)demander_('menu:'+m,{menu:m},j);
  var sel=Math.floor(Number(j.bossSelection));
  if(sel>=2){
    var boss=sel-1,record=Math.floor(Number(j.systemes&&j.systemes.records&&j.systemes.records.highestBoss))||0;
    if(boss>=record)demander_('boss:'+boss,{boss:boss},j);
  }
}

/*
 * Vérification régulière (toutes les 1,5 s) EN PLUS de l'appel à chaque rendu : le jeu ne redessine entièrement la page que lors des changements de menu, donc au chargement le premier rendu a lieu avant que
 * le réglage « ancien tutoriel » soit connu, et plus aucun rendu complet ne suit tant que le joueur ne change pas de menu. Aucun appel réseau tant qu'il n'y a rien de nouveau (une demande par menu et par chargement).
 */
if(typeof setInterval==='function'){
  setInterval(function(){
    if(document.hidden)return;
    var h=window.__SOREAL_IDLE_META_HOST_V130__,j=h&&typeof h.getIdleEtat==='function'?h.getIdleEtat():null;
    if(j)considerer_(j);
  },1500);
}

/* ---------- sélecteur « placer sur l'écran » (éditeur) ---------- */

var CLASSES_VOLATILES=/^(selected|active|open|opened|hover|focus|disabled|drag-over|drag-source|visible|hidden|locked|ready|pret|ok|non|actif|oui|haut|bas|tuile|clignote|soreal-idle-tuto-indice-v1)$/;
function classesStables_(el){
  var out=[];
  Array.prototype.forEach.call(el.classList||[],function(c){
    if(CLASSES_VOLATILES.test(c))return;
    if(/\d{4,}/.test(c))return;
    out.push(c);
  });
  return out;
}
function unique_(sel,el){
  try{var l=document.querySelectorAll(sel);return l.length===1&&l[0]===el;}catch(_e){return false;}
}
function echapperId_(id){
  return (window.CSS&&CSS.escape)?CSS.escape(id):String(id).replace(/([^\w-])/g,'\\$1');
}
/* Un sélecteur court et stable pour cet élément : identifiant, attribut data-*, sinon chemin de classes (les classes d'état sont ignorées). */
function selecteurPour_(el){
  if(!el||el.nodeType!==1)return '';
  if(el.id&&/^[A-Za-z][\w-]{2,}$/.test(el.id)&&!/\d{6,}/.test(el.id)){var s0='#'+echapperId_(el.id);if(unique_(s0,el))return s0;}
  var attrs=el.attributes?Array.prototype.slice.call(el.attributes):[];
  for(var i=0;i<attrs.length;i++){
    var n=attrs[i].name;
    if(/^data-(tuto|tuile|menu|zone-id|equip-slot|alloc-cadre|titan-id|skill|vue|volet|bt-skill|id)/.test(n)&&attrs[i].value&&attrs[i].value.length<60&&!/["'\\]/.test(attrs[i].value)){
      var s1='['+n+'="'+attrs[i].value+'"]';
      if(unique_(s1,el))return s1;
      var tag=el.tagName.toLowerCase(),cl=classesStables_(el);
      var s1b=tag+(cl[0]?'.'+cl[0]:'')+s1;
      if(unique_(s1b,el))return s1b;
    }
  }
  /* Chemin : on remonte jusqu'à ce que le sélecteur soit unique. */
  var chemin=[],cur=el,garde=0;
  while(cur&&cur.nodeType===1&&cur!==document.body&&garde<7){
    garde+=1;
    var t=cur.tagName.toLowerCase(),c=classesStables_(cur).slice(0,2);
    var morceau=t+(c.length?'.'+c.map(echapperId_).join('.'):'');
    if(cur.id&&/^[A-Za-z][\w-]{2,}$/.test(cur.id)&&!/\d{6,}/.test(cur.id)){chemin.unshift('#'+echapperId_(cur.id));var sid=chemin.join(' > ');if(unique_(sid,el))return sid;break;}
    var parent=cur.parentElement;
    if(parent){
      var memes=Array.prototype.filter.call(parent.children,function(x){return x.tagName===cur.tagName&&(!c.length||c.every(function(k){return x.classList.contains(k);}));});
      if(memes.length>1)morceau+=':nth-of-type('+(Array.prototype.filter.call(parent.children,function(x){return x.tagName===cur.tagName;}).indexOf(cur)+1)+')';
    }
    chemin.unshift(morceau);
    var sel=chemin.join(' > ');
    if(unique_(sel,el))return sel;
    cur=parent;
  }
  var dernier=chemin.join(' > ');
  return unique_(dernier,el)?dernier:'';
}
function libellePour_(el){
  var t=(el.getAttribute&&(el.getAttribute('aria-label')||el.getAttribute('title')))||el.innerText||el.textContent||'';
  t=String(t).replace(/\s+/g,' ').trim().slice(0,60);
  return t||el.tagName.toLowerCase();
}

/*
 * choisirElement() : l'administrateur clique sur l'élément du jeu à montrer. Promesse : { selecteur, libelle } ou null s'il annule (Échap).
 * Tout le reste de la page est cliquable normalement SAUF pendant le choix : un voile transparent capte le clic.
 */
function choisirElement_(){
  installerStyle_();
  return new Promise(function(resolve){
    var voile=document.createElement('div');voile.id=ID_PICKER;
    voile.innerHTML='<div class="tu-pk-bandeau">🎯 Clique sur l’élément à montrer (Échap pour annuler)</div><div class="tu-pk-survol" hidden></div>';
    document.body.appendChild(voile);
    var survol=voile.querySelector('.tu-pk-survol'),courant=null;
    function sous_(x,y){
      var l=document.elementsFromPoint?document.elementsFromPoint(x,y):[document.elementFromPoint(x,y)];
      for(var i=0;i<l.length;i++){
        var e=l[i];
        if(!e||e===voile||voile.contains(e)||e===document.documentElement||e===document.body)continue;
        if(e.id===ID||e.id===ID_CADRE||(e.closest&&e.closest('#'+ID+',#'+ID_CADRE)))continue;
        return e;
      }
      return null;
    }
    function bouger_(ev){
      courant=sous_(ev.clientX,ev.clientY);
      if(!courant){survol.hidden=true;return;}
      var r=courant.getBoundingClientRect();
      survol.hidden=false;survol.style.left=r.left+'px';survol.style.top=r.top+'px';survol.style.width=r.width+'px';survol.style.height=r.height+'px';
    }
    function fin_(res){
      document.removeEventListener('keydown',touche_,true);
      if(voile.parentNode)voile.parentNode.removeChild(voile);
      resolve(res);
    }
    function touche_(ev){if(ev.key==='Escape'){ev.preventDefault();ev.stopPropagation();fin_(null);}}
    voile.addEventListener('pointermove',bouger_);
    voile.addEventListener('pointerdown',function(ev){bouger_(ev);});
    voile.addEventListener('click',function(ev){
      ev.preventDefault();ev.stopPropagation();
      bouger_(ev);
      var el=courant;
      if(!el){fin_(null);return;}
      fin_({selecteur:selecteurPour_(el),libelle:libellePour_(el)});
    });
    document.addEventListener('keydown',touche_,true);
  });
}

window.__SOREAL_IDLE_TUTORIEL_V1__={
  declarerVoix:declarerVoix_,
  cleVoix:cleVoix_,
  considerer:considerer_,
  jouer:jouer_,
  fermer:function(){fermer_(false);},
  enCours:function(){return Boolean(etat.enCours);},
  /*
   * L'introduction d'un NOUVEAU joueur est-elle entièrement terminée ? (Norman, 2026-11-01 : « pour un nouveau joueur, les popups des objets débloqués (Garderie, portrait…) n'arrivent qu'après toute l'introduction ».) Vrai pour un joueur existant. Pour un nouveau : l'intro en images est finie (« bienvenue » vu),
   * le guide de départ est connu ET terminé (vu) ou absent, aucun guide ni fenêtre d'histoire n'est ouvert. Les popups d'annonce attendent cette condition au lieu de s'intercaler entre deux étapes.
   */
  introFinie:function(j){
    try{
      var hote=window.__SOREAL_IDLE_META_HOST_V130__;
      j=j||(hote&&typeof hote.getIdleEtat==='function'&&hote.getIdleEtat())||null;
      if(!j||!j.profil||!j.profil.nouveauJoueur)return true;
      if(!bienvenueFaite_())return false;
      if(document.getElementById('sorealIdleIntroDiapoV1')||histoireOuModalEnCours_())return false;
      if(etat.enCours)return false;
      if(!etat.debutResolu)return false;
      if(etat.debutVuId&&!dejaVu_(j,etat.debutVuId))return false;
      return true;
    }catch(_e){return true;}
  },
  choisirElement:choisirElement_,
  /* null tant que le réglage n'est pas connu ; l'ancien tutoriel n'est joué que si le serveur a dit « actif » (jamais par défaut pendant l'attente). */
  ancienActif:function(){return etat.ancienActif;},
  ancienPermis:function(){return false;},   /* ancien tutoriel supprimé (Norman, 2026-10-26) : seuls les guides de l'Admin et l'introduction restent */
  /* Même règle pour les anciennes fenêtres d'explication de chaque menu (réglage séparé). */
  ancienMenusPermis:function(){return etat.ancienMenus===true;},
  /* Après un changement du réglage dans l'éditeur. */
  definirAncienActif:function(v){etat.ancienActif=Boolean(v);},
  definirAncienMenus:function(v){etat.ancienMenus=Boolean(v);},
  /* Outils de test. */
  aidesActives:aidesActives_,
  definirAides:definirAides_,
  etat:function(){return etat;},
  bossNoir:bossNoir_,devoilerBoss:devoilerBoss_,programmerDevoilement:programmerDevoilement_,
  selecteurPour:selecteurPour_,
  libellePour:libellePour_,
  placer:placer_,
  esc:esc_
};
})();
