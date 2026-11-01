import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { planPurgeVoixStrictV1, lireCorpsPurgeV1 } from "../src/idle-voix-purge-v1.js";
import { chargerNarration, empreintesLiees } from "../../desktop/src/voix-utiles.mjs";

/*
 * Règle STRICTE des voix (Norman, 2026-11-01 : « tout ce que je considère comme validé dans les voix doit être la SEULE version qui existe » ; boss 98 : une ancienne voix de robot était lue à la place de la voix enregistrée).
 *  1. Purge : utile = déclarée (liste « voix » d'un texte ou d'une histoire) OU statique du manifeste non liée à un texte enregistré ; le reste (orphelines, anciennes variantes) est à supprimer.
 *  2. Client : un texte enregistré ne lit QUE ses fichiers déclarés (jamais une voix recalculée ni héritée du manifeste) ; un texte non enregistré garde le comportement d'origine.
 *  3. Route serveur : simulation par défaut, suppression seulement avec le nombre exact annoncé, réponse listant les fichiers ; jamais d'accès aux clés inattendues.
 *  4. Constructions (exe, APK, mises à jour) : n'embarquent / ne listent que les voix utiles.
 */
const R = path.resolve(import.meta.dirname, "..", "..");
const api = chargerNarration(R);
const H = (t) => api.hashBloc(t);

/* ---- 1. purge (jeu de données fictif) ---- */
{
  const h = (n) => n.toString(16).padStart(14, "0");
  const fichiers = [1, 2, 3, 4, 5, 6, 7].map((n) => ({ cle: "idle/voix/" + h(n) + ".m4a", taille: 1000 * n }));
  fichiers.push({ cle: "idle/voix/sous-dossier/x.m4a", taille: 5 }, { cle: "idle/voix/readme.txt", taille: 7 });
  const plan = planPurgeVoixStrictV1({
    fichiers,
    declarees: [h(1), h(2)],            // 1, 2 : enregistrées
    manifeste: [h(2), h(3), h(4), h(5)],  // 2 déclarée aussi ; 3, 4 statiques ; 5 statique mais liée
    liees: [h(5), h(2)],                // 5 : ancienne variante d'un texte enregistré ; 2 : déclarée, l'emporte
    anglaises: [h(7)]
  });
  const raisons = Object.fromEntries(plan.gardees.map((x) => [x.cle.slice(10, 24), x.raison]));
  assert.equal(raisons[h(1)], "declaree");
  assert.equal(raisons[h(2)], "declaree", "une voix déclarée n'est JAMAIS supprimée, même si elle est liée");
  assert.equal(raisons[h(3)], "statique");
  assert.equal(raisons[h(4)], "statique");
  assert.equal(raisons[h(7)], "anglaise");
  assert.deepEqual(plan.aSupprimer.map((x) => [x.cle.slice(10, 24), x.raison]).sort(), [[h(5), "ancienne-variante-d-un-texte-enregistre"], [h(6), "orpheline"]].sort());
  assert.equal(plan.octetsLiberes, 5000 + 6000);
  assert.equal(plan.inattendus.length, 2, "une clé qui n'a pas la forme d'une voix n'est jamais touchée");
  assert.deepEqual(lireCorpsPurgeV1({ liees: ["zz", h(1), 5], confirmer: "3" }), { liees: [h(1)], confirmer: null });
  assert.deepEqual(lireCorpsPurgeV1({ confirmer: 4 }), { liees: [], confirmer: 4 });
}

/* ---- 1 bis. empreintes liées : texte d'origine, affiché ET dit d'un boss enregistré (jeu de données fictif) ---- */
{
  const parle = "Le début. (narrateur) Le milieu. (robot) « Fin. »";
  const catalogue = { textes: [
    ["boss:98", JSON.stringify({ champs: { nom: "Nom Neuf", texte: "Texte affiché neuf." }, parle: { nom: "Nom Neuf", texte: parle }, voix: [H("x")] })],
    ["boss:7", JSON.stringify({ champs: { nom: "Sans voix", texte: "Texte jamais enregistré." }, parle: {}, voix: [] })]
  ] };
  const liees = empreintesLiees(api, catalogue, R);
  const hashes = (t) => api.planNarration(t).filter((e) => e.chunk != null).map((e) => api.hashBloc(e.chunk));
  const hashesTexte = (t) => hashes(api.retirerParentheses(t));
  for (const x of hashes(api.composerChronique("Nom Neuf", parle))) assert.ok(liees.has(x), "le texte dit (avec balises) est lié");
  for (const x of hashes(api.composerChronique("Nom Neuf", "Texte affiché neuf.", true))) assert.ok(liees.has(x), "le texte affiché (sans nom) est lié");
  for (const x of hashes(api.composerChronique("Sans voix", "Texte jamais enregistré."))) assert.ok(!liees.has(x), "un texte sans liste « voix » n'est lié à rien");
}

/* ---- 2. client : un texte enregistré ne lit que ses fichiers déclarés ---- */
{
  const demandes = [];
  const manifeste = [];
  const rien = () => {};
  const win = { location: { href: "http://localhost/" }, localStorage: { getItem() { return null; }, setItem() {} }, navigator: { userAgent: "node" } };
  const doc = new Proxy({}, { get: (_t, k) => (k === "readyState" ? "loading" : rien) });
  win.document = doc;
  const ctx = vm.createContext({ window: win, document: doc, navigator: win.navigator, localStorage: win.localStorage, location: win.location, console, setTimeout: rien, setInterval: rien, addEventListener: rien,
    fetch: (u) => { demandes.push(String(u)); return Promise.resolve(String(u).endsWith("manifest.json") ? { ok: true, json: () => Promise.resolve({ files: manifeste }) } : { ok: false, status: 404 }); } });
  const modules = path.join(R, "cloudflare", "public", "modules");
  for (const m of ["voix-nommees-v1.js", "voix-expressions-v1.js", "tutorial-tts-v202.js"]) vm.runInContext(fs.readFileSync(path.join(modules, m), "utf8"), ctx);
  const t = win.__SOREAL_IDLE_TUTORIAL_TTS_V209__;
  assert.equal(typeof t.blocsInterdits, "function");
  const texteEnregistre = "Première phrase enregistrée. (robot) « Deuxième phrase, ancienne variante. »";
  const blocs = t.planNarration(t.retirerParentheses(texteEnregistre)).filter((e) => e.chunk != null).map((e) => t.hashBloc(e.chunk));
  assert.equal(blocs.length, 2);
  const [h1, h2] = blocs;
  manifeste.push(h2);                  // la 2e voix existe aussi au manifeste (statique, ancienne variante)
  t.enregistrerVoixDynamiques([h1]);   // SEULE la 1re est déclarée (validée)
  /* manifeste chargé une première fois (le plan le déclenche), puis rejugé */
  const etapes = t.planNarration(t.retirerParentheses(texteEnregistre));
  t.blocsInterdits(etapes);
  await new Promise((r) => setImmediate(r));
  const interdits = t.blocsInterdits(etapes);
  assert.ok(interdits[h2], "la voix non déclarée d'un texte enregistré est INTERDITE (pas lue même si le manifeste ou R2 la connaît)");
  assert.ok(!interdits[h1], "la voix déclarée reste lue");
  /* un texte sans aucun bloc déclaré garde le comportement d'origine */
  assert.equal(Object.keys(t.blocsInterdits(t.planNarration("Un texte statique du jeu, jamais enregistré."))).length, 0);
  /* un bloc à la fois déclaré et au manifeste (nom d'un boss, phrase inchangée) ne suffit pas à rendre un texte « enregistré » */
  const commun = t.hashBloc(t.planNarration("Nom commun")[0].chunk);
  manifeste.push(commun); t.enregistrerVoixDynamiques([commun]);
  assert.equal(Object.keys(t.blocsInterdits(t.planNarration("Nom commun. Et une phrase statique qui n'est pas déclarée."))).length, 0);
}

/* ---- 3. route serveur + client d'administration ---- */
{
  const entree = fs.readFileSync(path.join(R, "cloudflare", "src", "idle-worker-entry-v1.js"), "utf8");
  assert.match(entree, /searchParams\.get\("strict"\) === "1"/);
  assert.match(entree, /corps\.confirmer !== plan\.aSupprimer\.length/, "suppression seulement avec le nombre EXACT annoncé par la simulation");
  assert.match(entree, /liste: plan\.aSupprimer/, "la réponse liste ce qui sera / est supprimé");
  assert.match(entree, /MANIFESTE_VOIX_ILLISIBLE/, "sans manifeste, rien n'est classé");
  const bouton = fs.readFileSync(path.join(R, "cloudflare", "public", "modules", "admin-histoires-v1.js"), "utf8");
  assert.match(bouton, /voice-purge\?strict=1/);
  assert.match(bouton, /hashesLiesAuxTextes/);
  assert.match(bouton, /appeler\(liees,false,d\.supprimees\)/, "confirmation = le nombre exact de la simulation");
  assert.match(fs.readFileSync(path.join(R, "cloudflare", "public", "modules", "textes-admin-v1.js"), "utf8"), /hashesLiesAuxTextes:hashesLiesAuxTextes_/);
}

/* ---- 4. constructions : seulement les voix utiles, jamais de suppression sur R2 ---- */
{
  const lire = (f) => fs.readFileSync(path.join(R, f), "utf8");
  assert.match(lire("android/construire-hors-ligne.mjs"), /voixObsoletesAEcarter/);
  assert.match(lire("desktop/construire.mjs"), /voixObsoletesAEcarter[\s\S]*exclure/);
  assert.match(lire("desktop/src/coffre-medias.mjs"), /exclure && exclure\.has/);
  assert.match(lire("desktop/publier-maj.mjs"), /clesVoixObsoletes/);
  assert.match(lire("desktop/recolter.mjs"), /clesVoixObsoletes/);
  for (const f of ["desktop/src/voix-utiles.mjs", "android/construire-hors-ligne.mjs", "desktop/publier-maj.mjs", "desktop/recolter.mjs"]) {
    assert.doesNotMatch(lire(f).replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, ""), /r2["']?,\s*["']object["']?,\s*["']delete|\.delete\(/, f + " ne supprime rien sur R2");
  }
}

console.log("idle-voix-strict-v1 : OK");
