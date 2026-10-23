import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeIdleNguState, applyIdleNguAction, advanceIdleNguState } from "../src/idle-ngu-progression.js";

/* Norman (2026-10-23) : « juste en plaçant de la magie dans les rituels, il valide le rituel ». Faute d'Or, la progression s'empilait sans limite (25 rituels d'arriéré) et tout était validé d'un coup. */
const ctx = { bosses: 140 };
let s = normalizeIdleNguState({}, ctx, 1000);
s.systems.bloodMagic.unlocked = true; s.resources.magic.cap = 100000; s.resources.magic.current = 50000; s.currencies.gold = 0;
const agir = (a, t) => { s = applyIdleNguAction(s, a, ctx, t).state; };
const r = () => s.systems.bloodMagic.data.rituals.tack;
agir({ action: "allocateRitual", ritual: "tack", value: 1000 }, 2000);
s = advanceIdleNguState(s, 50000, ctx, 52000);
assert.equal(r().completions, 0, "sans Or, aucun rituel");
assert.ok(r().progress <= r().progressRef + 1e-6, "la barre attend pleine : une seule complétion en réserve, pas 25");
s.currencies.gold = 1e18;
agir({ action: "allocateRitual", ritual: "tack", value: 20000 }, 52500);
assert.ok(r().completions <= 1, "placer de la Magie ne valide jamais plusieurs rituels d'arriéré : " + r().completions);

/* client : faute d'Or, le repère de la barre est remis à maintenant (pas d'arriéré rejoué d'un coup) */
const ui = readFileSync("cloudflare/public/modules/ui-boucle-v1.js", "utf8");
assert.ok(ui.includes("if(faits<=0){bloodVisual.at=maintB;bloodVisual.etaSeconds=0;}"));
console.log("idle-blood-arriere-or-v1 OK");
