import assert from "node:assert/strict";
import test from "node:test";
import {readFile} from "node:fs/promises";

const source=await readFile(
  new URL("../src/idle-sqlite-runtime.js",import.meta.url),
  "utf8"
);

const fnStart=source.indexOf("function appliquerProgressionEnergieSorealIdle_(");
assert.ok(fnStart>=0,"appliquerProgressionEnergieSorealIdle_ introuvable.");
const fnEnd=source.indexOf("\nfunction ",fnStart+10);
const fnBody=source.slice(fnStart,fnEnd);

test("Fight Boss has no KO countdown or KO deadline",()=>{
  assert.doesNotMatch(fnBody,/DUREE_KO_SECONDES/);
  assert.doesNotMatch(fnBody,/let koJusqua/);
  assert.doesNotMatch(fnBody,/koJusqua > tempsSimulation/);
});

test("player defeat stops combat at exactly zero HP",()=>{
  assert.match(
    fnBody,
    /const joueurBattu =\s*\n?\s*pvJoueur===0;/
  );
  assert.match(
    fnBody,
    /if \(joueurBattu\) \{[\s\S]{0,700}pvJoueur=0;[\s\S]{0,250}statsCombat\.combatBossActif=false;[\s\S]{0,120}combatBossActif=false;/
  );
});

test("defeat never restores boss HP instantly",()=>{
  const start=fnBody.indexOf("if (joueurBattu) {");
  assert.ok(start>=0,"branche défaite introuvable");
  const branch=fnBody.slice(start,start+900);
  assert.doesNotMatch(branch,/bossPv\s*=\s*bossPvMax/);
});

test("out of combat recovery is progressive for player and boss",()=>{
  assert.match(
    fnBody,
    /if \(!combatBossActif\) \{[\s\S]{0,300}regenPvSecJoueur[\s\S]{0,180}pvJoueur[\s\S]{0,650}regenBossSecondeSorealIdle_/
  );
});

console.log("idle-boss-defeat-gradual-regen: OK");
