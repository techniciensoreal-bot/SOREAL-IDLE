import { asm, scripts, instances, L, typeByName } from "./scene.mjs";
const {b:ab,cell,str,rva2off,tables,rows}=asm;
let blobOff;
{ const u16=o=>ab.readUInt16LE(o),u32=o=>ab.readUInt32LE(o);
 const pe=u32(0x3c); const opt=pe+24; const magic=u16(opt); const dd=opt+(magic===0x20b?112:96); const cli=rva2off(u32(dd+14*8)); const md=rva2off(u32(cli+8));
 const verLen=u32(md+12); let p=md+16+verLen+2; const n=u16(p);p+=2; for(let i=0;i<n;i++){const off=u32(p);p+=8;let nm="";while(ab[p])nm+=String.fromCharCode(ab[p++]);p++;p=(p+3)&~3; if(nm==="#Blob")blobOff=md+off;} }
function blobAt(i){ let o=blobOff+i; let len=ab[o]; let h=1; if((len&0x80)===0){} else if((len&0xc0)===0x80){len=((len&0x3f)<<8)|ab[o+1];h=2}else{len=((len&0x1f)<<24)|(ab[o+1]<<16)|(ab[o+2]<<8)|ab[o+3];h=4} return ab.slice(o+h,o+h+len); }
const types=asm.types;
const tdByRow=new Map(types.map(t=>[t.id,t]));
function baseOf(t){ const v=cell(2,t.id,3); const tag=v&3, idx=v>>2; if(tag===0) return {def:tdByRow.get(idx)}; if(tag===1) return {ref:str(cell(1,idx,1))}; return {}; }
const attrs=new Map(); {
 const T=tables[12]; for(let r=1;r<=T.n;r++){ const par=cell(12,r,0); const tag=par&31, idx=par>>5; if(tag!==1&&tag!==3)continue; const ct=cell(12,r,1); const t2=ct&7,i2=ct>>3; let tn=null; if(t2===3){ const mp=cell(10,i2,0); const tg=mp&7,ix=mp>>3; tn=tg===1?str(cell(1,ix,1)):tg===0?str(cell(2,ix,1)):null;} const k=tag+":"+idx; (attrs.get(k)||attrs.set(k,[]).get(k)).push(tn);} }
// un type est un objet Unity s'il descend (par ses bases dans l'assembly) d'une classe Unity connue
const NOTOBJ=new Set(["Object","ValueType","Enum"]);
function isUnityObj(t){ for(let g=0;t&&g<30;g++){ const b=baseOf(t); if(b.ref)return !NOTOBJ.has(b.ref); if(b.def){t=b.def;continue} return false } return false }
function isEnum(t){ return baseOf(t).ref==="Enum" }
const SIZE={2:1,3:2,4:1,5:1,6:2,7:2,8:4,9:4,10:8,11:8,12:4,13:8};
const STRUCT={Vector2:8,Vector3:12,Vector4:16,Color:16,Color32:4,Quaternion:16,Rect:16,Vector2Int:8,Vector3Int:12,Bounds:24};
function resolveTok(tok){ const tag=tok&3, idx=tok>>2; return tag===0?{def:tdByRow.get(idx)}:tag===1?{ref:str(cell(1,idx,1))}:{} }
function sigType(bl,pos){ const c=bl[pos++]; if(c===0x1d){ const r=sigType(bl,pos); return {t:{k:"arr",el:r.t},pos:r.pos} }
 if(c===0x11||c===0x12){ let v=bl[pos]; let n=1; let val; if((v&0x80)===0){val=v}else if((v&0xc0)===0x80){val=((v&0x3f)<<8)|bl[pos+1];n=2}else{val=((v&0x1f)<<24)|(bl[pos+1]<<16)|(bl[pos+2]<<8)|bl[pos+3];n=4} pos+=n; return {t:{k:c===0x11?"vt":"cls",...resolveTok(val)},pos} }
 if(c===0x15){ const inner=sigType(bl,pos); pos=inner.pos; const n=bl[pos++]; const args=[]; for(let i=0;i<n;i++){const r=sigType(bl,pos);args.push(r.t);pos=r.pos} return {t:{k:"gen",base:inner.t,args},pos} }
 if(c===0x0e)return {t:{k:"str"},pos}; if(c===0x1c)return {t:{k:"obj"},pos}; if(SIZE[c])return {t:{k:"prim",c},pos};
 return {t:{k:"bad",c},pos} }
export function fieldsOf(tname){
 let t=typeByName.get(tname); const chain=[]; while(t){chain.unshift(t); const b=baseOf(t); t=b.def;}
 const out=[]; for(const t of chain){ for(let f=t.champs[0];f<t.champs[1];f++){ const fl=cell(4,f,0); const acc=fl&7; const stat=fl&0x10, lit=fl&0x40, ro=fl&0x20; if(stat||lit||ro)continue; const at=attrs.get("1:"+f)||[]; const ser=at.includes("SerializeField"); if(acc!==6&&!ser)continue; if(at.includes("NonSerializedAttribute")||at.includes("NonSerialized"))continue; const bl=blobAt(cell(4,f,2)); const r=sigType(bl,1); { const tt=r.t; const nested=(x)=>x.k==='arr'?(x.el.k==='arr'||(x.el.k==='gen')):(x.k==='gen'&&(x.base.ref==='Dictionary`2'||x.args.some(a=>a.k==='arr'||a.k==='gen'))); if(nested(tt)) continue; const base=tt.k==='arr'?tt.el:(tt.k==='gen'?tt.args[0]:tt); if(base&&base.def&&!isEnum(base.def)&&!isUnityObj(base.def)&&!(cell(2,base.def.id,0)&0x2000)) continue; } out.push({name:str(cell(4,f,1)),t:r.t,owner:t.nom}); } }
 return out; }
function align(p){return (p+3)&~3}
export function readType(b,p,t,depth=0,inArr=false){
 if(t.k==="prim"){ const c=t.c; let v; if(c===12){v=b.readFloatLE(p);p+=4}else if(c===13){v=b.readDoubleLE(p);p+=8}else if(c===8){v=b.readInt32LE(p);p+=4}else if(c===9){v=b.readUInt32LE(p);p+=4}else if(c===10){v=Number(b.readBigInt64LE(p));p+=8}else if(c===11){v=Number(b.readBigUInt64LE(p));p+=8}else if(c===6){v=b.readInt16LE(p);p+=2;if(!inArr)p=align(p)}else if(c===7||c===3){v=b.readUInt16LE(p);p+=2;if(!inArr)p=align(p)}else{v=b[p];p+=1;if(!inArr)p=align(p)} return [v,p]; }
 if(t.k==="str"){ const n=b.readInt32LE(p);p+=4; if(n<0||n>100000)throw new Error("str "+n); const s=b.toString("utf8",p,p+n);p+=n;return [s,align(p)] }
 if(t.k==="arr"||(t.k==="gen"&&t.base.ref==="List`1")){ const el=t.k==="arr"?t.el:t.args[0]; const n=b.readInt32LE(p);p+=4; if(n<0||n>2000000)throw new Error("arr "+n); const a=[]; for(let i=0;i<n;i++){const r=readType(b,p,el,depth+1,true);a.push(r[0]);p=r[1]} return [a,align(p)] }
 if(t.k==="vt"||t.k==="cls"){ if(t.ref){ if(STRUCT[t.ref]){const n=STRUCT[t.ref]/4; const v=[];for(let i=0;i<n;i++)v.push(b.readFloatLE(p+4*i)); if(t.ref==="Color32")return [0,p+4]; return [v,p+STRUCT[t.ref]]} if(t.ref==="AnimationCurve"||t.ref==="Gradient") throw new Error("complex "+t.ref); if(t.ref==="LayerMask")return [b.readInt32LE(p),p+4]; return [{pptr:t.ref},p+12]; }
   const d=t.def; if(isEnum(d)){return [b.readInt32LE(p),p+4]} if(t.k==="cls"&&isUnityObj(d))return [{pptr:d.nom},p+12];
   const fs=fieldsOf(d.nom); const o={}; for(const f of fs){const r=readType(b,p,f.t,depth+1);o[f.name]=r[0];p=r[1]} return [o,align(p)] }
 throw new Error("type "+JSON.stringify(t)); }
export function dump(inst){ const b=L.b; const o=inst.o; let p=o.start+12+4+12; const n=b.readInt32LE(p);p+=4+n;p=align(p);
 const fs=fieldsOf(inst.cn); const res={}; let err=null; for(const f of fs){ try{ const r=readType(b,p,f.t); res[f.name]=r[0]; p=r[1]; }catch(e){err=f.name+": "+e.message; break} } return {res,end:p-o.start,size:o.size,err,fs}; }
if(process.argv[1].endsWith("des.mjs")){ const cn=process.argv[2]; const i=instances.find(x=>x.cn===cn); const d=dump(i); console.log("size",d.size,"consumed",d.end,"err",d.err); const s=JSON.stringify(d.res); console.log(s.slice(0,+process.argv[3]||3000)); }
