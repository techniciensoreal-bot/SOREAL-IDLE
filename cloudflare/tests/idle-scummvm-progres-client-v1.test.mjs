import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";

/*
 * Client du gain d'AP par progrès (modules/scummvm-progres-v1.js) sur un faux navigateur : un seul minuteur, lecture de l'autosave dans IndexedDB sans jamais créer la base,
 * action `scummvmProgres` envoyée seulement si le nombre d'unités a augmenté (jamais redescendant, mémoire liée au compte), format inconnu = aucun envoi, page : seulement les AP gagnés.
 * Les sauvegardes sont de vraies sauvegardes de Day of the Tentacle (cloudflare/tests/references/scummvm-tentacle-*-v1.bin).
 */
const srcSave = readFileSync("cloudflare/public/modules/scummvm-sauvegarde-v1.js", "utf8");
const srcProgres = readFileSync("cloudflare/public/modules/scummvm-progres-v1.js", "utf8");
const srcPage = readFileSync("cloudflare/public/modules/scummvm-page-v1.js", "utf8");
const debut = readFileSync("cloudflare/tests/references/scummvm-tentacle-debut-v1.bin");
const apres = readFileSync("cloudflare/tests/references/scummvm-tentacle-apres-v1.bin");
const CLE_FICHIER = "/home/web_user/saves/tentacle.s00";
const JEU = { id: "dott", nom: "Day of the Tentacle", dossier: "DOTT", cible: "tentacle", difficulte: "normal", ap: { plafond: 150000, parUnite: 53 } };

function faux(opts = {}) {
  const stock = {};
  const intervalles = [];
  const actions = [];
  const idb = { fichiers: opts.fichiers === undefined ? {} : opts.fichiers, ouvertures: 0, abandons: 0 };
  const sb = {
    console, Promise, Date, Math, JSON, Object, Array, String, Number, Boolean, Set, Error, DecompressionStream, Blob, Response, Uint8Array, DataView, Int32Array,
    atob: (s) => Buffer.from(s, "base64").toString("latin1"), btoa: (s) => Buffer.from(s, "latin1").toString("base64"),
    localStorage: { getItem: (k) => (k in stock ? stock[k] : null), setItem: (k, v) => { stock[k] = String(v); } },
    setTimeout: (f, ms) => { intervalles.push({ f, ms }); return intervalles.length; },
    indexedDB: {
      open() {
        idb.ouvertures += 1;
        const req = {};
        setTimeout(() => {
          if (idb.fichiers === null) {   /* la base n'existe pas : le navigateur la créerait (mise à niveau) ; le module doit l'abandonner */
            req.transaction = { abort() { idb.abandons += 1; } };
            if (req.onupgradeneeded) req.onupgradeneeded();
            if (req.onerror) req.onerror();
            return;
          }
          req.result = {
            objectStoreNames: { contains: (n) => n === "FILE_DATA" },
            close() {},
            transaction: () => ({ objectStore: () => ({ get: (k) => { const q = {}; setTimeout(() => { q.result = idb.fichiers[k]; if (q.onsuccess) q.onsuccess(); }, 0); return q; } }) }),
          };
          if (req.onsuccess) req.onsuccess();
        }, 0);
        return req;
      },
    },
    addEventListener() {},
    __actionMetaIdleV130__: opts.sansAction ? undefined : (p) => { actions.push(p); },
  };
  sb.window = sb;
  vm.createContext(sb);
  vm.runInContext(srcSave, sb);
  vm.runInContext(srcProgres, sb);
  const fichier = (buf, ts) => ({ contents: new Uint8Array(buf), timestamp: new Date(ts) });
  return { sb, stock, intervalles, actions, idb, P: sb.__SOREAL_IDLE_SCUMMVM_PROGRES_V1__, fichier };
}

/* 1. un seul minuteur (30 s), même si on démarre plusieurs fois ou avec un autre jeu ; un jeu sans « ap » n'en crée aucun */
{
  const f = faux();
  assert.equal(f.P.INTERVALLE_MS, 30000);
  f.P.demarrer({ id: "x", cible: "x", nom: "X" });
  assert.equal(f.intervalles.length, 0, "jeu sans gain d'AP : pas de minuteur");
  f.P.demarrer(JEU); f.P.demarrer(JEU); f.P.demarrer(Object.assign({}, JEU, { id: "autre", cible: "autre" }));
  assert.equal(f.intervalles.length, 1, "un seul minuteur");
  assert.equal(f.intervalles[0].ms, 30000);
}

/* 2. pas de base IndexedDB : rien d'envoyé, la base n'est pas créée (mise à niveau abandonnée) */
{
  const f = faux({ fichiers: null });
  f.P.demarrer(JEU);
  assert.equal(await f.P.verifier(), -1);
  assert.equal(f.idb.abandons, 1, "mise à niveau abandonnée : la base n'est pas créée");
  assert.equal(f.actions.length, 0);
  assert.equal(f.stock.soreal_idle_scummvm_progres_v1, undefined, "rien de mémorisé");
}

/* 3. début de partie : 0 unité, aucun envoi ; puis une unité de plus : UN envoi exact ; la même sauvegarde relue : aucun nouvel envoi */
{
  const f = faux({ fichiers: {} });
  f.P.demarrer(JEU);
  assert.equal(await f.P.verifier(), -1, "pas encore de fichier d'autosave");
  f.idb.fichiers[CLE_FICHIER] = f.fichier(debut, "2026-11-22T17:52:56.000Z");
  assert.equal(await f.P.verifier(), 0);
  assert.equal(f.actions.length, 0, "aucune unité : aucun appel");
  f.idb.fichiers[CLE_FICHIER] = f.fichier(apres, "2026-11-22T18:00:56.000Z");
  assert.equal(await f.P.verifier(), 1);
  assert.equal(f.actions.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(f.actions[0])), { action: "scummvmProgres", jeu: "dott", unites: 1, plafond: 150000, parUnite: 53 });
  assert.equal(await f.P.verifier(), 1, "même sauvegarde : rien à relire");
  assert.equal(f.actions.length, 1, "aucun nouvel envoi");
  /* une sauvegarde plus ancienne (autre horodatage) : l'ensemble « déjà vu » ne redescend jamais, donc aucun envoi */
  f.idb.fichiers[CLE_FICHIER] = f.fichier(debut, "2026-11-22T18:05:00.000Z");
  assert.equal(await f.P.verifier(), 1, "jamais redescendant");
  assert.equal(f.actions.length, 1);
  const m = JSON.parse(f.stock.soreal_idle_scummvm_progres_v1);
  assert.equal(m.dott.envoye, 1);
  assert.equal(typeof m.dott.vu, "string");
  assert.ok(f.stock.soreal_idle_scummvm_progres_v1.length < 8000, "valeur de préférence bornée (règle n°6)");
  assert.equal(f.P.compter(f.P.depuisBase64(m.dott.vu, 356)), 1, "ensemble mémorisé : 1 unité");
}

/* 4. nouvel appareil / page rechargée : la mémoire du compte (localStorage) évite tout double envoi du même état */
{
  const a = faux({ fichiers: {} });
  a.P.demarrer(JEU);
  a.idb.fichiers[CLE_FICHIER] = a.fichier(apres, "2026-11-22T18:00:56.000Z");
  await a.P.verifier();
  assert.equal(a.actions.length, 1);
  const b = faux({ fichiers: { [CLE_FICHIER]: b0(apres, "2026-11-22T18:00:56.000Z") } });
  function b0(buf, ts) { return { contents: new Uint8Array(buf), timestamp: new Date(ts) }; }
  b.stock.soreal_idle_scummvm_progres_v1 = a.stock.soreal_idle_scummvm_progres_v1;
  b.P.demarrer(JEU);
  assert.equal(await b.P.verifier(), 1);
  assert.equal(b.actions.length, 0, "déjà envoyé : rien");
  /* mémoire absente (nouvel appareil sans mémoire) : le nombre est renvoyé, le moteur ignore ce qui est déjà crédité */
  const c = faux({ fichiers: { [CLE_FICHIER]: b0(apres, "2026-11-22T18:00:56.000Z") } });
  c.P.demarrer(JEU);
  await c.P.verifier();
  assert.equal(c.actions.length, 1);
}

/* 5. format inconnu ou profil absent : aucun envoi, jamais de valeur devinée ; sans canal d'actions, on réessaiera */
{
  const f = faux({ fichiers: { [CLE_FICHIER]: { contents: new Uint8Array(Buffer.from("n'importe quoi, pas une sauvegarde")), timestamp: new Date() } } });
  f.P.demarrer(JEU);
  assert.equal(await f.P.verifier(), -1);
  assert.equal(f.actions.length, 0);
  const g = faux({ fichiers: { "/home/web_user/saves/inconnu.s00": { contents: new Uint8Array(apres), timestamp: new Date() } } });
  g.P.demarrer(Object.assign({}, JEU, { id: "inconnu", cible: "inconnu" }));
  assert.equal(await g.P.verifier(), -1, "cible sans profil de lecture");
  assert.equal(g.actions.length, 0);
  const h = faux({ fichiers: { [CLE_FICHIER]: { contents: new Uint8Array(apres), timestamp: new Date("2026-11-22T18:00:56.000Z") } }, sansAction: true });
  h.P.demarrer(JEU);
  await h.P.verifier();
  assert.equal(JSON.parse(h.stock.soreal_idle_scummvm_progres_v1).dott.envoye, 0, "pas de canal d'actions : non marqué envoyé");
  /* catalogue incomplet : ap sans parUnite ou plafond négatif = aucun gain */
  const i = faux({ fichiers: { [CLE_FICHIER]: { contents: new Uint8Array(apres), timestamp: new Date() } } });
  i.P.demarrer(Object.assign({}, JEU, { ap: { plafond: 150000 } }));
  assert.equal(await i.P.verifier(), -1);
  assert.equal(i.actions.length, 0);
}

/* 6. règle n°4 : un seul minuteur dans le code, aucun accès au DOM, aucune écriture dans la page ; règle n°6 : clé préfixée */
{
  const nu = srcProgres.replace(/\/\*[\s\S]*?\*\//g, "");
  assert.equal((nu.match(/setTimeout\(/g) || []).length, 1, "un seul minuteur dans le code");
  assert.ok(!/setInterval\(|document\.|innerHTML|requestAnimationFrame/.test(nu), "pas de setInterval (dette de l'audit), pas d'accès à la page");
  assert.ok(srcProgres.includes("soreal_idle_scummvm_progres_v1"));
  assert.ok(!/choix soreal|choix de soreal|choisie par soreal/i.test(srcProgres), "aucune constante SOREAL non inscrite");
}

/* 7. règle n°2 (anti-spoil) : la page ne montre que les AP déjà gagnés avec ce jeu, jamais le plafond ni le nombre d'unités */
{
  const sb = {
    console, Promise, Date, Math, JSON, Object, Array, String, Number, Boolean, Set, Error,
    localStorage: { getItem: () => null, setItem() {} }, navigator: {}, screen: {}, addEventListener() {},
    document: { addEventListener() {}, body: { appendChild() {} } },
    setTimeout: () => 1, requestAnimationFrame: () => 1, fetch: () => new Promise(() => {}),
  };
  sb.window = sb; sb.__SOREAL_IDLE_REG__ = {};
  vm.createContext(sb);
  vm.runInContext(srcPage, sb);
  const A = sb.__SOREAL_IDLE_SCUMMVM_PAGE_V1__;
  const j = (jeux) => ({ systemes: { systems: [{ id: "scummvm", state: { data: { jeux } } }] } });
  assert.equal(A.apCredites(j({ dott: { unites: 12, apCredite: 636 } }), JEU), 636);
  assert.equal(A.apCredites(j({}), JEU), 0, "jeu pas encore joué : 0");
  assert.equal(A.apCredites({ systemes: { systems: [] } }, JEU), 0);
  assert.equal(A.apCredites(j({ dott: { unites: 12, apCredite: "x" } }), JEU), 0);
  const nu = srcPage.replace(/\/\*[\s\S]*?\*\//g, "");
  const bloc = nu.slice(nu.indexOf("function apGagnes"), nu.indexOf("function page"));
  assert.ok(bloc.includes("AP gagnés avec ce jeu :") && bloc.includes("apCredites("), "texte : AP gagnés");
  assert.ok(!/plafond|parUnite|unites|\.ap\.|possibles/.test(bloc.replace("if(!jeuCourant||!jeuCourant.ap)return '';", "")), "ni plafond, ni unités, ni total dans le rendu");
  assert.ok(!/plafond|parUnite/.test(nu), "la page ne manipule ni le plafond ni les AP par unité");
}

/* 8. traduction anglaise du texte ajouté, et scripts chargés avant la page */
{
  const dico = JSON.parse(readFileSync("cloudflare/public/modules/traduction-anglais-dict-v1.json", "utf8"));
  assert.ok(dico["AP gagnés avec ce jeu :"], "traduction anglaise");
  const index = readFileSync("cloudflare/public/index.html", "utf8");
  const p = (n) => index.indexOf("/modules/" + n);
  assert.ok(p("scummvm-sauvegarde-v1.js") > 0 && p("scummvm-progres-v1.js") > p("scummvm-sauvegarde-v1.js") && p("scummvm-page-v1.js") > p("scummvm-progres-v1.js"), "sauvegarde, progrès puis page");
  assert.ok(p("scummvm-page-v1.js") < p("meta-progression-v130.js"), "avant le module méta");
}

console.log("idle-scummvm-progres-client-v1 OK");
