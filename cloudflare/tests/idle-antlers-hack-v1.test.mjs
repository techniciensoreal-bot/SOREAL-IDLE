import assert from "node:assert/strict";
import { possede } from "./_antlers-aide.mjs";
import { normalizeIdleNguState, advanceIdleNguState } from "../src/idle-ngu-progression.js";
import { idleNguEffectiveResourceStatV1 } from "../src/idle-ngu-ressources.js";
import { IDLE_NGU_TRACKS } from "../src/idle-ngu-catalogues.js";

/*
 * Antennes de l'Exilé (340) : HacksController::checkExilePiece (méthode 3180), lancée par InvokeRepeating(60 s, 60 s) dans HacksController::Start (méthode 3178, build 1260) :
 * minuterie CONTINUE qui teste la condition à chaque échéance (R3 allumée, Hack n°13 = Hack Hack avec R3 = totalCapRes3 - 1, Buster 339 déjà vu) -> Antennes. Aucun écart avec le jeu.
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
let horloge = T0;
const avancer = (s, secondes) => { horloge += secondes * 1000; return advanceIdleNguState(s, secondes, ctx, horloge); };

/* Première échéance 60 s après le démarrage : 59 s rien, 60 s une paire d'Antennes. */
assert.equal(possede(avancer(base(), 59).adventure, "exileClueAntennae"), 0);
{
  const s = avancer(base(), 60);
  assert.equal(possede(s.adventure, "exileClueAntennae"), 1);
  assert.equal(s.adventure.itemList.exileClueAntennae.seen, true);
}
/* Minuterie continue : 3 x 25 s = 75 s -> UNE échéance (à 60 s) ; 299 s en ligne -> 4 échéances ; 2 x 30 s -> 1. */
{
  let s = base();
  for (let i = 0; i < 3; i++) s = avancer(s, 25);
  assert.equal(possede(s.adventure, "exileClueAntennae"), 1);
  assert.equal(s.systems.hacks.data.exilePhaseS, 15, "phase = 75 - 60");
  assert.equal(possede(avancer(base(), 299).adventure, "exileClueAntennae"), 4, "299 s : échéances à 60, 120, 180, 240 s");
  let u = base(); u = avancer(u, 30); u = avancer(u, 30);
  assert.equal(possede(u.adventure, "exileClueAntennae"), 1);
}
/* La minuterie tourne même quand la condition n'est pas tenue : seule la condition AU MOMENT de l'échéance compte (comme le jeu). */
{
  let s = base({ delta: 2 });                  /* condition fausse (plafond - 2) */
  s = avancer(s, 40);                          /* phase 40, rien */
  assert.equal(possede(s.adventure, "exileClueAntennae"), 0);
  assert.equal(s.systems.hacks.data.exilePhaseS, 40, "la phase avance même si la condition est fausse");
  s.systems.hacks.allocation.r3 += 1;          /* le joueur règle R3 à plafond - 1 */
  s = avancer(s, 20);                          /* échéance à 60 s : condition vraie -> 1 objet */
  assert.equal(possede(s.adventure, "exileClueAntennae"), 1);
  s.systems.hacks.allocation.r3 -= 1;          /* condition perdue avant la prochaine échéance */
  s = avancer(s, 60);
  assert.equal(possede(s.adventure, "exileClueAntennae"), 1, "échéance suivante avec la condition fausse : rien");
}
/* Conditions : Buster non vu, autre hack actif, R3 = plafond (au lieu de plafond - 1) : rien. */
assert.equal(possede(avancer(base({ vu: false }), 240).adventure, "exileClueAntennae"), 0, "Buster jamais vu");
assert.equal(possede(avancer(base({ actif: "wish" }), 240).adventure, "exileClueAntennae"), 0, "autre hack");
assert.equal(possede(avancer(base({ delta: 0 }), 240).adventure, "exileClueAntennae"), 0, "R3 = plafond, pas plafond - 1");
assert.equal(possede(avancer(base({ delta: 2 }), 240).adventure, "exileClueAntennae"), 0, "R3 = plafond - 2");
/* Hors connexion (synchro de 5 minutes ou plus) : le jeu ne rejoue pas ses minuteries, aucune Antenne, la phase repart de 0. */
{
  let s = avancer(base(), 30);
  assert.equal(s.systems.hacks.data.exilePhaseS, 30);
  s = avancer(s, 600);
  assert.equal(possede(s.adventure, "exileClueAntennae"), 0, "hors ligne : rien");
  assert.equal(s.systems.hacks.data.exilePhaseS, undefined, "phase remise à zéro");
}
console.log("ok");
