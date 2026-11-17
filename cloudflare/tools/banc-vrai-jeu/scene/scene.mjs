import fs from "node:fs";
import { charger } from "file:///C:/Users/n0rma/Documents/Soreal-code/SOREAL-IDLE/cloudflare/tools/banc-vrai-jeu/lecteur-il.mjs";
import { parse } from "./sf.mjs";
const D="C:/Program Files (x86)/Steam/steamapps/common/NGU IDLE/NGUIdle_Data/";
export const asm=charger(D+"Managed/Assembly-CSharp.dll");
const L=parse(D+"level0"), G=parse(D+"globalgamemanagers.assets");
// scripts
export const scripts=new Map();
for(const o of G.objs){ if(o.cid!==115)continue; let p=o.start; const b=G.b;
 const rs=()=>{const n=b.readInt32LE(p);p+=4;const s=b.toString("utf8",p,p+n);p+=n;p=(p+3)&~3;return s};
 const name=rs(); p+=4+16; const cn=rs(); const ns=rs(); const am=rs(); scripts.set(o.pid,{cn,ns,am}); }
// type index by name
export const typeByName=new Map(); for(const t of asm.types) if(!typeByName.has(t.nom)) typeByName.set(t.nom,t);
const {cell,str}=asm;
function readBlob(i){const o=asm.tables?0:0; return null}
// blob heap
function blob(idx){ // find #Blob heap: reuse parsing through asm.b — recompute
 return null }
export {L};
export const instances=[];
for(const o of L.objs){ if(o.cid!==114)continue; const b=L.b; let p=o.start+12+4; const fid=b.readInt32LE(p), pid=b.readBigInt64LE(p+4); const s=scripts.get(pid); if(!s)continue; instances.push({o,cn:s.cn,ns:s.ns}); }
if(process.argv[1].endsWith("scene.mjs")){ const c={};instances.forEach(i=>c[i.cn]=(c[i.cn]||0)+1); console.log(Object.keys(c).length, JSON.stringify(Object.entries(c).filter(([k,v])=>v<=3&&/Purchase|Controller|Character|Wish|Digger|Ygg/.test(k)))); }
