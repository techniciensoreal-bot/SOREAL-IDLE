import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { applyIdleNguAction, advanceIdleNguState, idleNguSnapshot, normalizeIdleNguState } from "../src/idle-ngu-progression.js";

/*
 * Norman (2026-09-24) : « Les barres dans Augmentations se remplissent à fond mais ne repartent pas de 0. J'aimerais aussi qu'il y ait
 * le temps indiqué pour qu'elle prenne un level. Augmentations entre Fight Boss et Basic Training. Boutique AP entre EXP Shop et Settings. »
 * Wiki (Augmentations) : « Each augment level costs gold and the leveling up speed depends on the amount of allocated energy ».
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");

// --- Ordre des menus ---
{
  const bloc = ui.slice(ui.indexOf("const IDLE_MENUS_V1=["), ui.indexOf("];", ui.indexOf("const IDLE_MENUS_V1=[")));
  const ids = [...bloc.matchAll(/\{id:'([A-Za-z]+)'/g)].map((m) => m[1]);
  assert.deepEqual(ids.slice(0, 3), ["entrainement", "augmentations", "combat"], "Augmentations entre Basic Training et Fight Boss");
  assert.equal(ids.filter((id) => id === "augmentations").length, 1);
  /* 2026-09-25 : EXP Shop et Boutique AP sont réunis dans « Shop » ; « Classement » est juste à gauche de Settings. */
  assert.deepEqual(ids.slice(-3), ["shop", "classement", "parametres"], "Shop puis Classement, juste avant Settings");
  assert.ok(!ids.includes("spendExp") && !ids.includes("sellout"), "plus de boutons EXP Shop / Boutique AP séparés");
}

// --- Moteur : sans Or, la barre reste pleine et le snapshot le dit ; avec l'Or, elle repart de 0 ---
const T0 = 1e12;
function etat(or) {
  const s = normalizeIdleNguState({}, {}, T0);
  s.systems.augmentations.unlocked = true;
  s.resources.energy.current = 1000;
  s.currencies.gold = or;
  return s;
}
const ctx = { bosses: 40 };
const alloue = (s) => applyIdleNguAction(s, { action: "allocateAugment", pair: "scissors", upgrade: false, value: 1000 }, ctx, T0).state;
const def = (s) => idleNguSnapshot(s, ctx, T0).augmentations.find((d) => d.id === "scissors");
{
  let s = alloue(etat(0));
  const d0 = def(s);
  assert.ok(d0.secondsPerLevel > 0 && Number.isFinite(d0.secondsPerLevel), "durée d'un niveau exposée");
  assert.equal(d0.goldCost, 10000, "niveau 1 des Safety Scissors = 10 000 Or (wiki)");
  assert.equal(d0.waitingGold, false, "barre pas encore pleine");
  s = advanceIdleNguState(s, d0.secondsPerLevel * 3, ctx, T0 + 1).state ?? advanceIdleNguState(s, d0.secondsPerLevel * 3, ctx, T0 + 1);
  const d1 = def(s);
  assert.equal(d1.progressPct, 1, "sans Or la barre reste pleine");
  assert.equal(d1.waitingGold, true, "et le snapshot signale l'attente d'Or");
  assert.equal(s.systems.augmentations.data.pairs.scissors.level, 0, "aucun niveau sans Or");
}
{
  let s = alloue(etat(1e9));
  const d0 = def(s);
  s = advanceIdleNguState(s, d0.secondsPerLevel * 1.5, ctx, T0 + 1);
  s = s.state ?? s;
  const p = s.systems.augmentations.data.pairs.scissors;
  assert.ok(p.level >= 1, "avec l'Or, le niveau monte");
  assert.ok(def(s).progressPct < 1, "et la barre repart de 0");
  assert.equal(def(s).waitingGold, false);
}

// --- Client : durée par niveau, coût, compte à rebours, barre figée faute d'Or, remplissage honnête ---
assert.match(meta, /'⏱ '\+formatDureeAugmentIdleV1_\(upgrade\?def\.upgradeSecondsPerLevel:def\.secondsPerLevel\)\+' par niveau · '/);
assert.match(meta, /data-idle-aug-eta-v1="'\+def\.id/);
assert.match(meta, /Niveau suivant dans /);
assert.match(meta, /Barre pleine : il manque /);
assert.match(ui, /data-idle-aug-eta-v1="'\+id\+':'\+x\[0\]/);
assert.match(ui, /if\(x\[3\]&&seconds>0\)\{/, "barre pleine et fixe tant que l'Or manque");
assert.match(ui, /seconds>=2\s*\?\[\s*\{transform:'scaleX\(0\)',offset:0\},\s*\{transform:'scaleX\(1\)',offset:1\}/, "cycles longs : 0 -> 100 % sans plateau");

// --- La fonction de durée et le texte de compte à rebours (extraits du module) ---
{
  const m = meta.match(/function formatDureeAugmentIdleV1_\(secondes\)\{[\s\S]*?\n      \}\n/)[0];
  const fmt = new Function(m + "return formatDureeAugmentIdleV1_;")();
  assert.equal(fmt(45), "45 s");
  assert.equal(fmt(400), "6 min 40 s");
  assert.equal(fmt(6800), "1 h 53 min");
  assert.equal(fmt(90000), "1 j 1 h");
}

console.log("idle-augmentation-eta-menu-order-v1 OK");
