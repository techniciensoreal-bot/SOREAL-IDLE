/*
 * Affiche, pour des pages données, chaque nombre absent du code avec le texte qui l'entoure (triage manuel).
 * Usage : node design/wiki-number-context.mjs "Page A" "Page B" [--max=25]
 * Réutilise l'extraction de wiki-number-coverage.mjs (copie minimale pour rester autonome).
 */
import fs from "node:fs";
import path from "node:path";

const WIKI = process.env.NGU_WIKI_DIR || "C:/Users/n0rma/Documents/NGU-Wiki";
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const SUFFIX = { K: 1e3, M: 1e6, B: 1e9, T: 1e12, Qa: 1e15, Qi: 1e18, Sx: 1e21, Sp: 1e24, Oc: 1e27, No: 1e30, Dc: 1e33 };
const key = (v) => (Number.isFinite(v) ? v.toPrecision(9) : "nan");
function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full));
    else if (e.name.endsWith(".js")) out.push(full);
  }
  return out;
}
const codeValues = new Set();
for (const f of [...walk(path.join(ROOT, "cloudflare/src")), ...walk(path.join(ROOT, "cloudflare/public"))]) {
  const text = fs.readFileSync(f, "utf8");
  for (const m of text.matchAll(/(?<![\w.$])(\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?)(?![\w])/g)) { const v = Number(m[1].replace(/_/g, "")); if (v) codeValues.add(key(v)); }
  for (const m of text.matchAll(/\b\d{1,3}(?:,\d{3})+(?:\.\d+)?\b/g)) codeValues.add(key(Number(m[0].replace(/,/g, ""))));
}
const inCode = (v) => codeValues.has(key(v)) || codeValues.has(key(v / 100)) || codeValues.has(key(v * 100));

const args = process.argv.slice(2);
const max = Number((args.find((a) => a.startsWith("--max=")) || "--max=25").slice(6));
for (const title of args.filter((a) => !a.startsWith("--"))) {
  const f = path.join(WIKI, "pages", title.replace(/[<>:"/\\|?*]/g, "_") + ".json");
  const j = JSON.parse(fs.readFileSync(f, "utf8"));
  const text = (j.__expandedWikitext || "").replace(/<!--[\s\S]*?-->/g, " ").replace(/<[^>]+>/g, " ").replace(/\[\[(?:File|Category):[^\]]*\]\]/gi, " ").replace(/[ \t]+/g, " ");
  console.log("\n===== " + title);
  let shown = 0;
  const seen = new Set();
  const patterns = [
    [/(\d+(?:\.\d+)?)\s*[eE]\s*\+?(-?\d+)/g, (m) => Number(m[1] + "e" + m[2])],
    [/\b\d{1,3}(?:,\d{3})+(?:\.\d+)?\b/g, (m) => Number(m[0].replace(/,/g, ""))],
    [/\b(\d+(?:\.\d+)?)\s?(Dc|No|Oc|Sp|Sx|Qi|Qa|K|M|B|T)\b/g, (m) => Number(m[1]) * SUFFIX[m[2]]],
    [/(?<![\d,.])\d+\.\d+(?![\d.,]|\s?[eE][+-]?\d)/g, (m) => Number(m[0])],
    [/(?<![\d,.])\d{3,}(?![\d,.]|\s?[eE][+-]?\d)/g, (m) => { const v = Number(m[0]); return v >= 100 && !(v >= 2015 && v <= 2030) ? v : NaN; }]
  ];
  for (const [re, conv] of patterns) {
    for (const m of text.matchAll(re)) {
      const v = conv(m);
      if (!Number.isFinite(v) || v <= 0 || seen.has(key(v)) || inCode(v)) continue;
      seen.add(key(v));
      if (shown++ >= max) continue;
      const start = Math.max(0, m.index - 70);
      console.log("  " + m[0].padEnd(16) + " | ..." + text.slice(start, m.index).replace(/\s+/g, " ").slice(-70) + " [" + m[0] + "] " + text.slice(m.index + m[0].length, m.index + m[0].length + 40).replace(/\s+/g, " "));
    }
  }
  console.log("  (" + Math.max(0, shown - max) + " autres non affichés)");
}
