import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { normalizeIdleNguState, applyIdleNguAction } from "../src/idle-ngu-progression.js";
import { IDLE_DAILY_SPIN_REWARDS_V1, IDLE_DAILY_SPIN_JACKPOTS_V1, dailySpinTableAffichageV1, dailySpinSnapshotV1 } from "../src/idle-ngu-snapshot.js";

/*
 * Roue journalière refaite (Norman, 2026-10-31) : un secteur par récompense réelle, largeur = poids réel du moteur, le MOTEUR tire puis la roue s'arrête sur son résultat,
 * aucun aléa côté client, mouvement réduit. Exception anti-spoil validée : toutes les récompenses sont montrées.
 */
const roueJs = readFileSync("cloudflare/public/modules/roue-journaliere-v1.js", "utf8");
const page = readFileSync("cloudflare/public/modules/money-pit-page-v1.js", "utf8");
const meta = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-itopod.css", "utf8");
const html = readFileSync("cloudflare/public/index.html", "utf8");

// ---------- 1. Moteur : la table exposée est EXACTEMENT celle du tirage ----------
for (let tier = 0; tier < IDLE_DAILY_SPIN_REWARDS_V1.length; tier++) {
  const t = dailySpinTableAffichageV1(tier);
  const source = IDLE_DAILY_SPIN_REWARDS_V1[tier];
  assert.equal(t.length, source.length, "un élément par récompense, palier " + tier);
  assert.ok(Math.abs(t.reduce((s, e) => s + e.poids, 0) - 100) < 1e-9, "la table du palier " + tier + " totalise 100 %");
  t.forEach((e, i) => {
    assert.equal(e.poids, source[i].poids, "poids réel inchangé");
    if (source[i].items) assert.deepEqual(e.items, source[i].items);
    else assert.equal(e.ap || e.seeds, source[i].ap || source[i].seeds);
  });
}
// Le Jackpot détaille son contenu réel (JACKPOTS du moteur)
assert.deepEqual(dailySpinTableAffichageV1(3).find(e => e.items && Object.keys(e.items).length > 1).items, IDLE_DAILY_SPIN_JACKPOTS_V1[3]);
assert.deepEqual(dailySpinTableAffichageV1(7).find(e => e.items && Object.keys(e.items).length > 1).items, IDLE_DAILY_SPIN_JACKPOTS_V1[7]);
assert.equal(dailySpinTableAffichageV1(5).length, 16);

// Les pourcentages n'ont PAS bougé (valeurs du wiki, paliers 0 et 5)
assert.deepEqual(dailySpinTableAffichageV1(0), [{ poids: 70, ap: 50 }, { poids: 30, ap: 100 }]);
assert.deepEqual(dailySpinTableAffichageV1(5).slice(0, 4).map(e => e.poids), [36, 25, 10, 2]);

// ---------- 2. Moteur : le tirage renvoie le rang du secteur, la roue ne tire rien ----------
const ctx = { bosses: 100 };
function spin(totalSpins, random) {
  const s = normalizeIdleNguState({}, ctx, 1_000_000);
  s.systems.dailySpin.unlocked = true;
  s.systems.dailySpin.data.totalSpins = totalSpins;
  s.systems.dailySpin.data.readyAt = 0;
  const old = Math.random;
  Math.random = () => random;
  try { return applyIdleNguAction(s, { action: "collect", system: "dailySpin" }, ctx, 10_000_000); } finally { Math.random = old; }
}
for (const [spins, r] of [[0, 0.1], [0, 0.9], [7, 0.995], [30, 0.9925], [30, 0.9999], [365, 0.5], [365, 0.97]]) {
  const res = spin(spins, r);
  const table = dailySpinTableAffichageV1(res.result.tier);
  assert.ok(res.result.secteur >= 0 && res.result.secteur < table.length, "rang du secteur renvoyé");
  const e = table[res.result.secteur];
  if (e.items) assert.deepEqual(res.result.reward.items, e.items, "le secteur est celui du lot");
  else if (e.seeds) assert.equal(res.result.reward.seeds, e.seeds);
  else assert.ok(res.result.reward.ap >= e.ap, "AP : montant nominal du secteur, bonus d'AP compris");
  assert.equal(res.state.systems.dailySpin.data.history[0].secteur, res.result.secteur, "le rang est gardé dans l'historique");
  // le snapshot expose la table du palier courant (+ celle du dernier tour si le palier a changé)
  const sn = dailySpinSnapshotV1(res.state);
  assert.deepEqual(sn.table, dailySpinTableAffichageV1(sn.tier));
}
{
  const res = spin(6, 0.5); // 6 -> 7 tours : le palier passe de 0 à 1
  const sn = dailySpinSnapshotV1(res.state);
  assert.equal(sn.tier, 1);
  assert.equal(sn.derniere.tier, 0, "la roue figée « déjà tourné » retrouve la table du palier du dernier tour");
}

// ---------- 3. Client : le vrai module sur un faux navigateur ----------
function monter(reduit) {
  const file = [];
  const appels = [];
  const gen = { rafraichi: 0 };
  const win = {
    __SOREAL_IDLE_META_HOST_V130__: { getIdleEtat: () => ({}), rafraichirMenuRacineIdleV28_: () => { gen.rafraichi++; } },
    __collecterSystemeMetaIdleV130__: (id) => appels.push(id),
    __SOREAL_IDLE_HEURE_V1__: () => 5_000_000,
    matchMedia: () => ({ matches: Boolean(reduit) }),
  };
  win.window = win;
  const ctxVm = { window: win, document: { querySelector: () => null }, requestAnimationFrame: (f) => { file.push(f); return file.length; }, setTimeout: () => 0, clearTimeout() {}, console, Date, Math: Object.assign(Object.create(Math), { random() { throw new Error("aléa côté client interdit"); } }) };
  vm.createContext(ctxVm);
  vm.runInContext(roueJs, ctxVm);
  return { RO: win.__SOREAL_IDLE_ROUE_V1__, win, file, appels, gen };
}
const table5 = dailySpinTableAffichageV1(5);
const st = { data: { readyAt: 0, totalSpins: 120, history: [] } };
const j = { systemes: { roueJournaliere: { tier: 5, table: table5, derniere: null } } };
{
  const { RO, file, appels, win } = monter(false);
  const liste = RO.secteurs(table5);
  assert.equal(liste.length, table5.length, "un secteur par récompense");
  assert.ok(Math.abs(liste.reduce((s, x) => s + x.ang, 0) - 360) < 1e-9, "somme des secteurs = 360°");
  liste.forEach((x, i) => assert.ok(Math.abs(x.ang - table5[i].poids * 3.6) < 1e-9, "largeur proportionnelle au poids réel"));
  assert.ok(liste.every((x) => x.name && x.icon), "chaque secteur a son libellé et son icône, même pour les systèmes pas encore débloqués");
  assert.ok(liste.some((x) => x.jackpot && x.jackpot.includes("Potion Energy α")), "le Jackpot détaille son contenu réel");

  const h = RO.rendreCarte(st, j, "<button>BOUTON</button>");
  assert.equal((h.match(/class="rb-sect/g) || []).length, table5.length, "la roue dessine un secteur par récompense");
  assert.equal((h.match(/class="rb-leg[ "]/g) || []).length, table5.length, "la légende les liste toutes");
  assert.ok(h.includes("0,5 %") && h.includes("36 %"), "pourcentages réels dans la légende");
  assert.ok(!/Bonus<\/span>|\?\?\?|verrouill/i.test(h), "aucun secteur générique ni masqué (exception anti-spoil validée)");

  // Flux : le MOTEUR d'abord. Au clic : demande envoyée, la roue n'a pas bougé.
  RO.lancer();
  assert.deepEqual(appels, ["dailySpin"], "clic -> opération du moteur");
  assert.equal(RO.enCours(), true);
  assert.equal(file.length, 0, "aucune rotation avant la réponse du moteur");
  assert.equal(RO.recevoir({ secteur: -5, reward: {}, readyAt: 1 }, () => {}), false, "résultat inexploitable : la roue se libère");
  assert.equal(RO.enCours(), false);

  RO.rendreCarte(st, j, "<button/>");
  RO.lancer();
  let fini = 0;
  const k = 11; // le secteur « 10 × Caca » ou voisin : peu importe, la roue doit s'arrêter exactement sur ce secteur
  assert.equal(RO.recevoir({ secteur: k, tier: 5, reward: { items: table5[k].items }, readyAt: 99_000_777 }, () => { fini++; }), true);
  assert.equal(file.length, 1, "la roue démarre à la réponse du moteur");
  const durees = [];
  let t = 1000;
  while (file.length) { const f = file.shift(); durees.push(t); f(t); t += 100; if (durees.length > 200) break; }
  assert.ok(durees.length >= 40 && durees.length <= 60, "environ 4,2 s d'animation");
  assert.equal(RO.enCours(), false, "l'état d'animation est libéré à l'arrêt");
  assert.equal(fini, 1, "l'annonce du lot ne part qu'à l'arrêt de la roue");
  // la roue figée (déjà tourné) est au bon angle : le pointeur (en haut) est dans le secteur du lot
  const stFini = { data: { readyAt: 99_000_777, totalSpins: 121, history: [{ at: 1, tier: 5, secteur: k, reward: { items: table5[k].items } }] } };
  const jFini = { systemes: { roueJournaliere: { tier: 5, table: table5, derniere: null } } };
  const carte = RO.rendreCarte(stFini, jFini, "<button/>");
  const m = carte.match(/class="rb-rot" style="[^"]*rotate\(([-\d.]+)deg\)/);
  const rot = Number(m[1]);
  const phi = ((-rot % 360) + 360) % 360;
  assert.ok(phi >= liste[k].a0 - 1e-6 && phi < liste[k].a1 + 1e-6, "arrêt sur le secteur du résultat");
  assert.ok(new RegExp('rb-sect rb-gagne" data-i="' + k + '"').test(carte), "le secteur gagnant est marqué");
  assert.ok(carte.includes("rb-fini"), "les autres secteurs s'estompent");
  // même état après un rechargement : même angle (aucun hasard)
  const m2 = monter(false).RO.rendreCarte(stFini, jFini, "<button/>").match(/rotate\(([-\d.]+)deg\)/);
  assert.ok(Math.abs(Number(m2[1]) - rot) < 1e-6 || Math.abs(Math.abs(Number(m2[1]) - rot) - 360) < 1e-6, "arrêt déterministe");
  void win;
}
// Un secteur étroit (0,5 %) : la roue s'arrête quand même dessus
{
  const { RO, file } = monter(false);
  RO.rendreCarte(st, j, "<b/>");
  RO.lancer();
  const dernier = table5.length - 1; // 100 000 AP à 0,5 %
  RO.recevoir({ secteur: dernier, reward: { ap: 100000 }, readyAt: 99_000_009 }, () => {});
  let t = 0;
  while (file.length) { file.shift()(t); t += 100; if (t > 20000) break; }
  const carte = RO.rendreCarte({ data: { readyAt: 99_000_009, totalSpins: 121, history: [{ at: 1, tier: 5, secteur: dernier, reward: { ap: 100000 } }] } }, j, "<b/>");
  const phi = ((-Number(carte.match(/rotate\(([-\d.]+)deg\)/)[1]) % 360) + 360) % 360;
  const s = RO.secteurs(table5)[dernier];
  assert.ok(phi >= s.a0 && phi <= s.a1, "arrêt sur un secteur de 0,5 %");
}
// Mouvement réduit : plus de tours, la roue s'arrête tout de suite, le lot est annoncé
{
  const { RO, file } = monter(true);
  RO.rendreCarte(st, j, "<b/>");
  RO.lancer();
  let fini = 0;
  RO.recevoir({ secteur: 2, reward: { ap: 8000 }, readyAt: 5 }, () => { fini++; });
  assert.equal(file.length, 0, "aucune animation en mouvement réduit");
  assert.equal(fini, 1);
  assert.equal(RO.enCours(), false);
}
// Réponse du moteur en erreur : la roue ne reste pas bloquée
{
  const { RO } = monter(false);
  RO.rendreCarte(st, j, "<b/>");
  RO.lancer();
  assert.equal(RO.enCours(), true);
  RO.echec();
  assert.equal(RO.enCours(), false);
}
// Rien n'est tiré côté client
assert.ok(!/Math\.random/.test(roueJs), "aucun aléa dans la roue");
assert.ok(/window\.__lancerRoueIdleV1__=lancer/.test(roueJs));

// ---------- 4. Branchements ----------
assert.ok(page.includes("RO.rendreCarte(roueSt,j,boutonRoue)") && page.includes("RO.stAvant()"), "la page utilise la roue ; pendant le tour tout l'affichage lié au tour reste « avant »");
assert.ok(!page.includes("TABLE DES RÉCOMPENSES") && !/recompensesDailySpinTier/.test(page), "l'ancienne table incomplète (AP et graines seulement) est remplacée par la légende");
assert.ok(!page.includes("sans effet)"), "Beast Butter et MacGuffin Muffin ont un vrai effet (depuis le 2026-09-23)");
assert.ok(meta.includes("window.__SOREAL_IDLE_ROUE_V1__.recevoir(res.resultat,annonceRoueV1)"), "le lot est annoncé quand la roue s'arrête");
assert.ok(/'collect'&&payload\.system==='dailySpin'&&window\.__SOREAL_IDLE_ROUE_V1__\)window\.__SOREAL_IDLE_ROUE_V1__\.echec\(\)/.test(meta), "réponse refusée : la roue se libère");
assert.ok(html.indexOf("roue-journaliere-v1.js") > 0 && html.indexOf("roue-journaliere-v1.js") < html.indexOf("money-pit-page-v1.js"), "script de la roue chargé avant la page");
assert.ok(roueJs.includes("__SOREAL_IDLE_APRES_REDESSIN_V1__"), "règle n°4 : l'angle est remis juste après chaque redessin");
assert.ok(roueJs.includes("moneyPit") && /rafraichirMenuRacineIdleV28_/.test(roueJs));

// ---------- 5. Règle n°3 et mouvement réduit (CSS) ----------
assert.ok(/@keyframes rbHalo\{0%,100%\{opacity:\.25\}50%\{opacity:1\}\}/.test(css), "halo : mêmes valeurs à 0 % et 100 %");
assert.ok(/@keyframes rbAmp\{0%,100%\{opacity:1\}50%\{opacity:\.35\}\}/.test(css), "ampoules : boucle parfaite");
assert.ok(/prefers-reduced-motion:reduce\)\{\.rb-svg \.rb-gagne \.rb-halo,\.rb-svg \.rb-ampoule,\.rb-bouton\.rb-dispo\{animation:none\}\.rb-svg \.rb-gagne \.rb-halo\{opacity:1\}/.test(css), "mouvement réduit : halo fixe");
assert.ok(css.includes(".mp2-grille-v1>.rb-roue{grid-column:2;grid-row:1;align-self:start}"), "sur PC la roue est à droite de l'image du trou (même largeur de colonne), sur la même ligne");
assert.ok(css.includes("--mp2-titre") && css.includes(".rb-titre{font-family:var(--mp2-titre"), "polices du jeu");
// le Trou sans fond n'est pas touché
assert.ok(css.includes(".mp3-titre-nom") && page.includes("/trou/trou-sans-fond-v1.webp") && page.includes("__jeterOrSalveV1__"), "cadre du trou, titre et salve d'or intacts");

console.log("idle-roue-journaliere-v1: OK");
