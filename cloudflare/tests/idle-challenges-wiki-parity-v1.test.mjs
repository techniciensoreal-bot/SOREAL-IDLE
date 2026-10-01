import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import {
  normalizeIdleNguState,
  applyIdleNguAction,
  advanceIdleNguState,
  rebirthIdleNguState,
  idleNguChallengeBonuses,
  idleNguSnapshot,
  IDLE_TROLL_INTERVALS_S_V1
} from "../src/idle-ngu-progression.js";
import { applyIdleAdventureActionV47 } from "../src/idle-adventure-v47.js";

/*
 * Chantier « Défis » (2026-09-30, page Challenges du wiki NGU Idle) : équipement verrouillé, trolls, fin automatique,
 * chrono du 24 Hour, Laser Sword, anti-spoil de la liste et textes français.
 */
const fresh = (difficulty = "normal", now = 1_000_000) => {
  const s = normalizeIdleNguState({}, { bosses: 100 }, now);
  s.difficulty = difficulty;
  s.systems.challenges.unlocked = true;
  s.records.highestBoss = 100;
  /* prérequis de déblocage des défis (page Challenges) */
  for (const t of ["t2", "t3", "t4"]) { s.adventure.titans[t] = Object.assign({}, s.adventure.titans[t], { kills: 1 }); }
  s.adventure.itemList = s.adventure.itemList || {};
  for (const slot of ["head", "chest", "legs", "boots", "weapon", "necklace", "meat"]) s.adventure.itemList["grb:" + slot] = { seen: true };
  s.challenge.bestMs = { basic: 1000 };
  return s;
};
const start = (s, id, now = 1_000_000, bosses = 100) => applyIdleNguAction(s, { action: "challenge", mode: "start", challenge: id }, { bosses }, now).state;

// --- No Equipment : impossible d'équiper, côté aventure ---
{
  const adv = applyIdleAdventureActionV47(undefined, { action: "addItem", definitionId: "grb:weapon" }, { bosses: 100 }, 1000);
  const id = adv.result.id || adv.result.item?.id || adv.state.inventory[0].id;
  assert.throws(() => applyIdleAdventureActionV47(adv.state, { action: "equip", id, slot: "weapon" }, { bosses: 100, equipmentLocked: true }, 2000), /DEFI_SANS_EQUIPEMENT/);
  assert.doesNotThrow(() => applyIdleAdventureActionV47(adv.state, { action: "equip", id, slot: "weapon" }, { bosses: 100 }, 2000));
}

// --- No Equipment : le moteur NGU transmet le verrou à l'aventure ---
{
  let s = fresh();
  s.records.highestBoss = 100;
  s = start(s, "noEquipment");
  assert.equal(s.challenge.active, "noEquipment");
  const ajout = applyIdleNguAction(s, { action: "adventure", adventure: { action: "addItem", definitionId: "grb:weapon" } }, { bosses: 0 }, 1_001_000);
  const inv = ajout.state.adventure.inventory;
  assert.ok(inv.length > 0);
  assert.throws(() => applyIdleNguAction(ajout.state, { action: "adventure", adventure: { action: "equip", id: inv[0].id, slot: "weapon" } }, { bosses: 0 }, 1_002_000), /DEFI_SANS_EQUIPEMENT/);
}

// --- Fin automatique d'un défi dès que la condition de victoire est remplie ---
{
  let s = fresh();
  s = start(s, "basic");
  const avant = s.currencies.experience;
  const apres = advanceIdleNguState(s, 1, { bosses: 58 }, 1_100_000);
  assert.equal(apres.challenge.active, "", "le Basic se termine tout seul au boss 58");
  assert.equal(apres.challenge.completions.basic, 1);
  assert.equal(apres.currencies.experience - avant, 1500);
  assert.equal(apres.challenge.lastCompletion.completed, "basic");
  assert.equal(apres.challenge.lastCompletion.seq, 1);
  // Un « valider » tardif renvoie le résultat sans double récompense.
  const tard = applyIdleNguAction(apres, { action: "challenge", mode: "complete", challenge: "basic" }, { bosses: 58 }, 1_110_000);
  assert.equal(tard.result.completed, "basic");
  assert.equal(tard.state.challenge.completions.basic, 1);
  // Avant la cible : rien ne se passe.
  let t = start(fresh(), "basic");
  t = advanceIdleNguState(t, 1, { bosses: 57 }, 1_100_000);
  assert.equal(t.challenge.active, "basic");
}

// --- 24 Hour : le chrono ne tourne pas hors ligne ---
{
  let s = fresh();
  s.challenge.bestMs = { basic: 1000 };
  s = start(s, "twentyFourHours", 1_000_000);
  const debut = s.challenge.startedAt;
  const apres = advanceIdleNguState(s, 3 * 3600, { bosses: 1 }, 1_000_000 + 3 * 3600 * 1000);
  const ecoule = 1_000_000 + 3 * 3600 * 1000 - apres.challenge.startedAt;
  assert.ok(ecoule <= 61_000, "les 3 h hors ligne ne comptent pas dans le chrono du défi (reste " + ecoule + " ms)");
  assert.ok(apres.challenge.startedAt > debut);
}

// --- Laser Sword : +0,05 à la 1re et à la 20e complétion, +0,01 entre les deux (x rang de l'augment) ---
{
  const pas = (n) => { const s = fresh(); s.challenge.completions.laserSword = n; return idleNguChallengeBonuses(s).laserSwordExponentStep; };
  assert.equal(pas(0), 0);
  assert.ok(Math.abs(pas(1) - 0.05) < 1e-12);
  assert.ok(Math.abs(pas(2) - 0.06) < 1e-12);
  assert.ok(Math.abs(pas(19) - 0.23) < 1e-12);
  assert.ok(Math.abs(pas(20) - 0.28) < 1e-12);
}

// --- Troll Challenge : intervalles, petits et gros trolls ---
{
  assert.deepEqual([...IDLE_TROLL_INTERVALS_S_V1], [120, 110, 100, 90, 85, 80, 75]);
  let s = fresh();
  s = start(s, "troll", 1_000_000, 69);
  assert.equal(s.challenge.troll.count, 0);
  // riche en tout, pour voir ce que les trolls enlèvent
  s.currencies.gold = 1e9;
  s.currencies.blood = 1000;
  s.resources.energy.current = 5000;
  s.resources.magic.current = 5000;
  let t = advanceIdleNguState(s, 59, { bosses: 0 }, 1_059_000);
  assert.equal(t.challenge.troll.count, 0, "pas de troll avant 120 s");
  t = advanceIdleNguState(t, 30, { bosses: 0 }, 1_089_000);
  t = advanceIdleNguState(t, 31, { bosses: 0 }, 1_120_000);
  assert.equal(t.challenge.troll.count, 1, "un troll toutes les 120 s au début");
  assert.equal(t.challenge.troll.last.big, false);
  assert.ok(t.challenge.troll.last.seq === 1);
  // 4 trolls de plus : le 5e est un gros troll
  for (let i = 0; i < 4; i++) { t = advanceIdleNguState(t, 60, { bosses: 0 }, 1_120_000 + (i + 1) * 120_000 - 60_000); t = advanceIdleNguState(t, 60, { bosses: 0 }, 1_120_000 + (i + 1) * 120_000); }
  assert.equal(t.challenge.troll.count, 5);
  assert.equal(t.challenge.troll.last.big, true, "un troll sur cinq est un gros troll");
  // plus tard dans le défi, l'intervalle raccourcit selon les complétions
  const d = fresh();
  d.challenge.completions.troll = 6;
  const dd = start(d, "troll", 1_000_000, 69);
  const r75 = advanceIdleNguState(advanceIdleNguState(dd, 40, { bosses: 0 }, 1_040_000), 36, { bosses: 0 }, 1_076_000);
  assert.equal(r75.challenge.troll.count, 1, "75 s à la 7e complétion");
}

// --- effets précis de chaque troll (lus dans le code par une exécution forcée) ---
{
  const src = readFileSync(new URL("../src/idle-ngu-progression.js", import.meta.url), "utf8");
  for (const phrase of ["removes half", "Removes half"]) void phrase;
  assert.match(src, /pair\.level = Math\.floor\(Math\.max\(0, num\(pair\.level, 0\)\) \/ 2\)/, "moitié des niveaux d'augmentations");
  assert.match(src, /sp\.numberBoost = 1/, "multiplicateur de Renaissance de Blood Magic remis à 1");
  assert.match(src, /divides boss multiplier for NUMBER by 2 \+ Troll Challenge completions/);
}

// --- Gros troll « diviseur de boss » : NUMBER divisé par 2 + complétions ---
{
  const base = fresh();
  base.challenge.completions.troll = 3;
  let a = start(base, "troll", 1_000_000, 69);
  const numAvant = advanceIdleNguState(a, 1, { bosses: 30 }, 1_001_000).rebirth.preview.currentBossFactor;
  a.challenge.troll.flags.bossDivider = true;
  const numApres = advanceIdleNguState(a, 1, { bosses: 30 }, 1_002_000).rebirth.preview.currentBossFactor;
  assert.ok(Math.abs(numAvant / numApres - 5) < 1e-6, "divisé par 2 + 3 complétions = 5 (obtenu " + numAvant / numApres + ")");
}

// --- Gros troll NGU / barbes / Wandoos : bonus coupés jusqu'au Rebirth ---
{
  let s = start(fresh(), "troll", 1_000_000, 69);
  s.challenge.troll.flags.ngu = true;
  const t = advanceIdleNguState(s, 1, { bosses: 30 }, 1_001_000);
  assert.equal(t.challenge.troll.flags.ngu, true);
  t.rebirth.canRebirth = true;
  const reborn = rebirthIdleNguState(t, { bosses: 30 }, 1_500_000).state ?? rebirthIdleNguState(t, { bosses: 30 }, 1_500_000);
  assert.equal(reborn.challenge.troll.flags.ngu, false, "les drapeaux tombent au Rebirth");
  assert.equal(reborn.challenge.active, "troll", "le défi continue");
}

// --- Anti-spoil : un défi verrouillé n'est jamais envoyé au client ---
{
  const s = normalizeIdleNguState({}, { bosses: 60 }, 1_000_000);
  s.systems.challenges.unlocked = true;
  s.records.highestBoss = 60;
  const defs = idleNguSnapshot(s, { bosses: 60 }, 1_000_000).challengeDefinitions;
  assert.ok(defs.length > 0);
  assert.ok(defs.every((d) => d.unlocked || d.active || d.completion > 0), "aucun défi verrouillé dans la liste");
  assert.ok(!defs.some((d) => d.id === "noAugmentations"), "No Augmentations (boss 75) invisible avant son déblocage");
  assert.ok(!defs.some((d) => d.id === "noRebirth"));
  assert.ok(defs.some((d) => d.id === "basic"));
}

// --- Textes français : chaque défi, chaque difficulté ---
{
  const code = readFileSync(new URL("../public/modules/challenges-v1.js", import.meta.url), "utf8");
  const sandbox = { window: {}, document: { getElementById() { return null; }, head: { appendChild() {} } }, requestAnimationFrame() {} };
  sandbox.window.window = sandbox.window;
  vm.runInNewContext(code, sandbox);
  const T = sandbox.window.__SOREAL_IDLE_DEFIS_V1__.textes;
  const ids = ["basic", "noAugmentations", "twentyFourHours", "hundredLevels", "noEquipment", "troll", "noRebirth", "laserSword", "blind", "noNgu", "noTimeMachine"];
  for (const id of ids) {
    const t = T.DEFIS[id];
    assert.ok(t, "texte manquant : " + id);
    assert.ok(t.nom && t.desc.normal && t.restriction, id + " : nom, description, restriction");
    for (const tier of ["normal", "difficile", "extreme"]) assert.ok(Array.isArray(t.recompenses[tier]), id + "/" + tier + " : récompenses");
  }
  assert.equal(T.DEFIS.troll.recompenses.normal.length, 7);
  assert.equal(T.DEFIS.troll.recompenses.difficile.length, 7);
  assert.equal(T.DEFIS.troll.recompenses.extreme.length, 7);
  assert.equal(Object.keys(T.TROLLS).length, 15, "9 petits trolls + 6 gros trolls");
  assert.equal(sandbox.window.__SOREAL_IDLE_DEFIS_V1__.traduire("DEFI_SANS_EQUIPEMENT").startsWith("🚫"), true);
  assert.equal(sandbox.window.__SOREAL_IDLE_DEFIS_V1__.traduire("autre chose"), "autre chose");
  // pas de récompense « surprise » révélée avant d'être obtenue : les lignes secrètes existent pour les systèmes cachés
  const secretes = T.DEFIS.troll.recompenses.normal.filter((r) => r.s).map((r) => r.q);
  assert.equal(JSON.stringify(secretes), "[3,4,5,6,7]");
}

console.log("idle-challenges-wiki-parity-v1: OK");

// Blind Challenge (audit 2026-10-01) : le wiki ne détaille pas ce qui disparaît à chacun des 10 niveaux -> aucune progression inventée dans le client.
{
  const src = readFileSync("cloudflare/public/modules/challenges-v1.js", "utf8");
  assert.ok(!src.includes("seuilsAveugle"), "plus de seuils de masquage par niveau inventés");
  assert.ok(src.includes("gets blinder"), "la source wiki et ses limites sont citées à côté du masque");
}

// Page Défis (2026-10-01) : chaque défi présente Objectif / Description / Restrictions / Conseil / Récompenses dans des cadres titrés, et le bandeau « En direct » ne joue qu'un passage.
{
  const src = readFileSync("cloudflare/public/modules/challenges-v1.js", "utf8");
  for (const titre of ["'Objectif'", "'Description'", "'Restrictions'", "'Conseil'", "'Récompenses'"]) assert.ok(src.includes(titre), "cadre " + titre);
  assert.ok(readFileSync("cloudflare/public/soreal-idle-themes.css", "utf8").includes(".dfi-cadre"));
  assert.ok(readFileSync("cloudflare/public/modules/flux-v1.js", "utf8").includes("const PASSAGES=1;"), "un seul passage dans le bandeau En direct");
}
