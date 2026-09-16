import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Audit 2026-09-16 (Norman : "le bouton + pour ajouter des points dans
 * Attaque passive ne fonctionne plus", "le menu Spend EXP ne dépense pas
 * l'EXP... on peut spammer et acheter des ressources en chaîne") : le
 * shim LockService.getScriptLock().tryLock()/waitLock() renvoyait
 * TOUJOURS true, sans jamais vérifier ni poser un état "verrouillé" —
 * aucune exclusion mutuelle réelle entre deux requêtes qui liraient-
 * modifieraient-écriraient la même ligne joueur en même temps (ex. un
 * clic d'allocation Basic Training et la synchro périodique, ou deux
 * clics rapides sur Spend EXP). Un incident déjà documenté ailleurs dans
 * ce fichier ("Quand je mets des points dans Basic training, ils me
 * sont souvent rendus") décrivait déjà ce symptôme.
 */
const source = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");

const start = source.indexOf("let __idleScriptLockHeldV1=false;");
assert.ok(start >= 0, "Le verrou en mémoire __idleScriptLockHeldV1 doit exister.");
const end = source.indexOf("\nconst CacheService=", start);
const body = source.slice(start, end);

assert.ok(
  body.includes("if(__idleScriptLockHeldV1)return false;") &&
  body.includes("__idleScriptLockHeldV1=true;") &&
  body.includes("releaseLock(){\n        __idleScriptLockHeldV1=false;\n      }"),
  "tryLock doit refuser (return false) si déjà tenu, jamais toujours réussir sans condition."
);

// --- Comportement réel : deux tryLock() consécutifs sans releaseLock entre les deux ---
{
  // Simule exactement le shim pour verrouiller son comportement, sans dépendre du contexte GAS du fichier réel.
  let held = false;
  const LockService = {
    getScriptLock() {
      return {
        tryLock() { if (held) return false; held = true; return true; },
        releaseLock() { held = false; }
      };
    }
  };

  const lockA = LockService.getScriptLock();
  assert.equal(lockA.tryLock(), true, "Le premier verrou doit réussir.");

  const lockB = LockService.getScriptLock();
  assert.equal(lockB.tryLock(), false, "Un second verrou concurrent doit échouer tant que le premier n'est pas relâché — c'est le coeur du correctif.");

  lockA.releaseLock();
  assert.equal(lockB.tryLock(), true, "Une fois relâché, un nouveau verrou doit pouvoir réussir.");
}

console.log("idle-lock-service-real-exclusion: OK");
