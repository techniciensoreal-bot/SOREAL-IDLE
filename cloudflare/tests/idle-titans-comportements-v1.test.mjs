import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Comportements des titans (Norman, 2026-10-04). Gordon Ramsay Bolton, wiki « Titan Skills » : Paralyze 1/7 (4 s ou 2 attaques, jamais avant 10 attaques depuis la précédente),
 * Power Attack 2/7 (x2), Bleed 2/7 (ampleur non publiée : non simulé).
 */
const ctx = { window: undefined }; ctx.globalThis = ctx; vm.createContext(ctx);
vm.runInContext(readFileSync("cloudflare/public/modules/titans-comportements-v1.js", "utf8"), ctx);
const api = ctx.SorealTitanComportementsV1;
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
assert.ok(api.possede("t1") && api.possede("t2") && api.possede("t3") && api.possede("t4") && !api.possede("t5"));

// Tirage : [0,1) paralysie, [1,3) saignement, [3,5) puissante, le reste base (sur 7).
let e = api.neuf();
assert.equal(api.attaqueTitan("t1", e, 1000, 0.5 / 7).type, "base", "moins de 10 attaques : attaque de base à la place de la paralysie");
for (let i = 0; i < 9; i++) api.attaqueTitan("t1", e, 1000, 6.5 / 7);
assert.equal(e.depuisParalysie, 10);
let r = api.attaqueTitan("t1", e, 20000, 0.5 / 7);
assert.equal(r.type, "paralysie"); assert.ok(r.paralyse);
assert.ok(api.joueurParalyse(e, 21000) && api.joueurParalyse(e, 23999) && !api.joueurParalyse(e, 24000), "4 s");
assert.equal(e.depuisParalysie, 0);

// Deux attaques pendant la paralysie la terminent avant les 4 s ; pas de nouvelle paralysie pendant.
r = api.attaqueTitan("t1", e, 21000, 0.5 / 7); assert.equal(r.type, "base");
assert.ok(api.joueurParalyse(e, 21500));
api.attaqueTitan("t1", e, 22000, 6.5 / 7);
assert.ok(!api.joueurParalyse(e, 22000), "fin à la 2e attaque");
assert.equal(api.finParalysie(e, 22000), 2000, "durée subie pour repousser les cooldowns");
assert.equal(api.finParalysie(e, 22001), 0);

// Attaque puissante x2 ; saignement : constante SOREAL (-10 % de régénération par cumul, non publiée par le wiki, accord de Norman 2026-10-04).
e = api.neuf();
assert.equal(api.attaqueTitan("t1", e, 1, 3.5 / 7).multDegats, 2);
assert.equal(api.attaqueTitan("t1", e, 2, 1.5 / 7).multDegats, 1);
assert.equal(e.saignements, 1);
assert.ok(api.attaqueTitan("t1", e, 3, 2.5 / 7).saigne);
assert.equal(api.multRegenJoueur("t1", api.neuf()), 1, "sans saignement : régénération intacte");
assert.ok(Math.abs(api.multRegenJoueur("t1", e) - 0.8) < 1e-9, "2 cumuls : -20 %");
e.saignements = 10; assert.ok(Math.abs(api.multRegenJoueur("t1", e)) < 1e-9, "10 cumuls : régénération nulle");
e.saignements = 15; assert.ok(api.multRegenJoueur("t1", e) < 0, "au-delà : négative (perte de PV)");
assert.equal(api.multRegenJoueur("t2", api.neuf()), 1, "pas de saignement pour les autres titans");
assert.ok(ui.includes("multRegenJoueur(fight.titanId,idleTitanEtatV1)") && ui.includes("}else if(regenJoueur<0){"));

// Grand Corrupted Tree : spores des bras (1/7, si pas déjà appliquées) -> dégâts x2/3 pendant 15 s ; puissante (2/7) x1,5 ; spores d'énergie non simulées.
e = api.neuf();
assert.equal(api.multDegatsJoueur("t2", e, 0), 1);
r = api.attaqueTitan("t2", e, 1000, 0.5 / 7); assert.equal(r.type, "sporesBras"); assert.ok(r.spores);
assert.equal(api.multDegatsJoueur("t2", e, 15999), 2 / 3); assert.equal(api.multDegatsJoueur("t2", e, 16000), 1);
assert.equal(api.attaqueTitan("t2", e, 2000, 0.5 / 7).type, "base", "déjà appliqué : pas de nouveau nuage");
assert.equal(api.attaqueTitan("t2", e, 2000, 1.5 / 7).type, "base", "spores d'énergie : ampleur inconnue, non simulées");
assert.equal(api.attaqueTitan("t2", e, 2000, 2.5 / 7).multDegats, 1.5);
assert.equal(api.attaqueTitan("t2", e, 2000, 5.5 / 7).multDegats, 1);
assert.equal(api.multDegatsJoueur("t1", api.neuf(), 0), 1);
assert.ok(ui.includes("titanMultDegatsJoueurIdleV1_(fight,maintenant)") && ui.includes("titanMultDegatsJoueurIdleV1_(fight,momentEvenement)"));
// Jake : 1re attaque = battement de chemise (remplace l'attaque, désactive Ultimate), puis toutes les 20 ; ordre du wiki ; sauterelles 1/5 si 10 attaques d'écart ; puissante 2/5 x1,5.
e = api.neuf();
r = api.attaqueTitan("t3", e, 0, 0.5);
assert.equal(r.type, "chemise"); assert.equal(r.multDegats, 0); assert.equal(r.desactive, "ultimate");
assert.ok(api.competenceDesactivee("t3", e, "ultimate") && !api.competenceDesactivee("t3", e, "heal") && !api.competenceDesactivee("t1", e, "ultimate"));
assert.equal(api.attaqueTitan("t3", e, 1, 0.5 / 5).type, "base", "sauterelles : pas avant 10 attaques");
assert.equal(api.attaqueTitan("t3", e, 2, 1.5 / 5).multDegats, 1.5);
for (let i = 0; i < 17; i++) api.attaqueTitan("t3", e, 3, 4.5 / 5);
assert.equal(e.attaques, 20);
r = api.attaqueTitan("t3", e, 4, 0.5 / 5);
assert.equal(r.type, "chemise", "la 21e attaque est un battement de chemise"); assert.equal(r.desactive, "heal");
const ordre = ["ultimate", "heal", "piercing", "ultimateBuff", "strong", "offensiveBuff"];
for (let k = 2; k <= 5; k++) { for (let i = 0; i < 19; i++) api.attaqueTitan("t3", e, 5, 4.5 / 5); r = api.attaqueTitan("t3", e, 5, 4.5 / 5); assert.equal(r.type, "chemise"); assert.equal(r.desactive, ordre[k]); }
for (const c of ordre) assert.ok(api.competenceDesactivee("t3", e, c), c);
for (let i = 0; i < 19; i++) api.attaqueTitan("t3", e, 5, 4.5 / 5);
r = api.attaqueTitan("t3", e, 5, 4.5 / 5); assert.equal(r.type, "chemise"); assert.equal(r.desactive, null, "au-delà : plus d'effet"); assert.ok(!r.nouvelle);
// Rafale : 10 coups à demi-dégâts, 0,15 s d'écart, puis plus avant 10 attaques.
e = api.neuf(); api.attaqueTitan("t3", e, 0, 0.5);
for (let i = 0; i < 10; i++) api.attaqueTitan("t3", e, 1, 4.5 / 5);
r = api.attaqueTitan("t3", e, 2, 0.5 / 5);
assert.equal(r.type, "sauterelles"); assert.equal(r.multDegats, 0.5); assert.ok(r.suite); assert.equal(r.intervalleMs, 150);
let coups = 1;
while (true) { const x = api.attaqueTitan("t3", e, 3, 0.9); assert.equal(x.type, "sauterelle"); assert.equal(x.multDegats, 0.5); coups++; if (!x.suite) break; }
assert.equal(coups, 10, "10 attaques rapides");
assert.equal(api.attaqueTitan("t3", e, 4, 0.5 / 5).type, "base", "pas de nouvelles sauterelles avant 10 attaques");
assert.ok(ui.includes("titanCompetenceDesactiveeIdleV1_(id)") && ui.includes("btn.classList.toggle('titan-off',desactivee)") && ui.includes("idleAdventureFightNextEnemyHitV2=momentEvenement+att.intervalleMs"));
// UUG : invincible après sa 1re attaque sans Anneau d'Apathie ; croissance (2 - niveau/100)^tours ; puissante x1,5 (chance 2/7, choisie par SOREAL).
e = api.neuf();
assert.equal(api.multDegatsJoueur("t4", e, 0), 1, "avant sa première attaque : touchable");
r = api.attaqueTitan("t4", e, 0, 0.9);
assert.equal(r.croissance, 2); assert.equal(r.multDegats, 2); assert.ok(r.invincibleDebut);
assert.equal(api.multDegatsJoueur("t4", e, 1), 0, "invincible");
r = api.attaqueTitan("t4", e, 1, 0.9); assert.equal(r.croissance, 4); assert.ok(!r.invincibleDebut);
r = api.attaqueTitan("t4", e, 2, 0.1); assert.equal(r.type, "puissante"); assert.equal(r.multDegats, 8 * 1.5);
// Avec l'anneau : plus invincible, croissance réduite selon le niveau (niveau 0 : 2x ; 50 : 1,5x ; 100 : aucune).
for (const [niveau, facteur] of [[0, 2], [50, 1.5], [100, 1]]) {
  e = api.neuf(); e.anneau = niveau;
  r = api.attaqueTitan("t4", e, 0, 0.9); assert.equal(r.croissance, facteur); assert.ok(!r.invincibleDebut);
  r = api.attaqueTitan("t4", e, 1, 0.9); assert.equal(r.croissance, Math.pow(facteur, 2));
  assert.equal(api.multDegatsJoueur("t4", e, 2), 1, "anneau équipé : jamais invincible (niveau " + niveau + ")");
}
e = api.neuf(); e.anneau = 69; for (let i = 0; i < 20; i++) r = api.attaqueTitan("t4", e, i, 0.9);
assert.ok(Math.abs(r.croissance - Math.pow(1.31, 20)) < 1e-6, "niveau 69, 20 tours");
assert.ok(ui.includes("niveauAnneauApathieIdleV1_(a)") && ui.includes("item.definitionId==='ringOfApathy'") && ui.includes("mobInvincible:"));
// Branchement dans le combat et note honnête sur la fiche.
assert.ok(ui.includes("window.SorealTitanComportementsV1.attaqueTitan(fight.titanId"));
assert.ok(ui.includes("!titanJoueurParalyseIdleV1_(maintenantTick)"), "Idle Mode coupé");
assert.ok(ui.includes("if(titanJoueurParalyseIdleV1_(Date.now()))return;"), "capacités coupées");
assert.ok(/Saignement/.test(api.note("t1")) && /Paralysie/.test(api.note("t1")) && /SOREAL/.test(api.note("t1")));
assert.ok(readFileSync("cloudflare/public/index.html", "utf8").includes("/modules/titans-comportements-v1.js"));
console.log("idle-titans-comportements-v1: OK");
