import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-11-22) : « je replace tout, je sauvegarde, le résultat est visible dans l'ITOPOD, mais quand je vais dans Réglages les items sont placés n'importe comment » : un ancien brouillon était réappliqué par-dessus le profil enregistré.
 */
const src = readFileSync(new URL("../public/modules/profil-badavatar-editeur-v1.js", import.meta.url), "utf8");
assert.ok(src.includes("choix: choixPourServeur(), depuis: E.enregistre"), "le brouillon note le profil enregistré dont il part");
const i = src.indexOf("function lireBrouillon()");
const corps = src.slice(i, src.indexOf("/* ---------- chargement", i));
assert.ok(corps.includes("b.depuis !== E.enregistre") && corps.includes("effacerBrouillon()"), "un brouillon fait sur un autre profil enregistré est jeté");

// Comportement : on exécute les trois fonctions du brouillon sur un faux stockage.
const stock = new Map();
const localStorage = { getItem: (k) => (stock.has(k) ? stock.get(k) : null), setItem: (k, v) => stock.set(k, String(v)), removeItem: (k) => stock.delete(k) };
const fn = new Function("localStorage", "E", "CLE_BROUILLON", "minuteurBrouillon", `
  function effacerBrouillon() { try { localStorage.removeItem(CLE_BROUILLON); } catch (_e) {} }
  ${corps}
  return lireBrouillon;`);
const E = { base: "norman", enregistre: "v2" };
const lire = fn(localStorage, E, "cle", null);
stock.set("cle", JSON.stringify({ base: "norman", reglages: { Yeux: { dx: 0.3 } }, depuis: "v2" }));
assert.ok(lire(), "brouillon fait depuis le profil enregistré courant : repris");
stock.set("cle", JSON.stringify({ base: "norman", reglages: { Yeux: { dx: 0.3 } }, depuis: "v1" }));
assert.equal(lire(), null, "ancien brouillon (profil enregistré depuis modifié) : ignoré");
assert.equal(stock.has("cle"), false, "… et supprimé");
stock.set("cle", JSON.stringify({ base: "norman", reglages: { Yeux: { dx: 0.3 } } }));
assert.equal(lire(), null, "brouillon sans « depuis » (ancien format) : ignoré");
console.log("idle-profil-badavatar-brouillon-perime-v1: OK");
