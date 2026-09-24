import assert from "node:assert/strict";
import fs from "node:fs";
import { normalizeIdleNguState, applyIdleNguAction, idleNguSnapshot } from "../src/idle-ngu-progression.js";

/*
 * 2026-09-24 : `collectSystem('yggdrasil')` lisait un `data.growth` que rien
 * n'écrit (code mort, WORKLOG « Yggdrasil complété »). La branche est retirée :
 * les fruits passent par useYggFruit. Le Daily Spin et le Blood Magic gardent
 * leur action « collect ».
 */
const ctx = { bosses: 100 };
const src = fs.readFileSync(new URL("../src/idle-ngu-progression.js", import.meta.url), "utf8");
assert.ok(!/\w\.data\.growth\b/.test(src), "plus aucune lecture de <système>.data.growth");

{
  const s = normalizeIdleNguState({}, ctx, 0);
  s.systems.yggdrasil.unlocked = true;
  s.systems.yggdrasil.data.growth = 5; // vieille sauvegarde hypothétique : ignorée
  const graines = s.currencies.seeds;
  assert.throws(() => applyIdleNguAction(s, { action: "collect", system: "yggdrasil" }, ctx, 1), /ACTION_NON_DISPONIBLE/);
  assert.equal(s.currencies.seeds, graines, "aucune graine créée");
}

/*
 * Brown Heart (set) et Pink Heart (set) de bout en bout : le cœur fusionné au
 * niveau 100 via le moteur Aventure complète le set, et l'effet est lu sur
 * completedSets (Poop gratuite / slot de souhait).
 */
{
  const ajouter = (defId, level) => {
    const s = normalizeIdleNguState({}, ctx, 0);
    return applyIdleNguAction(s, { action: "adventure", adventure: { action: "addItem", definitionId: defId, level } }, ctx, 1).state;
  };
  assert.equal(idleNguSnapshot(ajouter("heartBrown", 99), ctx, 2).yggExtra.brownHeart, false);
  const brun = idleNguSnapshot(ajouter("heartBrown", 100), ctx, 2).yggExtra;
  assert.equal(brun.brownHeart, true, "My Brown Heart niveau 100 : set complété");
  assert.equal(brun.nextFreePoopIn, 10, "la 10e Poop sera gratuite");
}

console.log("idle-yggdrasil-collect-dead-code: OK");
