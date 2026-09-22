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
    /*
     * Depuis le passage à la phonémisation espeak-ng réelle (2026-09-22),
     * la configuration du modèle est servie telle quelle : plus de
     * correctif language_id_map/num_languages (spécifique à piper-plus,
     * dont le phonémiseur maison exigeait ce contournement).
     */
    assert.equal(config.language_id_map,undefined,path+" ne doit plus être patché");
    assert.equal(config.num_languages,undefined,path+" ne doit plus être patché");
    assert.equal(config.soreal_monolingual_g2p_compat,undefined,path+" ne doit plus être patché");
  }else{
    assert.match(response.headers.get("content-type")||"",/application\/octet-stream/,path);
    assert.deepEqual([...new Uint8Array(await response.arrayBuffer())],[1,2,3,4],path);
  }
}

try{
  const origin="https://soreal-idle.example";

  for(const path of [
    "/api/idle/media/piper-model.onnx.json",
    "/api/idle/media/piper-model.onnx"
  ]){
    await verifierRoute_(origin,path);
  }

  assert.deepEqual(calls.map(call=>call.href),[
    "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/fr/fr_FR/tom/medium/fr_FR-tom-medium.onnx.json",
    "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/fr/fr_FR/tom/medium/fr_FR-tom-medium.onnx"
  ]);

  /*
   * Les anciennes routes multi-voix (soreal/siwis/gilles) ne doivent plus
   * exister : le sélecteur de voix a été retiré, une seule voix (Tom).
   */
  for(const path of [
    "/api/idle/media/piper-voice-soreal.onnx",
    "/api/idle/media/piper-voice-soreal.onnx.json",
    "/api/idle/media/piper-voice-siwis.onnx",
    "/api/idle/media/piper-voice-siwis.onnx.json",
    "/api/idle/media/piper-voice-gilles.onnx",
    "/api/idle/media/piper-voice-gilles.onnx.json"
  ]){
    const response=await traiterRequeteIdleMedia(new Request(origin+path),{});
    assert.equal(response,null,path+" ne doit plus être une route connue");
  }

  console.log("idle Piper voice proxy: OK — une seule voix (Tom), aucune route multi-voix résiduelle.");
}finally{
  globalThis.fetch=originalFetch;
}
