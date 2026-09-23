import assert from "node:assert/strict";
import {
  IDLE_WANDOOS_OS_V1,
  normalizeIdleNguState,
  advanceIdleNguState,
  applyIdleNguAction,
  rebirthIdleNguState,
  idleNguBonuses
} from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-09-18) : "il faut tout faire" (fidélité Evil/Sadistic).
 * Wandoos reconstruit de zéro -- l'ancien système était une piste unique
 * "energy"/"magic" (comme Beards), incompatible avec le vrai mécanisme où
 * Energy ET Magic Dump progressent simultanément et se multiplient (wiki
 * NGU, page "Wandoos"), et ses niveaux n'étaient JAMAIS lus par le combat
 * (système mort). Sources : /wiki/Wandoos, /wiki/Advanced_Training,
 * /wiki/Energy (pour le "speed-cap de 50/s" = le tick-rate du moteur,
 * pas une courbe propre à Wandoos -- "Energy Power does not affect the
 * speed on the Energy dump", donc vitesse linéaire à l'allocation).
 */

const context = { bosses: 58, bestGold: 1e6, adventurePower: 1e9 };

// Wandoos a un boot-up d'1h (0 -> 100% linéaire, wiki section "Boot-up") : les
// tests de vitesse de Dump ne veulent PAS mesurer le boot, seulement la
// vitesse une fois démarré -- runStartedAt est donc placé 2h avant `now`.
// `now` doit rester assez grand pour que runStartedAt (now - 2h en ms) ne
// soit jamais négatif (sinon normalizeIdleNguState le plafonne à 0, ce qui
// fausserait le calcul du boot-up avec un "runStartedAt" different de 2h).
function unlockedWandoos(now = 100_000_000) {
  let state = normalizeIdleNguState({}, context, now);
  state.adventure.unlockFlags.wandoos = true;
  state = normalizeIdleNguState(state, context, now);
  state.runStartedAt = now - 2 * 3600 * 1000;
  assert.equal(state.systems.wandoos.unlocked, true, "Sanity: wandoos doit être débloqué via adventure.unlockFlags.wandoos.");
  return state;
}

// --- Formules de bonus de combat par OS (wiki, section "Operating Systems") ---
assert.ok(Math.abs(IDLE_WANDOOS_OS_V1["98"].statBonus(100, 25) - Math.pow(2 * 2, 0.8)) < 1e-9, "Wandoos 98 : ((1+E/100)(1+M/25))^0.8, E=100/M=25 -> (2*2)^0.8.");
assert.ok(Math.abs(IDLE_WANDOOS_OS_V1.meh.statBonus(5, 1) - (2 * 3)) < 1e-9, "Wandoos MEH : (1+E/5)(1+M*2), E=5/M=1 -> 2*3=6.");
assert.ok(Math.abs(IDLE_WANDOOS_OS_V1.xl.statBonus(1, 1) - Math.pow(7 * 41, 1.05)) < 1e-6, "Wandoos XL : ((1+E*6)(1+M*40))^1.05, E=1/M=1 -> (7*41)^1.05.");

// --- Seuils Energy/Magic par OS x difficulté (valeurs littérales du wiki) ---
assert.deepEqual(IDLE_WANDOOS_OS_V1["98"].requirement, { normal: 1e9, difficile: 1e21, extreme: 1e33 });
assert.deepEqual(IDLE_WANDOOS_OS_V1.meh.requirement, { normal: 1e12, difficile: 1e27, extreme: 1e39 });
assert.deepEqual(IDLE_WANDOOS_OS_V1.xl.requirement, { normal: 1e15, difficile: 1e33, extreme: 1e45 });

// --- Vitesse de dump : linéaire jusqu'au plafond moteur de 50 niveaux/s ---
{
  let state = unlockedWandoos();
  state.resources.energy.cap = 1e9;
  state.resources.energy.current = 1e9;
  state = applyIdleNguAction(state, { action: "allocate", system: "wandoos", resource: "energy", value: 1e9 }, context, 100_000_000).state;
  assert.equal(state.systems.wandoos.allocation.energy, 1e9, "Sanity : l'allocation doit refléter exactement la valeur demandée.");
  // Allocation = seuil exact (1e9 pour 98/Normal) -> 50/s au niveau d'OS 0 (multiplicateur = niveau + 1
  // = 1, wiki Wandoos). Le plafond de 50 niveaux/s (1 niveau par tick) s'applique APRES les multiplicateurs.
  const after = advanceIdleNguState(state, 1, context, 100_000_001);
  assert.equal(after.systems.wandoos.data.dumpEnergyLevel, 50, "50 (seuil) x 1 (niveau d'OS 0) = 50.");
}
{
  let state = unlockedWandoos();
  state.resources.energy.cap = 1e9;
  state.resources.energy.current = 1e9;
  // Moitié du seuil -> moitié de la vitesse de base (25/s), la vitesse de base est bien
  // linéaire à l'allocation ; x1 (niveau d'OS 0) comme ci-dessus.
  state = applyIdleNguAction(state, { action: "allocate", system: "wandoos", resource: "energy", value: 5e8 }, context, 100_000_000).state;
  const after = advanceIdleNguState(state, 1, context, 100_000_001);
  assert.equal(after.systems.wandoos.data.dumpEnergyLevel, 25, "25 (moitié du seuil) x 1 (niveau d'OS 0) = 25.");
}
{
  // Niveau d'OS 9 : x10 ; 1/10 du seuil suffit pour atteindre 50/s, jamais au-delà (plafond final).
  let state = unlockedWandoos();
  state.resources.energy.cap = 1e9;
  state.resources.energy.current = 1e9;
  state.systems.wandoos.data.osLevels = { moneyPit: 9, consumed98: 0, consumedXl: 0 };
  state = applyIdleNguAction(state, { action: "allocate", system: "wandoos", resource: "energy", value: 1e9 }, context, 100_000_000).state;
  const after = advanceIdleNguState(state, 1, context, 100_000_001);
  assert.equal(after.systems.wandoos.data.dumpEnergyLevel, 50, "le plafond de 50 niveaux/s s'applique après le multiplicateur d'OS");
}

// --- Changement d'OS : les niveaux de Dump repartent à 0 (wiki : \"lost when switching\") ---
{
  let state = unlockedWandoos();
  state.systems.wandoos.data.dumpEnergyLevel = 40;
  state.systems.wandoos.data.dumpMagicLevel = 12;
  state = applyIdleNguAction(state, { action: "selectWandoosOs", os: "xl" }, context, 100_000_000).state;
  assert.equal(state.systems.wandoos.data.os, "xl");
  assert.equal(state.systems.wandoos.data.dumpEnergyLevel, 0, "Changer d'OS doit remettre le Dump Energy à 0.");
  assert.equal(state.systems.wandoos.data.dumpMagicLevel, 0, "Changer d'OS doit remettre le Dump Magic à 0.");
}

// --- Rebirth : Dump levels perdus, OS + osLevels permanents conservés ---
{
  let state = unlockedWandoos();
  state.systems.wandoos.data.os = "meh";
  state.systems.wandoos.data.dumpEnergyLevel = 30;
  state.systems.wandoos.data.dumpMagicLevel = 8;
  state.systems.wandoos.data.osLevels.moneyPit = 12;
  state.records.highestBoss = 58;
  const after = rebirthIdleNguState(state, { bosses: 58 }, 200_000_000);
  assert.equal(after.systems.wandoos.data.os, "meh", "L'OS sélectionné doit survivre au rebirth (\"Wandoos remains unlocked throughout rebirths\").");
  assert.equal(after.systems.wandoos.data.dumpEnergyLevel, 0, "Le Dump Energy doit être remis à 0 au rebirth.");
  assert.equal(after.systems.wandoos.data.dumpMagicLevel, 0, "Le Dump Magic doit être remis à 0 au rebirth.");
  assert.equal(after.systems.wandoos.data.osLevels.moneyPit, 12, "Le niveau d'OS (permanent, hors rebirth) doit survivre.");
}

// --- Le combat lit enfin le multiplicateur Wandoos (système auparavant totalement mort) ---
{
  const withoutWandoos = idleNguBonuses(normalizeIdleNguState({}, context, 100_000_000)).attackMultiplier;
  let state = unlockedWandoos();
  state.systems.wandoos.data.dumpEnergyLevel = 100;
  state.systems.wandoos.data.dumpMagicLevel = 25;
  const withWandoos = idleNguBonuses(state).attackMultiplier;
  assert.ok(withWandoos > withoutWandoos, "Des niveaux de Dump Wandoos 98 (100E/25M) doivent augmenter attackMultiplier -- ce système était mort avant ce correctif.");
}

console.log("idle-wandoos-v1: OK");
