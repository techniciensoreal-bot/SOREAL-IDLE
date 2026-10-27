/*
 * SOREAL IDLE — écran de victoire « arcade » sur l'image du boss (Norman, 2026-10-22 : « j'aime bien l'animation de A… le son est trop aigu… cette animation quand on bat un boss pour la PREMIÈRE fois, plus ensuite (sauf en
 * Evil et Sadistic) ; quand on fait un NUKE, ça ne doit pas apparaître »).
 *
 * L'image du boss (celle de la borne) est découpée en gros pixels ; elle clignote, un éclair blanc, elle éclate en pixels de ses propres couleurs sur des rayons qui tournent, un « K.O. » claque puis « BOSS VAINCU »
 * s'écrit lettre par lettre. Tout est dessiné dans un canvas ajouté à la borne (data-morph-garder : un redessin de la page ne le retire pas, règle n°4). Durée : 3,3 s.
 *
 * Quand (Norman, 2026-10-22, 2e version : « je trouve l'animation tellement bien que je voudrais qu'elle soit jouée quand on tue un boss et que le combat dure au moins 5 secondes ») : à la victoire d'un combat de boss mené dans
 * la page qui a duré au moins 5 secondes (de « Fight » au dernier coup), quel que soit le boss ou la difficulté, à chaque fois. Jamais pour le NUKE (sa propre cascade, pas de combat). Un boss tué en moins de 5 s garde le bandeau habituel.
 * Aucun effet avec « réduire les animations ». Son : synthèse WebAudio grave et douce (aucune note aiguë, filtre passe-bas), au volume « Sons de l'interface ».
 *   window.__SOREAL_IDLE_VICTOIRE_ARCADE_V1__ = { jouer(hote, image, etat, dureeCombatMs) -> bool, doitJouer(etat, dureeCombatMs) -> bool, dessiner(ctx, t, px, LH), sons(ctx, t, sortie) }
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_VICTOIRE_ARCADE_V1__)return;

  var COMBAT_MIN_MS=5000;      /* le combat doit avoir duré au moins 5 s */
  var DUREE=3.3;               /* secondes */
  var LW=160;                  /* définition de l'écran : 160 gros pixels de large */
  var CX=32;                   /* le boss est découpé en 32 colonnes */

  /* ---------- police 5×7 dessinée à la main ---------- */
  var G={
    A:['.###.','#...#','#...#','#####','#...#','#...#','#...#'],
    B:['####.','#...#','#...#','####.','#...#','#...#','####.'],
    C:['.###.','#...#','#....','#....','#....','#...#','.###.'],
    I:['#####','..#..','..#..','..#..','..#..','..#..','#####'],
    K:['#...#','#..#.','#.#..','##...','#.#..','#..#.','#...#'],
    N:['#...#','##..#','##..#','#.#.#','#..##','#..##','#...#'],
    O:['.###.','#...#','#...#','#...#','#...#','#...#','.###.'],
    S:['.####','#....','#....','.###.','....#','....#','####.'],
    U:['#...#','#...#','#...#','#...#','#...#','#...#','.###.'],
    V:['#...#','#...#','#...#','#...#','#...#','.#.#.','..#..'],
    '.':['.....','.....','.....','.....','.....','.##..','.##..'],
    ' ':['.....','.....','.....','.....','.....','.....','.....']
  };
  function largeur(t,e){return t.length*6*e-e;}
  function texte(c,t,x,y,e,couleur,ombre){
    var x0=Math.round(x-largeur(t,e)/2),i,r,k,g;
    for(i=0;i<t.length;i++){g=G[t[i]];if(!g)continue;
      for(r=0;r<7;r++)for(k=0;k<5;k++){if(g[r][k]!=='#')continue;
        if(ombre){c.fillStyle=ombre;c.fillRect(x0+i*6*e+k*e+e,y+r*e+e,e,e);}}}
    for(i=0;i<t.length;i++){g=G[t[i]];if(!g)continue;
      for(r=0;r<7;r++)for(k=0;k<5;k++){if(g[r][k]!=='#')continue;
        c.fillStyle=typeof couleur==='function'?couleur(i,r):couleur;c.fillRect(x0+i*6*e+k*e,y+r*e,e,e);}}
  }
  function rnd(s){var x=Math.sin(s*127.1+311.7)*43758.5453;return x-Math.floor(x);}

  /* ---------- le boss en gros pixels : l'image affichée, rognée comme la page (object-fit: cover) ---------- */
  function pixelsDe(img,LH){
    var CY=Math.max(8,Math.round(CX*LH/LW)),px=[];
    try{
      /* source : l'image (naturalWidth) ou la copie mémorisée (canvas : width) */
      if(img&&!(img.naturalWidth>0)&&img.width>0){img.naturalWidth=img.width;img.naturalHeight=img.height;}
      if(!img||!(img.naturalWidth>0))return {px:px,CY:CY};
      var cv=document.createElement('canvas');cv.width=CX;cv.height=CY;
      var cx=cv.getContext('2d');cx.imageSmoothingEnabled=true;
      var ia=img.naturalWidth/img.naturalHeight,da=CX/CY,sx=0,sy=0,sw=img.naturalWidth,sh=img.naturalHeight;
      if(ia>da){sw=sh*da;sx=(img.naturalWidth-sw)/2;}else{sh=sw/da;sy=(img.naturalHeight-sh)/2;}
      cx.drawImage(img,sx,sy,sw,sh,0,0,CX,CY);
      var d=cx.getImageData(0,0,CX,CY).data;
      for(var y=0;y<CY;y++)for(var x=0;x<CX;x++){var i=(y*CX+x)*4;if(d[i+3]>70)px.push({x:x,y:y,c:'rgb('+d[i]+','+d[i+1]+','+d[i+2]+')'});}
    }catch(_e){px=[];}   /* image illisible (autre origine) : l'écran se joue sans les éclats, avec le texte */
    return {px:px,CY:CY};
  }

  /* ---------- l'image du boss TUÉ (Norman, 2026-10-22 : « c'est l'image du boss suivant qui a éclaté en pixels ») ----------
     Le moteur local est si rapide que le boss suivant est déjà affiché quand la page prédit la victoire : lire l'image dans la borne à ce moment donnait le suivant. Au début de chaque combat on met donc de côté une copie
     (réduite) de l'image du boss combattu, reconnue par son adresse (id=<numéro>) ; la victoire s'en sert, et si elle manque on joue sans éclats plutôt qu'avec la mauvaise image. */
  var memoire=null;
  function entier_(v){var n=Math.floor(Number(v));return isFinite(n)&&n>0?n:0;}
  function imagePourBoss(img,n){
    try{var u=new URL(img.currentSrc||img.src,location.href);return entier_(u.searchParams.get('id'))===n;}catch(_e){return false;}
  }
  function capturer(hote,n){
    n=entier_(n);
    if(!hote||!n)return false;
    if(memoire&&memoire.n===n)return true;
    var img=hote.querySelector&&hote.querySelector('img');
    if(!img||!(img.naturalWidth>0)||!imagePourBoss(img,n))return false;
    try{
      var k=Math.min(1,256/Math.max(img.naturalWidth,img.naturalHeight));
      var cv=document.createElement('canvas');cv.width=Math.max(1,Math.round(img.naturalWidth*k));cv.height=Math.max(1,Math.round(img.naturalHeight*k));
      var cx=cv.getContext('2d');cx.drawImage(img,0,0,cv.width,cv.height);cx.getImageData(0,0,1,1);   /* lève une erreur si l'image est d'une autre origine */
      memoire={n:n,source:cv};return true;
    }catch(_e){return false;}
  }
  function planifierCapture(n){
    [300,900,2000,4000].forEach(function(ms){setTimeout(function(){
      if(!(memoire&&memoire.n===entier_(n)))capturer(document.getElementById('sorealIdleBossImageHostV36'),n);
    },ms);});
  }
  function sourcePixels(image,n){
    n=entier_(n);
    if(memoire&&n&&memoire.n===n)return memoire.source;
    if(image&&(!n||imagePourBoss(image,n)))return image;   /* l'image affichée n'est utilisée que si c'est bien celle du boss tué */
    return null;
  }

  /* ---------- dessin : A « K.O. éclat », durée DUREE ---------- */
  function dessiner(c,t,px,LH){
    var e=LW/CX,oy=0;
    c.fillStyle='#10131f';c.fillRect(0,0,LW,LH);
    if(t<0.8){
      var tr=Math.sin(t*90)*2*(t/0.8),clig=Math.floor(t*14)%2===0;
      px.forEach(function(p){c.fillStyle=clig?'#fff':p.c;c.fillRect(Math.round(p.x*e+tr),Math.round(p.y*e+oy),e,e);});
      if(t>0.6){c.fillStyle='rgba(255,255,255,'+Math.min(1,(t-0.6)*5)+')';c.fillRect(0,0,LW,LH);}
      return;
    }
    var u=t-0.8,i;
    c.save();c.translate(LW/2,LH/2);c.rotate(u*0.6);
    for(i=0;i<14;i++){c.rotate(Math.PI*2/14);c.fillStyle=i%2?'rgba(255,210,74,.16)':'rgba(255,120,40,.12)';c.beginPath();c.moveTo(0,0);c.lineTo(190,-14);c.lineTo(190,14);c.fill();}
    c.restore();
    px.forEach(function(p,k){
      var vx=(rnd(k)-.5)*160,vy=-60-rnd(k+9)*90;
      var x=p.x*e+vx*u,y=p.y*e+vy*u+260*u*u;
      if(y<LH+6&&u<1.6){c.fillStyle=p.c;c.globalAlpha=Math.max(0,1-u/1.6);c.fillRect(Math.round(x),Math.round(y),e,e);c.globalAlpha=1;}
    });
    var s=u<0.18?1+(0.18-u)*5:(u<0.3?1+Math.sin((u-0.18)*40)*0.08:1);
    var e2=Math.max(2,Math.round(6*s)),dy=Math.round(Math.sin(Math.min(u,1)*30)*(u<0.5?2:0));
    texte(c,'K.O.',LW/2,Math.round(LH*0.16)+dy,e2,function(j,r){return r<3?'#fff2a8':(r<5?'#ffd24a':'#ff8a1f');},'#6a1f00');
    if(u>0.6){
      var n=Math.min(10,Math.floor((u-0.6)*14));
      texte(c,'BOSS'.slice(0,Math.min(4,n)),LW/2,Math.round(LH*0.5),3,'#ffffff','#1a2a6a');
      if(n>4)texte(c,'VAINCU'.slice(0,n-4),LW/2,Math.round(LH*0.5)+24,3,'#ffffff','#1a2a6a');
    }
  }

  /* ---------- sons : grave et doux (Norman : « trop aigu, ça casse les oreilles ») ----------
     Notes de G3 à C5 seulement, onde triangle + un peu de carré, filtre passe-bas à 1 800 Hz sur tout, bruit d'explosion sourd, aucune étincelle aiguë. */
  var ctxA=null;
  function volume_(){var r=window.__SOREAL_IDLE_AUDIO_VOLUME_V1__;return r&&typeof r.getInterface==='function'?Number(r.getInterface()):0.75;}
  function note(c,sortie,t,f,d,type,vol,vib){
    var o=c.createOscillator(),g=c.createGain();
    o.type=type||'triangle';o.frequency.setValueAtTime(f,t);
    if(vib){var l=c.createOscillator(),lg=c.createGain();l.frequency.value=5.5;lg.gain.value=f*0.01;l.connect(lg);lg.connect(o.frequency);l.start(t+d*0.4);l.stop(t+d+0.05);}
    g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(vol,t+0.015);
    g.gain.setValueAtTime(vol*0.8,t+Math.max(0.02,d*0.6));g.gain.exponentialRampToValueAtTime(0.0001,t+d);
    o.connect(g);g.connect(sortie);o.start(t);o.stop(t+d+0.03);
  }
  function bruit(c,sortie,t,d,vol,f0,f1){
    var n=Math.floor(c.sampleRate*d),b=c.createBuffer(1,n,c.sampleRate),x=b.getChannelData(0),i;
    for(i=0;i<n;i++)x[i]=(Math.random()*2-1)*Math.pow(1-i/n,1.5);
    var s=c.createBufferSource();s.buffer=b;
    var fl=c.createBiquadFilter();fl.type='lowpass';fl.frequency.setValueAtTime(f0,t);fl.frequency.exponentialRampToValueAtTime(Math.max(40,f1),t+d);
    var g=c.createGain();g.gain.value=vol;s.connect(fl);fl.connect(g);g.connect(sortie);s.start(t);
  }
  function sons(c,t,sortie){
    var G3=196,C4=261.6,E4=329.6,G4=392,C5=523.3,C2=65.4,C3=130.8;
    bruit(c,sortie,t,0.5,0.45,1400,60);note(c,sortie,t,100,0.5,'sawtooth',0.12);   /* boum sourd */
    note(c,sortie,t+0.55,700,0.12,'triangle',0.05);                              /* éclair, doux */
    bruit(c,sortie,t+0.8,0.28,0.4,1800,120);note(c,sortie,t+0.8,C2,0.55,'triangle',0.4);note(c,sortie,t+0.8,C3,0.4,'triangle',0.18);
    note(c,sortie,t+0.9,G3,0.12,'triangle',0.2);note(c,sortie,t+1.02,C4,0.12,'triangle',0.2);note(c,sortie,t+1.14,E4,0.12,'triangle',0.2);note(c,sortie,t+1.26,G4,0.14,'triangle',0.2);
    note(c,sortie,t+1.4,C5,1.1,'triangle',0.2,true);note(c,sortie,t+1.4,C5,1.1,'square',0.035);
    note(c,sortie,t+1.4,E4,1.1,'triangle',0.1);note(c,sortie,t+1.4,G4,1.1,'triangle',0.1);note(c,sortie,t+1.4,C3,1.1,'triangle',0.3);
    for(var i=0;i<10;i++)note(c,sortie,t+1.4+i*0.071,330+(i%3)*40,0.03,'triangle',0.035);   /* petits tics de machine à écrire, graves */
  }
  function jouerSon(){
    var v=volume_();
    if(!(v>0))return false;
    try{
      var C=window.AudioContext||window.webkitAudioContext;if(!C)return false;
      var L=window.__SOREAL_IDLE_LIMITEUR_V1__;
      ctxA=ctxA&&ctxA.state!=='closed'?ctxA:((L&&L.contexte&&L.contexte())||new C());
      if(ctxA.state==='suspended'&&ctxA.resume)ctxA.resume();
      var maitre=ctxA.createGain();maitre.gain.value=Math.min(1,v)*0.5;
      var passeBas=ctxA.createBiquadFilter();passeBas.type='lowpass';passeBas.frequency.value=1800;passeBas.Q.value=0.5;
      var comp=ctxA.createDynamicsCompressor();
      var ech=ctxA.createDelay(0.5),fb=ctxA.createGain(),mix=ctxA.createGain();ech.delayTime.value=0.13;fb.gain.value=0.25;mix.gain.value=0.18;
      maitre.connect(passeBas);passeBas.connect(comp);(L&&L.brancher(ctxA,comp))||comp.connect(ctxA.destination);
      passeBas.connect(ech);ech.connect(fb);fb.connect(ech);ech.connect(mix);mix.connect(comp);
      sons(ctxA,ctxA.currentTime+0.03,maitre);
      return true;
    }catch(_e){return false;}
  }

  /* ---------- quand jouer : combat d'au moins 5 s (de Fight au dernier coup), à chaque fois ---------- */
  function doitJouer(etat,dureeCombatMs){
    return Boolean(etat)&&Number(dureeCombatMs)>=COMBAT_MIN_MS;
  }

  /* ---------- mise en scène sur la borne ---------- */
  var styleOk=false;
  function style_(){
    if(styleOk||document.getElementById('soreal-idle-victoire-arcade-style'))return;
    styleOk=true;
    var s=document.createElement('style');s.id='soreal-idle-victoire-arcade-style';
    s.textContent='.soreal-idle-boss-transition-v61.vic-arcade{position:absolute;inset:0;z-index:7;display:block;pointer-events:none;overflow:hidden;border-radius:14px;background:#10131f;font-size:0;opacity:1;transition:opacity .25s}'+
      '.soreal-idle-boss-transition-v61.vic-arcade canvas{position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated;image-rendering:crisp-edges}'+
      '.soreal-idle-boss-transition-v61.vic-arcade::after{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(0,0,0,.2) 0 1px,transparent 1px 3px),radial-gradient(ellipse at center,transparent 60%,rgba(0,0,0,.5) 100%)}'+
      '.soreal-idle-boss-transition-v61.vic-cache{display:none}';
    (document.head||document.documentElement).appendChild(s);
  }
  function jouer(hote,image,etat,dureeCombatMs,bossNum){
    try{
      if(!hote||!doitJouer(etat,dureeCombatMs))return false;
      if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return false;
      style_();
      var idMort=0;
      try{var appM=window.__SOREAL_IDLE_APPARITION_BOSS_V1__;idMort=appM&&appM.idDe&&image?appM.idDe(image):0;}catch(_e){idMort=0;}   /* boss TUÉ : l'apparition ne se joue jamais sur lui (Norman, 2026-10-24) */
      /* L'écran de victoire a la main jusqu'à sa fin : une apparition de boss déjà lancée est annulée, et ses mutations d'image sont ignorées ; à la fin, la victoire joue l'apparition du boss suivant (modules/apparition-boss-v1.js). */
      try{var A0=window.__SOREAL_IDLE_APPARITION_BOSS_V1__;if(A0&&A0.annuler)A0.annuler();}catch(_e){}
      window.__SOREAL_IDLE_VICTOIRE_EN_COURS__=true;
      var anc=hote.querySelector('.vic-arcade');if(anc)anc.remove();
      var r=hote.getBoundingClientRect(),LH=Math.max(60,Math.round(LW*(r.height||LW)/(r.width||LW)));
      var pk=pixelsDe(sourcePixels(image,bossNum),LH);
      var calque=document.createElement('div');
      calque.className='soreal-idle-boss-transition-v61 vic-arcade';
      calque.setAttribute('data-morph-garder','');calque.setAttribute('aria-hidden','true');
      var cv=document.createElement('canvas');cv.width=LW;cv.height=LH;calque.appendChild(cv);
      hote.appendChild(calque);
      var c=cv.getContext('2d');c.imageSmoothingEnabled=false;
      var t0=performance.now(),fini=false;
      function image_(now){
        if(fini)return;
        var t=(now-t0)/1000;
        if(!calque.isConnected){fini=true;window.__SOREAL_IDLE_VICTOIRE_EN_COURS__=false;return;}
        if(t>=DUREE){
          fini=true;window.__SOREAL_IDLE_VICTOIRE_EN_COURS__=false;
          var passe=false;
          try{var app=window.__SOREAL_IDLE_APPARITION_BOSS_V1__;passe=Boolean(app&&(app.jouerApres?app.jouerApres(hote,idMort,true):app.jouer(hote)));}catch(_e){}
          try{var im=hote.querySelector('img');if(im&&!passe)im.classList.remove('soreal-idle-boss-death-v61');}catch(_e){}   /* jamais d'image invisible après la victoire (classe de mort restée sur le boss suivant) */
          if(passe){if(calque.parentNode)calque.parentNode.removeChild(calque);}   /* le calque de l'apparition est déjà posé par-dessus : aucune image du boss suivant n'apparaît entre les deux */
          else{
            calque.style.opacity='0';
            setTimeout(function(){if(calque.parentNode)calque.parentNode.removeChild(calque);},300);
          }
          return;
        }
        dessiner(c,t,pk.px,LH);
        requestAnimationFrame(image_);
      }
      requestAnimationFrame(image_);
      jouerSon();
      return true;
    }catch(_e){return false;}
  }

  window.__SOREAL_IDLE_VICTOIRE_ARCADE_V1__={jouer:jouer,doitJouer:doitJouer,dessiner:dessiner,sons:sons,duree:DUREE,combatMinMs:COMBAT_MIN_MS,capturer:capturer,planifierCapture:planifierCapture};
})();
