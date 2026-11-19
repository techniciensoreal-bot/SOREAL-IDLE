/*
 * Génère src/idle-adventure-special-groupes-v1.js : pour chaque objet à Specials, l'ORDRE et le REGROUPEMENT des lignes de Specials du vrai jeu (tests/references/objets-jeu-v1.json, extrait par extraire-objets-jeu-v1.mjs).
 * Dans le jeu, un objet n'a que trois lignes de Special (spec1 à spec3) et un Special Boost les remplit dans CET ordre ; les types 27, 28 et 29 sont UNE ligne qui agit sur l'Energie ET la Magie (Power, Bars, Cap).
 * Le wiki (dont SOREAL tire ses lignes) les affiche en deux lignes jumelles : sans ce regroupement, remplir un objet demandait plus de points de boost que dans le jeu.
 * Format : definitionId -> [[indices des lignes SOREAL de la 1re ligne du jeu], [... de la 2e], ...] ; seulement quand cela diffère de l'ordre naturel [[0],[1],...].
 * Usage : node cloudflare/tools/jeu/generer-groupes-speciaux-v1.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const ICI = path.dirname(fileURLToPath(import.meta.url));
const SRC = pathToFileURL(path.join(ICI, "..", "..", "src")).href + "/";
await import(SRC + "idle-sqlite-runtime.js");
const sets = await import(SRC + "idle-adventure-sets.js");
const obj = await import(SRC + "idle-adventure-objets.js");
const pts = await import(SRC + "idle-adventure-special-points-v1.js");
const ref = JSON.parse(fs.readFileSync(path.join(ICI, "..", "..", "tests", "references", "objets-jeu-v1.json"), "utf8"));
/* type de Special du jeu -> effets SOREAL (déduit des 272 pièces et 121 accessoires dont les points sont uniques ; voir le test de référence) */
const NOMS = { 1: ["energyPowerPct"], 2: ["energySpeedPct"], 3: ["magicPowerPct"], 4: ["magicSpeedPct"], 5: ["dropChancePct"], 7: ["goldDropsPct"], 8: ["energyBarsPct"], 9: ["magicBarsPct"], 11: ["cookingPct"], 12: ["wandoosSpeedPct"], 13: ["advancedTrainingPct"], 14: ["moveCooldownPct"], 15: ["seedGainPct"], 16: ["energyPowerPct"], 17: ["magicPowerPct"], 18: ["energyBarsPct"], 19: ["magicBarsPct"], 20: ["energyCapPct"], 21: ["magicCapPct"], 22: ["nguSpeedPct"], 23: ["respawnReductionPct"], 26: ["beardSpeedPct"], 27: ["energyPowerPct", "magicPowerPct"], 28: ["energyBarsPct", "magicBarsPct"], 29: ["energyCapPct", "magicCapPct"], 30: ["augmentSpeedPct"], 31: ["wandoosSpeedPct"], 32: ["advancedTrainingPct"], 33: ["energyPowerPct"], 34: ["magicPowerPct"], 35: ["energyBarsPct"], 36: ["magicBarsPct"], 37: ["energyCapPct"], 38: ["magicCapPct"], 39: ["nguSpeedPct"], 40: ["goldDropsPct"], 41: ["dropChancePct"], 43: ["yggdrasilYieldPct"], 44: ["daycareSpeedPct"], 45: ["questDropsPct"], 47: ["r3PowerPct"], 48: ["r3BarsPct"], 49: ["r3CapPct"], 50: ["hackSpeedPct"], 51: ["wishSpeedPct"] };
const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const parNom = new Map(); for (const o of ref.objets) { const k = norm(o.nom); if (!parNom.has(k)) parNom.set(k, o); }
const proche = (a, b) => Math.abs(a - b) <= 2e-5 * Math.max(1, Math.abs(b));
const defs = [];
for (const [setId, s] of Object.entries(sets.SETS)) for (const slot of s.slots) defs.push({ def: `${setId}:${slot}`, nom: (sets.SET_ITEM_NAMES_EN_V1 || sets.SET_ITEM_NAMES_V1)[`${setId}:${slot}`], lignes: () => (obj.idleAdventureSetSpecialsV1(setId, slot) || []).map((x) => ({ nom: x[0], cur: x[1], cap: x[2] })) });
for (const [id, d] of Object.entries(sets.SPECIALS_EN_V1)) defs.push({ def: id, nom: d.name, lignes: () => obj.idleAdventureSpecialsListV1(obj.idleAdventureSpecialItemV1(id, 0)).map((x) => ({ nom: x.type, cur: x.base, cap: x.max })) });
const sortie = {}; const rapport = { comparees: 0, sansNom: [], inexplique: [], identiques: 0 };
for (const { def, nom, lignes } of defs) {
  const g = parNom.get(norm(nom)); if (!g) { rapport.sansNom.push(def); continue; }
  const L = lignes(); if (!L.length && !g.spec.length) continue; rapport.comparees++;
  const ex = pts.IDLE_SPECIAL_POINTS_EXP_V1[def] || [];
  const S = L.map((x, i) => ({ nom: x.nom, cur: x.cur * 10 ** (ex[i] ?? 0), cap: x.cap * 10 ** (ex[i] ?? 0) }));
  const pris = new Set(); const groupes = [];
  for (const [t, cur, cap] of g.spec) {
    const noms = NOMS[t]; if (!noms) { rapport.inexplique.push(`${def} : type ${t} inconnu`); continue; }
    /* une ligne du jeu = AU PLUS une ligne SOREAL par effet qu'elle porte (deux effets pour les types 27 à 29) : la 2e ligne du jeu du même type prend les lignes jumelles suivantes */
    const grp = []; for (const n of noms) { const i = S.findIndex((x, j) => !pris.has(j) && x.nom === n && proche(x.cur, cur) && proche(x.cap, cap)); if (i >= 0) { grp.push(i); pris.add(i); } }
    grp.sort((a, b) => a - b);
    if (!grp.length) rapport.inexplique.push(`${def} « ${nom} » : ligne du jeu type ${t} (${cur}/${cap} points) sans ligne SOREAL`); else groupes.push(grp);
  }
  const reste = S.map((_, i) => i).filter((i) => !pris.has(i));
  if (reste.length) rapport.inexplique.push(`${def} « ${nom} » : lignes SOREAL sans ligne du jeu : ${reste.map((i) => S[i].nom + " " + S[i].cap).join(", ")}`);
  const naturel = groupes.length === S.length && groupes.every((gr, i) => gr.length === 1 && gr[0] === i);
  if (naturel) rapport.identiques++; else if (groupes.length) sortie[def] = groupes;
}
const corps = Object.keys(sortie).sort().map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(sortie[k])}`).join(",\n");
fs.writeFileSync(path.join(ICI, "..", "..", "src", "idle-adventure-special-groupes-v1.js"),
`/*
 * GÉNÉRÉ par cloudflare/tools/jeu/generer-groupes-speciaux-v1.mjs (ne pas modifier à la main) à partir de la table des objets du vrai jeu (tests/references/objets-jeu-v1.json, build 1260).
 * Ordre et regroupement des lignes de Specials : le jeu a trois lignes par objet, remplies dans l'ordre par un Special Boost ; les types 27, 28 et 29 (Energie ET Magie : Power, Bars, Cap) sont UNE ligne qui agit sur deux effets
 * (deux lignes jumelles chez SOREAL, comme sur le wiki). Format : definitionId -> [[indices SOREAL de la 1re ligne du jeu], [... de la 2e], ...].
 */
export const IDLE_SPECIAL_GROUPES_V1 = Object.freeze({
${corps}
});
`);
console.log(JSON.stringify({ comparees: rapport.comparees, identiquesALOrdreNaturel: rapport.identiques, avecGroupes: Object.keys(sortie).length, sansNom: rapport.sansNom.length, inexplique: rapport.inexplique.length }));
rapport.inexplique.forEach((x) => console.log(" -", x));
