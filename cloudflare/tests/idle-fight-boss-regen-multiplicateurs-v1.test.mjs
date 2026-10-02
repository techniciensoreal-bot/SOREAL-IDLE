import assert from "node:assert/strict";
import { idleRuntimeTestHooks } from "../src/idle-sqlite-runtime.js";

/*
 * HP Regen du joueur en Fight Boss (Norman, 2026-10-02) : « dans NGU la regen finit par remplir la barre de vie ; ici elle reste minuscule ». Wiki NGU, page
 * Boss Fights : « HP while fighting is 10*attack, and HP regain is defense/20 », Attack et Defense multiplicateurs compris. La régénération intégrée ne portait que sur
 * la Defense d'entraînement brute : elle est maintenant mise à l'échelle du même multiplicateur que la Defense réelle.
 */
const { regenPvAvecMultiplicateursSorealIdle_ } = idleRuntimeTestHooks;

// Sans multiplicateur (Defense réelle = Defense d'entraînement) : inchangé.
{
  const moyenneBrute = 1100; // Defense moyenne d'entraînement
  const secondes = 40;
  const regenBrute = moyenneBrute / 20 * secondes;
  assert.equal(regenPvAvecMultiplicateursSorealIdle_(regenBrute, secondes, 1100, 1100), regenBrute);
}

// Avec NUMBER x 1000 : la régénération suit la Defense réelle / 20 (et non la Defense brute).
{
  const secondes = 60;
  const defEntrainement = 1100, defTotale = 100 + 1000 * (defEntrainement - 100); // x1000 sur la partie entraînée
  const regenBrute = defEntrainement / 20 * secondes;
  const regen = regenPvAvecMultiplicateursSorealIdle_(regenBrute, secondes, defTotale, defEntrainement);
  const attendu = defTotale / 20 * secondes;
  assert.ok(Math.abs(regen - attendu) <= attendu * 1e-9, "regen = Defense réelle / 20 par seconde : " + regen + " vs " + attendu);
  assert.ok(regen > regenBrute * 900, "plus de régénération divisée par le multiplicateur");
}

// Defense qui monte pendant la fenêtre (moyenne plus haute que le départ) : la moyenne brute est conservée avant multiplication.
{
  const secondes = 30;
  const moyenneBrute = 5100;
  const regenBrute = moyenneBrute / 20 * secondes;
  const mult = 250;
  const defEntrainement = 10100, defTotale = 100 + mult * (defEntrainement - 100);
  const regen = regenPvAvecMultiplicateursSorealIdle_(regenBrute, secondes, defTotale, defEntrainement);
  const attendu = (100 + (moyenneBrute - 100) * mult) / 20 * secondes;
  assert.ok(Math.abs(regen - attendu) <= attendu * 1e-9);
}

// Cas limites : pas de temps, pas de Defense entraînée.
assert.equal(regenPvAvecMultiplicateursSorealIdle_(10, 0, 5000, 1000), 0);
assert.equal(regenPvAvecMultiplicateursSorealIdle_(10, 5, 100, 100), 10);

console.log("idle-fight-boss-regen-multiplicateurs-v1: OK");
