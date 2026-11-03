import assert from "node:assert/strict";
import { lirePagesMeta } from "./_meta-pages.mjs";

/*
 * Norman (2026-11-03) : « les barres de la Machine temporelle font des petits sauts avec le recalcul du temps quand je mets/enlève des ressources ; sur les niveaux rapides ça se voit mieux ».
 * Mesure (navigateur, niveaux de 2 à 4 s) : à chaque clic « + / − » la barre reculait de 5 à 50 points. Cause : le clic recalcule la piste depuis la vue du moteur ; cette vue n'avait aucun repère
 * de temps (posé seulement au dessin complet de la page), donc le temps écoulé depuis la synchro était compté 0 et la barre repartait de la fraction de la synchro. Et même avec un repère, le temps
 * écoulé était plafonné au reste du niveau en cours (plusieurs niveaux franchis entre deux synchros sur une barre rapide). La fraction doit rester CONTINUE : seul le rythme change.
 */
const src = lirePagesMeta();
const d1 = src.indexOf("      function recalculerPisteFractionIdleV1_(k,fraction,alloc){");
const f1 = src.indexOf("      function recalculerPisteAllocIdleV1_");
const d2 = src.indexOf("      function reperePosterVueTimeMachineIdleV1_(j,vue){");
const f2 = src.indexOf("      function ajusterTimeMachineIdleV1_(ressource,mode){");
assert.ok(d1 > 0 && f1 > d1 && d2 > 0 && f2 > d2, "fonctions du recalcul local de la Machine temporelle introuvables");
const source = src.slice(d1, f1) + src.slice(d2, f2);

function lancer({ ecouleMs, niveau, K = 3.6e6, allocAvant = 1e6, allocApres = 2e6, progSec = 0.046, etaSec = null }) {
  const maintenant = 5_000_000;
  const realNow = Date.now;
  Date.now = () => maintenant;
  try {
    const dureeAvant = K / allocAvant; // durée du niveau en cours à l'allocation de la synchro
    const eta = etaSec === null ? dureeAvant - progSec : etaSec;
    const vue = { speedFill: progSec / dureeAvant, speedFraction: progSec / dureeAvant, speedProgressSeconds: progSec, speedEtaSeconds: eta, speedK: K, goldK: null, goldEtaSeconds: null, goldProgressSeconds: 0 };
    const donnees = { speedLevel: niveau, goldLevel: 0 };
    const j = { systemes: { timeMachineView: vue }, __donnees: donnees };
    const perf = { now: () => 10_000 };
    const H = { idleNombre_: (v) => Number(v) || 0, patcherBarresTimeMachineIdleV1_: () => {} };
    const win = { __SOREAL_IDLE_META_HOST_V130__: H };
    const f = new Function("window", "performance", "systemeMetaParIdIdleV130_", "ancreSnapshotIdleV1_",
      source + "\nreturn recalculerTimeMachineLocalIdleV1_;")(
      win, perf, (jj) => ({ state: { data: jj.__donnees } }), () => 10_000 - ecouleMs);
    f(j, "energy", allocApres);
    return { vue, donnees, dureeAvant };
  } finally { Date.now = realNow; }
}

// 1. Barre rapide (niveau de 3,6 s), 1,4 s écoulée depuis la synchro, AUCUN repère de temps encore posé : la fraction affichée au clic (0,0128 + 1,4 / 3,6) ne bouge pas.
{
  const r = lancer({ ecouleMs: 1400, niveau: 20 });
  const attendu = (0.046 + 1.4) / 3.6;
  assert.ok(Math.abs(r.vue.speedFill - attendu) < 1e-9, "fraction continue au changement d'allocation : " + r.vue.speedFill + " vs " + attendu);
  assert.ok(Math.abs(r.vue.speedProgressSeconds - r.vue.speedFill * (3.6e6 / 2e6)) < 1e-9, "progression recalée sur la nouvelle durée");
  assert.ok(Math.abs(r.vue.speedEtaSeconds - (1 - attendu) * 1.8) < 1e-9, "temps restant à la nouvelle vitesse");
  assert.equal(r.donnees.speedLevel, 20, "aucun niveau franchi");
}
// 2. Plusieurs niveaux franchis depuis la synchro (écoulé > reste du niveau) : la fraction est celle du niveau en cours, pas 100 %, et le niveau suit.
{
  // niveau 20 (n = 21) : durée 3,6 s ; 3,554 s restantes ; 5 s écoulées -> niveau suivant (n = 22) dure 3,6 x 22 / 21 s, reste 5 - 3,554 = 1,446 s écoulée dedans
  const r = lancer({ ecouleMs: 5000, niveau: 20 });
  const duree2 = 3.6 * 22 / 21;
  const ecouleDedans = 5 - (3.6 - 0.046);
  assert.equal(r.donnees.speedLevel, 21, "un niveau franchi");
  assert.ok(Math.abs(r.vue.speedFill - ecouleDedans / duree2) < 1e-9, "fraction du niveau en cours : " + r.vue.speedFill);
  assert.ok(Math.abs(r.vue.speedK - 3.6e6 * 22 / 21) < 1e-3, "K de la piste suit le niveau");
}
// 3. Aucun temps écoulé : la fraction de la synchro est conservée telle quelle.
{
  const r = lancer({ ecouleMs: 0, niveau: 5 });
  assert.ok(Math.abs(r.vue.speedFill - 0.046 / 3.6) < 1e-9);
}
// 4. Source : aucun plafond du temps écoulé au reste du niveau, le repère vient du moteur (pas du dessin).
assert.ok(!/Math\.min\(ecoule,Math\.max\(0,Number\(eta\)\)\)/.test(src), "le temps écoulé ne doit plus être plafonné au reste du niveau");
assert.ok(/reperePosterVueTimeMachineIdleV1_\(j,vue\);\s*const magic=/.test(src), "le repère est posé dès la vue du moteur");
console.log("idle-machine-temporelle-progression-continue-v1 : OK");
