/*
 * ÉCRAN DE COMBAT DE TITAN (Norman, 2026-10-13) : « quand on affronte un Titan, un écran spécial prévu uniquement pour le combat de titan : tout tient sur le même écran, on ne peut pas défiler, toutes les
 * attaques manuelles, l'image du titan, les PV du joueur et du titan. On n'irait plus en mode Aventure : on reste dans l'écran Titans, avec une mise en page plus bad ass. Si on clique sur Aventure, on arrête
 * le combat de titan et on est en Zone sûre. »
 *
 * Mise à jour (Norman, 2026-10-13) : les boutons Aventure / Titans de la page restent ceux de la page (même élément, jamais recopiés) : l'écran se pose SOUS eux ; le nom du titan reprend la police de la page Titans,
 * dans une couleur propre à chaque titan (orange pour Gordon Ramsay Bolton) ; les effets du combat (coups, buffs, soins…) sont ceux de combat-effets-v1.js, posés sur l'image du titan (id sorealIdleAdventureSceneMobV1) ;
 * un petit journal explique ce que fait chaque attaque.
 *
 * Le combat lui-même est inchangé (le tick d'Aventure de soreal-idle-ui.js le livre, en Zone sûre, comme avant) : cet écran n'est qu'une VUE posée par-dessus la page Titans tant qu'un combat de titan est actif.
 *  - Il réutilise les mêmes id que la scène d'Aventure pour les barres de vie (sorealIdleAdventureFightBarV1, ...JoueurBarV1, ...) : le tick y écrit déjà les PV, aucun second écrivain.
 *  - Les raccourcis d'attaque sont ceux de l'Aventure (rendreCommandesAdventureIdleV3_), rafraîchis par le même tick (recharges, paralysie, effets actifs).
 *  - Aucun défilement : l'écran occupe exactement la hauteur visible sous le menu ; l'image du titan prend la place qui reste.
 *  - Quitter le combat : même effet que choisir la Zone sûre (selectionnerZoneAdventureIdleV47_('safe')), ce que fait aussi le clic sur le menu Aventure.
 *
 *   window.__SOREAL_IDLE_TITAN_ECRAN_V1__ = { suivre, actif }
 */
(function(){
'use strict';

var LIBELLES_PALIERS={easy:'Easy',normal:'Normal',hard:'Hard',brutal:'Brutal'};
var ID='ttnCombatV1';
/* Couleur du nom, de l'aura et des barres de chaque titan (choix visuel, aucune valeur de jeu). */
var COULEURS={t1:'#ff8a1a',t2:'#6ee06a',t3:'#5ab8ff',t4:'#b583ff',t5:'#ff7ab8',t6:'#ff4a4a',nerd:'#ffe14a',godmother:'#ff6bd6',t7:'#36e0c8',hungers:'#ff6a3a',lobster:'#ff7f6e',amalgamate:'#b5e655',tippi:'#ffe6a0',traitor:'#e5e7eb'};
function couleur(id){return COULEURS[String(id)]||'#ffd166';}

/*
 * Un fond par titan (Norman, 2026-10-14) : « un fond par titan, en rapport avec son image, non animé, peu gourmand ». Chaque fond est dessiné d'après l'image du titan (décor, couleurs, ambiance) avec des dégradés CSS
 * et de petits motifs SVG intégrés au code : AUCUN fichier à télécharger, AUCUNE animation, peint une seule fois. Une couche sombre garde les barres et les textes lisibles. Couches : [image, taille, position].
 */
function rgba(hex,a){
  var h=String(hex||'#ffd166').replace('#','');
  if(h.length===3)h=h.replace(/./g,'$&$&');
  var n=parseInt(h,16);
  return 'rgba('+((n>>16)&255)+','+((n>>8)&255)+','+(n&255)+','+a+')';
}
/* Petit motif SVG répété (statique). */
function svgTuile(w,h,corps){
  return 'url("data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'">'+corps+'</svg>')+'")';
}
function fondTitan(id){
  var dg=function(x){return [x,'auto','0 0'];};
  var nuit=function(a){return dg('linear-gradient(rgba(0,0,0,'+a+'),rgba(0,0,0,'+a+'))');};
  var F={
    /* GRB : le chef, dans une cuisine de pierre grise ; flamme du fourneau et sang */
    t1:{base:'#1b1b1f',l:[dg('radial-gradient(ellipse 55% 40% at 14% 100%,rgba(255,140,30,.6),transparent 72%)'),dg('radial-gradient(ellipse 45% 50% at 85% 28%,rgba(160,12,12,.3),transparent 72%)'),nuit(.3),
      [svgTuile(96,48,'<rect width="96" height="48" fill="#4c4c52"/><rect x="2" y="2" width="44" height="20" fill="#5a5a60"/><rect x="26" y="26" width="44" height="20" fill="#56565c"/><path d="M0 0H96M0 24H96M0 48H96M0 0V24M48 0V24M24 24V48M72 24V48" stroke="#18181b" stroke-width="3" fill="none"/>'),'96px 48px','0 0']]},
    /* Grand Arbre corrompu : fond bleu-vert, tronc brun tordu, feuilles violettes, racines */
    t2:{base:'#123a40',l:[dg('linear-gradient(0deg,#4a2c12 0,#5a3818 10%,transparent 32%)'),dg('linear-gradient(90deg,transparent 36%,rgba(96,56,22,.62) 43% 57%,transparent 64%)'),nuit(.22),
      [svgTuile(130,130,'<g fill="#6b4fb0" opacity=".7"><ellipse cx="20" cy="22" rx="13" ry="6" transform="rotate(30 20 22)"/><ellipse cx="88" cy="40" rx="14" ry="6" transform="rotate(-25 88 40)"/><ellipse cx="52" cy="92" rx="13" ry="6" transform="rotate(50 52 92)"/><ellipse cx="112" cy="104" rx="12" ry="5" transform="rotate(-40 112 104)"/></g><g fill="#3f8f8a" opacity=".55"><ellipse cx="58" cy="30" rx="11" ry="5" transform="rotate(-10 58 30)"/><ellipse cx="14" cy="80" rx="11" ry="5" transform="rotate(20 14 80)"/></g><ellipse cx="100" cy="74" rx="9" ry="4" fill="#5bb04a" opacity=".5" transform="rotate(35 100 74)"/>'),'130px 130px','0 0'],
      dg('linear-gradient(180deg,#2c7479,#143c42)')]},
    /* Jake From Accounting : couloir de bureau, plafond à néons, murs vert-gris, sol clair */
    t3:{base:'#233f4a',l:[dg('linear-gradient(0deg,rgba(190,200,205,.4) 0,transparent 20%)'),
      ['repeating-linear-gradient(90deg,transparent 0 120px,rgba(255,255,255,.55) 120px 168px,transparent 168px 288px)','100% 7%','0 0'],
      dg('linear-gradient(90deg,rgba(25,70,80,.5) 0,transparent 14% 86%,rgba(25,70,80,.5) 100%)'),nuit(.3),
      ['repeating-linear-gradient(90deg,rgba(200,230,235,.18) 0 70px,transparent 70px 140px)','100% 34%','0 30%'],dg('linear-gradient(180deg,#9fc0cc,#3d6575 55%,#2a4854)')]},
    /* UUG : ogre vert moussu, lune-citrouille orange en haut à droite */
    t4:{base:'#142414',l:[dg('radial-gradient(circle at 92% 6%,rgba(255,150,20,.75) 0,rgba(255,120,10,.25) 12%,transparent 30%)'),dg('radial-gradient(ellipse 80% 35% at 50% 100%,rgba(70,120,40,.4),transparent 75%)'),nuit(.2),
      [svgTuile(90,90,'<g fill="#3b5a22" opacity=".6"><circle cx="14" cy="18" r="9"/><circle cx="62" cy="40" r="11"/><circle cx="34" cy="74" r="8"/><circle cx="80" cy="82" r="7"/></g><path d="M0 60C20 50 30 70 50 58S80 52 90 62" stroke="#2c4a1a" stroke-width="3" fill="none" opacity=".7"/>'),'90px 90px','0 0'],dg('linear-gradient(180deg,#1d331a,#0e1a0e)')]},
    /* Walderp : rayures rouges et blanches, foule de points colorés */
    t5:{base:'#2a0f12',l:[dg('radial-gradient(ellipse 60% 55% at 50% 50%,rgba(0,0,0,.55),transparent 75%)'),nuit(.45),
      [svgTuile(70,70,'<circle cx="10" cy="12" r="3" fill="#2e6bd0"/><circle cx="44" cy="30" r="3" fill="#f2c230"/><circle cx="24" cy="54" r="3" fill="#2aa05a"/><circle cx="60" cy="60" r="3" fill="#e0e0e0"/><circle cx="56" cy="8" r="2.5" fill="#d04a8a"/>'),'70px 70px','0 0'],
      ['repeating-linear-gradient(-35deg,#c8262c 0 34px,#efe9e0 34px 68px)','auto','0 0']]},
    /* La Bête : chenille verte, gueule rouge, antennes violettes, jungle de bulles vertes */
    t6:{base:'#0f2410',l:[dg('radial-gradient(ellipse 36% 42% at 30% 40%,rgba(230,30,40,.5),transparent 75%)'),dg('radial-gradient(circle at 20% 4%,rgba(170,60,200,.35),transparent 24%)'),nuit(.2),
      [svgTuile(110,110,'<g fill="#2f7a2c" opacity=".6"><circle cx="22" cy="26" r="20"/><circle cx="84" cy="22" r="13"/><circle cx="60" cy="72" r="23"/><circle cx="14" cy="92" r="12"/><circle cx="100" cy="96" r="14"/></g><g fill="#58b04a" opacity=".4"><circle cx="30" cy="30" r="8"/><circle cx="66" cy="66" r="9"/></g>'),'110px 110px','0 0'],dg('linear-gradient(180deg,#183a16,#0a180b)')]},
    /* L'Exil : spectre gris à capuche -- brume monochrome, bords noirs */
    t7:{base:'#161618',l:[dg('radial-gradient(ellipse 48% 56% at 50% 46%,transparent 0 30%,rgba(0,0,0,.7) 100%)'),dg('radial-gradient(ellipse 40% 50% at 50% 46%,rgba(150,150,160,.2),transparent 75%)'),
      ['repeating-linear-gradient(0deg,rgba(210,210,220,.06) 0 10px,transparent 10px 36px)','auto','0 0'],dg('linear-gradient(180deg,#2a2a2e,#0c0c0e)')]},
    /* Greasy Nerd : bombe « SPRAY » rouge -- mur de béton, nuage de peinture blanche en éventail, lueur rouge */
    nerd:{base:'#25272b',l:[dg('radial-gradient(ellipse 60% 30% at 70% 100%,rgba(220,30,40,.5),transparent 72%)'),dg('conic-gradient(from 80deg at 4% 30%,rgba(255,255,255,.34) 0 14deg,transparent 14deg)'),nuit(.15),
      [svgTuile(120,120,'<rect width="120" height="120" fill="#3a3c41"/><g fill="#2e3035" opacity=".8"><rect x="6" y="8" width="50" height="3"/><rect x="64" y="52" width="48" height="3"/><rect x="14" y="94" width="60" height="3"/></g><g fill="#4a4d54" opacity=".7"><circle cx="30" cy="40" r="2"/><circle cx="90" cy="20" r="2"/><circle cx="96" cy="100" r="2"/></g>'),'120px 120px','0 0']]},
    /* La Marraine : fée papillon sur un trône violet -- rideaux lavande, halo doré, étincelles roses */
    godmother:{base:'#2a1236',l:[dg('radial-gradient(ellipse 34% 40% at 50% 42%,rgba(255,225,120,.55),transparent 75%)'),
      [svgTuile(80,80,'<g fill="#ff9ad8"><circle cx="12" cy="14" r="1.8"/><circle cx="50" cy="36" r="1.4"/><circle cx="30" cy="66" r="1.8"/><circle cx="70" cy="70" r="1.4"/></g><g fill="#fff3b0"><circle cx="64" cy="10" r="1.4"/><circle cx="22" cy="42" r="1.2"/></g>'),'80px 80px','0 0'],nuit(.2),
      ['repeating-linear-gradient(90deg,rgba(150,100,200,.5) 0 46px,rgba(95,55,140,.5) 46px 92px)','auto','0 0'],dg('linear-gradient(180deg,#5b3a78,#2b1537)')]},
    /* IT HUNGERS : citrouille de lave -- espace noir étoilé, marbrures rouges, lueur orange */
    hungers:{base:'#120305',l:[dg('radial-gradient(ellipse 52% 46% at 50% 44%,rgba(255,140,20,.5),rgba(190,40,10,.25) 45%,transparent 76%)'),
      [svgTuile(100,100,'<g fill="#fff"><circle cx="12" cy="16" r="1"/><circle cx="70" cy="30" r="1.2"/><circle cx="40" cy="70" r="1"/><circle cx="88" cy="84" r="1"/></g><g fill="#ffd27a"><circle cx="54" cy="8" r="1"/><circle cx="20" cy="52" r="1.2"/></g>'),'100px 100px','0 0'],
      dg('radial-gradient(circle at 18% 80%,rgba(160,20,15,.45),transparent 34%)'),dg('radial-gradient(circle at 86% 22%,rgba(140,15,15,.4),transparent 32%)'),dg('linear-gradient(180deg,#220608,#0a0203)')]},
    /* ROCK LOBSTER : coucher de soleil orange, cercle de pierres au loin, herbe grise */
    lobster:{base:'#1a1410',l:[
      [svgTuile(260,60,'<g fill="#3c3a3c"><rect x="14" y="14" width="22" height="46"/><rect x="62" y="14" width="22" height="46"/><rect x="8" y="6" width="84" height="12"/><rect x="146" y="22" width="20" height="38"/><rect x="198" y="22" width="20" height="38"/><rect x="140" y="14" width="84" height="11"/></g>'),'260px 60px','50% 74%'],
      dg('linear-gradient(0deg,#4a4846 0,#3a3836 16%,transparent 28%)'),nuit(.12),dg('radial-gradient(ellipse 70% 40% at 50% 70%,rgba(255,200,90,.5),transparent 72%)'),dg('linear-gradient(180deg,#d4601c,#f08a3c 38%,#f6b868 66%,#4a4846 72%)')]},
    /* AMALGAMATE : tas de ferraille grise, mains couleur chair qui dépassent */
    amalgamate:{base:'#232326',l:[nuit(.2),
      [svgTuile(140,140,'<g><polygon points="0,30 40,10 56,46 14,62" fill="#7a7a7e"/><polygon points="60,0 110,16 96,52 56,40" fill="#5d5d62"/><polygon points="100,60 140,44 140,100 110,104" fill="#8a8a8e"/><polygon points="20,76 66,70 70,120 24,128" fill="#66666b"/><polygon points="74,84 104,106 86,140 60,124" fill="#929296"/><polygon points="0,110 22,100 28,140 0,140" fill="#5a5a5e"/></g><g fill="#d9a07c" opacity=".75"><ellipse cx="46" cy="58" rx="7" ry="3.5" transform="rotate(30 46 58)"/><ellipse cx="118" cy="34" rx="6" ry="3" transform="rotate(-20 118 34)"/></g><path d="M0 30L40 10L56 46L14 62Z M60 0L110 16L96 52L56 40Z M100 60L140 44V100L110 104Z M20 76L66 70L70 120L24 128Z" stroke="#1c1c1f" stroke-width="2" fill="none"/>'),'140px 140px','0 0']]},
    /* Tippi : rats bruns sur fond crème -- papier chaud, coins bruns, petite lueur verte au centre */
    tippi:{base:'#3a2c1a',l:[dg('radial-gradient(circle at 50% 44%,rgba(70,200,110,.28) 0,transparent 14%)'),dg('radial-gradient(ellipse 75% 70% at 50% 46%,transparent 0 35%,rgba(46,26,12,.82) 100%)'),nuit(.18),
      [svgTuile(90,90,'<g fill="#a07848" opacity=".45"><path d="M10 20c8-6 16 0 14 8s-12 8-14 0z"/><path d="M58 52c8-6 16 0 14 8s-12 8-14 0z"/><path d="M36 78c6-4 12 0 10 6s-9 6-10 0z"/></g>'),'90px 90px','0 0'],dg('linear-gradient(180deg,#e8d9b4,#b79a68)')]},
    /* Le Traître : silhouette à capuche bleue, visage blanc -- nuit de charbon, halo bleu autour de la capuche */
    traitor:{base:'#1c1e21',l:[dg('radial-gradient(ellipse 30% 40% at 50% 46%,rgba(28,90,140,.6),transparent 76%)'),dg('radial-gradient(ellipse 14% 12% at 50% 50%,rgba(255,255,255,.22),transparent 76%)'),
      dg('radial-gradient(ellipse 80% 70% at 50% 50%,transparent 40%,rgba(0,0,0,.6) 100%)'),dg('linear-gradient(180deg,#303337,#141517)')]}
  };
  return F[String(id)]||null;
}
/* Pose le fond du titan sur l'écran (ou, sans fond connu, laisse celui de la feuille de style). */
function poserFond(el,id){
  var f=fondTitan(id);
  if(!f){el.style.backgroundImage='';el.style.backgroundSize='';el.style.backgroundPosition='';el.style.backgroundRepeat='';el.style.backgroundColor='';return;}
  el.style.backgroundImage=f.l.map(function(x){return x[0];}).join(',');
  el.style.backgroundSize=f.l.map(function(x){return x[1];}).join(',');
  el.style.backgroundPosition=f.l.map(function(x){return x[2];}).join(',');
  el.style.backgroundRepeat=f.l.map(function(){return 'no-repeat';}).join(',');
  el.style.backgroundColor=f.base;
}

/* Le journal des attaques est une fenêtre autonome (modules/journal-attaques-v1.js), accessible aussi hors combat et sur la page Aventure. */
function basculerJournal(){
  var api=window.__SOREAL_IDLE_JOURNAL_ATTAQUES_V1__;
  if(api&&api.ouvrir)api.ouvrir();
}
var cleIdentite='';
var verrou=null;
var sortie=null;      /* animation de départ du titan vaincu en cours : {fin} */
var annonce=null;     /* écran « un titan approche » : {el, debut, max} */
var dernierDefil=0;   /* dernier défilement fait par le joueur (la page n'est pas re-alignée juste après) */
var DUREE_ADIEU_MS=5200,ANNONCE_MIN_MS=1700,ANNONCE_MAX_MS=12000;

function hote(){return window.__SOREAL_IDLE_META_HOST_V130__||{};}
function h(x){var f=hote().idleHtml_;return typeof f==='function'?f(x):String(x==null?'':x).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function gn(x,d){var f=hote().formatGrandNombreIdleV70_;return typeof f==='function'?f(x,d):String(Math.round(Number(x)||0));}

/* Le combat de titan en cours (même condition que le tick d'Aventure pour écrire les barres), ou null. */
var faux=null;   /* combat factice posé par les tests / la maquette (jamais en jeu) */
function combat(){
  if(faux)return faux;
  try{
    var etat=typeof window.__SOREAL_IDLE_LIRE_ETAT_V1__==='function'?window.__SOREAL_IDLE_LIRE_ETAT_V1__():null;
    var H=hote();
    var a=H.aventureMetaIdleV47_&&etat?H.aventureMetaIdleV47_(etat):null;
    var f=a&&a.fight;
    if(f&&f.active&&f.titanId)return f;
  }catch(_e){}
  return null;
}
/* La page des titans est une vue de la page Aventure : l'écran de combat couvre la page Aventure tant qu'un combat de titan est actif. */
function surPageTitans(){return Boolean(document.querySelector('.soreal-idle-page-root-v28[data-menu="aventure"]'));}

function urlImage(f){
  var p='id='+encodeURIComponent(String(f.titanId));
  if(f.titanForm>=0)p+='&form='+encodeURIComponent(String(f.titanForm));
  else if(f.titanTier)p+='&tier='+encodeURIComponent(String(f.titanTier));
  return '/api/idle/media/titan?'+p;
}

function css(){
  if(document.getElementById('ttnCombatStyleV1'))return;
  var st=document.createElement('style');
  st.id='ttnCombatStyleV1';
  st.textContent=[
    '#'+ID+'{position:fixed;left:var(--tcv-left,0px);right:var(--tcv-right,0px);bottom:0;top:var(--tcv-top,0px);z-index:70;display:flex;flex-direction:column;gap:8px;box-sizing:border-box;padding:8px 10px calc(8px + env(safe-area-inset-bottom,0px));overflow:hidden;overscroll-behavior:none;touch-action:manipulation;',
      'color:#ffe9dd;background:radial-gradient(ellipse 80% 55% at 50% 38%,#4a0d12 0%,#1f0509 55%,#0a0204 100%);font-family:var(--f-texte,"Russo One",sans-serif)}',
    '#'+ID+'[hidden]{display:none}',
    /* braises et vignette */
    '#'+ID+'::before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 50% 100%,rgba(255,90,20,.22),transparent 55%),radial-gradient(ellipse at 50% 50%,transparent 55%,rgba(0,0,0,.7) 100%)}',
    '#'+ID+' >*{position:relative;z-index:1}',
    '#'+ID+' .tcv-haut{flex:0 0 auto;display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;text-align:center}',
    '#'+ID+' .tcv-retour{padding:6px 14px;border:3px solid #000;border-radius:10px;font:inherit;font-weight:1000;font-size:13px;letter-spacing:.05em;color:#fff;background:linear-gradient(180deg,#6b6f7a,#33363f);box-shadow:3px 3px 0 #000;cursor:pointer}',
    '#'+ID+' .tcv-retour:active{transform:translate(2px,2px);box-shadow:1px 1px 0 #000}',
    /* même police que le nom du titan sur la page Titans, en couleur du titan */
    '#'+ID+' .tcv-nom{margin:0;font-family:Georgia,"Palatino Linotype",serif;font-weight:700;font-size:clamp(22px,5.4vw,36px);letter-spacing:.04em;line-height:1.1;color:var(--tcv-c,#ffd166);text-shadow:0 2px 0 #000,0 0 14px var(--tcv-c,#ffd166),0 0 30px var(--tcv-c,#ffd166)}',
    '#'+ID+' .tcv-ji{flex:0 0 34px;text-align:center;font-size:22px}',
    '#'+ID+' .tcv-palier{padding:3px 12px;border:2px solid #000;border-radius:999px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;background:linear-gradient(180deg,#ff7a1a,#b3210f);color:#fff;box-shadow:0 0 12px rgba(255,100,20,.6)}',
    '#'+ID+' .tcv-etats{flex:0 0 auto;display:flex;gap:6px;flex-wrap:wrap;justify-content:center;min-height:0}',
    '#'+ID+' .tcv-etat{padding:3px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.25);background:rgba(0,0,0,.55);font-size:12px;font-weight:900;letter-spacing:.03em;color:#ffe9a8}',
    '#'+ID+' .tcv-etat.mal{color:#ff9a9a;border-color:rgba(255,90,90,.6);background:rgba(90,0,0,.55)}',
    /* la scène : l'image du titan prend toute la hauteur restante */
    '#'+ID+' .tcv-scene{flex:1 1 0;min-height:0;display:flex;align-items:center;justify-content:center;position:relative}',
    '#'+ID+' .tcv-halo{position:absolute;inset:6% 12%;border-radius:50%;background:radial-gradient(circle,var(--tcv-c,#ff5a14),transparent 68%);opacity:.38;filter:blur(10px);animation:tcvRespire 3.2s ease-in-out infinite alternate}',
    '#'+ID+' .tcv-titan{position:relative;height:100%;width:auto;max-width:100%;max-height:100%;object-fit:contain;image-rendering:pixelated;filter:drop-shadow(0 6px 0 rgba(0,0,0,.8)) drop-shadow(0 0 22px var(--tcv-c,#ff5a14));animation:tcvRespire 3.2s ease-in-out infinite alternate}',
    '#'+ID+' .tcv-emoji{position:relative;font-size:min(34vh,200px);line-height:1}',
    /* barres de vie : titan en haut, joueur dessous, même cadre métallique */
    '#'+ID+' .tcv-barres{flex:0 0 auto;display:grid;gap:6px}',
    '#'+ID+' .tcv-ligne{display:flex;align-items:center;gap:8px}',
    '#'+ID+' .tcv-ico{flex:0 0 auto;width:28px;text-align:center;font-size:20px;filter:drop-shadow(0 2px 0 #000)}',
    '#'+ID+' .tcv-barre{position:relative;flex:1;min-width:0;height:30px;overflow:hidden;border:3px solid #000;border-radius:8px;background:linear-gradient(180deg,#2a0a0e,#0d0305);box-shadow:inset 0 2px 6px rgba(0,0,0,.8),0 0 0 2px rgba(255,150,90,.35),0 0 16px rgba(255,60,20,.35)}',
    '#'+ID+' .tcv-barre.joueur{box-shadow:inset 0 2px 6px rgba(0,0,0,.8),0 0 0 2px rgba(120,220,150,.4),0 0 16px rgba(60,220,120,.3)}',
    '#'+ID+' .tcv-barre .soreal-idle-bossbar-v7,#'+ID+' .tcv-barre .soreal-idle-playerbar-v15{position:absolute;left:0;top:0;bottom:0;height:auto}',
    '#'+ID+' .tcv-pv{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:1000;font-size:15px;letter-spacing:.04em;color:#fff;text-shadow:0 1px 3px #000,0 0 6px #000;pointer-events:none}',
    /* raccourcis d'attaque : ceux de l'Aventure, toujours visibles, sur peu de lignes */
    '#'+ID+' .tcv-cmd{flex:0 0 auto;max-height:46vh;overflow:hidden}',
    '#'+ID+' .tcv-cmd .soreal-idle-adventure-manual-v3{margin:0;display:grid;gap:4px}',
    '#'+ID+' .tcv-cmd .soreal-idle-adventure-manual-grid-v3{display:grid!important;gap:4px}',
    '#'+ID+' .tcv-cmd .soreal-idle-adventure-skill-v3{min-height:44px;padding:3px 2px}',
    '@media (max-height:640px){#'+ID+' .tcv-cmd .soreal-idle-adventure-skill-v3{min-height:36px}#'+ID+' .tcv-barre{height:24px}#'+ID+' .tcv-nom{font-size:24px}}',
    '#'+ID+' .tcv-pied{flex:0 0 auto;display:flex;justify-content:center}',
    '#'+ID+' .tcv-fuir{padding:8px 22px;border:3px solid #000;border-radius:12px;font:inherit;font-weight:1000;letter-spacing:.06em;text-transform:uppercase;font-size:13px;color:#fff;background:linear-gradient(180deg,#6b6f7a,#33363f);box-shadow:3px 3px 0 #000;cursor:pointer}',
    '#'+ID+' .tcv-fuir:active{transform:translate(2px,2px);box-shadow:1px 1px 0 #000}',
    '@keyframes tcvRespire{from{transform:scale(1)}to{transform:scale(1.025)}}',
    '@media (prefers-reduced-motion:reduce){#'+ID+' .tcv-halo,#'+ID+' .tcv-titan{animation:none}}',
    'body.tcv-actif{overflow:hidden}',
    /* la page ne défile plus pendant le combat : elle est alignée une fois pour toutes sous les boutons Aventure / Titans */
    'html.tcv-actif{overflow:hidden!important}',
    /* boutons Aventure / Titans pendant un combat de Titan : rouge sombre, assorti au fond de l'écran de combat (Norman, 2026-10-14) */
    'html body.tcv-actif .soreal-idle-bascule-aventure-v1 .soreal-idle-expand-button-v25{background:linear-gradient(180deg,color-mix(in srgb,var(--tcv-c,#ff5a14) 40%,#000),color-mix(in srgb,var(--tcv-c,#ff5a14) 14%,#000))!important;border-color:color-mix(in srgb,var(--tcv-c,#ff5a14) 65%,#000)!important;color:#fff!important;text-shadow:0 1px 2px #000;opacity:1;filter:none}',
    'html body.tcv-actif .soreal-idle-bascule-aventure-v1 .soreal-idle-expand-button-v25.actif{background:linear-gradient(180deg,color-mix(in srgb,var(--tcv-c,#ff5a14) 55%,#000),color-mix(in srgb,var(--tcv-c,#ff5a14) 22%,#000))!important;border-color:var(--tcv-c,#ff5a14)!important;box-shadow:0 0 0 2px var(--tcv-c,#ff5a14),0 0 14px color-mix(in srgb,var(--tcv-c,#ff5a14) 55%,transparent)!important}',
    /* le Grand Arbre corrompu grandit en cours de combat : la hauteur de son image change en douceur */
    '#'+ID+' .tcv-titan.tcv-croit{transition:height .7s ease-out}',
    /* départ du titan vaincu : il rapetisse en tournant très vite sur lui-même, comme s'il partait au loin */
    '#'+ID+'.tcv-adieu .tcv-titan{animation:tcvAdieu 2.1s cubic-bezier(.5,.02,.85,.5) forwards!important;transition:none!important}',
    '#'+ID+'.tcv-adieu .tcv-halo{animation:tcvHaloAdieu 2.1s ease-in forwards}',
    '#'+ID+'.tcv-adieu .tcv-cmd,#'+ID+'.tcv-adieu .tcv-barres,#'+ID+'.tcv-adieu .tcv-etats{opacity:.25;pointer-events:none;transition:opacity .4s}',
    '#'+ID+' .tcv-adieu-msg{position:absolute;left:8px;right:8px;top:50%;transform:translateY(-50%);text-align:center;z-index:3;opacity:0;animation:tcvMsgEntree .7s 1.2s ease-out forwards;pointer-events:none}',
    '#'+ID+' .tcv-adieu-msg b{display:block;font-family:Bangers,"Comic Sans MS",cursive;font-weight:400;font-size:clamp(28px,7vw,54px);letter-spacing:.05em;color:var(--tcv-c,#ffd166);text-shadow:0 3px 0 #000,0 0 18px var(--tcv-c,#ffd166)}',
    '#'+ID+' .tcv-adieu-msg span{display:block;margin-top:6px;font-size:clamp(16px,3.6vw,24px);font-weight:900;color:#fff;text-shadow:0 2px 0 #000,0 0 10px #000}',
    '@keyframes tcvAdieu{0%{transform:scale(1) rotate(0deg);opacity:1}100%{transform:scale(.02) rotate(3240deg);opacity:0}}',
    '@keyframes tcvHaloAdieu{to{opacity:0;transform:scale(.1)}}',
    '@keyframes tcvMsgEntree{from{opacity:0;transform:translateY(-50%) scale(.85)}to{opacity:1;transform:translateY(-50%) scale(1)}}',
    /* écran « un titan approche » : plein écran, rouge, il tremble, le titan grossit au fil de l'attente */
    '#ttnAnnonceV1{position:fixed;top:0;bottom:0;left:0;right:0;z-index:100003;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;overflow:hidden;color:#fff;font-family:Bangers,"Comic Sans MS",cursive;text-align:center;opacity:1;transition:opacity .6s ease}',
    '#ttnAnnonceV1.ta-sortie{opacity:0;pointer-events:none}',
    '#ttnAnnonceV1 .ta-fond{position:absolute;inset:-4%;background:radial-gradient(ellipse at 50% 55%,#6b0a14 0%,#2a0409 45%,#050102 100%);animation:taAlerte 1.1s ease-in-out infinite alternate}',
    '#ttnAnnonceV1 .ta-eclair{position:absolute;inset:0;background:repeating-linear-gradient(115deg,transparent 0 46px,rgba(255,60,40,.07) 46px 50px);animation:taDefile 1.6s linear infinite}',
    '#ttnAnnonceV1 >*{position:relative;z-index:1}',
    '#ttnAnnonceV1 .ta-alerte{font-size:clamp(20px,4.6vw,34px);letter-spacing:.35em;color:#ff4a4a;text-shadow:0 0 14px #ff1a1a,0 3px 0 #000;animation:taClignote .7s steps(2,end) infinite}',
    '#ttnAnnonceV1 .ta-titan{display:flex;align-items:center;justify-content:center;width:min(60vw,48vh);height:min(60vw,48vh);animation:taApproche 7s cubic-bezier(.2,.6,.3,1) forwards,taSecousse .09s linear infinite}',
    '#ttnAnnonceV1 .ta-titan img{width:100%;height:100%;object-fit:contain;image-rendering:pixelated;filter:brightness(.55) contrast(1.1) drop-shadow(0 0 28px var(--tcv-c,#ff5a14))}',
    '#ttnAnnonceV1 .ta-titan b{font-size:min(40vh,300px);line-height:1;color:var(--tcv-c,#ff5a14);text-shadow:0 0 40px var(--tcv-c,#ff5a14),0 6px 0 #000}',
    '#ttnAnnonceV1 .ta-nom{font-size:clamp(34px,9vw,84px);letter-spacing:.06em;color:var(--tcv-c,#ffd166);text-shadow:0 4px 0 #000,0 0 26px var(--tcv-c,#ffd166),0 0 60px var(--tcv-c,#ffd166);animation:taSecousse .11s linear infinite}',
    '#ttnAnnonceV1 .ta-sous{font-family:var(--f-texte,"Russo One",sans-serif);font-size:clamp(15px,3.4vw,22px);letter-spacing:.18em;text-transform:uppercase;color:#ffd0c8;text-shadow:0 2px 0 #000}',
    '@keyframes taAlerte{from{filter:brightness(.8)}to{filter:brightness(1.35)}}',
    '@keyframes taClignote{50%{opacity:.15}}',
    '@keyframes taDefile{to{background-position:200px 0}}',
    '@keyframes taApproche{from{transform:scale(.18);opacity:.5}to{transform:scale(1);opacity:1}}',
    '@keyframes taSecousse{0%{translate:0 0}25%{translate:2px -2px}50%{translate:-2px 1px}75%{translate:1px 2px}100%{translate:0 0}}',
    '@media (prefers-reduced-motion:reduce){#ttnAnnonceV1 .ta-fond,#ttnAnnonceV1 .ta-eclair,#ttnAnnonceV1 .ta-alerte,#ttnAnnonceV1 .ta-nom,#ttnAnnonceV1 .ta-titan{animation:none!important}#ttnAnnonceV1 .ta-titan{transform:none}#'+ID+'.tcv-adieu .tcv-titan{animation:none!important;opacity:0}}',
    /* le bandeau collant des ressources (tuiles + barres, ~150 px) n'est pas utile pendant le combat et masquerait les boutons Aventure / Titans : replié, pas retiré */
    'body.tcv-actif #sorealIdleHudV2{max-height:0!important;overflow:hidden!important;visibility:hidden!important;margin:0!important;padding:0!important;border:0!important}'
  ].join('\n');
  document.head.appendChild(st);
}

function construire(f){
  css();
  /* un combat est en cours contre ce titan : il n'est plus un inconnu sur la page Titans */
  try{if(window.__SOREAL_IDLE_TITANS_V1__&&window.__SOREAL_IDLE_TITANS_V1__.marquerVu)window.__SOREAL_IDLE_TITANS_V1__.marquerVu(f.titanId);}catch(_e){}
  var el=document.getElementById(ID);
  /* Posé EN PREMIER dans le body : la scène d'Aventure (cachée sur la page Titans) porte les mêmes id de barres de vie et d'image ; getElementById renvoie le premier de l'arbre, donc c'est l'écran de combat qui reçoit les PV, les effets et les impacts. */
  if(!el){el=document.createElement('div');el.id=ID;document.body.insertBefore(el,document.body.firstChild);}
  var rendreCmd=typeof window.__rendreCommandesAdventureIdleV3__==='function'?window.__rendreCommandesAdventureIdleV3__:null;
  var palier=f.titanTier?(LIBELLES_PALIERS[f.titanTier]||String(f.titanTier)):'';
  el.innerHTML=
    '<div class="tcv-haut"><b class="tcv-nom">'+h(f.mobName||'Titan')+'</b>'+(palier?'<span class="tcv-palier">'+h(palier)+'</span>':'')+'</div>'+
    '<div class="tcv-etats" id="ttnCombatEtatsV1"></div>'+
    '<div class="tcv-scene"><div class="tcv-halo"></div>'+
      '<img id="sorealIdleAdventureSceneMobV1" class="tcv-titan" alt="'+h(f.mobName||'Titan')+'" src="'+h(urlImage(f))+'" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'block\'">'+
      '<span class="tcv-emoji" style="display:none">👹</span></div>'+
    '<div class="tcv-barres">'+
      '<div class="tcv-ligne"><span class="tcv-ico">👹</span><div class="tcv-barre"><div id="sorealIdleAdventureFightBarV1" class="soreal-idle-bossbar-v7" style="width:100%"></div><div id="sorealIdleAdventureFightPvV1" class="tcv-pv"></div></div></div>'+
      '<div class="tcv-ligne"><span class="tcv-ico">🧙</span><div class="tcv-barre joueur"><div id="sorealIdleAdventureJoueurBarV1" class="soreal-idle-playerbar-v15" style="width:100%"></div><div class="soreal-idle-adventure-player-pv-label-v1 tcv-pv"></div></div></div>'+
    '</div>'+
    '<div class="tcv-cmd">'+(rendreCmd?rendreCmd():'')+'</div>';
  el.style.setProperty('--tcv-c',couleur(f.titanId));
}

/* Effets en cours sur le joueur, lus sur l'état du combat de titan tenu par le tick (voir soreal-idle-ui.js, __titanEtatCombatIdleV1__). */
function etats(f){
  var e=typeof window.__titanEtatCombatIdleV1__==='function'?window.__titanEtatCombatIdleV1__():null;
  if(!e)return '';
  var maintenant=Date.now(),api=window.SorealTitanComportementsV1,out=[];
  if(typeof window.__titanJoueurParalyseIdleV1__==='function'&&window.__titanJoueurParalyseIdleV1__(maintenant))out.push('<span class="tcv-etat mal">⚡ Paralysé</span>');
  if(e.saignements>0&&api&&api.multRegenJoueur)out.push('<span class="tcv-etat mal">🩸 Saignement ×'+e.saignements+' · régénération '+Math.round(api.multRegenJoueur(f.titanId,e)*100)+' %</span>');
  if(e.attaques>1)out.push('<span class="tcv-etat">📈 Force du titan +'+Math.round((Math.pow(1.01,e.attaques-1)-1)*100)+' %</span>');
  if(e.affaibliJusqua>maintenant)out.push('<span class="tcv-etat mal">☁️ Tes dégâts sont réduits</span>');
  if(e.draineJusqua>maintenant)out.push('<span class="tcv-etat mal">☁️ Tu subis plus de dégâts</span>');
  return out.join('');
}

/* L'écran se pose sous les boutons Aventure / Titans de la page (le vrai élément, pas une copie) : ils restent identiques d'un menu à l'autre et cliquables. */
function poserHaut(premiere){
  var el=document.getElementById(ID);
  if(!el)return;
  var b=document.querySelector('.soreal-idle-bascule-aventure-v1');
  if(b&&(premiere||Date.now()-dernierDefil>1500)){
    /* Seule une VRAIE barre collante en haut de page (téléphone : ~60 px) compte ; sur PC le menu est une colonne de plus de 1 000 px, qui n'est pas au-dessus du bandeau (Norman, 2026-10-14 : « sur PC l'écran n'est pas plein écran, il faut descendre avec la molette ») : l'ancien calcul la prenait pour une barre et ne faisait pas remonter la page. */
    var nav=document.querySelector('.soreal-idle-nav-v28'),collant=0;
    if(nav&&getComputedStyle(nav).position==='sticky'){var rn=nav.getBoundingClientRect();if(rn.top<=2&&rn.height<=220)collant=rn.bottom;}
    var voulu=Math.round(b.getBoundingClientRect().top-collant-4);
    /*
     * La page est ré-alignée à CHAQUE passage tant que les boutons ne sont pas tout en haut (Norman, 2026-10-14, « de nouveau pas plein écran, j'ai dû baisser une fois ») : en début de combat la page change de hauteur
     * (la scène d'Aventure se replie, l'écran d'annonce disparaît) et le premier alignement ne suffisait plus. Une cale temporaire rallonge la page si elle est trop courte, retirée à la fin du combat.
     */
    if(Math.abs(voulu)>3){
      var racine=document.documentElement,possible=Math.max(0,racine.scrollHeight-window.innerHeight-window.scrollY);
      var cale=document.getElementById(ID+'Cale');
      if(voulu>possible){
        if(!cale){cale=document.createElement('div');cale.id=ID+'Cale';cale.setAttribute('aria-hidden','true');document.body.appendChild(cale);}
        cale.style.cssText='height:'+((parseInt(cale.style.height,10)||0)+(voulu-possible)+8)+'px;pointer-events:none';
      }
      window.scrollBy({top:voulu,left:0,behavior:'instant'});
    }
  }
  var top=b?Math.max(0,Math.round(b.getBoundingClientRect().bottom+6)):0;
  if(el.style.getPropertyValue('--tcv-top')!==top+'px')el.style.setProperty('--tcv-top',top+'px');
  /* Plein écran DE L'INTERFACE (Norman, 2026-10-14) : l'écran occupe la zone de la page (à droite des menus sur PC), les menus restent visibles. */
  var z=zoneInterface();
  if(el.style.getPropertyValue('--tcv-left')!==z.left+'px')el.style.setProperty('--tcv-left',z.left+'px');
  if(el.style.getPropertyValue('--tcv-right')!==z.right+'px')el.style.setProperty('--tcv-right',z.right+'px');
}
/* Zone de la page à droite de la colonne de menus (PC) ; sur téléphone, toute la largeur. */
function zoneInterface(){
  var b=document.querySelector('.soreal-idle-bascule-aventure-v1');
  if(!b||window.innerWidth<900)return {left:0,right:0};
  var r=b.getBoundingClientRect();
  return {left:Math.max(0,Math.round(r.left)),right:Math.max(0,Math.round(window.innerWidth-r.right))};
}
function afficher(f){
  css();
  var identite=String(f.titanId)+'|'+String(f.titanStartedAt||'')+'|'+String(f.titanTier||'')+'|'+String(f.titanForm);
  var el=document.getElementById(ID);
  if(!el||cleIdentite!==identite){construire(f);cleIdentite=identite;}
  el=document.getElementById(ID);
  if(el.__fond!==String(f.titanId)){el.__fond=String(f.titanId);poserFond(el,f.titanId);document.documentElement.style.setProperty('--tcv-c',couleur(f.titanId));}
  var premiere=el.hidden||!document.body.classList.contains('tcv-actif');
  el.hidden=false;
  document.body.classList.add('tcv-actif');
  document.documentElement.classList.add('tcv-actif');
  poserHaut(premiere);
  croissanceTitan(f);
  if(premiere)finirAnnonce();
  var zone=document.getElementById('ttnCombatEtatsV1');
  if(zone){var t=etats(f);if(zone.__t!==t){zone.__t=t;zone.innerHTML=t;}}
}

function masquer(){
  sortie=null;
  var cale=document.getElementById(ID+'Cale');
  if(cale&&cale.parentNode)cale.parentNode.removeChild(cale);
  document.documentElement.classList.remove('tcv-actif');
  document.documentElement.style.removeProperty('--tcv-c');
  var el=document.getElementById(ID);
  if(el)el.__fond='';
  if(el&&!el.hidden){el.hidden=true;el.innerHTML='';}
  cleIdentite='';
  document.body.classList.remove('tcv-actif');
  if(el)el.classList.remove('tcv-adieu');
}

function suivre(){
  if(document.hidden)return;
  if(sortie){
    if(Date.now()<sortie.fin)return;
    masquer();return;
  }
  var f=combat();
  if(f&&surPageTitans())afficher(f);else masquer();
}

/*
 * Le Grand Arbre corrompu (t2) grandit en cours de combat (Norman, 2026-10-14) : petit au départ, de plus en plus grand à mesure que sa force monte et que ses PV baissent, aussi grand que la place de l'écran le permet
 * à la moitié de ses PV (« quand il tape fort »). Mise à l'échelle par la HAUTEUR de l'image (le reste de l'écran ne bouge pas). Pur visuel : aucune valeur de jeu.
 */
function echelleTitan(f){
  if(!f||String(f.titanId)!=='t2')return 1;
  var max=Number(f.monsterHpMax)||0,pv=Number(f.monsterHp);
  if(!(max>0)||!isFinite(pv))return 1;
  var avance=Math.max(0,Math.min(1,(1-pv/max)/0.5));
  return 0.32+0.68*avance;
}
function croissanceTitan(f){
  var img=document.getElementById('sorealIdleAdventureSceneMobV1');
  if(!img||!img.classList||!img.classList.contains('tcv-titan'))return;
  var e=echelleTitan(f);
  if(String(f&&f.titanId)!=='t2'){if(img.style.height)img.style.height='';return;}
  img.classList.add('tcv-croit');
  var h=Math.round(e*100)+'%';
  if(img.style.height!==h)img.style.height=h;
}

/* ---------- écran « un titan approche » (pendant l'attente avant le combat) ---------- */
function retirerAnnonce(vite){
  var a=annonce;annonce=null;
  if(!a)return;
  clearTimeout(a.max);clearTimeout(a.fin);
  if(vite){if(a.el.parentNode)a.el.parentNode.removeChild(a.el);return;}
  a.el.classList.add('ta-sortie');
  setTimeout(function(){if(a.el.parentNode)a.el.parentNode.removeChild(a.el);},700);
}
/* opts : { id, nom, imageVisible } — l'image n'est montrée que si on a déjà affronté ce titan (sinon un « ? », comme sur la page Titans). */
function annoncer(opts){
  var o=opts||{};
  css();
  retirerAnnonce(true);
  var el=document.createElement('div');
  el.id='ttnAnnonceV1';
  el.setAttribute('role','alert');
  el.style.setProperty('--tcv-c',couleur(o.id));
  var nom=String(o.nom||'Titan');
  el.innerHTML='<div class="ta-fond"></div><div class="ta-eclair"></div>'+
    '<div class="ta-alerte">⚠ ALERTE ⚠</div>'+
    '<div class="ta-titan">'+(o.imageVisible?'<img alt="" src="'+h(urlImage({titanId:o.id,titanForm:-1,titanTier:''}))+'" onerror="this.parentNode.innerHTML=\'<b>?</b>\'">':'<b>?</b>')+'</div>'+
    '<div class="ta-nom">'+h(nom.toUpperCase())+'</div>'+
    '<div class="ta-sous">Un Titan approche…</div>';
  var za=zoneInterface();
  el.style.left=za.left+'px';el.style.right=za.right+'px';
  document.body.appendChild(el);
  annonce={el:el,debut:Date.now(),max:setTimeout(function(){retirerAnnonce(false);},ANNONCE_MAX_MS),fin:0};
}
/* Le combat vient de s'afficher : l'annonce disparaît, mais elle reste au moins un instant pour ne pas clignoter. */
function finirAnnonce(){
  var a=annonce;
  if(!a||a.fin)return;
  var reste=Math.max(0,ANNONCE_MIN_MS-(Date.now()-a.debut));
  a.fin=setTimeout(function(){retirerAnnonce(false);},reste);
}

/* ---------- départ du titan vaincu ---------- */
function infoRetour(id){
  var T=window.__SOREAL_IDLE_TITANS_V1__;
  return T&&typeof T.infoRetour==='function'?T.infoRetour(id):null;
}
function maintenant(){return typeof window.__SOREAL_IDLE_HEURE_V1__==='function'?window.__SOREAL_IDLE_HEURE_V1__():Date.now();}
function dureeTexte(ms){
  var T=window.__SOREAL_IDLE_TITANS_V1__;
  return T&&typeof T.duree==='function'?T.duree(ms):Math.ceil(ms/1000)+' s';
}
/* d : { id, nom } — le titan rapetisse en tournant à toute vitesse, puis « Nom sera de retour dans … ». */
function jouerAdieu(d){
  var el=document.getElementById(ID);
  if(!el||el.hidden||sortie)return;
  var id=String(d&&d.id||''),inf0=infoRetour(id),nom=String(inf0&&inf0.nom||d&&d.nom||'Le titan');
  sortie={fin:Date.now()+DUREE_ADIEU_MS};
  el.classList.add('tcv-adieu');
  var scene=el.querySelector('.tcv-scene');
  if(!scene)return;
  var msg=document.createElement('div');
  msg.className='tcv-adieu-msg';
  msg.innerHTML='<b>'+h(nom)+'</b><span>sera de retour dans <i data-tcv-retour>…</i></span>';
  scene.appendChild(msg);
  var t0=Date.now();
  function remplir(){
    var zone=msg.querySelector('[data-tcv-retour]');
    if(!zone||!sortie)return;
    var inf=infoRetour(id),n=inf&&Number(inf.nextAt)>0?Number(inf.nextAt)-maintenant():0;
    if(n>0){zone.textContent=dureeTexte(n);return true;}
    /* Le serveur n'a pas encore confirmé la victoire : au bout de 2,5 s on affiche le délai de base du titan. */
    if(Date.now()-t0>2500&&inf&&Number(inf.cooldown)>0){zone.textContent=dureeTexte(Number(inf.cooldown));return true;}
    return false;
  }
  var essais=0;
  (function boucle(){
    if(!sortie||!msg.parentNode)return;
    if(remplir()===true&&essais>6)return;
    essais+=1;
    if(essais<30)setTimeout(boucle,200);
  })();
}
window.addEventListener('soreal-titan-vaincu',function(ev){try{jouerAdieu(ev&&ev.detail);}catch(_e){}});
/* Le joueur fait défiler la page : pas de ré-alignement automatique pendant un instant. */
['wheel','touchmove'].forEach(function(nom){window.addEventListener(nom,function(){dernierDefil=Date.now();},{passive:true});});

function quitter(){
  if(typeof window.__arreterCombatTitanV1__==='function')window.__arreterCombatTitanV1__();
  masquer();
  /* retour à la vue Aventure (zones), en Zone sûre */
  if(typeof window.__vueAventureIdleV1__==='function')window.__vueAventureIdleV1__('zones');
}

if(typeof setInterval==='function')verrou=setInterval(suivre,250);

window.__SOREAL_IDLE_TITAN_ECRAN_V1__={annoncer:annoncer,finirAnnonce:finirAnnonce,jouerAdieu:jouerAdieu,echelleTitan:echelleTitan,suivre:suivre,actif:function(){var el=document.getElementById(ID);return Boolean(el&&!el.hidden);},quitter:quitter,journal:basculerJournal,combat:combat,simuler:function(f){faux=f||null;suivre();},etats:etats,construire:construire};
})();
