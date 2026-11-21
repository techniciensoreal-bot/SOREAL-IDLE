import assert from "node:assert/strict";
import { normalizeIdleNguState, idleNguSnapshot } from "../src/idle-ngu-progression.js";
import { idleNguResourceGenerationPerSecond } from "../src/idle-ngu-ressources.js";
import { readFileSync } from "node:fs";

/*
 * Lu dans le jeu (audit IL du 2026-11-20, vérifié le 2026-11-21) : MagicDisplay::updateMagicBar (2622) remplit la barre dès que totalMagicSpeed > 0 sans tester le boss ; Magic::unlockMagic (2618, appelée au boss 37) pose
 * cap >= 10 000 et vitesse >= 3 ; Magic::reset (2619, Rebirth) ne remet que la Magie possédée et la barre. Donc après le premier boss 37, la Magie se produit et s'alloue après chaque Renaissance, avant de refrapper le boss 37.
 * Le système Blood Magic (rituels), lui, reste lié au boss 37 du run.
 */
const t0 = 1_000_000;
const avant = { bosses: 10, bestGold: 1e6, adventurePower: 1e9 };
{
  /* jamais passé le boss 37 : pas de Magie */
  const s = normalizeIdleNguState({}, avant, t0);
  s.records.highestBoss = 20;
  s.systems.bloodMagic.unlocked = false;
  assert.equal(idleNguResourceGenerationPerSecond(s, "magic"), 0, "avant le boss 37, aucune Magie");
}
{
  /* boss 37 déjà franchi une fois, Rebirth fait (boss du run = 5) : la Magie se produit et s'alloue */
  const s = normalizeIdleNguState({}, avant, t0);
  s.records.highestBoss = 40;
  s.systems.bloodMagic.unlocked = false;
  const brut = normalizeIdleNguState(JSON.parse(JSON.stringify(s)), avant, t0);
  assert.ok(brut.resources.magic.cap >= 10000 && brut.resources.magic.speed >= 3, "plafond >= 10 000 et vitesse >= 3 (planchers du jeu)");
  assert.ok(idleNguResourceGenerationPerSecond(brut, "magic") > 0, "la Magie se produit après le Rebirth, avant le boss 37 du run");
  const snap = idleNguSnapshot(brut, avant, t0);
  assert.equal(snap.ngus && snap.ngus.magicUnlocked, true, "l'écran des NGU de Magie est accessible");
}
{
  /* les rituels de Blood Magic restent liés au système (boss 37 du run) */
  const src = readFileSync(new URL("../src/idle-ngu-snapshot.js", import.meta.url), "utf8");
  assert.ok(/bloodRituals: state\.systems\.bloodMagic\?\.unlocked/.test(src), "la liste des rituels dépend toujours du système Blood Magic du run");
}
console.log("idle-magie-apres-rebirth-v1: OK");
