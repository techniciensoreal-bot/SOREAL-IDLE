// Norman (2026-11-02) : « il me faut non stop le troll de me prendre mon énergie ; il doit y avoir une limite, ça empêche d'avancer ; il doit alterner ».
// Un troll qui vient de tomber ne retombe pas pendant les 3 tirages suivants (ou, faute de choix, au moins pas deux fois de suite).
import assert from "node:assert/strict";
import { normalizeIdleNguState, advanceIdleNguState } from "../src/idle-ngu-progression.js";
import { createTrollStateV1, IDLE_TROLL_INTERVALS_S_V1 } from "../src/idle-ngu-systemes.js";

const T0 = 1_000_000_000_000, CONTEXTE = { bosses: 68 };
function depart(systemes) {
  const s = normalizeIdleNguState({}, CONTEXTE, T0);
  s.systems.challenges.unlocked = true; s.records.highestBoss = 68;
  for (const t of ["t2", "t3", "t4"]) s.adventure.titans[t] = Object.assign({}, s.adventure.titans[t], { kills: 1 });
  s.adventure.itemList = s.adventure.itemList || {};
  for (const slot of ["head", "chest", "legs", "boots", "weapon", "necklace", "meat"]) s.adventure.itemList["grb:" + slot] = { seen: true };
  s.challenge.bestMs = { basic: 1000 }; s.challenge.active = "troll"; s.challenge.startedAt = T0; s.runStartedAt = T0;
  for (const id of systemes) if (s.systems[id]) s.systems[id].unlocked = true;
  return s;
}
function sequence(systemes, tirages, graine) {
  let s = depart(systemes), t = T0, g = graine;
  const vrai = Math.random; Math.random = () => { g = (g * 1664525 + 1013904223) % 4294967296; return g / 4294967296; };
  const ids = [];
  try {
    let vus = 0;
    while (ids.length < tirages) {
      s.challenge.troll.timer = IDLE_TROLL_INTERVALS_S_V1[0] - 1;
      t += 1000; s = advanceIdleNguState(s, 1, CONTEXTE, t);
      const seq = s.challenge.troll.last?.seq || 0;
      if (seq > vus) { vus = seq; if (!s.challenge.troll.last.big) ids.push(s.challenge.troll.last.id); }
    }
  } finally { Math.random = vrai; }
  return ids;
}
for (const graine of [1, 7, 42, 99, 12345]) {
  // peu de systèmes possédés : or, boîtes, énergie, chaton seulement (4 petits trolls)
  const peu = sequence([], 60, graine);
  for (let i = 1; i < peu.length; i++) assert.notEqual(peu[i], peu[i - 1], "jamais deux fois de suite le même troll (graine " + graine + ")");
  for (let i = 3; i < peu.length; i++) assert.ok(![peu[i - 1], peu[i - 2], peu[i - 3]].includes(peu[i]) || new Set(peu).size < 4, "un troll ne retombe pas dans les 3 tirages suivants (graine " + graine + ")");
  const energie = peu.filter((x) => x === "energy").length;
  assert.ok(energie <= Math.ceil(peu.length / 3), "l'énergie ne tombe pas plus d'une fois sur trois : " + energie + "/" + peu.length);
  // tous les systèmes possédés : 9 petits trolls, aucun retour avant 3 autres
  const tous = sequence(["augmentations", "bloodMagic", "timeMachine", "wandoos"], 60, graine);
  for (let i = 3; i < tous.length; i++) assert.ok(![tous[i - 1], tous[i - 2], tous[i - 3]].includes(tous[i]), "un troll ne retombe pas avant 3 autres (graine " + graine + ")");
}
assert.deepEqual(createTrollStateV1({ hist: ["energy", "gold", "kitty", "boxes", "x"] }).hist, ["gold", "kitty", "boxes", "x"].slice(-3), "l'historique est borné à 3");
assert.deepEqual(createTrollStateV1({}).hist, [], "historique vide au départ");
console.log("idle-troll-alternance-v1 : OK");
