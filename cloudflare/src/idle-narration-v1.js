const IDLE_NARRATION_MODEL_V1="@cf/myshell-ai/melotts";
const IDLE_NARRATION_LANG_V1="FR";
const IDLE_NARRATION_R2_PREFIX_V1="idle/narration/v1/fr/";
const IDLE_NARRATION_HEALTH_PREFIX_V1="idle/narration-health/v1/";
const IDLE_NARRATION_MAX_CHARS_V1=3500;
const IDLE_NARRATION_HEALTH_TEXT_V1="SOREAL IDLE. La narration neurale française est opérationnelle.";

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
  return /^[A-Za-z0-9_.:-]{1,200}$/.test(target)?target:"";
}

async function hashNarrationV1(text,salt=""){
  const source=[
    IDLE_NARRATION_MODEL_V1,
    IDLE_NARRATION_LANG_V1,
    String(salt||""),
    text
  ].join("\n");
  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(source));
  return Array.from(new Uint8Array(digest))
    .map(value=>value.toString(16).padStart(2,"0"))
    .join("");
}

function base64AudioBytesV1(value){
  let raw=String(value||"").trim();
  if(!raw)return null;
  const marker="base64,";
  const markerIndex=raw.indexOf(marker);
  if(markerIndex>=0)raw=raw.slice(markerIndex+marker.length);
  raw=raw.replace(/\s+/g,"");
  if(!raw)return null;

  const binary=atob(raw);
  const bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
  return bytes.buffer;
}

async function bytesDepuisResultatAiV1(result){
  if(result instanceof Response){
    if(!result.ok)throw new Error("IDLE_NARRATION_AI_HTTP_"+result.status);
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
      const decoded=base64AudioBytesV1(result.audio);
      if(decoded)return decoded;
    }
  }
  throw new Error("IDLE_NARRATION_AI_FORMAT_UNSUPPORTED");
}

function audioValideV1(audio){
  return Boolean(audio&&Number(audio.byteLength||0)>=128);
}

async function executerMeloTtsV1(env,text){
  if(!env?.AI||typeof env.AI.run!=="function"){
    throw new Error("IDLE_NARRATION_AI_UNAVAILABLE");
  }
  const result=await env.AI.run(
    IDLE_NARRATION_MODEL_V1,
    {prompt:text,lang:IDLE_NARRATION_LANG_V1}
  );
  const audio=await bytesDepuisResultatAiV1(result);
  if(!audioValideV1(audio))throw new Error("IDLE_NARRATION_AI_EMPTY");
  return audio;
}

async function lireCacheR2V1(env,key){
  if(!env?.SOREAL_R2||typeof env.SOREAL_R2.get!=="function")return null;
  const object=await env.SOREAL_R2.get(key);
  if(!object)return null;
  return {
    body:object.body,
    size:Number(object.size||0)||null,
    cacheStatus:"HIT"
  };
}

async function ecrireCacheR2V1(env,key,audio,targetId){
  if(!env?.SOREAL_R2||typeof env.SOREAL_R2.put!=="function")return false;
  await env.SOREAL_R2.put(key,audio,{
    httpMetadata:{
      contentType:"audio/mpeg",
      cacheControl:"public, max-age=31536000, immutable"
    },
    customMetadata:{
      model:IDLE_NARRATION_MODEL_V1,
      lang:IDLE_NARRATION_LANG_V1,
      targetId:String(targetId||"")
    }
  });
  return true;
}

async function obtenirNarrationV1(env,text,targetId,salt=""){
  const hash=await hashNarrationV1(text,salt);
  const prefix=salt
    ?IDLE_NARRATION_HEALTH_PREFIX_V1
    :IDLE_NARRATION_R2_PREFIX_V1;
  const key=prefix+hash+".mp3";

  const cached=await lireCacheR2V1(env,key);
  if(cached)return {key,...cached};

  let audio;
  try{
    audio=await executerMeloTtsV1(env,text);
  }catch(error){
    const message=String(error?.message||error||"IDLE_NARRATION_AI_FAILED");
    const wrapped=new Error(message);
    wrapped.code=message;
    throw wrapped;
  }

  try{
    await ecrireCacheR2V1(env,key,audio,targetId);
  }catch(_){
    // L'audio généré reste utilisable même si R2 rencontre un problème.
  }

  return {
    key,
    body:audio,
    size:Number(audio.byteLength||0),
    cacheStatus:"MISS"
  };
}

function reponseAudioNarrationV1(result){
  return new Response(result.body,{
    status:200,
    headers:{
      "content-type":"audio/mpeg",
      "cache-control":"private, max-age=86400",
      "x-soreal-idle-narration-cache":result.cacheStatus,
      "x-soreal-idle-narration-key":result.key,
      "x-soreal-idle-narration-model":IDLE_NARRATION_MODEL_V1
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

  try{
    const result=await obtenirNarrationV1(env,text,targetId);
    return reponseAudioNarrationV1(result);
  }catch(error){
    const message=String(error?.code||error?.message||error||"IDLE_NARRATION_AI_FAILED");
    return narrationJsonV1({
      ok:false,
      error:message.startsWith("IDLE_NARRATION_")?message:"IDLE_NARRATION_AI_FAILED",
      message:message.slice(0,300)
    },503);
  }
}

export async function testerNarrationIdleV1(env){
  if(!env?.SOREAL_R2||typeof env.SOREAL_R2.get!=="function"||typeof env.SOREAL_R2.put!=="function"){
    return narrationJsonV1({ok:false,error:"IDLE_NARRATION_R2_UNAVAILABLE"},503);
  }
  if(!env?.AI||typeof env.AI.run!=="function"){
    return narrationJsonV1({ok:false,error:"IDLE_NARRATION_AI_UNAVAILABLE"},503);
  }

  const versionId=String(env?.CF_VERSION_METADATA?.id||"unknown-version");
  try{
    const result=await obtenirNarrationV1(
      env,
      IDLE_NARRATION_HEALTH_TEXT_V1,
      "health:"+versionId,
      versionId
    );
    return narrationJsonV1({
      ok:true,
      model:IDLE_NARRATION_MODEL_V1,
      lang:IDLE_NARRATION_LANG_V1,
      versionId,
      cache:result.cacheStatus,
      bytes:result.size
    });
  }catch(error){
    const message=String(error?.code||error?.message||error||"IDLE_NARRATION_HEALTH_FAILED");
    return narrationJsonV1({
      ok:false,
      error:message,
      versionId,
      model:IDLE_NARRATION_MODEL_V1
    },503);
  }
}

export const IDLE_NARRATION_V1={
  model:IDLE_NARRATION_MODEL_V1,
  lang:IDLE_NARRATION_LANG_V1,
  maxChars:IDLE_NARRATION_MAX_CHARS_V1,
  prefix:IDLE_NARRATION_R2_PREFIX_V1,
  healthPrefix:IDLE_NARRATION_HEALTH_PREFIX_V1
};
