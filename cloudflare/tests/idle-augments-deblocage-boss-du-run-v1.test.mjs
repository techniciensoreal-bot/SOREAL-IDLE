import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { applyIdleNguAction, normalizeIdleNguState, IDLE_NGU_AUGMENTATIONS } from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-10-04) : « toute l'énergie que je place m'est rendue ». Essai en direct sur son compte : « Ciseaux dangereux » (Upgrade des Ciseaux de sécurité, boss 37) était proposé alors que son run n'avait battu que
 * 32 boss (meilleur boss de tous les temps : 61) ; le serveur refusait l'allocation en bloc (AUGMENT_VERROUILLE) et l'énergie revenait. La page doit lire le même boss que le serveur : celui du run en cours.
 */
const scissors = IDLE_NGU_AUGMENTATIONS.find((d) => d.id === "scissors");
assert.equal(scissors.unlockBoss, 17);
assert.equal(scissors.upgrade.unlockBoss, 37);

// 1. Serveur : le seuil se compare au boss du run (context.bosses), jamais au record permanent.
const s = normalizeIdleNguState({}, { bosses: 32 }, 1_000_000);
s.systems.augmentations.unlocked = true;
s.resources.energy.cap = 1e6; s.resources.energy.current = 200000;
s.records.highestBoss = 61;
assert.throws(() => applyIdleNguAction(s, { action: "allocateAugment", pair: "scissors", upgrade: true, value: 100000 }, { bosses: 32 }, 1_000_000), /AUGMENT_VERROUILLE/, "Upgrade (37) refusée avec 32 boss dans le run, même avec un record de 61");
const ok = applyIdleNguAction(s, { action: "allocateAugment", pair: "scissors", upgrade: false, value: 100000 }, { bosses: 32 }, 1_000_000);
assert.equal(ok.state.systems.augmentations.data.pairs.scissors.energy, 100000, "l'Augment (17) accepte l'énergie");
const ok2 = applyIdleNguAction(s, { action: "allocateAugment", pair: "scissors", upgrade: true, value: 100000 }, { bosses: 37 }, 1_000_000);
assert.equal(ok2.state.systems.augmentations.data.pairs.scissors.upgradeEnergy, 100000, "avec 37 boss dans le run, l'Upgrade accepte l'énergie");

// 2. Page : le déblocage lit le boss du run (bossVaincus), pas le record ; « Boss max » reste affiché pour information.
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
assert.ok(meta.includes("boss=Math.max(0,window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(j&&j.bossVaincus))"), "boss du run pour débloquer");
assert.ok(meta.includes("const bossMax=window.__SOREAL_IDLE_META_HOST_V130__.idleEntier_(snap.records&&snap.records.highestBoss||0)") && meta.includes("👹 Boss max<b>'+bossMax+'</b>"), "record seulement affiché");
console.log("idle-augments-deblocage-boss-du-run-v1: OK");
