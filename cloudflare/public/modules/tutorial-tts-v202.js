/*
 * SOREAL IDLE — Neural narration V210
 *
 * Web Speech / SpeechSynthesis est totalement absent.
 * Lecture : audio pré-généré si mappé, sinon Piper Plus neural local (WASM).
 * Aucun service TTS payant n'est requis et aucun fallback voix système n'existe.
 * Une seule voix (Tom), sans sélecteur : demande utilisateur du 2026-09-22
 * après avoir testé le multi-voix (V9) puis son correctif (V9.1) — cf.
 * docs/WORKLOG.md pour l'historique complet.
 */
(function(){
  'use strict';

  if(window.__SOREAL_IDLE_TUTORIAL_TTS_V209__)return;

  var KEY='soreal_idle_tutorial_tts_auto_v202';
  var BUTTON_CLASS='soreal-idle-tuto-tts-v202';
  var READ_CLASS='soreal-idle-tts-read-v203';
  /*
   * 2026-09-24 : 2000 -> 600 caractères. Avec l'ancienne valeur, un long récit était synthétisé d'un seul bloc (≈ 54 s d'attente
   * mesurées pour 2000 caractères) ; en blocs de fin de phrase, le premier son arrive vite et le bloc suivant est généré pendant
   * la lecture du précédent (voir narrate_).
   */
  var CHUNK_MAX=600;
  /*
   * Pauses demandées par le balisage (Norman, 2026-09-24) : un élément portant data-soreal-tts-pause="ms" est suivi d'un silence de
   * ce nombre de millisecondes (plus long que la pause d'un point). Le texte lu contient un marqueur invisible (caractères de la
   * zone privée) que la découpe transforme en vrai silence entre deux synthèses.
   */
  var PAUSE_OPEN=String.fromCharCode(0xE000);
  var PAUSE_CLOSE=String.fromCharCode(0xE001);
  var PAUSE_MARKER_RE=new RegExp(PAUSE_OPEN+'([0-9]+)'+PAUSE_CLOSE);
  var PAUSE_MAX_MS=5000;
  var auto=false;
  var lastFingerprint='';
  var timer=0;
  var generation=0;
  var activeReadTarget='';
  var activeAudio=null;
  var activeAudioObjectUrl='';
  var activeBufferSource=null;
  var audioContext=null;
  var lastError='';

  try{auto=localStorage.getItem(KEY)==='1';}catch(_){}

  function audioContextCtor_(){
    try{return window.AudioContext||window.webkitAudioContext||null;}catch(_){return null;}
  }

  function audioSupported_(){
    try{
      return (
        typeof window.Audio==='function'&&
        typeof WebAssembly==='object'&&
        Boolean(audioContextCtor_())
      );
    }catch(_){
      return false;
    }
  }

  function supported_(){
    return audioSupported_();
  }

  function ensureAudioContext_(){
    var Ctor=audioContextCtor_();
    if(!Ctor)return null;
    try{
      if(!audioContext||audioContext.state==='closed'){
        audioContext=new Ctor();
      }
      return audioContext;
    }catch(_){
      return null;
    }
  }

  function unlockAudio_(){
    var ctx=ensureAudioContext_();
    if(!ctx)return false;
    try{
      if(ctx.state==='suspended'){
        var resumed=ctx.resume();
        if(resumed&&typeof resumed.catch==='function')resumed.catch(function(){});
      }
      var buffer=ctx.createBuffer(1,1,22050);
      var source=ctx.createBufferSource();
      source.buffer=buffer;
      source.connect(ctx.destination);
      source.start(0);
      return true;
    }catch(_){
      return false;
    }
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

  function revokeObjectUrl_(src){
    if(!src||String(src).indexOf('blob:')!==0)return;
    try{URL.revokeObjectURL(src);}catch(_){}
  }

  function decouperNarration_(value){
    var text=String(value||'').replace(/\s+/g,' ').trim();
    if(!text)return [];
    var phrases=text.match(/[^.!?…]+[.!?…]+|[^.!?…]+$/g)||[text];
    var chunks=[];
    var current='';

    phrases.forEach(function(part){
      var phrase=String(part||'').trim();
      if(!phrase)return;

      while(phrase.length>CHUNK_MAX){
        if(current){
          chunks.push(current);
          current='';
        }
        var cut=phrase.lastIndexOf(' ',CHUNK_MAX);
        if(cut<Math.floor(CHUNK_MAX/4))cut=CHUNK_MAX;
        chunks.push(phrase.slice(0,cut).trim());
        phrase=phrase.slice(cut).trim();
      }

      if(!phrase)return;
      if((current+' '+phrase).trim().length>CHUNK_MAX){
        if(current)chunks.push(current);
        current=phrase;
      }else{
        current=(current+' '+phrase).trim();
      }
    });

    if(current)chunks.push(current);
    return chunks;
  }

  /*
   * Texte (avec marqueurs de pause) -> étapes de lecture : {chunk:'…'} pour une synthèse, {pause:ms} pour un silence.
   * Une pause n'est gardée qu'entre deux textes (jamais en tête ni en fin de lecture).
   */
  function planNarration_(value){
    var parts=String(value||'').split(new RegExp(PAUSE_OPEN+'([0-9]+)'+PAUSE_CLOSE));
    var steps=[];
    for(var i=0;i<parts.length;i+=1){
      if(i%2===1){
        var ms=Math.max(0,Math.min(PAUSE_MAX_MS,parseInt(parts[i],10)||0));
        if(ms>0&&steps.length&&steps[steps.length-1].pause==null)steps.push({pause:ms});
        continue;
      }
      decouperNarration_(parts[i]).forEach(function(chunk){steps.push({chunk:chunk});});
    }
    while(steps.length&&steps[steps.length-1].pause!=null)steps.pop();
    return steps;
  }

  function updateReadButtons_(){
    document.querySelectorAll('.'+READ_CLASS+'[data-soreal-tts-target]').forEach(function(button){
      if(!button.dataset.sorealTtsOriginalLabel){
        button.dataset.sorealTtsOriginalLabel=String(button.textContent||'🔊 Lire ce texte');
      }
      var target=String(button.getAttribute('data-soreal-tts-target')||'');
      var active=Boolean(activeReadTarget&&target===activeReadTarget);
      button.dataset.sorealTtsReading=active?'1':'0';
      button.textContent=active
        ?'⏹ Arrêter la narration'
        :button.dataset.sorealTtsOriginalLabel;
    });
  }

  function afficherErreur_(message,targetId){
    lastError=String(message||'VOIX_IA_INDISPONIBLE');
    console.error('SOREAL IDLE narration neurale:',lastError);
    if(targetId){
      document.querySelectorAll('.'+READ_CLASS+'[data-soreal-tts-target]').forEach(function(button){
        if(String(button.getAttribute('data-soreal-tts-target')||'')!==String(targetId))return;
        if(!button.dataset.sorealTtsOriginalLabel){
          button.dataset.sorealTtsOriginalLabel=String(button.textContent||'🔊 Lire ce texte');
        }
        button.textContent='⚠️ Voix IA · '+lastError.slice(0,32);
        button.title='Erreur voix IA : '+lastError;
        setTimeout(function(){
          if(button&&button.isConnected&&button.dataset.sorealTtsReading!=='1'){
            button.textContent=button.dataset.sorealTtsOriginalLabel;
          }
        },3500);
      });
    }
  }

  function stop_(){
    generation+=1;
    activeReadTarget='';
    lastFingerprint='';

    var audio=activeAudio;
    activeAudio=null;
    if(audio){
      try{audio.onended=null;audio.onerror=null;}catch(_){}
      try{audio.pause();}catch(_){}
      try{audio.currentTime=0;}catch(_){}
    }

    var source=activeBufferSource;
    activeBufferSource=null;
    if(source){
      try{source.onended=null;}catch(_){}
      try{source.stop(0);}catch(_){}
      try{source.disconnect();}catch(_){}
    }

    var objectUrl=activeAudioObjectUrl;
    activeAudioObjectUrl='';
    revokeObjectUrl_(objectUrl);
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
    clone.querySelectorAll('[data-soreal-tts-pause]').forEach(function(el){
      var ms=Math.max(0,Math.min(PAUSE_MAX_MS,parseInt(el.getAttribute('data-soreal-tts-pause'),10)||0));
      if(ms>0&&el.parentNode){
        el.parentNode.insertBefore(document.createTextNode(' '+PAUSE_OPEN+ms+PAUSE_CLOSE+' '),el.nextSibling);
      }
    });
    clone.querySelectorAll(
      'button,input,select,textarea,script,style,.'
      +BUTTON_CLASS+',.'+READ_CLASS+
      ',[aria-hidden="true"],[data-soreal-tts-ignore],[data-soreal-tts-target]'
    ).forEach(function(el){el.remove();});
    return String(clone.textContent||'').replace(/\s+/g,' ').trim();
  }

  function localNeuralApi_(){
    try{return window.__SOREAL_IDLE_LOCAL_NEURAL_V1__||null;}catch(_){return null;}
  }

  function waitLocalNeuralApi_(){
    var direct=localNeuralApi_();
    if(direct)return Promise.resolve(direct);

    return new Promise(function(resolve,reject){
      var done=false;
      var timer=setTimeout(function(){
        if(done)return;
        done=true;
        window.removeEventListener('soreal-idle-local-neural-ready',ready_);
        reject(new Error('PIPER_LOCAL_MODULE_TIMEOUT'));
      },15000);

      function ready_(){
        if(done)return;
        var api=localNeuralApi_();
        if(!api)return;
        done=true;
        clearTimeout(timer);
        window.removeEventListener('soreal-idle-local-neural-ready',ready_);
        resolve(api);
      }

      window.addEventListener('soreal-idle-local-neural-ready',ready_);
      ready_();
    });
  }

  function afficherProgressionLocale_(state,targetId){
    if(!targetId||!state)return;
    document.querySelectorAll('.'+READ_CLASS+'[data-soreal-tts-target]').forEach(function(button){
      if(String(button.getAttribute('data-soreal-tts-target')||'')!==String(targetId))return;
      if(button.dataset.sorealTtsReading!=='1')return;

      var status=String(state.status||'');
      if(status==='loading'){
        var pct=Math.round(Math.max(0,Math.min(1,Number(state.progress)||0))*100);
        button.textContent=pct>0
          ?'⏳ Chargement voix IA '+pct+' %'
          :'⏳ Chargement voix IA…';
      }else if(status==='synthesizing'){
        button.textContent='⏳ Génération voix IA…';
      }
    });
  }

  function requestLocalNeuralAudio_(text,targetId,expectedGeneration,silent){
    return waitLocalNeuralApi_().then(function(api){
      if(expectedGeneration!==generation)throw new Error('NARRATION_ANNULEE');
      if(!api||typeof api.synthesize!=='function'){
        throw new Error('PIPER_LOCAL_API_INDISPONIBLE');
      }

      var unsubscribe=typeof api.subscribe==='function'&&!silent
        ?api.subscribe(function(state){
          if(expectedGeneration===generation){
            afficherProgressionLocale_(state,targetId);
          }
        })
        :function(){};

      return Promise.resolve(api.synthesize(String(text||'')))
        .then(function(blob){
          if(expectedGeneration!==generation)throw new Error('NARRATION_ANNULEE');
          if(!blob||!blob.size)throw new Error('PIPER_LOCAL_AUDIO_VIDE');
          return blob;
        })
        .finally(function(){
          try{unsubscribe();}catch(_){}
        });
    });
  }

  function playBlobWebAudioPromise_(blob,targetId,expectedGeneration){
    return new Promise(function(resolve,reject){
      if(!blob||!blob.size||expectedGeneration!==generation){
        reject(new Error('NARRATION_ANNULEE'));
        return;
      }

      var ctx=ensureAudioContext_();
      if(!ctx){
        reject(new Error('WEB_AUDIO_INDISPONIBLE'));
        return;
      }

      Promise.resolve(
        ctx.state==='suspended'?ctx.resume():undefined
      ).then(function(){
        if(expectedGeneration!==generation)throw new Error('NARRATION_ANNULEE');
        if(ctx.state!=='running')throw new Error('WEB_AUDIO_BLOQUE_'+String(ctx.state||'unknown').toUpperCase());
        return blob.arrayBuffer();
      }).then(function(bytes){
        if(expectedGeneration!==generation)throw new Error('NARRATION_ANNULEE');
        return ctx.decodeAudioData(bytes.slice(0));
      }).then(function(buffer){
        if(expectedGeneration!==generation)throw new Error('NARRATION_ANNULEE');
        var source=ctx.createBufferSource();
        source.buffer=buffer;
        source.connect(ctx.destination);
        activeBufferSource=source;

        var done=false;
        function clear_(){
          if(activeBufferSource===source)activeBufferSource=null;
          try{source.disconnect();}catch(_){}
        }

        source.onended=function(){
          if(done)return;
          done=true;
          clear_();
          resolve(true);
        };

        try{
          source.start(0);
        }catch(error){
          if(done)return;
          done=true;
          clear_();
          reject(error||new Error('WEB_AUDIO_START_ECHOUE'));
        }
      }).catch(reject);
    });
  }

  function playAudioPromise_(src,targetId,expectedGeneration){
    return new Promise(function(resolve,reject){
      if(!src||expectedGeneration!==generation){
        revokeObjectUrl_(src);
        reject(new Error('NARRATION_ANNULEE'));
        return;
      }

      var audio;
      try{
        audio=new Audio(src);
        audio.preload='auto';
      }catch(_){
        revokeObjectUrl_(src);
        reject(new Error('AUDIO_CREATION_ECHOUEE'));
        return;
      }

      activeAudio=audio;
      activeAudioObjectUrl=String(src).indexOf('blob:')===0?String(src):'';

      var done=false;
      function clear_(){
        if(activeAudio===audio)activeAudio=null;
        if(activeAudioObjectUrl===src)activeAudioObjectUrl='';
        revokeObjectUrl_(src);
      }
      audio.onended=function(){
        if(done)return;
        done=true;
        clear_();
        resolve(true);
      };
      audio.onerror=function(){
        if(done)return;
        done=true;
        clear_();
        reject(new Error('LECTURE_AUDIO_ECHOUEE'));
      };

      try{
        var started=audio.play();
        if(started&&typeof started.catch==='function'){
          started.catch(function(error){
            if(done)return;
            done=true;
            clear_();
            reject(error||new Error('LECTURE_AUDIO_REFUSEE'));
          });
        }
      }catch(error){
        if(done)return;
        done=true;
        clear_();
        reject(error||new Error('LECTURE_AUDIO_REFUSEE'));
      }
    });
  }

  function narrate_(text,targetId,target,force,explicitSource){
    if((!force&&!auto)||!text||!supported_())return false;

    stop_();
    var myGeneration=generation;
    lastError='';
    activeReadTarget=String(targetId||'__manual_text__');
    updateReadButtons_();

    var mapped=audioSourceFor_(targetId,target,explicitSource);
    var task;

    if(mapped){
      task=playAudioPromise_(mapped,targetId,myGeneration);
    }else{
      /*
       * Étapes = synthèses et silences (voir planNarration_). Le bloc suivant est généré PENDANT la lecture du précédent
       * (préchargement d'un seul bloc d'avance) : les silences demandés ne sont plus noyés dans le temps de génération.
       * Seule l'étape attendue affiche sa progression sur le bouton.
       */
      var steps=planNarration_(text);
      var blobs={};
      var idCible=String(targetId||'__manual_text__');
      var prochainTexte=function(from){
        for(var k=from;k<steps.length;k+=1){
          if(steps[k].pause==null)return k;
        }
        return -1;
      };
      var assurer=function(i,silent){
        if(i<0||i>=steps.length)return null;
        if(!blobs[i]){
          blobs[i]=requestLocalNeuralAudio_(steps[i].chunk,idCible,myGeneration,silent);
          blobs[i].catch(function(){});
        }
        return blobs[i];
      };
      var attendre=function(ms){
        return new Promise(function(resolve){setTimeout(resolve,ms);});
      };
      var jouer=function(i){
        if(i>=steps.length)return Promise.resolve();
        if(myGeneration!==generation)return Promise.reject(new Error('NARRATION_ANNULEE'));
        var etape=steps[i];
        if(etape.pause!=null){
          assurer(prochainTexte(i+1),true);
          return attendre(etape.pause).then(function(){return jouer(i+1);});
        }
        return assurer(i,false).then(function(blob){
          assurer(prochainTexte(i+1),true);
          return playBlobWebAudioPromise_(blob,targetId,myGeneration);
        }).then(function(){return jouer(i+1);});
      };
      task=jouer(0);
    }

    task.then(function(){
      if(myGeneration!==generation)return;
      activeReadTarget='';
      updateReadButtons_();
    }).catch(function(error){
      if(myGeneration!==generation)return;
      activeReadTarget='';
      lastFingerprint='';
      updateReadButtons_();
      var message=String(error&&error.message||error||'VOIX_IA_INDISPONIBLE');
      if(message!=='NARRATION_ANNULEE')afficherErreur_(message,targetId);
    });

    return true;
  }

  function readVisible_(force){
    var panel=activePanel_();
    if(!visible_(panel))return false;
    var txt=text_(panel);
    if(!txt)return false;
    if(!force&&txt===lastFingerprint)return false;
    lastFingerprint=txt;
    return narrate_(txt,String(panel.id||''),panel,Boolean(force));
  }

  function updateButton_(button){
    if(!button)return;
    if(!supported_()){
      button.disabled=true;
      button.textContent='🔇 Voix IA indisponible';
      button.title='La lecture audio neurale n’est pas disponible sur cet appareil.';
      return;
    }
    button.disabled=false;
    var label=auto?'🔊 Voix IA auto ON':'🔈 Voix IA auto OFF';
    if(button.textContent!==label)button.textContent=label;
    button.title=auto
      ?'Désactiver la narration neurale automatique'
      :'Activer la narration neurale automatique';
  }

  function toggleAuto_(e){
    if(e){
      e.preventDefault();
      e.stopPropagation();
    }
    if(!supported_())return;
    unlockAudio_();
    auto=!auto;
    try{localStorage.setItem(KEY,auto?'1':'0');}catch(_){}
    if(!auto)stop_();
    else{
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
    unlockAudio_();
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
    return narrate_(txt,id,target,true);
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
    schedule_();
  }

  var api={
    enabled:function(){return auto;},
    read:function(){lastFingerprint='';return readVisible_(true);},
    readTarget:lireCible_,
    readText:function(value,audioSrc){
      var txt=String(value||'').replace(/\s+/g,' ').trim();
      if(!txt)return false;
      lastFingerprint='';
      return narrate_(txt,'__manual_text__',null,true,audioSrc);
    },
    stop:stop_,
    isSpeaking:function(){
      return Boolean(activeReadTarget||activeAudio||activeBufferSource);
    },
    lastError:function(){return lastError;},
    audioState:function(){return audioContext?String(audioContext.state||'unknown'):'none';},
    setEnabled:function(value){
      auto=Boolean(value);
      try{localStorage.setItem(KEY,auto?'1':'0');}catch(_){}
      if(!auto)stop_();
      lastFingerprint='';
      schedule_();
      return auto;
    }
  };

  window.__SOREAL_IDLE_TUTORIAL_TTS_V209__=api;
  window.__SOREAL_IDLE_TUTORIAL_TTS_V208__=api;
  window.__SOREAL_IDLE_TUTORIAL_TTS_V207__=api;
  window.__SOREAL_IDLE_TUTORIAL_TTS_V206__=api;
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
