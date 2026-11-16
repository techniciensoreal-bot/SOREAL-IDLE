import assert from "node:assert/strict";
import { lireUiComplet } from "./_ui-sources.mjs";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/*
 * Capacités de combat des titans 5 à 14, de Tippi et du Traître (Norman, 2026-11-16) : valeurs lues dans l'IL du jeu (NGU Idle build 1260, EnemyAI::waldoAI, beastAI, nerdAI, godmotherAI, exileAI, itHungersAI,
 * rockLobsterAI, amalgamateAI, ratAI, traitorAI) : design/audit-code-jeu/ia-ennemis-titans.md, section 3. Aucune constante SOREAL.
 */
const ctx = { window: undefined }; ctx.globalThis = ctx; vm.createContext(ctx);
vm.runInContext(readFileSync("cloudflare/public/modules/titans-comportements-v1.js", "utf8"), ctx);
const api = ctx.SorealTitanComportementsV1;
const ui = lireUiComplet();
const proche = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, (msg || "") + " (obtenu " + a + ", attendu " + b + ")");
const suite = (...v) => { let i = 0; return () => v[Math.min(i++, v.length - 1)]; };
const tous = ["t5", "t6", "nerd", "godmother", "t7", "hungers", "lobster", "amalgamate", "tippi", "traitor"];
for (const id of tous) assert.ok(api.possede(id) && api.note(id).length > 20 && !/wiki/i.test(api.note(id)), id + " : simulé, note sans « wiki »");
const lancer = (id, e, n, tirage, t0 = 0) => { let r = null; for (let i = 0; i < n; i++) r = api.attaqueTitan(id, e, t0 + i * 2000, tirage); return r; };

// ---- Walderp : cycle de 6 ; action 2 « Walderp dit » (aucun dégât), action 3 explosion si la boucle n'est pas résolue ----
{
  const e = api.neuf("t5", 1);
  const r1 = api.attaqueTitan("t5", e, 0, 0.1); assert.equal(r1.type, "base"); proche(r1.multDegats, 1.01);
  e.hasard = suite(0.2, 0.5);   // 0,2 < 0,5 : il dit ; consigne 2 + floor(0,5 x 5) = 4 (forte)
  const r2 = api.attaqueTitan("t5", e, 2000, 0.1);
  assert.equal(r2.type, "walderpDit"); assert.ok(r2.sansAttaque && r2.multDegats === 0 && r2.dit === true && r2.consigne === 4);
  // Boucle non résolue à l'action 3 : explosion x1000 (attack(1000), sans croissance)
  const r3 = api.attaqueTitan("t5", e, 4000, 0.1);
  assert.equal(r3.type, "explosion"); assert.equal(r3.multDegats, 1000); assert.ok(r3.explosion && r3.sansCroissance);
  const r4 = api.attaqueTitan("t5", e, 6000, 0.99); assert.equal(r4.type, "puissante", "action 4 : tirage 1..4, 3-4 puissante x1,5"); proche(r4.multDegats, 1.5 * 1.04);
  // consigne : 2 devient 3 ; 3 = Attaque, 4 = Forte, 5 = Perçante, 6 = Ultime (1/5 chacune, deux fois « attaque normale »)
  for (const [h, attendu] of [[0, 3], [0.2, 3], [0.4, 4], [0.6, 5], [0.8, 6]]) {
    const x = api.neuf("t5", 1); x.hasard = suite(0.9, h); lancer("t5", x, 1, 0.1); const d = api.attaqueTitan("t5", x, 2000, 0.1); assert.equal(d.consigne, attendu, "consigne pour hasard " + h); assert.equal(d.dit, false);
  }
  // didCorrectWaldoMove : il dit -> il faut faire la consigne ; il ne dit pas -> il ne faut PAS la faire
  const dit = (consigne) => { const x = api.neuf("t5", 1); x.hasard = suite(0.1, (consigne - 1.5) / 5); lancer("t5", x, 1, 0.1); api.attaqueTitan("t5", x, 2000, 0.1); assert.equal(x.consigne, consigne); return x; };
  let x = dit(4);
  assert.ok(api.apresCoupJoueur("t5", x, 1, 100).explosion, "il dit « forte » et tu frappes en Idle (lastAttackID 1) : explosion (« cannot be idled »)");
  assert.ok(x.boucle, "la boucle reste ouverte après l'explosion (comme dans le jeu)");
  assert.equal(api.apresCoupJoueur("t5", x, 4, 100).explosion, false, "la bonne attaque ferme la boucle"); assert.ok(!x.boucle);
  assert.equal(api.apresCoupJoueur("t5", x, 1, 100).explosion, false, "hors boucle : aucun risque");
  x = dit(5); x.dit = false;
  assert.equal(api.apresCoupJoueur("t5", x, 1, 100).explosion, false, "il ne dit pas : l'Idle est correct"); assert.ok(!x.boucle);
  x = dit(5); x.dit = false;
  assert.equal(api.apresCoupJoueur("t5", x, 5, 100).explosion, true, "il ne dit pas et tu fais la consigne : explosion"); assert.equal(api.apresCoupJoueur("t5", x, 5, 1).mult, 1000);
  // boucle résolue avant l'action 3 : plus d'explosion
  x = dit(3); x.dit = false; api.apresCoupJoueur("t5", x, 1, 1);
  assert.notEqual(api.attaqueTitan("t5", x, 4000, 0.1).type, "explosion", "boucle résolue : l'action 3 est un coup ordinaire");
  assert.ok(api.apresCoupJoueur("autre", api.neuf(), 1, 1).explosion === false);
}

// ---- The Beast : aura tous les 10 actions (growCount % 10 == 3), k = 3, 4, 5, 6 ----
{
  for (const [niveau, k] of [[1, 3], [2, 4], [3, 5], [4, 6]]) {
    const e = api.neuf("t6", niveau); e.hasard = suite(0.9999);
    const r = lancer("t6", e, 3, 0.1);
    assert.equal(r.type, "aura"); assert.ok(r.sansAttaque && r.multDegats === 0); assert.equal(r.aura, k, "niveau " + niveau + " : aura maximale " + k);
  }
  let e = api.neuf("t6", 4); e.hasard = suite(0);   // 0 = aucune aura
  assert.equal(lancer("t6", e, 3, 0.1).aura, 0); assert.equal(api.facteurRegenEnnemi(e), 1);
  e.aura = 2;
  const sm = api.attaqueTitan("t6", e, 7000, 0.1); assert.equal(sm.type, "puissante"); assert.ok(sm.powerSmash); proche(sm.multDegats, 2 * 1.04, "Power Smash : tous les coups x2");
  e.aura = 0; assert.equal(api.attaqueTitan("t6", e, 9000, 0.1).type, "base"); assert.equal(api.attaqueTitan("t6", e, 11000, 0.99).type, "puissante");
  e = api.neuf("t6", 4);
  e.aura = 1; assert.equal(api.facteurRegenEnnemi(e), 5, "aura 1 : régénération de l'ennemi x5");
  e.aura = 3; proche(api.multDegatsJoueur("t6", e, 0, true), 1 / 3, "aura 3 : tes dégâts / 3 (Idle compris)"); proche(api.multDegatsJoueur("t6", e, 0, false), 1 / 3);
  e.aura = 4; assert.equal(api.dilatationCooldowns(e), 2, "aura 4 : cooldowns à moitié vitesse"); assert.equal(api.facteurIntervalleIdle(e), 2, "aura 4 : Idle à moitié vitesse");
  e.aura = 5; proche(api.apresCoupJoueur("t6", e, 1, 5000).reflete, 100, "aura 5 : tu te blesses de dégâts / 50"); assert.equal(api.apresCoupJoueur("t7", e, 1, 5000).reflete, 0, "réflexion propre à The Beast");
  e.aura = 6; assert.equal(api.regenJoueurInversee(e), true, "aura 6 : ta régénération est inversée");
  e.aura = 0; assert.ok(!api.regenJoueurInversee(e) && api.dilatationCooldowns(e) === 1 && api.facteurIntervalleIdle(e) === 1 && api.facteurRegenEnnemi(e) === 1);
}

// ---- Greasy Nerd : deux coups par action aux tours 3, 4 et 7 (mod 8) ; piratage +8 annulé par l'Ultime ----
{
  const e = api.neuf("nerd", 1);
  lancer("nerd", e, 2, 0.1);
  let r = api.attaqueTitan("nerd", e, 4000, 0.99);   // growCount 3 (le tirage du 2e coup est pris au lancement de l'action) : coup x1 puis coup tiré
  assert.equal(r.type, "gant"); proche(r.multDegats, 1.03); assert.ok(r.suite); assert.equal(r.intervalleMs, 0, "deuxième coup dans la même action");
  let s = api.attaqueTitan("nerd", e, 4000, 0.1); assert.equal(s.type, "puissante"); proche(s.multDegats, 1.5 * 1.03); assert.ok(!s.suite, "puis plus rien jusqu'à la prochaine action");
  r = api.attaqueTitan("nerd", e, 6000, 0.1);   // growCount 4 : coup x5
  assert.equal(r.type, "gantPuissant"); proche(r.multDegats, 5 * 1.04); assert.equal(api.attaqueTitan("nerd", e, 6000, 0.1).type, "base");
  lancer("nerd", e, 2, 0.1);   // actions 5 et 6 : un seul coup chacune
  assert.equal(e.file.length, 0);
  r = api.attaqueTitan("nerd", e, 12000, 0.1);   // growCount 7 : coup x1 + piratage (growCount += 8, nerdHacks)
  assert.equal(r.type, "piratage"); proche(r.multDegats, 1.07); assert.equal(e.gc, 15); assert.equal(e.nerdHacks, 1); assert.ok(r.suite);
  proche(api.attaqueTitan("nerd", e, 12000, 0.1).multDegats, 1.07, "le deuxième coup utilise le même multiplicateur (calculé avant le piratage)");
  assert.deepEqual(api.apresCoupJoueur("nerd", e, 3, 10).nerdAnnule, false, "seule l'attaque Ultime annule le piratage");
  assert.equal(api.apresCoupJoueur("nerd", e, 6, 10).nerdAnnule, true); assert.equal(e.gc, 7); assert.equal(e.nerdHacks, 0);
  assert.equal(api.apresCoupJoueur("nerd", e, 6, 10).nerdAnnule, false, "plus de piratage à annuler");
}

// ---- The Godmother : cycle de 9 ; explosions (4 coups x25 à attackRate/5) ; genou brisé (cooldowns x3) ----
{
  const e = api.neuf("godmother", 1); e.cadenceMs = 2000;
  lancer("godmother", e, 2, 0.1);
  let r = api.attaqueTitan("godmother", e, 4000, 0.1); assert.equal(r.type, "gant"); proche(r.multDegats, 1.03, "action 3 : coup x1");
  r = api.attaqueTitan("godmother", e, 6000, 0.1);   // growCount 4 : mode explosion, aucun dégât
  assert.equal(r.type, "explosionsDebut"); assert.ok(r.sansAttaque && r.suite); assert.equal(r.intervalleMs, 400, "attackRate / 5");
  for (let i = 0; i < 4; i++) { const x = api.attaqueTitan("godmother", e, 6400 + i * 400, 0.1); assert.equal(x.type, "explosionRapide"); proche(x.multDegats, 25 * 1.04, "attack(25 x croissance), growCount fixe"); assert.equal(!!x.suite, i < 3); }
  assert.equal(e.gc, 4, "growCount ne bouge pas pendant les explosions");
  lancer("godmother", e, 3, 0.1, 10000);   // actions 5, 6, 7
  r = api.attaqueTitan("godmother", e, 20000, 0.1);   // growCount 8 : coup x1 + genou brisé
  assert.equal(r.type, "genou"); proche(r.multDegats, 1.08); assert.equal(api.dilatationCooldowns(e), 3, "genou brisé : cooldowns /3");
  api.attaqueTitan("godmother", e, 22000, 0.1);   // growCount 9
  assert.equal(api.dilatationCooldowns(e), 3);
  api.attaqueTitan("godmother", e, 24000, 0.1);   // growCount 10 : % 9 == 1, fin du genou brisé
  assert.equal(api.dilatationCooldowns(e), 1);
}

// ---- The Exile : cycle L = 10, 9, 8, 7 ; aura au tour L = 3 ; tir x6 au tour suivant ----
{
  const lancerExile = (niveau, hasardAura) => { const e = api.neuf("t7", niveau); e.hasard = suite(hasardAura); lancer("t7", e, 2, 0.1); return { e, r: api.attaqueTitan("t7", e, 4000, 0.1) }; };
  let { e, r } = lancerExile(1, 0.9);   // V1 : k = 2 : toujours le bras
  assert.equal(r.type, "brasCharge"); assert.ok(r.sansAttaque); assert.equal(e.aura, 1000);
  assert.equal(api.facteurRegenEnnemi(e), 1, "le bras chargé (aura 1000) n'est pas l'aura 1 de The Beast");
  lancer("t7", e, 6, 0.1, 6000); assert.equal(e.gc, 9);
  // le tir part à growCount % L == 4 : pour L = 10, il faut atteindre 14 : sauter sur gc = 3 d'un cycle suivant n'est pas nécessaire, on teste le tir au tour 4 d'un titan V4 (L = 7)
  ({ e, r } = lancerExile(4, 0)); assert.equal(r.type, "brasCharge");
  const tir = api.attaqueTitan("t7", e, 6000, 0.1); assert.equal(tir.type, "tirBras"); proche(tir.multDegats, 6 * 1.04, "tir x6 x croissance"); assert.equal(e.aura, 0);
  ({ e, r } = lancerExile(4, 0.3)); assert.equal(r.type, "exileSaignement"); assert.equal(e.aura, 6); assert.ok(api.regenJoueurInversee(e), "aura 6 : régénération inversée jusqu'au prochain tirage");
  ({ e, r } = lancerExile(4, 0.6)); assert.equal(r.type, "exileParalysie"); assert.ok(r.paralyse && r.sansAttaque && r.paralyseMs === 2000); assert.ok(api.joueurParalyse(e, 5999) && !api.joueurParalyse(e, 6000), "paralysie de 2 s");
  assert.equal(api.attaqueTitan("t7", e, 5000, 0.1).type, "base", "pas de ré-attaque pendant la paralysie qui ne dépende de ce tour");
  ({ e, r } = lancerExile(4, 0.9)); assert.equal(r.type, "succion"); proche(r.multDegats, 2 * 1.03); proche(r.soinEnnemi, 0.1, "il se soigne de 10 % de ses PV max");
  // V2 : k = 3 (aura 1 ou 2 seulement, jamais la paralysie)
  for (const h of [0, 0.3, 0.6, 0.99]) { ({ r } = lancerExile(2, h)); assert.ok(["brasCharge", "exileSaignement"].includes(r.type), "V2 : pas de paralysie ni de succion (hasard " + h + ")"); }
  for (const h of [0, 0.3, 0.6, 0.99]) { ({ r } = lancerExile(3, h)); assert.notEqual(r.type, "succion", "V3 : pas de succion"); }
  // tirage ordinaire : 1-3 base, 4 puissante
  const o = api.neuf("t7", 1); assert.equal(api.attaqueTitan("t7", o, 0, 0.7).type, "base"); assert.equal(api.attaqueTitan("t7", o, 2000, 0.8).type, "puissante");
}

// ---- IT HUNGERS : invincible sans Glop (+400 par attaque) ; avec Glop : vulnérable, une charge par attaque ----
{
  let e = api.neuf("hungers", 1);
  let r = api.attaqueTitan("hungers", e, 0, 0.1);
  assert.equal(r.type, "devore"); proche(r.multDegats, 1.01); assert.equal(e.gc, 401); assert.ok(e.invincible); assert.ok(r.invincibleDebut);
  assert.equal(api.multDegatsJoueur("hungers", e, 0), 0, "invincible sans Glop");
  proche(api.attaqueTitan("hungers", e, 2000, 0.99).multDegats, 1 + 402 / 100, "toujours x1 (jamais de puissante) avec growCount qui monte de 400 par attaque");
  e = api.neuf("hungers", 1); e.glopStock = 1;
  r = api.attaqueTitan("hungers", e, 0, 0.1); assert.equal(r.type, "base"); assert.equal(e.glopCount, 4, "Glop consommé : +5 tours, une charge par attaque"); assert.equal(e.glopStock, 0); assert.ok(!e.invincible);
  assert.equal(api.multDegatsJoueur("hungers", e, 0), 1, "vulnérable avec Glop");
  assert.equal(api.attaqueTitan("hungers", e, 2000, 0.8).type, "puissante", "tirage 1..5 : 4-5 puissante");
  lancer("hungers", e, 3, 0.1, 4000); assert.equal(e.glopCount, 0);
  assert.equal(api.attaqueTitan("hungers", e, 10000, 0.1).type, "devore", "plus de Glop : invincible de nouveau"); assert.ok(e.invincible);
}

// ---- Rock Lobster : seulement la puissante (tirage 0..4 : 3-4 puissante) ----
{
  const e = api.neuf("lobster", 2);
  assert.deepEqual([0.0, 0.25, 0.45, 0.65, 0.85].map((t, i) => api.attaqueTitan("lobster", e, i * 2000, t).type), ["base", "base", "base", "puissante", "puissante"]);
  proche(api.attaqueTitan("lobster", api.neuf("lobster", 1), 0, 0.99).multDegats, 1.5 * 1.01);
}

// ---- AMALGAMATE : débuff d'attaque (v >= 2), paralysie 4 s, désactivation (v >= 3), anneau d'Apathie (v = 4) ----
{
  let e = api.neuf("amalgamate", 1);
  lancer("amalgamate", e, 2, 0.1);
  let r = api.attaqueTitan("amalgamate", e, 4000, 0.1); assert.equal(r.type, "base", "v = 1 : rien au tour 3");
  e = api.neuf("amalgamate", 2); lancer("amalgamate", e, 2, 0.1);
  r = api.attaqueTitan("amalgamate", e, 4000, 0.1); assert.equal(r.type, "affaiblit"); assert.ok(r.sansAttaque);
  proche(api.multDegatsJoueur("amalgamate", e, 5000), 1 / 1.69, "deux debuffAttack(1,3) : tes dégâts manuels / 1,69"); assert.equal(api.multDegatsJoueur("amalgamate", e, 5000, true), 1, "l'Idle l'ignore");
  proche(api.multDegatsJoueur("amalgamate", e, 16000), 1 / 1.3, "à l'échéance (12 s) le facteur n'est rendu qu'UNE fois (EnemyAI/PlayerController::Update : offenseDebuffFactor *= atkDebuff) : un résidu de 1/1,3 reste");
  lancer("amalgamate", e, 6, 0.1, 6000);   // actions 4 à 9
  r = api.attaqueTitan("amalgamate", e, 20000, 0.1);   // growCount 10 : paralysie 4 s
  assert.equal(r.type, "amalgamParalysie"); assert.ok(r.paralyse && r.sansAttaque && r.paralyseMs === 4000); assert.ok(api.joueurParalyse(e, 23999) && !api.joueurParalyse(e, 24000));
  e = api.neuf("amalgamate", 3); lancer("amalgamate", e, 14, 0.1);
  r = api.attaqueTitan("amalgamate", e, 40000, 0.1); assert.equal(e.gc, 15);
  assert.equal(r.type, "chemise"); assert.equal(r.desactive, "ultimate"); assert.ok(api.competenceDesactivee("amalgamate", e, "ultimate"), "v = 3 : désactive une capacité au tour 15");
  e = api.neuf("amalgamate", 2); lancer("amalgamate", e, 14, 0.1); assert.equal(api.attaqueTitan("amalgamate", e, 40000, 0.1).type, "base", "v = 2 : pas de désactivation");
  // v = 4 : sans anneau, comme UUG
  e = api.neuf("amalgamate", 4);
  r = api.attaqueTitan("amalgamate", e, 0, 0.1); proche(r.multDegats, 1.01); assert.equal(e.gc, 802, "(1 + 400) x 2"); assert.ok(e.invincible && r.invincibleDebut);
  assert.equal(api.multDegatsJoueur("amalgamate", e, 1), 0, "invincible sans l'Anneau d'Apathie");
  e = api.neuf("amalgamate", 4); e.anneau = 50;
  r = api.attaqueTitan("amalgamate", e, 0, 0.1); proche(r.multDegats, 1.01); assert.equal(e.gc, Math.ceil((1 + 100 - 50) * (2 - 50 / 100)), "anneau de niveau 50 : n = ceil((n + 100 - L) x (2 - L/100))"); assert.equal(api.multDegatsJoueur("amalgamate", e, 1), 1);
  e = api.neuf("amalgamate", 4); e.anneau = 100; lancer("amalgamate", e, 3, 0.1); assert.equal(e.gc, 3, "anneau 100 : seulement +1 par attaque");
}

// ---- Tippi : nuée de rats (le lancement n'attaque pas, ni l'action suivante ; puis 10 coups x0,45 à attackRate x 0,15) ----
{
  const e = api.neuf("tippi", 1); e.cadenceMs = 2000;
  for (let i = 0; i < 9; i++) assert.equal(api.attaqueTitan("tippi", e, i * 2000, 0.99).type, "base", "rats : pas avant 10 actions (tirage 5 = base)");
  let r = api.attaqueTitan("tippi", e, 18000, 0.99); assert.equal(r.type, "rats"); assert.ok(r.sansAttaque); assert.equal(e.skip, -1);
  r = api.attaqueTitan("tippi", e, 20000, 0.1); assert.equal(r.type, "ratsDebut"); assert.ok(r.sansAttaque && r.suite); assert.equal(r.intervalleMs, 300, "attackRate x 0,15"); assert.equal(e.gc, 11);
  let n = 0; while (true) { const x = api.attaqueTitan("tippi", e, 20300 + n * 300, 0.1); assert.equal(x.type, "rat"); proche(x.multDegats, 0.45 * 1.11, "x0,45 x croissance (growCount fixe)"); n++; if (!x.suite) break; }
  assert.equal(n, 10);
  assert.equal(api.attaqueTitan("tippi", e, 24000, 0.99).type, "base", "après la nuée : encore 10 actions avant la suivante");
  const f = api.neuf("tippi", 1);
  assert.deepEqual([0, 0.3, 0.5, 0.65, 0.7, 0.84].map((t, i) => api.attaqueTitan("tippi", f, i * 2000, t).type), ["base", "base", "base", "base", "puissante", "base"], "tirage 0..5 : 0-3 base, 4 puissante (5 = rats seulement si 10 actions)");
}

// ---- The Traitor : tirage 0..8 (0-3 base, 4 puissante, 5 super x2, 6 PV à 20 %, 7 bouclier, 8 croissance) ----
{
  const t = (e, u, now = 0) => api.attaqueTitan("traitor", e, now, (u + 0.5) / 9);
  let e = api.neuf("traitor", 1);
  assert.deepEqual([0, 1, 2, 3].map((u) => t(e, u).type), ["base", "base", "base", "base"]);
  assert.equal(t(e, 4).type, "puissante"); let r = t(e, 5); assert.equal(r.type, "super"); proche(r.multDegats, 2 * 1.06, "SUPER x2");
  e.pv = { cur: 1000, max: 1000 };
  r = t(e, 6); assert.equal(r.type, "reductionPV"); assert.ok(r.sansAttaque); assert.equal(r.pvJoueurFraction, 0.2);
  e.pv = { cur: 200, max: 1000 }; assert.equal(t(e, 6).type, "base", "déjà à 20 % ou moins : coup de base");
  r = t(e, 7); assert.equal(r.type, "bouclier"); assert.equal(e.bouclierCoups, 2); assert.ok(r.sansAttaque);
  assert.equal(api.multDegatsJoueur("traitor", e, 0), 0, "le bouclier annule tes coups");
  assert.equal(api.apresCoupJoueur("traitor", e, 1, 0).bouclierConsomme, true); assert.equal(e.bouclierCoups, 1);
  assert.equal(api.multDegatsJoueur("traitor", e, 0), 0); api.apresCoupJoueur("traitor", e, 3, 0); assert.equal(e.bouclierCoups, 0); assert.equal(api.multDegatsJoueur("traitor", e, 0), 1, "deux coups absorbés puis plus rien");
  t(e, 7); t(e, 7); t(e, 7); assert.equal(e.bouclierCoups, 6); assert.equal(t(e, 7).type, "base", "déjà plus de 5 : coup de base");
  const avant = e.gc; assert.equal(t(e, 8).type, "accelere"); assert.equal(e.croissanceRythme, 2); assert.equal(e.gc, avant + 1);
  const apres = e.gc; t(e, 0); assert.equal(e.gc, apres + 2, "growCount += growRate : la croissance accélère pour de bon");
  t(e, 8); const g = e.gc; t(e, 0); assert.equal(e.gc, g + 3);
}

// ---- Branchement dans le combat ----
const combat = readFileSync("cloudflare/public/modules/ui-combat-2-v1.js", "utf8");
const aventure = readFileSync("cloudflare/public/modules/ui-aventure-1-v1.js", "utf8");
assert.ok(combat.includes("neuf(fight.titanId,window.SorealTitanComportementsV1.niveauDeDifficulte(fight.titanTier))") && combat.includes("REG.idleTitanEtatV1.cadenceMs=intervalleAttaqueEnnemiAdventureIdleV2_(fight)"), "niveau (difficulté) et cadence donnés à l'IA");
assert.ok(combat.includes("if(att.sansAttaque){modifie=true;evenements+=1;continue;}") && combat.includes("fxTypeAttaque=journalCapaciteTitanIdleV1_(fight,att,attTitan)||fxTypeAttaque;"), "les tours sans attaque ne frappent pas (ni blocage ni parade consommés)");
assert.ok(combat.includes("titanApresCoupJoueurIdleV1_(fight,1,degats,momentEvenement)") && aventure.includes("({parry:2,regular:3,strong:4,piercing:5,ultimate:6})[def&&def.id]||3"), "identifiants de coup du jeu : Idle 1, Parade 2, Attaque 3, Forte 4, Perçante 5, Ultime 6");
assert.ok(combat.includes("facteurIntervalleIdle(REG.idleTitanEtatV1)") && combat.includes("dilatationCooldowns(REG.idleTitanEtatV1)"), "aura 4 / genou : Idle et cooldowns ralentis");
assert.ok(aventure.includes("regenJoueurInversee(etatTitanRegen)") && aventure.includes("facteurRegenEnnemi(etatTitanRegen)"), "aura 6 et aura 1 dans la régénération");
assert.ok(ui.includes("function titanApresCoupJoueurIdleV1_(") && ui.includes("api.apresCoupJoueur(fight.titanId,e,attaqueId,degats)") && ui.includes("out.explosion"), "réflexion, piratage annulé, bouclier et explosion de Walderp après chaque coup du joueur");
assert.ok(combat.includes("fight.titanId==='t4'||fight.titanId==='amalgamate'"), "l'Anneau d'Apathie compte pour UUG et AMALGAMATE");
console.log("idle-titans-capacites-5-a-14-v1: OK");
