import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import {
  IDLE_NGU_AUGMENTATIONS,
  normalizeIdleNguState,
  applyIdleNguAction,
  advanceIdleNguState,
  rebirthIdleNguState,
  idleNguAugmentationMultiplier,
  idleNguSnapshot
} from "../src/idle-ngu-progression.js";

/*
 * Audit du menu Augmentations (Norman, 2026-10-11) contre le wiki NGU Idle, page « Augmentations » (miroir local NGU-Wiki/pages/Augmentations.json, révision du 2026-01-18) :
 *  - tableau « Augmentation Types & Upgrades » : multiplicateur de base, coût en Or du 1er niveau, temps du 1er niveau (mode normal, 1000 d'énergie, 1 de puissance), boss de déblocage ;
 *  - coût en Or = coût de base x n (Augment) ou x n² (Upgrade), n = niveau visé ; l'Upgrade multiplie le bonus de l'Augment par (1 + niveau²) ;
 *  - exposant du bonus : 1 pour les Ciseaux, 1,1 à partir du Lait, +0,1 par palier ; les bonus de tous les Augments s'ADDITIONNENT ;
 *  - Evil : durée x 2,5e12 ; Sadistic : x 1e15 par rapport à Evil.
 * Les sept paires du wiki, aucune de plus.
 */
const WIKI = [
  // id, nom, multiplicateur, Or augment, temps augment, boss augment, nom upgrade, Or upgrade, temps upgrade, boss upgrade
  ["scissors", "Safety Scissors", 1, 1e4, 400, 17, "Danger Scissors", 1e7, 400, 37],
  ["milk", "Milk Infusion", 25, 2e5, 6800, 18, "Drinking The Milk Too", 5e8, 4800, 40],
  ["cannon", "Cannon Implant", 625, 4e6, 115600, 20, "Missile Launcher", 2.5e10, 57600, 44],
  ["minigun", "Shoulder Mounted Minigun", 15625, 8e7, 1965200, 24, "Actual Ammunition", 1.25e12, 691200, 46],
  ["buster", "Energy Buster", 390625, 1.6e9, 33408400, 28, "Charge Shot", 6.25e13, 8294400, 48],
  ["exoskeleton", "Advanced Exoskeleton", 976563000, 1.8e16, 46771760000, 56, "Energy Shield", 3.125e18, 6635520000, 56],
  ["laserSword", "Laser Sword", 2441000000000, 2.3e19, 65480464000000, 68, "Quadruple Sided Laser Sword", 1.5625e23, 5308416000000, 68]
];
assert.equal(IDLE_NGU_AUGMENTATIONS.length, 7, "7 Augments, 7 Upgrades");
WIKI.forEach((w, i) => {
  const d = IDLE_NGU_AUGMENTATIONS[i];
  assert.equal(d.id, w[0]);
  assert.equal(d.name, w[1]);
  assert.equal(d.baseMultiplier, w[2], w[0] + " : multiplicateur de base");
  assert.equal(d.baseGold, w[3], w[0] + " : Or du 1er niveau");
  assert.equal(d.baseSeconds, w[4], w[0] + " : temps du 1er niveau");
  assert.equal(d.unlockBoss, w[5], w[0] + " : boss de déblocage");
  assert.equal(d.upgrade.name, w[6]);
  assert.equal(d.upgrade.baseGold, w[7], w[6] + " : Or du 1er niveau");
  assert.equal(d.upgrade.baseSeconds, w[8], w[6] + " : temps du 1er niveau");
  assert.equal(d.upgrade.unlockBoss, w[9], w[6] + " : boss de déblocage");
  assert.equal(d.exponent, +(1 + 0.1 * i).toFixed(1), w[0] + " : exposant 1, 1,1, 1,2…");
});

const ctx = { bosses: 120, bestGold: 1e15, adventurePower: 1e9 };
const T = 1_000_000;
function depart(difficulte) {
  let s = normalizeIdleNguState({}, ctx, T);
  if (difficulte) s.difficulty = difficulte;
  s.systems.augmentations.unlocked = true;
  s.resources.energy.cap = 1e9; s.resources.energy.current = 1e9; s.resources.energy.power = 1;
  return s;
}
const snap = (s) => idleNguSnapshot(s, ctx, T).augmentations;

// Temps : 400 s pour le 1er niveau des Ciseaux avec 1000 d'énergie et 1 de puissance (mode normal), proportionnel au niveau visé, divisé par l'énergie.
{
  let s = depart();
  s = applyIdleNguAction(s, { action: "allocateAugment", pair: "scissors", upgrade: false, value: 1000 }, ctx, T).state;
  s = applyIdleNguAction(s, { action: "allocateAugment", pair: "scissors", upgrade: true, value: 1000 }, ctx, T).state;
  const d = snap(s).find((x) => x.id === "scissors");
  assert.equal(Math.round(d.secondsPerLevel), 400, "Safety Scissors : 400 s");
  assert.equal(Math.round(d.upgradeSecondsPerLevel), 400, "Danger Scissors : 400 s");
  assert.equal(Math.round(d.goldCost), 10000, "niveau 1 : 10 000 Or");
  s.systems.augmentations.data.pairs.scissors.level = 2;
  s.systems.augmentations.data.pairs.scissors.upgradeLevel = 2;
  const d3 = snap(s).find((x) => x.id === "scissors");
  assert.equal(Math.round(d3.goldCost), 30000, "niveau 3 : 30 000 Or (coût de base x n)");
  assert.equal(Math.round(d3.upgradeGoldCost), 1e7 * 9, "Upgrade niveau 3 : coût de base x n²");
  assert.equal(Math.round(d3.secondsPerLevel), 1200, "durée proportionnelle au niveau visé");
  s = applyIdleNguAction(s, { action: "allocateAugment", pair: "scissors", upgrade: false, value: 2000 }, ctx, T).state;
  assert.equal(Math.round(snap(s).find((x) => x.id === "scissors").secondsPerLevel), 600, "deux fois plus d'énergie : deux fois plus vite");
}

// Evil : x 2,5e12 ; Sadistic : x 1e15 de plus (2,5e27 en tout).
{
  const base = (diff) => {
    let s = depart(diff);
    s = applyIdleNguAction(s, { action: "allocateAugment", pair: "scissors", upgrade: false, value: 1000 }, ctx, T).state;
    return snap(s).find((x) => x.id === "scissors").secondsPerLevel;
  };
  const normal = base(undefined), evil = base("difficile"), sad = base("extreme");
  assert.ok(Math.abs(evil / normal / 2.5e12 - 1) < 1e-9, "Evil : x 2,5e12");
  assert.ok(Math.abs(sad / evil / 1e15 - 1) < 1e-9, "Sadistic : x 1e15 par rapport à Evil");
}

// Bonus : somme des Augments, chacun = base x niveau^exposant x (1 + niveau d'Upgrade²).
{
  let s = depart();
  const p = s.systems.augmentations.data.pairs;
  p.scissors.level = 10; p.scissors.upgradeLevel = 0;
  p.milk.level = 4; p.milk.upgradeLevel = 2;
  const attendu = 1 + (1 * Math.pow(10, 1) * 1) + (25 * Math.pow(4, 1.1) * (1 + 2 * 2));
  assert.ok(Math.abs(idleNguAugmentationMultiplier(s) / attendu - 1) < 1e-9, "somme additive : " + idleNguAugmentationMultiplier(s) + " vs " + attendu);
}

// Conservation de l'énergie, de l'Or et des niveaux sous une rafale d'actions (aucune énergie créée, aucun nombre invalide).
{
  let graine = 4242; const alea = () => (graine = (graine * 1103515245 + 12345) % 2147483648) / 2147483648;
  const ids = WIKI.map((w) => w[0]);
  for (let essai = 0; essai < 40; essai += 1) {
    let s = depart();
    s.resources.energy.cap = 1e6 * (1 + alea() * 1e3); s.resources.energy.current = s.resources.energy.cap;
    s.currencies.gold = Math.pow(10, 3 + alea() * 18);
    let t = T;
    for (let k = 0; k < 20; k += 1) {
      const id = ids[Math.floor(alea() * 7)], up = alea() < 0.5, r = alea();
      try {
        if (r < 0.4) s = applyIdleNguAction(s, { action: "allocateAugment", pair: id, upgrade: up, value: Math.floor(alea() * s.resources.energy.cap) }, ctx, t).state;
        else if (r < 0.5) s = applyIdleNguAction(s, { action: "setAugmentTarget", pair: id, upgrade: up, value: Math.floor(alea() * 6) }, ctx, t).state;
        else if (r < 0.57) s = applyIdleNguAction(s, { action: "setAugmentAdvance", enabled: alea() < 0.5 }, ctx, t).state;
        else { const dt = Math.floor(alea() * 4000); t += dt * 1000; s = advanceIdleNguState(s, dt, ctx, t); }
      } catch (e) { assert.match(e.message, /VERROUILLE|INVALIDE/); }
      let somme = 0;
      for (const q of Object.values(s.systems.augmentations.data.pairs)) {
        for (const f of ["energy", "upgradeEnergy", "level", "upgradeLevel", "progress", "upgradeProgress"]) assert.ok(Number.isFinite(q[f]) && q[f] >= 0, f + " valide");
        somme += q.energy + q.upgradeEnergy;
      }
      assert.ok(Math.abs(somme - s.systems.augmentations.allocation.energy) <= 1e-6 * Math.max(1, somme), "total alloué cohérent");
      assert.ok(s.currencies.gold >= -1e-6, "Or jamais négatif");
      assert.ok(s.resources.energy.current + somme <= s.resources.energy.cap * 1.0001 + 1, "aucune énergie créée");
      const m = idleNguAugmentationMultiplier(s);
      assert.ok(Number.isFinite(m) && m >= 1, "multiplicateur valide");
    }
  }
}

// Rebirth : niveaux remis à zéro, mais cibles et « Faire suivre l'énergie » conservés.
{
  let s = depart();
  s = applyIdleNguAction(s, { action: "setAugmentTarget", pair: "milk", upgrade: true, value: 7 }, ctx, T).state;
  s = applyIdleNguAction(s, { action: "setAugmentAdvance", enabled: true }, ctx, T).state;
  s.systems.augmentations.data.pairs.milk.level = 9;
  const r = rebirthIdleNguState(s, ctx, T + 4_000_000);
  const apres = (r.state || r).systems.augmentations.data;
  assert.equal(apres.pairs.milk.level, 0, "niveaux remis à zéro");
  assert.equal(apres.pairs.milk.upgradeTarget, 7, "cible conservée");
  assert.equal(apres.advanceEnergy, true, "« Faire suivre l'énergie » conservé");
}

// Page : aucun « NaN », « undefined » ni « Infinity » affiché, dans les états verrouillé, ouvert et en défi.
{
  const src = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
  const rendre = (s, boss) => {
    const j = { energie: 5e8, energieMax: 1e9, bossVaincus: boss, systemes: idleNguSnapshot(s, { ...ctx, bosses: boss }, T) };
    const H = {
      idleNombre_: (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; }, idleEntier_: (v) => Math.floor(Number(v) || 0), idleHtml_: String,
      formatGrandNombreIdleV70_: (v) => String(Math.floor(Number(v) || 0)), entetePageIdleV28_: (t) => "<h2>" + t + "</h2>", getIdleEtat: () => j
    };
    const window = { __SOREAL_IDLE_META_HOST_V130__: H };
    vm.runInNewContext(src, { window, document: { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [] }, SOREAL_SESSION: "x", performance: { now: () => 0 }, console, Math, Number, Object, Array, Boolean, String, JSON, Date, setTimeout, clearTimeout, setInterval() {}, localStorage: { getItem() { return null; }, setItem() {} } });
    return window.__SOREAL_IDLE_META_V130__.pageSystemeMetaIdleV130_(j, "augmentations", "Augmentations");
  };
  for (const boss of [17, 30, 60, 100]) {
    let s = depart();
    s = applyIdleNguAction(s, { action: "allocateAugment", pair: "scissors", upgrade: false, value: 1e6 }, { ...ctx, bosses: boss }, T).state;
    const html = rendre(s, boss);
    assert.ok(!/NaN|undefined|Infinity/.test(html), "page sans valeur invalide au boss " + boss);
  }
  const defi = depart(); defi.challenge.active = "noAugmentations";
  assert.ok(!/NaN|undefined|Infinity/.test(rendre(defi, 100)), "page du défi sans valeur invalide");
}
console.log("idle-augmentations-audit-wiki-v1: OK");
