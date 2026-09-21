/*
 * SOREAL IDLE — Tutorial / Info narration V205
 *
 * Préfère un audio pré-généré lorsqu'une source est fournie. Sinon demande
 * une narration neurale française au Worker SOREAL-IDLE (Workers AI + cache
 * R2), puis retombe sur SpeechSynthesis si le service neural échoue.
 */
(function(){
  'use strict';

  if(window.__SOREAL_IDLE_TUTORIAL_TTS_V205__)return;

  var KEY='soreal_idle_tutorial_tts_auto_v202';
  var BUTTON_CLASS='soreal-idle-tuto-tts-v202';
  var READ_CLASS='soreal-idle-tts-read-v203';
  var auto=false;
  var lastFingerprint='';
  var timer=0;
  var speechGeneration=0;
  var activeReadTarget='';
  var activeAudio=null;
  var activeAudioSource='';
  var activeAudioObjectUrl='';

  try{auto=localStorage.getItem(KEY)==='1';}catch(_){}

  function synth_(){
    return window.speechSynthesis||null;
  }

  function speechSupported_(){
    return Boolean(synth_()&&typeof window.SpeechSynthesisUtterance==='function');
  }

  function audioSupported_(){
    try{
      return typeof window.Audio==='function';
    }catch(_){
      return false;
    }
  }

  function supported_(){
    return audioSupported_()||speechSupported_();
  }

  function safeAudioSource_(value){
    var src=String(value||'').trim();
    if(!src)return '';
    try{
      var base=String(window.location&&window.location.href||'https://soreal.invalid/');
      var parsed=new URL(src,base);
      if(parsed.protocol!=='https:'&&parsed.protocol!=='http:')return '';
      return src;
    }catch(_){
      return '';
    }
  }

  function audioSourceFor_(targetId,target,explicitSource){
    var direct=safeAudioSource_(explicitSource);
    if(direct)return direct;
    if(target&&typeof target.getAttribute==='function'){
      direct=safeAudioSource_(target.getAttribute('data-soreal-tts-audio-src'));
      if(direct)return direct;
    }
    try{
      var manifest=window.__SOREAL_IDLE_NARRATION_AUDIO_MANIFEST__;
      if(manifest&&targetId&&Object.prototype.hasOwnProperty.call(manifest,targetId)){
        direct=safeAudioSource_(manifest[targetId]);
        if(direct)return direct;
      }
    }catch(_){}
    return '';
  }

  function standaloneSession_(){
    try{
      var bridge=window.__SOREAL_IDLE_STANDALONE_V1__;
      return bridge&&typeof bridge.session==='function'
        ?String(bridge.session()||'').trim()
        :'';
    }catch(_){
      return '';
    }
  }

  function revokeObjectUrl_(src){
    if(!src||String(src).indexOf('blob:')!==0)return;
    try{
      if(typeof URL!=='undefined'&&typeof URL.revokeObjectURL==='function'){
        URL.revokeObjectURL(src);
      }
    }catch(_){}
  }

  function requestNeuralAudio_(text,targetId){
    var session=standaloneSession_();
    if(!session||typeof fetch!=='function'||!audioSupported_()){
      return Promise.resolve('');
    }
    if(typeof URL==='undefined'||typeof URL.createObjectURL!=='function'){
      return Promise.resolve('');
    }

    var controller=typeof AbortController==='function'?new AbortController():null;
    var timeout=setTimeout(function(){
      try{if(controller)controller.abort();}catch(_){}
    },12000);

    return fetch('/api/v1/narration',{
      method:'POST',
      cache:'no-store',
      signal:controller?controller.signal:undefined,
      headers:{
        accept:'audio/mpeg',
        'content-type':'application/json',
        authorization:'Bearer '+session
      },
      body:JSON.stringify({
        text:String(text||''),
        targetId:String(targetId||'__manual_text__')
      })
    }).then(function(response){
      if(!response||!response.ok)throw new Error('IDLE_NARRATION_UNAVAILABLE');
      return response.blob();
    }).then(function(blob){
      if(!blob||!blob.size)return '';
      return URL.createObjectURL(blob);
    }).catch(function(){
      return '';
    }).finally(function(){
      clearTimeout(timeout);
    });
  }

  function updateReadButtons_(){
    document.querySelectorAll('.'+READ_CLASS+'[data-soreal-tts-target]').forEach(function(button){
      if(!button.dataset.sorealTtsOriginalLabel){
        button.dataset.sorealTtsOriginalLabel=String(button.textContent||'🔊 Lire ce texte');
      }
      var cible=String(button.getAttribute('data-soreal-tts-target')||'');
      var active=Boolean(activeReadTarget&&cible===activeReadTarget);
      button.dataset.sorealTtsReading=active?'1':'0';
      button.textContent=active
        ?'⏹ Arrêter la lecture'
        :button.dataset.sorealTtsOriginalLabel;
    });
  }

  function stop_(){
    speechGeneration+=1;
    activeReadTarget='';
    var audio=activeAudio;
    activeAudio=null;
    activeAudioSource='';
    var objectUrl=activeAudioObjectUrl;
    activeAudioObjectUrl='';
    if(audio){
      try{audio.onended=null;audio.onerror=null;}catch(_){}
      try{audio.pause();}catch(_){}
      try{audio.currentTime=0;}catch(_){}
    }
    revokeObjectUrl_(objectUrl);
    try{
      var synth=synth_();
      if(synth)synth.cancel();
    }catch(_){}
    updateReadButtons_();
    return true;
  }

  function activePanel_(){
    return (
      document.getElementById('sorealIdleTutorielFlottantV1')||
      document.querySelector('#sorealIdleTutorielPagesModalV1 .soreal-idle-modal-card-v63')||
      document.querySelector('#sorealIdleNouveauteModalV75 .soreal-idle-modal-card-v63')||
      null
    );
  }

  function buttonHost_(panel){
    if(!panel)return null;
    if(panel.id==='sorealIdleTutorielFlottantV1'){
      return panel.querySelector('.soreal-idle-tuto-flottant-drag-v1');
    }
    return panel.querySelector('.soreal-idle-modal-top-v63')||panel;
  }

  function visible_(el){
    if(!el||!el.isConnected)return false;
    var s=window.getComputedStyle?window.getComputedStyle(el):null;
    return !s||(
      s.display!=='none'&&
      s.visibility!=='hidden'&&
      Number(s.opacity||1)!==0
    );
  }

  function text_(panel){
    if(!panel)return '';
    var clone=panel.cloneNode(true);
    clone.querySelectorAll(
      'button,input,select,textarea,script,style,.'
      +BUTTON_CLASS+',.'+READ_CLASS+
      ',[aria-hidden="true"],[data-soreal-tts-ignore],[data-soreal-tts-target]'
    ).forEach(function(el){el.remove();});
    return String(clone.textContent||'')
      .replace(/\s+/g,' ')
      .trim();
  }

  function voiceFr_(synth){
    var voices=typeof synth.getVoices==='function'?synth.getVoices():[];
    if(!Array.isArray(voices)||!voices.length)return null;
    return (
      voices.find(function(v){return /^fr-BE$/i.test(String(v&&v.lang||''));})||
      voices.find(function(v){return /^fr-FR$/i.test(String(v&&v.lang||''));})||
      voices.find(function(v){return /^fr(?:-|_)/i.test(String(v&&v.lang||''));})||
      null
    );
  }

  function audioBusy_(){
    try{
      var audio=window.__SOREAL_IDLE_AUDIO_V199__;
      var state=audio&&typeof audio.debugState==='function'?audio.debugState():null;
      return Boolean(state&&state.active);
    }catch(_){
      return false;
    }
  }

  function decouperTexteAndroidV207_(value){
    var texte=String(value||'').replace(/\s+/g,' ').trim();
    if(!texte)return [];

    /*
     * Android Chrome/WebView peut rester muet ou suspendre les très longues
     * SpeechSynthesisUtterance. On lit donc le texte par phrases courtes,
     * puis on enchaîne via onend. 220 caractères garde chaque morceau bien
     * sous la durée où le moteur Google TTS a tendance à se figer.
     */
    var phrases=texte.match(/[^.!?…]+[.!?…]+|[^.!?…]+$/g)||[texte];
    var morceaux=[];
    var courant='';

    phrases.forEach(function(partie){
      var phrase=String(partie||'').trim();
      if(!phrase)return;

      if(phrase.length>220){
        if(courant){
          morceaux.push(courant);
          courant='';
        }
        while(phrase.length>220){
          var coupe=phrase.lastIndexOf(' ',220);
          if(coupe<80)coupe=220;
          morceaux.push(phrase.slice(0,coupe).trim());
          phrase=phrase.slice(coupe).trim();
        }
        if(phrase)courant=phrase;
        return;
      }

      if((courant+' '+phrase).trim().length>220){
        if(courant)morceaux.push(courant);
        courant=phrase;
      }else{
        courant=(courant+' '+phrase).trim();
      }
    });

    if(courant)morceaux.push(courant);
    return morceaux;
  }

  function speak_(text,attempt,force,targetId){
    if((!force&&!auto)||!text||!speechSupported_())return false;
    attempt=Math.max(0,Number(attempt)||0);

    if(targetId){
      activeReadTarget=String(targetId);
      updateReadButtons_();
    }

    if(audioBusy_()&&attempt<14){
      setTimeout(function(){speak_(text,attempt+1,force,targetId);},140);
      return;
    }

    var synth=synth_();
    var morceaux=decouperTexteAndroidV207_(text);
    if(!morceaux.length)return;

    var generation=++speechGeneration;
    var voice=voiceFr_(synth);

    try{synth.cancel();}catch(_){}

    function parler(index,reessaiSansVoix){
      if(generation!==speechGeneration)return;
      if(index>=morceaux.length){
        if(activeReadTarget){
          activeReadTarget='';
          updateReadButtons_();
        }
        return;
      }

      try{
        /*
         * Android : cancel() suivi immédiatement de speak() peut être
         * ignoré. Le premier morceau part donc après un très court délai.
         * resume() est appelé avant chaque morceau pour réveiller un moteur
         * Google TTS suspendu par la WebView.
         */
        try{synth.resume();}catch(_){}

        var u=new SpeechSynthesisUtterance(morceaux[index]);
        u.lang=voice&&voice.lang?String(voice.lang):'fr-FR';
        u.rate=.96;
        u.pitch=.96;
        u.volume=1;
        if(voice&&!reessaiSansVoix)u.voice=voice;

        var fini=false;
        var terminer=function(){
          if(fini||generation!==speechGeneration)return;
          fini=true;
          setTimeout(function(){parler(index+1,false);},35);
        };

        u.onend=terminer;
        u.onerror=function(){
          if(fini||generation!==speechGeneration)return;
          fini=true;

          /*
           * Certains WebView exposent une voix installée mais refusent son
           * objet SpeechSynthesisVoice. On retente une fois avec seulement
           * lang=fr-FR pour laisser Android choisir Google TTS lui-même.
           */
          if(voice&&!reessaiSansVoix){
            setTimeout(function(){parler(index,true);},80);
          }else{
            setTimeout(function(){parler(index+1,false);},35);
          }
        };

        synth.speak(u);

        /*
         * Garde-fou Android : une synthèse longue peut se mettre en pause
         * toute seule. resume() périodique sans pause() préalable est
         * inoffensif sur Chrome desktop et réveille certaines WebView.
         */
        setTimeout(function(){
          if(generation===speechGeneration){
            try{synth.resume();}catch(_){}
          }
        },900);
      }catch(_){
        setTimeout(function(){parler(index+1,false);},35);
      }
    }

    setTimeout(function(){
      parler(0,false);
    },70);
  }

  function playAudio_(src,text,targetId){
    if(!src||!audioSupported_())return false;
    var generation=++speechGeneration;
    var audio=null;
    try{
      audio=new Audio(src);
      audio.preload='auto';
    }catch(_){
      revokeObjectUrl_(src);
      return false;
    }
    activeAudio=audio;
    activeAudioSource=src;
    activeAudioObjectUrl=String(src).indexOf('blob:')===0?String(src):'';
    if(targetId){
      activeReadTarget=String(targetId);
      updateReadButtons_();
    }
    try{
      var synth=synth_();
      if(synth)synth.cancel();
    }catch(_){}
    var done=false;
    function clearAudio_(){
      if(activeAudio===audio){
        var objectUrl=activeAudioObjectUrl;
        activeAudio=null;
        activeAudioSource='';
        activeAudioObjectUrl='';
        revokeObjectUrl_(objectUrl);
      }
    }
    function finish_(){
      if(done||generation!==speechGeneration)return;
      done=true;
      clearAudio_();
      if(activeReadTarget&&(!targetId||activeReadTarget===String(targetId))){
        activeReadTarget='';
        updateReadButtons_();
      }
    }
    function fallback_(){
      if(done||generation!==speechGeneration)return;
      done=true;
      clearAudio_();
      try{audio.pause();}catch(_){}
      if(speechSupported_()){
        speak_(text,0,true,targetId);
      }else if(activeReadTarget&&(!targetId||activeReadTarget===String(targetId))){
        activeReadTarget='';
        updateReadButtons_();
      }
    }
    audio.onended=finish_;
    audio.onerror=fallback_;
    try{
      var started=audio.play();
      if(started&&typeof started.catch==='function'){
        started.catch(fallback_);
      }
      return true;
    }catch(_){
      fallback_();
      return true;
    }
  }

  function readWithAudioFallback_(text,targetId,target,force,explicitSource){
    if((!force&&!auto)||!text)return false;

    var src=audioSourceFor_(targetId,target,explicitSource);
    if(src&&playAudio_(src,text,targetId))return true;

    var session=standaloneSession_();
    if(session&&audioSupported_()&&typeof fetch==='function'){
      var generation=++speechGeneration;
      if(targetId){
        activeReadTarget=String(targetId);
        updateReadButtons_();
      }

      requestNeuralAudio_(text,targetId).then(function(neuralSrc){
        if(generation!==speechGeneration){
          revokeObjectUrl_(neuralSrc);
          return;
        }
        if(neuralSrc&&playAudio_(neuralSrc,text,targetId))return;

        if(speechSupported_()){
          speak_(text,0,Boolean(force),targetId);
          return;
        }
        if(activeReadTarget&&(!targetId||activeReadTarget===String(targetId))){
          activeReadTarget='';
          updateReadButtons_();
        }
      });
      return true;
    }

    if(speechSupported_()){
      speak_(text,0,Boolean(force),targetId);
      return true;
    }
    return false;
  }

  function readVisible_(force){
    var panel=activePanel_();
    if(!visible_(panel))return;

    var txt=text_(panel);
    if(!txt)return;

    if(!force&&txt===lastFingerprint)return;
    lastFingerprint=txt;
    readWithAudioFallback_(txt,String(panel.id||''),panel,Boolean(force));
  }

  function updateButton_(button){
    if(!button)return;
    if(!supported_()){
      button.disabled=true;
      if(button.textContent!=='🔇 TTS indisponible'){
        button.textContent='🔇 TTS indisponible';
      }
      button.title='La lecture vocale système n’est pas disponible sur cet appareil.';
      return;
    }
    button.disabled=false;
    var label=auto?'🔊 Lecture auto ON':'🔈 Lecture auto OFF';
    if(button.textContent!==label)button.textContent=label;
    button.title=auto
      ?'Désactiver la lecture automatique des panneaux explicatifs'
      :'Activer la lecture automatique des panneaux explicatifs';
  }

  function toggleAuto_(e){
    if(e){
      e.preventDefault();
      e.stopPropagation();
    }
    if(!supported_())return;

    auto=!auto;
    try{localStorage.setItem(KEY,auto?'1':'0');}catch(_){}

    if(!auto){
      stop_();
    }else{
      lastFingerprint='';
      readVisible_(true);
    }
    renderButton_();
  }

  function renderButton_(){
    var panel=activePanel_();
    if(!panel)return;

    var host=buttonHost_(panel);
    if(!host)return;

    var button=host.querySelector('.'+BUTTON_CLASS);
    if(!button){
      button=document.createElement('button');
      button.type='button';
      button.className=BUTTON_CLASS;
      button.setAttribute('data-soreal-tts-ignore','1');
      button.addEventListener('pointerdown',function(e){e.stopPropagation();});
      button.addEventListener('touchstart',function(e){e.stopPropagation();},{passive:true});
      button.addEventListener('mousedown',function(e){e.stopPropagation();});
      button.addEventListener('click',toggleAuto_);
      host.appendChild(button);
    }
    updateButton_(button);
  }

  function lireCible_(targetId){
    if(!supported_())return false;
    var id=String(targetId||'');
    if(activeReadTarget===id){
      stop_();
      return true;
    }
    var target=document.getElementById(id);
    if(!visible_(target))return false;
    var txt=text_(target);
    if(!txt)return false;
    lastFingerprint='';
    stop_();
    return readWithAudioFallback_(txt,id,target,true);
  }

  function scan_(){
    renderButton_();
    updateReadButtons_();
    if(auto)readVisible_(false);
  }

  function schedule_(){
    clearTimeout(timer);
    timer=setTimeout(scan_,70);
  }

  function style_(){
    if(document.getElementById('soreal-idle-tuto-tts-v203-style'))return;
    var st=document.createElement('style');
    st.id='soreal-idle-tuto-tts-v203-style';
    st.textContent=
      '.'+BUTTON_CLASS+'{margin-left:auto!important;flex:0 0 auto!important;'+
      'border:1px solid rgba(255,255,255,.20)!important;border-radius:999px!important;'+
      'padding:6px 10px!important;background:rgba(11,18,31,.86)!important;'+
      'color:#f4f7ff!important;font:800 11px/1.1 system-ui,sans-serif!important;'+
      'box-shadow:0 3px 12px rgba(0,0,0,.28)!important;cursor:pointer!important;'+
      'touch-action:manipulation!important}.'+BUTTON_CLASS+':disabled{opacity:.58!important;cursor:default!important}'+
      '.'+READ_CLASS+'{margin-top:10px!important;border:1px solid rgba(125,211,252,.32)!important;'+
      'border-radius:10px!important;padding:7px 10px!important;background:rgba(14,116,144,.15)!important;'+
      'color:#dff7ff!important;font:800 11px/1.1 system-ui,sans-serif!important;cursor:pointer!important;'+
      'touch-action:manipulation!important}';
    document.head.appendChild(st);
  }

  function init_(){
    style_();

    new MutationObserver(schedule_).observe(
      document.body,
      {childList:true,subtree:true,characterData:true}
    );

    document.addEventListener('click',function(e){
      var target=e.target&&e.target.closest
        ?e.target.closest('[data-soreal-tts-target]')
        :null;
      if(!target)return;
      e.preventDefault();
      e.stopPropagation();
      lireCible_(target.getAttribute('data-soreal-tts-target'));
    },true);

    document.addEventListener('pointerdown',function(){
      if(auto)schedule_();
    },{capture:true,passive:true});

    if(window.speechSynthesis&&'onvoiceschanged' in window.speechSynthesis){
      window.speechSynthesis.addEventListener('voiceschanged',schedule_);
    }
    schedule_();
  }

  var api={
    enabled:function(){return auto;},
    read:function(){lastFingerprint='';readVisible_(true);},
    readTarget:lireCible_,
    readText:function(value,audioSrc){
      var txt=String(value||'').replace(/\s+/g,' ').trim();
      if(!txt)return false;
      lastFingerprint='';
      stop_();
      return readWithAudioFallback_(txt,'__manual_text__',null,true,audioSrc);
    },
    stop:stop_,
    isSpeaking:function(){
      var synth=synth_();
      return Boolean(
        activeReadTarget||
        Boolean(activeAudio)||
        (synth&&(synth.speaking||synth.pending))
      );
    },
    setEnabled:function(value){
      auto=Boolean(value);
      try{localStorage.setItem(KEY,auto?'1':'0');}catch(_){}
      if(!auto&&synth_()){
        stop_();
      }
      lastFingerprint='';
      schedule_();
      return auto;
    }
  };

  window.__SOREAL_IDLE_TUTORIAL_TTS_V205__=api;
  window.__SOREAL_IDLE_TUTORIAL_TTS_V204__=api;
  window.__SOREAL_IDLE_TUTORIAL_TTS_V203__=api;
  window.__SOREAL_IDLE_TUTORIAL_TTS_V202__=api;

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',init_,{once:true});
  }else{
    init_();
  }
})();