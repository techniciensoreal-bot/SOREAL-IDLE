// Norman (2026-10-30) : écran de connexion de l'application Android hors ligne : Google par le navigateur, partie du compte restaurée, sinon pseudo (unique, vérifié sur le serveur).
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
import { poserRelaisV1, lireRelaisV1 } from "../src/idle-relais-apk-v1.js";

const lire = (f) => fs.readFileSync(new URL(f, import.meta.url), "utf8").replace(/\r\n/g, "\n");

// ---------- serveur : relais (une seule lecture, dix minutes, code secret)
{
  const lignes = new Map();
  const coord = {
    standaloneSessionV1: (t) => (t === "ils_abc" ? { ok: true, user: {}, expiresAt: 9e12 } : { ok: false, error: "IDLE_SESSION_INVALID" }),
    sql: { exec(requete, ...p) {
      if (/^CREATE/.test(requete)) return;
      if (/^DELETE FROM idle_relais WHERE cree/.test(requete)) { for (const [k, v] of lignes) if (v.cree < p[0]) lignes.delete(k); return; }
      if (/^INSERT OR REPLACE/.test(requete)) { lignes.set(p[0], { jeton: p[1], expire: p[2], cree: p[3] }); return; }
      if (/^DELETE FROM idle_relais WHERE code/.test(requete)) { lignes.delete(p[0]); }
    } },
    sqlAll: (requete, code) => (lignes.has(code) ? [lignes.get(code)] : []),
  };
  const code = "0123456789abcdef0123456789abcdef";
  assert.deepEqual(poserRelaisV1(coord, "ils_abc", "court"), { ok: false, error: "RELAIS_CODE_INVALIDE" }, "code trop court refusé");
  assert.deepEqual(poserRelaisV1(coord, "mauvais", code), { ok: false, error: "IDLE_SESSION_INVALID" }, "session invalide : rien n'est déposé");
  assert.deepEqual(lireRelaisV1(coord, code), { ok: true, attente: true }, "rien déposé : attente");
  assert.deepEqual(poserRelaisV1(coord, "ils_abc", code, 1000), { ok: true });
  assert.deepEqual(lireRelaisV1(coord, code, 2000), { ok: true, jeton: "ils_abc", expire: 9e12 }, "le jeton est rendu");
  assert.deepEqual(lireRelaisV1(coord, code, 3000), { ok: true, attente: true }, "lu une seule fois");
  poserRelaisV1(coord, "ils_abc", code, 1000);
  assert.deepEqual(lireRelaisV1(coord, code, 1000 + 11 * 60 * 1000), { ok: true, attente: true }, "disparaît après 10 minutes");
}

// ---------- serveur : routes, CORS limité à l'application, lecture seule, pseudo
{
  const entree = lire("../src/idle-worker-entry-v1.js"), coord = lire("../src/index-idle-coordinator-v1.js"), sync = lire("../src/idle-local-sync-v1.js");
  assert.ok(entree.includes('const IDLE_ORIGINE_APK_V1 = "https://appassets.androidplatform.net";') && entree.includes("request.headers.get(\"origin\") !== IDLE_ORIGINE_APK_V1"), "seule l'origine de l'application reçoit le CORS");
  assert.ok(entree.includes("api\\/v1\\/(relais|pseudo|local\\/export)"), "CORS seulement sur les trois routes de l'application");
  assert.ok(entree.includes('url.pathname === "/api/v1/relais" && request.method === "POST"') && entree.includes('url.pathname === "/api/v1/relais" && request.method === "GET"') && entree.includes('url.pathname === "/api/v1/pseudo" && request.method === "POST"'), "routes relais et pseudo");
  assert.ok(entree.includes('corps.lecture = new URL(request.url).searchParams.get("lecture") === "1"'), "export en lecture seule demandé par l'application");
  assert.ok(sync.includes("if (!lectureSeule) sauvegarderSiBesoinLocalV1(") && sync.includes("if (!lectureSeule) revendiquer("), "lecture seule : la partie du compte n'est ni revendiquée ni sauvegardée par l'application");
  assert.ok(coord.includes('"/__soreal-idle-v1/pseudo-definir"') && coord.includes('"definirPseudoSorealIdle", [sv(p?.sessionToken), sv(p?.pseudo)]'), "pseudo réservé par l'opération habituelle (unicité du serveur)");
  assert.ok(lire("../public/standalone-bridge.js").includes("function relaisParamsV1()") && lire("../public/standalone-bridge.js").includes('fetch("/api/v1/relais"'), "page du site : mode relais");
}

// ---------- application : parcours complet avec un faux navigateur
const SERVEUR = { jeton: null, essais: 0, export: null, pseudoRep: { ok: true, pseudo: "Neuf" }, pseudoStatus: 200, pseudoAppels: [], reseau: true };
function monde({ apk = true, stock = {} } = {}) {
  const els = {};
  const faux = (id) => (els[id] = els[id] || { id, textContent: "", className: "", style: {}, disabled: false, ecouteurs: {}, addEventListener(t, f) { this.ecouteurs[t] = f; } });
  const body = { appendChild(e) { e.parentNode = body; e.estEcran = true; this.ecran = e; }, removeChild(e) { if (this.ecran === e) this.ecran = null; e.parentNode = null; }, ecran: null };
  const fen = {
    localStorage: { getItem: (k) => (k in stock ? stock[k] : null), setItem: (k, v) => { stock[k] = String(v); }, removeItem: (k) => { delete stock[k]; } },
    document: {
      readyState: "complete", hidden: false, head: { appendChild() {} }, body,
      createElement: () => { const e = { style: {}, setAttribute() {}, addEventListener(t, f) { (this.ec = this.ec || {})[t] = f; }, set innerHTML(h) { this._h = h; ["sorealIdleApkBoutonV1", "sorealIdleApkEtatV1"].forEach((i) => { if (h.includes(i)) faux(i); }); }, get innerHTML() { return this._h || ""; } }; return e; },
      getElementById: (id) => (id === "sorealIdleApkConnexionStyleV1" ? null : (body.ecran ? els[id] || null : null)),
      addEventListener() {},
    },
    window: null, location: { href: "https://appassets.androidplatform.net/", reload() { fen.rechargements = (fen.rechargements || 0) + 1; } }, crypto: { getRandomValues: (o) => o.fill(7) },
    setTimeout: (f, ms) => setTimeout(f, Math.min(ms, 5)), clearTimeout, setInterval: () => 0, clearInterval() {}, Uint8Array, JSON, Date, Math, Promise, encodeURIComponent, Array, Number, String, Boolean, console,
    fetch: async (url, init = {}) => {
      if (!SERVEUR.reseau) throw new Error("réseau");
      if (/\/api\/v1\/relais\?code=/.test(url)) { SERVEUR.essais++; return { ok: true, json: async () => (SERVEUR.essais < 3 ? { ok: true, attente: true } : { ok: true, jeton: "ils_" + "a".repeat(30), expire: 9e12 }) }; }
      if (/\/api\/v1\/local\/export\?lecture=1/.test(url)) return { ok: true, json: async () => SERVEUR.export };
      if (/\/api\/v1\/pseudo$/.test(url)) { SERVEUR.pseudoAppels.push(JSON.parse(init.body).pseudo); return { ok: SERVEUR.pseudoStatus === 200, status: SERVEUR.pseudoStatus, json: async () => SERVEUR.pseudoRep }; }
      throw new Error("URL inattendue " + url);
    },
  };
  fen.window = fen;
  if (apk) fen.AndroidSoreal = {};
  vm.runInNewContext(lire("../public/modules/apk-connexion-v1.js"), fen);
  return { fen, stock, els, body, A: fen.__SOREAL_IDLE_APK_CONNEXION_V1__ };
}
const ligne = (renaissances, bossVaincus, nom = "Joueur") => { const c = new Array(38).fill(""); c[1] = nom; c[14] = bossVaincus; c[24] = renaissances; c[37] = "{}"; return c; };
const attendre = async (cond, ms = 2000) => { const t0 = Date.now(); while (!cond() && Date.now() - t0 < ms) await new Promise((r) => setTimeout(r, 5)); assert.ok(cond(), "condition atteinte à temps"); };

{ // pas dans l'application, ou compte déjà relié : jamais d'écran
  assert.equal(monde({ apk: false }).A.requis(), false, "navigateur ordinaire : aucun écran de connexion");
  assert.equal(monde({ stock: { idle_apk_compte_v1: "{}" } }).A.requis(), false, "compte déjà relié : plus d'écran");
  assert.equal(monde().A.requis(), true, "application sans compte relié : écran de connexion");
}
{ // compte AVEC une partie : restaurée ; le navigateur est ouvert ; la partie est gardée de côté
  SERVEUR.essais = 0; SERVEUR.export = { ok: true, serveurAt: 1234, joueurs: { ligne: JSON.stringify(ligne(3, 150, "Redrum")) }, profils: [{ pseudo: "Redrum" }] };
  const m = monde(); const fini = m.A.demarrer(); let ok = false; fini.then(() => { ok = true; });
  assert.ok(m.body.ecran && m.els.sorealIdleApkBoutonV1, "l'écran de connexion est affiché (image du jeu en plein écran)");
  assert.match(m.body.ecran.innerHTML, /\/chargement\/affiche-600x900\.webp/, "l'image du jeu");
  m.els.sorealIdleApkBoutonV1.ecouteurs.click({ stopPropagation() {} });
  assert.match(m.fen.location.href, /^https:\/\/soreal-idle\.technicien-soreal\.workers\.dev\/\?relais=[0-9a-f]{32}$/, "un clic ouvre le navigateur sur le site avec le code du relais");
  await attendre(() => ok);
  const compte = JSON.parse(m.stock.idle_apk_compte_v1);
  assert.equal(compte.partie, true, "ce compte a une partie");
  const attente = JSON.parse(m.stock.idle_apk_restauration_v1);
  assert.equal(attente.cells.length, 38); assert.equal(attente.pseudo, "Redrum", "le pseudo du compte est repris");
  assert.ok(JSON.parse(m.stock.idle_apk_jeton_v1).jeton.startsWith("ils_"), "jeton gardé pour vérifier les pseudos");
  assert.ok(m.body.ecran, "l'écran reste affiché pendant la restauration");
  // restauration dans le moteur local : le serveur est plus avancé → chargé ; pseudo repris ; rechargement
  const appels = [];
  m.fen.__SOREAL_IDLE_MOTEUR_LOCAL_V1__ = { etatDiag: () => ({ demarre: true }), exporterLigne: async () => ligne(0, 0), chargerFichier: async (f) => { appels.push(f); return { ok: true }; } };
  m.fen.__SOREAL_IDLE_STANDALONE_V1__ = { session: () => "s1" };
  const pseudos = []; m.fen.__SOREAL_IDLE_CALL_V1__ = async (op, args) => { pseudos.push([op, args, m.A.sansVerif()]); return { ok: true }; };
  m.A.restaurer();
  await attendre(() => m.fen.rechargements === 1, 3000);
  assert.equal(appels.length, 1, "la partie du compte est chargée dans le moteur"); assert.equal(appels[0].format, "soreal-idle-partie-v1"); assert.equal(appels[0].serveurAt, 1234);
  assert.equal(JSON.stringify(pseudos[0]), JSON.stringify(["definirPseudoSorealIdle", ["s1", "Redrum"], true]), "pseudo du compte posé sans nouvelle vérification");
  assert.equal(m.stock.idle_apk_restauration_v1, undefined, "restauration terminée");
}
{ // la partie de ce téléphone est PLUS avancée : conservée
  const m = monde({ stock: { idle_apk_compte_v1: "{}", idle_apk_restauration_v1: JSON.stringify({ cells: ligne(1, 20), serveurAt: 5, pseudo: "X", nom: "x" }) } });
  const appels = [];
  m.fen.__SOREAL_IDLE_MOTEUR_LOCAL_V1__ = { etatDiag: () => ({ demarre: true }), exporterLigne: async () => ligne(5, 200), chargerFichier: async (f) => { appels.push(f); return { ok: true }; } };
  m.fen.__SOREAL_IDLE_STANDALONE_V1__ = { session: () => "s1" }; m.fen.__SOREAL_IDLE_CALL_V1__ = async () => ({ ok: true });
  m.A.restaurer();
  await attendre(() => m.fen.rechargements === 1, 3000);
  assert.equal(appels.length, 0, "partie locale plus avancée : rien n'est écrasé");
}
{ // compte SANS partie : l'écran disparaît, l'accueil habituel demandera le pseudo
  SERVEUR.essais = 0; SERVEUR.export = { ok: true, serveurAt: 1, joueurs: { ligne: JSON.stringify(ligne(0, 0)) }, profils: [] };
  const m = monde(); const fini = m.A.demarrer(); let ok = false; fini.then(() => { ok = true; });
  m.els.sorealIdleApkBoutonV1.ecouteurs.click({ stopPropagation() {} });
  await attendre(() => ok);
  assert.equal(JSON.parse(m.stock.idle_apk_compte_v1).partie, false);
  assert.equal(m.stock.idle_apk_restauration_v1, undefined, "aucune partie à restaurer");
  assert.equal(m.body.ecran, null, "l'écran de connexion est retiré : l'accueil habituel demande le pseudo");

}
{ // pseudo : vérifié et réservé sur le serveur ; « déjà pris » est refusé
  const jeton = JSON.stringify({ jeton: "ils_" + "b".repeat(30), expire: 9e12 });
  const m = monde({ stock: { idle_apk_compte_v1: "{}", idle_apk_jeton_v1: jeton } });
  SERVEUR.pseudoRep = { ok: false, code: "PSEUDO_PRIS", message: "Ce pseudo est déjà pris." }; SERVEUR.pseudoStatus = 200; SERVEUR.pseudoAppels = [];
  const pris = await m.A.verifierPseudo("Redrum");
  assert.deepEqual([pris.ok, pris.code, pris.message], [false, "PSEUDO_PRIS", "Ce pseudo est déjà pris."], "un pseudo déjà pris est refusé avec le message du serveur");
  assert.deepEqual(SERVEUR.pseudoAppels, ["Redrum"]);
  SERVEUR.pseudoRep = { ok: true, pseudo: "Nouveau" };
  assert.equal(JSON.stringify(await m.A.verifierPseudo("Nouveau")), JSON.stringify({ ok: true, pseudo: "Nouveau" }), "pseudo libre : accepté (et réservé par le serveur)");
  SERVEUR.reseau = false;
  assert.equal((await m.A.verifierPseudo("Autre")).code, "PSEUDO_RESEAU", "sans internet : pas de pseudo non vérifié");
  SERVEUR.reseau = true;
  assert.equal((await monde({ stock: { idle_apk_compte_v1: "{}" } }).A.verifierPseudo("Z")).code, "PSEUDO_COMPTE", "sans compte connecté : refusé");
  assert.equal((await monde({ stock: { idle_apk_compte_v1: "{}", idle_apk_jeton_v1: JSON.stringify({ jeton: "ils_x", expire: 1 }) } }).A.verifierPseudo("Z")).code, "PSEUDO_COMPTE", "connexion expirée : refusé");
}

// ---------- branchements de la page
{
  const bridge = lire("../public/standalone-bridge.js"), ml = lire("../public/modules/moteur-local-v1.js"), html = lire("../public/index.html");
  assert.ok(bridge.includes("if(apk&&apk.requis())await apk.demarrer();") && bridge.includes("const relais=relaisParamsV1();"), "l'écran de connexion passe avant le démarrage du jeu ; la page du site gère le relais");
  assert.ok(bridge.includes('if(operation==="definirPseudoSorealIdle"){') && bridge.includes("apk.verifierPseudo(String(liste[1]||\"\"))"), "chaque pseudo est vérifié sur le serveur dans l'application");
  assert.ok(ml.includes("chargerFichier:async function(fichier){") && ml.includes('parler({type:"importer",fichier:fichier})'), "le moteur local charge une partie sans interface");
  assert.ok(html.indexOf("/modules/apk-connexion-v1.js") > 0 && html.indexOf("/modules/apk-connexion-v1.js") < html.indexOf("/standalone-bridge.js"), "module chargé avant le pont");
  assert.ok(!/localStorage\.\w+Item\((["'])soreal_idle_/.test(lire("../public/modules/apk-connexion-v1.js")), "clés propres à l'appareil (sans le préfixe recopié sur le serveur)");
}
console.log("idle-apk-connexion-v1 : OK");
