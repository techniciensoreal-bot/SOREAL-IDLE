/*
 * SOREAL IDLE — les dix apparitions de boss (Norman, 2026-10-22 : « différents effets pour les apparitions des boss, une dizaine qui se jouerait du premier au dernier pour éviter la redondance ; je les aime tous mais il faut un son qui
 * colle à chaque fois ; on ne doit pas voir l'image du boss suivant avant la fin de l'animation, il doit apparaître avec une animation »).
 *
 * Chaque boss entre en scène par l'effet n° ((numéro du boss − 1) mod 10) + 1 : le boss 1 a l'effet 1, le boss 10 l'effet 10, le boss 11 reprend l'effet 1… (l'ordre suit les boss, jamais le hasard : deux boss qui se suivent n'ont
 * jamais le même effet). 1 Assemblage · 2 Balayage · 3 Glitch · 4 Mosaïque · 5 Stores · 6 Horizon · 7 Éclair · 8 Chute · 9 Télé · 10 Iris. Chaque effet a son propre son, synthétisé (grave et doux, filtre passe-bas, au volume « Sons de
 * l'interface ») : cascade de tics qui convergent, faisceau de scanner, crépitements numériques, notes par paliers, cliquets de lames, grondement qui approche, tonnerre, sifflement et chocs, allumage de tube cathodique, glissando de dessin animé.
 *
 * Un calque opaque est posé sur l'image du boss (data-morph-garder, règle n°4) AVANT que le nouveau boss soit peint : l'observateur de mutations s'exécute avant l'affichage, l'image réelle n'est donc jamais visible avant la fin de l'effet. Après
 * l'écran de victoire, la victoire passe la main à jouer() dans la même tâche (aucune image du boss suivant n'apparaît entre les deux). Aucun effet avec « réduire les animations ».
 *   window.__SOREAL_IDLE_APPARITION_BOSS_V1__ = { jouer(hote) -> bool, indexPour(n), noms, durees, scene(i, ctx, t, E), sons(i, ctx, t, sortie), surveiller() }
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_APPARITION_BOSS_V1__)return;

  var L=160;
  var NOMS=['Assemblage','Balayage','Glitch','Mosaïque','Stores','Horizon','Éclair','Chute','Télé','Iris'];
  var DUREES=[1.7,1.5,1.5,1.5,1.5,1.4,1.8,1.6,1.6,1.5];
  var HOTE_ID='sorealIdleBossImageHostV36';

  function rnd(s){var x=Math.sin(s*127.1+311.7)*43758.5453;return x-Math.floor(x);}
  function cl(x,a,b){return x<a?a:x>b?b:x;}
  function ease(x){x=cl(x,0,1);return 1-Math.pow(1-x,3);}
  function easeBack(x){x=cl(x,0,1);var c1=1.70158,c3=c1+1;return 1+c3*Math.pow(x-1,3)+c1*Math.pow(x-1,2);}
  function indexPour(n){n=Math.floor(Number(n))||1;return ((n-1)%10+10)%10;}
  function neuf(w,h){var c=document.createElement('canvas');c.width=w;c.height=h;return c;}

  /* ---------- l'image du boss (copie « cover » dans un carré) et ses variantes ---------- */
  function preparer(img,i){
    var E={};
    E.SRC=neuf(L,L);var x=E.SRC.getContext('2d');x.imageSmoothingEnabled=true;
    var iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height,sx=0,sy=0,sw=iw,sh=ih;
    if(iw>ih){sw=ih;sx=(iw-sw)/2;}else{sh=iw;sy=(ih-sh)/2;}
    x.drawImage(img,sx,sy,sw,sh,0,0,L,L);
    if(i===2){
      var d=x.getImageData(0,0,L,L);
      var canal=function(m){var c=neuf(L,L),cx=c.getContext('2d'),o=cx.createImageData(L,L),k;for(k=0;k<d.data.length;k+=4){o.data[k]=m===0?d.data[k]:0;o.data[k+1]=m===1?d.data[k+1]:0;o.data[k+2]=m===2?d.data[k+2]:0;o.data[k+3]=255;}cx.putImageData(o,0,0);return c;};
      E.SR=canal(0);E.SG=canal(1);E.SB=canal(2);
    }
    if(i===6){
      E.SIL=neuf(L,L);var sc=E.SIL.getContext('2d');sc.fillStyle='#0c0c18';sc.fillRect(0,0,L,L);
      sc.globalCompositeOperation='destination-in';sc.drawImage(E.SRC,0,0);
    }
    if(i===0){E.TMP=neuf(32,32);var t=E.TMP.getContext('2d');t.imageSmoothingEnabled=true;t.drawImage(E.SRC,0,0,32,32);}
    return E;
  }
  function fond(c){c.fillStyle='#0b0e1a';c.fillRect(0,0,L,L);}
  function pixelise(c,E,niveau){
    var p=neuf(niveau,niveau),pc=p.getContext('2d');pc.imageSmoothingEnabled=true;pc.drawImage(E.SRC,0,0,niveau,niveau);
    c.imageSmoothingEnabled=false;c.drawImage(p,0,0,L,L);
  }

  /* ---------- les dix effets : t en secondes ; chacun finit sur l'image entière ---------- */
  var SCENES=[
    /* 0 Assemblage */ function(c,t,E){
      fond(c);var D=E.TMP.getContext('2d').getImageData(0,0,32,32).data,e=L/32;
      for(var i=0;i<1024;i++){if(D[i*4+3]<50)continue;
        var tx=(i%32)*e,ty=Math.floor(i/32)*e,a=rnd(i)*6.283,r=120+rnd(i+7)*120,dl=rnd(i+3)*0.55,u=ease((t-dl)/0.8);
        c.fillStyle='rgb('+D[i*4]+','+D[i*4+1]+','+D[i*4+2]+')';
        c.fillRect(Math.round(tx+Math.cos(a)*r*(1-u)),Math.round(ty+Math.sin(a)*r*(1-u)),Math.ceil(e),Math.ceil(e));}
      if(t>1.2){c.globalAlpha=cl((t-1.2)/0.4,0,1);c.drawImage(E.SRC,0,0);c.globalAlpha=1;}},
    /* 1 Balayage */ function(c,t,E){
      fond(c);var y=Math.round(cl(t/1.2,0,1)*L);
      if(y>0)c.drawImage(E.SRC,0,0,L,y,0,0,L,y);
      if(t<1.2){c.fillStyle='#7ff5ff';c.fillRect(0,y,L,2);c.fillStyle='rgba(127,245,255,.25)';c.fillRect(0,y+2,L,10);}},
    /* 2 Glitch */ function(c,t,E){
      fond(c);if(t<0.12)return;var amp=Math.max(0,1-t/1.2),n=16,h=L/n,pas=Math.floor(t*18);
      c.globalCompositeOperation='lighter';
      [E.SR,E.SG,E.SB].forEach(function(S,k){var sp=(k-1)*amp*7;
        for(var i=0;i<n;i++){var dx=(rnd(i*3+pas)-.5)*amp*70+sp;c.drawImage(S,0,i*h,L,h,Math.round(dx),i*h,L,h);}});
      c.globalCompositeOperation='source-over';
      if(amp>0.2&&rnd(pas)>0.6){c.fillStyle='rgba(255,255,255,.18)';c.fillRect(0,Math.floor(rnd(pas+5)*L),L,3);}
      if(t>1.25){c.drawImage(E.SRC,0,0);}},
    /* 3 Mosaïque */ function(c,t,E){
      fond(c);var N=[6,10,16,28,48,80],i=Math.floor(t/1.2*N.length);
      if(i>=N.length){c.drawImage(E.SRC,0,0);return;}pixelise(c,E,N[i]);},
    /* 4 Stores */ function(c,t,E){
      fond(c);var n=10,w=L/n;
      for(var i=0;i<n;i++){var u=ease((t-i*0.05)/0.6),rw=w*u;if(rw<=0)continue;var x=i*w+(w-rw)/2;c.drawImage(E.SRC,x,0,rw,L,x,0,rw,L);}
      if(t>1.15)c.drawImage(E.SRC,0,0);},
    /* 5 Horizon */ function(c,t,E){
      fond(c);var u=easeBack(t/1.05),s=Math.max(0.04,u),sz=Math.round(L*s),sh=t<1.05?Math.round((rnd(Math.floor(t*40))-.5)*(1-t/1.05)*8):0;
      c.imageSmoothingEnabled=false;c.drawImage(E.SRC,Math.round((L-sz)/2)+sh,Math.round((L-sz)/2),sz,sz);},
    /* 6 Éclair */ function(c,t,E){
      fond(c);
      if(t<0.3)return;
      if(t<0.42){c.fillStyle='#fff';c.fillRect(0,0,L,L);return;}
      if(t<0.5||(t>=0.62&&t<0.68)){c.fillStyle='#d8e8ff';c.fillRect(0,0,L,L);c.drawImage(E.SIL,0,0);return;}
      if(t<1.0){c.globalAlpha=0.25+0.25*Math.sin(t*60);c.drawImage(E.SIL,0,0);c.globalAlpha=1;}
      var u=cl((t-0.9)/0.7,0,1);if(u>0){c.globalAlpha=u*(Math.floor(t*30)%2?1:0.7);c.drawImage(E.SRC,0,0);c.globalAlpha=1;}
      if(t>1.65)c.drawImage(E.SRC,0,0);},
    /* 7 Chute */ function(c,t,E){
      fond(c);var tI=0.5,y,sh=0;
      if(t<tI)y=-L+L*(t/tI)*(t/tI);
      else if(t<tI+0.28){var u=(t-tI)/0.28;y=-Math.sin(u*Math.PI)*L*0.2;}
      else if(t<tI+0.5){var v=(t-tI-0.28)/0.22;y=-Math.sin(v*Math.PI)*L*0.08;}
      else y=0;
      if(t>=tI&&t<tI+0.25)sh=Math.round((rnd(Math.floor(t*60))-.5)*8*(1-(t-tI)/0.25));
      c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.ellipse(L/2,L-6,L*0.38*(1+y/L*0.5),6,0,0,6.283);c.fill();
      c.drawImage(E.SRC,sh,Math.round(y));
      if(t>=tI&&t<tI+0.7){var d=(t-tI)/0.7;for(var i=0;i<16;i++){var dir=i%2?1:-1,px=L/2+dir*(20+rnd(i)*50)*d*2,py=L-8-Math.sin(d*3.1416)*(12+rnd(i+4)*22);c.fillStyle='rgba(200,190,170,'+(1-d)+')';c.fillRect(Math.round(px),Math.round(py),4,4);}}},
    /* 8 Télé */ function(c,t,E){
      fond(c);
      if(t<0.25){var w=ease(t/0.25)*L;c.fillStyle='#fff';c.fillRect((L-w)/2,L/2-1,w,2);return;}
      if(t<0.6){var h=ease((t-0.25)/0.35)*L;c.save();c.beginPath();c.rect(0,(L-h)/2,L,h);c.clip();
        for(var y=0;y<L;y+=3)for(var x=0;x<L;x+=3){var g=Math.floor(rnd(x*7+y*13+Math.floor(t*50))*255);c.fillStyle='rgb('+g+','+g+','+g+')';c.fillRect(x,y,3,3);}c.restore();return;}
      c.drawImage(E.SRC,0,0);var u=1-cl((t-0.6)/0.8,0,1);
      if(u>0){c.globalAlpha=u*0.8;for(var y2=0;y2<L;y2+=3)for(var x2=0;x2<L;x2+=3){if(rnd(x2*5+y2*11+Math.floor(t*50))>0.5){c.fillStyle=rnd(x2+y2*3)>.5?'#fff':'#000';c.fillRect(x2,y2,3,3);}}c.globalAlpha=1;}},
    /* 9 Iris */ function(c,t,E){
      fond(c);var r=ease(t/1.2)*L*0.78,b=4;
      for(var y=0;y<L;y+=b){var dy=y+b/2-L/2,hw=r*r-dy*dy;if(hw<=0)continue;var w=Math.round(Math.sqrt(hw)),x=Math.round(L/2-w);c.drawImage(E.SRC,x,y,w*2,b,x,y,w*2,b);}
      if(t<1.2){c.strokeStyle='#ffd24a';c.lineWidth=3;c.beginPath();c.arc(L/2,L/2,r,0,6.283);c.stroke();}
      if(t>1.25)c.drawImage(E.SRC,0,0);}
  ];
  function scene(i,c,t,E){return SCENES[i](c,t,E);}

  /* ---------- sons : un par effet, grave et doux (aucune fréquence au-dessus de ~900 Hz) ---------- */
  var ctxA=null;
  function volume_(){var r=window.__SOREAL_IDLE_AUDIO_VOLUME_V1__;return r&&typeof r.getInterface==='function'?Number(r.getInterface()):0.75;}
  function bruit(c,out,t,d,vol,type,f0,f1,q){
    var n=Math.max(1,Math.floor(c.sampleRate*d)),b=c.createBuffer(1,n,c.sampleRate),x=b.getChannelData(0),i;
    for(i=0;i<n;i++)x[i]=(Math.random()*2-1)*Math.pow(1-i/n,1.2);
    var s=c.createBufferSource();s.buffer=b;
    var fl=c.createBiquadFilter();fl.type=type||'lowpass';fl.frequency.setValueAtTime(f0,t);if(f1&&f1!==f0)fl.frequency.exponentialRampToValueAtTime(Math.max(40,f1),t+d);fl.Q.value=q||0.8;
    /* attaque de 3 ms : le bruit démarrait à pleine amplitude, d'où un « clic » à chaque rafale */
    var g=c.createGain(); g.gain.value=0.0001;g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(vol,t+Math.min(0.003,d/4));s.connect(fl);fl.connect(g);g.connect(out);s.start(t);
  }
  function ton(c,out,t,f0,f1,d,vol,type){
    var o=c.createOscillator(),g=c.createGain();o.type=type||'triangle';o.frequency.setValueAtTime(f0,t);if(f1&&f1!==f0)o.frequency.exponentialRampToValueAtTime(f1,t+d);
    g.gain.value=0.0001;g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(vol,t+Math.min(0.02,d/3));g.gain.exponentialRampToValueAtTime(0.0001,t+d);
    o.connect(g);g.connect(out);o.start(t);o.stop(t+d+0.02);
  }
  function choc(c,out,t,vol){ton(c,out,t,110,45,0.3,vol,'sine');bruit(c,out,t,0.12,vol*0.5,'lowpass',900,150,0.6);}
  var SONS=[
    /* 0 Assemblage : 26 tics qui s'accélèrent en montant, puis une masse qui se pose */
    function(c,o,t){for(var i=0;i<26;i++){var u=i/26;ton(c,o,t+0.08+Math.pow(u,0.8)*1.1,220+u*380,null,0.035,0.07,'triangle');}ton(c,o,t+1.2,196,392,0.35,0.12);choc(c,o,t+1.25,0.35);},
    /* 1 Balayage : faisceau de scanner qui descend, petits bips, « ding » grave de fin */
    function(c,o,t){ton(c,o,t,280,640,1.2,0.07,'sine');for(var i=0;i<6;i++)ton(c,o,t+0.1+i*0.19,420,null,0.05,0.045,'triangle');ton(c,o,t+1.2,330,null,0.3,0.12,'triangle');},
    /* 2 Glitch : rafales de crépitements numériques qui se raréfient, puis une note nette */
    function(c,o,t){for(var i=0;i<20;i++){var tt=t+0.12+i*0.055+rnd(i)*0.03;if(tt>t+1.2)break;bruit(c,o,tt,0.03,0.22,'bandpass',500+rnd(i+4)*700,300,3);ton(c,o,tt,150+rnd(i+9)*260,null,0.03,0.06,'square');}ton(c,o,t+1.25,220,null,0.3,0.14,'triangle');},
    /* 3 Mosaïque : six notes par paliers, une par niveau d'affinage */
    function(c,o,t){[262,294,349,440,523,659].forEach(function(f,k){ton(c,o,t+k*0.2,f,null,0.18,0.1,'triangle');});},
    /* 4 Stores : dix cliquets de lames, glissement sourd, claquement final */
    function(c,o,t){for(var i=0;i<10;i++){bruit(c,o,t+i*0.05,0.045,0.28,'bandpass',650+i*30,400,3);ton(c,o,t+i*0.05,160,90,0.05,0.09,'sine');}bruit(c,o,t+0.1,0.6,0.07,'bandpass',600,900,1);choc(c,o,t+0.62,0.25);},
    /* 5 Horizon : grondement qui s'approche, puis le choc de l'arrivée */
    function(c,o,t){bruit(c,o,t,1.1,0.2,'lowpass',90,700,0.7);ton(c,o,t,55,110,1.1,0.07,'sine');choc(c,o,t+1.0,0.45);},
    /* 6 Éclair : craquement, grondement de tonnerre, second craquement, bourdonnement électrique */
    function(c,o,t){bruit(c,o,t+0.3,0.1,0.5,'bandpass',900,300,1);bruit(c,o,t+0.34,1.3,0.22,'lowpass',500,70,0.7);bruit(c,o,t+0.62,0.07,0.3,'bandpass',800,300,1);ton(c,o,t+0.5,120,null,0.7,0.04,'sawtooth');ton(c,o,t+1.3,196,262,0.4,0.1);},
    /* 7 Chute : sifflement qui tombe, trois chocs de plus en plus faibles, poussière */
    function(c,o,t){ton(c,o,t,780,200,0.5,0.06,'sine');choc(c,o,t+0.5,0.6);choc(c,o,t+0.78,0.3);choc(c,o,t+1.0,0.15);bruit(c,o,t+0.5,0.6,0.08,'bandpass',500,250,0.8);},
    /* 8 Télé : « thwump » d'allumage, neige qui crépite, plainte douce qui s'éteint */
    function(c,o,t){choc(c,o,t,0.4);bruit(c,o,t+0.25,0.36,0.2,'bandpass',900,700,0.5);ton(c,o,t+0.6,600,520,0.9,0.03,'sine');ton(c,o,t+0.6,60,null,1.0,0.05,'sine');},
    /* 9 Iris : glissando de dessin animé qui monte, petit « pop » grave à l'ouverture */
    function(c,o,t){ton(c,o,t,200,720,1.15,0.1,'triangle');ton(c,o,t+1.18,330,null,0.25,0.12,'triangle');choc(c,o,t+1.2,0.2);}
  ];
  function sons(i,c,t,out){return SONS[i](c,out,t);}
  function jouerSon(i){
    var v=volume_();
    if(!(v>0))return false;
    try{
      var C=window.AudioContext||window.webkitAudioContext;if(!C)return false;
      var L=window.__SOREAL_IDLE_LIMITEUR_V1__;
      ctxA=ctxA&&ctxA.state!=='closed'?ctxA:((L&&L.contexte&&L.contexte())||new C());
      if(ctxA.state==='suspended'&&ctxA.resume)ctxA.resume();
      var maitre=ctxA.createGain();maitre.gain.value=Math.min(1,v)*0.5;
      var pb=ctxA.createBiquadFilter();pb.type='lowpass';pb.frequency.value=1800;pb.Q.value=0.5;
      var comp=ctxA.createDynamicsCompressor();
      maitre.connect(pb);pb.connect(comp);(L&&L.brancher(ctxA,comp))||comp.connect(ctxA.destination);
      sons(i,ctxA,ctxA.currentTime+0.03,maitre);
      return true;
    }catch(_e){return false;}
  }

  /* ---------- mise en scène : un calque opaque sur l'image du boss, posé avant qu'elle soit peinte ---------- */
  var styleOk=false,enCours=false,dernierId=null;
  function style_(){
    if(styleOk||document.getElementById('soreal-idle-apparition-style'))return;
    styleOk=true;
    var s=document.createElement('style');s.id='soreal-idle-apparition-style';
    s.textContent='.soreal-idle-boss-transition-v61.app-boss{position:absolute;inset:0;z-index:8;display:block;pointer-events:none;overflow:hidden;border-radius:14px;background:#0b0e1a;font-size:0;opacity:1;transition:opacity .12s}'+
      '.soreal-idle-boss-transition-v61.app-boss canvas{position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated;image-rendering:crisp-edges}'+
      '.soreal-idle-boss-transition-v61.app-boss::after{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(0,0,0,.16) 0 1px,transparent 1px 3px)}';
    (document.head||document.documentElement).appendChild(s);
  }
  function idDe(img){
    try{var u=new URL(img.getAttribute&&img.getAttribute('src')||img.currentSrc||img.src,location.href);var n=Math.floor(Number(u.searchParams.get('id')));return isFinite(n)&&n>0?n:0;}catch(_e){return 0;}
  }
  /* Norman (2026-10-22) : « l'image du boss 34 est noire » : la classe de mort du boss précédent (opacity:0 !important) restait sur l'image quand le moteur local avait déjà mis le boss suivant dans la même balise. On la retire avant et après l'effet. */
  function nettoyerMort_(img){try{if(img&&img.classList){img.classList.remove('soreal-idle-boss-death-v61');img.style.removeProperty('opacity');}}catch(_e){}}
  function reduit_(){try{return Boolean(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);}catch(_e){return false;}}

  /* Joue l'apparition du boss actuellement affiché dans l'hôte. Le calque est posé tout de suite ; l'effet démarre dès que l'image est chargée (2 s au plus, sinon on révèle simplement). */
  /*
   * Écrans noirs à la place du boss suivant (Norman, 2026-10-23, « parfois ») : le calque sombre posé par couvrir() n'était retiré que par jouer(), or jouer() sortait sans rien retirer quand « réduire les animations » est actif (réglage fréquent sur Android),
   * quand l'image manquait, ou quand l'image mettait plus de 2 s à arriver (le boss était alors « révélé » alors qu'il n'était pas encore chargé). Désormais : toute sortie sans effet retire le calque, l'attente de l'image dure jusqu'à 10 s sous le calque (l'effet se joue à son arrivée),
   * et un calque posé par couvrir() disparaît de toute façon au bout de 12 s.
   */
  function liberer_(hote){try{[].slice.call((hote&&hote.querySelectorAll?hote:document).querySelectorAll('.app-boss')).forEach(function(e){if(e.parentNode)e.parentNode.removeChild(e);});}catch(_e){}}
  function jouer(hote){
    try{
      if(!hote){return false;}
      if(reduit_()){liberer_(hote);return false;}
      var img=hote.querySelector&&hote.querySelector('img');
      if(!img){liberer_(hote);return false;}
      var n=idDe(img);if(!n){liberer_(hote);return false;}
      dernierId=n;
      style_();
      nettoyerMort_(img);
      var anc=hote.querySelector('.app-boss');if(anc)anc.remove();
      var calque=document.createElement('div');
      calque.className='soreal-idle-boss-transition-v61 app-boss';
      calque.setAttribute('data-morph-garder','');calque.setAttribute('aria-hidden','true');
      var cv=document.createElement('canvas');cv.width=L;cv.height=L;calque.appendChild(cv);
      hote.appendChild(calque);
      var i=indexPour(n),c=cv.getContext('2d');c.imageSmoothingEnabled=false;
      enCours=true;
      var fini=false;
      function terminer(){
        if(fini)return;fini=true;enCours=false;
        nettoyerMort_(img);
        calque.style.opacity='0';
        setTimeout(function(){if(calque.parentNode)calque.parentNode.removeChild(calque);},160);
      }
      function demarrer(){
        if(fini)return;
        var E;try{E=preparer(img,i);}catch(_e){terminer();return;}   /* image illisible : on révèle simplement le boss */
        var t0=performance.now();
        jouerSon(i);
        (function image(now){
          if(fini)return;
          if(!calque.isConnected){fini=true;enCours=false;return;}
          var t=(now-t0)/1000;
          if(t>=DUREES[i]){c.drawImage(E.SRC,0,0);terminer();return;}
          scene(i,c,t,E);
          requestAnimationFrame(image);
        })(t0);
      }
      if(img.complete&&img.naturalWidth>0)demarrer();
      else{
        var essais=0;
        (function attendre(){
          if(fini)return;
          if(img.complete&&img.naturalWidth>0){demarrer();return;}
          if(++essais>200){terminer();return;}
          setTimeout(attendre,50);
        })();
      }
      return true;
    }catch(_e){enCours=false;return false;}
  }

  /*
   * Le boss tué ne réapparaît plus (Norman, 2026-10-24 : « quand je tue un boss, on a l'animation de sa mort et quelques fois son image réapparaît avant d'être remplacée par celle du nouveau boss ») : à la victoire, l'hôte porte encore l'image du boss
   * TUÉ (le moteur n'a pas encore répondu). Jouer l'effet d'apparition à cet instant révélait donc l'ancien boss avant le suivant. jouerApres(hote, idMort) joue l'effet tout de suite SEULEMENT si l'image est déjà celle d'un autre boss ; sinon il pose
   * un calque sombre (fondu en même temps que la mort de l'image) et attend, jusqu'à 6 s, que le boss suivant soit dans l'hôte : l'effet se joue alors sur LUI (par ce guetteur ou par verifier()). Sans boss suivant au bout de 6 s (même boss),
   * le calque se retire et l'image revient.
   */
  function jouerApres(hote,idMort,immediat){
    try{
      if(!hote)return false;
      if(reduit_()){liberer_(hote);return false;}
      var img=hote.querySelector&&hote.querySelector('img');
      var n=img?idDe(img):0;
      idMort=Math.floor(Number(idMort))||0;
      if(!(idMort>0)||!img||!n||n!==idMort)return jouer(hote);
      style_();
      dernierId=idMort;enCours=true;
      var anc=hote.querySelector('.app-boss');if(anc)anc.remove();
      var calque=document.createElement('div');
      calque.className='soreal-idle-boss-transition-v61 app-boss app-boss-attente';
      calque.setAttribute('data-morph-garder','');calque.setAttribute('aria-hidden','true');
      if(immediat){calque.style.transition='none';calque.style.opacity='1';hote.appendChild(calque);}   /* après l'écran de victoire : opaque tout de suite, aucun intervalle découvert */
      else{calque.style.opacity='0';calque.style.transition='opacity .28s ease';hote.appendChild(calque);requestAnimationFrame(function(){calque.style.opacity='1';});}
      var debut=performance.now();
      (function attendre(){
        if(!calque.isConnected){return;}                                   /* remplacé : l'effet du boss suivant est en cours (verifier) */
        var im=hote.querySelector&&hote.querySelector('img');
        var m=im?idDe(im):0;
        if(m>0&&m!==idMort){if(dernierId===idMort||dernierId===null)jouer(hote);return;}
        if(performance.now()-debut>6000){
          enCours=false;nettoyerMort_(im);
          calque.style.transition='opacity .3s ease';calque.style.opacity='0';
          setTimeout(function(){if(calque.parentNode)calque.parentNode.removeChild(calque);},320);
          return;
        }
        setTimeout(attendre,80);
      })();
      return true;
    }catch(_e){enCours=false;return false;}
  }

  /* Calque sombre posé tout de suite sur le boss suivant, sans effet : l'écran de victoire le retire quand il démarre (annuler) et le jeu joue l'effet à la fin ; si rien ne vient en 3 s, l'effet se joue. */
  function couvrir(hote,n){
    try{
      dernierId=n;
      if(reduit_())return;   /* sans animations : rien à cacher, rien à retirer ensuite */
      style_();
      var anc=hote.querySelector('.app-boss');if(anc)anc.remove();
      var calque=document.createElement('div');
      calque.className='soreal-idle-boss-transition-v61 app-boss';
      calque.setAttribute('data-morph-garder','');calque.setAttribute('aria-hidden','true');
      hote.appendChild(calque);
      /* Filet : jamais un calque noir plus de 12 s, quoi qu'il arrive à l'écran de victoire. */
      setTimeout(function(){if(calque.isConnected&&!enCours){calque.remove();}},12000);
      setTimeout(function(){
        if(calque.isConnected&&!window.__SOREAL_IDLE_VICTOIRE_EN_COURS__){calque.remove();jouer(hote);}
      },3000);
    }catch(_e){}
  }

  /* Annule une apparition en cours (l'écran de victoire démarre : c'est lui qui, à sa fin, rejouera l'apparition du boss suivant). */
  function annuler(){
    try{[].slice.call(document.querySelectorAll('.app-boss')).forEach(function(e){if(e.parentNode)e.parentNode.removeChild(e);});}catch(_e){}
    enCours=false;
  }

  /* ---------- surveillance : un nouveau boss dans la borne => son apparition (sauf pendant l'écran de victoire, qui passe la main) ---------- */
  function hoteMute_(m){
    var t=m.target;
    if(!t||t.nodeType!==1)return false;
    return t.id===HOTE_ID||(t.tagName==='IMG'&&t.closest&&t.closest('#'+HOTE_ID))||(m.addedNodes&&m.addedNodes.length&&t.closest&&t.closest('#'+HOTE_ID));
  }
  function verifier(){
    var hote=document.getElementById(HOTE_ID);
    var img=hote&&hote.querySelector('img');
    if(!img)return;
    var n=idDe(img);if(!n)return;
    if(dernierId===null){dernierId=n;return;}                     /* première image vue : pas d'apparition au chargement de la page */
    if(n===dernierId)return;
    if(window.__SOREAL_IDLE_VICTOIRE_EN_COURS__){return;}        /* l'écran de victoire appelle jouer() à sa fin */
    if(window.__SOREAL_IDLE_COMBAT_EN_COURS_V1__){couvrir(hote,n);return;}   /* le boss combattu vient d'être remplacé : on masque le nouveau, la victoire (ou, à défaut, l'effet) passe juste après */
    jouer(hote);
  }
  function surveiller(){
    if(typeof MutationObserver!=='function'||!document.body)return false;
    new MutationObserver(function(ms){
      for(var k=0;k<ms.length;k++){if(hoteMute_(ms[k])){try{verifier();}catch(_e){}return;}}
    }).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['src']});
    return true;
  }
  if(typeof document!=='undefined'){
    if(document.body)surveiller();else document.addEventListener('DOMContentLoaded',surveiller);
    /* le boss déjà affiché au chargement est mémorisé sans effet (le jeu peint la borne un peu après le chargement) */
    [1500,4000,8000].forEach(function(ms){setTimeout(function(){try{if(dernierId===null)verifier();}catch(_e){}},ms);});
  }

  window.__SOREAL_IDLE_APPARITION_BOSS_V1__={jouer:jouer,jouerApres:jouerApres,idDe:idDe,indexPour:indexPour,noms:NOMS,durees:DUREES,scene:scene,sons:sons,preparer:preparer,surveiller:surveiller,verifier:verifier,annuler:annuler,enCours:function(){return enCours;}};
})();
