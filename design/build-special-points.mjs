/*
 * Régénère cloudflare/src/idle-adventure-special-points-v1.js : ratio points/valeur de chaque Special d'équipement, lu sur les fiches du miroir wiki
 * local (notebook/*.md, NGU_WIKI = dossier du miroir). Usage : node design/build-special-points.mjs
 */
import fs from "node:fs";
const dir = (process.env.NGU_WIKI || "C:/Users/n0rma/Documents/NGU-Wiki") + "/notebook/";
const files = fs.readdirSync(dir).filter(f=>/^(0[1-9]|1[0-6])_/.test(f));
const num = (t)=>Number(String(t).replace(/,/g,"").replace(/%/,""));
const items = {};
for (const f of files) {
  const md = fs.readFileSync(dir+f,"utf8");
  const parts = md.split(/\n(?=# )/);
  for (const p of parts) {
    const name = (p.match(/^# (.+)/)||[])[1];
    if (!name) continue;
    const i = p.indexOf("**Specials:**");
    if (i<0) continue;
    const sec = p.slice(i);
    const specs = [];
    const re = /\*\*([^*\n]+)\*\*\n- \*\*Base value:\*\* ([^·\n]+)· \*\*Max stat at lvl 0:\*\* ([^·\n]+)· \*\*Max stat at max lvl:\*\* ([^\n]+)\n- \*\*Base Points:\*\* ([^·\n]+)· \*\*Max Points at lvl 0:\*\* ([^·\n]+)· \*\*Max Points at max lvl:\*\* ([^\n]+)/g;
    let m;
    while ((m = re.exec(sec))) specs.push({stat:m[1].trim(), v:[num(m[2]),num(m[3]),num(m[4])], p:[num(m[5]),num(m[6]),num(m[7])]});
    if (specs.length) items[name.trim()] = specs;
  }
}
console.log(Object.keys(items).length, "objets avec Specials+Points");

const S = new URL("../cloudflare/src/", import.meta.url).href;
const A = await import(S+"idle-adventure-v47.js");
const SS = await import(S+"idle-adventure-set-specials-v1.js");
const norm = (n)=>String(n).toLowerCase().replace(/[’']/g,"'").replace(/\s+/g," ").trim();
const ALIAS={"Casque pourri":"Crappy Helmet","Bottes pourries":"Crappy Boots","Anneau dégoûtant":"Gross Ring","Tutorial Cube":"4G's Merge and Boost Tutorial Cube","Tuba of Time":"The Tuba of Time","Beard Comb":"A Beard Comb","Shrunken Voodoo Doll":"A Shrunken Voodoo Doll"};
const wiki = new Map(Object.entries(items).map(([n,s])=>[norm(n),s]));
const cat = {...A.IDLE_ADVENTURE_ITEM_CATALOG_V1};
for (const key of Object.keys(SS.SET_ITEM_SPECIALS_V1)) { const [set,slot]=key.split(":"); try { const it=A.idleAdventureItemAtLevelV47(key,0); cat[key]={kind:"set",set,slot,name:it.name}; } catch(e) { problems0.push(key+" : "+e.message); } }
const problems0 = []; const out = {}; const problems = []; let total = 0;
const snap = (r) => Math.round(Math.log10(r));
for (const [id,d] of Object.entries(cat)) {
  let mine = null;
  if (d.kind==="set") { const l = SS.SET_ITEM_SPECIALS_V1?.[`${d.set}:${d.slot}`]; if (l) mine = l.map(([t,b,m0,m1])=>({t,b,m0,m1})); }
  else if (d.kind==="special" || d.kind==="cube") { const sp = A.IDLE_ADVENTURE_SPECIALS[id]; if (sp?.sType) { mine=[{t:sp.sType,b:sp.sBase,m0:sp.sMax,m1:sp.sMax*2}]; for (const e of sp.sExtra||[]) mine.push({t:e.type,b:e.base,m0:e.max0,m1:e.max100}); } }
  if (!mine) continue;
  total++;
  const w = wiki.get(norm(ALIAS[d.name]||d.name));
  if (!w) { problems.push(`${id} « ${d.name} » : fiche wiki avec Points introuvable`); continue; }
  if (w.length!==mine.length) { problems.push(`${id} « ${d.name} » : ${mine.length} specials chez nous, ${w.length} sur le wiki`); continue; }
  const ex = [];
  let ok = true;
  for (let i=0;i<mine.length;i++) {
    const a = mine[i], b = w[i];
    const near = (x,y)=>Math.abs(x-y)<=1e-6*Math.max(1,Math.abs(y));
    if (!near(a.m0,b.v[1]) ) { problems.push(`${id} « ${d.name} » special ${i+1} (${a.t}/${b.stat}) : max niveau 0 ${a.m0} chez nous, ${b.v[1]} sur le wiki`); ok=false; break; }
    const r = b.v[1]>0 ? b.p[1]/b.v[1] : (b.v[0]>0 ? b.p[0]/b.v[0] : 0);
    if (!(r>0)) { problems.push(`${id} special ${i+1} : ratio indéterminable`); ok=false; break; }
    ex.push(snap(r));
    const clean = Math.pow(10,snap(r));
    if (Math.abs(r-clean)/clean>0.02) problems.push(`(info) ${id} special ${i+1} : ratio ${r} arrondi à 1e${snap(r)}`);
  }
  if (ok) out[id]=ex;
}
console.log("objets avec specials :", total, " | ratios extraits :", Object.keys(out).length, " | problèmes :", problems.length);
console.log(problems.slice(0,60).join("\n"));

/* --- écriture du module --- */
const lines = Object.entries(out).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`  ${JSON.stringify(k)}: [${v.join(",")}]`);
const src = `/*
 * SOREAL IDLE — « Points » des Specials d'équipement (2026-09-25, page Item data du wiki : « Base Points / Max Points at lvl 0 / Max Points at max lvl »
 * en regard de « Base value / Max stat at lvl 0 / Max stat at max lvl »).
 *
 * Un Special Boost ajoute des POINTS, pas des pourcents : la valeur d'un Special = points / ratio, où ratio = 10^exposant propre à chaque Special de chaque
 * objet (ex. Chef's Apron : Cooking et Energy Power 1 point = 1 % ; Gaudy Epaulettes : Energy Bars 10 points = 1 %, Energy Cap 100 points = 1 % ;
 * Choffice Hat of Greed : Drop Chance 10 000 points = 1 %). Cf. page « Boost » (« Boost power », valeurs totales par force) et Build Cooking (« if you
 * have a Level 0 Chef's Apron, you need to add 30 Special Boosts to it before you can start leveling the Energy Power boost ») : les points remplissent
 * le PREMIER Special jusqu'à son plafond, puis le suivant.
 *
 * Table générée par un script qui lit la fiche wiki de chacun des ${Object.keys(out).length} objets à Specials du jeu et vérifie, Special par Special, que le « Max stat at lvl 0 »
 * wiki égale celui du jeu (ordre des Specials identique). Exposant = log10(Max Points at lvl 0 / Max stat at lvl 0), valeur exacte pour chaque ligne
 * sauf A Battle Corgi (NGU Speed : la fiche donne 500 % / 6 000 000 points au niveau 0 mais 1 200 % / 12 000 000 au niveau 100, incohérent ; on retient 1e4).
 * Format : definitionId -> [exposant du Special 1, exposant du Special 2, ...].
 */
export const IDLE_SPECIAL_POINTS_EXP_V1 = Object.freeze({
${lines.join(",\n")}
});

/* Points par unité de valeur (1 pour un objet ou un Special sans entrée). */
export function idleSpecialPointsRatioV1(definitionId, index) {
  const e = IDLE_SPECIAL_POINTS_EXP_V1[definitionId]?.[index];
  return Number.isFinite(e) ? Math.pow(10, e) : 1;
}
`;
fs.writeFileSync(new URL("../cloudflare/src/idle-adventure-special-points-v1.js", import.meta.url), src);
console.log("module écrit", src.length, "octets");
