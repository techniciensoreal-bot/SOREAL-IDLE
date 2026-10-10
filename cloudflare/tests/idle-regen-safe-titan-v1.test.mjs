import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
/* Norman (2026-10-10) : un combat de Titan se livre dans la Safe Zone, mais le x5 de régénération est celui du repos : il ne doit pas s'afficher (ni s'appliquer) pendant un combat. */
const debut = ui.indexOf("function regenReposAdventureIdleV3_(a,zoneCourante){");
const corps = ui.slice(debut, ui.indexOf("function facteurAleatoireDegatsAdventureIdleV2_", debut));
assert.ok(corps.includes("zoneCourante==='safe'&&!(a&&a.fight&&a.fight.active)"), "x5 réservé au repos");
const fn = new Function("idleNombre_", corps.replace(/^[\s\S]*?function regenReposAdventureIdleV3_/, "function regenReposAdventureIdleV3_") + "\nreturn regenReposAdventureIdleV3_;")((v) => Number(v) || 0);
const base = { stats: { regen: 10, regenBase: 1 }, setRewards: {} };
assert.equal(fn({ ...base }, "safe"), 50, "repos en Safe Zone : x5");
assert.equal(fn({ ...base, fight: { active: false } }, "safe"), 50);
assert.equal(fn({ ...base, fight: { active: true } }, "safe"), 10, "combat de Titan (Safe Zone) : régénération normale");
assert.equal(fn({ ...base, setRewards: { safeZoneRegen10x: true } }, "safe"), 100, "set GRB au repos : x10");
assert.equal(fn({ ...base, setRewards: { safeZoneRegen10x: true }, fight: { active: true } }, "safe"), 10);
console.log("idle-regen-safe-titan-v1: OK");
