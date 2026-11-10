/*
 * Voix UTILES de SOREAL IDLE, règle STRICTE (Norman, 2026-11-01 : « tout ce que je considère comme validé dans les voix doit être la SEULE version qui existe »). Module partagé par :
 *   - desktop/purger-voix-obsoletes.mjs (simulation / purge de la copie locale ; --r2 pour R2) ;
 *   - desktop/recolter.mjs (ne télécharge ni n'indexe une voix obsolète), android/construire-hors-ligne.mjs (APK), desktop/construire.mjs (exe) et desktop/publier-maj.mjs (mises à jour) : seules les voix utiles sont embarquées / listées.
 * Aucune suppression sur R2 ici : ce module ne fait que CLASSER.
 *
 * Règle (cloudflare/src/idle-voix-purge-v1.js, la même que la route POST /api/v1/voice-purge?strict=1) : utile = (a) dans une liste « voix » déclarée d'un texte enregistré ou d'une histoire (desktop/graine/catalogue.json),
 * (b) voix statique du manifeste public/voice/manifest.json NON liée à un texte enregistré, (c) voix anglaise (au manifeste, jamais liée : « liees » ne vient que de textes français). « Liée » = empreinte recalculée, avec le VRAI module de
 * narration (balises de voix comprises), à partir du texte d'origine, affiché ou dit d'un texte qui a une liste « voix » (chroniques de boss : avec et sans le nom ; autres textes : tous leurs champs).
 * Garde-fous : catalogue absent / incomplet / module illisible => { ok:false } et AUCUN filtrage (par prudence, rien n'est écarté).
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { pathToFileURL, fileURLToPath } from "node:url";

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, "..", "..");
const lireJson = (chemin) => JSON.parse(fs.readFileSync(chemin, "utf8"));

/* Le module de narration du jeu, avec les registres de voix nommées et d'expressions chargés comme dans index.html (sinon « (robot) » n'est pas reconnu et les blocs ne sont pas ceux du jeu). */
export function chargerNarration(racine = RACINE) {
  const modules = path.join(racine, "cloudflare", "public", "modules");
  const rien = () => {};
  const win = { location: { href: "http://localhost/" }, localStorage: { getItem() { return null; }, setItem() {} }, navigator: { userAgent: "node" } };
  const doc = new Proxy({}, { get: (_t, k) => (k === "readyState" ? "loading" : rien) });
  win.document = doc;
  const ctx = vm.createContext({ window: win, document: doc, navigator: win.navigator, localStorage: win.localStorage, location: win.location, console, setTimeout: rien, setInterval: rien, addEventListener: rien, fetch: () => Promise.reject(new Error("hors ligne")) });
  for (const m of ["voix-nommees-v1.js", "voix-expressions-v1.js", "tutorial-tts-v202.js"]) vm.runInContext(fs.readFileSync(path.join(modules, m), "utf8"), ctx, { filename: m });
  const api = win.__SOREAL_IDLE_TUTORIAL_TTS_V209__;
  if (!api || typeof api.hashBloc !== "function" || typeof api.planNarration !== "function") throw new Error("module de narration illisible");
  return api;
}

function chaines(v, sortie) {
  if (typeof v === "string") { if (v.trim()) sortie.push(v); }
  else if (Array.isArray(v)) v.forEach((x) => chaines(x, sortie));
  else if (v && typeof v === "object") Object.keys(v).forEach((k) => chaines(v[k], sortie));
  return sortie;
}

/* Empreintes LIEES aux textes enregistrés (voir l'en-tête). */
export function empreintesLiees(api, catalogue, racine = RACINE) {
  const out = new Set();
  /* Le texte lu d'un popup / guide / système est retirerParentheses(texte dit) (tutorial-tts-v202.js, lecture du DOM) : les balises « (robot) » deviennent des marqueurs de voix ; une chronique passe par composerChronique, qui le fait déjà. */
  const ajouter = (t) => { for (const e of api.planNarration(api.retirerParentheses(String(t)))) if (e.chunk != null) out.add(api.hashBloc(e.chunk)); };
  const ajouterChronique = (t) => { for (const e of api.planNarration(String(t))) if (e.chunk != null) out.add(api.hashBloc(e.chunk)); };
  const noms = new Map(); const originaux = new Map();
  try { for (const b of lireJson(path.join(racine, "design", "catalogue", "boss.json")).boss) noms.set(Number(b.id), String(b.nomFr || "")); } catch (_e) { /* facultatif */ }
  for (const f of ["ngu-boss-stories-fr.json", "ngu-boss-stories-complement-fr.json"]) {
    try { for (const b of lireJson(path.join(racine, "design", f))) if (String(b.story || "").trim()) originaux.set(Number(b.id), String(b.story)); } catch (_e) { /* facultatif */ }
  }
  for (const [cle, json] of catalogue.textes) {
    const o = JSON.parse(json);
    if (!Array.isArray(o.voix) || !o.voix.length) continue;   /* pas enregistré : rien n'est « lié » */
    const m = /^boss:(\d+)$/.exec(String(cle));
    if (m) {
      const n = Number(m[1]);
      const lesNoms = new Set([(o.champs || {}).nom, (o.parle || {}).nom, noms.get(n), "Boss"].filter((x) => typeof x === "string" && x.trim()));
      const lesTextes = new Set([(o.champs || {}).texte, (o.parle || {}).texte, originaux.get(n)].filter((x) => typeof x === "string" && x.trim()));
      for (const nom of lesNoms) for (const t of lesTextes) { ajouterChronique(api.composerChronique(nom, t)); ajouterChronique(api.composerChronique(nom, t, true)); }
    } else {
      for (const t of chaines([o.champs, o.parle], [])) ajouter(t);
    }
  }
  return out;
}

/* Charge toutes les sources. Rend { ok, raison, declarees, manifeste, liees, classer(fichiers) }. */
export function chargerPlanVoix(racine = RACINE) {
  try {
    const chemin = path.join(racine, "desktop", "graine", "catalogue.json");
    if (!fs.existsSync(chemin)) return { ok: false, raison: "desktop/graine/catalogue.json absent" };
    const catalogue = lireJson(chemin);
    if (!Array.isArray(catalogue.textes) || catalogue.textes.length < 50 || !Array.isArray(catalogue.histoires)) return { ok: false, raison: "catalogue incomplet (textes/histoires manquants)" };
    if (!Date.parse(catalogue.exporteLe || "")) return { ok: false, raison: "catalogue sans date d'export (périmé ou non fiable)" };
    const declarees = new Set();
    for (const [, json] of catalogue.textes) for (const h of (JSON.parse(json).voix || [])) declarees.add(String(h));
    for (const h of catalogue.histoires) for (const x of (h.voix || [])) declarees.add(String(x));
    const manifeste = new Set(lireJson(path.join(racine, "cloudflare", "public", "voice", "manifest.json")).files.map(String));
    if (manifeste.size < 100) return { ok: false, raison: "manifeste des voix vide ou illisible" };
    const liees = empreintesLiees(chargerNarration(racine), catalogue, racine);
    /* Histoires ACTUELLES : seules leurs images (dossier idle/story/<id>/) sont utiles. Un catalogue sans l'introduction ou sans histoire n'est pas fiable pour classer les médias d'histoire. */
    const histoiresIds = new Set(catalogue.histoires.map((h) => String(h && h.id || "")).filter(Boolean));
    return {
      ok: true, catalogue, declarees, manifeste, liees, histoiresIds,
      /* fichiers : [{ cle: "idle/voix/<h>.m4a", taille }] -> { gardees, aSupprimer, inattendus, octetsLiberes } */
      classer: async (fichiers) => {
        const { planPurgeVoixStrictV1 } = await import(pathToFileURL(path.join(racine, "cloudflare", "src", "idle-voix-purge-v1.js")).href);
        return planPurgeVoixStrictV1({ fichiers, declarees, manifeste, liees });
      }
    };
  } catch (e) {
    return { ok: false, raison: String(e && e.message || e) };
  }
}

/*
 * Ensemble des clés R2 (idle/voix/…) OBSOLETES parmi `entrees` ({ cle, taille, date? } ou chaînes) ; vide si le plan n'est pas fiable (avertissement : rien n'est écarté).
 * PROTECTION du catalogue périmé : le catalogue (desktop/graine/catalogue.json) est exporté à la main ; une voix déposée sur R2 APRÈS son export (date ISO connue) peut être une voix que Norman vient d'enregistrer et que le catalogue
 * ignore encore : elle n'est jamais écartée. Une entrée sans date n'a pas cette protection : écartée seulement si `sansDate` vaut « ecarter » (par défaut elle est GARDÉE, relancer desktop/recolter.mjs écrit les dates).
 */
export async function clesVoixObsoletes(entrees, { racine = RACINE, journal = console.error, sansDate = "garder" } = {}) {
  const plan = chargerPlanVoix(racine);
  if (!plan.ok) { journal("Voix : règle stricte non appliquée (" + plan.raison + ") : aucune voix n'est écartée."); return new Set(); }
  const exporte = Date.parse(plan.catalogue.exporteLe || "") || 0;
  const toutes = entrees.map((c) => (typeof c === "string" ? { cle: c, taille: 0 } : c));
  const fichiers = toutes.filter((c) => String(c.cle).startsWith("idle/voix/"));
  const r = await plan.classer(fichiers);
  /* Médias d'histoire : idle/story/<id>/<fichier> est obsolète si <id> n'est plus une histoire du catalogue (Norman, 2026-11-01 : histoires supprimées du jeu = plus embarquées). */
  const histoiresOk = plan.histoiresIds.has("Intro");
  if (!histoiresOk) journal("Histoires : catalogue sans l'introduction (périmé ?) : aucun média d'histoire n'est écarté.");
  for (const c of toutes) {
    const morceaux = String(c.cle).split("/");   /* idle / story / <id> / <fichier…> : un fichier posé directement sous idle/story/ n'est jamais touché */
    if (!histoiresOk || morceaux.length < 4 || morceaux[0] !== "idle" || morceaux[1] !== "story" || !morceaux[2]) continue;
    fichiers.push(c);
    if (!plan.histoiresIds.has(morceaux[2])) r.aSupprimer.push({ cle: c.cle, taille: Number(c.taille) || 0, raison: "histoire-supprimee" });
  }
  const dates = new Map(fichiers.map((c) => [c.cle, Date.parse(c.date || "") || 0]));
  const sortie = new Set(); let proteges = 0, sansDateGardees = 0;
  for (const x of r.aSupprimer) {
    const d = dates.get(x.cle) || 0;
    if (d && exporte && d > exporte) { proteges += 1; continue; }
    if (!d && sansDate !== "ecarter") { sansDateGardees += 1; continue; }
    sortie.add(x.cle);
  }
  if (proteges) journal("Voix : " + proteges + " voix posées sur R2 après l'export du catalogue (" + (plan.catalogue.exporteLe || "?") + ") sont gardées par prudence : ré-exporter le catalogue (desktop/exporter-catalogue.js) pour les classer.");
  if (sansDateGardees) journal("Voix : " + sansDateGardees + " voix obsolètes sans date d'envoi dans l'inventaire sont gardées : relancer desktop/recolter.mjs (écrit les dates) avant de construire.");
  return sortie;
}

/*
 * Pour les constructions (APK, exe) : clés « idle/voix/<h>.m4a » OBSOLETES parmi les fichiers de desktop/medias, avec les dates d'envoi de l'inventaire _index.json (3e valeur, écrite par desktop/recolter.mjs). Les voix obsolètes
 * ne sont ni embarquées ni listées : la copie locale n'est pas touchée (rien n'est supprimé), seul l'embarquement les ignore.
 */
export async function voixObsoletesAEcarter(medias = path.join(RACINE, "desktop", "medias"), opts = {}) {
  const dossier = path.join(medias, "idle", "voix");
  let index = {};
  try { index = lireJson(path.join(medias, "_index.json")); } catch (_e) { /* pas d'inventaire : aucune date, rien n'est écarté */ }
  const entrees = [];
  const ajouter = (cle) => { try { entrees.push({ cle, taille: fs.statSync(path.join(medias, ...cle.split("/"))).size, date: (index[cle] && index[cle][2]) || "" }); } catch (_e) { /* disparu */ } };
  if (fs.existsSync(dossier)) for (const f of fs.readdirSync(dossier)) if (f.endsWith(".m4a")) ajouter("idle/voix/" + f);
  const dossierHistoires = path.join(medias, "idle", "story");
  if (fs.existsSync(dossierHistoires)) for (const d of fs.readdirSync(dossierHistoires, { withFileTypes: true })) if (d.isDirectory()) for (const f of fs.readdirSync(path.join(dossierHistoires, d.name))) ajouter("idle/story/" + d.name + "/" + f);
  const sortie = await clesVoixObsoletes(entrees, opts);
  console.log("Médias : " + sortie.size + " fichiers obsolètes (voix hors règle stricte, images d'histoires supprimées) ne sont pas embarqués.");
  return sortie;
}
