import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import "../src/idle-ngu-progression.js"; // ordre d'import : évite le cycle idle-adventure-v47 <-> butin
import { idleEchelleBossObjetV1, idleObjetsAvecEchelleBossV1 } from "../src/idle-infobulles-aventure-v1.js";
import { IDLE_BOSS_REQUIS_V1, idleBossRequisEchelleV1 } from "../src/idle-adventure-boss-requis-v1.js";
import { IDLE_ADVENTURE_WIKI_ITEM_IDS_V1 } from "../src/idle-adventure-sets.js";

/*
 * Infobulle d'équipement (jeu : Equipment::tooltipText) : « Stats (X%) » avec X = min(1, boss effectif / bossRequired) x 100 (format « ##.# »), affiché seulement sous le palier ; Power et Toughness mis à
 * l'échelle floor(valeur x X), Max Health = Power mis à l'échelle x 3, Health Regen = Toughness mis à l'échelle x 0,03, chaque Special mis à l'échelle de la même façon.
 */
const def = (palier) => Object.entries(IDLE_ADVENTURE_WIKI_ITEM_IDS_V1).find(([, id]) => IDLE_BOSS_REQUIS_V1[id] === palier)[0];
const d20 = def(20);
const d100 = def(100);
const objet = (definitionId, extra = {}) => ({ definitionId, power: 100, toughness: 50, level: 10, ...extra });

// Palier 20 : boss effectif 10 -> 50 %, Power 50, Max Health 150, Toughness 25, Regen 0,75.
const e = idleEchelleBossObjetV1(objet(d20), 10);
assert.equal(e.pct, 50);
assert.equal(e.power, 50);
assert.equal(e.hp, 150, "Max Health = Power mis à l'échelle x 3");
assert.equal(e.toughness, 25);
assert.ok(Math.abs(e.regen - 0.75) < 1e-12, "Health Regen = Toughness mis à l'échelle x 0,03");
// Plancher (floor) comme le jeu : 33 % de 100 = 33, de 50 = 16.
const e3 = idleEchelleBossObjetV1(objet(d100), 33);
assert.equal(e3.pct, 33);
assert.equal(e3.power, idleBossRequisEchelleV1(100, 0.33));
assert.equal(e3.toughness, Math.floor(50 * 0.33 + 1e-9));
// Pourcentage au dixième (« ##.# ») : 1/3 -> 33,3.
assert.equal(idleEchelleBossObjetV1(objet(d100), 100 / 3).pct, 33.3);
// Chaque special est mis à l'échelle (un par ligne de specialsAll, dans l'ordre).
const dSpec = Object.entries(IDLE_ADVENTURE_WIKI_ITEM_IDS_V1).filter(([, id]) => IDLE_BOSS_REQUIS_V1[id] === 20).map(([d]) => d);
const avecSpecials = dSpec.map((d) => idleEchelleBossObjetV1(objet(d, { special: 10 }), 10)).find((x) => x && x.specials && x.specials.length > 0);
assert.ok(avecSpecials && avecSpecials.specials.every((v) => Number.isFinite(v) && v >= 0), "specials mis à l'échelle");
// Pas d'« (X%) » au palier atteint, sans palier, ou sans boss effectif connu.
assert.equal(idleEchelleBossObjetV1(objet(d20), 20), null, "boss effectif = palier : pas de pourcentage");
assert.equal(idleEchelleBossObjetV1(objet(d20), 400), null);
assert.equal(idleEchelleBossObjetV1(objet(d20), null), null, "boss effectif inconnu : aucune échelle");
const sansPalier = Object.entries(IDLE_ADVENTURE_WIKI_ITEM_IDS_V1).find(([, id]) => !IDLE_BOSS_REQUIS_V1[id])[0];
assert.equal(idleEchelleBossObjetV1(objet(sansPalier), 1), null, "objet sans bossRequired : jamais d'échelle");
// Copie : l'état n'est jamais modifié, un objet sans échelle reste le même.
const sac = [objet(d20), objet(sansPalier)];
const sortie = idleObjetsAvecEchelleBossV1(sac, 10);
assert.ok(sortie[0].echelleBoss && sortie[0].echelleBoss.pct === 50 && !("echelleBoss" in sac[0]), "copie, état intact");
assert.equal(sortie[1], sac[1], "objet sans échelle : même objet");

// La réponse d'état porte l'échelle sur les objets du sac (nombre de boss tués du Rebirth en cours : state.adventure.bossEffectif).
const { idleNguSnapshot, normalizeIdleNguState } = await import("../src/idle-ngu-progression.js");
const t0 = 1_000_000;
const st = normalizeIdleNguState({}, { bosses: 10 }, t0);
const premier = st.adventure.inventory.find((o) => o);
if (premier) premier.definitionId = d20;
const snap = idleNguSnapshot(st, { bosses: 10 }, t0).adventure;
const dansSac = snap.inventory.find((o) => o && o.definitionId === d20);
assert.ok(premier, "le sac de départ contient un objet");
assert.ok(dansSac && dansSac.echelleBoss && dansSac.echelleBoss.pct === 50, "la réponse d'état porte echelleBoss");

// Client : « Stats (X %) » et valeurs réduites dans la fiche d'objet.
const ui = readFileSync("cloudflare/public/modules/ui-aventure-2-v1.js", "utf8");
assert.ok(ui.includes("item.echelleBoss") && ui.includes("idle-echelle-boss-v1") && ui.includes("formaterEchelle(eb.pct)"), "fiche d'objet : Stats (X %)");
assert.ok(ui.includes("const curPower=eb?idleNombre_(eb.power):idleNombre_(item.power);") && ui.includes("eb.specials"), "valeurs réduites : Power, Max Health, Toughness, Regen, specials");
const ctx = { window: {}, document: {} };
ctx.window.__SOREAL_IDLE_LANGUE_V1__ = () => "fr";
vm.runInNewContext(readFileSync("cloudflare/public/modules/infobulles-aventure-v1.js", "utf8"), ctx);
const IB = ctx.window.__SOREAL_IDLE_INFOBULLES_AVENTURE_V1__;
assert.equal(IB.formaterEchelle(33.3), "33,3");
assert.equal(IB.formaterEchelle(50), "50", "« ##.# » : pas de décimale inutile");
ctx.window.__SOREAL_IDLE_LANGUE_V1__ = () => "en";
assert.equal(IB.formaterEchelle(33.3), "33.3");
console.log("idle-infobulles-equipement-v1: OK");
