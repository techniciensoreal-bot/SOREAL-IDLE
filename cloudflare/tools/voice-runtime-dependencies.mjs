/*
 * Dépendances RÉELLES du runtime vocal (Piper local), extraites des sources du dépôt et non recopiées à la main.
 *
 * Contexte (2026-09-24) : l'étape « Verify local neural dependencies » du workflow vérifiait encore piper-plus@0.7.0,
 * @piper-plus/g2p, le modèle multilingue, Siwis et Gilles (V1-V9), alors que le frontend charge maintenant
 * onnxruntime-web, @diffusionstudio/piper-wasm et le modèle Tom. Une liste écrite à la main avait dérivé sans que la CI le
 * signale : la liste est désormais calculée à partir de index.html, du module local-neural-piper-v1.js et de idle-media-v1.js,
 * et un test hors ligne (cloudflare/tests/voice-runtime-dependencies.test.mjs) verrouille cette extraction.
 */

const ABSOLUTE_URL=/^https:\/\/[^\s"'`<>]+$/;

/* Les commentaires HTML citent des balises (ex. « <script type="importmap"> » dans index.html) : ils ne doivent pas être analysés. */
function withoutHtmlComments(html){
  return String(html||"").replace(/<!--[\s\S]*?-->/g,"");
}

function unique(list,keyFn){
  const seen=new Set();
  const out=[];
  for(const item of list){
    const key=keyFn(item);
    if(seen.has(key))continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

/** Scripts externes protégés par Subresource Integrity dans index.html. */
export function collectIntegrityScripts(indexHtml){
  const out=[];
  const re=/<script\b[^>]*\bsrc="(https:\/\/[^"]+)"[^>]*\bintegrity="(sha(?:256|384|512)-[^"]+)"[^>]*>/gi;
  let m;
  const html=withoutHtmlComments(indexHtml);
  while((m=re.exec(html)))out.push({kind:"script-sri",url:m[1],integrity:m[2]});
  return out;
}

/** Modules ES résolus par l'importmap (onnxruntime-web). */
export function collectImportMapModules(indexHtml){
  const out=[];
  const re=/<script\b[^>]*type="importmap"[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  const html=withoutHtmlComments(indexHtml);
  while((m=re.exec(html))){
    const map=JSON.parse(m[1]);
    for(const [name,url] of Object.entries(map.imports||{})){
      if(ABSOLUTE_URL.test(String(url)))out.push({kind:"esm",name,url:String(url)});
    }
  }
  return out;
}

/** Fichiers externes chargés à l'exécution par le module vocal (constantes `..._URL_V1="https://..."`). */
export function collectNeuralModuleAssets(neuralModuleSource){
  const out=[];
  const re=/const\s+([A-Z0-9_]+)\s*=\s*"(https:\/\/[^"]+)"/g;
  let m;
  while((m=re.exec(String(neuralModuleSource||""))))out.push({kind:"asset",name:m[1],url:m[2]});
  return out;
}

/** Modèle Piper amont (le Worker le proxifie) : `.onnx` + `.onnx.json`. */
export function collectModelUpstream(mediaSource){
  const m=/IDLE_PIPER_MODEL_UPSTREAM_V1\s*=\s*"(https:\/\/[^"]+\.onnx)"/.exec(String(mediaSource||""));
  if(!m)return [];
  return [
    {kind:"model",name:"onnx",url:m[1]},
    {kind:"model-config",name:"config",url:m[1]+".json"}
  ];
}

/** Fichiers auxiliaires qu'ONNX Runtime va chercher à côté de ort.min.mjs (noms lus dans le fichier lui-même). */
export function collectOrtCompanionFiles(ortModuleUrl,ortSource){
  const base=String(ortModuleUrl).replace(/[^/]+$/,"");
  const names=new Set();
  const re=/ort-wasm[A-Za-z0-9._-]*\.(?:mjs|wasm)/g;
  let m;
  while((m=re.exec(String(ortSource||"")))){
    names.add(m[0]);
    if(m[0].endsWith(".mjs"))names.add(m[0].replace(/\.mjs$/,".wasm"));
  }
  return [...names].sort().map((name)=>({kind:"ort-companion",name,url:base+name}));
}

export function collectVoiceRuntimeDependencies({indexHtml,neuralModuleSource,mediaSource}){
  const all=[
    ...collectImportMapModules(indexHtml),
    ...collectIntegrityScripts(indexHtml),
    ...collectNeuralModuleAssets(neuralModuleSource),
    ...collectModelUpstream(mediaSource)
  ];
  return unique(all,(x)=>x.kind+"|"+x.url);
}

/** Vérifie la structure d'un fichier de configuration Piper (Tom). */
export function validatePiperModelConfig(config){
  const problems=[];
  if(!config||typeof config!=="object")return ["configuration absente ou illisible"];
  if(config.phoneme_type!=="espeak")problems.push("phoneme_type attendu \"espeak\", reçu "+JSON.stringify(config.phoneme_type));
  if(String(config.espeak?.voice||"")!=="fr")problems.push("espeak.voice attendu \"fr\", reçu "+JSON.stringify(config.espeak?.voice));
  if(!(Number(config.audio?.sample_rate)>0))problems.push("audio.sample_rate invalide");
  if(!config.phoneme_id_map||typeof config.phoneme_id_map!=="object"||!Object.keys(config.phoneme_id_map).length)problems.push("phoneme_id_map vide");
  return problems;
}

/** Empreinte Subresource Integrity (`sha384-<base64>`) d'un contenu binaire. */
export async function computeIntegrity(bytes,algorithm="sha384"){
  const { createHash }=await import("node:crypto");
  return algorithm+"-"+createHash(algorithm).update(bytes).digest("base64");
}
