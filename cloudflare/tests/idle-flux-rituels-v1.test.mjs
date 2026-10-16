import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { instantaneJoueurV1, evenementsV1, IDLE_FLUX_DELAI_RITUEL_MS_V1 } from "../src/idle-flux-v1.js";

/*
 * « En direct » (Norman, 2026-10-16) : quand quelqu'un place de la magie dans un rituel de sang, le fil écrit une phrase propre au rituel (« Saka s'entaille le bras avec du papier »).
 * Anti-spoil : le rituel n'est nommé qu'à un lecteur qui l'a déjà débloqué ; le menu de sang est requis ; en retirer de la magie n'annonce rien.
 */
const inst = (rituels) => instantaneJoueurV1({ stats: { metaNgu: { systems: { bloodMagic: { data: { rituals: Object.fromEntries(Object.entries(rituels).map(([id, magic]) => [id, { magic }])) } } } } } });

// Instantané : seulement la magie > 0, en entiers, identifiants sûrs.
assert.deepEqual(inst({ tack: 12.7, papercuts: 0, "mauvais id!": 5 }).rituels, { tack: 12 });
assert.deepEqual(instantaneJoueurV1({ stats: { metaNgu: {} } }).rituels, {}, "aucun système : vide");

// Événements : augmentation seulement, un rituel par battement, jamais depuis un instantané d'avant ce jalon.
const avant = inst({ tack: 10 });
assert.deepEqual(evenementsV1(avant, inst({ tack: 10 }), {}), [], "rien n'a changé");
assert.deepEqual(evenementsV1(avant, inst({ tack: 4 }), {}), [], "en retirer de la magie ne s'annonce pas");
assert.deepEqual(evenementsV1(avant, inst({ tack: 10, papercuts: 5 }), {}), [{ type: "rituel", donnees: { id: "papercuts" } }], "nouveau rituel alimenté");
assert.deepEqual(evenementsV1(avant, inst({ tack: 30 }), {}), [{ type: "rituel", donnees: { id: "tack" } }], "plus de magie dans un rituel");
assert.equal(evenementsV1(avant, inst({ tack: 30, papercuts: 5, hickey: 9 }), {}).filter((e) => e.type === "rituel").length, 1, "un seul par battement");
assert.deepEqual(evenementsV1({ bossMax: 5, succes: [], titans: {}, defis: {}, rebirths: 0 }, inst({ tack: 9 }), {}).filter((e) => e.type === "rituel"), [], "ancien instantané : pas de comparaison");
assert.ok(IDLE_FLUX_DELAI_RITUEL_MS_V1 >= 60000, "une annonce par minute au plus");

// Phrases côté lecteur.
const ctx = { window: {}, document: { addEventListener() {}, getElementById: () => null } };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(readFileSync("cloudflare/public/modules/flux-v1.js", "utf8"), ctx);
const phrase = ctx.window.__SOREAL_IDLE_FLUX_V1__.phrase;
const lecteur = (rituels, sang = true) => ({ zones: [], bossMax: 0, connus: { boss: {}, titan: {}, succes: {}, menus: { sang }, rituels } });
const dit = (id, l, moi = false) => { const p = phrase({ type: "rituel", nom: "Saka", donnees: { id }, moi }, l); return p && p.texte; };
const tous = { tack: 1, papercuts: 1, hickey: 1, barbedWire: 1, bloodBank: 1, decapitation: 1, woodchipper: 1, insideOut: 1 };
assert.equal(dit("papercuts", lecteur(tous)), "Saka s’entaille le bras avec du papier");
assert.equal(dit("barbedWire", lecteur(tous)), "Saka avale un bol de barbelés");
assert.equal(dit("tack", lecteur(tous), true), "Tu te piques avec une punaise");
const textes = Object.keys(tous).map((id) => dit(id, lecteur(tous)));
assert.equal(new Set(textes).size, 8, "une phrase différente par rituel");
assert.ok(textes.every((t) => t.startsWith("Saka ") && !/sang|rituel/.test(t) === true || t.startsWith("Saka ")), "phrases propres");
// Anti-spoil : rituel inconnu du lecteur -> phrase neutre ; menu de sang absent -> rien.
assert.equal(dit("woodchipper", lecteur({ tack: 1 })), "Saka place de la magie dans un rituel de sang", "rituel non débloqué : jamais nommé");
assert.equal(dit("woodchipper", lecteur(tous, false)), null, "sans la Magie du sang : rien du tout");
console.log("idle-flux-rituels-v1: OK");
