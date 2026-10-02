import assert from "node:assert/strict";
import { normalizeIdleAdventureStateV47, applyIdleAdventureActionV47, idleAdventureSnapshotV47 } from "../src/idle-adventure-v47.js";
import { IDLE_TITAN_COMBAT_V1, idleTitanCombatV1 } from "../src/idle-titans-combat-v1.js";

/*
 * Combat de titan dans la scène d'Aventure (Norman, 2026-10-02) : le titan apparaît avec ses stats du wiki (encadré « Infobox Titan »), se combat
 * comme un ennemi de zone, puis la victoire (resolveZoneFight) donne les récompenses du titan et relance son délai ; la défaite renvoie en Safe Zone
 * sans toucher au délai.
 */
const ctx = { bosses: 100, stats: { power: 10, toughness: 10, hp: 500 } };
const agir = (s, p, t = 10_000, c = ctx) => applyIdleAdventureActionV47(s, p, c, t);

// 1. Données : les 14 titans, valeurs de l'encadré wiki.
assert.equal(Object.keys(IDLE_TITAN_COMBAT_V1).length, 14);
assert.deepEqual(idleTitanCombatV1("t1"), { hp: 300000, power: 666, toughness: 666, regen: 66, attackRate: 2 });
assert.equal(idleTitanCombatV1("t6", "brutal").hp, 5e13);
assert.equal(idleTitanCombatV1("t5", "", 4).hp, 1e9);
assert.equal(idleTitanCombatV1("nerd", "hard").attackRate, 1.9);

// 2. Départ du combat : le titan est l'ennemi, en Safe Zone, sans seuil de puissance (on peut perdre).
let r = agir(normalizeIdleAdventureStateV47({}), { action: "startTitanFight", titan: "t1", restHp: 120 });
let s = r.state;
assert.equal(r.result.titanStarted, "t1");
assert.ok(s.fight.active && s.fight.titanId === "t1" && s.fight.boss === true && s.fight.mobType === "titan");
assert.equal(s.fight.monsterHpMax, 300000);
assert.equal(s.fight.mobPower, 666);
assert.equal(s.fight.mobToughness, 666);
assert.equal(s.fight.mobHpRegen, 66);
assert.equal(s.fight.mobAttackRate, 2);
assert.equal(s.fight.playerHp, 120, "PV de repos repris");
assert.equal(s.fight.zone, s.selectedZone, "zone cohérente avec resolveZoneFight");
assert.equal(s.fight.mobName, "Gordon Ramsay Bolton");

// 3. Verrous inchangés : titan non débloqué, difficulté absente.
assert.throws(() => agir(normalizeIdleAdventureStateV47({}), { action: "startTitanFight", titan: "t1" }, 10_000, { bosses: 10, stats: ctx.stats }), /TITAN_VERROUILLE/);
assert.throws(() => agir(normalizeIdleAdventureStateV47({}), { action: "startTitanFight", titan: "t7" }, 10_000, { bosses: 300, difficulty: "normal", stats: ctx.stats }), /DIFFICULTE_EVIL_REQUISE/);

// 4. Défaite : Safe Zone, délai intact, combat terminé.
const avantKills = s.titans.t1 ? s.titans.t1.kills || 0 : 0;
let perdu = agir(s, { action: "loseZoneFight" }, 11_000);
assert.equal(perdu.state.fight.active, false);
assert.equal(perdu.state.selectedZone, "safe");
assert.equal((perdu.state.titans.t1 || { kills: 0 }).kills || 0, avantKills, "pas de victoire comptée");
assert.ok(!perdu.state.titans.t1 || !perdu.state.titans.t1.nextAt, "pas de délai relancé");

// 5. Victoire : trop court = refusé (anti-triche minimale), puis récompenses et délai.
assert.throws(() => agir(s, { action: "resolveZoneFight" }, 10_500), /COMBAT_TITAN_TROP_COURT/);
let gagne = agir(s, { action: "resolveZoneFight" }, 40_000);
assert.equal(gagne.result.id, "t1");
assert.equal(gagne.result.kills, 1);
assert.equal(gagne.state.fight.active, false);
assert.equal(gagne.state.titans.t1.kills, 1);
assert.ok(gagne.state.titans.t1.nextAt >= 40_000 + 60 * 60 * 1000, "délai de 60 minutes relancé");
assert.ok(gagne.result.experience > 0 || gagne.result.drops.length > 0, "récompenses du titan");

// 6. Pendant le délai de réapparition : refus.
assert.throws(() => agir(gagne.state, { action: "startTitanFight", titan: "t1" }, 41_000), /TITAN_EN_REAPPARITION/);

// 7. Titan à difficultés : stats du palier choisi.
let b = agir(normalizeIdleAdventureStateV47({}), { action: "startTitanFight", titan: "t6", difficulty: "hard" }, 10_000, { bosses: 200, stats: ctx.stats });
assert.equal(b.state.fight.monsterHpMax, 5e12);
assert.equal(b.state.fight.mobAttackRate, 1.9);
assert.equal(b.state.fight.titanTier, "hard");

// 8. Snapshot : stats et capacités seulement pour les titans débloqués (anti-spoil).
const vue = idleAdventureSnapshotV47(normalizeIdleAdventureStateV47({}), 70);
const t1 = vue.titans.find((t) => t.id === "t1");
const t2 = vue.titans.find((t) => t.id === "t2");
assert.ok(t1.combat && t1.combat[""].hp === 300000 && t1.capacites.length >= 3 && t1.nomComplet === "Gordon Ramsay Bolton", "titan débloqué : stats + capacités");
assert.ok(t2.combat === undefined && t2.capacites === undefined && t2.nomComplet === undefined, "titan encore verrouillé : rien de plus que l'existant");
console.log("idle-titan-combat-fight-v1: OK");
