import assert from "node:assert/strict";
import test from "node:test";
import {readFile} from "node:fs/promises";

const source=await readFile(
  new URL("../src/idle-sqlite-runtime.js",import.meta.url),
  "utf8"
);

test("Fight Boss KO stop is distinct from flee",()=>{
  assert.match(
    source,
    /function definirCombatBossSorealIdle\([\s\S]{0,100}sessionToken,[\s\S]{0,80}actif,[\s\S]{0,80}raison/
  );
  assert.match(
    source,
    /const arretApresKo =[\s\S]{0,160}!Boolean\(actif\)[\s\S]{0,80}raisonArret==='ko'/
  );
});

test("KO persists zero HP and a KO deadline instead of clearing recovery",()=>{
  const start=source.indexOf("if(arretApresKo){");
  const end=source.indexOf("}else{",start);
  assert.ok(start>=0&&end>start,"KO branch must exist");
  const branch=source.slice(start,end);
  assert.match(branch,/c\.PV_JOUEUR[\s\S]{0,100}\.setValue\(0\)/);
  assert.match(branch,/c\.KO_JUSQUA[\s\S]{0,220}DUREE_KO_SECONDES\*1000/);
  assert.match(branch,/c\.DERNIERE_SYNCHRO/);
  assert.doesNotMatch(branch,/clearContent\(\)/);
});

test("progression no longer heals zero HP to max before KO processing",()=>{
  assert.doesNotMatch(
    source,
    /if \(pvJoueur <= 0\) \{\s*pvJoueur = pvJoueurMax;\s*\}[\s\S]{0,3500}const koBrut/
  );
  assert.match(
    source,
    /const regenPvSecJoueur =[\s\S]{0,120}defense \/ 20/
  );
  assert.match(
    source,
    /if \(!combatBossActif\) \{[\s\S]{0,220}regenPvSecJoueur \*[\s\S]{0,80}ecoulePrisEnCompte/
  );
});
