/*
 * SOREAL IDLE — « Le commencement » en images (Norman, 2026-10-22 : « il y a 16 images qui racontent toute l'histoire ; il faut les faire défiler pendant Le commencement avec les phrases écrites en blanc en dessous ; stoppe sur la dernière avec le bouton blanc ;
 * c'est le joueur qui devra cliquer sur l'image pour continuer »).
 *
 * Les 16 images (/intro/01.webp à 16.webp, dessins de Norman, réduites en WebP) défilent d'elles-mêmes avec un fondu, chacune avec sa phrase en blanc dessous (le texte de la page, découpé en 16 morceaux dans l'ordre : la voix de la page lit toujours le texte
 * complet, inchangé, donc les voix déjà générées servent toujours). La durée de chaque image suit la longueur de sa phrase. La dernière (la main devant le gros bouton blanc « JOUER ») ne défile plus : elle reste, éclairée, et c'est un clic (ou Entrée / Espace)
 * sur l'image qui continue. Aucun défilement automatique avec « réduire les animations » : seul le fondu disparaît.
 * Taper sur l'image passe à l'image suivante (Norman, 2026-10-23 : « si on lit plus vite que le narrateur »). Si le navigateur bloque le son (aucun appui depuis le chargement de la page : cas d'une partie qui vient d'être remise à zéro), la scène attend UN premier appui
 * (« Touche l'écran pour lancer la voix ») avant de défiler : l'appui débloque l'audio et la voix repart du début, en même temps que les images.
 *   window.__SOREAL_IDLE_INTRO_DIAPORAMA_V1__ = { html(page, texteVoix, etat), demarrer(), arreter(), diapos, duree(i) }
 */
(function(){
'use strict';
if(window.__SOREAL_IDLE_INTRO_DIAPORAMA_V1__)return;

var DIR='/intro/',V='1';
/* Les phrases du texte « Le commencement », dans l'ordre, une par image. */
var DIAPOS=[
  {n:'01',t:'*BLOUM*'},
  {n:'02',t:'Quand tu reprends connaissance,'},
  {n:'03',t:'la première chose que tu remarques, c’est ce goût de cuivre dans ta bouche.'},
  {n:'04',t:'La seconde, c’est l’odeur d’égout à plein nez tout autour de toi.'},
  {n:'05',t:'Tu te relèves en soignant ta lèvre fendue et en te frottant la tête,'},
  {n:'06',t:'qui a l’air d’avoir reçu tout l’amour d’un bloc de béton.'},
  {n:'07',t:'Tu essaies de te rappeler comment tu es arrivé ici... enfin, peu importe où est « ici ». Tu réalises, avec un calme étonnant, que tu as complètement oublié qui tu es.'},
  {n:'08',t:'Vu l’état dans lequel tu te trouves, tu te dis qu’ils devaient être de sacrés connards.'},
  {n:'09',t:'Balancé dans une fosse d’égout dégueulasse...'},
  {n:'10',t:'Au moins, à court terme, tu as un objectif : trouver un moyen de sortir d’ici. Ça a l’air d’être la bonne chose à faire. Tu essaies de te lever'},
  {n:'11',t:'mais tes genoux tremblent, se dérobent,'},
  {n:'12',t:'et tu retombes.'},
  {n:'13',t:'C’est seulement maintenant que tu sens la faiblesse dans ton corps. Pas le genre de faiblesse normale, comme quand tu te lèves trop vite et que la tête tourne, ou quand ton bras se fait arracher dans un accident industriel.'},
  {n:'14',t:'Non, tu as l’impression que *quelque chose* a aspiré la majorité de ta force.'},
  {n:'15',t:'Bon, il n’y a rien d’autre à faire qu’essayer de récupérer un peu de cette force et sortir d’ici.'},
  {n:'16',t:'Peut-être qu’appuyer sur un gros bouton blanc marqué « JOUER » te permettra de faire quelque chose d’amusant.'}
];
var MIN_MS=3800,MS_PAR_CARACTERE=72;
var minuterie=0,indice=0,couche=0,attenteSon=false,veilleSon=0;

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
/* *mot* -> italique, comme le texte d'origine l'écrit. */
function texteHtml(t){return esc(t).replace(/\*([^*]+)\*/g,'<em>$1</em>');}
function url(i){return DIR+DIAPOS[i].n+'.webp?v='+V;}
function duree(i){return Math.max(MIN_MS,String(DIAPOS[i].t).length*MS_PAR_CARACTERE);}
function reduit(){try{return Boolean(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);}catch(_e){return false;}}
function racine(){return document.getElementById('sorealIdleIntroDiapoV1');}

function style_(){
  if(document.getElementById('soreal-idle-intro-diapo-style'))return;
  var s=document.createElement('style');s.id='soreal-idle-intro-diapo-style';
  s.textContent=
    '#sorealIdleTutorielPagesModalV1.id-fond{align-items:center;justify-content:center;padding:10px;background:rgba(3,5,10,.96)}'+
    '.id-scene{width:min(940px,100%);max-height:100%;display:flex;flex-direction:column;align-items:center;gap:10px;color:#fff}'+
    '.id-titre{font:400 clamp(20px,4vw,30px) "Bangers","Russo One",Impact,sans-serif;letter-spacing:.08em;color:#ffd24a;text-shadow:0 2px 0 #6a3d00;text-align:center}'+
    '.id-titre small{display:block;font:400 clamp(11px,2.4vw,14px) "Russo One",sans-serif;letter-spacing:.06em;color:#b9c2da;text-shadow:none}'+
    '.id-cadre{position:relative;width:100%;aspect-ratio:3/2;max-height:62vh;border:3px solid #000;border-radius:10px;overflow:hidden;background:#05070d;box-shadow:0 0 0 2px rgba(255,210,74,.35),0 16px 40px rgba(0,0,0,.65)}'+
    '.id-cadre img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;opacity:0;transition:opacity .9s ease;image-rendering:auto}'+
    '.id-cadre img.id-on{opacity:1}'+
    '.id-texte{width:100%;min-height:3.6em;display:flex;align-items:center;justify-content:center;text-align:center;font:400 clamp(16px,3.3vw,22px)/1.35 "Russo One","Arial Black",sans-serif;color:#fff;text-shadow:0 2px 0 #000,0 0 12px rgba(0,0,0,.9);padding:0 6px}'+
    '.id-texte em{font-style:normal;color:#ffd24a}'+
    '.id-points{display:flex;gap:5px;flex-wrap:wrap;justify-content:center}'+
    '.id-points i{display:block;width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.22)}'+
    '.id-points i.id-fait{background:rgba(255,255,255,.7)}'+
    '.id-points i.id-ici{background:#ffd24a;box-shadow:0 0 8px #ffd24a}'+
    /* dernière image : le gros bouton blanc est l'image elle-même, éclairée, à cliquer */
    '.id-fin .id-cadre{cursor:pointer;animation:idPulse 1.8s ease-in-out infinite}'+
    '.id-fin .id-cadre:focus-visible{outline:3px solid #ffd24a;outline-offset:3px}'+
    '.id-indice{min-height:1.4em;font:400 clamp(12px,2.6vw,15px) "Russo One",sans-serif;letter-spacing:.05em;color:#ffd24a;text-align:center;opacity:0;transition:opacity .6s}'+
    '.id-fin .id-indice{opacity:1}'+
    '.id-cadre{cursor:pointer}'+
    '.id-son{min-height:1.4em;font:400 clamp(13px,2.8vw,16px) "Russo One",sans-serif;letter-spacing:.04em;color:#fff;text-align:center;padding:6px 14px;border-radius:999px;background:rgba(255,210,74,.16);border:1px solid rgba(255,210,74,.6);animation:idSon 1.4s ease-in-out infinite}'+
    '.id-son[hidden]{display:none}'+
    '@keyframes idSon{0%,100%{opacity:.55}50%{opacity:1}}'+
    '@keyframes idPulse{0%,100%{box-shadow:0 0 0 2px rgba(255,210,74,.35),0 0 18px 2px rgba(255,230,140,.25),0 16px 40px rgba(0,0,0,.65)}50%{box-shadow:0 0 0 3px rgba(255,210,74,.9),0 0 46px 12px rgba(255,230,140,.6),0 16px 40px rgba(0,0,0,.65)}}'+
    '@media (prefers-reduced-motion:reduce){.id-son{animation:none}.id-cadre img{transition:none}.id-fin .id-cadre{animation:none;box-shadow:0 0 0 3px rgba(255,210,74,.9),0 0 30px 6px rgba(255,230,140,.5)}}';
  (document.head||document.documentElement).appendChild(s);
}

/* Le contenu de la fenêtre (à poser dans #sorealIdleTutorielPagesModalV1) : titre, deux calques d'image (fondu), phrase, points, indice. */
function html(page,texteVoix){
  style_();
  var pts='';
  for(var i=0;i<DIAPOS.length;i++)pts+='<i></i>';
  return '<div class="id-scene" id="sorealIdleIntroDiapoV1" role="dialog" aria-modal="true" data-soreal-tts-say="'+esc(texteVoix||'')+'">'+
    '<div class="id-titre">'+esc(page&&page.titre||'')+(page&&page.sousTitre?'<small>'+esc(page.sousTitre)+'</small>':'')+'</div>'+
    '<div class="id-cadre" id="sorealIdleIntroCadreV1"><img alt="" decoding="async" draggable="false"><img alt="" decoding="async" draggable="false"></div>'+
    '<div class="id-texte" id="sorealIdleIntroTexteV1" data-soreal-tts-ignore></div>'+
    '<div class="id-points" data-soreal-tts-ignore>'+pts+'</div>'+
    '<div class="id-son" id="sorealIdleIntroSonV1" data-soreal-tts-ignore hidden>🔊 Touche l’écran pour lancer la voix</div>'+
    '<div class="id-indice" data-soreal-tts-ignore>Clique sur le bouton pour jouer</div>'+
  '</div>';
}

function precharger(i){
  if(i<0||i>=DIAPOS.length)return;
  var im=new Image();im.decoding='async';im.src=url(i);
}

function afficher(i){
  var r=racine();if(!r)return;
  indice=i;
  var cadre=r.querySelector('#sorealIdleIntroCadreV1'),imgs=cadre.querySelectorAll('img');
  var suivante=imgs[couche?0:1],courante=imgs[couche];
  var instantane=reduit();
  suivante.onload=function(){suivante.onload=null;};
  suivante.src=url(i);
  suivante.classList.add('id-on');
  if(instantane||i===0)courante.classList.remove('id-on');
  else setTimeout(function(){courante.classList.remove('id-on');},60);
  couche=couche?0:1;
  var t=r.querySelector('#sorealIdleIntroTexteV1');
  if(t)t.innerHTML=texteHtml(DIAPOS[i].t);
  var pts=r.querySelectorAll('.id-points i');
  for(var k=0;k<pts.length;k++)pts[k].className=k<i?'id-fait':(k===i?'id-ici':'');
  precharger(i+1);
  var fin=i>=DIAPOS.length-1;
  r.classList.toggle('id-fin',fin);
  if(fin)installerBouton(r);
}

/* Dernière image : on ne défile plus ; le clic (ou Entrée / Espace) sur l'image continue. */
function installerBouton(r){
  var cadre=r.querySelector('#sorealIdleIntroCadreV1');
  if(!cadre||cadre.getAttribute('data-pret')==='1')return;
  cadre.setAttribute('data-pret','1');cadre.setAttribute('role','button');cadre.setAttribute('tabindex','0');cadre.setAttribute('aria-label','JOUER');
  var continuer=function(ev){
    if(ev&&ev.type==='keydown'&&ev.key!=='Enter'&&ev.key!==' ')return;
    if(ev){ev.preventDefault();ev.stopPropagation();}
    arreter();
    if(typeof window.__tutorielPagesNaviguerV1__==='function')window.__tutorielPagesNaviguerV1__(1);
  };
  cadre.addEventListener('click',continuer);
  cadre.addEventListener('keydown',continuer);
  try{cadre.focus({preventScroll:true});}catch(_e){}
}

function planifier(){
  if(minuterie){clearTimeout(minuterie);minuterie=0;}
  if(indice<DIAPOS.length-1)minuterie=setTimeout(suite,duree(indice));
}
function suite(){
  var r=racine();
  if(!r||!r.isConnected){arreter();return;}
  if(indice>=DIAPOS.length-1){minuterie=0;return;}
  afficher(indice+1);
  planifier();
}

/* Le son est-il bloqué par le navigateur ? (voix automatique en marche, mais contexte audio encore suspendu : aucun appui depuis le chargement de la page) */
function sonBloque(){
  var t=window.__SOREAL_IDLE_TUTORIAL_TTS_V209__;
  try{return Boolean(t&&typeof t.enabled==='function'&&t.enabled()&&typeof t.audioState==='function'&&(t.audioState()==='suspended'||t.audioState()==='none'));}catch(_e){return false;}
}
function indiceSon(visible){
  var r=racine(),e=r&&r.querySelector('#sorealIdleIntroSonV1');
  if(e)e.hidden=!visible;
}
/* Un appui dans la scène : le premier débloque le son (et lance les images) s'il était bloqué ; ensuite, taper sur l'image passe à la suivante. */
function toucher(ev){
  var r=racine();if(!r)return;
  if(attenteSon){
    attenteSon=false;indiceSon(false);
    planifier();   /* le gestionnaire d'appui de la voix (capture sur le document) vient de relancer la lecture depuis le début : les images repartent avec elle */
    return;
  }
  var cible=ev&&ev.target;
  if(!(cible&&cible.closest&&cible.closest('#sorealIdleIntroCadreV1')))return;
  if(indice>=DIAPOS.length-1)return;   /* dernière image : son propre bouton */
  afficher(indice+1);
  planifier();
}

function demarrer(){
  arreter();
  var r=racine();if(!r)return false;
  couche=0;indice=0;
  var imgs=r.querySelectorAll('#sorealIdleIntroCadreV1 img');
  imgs[0].src=url(0);imgs[0].classList.add('id-on');
  var t=r.querySelector('#sorealIdleIntroTexteV1');if(t)t.innerHTML=texteHtml(DIAPOS[0].t);
  var pts=r.querySelectorAll('.id-points i');for(var k=0;k<pts.length;k++)pts[k].className=k===0?'id-ici':'';
  precharger(1);precharger(2);
  attenteSon=false;indiceSon(false);curseur=0;annulerVoix();
  r.addEventListener('click',toucher);
  planifier();
  /* Après un instant (la voix a eu le temps d'essayer de démarrer) : si le navigateur a bloqué le son, on attend un premier appui avant de défiler. */
  if(veilleSon)clearTimeout(veilleSon);
  veilleSon=setTimeout(function(){
    veilleSon=0;
    var rr=racine();
    if(!rr||indice!==0||!sonBloque())return;
    attenteSon=true;
    if(minuterie){clearTimeout(minuterie);minuterie=0;}
    indiceSon(true);
  },800);
  return true;
}

/*
 * Images au rythme de la voix (Norman, 2026-10-23 : « chaque image ne dure que le temps de la phrase écrite en dessous »). Le lecteur annonce chaque bloc de voix (texte + durée, événement « soreal-voix-bloc ») : on retrouve
 * dans les phrases des images la portion que le bloc couvre et chaque image est affichée pendant la part de la durée qui correspond à SA phrase (au prorata des lettres). On ne recule jamais ; sans voix, les minuteurs de durée() prennent le relais.
 */
var voixMinuteries=[],curseur=0,tout='',bornes=[];
function lettres(s){return String(s||'').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');}
(function(){var p=0;DIAPOS.forEach(function(d){bornes.push(p);var l=lettres(d.t);tout+=l;p+=l.length;});bornes.push(p);})();
function diapoDe(pos){for(var k=bornes.length-2;k>=0;k--){if(pos>=bornes[k])return k;}return 0;}
function annulerVoix(){voixMinuteries.forEach(clearTimeout);voixMinuteries=[];}
function surBlocVoix(ev){
  var r=racine();if(!r||!r.isConnected||attenteSon)return;
  var d=ev&&ev.detail||{},c=lettres(d.texte),duree=Number(d.duree)||0;
  if(c.length<6||!duree)return;
  var pos=tout.indexOf(c.slice(0,Math.min(24,c.length)),Math.max(0,curseur-4));
  if(pos<0)return;
  var fin=Math.min(tout.length,pos+c.length);
  curseur=fin;
  annulerVoix();
  if(minuterie){clearTimeout(minuterie);minuterie=0;}
  var a=diapoDe(pos),b=diapoDe(Math.max(pos,fin-1));
  for(var k=a;k<=b;k++){
    var debut=Math.max(bornes[k],pos);
    var delai=Math.round((debut-pos)/c.length*duree*1000);
    (function(kk,dl){
      var go=function(){var rr=racine();if(rr&&rr.isConnected&&kk>indice)afficher(kk);};
      if(dl<=20)go();else voixMinuteries.push(setTimeout(go,dl));
    })(k,delai);
  }
  /* Filet : si la voix s'arrête là, l'image suivante vient quand même. */
  minuterie=setTimeout(suite,Math.round(duree*1000)+6000);
}
try{window.addEventListener('soreal-voix-bloc',surBlocVoix);}catch(_e){}

function arreter(){
  annulerVoix();curseur=0;
  if(minuterie){clearTimeout(minuterie);minuterie=0;}
  if(veilleSon){clearTimeout(veilleSon);veilleSon=0;}
  attenteSon=false;
}

window.__SOREAL_IDLE_INTRO_DIAPORAMA_V1__={html:html,demarrer:demarrer,arreter:arreter,diapos:DIAPOS,duree:duree,url:url,texteHtml:texteHtml};
})();
