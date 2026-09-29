import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-29) : « J'ai demandé à ce que la barre d'énergie se remplisse au compte goutte
 * mais le résultat n'est toujours pas affiché. La barre de magie doit avoir le même comportement. »
 *
 * L'Énergie avance déjà localement tick par tick (idleEtat.energie, mettreAJourJeuIdleLocalV7_) entre
 * deux synchros serveur, puis se projette en plus à la fréquence native de l'écran
 * (rafraichirVisuelsFluidesIdleV221_, V221) -- d'où son remplissage visiblement progressif. La Magie
 * ne lisait QUE l'instantané serveur (resources.magic.current), repeint identique à 15 Hz jusqu'à la
 * synchro suivante (~15s) : aucun mouvement visible entre les deux, un bond d'un coup à chaque synchro.
 *
 * Ce test vérifie que la Magie a désormais EXACTEMENT le même double mécanisme que l'Énergie, sur ses
 * propres champs (jamais idleEtat.magie*, déjà pris par l'ancien système de sorts/mana).
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");

// --- metaTickMagieIdleV1_ existe, lit resourceInfo.magic.perSecond, jamais productionSeconde (propre à l'Énergie) ---
{
  const debut = ui.indexOf("function metaTickMagieIdleV1_(){");
  const fin = ui.indexOf("function largeurBarreCombatIdleV121_(", debut);
  assert.ok(debut > 0 && fin > debut, "metaTickMagieIdleV1_ introuvable");
  const bloc = ui.slice(debut, fin);
  assert.match(bloc, /idleEtat\.systemes\.resourceInfo\.magic/);
  assert.ok(!bloc.includes("productionSeconde"), "ne doit jamais lire le champ Énergie");
}

// --- Horloge de reste de tick dédiée à la Magie, distincte de celle de l'Énergie ---
assert.ok(ui.includes("let idleResteTickMagieMsV1=0;"));

// --- Tick lourd (mettreAJourJeuIdleLocalV7_) : avance ressourceMagieEtat.current, GARDÉ par le déblocage réel ---
{
  const debutFn = ui.indexOf("function mettreAJourJeuIdleLocalV7_(){");
  const finFn = ui.indexOf("function appliquerSynchroCombatSansReflowIdleV116_(", debutFn);
  assert.ok(debutFn > 0 && finFn > debutFn, "mettreAJourJeuIdleLocalV7_ introuvable");
  const fn = ui.slice(debutFn, finFn);

  const debutBloc = fn.indexOf("const ressourceMagieEtat=");
  assert.ok(debutBloc > 0, "bloc d'avancement local de la Magie introuvable dans le tick lourd");
  const bloc = fn.slice(debutBloc, fn.indexOf("actualiserManaSortsIdleV90_(", debutBloc));

  assert.match(bloc, /const infoMagieEtat=[\s\S]*?idleEtat\.systemes\.resourceInfo\.magic;/, "doit lire resourceInfo.magic");
  assert.match(
    bloc,
    /if\(ressourceMagieEtat&&budgetMagieEtat&&infoMagieEtat\)\{/,
    "GARDE CRITIQUE : resources.magic/resourceBudget.magic existent TOUJOURS côté serveur (même Magie verrouillée) -- " +
    "seul resourceInfo.magic est filtré par déblocage réel. Sans infoMagieEtat dans la garde, un joueur sans Blood " +
    "Magic verrait sa Magie avancer toute seule au taux de repli (0.25/s) de metaTickMagieIdleV1_, sans aucune " +
    "production réelle."
  );
  assert.match(bloc, /ressourceMagieEtat\.current=/, "doit muter ressourceMagieEtat.current, comme idleEtat.energie pour l'Énergie");
  assert.match(bloc, /idleResteTickMagieMsV1\+=ecouleTickMs/, "doit accumuler le même écoulement réel que l'Énergie (ecouleTickMs)");
}

// --- Rendu fluide RAF (rafraichirVisuelsFluidesIdleV221_) : projette la Magie aussi, sans muter l'état de jeu ---
{
  const debutFn = ui.indexOf("function rafraichirVisuelsFluidesIdleV221_(){");
  const finFn = ui.indexOf("function demarrerTickerIdle_(){", debutFn);
  assert.ok(debutFn > 0 && finFn > debutFn, "rafraichirVisuelsFluidesIdleV221_ introuvable");
  const fn = ui.slice(debutFn, finFn);

  assert.match(fn, /document\.getElementById\(\s*'sorealIdleMagicBarV1'\s*\)/, "doit cibler la barre de Magie en plus de celle d'Énergie");
  assert.match(fn, /if\(magicBarEl&&ressourceMagieVisu&&infoMagieVisu&&budgetMagieVisu\)\{/, "même garde de déblocage que le tick lourd");
  assert.match(fn, /mettreAJourBarreProgressionContinueV1_\(\s*magicBarEl,/, "réutilise le même helper générique que la barre d'Énergie");

  // Invariant déjà vérifié pour l'Énergie par idle-smooth-visual-rendering.test.mjs : l'interpolation ne doit
  // muter AUCUN état de jeu, énergie ou magie.
  assert.ok(!/ressourceMagieVisu\.current\s*=/.test(fn), "le rendu fluide ne doit pas muter la Magie (projection uniquement)");
  assert.ok(!/idleResteTickMagieMsV1\s*=/.test(fn), "le rendu fluide ne doit pas muter l'horloge du tick de Magie");
}

// --- Rendu 15 Hz (rafraichirEnergieEtBoutonsIdleV9_) : la barre de Magie lit désormais le total LOCAL vivant, jamais l'instantané figé ---
{
  const debutFn = ui.indexOf("function rafraichirEnergieEtBoutonsIdleV9_(){");
  assert.ok(debutFn > 0, "rafraichirEnergieEtBoutonsIdleV9_ introuvable");
  const finFn = ui.indexOf("\n      function ", debutFn + 10);
  const fn = ui.slice(debutFn, finFn);

  assert.match(
    fn,
    /const magicDisponible=Math\.max\(0,idleNombre_\(ressourceMagic\.current\)\);/,
    "magicDisponible doit venir de ressourceMagic.current (vivant), plus de budgetMagic.available (figé à la dernière synchro)"
  );
  assert.match(fn, /mettreAJourBarreProgressionContinueV1_\(\s*magicBar,/, "la barre de Magie doit utiliser le même helper continu que l'Énergie, jamais un simple style.width=X%");
}

console.log("idle-magic-smooth-fill-v1: OK");
