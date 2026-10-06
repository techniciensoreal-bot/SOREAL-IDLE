/*
 * SOREAL IDLE — page Wandoos « ordinateur rétro » (Norman, 2026-10-06 : « un truc très rétro, très commodore, atari, amiga : les barres d'énergie dans
 * l'écran de idle/banners/wandoos.webp, écritures vertes comme sur les vieux PC, un bouton pour passer en vert, bleu, orange, blanc, des touches de clavier
 * en bas pour le + et le −, et le son d'un clavier quand on les presse »).
 *
 * Rien ne change côté jeu : les touches appellent les mêmes fonctions que les anciens boutons (__ajusterAllocationMetaIdleV130__, __toggleSystemeMetaIdleV130__).
 * Les données affichées viennent de j.systemes (niveau des Dumps, progression vers le niveau suivant, allocation en %).
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
      '.wd-crt{box-sizing:border-box;width:100%;border:solid transparent;border-width:14.75cqw 14.67cqw 31.8cqw 13.16cqw;border-image:url("'+BANNIERE+'") 185 184 399 165 fill / 14.75cqw 14.67cqw 31.8cqw 13.16cqw stretch;}',
      '.wd-ecran{position:relative;box-sizing:border-box;min-height:34cqw;margin:-.8cqw -1cqw -1cqw;padding:2.6cqw 3.2cqw;border-radius:4.5cqw;overflow:hidden;background:radial-gradient(ellipse at center,#06150a 0%,#020a05 70%,#000 100%);color:var(--wd-c);font-family:"Courier New",Courier,monospace;font-size:clamp(11px,2.7cqw,19px);line-height:1.45;text-transform:uppercase;letter-spacing:.04em;text-shadow:0 0 .35em var(--wd-glow);box-shadow:inset 0 0 3cqw rgba(0,0,0,.9),inset 0 0 .6cqw var(--wd-c2);}',
      /* Lignes de balayage, léger vacillement et reflet de la vitre. */
      '.wd-ecran::before{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(0,0,0,.28) 0 1px,transparent 1px 3px);z-index:2;}',
      '.wd-ecran::after{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 22% 12%,rgba(255,255,255,.10),transparent 38%);z-index:3;animation:wd-vacille 4s infinite;}',
      '@keyframes wd-vacille{0%,100%{opacity:1}50%{opacity:.82}52%{opacity:1}}',
      '.wd-ecran>*{position:relative;z-index:1;}',
      '.wd-ligne{display:flex;justify-content:space-between;gap:.8em;flex-wrap:wrap;}',
      '.wd-titre{font-weight:700;border-bottom:1px dashed var(--wd-c2);padding-bottom:.35em;margin-bottom:.5em;}',
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
      '@media (prefers-reduced-motion:reduce){.wd-ecran::after,.wd-curseur{animation:none;}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function barre_(frac){
    var p=Math.max(0,Math.min(1,nb_(frac)));
    return '<div class="wd-barre"><i style="width:'+(p*100).toFixed(1)+'%"></i></div>';
  }
  function bloc_(titre,niveau,progression,allocation){
    var pct=Math.round(Math.max(0,Math.min(100,nb_(allocation))));
    var prog=Math.max(0,Math.min(1,nb_(progression)));
    return '<div class="wd-bloc">'+
      '<div class="wd-ligne"><span>'+titre+'</span><span>NIV <b>'+html_(grand_(niveau))+'</b></span></div>'+
      '<div class="wd-rang"><span class="wd-lib">DUMP</span>'+barre_(prog)+'<span class="wd-pct">'+Math.floor(prog*100)+'%</span></div>'+
      '<div class="wd-rang"><span class="wd-lib">ALLOC</span>'+barre_(pct/100)+'<span class="wd-pct">'+pct+'%</span></div>'+
    '</div>';
  }
  function touche_(libelle,sous,onclick,classe,titre){
    return '<button type="button" class="wd-touche'+(classe?' '+classe:'')+'" title="'+html_(titre||'')+'" aria-label="'+html_(titre||sous||libelle)+'" onclick="'+onclick+'">'+libelle+(sous?'<small>'+html_(sous)+'</small>':'')+'</button>';
  }
  function alloc_(ressource,delta){return 'window.__ajusterAllocationMetaIdleV130__(\'wandoos\',\''+ressource+'\','+delta+')';}
  function groupe_(nom,ressource){
    return '<div class="wd-groupe"><span class="wd-leg">'+nom+'</span><div class="wd-rangee">'+
      touche_('0','',alloc_(ressource,-100),'',nom+' : tout retirer')+
      touche_('−','10 %',alloc_(ressource,-10),'',nom+' : −10 %')+
      touche_('+','10 %',alloc_(ressource,10),'',nom+' : +10 %')+
      touche_('MAX','',alloc_(ressource,100),'',nom+' : tout placer')+
    '</div></div>';
  }

  function page(j){
    style_();
    var H=H_();
    var meta=window.__SOREAL_IDLE_META_V130__;
    var s=meta&&meta.systemeMetaParIdIdleV130_?meta.systemeMetaParIdIdleV130_(j,'wandoos'):null;
    if(!s||!s.unlock||!s.unlock.unlocked)return '';
    var st=s.state||{};
    var data=st.data||{};
    var al=st.allocation||{};
    var c=couleur_();
    var actif=Boolean(st.active);
    var titre=H&&H.entetePageIdleV28_?H.entetePageIdleV28_(html_((s.icon||'💻')+' '+(s.name||'Wandoos')),''):'';
    var os=data.os!=null&&String(data.os)!==''?' '+html_(String(data.os)):'';
    var ecran=
      '<div class="wd-ligne wd-titre"><span>'+html_(s.name||'Wandoos')+os+'</span><span class="wd-etat">'+(actif?'● EN MARCHE':'○ ARRÊTÉ')+'</span></div>'+
      '<div class="wd-ligne"><span>C:\\&gt; NIVEAU TOTAL</span><b>'+html_(grand_(st.level||0))+'</b></div>'+
      bloc_('ÉNERGIE',data.dumpEnergyLevel,data.dumpEnergyProgress,al.energy)+
      bloc_('MAGIE',data.dumpMagicLevel,data.dumpMagicProgress,al.magic)+
      '<div class="wd-ligne wd-invite"><span>C:\\&gt; <span class="wd-curseur"></span></span></div>';
    var clavier=
      '<div class="wd-clavier"><div class="wd-plaque">'+
        groupe_('Énergie','energy')+groupe_('Magie','magic')+
        '<div class="wd-bas">'+
          '<div class="wd-groupe"><span class="wd-leg">Écran</span>'+
            '<button type="button" class="wd-touche wd-touche-couleur" title="Changer la couleur de l’écran" aria-label="Changer la couleur de l’écran : vert, bleu, orange, blanc" onclick="window.__SOREAL_IDLE_WANDOOS_V1__.couleur()">COLOR<small class="wd-nomcouleur">'+c.toUpperCase()+'</small></button>'+
          '</div>'+
          '<div class="wd-groupe"><span class="wd-leg">Système</span>'+
            touche_(actif?'■ DÉSACTIVER':'▶ ACTIVER','','window.__toggleSystemeMetaIdleV130__(\'wandoos\')','wd-espace',actif?'Désactiver':'Activer')+
          '</div>'+
        '</div>'+
      '</div></div>';
    return titre+'<div class="wd-poste" data-couleur="'+c+'"><div class="wd-crt"><div class="wd-ecran">'+ecran+'</div></div>'+clavier+'</div>';
  }

  window.__SOREAL_IDLE_WANDOOS_V1__={page:page,couleur:changerCouleur_,couleurs:COULEURS,son:sonTouche_,construireTouche:construireTouche_};
})();
