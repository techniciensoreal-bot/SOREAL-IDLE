import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { idleScummvmSauvegardesTraiterV1 } from "../src/idle-scummvm-sauvegardes-v1.js";

/*
 * « Recommencer la partie » (Norman, 2026-11-23) : serveur (action `effacer`, garde de date), client de synchro (effacer), suivi (reinitialiser), page (confirmation en deux étapes, iframe recréé une fois).
 */
const SYNC = readFileSync("cloudflare/public/modules/scummvm-sync-v1.js", "utf8");
const PROGRES = readFileSync("cloudflare/public/modules/scummvm-progres-v1.js", "utf8");
const PAGE = readFileSync("cloudflare/public/modules/scummvm-page-v1.js", "utf8");
const attendre = (ms = 30) => new Promise((r) => setTimeout(r, ms));

/* ---------- 1. serveur ---------- */
const db = new DatabaseSync(":memory:");
const sql = { exec(q, ...b) { const st = db.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return st.all(...b); st.run(...b); return []; } };
const NOW = 1_800_000_000_000;
const oui = async () => true, non = async () => false;
const b64 = (t) => Buffer.from(t).toString("base64");
const appel = (compte, corps, autorise = oui, maintenant = NOW) => idleScummvmSauvegardesTraiterV1(sql, compte, corps, { autorise, maintenant });
const ecrire = (compte, jeu, fichiers, extra = {}, maintenant = NOW) => appel(compte, { action: "ecrire", jeu, fichiers, ...extra }, oui, maintenant);
const lire = async (compte, jeu = "dott") => (await appel(compte, { action: "lire", jeu })).fichiers;
await ecrire("a@x.fr", "dott", [{ nom: "tentacle.s00", maj: NOW - 1000, donnees: b64("a0") }, { nom: "tentacle.s01", maj: NOW - 900, donnees: b64("a1") }, { nom: "timestamps", maj: NOW - 800, donnees: b64("ts") }]);
await ecrire("a@x.fr", "autre", [{ nom: "x.s00", maj: NOW - 1000, donnees: b64("autrejeu") }]);
await ecrire("b@x.fr", "dott", [{ nom: "tentacle.s00", maj: NOW - 1000, donnees: b64("b0") }]);

assert.equal((await appel("a@x.fr", { action: "effacer", jeu: "dott" }, non)).error, "SOREAL_IDLE_ACCES_REFUSE", "non autorisé : refus");
assert.equal((await lire("a@x.fr")).length, 3, "refus : rien n'est effacé");
assert.equal((await appel("a@x.fr", { action: "effacer", jeu: "Mauvais Jeu!" })).ok, false, "même forme d'identifiant de jeu");
assert.equal((await appel("", { action: "effacer", jeu: "dott" })).ok, false, "sans compte : refus");
let r = await appel("a@x.fr", { action: "effacer", jeu: "dott" });
assert.deepEqual(r, { ok: true, effaces: 3 });
assert.deepEqual(await lire("a@x.fr"), [], "toutes les lignes du jeu effacées");
assert.equal((await lire("a@x.fr", "autre")).length, 1, "un autre jeu intact");
assert.equal((await lire("b@x.fr")).length, 1, "un autre compte intact");
assert.deepEqual(await appel("a@x.fr", { action: "effacer", jeu: "dott" }), { ok: true, effaces: 0 }, "idempotent");

/* garde : un envoi plus ancien que l'effacement (autre appareil resté ouvert) est refusé en conflit, même avec force ; un plus récent est accepté */
await appel("a@x.fr", { action: "effacer", jeu: "dott" }, oui, NOW);
r = await ecrire("a@x.fr", "dott", [{ nom: "tentacle.s00", maj: NOW - 5000, donnees: b64("ancienne") }], {}, NOW + 1000);
assert.deepEqual(r.conflits, ["tentacle.s00"], "ancienne partie : conflit"); assert.deepEqual(await lire("a@x.fr"), []);
r = await ecrire("a@x.fr", "dott", [{ nom: "tentacle.s00", maj: NOW - 5000, donnees: b64("ancienne") }], { force: true }, NOW + 1000);
assert.deepEqual(r.conflits, ["tentacle.s00"], "force ne ressuscite pas l'ancienne partie"); assert.deepEqual(await lire("a@x.fr"), []);
r = await ecrire("a@x.fr", "dott", [{ nom: "tentacle.s00", maj: NOW + 500, donnees: b64("neuve") }, { nom: "tentacle.s01", maj: NOW - 1, donnees: b64("vieille") }], {}, NOW + 1000);
assert.deepEqual(r.conflits, ["tentacle.s01"]); assert.deepEqual((await lire("a@x.fr")).map((f) => f.nom), ["tentacle.s00"], "la nouvelle partie est acceptée");
assert.equal((await ecrire("b@x.fr", "dott", [{ nom: "tentacle.s01", maj: NOW - 5000, donnees: b64("b1") }])).conflits.length, 0, "la garde n'est que pour (compte, jeu) effacé");
assert.equal((await ecrire("a@x.fr", "autre", [{ nom: "x.s01", maj: NOW - 5000, donnees: b64("z") }])).conflits.length, 0);

/* ---------- 2. client de synchro ---------- */
function fauxSync({ base = true, serveurOk = true } = {}) {
  const magasin = new Map();
  const D = "/home/web_user/saves/";
  magasin.set("/home/web_user/saves", { mode: 16877 });
  for (const n of ["tentacle.s00", "tentacle.s05", "tentacle.s99", "timestamps", "autre.s00", "tentacle.sab"]) magasin.set(D + n, { contents: new Uint8Array([1]), timestamp: new Date(1), mode: 33206 });
  magasin.set("/home/web_user/scummvm.ini", { contents: new Uint8Array([2]) });
  const compteur = { ouvertures: 0, creations: 0, suppressionsBase: 0, posts: [] };
  const as = (f) => setTimeout(f, 0);
  const sb = {
    console, Promise, Date, Math, JSON, Object, Array, String, Number, Boolean, Set, Map, Uint8Array, Error,
    sessionStorage: { getItem: (k) => (k === "soreal_idle_session_v1" ? "jeton" : null) }, localStorage: { getItem: () => null },
    btoa: (s) => Buffer.from(s, "binary").toString("base64"), atob: (s) => Buffer.from(s, "base64").toString("binary"),
    document: { visibilityState: "visible", addEventListener() {}, createElement() { return { style: {}, setAttribute() {}, appendChild() {}, addEventListener() {} }; }, body: { appendChild() {} } },
    addEventListener() {}, setTimeout, clearTimeout,
    IDBKeyRange: { bound: (l, h) => ({ l, h }) },
    indexedDB: {
      deleteDatabase() { compteur.suppressionsBase++; },
      open(nom, version) {
        compteur.ouvertures++; if (version) compteur.creations++;
        const req = {};
        as(() => {
          if (!base) { if (req.onupgradeneeded) { req.result = {}; req.transaction = { abort() {} }; req.onupgradeneeded(); } if (req.onerror) req.onerror(); return; }
          req.result = {
            objectStoreNames: { contains: () => true }, close() {},
            transaction() {
              const tx = {};
              tx.objectStore = () => ({
                openCursor(plage) {
                  const q = {}; const cles = [...magasin.keys()].filter((k) => k >= plage.l && k <= plage.h).sort(); let i = 0;
                  const pas = () => as(() => {
                    if (i >= cles.length) { q.result = null; q.onsuccess(); as(() => tx.oncomplete && tx.oncomplete()); return; }
                    const k = cles[i++]; q.result = { key: k, value: magasin.get(k), continue: pas }; q.onsuccess();
                  });
                  pas(); return q;
                },
                delete(k) { magasin.delete(k); return {}; }, get() { return {}; }, put() { return {}; },
              });
              return tx;
            },
          };
          if (req.onsuccess) req.onsuccess();
        });
        return req;
      },
    },
    fetch: async (url, init) => {
      const corps = JSON.parse(init.body); compteur.posts.push(corps);
      if (!serveurOk) throw new Error("hors ligne");
      return { json: async () => ({ ok: true, effaces: 3 }) };
    },
  };
  sb.window = sb;
  vm.createContext(sb); vm.runInContext(SYNC, sb);
  return { sb, magasin, compteur, S: sb.__SOREAL_IDLE_SCUMMVM_SYNC_V1__ };
}
{
  const f = fauxSync();
  const r2 = await f.S.effacer({ id: "dott", cible: "tentacle" });
  assert.equal(JSON.stringify(r2), "{\"ok\":true}");
  assert.equal(JSON.stringify(f.compteur.posts), "[{\"action\":\"effacer\",\"jeu\":\"dott\"}]");
  const restes = [...f.magasin.keys()].sort();
  assert.deepEqual(restes, ["/home/web_user/saves", "/home/web_user/saves/autre.s00", "/home/web_user/saves/tentacle.sab", "/home/web_user/scummvm.ini"], "seuls .s00-.s99 et timestamps du jeu sont supprimés");
  assert.equal(f.compteur.creations, 0, "aucune création de base"); assert.equal(f.compteur.suppressionsBase, 0, "base jamais supprimée");
  assert.equal(Object.keys(f.S.etat.connu).length + Object.keys(f.S.etat.dernierTs).length, 0);
}
{
  const f = fauxSync({ serveurOk: false });
  const avant = [...f.magasin.keys()].length;
  const r2 = await f.S.effacer({ id: "dott", cible: "tentacle" });
  assert.equal(r2.ok, false); assert.equal(r2.message, "Impossible d’effacer pour l’instant, réessaie.");
  assert.equal(f.magasin.size, avant, "serveur injoignable : rien d'effacé localement");
  assert.equal(f.compteur.ouvertures, 0, "la base n'est même pas ouverte");
}
{
  const f = fauxSync({ base: false });
  assert.equal((await f.S.effacer({ id: "dott", cible: "tentacle" })).ok, true, "pas de base : rien à effacer, pas de création");
  assert.equal(f.compteur.creations, 0);
  assert.equal((await f.S.effacer({})).ok, false);
}

/* ---------- 3. suivi ---------- */
{
  const stock = { soreal_idle_scummvm_progres_v1: JSON.stringify({ dott: { vu: "AA==", troph: ["a"] }, autre: { vu: "AQ==" } }), soreal_idle_scummvm_journal_v1: JSON.stringify({ dott: [{ u: 1, t: 2 }], autre: [{ u: 3, t: 4 }] }) };
  const ecritures = [];
  const sb = { console, Promise, Date, Math, JSON, Object, Array, String, Number, Boolean, Set, Uint8Array, Error, setTimeout, clearTimeout, addEventListener() {},
    localStorage: { getItem: (k) => (k in stock ? stock[k] : null), setItem: (k, v) => { ecritures.push(["set", k]); stock[k] = String(v); }, removeItem: (k) => { ecritures.push(["rem", k]); delete stock[k]; } } };
  sb.window = sb; vm.createContext(sb); vm.runInContext(PROGRES, sb);
  const P = sb.__SOREAL_IDLE_SCUMMVM_PROGRES_V1__;
  P.reinitialiser("dott");
  assert.equal(stock.soreal_idle_scummvm_progres_v1, JSON.stringify({ autre: { vu: "AQ==" } }), "seul le jeu demandé est retiré");
  assert.equal(stock.soreal_idle_scummvm_journal_v1, JSON.stringify({ autre: [{ u: 3, t: 4 }] }));
  P.reinitialiser("autre");
  assert.ok(!("soreal_idle_scummvm_progres_v1" in stock) && !("soreal_idle_scummvm_journal_v1" in stock), "tout vide : la clé est retirée");
  P.reinitialiser("dott"); P.reinitialiser("");
  assert.ok(ecritures.every((e) => e[0] === "set" || e[0] === "rem"), "écriture seulement par setItem/removeItem");
  assert.ok(!/localStorage\[|localStorage\.[A-Za-z]+\s*=[^=]/.test(PROGRES), "aucune autre écriture du stockage");
}

/* ---------- 4. page ---------- */
function fauxPage() {
  const crees = [], iframes = [], timers = [];
  let zoneRecom = null, zone = null;
  const el = (tag) => {
    const e = {
      tag, children: [], style: {}, attrs: {}, listeners: {}, innerHTML: "", textContent: "", isConnected: true, parentNode: null, disabled: false, _classes: new Set(),
      setAttribute(k, v) { this.attrs[k] = v; }, getAttribute(k) { return this.attrs[k]; },
      appendChild(c) { this.children.push(c); c.parentNode = this; return c; },
      insertBefore(c) { this.children.push(c); c.parentNode = this; return c; },
      removeChild(c) { this.children = this.children.filter((x) => x !== c); c.parentNode = null; c.isConnected = false; return c; },
      addEventListener(t, f) { (this.listeners[t] = this.listeners[t] || []).push(f); },
      click() { (this.listeners.click || []).forEach((f) => f({ target: this })); },
      getBoundingClientRect() { return { left: 0, top: 0, width: 640, height: 400 }; },
      classList: { add: (c) => e._classes.add(c), remove: (c) => e._classes.delete(c), contains: (c) => e._classes.has(c), toggle: (c, on) => (on ? e._classes.add(c) : e._classes.delete(c)) },
    };
    Object.defineProperty(e, "firstChild", { get() { return e.children[0] || null; } });
    Object.defineProperty(e, "className", { get() { return [...e._classes].join(" "); }, set(v) { e._classes = new Set(String(v).split(/\s+/).filter(Boolean)); } });
    if (tag === "iframe") { Object.defineProperty(e, "src", { get() { return e._src; }, set(v) { e._src = v; } }); iframes.push(e); }
    crees.push(e); return e;
  };
  const stock = { soreal_idle_scummvm_etat_v1: "lance" };
  const sb = {
    console, Promise, Date, Math, JSON, Object, Array, String, Number, Boolean, Set, Error,
    localStorage: { getItem: (k) => (k in stock ? stock[k] : null), setItem: (k, v) => { stock[k] = String(v); } },
    navigator: {}, sessionStorage: { getItem: (k) => (k === "soreal_idle_session_v1" ? "s" : null) },
    document: { head: el("head"), body: el("body"), createElement: el, getElementById: (id) => (id === "scvZoneV1" ? zone : id === "scvRecomV1" ? zoneRecom : null), addEventListener() {} },
    setTimeout: (f, d) => { timers.push({ f, d, actif: true }); return timers.length; }, clearTimeout: (i) => { if (timers[i - 1]) timers[i - 1].actif = false; },
    requestAnimationFrame: () => 1, screen: {}, addEventListener() {}, alert() { throw new Error("alert natif"); }, confirm() { throw new Error("confirm natif"); },
  };
  sb.window = sb; sb.__SOREAL_IDLE_REG__ = { idleEtat: { systemes: { difficulty: "normal", systems: [{ id: "scummvm" }] } } };
  sb.fetch = async (url) => ({ ok: true, json: async () => (String(url).endsWith("scummvm-acces") ? { autorise: true, jeton: "jeton1234.signature-de-test-12345", expire: 4e9 } : { jeux: [{ id: "dott", nom: "DOTT", dossier: "d", cible: "tentacle", difficulte: "normal" }] }), arrayBuffer: async () => new ArrayBuffer(0), body: null });
  sb.__effacements = []; sb.__reinit = []; sb.__efface = { ok: true };
  sb.__SOREAL_IDLE_SCUMMVM_SYNC_V1__ = { reprendre: () => Promise.resolve(), suivre() {}, effacer: (j) => { sb.__effacements.push(j.id); return Promise.resolve(sb.__efface); } };
  sb.__SOREAL_IDLE_SCUMMVM_PROGRES_V1__ = { demarrer() {}, chargerTrophees: () => Promise.resolve(null), tropheesDe: () => null, reinitialiser: (id) => sb.__reinit.push(id) };
  vm.createContext(sb); vm.runInContext(PAGE, sb);
  return { sb, iframes, timers, el, stock, setZones: (z, r) => { zone = z; zoneRecom = r; } };
}
{
  const f = fauxPage(); await attendre();
  const A = f.sb.__SOREAL_IDLE_SCUMMVM_PAGE_V1__;
  const html = A.page(f.sb.__SOREAL_IDLE_REG__.idleEtat);
  assert.ok(/id="scvRecomV1"[^>]*data-morph-vivant/.test(html), "nœud persistant (règle n°4)");
  assert.ok(!/Recommencer|pourcent|%|progress/i.test(html), "aucun texte dans le HTML redessiné, aucune progression");
  const zone = f.el("div"), recom = f.el("span"); f.setZones(zone, recom);
  const hooks = f.sb.__SOREAL_IDLE_APRES_REDESSIN_V1__;
  hooks[0](); await attendre(); hooks[0](); await attendre(); hooks[0](); await attendre();
  assert.equal(f.iframes.length, 1, "un iframe au départ");
  const [bR, , bOui, bNon] = recom.children; const q = recom.children[1];
  assert.deepEqual(recom.children.map((c) => c.textContent), ["Recommencer la partie", "Effacer ma partie ?", "Oui, effacer", "Annuler", "Impossible d’effacer pour l’instant, réessaie."]);
  assert.ok(recom.children.every((c) => c.getAttribute("data-morph-garder") === ""), "boutons gardés par le morph");
  const visible = () => recom.children.slice(0, 4).map((c) => c.style.display !== "none");
  assert.deepEqual(visible(), [true, false, false, false], "état normal");
  const nb = f.timers.length;
  bR.click(); assert.deepEqual(visible(), [false, true, true, true], "confirmation en deux étapes");
  assert.equal(f.timers.length, nb + 1, "un seul setTimeout"); const t1 = f.timers[nb]; assert.equal(t1.d, 8000);
  hooks[0](); hooks[0](); assert.equal(f.timers.length, nb + 1, "un redessin ne crée aucune minuterie et garde l'étape");
  assert.deepEqual(visible(), [false, true, true, true]); assert.equal(recom.children[0], bR, "mêmes nœuds après redessin");
  bNon.click(); assert.deepEqual(visible(), [true, false, false, false], "Annuler : retour à l'état normal"); assert.equal(t1.actif, false, "minuterie annulée");
  assert.equal(f.sb.__effacements.length, 0); assert.equal(f.iframes.length, 1, "annuler ne touche pas à l'iframe");
  bR.click(); const t2 = f.timers[f.timers.length - 1]; t2.f(); assert.deepEqual(visible(), [true, false, false, false], "8 s sans action : retour à l'état normal");
  assert.equal(f.sb.__effacements.length, 0);
  /* Oui : effacer, réinitialiser, un iframe neuf, couverture revenue */
  bR.click(); const ancien = f.iframes[0]; const avantHotes = f.sb.document.body.children.length;
  bOui.click(); await attendre();
  assert.equal(f.sb.__effacements.join(), "dott"); assert.equal(f.sb.__reinit.join(), "dott");
  assert.equal(f.iframes.length, 2, "iframe recréé une seule fois"); assert.equal(ancien.parentNode, null, "l'ancien est retiré");
  assert.equal(f.sb.document.body.children.length, avantHotes, "même hôte");
  const hote = f.sb.document.body.children.find((c) => c.id === "scvHoteV1");
  assert.equal(hote.children.filter((c) => c.tag === "iframe").length, 1, "un seul iframe dans l'hôte");
  assert.equal(hote.children.find((c) => c.className === "scv-couv").style.display, "flex", "écran de couverture « Jouer » de retour");
  assert.ok(/Jouer/.test(hote.children.find((c) => c.className === "scv-couv").innerHTML));
  assert.deepEqual(visible(), [true, false, false, false]); assert.equal(recom.children[4].style.display, "none", "pas d'erreur");
  /* échec du serveur : message court, pas de réinitialisation du suivi */
  f.sb.__efface = { ok: false }; f.sb.__reinit.length = 0;
  bR.click(); bOui.click(); await attendre();
  assert.equal(f.sb.__reinit.length, 0, "échec : suivi conservé"); assert.notEqual(recom.children[4].style.display, "none", "erreur affichée");
  assert.equal(visible()[0], true);
  /* aucun jeu affiché : le bouton disparaît */
  const src = PAGE;
  assert.ok(!/\balert\s*\(|\bconfirm\s*\(/.test(src), "aucun alert/confirm natif");
  assert.equal((src.match(/setTimeout\(function\(\)\{rTimer=0/g) || []).length, 1, "un seul setTimeout pour la confirmation");
  assert.ok(!/setInterval/.test(src.split("« Recommencer la partie »")[1].split("plein écran ----------")[0]), "pas de minuterie en boucle");
}

/* ---------- 5. textes dans le dictionnaire anglais ---------- */
{
  const d = JSON.parse(readFileSync("cloudflare/public/modules/traduction-anglais-dict-v1.json", "utf8"));
  const att = { "Recommencer la partie": "Restart the game", "Effacer ma partie ?": "Erase my game?", "Oui, effacer": "Yes, erase", "Annuler": "Cancel", "Impossible d’effacer pour l’instant, réessaie.": "Unable to erase right now, try again." };
  for (const [fr, en] of Object.entries(att)) assert.equal(d[fr], en, fr);
}
console.log("OK idle-scummvm-recommencer-v1");
