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
  var COULEURS=['vert','bleu','orange','blanc'];
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
  function sonTouche_(relache,grave){
    var v=volume_();
    if(!(v>0))return false;
    var c=contexte_();
    if(!c)return false;
    try{
      if(c.state==='suspended'&&c.resume)c.resume();
      var maitre=c.createGain();maitre.gain.value=Math.min(1,v)*0.55;maitre.connect(c.destination);
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
      '.wd-poste{--wd-c:#33ff66;--wd-c2:#0f7a2c;--wd-glow:rgba(51,255,102,.55);container-type:inline-size;width:100%;max-width:900px;margin:10px auto 18px;}',
      '.wd-poste[data-couleur="bleu"]{--wd-c:#5ab8ff;--wd-c2:#1c5a99;--wd-glow:rgba(90,184,255,.55);}',
      '.wd-poste[data-couleur="orange"]{--wd-c:#ffb000;--wd-c2:#8a5a00;--wd-glow:rgba(255,176,0,.55);}',
      '.wd-poste[data-couleur="blanc"]{--wd-c:#f0f0f0;--wd-c2:#6d6d6d;--wd-glow:rgba(240,240,240,.45);}',
      /* L'écran de l'image : bordures en cqw = proportions de l'image (1254 px : haut 185, droite 184, bas 399, gauche 165). */
      /* L'écran est DERRIÈRE l'image du moniteur (Norman, 2026-10-07) : l'image est posée par-dessus (son vide d'écran est transparent), sans jamais intercepter un clic. */
      '.wd-crt{position:relative;isolation:isolate;box-sizing:border-box;width:100%;border:solid transparent;border-width:14.75cqw 14.67cqw 31.8cqw 13.16cqw;}',
      '.wd-crt::after{content:"";position:absolute;z-index:3;pointer-events:none;top:-14.75cqw;right:-14.67cqw;bottom:-31.8cqw;left:-13.16cqw;box-sizing:border-box;border:solid transparent;border-width:14.75cqw 14.67cqw 31.8cqw 13.16cqw;border-image:url("'+BANNIERE+'") 185 184 399 165 fill / 14.75cqw 14.67cqw 31.8cqw 13.16cqw stretch;}',
      '.wd-ecran{position:relative;z-index:1;box-sizing:border-box;min-height:34cqw;margin:-.8cqw -1cqw -1cqw;padding:4.4cqw 5.4cqw 4cqw;border-radius:4.5cqw;overflow:hidden;background:radial-gradient(ellipse at center,#06150a 0%,#020a05 70%,#000 100%);color:var(--wd-c);font-family:"Courier New",Courier,monospace;font-size:clamp(11px,2.7cqw,19px);line-height:1.45;text-transform:uppercase;letter-spacing:.04em;text-shadow:0 0 .35em var(--wd-glow);box-shadow:inset 0 0 3cqw rgba(0,0,0,.9),inset 0 0 .6cqw var(--wd-c2);}',
      /* Lignes de balayage, léger vacillement et reflet de la vitre. */
      '.wd-ecran::before{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(0,0,0,.28) 0 1px,transparent 1px 3px);z-index:2;}',
      '.wd-ecran::after{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 22% 12%,rgba(255,255,255,.10),transparent 38%);z-index:3;animation:wd-vacille 4s infinite;}',
      '@keyframes wd-vacille{0%,100%{opacity:1}50%{opacity:.82}52%{opacity:1}}',
      '.wd-ecran>*{position:relative;z-index:1;}',
      '.wd-ligne{display:flex;justify-content:space-between;gap:.8em;flex-wrap:wrap;}',
      '.wd-titre{margin-top:2.2cqw;font-weight:700;border-bottom:1px dashed var(--wd-c2);padding-bottom:.35em;margin-bottom:.5em;}',
      '.wd-titre .wd-etat{font-weight:400;}',
      '.wd-bloc{margin-top:.8em;}',
      '.wd-ligne b{font-weight:700;}',
      '.wd-rang{display:grid;grid-template-columns:5.2em 1fr 3.6em;align-items:center;gap:.6em;margin-top:.25em;}',
      '.wd-lib{color:var(--wd-c2);filter:brightness(1.6);}',
      '.wd-pct{text-align:right;}',
      /* Barre : cases pleines à l'ancienne (blocs de 0,8 em séparés d'un filet), qui s'allument de gauche à droite. */
      '.wd-barre{position:relative;height:1.05em;border:1px solid var(--wd-c2);padding:2px;background:#010503;}',
      '.wd-barre i{display:block;height:100%;background:var(--wd-c);box-shadow:0 0 .6em var(--wd-glow);-webkit-mask:repeating-linear-gradient(90deg,#000 0 .55em,transparent .55em .72em);mask:repeating-linear-gradient(90deg,#000 0 .55em,transparent .55em .72em);}',
      '.wd-invite{margin-top:1em;}',
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
      '.wd-rang{grid-template-columns:6.6em 1fr auto;}',
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
      '.wd-saisie{margin-top:1em;}',
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
      '.wd-chargement{margin:.6em 0 .9em;padding:.55em .7em;border:2px solid #ffb000;background:rgba(255,176,0,.08);color:#ffb000;text-shadow:0 0 .4em rgba(255,176,0,.55);}',
      '.wd-chargeur{position:relative;height:1.25em;margin:.4em 0;border:1px dashed #ffb000;background:#060301;overflow:hidden;}',
      '.wd-chargeur i{display:block;height:100%;background:repeating-linear-gradient(135deg,#ffb000 0 .5em,#6b4500 .5em 1em);background-size:1.42em 100%;animation:wd-defile 1s linear infinite;}',
      '@keyframes wd-defile{to{background-position:1.42em 0}}',
      '.wd-ch-corps{display:flex;align-items:center;gap:.9em;}',
      '.wd-sablier{margin:0;flex:0 0 auto;font:inherit;font-size:.85em;line-height:1.05;white-space:pre;color:#ffb000;text-shadow:0 0 .4em rgba(255,176,0,.55);}',
      '.wd-ch-texte{flex:1;min-width:0;}',
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
  var CLE_ALLUMAGE='soreal_idle_wandoos_allumage_v1';
  var allumage=null,timerTic=0,osEnAttente='';
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
  function barre_(frac){
    var p=Math.max(0,Math.min(1,nb_(frac)));
    return '<div class="wd-barre"><i style="width:'+(p*100).toFixed(1)+'%"></i></div>';
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
    e.enChargement=bootVu_(vue).fraction<0.9999;
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
    allumage={debut:Date.now(),duree:DUREE_ALLUMAGE_MS[e.os]||2500,os:e.os};
  }
  function allumageProgres_(){
    if(!allumage)return 1;
    return allumage.duree>0?Math.min(1,Math.max(0,(Date.now()-allumage.debut)/allumage.duree)):1;
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
  function ecranAllumage_(e){
    var p=allumageProgres_(),os=allumage?allumage.os:e.os;
    var msgs=MESSAGES_BOOT[os]||MESSAGES_BOOT['98'];
    var i=Math.min(msgs.length-1,Math.floor(p*msgs.length));
    return '<div class="wd-centre">'+logo_(os)+
      '<div class="wd-boot"><div class="wd-barre wd-barre-boot" id="wd-boot-barre"><i style="width:'+(p*100).toFixed(1)+'%"></i></div>'+
      '<div class="wd-ligne"><span id="wd-boot-msg">'+html_(msgs[i])+'</span><b id="wd-boot-pct">'+Math.floor(p*100)+'%</b></div></div>'+
    '</div>';
  }
  /* Sablier en caractères ASCII (ce genre d'écran n'affichait pas d'émojis) : le sable descend avec l'avancement du chargement. */
  var SABLIER_TRAMES=[
    [' _______ ',' \\:::::/ ','  \\:::/  ','   )-(   ','  /   \\  ',' /_____\\ '],
    [' _______ ',' \\  :  / ','  \\ : /  ','   )-(   ','  / : \\  ',' /__:__\\ '],
    [' _______ ',' \\     / ','  \\   /  ','   )-(   ','  /:::\\  ',' /:::::\\ ']
  ];
  function sablier_(fraction){
    var p=Math.max(0,Math.min(1,nb_(fraction)));
    var i=Math.min(SABLIER_TRAMES.length-1,Math.floor(p*SABLIER_TRAMES.length));
    return SABLIER_TRAMES[i].join('\n');
  }
  /* Le chargement de l'OS (vrai démarrage du wiki) : cadre ambre à rayures qui défilent, volontairement différent des barres de dump à remplir. */
  function panneauChargement_(e){
    var b=bootVu_(e.vue),pct=Math.floor(b.fraction*100);
    return '<div class="wd-chargement" role="status"><div class="wd-ch-corps">'+
      '<pre class="wd-sablier" id="wd-sablier" aria-hidden="true">'+sablier_(b.fraction)+'</pre>'+
      '<div class="wd-ch-texte">'+
        '<div class="wd-ligne"><span>CHARGEMENT DE L’OS</span><b id="wd-ch-pct">'+pct+' %</b></div>'+
        '<div class="wd-chargeur" id="wd-chargeur"><i id="wd-ch-fill" style="width:'+(b.fraction*100).toFixed(1)+'%"></i></div>'+
        '<div class="wd-ligne wd-petit"><span>Vitesse de Wandoos : <b id="wd-ch-vit">'+pct+' %</b> de son maximum</span><span>Encore <b id="wd-ch-reste">'+html_(dureeTexte_(b.restant))+'</b></span></div>'+
      '</div></div></div>';
  }
  function bloc_(titre,res,e,libreCle,vitesseCle,niveau,progression){
    var placee=nb_(e.al[res]),libre=nb_(e.vue[libreCle]),vit=nb_(e.vue[vitesseCle]);
    var prog=Math.max(0,Math.min(1,nb_(progression)));
    var vitTexte=vit>=50?'50 (MAXIMUM)':format_(vit);
    var suivant=vit>0&&vit<50?' · prochain niveau dans '+dureeTexte_(1/vit):'';
    return '<div class="wd-bloc">'+
      '<div class="wd-ligne"><span>'+titre+'</span><span>NIVEAU <b>'+html_(grand_(niveau))+'</b></span></div>'+
      '<div class="wd-ligne"><span class="wd-lib">PLACÉE</span><b>'+html_(grand_(placee))+'</b><span class="wd-lib">LIBRE</span><b>'+html_(grand_(libre))+'</b></div>'+
      '<div class="wd-rang"><span class="wd-lib">NIVEAU+1</span>'+barre_(prog)+'<span class="wd-pct">'+Math.floor(prog*100)+'%</span></div>'+
      '<div class="wd-ligne wd-petit"><span>VITESSE : <b>'+html_(vitTexte)+'</b> NIV/S'+html_(suivant)+'</span></div>'+
    '</div>';
  }
  function ecranBureau_(e){
    var v=e.vue;
    var bonus=nb_(v.bonusCombat);
    return '<div class="wd-ligne wd-titre"><span>'+html_(NOMS_OS[e.os])+'</span><span class="wd-etat">[*] EN MARCHE</span></div>'+
      (e.enChargement?panneauChargement_(e):'')+
      '<div class="wd-ligne"><span>BONUS ATTACK ET DEFENSE</span><b>×'+html_(format_(Math.max(1,bonus)))+'</b></div>'+
      '<div class="wd-ligne"><span>NIVEAU DE L’OS</span><b>'+html_(grand_(v.niveauOsTotal||0))+'</b><span class="wd-lib">VITESSE ×'+html_(grand_(v.multiplicateurOs||1))+'</span></div>'+
      bloc_('ÉNERGIE','energy',e,'energieLibre','vitesseEnergie',e.data.dumpEnergyLevel,e.data.dumpEnergyProgress)+
      (e.magieOk?bloc_('MAGIE','magic',e,'magieLibre','vitesseMagie',e.data.dumpMagicLevel,e.data.dumpMagicProgress):'')+
      '<div class="wd-ligne wd-saisie" role="group" aria-label="Quantité placée ou retirée à chaque appui sur + ou − : tape-la avec les chiffres du clavier (un nombre, ou une fraction comme 1/4)"><span class="wd-invite-c">C:\\&gt;</span><span id="wd-saisie" class="wd-frappe">'+html_(saisie_())+'</span><span class="wd-curseur" aria-hidden="true"></span></div>';
  }

  /* ---------- Clavier ---------- */
  function touche_(libelle,sous,onclick,classe,titre,desactive){
    return '<button type="button" class="wd-touche'+(classe?' '+classe:'')+'"'+(desactive?' disabled':'')+' title="'+html_(titre||'')+'" aria-label="'+html_(titre||sous||libelle)+'" onclick="'+onclick+'">'+libelle+(sous?'<small>'+sous+'</small>':'')+'</button>';
  }
  var API="window.__SOREAL_IDLE_WANDOOS_V1__";
  function groupe_(nom,res){
    var p=API+".place('"+res+"','";
    return '<div class="wd-groupe"><span class="wd-leg">'+nom+'</span><div class="wd-rangee">'+
      touche_('0','',p+"zero')",'',nom+' : tout retirer')+
      touche_('−','',p+"moins')",'',nom+' : retirer la quantité saisie')+
      touche_('+','',p+"plus')",'',nom+' : placer la quantité saisie')+
      touche_('MAX','',p+"tout')",'',nom+' : tout placer')+
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
  function pave_(){
    var ch=function(c){return touche_(c,'',API+".chiffre('"+c+"')",'wd-chiffre','Chiffre '+c);};
    return '<div class="wd-groupe wd-pave-groupe"><span class="wd-leg">Saisie</span><div class="wd-pave">'+
      ['1','2','3','4','5','6','7','8','9','0'].map(ch).join('')+
      touche_('/','',API+".chiffre('/')",'wd-chiffre','Barre de fraction (1/4 = un quart)')+
      '<button type="button" class="wd-touche wd-effacer" title="Effacer (maintenir appuyé pour effacer chiffre par chiffre)" aria-label="Effacer le dernier caractère ; maintenir appuyé pour effacer chiffre par chiffre">⌫<small>EFFACER</small></button>'+
    '</div></div>';
  }
  function clavier_(e,phase){
    var couleur='<div class="wd-groupe"><span class="wd-leg">Écran</span><button type="button" class="wd-touche wd-touche-couleur" title="Changer la couleur de l’écran" aria-label="Changer la couleur de l’écran : vert, bleu, orange, blanc" onclick="'+API+'.couleur()">COULEUR<small class="wd-nomcouleur">'+couleur_().toUpperCase()+'</small></button></div>';
    var demarrage=e.actif
      ?touche_('■ ÉTEINDRE','',API+'.eteindre()','wd-espace','Éteindre Wandoos')
      :touche_('▶ DÉMARRER','',API+'.demarrer()','wd-espace','Démarrer Wandoos');
    var haut='';
    if(phase==='bureau')haut=groupe_('Énergie','energy')+(e.magieOk?groupe_('Magie','magic'):'')+pave_();
    var os=groupeOs_(e);
    return '<div class="wd-clavier"><div class="wd-plaque">'+haut+
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
    if((phase==='allumage'||(phase==='bureau'&&e.enChargement))&&!timerTic&&typeof setInterval==='function')timerTic=setInterval(tic_,250);
    return '<div class="wd-poste" data-couleur="'+c+'" data-phase="'+phase+'"><div class="wd-crt"><div class="wd-ecran">'+ecran+'</div></div>'+clavier_(e,phase)+'</div>';
  }
  function page(j){
    style_();
    var H=H_();
    var e=etat_(j);
    if(!e)return '';
    var s=e.s;
    var titre=H&&H.entetePageIdleV28_?H.entetePageIdleV28_(html_((s.icon||'💻')+' '+(s.name||'Wandoos')),''):'';
    return titre+poste_(j);
  }
  function rafraichirPoste_(){
    var H=H_();
    var poste=document.querySelector('.wd-poste');
    if(!poste||!H||!H.getIdleEtat)return;
    var html=poste_(H.getIdleEtat());
    if(!html)return;
    poste.outerHTML=html;
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
    var sa=document.getElementById('wd-sablier');
    if(sa){var trame=sablier_(b.fraction);if(sa.textContent!==trame)sa.textContent=trame;}
    var a=document.getElementById('wd-ch-pct'),v=document.getElementById('wd-ch-vit'),r=document.getElementById('wd-ch-reste');
    if(a)a.textContent=pc+' %';
    if(v)v.textContent=pc+' %';
    if(r)r.textContent=dureeTexte_(b.restant);
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
  function placer(res,mode){
    var H=H_();
    if(!H||!H.getIdleEtat)return;
    var j=H.getIdleEtat(),e=etat_(j);
    if(!e||phaseDe_(e)!=='bureau'||(res!=='energy'&&res!=='magic'))return;
    if(res==='magic'&&!e.magieOk)return;
    var cleLibre=res==='energy'?'energieLibre':'magieLibre';
    var libre=Math.max(0,nb_(e.vue[cleLibre])),actuelle=Math.max(0,nb_(e.al[res]));
    var montant=analyser_(saisie_(),libre+actuelle);
    var cible=mode==='zero'?0:mode==='tout'?actuelle+libre:mode==='plus'?actuelle+Math.min(montant,libre):Math.max(0,actuelle-montant);
    cible=Math.max(0,Math.min(actuelle+libre,cible));
    if(cible===actuelle)return;
    /* Mise à jour immédiate de l'écran : deux appuis rapprochés doivent s'additionner sans attendre le serveur. */
    e.st.allocation=e.st.allocation||{};
    e.st.allocation[res]=cible;
    e.vue[cleLibre]=Math.max(0,libre-(cible-actuelle));
    rafraichirPoste_();
    meta_({action:'allocate',system:'wandoos',resource:res,value:cible});
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

  window.__SOREAL_IDLE_WANDOOS_V1__={page:page,couleur:changerCouleur_,couleurs:COULEURS,son:sonTouche_,construireTouche:construireTouche_,
    demarrer:demarrer,eteindre:eteindre,os:choisirOs,place:placer,chiffre:chiffre,effacer:effacer,debutEffacer:debutEffacer_,finEffacer:arreterEffacer_,analyser:analyser_,dureesAllumage:DUREE_ALLUMAGE_MS};
})();
