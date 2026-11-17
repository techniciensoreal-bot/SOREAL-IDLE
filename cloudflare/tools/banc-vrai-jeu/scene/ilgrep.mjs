import { charger, methodes, desassembler } from "file:///C:/Users/n0rma/Documents/Soreal-code/SOREAL-IDLE/cloudflare/tools/banc-vrai-jeu/lecteur-il.mjs";
import fs from "node:fs";
const asm=charger("C:/Program Files (x86)/Steam/steamapps/common/NGU IDLE/NGUIdle_Data/Managed/Assembly-CSharp.dll");
const re=new RegExp(process.argv[2]);
let cache="ilcache.json"; let all;
if(fs.existsSync(cache)) all=JSON.parse(fs.readFileSync(cache)); else { all={}; for(const m of methodes(asm,/./)){ try{ all[m.nom+"#"+m.id]=desassembler(asm,m.id) }catch(e){} } fs.writeFileSync(cache,JSON.stringify(all)); }
for(const [k,v] of Object.entries(all)){ const hits=v.split("\n").filter(l=>re.test(l)); if(hits.length) console.log(k+"\n   "+hits.slice(0,+process.argv[3]||4).join("\n   ")); }
