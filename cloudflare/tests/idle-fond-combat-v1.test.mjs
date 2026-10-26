import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const lire = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8");
const m = lire("public/modules/fond-combat-v1.js");
assert.ok(m.includes("FondFightBoss.webp") && m.includes('[data-menu="combat"]') && m.includes("min-width:1100px") && m.includes("center/cover no-repeat"), "fond de la page Fight Boss, PC seulement, en couverture centrée");
assert.ok(lire("public/index.html").includes("/modules/fond-combat-v1.js?v="), "module chargé par la page");
console.log("idle-fond-combat-v1: OK");
