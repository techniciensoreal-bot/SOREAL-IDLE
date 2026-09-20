/*
 * SOREAL IDLE — Tutorial / Info TTS V203
 *
 * SpeechSynthesis natif uniquement : aucune voix, aucun modèle et aucun
 * fichier audio ne sont embarqués. Couvre les tutoriels flottants, les
 * modales explicatives et les boutons "Lire ce texte" de Settings > Info.
 */
(function(){
  'use strict';

  if(window.__SOREAL_IDLE_TUTORIAL_TTS_V203__)return;

  var KEY='soreal_idle_tutorial_tts_auto_v202';
  var BUTTON_CLASS='soreal-idle-tuto-tts-v202';
  var READ_CLASS='soreal-idle-tts-read-v203';
  var auto=false;
  var lastFingerprint='';
  var timer=0;

  try{auto=localStorage.getItem(KEY)==='1';}catch(_){}

  function synth_(){
    return window.speechSynthesis||null;
  }

  function supported_(){
    return Boolean(synth_()&&typeof window.SpeechSynthesisUtterance==='function');
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

  function speak_(text,attempt,force){
    if((!force&&!auto)||!text||!supported_())return;
    attempt=Math.max(0,Number(attempt)||0);

    if(audioBusy_()&&attempt<14){
      setTimeout(function(){speak_(text,attempt+1,force);},140);
      return;
    }

    var synth=synth_();
    try{synth.cancel();}catch(_){}

    try{
      var u=new SpeechSynthesisUtterance(text);
      u.lang='fr-BE';
      u.rate=.96;
      u.pitch=.96;
      u.volume=1;
      var voice=voiceFr_(synth);
      if(voice)u.voice=voice;
      synth.speak(u);
    }catch(_){}
  }

  function readVisible_(force){
    var panel=activePanel_();
    if(!visible_(panel))return;

    var txt=text_(panel);
    if(!txt)return;

    if(!force&&txt===lastFingerprint)return;
    lastFingerprint=txt;
    speak_(txt,0,Boolean(force));
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
      try{synth_().cancel();}catch(_){}
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
    var target=document.getElementById(String(targetId||''));
    if(!visible_(target))return false;
    var txt=text_(target);
    if(!txt)return false;
    lastFingerprint='';
    speak_(txt,0,true);
    return true;
  }

  function scan_(){
    renderButton_();
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
    setEnabled:function(value){
      auto=Boolean(value);
      try{localStorage.setItem(KEY,auto?'1':'0');}catch(_){}
      if(!auto&&synth_()){try{synth_().cancel();}catch(_){}}
      lastFingerprint='';
      schedule_();
      return auto;
    }
  };

  window.__SOREAL_IDLE_TUTORIAL_TTS_V203__=api;
  window.__SOREAL_IDLE_TUTORIAL_TTS_V202__=api;

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',init_,{once:true});
  }else{
    init_();
  }
})();