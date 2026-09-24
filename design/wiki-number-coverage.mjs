/*
 * Couverture NUMÉRIQUE du wiki local par le code de SOREAL IDLE (2026-09-24).
 *
 * Pour chaque page du miroir (C:\Users\n0rma\Documents\NGU-Wiki\pages, texte développé), extrait les nombres « distinctifs »
 * (exposants, milliers avec virgules, décimaux, entiers >= 100, suffixes K/M/B/T/Qa/Qi/Sx/Sp/Oc/No/Dc) et cherche si chacun apparaît
 * comme littéral numérique dans cloudflare/src et cloudflare/public (valeur identique, ou valeur/100 pour les pourcentages).
 *
 * Ce N'EST PAS une preuve d'implémentation : un nombre présent dans le code peut être mal utilisé, et un nombre absent peut être
 * calculé autrement ou sans objet. C'est un détecteur de trous : une page dont beaucoup de nombres n'existent nulle part dans le
 * code est une candidate à la relecture manuelle. Usage : node design/wiki-number-coverage.mjs > docs/WIKI-NUMBER-COVERAGE.md
 */
import fs from "node:fs";
import path from "node:path";

const WIKI = process.env.NGU_WIKI_DIR || "C:/Users/n0rma/Documents/NGU-Wiki";
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");

const SUFFIX = { K: 1e3, M: 1e6, B: 1e9, T: 1e12, Qa: 1e15, Qi: 1e18, Sx: 1e21, Sp: 1e24, Oc: 1e27, No: 1e30, Dc: 1e33 };

function walk(dir, exts) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full, exts));
    else if (exts.some((x) => e.name.endsWith(x))) out.push(full);
  }
  return out;
}

// --- Nombres présents dans le code ---
const codeValues = new Set();
const key = (v) => (Number.isFinite(v) ? v.toPrecision(9) : "nan");
const addCode = (v) => { if (Number.isFinite(v) && v !== 0) codeValues.add(key(v)); };
const codeFiles = [...walk(path.join(ROOT, "cloudflare/src"), [".js"]), ...walk(path.join(ROOT, "cloudflare/public"), [".js"])];
for (const f of codeFiles) {
  const text = fs.readFileSync(f, "utf8");
  for (const m of text.matchAll(/(?<![\w.$])(\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?)(?![\w])/g)) addCode(Number(m[1].replace(/_/g, "")));
  // nombres écrits avec séparateurs de milliers dans des chaînes/commentaires (« 25,000 »)
  for (const m of text.matchAll(/\b\d{1,3}(?:,\d{3})+(?:\.\d+)?\b/g)) addCode(Number(m[0].replace(/,/g, "")));
}
const inCode = (v) => codeValues.has(key(v)) || codeValues.has(key(v / 100)) || codeValues.has(key(v * 100));

// --- Nombres du wiki ---
function cleanText(t) {
  return String(t || "")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/\[\[(?:File|Image|Category):[^\]]*\]\]/gi, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/\b\d+\s*px\b/gi, " ")
    .replace(/style="[^"]*"/gi, " ")
    .replace(/(?:width|height|colspan|rowspan|cellpadding|cellspacing|border)\s*=\s*"?[\d%.]+"?/gi, " ")
    .replace(/&[a-z]+;/g, " ");
}
function extractNumbers(text) {
  const out = new Map();
  const add = (v, raw) => { if (Number.isFinite(v) && v > 0 && !out.has(key(v))) out.set(key(v), { v, raw }); };
  const t = cleanText(text);
  for (const m of t.matchAll(/(\d+(?:\.\d+)?)\s*[eE]\s*\+?(-?\d+)/g)) add(Number(m[1] + "e" + m[2]), m[0].trim());
  for (const m of t.matchAll(/\b\d{1,3}(?:,\d{3})+(?:\.\d+)?\b/g)) add(Number(m[0].replace(/,/g, "")), m[0]);
  for (const m of t.matchAll(/\b(\d+(?:\.\d+)?)\s?(Dc|No|Oc|Sp|Sx|Qi|Qa|K|M|B|T)\b/g)) add(Number(m[1]) * SUFFIX[m[2]], m[0]);
  for (const m of t.matchAll(/(?<![\d,.])\d+\.\d+(?![\d.,]|\s?[eE][+-]?\d)/g)) add(Number(m[0]), m[0]);
  for (const m of t.matchAll(/(?<![\d,.])\d{3,}(?![\d,.]|\s?[eE][+-]?\d)/g)) {
    const v = Number(m[0]);
    if (v >= 100 && !(v >= 2015 && v <= 2030)) add(v, m[0]);
  }
  return [...out.values()];
}

// --- Type de page ---
function pageType(title, raw, expanded = "") {
  if (/\{\{Item data|\{\{Item full|Infobox item/i.test(raw) || /^\W*\{\|.*Stats Max/.test(raw)) return "objet";
  if (/\(set\)$/i.test(title)) return "set";
  // Pages d'objets : PV = 3 x Power, régénération = 3 % de la toughness, maximum = base x (1 + niveau/100) sont CALCULÉS par le jeu
  // (audit d'objets séparé par script), donc ces nombres n'ont pas à exister comme littéraux.
  if (/Max stat at (?:lvl|max)/i.test(String(expanded))) return "objet";
  if (/\{\{Enemy/i.test(raw)) return "ennemi";
  if (/\{\{Infobox_Titan|\{\{Adventure Zone/i.test(raw)) return /Titan/i.test(raw) && !/Adventure Mode\]\] is|location in/i.test(raw) ? "titan/zone" : "zone";
  if (/^Build /i.test(title)) return "build";
  return "fonctionnalité/guide";
}

const pagesDir = path.join(WIKI, "pages");
const rows = [];
for (const f of fs.readdirSync(pagesDir)) {
  const title = f.replace(/\.json$/, "");
  const j = JSON.parse(fs.readFileSync(path.join(pagesDir, f), "utf8"));
  const p = Object.values(j.query.pages)[0];
  const raw = p.revisions?.[0]?.slots?.main?.["*"] || "";
  if (/^\s*#redirect/i.test(raw)) continue;
  const nums = extractNumbers(j.__expandedWikitext || raw);
  if (!nums.length) continue;
  const missing = nums.filter((n) => !inCode(n.v));
  rows.push({ title, type: pageType(title, raw, j.__expandedWikitext || ""), total: nums.length, found: nums.length - missing.length, missing });
}

const byType = {};
for (const r of rows) { const t = (byType[r.type] ||= { pages: 0, total: 0, found: 0 }); t.pages++; t.total += r.total; t.found += r.found; }

const out = [];
out.push("# Couverture numérique du wiki local par le code (généré)\n");
out.push("Généré par `design/wiki-number-coverage.mjs`. Un nombre « présent » existe comme littéral dans `cloudflare/src` ou `cloudflare/public` (valeur identique, ou valeur/100, valeur*100). **Détecteur de trous, pas une preuve** : voir l'en-tête du script.\n");
out.push(`Littéraux numériques distincts dans le code : ${codeValues.size}. Pages analysées : ${rows.length}.\n`);
out.push("## Par type de page\n");
out.push("| Type | Pages | Nombres distinctifs | Présents dans le code | Taux |\n|---|---:|---:|---:|---:|");
for (const [t, v] of Object.entries(byType).sort((a, b) => b[1].total - a[1].total)) out.push(`| ${t} | ${v.pages} | ${v.total} | ${v.found} | ${(100 * v.found / v.total).toFixed(1)} % |`);
const worst = rows.filter((r) => r.type === "fonctionnalité/guide" && r.missing.length >= 3).sort((a, b) => b.missing.length - a.missing.length);
out.push("\n## Pages fonctionnalité/guide avec le plus de nombres absents du code\n");
out.push("| Page | Nombres | Absents | Exemples d'absents |\n|---|---:|---:|---|");
for (const r of worst.slice(0, 60)) out.push(`| ${r.title} | ${r.total} | ${r.missing.length} | ${r.missing.slice(0, 8).map((n) => n.raw).join(" ; ").replace(/\|/g, "/")} |`);
out.push("\n## Autres types : pages avec absents\n");
out.push("| Page | Type | Nombres | Absents | Exemples |\n|---|---|---:|---:|---|");
const others = rows.filter((r) => r.type !== "fonctionnalité/guide" && r.missing.length >= 3).sort((a, b) => b.missing.length - a.missing.length);
for (const r of others.slice(0, 40)) out.push(`| ${r.title} | ${r.type} | ${r.total} | ${r.missing.length} | ${r.missing.slice(0, 6).map((n) => n.raw).join(" ; ").replace(/\|/g, "/")} |`);
console.log(out.join("\n"));
