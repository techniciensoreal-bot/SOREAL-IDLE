import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
/* Norman (2026-11-12) : tué avec Fight en un coup (pas de début de combat) : la perruque du 106 se joue quand même. */
const s = readFileSync(new URL("../public/modules/ui-combat-1-v1.js", import.meta.url), "utf8");
assert.ok(s.includes("const speciale=Boolean(nouvelle&&nouvelle.speciales&&image&&nouvelle.speciales.some(function(x){return x.boss===idMortV1;}));"), "spéciale détectée sans combat");
assert.ok(s.includes("!REG.idleNukeEnCoursV1&&((memeBoss&&debutCombatV1)||speciale))"), "jouée sans début de combat, jamais pendant un NUKE");
console.log("idle-mort-boss-106-one-shot-v1 : OK");
