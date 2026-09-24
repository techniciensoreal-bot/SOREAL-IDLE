/*
 * Audit « code -> wiki » (2026-09-24, demande de Norman : comparer tous les chiffres de SOREAL IDLE au wiki pour retirer les faux
 * chiffres de l'ancienne version). Sens inverse de wiki-number-coverage.mjs (wiki -> code).
 *
 *   node design/code-number-audit.mjs [chemin-du-miroir-wiki] > sortie.json
 *
 * Pour chaque fichier de cloudflare/src : extrait les littéraux numériques du CODE (commentaires et chaînes retirés) et vérifie que
 * chacun apparaît dans le miroir local du wiki (pages, templates, extra, external), à 4 chiffres significatifs près (le wiki abrège :
 * « 1.5 M », « 4.062E+09 »). Ne prouve rien à lui seul : un chiffre présent dans le wiki peut être mal employé (voir les tests
 * idle-wiki-table-*) ; un chiffre absent n'est pas forcément faux (constante technique, unité, index) — c'est une liste de
 * candidats à examiner.
 */
import fs from "node:fs";
import path from "node:path";

const WIKI = process.argv[2] || "C:/Users/n0rma/Documents/NGU-Wiki";
const SRC = "cloudflare/src";

/* ---------- corpus wiki ---------- */
const UNITS = { k: 1e3, m: 1e6, b: 1e9, t: 1e12, qa: 1e15, qi: 1e18, sx: 1e21, sp: 1e24, oc: 1e27, no: 1e30, dc: 1e33,
  thousand: 1e3, million: 1e6, billion: 1e9, trillion: 1e12, quadrillion: 1e15, quintillion: 1e18, sextillion: 1e21, septillion: 1e24, octillion: 1e27, nonillion: 1e30, decillion: 1e33,
  quad: 1e15, quin: 1e18, sext: 1e21, sept: 1e24, oct: 1e27, non: 1e30 };
const cle = (v) => {
  if (!Number.isFinite(v) || v === 0) return "0";
  return Number(v).toPrecision(4);
};
const corpus = new Set();
function ajouterTexte(t) {
  for (const m of t.matchAll(/(\d[\d,]*(?:\.\d+)?(?:[eE][+-]?\d+)?)(?:\s*(%|[A-Za-z]{1,12}))?/g)) {
    const brut = m[1].replace(/,/g, "");
    const v = Number(brut);
    if (!Number.isFinite(v)) continue;
    corpus.add(cle(v));
    const u = m[2] && UNITS[m[2].toLowerCase()];
    if (u) corpus.add(cle(v * u));
    if (m[2] === "%") { corpus.add(cle(v / 100)); corpus.add(cle(1 + v / 100)); }
  }
}
function lireDossier(dir) {
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) { if (f.name !== "images") lireDossier(p); continue; }
    if (!/\.(json|txt|md|wikitext)$/i.test(f.name)) continue;
    let contenu = fs.readFileSync(p, "utf8");
    try {
      const j = JSON.parse(contenu);
      const pages = j && j.query && j.query.pages;
      if (pages) { for (const pg of Object.values(pages)) for (const r of pg.revisions || []) ajouterTexte(String(r.slots?.main?.["*"] || "")); continue; }
    } catch (_) { /* pas du JSON de page : texte brut */ }
    ajouterTexte(contenu);
  }
}
for (const d of ["pages", "templates", "extra", "external"]) lireDossier(path.join(WIKI, d));

/* ---------- littéraux du code ---------- */
function retirerCommentairesEtChaines(src) {
  let out = "";
  let i = 0;
  while (i < src.length) {
    const c = src[i], n = src[i + 1];
    if (c === "/" && n === "*") { const j = src.indexOf("*/", i + 2); const bloc = src.slice(i, j < 0 ? src.length : j + 2); out += bloc.replace(/[^\n]/g, " "); i += bloc.length; continue; }
    if (c === "/" && n === "/") { const j = src.indexOf("\n", i); const fin = j < 0 ? src.length : j; out += " ".repeat(fin - i); i = fin; continue; }
    if (c === "'" || c === '"' || c === "`") {
      let j = i + 1;
      while (j < src.length && src[j] !== c) { if (src[j] === "\\") j += 1; j += 1; }
      out += c + src.slice(i + 1, j).replace(/[^\n]/g, " ") + c; i = j + 1; continue;
    }
    out += c; i += 1;
  }
  return out;
}
const TRIVIAL = new Set(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "12", "16", "24", "30", "50", "60", "100", "1000", "0.5", "0.1", "0.01", "0.001", "1000", "3600", "86400", "255", "1e-9", "1e-12", "0.999"]);
function litteraux(codeNet) {
  const res = [];
  const lignes = codeNet.split("\n");
  lignes.forEach((ligne, idx) => {
    for (const m of ligne.matchAll(/(?<![\w.$])(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|\.\d+)(?![\w])/g)) {
      const txt = m[1];
      const v = Number(txt);
      if (!Number.isFinite(v)) continue;
      if (TRIVIAL.has(String(v)) || Number.isInteger(v) && Math.abs(v) < 13) continue;
      res.push({ ligne: idx + 1, texte: txt, valeur: v, contexte: ligne.trim().slice(0, 140) });
    }
  });
  return res;
}

const sortie = { corpus: corpus.size, fichiers: {} };
for (const f of fs.readdirSync(SRC).filter((x) => x.endsWith(".js")).sort()) {
  const brut = fs.readFileSync(path.join(SRC, f), "utf8");
  const net = retirerCommentairesEtChaines(brut);
  const tous = litteraux(net);
  const absents = tous.filter((l) => !corpus.has(cle(l.valeur)));
  sortie.fichiers[f] = { litteraux: tous.length, absents: absents.length, liste: absents };
}
console.log(JSON.stringify(sortie));
