/* Gain d'AP d'Énigmes COUPÉ (Norman, 2026-11-23 : « je ne veux pas le gain avant qu'on ait terminé de calculer ») : par défaut, ni le moteur ne crédite, ni le suivi n'envoie ; l'état n'est pas touché. */
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { applyIdleNguAction, syncIdleNguState } from "../src/idle-ngu-progression.js";
import { idleScummvmApActifV1, idleScummvmProgresV1, idleScummvmTropheesV1 } from "../src/idle-scummvm-progres-v1.js";
import { IDLE_SCUMMVM_BOSS_V1 } from "../src/idle-ngu-catalogues.js";

// 1. moteur : coupé par défaut
const { idleScummvmDefinirApActifV1: definirAp } = await import("../src/idle-scummvm-progres-v1.js");
assert.equal(idleScummvmApActifV1(), true, "le gain d'AP est actif depuis le 2026-11-23 (calcul exponentiel terminé)");
definirAp(false);   /* le reste du test vérifie le comportement de l'interrupteur COUPÉ */
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

// 1b. ANNULATION (Norman, 2026-11-23, « retire l'AP déjà gagné ») : un compte qui avait reçu de l'AP d'Énigmes le voit retiré UNE fois à la synchronisation, les enregistrements sont effacés
{
  const { idleScummvmDefinirApActifV1, idleScummvmAnnulerCreditsV1 } = await import("../src/idle-scummvm-progres-v1.js");
  const ctx = { bosses: IDLE_SCUMMVM_BOSS_V1 + 5 };
  let e = syncIdleNguState({}, ctx, t0);
  const apDepart = 1234;
  e.currencies.ap = apDepart;
  idleScummvmDefinirApActifV1(true);   // l'époque où le gain était actif
  e = applyIdleNguAction(e, { action: "scummvmTrophees", jeu: "dott", plafond: 150000, trophees: [{ id: "livret-suisse", ap: 1500 }, { id: "correcteur", ap: 600 }] }, ctx, t0 + 1000).state;
  e = applyIdleNguAction(e, { action: "scummvmTrophees", jeu: "autre", plafond: 150000, trophees: [{ id: "t1", ap: 400 }] }, ctx, t0 + 2000).state;
  assert.equal(e.currencies.ap, apDepart + 1500 + 600 + 400, "le gain actif avait bien crédité");
  idleScummvmDefinirApActifV1(true);
  const intact = JSON.stringify(syncIdleNguState(JSON.parse(JSON.stringify(e)), ctx, t0 + 3000).currencies);
  assert.ok(Number(JSON.parse(intact).ap) >= apDepart + 2500, "gain actif : la synchronisation ne retire rien");
  idleScummvmDefinirApActifV1(false);    // le gain est coupé
  const brut = JSON.parse(JSON.stringify(e));
  const apx = brut.currencies.ap;
  const s1 = syncIdleNguState(brut, ctx, t0 + 4000);
  assert.ok(Math.abs(s1.currencies.ap - apDepart) < 1e-6 || s1.currencies.ap < apx, "l'AP crédité est retiré : " + s1.currencies.ap);
  assert.equal(Math.round(s1.currencies.ap), apDepart, "retiré exactement (1500 + 600 + 400)");
  assert.deepEqual(s1.systems.scummvm.data.jeux, {}, "enregistrements effacés");
  const s2 = syncIdleNguState(JSON.parse(JSON.stringify(s1)), ctx, t0 + 5000);
  assert.equal(Math.round(s2.currencies.ap), apDepart, "idempotent : rien de plus n'est retiré");
  assert.equal(idleScummvmAnnulerCreditsV1(s2), false);
  // jamais d'AP négatif
  const pauvre = syncIdleNguState({}, ctx, t0); pauvre.currencies.ap = 10; pauvre.systems.scummvm.data = { jeux: { dott: { apCredite: 5000 } } };
  idleScummvmAnnulerCreditsV1(pauvre);
  assert.equal(pauvre.currencies.ap, 0, "jamais négatif");
}

// 2. client : le suivi ne lit que ; aucune action, aucun trophée « envoyé »
const srcSave = readFileSync("cloudflare/public/modules/scummvm-sauvegarde-v1.js", "utf8");
const srcProgres = readFileSync("cloudflare/public/modules/scummvm-progres-v1.js", "utf8");
const sb = { console, Promise, Date, Math, JSON, Object, Array, String, Number, Boolean, Set, Error, Uint8Array, localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, setTimeout: () => 1, clearTimeout() {}, addEventListener() {}, __actions: [] };
sb.window = sb; sb.__actionMetaIdleV130__ = (p) => sb.__actions.push(p);
vm.createContext(sb);
vm.runInContext(srcSave, sb);
vm.runInContext(srcProgres, sb);
assert.ok(sb.__SOREAL_IDLE_SCUMMVM_PROGRES_V1__, "module chargé");
assert.ok(/let AP_ACTIF=true;/.test(srcProgres), "le suivi est actif (AP_ACTIF=true)");
assert.ok(/if\(AP_ACTIF&&aEnvoyer\.length&&typeof f==='function'\)/.test(srcProgres), "trophées : envoi seulement si le gain est actif");
assert.ok(/if\(AP_ACTIF&&typeof f==='function'\)\{const msg=\{action:'scummvmProgres'/.test(srcProgres), "unités : envoi seulement si le gain est actif");
console.log("idle-scummvm-ap-coupe-v1: OK");
