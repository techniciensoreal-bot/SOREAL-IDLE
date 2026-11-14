import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { instantaneJoueurV1, evenementsV1 } from "../src/idle-flux-v1.js";
import { normalizeIdleNguState } from "../src/idle-ngu-progression.js";
import { useYggFruit } from "../src/idle-ngu-systemes.js";

/*
 * « En direct » (Norman, 2026-11-14) : un message quand on mange un fruit d'Yggdrasil (nommé s'il est seul, message de groupe si plusieurs), un message qui dit QUEL labo se met au travail, et une raison
 * de message dans chaque menu (jalons par paliers, sans inonder). Anti-spoil : la phrase n'existe que pour un lecteur qui possède le menu ; un fruit ou un labo n'est nommé que s'il est connu du lecteur.
 */
const contexte = { bosses: 120 };
function etatNeuf() {
  let s = normalizeIdleNguState({}, contexte, 1_000_000);
  s.adventure.unlockFlags.yggdrasil = true; s.adventure.unlockFlags.diggers = true;
  s = normalizeIdleNguState(s, contexte, 1_000_000);
  s.systems.yggdrasil.unlocked = true;
  return s;
}
const inst = (s) => instantaneJoueurV1({ stats: { metaNgu: s } });
function mange(s, id, mode = "eat") {
  const f = s.systems.yggdrasil.data.fruits[id];
  f.active = true; f.growthHours = 5; f.tier = 3;
  useYggFruit(s, id, mode);
  f.active = true; f.growthHours = 5; f.tier = 3;
}

// --- Moteur : un compteur par fruit et par mode, jamais de détail de gain ---
const s0 = etatNeuf();
const i0 = inst(s0);
assert.deepEqual([i0.fruitsMange, i0.fruitsRecolte], [{}, {}], "départ : rien");
mange(s0, "gold");
const i1 = inst(s0);
assert.deepEqual(i1.fruitsMange, { gold: 1 }, "un fruit mangé : compteur à 1");
mange(s0, "powerAlpha", "harvest");
assert.deepEqual(inst(s0).fruitsRecolte, { powerAlpha: 1 }, "récolter a son propre compteur");

// --- Événements : un fruit seul = nominatif ; plusieurs = message de groupe ; rien depuis un ancien instantané ---
const ev = (a, b) => evenementsV1(a, b, {}).filter((e) => e.type === "fruit" || e.type === "fruits");
assert.deepEqual(ev(i0, i1), [{ type: "fruit", donnees: { id: "gold", mode: "eat" } }], "un seul fruit : nommé");
const s2 = etatNeuf(); mange(s2, "gold"); const iAvant = inst(s2);
mange(s2, "gold"); mange(s2, "gold");
assert.deepEqual(ev(iAvant, inst(s2)), [{ type: "fruits", donnees: { n: 2, k: 1 } }], "le même fruit deux fois : groupe");
mange(s2, "powerAlpha"); mange(s2, "adventure", "harvest");
assert.deepEqual(ev(iAvant, inst(s2)), [{ type: "fruits", donnees: { n: 4, k: 3 } }], "plusieurs fruits différents : groupe");
assert.equal(ev(i1, i1).length, 0, "rien de nouveau : rien");
assert.equal(ev({ bossMax: 5, succes: [], titans: {}, defis: {}, rebirths: 0 }, i1).length, 0, "ancien instantané : pas de comparaison");

// --- Labos : quel labo se met au travail ---
function avecLabo(ids) {
  const s = etatNeuf();
  for (const id of ids) { const d = s.systems.diggers.data.diggers[id]; d.maxLevel = 3; d.runLevel = 2; d.active = true; }
  return inst(s);
}
const labos = (a, b) => evenementsV1(a, b, {}).filter((e) => e.type === "diggers");
assert.deepEqual(labos(avecLabo([]), avecLabo(["stats"])), [{ type: "diggers", donnees: { actifs: 1, id: "stats", niveau: 2 } }], "un labo : nommé avec son niveau");
const deux = labos(avecLabo([]), avecLabo(["stats", "drop"]));
assert.equal(deux.length, 1); assert.equal(deux[0].donnees.id, undefined, "deux labos d'un coup : message de groupe, aucun nom");
assert.equal(labos(avecLabo(["stats"]), avecLabo(["stats"])).length, 0, "rien de nouveau : rien");

// --- Jalons : un message par menu, aux paliers (jamais à chaque niveau) ---
function avecJalons(f) {
  const s = etatNeuf();
  f(s);
  return inst(s);
}
const jalons = (a, b) => evenementsV1(a, b, {}).filter((e) => e.type === "jalon");
const aug = (n) => avecJalons((s) => { s.systems.augmentations.data.pairs.scissors.level = n; });
assert.equal(jalons(aug(5), aug(9)).length, 0, "pas de palier franchi : rien");
assert.deepEqual(jalons(aug(5), aug(12)), [{ type: "jalon", donnees: { quoi: "augmentations", n: 12 } }], "palier franchi : un message");
const barbes = (n) => avecJalons((s) => { s.systems.beards.data.tracks.attack.level = n; });
assert.equal(jalons(barbes(4), barbes(40)).length, 1);
const garderie = (n) => avecJalons((s) => { s.systems.daycare.data.slots = Array.from({ length: n }, () => ({})); });
assert.deepEqual(jalons(garderie(0), garderie(1)), [{ type: "jalon", donnees: { quoi: "garderie", n: 1 } }], "un objet de plus à la garderie");
assert.equal(jalons(garderie(2), garderie(2)).length, 0);
const mg = (n) => avecJalons((s) => { s.systems.macguffins.data.inventory = Array.from({ length: n }, () => ({})); });
assert.equal(jalons(mg(0), mg(1)).length, 1, "un nouveau MacGuffin");
const tout = (a, b) => evenementsV1(a, b, {});
assert.ok(tout(avecJalons(() => {}), avecJalons((s) => { s.systems.augmentations.data.pairs.scissors.level = 30; s.systems.beards.data.tracks.attack.level = 30; s.systems.hacks.data.tracks.attackDefense.level = 30; })).filter((e) => e.type === "jalon").length === 1, "plusieurs totaux franchis dans le même battement : un seul message de total");

// --- Phrases côté lecteur ---
const ctx = { window: {}, document: { addEventListener() {}, getElementById: () => null } };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(readFileSync("cloudflare/public/modules/flux-v1.js", "utf8"), ctx);
const phrase = ctx.window.__SOREAL_IDLE_FLUX_V1__.phrase;
const lecteur = (menus = {}, extra = {}) => Object.assign({ zones: [], bossMax: 0, connus: Object.assign({ boss: {}, titan: {}, succes: {}, menus }, extra) });
const dit = (type, donnees, l, moi = false, id = 0) => { const p = phrase({ type, nom: "Saka", id, donnees, moi }, l); return p && p.texte; };
const ygg = lecteur({ yggdrasil: true }, { fruits: { gold: "Fruit d’Or" } });
assert.match(dit("fruit", { id: "gold", mode: "eat" }, ygg), /Saka.*le Fruit d’Or/, "un fruit seul : nommé");
assert.match(dit("fruit", { id: "gold", mode: "harvest" }, ygg, true), /^Tu .*le Fruit d’Or/, "toi : « Tu… »");
assert.match(dit("fruit", { id: "inconnu", mode: "eat" }, ygg), /un fruit/, "fruit inconnu du lecteur : « un fruit », jamais son nom");
assert.equal(dit("fruit", { id: "gold", mode: "eat" }, lecteur({})), null, "sans Yggdrasil : rien");
assert.match(dit("fruits", { n: 4, k: 3 }, ygg), /4 fruits.*3 sortes différentes/, "message de groupe");
assert.doesNotMatch(dit("fruits", { n: 4, k: 3 }, ygg), /Fruit d’Or/, "le groupe ne nomme aucun fruit");
assert.equal(new Set([0, 1, 2].map((i) => dit("fruit", { id: "gold", mode: "eat" }, ygg, false, i))).size, 3, "trois tournures");
const lab = lecteur({ diggers: true }, { labos: { stats: "Labo des statistiques" } });
assert.match(dit("diggers", { actifs: 1, id: "stats", niveau: 2 }, lab), /Labo des statistiques.*niveau 2/, "labo nommé quand il est ouvert chez le lecteur");
assert.doesNotMatch(dit("diggers", { actifs: 1, id: "drop", niveau: 2 }, lab), /Labo|niveau 2/, "labo inconnu du lecteur : phrase générale");
assert.equal(dit("diggers", { actifs: 1, id: "stats", niveau: 2 }, lecteur({})), null, "sans Labos : rien");
for (const [quoi, menu] of [["augmentations", "augmentations"], ["beards", "beards"], ["hacks", "hacks"], ["wishes", "wishes"], ["cartes", "cards"], ["repas", "cooking"], ["garderie", "daycare"], ["macguffins", "macguffins"]]) {
  assert.ok(dit("jalon", { quoi, n: 12 }, lecteur({ [menu]: true })), quoi + " : phrase pour qui possède le menu");
  assert.equal(dit("jalon", { quoi, n: 12 }, lecteur({})), null, quoi + " : rien pour qui ne l'a pas (anti-spoil)");
  assert.ok(dit("jalon", { quoi, n: 12 }, lecteur({ [menu]: true }), true), quoi + " : version « toi »");
}
assert.equal(dit("jalon", { quoi: "inconnu", n: 1 }, lecteur({ augmentations: true })), null, "jalon inconnu : rien");
console.log("idle-flux-fruits-labos-jalons-v1 : OK");
