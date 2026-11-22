import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { normalizeIdleNguState, idleNguSnapshot } from "../src/idle-ngu-progression.js";

/*
 * Écran Rebirth (RebirthPowerDisplay::Update, IL build 1260, 2026-11-22) : facteurs Yggdrasil / MacGuffin / Hack NUMBER (visibles seulement s'ils sont différents de x1),
 * phrase « Your NUMBER will be X x larger / smaller if you rebirth! (Or ~N more / fewer bosses!) » (à partir du boss 17 ; N = log10 du rapport arrondi, affiché au-delà de 3),
 * avertissement rouge « PIT NOT USED » (pitTime >= 3600 et aucun jet pendant ce Rebirth).
 */

// ---------- serveur : le préavis transmet les trois facteurs, l'avertissement du Pit ----------
const ctx = { bosses: 100 };
{
  const s = normalizeIdleNguState({ difficulty: "normal" }, ctx, 0);
  const snap = idleNguSnapshot(s, ctx, 5000);
  for (const k of ["yggNumberBonus", "macguffinNumberBonus", "hacksNumberBonus"]) assert.equal(snap.rebirth.preview[k], 1, k + " transmis (x1 : l'interface ne l'affiche pas)");
  assert.equal(snap.rebirth.pitInutilise, false, "Money Pit fermé : aucun avertissement (règle n°2)");

  const p = normalizeIdleNguState({ difficulty: "normal" }, ctx, 0);
  p.systems.moneyPit.unlocked = true;
  p.systems.moneyPit.data.nextAt = 0;
  p.systems.moneyPit.data.tossesThisRun = 0;
  assert.equal(idleNguSnapshot(p, ctx, 5000).rebirth.pitInutilise, true, "débloqué, jetable, aucun jet ce Rebirth : « PIT NOT USED »");
  p.systems.moneyPit.data.tossesThisRun = 1;
  assert.equal(idleNguSnapshot(p, ctx, 5000).rebirth.pitInutilise, false, "déjà jeté ce Rebirth");
  p.systems.moneyPit.data.tossesThisRun = 0;
  p.systems.moneyPit.data.nextAt = 10 * 3600 * 1000;
  assert.equal(idleNguSnapshot(p, ctx, 5000).rebirth.pitInutilise, false, "pas encore jetable (moins d'une heure)");
}

// ---------- interface : le vrai module, sur un faux registre ----------
const REG = {
  idleNombre_: (v) => Number(v) || 0,
  idleEntier_: (v) => Math.floor(Number(v) || 0),
  formatGrandNombreIdleV70_: (v, d) => String(Number(v).toFixed(d == null ? 0 : d)),
  entetePageIdleV28_: () => "",
  idleEtat: { renaissance: { debloquee: true } }
};
const fenetre = { __SOREAL_IDLE_REG__: REG, document: { addEventListener() {}, getElementById: () => null, querySelector: () => null }, console, setTimeout, localStorage: { getItem: () => null, setItem() {} } };
fenetre.window = fenetre;
vm.runInNewContext(readFileSync("cloudflare/public/modules/ui-renaissance-v1.js", "utf8"), fenetre, { filename: "ui-renaissance-v1.js" });
const rendre = (j) => REG.pageRenaissanceIdleV28_(j);
const joueur = ({ preview = {}, number = 10, next = 10, boss = 30, pit = false } = {}) => ({
  bossVaincus: boss, renaissance: { debloquee: true, number, nextNumber: next },
  systemes: { rebirth: { number, nextNumber: next, preview: Object.assign({ currentBossFactor: 2 }, preview), pitInutilise: pit }, systems: [], records: { totalRebirths: 0 } }
});

// facteurs : seulement s'ils sont différents de x1
let h = rendre(joueur());
for (const t of ["Bonus NUMBER d’Yggdrasil", "Bonus NUMBER des MacGuffins", "Bonus NUMBER des Hacks"]) assert.ok(!h.includes(t), t + " absent à x1");
h = rendre(joueur({ preview: { yggNumberBonus: 3, macguffinNumberBonus: 1.5, hacksNumberBonus: 2 } }));
for (const t of ["Bonus NUMBER d’Yggdrasil", "Bonus NUMBER des MacGuffins", "Bonus NUMBER des Hacks"]) assert.ok(h.includes(t), t + " visible");

// phrase : plus grand / plus petit, boss de plus / de moins seulement au-delà de 3, rien avant le boss 17
h = rendre(joueur({ number: 10, next: 50 }));
assert.ok(h.includes("Ton Nombre sera 5.000 fois plus grand si tu renais !") && !h.includes("boss de plus"), "x5 : log10 = 1, pas de mention de boss");
h = rendre(joueur({ number: 10, next: 100000 }));
assert.ok(h.includes("fois plus grand si tu renais !") && h.includes("(soit ~4 boss de plus)"), "x10 000 : ~4 boss de plus");
h = rendre(joueur({ number: 100000, next: 10 }));
assert.ok(h.includes("fois plus petit si tu renais !") && h.includes("(soit ~4 boss de moins)"), "plus petit : ~4 boss de moins");
h = rendre(joueur({ number: 10, next: 50, boss: 10 }));
assert.ok(!h.includes("si tu renais !"), "avant le boss 17 : la phrase n'est pas écrite (le jeu la laisse vide)");
h = rendre(joueur({ number: 10, next: 10 }));
assert.ok(!h.includes("si tu renais !"), "rapport 1 : aucune phrase");

// avertissement du Pit
assert.ok(!rendre(joueur()).includes("PIT NON UTILISÉ"));
h = rendre(joueur({ pit: true }));
assert.ok(h.includes("PIT NON UTILISÉ") && /color:#ff4a4a/.test(h), "avertissement rouge");
console.log("idle-rebirth-facteurs-v1: OK");
