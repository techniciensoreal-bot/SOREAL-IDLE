import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-05) : « j'ai tué un boss et le suivant n'apparaît pas » : l'écran restait sur « boss 52 vaincu » alors que l'état était au boss 53. Le redessin après une synchro dépend de
 * l'empreinte structurelle de l'état ; elle doit changer quand le boss SÉLECTIONNÉ change, même si le nombre de boss vaincus est déjà le bon (victoire comptée en local).
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const debut = ui.indexOf("function empreinteStructurelleIdleV1_(j){");
assert.ok(debut > 0);
const corps = ui.slice(debut, ui.indexOf("/* Historique V8: docs/UI-MONOLITH-HISTORY.md#bloc-157 */", debut));
const idleEntier_ = (v) => Math.floor(Number(v) || 0);
const empreinte = new Function("idleEntier_", corps + "; return empreinteStructurelleIdleV1_;")(idleEntier_);

const local = { bossVaincus: 52, bossSelection: 52, bossId: 52, combatBossActif: false, systemes: { systems: [] } };
const serveur = { bossVaincus: 52, bossSelection: 53, bossId: 53, combatBossActif: false, systemes: { systems: [] } };
assert.notEqual(empreinte(local), empreinte(serveur), "boss suivant sélectionné : l'empreinte change, la page est redessinée");
assert.equal(empreinte(serveur), empreinte({ ...serveur }), "même état : même empreinte (pas de redessin inutile)");
console.log("idle-boss-suivant-empreinte-v1: OK");
