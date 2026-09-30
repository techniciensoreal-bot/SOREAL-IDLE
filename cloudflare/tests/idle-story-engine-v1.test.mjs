import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Lecteur d histoires plein écran (Norman, 2026-09-30) : remplace les deux modules figés ; les histoires viennent du serveur (menu Admin).
 * Déclenchement « à la mort du boss N » = bossSelection vaut N+1 ; une seule interrogation du serveur par boss et par chargement.
 */
const source = readFileSync("cloudflare/public/modules/story-engine-v1.js", "utf8");

function fabriquerElement() {
  const el = {
    style: {},
    classList: {
      _set: new Set(),
      add(c) { this._set.add(c); },
      remove(c) { this._set.delete(c); },
      contains(c) { return this._set.has(c); }
    },
    children: [],
    listeners: {},
    appendChild(child) { this.children.push(child); return child; },
    addEventListener(evt, fn) { (this.listeners[evt] = this.listeners[evt] || []).push(fn); },
    querySelector(sel) {
      if (sel === "img") return this._img;
      if (sel === ".soreal-idle-histoire-texte-v1") return this._texte;
      if (sel === ".soreal-idle-histoire-passer-v1") return this._bouton;
      if (sel === ".soreal-idle-histoire-chargement-v1") return this._chargement;
      return null;
    },
    set innerHTML(_v) {
      this._img = fabriquerElement();
      this._texte = fabriquerElement();
      this._bouton = fabriquerElement();
      this._chargement = fabriquerElement();
    },
    set src(v) { this._src = v; this._srcHistorique = this._srcHistorique || []; this._srcHistorique.push(v); if (typeof this.onload === "function") this.onload(); },
    get src() { return this._src; },
    set textContent(v) { this._texte_content = v; }
  };
  return el;
}

function fabriquerDocument() {
  const head = fabriquerElement();
  const body = fabriquerElement();
  const parIdV = {};
  return {
    head, body,
    getElementById(id) { return parIdV[id] || null; },
    createElement() {
      const el = fabriquerElement();
      return el;
    },
    _enregistrer(id, el) { parIdV[id] = el; }
  };
}

function fabriquerHorloge() {
  let id = 1;
  const taches = new Map();
  return {
    setTimeout(fn, ms) { const monId = id++; taches.set(monId, { fn, ms }); return monId; },
    clearTimeout(monId) { taches.delete(monId); },
    avancer() {
      let meilleur = null;
      for (const [monId, t] of taches) { if (!meilleur || t.ms < meilleur.ms) meilleur = [monId, t]; }
      if (!meilleur) return false;
      taches.delete(meilleur[0]);
      meilleur[1].fn();
      return true;
    },
    enAttente() { return taches.size; },
    delaisEnAttente() { return [...taches.values()].map((t) => t.ms); }
  };
}

function charger(window, document, horloge) {
  const fabrique = new Function(
    "window", "document", "requestAnimationFrame", "setTimeout", "clearTimeout", "Image",
    source + "\nreturn window.__SOREAL_IDLE_STORY_ENGINE_V1__;"
  );
  return fabrique(window, document, (fn) => fn(), horloge.setTimeout, horloge.clearTimeout, function Image() { images.push(this); });
}
const images = [];

const HISTOIRE = {
  id: "essai", vuId: "histoire:essai", voix: [],
  etapes: [
    { texte: "Premier texte.", imageUrl: "/api/idle/media/story-image?id=essai&f=a.webp" },
    { texte: "", imageUrl: "/api/idle/media/story-image?id=essai&f=b.webp" },
    { texte: "Troisième texte.", imageUrl: "" }
  ]
};

// 1. dureeApprox : plancher 4 s, plafond 30 s.
{
  const api = charger({}, fabriquerDocument(), fabriquerHorloge());
  assert.equal(api.dureeApprox(""), 4000);
  assert.equal(api.dureeApprox("x".repeat(1400)), 30000);
}

// 2. jouer : une image par étape (l'URL fournie par le serveur), marqué vu (vuId de l'histoire) SEULEMENT à la fin.
{
  const window_ = { vus: [] };
  window_.__soreal_idle_marquer_vu_v1__ = (id) => window_.vus.push(id);
  const document_ = fabriquerDocument();
  const horloge = fabriquerHorloge();
  const api = charger(window_, document_, horloge);
  assert.equal(api.jouer(HISTOIRE), true);
  assert.equal(document_.body.children.length, 1);
  assert.deepEqual(window_.vus, [], "pas vu au démarrage");
  assert.equal(api.jouer(HISTOIRE), false, "jamais deux lectures en même temps");
  while (horloge.avancer()) {}
  const overlay = document_.body.children[0];
  assert.deepEqual(overlay.querySelector("img")._srcHistorique, [HISTOIRE.etapes[0].imageUrl, HISTOIRE.etapes[1].imageUrl], "chaque étape affiche son image (une étape sans image n'en affiche pas)");
  assert.deepEqual(window_.vus, ["histoire:essai"], "marqué vu une seule fois, à la fin réelle");
  assert.equal(api.enCours(), false);
}

// 3. Essai depuis le menu Admin : marquerVu:false ne touche jamais à la mémoire « vu » ; surFin est rappelé.
{
  const window_ = { vus: [] };
  window_.__soreal_idle_marquer_vu_v1__ = (id) => window_.vus.push(id);
  const horloge = fabriquerHorloge();
  const api = charger(window_, fabriquerDocument(), horloge);
  let fini = 0;
  api.jouer(HISTOIRE, { marquerVu: false, surFin: () => { fini += 1; } });
  while (horloge.avancer()) {}
  assert.deepEqual(window_.vus, []);
  assert.equal(fini, 1);
}

// 4. « Passer » termine (marqué vu) ; quitter en plein milieu ne marque rien.
{
  const window_ = { vus: [] };
  window_.__soreal_idle_marquer_vu_v1__ = (id) => window_.vus.push(id);
  const document_ = fabriquerDocument();
  const horloge = fabriquerHorloge();
  const api = charger(window_, document_, horloge);
  api.jouer(HISTOIRE);
  horloge.avancer();
  assert.deepEqual(window_.vus, [], "abandon en cours de route : jamais vue");
  document_.body.children[0].querySelector(".soreal-idle-histoire-passer-v1").listeners.click[0]();
  assert.deepEqual(window_.vus, ["histoire:essai"]);
}

// 5. Les voix générées depuis le menu Admin sont déclarées au module de narration avant la lecture ; la voix suit chaque texte non vide.
{
  const lus = [];
  const declarees = [];
  const window_ = {
    __SOREAL_IDLE_TUTORIAL_TTS_V209__: {
      enregistrerVoixDynamiques: (l) => declarees.push(...l),
      prechauffer() {},
      readText(texte, _a, fin) { lus.push(texte); fin(); return true; }
    }
  };
  const horloge = fabriquerHorloge();
  const api = charger(window_, fabriquerDocument(), horloge);
  api.jouer(Object.assign({}, HISTOIRE, { voix: ["0123456789abcd"] }), { marquerVu: false });
  assert.deepEqual(declarees, ["0123456789abcd"]);
  while (horloge.avancer()) {}
  assert.deepEqual(lus, ["Premier texte.", "Troisième texte."], "une étape sans texte n'appelle pas la voix (image affichée le temps minimal)");
}

// 6. considerer : « à la mort du boss N » = bossSelection N+1 ; une seule interrogation par boss ; jamais si déjà vue.
{
  const appels = [];
  const reponses = { 16: { ok: true, histoire: null }, 17: { ok: true, histoire: HISTOIRE } };
  const window_ = { vus: [] };
  window_.__soreal_idle_marquer_vu_v1__ = (id) => window_.vus.push(id);
  window_.__SOREAL_IDLE_CALL_V1__ = (nom, args) => { appels.push([nom, args[0]]); return Promise.resolve(reponses[args[0]] || { ok: true, histoire: null }); };
  const document_ = fabriquerDocument();
  const horloge = fabriquerHorloge();
  const api = charger(window_, document_, horloge);
  const attendre = () => new Promise((r) => setImmediate(r));

  api.considerer({ bossSelection: 1 });
  api.considerer({});
  api.considerer(null);
  await attendre();
  assert.deepEqual(appels, [], "boss 1 sélectionné : aucun boss vaincu, rien à demander");

  api.considerer({ bossSelection: 17 });
  api.considerer({ bossSelection: 17 });
  await attendre();
  assert.deepEqual(appels, [["obtenirHistoireBossSorealIdle", 16]], "boss 16 vaincu : une seule question au serveur, même après plusieurs rendus");
  assert.equal(document_.body.children.length, 0, "aucune histoire pour ce boss : rien");

  api.considerer({ bossSelection: 18, profil: { stats: { vus: [] } } });
  await attendre();
  assert.deepEqual(appels[1], ["obtenirHistoireBossSorealIdle", 17], "boss 17 vaincu (le prochain est le 18)");
  assert.equal(document_.body.children.length, 1, "l'histoire du boss 17 démarre");
  while (horloge.avancer()) {}
  assert.deepEqual(window_.vus, ["histoire:essai"]);

  // Déjà vue : rien.
  const document2 = fabriquerDocument();
  const api2 = charger(window_, document2, fabriquerHorloge());
  api2.considerer({ bossSelection: 18, profil: { stats: { vus: ["histoire:essai"] } } });
  await attendre();
  assert.equal(document2.body.children.length, 0, "déjà vue : jamais rejouée");
}

// 7. Échec réseau : on retentera (jamais marqué vu, jamais « vérifié »).
{
  let n = 0;
  const window_ = { __soreal_idle_marquer_vu_v1__() {} };
  window_.__SOREAL_IDLE_CALL_V1__ = () => { n += 1; return n === 1 ? Promise.reject(new Error("réseau")) : Promise.resolve({ ok: true, histoire: null }); };
  const api = charger(window_, fabriquerDocument(), fabriquerHorloge());
  const attendre = () => new Promise((r) => setImmediate(r));
  api.considerer({ bossSelection: 5 });
  await attendre();
  api.considerer({ bossSelection: 5 });
  await attendre();
  assert.equal(n, 2, "après un échec, la question est reposée au rendu suivant");
}

// 8. Câblage : déclenchement à chaque rendu d'état, chargé avant le jeu, plus aucune trace des anciens modules figés.
{
  const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
  assert.match(ui, /window\.__SOREAL_IDLE_STORY_ENGINE_V1__\.considerer\(j\);/);
  assert.ok(!ui.includes("STORY_POPUP"), "plus d'ancien module d'histoire dans le jeu");
  const index = readFileSync("cloudflare/public/index.html", "utf8");
  assert.match(index, /<script defer src="\/modules\/story-engine-v1\.js\?v=\d+"><\/script>/);
  assert.match(index, /<script defer src="\/modules\/admin-histoires-v1\.js\?v=\d+"><\/script>/);
  assert.ok(index.indexOf("story-engine-v1.js") < index.indexOf("/soreal-idle-ui.js?v="));
  assert.ok(!index.includes("story-popup"));
}

console.log("idle-story-engine-v1: OK");
