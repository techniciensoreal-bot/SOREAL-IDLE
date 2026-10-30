import assert from "node:assert/strict";
import { creerJoueurExterneV1 } from "./helpers/joueur-externe-v1.mjs";

/*
 * Norman (2026-10-31) : « le compte à rebours d'Auto Merge / Auto Boost fait des rollbacks (18, 17, 16, 17, 16…) ». Côté MOTEUR : à des instants croissants (synchros de 4 s, comme le jeu local), le temps restant
 * annoncé (`mergeRemainingSeconds` / `boostRemainingSeconds`) diminue exactement du temps écoulé, ne remonte jamais, et repart de la PÉRIODE COMPLÈTE après le déclenchement.
 */
let horloge = 1_800_000_000_000;
const VraiDate = Date;
globalThis.Date = class extends VraiDate { constructor(...a) { if (a.length === 0) super(horloge); else super(...a); } static now() { return horloge; } };

const g = creerJoueurExterneV1("minuteur" + Math.random().toString(36).slice(2) + "@example.com");
const run = (op, ...a) => g.op(op, "x", ...a);
run("obtenirEtatSorealIdle");
run("definirPseudoSorealIdle", "Minuteur");
const ligne = g.sql.exec("select rowid as id,row_json from idle_catalog where sheet_name='JOUEURS' and row_index>1")[0];
const arr = JSON.parse(ligne.row_json);
const i = arr.findIndex((x) => typeof x === "string" && x.includes("metaNgu"));
const stats = JSON.parse(arr[i]);
const m = stats.metaNgu;
/* Achat d'Auto Merge (boutique EXP), Auto Boost (Défi No Equipment, 4 complétions = -40 %), achat de la boutique AP « 1/2 minuteurs » : période 3600 x 0,6 x 0,5 = 1080 s. */
m.bonuses = Object.assign({}, m.bonuses, { expShop: Object.assign({}, m.bonuses && m.bonuses.expShop, { autoMerge: 1 }) });
m.selloutShop = { purchases: { autoMergeBoostTimers: 1 }, unlockedEver: true };
m.challenge = Object.assign({}, m.challenge, { completions: Object.assign({}, m.challenge && m.challenge.completions, { noEquipment: 4 }) });
m.adventure.inventoryAuto.autoMerge = true;
m.adventure.inventoryAuto.autoBoost = true;
arr[i] = JSON.stringify(stats);
g.db.prepare("update idle_catalog set row_json=? where rowid=?").run(JSON.stringify(arr), ligne.id);

const lire = () => { const s = run("obtenirEtatSorealIdle").joueur.systemes.inventoryAuto; return s; };
let s = lire();
assert.ok(s.unlocked.autoMerge && s.unlocked.autoBoost, "Auto Merge et Auto Boost débloqués dans le banc");
assert.equal(s.intervalSeconds, 1080, "période Auto Merge/Boost avec défi x4 et achat AP : 18 min");
for (const [nom, cle] of [["Auto Merge", "mergeRemainingSeconds"], ["Auto Boost", "boostRemainingSeconds"]]) {
  let t0 = horloge, prec = null, tPrec = null, declenchements = 0;
  for (let k = 0; k < 600; k += 1) { // 600 synchros de 4 s = 40 min : plus de deux périodes
    horloge += 4000 + (k % 3) * 37; // cadence irrégulière
    s = lire();
    const reste = s[cle]; if (process.env.TR) console.log(nom, k, s.mergeRemainingSeconds.toFixed(2), s.boostRemainingSeconds.toFixed(2));
    assert.ok(reste > 0 && reste <= 1080, nom + " : reste dans (0 ; période]");
    if (prec !== null) {
      const ecoule = (horloge - tPrec) / 1000;
      if (reste <= prec) assert.ok(Math.abs((prec - reste) - ecoule) < 0.01, nom + " : décompte exact " + prec + " -> " + reste + " pour " + ecoule + " s");
      else { declenchements += 1; assert.ok(prec - ecoule <= 0.01, nom + " : ne remonte qu'après avoir atteint 0 (" + prec + " -> " + reste + ")"); assert.ok(1080 - reste <= ecoule + 0.01 + 1e-6, nom + " : repart de la période complète (" + reste + ")"); }
    }
    prec = reste; tPrec = horloge;
  }
  assert.ok(declenchements >= 2, nom + " : au moins deux déclenchements observés (" + declenchements + ")");
}
console.log("idle-inventaire-auto-minuteur-monotone-v1: OK");
