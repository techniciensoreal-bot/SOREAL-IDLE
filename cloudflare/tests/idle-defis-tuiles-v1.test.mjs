import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";

/* Menu Défis, look jeu vidéo (Norman, 2026-10-11) : tuiles à blason, étoiles, bouton Jouer ; seuls les défis envoyés par le serveur (donc débloqués) apparaissent. */
const code = readFileSync(new URL("../public/modules/challenges-v1.js", import.meta.url), "utf8");
const sandbox = { window: {}, document: { getElementById() { return null; }, head: { appendChild() {} } }, requestAnimationFrame() {} };
sandbox.window.window = sandbox.window;
sandbox.window.__SOREAL_IDLE_META_HOST_V130__ = { entetePageIdleV28_: (t) => "<header>" + t + "</header>" };
vm.runInNewContext(code, sandbox);
const api = sandbox.window.__SOREAL_IDLE_DEFIS_V1__;

const def = (id, completion, extra = {}) => ({ id, tier: "normal", completion, max: 5, unlocked: true, implemented: true, active: false, reward: { experience: 1500, ap: 2500 }, targetBoss: 58, targetStep: 0, ...extra });
const html = api.page({ systemes: { challengeDefinitions: [def("basic", 2), def("noAugmentations", 5)], challenge: {} } });

assert.equal((html.match(/class="dfi-tuile /g) || []).length, 2, "une tuile par défi envoyé, pas une de plus (aucun défi verrouillé)");
assert.ok(html.includes("dfi-emb") && html.includes('class="dfi-etoile on"'), "blason dessiné et étoiles de complétion");
assert.equal((html.match(/class="dfi-etoile on"/g) || []).length, 2 + 5, "étoiles allumées = complétions");
assert.equal((html.match(/class="dfi-jouer"/g) || []).length, 2, "un bouton Jouer par défi lançable");
assert.ok(html.includes("dfi-aide") && html.includes("Comment fonctionnent les défis"), "le texte d'explication est replié");
assert.ok(!html.includes("🔒") && !/verrouill/i.test(html.replace(/[^<]*Comment fonctionnent[\s\S]*?<\/details>/, "")), "rien de verrouillé n'est montré");

// défi en cours : bandeau, pas de bouton Jouer sur les tuiles
const htmlActif = api.page({ systemes: { challengeDefinitions: [def("basic", 0, { active: true }), def("noAugmentations", 0)], challenge: { startedAt: Date.now() } } });
assert.ok(htmlActif.includes("dfi-encours") && htmlActif.includes("Abandonner le défi"));
assert.ok(!htmlActif.includes('class="dfi-jouer"'), "pas de Jouer tant qu'un défi est en cours");
console.log("idle-defis-tuiles-v1: OK");
