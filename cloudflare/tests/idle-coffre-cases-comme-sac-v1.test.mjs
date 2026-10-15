import assert from "node:assert/strict";
import fs from "node:fs";
const lire = (p) => fs.readFileSync(new URL("../public/" + p, import.meta.url), "utf8");
const ui = lire("soreal-idle-ui.css"), it = lire("soreal-idle-itopod.css");
/* Norman (2026-10-15) : les cases du coffre (sets en mannequin compris) ont la taille des cases du sac */
assert.ok(ui.includes("--case-coffre:calc((100vw - 106px)/5)"), "téléphone : cinq colonnes comme le sac");
assert.ok(ui.includes("repeat(2,var(--case-coffre,56px))") && ui.includes("grid-auto-rows:var(--case-coffre,56px)"), "mannequin = taille du sac");
assert.ok(/min-width:var\(--case-coffre,56px\);max-width:var\(--case-coffre,56px\);box-sizing:border-box/.test(ui), "case du coffre : bordure comprise, comme le sac");
assert.ok(it.includes("--case-coffre:72px") && it.includes("repeat(2,72px);grid-auto-rows:72px"), "PC : 72 px comme le sac");
assert.ok(!/repeat\(auto-fill,88px\)|repeat\(2,88px\)/.test(it), "plus de cases de 88 px");
console.log("idle-coffre-cases-comme-sac-v1: OK");
