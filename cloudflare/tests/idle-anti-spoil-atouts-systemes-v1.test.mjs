import assert from "node:assert/strict";
import { idleNguSnapshot, normalizeIdleNguState } from "../src/idle-ngu-progression.js";
import { systemesRequisPerkV1 } from "../src/idle-perks-systemes-v1.js";
import { IDLE_PERKS_CATALOG_V1 } from "../src/idle-perks-v1.js";

/*
 * Norman (2026-11-14) : « dans les atouts, on voit des récompenses pour des systèmes qu'on n'a pas encore débloqués, les barbes par exemple » (AGENTS.md règle n°2).
 * Un atout ou une manie lié à un système verrouillé n'est pas envoyé ; il apparaît quand le système est découvert ; un atout déjà possédé reste visible.
 */
const t0 = 1_000_000;
const neuf = normalizeIdleNguState({}, {}, t0);
neuf.systems.perks.unlocked = true; neuf.systems.quirks.unlocked = true;
const verrouilles = (etat) => ["beards", "diggers", "cards", "hacks", "wishes", "wandoos", "yggdrasil", "timeMachine", "questing", "daycare", "macguffins"].filter((id) => !(etat.systems[id] && etat.systems[id].unlocked));

let s = idleNguSnapshot(neuf, {}, t0);
assert.ok(verrouilles(neuf).length >= 8, "joueur neuf : la plupart des systèmes sont fermés");
for (const liste of [s.perkDefinitions, s.quirkDefinitions]) {
  assert.ok(liste.length > 0, "les atouts sans système restent visibles (énergie, magie, statistiques…)");
  for (const p of liste) {
    const requis = systemesRequisPerkV1(p);
    assert.ok(requis.every((id) => id === "r3" ? false : neuf.systems[id] && neuf.systems[id].unlocked) || requis.length === 0, "atout lié à un système fermé envoyé : " + p.id + " " + p.name + " -> " + requis.join("+"));
  }
  assert.ok(!liste.some((p) => /beard|digger|\bcard|mayo|wandoos|\bhack|\bwish|yggdrasil|\bfruit|macguffin|daycare|\bquest/i.test(p.name + " " + p.effect)), "aucun nom ni effet ne parle d'un système fermé");
}

/* Barbes découvertes : les atouts de barbes apparaissent (et eux seuls de plus). */
const avant = new Set(s.perkDefinitions.map((p) => p.id));
neuf.systems.beards.unlocked = true;
s = idleNguSnapshot(neuf, {}, t0);
const nouveaux = s.perkDefinitions.filter((p) => !avant.has(p.id));
assert.ok(nouveaux.length >= 5 && nouveaux.every((p) => systemesRequisPerkV1(p).includes("beards")), "les atouts de barbes apparaissent avec les barbes");

/* Un atout déjà possédé reste visible même si son système est refermé (données anciennes, Rebirth…). */
const barbe = IDLE_PERKS_CATALOG_V1.find((p) => systemesRequisPerkV1(p).join() === "beards");
neuf.systems.beards.unlocked = false;
neuf.systems.perks.data = neuf.systems.perks.data || {}; neuf.systems.perks.data.levels = { [barbe.id]: 1 };
s = idleNguSnapshot(neuf, {}, t0);
assert.ok(s.perkDefinitions.some((p) => p.id === barbe.id), "atout possédé : visible");
/* Souhaits (Wishes) : même règle (les pistes du système « wishes »). Difficulté Evil pour qu'ils soient accessibles. */
{
  const e = normalizeIdleNguState({ difficulty: "extreme" }, {}, t0);
  e.systems.wishes.unlocked = true;
  const piste = (etat) => (idleNguSnapshot(etat, {}, t0).systems.find((x) => x.id === "wishes") || { tracks: [] }).tracks;
  const avantSouhaits = piste(e);
  assert.ok(avantSouhaits.length > 0, "des souhaits sans système sont visibles");
  assert.ok(!avantSouhaits.some((w) => /beard|digger|card|mayo|chonk|wandoos|hack|yggdrasil|fruit|macguffin|daycare|quest/i.test(w.name + " " + (w.effect || ""))), "aucun souhait ne parle d'un système fermé");
  e.systems.cards.unlocked = true;
  assert.ok(piste(e).length > avantSouhaits.length, "les souhaits de cartes apparaissent avec les cartes");
}
console.log("idle-anti-spoil-atouts-systemes-v1 : OK");
