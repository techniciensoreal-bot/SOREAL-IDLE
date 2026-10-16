import assert from "node:assert/strict";
import { lireUiComplet, extraireFonction } from "./_ui-sources.mjs";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-05) : « j'ai tué un boss et le suivant n'apparaît pas » : l'écran restait sur « boss 52 vaincu » alors que l'état était au boss 53. Le redessin après une synchro dépend de
 * l'empreinte structurelle de l'état ; elle doit changer quand le boss SÉLECTIONNÉ change, même si le nombre de boss vaincus est déjà le bon (victoire comptée en local).
 */
const ui = lireUiComplet();
const corps = extraireFonction(ui, "empreinteStructurelleIdleV1_");
const idleEntier_ = (v) => Math.floor(Number(v) || 0);
const empreinte = new Function("idleEntier_", corps + "; return empreinteStructurelleIdleV1_;")(idleEntier_);

const local = { bossVaincus: 52, bossSelection: 52, bossId: 52, combatBossActif: false, systemes: { systems: [] } };
const serveur = { bossVaincus: 52, bossSelection: 53, bossId: 53, combatBossActif: false, systemes: { systems: [] } };
assert.notEqual(empreinte(local), empreinte(serveur), "boss suivant sélectionné : l'empreinte change, la page est redessinée");
assert.equal(empreinte(serveur), empreinte({ ...serveur }), "même état : même empreinte (pas de redessin inutile)");
console.log("idle-boss-suivant-empreinte-v1: OK");
