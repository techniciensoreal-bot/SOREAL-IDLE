import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { lireSrc } from "./_src-sources.mjs";

/*
 * Norman (2026-11-21, photo du vrai jeu) : « dans l'ITOPOD, le joueur a une barre de vie et il y a un journal de combat ».
 * Phrases lues dans le jeu (PlayerController::damageText, AdventureController::enemyDeath, ItopodPerkController::addProgress) ; le jeu n'écrit rien quand l'ennemi frappe.
 */
const lire = (f) => readFileSync(new URL("../public/" + f, import.meta.url), "utf8");

// 1. Phrases de dégâts : table du jeu, seuil « dégâts > seuil ».
{
  const fen = {};
  vm.runInNewContext(lire("modules/itopod-journal-v1.js"), { window: fen });
  const J = fen.__SOREAL_IDLE_ITOPOD_JOURNAL_V1__;
  assert.equal(J.phrase(7.355e35, "Dalassa", "", (v) => "X" + v), "You give Dalassa a bear-hug for X7.355e+35 damage!", "photo du jeu : 7,355E+035 = « bear-hug »");
  assert.equal(J.phrase(5, "Zed", "", (v) => String(v)), "You hit Zed for 5 damage!", "phrase par défaut sous 10");
  assert.equal(J.phrase(10, "Zed", "", String), "You hit Zed for 10 damage!", "10 pile : dégâts > 10 exigé");
  assert.equal(J.phrase(11, "Zed", "", String), "You hit Zed hard for 11 damage!");
  assert.equal(J.phrase(4e7, "Zed", "", String), "You compressed Zed into a black hole for 40000000 damage!", "palier 25 000 000 (second palier du seuil 50 000 000)");
  assert.equal(J.phrase(6e7, "Zed", "", String), "You sent Zed to the 43rd dimension for 60000000 damage!");
  assert.equal(J.phrase(2e34, "Zed", "Butts", String), "You discombobulated Zed for 2e+34 damage!");
  assert.equal(J.phrase(5e34, "Zed", "Butts", String), "You combine your Energy, Magic & Butts at Zed for 5e+34 damage!");
  assert.equal(J.phrase(1e39, "Zed", "", String), "You NGU-BLASTED Zed's ass for 1e+39 damage!");
  for (let i = 1; i < J.tiers.length; i += 1) assert.ok(J.tiers[i - 1][0] > J.tiers[i][0], "seuils strictement décroissants à la ligne " + i);
}

// 2. Le serveur envoie de quoi dessiner la barre et les lignes (même calcul que la progression).
{
  const sys = lireSrc("idle-ngu-systemes.js");
  for (const champ of ["d.pvMax =", "d.pv =", "d.degatsCoup =", "d.ennemiCoup =", "d.regenPv =", "d.ppBase =", "d.ppMult ="]) assert.ok(sys.includes(champ), "champ envoyé : " + champ);
}

// 3. Scène : barre de vie du joueur (coups de l'ennemi, régénération) et journal (dégâts, victoire, progression, Perk Point).
{
  let t = 1_000_000;
  const faux = { now: () => t };
  const fen = {};
  const boite = { scrollTop: 0, scrollHeight: 999, lignes: [], get children() { return this.lignes; }, insertAdjacentHTML(_p, h) { this.lignes.push(h); }, removeChild() { this.lignes.shift(); }, get firstChild() { return this.lignes[0]; } };
  const rempli = { style: {} }, texte = { textContent: "" }, vie = { style: {} };
  const stub = { classList: { add() {}, remove() {} }, style: {}, offsetWidth: 0 };
  const attrs = { "data-kills": "100", "data-etage": "5", "data-sur": "0" };
  const el = {
    getAttribute: (n) => attrs[n], innerHTML: "",
    querySelector(s) {
      if (s === ".itp-journal") return boite;
      if (s === ".itp-vie-joueur .itp-vie-rempli") return rempli;
      if (s === ".itp-vie-joueur .itp-vie-texte") return texte;
      if (s === ".itp-vie:not(.itp-vie-joueur) .itp-vie-rempli") return vie;
      if (s === ".itp-vitre" || s === ".itp-poing" || s === ".itp-ennemi") return stub;
      return null;
    }
  };
  const DateFaux = function () { return new Date(t); };
  DateFaux.now = faux.now;
  const document = { hidden: false, querySelectorAll: () => [el], addEventListener() {} };
  vm.runInNewContext(lire("modules/itopod-journal-v1.js"), { window: fen });
  vm.runInNewContext(lire("modules/itopod-scene-v1.js"), { window: fen, document, fetch: () => Promise.reject(new Error("x")), Date: DateFaux, Math: Object.assign(Object.create(Math), { random: () => 0.5 }) });
  const S = fen.__SOREAL_IDLE_ITOPOD_SCENE_V1__;
  // un ennemi à 3 coups, un coup toutes les secondes ; l'ennemi frappe 10 PV (PV 100) ; 1 PV/s ; 2 000 000 PPP par kill
  const html = S.html({ floor: 5, kills: 100, killsOnFloor: 0, hitsParKill: 3, intervalS: 1, respawnS: 4, actif: true, pvMax: 100, pv: 100, degatsCoup: 1000, ennemiCoup: 10, regenPv: 1, ppBase: 200, ppMult: 1, ppProgress: 0 });
  assert.ok(html.includes("itp-vie-joueur") && html.includes("itp-journal"), "barre de vie du joueur et journal dans la scène");
  assert.ok(html.includes("100 HP"), "PV en texte");
  const pas = () => S.pas();
  pas(); // premier coup : phrase de dégâts (0,8 + 0,5 x 0,4 = 1 x 1000 = « You smashed… » palier 1000 → FLORIFIED)
  assert.equal(boite.lignes.length, 1);
  assert.match(boite.lignes[0], /itp-j-vert/);
  assert.match(boite.lignes[0], /You (?:detonated|FLORIFIED|melted) /);
  // un coup toutes les secondes : le 2e coup, puis le 3e tue ; l'ennemi frappe à 1,8 s après son apparition (0,8 s après le 1er coup)
  t += 1000; pas();
  assert.ok(Number(rempli.style.width.replace("%", "")) < 100, "l'ennemi a frappé : la barre de vie du joueur descend");
  t += 1000; pas();
  const texteLignes = boite.lignes.join("|");
  assert.ok(texteLignes.includes("You have defeated "), "ligne de victoire");
  assert.ok(texteLignes.includes("You gained ") && texteLignes.includes(" progress to your next Perk Point!"), "ligne de progression");
  assert.ok(!/Perk Point!/.test(texteLignes.replace(/progress to your next Perk Point!/g, "")), "pas de Perk Point sous le seuil de 1 000 000");
  // la régénération remonte les PV
  const avant = S.combat.pv;
  t += 900; pas();
  assert.ok(S.combat.pv > avant || S.combat.pv === S.combat.pvMax, "régénération des PV");
}

// 4. Perk Point : le seuil franchi écrit « You gained N Perk Point(s)! ».
{
  let t = 5_000_000;
  const fen = {};
  const boite = { scrollTop: 0, scrollHeight: 1, lignes: [], get children() { return this.lignes; }, insertAdjacentHTML(_p, h) { this.lignes.push(h); }, removeChild() { this.lignes.shift(); }, get firstChild() { return this.lignes[0]; } };
  const stub = { classList: { add() {}, remove() {} }, style: {}, offsetWidth: 0 };
  const el = { getAttribute: (n) => ({ "data-kills": "0", "data-etage": "1", "data-sur": "0" })[n], innerHTML: "", querySelector: (s) => (s === ".itp-journal" ? boite : s.includes("itp-vitre") || s.includes("poing") || s.includes("ennemi") ? stub : s.includes("rempli") ? { style: {} } : s.includes("texte") ? { textContent: "" } : null) };
  const DateFaux = function () { return new Date(t); };
  DateFaux.now = () => t;
  vm.runInNewContext(lire("modules/itopod-journal-v1.js"), { window: fen });
  vm.runInNewContext(lire("modules/itopod-scene-v1.js"), { window: fen, document: { hidden: false, querySelectorAll: () => [el], addEventListener() {} }, fetch: () => Promise.reject(new Error("x")), Date: DateFaux, Math });
  const S = fen.__SOREAL_IDLE_ITOPOD_SCENE_V1__;
  S.html({ floor: 1, kills: 0, killsOnFloor: 0, hitsParKill: 1, intervalS: 1, respawnS: 4, actif: true, pvMax: 50, pv: 50, degatsCoup: 100, ennemiCoup: 1, regenPv: 0, ppBase: 1_500_000, ppMult: 1, ppProgress: 0 });
  S.pas();
  assert.ok(boite.lignes.join("|").includes("You gained 1 Perk Point!"), "un Perk Point : phrase au singulier");
}

// 5. Anti-spoil et textes : la page n'est visible que tour débloquée ; aucune phrase de repli inventée.
{
  const sc = lire("modules/itopod-scene-v1.js");
  assert.ok(!/wiki/i.test(sc.replace(/\/\*[\s\S]*?\*\//g, "")), "aucun mot « wiki » dans un texte affiché");
  assert.ok(lire("index.html").includes("itopod-journal-v1.js"), "module du journal chargé");
  assert.ok(lire("itopod-journal-v1.css").includes(".itp-journal") && lire("itopod-journal-v1.css").includes(".itp-vie-joueur"), "feuille du journal");
  assert.ok(lire("index.html").includes("/itopod-journal-v1.css"), "feuille chargée");
}
console.log("idle-itopod-journal-vie-joueur-v1: OK");
