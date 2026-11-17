import fs from "node:fs";
export function parse(path){
 const b=fs.readFileSync(path);
 let p=0;
 const be32=()=>{const v=b.readUInt32BE(p);p+=4;return v};
 const metaSize=be32(), fileSize=be32(), version=be32(), dataOff=be32();
 const endian=b[p++]; p+=3;
 // v22 has extra; we have 21
 const ver=[];while(b[p]!==0)ver.push(b[p++]);p++;
 const platform=b.readInt32LE(p);p+=4;
 const tt=b[p++];
 const nt=b.readInt32LE(p);p+=4;
 const types=[];
 for(let i=0;i<nt;i++){
  const cid=b.readInt32LE(p);p+=4; const stripped=b[p++]; const sti=b.readInt16LE(p);p+=2;
  let hash=null; if(cid===114){hash=b.slice(p,p+16).toString("hex");p+=16}
  p+=16; types.push({cid,sti,hash});
 }
 const no=b.readInt32LE(p);p+=4;
 const objs=[];
 for(let i=0;i<no;i++){
  p=(p+3)&~3;
  const pid=b.readBigInt64LE(p);p+=8;
  const start=b.readUInt32LE(p);p+=4; const size=b.readUInt32LE(p);p+=4; const ti=b.readInt32LE(p);p+=4;
  objs.push({pid,start:start+dataOff,size,ti,cid:types[ti].cid,hash:types[ti].hash});
 }
 return {b,objs,types,dataOff};
}
if(process.argv[1].endsWith("sf.mjs")){
 const f=parse("C:/Program Files (x86)/Steam/steamapps/common/NGU IDLE/NGUIdle_Data/"+process.argv[2]);
 console.log(f.objs.length,f.types.length);
 const c={};f.objs.forEach(o=>c[o.cid]=(c[o.cid]||0)+1);console.log(c);
}
