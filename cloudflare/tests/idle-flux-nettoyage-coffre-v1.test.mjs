import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { enregistrerJalonsV1, lireFluxV1, instantaneJoueurV1 } from "../src/idle-flux-v1.js";
import { normaliserActiviteV1 } from "../src/idle-chat-v1.js";

/* Norman (2026-10-22) : « quand un joueur nettoie le coffre qui s'est chié dessus, plusieurs messages humoristiques dans En direct » */
const db = new DatabaseSync(":memory:");
const sql = { exec(q, ...b) { const s = db.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return s.all(...b); s.run(...b); return []; } };
const T0 = 1_700_000_000_000;
const inst = () => instantaneJoueurV1({ stats: { metaNgu: {} } });
const bat = (activite, now) => enregistrerJalonsV1(sql, { email: "a@x.fr", nom: "Sébastien", instantane: inst(), activite: normaliserActiviteV1(activite), now });

// L'activité transporte le numéro du nettoyage (comme celui de l'accident) ; une valeur invalide est ignorée.
assert.equal(normaliserActiviteV1({ t: "libre", nettoye: 1700000000 }).nettoye, 1700000000);
assert.equal(normaliserActiviteV1({ t: "libre", nettoye: "x" }).nettoye, undefined);

bat({ t: "libre" }, T0);                                         // premier battement : mémorisation seulement
bat({ t: "libre", nettoye: 1700000050 }, T0 + 20000);            // nettoyage -> annoncé
bat({ t: "libre", nettoye: 1700000050 }, T0 + 40000);            // même numéro renvoyé : pas de doublon
bat({ t: "libre", nettoye: 1700000050 }, T0 + 60000);
let ev = lireFluxV1(sql, {}).filter((e) => e.type === "nettoyage");
assert.equal(ev.length, 1, "une seule annonce par nettoyage"); assert.equal(ev[0].nom, "Sébastien");
bat({ t: "libre", nettoye: 1700000300 }, T0 + 80000);            // nouveau nettoyage -> nouvelle annonce
assert.equal(lireFluxV1(sql, {}).filter((e) => e.type === "nettoyage").length, 2);
bat({ t: "libre", nettoye: 1700000900 }, T0 + 80000 + 300000);   // retour après une absence : jamais de rattrapage
assert.equal(lireFluxV1(sql, {}).filter((e) => e.type === "nettoyage").length, 2, "pas de rattrapage après une absence");
bat({ t: "libre", accident: 1700001000 }, T0 + 400000 + 20000);
assert.equal(lireFluxV1(sql, {}).filter((e) => e.type === "nettoyage").length, 2, "un accident n'est pas un nettoyage");

// Phrases côté lecteur : humour variable, avec le nom, anti-spoil (menu Aventure requis).
const src = readFileSync(new URL("../public/modules/flux-v1.js", import.meta.url), "utf8");
const ctx = { window: { addEventListener() {}, __SOREAL_IDLE_ACTIVITE_V1__: () => ({ connus: { boss: {}, titan: {}, succes: {}, menus: { aventure: true } }, zones: [], bossMax: 0 }) }, document: { addEventListener() {}, querySelector: () => null, querySelectorAll: () => [], getElementById: () => null, createElement: () => ({ style: {} }), body: { appendChild() {} } }, localStorage: { getItem: () => null, setItem() {} }, setTimeout, setInterval: () => 0, clearTimeout, fetch: async () => ({ ok: true, json: async () => ({}) }), console };
vm.runInNewContext(src, ctx);
const F = ctx.window.__SOREAL_IDLE_FLUX_V1__;
const connus = (aventure) => ({ connus: { boss: {}, titan: {}, succes: {}, menus: aventure ? { aventure: true } : {} }, zones: [], bossMax: 0 });
const textes = new Set();
for (let id = 0; id < 8; id += 1) {
  const p = F.phrase({ type: "nettoyage", nom: "Sébastien", donnees: {}, moi: false, id }, connus(true));
  assert.ok(p && p.icone === "🧽" && /Sébastien/.test(p.texte), "variante " + id + " : " + (p && p.texte));
  textes.add(p.texte);
}
assert.equal(textes.size, 8, "huit variantes différentes");
assert.equal(F.phrase({ type: "nettoyage", nom: "Sébastien", donnees: {}, moi: false, id: 0 }, connus(true)).texte, "Sébastien a nettoyé le caca de son coffre. Évitez de lui serrer la main si vous le croisez");
for (let id = 0; id < 8; id += 1) {
  const t = F.phrase({ type: "nettoyage", nom: "Sébastien", donnees: {}, moi: true, id }, connus(true)).texte;
  assert.ok(!/Sébastien/.test(t) && /\b(ton|tes|toi|te|tu|Tu|Ton|Tes)\b/.test(t), "à la deuxième personne pour soi : " + t);
}
assert.equal(F.phrase({ type: "nettoyage", nom: "Sébastien", donnees: {}, moi: false, id: 1 }, connus(false)), null, "rien pour un lecteur sans le menu Aventure");
// Chaîne côté page : la flaque nettoyée pose le numéro, le battement l'envoie.
const caca = readFileSync(new URL("../public/modules/coffre-accident-v1.js", import.meta.url), "utf8");
assert.ok(caca.includes("window.__coffreNettoyageNumeroIdleV1__=Math.floor(Date.now()/1000);"), "le nettoyage de la flaque pose son numéro");
assert.ok(caca.indexOf("window.__coffreNettoyageNumeroIdleV1__") > caca.indexOf("majBrille_();"), "après la fin du nettoyage (le Coffre brille)");
const chat = readFileSync(new URL("../public/modules/chat-v1.js", import.meta.url), "utf8");
assert.ok(chat.includes("if(window.__coffreNettoyageNumeroIdleV1__>0)m.nettoye=window.__coffreNettoyageNumeroIdleV1__;"), "le battement envoie le numéro du nettoyage");
console.log("idle-flux-nettoyage-coffre-v1: OK");
