import { readFileSync, statSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { analyzeEsm } from "./_esm-scan.mjs";
import { finFonction } from "./_js-scan.mjs";

/*
 * Les gros fichiers du moteur (cloudflare/src) sont découpés en segments voisins (idle-runtime-*.js, …). Les tests qui vérifient le CODE d'un de ces fichiers lisent
 * lireSrc("<fichier d'origine>") : le texte du fichier d'origine RECONSTITUÉ (même ordre que l'original, fixé par _src-ordre-<fichier>.json ; code ajouté depuis à la
 * suite), avec les exports d'origine, les variables « let » d'origine (converties en objet de contexte dans le code réel) et sans les importations entre segments.
 * Les assertions décrivent donc la logique, pas le découpage. Pour isoler une fonction dans un nouveau test : extraireFonctionSrc.
 */
const DOSSIER_SRC = new URL("../src/", import.meta.url);
const CONFIG = JSON.parse(readFileSync(new URL("./_src-segments.json", import.meta.url), "utf8"));

function cle(A, s) {
  if (s.kind === "function") return "F:" + s.names[0];
  if (s.kind === "class") return "C:" + s.names[0];
  if (s.kind === "var") return "V:" + s.names.join(",");
  return "S:" + A.src.slice(s.s, s.s + 80).replace(/\s+/g, " ");
}
function construire(base) {
  const cfg = CONFIG[base];
  const manifeste = JSON.parse(readFileSync(new URL("./_src-ordre-" + base.replace(/\.js$/, "") + ".json", import.meta.url), "utf8"));
  const parCle = new Map(manifeste.items.map((m) => [m.k, m]));
  const fichiers = [base, ...cfg.segments];
  const table = new Map(); const imports = []; const restes = []; const occ = new Map();
  for (const f of fichiers) {
    const A = analyseFichier(f);
    for (const s of A.stmts) {
      if (s.kind === "reexport") continue;
      if (s.kind === "import") {
        if (f !== base) continue;
        const texte = A.src.slice(s.startOff, s.endOff);
        if (!new RegExp("from \"\\./(" + cfg.segments.map((x) => x.replace(/\./g, "\\.")).join("|") + ")\"").test(texte)) imports.push(texte);
        continue;
      }
      if (s.kind === "var" && s.names.includes(cfg.ctx)) continue;
      let k = cle(A, s);
      if (s.kind === "stmt") { const n = (occ.get(k) || 0) + 1; occ.set(k, n); if (n > 1) k += "#" + n; }
      let texte = A.src.slice(s.startOff, s.endOff);
      const m = parCle.get(k);
      if (s.exported && m && !m.e) { const pos = s.s - s.startOff; if (texte.slice(pos, pos + 7) === "export ") texte = texte.slice(0, pos) + texte.slice(pos + 7); }
      if (table.has(k)) { restes.push(texte); continue; }
      table.set(k, texte.endsWith("\n") ? texte : texte + "\n");
    }
  }
  const sorties = []; const vus = new Set();
  for (const m of manifeste.items) {
    if (m.let) { sorties.push(m.let.endsWith("\n") ? m.let : m.let + "\n"); continue; }
    if (table.has(m.k)) { sorties.push(table.get(m.k)); vus.add(m.k); }
  }
  for (const [k, t] of table) if (!vus.has(k)) sorties.push(t);
  let texte = imports.join("") + "\n" + sorties.join("\n");
  texte = texte.replace(new RegExp("(?<![A-Za-z0-9_$.])" + cfg.ctx + "\\.([A-Za-z0-9_$]+)", "g"), "$1");
  return texte;
}
const memoAnalyse = new Map();
function analyseFichier(f) {
  if (!memoAnalyse.has(f)) memoAnalyse.set(f, analyzeEsm(new URL(f, DOSSIER_SRC).pathname.replace(/^\/([A-Za-z]:)/, "$1")));
  return memoAnalyse.get(f);
}
export function lireSrc(base) {
  if (!CONFIG[base]) return readFileSync(new URL(base, DOSSIER_SRC), "utf8");
  const fichiers = [base, ...CONFIG[base].segments];
  const h = createHash("sha1");
  for (const f of [...fichiers, "../tests/_src-sources.mjs", "../tests/_esm-scan.mjs", "../tests/_js-scan.mjs", "../tests/_src-segments.json", "../tests/_src-ordre-" + base.replace(/\.js$/, "") + ".json"]) { const u = new URL(f, DOSSIER_SRC); const st = statSync(u); h.update(f + ":" + st.mtimeMs + ":" + st.size + ";"); }
  const cache = join(tmpdir(), "soreal-idle-src-virtuel-" + h.digest("hex").slice(0, 16) + ".js");
  if (existsSync(cache)) return readFileSync(cache, "utf8");
  const texte = construire(base);
  try { writeFileSync(cache, texte); } catch (_) { /* cache facultatif */ }
  return texte;
}
/* Texte complet de la fonction « function nom(...){...} » dans le texte reconstitué. */
export function extraireFonctionSrc(texte, nom) {
  const re = new RegExp("(?:^|\\n)[ \\t]*(?:export )?(?:async )?function " + nom.replace(/\$/g, "\\$") + "\\(", "g");
  let m;
  while ((m = re.exec(texte))) {
    const debut = m.index + (texte[m.index] === "\n" ? 1 : 0);
    const fin = finFonction(texte, debut);
    if (fin > 0) return texte.slice(debut, fin);
  }
  throw new Error("fonction introuvable : " + nom);
}
