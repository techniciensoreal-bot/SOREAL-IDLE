import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Audit combat Aventure vs wiki NGU (miroir local, 2026-09-23).
 * Chaque assertion cite la page wiki qui fixe la valeur vérifiée.
 */
const ui = readFileSync(
  new URL("../public/soreal-idle-ui.js", import.meta.url),
  "utf8"
).replace(/\r\n/g, "\n");

function block(source, start, end) {
  const a = source.indexOf(start);
  const b = source.indexOf(end, a + start.length);
  assert.ok(a >= 0 && b > a, "Bloc introuvable: " + start);
  return source.slice(a, b);
}

/* Extraction d'une fonction pure du monolithe, évaluée hors navigateur. */
function fonction(nom, deps = {}) {
  const src = block(ui, "function " + nom + "(", "\n      }\n") + "\n      }";
  const noms = Object.keys(deps);
  return new Function(...noms, src + "\nreturn " + nom + ";")(...noms.map((k) => deps[k]));
}
const idleNombre_ = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

/* --- Tables de moves : page « Skills » --- */
const attaques = block(ui, "const IDLE_ADVENTURE_MANUAL_ATTACKS_V3=", "]);");
for (const ligne of [
  "{id:'regular',label:'Attaque',icon:'⚔️',btIndex:1,cooldown:1000,multiplier:1.5}",
  "{id:'strong',label:'Forte',icon:'💥',btIndex:2,cooldown:4000,multiplier:2}",
  "{id:'parry',label:'Parade',icon:'🛡️',btIndex:3,cooldown:15000,multiplier:1}",
  "{id:'ultimate',label:'Ultime',icon:'☄️',btIndex:5,cooldown:15000,multiplier:2}"
]) assert.ok(attaques.includes(ligne), "Skills : " + ligne);
assert.ok(attaques.includes("id:'piercing'") && attaques.includes("cooldown:8000,multiplier:2"), "Skills : Piercing 8 s x2");

const defense = block(ui, "const IDLE_ADVENTURE_MANUAL_DEFENSE_V3=", "]);");
for (const [id, cd] of [["block", 10000], ["defensiveBuff", 45000], ["heal", 15000], ["offensiveBuff", 45000], ["charge", 30000], ["ultimateBuff", 45000]]) {
  assert.ok(new RegExp("id:'" + id + "'[^}]*cooldown:" + cd + "}").test(defense), "Skills : cooldown " + id + " = " + cd);
}
const avances = block(ui, "const IDLE_ADVENTURE_ADVANCED_SKILLS_V4=", "]);");
for (const [id, cd] of [["paralyze", 15000], ["hyperRegen", 35000], ["beastMode", 15000], ["megaBuff", 50000], ["ohShit", 35000], ["move69", 3600000]]) {
  assert.ok(new RegExp("id:'" + id + "'[^}]*cooldown:" + cd + "}").test(avances), "Skills : cooldown " + id + " = " + cd);
}

/* --- Cooldowns : Build Move Cooldowns oui, Red Liquid NON (global cooldown uniquement) --- */
const cooldownDuree = fonction("cooldownDureeAdventureIdleV4_", { idleNombre_ });
const ring = { cooldown: 15000, id: "heal" };
assert.equal(cooldownDuree(ring, { stats: { specials: { moveCooldownPct: 20 } } }), 12000, "Move Cooldowns équipement : -20 %");
assert.equal(
  cooldownDuree(ring, { unlockFlags: { redLiquidMaxed: true }, stats: { specials: {} } }),
  15000,
  "Red Liquid (set) : -20 % sur le global cooldown et l'Idle Attack, jamais sur le cooldown propre d'un move"
);
assert.equal(
  cooldownDuree({ id: "move69", cooldown: 3600000 }, { stats: { specials: { moveCooldownPct: 50 } } }),
  3600000,
  "Move 69 : non affecté par les Move Cooldowns"
);
const intervalleIdle = fonction("intervalleIdleAttackAdventureIdleV4_");
assert.equal(intervalleIdle({}), 1000, "Idle Mode : une attaque par seconde");
assert.equal(intervalleIdle({ unlockFlags: { redLiquidMaxed: true } }), 800, "Idle Mode : 0,8 s avec Red Liquid");

/* --- Dégâts du joueur : ITOPOD « One hit power required » --- */
const degatsJoueur = fonction("degatsJoueurAdventureIdleV2_", { idleNombre_ });
assert.equal(degatsJoueur(100, 40, 1.2, 1), 96, "(power - defense/2) x idle bonus");
assert.equal(degatsJoueur(100, 40, 1.2, 0.8), Math.round(80 * 1.2 * 0.8), "facteur aléatoire bas 0,8");
assert.equal(degatsJoueur(100, 40, 1.2, 1.2), Math.round(80 * 1.2 * 1.2), "facteur aléatoire haut 1,2");
assert.equal(degatsJoueur(10, 400, 1.2, 1), 0, "jamais de dégâts négatifs");
const facteur = block(ui, "function facteurAleatoireDegatsAdventureIdleV2_(", "}");
assert.ok(facteur.includes(".8+Math.random()*.4"), "facteur aléatoire uniforme 0,8-1,2");

/* --- Intervalle ennemi : attack_rate en secondes (Walderp : 3 s x 6 attaques = 18 s) --- */
const intervalleEnnemi = fonction("intervalleAttaqueEnnemiAdventureIdleV2_", { idleNombre_ });
assert.equal(intervalleEnnemi({ mobAttackRate: 3 }), 3000);
assert.equal(intervalleEnnemi({ mobAttackRate: 1.1 }), 1100);

/* --- Regen de repos : Safe Zone x5, x10 avec le set GRB --- */
const regenRepos = fonction("regenReposAdventureIdleV3_", { idleNombre_ });
assert.equal(regenRepos({ stats: { regen: 2 } }, "safe"), 10);
assert.equal(regenRepos({ stats: { regen: 2 }, setRewards: { safeZoneRegen10x: true } }, "safe"), 20);
assert.equal(regenRepos({ stats: { regen: 2 } }, "forest"), 2);

/* --- Respawn : 4 s de base, plancher 0,34 s (page Respawn) --- */
assert.ok(ui.includes("const IDLE_ADVENTURE_RESPAWN_MS_V1=4000;"), "Respawn : 4 s de base");
const reduction = fonction("respawnReductionAdventureIdleV1_", { idleNombre_ });
assert.ok(Math.abs(4000 * (1 - reduction({ systemes: { bonuses: { respawnReduction: 0.99 } } })) - 340) < 1e-6, "Respawn : minimum effectif 0,34 s");

/* --- Buffs / skills avancés : page « Skills » --- */
const puissance = block(ui, "function multiplicateurPowerManuelAdventureIdleV3_(", "function multiplicateurChargeAdventureIdleV3_(");
assert.ok(puissance.includes("offensiveBuffUntil>maintenant)mult*=1.2"), "Offensive Buff +20 %");
assert.ok(puissance.includes("ultimateBuffUntil>maintenant)mult*=1.3"), "Ultimate Buff +30 %");
assert.ok(puissance.includes("defensiveBuffUntil>maintenant)mult*=1.2"), "Defensive Buff +20 %");
assert.ok(ui.includes("purpleLiquidMaxed?1.5:1.4"), "Beast Mode +40 % (+50 % Purple Liquid)");
const usage = block(ui, "function utiliserCompetenceAdventureIdleV3_(", "window.__utiliserCompetenceAdventureIdleV3__");
assert.ok(usage.includes("blockUntil=maintenant+3000"), "Block : 3 s");
assert.ok(usage.includes("defensiveBuffUntil=maintenant+15000") && usage.includes("offensiveBuffUntil=maintenant+15000") && usage.includes("ultimateBuffUntil=maintenant+15000"), "Buffs : 15 s");
assert.ok(ui.includes("idleNombre_(fight.playerHp)+max*.15"), "Heal : 15 % des PV max");
assert.ok(ui.includes("enemyParalyzedUntil,maintenant+3000"), "Paralyze : 3 s");
assert.ok(ui.includes("hyperRegenUntil,maintenant+5000") && ui.includes("secondes+hyperSecondes*4"), "Hyper Regen : regen x5 (500 %) pendant 5 s");
assert.ok(ui.includes("(idleAdventureIdleModeV3?1.2:1)"), "Idle Mode : HP regen +20 %");

/*
 * --- Parry : « Blocks 50% of incoming damage and automatically attacks »
 * (Skills), « Parry's reflected attack » (Slimy set). La riposte part sur
 * l'attaque ennemie parée, pas au lancement ; la Charge est mémorisée.
 */
const lancementParry = block(usage, "if(def.id==='parry'){", "}else{");
assert.ok(!lancementParry.includes("attaqueManuelleAdventureIdleV3_("), "Parry : aucune attaque au lancement");
assert.ok(lancementParry.includes("parryArmed=true"), "Parry : parade armée (pré-lançable)");
assert.ok(lancementParry.includes("parryChargeMult=multiplicateurChargeAdventureIdleV3_(a)") && lancementParry.includes("charge=false"), "Parry : Charge consommée au lancement");
const tick = block(ui, "function progresserZoneFightLocalIdleV1_(", "function impactMonstreAdventureIdleV1_(");
const coupEnnemi = tick.slice(tick.indexOf("idleAdventureFightNextEnemyHitV2+="));
assert.ok(coupEnnemi.includes("degats=Math.max(0,Math.round(degats*.5));"), "Parry : 50 % du coup paré");
const iRiposte = coupEnnemi.indexOf("definitionCompetenceAdventureIdleV3_('parry')");
assert.ok(iRiposte > coupEnnemi.indexOf("terminerCombatAdventureLocalV2_(fight,false)"), "Parry : riposte après le coup paré, si le joueur survit");
assert.ok(coupEnnemi.slice(iRiposte, iRiposte + 200).includes("riposteParryMult"), "Parry : riposte avec la Charge mémorisée");
const attaque = block(ui, "function attaqueManuelleAdventureIdleV3_(", "function utiliserCompetenceAdventureIdleV3_(");
assert.ok(attaque.includes("if(chargeMemorisee>0){") && attaque.includes("}else if(idleAdventureManualStateV3.charge){"), "Riposte : ne consomme pas la Charge courante");

console.log("idle-adventure-combat-wiki-parity ok");
