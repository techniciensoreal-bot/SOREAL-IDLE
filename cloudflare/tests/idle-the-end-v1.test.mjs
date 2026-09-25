import assert from "node:assert/strict";
import { normalizeIdleNguState, applyIdleNguAction, advanceIdleNguState, idleNguSnapshot, HACK_HARD_CAP_V1 } from "../src/idle-ngu-progression.js";
import { applyIdleAdventureActionV47 } from "../src/idle-adventure-v47.js";
import { idleCardsActionV1, advanceIdleCardsV1 } from "../src/idle-cards-v1.js";
import { IDLE_THE_END_PIECES_V1, idleTheEndHasV1, idleTheEndCountV1, idleTheEndSnapshotV1 } from "../src/idle-the-end-v1.js";

/*
 * THE END (2026-09-25) : les 16 pièces de la page THE END, leur source, l'absence de spoil et le lancement de la fin.
 */
const ctx = { bosses: 100 };
const has = (s, id) => idleTheEndHasV1(s.adventure, id);
function neuf(difficulty = "extreme", c = ctx) {
  const s = normalizeIdleNguState({}, c, 1_000_000);
  s.difficulty = difficulty;
  return s;
}
function avecRandom(valeur, fn) {
  const avant = Math.random;
  Math.random = () => valeur;
  try { return fn(); } finally { Math.random = avant; }
}

// --- Aucune pièce : rien n'est visible et la fin est indisponible ---
{
  const s = neuf();
  assert.equal(idleNguSnapshot(s, ctx, 1_000_000).adventure.theEnd, undefined, "aucun spoil avant la première pièce");
  assert.equal(idleTheEndCountV1(s.adventure), 0);
  assert.throws(() => applyIdleNguAction(s, { action: "adventure", adventure: { action: "theEndPlay" } }, ctx, 1_000_000), /FIN_INDISPONIBLE/);
  assert.equal(IDLE_THE_END_PIECES_V1.length, 16);
  assert.deepEqual(IDLE_THE_END_PIECES_V1.map((p) => p.id), Array.from({ length: 16 }, (_, i) => 480 + i));
}

// --- Pièces qui suivent l'état : Perk 231 (482), Quirk 176 (486), Wish 203 (490), boss 300 en Sadistic (487) ---
{
  let s = neuf();
  s.systems.perks.unlocked = true;
  s.systems.perks.data.levels = Object.assign({}, s.systems.perks.data.levels, { 231: 1 });
  s.systems.quirks.unlocked = true;
  s.systems.quirks.data.levels = Object.assign({}, s.systems.quirks.data.levels, { 176: 1 });
  s.systems.wishes.data.tracks[203] = { level: 1 };
  s = normalizeIdleNguState(s, { bosses: 299 }, 1_000_001);
  assert.deepEqual([482, 486, 490].map((id) => has(s, id)), [true, true, true]);
  assert.equal(has(s, 487), false, "boss 299 : pas encore");
  s = normalizeIdleNguState(s, { bosses: 300 }, 1_000_002);
  assert.equal(has(s, 487), true, "boss 300 vaincu en Sadistic");
  const normal = normalizeIdleNguState(neuf("normal"), { bosses: 300 }, 1_000_002);
  assert.equal(has(normal, 487), false, "hors Sadistic : rien");
  // premier instantané : les pièces trouvées seulement, sans compteur
  const snap = idleNguSnapshot(s, ctx, 1_000_003).adventure.theEnd;
  assert.deepEqual(snap.pieces.map((p) => p.id), [482, 486, 487, 490]);
  assert.equal(snap.complete, false);
  assert.equal("count" in snap || "total" in snap, false, "jamais de compteur x/16");
}

// --- Move 69 x69 (481), ascensions finales (480 et 485) ---
{
  let s = neuf();
  s.adventure.unlockFlags.move69Unlocked = true;
  for (let i = 0; i < 69; i++) s = applyIdleNguAction(s, { action: "adventure", adventure: { action: "useMove69" } }, ctx, 1_000_000 + i).state;
  assert.equal(has(s, 481), true);

  let a = neuf();
  a = applyIdleNguAction(a, { action: "adventure", adventure: { action: "addItem", definitionId: "ascendedX9Pendant", level: 100 } }, ctx, 1_000_000).state;
  const pendant = a.adventure.inventory.find((o) => o.definitionId === "ascendedX9Pendant");
  a = applyIdleNguAction(a, { action: "adventure", adventure: { action: "transformAdventureItem", id: pendant.id } }, ctx, 1_000_001).state;
  assert.equal(has(a, 480), true);
  assert.equal(a.adventure.inventory.some((o) => o.definitionId === "ascendedX9Pendant"), false, "l'objet est consommé");
  a = applyIdleNguAction(a, { action: "adventure", adventure: { action: "addItem", definitionId: "glitchyLooty", level: 100 } }, ctx, 1_000_002).state;
  const looty = a.adventure.inventory.find((o) => o.definitionId === "glitchyLooty");
  a = applyIdleNguAction(a, { action: "adventure", adventure: { action: "transformAdventureItem", id: looty.id } }, ctx, 1_000_003).state;
  assert.equal(has(a, 485), true);
  // Pas au niveau 100 : refusé
  let b = neuf();
  b = applyIdleNguAction(b, { action: "adventure", adventure: { action: "addItem", definitionId: "ascendedX9Pendant", level: 99 } }, ctx, 1_000_000).state;
  const p2 = b.adventure.inventory.find((o) => o.definitionId === "ascendedX9Pendant");
  assert.throws(() => applyIdleNguAction(b, { action: "adventure", adventure: { action: "transformAdventureItem", id: p2.id } }, ctx, 1_000_001), /OBJET_NON_MAXE/);
}

// --- AMALGAMATE : une pièce par palier, 483 partout, 489 Normal+, 493 Hard+, 484 Brutal ---
{
  const combat = (difficulty) => avecRandom(0, () => applyIdleNguAction(neuf(), { action: "adventure", adventure: { action: "titan", titan: "amalgamate", difficulty, stats: { power: 1e40, toughness: 1e40 } } }, { bosses: 300 }, 1_000_000).state);
  const ids = (s) => [483, 489, 493, 484].filter((id) => has(s, id));
  assert.deepEqual(ids(combat("easy")), [483]);
  assert.deepEqual(ids(combat("normal")), [483, 489]);
  assert.deepEqual(ids(combat("hard")), [483, 489, 493]);
  assert.deepEqual(ids(combat("brutal")), [483, 489, 493, 484]);
  // tirage raté : rien
  const rate = avecRandom(0.999999, () => applyIdleNguAction(neuf(), { action: "adventure", adventure: { action: "titan", titan: "amalgamate", difficulty: "brutal", stats: { power: 1e40, toughness: 1e40 } } }, { bosses: 300 }, 1_000_000).state);
  assert.deepEqual(ids(rate), []);
}

// --- Le Traitor (495) ---
{
  let s = neuf();
  s = applyIdleNguAction(s, { action: "adventure", adventure: { action: "titan", titan: "tippi", difficulty: "easy", stats: { power: 4e34, toughness: 1.5e34 } } }, { bosses: 300 }, 1_000_000).state;
  s = applyIdleNguAction(s, { action: "adventure", adventure: { action: "titan", titan: "traitor", difficulty: "easy", stats: { power: 1.5e35, toughness: 4e34 } } }, { bosses: 300 }, 1_000_001).state;
  assert.equal(has(s, 495), true);
}

// --- Dernier Hack (488) : apparaît quand les 15 autres sont au maximum, 200 000 s, sans Resource 3 ---
{
  let s = neuf();
  s.systems.hacks.unlocked = true;
  assert.equal(idleNguSnapshot(s, ctx, 1_000_000).systems.find((x) => x.id === "hacks").finalHack, undefined, "invisible tant que les autres ne sont pas au maximum");
  for (const [id, cap] of Object.entries(HACK_HARD_CAP_V1)) s.systems.hacks.data.tracks[id].level = cap;
  const vu = idleNguSnapshot(s, ctx, 1_000_000).systems.find((x) => x.id === "hacks").finalHack;
  assert.equal(vu.total, 200000);
  assert.equal(vu.seconds, 0);
  s = advanceIdleNguState(s, 100000, ctx, 1_100_000);
  const mi = idleNguSnapshot(s, ctx, 1_100_000).systems.find((x) => x.id === "hacks").finalHack;
  assert.ok(Math.abs(mi.seconds - 100000) < 1, "1 seconde par seconde");
  assert.equal(has(s, 488), false);
  s = advanceIdleNguState(s, 100000, ctx, 1_200_000);
  assert.equal(has(s, 488), true);
}

// --- Dernier sort de Blood Magic (494) : 5e22 de sang ---
{
  let s = neuf();
  s.systems.bloodMagic.unlocked = true;
  s.currencies.blood = 4.9e22;
  assert.throws(() => applyIdleNguAction(s, { action: "castBloodSpell", spell: "leeches" }, ctx, 1_000_000), /SANG_INSUFFISANT/);
  s.currencies.blood = 5e22;
  s = applyIdleNguAction(s, { action: "castBloodSpell", spell: "leeches" }, ctx, 1_000_000).state;
  assert.equal(has(s, 494), true);
  assert.equal(s.currencies.blood, 0);
}

// --- ITOPOD 1450+ (491) : 0,005 % x (étage - 1449) par kill ---
{
  const tour = (etage) => {
    const c = { adventurePower: 1e60, adventureToughness: 1e60, bosses: 100 };
    let s = normalizeIdleNguState({}, c, 1_000_000);
    s.systems.tower.unlocked = true;
    s.systems.tower.active = true;
    Object.assign(s.systems.tower.data, { floor: etage, killsOnFloor: 0, highestFloor: etage + 1, startFloor: etage, endFloor: etage, kills: 0 });
    return avecRandom(0.5, () => advanceIdleNguState(s, 200_000, c, 1_100_000));
  };
  assert.equal(has(tour(1449), 491), false, "étage 1449 : chance nulle");
  assert.equal(has(tour(1500), 491), true, "étage 1500 : 0,255 % par kill, des milliers de kills : la pièce tombe");
}

// --- Carte THE END (492) : 99 de chaque mayo, à côté d'une carte normale, Sadistic seulement ---
{
  const spawn = (difficulty) => {
    const s = neuf(difficulty);
    s.systems.cards.unlocked = true;
    advanceIdleCardsV1(s, 3600, () => 0);
    return s;
  };
  assert.equal(spawn("normal").systems.cards.data.deck.some((c) => c.theEnd), false, "pas hors Sadistic");
  let s = spawn("extreme");
  const carte = s.systems.cards.data.deck.find((c) => c.theEnd);
  assert.ok(carte, "la carte THE END apparaît");
  assert.deepEqual(Object.values(carte.mayo), [99, 99, 99, 99, 99, 99]);
  assert.throws(() => idleCardsActionV1(s, { mode: "cast", cardId: carte.id }), /MAYO_INSUFFISANTE/);
  for (const k of Object.keys(s.systems.cards.data.mayo)) s.systems.cards.data.mayo[k] = 99;
  const r = idleCardsActionV1(s, { mode: "cast", cardId: carte.id });
  assert.equal(r.theEnd, true);
  assert.equal(has(s, 492), true);
  assert.equal(s.systems.cards.data.deck.some((c) => c.theEnd), false);
  // une fois la pièce trouvée, plus de carte THE END
  advanceIdleCardsV1(s, 36000, () => 0);
  assert.equal(s.systems.cards.data.deck.some((c) => c.theEnd), false);
}

// --- Les 16 réunies : la fin se lance, les pièces restent, le texte n'est servi que par la réponse ---
{
  let s = neuf();
  for (const p of IDLE_THE_END_PIECES_V1) s.adventure.theEnd.pieces[String(p.id)] = 5;
  s = normalizeIdleNguState(s, ctx, 1_000_000);
  const snap = idleNguSnapshot(s, ctx, 1_000_000).adventure.theEnd;
  assert.equal(snap.complete, true);
  assert.equal(snap.pieces.find((p) => p.red).id, 495, "la pièce au bouton rouge est celle du Traitor");
  assert.equal(JSON.stringify(idleNguSnapshot(s, ctx, 1_000_000)).includes("Le dernier coup part"), false, "le texte n'est pas dans l'instantané");
  const r1 = applyIdleNguAction(s, { action: "adventure", adventure: { action: "theEndPlay", clientMutationId: "x1" } }, ctx, 1_000_010);
  assert.ok(Array.isArray(r1.result.text) && r1.result.text.length > 10);
  assert.equal(r1.result.endings, 1);
  assert.equal(JSON.stringify(r1.state.adventure.recentClientMutations).includes("Le dernier coup part"), false, "le texte n'est pas conservé dans l'état");
  const r2 = applyIdleNguAction(r1.state, { action: "adventure", adventure: { action: "theEndPlay" } }, ctx, 1_000_020);
  assert.equal(r2.result.endings, 2);
  assert.equal(idleTheEndCountV1(r2.state.adventure), 16, "les pièces ne disparaissent pas");
}
console.log("idle-the-end-v1: OK");
