import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Titans en cartes à collectionner (Norman, 2026-10-16) : une tuile par titan (image, ou « ? » s'il n'a jamais été affronté) ; un clic déplie le détail avec le bouton Affronter,
 * les stats, l'Auto-kill... Un seul déplié à la fois, état conservé au redessin, jamais d'image demandée pour un titan inconnu.
 */
const src = readFileSync("cloudflare/public/modules/titans-v1.js", "utf8");
const blocs = [];
const fen = { __SOREAL_IDLE_META_HOST_V130__: {} };
const noeud = () => ({ style: {}, appendChild() {}, setAttribute() {} });
const doc = { getElementById() { return null; }, createElement: noeud, head: noeud(), querySelectorAll: (s) => (s === "[data-ttn-bloc]" ? blocs : []), querySelector: () => null, addEventListener() {}, hidden: false };
vm.runInNewContext(src, { window: fen, document: doc, setInterval() {}, localStorage: { getItem: () => null, setItem() {} }, Date, Math });
const api = fen.__SOREAL_IDLE_TITANS_V1__;
fen.__SOREAL_IDLE_META_HOST_V130__ = { aventureMetaIdleV47_: (x) => x.systemes.adventure, entetePageIdleV28_: (a) => "<h>" + a + "</h>" };
const combat = { "": { hp: 3e5, power: 666, toughness: 666, regen: 66, attackRate: 2 } };
const j = { systemes: { adventure: { titans: [
  { id: "t1", name: "GRB", nomComplet: "Gordon Ramsay Bolton", progressionUnlocked: true, state: { kills: 2, nextAt: 0, autoKill: true }, combat, p: 1, t: 1 },
  { id: "t2", name: "Beast", progressionUnlocked: true, state: { kills: 0, nextAt: 0 }, combat, p: 1, t: 1 },
  { id: "t3", name: "Secret", progressionUnlocked: false, state: { kills: 0 } }
] } } };
const html = api.page(j);
assert.equal((html.match(/class="ttn-tuile /g) || []).length, 2, "une tuile par titan débloqué, jamais le verrouillé");
assert.ok(!html.includes("Secret"), "anti-spoil : rien du titan verrouillé");
const [tuile1, tuile2] = html.split('<div class="ttn-bloc').slice(1);
assert.ok(/<button type="button" class="ttn-tuile[^"]*" data-ttn-tuile="t1"/.test(tuile1) && tuile1.includes("ttn-tuile-art") && /<img src="\/api\/idle\/media\/titan\?id=t1/.test(tuile1), "titan vaincu : image dans la tuile");
assert.ok(tuile1.includes("ttn-tuile-auto"), "pastille Auto-kill sur la tuile");
const tuileSeule2 = tuile2.slice(0, tuile2.indexOf("</button>"));
assert.ok(tuileSeule2.includes("ttn-inconnu") && tuileSeule2.includes('class="ttn-point">?</span>') && !tuileSeule2.includes("<img"), "jamais affronté : « ? » et aucune image demandée");
for (const t of [tuile1, tuile2]) {
  const detail = t.slice(t.indexOf('<div class="ttn-detail">'));
  assert.ok(detail.includes("ttn-bouton") && detail.includes("⚔️ Affronter") && detail.includes("ttn-auto") && detail.includes("ttn-stats"), "le détail porte Affronter, Auto-kill et les stats");
  assert.ok(detail.indexOf("ttn-actions") < detail.indexOf("ttn-stats"), "le bouton Affronter est en haut du détail");
}
assert.ok(!/class="ttn-bloc ouvert"/.test(html), "tout est replié au départ");
// Dépliage : un seul à la fois, l'état survit au redessin.
const classes = (id) => ({ s: new Set(), id, classList: { toggle(c, on) { on ? this.s.add(c) : this.s.delete(c); } }, getAttribute: () => id, querySelector: () => ({ setAttribute() {} }) });
const b1 = classes("t1"), b2 = classes("t2");
b1.classList.s = new Set(); b2.classList.s = new Set();
for (const b of [b1, b2]) { const o = b.classList; o.s = new Set(); b.classList = { s: o.s, toggle(c, on) { on ? this.s.add(c) : this.s.delete(c); } }; blocs.push(b); }
fen.__ouvrirTitanV1__("t1");
assert.ok(b1.classList.s.has("ouvert") && !b2.classList.s.has("ouvert"));
assert.ok(/class="ttn-bloc ouvert" data-ttn-bloc="t1"/.test(api.page(j)), "redessin : t1 reste déplié");
fen.__ouvrirTitanV1__("t2");
assert.ok(!b1.classList.s.has("ouvert") && b2.classList.s.has("ouvert"), "un seul titan déplié à la fois");
fen.__ouvrirTitanV1__("t2");
assert.ok(!b2.classList.s.has("ouvert") && !/class="ttn-bloc ouvert"/.test(api.page(j)), "second clic : replié");
// Le morph ne doit rien retirer : le détail est rendu dans la même passe que la tuile.
assert.ok(src.includes("'.ttn-bloc{display:contents}'"), "bloc transparent pour la grille");
console.log("idle-titans-cartes-tuiles-v1: OK");
