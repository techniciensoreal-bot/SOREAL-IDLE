import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root=fileURLToPath(new URL("../public/",import.meta.url));
const forbidden=[
  "SpeechSynthesisUtterance",
  "speechSynthesis"
];

function filesRecursive(dir){
  const out=[];
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const full=path.join(dir,entry.name);
    if(entry.isDirectory())out.push(...filesRecursive(full));
    else if(/\.(?:js|html)$/i.test(entry.name))out.push(full);
  }
  return out;
}

const violations=[];
for(const file of filesRecursive(root)){
  const source=fs.readFileSync(file,"utf8");
  for(const token of forbidden){
    if(source.includes(token)){
      violations.push({
        file:path.relative(root,file).replace(/\\/g,"/"),
        token
      });
    }
  }
}

assert.deepEqual(
  violations,
  [],
  "SOREAL IDLE ne doit plus contenir de Web Speech / SpeechSynthesis côté client."
);

console.log("idle no browser speech: OK — aucun SpeechSynthesis dans cloudflare/public.");
