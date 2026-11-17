import { instances } from "./scene.mjs";
import { dump } from "./des.mjs";
import fs from "node:fs";
const out={}; const seen=new Map();
for(const i of instances){ seen.set(i.cn,(seen.get(i.cn)||0)+1); if(seen.get(i.cn)>1)continue;
  try{ const d=dump(i); out[i.cn]={ok:d.end===d.size&&!d.err,size:d.size,end:d.end,err:d.err,res:d.res}; }catch(e){out[i.cn]={ok:false,err:String(e)}} }
fs.writeFileSync("scene-dump.json",JSON.stringify(out));
const bad=Object.entries(out).filter(([k,v])=>!v.ok); console.log(Object.keys(out).length,"classes; mismatch:",bad.length); console.log(bad.map(([k,v])=>k+"("+v.end+"/"+v.size+" "+(v.err||"")+")").join("\n"));
