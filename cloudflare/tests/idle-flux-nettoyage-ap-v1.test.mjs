import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { enregistrerJalonsV1, lireFluxV1, instantaneJoueurV1 } from "../src/idle-flux-v1.js";
import { normaliserActiviteV1 } from "../src/idle-chat-v1.js";

/* Norman (2026-10-31) : la phrase comique du nettoyage (« Sébastien a du vomi partout sur lui mais ça valait le coup pour ses 20 AP ») est pour « En direct » et s'adapte au nom du joueur ; lui ne voit que « +N AP ». */
const db = new DatabaseSync(":memory:");
const sql = { exec(q, ...b) { const s = db.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return s.all(...b); s.run(...b); return []; } };
const T0 = 1_700_000_000_000;
const inst = () => instantaneJoueurV1({ stats: { metaNgu: {} } });
const bat = (activite, now) => enregistrerJalonsV1(sql, { email: "a@x.fr", nom: "Sébastien", instantane: inst(), activite: normaliserActiviteV1(activite), now });

// Le battement transporte numéro, gain et lieu ; valeurs bornées, lieu en liste blanche.
const n = normaliserActiviteV1({ t: "libre", nettoyeApN: 1700000050, nettoyeAp: 20, nettoyeLieu: "valise", nettoyeRare: false });
assert.equal(n.nettoyeApN, 1700000050); assert.equal(n.nettoyeAp, 20); assert.equal(n.nettoyeLieu, "valise"); assert.equal(n.nettoyeRare, false);
assert.equal(normaliserActiviteV1({ t: "libre", nettoyeApN: 1700000050, nettoyeAp: 20, nettoyeLieu: "<script>" }).nettoyeLieu, "coffre");
assert.equal(normaliserActiviteV1({ t: "libre", nettoyeApN: 1700000050, nettoyeAp: 999999 }).nettoyeAp, undefined, "gain hors bornes ignoré");
assert.equal(normaliserActiviteV1({ t: "libre", nettoyeApN: 1700000050, nettoyeAp: 20, nettoyeRare: true }).nettoyeRare, false, "« rare » seulement pour 5 000 AP");

bat({ t: "libre" }, T0);
bat({ t: "libre", nettoyeApN: 1700000050, nettoyeAp: 20, nettoyeLieu: "valise" }, T0 + 20000);
bat({ t: "libre", nettoyeApN: 1700000050, nettoyeAp: 20, nettoyeLieu: "valise" }, T0 + 40000);
let ev = lireFluxV1(sql, {}).filter((e) => e.type === "nettoyageAp");
assert.equal(ev.length, 1, "une seule annonce par nettoyage"); assert.equal(ev[0].nom, "Sébastien");
assert.equal(ev[0].donnees.ap, 20); assert.equal(ev[0].donnees.lieu, "valise");
// Avec l'ancien numéro du Coffre dans le même battement : une seule ligne, celle avec le gain.
bat({ t: "libre", nettoye: 1700000300, nettoyeApN: 1700000300, nettoyeAp: 7, nettoyeLieu: "coffre" }, T0 + 60000);
assert.equal(lireFluxV1(sql, {}).filter((e) => e.type === "nettoyage").length, 0, "l'annonce simple est remplacée");
assert.equal(lireFluxV1(sql, {}).filter((e) => e.type === "nettoyageAp").length, 2);
bat({ t: "libre", nettoyeApN: 1700000900, nettoyeAp: 9, nettoyeLieu: "coffre" }, T0 + 60000 + 300000);   // retour après absence : pas de rattrapage
assert.equal(lireFluxV1(sql, {}).filter((e) => e.type === "nettoyageAp").length, 2, "pas de rattrapage après une absence");

// Côté lecteur : le nom du joueur remplace celui de l'exemple, le gain remplace {ap}, anti-spoil Aventure, et soi-même : seulement le gain.
const src = readFileSync(new URL("../public/modules/flux-v1.js", import.meta.url), "utf8");
const ctx = { window: { addEventListener() {}, __SOREAL_IDLE_ACTIVITE_V1__: () => ({ connus: { boss: {}, titan: {}, succes: {}, menus: { aventure: true } }, zones: [], bossMax: 0 }) }, document: { addEventListener() {}, querySelector() { return null; }, getElementById() { return null; } } };
vm.runInNewContext(src, ctx);
const F = ctx.window.__SOREAL_IDLE_FLUX_V1__;
const connus = (aventure) => ({ connus: { boss: {}, titan: {}, succes: {}, menus: aventure ? { aventure: true } : {} }, zones: [], bossMax: 0 });
const textes = new Set();
for (let id = 0; id < 8; id += 1) {
  const p = F.phrase({ type: "nettoyageAp", nom: "Mélanie", donnees: { ap: 20, lieu: "valise", rare: false }, moi: false, id }, connus(true));
  assert.ok(p && /Mélanie/.test(p.texte) && /20/.test(p.texte) && !/\{/.test(p.texte), "valise " + id + " : " + (p && p.texte));
  textes.add(p.texte);
}
assert.equal(textes.size, 8, "huit phrases de valise");
assert.equal(F.phrase({ type: "nettoyageAp", nom: "Sébastien", donnees: { ap: 20, lieu: "valise" }, moi: false, id: 0 }, connus(true)).texte, "Sébastien a du vomi partout sur lui mais ça valait le coup pour ses 20 AP.");
for (let id = 0; id < 8; id += 1) assert.ok(/Mélanie/.test(F.phrase({ type: "nettoyageAp", nom: "Mélanie", donnees: { ap: 5, lieu: "coffre" }, moi: false, id }, connus(true)).texte), "coffre " + id);
for (let id = 0; id < 3; id += 1) assert.ok(/Mélanie/.test(F.phrase({ type: "nettoyageAp", nom: "Mélanie", donnees: { ap: 5000, lieu: "coffre", rare: true }, moi: false, id }, connus(true)).texte), "jackpot " + id);
assert.equal(F.phrase({ type: "nettoyageAp", nom: "Sébastien", donnees: { ap: 5000, lieu: "coffre", rare: true }, moi: false, id: 1 }, connus(true)).texte.includes("5K"), true, "5 000 s'écrit 5K");
const moi = F.phrase({ type: "nettoyageAp", nom: "Sébastien", donnees: { ap: 20, lieu: "valise" }, moi: true, id: 0 }, connus(true));
assert.equal(moi.texte, "Tu as gagné 20 AP en nettoyant ta valise", "le joueur ne voit que son gain");
assert.equal(F.phrase({ type: "nettoyageAp", nom: "Sébastien", donnees: { ap: 20, lieu: "valise" }, moi: false, id: 1 }, connus(false)), null, "rien pour un lecteur sans le menu Aventure");
// Chaîne côté page : le gain affiché est mémorisé, le battement l'envoie.
const chat = readFileSync(new URL("../public/modules/chat-v1.js", import.meta.url), "utf8");
assert.ok(chat.includes("m.nettoyeApN=nap.n;m.nettoyeAp=nap.ap;m.nettoyeLieu=nap.lieu;"), "le battement envoie le gain du nettoyage");
console.log("idle-flux-nettoyage-ap-v1: OK");
