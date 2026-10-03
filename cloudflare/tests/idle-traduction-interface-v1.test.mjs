import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Norman (2026-10-03) : libellés de l'interface en français (menus, statistiques, compétences, termes du jeu) ; « English » garde les originaux. */
globalThis.window = {};
globalThis.localStorage = { getItem: () => null };
globalThis.document = { readyState: "loading", addEventListener() {} };
new Function(readFileSync("cloudflare/public/modules/traduction-interface-v1.js", "utf8"))();
const t = window.__SOREAL_IDLE_TRADUCTION_TEXTE_V1__;

assert.equal(t("Fight Boss"), "Combat de boss");
assert.equal(t("🥊 Basic Training"), "🥊 Entraînement de base");
assert.equal(t("⚙️ Settings"), "⚙️ Réglages");
assert.equal(t("Magic Power +12 %"), "Puissance de Magie +12 %");
assert.equal(t("Place de l’Energy sur un Augment"), "Place de l’Énergie sur un Augment");
assert.equal(t("Gold Drops"), "Or des drops");
assert.equal(t("Time Machine"), "Machine temporelle");
assert.equal(t("Blood Magic"), "Magie du sang", "l'expression longue passe avant « Magic »");
assert.equal(t("Beast Mode"), "Mode Bête");
// Mots entiers seulement : jamais au milieu d'un autre mot.
assert.equal(t("Capacité"), "Capacité");
assert.equal(t("Powerful"), "Powerful");
assert.equal(t("Plafond"), "Plafond");

// Jamais dans les champs de saisie ni dans le chat / le bandeau « En direct » ; inactif en English.
const src = readFileSync("cloudflare/public/modules/traduction-interface-v1.js", "utf8");
assert.ok(src.includes('[class*="sic-"],[class*="sif-"]'), "chat et « En direct » exclus");
assert.ok(src.includes("'TEXTAREA'") && src.includes("'INPUT'"));
assert.ok(src.includes("langue_()!=='fr'"), "rien n'est remplacé en English");
assert.ok(readFileSync("cloudflare/public/index.html", "utf8").includes("/modules/traduction-interface-v1.js"));
console.log("idle-traduction-interface-v1: OK");
