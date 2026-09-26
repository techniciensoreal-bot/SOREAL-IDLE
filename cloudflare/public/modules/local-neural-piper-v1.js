/*
 * SOREAL IDLE — Local Neural Piper V4
 *
 * Neural TTS exécutée entièrement dans le navigateur : phonémisation par
 * le vrai espeak-ng (WASM, @diffusionstudio/piper-wasm — le même outil
 * piper_phonemize utilisé pour entraîner les voix officielles) suivie
 * d'une inférence ONNX manuelle sur le modèle Piper officiel
 * fr_FR-tom-medium. Remplace piper-plus (V1-V3) : son phonémiseur maison
 * (non espeak) produisait des phonèmes incompatibles avec les modèles
 * Piper officiels, d'où l'accent étranger et la prononciation erronée
 * observés sur toutes les voix testées — cf. docs/WORKLOG.md (2026-09-22).
 */
import * as ort from "onnxruntime-web";

const MODEL_URL_V1=new URL("/api/idle/media/piper-model.onnx",window.location.origin).href;
const MODEL_CONFIG_URL_V1=MODEL_URL_V1+".json";
const PIPER_PHONEMIZE_WASM_URL_V1="https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize.wasm";
const PIPER_PHONEMIZE_DATA_URL_V1="https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/piper_phonemize.data";

const DEFAULT_NOISE_SCALE_V1=0.667;
const DEFAULT_LENGTH_SCALE_V1=1.0;
const DEFAULT_NOISE_W_V1=0.8;

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
  return {...state,model:MODEL_URL_V1};
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

async function fetchModelWithProgress_(onProgress){
  const response=await fetch(MODEL_URL_V1);
  if(!response.ok||!response.body){
    throw new Error("PIPER_LOCAL_MODEL_FETCH_FAILED_"+response.status);
  }
  const totalHeader=response.headers.get("content-length");
  const total=totalHeader?Number(totalHeader):0;
  const reader=response.body.getReader();
  const chunks=[];
  let received=0;
  for(;;){
    const step=await reader.read();
    if(step.done)break;
    chunks.push(step.value);
    received+=step.value.length;
    if(typeof onProgress==="function"&&total>0){
      onProgress(Math.max(0,Math.min(1,received/total)));
    }
  }
  const buffer=new Uint8Array(received);
  let offset=0;
  for(const chunk of chunks){
    buffer.set(chunk,offset);
    offset+=chunk.length;
  }
  return buffer.buffer;
}

/*
 * 2026-09-24 (Norman : « Voix ia - 1060760 ») : le phonémiseur espeak-ng (WASM) lève une exception C++ que JavaScript ne voit
 * que comme un NOMBRE (un pointeur mémoire, d'où « 1060760 » affiché tel quel) dès que le texte contient un demi-caractère
 * UTF-16 isolé (moitié d'emoji coupée par un découpage ou une troncature). Reproduit en direct sur la version déployée :
 * "\ud83d" et "x\ude00y" lèvent, alors que les emojis entiers, les espaces insécables et les 800 premiers caractères
 * Unicode passent. On remplace donc tout demi-caractère isolé et tout caractère de contrôle par une espace avant de phonémiser.
 */
function sanitizeText_(text){
  const source=String(text==null?"":text);
  let out="";
  for(let i=0;i<source.length;i++){
    const code=source.charCodeAt(i);
    if(code>=0xD800&&code<=0xDBFF){
      const next=source.charCodeAt(i+1);
      if(next>=0xDC00&&next<=0xDFFF){
        out+=source[i]+source[i+1];
        i+=1;
      }else{
        out+=" ";
      }
    }else if(code>=0xDC00&&code<=0xDFFF){
      out+=" ";
    }else if(code<0x20||code===0x7F){
      out+=" ";
    }else{
      out+=source[i];
    }
  }
  return out.replace(/\s+/g," ").trim();
}

/* Une exception C++ du WASM arrive comme un nombre : on la rend lisible au lieu d'afficher « 1060760 ». */
function wasmError_(error,label){
  if(error instanceof Error)return error;
  if(typeof error==="number")return new Error(label+"_EXCEPTION_WASM_"+error);
  return new Error(String(error&&error.message||error||label));
}

async function phonemize_(text,espeakVoice){
  if(typeof window.createPiperPhonemize!=="function"){
    throw new Error("PIPER_LOCAL_PHONEMIZER_UNAVAILABLE");
  }
  return await new Promise(function(resolve,reject){
    window.createPiperPhonemize({
      print:function(data){
        try{
          const parsed=JSON.parse(data);
          const ids=parsed&&parsed.phoneme_ids;
          if(!Array.isArray(ids)||!ids.length){
            reject(new Error("PIPER_LOCAL_PHONEMIZE_EMPTY"));
            return;
          }
          resolve(ids);
        }catch(error){
          reject(error);
        }
      },
      printErr:function(message){
        reject(new Error(String(message||"PIPER_LOCAL_PHONEMIZE_FAILED")));
      },
      locateFile:function(url){
        if(url.endsWith(".wasm"))return PIPER_PHONEMIZE_WASM_URL_V1;
        if(url.endsWith(".data"))return PIPER_PHONEMIZE_DATA_URL_V1;
        return url;
      }
    }).then(function(module){
      module.callMain([
        "-l",espeakVoice,
        "--input",JSON.stringify([{text:sanitizeText_(text)}]),
        "--espeak_data","/espeak-ng-data"
      ]);
    }).catch(function(error){
      reject(wasmError_(error,"PIPER_LOCAL_PHONEMIZE"));
    });
  });
}

function pcm2wav_(pcm,sampleRate){
  const numSamples=pcm.length;
  const buffer=new ArrayBuffer(44+numSamples*2);
  const view=new DataView(buffer);
  function writeString(offset,str){
    for(let i=0;i<str.length;i++)view.setUint8(offset+i,str.charCodeAt(i));
  }
  writeString(0,"RIFF");
  view.setUint32(4,36+numSamples*2,true);
  writeString(8,"WAVE");
  writeString(12,"fmt ");
  view.setUint32(16,16,true);
  view.setUint16(20,1,true);
  view.setUint16(22,1,true);
  view.setUint32(24,sampleRate,true);
  view.setUint32(28,sampleRate*2,true);
  view.setUint16(32,2,true);
  view.setUint16(34,16,true);
  writeString(36,"data");
  view.setUint32(40,numSamples*2,true);
  let offset=44;
  for(let i=0;i<numSamples;i++){
    const s=Math.max(-1,Math.min(1,pcm[i]));
    view.setInt16(offset,s<0?s*0x8000:s*0x7fff,true);
    offset+=2;
  }
  return buffer;
}

async function engine_(){
  if(enginePromise)return enginePromise;

  setState_({
    status:"loading",
    stage:"config",
    progress:0,
    message:"Chargement de la configuration vocale…",
    error:""
  });

  const promise=(async function(){
    const configResponse=await fetch(MODEL_CONFIG_URL_V1);
    if(!configResponse.ok){
      throw new Error("PIPER_LOCAL_CONFIG_FETCH_FAILED_"+configResponse.status);
    }
    const config=await configResponse.json();

    setState_({
      status:"loading",
      stage:"model",
      progress:0,
      message:"Téléchargement de la voix…",
      error:""
    });
    const modelBuffer=await fetchModelWithProgress_(function(progress){
      setState_({
        status:"loading",
        stage:"model",
        progress,
        message:"Téléchargement de la voix…",
        error:""
      });
    });

    setState_({
      status:"loading",
      stage:"session",
      progress:1,
      message:"Préparation de la voix…",
      error:""
    });
    const session=await ort.InferenceSession.create(modelBuffer);

    const engine={config,session};
    engineInstance=engine;
    setState_({
      status:"ready",
      stage:"ready",
      progress:1,
      message:"Voix prête.",
      error:""
    });
    return engine;
  })().catch(function(error){
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

/*
 * espeak-ng (via piper_phonemize) abandonne silencieusement "..."/"…" :
 * aucun phonème de pause n'est généré (contrairement à "." ou ","),
 * vérifié en comparant les flux de phonèmes bruts en conditions réelles.
 * On normalise donc vers "." (dont la pause fonctionne) avant phonémisation.
 */
function normalizeEllipsis_(text){
  /* Norman (2026-09-26) : la pause d'un « … » doit valoir « . + . » : deux points, donc deux pauses de point. */
  return text.replace(/\.{2,}|…/g,". .");
}

/*
 * Prononciation (Norman, 2026-09-26) : « Norman » est dit « Normand » : on écrit « Normanne » ; « Fight Boss » est mal lu : « Faïte Bosse ».
 * Appliqué au texte envoyé à la synthèse seulement : l'empreinte des blocs (donc le mapping des fichiers audio) ne change pas.
 */
var PRONONCIATIONS_=[
  [/\bNorman\b/g,"Normanne"],
  [/\bFight Boss\b/gi,"Faïte Bosse"],
  [/\bFight\b/g,"Faïte"]
];
function normalizePronunciation_(text){
  var t=String(text);
  for(var i=0;i<PRONONCIATIONS_.length;i++)t=t.replace(PRONONCIATIONS_[i][0],PRONONCIATIONS_[i][1]);
  return t;
}

/*
 * Astérisques (2026-09-26, Norman : « il prononce astérisque ») : *BLOUM* est un bruitage, pas du texte à épeler. Le mot entre astérisques
 * est lu comme un mot (majuscules ramenées à « Bloum ») suivi d'une pause ; tout astérisque restant est supprimé.
 */
function normalizeAsterisks_(text){
  return text
    .replace(/\*([^*\n]+)\*/g,function(_,inner){
      var mot=String(inner).trim();
      if(!mot)return " ";
      /* Bruitage tout en majuscules : un mot, puis une pause. Simple mise en valeur : le mot tel quel. */
      if(mot===mot.toUpperCase()&&mot!==mot.toLowerCase()){
        mot=mot.charAt(0)+mot.slice(1).toLowerCase();
        return /[.!?…]$/.test(mot)?mot+" ":mot+". ";
      }
      return mot+" ";
    })
    .replace(/\*/g," ")
    .replace(/\s+/g," ")
    .trim();
}

async function synthesize_(text){
  const value=normalizeEllipsis_(normalizeAsterisks_(normalizePronunciation_(sanitizeText_(text))));
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
    const config=engine.config||{};
    const espeakVoice=(config.espeak&&config.espeak.voice)||"fr";
    const phonemeIds=await phonemize_(value,espeakVoice);

    const sampleRate=(config.audio&&config.audio.sample_rate)||22050;
    const inference=config.inference||{};
    const noiseScale=inference.noise_scale!=null?inference.noise_scale:DEFAULT_NOISE_SCALE_V1;
    const lengthScale=inference.length_scale!=null?inference.length_scale:DEFAULT_LENGTH_SCALE_V1;
    const noiseW=inference.noise_w!=null?inference.noise_w:DEFAULT_NOISE_W_V1;

    const feeds={
      input:new ort.Tensor("int64",BigInt64Array.from(phonemeIds.map(BigInt)),[1,phonemeIds.length]),
      input_lengths:new ort.Tensor("int64",BigInt64Array.from([BigInt(phonemeIds.length)]),[1]),
      scales:new ort.Tensor("float32",Float32Array.from([noiseScale,lengthScale,noiseW]),[3])
    };

    let results;
    try{
      results=await engine.session.run(feeds);
    }catch(error){
      throw wasmError_(error,"PIPER_LOCAL_INFERENCE");
    }
    const outputName=engine.session.outputNames[0];
    const pcm=results[outputName]&&results[outputName].data;
    if(!pcm||!pcm.length){
      throw new Error("PIPER_LOCAL_AUDIO_EMPTY");
    }

    const wavBuffer=pcm2wav_(pcm,sampleRate);
    const blob=new Blob([wavBuffer],{type:"audio/wav"});
    if(!blob.size){
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
  model:MODEL_URL_V1
};

window.__SOREAL_IDLE_LOCAL_NEURAL_V1__=api;
try{
  window.dispatchEvent(new CustomEvent("soreal-idle-local-neural-ready",{detail:snapshot_()}));
}catch(_){}
