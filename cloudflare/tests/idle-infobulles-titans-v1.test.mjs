import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import "../src/idle-ngu-progression.js"; // ordre d'import : évite le cycle idle-adventure-v47 <-> butin
import { IDLE_INFOBULLES_TITANS_V1, idleInfobullesTitansV1 } from "../src/idle-infobulles-aventure-v1.js";
import { idleNguSnapshot, normalizeIdleNguState } from "../src/idle-ngu-progression.js";

/*
 * Infobulle de chaque titan (jeu : AdventureController::beastLootRates, nerdLootRates, godmotherLootRates, exileLootRates, itHungersLootRates, rockLobsterLootRates, amalgamateLootRates ;
 * zoneDescriptions pour Jake, UUG, Walderp). Valeur = base x facteur de butin x 100, remplacée par le PLAFOND (vert) quand elle l'atteint. Règle n°2 : titans et versions verrouillés absents.
 */
const f = (id, kills = 0, difficultyKills = {}, ok = true) => ({ id, progressionUnlocked: ok, state: { kills, difficultyKills } });
const lire = (id, titans, facteur) => idleInfobullesTitansV1(titans, facteur)[id];
const pct = (l, k) => l.find((x) => x.k === k);

// --- Chiffres du jeu (IL, facteur de butin 1) : la Bête n'a que « Main Set », 0,05 %.
assert.deepEqual(lire("t6", [f("t6")], 1), [{ k: "main", pct: 0.05 }], "Bête : une seule ligne, 0,05 %");
// Nerd : 0,035 / 0,027 / 0,022 / 0,017 % ; versions ouvertes une à une.
const nerd1 = lire("nerd", [f("nerd")], 1);
assert.deepEqual(nerd1, [{ k: "main", pct: 0.035 }], "Greasy Nerd : seule la 1re version tant que rien n'est vaincu");
const nerd2 = lire("nerd", [f("nerd", 1, { easy: 1 })], 1);
assert.deepEqual(nerd2.map((x) => [x.k, x.pct]), [["main", 0.035], ["v2", 0.027]], "la V2 s'ouvre quand la V1 est vaincue, pas la V3");
const nerdTout = lire("nerd", [f("nerd", 9, { easy: 1, normal: 1, hard: 1 })], 1);
assert.deepEqual(nerdTout.map((x) => [x.k, x.pct]), [["main", 0.035], ["v2", 0.027], ["v3", 0.022], ["v4", 0.017]]);
const att = { godmother: [0.01, 0.0075, 0.006, 0.0045], t7: [0.002, 0.001, 0.0006, 0.0004], hungers: [1e-4, 6e-5, 4e-5, 3e-5], lobster: [1e-5, 6.5e-6, 4e-6, 3e-6], amalgamate: [1.4e-6, 1e-6, 8e-7, 6e-7] };
for (const [id, v] of Object.entries(att)) {
  const l = lire(id, [f(id, 9, { easy: 1, normal: 1, hard: 1 })], 1);
  assert.equal(l.length, 4, id + " : quatre lignes");
  l.forEach((x, i) => assert.ok(Math.abs(x.pct - v[i]) < v[i] * 1e-9, id + " " + x.k + " : " + x.pct + " attendu " + v[i]));
}
// Jake, UUG, Walderp (zoneDescriptions : Normal Loot / Rare Loot).
assert.deepEqual(lire("t3", [f("t3")], 1).map((x) => [x.k, x.pct]), [["normal", 10], ["rare", 2]]);
assert.deepEqual(lire("t4", [f("t4")], 1).map((x) => [x.k, x.pct]), [["normal", 2], ["rare", 0.1]]);
assert.deepEqual(lire("t5", [f("t5")], 1).map((x) => [x.k, x.pct]), [["normal", 0.5], ["rare", 0.01]]);

// --- Facteur de butin : x1000 sur un titan Evil = racine cubique (x10) ; la Bête (non Evil) multiplie tel quel.
const nerd1000 = lire("nerd", [f("nerd")], 1000)[0];
assert.ok(Math.abs(nerd1000.pct - 0.35) < 1e-6 && !nerd1000.plafond, "Nerd x1000 : racine cubique, 0,35 %");
assert.ok(Math.abs(lire("t6", [f("t6")], 1000)[0].pct - 50) < 1e-9, "Bête x1000 : sans racine, 50 %");

// --- Plafond (25 % pour les Evil), en vert : la valeur affichée devient le plafond.
const plaf = lire("nerd", [f("nerd")], 1e12)[0];
assert.deepEqual(plaf, { k: "main", pct: 25, plafond: true }, "au plafond : 25 % et drapeau vert");
assert.equal(lire("t6", [f("t6")], 1e6)[0].plafond, true, "Bête : plafond de 100 % (sans plafond donné)");
assert.equal(lire("t3", [f("t3")], 5)[0].pct, 50);
assert.equal(lire("t3", [f("t3")], 11)[0].plafond, true);

// --- Anti-spoil (règle n°2) : un titan fermé (jamais vaincu) n'a aucune ligne ; la liste n'en contient que d'ouverts.
assert.deepEqual(idleInfobullesTitansV1([f("nerd", 0, {}, false), f("hungers", 0, {}, false), f("tippi", 0, {}, true)], 1), {}, "titan fermé ou sans butin : rien");
const neuf = idleNguSnapshot(normalizeIdleNguState({}, { bosses: 20 }, 1_000_000), { bosses: 20 }, 1_000_000).adventure;
assert.deepEqual(neuf.infobulles.titans, {}, "joueur neuf : aucun titan");
assert.deepEqual(neuf.infobulles.zones, {}, "joueur neuf : aucune zone");
const loin = idleNguSnapshot(normalizeIdleNguState({}, { bosses: 140 }, 1_000_000), { bosses: 140 }, 1_000_000).adventure;
const ids = Object.keys(loin.infobulles.titans);
for (const id of ids) assert.ok(loin.titans.some((t) => t.id === id), "ligne pour un titan absent de la réponse : " + id);
assert.ok(!ids.includes("nerd") && !ids.includes("hungers") && !ids.includes("amalgamate"), "titans Evil/Sadistic fermés : aucune ligne");
assert.ok(JSON.stringify(neuf.infobulles).indexOf("nerd") < 0, "aucun nom de titan fermé dans la pièce");

// --- Les bases du tableau sont celles du moteur (rollTitanLootV1) : jamais deux valeurs qui divergent.
const combat = readFileSync("cloudflare/src/idle-adventure-combat.js", "utf8");
const ecrit = (b) => { const s = String(b); return s.startsWith("0.") ? s.slice(1) : s; };
for (const [id, d] of Object.entries(IDLE_INFOBULLES_TITANS_V1)) {
  if (d.paliers === false) continue; // Jake, UUG, Walderp : valeurs courtes (.1, .02, .005, ...), contrôlées plus haut contre le jeu
  for (const [k, base] of d.lignes) assert.ok(combat.includes(ecrit(base)), id + " " + k + " : base " + ecrit(base) + " absente du moteur");
}

// --- Mise en forme côté client : « ##0.## », plafond en vert, libellés du jeu en anglais.
const ctx = { window: { __langue: "fr" }, document: {} };
ctx.window.__SOREAL_IDLE_LANGUE_V1__ = () => ctx.window.__langue;
const etat = { systemes: { adventure: { infobulles: { titans: { nerd: [{ k: "main", pct: 0.035 }, { k: "v2", pct: 25, plafond: true }], t6: [{ k: "main", pct: 0.0001 }] }, zones: {} } } } };
ctx.window.__SOREAL_IDLE_LIRE_ETAT_V1__ = () => etat;
vm.runInNewContext(readFileSync("cloudflare/public/modules/infobulles-aventure-v1.js", "utf8"), ctx);
const IB = ctx.window.__SOREAL_IDLE_INFOBULLES_AVENTURE_V1__;
assert.equal(IB.formaterPct(0.035), "0,04", "format ##0.## : 0,035 -> 0,04");
assert.equal(IB.formaterPct(7), "7");
assert.equal(IB.formaterPct(0.0001), "0", "le jeu écrit 0 sous 0,005 %");
assert.equal(IB.formaterPct(0.055), "0,06");
const html = IB.titanHtml("nerd");
assert.ok(html.includes("Chance de butin de l’ensemble principal") && html.includes("Butins V2"), "libellés français");
assert.ok(html.includes("0,04 %") && /ttn-butin-plafond">25 %</.test(html), "valeur, puis plafond en vert");
ctx.window.__langue = "en";
const htmlEn = IB.titanHtml("nerd");
assert.ok(htmlEn.includes("Main Set Drop Chance") && htmlEn.includes("V2 Drops") && htmlEn.includes("0.04%"), "libellés du jeu en anglais, point décimal");
assert.equal(IB.titanHtml("hungers"), "", "titan absent de la pièce : aucun bloc");
assert.notEqual(IB.titanSignature("nerd"), IB.titanSignature("t6"));

// --- La carte du titan affiche le bloc, et le script est chargé.
const carte = readFileSync("cloudflare/public/modules/titans-v1.js", "utf8");
assert.ok(carte.includes("infobulles().titanHtml(id)") && carte.includes("titanSignature"), "carte du titan : bloc de butin + signature");
assert.ok(readFileSync("cloudflare/public/index.html", "utf8").includes("/modules/infobulles-aventure-v1.js"), "script chargé");
const dico = JSON.parse(readFileSync("cloudflare/public/modules/traduction-anglais-dict-v1.json", "utf8"));
assert.equal(dico["Chance de butin de l’ensemble principal"], "Main Set Drop Chance");
assert.equal(dico["Butins V2"], "V2 Drops");
console.log("idle-infobulles-titans-v1: OK");
