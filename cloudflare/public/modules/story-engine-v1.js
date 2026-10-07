/*
 * SOREAL IDLE — lecteur d'histoires plein écran (Norman, 2026-09-30) : remplace les deux modules figés
 * story-popup-v1.js / story-popup-2-v1.js. Les histoires ne sont plus dans le code : elles sont créées et modifiées par
 * l'administrateur dans le menu Admin (modules/admin-histoires-v1.js), stockées côté serveur (idle-histoires-v1.js).
 *
 * Déclenchement : « à la mort du boss N » = le prochain boss sélectionné est N+1 (bossSelection, état persistant sondé à chaque
 * rendu, exactement comme l'ancienne première histoire jouée dès que le boss 17 est mort). Le serveur ne renvoie QUE l'histoire du
 * boss demandé (obtenirHistoireBossSorealIdle) : jamais la liste des histoires ni leurs textes (anti-spoil, AGENTS.md règle n°2).
 *
 * « Uniquement la première fois » : mémoire « vu » côté serveur (profil.stats.vus, marquerVusSorealIdle), identifiant propre à
 * chaque histoire (vuId). Marquée vue SEULEMENT à la fin réelle (ou au clic sur « Passer »), jamais au démarrage : quitter le jeu en
 * plein milieu la rejouera au prochain lancement.
 *
 * Chaque étape = une image + un texte lu à voix haute (modules/tutorial-tts-v202.js) ; on passe à l'image suivante dès que la voix a
 * fini. Sans texte, l'image reste affichée le temps minimal. Popup indépendant du rendu de page : un <div> ajouté à document.body,
 * jamais recréé une fois la séquence démarrée.
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_STORY_ENGINE_V1__)return;

var OVERLAY_ID='sorealIdleHistoirePopupV1';
var STYLE_ID='sorealIdleHistoirePopupStyleV1';

/*
 * Vitesse de lecture approximative -- utilisée UNIQUEMENT en absence de narration réelle (voix indisponible), ou comme plancher si la
 * narration se termine anormalement vite. Jamais une valeur de jeu au sens d'AGENTS.md (règle n°1) : un rythme de lecture.
 */
var CARACTERES_PAR_SECONDE=14;
var DUREE_MIN_MS=4000;
var DUREE_MAX_MS=30000;
function dureeApprox_(texte){
  return Math.max(DUREE_MIN_MS,Math.min(DUREE_MAX_MS,String(texte||'').length/CARACTERES_PAR_SECONDE*1000));
}

/* Grâce courte après une lecture RÉELLEMENT terminée (jamais le plancher complet : « long écran noir avant la suite », 2026-09-27). */
var PAUSE_MIN_APRES_LECTURE_MS=500;

function dejaVu_(j,vuId){
  try{
    var vus=j&&j.profil&&j.profil.stats&&j.profil.stats.vus;
    return Array.isArray(vus)&&vus.indexOf(vuId)!==-1;
  }catch(_e){
    return false;
  }
}

function marquerVu_(vuId){
  try{
    if(vuId&&typeof window.__soreal_idle_marquer_vu_v1__==='function')window.__soreal_idle_marquer_vu_v1__(vuId);
  }catch(_e){}
}

function installerStyle_(){
  if(document.getElementById(STYLE_ID))return;
  var style=document.createElement('style');
  style.id=STYLE_ID;
  style.textContent=
    '#'+OVERLAY_ID+'{'+
      'position:fixed;inset:0;width:100vw;height:100dvh;z-index:999999;'+
      'display:flex;flex-direction:column;align-items:center;justify-content:center;'+
      'gap:18px;padding:24px;box-sizing:border-box;background:#05070d;'+
      'opacity:0;transition:opacity .5s ease;'+
    '}'+
    '#'+OVERLAY_ID+'.soreal-idle-histoire-visible-v1{opacity:1;}'+
    '#'+OVERLAY_ID+' img{'+
      'max-width:min(640px,92vw);max-height:52vh;object-fit:contain;'+
      'border-radius:14px;box-shadow:0 18px 50px rgba(0,0,0,.6);'+
      'opacity:0;transition:opacity .28s ease;background:#0b0f18;'+
    '}'+
    '#'+OVERLAY_ID+' .soreal-idle-histoire-texte-v1{'+
      'max-width:min(640px,92vw);color:#f1f4fb;font:500 16px/1.55 system-ui,sans-serif;'+
      'text-align:center;text-shadow:0 2px 10px rgba(0,0,0,.6);'+
    '}'+
    '#'+OVERLAY_ID+' .soreal-idle-histoire-passer-v1{'+
      'position:absolute;top:14px;right:16px;background:rgba(255,255,255,.08);'+
      'color:#c7d3ea;border:1px solid rgba(255,255,255,.22);border-radius:999px;'+
      'padding:6px 14px;font:700 12px/1 system-ui,sans-serif;cursor:pointer;'+
    '}'+
    '#'+OVERLAY_ID+' .soreal-idle-histoire-chargement-v1{'+
      'position:absolute;top:50%;left:50%;width:34px;height:34px;margin:-17px 0 0 -17px;'+
      'border-radius:50%;border:3px solid rgba(255,255,255,.18);border-top-color:#c7d3ea;'+
      'opacity:0;transition:opacity .2s ease;pointer-events:none;'+
    '}'+
    '#'+OVERLAY_ID+' .soreal-idle-histoire-chargement-v1.soreal-idle-histoire-chargement-visible-v1{'+
      'opacity:1;animation:soreal-idle-histoire-spin-v1 .9s linear infinite;'+
    '}'+
    '@keyframes soreal-idle-histoire-spin-v1{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}';
  document.head.appendChild(style);
}

var enCours=false;

function tts_(){
  try{return window.__SOREAL_IDLE_TUTORIAL_TTS_V209__||null;}catch(_e){return null;}
}

/*
 * Balises de voix dans le texte (Norman, 2026-09-30 : « faire intervenir la femme pour certaines phrases, avec une balise (homme)
 * (femme) »). « (femme) » fait lire ce qui suit par la voix de femme, « (homme) » par la voix d'homme (narrateur), jusqu'à la balise
 * suivante ; avant la première balise, la voix par défaut de l'étape (« Qui parle »). Les balises ne s'affichent jamais à l'écran ;
 * toute autre parenthèse du texte reste un texte normal. Renvoie { affiche, segments:[{voix:'homme'|'femme', texte}] }.
 */
/*
 * Voix nommées (Norman, 2026-10-01) : le registre modules/voix-nommees-v1.js reconnaît « (bohort) », « (Marius) »… comme « (femme) » ; la balise est
 * insensible à la casse, aux accents, aux espaces et aux tirets, et les anciens noms restent des alias. « (narrateur) » ramène à la voix du narrateur
 * (« homme »). Une parenthèse inconnue reste un texte normal.
 */
function normaliserBalise_(t){
  return String(t==null?'':t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
}
function resoudreVoix_(t){
  var n=normaliserBalise_(t);
  if(n==='homme'||n==='narrateur')return 'homme';
  if(n==='femme')return 'femme';
  var reg=window.__SOREAL_IDLE_VOIX_NOMMEES_V1__;
  return reg&&typeof reg.resoudre==='function'?reg.resoudre(t):'';
}
function segmenter_(texte,parleurParDefaut){
  var brut=String(texte==null?'':texte);
  var BALISE_RE=/\(\s*([^()\n]{1,40}?)\s*\)/g;
  var voix=resoudreVoix_(parleurParDefaut)||'homme';
  var segments=[];
  var dernier=0;
  var m;
  function ajouter(fin){
    var t=brut.slice(dernier,fin).replace(/\s+/g,' ').trim();
    if(t)segments.push({voix:voix,texte:t});
  }
  while((m=BALISE_RE.exec(brut))){
    var v=resoudreVoix_(m[1]);
    if(!v)continue;
    ajouter(m.index);
    voix=v;
    dernier=m.index+m[0].length;
  }
  ajouter(brut.length);
  /* Expressions et pauses (« (joyeux) », « (pause 2s) ») : lues par le module de narration, jamais affichées (Norman, 2026-10-08). */
  var affiche=segments.map(function(s){return s.texte;}).join(' ').replace(/\(\s*([^()\n]{1,40}?)\s*\)/g,function(tout,dedans){
    try{
      var t=tts_();
      if(t&&((typeof t.resoudreExpressionBalise==='function'&&t.resoudreExpressionBalise(dedans))||(typeof t.resoudrePauseBalise==='function'&&t.resoudrePauseBalise(dedans)>0)))return ' ';
    }catch(_e){}
    return tout;
  }).replace(/[ \t]{2,}/g,' ').trim();
  return {affiche:affiche,segments:segments};
}

function prechaufferEtape_(etapes,i){
  if(i<0||i>=etapes.length)return;
  try{
    var t=tts_();
    if(t&&typeof t.prechauffer==='function'){
      segmenter_(etapes[i].texte,etapes[i].parleur).segments.forEach(function(s){t.prechauffer(typeof t.retirerParentheses==='function'?t.retirerParentheses(s.texte):s.texte);});
    }
  }catch(_e){}
  /* Image de l'étape suivante chargée pendant la lecture de l'étape affichée. */
  try{
    if(etapes[i].imageUrl&&typeof Image==='function'){var pre=new Image();pre.src=etapes[i].imageUrl;}
  }catch(_e){}
}

/*
 * Joue une histoire { id, vuId, voix[], etapes:[{texte,imageUrl}] }. options.marquerVu===false : essai depuis le menu Admin (ne touche
 * pas à la mémoire « vu »). options.surFin : rappel appelé une fois la séquence terminée ou passée.
 */
function jouer_(histoire,options){
  if(enCours)return false;
  var etapes=histoire&&Array.isArray(histoire.etapes)?histoire.etapes:[];
  if(!etapes.length)return false;
  options=options||{};
  enCours=true;
  try{
    var t0=tts_();
    if(t0&&typeof t0.enregistrerVoixDynamiques==='function')t0.enregistrerVoixDynamiques(histoire.voix||[]);
  }catch(_e){}
  prechaufferEtape_(etapes,0);
  prechaufferEtape_(etapes,1);
  installerStyle_();
  var overlay=document.createElement('div');
  overlay.id=OVERLAY_ID;
  overlay.innerHTML=
    '<button type="button" class="soreal-idle-histoire-passer-v1">Passer ›</button>'+
    '<div class="soreal-idle-histoire-chargement-v1"></div>'+
    '<img alt="">'+
    '<div class="soreal-idle-histoire-texte-v1"></div>';
  document.body.appendChild(overlay);

  var img=overlay.querySelector('img');
  var texteEl=overlay.querySelector('.soreal-idle-histoire-texte-v1');
  var boutonPasser=overlay.querySelector('.soreal-idle-histoire-passer-v1');
  var chargementEl=overlay.querySelector('.soreal-idle-histoire-chargement-v1');

  var passageDemande=false;
  boutonPasser.addEventListener('click',function(){
    passageDemande=true;
    try{
      var t=tts_();
      if(t&&typeof t.stop==='function')t.stop();
    }catch(_e){}
    terminer_(overlay,histoire,options);
  });

  requestAnimationFrame(function(){
    overlay.classList.add('soreal-idle-histoire-visible-v1');
  });

  /* Une étape sans image garde l'image précédente à l'écran (utile pour enchaîner deux voix sur la même image). */
  function afficherImage_(url){
    if(!url){
      if(chargementEl)chargementEl.classList.remove('soreal-idle-histoire-chargement-visible-v1');
      return;
    }
    img.style.opacity='0';
    if(chargementEl)chargementEl.classList.add('soreal-idle-histoire-chargement-visible-v1');
    setTimeout(function(){
      if(passageDemande)return;
      img.onload=function(){
        img.style.opacity='1';
        if(chargementEl)chargementEl.classList.remove('soreal-idle-histoire-chargement-visible-v1');
      };
      img.onerror=function(){
        img.style.opacity='1';
        if(chargementEl)chargementEl.classList.remove('soreal-idle-histoire-chargement-visible-v1');
      };
      img.src=url;
    },260);
  }

  function etape_(i){
    if(passageDemande)return;
    if(i>=etapes.length){terminer_(overlay,histoire,options);return;}
    var decoupe=segmenter_(etapes[i].texte,etapes[i].parleur);
    var texte=decoupe.affiche;
    afficherImage_(etapes[i].imageUrl);
    texteEl.textContent=texte;
    prechaufferEtape_(etapes,i+1);

    var appele=false;
    var suivant=function(){
      if(appele||passageDemande)return;
      appele=true;
      etape_(i+1);
    };

    var plancher=dureeApprox_(texte);
    /* Filet de sécurité : la narration appelle toujours son rappel exactement une fois ; ce délai couvre tout autre imprévu. */
    var securite=setTimeout(suivant,plancher+30000);

    /*
     * Le rappel de readText arrive AUSSI quand la lecture échoue ou n'a jamais démarré (voix indisponible) : la grâce courte ne
     * s'applique que si un temps significatif s'est écoulé (preuve qu'un son a réellement joué), sinon on garde le plancher complet
     * pour laisser le temps de LIRE (régression du 2026-09-28 : « la scène défile super vite et je n'ai pas de voix »).
     */
    var PLANCHER_LECTURE_REELLE_MS=800;
    var debut=Date.now();
    var demarreTts=false;
    /* Fin de toute la lecture de l'étape (tous ses segments). */
    var finLecture=function(){
      var ecoule=Date.now()-debut;
      clearTimeout(securite);
      var attente=ecoule>=PLANCHER_LECTURE_REELLE_MS?PAUSE_MIN_APRES_LECTURE_MS:Math.max(0,plancher-ecoule);
      setTimeout(suivant,attente);
    };
    /* Les segments (une voix chacun) se lisent l'un après l'autre ; le suivant démarre dès que le précédent est fini. */
    var lireSegment=function(k){
      if(passageDemande)return;
      if(k>=decoupe.segments.length){finLecture();return;}
      var ok=false;
      try{
        var t=tts_();
        if(t&&typeof t.readText==='function'){
          ok=t.readText(typeof t.retirerParentheses==='function'?t.retirerParentheses(decoupe.segments[k].texte):decoupe.segments[k].texte,undefined,function(){lireSegment(k+1);});
        }
      }catch(_e){
        ok=false;
      }
      if(k===0)demarreTts=ok;
      else if(!ok)finLecture();
    };
    if(decoupe.segments.length)lireSegment(0);

    if(!demarreTts){
      clearTimeout(securite);
      setTimeout(suivant,plancher);
    }
  }

  etape_(0);
  return true;
}

function terminer_(overlay,histoire,options){
  /* Vu seulement ici (fin réelle, ou clic sur « Passer » -- jamais une simple fermeture de l'app en cours de route). */
  if(options.marquerVu!==false)marquerVu_(histoire&&histoire.vuId);
  enCours=false;
  overlay.classList.remove('soreal-idle-histoire-visible-v1');
  setTimeout(function(){
    if(overlay&&overlay.parentNode)overlay.parentNode.removeChild(overlay);
  },520);
  try{if(typeof options.surFin==='function')options.surFin();}catch(_e){}
}

/*
 * Déclencheur : appelé à chaque rendu d'état. « À la mort du boss N » = bossSelection vaut N+1. Le serveur n'est interrogé qu'UNE fois
 * par boss et par chargement de page ; il ne renvoie que l'histoire de ce boss (ou rien).
 */
var dejaVerifie={};
function considerer_(j){
  if(enCours)return;
  var selection=Math.floor(Number(j&&j.bossSelection));
  if(!(selection>=2))return;
  var boss=selection-1;
  if(dejaVerifie[boss])return;
  /*
   * Norman (2026-10-02) : en défi (ou après un Rebirth) on retue des boss déjà rencontrés : leur histoire ne se rejoue pas, même si elle n'avait jamais été
   * marquée vue (histoire ajoutée après coup). Seul un boss au-delà du record permanent (records.highestBoss) est « nouveau » ; au premier kill le record
   * vaut au plus ce boss : on ne bloque donc que les boss STRICTEMENT en dessous.
   */
  var record=Math.floor(Number(j&&j.systemes&&j.systemes.records&&j.systemes.records.highestBoss))||0;
  if(boss<record){dejaVerifie[boss]=true;return;}
  dejaVerifie[boss]=true;
  var appel=window.__SOREAL_IDLE_CALL_V1__;
  if(typeof appel!=='function')return;
  Promise.resolve(appel('obtenirHistoireBossSorealIdle',[boss])).then(function(res){
    var histoire=res&&res.histoire;
    if(!histoire||!Array.isArray(histoire.etapes)||!histoire.etapes.length)return;
    if(dejaVu_(j,histoire.vuId))return;
    jouer_(histoire,{marquerVu:true});
  }).catch(function(){
    /* Échec réseau : on retentera au prochain chargement (jamais marqué vu). */
    delete dejaVerifie[boss];
  });
}

window.__SOREAL_IDLE_STORY_ENGINE_V1__={
  considerer:considerer_,
  jouer:jouer_,
  enCours:function(){return enCours;},
  /* Outils de test. */
  dejaVu:dejaVu_,
  dureeApprox:dureeApprox_,
  segmenter:segmenter_
};
})();
