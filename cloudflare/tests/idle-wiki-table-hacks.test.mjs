import assert from "node:assert/strict";
import { IDLE_NGU_TRACKS, HACK_HARD_CAP_V1 } from "../src/idle-ngu-progression.js";

/*
 * Wiki, page « Hacks », tableau « The Hacks » (2026-09-24), 15 hacks : effet par niveau (%), bonus de palier (%), niveaux par palier (et, entre
 * parenthèses, la valeur réduite par perks / quirks / souhaits), diviseur de vitesse de base, niveau plafond dur et bonus maximal (%).
 * Valeurs recopiées du wiki (fixtures, générées par design/wiki-hacks-table-check.mjs) ; le moteur est lu via IDLE_NGU_TRACKS.hacks et HACK_HARD_CAP_V1.
 * Formule de la page : bonus total = (100 % + effet par niveau x niveau) x bonus de palier ^ nombre de paliers atteints ; le bonus maximal du wiki
 * est calculé avec les niveaux par palier RÉDUITS.
 * Ligne : [id, effet/niveau, bonus de palier, niveaux/palier, niveaux/palier réduits, diviseur, niveau plafond, bonus maximal en %].
 */
const WIKI_ROWS = [
  ["attackDefense",2.5,102.5,10,8,100000000,7720,432800000000000],
  ["adventureStats",0.1,102,50,45,200000000,7632,24521.13],
  ["timeMachineSpeed",0.2,102,50,45,400000000,7544,43926.92],
  ["dropChance",0.25,103,40,36,400000000,7544,957104.2],
  ["augmentSpeed",0.2,101,20,18,800000000,7456,97897.93],
  ["energyNguSpeed",0.1,101.5,30,27,2000000000,7340,47148.02],
  ["magicNguSpeed",0.1,101.5,30,27,2000000000,7340,47148.02],
  ["bloodGain",0.1,104,50,45,4000000000,7252,455960.1],
  ["qpGain",0.05,100.8,50,45,8000000000,7164,1626.596],
  ["daycare",0.02,100.5,45,40,20000000000,7048,579.658],
  ["exp",0.025,101,75,70,40000000000,6960,733.7812],
  ["number",5,104,40,35,80000000000,6873,75150000],
  ["pp",0.05,100.5,25,22,200000000000,6757,2024.447],
  ["hackHack",0.05,110,100,90,200000000000,6757,556899.4],
  ["wish",0.01,100.5,50,45,10000000000000,6262,325.2794]
];

assert.equal(WIKI_ROWS.length, 15, "15 hacks");
assert.equal(IDLE_NGU_TRACKS.hacks.length, 15);
const rel = (a, b) => Math.abs(a - b) / Math.max(Math.abs(b), 1e-300);
for (const [id, effect, milestone, levels, reduced, divider, cap, maxPct] of WIKI_ROWS) {
  const d = IDLE_NGU_TRACKS.hacks.find((x) => x.id === id);
  assert.ok(d, id + " absent du moteur");
  assert.equal(d.effectPerLevelPct, effect, id + " effet par niveau");
  assert.equal(d.milestoneBonusPct, milestone, id + " bonus de palier");
  assert.equal(d.levelsPerMilestone, levels, id + " niveaux par palier");
  assert.ok(rel(d.speedDivider, divider) < 1e-9, id + " diviseur de vitesse");
  assert.equal(HACK_HARD_CAP_V1[id], cap, id + " niveau plafond dur");
  const milestones = Math.floor(cap / (reduced || levels));
  const value = (100 + effect * cap) * Math.pow(milestone / 100, milestones);
  assert.ok(rel(value, maxPct) < 5e-3, id + " bonus maximal : " + value + " contre " + maxPct);
}

console.log("idle-wiki-table-hacks: OK");
