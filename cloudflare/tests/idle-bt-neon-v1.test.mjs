import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-10-21) : le menu Entraînement de base s'éteint après une Renaissance et se rallume comme des tubes néon (clignotement, sons) uniquement à sa première ouverture après cette Renaissance.
 */
const code = readFileSync(new URL("../public/modules/bt-neon-v1.js", import.meta.url), "utf8");

function monde({ renaissances = 0, allocation = 0, volume = 0.8, reduit = false } = {}) {
  const magasin = {};
  const etatJeu = { systemes: { records: { totalRebirths: renaissances } }, basicTraining: { skills: [{ unlocked: true, allocation }, { unlocked: false, allocation: 999 }] } };
  const attrs = {};
  let ouvert = true;
  const racine = { getAttribute: (k) => (k in attrs ? attrs[k] : null), setAttribute: (k, v) => { attrs[k] = v; }, removeAttribute: (k) => { delete attrs[k]; } };
  let tick = null; const minuteries = [];
  const noeuds = { osc: 0, bruit: 0 };
  const fauxContexte = {
    state: "running", sampleRate: 8000, currentTime: 0, destination: {},
    createBuffer: (c, n) => ({ getChannelData: () => new Float32Array(n) }),
    createBufferSource: () => { noeuds.bruit += 1; return { connect() {}, start() {}, buffer: null }; },
    createBiquadFilter: () => ({ type: "", frequency: { value: 0, setValueAtTime() {} }, Q: { value: 0 }, connect() {} }),
    createGain: () => ({ gain: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }),
    createOscillator: () => { noeuds.osc += 1; return { type: "", frequency: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, start() {}, stop() {} }; },
    resume() {}
  };
  const fen = {
    __SOREAL_IDLE_META_HOST_V130__: { getIdleEtat: () => etatJeu },
    __SOREAL_IDLE_AUDIO_VOLUME_V1__: { getInterface: () => volume },
    AudioContext: function () { return fauxContexte; },
    matchMedia: () => ({ matches: reduit }),
    localStorage: { getItem: (k) => (k in magasin ? magasin[k] : null), setItem: (k, v) => { magasin[k] = String(v); } }
  };
  fen.window = fen;
  const doc = { hidden: false, getElementById: () => null, createElement: () => ({}), head: { appendChild() {} }, documentElement: { appendChild() {} }, querySelector: (s) => (ouvert && /data-menu="entrainement"/.test(s) ? racine : null) };
  const sandbox = Object.assign(fen, { document: doc, localStorage: fen.localStorage, setInterval: (f) => { tick = f; return 1; }, setTimeout: (f, ms) => { minuteries.push({ f, ms }); return minuteries.length; }, clearTimeout() {} });
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return { ouvrir: (v) => { ouvert = v; }, N: sandbox.__SOREAL_IDLE_BT_NEON_V1__, etatJeu, attrs, tick: () => tick(), minuteries, noeuds, magasin, fen: sandbox, apres: () => sandbox.__SOREAL_IDLE_APRES_REDESSIN_V1__ };
}

// 1. Joueur sans mémoire : le menu reste allumé (aucune surprise en pleine partie).
{
  const m = monde({ renaissances: 3 });
  assert.equal(m.N.etat().on, true);
  m.tick();
  assert.equal(m.attrs["data-bt-neon"], undefined, "menu allumé : aucun attribut");
}

// 2. Une Renaissance éteint le menu ; tant qu'on ne l'ouvre pas : aucun effet, aucun son.
{
  const m = monde({ renaissances: 3 });
  m.N.etat();
  m.etatJeu.systemes.records.totalRebirths = 4;
  m.ouvrir(false);
  m.etatJeu.basicTraining.skills[0].allocation = 100;
  m.tick(); m.tick();
  assert.equal(m.noeuds.osc + m.noeuds.bruit, 0, "menu fermé : aucun son même si de l'énergie est placée");
  assert.equal(m.minuteries.length, 0, "menu fermé : aucune animation");

  // 3. Première ouverture : allumage avec sons, puis allumé pour de bon (jusqu'à la prochaine Renaissance).
  m.ouvrir(true);
  m.tick();
  assert.equal(m.attrs["data-bt-neon"], "allumage", "première ouverture : le menu s'allume");
  assert.ok(m.noeuds.osc > 20 && m.noeuds.bruit > 20, "sons joués (claquements, grésillements, pops, ronronnement)");
  const fin = m.minuteries.find((x) => x.ms === 3900);
  assert.ok(fin, "fin de l'allumage programmée");
  fin.f();
  assert.equal(m.attrs["data-bt-neon"], undefined, "allumé");
  const sons = m.noeuds.osc + m.noeuds.bruit;
  m.ouvrir(false); m.tick(); m.ouvrir(true); m.tick();
  assert.equal(m.attrs["data-bt-neon"], undefined, "réouverture : reste allumé, sans animation");
  assert.equal(m.noeuds.osc + m.noeuds.bruit, sons, "réouverture : aucun nouveau son");
  m.etatJeu.systemes.records.totalRebirths = 5;
  m.ouvrir(false);
  m.tick();
  m.ouvrir(true);
  m.tick();
  assert.equal(m.attrs["data-bt-neon"], "allumage", "nouvelle Renaissance : nouvelle animation à la première ouverture");
}

// 4. Volume 0 : l'allumage se fait sans aucun son ; « réduire les animations » : allumé d'un coup.
{
  const m = monde({ renaissances: 1, volume: 0 });
  m.N.etat(); m.etatJeu.systemes.records.totalRebirths = 2; m.tick();
  m.tick();
  assert.equal(m.attrs["data-bt-neon"], "allumage");
  assert.equal(m.noeuds.osc + m.noeuds.bruit, 0, "volume 0 : aucun son");
  const r = monde({ renaissances: 1, reduit: true });
  r.N.etat(); r.etatJeu.systemes.records.totalRebirths = 2; r.tick();
  r.tick();
  assert.equal(r.attrs["data-bt-neon"], undefined, "animations réduites : allumé tout de suite, sans clignotement");
  assert.equal(r.noeuds.osc + r.noeuds.bruit, 0, "animations réduites : aucun son");
}

// 5. Calendrier et feuille de style : 16 blocs qui s'allument les uns après les autres ; clignotement terminé à « filter:none » ; gardé par le redessin.
{
  const m = monde();
  const cal = Array.from(m.N.calendrier());
  assert.equal(cal.length, 16, "titre, barre d'outils, 1 tête + 6 lignes d'Attaque, 1 tête + 6 lignes de Défense");
  assert.deepEqual(cal.slice().sort((a, b) => a - b), cal, "ordre croissant : du haut vers le bas");
  const css = m.N.css();
  assert.ok(css.includes('[data-bt-neon="eteint"]') && css.includes("filter:brightness(.26) saturate(.25)"), "menu éteint : sombre et terne");
  assert.ok(css.includes("animation:btNeonV1 0.95s step-end both"), "clignotement à paliers (tube néon)");
  assert.ok(/@keyframes btNeonV1\{0%\{filter:brightness\(\.26\) saturate\(\.25\)\}[^]*100%\{filter:none\}\}/.test(css), "du noir à l'allumé ; terminé sans filtre résiduel");
  assert.ok(css.includes(".soreal-idle-bt-panel-v120.attack>.soreal-idle-bt-row-v120:nth-child(7){--btd:1.550s}") && css.includes(".soreal-idle-bt-panel-v120.defense>.soreal-idle-bt-row-v120:nth-child(2){--btd:1.950s}"), "calendrier par ligne");
  assert.ok(Array.from(m.fen.__SOREAL_IDLE_MORPH_ATTRIBUTS_GARDES_V1__).includes("data-bt-neon"), "attribut gardé par le redessin (règle n°4)");
  assert.ok(readFileSync(new URL("../public/index.html", import.meta.url), "utf8").includes('<script defer src="/modules/bt-neon-v1.js?v='), "module chargé par la page");
}
// 6. Chaque barre qui a de l'énergie garde SON démarrage de base, joué quand sa ligne s'allume (la première barre de chaque panneau : le néon).
{
  const m = monde();
  const sons = [];
  m.fen.__SOREAL_IDLE_BT_LUMIERES_V1__ = { variantePourBarre: (id) => (id === "attaque_reguliere" || id === "defense_renforcee" ? "demarrage1" : "v:" + id), construire: (c, out, t, type) => sons.push(type) };
  const ids = ["attaque_passive", "attaque_reguliere", "attaque_renforcee", "contre_palette", "percee_quai", "ultime_soreal", "blocage", "defense_renforcee", "recuperation", "boost_offensif", "charge_logistique", "ultime_logistique"];
  m.etatJeu.basicTraining.skills = ids.map((id) => ({ id, unlocked: true, allocation: 0 }));
  [0, 1, 2, 6, 7].forEach((i) => { m.etatJeu.basicTraining.skills[i].allocation = 5; });
  const b = m.N.barresAvecEnergie();
  assert.deepEqual(JSON.parse(JSON.stringify(b.map((x) => x.type))), ["allume"], "toute barre joue le néon qui s'allume, une seule fois (Norman, 2026-10-22)");
  const cal = Array.from(m.N.calendrier());
  assert.ok(Math.abs(b[0].d - cal[2]) < 1e-9, "joués à l'instant où la ligne s'allume");
  m.etatJeu.systemes.records.totalRebirths = 1;
  m.N.etat(); m.etatJeu.systemes.records.totalRebirths = 2; m.tick();
  assert.equal(sons.length, 1, "le néon est joué une seule fois pendant l'allumage, quel que soit le nombre de barres");
}
console.log("idle-bt-neon-v1: OK");
