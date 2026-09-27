import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Norman (2026-09-27) : « Dans Augmentation, on ne doit voir que les menus débloqués et le prochain. Les autres ne doivent
 * apparaitre que quand on a les pré requis. » AGENTS.md, règle n°2 (anti-spoil) : un système encore verrouillé n'apparaît pas
 * du tout -- ni nom, ni seuil ("bats le boss N"). Avant ce correctif, pageAugmentationsIdleV48_ (meta-progression-v130.js)
 * envoyait TOUTES les paires d'IDLE_NGU_AUGMENTATIONS en clair (nom + "Boss N"), quel que soit le boss max du joueur.
 */
const module_ = readFileSync("cloudflare/public/modules/meta-progression-v130.js", "utf8");
const page = module_.slice(module_.indexOf("function pageAugmentationsIdleV48_(j)"), module_.indexOf("function pageTimeMachineIdleV48_(j)"));

// 1. Troncature à la première paire non débloquée -- même principe que Basic Training (premierVerrouille).
assert.match(page, /premierVerrouilleIndex=defs\.findIndex\(function\(def\)\{return boss<[^;]+;\}\)/, "cherche la première paire non débloquée");
assert.match(page, /defsVisibles=premierVerrouilleIndex<0\?defs:defs\.slice\(0,premierVerrouilleIndex\+1\)/, "tronque au premier verrou (débloqués + le prochain)");
assert.match(page, /defsVisibles\.map/, "seules les paires visibles sont rendues, jamais le tableau complet defs");

// 2. La paire verrouillée montrée ensuite ne révèle ni son nom, ni son seuil.
assert.match(page, /if\(!mainOk\)\{[\s\S]{0,300}🔒 \?\?\?\?\?\?\?/, "paire verrouillée : nom remplacé par un placeholder");
{
  const brancheVerrouillee = page.slice(page.indexOf("if(!mainOk){"), page.indexOf("const upgradeOk="));
  assert.ok(!brancheVerrouillee.includes("def.name"), "jamais le vrai nom pour une paire verrouillée");
  assert.ok(!brancheVerrouillee.includes("unlockBoss"), "jamais le seuil \"Boss N\" pour une paire verrouillée");
}

// 3. L'Upgrade d'une paire déjà débloquée reste lui-même masqué (nom de l'upgrade jamais montré séparément, pas de seuil) tant qu'il n'est pas atteint.
{
  const brancheUpgrade = page.slice(page.indexOf("const upgradeOk="), page.indexOf(").join('')+'</div>';"));
  assert.match(brancheUpgrade, /upgradeOk\?' · Upgrade '/, "\"Upgrade N\" seulement une fois l'upgrade débloqué");
  assert.match(brancheUpgrade, /upgradeOk\?track\(def,pair,true,true\):'<div[^']*>🔒 Upgrade verrouillé\./, "upgrade verrouillé : placeholder générique, jamais son coût/sa progression");
}

console.log("idle-anti-spoil-augmentations-v1: OK");
