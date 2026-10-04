import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-04) : la Machine à remonter le temps cassée a sa propre identité (laiton et or) et rappelle qu'on gagne de l'Or.
 */
const mod = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-themes.css", "utf8");
assert.ok(mod.includes("soreal-idle-tm-hero-v1") && mod.includes("Ta machine fabrique de l’Or"), "bandeau Or");
assert.ok(mod.includes('data-tm-hero="netGps"'), "Or par seconde en grand, mis à jour à la synchro");
assert.ok(css.includes("TIME MACHINE : la machine d'Or"), "thème or");
assert.ok(!css.includes("retour à l'aspect du jeu d'origine"), "ancien aspect retiré");
let d = 0; for (const c of css) { if (c === "{") d++; if (c === "}") d--; }
assert.equal(d, 0, "accolades CSS équilibrées");
console.log("idle-time-machine-identite-or-v1: OK");
