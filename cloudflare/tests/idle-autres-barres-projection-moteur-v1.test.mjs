import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { pathToFileURL } from "node:url";

const { runSorealIdleOperation } = await import(pathToFileURL(process.cwd() + "/cloudflare/src/idle-sqlite-runtime.js").href);
const { SorealIdleCoordinatorV1 } = await import(pathToFileURL(process.cwd() + "/cloudflare/src/index-idle-coordinator-v1.js").href);
const HEADERS = readFileSync("cloudflare/tests/idle-augmentations-audit-v1.test.mjs", "utf8").split("\n").find((l) => l.startsWith("const HEADERS"));

/* Horloge GELÉE : seul T la fait avancer (jamais le temps réel). */
let T = 1.9e12;
Date.now = () => T;

/*
 * Norman (2026-11-05, plan design/PLAN-MOTEUR-UNIQUE.md) : après la Machine temporelle et les Augmentations, même revue pour Barbes, Hacks, Souhaits et Yggdrasil.
 *
 * CONSTAT (lu dans le code, vérifié ci-dessous par la section A) : ces quatre systèmes N'ONT AUCUNE PROJECTION côté écran. L'écran ne fait que PEINDRE la valeur du moteur reçue à la dernière synchro
 * (tous les menus vivants se resynchronisent toutes les 4 s, ui-boucle-v1.js « idleMenuViveSyncV1 ») :
 *   - Souhaits : wishes-page-v1.js peint `sl.progress` (barre scaleX) et `sl.secondsRemaining` / `sl.secondsPerLevel` tels que le moteur les calcule (wishSlotsSnapshotV1) ;
 *   - Barbes / Hacks : pageSystemeMetaIdleV130_ (meta-progression-v130.js) peint `level + tempLevel + permanentLevel` du moteur, sans barre de progression calculée ;
 *   - Yggdrasil : yggdrasil-diggers-page-v1.js et yggdrasil-elfes-v1.js peignent `growthHours` du moteur ; seul le bouton « Activer » est rafraîchi toutes les 500 ms (énergie libre, pas une barre) ;
 *   - 3e ressource (r3) : le bandeau peint resources.r3.current du moteur (ui-magie-energie-v1.js) ; la projection énergie/magie de ui-boucle-v1.js (R.projeter) ne la concerne pas.
 * Il n'y a donc pas de « formule de l'écran » à comparer au moteur : l'écran ne peut pas reculer par désaccord de formule. Reste à prouver que le MOTEUR est indépendant du rythme des synchros (sinon deux
 * synchros rapprochées ne donneraient pas la même barre qu'une seule) et qu'il ne recule jamais : sections B à E. Section F : la règle du wiki (50 niveaux par seconde au plus).
 *
 * DIVERGENCES CONNUES (documentées, ce test reste vert) : voir le bloc « DIVERGENCES » en bas de ce fichier ; les nombres sont calculés par le test, pas écrits à la main.
 */

function partie() {
  const db = new DatabaseSync(":memory:");
  const sql = { exec(q, ...b) { const st = db.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return st.all(...b); st.run(...b); return []; } };
  db.exec("CREATE TABLE IF NOT EXISTS legacy_rows(source_key TEXT,row_index INTEGER,values_json TEXT,imported_at INTEGER)");
  new SorealIdleCoordinatorV1({ storage: { sql } }, {});
  for (let i = 0; i < 15; i += 1) sql.exec("INSERT INTO migration_sources(source_key,status) VALUES(?,?)", "idle:s" + i, "DONE");
  const HEAD = JSON.parse(HEADERS.slice(HEADERS.indexOf("=") + 1).trim().replace(/;$/, ""));
  sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", "JOUEURS", 1, JSON.stringify(HEAD), Date.now());
  [["Type", "CoutBase", "Croissance", "BonusParNiveau"], ["production", 20, 1.6, 1], ["capacite", 20, 1.6, 1], ["puissance", 20, 1.6, 1]].forEach((l, i) => sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", "IDLE_BOUTIQUE", i + 1, JSON.stringify(l), Date.now()));
  const user = { slot: "b", email: "technicien.soreal@gmail.com", emailConnexion: "technicien.soreal@gmail.com", emails: ["technicien.soreal@gmail.com"], prenom: "Norman" };
  const run = (op, ...a) => runSorealIdleOperation(sql, op, ["local", ...a], user);
  run("obtenirEtatSorealIdle");
  const ligne = sql.exec("select rowid as id,row_json from idle_catalog where sheet_name='JOUEURS' and row_index>1")[0];
  const arr = JSON.parse(ligne.row_json);
  arr[14] = 140; arr[4] = 50000; arr[5] = 100000; arr[6] = 0;
  const st = JSON.parse(arr[37] || "{}");
  st.metaNgu.currencies = st.metaNgu.currencies || {};
  st.metaNgu.currencies.gold = 1e15;
  arr[37] = JSON.stringify(st);
  db.prepare("update idle_catalog set row_json=? where rowid=?").run(JSON.stringify(arr), ligne.id);
  run("synchroniserSorealIdle");
  run.__db = db; run.__sql = sql; return run;
}
const agir = (run, p) => { const r = run("agirProgressionSorealIdle", p); assert.ok(r && r.ok !== false, "action " + JSON.stringify(p) + " refusée : " + JSON.stringify(r).slice(0, 200)); return r; };
/* Banc d'essai : tous les systèmes ouverts ; `retouche(st.metaNgu)` règle les statistiques des ressources (puissance, cap) et les graines. */
function creer(retouche) {
  const run = partie();
  run("preparerPartieTestSorealIdle", { boss: 140, or: 1e15, systemes: true, energieCap: 1e12, energiePuissance: 1e3, energie: 1e12, magieCap: 1e12, magiePuissance: 1e3, magie: 1e12 });
  const ligne = run.__sql.exec("select rowid as id,row_json from idle_catalog where sheet_name='JOUEURS' and row_index>1")[0];
  const arr = JSON.parse(ligne.row_json); const st = JSON.parse(arr[37]);
  for (const k of Object.keys(st.metaNgu.systems)) st.metaNgu.systems[k].unlocked = true;
  if (retouche) retouche(st.metaNgu);
  arr[37] = JSON.stringify(st);
  run.__db.prepare("update idle_catalog set row_json=? where rowid=?").run(JSON.stringify(arr), ligne.id);
  run("synchroniserSorealIdle");
  return run;
}
const sync = (run) => run("synchroniserSorealIdle").joueur.systemes;
const systeme = (S, id) => S.systems.find((x) => x.id === id).state.data;

/* ------------------------------------------------------------------------------------------------------------------------------------------------ */
/* A. L'écran ne projette rien : on le prouve en lisant ses sources (une projection apparaîtrait comme un rejeu / une horloge / un calcul de durée).   */
/* ------------------------------------------------------------------------------------------------------------------------------------------------ */
const lire = (f) => readFileSync("cloudflare/public/modules/" + f, "utf8");
const pageSouhaits = lire("wishes-page-v1.js");
const pageYgg = lire("yggdrasil-diggers-page-v1.js");
const elfes = lire("yggdrasil-elfes-v1.js");
const pageMeta = lire("meta-progression-v130.js");
const boucle = lire("ui-boucle-v1.js");
for (const [nom, src] of [["wishes-page-v1.js", pageSouhaits], ["yggdrasil-diggers-page-v1.js", pageYgg], ["yggdrasil-elfes-v1.js", elfes]]) {
  assert.ok(!/rejouer|projeter|__SOREAL_IDLE_HEURE_V1__|Date\.now\(\)\s*-\s*[a-zA-Z_.]*(sync|Sync|ancre|Ancre)/.test(src), nom + " : aucune projection de progression (ni rejeu, ni horloge de synchro)");
}
assert.ok(/sl\.progress/.test(pageSouhaits) && /scaleX\('\+\(pct\/100\)/.test(pageSouhaits), "Souhaits : la barre peint sl.progress du moteur");
assert.ok(/sl\.secondsRemaining/.test(pageSouhaits) && !/sl\.secondsRemaining\s*[-*/+]/.test(pageSouhaits), "Souhaits : le temps restant est celui du moteur, sans calcul");
assert.ok(/f\.growthHours/.test(pageYgg) && /f\.growthHours/.test(elfes) || /growthHours/.test(elfes), "Yggdrasil : la croissance peinte est growthHours du moteur");
assert.ok(!/growthHours\s*[+*]=|growthHours\s*\+\s*\(?\s*\(?\s*Date/.test(pageYgg + elfes), "Yggdrasil : l'écran n'avance jamais la croissance lui-même");
/* La projection de ui-boucle-v1.js ne concerne que l'énergie, la magie et les Augmentations. */
assert.ok(!/R\.projeter\([^)]*r3/.test(boucle), "la projection énergie/magie ne touche pas la 3e ressource");
assert.ok(!/(beards|hacks|wishes|yggdrasil)/.test(boucle.replace(/\/\*[\s\S]*?\*\//g, "")), "ui-boucle-v1.js : aucun de ces quatre systèmes dans la boucle de projection (hors commentaires)");
/* Barbes et Hacks : pas de barre de progression calculée par la page générique. */
assert.ok(!/st\.progress/.test(pageMeta.slice(pageMeta.indexOf("function rendrePistesSystemeMetaIdleV131_"), pageMeta.indexOf("function rendrePistesSystemeMetaIdleV131_") + 2500)), "Barbes / Hacks : la page des pistes ne dessine aucune barre calculée");

/* ------------------------------------------------------------------------------------------------------------------------------------------------ */
/* Aides de mesure. position = niveau + fraction (monotone si la barre n'a jamais reculé).                                                              */
/* ------------------------------------------------------------------------------------------------------------------------------------------------ */
const pos = (niv, frac) => ({ niv, frac, pos: niv + frac });
const posBarbe = (id) => (S) => { const t = systeme(S, "beards").tracks[id]; return pos(t.tempLevel, t.progress); };
const posHack = (id) => (S) => { const t = systeme(S, "hacks").tracks[id]; return pos(t.level, t.progress); };
const posSouhait = (id) => (S) => { const t = systeme(S, "wishes").tracks[id]; return pos(t.level, t.progress); };
const posYgg = (id) => (S) => { const f = systeme(S, "yggdrasil").fruits[id]; return pos(0, f.growthHours); };
const divergences = [];
const noter = (nom, texte) => divergences.push(nom + " : " + texte);
const mesures = { cadences: 0, pas: 0, limites: 0 };

/*
 * Cadence : une partie reçoit UNE synchro de `dt` secondes, une autre `pas` synchros de dt/pas. Le résultat doit être le même (sinon la barre dépendrait de la fréquence à laquelle l'écran se resynchronise :
 * 4 s menu ouvert, 15 s sinon, davantage à la reprise d'un onglet). À chaque pas la position (niveau + fraction) ne doit jamais baisser : c'est la définition d'un recul de barre.
 * Une différence de cadence ou un recul sont NOTÉS (section DIVERGENCES), jamais ignorés ; ce qui est identique est vérifié par assertion.
 */
function cadence(nom, reg, dts, pas) {
  for (const dt of dts) {
    const A = creer(reg.retouche); reg.demarrer(A);
    const B = creer(reg.retouche); reg.demarrer(B);
    T += 1000; sync(A); sync(B);   /* même état de départ, une seconde plus tard */
    const base = T;
    const depart = reg.lire(sync(A));
    T = base + Math.round(dt * 1000); const un = reg.lire(sync(A));
    T = base;
    let prec = reg.lire(sync(B));
    assert.equal(prec.pos, depart.pos, nom + " : deux lectures au même instant donnent la même barre");
    for (let i = 1; i <= pas; i += 1) {
      T = base + Math.round((dt * 1000 * i) / pas);
      const p = reg.lire(sync(B));
      if (p.pos < prec.pos - 1e-9 * Math.max(1, Math.abs(prec.pos))) noter(nom, "RECUL de barre : " + prec.pos + " -> " + p.pos + " au pas " + i + "/" + pas + " (dt total " + dt + " s)");
      prec = p; mesures.pas += 1;
    }
    mesures.cadences += 1;
    const ecartNiv = Math.abs(un.niv - prec.niv), ecartPos = Math.abs(un.pos - prec.pos);
    if (ecartNiv > 0 || ecartPos > Math.max(1e-6, 1e-9 * Math.abs(un.pos))) noter(nom, "cadence : dt " + dt + " s en 1 synchro => niv " + un.niv + " + " + un.frac.toFixed(6) + " ; en " + pas + " synchros => niv " + prec.niv + " + " + prec.frac.toFixed(6));
  }
}

/* Règle du wiki NGU (page Energy, « Ticks ») : une barre gagne au plus un niveau par tick, soit 50 niveaux par seconde. Mesure sur une partie neuve, une seule synchro de dt secondes. */
function limite50(nom, reg, dts) {
  const pires = [];
  for (const dt of dts) {
    const run = creer(reg.retouche); reg.demarrer(run);
    T += 1000; const a = reg.lire(sync(run));
    T += Math.round(dt * 1000); const b = reg.lire(sync(run));
    const gain = b.niv - a.niv, permis = Math.ceil(50 * dt - 1e-9);   /* au plus un niveau par tick */
    mesures.limites += 1;
    if (gain > permis) pires.push("dt " + dt + " s : +" + gain + " niveaux (max " + permis + ")");
  }
  if (pires.length) noter(nom, "plus de 50 niveaux/s : " + pires.join(" ; "));
  return pires.length;
}

/* ------------------------------------------------------------------------------------------------------------------------------------------------ */
/* B. BARBES (advanceBeardTrack, idle-ngu-pistes.js) : vitesse = 50 x barres x racine(puissance) x ... / (diviseur x Barbes de même ressource), plafond de 50 niveaux/s.                 */
/* ------------------------------------------------------------------------------------------------------------------------------------------------ */
{
  const piste = "attack";   /* Fu Manchu, ressource Magie, diviseur 1e7 */
  const demarrer = (run) => {
    agir(run, { action: "toggle", system: "beards", active: true });
    if (!(systeme(sync(run), "beards").activeTracks || []).includes(piste)) agir(run, { action: "selectTrack", system: "beards", track: piste });   /* selectTrack BASCULE : la piste « attack » est déjà active au départ */
    assert.ok(systeme(sync(run), "beards").activeTracks.includes(piste), "Barbes : la piste est active");
  };
  /* puissance 1e8 : quelques centièmes de niveau par minute ; 1e14 : des niveaux entiers ; 1e20 : barre plafonnée (un niveau par tick) pour les premiers niveaux */
  for (const P of [1e8, 1e14, 1e20]) {
    const reg = { retouche: (m) => { m.resources.magic.power = P; m.resources.energy.power = P; }, demarrer, lire: posBarbe(piste) };
    const nom = "Barbes (puissance " + P.toExponential(0) + ")";
    cadence(nom, reg, [0.02, 0.5, 7, 600], 7);
    limite50(nom, reg, [0.02, 0.1, 1, 5]);
  }
  /* la barre avance vraiment dans le régime « niveaux entiers » (sinon le test ne mesurerait rien) */
  const run = creer((m) => { m.resources.magic.power = 1e14; }); demarrer(run); T += 1000; const a = posBarbe(piste)(sync(run)); T += 60000; const b = posBarbe(piste)(sync(run));
  assert.ok(b.niv - a.niv >= 5, "Barbes : le test fait passer des niveaux (" + a.niv + " -> " + b.niv + ")");
  /*
   * BARRE PLAFONNÉE (puissance 1e20, niveaux 50 à 75 : un niveau par tick) : 0,5 s de jeu rendent EXACTEMENT 25 niveaux si les pas sont des multiples d'un tick (20 ms), mais PLUS de 25 si le pas n'en est pas un
   * (cas normal : l'intervalle entre deux synchros est un nombre quelconque de millisecondes). Cause (advanceBeardTrack) : après les niveaux plafonnés, le reste d'un tick (< 20 ms) est versé dans la série
   * arithmétique avec la durée NON plafonnée (niveau+1)/vitesse, bien plus courte qu'un tick. Mesure ci-dessous (calculée, pas écrite à la main) ; aucune correction ici.
   */
  const plafond = (pasMs, n) => {
    const r = creer((m) => { m.resources.magic.power = 1e20; m.resources.energy.power = 1e20; }); demarrer(r); T += 1000; sync(r);
    const x = posBarbe(piste)(sync(r)); for (let i = 0; i < n; i += 1) { T += pasMs; sync(r); } const y = posBarbe(piste)(sync(r));
    return { gagne: y.pos - x.pos, permis: (n * pasMs) / 1000 * 50 };
  };
  for (const [pas, n] of [[20, 25], [100, 5], [500, 1]]) { const m = plafond(pas, n); assert.ok(Math.abs(m.gagne - m.permis) < 1e-6, "Barbes plafonnées : pas de " + pas + " ms (multiple d'un tick) => exactement " + m.permis + " niveaux (" + m.gagne + ")"); }
  for (const [pas, n] of [[71, 7], [72, 7], [166, 3]]) { const m = plafond(pas, n); if (m.gagne > m.permis + 1e-6) noter("Barbes plafonnées", "plus de 50 niveaux/s avec des pas de " + pas + " ms : " + n + " synchros = " + (n * pas / 1000) + " s => +" + m.gagne.toFixed(3) + " niveaux (max " + m.permis.toFixed(3) + ")"); }
}

/* ------------------------------------------------------------------------------------------------------------------------------------------------ */
/* C. HACKS (advanceHackTrack) : temps du niveau = diviseur x 1,0078^niveau x (niveau+1) / 50 / (R3 alloué x puissance R3 x multiplicateur), SANS plancher d'un tick.                 */
/* ------------------------------------------------------------------------------------------------------------------------------------------------ */
{
  const piste = "attackDefense";   /* diviseur 1e8 */
  const regime = (P, alloc) => ({
    retouche: (m) => { Object.assign(m.resources.r3, { power: P, cap: 1e15, capNaturel: 1e15, current: 1e15 }); },
    demarrer: (run) => { agir(run, { action: "toggle", system: "hacks", active: true }); agir(run, { action: "selectTrack", system: "hacks", track: piste }); agir(run, { action: "allocate", system: "hacks", resource: "r3", value: alloc }); },
    lire: posHack(piste)
  });
  /* débit (R3 alloué x puissance) : 1e6 (barre lente), 1e9 (niveaux entiers), 1e11 (plus vite que 50 niveaux/s au début) */
  for (const [P, alloc] of [[1, 1e6], [1e3, 1e6], [1e5, 1e6], [1e7, 1e8]]) {
    const nom = "Hacks (débit " + (P * alloc).toExponential(0) + ")";
    cadence(nom, regime(P, alloc), [0.02, 0.5, 60, 3600], 7);
    limite50(nom, regime(P, alloc), [0.02, 0.1, 1, 5]);
  }
  const reg = regime(1e3, 1e6); const run = creer(reg.retouche); reg.demarrer(run); T += 1000; const a = reg.lire(sync(run)); T += 600000; const b = reg.lire(sync(run));
  assert.ok(b.niv - a.niv >= 5, "Hacks : le test fait passer des niveaux (" + a.niv + " -> " + b.niv + ")");
}

/* ------------------------------------------------------------------------------------------------------------------------------------------------ */
/* D. SOUHAITS (advanceWishTrack, wishSlotsSnapshotV1) : temps du niveau = max(4 h, diviseur x (niveau+1) / (produit des 3 allocations x puissances)^0,17 / multiplicateur).          */
/* ------------------------------------------------------------------------------------------------------------------------------------------------ */
{
  /* souhait "1" : 10 niveaux, diviseur 1e15, +5 % de vitesse des souhaits PAR NIVEAU (« 5% speed boost per level ») ; souhait "2" : 5 niveaux, diviseur 2e15, sans effet sur la vitesse */
  const regime = (P, souhait = "1") => ({
    retouche: (m) => { m.difficulty = "difficile"; for (const r of ["energy", "magic", "r3"]) Object.assign(m.resources[r], { power: P, cap: 1e12, capNaturel: 1e12, current: 1e12 }); },
    demarrer: (run) => {
      agir(run, { action: "toggle", system: "wishes", active: true });
      agir(run, { action: "setWishSlot", slot: 0, wish: souhait });
      for (const r of ["energy", "magic", "r3"]) agir(run, { action: "allocateWishSlot", slot: 0, resource: r, value: 1e12 });
    },
    lire: posSouhait(souhait)
  });
  /*
   * TÉMOIN : le souhait "2" n'accélère pas les souhaits ; il doit donner EXACTEMENT le même résultat en une synchro de 40 h qu'en 8 synchros de 5 h (assertion). Avec le souhait "1" (+5 % de vitesse par niveau) les
   * deux diffèrent : wishSpeedParamsV1 est calculé UNE fois au début de chaque synchro, donc les niveaux gagnés pendant une longue synchro n'accélèrent le souhait qu'à la synchro suivante (voir DIVERGENCES).
   */
  { const avant = divergences.length; cadence("Souhaits témoin (souhait 2)", regime(1e9, "2"), [5 * 3600, 40 * 3600], 8); assert.equal(divergences.length, avant, "Souhaits : un souhait sans effet de vitesse ne dépend pas de la cadence : " + divergences.slice(avant).join(" ; ")); }
  /* P = 1e9 : environ 5,4 h le premier niveau (au-dessus du plancher de 4 h) ; P = 1e11 : plancher de 4 h pour les premiers niveaux */
  for (const P of [1e9, 1e11]) {
    const nom = "Souhaits (puissance " + P.toExponential(0) + ")";
    const reg = regime(P);
    cadence(nom, reg, [3600, 14400, 5 * 3600, 40 * 3600, 5e5], 8);
    limite50(nom, reg, [1, 14400]);
    /* temps restant et durée du niveau annoncés par le moteur (c'est ce que peint l'écran) : cohérents avec ce que le moteur fait ensuite */
    const run = creer(reg.retouche); reg.demarrer(run); T += 1000;
    const S0 = sync(run); const s0 = S0.wishSlots.slots[0];
    assert.ok(s0.secondsPerLevel > 0 && s0.secondsRemaining > 0, nom + " : durée annoncée");
    if (P === 1e11) assert.equal(s0.secondsPerLevel, 14400, nom + " : plancher de 4 h");
    const dt = Math.min(1800, s0.secondsRemaining / 2);
    T += Math.round(dt * 1000);
    const s1 = sync(run).wishSlots.slots[0];
    assert.equal(s1.level, s0.level, nom + " : même niveau");
    assert.ok(Math.abs(s1.progress - (s0.progress + dt / s0.secondsPerLevel)) < 1e-9, nom + " : fraction = avant + dt / durée du niveau (" + s1.progress + ")");
    assert.ok(Math.abs(s1.secondsRemaining - (s0.secondsRemaining - dt)) < 1e-6, nom + " : temps restant = avant - dt (" + s1.secondsRemaining + ")");
    /* niv/s affichés par l'écran : min(50, 1 / durée) ; avec le plancher de 4 h c'est toujours bien en dessous de 50 */
    assert.ok(1 / s0.secondsPerLevel < 50, nom + " : la vitesse affichée reste sous 50 niv/s");
  }
}

/* ------------------------------------------------------------------------------------------------------------------------------------------------ */
/* E. YGGDRASIL (advanceYggdrasil) : un fruit actif gagne seconds / tierSeconds de croissance (heures de croissance), plafonné à son palier. L'écran ne fait que peindre growthHours.     */
/* ------------------------------------------------------------------------------------------------------------------------------------------------ */
{
  const fruit = "gold";
  const regime = {
    retouche: (m) => { m.currencies.seeds = 1e12; },
    demarrer: (run) => {
      for (let i = 0; i < 3; i += 1) agir(run, { action: "upgradeYggFruit", fruit });
      agir(run, { action: "activateYggFruit", fruit });
      const f = systeme(sync(run), "yggdrasil").fruits[fruit];
      assert.ok(f.tier === 3 && f.active, "Yggdrasil : fruit de palier 3 actif");
    },
    lire: posYgg(fruit)
  };
  cadence("Yggdrasil", regime, [1, 1800, 7200, 20 * 3600], 9);
  /* valeur exacte : dt / 3600 heures de croissance (avant le plafond du palier) ; au-delà : le palier */
  for (const dt of [1, 600, 1800, 7000, 10000, 50000]) {
    const run = creer(regime.retouche); regime.demarrer(run); T += 1000; const a = regime.lire(sync(run)).frac;
    T += dt * 1000; const b = regime.lire(sync(run)).frac;
    assert.ok(Math.abs(b - Math.min(3, a + dt / 3600)) < 1e-9, "Yggdrasil : croissance après " + dt + " s = " + b + " (attendu " + Math.min(3, a + dt / 3600) + ")");
  }
}

/* ------------------------------------------------------------------------------------------------------------------------------------------------ */
/* DIVERGENCES (moteur contre règle du wiki ou contre lui-même) : le test reste vert, les écarts sont comptés ici et listés dans la sortie.                                            */
/* ------------------------------------------------------------------------------------------------------------------------------------------------ */
/*
 * Mesuré le 2026-11-05 (horloge gelée, partie neuve, tous systèmes ouverts) ; aucun recul de barre dans aucun des quatre systèmes :
 *  1. BARBES et 2. HACKS : CORRIGÉS le 2026-11-05 (un niveau par tick au plus, résultat indépendant du découpage du temps ; avant : reste d'un tick versé dans la série non plafonnée / aucun plancher pour les Hacks). Gardés par l'assertion ci-dessous.
 *  3. SOUHAITS : CORRIGÉ le 2026-11-05 (la vitesse des souhaits est recalculée à chaque niveau gagné, comme le jeu d'origine à chaque tick ; avant : une fois par synchro, 40 h en 1 synchro = niveau 3,346 contre 3,473 en 8 synchros). Gardé par l'assertion ci-dessous.
 *  4. YGGDRASIL : croissance = dt / 3600 h exacte et sans écart de cadence (plafonnée au palier).
 */
const sansRecul = divergences.filter((d) => /RECUL/.test(d));
const sansCadence = divergences.filter((d) => /cadence :/.test(d));
const plus50 = divergences.filter((d) => /plus de 50 niveaux/.test(d));
assert.equal(plus50.length, 0, "Barbes et Hacks : jamais plus de 50 niveaux par seconde, quel que soit le découpage : " + plus50.join(" | "));
assert.equal(divergences.filter((d) => /^(Barbes|Hacks)/.test(d) && /cadence :/.test(d)).length, 0, "Barbes et Hacks : même résultat quelle que soit la cadence");
assert.equal(sansCadence.length, 0, "aucun écart de cadence dans aucun système : " + sansCadence.join(" | "));
console.log(divergences.length ? "DIVERGENCES:\n  " + divergences.join("\n  ") : "aucune divergence");
console.log("idle-autres-barres-projection-moteur-v1: OK (" + mesures.cadences + " cadences, " + mesures.pas + " pas, " + mesures.limites + " mesures de 50 niveaux/s ; reculs " + sansRecul.length + ", écarts de cadence " + sansCadence.length + ", dépassements de 50 niveaux/s " + plus50.length + ")");
