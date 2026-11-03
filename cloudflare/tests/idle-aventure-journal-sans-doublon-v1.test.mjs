import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { lireUiComplet, extraireFonction } from "./_ui-sources.mjs";

/*
 * Norman (2026-11-03) : le journal de combat d'Aventure montrait « Vous frappez X pour N dégâts ! / Vous avez vaincu X ! » deux fois de suite, puis un seul butin.
 * Cause mesurée dans le vrai moteur local : un combat fini dans la page reste ACTIF (PV pleins) côté moteur jusqu'à resolveZoneFight. Une réponse calculée avant et reçue
 * entre la fin locale et l'envoi de la résolution (action de la page en cours + synchro derrière) rouvrait ce combat : même ennemi, PV pleins, tué une seconde fois,
 * une seule résolution donc un seul butin. Correction à la source : tant que la fin locale n'est pas confirmée par la réponse de la résolution,
 * garderFinCombatLocaleIdleV1_ garde le combat local (inactif) dans toute réponse adoptée. Jamais de dédoublonnage du journal.
 */
const ui = lireUiComplet();
const garder = extraireFonction(ui, "garderFinCombatLocaleIdleV1_");

function monde(etatLocal, repere) {
  const aventure = (j) => (j && j.systemes && j.systemes.adventure) || null;
  const sandbox = {
    idleFinCombatLocaleV1: repere,
    idleEtat: etatLocal,
    aventureMetaIdleV47_: aventure,
    joueurAvecAdventureIdleV208_: (j, a) => ({ ...j, systemes: { ...j.systemes, adventure: a } }),
    Date
  };
  vm.runInNewContext(garder, sandbox);
  return sandbox;
}
const joueur = (fight) => ({ id: "J1", systemes: { adventure: { selectedZone: "tutorial", fight } } });
const actif = { active: true, monsterHp: 8700, monsterHpMax: 8700, mobName: "Volée" };
const fini = { active: false, monsterHp: 0, monsterHpMax: 8700, mobName: "Volée" };

// 1. Fin locale non confirmée + réponse plus ancienne qui rend le combat actif : le combat local (fini) est gardé.
{
  const w = monde(joueur(fini), Date.now());
  const rep = joueur(actif);
  const out = w.garderFinCombatLocaleIdleV1_(rep);
  assert.equal(out.systemes.adventure.fight.active, false, "le combat fini dans la page ne doit pas être rouvert par une réponse plus ancienne");
  assert.equal(out.systemes.adventure.fight.monsterHp, 0);
  assert.equal(out.systemes.adventure.selectedZone, "tutorial", "le reste de l'Aventure vient bien de la réponse");
  assert.equal(rep.systemes.adventure.fight.active, true, "la réponse d'origine n'est pas modifiée");
}
// 2. Fin confirmée (repère à 0, réponse de la résolution reçue) : la réponse du moteur fait foi, ex. le combat suivant.
{
  const w = monde(joueur(fini), 0);
  const rep = joueur(actif);
  assert.equal(w.garderFinCombatLocaleIdleV1_(rep), rep, "sans fin locale en attente, la réponse est adoptée telle quelle");
}
// 3. Un combat local ACTIF n'est jamais touché.
{
  const w = monde(joueur(actif), Date.now());
  const rep = joueur(actif);
  assert.equal(w.garderFinCombatLocaleIdleV1_(rep), rep);
}
// 4. Réponse sans combat actif : rien à garder.
{
  const w = monde(joueur(fini), Date.now());
  const rep = joueur(fini);
  assert.equal(w.garderFinCombatLocaleIdleV1_(rep), rep);
}
// 5. Repli : sans confirmation au bout de 15 s (résolution perdue), la garde tombe et ne bloque pas les combats suivants.
{
  const w = monde(joueur(fini), Date.now() - 16000);
  const rep = joueur(actif);
  assert.equal(w.garderFinCombatLocaleIdleV1_(rep), rep);
  assert.equal(w.idleFinCombatLocaleV1, 0);
}

// Câblage : posée à la fin locale (victoire ET défaite), levée par la réponse de la résolution, appliquée à toutes les réponses adoptées.
const terminer = extraireFonction(ui, "terminerCombatAdventureLocalV2_");
assert.match(terminer, /fight\.active=false;\s*idleFinCombatLocaleV1=Date\.now\(\);/, "la fin locale doit poser la garde juste après fight.active=false");
const protege = extraireFonction(ui, "protegerJoueurServeurInventaireIdleV208_");
assert.match(protege, /joueur=garderFinCombatLocaleIdleV1_\(joueur\)/, "toute réponse protégée (synchro, actions, Augmentations) passe par la garde");
assert.match(ui, /res\.joueur=garderFinCombatLocaleIdleV1_\(res\.joueur\);\s*\n\s*(?:\/\*[^\n]*\*\/\s*)?if\(!appliquerSynchroCombatSansReflowIdleV116_\(res\.joueur\)\)/, "la réponse d'une mutation d'inventaire passe aussi par la garde");
const meta = readFileSync(new URL("../public/modules/meta-progression-v130.js", import.meta.url), "utf8");
assert.match(meta, /function finCombatLocaleRecueV1_\(payload\)[\s\S]*resolveZoneFight[\s\S]*loseZoneFight[\s\S]*idleFinCombatLocaleV1=0/);
assert.equal((meta.match(/finCombatLocaleRecueV1_\(payload\);/g) || []).length, 2, "levée dans la réponse ET dans l'échec de l'appel");
// Aucun dédoublonnage cosmétique du journal.
const journal = extraireFonction(ui, "ajouterLogAventureIdleV1_");
assert.ok(!/dernier|doublon|===\s*texte/i.test(journal), "le journal ne filtre pas les lignes identiques");

console.log("ok idle-aventure-journal-sans-doublon-v1");
