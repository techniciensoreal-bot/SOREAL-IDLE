/*
 * SOREAL IDLE — Local Neural Piper V3
 *
 * Neural TTS executed entirely in the browser with Piper Plus + ONNX Runtime.
 * Une seule voix (Tom, fr_FR-tom-medium), sans choix : demande utilisateur
 * du 2026-09-22 après écoute comparative des voix officielles Piper. Les
 * précédentes versions (V1/V2) exposaient un sélecteur multi-voix
 * (SOREAL/Siwis/Gilles) ; retiré, cf. docs/WORKLOG.md.
 */
import { PiperPlus } from "piper-plus";
import * as ort from "onnxruntime-web";

const LANGUAGE_V1="fr";
const LENGTH_SCALE_V1=1.30;
const NOISE_SCALE_V1=0.55;
const NOISE_W_V1=0.70;
const MODEL_URL_V1=new URL("/api/idle/media/piper-model.onnx",window.location.origin).href;

let enginePromise=null;
let engineInstance=null;
let state={
  status:"idle",
  stage:"",
  progress:0,
  message:"",
  error:""
};
const listeners=new Set();

function snapshot_(){
  return {...state,model:MODEL_URL_V1,language:LANGUAGE_V1};
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

async function engine_(){
  if(enginePromise)return enginePromise;

  setState_({
    status:"loading",
    stage:"initialisation",
    progress:0,
    message:"Initialisation de la voix…",
    error:""
  });

  const promise=PiperPlus.initialize({
    model:MODEL_URL_V1,
    ort,
    onProgress:function(info){
      const stage=String(info&&info.stage||"chargement");
      const progress=progressValue_(info&&info.progress);
      const message=String(info&&info.message||"Chargement de la voix…");
      setState_({
        status:"loading",
        stage,
        progress,
        message,
        error:""
      });
    }
  }).then(function(engine){
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
      message:"Voix prête.",
      error:""
    });
    return engine;
  }).catch(function(error){
    enginePromise=null;
    engineInstance=null;
    const message=String(error&&error.message||error||"PIPER_LOCAL_INIT_FAILED");
    setState_({
      status:"error",
      stage:"error",
      progress:0,
      message:"Impossible de charger la voix.",
      error:message
    });
    throw error;
  });

  enginePromise=promise;
  return promise;
}

async function synthesize_(text){
  const value=String(text||"").replace(/\s+/g," ").trim();
  if(!value)throw new Error("PIPER_LOCAL_TEXT_REQUIRED");

  const engine=await engine_();

  setState_({
    status:"synthesizing",
    stage:"synthesis",
    progress:1,
    message:"Génération de la voix…",
    error:""
  });

  try{
    const result=await engine.synthesize(value,{
      language:LANGUAGE_V1,
      lengthScale:LENGTH_SCALE_V1,
      noiseScale:NOISE_SCALE_V1,
      noiseW:NOISE_W_V1
    });

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
      message:"Voix prête.",
      error:""
    });
    return blob;
  }catch(error){
    const message=String(error&&error.message||error||"PIPER_LOCAL_SYNTHESIS_FAILED");
    setState_({
      status:"error",
      stage:"error",
      progress:1,
      message:"La génération vocale a échoué.",
      error:message
    });
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
  model:MODEL_URL_V1,
  language:LANGUAGE_V1
};

window.__SOREAL_IDLE_LOCAL_NEURAL_V1__=api;
try{
  window.dispatchEvent(new CustomEvent("soreal-idle-local-neural-ready",{detail:snapshot_()}));
}catch(_){}
