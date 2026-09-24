#!/usr/bin/env node
/*
 * Comparaison des catalogues Perks / Quirks / Souhaits / Sellout au miroir wiki local (2026-09-24).
 * Usage : node design/compare-catalogs-to-wiki.mjs [dossierMiroir]
 * (le miroir n'est pas dans le dépôt : par défaut C:\Users\n0rma\Documents\NGU-Wiki)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(here, "../cloudflare/src");
const WIKI = process.argv[2] || "C:/Users/n0rma/Documents/NGU-Wiki";
const imp = (f) => import(pathToFileURL(path.join(SRC, f)).href);

function page(title) {
  return JSON.parse(fs.readFileSync(path.join(WIKI, "pages", title + ".json"), "utf8")).__expandedWikitext;
}

/* Tableaux `{| ... |}` -> lignes de cellules (texte brut). */
function tables(wikitext) {
  const out = [];
  for (const tbl of wikitext.split(/\n\{\|/).slice(1)) {
    const body = tbl.split(/\n\|\}/)[0];
    const rows = body.split(/\n\|-\s*/).slice(1);
    for (const row of rows) {
      const cells = [];
      for (const line of row.split("\n")) {
        if (line.startsWith("|") && !line.startsWith("|}")) cells.push(line.slice(1).trim());
        else if (cells.length && !line.startsWith("!")) cells[cells.length - 1] += "\n" + line;
      }
      if (cells.length) out.push(cells);
    }
  }
  return out;
}

const SUFFIX = { K: 1e3, M: 1e6, B: 1e9, T: 1e12, Qa: 1e15, Qi: 1e18, Sx: 1e21, Sp: 1e24, Oc: 1e27, No: 1e30 };
const num = (s) => {
  const t = String(s ?? "").replace(/,/g, "").trim();
  if (t === "") return NaN;
  const m = t.match(/^(-?[\d.]+(?:[eE][+-]?\d+)?)\s*([A-Za-z]{1,2})?/);
  if (!m) return NaN;
  return Number(m[1]) * (m[2] && SUFFIX[m[2]] ? SUFFIX[m[2]] : 1);
};
const clean = (s) => String(s ?? "")
  .replace(/<span[^>]*><\/span>/g, "").replace(/<\/?span[^>]*>/g, "")
  .replace(/\[\[File:[^\]]*\]\]/g, "").replace(/\[\[([^\]|]*\|)?([^\]]*)\]\]/g, "$2")
  .replace(/'''?/g, "").replace(/<br\s*\/?>/g, " ").replace(/\s+/g, " ").trim();
const nameKey = (s) => clean(s).replace(/[“”"]/g, "").replace(/\s+/g, " ").trim();
/* Jetons numériques d'un texte d'effet (nombres et pourcentages), pour comparer les magnitudes sans les tournures. */
const numTokens = (s) => (clean(s).replace(/,(\d{3})/g, "$1").match(/\d+(?:\.\d+)?%?/g) || []).sort().join(" ");


export async function compare() {
  const res = { perks: [], quirks: [], wishes: [], sellout: [] };
  const perks = await imp("idle-perks-v1.js");
  const quirks = await imp("idle-quirks-v1.js");
  const wishes = await imp("idle-wishes-v1.js");

  const perkRows = new Map();
  for (const c of tables(page("Perk Points"))) {
    if (c.length >= 6 && /^\d+$/.test(c[0])) perkRows.set(+c[0], c);
  }
  for (const [id, c] of perkRows) {
    const e = perks.IDLE_PERKS_CATALOG_V1.find((p) => p.id === id);
    if (!e) { res.perks.push(`wiki ${id} "${clean(c[2])}" absent du catalogue`); continue; }
    const wName = clean(c[2]), wEff = clean(c[3]), wCost = num(c[4]), wCap = num(c[5]);
    if (nameKey(c[2]) !== nameKey(e.name)) res.perks.push(`${id} nom : wiki "${wName}" / code "${e.name}"`);
    if (wCost !== e.cost) res.perks.push(`${id} ${e.name} coût : wiki ${c[4]} / code ${e.cost}`);
    if (wCap !== e.cap && !Array.isArray(e.fibonacciMilestones)) res.perks.push(`${id} ${e.name} cap : wiki ${c[5]} / code ${e.cap}`);
    if (numTokens(e.effect) !== numTokens(c[3])) res.perks.push(`${id} ${e.name} effet : wiki "${wEff.slice(0, 90)}" / code "${clean(e.effect).slice(0, 90)}"`);
  }
  for (const p of perks.IDLE_PERKS_CATALOG_V1) if (!perkRows.has(p.id)) res.perks.push(`code ${p.id} "${p.name}" absent du wiki`);

  const quirkRows = new Map();
  for (const c of tables(page("Quirk Points"))) {
    if (c.length >= 5 && /^\d+$/.test(c[0])) quirkRows.set(+c[0], c);
  }
  for (const [id, c] of quirkRows) {
    const e = quirks.IDLE_QUIRKS_CATALOG_V1.find((p) => p.id === id);
    if (!e) { res.quirks.push(`wiki ${id} "${clean(c[2])}" absent du catalogue`); continue; }
    const wName = clean(c[2]), wEff = clean(c[3]), wCost = num(c[4]), wCap = num(c[5]);
    if (nameKey(c[2]) !== nameKey(e.name)) res.quirks.push(`${id} nom : wiki "${wName}" / code "${e.name}"`);
    if (wCost !== e.cost) res.quirks.push(`${id} ${e.name} coût : wiki ${c[4]} / code ${e.cost}`);
    if (wCap !== e.cap) res.quirks.push(`${id} ${e.name} cap : wiki ${c[5]} / code ${e.cap}`);
    if (numTokens(e.effect) !== numTokens(c[3])) res.quirks.push(`${id} ${e.name} effet : wiki "${wEff.slice(0, 90)}" / code "${clean(e.effect).slice(0, 90)}"`);
  }
  for (const p of quirks.IDLE_QUIRKS_CATALOG_V1) if (!quirkRows.has(p.id)) res.quirks.push(`code ${p.id} "${p.name}" absent du wiki`);

  const wishRows = new Map();
  for (const c of tables(page("Wishes"))) {
    if (c.length >= 5 && /^\d+$/.test(c[0])) wishRows.set(+c[0], c);
  }
  res.wishesRowCount = wishRows.size;
  for (const [id, c] of wishRows) {
    const e = wishes.IDLE_WISHES_CATALOG_V1.find((p) => p.id === id);
    if (!e) { res.wishes.push(`wiki ${id} "${clean(c[2])}" absent du catalogue`); continue; }
    res.wishesSample = res.wishesSample || c;
    const wName = clean(c[2]);
    if (nameKey(c[2]) !== nameKey(e.name)) res.wishes.push(`${id} nom : wiki "${wName}" / code "${e.name}"`);
    if (numTokens(e.effect) !== numTokens(c[3])) res.wishes.push(`${id} ${e.name} effet : wiki "${clean(c[3]).slice(0, 90)}" / code "${clean(e.effect).slice(0, 90)}"`);
    res.wishCells = res.wishCells || c.length;
    // colonnes : Index, Icon, Name, Effect, Levels, Speed divider (suffixe + valeur exacte entre parenthèses)
    const lv = num(c[4]);
    if (Number.isFinite(lv) && lv !== e.levels) res.wishes.push(`${id} ${e.name} niveaux : wiki ${c[4]} / code ${e.levels}`);
    const dv = String(c[5] ?? "").match(/\(([\d.]+E[+-]?\d+)\)/i) || String(c[5] ?? "").match(/([\d.]+E[+-]?\d+)/i);
    if (dv && Math.abs(Number(dv[1]) - e.speedDivider) > 1e-9 * Number(dv[1])) res.wishes.push(`${id} ${e.name} diviseur : wiki ${c[5]} / code ${e.speedDivider}`);
  }
  for (const p of wishes.IDLE_WISHES_CATALOG_V1) if (!wishRows.has(p.id)) res.wishes.push(`code ${p.id} "${p.name}" absent du wiki`);

  return res;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const r = await compare();
  for (const k of ["perks", "quirks", "wishes"]) {
    console.log(`\n== ${k} : ${r[k].length} écarts ==`);
    for (const l of r[k]) console.log("  " + l);
  }
  console.log("\nwishes rows:", r.wishesRowCount, "cells:", r.wishCells, JSON.stringify(r.wishesSample));
}
