import assert from "node:assert/strict";
import test from "node:test";
import {readFile} from "node:fs/promises";

const ui=await readFile(
  new URL("../public/soreal-idle-ui.js",import.meta.url),
  "utf8"
);

test("Fight Boss recovery uses one client regen path only",()=>{
  assert.match(
    ui,
    /if\(!idleEtat\.combatBossActif\)\{[\s\S]{0,420}regenPvFightBossNguParSecondeV164_\([\s\S]{0,100}idleEtat\.defense/
  );
  assert.doesNotMatch(
    ui,
    /const regenPvKoV164=/
  );
  assert.match(
    ui,
    /V171[\s\S]{0,260}unique écrivain[\s\S]{0,180}Defense \/ 20 PV\/s/
  );
});

test("Fight button remains visually stable while disabled",()=>{
  assert.match(
    ui,
    /\.soreal-idle-boss-control-v39\.start,[\s\S]{0,120}\.soreal-idle-boss-control-v39\.start:disabled\{[\s\S]{0,360}opacity:1 !important;[\s\S]{0,160}background:#47d77d !important;[\s\S]{0,120}color:#163f25 !important;[\s\S]{0,160}transition:none !important;/
  );
});

test("standalone frontend records the final APP snapshot sync",()=>{
  assert.match(ui,/Post-snapshot APP fixes synchronized:/);
  assert.match(ui,/1c43812/);
  assert.match(ui,/9d71863/);
});
