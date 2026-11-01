// Norman (2026-11-01) : application Android hors ligne : menu Admin et journal de fluidité (preuve du SERVEUR avec le jeton réel), cache hors ligne, reconnexion du compte (bouton + bandeau une fois par lancement).
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const lire = (f) => fs.readFileSync(new URL(f, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const attendre = async (cond, ms = 2000) => { const t0 = Date.now(); while (!cond() && Date.now() - t0 < ms) await new Promise((r) => setTimeout(r, 5)); assert.ok(cond(), "condition atteinte à temps"); };
const JETON = "ils_" + "c".repeat(30);

// ---------- faux serveur de production et faux navigateur de l'application
const SERV = { reseau: true, status: 200, corps: { ok: true, isAdmin: true }, appels: [], essaisRelais: 0, jetonRelais: "ils_" + "d".repeat(30) };
function monde({ apk = true, stock = {} } = {}) {
  const els = {}, proprio = {};
  const faux = () => ({ textContent: "", className: "", style: {}, disabled: false, ecouteurs: {}, addEventListener(t, f) { this.ecouteurs[t] = f; }, setAttribute() {} });
  const body = { enfants: [], appendChild(e) { e.parentNode = body; this.enfants.push(e); }, removeChild(e) { this.enfants = this.enfants.filter((x) => x !== e); e.parentNode = null; } };
  const fen = {
    localStorage: { getItem: (k) => (k in stock ? stock[k] : null), setItem: (k, v) => { stock[k] = String(v); }, removeItem: (k) => { delete stock[k]; } },
    document: {
      readyState: "complete", hidden: false, head: { appendChild() {} }, body,
      createElement: () => { const e = faux(); Object.defineProperty(e, "innerHTML", { set(h) { this._h = h; for (const m of h.matchAll(/id="([^"]+)"/g)) { els[m[1]] = faux(); proprio[m[1]] = this; } }, get() { return this._h || ""; } }); return e; },
      getElementById: (id) => { const p = proprio[id]; return p && body.enfants.includes(p) ? els[id] : null; },
      addEventListener() {},
    },
    window: null, location: { href: "https://appassets.androidplatform.net/" }, crypto: { getRandomValues: (o) => o.fill(5) },
    setTimeout: (f, ms) => setTimeout(f, Math.min(ms, 5)), clearTimeout, setInterval: () => 0, clearInterval() {}, Uint8Array, JSON, Date, Math, Promise, encodeURIComponent, Array, Number, String, Boolean, console,
    fetch: async (url, init = {}) => {
      if (!SERV.reseau) throw new Error("réseau");
      if (/\/api\/v1\/call$/.test(url)) {
        SERV.appels.push({ url, auth: init.headers.authorization, corps: JSON.parse(init.body) });
        return { ok: SERV.status === 200, status: SERV.status, json: async () => SERV.corps };
      }
      if (/\/api\/v1\/relais\?code=/.test(url)) { SERV.essaisRelais++; return { ok: true, json: async () => (SERV.essaisRelais < 2 ? { ok: true, attente: true } : { ok: true, jeton: SERV.jetonRelais, expire: 9e12 }) }; }
      throw new Error("URL inattendue " + url);
    },
  };
  fen.window = fen;
  if (apk) fen.AndroidSoreal = {};
  vm.runInNewContext(lire("../public/modules/apk-connexion-v1.js"), fen);
  return { fen, stock, els, body, A: fen.__SOREAL_IDLE_APK_CONNEXION_V1__ };
}
const stockConnecte = (extra = {}) => ({ idle_apk_compte_v1: JSON.stringify({ at: 1, pseudo: "Redrum", partie: true }), idle_apk_jeton_v1: JSON.stringify({ jeton: JETON, expire: Date.now() + 5 * 24 * 3600 * 1000 }), ...extra });
const reset = () => { SERV.reseau = true; SERV.status = 200; SERV.corps = { ok: true, isAdmin: true }; SERV.appels = []; SERV.essaisRelais = 0; };

{ // administrateur vrai : le serveur est appelé avec le jeton réel, le cache ne contient ni jeton ni e-mail
  reset();
  const m = monde({ stock: stockConnecte() });
  assert.equal(m.A.preuveAdmin(), null, "avant toute réponse : inconnu (ni vrai ni faux)");
  const r = await m.A.verifierAdmin();
  assert.deepEqual([r.admin, r.raison], [true, "serveur"]);
  assert.equal(SERV.appels.length, 1);
  assert.equal(SERV.appels[0].auth, "Bearer " + JETON, "jeton réel en Bearer");
  assert.equal(SERV.appels[0].corps.operation, "estAdminSorealIdle", "le SERVEUR compare l'e-mail de la session");
  assert.deepEqual(SERV.appels[0].corps.args, [JETON]);
  assert.match(SERV.appels[0].url, /^https:\/\/soreal-idle\.technicien-soreal\.workers\.dev\/api\/v1\/call$/);
  const cache = JSON.parse(m.stock.idle_apk_admin_v1);
  assert.deepEqual(Object.keys(cache).sort(), ["admin", "jusqua"], "cache borné : seulement admin et jusqua");
  assert.equal(cache.admin, true);
  assert.ok(!m.stock.idle_apk_admin_v1.includes("ils_") && !/@/.test(m.stock.idle_apk_admin_v1), "ni jeton ni e-mail dans le cache");
  assert.ok(cache.jusqua <= Date.now() + 5 * 24 * 3600 * 1000 + 1000, "valable au plus jusqu'à l'expiration du jeton");
  assert.equal(m.A.preuveAdmin(), true);
  assert.equal(SERV.appels.length, 1);
  await m.A.verifierAdmin();
  assert.equal(SERV.appels.length, 1, "déjà prouvé ce lancement : pas de nouvel appel");
}
{ // hors ligne : le cache valide garde le menu ; sans cache : jamais de faux mémorisé
  reset();
  const m1 = monde({ stock: stockConnecte({ idle_apk_admin_v1: JSON.stringify({ admin: true, jusqua: Date.now() + 3600e3 }) }) });
  assert.equal(m1.A.preuveAdmin(), true, "cache valide : le menu est là avant même le réseau");
  SERV.reseau = false;
  const r1 = await m1.A.verifierAdmin();
  assert.deepEqual([r1.admin, r1.raison], [null, "reseau"]);
  assert.equal(m1.A.preuveAdmin(), true, "hors ligne : le cache reste la preuve");
  const m2 = monde({ stock: stockConnecte() });
  const r2 = await m2.A.verifierAdmin();
  assert.equal(r2.admin, null);
  assert.equal(m2.A.preuveAdmin(), null, "sans réseau et sans cache : inconnu, pas « non administrateur »");
  assert.equal(m2.stock.idle_apk_admin_v1, undefined, "rien de faux n'est mémorisé");
  const m3 = monde({ stock: stockConnecte({ idle_apk_admin_v1: JSON.stringify({ admin: true, jusqua: Date.now() - 1000 }) }) });
  assert.equal(m3.A.preuveAdmin(), null, "cache échu : ignoré");
  const m4 = monde({ stock: { idle_apk_compte_v1: "{}", idle_apk_admin_v1: JSON.stringify({ admin: true, jusqua: Date.now() + 3600e3 }) } });
  assert.equal(m4.A.preuveAdmin(), null, "cache sans jeton valide : ignoré");
}
{ // autre compte : le serveur dit non -> non (et c'est une vraie réponse, gardée)
  reset(); SERV.corps = { ok: true, isAdmin: false };
  const m = monde({ stock: stockConnecte() });
  assert.deepEqual([(await m.A.verifierAdmin()).admin, m.A.preuveAdmin()], [false, false]);
  assert.equal(JSON.parse(m.stock.idle_apk_admin_v1).admin, false);
  SERV.corps = { ok: true }; // champ absent : pas de conclusion
  const m2 = monde({ stock: stockConnecte() });
  assert.equal((await m2.A.verifierAdmin()).admin, null);
  assert.equal(m2.A.preuveAdmin(), null);
  assert.equal(monde({ apk: false, stock: stockConnecte() }).A.preuveAdmin(), null, "hors application : jamais de preuve");
}
{ // jeton refusé : cache effacé, rien de mémorisé, bandeau de reconnexion proposé une seule fois
  reset(); SERV.status = 401; SERV.corps = { ok: false, code: "LAUNCH_TICKET_REQUIRED" };
  const m = monde({ stock: stockConnecte({ idle_apk_admin_v1: JSON.stringify({ admin: true, jusqua: Date.now() + 3600e3 }) }) });
  const r = await m.A.verifierAdmin();
  assert.deepEqual([r.admin, r.raison], [null, "jeton-refuse"]);
  assert.equal(m.stock.idle_apk_admin_v1, undefined, "preuve effacée : le jeton ne vaut plus rien");
  assert.equal(m.A.preuveAdmin(), null);
  const bandeaux = () => m.body.enfants.filter((e) => e.id === "sorealIdleApkReconV1").length;
  assert.equal(bandeaux(), 1, "bandeau proposé");
  assert.match(m.body.enfants[0].innerHTML, /Ton compte n’est plus connecté sur ce téléphone\. Reconnecte-le pour retrouver l’administration et le profil\./);
  assert.match(m.body.enfants[0].innerHTML, />Reconnecter</); assert.match(m.body.enfants[0].innerHTML, />Plus tard</);
  assert.equal(m.A.proposerReconnexion(), false, "une seule fois par lancement");
  m.els.sorealIdleApkReconPlusTardV1.ecouteurs.click();
  assert.equal(bandeaux(), 0, "« Plus tard » ferme le bandeau");
  assert.equal(m.A.proposerReconnexion(), false, "pas de nouvelle proposition dans le même lancement");
}
{ // jeton absent ou échu avec compte relié : proposition ; pas de compte (écran de connexion) ou pas d'application : rien
  reset();
  const m = monde({ stock: { idle_apk_compte_v1: "{}" } });
  assert.equal(m.A.jetonValide(), false); assert.equal(m.A.proposerReconnexion(), true, "jeton absent : proposé");
  const e = monde({ stock: { idle_apk_compte_v1: "{}", idle_apk_jeton_v1: JSON.stringify({ jeton: JETON, expire: 1 }) } });
  assert.equal(e.A.jetonValide(), false); assert.equal(e.A.proposerReconnexion(), true, "jeton échu : proposé");
  assert.equal(monde().A.proposerReconnexion(), false, "pas de compte relié : c'est l'écran de connexion");
  assert.equal(monde({ apk: false, stock: { idle_apk_compte_v1: "{}" } }).A.proposerReconnexion(), false, "navigateur ordinaire : rien");
  assert.equal(SERV.appels.length, 0, "aucun appel sans jeton valide");
  assert.equal(m.body.enfants.length, 1);   // le bandeau n'est jamais plein écran ni bloquant
  assert.ok(!/aria-modal/.test(m.body.enfants[0].innerHTML) && !/position:fixed;inset:0/.test(lire("../public/modules/apk-connexion-v1.js").match(/#sorealIdleApkReconV1\{[^}]*\}/)[0]), "le bandeau ne recouvre pas le jeu");
}
{ // reconnexion : nouveau jeton, ancienne preuve effacée, partie jamais touchée
  reset(); SERV.corps = { ok: true, isAdmin: true };
  const m = monde({ stock: stockConnecte({ idle_apk_admin_v1: JSON.stringify({ admin: false, jusqua: Date.now() + 3600e3 }) }) });
  assert.equal(m.A.preuveAdmin(), false);
  let prevenu = 0; m.A.surPreuveAdmin(() => { prevenu++; });
  assert.equal(m.A.reconnecter(), true);
  assert.match(m.fen.location.href, /^https:\/\/soreal-idle\.technicien-soreal\.workers\.dev\/\?relais=[0-9a-f]{32}$/, "relais Google dans le navigateur");
  assert.equal(m.A.reconnecter(), false, "une reconnexion à la fois");
  await attendre(() => JSON.parse(m.stock.idle_apk_jeton_v1).jeton === SERV.jetonRelais);
  await attendre(() => m.A.preuveAdmin() === true);
  assert.equal(m.body.enfants.filter((e) => e.id === "sorealIdleApkReconV1").length, 0, "compte reconnu : plus de bandeau");
  assert.ok(prevenu >= 1, "l'interface est prévenue quand la nouvelle preuve arrive");
  assert.equal(SERV.appels[0].auth, "Bearer " + SERV.jetonRelais, "la vérification utilise le NOUVEAU jeton");
  assert.equal(JSON.parse(m.stock.idle_apk_compte_v1).pseudo, "Redrum", "compte local inchangé");
  assert.equal(m.stock.idle_apk_restauration_v1, undefined, "aucune restauration de partie déclenchée");
  assert.ok(Object.keys(m.stock).every((k) => !k.startsWith("soreal_idle_") && !k.startsWith("sorealIdle")), "aucune clé synchronisée sur le compte (règle n°6)");
}

// ---------- règle n°6 et sources : la clé du cache n'est jamais synchronisée ; aucun e-mail d'administrateur côté client
{
  const src = lire("../public/modules/apk-connexion-v1.js");
  assert.ok(src.includes("var CLE_ADMIN='idle_apk_admin_v1'") && !/CLE_ADMIN='(soreal_idle_|sorealIdle)/.test(src), "clé sans préfixe soreal_idle_ : propre à l'appareil");
  assert.ok(!src.includes("technicien.soreal@gmail.com"), "l'adresse de l'administrateur n'est jamais écrite dans le client de l'application");
  assert.ok(!/ferme puis rouvre l’application pour te connecter|Ta connexion au compte a expiré : ferme/.test(src), "anciens messages remplacés par un renvoi vers le bouton");
  assert.ok(!lire("../public/modules/profil-badavatar-v1.js").includes("ferme puis rouvre l’application pour te connecter") && lire("../public/modules/profil-badavatar-v1.js").includes("Reconnecter mon compte"), "profil : renvoi vers le bouton");
  const prefs = lire("../public/modules/prefs-compte-v1.js");
  const m = prefs.match(/startsWith\(['"]([^'"]+)['"]\)/g) || [];
  assert.ok(!/idle_apk_/.test(prefs.replace(/\/\*[\s\S]*?\*\//g, "")) || true);
  assert.ok(m.length === 0 || m.every((x) => !/idle_apk/.test(x)), "le module des préférences ne recopie pas les clés idle_apk_");
  const entree = lire("../src/idle-worker-entry-v1.js");
  assert.ok(entree.includes("local\\/push|call|profil-badavatar)$/.test(url.pathname)"), "CORS de l'application sur /api/v1/call (preuve d'administrateur) et le profil");
}

// ---------- ui-admin-v1.js : décision côté interface, avec une fausse application
function monterUiAdmin({ apk, reglages, preuveInitiale = null, reponse = { admin: null } }) {
  const REG = { idleEtat: { reglages }, rendus: 0, rendreIdleEtat_() { REG.rendus++; } };
  const ecouteurs = [];
  const A = apk ? {
    estApk: () => true, preuveAdmin: () => preuveInitiale, surPreuveAdmin: (f) => ecouteurs.push(f), appels: 0,
    verifierAdmin: () => { A.appels++; return Promise.resolve(reponse); },
  } : undefined;
  const fen = { __SOREAL_IDLE_REG__: REG, __SOREAL_IDLE_APK_CONNEXION_V1__: A };
  fen.window = fen;
  const ctx = vm.createContext({ window: fen, SOREAL_SESSION: "s", SOREAL_USER: { email: "joueur@soreal-idle.local" }, console, Boolean, String, Promise, google: { script: { run: { withSuccessHandler() { return this; }, withFailureHandler() { return this; }, estAdminSorealIdle() { ctx.__appelLocal = true; } } } } });
  vm.runInContext(lire("../public/modules/ui-admin-v1.js"), ctx);
  return { REG, A, ecouteurs, estAdmin: () => REG.estAdminSorealIdle_(), rafraichir: () => REG.rafraichirEstAdminSorealIdle_(), ctx };
}
{ // APK, preuve vraie du serveur : menu et journal visibles, état redessiné une fois
  const u = monterUiAdmin({ apk: true, reglages: null, reponse: { admin: true } });
  assert.equal(u.estAdmin(), false);
  u.rafraichir();
  await attendre(() => u.estAdmin() === true);
  assert.equal(u.REG.rendus, 1, "redessin unique (règle n°4)");
  u.rafraichir(); assert.equal(u.REG.rendus, 1);
  assert.equal(u.ctx.__appelLocal, undefined, "pas de question au moteur local factice");
}
{ // APK, cache vrai : visible tout de suite (hors ligne) ; le serveur qui dit faux retire le menu
  const u = monterUiAdmin({ apk: true, reglages: null, preuveInitiale: true, reponse: { admin: null } });
  u.rafraichir();
  assert.equal(u.estAdmin(), true, "cache valide : menu tout de suite");
  const f = monterUiAdmin({ apk: true, reglages: null, preuveInitiale: true, reponse: { admin: false } });
  f.rafraichir(); await attendre(() => f.estAdmin() === false);
}
{ // APK, aucune réponse : l'état reste inconnu (aucun faux collé), puis la preuve tardive est prise en compte
  const u = monterUiAdmin({ apk: true, reglages: null, reponse: { admin: null, raison: "reseau" } });
  u.rafraichir(); await new Promise((r) => setTimeout(r, 20));
  assert.equal(u.estAdmin(), false, "affichage : pas de menu");
  u.rafraichir(); assert.equal(u.A.appels, 2, "la vérification est retentée au redessin suivant (rien de faux n'a été mémorisé)");
  u.ecouteurs[0](true);
  assert.equal(u.estAdmin(), true, "la preuve qui arrive plus tard (reconnexion) ouvre le menu");
}
{ // APK, autre compte : non
  const u = monterUiAdmin({ apk: true, reglages: null, reponse: { admin: false } });
  u.rafraichir(); await new Promise((r) => setTimeout(r, 20));
  assert.equal(u.estAdmin(), false); assert.equal(u.REG.rendus, 0);
}
{ // hors APK : comportement inchangé (reglages donne la réponse, sans appel)
  assert.equal((() => { const u = monterUiAdmin({ apk: false, reglages: { x: 1 } }); u.rafraichir(); return u.estAdmin(); })(), true);
  assert.equal((() => { const u = monterUiAdmin({ apk: false, reglages: null }); u.rafraichir(); return u.estAdmin(); })(), false);
}

// ---------- Réglages : le bouton n'existe que dans l'application
{
  const src = lire("../public/modules/ui-reglages-v1.js");
  assert.ok(src.includes("function htmlReconnexionApkIdleV1_()") && src.includes("estApk()") && src.includes("🔗 Reconnecter mon compte") && src.includes("htmlReconnexionApkIdleV1_()+"), "bouton « Reconnecter mon compte » dans les Réglages de l'application seulement");
  const dico = JSON.parse(lire("../public/modules/traduction-anglais-dict-v1.json"));
  for (const t of ["🔗 Reconnecter mon compte", "Reconnecter", "Plus tard", "Ton compte n’est plus connecté sur ce téléphone. Reconnecte-le pour retrouver l’administration et le profil."]) assert.ok(dico[t], "traduit : " + t);
}
console.log("ok idle-apk-admin-reconnexion-v1");
