import assert from "node:assert/strict";
import { chromium } from "playwright";

const browser=await chromium.launch({
  headless:true,
  args:["--autoplay-policy=user-gesture-required"]
});
const page=await browser.newPage();
const consoleLines=[];

page.on("console",msg=>consoleLines.push("[console "+msg.type()+"] "+msg.text()));
page.on("pageerror",error=>consoleLines.push("[pageerror] "+String(error&&error.stack||error)));

try{
  await page.goto("http://127.0.0.1:4173/__piper-playback-smoke.html",{
    waitUntil:"domcontentloaded",
    timeout:60000
  });

  await page.waitForFunction(
    ()=>Boolean(
      window.__SOREAL_IDLE_LOCAL_NEURAL_V1__&&
      window.__SOREAL_IDLE_TUTORIAL_TTS_V208__
    ),
    null,
    {timeout:60000}
  );

  await page.click("#readPiper");

  await page.waitForFunction(
    ()=>document.getElementById("readPiper")?.dataset?.sorealTtsReading==="1",
    null,
    {timeout:10000}
  );

  await page.waitForFunction(
    ()=>window.__SOREAL_IDLE_LOCAL_NEURAL_V1__?.state?.().status==="ready",
    null,
    {timeout:120000}
  );

  const during=await page.evaluate(()=>({
    audioState:window.__SOREAL_IDLE_TUTORIAL_TTS_V208__.audioState(),
    lastError:window.__SOREAL_IDLE_TUTORIAL_TTS_V208__.lastError(),
    neuralState:window.__SOREAL_IDLE_LOCAL_NEURAL_V1__.state()
  }));

  assert.equal(during.lastError,"","Aucune erreur ne doit apparaître après la synthèse.");
  assert.equal(during.audioState,"running","Web Audio doit être déverrouillé par le clic utilisateur.");

  await page.waitForFunction(
    ()=>(
      document.getElementById("readPiper")?.dataset?.sorealTtsReading==="0"&&
      !window.__SOREAL_IDLE_TUTORIAL_TTS_V208__.isSpeaking()
    ),
    null,
    {timeout:60000}
  );

  const result=await page.evaluate(()=>({
    lastError:window.__SOREAL_IDLE_TUTORIAL_TTS_V208__.lastError(),
    audioState:window.__SOREAL_IDLE_TUTORIAL_TTS_V208__.audioState(),
    neuralState:window.__SOREAL_IDLE_LOCAL_NEURAL_V1__.state()
  }));

  assert.equal(result.lastError,"","La lecture Piper ne doit pas finir en erreur.");
  assert.equal(result.audioState,"running","Le contexte Web Audio doit rester actif.");
  assert.equal(result.neuralState.status,"ready","Piper doit revenir à ready.");

  console.log("Piper controller playback smoke: SUCCESS",JSON.stringify(result));
}catch(error){
  console.error("Piper controller playback smoke: FAILURE");
  for(const line of consoleLines.slice(-120))console.error(line);
  throw error;
}finally{
  await browser.close();
}
