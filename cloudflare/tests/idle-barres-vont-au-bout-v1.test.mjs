import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { lireUiComplet } from "./_ui-sources.mjs";
import { lirePagesMeta } from "./_meta-pages.mjs";

/*
 * Norman (2026-11-01) : « Assure-toi que les barres fassent tout leur mouvement du début à la fin ; certaines, notamment Augmentations, ne frappent jamais le bout de la barre avant de repartir. »
 * Mesuré dans le navigateur (partie de test, cycle de 0,4 s) : la barre d'Augmentation était annulée puis recréée à chaque niveau (la durée grandit) quand elle n'était qu'à 72-95 % de sa course (médiane 88 %),
 * parce qu'une animation dont on règle currentTime reste « en attente » jusqu'à la prochaine image peinte et démarre donc une image après le calcul du jeu. Après correction (heure de départ posée sur
 * l'horloge du jeu) l'animation précédente est à 100 % (déjà rebouclée) au moment du remplacement.
 */
const ui = lireUiComplet();
const debut = ui.indexOf("function animerBarreCycliqueIdleV217_(el,seconds,progress,tenir){");
assert.ok(debut > 0, "moteur d'animation des barres cycliques");
const corps = ui.slice(debut, debut + 5200);
assert.ok(/animation\.startTime\s*=\s*performance\.now\(\)\s*-\s*phaseDepart\s*\*\s*duration/.test(corps), "la nouvelle animation démarre à l'heure du jeu (startTime), pas via currentTime en attente");
assert.ok(!/animation\.currentTime\s*=\s*Math\.max\(0,Math\.min\(\.999999,idleNombre_\(progress\)\)\)\*duration/.test(corps), "plus de currentTime posé sur une animation toute neuve");

const wandoos = readFileSync(new URL("../public/modules/wandoos-retro-v1.js", import.meta.url), "utf8");
assert.ok(wandoos.includes("var affichee=Math.min(1,f/(1-Math.min(.15,Math.max(.004,.04*v))));"), "Wandoos : la fin du cycle reste pleine");
const ngu = readFileSync(new URL("../public/modules/ngu-labo-v1.js", import.meta.url), "utf8");
assert.ok(ngu.includes("Math.min(1,frac/(1-Math.min(.15,Math.max(.004,.04/splMaintenant))))"), "NGU : la fin du cycle reste pleine");
const meta = lirePagesMeta();
assert.ok(meta.includes("__atVuV1") && meta.includes("avant.p<0.97"), "Entraînement avancé : une image pleine au passage d'un niveau");

/* Simulation pure de la largeur affichée (même formule que Wandoos et NGU) : à la fin du cycle, la valeur vaut 100 % AVANT le retour à 0. */
const affichee = (frac, cycleSecondes) => Math.min(1, frac / (1 - Math.min(0.15, Math.max(0.004, 0.04 / cycleSecondes))));
for (const cycle of [0.1, 0.3, 1, 5, 60, 3600]) {
  const h = Math.min(0.15, Math.max(0.004, 0.04 / cycle));
  assert.equal(affichee(0, cycle), 0, "début de cycle : 0");
  assert.equal(affichee(1 - h, cycle), 1, "cycle " + cycle + " s : 100 % atteint avant la fin du cycle");
  assert.equal(affichee(0.999999, cycle), 1, "dernière fraction du cycle : 100 %");
  let prec = 0;
  for (let i = 0; i <= 1000; i += 1) {
    const v = affichee(i / 1000 * 0.999999, cycle);
    assert.ok(v >= prec - 1e-12, "jamais de recul dans un cycle (" + cycle + " s)");
    prec = v;
  }
  assert.equal(prec, 1, "le maximum d'un cycle est 100 %");
}

console.log("idle-barres-vont-au-bout-v1: OK");
