import assert from "node:assert/strict";
import { possede } from "./_antlers-aide.mjs";
import { normalizeIdleNguState, advanceIdleNguState } from "../src/idle-ngu-progression.js";
import { idleNguEffectiveResourceStatV1 } from "../src/idle-ngu-ressources.js";
import { IDLE_NGU_TRACKS } from "../src/idle-ngu-catalogues.js";

/*
 * Antennes de l'Exilé (340) : HacksController::checkExilePiece (méthode 3180, InvokeRepeating toutes les 60 s, build 1260) : R3 allumée, Hack n°13 (Hack
 * Hack : le n°14 est le Wish Hack, totalWishSpeedBonus) avec R3 = totalCapRes3 - 1, Buster (339) déjà vu -> Antennes.
 */
const ctx = { bosses: 301, rebirths: 1, adventurePower: 1e9, adventureToughness: 1e9 };
const T0 = 1_000_000;

assert.equal(IDLE_NGU_TRACKS.hacks[13].id, "hackHack", "Hack Hack est le 14e (indice 13) de la liste");

function base({ vu = true, actif = "hackHack", delta = 1 } = {}) {
  let s = normalizeIdleNguState({}, ctx, T0);
  s.systems.hacks.unlocked = true;
  s.systems.hacks.data.activeTrack = actif;
  const cap = Math.floor(idleNguEffectiveResourceStatV1(s, "r3", "cap"));
  assert.ok(cap > 5, "le plafond de R3 de départ doit permettre le test (" + cap + ")");
  s.systems.hacks.allocation.r3 = cap - delta;
  if (vu) s.adventure.itemList.exileClueBuster = { maxLevel: 0, seen: true };
  return s;
}
const avancer = (s, secondes) => advanceIdleNguState(s, secondes, ctx, T0 + secondes * 1000);

/* Condition tenue 60 s : une paire d'Antennes ; 59 s : rien. */
{
  assert.equal(possede(avancer(base(), 59).adventure, "exileClueAntennae"), 0);
  const s = avancer(base(), 60);
  assert.equal(possede(s.adventure, "exileClueAntennae"), 1);
  assert.equal(s.adventure.itemList.exileClueAntennae.seen, true);
}
/* Le temps tenu s'accumule d'une synchro à l'autre (3 x 25 s = 75 s -> 1 objet) et un objet par minute tenue. */
{
  let s = base();
  for (let i = 0; i < 3; i++) s = advanceIdleNguState(s, 25, ctx, T0 + (i + 1) * 25_000);
  assert.equal(possede(s.adventure, "exileClueAntennae"), 1);
  assert.equal(possede(avancer(base(), 300).adventure, "exileClueAntennae"), 5, "5 minutes : 5 objets (aucun dédoublonnage dans le jeu)");
}
/* Conditions : Buster non vu, autre hack actif, R3 = plafond (au lieu de plafond - 1) : rien ; la condition perdue remet le temps tenu à zéro. */
assert.equal(possede(avancer(base({ vu: false }), 600).adventure, "exileClueAntennae"), 0, "Buster jamais vu");
assert.equal(possede(avancer(base({ actif: "wish" }), 600).adventure, "exileClueAntennae"), 0, "autre hack");
assert.equal(possede(avancer(base({ delta: 0 }), 600).adventure, "exileClueAntennae"), 0, "R3 = plafond, pas plafond - 1");
assert.equal(possede(avancer(base({ delta: 2 }), 600).adventure, "exileClueAntennae"), 0, "R3 = plafond - 2");
{
  let s = base();
  s = advanceIdleNguState(s, 40, ctx, T0 + 40_000);
  assert.ok(s.systems.hacks.data.exileHoldS > 0);
  s.systems.hacks.allocation.r3 -= 1;
  s = advanceIdleNguState(s, 40, ctx, T0 + 80_000);
  assert.equal(s.systems.hacks.data.exileHoldS, undefined, "condition perdue : compteur effacé");
  assert.equal(possede(s.adventure, "exileClueAntennae"), 0);
}
console.log("ok");
