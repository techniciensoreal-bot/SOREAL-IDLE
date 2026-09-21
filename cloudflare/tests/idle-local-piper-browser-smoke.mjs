import assert from "node:assert/strict";
import { chromium } from "playwright";

const browser=await chromium.launch({headless:true});
const page=await browser.newPage();

const consoleLines=[];
page.on("console",msg=>consoleLines.push("[console "+msg.type()+"] "+msg.text()));
page.on("pageerror",error=>consoleLines.push("[pageerror] "+String(error&&error.stack||error)));

try{
  await page.goto("http://127.0.0.1:4173/__piper-smoke.html",{
    waitUntil:"domcontentloaded",
    timeout:60000
  });

  await page.waitForFunction(
    ()=>Boolean(window.__SOREAL_IDLE_LOCAL_NEURAL_V1__),
    null,
    {timeout:60000}
  );

  const result=await page.evaluate(async()=>{
    const api=window.__SOREAL_IDLE_LOCAL_NEURAL_V1__;
    const blob=await api.synthesize(
      "Bonjour. Ceci est un test de la voix française locale de SOREAL IDLE."
    );
    const bytes=new Uint8Array(await blob.arrayBuffer());
    return {
      size:blob.size,
      type:blob.type||"",
      header:String.fromCharCode(...bytes.slice(0,4)),
      model:String(api.model||""),
      language:String(api.language||""),
      state:api.state()
    };
  });

  assert.equal(
    result.model,
    "ayousanz/piper-plus-css10-ja-6lang",
    "Le smoke test doit utiliser le modèle Piper attendu."
  );
  assert.equal(result.language,"fr","La langue Piper doit rester fr.");
  assert.ok(result.size>1000,"Le WAV Piper généré est anormalement petit.");
  assert.equal(result.header,"RIFF","Piper doit produire un conteneur WAV RIFF.");
  assert.equal(result.state.status,"ready","Piper doit revenir à l'état ready.");

  console.log("Piper Chromium smoke: SUCCESS",JSON.stringify(result));
}catch(error){
  console.error("Piper Chromium smoke: FAILURE");
  for(const line of consoleLines.slice(-80))console.error(line);
  throw error;
}finally{
  await browser.close();
}
