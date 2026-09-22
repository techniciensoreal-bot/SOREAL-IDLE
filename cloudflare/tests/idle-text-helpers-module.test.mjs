import assert from "node:assert/strict"; import {readFileSync} from "node:fs"; import vm from "node:vm";
const window={}; vm.runInNewContext(readFileSync("cloudflare/public/modules/text-helpers-v1.js","utf8"),{window});
const a=window.__SOREAL_IDLE_TEXT_HELPERS_V1__;
assert.equal(a.normaliserEffet("Électricité"),"paralysie"); assert.equal(a.normaliserEffet("freeze"),"gel"); assert.equal(a.normaliserEffet("Brûlure"),"feu"); assert.equal(a.normaliserEffet("shield"),"bouclier");
assert.equal(a.motDegat(1),"dégât"); assert.equal(a.motDegat(2),"dégâts");
assert.equal(a.nomDepuisCleR2("foo/Adv_12_safe_Monster_Box_boss.webp","safe"),"Monster Box");
assert.equal(a.nomDepuisCleR2(""),"Créature");
assert.equal(a.libelleRessource("energy"),"⚡ Énergie"); assert.equal(a.libelleRessource("r3"),"🧪 R3"); assert.equal(a.libelleRessource("x"),"x");
console.log("idle text helpers module: OK");
