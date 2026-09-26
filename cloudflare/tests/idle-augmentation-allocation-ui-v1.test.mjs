import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { applyIdleNguAction, normalizeIdleNguState, idleNguEffectiveResourceStat } from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-09-24) : « Augmentation ne fonctionne pas comme dans NGU IDLE. Il me semble qu'il y avait des + pour pouvoir y placer
 * de l'énergie comme pour Basic Training. Là, si je clique sur 50 %, ça me retire l'énergie de Basic Training… »
 * Wiki, page Augmentations : « the leveling up speed depends on the amount of allocated energy » (énergie ALLOUÉE par piste).
 * Les anciens boutons 0/25/50/100 % visaient un montant absolu (fraction du Cap) et prenaient d'un coup toute l'énergie libre.
 */
const CTX = { bosses: 40 };
const T0 = 1e12;
function etat(libre, basicTraining = 0) {
  const s = normalizeIdleNguState({}, {}, T0);
  s.systems.augmentations.unlocked = true;
  s.resources.energy.current = libre;
  return { s, ctx: { ...CTX, basicTrainingEnergyAllocation: basicTraining } };
}
const alloue = (s, pair = "scissors", upgrade = false) => s.systems.augmentations.data.pairs[pair][upgrade ? "upgradeEnergy" : "energy"];

// --- « + » : place exactement le montant demandé, sans toucher à ce que Basic Training a déjà pris ---
{
  const { s, ctx } = etat(250, 200); // Cap 500 : 200 chez Basic Training, 250 libres
  const cap = idleNguEffectiveResourceStat(s, "energy", "cap");
  assert.equal(cap, 500);
  let r = applyIdleNguAction(s, { action: "allocateAugment", pair: "scissors", upgrade: false, value: 0 + 125 }, ctx, T0);
  assert.equal(alloue(r.state), 125, "+125 (Input par défaut)");
  assert.equal(r.state.resources.energy.current, 125, "il reste 125 d'énergie libre");
  r = applyIdleNguAction(r.state, { action: "allocateAugment", pair: "scissors", upgrade: false, value: 125 + 125 }, ctx, T0);
  assert.equal(alloue(r.state), 250);
  assert.equal(r.state.resources.energy.current, 0);
  // au-delà de l'énergie libre : borné, jamais de l'énergie prise à Basic Training
  r = applyIdleNguAction(r.state, { action: "allocateAugment", pair: "scissors", upgrade: false, value: 250 + 125 }, ctx, T0);
  assert.equal(alloue(r.state), 250, "plus d'énergie libre : rien de plus n'est placé");
  // « − » rend l'énergie
  r = applyIdleNguAction(r.state, { action: "allocateAugment", pair: "scissors", upgrade: false, value: 250 - 125 }, ctx, T0);
  assert.equal(alloue(r.state), 125);
  assert.equal(r.state.resources.energy.current, 125);
}

// --- « Max » : toute l'énergie libre (le client envoie le Cap, le serveur borne) ---
{
  const { s, ctx } = etat(60, 400);
  const r = applyIdleNguAction(s, { action: "allocateAugment", pair: "scissors", upgrade: false, value: 500 }, ctx, T0);
  assert.equal(alloue(r.state), 60);
  assert.equal(r.state.resources.energy.current, 0);
}

// --- « Tout retirer » : rend l'énergie de tous les Augments et Upgrades ---
{
  const { s, ctx } = etat(300, 0);
  let r = applyIdleNguAction(s, { action: "allocateAugment", pair: "scissors", upgrade: false, value: 100 }, ctx, T0);
  r = applyIdleNguAction(r.state, { action: "allocateAugment", pair: "scissors", upgrade: true, value: 50 }, ctx, T0);
  assert.equal(r.state.resources.energy.current, 150);
  r = applyIdleNguAction(r.state, { action: "clearAugmentAllocations" }, ctx, T0);
  assert.equal(alloue(r.state), 0);
  assert.equal(alloue(r.state, "scissors", true), 0);
  assert.equal(r.state.resources.energy.current, 300);
  assert.equal(r.state.systems.augmentations.allocation.energy, 0);
}

// --- Client : − / + / Max par piste, Input, énergie libre, Tout retirer ; plus de 0/25/50/100 % ---
const module_ = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
const page = module_.slice(module_.indexOf("function pageAugmentationsIdleV48_(j)"), module_.indexOf("function pageTimeMachineIdleV48_(j)"));
assert.ok(page.includes("[['moins','−'],['plus','+'],['max','Max']]"));
assert.ok(page.includes("window.__ajusterAugmentIdleV1__("));
assert.ok(!page.includes("['0%','25%','50%','100%']"), "les pourcentages du Cap ont disparu des Augmentations");
assert.match(page, /id="sorealIdleAugInputV1"/);
assert.match(page, /Énergie libre :/);
assert.match(page, /clearAugmentAllocations/);
assert.match(module_, /const value=mode==='plus'\s*\?current\+pas\s*:mode==='moins'\s*\?Math\.max\(0,current-pas\)\s*:Math\.max\(cap,current\);/);
assert.ok(readFileSync("cloudflare/public/index.html", "utf8").includes("/modules/meta-progression-v130.js?v=202609261"));

console.log("idle-augmentation-allocation-ui-v1: OK");

// --- Rendu réel de la page et clics simulés (module chargé dans un bac à sable, hôte simulé) ---
{
  const vm = await import("node:vm");
  const sent = [];
  let etat = null;
  const els = {};
  const H = {
    idleNombre_: (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; },
    idleEntier_: (v) => Math.floor(Number(v) || 0),
    idleHtml_: (v) => String(v),
    formatGrandNombreIdleV70_: (v) => String(v),
    entetePageIdleV28_: (t) => "<h1>" + t + "</h1>",
    getIdleEtat: () => etat
  };
  const window = { __SOREAL_IDLE_META_HOST_V130__: H, __actionMetaV47__: (p) => sent.push(p) };
  const document = { getElementById: (id) => els[id] || null };
  vm.runInNewContext(module_, { window, document, performance: { now: () => 0 }, console, Math, Number, Object, Array, Boolean, String, JSON, Date, setTimeout, clearTimeout });
  etat = {
    energie: 250,
    systemes: {
      systems: [{ id: "augmentations", state: { unlocked: true, data: { pairs: { scissors: { level: 3, energy: 100, upgradeLevel: 0, upgradeEnergy: 0 } } } } }],
      augmentations: [{ id: "scissors", name: "Safety Scissors", unlockBoss: 17, progressPct: 0.5, upgradeProgressPct: 0, upgrade: { unlockBoss: 37 } }],
      resources: { energy: { cap: 500 } },
      records: { highestBoss: 40 }, currencies: { gold: 1000 }, bonuses: { augmentationMultiplier: 1.5 }
    }
  };
  const html = window.__SOREAL_IDLE_META_V130__.pageSystemeMetaIdleV130_(etat, "augmentations", "Augmentations");
  assert.match(html, /Énergie libre : <b>250<\/b>/);
  assert.equal((html.match(/__ajusterAugmentIdleV1__/g) || []).length, 6, "3 boutons pour l'Augment et 3 pour l'Upgrade");
  assert.ok(!html.includes("25%") && !html.includes("50%"));
  // clics : Input = 40 -> + = 100 + 40, − = 100 − 40, Max = Cap
  els.sorealIdleAugInputV1 = { value: "40" };
  window.__ajusterAugmentIdleV1__("scissors", false, "plus");
  window.__ajusterAugmentIdleV1__("scissors", false, "moins");
  window.__ajusterAugmentIdleV1__("scissors", false, "max");
  window.__ajusterAugmentIdleV1__("scissors", true, "plus");
  assert.deepEqual(sent.map((p) => [p.action, p.pair, p.upgrade, p.value]), [
    ["allocateAugment", "scissors", false, 140],
    ["allocateAugment", "scissors", false, 60],
    ["allocateAugment", "scissors", false, 500],
    ["allocateAugment", "scissors", true, 40]
  ]);
  els.sorealIdleAugInputV1 = { value: "" };
  window.__ajusterAugmentIdleV1__("scissors", false, "plus");
  assert.equal(sent.at(-1).value, 140, "Input invalide : on garde le dernier montant valide");
}
console.log("idle-augmentation-allocation-ui-v1 (rendu): OK");
