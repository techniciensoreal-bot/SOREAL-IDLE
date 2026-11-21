import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fluxMuetV1, fluxMuetActifV1 } from "../src/idle-flux-muet-v1.js";
import { fluxBoostV1, fluxTitanV1 } from "../src/idle-adventure-combat.js";
import { instantaneJoueurV1 } from "../src/idle-flux-v1.js";

/*
 * Norman (2026-11-21) : « quand une chose se fait automatiquement, un nuke automatique ou un sort de Blood Magic qui se lance tout seul, ça ne doit pas apparaître dans En direct : uniquement les choses que le joueur a faites manuellement ».
 */
const src = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8").replace(/\r\n/g, "\n");

/* 1. Le silence : tout ce qui agit dans fluxMuetV1 ne bouge aucun compteur ; le reste, si. */
{
  const s = {};
  assert.equal(fluxMuetActifV1(), false);
  fluxMuetV1(() => { assert.equal(fluxMuetActifV1(), true); fluxBoostV1(s, "cube", ""); fluxBoostV1(s, "piece", "x"); fluxTitanV1(s, "starts", "t1"); });
  assert.equal(fluxMuetActifV1(), false, "le silence se termine");
  assert.ok(!s.boostFlux && !s.titanFlux, "aucun compteur n'a bougé pendant l'automatique");
  fluxBoostV1(s, "cube", "");
  assert.equal(s.boostFlux.cube, 1, "un boost manuel compte");
  assert.throws(() => fluxMuetV1(() => { throw new Error("x"); }), /x/);
  assert.equal(fluxMuetActifV1(), false, "le silence se termine même sur une erreur");
}

/* 2. Titans : les tués par Auto-Kill ne comptent pas. */
{
  const stats = { metaNgu: { adventure: { titans: { t1: { kills: 5, autoKills: 5 }, t2: { kills: 3, autoKills: 1 }, t3: { kills: 2 } } } } };
  const inst = instantaneJoueurV1({ bossVaincus: 10, stats });
  assert.equal(inst.titans.t1, undefined, "tous tués en Auto-Kill : rien");
  assert.equal(inst.titans.t2, 2, "3 tués dont 1 en Auto-Kill : 2 annoncés");
  assert.equal(inst.titans.t3, 2, "sans Auto-Kill : tel quel");
}

/* 3. Les automatiques sont branchés : Auto Boost / Auto Merge, Auto-Kill des Titans, Auto Nuker. */
{
  const inv = src("src/idle-inventory-auto-v1.js");
  assert.ok(/fluxMuetV1\(\(\) => \{[^}]*idleInventoryRunAutoMergeV1[^}]*idleInventoryRunAutoBoostV1/s.test(inv), "Auto Merge et Auto Boost s'exécutent en silence");
  const adv = src("src/idle-adventure-combat.js");
  assert.equal((adv.match(/st\.autoKills=I\(st\.autoKills,0\)\+/g) || []).length, 2, "l'Auto-Kill des Titans compte ses tués à part (en lot et un par un)");
  const comb = src("src/idle-runtime-combat.js");
  assert.ok(/nukerBossSorealIdle\(\n  sessionToken,\n  automatique\n\)/.test(comb) && /defeated\.length > 0 && automatique !== true/.test(comb), "un Nuke automatique n'est pas annoncé");
  const amorcage = src("public/modules/ui-amorcage-v1.js");
  assert.ok(/nukerBossIdleV1_\(true\);/.test(amorcage), "l'Auto Nuker de la page demande un Nuke automatique");
  const ui = src("public/modules/ui-combat-2-v1.js");
  assert.ok(/function nukerBossIdleV1_\(automatique\)/.test(ui) && /nukerBossSorealIdle\(\n\s*SOREAL_SESSION,\n\s*automatique===true\n/.test(ui), "la page transmet le drapeau au moteur ; un clic normal n'en envoie pas");
  /* Blood Magic : les sorts automatiques (avancerSortsAutoV1) passent par le lancer partiel, qui ne compte jamais */
  const sys = src("src/idle-ngu-systemes.js");
  const partiel = sys.slice(sys.indexOf("export function castBloodSpellPartielV1"), sys.indexOf("function appliquerSortCumulV1"));
  assert.ok(!/bloodSpellsCast/.test(partiel), "les sorts automatiques de Blood Magic ne comptent pas dans « En direct »");
}
console.log("idle-flux-sans-automatique-v1: OK");
