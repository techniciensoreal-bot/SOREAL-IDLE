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
assert.ok(api.possede("t1") && api.possede("t2") && !api.possede("t3"));

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
// Branchement dans le combat et note honnête sur la fiche.
assert.ok(ui.includes("window.SorealTitanComportementsV1.attaqueTitan(fight.titanId"));
assert.ok(ui.includes("!titanJoueurParalyseIdleV1_(maintenantTick)"), "Idle Mode coupé");
assert.ok(ui.includes("if(titanJoueurParalyseIdleV1_(Date.now()))return;"), "capacités coupées");
assert.ok(/Saignement/.test(api.note("t1")) && /Paralysie/.test(api.note("t1")) && /SOREAL/.test(api.note("t1")));
assert.ok(readFileSync("cloudflare/public/index.html", "utf8").includes("/modules/titans-comportements-v1.js"));
console.log("idle-titans-comportements-v1: OK");
