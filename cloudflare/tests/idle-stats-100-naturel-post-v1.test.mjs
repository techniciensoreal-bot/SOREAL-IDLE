import assert from "node:assert/strict";
import { multiplicateursCombatSorealIdle_ } from "../src/idle-runtime-boss.js";

/* Character::totalAttack (code du jeu, build 1260) : le « 100 » naturel reçoit tous les bonus APRÈS la division de difficulté, mais ni le NUMBER, ni ITOPOD, ni l'équipement, ni Rich Jerks. */
const r = multiplicateursCombatSorealIdle_({ attackMultiplier: 1200, attackPreMultiplier: 10, defenseMultiplier: 600, defensePreMultiplier: 3, equipmentAttackMultiplier: 1, equipmentDefenseMultiplier: 1 }, 100);
assert.equal(r.attaquePost, 120, "attaque : total 1200 / pré-division 10");
assert.equal(r.defensePost, 200, "défense : total 600 / pré-division 3");
assert.equal(r.attaque, 1200);
console.log("idle-stats-100-naturel-post-v1: OK");
