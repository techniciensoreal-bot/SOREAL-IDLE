import { instances } from "./scene.mjs";
import { dump } from "./des.mjs";
const cn=process.argv[2]; const keys=process.argv[3]?process.argv[3].split(","):null;
for(const i of instances.filter(x=>x.cn===cn)){ const d=dump(i); const r=d.res; const o={}; for(const [k,v] of Object.entries(r)){ if(v&&v.pptr)continue; if(Array.isArray(v)&&v[0]&&v[0].pptr)continue; if(keys&&!keys.includes(k))continue; o[k]=v;} console.log(d.end===d.size?"ok":"MISMATCH",i.o.start,JSON.stringify(o).slice(0,500)); }
