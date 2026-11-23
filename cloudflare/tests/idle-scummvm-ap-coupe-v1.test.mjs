/* Gain d'AP d'Énigmes COUPÉ (Norman, 2026-11-23 : « je ne veux pas le gain avant qu'on ait terminé de calculer ») : par défaut, ni le moteur ne crédite, ni le suivi n'envoie ; l'état n'est pas touché. */
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { applyIdleNguAction, syncIdleNguState } from "../src/idle-ngu-progression.js";
import { idleScummvmApActifV1, idleScummvmProgresV1, idleScummvmTropheesV1 } from "../src/idle-scummvm-progres-v1.js";
import { IDLE_SCUMMVM_BOSS_V1 } from "../src/idle-ngu-catalogues.js";

// 1. moteur : coupé par défaut
assert.equal(idleScummvmApActifV1(), false, "le gain d'AP est coupé par défaut");
const t0 = Date.parse("2026-11-23T10:00:00.000Z");
let etat = syncIdleNguState({}, { bosses: IDLE_SCUMMVM_BOSS_V1 + 5 }, t0);
const avantAp = JSON.stringify(etat.currencies);
const avantTout = JSON.stringify(etat);
for (const [action, payload] of [
  ["scummvmProgres", { jeu: "dott", unites: 5, plafond: 150000, parUnite: 500 }],
  ["scummvmTrophees", { jeu: "dott", plafond: 150000, trophees: [{ id: "livret-suisse", ap: 600 }] }],
]) {
  const r = applyIdleNguAction(etat, Object.assign({ action }, payload), { bosses: IDLE_SCUMMVM_BOSS_V1 + 5 }, t0 + 1000);
  assert.equal(JSON.stringify(r.state.currencies), avantAp, action + " : aucun AP crédité");
  assert.ok(!r.state.systems.scummvm.data || !r.state.systems.scummvm.data.jeux || !Object.keys(r.state.systems.scummvm.data.jeux).length, action + " : aucun crédit enregistré");
}
assert.deepEqual(idleScummvmProgresV1(etat, { jeu: "dott", unites: 3, plafond: 1000, parUnite: 10 }).desactive, true);
assert.deepEqual(idleScummvmTropheesV1(etat, { jeu: "dott", plafond: 1000, trophees: [{ id: "x", ap: 5 }] }).nouveaux, []);
assert.equal(JSON.stringify(etat), avantTout, "l'état d'entrée n'est pas modifié");
// le menu reste verrouillé = toujours une erreur (la garde de déblocage passe avant l'interrupteur)
const verrou = syncIdleNguState({}, { bosses: 1 }, t0);
assert.throws(() => idleScummvmProgresV1(verrou, { jeu: "dott", unites: 1, plafond: 1000, parUnite: 10 }), /SYSTEME_VERROUILLE/);

// 2. client : le suivi ne lit que ; aucune action, aucun trophée « envoyé »
const srcSave = readFileSync("cloudflare/public/modules/scummvm-sauvegarde-v1.js", "utf8");
const srcProgres = readFileSync("cloudflare/public/modules/scummvm-progres-v1.js", "utf8");
const sb = { console, Promise, Date, Math, JSON, Object, Array, String, Number, Boolean, Set, Error, Uint8Array, localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, setTimeout: () => 1, clearTimeout() {}, addEventListener() {}, __actions: [] };
sb.window = sb; sb.__actionMetaIdleV130__ = (p) => sb.__actions.push(p);
vm.createContext(sb);
vm.runInContext(srcSave, sb);
vm.runInContext(srcProgres, sb);
assert.ok(sb.__SOREAL_IDLE_SCUMMVM_PROGRES_V1__, "module chargé");
assert.ok(/let AP_ACTIF=false;/.test(srcProgres), "le suivi est coupé par défaut (AP_ACTIF=false)");
assert.ok(/if\(AP_ACTIF&&aEnvoyer\.length&&typeof f==='function'\)/.test(srcProgres), "trophées : envoi seulement si le gain est actif");
assert.ok(/if\(AP_ACTIF&&typeof f==='function'\)f\(\{action:'scummvmProgres'/.test(srcProgres), "unités : envoi seulement si le gain est actif");
console.log("idle-scummvm-ap-coupe-v1: OK");
