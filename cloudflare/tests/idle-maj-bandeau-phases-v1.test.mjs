import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

/* Norman (2026-11-03) : « la barre de mise à jour ne montre aucune avancée de téléchargement, ne dit pas qu'elle installe, affiche juste qu'elle va redémarrer » : trois phases lisibles, même quand l'application finit en une fraction de seconde (le vrai module sur un faux navigateur). */
const code = fs.readFileSync(new URL("../public/modules/maj-v1.js", import.meta.url), "utf8");
let maintenant = 1000;
const elements = {};
const frames = [];
const ecouteurs = {};
const faux = (id) => ({ id, innerHTML: "", style: {}, remove() { delete elements[this.id]; }, setAttribute() {} });
const document = {
  getElementById: (id) => elements[id] || null,
  createElement: () => faux(""),
  head: { appendChild: (e) => { elements[e.id] = e; } },
  body: { appendChild: (e) => { elements[e.id] = e; } },
  documentElement: { appendChild: (e) => { elements[e.id] = e; } },
  addEventListener: (nom, f) => { ecouteurs[nom] = f; }
};
let surEv = null;
const D = {
  majEtat: () => Promise.resolve({ version: "9.9", notes: "Test", octets: 50 * 1048576, nb: 3 }),
  majInstaller: () => Promise.resolve({ ok: true }),
  majSur: (f) => { surEv = f; }
};
const fen = { sorealDesktop: D, requestAnimationFrame: (f) => { frames.push(f); return frames.length; }, document };
fen.window = fen;
vm.createContext(Object.assign(fen, { document, Date: { now: () => maintenant }, Promise, Math, String, Number, console }));
vm.runInContext(code, fen);
await new Promise((r) => setTimeout(r, 20));
const texte = () => (elements.sorealIdleMajV1 ? elements.sorealIdleMajV1.innerHTML.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "");
assert.ok(/Une mise à jour est disponible/.test(texte()), "proposée : " + texte());
// clic sur « Mettre à jour »
ecouteurs.click({ target: { closest: () => ({ getAttribute: () => "installer" }) } });
const avancer = (ms) => { for (let t = 0; t < ms; t += 16) { maintenant += 16; const f = frames.splice(0); f.forEach((g) => g()); } };
avancer(100);
assert.ok(/Téléchargement/.test(texte()), "dès le clic : phase Téléchargement (" + texte() + ")");
const pct0 = Number((texte().match(/(\d+) %/) || [0, -1])[1]);
// l'application finit INSTANTANÉMENT : tout est reçu et installé d'un coup
surEv({ type: "progression", progression: { fait: 3, total: 3, octets: 50 * 1048576, octetsTotal: 50 * 1048576 } });
surEv({ type: "progression", progression: { termine: true } });
avancer(200);
const pct1 = Number((texte().match(/(\d+) %/) || [0, -1])[1]);
assert.ok(/Téléchargement/.test(texte()) && pct1 > pct0 && pct1 < 100, "la barre avance à vitesse lisible au lieu de sauter (" + pct0 + " -> " + pct1 + " %) : " + texte());
let vu = new Set(["dl"]);
for (let i = 0; i < 400 && !/Redémarrage/.test(texte()); i++) { avancer(16); if (/Installation/.test(texte())) vu.add("inst"); }
assert.ok(vu.has("inst"), "la phase « Installation » est affichée avant le redémarrage");
avancer(32);
assert.ok(/Redémarrage/.test(texte()) && /installée/.test(texte()), "puis « installée, redémarrage » : " + texte());
// coeur : le redémarrage laisse le temps de lire (3,5 s)
const coeur = fs.readFileSync(new URL("../../desktop/coeur.js", import.meta.url), "utf8");
assert.ok(coeur.includes("app.relaunch(); app.exit(0); }, 3500);"), "relance après 3,5 s");
console.log("idle-maj-bandeau-phases-v1: OK");
