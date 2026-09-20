import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const ui=readFileSync(
  new URL("../public/soreal-idle-ui.js",import.meta.url),
  "utf8"
);

const start=ui.indexOf("V175 — récupération après DÉFAITE");
assert.ok(start>=0,"V175 post-defeat guard missing");

const end=ui.indexOf("V174 — récupération Fight Boss hors combat",start+20);
assert.ok(end>start,"V175 guard end missing");

const guard=ui.slice(start,end);

assert.match(
  guard,
  /!idleEtat\.combatBossActif[\s\S]{0,120}idleCombatEnPauseApresDefaiteV1/
);

assert.match(
  guard,
  /pvJoueur:[\s\S]{0,220}localAvantRecupV175\.pvJoueur/
);

assert.match(
  guard,
  /bossPv:[\s\S]{0,220}localAvantRecupV175\.bossPv/
);

assert.match(
  guard,
  /bossSelection:[\s\S]{0,180}localAvantRecupV175\.bossSelection/
);

assert.match(
  guard,
  /combatBossActif:false/
);

assert.doesNotMatch(
  guard,
  /memeBossServeurV167/,
  "Post-defeat recovery must not depend on server boss selection matching."
);

/*
 * Behavioral mirror of the V175 merge:
 * server can say FULL HP and even carry another boss selection,
 * but the recovery frame keeps the live local bars.
 */
function mergePostDefeat(local,server){
  return Object.assign({},server,{
    combatBossActif:false,
    pvJoueur:Math.max(0,Number(local.pvJoueur)||0),
    pvJoueurMax:Math.max(1,Number(local.pvJoueurMax)||0,Number(server.pvJoueurMax)||0),
    bossPv:Math.max(0,Number(local.bossPv)||0),
    bossPvMax:Math.max(1,Number(local.bossPvMax)||0),
    bossSelection:Number(local.bossSelection)||0
  });
}

const local={
  combatBossActif:false,
  pvJoueur:1.60e9,
  pvJoueurMax:3.18e9,
  bossPv:4.10e12,
  bossPvMax:4.61e12,
  bossSelection:42
};

const staleServer={
  combatBossActif:false,
  pvJoueur:3.18e9,
  pvJoueurMax:3.18e9,
  bossPv:4.61e12,
  bossPvMax:4.61e12,
  bossSelection:43
};

const merged=mergePostDefeat(local,staleServer);

assert.equal(merged.pvJoueur,1.60e9);
assert.equal(merged.pvJoueurMax,3.18e9);
assert.equal(merged.bossPv,4.10e12);
assert.equal(merged.bossSelection,42);
assert.equal(merged.combatBossActif,false);

console.log("Fight Boss post-defeat authoritative recovery V175: OK");
