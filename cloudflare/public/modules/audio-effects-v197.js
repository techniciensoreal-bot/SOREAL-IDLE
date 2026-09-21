/*
 * SOREAL IDLE — Audio Effects V197
 * Moteur audio autonome du frontend IDLE.
 * Un seul AudioContext partagé : impact Fight, gong boss, défaite et coffre.
 */
(function(){
  'use strict';

  if(window.__SOREAL_IDLE_AUDIO_V197__)return;

  var ctx=null;
  var master=null;

  function contexte_(){
    if(ctx&&ctx.state!=="closed")return ctx;
    var AudioCtx=window.AudioContext||window.webkitAudioContext;
    if(!AudioCtx)return null;
    try{
      ctx=new AudioCtx();
      master=ctx.createGain();
      master.gain.value=.82;
      master.connect(ctx.destination);
      return ctx;
    }catch(_){
      ctx=null;
      master=null;
      return null;
    }
  }

  function reveiller_(){
    var c=contexte_();
    if(!c)return Promise.resolve(null);
    try{
      if(c.state==="suspended"){
        return Promise.resolve(c.resume()).then(function(){return c;}).catch(function(){return c;});
      }
    }catch(_){}
    return Promise.resolve(c);
  }

  function gainEnv_(c,start,peak,end,volume){
    var g=c.createGain();
    g.gain.setValueAtTime(.0001,start);
    g.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),start+Math.max(.005,peak));
    g.gain.exponentialRampToValueAtTime(.0001,start+Math.max(peak+.01,end));
    g.connect(master||c.destination);
    return g;
  }

  function tonal_(c,options){
    options=options||{};
    var start=c.currentTime+Number(options.delay||0);
    var duree=Math.max(.03,Number(options.duration||.2));
    var osc=c.createOscillator();
    var g=gainEnv_(c,start,Math.min(.025,duree*.15),duree,Number(options.volume||.08));
    osc.type=options.type||"sine";
    osc.frequency.setValueAtTime(Math.max(20,Number(options.from||220)),start);
    if(options.to&&Number(options.to)>0){
      osc.frequency.exponentialRampToValueAtTime(Math.max(20,Number(options.to)),start+duree);
    }
    osc.connect(g);
    osc.start(start);
    osc.stop(start+duree+.03);
  }

  function bruit_(c,options){
    options=options||{};
    var start=c.currentTime+Number(options.delay||0);
    var duree=Math.max(.03,Number(options.duration||.2));
    var frames=Math.max(1,Math.floor(c.sampleRate*duree));
    var buffer=c.createBuffer(1,frames,c.sampleRate);
    var data=buffer.getChannelData(0);
    for(var i=0;i<frames;i+=1){
      var t=i/frames;
      data[i]=(Math.random()*2-1)*Math.pow(1-t,Number(options.decay||2.2));
    }
    var src=c.createBufferSource();
    src.buffer=buffer;
    var filter=c.createBiquadFilter();
    filter.type=options.filterType||"lowpass";
    filter.frequency.setValueAtTime(Math.max(40,Number(options.frequency||700)),start);
    if(options.frequencyEnd){
      filter.frequency.exponentialRampToValueAtTime(
        Math.max(40,Number(options.frequencyEnd)),
        start+duree
      );
    }
    var g=gainEnv_(c,start,.012,duree,Number(options.volume||.08));
    src.connect(filter);
    filter.connect(g);
    src.start(start);
  }

  function accentFight_(){
    reveiller_().then(function(c){
      if(!c)return;
      tonal_(c,{type:"square",from:150,to:95,duration:.095,volume:.055});
      tonal_(c,{type:"sawtooth",from:760,to:360,duration:.075,volume:.025,delay:.015});
    });
  }

  function voixFight_(){
    // Impact WebAudio uniquement. Aucun moteur vocal système.
    accentFight_();
  }

  function gongBoss_(){
    reveiller_().then(function(c){
      if(!c)return;
      /*
       * Partiels légèrement inharmoniques + longue décroissance :
       * son de gong, pas une simple cloche sinusoïdale.
       */
      [
        [112,1.75,.115],
        [181,1.55,.075],
        [274,1.25,.052],
        [386,1.05,.035],
        [517,.82,.022]
      ].forEach(function(p,index){
        tonal_(c,{
          type:index<2?"sine":"triangle",
          from:p[0],
          to:p[0]*.985,
          duration:p[1],
          volume:p[2],
          delay:index*.006
        });
      });
      bruit_(c,{
        duration:.12,
        volume:.025,
        frequency:1200,
        frequencyEnd:260,
        decay:3
      });
    });
  }

  function defaite_(){
    reveiller_().then(function(c){
      if(!c)return;
      tonal_(c,{type:"sawtooth",from:330,to:92,duration:.68,volume:.07});
      tonal_(c,{type:"triangle",from:196,to:62,duration:.82,volume:.09,delay:.06});
      tonal_(c,{type:"sine",from:82,to:46,duration:.58,volume:.12,delay:.20});
      bruit_(c,{
        duration:.48,
        volume:.08,
        frequency:520,
        frequencyEnd:90,
        decay:2.1,
        delay:.12
      });
    });
  }

  function coffreOuverture_(){
    reveiller_().then(function(c){
      if(!c)return;
      bruit_(c,{
        duration:.42,
        volume:.13,
        frequency:900,
        frequencyEnd:230,
        decay:2.2
      });
      tonal_(c,{type:"triangle",from:138,to:245,duration:.28,volume:.045,delay:.035});
      tonal_(c,{type:"sine",from:310,to:420,duration:.20,volume:.022,delay:.13});
    });
  }

  function coffreFermeture_(){
    reveiller_().then(function(c){
      if(!c)return;
      /*
       * Même famille bois/métal que l'ouverture, mais geste descendant
       * plus court suivi d'un "clac" grave de fermeture.
       */
      tonal_(c,{type:"triangle",from:250,to:115,duration:.22,volume:.052});
      bruit_(c,{
        duration:.27,
        volume:.11,
        frequency:560,
        frequencyEnd:120,
        decay:2.8,
        delay:.04
      });
      tonal_(c,{type:"sine",from:105,to:72,duration:.16,volume:.13,delay:.16});
    });
  }

  function debloquer_(){
    reveiller_();
  }

  document.addEventListener("pointerdown",debloquer_,{capture:true,passive:true});
  document.addEventListener("touchstart",debloquer_,{capture:true,passive:true});

  window.__SOREAL_IDLE_AUDIO_V197__={
    unlock:debloquer_,
    fight:voixFight_,
    bossAppear:gongBoss_,
    defeat:defaite_,
    chestOpen:coffreOuverture_,
    chestClose:coffreFermeture_
  };
})();
