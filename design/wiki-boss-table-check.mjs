/*
 * Compare la table « Boss Fights » du wiki local (Attack / Defense / HP de chaque boss) aux valeurs du moteur
 * (nguBossStatsV1, cloudflare/src/idle-ngu-boss-reference-v1.js). Analyse manuelle, hors CI (dépend du miroir wiki).
 * Usage : node design/wiki-boss-table-check.mjs
 */
import fs from "node:fs";
import { nguBossStatsV1 } from "../cloudflare/src/idle-ngu-boss-reference-v1.js";

const WIKI = process.env.NGU_WIKI_DIR || "C:/Users/n0rma/Documents/NGU-Wiki";
const j = JSON.parse(fs.readFileSync(WIKI + "/pages/Boss Fights.json", "utf8"));
const text = j.__expandedWikitext || "";

const WORDS = { Thousand: 1e3, Million: 1e6, Billion: 1e9, Trillion: 1e12, Quadrillion: 1e15, Quintillion: 1e18, Sextillion: 1e21, Septillion: 1e24, Octillion: 1e27, Nonillion: 1e30, Decillion: 1e33, Undecillion: 1e36, Duodecillion: 1e39, Tredecillion: 1e42, Quattuordecillion: 1e45, Quindecillion: 1e48, Sexdecillion: 1e51, Septendecillion: 1e54, Octodecillion: 1e57, Novemdecillion: 1e60, Vigintillion: 1e63 };
const ABBR = { K: 1e3, M: 1e6, B: 1e9, T: 1e12, Qa: 1e15, Qi: 1e18, Sx: 1e21, Sp: 1e24, Oc: 1e27, No: 1e30, Dc: 1e33 };

function parseValue(raw) {
  let s = raw.replace(/<sup>\s*E\s*<\/sup>/gi, "E").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  let m = s.match(/^([\d.,]+)\s*E\s*\+?(-?\d+)$/i);
  if (m) return Number(m[1].replace(/,/g, "") + "e" + m[2]);
  m = s.match(/\(([\d.]+)E\+?(-?\d+)\)/i); // « 4.062 B (4.062E+09) »
  if (m) return Number(m[1] + "e" + m[2]);
  m = s.match(/^([\d.,]+)\s*([A-Za-z]+)$/);
  if (m) {
    const unit = WORDS[m[2]] ?? ABBR[m[2]];
    if (unit) return Number(m[1].replace(/,/g, "")) * unit;
  }
  m = s.match(/^[\d.,]+$/);
  if (m) return Number(s.replace(/,/g, ""));
  return NaN;
}

const rows = new Map();
const re = /<span id="(\d+)">\d+<\/span>\s*\n\|([^\n]*)/g;
let m;
while ((m = re.exec(text))) {
  const n = Number(m[1]);
  const parts = m[2].split(/<br\s*\/?>/i).map((x) => x.trim()).filter(Boolean);
  if (parts.length < 3) continue;
  rows.set(n, parts.slice(0, 3).map(parseValue));
}
// première ligne de tableau (boss 1..) : format « 50,000 40,000 500,000 » sur une seule ligne
console.log("boss lus dans le wiki :", rows.size);

const rel = (a, b) => Math.abs(a - b) / Math.max(Math.abs(b), 1e-300);
let compared = 0, diffs = 0, unparsed = 0;
const lines = [];
for (const [n, [a, d, h]] of [...rows].sort((x, y) => x[0] - y[0])) {
  if (![a, d, h].every(Number.isFinite)) { unparsed++; continue; }
  const ref = nguBossStatsV1(n - 1, "normal");
  compared++;
  const bad = rel(ref.attaque, a) > 0.005 || rel(ref.defense, d) > 0.005 || rel(ref.pv, h) > 0.005;
  if (bad) {
    diffs++;
    lines.push(`boss ${n}: wiki A${a.toExponential(3)} D${d.toExponential(3)} HP${h.toExponential(3)} | code A${ref.attaque.toExponential(3)} D${ref.defense.toExponential(3)} HP${ref.pv.toExponential(3)}`);
  }
}
console.log("comparés", compared, "| écarts", diffs, "| illisibles", unparsed);
console.log(lines.join("\n"));
