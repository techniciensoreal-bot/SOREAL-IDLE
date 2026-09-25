import assert from "node:assert/strict";
import { normalizeIdleNguState, advanceIdleNguState, rebirthIdleNguState } from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-09-25) : « Quand je te dis que je joue côte à côte, ça veut dire que je fais exactement la même chose dans les 2 jeux. Ta
 * formule d'énergie attribuée au Rebirth n'est pas bonne : j'aurais dû avoir 916 dans SOREAL IDLE également » (NGU : 916, SOREAL : 512).
 *
 * Wiki (Energy) : le cap augmente de 1 « every 20 Energy you get, at every rebirth ». Partie neuve : cap 500, réserve 250, 1 énergie/s.
 * 512 = 500 + ⌊250/20⌋ : SOREAL ne comptait que le remplissage jusqu'au cap. 916 = 500 + ⌊8 3xx/20⌋ : dans NGU la barre continue de se remplir
 * au cap et chaque remplissage compte. generatedThisRun compte donc tout ce que la barre produit, la réserve restant plafonnée au cap.
 */
const context = { bosses: 4 };
const T0 = 1_000_000;
function jouer(secondes) {
  let s = normalizeIdleNguState({}, context, T0);
  assert.equal(s.resources.energy.cap, 500);
  assert.equal(s.resources.energy.current, 250);
  let t = T0;
  for (let ecoule = 0; ecoule < secondes; ecoule += 60) {
    const pas = Math.min(60, secondes - ecoule);
    t += pas * 1000;
    s = advanceIdleNguState(s, pas, context, t);
  }
  return { s, t };
}

// Le run où la réserve ne fait que se remplir : 250 générés -> 512 (inchangé)
{
  const { s, t } = jouer(250);
  assert.equal(s.resources.energy.current, 500);
  assert.equal(s.resources.energy.generatedThisRun, 250);
  const renaitre = rebirthIdleNguState(s, context, t + 3_600_000 * 0);
  assert.equal(renaitre.resources.energy.cap, 512);
}

// Le run qui continue bien après le cap : la réserve reste à 500 mais toute l'énergie produite compte -> 916 (NGU)
{
  const { s, t } = jouer(8330);
  assert.equal(s.resources.energy.current, 500, "la réserve reste plafonnée au cap");
  assert.equal(s.resources.energy.generatedThisRun, 8330, "mais tout ce que la barre a produit compte comme énergie obtenue");
  const renaitre = rebirthIdleNguState(s, context, t);
  assert.equal(renaitre.resources.energy.cap, 916, "500 + ⌊8330/20⌋ = 916, comme dans NGU");
  assert.equal(renaitre.rebirth.resourceGrowth.energyCapGain, 416);
}

// Capture de l'infobulle d'énergie de NGU (Norman, 2026-09-25) : « Max energy on this rebirth is capped at 916. On rebirth, you will have 1114 Energy. Every 20 Energy gained
// grants 1 extra energy... You currently make 2 Energy per second... Current Rebirth Time 33:07 » : 33 min 07 s x 2/s = 3 974 -> +198 -> 916 + 198 = 1114.
{
  let s = normalizeIdleNguState({}, context, T0);
  s.resources.energy.cap = 916;
  s.resources.energy.current = 666;
  s.resources.energy.speed = 2;
  let t = T0;
  for (let ecoule = 0; ecoule < 1987; ecoule += 60) {
    const pas = Math.min(60, 1987 - ecoule);
    t += pas * 1000;
    s = advanceIdleNguState(s, pas, context, t);
  }
  assert.equal(s.resources.energy.generatedThisRun, 3974);
  const renaitre = rebirthIdleNguState(s, context, t);
  assert.equal(renaitre.resources.energy.cap, 1114, "infobulle NGU : « On rebirth, you will have 1114 Energy »");
}

// Le plafond mou de 100 000 est inchangé
{
  const s = normalizeIdleNguState({}, context, T0);
  s.resources.energy.cap = 99_995;
  s.resources.energy.generatedThisRun = 1_000_000;
  const renaitre = rebirthIdleNguState(s, context, T0 + 3_600_000);
  assert.equal(renaitre.resources.energy.cap, 100_000);
}

console.log("idle-energy-cap-growth-counts-overflow-v1: OK");
