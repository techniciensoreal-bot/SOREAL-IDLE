import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { instantaneJoueurV1, evenementsV1, IDLE_FLUX_DELAI_BOOST_MS_V1 } from "../src/idle-flux-v1.js";

/*
 * « En direct » (Norman, 2026-10-09) : annoncer quand quelqu'un met des boosts dans le Cube de l'infini ou dans une pièce en particulier, avec des phrases d'humour. Les compteurs sont tenus par le moteur
 * (adventure.boostFlux) ; le nom du cube et celui de la pièce ne sont donnés qu'au lecteur qui les connaît (anti-spoil, règle n°2).
 */
const moteur = readFileSync("cloudflare/src/idle-adventure-v47.js", "utf8");
assert.ok(moteur.includes("fluxBoostV1(s,\"piece\",o.definitionId)") && moteur.includes("fluxBoostV1(s,\"cube\",\"\")"), "le moteur compte les boosts de pièce et de cube");

// Les compteurs sont lus dans m.adventure.boostFlux (m = métadonnées NGU du joueur).
const lire = (bf) => instantaneJoueurV1({ stats: { metaNgu: { adventure: { boostFlux: bf } } } });
const a = lire({ cube: 2, piece: 5, last: "magitech_boots" });
assert.deepEqual([a.boostCube, a.boostPieces, a.boostDernier], [2, 5, "magitech_boots"]);
assert.deepEqual([lire({}).boostCube, lire({}).boostPieces, lire({}).boostDernier], [0, 0, ""]);

const noms = {};
const avant = lire({ cube: 1, piece: 1, last: "x" });
assert.deepEqual(evenementsV1(avant, lire({ cube: 1, piece: 1, last: "x" }), noms), [], "rien n'a changé");
assert.deepEqual(evenementsV1(avant, lire({ cube: 4, piece: 1, last: "x" }), noms), [{ type: "cube", donnees: { n: 3 } }]);
assert.deepEqual(evenementsV1(avant, lire({ cube: 1, piece: 2, last: "magitech_boots" }), noms), [{ type: "piece", donnees: { def: "magitech_boots", n: 1 } }]);
assert.deepEqual(evenementsV1({ bossMax: 5, succes: [], titans: {}, defis: {}, rebirths: 0 }, lire({ cube: 9, piece: 9, last: "x" }), noms).map((e) => e.type), [], "ancien instantané : pas de comparaison");
assert.ok(IDLE_FLUX_DELAI_BOOST_MS_V1 >= 30000, "au plus une annonce de boost par minute environ");

// Phrases côté lecteur.
const ctx = { window: { __SOREAL_IDLE_ACTIVITE_V1__: () => null }, document: { addEventListener() {}, getElementById: () => null, createElement: () => ({ style: {}, setAttribute() {}, appendChild() {} }), head: { appendChild() {} }, body: { appendChild() {} } }, setInterval() {}, setTimeout() {}, localStorage: { getItem: () => null, setItem() {} }, console };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(readFileSync("cloudflare/public/modules/flux-v1.js", "utf8"), ctx);
const { phrase } = ctx.window.__SOREAL_IDLE_FLUX_V1__;
const lecteur = (extra) => ({ zones: [], bossMax: 0, connus: { boss: {}, titan: {}, succes: {}, menus: { cube: false }, pieces: {}, ...extra } });
const avecCube = lecteur({ menus: { cube: true }, pieces: { magitech_boots: "Bottes Magitech" } });
const sansRien = lecteur({});
const p = (id, type, d, l) => phrase({ id, type, nom: "Franz", donnees: d }, l);

// Cube : jamais pour un lecteur qui ne l'a pas.
assert.equal(p(0, "cube", { n: 1 }, sansRien), null, "cube inconnu du lecteur : rien (on ne révèle pas son existence)");
assert.ok(p(0, "cube", { n: 1 }, avecCube).texte.startsWith("Franz vient de nourrir son cube de l’infini et a failli y laisser un doigt"));
// Pièce : nommée seulement si le lecteur la connaît.
assert.equal(p(0, "piece", { def: "magitech_boots" }, avecCube).texte, "Franz renforce « Bottes Magitech »");
assert.equal(p(0, "piece", { def: "magitech_boots" }, sansRien).texte, "Franz renforce une de ses pièces", "pièce inconnue du lecteur : jamais son nom");
assert.ok(!p(3, "piece", { def: "secret_item" }, avecCube).texte.includes("secret_item"), "jamais l'identifiant brut");
// Vingt variantes distinctes par situation.
const n = (type, d, l) => new Set(Array.from({ length: 60 }, (_, i) => p(i, type, d, l).texte)).size;
assert.ok(n("cube", {}, avecCube) >= 20, "cube : " + n("cube", {}, avecCube));
assert.ok(n("piece", { def: "magitech_boots" }, avecCube) >= 20, "pièce nommée");
assert.ok(n("piece", { def: "x" }, sansRien) >= 20, "pièce anonyme");

// Objet transformé (Norman, 2026-10-10 : « quand on transforme un objet, par exemple le pendentif de la forêt, ça doit passer En Direct »).
assert.ok(moteur.includes("function fluxTransformV1(s,de,vers)") && moteur.includes("fluxTransformV1(s,o.definitionId,cible)") && moteur.includes("fluxTransformV1(s,defDepart,\"\")"), "le moteur compte les transformations");
const t0 = lire({ transform: 1, transformDe: "forestPendant", transformVers: "ascendedForestPendant" });
assert.deepEqual([t0.transformations, t0.transformDe, t0.transformVers], [1, "forestPendant", "ascendedForestPendant"]);
const avantT = lire({});
const apresT = lire({ transform: 1, transformDe: "forestPendant", transformVers: "ascendedForestPendant" });
assert.deepEqual(evenementsV1(avantT, apresT, {}), [{ type: "transformation", donnees: { de: "forestPendant", vers: "ascendedForestPendant" } }]);
assert.deepEqual(evenementsV1(apresT, apresT, {}), [], "rien n'a changé");
const lecteurT = lecteur({ pieces: { forestPendant: "Pendentif de la forêt", ascendedForestPendant: "Pendentif de la forêt ascendant" } });
assert.equal(p(0, "transformation", { de: "forestPendant", vers: "ascendedForestPendant" }, lecteurT).texte, "Franz transforme « Pendentif de la forêt » — elle devient « Pendentif de la forêt ascendant »");
const peuConnu = lecteur({ pieces: { forestPendant: "Pendentif de la forêt" } });
assert.equal(p(0, "transformation", { de: "forestPendant", vers: "ascendedForestPendant" }, peuConnu).texte, "Franz transforme « Pendentif de la forêt »", "l'objet obtenu n'est pas nommé s'il est inconnu du lecteur");
assert.equal(p(0, "transformation", { de: "forestPendant", vers: "ascendedForestPendant" }, sansRien).texte, "Franz transforme une de ses pièces", "rien de nommé pour un lecteur qui ne les connaît pas");
assert.ok(new Set(Array.from({ length: 60 }, (_, i) => p(i, "transformation", { de: "forestPendant" }, peuConnu).texte)).size >= 20, "vingt variantes");
console.log("idle-flux-boosts-v1: OK");
