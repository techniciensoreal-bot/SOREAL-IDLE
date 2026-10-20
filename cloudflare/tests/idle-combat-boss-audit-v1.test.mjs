import assert from "node:assert/strict";
import { lireUiComplet } from "./_ui-sources.mjs";
import { readFileSync } from "node:fs";

/*
 * Audit de Combat de boss (Norman, 2026-10-05 : « fais un audit de Combat de boss uniquement »). Mesuré en local, page ouverte au repos : ~40 modifications de page par seconde, dont ~30 venaient de
 * l'actualisation des commandes (texte du délai de réapparition vidé, classe « ready » reposée, boutons Fight et Fuite réassignés) à CHAQUE passage même sans changement (~2,5 par seconde après correction : les PV qui
 * bougent vraiment). Les synchros pendant un combat (toutes les 4 s) et la synchro qui suit le lancement d'un combat restent : elles gardent l'écran fidèle au serveur (Norman, 2026-10-03).
 */
const ui = lireUiComplet();
const a = ui.indexOf("      function actualiserCooldownBossIdleV100_(");
const b = ui.indexOf("      function transitionMortBossIdleV61_(){");
assert.ok(a > 0 && b > a);
const src = ui.slice(a, b);
let ecritures = 0;
function noeud(initial) {
  const classes = new Set(initial.classes || []);
  return {
    _t: initial.texte || "", _d: Boolean(initial.disabled),
    get textContent() { return this._t; }, set textContent(v) { ecritures += 1; this._t = v; },
    get disabled() { return this._d; }, set disabled(v) { ecritures += 1; this._d = v; },
    classList: { contains: (c) => classes.has(c), add: (c) => { ecritures += 1; classes.add(c); } }
  };
}
const respawn = noeud({ classes: ["ready"] });
const start = noeud({ disabled: false });
const fuite = noeud({ disabled: true });
const document = { getElementById: (id) => (id === "sorealIdleBossRespawnV100" ? respawn : id === "sorealIdleBossStartV100" ? start : null), querySelector: (s) => (s.includes(".stop") ? fuite : null) };
const etat = { combatBossActif: false, pvJoueur: 10, bossActuel: "Un Boss", bossPvMax: 100 };
const monde = new Function("document", "idleEtat", "idleNombre_", "idlePopupBloqueCombatV102", "idlePopupActifV75", "idlePopupQueueV75", "fightEnAttenteServeurIdleV1_",
  src + "\nreturn {actualiserCooldownBossIdleV100_,rafraichirCommandesFightBossIdleV167_};")(document, etat, (v) => Number(v) || 0, false, false, [], () => false);
for (let i = 0; i < 50; i += 1) monde.rafraichirCommandesFightBossIdleV167_();
assert.equal(ecritures, 0, "aucune écriture de page quand rien ne change");
// Un vrai changement est bien appliqué, une seule fois.
etat.combatBossActif = true;
monde.rafraichirCommandesFightBossIdleV167_(); monde.rafraichirCommandesFightBossIdleV167_();
assert.equal(start.disabled, true, "Fight grisé pendant le combat");
assert.equal(fuite.disabled, false, "Fuite active pendant le combat");
assert.equal(ecritures, 2, "une écriture par bouton changé, pas une de plus");
// Fight impossible tant que le boss n'est pas affiché (Norman, 2026-10-20) : ni nom ni PV max -> bouton grisé ; boss affiché -> actif.
etat.combatBossActif = false; etat.bossActuel = ""; etat.bossPvMax = 0;
monde.rafraichirCommandesFightBossIdleV167_();
assert.equal(start.disabled, true, "boss pas encore affiché : Fight grisé");
etat.bossActuel = "Un Boss"; etat.bossPvMax = 100;
monde.rafraichirCommandesFightBossIdleV167_();
assert.equal(start.disabled, false, "boss affiché : Fight actif");
const sourceCombat2 = readFileSync(new URL("../public/modules/ui-combat-2-v1.js", import.meta.url), "utf8");
assert.ok(sourceCombat2.includes("!(String(REG.idleEtat.bossActuel||'').trim()&&idleNombre_(REG.idleEtat.bossPvMax)>0))return;"), "le clic / le raccourci sont aussi ignorés tant que le boss n'est pas affiché");
assert.ok(sourceCombat2.includes("!(String(j.bossActuel||'').trim()&&idleNombre_(j.bossPvMax)>0)||"), "le bouton est rendu grisé tant que le boss n'est pas affiché");
console.log("idle-combat-boss-audit-v1: OK");
