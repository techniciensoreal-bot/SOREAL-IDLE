import assert from "node:assert/strict";
import test from "node:test";
import {readFile} from "node:fs/promises";
import {nguBossStatsV1} from "../src/idle-ngu-boss-reference-v1.js";

test("Fight Boss exposes the sourced NGU HP Regen curve",()=>{
  assert.equal(nguBossStatsV1(0).regen,40);
  assert.equal(nguBossStatsV1(1).regen,90);
  assert.equal(nguBossStatsV1(2).regen,350);
  assert.equal(nguBossStatsV1(3).regen,170);
  assert.equal(nguBossStatsV1(4).regen,1000);
  assert.equal(nguBossStatsV1(5).regen,5000);
  assert.equal(nguBossStatsV1(19).regen,30517578125000);
  assert.equal(nguBossStatsV1(20).regen,305175781250000);
});

test("Evil/Sadistic scale boss HP Regen with Fight Boss stats",()=>{
  const normal=nguBossStatsV1(4,"normal");
  const evil=nguBossStatsV1(4,"difficile");
  const sadistic=nguBossStatsV1(4,"extreme");
  assert.equal(evil.regen,normal.regen/1e30);
  assert.equal(sadistic.regen,normal.regen/1e30);
});

test("runtime uses the reference regen rather than Defense/20 for bosses",async()=>{
  const source=await readFile(
    new URL("../src/idle-sqlite-runtime.js",import.meta.url),
    "utf8"
  );
  const start=source.indexOf("function regenBossSecondeSorealIdle_(");
  const end=source.indexOf("\nfunction multiplicateurAttaqueBossSorealIdle_",start);
  assert.ok(start>=0&&end>start,"regenBossSecondeSorealIdle_ missing");
  const body=source.slice(start,end);
  assert.match(body,/nguBossStatsV1/);
  assert.match(body,/reference&&reference\.regen/);
  assert.doesNotMatch(body,/defense\s*\/\s*20/);
  assert.doesNotMatch(body,/capaciteBossSorealIdle_/);
});

console.log("idle-boss-hp-regen-reference-v172: OK");
