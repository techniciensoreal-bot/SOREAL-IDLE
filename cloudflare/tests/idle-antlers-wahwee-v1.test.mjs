import assert from "node:assert/strict";
import { neuf, agir, ajouter, equiper, avecAleatoire, possede } from "./_antlers-aide.mjs";
import { IDLE_ADVENTURE_ZONES } from "../src/idle-adventure-v47.js";

/*
 * Buster de l'Exilé (339) : LootDrop::zone13Drop (méthode 501, build 1260), branche boss de la Mégaterres (Docteur Wahwee) : le tirage d'une pièce Mega
 * (8 % x facteur de loot) doit RÉUSSIR ; alors, si le Bois (338) est vu ET tête 130 / torse 131 / jambes 132 / bottes 133 / arme 134 sont équipés, le
 * Buster tombe, sans autre aléa.
 */
const CTX = { bosses: 301, difficulty: "difficile", stats: { power: 1e12, toughness: 1e12 } };
const PIECES = [["head", "mega:head"], ["chest", "mega:chest"], ["legs", "mega:legs"], ["boots", "mega:boots"], ["weapon", "mega:weapon"]];

assert.ok(IDLE_ADVENTURE_ZONES.find(z => z.id === "mega").boss !== undefined);

function setMega(s, sauf) {
  for (const [slot, def] of PIECES) if (slot !== sauf) s = equiper(s, def, slot);
  return s;
}
function tuer(s, { boss = true, alea = 0, zone = "mega" } = {}) {
  s.selectedZone = zone;
  return avecAleatoire(alea, () => agir(s, { action: "zoneKill", stats: CTX.stats }, { ...CTX, forceBoss: boss })).state;
}
function avec338(s) { s.itemList.exileClueAntlers = { maxLevel: 0, seen: true }; return s; }

/* Référence : set complet, Bois vu, tirage de pièce réussi -> Buster. */
{
  const s = tuer(avec338(setMega(neuf())));
  assert.equal(possede(s, "exileClueBuster"), 1);
  assert.equal(s.itemList.exileClueBuster.seen, true);
}
/* Chaque pièce manquante empêche le Buster. */
for (const [slot] of PIECES) {
  const s = tuer(avec338(setMega(neuf(), slot)));
  assert.equal(possede(s, "exileClueBuster"), 0, "sans " + slot);
}
/* Sans le Bois vu : rien. */
assert.equal(possede(tuer(setMega(neuf())), "exileClueBuster"), 0);
/* Pièces dans le sac mais pas portées : rien. */
{
  let s = avec338(neuf());
  for (const [, def] of PIECES) s = ajouter(s, def).s;
  assert.equal(possede(tuer(s), "exileClueBuster"), 0);
}
/* Tirage de pièce Mega raté (le code du jeu saute tout le reste) : rien. */
assert.equal(possede(tuer(avec338(setMega(neuf())), { alea: 0.99 }), "exileClueBuster"), 0);
/* Hors boss : rien, même set complet. Autre zone : rien. */
assert.equal(possede(tuer(avec338(setMega(neuf())), { boss: false }), "exileClueBuster"), 0);
assert.equal(possede(tuer(avec338(setMega(neuf())), { zone: "sewers" }), "exileClueBuster"), 0);
/* Pas de plafond : chaque kill qualifiant en redonne un. */
{
  let s = avec338(setMega(neuf()));
  s = tuer(s);
  s = tuer(s);
  assert.equal(possede(s, "exileClueBuster"), 2);
}
/* « Vu » est posé même sac plein. */
{
  let s = avec338(setMega(neuf()));
  s.bonusSlots = { inventory: 0 };
  let n = 0;
  while (n++ < 2000) { const a = ajouter(s, "exileClueAntennae"); s = a.s; if (!a.o) break; }
  s = tuer(s);
  assert.equal(possede(s, "exileClueBuster"), 0);
  assert.equal(s.itemList.exileClueBuster.seen, true, "marqué vu avant l'ajout, comme markItemAsDropped");
}
console.log("ok");
