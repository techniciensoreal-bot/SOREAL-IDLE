import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { advanceBasicTrainingStateV411, applyBasicTrainingAllocationsV411, normalizeBasicTrainingStateV411 } from "../src/idle-basic-training.js";

/*
 * Norman (2026-10-05) : « quand je mets des points en trop dans Basic Training, ils n'avancent pas toujours à la ligne suivante quand le niveau est requis ».
 * Cause (observée en ligne, partie B) : l'écran débloque la compétence suivante et y déplace le surplus quelques dixièmes de seconde avant le serveur ; la requête arrivait pendant que le serveur la
 * jugeait encore verrouillée (et sur un entraînement vieux de la dernière synchro) : l'énergie était remise à zéro et rendue à l'énergie libre. Désormais le surplus reste sur la prérequise
 * jusqu'au vrai déblocage, puis passe tout seul (Training Auto Advance).
 */
const T0 = 1_800_000_000_000;
const etatPret = () => {
  const s = normalizeBasicTrainingStateV411({}, T0);
  const a = s.skills.attaque_passive;
  a.level = 4999; a.progress = 0.5; a.cap = 2249; a.allocation = 2249;
  return s;
};
const demande = { attaque_passive: 2249, attaque_reguliere: 20000 };

// Sans Auto Advance : comportement inchangé (la compétence verrouillée ne garde rien).
{
  const r = applyBasicTrainingAllocationsV411(etatPret(), demande, 1e9, 1e9);
  assert.equal(r.state.skills.attaque_reguliere.allocation, 0);
  assert.equal(r.state.skills.attaque_passive.allocation, 2249);
}

// Avec Auto Advance : le surplus reste sur la prérequise, l'énergie n'est pas rendue...
const r = applyBasicTrainingAllocationsV411(etatPret(), demande, 1e9, 1e9, { autoAdvance: true });
assert.equal(r.state.skills.attaque_passive.allocation, 22249, "le surplus attend sur la prérequise");
assert.equal(r.state.skills.attaque_reguliere.allocation, 0);
assert.equal(r.allocated, 22249, "tout reste alloué : rien n'est rendu à l'énergie libre");
assert.equal(demande.attaque_reguliere, 20000, "la demande de l'appelant n'est pas modifiée");

// ... puis passe à la compétence au déblocage réel.
const apres = advanceBasicTrainingStateV411(r.state, T0 + 5000, 30 * 86400, 1, { autoAdvance: true });
assert.ok(apres.state.skills.attaque_passive.level >= 5000);
assert.equal(apres.state.skills.attaque_passive.allocation, apres.state.skills.attaque_passive.cap, "la prérequise garde son cap");
assert.equal(apres.state.skills.attaque_reguliere.allocation, 20000, "le surplus est passé à la ligne suivante");

// Une fois débloquée, la demande suivante de l'écran est appliquée telle quelle.
const r2 = applyBasicTrainingAllocationsV411(apres.state, { attaque_passive: apres.state.skills.attaque_passive.cap, attaque_reguliere: 20000 }, 1e9, 1e9, { autoAdvance: true });
assert.equal(r2.state.skills.attaque_reguliere.allocation, 20000);

// Le serveur amène l'entraînement à l'instant présent avant d'appliquer la répartition.
const rt = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");
assert.ok(/stats\.entrainementBase =\s*advanceBasicTrainingStateV411\(\s*stats\.entrainementBase,\s*Date\.now\(\),/.test(rt) && rt.includes("{ autoAdvance: autoAvance }\n      );"));
console.log("idle-bt-surplus-deblocage-course-v1: OK");
