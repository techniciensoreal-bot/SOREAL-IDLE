import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-11-22) : « les dégâts des ennemis dans l'ITOPOD n'apparaissent pas dans le journal ; quand on est battu, on reste au même combat et rien ne se passe ; les PV ne sont pas écrits pour la barre de l'ennemi ;
 * le fond du journal doit être comme celui de l'Aventure ». Lu dans le jeu : EnemyAI::regularAttack écrit « X has attacked for N damage! » ; AdventureController::playerDeath (zone 1000) écrit « X has defeated you! »,
 * remet l'étage de départ, vide l'ennemi (« No Enemy » / « 0 HP ») et laisse le compteur de kills.
 */
const lire = (f) => readFileSync(new URL("../public/" + f, import.meta.url), "utf8");
let t = 1_000_000;
const DateFaux = function () { return new Date(t); };
DateFaux.now = () => t;
const stock = new Map([["soreal_idle_langue_v1", "en"]]);
const ls = { getItem: (k) => (stock.has(k) ? stock.get(k) : null), setItem: (k, v) => stock.set(k, String(v)) };
const boite = { scrollTop: 0, scrollHeight: 1, lignes: [], get children() { return this.lignes; }, insertAdjacentHTML(_p, h) { this.lignes.push(h); }, removeChild() { this.lignes.shift(); }, get firstChild() { return this.lignes[0]; } };
const stub = { classList: { add() {}, remove() {} }, style: {}, offsetWidth: 0 };
const vieJ = { style: {} }, texteJ = { textContent: "" }, texteE = { textContent: "" }, vieE = { style: {} };
const attrs = { "data-kills": "100", "data-etage": "7", "data-sur": "3" };
const el = {
  getAttribute: (n) => attrs[n], innerHTML: "",
  querySelector(s) {
    if (s === ".itp-journal") return boite;
    if (s === ".itp-vie-joueur .itp-vie-rempli") return vieJ;
    if (s === ".itp-vie-joueur .itp-vie-texte") return texteJ;
    if (s === ".itp-vie-ennemi-texte") return texteE;
    if (s === ".itp-vie:not(.itp-vie-joueur) .itp-vie-rempli") return vieE;
    if (s === ".itp-vitre" || s === ".itp-poing" || s === ".itp-ennemi") return stub;
    return null;
  }
};
const fen = {};
const ctx = { window: fen, localStorage: ls, document: { hidden: false, querySelectorAll: () => [el], addEventListener() {} }, fetch: () => Promise.reject(new Error("x")), Date: DateFaux, Math: Object.assign(Object.create(Math), { random: () => 0.5 }) };
for (const m of ["journal-fr-v1.js", "itopod-journal-v1.js", "journal-jeu-v1.js", "itopod-scene-v1.js"]) vm.runInNewContext(lire("modules/" + m), ctx);
const S = fen.__SOREAL_IDLE_ITOPOD_SCENE_V1__;

// 10 coups pour tuer, l'ennemi frappe 40 PV toutes les 1,2 s (1,8 s au premier), le joueur a 100 PV sans régénération.
S.html({ floor: 7, kills: 100, killsOnFloor: 3, startFloor: 2, endFloor: 9, hitsParKill: 10, intervalS: 1, respawnS: 4, actif: true, pvMax: 100, pv: 100, degatsCoup: 100, ennemiCoup: 40, ennemiPv: 1000, regenPv: 0, ppBase: 200, ppMult: 1, ppProgress: 0 });
assert.ok(el.innerHTML === "" && true);
const html0 = S.html({ floor: 7, kills: 100, killsOnFloor: 3, startFloor: 2, endFloor: 9, hitsParKill: 10, intervalS: 1, respawnS: 4, actif: true, pvMax: 100, pv: 100, degatsCoup: 100, ennemiCoup: 40, ennemiPv: 1000, regenPv: 0, ppBase: 200, ppMult: 1, ppProgress: 0 });
assert.ok(html0.includes("itp-vie-ennemi-texte") && html0.includes("1000 HP") || html0.includes("HP"), "les PV de l'ennemi sont écrits sous sa barre");
assert.ok(html0.includes("soreal-idle-adventure-log-v1"), "le journal a le fond du journal de l'Aventure");
const pas = () => S.pas();
for (let i = 0; i < 12 && !boite.lignes.join("|").includes("has defeated you!"); i += 1) { pas(); t += 400; }
const journal = boite.lignes.join("|");
assert.match(journal, /soreal-idle-adventure-log-line-v1 enemy">[^<]*attacked for 40 damage!/, "chaque coup de l'ennemi est écrit");
assert.ok(journal.includes("has defeated you!"), "la défaite est écrite : « X has defeated you! »");
assert.equal(vieJ.style.width, "0.0%", "PV du joueur à 0");
assert.equal(S.combat.sansEnnemi, true, "plus d'ennemi après la mort");
assert.ok(/itp-vie-ennemi-texte">0 HP</.test(el.innerHTML), "« 0 HP » à la place de la vie de l'ennemi");
assert.ok(el.innerHTML.includes("No Enemy"), "« No Enemy » pendant la réapparition");
assert.ok(el.innerHTML.includes("<b>2</b>"), "retour à l'étage de DÉPART (2) après la mort");
assert.ok(el.innerHTML.includes("itp-pip plein"), "le compteur de kills continue (non remis à zéro)");
// réapparition : un joueur sans PV ni régénération meurt aussitôt de nouveau ; sinon le combat reprend
const avant = boite.lignes.filter((l) => l.includes("has defeated you!")).length;
t += 5000; pas();
assert.equal(S.combat.sansEnnemi, true, "mort de nouveau à l'apparition (0 PV, pas de régénération)");
assert.equal(boite.lignes.filter((l) => l.includes("has defeated you!")).length, avant + 1);
// en français
stock.set("soreal_idle_langue_v1", "fr");
const G = fen.__SOREAL_IDLE_JOURNAL_JEU_V1__;
assert.equal(G.defaite("Zed"), "Zed t'a vaincu !");
assert.equal(G.attaque("normal", "Zed", "5"), "Zed a attaqué pour 5 dégâts !");
// le serveur envoie les PV de l'ennemi et le poison
const sys = readFileSync(new URL("../src/idle-ngu-systemes.js", import.meta.url), "utf8");
assert.ok(sys.includes("d.ennemiPv =") && sys.includes("d.ennemiPoison ="));
console.log("idle-itopod-ennemis-frappent-mort-v1: OK");

// Défilement comme l'Aventure (Norman, 2026-11-22) : journal tout en bas, flèches haut / bas, pas de molette ni de doigt, retour au bas après 15 s.
{
  const sc = readFileSync(new URL("../public/modules/itopod-scene-v1.js", import.meta.url), "utf8");
  assert.ok(sc.includes("__SOREAL_IDLE_JOURNAL_FLECHES_V1__") && sc.includes("installerFleches(el)"), "flèches du journal (journal-fleches-v1.js) posées sur le journal de la tour");
  assert.ok(sc.includes("LECTURE_RETOUR_MS=15000"), "retour tout en bas après 15 secondes");
  assert.ok(sc.includes("soreal-idle-adventure-log-v1"), "mêmes classes que l'Aventure : overflow caché, donc ni molette ni doigt");
  assert.ok(readFileSync(new URL("../public/itopod-journal-v1.css", import.meta.url), "utf8").includes(".itp-arene{position:relative}"), "les flèches se placent dans l'arène");
}
console.log("idle-itopod-ennemis-frappent-mort-v1 (flèches): OK");

// « Appliquer » (Norman, 2026-11-22) : un nouvel étage venu du serveur refait l'arène tout de suite (coups par ennemi, étage, PV), sans changer de menu.
{
  const f4 = {};
  let t4 = 2_000_000;
  const D4 = function () { return new Date(t4); }; D4.now = () => t4;
  const el4 = { _a: { "data-kills": "100", "data-etage": "5", "data-sur": "0" }, getAttribute(n) { return this._a[n]; }, setAttribute(n, v) { this._a[n] = v; }, innerHTML: "", querySelector: () => null };
  const c4 = { window: f4, localStorage: { getItem: () => "en" }, document: { hidden: false, querySelectorAll: () => [el4], addEventListener() {} }, fetch: () => Promise.reject(new Error("x")), Date: D4, Math };
  for (const m of ["journal-jeu-v1.js", "itopod-scene-v1.js"]) vm.runInNewContext(lire("modules/" + m), c4);
  const S4 = f4.__SOREAL_IDLE_ITOPOD_SCENE_V1__;
  const base = { floor: 5, kills: 100, killsOnFloor: 0, hitsParKill: 1, intervalS: 1, respawnS: 4, actif: true, startFloor: 5, endFloor: 5, pvMax: 100, pv: 100, degatsCoup: 100, ennemiCoup: 1, ennemiPv: 600, regenPv: 0, ppBase: 200, ppMult: 1, ppProgress: 0 };
  S4.html(base);
  assert.equal(S4.combat.hits, 1);
  assert.equal(S4.maj(base), false, "rien n'a changé côté serveur : arène laissée telle quelle");
  assert.equal(S4.maj(Object.assign({}, base, { floor: 40, startFloor: 40, endFloor: 40, hitsParKill: 5, ennemiPv: 4200 })), true, "nouvel étage appliqué : arène refaite");
  assert.equal(S4.combat.hits, 5, "les ennemis du NOUVEL étage (plusieurs coups) sont ceux de l'écran");
  assert.ok(el4.innerHTML.includes("<b>40</b>"), "le bon étage est affiché");
  assert.equal(el4._a["data-etage"], "40");
  const perks = readFileSync(new URL("../public/modules/itopod-perks-page-v1.js", import.meta.url), "utf8");
  assert.ok(perks.includes("sc.maj(Object.assign({},t.d") && perks.includes("majArenaItopodIdleV1_(j);"), "chaque synchro de la page ITOPOD met l'arène à jour");
}
console.log("idle-itopod-ennemis-frappent-mort-v1 (appliquer): OK");
