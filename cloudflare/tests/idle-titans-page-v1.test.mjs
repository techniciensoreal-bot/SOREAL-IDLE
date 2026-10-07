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

// 1b. Noms canoniques de R2 (renommage du 2026-10-02) : <id>, <id>_<palier>, <id>_form<N> ; les fichiers annexes ne sont jamais choisis à leur place.
{
  const keys = [
    "idle/Titans/t1.png", "idle/Titans/t6_easy.png", "idle/Titans/t6_normal.png", "idle/Titans/t6_hard.png", "idle/Titans/t6_brutal.png",
    "idle/Titans/t5_form1.png", "idle/Titans/t5_form5.png", "idle/Titans/Titan_WalderpFull.png", "idle/Titans/Titan_GreasyNerd_Bucket.png",
    "idle/Titans/nerd_easy.png", "idle/Titans/Beast_Beast_v1_hq.png", "idle/Titans/tippi.png", "idle/Titans/Titan_Greasy_Nerd's_Mom.png"
  ];
  assert.equal(choisirCleTitanR2_(keys, "t1", "", -1), "idle/Titans/t1.png");
  assert.equal(choisirCleTitanR2_(keys, "t6", "brutal", -1), "idle/Titans/t6_brutal.png");
  assert.equal(choisirCleTitanR2_(keys, "t6", "", -1), "idle/Titans/Beast_Beast_v1_hq.png" === "x" ? "" : "idle/Titans/Beast_Beast_v1_hq.png", "sans palier : repli sur le nom de l'ancien fichier");
  assert.equal(choisirCleTitanR2_(keys, "t5", "", 4), "idle/Titans/t5_form5.png");
  assert.equal(choisirCleTitanR2_(keys, "nerd", "easy", -1), "idle/Titans/nerd_easy.png", "pas l'image annexe Greasy Nerd's Mom");
  assert.equal(choisirCleTitanR2_(keys, "tippi", "", -1), "idle/Titans/tippi.png");
  assert.equal(choisirCleTitanR2_(keys, "traitor", "", -1), "", "THE TRAITOR : aucune image dans R2 pour l'instant");
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
  assert.ok(html.includes("Stats conseillées") && html.includes("Stats actuelles") && html.includes("Capacités"));
  const attente = api.page({ systemes: { adventure: { titans: [{ id: "t1", name: "GRB", progressionUnlocked: true, state: { kills: 1, nextAt: Date.now() + 3_600_000 }, combat: {} }] } } });
  assert.ok(attente.includes("Réapparition dans") && attente.includes("data-ttn-cd") && /<button[^>]*disabled/.test(attente), "compte à rebours + bouton désactivé");
}

// 2b. Stats conseillées / actuelles (Norman, 2026-10-04, puis 2026-10-07 : « plus visibles ») : par mode (Manuel, Idle, Auto-kill), Puissance et Endurance conseillées à gauche, les tiennes à droite
// (vert si atteintes, rouge sinon), une jauge et un verdict clair.
{
  const titan = { id: "t1", name: "GRB", progressionUnlocked: true, state: { kills: 0, nextAt: 0 }, combat: {}, p: 1000, t: 800, idleP: 2000, idleT: 1600, autoKillP: 4000, autoKillT: 3200 };
  fenetre.__SOREAL_IDLE_LIRE_ETAT_V1__ = () => ({ systemes: { adventure: { stats: { power: 2500, toughness: 700 } } } });
  const html = api.page({ systemes: { adventure: { titans: [titan] } } });
  const debut = html.indexOf('class="ttn-reco"');
  assert.ok(debut > 0 && html.includes("Es-tu assez costaud"), "bloc de comparaison avec son titre");
  const bloc = html.slice(debut, html.indexOf("</article>", debut));
  assert.ok(bloc.includes("Stats conseillées") && bloc.includes("Stats actuelles"), "les deux colonnes sont titrées");
  assert.equal((bloc.match(/class="ttn-mode /g) || []).length, 3, "trois modes : Manuel, Idle, Auto-kill");
  // Manuel : Puissance 2500 >= 1000 (vert), Endurance 700 < 800 (rouge) ; Idle : Puissance 2500 >= 2000 (vert), Endurance rouge ; Auto-kill : les deux rouges.
  const verts = (bloc.match(/ttn-ok-oui/g) || []).length;
  const rouges = (bloc.match(/ttn-ok-non/g) || []).length;
  assert.equal(verts, 2, "Puissance atteinte sur Manuel et Idle");
  assert.equal(rouges, 4, "Endurance jamais atteinte (3 modes) + Puissance d'auto-kill");
  assert.equal((bloc.match(/class="ttn-jauge /g) || []).length, 6, "une jauge par chiffre (3 modes x 2)");
  assert.ok(bloc.includes("❌ Pas encore : il te manque") && bloc.includes("⚔️ 1.5K") === false && bloc.includes("🛡️ 100"), "verdict : ce qui manque, en clair (Manuel : il manque 100 d'Endurance)");
  assert.ok(/ttn-verdict non">❌ Pas encore : il te manque 🛡️ 100/.test(bloc), "Manuel : seule l'Endurance manque");
  assert.ok(/ttn-mode non"><div class="ttn-mode-haut"><b class="ttn-mode-nom">Auto-kill/.test(bloc), "Auto-kill : mode en rouge");
  fenetre.__SOREAL_IDLE_LIRE_ETAT_V1__ = () => ({ systemes: { adventure: { stats: { power: 5000, toughness: 5000 } } } });
  const tout = api.page({ systemes: { adventure: { titans: [titan] } } });
  assert.ok(!tout.includes("ttn-ok-non") && tout.split("✅ Prêt</span>").length - 1 === 3, "tout atteint : tout est vert, trois verdicts « Prêt »");
  fenetre.__SOREAL_IDLE_LIRE_ETAT_V1__ = () => null;
  const sans = api.page({ systemes: { adventure: { titans: [titan] } } });
  assert.ok(sans.includes("Stats actuelles") && sans.includes("Tes stats se chargent"), "sans état : jamais de plantage");
}
// Statistiques du titan : cinq tuiles à gros chiffres.
{
  const html = api.page({ systemes: { adventure: { titans: [{ id: "t1", name: "GRB", progressionUnlocked: true, state: { kills: 0, nextAt: 0 }, combat: { "": { hp: 3e5, power: 666, toughness: 666, regen: 66, attackRate: 2 } } }] } } });
  assert.equal((html.match(/class="ttn-stat"/g) || []).length, 5, "cinq tuiles : PV, Puissance, Endurance, Régénération, cadence");
  assert.ok(html.includes("Ses statistiques") && html.includes("Puissance") && html.includes("Endurance") && !html.includes("Toughness"), "libellés en français clair");
}
const css = readFileSync("cloudflare/public/soreal-idle-itopod.css", "utf8");
assert.ok(css.includes("TITANS : l'ARÈNE DES TITANS") && css.includes('[data-menu="titans"] .ttn-carte.ttn-carte{') && css.includes("button.ttn-bouton.ttn-bouton{"), "habillage de l'arène des Titans");

// 3. Câblage.
const index = readFileSync("cloudflare/public/index.html", "utf8");
assert.ok(index.includes("/modules/titans-v1.js"));
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
assert.ok(ui.includes("__SOREAL_IDLE_TITANS_V1__.page(j)") && ui.includes("__SOREAL_IDLE_TITANS_V1__.traduire(message)"));
assert.ok(readFileSync("cloudflare/public/modules/adventure-scene-v79.js", "utf8").includes("/api/idle/media/titan?"));
assert.ok(readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8").includes("payload.adventure.action==='startTitanFight'"));
assert.ok(readFileSync("cloudflare/src/idle-media-v1.js", "utf8").includes('"/api/idle/media/titan"'));
console.log("idle-titans-page-v1: OK");
