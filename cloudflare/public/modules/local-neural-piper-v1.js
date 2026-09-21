/*
 * SOREAL IDLE — Local Neural Piper V2
 *
 * Neural TTS executed entirely in the browser with Piper Plus + ONNX Runtime.
 * The player can select a real French voice model; the selection is persisted
 * locally and models stay browser-cacheable through same-origin proxy routes.
 */
import { PiperPlus } from "piper-plus";
import * as ort from "onnxruntime-web";

const LANGUAGE_V1="fr";
const LENGTH_SCALE_V1=1.30;
const NOISE_SCALE_V1=0.55;
const NOISE_W_V1=0.70;
const VOICE_STORAGE_KEY_V2="soreal_idle_piper_voice_v2";
const DEFAULT_VOICE_ID_V2="soreal";

const VOICES_V2=Object.freeze({
  soreal:Object.freeze({
    id:"soreal",
    label:"SOREAL",
    detail:"Voix actuelle",
    model:new URL("/api/idle/media/piper-voice-soreal.onnx",window.location.origin).href
  }),
  siwis:Object.freeze({
    id:"siwis",
    label:"Siwis",
    detail:"Français · qualité medium",
    model:new URL("/api/idle/media/piper-voice-siwis.onnx",window.location.origin).href
  }),
  gilles:Object.freeze({
    id:"gilles",
    label:"Gilles",
    detail:"Français · voix alternative",
    model:new URL("/api/idle/media/piper-voice-gilles.onnx",window.location.origin).href
  })
});

function savedVoiceId_(){
  try{
    const value=String(localStorage.getItem(VOICE_STORAGE_KEY_V2)||"").trim();
    if(Object.prototype.hasOwnProperty.call(VOICES_V2,value))return value;
  }catch(_){}
  return DEFAULT_VOICE_ID_V2;
}

let selectedVoiceId=savedVoiceId_();
let enginePromise=null;
let engineInstance=null;
let engineGeneration=0;
let state={
  status:"idle",
  stage:"",
  progress:0,
  message:"",
  error:""
};
const listeners=new Set();

function voiceConfig_(){
  return VOICES_V2[selectedVoiceId]||VOICES_V2[DEFAULT_VOICE_ID_V2];
}

function voicePublic_(voice){
  return {
    id:voice.id,
    label:voice.label,
    detail:voice.detail,
    model:voice.model
  };
}

function voices_(){
  return Object.values(VOICES_V2).map(voicePublic_);
}

function snapshot_(){
  const voice=voiceConfig_();
  return {
    ...state,
    model:voice.model,
    language:LANGUAGE_V1,
    voice:voicePublic_(voice),
    voices:voices_()
  };
}

function notify_(){
  const snap=snapshot_();
  for(const fn of listeners){
    try{fn(snap);}catch(_){}
  }
  try{
    window.dispatchEvent(new CustomEvent("soreal-idle-local-neural-state",{detail:snap}));
  }catch(_){}
}

function setState_(patch){
  state={...state,...patch};
  notify_();
}

function progressValue_(value){
  const n=Number(value);
  if(!Number.isFinite(n))return 0;
  return Math.max(0,Math.min(1,n));
}

function disposeEngine_(){
  const engine=engineInstance;
  engineInstance=null;
  enginePromise=null;
  if(engine&&typeof engine.dispose==="function"){
    try{engine.dispose();}catch(_){}
  }
}

function setVoice_(voiceId){
  const id=String(voiceId||"").trim();
  if(!Object.prototype.hasOwnProperty.call(VOICES_V2,id)){
    throw new Error("PIPER_LOCAL_VOICE_UNKNOWN");
  }
  if(id===selectedVoiceId)return snapshot_();

  engineGeneration+=1;
  disposeEngine_();
  selectedVoiceId=id;
  try{localStorage.setItem(VOICE_STORAGE_KEY_V2,id);}catch(_){}
  setState_({
    status:"idle",
    stage:"voice-changed",
    progress:0,
    message:"Voix "+voiceConfig_().label+" sélectionnée.",
    error:""
  });
  return snapshot_();
}

async function engine_(){
  if(enginePromise)return enginePromise;

  const generation=engineGeneration;
  const voice=voiceConfig_();
  setState_({
    status:"loading",
    stage:"initialisation",
    progress:0,
    message:"Initialisation de la voix "+voice.label+"…",
    error:""
  });

  const promise=PiperPlus.initialize({
    model:voice.model,
    ort,
    onProgress:function(info){
      if(generation!==engineGeneration)return;
      const stage=String(info&&info.stage||"chargement");
      const progress=progressValue_(info&&info.progress);
      const message=String(info&&info.message||"Chargement de la voix "+voice.label+"…");
      setState_({
        status:"loading",
        stage,
        progress,
        message,
        error:""
      });
    }
  }).then(function(engine){
    if(generation!==engineGeneration){
      try{if(engine&&typeof engine.dispose==="function")engine.dispose();}catch(_){}
      throw new Error("PIPER_LOCAL_VOICE_CHANGED");
    }
    const config=engine&&engine.config;
    if(config&&config.soreal_monolingual_g2p_compat){
      delete config.language_id_map;
      delete config.num_languages;
      delete config.soreal_monolingual_g2p_compat;
    }
    engineInstance=engine;
    setState_({
      status:"ready",
      stage:"ready",
      progress:1,
      message:"Voix "+voice.label+" prête.",
      error:""
    });
    return engine;
  }).catch(function(error){
    if(generation===engineGeneration){
      enginePromise=null;
      engineInstance=null;
      const message=String(error&&error.message||error||"PIPER_LOCAL_INIT_FAILED");
      setState_({
        status:"error",
        stage:"error",
        progress:0,
        message:"Impossible de charger la voix "+voice.label+".",
        error:message
      });
    }
    throw error;
  });

  enginePromise=promise;
  return promise;
}

async function synthesize_(text){
  const value=String(text||"").replace(/\s+/g," ").trim();
  if(!value)throw new Error("PIPER_LOCAL_TEXT_REQUIRED");

  const voice=voiceConfig_();
  const generation=engineGeneration;
  const engine=await engine_();
  if(generation!==engineGeneration)throw new Error("PIPER_LOCAL_VOICE_CHANGED");

  setState_({
    status:"synthesizing",
    stage:"synthesis",
    progress:1,
    message:"Génération de la voix "+voice.label+"…",
    error:""
  });

  try{
    const result=await engine.synthesize(value,{
      language:LANGUAGE_V1,
      lengthScale:LENGTH_SCALE_V1,
      noiseScale:NOISE_SCALE_V1,
      noiseW:NOISE_W_V1
    });

    if(generation!==engineGeneration)throw new Error("PIPER_LOCAL_VOICE_CHANGED");
    if(!result||typeof result.toBlob!=="function"){
      throw new Error("PIPER_LOCAL_AUDIO_RESULT_INVALID");
    }

    const blob=result.toBlob();
    if(!blob||!blob.size){
      throw new Error("PIPER_LOCAL_AUDIO_EMPTY");
    }

    setState_({
      status:"ready",
      stage:"ready",
      progress:1,
      message:"Voix "+voice.label+" prête.",
      error:""
    });
    return blob;
  }catch(error){
    const message=String(error&&error.message||error||"PIPER_LOCAL_SYNTHESIS_FAILED");
    if(generation===engineGeneration){
      setState_({
        status:"error",
        stage:"error",
        progress:1,
        message:"La génération vocale "+voice.label+" a échoué.",
        error:message
      });
    }
    throw error;
  }
}

function subscribe_(fn){
  if(typeof fn!=="function")return function(){};
  listeners.add(fn);
  try{fn(snapshot_());}catch(_){}
  return function(){listeners.delete(fn);};
}

const api={
  synthesize:synthesize_,
  preload:engine_,
  subscribe:subscribe_,
  state:snapshot_,
  voices:voices_,
  voice:function(){return voicePublic_(voiceConfig_());},
  setVoice:setVoice_,
  language:LANGUAGE_V1
};

Object.defineProperty(api,"model",{
  enumerable:true,
  get:function(){return voiceConfig_().model;}
});

window.__SOREAL_IDLE_LOCAL_NEURAL_V1__=api;
try{
  window.dispatchEvent(new CustomEvent("soreal-idle-local-neural-ready",{detail:snapshot_()}));
}catch(_){}
