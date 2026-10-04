/*
 * Effets visuels du combat d'Aventure (Norman, 2026-10-04) : « j'aimerais que les attaques soient représentées par des effets, pour le titan comme pour le joueur. Si un joueur lance un soin, on doit voir des croix vertes qui flottent
 * le temps de la regen. Pour chaque attaque, un effet sur l'image du mob/titan. Quand le titan nous fait saigner, notre barre de vie doit le montrer, avec du sang qui coule. »
 *
 * Deux API (le combat de soreal-idle-ui.js les appelle, sans jamais en dépendre : tout est gardé par « if(window.SorealCombatFxV1) ») :
 *  - jouer(cible, type, texte) : effet ponctuel posé par-dessus l'image du mob ('mob') ou la barre de vie du joueur ('joueur') ; il se retire seul.
 *  - etats({soin, saigne, paralyse, spores, mobParalyse}) : effets qui durent (soin : jusqu'à une date, saigne : nombre de cumuls, les autres : booléens). Appelé à chaque tick du combat ; {} les éteint.
 * Aucune image : dégradés CSS et émojis. Les animations sont réduites si l'appareil demande moins de mouvement.
 */
(function(){
  'use strict';
  if(typeof window==='undefined'||typeof document==='undefined')return;

  var MAX_EFFETS=48;
  var racine=null;
  var courant={};
  var minuteur=0;
  var dernierSang=0,dernierSoin=0,dernierEclair=0,dernierSpore=0;
  var vivants=0;

  function reduit(){try{return window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){return false;}}

  function style(){
    if(document.getElementById('sorealCombatFxStyleV1'))return;
    var s=document.createElement('style');s.id='sorealCombatFxStyleV1';
    s.textContent=[
      '#sorealCombatFxV1{position:fixed;inset:0;pointer-events:none;z-index:2147483000;overflow:hidden}',
      '.cfx{position:fixed;pointer-events:none;display:grid;place-items:center;overflow:visible}',
      '.cfx>*{grid-area:1/1}',
      /* ---- Sur le mob / le titan ---- */
      '.cfx-coup::before{content:"";width:86%;height:5px;border-radius:3px;background:linear-gradient(90deg,transparent,#fff,transparent);box-shadow:0 0 12px #fff,0 0 22px #9ad;transform:rotate(-32deg) scaleX(0);animation:cfxTrait .34s ease-out forwards}',
      '.cfx-fort::before{content:"";width:60%;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,#fff6c8 0,#ffb13a 38%,rgba(255,80,0,.55) 62%,transparent 72%);animation:cfxBoum .48s ease-out forwards}',
      '.cfx-fort::after{content:"💥";font-size:44px;animation:cfxBoum .48s ease-out forwards}',
      '.cfx-perce::before{content:"";width:100%;height:6px;background:linear-gradient(90deg,transparent,#8ff 30%,#fff 50%,#8ff 70%,transparent);box-shadow:0 0 14px #5ef;transform:scaleX(0);animation:cfxTrait .38s ease-out forwards}',
      '.cfx-perce::after{content:"🗡️";font-size:36px;animation:cfxPerce .38s ease-out forwards}',
      '.cfx-ultime::before{content:"";width:90%;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,#fff 0,#e6a3ff 28%,rgba(160,40,255,.6) 55%,transparent 72%);animation:cfxBoum .7s ease-out .22s both}',
      '.cfx-ultime::after{content:"☄️";font-size:56px;animation:cfxMeteore .62s cubic-bezier(.5,0,.9,.6) forwards}',
      /* ---- Sur la barre de vie du joueur ---- */
      '.cfx-degats::before{content:"";width:100%;height:100%;border-radius:8px;background:radial-gradient(ellipse,rgba(255,40,40,.75),rgba(255,0,0,0) 70%);animation:cfxFlash .42s ease-out forwards}',
      '.cfx-puissante::before{content:"";width:120%;height:260%;border-radius:12px;background:radial-gradient(ellipse,rgba(255,20,20,.9),rgba(255,120,0,.4) 50%,rgba(255,0,0,0) 72%);animation:cfxFlash .6s ease-out forwards}',
      '.cfx-puissante::after{content:"💢";font-size:34px;animation:cfxBoum .6s ease-out forwards}',
      '.cfx-bloc::before{content:"";width:100%;height:100%;border-radius:8px;border:3px solid #6cf;box-shadow:0 0 18px #6cf,inset 0 0 14px #6cf;animation:cfxFlash .5s ease-out forwards}',
      '.cfx-bloc::after{content:"🛡️";font-size:30px;animation:cfxBoum .5s ease-out forwards}',
      '.cfx-aura::before{content:"";width:100%;height:100%;border-radius:8px;box-shadow:0 0 22px 6px var(--cfx-c,#fc3),inset 0 0 14px var(--cfx-c,#fc3);animation:cfxFlash .9s ease-out forwards}',
      '.cfx-eclair::before{content:"⚡";font-size:30px;color:#ff0;text-shadow:0 0 10px #ff0,0 0 22px #fa0;animation:cfxEclair .5s ease-out forwards}',
      '.cfx-spore::before{content:"☁️";font-size:30px;filter:hue-rotate(60deg) saturate(3) brightness(.8);animation:cfxSpore 1.1s ease-out forwards}',
      '.cfx-sauterelle::before{content:"🦗";font-size:30px;animation:cfxSaute .5s ease-out forwards}',
      '.cfx-invincible::before{content:"";width:80%;aspect-ratio:1;border-radius:50%;border:4px solid #ffd23a;box-shadow:0 0 22px #ffd23a,inset 0 0 18px #ffd23a;animation:cfxBoum .5s ease-out forwards}',
      '.cfx-invincible::after{content:"🛡️";font-size:40px;animation:cfxBoum .5s ease-out forwards}',
      '.cfx-mob-inv{filter:drop-shadow(0 0 12px #ffd23a) brightness(1.15)!important}',
      '.cfx-chemise::before{content:"👔";font-size:40px;animation:cfxBoum .8s ease-out forwards}',
      '.titan-off{opacity:.4!important;filter:grayscale(1)!important}',
      /* Nombres flottants. */
      '.cfx-nombre{font:900 20px/1 system-ui,sans-serif;color:#fff;text-shadow:0 2px 0 #000,0 0 8px #000;animation:cfxNombre .9s ease-out forwards}',
      '.cfx-nombre.joueur{color:#ff7a7a}',
      '.cfx-nombre.soin{color:#7dff9a}',
      /* ---- Effets qui durent ---- */
      '.cfx-croix{position:fixed;font:900 24px/1 system-ui,sans-serif;color:#3be86a;text-shadow:0 0 8px #0f0,0 0 2px #063;animation:cfxCroix 1.5s ease-out forwards}',
      '.cfx-goutte{position:fixed;width:7px;height:11px;border-radius:50% 50% 55% 55%/35% 35% 65% 65%;background:linear-gradient(#c40000,#6d0000);box-shadow:0 0 3px rgba(120,0,0,.8);animation:cfxGoutte .95s cubic-bezier(.4,0,1,1) forwards}',
      '.cfx-saigne{filter:hue-rotate(-150deg) saturate(1.8) brightness(.8);box-shadow:0 0 0 2px rgba(150,0,0,.85),0 0 14px rgba(200,0,0,.7)!important;animation:cfxPouls 1.1s ease-in-out infinite}',
      '.cfx-paralyse{box-shadow:0 0 0 2px #ee0,0 0 16px #fd0!important;animation:cfxVibre .12s linear infinite}',
      '.cfx-spores{box-shadow:0 0 0 2px #6b3,0 0 14px rgba(120,220,60,.7)!important}',
      '.cfx-mob-para{filter:drop-shadow(0 0 10px #ee0) saturate(1.5)!important;animation:cfxVibre .14s linear infinite}',
      '@keyframes cfxTrait{0%{transform:rotate(-32deg) scaleX(0);opacity:1}60%{transform:rotate(-32deg) scaleX(1);opacity:1}100%{transform:rotate(-32deg) scaleX(1.1);opacity:0}}',
      '@keyframes cfxBoum{0%{transform:scale(.2);opacity:0}30%{opacity:1}100%{transform:scale(1.35);opacity:0}}',
      '@keyframes cfxPerce{0%{transform:translateX(-80%);opacity:0}30%{opacity:1}100%{transform:translateX(80%);opacity:0}}',
      '@keyframes cfxMeteore{0%{transform:translate(70%,-160%) scale(.6);opacity:0}30%{opacity:1}100%{transform:translate(0,0) scale(1.25);opacity:0}}',
      '@keyframes cfxSaute{0%{transform:translateX(-90%) translateY(10px) rotate(-20deg);opacity:0}30%{opacity:1}100%{transform:translateX(90%) translateY(-6px) rotate(20deg);opacity:0}}',
      '@keyframes cfxFlash{0%{opacity:0}18%{opacity:1}100%{opacity:0}}',
      '@keyframes cfxEclair{0%{transform:scale(.3) rotate(-20deg);opacity:0}25%{opacity:1}100%{transform:scale(1.4) rotate(15deg);opacity:0}}',
      '@keyframes cfxSpore{0%{transform:translateY(8px) scale(.5);opacity:0}30%{opacity:.95}100%{transform:translateY(-26px) scale(1.5);opacity:0}}',
      '@keyframes cfxNombre{0%{transform:translateY(0) scale(.7);opacity:0}15%{transform:translateY(-8px) scale(1.15);opacity:1}100%{transform:translateY(-46px) scale(1);opacity:0}}',
      '@keyframes cfxCroix{0%{transform:translateY(0) scale(.6);opacity:0}15%{opacity:1}100%{transform:translateY(-64px) scale(1.15) rotate(12deg);opacity:0}}',
      '@keyframes cfxGoutte{0%{transform:translateY(0) scaleY(.4);opacity:0}12%{opacity:1;transform:translateY(2px) scaleY(1)}100%{transform:translateY(54px) scaleY(1.5);opacity:0}}',
      '@keyframes cfxPouls{0%,100%{box-shadow:0 0 0 2px rgba(150,0,0,.85),0 0 8px rgba(200,0,0,.5)}50%{box-shadow:0 0 0 2px rgba(220,0,0,1),0 0 20px rgba(255,0,0,.9)}}',
      '@keyframes cfxVibre{0%{transform:translateX(-1.5px)}50%{transform:translateX(1.5px)}100%{transform:translateX(-1.5px)}}',
      '@media (prefers-reduced-motion:reduce){.cfx-croix,.cfx-goutte,.cfx-saigne,.cfx-paralyse,.cfx-mob-para{animation:none!important}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function calque(){
    if(racine&&racine.isConnected)return racine;
    racine=document.getElementById('sorealCombatFxV1');
    if(!racine){racine=document.createElement('div');racine.id='sorealCombatFxV1';racine.setAttribute('aria-hidden','true');document.body.appendChild(racine);}
    return racine;
  }

  function cible(nom){
    var el=nom==='mob'?document.getElementById('sorealIdleAdventureSceneMobV1'):document.getElementById('sorealIdleAdventureJoueurBarV1');
    if(!el)return null;
    var r=el.getBoundingClientRect();
    if(!(r.width>4&&r.height>4))return null;
    return {el:el,r:r};
  }

  function poser(classe,x,y,w,h,duree,texte,extra){
    if(vivants>=MAX_EFFETS)return;
    var d=document.createElement('div');
    d.className=classe;
    d.style.left=x+'px';d.style.top=y+'px';
    if(w!=null){d.style.width=w+'px';d.style.height=h+'px';}
    if(texte!=null)d.textContent=texte;
    if(extra)Object.keys(extra).forEach(function(k){d.style.setProperty(k,extra[k]);});
    calque().appendChild(d);
    vivants+=1;
    setTimeout(function(){if(d.parentNode)d.parentNode.removeChild(d);vivants=Math.max(0,vivants-1);},duree);
  }

  /* Effet ponctuel. texte : nombre flottant facultatif (dégâts, soin). */
  function jouer(nom,type,texte){
    if(reduit()&&type!=='degats'&&type!=='bloc')return;
    style();
    var c=cible(nom);
    if(!c)return;
    var r=c.r;
    var ex=type==='buffOff'?{'--cfx-c':'#ff6a3a'}:type==='buffDef'?{'--cfx-c':'#5ab4ff'}:type==='buffUlt'?{'--cfx-c':'#ffd23a'}:null;
    var classe=ex?'cfx cfx-aura':'cfx cfx-'+type;
    poser(classe,r.left,r.top,r.width,r.height,type==='ultime'?950:760,null,ex);
    if(texte!=null&&texte!==''){
      var cl=nom==='mob'?'cfx cfx-nombre':(type==='soin'?'cfx cfx-nombre soin':'cfx cfx-nombre joueur');
      poser(cl,r.left+r.width*(.3+Math.random()*.4),r.top+r.height*.2,null,null,950,String(texte));
    }
  }

  function tic(){
    var maintenant=Date.now();
    var joueur=cible('joueur');
    var mob=cible('mob');
    var bar=joueur&&joueur.el;
    if(bar){
      bar.classList.toggle('cfx-saigne',!!courant.saigne);
      bar.classList.toggle('cfx-paralyse',!!courant.paralyse);
      bar.classList.toggle('cfx-spores',!!courant.spores);
    }
    if(mob){
      mob.el.classList.toggle('cfx-mob-para',!!courant.mobParalyse);
      mob.el.classList.toggle('cfx-mob-inv',!!courant.mobInvincible);
    }
    if(bar){
      var r=joueur.r;
      if(courant.soin>maintenant&&maintenant-dernierSoin>180){
        dernierSoin=maintenant;
        poser('cfx-croix',r.left+Math.random()*(r.width-18),r.top+r.height*(.2+Math.random()*.5),null,null,1550,'✚');
      }
      if(courant.saigne>0){
        var n=Math.min(12,courant.saigne);
        if(maintenant-dernierSang>Math.max(110,420-n*30)){
          dernierSang=maintenant;
          poser('cfx-goutte',r.left+6+Math.random()*(r.width-12),r.top+r.height-4,null,null,1000);
        }
      }
      if(courant.paralyse&&maintenant-dernierEclair>260){
        dernierEclair=maintenant;
        poser('cfx cfx-eclair',r.left+Math.random()*(r.width-30),r.top-6,30,r.height,520);
      }
      if(courant.spores&&maintenant-dernierSpore>420){
        dernierSpore=maintenant;
        poser('cfx cfx-spore',r.left+Math.random()*(r.width-30),r.top-8,30,r.height,1150);
      }
    }
    if(courant.mobParalyse&&mob&&maintenant-dernierEclair>260){
      dernierEclair=maintenant;
      poser('cfx cfx-eclair',mob.r.left+Math.random()*(mob.r.width-30),mob.r.top+Math.random()*(mob.r.height*.6),30,40,520);
    }
  }

  function actif(){
    return courant.soin>Date.now()||courant.saigne>0||!!courant.paralyse||!!courant.spores||!!courant.mobParalyse||!!courant.mobInvincible;
  }

  /* États qui durent, à rappeler à chaque tick du combat. */
  function etats(e){
    style();
    courant=e||{};
    if(actif()){
      if(!minuteur&&typeof setInterval==='function')minuteur=setInterval(tic,100);
    }else if(minuteur){
      clearInterval(minuteur);minuteur=0;
      tic();
    }
  }

  window.SorealCombatFxV1={jouer:jouer,etats:etats};
})();
