import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-24) : « au-dessus de la barre d'énergie, un compteur avec le total réellement généré et non le total actuel, pour
 * savoir combien il nous reste à partager. Combien de dispo dans la barre verte et combien déjà généré au-dessus. » puis : « Non, je
 * voulais que Généré soit en haut à droite, à la place du compteur qui fait doublon avec celui de la barre verte. »
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const css = readFileSync("cloudflare/public/soreal-idle-ui.css", "utf8");

// Balisage : « Généré » est en haut à droite (à la place du doublon « (+1) dispo / cap ⚡ »), la barre verte garde le disponible.
const panneau = ui.slice(ui.indexOf("function rendreBarreEnergiePersistanteIdleV1_(j){"), ui.indexOf("function formatDureeRunIdleV1_"));
const haut = panneau.slice(panneau.indexOf('id="sorealIdleEnergieValeurV4"'), panneau.indexOf('id="sorealIdleEnergySpeedV34"'));
assert.match(haut, /texteEnergieGenereeIdleV1_\(\)/, "haut à droite = Généré");
assert.ok(!/energieDisponibleIdleV9_\(\)/.test(haut) && !/gainParTickEnergieIdleV34_/.test(haut), "plus de doublon avec la barre verte en haut à droite");
assert.ok(!panneau.includes("sorealIdleEnergieGenereeV1"), "pas de ligne supplémentaire au-dessus de la barre");
assert.match(panneau.slice(panneau.indexOf('id="sorealIdleEnergyOverlayV1"')), /energieDisponibleIdleV9_\(\)/, "la barre verte affiche toujours le disponible");
assert.ok(!css.includes("soreal-idle-energy-generated-v1"), "style de l'ancienne ligne retiré");

// Calcul : généré = disponible (barre verte) + déjà placé (Basic Training + tous les systèmes).
const debut = ui.indexOf("function energieGenereeTotaleIdleV1_(){");
const fin = ui.indexOf("function rafraichirEnergieEtBoutonsIdleV9_(){");
const src = ui.slice(debut, fin);
function calculer({ energie = 0, btAlloue = 0, metaAlloue = 0, max = 500, prod }) {
  const fabrique = new Function("idleEtat", "energieDisponibleIdleV9_", "totalAllocationBasicTrainingIdleV120_", "allocationMetaEnergieIdleV1_", "formatEnergieIdleV50_", "idleEntier_", "idleNombre_",
    src + "\nreturn {total:energieGenereeTotaleIdleV1_,texte:texteEnergieGenereeIdleV1_};");
  const etat = { energieMax: max, productionSeconde: prod };
  const r = fabrique(etat, () => energie, () => btAlloue, () => metaAlloue, (v) => String(Math.floor(v)), (v) => Math.floor(Number(v) || 0), (v) => Number(v) || 0);
  return { total: r.total(), texte: r.texte() };
}
assert.equal(calculer({ energie: 50, btAlloue: 200, metaAlloue: 250 }).total, 500, "50 dispo + 200 Basic Training + 250 ailleurs = 500 générés");
assert.equal(calculer({ energie: 50, btAlloue: 200, metaAlloue: 250 }).texte, "🔋 Généré : 500 / 500 · ✅ Énergie pleine");
assert.equal(calculer({ energie: 250, btAlloue: 0, metaAlloue: 0 }).texte, "🔋 Généré : 250 / 500", "rien de placé : identique à la barre verte");
assert.equal(calculer({ energie: 0, btAlloue: 0, metaAlloue: 0 }).total, 0);

// Compteur de temps (Norman, 2026-09-25) : dans combien de temps toute l'énergie sera générée = (cap - déjà généré) / production par seconde.
assert.equal(calculer({ energie: 250, max: 500, prod: 0.25 }).texte, "🔋 Généré : 250 / 500 · ⏱ Pleine dans 16 min 40 s");
assert.equal(calculer({ energie: 78, max: 1000, prod: 1 }).texte, "🔋 Généré : 78 / 1000 · ⏱ Pleine dans 15 min 22 s", "exemple de Norman : 15 min 22 s");
assert.equal(calculer({ energie: 100, btAlloue: 150, metaAlloue: 0, max: 500, prod: 1 }).texte, "🔋 Généré : 250 / 500 · ⏱ Pleine dans 4 min 10 s", "l'énergie déjà placée compte comme générée");
assert.equal(calculer({ energie: 0, max: 5000, prod: 1 }).texte, "🔋 Généré : 0 / 5000 · ⏱ Pleine dans 1 h 23 min 20 s");
assert.equal(calculer({ energie: 0, max: 200000, prod: 1 }).texte, "🔋 Généré : 0 / 200000 · ⏱ Pleine dans 2 j 7 h 33 min");
assert.equal(calculer({ energie: 500, max: 500, prod: 1 }).texte, "🔋 Généré : 500 / 500 · ✅ Énergie pleine");
assert.equal(calculer({ energie: 10, max: 500, prod: 0 }).texte, "🔋 Généré : 10 / 500", "sans production : pas de compteur");
assert.equal(calculer({ energie: 0, max: 61, prod: 1 }).texte, "🔋 Généré : 0 / 61 · ⏱ Pleine dans 1 min 1 s");

// Rafraîchi à chaque tick et à chaque action (les deux fonctions qui écrivent le haut du panneau d'énergie).
assert.equal((ui.match(/energieEl\.textContent\s*=\s*texteEnergieGenereeIdleV1_\(\);/g) || []).length, 2, "mis à jour en même temps que la barre (tick local et rafraîchissement)");

console.log("idle-energy-generated-counter-v1: OK");
