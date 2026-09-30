import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-29) : « J'ai demandé à ce que la barre d'énergie se remplisse au compte goutte
 * mais le résultat n'est toujours pas affiché. La barre de magie doit avoir le même comportement. »
 *
 * L'Énergie avance déjà localement tick par tick (idleEtat.energie, mettreAJourJeuIdleLocalV7_) entre
 * deux synchros serveur -- d'où son remplissage visiblement progressif. La Magie ne lisait QUE
 * l'instantané serveur (resources.magic.current), repeint identique à 15 Hz jusqu'à la synchro
 * suivante (~15s) : aucun mouvement visible entre les deux, un bond d'un coup à chaque synchro.
 *
 * Ce test vérifie que la Magie a désormais le même mécanisme d'avancement local que l'Énergie, sur
 * ses propres champs (jamais idleEtat.magie*, déjà pris par l'ancien système de sorts/mana).
 *
 * Correctif 2026-09-29 (suite, revirement assumé) : ce fichier testait aussi une interpolation RAF
 * séparée (rafraichirVisuelsFluidesIdleV221_) qui projetait la Magie à la fréquence de l'écran --
 * retirée avec le rebond de tick de la barre elle-même (Norman : « Je ne veux plus qu'elle tique !!!
 * elle doit simplement se remplir et se vider... Aucune animation de tique par seconde », voir
 * idle-energy-tick-bounce-v1.test.mjs). L'avancement local au tick lourd (section ci-dessous) reste
 * la seule mécanique de remplissage progressif désormais.
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

// --- Le rendu RAF séparé (et son rebond à interpoler) n'existe plus du tout ---
assert.ok(!ui.includes("function rafraichirVisuelsFluidesIdleV221_("), "retiré avec le rebond de tick, plus rien à interpoler à la fréquence de l'écran");

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

/*
 * Norman (2026-09-30) : « La magie ne monte pas progressivement comme l'énergie. Elle monte par 20
 * tous les x secondes. Le compteur doit fonctionner comme celui de énergie. » La valeur avançait
 * déjà correctement tick par tick (bloc ci-dessus), mais rafraichirEnergieEtBoutonsIdleV9_ (qui la
 * pousse vers la barre/le texte affichés) n'était JAMAIS appelée depuis mettreAJourJeuIdleLocalV7_
 * -- seulement au clic sur un bouton. Entre deux synchros serveur (~15 s), la valeur avançait donc
 * en mémoire sans que rien ne rafraîchisse l'écran : un bond visible à chaque synchro complète,
 * exactement comme avant le premier correctif "compte-goutte". Ce test verrouille le fait que le
 * TICK LOURD LUI-MÊME pousse la valeur vers l'écran, comme il le fait déjà pour l'Énergie
 * (sorealIdleEnergyBarV11, juste au-dessus dans la même fonction) -- jamais seulement au clic.
 */
{
  const debutFn = ui.indexOf("function mettreAJourJeuIdleLocalV7_(){");
  const finFn = ui.indexOf("function appliquerSynchroCombatSansReflowIdleV116_(", debutFn);
  assert.ok(debutFn > 0 && finFn > debutFn, "mettreAJourJeuIdleLocalV7_ introuvable");
  const fn = ui.slice(debutFn, finFn);

  const debutBloc = fn.indexOf("const ressourceMagieEtat=");
  const bloc = fn.slice(debutBloc, fn.indexOf("actualiserManaSortsIdleV90_(", debutBloc));

  assert.match(
    bloc,
    /document\.getElementById\('sorealIdleMagicBarV1'\)/,
    "le tick lourd doit lui-même toucher la barre de Magie, pas seulement le clic sur un bouton"
  );
  assert.match(
    bloc,
    /mettreAJourBarreProgressionContinueV1_\(\s*magicBarTickEl,\s*magicDisponibleTick,\s*magicCapTick\s*\)/,
    "doit utiliser le même helper continu que l'Énergie, à chaque tick, pas seulement à la synchro"
  );
  assert.match(
    bloc,
    /document\.getElementById\('sorealIdleMagicValeurV1'\)/,
    "le texte \"Disponible : X / Y\" doit lui aussi suivre le tick lourd, pas seulement le clic"
  );
  assert.match(
    bloc,
    /magicDisponibleTick=Math\.max\(0,idleNombre_\(ressourceMagieEtat\.current\)\)/,
    "doit lire la même valeur vivante que celle mutée juste au-dessus dans ce même tick, jamais un second calcul"
  );
}

console.log("idle-magic-smooth-fill-v1: OK");
