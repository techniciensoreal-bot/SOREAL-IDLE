// Norman (2026-10-30) : l'APK hors ligne doit REVENDIQUER la partie du compte auprès du vrai serveur (un seul appareil joue à la fois, règle n°7), envoyer ses sauvegardes, et ne jamais écraser une progression plus récente.
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const lire = (f) => fs.readFileSync(new URL(f, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const entree = lire("../src/idle-worker-entry-v1.js"), sync = lire("../src/idle-local-sync-v1.js"), html = lire("../public/index.html"), source = lire("../public/modules/apk-synchro-v1.js");

// ---------- contenu : serveur (CORS limité à l'application, export qui revendique, push) et page
assert.ok(entree.includes("(relais|pseudo|local\\/export|local\\/push)$/"), "CORS de l'application aussi sur l'envoi des sauvegardes");
assert.ok(entree.includes('return idleAvecCorsApkV1(corsApk, await idleLocalV1(request, env, "local-push"))'), "la réponse du push porte les en-têtes CORS");
assert.ok(sync.includes("if (!lectureSeule) revendiquer(") && sync.includes('p.importPartie === true ? "avant-import"'), "export sans lecture seule = revendication ; premier envoi = copie « avant-import »");
assert.ok(sync.includes("Number(p.depuis) < Number(propre.vu)) return { ok: false, conflit: true"), "le serveur refuse un envoi parti avant la dernière revendication");
assert.ok(!/export\?lecture=1/.test(source) && /\/api\/v1\/local\/export\?appareil=/.test(source), "la revendication n'est PAS une lecture seule");
assert.ok(html.indexOf("/modules/apk-connexion-v1.js") > 0 && html.indexOf("/modules/apk-connexion-v1.js") < html.indexOf("/modules/apk-synchro-v1.js"), "module chargé après la connexion");
assert.ok(!/localStorage\.\w+Item\((["'])soreal_idle_/.test(source) && !/'soreal_idle_/.test(source.replace(/\/\*[\s\S]*?\*\//g, "")), "clés propres à l'appareil (jamais recopiées avec les préférences du compte)");

// ---------- comportement avec un faux navigateur
const SERVEUR = { reseau: true, export: null, pushReponse: { ok: true, ecrit: true }, appels: [] };
function monde({ apk = true, stock = {} } = {}) {
  const body = { appendChild(e) { (this.enfants = this.enfants || []).push(e); } };
  const fen = {
    localStorage: { getItem: (k) => (k in stock ? stock[k] : null), setItem: (k, v) => { stock[k] = String(v); }, removeItem: (k) => { delete stock[k]; } },
    document: { hidden: false, body, getElementById: (id) => (body.enfants || []).find((e) => e.id === id) || null, createElement: () => ({ style: {}, setAttribute() {}, set innerHTML(h) { this._h = h; }, get innerHTML() { return this._h; } }), addEventListener() {} },
    location: { reload() { fen.rechargements = (fen.rechargements || 0) + 1; } }, crypto: { getRandomValues: (o) => o.fill(9) },
    setTimeout: (f) => setTimeout(f, 1), setInterval: () => 0, clearTimeout, addEventListener() {},
    Uint8Array, JSON, Date, Math, Promise, Array, Number, String, Boolean, Object, Error, encodeURIComponent, console,
    fetch: async (url, init = {}) => {
      if (!SERVEUR.reseau) throw new Error("réseau");
      const corps = init.body ? JSON.parse(init.body) : null;
      SERVEUR.appels.push({ url, auth: init.headers && init.headers.authorization, corps });
      if (/\/api\/v1\/local\/export\?appareil=/.test(url)) return { ok: true, status: 200, json: async () => SERVEUR.export };
      if (/\/api\/v1\/local\/push$/.test(url)) return { ok: true, status: 200, json: async () => SERVEUR.pushReponse };
      throw new Error("URL inattendue " + url);
    },
  };
  fen.window = fen;
  if (apk) fen.AndroidSoreal = {};
  vm.runInNewContext(source, fen);
  return { fen, stock, body, S: fen.__SOREAL_IDLE_APK_SYNCHRO_V1__ };
}
const ligne = (ren, boss, synchro, nom = "Joueur") => { const c = new Array(38).fill(""); c[0] = "id"; c[1] = nom; c[14] = boss; c[15] = synchro; c[24] = ren; c[37] = "{}"; return c; };
const JETON = JSON.stringify({ jeton: "ils_" + "a".repeat(30), expire: 9e12 });
function moteurFaux(locale) {
  const m = { charges: [], locale, etatDiag: () => ({ demarre: true }), exporterLigne: async () => m.locale, chargerFichier: async (f) => { m.charges.push(f); m.locale = f.cells.slice(); m.locale[15] = "local-apres-chargement"; return { ok: true }; } };
  return m;
}
const attendre = async (cond, ms = 2000) => { const t0 = Date.now(); while (!cond() && Date.now() - t0 < ms) await new Promise((r) => setTimeout(r, 5)); assert.ok(cond(), "condition atteinte à temps"); };
const exportSrv = (cells) => ({ ok: true, serveurAt: 5000, joueurs: { ligne: JSON.stringify(cells) } });

{ // pas dans l'application : rien ne part
  SERVEUR.appels = [];
  const m = monde({ apk: false, stock: { idle_apk_compte_v1: "{}", idle_apk_jeton_v1: JETON } });
  assert.equal(m.S.etat().pret, false); assert.equal(SERVEUR.appels.length, 0, "navigateur ordinaire : aucun appel");
}
{ // décision (fonction pure)
  const m = monde(); const d = m.S.decider;
  const base = { srv: "S1", loc: "L1" };
  assert.equal(d(ligne(0, 5, "L2"), ligne(0, 5, "S1"), base), "local", "serveur inchangé depuis la base : la partie du téléphone est la suite");
  assert.equal(d(ligne(0, 5, "L1"), ligne(0, 9, "S2"), base), "serveur", "le PC a joué, le téléphone non : celle du serveur");
  assert.equal(d(ligne(0, 20, "L2"), ligne(0, 9, "S2"), base), "local", "les deux ont bougé : la plus avancée (téléphone)");
  assert.equal(d(ligne(0, 9, "L2"), ligne(1, 2, "S2"), base), "serveur", "les deux ont bougé : la plus avancée (serveur, une renaissance de plus)");
  assert.equal(d(ligne(0, 9, "L2"), ligne(0, 9, "S2"), base), "serveur", "égalité avec une base : le serveur");
  assert.equal(d(ligne(0, 9, "L2"), ligne(0, 9, "S2"), null), "local", "égalité sans base : le téléphone");
  assert.equal(d(ligne(0, 3, "L2"), ligne(0, 9, "S2"), null), "serveur", "sans base, le serveur plus avancé gagne : jamais écrasé");
}
{ // démarrage en ligne : REVENDIQUE (export sans lecture seule), puis envoie sa partie si elle est la suite
  SERVEUR.appels = []; SERVEUR.reseau = true; SERVEUR.pushReponse = { ok: true, ecrit: true };
  SERVEUR.export = exportSrv(ligne(0, 5, "S1"));
  const m = monde({ stock: { idle_apk_jeton_v1: JETON, idle_apk_base_serveur_v1: JSON.stringify({ srv: "S1", loc: "L1" }) } });
  m.S.etat().moteur = moteurFaux(ligne(0, 7, "L2"));
  const res = await m.S.synchroniser();
  assert.equal(res, "local");
  const [exp, push] = SERVEUR.appels;
  assert.match(exp.url, /\/api\/v1\/local\/export\?appareil=apk[0-9a-f]{16}$/, "export avec l'identifiant de l'appareil : revendication");
  assert.ok(!/lecture=1/.test(exp.url), "pas en lecture seule");
  assert.ok(exp.auth.startsWith("Bearer ils_"), "jeton de session du compte");
  assert.match(push.url, /\/api\/v1\/local\/push$/); assert.equal(push.corps.cells[24], 0); assert.equal(push.corps.cells[14], 7, "la ligne du téléphone part");
  assert.equal(push.corps.depuis, 5000, "« depuis » = l'instant de l'export (le serveur refuse si le PC a repris entre-temps)");
  assert.equal(push.corps.importPartie, true, "premier envoi : copie de sécurité « avant-import » côté serveur");
  assert.equal(push.corps.appareil, exp.url.split("=")[1], "même appareil pour l'export et l'envoi");
  assert.equal(JSON.parse(m.stock.idle_apk_base_serveur_v1).srv, "L2", "base mise à jour après un envoi accepté");
  // envoi périodique : rien si rien n'a changé ; sinon sans importPartie
  SERVEUR.appels = [];
  assert.equal(await m.S.tick(false), false); assert.equal(SERVEUR.appels.length, 0, "ligne inchangée : rien à envoyer");
  m.S.etat().moteur.locale = ligne(0, 8, "L3");
  assert.equal(await m.S.tick(false), true);
  assert.equal(SERVEUR.appels[0].corps.importPartie, undefined, "envois suivants : sans importPartie");
}
{ // le PC a joué pendant ce temps : celle du serveur est chargée, la partie du téléphone est mise de côté
  SERVEUR.appels = []; SERVEUR.export = exportSrv(ligne(0, 40, "S9", "Redrum"));
  const m = monde({ stock: { idle_apk_jeton_v1: JETON, idle_apk_base_serveur_v1: JSON.stringify({ srv: "S1", loc: "L1" }) } });
  const loc = ligne(0, 10, "L2"); m.S.etat().moteur = moteurFaux(loc);
  const res = await m.S.synchroniser();
  assert.equal(res, "serveur-charge");
  assert.equal(SERVEUR.appels.filter((a) => /push/.test(a.url)).length, 0, "rien n'est envoyé : jamais un état plus ancien sur un plus récent");
  assert.equal(m.S.etat().moteur.charges.length, 1); assert.equal(m.S.etat().moteur.charges[0].cells[14], 40);
  assert.equal(JSON.parse(m.stock.idle_apk_sauvegarde_locale_v1).cells[14], 10, "la partie du téléphone est gardée de côté");
  assert.equal(JSON.parse(m.stock.idle_apk_base_serveur_v1).srv, "S9", "base = ce qu'on sait du serveur");
  await attendre(() => m.fen.rechargements === 1);
}
{ // conflit (le PC a repris la partie) : l'écran « Partie reprise sur un autre appareil », plus aucun envoi
  SERVEUR.export = exportSrv(ligne(0, 5, "S1")); SERVEUR.pushReponse = { ok: false, conflit: true, error: "IDLE_PARTIE_REPRISE_AILLEURS" };
  const m = monde({ stock: { idle_apk_jeton_v1: JETON } });
  m.S.etat().moteur = moteurFaux(ligne(0, 7, "L2"));
  await m.S.synchroniser();
  assert.ok(m.fen.document.getElementById("sorealIdleApkConflitV1"), "écran de conflit affiché");
  assert.match(m.fen.document.getElementById("sorealIdleApkConflitV1").innerHTML, /Partie reprise sur un autre appareil/);
  SERVEUR.appels = []; m.S.etat().moteur.locale = ligne(0, 9, "L3");
  assert.equal(await m.S.tick(true), false); assert.equal(SERVEUR.appels.length, 0, "après un conflit : plus d'envoi");
}
{ // envoi reçu mais refusé (serveur plus récent) : retenté, jamais compté comme sauvegardé
  SERVEUR.export = exportSrv(ligne(0, 5, "S1")); SERVEUR.pushReponse = { ok: true, ecrit: false };
  const m = monde({ stock: { idle_apk_jeton_v1: JETON } });
  m.S.etat().moteur = moteurFaux(ligne(0, 7, "L2"));
  assert.equal(await m.S.synchroniser(), "local-refuse");
  assert.equal(m.stock.idle_apk_base_serveur_v1, undefined, "base non avancée");
  SERVEUR.pushReponse = { ok: true, ecrit: true };
  assert.equal(await m.S.tick(false), true, "retenté et accepté ensuite");
  assert.equal(SERVEUR.appels[SERVEUR.appels.length - 1].corps.importPartie, true, "la copie « avant-import » reste demandée tant qu'aucun envoi n'a été accepté");
}
{ // hors ligne ou sans jeton : on joue en local, rien n'est écrasé ni envoyé
  SERVEUR.reseau = false; SERVEUR.appels = [];
  const m = monde({ stock: { idle_apk_jeton_v1: JETON } }); m.S.etat().moteur = moteurFaux(ligne(0, 7, "L2"));
  assert.equal(await m.S.synchroniser(), "hors-ligne"); assert.equal(m.S.etat().pret, false);
  SERVEUR.reseau = true;
  const exp = monde({ stock: { idle_apk_jeton_v1: JSON.stringify({ jeton: "ils_x", expire: 1 }) } }); exp.S.etat().moteur = moteurFaux(ligne(0, 7, "L2"));
  assert.equal(await exp.S.synchroniser(), "sans-jeton", "jeton expiré : aucune requête"); assert.equal(SERVEUR.appels.length, 0);
  SERVEUR.export = { ok: false, error: "IDLE_LOCAL_DESACTIVE" };
  const off = monde({ stock: { idle_apk_jeton_v1: JETON } }); off.S.etat().moteur = moteurFaux(ligne(0, 7, "L2"));
  assert.equal(await off.S.synchroniser(), "refuse"); assert.equal(await off.S.tick(true), false, "interrupteur général / session refusée : plus rien n'est envoyé");
}
console.log("idle-apk-revendique-v1 : OK");
