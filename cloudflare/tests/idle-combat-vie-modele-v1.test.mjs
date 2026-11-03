import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { creerJoueurExterneV1 } from "./helpers/joueur-externe-v1.mjs";

/*
 * Norman (2026-11-03) : « à chaque combat sur la borne la vie descend, remonte une fois légèrement et descend jusqu'au bout... je ne veux pas de pansements ; si elle remonte, c'est une erreur de calcul ou une
 * latence ; supprime le problème à la racine ». Causes MESURÉES (vrai moteur local, image par image) :
 *  (b) départ du combat : la page part du CLIC, le moteur partait de l'instant où il TRAITE l'ordre (70 à 130 ms plus tard) alors que l'instantané de départ était pris au clic : à la première réponse, boss -0,47 point
 *      et joueur -0,10 point par rapport à la page ; le client envoie maintenant snapshot.debutMs (heure du serveur) et le moteur part de CET instant ;
 *  (c) la page perdait le temps écoulé depuis son dernier passage à chaque réponse du moteur (remise à zéro de idleDernierTickLocalV40) et comptait jusqu'à 66 ms de combat AVANT le clic ;
 *  (a) latence : une réponse décrit la vie à l'instant du moteur ; elle est ramenée à maintenant (vitesse × âge) avant d'être comparée.
 * La vie affichée est celle du modèle (page) ; la réponse la CONTRÔLE : écart sous la tolérance = gardé et signalé s'il dépasse 0,5 point, au-delà = le moteur fait foi et c'est signalé. Aucun « le plus bas des deux ».
 */

/* ---- 1. Le moteur part de l'instant du clic (vrai moteur) ---- */
let horloge = 1_800_000_000_000;
const VraiDate = Date;
globalThis.Date = class extends VraiDate { constructor(...a) { if (a.length === 0) super(horloge); else super(...a); } static now() { return horloge; } };

function creer() {
  const g = creerJoueurExterneV1("modele" + Math.random().toString(36).slice(2) + "@example.com");
  const run = (op, ...a) => g.op(op, "x", ...a);
  run("obtenirEtatSorealIdle"); run("definirPseudoSorealIdle", "Modele");
  const ligne = g.sql.exec("select rowid as id,row_json from idle_catalog where sheet_name='JOUEURS' and row_index>1")[0];
  const arr = JSON.parse(ligne.row_json);
  arr[14] = 3; arr[4] = 50000; arr[5] = 100000;
  const i = arr.findIndex((x) => typeof x === "string" && x.includes("metaNgu"));
  const stats = JSON.parse(arr[i]);
  for (const r of ["energy", "magic"]) { const x = stats.metaNgu.resources[r]; x.cap = 1e9; x.capNaturel = 1e9; x.current = 1e9; }
  stats.entrainementBase.skills.attaque_passive.level = 900;
  stats.entrainementBase.skills.blocage.level = 850;
  arr[i] = JSON.stringify(stats);
  g.db.prepare("update idle_catalog set row_json=? where rowid=?").run(JSON.stringify(arr), ligne.id);
  run("synchroniserSorealIdle");
  const l2 = g.sql.exec("select rowid as id,row_json from idle_catalog where sheet_name='JOUEURS' and row_index>1")[0];
  const a2 = JSON.parse(l2.row_json); a2[26] = Math.round(a2[27] * 0.6);
  g.db.prepare("update idle_catalog set row_json=? where rowid=?").run(JSON.stringify(a2), l2.id);
  return run;
}
function combat(debut, delaiOrdreMs) {
  const run = creer();
  const j0 = run("synchroniserSorealIdle").joueur;
  const t0 = horloge;                       // le clic
  const snapshot = { pvJoueur: j0.pvJoueur, bossPv: j0.bossPv, bossSelection: j0.bossSelection };
  if (debut !== null) snapshot.debutMs = t0 + debut;
  horloge = t0 + delaiOrdreMs;              // l'ordre n'est traité qu'un peu plus tard (envoi + file)
  run("definirCombatBossSorealIdle", true, "reprise", snapshot);
  horloge = t0 + 1000;                      // une seconde après le CLIC
  const j1 = run("synchroniserSorealIdle").joueur;
  return { j0, j1, perte: j0.bossPv - j1.bossPv };
}
{
  const sans = combat(null, 120);
  const avec = combat(0, 120);
  assert.ok(sans.j1.combatBossActif && avec.j1.combatBossActif, "le combat est actif");
  const vitesse = sans.perte / 0.88;          // sans debutMs : 880 ms de combat seulement (le moteur part de 120 ms)
  assert.ok(vitesse > 0, "le boss perd de la vie");
  assert.ok(Math.abs(avec.perte / vitesse - 1.0) < 0.01, "avec debutMs : 1,000 s de combat depuis le clic (" + (avec.perte / vitesse).toFixed(3) + ")");
  /* Un debutMs dans le futur ou trop ancien est ignoré (jamais de temps inventé) : 880 ms depuis le traitement. */
  const futur = combat(5000, 120).perte / vitesse;
  assert.ok(Math.abs(futur - 0.88) < 0.01, "debutMs futur ignoré (" + futur.toFixed(3) + ")");
  const ancien = combat(-60000, 120).perte / vitesse;
  assert.ok(Math.abs(ancien - 0.88) < 0.01, "debutMs vieux de plus de 5 s ignoré (" + ancien.toFixed(3) + ")");
}
globalThis.Date = VraiDate;

/* ---- 2. Le modèle : suite de réponses simulées avec latence, jamais de remontée, continuité ---- */
const code = readFileSync(new URL("../public/modules/combat-vie-modele-v1.js", import.meta.url), "utf8");
function monde() {
  const t = 5_000_000; const signaux = [];
  const fen = { __SOREAL_IDLE_DIAG_V1__: { signaler: (c, d) => signaux.push([c, d]) }, Date: { now: () => t } };
  fen.window = fen; vm.runInNewContext(code, fen);
  return { M: fen.__SOREAL_IDLE_COMBAT_VIE_V1__, signaux };
}
{
  const m = monde();
  const MAX = 11_000_000, VIT = 440_000;           // 4 % par seconde
  let affiche = MAX, derniere = MAX, prochaine = 430, nb = 0;
  for (let ms = 0; ms <= 8000; ms += 66) {         // la page part du clic (t = 0) ; tick de 66 ms
    affiche = Math.max(0, MAX - VIT * (ms / 1000));
    if (ms >= prochaine) {
      // le moteur a calculé 430 ms plus tôt (aller-retour 400 ms + calcul) : sa vie est celle de cet instant
      const age = 0.43, vieMoteur = Math.max(0, MAX - VIT * Math.max(0, ms / 1000 - age));
      const avant = affiche;
      affiche = m.M.reconcilier(affiche, vieMoteur, MAX, "boss", VIT, age);
      assert.ok(Math.abs(affiche - avant) / MAX < 1e-6, "continuité : valeur affichée à l'instant de la réponse = modèle (écart " + ((affiche - avant) / MAX * 100).toFixed(4) + " pt)");
      prochaine = ms + 400; nb++;
    }
    assert.ok(affiche <= derniere + 1e-6, "la vie ne remonte jamais (t=" + ms + ")");
    derniere = affiche;
  }
  assert.ok(nb > 15);
  assert.equal(m.signaux.length, 0, "aucun écart signalé quand le modèle est exact");
  assert.equal(m.M.stats().adoptes, 0);
}
/* Sans compensation de la latence, un écart de 1,7 point est SIGNALÉ au journal (pas masqué) et le modèle de la page est gardé. */
{
  const m = monde();
  const MAX = 11_000_000, VIT = 440_000;
  const affiche = MAX - VIT * 5, vieMoteur = MAX - VIT * (5 - 0.43);
  assert.equal(m.M.reconcilier(affiche, vieMoteur, MAX, "boss"), affiche);
  assert.ok(m.signaux.some((s) => s[0] === "combat_vie_remontee:boss"), "l'écart est signalé au journal");
}
/* Une vraie divergence (> 3 points) : le moteur fait foi, qu'elle monte ou qu'elle baisse, et c'est signalé. */
{
  const m = monde();
  assert.equal(m.M.reconcilier(5_000_000, 9_000_000, 11_000_000, "boss"), 9_000_000);
  assert.equal(m.M.reconcilier(9_000_000, 5_000_000, 11_000_000, "joueur"), 5_000_000);
  assert.equal(m.signaux.length, 2);
}

/* ---- 3. Câblage dans le client ---- */
const lire = (p) => readFileSync(new URL("../public/" + p, import.meta.url), "utf8");
const c1 = lire("modules/ui-combat-1-v1.js"), c2 = lire("modules/ui-combat-2-v1.js"), boucle = lire("modules/ui-boucle-v1.js"), mono = lire("modules/etat-monotone-v1.js"), html = lire("index.html");
assert.ok(/debutMs:Date\.now\(\)\+/.test(c1) && /debutMs:Math\.max\(0,Number\(snapshot\.debutMs\)\|\|0\)/.test(c1), "le snapshot du combat porte l'instant du clic");
assert.ok(/REG\.idleCombatDebutClicV1=Date\.now\(\)/.test(c2) && /const dtCombat=/.test(boucle) && /p16\(dpsBase, dtCombat,/.test(boucle), "le combat se compte depuis le clic");
assert.ok(/reconcilier\(bossLocal,bossServeur/.test(c1), "la vie du boss en combat passe par le modèle");
assert.ok(!/Math\.min\(\s*bossLocal,\s*bossServeur\s*\)\s*,\s*bossPvMax/.test(c1), "plus de « le plus bas des deux »");
assert.ok(!/REG\.idleDernierTickLocalV40=\s*Date\.now\(\);\s*\n\s*initialiserCoupsCombatIdleV116_/.test(c1), "la synchro de combat ne remet plus le tick à zéro");
assert.ok(/viesCombatBossModeleIdleV1_\(REG\.idleEtat,joueurServeur\)/.test(c1), "le chemin « Aventure active » ré-ancre le modèle au lieu d'adopter l'état");
assert.ok(!/n\[c\[0\]\]=av/.test(mono), "etat-monotone ne retient plus rien en combat (journal seulement)");
assert.ok(html.includes('<script defer src="/modules/combat-vie-modele-v1.js?v='), "module chargé");
console.log("idle-combat-vie-modele-v1: OK");
