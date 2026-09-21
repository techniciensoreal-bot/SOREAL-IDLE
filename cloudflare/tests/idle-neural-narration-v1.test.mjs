import assert from "node:assert/strict";
import fs from "node:fs";
import worker from "../src/idle-worker-entry-v1.js";

const wrangler=fs.readFileSync(new URL("../../wrangler.jsonc",import.meta.url),"utf8");
assert.match(wrangler,/"ai"\s*:\s*\{\s*"binding"\s*:\s*"AI"/);

function envV1(){
  const store=new Map();
  let aiCalls=0;
  const coordinatorCalls=[];
  return {
    store,
    coordinatorCalls,
    get aiCalls(){return aiCalls;},
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
        return bytes?{body:new Uint8Array(bytes)}:null;
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
      async run(model,input,options){
        aiCalls+=1;
        assert.equal(model,"@cf/myshell-ai/melotts");
        assert.equal(input.lang,"fr");
        assert.equal(input.prompt,"Bonjour depuis SOREAL IDLE.");
        assert.equal(options.returnRawResponse,true);
        return new Response(new Uint8Array([73,68,76,69]),{
          headers:{"content-type":"audio/mpeg"}
        });
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
      targetId:"sorealIdleInfoRecapV203_",
      text:"Bonjour depuis SOREAL IDLE."
    })
  });

  const first=await worker.fetch(request(),env);
  assert.equal(first.status,200);
  assert.equal(first.headers.get("content-type"),"audio/mpeg");
  assert.equal(first.headers.get("x-soreal-idle-narration-cache"),"MISS");
  assert.deepEqual([...new Uint8Array(await first.arrayBuffer())],[73,68,76,69]);
  assert.equal(env.aiCalls,1);
  assert.equal(env.store.size,1);
  assert.equal(env.coordinatorCalls[0].path,"/__soreal-idle-v1/session-validate");
  assert.deepEqual(env.coordinatorCalls[0].body,{sessionToken:"ils_test"});

  const second=await worker.fetch(request(),env);
  assert.equal(second.status,200);
  assert.equal(second.headers.get("x-soreal-idle-narration-cache"),"HIT");
  assert.deepEqual([...new Uint8Array(await second.arrayBuffer())],[73,68,76,69]);
  assert.equal(env.aiCalls,1,"Le cache R2 doit éviter une seconde génération Workers AI.");
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

console.log("idle neural narration V1: ok — session, MeloTTS et cache R2.");
