import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { enregistrerJalonsV1, lireFluxV1, instantaneJoueurV1 } from "../src/idle-flux-v1.js";

/* Norman (2026-11-24) : « des phrases dans En direct quand des joueurs gagnent de l'AP dans DOTT, et de temps en temps (seulement quand la personne joue à DOTT) : Sébastien a déjà récupéré 45000 AP dans Day of the Tentacle ». */
const db = new DatabaseSync(":memory:");
const sql = { exec(q, ...b) { const s = db.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return s.all(...b); s.run(...b); return []; } };
const T0 = 1_700_000_000_000;
const inst = (ap, bonus = 0) => instantaneJoueurV1({ stats: { metaNgu: { systems: { scummvm: { data: { jeux: { dott: ap === null ? {} : { apCredite: ap, bonus } } } } } } } });
const bat = (ap, now) => enregistrerJalonsV1(sql, { email: "a@x.fr", nom: "Sébastien", instantane: inst(ap), now });
const evs = (t) => lireFluxV1(sql, {}).filter((e) => e.type === t);

assert.equal(inst(120, 30).dottAp, 150, "crédits + bonus de fin");
assert.equal(inst(null).dottAp, 0);

bat(500, T0);                       // premier passage : point de départ, rien n'est annoncé
bat(500, T0 + 20_000);
assert.equal(evs("dottAp").length, 0, "pas d'annonce sans gain");
bat(540, T0 + 40_000);              // gain de 40
assert.equal(evs("dottAp").length, 1, "gain annoncé"); assert.equal(evs("dottAp")[0].donnees.gain, 40); assert.equal(evs("dottAp")[0].donnees.total, 540);
bat(560, T0 + 60_000);              // trop tôt (moins de 90 s) : pas d'annonce, le gain se cumule
assert.equal(evs("dottAp").length, 1, "au plus une annonce par 90 s");
bat(600, T0 + 140_000);             // 100 s après la précédente : annonce du cumul 560 -> 600 -> depuis 540 = 60
const e2 = evs("dottAp"); assert.equal(e2.length, 2); assert.equal(e2[1].donnees.gain, 60, "le gain cumule ce qui est arrivé entre-temps"); assert.equal(e2[1].donnees.total, 600);
// total : seulement s'il joue (gain récent) et au plus toutes les 15 min
let t = T0 + 140_000;
for (let i = 0; i < 20; i += 1) { t += 20_000; bat(600, t); }   // ~6,7 min sans gain
assert.equal(evs("dottTotal").length, 0, "pas de total sans gain récent ni délai de 15 min");
bat(650, t + 20_000); t += 20_000;    // il rejoue : gain
let n0 = evs("dottAp").length;
for (let i = 0; i < 50; i += 1) { t += 20_000; bat(650 + (i % 2 === 0 ? 5 : 0) , t); }
// reprise à zéro puis rattrapage : une absence ne déclenche aucune annonce
const avant = lireFluxV1(sql, {}).length;
bat(9000, t + 10 * 60_000);          // 10 min plus tard (absence) : mémorisé, pas annoncé
assert.equal(lireFluxV1(sql, {}).length, avant, "aucune annonce de rattrapage après une absence");
// total d'un joueur qui joue : ajoute 1 AP toutes les 20 s pendant 20 min : au moins un « total »
let tt = t + 10 * 60_000, ap = 9000;
for (let i = 0; i < 60; i += 1) { tt += 20_000; ap += 3; bat(ap, tt); }
assert.ok(evs("dottTotal").length >= 1, "un total est annoncé pour celui qui joue");
{ const at = evs("dottTotal").map((e) => e.at).sort((x, y) => x - y); for (let i = 1; i < at.length; i += 1) assert.ok(at[i] - at[i - 1] >= 15 * 60_000, "deux totaux espacés d'au moins 15 min : " + (at[i] - at[i - 1])); }
assert.equal(evs("dottTotal")[0].donnees.total > 0, true);

// Côté lecteur : seulement ceux qui connaissent le menu Énigmes ; soi-même : à la deuxième personne.
const src = readFileSync(new URL("../public/modules/flux-v1.js", import.meta.url), "utf8");
const ctx = { window: { addEventListener() {}, __SOREAL_IDLE_ACTIVITE_V1__: () => ({ connus: { boss: {}, titan: {}, succes: {}, menus: {} }, zones: [], bossMax: 0 }) }, document: { addEventListener() {}, getElementById() { return null; }, createElement() { return { style: {}, setAttribute() {}, appendChild() {} }; }, head: { appendChild() {} }, body: { appendChild() {} } }, setInterval() {}, setTimeout() {}, localStorage: { getItem() { return null; }, setItem() {} }, console };
vm.runInNewContext(src, ctx);
const F = ctx.window.__SOREAL_IDLE_FLUX_V1__;
const connus = (enigmes) => ({ connus: { boss: {}, titan: {}, succes: {}, menus: enigmes ? { scummvm: true } : {} }, zones: [], bossMax: 0 });
const textes = new Set();
for (let id = 0; id < 6; id += 1) {
  const p = F.phrase({ type: "dottAp", nom: "Mélanie", donnees: { gain: 1234 }, moi: false, id }, connus(true));
  assert.ok(p && /Mélanie/.test(p.texte) && /Day of the Tentacle/.test(p.texte) && /1\D?234/.test(p.texte) && !/\{/.test(p.texte), "gain " + id + " : " + (p && p.texte));
  textes.add(p.texte);
}
assert.equal(textes.size, 6, "six phrases de gain");
for (let id = 0; id < 4; id += 1) {
  const p = F.phrase({ type: "dottTotal", nom: "Sébastien", donnees: { total: 45000 }, moi: false, id }, connus(true));
  assert.ok(p && /Sébastien/.test(p.texte) && /45\D?000 AP/.test(p.texte) && /Day of the Tentacle/.test(p.texte) && !/\{/.test(p.texte), "total " + id + " : " + (p && p.texte));
}
assert.equal(F.phrase({ type: "dottAp", nom: "Mélanie", donnees: { gain: 5 }, moi: false, id: 0 }, connus(false)), null, "rien pour un lecteur sans le menu Énigmes (anti-spoil)");
assert.equal(F.phrase({ type: "dottTotal", nom: "Mélanie", donnees: { total: 5 }, moi: false, id: 0 }, connus(false)), null, "idem pour le total");
assert.ok(/^Tu as gagné 7 AP dans Day of the Tentacle$/.test(F.phrase({ type: "dottAp", nom: "Moi", donnees: { gain: 7 }, moi: true, id: 0 }, connus(true)).texte));
console.log("idle-flux-dott-v1: OK");
