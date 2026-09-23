import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * 2026-09-23 : la régénération d'aventure paraissait instantanée (entre deux
 * combats et en Safe Zone) : adventureRestPv vivait dans idleEtat, remplacé à
 * chaque synchro serveur, et un « null » remettait les PV au maximum.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const debut = ui.indexOf("let idleAdventureRestPvMemoV1=null;");
assert.ok(debut > 0);
const source = ui.slice(debut, ui.indexOf("function resetHorlogesFightAdventureIdleV2_", debut));
const api = new globalThis.Function("idleNombre_", source + "\nreturn {restPvInitialIdleV1_,memoriserRestPvIdleV1_};")((v) => Number(v) || 0);

assert.equal(api.restPvInitialIdleV1_(500), 500, "sans mémoire : PV pleins (début de partie)");
api.memoriserRestPvIdleV1_(120);
assert.equal(api.restPvInitialIdleV1_(500), 120, "après une synchro qui efface idleEtat, les PV de repos sont retrouvés");
assert.equal(api.restPvInitialIdleV1_(80), 80, "jamais au-dessus des PV max");
api.memoriserRestPvIdleV1_(0);
assert.equal(api.restPvInitialIdleV1_(500), 0, "un KO (0 PV) n'est pas transformé en PV pleins");

assert.equal((ui.match(/restPvInitialIdleV1_\(pvMaxRepos\)/g) || []).length, 3, "les 3 sites d'initialisation utilisent la mémoire");
assert.ok(!/adventureRestPv=pvMaxRepos;/.test(ui), "plus aucun reset direct aux PV max");
console.log("idle-adventure-rest-hp-survives-sync: OK");
