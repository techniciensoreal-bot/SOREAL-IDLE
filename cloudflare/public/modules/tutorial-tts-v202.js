/*
 * SOREAL IDLE — Tutorial TTS V202
 *
 * Lecture vocale légère des panneaux explicatifs via l'API
 * SpeechSynthesis fournie par le navigateur / la WebView.
 * Aucun modèle, aucune voix et aucun fichier audio embarqué.
 */
(function(){
  'use strict';

  if(window.__SOREAL_IDLE_TUTORIAL_TTS_V202__)return;

  var KEY='soreal_idle_tutorial_tts_auto_v202';
  var BUTTON_CLASS='soreal-idle-tuto-tts-v202';
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

  function handle_(){
    return document.querySelector('.soreal-idle-tuto-flottant-drag-v1');
  }

  function panel_(){
    var h=handle_();
    return h&&h.parentElement?h.parentElement:null;
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
      +BUTTON_CLASS+',[aria-hidden="true"],[data-soreal-tts-ignore]'
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

  function speak_(text,attempt){
    if(!auto||!text||!supported_())return;
    attempt=Math.max(0,Number(attempt)||0);

    if(audioBusy_()&&attempt<12){
      setTimeout(function(){speak_(text,attempt+1);},160);
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
    var panel=panel_();
    if(!visible_(panel))return;

    var text=text_(panel);
    if(!text)return;

    var fingerprint=text;
    if(!force&&fingerprint===lastFingerprint)return;
    lastFingerprint=fingerprint;
    speak_(text,0);
  }

  function renderButton_(){
    var h=handle_();
    if(!h)return;

    var button=h.querySelector('.'+BUTTON_CLASS);
    if(!button){
      button=document.createElement('button');
      button.type='button';
      button.className=BUTTON_CLASS;
      button.setAttribute('data-soreal-tts-ignore','1');
      button.addEventListener('pointerdown',function(e){e.stopPropagation();});
      button.addEventListener('touchstart',function(e){e.stopPropagation();},{passive:true});
      button.addEventListener('mousedown',function(e){e.stopPropagation();});
      button.addEventListener('click',function(e){
        e.preventDefault();
        e.stopPropagation();

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
      });
      h.appendChild(button);
    }

    if(!supported_()){
      button.disabled=true;
      button.textContent='🔇 TTS indisponible';
      button.title='La lecture vocale système n’est pas disponible sur cet appareil.';
    }else{
      button.disabled=false;
      button.textContent=auto?'🔊 Lecture auto ON':'🔈 Lecture auto OFF';
      button.title=auto
        ?'Désactiver la lecture automatique des panneaux explicatifs'
        :'Activer la lecture automatique des panneaux explicatifs';
    }
  }

  function scan_(){
    renderButton_();
    if(auto)readVisible_(false);
  }

  function schedule_(){
    clearTimeout(timer);
    timer=setTimeout(scan_,80);
  }

  function style_(){
    if(document.getElementById('soreal-idle-tuto-tts-v202-style'))return;
    var st=document.createElement('style');
    st.id='soreal-idle-tuto-tts-v202-style';
    st.textContent=
      '.'+BUTTON_CLASS+'{margin-left:auto!important;flex:0 0 auto!important;'+
      'border:1px solid rgba(255,255,255,.20)!important;border-radius:999px!important;'+
      'padding:6px 10px!important;background:rgba(11,18,31,.86)!important;'+
      'color:#f4f7ff!important;font:800 11px/1.1 system-ui,sans-serif!important;'+
      'box-shadow:0 3px 12px rgba(0,0,0,.28)!important;cursor:pointer!important;'+
      'touch-action:manipulation!important}.'+BUTTON_CLASS+':disabled{opacity:.58!important;cursor:default!important}';
    document.head.appendChild(st);
  }

  function init_(){
    style_();
    new MutationObserver(schedule_).observe(document.body,{childList:true,subtree:true,characterData:true});
    document.addEventListener('pointerdown',function(){
      if(auto)schedule_();
    },{capture:true,passive:true});
    if(window.speechSynthesis&&'onvoiceschanged' in window.speechSynthesis){
      window.speechSynthesis.addEventListener('voiceschanged',schedule_);
    }
    schedule_();
  }

  window.__SOREAL_IDLE_TUTORIAL_TTS_V202__={
    enabled:function(){return auto;},
    read:function(){lastFingerprint='';readVisible_(true);},
    setEnabled:function(value){
      auto=Boolean(value);
      try{localStorage.setItem(KEY,auto?'1':'0');}catch(_){}
      if(!auto&&synth_()){try{synth_().cancel();}catch(_){}}
      lastFingerprint='';
      schedule_();
      return auto;
    }
  };

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',init_,{once:true});
  }else{
    init_();
  }
})();