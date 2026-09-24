/*
 * Compare le tableau des zones de la page « Adventure Mode » du wiki local (boss de déblocage, Manual P/T, Idle P/T, One Hit P) aux zones du moteur
 * (IDLE_ADVENTURE_ZONES : boss, p, t, idleP, idleT, oneHitP). Usage : node design/wiki-zones-table-check.mjs [--fixtures]
 */
import fs from "node:fs";
import { IDLE_ADVENTURE_ZONES } from "../cloudflare/src/idle-adventure-v47.js";

const WIKI = process.env.NGU_WIKI_DIR || "C:/Users/n0rma/Documents/NGU-Wiki";
const j = JSON.parse(fs.readFileSync(WIKI + "/pages/Adventure Mode.json", "utf8"));
const raw = j.__expandedWikitext || "";
const clean = raw.replace(/<span[^>]*>([^<]*)<\/span>/g, "$1").replace(/<h3>[^<]*<\/h3>/g, "").replace(/'''/g, "");

const SUFFIX = { k: 1e3, K: 1e3, M: 1e6, B: 1e9, T: 1e12, Qa: 1e15, Qi: 1e18, Sx: 1e21, Sp: 1e24, Oc: 1e27, No: 1e30, Dc: 1e33 };
function value(s) {
  s = String(s).replace(/,/g, "").trim();
  let m = s.match(/^([\d.]+)\s*[eE]\s*\+?(-?\d+)$/);
  if (m) return Number(m[1] + "e" + m[2]);
  m = s.match(/^([\d.]+)\s*([A-Za-z]{1,2})$/);
  if (m && SUFFIX[m[2]]) return Number(m[1]) * SUFFIX[m[2]];
  m = s.match(/^[\d.]+$/);
  return m ? Number(s) : NaN;
}
// « 1.3 M / 550k<br />(1.3E6 / 550,000) » : préférer les valeurs exactes entre parenthèses.
function pair(text) {
  const exact = text.match(/\(([^)]*\/[^)]*)\)/);
  const src = (exact ? exact[1] : text).split("/").map((x) => x.trim());
  return src.slice(0, 2).map(value);
}

const rows = clean.split(/\n\|-\s*\n/).map((r) => r.trim());
const norm = (x) => x.toLowerCase().replace(/[^a-z0-9]/g, "");
const ALIAS = { tutorialzone: "tutorial", sewers: "sewers", forest: "forest", caveofmanythings: "cave", thesky: "sky", highsecuritybase: "hsb", clockdimension: "clock", the2duniverse: "2d", ancientbattlefield: "ancient", averystrangeplace: "avsp", megalands: "mega", theaetherealseapart1: "aethereansea", theaetherealsea: "aethereansea" };
const zonesByName = new Map(IDLE_ADVENTURE_ZONES.map((z) => [norm(z.name), z]));
for (const [alias, id] of Object.entries(ALIAS)) zonesByName.set(alias, IDLE_ADVENTURE_ZONES.find((z) => z.id === id));
const parsed = [];
for (const row of rows) {
  // Deux formats de ligne : « |style="text-align: center;"|125 » (zones anciennes) ou « |150 » seul (zones récentes, avec Beast Mode OFF / ON).
  const m = row.match(/^\|[^\n]*?\[\[([^\]|]+)(?:\|[^\]]*)?\]\][^\n]*\n\|\s*style="text-align: center;"\|\s*(\d+)/) || row.match(/^\|\s*\d+\.\s*\[\[([^\]|]+)(?:\|[^\]]*)?\]\][^\n]*\n\|\s*(\d+)\s*\n/);
  if (!m) continue;
  const name = m[1];
  const boss = Number(m[2]);
  const block = row.slice(m[0].length).split("\n|")[0];
  const manual = block.match(/Manual P\/T\s*<br\s*\/>([^\n]*(?:\n[^\n]*)?)/);
  const idle = block.match(/Idle P\/T\s*(?:Beast Mode OFF:)?\s*<br\s*\/>([^\n]*(?:\n[^\n]*)?)/);
  const one = block.match(/One Hit P\s*<br\s*\/>\s*([^\n]*)/);
  parsed.push({ name, boss, manual: manual ? pair(manual[1].replace(/<br\s*\/?>/g, " ")) : null, idle: idle ? pair(idle[1].replace(/<br\s*\/?>/g, " ")) : null, one: one ? (() => { const e = one[1].match(/\(([\d.]+E\+?\d+)\)/i); return e ? value(e[1]) : value(one[1].split(" ")[0] + (one[1].split(" ")[1] ? " " + one[1].split(" ")[1] : "")); })() : null });
}
console.log("zones lues dans le wiki :", parsed.length);

const rel = (a, b) => Math.abs(a - b) / Math.max(Math.abs(b), 1e-300);
let ok = 0, missing = 0;
const fixtures = [];
for (const p of parsed) {
  const z = zonesByName.get(norm(p.name));
  if (!z) { missing++; console.log("zone du wiki sans équivalent dans le moteur (titan ou nom différent) :", p.name); continue; }
  const problems = [];
  if (z.boss !== p.boss) problems.push(`boss ${z.boss} contre ${p.boss}`);
  if (p.manual && p.manual.every(Number.isFinite)) { if (rel(z.p, p.manual[0]) > 0.02 || rel(z.t, p.manual[1]) > 0.02) problems.push(`manuel ${z.p}/${z.t} contre ${p.manual.join("/")}`); }
  if (p.idle && p.idle.every(Number.isFinite) && z.idleP != null) { if (rel(z.idleP, p.idle[0]) > 0.02 || rel(z.idleT, p.idle[1]) > 0.02) problems.push(`idle ${z.idleP}/${z.idleT} contre ${p.idle.join("/")}`); }
  if (Number.isFinite(p.one) && z.oneHitP != null && rel(z.oneHitP, p.one) > 0.02) problems.push(`one-hit ${z.oneHitP} contre ${p.one}`);
  fixtures.push([z.id, p.boss, p.manual, p.idle, Number.isFinite(p.one) ? p.one : null]);
  if (problems.length) console.log(z.id + " : " + problems.join(" ; ")); else ok++;
}
const compared = new Set(fixtures.map((f) => f[0]));
console.log("zones du moteur NON lues dans le tableau du wiki :", IDLE_ADVENTURE_ZONES.filter((z) => !compared.has(z.id)).map((z) => z.id).join(", "));
console.log("conformes :", ok, "| écarts :", parsed.length - ok - missing, "| sans équivalent :", missing);
if (process.argv.includes("--fixtures")) console.log(JSON.stringify(fixtures));
