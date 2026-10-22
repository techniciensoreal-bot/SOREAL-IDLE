import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-22) : chronique de Gobelin, boss 9 : « Ce cadre est vide : rien à générer » alors que le cadre a du texte. Cause : la liste des blocs de voix retire les doublons (même texte = même voix),
 * donc une phrase répétée dans deux cadres n'existait que pour le premier ; le second cadre n'avait aucun bloc. Chaque cadre retrouve maintenant ses blocs, répétés ou non.
 */
const src = readFileSync(new URL("../public/modules/textes-admin-v1.js", import.meta.url), "utf8");
const debut = src.indexOf("function normaliser_(t){");
const fin = src.indexOf("function parleurOptions_(");
assert.ok(debut > 0 && fin > debut);
function monde(phrases) {
  // blocsDeLecture_ simulé comme le vrai : un bloc par phrase, doublons retirés sauf avecDoublons.
  const lignes = phrases.map((t) => ({ parleur: "homme", texte: t }));
  const blocsDeLecture_ = (v, avecDoublons) => { const vus = {}; const out = []; phrases.forEach((t) => { const hash = "h:" + t; if (vus[hash] && !avecDoublons) return; vus[hash] = 1; out.push({ texte: t, hash, parleur: "homme" }); }); return out; };
  const edition = { def: {}, lignes: { texte: lignes } };
  const f = new Function("blocsDeLecture_", "edition", "lireChamps_", src.slice(debut, fin).replace(/function blocsDeLecture_[^]*?\n}\n/, "") + "\nreturn {blocsDuCadre_,blocsParCadre_};");
  return f(blocsDeLecture_, edition, () => ({}));
}
// Source de blocsDeLecture_ : la version réelle accepte avecDoublons.
const bdl = src.slice(src.indexOf("function blocsDeLecture_("), src.indexOf("function blocsDeLecture_(") + 900);
assert.ok(bdl.includes("function blocsDeLecture_(valeurs,avecDoublons)") && bdl.includes("if(vus[hash]&&!avecDoublons)return;"), "la lecture peut garder les doublons");

const m = monde(["Hé !", "Gobelin content.", "Hé !", "Fin."]);
for (let k = 0; k < 4; k += 1) assert.equal(m.blocsDuCadre_("texte", k, {}).length, 1, "cadre " + (k + 1) + " : un bloc (jamais « vide »)");
assert.equal(m.blocsDuCadre_("texte", 2, {})[0].texte, "Hé !", "le 3e cadre retrouve sa phrase répétée");
assert.equal(m.blocsParCadre_({}).blocs.length, 3, "la liste globale reste sans doublons (une voix par texte)");

// Phrase répétée contenue dans le cadre précédent (« Hé ! » dans « Hé ! Hé ! ») : toujours un bloc par cadre.
const n = monde(["Salut mon grand.", "Salut mon grand.", "Salut mon grand."]);
for (let k = 0; k < 3; k += 1) assert.equal(n.blocsDuCadre_("texte", k, {}).length, 1, "répétition ×3 : cadre " + (k + 1));
// Bloc dont le début ne se retrouve dans aucun cadre (texte transformé à la lecture) : il ne laisse pas le cadre suivant « vide ».
{
  const lignes = [{ parleur: "homme", texte: "Premier cadre." }, { parleur: "homme", texte: "Ça alors, un gobelin !" }];
  const blocs = [{ texte: "Premier cadre.", hash: "a", parleur: "homme" }, { texte: "XYZ transformé", hash: "b", parleur: "homme" }];
  const f = new Function("blocsDeLecture_", "edition", "lireChamps_", src.slice(debut, fin).replace(/function blocsDeLecture_[^]*?\n}\n/, "") + "\nreturn {blocsDuCadre_};");
  const p = f(() => blocs, { def: {}, lignes: { texte: lignes } }, () => ({}));
  assert.equal(p.blocsDuCadre_("texte", 1, {}).length, 1, "le 2e cadre reçoit le bloc non reconnu au lieu de rester vide");
}
console.log("idle-textes-cadres-phrase-repetee-v1: OK");
