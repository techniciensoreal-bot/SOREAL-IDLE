/* Banc d'essai : écrit une sauvegarde modifiée à la place de NGUSaveSteam.txt, lance le vrai jeu, attend son enregistrement automatique, le ferme et relit. */
import fs from "node:fs";import crypto from "node:crypto";import {execSync,spawn} from "node:child_process";import {lireNrbf} from "./nrbf.mjs";
/* Dossier de sauvegardes du jeu (profil Windows courant) ; surcharge possible par NGU_DOSSIER_SAUVEGARDES. */
export const DOSSIER=(process.env.NGU_DOSSIER_SAUVEGARDES||String(process.env.USERPROFILE||"").split("\\").join("/")+"/AppData/LocalLow/NGU Industries/NGU Idle/");
export const SAUVE=DOSSIER+"NGUSaveSteam.txt";
export const ORIGINE=DOSSIER+"NGUSaveSteam-ORIGINAL-avant-essais.txt";
const EXE="C:/Program Files (x86)/Steam/steamapps/common/NGU IDLE/NGUIdle.exe";
export function ouvrir(fichier){
  const externe=Buffer.from(fs.readFileSync(fichier,"utf8").trim(),"base64");
  const t=externe.toString("latin1");const i=t.indexOf("AAEAAAD");let j=i;while(j<t.length&&/[A-Za-z0-9+\/=]/.test(t[j]))j++;
  const interne=Buffer.from(t.slice(i,j),"base64");
  const md5=crypto.createHash("md5").update(interne).digest("base64");const k=t.indexOf(md5,j);
  if(k<0)throw Error("somme de contrôle introuvable dans "+fichier);
  return {externe,interne,debutB64:i,finB64:j,posMd5:k,etat:lireNrbf(interne)};
}
const ecrireType=(buf,o,type,v)=>{switch(type){case 1:buf[o]=v?1:0;break;case 8:buf.writeInt32LE(v,o);break;case 9:buf.writeBigInt64LE(BigInt(Math.round(v)),o);break;case 11:buf.writeFloatLE(v,o);break;case 6:buf.writeDoubleLE(v,o);break;default:throw Error("type non géré "+type)}};
const TAILLE={1:1,8:4,9:8,11:4,6:8};
/* chemin : "adventure.itopod.perkLevel[94]" ou "beastQuest.quirkPoints" */
export function poser(s,chemin,valeur){
  const parts=chemin.replace(/\[(\d+)\]/g,".$1").split(".");let o=s.etat;
  for(let i=0;i<parts.length-1;i++){o=o[parts[i]];if(o==null)throw Error("chemin inconnu "+chemin+" à "+parts[i])}
  const cle=parts[parts.length-1];
  if(Array.isArray(o)){const pos=o.__pos;if(!pos)throw Error("tableau sans position "+chemin);ecrireType(s.interne,pos.debut+Number(cle)*TAILLE[pos.type],pos.type,valeur);o[Number(cle)]=valeur}
  else{const off=o.__off&&o.__off[cle];if(!off)throw Error("champ sans position "+chemin);ecrireType(s.interne,off.debut,off.type,valeur);o[cle]=valeur}
}
export function enregistrer(s,cible){
  const b64=s.interne.toString("base64");if(b64.length!==s.finB64-s.debutB64)throw Error("longueur changée");
  const md5=crypto.createHash("md5").update(s.interne).digest("base64");
  s.externe.write(b64,s.debutB64,"latin1");s.externe.write(md5,s.posMd5,"latin1");
  fs.writeFileSync(cible,s.externe.toString("base64"));
}
const dort=ms=>new Promise(r=>setTimeout(r,ms));
export function jeuEnCours(){try{return /NGUIdle\.exe/i.test(execSync('tasklist /FI "IMAGENAME eq NGUIdle.exe" /NH',{encoding:"latin1"}))}catch{return false}}
export function fermerJeu(){try{execSync('taskkill /IM NGUIdle.exe /F',{stdio:"ignore"})}catch{}}
/* Lance le jeu sur la sauvegarde posée, attend `attendreMs` après le premier enregistrement automatique (ou le délai max), ferme, relit. */
const ARGS=[]; /* aucun argument : Steam demande sinon une confirmation à chaque lancement */
import {fileURLToPath} from "node:url";
const FEN=fileURLToPath(new URL("./fen.ps1",import.meta.url));
function clic(x,y,attente=1500){try{execSync('powershell -NoProfile -ExecutionPolicy Bypass -File "'+FEN+'" -X '+x+' -Y '+y+' -Attente '+attente,{encoding:"utf8"});return true}catch(e){console.log("  clic",x,y,"refusé :",String(e.stdout||"").trim());return false}}
/* Pose la sauvegarde modifiée, lance le jeu, clique « Load Autosave », attend l'enregistrement automatique (environ 60 s), ferme, relit. */
export async function passer(changements,{base=ORIGINE,maxMs=120000}={}){
  if(jeuEnCours()){fermerJeu();await dort(1500)}
  const s=ouvrir(base);for(const [c,v] of Object.entries(changements))poser(s,c,v);
  enregistrer(s,SAUVE);const avant=fs.statSync(SAUVE).mtimeMs;
  const p=spawn(EXE,ARGS,{detached:true,stdio:"ignore",cwd:"C:/Program Files (x86)/Steam/steamapps/common/NGU IDLE"});p.unref();
  await dort(15000);
  /* « Load Autosave », puis « On To The Game! » de l'écran des gains hors ligne. Un clic est annulé si NGU Idle n'est pas la fenêtre active. */
  const c1=clic(258,712,2500);const c2=clic(410,778,1200);
  if(!c1||!c2){fermerJeu();return {ecrit:false,duree:0,resultat:null,raison:"clic annulé (fenêtre pas au premier plan)"}}
  const t0=Date.now();let ecrit=false;
  while(Date.now()-t0<maxMs){await dort(1000);if(fs.statSync(SAUVE).mtimeMs!==avant){ecrit=true;break}}
  await dort(1200);fermerJeu();await dort(1200);
  return {ecrit,duree:Math.round((Date.now()-t0)/1000),resultat:ecrit?ouvrir(SAUVE).etat:null};
}
/* Facteur d'attaque/défense hors entraînement, équipement et NUMBER. */
export function facteurs(d){
  const t=d.training;const base=L=>100+L.reduce((a,l,i)=>a+Math.pow(l,1.3)*t._trainFactor[i],0);
  const inv=d.inventory;const pieces=["head","chest","legs","boots","weapon","weapon2"].map(k=>inv[k]).concat(inv.accs||[]).filter(x=>x&&x.id);
  const ga=pieces.reduce((a,x)=>a+x.curAttack,0),gd=pieces.reduce((a,x)=>a+x.curDefense,0);
  return {attaque:d.attack/(base(t._attackTraining)*(1+ga/100)*d.attackMulti),defense:d.defense/(base(t._defenseTraining)*(1+gd/100)*d.defenseMulti)};
}
