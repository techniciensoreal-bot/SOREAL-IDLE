/*
 * SOREAL IDLE — « l'accident » du Coffre (Norman, 2026-10-15). Très rarement, quand le Coffre pète, ça tourne mal : une flaque brune avec de petits morceaux s'étale à ses pieds, il dit sa réplique, puis « J'crois que
 * j'me suis chié dessus. », et TOUTES les cases du sac se retrouvent éclaboussées (taches brunes un peu partout, gouttes qui coulent ; jamais un caca dessiné). On voit toujours les objets et on peut toujours s'en servir ;
 * quand on glisse un objet d'une case sale, les éclaboussures glissent avec lui (fantôme de glissement).
 *
 * Le sac ne se frotte PAS : on nettoie en frottant la flaque du Coffre, et les éclaboussures du sac disparaissent au fur et à mesure (fondu), jusqu'à zéro.
 * Tout reste sale TANT QU'ON NE NETTOIE PAS : ouvrir ou fermer le Coffre, changer de menu, recharger la page n'y change rien (l'état est tenu ici et mémorisé sur l'appareil, pas dans la page). Pour nettoyer une case ou la flaque :
 * la frotter avec le doigt (ou la souris, bouton appuyé ; la souris devient une éponge au survol) CINQ allers-retours. Une fois la flaque nettoyée, le Coffre brille quelques minutes.
 *
 * Redessin (règle n°4 d'AGENTS.md) : l'attribut data-caca est gardé par le morph et remis en place dans la même tâche ; la flaque et la brillance portent data-morph-garder.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_CACA_V1__)return;

  var NIVEAU_MAX=5;               /* cinq passages du doigt : un passage (un trajet dans un sens) retire un niveau */
  var SEUIL_COURSE=16;            /* px à parcourir dans un sens pour qu'un passage compte */
  var DUREE_BRILLE_MS=4*60*1000;
  var CLE='soreal_idle_caca_v1';
  var actif=false;
  var flaqueNiveau=0;             /* niveau de saleté de la flaque du Coffre (0 = propre) */
  var brilleJusqua=0;
  var suivi=null;
  var ignorerClicJusqua=0;

  /* ---------- mémoire sur l'appareil ---------- */
  function sauver_(){
    try{localStorage.setItem(CLE,JSON.stringify({actif:actif,flaque:flaqueNiveau,brille:brilleJusqua}));}catch(_e){}
  }
  (function charger_(){
    try{
      var o=JSON.parse(localStorage.getItem(CLE)||'null');
      if(!o||typeof o!=='object')return;
      actif=Boolean(o.actif);
      flaqueNiveau=Math.max(0,Math.min(NIVEAU_MAX,o.flaque|0));
      brilleJusqua=Number(o.brille)||0;
    }catch(_e){}
  })();

  /* ---------- dessin : éclaboussures en dégradés (aucune image, aucun filtre : très léger) ---------- */
  function tache_(x,y,rx,ry,c){return 'radial-gradient(ellipse '+rx+'% '+ry+'% at '+x+'% '+y+'%,'+c+' 0 66%,transparent 70%)';}
  function goutte_(x,larg,haut,c,depuis){return 'linear-gradient('+c+','+c+') '+x+'% '+(depuis||'0')+'/'+larg+'px '+haut+'% no-repeat';}
  function point_(x,y,r,c){return 'radial-gradient(circle at '+x+'% '+y+'%,'+c+' 0 '+r+'px,transparent '+(r+1)+'px)';}
  var BRUN='#5a3512',SOMBRE='#3b2208',CLAIR='#7a5522',VERDATRE='#4f4a17';
  var GRANDES=[
    tache_(22,78,34,24,SOMBRE),tache_(82,24,24,30,BRUN),tache_(68,88,24,16,VERDATRE),tache_(10,20,18,22,CLAIR),
    goutte_(78,6,38,SOMBRE,'-1px'),goutte_(20,5,30,BRUN,'100%'),tache_(48,50,14,10,BRUN),goutte_(52,4,26,VERDATRE,'-1px')
  ];
  var POINTS=[
    point_(34,12,2,BRUN),point_(60,70,3,SOMBRE),point_(90,60,2,CLAIR),point_(8,52,3,BRUN),point_(44,92,2,SOMBRE),point_(72,8,2,BRUN),
    point_(26,40,2,VERDATRE),point_(88,88,3,BRUN),point_(52,30,2,SOMBRE),point_(14,84,2,CLAIR),point_(66,48,2,BRUN),point_(38,66,2,SOMBRE)
  ];
  function listeNiveau_(liste,n){return liste.slice(0,Math.max(1,Math.ceil(liste.length*n/NIVEAU_MAX))).join(',');}

  /* curseur éponge (SVG original) quand on survole ce qui se frotte */
  var EPONGE='<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 34 34"><rect x="3" y="9" width="28" height="18" rx="6" fill="#f2cf4a" stroke="#6b4e0a" stroke-width="2"/><rect x="3" y="21" width="28" height="6" rx="3" fill="#d6a92a" opacity=".7"/><circle cx="11" cy="15" r="2.2" fill="#b98a14"/><circle cx="19" cy="13" r="1.8" fill="#b98a14"/><circle cx="24" cy="19" r="2.2" fill="#b98a14"/><circle cx="14" cy="21" r="1.6" fill="#b98a14"/></svg>';
  var CURSEUR='url("data:image/svg+xml;utf8,'+encodeURIComponent(EPONGE)+'") 17 17,grab';

  function style_(){
    if(document.getElementById('soreal-idle-caca-style-v1'))return;
    var s=document.createElement('style');s.id='soreal-idle-caca-style-v1';
    var css=[
      '.soreal-idle-v138-bag-card[data-caca]{position:relative}',
      '.soreal-idle-v138-bag-card[data-caca]::before,.soreal-idle-v138-bag-card[data-caca]::after{content:"";position:absolute;pointer-events:none;border-radius:inherit;transition:opacity .9s ease}',
      '.soreal-idle-v138-bag-card[data-caca]::before{inset:-3px;z-index:1;background:'+GRANDES.join(',')+'}',
      '.soreal-idle-v138-bag-card[data-caca]::after{inset:0;z-index:2;background:'+POINTS.join(',')+'}',
      /* le niveau de l'objet, les trois points de couleur (boosts) et les pastilles restent AU-DESSUS des taches */
      '.soreal-idle-v138-bag-card[data-caca] .idle-lvl-badge-v1,.soreal-idle-v138-bag-card[data-caca] .idle-maxok-badge-v1,.soreal-idle-v138-bag-card[data-caca] .idle-boostpts-v1,.soreal-idle-v138-bag-card[data-caca]>span:not(.idle-emoji-fallback-v1){z-index:6}',
      /* variété d'une case à l'autre : les éclaboussures sont retournées */
      '.soreal-idle-v138-bag-card[data-caca]:nth-child(2n)::before{transform:scaleX(-1)}',
      '.soreal-idle-v138-bag-card[data-caca]:nth-child(3n)::before{transform:scaleY(-1)}',
      '.soreal-idle-v138-bag-card[data-caca]:nth-child(5n)::before{transform:rotate(180deg)}',
      '.soreal-idle-v138-bag-card[data-caca]:nth-child(2n+1)::after{transform:scaleX(-1)}',
      '.soreal-idle-v138-bag-card[data-caca]:nth-child(7n)::after{transform:scaleY(-1)}'
    ];
    /* l'opacité suit le niveau de la flaque du Coffre : 5 = tout sale, 0 = fondu complet */
    for(var n=0;n<=NIVEAU_MAX;n+=1)css.push('.soreal-idle-v138-bag-card[data-caca="'+n+'"]::before,.soreal-idle-v138-bag-card[data-caca="'+n+'"]::after{opacity:'+(n/NIVEAU_MAX).toFixed(2)+'}');
    css=css.concat([
      /* fantôme de glissement : les éclaboussures suivent l'objet */
      '.soreal-idle-caca-fantome-v1{position:absolute;inset:-3px;pointer-events:none;background:'+GRANDES.slice(0,5).join(',')+','+POINTS.slice(0,6).join(',')+'}',
      /* flaque brune aux pieds du Coffre, avec ses morceaux */
      '@keyframes bgFlaque{0%{opacity:0;transform:scale(.1,.05)}25%{opacity:1}100%{opacity:1;transform:scale(1,1)}}',
      '@keyframes bgMorceau{0%{opacity:0;transform:scale(.2)}60%{opacity:0}100%{opacity:1;transform:scale(1)}}',
      '.bg-flaque-v1{position:absolute;left:-8%;bottom:-6px;width:116%;height:38px;z-index:6;transform-origin:50% 60%;animation:bgFlaque 2.6s cubic-bezier(.2,.7,.3,1) both;pointer-events:auto;cursor:'+CURSEUR+';touch-action:none;transition:scale .3s ease,filter .3s ease}',
      '.bg-flaque-v1.deja{animation:none}',
      /* zone tactile invisible bien plus grande que la flaque : le doigt qui frotte reste dedans (touch-action:none) et ne fait ni défiler ni changer de page. La flaque rétrécit : la marge est divisée par l'échelle (--s). */
      '.bg-flaque-v1{--s:1}.bg-flaque-v1[data-niveau="4"]{--s:.9}.bg-flaque-v1[data-niveau="3"]{--s:.78}.bg-flaque-v1[data-niveau="2"]{--s:.64}.bg-flaque-v1[data-niveau="1"]{--s:.5}',
      '.bg-flaque-v1::after{content:"";position:absolute;top:calc(-70px / var(--s));bottom:calc(-50px / var(--s));left:calc(-60px / var(--s));right:calc(-60px / var(--s));touch-action:none;background:transparent}',
      /* la flaque rétrécit et pâlit à chaque aller-retour (propriétés scale et filter : l'animation d'étalement garde transform) */
      '.bg-flaque-v1[data-niveau="4"]{scale:.9;filter:opacity(.92)}',
      '.bg-flaque-v1[data-niveau="3"]{scale:.78;filter:opacity(.84)}',
      '.bg-flaque-v1[data-niveau="2"]{scale:.64;filter:opacity(.72)}',
      '.bg-flaque-v1[data-niveau="1"]{scale:.5;filter:opacity(.58)}',
      '.bg-flaque-v1 b{position:absolute;inset:0;border-radius:58% 42% 55% 45% / 62% 58% 42% 38%;background:radial-gradient(ellipse at 35% 35%,#7a4a22 0 18%,transparent 19%),radial-gradient(ellipse at 50% 55%,#5b3613,#3a2108 72%);box-shadow:0 2px 0 rgba(0,0,0,.5),inset 0 -3px 0 rgba(0,0,0,.28)}',
      '.bg-flaque-v1 b::before,.bg-flaque-v1 b::after{content:"";position:absolute;background:inherit;border-radius:50%}',
      '.bg-flaque-v1 b::before{left:-9px;top:8px;width:20px;height:11px;transform:rotate(-12deg)}',
      '.bg-flaque-v1 b::after{right:-11px;top:4px;width:24px;height:12px;transform:rotate(8deg)}',
      '.bg-flaque-v1 i{position:absolute;border-radius:48% 52% 45% 55%;background:radial-gradient(circle at 35% 30%,#a9733d,#5a3512 65%);box-shadow:0 1px 0 rgba(0,0,0,.55);opacity:0;animation:bgMorceau 2.8s ease-out both}',
      '.bg-flaque-v1.deja i{animation:none;opacity:1}',
      /* répliques longues du Coffre (accident) : retour à la ligne */
      '.bg-bagage-v1 .bg-desole-long-v1{white-space:normal;width:max-content;max-width:290px;top:-48px;text-align:center;line-height:1.15;font-size:16px}',
      /* le Coffre brille quelques minutes une fois la flaque nettoyée */
      '@keyframes bgBrille{0%,100%{opacity:.5}50%{opacity:1}}',
      '@keyframes bgEtoile{0%,100%{opacity:0;transform:scale(.2) rotate(0deg)}50%{opacity:1;transform:scale(1) rotate(45deg)}}',
      '.bg-brille-v1{position:absolute;inset:-8px;pointer-events:none;z-index:5;background:radial-gradient(ellipse at 50% 55%,rgba(255,236,140,.6),rgba(255,220,90,.22) 55%,transparent 72%);animation:bgBrille 2.6s ease-in-out infinite}',
      '.bg-brille-v1 i{position:absolute;font-style:normal;font-size:24px;line-height:1;color:#fff6b0;text-shadow:0 0 6px #ffd84a,0 0 14px #ffbf1f,0 0 22px #ffbf1f;opacity:0;animation:bgEtoile 2.2s ease-in-out infinite}',
      '@media (prefers-reduced-motion:reduce){.bg-flaque-v1,.bg-flaque-v1 i{animation:none;opacity:1}.bg-brille-v1,.bg-brille-v1 i{animation:none;opacity:.8}}'
    ]);
    /*
     * Les pattes du Coffre restent visibles au milieu de la flaque (Norman, 2026-10-17 : « ses pattes sont recouvertes par le caca ; il en faut derrière les pattes et devant les pattes »). La flaque est en DEUX
     * calques : le FOND (.bg-flaque-fond-v1, mêmes règles visuelles, sous le dessin du Coffre) et le DEVANT (.bg-flaque-v1, au-dessus, seulement sa moitié basse : un bord qui recouvre le bas des pattes). Le devant
     * garde le frottement ; le fond ne reçoit aucun geste. Sous le Coffre, le dessin passe devant le fond (:has : sans lui, l'ancien rendu).
     */
    css=css.concat(css.filter(function(r){return r.indexOf('.bg-flaque-v1')===0&&r.indexOf('::after{content')<0;}).map(function(r){return r.replace(/\.bg-flaque-v1/g,'.bg-flaque-fond-v1');}));
    css.push('.bg-flaque-fond-v1{z-index:1;pointer-events:none;cursor:auto;touch-action:auto}');
    css.push('.bg-bagage-v1:has(.bg-flaque-fond-v1)>svg{position:relative;z-index:2}');
    css.push('.bg-flaque-v1 b{clip-path:inset(52% -20px 0 -20px)}');
    /* Le doigt qui frotte : montré au joueur la PREMIÈRE fois que le Coffre se chie dessus, pour lui apprendre qu'il faut frotter (Norman, 2026-10-17). Va et vient sur la flaque jusqu'au premier toucher. */
    css.push('.bg-doigt-v1{position:absolute;left:50%;bottom:-6px;width:40px;height:46px;margin-left:-20px;z-index:9;pointer-events:none;filter:drop-shadow(0 2px 2px rgba(0,0,0,.55));animation:bgDoigt 1s ease-in-out infinite alternate}');
    css.push('.bg-doigt-v1 svg{display:block;width:100%;height:100%;overflow:visible}');
    css.push('@keyframes bgDoigt{from{transform:translateX(-56px) rotate(-8deg)}to{transform:translateX(56px) rotate(8deg)}}');
    css.push('@media (prefers-reduced-motion:reduce){.bg-doigt-v1{animation:none}}');
    /* les pattes (brun) se perdaient dans la flaque (brune) : tant qu'elle est là, elles s'éclaircissent et prennent un contour sombre pour se lire au milieu */
    css.push('.bg-bagage-v1:has(.bg-flaque-fond-v1) .bg-patte rect{fill:#a06f36;stroke:#24130a;stroke-width:2.4}');
    css.push('.bg-bagage-v1:has(.bg-flaque-fond-v1) .bg-patte ellipse{fill:#7d4d20;stroke:#24130a;stroke-width:2.4}');
    css.push('.bg-flaque-fond-v1 b{background:radial-gradient(ellipse at 35% 35%,#6a3f1a 0 18%,transparent 19%),radial-gradient(ellipse at 50% 55%,#4a2a0e,#2a1606 75%)}');
    css.push('@media (prefers-reduced-motion:reduce){.bg-flaque-fond-v1,.bg-flaque-fond-v1 i{animation:none;opacity:1}}');
    s.textContent=css.join('\n');
    document.head.appendChild(s);
  }

  /* ---------- cases du sac ---------- */
  function cartes_(){return document.querySelectorAll('.soreal-idle-v138-bag-card');}
  /* Éclaboussures du sac : leur niveau (donc leur opacité) est celui de la flaque du Coffre ; à zéro elles fondent puis disparaissent. Appelé après chaque redessin (même tâche) et toutes les 1,5 s. */
  var fondEnCours=false;
  function appliquer_(){
    if(!actif)return;
    var n=Math.max(0,flaqueNiveau),cartes=cartes_();
    Array.prototype.forEach.call(cartes,function(c){
      if(n>0){if(c.getAttribute('data-caca')!==String(n))c.setAttribute('data-caca',String(n));}
      else if(c.hasAttribute('data-caca')&&c.getAttribute('data-caca')!=='0')c.setAttribute('data-caca','0');
    });
    if(n===0&&!fondEnCours){
      fondEnCours=true;
      setTimeout(function(){
        fondEnCours=false;
        actif=false;sauver_();
        Array.prototype.forEach.call(cartes_(),function(c){c.removeAttribute('data-caca');});
      },cartes.length?1000:0);
    }
  }

  function souiller_(){
    style_();
    actif=true;brilleJusqua=0;
    sauver_();
    appliquer_();
    majBrille_();
  }

  /* ---------- frottement : 5 allers-retours ---------- */
  /* Zone de frottement large (Norman, 2026-10-17 : sur téléphone le doigt sortait de la petite flaque et la page changeait) : 70 px autour de la flaque, la même marge que la zone tactile ci-dessous. */
  function dedans_(r,x,y){return x>=r.left-70&&x<=r.right+70&&y>=r.top-70&&y<=r.bottom+70;}
  function nouveau_(x,y){return {x:x,y:y,sx:0,sy:0,bx:0,by:0,compte:false,courses:0,total:0};}
  /* Une « course » = un trajet d'au moins 16 px dans un sens ; changer de sens (après 8 px de retour) en démarre une autre. Renvoie 1 quand une course vient de compter. */
  function course_(fr,x,y){
    var dx=x-fr.x,dy=y-fr.y,d=Math.hypot(dx,dy);
    if(d<2)return 0;
    fr.x=x;fr.y=y;fr.total+=d;
    var sl=Math.hypot(fr.sx,fr.sy);
    if(sl<1){fr.sx+=dx;fr.sy+=dy;}
    else{
      var p=(dx*fr.sx+dy*fr.sy)/sl;
      if(p>=0){fr.sx+=dx;fr.sy+=dy;fr.bx=0;fr.by=0;}
      else{
        fr.bx+=dx;fr.by+=dy;
        if(Math.hypot(fr.bx,fr.by)>=8){fr.sx=fr.bx;fr.sy=fr.by;fr.bx=0;fr.by=0;fr.compte=false;}
      }
    }
    if(!fr.compte&&Math.hypot(fr.sx,fr.sy)>=SEUIL_COURSE){fr.compte=true;fr.courses+=1;return 1;}
    return 0;
  }
  function clic_(){try{var a=window.__SOREAL_IDLE_AUDIO_V199__;if(a&&typeof a.uiClick==='function')a.uiClick();}catch(_e){}}

  document.addEventListener('pointerdown',function(e){
    if(e.button>0){suivi=null;return;}
    var fl=e.target&&e.target.closest?e.target.closest('.bg-flaque-v1'):null;
    if(fl){retirerDoigt_();suivi=Object.assign(nouveau_(e.clientX,e.clientY),{flaque:true,id:e.pointerId});return;}
    suivi=null;
  },true);
  /* Après une frottée sur la flaque, le clic qui suit ne doit pas ouvrir/fermer le Coffre. */
  document.addEventListener('click',function(e){
    if(Date.now()<ignorerClicJusqua&&e.target&&e.target.closest&&e.target.closest('.bg-flaque-v1')){e.stopPropagation();e.preventDefault();}
  },true);
  document.addEventListener('pointermove',function(e){
    if(!suivi||e.pointerId!==suivi.id)return;
    if(suivi.flaque){
      var fl=document.querySelector('.bg-flaque-v1');
      if(!fl||!dedans_(fl.getBoundingClientRect(),e.clientX,e.clientY)){suivi=null;return;}
      var n=course_(suivi,e.clientX,e.clientY);
      if(suivi.total>8)ignorerClicJusqua=Date.now()+600;
      if(n&&flaqueNiveau>0){flaqueNiveau-=1;sauver_();majFlaque_();clic_();}
      return;
    }
  },true);
  ['pointerup','pointercancel'].forEach(function(t){document.addEventListener(t,function(){suivi=null;},true);});

  /* Le morph garde l'attribut ; la remise en place est faite juste après chaque redessin. */
  (window.__SOREAL_IDLE_MORPH_ATTRIBUTS_GARDES_V1__=window.__SOREAL_IDLE_MORPH_ATTRIBUTS_GARDES_V1__||[]).push('data-caca');
  (window.__SOREAL_IDLE_APRES_REDESSIN_V1__=window.__SOREAL_IDLE_APRES_REDESSIN_V1__||[]).push(function(){appliquer_();majFlaque_();majBrille_();});

  /* ---------- flaque aux pieds du Coffre ---------- */
  function coffre_(){return document.querySelector('.soreal-idle-coffre-v1 .bg-bagage-v1,.bg-bagage-v1');}
  /* Doigt d'apprentissage : mémorisé dans le stockage (donc lié au compte, voir prefs-compte-v1.js) dès que le joueur touche la flaque. */
  var CLE_DOIGT_VU_='soreal_idle_caca_doigt_vu_v1';
  function doigtDejaVu_(){try{return localStorage.getItem(CLE_DOIGT_VU_)==='1';}catch(_e){return false;}}
  var SVG_DOIGT_='<svg viewBox="0 0 34 40" aria-hidden="true"><path d="M15 2.5c2.600 0 4.200 1.700 4.200 4.200v13.500l2.200-.6c2.200-.6 3.900.6 4.100 2.700l1.500-.4c2.200-.5 3.700.8 3.700 3v4.600c0 5.200-3.600 9.200-9.200 9.200h-3.200c-4.600 0-7.200-2.100-9.300-5.700l-4.600-8c-1-1.800.1-3.600 2-3.600 1.100 0 2 .6 2.700 1.600l1.700 2.200V6.700c0-2.500 1.700-4.200 4-4.200z" fill="#f3c9a0" stroke="#000" stroke-width="2" stroke-linejoin="round"/><path d="M15 8v10M21.500 22.500v4M26.500 24.500v3.500" stroke="#c98f62" stroke-width="1.600" stroke-linecap="round" fill="none"/></svg>';
  function montrerDoigt_(el){
    if(doigtDejaVu_()||!el||el.querySelector('.bg-doigt-v1'))return;
    style_();
    var d=document.createElement('span');
    d.className='bg-doigt-v1';d.setAttribute('aria-hidden','true');d.setAttribute('data-morph-garder','');d.innerHTML=SVG_DOIGT_;
    el.appendChild(d);
  }
  function retirerDoigt_(){
    try{localStorage.setItem(CLE_DOIGT_VU_,'1');}catch(_e){}
    var d=document.querySelector('.bg-doigt-v1');
    if(d&&d.parentNode)d.parentNode.removeChild(d);
  }
  function construireFlaque_(el,spontanee){
    style_();
    var f=document.createElement('span');
    f.className='bg-flaque-v1'+(spontanee?'':' deja');f.setAttribute('aria-hidden','true');f.setAttribute('data-morph-garder','');f.setAttribute('data-niveau',String(flaqueNiveau));
    var fondHtml='<b></b>',devantHtml='<b></b>';
    for(var k=0;k<7;k+=1){
      var w=5+Math.round(Math.random()*6),h=4+Math.round(Math.random()*4),top=Math.round(18+Math.random()*44);
      var piece='<i style="left:'+Math.round(10+Math.random()*74)+'%;top:'+top+'%;width:'+w+'px;height:'+h+'px;animation-delay:'+(1.2+k*.25).toFixed(2)+'s"></i>';
      fondHtml+=piece;
      if(top>=48)devantHtml+=piece;   /* devant : seulement les morceaux de la moitié basse */
    }
    f.innerHTML=devantHtml;
    var fond=document.createElement('span');
    fond.className='bg-flaque-fond-v1'+(spontanee?'':' deja');fond.setAttribute('aria-hidden','true');fond.setAttribute('data-morph-garder','');fond.setAttribute('data-niveau',String(flaqueNiveau));
    fond.innerHTML=fondHtml;
    el.appendChild(fond);
    el.appendChild(f);
    montrerDoigt_(el);
    return f;
  }
  /* Nouvelle flaque (l'accident) : elle s'étale. */
  function flaque_(el){
    var deja=el.querySelector&&el.querySelector('.bg-flaque-v1');
    if(deja&&deja.parentNode)deja.parentNode.removeChild(deja);
    var dejaFond=el.querySelector&&el.querySelector('.bg-flaque-fond-v1');
    if(dejaFond&&dejaFond.parentNode)dejaFond.parentNode.removeChild(dejaFond);
    flaqueNiveau=NIVEAU_MAX;sauver_();
    return construireFlaque_(el,true);
  }
  /* La flaque ne s'efface JAMAIS seule : remise en place si le Coffre est redessiné, rouvert ou la page rechargée. */
  function majFlaque_(){
    var fl=document.querySelector('.bg-flaque-v1'),fd=document.querySelector('.bg-flaque-fond-v1');
    if(flaqueNiveau<=0){
      if(fd&&fd.parentNode)fd.parentNode.removeChild(fd);
      if(fl&&fl.parentNode)fl.parentNode.removeChild(fl);
      var doigtRestant=document.querySelector('.bg-doigt-v1');if(doigtRestant&&doigtRestant.parentNode)doigtRestant.parentNode.removeChild(doigtRestant);
      if(fl){
        brilleJusqua=Date.now()+DUREE_BRILLE_MS;sauver_();majBrille_();   /* nettoyée : le Coffre brille */
        window.__coffreNettoyageNumeroIdleV1__=Math.floor(Date.now()/1000);   /* annoncé dans « En direct » avec le prochain battement (Norman, 2026-10-22) */
      }
      appliquer_();
      return;
    }
    if(!fl){var el=coffre_();if(!el)return;if(fd&&fd.parentNode)fd.parentNode.removeChild(fd);fl=construireFlaque_(el,false);fd=document.querySelector('.bg-flaque-fond-v1');}
    if(!document.querySelector('.bg-doigt-v1')){var cof=coffre_();if(cof)montrerDoigt_(cof);}
    if(fl.getAttribute('data-niveau')!==String(flaqueNiveau))fl.setAttribute('data-niveau',String(flaqueNiveau));
    if(fd&&fd.getAttribute('data-niveau')!==String(flaqueNiveau))fd.setAttribute('data-niveau',String(flaqueNiveau));
    appliquer_();
  }

  /* ---------- le Coffre brille ---------- */
  function majBrille_(){
    var b=document.querySelector('.bg-brille-v1');
    if(Date.now()>=brilleJusqua||flaqueNiveau>0){if(b&&b.parentNode)b.parentNode.removeChild(b);return;}
    if(b)return;
    var el=coffre_();if(!el)return;
    style_();
    b=document.createElement('span');
    b.className='bg-brille-v1';b.setAttribute('aria-hidden','true');b.setAttribute('data-morph-garder','');
    var h='';
    for(var k=0;k<9;k+=1)h+='<i style="left:'+Math.round(6+Math.random()*80)+'%;top:'+Math.round(4+Math.random()*78)+'%;animation-delay:'+(k*.31).toFixed(2)+'s;font-size:'+(16+Math.round(Math.random()*14))+'px">✦</i>';
    b.innerHTML=h;
    el.appendChild(b);
  }

  setInterval(function(){
    if(actif)appliquer_();
    if(flaqueNiveau>0)majFlaque_();
    majBrille_();
  },1500);

  /* Accident survenu HORS DE VUE (le Coffre n'est pas à l'écran) : tout est sale d'un coup, la flaque apparaît dès qu'on revoit le Coffre (majFlaque_, sans animation) et le sac est déjà éclaboussé. */
  function horsEcran_(){
    flaqueNiveau=NIVEAU_MAX;sauver_();
    souiller_();
  }

  window.__SOREAL_IDLE_CACA_V1__={
    souiller:souiller_,flaque:flaque_,horsEcran:horsEcran_,appliquer:appliquer_,
    flaqueNiveau:function(){return flaqueNiveau;},
    actif:function(){return actif;},brille:function(){return brilleJusqua>Date.now();}
  };
  style_();
  /* à l'ouverture de la page : ce qui était sale l'est toujours */
  setTimeout(function(){appliquer_();majFlaque_();majBrille_();},300);
})();
