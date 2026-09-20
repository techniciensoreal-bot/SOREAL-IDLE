import assert from "node:assert/strict";
import test from "node:test";
import {readFile} from "node:fs/promises";

const source=await readFile(
  new URL("../src/idle-sqlite-runtime.js",import.meta.url),
  "utf8"
);

test("Fight Boss stop uses defeat reason without KO state",()=>{
  assert.match(
    source,
    /function definirCombatBossSorealIdle\([\s\S]{0,120}sessionToken,[\s\S]{0,80}actif,[\s\S]{0,80}raison/
  );
  assert.match(
    source,
    /const arretApresDefaite=[\s\S]{0,160}!Boolean\(actif\)[\s\S]{0,80}raisonArret==='defaite'/
  );
  assert.doesNotMatch(source,/arretApresKo/);
  assert.doesNotMatch(source,/code:'JOUEUR_KO'/);
});

test("defeat persists zero HP but no KO deadline",()=>{
  const apiStart=source.indexOf("function definirCombatBossSorealIdle(");
  const defeatStart=source.indexOf("if(arretApresDefaite){",apiStart);
  assert.ok(defeatStart>=0,"branche défaite API introuvable");
  const branch=source.slice(defeatStart,defeatStart+1100);
  assert.match(branch,/c\.PV_JOUEUR[\s\S]{0,100}\.setValue\(0\)/);
  assert.match(branch,/c\.KO_JUSQUA[\s\S]{0,100}\.clearContent\(\)/);
  assert.doesNotMatch(branch,/DUREE_KO_SECONDES/);
});

test("stopping never resets boss HP to max",()=>{
  const apiStart=source.indexOf("function definirCombatBossSorealIdle(");
  const apiEnd=source.indexOf("\nfunction nukerBossSorealIdle",apiStart);
  const api=source.slice(apiStart,apiEnd);
  assert.doesNotMatch(api,/c\.BOSS_PV[\s\S]{0,160}\.setValue\(\s*boss\.pv\s*\)/);
});

test("legacy KO column remains schema-compatible but inert",()=>{
  assert.match(source,/ko:\s*\n?\s*koSecondesRestantes > 0/);
  assert.match(source,/const koSecondesRestantes=0;/);
  assert.match(source,/dureeKoSecondes:\s*0/);
});

console.log("idle-boss-defeat-no-ko-v172: OK");
