import assert from "node:assert/strict";
import { lireUiComplet } from "./_ui-sources.mjs";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Comportements des titans (Norman, 2026-10-04). Gordon Ramsay Bolton, wiki « Titan Skills » : Paralyze 1/7 (4 s ou 2 attaques, jamais avant 10 attaques depuis la précédente),
 * Power Attack 2/7 (x2), Bleed 2/7 (ampleur non publiée : non simulé).
 */
const ctx = { window: undefined }; ctx.globalThis = ctx; vm.createContext(ctx);
vm.runInContext(readFileSync("cloudflare/public/modules/titans-comportements-v1.js", "utf8"), ctx);
const api = ctx.SorealTitanComportementsV1;
const ui = lireUiComplet();
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
const proche = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, (msg || "") + " (obtenu " + a + ", attendu " + b + ")");
const basique = (r, e) => r.multDegats / (1 + e.attaques / 100);   // type de coup sans la croissance additive 1 + n/100
proche(basique(api.attaqueTitan("t1", e, 1, 3.5 / 7), e), 2, "puissante x2");
proche(basique(api.attaqueTitan("t1", e, 2, 1.5 / 7), e), 1, "base");
assert.equal(e.saignements, 1);
assert.ok(api.attaqueTitan("t1", e, 3, 2.5 / 7).saigne);
assert.equal(api.regenRetireeSaignement("t1", api.neuf()), 0, "sans saignement : régénération intacte");
assert.equal(api.regenRetireeSaignement("t1", e), 4, "2 cumuls : -4 PV/s (lu dans le jeu : 2 PV/s par cumul)");
e.saignements = 4; assert.equal(api.regenRetireeSaignement("t1", e), 8, "4 cumuls : -8 PV/s (mesuré dans le vrai jeu : pente de 38,0 à 27,8 /s soit environ -2,6 par cumul avec le facteur d'affichage)");
assert.equal(api.regenRetireeSaignement("t2", api.neuf()), 0, "pas de saignement pour les autres titans");
assert.ok(ui.includes("regenRetireeSaignement(fight.titanId,idleTitanEtatV1)") && ui.includes("}else if(regenJoueur<0){"));

// Grand Corrupted Tree : spores des bras (1/7, si pas déjà appliquées) -> dégâts x2/3 pendant 15 s ; puissante (2/7) x1,5 ; spores d'énergie non simulées.
e = api.neuf();
assert.equal(api.multDegatsJoueur("t2", e, 0), 1);
r = api.attaqueTitan("t2", e, 1000, 0.5 / 7); assert.equal(r.type, "sporesBras"); assert.ok(r.spores);
assert.equal(api.multDegatsJoueur("t2", e, 15999), 2 / 3); assert.equal(api.multDegatsJoueur("t2", e, 16000), 1);
assert.equal(api.attaqueTitan("t2", e, 2000, 0.5 / 7).type, "base", "déjà appliqué : pas de nouveau nuage");
const e3 = api.neuf(); // nuage d'énergie (1/7, si pas déjà appliqué) : dégâts subis x2,5 pendant 15 s (valeur choisie par SOREAL, le wiki hésite entre 1,5 et 4)
r = api.attaqueTitan("t2", e3, 2000, 1.5 / 7); assert.equal(r.type, "sporesEnergie"); assert.ok(r.draine);
proche(basique(api.attaqueTitan("t2", e3, 3000, 5.5 / 7), e3), 1.5, "pendant 15 s : dégâts subis x1,5 (lu dans le jeu)");
proche(basique(api.attaqueTitan("t2", e3, 16999, 5.5 / 7), e3), 1.5, "encore actif juste avant la fin");
proche(basique(api.attaqueTitan("t2", e3, 17000, 5.5 / 7), e3), 1, "fini au bout de 15 s");
assert.equal(api.attaqueTitan("t2", e3, 17500, 1.5 / 7).type, "sporesEnergie", "nouveau nuage possible une fois le premier fini");
assert.equal(api.attaqueTitan("t2", e3, 18000, 1.5 / 7).type, "base", "déjà appliqué : pas de nouveau nuage");
proche(basique(api.attaqueTitan("t2", e, 2000, 2.5 / 7), e), 1.5, "puissante x1,5");
proche(basique(api.attaqueTitan("t2", e, 2000, 5.5 / 7), e), 1, "base");
assert.equal(api.multDegatsJoueur("t1", api.neuf(), 0), 1);
assert.ok(ui.includes("titanMultDegatsJoueurIdleV1_(fight,maintenant)") && ui.includes("titanMultDegatsJoueurIdleV1_(fight,momentEvenement)"));
// Jake : 1re attaque = battement de chemise (remplace l'attaque, désactive Ultimate), puis toutes les 20 ; ordre du wiki ; sauterelles 1/5 si 10 attaques d'écart ; puissante 2/5 x1,5.
e = api.neuf();
r = api.attaqueTitan("t3", e, 0, 0.5);
assert.equal(r.type, "chemise"); assert.equal(r.multDegats, 0); assert.equal(r.desactive, "ultimate");
assert.ok(api.competenceDesactivee("t3", e, "ultimate") && !api.competenceDesactivee("t3", e, "heal") && !api.competenceDesactivee("t1", e, "ultimate"));
assert.equal(api.attaqueTitan("t3", e, 1, 0.5 / 5).type, "base", "sauterelles : pas avant 10 attaques");
proche(basique(api.attaqueTitan("t3", e, 2, 1.5 / 5), e), 1.5, "Jake : puissante x1,5");
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
assert.equal(r.type, "sauterelles"); proche(r.multDegats, 0.5 * (1 + e.attaques / 100), "sauterelles : demi-dégâts x (1 + n/100)"); assert.ok(r.suite); assert.equal(r.intervalleMs, 150);
let coups = 1;
while (true) { const x = api.attaqueTitan("t3", e, 3, 0.9); assert.equal(x.type, "sauterelle"); proche(x.multDegats, 0.5 * (1 + e.attaques / 100)); coups++; if (!x.suite) break; }
assert.equal(coups, 10, "10 attaques rapides");
assert.equal(api.attaqueTitan("t3", e, 4, 0.5 / 5).type, "base", "pas de nouvelles sauterelles avant 10 attaques");
assert.ok(ui.includes("titanCompetenceDesactiveeIdleV1_(id)") && ui.includes("btn.classList.toggle('titan-off',desactivee)") && ui.includes("idleAdventureFightNextEnemyHitV2=momentEvenement+att.intervalleMs"));
// UUG (lu dans le jeu) : puissante x1,5 une fois sur deux (tirage 1 à 4) ; croissance 1 + n/100, n monte de 1 par attaque ; sans anneau : invincible dès la 1re attaque et n = (n + 400) x 2 ensuite.
e = api.neuf();
assert.equal(api.multDegatsJoueur("t4", e, 0), 1, "avant sa première attaque : touchable");
r = api.attaqueTitan("t4", e, 0, 0.9);
proche(r.croissance, 1.01, "1re attaque : 1 + 1/100"); proche(r.multDegats, 1.01); assert.ok(r.invincibleDebut);
assert.equal(api.multDegatsJoueur("t4", e, 1), 0, "invincible");
r = api.attaqueTitan("t4", e, 1, 0.9); proche(r.croissance, 1 + 803 / 100, "2e attaque : n = (1 + 400) x 2 = 802, puis +1"); assert.ok(!r.invincibleDebut);
r = api.attaqueTitan("t4", e, 2, 0.1); assert.equal(r.type, "puissante"); proche(r.multDegats, 1.5 * r.croissance, "puissante x1,5");
assert.equal(api.attaqueTitan("t4", api.neuf(), 0, 0.49).type, "puissante", "tirage < 1/2 : puissante (UUG : 2 tirages sur 4)");
assert.equal(api.attaqueTitan("t4", api.neuf(), 0, 0.51).type, "base", "tirage >= 1/2 : base");
// Avec l'anneau de niveau L < 100 : jamais invincible ; n = ceil((n + 100 - L) x (2 - L/100)) ; à 100, seulement +1 par attaque.
function refUug(niveau, tours) { let gc = 0; const out = []; for (let i = 0; i < tours; i++) { gc += 1; out.push(1 + gc / 100); if (niveau < 100) gc = Math.ceil((gc + 100 - niveau) * (2 - niveau / 100)); } return out; }
for (const niveau of [0, 50, 69, 100]) {
  e = api.neuf(); e.anneau = niveau; const attendu = refUug(niveau, 6);
  for (let i = 0; i < 6; i++) { r = api.attaqueTitan("t4", e, i, 0.9); proche(r.croissance, attendu[i], "anneau " + niveau + ", attaque " + (i + 1)); assert.ok(!r.invincibleDebut); }
  assert.equal(api.multDegatsJoueur("t4", e, 7), 1, "anneau équipé : jamais invincible (niveau " + niveau + ")");
}
assert.ok(ui.includes("niveauAnneauApathieIdleV1_(a)") && ui.includes("item.definitionId==='ringOfApathy'") && ui.includes("mobInvincible:"));
// Branchement dans le combat et note honnête sur la fiche.
assert.ok(ui.includes("window.SorealTitanComportementsV1.attaqueTitan(fight.titanId"));
assert.ok(ui.includes("!titanJoueurParalyseIdleV1_(maintenantTick)"), "Idle Mode coupé");
assert.ok(ui.includes("if(titanJoueurParalyseIdleV1_(Date.now()))return;"), "capacités coupées");
assert.ok(/Saignement/.test(api.note("t1")) && /Paralysie/.test(api.note("t1")) && /2 PV/.test(api.note("t1")) && !/wiki/i.test(api.note("t1")));
assert.ok(readFileSync("cloudflare/public/index.html", "utf8").includes("/modules/titans-comportements-v1.js"));
console.log("idle-titans-comportements-v1: OK");

// Tous les titans gagnent 1 % de force par attaque : croissance ADDITIVE 1 + n/100 appliquée au coup APRÈS la réduction par la Robustesse (lu dans le jeu, 2026-11-15).
{
  const e2 = api.neuf();
  const r1 = api.attaqueTitan("t5", e2, 0, 0.9);
  proche(r1.multDegats, 1.01, "1re attaque : 1 + 1/100"); assert.equal(r1.croissanceTitan, 1, "plus de croissance appliquée à la puissance avant la réduction");
  let rN = null;
  for (let i = 1; i < 50; i += 1) rN = api.attaqueTitan("t5", e2, i * 2000, 0.9);
  proche(rN.multDegats, 1.5, "50e attaque : 1 + 50/100 (additif ; le cumulé 1,01^50 donnerait 1,64)");
  assert.ok(ui.includes("if(att.multDegats!==1)degats=Math.min(avant,Math.round(degats*att.multDegats));"), "la croissance (dans multDegats) s'applique après la réduction par la Robustesse");
}
console.log("idle-titans-comportements-v1: OK");
