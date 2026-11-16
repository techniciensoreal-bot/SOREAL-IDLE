/* Audit du code du jeu (2026-11-16, design/audit-code-jeu/souhaits.md n°1, 2, 3) : puissance, cap et barres des 3 ressources et stats d'Aventure sont un
   PRODUIT de facteurs (1 + niveau x effet) par souhait (WishesController::total...Bonus) ; souhait 192 : diviseur 6e25 ; QP des titans :
   (long)((long)(base x questRewardFactor) x higherVFactor). */
import assert from "node:assert/strict";
import fs from "node:fs";
import { IDLE_WISHES_CATALOG_V1, wishBonusesV1 } from "../src/idle-wishes-v1.js";

const niv = (ids) => Object.fromEntries(ids.map((id) => [id, { level: IDLE_WISHES_CATALOG_V1.find((w) => w.id === id).levels }]));
const proche = (a, b, m) => assert.ok(Math.abs(a - b) < 1e-9 * Math.max(1, b), `${m} : ${a} au lieu de ${b}`);

/* Mesure du rapport : Énergie puissance, souhaits 0, 9, 31, 48, 64, 82, 91, 193 au maximum = 1,05 x 1,5^4 x 1,2^3 = 9,185. */
proche(wishBonusesV1(niv([0, 9, 31, 48, 64, 82, 91, 193])).energyPowerMultiplier, 1.05 * 1.5 ** 4 * 1.2 ** 3, "Énergie puissance");
/* Aventure : 0, 6, 29 au maximum = 1,2 x 1,3 x 1,2 = 1,872. */
proche(wishBonusesV1(niv([0, 6, 29])).adventureStatsMultiplier, 1.2 * 1.3 * 1.2, "Aventure");
/* Les 9 familles : le souhait 0 seul donne la constante 1,05, deux souhaits d'une même famille se multiplient. */
const un = wishBonusesV1(niv([0]));
for (const k of ["energyPower", "energyCap", "energyBars", "magicPower", "magicCap", "magicBars", "r3Power", "r3Cap", "r3Bars"]) proche(un[k + "Multiplier"], 1.05, k);
proche(un.adventureStatsMultiplier, 1.2, "souhait 0 : aventure");
proche(wishBonusesV1({ 10: { level: 10 }, 32: { level: 10 } }).energyCapMultiplier, 1.3 * 1.3, "Cap : produit");
proche(wishBonusesV1({}).magicBarsMultiplier, 1, "sans souhait");

assert.equal(IDLE_WISHES_CATALOG_V1.find((w) => w.id === 192).speedDivider, 6.00e25, "souhait 192 : diviseur du jeu");

const combat = fs.readFileSync(new URL("../src/idle-adventure-combat.js", import.meta.url), "utf8");
assert.ok(/Math\.floor\(Math\.floor\(qpDef\.qp\*facteurQp/.test(combat), "QP des titans tronqué deux fois comme le jeu");
const snap = fs.readFileSync(new URL("../src/idle-ngu-snapshot.js", import.meta.url), "utf8");
assert.ok(/state\.currencies\.qp \+= gain\("qp"\);/.test(snap), "le facteur de QP n'est pas repassé à la création des récompenses");

console.log("idle-souhaits-produit-par-souhait-v1 ok");
