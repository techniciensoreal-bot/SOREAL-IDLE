import fs from "node:fs";import * as B from "./banc.mjs";
const essais=JSON.parse(fs.readFileSync(process.argv[2],"utf8"));const sortie=process.argv[3];
const res=fs.existsSync(sortie)?JSON.parse(fs.readFileSync(sortie,"utf8")):{};
for(const [nom,ch] of Object.entries(essais)){
  if(res[nom]&&res[nom].ok)continue;
  let r=await B.passer(ch);if(!r.ecrit)r=await B.passer(ch);
  if(!r.ecrit){res[nom]={ok:false,raison:r.raison||"pas d'enregistrement"};console.log(nom,"ÉCHEC",res[nom].raison)}
  else{const f=B.facteurs(r.resultat);res[nom]={ok:true,attaque:f.attaque,defense:f.defense};fs.copyFileSync(B.SAUVE,"resultat-"+nom+".txt");console.log(nom.padEnd(28),"attaque x"+f.attaque.toFixed(5),"défense x"+f.defense.toFixed(5))}
  fs.writeFileSync(sortie,JSON.stringify(res,null,1));
}
