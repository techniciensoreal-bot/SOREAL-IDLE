/*
 * SOREAL IDLE — popup d'histoire plein écran (Norman, 2026-09-27) : « Le Magicien et la Grotte ».
 * Dès la mort du boss 17 (la toute première fois, jamais rejoué ensuite), le joueur ne voit pas
 * tout de suite le boss 18 : un popup plein écran affiche 5 images (idle/story/MagicienEtLaGrotte/
 * sur R2, dans l'ordre alphabétique du nom de fichier) avec un texte de narrateur sous chacune,
 * lu par la voix neurale déjà en place (modules/tutorial-tts-v202.js). Le popup se ferme en fade
 * out une fois les 5 étapes lues, révélant l'écran Fight Boss (boss 18) déjà rendu dessous.
 *
 * « Uniquement la première fois » : mémoire « vu » server-side (profil.stats.vus,
 * marquerVusSorealIdle), le même mécanisme que les popups de menus/tutoriels/bienvenue -- jamais
 * rejoué après un Rebirth, un autre appareil ou un localStorage vidé (voir soreal-idle-ui.js,
 * idleVuConnuV1_/idleVuMarquerV1_, exposé ici via window.__soreal_idle_marquer_vu_v1__).
 *
 * Popup indépendant du rendu de page (soreal-idle-ui.js régénère le HTML de la page active à
 * chaque poll d'état, y compris pendant ce popup, tant que le combat n'a pas repris -- voir
 * fightBossDomStableV179) : un <div> à part est ajouté à document.body, jamais recréé une fois
 * la séquence démarrée, pour ne pas interrompre le fondu/l'image/la narration en cours.
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_STORY_POPUP_V1__)return;

var STORY_ID='MagicienEtLaGrotte';
var VU_ID='histoire:magicienEtLaGrotte';
var OVERLAY_ID='sorealIdleHistoirePopupV1';
var STYLE_ID='sorealIdleHistoirePopupStyleV1';

/* Textes exacts fournis par Norman (2026-09-27) -- rédaction originale SOREAL, jamais du wiki NGU. */
var ETAPES=[
  {texte:"Épuisé, couvert de bleus, et légèrement sourd à cause de l'explosion, tu titubes jusqu'à cette mystérieuse hutte. Et, en effet, il semble bien que ce soit la demeure de ce fameux 'sorcier', qui qu'il soit."},
  {texte:"Tu vois le chaudron bouillonnant tout ce qu'il y a de plus stéréotypé, divers ingrédients magiques dégoûtants, et étrangement, des dizaines de bombes d'air comprimé vides éparpillées sur le sol. Cependant, c'est le sorcier aux yeux globuleux qui capte ton attention, alors qu'il pousse des cris de joie hystériques, te saluant comme un vieil ami. Vu ta perte de mémoire, tu le crois sur parole quand il dit que vous vous connaissiez déjà. Il prétend pouvoir t'aider si tu passes par ce qu'il appelle la 'grotte brumeuse' juste derrière chez lui pour récolter 'un peu de cette bonne came', peu importe ce que c'est."},
  {texte:"Te sentant étrangement magnanime, tu acceptes de l'aider, et tu pars vers la grotte. 'Attends-toi à tout dans cette grotte, l'ami ! Les gaz bizarres là-dedans te rendent un peu zinzin ! Et si t'as besoin d'un petit coup de pouce pour devenir plus fort, va voir M. Jensen, quelques maisons plus loin, il te filera un peu de ce qu'il appelle des 'augmentations'. C'est un truc de science-fiction bizarroïde, mais j'peux pas nier que ça marche !'"},
  {texte:"Tu es un peu refroidi par son avertissement étrange, et par son attitude générale, mais tu décides quand même de continuer."},
  {texte:"Dès ta première inspiration à l'intérieur, tu *sais* immédiatement ce que le sorcier voulait dire. L'air semble... léger, très léger. Tu sens ton cerveau faire des sauts périlleux et des roues... et c'est là que tu le vois."}
];

/*
 * Vitesse de lecture approximative (aucune mesure fiable disponible pour la voix Piper « Tom » en
 * français à ce jour) -- utilisée UNIQUEMENT en absence de narration réelle (voix indisponible),
 * ou comme plancher si la narration se termine anormalement vite. Jamais une valeur de jeu au sens
 * d'AGENTS.md (règle n°1) : c'est un rythme de lecture, pas une statistique de boss/objet/zone.
 */
var CARACTERES_PAR_SECONDE=14;
var DUREE_MIN_MS=4000;
var DUREE_MAX_MS=30000;
function dureeApprox_(texte){
  var s=Math.max(DUREE_MIN_MS,Math.min(DUREE_MAX_MS,String(texte||'').length/CARACTERES_PAR_SECONDE*1000));
  return s;
}

function urlImage_(index){
  return '/api/idle/media/story?id='+encodeURIComponent(STORY_ID)+'&index='+encodeURIComponent(String(index));
}

function marquerVu_(){
  try{
    if(typeof window.__soreal_idle_marquer_vu_v1__==='function')window.__soreal_idle_marquer_vu_v1__(VU_ID);
  }catch(_e){}
}

function dejaVu_(j){
  try{
    var vus=j&&j.profil&&j.profil.stats&&j.profil.stats.vus;
    return Array.isArray(vus)&&vus.indexOf(VU_ID)!==-1;
  }catch(_e){
    return false;
  }
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
    '}';
  document.head.appendChild(style);
}

var enCours=false;

function considerer_(j){
  if(enCours)return;
  if(!j||Number(j.bossSelection)!==18)return;
  if(dejaVu_(j))return;
  enCours=true;
  /*
   * Norman (2026-09-27) : « Si on ne termine pas l'introduction complète [ou cette scène], elle sera
   * rejouée au prochain lancement du jeu depuis le début ». Contrairement aux popups « une seule fois »
   * classiques (bienvenue, menus), marqué vu SEULEMENT à la fin réelle (terminer_), jamais au démarrage :
   * quitter le jeu en plein milieu de cette séquence à 5 images ne doit jamais la considérer comme vue.
   */
  demarrer_();
}

function demarrer_(){
  installerStyle_();
  var overlay=document.createElement('div');
  overlay.id=OVERLAY_ID;
  overlay.innerHTML=
    '<button type="button" class="soreal-idle-histoire-passer-v1">Passer ›</button>'+
    '<img alt="">'+
    '<div class="soreal-idle-histoire-texte-v1"></div>';
  document.body.appendChild(overlay);

  var img=overlay.querySelector('img');
  var texteEl=overlay.querySelector('.soreal-idle-histoire-texte-v1');
  var boutonPasser=overlay.querySelector('.soreal-idle-histoire-passer-v1');

  var passageDemande=false;
  boutonPasser.addEventListener('click',function(){
    passageDemande=true;
    try{
      if(window.__SOREAL_IDLE_TUTORIAL_TTS_V209__&&typeof window.__SOREAL_IDLE_TUTORIAL_TTS_V209__.stop==='function'){
        window.__SOREAL_IDLE_TUTORIAL_TTS_V209__.stop();
      }
    }catch(_e){}
    terminer_(overlay);
  });

  requestAnimationFrame(function(){
    overlay.classList.add('soreal-idle-histoire-visible-v1');
  });

  function afficherImage_(index){
    img.style.opacity='0';
    setTimeout(function(){
      if(passageDemande)return;
      img.onload=function(){img.style.opacity='1';};
      img.onerror=function(){img.style.opacity='1';};
      img.src=urlImage_(index);
    },260);
  }

  function etape_(i){
    if(passageDemande)return;
    if(i>=ETAPES.length){terminer_(overlay);return;}
    var texte=ETAPES[i].texte;
    afficherImage_(i+1);
    texteEl.textContent=texte;

    var appele=false;
    var suivant=function(){
      if(appele||passageDemande)return;
      appele=true;
      etape_(i+1);
    };

    var plancher=dureeApprox_(texte);
    var debut=Date.now();
    /* Filet de sécurité : narrate_ appelle toujours son rappel exactement une fois (succès, échec ou voix indisponible) --
       voir tutorial-tts-v202.js -- mais un délai généreux au-delà du plancher couvre tout autre imprévu sans bloquer le joueur. */
    var securite=setTimeout(suivant,plancher+30000);

    var demarreTts=false;
    try{
      var tts=window.__SOREAL_IDLE_TUTORIAL_TTS_V209__;
      if(tts&&typeof tts.readText==='function'){
        demarreTts=tts.readText(texte,undefined,function(){
          var ecoule=Date.now()-debut;
          clearTimeout(securite);
          setTimeout(suivant,Math.max(0,plancher-ecoule));
        });
      }
    }catch(_e){
      demarreTts=false;
    }

    if(!demarreTts){
      clearTimeout(securite);
      setTimeout(suivant,plancher);
    }
  }

  etape_(0);
}

function terminer_(overlay){
  /* Vu seulement ici (fin réelle, ou clic sur « Passer » -- jamais une simple fermeture de l'app en cours de route). */
  marquerVu_();
  overlay.classList.remove('soreal-idle-histoire-visible-v1');
  setTimeout(function(){
    if(overlay&&overlay.parentNode)overlay.parentNode.removeChild(overlay);
  },520);
}

window.__SOREAL_IDLE_STORY_POPUP_V1__={
  considerer:considerer_,
  /* Outils de test. */
  dejaVu:dejaVu_,
  dureeApprox:dureeApprox_,
  urlImage:urlImage_,
  etapes:function(){return ETAPES.slice();}
};
})();
