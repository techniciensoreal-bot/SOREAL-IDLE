/*
 * Vérifie AVANT le déploiement que les dépendances externes du runtime vocal existent et n'ont pas changé.
 * Usage : node cloudflare/tools/verify-voice-runtime-dependencies.mjs
 *
 * - scripts avec Subresource Integrity : le contenu réel doit correspondre à l'empreinte de index.html ;
 * - modules / fichiers du module vocal / compagnons d'ONNX Runtime : HTTP 200 ;
 * - modèle Tom (Hugging Face) : le .onnx répond, la configuration .onnx.json est valide (espeak fr, phoneme_id_map).
 * Chaque requête est retentée 3 fois (une panne réseau ponctuelle ne doit pas bloquer une version).
 * Le smoke Chromium réel après déploiement reste la preuve finale (synthèse + lecture audio).
 */
import { readFileSync } from "node:fs";
import {
  collectVoiceRuntimeDependencies,
  collectOrtCompanionFiles,
  validatePiperModelConfig,
  computeIntegrity
} from "./voice-runtime-dependencies.mjs";

const read=(rel)=>readFileSync(new URL(rel,import.meta.url),"utf8");
const indexHtml=read("../public/index.html");
const neuralModuleSource=read("../public/modules/local-neural-piper-v1.js");
const mediaSource=readFileSync(new URL("../src/idle-media-v1.js",import.meta.url)).toString("utf8");

const sleep=(ms)=>new Promise((r)=>setTimeout(r,ms));

async function withRetry(label,fn,attempts=3){
  let lastError;
  for(let i=1;i<=attempts;i++){
    try{return await fn();}
    catch(error){
      lastError=error;
      if(i<attempts)await sleep(2000*i);
    }
  }
  throw new Error(label+" : "+(lastError&&lastError.message||lastError));
}

async function fetchChecked(url,options={}){
  const response=await fetch(url,{redirect:"follow",signal:AbortSignal.timeout(60000),...options});
  if(!response.ok)throw new Error("HTTP "+response.status);
  return response;
}

const failures=[];
const dependencies=collectVoiceRuntimeDependencies({indexHtml,neuralModuleSource,mediaSource});
if(!dependencies.length){
  console.error("Aucune dépendance vocale détectée : les sources ont changé de forme, l'extraction doit être mise à jour.");
  process.exit(1);
}

let ortSource="";
for(const dep of dependencies){
  try{
    if(dep.kind==="script-sri"){
      const bytes=Buffer.from(await withRetry(dep.url,async()=>(await fetchChecked(dep.url)).arrayBuffer()));
      const algorithm=dep.integrity.split("-")[0];
      const observed=await computeIntegrity(bytes,algorithm);
      if(observed!==dep.integrity)throw new Error("empreinte différente (attendu "+dep.integrity+", obtenu "+observed+")");
    }else if(dep.kind==="esm"){
      const text=await withRetry(dep.url,async()=>(await fetchChecked(dep.url)).text());
      if(dep.name==="onnxruntime-web")ortSource=text;
    }else if(dep.kind==="model-config"){
      const config=await withRetry(dep.url,async()=>(await fetchChecked(dep.url)).json());
      const problems=validatePiperModelConfig(config);
      if(problems.length)throw new Error(problems.join("; "));
    }else{
      await withRetry(dep.url,async()=>{
        const response=await fetchChecked(dep.url,{method:"HEAD"});
        await response.arrayBuffer().catch(()=>{});
      });
    }
    console.log("OK   ["+dep.kind+"] "+dep.url);
  }catch(error){
    failures.push(dep.url+" : "+error.message);
    console.error("FAIL ["+dep.kind+"] "+dep.url+" : "+error.message);
  }
}

const ort=dependencies.find((d)=>d.kind==="esm"&&d.name==="onnxruntime-web");
if(ort&&ortSource){
  const companions=collectOrtCompanionFiles(ort.url,ortSource);
  if(!companions.length)failures.push("aucun fichier compagnon détecté dans ort.min.mjs (format changé ?)");
  for(const dep of companions){
    try{
      await withRetry(dep.url,async()=>{
        const response=await fetchChecked(dep.url,{method:"HEAD"});
        await response.arrayBuffer().catch(()=>{});
      });
      console.log("OK   [ort-companion] "+dep.url);
    }catch(error){
      failures.push(dep.url+" : "+error.message);
      console.error("FAIL [ort-companion] "+dep.url+" : "+error.message);
    }
  }
}else if(ort){
  failures.push("ort.min.mjs illisible : compagnons non vérifiés");
}

if(failures.length){
  console.error("\nDépendances vocales cassées ("+failures.length+") :\n - "+failures.join("\n - "));
  process.exit(1);
}
console.log("\nDépendances du runtime vocal : OK");
