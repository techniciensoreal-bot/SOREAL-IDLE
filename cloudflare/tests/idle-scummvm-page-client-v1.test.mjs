import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";

/*
 * Module client de la page « Énigmes » (modules/scummvm-page-v1.js) sur un faux navigateur : un seul iframe, jamais recréé ni déplacé après un redessin,
 * choix du jeu par difficulté, catalogue vide, URL de lancement exacte, rien d'autre que le nom du jeu courant dans la page (règle n°2).
 */
const code = readFileSync("cloudflare/public/modules/scummvm-page-v1.js", "utf8");
const JETON = "jeton1234.signature-de-test-12345";
const BASE = "/api/idle/scummvm/" + JETON + "/";

function faux(opts = {}) {
  const stock = {};
  const crees = [];
  const iframes = [];
  let zone = null;
  const el = (tag) => {
    const e = {
      tag, children: [], style: {}, attrs: {}, listeners: {}, innerHTML: "", textContent: "", isConnected: true, parentCount: 0, _classes: new Set(),
      setAttribute(k, v) { this.attrs[k] = v; }, getAttribute(k) { return this.attrs[k]; },
      appendChild(c) { this.children.push(c); c.parentCount += 1; return c; },
      insertBefore(c) { this.children.push(c); c.parentCount += 1; return c; },
      addEventListener(t, f) { (this.listeners[t] = this.listeners[t] || []).push(f); },
      getBoundingClientRect() { return { left: 10, top: 20, width: 640, height: 400 }; },
      classList: { add: (c) => e._classes.add(c), remove: (c) => e._classes.delete(c), contains: (c) => e._classes.has(c), toggle: (c, on) => (on ? e._classes.add(c) : e._classes.delete(c)) },
    };
    Object.defineProperty(e, "className", { get() { return [...e._classes].join(" "); }, set(v) { e._classes = new Set(String(v).split(/\s+/).filter(Boolean)); } });
    if (tag === "iframe") { e.contentWindow = null; Object.defineProperty(e, "src", { get() { return e._src; }, set(v) { e._src = v; e.srcAffectations = (e.srcAffectations || 0) + 1; } }); iframes.push(e); }
    crees.push(e);
    return e;
  };
  const timers = [];
  const sb = {
    console, Promise, Date, Math, JSON, Object, Array, String, Number, Boolean, Set, Error,
    localStorage: { getItem: (k) => (k in stock ? stock[k] : null), setItem: (k, v) => { stock[k] = String(v); } },
    navigator: { maxTouchPoints: 0 },
    sessionStorage: { getItem: (k) => (k === "soreal_idle_session_v1" && sb.__session ? sb.__session : null) },
    document: {
      head: el("head"), body: el("body"),
      createElement: el,
      getElementById: (id) => (id === "scvZoneV1" ? zone : null),
      addEventListener() {},
    },
    setTimeout: (f, d) => { timers.push([f, d]); return timers.length; },
    requestAnimationFrame: () => 1,
    screen: {}, addEventListener() {},
  };
  sb.window = sb;
  sb.__SOREAL_IDLE_REG__ = {};
  sb.__appels = []; sb.__ouvert = true; sb.__session = "session-de-test"; sb.__jeton = JETON; sb.__expire = 4e9; sb.__posts = [];
  /* accès par compte (2026-11-22) : POST /api/v1/scummvm-acces -> {autorise, jeton, expire} ; tous les fichiers sous /api/idle/scummvm/<jeton>/ */
  sb.fetch = async (url, init) => { if (init && init.method === "POST") sb.__posts.push({ url: String(url), init }); return (sb.__appels.push(String(url)), { ok: true, json: async () => (String(url).endsWith("/api/v1/scummvm-acces") ? (sb.__ouvert ? { ok: true, autorise: true, jeton: sb.__jeton, expire: sb.__expire } : { ok: true, autorise: false }) : String(url).endsWith("jeux.json") ? sb.__catalogue : {}), arrayBuffer: async () => new ArrayBuffer(0), body: null }); };
  sb.__catalogue = { jeux: [] };
  vm.createContext(sb);
  const demarrer = () => vm.runInContext(code, sb);
  if (!opts.differe) demarrer();
  return { demarrer, sb, stock, iframes, timers, setZone: (z) => { zone = z; }, el };
}
const attendre = () => new Promise((r) => setTimeout(r, 15));
const jeux = [
  { id: "a-n", nom: "Jeu Normal", dossier: "dossier-n", cible: "cn", difficulte: "normal" },
  { id: "a-e", nom: "Jeu Evil", dossier: "dossier-e", cible: "ce", difficulte: "evil" },
];

/* 0. Langue (Norman, 2026-11-22 : sous-titres en français si le jeu est en français, en anglais s'il est en anglais) : dossier par langue, sous-titres toujours demandés, repli sur le français puis sur « dossier » */
{
  const jeu2 = { id: "x", nom: "X", dossier: "base", dossiers: { fr: "d-fr", en: "d-en" }, cible: "c", difficulte: "normal" };
  const f1 = faux(); const A1 = f1.sb.__SOREAL_IDLE_SCUMMVM_PAGE_V1__;
  assert.equal(A1.dossierDe(jeu2), "d-fr", "français par défaut");
  assert.ok(A1.urlLancement(jeu2).endsWith("#--path=/data/games/d-fr --subtitles --save-slot=0 c"), "sous-titres demandés");
  f1.stock["soreal_idle_langue_v1"] = "en";
  assert.equal(A1.dossierDe(jeu2), "d-en", "anglais : le dossier anglais");
  assert.equal(A1.dossierDe({ ...jeu2, dossiers: { fr: "d-fr" } }), "d-fr", "pas de dossier anglais : le français");
  assert.equal(A1.dossierDe({ ...jeu2, dossiers: undefined }), "base", "sans dossiers : « dossier »");
  assert.ok(A1.urlLancement(jeu2).endsWith("#--path=/data/games/d-en --no-subtitles --save-slot=0 c"), "anglais : sous-titres désactivés (Norman, 2026-11-22)");
  f1.stock["soreal_idle_langue_v1"] = "fr";
  assert.equal(A1.dossierDe({ ...jeu2, dossiers: { en: "d-en" } }), "base", "français sans dossier français : « dossier »");
}

/* 1. choix du jeu par difficulté, repli sur la difficulté inférieure puis sur le premier */
{
  const { sb } = faux(); await attendre();
  const A = sb.__SOREAL_IDLE_SCUMMVM_PAGE_V1__;
  assert.equal(A.choisirJeu(jeux, "normal").id, "a-n");
  assert.equal(A.choisirJeu(jeux, "difficile").id, "a-e", "Evil = difficile");
  assert.equal(A.choisirJeu(jeux, "extreme").id, "a-e", "Sadistic sans jeu : retombe sur Evil");
  assert.equal(A.choisirJeu([jeux[1]], "normal").id, "a-e", "pas de jeu normal : le premier");
  assert.equal(A.choisirJeu([], "normal"), null);
  assert.equal(A.choisirJeu(null, "normal"), null);
  assert.equal(A.urlLancement(jeux[0]), BASE + "moteur/scummvm.html#--path=/data/games/dossier-n --subtitles --save-slot=0 cn", "URL de lancement exacte");
  assert.equal(A.CLE_ETAT, "soreal_idle_scummvm_etat_v1");
}

/* 2. un seul iframe, jamais recréé ni re-affecté après un redessin, masqué (pas détruit) quand on quitte la page */
{
  const f = faux(); await attendre();
  f.sb.__catalogue = { jeux };
  f.stock.soreal_idle_scummvm_etat_v1 = "lance";
  const hooks = f.sb.__SOREAL_IDLE_APRES_REDESSIN_V1__;
  assert.ok(Array.isArray(hooks) && hooks.length === 1, "crochet de redessin enregistré");
  f.sb.__SOREAL_IDLE_REG__.idleEtat = { systemes: { difficulty: "difficile", systems: [{ id: "scummvm" }] } };
  const zone = f.el("div"); zone.id = "scvZoneV1";
  const page = f.sb.__SOREAL_IDLE_SCUMMVM_PAGE_V1__.page(f.sb.__SOREAL_IDLE_REG__.idleEtat);
  f.setZone(zone);
  await attendre();
  for (let i = 0; i < 5; i++) hooks[0]();
  await attendre();   /* le lancement attend la reprise des sauvegardes du compte (microtâche) */
  assert.equal(f.iframes.length, 1, "un seul iframe créé");
  const ifr = f.iframes[0];
  assert.equal(ifr.srcAffectations, 1, "src affecté une seule fois");
  assert.equal(ifr.src, BASE + "moteur/scummvm.html#--path=/data/games/dossier-e --subtitles --save-slot=0 ce", "le jeu de la difficulté du joueur (Evil)");
  assert.equal(ifr.getAttribute("allow"), "autoplay; fullscreen");
  assert.equal(ifr.parentCount, 1, "rattaché une seule fois");
  const hote = f.sb.document.body.children.find((c) => c.id === "scvHoteV1");
  assert.ok(hote && hote.getAttribute("data-morph-garder") === "", "hôte hors de la page, data-morph-garder");
  assert.ok(!hote.classList.contains("scv-cache"), "visible sur la page");
  assert.equal(hote.style.left, "10px"); assert.equal(hote.style.width, "640px");
  /* on quitte le menu : masqué, même iframe */
  f.setZone(null); hooks[0]();
  assert.ok(hote.classList.contains("scv-cache"), "masqué hors de la page");
  f.setZone(zone); hooks[0](); hooks[0]();
  assert.ok(!hote.classList.contains("scv-cache"));
  assert.equal(f.iframes.length, 1, "toujours un seul iframe");
  assert.equal(ifr.srcAffectations, 1, "jamais rechargé");
  assert.equal(ifr.parentCount, 1, "jamais déplacé");
  /* règle n°2 : seul le nom du jeu courant ; rien d'un autre jeu, aucun total */
  const tout = page + hote.children.map((c) => c.innerHTML).join("");
  assert.ok(!/Jeu Normal|dossier-n|\d+\s*\/\s*\d+/.test(tout), "aucun autre jeu, aucun total : " + tout.slice(0, 200));
  assert.ok(/id="scvZoneV1"/.test(page) && !/Jeu Evil/.test(page), "la page ne contient que la zone");
}

/* 3. avant « Jouer » : pas d'iframe (état vierge) ; le bouton Jouer lance et mémorise l'état */
{
  const f = faux(); await attendre();
  f.sb.__catalogue = { jeux };
  const hooks = f.sb.__SOREAL_IDLE_APRES_REDESSIN_V1__;
  f.sb.__SOREAL_IDLE_REG__.idleEtat = { systemes: { difficulty: "normal", systems: [{ id: "scummvm" }] } };
  const zone = f.el("div"); f.setZone(zone);
  f.sb.__SOREAL_IDLE_SCUMMVM_PAGE_V1__.page(f.sb.__SOREAL_IDLE_REG__.idleEtat);
  await attendre(); hooks[0]();
  assert.equal(f.iframes.length, 0, "rien n'est lancé avant Jouer");
  const hote = f.sb.document.body.children.find((c) => c.id === "scvHoteV1");
  const couv = hote.children[0];
  assert.ok(/Jeu Normal/.test(couv.innerHTML) && /Jouer/.test(couv.innerHTML), "nom du jeu + bouton Jouer");
  couv.listeners.click[0]({ target: { closest: () => ({}) } });
  await attendre();
  assert.equal(f.iframes.length, 1, "Jouer crée l'iframe");
  assert.equal(f.stock.soreal_idle_scummvm_etat_v1, "lance", "état mémorisé (règle n°6)");
  assert.equal(f.iframes[0].src, BASE + "moteur/scummvm.html#--path=/data/games/dossier-n --subtitles --save-slot=0 cn");
}

/* 4. catalogue vide : message simple, aucun iframe */
{
  const f = faux(); await attendre();
  f.sb.__catalogue = { jeux: [] };
  f.stock.soreal_idle_scummvm_etat_v1 = "lance";
  const hooks = f.sb.__SOREAL_IDLE_APRES_REDESSIN_V1__;
  f.sb.__SOREAL_IDLE_REG__.idleEtat = { systemes: { difficulty: "normal", systems: [{ id: "scummvm" }] } };
  f.setZone(f.el("div"));
  f.sb.__SOREAL_IDLE_SCUMMVM_PAGE_V1__.page(f.sb.__SOREAL_IDLE_REG__.idleEtat);
  await attendre(); hooks[0]();
  const hote = f.sb.document.body.children.find((c) => c.id === "scvHoteV1");
  assert.ok(hote.children[0].innerHTML.includes("Aucun jeu disponible pour l’instant."));
  assert.equal(f.iframes.length, 0);
}

/* 5. système non débloqué : aucun appel au catalogue */
{
  const f = faux(); await attendre();
  let appels = 0; const ancien = f.sb.fetch; f.sb.fetch = (...a) => { appels += 1; return ancien(...a); };
  f.sb.__SOREAL_IDLE_REG__.idleEtat = { systemes: { systems: [] } };
  f.sb.__SOREAL_IDLE_APRES_REDESSIN_V1__[0]();
  await attendre();
  assert.equal(appels, 0, "menu verrouillé : aucune requête");
  assert.equal(f.sb.document.body.children.length, 0, "menu verrouillé : aucun hôte");
}
/* 6. accès par COMPTE (2026-11-22) : sans autorisation du serveur = menu absent, aucun appel au catalogue ni au moteur, même débloqué ; autorisé = menu présent, jeton dans l'adresse de chaque fichier */
{
  const f = faux({ differe: true });
  f.sb.__ouvert = false;
  f.demarrer();
  const A = f.sb.__SOREAL_IDLE_SCUMMVM_PAGE_V1__;
  await attendre();
  const acces = (x) => x.sb.__appels.filter((u) => u.endsWith("/api/v1/scummvm-acces"));
  assert.equal(acces(f).length, 1, "une seule requête au démarrage");
  assert.equal(f.sb.__posts[0].init.headers.authorization, "Bearer session-de-test", "jeton de session du joueur");
  assert.equal(f.sb.__SOREAL_IDLE_SCUMMVM_OUVERT_V1__(), false, "non autorisé : fermé");
  f.stock.soreal_idle_scummvm_etat_v1 = "lance";
  f.sb.__SOREAL_IDLE_REG__.idleEtat = { systemes: { difficulty: "normal", systems: [{ id: "scummvm" }] } };
  f.setZone(f.el("div"));
  assert.equal(A.page(f.sb.__SOREAL_IDLE_REG__.idleEtat), "", "page vide quand c'est fermé");
  f.sb.__SOREAL_IDLE_APRES_REDESSIN_V1__[0]();
  await attendre();
  assert.ok(!f.sb.__appels.some((u) => u.includes("jeux") || u.includes("moteur")), "non autorisé : aucun appel au catalogue ni au moteur : " + f.sb.__appels.join(","));
  assert.equal(f.iframes.length, 0);
  assert.equal(acces(f).length, 1, "pas de requête à chaque redessin");
  assert.equal(f.sb.__SOREAL_IDLE_SCUMMVM_BASE_V1__(), "/api/idle/scummvm/", "aucun jeton gardé");
  /* exe Windows (window.sorealDesktop) et APK hors ligne (window.AndroidSoreal) : les fichiers du jeu n'y sont pas relayés : menu fermé, aucune requête (2026-11-22) */
  for (const pont of ["sorealDesktop", "AndroidSoreal"]) {
    const x = faux({ differe: true });
    x.sb[pont] = {};
    x.demarrer();
    await attendre();
    assert.equal(x.sb.__SOREAL_IDLE_SCUMMVM_OUVERT_V1__(), false, pont + " : menu fermé");
    assert.equal(acces(x).length, 0, pont + " : aucune demande d'accès");
    assert.ok(!x.sb.__appels.some((u) => u.includes("scummvm")), pont + " : aucun appel ScummVM");
  }
  /* autorisé : le catalogue et le moteur passent par le jeton */
  const g = faux();
  await attendre();
  assert.equal(g.sb.__SOREAL_IDLE_SCUMMVM_OUVERT_V1__(), true, "autorisé");
  assert.equal(g.sb.__SOREAL_IDLE_SCUMMVM_BASE_V1__(), BASE, "base avec jeton");
  g.sb.__catalogue = { jeux };
  g.sb.__SOREAL_IDLE_REG__.idleEtat = { systemes: { difficulty: "normal", systems: [{ id: "scummvm" }] } };
  g.setZone(g.el("div"));
  g.sb.__SOREAL_IDLE_SCUMMVM_PAGE_V1__.page(g.sb.__SOREAL_IDLE_REG__.idleEtat);
  await attendre();
  assert.ok(g.sb.__appels.includes(BASE + "jeux.json"), "catalogue lu sous le jeton : " + g.sb.__appels.join(","));
  assert.ok(g.sb.__appels.every((u) => u.endsWith("/api/v1/scummvm-acces") || u.startsWith(BASE)), "toute requête de fichier passe par le jeton : " + g.sb.__appels.join(","));
  /* échec réseau = fermé */
  const h = faux({ differe: true });
  h.sb.fetch = async () => { throw new Error("réseau"); };
  h.demarrer(); await attendre();
  assert.equal(h.sb.__SOREAL_IDLE_SCUMMVM_OUVERT_V1__(), false, "échec réseau = fermé");
  /* réponse sans jeton (ou refus) = fermé */
  const k = faux({ differe: true });
  k.sb.fetch = async () => ({ ok: true, json: async () => ({ ok: true, autorise: true }) });
  k.demarrer(); await attendre();
  assert.equal(k.sb.__SOREAL_IDLE_SCUMMVM_OUVERT_V1__(), false, "autorise sans jeton = fermé");
  /* pas de session : aucune requête (un jeton n'a aucun sens), nouvel essai ensuite */
  const m = faux({ differe: true });
  m.sb.__session = "";
  m.demarrer(); await attendre();
  assert.equal(m.sb.__appels.length, 0, "sans session : aucune requête");
  assert.equal(m.sb.__SOREAL_IDLE_SCUMMVM_OUVERT_V1__(), false);
}
/* 6b. renouvellement : au plus toutes les 60 s ; aussitôt que le jeton expire dans moins de 10 minutes ; un jeton qui change ne recrée jamais l'iframe */
{
  const f = faux({ differe: true });
  let maintenant = 1_000_000_000_000;
  const DateReel = Date;
  f.sb.Date = class extends DateReel { static now() { return maintenant; } };
  f.sb.__expire = Math.floor(maintenant / 1000) + 3600;   /* expire dans 1 h */
  f.demarrer(); await attendre();
  const acces = () => f.sb.__appels.filter((u) => u.endsWith("/api/v1/scummvm-acces")).length;
  assert.equal(acces(), 1);
  maintenant += 30_000; f.sb.__SOREAL_IDLE_SCUMMVM_OUVERT_V1__(); await attendre();
  assert.equal(acces(), 1, "moins de 60 s : pas de nouvelle requête");
  maintenant += 40_000; f.sb.__SOREAL_IDLE_SCUMMVM_OUVERT_V1__(); await attendre();
  assert.equal(acces(), 2, "après 60 s : renouvelé");
  /* proche de l'expiration (moins de 10 minutes) : renouvelé dès 5 s */
  f.sb.__expire = Math.floor(maintenant / 1000) + 300; maintenant += 61_000; f.sb.__SOREAL_IDLE_SCUMMVM_OUVERT_V1__(); await attendre();
  assert.equal(acces(), 3);
  f.sb.__jeton = "autre1234.signature-de-test-67890"; f.sb.__expire = Math.floor(maintenant / 1000) + 86400;
  maintenant += 6_000; f.sb.__SOREAL_IDLE_SCUMMVM_OUVERT_V1__(); await attendre();
  assert.equal(acces(), 4, "jeton qui expire bientôt : renouvelé sans attendre 60 s");
  assert.equal(f.sb.__SOREAL_IDLE_SCUMMVM_BASE_V1__(), "/api/idle/scummvm/autre1234.signature-de-test-67890/", "nouveau jeton pris");
}
/* 6c. un jeton renouvelé pendant la partie ne recrée ni ne recharge l'iframe */
{
  const f = faux(); await attendre();
  f.sb.__catalogue = { jeux };
  f.stock.soreal_idle_scummvm_etat_v1 = "lance";
  const hooks = f.sb.__SOREAL_IDLE_APRES_REDESSIN_V1__;
  f.sb.__SOREAL_IDLE_REG__.idleEtat = { systemes: { difficulty: "normal", systems: [{ id: "scummvm" }] } };
  f.setZone(f.el("div"));
  f.sb.__SOREAL_IDLE_SCUMMVM_PAGE_V1__.page(f.sb.__SOREAL_IDLE_REG__.idleEtat);
  await attendre(); hooks[0](); await attendre();
  assert.equal(f.iframes.length, 1);
  f.sb.__jeton = "autre1234.signature-de-test-67890";
  f.sb.__SOREAL_IDLE_SCUMMVM_OUVERT_V1__();   /* pas encore 60 s : aucun effet */
  hooks[0](); hooks[0]();
  assert.equal(f.iframes.length, 1, "toujours un seul iframe");
  assert.equal(f.iframes[0].srcAffectations, 1, "jamais rechargé");
  assert.ok(f.iframes[0].src.startsWith(BASE + "moteur/scummvm.html#"), "l'adresse de l'iframe garde le jeton de départ");
}
/* 7. branchement : la barre de menus consulte l'accès par compte (même fonction qu'avant : fermé = menu absent) */
{
  const nav = readFileSync("cloudflare/public/modules/ui-navigation-v1.js", "utf8");
  assert.ok(nav.includes("if(id==='scummvm'&&!(window.__SOREAL_IDLE_SCUMMVM_OUVERT_V1__&&window.__SOREAL_IDLE_SCUMMVM_OUVERT_V1__()))return false;"), "menuDisponible : fermé = absent");
  const men = readFileSync("cloudflare/public/modules/ui-menus-v1.js", "utf8");
  assert.ok(men.includes("s.id!=='scummvm'||(window.__SOREAL_IDLE_SCUMMVM_OUVERT_V1__"), "popup de nouveauté : fermé = rien");
}
/* 9. Autosave rapproché (Norman, 2026-11-22) : autosave_period=15 écrit dans la config de ScummVM (IndexedDB d'IDBFS) AVANT le lancement ; jamais d'erreur ni de config créée de toutes pièces */
{
  const CLE = "/home/web_user/scummvm.ini";
  const fauxIdb = (ini, { sansTable = false, sansBase = false } = {}) => {
    const store = {};
    if (ini !== null) store[CLE] = { contents: new TextEncoder().encode(ini), timestamp: new Date(0), mode: 33206 };
    const ecrits = [];
    return {
      store, ecrits,
      databases: () => Promise.resolve(sansBase ? [] : [{ name: "/home/web_user" }]),
      open: () => {
        const rq = {};
        queueMicrotask(() => {
          rq.result = {
            objectStoreNames: { contains: (n) => !sansTable && n === "FILE_DATA" },
            close() {},
            transaction: () => {
              const tx = {};
              tx.objectStore = () => ({
                get: (k) => { const g = {}; queueMicrotask(() => { g.result = store[k]; if (g.onsuccess) g.onsuccess(); }); return g; },
                put: (v, k) => { store[k] = v; ecrits.push(k); queueMicrotask(() => { if (tx.oncomplete) tx.oncomplete(); }); return {}; },
              });
              return tx;
            },
          };
          if (rq.onsuccess) rq.onsuccess();
        });
        return rq;
      },
    };
  };
  const lancer = async (idb) => {
    const f = faux(); f.sb.TextDecoder = TextDecoder; f.sb.TextEncoder = TextEncoder; f.sb.indexedDB = idb;
    await f.sb.__SOREAL_IDLE_SCUMMVM_PAGE_V1__.reglerAutosave();
    return new TextDecoder().decode((idb.store[CLE] || { contents: new Uint8Array() }).contents);
  };
  let idb = fauxIdb("[scummvm]\nversioninfo=2.10.0git\nautosave_period=60\n\n[x]\na=b\n");
  let txt = await lancer(idb);
  assert.ok(txt.includes("autosave_period=15") && !txt.includes("autosave_period=60") && txt.includes("[x]"), "60 s remplacé par 15 s, le reste de la config intact");
  assert.equal(idb.ecrits.length, 1);
  idb = fauxIdb("[scummvm]\nversioninfo=2.10.0git\n");
  txt = await lancer(idb);
  assert.ok(txt.includes("[scummvm]\nautosave_period=15"), "réglage absent : ajouté sous [scummvm]");
  idb = fauxIdb("[scummvm]\nautosave_period=15\n");
  await lancer(idb);
  assert.equal(idb.ecrits.length, 0, "déjà à 15 s : rien n'est réécrit");
  idb = fauxIdb("[scummvm]\nautosave_period=150\n");
  txt = await lancer(idb);
  assert.ok(txt.includes("autosave_period=15\n") && !txt.includes("autosave_period=150"), "150 n'est pas pris pour 15");
  idb = fauxIdb(null);
  await lancer(idb);
  assert.equal(idb.ecrits.length, 0, "pas de config : on n'en fabrique pas (le moteur la reçoit déjà réglée depuis R2)");
  idb = fauxIdb("[scummvm]\nautosave_period=60\n", { sansBase: true });
  await lancer(idb);
  assert.equal(idb.ecrits.length, 0, "pas de base IndexedDB : rien (jamais créée par la page)");
  idb = fauxIdb("[scummvm]\nautosave_period=60\n", { sansTable: true });
  await lancer(idb);
  assert.equal(idb.ecrits.length, 0, "base sans table FILE_DATA : ignorée");
  const f2 = faux(); f2.sb.indexedDB = { databases: () => Promise.reject(new Error("panne")) };
  await f2.sb.__SOREAL_IDLE_SCUMMVM_PAGE_V1__.reglerAutosave();   // ne lève jamais
}

console.log("idle-scummvm-page-client-v1 OK");
