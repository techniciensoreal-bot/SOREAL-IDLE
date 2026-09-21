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
    window.__SOREAL_IDLE_TUTORIAL_TTS_V208__
  ),null,{timeout:60000});

  await page.evaluate(()=>{
    const button=document.createElement("button");
    button.id="piperProductionSmoke";
    button.type="button";
    button.textContent="Piper smoke";
    button.addEventListener("click",()=>{
      window.__SOREAL_IDLE_TUTORIAL_TTS_V208__.readText(
        "Bonjour. Ceci est un test réel de la voix française Piper dans SOREAL IDLE."
      );
    });
    document.body.appendChild(button);
  });

  await page.click("#piperProductionSmoke");

  await page.waitForFunction(()=>{
    const t=window.__SOREAL_IDLE_TUTORIAL_TTS_V208__;
    const p=window.__SOREAL_IDLE_LOCAL_NEURAL_V1__;
    if(!t||!p)return false;
    return Boolean(t.lastError()) || p.state().status==="ready" || p.state().status==="error";
  },null,{timeout:150000});

  await page.waitForTimeout(750);
  const during=await page.evaluate(()=>({
    lastError:window.__SOREAL_IDLE_TUTORIAL_TTS_V208__.lastError(),
    audioState:window.__SOREAL_IDLE_TUTORIAL_TTS_V208__.audioState(),
    speaking:window.__SOREAL_IDLE_TUTORIAL_TTS_V208__.isSpeaking(),
    neural:window.__SOREAL_IDLE_LOCAL_NEURAL_V1__.state()
  }));

  assert.equal(during.lastError,"","Piper error: "+during.lastError);
  assert.equal(during.audioState,"running","Web Audio state: "+during.audioState);
  assert.equal(during.neural.status,"ready","Piper state: "+JSON.stringify(during.neural));

  await page.waitForFunction(
    ()=>!window.__SOREAL_IDLE_TUTORIAL_TTS_V208__.isSpeaking(),
    null,
    {timeout:90000}
  );

  const final=await page.evaluate(()=>({
    lastError:window.__SOREAL_IDLE_TUTORIAL_TTS_V208__.lastError(),
    audioState:window.__SOREAL_IDLE_TUTORIAL_TTS_V208__.audioState(),
    neural:window.__SOREAL_IDLE_LOCAL_NEURAL_V1__.state()
  }));

  assert.equal(final.lastError,"");
  assert.equal(final.audioState,"running");
  assert.equal(final.neural.status,"ready");
  console.log("Piper production-origin smoke: SUCCESS",JSON.stringify(final));
}catch(error){
  console.error("PIPER_SMOKE_TRACE_START");
  for(const line of trace.slice(-200))console.error(line);
  console.error("PIPER_SMOKE_TRACE_END");
  throw error;
}finally{
  await browser.close();
}
