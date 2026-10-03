import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { traduireReponseV1, IDLE_TRADUCTIONS_STATS_V1 } from "../src/idle-traductions-v1.js";
import { IDLE_PERKS_CATALOG_V1 } from "../src/idle-perks-v1.js";
import { IDLE_ADVENTURE_ITEM_CATALOG_V1 } from "../src/idle-adventure-v47.js";

/* Norman (2026-10-03) : tout en français, avec choix Français / English (originaux) pour les items et les textes. */
assert.ok(IDLE_TRADUCTIONS_STATS_V1.enVersFr > 1000, "tables de traduction chargées");
const perk = IDLE_PERKS_CATALOG_V1[0];

// Français (défaut) : les textes d'origine anglais sortent traduits ; les nombres ne bougent pas.
const fr = traduireReponseV1({ perks: [{ id: perk.id, name: perk.name, effect: perk.effect, cost: 5 }] }, "fr");
assert.notEqual(fr.perks[0].name, perk.name, "nom d'atout traduit");
assert.notEqual(fr.perks[0].effect, perk.effect, "description traduite");
assert.equal(fr.perks[0].cost, 5);
assert.equal(fr.perks[0].id, perk.id);
assert.equal(traduireReponseV1({ a: 1 }, undefined).a, 1, "langue absente = français");

// English : les noms déjà traduits à la source retrouvent leur original.
const cat = IDLE_ADVENTURE_ITEM_CATALOG_V1;
assert.equal(cat.pissedOffKey.name, "Clé furieuse");
assert.equal(traduireReponseV1({ n: cat.pissedOffKey.name }, "en").n, "Pissed Off Key");
assert.equal(traduireReponseV1({ n: cat["forest:weapon"].name }, "en").n, "Kokiri Blade");
assert.equal(traduireReponseV1({ n: "Set de la forêt" }, "en").n, "Forest Set");
assert.equal(traduireReponseV1({ n: "Clé furieuse" }, "fr").n, "Clé furieuse", "déjà français : inchangé");
// Les textes d'origine (anglais) restent tels quels en English.
assert.equal(traduireReponseV1({ n: perk.name }, "en").n, perk.name);

// Copie à l'écriture : l'objet d'origine (catalogue figé, mémo du moteur) n'est jamais modifié.
const origine = Object.freeze({ liste: Object.freeze([Object.freeze({ name: perk.name })]) });
const traduit = traduireReponseV1(origine, "fr");
assert.equal(origine.liste[0].name, perk.name);
assert.notEqual(traduit.liste[0].name, perk.name);
// Rien à traduire : même référence (aucune copie inutile).
const rien = { a: [1, 2, { b: "texte inconnu" }] };
assert.equal(traduireReponseV1(rien, "fr"), rien);

// Câblage : le coordinateur traduit avant l'allègement des catalogues, le pont envoie la langue, les Réglages la proposent.
const coordinateur = readFileSync("cloudflare/src/index-idle-coordinator-v1.js", "utf8");
assert.ok(coordinateur.includes("allegerCataloguesV1(traduireReponseV1(runSorealIdleOperation("), "traduction avant allègement");
assert.ok(coordinateur.includes("payload?.langue"));
const entree = readFileSync("cloudflare/src/idle-worker-entry-v1.js", "utf8");
assert.ok(entree.includes('langue: body && body.langue === "en" ? "en" : "fr"'));
const pont = readFileSync("cloudflare/public/standalone-bridge.js", "utf8");
assert.ok(pont.includes("langue:langueIdleV1()") && pont.includes("soreal_idle_langue_v1"));
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
assert.ok(ui.includes("__changerLangueIdleV1__") && ui.includes("🌐 Langue des objets et des textes"));
console.log("idle-langue-items-textes-v1: OK");
