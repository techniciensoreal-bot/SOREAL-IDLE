import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-21) : pendant le défi No Rebirth, le bouton RENAISSANCE est grisé (le moteur refuse déjà : REBIRTH_INTERDITE_DEFI). */
const page = readFileSync(new URL("../public/modules/ui-renaissance-v1.js", import.meta.url), "utf8");
assert.ok(page.includes("REG.idleEtat.systemes.challenge.active==='noRebirth'))?'disabled':''"), "bouton grisé pendant No Rebirth");
const moteur = readFileSync(new URL("../src/idle-ngu-actions.js", import.meta.url), "utf8");
assert.ok(moteur.includes('state.challenge?.active==="noRebirth")throw new Error("REBIRTH_INTERDITE_DEFI")'), "le moteur refuse toujours la Renaissance");
console.log("idle-renaissance-bouton-defi-norebirth-v1: OK");
