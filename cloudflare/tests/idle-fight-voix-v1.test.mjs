// Voix « FIGHT ! » du bouton rouge (Norman, 2026-10-06) : trois voix numérisées (démon, double voix, dramatique) qui tournent à chaque clic.
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import vm from "node:vm";

const src = readFileSync("cloudflare/public/modules/fight-voix-v1.js", "utf8");
const index = readFileSync("cloudflare/public/index.html", "utf8");
assert.ok(/\/modules\/fight-voix-v1\.js\?v=\d+/.test(index), "module chargé par index.html");

// Fenêtre factice sans audio : l'ordre de rotation doit tout de même avancer.
const ecouteurs = {};
const fenetre = { document: { addEventListener: (t, f) => { (ecouteurs[t] = ecouteurs[t] || []).push(f); }, removeEventListener() {} }, __SOREAL_IDLE_AUDIO_VOLUME_V1__: { getVoix: () => 0.75 } };
fenetre.window = fenetre;
vm.runInNewContext(src, Object.assign(fenetre, { document: fenetre.document, Promise, Math, Float32Array }), { filename: "fight-voix-v1.js" });
const api = fenetre.__SOREAL_IDLE_FIGHT_VOIX_V1__;
assert.ok(api, "API exposée");
assert.deepEqual(Array.from(api.variantes), ["Démon", "Double voix", "Dramatique"], "trois voix");
assert.equal(api.indexSuivant(), 0, "on commence par la première");
const suite = [];
for (let i = 0; i < 7; i++) { suite.push(api.indexSuivant()); await api.suivante(); }
assert.deepEqual(suite, [0, 1, 2, 0, 1, 2, 0], "1, 2, 3, 1, 2, 3, 1 : une voix différente à chaque clic");

// Le clic sur le bouton rouge (et seulement lui, et pas désactivé) déclenche la voix suivante.
const clic = (ecouteurs.click || [])[0];
assert.ok(clic, "écouteur de clic posé");
const avant = api.indexSuivant();
clic({ target: { closest: (sel) => (sel === "#sorealIdleBossStartV100" ? { disabled: false } : null) } });
assert.equal(api.indexSuivant(), (avant + 1) % 3, "clic sur FIGHT : voix suivante");
clic({ target: { closest: () => null } });
clic({ target: { closest: () => ({ disabled: true }) } });
assert.equal(api.indexSuivant(), (avant + 1) % 3, "autre clic ou bouton désactivé : rien");

// Les fichiers de base existent et le volume suit la barre « voix ».
for (const f of ["david-bas", "david-normal", "david-lent"]) assert.ok(existsSync(`cloudflare/public/modules/fight-voix-base/${f}.wav`), `base ${f}.wav`);
assert.ok(src.includes("getVoix") && src.includes("volume_()<=0"), "volume de la barre voix, silence si coupé");
assert.ok(src.includes("#sorealIdleBossStartV100"), "branché sur le bouton rouge");
console.log("idle-fight-voix-v1: OK");
