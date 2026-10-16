import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { extraireFonction } from "./_ui-sources.mjs";

/*
 * Norman (2026-10-16) : « l'état du personnage est déterminé par les événements du gameplay, jamais par l'onglet affiché. » Un niveau d'Augmentations gagné pendant qu'un AUTRE menu est ouvert doit agir tout de suite
 * sur la vie max et l'attaque du combat local, sans ouvrir le menu Augmentations, sans nouvelle minuterie ni synchro supplémentaire.
 * Cause d'origine : le rejeu local des niveaux (mettreAJourJeuIdleLocalV7_) cherchait d'abord la barre dans la page et s'arrêtait si elle n'y était pas, et le repère visuel n'était recalé sur le serveur qu'avec
 * le menu Augmentations ouvert.
 */
const lire = (f) => readFileSync("cloudflare/public/modules/" + f, "utf8").replace(/\r\n/g, "\n");
const boucle = lire("ui-boucle-v1.js");
const combat1 = lire("ui-combat-1-v1.js");
const noyau = lire("ui-noyau-v1.js");
const pageAug = lire("augmentations-page-v1.js");

function scenario(menu) {
  let requetes = 0, synchros = 0;
  const monnaies = { gold: 1e9 };
  const REG = {
    idleMenuActifV28: menu,
    idleEtat: {
      systemes: { currencies: monnaies, augmentations: [{ id: "a", baseMultiplier: 1, exponent: 1 }] },
      combatPrincipal: { multiplicateurAttaqueTotal: 6, multiplicateurDefenseTotal: 6 }
    }
  };
  const sandbox = {
    REG, PAGE_ACTIVE: "idle", idleAugSyncV1: 0, console,
    performance: { now: () => 20000 },
    document: { querySelector() { requetes++; return null; }, getElementById() { return null; } },
    window: {},
    idleNombre_: (x) => Number(x) || 0,
    idleEntier_: (x) => Math.floor(Number(x) || 0),
    patcherResumeStatsIdleV28_() {},
    synchroniserJeuIdleV7_() { synchros++; },
    ecrireSiChangeIdleV1_() {}, formatEntierLisibleIdleV1_: String, formatGrandNombreIdleV70_: String, animerBarreCycliqueIdleV217_() {},
    elementAugIdleV1_: (sel) => { requetes++; return null; }
  };
  vm.createContext(sandbox);
  // fonctions réelles : rejeu des cycles (page Augmentations), répercussion sur le combat, étape du tick
  vm.runInContext(extraireFonction(pageAug, "rejouerCyclesAugmentIdleV1_") + "\nwindow.__rejouerCyclesAugmentIdleV1__=rejouerCyclesAugmentIdleV1_;", sandbox);
  vm.runInContext(extraireFonction(combat1, "appliquerAugmentsSurCombatIdleV1_"), sandbox);
  vm.runInContext(extraireFonction(boucle, "mettreAJourJeuIdleLocalV7__p6"), sandbox);
  // repère du serveur : niveau 10, une seconde par niveau, repère posé il y a 10 s
  const visual = {
    at: 10000, base: { mult: 1 + 10 * 0.5, additif: 10 }, appliedRatio: 1,
    defs: { a: { progress: 0, seconds: 1, waiting: false, goldCost: 1, level: 10, upgradeProgress: 0, upgradeSeconds: 0, upgradeWaiting: false, upgradeGoldCost: 0, upgradeLevel: 0 } }
  };
  const niveaux = {};
  sandbox.__visual = visual; sandbox.__niveaux = niveaux;
  vm.runInContext("mettreAJourJeuIdleLocalV7__p6(__visual,__niveaux)", sandbox);
  return { REG, niveaux, requetes, synchros, visual };
}

// Test A / E : menu « combat » ouvert (pas Augmentations) : les niveaux sont rejoués et la vie max (attaque × 10) suit.
const ailleurs = scenario("combat");
assert.ok(ailleurs.niveaux["a:main"] > 10, "les niveaux gagnés sont rejoués hors de la page Augmentations : " + JSON.stringify(ailleurs.niveaux));
// Test F : aucune recherche dans la page hors du menu Augmentations, aucune synchro supplémentaire.
assert.equal(ailleurs.requetes, 0, "aucune lecture de la page (pas de surcoût hors du menu)");
assert.equal(ailleurs.synchros, 0, "aucune synchro supplémentaire déclenchée par ce rejeu");

// Mêmes valeurs que le menu ouvert (même formule, une seule source) : le résultat ne dépend pas de l'onglet.
const surPage = scenario("augmentations");
assert.equal(surPage.niveaux["a:main"], ailleurs.niveaux["a:main"], "mêmes niveaux, que le menu soit ouvert ou non");

// Trajectoire serveur (tous les systèmes) : l'attaque et la défense de combat suivent les valeurs futures annoncées, à l'heure dite, sans page ni minuterie.
function trajectoire(msEcoule, tr, extra = {}) {
  const cp = { multiplicateurAttaqueTotal: 6, multiplicateurDefenseTotal: 4, trajectoire: tr, ...extra };
  const sb = { REG: { idleEtat: { combatPrincipal: cp, __recuPerfV1: 1000 } }, performance: { now: () => 1000 + msEcoule }, window: {}, idleNombre_: (x) => Number(x) || 0 };
  vm.createContext(sb);
  vm.runInContext(extraireFonction(combat1, "appliquerTrajectoireStatsIdleV1_"), sb);
  vm.runInContext("appliquerTrajectoireStatsIdleV1_()", sb);
  return cp;
}
const tr = [{ t: 1000, a: 8, d: 6 }, { t: 2000, a: 8, d: 6 }, { t: 4000, a: 12, d: 10 }];
assert.equal(trajectoire(0, tr).multiplicateurAttaqueTotal, 6, "avant tout changement : la valeur de la synchro");
assert.equal(trajectoire(500, tr).multiplicateurAttaqueTotal, 7, "entre deux points : interpolation");
assert.equal(trajectoire(500, tr).multiplicateurDefenseTotal, 5);
assert.equal(trajectoire(1500, tr).multiplicateurAttaqueTotal, 8, "palier tenu");
assert.equal(trajectoire(3000, tr).multiplicateurAttaqueTotal, 10);
assert.equal(trajectoire(60000, tr).multiplicateurAttaqueTotal, 12, "après le dernier point : la dernière valeur");
assert.equal(trajectoire(500, []).multiplicateurAttaqueTotal, 6, "aucun changement annoncé : rien ne bouge");
assert.equal(trajectoire(500, undefined).multiplicateurAttaqueTotal, 6, "ancien serveur sans trajectoire : rien ne bouge");

// Garde de structure : le rejeu ne dépend plus de la page, et le repère est recalé à CHAQUE synchro, quel que soit le menu.
const p6 = extraireFonction(boucle, "mettreAJourJeuIdleLocalV7__p6");
assert.ok(p6.indexOf("niveauxAugmentsLocaux[id+':'+x[0]]=nivAffiche") < p6.indexOf("if(!el)return;"), "le niveau rejoué est enregistré AVANT toute dépendance à un élément de la page");
assert.ok(!/if\(!el\)return;[\s\S]{0,40}const secondes0/.test(p6), "pas d'arrêt sur l'absence de l'élément avant le rejeu");
assert.ok(!noyau.includes("REG.idleMenuActifV28==='augmentations'&&REG.idleEtat&&typeof window.__adopterRepereAugmentsIdleV1__"), "le repère des Augmentations n'est plus recalé seulement avec le menu ouvert");
assert.ok(noyau.includes("if(REG.idleEtat&&typeof window.__adopterRepereAugmentsIdleV1__==='function')"));
assert.ok(/appliquerTrajectoireStatsIdleV1_\(\);\s*const augVisual=/.test(boucle), "la trajectoire est appliquée par le tick existant, avant le combat, quel que soit le menu");
assert.ok(!/setInterval\([^)]*trajectoire/i.test(boucle + combat1), "aucune minuterie pour la trajectoire");
// Test F : pas de minuterie ajoutée pour ça.
assert.ok(!/setInterval\([^)]*augment/i.test(boucle + noyau), "aucune minuterie permanente ajoutée pour les Augmentations");

// Règle n°5 d'AGENTS.md : une seule voie pour changer les multiplicateurs de combat côté client (la trajectoire du serveur) ; aucun module ne les réécrit « à la main » pour un système particulier.
import { readdirSync } from "node:fs";
const ecritures = [];
for (const f of readdirSync("cloudflare/public/modules").filter((x) => x.endsWith(".js"))) {
  const t = lire(f);
  for (const mm of t.matchAll(/.multiplicateur(?:Attaque|Defense)Totals*=(?!=)/g)) {
    const debut = t.lastIndexOf("function ", mm.index);
    ecritures.push(f + ":" + t.slice(debut, debut + 60).split("(")[0]);
  }
}
assert.deepEqual([...new Set(ecritures)].sort(), ["ui-combat-1-v1.js:function appliquerTrajectoireStatsIdleV1_"], "seule la trajectoire écrit les multiplicateurs de combat : " + ecritures.join(", "));
console.log("idle-augments-instantanes-v1: OK");
