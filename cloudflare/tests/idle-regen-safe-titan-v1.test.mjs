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

// Combat de titan et choix de zone (Norman, 2026-10-12) : le combat se livre en Zone sûre, la zone affichée suit tout de suite, et choisir une zone (Zone sûre comprise) l'arrête, côté client comme côté serveur.
{
  const { readFileSync: lire } = await import("node:fs");
  const ui = lire("cloudflare/public/soreal-idle-ui.js", "utf8");
  const ttn = lire("cloudflare/public/modules/titans-v1.js", "utf8");
  const srv = lire("cloudflare/src/idle-adventure-v47.js", "utf8");
  assert.ok(ui.includes("(String(a.fight.zone||'')!==cible||a.fight.titanId)"), "client : une zone choisie arrête le combat du titan, même la Zone sûre");
  assert.ok(srv.includes("if(s.fight.active&&(s.fight.zone!==z.id||s.fight.titanId)){")&&srv.includes("s.fight=X(base().fight)}s.selectedZone=z.id"), "serveur : idem");
  assert.ok(ttn.includes("av.selectedZone='safe';"), "la zone affichée passe en Zone sûre dès le lancement du combat de titan");
}
console.log("idle-regen-safe-titan-v1: choix de zone OK");
