/*
 * SOREAL IDLE — page Wandoos « ordinateur rétro » (Norman, 2026-10-06 : « un truc très rétro, très commodore, atari, amiga : les barres d'énergie dans
 * l'écran de idle/banners/wandoos.webp, écritures vertes comme sur les vieux PC, un bouton pour passer en vert, bleu, orange, blanc, des touches de clavier
 * en bas pour le + et le −, et le son d'un clavier quand on les presse »).
 *
 * 2026-10-07 : écran de démarrage (Wandoos 98, MEH ou XL, avec barre d'avancement), bureau accessible une fois l'OS démarré (Énergie et Magie à placer en QUANTITÉS, avec saisie), choix de l'OS.
 * Les données viennent de j.systemes (wandoosView : OS, vitesses, démarrage du wiki ; et l'état du système : niveaux des Dumps, allocation).
 *
 * L'image de l'ordinateur est découpée en neuf zones (border-image) : les coins gardent leurs proportions, le milieu s'étire, donc l'écran peut être aussi grand
 * que nécessaire. Les bordures sont exprimées en cqw (largeur du poste) : mêmes proportions que l'image à toutes les largeurs.
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_WANDOOS_V1__)return;

  var CLE_COULEUR='soreal_idle_wandoos_couleur_v1';
  /* Une vingtaine de couleurs d'écran (Norman, 2026-10-22 : « plein de couleurs différentes pour la touche couleur ») : nom -> teinte principale ; la teinte sombre et la lueur en sont déduites. */
  var TEINTES={vert:'#33ff66',bleu:'#5ab8ff',orange:'#ffb000',blanc:'#f0f0f0',rouge:'#ff5a5a',rose:'#ff8ad8',magenta:'#ff3df0',violet:'#b388ff',indigo:'#7c8cff',cyan:'#3df0ff',turquoise:'#2ee6c0',menthe:'#8affc1',citron:'#d8ff3d',jaune:'#ffe94d',or:'#ffd24a',corail:'#ff8a65',pêche:'#ffc9a0',lavande:'#d9c2ff',lime:'#9dff3a',glace:'#b8ecff'};
  var COULEURS=Object.keys(TEINTES);
  function reglesCouleurs_(){
    return COULEURS.filter(function(n){return n!=='vert';}).map(function(n){
      var h=TEINTES[n],r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);
      var sombre='rgb('+Math.round(r*.42)+','+Math.round(g*.42)+','+Math.round(b*.42)+')';
      return '.wd-poste[data-couleur="'+n+'"]{--wd-c:'+h+';--wd-c2:'+sombre+';--wd-glow:rgba('+r+','+g+','+b+',.55);}';
    });
  }
  var BANNIERE='/api/idle/media/banner?name=wandoos.webp';

  function H_(){return window.__SOREAL_IDLE_META_HOST_V130__;}
  function html_(t){var H=H_();return H&&H.idleHtml_?H.idleHtml_(t):String(t==null?'':t).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function nb_(v){var n=Number(v);return Number.isFinite(n)?n:0;}
  function grand_(v){var H=H_();return H&&H.formatGrandNombreIdleV70_?H.formatGrandNombreIdleV70_(v):String(Math.floor(nb_(v)));}

  function couleur_(){
    try{var c=localStorage.getItem(CLE_COULEUR);if(COULEURS.indexOf(c)!==-1)return c;}catch(_e){}
    return 'vert';
  }
  function changerCouleur_(){
    var suivante=COULEURS[(COULEURS.indexOf(couleur_())+1)%COULEURS.length];
    try{localStorage.setItem(CLE_COULEUR,suivante);}catch(_e){}
    var poste=document.querySelector('.wd-poste');
    if(poste)poste.setAttribute('data-couleur',suivante);
    var nom=document.querySelector('.wd-nomcouleur');
    if(nom)nom.textContent=suivante.toUpperCase();
    return suivante;
  }

  /* ---------- Foudre (Norman, 2026-10-22) : quand un éclair tombe et qu'on est sur Wandoos, l'image du moniteur est frappée : une interférence (image qui se déchire et saute, barres blanches, couleurs qui se séparent) puis tout reprend normalement. Animations du navigateur (Web Animations) : elles ne dépendent pas d'une classe que le redessin de la page pourrait retirer. ---------- */
  function foudre_(){
    var ecran=document.querySelector('.wd-poste .wd-ecran');
    if(!ecran||!ecran.animate||(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches))return false;
    var K=[
      {transform:'translate(0,0) skewX(0)',filter:'none',offset:0},
      {transform:'translate(-2.4%,0) skewX(-5deg)',filter:'brightness(3.2) contrast(1.8) saturate(.2)',offset:.06},
      {transform:'translate(3%,-1%) skewX(4deg)',filter:'brightness(1.8) contrast(2) hue-rotate(60deg)',offset:.14},
      {transform:'translate(-1.2%,1.5%) skewX(0)',filter:'brightness(2.4) contrast(1.4) saturate(.1)',offset:.22},
      {transform:'translate(1.6%,0) skewX(2deg)',filter:'brightness(.45) contrast(2.2) hue-rotate(-50deg)',offset:.32},
      {transform:'translate(-.8%,.6%) skewX(-1deg)',filter:'brightness(1.5) contrast(1.6)',offset:.46},
      {transform:'translate(.4%,0) skewX(0)',filter:'brightness(.8) contrast(1.2)',offset:.64},
      {transform:'translate(0,0) skewX(0)',filter:'none',offset:1}
    ];
    try{ecran.animate(K,{duration:620,easing:'steps(14,end)'});}catch(_e){return false;}
    /* barres de parasites : un calque gardé par le redessin, retiré à la fin */
    var nuage=document.createElement('div');
    nuage.className='wd-parasites';nuage.setAttribute('data-morph-garder','');nuage.setAttribute('aria-hidden','true');
    var barres='';
    for(var i=0;i<7;i++){barres+='<i style="top:'+Math.round(4+Math.random()*88)+'%;height:'+(2+Math.round(Math.random()*7))+'%;left:'+Math.round(Math.random()*30)+'%;width:'+(55+Math.round(Math.random()*45))+'%"></i>';}
    nuage.innerHTML=barres;
    ecran.appendChild(nuage);
    try{nuage.animate([{opacity:1},{opacity:.2},{opacity:.9},{opacity:.1},{opacity:.6},{opacity:0}],{duration:560,easing:'steps(6,end)',fill:'forwards'});}catch(_e){}
    setTimeout(function(){if(nuage.parentNode)nuage.parentNode.removeChild(nuage);},640);
    return true;
  }
  if(typeof window.addEventListener==='function')window.addEventListener('soreal-eclair-v1',function(){try{foudre_();}catch(_e){}});

  /* ---------- Son : un clavier mécanique (claquement bref + « thock » grave), au volume des sons de l'interface ---------- */
  var ac=null;
  function volume_(){
    var r=window.__SOREAL_IDLE_AUDIO_VOLUME_V1__;
    return r&&typeof r.getInterface==='function'?Number(r.getInterface()):0.75;
  }
  function contexte_(){
    if(ac&&ac.state!=='closed')return ac;
    var C=window.AudioContext||window.webkitAudioContext;
    if(!C)return null;
    try{ac=new C();}catch(_e){ac=null;}
    return ac;
  }
  /* Construit un bruit de touche dans le contexte donné (aussi utilisé tel quel par les tests). */
  function construireTouche_(c,sortie,t,relache,grave,alea){
    var a=typeof alea==='function'?alea:Math.random;
    var duree=relache?0.016:0.03;
    var n=Math.max(1,Math.floor(c.sampleRate*duree));
    var tampon=c.createBuffer(1,n,c.sampleRate);
    var d=tampon.getChannelData(0);
    for(var i=0;i<n;i++)d[i]=(a()*2-1)*Math.pow(1-i/n,3);
    var src=c.createBufferSource();src.buffer=tampon;
    var bp=c.createBiquadFilter();bp.type='bandpass';
    bp.frequency.value=(relache?4200:(grave?1900:3200))*(0.9+a()*0.2);bp.Q.value=1.2;
    var g=c.createGain();g.gain.value=relache?0.35:0.9;
    src.connect(bp);bp.connect(g);g.connect(sortie);src.start(t);
    if(!relache){
      var o=c.createOscillator();o.type='sine';
      var f0=(grave?110:170)*(0.95+a()*0.1);
      o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f0*0.5,t+0.05);
      var og=c.createGain();og.gain.setValueAtTime(0.6,t);og.gain.exponentialRampToValueAtTime(0.001,t+0.07);
      o.connect(og);og.connect(sortie);o.start(t);o.stop(t+0.08);
    }
  }
  /* Même clic de clavier que l'entraînement avancé (Norman, 2026-10-07 : « pour wandoos, je veux le même bruit que entrainement avancé pour les touches du clavier ») : on réutilise ses sons « btPlus » (touche normale) et « btMinus » (barre d'espace, plus grave). Le relâchement est déjà inclus dans ce clic. Sans le module audio, repli sur le bruit de touche ci-dessus. */
  function sonCommun_(relache,grave){
    var A=window.__SOREAL_IDLE_AUDIO_V199__;
    if(!A||typeof A.play!=='function')return null;
    if(relache)return true;
    try{A.play(grave?'btMinus':'btPlus');return true;}catch(_e){return null;}
  }
  function sonTouche_(relache,grave){
    var v=volume_();
    if(!(v>0))return false;
    var commun=sonCommun_(relache,grave);
    if(commun!==null)return commun;
    var c=contexte_();
    if(!c)return false;
    try{
      if(c.state==='suspended'&&c.resume)c.resume();
      var maitre=c.createGain();maitre.gain.value=Math.min(1,v)*0.55;(window.__SOREAL_IDLE_LIMITEUR_V1__&&window.__SOREAL_IDLE_LIMITEUR_V1__.brancher(c,maitre))||maitre.connect(c.destination);
      construireTouche_(c,maitre,c.currentTime,relache,grave);
      return true;
    }catch(_e){return false;}
  }
  function toucheDe_(e){
    var cible=e&&e.target;
    return cible&&cible.closest?cible.closest('.wd-touche'):null;
  }
  try{
    document.addEventListener('pointerdown',function(e){var t=toucheDe_(e);if(t&&!t.disabled)sonTouche_(false,t.classList.contains('wd-espace'));},true);
    document.addEventListener('pointerup',function(e){var t=toucheDe_(e);if(t&&!t.disabled)sonTouche_(true,t.classList.contains('wd-espace'));},true);
    document.addEventListener('keydown',function(e){
      var t=e.target&&e.target.closest?e.target.closest('.wd-touche'):null;
      if(t&&(e.key==='Enter'||e.key===' ')&&!e.repeat)sonTouche_(false,t.classList.contains('wd-espace'));
    },true);
  }catch(_e){}

  /* ---------- Style (injecté une fois) ---------- */
  function style_(){
    if(document.getElementById('wd-style-v1'))return;
    var s=document.createElement('style');s.id='wd-style-v1';
    s.textContent=[
      '.wd-poste{--wd-c:#33ff66;--wd-c2:#0f7a2c;--wd-glow:rgba(51,255,102,.55);container-type:inline-size;width:100%;max-width:min(900px,76vh);margin:10px auto 18px;}',
      'html body .soreal-idle-page-root-v28[data-menu] .wd-poste{max-width:min(900px,76vh)!important;}',
      '@media (max-width:700px){html body .soreal-idle-page-root-v28[data-menu] .wd-poste.wd-poste{max-width:none!important;width:100vw;margin-left:calc(50% - 50vw);margin-right:0;}}',
      reglesCouleurs_().join(''),
      /* L'écran de l'image : bordures en cqw = proportions de l'image (1254 px, vide transparent rogné par border-image-outset : écran de x162 à 1092, y195 à 891 ; image visible de x17 à 1236, y46 à 1225). */
      /* L'écran est DERRIÈRE l'image du moniteur (Norman, 2026-10-07) : l'image est posée par-dessus (son vide d'écran est transparent), sans jamais intercepter un clic. */
      '.wd-crt{position:relative;isolation:isolate;box-sizing:border-box;width:97.29cqw;margin:3.67cqw auto 0;border:solid transparent;border-width:11.88cqw 11.48cqw 26.64cqw 11.56cqw;}',
      '.wd-crt::after{content:"";position:absolute;z-index:3;pointer-events:none;top:-11.88cqw;right:-11.48cqw;bottom:-26.64cqw;left:-11.56cqw;box-sizing:border-box;border:solid transparent;border-width:11.88cqw 11.48cqw 26.64cqw 11.56cqw;border-image:url("'+BANNIERE+'") 195 162 363 162 fill / 15.55cqw 12.92cqw 28.95cqw 12.92cqw / 3.67cqw 1.36cqw 2.23cqw 1.36cqw stretch;}',
      '.wd-ecran{position:relative;z-index:1;box-sizing:border-box;height:55.4cqw;margin:0;padding:4.4cqw 5.4cqw 2cqw;border-radius:4.5cqw;overflow-x:hidden;overflow-y:auto;scrollbar-width:none;background:radial-gradient(ellipse at center,#06150a 0%,#020a05 70%,#000 100%);color:var(--wd-c);font-family:"Courier New",Courier,monospace;font-size:clamp(8px,2.5cqw,19px);line-height:1.25;text-transform:uppercase;letter-spacing:.04em;text-shadow:0 0 .35em var(--wd-glow);box-shadow:inset 0 0 3cqw rgba(0,0,0,.9),inset 0 0 .6cqw var(--wd-c2);}',
      /* Lignes de balayage, léger vacillement et reflet de la vitre. */
      '.wd-ecran::before{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(0,0,0,.28) 0 1px,transparent 1px 3px);z-index:2;}',
      '.wd-ecran::after{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 22% 12%,rgba(255,255,255,.10),transparent 38%);z-index:3;animation:wd-vacille 4s infinite;}',
      '@keyframes wd-vacille{0%,100%{opacity:1}50%{opacity:.82}52%{opacity:1}}',
      '.wd-ecran>*{position:relative;z-index:1;}',
      '.wd-ligne{display:flex;justify-content:space-between;gap:.8em;flex-wrap:wrap;}',
      '.wd-titre{margin-top:2.2cqw;font-weight:700;border-bottom:1px dashed var(--wd-c2);padding-bottom:.35em;margin-bottom:.5em;}',
      '.wd-titre .wd-etat{font-weight:400;}',
      '.wd-bloc{margin-top:.5em;}',
      '.wd-ligne b{font-weight:700;}',
      /* « 69 % » + « lol » à droite, hors du flux : le chiffre ne se décale jamais (voir noeudTexte69LolIdleV183_). */
      '.wd-poste :is(b,span,div):has(>.wd-lol-v1){position:relative;}',
      '.wd-lol-v1{position:absolute;left:100%;top:0;margin-left:.3em;white-space:nowrap;font-weight:700;font-size:.8em;line-height:1.35;}',
      '.wd-rang{display:grid;grid-template-columns:5.2em 1fr 3.6em;align-items:center;gap:.6em;margin-top:.25em;}',
      '.wd-lib{color:var(--wd-c2);filter:brightness(1.6);}',
      '.wd-pct{text-align:right;white-space:nowrap;}',
      /* Barre : cases pleines à l'ancienne (blocs de 0,8 em séparés d'un filet), qui s'allument de gauche à droite. */
      '.wd-barre{position:relative;height:1.05em;border:1px solid var(--wd-c2);padding:2px;background:#010503;}',
      '.wd-barre i{display:block;height:100%;background:var(--wd-c);box-shadow:0 0 .6em var(--wd-glow);-webkit-mask:repeating-linear-gradient(90deg,#000 0 .55em,transparent .55em .72em);mask:repeating-linear-gradient(90deg,#000 0 .55em,transparent .55em .72em);}',
      '.wd-invite{margin-top:.6em;}',
      '.wd-curseur{display:inline-block;width:.6em;height:1em;vertical-align:text-bottom;background:var(--wd-c);box-shadow:0 0 .5em var(--wd-glow);animation:wd-clignote 1s steps(1) infinite;}',
      '@keyframes wd-clignote{0%{opacity:1}50%{opacity:0}}',
      /* Clavier. */
      '.wd-clavier{box-sizing:border-box;width:94%;margin:-5cqw auto 0;position:relative;padding:2.4cqw 3cqw 3cqw;border-radius:2.4cqw;background:linear-gradient(180deg,#d6cfb8,#bdb59a);border:2px solid #1d1a14;box-shadow:0 .7cqw 0 #8f8869,0 1.4cqw 2cqw rgba(0,0,0,.5),inset 0 .3cqw 0 rgba(255,255,255,.55);}',
      '.wd-plaque{display:grid;grid-template-columns:1fr 1fr;gap:2cqw 3cqw;}',
      '.wd-groupe{min-width:0;}',
      '.wd-leg{display:block;font:700 clamp(9px,1.9cqw,13px) "Courier New",monospace;letter-spacing:.12em;color:#4a4332;margin:0 0 .5cqw .3cqw;text-transform:uppercase;}',
      '.wd-rangee{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:1.2cqw;}',
      '.wd-touche{appearance:none;-webkit-appearance:none;cursor:pointer;position:relative;min-height:max(46px,7.2cqw);min-width:44px;padding:.3em .2em;border-radius:.9cqw;border:1px solid #2b271c;background:linear-gradient(180deg,#f1ecdc 0%,#d9d2ba 55%,#c9c1a5 100%);color:#26221a;font:700 clamp(15px,3.6cqw,26px) "Courier New",monospace;line-height:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.15em;box-shadow:0 .8cqw 0 #8b836a,0 1cqw .6cqw rgba(0,0,0,.45),inset 0 .25cqw 0 rgba(255,255,255,.8);transition:transform .04s,box-shadow .04s;-webkit-tap-highlight-color:transparent;touch-action:manipulation;user-select:none;-webkit-user-select:none;}',
      '.wd-touche small{font:700 clamp(8px,1.7cqw,12px) "Courier New",monospace;letter-spacing:.06em;color:#5b543f;}',
      '.wd-touche:hover{filter:brightness(1.05);}',
      '.wd-touche:active,.wd-touche.wd-enfoncee{transform:translateY(.7cqw);box-shadow:0 .1cqw 0 #8b836a,0 .2cqw .3cqw rgba(0,0,0,.5),inset 0 .15cqw 0 rgba(255,255,255,.5);}',
      '.wd-touche:focus-visible{outline:3px solid #ffb000;outline-offset:2px;}',
      '.wd-touche-couleur{background:linear-gradient(180deg,#43403a,#2a2823);color:#e9e3cf;border-color:#000;box-shadow:0 .8cqw 0 #0c0b09,0 1cqw .6cqw rgba(0,0,0,.45),inset 0 .25cqw 0 rgba(255,255,255,.18);}',
      '.wd-touche-couleur small{color:#cfc8b0;}',
      '.wd-touche-couleur:active{box-shadow:0 .1cqw 0 #0c0b09,0 .2cqw .3cqw rgba(0,0,0,.5);}',
      '.wd-bas{grid-column:1/-1;display:grid;grid-template-columns:1fr 2.2fr;gap:3cqw;align-items:end;}',
      '.wd-espace{width:100%;font-size:clamp(13px,3cqw,22px);letter-spacing:.14em;}',
      /* Petit écran : un groupe de touches par ligne (4 touches de 44 px minimum ne tiennent pas côte à côte). */
      '@container (max-width:560px){.wd-plaque{grid-template-columns:1fr}.wd-clavier{width:100%;padding:3cqw}.wd-touche{min-height:48px}}',
      /* Démarrage, bureau, saisie (2026-10-07). */
      /* Troisième colonne de largeur FIXE (Norman, 2026-10-25 : « la barre est quelques pixels plus longue par moment ») : avec « auto », elle suivait le texte (« 5% » plus court que « 50% » ou « 100% ») et la barre s'allongeait de quelques pixels sous 10 %. */
      '.wd-rang{grid-template-columns:6.6em 1fr 3.8em;}',
      '.wd-centre{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.1em;min-height:28cqw;text-align:center;}',
      '.wd-logo{display:flex;align-items:center;gap:.7em;font-size:1.9em;line-height:1;}',
      '.wd-drapeau{display:grid;grid-template-columns:1fr 1fr;gap:.12em;width:1.5em;height:1.5em;transform:skewX(-8deg) rotate(-6deg);}',
      '.wd-drapeau i{display:block;background:var(--wd-c);opacity:.95;box-shadow:0 0 .4em var(--wd-glow);}',
      '.wd-drapeau i:nth-child(2){opacity:.7}.wd-drapeau i:nth-child(3){opacity:.55}.wd-drapeau i:nth-child(4){opacity:.85}',
      '.wd-marque{font-weight:700;letter-spacing:.06em;}',
      '.wd-marque b{display:inline-block;margin-left:.2em;padding:0 .25em;border:2px solid var(--wd-c);}',
      '.wd-logo[data-os="98"] .wd-marque{font-style:italic;}',
      '.wd-logo[data-os="meh"] .wd-marque{font-weight:400;letter-spacing:.14em;}',
      '.wd-logo[data-os="meh"] .wd-drapeau{filter:grayscale(1) brightness(.8);transform:rotate(14deg);}',
      '.wd-logo[data-os="xl"] .wd-marque b{border-radius:.6em;background:var(--wd-c);color:#000;text-shadow:none;}',
      '.wd-logo[data-os="xl"] .wd-drapeau{filter:drop-shadow(0 0 .5em var(--wd-c));}',
      '.wd-eteint{opacity:.8;letter-spacing:.2em;}',
      '.wd-invite-centre{max-width:36em;font-size:.85em;opacity:.9;text-transform:none;letter-spacing:.02em;}',
      '.wd-boot{width:min(100%,34em);}',
      '.wd-barre-boot{height:1.5em;}',
      '.wd-boot .wd-ligne{justify-content:center;gap:1em;margin-top:.6em;}',
      '.wd-petit{font-size:.82em;opacity:.9;}',
      '.wd-saisie{margin-top:.6em;}',
      '.wd-saisie{justify-content:flex-start;flex-wrap:wrap;align-items:baseline;gap:.6em;}',
      '.wd-invite-c{white-space:nowrap;}',
      '.wd-frappe{word-break:break-all;color:var(--wd-c);text-transform:uppercase;}',
      '.wd-aide{margin-top:.9em;padding-top:.5em;border-top:1px dashed var(--wd-c2);font-size:.8em;opacity:.85;text-transform:none;letter-spacing:.02em;}',
      '.wd-bas-couleur{grid-template-columns:1fr;margin-top:1.4cqw;}',
      '.wd-touche:disabled{cursor:default;filter:brightness(.8);}',
      '.wd-touche{touch-action:manipulation;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;}',
      '.wd-pave-groupe{grid-column:1/-1;}',
      '.wd-pave{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:1.2cqw;}',
      '.wd-effacer small{display:block;}',
      '.wd-touche.wd-enfoncee{transform:translateY(.7cqw);box-shadow:0 .1cqw 0 #8b836a,0 .2cqw .3cqw rgba(0,0,0,.5),inset 0 .15cqw 0 rgba(255,255,255,.5);}',
      '@container (max-width:560px){.wd-rang-boot{grid-template-columns:1fr auto;}.wd-rang-boot .wd-lib{grid-column:1/-1;}.wd-logo{font-size:1.5em;}}',
      /* Chargement de l'OS : ambre fixe (quelle que soit la couleur de l'écran), cadre pointillé et rayures qui défilent : on voit tout de suite que ce n'est PAS une barre à remplir. */
      '.wd-chargement{margin:.3em 0 .35em;padding:.25em .5em;border:2px solid #ffb000;background:rgba(255,176,0,.08);color:#ffb000;text-shadow:0 0 .4em rgba(255,176,0,.55);}',
      '.wd-rangee-os{display:flex;align-items:center;gap:.7em;white-space:nowrap;}',
      '.wd-rangee-os .wd-chargeur{flex:1;min-width:0;}',
      '.wd-ecran:has(.wd-chargement){line-height:1.08;padding-top:2.4cqw;padding-bottom:1cqw;}',
      '.wd-ecran:has(.wd-chargement) .wd-bloc{margin-top:.2em;}',
      '.wd-parasites{position:absolute;inset:0;z-index:4;pointer-events:none;overflow:hidden;mix-blend-mode:screen;}',
      '.wd-parasites i{position:absolute;display:block;background:linear-gradient(90deg,transparent,rgba(255,255,255,.85) 20%,rgba(255,255,255,.55) 70%,transparent);box-shadow:0 0 .6em rgba(255,255,255,.7);}',
      '.wd-bios{display:flex;flex-direction:column;gap:.35em;min-height:28cqw;text-align:left;}',
      /* Interrupteur de synchro (Norman, 2026-10-23) : fine glissière de métal, manette qui monte pour activer ; loupiote verte allumée / rouge éteinte. */
      /* Norman (2026-10-23) : l'interrupteur est AU-DESSUS d'Énergie, tout petit (marge haute du clavier agrandie pour lui), identique sur téléphone. */
      '.wd-clavier-synchro{padding-top:7.6cqw;}',
      '.wd-synchro-flanc{position:absolute;left:3cqw;top:1.1cqw;display:flex;flex-direction:row;align-items:center;gap:1.6cqw;}',
      '.wd-sw{all:unset;cursor:pointer;display:block;width:clamp(15px,3.2cqw,23px);aspect-ratio:40/64;-webkit-tap-highlight-color:transparent;}',
      '.wd-sw:focus-visible{outline:2px solid #ffd84a;outline-offset:3px;border-radius:6px;}',
      '.wd-sw svg{display:block;width:100%;height:100%;overflow:visible;}',
      '.wd-sw .wd-sw-manette{transform:translateY(24px);transition:transform .22s cubic-bezier(.3,1.5,.5,1);}',
      '.wd-sw[aria-checked="true"] .wd-sw-manette{transform:translateY(0);}',
      '.wd-lampe{display:block;width:clamp(8px,1.9cqw,13px);aspect-ratio:1;border-radius:50%;border:2px solid #1d1a14;background:radial-gradient(circle at 35% 30%,#ff9a9a,#d62323 55%,#5a0a0a);box-shadow:0 0 .8cqw rgba(255,60,60,.65),inset 0 -1px 2px rgba(0,0,0,.4);transition:background .2s,box-shadow .2s;}',
      '.wd-sw[aria-checked="true"]~.wd-lampe{background:radial-gradient(circle at 35% 30%,#d8ffd8,#33e05a 55%,#0d6a24);box-shadow:0 0 1.6cqw rgba(60,255,110,.9),inset 0 -1px 2px rgba(0,0,0,.35);}',
      '.wd-synchro-texte{font:700 clamp(9px,1.8cqw,12px) "Courier New",monospace;letter-spacing:.08em;color:#4a4332;text-transform:uppercase;}',
      '@media (prefers-reduced-motion:reduce){.wd-sw .wd-sw-manette,.wd-lampe{transition:none;}}',
      '.wd-bios-titre{font-weight:700;border-bottom:1px dashed var(--wd-c2);padding-bottom:.35em;margin-bottom:.3em;}',
      '.wd-bios-bas{margin-top:auto;}',
      '.wd-chargeur{position:relative;height:1em;margin:0;border:1px dashed #ffb000;background:#060301;overflow:hidden;}',
      '.wd-chargeur i{display:block;height:100%;background:repeating-linear-gradient(135deg,#ffb000 0 .5em,#6b4500 .5em 1em);background-size:1.42em 100%;animation:wd-defile 1s linear infinite;}',
      '@keyframes wd-defile{to{background-position:1.42em 0}}',
      '@media (prefers-reduced-motion:reduce){.wd-chargeur i{animation:none;}}',
      '.wd-poste[data-phase="eteint"] .wd-ecran{background:#000;box-shadow:inset 0 0 3cqw rgba(0,0,0,.95);}',
      '@media (prefers-reduced-motion:reduce){.wd-ecran::after,.wd-curseur{animation:none;}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  /* ===================================================================================================================================
   * Allumage, chargement, bureau et clavier (Norman, 2026-10-07).
   *  - Les quantités d'énergie et de magie sont ABSOLUES (le serveur borne l'allocation au plafond et à ce qui est libre) : l'ancienne version envoyait un « pourcentage » de 0 à 100 et ne pouvait donc jamais
   *    placer plus de 100 points.
   *  - CHARGEMENT = le vrai démarrage du wiki (page Wandoos, « Boot-up » : 1 h au début de chaque Rebirth, vitesse de 0 à 100 % pendant ce temps, réduit par le set XL et les défis ; minimum 27 min). On peut
   *    déjà placer de l'énergie et de la magie pendant ce chargement (« elles vont prendre de la vitesse suivant l'état d'avancement du boot », Norman) : le moteur applique la rampe. Son avancement est montré
   *    dans un cadre à part, d'un style différent des barres à remplir (ambre, rayures qui défilent), pour qu'on voie tout de suite que c'est un chargement.
   *  - ALLUMAGE = l'écran d'accueil avec le nom de l'OS et une courte barre : animation SOREAL (durées de notre choix, le wiki n'en donne pas), affichée UNE seule fois par Rebirth.
   * =================================================================================================================================== */
  var DUREE_ALLUMAGE_MS={'98':2500,meh:3500,xl:4500};
  var NOMS_OS={'98':'Wandoos 98',meh:'Wandoos MEH',xl:'Wandoos XL'};
  var COURT_OS={'98':'98',meh:'MEH',xl:'XL'};
  var MESSAGES_BOOT={
    '98':['Réveil du processeur (il dormait)…','Comptage de la mémoire : 640 Ko, ça devrait suffire…','Chargement du fond d’écran (une colline, forcément)…','Wandoos 98 est prêt. Il le dit lui-même.'],
    meh:['Wandoos MEH démarre… sans enthousiasme.','Recherche de pilotes introuvables…','Installation de mises à jour inutiles…','Prêt. Enfin, disons prêt.'],
    xl:['Wandoos XL se pavane…','Chargement de la grande colline verte…','Vérification que tu n’as pas copié le disque…','Prêt. Son bouton Démarrer est très brillant.']
  };
  /* Le BIOS apparaît une demi-seconde avant l'écran d'accueil (Norman, 2026-10-22). */
  var BIOS_MS=500;
  var CLE_ALLUMAGE='soreal_idle_wandoos_allumage_v1';
  var allumage=null,timerTic=0,osEnAttente='';
  function maintenant_(){return (typeof performance!=='undefined'&&performance.now)?performance.now():Date.now();}
  /* L'avancement du chargement se poursuit entre deux réponses du serveur : on retient l'instant où chaque vue a été vue pour prolonger l'horloge localement. */
  var vues=typeof WeakMap==='function'?new WeakMap():null;
  function bootVu_(v){
    var total=nb_(v.bootSecondes);
    if(v.bootFraction==null||!(total>0))return {fraction:1,restant:0,total:0};
    var lu=Date.now();
    if(vues&&typeof v==='object'){if(vues.has(v))lu=vues.get(v);else vues.set(v,lu);}
    var ecoule=Math.min(total,nb_(v.bootEcoule)+Math.max(0,(Date.now()-lu)/1000));
    return {fraction:Math.max(0,Math.min(1,ecoule/total)),restant:Math.max(0,total-ecoule),total:total};
  }

  function dureeTexte_(sec){
    var s=Math.max(0,Math.ceil(nb_(sec)));
    if(s<60)return s+' s';
    var h=Math.floor(s/3600),m=Math.floor((s%3600)/60);
    if(h>0)return h+' h '+(m<10?'0':'')+m+' min';
    return m+' min '+(s%60<10?'0':'')+(s%60)+' s';
  }
  function format_(v){
    var n=nb_(v);
    if(Math.abs(n)>=1000)return grand_(n);
    return n.toLocaleString('fr-FR',{maximumFractionDigits:2});
  }
  function etat_(j){
    var meta=window.__SOREAL_IDLE_META_V130__;
    var s=meta&&meta.systemeMetaParIdIdleV130_?meta.systemeMetaParIdIdleV130_(j,'wandoos'):null;
    if(!s||!s.unlock||!s.unlock.unlocked)return null;
    var st=s.state||{};
    var vue=(j&&j.systemes&&j.systemes.wandoosView)||{};
    var magieOk=false;
    try{var bm=meta.systemeMetaParIdIdleV130_(j,'bloodMagic');magieOk=Boolean(bm&&bm.unlock&&bm.unlock.unlocked);}catch(_e){}
    var os=String(vue.os||(st.data&&st.data.os)||'98');
    if(!NOMS_OS[os])os='98';
    var e={s:s,st:st,data:st.data||{},al:st.allocation||{},vue:vue,actif:Boolean(st.active),os:os,magieOk:magieOk,dispos:Array.isArray(vue.osDisponibles)&&vue.osDisponibles.length?vue.osDisponibles:['98']};
    /* Clics rapides (Norman, 2026-10-19 : « Wandoos galère toujours quand je place des 20K à la chaîne »). La réponse du moteur à un clic ancien arrive pendant qu'on clique encore : elle remettait dans l'état l'ancienne allocation, et le chiffre reculait (19 reculs en 30 clics à la souris). Tant que la dernière cible demandée a moins de 2,5 s, on l'affiche : elle prime sur une réponse en retard. */
    ['energy','magic'].forEach(function(res){
      var vis=typeof visee_!=='undefined'&&visee_[res];
      if(!vis||Date.now()-vis.at>=2500)return;
      var cleLibre=res==='energy'?'energieLibre':'magieLibre';
      var actuelleMoteur=Math.max(0,nb_(e.al[res])),libreMoteur=Math.max(0,nb_(vue[cleLibre]));
      if(actuelleMoteur===vis.v)return;
      var total=actuelleMoteur+libreMoteur;
      e.al=Object.assign({},e.al);e.al[res]=Math.max(0,Math.min(vis.v,total));
      e.vue=Object.assign({},e.vue);e.vue[cleLibre]=Math.max(0,total-e.al[res]);
    });
    e.enChargement=bootVu_(vue).fraction<0.9999;
    /* Instant (horloge locale) où le serveur a calculé ces chiffres : les barres de niveau avancent à partir de là, jamais d'un repère périmé. */
    e.at=(j&&Number.isFinite(j.__recuPerfV1))?j.__recuPerfV1:(vues&&vue&&typeof vue==='object'?(function(){var lu=maintenant_();if(vues.has(vue))lu=vues.get(vue);else vues.set(vue,lu);return lu;})():maintenant_());
    return e;
  }

  /* ---------- Saisie : un nombre (1000, 2,5M…) ou une fraction (1/4 = un quart de ce que tu possèdes pour cette ressource) ---------- */
  var CLE_SAISIE='soreal_idle_wandoos_saisie_v1';
  function saisie_(){try{var v=localStorage.getItem(CLE_SAISIE);if(v!==null)return v;}catch(_e){}return '1000';}
  function saisir_(v){try{localStorage.setItem(CLE_SAISIE,String(v));}catch(_e){}}
  function analyser_(texte,total){
    var t=String(texte==null?'':texte).trim().replace(',','.').replace(/\s+/g,'');
    var f=/^(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/.exec(t);
    if(f){var d=Number(f[2]);return d>0?Math.floor(total*Number(f[1])/d):0;}
    var m=/^(\d+(?:\.\d+)?(?:e\d+)?)([kmbt]?)$/i.exec(t);
    if(!m)return 0;
    var mult={'':1,k:1e3,m:1e6,b:1e9,t:1e12}[m[2].toLowerCase()];
    return Math.floor(Number(m[1])*mult);
  }

  /* ---------- Allumage : une seule fois par Rebirth ---------- */
  function declencherAllumage_(e){
    var run=nb_(e.vue.runId);
    if(!e.actif||allumage||!(run>0))return;
    var vu='';
    try{vu=localStorage.getItem(CLE_ALLUMAGE)||'';}catch(_e){}
    if(vu===String(run))return;
    try{localStorage.setItem(CLE_ALLUMAGE,String(run));}catch(_e){}
    allumage={debut:Date.now(),duree:(DUREE_ALLUMAGE_MS[e.os]||2500)+BIOS_MS,os:e.os,bios:true};
  }
  function allumageProgres_(){
    if(!allumage)return 1;
    return allumage.duree>BIOS_MS?Math.min(1,Math.max(0,(Date.now()-allumage.debut-BIOS_MS)/(allumage.duree-BIOS_MS))):1;
  }

  /* ---------- Écrans ---------- */
  function logo_(os){
    return '<div class="wd-logo" data-os="'+html_(os)+'"><span class="wd-drapeau" aria-hidden="true"><i></i><i></i><i></i><i></i></span>'+
      '<span class="wd-marque">Wandoos <b>'+html_(COURT_OS[os])+'</b></span></div>';
  }
  function ecranEteint_(e){
    var total=nb_(e.vue.bootSecondes);
    return '<div class="wd-centre">'+logo_(e.os)+
      '<div class="wd-eteint">[ ] ORDINATEUR ÉTEINT</div>'+
      '<div class="wd-invite-centre">'+(e.dispos.length>1?'Choisis ton système, puis appuie':'Appuie')+' sur DÉMARRER.<br>Wandoos transforme l’énergie et la magie en Attack et Defense.'+
      (total>0?' Après chaque Rebirth, il met '+html_(dureeTexte_(total))+' à charger : en attendant, ce que tu places avance de plus en plus vite.':'')+'</div>'+
    '</div>';
  }
  function ecranBios_(os){
    var nom=NOMS_OS[os]||NOMS_OS['98'];
    return '<div class="wd-bios" aria-hidden="true">'+
      '<div class="wd-bios-titre">SOREAL BIOS V1.0 — © 1998 SOREAL CORP.</div>'+
      '<div>CPU : SOREAL-286 @ 12 MHZ ........ OK</div>'+
      '<div>MÉMOIRE : 640 KO ........ OK</div>'+
      '<div>CLAVIER ........ OK</div>'+
      '<div>DISQUE : DÉTECTION ........ OK</div>'+
      '<div>DÉMARRAGE : '+html_(nom.toUpperCase())+'</div>'+
      '<div class="wd-bios-bas">APPUYEZ SUR [SUPPR] POUR LE SETUP <span class="wd-curseur"></span></div>'+
    '</div>';
  }
  function ecranAllumage_(e){
    if(allumage&&allumage.bios&&Date.now()-allumage.debut<BIOS_MS)return ecranBios_(allumage.os);
    var p=allumageProgres_(),os=allumage?allumage.os:e.os;
    var msgs=MESSAGES_BOOT[os]||MESSAGES_BOOT['98'];
    var i=Math.min(msgs.length-1,Math.floor(p*msgs.length));
    return '<div class="wd-centre">'+logo_(os)+
      '<div class="wd-boot"><div class="wd-barre wd-barre-boot" id="wd-boot-barre"><i style="width:'+(p*100).toFixed(1)+'%"></i></div>'+
      '<div class="wd-ligne"><span id="wd-boot-msg">'+html_(msgs[i])+'</span><b id="wd-boot-pct">'+Math.floor(p*100)+'%</b></div></div>'+
    '</div>';
  }
  /* Le chargement de l'OS (vrai démarrage du wiki) : cadre ambre à rayures qui défilent, volontairement différent des barres de dump à remplir. */
  function panneauChargement_(e){
    var b=bootVu_(e.vue),pct=Math.floor(b.fraction*100);
    /* Compact (Norman, 2026-10-22 : « tout sur un seul écran, même pendant le chargement ») : le titre, la barre et le pourcentage tiennent sur UNE ligne, puis une petite ligne. */
    return '<div class="wd-chargement" role="status">'+
      '<div class="wd-rangee-os"><span>CHARGEMENT DE L’OS</span><div class="wd-chargeur" id="wd-chargeur"><i id="wd-ch-fill" style="width:'+(b.fraction*100).toFixed(1)+'%"></i></div><b id="wd-ch-pct">'+pct+' %</b></div>'+
      '<div class="wd-ligne wd-petit"><span>Vitesse <b id="wd-ch-vit">'+pct+' %</b> du maximum</span><span>Encore <b id="wd-ch-reste">'+html_(dureeTexte_(b.restant))+'</b></span></div>'+
    '</div>';
  }
  /* Au-delà d'un niveau par seconde, le temps restant tomberait sous 1 s : on écrit la vitesse (niveaux par seconde) jusqu'au cap de 50 niveaux/s de Wandoos (Norman, 2026-10-22). */
  function texteTaux_(v){
    var n=Math.min(50,nb_(v));
    return 'RESTE : '+(n>=10?Math.round(n):Math.round(n*10)/10).toLocaleString('fr-FR')+'/s';
  }
  /* Temps restant avant le prochain niveau, seul sous la barre (Norman, 2026-10-07 : « juste le temps restant en dessous, pas de phrase »). */
  function texteReste_(v,p0){
    if(!(v>0))return 'RESTE : —';
    if(v>1)return texteTaux_(v);
    return 'RESTE : '+dureeTexte_((1-Math.max(0,Math.min(1,nb_(p0))))/v);
  }
  function bloc_(titre,res,e,libreCle,vitesseCle,niveau,progression){
    var placee=nb_(e.al[res]),libre=nb_(e.vue[libreCle]),vit=nb_(e.vue[vitesseCle]);
    var prog=Math.max(0,Math.min(1,nb_(progression)));
    var vitTexte=vit>=50?'50 (MAXIMUM)':format_(vit);
    return '<div class="wd-bloc">'+
      '<div class="wd-ligne"><span>'+titre+'</span><span>NIVEAU <b data-wd-niveau>'+html_(grand_(niveau))+'</b></span></div>'+
      '<div class="wd-ligne"><span class="wd-lib">PLACÉE</span><b>'+html_(grand_(placee))+'</b></div>'+   /* « Libre » retiré (Norman, 2026-10-22 : déjà dans la barre du haut) */
      '<div class="wd-rang" data-wd-barre="'+res+'" data-p0="'+prog+'" data-v="'+vit+'" data-at="'+nb_(e.at)+'" data-niv0="'+nb_(niveau)+'"><span class="wd-lib">NIVEAU+1</span><div class="wd-barre"><i data-wd-remplissage style="width:'+(prog*100).toFixed(1)+'%"></i></div><span class="wd-pct" data-wd-pct>'+Math.floor(prog*100)+'%</span></div>'+
      '<div class="wd-ligne wd-petit"><span data-wd-reste>'+html_(texteReste_(vit,prog))+'</span></div>'+
    '</div>';
  }
  function ecranBureau_(e){
    var v=e.vue;
    var bonus=nb_(v.bonusCombat);
    return '<div class="wd-ligne wd-titre"><span>'+html_(NOMS_OS[e.os])+'</span><span class="wd-etat">[*] EN MARCHE</span></div>'+
      (e.enChargement?panneauChargement_(e):'')+
      '<div class="wd-ligne"><span>BONUS ATTACK ET DEFENSE</span><b>×'+html_(format_(Math.max(1,bonus)))+'</b></div>'+
      '<div class="wd-ligne"><span>VERSION OS</span><b>'+html_(grand_(v.niveauOsTotal||0))+'</b><span class="wd-lib">VITESSE ×'+html_(grand_(v.multiplicateurOs||1))+'</span></div>'+
      bloc_('ÉNERGIE','energy',e,'energieLibre','vitesseEnergie',e.data.dumpEnergyLevel,e.data.dumpEnergyProgress)+
      (e.magieOk?bloc_('MAGIE','magic',e,'magieLibre','vitesseMagie',e.data.dumpMagicLevel,e.data.dumpMagicProgress):'')+
      '<div class="wd-ligne wd-saisie" role="group" aria-label="Quantité placée ou retirée à chaque appui sur + ou − : tape-la avec les chiffres du clavier (un nombre, ou une fraction comme 1/4)"><span class="wd-invite-c">C:\\&gt;</span><span id="wd-saisie" class="wd-frappe">'+html_(saisie_())+'</span><span class="wd-curseur" aria-hidden="true"></span></div>';
  }

  /* ---------- Clavier ---------- */
  function touche_(libelle,sous,onclick,classe,titre,desactive){
    return '<button type="button" class="wd-touche'+(classe?' '+classe:'')+'"'+(desactive?' disabled':'')+' title="'+html_(titre||'')+'" aria-label="'+html_(titre||sous||libelle)+'" onclick="'+onclick+'">'+libelle+(sous?'<small>'+sous+'</small>':'')+'</button>';
  }
  var API="window.__SOREAL_IDLE_WANDOOS_V1__";
  function groupe_(nom,res,e){
    var p=API+".place('"+res+"','";
    return '<div class="wd-groupe"><span class="wd-leg">'+nom+'</span><div class="wd-rangee">'+
      touche_('0','',p+"zero')",'',nom+' : tout retirer')+
      touche_('−','',p+"moins')",'',nom+' : retirer la quantité saisie')+
      touche_('+','',p+"plus')",'',nom+' : placer la quantité saisie')+
      touche_('CAP',(e&&e.vue&&nb_(e.vue[res==='energy'?'capEnergie':'capMagie'])>0)?grand_(e.vue[res==='energy'?'capEnergie':'capMagie']):'',p+"cap')",'',nom+' : placer d’un coup l’allocation qui atteint le cap de Wandoos (au-delà, aucun niveau de plus par seconde)')+
    '</div></div>';
  }
  function groupeOs_(e){
    if(e.dispos.length<2)return '';
    return '<div class="wd-groupe"><span class="wd-leg">Système</span><div class="wd-rangee">'+
      e.dispos.map(function(o){
        var courant=o===e.os,attente=osEnAttente===o;
        return touche_(html_(COURT_OS[o]),attente?'CONFIRMER ?':(courant?'ACTUEL':''),API+".os('"+o+"')",courant?'wd-enfoncee':'',(courant?'Système actuel : ':'Passer à ')+NOMS_OS[o]+(courant?'':' (remet à zéro les niveaux de Dump)'),courant);
      }).join('')+
    '</div></div>';
  }
  /* Synchro Wandoos : achetée dans le rayon Toc de la boutique EXP (le serveur l'annonce par wandoosSynchro) ; l'achat est retenu (jamais perdu par une réponse sans le champ) ; le choix est un réglage du compte. */
  var CLE_SYNCHRO='soreal_idle_wandoos_synchro_v1',synchroAchetee_=false;
  function synchroAchetee(j){
    if(j&&typeof j.wandoosSynchro==='boolean'){
      synchroAchetee_=j.wandoosSynchro;
      /* pas (encore) acheté : tout réglage resté d'une autre partie est effacé ; à l'achat, l'interrupteur est ÉTEINT, pour le plaisir de l'allumer (Norman, 2026-10-23) */
      if(!j.wandoosSynchro){try{localStorage.removeItem(CLE_SYNCHRO);}catch(_e){}}
    }
    return synchroAchetee_;
  }
  function synchroAllumee(){try{return localStorage.getItem(CLE_SYNCHRO)==='1';}catch(_e){return false;}}
  function synchroActive(j){return synchroAchetee(j)&&synchroAllumee();}
  function basculerSynchro(){
    var H=H_();
    if(!H||!H.getIdleEtat||!synchroAchetee(H.getIdleEtat()))return;
    var on=!synchroAllumee();
    try{localStorage.setItem(CLE_SYNCHRO,on?'1':'0');}catch(_e){}
    [].slice.call(document.querySelectorAll('.wd-sw')).forEach(function(b){b.setAttribute('aria-checked',on?'true':'false');b.setAttribute('title',on?'Synchro allumée : l’énergie et la magie bougent ensemble (clique pour couper)':'Synchro éteinte : clique pour que l’énergie et la magie bougent ensemble');});
  }
  function synchroGroupe_(j){
    if(!synchroAchetee(j))return '';
    var on=synchroAllumee();
    var svg='<svg viewBox="0 0 40 64" aria-hidden="true" focusable="false"><defs><linearGradient id="wdMet" x1="0" x2="1"><stop offset="0" stop-color="#6d7178"/><stop offset=".45" stop-color="#e3e6ea"/><stop offset="1" stop-color="#7c8088"/></linearGradient></defs>'+
      '<rect x="12" y="2" width="16" height="60" rx="8" fill="#1d1a14" stroke="#8d9199" stroke-width="1.5"/><rect x="17" y="8" width="6" height="48" rx="3" fill="#050403"/>'+
      '<g class="wd-sw-manette"><rect x="5" y="9" width="30" height="16" rx="6" fill="url(#wdMet)" stroke="#2b2d31" stroke-width="1.6"/><path d="M9 14H31M9 17H31M9 20H31" stroke="#6b6f76" stroke-width=".9"/></g></svg>';
    return '<div class="wd-synchro-flanc">'+
      '<button type="button" class="wd-sw" role="switch" aria-checked="'+(on?'true':'false')+'" aria-label="Synchro Wandoos : l’énergie et la magie bougent ensemble" title="'+(on?'Synchro allumée : l’énergie et la magie bougent ensemble (clique pour couper)':'Synchro éteinte : clique pour que l’énergie et la magie bougent ensemble')+'" onclick="'+API+'.synchro()">'+svg+'</button>'+
      '<i class="wd-lampe" aria-hidden="true"></i><span class="wd-synchro-texte">Sync</span></div>';
  }
  function pave_(){
    var ch=function(c){return touche_(c,'',API+".chiffre('"+c+"')",'wd-chiffre','Chiffre '+c);};
    return '<div class="wd-groupe wd-pave-groupe"><span class="wd-leg">Saisie</span><div class="wd-pave">'+
      ['1','2','3','4','5','6','7','8','9','0'].map(ch).join('')+
      touche_('/','',API+".chiffre('/')",'wd-chiffre','Barre de fraction (1/4 = un quart)')+
      '<button type="button" class="wd-touche wd-effacer" title="Effacer (maintenir appuyé pour effacer chiffre par chiffre)" aria-label="Effacer le dernier caractère ; maintenir appuyé pour effacer chiffre par chiffre">⌫<small>EFFACER</small></button>'+
    '</div></div>';
  }
  function clavier_(e,phase){
    var couleur='<div class="wd-groupe"><span class="wd-leg">Écran</span><button type="button" class="wd-touche wd-touche-couleur" title="Changer la couleur de l’écran" aria-label="Changer la couleur de l’écran (vingt couleurs)" onclick="'+API+'.couleur()">COULEUR<small class="wd-nomcouleur">'+couleur_().toUpperCase()+'</small></button></div>';
    var demarrage=e.actif
      ?touche_('■ ÉTEINDRE','',API+'.eteindre()','wd-espace','Éteindre Wandoos')
      :touche_('▶ DÉMARRER','',API+'.demarrer()','wd-espace','Démarrer Wandoos');
    var haut='';
    var flanc='';
    if(phase==='bureau'){
      haut=groupe_('Énergie','energy',e)+(e.magieOk?groupe_('Magie','magic',e):'')+pave_();
      /* l'interrupteur est sur le côté GAUCHE du clavier (Norman, 2026-10-23) */
      if(e.magieOk)flanc=synchroGroupe_(window.__SOREAL_IDLE_META_HOST_V130__&&window.__SOREAL_IDLE_META_HOST_V130__.getIdleEtat?window.__SOREAL_IDLE_META_HOST_V130__.getIdleEtat():null);
    }
    var os=groupeOs_(e);
    return '<div class="wd-clavier'+(flanc?' wd-clavier-synchro':'')+'">'+flanc+'<div class="wd-plaque">'+haut+
      '<div class="wd-bas">'+(os||couleur)+'<div class="wd-groupe"><span class="wd-leg">Système</span>'+demarrage+'</div></div>'+
      (os?'<div class="wd-bas wd-bas-couleur">'+couleur+'</div>':'')+
    '</div></div>';
  }

  /* Phases : éteint -> (allumage, une fois par Rebirth) -> bureau ; le chargement de l'OS est un cadre du bureau tant qu'il n'est pas terminé. */
  function phaseDe_(e){
    if(!e.actif)return 'eteint';
    if(allumage&&allumageProgres_()<1)return 'allumage';
    return 'bureau';
  }
  function poste_(j){
    var e=etat_(j);
    if(!e)return '';
    var c=couleur_();
    declencherAllumage_(e);
    var phase=phaseDe_(e);
    var ecran=phase==='allumage'?ecranAllumage_(e):(phase==='bureau'?ecranBureau_(e):ecranEteint_(e));
    if((phase==='allumage'||(phase==='bureau'&&e.enChargement))&&!timerTic&&typeof setInterval==='function')timerTic=setInterval(tic_,100);
    planifierVie_();
    return '<div class="wd-poste" data-sans-couleur-nombre="1" data-couleur="'+c+'" data-phase="'+phase+'"><div class="wd-crt"><div class="wd-ecran">'+ecran+'</div></div>'+clavier_(e,phase)+'</div>';
  }
  function page(j){
    style_();
    var H=H_();
    var e=etat_(j);
    if(!e)return '';
    var s=e.s;
    var titre=H&&H.entetePageIdleV28_?H.entetePageIdleV28_(html_((s.icon||'💻')+' '+(s.name||'Wandoos')),''):'';
    /* Pas de barre d'outils d'allocation ici (Norman, 2026-10-10) : la saisie se fait au clavier de l'ordinateur rétro. */
    return titre+poste_(j);
  }
  var signaturePosteV1_='';
  function rafraichirPoste_(){
    var H=H_();
    var poste=document.querySelector('.wd-poste');
    if(!poste||!H||!H.getIdleEtat)return;
    var html=poste_(H.getIdleEtat());
    if(!html)return;
    /* Poste identique au précédent (seuls les repères des barres changent : data-p0 / data-at) : on ne remplace rien, on remet juste ces repères. Reconstruire tout l'ordinateur rétro (innerHTML, mise en page) coûtait 80 à 280 ms par rafraîchissement sur un gros compte. */
    var signature=html.replace(/ data-(p0|at|niv0)="[^"]*"/g,'').replace(/(<b data-wd-niveau>)[^<]*/g,'$1');
    if(signature===signaturePosteV1_&&poste.querySelector&&poste.querySelector('[data-wd-barre]')){
      var neuves=document.createElement('div');neuves.innerHTML=html;
      var nouvelles=neuves.querySelectorAll('[data-wd-barre]'),actuelles=poste.querySelectorAll('[data-wd-barre]');
      if(nouvelles.length===actuelles.length){
        for(var i=0;i<actuelles.length;i+=1){actuelles[i].setAttribute('data-p0',nouvelles[i].getAttribute('data-p0'));actuelles[i].setAttribute('data-at',nouvelles[i].getAttribute('data-at'));actuelles[i].setAttribute('data-niv0',nouvelles[i].getAttribute('data-niv0'));}
        return;
      }
    }
    signaturePosteV1_=signature;
    /* L'écran ne doit jamais remonter (Norman, 2026-10-08) : la hauteur de la page est retenue pendant le remplacement du poste (sinon, plus courte un instant, elle ramène le défilement vers le haut,
       surtout dans l'application où la page est dans un cadre), puis le défilement est remis exactement où il était. */
    var corps=document.body,x=window.scrollX||0,y=window.scrollY||0;
    var pose=false;
    try{var h=document.documentElement.scrollHeight;if(corps&&!corps.style.minHeight){corps.style.minHeight=h+'px';pose=true;}}catch(_e){}
    /* L'intérieur de l'écran garde aussi son défilement (sinon il revient tout en haut à chaque ressource placée). */
    var ecranVu=poste.querySelector&&poste.querySelector('.wd-ecran'),haut=ecranVu?ecranVu.scrollTop:0;
    poste.outerHTML=html;
    if(haut>0){var ecranNeuf=document.querySelector('.wd-poste .wd-ecran');if(ecranNeuf)ecranNeuf.scrollTop=haut;}
    if(window.scrollY!==y&&typeof window.scrollTo==='function')window.scrollTo(x,y);
    if(typeof requestAnimationFrame==='function')requestAnimationFrame(function(){
      try{if(corps&&pose)corps.style.minHeight='';}catch(_e){}
      if(Math.abs((window.scrollY||0)-y)>1&&typeof window.scrollTo==='function')window.scrollTo(x,y);
    });
  }

  /* ---------- Actions ---------- */
  function meta_(payload){var f=window.__actionMetaIdleV130__;if(typeof f==='function')f(payload);}
  function arreterTimer_(){if(timerTic){clearInterval(timerTic);timerTic=0;}}
  /* Un seul minuteur : fait avancer l'écran d'allumage, puis la barre de chargement ; s'arrête dès qu'il n'y a plus rien à animer. */
  function tic_(){
    var H=H_();
    var e=H&&H.getIdleEtat?etat_(H.getIdleEtat()):null;
    if(!e||!e.actif||!document.querySelector('.wd-poste')){arreterTimer_();return;}
    if(allumage){
      if(allumage.bios&&Date.now()-allumage.debut>=BIOS_MS){allumage.bios=false;rafraichirPoste_();}   /* fin du BIOS : l'écran d'accueil prend la place */
      var p=allumageProgres_();
      if(p>=1){allumage=null;rafraichirPoste_();if(!e.enChargement)arreterTimer_();return;}
      var barre=document.querySelector('#wd-boot-barre i'),pct=document.getElementById('wd-boot-pct'),msg=document.getElementById('wd-boot-msg');
      if(barre)barre.style.width=(p*100).toFixed(1)+'%';
      if(pct)pct.textContent=Math.floor(p*100)+'%';
      var msgs=MESSAGES_BOOT[allumage.os]||MESSAGES_BOOT['98'];
      var texte=msgs[Math.min(msgs.length-1,Math.floor(p*msgs.length))];
      if(msg&&msg.textContent!==texte)msg.textContent=texte;
      return;
    }
    var fill=document.getElementById('wd-ch-fill');
    if(!e.enChargement||!fill){arreterTimer_();if(fill)rafraichirPoste_();return;}
    var b=bootVu_(e.vue),pc=Math.floor(b.fraction*100);
    fill.style.width=(b.fraction*100).toFixed(1)+'%';
    var a=document.getElementById('wd-ch-pct'),v=document.getElementById('wd-ch-vit'),r=document.getElementById('wd-ch-reste');
    if(a)a.textContent=pc+' %';
    if(v)v.textContent=pc+' %';
    if(r)r.textContent=dureeTexte_(b.restant);
  }
  /*
   * Barres « NIVEAU+1 » en temps réel (Norman, 2026-10-07 : « la barre doit avancer petit à petit, pas par grands à-coups ; avec le temps pour le niveau suivant qui se met à jour aussi »).
   * Fraction = progression connue du serveur + vitesse (niveaux par seconde) × temps écoulé depuis l'instant où il l'a calculée. Au-delà de 3 niveaux par seconde, la barre boucle trop vite
   * pour être suivie : elle reste pleine. Le temps restant écrit sous la barre suit la même horloge.
   */
  var vivant=0,gardeBarres_={};
  function fractionBarre_(p0,v,at){
    var dt=Math.max(0,(maintenant_()-at)/1000);
    if(!(v>0))return {f:Math.max(0,Math.min(1,p0)),reste:null,gain:0};
    /* Au-delà de 20 niveaux/s la barre ne peut plus se lire (elle clignoterait) : pleine. En dessous, elle avance (Norman, 2026-10-20 : « avec mes 8M la barre ne bouge plus »). */
    if(v>=20)return {f:1,reste:null,gain:Math.floor(p0+v*dt)};
    var brut=p0+v*dt;
    var f=brut-Math.floor(brut);
    return {f:f,reste:(1-f)/v,gain:Math.floor(brut)};
  }
  function vivre_(){
    vivant=0;
    var barres=document.querySelectorAll('.wd-poste [data-wd-barre]');
    if(!barres.length)return;
    for(var i=0;i<barres.length;i++){
      var b=barres[i];
      var r=fractionBarre_(nb_(b.getAttribute('data-p0')),nb_(b.getAttribute('data-v')),nb_(b.getAttribute('data-at')));
      /*
       * Pas de petit recul (Norman, 2026-10-25 : « quand j'ajoute 100K dans Wandoos avec la synchro, les barres font un mouvement de recul très bref ») : la réponse du moteur après un placement redonne un repère (p0) légèrement en deçà de ce que la barre
       * affichait déjà. Un recul de moins de 6 % de la barre est donc tenu (la barre reste où elle est, le temps que la vraie valeur la rattrape, 2,5 s au plus) ; un vrai passage à 0 (niveau gagné) n'est jamais retenu.
       */
      var cleG=b.getAttribute('data-wd-barre')||'';
      var gb=gardeBarres_[cleG]||(gardeBarres_[cleG]={f:0,t:0});
      var tG=maintenant_();
      if(gb.f>0&&r.f<gb.f&&gb.f-r.f<0.06&&tG-gb.t<2500)r.f=gb.f;
      else{gb.f=r.f;gb.t=tG;}
      var rempl=b.querySelector('[data-wd-remplissage]');
      if(rempl)rempl.style.width=(r.f*100).toFixed(2)+'%';
      /* Le niveau affiché avance avec la barre (niveau de départ + niveaux terminés depuis le repère), comme le moteur : il ne saute plus à chaque synchro. */
      var niv0=b.getAttribute('data-niv0');
      if(niv0!==null&&r.gain>=0){
        var blocNiv=b.parentNode&&b.parentNode.querySelector('[data-wd-niveau]');
        if(blocNiv){var tn=grand_(nb_(niv0)+r.gain);if(blocNiv.textContent!==tn)blocNiv.textContent=tn;}
      }
      var pct=b.querySelector('[data-wd-pct]');
      if(pct)pct.textContent=Math.floor(r.f*100)+'%';
      var reste=b.parentNode&&b.nextElementSibling&&b.nextElementSibling.querySelector('[data-wd-reste]');
      if(reste){
        var vit=nb_(b.getAttribute('data-v'));
        var t=vit>1?texteTaux_(vit):(r.reste!=null?'RESTE : '+dureeTexte_(r.reste):'RESTE : —');
        if(reste.textContent!==t)reste.textContent=t;
      }
    }
    planifierVie_();
  }
  function planifierVie_(){
    if(vivant||typeof requestAnimationFrame!=='function')return;
    vivant=requestAnimationFrame(vivre_);
  }
  function demarrer(){
    var H=H_();
    var e=H&&H.getIdleEtat?etat_(H.getIdleEtat()):null;
    if(!e||e.actif)return;
    meta_({action:'toggle',system:'wandoos',active:true});
  }
  function eteindre(){
    var H=H_();
    var e=H&&H.getIdleEtat?etat_(H.getIdleEtat()):null;
    if(!e||!e.actif)return;
    arreterTimer_();
    allumage=null;
    meta_({action:'toggle',system:'wandoos',active:false});
  }
  function choisirOs(os){
    var H=H_();
    var e=H&&H.getIdleEtat?etat_(H.getIdleEtat()):null;
    if(!e||!NOMS_OS[os]||os===e.os||e.dispos.indexOf(os)===-1)return;
    var aDesNiveaux=nb_(e.data.dumpEnergyLevel)+nb_(e.data.dumpMagicLevel)>0;
    if(aDesNiveaux&&osEnAttente!==os){osEnAttente=os;rafraichirPoste_();return;}
    osEnAttente='';
    meta_({action:'selectWandoosOs',os:os});
  }
  /* Clics rapides (Norman, 2026-10-19 : « quand je clique très vite, des clics se perdent ») : une réponse du moteur arrivée entre deux appuis remettait l'ancienne valeur dans l'état ; le 2e appui repartait donc de l'ancienne base et envoyait la MÊME cible que le 1er (écartée comme doublon). On se souvient de la dernière cible demandée et on repart d'elle pendant 2,5 s. */
  var visee_={};
  /* Synchro (Norman, 2026-10-23) : allumée, 0, −, + et CAP agissent sur l'énergie ET la magie (celle qu'on touche ou l'autre) ; faute de magie libre, on place le maximum disponible (la borne « libre » de placerUn_). */
  function placer(res,mode){
    var H=H_();
    var j=H&&H.getIdleEtat?H.getIdleEtat():null;
    if(j&&synchroActive(j)){
      /* un seul appel pour les deux ressources (champ « pair ») : les barres partent au même instant */
      var charges=[];
      placerUn_('energy',mode,charges);placerUn_('magic',mode,charges);
      if(charges.length===1)meta_(charges[0]);
      else if(charges.length>1)meta_(Object.assign({},charges[0],{pair:{resource:charges[1].resource,value:charges[1].value}}));
      return;
    }
    placerUn_(res,mode);
  }
  function placerUn_(res,mode,collecte){
    var H=H_();
    if(!H||!H.getIdleEtat)return;
    var j=H.getIdleEtat(),e=etat_(j);
    if(!e||phaseDe_(e)!=='bureau'||(res!=='energy'&&res!=='magic'))return;
    if(res==='magic'&&!e.magieOk)return;
    var cleLibre=res==='energy'?'energieLibre':'magieLibre';
    var libre=Math.max(0,nb_(e.vue[cleLibre])),actuelle=Math.max(0,nb_(e.al[res]));
    var vis=visee_[res];
    if(vis&&Date.now()-vis.at<2500){var total=actuelle+libre;actuelle=Math.max(0,Math.min(vis.v,total));libre=total-actuelle;}
    var montant=analyser_(saisie_(),libre+actuelle);
    /* CAP (Norman, 2026-10-20 : « le bouton Cap doit fonctionner comme celui de Basic Training ») : PLACE directement l'allocation qui atteint le cap de Wandoos envoyé par le serveur
       (wandoosView.capEnergie / capMagie : 50 niveaux par seconde), limitée à ce qui est libre ; au-dessus du cap, elle ramène à ce cap. Plus de chiffre à recopier dans la saisie. */
    var capServeur=mode==='cap'?Math.ceil(nb_(e.vue[res==='energy'?'capEnergie':'capMagie'])):0;
    if(mode==='cap'&&!(capServeur>0))return;
    var cible=mode==='zero'?0:mode==='cap'?(capServeur>actuelle?actuelle+Math.min(capServeur-actuelle,libre):capServeur):mode==='plus'?actuelle+Math.min(montant,libre):Math.max(0,actuelle-montant);
    cible=Math.max(0,Math.min(actuelle+libre,cible));
    if(cible===actuelle)return;
    visee_[res]={v:cible,at:Date.now()};
    /* Mise à jour immédiate de l'écran : deux appuis rapprochés doivent s'additionner sans attendre le serveur. */
    e.st.allocation=e.st.allocation||{};
    e.st.allocation[res]=cible;
    e.vue[cleLibre]=Math.max(0,libre-(cible-actuelle));
    rafraichirPoste_();
    var charge={action:'allocate',system:'wandoos',resource:res,value:cible};
    if(collecte)collecte.push(charge);else meta_(charge);
  }
  /* Le cap sous forme de saisie : entier tel quel, ou notation en e (1.2345e30) arrondie vers le haut à 10 chiffres si l'entier dépasse les 18 caractères de la saisie. */
  function capTexte_(cap){
    var t=cap<1e21?String(Math.ceil(cap)):'';
    if(t&&t.length<=18)return t;
    var k=Math.floor(Math.log10(cap)),m=Math.ceil(cap/Math.pow(10,k)*1e10)/1e10;
    if(m>=10){m=1;k+=1;}
    return String(m)+'e'+k;
  }
  function majSaisie_(v){
    saisir_(v);
    var c=document.getElementById('wd-saisie');
    if(c)c.textContent=v;
  }
  /* Saisie par les touches du clavier : 18 caractères au plus ; un seul « / », jamais en premier ; un 0 initial est remplacé par le chiffre tapé. */
  function chiffre(c){
    c=String(c);
    if(!/^[0-9/]$/.test(c))return;
    var v=saisie_();
    if(v.length>=18)return;
    if(c==='/'&&(v.indexOf('/')!==-1||v===''))return;
    if(v==='0'&&c!=='/')v='';
    majSaisie_(v+c);
  }
  function effacer(){
    var v=saisie_();
    majSaisie_(v.slice(0,-1));
  }
  /* EFFACER maintenu : un caractère tout de suite, puis un toutes les 70 ms après 0,4 s. */
  var delaiEffacer=0,repeteEffacer=0;
  function arreterEffacer_(){
    if(delaiEffacer){clearTimeout(delaiEffacer);delaiEffacer=0;}
    if(repeteEffacer){clearInterval(repeteEffacer);repeteEffacer=0;}
  }
  function debutEffacer_(){
    arreterEffacer_();
    effacer();
    delaiEffacer=setTimeout(function(){delaiEffacer=0;repeteEffacer=setInterval(effacer,70);},400);
  }
  try{
    var cibleEffacer_=function(e){var t=e&&e.target;return t&&t.closest?t.closest('.wd-effacer'):null;};
    document.addEventListener('pointerdown',function(e){if(cibleEffacer_(e))debutEffacer_();},true);
    ['pointerup','pointercancel'].forEach(function(n){document.addEventListener(n,arreterEffacer_,true);});
    document.addEventListener('contextmenu',function(e){if(cibleEffacer_(e))e.preventDefault();},true);
    document.addEventListener('keydown',function(e){
      if(cibleEffacer_(e)&&(e.key==='Enter'||e.key===' ')){e.preventDefault();effacer();}
    },true);
  }catch(_e){}

  /*
   * Clics rapides sur les touches + et chiffres (Norman, 2026-10-19 : « quand je mets rapidement des 20K dans Wandoos, tous les clics ne sont pas validés »). Chaque placement redessine
   * TOUT le poste (poste.outerHTML) : un redessin qui tombe ENTRE l'appui et le relâchement détruit le bouton, et le navigateur n'envoie alors aucun clic. L'action part donc à
   * l'APPUI (souris), ou au relâchement sans bouger (doigt, stylet) sur le bouton mémorisé à l'appui ; le clic qui suit est ignoré une seule fois pour ne pas compter deux fois. Au
   * clavier (Entrée, espace), le clic normal reste seul en jeu.
   */
  try{
    var appuiTouche=null,faitsTouche=[];
    /* Nom propre : un second « toucheDe_ » remplaçait celui du son (fonction du même nom plus haut) et plus aucune touche ne faisait de bruit (Norman, 2026-10-22). */
    var toucheAction_=function(e){
      var b=e.target&&e.target.closest?e.target.closest('.wd-touche'):null;
      if(!b||b.disabled)return null;
      var code=b.getAttribute('onclick')||'';
      if(code.indexOf('.place(')===-1&&code.indexOf('.chiffre(')===-1)return null;
      return {code:code,fn:b.onclick,btn:b};
    };
    var declencher_=function(t){
      faitsTouche.push({code:t.code,at:performance.now()});
      if(faitsTouche.length>40)faitsTouche.shift();
      if(typeof t.fn==='function')t.fn.call(t.btn);
    };
    document.addEventListener('pointerdown',function(e){
      if(e.pointerType==='mouse'&&e.button!==0)return;
      var t=toucheAction_(e);
      if(!t)return;
      if(e.pointerType==='mouse'){declencher_(t);return;}
      appuiTouche={t:t,x:e.clientX,y:e.clientY,at:performance.now()};
    },true);
    document.addEventListener('pointerup',function(e){
      var a=appuiTouche;appuiTouche=null;
      if(!a||e.pointerType==='mouse')return;
      if(Math.abs(e.clientX-a.x)<10&&Math.abs(e.clientY-a.y)<10&&performance.now()-a.at<900)declencher_(a.t);
    },true);
    document.addEventListener('pointercancel',function(){appuiTouche=null;},true);
    document.addEventListener('click',function(e){
      var t=toucheAction_(e);
      if(!t)return;
      var now=performance.now();
      for(var i=0;i<faitsTouche.length;i++){
        if(faitsTouche[i].code===t.code&&now-faitsTouche[i].at<1000){
          faitsTouche.splice(i,1);
          e.stopImmediatePropagation();e.preventDefault();
          return;
        }
      }
    },true);
  }catch(_e){}

  window.__SOREAL_IDLE_WANDOOS_V1__={page:page,couleur:changerCouleur_,couleurs:COULEURS,son:sonTouche_,construireTouche:construireTouche_,
    demarrer:demarrer,rafraichir:rafraichirPoste_,saisir:majSaisie_,eteindre:eteindre,os:choisirOs,place:placer,synchro:basculerSynchro,chiffre:chiffre,effacer:effacer,debutEffacer:debutEffacer_,finEffacer:arreterEffacer_,analyser:analyser_,dureesAllumage:DUREE_ALLUMAGE_MS};
})();
