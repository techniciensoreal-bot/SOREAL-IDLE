#!/usr/bin/env node
/*
 * CATALOGUE DES VISUELS ET EFFETS (plan design/ARCHITECTURE-CIBLE.md, § 4-2 et § 5 : « rien n'est jamais perdu »). Inventaire GÉNÉRÉ du code du jeu : menus, pages, animations CSS (@keyframes) et par script (Web Animations), canvas, sons, morts et retours du
 * joueur, retours des boss, effets réglables, ressources visuelles. Sert de liste de contrôle à la reconstruction : un élément du catalogue ne disparaît jamais sans l'accord de Norman, et un nouvel élément doit y entrer.
 *
 *   node cloudflare/tools/inventaire-visuels.mjs --ecrire      (écrit design/catalogue-visuels.json et design/CATALOGUE-VISUELS.md)
 *   node cloudflare/tools/inventaire-visuels.mjs --verifier    (échoue si le catalogue écrit n'est plus celui du code : à régénérer et relire)
 * Test : idle-catalogue-visuels-v1.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, "..", "..");
const PUBLIC = path.join(RACINE, "cloudflare", "public");
/* tri par unités de code : identique sur toutes les machines (localeCompare dépend de la langue et de la version d'ICU) */
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const lire = (f) => fs.readFileSync(f, "utf8").replace(/\r\n/g, "\n");
const rel = (f) => path.relative(PUBLIC, f).replace(/\\/g, "/");
/* Fichiers du jeu = ceux que git suit OU qui vont l'être (non ignorés) : le catalogue est le même sur le poste et en CI, jamais pollué par un fichier local ignoré */
let VERSIONNES = null;
try { VERSIONNES = new Set(execSync("git ls-files --cached --others --exclude-standard cloudflare/public", { cwd: RACINE, encoding: "utf8" }).split(String.fromCharCode(10)).filter(Boolean)); } catch (_e) { VERSIONNES = null; }
const versionne = (f) => !VERSIONNES || VERSIONNES.has(path.relative(RACINE, f).split(path.sep).join("/"));
const lister = (dossier, filtre) => (fs.existsSync(dossier) ? fs.readdirSync(dossier).filter(filtre).sort().map((n) => path.join(dossier, n)).filter(versionne) : []);

export function inventaire() {
  const css = lister(PUBLIC, (n) => n.endsWith(".css"));
  const js = [...lister(path.join(PUBLIC, "modules"), (n) => n.endsWith(".js")), ...lister(PUBLIC, (n) => n.endsWith(".js") && n !== "moteur-local-worker-v1.js")];
  const texte = new Map([...css, ...js].map((f) => [f, lire(f)]));

  /* 1. Animations CSS (@keyframes) : définition(s) et usages (nombre de fichiers qui nomment l'animation ailleurs que dans sa définition) */
  const defs = new Map();
  for (const [f, t] of texte) for (const m of t.matchAll(/@keyframes\s+([A-Za-z0-9_-]+)/g)) (defs.get(m[1]) || defs.set(m[1], new Set()).get(m[1])).add(rel(f));
  const keyframes = [...defs.entries()].sort((a, b) => cmp(a[0], b[0])).map(([nom, fichiers]) => {
    const re = new RegExp("(?<![A-Za-z0-9_-])" + nom.replace(/[-]/g, "\\-") + "(?![A-Za-z0-9_-])", "g");
    const utilisePar = [];
    for (const [f, t] of texte) { const sans = t.replace(new RegExp("@keyframes\\s+" + nom + "(?![A-Za-z0-9_-])", "g"), ""); if (re.test(sans)) utilisePar.push(rel(f)); re.lastIndex = 0; }
    return { nom, definiePar: [...fichiers].sort(), utilisePar: utilisePar.sort() };
  });

  /* 2. Animations par script (Web Animations), canvas */
  const animations = js.filter((f) => /\.animate\(/.test(texte.get(f))).map((f) => ({ fichier: rel(f), appels: (texte.get(f).match(/\.animate\(/g) || []).length }));
  const canvas = js.filter((f) => /getContext\((['"])2d\1\)/.test(texte.get(f))).map((f) => ({ fichier: rel(f), contextes: (texte.get(f).match(/getContext\((['"])2d\1\)/g) || []).length }));

  /* 3. Menus (liste du jeu) */
  const ui = lire(path.join(PUBLIC, "soreal-idle-ui.js"));
  const debutMenus = ui.indexOf("{id:'entrainement',icon:");
  const bloc = ui.slice(debutMenus, debutMenus + 6000);
  const menus = [...bloc.matchAll(/\{id:'([a-z0-9]+)',icon:'([^']*)',nom:'([^']*)'\}/g)].map((m) => ({ id: m[1], nom: m[3] }));

  /* 4. Pages (modules de page) */
  const pages = js.map((f) => rel(f)).filter((f) => /(^|\/)(ui-[a-z0-9-]+|[a-z0-9-]+-page-v1)\.js$/.test(f));

  /* 5. Morts et retours */
  const idsDe = (fichier, depart, fin) => { const t = texte.get(path.join(PUBLIC, "modules", fichier)) || ""; const a = depart ? t.indexOf(depart) : 0; const b = fin ? t.indexOf(fin, a) : t.length; return [...t.slice(a, b > a ? b : t.length).matchAll(/\{id:'([a-z0-9-]+)',nom:'([^']*)'/g)].map((m) => ({ id: m[1], nom: m[2] })); };
  const retoursJoueur = idsDe("reapparitions-v1.js", "var JOUEUR=[", "/* ================= BOSS");
  const retoursBoss = idsDe("reapparitions-v1.js", "var BOSS=[", null);
  const mortsNouvelles = idsDe("morts-joueur-nouvelles-v1.js", null, null);
  const tMort = texte.get(path.join(PUBLIC, "modules", "mort-joueur-v1.js")) || "";
  const mortsDeBase = ["fondu", "rewind", "clignote"].filter((id) => tMort.includes("variante==='" + id + "'") || tMort.includes("'" + id + "'"));   /* explosion en pixels, puis retour en fondu, rembobinage VHS ou clignotement */

  /* Points d'entrée rejouables : chaque module expose son API sur window.__SOREAL_IDLE_*__ (animation rejouable en direct dans le navigateur, sans capture) */
  const pointsEntree = {};
  for (const f of js) for (const m of texte.get(f).matchAll(/window.(__SOREAL_IDLE_[A-Z0-9_]+__)s*=/g)) if (!pointsEntree[m[1]]) pointsEntree[m[1]] = rel(f);

  /* 6. Sons : fonctions nommées du module audio, sons de la borne */
  const sonsDe = (fichier) => { const t = texte.get(path.join(PUBLIC, "modules", fichier)) || ""; return [...new Set([...t.matchAll(/^\s{2,8}([a-zA-Z][a-zA-Z0-9_]{2,40})\s*:\s*function\b/gm)].map((m) => m[1]))].sort(); };
  const sons = { effets: sonsDe("audio-effects-v199.js"), borne: sonsDe("audio-borne-v1.js"), coffre: sonsDe("audio-coffre-v1.js") };

  /* 7. Effets réglables (préférences d'effets, liées à l'appareil) */
  const effets = [...new Set(js.flatMap((f) => [...texte.get(f).matchAll(/soreal_idle_effet_[a-z0-9_]+/g)].map((m) => m[0])))].sort();

  /* 8. Ressources visuelles et sonores par dossier */
  const exts = /\.(webp|png|jpe?g|gif|svg|m4a|mp3|ogg|wav|mp4|webm|woff2?)$/i;
  const assets = {};
  /* fichiers SUIVIS par git : le catalogue est le même en CI et sur le poste (aucun fichier local non versionné) */
  let suivis = [];
  suivis = VERSIONNES ? [...VERSIONNES].sort(cmp) : [];
  for (const f of suivis) { const r = f.slice("cloudflare/public/".length); if (!exts.test(r) || /^(modules|voice)\//.test(r)) continue; const dossier = path.posix.dirname(r); assets[dossier] = (assets[dossier] || 0) + 1; }

  return {
    version: 1,
    resume: { menus: menus.length, pages: pages.length, keyframes: keyframes.length, fichiersAvecWebAnimations: animations.length, fichiersCanvas: canvas.length, pointsEntreeRejouables: Object.keys(pointsEntree).length, mortsDeBase: mortsDeBase.length, retoursJoueur: retoursJoueur.length, retoursBoss: retoursBoss.length, mortsNouvelles: mortsNouvelles.length, effetsReglables: effets.length, sonsEffets: sons.effets.length, dossiersDeRessources: Object.keys(assets).length },
    menus, pages, keyframes, animations, canvas, mortsDeBase, retoursJoueur, retoursBoss, mortsNouvelles, pointsEntree: Object.fromEntries(Object.entries(pointsEntree).sort((a, b) => cmp(a[0], b[0]))), sons, effetsReglables: effets,
    ressourcesParDossier: Object.fromEntries(Object.entries(assets).sort((a, b) => cmp(a[0], b[0])))
  };
}

function markdown(c) {
  const l = [];
  l.push("# Catalogue des visuels et effets de SOREAL IDLE");
  l.push("");
  l.push("FICHIER GÉNÉRÉ par `node cloudflare/tools/inventaire-visuels.mjs --ecrire` (ne pas éditer à la main). Liste de contrôle de la reconstruction (design/ARCHITECTURE-CIBLE.md) : un élément ne disparaît jamais sans l'accord de Norman.");
  l.push("");
  l.push("## Résumé");
  for (const [k, v] of Object.entries(c.resume)) l.push("- " + k + " : **" + v + "**");
  l.push("");
  l.push("## Menus");
  l.push(c.menus.map((m) => m.nom + " (`" + m.id + "`)").join(" · "));
  l.push("");
  l.push("## Morts et retours du joueur");
  l.push("- Morts de base (explosion en pixels, puis retour) : " + c.mortsDeBase.join(", "));
  l.push("- Morts (nouvelles) : " + c.mortsNouvelles.map((m) => m.nom).join(", "));
  l.push("- Retours du joueur : " + c.retoursJoueur.map((m) => m.nom).join(", "));
  l.push("- Retours des boss : " + c.retoursBoss.map((m) => m.nom).join(", "));
  l.push("");
  l.push("## Sons nommés (effets)");
  l.push(c.sons.effets.join(", "));
  l.push("");
  l.push("## Effets réglables");
  l.push(c.effetsReglables.join(", "));
  l.push("");
  l.push("## Points d'entrée rejouables (window.__SOREAL_IDLE_*__)");
  l.push("Chaque module expose son API ici : une animation se REJOUE en direct dans le navigateur (jamais de planche de captures). " + Object.keys(c.pointsEntree).length + " points d'entrée, listés dans `design/catalogue-visuels.json` (champ `pointsEntree`).");
  l.push("");
  l.push("## Animations CSS orphelines (définies mais nommées nulle part ailleurs)");
  const orph = c.keyframes.filter((k) => k.utilisePar.length === 0);
  l.push(orph.length ? orph.map((k) => "`" + k.nom + "` (" + k.definiePar.join(", ") + ")").join(" · ") : "aucune");
  l.push("");
  l.push("## Fichiers qui animent par script (Web Animations) et qui dessinent en canvas");
  l.push(c.animations.map((a) => "`" + a.fichier + "` (" + a.appels + ")").join(" · "));
  l.push("");
  l.push(c.canvas.map((a) => "`" + a.fichier + "` (" + a.contextes + ")").join(" · "));
  l.push("");
  l.push("## Ressources par dossier");
  for (const [d, n] of Object.entries(c.ressourcesParDossier)) l.push("- `" + d + "` : " + n);
  l.push("");
  l.push("Le détail complet (chaque animation, ses fichiers de définition et d'usage) est dans `design/catalogue-visuels.json`.");
  return l.join("\n") + "\n";
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const c = inventaire();
  const fJson = path.join(RACINE, "design", "catalogue-visuels.json"), fMd = path.join(RACINE, "design", "CATALOGUE-VISUELS.md");
  if (process.argv.includes("--ecrire")) {
    fs.writeFileSync(fJson, JSON.stringify(c, null, 1) + "\n"); fs.writeFileSync(fMd, markdown(c));
    console.log("catalogue écrit :", JSON.stringify(c.resume));
  } else if (process.argv.includes("--verifier")) {
    const ecrit = fs.existsSync(fJson) ? fs.readFileSync(fJson, "utf8") : "";
    if (ecrit !== JSON.stringify(c, null, 1) + "\n") { console.error("Le catalogue des visuels n'est plus à jour : node cloudflare/tools/inventaire-visuels.mjs --ecrire, puis relire design/CATALOGUE-VISUELS.md"); process.exit(1); }
    console.log("catalogue à jour");
  } else console.log(JSON.stringify(c.resume, null, 1));
}
export { markdown };
