/*
 * SOREAL IDLE — popup d'histoire plein écran, deuxième histoire (Norman, 2026-09-29) : suite du
 * « Magicien et la Grotte ». Même procédé exact que modules/story-popup-v1.js (voir son en-tête
 * pour le détail), à une différence structurelle près : le déclencheur n'est pas un boss principal
 * (bossSelection, sondé à chaque rendu) mais un boss de ZONE Aventure aléatoire (« A Fifth Giant
 * Mole », zone Cave) -- un évènement éphémère résolu côté client dans
 * terminerCombatAdventureLocalV2_ (soreal-idle-ui.js), pas un champ d'état persistant. Le
 * déclenchement se fait donc par un appel direct depuis la branche victoire de cette fonction
 * (voir considerer_ plus bas), jamais par un sondage à chaque poll d'état.
 *
 * « Uniquement la première fois » : mémoire « vu » server-side (profil.stats.vus,
 * marquerVusSorealIdle), exactement le même mécanisme que la première histoire -- jamais rejoué
 * après un Rebirth, un autre appareil ou un localStorage vidé.
 *
 * 10 images (idle/story/MagicienEtLeGrotte2/ sur R2, ordre alphabétique du nom de fichier), un
 * texte de narrateur sous chacune, lu par la voix neurale déjà en place
 * (modules/tutorial-tts-v202.js). Le popup se ferme en fade out une fois les 10 étapes lues,
 * révélant l'écran de jeu déjà rendu dessous.
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_STORY_POPUP_2_V1__)return;

var STORY_ID='MagicienEtLeGrotte2';
var VU_ID='histoire:magicienEtLaGrotte2';
var OVERLAY_ID='sorealIdleHistoirePopup2V1';
var STYLE_ID='sorealIdleHistoirePopup2StyleV1';
var MOB_NOM_DECLENCHEUR='A Fifth Giant Mole';

/* Textes exacts fournis par Norman (2026-09-29) -- rédaction originale SOREAL, jamais du wiki NGU. */
var ETAPES=[
  {texte:"Les taupes, amochées et couvertes de bleus, te laissent passer en grommelant « T'es vraiment un connard, Chad... » et tu aperçois enfin ton objectif, un gaz bleu épais qui stagne tout au fond de cette grotte."},
  {texte:"Tu brandis la petite cannette en métal que le sorcier t'a donnée, et avec un « WHOUMPF », la majeure partie du gaz semble se faire aspirer dedans."},
  {texte:"Sur le chemin du retour vers la hutte du sorcier, tu bidouilles la machine à voyager dans le temps, te regardant tuer la Gorgone encore et encore et empocher tout ce fric. Ah, les souvenirs... Peut-être que tu achèteras ce village une fois que ce sera fini."},
  {texte:"Peu après, tu te hisses à la surface, enfin capable d'avoir un moment de clarté dans ta tête. Le sorcier applaudit et glousse de joie en te voyant revenir. « Parfait, PARFAIT, j'étais presque à court de cette came. Stupéfait, tu le vois verser la cannette dans son chaudron et lui donner un petit coup, une partie du gaz bleu s'écoulant dans le mélange. Il remue une fois, deux fois, trois fois dans le sens des aiguilles d'une montre, et une fois dans l'autre sens, puis te fait signe d'approcher."},
  {texte:"« Bon, je peux pas résoudre tes problèmes de mémoire, mais je crois savoir qui pourrait le faire. Mais d'abord, tiens, prends une gorgée."},
  {texte:"Je sais pas ce qui est arrivé à tes pouvoirs magiques mais ça devrait au moins leur donner un coup de fouet ! » Ça a le goût d'un mélange de sirop contre la toux, de rhum et de tontes de pelouse, mais tu arrives à l'avaler. Ça a à peine le temps de s'installer dans ton estomac que tu sens une sensation... une sensation magique. Pourtant, ça ne te semble pas si étranger que ça. « Voilà, mon gars, tu devrais pouvoir faire quelques-uns de tes petits tours de magie ! Je suis sûr que le reste reviendra avec le temps. Maintenant, pour la personne qui pourrait t'aider... la dernière fois que j'ai entendu parler d'elle, elle se dirigeait vers cette fête interdimensionnelle. Tu sais, celle qui traverse l'espace et le temps, qui ne s'arrête jamais... et de l'alcool gratuit ! Tu devrais encore pouvoir la rattraper si tu te dépêches ! Elle doit encore voler quelque part dans le ciel ! »"},
  {texte:"Tu sors et regardes vers le ciel, avant de te rappeler... tu ne sais pas voler ! Le sorcier ricane en te voyant sauter en l'air pour rien. « T'as la MAGIE maintenant, tu te rappelles ?"},
  {texte:"Pff, les jeunes de nos jours, toujours à avoir la mémoire en vrac et... » Le sorcier marmonne de façon incompréhensible en rentrant chez lui. Un peu honteux, tu te concentres très fort, tu pars en courant, tu sautes..."},
  {texte:"Ouais, carrément ! Maintenant que tu es dans les airs, ça te semble presque naturel, tu plonges, tu fais des loopings... et tu rentres tête la première dans un flou jaune."},
  {texte:"Tu te reprends juste à temps pour voir un gamin bizarre avec une queue filer devant toi, l'air aussi content de lui que possible. Il est temps de lui donner une leçon."}
];

/*
 * Vitesse de lecture approximative -- même constante que la première histoire (aucune mesure
 * fiable disponible pour la voix Piper « Tom » en français à ce jour). Jamais une valeur de jeu
 * au sens d'AGENTS.md (règle n°1) : un rythme de lecture, pas une statistique de boss/objet/zone.
 */
var CARACTERES_PAR_SECONDE=14;
var DUREE_MIN_MS=4000;
var DUREE_MAX_MS=30000;
function dureeApprox_(texte){
  var s=Math.max(DUREE_MIN_MS,Math.min(DUREE_MAX_MS,String(texte||'').length/CARACTERES_PAR_SECONDE*1000));
  return s;
}

var PAUSE_MIN_APRES_LECTURE_MS=500;

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
    '}'+
    '#'+OVERLAY_ID+' .soreal-idle-histoire-chargement-v1{'+
      'position:absolute;top:50%;left:50%;width:34px;height:34px;margin:-17px 0 0 -17px;'+
      'border-radius:50%;border:3px solid rgba(255,255,255,.18);border-top-color:#c7d3ea;'+
      'opacity:0;transition:opacity .2s ease;pointer-events:none;'+
    '}'+
    '#'+OVERLAY_ID+' .soreal-idle-histoire-chargement-v1.soreal-idle-histoire-chargement-visible-v1{'+
      'opacity:1;animation:soreal-idle-histoire-spin-2-v1 .9s linear infinite;'+
    '}'+
    '@keyframes soreal-idle-histoire-spin-2-v1{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}';
  document.head.appendChild(style);
}

var enCours=false;

/*
 * Déclencheur : appelé directement depuis la branche victoire de terminerCombatAdventureLocalV2_
 * (soreal-idle-ui.js) avec le nom du mob et son statut de boss de zone -- jamais un sondage à
 * chaque rendu comme la première histoire (bossSelection est un état persistant, un combat
 * Aventure ne l'est pas).
 */
function considerer_(mobName,estBoss,j){
  if(enCours)return;
  if(!estBoss||String(mobName||'')!==MOB_NOM_DECLENCHEUR)return;
  if(dejaVu_(j))return;
  enCours=true;
  demarrer_();
}

function prechaufferEtape_(i){
  if(i<0||i>=ETAPES.length)return;
  try{
    var tts=window.__SOREAL_IDLE_TUTORIAL_TTS_V209__;
    if(tts&&typeof tts.prechauffer==='function')tts.prechauffer(ETAPES[i].texte);
  }catch(_e){}
}

function demarrer_(){
  prechaufferEtape_(0);
  prechaufferEtape_(1);
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
      img.src=urlImage_(index);
    },260);
  }

  function etape_(i){
    if(passageDemande)return;
    if(i>=ETAPES.length){terminer_(overlay);return;}
    var texte=ETAPES[i].texte;
    afficherImage_(i+1);
    texteEl.textContent=texte;
    prechaufferEtape_(i+1);

    var appele=false;
    var suivant=function(){
      if(appele||passageDemande)return;
      appele=true;
      etape_(i+1);
    };

    var plancher=dureeApprox_(texte);
    var securite=setTimeout(suivant,plancher+30000);

    var PLANCHER_LECTURE_REELLE_MS=800;
    var debut=Date.now();
    var demarreTts=false;
    try{
      var tts=window.__SOREAL_IDLE_TUTORIAL_TTS_V209__;
      if(tts&&typeof tts.readText==='function'){
        demarreTts=tts.readText(texte,undefined,function(){
          var ecoule=Date.now()-debut;
          clearTimeout(securite);
          var attente=ecoule>=PLANCHER_LECTURE_REELLE_MS?PAUSE_MIN_APRES_LECTURE_MS:Math.max(0,plancher-ecoule);
          setTimeout(suivant,attente);
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
  marquerVu_();
  enCours=false;
  overlay.classList.remove('soreal-idle-histoire-visible-v1');
  setTimeout(function(){
    if(overlay&&overlay.parentNode)overlay.parentNode.removeChild(overlay);
  },520);
}

window.__SOREAL_IDLE_STORY_POPUP_2_V1__={
  considerer:considerer_,
  /* Rejoue la scène à la demande (bouton Paramètres, administrateur seulement), sans toucher au
     flag "vu" ni dépendre d'un combat en cours -- même outil que la première histoire. */
  rejouer:function(){
    if(enCours)return;
    enCours=true;
    demarrer_();
  },
  /* Outils de test. */
  dejaVu:dejaVu_,
  dureeApprox:dureeApprox_,
  urlImage:urlImage_,
  etapes:function(){return ETAPES.slice();},
  mobDeclencheur:function(){return MOB_NOM_DECLENCHEUR;}
};
})();
