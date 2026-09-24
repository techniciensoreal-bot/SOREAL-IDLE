/*
 * Compare le tableau « The Hacks » du wiki local (15 hacks) aux définitions du moteur : effet par niveau, bonus de palier, niveaux par palier,
 * diviseur de vitesse de base, niveau plafond dur, et bonus maximal recalculé avec la formule de la page.
 * Usage : node design/wiki-hacks-table-check.mjs [--fixtures]
 */
import fs from "node:fs";
import { IDLE_NGU_TRACKS, HACK_HARD_CAP_V1 } from "../cloudflare/src/idle-ngu-progression.js";

const WIKI = process.env.NGU_WIKI_DIR || "C:/Users/n0rma/Documents/NGU-Wiki";
const j = JSON.parse(fs.readFileSync(WIKI + "/pages/Hacks.json", "utf8"));
const text = (j.__expandedWikitext || "").replace(/<br\s*\/?>/gi, " ").replace(/\[\[[^\]|]*\|([^\]]*)\]\]/g, "$1").replace(/\[\[File:[^\]]*\]\]/g, "").replace(/<[^>]+>/g, " ");
const start = text.indexOf("==The Hacks==");
const block = text.slice(start, text.indexOf("\n|}", start));
const parts = block.split(/\n\|-\s*\n/).slice(1);

const NAME_TO_ID = {
  "attack/defense": "attackDefense", "adventure stats": "adventureStats", "time machine speed": "timeMachineSpeed", "drop chance": "dropChance",
  "augment speed": "augmentSpeed", "energy ngu speed": "energyNguSpeed", "magic ngu speed": "magicNguSpeed", "blood gain": "bloodGain",
  "qp gain": "qpGain", "daycare": "daycare", "exp": "exp", "number": "number", "pp": "pp", "hack hack": "hackHack", "hack": "hackHack", "wish": "wish"
};
const rows = [];
for (const p of parts) {
  const cells = p.split(/\n\|/).map((c) => c.replace(/^\|/, "").replace(/style="[^"]*"\s*\|?/g, "").replace(/\s+/g, " ").trim()).filter((c) => c !== "");
  if (cells.length < 7) continue;
  const [name, effect, milestone, levels, divider, cap, max] = cells;
  const lower = name.toLowerCase().trim();
  const id = NAME_TO_ID[lower] || NAME_TO_ID[lower.replace(/\s*hack$/, "").trim()];
  const m = levels.match(/^(\d+)\s*\(\s*(\d+)\s*\)$/);
  const div = divider.match(/\(([\d.]+)e(\d+)\)/i);
  rows.push({
    id, name,
    effect: Number(effect.replace("%", "")), milestone: Number(milestone.replace("%", "")),
    levels: m ? Number(m[1]) : Number(levels), reduced: m ? Number(m[2]) : null,
    divider: div ? Number(div[1] + "e" + div[2]) : NaN, cap: Number(cap.replace(/,/g, "")),
    max: Number(max.replace(/,/g, "").replace(/%/g, "").replace(/\*10\s*(\d+)\s*/, "e$1"))
  });
}
console.log("hacks lus :", rows.length);

const rel = (a, b) => Math.abs(a - b) / Math.max(Math.abs(b), 1e-300);
let ok = 0;
for (const r of rows) {
  const d = IDLE_NGU_TRACKS.hacks.find((x) => x.id === r.id);
  const problems = [];
  if (!d) problems.push("hack absent du moteur");
  else {
    if (d.effectPerLevelPct !== r.effect) problems.push(`effet/niveau ${d.effectPerLevelPct} contre ${r.effect}`);
    if (d.milestoneBonusPct !== r.milestone) problems.push(`bonus de palier ${d.milestoneBonusPct} contre ${r.milestone}`);
    if (d.levelsPerMilestone !== r.levels) problems.push(`niveaux/palier ${d.levelsPerMilestone} contre ${r.levels}`);
    if (rel(d.speedDivider, r.divider) > 1e-9) problems.push(`diviseur ${d.speedDivider} contre ${r.divider}`);
    if (HACK_HARD_CAP_V1[r.id] !== r.cap) problems.push(`niveau plafond ${HACK_HARD_CAP_V1[r.id]} contre ${r.cap}`);
    // Bonus maximal : (100 % + effet x niveau) x bonus de palier ^ nombre de paliers (niveaux par palier réduits par perks/quirks/souhaits).
    const per = r.reduced || r.levels;
    const milestones = Math.floor(r.cap / per);
    const value = (100 + r.effect * r.cap) * Math.pow(r.milestone / 100, milestones);
    if (Number.isFinite(r.max) && rel(value, r.max) > 5e-3) problems.push(`bonus maximal recalculé ${value.toExponential(4)} contre ${r.max.toExponential(4)}`);
  }
  if (problems.length) console.log(r.name + " : " + problems.join(" ; ")); else ok++;
}
console.log("conformes :", ok, "sur", rows.length);
if (process.argv.includes("--fixtures")) console.log(JSON.stringify(rows.map((r) => [r.id, r.effect, r.milestone, r.levels, r.reduced, r.divider, r.cap, r.max])));
