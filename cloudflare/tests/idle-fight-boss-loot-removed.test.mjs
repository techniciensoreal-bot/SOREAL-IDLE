import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/*
 * Décision de Norman (2026-09-16) : dans le vrai NGU Idle, l'équipement/
 * loot n'existe QUE dans Adventure Mode -- le combat de boss numéroté
 * (Fight Boss/Basic Training, l'écran Attack/Defense) n'a AUCUN objet
 * équipé dans le vrai jeu. Le système de loot du moteur historique
 * (forge, équipement, sets, collections, bonusPuissance) était une
 * invention SOREAL sans équivalent NGU. Retiré du combat pour une
 * fidélité NGU totale : "je n'ai pas peur de tout casser."
 *
 * Gel propre (pas de migration destructive) : les données existantes
 * (inventaire, équipement, collections déjà complétées) restent en
 * l'état -- seuls les 2 mutateurs live (équiper/fusionner) et les 3
 * sites de génération de loot sont neutralisés, la formule de combat
 * n'utilise plus l'équipement. Rien n'est supprimé côté joueur.
 */
const source = readFileSync("cloudflare/src/idle-sqlite-runtime.js", "utf8");

// --- Formule de combat : plus d'équipement, plus de bonus permanent de sets/collections ---
{
  const start = source.indexOf("function statsCombatPrincipalSorealIdleV413_(");
  const end = source.indexOf("function definitionBossSorealIdle_", start);
  const body = source.slice(start, end);
  assert.ok(body.includes("const multiplicateurPermanent = 1;"), "multiplicateurPermanent doit être figé à 1 (plus de bonus sets/collections).");
  assert.ok(
    !body.includes("profilEquipement.multiplicateurAttaque") &&
    !body.includes("profilEquipement.multiplicateurDefense"),
    "Le multiplicateur d'équipement ne doit plus jamais être lu par le calcul d'attaque/défense."
  );
}

// --- Les 2 mutateurs live (équiper/fusionner) sont désactivés, même patron que les 7 autres ---
for (const fn of ["equiperObjetsSorealIdle", "fusionnerObjetsSorealIdle"]) {
  const start = source.indexOf("function " + fn + "(");
  assert.ok(start >= 0, fn + " introuvable.");
  const end = source.indexOf("\n}", start);
  const body = source.slice(start, end);
  assert.ok(
    body.includes("SOREAL_IDLE_V47_LEGACY_DISABLED"),
    fn + " doit être désactivé avec le même code que les autres mécaniques de loot déjà retirées."
  );
}

// --- Les 3 sites de génération de loot sont coupés à la source ---
{
  const start = source.indexOf("function genererObjetLootSorealIdle_(");
  const end = source.indexOf("\n}", start);
  const body = source.slice(start, end);
  assert.ok(body.includes("return null;"), "genererObjetLootSorealIdle_ ne doit plus jamais générer d'objet (Fight Boss kill drop + auto-adventure offline drops).");
}
{
  const start = source.indexOf("function genererObjetLegendaireRareAventureSorealIdle_(");
  const end = source.indexOf("\n}", start);
  const body = source.slice(start, end);
  assert.ok(body.includes("return null;"), "genererObjetLegendaireRareAventureSorealIdle_ ne doit plus jamais générer d'objet.");
}

/*
 * Audit 2026-09-17 (grand nettoyage) : le code mort qui suivait les
 * deux `return null;` ci-dessus a été supprimé (rareteAleatoireSorealIdle_,
 * lootEligibleSorealIdle_, choisirLootPondereSorealIdle_ n'avaient plus
 * qu'un seul appelant chacun, ce même code mort jamais atteint).
 */
assert.ok(
  !source.includes("function rareteAleatoireSorealIdle_(") &&
  !source.includes("function lootEligibleSorealIdle_(") &&
  !source.includes("function choisirLootPondereSorealIdle_("),
  "Les 3 fonctions devenues orphelines avec le code mort doivent avoir disparu, pas seulement le code mort qui les appelait."
);

console.log("idle-fight-boss-loot-removed: OK");
