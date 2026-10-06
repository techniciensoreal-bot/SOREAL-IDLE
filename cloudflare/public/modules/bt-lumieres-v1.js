/*
 * SOREAL IDLE — lumières de Basic Training (Norman, 2026-10-06). Les bandeaux « Compétences d'attaque » et « Compétences de défense » sont des enseignes lumineuses :
 *
 *   - AUCUNE énergie placée dans Basic Training : les lumières sont ÉTEINTES ;
 *   - on place de l'énergie alors que la machine était totalement vide : les lumières s'ALLUMENT comme un néon (quelques amorces qui hésitent, puis la décharge, un petit éclat et le
 *     bourdonnement qui s'installe), avec le son du néon qui s'allume. Ce son ne se rejoue PAS tant qu'on n'a pas tout retiré pour ensuite remettre de l'énergie ;
 *   - allumées, elles claquent RAREMENT (de 50 à 140 secondes, au hasard) : UN bandeau à la fois, en haut (attaque) ou en bas (défense), tiré au sort, qui vacille UNE fois ou DEUX fois,
 *     chaque extinction faisant un « tzzzzt » électrique court (environ 0,17 s) et doux ; quand il y en a deux, ils sont très rapprochés et le second COUPE le premier net.
 *
 * Doux pour les yeux : jamais plus de deux éclats par vacillement, lueur baissée (jamais un flash blanc) ; avec « moins d'animations » le système garde seulement l'état (allumé ou éteint),
 * sans clignotement ni son. Le son suit le volume « Sons de l'interface » des Réglages.
 *
 *   window.__SOREAL_IDLE_BT_LUMIERES_V1__ = { vaciller(el), motif(alea), sonner(type), allumerNeon(els), totalEnergie(), demarrer(), arreter() }
 */
(function(){
  'use strict';
  if(window.__SOREAL_IDLE_BT_LUMIERES_V1__)return;

  var CLASSE='lumiere-eteinte';
  var CLASSE_ECLAT='lumiere-eclat';
  var SELECTEUR='.soreal-idle-bt-panel-v120.attack .soreal-idle-bt-panel-head-v120,.soreal-idle-bt-panel-v120.defense .soreal-idle-bt-panel-head-v120';
  var GAIN_MAITRE=0.8;
  var minuteur=0,veille=0;
  var actif=false;
  var enAmorce=false;
  var etatVide=null;   /* null : inconnu ; true : machine vide ; false : de l'énergie est placée */

  function mouvementReduit_(){
    try{return Boolean(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);}catch(_e){return false;}
  }
  function volume_(){
    var r=window.__SOREAL_IDLE_AUDIO_VOLUME_V1__;
    var v=r&&typeof r.getInterface==='function'?Number(r.getInterface()):0.75;
    return Number.isFinite(v)?Math.max(0,Math.min(1,v)):0.75;
  }

  /* Énergie totale placée dans Basic Training (somme des allocations des compétences) ; null si l'état n'est pas encore là. */
  function totalEnergie(){
    try{
      var H=window.__SOREAL_IDLE_META_HOST_V130__;
      var etat=H&&typeof H.getIdleEtat==='function'?H.getIdleEtat():null;
      var skills=etat&&etat.basicTraining&&Array.isArray(etat.basicTraining.skills)?etat.basicTraining.skills:null;
      if(!skills)return null;
      var somme=0;
      for(var i=0;i<skills.length;i++){var v=Number(skills[i]&&skills[i].allocation);if(Number.isFinite(v)&&v>0)somme+=v;}
      return somme;
    }catch(_e){return null;}
  }

  /* Motif d'un vacillement : un ou deux coups. Deux coups = deux extinctions très rapprochées (le second arrive avant la fin du premier « tzzzzt » et le coupe). */
  function motif(alea){
    var a=typeof alea==='function'?alea:Math.random;
    if(a()<0.5)return [[true,150+a()*60],[false,0]];
    return [[true,90+a()*20],[false,28+a()*14],[true,170+a()*40],[false,0]];
  }

  /* ---------- Sons ---------- */
  var ac=null;
  function contexte_(){
    if(ac&&ac.state!=='closed')return ac;
    var C=window.AudioContext||window.webkitAudioContext;
    if(!C)return null;
    try{ac=new C();}catch(_e){ac=null;}
    return ac;
  }
  /* Outils de synthèse partagés par les deux sons. */
  function outils_(c,sortie,t,a){
    return {
      /* souffle électrique dans le médium, haché en blocs d'environ 1 ms (crépitement) et à 120 Hz (courant redressé) */
      souffle:function(decal,duree,f0,f1,gain,coupe){
        var n=Math.max(1,Math.floor(c.sampleRate*duree));
        var tampon=c.createBuffer(1,n,c.sampleRate);
        var d=tampon.getChannelData(0);
        var bloc=Math.max(8,Math.floor(c.sampleRate*0.001));
        var nv=1;
        for(var i=0;i<n;i++){if(i%bloc===0)nv=a()<0.22?0.1:0.45+a()*0.55;d[i]=(a()*2-1)*nv;}
        var src=c.createBufferSource();src.buffer=tampon;
        var f=c.createBiquadFilter();f.type='bandpass';f.Q.value=0.9;
        f.frequency.setValueAtTime(f0,t+decal);f.frequency.exponentialRampToValueAtTime(f1,t+decal+duree);
        var env=c.createGain();
        env.gain.setValueAtTime(0.0001,t+decal);
        env.gain.linearRampToValueAtTime(1,t+decal+0.004);
        env.gain.linearRampToValueAtTime(0.75,t+decal+duree-(coupe||0.025));
        env.gain.linearRampToValueAtTime(0.0001,t+decal+duree);
        var hache=c.createGain();hache.gain.setValueAtTime(0.5,t+decal);
        var lfo=c.createOscillator();lfo.type='sine';lfo.frequency.setValueAtTime(120,t+decal);
        var prof=c.createGain();prof.gain.setValueAtTime(0.5,t+decal);
        lfo.connect(prof);prof.connect(hache.gain);
        var niveau=c.createGain();niveau.gain.value=gain;
        src.connect(f);f.connect(hache);hache.connect(env);env.connect(niveau);niveau.connect(sortie);
        src.start(t+decal);lfo.start(t+decal);lfo.stop(t+decal+duree+0.02);
      },
      /* bourdonnement de ballast : 120 Hz dont on n'entend que les harmoniques médium */
      ballast:function(decal,duree,f0,f1,gain,fin){
        var b=c.createOscillator();b.type='sawtooth';
        b.frequency.setValueAtTime(f0,t+decal);b.frequency.exponentialRampToValueAtTime(f1,t+decal+duree);
        var fb=c.createBiquadFilter();fb.type='bandpass';fb.Q.value=1.0;fb.frequency.setValueAtTime(1200,t+decal);
        var gb=c.createGain();
        gb.gain.setValueAtTime(0.0001,t+decal);gb.gain.linearRampToValueAtTime(gain,t+decal+0.008);
        gb.gain.linearRampToValueAtTime(gain*(fin==null?0.6:fin),t+decal+duree-0.03);gb.gain.linearRampToValueAtTime(0.0001,t+decal+duree);
        b.connect(fb);fb.connect(gb);gb.connect(sortie);b.start(t+decal);b.stop(t+decal+duree+0.02);
      },
      /* claquement d'arc : un ton carré qui s'écrase très vite */
      arc:function(decal,gain){
        var o=c.createOscillator();o.type='square';
        o.frequency.setValueAtTime(2400,t+decal);o.frequency.exponentialRampToValueAtTime(600,t+decal+0.035);
        var f=c.createBiquadFilter();f.type='bandpass';f.Q.value=1.4;f.frequency.setValueAtTime(1800,t+decal);
        var g=c.createGain();
        g.gain.setValueAtTime(0.0001,t+decal);g.gain.linearRampToValueAtTime(gain,t+decal+0.002);g.gain.linearRampToValueAtTime(0.0001,t+decal+0.04);
        o.connect(f);f.connect(g);g.connect(sortie);o.start(t+decal);o.stop(t+decal+0.05);
      },
      /* petit « ping » de tube qui prend */
      ping:function(decal,gain){
        var o=c.createOscillator();o.type='sine';
        o.frequency.setValueAtTime(1900,t+decal);o.frequency.exponentialRampToValueAtTime(1500,t+decal+0.05);
        var g=c.createGain();
        g.gain.setValueAtTime(gain,t+decal);g.gain.exponentialRampToValueAtTime(0.0001,t+decal+0.07);
        o.connect(g);g.connect(sortie);o.start(t+decal);o.stop(t+decal+0.09);
      }
    };
  }
  function construire_(c,sortie,t,type,alea){
    var a=typeof alea==='function'?alea:Math.random;
    var o=outils_(c,sortie,t,a);
    if(type==='eteint'){
      /* « tzzzzt » : claquement d'arc, souffle haché, fond de ballast, coupure nette (≈ 0,17 s). */
      o.arc(0,0.07);
      o.souffle(0,0.17,2400,1500,0.17);
      o.ballast(0,0.17,122,110,0.10);
    }else if(type==='allume'){
      /* Néon qui s'allume (≈ 0,9 s) : trois amorces qui hésitent (« tik »), puis la décharge qui prend, un petit « ping » et le bourdonnement qui s'installe et faiblit. */
      [0,0.12,0.26].forEach(function(d,i){
        o.arc(d,0.05+i*0.015);
        o.souffle(d,0.045+i*0.012,2600,2000,0.12,0.015);
      });
      o.souffle(0.40,0.16,2200,1500,0.17,0.03);          /* la décharge qui prend */
      o.arc(0.40,0.07);
      o.ping(0.43,0.05);
      o.ballast(0.40,0.55,96,118,0.12,0.45);              /* le ballast : monte puis se stabilise en ronronnant */
      o.souffle(0.56,0.34,1900,1400,0.05,0.14);           /* crépitement qui s'éteint, le tube est chaud */
    }
  }
  /* Une seule voix à la fois : un nouveau son COUPE le précédent net (quelques millisecondes de fondu pour éviter un clic). */
  var voixCourante=null;
  function couperVoix_(c){
    if(!voixCourante)return;
    var v=voixCourante;voixCourante=null;
    try{
      var g=v.gain,now=c.currentTime;
      if(typeof g.cancelScheduledValues==='function')g.cancelScheduledValues(now);
      g.setValueAtTime(g.value,now);
      g.linearRampToValueAtTime(0.0001,now+0.004);
      setTimeout(function(){try{v.disconnect();}catch(_e){}},60);
    }catch(_e){}
  }
  function sonner(type){
    if(type!=='eteint'&&type!=='allume')return false;
    var v=volume_();
    if(!(v>0))return false;
    var c=contexte_();
    if(!c)return false;
    try{
      if(c.state==='suspended'&&c.resume)c.resume();
      couperVoix_(c);
      var maitre=c.createGain();maitre.gain.value=Math.min(1,v)*GAIN_MAITRE;maitre.connect(c.destination);
      voixCourante=maitre;
      construire_(c,maitre,c.currentTime+0.005,type);
      return true;
    }catch(_e){return false;}
  }

  /* ---------- Vacillement d'un bandeau allumé ---------- */
  function vaciller(el,alea){
    if(!el||mouvementReduit_())return false;
    var etapes=motif(alea);
    var i=0,anterieur=false;
    (function pas(){
      if(!el.isConnected){return;}
      if(i>=etapes.length){el.classList.remove(CLASSE);return;}
      var e=etapes[i++];
      var eteint=e[0];
      if(eteint!==anterieur){
        el.classList.toggle(CLASSE,eteint);
        if(eteint)sonner('eteint');
        anterieur=eteint;
      }
      if(e[1]>0)setTimeout(pas,e[1]);else pas();
    })();
    return true;
  }

  /* ---------- Allumage d'un néon : les bandeaux hésitent puis prennent, un éclat, puis la lumière tient ---------- */
  /* Départ dans le noir ; [allumé ? , durée en ms] : trois amorces qui hésitent (aux mêmes instants que les « tik » du son : 0, 130, 270 ms), puis la décharge qui prend à 400 ms. */
  var SEQUENCE_NEON=[[true,40],[false,90],[true,50],[false,90],[true,60],[false,70]];
  function allumerNeon(els,alea){
    var liste=Array.prototype.slice.call(els||[]);
    if(!liste.length)return false;
    if(mouvementReduit_()){liste.forEach(function(el){el.classList.remove(CLASSE);});return false;}
    enAmorce=true;
    sonner('allume');
    /* lumière allumée = pas de classe d'extinction ; la séquence part du noir : [true=éteint] */
    var i=0;
    (function pas(){
      if(i>=SEQUENCE_NEON.length){
        liste.forEach(function(el){el.classList.remove(CLASSE);el.classList.add(CLASSE_ECLAT);});
        setTimeout(function(){liste.forEach(function(el){el.classList.remove(CLASSE_ECLAT);});enAmorce=false;},260);
        return;
      }
      var e=SEQUENCE_NEON[i++];
      liste.forEach(function(el){if(el.isConnected){if(e[0])el.classList.remove(CLASSE);else el.classList.add(CLASSE);}});
      setTimeout(pas,e[1]||60);
    })();
    return true;
  }

  /* ---------- Veille : état des lumières selon l'énergie placée ---------- */
  function veiller_(){
    if(!actif)return;
    var total=totalEnergie();
    var heads=Array.prototype.slice.call(document.querySelectorAll(SELECTEUR));
    if(total!==null){
      var vide=total<=0;
      if(!enAmorce){
        if(vide){
          /* machine vide : lumières éteintes (sans bruit), y compris sur une page redessinée */
          heads.forEach(function(el){if(!el.classList.contains(CLASSE))el.classList.add(CLASSE);});
        }else if(etatVide===true&&heads.length){
          /* de l'énergie après une machine totalement vide : le néon s'allume (une seule fois, tant qu'on n'a pas tout retiré) */
          allumerNeon(heads);
        }
        /* de l'énergie déjà placée à l'ouverture ou après un redessin de la page : les bandeaux naissent allumés, sans animation ni son */
      }
      if(heads.length||etatVide===null||!vide)etatVide=vide;
    }
  }

  /* Un seul minuteur pour le hasard : tous les 50 à 140 s, un bandeau tiré au sort (en haut ou en bas), seulement s'il y a de l'énergie placée et rien en cours. */
  function planifier_(){
    if(!actif)return;
    clearTimeout(minuteur);
    minuteur=setTimeout(function(){
      if(!actif)return;
      if(!document.hidden&&!enAmorce&&totalEnergie()>0){
        var presents=Array.prototype.slice.call(document.querySelectorAll(SELECTEUR));
        if(presents.length)vaciller(presents[Math.floor(Math.random()*presents.length)]);
      }
      planifier_();
    },50000+Math.random()*90000);
  }

  function demarrer(){
    if(actif)return false;
    actif=true;
    veille=setInterval(veiller_,200);
    if(!mouvementReduit_())planifier_();
    return true;
  }
  function arreter(){
    actif=false;
    clearTimeout(minuteur);minuteur=0;
    clearInterval(veille);veille=0;
    enAmorce=false;etatVide=null;
    Array.prototype.forEach.call(document.querySelectorAll('.'+CLASSE+',.'+CLASSE_ECLAT),function(el){el.classList.remove(CLASSE);el.classList.remove(CLASSE_ECLAT);});
  }

  window.__SOREAL_IDLE_BT_LUMIERES_V1__={vaciller:vaciller,motif:motif,sonner:sonner,allumerNeon:allumerNeon,totalEnergie:totalEnergie,veiller:veiller_,demarrer:demarrer,arreter:arreter,construire:construire_,classe:CLASSE,classeEclat:CLASSE_ECLAT,selecteur:SELECTEUR,sequenceNeon:SEQUENCE_NEON};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',demarrer);else demarrer();
})();
