import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-11-14) : « en Aventure, il y a des mobs exploder, d'autres poison, d'autres paralyze. Mais je ne vois jamais qu'ils explosent, qu'ils m'empoisonnent ou autres choses ». Le moteur retenait fight.mobType sans en tirer aucun effet.
 * Constantes SOREAL (non publiées par le wiki, exception du 2026-10-04) : voir mobs-types-v1.js et le registre des constantes.
 */
const src = readFileSync(new URL("../public/modules/mobs-types-v1.js", import.meta.url), "utf8");
const window = {};
vm.runInNewContext(src, { window });
const M = window.SorealMobTypesV1;
assert.ok(M && typeof M.apresCoupEnnemi === "function", "module chargé");
const T = (f) => JSON.parse(JSON.stringify(M.types(f)));
const mob = (type, extra) => Object.assign({ active: true, mobType: type }, extra || {});

// Types reconnus ; jamais pour un titan ni pour un ennemi normal / rapide / chargeur / grandisseur.
assert.deepEqual(T(mob("poison")), { poison: true, paralyze: false, exploder: false });
assert.deepEqual(T(mob("poison/paralyze")), { poison: true, paralyze: true, exploder: false });
assert.equal(M.types(mob("exploder")).exploder, true);
for (const t of ["normal", "rapid", "charger", "grower", ""]) assert.deepEqual(T(mob(t)), { poison: false, paralyze: false, exploder: false }, t);
assert.equal(M.types(mob("poison", { titanId: "t1" })).poison, false, "pas pour un titan");
assert.equal(M.types({ active: false, mobType: "poison" }).poison, false, "pas hors combat");

// Poison : un coup qui blesse empoisonne ; 1 tick par seconde pleine = 20 % du coup (au moins 1), 5 s, sans cumul ; un coup à 0 dégât n'empoisonne pas.
M.reinit();
let r = M.apresCoupEnnemi(mob("poison"), 0, 1000, 0.99);
assert.equal(r.poison, false, "coup sans dégât : pas de poison");
r = M.apresCoupEnnemi(mob("poison"), 100, 1000, 0.99);
assert.equal(r.poison, true); assert.ok(M.poisonActif(1001));
assert.equal(M.tickPoison(1500), 0, "pas encore une seconde pleine");
assert.equal(M.tickPoison(2000), 20, "premier tick : 20 % de 100");
assert.equal(M.tickPoison(4500), 40, "deux ticks de plus (3 s et 4 s)");
assert.equal(M.tickPoison(7000), 40, "derniers ticks à 5 s et 6 s : 5 ticks en tout pour 5 s de poison, puis il s'arrête");
assert.equal(M.poisonActif(7001), false, "poison fini après 5 s");
assert.equal(M.tickPoison(9000), 0, "plus rien après la fin");
M.apresCoupEnnemi(mob("poison"), 3, 10000, 0.99);
assert.equal(M.tickPoison(11000), 1, "tick minimal de 1 dégât");
M.reinit();
M.apresCoupEnnemi(mob("poison"), 100, 1000, 0.99);
M.apresCoupEnnemi(mob("poison"), 100, 2500, 0.99);   // un second coup relance la durée sans cumuler
assert.equal(M.tickPoison(3500), 40, "pas de cumul : un seul poison à la fois (ticks à 2 s et 3 s)");

// Paralysie : un coup sur 4 (hasard < 0,25), 2 s, puis 4 s d'immunité ; jamais pendant la paralysie.
M.reinit();
r = M.apresCoupEnnemi(mob("paralyze"), 50, 1000, 0.5);
assert.equal(r.paralyse, false, "hasard 0,5 : pas de paralysie");
r = M.apresCoupEnnemi(mob("paralyze"), 50, 2000, 0.1);
assert.equal(r.paralyse, true); assert.ok(M.paralyse(2500) && M.paralyse(3999) && !M.paralyse(4000), "2 s");
r = M.apresCoupEnnemi(mob("paralyze"), 50, 3000, 0.0);
assert.equal(r.paralyse, false, "pas de nouvelle paralysie pendant la première");
r = M.apresCoupEnnemi(mob("paralyze"), 50, 6000, 0.0);
assert.equal(r.paralyse, false, "immunité de 4 s après la fin");
r = M.apresCoupEnnemi(mob("paralyze"), 50, 8100, 0.0);
assert.equal(r.paralyse, true, "puis de nouveau possible");
// Un ennemi qui n'est pas paralysant ne paralyse jamais, un normal n'empoisonne jamais.
M.reinit();
assert.equal(M.apresCoupEnnemi(mob("normal"), 50, 1000, 0.0).paralyse, false);
assert.equal(M.apresCoupEnnemi(mob("exploder"), 50, 1000, 0.0).poison, false);
// Double type : les deux.
r = M.apresCoupEnnemi(mob("poison/paralyze"), 50, 1000, 0.0);
assert.ok(r.poison && r.paralyse, "poison/paralyze cumule les deux");

// Explosion : le double d'un coup ordinaire, seulement pour un explosif.
assert.equal(M.explosion(mob("exploder"), 100), 200);
assert.equal(M.explosion(mob("exploder"), 0), 1, "au moins 1 dégât");
assert.equal(M.explosion(mob("poison"), 100), 0);
assert.equal(M.explosion(mob("exploder", { titanId: "t1" }), 100), 0);

// Branchement dans le combat (sources) : coup de l'ennemi, tick du poison, mort explosive, paralysie centrale, remise à zéro, effets et sons.
const combat = readFileSync(new URL("../public/modules/ui-combat-2-v1.js", import.meta.url), "utf8");
assert.ok(combat.includes("window.SorealMobTypesV1.reinit()") && combat.includes("mobTypes.apresCoupEnnemi(fight,degats,momentEvenement,Math.random())") && combat.includes("window.SorealMobTypesV1.tickPoison(maintenantTick)"), "combat branché");
const aventure = readFileSync(new URL("../public/modules/ui-aventure-1-v1.js", import.meta.url), "utf8");
assert.ok(combat.includes("mt.explosion(fight,") && combat.includes("function explosionEnnemiAdventureIdleV1_(fight,degatsCoup)") && !aventure.includes("const explosion=explosionEnnemiAdventureIdleV1_(fight);"), "explosion au compte à rebours (jamais à la mort : tuer l'explosif avant ne déclenche rien)");
assert.ok(combat.includes("window.SorealMobTypesV1.types(fight).exploder") && combat.includes("issueExplosion==='survie'){REG.idleExploderSurvivedV1=true;"), "au moment de son attaque l'explosif explose, puis disparaît (survie notée pour le succès)");
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
