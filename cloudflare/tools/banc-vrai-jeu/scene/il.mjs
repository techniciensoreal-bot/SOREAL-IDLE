import { charger, methodes, desassembler } from 'file:///C:/Users/n0rma/Documents/Soreal-code/SOREAL-IDLE/cloudflare/tools/banc-vrai-jeu/lecteur-il.mjs';
const asm = charger('C:/Program Files (x86)/Steam/steamapps/common/NGU IDLE/NGUIdle_Data/Managed/Assembly-CSharp.dll');
for (const a of process.argv.slice(2)) {
 if (/^\d+$/.test(a)) { console.log('=== '+a); console.log(desassembler(asm, +a)); }
 else for (const m of methodes(asm, new RegExp(a))) console.log(m.id, m.nom);
}
