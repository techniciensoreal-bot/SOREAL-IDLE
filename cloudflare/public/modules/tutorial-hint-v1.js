/*
 * SOREAL IDLE — le tutoriel du début montre où cliquer (Norman, 2026-09-26) :
 *   - page « Basic Training » : le bouton + d'Attaque passive clignote et il faut cliquer dessus ; le clic (qui affecte vraiment de l'Énergie) passe à la
 *     page suivante ; pas de bouton « Passer » ni « Suivant » (le « Suivant » revient après 45 s si le clic est impossible, pour ne jamais bloquer) ;
 *   - page « Bien joué » : le bouton − d'Attaque passive clignote, mais on n'est pas obligé de le faire ;
 *   - page « Défense » : le bouton + de Blocage clignote.
 * Le clignotement est posé par balayage régulier : la liste des compétences est redessinée souvent, une classe posée une seule fois disparaîtrait.
 * Il s'arrête tout seul quand la fenêtre du tutoriel n'est plus là.
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_TUTO_INDICE_V1__)return;

var CLASSE='soreal-idle-tuto-indice-v1';
var DELAI_SUIVANT_MS=45000;
var CIBLES={
  'attaque-plus':{groupe:'attack',rang:1},
  'attaque-moins':{groupe:'attack',rang:2},
  'blocage-plus':{groupe:'defense',rang:1}
};
var CLIGNOTE='',ATTENDRE='',BALAYAGE=0,DEBLOQUE=0;

function installerStyle(){
  if(document.getElementById('sorealIdleTutoIndiceStyleV1'))return;
  var s=document.createElement('style');
  s.id='sorealIdleTutoIndiceStyleV1';
  s.textContent=
    '@keyframes sorealIdleTutoIndiceV1{'+
      '0%,100%{box-shadow:0 0 0 0 rgba(255,214,90,0);transform:scale(1);filter:brightness(1)}'+
      '50%{box-shadow:0 0 0 5px rgba(255,214,90,.7),0 0 18px 6px rgba(255,214,90,.8);transform:scale(1.18);filter:brightness(1.4)}'+
    '}'+
    '.'+CLASSE+'{animation:sorealIdleTutoIndiceV1 .9s ease-in-out infinite;position:relative;z-index:2;border-color:#ffd65a!important}';
  document.head.appendChild(s);
}

function tuto(){return document.getElementById('sorealIdleTutorielFlottantV1');}

function ligne(nom){
  var c=CIBLES[nom];
  return c?document.querySelector('.soreal-idle-bt-panel-v120.'+c.groupe+' .soreal-idle-bt-row-v120:not(.locked)'):null;
}

function bouton(nom){
  var c=CIBLES[nom],l=ligne(nom);
  return c&&l?l.querySelector('.soreal-idle-bt-actions-v120 button:nth-child('+c.rang+')'):null;
}

function allocation(nom){
  var l=ligne(nom),a=l&&l.querySelector('.soreal-idle-bt-allocation-v120');
  return a?(parseInt(String(a.textContent||'').replace(/[^0-9]/g,''),10)||0):0;
}

function retirerClignotement(sauf){
  var liste=document.querySelectorAll('.'+CLASSE);
  for(var i=0;i<liste.length;i++)if(liste[i]!==sauf)liste[i].classList.remove(CLASSE);
}

function arreterBalayage(){
  if(BALAYAGE){clearInterval(BALAYAGE);BALAYAGE=0;}
}

function balayer(){
  if(!CLIGNOTE||!tuto()){
    retirerClignotement(null);
    CLIGNOTE='';ATTENDRE='';
    arreterBalayage();
    return;
  }
  var cible=bouton(CLIGNOTE);
  retirerClignotement(cible);
  if(cible&&!cible.classList.contains(CLASSE))cible.classList.add(CLASSE);
}

/* Le « Suivant » caché revient si le joueur n'arrive pas à cliquer (plus d'énergie, Cap déjà atteint…). */
function debloquerSuivant(page){
  if(DEBLOQUE){clearTimeout(DEBLOQUE);DEBLOQUE=0;}
  if(!page)return;
  DEBLOQUE=setTimeout(function(){
    DEBLOQUE=0;
    var racine=tuto();
    if(!racine||ATTENDRE!==page)return;
    var suivant=racine.querySelector('.soreal-idle-tuto-flottant-actions-v1 button.confirm');
    if(suivant){suivant.disabled=false;suivant.style.visibility='visible';}
  },DELAI_SUIVANT_MS);
}

/* Pose (ou retire, avec '') le bouton qui clignote ; `attendre` = clic obligatoire sur ce bouton pour passer à la page suivante. */
function appliquer(clignote,attendre){
  installerStyle();
  CLIGNOTE=CIBLES[clignote]?clignote:'';
  ATTENDRE=CLIGNOTE&&attendre===CLIGNOTE?attendre:'';
  debloquerSuivant(ATTENDRE);
  if(!CLIGNOTE){balayer();return;}
  balayer();
  if(!BALAYAGE)BALAYAGE=setInterval(balayer,250);
}

/* Clic sur le bouton demandé : on passe à la page suivante dès que l'Énergie a vraiment été affectée. */
document.addEventListener('click',function(ev){
  var page=ATTENDRE;
  if(!page)return;
  var cible=bouton(page);
  var b=ev.target&&ev.target.closest?ev.target.closest('button'):null;
  if(!cible||b!==cible)return;
  var avant=allocation(page),essais=0;
  (function verifier(){
    if(ATTENDRE!==page||!tuto())return;
    if(allocation(page)>avant){
      ATTENDRE='';
      if(typeof window.__tutorielPagesNaviguerV1__==='function')window.__tutorielPagesNaviguerV1__(1);
      return;
    }
    if(++essais<20)setTimeout(verifier,150);
  })();
},true);

window.__SOREAL_IDLE_TUTO_INDICE_V1__={appliquer:appliquer,cibles:Object.keys(CIBLES)};
})();
