import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { decouper, finFonction, finInstruction, defragmenter } from "./_js-scan.mjs";

/*
 * soreal-idle-ui.js est découpé en modules (modules/ui-*-v1.js et modules/page-*-v1.js, découpage du monolithe, 2026-10-16). Les tests qui vérifient le CODE
 * du frontend lisent ce que renvoie lireUiComplet() : le monolithe d'origine RECONSTITUÉ (chaque fonction, variable et instruction, dans l'ordre d'origine
 * fixé par _ui-ordre-origine.json ; ce que le manifeste ne connaît pas — code ajouté depuis — vient à la suite). Les cales du registre sont retirées et
 * les variables partagées, écrites REG.nom dans les modules, reprennent leur forme d'origine. Les assertions décrivent donc la logique, pas la plomberie.
 * Pour isoler une fonction dans un nouveau test : extraireFonction / extraireDeclaration.
 */
const DOSSIER = new URL("../public/modules/", import.meta.url);
const FICHIER_UI = new URL("../public/soreal-idle-ui.js", import.meta.url);
export const UI_MODULES = readdirSync(DOSSIER).filter((f) => /^(ui|page)-.*-v1\.js$/.test(f)).sort();
const CALE = /^\s*(?:\/\*[\s\S]*?\*\/\s*)*function [A-Za-z0-9_$]+\(\)\{return (?:window\.__SOREAL_IDLE_[A-Z0-9_]+__|UI_PARTAGE_V1|REG)\.[A-Za-z0-9_$]+\.apply\(null,arguments\);?\}\s*$/;
const PLOMBERIE_MODULE = /^\s*(?:\/\*[\s\S]*?\*\/\s*)*(?:'use strict';|const REG=|if\(REG\.__charg|REG\.__charg|Object\.assign\(REG,|Object\.assign\(window\.__SOREAL_IDLE_REG__|if\(window\.__SOREAL_IDLE_[A-Z0-9_]+__\)return;|window\.__SOREAL_IDLE_[A-Z0-9_]+_V1__=\{)/;
const PLOMBERIE_UI = /^\s*(?:\/\*[\s\S]*?\*\/\s*)*(?:Object\.assign\(UI_PARTAGE_V1,|Object\.defineProperty\(UI_PARTAGE_V1,|window\.__SOREAL_IDLE_UI_PARTAGE_V1__=|UI_PARTAGE_V1\.__amorcer_\d+\(\);)/;

export function sansRegistre(texte) {
  return texte.replace(/(?<![A-Za-z0-9_$.])REG\.([A-Za-z0-9_$]+)/g, "$1");
}
function cleItem(src, it) {
  if (it.kind === "function") return "F:" + it.names[0];
  if (it.kind === "var") return "V:" + it.names.join(",");
  return "S:" + src.slice(it.s, it.s + 80).replace(/\s+/g, " ");
}
function construire() {
  const manifeste = JSON.parse(readFileSync(new URL("./_ui-ordre-origine.json", import.meta.url), "utf8"));
  const lire = (u) => readFileSync(u, "utf8").replace(/\r\n/g, "\n");
  const baseSrc = lire(FICHIER_UI);
  const base = decouper(baseSrc);
  const table = new Map(); const restes = []; const occ = new Map();
  const ajouter = (src, it, deModule) => {
    const texte = src.slice(it.debut, it.fin);
    if (it.kind === "function" && CALE.test(texte)) return;
    if (it.kind === "var" && it.names.includes("UI_PARTAGE_V1")) return;
    if (it.kind === "stmt" && (deModule ? PLOMBERIE_MODULE : PLOMBERIE_UI).test(texte)) return;
    if (it.kind === "var" && it.names.includes("REG")) return;
    /* Instruction de démarrage emballée par le découpage : « @amorce <clé> » puis function __amorcer_N(){ <instruction d'origine> } : on remet l'instruction à sa place d'origine. */
    if (it.kind === "function" && it.names[0].startsWith("__amorcer_")) {
      const m = texte.match(/^([\s\S]*?)\/\* @amorce ([\s\S]*?) \*\/\s*function __amorcer_\d+\(\)\{\n?([\s\S]*?)\n?\}\s*$/);
      if (m) { const cleA = m[2].replace(/\*​\//g, "*/"); if (!table.has(cleA)) table.set(cleA, (m[1] + m[3]).replace(/\n*$/, "\n")); return; }
    }
    let cle = cleItem(src, it);
    if (it.kind === "stmt") { const n = (occ.get(cle) || 0) + 1; occ.set(cle, n); if (n > 1) cle += "#" + n; }
    if (table.has(cle)) { restes.push(texte); return; }
    table.set(cle, texte.endsWith("\n") ? texte : texte + "\n");
  };
  for (const it of base.items) ajouter(baseSrc, it, false);
  const ordreRestes = [];
  for (const f of UI_MODULES) {
    const s = lire(new URL(f, DOSSIER));
    const d = decouper(s);
    for (const it of d.items) ajouter(s, it, true);
  }
  defragmenter(table);
  const sorties = []; const vus = new Set();
  for (const k of manifeste) { if (table.has(k)) { sorties.push(table.get(k)); vus.add(k); } }
  for (const [k, t] of table) if (!vus.has(k)) sorties.push(t);
  return sansRegistre(base.prefixe + sorties.join("\n") + base.suffixe);
}
export function lireUiComplet() {
  const fichiers = [FICHIER_UI, new URL("./_ui-ordre-origine.json", import.meta.url), new URL("./_ui-sources.mjs", import.meta.url), new URL("./_js-scan.mjs", import.meta.url), ...UI_MODULES.map((f) => new URL(f, DOSSIER))];
  const h = createHash("sha1");
  for (const u of fichiers) { const st = statSync(u); h.update(u.pathname + ":" + st.mtimeMs + ":" + st.size + ";"); }
  const cache = join(tmpdir(), "soreal-idle-ui-virtuel-" + h.digest("hex").slice(0, 16) + ".js");
  if (existsSync(cache)) return readFileSync(cache, "utf8");
  const texte = construire();
  try { writeFileSync(cache, texte); } catch (_) { /* cache facultatif */ }
  return texte;
}
export function lireModulesUi() {
  return UI_MODULES.map((f) => "\n" + sansRegistre(readFileSync(new URL(f, DOSSIER), "utf8"))).join("");
}

/* Texte complet de la vraie fonction « function nom(...){...} » (première occurrence qui n'est pas une cale). */
export function extraireFonction(texte, nom) {
  const re = new RegExp("(?:^|\\n)[ \\t]*(?:async )?function " + nom.replace(/\$/g, "\\$") + "\\(", "g");
  let m;
  while ((m = re.exec(texte))) {
    const debut = m.index + (texte[m.index] === "\n" ? 1 : 0);
    const fin = finFonction(texte, debut);
    if (fin > 0) return texte.slice(debut, fin);
  }
  throw new Error("fonction introuvable : " + nom);
}
/* Texte d'une déclaration « let/const nom ... ; » (jusqu'au point-virgule de niveau 0). */
export function extraireDeclaration(texte, debutExact) {
  const i = texte.indexOf(debutExact);
  if (i < 0) throw new Error("déclaration introuvable : " + debutExact);
  const fin = finInstruction(texte, i);
  return texte.slice(i, fin > 0 ? fin : i + debutExact.length);
}

/* Plusieurs éléments du frontend, dans l'ordre demandé : « F:nomDeFonction » ou « V:nomDeVariable » (déclaration let/const complète). */
export function extraireElements(texte, cles) {
  const { items } = decouper(texte);
  return cles.map((c) => {
    const [genre, nom] = [c.slice(0, 1), c.slice(2)];
    const it = items.find((x) => x.kind === (genre === "F" ? "function" : "var") && x.names.includes(nom));
    if (!it) throw new Error("élément introuvable : " + c);
    return texte.slice(it.s, it.e);
  }).join("\n");
}
