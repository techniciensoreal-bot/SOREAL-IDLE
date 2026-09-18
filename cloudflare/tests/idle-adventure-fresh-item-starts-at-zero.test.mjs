import assert from "node:assert/strict";
import {
  applyIdleAdventureActionV47,
  createIdleAdventureStateV47,
  idleAdventureItemStatsMaxV1
} from "../src/idle-adventure-v47.js";

/*
 * Norman (2026-09-18, capture d'écran du vrai NGU en direct) : "Voici les
 * statistiques telles qu'elles doivent être quand on a le cube tutorial
 * la première fois. On va devoir y mettre des boosts pour atteindre les
 * statistiques maximum (qui augmenteront quand on fusionnera le cube. Il
 * faudra alors de nouveau le reremplir avec des boosts pour atteindre le
 * maximum. C'est comme ça pour tous les items."
 *
 * La capture montre un Tutorial Cube JAMAIS fusionné : Power 0/7,
 * Toughness 0/7, Max Health 0/21, Health Regen 0/0,21 -- la valeur
 * COURANTE part de 0, le PLAFOND (7, 21, 0.21) vient de la formule
 * niveau-par-niveau (inchangée). Un correctif du 2026-09-16 avait conclu
 * l'inverse ("un objet neuf est toujours déjà à son plafond") en
 * mésinterprétant le wiki -- cette capture d'écran du jeu réel prouve le
 * contraire, pour TOUS les objets (équipement ET specials/cube), pas
 * seulement au premier niveau mais aussi juste après une fusion (le
 * niveau grandit, la valeur courante ne bouge jamais toute seule).
 */

// --- Un objet SPECIALS (accessoire) fraîchement créé démarre à 0/0 ---
{
  const s = createIdleAdventureStateV47();
  const r = applyIdleAdventureActionV47(s, { action: "addItem", definitionId: "flubber", level: 10 }, { bosses: 100 }, 1);
  const flubber = r.state.inventory.find((i) => i.definitionId === "flubber");
  assert.ok(flubber, "Le flubber doit avoir été créé.");
  // flubber n'a aucune stat Power/Toughness réelle (p:0,t:0 sur le wiki) -- 0/0 attendu même au plafond.
  assert.equal(flubber.power, 0);
  assert.equal(flubber.toughness, 0);
}

// --- Un objet d'ÉQUIPEMENT (set) fraîchement créé démarre à 0/0, même au niveau 100 ---
{
  const s = createIdleAdventureStateV47();
  const r = applyIdleAdventureActionV47(s, { action: "addItem", definitionId: "forest:weapon", level: 100 }, { bosses: 17 }, 1);
  const weapon = r.state.inventory.find((i) => i.definitionId === "forest:weapon");
  assert.ok(weapon, "L'arme doit avoir été créée.");
  assert.equal(weapon.power, 0, "Même créé directement au niveau 100, un objet frais démarre à power=0 -- jamais déjà à son plafond.");
  assert.equal(weapon.toughness, 0, "Idem pour toughness.");
  assert.equal(weapon.hp, 0, "hp (dérivé de power) doit aussi démarrer à 0.");
  assert.equal(weapon.regen, 0, "regen (dérivé de toughness) doit aussi démarrer à 0.");

  // Le plafond (Y de "X/Y"), lui, reste bien calculé et non nul (Power seul pour une arme, wiki : t:0).
  const { p } = idleAdventureItemStatsMaxV1("forest", "weapon");
  assert.ok(p > 0, "Le catalogue doit toujours porter un vrai plafond Power non nul pour cette arme.");
}

// --- Une fusion augmente le PLAFOND (le niveau) mais jamais la valeur courante toute seule ---
{
  const s = createIdleAdventureStateV47();
  let state = applyIdleAdventureActionV47(s, { action: "addItem", definitionId: "forest:weapon", level: 40 }, { bosses: 17 }, 1).state;
  state = applyIdleAdventureActionV47(state, { action: "addItem", definitionId: "forest:weapon", level: 40 }, { bosses: 17 }, 1).state;
  const ids = state.inventory.filter((i) => i.definitionId === "forest:weapon").map((i) => i.id);
  const merged = applyIdleAdventureActionV47(state, { action: "merge", a: ids[0], b: ids[1] }, { bosses: 17 }, 1)
    .state.inventory.find((i) => i.definitionId === "forest:weapon");
  assert.equal(merged.level, 81, "40+40+1=81 (idleAdventureMergeLevelV47).");
  assert.equal(merged.power, 0, "La fusion ne doit jamais faire apparaître de la stat courante depuis rien -- MAX(0,0)=0, toujours 0 sans boost.");
  assert.equal(merged.toughness, 0, "Idem pour toughness.");
}

console.log("idle-adventure-fresh-item-starts-at-zero: OK");
