import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { pathToFileURL } from "node:url";

const { runSorealIdleOperation } = await import(pathToFileURL(process.cwd() + "/cloudflare/src/idle-sqlite-runtime.js").href);
const { SorealIdleCoordinatorV1 } = await import(pathToFileURL(process.cwd() + "/cloudflare/src/index-idle-coordinator-v1.js").href);
const HEADERS = readFileSync("cloudflare/tests/idle-augmentations-audit-v1.test.mjs", "utf8").split("\n").find((l) => l.startsWith("const HEADERS"));
const vrai = Date.now.bind(Date);
let decalage = 0;
const horloge0 = vrai();
Date.now = () => horloge0 + decalage;   /* horloge GELÉE : seul `decalage` la fait avancer */
function partie(or) {
  const db = new DatabaseSync(":memory:");
  const sql = { exec(q, ...b) { const st = db.prepare(q); if (/^\s*(select|pragma|with)/i.test(q)) return st.all(...b); st.run(...b); return []; } };
  db.exec("CREATE TABLE IF NOT EXISTS legacy_rows(source_key TEXT,row_index INTEGER,values_json TEXT,imported_at INTEGER)");
  new SorealIdleCoordinatorV1({ storage: { sql } }, {});
  for (let i = 0; i < 15; i += 1) sql.exec("INSERT INTO migration_sources(source_key,status) VALUES(?,?)", "idle:s" + i, "DONE");
  const HEAD = JSON.parse(HEADERS.slice(HEADERS.indexOf("=") + 1).trim().replace(/;$/, ""));
  sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", "JOUEURS", 1, JSON.stringify(HEAD), Date.now());
  [["Type", "CoutBase", "Croissance", "BonusParNiveau"], ["production", 20, 1.6, 1], ["capacite", 20, 1.6, 1], ["puissance", 20, 1.6, 1]].forEach((l, i) => sql.exec("INSERT INTO idle_catalog(sheet_name,row_index,row_json,updated_at) VALUES(?,?,?,?)", "IDLE_BOUTIQUE", i + 1, JSON.stringify(l), Date.now()));
  const user = { email: "technicien.soreal@gmail.com", emailConnexion: "technicien.soreal@gmail.com", emails: ["technicien.soreal@gmail.com"], prenom: "Norman" };
  const run = (op, ...a) => runSorealIdleOperation(sql, op, ["local", ...a], user);
  run("obtenirEtatSorealIdle");
  const ligne = sql.exec("select rowid as id,row_json from idle_catalog where sheet_name='JOUEURS' and row_index>1")[0];
  const arr = JSON.parse(ligne.row_json);
  arr[14] = 140; arr[4] = 5e14; arr[5] = 1e15; arr[6] = 0;
  const st = JSON.parse(arr[37] || "{}");
  st.metaNgu.currencies = st.metaNgu.currencies || {};
  st.metaNgu.currencies.gold = or;
  st.metaNgu.resources = st.metaNgu.resources || {};
  st.metaNgu.resources.energy = Object.assign(st.metaNgu.resources.energy || {}, { current: 1e17, cap: 1e18, capNaturel: 1e18 });
  st.metaNgu.resources.magic = Object.assign(st.metaNgu.resources.magic || {}, { current: 1e17, cap: 1e18, capNaturel: 1e18 });
  arr[37] = JSON.stringify(st);
  db.prepare("update idle_catalog set row_json=? where rowid=?").run(JSON.stringify(arr), ligne.id);
  run("synchroniserSorealIdle");
  return run;
}
const agir = (run, p) => run("agirProgressionSorealIdle", p);

/*
 * Norman (2026-11-05, plan design/PLAN-MOTEUR-UNIQUE.md) : MÊME preuve que pour la Machine temporelle et les Augmentations, pour les RITUELS de Blood Magic.
 *
 * ÉCRAN : le rejeu des rituels est EN LIGNE dans mettreAJourJeuIdleLocalV7__p7 (ui-boucle-v1.js, ~l. 542-574), mêlé au DOM : il n'est pas extractible par new Function. Ce test en recopie donc la logique PURE ci-dessous (rejeuEcran),
 * ligne pour ligne, et GARDE (assertions de texte plus bas) que les lignes copiées sont toujours dans le fichier de l'écran : si elles changent, le test échoue et il faut remettre la copie à jour.
 * Entrées de l'écran : secondsPerCompletion, etaSeconds, au repère `at` (bloodMagicView du moteur), Or courant, coût du rituel (`gold` du catalogue), temps écoulé depuis le repère.
 *
 * MOTEUR : advanceBloodMagic (idle-ngu-systemes.js ~l. 69-114) : progress += secondes ; completions = floor(progress / secondsPerCompletion), bornée par l'Or (floor(or / coût)), 1 000 000 et le défi « 100 niveaux » ;
 * Or -= completions * coût ; sang += completions * sang du rituel * multiplicateurs ; reste de barre = progress - completions * spc (plafonné à spc).
 *
 * DIVERGENCES CONNUES (documentées ici, le test reste vert) :
 *  D1 (50 niveaux/s, wiki NGU Idle, page Energy section Ticks) : NI le moteur NI l'écran ne plafonnent les rituels à 50 complétions/s. advanceBloodMagic ne connaît pas IDLE_TICK_SECONDS_V1 (idle-tick-v1.js) ; l'écran n'utilise 0,0201 s que
 *      pour décider « barre pleine » à l'affichage et n'affiche que min(50, 1/s) niv/s : le rejeu `dus` n'est pas plafonné. Les deux sont donc d'accord entre eux mais PAS avec le jeu d'origine (voir la mesure « CAP » plus bas).
 *  D2 (pas de rejeu partiel en CAP) : voir mesures.
 */
const src = readFileSync("cloudflare/public/modules/ui-boucle-v1.js", "utf8");
for (const morceau of [
  "if(ecoule0>=eta0-1e-9){",
  "const dus=Math.floor((ecoule0-eta0)/seconds+1e-9)+1;",
  "Math.min(dus,Math.floor((orLiveB+1e-9)/coutOrB),1000000)",
  "const reste=(ecoule0-eta0)%seconds;",
  "bloodVisual.etaSeconds=Math.max(1e-6,seconds-reste);",
  "if(faits<=0){bloodVisual.at=maintB;bloodVisual.etaSeconds=0;}",
  "REG.idleEtat.systemes.currencies.gold=orLiveB;"
]) assert.ok(src.includes(morceau), "ligne de l'écran toujours présente (mettre la copie du test à jour sinon) : " + morceau);

/* Copie de la logique pure de l'écran. Renvoie les rituels faits, l'Or restant et le nouveau repère (etaSeconds restant au repère à l'instant ecoule). */
function rejeuEcran({ seconds, eta0, ecoule0, or, cout }) {
  let faits = 0, etaSeconds = eta0, orLive = or;
  if (seconds > 0 && cout > 0 && ecoule0 >= eta0 - 1e-9) {
    const dus = Math.floor((ecoule0 - eta0) / seconds + 1e-9) + 1;   /* tolérance de frontière : même que le moteur (2026-11-05) */
    faits = Math.min(dus, Math.floor((orLive + 1e-9) / cout), 1000000);
    if (faits <= 0) etaSeconds = 0;
    else {
      orLive = Math.max(0, orLive - faits * cout);
      if (faits === dus) etaSeconds = Math.max(1e-6, seconds - ((ecoule0 - eta0) % seconds));
      else etaSeconds = 0;
    }
  } else etaSeconds = eta0 - ecoule0;
  return { faits, or: orLive, etaSeconds };
}

const lire = (r, ritual) => {
  const j = r.joueur, v = j.systemes.bloodMagicView, rv = v.rituals.find((x) => x.id === ritual);
  const def = j.systemes.bloodRituals.find((x) => x.id === ritual);
  const donnees = j.systemes.systems.find((x) => x.id === "bloodMagic").state.data.rituals[ritual];
  return { spc: rv.secondsPerCompletion, eta: rv.etaSeconds, fraction: rv.progressFraction, cout: def.gold, sang0: def.blood, niveau: donnees.level, completions: donnees.completions, or: Number(j.systemes.currencies.gold), sang: Number(j.systemes.currencies.blood) };
};

const lignes = [];
const divergencesFrontiere = [];
let rituelsMax = 0, capVu = 0, capDepasse = 0, orInsuffisantVu = 0;
/* Allocations de Magie (rituel « tack » : 2000 s de base ; plus de Magie = barre plus rapide) et durées écoulées. */
for (const alloc of [1e3, 1e5, 1e7, 1e9, 1e11]) {
  for (const dt of [0.5, 3, 3.07, 25, 25.13, 200]) {
    const run = partie(1e15);
    agir(run, { action: "selectRitual", ritual: "tack" });
    agir(run, { action: "allocateRitual", ritual: "tack", value: alloc });
    const a = lire(run("synchroniserSorealIdle"), "tack");
    const e = rejeuEcran({ seconds: a.spc, eta0: a.eta, ecoule0: dt, or: a.or, cout: a.cout });
    decalage += dt * 1000;
    const b = lire(run("synchroniserSorealIdle"), "tack");
    const faitsMoteur = b.completions - a.completions;
    rituelsMax = Math.max(rituelsMax, faitsMoteur);
    const orMoteur = a.or - b.or;
    const sangMoteur = b.sang - a.sang;
    const sangEcran = e.faits * a.sang0 * (sangMoteur > 0 ? sangMoteur / (faitsMoteur * a.sang0) : 1);   /* multiplicateurs de sang = ceux du moteur (même formule des deux côtés : le rejeu écran ne calcule que le COMPTE) */
    const plafond50 = Math.ceil(50 * dt) + 1;
    const cap = a.spc < 0.0201;
    if (cap) { capVu += 1; if (faitsMoteur > plafond50) capDepasse += 1; }
    lignes.push([alloc, dt, +a.spc.toFixed(5), a.eta, faitsMoteur, e.faits, plafond50]);
    /* D3 : à une frontière EXACTE (écoulé - eta = multiple entier de la durée), l'écran compte (ecoule0 - eta0) / seconds en flottants (2,8 / 0,2 = 13,999999999999998 -> 14) alors que le moteur compte progress / spc (3 / 0,2 = 15) : un rituel d'écart que la réponse suivante du moteur ajoute (saut d'un rituel). Hors frontière : identiques. */
    const q = (dt - a.eta) / a.spc;
    if (e.faits !== faitsMoteur && Math.abs(q - Math.round(q)) < 1e-9 && Math.abs(e.faits - faitsMoteur) === 1) { divergencesFrontiere.push([alloc, dt, a.spc, faitsMoteur, e.faits]); continue; }
    assert.equal(e.faits, faitsMoteur, "rituels complétés après " + dt + " s (Magie " + alloc + ", durée " + a.spc + " s) : moteur " + faitsMoteur + " / écran " + e.faits);
    assert.ok(Math.abs(orMoteur - e.faits * a.cout) <= 1e-6 * Math.max(1, orMoteur), "Or débité (Magie " + alloc + ", " + dt + " s) : moteur " + orMoteur + " / écran " + e.faits * a.cout);
    assert.ok(Math.abs(sangEcran - sangMoteur) <= 1e-6 * Math.max(1, sangMoteur), "sang gagné (Magie " + alloc + ", " + dt + " s)");
    /* Reste de barre : fraction du moteur = reste d'écran / durée (reprise du rejeu : (ecoule0 - eta0) % seconds). */
    if (e.faits > 0 && e.etaSeconds > 0 && e.faits < 1e6) {
      const fractionEcran = 1 - e.etaSeconds / a.spc;
      const ecartFraction = Math.abs(fractionEcran - b.fraction);   /* circulaire : 0,999995 et 0 sont la même position de barre (frontière) */
      assert.ok(Math.min(ecartFraction, 1 - ecartFraction) < 2e-3 || a.spc < 0.0201, "fraction de barre après " + dt + " s (Magie " + alloc + ") : moteur " + b.fraction + " / écran " + fractionEcran);
    }
  }
}
assert.ok(rituelsMax >= 20, "le test passe vraiment des rituels : " + rituelsMax);

/* Or INSUFFISANT : seulement 2 rituels payables ; le moteur et l'écran s'arrêtent au même nombre, la barre attend PLEINE. */
for (const [alloc, dt] of [[1e7, 25], [1e9, 5]]) {
  const run = partie(1e15);
  agir(run, { action: "allocateRitual", ritual: "tack", value: alloc });
  const a0 = lire(run("synchroniserSorealIdle"), "tack");
  const orPauvre = 2.5 * a0.cout;
  const run2 = partie(orPauvre);
  agir(run2, { action: "allocateRitual", ritual: "tack", value: alloc });
  const a = lire(run2("synchroniserSorealIdle"), "tack");
  const e = rejeuEcran({ seconds: a.spc, eta0: a.eta, ecoule0: dt, or: a.or, cout: a.cout });
  decalage += dt * 1000;
  const b = lire(run2("synchroniserSorealIdle"), "tack");
  orInsuffisantVu += 1;
  assert.equal(b.completions - a.completions, e.faits, "Or insuffisant : rituels moteur " + (b.completions - a.completions) + " / écran " + e.faits);
  assert.ok(Math.abs((a.or - b.or) - e.faits * a.cout) < 1e-3, "Or insuffisant : Or débité");
  assert.ok(b.or >= 0 && e.or >= 0, "Or jamais négatif");
}
assert.equal(orInsuffisantVu, 2);

/*
 * Mesure D1 : le plafond de 50 complétions/s est-il respecté ? Le test NE FAIT PAS échouer (divergence documentée, à corriger dans un chantier distinct) : il affiche le constat.
 */
/*
 * CORRIGÉ le 2026-11-05 (Norman : « exactement la même chose que NGU IDLE original ») : D1 — le moteur donne maintenant AU MOINS UN TICK à chaque rituel (advanceBloodMagic et bloodMagicViewV1 : IDLE_TICK_SECONDS_V1), donc jamais plus de 50 rituels par
 * seconde ; D3 — le moteur et l'écran comptent la frontière exacte avec la même tolérance (1e-9). Ces deux écarts sont désormais des ÉCHECS.
 */
assert.equal(divergencesFrontiere.length, 0, "plus aucun écart d'un rituel à une frontière exacte : " + JSON.stringify(divergencesFrontiere));
assert.ok(capVu >= 6, "le test voit des rituels au plafond : " + capVu);
assert.equal(capDepasse, 0, "jamais plus de 50 rituels par seconde dans le moteur : " + capDepasse + " dépassements");
console.log("D3 frontieres exactes (Magie, dt, s/rituel, moteur, ecran) : " + JSON.stringify(divergencesFrontiere));
console.log("barres CAP vues (durée < 1 tick) : " + capVu + ", dépassant 50/s dans le MOTEUR : " + capDepasse);
console.log("[Magie, dt, s/rituel, eta, moteur, écran, plafond 50/s]");
for (const l of lignes.filter((x) => x[2] < 0.0201)) console.log(JSON.stringify(l));
console.log("idle-rituels-projection-moteur-v1: OK (" + rituelsMax + " rituels au mieux en une étape ; compte, Or et sang identiques moteur/écran)");
