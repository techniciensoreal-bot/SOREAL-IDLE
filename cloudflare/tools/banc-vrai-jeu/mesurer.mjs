/*
 * node mesurer.mjs essais.json resultats.json : enchaîne des essais et relève plusieurs grandeurs dans la sauvegarde enregistrée par le vrai jeu.
 * Chaque essai part de la sauvegarde d'origine + « commun » + ses propres changements. La valeur "@maintenant" vaut l'heure actuelle (secondes) :
 * posée dans lastTime, elle supprime les gains hors ligne.
 * Grandeurs : facteur d'attaque/défense (difficulté normale), vitesse du NGU d'énergie n° 0 (barres par seconde), PV d'Aventure actuels
 * (= PV max TOTAUX une fois soigné, zone sûre), niveaux d'entraînement gagnés par seconde, énergie actuelle (posée très haut au départ, le jeu la
 * ramène au cap TOTAL ; posée à 0, sa remontée par seconde suit les barres TOTALES).
 */
import fs from "node:fs";import * as B from "./banc.mjs";
const {commun={},essais}=JSON.parse(fs.readFileSync(process.argv[2],"utf8"));const sortie=process.argv[3];
const res=fs.existsSync(sortie)?JSON.parse(fs.readFileSync(sortie,"utf8")):{};
const base=B.ouvrir(B.ORIGINE).etat;
for(const [nom,ch] of Object.entries(essais)){
  if(res[nom]&&res[nom].ok)continue;
  const tout=()=>Object.fromEntries(Object.entries({...commun,...ch}).map(([k,v])=>[k,v==="@maintenant"?Math.floor(Date.now()/1000):v]));
  let r=await B.passer(tout());if(!r.ecrit)r=await B.passer(tout());
  if(!r.ecrit){res[nom]={ok:false,raison:r.raison||"pas d'enregistrement"};console.log(nom,"ÉCHEC",res[nom].raison)}
  else{
    const d=r.resultat,f=B.facteurs(d),n=d.NGU.skills[0],dt=d.rebirthTime.totalseconds-base.rebirthTime.totalseconds;
    res[nom]={ok:true,secondes:dt,attaque:f.attaque,defense:f.defense,nguBarresParSeconde:(n.level+n.progress)/dt,pvAventure:d.adventure.curHP,energieActuelle:d.curEnergy,energieLibre:d.idleEnergy,energieParSeconde:d.curEnergy/dt,magieActuelle:d.magic.curMagic,nguMagieBarresParSeconde:(d.NGU.magicSkills[0].level+d.NGU.magicSkills[0].progress)/dt,
      entrainementParSeconde:(d.training._attackTraining[0]-base.training._attackTraining[0])/dt};
    console.log(nom.padEnd(30),"t",dt.toFixed(1),"| att x"+f.attaque.toFixed(4),"| NGU",res[nom].nguBarresParSeconde.toExponential(5),"| PV aventure",d.adventure.curHP,"| énergie",d.curEnergy,"libre",d.idleEnergy,"| magie",d.magic.curMagic,"NGU magie",res[nom].nguMagieBarresParSeconde.toExponential(5));
  }
  fs.writeFileSync(sortie,JSON.stringify(res,null,1));
}
