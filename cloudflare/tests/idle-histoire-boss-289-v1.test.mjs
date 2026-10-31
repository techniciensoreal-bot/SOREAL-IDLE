import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { enregistrerTexteV1, invaliderCacheTextesBossV1 } from "../src/idle-textes-v1.js";
import { histoireComplementBossV1, histoireBossAvecSurchargeSorealIdle_ } from "../src/idle-runtime-catalogue.js";
import { __idleCtx } from "../src/idle-sqlite-runtime.js";
import { traduireReponseV1 } from "../src/idle-traductions-v1.js";
import { lireSrc } from "./_src-sources.mjs";

/*
 * Boss 289 « PirateGirl » : le wiki n'a pas d'histoire pour 272 a 289, la cellule « Histoire » du catalogue de production est vide.
 * Le code fournit la chronique (design/ngu-boss-stories-complement-fr.json) seulement quand la cellule est vide ; catalogue non vide et surcharge admin l'emportent.
 */
const comp = JSON.parse(readFileSync("design/ngu-boss-stories-complement-fr.json", "utf8"));
const attendu = [
  "Arrivant enfin au bout de cette gigantesque étendue d'eau, tu entends une voix particulièrement agacée résonner dans tes oreilles.",
  "Une femme aux sourcils froncés te hurle dessus dans un langage presque incompréhensible. Tu parviens tout juste à distinguer quelques mots comme « saleté », « évier » et « tout le ménage à recommencer ».",
  "Au beau milieu de son interminable discours, tu remarques un détail étrange. Elle porte un cache-œil et un immense chapeau de pirate. Bizarre... T'es presque certain qu'elle n'avait rien de tout ça il y a encore une minute.",
  "BORDEL ! C'est là que tu l'aperçois ! Un énorme crochet métallique au bout de son bras, prêt à t'éventrer !",
  "Cette vieille pirate a beau continuer à déblatérer ses menaces, t'as pas traversé tout cet océan pour te laisser intimider par une râleuse !",
  "Sans lui laisser le temps de terminer sa phrase, tu pousses ton plus terrible cri de guerre et tu la charges tête la première, droit dans le ventre !"
].join("\n");
assert.equal(comp.length, 1);
assert.equal(comp[0].id, 289);
assert.equal(comp[0].story, attendu, "texte exact");

// Cellule vide : le complément ; cellule non vide : le catalogue l'emporte ; autres boss : inchangés.
assert.equal(histoireComplementBossV1(289, ""), attendu);
assert.equal(histoireComplementBossV1(289, "   "), attendu);
assert.equal(histoireComplementBossV1(289, "Texte du catalogue"), "Texte du catalogue");
assert.equal(histoireComplementBossV1(288, ""), "", "pas de complément pour les autres boss");

// Surcharge admin : elle l'emporte sur le complément.
const db = new DatabaseSync(":memory:");
const sql = { exec(q, ...b) { const st = db.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return st.all(...b); st.run(...b); return []; } };
__idleCtx.__idleSql = sql;
invaliderCacheTextesBossV1();
assert.equal(histoireBossAvecSurchargeSorealIdle_(289, histoireComplementBossV1(289, "")), attendu, "sans surcharge : le complément");
enregistrerTexteV1(sql, { cle: "boss:289", champs: { texte: "Version de l'administrateur" } });
invaliderCacheTextesBossV1();
assert.equal(histoireBossAvecSurchargeSorealIdle_(289, histoireComplementBossV1(289, "")), "Version de l'administrateur", "surcharge admin prioritaire");

// Anglais : pas de texte wiki pour 289, la réponse garde le français.
const rep = { numero: 289, histoire: attendu, conseil: "Test" };
assert.equal(traduireReponseV1(rep, "en").histoire, attendu);

// Branchement : le catalogue (donc la fiche, la collection, l'éditeur admin, tous filtrés par boss atteint) passe par le complément.
const cat = lireSrc("idle-runtime-catalogue.js");
assert.ok(cat.includes("histoireComplementBossV1("), "le catalogue utilise le complément");
assert.ok(!/histoire:[^]{0,300}?ligne\.Histoire \|\| ''\s*\)\.trim\(\)/.test(cat.slice(cat.indexOf("function bossCatalogueConstruireSorealIdle_"))), "plus de lecture brute de la cellule");
const adm = lireSrc("idle-sqlite-runtime.js");
assert.ok(adm.includes("original: histoireBossFrAligneeV1(numero,") && adm.includes("ligne && ligne.histoire"), "l'éditeur admin lit l'histoire du catalogue (complément compris)");
console.log("idle-histoire-boss-289-v1 OK");

// Nom du boss 289 (Norman) : FR « La Femme Pirate », EN « Pirate Girl » ; 285 a 288 restent « Intermède » ; une surcharge admin de nom l'emporte.
{
  const { NGU_BOSS_NAMES_FR_V1 } = await import("../src/idle-sqlite-runtime.js");
  const { nomBossSurchargeV1 } = await import("../src/idle-textes-v1.js");
  const noms = JSON.parse(readFileSync("design/ngu-boss-names-fr.json", "utf8"));
  const n289 = noms.find((x) => x.id === 289);
  assert.equal(n289.nomFr, "La Femme Pirate");
  assert.equal(n289.nomEn, "Pirate Girl");
  assert.equal(NGU_BOSS_NAMES_FR_V1.get(289), "La Femme Pirate");
  for (const id of [285, 286, 287, 288]) assert.equal(NGU_BOSS_NAMES_FR_V1.get(id), "Intermède", "boss " + id + " inchange");
  assert.equal(traduireReponseV1({ nom: "La Femme Pirate" }, "en").nom, "Pirate Girl");
  assert.equal(traduireReponseV1({ nom: "Intermède" }, "en").nom !== "Pirate Girl", true);
  enregistrerTexteV1(sql, { cle: "boss:289", champs: { nom: "Nom admin" } });
  invaliderCacheTextesBossV1();
  assert.equal(nomBossSurchargeV1(sql, 289), "Nom admin", "surcharge admin prioritaire");
  assert.ok(cat.includes("NGU_BOSS_NAMES_FR_V1.get(289)"), "le catalogue force le nom de 289");
}
