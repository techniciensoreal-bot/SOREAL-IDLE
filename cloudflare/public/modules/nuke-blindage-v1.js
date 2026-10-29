/*
 * SOREAL IDLE — le bouton NUKE sous blindage (Norman, 2026-10-22 : « que le bouton NUKE se referme quand il n'est pas disponible : un système de haute sécurité, en métal, avec une animation quand il se referme et quand il s'ouvre (la même
 * inversée), genre Transformers »).
 *
 * Tant que le NUKE n'est pas disponible (bouton désactivé), deux battants d'acier le recouvrent (chacun porte sa moitié de poutre centrale), deux verrous les bloquent et un voyant rouge clignote. Dès qu'il devient disponible,
 * les verrous se retirent puis les battants coulissent chacun de leur côté avec un souffle hydraulique et un choc en butée (mécanisme n°2 choisi par Norman parmi cinq, 2026-10-22 ; pas de bande jaune : la poutre du milieu est en métal et fait partie
 * des battants, elle disparaît avec l'ouverture) ; à la fermeture, exactement la même chose à l'envers. Le calque est AJOUTÉ au bouton (data-morph-garder : un redessin
 * de la page ne le retire pas, règle n°4) et se recale tout de suite sur l'état voulu s'il est recréé : le bouton est redessiné à chaque rendu, l'état précédent est donc mémorisé ici. Aucune animation avec « réduire les animations ».
 *   window.__SOREAL_IDLE_NUKE_BLINDAGE_V1__ = { verifier(), etat(), sons(ctx, sortie, t, ouvre) }
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_NUKE_BLINDAGE_V1__)return;

  var ID_BOUTON='sorealIdleBossNukeV1';
  var etatVu=null;            /* dernier état connu : 'ferme' | 'ouvert' (survit aux redessins du bouton) */

  function reduit_(){try{return Boolean(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);}catch(_e){return false;}}

  /* ---------- le calque : deux battants d'acier (chacun porte sa moitié de poutre centrale), deux verrous, voyant ---------- */
  function html_(){
    var riv=function(st){return '<i class="nk-rivet" style="'+st+'"></i>';};
    return '<div class="nk-porte nk-g">'+riv('left:14%;top:26%')+riv('left:14%;bottom:26%')+'<i class="nk-poutre"></i></div>'+
      '<div class="nk-porte nk-d">'+riv('right:14%;top:26%')+riv('right:14%;bottom:26%')+'<i class="nk-poutre"></i></div>'+
      '<i class="nk-verrou nk-v1"></i><i class="nk-verrou nk-v2"></i><i class="nk-voyant"></i>';
  }
  function calque_(bouton){
    var c=bouton.querySelector('.nk-blindage');
    if(c)return c;
    c=document.createElement('div');
    c.className='nk-blindage';
    c.setAttribute('data-morph-garder','');c.setAttribute('aria-hidden','true');
    c.innerHTML=html_();
    bouton.appendChild(c);
    return c;
  }

  /* ---------- feuille de style ---------- */
  function style_(){
    if(document.getElementById('soreal-idle-nuke-blindage-style'))return;
    var s=document.createElement('style');s.id='soreal-idle-nuke-blindage-style';
    var acier='linear-gradient(135deg,#9aa5b6,#5a6475 45%,#3b4352 55%,#232833)';
    s.textContent=
      '#'+ID_BOUTON+' .nk-blindage{position:absolute;inset:-2px;z-index:6;pointer-events:none;border-radius:50%;overflow:hidden}'+
      /* battants : fermé = se touchent au centre ; ouvert = glissent chacun de son côté, poutre centrale comprise */
      '.nk-blindage .nk-porte{position:absolute;top:0;bottom:0;width:50.5%;background:'+acier+';transition:transform .7s cubic-bezier(.6,0,.3,1)}'+
      '.nk-blindage .nk-g{left:0;border-right:2px solid #11151c}'+
      '.nk-blindage .nk-d{right:0;border-left:2px solid #11151c}'+
      '.nk-blindage .nk-poutre{position:absolute;top:0;bottom:0;width:9%;background:linear-gradient(90deg,#c9d1dd,#6b7586 55%,#2c323d);border:1px solid #0e1117}'+
      '.nk-blindage .nk-g .nk-poutre{right:0}'+
      '.nk-blindage .nk-d .nk-poutre{left:0;transform:scaleX(-1)}'+
      '.nk-blindage .nk-rivet{position:absolute;width:9%;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle at 35% 30%,#d8dfea,#586172 60%,#222831);box-shadow:0 1px 1px rgba(0,0,0,.6)}'+
      '.nk-blindage[data-etat="ouvert"] .nk-g{transform:translateX(-102%);transition-delay:.35s}'+
      '.nk-blindage[data-etat="ouvert"] .nk-d{transform:translateX(102%);transition-delay:.35s}'+
      '.nk-blindage[data-etat="ferme"] .nk-porte{transition-delay:0s}'+
      /* verrous : retirés d'abord à l'ouverture, remis en dernier à la fermeture */
      '.nk-blindage .nk-verrou{position:absolute;left:50%;width:23%;height:8%;margin-left:-11.5%;background:linear-gradient(#d9e0ec,#6a7384);border:1px solid #0e1117;border-radius:2px;transition:transform .28s ease-in}'+
      '.nk-blindage .nk-v1{top:4%}.nk-blindage .nk-v2{bottom:4%}'+
      '.nk-blindage[data-etat="ouvert"] .nk-v1{transform:translateY(-300%);transition-delay:0s}'+
      '.nk-blindage[data-etat="ouvert"] .nk-v2{transform:translateY(300%);transition-delay:0s}'+
      '.nk-blindage[data-etat="ferme"] .nk-verrou{transition-delay:.7s}'+
      '.nk-blindage .nk-voyant{position:absolute;left:50%;top:50%;width:9%;aspect-ratio:1;margin:-4.5% 0 0 -4.5%;border-radius:50%;background:#ff2b2b;box-shadow:0 0 8px #ff2b2b}'+
      '.nk-blindage[data-etat="ferme"] .nk-voyant{animation:nkVoyant 1.1s ease-in-out infinite}'+
      '.nk-blindage[data-etat="ouvert"] .nk-voyant{opacity:0}'+
      '@keyframes nkVoyant{0%,100%{opacity:1}50%{opacity:.25}}'+
      '.nk-blindage[data-instant="1"] *{transition:none!important;animation-duration:0s}'+
      '@media (prefers-reduced-motion:reduce){.nk-blindage *{transition:none!important}.nk-blindage .nk-voyant{animation:none!important}}';
    (document.head||document.documentElement).appendChild(s);
  }

  /* ---------- sons : servo grave, claquements métalliques, verrou lourd ; rien d'aigu ---------- */
  var ctxA=null;
  function volume_(){var r=window.__SOREAL_IDLE_AUDIO_VOLUME_V1__;return r&&typeof r.getInterface==='function'?Number(r.getInterface()):0.75;}
  function clac(c,sortie,t,f,vol){   /* claquement métallique : bruit filtré + petit corps sourd */
    var n=Math.floor(c.sampleRate*0.07),b=c.createBuffer(1,n,c.sampleRate),x=b.getChannelData(0),i;
    for(i=0;i<n;i++)x[i]=(Math.random()*2-1)*Math.pow(1-i/n,2.2);
    var s=c.createBufferSource();s.buffer=b;
    var fl=c.createBiquadFilter();fl.type='bandpass';fl.frequency.value=f;fl.Q.value=4;
    var g=c.createGain();g.gain.value=vol;s.connect(fl);fl.connect(g);g.connect(sortie);s.start(t);
    var o=c.createOscillator(),og=c.createGain();o.type='sine';o.frequency.setValueAtTime(f*0.18,t);o.frequency.exponentialRampToValueAtTime(f*0.1,t+0.08);
    og.gain.setValueAtTime(vol*0.9,t);og.gain.exponentialRampToValueAtTime(0.0001,t+0.1);o.connect(og);og.connect(sortie);o.start(t);o.stop(t+0.12);
  }
  function souffle(c,sortie,t,d,vol){
    var n=Math.floor(c.sampleRate*d),b=c.createBuffer(1,n,c.sampleRate),x=b.getChannelData(0),i;
    for(i=0;i<n;i++)x[i]=(Math.random()*2-1)*Math.pow(1-i/n,1.3);
    var s=c.createBufferSource();s.buffer=b;
    var fl=c.createBiquadFilter();fl.type='lowpass';fl.frequency.value=1400;
    var g=c.createGain();g.gain.value=vol;s.connect(fl);fl.connect(g);g.connect(sortie);s.start(t);
  }
  function glisse(c,sortie,t,f0,f1,d,vol){   /* glissement grave des battants */
    var o=c.createOscillator(),g=c.createGain(),fl=c.createBiquadFilter();
    o.type='sawtooth';o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+d);
    fl.type='lowpass';fl.frequency.value=300;fl.Q.value=2;
    g.gain.value=0.0001;g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(vol,t+0.05);g.gain.setValueAtTime(vol,t+d-0.1);g.gain.exponentialRampToValueAtTime(0.0001,t+d);
    o.connect(fl);fl.connect(g);g.connect(sortie);o.start(t);o.stop(t+d+0.02);
  }
  function choc(c,sortie,t,vol){   /* gros choc de battant en butée */
    var o=c.createOscillator(),g=c.createGain();
    o.type='sine';o.frequency.setValueAtTime(95,t);o.frequency.exponentialRampToValueAtTime(48,t+0.28);
    g.gain.value=vol;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.0001,t+0.3);o.connect(g);g.connect(sortie);o.start(t);o.stop(t+0.32);
    clac(c,sortie,t,330,vol*0.5);
  }
  function sons(c,sortie,t,ouvre){
    if(ouvre){      /* deux verrous qui claquent, souffle hydraulique, battants qui glissent, choc en butée */
      clac(c,sortie,t,520,0.4);clac(c,sortie,t+0.06,430,0.4);
      souffle(c,sortie,t+0.3,0.75,0.12);glisse(c,sortie,t+0.35,70,110,0.7,0.07);
      choc(c,sortie,t+1.05,0.5);
    }else{          /* battants qui reviennent, gros choc de fermeture, puis les deux verrous */
      souffle(c,sortie,t,0.7,0.12);glisse(c,sortie,t,110,70,0.7,0.07);
      choc(c,sortie,t+0.68,0.8);
      clac(c,sortie,t+0.78,520,0.4);clac(c,sortie,t+0.84,430,0.4);
    }
  }
  function jouerSons(ouvre){
    var v=volume_();
    if(!(v>0)||reduit_())return false;
    try{
      var C=window.AudioContext||window.webkitAudioContext;if(!C)return false;
      var L=window.__SOREAL_IDLE_LIMITEUR_V1__;
      ctxA=ctxA&&ctxA.state!=='closed'?ctxA:((L&&L.contexte&&L.contexte())||new C());
      if(ctxA.state==='suspended'&&ctxA.resume)ctxA.resume();
      var maitre=ctxA.createGain();maitre.gain.value=Math.min(1,v)*0.55;
      var pb=ctxA.createBiquadFilter();pb.type='lowpass';pb.frequency.value=1800;pb.Q.value=0.5;
      var comp=ctxA.createDynamicsCompressor();
      maitre.connect(pb);pb.connect(comp);(L&&L.brancher(ctxA,comp))||comp.connect(ctxA.destination);
      sons(ctxA,maitre,ctxA.currentTime+0.02,ouvre);
      return true;
    }catch(_e){return false;}
  }

  /* ---------- surveillance : l'état voulu suit l'attribut « disabled » du bouton ---------- */
  function verifier(){
    var b=document.getElementById(ID_BOUTON);
    if(!b)return false;
    style_();
    var voulu=b.disabled?'ferme':'ouvert';
    var neuf=!b.querySelector('.nk-blindage');
    var c=calque_(b);
    if(etatVu===null){
      /* première fois : on se met directement sur l'état voulu, sans animation ni son */
      c.setAttribute('data-instant','1');c.setAttribute('data-etat',voulu);
      void c.getBoundingClientRect();c.removeAttribute('data-instant');
      etatVu=voulu;return true;
    }
    if(neuf){
      /* bouton redessiné : le calque neuf reprend l'état d'AVANT sans animation, puis passe à l'état voulu s'il a changé (l'animation se joue alors normalement) */
      c.setAttribute('data-instant','1');c.setAttribute('data-etat',etatVu);
      void c.getBoundingClientRect();c.removeAttribute('data-instant');void c.getBoundingClientRect();
    }
    if(voulu!==etatVu){
      if(reduit_()){c.setAttribute('data-instant','1');c.setAttribute('data-etat',voulu);void c.getBoundingClientRect();c.removeAttribute('data-instant');}
      else{c.setAttribute('data-etat',voulu);jouerSons(voulu==='ouvert');}
      etatVu=voulu;
    }else if(c.getAttribute('data-etat')!==voulu){
      c.setAttribute('data-etat',voulu);
    }
    return true;
  }
  /* Le redessin de la page ne retire pas le calque ; s'il est recréé, il est remis dans la même tâche. */
  (window.__SOREAL_IDLE_APRES_REDESSIN_V1__=window.__SOREAL_IDLE_APRES_REDESSIN_V1__||[]).push(function(){try{verifier();}catch(_e){}});
  if(typeof setInterval==='function'&&typeof document!=='undefined')setInterval(function(){if(!document.hidden){try{verifier();}catch(_e){}}},150);

  window.__SOREAL_IDLE_NUKE_BLINDAGE_V1__={verifier:verifier,etat:function(){return etatVu;},sons:sons};
})();
