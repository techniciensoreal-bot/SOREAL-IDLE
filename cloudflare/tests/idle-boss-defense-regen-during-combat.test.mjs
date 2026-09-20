import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const source=readFileSync(
  new URL("../src/idle-sqlite-runtime.js",import.meta.url),
  "utf8"
);

const fnStart=source.indexOf("function appliquerProgressionEnergieSorealIdle_(");
assert.ok(fnStart>=0,"appliquerProgressionEnergieSorealIdle_ introuvable.");
const fnEnd=source.indexOf("\nfunction ",fnStart+10);
const fnBody=source.slice(fnStart,fnEnd);

const regenDeclarations=(fnBody.match(/const regenPvSecJoueur\s*=/g)||[]).length;
assert.equal(
  regenDeclarations,
  1,
  "regenPvSecJoueur must be resolved once and reused."
);

const degatsRecusSecStart=fnBody.indexOf("let degatsRecusSec =");
assert.ok(degatsRecusSecStart>=0,"degatsRecusSec missing.");

const tempsPourDefaiteStart=fnBody.indexOf("const tempsPourDefaite",degatsRecusSecStart);
assert.ok(
  tempsPourDefaiteStart>degatsRecusSecStart,
  "tempsPourDefaite must be calculated after incoming damage."
);

const combatLoopSegment=fnBody.slice(degatsRecusSecStart,tempsPourDefaiteStart);

assert.ok(
  /degatsRecusSec\s*=\s*\n?\s*Math\.max\(\s*\n?\s*0,\s*\n?\s*degatsRecusSec\s*-\s*\n?\s*regenPvSecJoueur\s*\n?\s*\)\s*;/.test(combatLoopSegment),
  "Player Defense/20 regen must apply during active Fight Boss combat."
);

function degatsNetsPendantCombat(degatsBrutsParSeconde,defense){
  const regenPvSecJoueur=Math.max(0,defense/20);
  return Math.max(0,degatsBrutsParSeconde-regenPvSecJoueur);
}

assert.equal(degatsNetsPendantCombat(10,100),5);
assert.equal(degatsNetsPendantCombat(10,400),0);

console.log("idle-boss-defense-regen-during-combat: OK");
