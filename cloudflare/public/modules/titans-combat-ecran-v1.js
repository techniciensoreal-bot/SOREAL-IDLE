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

/* Le journal des attaques est une fenêtre autonome (modules/journal-attaques-v1.js), accessible aussi hors combat et sur la page Aventure. */
function basculerJournal(){
  var api=window.__SOREAL_IDLE_JOURNAL_ATTAQUES_V1__;
  if(api&&api.ouvrir)api.ouvrir();
}
var cleIdentite='';
var verrou=null;

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
    '#'+ID+'{position:fixed;left:0;right:0;bottom:0;top:var(--tcv-top,0px);z-index:70;display:flex;flex-direction:column;gap:8px;box-sizing:border-box;padding:8px 10px calc(8px + env(safe-area-inset-bottom,0px));overflow:hidden;overscroll-behavior:none;touch-action:manipulation;',
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
  if(b&&premiere){
    /* Seule une VRAIE barre collante en haut de page compte (téléphone : ~60 px) ; sur PC le menu est une colonne de plus de 1 000 px, qui n'est pas au-dessus du bandeau (Norman, 2026-10-14 : « sur PC l'écran n'est pas plein écran, il faut descendre 2 fois avec la molette ») : l'ancien calcul la prenait pour une barre et ne faisait pas remonter la page. */
    var nav=document.querySelector('.soreal-idle-nav-v28'),collant=0;
    if(nav&&getComputedStyle(nav).position==='sticky'){var rn=nav.getBoundingClientRect();if(rn.top<=2&&rn.height<=220)collant=rn.bottom;}
    var voulu=Math.round(b.getBoundingClientRect().top-collant-4);
    /* Page trop courte pour remonter le bandeau tout en haut : une cale temporaire la rallonge, retirée à la fin du combat. */
    var racine=document.documentElement,possible=Math.max(0,racine.scrollHeight-window.innerHeight-window.scrollY);
    var cale=document.getElementById(ID+'Cale');
    if(voulu>possible){
      if(!cale){cale=document.createElement('div');cale.id=ID+'Cale';cale.setAttribute('aria-hidden','true');document.body.appendChild(cale);}
      cale.style.cssText='height:'+(voulu-possible+8)+'px;pointer-events:none';
    }
    if(voulu!==0)window.scrollBy({top:voulu,left:0,behavior:'instant'});
  }
  var top=b?Math.max(0,Math.round(b.getBoundingClientRect().bottom+6)):0;
  if(el.style.getPropertyValue('--tcv-top')!==top+'px')el.style.setProperty('--tcv-top',top+'px');
}
function afficher(f){
  css();
  var identite=String(f.titanId)+'|'+String(f.titanStartedAt||'')+'|'+String(f.titanTier||'')+'|'+String(f.titanForm);
  var el=document.getElementById(ID);
  if(!el||cleIdentite!==identite){construire(f);cleIdentite=identite;}
  el=document.getElementById(ID);
  var premiere=el.hidden||!document.body.classList.contains('tcv-actif');
  el.hidden=false;
  document.body.classList.add('tcv-actif');
  poserHaut(premiere);
  var zone=document.getElementById('ttnCombatEtatsV1');
  if(zone){var t=etats(f);if(zone.__t!==t){zone.__t=t;zone.innerHTML=t;}}
}

function masquer(){
  var cale=document.getElementById(ID+'Cale');
  if(cale&&cale.parentNode)cale.parentNode.removeChild(cale);
  var el=document.getElementById(ID);
  if(el&&!el.hidden){el.hidden=true;el.innerHTML='';}
  cleIdentite='';
  document.body.classList.remove('tcv-actif');
}

function suivre(){
  if(document.hidden)return;
  var f=combat();
  if(f&&surPageTitans())afficher(f);else masquer();
}

function quitter(){
  if(typeof window.__arreterCombatTitanV1__==='function')window.__arreterCombatTitanV1__();
  masquer();
  /* retour à la vue Aventure (zones), en Zone sûre */
  if(typeof window.__vueAventureIdleV1__==='function')window.__vueAventureIdleV1__('zones');
}

if(typeof setInterval==='function')verrou=setInterval(suivre,250);

window.__SOREAL_IDLE_TITAN_ECRAN_V1__={suivre:suivre,actif:function(){var el=document.getElementById(ID);return Boolean(el&&!el.hidden);},quitter:quitter,journal:basculerJournal,combat:combat,simuler:function(f){faux=f||null;suivre();},etats:etats,construire:construire};
})();
