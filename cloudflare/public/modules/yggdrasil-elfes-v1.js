/*
 * SOREAL IDLE — page Yggdrasil « elfique » (Norman, 2026-10-06 : « retravaille entièrement la page, elle doit faire penser aux elfes, même disposition que
 * l'Yggdrasil original de NGU Idle : 9 fruits par page, chaque fruit avec son image, les graines et la poop, cadre ITOPOD mélangé aux elfes »).
 *
 * Disposition de l'original : titre, bouton d'aide, onglets « Page 1 / Page 2 », grille 3 x 3 de fruits (nom et tier, barre de croissance, bouton principal
 * Activer / Manger / Récolter, bouton Améliorer, case Poop, choix Manger ou Récolter), puis un bandeau du bas : graines, poop, bonus, « tout manger / récolter »
 * et la case « poop seulement sur les fruits au tier maximum ».
 *
 * Aucune règle de jeu ne change : mêmes actions serveur (activateYggFruit, upgradeYggFruit, useYggFruit, achat Auto-Activate). Les images viennent de R2
 * (dossier idle/yggdrasil/, route /api/idle/media/ygg?name=<id du fruit | seed | poop>) ; tant qu'une image n'existe pas, le fruit garde son dessin (emoji).
 * Anti-spoil (règle n°2) : un fruit encore verrouillé n'apparaît pas, ni la page 2 tant qu'elle est vide, ni un total.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_YGG_V1__)return;

  var PAR_PAGE=9;
  var etat={page:1,aide:false,soloMax:true,choix:{},manquantes:{},chargees:{},pretsVus:null,fermees:{},ouvre:{}};
  function son_(nom,option){var S=window.__SOREAL_IDLE_YGG_SONS_V1__;if(S&&S.jouer)S.jouer(nom,option);}

  function H_(){return window.__SOREAL_IDLE_META_HOST_V130__;}
  function html_(t){var H=H_();return H&&H.idleHtml_?H.idleHtml_(t):String(t==null?'':t).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function nb_(v){var n=Number(v);return Number.isFinite(n)?n:0;}
  function ent_(v){return Math.max(0,Math.floor(nb_(v)));}
  function grand_(v){var H=H_();return H&&H.formatGrandNombreIdleV70_?H.formatGrandNombreIdleV70_(v):String(Math.floor(nb_(v)));}
  function emoji_(id,nom){
    var I=window.__SOREAL_IDLE_ICONES_V1__;
    var e=I&&I.pour?I.pour('yggdrasil',id,nom):'';
    return e||'🌿';
  }
  function choix_(id){return etat.choix[id]||(etat.choix[id]={mode:'eat',poop:false});}
  /*
   * Manger ou Récolter, fruit par fruit, est MÉMORISÉ (Norman, 2026-10-16) : sur l'appareil, par partie (même principe que le palier du Cube vu). Lu une fois à l'ouverture de la page de la partie en cours,
   * écrit à chaque changement ; seuls les fruits sur « Récolter » sont gardés (Manger est le choix par défaut). Le Poop, lui, se décoche après chaque usage : il n'est pas mémorisé.
   */
  var CLE_MODES_='soreal_idle_ygg_modes_v1:';
  var CLE_SOLO_='soreal_idle_ygg_solomax_v1';
  function chargerModes_(nom){
    nom=String(nom||'');
    if(etat.modesPour===nom)return;
    etat.modesPour=nom;
    var brut=null;
    try{brut=localStorage.getItem(CLE_MODES_+nom);}catch(_e){}
    var memo={};
    try{memo=brut?JSON.parse(brut):{};}catch(_e){memo={};}
    if(!memo||typeof memo!=='object')memo={};
    Object.keys(memo).forEach(function(id){if(memo[id]==='harvest')choix_(id).mode='harvest';});
    /* Case « Poop seulement sur les fruits au tier max » : mémorisée elle aussi (liée au compte, voir prefs-compte-v1.js). */
    var solo=null;try{solo=localStorage.getItem(CLE_SOLO_);}catch(_e){}
    if(solo!==null)etat.soloMax=solo!=='0';
  }
  function sauverModes_(){
    var memo={};
    Object.keys(etat.choix).forEach(function(id){if(etat.choix[id].mode==='harvest')memo[id]='harvest';});
    try{localStorage.setItem(CLE_MODES_+String(etat.modesPour||''),JSON.stringify(memo));}catch(_e){}
  }
  function action_(payload){if(typeof window.__actionMetaV47__==='function')window.__actionMetaV47__(payload);}
  function rafraichir_(){
    var H=H_();
    if(H&&typeof H.rafraichirMenuRacineIdleV28_==='function')H.rafraichirMenuRacineIdleV28_();
  }

  /* Image R2 d'un fruit (ou « seed », « poop ») avec dessin de secours ; une image absente n'est plus redemandée pendant la visite. */
  function image_(nom,secours,classe,etape,srcForce){
    var fond='<span class="ygg-secours">'+html_(secours)+'</span>';
    if(etat.manquantes[nom])return fond;
    /* Image déjà chargée pendant la visite : plus de dessin de secours (pas de clignotement au rafraîchissement des chiffres). */
    /* La poop a la même image que dans la boutique AP (« Fertilizer », /shop/fertilizer.png). */
    /* La graine a l'image de l'objet « A Giant Seed » (R2 idle/items/Item_0092_A_Giant_Seed.png, via la route des objets). */
    var src=srcForce?srcForce:nom==='poop'?'/shop/fertilizer.png':nom==='seed'?'/api/idle/media/item?wikiItemId=92':'/api/idle/media/ygg?name='+encodeURIComponent(nom)+(etape!=null?'&etape='+etape+(nbEtapes_(nom)===24?'&sur=24':''):'');
    return (etat.chargees[nom]?'':fond)+'<img class="ygg-img '+(classe||'')+'" src="'+src+'" alt="" loading="lazy" draggable="false" '+
      'onload="window.__SOREAL_IDLE_YGG_V1__.imageChargee(\''+html_(nom)+'\',this)" onerror="window.__SOREAL_IDLE_YGG_V1__.imageManquante(\''+html_(nom)+'\',this)">';
  }

  /* ---------- Style ---------- */
  function style_(){
    if(document.getElementById('ygg-style-v1'))return;
    var s=document.createElement('style');s.id='ygg-style-v1';
    s.textContent=[
      '.ygg-page{--or:#f0cc62;--or2:#b8862a;--vert:#2f7a4a;--vert2:#17432a;--nuit:#0f2418;--parch:#f4edc9;container-type:inline-size;max-width:760px;margin:6px auto 18px;font-family:Georgia,"Palatino Linotype",serif;color:var(--parch);}',
      /* Cadre général : pierre-forêt à la manière de l'ITOPOD (gros contour noir, ombre décalée) avec quatre anneaux (noir, or, noir, vert), lierre sur les côtés et médaillons en haut et en bas : un cadre fini, sans pièce qui dépasse. */
      '.ygg-cadre{position:relative;padding:calc(3cqw + 12px) calc(3cqw + 12px) calc(3.4cqw + 12px);border:3px solid #000;border-radius:10px;background:radial-gradient(ellipse 5px 3px at 7px 8px,rgba(130,215,130,.85) 96%,transparent) left 5px top 24px/14px 28px repeat-y,radial-gradient(ellipse 5px 3px at 7px 22px,rgba(240,204,98,.75) 96%,transparent) left 5px top 24px/14px 28px repeat-y,linear-gradient(90deg,transparent 6px,rgba(70,150,80,.9) 6px 8px,transparent 8px) left 5px top 0/14px 100% no-repeat,radial-gradient(ellipse 5px 3px at 7px 8px,rgba(130,215,130,.85) 96%,transparent) right 5px top 24px/14px 28px repeat-y,radial-gradient(ellipse 5px 3px at 7px 22px,rgba(240,204,98,.75) 96%,transparent) right 5px top 24px/14px 28px repeat-y,linear-gradient(90deg,transparent 6px,rgba(70,150,80,.9) 6px 8px,transparent 8px) right 5px top 0/14px 100% no-repeat,radial-gradient(ellipse at 20% 0%,rgba(120,200,120,.16),transparent 55%),radial-gradient(ellipse at 90% 100%,rgba(240,204,98,.10),transparent 50%),linear-gradient(160deg,#2c5a38,#183a25 50%,#0f2418);box-shadow:inset 0 0 0 3px #2f7a4a,inset 0 0 0 5px #000,inset 0 0 0 7px #e0b640,inset 0 0 0 9px #000,6px 6px 0 #000,0 0 28px rgba(80,200,120,.28);}',
      '.ygg-cadre::before,.ygg-cadre::after{position:absolute;left:50%;transform:translateX(-50%);padding:.05em .7em;border:3px solid #000;border-radius:999px;font-size:clamp(14px,3.4cqw,22px);line-height:1.2;color:#2b1d00;background:linear-gradient(180deg,#ffe38a,#d9a62f);box-shadow:inset 0 2px 0 rgba(255,255,255,.55),2px 2px 0 #000;}',
      '.ygg-cadre::before{content:"❦ ✦ ❦";top:-.7em}.ygg-cadre::after{content:"❧ ✦ ❧";bottom:-.7em}',
      /* Titre. */
      '.ygg-entete{display:flex;align-items:center;gap:2.4cqw;margin-bottom:2.4cqw;}',
      /* Titre en BRANCHE VIVANTE (Norman, 2026-10-16 : « pas une planche, on dirait le fond du coffre : un truc boisé, arbre, feuilles, plantes ») : un tronçon de branche à bouts arrondis (bordure et ombre suivent le
         contour), écorce striée avec des nœuds, mousse sur le dessus, une touffe de feuilles à chaque bout et une vigne qui pend dessous. Dégradés et dessins SVG statiques seulement. */
      '.ygg-titre{flex:1;min-width:0;position:relative;text-align:center;padding:1.3cqw 9cqw;margin-bottom:12px;border:3px solid #24150a;border-radius:999px;background:linear-gradient(180deg,rgba(132,196,84,.95) 0,rgba(96,160,64,.8) 9%,rgba(70,120,48,0) 30%),radial-gradient(ellipse 9% 28% at 18% 62%,#2b1a0c 0 45%,transparent 50%),radial-gradient(ellipse 6% 22% at 71% 40%,#2b1a0c 0 45%,transparent 50%),repeating-linear-gradient(180deg,rgba(30,16,6,.0) 0 5px,rgba(30,16,6,.28) 5px 6px,rgba(255,220,160,.07) 6px 8px),repeating-linear-gradient(90deg,rgba(30,16,6,.2) 0 2px,transparent 2px 23px,rgba(30,16,6,.14) 23px 24px,transparent 24px 41px),linear-gradient(180deg,#7a5430,#5b3d22 55%,#3e2915);box-shadow:inset 0 2px 0 rgba(255,225,170,.28),inset 0 -4px 0 rgba(20,10,3,.45),3px 4px 0 rgba(0,0,0,.8);}',
      '.ygg-feu{position:absolute;top:50%;width:19%;max-width:92px;min-width:54px;transform:translateY(-50%);pointer-events:none;}',
      '.ygg-feu svg{display:block;width:100%;height:auto;overflow:visible;filter:drop-shadow(1px 2px 0 rgba(0,0,0,.65));}',
      '.ygg-feu.g{left:-3%;}.ygg-feu.d{right:-3%;transform:translateY(-50%) scaleX(-1);}',
      '.ygg-vigne{position:absolute;left:14%;right:14%;bottom:-13px;height:17px;pointer-events:none;}',
      '.ygg-vigne svg{display:block;width:100%;height:100%;overflow:visible;}',
      '.ygg-titre b{display:block;font-size:clamp(15px,4.6cqw,30px);font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:#ffd976;text-shadow:0 2px 0 #3a1f0a,0 -1px 0 rgba(255,238,180,.45),0 0 10px rgba(255,200,90,.35);}',
      '.ygg-titre small{display:block;font-size:clamp(9px,1.9cqw,13px);font-style:italic;color:#f5e6bd;text-shadow:0 1px 0 #3a1f0a;margin-top:2px;}',
      /* Le thème global des titres impose sa couleur et son ombre : la couleur or doit le battre. */
      '.ygg-page .ygg-titre b{color:#ffd976!important}',
      '.ygg-page .ygg-titre small{color:#f5e6bd!important;text-shadow:0 1px 0 #3a1f0a!important}',
      '.ygg-aide-bouton{flex:0 0 auto;max-width:21cqw;padding:.8em .9em;font:700 clamp(10px,2cqw,13px) Georgia,serif;line-height:1.15;color:#1c2a14;border:3px solid #000;border-radius:4px;background:linear-gradient(180deg,#f4edc9,#d3c68d);box-shadow:3px 3px 0 #000;cursor:pointer;min-height:44px;}',
      '.ygg-aide{display:none;margin:0 0 2.4cqw;padding:2cqw 2.6cqw;border:3px solid #000;border-radius:4px;background:rgba(7,22,13,.78);font-size:clamp(11px,2.2cqw,15px);line-height:1.45;box-shadow:4px 4px 0 #000;}',
      '.ygg-aide.ouvert{display:block;}',
      /* Onglets. */
      '.ygg-onglets{display:flex;gap:1.6cqw;margin:0 0 2.4cqw;padding:0 1.4cqw;border-bottom:3px solid #000;}',
      '.ygg-onglet{min-height:44px;padding:.4em 1.4em;font:900 clamp(11px,2.4cqw,16px) Georgia,serif;letter-spacing:.06em;color:#f4edc9;border:3px solid #000;border-bottom:0;border-radius:8px 8px 0 0;background:linear-gradient(180deg,#2a5a38,#143523);cursor:pointer;box-shadow:inset 0 2px 0 rgba(255,255,255,.2),3px 0 0 #000;}',
      '.ygg-onglet[aria-selected="true"]{color:#2b1d00;background:linear-gradient(180deg,#ffe38a,#d9a62f);text-shadow:0 1px 0 rgba(255,255,255,.5);}',
      /* Grille 3 x 3. */
      '.ygg-grille{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:2cqw;}',
      '.ygg-carte{position:relative;display:flex;flex-direction:column;gap:1.1cqw;padding:1.6cqw;border:3px solid #000;border-radius:6px;background:linear-gradient(180deg,rgba(56,110,70,.95),rgba(20,52,34,.97));box-shadow:inset 0 0 0 2px rgba(240,204,98,.38),inset 0 2px 0 rgba(255,255,255,.16),inset 0 -3px 0 rgba(0,0,0,.4),4px 4px 0 #000;min-width:0;}',
      '.ygg-carte.pret{box-shadow:inset 0 2px 0 rgba(255,255,255,.2),inset 0 -3px 0 rgba(0,0,0,.4),4px 4px 0 #000,0 0 18px rgba(240,204,98,.75);}',
      '.ygg-carte::before{content:"❦";position:absolute;top:-.55em;left:.35em;font-size:clamp(12px,3cqw,20px);color:var(--or);text-shadow:0 1px 0 #000,0 0 6px rgba(240,204,98,.7);}',
      '.ygg-nom{padding:.25em .5em;border:2px solid #000;border-radius:3px;text-align:center;font-weight:900;font-size:clamp(9px,2.1cqw,14px);line-height:1.15;color:#fff3c4;text-shadow:0 1px 0 #000;background:linear-gradient(180deg,#355f40,#1a3a26);min-height:2.4em;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:.3em;}',
      '.ygg-nom span{color:var(--or);font-weight:700;}',
      '.ygg-vitre{position:relative;overflow:hidden;aspect-ratio:5/4;border:3px solid #000;border-radius:12px;background:radial-gradient(ellipse at 50% 35%,#4a8a58,#0d2a18);box-shadow:inset 0 0 18px rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;}',
      '.ygg-secours{font-size:clamp(26px,9cqw,60px);filter:drop-shadow(0 2px 0 rgba(0,0,0,.6));}',
      /* Fruit d'or (20 images de croissance, 561 x 701 environ) : le cadre prend le FORMAT de l'image (4/5, portrait), pas sa résolution. */
      '.ygg-vitre.ygg-portrait{aspect-ratio:4/5;width:84%;margin:0 auto;}',
      /* Porte close : dessin fixe, aucune animation ; seule la classe .ouvre anime (transform et opacité, une fois). */
      '.ygg-porte{position:absolute;inset:0;z-index:4;display:flex;overflow:hidden;pointer-events:none;border-radius:9px;perspective:300px;background:#120f0c;box-shadow:inset 0 0 0 3px #17130f,inset 0 0 0 6px var(--r,#8a8272),inset 0 0 0 8px #17130f;}',
      '.ygg-porte-g,.ygg-porte-d{position:relative;flex:1 1 50%;backface-visibility:hidden;}',
      '.ygg-porte-g{margin:8px 0 8px 8px;transform-origin:0 50%;}',
      '.ygg-porte-d{margin:8px 8px 8px 0;transform-origin:100% 50%;}',
      '.ygg-porte svg{display:block;width:100%;height:100%;}',
      '.ygg-porte-d svg{transform:scaleX(-1);}',
      '.ygg-porte-emb{position:absolute;left:50%;top:50%;width:34%;aspect-ratio:1;transform:translate(-50%,-50%);display:block;padding:5%;box-sizing:border-box;border-radius:50%;color:var(--e);background:radial-gradient(circle at 35% 30%,hsl(var(--h) 22% 26%),#100d0b);box-shadow:0 0 0 2px var(--r),0 0 0 4px #17130f,0 3px 5px rgba(0,0,0,.6);}',
      '.ygg-porte-emb svg{display:block;width:100%;height:100%;overflow:visible;}',
      /* Téléphone (Norman, 2026-10-26 : « sur téléphone, les portes ne sont plus à la bonne taille par rapport aux images ») : le cadre de la porte (8 px de marge et de liserés) est fait pour un grand portrait ; sur un portrait de ~140 px il mangeait 11 % de l'image et la porte paraissait trop petite. Cadre réduit de moitié en proportion. */
      '@media (max-width:640px){.ygg-porte{border-radius:6px;box-shadow:inset 0 0 0 2px #17130f,inset 0 0 0 3px var(--r,#8a8272),inset 0 0 0 4px #17130f;}.ygg-porte-g{margin:4px 0 4px 4px;}.ygg-porte-d{margin:4px 4px 4px 0;}.ygg-porte-emb{width:38%;}}',
      '.ygg-porte-lueur{position:absolute;inset:0;opacity:0;background:radial-gradient(ellipse at 50% 55%,var(--e),transparent 70%);}',
      '@keyframes yggPorteG{0%{transform:rotateY(0)}25%{transform:rotateY(-6deg)}100%{transform:rotateY(-104deg)}}',
      '@keyframes yggPorteD{0%{transform:rotateY(0)}25%{transform:rotateY(6deg)}100%{transform:rotateY(104deg)}}',
      '@keyframes yggPorteLueur{0%,20%{opacity:0}55%{opacity:1}100%{opacity:0}}',
      '@keyframes yggPorteFin{0%,80%{opacity:1}100%{opacity:0}}',
      '@keyframes yggPorteEmb{0%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-50%) scale(1.5)}}',
      /* Le cadre (liserés) RESTE pendant l'ouverture et se fond avec la porte (Norman, 2026-10-26 : « les portes qui s'ouvraient laissaient voir l'image sur leurs bords extérieurs ») : seul le fond devient transparent, pour voir l'image entre les vantaux. */
      '.ygg-porte.ouvre{animation:yggPorteFin calc(1.5s*var(--vit,1)) linear both;background:transparent;}',
      '.ygg-porte.ouvre .ygg-porte-g{animation:yggPorteG calc(1.25s*var(--vit,1)) cubic-bezier(.45,.05,.3,1) both;}',
      '.ygg-porte.ouvre .ygg-porte-d{animation:yggPorteD calc(1.25s*var(--vit,1)) cubic-bezier(.45,.05,.3,1) both;}',
      '.ygg-porte.ouvre .ygg-porte-lueur{animation:yggPorteLueur calc(1.4s*var(--vit,1)) ease-out both;}',
      '.ygg-porte.ouvre .ygg-porte-emb{animation:yggPorteEmb calc(.35s*var(--vit,1)) ease-in both;}',
      /* Fermeture (un fruit mangé ou récolté sans auto) : exactement les mêmes images que l'ouverture, jouées à l'envers. */
      '.ygg-porte.referme{animation:yggPorteFin calc(1.5s*var(--vit,1)) linear both reverse;background:transparent;}',
      '.ygg-porte.referme .ygg-porte-g{animation:yggPorteG calc(1.25s*var(--vit,1)) cubic-bezier(.45,.05,.3,1) both reverse;}',
      '.ygg-porte.referme .ygg-porte-d{animation:yggPorteD calc(1.25s*var(--vit,1)) cubic-bezier(.45,.05,.3,1) both reverse;}',
      '.ygg-porte.referme .ygg-porte-lueur{animation:yggPorteLueur calc(1.4s*var(--vit,1)) ease-out both reverse;}',
      '.ygg-porte.referme .ygg-porte-emb{animation:yggPorteEmb calc(.35s*var(--vit,1)) ease-in both reverse;animation-delay:calc(1.15s*var(--vit,1));}',
      '@media (prefers-reduced-motion:reduce){.ygg-porte.ouvre,.ygg-porte.referme{display:none;}}',
      '.ygg-portrait .ygg-img{inset:3%;width:94%;height:94%;}',
      /* Fruits aux 24 images : même cadre portrait 4/5 que l'or et les fruits de Puissance (les cartes d'une rangée restent alignées) ; le décor carré est recadré au centre (le fruit et sa terre y tiennent) et l'image du fruit, fond transparent, est recadrée de la même façon pour se superposer exactement, sans marge ni ombre portée. */
      '.ygg-vitre.ygg-decor{background-size:cover;background-position:center;}',
      '.ygg-vitre.ygg-decor .ygg-img{inset:0;width:100%;height:100%;object-fit:cover;object-position:center;filter:none;transition:left 4s linear,top 4s linear,width 4s linear,height 4s linear,filter 4s linear,opacity 4s linear;}',
      '.ygg-vitre.ygg-decor .ygg-terre{inset:auto;z-index:2;left:calc((1 - var(--ygg-s,1))*50%);top:calc((1 - var(--ygg-s,1))*98.8%);width:calc(var(--ygg-s,1)*100%);height:calc(var(--ygg-s,1)*100%);}',
      '.ygg-vitre.ygg-decor .ygg-fruit{inset:auto;z-index:1;opacity:var(--ygg-fo,1);left:calc((1 - var(--ygg-f,1))*50%);top:calc((0.988 - 0.138*var(--ygg-s,1) - 0.9*var(--ygg-f,1))*100%);width:calc(var(--ygg-f,1)*100%);height:calc(var(--ygg-f,1)*100%);}',
      '.ygg-vitre.ygg-aura::after{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(62% 48% at 50% 68%,color-mix(in srgb,var(--ygg-aura) calc(var(--ygg-aura-a)*72%),transparent),transparent 72%);mix-blend-mode:screen;}',
      '.ygg-vitre.ygg-decor.ygg-aura .ygg-fruit{filter:drop-shadow(0 0 calc(3px + var(--ygg-aura-a)*28px) color-mix(in srgb,var(--ygg-aura) calc(var(--ygg-aura-a)*100%),transparent));}',
      '.ygg-img{position:absolute;inset:6%;width:88%;height:88%;object-fit:contain;filter:drop-shadow(0 3px 2px rgba(0,0,0,.6));image-rendering:auto;}',
      '.ygg-barre{position:relative;height:clamp(9px,2cqw,14px);border:2px solid #000;border-radius:3px;background:#0a1d12;overflow:hidden;}',
      '.ygg-barre i{display:block;height:100%;background:linear-gradient(180deg,#d6ff9a,#55b062);box-shadow:0 0 8px rgba(160,255,150,.6);}',
      '.ygg-barre.vide i{background:#7a2d2d;}',
      '.ygg-temps{font-size:clamp(8px,1.7cqw,12px);text-align:center;color:#cfe8bf;line-height:1.2;}',
      '.ygg-btn{appearance:none;-webkit-appearance:none;cursor:pointer;min-height:42px;padding:.3em .4em;border:3px solid #000;border-radius:4px;font:900 clamp(9px,2.1cqw,14px) Georgia,serif;letter-spacing:.03em;color:#2b1d00;background:linear-gradient(180deg,#ffe38a,#d9a62f);box-shadow:inset 0 2px 0 rgba(255,255,255,.55),3px 3px 0 #000;touch-action:manipulation;-webkit-tap-highlight-color:transparent;line-height:1.1;}',
      '.ygg-btn small{display:block;font-weight:700;font-size:.78em;opacity:.8;}',
      '.ygg-btn:active:not(:disabled){transform:translate(2px,2px);box-shadow:inset 0 2px 0 rgba(255,255,255,.4),1px 1px 0 #000;}',
      '.ygg-btn:disabled{cursor:default;color:#7d8a70;background:linear-gradient(180deg,#46543f,#2c3a2a);box-shadow:inset 0 2px 0 rgba(255,255,255,.1),3px 3px 0 #000;}',
      '.ygg-btn.vert{color:#f4edc9;background:linear-gradient(180deg,#4ea866,#256b3c);}',
      '.ygg-btn.vert:disabled{color:#7d8a70;background:linear-gradient(180deg,#46543f,#2c3a2a);}',
      '.ygg-actions{display:grid;grid-template-columns:1fr;gap:1.1cqw;}',
      '.ygg-mode{display:grid;grid-template-columns:1fr 1fr;border:2px solid #000;border-radius:4px;overflow:hidden;}',
      '.ygg-mode button{min-height:36px;padding:.2em .1em;border:0;cursor:pointer;font:800 clamp(8px,1.8cqw,12px) Georgia,serif;color:#cfe8bf;background:#17381f;}',
      '.ygg-mode button+button{border-left:2px solid #000;}',
      '.ygg-apercu{display:grid;gap:2px;margin-top:4px;padding:3px 5px;border:1px solid #000;border-radius:4px;background:rgba(10,30,14,.72);color:#e5f3d6;font:700 clamp(10px,1.9cqw,12px) Georgia,serif;line-height:1.25}',
      '.ygg-apercu b{color:#ffe38a}',
      '.ygg-mode button[aria-pressed="true"]{color:#2b1d00;background:linear-gradient(180deg,#ffe38a,#d9a62f);}',
      '.ygg-poop{display:flex;align-items:center;justify-content:center;gap:.4em;min-height:36px;border:2px solid #000;border-radius:4px;cursor:pointer;font:800 clamp(8px,1.8cqw,12px) Georgia,serif;color:#e9d9b6;background:#3a2a18;}',
      '.ygg-poop[aria-pressed="true"]{color:#fff;background:linear-gradient(180deg,#8a5a2a,#5b3a18);box-shadow:0 0 10px rgba(240,170,80,.7);}',
      '.ygg-poop:disabled{opacity:.78;cursor:default;}',
      '.ygg-poop .ygg-mini{position:relative;width:1.5em;height:1.5em;display:inline-flex;align-items:center;justify-content:center;}',
      '.ygg-mini .ygg-img{inset:0;width:100%;height:100%;}',
      '.ygg-mini .ygg-secours{font-size:1.2em;}',
      '.ygg-auto{font-size:clamp(8px,1.6cqw,11px);text-align:center;color:#a8e0a8;min-height:1.2em;}',
      '.ygg-auto button{width:100%;min-height:34px;font-size:clamp(8px,1.7cqw,11px);}',
      /* Bandeau du bas. */
      '.ygg-bas{margin-top:2.6cqw;padding:2.2cqw;border:3px solid #000;border-radius:6px;background:linear-gradient(180deg,rgba(18,48,30,.96),rgba(8,26,16,.98));box-shadow:inset 0 2px 0 rgba(255,255,255,.12),5px 5px 0 #000;display:grid;grid-template-columns:1.1fr 1fr;gap:2.2cqw;align-items:center;}',
      '.ygg-monnaies{display:flex;flex-wrap:wrap;gap:2.4cqw;align-items:center;}',
      '.ygg-monnaies-haut{margin:0 0 2.6cqw;padding:1.6cqw 2.2cqw;border:3px solid #000;border-radius:6px;background:linear-gradient(180deg,rgba(18,48,30,.96),rgba(8,26,16,.98));box-shadow:inset 0 2px 0 rgba(255,255,255,.12),5px 5px 0 #000;}',
      '.ygg-monnaie{display:flex;align-items:center;gap:1.2cqw;font-size:clamp(15px,4.2cqw,28px);font-weight:900;color:var(--or);text-shadow:0 2px 0 #000;}',
      '.ygg-monnaie .ygg-vignette{position:relative;width:clamp(34px,10cqw,64px);height:clamp(34px,10cqw,64px);display:flex;align-items:center;justify-content:center;border:3px solid #000;border-radius:10px;background:radial-gradient(circle at 50% 35%,#4a8a58,#0d2a18);}',
      '.ygg-vignette .ygg-img{inset:8%;width:84%;height:84%;}',
      '.ygg-vignette .ygg-secours{font-size:clamp(20px,6cqw,38px);}',
      '.ygg-bonus{grid-column:1/2;font-size:clamp(9px,2cqw,14px);line-height:1.5;}',
      '.ygg-bonus b{color:var(--or);}',
      '.ygg-actions-bas{display:grid;gap:1.4cqw;}',
      '.ygg-solo{display:flex;align-items:center;gap:.6em;min-height:44px;font-size:clamp(9px,1.9cqw,13px);cursor:pointer;}',
      '.ygg-solo input{width:22px;height:22px;accent-color:#e0b640;flex:0 0 auto;}',
      '.ygg-note{margin-top:1.6cqw;font-size:clamp(8px,1.7cqw,12px);color:#b9d8a8;line-height:1.4;text-align:center;}',
      '@container (max-width:520px){.ygg-bas{grid-template-columns:1fr}.ygg-bonus{grid-column:auto}.ygg-grille{gap:1.6cqw}.ygg-carte{padding:1.2cqw;gap:.9cqw}}',
      /* Page sans bords (Norman, 2026-10-15) : plus de cadre ni de médaillons, la page prend toute la largeur ; textes plus grands et plus clairs. */
      '.ygg-page{max-width:none!important;margin:0!important}',
      '.ygg-cadre{padding:0!important;border:0!important;border-radius:0!important;background:none!important;box-shadow:none!important}',
      '.ygg-cadre::before,.ygg-cadre::after{display:none!important}',
      '.ygg-titre small{font-size:clamp(12px,2.4cqw,15px)!important}',
      '.ygg-aide{font-size:clamp(14px,2.6cqw,17px)!important;color:#f4f8ea}',
      '.ygg-aide-bouton{font-size:clamp(12px,2.4cqw,15px)!important}',
      '.ygg-onglet{font-size:clamp(13px,2.8cqw,17px)!important}',
      '.ygg-nom{font-size:clamp(13px,2.6cqw,16px)!important;color:#fff8d8}',
      '.ygg-temps{font-size:clamp(12px,2.2cqw,14px)!important;color:#eaf6df}',
      '.ygg-btn{font-size:clamp(12px,2.5cqw,15px)!important}',
      '.ygg-mode button,.ygg-poop{font-size:clamp(12px,2.2cqw,14px)!important;color:#f0f8e6}',
      '.ygg-auto{font-size:clamp(12px,2cqw,13px)!important;color:#c4eec4}',
      '.ygg-auto button{font-size:clamp(12px,2.1cqw,13px)!important}',
      '.ygg-bonus{font-size:clamp(13px,2.4cqw,16px)!important;color:#f4f8ea}',
      '.ygg-solo{font-size:clamp(13px,2.3cqw,15px)!important}',
      '.ygg-note{font-size:clamp(12px,2.1cqw,14px)!important;color:#d6ecc6}',
      '@container (max-width:560px){.ygg-grille{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:2.4cqw}}',
      'html body.soreal-idle-active-v47.soreal-idle-active-v47 .soreal-idle-page-root-v28[data-menu="yggdrasil"]:not(#_):not(#_){border:0!important;border-radius:0!important;padding:6px 4px 10px!important;box-shadow:none!important}',
      /* Fruits de Magic : teinte bleu-vert (la lumière du fruit est gardée, seule la couleur change) ; fruit qui pousse : une lueur s'échappe du cadre ; fruit au maximum de sa croissance : elle brille bien plus (Norman, 2026-10-22). Boucles sans à-coup : mêmes valeurs à 0 % et 100 %. */
      '.ygg-carte{--lueur:150,255,140}',
      '.ygg-carte.magie{--lueur:50,228,208;background:linear-gradient(180deg,rgba(36,112,108,.95),rgba(12,54,60,.97));box-shadow:inset 0 0 0 2px rgba(110,240,225,.4),inset 0 2px 0 rgba(255,255,255,.16),inset 0 -3px 0 rgba(0,0,0,.4),4px 4px 0 #000}',
      '.ygg-carte.magie .ygg-vitre{background:radial-gradient(ellipse at 50% 35%,#3fb3a4,#082a32)}',
      '.ygg-carte.magie .ygg-vitre::after{content:"";position:absolute;inset:0;z-index:2;pointer-events:none;background:linear-gradient(160deg,#22e8c4,#1b9ad8);mix-blend-mode:hue;opacity:.9}',
      '.ygg-carte.magie .ygg-barre i{background:linear-gradient(180deg,#b6fff0,#27b9b0);box-shadow:0 0 8px rgba(80,240,220,.7)}',
      '.ygg-carte.pousse,.ygg-carte.pret{z-index:1}',
      '.ygg-carte.pousse .ygg-vitre{animation:yggLueur 2.6s ease-in-out infinite}',
      '.ygg-carte.pret .ygg-vitre{animation:yggBrille 1.6s ease-in-out infinite}',
      '@keyframes yggLueur{0%,100%{box-shadow:inset 0 0 18px rgba(0,0,0,.7),0 0 6px 1px rgba(var(--lueur),.35),0 0 14px 2px rgba(var(--lueur),.18)}50%{box-shadow:inset 0 0 18px rgba(0,0,0,.7),0 0 14px 4px rgba(var(--lueur),.62),0 0 30px 8px rgba(var(--lueur),.32)}}',
      '@keyframes yggBrille{0%,100%{box-shadow:inset 0 0 20px rgba(255,255,255,.14),0 0 16px 5px rgba(var(--lueur),.7),0 0 36px 10px rgba(var(--lueur),.4),0 0 62px 16px rgba(var(--lueur),.2)}50%{box-shadow:inset 0 0 26px rgba(255,255,255,.3),0 0 28px 10px rgba(var(--lueur),.98),0 0 58px 20px rgba(var(--lueur),.62),0 0 96px 30px rgba(var(--lueur),.34)}}',
      '@media (prefers-reduced-motion:reduce){.ygg-btn{transition:none}.ygg-carte.pousse .ygg-vitre,.ygg-carte.pret .ygg-vitre{animation:none;box-shadow:inset 0 0 18px rgba(0,0,0,.7),0 0 16px 4px rgba(var(--lueur),.6)}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  /* ---------- Données ---------- */
  function lire_(j){
    var meta=window.__SOREAL_IDLE_META_V130__;
    var s=meta&&meta.systemeMetaParIdIdleV130_?meta.systemeMetaParIdIdleV130_(j,'yggdrasil'):null;
    if(!s||!s.state||!s.state.unlocked)return null;
    var m=(j&&j.systemes)||{};
    var data=s.state.data||{};
    var x=m.yggExtra||{};
    var macOk=Boolean(meta.systemeMetaParIdIdleV130_(j,'macguffins')&&meta.systemeMetaParIdIdleV130_(j,'macguffins').state&&meta.systemeMetaParIdIdleV130_(j,'macguffins').state.unlocked);
    var fruits=data.fruits||{};
    var xf=x.fruits||{};
    var visibles=(Array.isArray(m.yggFruits)?m.yggFruits:[]).filter(function(def){
      if(/MacGuffin/i.test(String(def.name||def.id||''))&&!macOk)return false;
      var e=xf[def.id]||{};var f=fruits[def.id]||{};
      return !(e.unlocked===false&&!(nb_(f.tier)>0));
    }).map(function(def){
      var f=fruits[def.id]||{};var e=xf[def.id]||{};
      var tier=ent_(f.tier);
      var growth=Math.max(0,nb_(f.growthHours));
      return {def:def,f:f,e:e,tier:tier,growth:growth,active:Boolean(f.active),pret:Boolean(f.active)&&growth>=1,max:e.nextTierCost===null};
    });
    return {s:s,m:m,x:x,data:data,fruits:visibles,seeds:ent_(m.currencies&&m.currencies.seeds),exp:nb_(m.currencies&&m.currencies.experience),poop:ent_(x.poop),
      maxTier:ent_(x.maxTier)||10,tierSec:nb_(x.tierSeconds)>0?nb_(x.tierSeconds):3600};
  }

  /*
   * Image de croissance du fruit d'or (Norman, 2026-10-15 : 20 images dans idle/yggdrasil/). L'image avance avec la croissance rapportee au tier MAXIMUM du fruit (10, ou 24 apres trois victoires au Troll), pas au tier
   * acheté : un fruit monte à 4 h seulement n'avance que dans les premières images ; la dernière (19) n'apparait que fruit au tier maximum ET entièrement poussé.
   */
  /* Fruits qui ont des images de croissance : l'or, et les trois Fruits de Puissance (dossier idle/yggdrasil/puissance/, voir idle-media-v1.js). */
  var ETAPES_FRUITS_={};   /* les anciennes images à 20 étapes (or, Puissance) sont remplacées : tous les fruits ont maintenant 24 images, voir FRUITS_24_ */
  /*
   * Tous les fruits (Norman, 2026-10-25 : l'or et les trois fruits de Puissance sont passés au nouveau style, anciennes images de l'or sauvegardées dans idle/ygg-anciens/) : 24 images de pousse, une par heure du tier maximum de 24 h, posées sur un décor peint en rapport avec leur bonus (route ygg ?decor=1).
   * Mêmes règles que ci-dessus avec 24 images au lieu de 20 : la dernière n'apparait que fruit au tier maximum ET entièrement poussé.
   */
  var FRUITS_24_={gold:true,powerAlpha:true,powerBeta:true,powerDelta:true,adventure:true,knowledge:true,pomegranate:true,luck:true,arbitrariness:true,numbers:true,rage:true,macguffinAlpha:true,watermelon:true,macguffinBeta:true,quirks:true,angryMayo:true,sadMayo:true,moldyMayo:true,ayyMayo:true,cincoMayo:true,prettyMayo:true};
  /*
   * DEUX COUCHES INDÉPENDANTES (Norman, 2026-10-26) : une image de TERRE unique (idle/ygg-terre/terre.webp, la même sous tous les fruits) et une image de FRUIT sans terre par fruit (idle/ygg-fruits/<fruit>.webp). Les deux grossissent avec les heures
   * RÉELLES de pousse sur une échelle de 24 h (jamais sur le temps maximum débloqué : un fruit limité à 5 h s'arrête à la croissance prévue pour 5 h), mais PAS selon la même courbe :
   *  - la terre commence minuscule dès l'heure 0 et grossit vite d'abord, puis de plus en plus lentement (arrondi vers l'extérieur) jusqu'à sa taille pleine à la 24e heure ;
   *  - le fruit est invisible pendant la première heure (la terre seule), puis apparaît tout petit après UNE heure complète et grossit sans condition, lentement d'abord puis de plus en plus vite, jusqu'à sa taille pleine à la 24e heure.
   * Le fruit reste posé sur la terre : sa base suit le point de contact de la terre (voir .ygg-fruit dans le style).
   */
  function heuresPousse_(v){return Math.max(0,Math.min(Number(v.growth)||0,24));}
  function echelleTerre_(v){var t=heuresPousse_(v)/24;return (0.14+0.86*(1-Math.pow(1-t,2))).toFixed(3);}
  function echelleFruit_(v){var g=heuresPousse_(v);return g<1?'0.000':(0.05+0.95*Math.pow((g-1)/23,1.15)).toFixed(3);}
  /*
   * Aura du fruit (Norman, 2026-10-26) : de la couleur du fruit (teintes relevées sur la dernière image de chacun), elle apparaît APRÈS la 12e heure de pousse, faible puis de plus en plus forte ; la 24e heure est beaucoup plus
   * prononcée que toutes les autres. Elle suit les heures réelles de pousse : un fruit limité à 12 h (ou moins) n'en a jamais.
   */
  var AURAS_={gold:'#ffb21f',powerAlpha:'#ff4a2a',powerBeta:'#7a6cff',powerDelta:'#ffa21a',adventure:'#c9d63a',knowledge:'#e87848',pomegranate:'#ff3b2c',luck:'#b9d11a',arbitrariness:'#e6b834',numbers:'#79bfee',rage:'#ff4426',macguffinAlpha:'#ff9430',watermelon:'#9ccc24',macguffinBeta:'#4a7cff',quirks:'#ff8c22',angryMayo:'#ff6126',sadMayo:'#4fb0d6',moldyMayo:'#d6b13a',ayyMayo:'#c4d824',cincoMayo:'#ff9a38',prettyMayo:'#ff9c40'};
  function intensiteAura_(v){
    var g=Math.max(0,Math.min(Number(v.growth)||0,24));
    if(g<=12)return 0;
    if(g<=23)return 0.08+0.30*((g-12)/11);
    return 0.38+0.62*Math.min(1,g-23);
  }
  var URL_TERRE_='/api/idle/media/ygg?name=terre&terre=1';
  /*
   * Teinte de la terre (Norman, 2026-10-26 : « une petite teinte sur le tas de terre en fonction de la terre sur laquelle il pousse, pour qu'elle se fonde mieux : elle fait image ajoutée sur une autre image ») : la couleur moyenne du SOL du décor du fruit
   * (bande basse, au centre) est mélangée à 30 % dans l'image de terre, seulement sur les pixels de la terre. Calculée une fois par fruit dans la page, gardée en mémoire ; l'image d'origine s'affiche en attendant.
   */
  etat.terrePrep={};etat.terreTeintee={};
  function preparerTerre_(id){
    if(etat.terrePrep[id]||typeof Image==='undefined'||typeof document==='undefined')return;
    etat.terrePrep[id]=1;
    var decor=new Image(),terre=new Image(),n=0;
    function fin(){
      if(++n<2)return;
      try{
        var c=document.createElement('canvas');c.width=c.height=64;
        var x=c.getContext('2d');x.drawImage(decor,0,0,64,64);
        var d=x.getImageData(14,40,36,18).data,r=0,g=0,b=0,k=0,i;
        for(i=0;i<d.length;i+=4){r+=d[i];g+=d[i+1];b+=d[i+2];k+=1;}
        if(!k)return;
        var W=terre.naturalWidth||512,H=terre.naturalHeight||512;
        var o=document.createElement('canvas');o.width=W;o.height=H;
        var y=o.getContext('2d');y.drawImage(terre,0,0,W,H);
        y.globalCompositeOperation='source-atop';
        y.fillStyle='rgba('+Math.round(r/k)+','+Math.round(g/k)+','+Math.round(b/k)+',0.30)';
        y.fillRect(0,0,W,H);
        o.toBlob(function(blob){
          if(!blob)return;
          var u=URL.createObjectURL(blob);
          etat.terreTeintee[id]=u;
          Array.prototype.forEach.call(document.querySelectorAll('img.ygg-terre[data-fruit="'+id+'"]'),function(im){im.src=u;});
        },'image/webp',0.92);
      }catch(_e){}
    }
    decor.onload=fin;terre.onload=fin;
    decor.src='/api/idle/media/ygg?name='+encodeURIComponent(id)+'&decor=1';
    terre.src=URL_TERRE_;
  }
  function couches_(d,v,id,def){
    if(FRUITS_24_[id]!==true||!(v.tier>0))return image_(id,emoji_(id,def.name),'',null);
    return image_(id,emoji_(id,def.name),'ygg-fruit',null,'/api/idle/media/ygg?name='+encodeURIComponent(id)+'&fruit=1')+(preparerTerre_(id),'<img class="ygg-img ygg-terre" alt="" draggable="false" data-fruit="'+html_(id)+'" src="'+(etat.terreTeintee[id]||URL_TERRE_)+'">');
  }
  function nbEtapes_(id){return FRUITS_24_[id]===true?24:20;}
  /* Plus d'images de croissance : la pousse est une taille (voir echelleTerre_ et echelleFruit_) ; la fonction reste pour les appels existants. */
  function etapeCroissance_(d,v){return null;}

  /*
   * Les PORTES (Norman, 2026-10-16) : tant que l'énergie n'a pas été placée pour activer un fruit, une porte close en bois et en fer cache son image. Fermée, elle est un dessin FIXE (deux vantaux en SVG
   * intégré, aucune image à télécharger, aucune animation, aucun filtre) ; la seule animation est l'OUVERTURE (les deux vantaux pivotent, une lueur passe), jouée une fois quand le fruit s'active, avec son
   * son (yggdrasil-sons-v1.js, « porte »). Un fruit déjà actif à l'ouverture de la page n'a pas de porte ; le fruit mangé ou récolté (inactif) retrouve sa porte close sans animation.
   * La teinte de la porte varie d'un fruit à l'autre (même dessin, seule la variable --h change).
   */
  /* Décor du titre : une touffe de feuilles (dessin SVG fixe, utilisé aux deux bouts) et une vigne. */
  var FEUILLAGE_='<svg viewBox="0 0 64 56" focusable="false" aria-hidden="true"><g fill="#3f8a3a" stroke="#1b3512" stroke-width="1.5" stroke-linejoin="round"><path d="M30 28C26 6 48 0 60 8 58 24 44 32 30 28z"/><path d="M30 28C22 40 30 54 50 52 54 38 44 28 30 28z" fill="#357a32"/><path d="M30 28C10 30 2 16 6 6 22 4 32 14 30 28z" fill="#55a449"/><path d="M30 28C12 32 4 46 12 54 26 54 34 42 30 28z" fill="#2f6e2e"/></g><g stroke="#b6e79a" stroke-width="1" fill="none" opacity=".75"><path d="M31 27 49 11M31 29 47 45M29 27 11 13M29 30 13 47"/></g><circle cx="30" cy="28" r="3.4" fill="#f0c94c" stroke="#6a4a10" stroke-width="1.2"/></svg>';
  var VIGNE_='<svg viewBox="0 0 200 17" preserveAspectRatio="none" focusable="false" aria-hidden="true"><path d="M0 3C22 14 38 1 62 8S104 15 128 6 176 2 200 9" fill="none" stroke="#4d9b3b" stroke-width="2.4" stroke-linecap="round"/><g fill="#5db04a" stroke="#1b3512" stroke-width="1"><ellipse cx="22" cy="12" rx="6" ry="3" transform="rotate(35 22 12)"/><ellipse cx="62" cy="13" rx="6" ry="3" transform="rotate(-30 62 13)"/><ellipse cx="104" cy="14" rx="6" ry="3" transform="rotate(40 104 14)"/><ellipse cx="148" cy="9" rx="6" ry="3" transform="rotate(-35 148 9)"/><ellipse cx="184" cy="12" rx="6" ry="3" transform="rotate(30 184 12)"/></g><g fill="#f4e27a" stroke="#7a5a10" stroke-width=".8"><circle cx="42" cy="6" r="2.2"/><circle cx="126" cy="7" r="2.2"/></g></svg>';
  var DUREE_OUVERTURE_=1500;
  function teinte_(id){var h=0;for(var i=0;i<id.length;i++)h=(h*31+id.charCodeAt(i))%360;return h;}
  /*
   * Une porte par fruit (Norman, 2026-10-16 : « un style en rapport avec le fruit »). Même gabarit, mais chaque fruit a SA palette (bois, ferrures, liseré) et SON emblème gravé sur un médaillon :
   * pièce d'or, lettre grecque, boussole, livre, grenade, trèfle, dé, chiffres, flamme, gemme, pastèque, étoile. Dessins SVG intégrés de quelques dizaines d'octets, fixes ; l'emblème s'efface à l'ouverture.
   * Format : [teinte du bois, saturation, couleur des ferrures, couleur du liseré, couleur de l'emblème, dessin de l'emblème].
   */
  var EMB_PIECE_='<circle cx="12" cy="12" r="9"/><path d="M12 6.5v11M9 9.3c0-1.5 1.4-2.2 3-2.2s3 .7 3 2.2-1.4 1.9-3 2.4-3 .9-3 2.4 1.4 2.2 3 2.2 3-.7 3-2.2"/>';
  var EMB_ECLAIR_='<path d="M13.5 2 5 13.5h6L10 22l9-12h-6z" fill="currentColor" fill-opacity=".14" stroke-opacity=".45" stroke-width="1"/>';
  var EMB_GEMME_='<path d="M7 4h10l4 6-9 11L3 10z"/><path d="M3 10h18M9 4l-2 6 5 11 5-11-2-6" stroke-width="1.1"/>';
  /* Les fruits « Mayo » : un pot de mayonnaise, chacun avec son humeur. */
  var EMB_POT_='<rect x="6" y="9.5" width="12" height="11.5" rx="3"/><rect x="7.5" y="5.5" width="9" height="3.5" rx="1"/>';
  var THEMES_={
    gold:[38,52,'#bf9433','#e8c566','#ffe08a',EMB_PIECE_],
    powerAlpha:[212,24,'#5e7184','#9db4cc','#bfe0ff',EMB_ECLAIR_+'<text x="12" y="18" text-anchor="middle" font-size="19" font-weight="700" font-family="Georgia,serif" fill="currentColor" stroke="none">α</text>'],
    powerBeta:[262,24,'#6b5e84','#b5a4d8','#e1d4ff',EMB_ECLAIR_+'<text x="12" y="18" text-anchor="middle" font-size="19" font-weight="700" font-family="Georgia,serif" fill="currentColor" stroke="none">β</text>'],
    powerDelta:[355,30,'#84575e','#d49aa4','#ffd0d6',EMB_ECLAIR_+'<text x="12" y="18" text-anchor="middle" font-size="19" font-weight="700" font-family="Georgia,serif" fill="currentColor" stroke="none">δ</text>'],
    adventure:[28,42,'#5a4326','#b58a4a','#f3d9a0','<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5 13.5 13.5 8.5 15.5 10.5 10.5z" fill="currentColor" fill-opacity=".35"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2" stroke-width="1.2"/>'],
    knowledge:[275,30,'#3e2a57','#a98bd6','#e6d6ff','<path d="M3 6c3-1.5 6-1.5 9 1 3-2.5 6-2.5 9-1v13c-3-1.5-6-1.5-9 1-3-2.5-6-2.5-9-1z"/><path d="M12 7v13"/>'],
    pomegranate:[345,45,'#4a1c27','#cf6a7c','#ffb3c0','<circle cx="12" cy="13.5" r="7.5"/><path d="M8.5 6.5 10 8.5l2-2 2 2 1.5-2"/>'],
    luck:[135,38,'#1f4a2c','#6ec27f','#b9f5c4','<circle cx="9" cy="9" r="3.4"/><circle cx="15" cy="9" r="3.4"/><circle cx="9" cy="15" r="3.4"/><circle cx="15" cy="15" r="3.4"/><path d="M12 14c0 3 1 5 3 7"/>'],
    arbitrariness:[190,40,'#17434d','#5fb7c9','#c9f3fb','<rect x="4" y="4" width="16" height="16" rx="3.5"/><g fill="currentColor" stroke="none"><circle cx="8.5" cy="8.5" r="1.4"/><circle cx="15.5" cy="8.5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="8.5" cy="15.5" r="1.4"/><circle cx="15.5" cy="15.5" r="1.4"/></g>'],
    numbers:[55,40,'#4a4416','#cbbd54','#fff3a0','<text x="12" y="16.5" text-anchor="middle" font-size="11.5" font-weight="700" font-family="Georgia,serif" fill="currentColor" stroke="none">123</text>'],
    rage:[8,55,'#4d1410','#e0553c','#ffb199','<path d="M12 2.5c1 3.5 5.5 5.5 5.5 11a5.5 5.5 0 0 1-11 0c0-2.2 1-3.7 2-4.7.3 1.6 1 2.4 1.8 2.7C10 8.4 10.6 5.2 12 2.5z" fill="currentColor" fill-opacity=".3"/>'],
    macguffinAlpha:[300,30,'#4a1f55','#d17be0','#f6c8ff',EMB_GEMME_],
    macguffinBeta:[175,35,'#154a44','#4fd1c0','#bff7ee',EMB_GEMME_],
    watermelon:[100,40,'#1c4a22','#e0627a','#ff9aa8','<path d="M3 10a9 9 0 0 0 18 0z" fill="currentColor" fill-opacity=".3"/><path d="M3 10h18"/><g fill="currentColor" stroke="none"><circle cx="9" cy="13.3" r=".9"/><circle cx="12" cy="15" r=".9"/><circle cx="15" cy="13.3" r=".9"/></g>'],
    quirks:[320,38,'#4d1b3a','#e07bb8','#ffc8e6','<path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/>'],
    angryMayo:[4,50,'#4d1210','#e24b3a','#ffb0a4',EMB_POT_+'<g fill="currentColor" stroke="none"><circle cx="10" cy="15" r="1"/><circle cx="14" cy="15" r="1"/></g><path d="M8.5 12.5 11 13.6M15.5 12.5 13 13.6M10 18.4q2-1.3 4 0" stroke-width="1.3"/>'],
    sadMayo:[210,35,'#1b3552','#5a9bd6','#bfe0ff',EMB_POT_+'<g fill="currentColor" stroke="none"><circle cx="10" cy="14.5" r="1"/><circle cx="14" cy="14.5" r="1"/><path d="M14.4 16.2c.9 1.1.9 1.8 0 2.1-.9-.3-.9-1 0-2.1z"/></g><path d="M10 18.8q2-1.4 4 0" stroke-width="1.3"/>'],
    moldyMayo:[90,22,'#2f3a1c','#8aa04a','#d4e6a0',EMB_POT_+'<g fill="currentColor" stroke="none"><circle cx="9.6" cy="13" r="1.3"/><circle cx="14.2" cy="15.5" r="1.7"/><circle cx="10.5" cy="18" r="1"/><circle cx="15" cy="12.2" r=".8"/></g>'],
    ayyMayo:[110,55,'#1c4d20','#59e06a','#c6ffcb','<path d="M12 3c5 0 8 3.5 8 7.5 0 5-4 9.5-8 11.5-4-2-8-6.5-8-11.5C4 6.5 7 3 12 3z"/><g fill="currentColor" stroke="none"><ellipse cx="8.6" cy="11" rx="1.9" ry="3" transform="rotate(-22 8.6 11)"/><ellipse cx="15.4" cy="11" rx="1.9" ry="3" transform="rotate(22 15.4 11)"/></g>'],
    cincoMayo:[130,40,'#1e4a2a','#d94b4b','#fff2c8','<path d="M12 21.5V6.5a2 2 0 0 1 4 0V13M12 17H8.5A1.5 1.5 0 0 1 7 15.5V11M5 21.5h14" stroke-linecap="round"/>'],
    prettyMayo:[330,45,'#52203d','#f08cc4','#ffd2ea',EMB_POT_+'<path d="M12 19s-3.4-2.1-3.4-4.4a1.8 1.8 0 0 1 3.4-.9 1.8 1.8 0 0 1 3.4.9c0 2.3-3.4 4.4-3.4 4.4z" fill="currentColor" stroke="none"/>']
  };
  var VANTAIL_='<svg viewBox="0 0 50 100" preserveAspectRatio="none" focusable="false"><rect width="50" height="100" style="fill:hsl(var(--h) var(--s) 24%)"/><g style="fill:hsl(var(--h) var(--s) 31%)"><rect x="1" width="15" height="100"/><rect x="17.5" width="15" height="100"/><rect x="34" width="15" height="100"/></g><g style="fill:var(--b)"><rect y="17" width="50" height="9"/><rect y="73" width="50" height="9"/></g><g style="fill:var(--e)"><circle cx="6" cy="21.5" r="1.6"/><circle cx="20" cy="21.5" r="1.6"/><circle cx="34" cy="21.5" r="1.6"/><circle cx="6" cy="77.5" r="1.6"/><circle cx="20" cy="77.5" r="1.6"/><circle cx="34" cy="77.5" r="1.6"/></g></svg>';
  function porte_(id,ouvre,referme){
    var t=THEMES_[id]||[teinte_(id),34,'#3a3a44','#9a9484','#e8e0c8',EMB_PIECE_];
    return '<div class="ygg-porte'+(ouvre?' ouvre':'')+(referme?' referme':'')+'" style="--h:'+t[0]+';--s:'+t[1]+'%;--b:'+t[2]+';--r:'+t[3]+';--e:'+t[4]+';--vit:'+reglages_().porte+'" aria-hidden="true"><i class="ygg-porte-lueur"></i><div class="ygg-porte-g">'+VANTAIL_+'</div><div class="ygg-porte-d">'+VANTAIL_+'</div><b class="ygg-porte-emb"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" focusable="false">'+t[5]+'</svg></b></div>';
  }
  /* Porte à afficher pour ce fruit : close tant qu'il n'est pas actif ; ouverture (une seule fois) quand on le voit passer à actif. */
  /* Bruit de la porte : « porte » (pierre, lourde) ou « porteBois ». */
  /* UN seul son de porte à la fois (Norman, 2026-10-26 : « peu importe le nombre de portes qui s'ouvrent, un seul son de porte et de coq »). Plusieurs portes qui s'ouvrent (ou se ferment) au même instant ne jouent qu'UN son ; un nouveau son n'est possible qu'une fois le précédent presque fini. */
  var dernierSonPorte_={};
  function sonPorteUnique_(genre,nom,option,duree){
    var t=Date.now();
    if(dernierSonPorte_[genre]&&t-dernierSonPorte_[genre]<duree)return false;
    dernierSonPorte_[genre]=t;
    son_(nom,option);
    return true;
  }
  function nomSonPorte_(){return reglages_().son==='bois'?'porteBois':'porte';}
  /* Bruit de la porte qui se referme : un son à part (le son d'ouverture à l'envers sonnait mal). */
  function nomSonFerme_(){return reglages_().son==='bois'?'porteFermeBois':'porteFerme';}
  /*
   * Portes revues après une renaissance (Norman, 2026-10-16) : « après un rebirth, les portes doivent être fermées ; avec l'auto actif, on doit quand même les voir s'ouvrir à la première visite du
   * menu, même si le fruit est déjà bien avancé, voire prêt ». On retient, par renaissance (records.totalRebirths), les fruits dont on a déjà vu la porte s'ouvrir ; un fruit actif absent de cette liste
   * montre sa porte close puis l'ouvre (avec le son). Liste gardée dans le stockage (donc liée au compte, voir prefs-compte-v1.js) ; une nouvelle renaissance la vide.
   */
  var CLE_PORTES_VUES_='soreal_idle_ygg_portes_vues_v1';
  function renaissances_(){try{return Number(window.__SOREAL_IDLE_META_HOST_V130__.getIdleEtat().systemes.records.totalRebirths)||0;}catch(_e){return 0;}}
  function portesVues_(){
    var r=renaissances_(),o=null;
    try{o=JSON.parse(localStorage.getItem(CLE_PORTES_VUES_)||'null');}catch(_e){}
    if(!o||typeof o!=='object'||Number(o.r)!==r||!Array.isArray(o.v))return {r:r,v:[]};
    return o;
  }
  function porteVue_(id){return portesVues_().v.indexOf(id)>=0;}
  /* Le coq : UNE fois par renaissance, à la toute première animation d'ouverture de porte (Norman, 2026-10-22 : pas une question d'heure, la première ouverture de la porte après une renaissance), juste après le son de la porte. Mémorisé par renaissance (stockage lié au compte, règle n°6). */
  var CLE_COQ_='soreal_idle_ygg_coq_v1';
  function coqPremiereOuverture_(vit){
    var r=renaissances_(),o=null;
    try{o=JSON.parse(localStorage.getItem(CLE_COQ_)||'null');}catch(_e){}
    if(o&&typeof o==='object'&&Number(o.r)===r)return false;
    try{localStorage.setItem(CLE_COQ_,JSON.stringify({r:r}));}catch(_e){}
    var S=window.__SOREAL_IDLE_YGG_SONS_V1__;
    if(!S||typeof S.coq!=='function')return false;
    return Boolean(S.coq((reglages_().son==='bois'?1450:1100)*(Number(vit)>0?Number(vit):1)));
  }
  function noterPorteVue_(id,vue){
    var o=portesVues_(),i=o.v.indexOf(id);
    if(vue&&i<0)o.v.push(id);else if(!vue&&i>=0)o.v.splice(i,1);else if(Number(o.r)===renaissances_()&&(vue===(i>=0)))return;
    try{localStorage.setItem(CLE_PORTES_VUES_,JSON.stringify({r:o.r,v:o.v}));}catch(_e){}
  }
  function porteDe_(id,actif){
    var A=etat.actif||(etat.actif={}),F=etat.referme||(etat.referme={});
    if(!actif){
      /* Le fruit vient d'être mangé ou récolté (il était actif, il ne l'est plus : l'auto ne l'a pas relancé) : la porte se referme, avec l'animation d'ouverture à l'envers et un son de fermeture à part. */
      if(A[id]){delete A[id];F[id]=Date.now();sonPorteUnique_('ferme',nomSonFerme_(),reglages_().porte,1200);}
      etat.fermees[id]=true;delete etat.ouvre[id];noterPorteVue_(id,false);
      if(F[id]&&Date.now()-F[id]<DUREE_OUVERTURE_*reglages_().porte)return porte_(id,false,true);
      delete F[id];
      return porte_(id,false);
    }
    A[id]=true;delete F[id];
    if(!etat.fermees[id]&&!etat.ouvre[id]&&!porteVue_(id))etat.fermees[id]=true;   /* premiere visite depuis la renaissance : la porte s'ouvre meme si le fruit est deja actif */
    var vit=reglages_().porte;
    if(etat.fermees[id]){delete etat.fermees[id];etat.ouvre[id]=Date.now();noterPorteVue_(id,true);if(sonPorteUnique_('ouvre',nomSonPorte_(),vit,1200))coqPremiereOuverture_(vit);}
    var t=etat.ouvre[id];
    if(t&&Date.now()-t<DUREE_OUVERTURE_*vit)return porte_(id,true);
    delete etat.ouvre[id];
    return '';
  }

  /* Réglages de la porte (Norman, 2026-10-26 : l'ancien module d'essai des animations et des sons est supprimé) : valeurs fixes, celles d'origine. */
  var REGLAGES_DEFAUT_={cadence:110,sens:-1,porte:1,son:'pierre'};
  function reglages_(){return {cadence:REGLAGES_DEFAUT_.cadence,sens:REGLAGES_DEFAUT_.sens,porte:REGLAGES_DEFAUT_.porte,son:REGLAGES_DEFAUT_.son};}

  /* Ce que donnerait le fruit prêt (lecture seule du moteur, idle-ygg-apercu-v1) : graines si on RÉCOLTE, graines et bonus si on MANGE (Norman, 2026-10-22). Avec la Poop choisie si elle est cochée et en stock. */
  function decimal_(x,max){return nb_(x).toLocaleString('fr-FR',{maximumFractionDigits:max});}
  function texteEffet_(code,x){
    switch(code){
      case 'gold':return '+'+grand_(x)+' Or';
      case 'powerAlpha':return '+'+grand_(x)+' Fruit de Puissance α';
      case 'powerBeta':return '+'+grand_(x)+' Fruit de Puissance β';
      case 'powerDelta':return '+'+grand_(x)+' Fruit de Puissance δ';
      case 'numbers':return '+'+grand_(x)+' Fruit de Nombres';
      case 'adventure':return '+'+grand_(x)+' Puissance et Défense d’Aventure';
      case 'experience':return '+'+grand_(x)+' EXP';
      case 'luck':return '+'+decimal_(x,2)+' % de chance de drop';
      case 'ap':return '+'+grand_(x)+' AP';
      case 'pp':return '+'+decimal_(x,3)+' PP';
      case 'macguffin':return '+'+grand_(x)+' niveaux de MacGuffin';
      case 'quirks':return '+'+grand_(x)+' QP';
      case 'mayo':return '+'+decimal_(x,3)+' de mayo';
    }
    return '';
  }
  function apercuHtml_(d,v,c){
    var a=v.e&&v.e.apercu;
    if(!v.pret||!a||!a.sans)return '';
    var avecPoop=Boolean(c.poop&&d.poop>0&&a.avec);
    var p=avecPoop?a.avec:a.sans;
    var manger=['+'+grand_(p.eat.seeds)+' graines'].concat((p.eat.effets||[]).map(function(e){return texteEffet_(e[0],e[1]);}).filter(Boolean));
    return '<div class="ygg-apercu" data-ygg-apercu><div><b>Manger</b> : '+html_(manger.join(' · '))+'</div><div><b>Récolter</b> : '+html_('+'+grand_(p.harvest.seeds)+' graines')+'</div>'+(avecPoop?'<div>(avec la Poop)</div>':'')+'</div>';
  }
  function carte_(d,v){
    var def=v.def,id=def.id,c=choix_(id);
    var nom=html_(def.name||id);
    var frac=v.tier>0?Math.max(0,Math.min(1,v.growth/v.tier)):0;
    var heures=v.growth*d.tierSec/3600;
    var temps=v.tier>0?(window.__SOREAL_IDLE_META_HOST_V130__.formatterHeuresIdleV47_?window.__SOREAL_IDLE_META_HOST_V130__.formatterHeuresIdleV47_(heures)+' / '+window.__SOREAL_IDLE_META_HOST_V130__.formatterHeuresIdleV47_(v.tier*d.tierSec/3600):''):'';
    var coutAct=v.e.activationCost!=null?v.e.activationCost:(def.activationCost||0);
    var ress=def.resource==='magic'?'Magic':'Energy';
    var principal;
    if(v.tier<=0)principal='<button type="button" class="ygg-btn vert" disabled>Activer</button>';
    else if(!v.active)principal='<button type="button" class="ygg-btn vert" title="Coût : '+html_(grand_(coutAct))+' '+ress+'" onclick="window.__SOREAL_IDLE_YGG_V1__.activer(\''+html_(id)+'\')">Activer<small>'+html_(grand_(coutAct))+' '+ress+'</small></button>';
    else if(!v.pret)principal='<button type="button" class="ygg-btn vert" disabled>Pousse…</button>';
    else principal='<button type="button" class="ygg-btn" onclick="window.__SOREAL_IDLE_YGG_V1__.utiliser(\''+html_(id)+'\')">'+(c.mode==='harvest'?'Récolter':'Manger')+'</button>';
    var coutUp=v.e.nextTierCost;
    var upLabel=v.tier<=0?'Débloquer':'Améliorer';
    var amelio=v.max?'<button type="button" class="ygg-btn vert" disabled>Tier max</button>'
      :'<button type="button" class="ygg-btn vert" '+(d.seeds>=nb_(coutUp)?'':'disabled ')+'onclick="window.__SOREAL_IDLE_YGG_V1__.ameliorer(\''+html_(id)+'\')">'+upLabel+(coutUp!=null?'<small>'+html_(grand_(coutUp))+' graines</small>':'')+'</button>';
    var auto='';
    if(v.e.autoActivate)auto='<div class="ygg-auto">⚡ Auto-Activate</div>';
    else if(v.e.autoShopId)auto='<div class="ygg-auto"><button type="button" class="ygg-btn" '+(d.exp>=nb_(v.e.autoCost)?'':'disabled ')+'title="Cap '+ress+' total requis : '+html_(grand_(v.e.autoRequiredCap||0))+'" onclick="window.__acheterExpShopIdleV1__(\''+html_(v.e.autoShopId)+'\',1)">Auto-Activate<small>'+html_(grand_(v.e.autoCost||0))+' EXP</small></button></div>';
    return '<div class="ygg-carte'+(v.pret?' pret':'')+(def.resource==='magic'?' magie':'')+(v.active&&!v.pret&&v.tier>0?' pousse':'')+'" data-fruit="'+html_(id)+'">'+
      '<div class="ygg-nom">'+nom+' <span>('+v.tier+'/'+d.maxTier+')</span></div>'+
      '<div class="ygg-vitre ygg-portrait'+(FRUITS_24_[id]===true?' ygg-decor':'')+(FRUITS_24_[id]===true&&v.tier>0&&intensiteAura_(v)>0?' ygg-aura':'')+'"'+(FRUITS_24_[id]===true?' style="--ygg-s:'+(v.tier>0?echelleTerre_(v):'0.14')+';--ygg-f:'+(v.tier>0?echelleFruit_(v):'0')+';--ygg-fo:'+(v.tier>0&&heuresPousse_(v)>=1?'1':'0')+(v.tier>0&&intensiteAura_(v)>0?';--ygg-aura:'+(AURAS_[id]||'#ffd34a')+';--ygg-aura-a:'+intensiteAura_(v).toFixed(3):'')+';background-image:url(/api/idle/media/ygg?name='+encodeURIComponent(id)+'&amp;decor=1)"':'')+'>'+couches_(d,v,id,def)+porteDe_(id,Boolean(v.active))+'</div>'+
      '<div class="ygg-barre'+(v.tier>0?'':' vide')+'" title="Croissance"><i style="width:'+(frac*100).toFixed(1)+'%"></i></div>'+
      '<div class="ygg-temps">'+(temps||'&nbsp;')+'</div>'+
      '<div class="ygg-actions">'+principal+amelio+'</div>'+
      '<button type="button" class="ygg-poop" aria-pressed="'+(c.poop&&d.poop>0)+'" '+(d.poop>0?'':'disabled ')+'onclick="window.__SOREAL_IDLE_YGG_V1__.poop(\''+html_(id)+'\')"><span class="ygg-mini">'+image_('poop','💩')+'</span>Poop</button>'+
      '<div class="ygg-mode" role="group" aria-label="Manger ou récolter"><button type="button" aria-pressed="'+(c.mode!=='harvest')+'" onclick="window.__SOREAL_IDLE_YGG_V1__.mode(\''+html_(id)+'\',\'eat\')">Manger</button><button type="button" aria-pressed="'+(c.mode==='harvest')+'" onclick="window.__SOREAL_IDLE_YGG_V1__.mode(\''+html_(id)+'\',\'harvest\')">Récolter</button></div>'+
      apercuHtml_(d,v,c)+
      auto+
    '</div>';
  }

  function bonus_(d){
    var perm=d.data.permanent||{};
    var lignes=[];
    var ids={};d.fruits.forEach(function(v){ids[v.def.id]=true;});
    if(ids.luck)lignes.push(['Bonus de chance de drop',nb_(perm.luckDropPct),' %']);
    if(ids.powerAlpha)lignes.push(['Bonus Fruit de Puissance α',nb_(d.data.runPowerAlphaValue),'']);
    if(ids.powerBeta)lignes.push(['Bonus Fruit de Puissance β',nb_(perm.powerBetaValue),'']);
    if(ids.powerDelta)lignes.push(['Bonus Fruit de Puissance δ',nb_(perm.powerDeltaValue),'']);
    if(ids.numbers)lignes.push(['Bonus Fruit de Nombres',nb_(perm.numbersValue),'']);
    return lignes.filter(function(l){return l[1]>0;}).map(function(l){return html_(l[0])+' : <b>'+html_(grand_(l[1]))+l[2]+'</b>';}).join('<br>');
  }

  function page(j){
    style_();
    var d=lire_(j);
    if(!d)return '';
    chargerModes_(j&&j.nom);
    var pretsIds=d.fruits.filter(function(v){return v.pret;}).map(function(v){return v.def.id;});
    if(etat.pretsVus!==null&&pretsIds.some(function(id){return etat.pretsVus.indexOf(id)===-1;}))son_('pret');
    etat.pretsVus=pretsIds;
    var pages=Math.max(1,Math.ceil(d.fruits.length/PAR_PAGE));
    if(etat.page>pages)etat.page=pages;
    var debut=(etat.page-1)*PAR_PAGE;
    var cartes=d.fruits.slice(debut,debut+PAR_PAGE).map(function(v){return carte_(d,v);}).join('');
    var onglets='';
    if(pages>1){
      onglets='<div class="ygg-onglets" role="tablist">';
      for(var p=1;p<=pages;p++)onglets+='<button type="button" role="tab" class="ygg-onglet" aria-selected="'+(p===etat.page)+'" onclick="window.__SOREAL_IDLE_YGG_V1__.aller('+p+')">Page '+p+'</button>';
      onglets+='</div>';
    }
    var pretsMax=d.fruits.some(function(v){return v.pret&&v.max;});
    var prets=d.fruits.some(function(v){return v.pret&&v.tier>=1;});
    var brown=d.x.brownHeart?' · Brown Heart : '+(d.x.nextFreePoopIn===1?'la prochaine est gratuite':'gratuite dans '+ent_(d.x.nextFreePoopIn)):'';
    var b=bonus_(d);
    var poopFacteur=String(Math.round((nb_(d.x.poopFactor)||1.5)*100)/100).replace('.',',');
    return '<div class="ygg-page"><div class="ygg-cadre">'+
      '<div class="ygg-entete"><button type="button" class="ygg-aide-bouton" onclick="window.__SOREAL_IDLE_YGG_V1__.aide()">Que faire ici ?</button>'+
        '<div class="ygg-titre"><i class="ygg-feu g">'+FEUILLAGE_+'</i><i class="ygg-feu d">'+FEUILLAGE_+'</i><i class="ygg-vigne">'+VIGNE_+'</i><b>Yggdrasil, l’Arbre-Monde</b><small>(et pourtant tu le fertilises avec du caca)</small></div></div>'+
      '<div class="ygg-aide'+(etat.aide?' ouvert':'')+'">Chaque tier donne une heure de croissance de plus. <b>Active</b> un fruit, laisse-le pousser, puis <b>mange-le</b> pour son effet ou <b>récolte-le</b> pour doubler les graines. Les graines servent à <b>améliorer</b> les fruits. Une poop (+50 % avant arrondi) s’utilise sur le prochain fruit mangé ou récolté.</div>'+
      /* Compteurs de graines et de Poop EN HAUT de la page (Norman, 2026-10-25) */
      '<div class="ygg-monnaies-haut"><div class="ygg-monnaies">'+
        '<div class="ygg-monnaie"><span class="ygg-vignette">'+image_('seed','🌱')+'</span>'+html_(grand_(d.seeds))+'</div>'+
        '<div class="ygg-monnaie"><span class="ygg-vignette">'+image_('poop','💩')+'</span>'+html_(grand_(d.poop))+'</div>'+
      '</div></div>'+
      onglets+
      '<div class="ygg-grille">'+cartes+'</div>'+
      '<div class="ygg-bas">'+
        '<div class="ygg-actions-bas">'+
          '<button type="button" class="ygg-btn" '+(pretsMax?'':'disabled ')+'onclick="window.__SOREAL_IDLE_YGG_V1__.tout(\'max\')">Manger / récolter tous les fruits au tier max</button>'+
          '<button type="button" class="ygg-btn" '+(prets?'':'disabled ')+'onclick="window.__SOREAL_IDLE_YGG_V1__.tout(\'tous\')">Manger / récolter tous les fruits ≥ tier 1</button>'+
          '<label class="ygg-solo"><input type="checkbox" '+(etat.soloMax?'checked ':'')+'onchange="window.__SOREAL_IDLE_YGG_V1__.soloMax(this.checked)"> Poop seulement sur les fruits au tier max</label>'+
        '</div>'+
        (b?'<div class="ygg-bonus">'+b+'</div>':'')+
      '</div>'+
      '<div class="ygg-note">Poop ×'+html_(poopFacteur)+' · tier max '+d.maxTier+html_(brown)+' · poop achetable à la boutique AP, rayon Boosts.</div>'+
    '</div></div>';
  }

  /* ---------- Actions ---------- */
  function trouver_(id){
    var d=lire_(H_().getIdleEtat());
    if(!d)return null;
    for(var i=0;i<d.fruits.length;i++)if(d.fruits[i].def.id===id)return {d:d,v:d.fruits[i]};
    return null;
  }
  function lancerUsage_(id,avecPoop){
    var c=choix_(id);
    var payload={action:'useYggFruit',fruit:String(id),mode:c.mode==='harvest'?'harvest':'eat'};
    if(avecPoop)payload.poop=true;
    action_(payload);
  }
  var API={
    page:page,
    imageChargee:function(nom,img){etat.chargees[nom]=true;var f=img&&img.previousElementSibling;if(f&&f.classList&&f.classList.contains('ygg-secours'))f.style.display='none';},
    imageManquante:function(nom,img){etat.manquantes[nom]=true;if(img)img.style.display='none';},
    activer:function(id){son_('activer');action_({action:'activateYggFruit',fruit:String(id)});},
    ameliorer:function(id){son_('ameliorer');action_({action:'upgradeYggFruit',fruit:String(id)});},
    utiliser:function(id){
      var c=choix_(id);var t=trouver_(id);
      son_(c.mode==='harvest'?'recolter':'manger');
      lancerUsage_(id,Boolean(c.poop&&t&&t.d.poop>0));
      c.poop=false;
    },
    mode:function(id,mode){var m=mode==='harvest'?'harvest':'eat';if(choix_(id).mode!==m)son_('interrupteur',m==='harvest');choix_(id).mode=m;sauverModes_();rafraichir_();},
    poop:function(id){var c=choix_(id);c.poop=!c.poop;if(c.poop)son_('poop');else son_('interrupteur',false);rafraichir_();},
    aller:function(p){if(ent_(p)!==etat.page)son_('onglet');etat.page=Math.max(1,ent_(p));rafraichir_();},
    fermerAide:function(){etat.aide=false;},
    aide:function(){son_('aide');etat.aide=!etat.aide;var e=document.querySelector('.ygg-aide');if(e)e.classList.toggle('ouvert',etat.aide);},
    soloMax:function(v){etat.soloMax=Boolean(v);try{localStorage.setItem(CLE_SOLO_,v?'1':'0');}catch(_e){}son_('interrupteur',Boolean(v));},
    /* « Manger / récolter tous… » : chaque fruit prêt reçoit son mode choisi, la poop (si cochée et en stock) selon la case « seulement au tier max ». */
    tout:function(critere){
      var d=lire_(H_().getIdleEtat());
      if(!d)return 0;
      var poopRestante=d.poop;
      var cibles=d.fruits.filter(function(v){return v.pret&&(critere==='max'?v.max:v.tier>=1);});
      if(cibles.length)son_('tout');
      cibles.forEach(function(v,i){
        var c=choix_(v.def.id);
        var avec=Boolean(c.poop&&poopRestante>0&&(!etat.soloMax||v.max));
        if(avec){poopRestante-=1;c.poop=false;}
        setTimeout(function(){lancerUsage_(v.def.id,avec);},i*350);
      });
      return cibles.length;
    },
    etat:etat,
    PAR_PAGE:PAR_PAGE
  };
  window.__SOREAL_IDLE_YGG_ETAPE_V1__=etapeCroissance_;
  window.__SOREAL_IDLE_YGG_V1__=API;
})();
