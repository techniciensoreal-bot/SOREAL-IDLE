import assert from "node:assert/strict";
import fs from "node:fs";
import worker from "../src/idle-worker-entry-v1.js";

const wrangler=fs.readFileSync(new URL("../../wrangler.jsonc",import.meta.url),"utf8");
assert.match(wrangler,/"ai"\s*:\s*\{\s*"binding"\s*:\s*"AI"/);
assert.match(wrangler,/"version_metadata"\s*:\s*\{\s*"binding"\s*:\s*"CF_VERSION_METADATA"/);

function makeMp3Base64(){
  const bytes=Buffer.alloc(256,0);
  bytes[0]=0x49;bytes[1]=0x44;bytes[2]=0x33;
  return bytes.toString("base64");
}

const originalFetch=globalThis.fetch;
let remoteAudioFetches=0;
globalThis.fetch=async function(input,init){
  const url=String(input instanceof Request?input.url:input||"");
  if(url==="https://audio.test/grok.mp3"){
    remoteAudioFetches+=1;
    const bytes=Buffer.from(makeMp3Base64(),"base64");
    return new Response(bytes,{status:200,headers:{"content-type":"audio/mpeg"}});
  }
  return originalFetch(input,init);
};

function envV1(){
  const store=new Map();
  let aiCalls=0;
  const coordinatorCalls=[];
  return {
    store,
    coordinatorCalls,
    get aiCalls(){return aiCalls;},
    CF_VERSION_METADATA:{id:"version-test-123",tag:"",timestamp:new Date().toISOString()},
    SOREAL_IDLE:{
      idFromName(name){
        assert.equal(name,"global");
        return "global-id";
      },
      get(){
        return {
          async fetch(request){
            const path=new URL(request.url).pathname;
            const body=await request.json().catch(()=>({}));
            coordinatorCalls.push({path,body});
            if(path==="/__soreal-idle-v1/session-validate"){
              if(body.sessionToken==="ils_test"){
                return Response.json({ok:true,expiresAt:Date.now()+60_000});
              }
              return Response.json({ok:false,error:"IDLE_SESSION_INVALID"},{status:401});
            }
            return Response.json({ok:false,error:"UNEXPECTED_ROUTE"},{status:404});
          }
        };
      }
    },
    SOREAL_R2:{
      async get(key){
        const bytes=store.get(key);
        return bytes?{body:new Uint8Array(bytes),size:bytes.length}:null;
      },
      async put(key,value){
        const bytes=value instanceof ArrayBuffer
          ?new Uint8Array(value)
          :value instanceof Uint8Array
            ?value
            :new Uint8Array(await new Response(value).arrayBuffer());
        store.set(key,new Uint8Array(bytes));
      }
    },
    AI:{
      async run(model,input){
        aiCalls+=1;
        assert.equal(model,"xai/grok-tts");
        assert.equal(input.language,"fr");
        assert.ok(String(input.text||"").length>0);\n        assert.equal(input.voice_id,"ara");
        return {state:"Completed",result:{audio:"https://audio.test/grok.mp3"}};
      }
    }
  };
}

{
  const env=envV1();
  const response=await worker.fetch(new Request("https://idle.test/api/v1/narration",{
    method:"POST",
    headers:{"content-type":"application/json"},
    body:JSON.stringify({targetId:"test",text:"Bonjour depuis SOREAL IDLE."})
  }),env);
  assert.equal(response.status,401);
  assert.equal(env.aiCalls,0);
}

{
  const env=envV1();
  const request=()=>new Request("https://idle.test/api/v1/narration",{
    method:"POST",
    headers:{
      "content-type":"application/json",
      authorization:"Bearer ils_test"
    },
    body:JSON.stringify({
      targetId:"sorealIdleInfoRecapV203_:1",
      text:"Bonjour depuis SOREAL IDLE."
    })
  });

  const first=await worker.fetch(request(),env);
  assert.equal(first.status,200);
  assert.equal(first.headers.get("content-type"),"audio/mpeg");
  assert.equal(first.headers.get("x-soreal-idle-narration-cache"),"MISS");
  assert.equal((await first.arrayBuffer()).byteLength,256);
  assert.equal(env.aiCalls,1);
  assert.equal(env.store.size,1);
  assert.equal(env.coordinatorCalls[0].path,"/__soreal-idle-v1/session-validate");

  const second=await worker.fetch(request(),env);
  assert.equal(second.status,200);
  assert.equal(second.headers.get("x-soreal-idle-narration-cache"),"HIT");
  assert.equal((await second.arrayBuffer()).byteLength,256);
  assert.equal(env.aiCalls,1,"Le cache R2 doit éviter une seconde génération Workers AI.");
  assert.equal(remoteAudioFetches,1,"L'URL audio Grok ne doit être téléchargée qu'à la première génération.");
}

{
  const env=envV1();
  const health1=await worker.fetch(
    new Request("https://idle.test/api/v1/narration-health"),
    env
  );
  assert.equal(health1.status,200);
  const body1=await health1.json();
  assert.equal(body1.ok,true);
  assert.equal(body1.model,"xai/grok-tts");
  assert.equal(body1.lang,"fr");\n  assert.equal(body1.voice,"ara");
  assert.equal(body1.versionId,"version-test-123");
  assert.equal(body1.cache,"MISS");
  assert.equal(body1.bytes,256);
  assert.equal(env.aiCalls,1);

  const health2=await worker.fetch(
    new Request("https://idle.test/api/v1/narration-health"),
    env
  );
  assert.equal(health2.status,200);
  const body2=await health2.json();
  assert.equal(body2.ok,true);
  assert.equal(body2.cache,"HIT");
  assert.equal(env.aiCalls,1,"Le health check ne doit inférer qu'une fois par version.");
}

{
  const env=envV1();
  const response=await worker.fetch(new Request("https://idle.test/api/v1/narration",{
    method:"POST",
    headers:{
      "content-type":"application/json",
      authorization:"Bearer ils_test"
    },
    body:JSON.stringify({targetId:"too-long",text:"x".repeat(3501)})
  }),env);
  assert.equal(response.status,413);
  assert.equal(env.aiCalls,0);
}

console.log("idle neural narration V206: ok — neural only, session, Grok TTS, health et cache R2.");

globalThis.fetch=originalFetch;
