import assert from "node:assert/strict";
import { normalizeIdleNguState, advanceIdleNguState, applyIdleNguAction } from "../src/idle-ngu-progression.js";

/*
 * Boot-up de Wandoos (wiki : « At the beginning of each rebirth, there is a 1-hour boot-up process ... The speed increase is linear, and ranges from 0-100% speed »).
 * EN LIGNE (fenêtres courtes) la barre avance tick par tick avec la rampe linéaire (2026-09-24).
 * HORS LIGNE (absence de 5 minutes ou plus) le jeu fait autrement (Character::wandoosOfflineProgress, build 1260, lu le 2026-11-16 ; audit hors-ligne.md E9) : le boot avance de la durée de l'absence
 * puis la vitesse de la FIN de l'absence vaut pour TOUTE la fenêtre ; niveaux = floor(ticks / ceil(1 / p)) (Character::constantLevelGain), sans compter la fraction de barre en cours.
 */
const ctx = { bosses: 58, bestGold: 1e6, adventurePower: 1e9 };
const T0 = 100_000_000;

function wandoos() {
  let s = normalizeIdleNguState({}, ctx, T0);
  s.adventure.unlockFlags.wandoos = true;
  s = normalizeIdleNguState(s, ctx, T0);
  s.runStartedAt = T0;
  s.systems.wandoos.data.installSeconds = 86400;   /* installation de 24 h terminée */
  s.resources.energy.cap = 1e9;
  s.resources.energy.current = 1e9;
  s = applyIdleNguAction(s, { action: "allocate", system: "wandoos", resource: "energy", value: 1e6 }, ctx, T0).state; /* 0,002 niveau/s a pleine vitesse (facteur d OS 1/25) */
  return s;
}
const total = (x) => x.systems.wandoos.data.dumpEnergyLevel + x.systems.wandoos.data.dumpEnergyProgress;

/* En ligne : petits pas de 1 minute, rampe linéaire intégrée tick par tick : 0,25 x 1800 s x 0,002 = 0,9 niveau... (intégrale de la rampe sur 30 min). */
{
  let pas = wandoos();
  for (let i = 1; i <= 30; i += 1) pas = advanceIdleNguState(pas, 60, ctx, T0 + i * 60 * 1000);
  assert.ok(Math.abs(total(pas) - 0.002 * 1800 * 0.25) < 0.05, `pas de 1 min : ${total(pas)}`);
}
/* Hors ligne, 30 min depuis le début du run : vitesse de boot de la FIN (50 %) pour toute la fenêtre = 0,001 niveau/s, soit 1 000 s par niveau : 1 niveau entier. */
{
  const un = advanceIdleNguState(wandoos(), 1800, ctx, T0 + 1800 * 1000);
  assert.equal(un.systems.wandoos.data.dumpEnergyLevel, 1, `bloc 30 min : ${total(un)}`);
}
/* Hors ligne, 2 h : boot fini à la fin = pleine vitesse pour toute la fenêtre : 0,002 x 7200 = 14,4 niveaux, 14 entiers (jamais la rampe moyennée). */
{
  const un = advanceIdleNguState(wandoos(), 7200, ctx, T0 + 7200 * 1000);
  assert.equal(un.systems.wandoos.data.dumpEnergyLevel, 14, `bloc 2 h : ${total(un)}`);
}
console.log("idle-wandoos-boot-average: OK");
