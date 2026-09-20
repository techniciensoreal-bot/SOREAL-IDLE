import assert from "node:assert/strict";
import test from "node:test";
import {readFile} from "node:fs/promises";

const ui=await readFile(
  new URL("../public/soreal-idle-ui.js",import.meta.url),
  "utf8"
);

test("Fight Boss frontend has no KO countdown",()=>{
  assert.doesNotMatch(ui,/let koRestant=/);
  assert.doesNotMatch(ui,/sorealIdleKoV15/);
  assert.doesNotMatch(ui,/raison:'ko'/);
  assert.match(ui,/raison:'defaite'/);
});

test("player and boss recover outside combat from their own regen",()=>{
  assert.match(
    ui,
    /if\(!idleEtat\.combatBossActif\)\{[\s\S]{0,420}regenPvFightBossNguParSecondeV164_\([\s\S]{0,100}idleEtat\.defense/
  );
  assert.match(
    ui,
    /regenBossParSecV172[\s\S]{0,160}idleEtat\.regenBoss/
  );
  assert.doesNotMatch(
    ui,
    /regenBossParSecV1[\s\S]{0,180}defenseBoss/
  );
});

test("defeat stops at zero without resetting boss",()=>{
  const start=ui.indexOf("idleEtat.pvJoueur<=0");
  const end=ui.indexOf("}else if(",start);
  assert.ok(start>=0&&end>start,"client defeat branch missing");
  const branch=ui.slice(start,end);
  assert.match(branch,/idleEtat\.pvJoueur=0;/);
  assert.match(branch,/idleEtat\.combatBossActif=false;/);
  assert.doesNotMatch(branch,/idleEtat\.bossPv\s*=\s*idleEtat\.bossPvMax/);
});

test("Fight button remains visually stable while disabled",()=>{
  assert.match(
    ui,
    /\.soreal-idle-boss-control-v39\.start,[\s\S]{0,120}\.soreal-idle-boss-control-v39\.start:disabled\{[\s\S]{0,360}opacity:1 !important;[\s\S]{0,160}background:#47d77d !important;[\s\S]{0,120}color:#163f25 !important;[\s\S]{0,160}transition:none !important;/
  );
});

console.log("idle-boss-recovery-no-ko-v172: OK");
