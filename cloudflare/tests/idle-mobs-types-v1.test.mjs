import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Types d'ennemis de l'Aventure : cycles LUS DANS LE JEU (NGU Idle build 1260, 2026-11-15) et recoupés par des combats réels (poison : 3 ticks de ~20 % de la Puissance, cycle de 7 coups).
 * Chaque type a un compteur qui avance à chaque attaque de l'ennemi et fait un cycle fixe, sans hasard.
 */
const src = readFileSync(new URL("../public/modules/mobs-types-v1.js", import.meta.url), "utf8");
const window = {};
vm.runInNewContext(src, { window });
const M = window.SorealMobTypesV1;
assert.ok(M && typeof M.tourEnnemi === "function", "module chargé");
const T = (f) => JSON.parse(JSON.stringify(M.types(f)));
const mob = (type, extra) => Object.assign({ active: true, mobType: type }, extra || {});
const tours = (type, n, extra, hasard = 0.5, t0 = 0) => { M.reinit(); return Array.from({ length: n }, (_, i) => JSON.parse(JSON.stringify(M.tourEnnemi(mob(type, extra), hasard, t0 + i * 1000)))); };

// Types reconnus ; jamais pour un titan ni hors combat.
assert.deepEqual(T(mob("poison")), { poison: true, paralyze: false, exploder: false, rapid: false, charger: false, grower: false });
assert.deepEqual(T(mob("poison/paralyze")), { poison: true, paralyze: false, exploder: false, rapid: false, charger: false, grower: false }, "poison/paralyze suit le poison");
assert.equal(M.types(mob("exploder")).exploder, true);
for (const t of ["normal", ""]) assert.deepEqual(T(mob(t)), { poison: false, paralyze: false, exploder: false, rapid: false, charger: false, grower: false }, t);
assert.equal(M.types(mob("poison", { titanId: "t1" })).poison, false, "pas pour un titan");
assert.equal(M.types({ active: false, mobType: "poison" }).poison, false, "pas hors combat");

// Poison : cycle de 7 tours (1 empoisonnement, 3 ticks de floor(20 % de la Puissance x aléa), 1 dissipation, 2 coups ordinaires). Mesuré en combat réel : 75,8 de moyenne pour 73 (Puissance 365), 3 ticks par poison.
let t = tours("poison", 14, { mobPower: 365 }, 0.5);
assert.deepEqual(t.map((x) => x.poison), [true, false, false, false, false, false, false, true, false, false, false, false, false, false], "un empoisonnement tous les 7 tours");
assert.deepEqual(t.map((x) => x.poisonDegats > 0), [false, true, true, true, false, false, false, false, true, true, true, false, false, false], "3 ticks après l'empoisonnement");
assert.deepEqual(t.map((x) => x.poisonFin), [false, false, false, false, true, false, false, false, false, false, false, true, false, false], "dissipation au 5e tour");
assert.equal(t[1].poisonDegats, 73, "tick = floor(365 x 0,2 x 1,0) avec un aléa de 0,5");
assert.equal(tours("poison", 2, { mobPower: 365 }, 0)[1].poisonDegats, 58, "aléa minimal 0,8 : floor(365 x 0,2 x 0,8)");
assert.equal(tours("poison", 2, { mobPower: 365 }, 0.9999)[1].poisonDegats, 87, "aléa maximal 1,2 : floor(365 x 0,2 x 1,2)");
assert.equal(tours("poison", 2, { mobPower: 13 }, 0.5)[1].poisonDegats, 2, "Brown Slime (Puissance 13) : tick de 2 (mesuré dans le vrai jeu)");
M.reinit(); M.tourEnnemi(mob("poison", { mobPower: 100 }), 0.5, 0); assert.ok(M.poisonActif(0), "poison actif pendant la phase de ticks");

// Chargeur : cycle de 5 tours : 2 coups, annonce sans coup, tour sans coup, coup massif x4.
t = tours("charger", 10);
assert.deepEqual(t.map((x) => x.saute), [false, false, true, true, false, false, false, true, true, false], "2 coups, 2 tours sans coup, 1 coup massif");
assert.deepEqual(t.map((x) => x.mult), [1, 1, 1, 1, 4, 1, 1, 1, 1, 4], "coup massif x4 au 5e tour");
assert.deepEqual(t.map((x) => x.prepare), [false, false, true, false, false, false, false, true, false, false], "annonce au 3e tour");
assert.deepEqual(t.map((x) => x.charge), [false, false, false, false, true, false, false, false, false, true]);

// Paralysie : cycle de 12 tours : 1 tour sans coup, 1 coup d'avertissement, 1 coup paralysant (2 s), 9 coups ordinaires.
t = tours("paralyze", 14);
assert.deepEqual(t.map((x) => x.saute), [true, false, false, false, false, false, false, false, false, false, false, false, true, false], "un tour sans coup par cycle");
assert.deepEqual(t.map((x) => x.avertit), [false, true, false, false, false, false, false, false, false, false, false, false, false, true], "avertissement au 2e tour");
assert.deepEqual(t.map((x) => x.paralyse), [false, false, true, false, false, false, false, false, false, false, false, false, false, false], "paralysie au 3e tour, puis 12 tours plus tard");
M.reinit(); M.tourEnnemi(mob("paralyze"), 0.5, 0); M.tourEnnemi(mob("paralyze"), 0.5, 1000); M.tourEnnemi(mob("paralyze"), 0.5, 2000);
assert.ok(M.paralyse(3999) && !M.paralyse(4000), "paralysie de 2 s");

// Rapide : cycle de 14 tours : 4 coups, annonce, 2 tours sans coup, fureur (coup + intervalle à 30 %) pendant 6 coups.
t = tours("rapid", 15);
assert.deepEqual(t.map((x) => x.saute), [false, false, false, false, true, true, true, false, false, false, false, false, false, false, false], "tours 5, 6 et 7 sans coup");
assert.deepEqual(t.map((x) => x.rapideDebut), [false, false, false, false, false, false, false, true, false, false, false, false, false, false, false], "fureur au 8e tour");
assert.deepEqual(t.map((x) => x.rapideFin), [false, false, false, false, false, false, false, false, false, false, false, false, false, true, false], "fin au 14e tour");
M.reinit(); for (let i = 0; i < 7; i++) M.tourEnnemi(mob("rapid"), 0.5, 0);
assert.equal(M.intervalleEnnemiMs(mob("rapid"), 1000, 0), 1000, "avant la fureur : intervalle normal");
M.tourEnnemi(mob("rapid"), 0.5, 0);
assert.equal(M.intervalleEnnemiMs(mob("rapid"), 1000, 0), 300, "en fureur : 30 % de l'intervalle");
assert.equal(M.intervalleEnnemiMs(mob("rapid"), 200, 0), 100, "jamais sous 100 ms");
assert.equal(M.intervalleEnnemiMs(mob("normal"), 1000, 0), 1000, "un autre type n'accélère jamais");
assert.equal(M.intervalleEnnemiMs(mob("rapid", { titanId: "t1" }), 1000, 0), 1000, "pas pour un titan");

// Grandisseur : coup x (1 + floor(n / 2) / 5) : +20 % tous les 2 coups, annoncé tous les 2 coups.
t = tours("grower", 8);
const proche = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, a + " !== " + b);
[1, 1.2, 1.2, 1.4, 1.4, 1.6, 1.6, 1.8].forEach((m, i) => proche(t[i].mult, m));
assert.deepEqual(t.map((x) => x.croit), [false, true, false, true, false, true, false, true], "annonce tous les 2 coups");
M.reinit(); assert.equal(M.tourEnnemi(mob("grower"), 0.5, 0).mult, 1, "compteur remis à zéro par reinit");
M.reinit(); const rien = M.tourEnnemi(mob("normal"), 0.5, 0); assert.ok(rien.mult === 1 && !rien.saute && !rien.poison);
M.reinit(); assert.equal(M.tourEnnemi(mob("grower", { titanId: "t1" }), 0.5, 0).mult, 1, "pas pour un titan");

// Explosion : le coup ordinaire x1000 (lu dans le jeu) ; seulement pour un explosif.
assert.equal(M.explosion(mob("exploder", { mobPower: 33 }), 3.3), 3300, "Fairy : coup de 3,3 (10 % de 33) x 1000 = 3 300 (le wiki dit « around 2500 » avec une Robustesse)");
assert.equal(M.explosion(mob("exploder", { mobPower: 33 }), 2.5), 2500, "2 500 pour un coup de 2,5");
assert.equal(M.explosion(mob("exploder", { mobPower: 33 }), 0), 1, "au moins 1 dégât");
assert.equal(M.explosion(mob("poison", { mobPower: 33 }), 3.3), 0);
assert.equal(M.explosion(mob("exploder", { titanId: "t1", mobPower: 33 }), 3.3), 0);

// Branchement dans le combat (sources).
const combat = readFileSync(new URL("../public/modules/ui-combat-2-v1.js", import.meta.url), "utf8");
const aventure = readFileSync(new URL("../public/modules/ui-aventure-1-v1.js", import.meta.url), "utf8");
assert.ok(combat.includes("window.SorealMobTypesV1.reinit(maintenantTick)") && combat.includes("window.SorealMobTypesV1.tourEnnemi(fight,Math.random(),momentEvenement)") && combat.includes("if(tourMob.saute){modifie=true;evenements+=1;continue;}") && !combat.includes("tickPoison") && !combat.includes("apresCoupEnnemi"), "combat branché sur les cycles lus dans le jeu");
assert.ok(combat.includes("mt.explosion(fight,degatsCoup);") && combat.includes("function explosionEnnemiAdventureIdleV1_(fight,degatsCoup)") && combat.includes("facteurAleaDegats,multiplicateurToughnessManuelAdventureIdleV3_(momentEvenement)));") && !aventure.includes("const explosion=explosionEnnemiAdventureIdleV1_(fight);"), "explosion au compte à rebours : coup ordinaire x1000");
assert.ok(aventure.includes("intervalleEnnemiMs(fight,base,Date.now())") && combat.includes("window.SorealMobTypesV1.types(fight).exploder") && combat.includes("issueExplosion==='mort'"), "intervalle du rapide et mort explosive");
assert.ok(aventure.includes("window.SorealMobTypesV1.paralyse(maintenant))return true;"), "la paralysie d'un ennemi coupe compétences et Idle comme celle d'un titan");
const fx = readFileSync(new URL("../public/modules/combat-effets-v1.js", import.meta.url), "utf8");
assert.ok(fx.includes("cfx-explosion") && fx.includes("cfx-poison") && fx.includes("cfx-empoisonne") && fx.includes("courant.poison"), "effets visuels : explosion, crâne de poison, barre empoisonnée");
const son = readFileSync(new URL("../public/modules/audio-effects-v199.js", import.meta.url), "utf8");
assert.ok(son.includes('id:"mobPoison"') && son.includes('id:"mobExplosion"'), "sons du poison et de l'explosion");
const index = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
assert.ok(index.includes("/modules/mobs-types-v1.js"), "module chargé par la page");
// Donnée du wiki : tous les explosifs ont un « Attack Rate » de 5 à 14 s (leur compte à rebours), tous les autres types 0,8 à 1,5 s.
import { IDLE_ADVENTURE_MOB_BESTIARY_V1 } from "../src/idle-adventure-zones.js";
{
  const parType = {};
  for (const zone of Object.values(IDLE_ADVENTURE_MOB_BESTIARY_V1)) for (const groupe of Object.values(zone)) for (const m of groupe || []) (parType[m.type || "normal"] = parType[m.type || "normal"] || []).push(Number(m.attackRate));
  assert.ok(parType.exploder.length >= 10 && parType.exploder.every((v) => v >= 5 && v <= 14), "explosifs : Attack Rate de 5 à 14 s (compte à rebours)");
  for (const [type, taux] of Object.entries(parType)) if (type !== "exploder") assert.ok(taux.every((v) => v >= 0.8 && v <= 1.5), type + " : Attack Rate ordinaire (0,8 à 1,5 s)");
}
console.log("idle-mobs-types-v1 : OK");
