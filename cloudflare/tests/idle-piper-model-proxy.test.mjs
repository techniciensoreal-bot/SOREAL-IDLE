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
        "etag":"\"config-v1\""
      }
    });
  }
  if(href.endsWith(".onnx")){
    return new Response(new Uint8Array([1,2,3,4]),{
      status:200,
      headers:{
        "content-type":"application/octet-stream",
        "etag":"\"model-v1\""
      }
    });
  }
  return new Response("unexpected",{status:404});
};

try{
  const origin="https://soreal-idle.example";

  const config=await traiterRequeteIdleMedia(
    new Request(origin+"/api/idle/media/piper-model.onnx.json"),
    {}
  );
  assert.equal(config.status,200);
  assert.match(config.headers.get("content-type")||"",/application\/json/);
  assert.equal(config.headers.get("access-control-allow-origin"),"*");
  assert.match(config.headers.get("cache-control")||"",/immutable/);
  assert.match(await config.text(),/sample_rate/);

  const model=await traiterRequeteIdleMedia(
    new Request(origin+"/api/idle/media/piper-model.onnx"),
    {}
  );
  assert.equal(model.status,200);
  assert.match(model.headers.get("content-type")||"",/application\/octet-stream/);
  assert.equal(model.headers.get("access-control-allow-origin"),"*");
  assert.deepEqual([...new Uint8Array(await model.arrayBuffer())],[1,2,3,4]);

  assert.deepEqual(calls.map(call=>call.href),[
    "https://huggingface.co/spaces/ayousanz/piper-plus-demo/resolve/main/models/multilingual-test-medium.onnx.json",
    "https://huggingface.co/spaces/ayousanz/piper-plus-demo/resolve/main/models/multilingual-test-medium.onnx"
  ]);

  console.log("idle Piper same-origin proxy: OK");
}finally{
  globalThis.fetch=originalFetch;
}
