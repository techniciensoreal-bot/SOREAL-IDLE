import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { choisirCleTitanR2_ } from "../src/idle-media-v1.js";

/*
 * Page Titans (Norman, 2026-10-02) : image du titan cherchée dans R2 par nom (aucun dossier connu d'avance), palier ou forme ; compte à rebours en direct ;
 * erreurs traduites ; aucune fuite de titan verrouillé.
 */
// 1. Choix de l'image : nom du titan, dossier idle/titans/ prioritaire, palier (v1..v4) ou forme (1..5).
{
  const keys = [
    "idle/bosses/Boss_296_Tippi_The_Tutorial_Mouse.png",
    "idle/titans/Beast V1.png", "idle/titans/Beast V2.png", "idle/titans/Beast V3.png", "idle/titans/Beast V4.png",
    "idle/titans/Walderp1.png", "idle/titans/Walderp5.png", "idle/titans/Grb.png", "idle/titans/Gordon_Ramsay_Bolton.webp",
    "idle/aventure/Forest/Adv_12_Un_Gobelin.png"
  ];
  assert.equal(choisirCleTitanR2_(keys, "t6", "hard", -1), "idle/titans/Beast V3.png", "palier hard = V3");
  assert.equal(choisirCleTitanR2_(keys, "t6", "easy", -1), "idle/titans/Beast V1.png");
  assert.equal(choisirCleTitanR2_(keys, "t5", "", 4), "idle/titans/Walderp5.png", "forme 5 de Walderp");
  assert.equal(choisirCleTitanR2_(keys, "t5", "", 0), "idle/titans/Walderp1.png");
  assert.equal(choisirCleTitanR2_(keys, "t1", "", -1), "idle/titans/Gordon_Ramsay_Bolton.webp", "le nom complet prime sur le sigle");
  assert.equal(choisirCleTitanR2_(keys, "tippi", "", -1), "idle/bosses/Boss_296_Tippi_The_Tutorial_Mouse.png", "repli sur l'image du boss homonyme");
  assert.equal(choisirCleTitanR2_(keys, "t2", "", -1), "", "aucune image : 404, le jeu affiche un emoji");
  assert.equal(choisirCleTitanR2_(keys, "inconnu", "", -1), "");
}

// 2. Module client : traductions, durées, variantes, anti-spoil.
const fenetre = { __SOREAL_IDLE_META_HOST_V130__: {} };
const noeud = () => ({ style: {}, appendChild() {}, setAttribute() {} });
vm.runInNewContext(readFileSync("cloudflare/public/modules/titans-v1.js", "utf8"), { window: fenetre, document: { getElementById() { return null; }, createElement: noeud, head: noeud(), querySelectorAll() { return []; } }, setInterval() {}, Date });
const api = fenetre.__SOREAL_IDLE_TITANS_V1__;
assert.equal(api.traduire("TITAN_EN_REAPPARITION"), "Ce titan n’est pas encore réapparu : attends la fin du compte à rebours.");
assert.equal(api.traduire("AUTRE"), "AUTRE");
assert.equal(api.duree(65_000), "1:05");
assert.equal(api.duree(3_725_000), "1:02:05");
assert.equal(api.duree(0), "0:00");
assert.equal(api.cleVariante({ forms: [1, 2, 3], state: { kills: 7 } }, ""), "2", "Walderp : forme courante plafonnée");
assert.equal(api.cleVariante({ forms: [1, 2, 3], state: { kills: 1 } }, ""), "1");
assert.equal(api.cleVariante({ difficulties: { easy: {}, hard: {} } }, "hard"), "hard");
assert.equal(api.cleVariante({}, ""), "");
// Page : seulement les titans débloqués, jamais un verrouillé.
{
  const j = { systemes: { adventure: { titans: [
    { id: "t1", name: "GRB", nomComplet: "Gordon Ramsay Bolton", progressionUnlocked: true, state: { kills: 1, nextAt: 0 }, combat: { "": { hp: 3e5, power: 666, toughness: 666, regen: 66, attackRate: 2 } }, capacites: ["x"], p: 1300, t: 1300 },
    { id: "t2", name: "Grand Corrupted Tree", progressionUnlocked: false, state: { kills: 0 } }
  ] } } };
  fenetre.__SOREAL_IDLE_META_HOST_V130__ = { aventureMetaIdleV47_: (x) => x.systemes.adventure, entetePageIdleV28_: (a) => "<h>" + a + "</h>" };
  const html = api.page(j);
  assert.ok(html.includes("Gordon Ramsay Bolton") && html.includes("Prêt à être affronté") && html.includes("__affronterTitanV1__"));
  assert.ok(!html.includes("Grand Corrupted Tree"), "titan verrouillé : jamais affiché (anti-spoil)");
  assert.ok(html.includes("/api/idle/media/titan?id=t1"));
  assert.ok(html.includes("Stats conseillées") && html.includes("Capacités"));
  const attente = api.page({ systemes: { adventure: { titans: [{ id: "t1", name: "GRB", progressionUnlocked: true, state: { kills: 1, nextAt: Date.now() + 3_600_000 }, combat: {} }] } } });
  assert.ok(attente.includes("Réapparition dans") && attente.includes("data-ttn-cd") && /<button[^>]*disabled/.test(attente), "compte à rebours + bouton désactivé");
}

// 3. Câblage.
const index = readFileSync("cloudflare/public/index.html", "utf8");
assert.ok(index.includes("/modules/titans-v1.js"));
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
assert.ok(ui.includes("__SOREAL_IDLE_TITANS_V1__.page(j)") && ui.includes("__SOREAL_IDLE_TITANS_V1__.traduire(message)"));
assert.ok(readFileSync("cloudflare/public/modules/adventure-scene-v79.js", "utf8").includes("/api/idle/media/titan?"));
assert.ok(readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8").includes("payload.adventure.action==='startTitanFight'"));
assert.ok(readFileSync("cloudflare/src/idle-media-v1.js", "utf8").includes('"/api/idle/media/titan"'));
console.log("idle-titans-page-v1: OK");
