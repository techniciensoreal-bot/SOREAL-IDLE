import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  BASIC_TRAINING_V411,
  createBasicTrainingStateV411,
  normalizeBasicTrainingStateV411,
  isBasicTrainingSkillUnlockedV411
} from "../src/idle-basic-training.js";

/*
 * Audit NGU 2026-09-23 -- deux bugs confirmés dans contexteMetaNguSorealIdle_ :
 *
 * 1. entrainementBase.skills est un OBJET indexé par id, or le code testait
 *    Array.isArray(...) : attackTrainingLevels valait toujours 0, donc le
 *    facteur "training level" du NUMBER (wiki, Rebirth/NUMBER :
 *    Floor(1 + Attack_Basic_Training_Levels / 10 000)) restait bloqué à 1.
 * 2. basicTrainingComplete lisait skill.unlocked, un champ que l'état ne
 *    contient pas : toujours false, donc Advanced Training (wiki : "unlocked
 *    once both Ultimate Attack and Ultimate Buff are unlocked") ne pouvait
 *    jamais s'ouvrir.
 */

const runtime = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");
const debut = runtime.indexOf("function contexteMetaNguSorealIdle_(");
assert.ok(debut > 0, "contexteMetaNguSorealIdle_ introuvable");
const bloc = runtime.slice(debut, debut + 3500);

assert.ok(
  !/Array\.isArray\(stats\.entrainementBase\.skills\)/.test(bloc),
  "skills est un objet indexé par id : ne plus le filtrer par Array.isArray."
);
assert.ok(
  bloc.includes("normalizeBasicTrainingStateV411(stats.entrainementBase") &&
    bloc.includes("isBasicTrainingSkillUnlockedV411(etatEntrainementBase, def)"),
  "Le déblocage doit être calculé avec la vraie règle (isBasicTrainingSkillUnlockedV411), pas lu depuis un champ inexistant."
);
assert.ok(
  !/skill\.unlocked/.test(bloc.split("basicTrainingComplete")[0]) || bloc.includes("unlocked: isBasicTrainingSkillUnlockedV411"),
  "unlocked doit venir du calcul, pas de l'état."
);

// --- Comportement réel sur l'état du moteur (mêmes exports que le runtime) ---
const etat = normalizeBasicTrainingStateV411(createBasicTrainingStateV411(Date.now()), Date.now());
assert.equal(Array.isArray(etat.skills), false, "l'état stocke bien les skills en objet (c'est la cause du bug)");
assert.equal(Object.keys(etat.skills).length, BASIC_TRAINING_V411.skills.length);

const debloquees = () => BASIC_TRAINING_V411.skills.filter((d) => isBasicTrainingSkillUnlockedV411(etat, d)).length;
assert.equal(
  debloquees(),
  BASIC_TRAINING_V411.skills.filter((d) => !d.prerequisite).length,
  "au départ seuls les entraînements sans prérequis (Idle Attack / Idle Defense) sont débloqués"
);

// On monte chaque entraînement jusqu'au niveau exigé par le suivant : tout doit se débloquer.
let progression = true;
while (progression) {
  progression = false;
  for (const def of BASIC_TRAINING_V411.skills) {
    if (def.prerequisite && !isBasicTrainingSkillUnlockedV411(etat, def)) {
      etat.skills[def.prerequisite].level = def.prerequisiteLevel;
      progression = true;
    }
  }
}
assert.equal(debloquees(), BASIC_TRAINING_V411.skills.length, "tous les entraînements se débloquent quand les prérequis sont remplis");

// Somme des niveaux d'attaque = ce que le NUMBER doit recevoir (jamais 0 une fois des niveaux gagnés)
const niveauxAttaque = BASIC_TRAINING_V411.skills
  .filter((d) => d.id.indexOf("attaque_") === 0)
  .reduce((total, d) => total + Math.max(0, etat.skills[d.id].level), 0);
assert.ok(niveauxAttaque > 0, "des niveaux d'attaque doivent être comptés");
const facteur = Math.max(1, Math.floor(1 + niveauxAttaque / 10000));
assert.ok(facteur > 1, "avec ces niveaux, le facteur NUMBER 'training level' doit dépasser 1");

console.log("idle-basic-training-number-and-advanced-unlock: OK");
