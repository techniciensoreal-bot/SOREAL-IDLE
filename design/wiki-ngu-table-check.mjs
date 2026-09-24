/*
 * Compare, cellule par cellule, les 6 tableaux NGU du wiki local (Normal / Evil / Sadistic, Energy / Magic) au catalogue du moteur
 * (cloudflare/src/idle-ngu-catalog-v1.js) : montant par niveau, soft cap, coût de base, valeur maximale au niveau 1e9.
 * Usage : node design/wiki-ngu-table-check.mjs [--fixtures]   (--fixtures imprime le tableau JS à coller dans le test)
 */
import fs from "node:fs";
import { nguParamsV1, nguEffectPctV1, IDLE_NGU_CATALOG_V1 } from "../cloudflare/src/idle-ngu-catalog-v1.js";

const WIKI = process.env.NGU_WIKI_DIR || "C:/Users/n0rma/Documents/NGU-Wiki";
const j = JSON.parse(fs.readFileSync(WIKI + "/pages/NGU.json", "utf8"));
const text = (j.__expandedWikitext || "").replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, " ");

const blocks = [...text.matchAll(/\{\|\s*class="article-table"([\s\S]*?)\n\|\}/g)].map((m) => m[1]);
const nguBlocks = blocks.filter((b) => /Soft Cap/i.test(b) && /Base cost/i.test(b));
console.log("tableaux NGU :", nguBlocks.length);

const NAME_TO_ID = Object.fromEntries(IDLE_NGU_CATALOG_V1.map((d) => [d.name.toLowerCase().replace(/\s+/g, " "), d.id]));
const ORDER = [["normal", "energy"], ["normal", "magic"], ["evil", "energy"], ["evil", "magic"], ["sadistic", "energy"], ["sadistic", "magic"]];

function num(s) {
  s = String(s || "").replace(/\s+/g, " ").trim();
  let m = s.match(/\(([\d.]+)\s*E\s*\+?(-?\d+)\)/i);
  if (m) return Number(m[1] + "e" + m[2]);
  m = s.match(/^([\d.,]+)\s*%?$/);
  if (m) return Number(m[1].replace(/,/g, ""));
  m = s.match(/^([\d.]+)\s*e\s*\+?(-?\d+)\s*%?$/i);
  if (m) return Number(m[1] + "e" + m[2]);
  return NaN;
}

const rows = [];
nguBlocks.forEach((b, ti) => {
  const [tier, resource] = ORDER[ti] || [];
  const parts = b.split(/\n\|-\s*\n/).slice(1);
  for (const part of parts) {
    const cells = part.split(/\n\|/).map((c) => c.replace(/^\|/, "").replace(/\s+/g, " ").trim());
    if (cells.length < 6) continue;
    const [name, , amount, soft, cost, , max] = cells;
    const id = NAME_TO_ID[name.toLowerCase()];
    rows.push({ tier, resource, name, id, amount, soft, cost, max });
  }
});
console.log("lignes :", rows.length);

const rel = (a, b) => Math.abs(a - b) / Math.max(Math.abs(b), 1e-300);
let ok = 0, bad = 0;
const fixtures = [];
for (const r of rows) {
  const p = r.id && nguParamsV1(r.tier, r.id);
  if (!p) { console.log("catalogue introuvable :", r.tier, r.name); bad++; continue; }
  const problems = [];
  const pct = Number((r.amount.match(/L\s*\*\s*([\d.]+)\s*%/) || [])[1]);
  if (Number.isFinite(pct) && rel(p.pct, pct) > 1e-9) problems.push(`montant ${p.pct} contre ${pct}`);
  const soft = /^-?$/.test(r.soft.replace(/-/, "").trim()) ? null : Number(r.soft.replace(/,/g, ""));
  if ((p.softCap ?? null) !== soft) problems.push(`soft cap ${p.softCap} contre ${soft}`);
  const cost = num(r.cost);
  if (Number.isFinite(cost) && rel(p.baseCost, cost) > 1e-9) problems.push(`coût ${p.baseCost} contre ${cost}`);
  const max = num(r.max);
  const mine = nguEffectPctV1(r.tier, r.id, 1e9);
  if (Number.isFinite(max) && rel(mine, max) > 2e-4) problems.push(`max ${mine} contre ${max}`);
  fixtures.push([r.tier, r.id, pct, soft, cost, max]);
  if (problems.length) { bad++; console.log(`${r.tier}/${r.name} : ${problems.join(" ; ")}`); } else ok++;
}
console.log("conformes :", ok, "| écarts :", bad);
if (process.argv.includes("--fixtures")) console.log(JSON.stringify(fixtures));
