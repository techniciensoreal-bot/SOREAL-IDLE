import assert from "node:assert/strict";
import { traiterRequeteIdleMedia } from "../src/idle-media-v1.js";

const originalFetch=globalThis.fetch;
const calls=[];

globalThis.fetch=async (url,init={})=>{
  const href=String(url);
  calls.push({href,method:String(init.method||"GET")});
  if(href.endsWith(".onnx.json")){
    return new Response('{"audio":{"sample_rate":22050}}',{
      status:200,
      headers:{
        "content-type":"application/json",
        "etag":"\"config-v2\""
      }
    });
  }
  if(href.endsWith(".onnx")){
    return new Response(new Uint8Array([1,2,3,4]),{
      status:200,
      headers:{
        "content-type":"application/octet-stream",
        "etag":"\"model-v2\""
      }
    });
  }
  return new Response("unexpected",{status:404});
};

async function verifierRoute_(origin,path){
  const response=await traiterRequeteIdleMedia(new Request(origin+path),{});
  assert.equal(response.status,200,path);
  assert.equal(response.headers.get("access-control-allow-origin"),"*",path);
  assert.match(response.headers.get("cache-control")||"",/immutable/,path);
  if(path.endsWith(".json")){
    assert.match(response.headers.get("content-type")||"",/application\/json/,path);
    const config=JSON.parse(await response.text());
    assert.ok(config.audio&&config.audio.sample_rate,path);
    if(path.includes("piper-voice-siwis")||path.includes("piper-voice-gilles")){
      assert.deepEqual(config.language_id_map,{fr:0},path+" French-only G2P compatibility");
      assert.equal(config.num_languages,1,path+" French-only language count");
      assert.equal(config.soreal_monolingual_g2p_compat,true,path+" compatibility marker");
    }else{
      assert.equal(config.soreal_monolingual_g2p_compat,undefined,path+" must not alter SOREAL config");
    }
  }else{
    assert.match(response.headers.get("content-type")||"",/application\/octet-stream/,path);
    assert.deepEqual([...new Uint8Array(await response.arrayBuffer())],[1,2,3,4],path);
  }
}

try{
  const origin="https://soreal-idle.example";

  for(const path of [
    "/api/idle/media/piper-model.onnx.json",
    "/api/idle/media/piper-model.onnx",
    "/api/idle/media/piper-voice-soreal.onnx.json",
    "/api/idle/media/piper-voice-soreal.onnx",
    "/api/idle/media/piper-voice-siwis.onnx.json",
    "/api/idle/media/piper-voice-siwis.onnx",
    "/api/idle/media/piper-voice-gilles.onnx.json",
    "/api/idle/media/piper-voice-gilles.onnx"
  ]){
    await verifierRoute_(origin,path);
  }

  assert.deepEqual(calls.map(call=>call.href),[
    "https://huggingface.co/spaces/ayousanz/piper-plus-demo/resolve/main/models/multilingual-test-medium.onnx.json",
    "https://huggingface.co/spaces/ayousanz/piper-plus-demo/resolve/main/models/multilingual-test-medium.onnx",
    "https://huggingface.co/spaces/ayousanz/piper-plus-demo/resolve/main/models/multilingual-test-medium.onnx.json",
    "https://huggingface.co/spaces/ayousanz/piper-plus-demo/resolve/main/models/multilingual-test-medium.onnx",
    "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx.json",
    "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx",
    "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/fr/fr_FR/gilles/low/fr_FR-gilles-low.onnx.json",
    "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/fr/fr_FR/gilles/low/fr_FR-gilles-low.onnx"
  ]);

  console.log("idle Piper voice proxy: OK — soreal, siwis et gilles.");
}finally{
  globalThis.fetch=originalFetch;
}
