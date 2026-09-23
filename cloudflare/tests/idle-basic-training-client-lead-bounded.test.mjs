import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Audit NGU 2026-09-23 : le client applique une allocation d'énergie tout de
 * suite mais le serveur ne la reçoit qu'après un délai (debounce + réseau) ;
 * la fusion client/serveur gardait ensuite la valeur la PLUS HAUTE pour
 * toujours, si bien que l'avance du client n'était jamais résorbée et
 * l'affichage dérivait au-dessus de la vérité serveur à chaque changement
 * d'allocation. L'avance tolérée est désormais bornée à 3 s de gain à la
 * vitesse courante (2 niveaux au minimum) ; au-delà, le serveur fait foi.
 */

const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const debut = ui.indexOf("function fusionnerBasicTrainingPlusAvanceIdleV166_(");
assert.ok(debut > 0, "fusionnerBasicTrainingPlusAvanceIdleV166_ introuvable");
const fin = ui.indexOf("function appliquerEtatBasicTrainingIdleV120_(", debut);
const source = ui.slice(debut, fin);

const fusionner = new Function(
  "idleNombre_",
  "idleEntier_",
  source + "\nreturn fusionnerBasicTrainingPlusAvanceIdleV166_;"
)(
  (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; },
  (v) => Math.max(0, Math.floor(Number(v) || 0))
);

const skill = (level, progress, extra = {}) => ({ id: "attaque_passive", cap: 2500, allocation: 500, level, progress, levelsPerSecond: 10, ...extra });
const etat = (s) => ({ skills: [s] });

// Avance normale (latence) : le client garde sa valeur, pas de recul visible
{
  const r = fusionner(etat(skill(1010, 0.4)), etat(skill(1000, 0.4)));
  assert.equal(r.skills[0].level, 1010, "10 niveaux d'avance à 10 niveaux/s (1 s) restent tolérés");
}
// Avance excessive : dérive à corriger, le serveur fait foi
{
  const r = fusionner(etat(skill(1100, 0.2)), etat(skill(1000, 0.4)));
  assert.equal(r.skills[0].level, 1000, "100 niveaux d'avance (10 s de gain) : on revient au serveur");
  assert.ok(Math.abs(r.skills[0].progress - 0.4) < 1e-9);
}
// Le serveur en avance l'emporte toujours
{
  const r = fusionner(etat(skill(990, 0.9)), etat(skill(1000, 0.1)));
  assert.equal(r.skills[0].level, 1000);
}
// Vitesse nulle : tolérance minimale de 2 niveaux
{
  const r = fusionner(etat(skill(1005, 0)), etat(skill(1000, 0, { levelsPerSecond: 0 })));
  assert.equal(r.skills[0].level, 1000, "avance de 5 niveaux sans gain en cours : serveur");
  const r2 = fusionner(etat(skill(1001, 0)), etat(skill(1000, 0, { levelsPerSecond: 0 })));
  assert.equal(r2.skills[0].level, 1001, "1 niveau d'avance reste toléré");
}
// L'allocation choisie localement est toujours conservée
{
  const r = fusionner(etat(skill(1000, 0, { allocation: 777 })), etat(skill(1000, 0, { allocation: 500 })));
  assert.equal(r.skills[0].allocation, 777);
}

console.log("idle-basic-training-client-lead-bounded: OK");
