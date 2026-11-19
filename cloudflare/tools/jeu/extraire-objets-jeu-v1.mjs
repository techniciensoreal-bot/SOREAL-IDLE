/*
 * Extraction de la TABLE DES OBJETS du vrai jeu (build 1260) : ItemNameDesc::constructItemInfo (Assembly-CSharp.dll) pose, pour chacun des 515 objets, son type, son boss requis, sa Power/Toughness
 * COURANTE (« cur », ce avec quoi l'objet tombe) et son PLAFOND (« cap », au niveau 0), et jusqu'à trois Specials (type, cur, cap en POINTS). Écrit cloudflare/tests/references/objets-jeu-v1.json,
 * que les tests comparent au moteur (idle-objets-jeu-reference-v1). À relancer seulement si le jeu change (nécessite l'installation Steam de NGU IDLE).
 * Usage : node cloudflare/tools/jeu/extraire-objets-jeu-v1.mjs ["C:/chemin/Assembly-CSharp.dll"]
 * Règles de l'inventaire lues dans la même DLL (documentées dans le JSON, clé « regles ») : Equipment::maxEquipBoost / boostEquip / mergeItem / levelUp, ItemNameDesc::makeLevelledLoot / genLoot.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { charger, desassembler } from "../banc-vrai-jeu/lecteur-il.mjs";
const ICI = path.dirname(fileURLToPath(import.meta.url));
const DLL = process.argv[2] || "C:/Program Files (x86)/Steam/steamapps/common/NGU IDLE/NGUIdle_Data/Managed/Assembly-CSharp.dll";
const asm = charger(DLL);
const CONSTRUCT_ITEM_INFO = 3809;   /* identifiant de méthode du build 1260 (m.mjs '^ItemNameDesc::constructItemInfo') */
const L = desassembler(asm, CONSTRUCT_ITEM_INFO).split("\n");
const nombre = (s) => { let m;
  if (/ldc\.i4\.m1/.test(s)) return -1;
  if ((m = s.match(/ldc\.i4\.(\d)$/))) return Number(m[1]);
  if ((m = s.match(/ldc\.i4(?:\.s)? (-?\d+)/))) return Number(m[1]);
  if ((m = s.match(/ldc\.r[48] (\S+)/))) return Number(m[1]);
  return null; };
const objets = {};
for (let i = 0; i < L.length - 4; i++) {
  const m = L[i + 1] && L[i + 1].match(/ldfld ItemNameDesc\.(\w+)/);
  if (!m || !/ldarg\.0/.test(L[i])) continue;
  const idx = nombre(L[i + 2]); const brut = L[i + 3];
  const val = brut.includes("ldstr") ? brut.match(/ldstr "(.*)"/)[1] : nombre(brut);
  if (idx == null || !/stelem/.test(L[i + 4] || "")) continue;
  (objets[idx] ||= {})[m[1]] = val;
}
const liste = Object.keys(objets).map(Number).sort((a, b) => a - b).map((id) => {
  const g = objets[id];
  const spec = [1, 2, 3].filter((k) => g["specType" + k]).map((k) => [g["specType" + k], g["curSpec" + k], g["capSpec" + k]]);
  return { id, nom: g.itemName, type: g.type, boss: g.bossRequired, curP: g.curAttack, capP: g.capAttack, curT: g.curDefense, capT: g.capDefense, spec };
});
const sortie = {
  source: "NGU IDLE build 1260, Assembly-CSharp.dll, ItemNameDesc::constructItemInfo (lecture IL, jamais de mémoire)",
  types: "0 casque, 1 plastron, 2 jambières, 3 bottes, 4 arme, 5 accessoire, 6/7/8 boosts Power/Toughness/Special, 9 vide, 10 objet de quête, 11 MacGuffin",
  specialsTypes: "27 = Energy+Magic Power, 28 = Energy+Magic Bars, 29 = Energy+Magic Cap (UNE ligne du jeu, deux effets) ; les autres types sont simples",
  regles: {
    plafond: "maximum d'une stat au niveau L = floor(cap x (1 + L/100)), calculé en float32 (Equipment::maxEquipBoost, boostEquip, mergeItem)",
    loot: "un objet tombe avec la stat COURANTE de sa table (cur), au niveau voulu, SANS être remonté au maximum (ItemNameDesc::makeLevelledLoot : level = arg, cur de la table)",
    boost: "Power/Toughness : cur += force x multiplicateur, bornée au maximum ; refusé (boost conservé) si cur >= maximum. Special : les points remplissent le Special 1 jusqu'à son maximum, puis le 2, puis le 3 (Equipment::boostEquip)",
    fusion: "niveau = a + b + 1 (borné à 100, sauf type 11), cur = max des deux cur, bornée au nouveau maximum : l'objet doit être de nouveau boosté (Equipment::mergeItem)",
    multiplicateurBoost: "AllItemListController::boostBonus = (1 + 0,02 x boosts maxxés) x 1,2 (Badly Drawn) x 1,2 (Construction) x bonus ITOPOD x bonus quêtes de bêtes"
  },
  objets: liste
};
fs.writeFileSync(path.join(ICI, "..", "..", "tests", "references", "objets-jeu-v1.json"), JSON.stringify(sortie));
console.log("objets extraits :", liste.length);
