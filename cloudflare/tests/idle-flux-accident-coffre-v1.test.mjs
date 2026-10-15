import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { enregistrerJalonsV1, lireFluxV1, instantaneJoueurV1 } from "../src/idle-flux-v1.js";
import { normaliserActiviteV1 } from "../src/idle-chat-v1.js";
/* Norman (2026-10-15) : « dans En direct, un message quand le coffre d'un joueur s'est chié dessus » */
const db = new DatabaseSync(":memory:");
const sql = { exec(q, ...b) { const s = db.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return s.all(...b); s.run(...b); return []; } };
const T0 = 1_700_000_000_000;
const inst = () => instantaneJoueurV1({ stats: { metaNgu: {} } });
const bat = (activite, now) => enregistrerJalonsV1(sql, { email: "a@x.fr", nom: "Saka", instantane: inst(), activite: normaliserActiviteV1(activite), now });
assert.equal(normaliserActiviteV1({ t: "libre", accident: 1700000000 }).accident, 1700000000);
assert.equal(normaliserActiviteV1({ t: "libre", accident: "x" }).accident, undefined, "valeur invalide ignorée");
bat({ t: "libre" }, T0);                                        // premier battement : mémorisation seulement
bat({ t: "libre", accident: 1700000050 }, T0 + 20000);          // accident -> annoncé
bat({ t: "libre", accident: 1700000050 }, T0 + 40000);          // même numéro renvoyé : pas de doublon
bat({ t: "libre", accident: 1700000050 }, T0 + 60000);
let ev = lireFluxV1(sql, {}).filter((e) => e.type === "accident");
assert.equal(ev.length, 1, "une seule annonce par accident"); assert.equal(ev[0].nom, "Saka");
bat({ t: "libre", accident: 1700000300 }, T0 + 80000);          // nouvel accident -> nouvelle annonce
assert.equal(lireFluxV1(sql, {}).filter((e) => e.type === "accident").length, 2);
bat({ t: "libre", accident: 1700000900 }, T0 + 80000 + 300000); // retour après une absence : jamais de rattrapage
assert.equal(lireFluxV1(sql, {}).filter((e) => e.type === "accident").length, 2, "pas de rattrapage après une absence");
/* Phrase côté lecteur : anti-spoil (il faut déjà avoir le menu Aventure) et variantes avec le nom */
const src = readFileSync(new URL("../public/modules/flux-v1.js", import.meta.url), "utf8");
const ctx = { window: { addEventListener() {}, __SOREAL_IDLE_ACTIVITE_V1__: () => ({ connus: { boss: {}, titan: {}, succes: {}, menus: { aventure: true } }, zones: [], bossMax: 0 }) }, document: { addEventListener() {}, querySelector() { return null; }, createElement() { return { style: {}, setAttribute() {}, appendChild() {}, classList: { add() {}, remove() {} } }; }, body: { appendChild() {}, classList: { add() {}, remove() {} } }, readyState: "loading" }, setInterval() {}, setTimeout() {}, requestAnimationFrame() {}, performance: { now: () => 0 }, console };
vm.runInNewContext(src, ctx);
const F = ctx.window.__SOREAL_IDLE_FLUX_V1__;
const connus = (aventure) => ({ connus: { boss: {}, titan: {}, succes: {}, menus: aventure ? { aventure: true } : {} }, zones: [], bossMax: 0 });
const textes = new Set();
for (let id = 1; id <= 7; id += 1) { const p = F.phrase({ type: "accident", nom: "Saka", donnees: {}, moi: false, id }, connus(true)); assert.ok(p && p.icone === "💩" && /Saka/.test(p.texte), "variante " + id + " : " + (p && p.texte)); textes.add(p.texte); }
assert.equal(textes.size, 7, "sept variantes différentes");
assert.equal(F.phrase({ type: "accident", nom: "Saka", donnees: {}, moi: false, id: 7 }, connus(true)).texte, "Le coffre de Saka vient littéralement de se chier dessus");
assert.ok(/^Ton coffre/.test(F.phrase({ type: "accident", nom: "Saka", donnees: {}, moi: true, id: 7 }, connus(true)).texte), "à la première personne pour soi");
assert.equal(F.phrase({ type: "accident", nom: "Saka", donnees: {}, moi: false, id: 1 }, connus(false)), null, "rien pour un lecteur sans le menu Aventure");
console.log("idle-flux-accident-coffre-v1: OK");
