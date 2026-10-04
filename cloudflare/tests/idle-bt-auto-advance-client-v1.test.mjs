import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-10-04) : « j'ai acheté Auto Advance de Basic Training, j'ai mis 2329 dans Attaque passive (capée à 89) ; une fois les 5 000 niveaux atteints, l'énergie en trop n'est pas passée dans le menu débloqué. »
 * Cause : le transfert n'existait que côté serveur ; pendant qu'on est dans le menu d'entraînement la page ne reprend pas l'état du serveur (basic-training-stability-v121.js), donc elle gardait l'ancienne
 * répartition et la renvoyait au serveur au clic suivant. Le déblocage local fait maintenant le même transfert et l'envoie.
 */
const ui = readFileSync("cloudflare/public/soreal-idle-ui.js", "utf8");
const debut = ui.indexOf("      function autoAdvanceBasicTrainingActifIdleV1_(){");
const fin = ui.indexOf("      function progresserBasicTrainingLocalIdleV120_(");
assert.ok(debut > 0 && fin > debut);
const source = ui.slice(debut, fin);

function lancer({ achete, skills, menu = "aventure" }) {
  const envois = [];
  const etat = { systemes: { bonuses: { basicTrainingAutoAdvance: achete } } };
  const bt = { skills };
  const f = new Function("idleEtat", "basicTrainingIdleV120_", "idleNombre_", "idleEntier_", "idleMenuActifV28", "programmerEnvoiBasicTrainingIdleV120_", "document", "pageEntrainementIdleV28_", "rafraichirBasicTrainingIdleV120_",
    source + "\nreturn actualiserDeblocagesBasicTrainingLocalIdleV120_;")(etat, () => bt, (v) => Number(v) || 0, (v) => Math.max(0, Math.floor(Number(v) || 0)), menu, (d) => envois.push(d), { querySelector: () => null }, () => "", () => {});
  const change = f();
  return { change, envois, skills };
}
const base = () => [
  { id: "attaque_passive", unlocked: true, level: 5000, allocation: 2329, cap: 89, prerequisite: null },
  { id: "attaque_reguliere", unlocked: false, level: 0, allocation: 0, cap: 500, prerequisite: "attaque_passive", prerequisiteLevel: 5000 },
  { id: "attaque_renforcee", unlocked: false, level: 0, allocation: 0, cap: 900, prerequisite: "attaque_reguliere", prerequisiteLevel: 10000 }
];

// Achat fait : au déblocage, l'énergie au-delà du cap passe à la compétence débloquée ; la répartition est envoyée au serveur.
{
  const r = lancer({ achete: true, skills: base() });
  assert.equal(r.change, true);
  assert.equal(r.skills[0].allocation, 89, "la prérequise garde exactement son cap");
  assert.equal(r.skills[1].allocation, 2240, "le surplus (2329 - 89) passe à la suivante");
  assert.equal(r.skills[0].allocation + r.skills[1].allocation, 2329, "l'énergie totale ne change pas");
  assert.equal(r.skills[1].unlocked, true);
  assert.deepEqual(r.envois, [30], "envoyé au serveur");
}
// Cascade : deux déblocages d'un coup font suivre le surplus.
{
  const s = base(); s[0].level = 12000; s[1].level = 10000;
  const r = lancer({ achete: true, skills: s });
  assert.deepEqual(r.skills.map((x) => x.allocation), [89, 500, 1740]);
}
// Sans l'achat, ou énergie pile au cap : rien ne bouge, rien n'est envoyé.
{
  const r = lancer({ achete: false, skills: base() });
  assert.equal(r.skills[0].allocation, 2329); assert.equal(r.skills[1].allocation, 0); assert.equal(r.skills[1].unlocked, true); assert.deepEqual(r.envois, []);
  const s = base(); s[0].allocation = 89;
  const r2 = lancer({ achete: true, skills: s });
  assert.equal(r2.skills[0].allocation, 89); assert.equal(r2.skills[1].allocation, 0); assert.deepEqual(r2.envois, []);
}
// Une compétence déjà débloquée n'est jamais retouchée (seulement « each time a skill is unlocked »).
{
  const s = base(); s[1].unlocked = true; s[1].allocation = 7;
  const r = lancer({ achete: true, skills: s });
  assert.equal(r.skills[0].allocation, 2329); assert.equal(r.skills[1].allocation, 7);
}
console.log("idle-bt-auto-advance-client-v1: OK");
