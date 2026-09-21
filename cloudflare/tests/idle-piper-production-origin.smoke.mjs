import assert from "node:assert/strict";
import { chromium } from "playwright";

const url=String(process.env.SOREAL_IDLE_URL||"").trim();
assert.ok(url,"SOREAL_IDLE_URL is required");

const browser=await chromium.launch({
  headless:true,
  args:["--autoplay-policy=user-gesture-required"]
});
const page=await browser.newPage();
const trace=[];

page.on("console",m=>trace.push("[console "+m.type()+"] "+m.text()));
page.on("pageerror",e=>trace.push("[pageerror] "+String(e?.stack||e)));
page.on("requestfailed",r=>trace.push("[requestfailed] "+r.url()+" :: "+(r.failure()?.errorText||"unknown")));
page.on("response",r=>{
  if(r.status()>=400)trace.push("[http "+r.status()+"] "+r.url());
});

try{
  const response=await page.goto(url,{waitUntil:"domcontentloaded",timeout:60000});
  assert.ok(response,"Narration smoke root did not return a response");
  assert.ok(response.status()<400,"Narration smoke root HTTP "+response.status());

  await page.waitForFunction(()=>Boolean(
    window.__SOREAL_IDLE_LOCAL_NEURAL_V1__ &&
    window.__SOREAL_IDLE_TUTORIAL_TTS_V209__
  ),null,{timeout:60000});

  await page.evaluate(()=>{
    const button=document.createElement("button");
    button.id="piperProductionSmoke";
    button.type="button";
    button.textContent="Piper smoke";
    button.addEventListener("click",()=>{
      window.__SOREAL_IDLE_TUTORIAL_TTS_V209__.readText(
        "Bonjour. Ceci est un test réel de cette voix française dans SOREAL IDLE."
      );
    });
    document.body.appendChild(button);
  });

  const expectedModels={
    soreal:"/api/idle/media/piper-voice-soreal.onnx",
    siwis:"/api/idle/media/piper-voice-siwis.onnx",
    gilles:"/api/idle/media/piper-voice-gilles.onnx"
  };

  for(const voiceId of ["soreal","siwis","gilles"]){
    await page.evaluate(id=>{
      window.__SOREAL_IDLE_TUTORIAL_TTS_V209__.setVoice(id);
    },voiceId);

    const selected=await page.evaluate(()=>({
      controller:window.__SOREAL_IDLE_TUTORIAL_TTS_V209__.voice(),
      neural:window.__SOREAL_IDLE_LOCAL_NEURAL_V1__.state()
    }));
    assert.equal(selected.controller?.id,voiceId,"Controller voice mismatch");
    assert.equal(selected.neural?.voice?.id,voiceId,"Neural voice mismatch before synthesis");
    assert.ok(
      String(selected.neural?.model||"").endsWith(expectedModels[voiceId]),
      "Unexpected model for "+voiceId+": "+String(selected.neural?.model||"")
    );

    await page.click("#piperProductionSmoke");

    await page.waitForFunction(id=>{
      const t=window.__SOREAL_IDLE_TUTORIAL_TTS_V209__;
      const p=window.__SOREAL_IDLE_LOCAL_NEURAL_V1__;
      if(!t||!p)return false;
      const state=p.state();
      if(state?.voice?.id!==id)return false;
      return Boolean(t.lastError()) || state.status==="ready" || state.status==="error";
    },voiceId,{timeout:180000});

    await page.waitForTimeout(750);
    const during=await page.evaluate(()=>({
      lastError:window.__SOREAL_IDLE_TUTORIAL_TTS_V209__.lastError(),
      audioState:window.__SOREAL_IDLE_TUTORIAL_TTS_V209__.audioState(),
      speaking:window.__SOREAL_IDLE_TUTORIAL_TTS_V209__.isSpeaking(),
      neural:window.__SOREAL_IDLE_LOCAL_NEURAL_V1__.state()
    }));

    assert.equal(during.lastError,"","Piper "+voiceId+" error: "+during.lastError);
    assert.equal(during.audioState,"running","Web Audio "+voiceId+" state: "+during.audioState);
    assert.equal(during.neural.status,"ready","Piper "+voiceId+" state: "+JSON.stringify(during.neural));
    assert.equal(during.neural.voice?.id,voiceId,"Piper selected voice changed during synthesis");

    await page.waitForFunction(
      ()=>!window.__SOREAL_IDLE_TUTORIAL_TTS_V209__.isSpeaking(),
      null,
      {timeout:120000}
    );

    console.log("Piper voice smoke: SUCCESS",JSON.stringify({
      voice:voiceId,
      model:during.neural.model,
      audioState:during.audioState
    }));
  }

  const final=await page.evaluate(()=>({
    lastError:window.__SOREAL_IDLE_TUTORIAL_TTS_V209__.lastError(),
    audioState:window.__SOREAL_IDLE_TUTORIAL_TTS_V209__.audioState(),
    voice:window.__SOREAL_IDLE_LOCAL_NEURAL_V1__.state().voice
  }));

  assert.equal(final.lastError,"");
  assert.equal(final.audioState,"running");
  assert.equal(final.voice?.id,"gilles");
  console.log("Piper production-origin multi-voice smoke: SUCCESS",JSON.stringify(final));
}catch(error){
  console.error("PIPER_SMOKE_TRACE_START");
  for(const line of trace.slice(-300))console.error(line);
  console.error("PIPER_SMOKE_TRACE_END");
  throw error;
}finally{
  await browser.close();
}
