const IDLE_NARRATION_MODEL_V1="@cf/myshell-ai/melotts";
const IDLE_NARRATION_LANG_V1="fr";
const IDLE_NARRATION_R2_PREFIX_V1="idle/narration/v1/fr/";
const IDLE_NARRATION_MAX_CHARS_V1=3500;

function narrationJsonV1(payload,status=200){
  return new Response(JSON.stringify(payload),{
    status,
    headers:{
      "content-type":"application/json; charset=utf-8",
      "cache-control":"no-store"
    }
  });
}

function normaliserTexteNarrationV1(value){
  return String(value||"").replace(/\s+/g," ").trim();
}

function normaliserCibleNarrationV1(value){
  const target=String(value||"").trim();
  return /^[A-Za-z0-9_.:-]{1,160}$/.test(target)?target:"";
}

async function hashNarrationV1(text){
  const source=IDLE_NARRATION_MODEL_V1+"\n"+IDLE_NARRATION_LANG_V1+"\n"+text;
  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(source));
  return Array.from(new Uint8Array(digest))
    .map(value=>value.toString(16).padStart(2,"0"))
    .join("");
}

async function bytesDepuisResultatAiV1(result){
  if(result instanceof Response){
    if(!result.ok){
      throw new Error("IDLE_NARRATION_AI_HTTP_"+result.status);
    }
    return result.arrayBuffer();
  }
  if(result instanceof ArrayBuffer)return result;
  if(ArrayBuffer.isView(result)){
    return result.buffer.slice(result.byteOffset,result.byteOffset+result.byteLength);
  }
  if(typeof ReadableStream!=="undefined"&&result instanceof ReadableStream){
    return new Response(result).arrayBuffer();
  }
  if(result&&typeof result==="object"){
    if(result.audio instanceof ArrayBuffer)return result.audio;
    if(ArrayBuffer.isView(result.audio)){
      return result.audio.buffer.slice(result.audio.byteOffset,result.audio.byteOffset+result.audio.byteLength);
    }
    if(typeof result.audio==="string"&&result.audio){
      const binary=atob(result.audio);
      const bytes=new Uint8Array(binary.length);
      for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
      return bytes.buffer;
    }
  }
  throw new Error("IDLE_NARRATION_AI_FORMAT_UNSUPPORTED");
}

function reponseAudioNarrationV1(body,cacheStatus,key){
  return new Response(body,{
    status:200,
    headers:{
      "content-type":"audio/mpeg",
      "cache-control":"private, max-age=86400",
      "x-soreal-idle-narration-cache":cacheStatus,
      "x-soreal-idle-narration-key":key
    }
  });
}

export async function traiterNarrationIdleV1(request,env){
  if(request.method!=="POST"){
    return new Response("Méthode non autorisée",{
      status:405,
      headers:{allow:"POST","cache-control":"no-store"}
    });
  }

  const body=await request.json().catch(()=>null);
  const text=normaliserTexteNarrationV1(body?.text);
  const targetId=normaliserCibleNarrationV1(body?.targetId);

  if(!text){
    return narrationJsonV1({ok:false,error:"IDLE_NARRATION_TEXT_REQUIRED"},400);
  }
  if(text.length>IDLE_NARRATION_MAX_CHARS_V1){
    return narrationJsonV1({
      ok:false,
      error:"IDLE_NARRATION_TEXT_TOO_LONG",
      maxChars:IDLE_NARRATION_MAX_CHARS_V1
    },413);
  }
  if(!targetId){
    return narrationJsonV1({ok:false,error:"IDLE_NARRATION_TARGET_REQUIRED"},400);
  }

  const hash=await hashNarrationV1(text);
  const key=IDLE_NARRATION_R2_PREFIX_V1+hash+".mp3";

  if(env?.SOREAL_R2&&typeof env.SOREAL_R2.get==="function"){
    const cached=await env.SOREAL_R2.get(key);
    if(cached){
      return reponseAudioNarrationV1(cached.body,"HIT",key);
    }
  }

  if(!env?.AI||typeof env.AI.run!=="function"){
    return narrationJsonV1({ok:false,error:"IDLE_NARRATION_AI_UNAVAILABLE"},503);
  }

  let result;
  try{
    result=await env.AI.run(
      IDLE_NARRATION_MODEL_V1,
      {prompt:text,lang:IDLE_NARRATION_LANG_V1},
      {returnRawResponse:true,rejectIfBusy:true}
    );
  }catch(error){
    return narrationJsonV1({
      ok:false,
      error:"IDLE_NARRATION_AI_FAILED",
      message:String(error?.message||error||"").slice(0,240)
    },503);
  }

  let audio;
  try{
    audio=await bytesDepuisResultatAiV1(result);
  }catch(error){
    return narrationJsonV1({
      ok:false,
      error:"IDLE_NARRATION_AI_FORMAT_UNSUPPORTED",
      message:String(error?.message||error||"").slice(0,240)
    },502);
  }

  if(!audio||!audio.byteLength){
    return narrationJsonV1({ok:false,error:"IDLE_NARRATION_AI_EMPTY"},502);
  }

  if(env?.SOREAL_R2&&typeof env.SOREAL_R2.put==="function"){
    try{
      await env.SOREAL_R2.put(key,audio,{
        httpMetadata:{
          contentType:"audio/mpeg",
          cacheControl:"public, max-age=31536000, immutable"
        },
        customMetadata:{
          model:IDLE_NARRATION_MODEL_V1,
          lang:IDLE_NARRATION_LANG_V1,
          targetId
        }
      });
    }catch(_){
      // Le cache R2 améliore coût/latence, mais une panne de cache ne doit
      // jamais empêcher la lecture de l'audio déjà généré.
    }
  }

  return reponseAudioNarrationV1(audio,"MISS",key);
}

export const IDLE_NARRATION_V1={
  model:IDLE_NARRATION_MODEL_V1,
  lang:IDLE_NARRATION_LANG_V1,
  maxChars:IDLE_NARRATION_MAX_CHARS_V1,
  prefix:IDLE_NARRATION_R2_PREFIX_V1
};
