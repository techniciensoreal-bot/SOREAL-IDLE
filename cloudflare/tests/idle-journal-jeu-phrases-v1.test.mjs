import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Norman (2026-11-21) : « reprends les phrases du jeu pour le journal de l'ITOPOD et également pour celui d'Aventure ».
 * Phrases lues dans l'assembly du jeu (EnemyAI, PlayerController, AdventureController) : aucune phrase inventée, tout en anglais.
 */
const lire = (f) => readFileSync(new URL("../public/modules/" + f, import.meta.url), "utf8");
const fen = {};
const ctx = { window: fen };
vm.runInNewContext(lire("itopod-journal-v1.js"), ctx);
vm.runInNewContext(lire("journal-jeu-v1.js"), ctx);
const J = fen.__SOREAL_IDLE_JOURNAL_JEU_V1__;

assert.equal(J.attaque("normal", "Zed", "12"), "Zed attacked for 12 damage!");
assert.equal(J.attaque("massive", "Zed", "12"), "Zed unleashed a MASSIVE attack for 12 damage!");
assert.equal(J.attaque("poison", "Zed", "12"), "Zed has attacked for 12 damage! You've also been poisoned!");
assert.equal(J.attaque("paralyse", "Zed", "12"), "Zed attacks for 12 damage! You're now fully paralyzed, oh crap!");
assert.equal(J.attaque("rapide", "Zed", "12"), "You were attacked for 12 damage!");
assert.equal(J.attaque("croit", "Zed", "12"), "Zed has attacked for 12 damage! They swell up in size, too! Creepy!");
assert.equal(J.attaque("saigne", "Zed", "12"), "Zed hacked your limbs for  12 damage! You feel yourself bleed...");
assert.equal(J.victoire("Zed"), "You have defeated Zed!");
assert.equal(J.defaite("Zed"), "Zed has defeated you!");
assert.equal(J.soin("30"), "You healed yourself for 30 HP!");
assert.equal(J.or("500"), "Zed dropped 500 gold! Sweet!", "le butin commence par le dernier ennemi vaincu");
assert.deepEqual(Array.from(J.titan("walderpDit", "W", { dit: true, consigne: 6 })), ["WALDERP SAYS HIT ME WITH AN ULTIMATE ATTACK"]);
assert.deepEqual(Array.from(J.titan("walderpDit", "W", { dit: false, consigne: 3 })), ["HIT ME WITH A REGULAR ATTACK"]);
assert.equal(J.titan("aura", "T", { aura: 3 }).length, 2);
assert.equal(J.titan("accelere", "T")[0], "T glows red! Theyt've permanently sped up their power growth!", "faute du jeu conservée");
assert.equal(J.titan("poisonDegats", "", { n: "5" })[0], "You also take 5 poison damage!");

// Les sites d'appel n'écrivent plus les anciens textes français.
const combat = (lire("ui-combat-2-v1.js") + lire("ui-aventure-1-v1.js")).replace(/\/\*[\s\S]*?\*\//g, "");
for (const vieux of ["vous a attaqué pour", "Vous frappez", "Vous avez vaincu", "Tu es empoisonné", "gonfle à vue d’œil", "rougeoie"]) assert.ok(!combat.includes(vieux), "ancien texte retiré : " + vieux);
assert.ok(combat.includes("JOURNAL_JEU_V1__"), "journal d'Aventure branché sur les phrases du jeu");
assert.ok(readFileSync(new URL("../public/index.html", import.meta.url), "utf8").includes("journal-jeu-v1.js"), "module chargé");
console.log("idle-journal-jeu-phrases-v1: OK");
