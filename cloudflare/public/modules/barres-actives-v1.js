/*
 * Barres actives (Norman, 2026-10-10) : « pour chaque menu où il y a de l'énergie, je veux qu'on le voit visuellement. Pas juste la barre qui avance : parfois une barre est complète mais l'argent nécessaire n'est pas
 * disponible, donc on enlève l'énergie mais la barre reste. On ne sait pas d'un coup d'œil si elle possède de l'énergie. Je veux des particules pour chaque barre active, avec des styles différents suivant les menus. »
 *
 * Une ligne est « active » dès qu'elle porte de l'énergie ou de la magie PLACÉE (le chiffre d'allocation de la ligne), quelle que soit la progression de sa barre. Un petit balayage (toutes les 400 ms, en pause quand la page est
 * cachée) pose data-actif sur la ligne et y insère une couche de particules ; chaque menu a son style (braises, étoiles, bits, pièces, gouttes, orbes). Tout est en transform / opacity (animation par la carte graphique) et
 * chaque particule boucle sans à-coup : fondu d'entrée à 0 %, fondu de sortie à 100 %, mouvement toujours dans le même sens (règle n°3 d'AGENTS.md).
 *
 *   window.__SOREAL_IDLE_BARRES_ACTIVES_V1__ = { balayer(), estActif(texte), styles }
 */
(function(){
'use strict';

/* menu (data-menu de la page) -> comment retrouver les chiffres d'allocation, la ligne qui les porte et le style de particules */
var MENUS={
  entrainement:{alloc:'.soreal-idle-bt-allocation-v120',ligne:'.soreal-idle-bt-row-v120',style:'braise'},
  augmentations:{alloc:'.soreal-idle-bt-allocation-v120',ligne:'.aug-piste-v2',style:'etoile'},
  avance:{alloc:'[id^="sorealIdleAtAlloc_"]',ligne:'.soreal-idle-at-ligne-v1',style:'bit'},
  machine:{alloc:'[id^="sorealIdleTmAllocV1_"]',ligne:'.soreal-idle-tm-ligne-v1',style:'piece'},
  sang:{alloc:'[id^="sorealIdleBloodRitualAllocV1_"]',ligne:'.soreal-idle-section-v8',style:'goutte'},
  ngu:{alloc:'[data-nl-alloc]',ligne:'.nl-barre',style:'orbe'}
};

/* « 0 », « 0⚡ », « 0 ⚡ » : rien de placé ; « 0,5 K », « 1 ⚡ », « 120K⚡ » : de l'énergie est placée. */
function estActif(texte){
  var chiffres=String(texte==null?'':texte).replace(/[^0-9.,]/g,'');
  return /[1-9]/.test(chiffres);
}

var COUCHE='<span class="part-v1" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>';

function css(){
  if(document.getElementById('sorealIdleBarresActivesStyleV1'))return;
  var st=document.createElement('style');
  st.id='sorealIdleBarresActivesStyleV1';
  /* chaque particule : 5 emplacements fixes (--x, --y, --d durée, --t retard négatif) ; la couche ne reçoit aucun clic ; elle n'existe à l'écran que sur une ligne active */
  st.textContent=
    '[data-barre-active-v1]{position:relative}'+
    '.part-v1{display:none;position:absolute;inset:0;overflow:hidden;pointer-events:none;border-radius:inherit;z-index:3}'+
    '[data-actif="1"]>.part-v1{display:block}'+
    '.part-v1 i{position:absolute;display:block;left:var(--x);top:var(--y);opacity:0;width:var(--w,4px);height:var(--h,4px)}'+
    '.part-v1 i:nth-child(1){--x:8%;--y:70%;--d:2.2s;--t:-.2s}.part-v1 i:nth-child(2){--x:27%;--y:55%;--d:2.8s;--t:-1.4s}.part-v1 i:nth-child(3){--x:46%;--y:75%;--d:2.4s;--t:-.9s}'+
    '.part-v1 i:nth-child(4){--x:66%;--y:60%;--d:3s;--t:-2s}.part-v1 i:nth-child(5){--x:86%;--y:72%;--d:2.6s;--t:-1.1s}'+
    /* style commun d'une ligne active : liseré et halo FIXES (rien ne s'anime : on voit tout de suite que de l'énergie est placée) */
    '[data-actif="1"]{box-shadow:inset 0 0 0 2px var(--fx,rgba(255,200,80,.55)),0 0 16px -3px var(--fx,rgba(255,200,80,.55))!important}'+
    /* braises (Entraînement) : points orange qui montent */
    '[data-style="braise"]{--fx:rgba(255,140,40,.6)}'+
    '[data-style="braise"] .part-v1 i{--w:4px;--h:4px;border-radius:50%;background:radial-gradient(circle,#fff3b0,#ff8a1f 60%,transparent 72%);animation:pvBraise var(--d) linear var(--t) infinite}'+
    '@keyframes pvBraise{0%{opacity:0;transform:translateY(8px) scale(.6)}20%{opacity:1}100%{opacity:0;transform:translateY(-34px) scale(1)}}'+
    /* étoiles (Augmentations) : petites étoiles dorées à quatre branches qui scintillent en montant doucement */
    '[data-style="etoile"]{--fx:rgba(255,214,90,.6)}'+
    '[data-style="etoile"] .part-v1 i{--w:12px;--h:12px;background:#ffe27a;clip-path:polygon(50% 0,60% 40%,100% 50%,60% 60%,50% 100%,40% 60%,0 50%,40% 40%);animation:pvEtoile var(--d) ease-in-out var(--t) infinite}'+
    '@keyframes pvEtoile{0%{opacity:0;transform:translateY(6px) scale(.3)}50%{opacity:1;transform:translateY(-6px) scale(1)}100%{opacity:0;transform:translateY(-18px) scale(.3)}}'+
    /* bits (Entraînement avancé) : petits rectangles verts qui filent de gauche à droite comme un circuit */
    '[data-style="bit"]{--fx:rgba(80,230,140,.55)}'+
    '[data-style="bit"] .part-v1 i{--w:10px;--h:3px;background:linear-gradient(90deg,transparent,#7dffb4);animation:pvBit var(--d) linear var(--t) infinite}'+
    '@keyframes pvBit{0%{opacity:0;transform:translateX(-12px)}15%{opacity:1}85%{opacity:1}100%{opacity:0;transform:translateX(64px)}}'+
    /* pièces (Machine temporelle) : disques dorés qui tombent */
    '[data-style="piece"]{--fx:rgba(255,200,40,.6)}'+
    '[data-style="piece"] .part-v1 i{--w:6px;--h:6px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff7c2,#f5b400 55%,#a56a00);animation:pvPiece var(--d) linear var(--t) infinite}'+
    '.part-v1 i:nth-child(n){top:var(--y)}'+
    '@keyframes pvPiece{0%{opacity:0;transform:translateY(-24px)}20%{opacity:1}100%{opacity:0;transform:translateY(22px)}}'+
    /* gouttes (Magie du sang) : gouttes rouges qui coulent */
    '[data-style="goutte"]{--fx:rgba(255,60,80,.55)}'+
    '[data-style="goutte"] .part-v1 i{--w:5px;--h:7px;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;background:radial-gradient(circle at 40% 30%,#ff9aa5,#d41e3a 60%,#6d0a1c);animation:pvGoutte var(--d) ease-in var(--t) infinite}'+
    '@keyframes pvGoutte{0%{opacity:0;transform:translateY(-20px) scale(.7)}25%{opacity:1}100%{opacity:0;transform:translateY(24px) scale(1)}}'+
    /* orbes (NGU) : boules violettes lumineuses qui dérivent vers la droite le long du tuyau */
    '[data-style="orbe"]{--fx:rgba(190,120,255,.55)}'+
    '[data-style="orbe"] .part-v1 i{--w:7px;--h:7px;border-radius:50%;background:radial-gradient(circle,#fff,#c58bff 50%,transparent 72%);animation:pvOrbe var(--d) ease-in-out var(--t) infinite}'+
    '@keyframes pvOrbe{0%{opacity:0;transform:translateX(-8px) scale(.5)}20%{opacity:1}80%{opacity:.9}100%{opacity:0;transform:translateX(56px) scale(1)}}'+
    '@media (prefers-reduced-motion:reduce){.part-v1 i{animation:none!important;opacity:.7}}';
  document.head.appendChild(st);
}

function balayer(){
  var racine=document.querySelector('.soreal-idle-page-root-v28[data-menu]');
  if(!racine)return;
  var cfg=MENUS[racine.getAttribute('data-menu')];
  if(!cfg)return;
  css();
  var vus=[];
  racine.querySelectorAll(cfg.alloc).forEach(function(el){
    var ligne=el.closest(cfg.ligne);
    if(!ligne)return;
    var actif=estActif(el.textContent);
    var idx=vus.indexOf(ligne);
    if(idx>=0){
      /* une ligne qui porte plusieurs chiffres (Augment + Upgrade) : active si l'un d'eux l'est */
      if(actif&&ligne.getAttribute('data-actif')!=='1')ligne.setAttribute('data-actif','1');
      return;
    }
    vus.push(ligne);
    if(!ligne.hasAttribute('data-barre-active-v1'))ligne.setAttribute('data-barre-active-v1','');
    if(ligne.getAttribute('data-style')!==cfg.style)ligne.setAttribute('data-style',cfg.style);
    if(!ligne.querySelector(':scope>.part-v1'))ligne.insertAdjacentHTML('beforeend',COUCHE);
    var v=actif?'1':'0';
    if(ligne.getAttribute('data-actif')!==v)ligne.setAttribute('data-actif',v);
  });
}

setInterval(function(){if(!document.hidden)balayer();},400);

window.__SOREAL_IDLE_BARRES_ACTIVES_V1__={balayer:balayer,estActif:estActif,styles:Object.keys(MENUS).map(function(k){return MENUS[k].style;})};
})();
