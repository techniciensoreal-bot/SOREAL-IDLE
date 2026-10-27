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
    '#'+ID+'.reduit{width:54px;height:54px;padding:0;border-radius:50%;overflow:hidden;cursor:pointer}'+
    '#'+ID+'.reduit>*{display:none}'+
    '#'+ID+'.reduit::after{content:"🔊";position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:24px;animation:tuReduit 1.6s ease-in-out infinite}'+
    '@keyframes tuReduit{0%,100%{opacity:.7}50%{opacity:1}}'+
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

function placer_(bulle,cadre,etape){
  var cible=etape&&etape.cible?cibler_(etape.cible.selecteur):null;
  var vw=window.innerWidth,vh=window.innerHeight,m=8;
  var bw=bulle.offsetWidth,bh=bulle.offsetHeight;
  var x,y,r=null;
  if(cible&&visible_(cible)){
    r=cible.getBoundingClientRect();
    if(cadre){
      if(etape.surbrillance!==false){
        cadre.hidden=false;
        cadre.style.left=(r.left-5)+'px';cadre.style.top=(r.top-5)+'px';cadre.style.width=(r.width+10)+'px';cadre.style.height=(r.height+10)+'px';
      }else cadre.hidden=true;
    }
  }else if(cadre)cadre.hidden=true;
  var p=String(etape&&etape.placement||'auto');
  if(!r||p==='centre'){
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
      champs:[{id:'texte',label:'Texte de l’étape',type:'texte'}],
      champsDepuisSource:true,
      original:function(){return {texte:String(e.texte||'')};},
      texteLu:function(v){return String(v&&v.texte||'');},
      apresEnregistrer:function(o){
        var A=window.__SOREAL_IDLE_ADMIN_TUTORIEL_V1__;
        if(A&&typeof A.majTexteEtape==='function')A.majTexteEtape(guide.id,i,String(o&&o.champs&&o.champs.texte||''));
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
    if(sur&&typeof sur.texte==='string'&&sur.texte.trim())brut=sur.texte;
    /* Norman (2026-10-23) : « ma fenêtre de tuto lit avec la voix de secours alors que les voix sont disponibles dans l'éditeur ». Les voix générées dans l'éditeur sont celles du texte DIT (le cadre des personnages, champ « parle »), pas du texte affiché : la lecture doit prendre ce texte-là, sinon l'empreinte du bloc ne correspond à aucun fichier et la voix de secours prend le relais. */
    var dit=T&&typeof T.parle==='function'?T.parle(cleVoix_(guide,i),'texte'):undefined;
    if(typeof dit==='string'&&dit.trim())brut=dit;
  }catch(_e){}
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
    var jeton=(s.jetonVoix||0)+1;s.jetonVoix=jeton;s.voixEnCours=true;s.voixLimite=Date.now()+90000;
    var demarre=tts.readText(t,null,function(){if(s.jetonVoix===jeton)s.voixEnCours=false;});
    if(!demarre)s.voixEnCours=false;
  }catch(_e){s.voixEnCours=false;}
}
function voixVerrouille_(s){
  if(!s||!s.voixEnCours)return false;
  if(Date.now()>(s.voixLimite||0)){s.voixEnCours=false;return false;}
  return true;
}
function taire_(){
  var tts=window.__SOREAL_IDLE_TUTORIAL_TTS_V209__;
  try{if(tts&&typeof tts.stop==='function')tts.stop();}catch(_e){}
}

/* ---------- lecture d'un guide ---------- */

function arreterBoucle_(){if(boucle){clearInterval(boucle);boucle=0;}}

function fermer_(vu){
  var s=etat.enCours;
  arreterBoucle_();
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

function afficherEtape_(garderTaille){
  var s=etat.enCours;if(!s)return;
  var e=s.guide.etapes[s.i];if(!e){fermer_(true);return;}
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
  var paragraphes=String(e.texte||'').split(/\n+/).filter(function(x){return x.trim();}).map(function(x){return '<p>'+esc_(x)+'</p>';}).join('');
  var dernier=s.i>=nbEtapes-1;
  /* « Avance au clic » : on attend le clic sur la cible (indice affiché, bouton Suivant masqué le temps du délai). */
  s.attenteClic=Boolean(e.avanceAuClic&&e.cible&&e.cible.selecteur);
  s.debutAttente=Date.now();
  /* Guide « sans fenêtre » (Norman, 2026-10-27 : « pour le premier tuto, rien ne doit apparaître à l'écran, ni texte ni fenêtre rétrécie ») : la fenêtre existe pour la logique (voix, clic) mais reste cachée ; le cadre lumineux de la cible n'est pas touché. */
  s.cache=s.guide.afficher===false;
  s.debutEtape=Date.now();
  s.tempsLecture=Math.max(2500,Math.min(60000,String(e.texte||'').length*60));
  b.hidden=s.cache;
  /* Une étape qui commence (départ du guide, avance au clic) s'ouvre réduite en enceinte ; un clic sur Précédent / Suivant garde la taille choisie. */
  b.classList.toggle('reduit',!garderTaille);
  b.innerHTML=
    (s.apercu?'<div class="tu-apercu">👁 Aperçu — rien n’est enregistré</div>':'')+
    '<div class="tu-haut"><span class="tu-titre">'+esc_(e.titre||s.guide.titre||'')+'</span><span class="tu-compte">'+(s.i+1)+'/'+nbEtapes+'</span></div>'+
    '<div class="tu-texte">'+paragraphes+'</div>'+
    (s.attenteClic?'<div class="tu-indice">👆 Clique sur l’élément entouré pour continuer.</div>':'')+
    '<div class="tu-actions">'+
      '<button type="button" class="discret" data-tu="ecouter" title="Écouter cette étape" aria-label="Écouter cette étape">🔊</button>'+
      '<button type="button" class="discret" data-tu="passer">'+(s.apercu?'Fermer':'Passer')+'</button>'+
      '<button type="button" data-tu="prec" '+(s.i<=0?'disabled':'')+'>◀ Précédent</button>'+
      '<button type="button" class="principal" data-tu="suiv" '+(s.attenteClic?'hidden':'')+'>'+(dernier?'Terminé ✔':'Suivant ▶')+'</button>'+
    '</div>';
  /* La cible peut mettre un instant à apparaître (changement de menu) : on la fait défiler dans l'écran dès qu'elle existe. */
  s.defile=false;s.essais=0;
  arreterBoucle_();
  boucle=setInterval(suivre_,200);
  suivre_();
  declarerVoix_(s.guide);
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
      var texteInd=verrou?'🔊 Écoute d’abord la voix : tu pourras ensuite cliquer sur l’élément entouré.':'👆 Clique sur l’élément entouré pour continuer.';
      if(ind.textContent!==texteInd)ind.textContent=texteInd;
    }
  }
  /* Sans fenêtre et sans clic demandé, personne ne peut cliquer sur « Suivant » : l'étape se termine toute seule quand la voix a fini (au moins 2,5 s, ou le temps de lire le texte si la voix est coupée). */
  if(s.cache&&!s.attenteClic&&!voixVerrouille_(s)&&Date.now()-s.debutEtape>=s.tempsLecture){
    var iEtape=s.i;
    if(s.i>=s.guide.etapes.length-1){fermer_(true);return;}
    s.i=iEtape+1;afficherEtape_(true);return;
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
  if(voixVerrouille_(s))return true;
  return !cible.contains(ev.target);
}
['click','pointerdown','mousedown','mouseup','pointerup','dblclick'].forEach(function(nom){
  document.addEventListener(nom,function(ev){
    if(!clicRefuse_(ev))return;
    ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();
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
  setTimeout(function(){
    var c=etat.enCours;
    if(!c||c!==s||c.i!==indice)return;
    if(c.i>=c.guide.etapes.length-1)fermer_(true);
    else{c.i+=1;afficherEtape_();}
  },DELAI_APRES_CLIC_MS);
},true);
document.addEventListener('keydown',function(ev){
  if(ev.key==='Escape'&&etat.enCours&&etat.enCours.apercu)fermer_(false);
});
window.addEventListener('resize',function(){if(etat.enCours)suivre_();});

/* ---------- déclenchement automatique (joueurs) ---------- */

function histoireOuModalEnCours_(){
  return Boolean(document.getElementById('sorealIdleHistoirePopupV1')||document.querySelector('.soreal-idle-modal-backdrop-v63'));
}

function demander_(cle,contexte,j){
  if(etat.demandes[cle])return;
  etat.demandes[cle]=true;
  appel_('obtenirTutorielSorealIdle',[contexte]).then(function(res){
    etat.ancienActif=false;   /* ancien tutoriel supprimé (Norman, 2026-10-26) */
    if(res&&typeof res.ancienMenusActif==='boolean')etat.ancienMenus=res.ancienMenusActif;
    var guides=res&&Array.isArray(res.guides)?res.guides:[];
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
  etat:function(){return etat;},
  selecteurPour:selecteurPour_,
  libellePour:libellePour_,
  placer:placer_,
  esc:esc_
};
})();
