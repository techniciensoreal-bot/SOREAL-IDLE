import assert from "node:assert/strict";
import fs from "node:fs";
import { normalizeIdleNguState, applyIdleNguAction, advanceIdleNguState } from "../src/idle-ngu-progression.js";

/* Norman (2026-11-03) : « dans Augmentations j'ai mis cible 50 pour Ciseaux de sécurité, j'ai mis mon énergie et ça a cap ; je suis arrivé niveau 98 avant que mon énergie soit retirée. Une cible doit absolument être respectée. »
 * Le moteur achetait tous les niveaux que le temps et l'Or permettaient, et n'appliquait la cible qu'ensuite (retrait de l'énergie). Aucun achat ne doit plus dépasser la cible. */
const lire = (f) => fs.readFileSync("cloudflare/src/" + f, "utf8").replace(/\r\n/g, "\n");
const aug = lire("idle-ngu-ressources.js"), ngu = lire("idle-ngu-bonus.js"), pistes = lire("idle-ngu-pistes.js");
assert.ok(aug.includes("const cibleN=Math.max(0,int(upgrade?pair.upgradeTarget:pair.target,0));") && aug.includes("if(cibleN>0&&int(upgrade?pair.upgradeLevel:pair.level,0)>=cibleN)return;"), "Augmentations : une piste déjà à sa cible n'achète plus rien");
assert.ok(aug.includes("cibleN>0?Math.max(0,cibleN-l0):Infinity") , "Augmentations : la formule fermée (grosses vitesses) s'arrête à la cible");
assert.ok(aug.includes("if(cibleN>0&&int(level,0)>=cibleN)break;"), "Augmentations : la boucle s'arrête à la cible");
assert.ok(ngu.includes("if (gained > reste) { gained = reste; rest = 0; }"), "NGU : jamais au-delà de la cible, même à 50 niveaux par seconde");
assert.ok(pistes.includes("t.progress = gain;") && pistes.includes("cibleAt - courant"), "Entraînement avancé : jamais au-delà de la cible");
assert.ok(pistes.includes("!tmTargetReached(d.speedTarget, d.speedLevel)") && pistes.includes("!tmTargetReached(d.goldTarget, d.goldLevel)"), "Machine temporelle : la boucle s'arrête déjà à la cible");
/* le vrai moteur : énergie énorme (CAP), cible 50, un pas de temps de 1 s puis de 10 minutes : le niveau s'arrête à 50 pile, l'énergie est rendue */
{
  const ctx = { bosses: 120, bestGold: 1e12, adventurePower: 1e9 }, T = 1_000_000;
  for (const [secondes, etiquette] of [[1, "1 s"], [600, "10 min"], [86400, "1 jour hors ligne"]]) {
    let st = normalizeIdleNguState({}, ctx, T);
    st.adventure.unlockItems.aNumber = true; st.systems.augmentations.unlocked = true;
    st.resources.energy.cap = 1e15; st.resources.energy.current = 1e15; st.resources.energy.power = 1e15;
    st.currencies.gold = 1e60;
    st = applyIdleNguAction(st, { action: "allocateAugment", pair: "scissors", upgrade: false, value: 1e14 }, ctx, T).state;
    st = applyIdleNguAction(st, { action: "setAugmentTarget", pair: "scissors", upgrade: false, value: 50 }, ctx, T).state;
    st = advanceIdleNguState(st, secondes, ctx, T + secondes * 1000);
    const p = st.systems.augmentations.data.pairs.scissors;
    assert.equal(p.level, 50, "cible 50 au CAP (" + etiquette + ") : niveau exactement 50 (obtenu " + p.level + ")");
    assert.equal(p.energy, 0, "énergie rendue (" + etiquette + ")");
  }
}
console.log("idle-cible-absolue-v1: OK");
